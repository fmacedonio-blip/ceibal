"""
Service for generating AI diagnosis for a student.

Uses OpenRouter (Claude) to produce a structured {text, tags} object
based on the student's activity history and submission metrics.
"""
from __future__ import annotations

import json
import os
from typing import Any

import httpx
from sqlalchemy.orm import Session

from app.models import Activity, AiDiagnosis, Student
from app.models.submission import Submission

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
DIAGNOSIS_MODEL = "anthropic/claude-sonnet-4-6"


class InsufficientDataError(ValueError):
    """Raised when the student has no completed activities to analyze."""


def _call_openrouter(prompt: str) -> dict[str, Any]:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise EnvironmentError("OPENROUTER_API_KEY no está definida en las variables de entorno")

    messages = [
        {
            "role": "system",
            "content": (
                "Sos un asistente pedagógico experto en lectoescritura para educación primaria uruguaya. "
                "Analizás el desempeño de alumnos y generás diagnósticos útiles para docentes. "
                "Siempre respondés con JSON válido, sin texto adicional fuera del JSON."
            ),
        },
        {"role": "user", "content": prompt},
    ]

    payload: dict[str, Any] = {
        "model": DIAGNOSIS_MODEL,
        "messages": messages,
        "max_tokens": 1024,
    }

    try:
        response = httpx.post(
            OPENROUTER_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=60.0,
        )
    except httpx.TimeoutException:
        raise RuntimeError("Timeout al llamar a OpenRouter para generar diagnóstico")
    except httpx.RequestError as e:
        raise RuntimeError(f"Error de red al llamar a OpenRouter: {e}")

    if response.status_code != 200:
        raise RuntimeError(
            f"OpenRouter devolvió HTTP {response.status_code}: {response.text}"
        )

    content = response.json()["choices"][0]["message"]["content"]

    # Claude sometimes wraps JSON in markdown code blocks — strip them
    content = content.strip()
    if content.startswith("```"):
        content = content.split("```", 2)[1]
        if content.startswith("json"):
            content = content[4:]
        content = content.rsplit("```", 1)[0].strip()

    return json.loads(content)


def _collect_metrics(student: Student, db: Session) -> dict[str, Any]:
    """Collects all available metrics for the student from activities and submissions."""
    activities = (
        db.query(Activity)
        .filter(Activity.student_id == student.id)
        .order_by(Activity.date.asc())
        .all()
    )

    completed = [a for a in activities if a.status == "COMPLETADA"]

    activity_data = []
    submission_metrics: list[dict] = []

    for a in activities:
        entry: dict[str, Any] = {
            "nombre": a.name,
            "fecha": a.date,
            "tipo": a.type or "desconocido",
            "estado": a.status,
            "puntaje": a.score,
        }
        activity_data.append(entry)

        # Enrich with submission data if available
        if a.submission_id:
            sub = db.query(Submission).filter(Submission.id == a.submission_id).first()
            if sub and sub.status == "processed":
                if sub.submission_type == "handwrite":
                    submission_metrics.append({
                        "actividad": a.name,
                        "tipo": "escritura",
                        "errores_ortografia": sub.spelling_errors,
                        "errores_concordancia": sub.concordance_errors,
                        "errores_total": sub.total_errors,
                    })
                elif sub.submission_type == "audio" and sub.ai_result:
                    ai = sub.ai_result
                    submission_metrics.append({
                        "actividad": a.name,
                        "tipo": "lectura",
                        "ppm": ai.get("ppm"),
                        "precision": ai.get("precision"),
                        "nivel_orientativo": ai.get("nivel_orientativo"),
                        "alertas_fluidez": ai.get("alertas_fluidez", []),
                    })

    scores = [a.score for a in completed if a.score is not None]
    trend = None
    if len(scores) >= 4:
        mid = len(scores) // 2
        avg_first = sum(scores[:mid]) / mid
        avg_last = sum(scores[mid:]) / (len(scores) - mid)
        if avg_last > avg_first + 0.5:
            trend = "mejorando"
        elif avg_last < avg_first - 0.5:
            trend = "bajando"
        else:
            trend = "estable"

    return {
        "nombre": student.name,
        "promedio_general": student.average,
        "tareas_completadas": student.tasks_completed,
        "tareas_total": student.tasks_total,
        "total_actividades_completadas": len(completed),
        "es_primera_actividad": len(completed) == 1,
        "tendencia": trend,
        "actividades": activity_data,
        "metricas_submissions": submission_metrics,
    }


def _build_prompt(metrics: dict[str, Any]) -> str:
    metrics_json = json.dumps(metrics, ensure_ascii=False, indent=2)

    is_first = metrics["es_primera_actividad"]
    progreso_instruccion = (
        "El alumno recién tiene una actividad completada. En la sección RESUMEN no menciones tendencia ni evolución; "
        "podés decir algo como 'estamos comenzando a conocer su desempeño'. "
        "En MEJORAS REALIZADAS indicá que aún no hay suficientes datos para observar cambios."
        if is_first
        else "Podés mencionar tendencia y evolución si los datos lo permiten."
    )

    return f"""Analizá el siguiente perfil de desempeño de un alumno de educación primaria y generá un análisis pedagógico para su docente.

DATOS DEL ALUMNO:
{metrics_json}

INSTRUCCIONES GENERALES:
- Redactá en español rioplatense, tono profesional pero accesible para un docente.
- No inventés datos que no estén en las métricas. Si algo no tiene datos, omitilo.
- {progreso_instruccion}
- Sin títulos, sin bullet points, sin markdown. Solo texto corrido.

El campo "text" debe tener EXACTAMENTE 3 párrafos separados por doble salto de línea, en este orden:

Párrafo 1 — RESUMEN: Síntesis general del desempeño actual: nivel, tendencia, habilidades que estuvo trabajando recientemente. 1 o 2 oraciones.

Párrafo 2 — ERRORES RECURRENTES: Describí los errores o dificultades más frecuentes de forma general, sin mencionar cantidades exactas ni desglosar por tarea. Hablá en términos de patrones o tendencias ("muestra dificultades en...", "se observan errores frecuentes de..."). Priorizá en este orden si hay datos disponibles: adecuación a la consigna, organización textual y coherencia global (macroestructura), gramática y puntuación (microestructura), ortografía, léxico. Solo mencioná las dimensiones con evidencia real. 1 o 2 oraciones.

Párrafo 3 — MEJORAS REALIZADAS: Aspectos positivos o avances concretos observados. Si hay tendencia de mejora, mencionala. 1 o 2 oraciones.

TAGS (chips):
- Generá exactamente 3 chips cortos (máximo 3 palabras cada uno).
- Al menos 1 chip debe señalar un área de mejora o refuerzo.
- Los otros chips deben ser positivos o descriptivos del perfil del alumno.
- Ejemplos: "Escritura creativa", "Ortografía a reforzar", "Lectura fluida", "Macroestructura débil", "Buena adecuación".

Respondé ÚNICAMENTE con este JSON (sin texto adicional):
{{
  "text": "Párrafo resumen.\\n\\nPárrafo errores recurrentes.\\n\\nPárrafo mejoras realizadas.",
  "tags": ["chip1", "chip2", "chip3"]
}}"""


def generate(student_id: int, db: Session) -> dict[str, Any]:
    """
    Generates an AI diagnosis for the student.
    Returns {text, tags}.
    Raises InsufficientDataError if the student has no completed activities.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise ValueError(f"Student {student_id} not found")

    metrics = _collect_metrics(student, db)

    if metrics["total_actividades_completadas"] == 0:
        raise InsufficientDataError(
            "El alumno no tiene actividades completadas para generar un diagnóstico."
        )

    prompt = _build_prompt(metrics)
    result = _call_openrouter(prompt)

    # Validate structure
    if "text" not in result or "tags" not in result:
        raise RuntimeError(f"Respuesta inesperada de la IA: {result}")
    if not isinstance(result["tags"], list) or len(result["tags"]) != 3:
        raise RuntimeError(f"El campo 'tags' debe ser una lista de 3 elementos: {result}")

    return {"text": result["text"], "tags": result["tags"]}

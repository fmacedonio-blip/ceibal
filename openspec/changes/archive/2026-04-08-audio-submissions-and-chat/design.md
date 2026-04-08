## Context

El sistema ya tiene un flujo completo de submissions + chat socrático para handwrite. El audio pipeline produce un `OutputFinalAudio` con estructura diferente: métricas de fluidez lectora (PPM, precisión), errores de tipo `{ palabra_original, lo_que_leyo, tipo }`, y `bloque_alumno`/`bloque_docente` en lugar de `feedback_inicial`/`razonamiento_docente`.

El chat socrático es genérico — trabaja sobre `session_id` sin importar el tipo de submission. La única pieza que necesita saber el tipo es la construcción del system prompt.

## Goals / Non-Goals

**Goals:**
- Persistir análisis de audio con el mismo schema de submissions
- Reusar íntegramente el chat (sesiones, historial, límite de turnos)
- Extender el patrón de abstracción de pipeline a audio_analyze
- Cero cambios en endpoints de chat existentes

**Non-Goals:**
- `audio_pipeline_aws`
- Dashboard con métricas específicas de lectura oral (PPM trends)

---

## Decisions

### 1. `submission_type` como discriminador en la tabla existente

**Decisión**: agregar `submission_type TEXT DEFAULT 'handwrite'` a `submissions`. El `ai_result JSONB` ya almacena el blob completo sin modificar — handwrite guarda `OutputFinal`, audio guarda `OutputFinalAudio`. La columna `submission_type` le dice al `chat_service` qué shape tiene el `ai_result` para construir el system prompt.

**Alternativa descartada**: tablas separadas `handwrite_submissions` / `audio_submissions` — duplica toda la lógica de chat y dashboard innecesariamente.

---

### 2. System prompt socrático para audio — construido desde OutputFinalAudio directamente

**Decisión**: no hay call extra al LLM para generar sugerencias socráticas de audio. El `bloque_alumno` ya es el feedback al alumno. Se construye el system prompt directamente:

```python
AUDIO_SOCRATIC_PROMPT = """
Sos un asistente pedagógico socrático que ayuda a niños de primaria a mejorar su lectura en voz alta.

CONTEXTO DE LA LECTURA DEL ALUMNO:
Texto que debía leer: {texto_original}
Lo que se escuchó: {transcripcion}
Velocidad: {ppm} palabras por minuto
Precisión: {precision}%
Nivel orientativo: {nivel_orientativo}
Errores detectados: {errores_resumidos}
Feedback dado al alumno: {bloque_alumno}

REGLAS ABSOLUTAS:
1. NUNCA des la respuesta correcta directamente
2. SIEMPRE respondé con una pregunta abierta que guíe al alumno a descubrirla
3. Usá lenguaje simple, cálido y alentador, apropiado para niños de 8-12 años
4. Referenciá palabras concretas del texto para que la pregunta sea específica
5. Máximo 2 oraciones por respuesta
6. Si el alumno mejora su respuesta, celebralo y avanzá al siguiente error con otra pregunta
"""
```

`errores_resumidos` = `"; ".join(f"{e['tipo']}: '{e['palabra_original']}' → '{e.get('lo_que_leyo', '[omisión]')}'" for e in errores[:10])`

`texto_original` se guarda en `ai_result` — ver decisión 3.

**Alternativa descartada**: call al LLM para generar sugerencias equivalentes a las de handwrite — costo extra sin beneficio claro, el `bloque_alumno` ya tiene la info relevante.

---

### 3. `texto_original` y `nombre` se guardan en `ai_result`

**Decisión**: el endpoint `analyze-audio` recibe `texto_original` y `nombre` como form fields. Antes de persistir, se inyectan en el dict de `OutputFinalAudio`:

```python
ai_result = output.model_dump()
ai_result["texto_original"] = texto_original
ai_result["nombre"] = nombre
```

Así el `chat_service` puede leer `texto_original` del `ai_result` sin necesitar columnas extra en la tabla.

---

### 4. audio_analyze.py — mismo patrón async que handwrite

```python
async def analyze(audio_bytes, media_type, texto_original, nombre, curso, modelo) -> OutputFinalAudio:
    result = await asyncio.wait_for(
        asyncio.to_thread(_run_sync_pipeline, ...),
        timeout=90.0,  # audio puede tardar más que imagen
    )
    return result
```

Timeout 90s (vs 60s para handwrite) porque los modelos de audio suelen ser más lentos.

---

### 5. persist_result acepta submission_type

```python
async def persist_result(
    db, student_id, teacher_id, class_id, grade, output, submission_type="handwrite"
) -> Submission:
```

Para audio, las métricas planas (`total_errors`, `spelling_errors`, etc.) se calculan mapeando los errores de audio:
- `total_errors` = `len(output.errores)`
- `spelling_errors` = errores con `tipo == "sustitucion"`
- `concordance_errors` = 0 (no aplica para audio)
- `avg_confidence` = `output.precision / 100`
- `requires_review` = `output.calidad_audio_baja`
- `lectura_insuficiente` = `output.calidad_audio_baja`

---

## API Shape

### POST /api/v1/submissions/analyze-audio

```
Request: multipart/form-data
  file         (UploadFile) — audio
  student_id   (UUID)
  class_id     (UUID)
  grade        (int, 3-6)
  texto_original (str)   — el texto que el alumno debía leer
  nombre       (str)     — nombre del alumno
```

```json
// Response 200
{
  "submission_id": "uuid",
  "status": "processed",
  "bloque_alumno": "¡Leíste el texto con buena velocidad!...",
  "nivel_orientativo": "esperado",
  "ppm": 82.5,
  "precision": 94.2,
  "total_errors": 3,
  "requires_review": false
}
```

El detalle completo sigue disponible via `GET /api/v1/submissions/{id}` — mismo endpoint que handwrite.

---

## Risks / Trade-offs

- **[Risk] ai_result shape heterogéneo**: el `chat_service` necesita leer `submission_type` antes de parsear `ai_result`. Si `submission_type` es null (rows viejos), defaultea a `"handwrite"`. → **Mitigation**: `submission_type = row.submission_type or "handwrite"` en chat_service.
- **[Risk] Timeout de audio**: modelos de audio son más lentos. 90s puede no ser suficiente para audios largos. → **Mitigation**: documentar límite recomendado de 2 minutos de audio por submission.
- **[Risk] `nombre` como campo requerido**: el audio pipeline lo necesita pero es raro en una API REST. → **Accepted**: es un requerimiento del pipeline existente, no lo cambiamos.

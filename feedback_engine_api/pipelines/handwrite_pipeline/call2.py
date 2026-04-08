import json
from typing import Any

from json_repair import repair_json

from .client import chat_completion
from .curriculum import get_curriculum_block
from .models import OutputCall1, OutputFinal
from .prompts import SYSTEM_CALL2, build_user_message_call2

REQUIRED_KEYS = {
    "transcripcion",
    "errores_detectados_agrupados",
    "puntos_de_mejora",
    "ambiguedades_lectura",
    "sugerencias_socraticas",
    "feedback_inicial",
    "razonamiento_docente",
}


def generar(
    output_call1: OutputCall1,
    curso: int,
    conocimiento_curricular: dict[str, Any],
    model: str,
    include_response: bool = False,
) -> OutputFinal | tuple[OutputFinal, dict]:
    call1_dict = output_call1.model_dump()
    bloque_curricular = get_curriculum_block(curso, conocimiento_curricular)

    messages = [
        {"role": "system", "content": SYSTEM_CALL2},
        {"role": "user", "content": build_user_message_call2(call1_dict, curso, bloque_curricular)},
    ]

    try:
        response = chat_completion(model, messages, response_format={"type": "json_object"})
    except Exception as e:
        raise RuntimeError(f"Call 2 falló con modelo '{model}': {e}") from e

    raw_content = response["choices"][0]["message"]["content"]

    try:
        data = json.loads(raw_content)
    except json.JSONDecodeError:
        try:
            data = json.loads(repair_json(raw_content))
        except Exception as e:
            raise RuntimeError(f"Call 2 devolvió JSON inválido con modelo '{model}': {e}\nRespuesta: {raw_content[:500]}")

    data.setdefault("lectura_insuficiente", False)
    data.setdefault("errores_detectados_agrupados", [])
    data.setdefault("puntos_de_mejora", [])
    data.setdefault("ambiguedades_lectura", [])
    data.setdefault("sugerencias_socraticas", [])
    data.setdefault("feedback_inicial", "")
    data.setdefault("razonamiento_docente", "")
    missing = REQUIRED_KEYS - data.keys()
    if missing:
        raise RuntimeError(f"Call 2 devolvió JSON incompleto con modelo '{model}'. Faltan claves: {missing}")

    try:
        validated = OutputFinal.model_validate(data)
    except Exception as e:
        raise RuntimeError(f"Call 2 devolvió un JSON que no cumple el schema con modelo '{model}': {e}") from e

    normalized = _ensure_reasoning_mentions_curriculum(_ensure_reasoning_mentions_ambiguity(validated), bloque_curricular)
    if include_response:
        return normalized, response
    return normalized


def get_usage(response: dict) -> dict:
    usage = response.get("usage", {})
    return {
        "tokens_prompt": usage.get("prompt_tokens", 0),
        "tokens_completion": usage.get("completion_tokens", 0),
    }


def _ensure_reasoning_mentions_ambiguity(output: OutputFinal) -> OutputFinal:
    if not output.ambiguedades_lectura:
        return output

    razonamiento = output.razonamiento_docente
    lowered = razonamiento.lower()
    if "ambig" in lowered or "lectura" in lowered:
        return output

    razonamiento = (
        razonamiento.rstrip()
        + " Además, hay fragmentos con lectura ambigua que conviene revisar manualmente antes de confirmar algunas correcciones."
    )
    return output.model_copy(update={"razonamiento_docente": razonamiento})


def _ensure_reasoning_mentions_curriculum(output: OutputFinal, bloque_curricular: dict[str, Any]) -> OutputFinal:
    razonamiento = output.razonamiento_docente
    lowered = razonamiento.lower()
    if "curricular" in lowered or "eje" in lowered or "tramo" in lowered:
        return output

    focos = bloque_curricular.get("focos_docentes", [])
    if not focos:
        return output

    razonamiento = (
        razonamiento.rstrip()
        + f" En este tramo curricular conviene priorizar especialmente {', '.join(focos[:2])}."
    )
    return output.model_copy(update={"razonamiento_docente": razonamiento})

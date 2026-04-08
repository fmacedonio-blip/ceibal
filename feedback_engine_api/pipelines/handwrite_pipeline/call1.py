import json
from typing import Any

from json_repair import repair_json

from .client import build_multimodal_user_content, chat_completion, normalize_image_input, supports_vision
from .curriculum import get_curriculum_block
from .models import ErrorDetectado, ImageInput, OutputCall1
from .prompts import SYSTEM_CALL1, build_call1_prompt_text

AMBIGUITY_THRESHOLD = 0.75


def analizar(
    imagen: ImageInput,
    curso: int,
    conocimiento_curricular: dict[str, Any],
    model: str,
    include_response: bool = False,
) -> OutputCall1 | tuple[OutputCall1, dict]:
    if not supports_vision(model):
        raise ValueError(f"El modelo '{model}' no figura como compatible con visión.")

    bloque_curricular = get_curriculum_block(curso, conocimiento_curricular)
    image_data_url = normalize_image_input(imagen)
    messages = [
        {"role": "system", "content": SYSTEM_CALL1},
        {
            "role": "user",
            "content": build_multimodal_user_content(
                build_call1_prompt_text(curso, bloque_curricular),
                image_data_url,
            ),
        },
    ]

    try:
        response = chat_completion(model, messages, response_format={"type": "json_object"})
    except Exception as e:
        raise RuntimeError(f"Call 1 falló con modelo '{model}': {e}") from e

    raw_content = response["choices"][0]["message"]["content"]

    try:
        data = json.loads(raw_content)
    except json.JSONDecodeError:
        try:
            data = json.loads(repair_json(raw_content))
        except Exception as e:
            raise RuntimeError(f"Call 1 devolvió JSON inválido con modelo '{model}': {e}\nRespuesta: {raw_content[:500]}")

    data.setdefault("transcripcion", "")
    data.setdefault("errores_detectados", [])
    data.setdefault("puntos_de_mejora", [])
    data.setdefault("ambiguedades_lectura", [])
    data.setdefault("lectura_insuficiente", False)

    try:
        validated = OutputCall1.model_validate(data)
    except Exception as e:
        raise RuntimeError(f"Call 1 devolvió un JSON que no cumple el schema con modelo '{model}': {e}") from e

    return _moderate_ambiguous_scores(validated) if not include_response else (_moderate_ambiguous_scores(validated), response)


def get_usage(response: dict) -> dict:
    usage = response.get("usage", {})
    return {
        "tokens_prompt": usage.get("prompt_tokens", 0),
        "tokens_completion": usage.get("completion_tokens", 0),
    }


def _moderate_ambiguous_scores(output: OutputCall1) -> OutputCall1:
    ambiguedades = [item.fragmento.lower() for item in output.ambiguedades_lectura if item.fragmento]
    normalized_errors = []

    for error in output.errores_detectados:
        data = error.model_dump()
        is_ambiguous = data["es_ambigua"] or _matches_ambiguity(error.text, ambiguedades)
        confianza = data.get("confianza_lectura")
        if confianza is not None and confianza < AMBIGUITY_THRESHOLD:
            is_ambiguous = True

        if is_ambiguous:
            data["es_ambigua"] = True
            data["requiere_revision_docente"] = True
            if data.get("confianza_lectura") is None:
                data["confianza_lectura"] = min(output.lectura_global_confianza or 0.6, 0.74)
            if "revis" not in data["explicacion_docente"].lower():
                data["explicacion_docente"] = (
                    "Posible error con lectura ambigua; conviene revisión docente manual. "
                    + data["explicacion_docente"]
                )

        normalized_errors.append(ErrorDetectado.model_validate(data))

    return output.model_copy(update={"errores_detectados": normalized_errors})


def _matches_ambiguity(error_text: str, ambiguities: list[str]) -> bool:
    lowered = error_text.lower()
    return any(fragment and fragment in lowered for fragment in ambiguities)

import json

from json_repair import repair_json

from app.pipelines.audio_pipeline.client import build_audio_user_content, chat_completion, supports_audio
from app.pipelines.audio_pipeline.models import OutputCall1Audio
from app.pipelines.audio_pipeline.prompts import SYSTEM_CALL1, build_call1_prompt


def analizar(
    audio_bytes: bytes,
    media_type: str,
    texto_original: str,
    nombre: str,
    curso: int,
    model: str,
    duracion_seg: float,
) -> OutputCall1Audio:
    if not supports_audio(model):
        raise ValueError(f"El modelo '{model}' no figura como compatible con audio.")

    prompt_text = build_call1_prompt(texto_original, nombre, curso, duracion_seg)
    messages = [
        {"role": "system", "content": SYSTEM_CALL1},
        {
            "role": "user",
            "content": build_audio_user_content(prompt_text, audio_bytes, media_type),
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
            raise RuntimeError(
                f"Call 1 devolvió JSON inválido con modelo '{model}': {e}\nRespuesta: {raw_content[:500]}"
            )

    data.setdefault("transcripcion", "")
    data.setdefault("duracion_estimada_seg", 1.0)
    data.setdefault("palabras_texto_original", 0)
    data.setdefault("palabras_correctas", 0)
    data.setdefault("ppm", 0.0)
    data.setdefault("precision", 0.0)
    data.setdefault("errores", [])
    data.setdefault("alertas_fluidez", [])
    data.setdefault("calidad_audio_baja", False)
    data.setdefault("notas_calidad", "")
    data.setdefault("texto_no_relacionado", False)

    try:
        return OutputCall1Audio.model_validate(data)
    except Exception as e:
        raise RuntimeError(
            f"Call 1 devolvió un JSON que no cumple el schema con modelo '{model}': {e}"
        ) from e

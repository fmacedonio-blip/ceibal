import json
import logging

from json_repair import repair_json

from app.config import settings
from app.pipelines.handwrite_pipeline_aws.session import GatewaySession
from app.pipelines.audio_pipeline.models import OutputCall1Audio
from app.pipelines.audio_pipeline_aws.prompts import SYSTEM_CALL1, build_call1_prompt

logger = logging.getLogger(__name__)

DEFAULT_METADATA = {
    "agent_max_tokens": 8192,
    "agent_temperature": 0.2,
    "response_format": {"type": "json_object"},
}

_MIME_TO_FORMAT = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/x-wav": "wav",
    "audio/mp4": "mp4",
    "audio/m4a": "mp4",
    "audio/x-m4a": "mp4",
    "audio/ogg": "ogg",
    "audio/webm": "webm",
}


def analizar(
    session: GatewaySession,
    s3_key: str,
    media_type: str,
    texto_original: str,
    nombre: str,
    curso: int,
    duracion_seg: float,
) -> OutputCall1Audio:
    """
    First gateway call: audio transcription + reading metrics.

    Sends the audio via S3 attachment to the gateway-ai.
    Returns OutputCall1Audio with PPM, precision, errors, fluency alerts.
    """
    fmt = _MIME_TO_FORMAT.get(media_type, "mp3")

    attachment = {
        "type": "audio",
        "format": fmt,
        "s3_bucket": settings.s3_bucket_handwrite,
        "s3_key": s3_key,
    }

    prompt_text = build_call1_prompt(texto_original, nombre, curso, duracion_seg)

    logger.info("Call 1 audio | modelo=%s s3_key=%s fmt=%s", session.model, s3_key, fmt)

    try:
        raw = session.send(
            user_content=prompt_text,
            system_prompt=SYSTEM_CALL1,
            metadata=DEFAULT_METADATA,
            attachment=attachment,
        )
    except Exception as e:
        raise RuntimeError(f"Call 1 audio falló con modelo '{session.model}': {e}") from e

    logger.info("Call 1 audio raw (%d chars): %s", len(raw), raw[:200])

    stripped = raw.strip()
    if stripped.startswith("```"):
        stripped = "\n".join(l for l in stripped.splitlines() if not l.strip().startswith("```")).strip()

    if not stripped.startswith("{"):
        raise RuntimeError(
            f"Call 1 audio: el modelo no procesó el audio S3 (modelo '{session.model}'). "
            f"Respuesta: {raw[:400]}"
        )

    try:
        data = json.loads(stripped)
    except json.JSONDecodeError:
        try:
            data = json.loads(repair_json(stripped))
        except Exception as e:
            raise RuntimeError(
                f"Call 1 audio: JSON inválido con modelo '{session.model}'.\n"
                f"Error: {e}\nRespuesta ({len(raw)} chars): {raw[:800]}"
            ) from e

    data.setdefault("transcripcion", "")
    data.setdefault("duracion_estimada_seg", duracion_seg)
    data.setdefault("palabras_texto_original", 0)
    data.setdefault("palabras_correctas", 0)
    data.setdefault("ppm", 0.0)
    data.setdefault("precision", 0.0)
    data.setdefault("errores", [])
    data.setdefault("alertas_fluidez", [])
    data.setdefault("aspectos_positivos_verificados", [])
    data.setdefault("calidad_audio_baja", False)
    data.setdefault("notas_calidad", "")

    try:
        return OutputCall1Audio.model_validate(data)
    except Exception as e:
        raise RuntimeError(
            f"Call 1 audio schema inválido para modelo '{session.model}': {e}"
        ) from e

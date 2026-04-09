import logging

from app.pipelines.audio_pipeline.client import get_audio_duration_sec
from app.pipelines.audio_pipeline.models import OutputFinalAudio
from app.pipelines.audio_pipeline_aws import call1, call2
from app.pipelines.handwrite_pipeline_aws.session import GatewaySession

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gemini-3.1"


def run(
    audio_bytes: bytes,
    media_type: str,
    texto_original: str,
    nombre: str,
    curso: int,
    model: str = DEFAULT_MODEL,
    *,
    s3_key: str,
    duracion_seg: float | None = None,
) -> tuple[OutputFinalAudio, GatewaySession]:
    """
    Main entry point for the AWS audio analysis pipeline.

    Uploads the audio to S3 via gateway-file (done by the caller), then uses
    the s3_key as an attachment for the gateway-ai calls.

    Returns (OutputFinalAudio, GatewaySession) — the session can be reused
    to continue the conversation (student chat).
    """
    if duracion_seg is None:
        try:
            duracion_seg = get_audio_duration_sec(audio_bytes, media_type)
        except (ValueError, RuntimeError) as e:
            logger.warning("No se pudo extraer duración (%s): %s. El modelo estimará.", media_type, e)
            duracion_seg = 0.0

    session = GatewaySession(model=model)

    result1 = call1.analizar(session, s3_key, media_type, texto_original, nombre, curso, duracion_seg)

    if not (5 <= result1.ppm <= 350):
        raise ValueError(
            f"PPM fuera de rango plausible ({result1.ppm:.1f}). "
            "Verificá que el audio corresponda al texto original."
        )
    if result1.palabras_texto_original > 0 and len(result1.errores) > result1.palabras_texto_original:
        raise ValueError(
            f"El modelo detectó más errores ({len(result1.errores)}) "
            f"que palabras en el texto original ({result1.palabras_texto_original})."
        )

    output = call2.generar(session, result1, texto_original, nombre, curso)
    return output, session

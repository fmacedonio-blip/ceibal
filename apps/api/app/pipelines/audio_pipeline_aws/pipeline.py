from app.pipelines.audio_pipeline.client import get_audio_duration_sec
from app.pipelines.audio_pipeline.models import OutputFinalAudio
from app.pipelines.audio_pipeline_aws import call1, call2
from app.pipelines.handwrite_pipeline_aws.session import GatewaySession

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
) -> tuple[OutputFinalAudio, GatewaySession]:
    """
    Main entry point for the AWS audio analysis pipeline.

    Uploads the audio to S3 via gateway-file (done by the caller), then uses
    the s3_key as an attachment for the gateway-ai calls.

    Returns (OutputFinalAudio, GatewaySession) — the session can be reused
    to continue the conversation (student chat).
    """
    duracion_seg = get_audio_duration_sec(audio_bytes, media_type)

    session = GatewaySession(model=model)

    result1 = call1.analizar(session, s3_key, media_type, texto_original, nombre, curso, duracion_seg)

    if not (5 <= result1.ppm <= 350):
        raise RuntimeError(
            f"PPM fuera de rango plausible ({result1.ppm:.1f}). "
            "Revisá que el audio y el texto original correspondan."
        )
    if result1.palabras_texto_original > 0 and len(result1.errores) > result1.palabras_texto_original:
        raise RuntimeError(
            f"El modelo detectó más errores ({len(result1.errores)}) "
            f"que palabras en el texto original ({result1.palabras_texto_original})."
        )

    output = call2.generar(session, result1, texto_original, nombre, curso)
    return output, session

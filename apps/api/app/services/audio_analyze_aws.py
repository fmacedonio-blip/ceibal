import asyncio

from app.pipelines.audio_pipeline.models import OutputFinalAudio
from app.pipelines.audio_pipeline_aws import pipeline as _pipeline
from app.pipelines.audio_pipeline_aws.pipeline import DEFAULT_MODEL
from app.pipelines.handwrite_pipeline_aws.session import GatewaySession


class AudioAnalyzeAwsError(ValueError):
    pass


def _run_sync(
    audio_bytes: bytes,
    media_type: str,
    texto_original: str,
    nombre: str,
    curso: int,
    modelo: str,
    s3_key: str,
) -> tuple[OutputFinalAudio, GatewaySession]:
    try:
        return _pipeline.run(
            audio_bytes=audio_bytes,
            media_type=media_type,
            texto_original=texto_original,
            nombre=nombre,
            curso=curso,
            model=modelo,
            s3_key=s3_key,
        )
    except (EnvironmentError, RuntimeError):
        raise
    except ValueError as exc:
        raise AudioAnalyzeAwsError(str(exc)) from exc


async def analyze(
    audio_bytes: bytes,
    media_type: str,
    texto_original: str,
    nombre: str,
    curso: int,
    modelo: str = DEFAULT_MODEL,
    s3_key: str | None = None,
) -> tuple[OutputFinalAudio, GatewaySession]:
    """
    Async wrapper around the AWS audio pipeline.

    Returns (OutputFinalAudio, GatewaySession). The session can be reused
    for student chat continuations.
    """
    if s3_key is None:
        raise AudioAnalyzeAwsError("s3_key es requerido para el pipeline AWS de audio")

    try:
        return await asyncio.wait_for(
            asyncio.to_thread(
                _run_sync, audio_bytes, media_type, texto_original, nombre, curso, modelo, s3_key
            ),
            timeout=120.0,
        )
    except asyncio.TimeoutError:
        raise AudioAnalyzeAwsError("Audio AWS pipeline timed out after 120 seconds")

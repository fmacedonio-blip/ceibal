import asyncio
import logging

from app.config import settings
from app.pipelines.audio_pipeline.models import OutputFinalAudio

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "xiaomi/mimo-v2-omni"


class AudioAnalyzeError(Exception):
    pass


def _run_sync_pipeline(
    audio_bytes: bytes,
    media_type: str,
    texto_original: str,
    nombre: str,
    curso: int,
    model: str,
) -> OutputFinalAudio:
    if settings.audio_pipeline == "aws":
        raise NotImplementedError("audio_pipeline_aws is not yet implemented")

    from app.pipelines.audio_pipeline import pipeline
    return pipeline.run(
        audio_bytes=audio_bytes,
        media_type=media_type,
        texto_original=texto_original,
        nombre=nombre,
        curso=curso,
        model=model,
    )


async def analyze(
    audio_bytes: bytes,
    media_type: str,
    texto_original: str,
    nombre: str,
    curso: int,
    model: str = DEFAULT_MODEL,
) -> OutputFinalAudio:
    """Async wrapper around the audio pipeline. Pipeline implementation
    is selected via settings.audio_pipeline ('openrouter' | 'aws').
    The signature of this function is stable — routers must not import
    pipeline modules directly."""
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(_run_sync_pipeline, audio_bytes, media_type, texto_original, nombre, curso, model),
            timeout=90.0,
        )
        return result
    except asyncio.TimeoutError:
        raise AudioAnalyzeError("Audio pipeline timed out after 90 seconds")
    except NotImplementedError:
        raise
    except ValueError as exc:
        raise AudioAnalyzeError(str(exc)) from exc

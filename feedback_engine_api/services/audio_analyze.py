import logging

from pipelines.audio_pipeline import pipeline
from pipelines.audio_pipeline.models import OutputFinalAudio

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "xiaomi/mimo-v2-omni"


class AudioAnalyzeError(Exception):
    pass


def analyze(
    audio_bytes: bytes,
    media_type: str,
    texto_original: str,
    nombre: str,
    curso: int,
    model: str = DEFAULT_MODEL,
) -> OutputFinalAudio:
    try:
        return pipeline.run(
            audio_bytes=audio_bytes,
            media_type=media_type,
            texto_original=texto_original,
            nombre=nombre,
            curso=curso,
            model=model,
        )
    except ValueError as e:
        raise AudioAnalyzeError(str(e)) from e

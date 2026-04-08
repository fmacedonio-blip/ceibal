import json
from pathlib import Path

from app.pipelines.handwrite_pipeline import pipeline as _pipeline
from app.pipelines.handwrite_pipeline.models import OutputFinal

DEFAULT_MODEL = "google/gemini-3.1-flash-lite-preview"

_CONOCIMIENTO_PATH = Path(__file__).parent.parent / "pipelines" / "handwrite_pipeline" / "conocimiento_esperado.json"
_conocimiento_curricular: dict | None = None


def _get_conocimiento() -> dict:
    global _conocimiento_curricular
    if _conocimiento_curricular is None:
        _conocimiento_curricular = json.loads(_CONOCIMIENTO_PATH.read_text(encoding="utf-8"))
    return _conocimiento_curricular


class HandwriteAnalyzeError(ValueError):
    pass


def analyze(imagen_bytes: bytes, media_type: str, curso: int, modelo: str = DEFAULT_MODEL) -> OutputFinal:
    try:
        return _pipeline.run(
            imagen=imagen_bytes,
            image_media_type=media_type,
            curso=curso,
            conocimiento_curricular=_get_conocimiento(),
            model=modelo,
        )
    except ValueError as exc:
        raise HandwriteAnalyzeError(str(exc)) from exc

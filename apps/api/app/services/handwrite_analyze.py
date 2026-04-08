from __future__ import annotations

import asyncio
import json
from pathlib import Path

from app.config import settings
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


def _run_sync_pipeline(imagen_bytes: bytes, media_type: str, curso: int, modelo: str) -> OutputFinal:
    if settings.handwrite_pipeline == "aws":
        # Future: import and call handwrite_pipeline_aws
        raise NotImplementedError("handwrite_pipeline_aws is not yet implemented")

    from app.pipelines.handwrite_pipeline import pipeline as _pipeline
    return _pipeline.run(
        imagen=imagen_bytes,
        image_media_type=media_type,
        curso=curso,
        conocimiento_curricular=_get_conocimiento(),
        model=modelo,
    )


async def analyze(imagen_bytes: bytes, media_type: str, curso: int, modelo: str = DEFAULT_MODEL) -> OutputFinal:
    """Async wrapper around the handwrite pipeline. Pipeline implementation
    is selected via settings.handwrite_pipeline ('openrouter' | 'aws').
    The signature of this function is stable — routers and services must not
    import pipeline modules directly."""
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(_run_sync_pipeline, imagen_bytes, media_type, curso, modelo),
            timeout=60.0,
        )
        return result
    except asyncio.TimeoutError:
        raise HandwriteAnalyzeError("Pipeline timed out after 60 seconds")
    except NotImplementedError:
        raise
    except ValueError as exc:
        raise HandwriteAnalyzeError(str(exc)) from exc

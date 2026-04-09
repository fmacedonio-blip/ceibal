import asyncio
import json
from pathlib import Path

from app.pipelines.handwrite_pipeline_aws.models import OutputFinal
from app.pipelines.handwrite_pipeline_aws import pipeline as _pipeline
from app.pipelines.handwrite_pipeline_aws.pipeline import DEFAULT_MODEL
from app.pipelines.handwrite_pipeline_aws.session import GatewaySession

_CONOCIMIENTO_PATH = (
    Path(__file__).parent.parent / "pipelines" / "handwrite_pipeline" / "conocimiento_esperado.json"
)
_conocimiento_curricular: dict | None = None


def _get_conocimiento() -> dict:
    global _conocimiento_curricular
    if _conocimiento_curricular is None:
        _conocimiento_curricular = json.loads(_CONOCIMIENTO_PATH.read_text(encoding="utf-8"))
    return _conocimiento_curricular


class HandwriteAnalyzeAwsError(ValueError):
    pass


def _run_sync(
    image_bytes: bytes,
    media_type: str,
    curso: int,
    modelo: str,
    s3_key: str,
    s3_url: str | None,
    user_profile: list[str] | None,
    request_id: str | None,
    consigna: str | None = None,
    evaluation_criteria: str | None = None,
) -> tuple[OutputFinal, GatewaySession]:
    try:
        return _pipeline.run(
            image_bytes=image_bytes,
            media_type=media_type,
            curso=curso,
            conocimiento_curricular=_get_conocimiento(),
            model=modelo,
            s3_key=s3_key,
            s3_url=s3_url,
            user_profile=user_profile,
            request_id=request_id,
            consigna=consigna,
            evaluation_criteria=evaluation_criteria,
        )
    except (EnvironmentError, RuntimeError):
        raise
    except ValueError as exc:
        raise HandwriteAnalyzeAwsError(str(exc)) from exc


async def analyze(
    image_bytes: bytes,
    media_type: str,
    curso: int,
    modelo: str = DEFAULT_MODEL,
    s3_key: str | None = None,
    s3_url: str | None = None,
    user_profile: list[str] | None = None,
    request_id: str | None = None,
    consigna: str | None = None,
    evaluation_criteria: str | None = None,
) -> tuple[OutputFinal, GatewaySession]:
    """
    Async wrapper around the AWS handwrite pipeline.

    The caller receives both the OutputFinal and the GatewaySession.
    The session can be reused to continue the conversation (e.g. student chat).
    OCR is performed via the gateway-ai using the S3 image reference.
    """
    if s3_key is None:
        raise HandwriteAnalyzeAwsError("s3_key es requerido para el pipeline AWS")

    try:
        return await asyncio.wait_for(
            asyncio.to_thread(
                _run_sync, image_bytes, media_type, curso, modelo, s3_key, s3_url, user_profile, request_id,
                consigna, evaluation_criteria,
            ),
            timeout=90.0,
        )
    except asyncio.TimeoutError:
        raise HandwriteAnalyzeAwsError("Pipeline AWS timed out after 90 seconds")

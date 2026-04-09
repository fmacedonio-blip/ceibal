import json
import logging
from typing import Any

from json_repair import repair_json

from app.config import settings
from app.pipelines.handwrite_pipeline_aws.curriculum import get_curriculum_block
from app.pipelines.handwrite_pipeline_aws.models import OutputCall1, OutputFinal
from app.pipelines.handwrite_pipeline_aws.session import GatewaySession
from app.pipelines.handwrite_pipeline.prompts import (
    SYSTEM_CALL1,
    SYSTEM_CALL2,
    build_call1_prompt_text,
    build_user_message_call2,
)

logger = logging.getLogger(__name__)

DEFAULT_METADATA = {
    "agent_max_tokens": 8192,
    "agent_temperature": 0.2,
    "response_format": {"type": "json_object"},
}

REQUIRED_KEYS_CALL1 = {"transcripcion", "errores_detectados", "puntos_de_mejora", "ambiguedades_lectura"}
REQUIRED_KEYS_CALL2 = {
    "transcripcion", "errores_detectados_agrupados", "puntos_de_mejora",
    "ambiguedades_lectura", "sugerencias_socraticas", "feedback_inicial", "razonamiento_docente",
}

def _strip_fences(raw: str) -> str:
    """Strip markdown code fences, return the inner content."""
    stripped = raw.strip()
    if stripped.startswith("```"):
        lines = stripped.splitlines()
        stripped = "\n".join(l for l in lines if not l.strip().startswith("```")).strip()
    return stripped


def _looks_like_json(raw: str) -> bool:
    """True if the response appears to be JSON (starts with { after stripping fences)."""
    return _strip_fences(raw).startswith("{")


def _parse_json(raw: str, call_name: str, model: str) -> dict:
    if not raw or not raw.strip():
        raise RuntimeError(f"{call_name}: el gateway devolvió una respuesta vacía (modelo '{model}')")

    stripped = _strip_fences(raw)

    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass

    try:
        return json.loads(repair_json(stripped))
    except Exception as e:
        raise RuntimeError(
            f"{call_name}: JSON inválido con modelo '{model}'.\n"
            f"Error: {e}\n"
            f"Respuesta ({len(raw)} chars): {raw[:800]}"
        ) from e


def call1(
    session: GatewaySession,
    s3_key: str,
    s3_url: str | None,
    media_type: str,
    curso: int,
    conocimiento_curricular: dict[str, Any],
) -> OutputCall1:
    """
    First gateway call: OCR + error detection via S3 attachment.

    Sends the image reference to the gateway-ai using the S3 attachment mechanism.
    Returns OutputCall1 (raw errors, not yet grouped).
    """
    bloque_curricular = get_curriculum_block(curso, conocimiento_curricular)

    fmt = media_type.split("/")[-1]
    if fmt == "jpg":
        fmt = "jpeg"

    attachment = {
        "type": "image",
        "format": fmt,
        "s3_bucket": settings.s3_bucket_handwrite,
        "s3_key": s3_key,
    }

    logger.info("Call 1 | modelo=%s s3_key=%s bucket=%s", session.model, s3_key, settings.s3_bucket_handwrite)

    try:
        raw = session.send(
            user_content=build_call1_prompt_text(curso, bloque_curricular),
            system_prompt=SYSTEM_CALL1,
            metadata=DEFAULT_METADATA,
            attachment=attachment,
        )
    except Exception as e:
        raise RuntimeError(f"Call 1 falló con modelo '{session.model}': {e}") from e

    logger.info("Call 1 raw (%d chars): %s", len(raw), raw[:200])

    if not _looks_like_json(raw):
        raise RuntimeError(
            f"Call 1: el modelo no procesó la imagen S3 (modelo '{session.model}'). "
            f"Respuesta: {raw[:400]}"
        )

    data = _parse_json(raw, "Call 1", session.model)

    data.setdefault("transcripcion", "")
    data.setdefault("errores_detectados", [])
    data.setdefault("puntos_de_mejora", [])
    data.setdefault("ambiguedades_lectura", [])
    data.setdefault("lectura_insuficiente", False)

    missing = REQUIRED_KEYS_CALL1 - data.keys()
    if missing:
        raise RuntimeError(
            f"Call 1 JSON incompleto para modelo '{session.model}'. "
            f"Faltan: {missing}. Keys recibidas: {list(data.keys())}"
        )

    try:
        return OutputCall1.model_validate(data)
    except Exception as e:
        raise RuntimeError(
            f"Call 1 schema inválido para modelo '{session.model}': {e}"
        ) from e


def call2(
    session: GatewaySession,
    output_call1: OutputCall1,
    curso: int,
    conocimiento_curricular: dict[str, Any],
) -> OutputFinal:
    """
    Second gateway call: group errors + generate pedagogical feedback.

    Uses SYSTEM_CALL2 with the output from call1 as context (via message history).
    Returns the final OutputFinal with grouped errors and teacher/student feedback.
    """
    bloque_curricular = get_curriculum_block(curso, conocimiento_curricular)
    user_content = build_user_message_call2(output_call1.model_dump(), curso, bloque_curricular)

    logger.info("Call 2 | modelo=%s errores_call1=%d", session.model, len(output_call1.errores_detectados))

    try:
        raw = session.send(
            user_content=user_content,
            system_prompt=SYSTEM_CALL2,
            metadata=DEFAULT_METADATA,
        )
    except Exception as e:
        raise RuntimeError(f"Call 2 falló con modelo '{session.model}': {e}") from e

    logger.info("Call 2 respuesta raw (%d chars): %s", len(raw), raw[:200])

    data = _parse_json(raw, "Call 2", session.model)

    data.setdefault("lectura_insuficiente", False)
    data.setdefault("errores_detectados_agrupados", [])
    data.setdefault("puntos_de_mejora", [])
    data.setdefault("ambiguedades_lectura", [])
    data.setdefault("sugerencias_socraticas", [])
    data.setdefault("feedback_inicial", "")
    data.setdefault("razonamiento_docente", "")

    missing = REQUIRED_KEYS_CALL2 - data.keys()
    if missing:
        raise RuntimeError(
            f"Call 2 JSON incompleto para modelo '{session.model}'. "
            f"Faltan: {missing}. Keys recibidas: {list(data.keys())}"
        )

    try:
        return OutputFinal.model_validate(data)
    except Exception as e:
        raise RuntimeError(
            f"Call 2 schema inválido para modelo '{session.model}': {e}"
        ) from e

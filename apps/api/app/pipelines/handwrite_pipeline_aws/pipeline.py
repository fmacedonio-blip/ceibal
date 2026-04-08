from typing import Any

from app.pipelines.handwrite_pipeline_aws.call import call1, call2
from app.pipelines.handwrite_pipeline_aws.curriculum import get_curriculum_block, validate_course
from app.pipelines.handwrite_pipeline_aws.models import ErrorDetectadoAgrupado, OutputFinal
from app.pipelines.handwrite_pipeline_aws.session import GatewaySession

DEFAULT_MODEL = "claude-sonnet-4-6"
AMBIGUITY_THRESHOLD = 0.75


def run(
    image_bytes: bytes,
    media_type: str,
    curso: int,
    conocimiento_curricular: dict[str, Any],
    model: str = DEFAULT_MODEL,
    *,
    s3_key: str,
    s3_url: str | None = None,
    user_profile: list[str] | None = None,
    request_id: str | None = None,
) -> tuple[OutputFinal, GatewaySession]:
    """
    Main entry point for the AWS handwriting analysis pipeline.

    Uploads the image to S3 via gateway-file, then uses the s3_key/s3_url as an
    image reference in gateway-ai calls.

    Args:
        image_bytes: Raw image bytes (kept in signature for compatibility).
        media_type: MIME type (e.g. image/jpeg).
        curso: School grade (3–6).
        conocimiento_curricular: Curriculum knowledge dict.
        model: Gateway model ID (default: gemini-3.1).
        s3_key: S3 object key returned by the gateway-file upload.
        s3_url: Full S3 URI returned by gateway-file (e.g. s3://bucket/key). Used as image_url.
        user_profile: Optional student profile strings for the gateway.
        request_id: Optional tracing ID propagated to gateway metadata.
    """
    validate_course(curso)

    session = GatewaySession(model=model, user_profile=user_profile, request_id=request_id)

    output_call1 = call1(session, s3_key, s3_url, media_type, curso, conocimiento_curricular)

    if output_call1.lectura_insuficiente:
        return OutputFinal(
            transcripcion=output_call1.transcripcion,
            errores_detectados_agrupados=[],
            puntos_de_mejora=output_call1.puntos_de_mejora,
            ambiguedades_lectura=output_call1.ambiguedades_lectura,
            sugerencias_socraticas=[],
            feedback_inicial="",
            razonamiento_docente="",
            lectura_insuficiente=True,
        ), session

    output = call2(session, output_call1, curso, conocimiento_curricular)

    if output.lectura_insuficiente:
        return output, session

    output = _moderate_ambiguous_scores(output)
    output = _enrich_reasoning_with_curriculum(output, curso, conocimiento_curricular)

    return output, session


# ------------------------------------------------------------------
# Python post-processing (no LLM calls)
# ------------------------------------------------------------------

def _moderate_ambiguous_scores(output: OutputFinal) -> OutputFinal:
    """
    Flag errors as ambiguous when confianza_lectura < threshold or when the
    error text appears in the ambiguedades_lectura list.
    """
    ambiguedades = [item.fragmento.lower() for item in output.ambiguedades_lectura if item.fragmento]
    normalized = []

    for error in output.errores_detectados_agrupados:
        data = error.model_dump()
        is_ambiguous = data["es_ambigua"] or _matches_ambiguity(error.text, ambiguedades)
        confianza = data.get("confianza_lectura")
        if confianza is not None and confianza < AMBIGUITY_THRESHOLD:
            is_ambiguous = True

        if is_ambiguous:
            data["es_ambigua"] = True
            data["requiere_revision_docente"] = True
            if data.get("confianza_lectura") is None:
                data["confianza_lectura"] = min(0.74, confianza or 0.6)
            if "revis" not in data["explicacion_docente"].lower():
                data["explicacion_docente"] = (
                    "Posible error con lectura ambigua; conviene revisión docente manual. "
                    + data["explicacion_docente"]
                )

        normalized.append(ErrorDetectadoAgrupado.model_validate(data))

    return output.model_copy(update={"errores_detectados_agrupados": normalized})


def _enrich_reasoning_with_curriculum(
    output: OutputFinal,
    curso: int,
    conocimiento_curricular: dict[str, Any],
) -> OutputFinal:
    """
    Append curriculum focus areas to razonamiento_docente if the model didn't mention them.
    """
    razonamiento = output.razonamiento_docente
    lowered = razonamiento.lower()
    if "curricular" in lowered or "eje" in lowered or "tramo" in lowered:
        return output

    bloque = get_curriculum_block(curso, conocimiento_curricular)
    focos = bloque.get("focos_docentes", [])
    if not focos:
        return output

    razonamiento = (
        razonamiento.rstrip()
        + f" En este tramo curricular conviene priorizar especialmente {', '.join(focos[:2])}."
    )
    return output.model_copy(update={"razonamiento_docente": razonamiento})


def _matches_ambiguity(error_text: str, ambiguities: list[str]) -> bool:
    lowered = error_text.lower()
    return any(fragment and fragment in lowered for fragment in ambiguities)

import logging
import re
import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.pipelines.handwrite_pipeline.models import OutputFinal
from app.pipelines.handwrite_pipeline_aws.pipeline import DEFAULT_MODEL
from app.pipelines.handwrite_pipeline_aws.s3_client import upload_image
from app.services.handwrite_analyze_aws import HandwriteAnalyzeAwsError, analyze

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
SUPPORTED_COURSES = {3, 4, 5, 6}

router = APIRouter(prefix="/handwrite-analyze-aws", tags=["handwrite-analyze-aws"])


def _build_transcripcion_html(transcripcion: str, errores: list) -> str:
    if not transcripcion or not errores:
        return transcripcion
    sorted_errors = sorted(errores, key=lambda e: len(e.text), reverse=True)
    result = transcripcion
    for error in sorted_errors:
        word = re.escape(error.text)
        msg = (error.correccion_alumno or error.explicacion_pedagogica).replace('"', "&quot;")
        tag = f'<error msg="{msg}">{error.text}</error>'
        result = re.sub(rf'\b{word}\b', tag, result, flags=re.IGNORECASE)
    return result


@router.post("/", response_model=OutputFinal)
async def handwrite_analyze_aws(
    imagen: UploadFile = File(...),
    curso: int = Form(...),
    modelo: str = Form(DEFAULT_MODEL),
) -> OutputFinal:
    """
    Analyze a handwritten student image via the Ceibal AI Gateway (Gemini 3.1).

    Accepts the image directly and sends it as base64 to the gateway for OCR
    and full pedagogical analysis.
    """
    if curso not in SUPPORTED_COURSES:
        raise HTTPException(
            status_code=400,
            detail=f"Curso inválido: {curso}. Valores permitidos: {sorted(SUPPORTED_COURSES)}",
        )

    if imagen.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Tipo de archivo no soportado: '{imagen.content_type}'. Usar: {sorted(ALLOWED_CONTENT_TYPES)}",
        )

    image_bytes = await imagen.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="El archivo de imagen está vacío.")

    request_id = str(uuid.uuid4())
    logger.info(
        "Request recibido | archivo=%s curso=%d modelo=%s tamaño=%d request_id=%s",
        imagen.filename, curso, modelo, len(image_bytes), request_id,
    )

    # S3 upload — hard fail: el s3_key/s3_url son necesarios para la llamada al gateway-ai.
    try:
        s3_key, s3_url = upload_image(
            image_bytes, imagen.content_type, filename=imagen.filename or "image.jpg"
        )
        logger.info(
            "Imagen guardada en S3 | s3_key=%s s3_url=%s request_id=%s",
            s3_key, s3_url, request_id,
        )
    except EnvironmentError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    try:
        result, _session = await analyze(
            image_bytes=image_bytes,
            media_type=imagen.content_type,
            curso=curso,
            modelo=modelo,
            s3_key=s3_key,
            s3_url=s3_url,
            request_id=request_id,
        )
        logger.info(
            "Análisis completado | curso=%d errores=%d lectura_insuficiente=%s",
            curso,
            len(result.errores_detectados_agrupados),
            result.lectura_insuficiente,
        )
        transcripcion_html = _build_transcripcion_html(
            result.transcripcion, result.errores_detectados_agrupados
        )
        return result.model_copy(update={"transcripcion_html": transcripcion_html})

    except HandwriteAnalyzeAwsError as exc:
        logger.warning("Error de validación: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except EnvironmentError as exc:
        logger.error("Configuración faltante: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        # Includes S3 download errors and gateway errors
        logger.error("Error en pipeline AWS: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Error inesperado en el pipeline AWS")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.pipelines.handwrite_pipeline.models import OutputFinal
from app.services.handwrite_analyze import DEFAULT_MODEL, HandwriteAnalyzeError, analyze

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
SUPPORTED_COURSES = {3, 4, 5, 6}

router = APIRouter(prefix="/handwrite-analyze", tags=["handwrite-analyze"])


@router.post("/", response_model=OutputFinal)
async def handwrite_analyze(
    imagen: UploadFile = File(...),
    curso: int = Form(...),
    modelo: str = Form(DEFAULT_MODEL),
) -> OutputFinal:
    logger.info("Request recibido | curso=%d modelo=%s archivo=%s", curso, modelo, imagen.filename)

    if curso not in SUPPORTED_COURSES:
        raise HTTPException(status_code=400, detail=f"Curso inválido: {curso}. Valores permitidos: {sorted(SUPPORTED_COURSES)}")

    if imagen.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail=f"Tipo de archivo no soportado: '{imagen.content_type}'. Usar: {sorted(ALLOWED_CONTENT_TYPES)}")

    imagen_bytes = await imagen.read()

    if len(imagen_bytes) == 0:
        raise HTTPException(status_code=400, detail="El archivo de imagen está vacío.")

    logger.info("Imagen recibida | tamaño=%d bytes tipo=%s", len(imagen_bytes), imagen.content_type)

    try:
        result = analyze(imagen_bytes, imagen.content_type, curso, modelo)
        logger.info("Análisis completado | curso=%d errores=%d", curso, len(result.errores_detectados_agrupados))
        return result
    except HandwriteAnalyzeError as exc:
        logger.warning("Error de validación: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Error inesperado en el pipeline")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

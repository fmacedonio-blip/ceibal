import logging

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

from app.pipelines.handwrite_pipeline_aws.s3_client import ALLOWED_CONTENT_TYPES, upload_image

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/process", tags=["process"])


class UploadResponse(BaseModel):
    s3_key: str


@router.post("/", response_model=UploadResponse)
async def process_upload(file: UploadFile = File(...)) -> UploadResponse:
    """
    Upload a handwritten image via the gateway-file service to S3.

    Proxies the file to the external gateway-file endpoint
    (GATEWAY_FILE_URL / POST /process) which stores it in S3.
    Returns the S3 key to use with POST /handwrite-analyze-aws/.
    """
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Tipo de archivo no soportado: '{file.content_type}'. "
                f"Usar: {sorted(ALLOWED_CONTENT_TYPES)}"
            ),
        )

    image_bytes = await file.read()

    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="El archivo de imagen está vacío.")

    logger.info(
        "Upload recibido | archivo=%s tamaño=%d tipo=%s",
        file.filename, len(image_bytes), file.content_type,
    )

    try:
        key = upload_image(image_bytes, file.content_type, filename=file.filename or "image.jpg")
        logger.info("Upload completado | s3_key=%s", key)
        return UploadResponse(s3_key=key)
    except EnvironmentError as exc:
        logger.error("gateway-file no configurado: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        logger.error("Error subiendo al gateway-file: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

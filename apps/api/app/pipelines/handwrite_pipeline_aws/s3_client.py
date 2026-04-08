import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def get_gateway_file_url() -> str:
    url = settings.gateway_file_url
    if not url:
        raise EnvironmentError(
            "GATEWAY_FILE_URL is not set. Add it to your .env file."
        )
    return url


def build_s3_url(key: str) -> str:
    """Construct the HTTPS S3 URL for a given object key."""
    return f"https://{settings.s3_bucket_handwrite}.s3.{settings.aws_region}.amazonaws.com/{key}"


def upload_image(image_bytes: bytes, content_type: str, filename: str = "image.jpg") -> tuple[str, str | None]:
    """
    Upload an image to S3 via the gateway-file service.
    Returns (s3_key, transcription_or_None).

    The gateway-file endpoint accepts a multipart file upload, stores the image
    in S3, and optionally returns a transcription of the handwritten text.
    """
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(
            f"Tipo de contenido no soportado: '{content_type}'. "
            f"Tipos válidos: {sorted(ALLOWED_CONTENT_TYPES)}"
        )

    gateway_url = get_gateway_file_url()

    try:
        response = httpx.post(
            gateway_url,
            files={"file": (filename, image_bytes, content_type)},
            timeout=30.0,
        )
    except httpx.TimeoutException:
        raise RuntimeError("Timeout uploading image to gateway-file service")
    except httpx.RequestError as e:
        raise RuntimeError(f"Network error uploading to gateway-file: {e}") from e

    if response.status_code != 200:
        raise RuntimeError(
            f"gateway-file returned HTTP {response.status_code}: {response.text[:300]}"
        )

    body = response.json()

    # Response shape: { "record_id": "...", "file_key": "uploads/uuid.png",
    #                   "s3_url": "s3://bucket/...", "transcription": "...", "transcription_error": null }
    key = body.get("file_key")
    if not key:
        raise RuntimeError(
            f"gateway-file response missing 'file_key'. Response: {body}"
        )

    s3_url: str | None = body.get("s3_url")

    logger.info(
        "gateway-file upload OK | file_key=%s s3_url=%s size=%d",
        key, s3_url, len(image_bytes),
    )
    return key, s3_url

import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/wave", "audio/x-wav",
    "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/ogg", "audio/webm",
}


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


def upload_file(file_bytes: bytes, content_type: str, filename: str = "file") -> tuple[str, str | None]:
    """
    Upload a file (image or audio) to S3 via the gateway-file service.
    Returns (s3_key, s3_url_or_None).
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
            files={"file": (filename, file_bytes, content_type)},
            timeout=30.0,
        )
    except httpx.TimeoutException:
        raise RuntimeError("Timeout uploading file to gateway-file service")
    except httpx.RequestError as e:
        raise RuntimeError(f"Network error uploading to gateway-file: {e}") from e

    if response.status_code != 200:
        raise RuntimeError(
            f"gateway-file returned HTTP {response.status_code}: {response.text[:300]}"
        )

    body = response.json()

    key = body.get("file_key")
    if not key:
        raise RuntimeError(
            f"gateway-file response missing 'file_key'. Response: {body}"
        )

    s3_url: str | None = body.get("s3_url")

    logger.info(
        "gateway-file upload OK | file_key=%s s3_url=%s size=%d",
        key, s3_url, len(file_bytes),
    )
    return key, s3_url


# Keep backwards-compatible alias
upload_image = upload_file

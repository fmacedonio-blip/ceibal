import base64
import mimetypes
import os
from io import BytesIO
from typing import Any, Optional

import httpx

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

AUDIO_MODEL_HINTS = (
    "gemini",
    "gpt-4o-audio",
    "gpt-4o",
    "claude-3",
    "claude-sonnet-4",
    "claude-opus-4",
    "mimo",
)

# Map MIME type to short format string expected by OpenAI audio content blocks
_MIME_TO_FORMAT = {
    "audio/mpeg": "mp3",
    "audio/mp3": "mp3",
    "audio/wav": "wav",
    "audio/wave": "wav",
    "audio/x-wav": "wav",
    "audio/mp4": "mp4",
    "audio/m4a": "mp4",
    "audio/x-m4a": "mp4",
    "audio/ogg": "ogg",
    "audio/webm": "webm",
}


# Formats the Xiaomi/MiMo model accepts
_MODEL_SUPPORTED_FORMATS = {"mp3", "flac", "m4a", "wav", "ogg"}


def normalize_to_supported_format(audio_bytes: bytes, media_type: str) -> tuple[bytes, str]:
    """
    If the audio format is not supported by the AI model (e.g. webm),
    transcode it to WAV using pydub + ffmpeg.
    Returns (audio_bytes, new_mime_type).
    """
    fmt = _MIME_TO_FORMAT.get(media_type, "")
    if fmt in _MODEL_SUPPORTED_FORMATS:
        return audio_bytes, media_type

    try:
        from pydub import AudioSegment
    except ImportError as e:
        raise RuntimeError("pydub is not installed. Add it to requirements.txt.") from e

    audio = AudioSegment.from_file(BytesIO(audio_bytes))
    buf = BytesIO()
    audio.export(buf, format="mp3", bitrate="128k")
    return buf.getvalue(), "audio/mpeg"


def get_audio_duration_sec(audio_bytes: bytes, media_type: str) -> float:
    """Extracts real audio duration using mutagen. Raises ValueError if it can't be determined."""
    try:
        from mutagen import File as MutagenFile
    except ImportError as e:
        raise RuntimeError("mutagen no está instalado. Agregarlo a requirements.txt.") from e

    audio = MutagenFile(BytesIO(audio_bytes))
    if audio is None or not hasattr(audio, "info") or audio.info is None:
        raise ValueError(
            f"No se pudo determinar la duración del audio (formato: {media_type}). "
            "Verificá que el archivo no esté corrupto."
        )
    duration = audio.info.length
    if duration <= 0:
        raise ValueError("La duración del audio es inválida (0 segundos o negativa).")
    return duration


def supports_audio(model: str) -> bool:
    model_name = model.lower()
    return any(hint in model_name for hint in AUDIO_MODEL_HINTS)


def normalize_audio_input(audio_bytes: bytes, media_type: str) -> tuple[str, str]:
    """Returns (base64_data, format_string) for building content blocks."""
    fmt = _MIME_TO_FORMAT.get(media_type)
    if fmt is None:
        # Fallback: try mimetypes
        ext = mimetypes.guess_extension(media_type) or ""
        fmt = ext.lstrip(".") or "mp3"
    encoded = base64.b64encode(audio_bytes).decode("ascii")
    return encoded, fmt


def build_audio_user_content(prompt_text: str, audio_bytes: bytes, media_type: str) -> list[dict[str, Any]]:
    """Build OpenAI-compatible multimodal content with audio + text."""
    b64_data, fmt = normalize_audio_input(audio_bytes, media_type)
    return [
        {
            "type": "input_audio",
            "input_audio": {
                "data": b64_data,
                "format": fmt,
            },
        },
        {"type": "text", "text": prompt_text},
    ]


def chat_completion(model: str, messages: list, response_format: Optional[dict] = None, max_tokens: int = 8192) -> dict:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise EnvironmentError("OPENROUTER_API_KEY no está definida en las variables de entorno")

    payload: dict[str, Any] = {"model": model, "messages": messages, "max_tokens": max_tokens}
    if response_format:
        payload["response_format"] = response_format

    try:
        response = httpx.post(
            OPENROUTER_API_URL,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=120.0,
        )
    except httpx.TimeoutException:
        raise RuntimeError(f"Timeout al llamar a OpenRouter con modelo '{model}'")
    except httpx.RequestError as e:
        raise RuntimeError(f"Error de red al llamar a OpenRouter: {e}")

    if response.status_code != 200:
        raise RuntimeError(
            f"OpenRouter devolvió HTTP {response.status_code} para modelo '{model}': {response.text}"
        )

    return response.json()

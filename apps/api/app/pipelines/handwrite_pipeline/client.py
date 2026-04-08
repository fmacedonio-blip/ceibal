from __future__ import annotations

import base64
import mimetypes
import os
from io import BytesIO
from pathlib import Path
from typing import Any, Optional

import httpx

from app.pipelines.handwrite_pipeline.models import ImageInput

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
VISION_MODEL_HINTS = (
    "gpt-4o",
    "gemini",
    "claude-3",
    "claude-sonnet-4",
    "claude-opus-4",
    "pixtral",
    "llava",
    "qwen-vl",
    "qwen2.5-vl",
)


def supports_vision(model: str) -> bool:
    model_name = model.lower()
    return any(hint in model_name for hint in VISION_MODEL_HINTS)


def coerce_image_input(image_input: Any, media_type: str | None = None) -> ImageInput:
    if isinstance(image_input, ImageInput):
        return image_input

    if isinstance(image_input, dict):
        return ImageInput.model_validate(image_input)

    if isinstance(image_input, str):
        if image_input.startswith("data:image/"):
            return ImageInput(data_url=image_input)
        return ImageInput(path=image_input)

    if isinstance(image_input, (bytes, bytearray)):
        normalized_media_type = media_type or "image/png"
        encoded = base64.b64encode(bytes(image_input)).decode("ascii")
        return ImageInput(content_bytes_base64=encoded, media_type=normalized_media_type)

    raise TypeError("Formato de imagen no soportado. Usa path local, data URL, dict o bytes.")


def normalize_image_input(image_input: ImageInput) -> str:
    if image_input.data_url is not None:
        return image_input.data_url

    if image_input.path is not None:
        return _path_to_data_url(image_input.path)

    if image_input.content_bytes_base64 is not None and image_input.media_type is not None:
        return f"data:{image_input.media_type};base64,{image_input.content_bytes_base64}"

    raise ValueError("No se pudo normalizar la imagen de entrada.")


def build_multimodal_user_content(prompt_text: str, image_data_url: str) -> list[dict[str, Any]]:
    return [
        {"type": "text", "text": prompt_text},
        {"type": "image_url", "image_url": {"url": image_data_url}},
    ]


def build_text_compatibility_image(texto: str) -> str:
    lineas = [line.strip() for line in texto.splitlines() if line.strip()]
    if not lineas:
        raise ValueError("`texto_compatibilidad` no puede estar vacío.")
    try:
        from PIL import Image, ImageDraw, ImageFont
    except Exception as exc:
        raise RuntimeError("Pillow no está disponible para renderizar `texto_compatibilidad` a PNG.") from exc

    width, height = 1200, 800
    image = Image.new("RGB", (width, height), "#fdfbf4")
    draw = ImageDraw.Draw(image)

    draw.line((95, 0, 95, height), fill="#d46a6a", width=3)
    for line_y in range(90, 90 + (min(len(lineas), 10) + 1) * 48, 48):
        draw.line((55, line_y, 1100, line_y), fill="#8eb7d6", width=2)

    font = ImageFont.load_default()
    y = 62
    for line in lineas[:10]:
        draw.text((130, y), line, fill="#24313f", font=font)
        y += 48

    buffer = BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


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
            timeout=60.0,
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


def _path_to_data_url(path_str: str) -> str:
    path = Path(path_str)
    if not path.exists():
        raise FileNotFoundError(f"No se encontró la imagen: {path}")

    media_type = mimetypes.guess_type(path.name)[0]
    if media_type is None or not media_type.startswith("image/"):
        raise ValueError(f"El archivo '{path}' no tiene un formato de imagen soportado.")

    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{media_type};base64,{encoded}"

import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.pipelines.audio_pipeline.models import OutputFinalAudio
from app.services.audio_analyze import DEFAULT_MODEL, AudioAnalyzeError, analyze

logger = logging.getLogger(__name__)

ALLOWED_CONTENT_TYPES = {
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/wave",
    "audio/x-wav",
    "audio/mp4",
    "audio/m4a",
    "audio/x-m4a",
    "audio/ogg",
    "audio/webm",
}
SUPPORTED_COURSES = {3, 4, 5, 6}

router = APIRouter(prefix="/audio-analyze", tags=["audio-analyze"])


@router.post("/", response_model=OutputFinalAudio)
async def audio_analyze(
    audio: UploadFile = File(...),
    texto_original: str = Form(...),
    nombre: str = Form(...),
    curso: int = Form(...),
    modelo: str = Form(DEFAULT_MODEL),
) -> OutputFinalAudio:
    modelo = modelo.strip()

    logger.info(
        "Request recibido | curso=%d modelo=%s tipo=%s",
        curso, modelo, audio.content_type,
    )

    if curso not in SUPPORTED_COURSES:
        raise HTTPException(
            status_code=400,
            detail=f"Curso inválido: {curso}. Valores permitidos: {sorted(SUPPORTED_COURSES)}",
        )

    if not texto_original.strip():
        raise HTTPException(status_code=400, detail="El campo 'texto_original' no puede estar vacío.")

    if not nombre.strip():
        raise HTTPException(status_code=400, detail="El campo 'nombre' no puede estar vacío.")

    if audio.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Tipo de archivo no soportado: '{audio.content_type}'. Usar: {sorted(ALLOWED_CONTENT_TYPES)}",
        )

    audio_bytes = await audio.read()

    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="El archivo de audio está vacío.")

    logger.info("Audio recibido | tamaño=%d bytes", len(audio_bytes))

    try:
        result = analyze(audio_bytes, audio.content_type, texto_original, nombre, curso, modelo)
        logger.info(
            "Análisis completado | curso=%d ppm=%.1f nivel=%s errores=%d",
            curso, result.ppm, result.nivel_orientativo, len(result.errores),
        )
        return result
    except AudioAnalyzeError as exc:
        logger.warning("Error de validación: %s", exc)
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Error inesperado en el pipeline de audio")
        raise HTTPException(status_code=500, detail=str(exc)) from exc

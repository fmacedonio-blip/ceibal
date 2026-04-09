from __future__ import annotations

import logging
from typing import Optional

from app.pipelines.audio_pipeline import call1, call2
from app.pipelines.audio_pipeline.client import get_audio_duration_sec, normalize_to_supported_format
from app.pipelines.audio_pipeline.models import OutputFinalAudio

logger = logging.getLogger(__name__)


def run(
    audio_bytes: bytes,
    media_type: str,
    texto_original: str,
    nombre: str,
    curso: int,
    model: str,
    duracion_seg: Optional[float] = None,
) -> OutputFinalAudio:
    if duracion_seg is None or duracion_seg <= 0:
        duracion_seg = get_audio_duration_sec(audio_bytes, media_type)

    # Transcode to a model-supported format if needed (e.g. browser WebM → WAV)
    audio_bytes, media_type = normalize_to_supported_format(audio_bytes, media_type)

    result1 = call1.analizar(audio_bytes, media_type, texto_original, nombre, curso, model, duracion_seg)

    logger.info(
        "Call 1 audio result | ppm=%.1f precision=%.1f texto_no_relacionado=%s",
        result1.ppm, result1.precision, result1.texto_no_relacionado,
    )

    ppm_invalido = not (5 <= result1.ppm <= 350)
    precision_invalida = result1.palabras_texto_original > 0 and result1.precision < 20
    if result1.texto_no_relacionado or ppm_invalido or precision_invalida:
        logger.info(
            "consigna_no_cumplida=True | texto_no_relacionado=%s ppm_invalido=%s precision_invalida=%s",
            result1.texto_no_relacionado, ppm_invalido, precision_invalida,
        )
        return OutputFinalAudio(
            bloque_alumno="",
            bloque_docente="",
            transcripcion=result1.transcripcion,
            ppm=result1.ppm,
            precision=result1.precision,
            nivel_orientativo="requiere_intervencion",
            errores=[],
            alertas_fluidez=[],
            consigna_no_cumplida=True,
        )

    if result1.palabras_texto_original > 0 and len(result1.errores) > result1.palabras_texto_original:
        raise ValueError(
            f"El modelo detectó más errores ({len(result1.errores)}) "
            f"que palabras en el texto original ({result1.palabras_texto_original})."
        )

    return call2.generar(result1, texto_original, nombre, curso, model)

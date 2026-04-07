from . import call1, call2
from .client import get_audio_duration_sec
from .models import OutputFinalAudio


def run(
    audio_bytes: bytes,
    media_type: str,
    texto_original: str,
    nombre: str,
    curso: int,
    model: str,
) -> OutputFinalAudio:
    duracion_seg = get_audio_duration_sec(audio_bytes, media_type)

    result1 = call1.analizar(audio_bytes, media_type, texto_original, nombre, curso, model, duracion_seg)

    if not (5 <= result1.ppm <= 350):
        raise RuntimeError(
            f"PPM fuera de rango plausible ({result1.ppm:.1f}). "
            "Revisá que el audio y el texto original correspondan."
        )
    if result1.palabras_texto_original > 0 and len(result1.errores) > result1.palabras_texto_original:
        raise RuntimeError(
            f"El modelo detectó más errores ({len(result1.errores)}) "
            f"que palabras en el texto original ({result1.palabras_texto_original})."
        )

    return call2.generar(result1, texto_original, nombre, curso, model)

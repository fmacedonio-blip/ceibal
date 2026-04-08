from typing import Any

from app.pipelines.handwrite_pipeline.call1 import analizar
from app.pipelines.handwrite_pipeline.call2 import generar
from app.pipelines.handwrite_pipeline.client import build_text_compatibility_image, coerce_image_input
from app.pipelines.handwrite_pipeline.curriculum import validate_course
from app.pipelines.handwrite_pipeline.models import OutputFinal, PipelineInput


def run(
    imagen: str | bytes | dict | None,
    curso: int,
    conocimiento_curricular: dict[str, Any],
    model: str,
    *,
    image_media_type: str | None = None,
    texto_compatibilidad: str | None = None,
) -> OutputFinal:
    validate_course(curso)

    normalized_image = None
    if imagen is not None:
        normalized_image = coerce_image_input(imagen, media_type=image_media_type)
    elif texto_compatibilidad:
        normalized_image = coerce_image_input(build_text_compatibility_image(texto_compatibilidad))

    PipelineInput(
        imagen=normalized_image,
        texto_compatibilidad=texto_compatibilidad,
        curso=curso,
        conocimiento_curricular=conocimiento_curricular,
    )

    if normalized_image is None:
        raise ValueError("No se pudo construir una imagen válida para el pipeline.")

    output_call1 = analizar(
        imagen=normalized_image,
        curso=curso,
        conocimiento_curricular=conocimiento_curricular,
        model=model,
    )

    output_final = generar(
        output_call1=output_call1,
        curso=curso,
        conocimiento_curricular=conocimiento_curricular,
        model=model,
    )

    return output_final

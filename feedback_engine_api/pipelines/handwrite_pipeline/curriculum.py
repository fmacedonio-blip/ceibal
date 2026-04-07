from __future__ import annotations

from typing import Any


SUPPORTED_COURSES = {3, 4, 5, 6}


def validate_course(curso: int) -> None:
    if curso not in SUPPORTED_COURSES:
        raise ValueError(f"El curso debe estar entre 3° y 6°. Se recibió: {curso}")


def get_tramo_curricular(curso: int, conocimiento_curricular: dict[str, Any]) -> str:
    validate_course(curso)
    mapping = conocimiento_curricular.get("mapeo_curso_a_tramo", {})
    tramo = mapping.get(str(curso))
    if tramo is None:
        raise ValueError(f"No se encontró tramo curricular para el curso {curso}.")
    return tramo


def get_curriculum_block(curso: int, conocimiento_curricular: dict[str, Any]) -> dict[str, Any]:
    tramo = get_tramo_curricular(curso, conocimiento_curricular)
    tramos = conocimiento_curricular.get("tramos", {})
    block = tramos.get(tramo)
    if not isinstance(block, dict):
        raise ValueError(f"No se encontró el bloque curricular del tramo '{tramo}'.")

    curso_label = conocimiento_curricular.get("cursos", {}).get(str(curso), {}).get("label", f"{curso}°")
    return {
        "curso": curso,
        "curso_label": curso_label,
        "tramo_curricular": tramo,
        "tramo_label": block.get("label", tramo),
        "habilidades_esperadas": block.get("habilidades_esperadas", []),
        "errores_tolerables": block.get("errores_tolerables", []),
        "focos_docentes": block.get("focos_docentes", []),
        "ejes": block.get("ejes", {}),
    }

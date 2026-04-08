from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class ErrorLecturaOral(BaseModel):
    palabra_original: str
    lo_que_leyo: str | None = None  # None para omisiones
    tipo: str  # sustitucion | omision | repeticion | autocorreccion
    dudoso: bool = False


class OutputCall1Audio(BaseModel):
    transcripcion: str
    duracion_estimada_seg: float = Field(gt=0)
    palabras_texto_original: int = Field(ge=0)
    palabras_correctas: int = Field(ge=0)
    ppm: float = Field(ge=0)
    precision: float = Field(ge=0, le=100)
    errores: List[ErrorLecturaOral] = []
    alertas_fluidez: List[str] = []
    calidad_audio_baja: bool = False
    notas_calidad: str = ""


class OutputFinalAudio(BaseModel):
    bloque_alumno: str
    bloque_docente: str
    transcripcion: str
    ppm: float
    precision: float
    nivel_orientativo: str  # esperado | en_desarrollo | requiere_intervencion
    errores: List[ErrorLecturaOral]
    alertas_fluidez: List[str]
    calidad_audio_baja: bool = False

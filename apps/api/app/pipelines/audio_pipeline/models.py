from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class ErrorLecturaOral(BaseModel):
    palabra_original: str
    lo_que_leyo: Optional[str] = None  # None para omisiones
    tipo: str  # sustitucion | pronunciacion | omision | repeticion | autocorreccion
    dudoso: bool = False
    explicacion_alumno: str = ""   # tono accesible para 8-12 años
    explicacion_docente: str = ""  # tono técnico pedagógico


class OutputCall1Audio(BaseModel):
    transcripcion: str
    duracion_estimada_seg: float = Field(gt=0)
    palabras_texto_original: int = Field(ge=0)
    palabras_correctas: int = Field(ge=0)
    ppm: float = Field(ge=0)
    precision: float = Field(ge=0, le=100)
    errores: List[ErrorLecturaOral] = []
    alertas_fluidez: List[str] = []
    aspectos_positivos_verificados: List[str] = []
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
    consejos_para_mejorar: List[str] = []  # tips pedagógicos en tono alumno
    calidad_audio_baja: bool = False

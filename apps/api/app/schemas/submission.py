from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class SubmissionAnalyzeResponse(BaseModel):
    submission_id: uuid.UUID
    status: str
    feedback_inicial: str
    sugerencias_socraticas: list[str]
    total_errors: int
    requires_review: bool


class AudioSubmissionAnalyzeResponse(BaseModel):
    submission_id: uuid.UUID
    status: str
    bloque_alumno: str
    nivel_orientativo: str
    ppm: float
    precision: float
    total_errors: int
    requires_review: bool


class SubmissionDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    student_id: uuid.UUID
    teacher_id: uuid.UUID | None
    class_id: uuid.UUID | None
    grade: int | None
    s3_key: str | None
    submitted_at: datetime
    processed_at: datetime | None
    status: str
    total_errors: int | None
    spelling_errors: int | None
    concordance_errors: int | None
    ambiguous_count: int | None
    avg_confidence: float | None
    submission_type: str = "handwrite"
    requires_review: bool
    lectura_insuficiente: bool
    ai_result: dict[str, Any] | None  # deserialized JSONB object, not string


# ── Correction view schemas ──────────────────────────────────────────────────

class CorrectionErrorAlumno(BaseModel):
    texto: str
    correccion: str
    explicacion: str


class CorrectionErrorDocente(BaseModel):
    texto: str
    tipo: str
    explicacion_tecnica: str
    ocurrencias: int = 1
    confianza: float | None = None


class WritingCorrectionAlumno(BaseModel):
    feedback: str
    aspectos_positivos: list[str]
    transcripcion_html: str
    errores: list[CorrectionErrorAlumno]
    sugerencias_socraticas: list[str]
    consejos: list[str]


class WritingCorrectionDocente(BaseModel):
    razonamiento: str
    errores: list[CorrectionErrorDocente]
    puntos_de_mejora: list[dict[str, Any]]
    requires_review: bool


class AudioCorrectionErrorAlumno(BaseModel):
    palabra_original: str
    lo_que_leyo: str | None
    tipo: str
    explicacion: str


class AudioCorrectionErrorDocente(BaseModel):
    palabra_original: str
    lo_que_leyo: str | None
    tipo: str
    explicacion_tecnica: str
    dudoso: bool = False


class AudioCorrectionAlumno(BaseModel):
    feedback: str
    errores: list[AudioCorrectionErrorAlumno]
    consejos: list[str]


class AudioCorrectionDocente(BaseModel):
    feedback_tecnico: str
    ppm: float
    precision: float
    nivel_orientativo: str
    errores: list[AudioCorrectionErrorDocente]
    alertas_fluidez: list[str]


class WritingCorrectionResponse(BaseModel):
    submission_id: uuid.UUID
    submission_type: str = "handwrite"
    status: str
    alumno: WritingCorrectionAlumno
    docente: WritingCorrectionDocente


class AudioCorrectionResponse(BaseModel):
    submission_id: uuid.UUID
    submission_type: str = "audio"
    status: str
    alumno: AudioCorrectionAlumno
    docente: AudioCorrectionDocente


class DashboardStudentRow(BaseModel):
    student_id: uuid.UUID
    name: str | None
    entregas: int
    total_errors: int
    avg_confidence: float | None
    requires_review: bool


class ErrorPattern(BaseModel):
    error_type: str
    total_ocurrencias: int
    alumnos_afectados: int


class ProgressPoint(BaseModel):
    semana: str  # ISO week string, e.g. "2026-W14"
    promedio_errores: float
    avg_confidence: float | None

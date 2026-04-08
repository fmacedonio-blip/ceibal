from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict

from app.pipelines.handwrite_pipeline.models import OutputFinal


class SubmissionAnalyzeResponse(OutputFinal):
    submission_id: uuid.UUID
    status: str


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

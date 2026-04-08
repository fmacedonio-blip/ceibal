import uuid
from datetime import datetime

from sqlalchemy import (
    UUID,
    Boolean,
    Column,
    DateTime,
    Integer,
    Numeric,
    SmallInteger,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB

from app.models.base import Base


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    teacher_id = Column(UUID(as_uuid=True), nullable=True)
    class_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    grade = Column(SmallInteger, nullable=True)
    school_id = Column(UUID(as_uuid=True), nullable=True)
    s3_key = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(Text, nullable=False, default="pending")  # pending | processing | processed | error
    total_errors = Column(Integer, nullable=True, default=0)
    spelling_errors = Column(Integer, nullable=True, default=0)
    concordance_errors = Column(Integer, nullable=True, default=0)
    ambiguous_count = Column(Integer, nullable=True, default=0)
    avg_confidence = Column(Numeric(4, 3), nullable=True)
    requires_review = Column(Boolean, nullable=False, default=False)
    lectura_insuficiente = Column(Boolean, nullable=False, default=False)
    ai_result = Column(JSONB, nullable=True)


class SubmissionError(Base):
    __tablename__ = "submission_errors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    student_id = Column(UUID(as_uuid=True), nullable=False)
    class_id = Column(UUID(as_uuid=True), nullable=True)
    grade = Column(SmallInteger, nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=False)
    error_type = Column(Text, nullable=False)
    error_text = Column(Text, nullable=False)
    ocurrencias = Column(Integer, nullable=False, default=1)
    confianza = Column(Numeric(4, 3), nullable=True)
    es_ambigua = Column(Boolean, nullable=False, default=False)
    requiere_revision = Column(Boolean, nullable=False, default=False)

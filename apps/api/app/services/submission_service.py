from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any

from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.submission import Submission, SubmissionError
from app.pipelines.audio_pipeline.models import OutputFinalAudio
from app.pipelines.handwrite_pipeline.models import OutputFinal
from app.schemas.submission import DashboardStudentRow, ErrorPattern, ProgressPoint

CHAT_MAX_TURNS = 20


def _compute_metrics(output: OutputFinal) -> dict[str, Any]:
    errors = output.errores_detectados_agrupados
    total = sum(e.ocurrencias for e in errors)
    spelling = sum(e.ocurrencias for e in errors if "ortografia" in (e.error_type or "").lower())
    concordance = sum(e.ocurrencias for e in errors if "concordancia" in (e.error_type or "").lower())
    ambiguous = sum(1 for e in errors if e.es_ambigua)
    confidences = [e.confianza_lectura for e in errors if e.confianza_lectura is not None]
    avg_conf = sum(confidences) / len(confidences) if confidences else None
    requires_review = any(e.requiere_revision_docente for e in errors)
    return {
        "total_errors": total,
        "spelling_errors": spelling,
        "concordance_errors": concordance,
        "ambiguous_count": ambiguous,
        "avg_confidence": round(avg_conf, 3) if avg_conf is not None else None,
        "requires_review": requires_review,
        "lectura_insuficiente": output.lectura_insuficiente,
    }


def _compute_audio_metrics(output: OutputFinalAudio) -> dict[str, Any]:
    sustitucion_count = sum(1 for e in output.errores if e.tipo == "sustitucion")
    return {
        "total_errors": len(output.errores),
        "spelling_errors": sustitucion_count,
        "concordance_errors": 0,
        "ambiguous_count": sum(1 for e in output.errores if e.dudoso),
        "avg_confidence": round(output.precision / 100, 3) if output.precision is not None else None,
        "requires_review": output.calidad_audio_baja,
        "lectura_insuficiente": output.calidad_audio_baja,
    }


async def persist_result(
    db: AsyncSession,
    student_id: uuid.UUID,
    teacher_id: uuid.UUID | None,
    class_id: uuid.UUID | None,
    grade: int | None,
    output: OutputFinal | OutputFinalAudio,
    submission_type: str = "handwrite",
    ai_result_override: dict[str, Any] | None = None,
) -> Submission:
    if submission_type == "audio":
        metrics = _compute_audio_metrics(output)  # type: ignore[arg-type]
    else:
        metrics = _compute_metrics(output)  # type: ignore[arg-type]

    now = datetime.now(timezone.utc)
    ai_result = ai_result_override if ai_result_override is not None else output.model_dump()

    submission = Submission(
        id=uuid.uuid4(),
        student_id=student_id,
        teacher_id=teacher_id,
        class_id=class_id,
        grade=grade,
        submitted_at=now,
        processed_at=now,
        status="processed",
        submission_type=submission_type,
        ai_result=ai_result,
        **metrics,
    )

    # Only handwrite produces normalized submission_errors rows
    error_rows = []
    if submission_type == "handwrite":
        hw_output: OutputFinal = output  # type: ignore[assignment]
        error_rows = [
            SubmissionError(
                id=uuid.uuid4(),
                submission_id=submission.id,
                student_id=student_id,
                class_id=class_id,
                grade=grade,
                submitted_at=now,
                error_type=e.error_type,
                error_text=e.text,
                ocurrencias=e.ocurrencias,
                confianza=e.confianza_lectura,
                es_ambigua=e.es_ambigua,
                requiere_revision=e.requiere_revision_docente,
            )
            for e in hw_output.errores_detectados_agrupados
        ]

    try:
        db.add(submission)
        await db.flush()
        if error_rows:
            db.add_all(error_rows)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return submission


async def get_submission(
    db: AsyncSession,
    submission_id: uuid.UUID,
    current_user_id: uuid.UUID | None,
    current_role: str,
) -> Submission:
    result = await db.execute(
        select(Submission).where(Submission.id == submission_id)
    )
    submission = result.scalar_one_or_none()
    if submission is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Submission not found")

    if current_role not in ("docente", "director", "inspector"):
        if current_user_id is None or submission.student_id != current_user_id:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Access denied")

    return submission


async def get_classroom_dashboard(
    db: AsyncSession,
    class_id: uuid.UUID,
    desde: date | None,
    hasta: date | None,
) -> list[DashboardStudentRow]:
    # Build conditions without f-strings in WHERE clause; use named params throughout
    conditions = "s.class_id = :class_id"
    params: dict[str, Any] = {"class_id": class_id}
    if desde:
        conditions += " AND s.submitted_at >= :desde"
        params["desde"] = desde
    if hasta:
        conditions += " AND s.submitted_at <= :hasta"
        params["hasta"] = hasta

    stmt = text(f"""
        SELECT
            s.student_id,
            COUNT(s.id)                          AS entregas,
            COALESCE(SUM(s.total_errors), 0)     AS total_errors,
            AVG(s.avg_confidence)                AS avg_confidence,
            BOOL_OR(s.requires_review)           AS requires_review
        FROM submissions s
        WHERE {conditions}
        GROUP BY s.student_id
        ORDER BY s.student_id
    """).bindparams(**params)

    rows = (await db.execute(stmt)).mappings().all()

    return [
        DashboardStudentRow(
            student_id=r["student_id"],
            name=None,  # enriched by caller if needed
            entregas=r["entregas"],
            total_errors=r["total_errors"],
            avg_confidence=float(r["avg_confidence"]) if r["avg_confidence"] is not None else None,
            requires_review=r["requires_review"] or False,
        )
        for r in rows
    ]


async def get_error_patterns(
    db: AsyncSession,
    class_id: uuid.UUID,
    dias: int = 30,
) -> list[ErrorPattern]:
    since = datetime.now(timezone.utc) - timedelta(days=dias)

    stmt = text("""
        SELECT
            error_type,
            SUM(ocurrencias)                AS total_ocurrencias,
            COUNT(DISTINCT student_id)      AS alumnos_afectados
        FROM submission_errors
        WHERE class_id = :class_id
          AND submitted_at >= :since
        GROUP BY error_type
        ORDER BY total_ocurrencias DESC
    """).bindparams(class_id=class_id, since=since)

    rows = (await db.execute(stmt)).mappings().all()

    return [
        ErrorPattern(
            error_type=r["error_type"],
            total_ocurrencias=r["total_ocurrencias"],
            alumnos_afectados=r["alumnos_afectados"],
        )
        for r in rows
    ]


async def get_student_progress(
    db: AsyncSession,
    student_id: uuid.UUID,
) -> list[ProgressPoint]:
    stmt = text("""
        SELECT
            TO_CHAR(DATE_TRUNC('week', submitted_at), 'IYYY-"W"IW') AS semana,
            AVG(total_errors)                                         AS promedio_errores,
            AVG(avg_confidence)                                       AS avg_confidence
        FROM submissions
        WHERE student_id = :student_id
          AND status = 'processed'
        GROUP BY DATE_TRUNC('week', submitted_at)
        ORDER BY DATE_TRUNC('week', submitted_at)
    """).bindparams(student_id=student_id)

    rows = (await db.execute(stmt)).mappings().all()

    return [
        ProgressPoint(
            semana=r["semana"],
            promedio_errores=float(r["promedio_errores"]) if r["promedio_errores"] is not None else 0.0,
            avg_confidence=float(r["avg_confidence"]) if r["avg_confidence"] is not None else None,
        )
        for r in rows
    ]

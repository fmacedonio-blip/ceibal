import uuid
from datetime import date

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

_DEV_NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")


def _sub_to_uuid(sub: str) -> uuid.UUID | None:
    if not sub:
        return None
    try:
        return uuid.UUID(sub)
    except ValueError:
        return uuid.uuid5(_DEV_NAMESPACE, sub)

from app.auth.dependencies import get_current_user
from app.database_async import get_async_db
from app.schemas.submission import (
    DashboardStudentRow,
    ErrorPattern,
    ProgressPoint,
    SubmissionAnalyzeResponse,
    SubmissionDetailResponse,
)
from app.services import handwrite_analyze as hw_service
from app.services import submission_service
from app.services.handwrite_analyze import HandwriteAnalyzeError

router = APIRouter(prefix="/api/v1", tags=["submissions"])

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
SUPPORTED_GRADES = {3, 4, 5, 6}


@router.post("/submissions/analyze", response_model=SubmissionAnalyzeResponse, tags=["submissions"])
async def analyze_submission(
    file: UploadFile = File(...),
    class_id: uuid.UUID = Form(...),
    grade: int = Form(...),
    student_id: uuid.UUID = Form(...),
    current_user: dict = Depends(get_current_user),
    db=Depends(get_async_db),
) -> SubmissionAnalyzeResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}")
    if grade not in SUPPORTED_GRADES:
        raise HTTPException(status_code=400, detail=f"Grade must be one of {sorted(SUPPORTED_GRADES)}")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    teacher_uuid = _sub_to_uuid(current_user.get("sub", ""))

    try:
        output = await hw_service.analyze(image_bytes, file.content_type, grade)
    except HandwriteAnalyzeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    submission = await submission_service.persist_result(
        db=db,
        student_id=student_id,
        teacher_id=teacher_uuid,
        class_id=class_id,
        grade=grade,
        output=output,
    )

    return SubmissionAnalyzeResponse(
        submission_id=submission.id,
        status=submission.status,
        feedback_inicial=output.feedback_inicial,
        sugerencias_socraticas=output.sugerencias_socraticas,
        total_errors=submission.total_errors or 0,
        requires_review=submission.requires_review,
    )


@router.get("/submissions/{submission_id}", response_model=SubmissionDetailResponse, tags=["submissions"])
async def get_submission(
    submission_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_async_db),
) -> SubmissionDetailResponse:
    user_role = current_user.get("role", "")
    user_uuid = _sub_to_uuid(current_user.get("sub", ""))

    submission = await submission_service.get_submission(
        db=db,
        submission_id=submission_id,
        current_user_id=user_uuid,
        current_role=user_role,
    )
    return SubmissionDetailResponse.model_validate(submission)


@router.get("/classroom/{class_id}/dashboard", response_model=list[DashboardStudentRow], tags=["dashboard"])
async def classroom_dashboard(
    class_id: uuid.UUID,
    desde: date | None = None,
    hasta: date | None = None,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_async_db),
) -> list[DashboardStudentRow]:
    role = current_user.get("role", "")
    if role not in ("docente", "director", "inspector"):
        raise HTTPException(status_code=403, detail="Docente or director role required")
    return await submission_service.get_classroom_dashboard(db, class_id, desde, hasta)


@router.get("/classroom/{class_id}/error-patterns", response_model=list[ErrorPattern], tags=["dashboard"])
async def classroom_error_patterns(
    class_id: uuid.UUID,
    dias: int = 30,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_async_db),
) -> list[ErrorPattern]:
    role = current_user.get("role", "")
    if role not in ("docente", "director", "inspector"):
        raise HTTPException(status_code=403, detail="Docente or director role required")
    return await submission_service.get_error_patterns(db, class_id, dias)


@router.get("/students/{student_id}/progress", response_model=list[ProgressPoint], tags=["submissions"])
async def student_progress(
    student_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_async_db),
) -> list[ProgressPoint]:
    return await submission_service.get_student_progress(db, student_id)

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import Activity, AiDiagnosis, Course, Student
from app.services import diagnosis_service
from app.services.diagnosis_service import InsufficientDataError

router = APIRouter(prefix="/api/v1", tags=["students"])


@router.get("/students/{student_id}")
def get_student(
    student_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )

    course = db.query(Course).filter(Course.id == student.course_id).first()
    diagnosis = db.query(AiDiagnosis).filter(AiDiagnosis.student_id == student.id).first()
    activities = (
        db.query(Activity)
        .filter(Activity.student_id == student.id)
        .order_by(Activity.id.desc())
        .all()
    )

    return {
        "id": student.id,
        "name": student.name,
        "course": {
            "id": course.id,
            "name": course.name,
            "shift": course.shift,
        } if course else None,
        "average": student.average,
        "tasks_completed": student.tasks_completed,
        "tasks_total": student.tasks_total,
        "ai_diagnosis": {
            "text": diagnosis.text,
            "tags": diagnosis.tags,
            "generated_at": diagnosis.generated_at.isoformat() if diagnosis and diagnosis.generated_at else None,
        } if diagnosis else {"text": "", "tags": [], "generated_at": None},
        "activity_history": [
            {
                "id": a.id,
                "name": a.name,
                "date": a.date,
                "score": a.score,
                "status": a.status,
                "submission_id": str(a.submission_id) if a.submission_id else None,
            }
            for a in activities
        ],
    }


@router.post("/students/{student_id}/generate-diagnosis")
def generate_diagnosis(
    student_id: int,
    _user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    try:
        result = diagnosis_service.generate(student_id, db)
    except InsufficientDataError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

    now = datetime.utcnow()
    diagnosis = db.query(AiDiagnosis).filter(AiDiagnosis.student_id == student_id).first()
    if diagnosis:
        diagnosis.text = result["text"]
        diagnosis.tags = result["tags"]
        diagnosis.generated_at = now
    else:
        diagnosis = AiDiagnosis(
            student_id=student_id,
            text=result["text"],
            tags=result["tags"],
            generated_at=now,
        )
        db.add(diagnosis)
    db.commit()

    return {
        "text": diagnosis.text,
        "tags": diagnosis.tags,
        "generated_at": now.isoformat(),
    }

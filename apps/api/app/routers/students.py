from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import Activity, AiDiagnosis, Course, Student

router = APIRouter(prefix="/api/v1", tags=["students"])


@router.get("/students/{student_id}")
def get_student(
    student_id: int,
    _user: dict = Depends(get_current_user),
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
        } if diagnosis else {"text": "", "tags": []},
        "activity_history": [
            {
                "id": a.id,
                "name": a.name,
                "date": a.date,
                "score": a.score,
                "status": a.status,
            }
            for a in activities
        ],
    }

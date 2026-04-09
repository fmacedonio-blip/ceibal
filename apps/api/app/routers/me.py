from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import require_alumno
from app.database import get_db
from app.models import Activity, Course, Student, User

router = APIRouter(prefix="/api/v1", tags=["alumno"])


def _get_student(current_user: User, db: Session) -> Student:
    """Resolve the Student record for the logged-in alumno via email lookup."""
    student = db.query(Student).filter(Student.email == current_user.email).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado — verificá que el email de Cognito coincida con el seed de la DB",
        )
    return student


@router.get("/me")
def get_me(current_user: User = Depends(require_alumno), db: Session = Depends(get_db)) -> dict:
    """Return the logged-in alumno's profile."""
    student = _get_student(current_user, db)
    course = db.query(Course).filter(Course.id == student.course_id).first()
    return {
        "id": student.id,
        "student_uuid": str(student.student_uuid),
        "name": student.name,
        "course": {
            "id": course.id,
            "course_uuid": str(course.course_uuid),
            "name": course.name,
            "shift": course.shift,
        } if course else None,
    }


@router.get("/me/tasks")
def get_my_tasks(current_user: User = Depends(require_alumno), db: Session = Depends(get_db)) -> list:
    """Return all tasks (activities) assigned to the logged-in alumno."""
    student = _get_student(current_user, db)
    activities = (
        db.query(Activity)
        .filter(Activity.student_id == student.id)
        .filter(Activity.type.isnot(None))
        .order_by(Activity.id.asc())
        .all()
    )
    return [
        {
            "id": a.id,
            "name": a.name,
            "description": a.description,
            "reading_text": a.reading_text,
            "type": a.type,
            "subject": a.subject,
            "date": a.date,
            "score": a.score,
            "status": a.status,
            "submission_id": str(a.submission_id) if a.submission_id else None,
        }
        for a in activities
    ]

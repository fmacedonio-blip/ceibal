import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth.jwt import decode_token
from app.database import get_db
from app.models import Activity, Course, Student

router = APIRouter(prefix="/api/v1", tags=["alumno"])


def _get_student_from_request(request: Request, db: Session) -> Student:
    """Extract student_uuid from JWT Bearer token and load the Student."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = auth_header.split(" ", 1)[1]
    try:
        claims = decode_token(token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    if claims.get("role") != "alumno":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Endpoint only available for alumno role")

    student_uuid_str = claims.get("student_uuid")
    if not student_uuid_str:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Token missing student_uuid claim")

    try:
        student_uuid = uuid.UUID(student_uuid_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid student_uuid in token")

    student = db.query(Student).filter(Student.student_uuid == student_uuid).first()
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student


@router.get("/me")
def get_me(request: Request, db: Session = Depends(get_db)) -> dict:
    """Return the logged-in alumno's profile."""
    student = _get_student_from_request(request, db)
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
def get_my_tasks(request: Request, db: Session = Depends(get_db)) -> list:
    """Return all tasks (activities) assigned to the logged-in alumno."""
    student = _get_student_from_request(request, db)
    activities = (
        db.query(Activity)
        .filter(Activity.student_id == student.id)
        .filter(Activity.type.isnot(None))  # only alumno tasks (have type set)
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
            "submission_id": None,  # TODO: link to submission when student submits
        }
        for a in activities
    ]

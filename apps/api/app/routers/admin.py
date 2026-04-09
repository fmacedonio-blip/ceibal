import random
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.config import settings
from app.database import get_db
from app.models.existing import Activity, AiDiagnosis, Course, Student

router = APIRouter(prefix="/admin", tags=["admin"])

FIRST_NAMES = [
    "Agustín", "Valentina", "Mateo", "Sofía", "Lucas", "Camila", "Nicolás",
    "Lucía", "Santiago", "Martina", "Tomás", "Isabella", "Benjamín", "Florencia",
    "Emilio", "Catalina", "Facundo", "Jimena", "Rodrigo", "Pilar",
]
LAST_NAMES = [
    "García", "Rodríguez", "González", "Fernández", "López", "Martínez",
    "Pérez", "Sánchez", "Romero", "Torres", "Ríos", "Suárez", "Cabrera",
    "Méndez", "Silva", "Castro", "Herrera", "Techera", "Soria", "Núñez",
]


def _require_dev(user: dict = Depends(get_current_user)) -> dict:
    if not settings.is_development:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return user


def _delete_student(student: Student, db: Session) -> None:
    """Delete a student and all dependent records in the correct order."""
    activities = db.query(Activity).filter(Activity.student_id == student.id).all()
    for activity in activities:
        if activity.submission_id:
            # chat_sessions → chat_messages and submission_errors cascade automatically
            db.execute(
                __import__("sqlalchemy").text(
                    "DELETE FROM chat_sessions WHERE submission_id = :sid"
                ),
                {"sid": activity.submission_id},
            )
            db.execute(
                __import__("sqlalchemy").text(
                    "DELETE FROM submissions WHERE id = :sid"
                ),
                {"sid": activity.submission_id},
            )

    db.query(Activity).filter(Activity.student_id == student.id).delete()
    db.query(AiDiagnosis).filter(AiDiagnosis.student_id == student.id).delete()
    db.delete(student)


@router.get("/students")
def list_all_students(
    db: Session = Depends(get_db),
) -> list:
    """List all students with their id, name and course — useful for dev-login. No auth required."""
    if not settings.is_development:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    students = db.query(Student).order_by(Student.course_id, Student.id).all()
    result = []
    for s in students:
        course = db.query(Course).filter(Course.id == s.course_id).first()
        result.append({
            "id": s.id,
            "name": s.name,
            "course_id": s.course_id,
            "course_name": f"{course.name} — {course.shift}" if course else None,
            "student_uuid": str(s.student_uuid),
        })
    return result


class CreateStudentBody(BaseModel):
    name: str | None = None


@router.post("/courses/{course_id}/students", status_code=status.HTTP_201_CREATED)
def create_student(
    course_id: int,
    body: CreateStudentBody = CreateStudentBody(),
    _user: dict = Depends(_require_dev),
    db: Session = Depends(get_db),
) -> dict:
    """Create a student in the given course. If name is omitted, a random one is generated."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    name = body.name or f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
    student = Student(
        student_uuid=uuid.uuid4(),
        name=name,
        course_id=course_id,
        average=round(random.uniform(4.0, 9.5), 1),
        tasks_completed=0,
        tasks_total=0,
        status="al_dia",
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    return {
        "id": student.id,
        "name": student.name,
        "course_id": student.course_id,
        "course_name": f"{course.name} — {course.shift}",
        "student_uuid": str(student.student_uuid),
        "average": student.average,
    }


@router.delete("/courses/{course_id}/students", status_code=status.HTTP_200_OK)
def delete_course_students(
    course_id: int,
    _user: dict = Depends(_require_dev),
    db: Session = Depends(get_db),
) -> dict:
    """Delete all students in a course and all their associated data."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    students = db.query(Student).filter(Student.course_id == course_id).all()
    count = len(students)
    for student in students:
        _delete_student(student, db)

    db.commit()
    return {"deleted_students": count, "course_id": course_id}


@router.delete("/courses/{course_id}/tasks", status_code=status.HTTP_200_OK)
def delete_course_tasks(
    course_id: int,
    _user: dict = Depends(_require_dev),
    db: Session = Depends(get_db),
) -> dict:
    """Delete all tasks (activities + submissions) for a course and reset student counters."""
    import sqlalchemy

    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Course not found")

    students = db.query(Student).filter(Student.course_id == course_id).all()
    student_ids = [s.id for s in students]
    if not student_ids:
        return {"deleted_tasks": 0, "course_id": course_id}

    activities = (
        db.query(Activity)
        .filter(Activity.student_id.in_(student_ids))
        .filter(Activity.type.isnot(None))
        .all()
    )

    submission_ids = [a.submission_id for a in activities if a.submission_id]
    for sid in submission_ids:
        db.execute(sqlalchemy.text("DELETE FROM chat_sessions WHERE submission_id = :sid"), {"sid": sid})
        db.execute(sqlalchemy.text("DELETE FROM submissions WHERE id = :sid"), {"sid": sid})

    deleted = (
        db.query(Activity)
        .filter(Activity.student_id.in_(student_ids))
        .filter(Activity.type.isnot(None))
        .delete(synchronize_session=False)
    )

    for student in students:
        student.tasks_completed = 0
        student.tasks_total = 0
        student.last_activity = None

    db.commit()
    return {"deleted_tasks": deleted, "course_id": course_id}

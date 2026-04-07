from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import Course, Student, User

router = APIRouter(prefix="/api/v1", tags=["courses"])


@router.get("/courses")
def list_courses(
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list:
    db_user = db.query(User).filter(User.sub == user.get("sub")).first()
    teacher_id = db_user.id if db_user else None
    query = db.query(Course)
    if teacher_id:
        query = query.filter(Course.teacher_id == teacher_id)
    courses = query.all()

    result = []
    for c in courses:
        student_count = db.query(Student).filter(Student.course_id == c.id).count()
        pending = db.query(Student).filter(
            Student.course_id == c.id, Student.status == "pendiente"
        ).count()
        result.append({
            "id": c.id,
            "name": c.name,
            "shift": c.shift,
            "student_count": student_count,
            "pending_corrections": pending,
        })
    return result


@router.get("/courses/{course_id}/students")
def list_students(
    course_id: int,
    filter: str = "todos",
    search: str = "",
    page: int = 1,
    limit: int = 6,
    _user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    query = db.query(Student).filter(Student.course_id == course_id)

    if filter == "pendientes":
        query = query.filter(Student.status == "pendiente")
    elif filter == "al_dia":
        query = query.filter(Student.status == "al_dia")

    if search:
        query = query.filter(Student.name.ilike(f"%{search}%"))

    total = query.count()
    students_db = query.offset((page - 1) * limit).limit(limit).all()

    students = [
        {
            "id": s.id,
            "name": s.name,
            "average": s.average,
            "tasks_completed": s.tasks_completed,
            "tasks_total": s.tasks_total,
            "last_activity": s.last_activity,
            "status": s.status,
        }
        for s in students_db
    ]
    return {"students": students, "total": total, "page": page, "limit": limit}

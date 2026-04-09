from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.auth.jwt import decode_token
from app.database import get_db
from app.models import Activity, Course, Student, User

router = APIRouter(prefix="/api/v1", tags=["courses"])


def _get_teacher(request: Request, db: Session) -> User | None:
    """Read JWT from Authorization header and return the matching User, or None."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    try:
        claims = decode_token(auth.split(" ", 1)[1])
    except ValueError:
        return None
    return db.query(User).filter(User.sub == claims.get("sub")).first()


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


@router.get("/courses/{course_id}/tasks")
def list_course_tasks(
    course_id: int,
    request: Request,
    db: Session = Depends(get_db),
) -> list:
    db_user = _get_teacher(request, db)
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course or not db_user or course.teacher_id != db_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    # Get distinct tasks by name+type+date (one row per task, not per student)
    students = db.query(Student).filter(Student.course_id == course_id).all()
    student_ids = [s.id for s in students]
    if not student_ids:
        return []

    # Use the first occurrence of each unique (name, type, date) to represent the task
    seen: set[tuple] = set()
    tasks: list[dict] = []
    activities = (
        db.query(Activity)
        .filter(Activity.student_id.in_(student_ids))
        .filter(Activity.type.isnot(None))
        .order_by(Activity.id.asc())
        .all()
    )
    for a in activities:
        key = (a.name, a.type, a.date)
        if key in seen:
            continue
        seen.add(key)
        total = sum(1 for s in student_ids if True)  # all students
        completed = sum(
            1 for act in activities
            if act.name == a.name and act.type == a.type and act.date == a.date
            and act.status == "COMPLETADA"
        )
        tasks.append({
            "id": a.id,
            "name": a.name,
            "type": a.type,
            "date": a.date,
            "progress": round(completed / len(student_ids) * 100) if student_ids else 0,
        })
    return tasks


class CreateTaskBody(BaseModel):
    name: str
    type: str
    description: str | None = None
    reading_text: str | None = None


@router.post("/courses/{course_id}/tasks", status_code=status.HTTP_201_CREATED)
def create_course_task(
    course_id: int,
    body: CreateTaskBody,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    db_user = _get_teacher(request, db)
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course or not db_user or course.teacher_id != db_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    students = db.query(Student).filter(Student.course_id == course_id).all()
    today = str(date.today())

    for student in students:
        activity = Activity(
            student_id=student.id,
            name=body.name,
            type=body.type,
            description=body.description,
            reading_text=body.reading_text,
            subject="Lengua",
            status="NO_ENTREGADO",
            date=today,
        )
        db.add(activity)
        student.tasks_total += 1

    db.commit()
    return {"tasks_created": len(students)}

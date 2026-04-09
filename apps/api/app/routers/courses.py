from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models import Activity, Course, Student, User
from app.models.submission import Submission

router = APIRouter(prefix="/api/v1", tags=["courses"])


@router.get("/courses")
def list_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list:
    courses = db.query(Course).filter(Course.teacher_id == current_user.id).all()

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
    _user: User = Depends(get_current_user),
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course or course.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    students = db.query(Student).filter(Student.course_id == course_id).all()
    student_ids = [s.id for s in students]
    if not student_ids:
        return []

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
    evaluation_criteria: str | None = None


@router.post("/courses/{course_id}/tasks", status_code=status.HTTP_201_CREATED)
def create_course_task(
    course_id: int,
    body: CreateTaskBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course or course.teacher_id != current_user.id:
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
            evaluation_criteria=body.evaluation_criteria,
            subject="Lengua",
            status="NO_ENTREGADO",
            date=today,
        )
        db.add(activity)
        student.tasks_total += 1

    db.commit()
    return {"tasks_created": len(students)}


@router.get("/courses/{course_id}/tasks/{task_id}/students")
def get_task_detail(
    course_id: int,
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course or course.teacher_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    ref_activity = db.query(Activity).filter(Activity.id == task_id).first()
    if not ref_activity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

    students = db.query(Student).filter(Student.course_id == course_id).all()

    rows = []
    for student in students:
        activity = (
            db.query(Activity)
            .filter(
                Activity.student_id == student.id,
                Activity.name == ref_activity.name,
                Activity.type == ref_activity.type,
            )
            .first()
        )

        metrics = None
        if activity and activity.status == "COMPLETADA" and activity.submission_id:
            sub = db.query(Submission).filter(Submission.id == activity.submission_id).first()
            if sub:
                ai = sub.ai_result or {}
                if ref_activity.type == "lectura":
                    ppm = ai.get("ppm")
                    precision = ai.get("precision")
                    metrics = {
                        "ppm": round(ppm) if ppm is not None else None,
                        "precision": round(precision) if precision is not None else None,
                        "requires_review": sub.requires_review,
                    }
                else:
                    metrics = {
                        "total_errors": sub.total_errors,
                        "spelling_errors": sub.spelling_errors,
                        "concordance_errors": sub.concordance_errors,
                        "requires_review": sub.requires_review,
                    }

        rows.append({
            "student_id": student.id,
            "activity_id": activity.id if activity else None,
            "name": student.name,
            "status": activity.status if activity else "NO_ENTREGADO",
            "metrics": metrics,
        })

    return {
        "task": {
            "name": ref_activity.name,
            "type": ref_activity.type,
            "date": ref_activity.date,
            "description": ref_activity.description,
            "reading_text": ref_activity.reading_text,
            "evaluation_criteria": ref_activity.evaluation_criteria,
        },
        "students": rows,
    }

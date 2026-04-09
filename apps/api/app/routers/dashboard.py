from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import require_docente
from app.database import get_db
from app.models import Activity, Alert, Course, Student, User

router = APIRouter(prefix="/api/v1", tags=["dashboard"])


@router.get("/dashboard")
def get_dashboard(
    current_user: User = Depends(require_docente),
    db: Session = Depends(get_db),
) -> dict:
    teacher_id = current_user.id

    # Alerts for this teacher
    alerts_query = db.query(Alert).filter(Alert.teacher_id == teacher_id)
    alerts = [
        {"id": a.id, "type": a.type, "severity": a.severity, "message": a.message}
        for a in alerts_query.all()
    ]

    # Courses summary (max 2) for this teacher
    courses_query = db.query(Course).filter(Course.teacher_id == teacher_id)
    courses_db = courses_query.limit(2).all()
    courses = []
    for c in courses_db:
        student_count = db.query(Student).filter(Student.course_id == c.id).count()
        averages = db.query(Student.average).filter(Student.course_id == c.id).all()
        avg = round(sum(a[0] for a in averages) / len(averages) * 10) if averages else 0
        courses.append({
            "id": c.id,
            "name": c.name,
            "shift": c.shift,
            "student_count": student_count,
            "average": avg,
        })

    # Recent activity: last 3 activities across all students in teacher's courses
    course_ids = [c.id for c in courses_db]
    student_ids = [
        s.id
        for s in db.query(Student.id).filter(Student.course_id.in_(course_ids)).all()
    ] if course_ids else []

    recent = []
    if student_ids:
        activities = (
            db.query(Activity, Student)
            .join(Student, Activity.student_id == Student.id)
            .filter(Activity.student_id.in_(student_ids))
            .order_by(Activity.id.desc())
            .limit(3)
            .all()
        )
        for act, stu in activities:
            initials = "".join(p[0].upper() for p in stu.name.split()[:2])
            recent.append({
                "student_name": stu.name,
                "initials": initials,
                "activity": act.name,
                "date": act.date,
                "status": act.status,
            })

    return {"alerts": alerts, "courses": courses, "recent_activity": recent}

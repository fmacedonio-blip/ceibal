from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.mock_data import COURSES, STUDENTS

router = APIRouter(prefix="/api/v1", tags=["courses"])


@router.get("/courses")
def list_courses(_user: dict = Depends(get_current_user)) -> list:
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "shift": c["shift"],
            "student_count": c["student_count"],
            "pending_corrections": c["pending_corrections"],
        }
        for c in COURSES
    ]


@router.get("/courses/{course_id}/students")
def list_students(
    course_id: str,
    filter: str = "todos",
    search: str = "",
    page: int = 1,
    limit: int = 6,
    _user: dict = Depends(get_current_user),
) -> dict:
    students = STUDENTS.get(course_id, [])

    if filter == "pendientes":
        students = [s for s in students if s["status"] == "pendiente"]
    elif filter == "al_dia":
        students = [s for s in students if s["status"] == "al_dia"]

    if search:
        students = [s for s in students if search.lower() in s["name"].lower()]

    total = len(students)
    start = (page - 1) * limit
    paginated = students[start : start + limit]

    return {"students": paginated, "total": total, "page": page, "limit": limit}

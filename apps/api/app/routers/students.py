from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.mock_data import STUDENT_DETAIL

router = APIRouter(prefix="/api/v1", tags=["students"])


@router.get("/students/{student_id}")
def get_student(
    student_id: str,
    _user: dict = Depends(get_current_user),
) -> dict:
    student = STUDENT_DETAIL.get(student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found",
        )
    return student

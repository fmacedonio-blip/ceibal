from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth.jwt import create_token
from app.config import settings
from app.database import get_db
from app.models import Student

router = APIRouter(prefix="/auth", tags=["auth"])

VALID_ROLES = {"docente", "alumno", "director", "inspector"}

DEV_USERS = {
    "docente":   {"id": "dev-docente-001",   "name": "Ana Martínez"},
    "director":  {"id": "dev-director-001",  "name": "Director Demo"},
    "inspector": {"id": "dev-inspector-001", "name": "Inspector Demo"},
}


class DevLoginRequest(BaseModel):
    role: Literal["docente", "alumno", "director", "inspector"]
    student_id: Optional[int] = None  # required when role=alumno


class DevLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


@router.post("/dev-login", response_model=DevLoginResponse)
def dev_login(body: DevLoginRequest, db: Session = Depends(get_db)) -> DevLoginResponse:
    if not settings.is_development:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    if body.role == "alumno":
        if body.student_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="student_id is required for role=alumno",
            )
        student = db.query(Student).filter(Student.id == body.student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with id={body.student_id} not found",
            )
        token = create_token(
            sub=str(student.student_uuid),
            role="alumno",
            name=student.name,
            extra_claims={
                "student_id": student.id,
                "student_uuid": str(student.student_uuid),
            },
        )
        return DevLoginResponse(
            access_token=token,
            token_type="bearer",
            user={
                "id": str(student.student_uuid),
                "name": student.name,
                "role": "alumno",
                "student_id": student.id,
                "student_uuid": str(student.student_uuid),
            },
        )

    user = DEV_USERS[body.role]
    token = create_token(sub=user["id"], role=body.role, name=user["name"])
    return DevLoginResponse(
        access_token=token,
        token_type="bearer",
        user={"id": user["id"], "name": user["name"], "role": body.role},
    )

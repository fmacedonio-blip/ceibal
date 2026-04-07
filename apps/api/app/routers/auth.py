from typing import Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.auth.jwt import create_token
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

VALID_ROLES = {"docente", "alumno", "director", "inspector"}

DEV_USERS = {
    "docente": {"id": "dev-docente-001", "name": "Docente Demo"},
    "alumno": {"id": "dev-alumno-001", "name": "Alumno Demo"},
    "director": {"id": "dev-director-001", "name": "Director Demo"},
    "inspector": {"id": "dev-inspector-001", "name": "Inspector Demo"},
}


class DevLoginRequest(BaseModel):
    role: Literal["docente", "alumno", "director", "inspector"]


class DevLoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


@router.post("/dev-login", response_model=DevLoginResponse)
def dev_login(body: DevLoginRequest) -> DevLoginResponse:
    if not settings.is_development:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)

    user = DEV_USERS[body.role]
    token = create_token(sub=user["id"], role=body.role, name=user["name"])

    return DevLoginResponse(
        access_token=token,
        token_type="bearer",
        user={"id": user["id"], "name": user["name"], "role": body.role},
    )

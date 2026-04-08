import uuid

from fastapi import APIRouter, Depends, HTTPException

_DEV_NAMESPACE = uuid.UUID("6ba7b810-9dad-11d1-80b4-00c04fd430c8")


def _sub_to_uuid(sub: str) -> uuid.UUID:
    """Convert JWT sub to UUID. Accepts real UUIDs or dev strings like 'dev-alumno-001'."""
    try:
        return uuid.UUID(sub)
    except ValueError:
        return uuid.uuid5(_DEV_NAMESPACE, sub)

from app.auth.dependencies import get_current_user
from app.database_async import get_async_db
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatMessageRequest,
    ChatMessageResponse,
    ChatStartResponse,
)
from app.services import chat_service

router = APIRouter(prefix="/api/v1", tags=["chat"])


@router.post("/submissions/{submission_id}/chat/start", response_model=ChatStartResponse, tags=["chat"])
async def start_chat(
    submission_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_async_db),
) -> ChatStartResponse:
    role = current_user.get("role", "")
    if role != "alumno":
        raise HTTPException(status_code=403, detail="Only alumno can start a chat session")

    student_id = _sub_to_uuid(current_user.get("sub", ""))
    return await chat_service.start_session(db, submission_id, student_id)


@router.post("/chat/{session_id}/message", response_model=ChatMessageResponse, tags=["chat"])
async def send_message(
    session_id: uuid.UUID,
    body: ChatMessageRequest,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_async_db),
) -> ChatMessageResponse:
    role = current_user.get("role", "")
    if role != "alumno":
        raise HTTPException(status_code=403, detail="Only alumno can send chat messages")

    student_id = _sub_to_uuid(current_user.get("sub", ""))
    return await chat_service.send_message(db, session_id, body.content, student_id)


@router.get("/chat/{session_id}/history", response_model=ChatHistoryResponse, tags=["chat"])
async def get_history(
    session_id: uuid.UUID,
    current_user: dict = Depends(get_current_user),
    db=Depends(get_async_db),
) -> ChatHistoryResponse:
    role = current_user.get("role", "")
    user_id = _sub_to_uuid(current_user.get("sub", ""))
    return await chat_service.get_history(db, session_id, user_id, role)

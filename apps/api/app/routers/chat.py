import uuid

from fastapi import APIRouter, Depends

from app.auth.dependencies import require_alumno
from app.database_async import get_async_db
from app.models import User
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatMessageRequest,
    ChatMessageResponse,
    ChatSessionLookupResponse,
    ChatStartResponse,
)
from app.services import chat_service

router = APIRouter(prefix="/api/v1", tags=["chat"])


@router.post("/submissions/{submission_id}/chat/start", response_model=ChatStartResponse, tags=["chat"])
async def start_chat(
    submission_id: uuid.UUID,
    _user: User = Depends(require_alumno),
    db=Depends(get_async_db),
) -> ChatStartResponse:
    return await chat_service.start_session(db, submission_id)


@router.post("/chat/{session_id}/message", response_model=ChatMessageResponse, tags=["chat"])
async def send_message(
    session_id: uuid.UUID,
    body: ChatMessageRequest,
    _user: User = Depends(require_alumno),
    db=Depends(get_async_db),
) -> ChatMessageResponse:
    return await chat_service.send_message(db, session_id, body.content)


@router.get("/submissions/{submission_id}/chat-session", tags=["chat"])
async def get_chat_session(
    submission_id: uuid.UUID,
    _user: User = Depends(require_alumno),
    db=Depends(get_async_db),
) -> dict:
    """Returns the active chat session for a submission, or {exists: false} if none."""
    session = await chat_service.get_session_for_submission(db, submission_id)
    if session is None:
        return {"exists": False, "session_id": None}
    return {
        "exists": True,
        "session_id": str(session.id),
        "turn_count": session.turn_count,
        "is_active": session.is_active,
    }


@router.get("/chat/{session_id}/history", response_model=ChatHistoryResponse, tags=["chat"])
async def get_history(
    session_id: uuid.UUID,
    _user: User = Depends(require_alumno),
    db=Depends(get_async_db),
) -> ChatHistoryResponse:
    return await chat_service.get_history(db, session_id)

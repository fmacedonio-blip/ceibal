import uuid

from fastapi import APIRouter, Depends

from app.database_async import get_async_db
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
    db=Depends(get_async_db),
) -> ChatStartResponse:
    return await chat_service.start_session(db, submission_id)


@router.post("/chat/{session_id}/message", response_model=ChatMessageResponse, tags=["chat"])
async def send_message(
    session_id: uuid.UUID,
    body: ChatMessageRequest,
    db=Depends(get_async_db),
) -> ChatMessageResponse:
    return await chat_service.send_message(db, session_id, body.content)


@router.get("/submissions/{submission_id}/chat-session", response_model=ChatSessionLookupResponse, tags=["chat"])
async def get_chat_session(
    submission_id: uuid.UUID,
    db=Depends(get_async_db),
) -> ChatSessionLookupResponse:
    session = await chat_service.get_session_for_submission(db, submission_id)
    return ChatSessionLookupResponse.from_session(session)


@router.get("/chat/{session_id}/history", response_model=ChatHistoryResponse, tags=["chat"])
async def get_history(
    session_id: uuid.UUID,
    db=Depends(get_async_db),
) -> ChatHistoryResponse:
    return await chat_service.get_history(db, session_id)

from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ChatMessageItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: str
    content: str
    created_at: datetime


class ChatStartResponse(BaseModel):
    session_id: uuid.UUID
    is_new: bool
    first_message: ChatMessageItem


class ChatMessageRequest(BaseModel):
    content: str


class ChatMessageResponse(BaseModel):
    message_id: uuid.UUID
    content: str
    turn_count: int
    is_active: bool


class ChatSessionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    submission_id: uuid.UUID
    student_id: uuid.UUID
    started_at: datetime
    last_message_at: datetime | None
    turn_count: int
    is_active: bool


class ChatHistoryResponse(BaseModel):
    session: ChatSessionInfo
    messages: list[ChatMessageItem]


class ChatSessionLookupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: uuid.UUID
    student_id: uuid.UUID
    turn_count: int
    is_active: bool
    started_at: datetime
    last_message_at: datetime | None

    @classmethod
    def from_session(cls, session: object) -> "ChatSessionLookupResponse":
        return cls(
            session_id=getattr(session, "id"),
            student_id=getattr(session, "student_id"),
            turn_count=getattr(session, "turn_count"),
            is_active=getattr(session, "is_active"),
            started_at=getattr(session, "started_at"),
            last_message_at=getattr(session, "last_message_at"),
        )

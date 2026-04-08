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

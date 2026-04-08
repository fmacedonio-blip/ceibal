from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import ChatMessage, ChatSession
from app.models.submission import Submission
from app.schemas.chat import (
    ChatHistoryResponse,
    ChatMessageItem,
    ChatMessageResponse,
    ChatSessionInfo,
    ChatStartResponse,
)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
CHAT_MODEL = "anthropic/claude-sonnet-4-6"
MAX_TURNS = 20

SOCRATIC_SYSTEM_PROMPT = """\
Sos un asistente pedagógico socrático que ayuda a niños de primaria a mejorar su escritura.

CONTEXTO DEL TEXTO DEL ALUMNO:
Transcripción: {transcripcion}
Errores identificados: {errores_resumidos}
Feedback inicial dado: {feedback_inicial}

REGLAS ABSOLUTAS:
1. NUNCA des la respuesta correcta directamente
2. SIEMPRE respondé con una pregunta abierta que guíe al alumno a descubrirla
3. Usá lenguaje simple, cálido y alentador, apropiado para niños de 8-12 años
4. Referenciá el texto del alumno para que la pregunta sea concreta
5. Máximo 2 oraciones por respuesta
6. Si el alumno da una respuesta correcta, celebrala y avanzá al siguiente error con otra pregunta
"""

AUDIO_SOCRATIC_SYSTEM_PROMPT = """\
Sos un asistente pedagógico socrático que ayuda a niños de primaria a mejorar su lectura en voz alta.

CONTEXTO DE LA LECTURA DEL ALUMNO:
Texto que debía leer: {texto_original}
Lo que se escuchó: {transcripcion}
Velocidad: {ppm} palabras por minuto
Precisión: {precision}%
Nivel orientativo: {nivel_orientativo}
Errores detectados: {errores_resumidos}
Feedback dado al alumno: {bloque_alumno}

REGLAS ABSOLUTAS:
1. NUNCA des la respuesta correcta directamente
2. SIEMPRE respondé con una pregunta abierta que guíe al alumno a descubrirla
3. Usá lenguaje simple, cálido y alentador, apropiado para niños de 8-12 años
4. Referenciá palabras concretas del texto para que la pregunta sea específica
5. Máximo 2 oraciones por respuesta
6. Si el alumno mejora su respuesta, celebralo y avanzá al siguiente error con otra pregunta
"""


def _build_audio_system_prompt(ai_result: dict[str, Any]) -> str:
    texto_original = ai_result.get("texto_original", "")
    transcripcion = ai_result.get("transcripcion", "")
    ppm = ai_result.get("ppm", 0)
    precision = ai_result.get("precision", 0)
    nivel_orientativo = ai_result.get("nivel_orientativo", "")
    bloque_alumno = ai_result.get("bloque_alumno", "")
    errores = ai_result.get("errores", [])
    errores_resumidos = "; ".join(
        f"{e.get('tipo', '')}: '{e.get('palabra_original', '')}' → '{e.get('lo_que_leyo', '')}'"
        for e in errores[:10]
        if e.get("tipo")
    )
    return AUDIO_SOCRATIC_SYSTEM_PROMPT.format(
        texto_original=texto_original,
        transcripcion=transcripcion,
        ppm=ppm,
        precision=precision,
        nivel_orientativo=nivel_orientativo,
        errores_resumidos=errores_resumidos or "sin errores detectados",
        bloque_alumno=bloque_alumno,
    )


def _build_system_prompt(ai_result: dict[str, Any], submission_type: str = "handwrite") -> str:
    if submission_type == "audio":
        return _build_audio_system_prompt(ai_result)
    transcripcion = ai_result.get("transcripcion", "")
    feedback_inicial = ai_result.get("feedback_inicial", "")
    errores = ai_result.get("errores_detectados_agrupados", [])
    errores_resumidos = "; ".join(
        f"{e.get('error_type', '')}: {e.get('text', '')}"
        for e in errores[:10]
        if e.get("error_type") and e.get("text")
    )
    return SOCRATIC_SYSTEM_PROMPT.format(
        transcripcion=transcripcion,
        errores_resumidos=errores_resumidos or "sin errores detectados",
        feedback_inicial=feedback_inicial,
    )


async def _call_openrouter(messages: list[dict[str, str]]) -> tuple[str, int]:
    """Call OpenRouter and return (content, tokens_used)."""
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY is not set")

    payload = {
        "model": CHAT_MODEL,
        "messages": messages,
        "max_tokens": 256,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            OPENROUTER_API_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
        )

    if response.status_code != 200:
        raise RuntimeError(f"OpenRouter returned HTTP {response.status_code}: {response.text}")

    data = response.json()
    content = data["choices"][0]["message"]["content"]
    tokens_used = data.get("usage", {}).get("total_tokens", 0)
    return content, tokens_used


async def start_session(
    db: AsyncSession,
    submission_id: uuid.UUID,
    student_id: uuid.UUID,
) -> ChatStartResponse:
    # Load submission
    result = await db.execute(select(Submission).where(Submission.id == submission_id))
    submission = result.scalar_one_or_none()
    if submission is None:
        raise HTTPException(status_code=404, detail="Submission not found")
    if submission.status == "error":
        raise HTTPException(status_code=422, detail="Submission processing failed — cannot start chat")
    if submission.status != "processed":
        raise HTTPException(status_code=422, detail="Submission is not yet processed")
    if submission.student_id != student_id:
        raise HTTPException(status_code=403, detail="Access denied")

    ai_result = submission.ai_result or {}
    sub_type = getattr(submission, "submission_type", None) or "handwrite"
    feedback_inicial = ai_result.get("bloque_alumno" if sub_type == "audio" else "feedback_inicial", "")

    # Idempotent: return existing active session if any
    existing = await db.execute(
        select(ChatSession).where(
            ChatSession.submission_id == submission_id,
            ChatSession.is_active.is_(True),
        )
    )
    session = existing.scalar_one_or_none()

    if session is not None:
        first_msg_result = await db.execute(
            select(ChatMessage)
            .where(ChatMessage.session_id == session.id, ChatMessage.role == "assistant")
            .order_by(ChatMessage.created_at)
            .limit(1)
        )
        first_msg = first_msg_result.scalar_one_or_none()

        # Orphaned session: commit was partial, first message was never saved
        if first_msg is None:
            now = datetime.now(timezone.utc)
            first_msg = ChatMessage(
                id=uuid.uuid4(),
                session_id=session.id,
                role="assistant",
                content=feedback_inicial,
                created_at=now,
            )
            try:
                db.add(first_msg)
                await db.commit()
            except Exception:
                await db.rollback()
                raise

        return ChatStartResponse(
            session_id=session.id,
            is_new=False,
            first_message=ChatMessageItem.model_validate(first_msg),
        )

    # Create new session
    now = datetime.now(timezone.utc)
    session = ChatSession(
        id=uuid.uuid4(),
        submission_id=submission_id,
        student_id=student_id,
        started_at=now,
        last_message_at=now,
        turn_count=0,
        is_active=True,
    )
    first_msg = ChatMessage(
        id=uuid.uuid4(),
        session_id=session.id,
        role="assistant",
        content=feedback_inicial,
        created_at=now,
    )

    try:
        db.add(session)
        await db.flush()   # INSERT chat_sessions before referencing its id in chat_messages
        db.add(first_msg)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return ChatStartResponse(
        session_id=session.id,
        is_new=True,
        first_message=ChatMessageItem.model_validate(first_msg),
    )


async def send_message(
    db: AsyncSession,
    session_id: uuid.UUID,
    content: str,
    current_student_id: uuid.UUID,
) -> ChatMessageResponse:
    # Load session
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")
    if session.student_id != current_student_id:
        raise HTTPException(status_code=403, detail="Access denied")
    if not session.is_active or session.turn_count >= MAX_TURNS:
        session.is_active = False
        await db.commit()
        raise HTTPException(status_code=422, detail="Chat session has ended (max turns reached)")

    # Load submission for system prompt
    sub_result = await db.execute(select(Submission).where(Submission.id == session.submission_id))
    submission = sub_result.scalar_one()
    submission_type = getattr(submission, "submission_type", None) or "handwrite"
    system_prompt = _build_system_prompt(submission.ai_result or {}, submission_type)

    # Load full history
    history_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    history = history_result.scalars().all()

    # Build messages array
    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})
    messages.append({"role": "user", "content": content})

    # Call AI
    assistant_content, tokens_used = await _call_openrouter(messages)

    now = datetime.now(timezone.utc)
    user_msg = ChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        role="user",
        content=content,
        created_at=now,
    )
    assistant_msg = ChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        role="assistant",
        content=assistant_content,
        created_at=now,
        tokens_used=tokens_used or None,
    )

    new_turn_count = session.turn_count + 1
    is_active = new_turn_count < MAX_TURNS

    try:
        db.add(user_msg)
        db.add(assistant_msg)
        session.turn_count = new_turn_count
        session.last_message_at = now
        session.is_active = is_active
        await db.commit()
    except Exception:
        await db.rollback()
        raise

    return ChatMessageResponse(
        message_id=assistant_msg.id,
        content=assistant_content,
        turn_count=new_turn_count,
        is_active=is_active,
    )


async def get_session_for_submission(
    db: AsyncSession,
    submission_id: uuid.UUID,
    current_user_id: uuid.UUID,
    current_role: str,
) -> ChatSession:
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.submission_id == submission_id)
        .order_by(ChatSession.started_at.desc())
        .limit(1)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="No chat session found for this submission")
    if current_role not in ("docente", "director", "inspector"):
        if session.student_id != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
    return session


async def get_history(
    db: AsyncSession,
    session_id: uuid.UUID,
    current_user_id: uuid.UUID,
    current_role: str,
) -> ChatHistoryResponse:
    result = await db.execute(select(ChatSession).where(ChatSession.id == session_id))
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Chat session not found")

    if current_role not in ("docente", "director", "inspector"):
        if session.student_id != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied")

    msgs_result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at)
    )
    messages = msgs_result.scalars().all()

    return ChatHistoryResponse(
        session=ChatSessionInfo.model_validate(session),
        messages=[ChatMessageItem.model_validate(m) for m in messages],
    )

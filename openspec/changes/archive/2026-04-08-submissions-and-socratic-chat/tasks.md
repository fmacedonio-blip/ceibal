## 1. Foundation — Dependencies & DB Setup

- [x] 1.1 Add `asyncpg` and `sqlalchemy[asyncio]` to `apps/api/requirements.txt`
- [x] 1.2 Create `apps/api/app/database_async.py` with `create_async_engine`, `AsyncSessionLocal`, and `get_async_db()` dependency
- [x] 1.3 Add `HANDWRITE_PIPELINE` setting (default `openrouter`) to `apps/api/app/config.py`

## 2. Models Refactor

- [x] 2.1 Create `apps/api/app/models/` folder with `__init__.py` that re-exports all existing models (so current imports don't break)
- [x] 2.2 Create `apps/api/app/models/base.py` with shared `Base = declarative_base()`
- [x] 2.3 Move existing 6 models (User, Course, Student, Activity, AiDiagnosis, Alert) to `apps/api/app/models/existing.py`, importing `Base` from `models/base.py`
- [x] 2.4 Create `apps/api/app/models/submission.py` with `Submission` and `SubmissionError` SQLAlchemy models (JSONB for `ai_result`, all columns per spec)
- [x] 2.5 Create `apps/api/app/models/chat.py` with `ChatSession` and `ChatMessage` SQLAlchemy models

## 3. Alembic Migration

- [x] 3.1 Create Alembic migration `alembic/versions/XXXX_add_submissions_and_chat.py` creating tables: `submissions`, `submission_errors`, `chat_sessions`, `chat_messages`
- [x] 3.2 Add all 7 indexes in the migration: composite indexes on `submission_errors`, partial index on `submissions(class_id, requires_review)`, GIN index on `submissions.ai_result`
- [x] 3.3 Run `alembic upgrade head` and verify tables are created correctly

## 4. Pydantic Schemas

- [x] 4.1 Create `apps/api/app/schemas/submission.py` with request (`AnalyzeRequest`) and response models (`SubmissionAnalyzeResponse`, `SubmissionDetailResponse`, `DashboardStudentRow`, `ErrorPattern`, `ProgressPoint`)
- [x] 4.2 Create `apps/api/app/schemas/chat.py` with `ChatStartResponse`, `ChatMessageRequest`, `ChatMessageResponse`, `ChatHistoryResponse`
- [x] 4.3 Ensure `SubmissionDetailResponse.ai_result` is typed as `dict` (not `str`) so FastAPI serializes it as a JSON object

## 5. Pipeline Abstraction

- [x] 5.1 Rewrite `apps/api/app/services/handwrite_analyze.py` as async: wrap the existing sync pipeline call with `asyncio.to_thread()` and a 60s timeout via `asyncio.wait_for()`
- [x] 5.2 Add pipeline switch logic: if `settings.handwrite_pipeline == "aws"` import and call `handwrite_pipeline_aws` (stub that raises `NotImplementedError` for now); default to existing `handwrite_pipeline`
- [x] 5.3 Validate `HANDWRITE_PIPELINE` value at startup in `config.py` (raise `ValueError` if not in `{"openrouter", "aws"}`)

## 6. Submission Service

- [x] 6.1 Create `apps/api/app/services/submission_service.py` with `persist_result(db, submission_data, output_final) -> Submission` — computes flat metrics (total_errors, spelling_errors, concordance_errors, avg_confidence, requires_review, lectura_insuficiente), inserts Submission + SubmissionErrors in one transaction
- [x] 6.2 Implement `get_submission(db, submission_id, current_user) -> Submission` with 404/403 checks
- [x] 6.3 Implement `get_classroom_dashboard(db, class_id, desde, hasta) -> list[DashboardStudentRow]` using bound parameters
- [x] 6.4 Implement `get_error_patterns(db, class_id, dias) -> list[ErrorPattern]` using bound parameters
- [x] 6.5 Implement `get_student_progress(db, student_id) -> list[ProgressPoint]` aggregated by ISO week

## 7. Chat Service

- [x] 7.1 Create `apps/api/app/services/chat_service.py` with `start_session(db, submission_id, student_id) -> ChatStartResponse` — idempotent (returns existing active session if found)
- [x] 7.2 Implement `send_message(db, session_id, content, current_user) -> ChatMessageResponse`:
  - Load full `chat_messages` history for session
  - Load `submission.ai_result` and build socratic system prompt with `{transcripcion}`, `{errores_resumidos}`, `{feedback_inicial}` substituted
  - Build `messages[]` array: system + full history + new user message
  - Call OpenRouter via existing `client.chat_completion` (async-wrapped)
  - Insert user message + assistant response in DB
  - Update `last_message_at` and `turn_count`
  - If `turn_count >= 20`, set `is_active = False`, return 422
- [x] 7.3 Implement `get_history(db, session_id, current_user) -> ChatHistoryResponse` with 403 check (alumno can only see own sessions; docente sees all)

## 8. Routers

- [x] 8.1 Create `apps/api/app/routers/submissions.py` with endpoints:
  - `POST /api/v1/submissions/analyze` (multipart: file + class_id + grade + student_id)
  - `GET /api/v1/submissions/{submission_id}`
  - `GET /api/v1/classroom/{class_id}/dashboard`
  - `GET /api/v1/classroom/{class_id}/error-patterns`
  - `GET /api/v1/students/{student_id}/progress`
  - All with `Depends(get_current_user)` and OpenAPI tags `["submissions"]` / `["dashboard"]`
- [x] 8.2 Create `apps/api/app/routers/chat.py` with endpoints:
  - `POST /api/v1/submissions/{submission_id}/chat/start`
  - `POST /api/v1/chat/{session_id}/message`
  - `GET /api/v1/chat/{session_id}/history`
  - All with `Depends(get_current_user)` and OpenAPI tag `["chat"]`

## 9. Wire Up

- [x] 9.1 Register `submissions_router` and `chat_router` in `apps/api/app/main.py`
- [x] 9.2 Update `models/__init__.py` to import from `submission.py` and `chat.py` so Alembic autogenerate sees the new models
- [x] 9.3 Update Alembic `env.py` target_metadata to import from `app.models` (the refactored package)

## 10. Smoke Test

- [x] 10.1 Start the API (`uvicorn app.main:app --reload`) and verify `/docs` shows all new endpoints
- [ ] 10.2 Test `POST /api/v1/submissions/analyze` with a real image via Swagger or curl — verify DB row is inserted with `status='processed'` and `ai_result` populated
- [ ] 10.3 Test `POST /api/v1/submissions/{id}/chat/start` — verify `chat_sessions` row created and feedback returned
- [ ] 10.4 Test `POST /api/v1/chat/{session_id}/message` with a user message — verify assistant response is a question (socratic), and `chat_messages` has 2 new rows
- [ ] 10.5 Test `GET /api/v1/classroom/{class_id}/dashboard` — verify aggregated metrics per student
<!-- End-to-end smoke tests (10.2–10.5) require real image + OPENROUTER_API_KEY — to be done manually -->

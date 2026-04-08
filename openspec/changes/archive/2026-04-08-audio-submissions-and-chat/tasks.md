## 1. DB Migration

- [x] 1.1 Create Alembic migration `alembic/versions/XXXX_add_submission_type.py` adding `submission_type TEXT DEFAULT 'handwrite'` to `submissions` table
- [x] 1.2 Run `alembic upgrade head` via Docker and verify column exists

## 2. Config

- [x] 2.1 Add `AUDIO_PIPELINE` setting (default `openrouter`) to `apps/api/app/config.py` with startup validation (same pattern as `HANDWRITE_PIPELINE`)

## 3. Audio Service — async + pipeline switch

- [x] 3.1 Rewrite `apps/api/app/services/audio_analyze.py` as async: wrap sync pipeline with `asyncio.to_thread()` and 90s timeout via `asyncio.wait_for()`
- [x] 3.2 Add pipeline switch: if `settings.audio_pipeline == "aws"` raise `NotImplementedError`; default to existing `audio_pipeline`
- [x] 3.3 Update `apps/api/app/routers/audio_analyze.py` to `await analyze(...)` (same fix applied to handwrite router)

## 4. Submission Service — support audio type

- [x] 4.1 Add `submission_type: str = "handwrite"` parameter to `persist_result()` in `submission_service.py`
- [x] 4.2 Add `_compute_audio_metrics(output: OutputFinalAudio)` function: `total_errors=len(errores)`, `spelling_errors=sustitucion count`, `concordance_errors=0`, `avg_confidence=precision/100`, `requires_review=calidad_audio_baja`, `lectura_insuficiente=calidad_audio_baja`
- [x] 4.3 Pass `submission_type` to the `Submission` constructor in `persist_result()`

## 5. Schemas

- [x] 5.1 Add `AudioSubmissionAnalyzeResponse` to `apps/api/app/schemas/submission.py` with fields: `submission_id`, `status`, `bloque_alumno`, `nivel_orientativo`, `ppm`, `precision`, `total_errors`, `requires_review`

## 6. Router — new analyze-audio endpoint

- [x] 6.1 Add `POST /api/v1/submissions/analyze-audio` to `apps/api/app/routers/submissions.py`:
  - Fields: `file (UploadFile)`, `student_id (UUID)`, `class_id (UUID)`, `grade (int)`, `texto_original (str)`, `nombre (str)`
  - Validate audio content type and grade
  - Call async `audio_service.analyze()`
  - Inject `texto_original` and `nombre` into `ai_result` dict before persisting
  - Call `submission_service.persist_result(..., submission_type="audio")`
  - Return `AudioSubmissionAnalyzeResponse`

## 7. Chat Service — audio system prompt branch

- [x] 7.1 Add `AUDIO_SOCRATIC_SYSTEM_PROMPT` constant to `chat_service.py` (exact text from design.md)
- [x] 7.2 Add `_build_audio_system_prompt(ai_result: dict) -> str` function using `texto_original`, `transcripcion`, `ppm`, `precision`, `nivel_orientativo`, `errores`, `bloque_alumno`
- [x] 7.3 Modify `_build_system_prompt()` to accept `submission_type` and branch: `"audio"` → `_build_audio_system_prompt()`, else → existing handwrite prompt
- [x] 7.4 Load `submission.submission_type` in `send_message()` and pass to `_build_system_prompt()` (default `"handwrite"` if null)

## 8. Smoke Test

- [x] 8.1 Rebuild Docker container and verify API starts clean
- [ ] 8.2 Test `POST /api/v1/submissions/analyze-audio` with a real audio file — verify DB row with `submission_type='audio'`
- [ ] 8.3 Test `POST /api/v1/submissions/{id}/chat/start` on an audio submission — verify `bloque_alumno` returned as first message
- [ ] 8.4 Test `POST /api/v1/chat/{session_id}/message` — verify response is a socratic question about lectura oral

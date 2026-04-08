## 1. Backend — DB Model & Migration

- [x] 1.1 Add `submission_id = Column(UUID(as_uuid=True), nullable=True)` to the `Activity` model in `apps/api/app/models/existing.py`
- [x] 1.2 Generate Alembic migration: `alembic revision --autogenerate -m "add submission_id to activities"` and verify the generated file adds only `ADD COLUMN submission_id UUID`
- [x] 1.3 Run `alembic upgrade head` to apply the migration

## 2. Backend — submission_service

- [x] 2.1 Add optional `activity_id: int | None = None` parameter to `persist_result` in `apps/api/app/services/submission_service.py`
- [x] 2.2 After the async commit of `Submission`, open a sync `SessionLocal` and update the matching `Activity` (status → `PENDIENTE_DE_REVISION`, `submission_id` → new UUID) and increment `Student.tasks_completed += 1`; wrap in try/except and log on failure without re-raising

## 3. Backend — Submission Endpoints

- [x] 3.1 Add optional `activity_id: int = Form(None)` to `analyze_submission` in `apps/api/app/routers/submissions.py` and forward to `persist_result`
- [x] 3.2 Add optional `activity_id: int = Form(None)` to `analyze_submission_aws` and forward to `persist_result`
- [x] 3.3 Add optional `activity_id: int = Form(None)` to `analyze_audio_submission` and forward to `persist_result`
- [x] 3.4 Add optional `activity_id: int = Form(None)` to `analyze_audio_submission_aws` and forward to `persist_result`

## 4. Backend — Read Endpoints

- [x] 4.1 Update `GET /api/v1/students/{id}` in `apps/api/app/routers/students.py` to include `"submission_id": str(a.submission_id) if a.submission_id else None` in each activity_history item
- [x] 4.2 Update `GET /api/v1/me/tasks` in `apps/api/app/routers/me.py` to return `"submission_id": str(a.submission_id) if a.submission_id else None` (remove the existing TODO comment)

## 5. Frontend — Types

- [x] 5.1 Add `submission_id?: string | null` to the `ActivityHistory` type in `apps/web/src/types/api.ts`
- [x] 5.2 Add `submission_id?: string | null` to the `Task` type in `apps/web/src/types/alumno.ts`

## 6. Frontend — Alumno Submission

- [x] 6.1 Add `activityId: number` parameter to `submitWriting` in `apps/web/src/api/alumno.ts` and append `form.append('activity_id', String(activityId))`
- [x] 6.2 Add `activityId: number` parameter to `submitAudio` in `apps/web/src/api/alumno.ts` and append `form.append('activity_id', String(activityId))`
- [x] 6.3 Pass `Number(taskId)` as `activityId` in the `handleSubmit` call inside `apps/web/src/pages/alumno/TareaEscritura/TareaEscritura.tsx`
- [x] 6.4 Pass `Number(taskId)` as `activityId` in the submit handler inside `apps/web/src/pages/alumno/TareaLectura/TareaLectura.tsx`

## 7. Frontend — ActivityDetail (Docente)

- [x] 7.1 Add a `getCorrection` API call import and a `correction` state (`WritingCorrectionResponse | AudioCorrectionResponse | null`) to `ActivityDetail.tsx`
- [x] 7.2 In the `useEffect`, after loading the activity, if `activity.submission_id` is present fetch `GET /api/v1/submissions/{submission_id}/correction` and store the result
- [x] 7.3 Replace the `isCorrected` condition with `hasSubmission = !!activity.submission_id` throughout the component
- [x] 7.4 Update "Transcripción Inteligente" section: render `correction.alumno.transcripcion_html` via `dangerouslySetInnerHTML` when `submission_type === 'handwrite'` and `correction` is loaded
- [x] 7.5 Update "Feedback Entregado al Alumno" section: render `correction.alumno.feedback` when `correction` is loaded
- [x] 7.6 Update "Diagnóstico IA" panel (handwrite): render `correction.docente.errores` in the OBSERVACIONES card and `correction.docente.puntos_de_mejora` in the SUGERENCIAS card
- [x] 7.7 Implement audio variant in "Diagnóstico IA" panel: show `ppm`, `precision`, `nivel_orientativo` and `correction.docente.errores` list when `submission_type === 'audio'`
- [x] 7.8 Apply Figma visual corrections: panel gradient `linear-gradient(128deg, #faf5ff, #eff6ff)`, error label color `#e7000b`, recommendation label color `#155dfc`

## 8. Seed & Verification

- [x] 8.1 Run `docker compose up -d`, then `alembic upgrade head` and `python -m app.seed` to apply migration and repopulate fixtures
- [x] 8.2 Manually test the full flow: login as alumno → submit a writing task → verify activity status changes to `PENDIENTE_DE_REVISION` in the DB
- [x] 8.3 Login as docente → open StudentDetail → click the activity → verify ActivityDetail renders real IA data

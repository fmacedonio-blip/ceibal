## Why

When a student submits a task (handwriting or audio), the AI analysis is persisted in the `submissions` table — but the corresponding `Activity` record is never updated. The docente sees stale hardcoded data in the student's activity history, and the `ActivityDetail` screen shows placeholders instead of real IA results. The two data worlds (legacy MVP tables and the submission pipeline) need to be connected.

## What Changes

- Add `submission_id` (UUID, nullable) column to the `activities` table via Alembic migration.
- Extend all four submission endpoints (`/analyze`, `/analyze-aws`, `/analyze-audio`, `/analyze-audio-aws`) to accept an optional `activity_id: int` form field.
- In `submission_service.persist_result`: when `activity_id` is provided, update the matching `Activity` (status → `PENDIENTE_DE_REVISION`, `submission_id` = new UUID) and increment `Student.tasks_completed`.
- Update `GET /api/v1/students/{id}` to include `submission_id` in each `activity_history` item.
- Update `GET /api/v1/me/tasks` to return the real `submission_id` (removes existing TODO).
- Frontend: `submitWriting` and `submitAudio` in `alumno.ts` accept and forward `activityId`; `TareaEscritura` and `TareaLectura` pass `taskId` as `activity_id`.
- `ActivityDetail` (docente, Figma node `52:1271`): when `submission_id` is present, load `GET /api/v1/submissions/{id}/correction` and render real transcription, student feedback, and docente diagnostic. Update display condition from `status === 'CORREGIDA'` to `submission_id != null`.
- Visual polish on `ActivityDetail`: align gradient, label colors, and structure to Figma spec.

## Capabilities

### New Capabilities
- `activity-submission-link`: Linking a completed Submission to its parent Activity, updating status and counters, and exposing the link through existing read endpoints.

### Modified Capabilities
- `activity-detail`: The docente's ActivityDetail screen now loads and displays real submission data (transcription, student feedback, docente diagnostic) instead of static placeholders. Display condition changes from `CORREGIDA` to `submission_id != null`.
- `submission-persistence`: `persist_result` gains an optional `activity_id` parameter that triggers Activity and Student updates as a side effect.

## Impact

- **Backend**: `app/models/existing.py` (Activity), `app/services/submission_service.py`, `app/routers/submissions.py`, `app/routers/students.py`, `app/routers/me.py`, new Alembic migration.
- **Frontend**: `apps/web/src/api/alumno.ts`, `TareaEscritura.tsx`, `TareaLectura.tsx`, `ActivityDetail.tsx`, `apps/web/src/types/api.ts`.
- **Database**: `activities` table gains one nullable UUID column — backwards-compatible, no data loss.
- **No new dependencies**.

## Non-goals

- Updating `Student.average` (promedio) — hardcoded for now, out of scope.
- Allowing the docente to add notes or change the score from `ActivityDetail` — read-only view in this change.
- Audio variant of `ActivityDetail` Figma design — no design exists; a reasonable layout will be implemented following existing design tokens.
- Deletion or archival of submissions.
- Real-time notifications when a student submits.

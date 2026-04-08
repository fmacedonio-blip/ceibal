## Context

The project has two parallel data worlds:

1. **Legacy MVP tables** (`students`, `activities`, `courses` — integer PKs, SQLAlchemy sync session): seeded with mock data, read by all docente-facing endpoints.
2. **Submission pipeline tables** (`submissions`, `submission_errors` — UUID PKs, async SQLAlchemy session): populated when a student submits work through the AI analysis pipeline.

`Activity` has no reference to `Submission`. When `persist_result` runs, it saves analysis results to `submissions` but leaves the parent `Activity` untouched (`status = "NO_ENTREGADO"` forever). The docente's `ActivityDetail` screen reads `Activity` data and shows hardcoded placeholders.

The `submission_service.persist_result` function already uses the async DB session (`AsyncSession`), while `Activity` and `Student` live in the sync session world. This is the primary structural challenge.

## Goals / Non-Goals

**Goals:**
- Pass `activity_id` from the alumno frontend to all submission endpoints.
- After a successful submission, update `Activity.status → PENDIENTE_DE_REVISION` and `Activity.submission_id → submission.id`, and increment `Student.tasks_completed`.
- Expose `submission_id` in `GET /api/v1/students/{id}` and `GET /api/v1/me/tasks`.
- `ActivityDetail` (docente) loads and renders real submission data when `submission_id` is present.

**Non-Goals:**
- Updating `Student.average`.
- Docente editing/scoring from `ActivityDetail`.
- Real-time push notifications on submission.
- Audio variant of `ActivityDetail` in Figma (no design exists — implement with existing tokens).

## Decisions

### Decision 1: Update Activity inside `persist_result` using a second sync DB session

**Options considered:**
- A) Have `persist_result` (async) also update `Activity` using an async session. Requires migrating `Activity`/`Student` models to the async engine.
- B) Have `persist_result` return and let the router call a separate sync function to update `Activity`. Spreads the transactional concern across two places.
- C) Open a short-lived sync `SessionLocal` inside `persist_result` to update `Activity` and `Student` after committing the `Submission`. Keep it as a best-effort update (log on failure, don't rollback the submission).

**Decision: Option C.** Migrating all legacy models to async is out of scope. Option B splits the concern across router + service, making it easy to forget in the `-aws` variants. Option C keeps all side effects in one place and doesn't block on the async session. The Activity update is non-critical — a failed update should not roll back a completed AI analysis.

### Decision 2: `activity_id` as optional form field, not required

Making it required would break existing integrations and the standalone `-aws` endpoints used for testing. Optional with a silent no-op when absent is backwards-compatible and allows gradual adoption.

### Decision 3: Match Activity by explicit `activity_id`, not by student+type heuristic

A heuristic (find the most recent `NO_ENTREGADO` activity of matching type) is fragile — a student can have multiple pending tasks of the same type. Since the frontend already has `taskId` in the URL params, passing it explicitly is the correct approach.

### Decision 4: `ActivityDetail` fetches correction via `GET /api/v1/submissions/{id}/correction`

This endpoint already exists and returns both `alumno` and `docente` layers. No new endpoints needed. The frontend checks `activity.submission_id != null` to decide whether to fetch; if absent, it renders the current empty-state placeholders.

### Decision 5: Display condition change — `submission_id != null` replaces `status === 'CORREGIDA'`

`CORREGIDA` is a terminal state (after docente review). The new trigger is earlier — as soon as a submission exists. This means the docente sees IA results as soon as the student submits, regardless of whether they've formally corrected it.

## Data Model Change

```sql
ALTER TABLE activities ADD COLUMN submission_id UUID;
-- nullable, no FK constraint (cross-schema integrity managed in app layer)
```

SQLAlchemy model addition:
```python
submission_id = Column(UUID(as_uuid=True), nullable=True)
```

## API Contract

### Modified endpoints — new optional form field

All four submission endpoints gain:
```
activity_id: int (Form, optional, default=None)
```

### Modified responses

**`GET /api/v1/students/{id}`** — `activity_history` items:
```json
{
  "id": 3,
  "name": "Dictado: El río y el mar",
  "date": "Hoy, 10:45",
  "score": null,
  "status": "PENDIENTE_DE_REVISION",
  "submission_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**`GET /api/v1/me/tasks`** — task items:
```json
{
  "id": 3,
  "name": "Dictado: El río y el mar",
  "type": "escritura",
  "status": "PENDIENTE_DE_REVISION",
  "submission_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
}
```

**`GET /api/v1/submissions/{id}/correction`** — existing endpoint, no changes. Already returns:
```json
{
  "submission_id": "...",
  "submission_type": "handwrite",
  "status": "processed",
  "alumno": {
    "feedback": "...",
    "transcripcion_html": "...",
    "errores": [...],
    "sugerencias_socraticas": [...],
    "consejos": [...]
  },
  "docente": {
    "razonamiento": "...",
    "errores": [...],
    "puntos_de_mejora": [...],
    "requires_review": false
  }
}
```

## Frontend — ActivityDetail rendering logic

```
activity loaded
    │
    ├── submission_id == null
    │       └── render empty-state placeholders (current behavior)
    │
    └── submission_id != null
            │
            ├── fetch GET /api/v1/submissions/{submission_id}/correction
            │
            ├── submission_type == "handwrite"
            │       ├── "Original del Alumno": placeholder (S3 image not proxied in MVP)
            │       ├── "Transcripción Inteligente": render correction.alumno.transcripcion_html
            │       │     (dangerouslySetInnerHTML — HTML contains <mark> tags)
            │       ├── "Feedback Entregado al Alumno": correction.alumno.feedback
            │       └── "Diagnóstico IA" sidebar:
            │             ├── OBSERVACIONES: correction.docente.errores (list)
            │             └── SUGERENCIAS: correction.docente.puntos_de_mejora (list)
            │
            └── submission_type == "audio"
                    ├── "Original del Alumno": audio player (blob URL not available — placeholder)
                    ├── "Transcripción": texto_original + errores de lectura marcados
                    ├── "Feedback Entregado al Alumno": correction.alumno.feedback
                    └── "Diagnóstico IA" sidebar:
                          ├── PPM, precisión, nivel orientativo
                          └── errores de lectura (lista)
```

## Figma alignment changes for ActivityDetail

| Element | Current code | Figma spec |
|---|---|---|
| Diagnóstico IA panel bg | `#fff` solid | `linear-gradient(128deg, #faf5ff, #eff6ff)` |
| "ERRORES DETECTADOS" label color | `#dc2626` | `#e7000b` |
| "RECOMENDACIÓN" label color | `#3b82f6` | `#155dfc` |
| Display condition | `status === 'CORREGIDA'` | `submission_id != null` |

## Risks / Trade-offs

- **Two DB sessions in one request**: `persist_result` uses `AsyncSession` for the Submission, then opens a sync `SessionLocal` for the Activity update. This means the Activity update runs outside the async transaction. If it fails, the Submission is already committed and the Activity stays at `NO_ENTREGADO`. Mitigation: log the error prominently; the submission data is not lost and the docente can still access it via submission ID if exposed.

- **`dangerouslySetInnerHTML` for `transcripcion_html`**: The HTML comes from the backend AI pipeline and contains `<mark>` and `<error>` tags. Content is AI-generated (not user input), so XSS risk is low. Mitigation: strip unknown tags server-side if needed in a future hardening pass.

- **No FK constraint on `activities.submission_id`**: Cross-schema referential integrity is not enforced at DB level (integer vs UUID primary key tables). Mitigation: enforced in application logic; acceptable for MVP scale.

## Migration Plan

1. Generate Alembic migration: `alembic revision --autogenerate -m "add submission_id to activities"`.
2. Review generated migration — verify it's `ADD COLUMN submission_id UUID` with no data loss.
3. Run `alembic upgrade head` (or restart Docker which runs migrations on boot if configured).
4. Re-run `python -m app.seed` to repopulate fixtures (seed truncates tables, migration is additive).
5. Deploy backend, then frontend.

**Rollback**: `alembic downgrade -1` drops the column. No data migration needed (column is nullable and new).

## Open Questions

- Should `tasks_completed` be decremented if a submission is deleted? (Out of scope for MVP — no deletion endpoint exists.)
- Should the `ActivityDetail` show the S3 image for handwriting? Requires a presigned URL endpoint. Deferred — show placeholder for now.

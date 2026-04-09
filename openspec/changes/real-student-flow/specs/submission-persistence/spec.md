## MODIFIED Requirements

### Requirement: Analyze and persist handwriting submission
The system SHALL accept a handwriting image via `POST /api/v1/submissions/analyze`, run the existing `handwrite_pipeline`, persist the full `OutputFinal` result in the `submissions` table as JSONB, and return a summary response including `submission_id` and `feedback_inicial`. The endpoint SHALL additionally accept an optional `activity_id: int` form field. When provided, after persisting the submission the system SHALL update the matching `Activity` record (`status → COMPLETADA`, `submission_id → new UUID`) and increment `Student.tasks_completed` as a best-effort side effect.

#### Scenario: Successful submission
- **WHEN** a valid image file, `class_id`, `grade`, and `student_id` are sent as multipart/form-data to `POST /api/v1/submissions/analyze` with a valid JWT
- **THEN** the system SHALL run the handwrite pipeline, INSERT a row in `submissions` with `status='processed'` and `ai_result` containing the full JSON blob, INSERT rows in `submission_errors` for each item in `errores_detectados_agrupados`, and return `{ submission_id, status, feedback_inicial, sugerencias_socraticas, total_errors, requires_review }`

#### Scenario: Successful submission with activity_id
- **WHEN** the request includes a valid `activity_id` in addition to the required fields
- **THEN** the system SHALL persist the Submission, then update `activities.id = activity_id` setting `status = 'COMPLETADA'` and `submission_id = <new UUID>`, and increment `students.tasks_completed`

#### Scenario: Pipeline error
- **WHEN** the pipeline raises an exception during processing
- **THEN** the system SHALL set `submissions.status = 'error'`, persist the partial row, and return HTTP 500 with an error detail

#### Scenario: Unsupported file type
- **WHEN** the uploaded file has a content type not in `{image/jpeg, image/png, image/webp, image/gif}`
- **THEN** the system SHALL return HTTP 415 without running the pipeline

#### Scenario: Atomic persistence
- **WHEN** the submission is processed successfully
- **THEN** the INSERT into `submissions` and all INSERTs into `submission_errors` SHALL occur in a single database transaction — if any insert fails, all are rolled back

## ADDED Requirements

### Requirement: Analyze and persist handwriting submission
The system SHALL accept a handwriting image via `POST /api/v1/submissions/analyze`, run the existing `handwrite_pipeline`, persist the full `OutputFinal` result in the `submissions` table as JSONB, and return a summary response including `submission_id` and `feedback_inicial`.

#### Scenario: Successful submission
- **WHEN** a valid image file, `class_id`, `grade`, and `student_id` are sent as multipart/form-data to `POST /api/v1/submissions/analyze` with a valid JWT
- **THEN** the system SHALL run the handwrite pipeline, INSERT a row in `submissions` with `status='processed'` and `ai_result` containing the full JSON blob, INSERT rows in `submission_errors` for each item in `errores_detectados_agrupados`, and return `{ submission_id, status, feedback_inicial, sugerencias_socraticas, total_errors, requires_review }`

#### Scenario: Pipeline error
- **WHEN** the pipeline raises an exception during processing
- **THEN** the system SHALL set `submissions.status = 'error'`, persist the partial row, and return HTTP 500 with an error detail

#### Scenario: Unsupported file type
- **WHEN** the uploaded file has a content type not in `{image/jpeg, image/png, image/webp, image/gif}`
- **THEN** the system SHALL return HTTP 415 without running the pipeline

#### Scenario: Atomic persistence
- **WHEN** the submission is processed successfully
- **THEN** the INSERT into `submissions` and all INSERTs into `submission_errors` SHALL occur in a single database transaction — if any insert fails, all are rolled back

---

### Requirement: Retrieve full submission detail
The system SHALL expose `GET /api/v1/submissions/{submission_id}` returning the full submission object including the `ai_result` JSONB deserialized as an object (not a string).

#### Scenario: Authorized access
- **WHEN** a user with role `alumno`, `docente`, or `director` requests a submission they have access to
- **THEN** the system SHALL return the full submission object with `ai_result` as a nested JSON object

#### Scenario: Submission not found
- **WHEN** the `submission_id` does not exist in the database
- **THEN** the system SHALL return HTTP 404

#### Scenario: Unauthorized access
- **WHEN** a user requests a submission belonging to a different student and they do not have `docente` or `director` role
- **THEN** the system SHALL return HTTP 403

---

### Requirement: Classroom dashboard metrics
The system SHALL expose `GET /api/v1/classroom/{class_id}/dashboard` returning per-student aggregated metrics filtered by date range.

#### Scenario: Default date range query
- **WHEN** a docente requests the dashboard for a class without date params
- **THEN** the system SHALL return all submissions for that class, grouped by student, with `{ student_id, name, entregas, total_errors, avg_confidence, requires_review }`

#### Scenario: Filtered date range
- **WHEN** `desde` and `hasta` query params are provided
- **THEN** the system SHALL only include submissions where `submitted_at` is within the range

#### Scenario: SQL injection prevention
- **WHEN** any query to the dashboard is executed
- **THEN** all parameters SHALL be bound via SQLAlchemy parameterized queries, never via f-strings or string interpolation

---

### Requirement: Class error pattern analysis
The system SHALL expose `GET /api/v1/classroom/{class_id}/error-patterns` returning the most frequent error types in the last N days.

#### Scenario: Default 30-day window
- **WHEN** a docente requests error patterns without a `dias` parameter
- **THEN** the system SHALL aggregate `submission_errors` for the last 30 days and return `[{ error_type, total_ocurrencias, alumnos_afectados }]` ordered by `total_ocurrencias` descending

#### Scenario: Custom window
- **WHEN** `dias=7` is provided
- **THEN** the system SHALL only include errors from the last 7 days

---

### Requirement: Student progress over time
The system SHALL expose `GET /api/v1/students/{student_id}/progress` returning weekly aggregated error and confidence metrics for chart rendering.

#### Scenario: Progress series
- **WHEN** a user requests progress for a student
- **THEN** the system SHALL return `[{ semana, promedio_errores, avg_confidence }]` ordered chronologically, with one entry per ISO week that has at least one submission

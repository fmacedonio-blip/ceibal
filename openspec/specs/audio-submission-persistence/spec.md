## ADDED Requirements

### Requirement: Analyze and persist audio submission
The system SHALL accept an audio file via `POST /api/v1/submissions/analyze-audio`, run the existing `audio_pipeline`, persist the full `OutputFinalAudio` result in `submissions.ai_result` with `submission_type='audio'`, and return a summary response.

#### Scenario: Successful audio submission
- **WHEN** a valid audio file, `class_id`, `grade`, `student_id`, `texto_original`, and `nombre` are sent as multipart/form-data with a valid JWT
- **THEN** the system SHALL run the audio pipeline, INSERT a row in `submissions` with `status='processed'`, `submission_type='audio'`, and `ai_result` containing the full `OutputFinalAudio` JSON plus `texto_original` and `nombre` fields, and return `{ submission_id, status, bloque_alumno, nivel_orientativo, ppm, precision, total_errors, requires_review }`

#### Scenario: Unsupported audio format
- **WHEN** the uploaded file content type is not in the allowed audio MIME types
- **THEN** the system SHALL return HTTP 415 without running the pipeline

#### Scenario: Empty texto_original
- **WHEN** `texto_original` is an empty string
- **THEN** the system SHALL return HTTP 400

#### Scenario: submission_type stored correctly
- **WHEN** an audio submission is persisted
- **THEN** `submissions.submission_type` SHALL be `'audio'` and existing handwrite rows SHALL remain `'handwrite'`

---

### Requirement: Audio submission detail via existing endpoint
The system SHALL return audio submission detail via the existing `GET /api/v1/submissions/{submission_id}` endpoint without any changes to that endpoint.

#### Scenario: Audio ai_result deserialized
- **WHEN** a docente or alumno requests an audio submission
- **THEN** the `ai_result` field SHALL contain the `OutputFinalAudio` shape as a JSON object, including `texto_original` and `nombre`

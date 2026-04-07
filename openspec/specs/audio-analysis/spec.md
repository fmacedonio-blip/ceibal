## ADDED Requirements

### Requirement: Analyze oral reading audio
The system SHALL expose a `POST /audio-analyze/` endpoint that accepts an audio file and returns transcription, fluency metrics, detected errors, and pedagogical feedback.

#### Scenario: Valid audio submission
- **WHEN** a client sends a multipart request with a valid audio file (mp3, wav, ogg, m4a, webm, flac), non-empty original text, student name, and course (3–6)
- **THEN** the system SHALL return a JSON response with transcription, PPM, accuracy percentage, detected error list, and teacher/student feedback blocks

#### Scenario: Invalid file type
- **WHEN** a client sends a file with an unsupported MIME type
- **THEN** the system SHALL return HTTP 422 with a descriptive error message

#### Scenario: Invalid course
- **WHEN** a client sends a course value outside the range 3–6
- **THEN** the system SHALL return HTTP 422

#### Scenario: Empty original text
- **WHEN** a client sends an empty or whitespace-only original text
- **THEN** the system SHALL return HTTP 422

#### Scenario: PPM out of plausible range
- **WHEN** the pipeline detects a PPM value outside 5–350
- **THEN** the system SHALL return HTTP 400 with a `ValueError` message indicating the value is implausible

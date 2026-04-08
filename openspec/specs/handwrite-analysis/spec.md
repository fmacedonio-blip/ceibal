## ADDED Requirements

### Requirement: Analyze handwritten image
The system SHALL expose a `POST /handwrite-analyze/` endpoint that accepts an image of handwritten work and returns detected errors, Socratic questions for the student, and pedagogical notes for the teacher.

#### Scenario: Valid image submission
- **WHEN** a client sends a multipart request with a valid image file (jpeg, jpg, png, webp, gif) and a course value (3–6)
- **THEN** the system SHALL return a JSON response with a list of detected errors (type, confidence, pedagogical explanation), Socratic questions, and teacher reasoning notes

#### Scenario: Invalid file type
- **WHEN** a client sends a file with an unsupported MIME type
- **THEN** the system SHALL return HTTP 422 with a descriptive error message

#### Scenario: Invalid course
- **WHEN** a client sends a course value outside the range 3–6
- **THEN** the system SHALL return HTTP 422

#### Scenario: Curriculum knowledge loaded at startup
- **WHEN** the service processes the first request
- **THEN** the `conocimiento_esperado.json` curriculum file SHALL be loaded and cached for subsequent requests (not reloaded per request)

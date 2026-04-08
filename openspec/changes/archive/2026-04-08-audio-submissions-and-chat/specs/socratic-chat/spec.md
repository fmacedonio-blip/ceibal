## MODIFIED Requirements

### Requirement: Send a message in a chat session
The system SHALL support chat sessions for both `handwrite` and `audio` submission types. The system prompt SHALL be constructed based on `submissions.submission_type`.

#### Scenario: Audio chat uses lectura oral system prompt
- **WHEN** a chat message is sent for a session linked to an `audio` submission
- **THEN** the system prompt SHALL use the audio socratic template with `texto_original`, `transcripcion`, `ppm`, `precision`, `nivel_orientativo`, `errores_resumidos`, and `bloque_alumno` from `submission.ai_result`

#### Scenario: Handwrite chat unchanged
- **WHEN** a chat message is sent for a session linked to a `handwrite` submission
- **THEN** the system prompt SHALL use the existing handwrite socratic template — behavior is unchanged

#### Scenario: Legacy submissions default to handwrite
- **WHEN** `submission.submission_type` is null (rows created before this migration)
- **THEN** the system SHALL treat them as `'handwrite'` and use the handwrite system prompt

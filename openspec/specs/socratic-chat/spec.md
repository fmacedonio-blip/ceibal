## ADDED Requirements

### Requirement: Start a chat session from a submission
The system SHALL expose `POST /api/v1/submissions/{submission_id}/chat/start` that creates a `chat_session` linked to the submission and returns the `feedback_inicial` as the first assistant message. If an active session already exists for the submission, it SHALL return that session instead of creating a new one (idempotent).

#### Scenario: New session created
- **WHEN** an alumno calls chat/start on a processed submission with no active session
- **THEN** the system SHALL INSERT a `chat_session` row, INSERT a `chat_messages` row with `role='assistant'` and `content=feedback_inicial`, and return `{ session_id, is_new: true, first_message: { role, content, created_at } }`

#### Scenario: Existing active session returned
- **WHEN** an alumno calls chat/start on a submission that already has an active session
- **THEN** the system SHALL return the existing session with `is_new: false` without creating duplicates

#### Scenario: Submission not processed
- **WHEN** the submission exists but `status != 'processed'`
- **THEN** the system SHALL return HTTP 422 with detail explaining the submission is not ready

---

### Requirement: Send a message in a chat session
The system SHALL expose `POST /api/v1/chat/{session_id}/message` that receives a user message, calls OpenRouter with the full conversation history and the socratic system prompt, persists both the user message and the assistant response, and returns the assistant's reply.

#### Scenario: Successful turn
- **WHEN** an alumno sends a message to an active session
- **THEN** the system SHALL load all prior `chat_messages` for the session, build the `messages[]` array with the system prompt and full history, call OpenRouter, INSERT the user message and assistant response in `chat_messages`, increment `turn_count`, update `last_message_at`, and return `{ message_id, content, turn_count, is_active }`

#### Scenario: Session limit reached
- **WHEN** `turn_count >= 20` at the time of the request
- **THEN** the system SHALL set `is_active = false`, NOT call OpenRouter, and return HTTP 422 with a message indicating the session has ended

#### Scenario: Assistant never gives direct answers
- **WHEN** the system prompt is constructed for any chat turn
- **THEN** it SHALL include the exact socratic system prompt defined in design.md, with `{transcripcion}`, `{errores_resumidos}`, and `{feedback_inicial}` substituted from `submission.ai_result`

#### Scenario: Full history passed to AI
- **WHEN** OpenRouter is called for any turn after the first
- **THEN** the `messages[]` array SHALL include all prior turns in chronological order, not just the latest message

#### Scenario: Token usage persisted
- **WHEN** OpenRouter returns usage data
- **THEN** the `tokens_used` field in the assistant's `chat_messages` row SHALL be set to the total tokens consumed

---

### Requirement: Retrieve chat history
The system SHALL expose `GET /api/v1/chat/{session_id}/history` returning the full message history of a session, accessible by the alumno who owns it or any docente.

#### Scenario: Alumno access
- **WHEN** the alumno who owns the session requests the history
- **THEN** the system SHALL return `{ session: { id, submission_id, turn_count, is_active }, messages: [{ role, content, created_at }] }` ordered by `created_at` ascending

#### Scenario: Docente access
- **WHEN** a docente requests the history of any session
- **THEN** the system SHALL return the same response — docentes have read access to all student chat histories

#### Scenario: Unauthorized access
- **WHEN** an alumno requests the history of a session belonging to a different student
- **THEN** the system SHALL return HTTP 403

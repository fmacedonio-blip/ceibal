## ADDED Requirements

### Requirement: Pipeline selection via environment variable
The system SHALL select the active handwriting analysis pipeline based on the `HANDWRITE_PIPELINE` environment variable (`openrouter` | `aws`). The default SHALL be `openrouter`.

#### Scenario: OpenRouter pipeline selected
- **WHEN** `HANDWRITE_PIPELINE=openrouter` (or unset)
- **THEN** `services/handwrite_analyze.analyze()` SHALL delegate to `handwrite_pipeline` (existing OpenRouter-based implementation)

#### Scenario: AWS pipeline selected
- **WHEN** `HANDWRITE_PIPELINE=aws`
- **THEN** `services/handwrite_analyze.analyze()` SHALL delegate to `handwrite_pipeline_aws` (future S3 + gateway-ai implementation)

#### Scenario: Unknown value
- **WHEN** `HANDWRITE_PIPELINE` is set to an unrecognized value
- **THEN** the system SHALL raise a `ValueError` at startup, not at request time

---

### Requirement: Stable analyze() function signature
The `analyze()` function in `services/handwrite_analyze.py` SHALL maintain a stable async signature that routers and services depend on, regardless of which pipeline is active underneath.

#### Scenario: Signature contract
- **WHEN** any router or service calls `analyze(image_bytes, content_type, curso, modelo)`
- **THEN** it SHALL always receive an `OutputFinal` object, regardless of whether the active pipeline is OpenRouter or AWS

#### Scenario: Sync pipeline wrapped async
- **WHEN** the OpenRouter pipeline (sync) is active
- **THEN** the service SHALL call it via `asyncio.to_thread()` to avoid blocking the event loop, with a 60-second timeout

---

### Requirement: Router and persistence layer are pipeline-agnostic
Neither `routers/submissions.py` nor `services/submission_service.py` SHALL contain any import or reference to `handwrite_pipeline` or `handwrite_pipeline_aws` directly.

#### Scenario: Pipeline swap has no ripple effect
- **WHEN** the active pipeline is switched from `openrouter` to `aws` via config
- **THEN** zero changes SHALL be required in any router, submission_service, or chat_service file

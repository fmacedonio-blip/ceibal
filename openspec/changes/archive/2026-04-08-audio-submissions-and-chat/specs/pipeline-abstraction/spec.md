## ADDED Requirements

### Requirement: Audio pipeline selection via environment variable
The system SHALL select the active audio analysis pipeline based on `AUDIO_PIPELINE` env var (`openrouter` | `aws`). Default: `openrouter`.

#### Scenario: OpenRouter pipeline selected
- **WHEN** `AUDIO_PIPELINE=openrouter` (or unset)
- **THEN** `services/audio_analyze.analyze()` SHALL delegate to the existing `audio_pipeline`

#### Scenario: Invalid value raises at startup
- **WHEN** `AUDIO_PIPELINE` is set to an unrecognized value
- **THEN** the system SHALL raise `ValueError` at startup, not at request time

---

### Requirement: Stable async analyze() signature for audio
The `analyze()` function in `services/audio_analyze.py` SHALL be async and maintain a stable signature regardless of which pipeline is active.

#### Scenario: Async wrapper with timeout
- **WHEN** `analyze()` is called
- **THEN** it SHALL wrap the sync pipeline via `asyncio.to_thread()` with a 90-second timeout via `asyncio.wait_for()`

#### Scenario: Router is pipeline-agnostic
- **WHEN** the active audio pipeline is switched via config
- **THEN** zero changes SHALL be required in `routers/submissions.py`

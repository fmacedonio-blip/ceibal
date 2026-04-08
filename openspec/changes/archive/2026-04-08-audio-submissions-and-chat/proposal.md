## Why

El pipeline de audio (`audio_pipeline`) analiza la lectura oral de alumnos pero su resultado se pierde — no se persiste en DB ni hay forma de hacer seguimiento. El chatbot socrático ya existe para handwrite y puede reutilizarse casi íntegramente para audio: la única diferencia es el system prompt con contexto de lectura oral.

## What Changes

- **Nuevo**: `POST /api/v1/submissions/analyze-audio` — recibe archivo de audio + texto original, corre el pipeline, persiste en DB con `submission_type='audio'`, devuelve resumen
- **Nuevo**: columna `submission_type TEXT DEFAULT 'handwrite'` en tabla `submissions` (migración Alembic)
- **Modificado**: `services/audio_analyze.py` — se hace async con `asyncio.to_thread()` + switch `AUDIO_PIPELINE=openrouter|aws`
- **Modificado**: `services/chat_service.py` — `_build_system_prompt()` agrega rama audio con system prompt socrático de lectura oral
- **Modificado**: `services/submission_service.py` — `persist_result()` acepta `submission_type` como parámetro
- **Modificado**: `app/config.py` — agrega `AUDIO_PIPELINE` setting con validación en startup
- **Modificado**: routers existente del audio `/audio-analyze/` — hacer async (igual que se hizo con handwrite)

## Capabilities

### New Capabilities
- `audio-submission-persistence`: Guardar el resultado del análisis de audio en DB con el mismo schema de submissions, exponer el detalle via `GET /api/v1/submissions/{id}`

### Modified Capabilities
- `socratic-chat`: El chat socrático ahora soporta dos tipos de submissions — handwrite (ya existente) y audio (nuevo), diferenciados por `submission_type`
- `pipeline-abstraction`: Extender el patrón de abstracción a `audio_analyze.py` con `AUDIO_PIPELINE=openrouter|aws`

## Impact

- **Archivos modificados**: `services/audio_analyze.py`, `services/chat_service.py`, `services/submission_service.py`, `config.py`, `routers/audio_analyze.py`, `routers/submissions.py`
- **Archivos nuevos**: `alembic/versions/XXXX_add_submission_type.py`, `schemas/submission.py` (AudioSubmissionAnalyzeResponse)
- **DB**: 1 columna nueva en `submissions`, migración Alembic
- **Sin tocar**: tablas `chat_sessions`, `chat_messages`, `submission_errors`, endpoints de chat

## Non-goals

- Pipeline `audio_pipeline_aws` (mismo patrón que handwrite_pipeline_aws, viene después)
- Métricas de dashboard específicas para audio (PPM trends, precision over time)
- Frontend del alumno para audio

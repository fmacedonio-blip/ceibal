## Why

El pipeline de análisis de escritura manuscrita ya produce diagnósticos pedagógicos completos (transcripción, errores, feedback), pero ese resultado se pierde en cada request — no se persiste en DB ni está disponible para el alumno después. Sin persistencia no hay historial, no hay métricas para el docente, y no hay base para el chat socrático.

## What Changes

- **Nuevo**: endpoint `POST /api/v1/submissions/analyze` — recibe imagen, corre el pipeline existente, persiste el resultado completo en DB y devuelve el feedback al cliente
- **Nuevo**: endpoints de consulta de submissions — detalle por ID, dashboard de métricas por clase, patrones de error, progreso del alumno
- **Nuevo**: flujo de chat socrático — el alumno puede iniciar una conversación con la IA a partir de una submission; el bot guía con preguntas, nunca da respuestas directas
- **Nuevo**: `database_async.py` — engine async (`asyncpg`) en paralelo al sync existente, solo para las features nuevas
- **Modificado**: `services/handwrite_analyze.py` — se hace async y se agrega un switch de pipeline (`HANDWRITE_PIPELINE=openrouter|aws`) para poder reemplazar el pipeline sin tocar el resto del código
- **Nuevo**: modelos SQLAlchemy para `Submission`, `SubmissionError`, `ChatSession`, `ChatMessage`
- **Nuevo**: migración Alembic con las 4 tablas nuevas e índices

## Capabilities

### New Capabilities
- `submission-persistence`: Guardar el resultado del análisis de IA en DB (submissions + submission_errors), exponer endpoints de consulta y métricas del dashboard
- `socratic-chat`: Chat conversacional socrático por submission — el alumno interactúa con la IA usando el contexto del análisis como base; historial persistido y accesible para el docente
- `pipeline-abstraction`: Capa de abstracción sobre el pipeline de análisis que permite switchear entre `handwrite_pipeline` (OpenRouter) y `handwrite_pipeline_aws` (S3 + gateway-ai) mediante config, sin modificar routers ni services de DB

### Modified Capabilities

_(ninguna — los routers y la lógica de auth existentes no cambian)_

## Impact

- **Archivos nuevos**: `database_async.py`, `models/submission.py`, `models/chat.py`, `schemas/submission.py`, `schemas/chat.py`, `services/submission_service.py`, `services/chat_service.py`, `routers/submissions.py`, `routers/chat.py`
- **Archivos modificados**: `services/handwrite_analyze.py` (async + pipeline switch), `app/main.py` (registrar nuevos routers), `models.py` → refactor a `models/` (sin cambios funcionales)
- **DB**: 4 tablas nuevas, 7 índices nuevos, migración Alembic
- **Dependencias nuevas**: `asyncpg`, `sqlalchemy[asyncio]`
- **No tocar**: routers existentes (auth, dashboard, courses, students), `audio_analyze.py` router, lógica de JWT, config de Alembic

## Non-goals

- Frontend del alumno (lo hace otro dev)
- Pipeline `handwrite_pipeline_aws` (viene en una iteración posterior)
- `audio_pipeline` async / switch (mismo patrón que handwrite, se aplica después)
- Upload directo a S3 desde el cliente (presigned URLs) — no en este MVP
- Notificaciones push al docente cuando hay revisión pendiente
- Agregados por escuela/distrito (rol director/inspector)

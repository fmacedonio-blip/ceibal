## Why

El flujo del alumno necesita una base de datos sólida y endpoints propios para funcionar. Hoy el backend tiene dos mundos desconectados: el modelo `Activity` (Integer IDs, gestionado por el docente) y el modelo `Submission` (UUID, usado por los pipelines de IA). El alumno necesita puentes entre ambos, datos semilla para probar el flujo completo, y respuestas enriquecidas de los pipelines adaptadas a su edad (8-12 años) que también sirvan al docente en su vista de revisión.

## What Changes

- **Modificado**: `Activity` model — agrega `description`, `type` (escritura | lectura) y `subject`
- **Modificado**: `Student` model — agrega `student_uuid: UUID` para bridgear con el sistema de Submissions
- **Nuevo**: migración Alembic con los campos nuevos y sus defaults
- **Nuevo**: seed ampliado — 1 docente, 3 alumnos con UUID, 2-3 tareas por alumno
- **Modificado**: `POST /auth/dev-login` — acepta `role=alumno` + `student_id` opcional; JWT incluye `student_uuid` como claim
- **Modificado**: `pipelines/handwrite_pipeline/models.py` — verifica que `ErrorDetectado` tenga `explicacion_pedagogica` (alumno) y `explicacion_docente` (docente) correctamente tipados
- **Modificado**: `pipelines/handwrite_pipeline/prompts.py` — ajuste de tono: campos `_pedagogica` en lenguaje accesible para 8-12 años; campos `_docente` con terminología técnica
- **Modificado**: `pipelines/audio_pipeline/models.py` — agrega `explicacion_alumno: str` y `explicacion_docente: str` a `ErrorLecturaOral`; agrega `consejos_para_mejorar: List[str]` a `OutputFinalAudio`
- **Modificado**: `pipelines/audio_pipeline/prompts.py` — call2 genera explicaciones por error en dos tonos + lista de consejos; tono `bloque_alumno` adaptado a 8-12 años
- **Modificado**: `schemas/submission.py` — `SubmissionCorrectionResponse` (escritura) expone `transcripcion_html`, `errores_detectados_agrupados`, `puntos_de_mejora`; `AudioCorrectionResponse` expone `errores` con explicaciones, `consejos_para_mejorar`, `alertas_fluidez`
- **Nuevo**: `GET /api/v1/me` — perfil del alumno logueado (nombre, curso, avatar seed)
- **Nuevo**: `GET /api/v1/me/tasks` — lista de tareas del alumno con estado (pendiente | entregada)
- **Nuevo**: `GET /api/v1/submissions/{id}/correction` — detalle de corrección enriquecido (datos del alumno + datos del docente)

## Capabilities

### New Capabilities
- `alumno-auth`: JWT con claim `student_uuid`; dev-login acepta rol alumno + student_id
- `alumno-tasks-api`: Endpoints `GET /me` y `GET /me/tasks` para el flujo del alumno
- `submission-correction-detail`: Endpoint que expone la corrección completa con las dos capas (alumno y docente)

### Modified Capabilities
- `audio-analysis`: Pipeline audio enriquecido con explicaciones por error en dos tonos
- `handwrite-analysis`: Prompts revisados para tono adecuado a 8-12 años en campos pedagógicos
- `submission-persistence`: Schemas de respuesta más ricos; datos anteriores no se rompen

## Impact

- **Archivos modificados**: `models/existing.py`, `auth/jwt.py` o `routers/auth.py`, `pipelines/handwrite_pipeline/models.py`, `pipelines/handwrite_pipeline/prompts.py`, `pipelines/audio_pipeline/models.py`, `pipelines/audio_pipeline/prompts.py`, `schemas/submission.py`, `seed.py`
- **Archivos nuevos**: migración Alembic, `routers/me.py`
- **DB**: 3 columnas nuevas en `activities`, 1 columna nueva en `students`, migración no destructiva
- **No tocar**: routers existentes de docente, lógica de cursos/dashboard, modelos de Submission/Chat

## Non-goals

- UI del alumno (está en `alumno-frontend`)
- Asignación de tareas por el docente desde la UI (viene después del POC)
- Upload a S3 real (sigue siendo sin storage en este change)
- Auth de producción con CAS (el dev-login mock es suficiente para el POC)
- Notificaciones push

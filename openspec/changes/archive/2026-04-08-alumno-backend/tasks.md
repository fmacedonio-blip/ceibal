# Tasks — alumno-backend

## DB & Modelos

- [x] **B1** Extender `Activity` en `models/existing.py`: agregar `description: Text (nullable)`, `type: String (nullable, "escritura"|"lectura")`, `subject: String (default="Lengua")`
- [x] **B2** Extender `Student` en `models/existing.py`: agregar `student_uuid: UUID (unique, default=uuid4)`
- [x] **B3** Crear migración Alembic para los campos nuevos (sin destructivos, con defaults seguros)
- [x] **B4** Actualizar `seed.py`: 1 docente, 3 alumnos con UUID fijo, 2 tareas por alumno (1 escritura + 1 lectura, status=`NO_ENTREGADO`)

## Auth

- [x] **B5** Modificar `POST /auth/dev-login`: acepta `role=alumno` + `student_id: int` en el body; busca el Student, incluye `student_uuid` y `student_id` en el JWT; respuesta incluye ambos en `user`

## Pipelines — Audio

- [x] **B6** Agregar a `ErrorLecturaOral` en `audio_pipeline/models.py`: `explicacion_alumno: str` y `explicacion_docente: str`
- [x] **B7** Agregar a `OutputFinalAudio` en `audio_pipeline/models.py`: `consejos_para_mejorar: List[str]`
- [x] **B8** Actualizar `audio_pipeline/prompts.py` (call2): generar `explicacion_alumno` (tono 8-12 años, alentador), `explicacion_docente` (técnico pedagógico), y `consejos_para_mejorar` por submission

## Pipelines — Escritura

- [x] **B9** Revisar `handwrite_pipeline/prompts.py`: ajustar tono de `explicacion_pedagogica` y `feedback_inicial` a lenguaje accesible para 8-12 años; verificar que `explicacion_docente` y `razonamiento_docente` mantienen tono técnico

## Schemas & Endpoints de corrección

- [x] **B10** Crear `CorrectionResponse` en `schemas/submission.py` con estructura dual `alumno` / `docente` según design.md
- [x] **B11** Agregar `GET /api/v1/submissions/{id}/correction` en `routers/submissions.py`: lee el `ai_result` JSONB, mapea a `CorrectionResponse`

## Endpoints del alumno

- [x] **B12** Crear `routers/me.py` con:
  - `GET /api/v1/me` — lee `student_uuid` del JWT, devuelve perfil del alumno
  - `GET /api/v1/me/tasks` — devuelve lista de activities del alumno con `submission_id` si existe
- [x] **B13** Registrar el router en `main.py`

## Validación

- [x] **B14** Verificar con Swagger (`/docs`) que todos los endpoints nuevos responden correctamente con el seed data
- [x] **B15** Testear el flujo completo: dev-login alumno → /me/tasks → /submissions/analyze → /submissions/{id}/correction

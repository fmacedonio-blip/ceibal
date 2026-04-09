## Context

El modal de creación de tareas (`NewTaskModal`) ya está implementado visualmente con un wizard de 2 pasos. El problema es que `handleCreate()` solo cierra el modal — no llama a ningún API. La DB ya tiene el esquema correcto (columnas `type`, `description`, `reading_text`, `subject`, `submission_id` en `activities`), pero `models.py` no las refleja. No existe ningún endpoint para crear tareas.

## Goals / Non-Goals

**Goals:**
- Actualizar `models.py` para reflejar el estado real de la DB
- Crear `POST /api/v1/courses/{course_id}/tasks` que persista la tarea para todos los alumnos del curso
- Conectar el modal al endpoint real con feedback de carga y error

**Non-Goals:**
- Migraciones de DB (los campos ya existen)
- Modificar el diseño visual del modal
- Asignación individual de tareas por alumno
- Edición o eliminación de tareas

## Decisions

### 1. Endpoint en `courses.py`, no en un router nuevo
El endpoint `POST /api/v1/courses/{course_id}/tasks` es una acción sobre un curso, igual que el GET de alumnos que ya existe en `courses.py`. No justifica un router separado.

### 2. Una `Activity` por alumno (fan-out en el servidor)
Cuando el docente crea una tarea, el backend itera los alumnos del curso y crea una `Activity` por cada uno. El frontend no necesita saber cuántos alumnos hay. Alternativa descartada: una entidad "TaskTemplate" compartida — agrega complejidad innecesaria para un POC.

### 3. `subject` hardcodeado a `"Lengua"`
Es un POC con una sola materia. No se expone en el modal ni en la API request.

### 4. Mapeo de campos según tipo
- `lectura`: `mainText` → `reading_text`, `description=None`
- `escritura`: `mainText` → `description`, `reading_text=None`
- `criteria` (opcional) no se persiste por ahora — el campo existe en el modal pero la DB no tiene columna dedicada. Se descarta silenciosamente.

### 5. `date` = fecha actual del servidor (ISO 8601, solo fecha)
Consistente con el formato string que ya usa el resto de activities en la DB.

### 6. Incremento de `tasks_total` en el mismo request
El campo `student.tasks_total` se incrementa en `+1` por cada alumno al crear la tarea. Es denormalización deliberada para no calcular siempre con un COUNT — patrón ya establecido en el proyecto.

### 7. `createTask()` en `apps/web/src/api/courses.ts` (nuevo archivo)
Las funciones de API del docente van separadas de `alumno.ts`. Si `courses.ts` no existe, se crea. Si ya existe, se agrega la función.

## Risks / Trade-offs

- **Fan-out síncrono**: si el curso tiene muchos alumnos, el INSERT masivo bloquea el request. Para un POC con ≤30 alumnos por curso es aceptable.
- **`tasks_total` puede desincronizarse**: si se borra una Activity directamente en la DB, el contador queda desactualizado. Riesgo aceptable para el POC.

## Migration Plan

No hay migración. Los campos ya existen en la DB. Solo se actualiza `models.py` para que SQLAlchemy los reconozca.

## Why

El modal "Nueva Tarea" existe en la UI del docente pero no hace nada al confirmar — `handleCreate()` cierra el modal sin persistir datos. El alumno ve siempre una lista vacía de tareas porque no existe ningún endpoint ni lógica para crearlas. Este change conecta el flujo de punta a punta.

## What Changes

- **`models.py` actualizado**: agregar los campos faltantes a `Activity` (`type`, `description`, `reading_text`, `subject`, `submission_id`) para reflejar el esquema real de la DB (ya existen por migraciones).
- **`POST /api/v1/courses/{course_id}/tasks`**: nuevo endpoint que recibe los datos de la tarea y crea una `Activity` por cada alumno del curso con `status="NO_ENTREGADO"`. Incrementa `tasks_total` en cada alumno.
- **`createTask()` en el API client frontend**: función que llama al endpoint anterior.
- **`NewTaskModal` conectado**: `handleCreate()` llama al API real, muestra estado de carga y cierra al éxito.
- **`CoursePage` pasa `courseId`**: el modal ya recibe `courseName`, falta pasarle `courseId` para poder llamar al endpoint correcto.

## Capabilities

### New Capabilities
- `task-creation`: Creación de tareas reales desde la UI del docente, asignadas a todos los alumnos del curso simultáneamente.

### Modified Capabilities
- `course-page`: El modal de creación de tareas pasa de ser un mockup a estar conectado al backend.

## Impact

- **Backend**: `apps/api/app/models.py`, `apps/api/app/routers/courses.py`
- **Frontend**: `apps/web/src/pages/CoursePage/NewTaskModal.tsx`, `apps/web/src/pages/CoursePage/CoursePage.tsx`, `apps/web/src/api/alumno.ts` (o nuevo archivo `tasks.ts`)
- **Sin migraciones**: los campos ya existen en la DB
- **Sin cambios de DB ni seed**

## Non-goals

- Editar o eliminar tareas ya creadas
- Asignar tareas a alumnos individuales (siempre es curso completo)
- Notificaciones al alumno cuando se crea una tarea
- Validación de duplicados (mismo nombre de tarea en el mismo curso)
- Paginación de tareas en la tab del docente

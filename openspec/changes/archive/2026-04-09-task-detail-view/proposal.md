## Why

El tab de Tareas muestra la lista de tareas del curso pero al hacer click en una tarea no pasa nada útil — la ruta `/courses/:courseId/tasks/:taskId` no existe. El docente no tiene forma de ver el estado individual de cada alumno para una tarea dada ni las métricas de corrección. Esta pantalla es el corazón pedagógico de la herramienta.

## What Changes

- **`GET /api/v1/courses/{course_id}/tasks/{task_id}/students`**: nuevo endpoint que dado el ID de una tarea (Activity), encuentra todas las Activities del mismo grupo (mismo nombre+tipo en el curso) y para cada alumno devuelve su estado y, si completó, las métricas del Submission vinculado.
- **`getTaskStudents()` en `courses.ts`**: función del API client que llama al endpoint.
- **`TaskDetail.tsx`**: nueva página que renderiza la tabla de alumnos con columnas adaptadas al tipo de tarea (lectura vs escritura).
- **Ruta `/courses/:courseId/tasks/:taskId`** registrada en `App.tsx`.

## Capabilities

### New Capabilities
- `task-detail-view`: Pantalla de detalle de tarea con tabla de alumnos, estado y métricas de corrección diferenciadas por tipo (lectura/escritura).

### Modified Capabilities

## Impact

- **Backend**: `apps/api/app/routers/courses.py`
- **Frontend**: `apps/web/src/App.tsx`, `apps/web/src/api/courses.ts`, `apps/web/src/pages/CoursePage/TaskDetail.tsx` (nuevo)
- **Sin migraciones**: todos los datos ya están en la DB
- **Sin cambios al modelo de datos**

## Non-goals

- Editar o eliminar tareas desde esta pantalla
- Ver el detalle de corrección de un alumno específico (eso ya existe en la pantalla de detalle del alumno)
- Filtros o paginación en la tabla de alumnos
- Exportar datos

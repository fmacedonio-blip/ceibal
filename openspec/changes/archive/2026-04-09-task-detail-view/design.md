## Context

El `TaskRow` ya navega a `/courses/:courseId/tasks/:taskId` donde `taskId` es el `id` de la primera Activity creada para esa tarea (la que representa al grupo). Los datos de métricas están en la tabla `submissions`, vinculados a las Activities via `activity.submission_id`. El modelo `Submission` ya tiene `ppm`, `precision`, `total_errors`, `spelling_errors`, `concordance_errors`, `requires_review` y `submission_type`.

## Goals / Non-Goals

**Goals:**
- Endpoint que dado un `task_id` encuentra todas las Activities hermanas (mismo nombre+tipo en el curso) y resuelve las métricas de cada alumno
- Página frontend que adapta sus columnas según el tipo de tarea (lectura vs escritura)
- Columna de Revisión que señala alumnos que requieren atención del docente

**Non-Goals:**
- Navegar al detalle de corrección individual desde esta tabla (ya existe en detalle del alumno)
- Paginación ni filtros
- Edición de tareas

## Decisions

### 1. Identificar el grupo de Activities por nombre+tipo
El `task_id` es el `id` de una Activity específica. Para encontrar todas las Activities del mismo grupo se usa el nombre y tipo de esa Activity como clave, filtrando por alumnos del curso. Esto es consistente con cómo se crearon (fan-out con mismo `name`+`type`).

### 2. Métricas desde `ai_result` (JSONB) para lectura
`ppm` y `precision` no están como columnas directas en `submissions` — están dentro del `ai_result` JSONB. Para escritura sí hay columnas directas (`total_errors`, `spelling_errors`, `concordance_errors`). El endpoint extrae `ppm` y `precision` del JSON para lectura.

**Alternativa descartada**: agregar columnas `ppm`/`precision` a la tabla — innecesario, el dato ya está en `ai_result`.

### 3. requires_review como señal de revisión
La columna `requires_review` en `submissions` ya tiene semántica correcta:
- Lectura: `true` cuando `calidad_audio_baja` (la IA no pudo transcribir bien)
- Escritura: `true` cuando hay errores ambiguos que la IA no pudo resolver

Es la señal perfecta para la columna de Revisión en la tabla.

### 4. Columnas adaptadas por tipo
El frontend renderiza columnas distintas según `task.type`:
- Lectura: Alumno | Estado | PPM | Precisión | Revisión
- Escritura: Alumno | Estado | Errores totales | Ortografía | Revisión

### 5. Submission lookup via activity.submission_id
El JOIN es directo: `Activity.submission_id → Submission.id`. Si `submission_id` es null, el alumno no entregó (status NO_ENTREGADO). No hace falta query adicional.

## Risks / Trade-offs

- **ai_result puede ser null o tener estructura distinta**: el endpoint debe manejar gracefully el caso donde `ai_result` no tenga `ppm`/`precision` (devolver null para esas métricas).
- **Consistencia del grupo por nombre+tipo**: si el docente crea dos tareas con el mismo nombre y tipo en días distintos, se mezclarían. Para el POC con una sola clase es aceptable.

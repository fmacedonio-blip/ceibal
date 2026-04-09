## ADDED Requirements

### Requirement: Endpoint de detalle de tarea
El sistema SHALL exponer `GET /api/v1/courses/{course_id}/tasks/{task_id}/students` (autenticado como docente) que devuelva la metadata de la tarea y una lista de todos los alumnos del curso con su estado y métricas para esa tarea.

#### Scenario: Tarea con alumnos mixtos
- **WHEN** el docente consulta el detalle de una tarea donde algunos alumnos completaron y otros no
- **THEN** el sistema responde `200` con `{ task: { name, type, date }, students: [{ student_id, name, status, metrics }] }` donde `metrics` es `null` para alumnos con `status=NO_ENTREGADO` y contiene las métricas del Submission para los que completaron

#### Scenario: Métricas de lectura
- **WHEN** la tarea es de tipo `lectura` y el alumno completó
- **THEN** `metrics` contiene `{ ppm, precision, requires_review }` extraídos del Submission vinculado

#### Scenario: Métricas de escritura
- **WHEN** la tarea es de tipo `escritura` y el alumno completó
- **THEN** `metrics` contiene `{ total_errors, spelling_errors, concordance_errors, requires_review }` del Submission vinculado

#### Scenario: Submission sin métricas
- **WHEN** el Submission existe pero `ai_result` es null o no contiene `ppm`/`precision`
- **THEN** esos campos se devuelven como `null`, sin error

#### Scenario: Curso no pertenece al docente
- **WHEN** el docente consulta una tarea de un curso ajeno
- **THEN** el sistema responde `403 Forbidden`

### Requirement: Página de detalle de tarea
El sistema SHALL renderizar la ruta `/courses/:courseId/tasks/:taskId` con una página que muestre el nombre de la tarea, su tipo, fecha, y una tabla con todos los alumnos del curso.

#### Scenario: Tabla lectura
- **WHEN** el tipo de tarea es `lectura`
- **THEN** la tabla muestra columnas: Alumno | Estado | PPM | Precisión | Revisión

#### Scenario: Tabla escritura
- **WHEN** el tipo de tarea es `escritura`
- **THEN** la tabla muestra columnas: Alumno | Estado | Errores | Ortografía | Revisión

#### Scenario: Estado visual
- **WHEN** un alumno tiene `status=NO_ENTREGADO`
- **THEN** su fila muestra "Pendiente" con badge gris y `—` en todas las métricas

#### Scenario: Revisión requerida
- **WHEN** un alumno tiene `metrics.requires_review=true`
- **THEN** la celda de Revisión muestra un badge naranja/amarillo de advertencia

#### Scenario: Navegación de vuelta
- **WHEN** el docente hace click en "Volver"
- **THEN** navega de vuelta a `/courses/:courseId` con el tab Tareas activo

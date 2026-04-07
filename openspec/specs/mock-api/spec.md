## ADDED Requirements

### Requirement: Dashboard endpoint
El sistema SHALL exponer `GET /api/v1/dashboard` que retorna alertas prioritarias, resumen de cursos del docente y actividad reciente.

#### Scenario: Docente autenticado consulta dashboard
- **WHEN** un docente autenticado hace `GET /api/v1/dashboard`
- **THEN** la respuesta es 200 con un objeto que contiene `alerts` (array), `courses` (array, máx 2 elementos en el resumen) y `recent_activity` (array)

#### Scenario: Estructura de alerta
- **WHEN** se recibe la lista de `alerts`
- **THEN** cada alerta contiene `id`, `type`, `severity` (high|medium|low) y `message` (string en español)

#### Scenario: Estructura de curso en resumen
- **WHEN** se recibe la lista de `courses` del dashboard
- **THEN** cada curso contiene `id`, `name`, `shift`, `student_count` y `average` (entero 0-100)

#### Scenario: Estructura de actividad reciente
- **WHEN** se recibe `recent_activity`
- **THEN** cada item contiene `student_name`, `initials`, `activity`, `date` y `status` (uno de: COMPLETADA, PENDIENTE_DE_REVISION, REVISADA)

### Requirement: Listado de cursos
El sistema SHALL exponer `GET /api/v1/courses` que retorna todos los cursos asignados al docente autenticado.

#### Scenario: Docente con cursos asignados
- **WHEN** un docente autenticado hace `GET /api/v1/courses`
- **THEN** la respuesta es 200 con un array de cursos, cada uno con `id`, `name`, `shift`, `student_count` y `pending_corrections` (entero ≥ 0)

### Requirement: Listado de alumnos por curso
El sistema SHALL exponer `GET /api/v1/courses/{course_id}/students` con soporte de filtrado por estado, búsqueda por nombre y paginación.

#### Scenario: Listado completo sin filtros
- **WHEN** se hace `GET /api/v1/courses/c1/students`
- **THEN** la respuesta contiene `students` (array), `total` (int), `page` (int) y `limit` (int)

#### Scenario: Filtro por estado pendiente
- **WHEN** se hace `GET /api/v1/courses/c1/students?filter=pendientes`
- **THEN** solo se retornan alumnos con `status = "pendiente"`

#### Scenario: Búsqueda por nombre
- **WHEN** se hace `GET /api/v1/courses/c1/students?search=María`
- **THEN** solo se retornan alumnos cuyo nombre contiene "María" (case-insensitive)

#### Scenario: Paginación
- **WHEN** se hace `GET /api/v1/courses/c1/students?page=2&limit=6`
- **THEN** la respuesta retorna el segundo grupo de 6 alumnos y `total` refleja el total sin paginar

#### Scenario: Estructura de alumno en listado
- **WHEN** se recibe el array `students`
- **THEN** cada alumno contiene `id`, `name`, `average` (float), `tasks_completed`, `tasks_total`, `last_activity` (string) y `status` (al_dia|pendiente)

### Requirement: Detalle de alumno
El sistema SHALL exponer `GET /api/v1/students/{student_id}` que retorna el perfil completo del alumno incluyendo diagnóstico IA e historial de actividades.

#### Scenario: Alumno existente
- **WHEN** se hace `GET /api/v1/students/s1`
- **THEN** la respuesta es 200 con `id`, `name`, `course`, `average`, `tasks_completed`, `tasks_total`, `ai_diagnosis` y `activity_history`

#### Scenario: Estructura del diagnóstico IA
- **WHEN** se recibe `ai_diagnosis`
- **THEN** contiene `text` (string) y `tags` (array de strings)

#### Scenario: Estructura del historial de actividades
- **WHEN** se recibe `activity_history`
- **THEN** cada item contiene `id`, `name`, `date`, `score` (float o null si no entregado) y `status` (CORREGIDA|NO_ENTREGADO|PENDIENTE_DE_REVISION)

#### Scenario: Alumno inexistente
- **WHEN** se hace `GET /api/v1/students/no-existe`
- **THEN** la respuesta es 404 con `{ "detail": "Student not found" }`

## MODIFIED Requirements

### Requirement: Estado de tarea binario
El sistema SHALL manejar exactamente dos estados para las actividades del alumno: `NO_ENTREGADO` (tarea asignada pero no entregada) y `COMPLETADA` (alumno entregó y recibió corrección de la IA). Cualquier otro estado intermedio (PENDIENTE_DE_REVISION, CORREGIDA, REVISADA) no SHALL existir en el flujo del alumno.

#### Scenario: Tarea recién asignada
- **WHEN** el docente crea una tarea para el curso
- **THEN** la Activity del alumno tiene status `NO_ENTREGADO`

#### Scenario: Alumno entrega una tarea
- **WHEN** el alumno envía su trabajo (escritura o lectura) y la IA lo analiza exitosamente
- **THEN** la Activity pasa a status `COMPLETADA` y queda vinculada al submission via `submission_id`

### Requirement: MisTareas muestra todas las tareas con acceso a correcciones
La pantalla `MisTareas` SHALL mostrar todas las tareas del alumno (pendientes y completadas) en una lista única con filtros por tipo (Todas/Escritura/Lectura). Las tareas `NO_ENTREGADO` muestran botón "Empezar". Las tareas `COMPLETADA` muestran botón "Ver corrección" que navega a la pantalla de corrección usando el `submission_id` guardado.

#### Scenario: Tarea pendiente en MisTareas
- **WHEN** el alumno tiene una tarea con status `NO_ENTREGADO`
- **THEN** aparece en la lista con botón "Empezar" que navega a `/alumno/tarea/:id/:type`

#### Scenario: Tarea completada en MisTareas
- **WHEN** el alumno tiene una tarea con status `COMPLETADA` y `submission_id` no nulo
- **THEN** aparece en la lista con badge "¡Completada!" y botón "Ver corrección" que navega a la corrección pasando `submission_id` por state

#### Scenario: Filtro por tipo
- **WHEN** el alumno selecciona el filtro "Escritura"
- **THEN** solo se muestran las tareas de tipo `escritura`, independientemente de su status

### Requirement: Seed con alumnos reales sin tareas
El seed del sistema SHALL crear exactamente 5 alumnos en el curso "4to A" con UUIDs fijos, sin activities asignadas, `tasks_total=0`, `tasks_completed=0`, `last_activity=null` y `average` hardcodeado variado.

#### Scenario: Alumno sin tareas al iniciar sesión
- **WHEN** un alumno recién seeded inicia sesión
- **THEN** `GET /me/tasks` retorna un array vacío y el Inicio muestra la card "¡Estás al día!"

### Requirement: Lista de alumnos muestra guiones para datos vacíos
La tabla de alumnos en `StudentsTab` SHALL mostrar `-` cuando `tasks_total === 0` (en vez de `0/0`) y `-` cuando `last_activity` es null o vacío.

#### Scenario: Alumno sin tareas asignadas
- **WHEN** un alumno tiene `tasks_total = 0`
- **THEN** la columna "Tareas Resueltas" muestra `-` y no una barra de progreso

#### Scenario: Alumno sin actividad registrada
- **WHEN** `last_activity` es null o string vacío
- **THEN** la columna "Última Actividad" muestra `-`

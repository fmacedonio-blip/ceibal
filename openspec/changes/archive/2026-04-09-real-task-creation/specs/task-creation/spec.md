## ADDED Requirements

### Requirement: Endpoint de creación de tarea
El sistema SHALL exponer `POST /api/v1/courses/{course_id}/tasks` (autenticado como docente) que reciba los datos de la tarea y cree una `Activity` con `status="NO_ENTREGADO"` para cada alumno del curso. El campo `subject` siempre será `"Lengua"`. El campo `date` será la fecha actual del servidor en formato `YYYY-MM-DD`.

#### Scenario: Creación exitosa
- **WHEN** el docente envía `{ name, type, description?, reading_text? }` a `POST /api/v1/courses/{course_id}/tasks`
- **THEN** el sistema crea una `Activity` por cada alumno del curso, incrementa `tasks_total` en +1 en cada alumno, y responde `201` con `{ tasks_created: N }`

#### Scenario: Curso sin alumnos
- **WHEN** el docente crea una tarea en un curso sin alumnos
- **THEN** el sistema responde `201` con `{ tasks_created: 0 }` sin crear registros

#### Scenario: Curso no pertenece al docente
- **WHEN** el docente intenta crear una tarea en un curso que no le pertenece
- **THEN** el sistema responde `403 Forbidden`

### Requirement: Modal de creación conectado al backend
El modal wizard `NewTaskModal` SHALL llamar al endpoint real al confirmar en el Paso 2. Durante la llamada SHALL mostrar estado de carga en el botón ("Creando...") y deshabilitar el botón. Al recibir respuesta exitosa SHALL cerrar el modal y resetear el formulario.

#### Scenario: Carga en progreso
- **WHEN** el usuario hace click en "Crear tarea" y la llamada está en curso
- **THEN** el botón muestra "Creando..." y está deshabilitado

#### Scenario: Éxito
- **WHEN** el backend responde 201
- **THEN** el modal se cierra, el formulario se resetea y se llama al callback `onCreated` para refrescar la lista de tareas

#### Scenario: Error de red
- **WHEN** el backend responde con error o la llamada falla
- **THEN** el modal permanece abierto y muestra un mensaje de error inline

### Requirement: `models.py` refleja el esquema real de `activities`
El ORM de SQLAlchemy SHALL declarar en la clase `Activity` los campos `type`, `description`, `reading_text`, `subject` y `submission_id` que ya existen en la DB por migraciones previas.

#### Scenario: Campos accesibles desde el ORM
- **WHEN** se consulta una `Activity` desde cualquier router
- **THEN** los campos `type`, `description`, `reading_text`, `subject` y `submission_id` son accesibles como atributos del objeto sin errores de atributo

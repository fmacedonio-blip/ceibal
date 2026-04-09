## ADDED Requirements

### Requirement: Página de curso con tabs
El sistema SHALL proveer una página en `/courses/:courseId` que muestre el nombre del curso en el header y dos tabs navegables: **Alumnos** (activo por defecto) y **Tareas**.

#### Scenario: Tab Alumnos activo por defecto
- **WHEN** el usuario navega a `/courses/:courseId`
- **THEN** se renderiza la página con el tab Alumnos seleccionado y la tabla de alumnos visible

#### Scenario: Cambio de tab
- **WHEN** el usuario hace click en el tab "Tareas"
- **THEN** la tabla de alumnos se oculta y se muestra el contenido del tab Tareas sin recarga de página

### Requirement: Tab Tareas — lista de tareas del curso
El tab Tareas SHALL mostrar una lista de tareas con filtros (Todas / Lectura / Escritura), un botón "+ Agregar tarea" y filas de tarea con badge de tipo, título, fecha y barra de progreso de la clase.

#### Scenario: Lista de tareas visible
- **WHEN** el usuario activa el tab Tareas
- **THEN** se muestra la lista de tareas mock con badge de tipo (LECTURA en teal, ESCRITURA en violeta), título, fecha y barra de progreso con porcentaje

#### Scenario: Filtro por tipo
- **WHEN** el usuario hace click en el filtro "Lectura"
- **THEN** solo se muestran las tareas de tipo lectura

#### Scenario: Colores de progreso
- **WHEN** una tarea tiene progreso ≥80%
- **THEN** la barra es verde; entre 50–79% es amarilla; <50% es roja

#### Scenario: Ícono de ojo navega al detalle
- **WHEN** el usuario hace click en el ícono de ojo de una tarea
- **THEN** navega a `/courses/:courseId/tasks/:taskId`

### Requirement: Botón "+ Agregar tarea" abre el wizard
El tab Tareas SHALL incluir un botón "+ Agregar tarea" que abre el modal wizard de creación.

#### Scenario: Apertura del wizard
- **WHEN** el usuario hace click en "+ Agregar tarea"
- **THEN** se renderiza el modal wizard con el Paso 1 visible y el fondo bloqueado con overlay

### Requirement: Modal wizard — Paso 1: selección de tipo
El wizard SHALL mostrar en el Paso 1 dos cards seleccionables: Lectura y Escritura. El botón "Siguiente" está deshabilitado hasta que el usuario seleccione un tipo.

#### Scenario: Selección de tipo habilita Siguiente
- **WHEN** el usuario hace click en una de las dos cards (Lectura o Escritura)
- **THEN** la card queda visualmente seleccionada (borde teal) y el botón "Siguiente" se habilita

#### Scenario: Cancelar cierra el modal
- **WHEN** el usuario hace click en "Cancelar" o en la X
- **THEN** el modal se cierra y el estado del wizard se resetea

### Requirement: Modal wizard — Paso 2: configuración de la tarea
El Paso 2 SHALL adaptar su contenido según el tipo seleccionado. Lectura muestra campos Título + Texto + Criterio (opcional). Escritura muestra Título + Consigna + Criterio (opcional). El botón "Crear tarea" está deshabilitado hasta que Título y el campo principal tengan contenido.

#### Scenario: Paso 2 Lectura
- **WHEN** el usuario seleccionó Lectura y avanzó al Paso 2
- **THEN** se muestran los campos: TÍTULO (input), TEXTO (textarea 5000 chars con contador), CRITERIO DE EVALUACIÓN (textarea, label OPCIONAL)

#### Scenario: Paso 2 Escritura
- **WHEN** el usuario seleccionó Escritura y avanzó al Paso 2
- **THEN** se muestran los campos: TÍTULO (input), CONSIGNA (textarea 2000 chars con contador), CRITERIO DE EVALUACIÓN (textarea, label OPCIONAL)

#### Scenario: Crear tarea cierra el modal
- **WHEN** el usuario completa Título y el campo principal y hace click en "Crear tarea"
- **THEN** el modal se cierra (sin persistencia real en el mockup)

#### Scenario: Volver regresa al Paso 1
- **WHEN** el usuario hace click en "← Volver" en el Paso 2
- **THEN** vuelve al Paso 1 manteniendo el tipo seleccionado

### Requirement: Indicador de pasos en el wizard
El wizard SHALL mostrar un indicador visual de dos pasos (dots o segmentos) que refleje el paso actual.

#### Scenario: Indicador en Paso 1
- **WHEN** el wizard está en el Paso 1
- **THEN** el primer dot/segmento está activo (teal) y el segundo inactivo (gris)

#### Scenario: Indicador en Paso 2
- **WHEN** el wizard está en el Paso 2
- **THEN** ambos dots/segmentos están activos (teal)

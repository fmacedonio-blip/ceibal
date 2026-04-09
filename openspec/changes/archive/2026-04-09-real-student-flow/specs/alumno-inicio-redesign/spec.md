## ADDED Requirements

### Requirement: Sección "Nueva Tarea" con tareas pendientes
La pantalla de inicio del alumno SHALL mostrar una sección "Nueva Tarea" con todas las tareas de status `NO_ENTREGADO`, cada una con ícono de tipo, nombre, descripción y botón "Empezar" que navega a la tarea correspondiente.

#### Scenario: Tareas pendientes visibles
- **WHEN** el alumno tiene al menos una tarea con status `NO_ENTREGADO`
- **THEN** la sección "Nueva Tarea" muestra cada tarea con su ícono (HiPencil para escritura, HiMicrophone para lectura), nombre en negrita, descripción en texto secundario y botón "Empezar" en teal

#### Scenario: Sin tareas pendientes muestra card "¡Estás al día!"
- **WHEN** el alumno no tiene tareas con status `NO_ENTREGADO`
- **THEN** la sección "Nueva Tarea" se reemplaza por una card centrada con mensaje "¡Estás al día!" y texto secundario "Tu docente te va a asignar nuevas tareas pronto."

### Requirement: Sección "Mis Tareas" con completadas recientes
La pantalla de inicio SHALL mostrar una sección "Mis Tareas" con las últimas 3 tareas con status `COMPLETADA` y un link "Ver todas →" que navega a `/alumno/tareas`.

#### Scenario: Tareas completadas visibles
- **WHEN** el alumno tiene al menos una tarea con status `COMPLETADA`
- **THEN** la sección "Mis Tareas" muestra hasta 3 tareas con ícono de tipo, nombre, fecha y badge "¡Completada!" en verde

#### Scenario: Sin tareas completadas oculta la sección
- **WHEN** el alumno no tiene tareas con status `COMPLETADA`
- **THEN** la sección "Mis Tareas" no se renderiza

### Requirement: Logo Ceibal real en navbar alumno
El header del `AlumnoLayout` SHALL mostrar el logo SVG real de Ceibal (`src/assets/logo.svg`) en vez del placeholder "C".

#### Scenario: Logo visible en todas las pantallas del alumno
- **WHEN** el alumno navega a cualquier pantalla dentro del AlumnoLayout
- **THEN** el header muestra el logo Ceibal con height de 28px y proporciones correctas

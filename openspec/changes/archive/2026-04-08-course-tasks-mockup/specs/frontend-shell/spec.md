## ADDED Requirements

### Requirement: Ruta /courses/:courseId muestra CoursePage
El sistema SHALL registrar `/courses/:courseId` como ruta protegida que renderiza `CoursePage` dentro del layout de docente.

#### Scenario: Navegación a la página de curso
- **WHEN** el usuario navega a `/courses/:courseId`
- **THEN** se renderiza `CoursePage` con el tab Alumnos activo dentro del `AuthLayout`

### Requirement: Redirección de /courses/:courseId/students
La ruta `/courses/:courseId/students` SHALL redirigir a `/courses/:courseId` para mantener compatibilidad con links existentes.

#### Scenario: Redirect de ruta legacy
- **WHEN** el usuario accede a `/courses/:courseId/students`
- **THEN** es redirigido automáticamente a `/courses/:courseId` sin romper el layout

### Requirement: Ruta placeholder para detalle de tarea
El sistema SHALL registrar `/courses/:courseId/tasks/:taskId` como ruta que muestra un componente placeholder "Próximamente".

#### Scenario: Acceso al detalle de tarea
- **WHEN** el usuario hace click en el ícono de ojo de una tarea y navega a `/courses/:courseId/tasks/:taskId`
- **THEN** se muestra una pantalla simple con el texto "Próximamente" dentro del `AuthLayout`

### Requirement: Link "Ver curso" navega a /courses/:courseId
En `Courses.tsx`, el link de cada curso SHALL navegar a `/courses/:courseId` en lugar de `/courses/:courseId/students`.

#### Scenario: Click en Ver curso
- **WHEN** el usuario hace click en "Ver curso" en la lista de cursos
- **THEN** navega a `/courses/:courseId` (CoursePage con tab Alumnos)

## ADDED Requirements

### Requirement: Guard de autenticación en rutas protegidas
El sistema SHALL redirigir automáticamente a `/login` cuando el usuario intenta acceder a una ruta protegida sin token válido.

#### Scenario: Acceso sin token
- **WHEN** el usuario navega a `/dashboard` sin token en localStorage
- **THEN** es redirigido inmediatamente a `/login`

#### Scenario: Acceso con token expirado
- **WHEN** el usuario tiene un token en localStorage cuya fecha `exp` ya pasó
- **THEN** es redirigido a `/login` y el token es eliminado de localStorage

#### Scenario: Acceso con token válido
- **WHEN** el usuario tiene un token válido y navega a `/dashboard`
- **THEN** la pantalla de dashboard se renderiza sin redireccionamiento

#### Scenario: Redirect post-login
- **WHEN** el usuario es redirigido a `/login` desde una ruta protegida y luego se autentica
- **THEN** es redirigido a la ruta original que intentó acceder

### Requirement: Layout shell con Sidebar y área de contenido
Todas las rutas autenticadas SHALL renderizar dentro de un layout que contiene un Sidebar fijo a la izquierda y un área de contenido principal a la derecha, consistente con los diseños de Figma (nodos 1:41, 1:237, 1:411, 1:677).

#### Scenario: Sidebar visible en rutas autenticadas
- **WHEN** el usuario está en cualquier ruta autenticada (/dashboard, /courses, etc.)
- **THEN** el Sidebar está visible con logo de Ceibal, navegación y datos del usuario en la parte inferior

#### Scenario: Ítem activo en navegación
- **WHEN** el usuario está en `/courses`
- **THEN** el ítem "Mis Cursos" del Sidebar aparece visualmente activo (resaltado)

#### Scenario: Layout ausente en login
- **WHEN** el usuario está en `/login`
- **THEN** el Sidebar NO está presente; se muestra solo la pantalla de login

### Requirement: Navegación entre las 5 pantallas
El sistema SHALL implementar routing client-side para las 5 rutas del MVP sin recarga de página.

#### Scenario: Navegación a Mis Cursos
- **WHEN** el usuario hace click en "Mis Cursos" en el Sidebar
- **THEN** la URL cambia a `/courses` y se renderiza la pantalla de cursos sin recarga

#### Scenario: Navegación a lista de alumnos
- **WHEN** el usuario hace click en "Ver alumnos" en una card de curso
- **THEN** la URL cambia a `/courses/:id/students` y se muestra la lista de alumnos de ese curso

#### Scenario: Navegación a detalle de alumno
- **WHEN** el usuario hace click en "Ver detalle" de un alumno
- **THEN** la URL cambia a `/students/:id` y se muestra el detalle del alumno

#### Scenario: Breadcrumb en detalle de alumno
- **WHEN** el usuario está en `/students/:id`
- **THEN** el breadcrumb muestra "Mis Cursos > [Nombre del Curso] > [Nombre del Alumno]" y cada parte es navegable

### Requirement: Pantalla de login con selector de rol para desarrollo
En entorno de desarrollo, la pantalla de login SHALL mostrar un selector de rol (docente/alumno) y un botón para autenticarse, en lugar del botón SSO de Ceibal.

#### Scenario: Login como docente en dev
- **WHEN** el usuario selecciona "Docente" y hace click en el botón de login
- **THEN** se llama a `POST /auth/dev-login` con `{ "role": "docente" }`, el token se guarda en localStorage y el usuario es redirigido a `/dashboard`

#### Scenario: Estado de carga durante login
- **WHEN** el usuario hace click en el botón de login
- **THEN** el botón muestra un estado de carga hasta que la respuesta llega

#### Scenario: Error de autenticación
- **WHEN** el servidor responde con error al intento de login
- **THEN** se muestra un mensaje de error en la pantalla sin redirigir

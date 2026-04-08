## MODIFIED Requirements

### Requirement: Layout shell con Sidebar y área de contenido
Todas las rutas autenticadas SHALL renderizar dentro de un layout que contiene un Sidebar fijo a la izquierda con `height: 100vh`, ancho fijo semántico (ej. `w-64`) y `flex-shrink: 0`, y un área de contenido principal a la derecha con `flex: 1` y `overflow-y: auto` para su propio scroll independiente. El contenedor raíz SHALL usar `display: flex; height: 100vh; overflow: hidden`. El layout SHALL adaptarse al ancho real del viewport desktop sin usar anchos fijos de Figma. El Sidebar NO debe verse afectado por el scroll del contenido, consistente con los diseños de Figma (nodos `52:379`, `52:574`, `52:747`, `52:1012`, `52:1271`).

#### Scenario: Sidebar visible en rutas autenticadas
- **WHEN** el usuario está en cualquier ruta autenticada (/dashboard, /courses, etc.)
- **THEN** el Sidebar está visible con el logo SVG de Ceibal correctamente alineado en la parte superior, navegación con íconos de react-icons, y datos del usuario (avatar con iniciales + color) en la parte inferior

#### Scenario: Layout se adapta al ancho del viewport desktop
- **WHEN** el usuario redimensiona la ventana del navegador entre 1024px y 1920px de ancho
- **THEN** el área de contenido principal se expande o contrae fluidamente para ocupar todo el espacio disponible junto al Sidebar, sin desbordamientos ni barras de scroll horizontal

#### Scenario: Sidebar fijo ante scroll de contenido
- **WHEN** el contenido principal tiene suficiente altura para hacer scroll
- **THEN** el Sidebar permanece completamente visible y fijo mientras el contenido principal hace scroll de forma independiente

#### Scenario: Ítem activo en navegación
- **WHEN** el usuario está en `/courses`
- **THEN** el ítem "Mis Cursos" del Sidebar aparece visualmente activo (resaltado)

#### Scenario: Layout ausente en login
- **WHEN** el usuario está en `/login`
- **THEN** el Sidebar NO está presente; se muestra solo la pantalla de login

## MODIFIED Requirements

### Requirement: Pantalla de login con selector de rol para desarrollo
En entorno de desarrollo, la pantalla de login SHALL mostrar el logo SVG de Ceibal centrado en la parte superior, seguido de una card blanca con título "Copiloto Pedagógico", subtítulo "Ingresá con tu cuenta Ceibal", botón teal "Iniciar sesión" con ícono de candado, y texto secundario "Acceso mediante Single Sign-On Institucional". El fondo SHALL ser gris claro. El selector de rol (docente/alumno) SHALL estar ubicado en la esquina superior izquierda como elemento superpuesto para no interferir con la visual principal (Figma nodo `52:340`).

#### Scenario: Login como docente en dev
- **WHEN** el usuario selecciona "Docente" en el selector de la esquina superior izquierda y hace click en el botón principal de login
- **THEN** se llama a `POST /auth/dev-login` con `{ "role": "docente" }`, el token se guarda en localStorage y el usuario es redirigido a `/dashboard`

#### Scenario: Selector de rol no rompe la visual
- **WHEN** el usuario carga la pantalla de login
- **THEN** el selector de rol aparece discretamente en la esquina superior izquierda sin superponerse al logo ni al botón principal

#### Scenario: Estado de carga durante login
- **WHEN** el usuario hace click en el botón de login
- **THEN** el botón muestra un estado de carga hasta que la respuesta llega

#### Scenario: Error de autenticación
- **WHEN** el servidor responde con error al intento de login
- **THEN** se muestra un mensaje de error en la pantalla sin redirigir

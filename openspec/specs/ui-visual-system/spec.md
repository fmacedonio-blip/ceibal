## ADDED Requirements

### Requirement: Fuente Inter aplicada globalmente
La aplicación SHALL usar la fuente Inter (importada vía `@fontsource/inter`) en todos los textos, configurada como `font-family` base en el CSS global. Solo los pesos 400, 500, 600 y 700 serán importados.

#### Scenario: Fuente cargada sin CDN externo
- **WHEN** la aplicación se carga en un entorno sin acceso a internet
- **THEN** la fuente Inter se renderiza correctamente desde los assets del bundle

#### Scenario: Texto visible con Inter
- **WHEN** el usuario navega a cualquier pantalla de la aplicación
- **THEN** todos los textos visibles usan la fuente Inter (verificable via DevTools > Computed > font-family)

### Requirement: Logo SVG de Ceibal presente en Sidebar y Login
La aplicación SHALL mostrar el logo oficial (`assets/logo.svg`) en el Sidebar (parte superior) y en la pantalla de Login, sin usar texto como reemplazo.

#### Scenario: Logo en Sidebar
- **WHEN** el usuario está en cualquier ruta autenticada
- **THEN** el logo SVG de Ceibal se muestra en la parte superior del Sidebar

#### Scenario: Logo en Login
- **WHEN** el usuario está en la pantalla `/login`
- **THEN** el logo SVG de Ceibal se muestra prominentemente en el área visual principal

### Requirement: Iconos de UI provenientes de react-icons
La aplicación SHALL usar exclusivamente la librería `react-icons` (familia `hi2` — Heroicons v2) para todos los iconos de navegación y UI. No se usarán emojis, caracteres Unicode ni SVGs inline como iconos funcionales.

#### Scenario: Iconos de navegación del Sidebar
- **WHEN** el usuario ve el Sidebar
- **THEN** cada ítem de navegación muestra un ícono de `react-icons/hi2` alineado con el label

#### Scenario: Iconos de acciones
- **WHEN** el usuario ve botones de acción o elementos interactivos con íconos
- **THEN** los íconos pertenecen a la familia `react-icons/hi2`

### Requirement: Avatares de usuario con iniciales y color determinístico
Los avatares de usuario SHALL mostrar las iniciales del nombre y un color de fondo pastel asignado de forma determinística (mismo nombre → mismo color siempre), usando una paleta de 10 colores definida en el sistema.

#### Scenario: Iniciales calculadas correctamente
- **WHEN** el nombre del usuario es "Ana García"
- **THEN** el avatar muestra "AG"

#### Scenario: Color consistente entre sesiones
- **WHEN** el mismo usuario cierra sesión y vuelve a ingresar
- **THEN** su avatar tiene el mismo color de fondo que en la sesión anterior

#### Scenario: Colores distintos para usuarios diferentes
- **WHEN** hay una lista de alumnos con nombres distintos
- **THEN** la mayoría de los avatares muestran colores diferentes (distribución uniforme en la paleta de 10 colores)

## Context

La implementación inicial del frontend generó pantallas funcionales pero visualmente alejadas del diseño en Figma. El sistema usa Tailwind CSS para estilos. No hay un sistema de diseño centralizado ni librería de iconos definida. El Sidebar actualmente no está correctamente contenido — el contenido principal empuja el layout en vez de hacer scroll de forma independiente.

## Goals / Non-Goals

**Goals:**
- Fuente Inter cargada globalmente (Google Fonts o `@fontsource/inter`).
- Sidebar como columna fija `height: 100vh` con layout flex, sin verse afectado por el scroll del área de contenido.
- Iconos de navegación y UI reemplazados por `react-icons` (familia `HeroIcons` vía `react-icons/hi2` para alinear con el estilo flat de Figma).
- Avatares de usuario con iniciales + color de fondo deterministico por nombre (hash → paleta de 8 colores pastel predefinidos, igual que Figma).
- Logo SVG (`assets/logo.svg`) en el Sidebar (parte superior) y en la pantalla de Login.
- Login rediseñado para coincidir con Figma nodo `52:340`: layout centrado, ilustración/logo grande, botón principal; el selector de rol de dev aparece como un pequeño dropdown en la esquina superior izquierda superpuesto, sin romper la visual.

**Non-Goals:**
- No se agrega Storybook ni design tokens formales.
- No se toca el backend.
- No se implementa responsive para mobile ni tablet (solo desktop).

## Decisions

### D1: Fuente Inter vía `@fontsource/inter` (npm) en lugar de Google Fonts CDN
**Por qué**: Evita dependencia de red externa en desarrollo y en posibles deploys offline (contexto educativo Uruguay). Se instala como paquete npm y se importa en `main.tsx`.
**Alternativa descartada**: `<link>` a Google Fonts CDN — más simple pero introduce latencia y bloquea render en redes lentas.

### D2: Layout con CSS Flexbox en `App`/`AuthLayout`
**Por qué**: El Sidebar y el área de contenido principal deben ser columnas en un contenedor `flex h-screen overflow-hidden`. El área de contenido tiene `overflow-y: auto` para su propio scroll. El Sidebar tiene `flex-shrink-0` y nunca hace scroll.
**Alternativa descartada**: CSS Grid — también válido, pero Flex es más simple para este caso de dos columnas.

### D3: `react-icons` con familia `hi2` (Heroicons v2)
**Por qué**: Heroicons v2 es la familia más cercana al estilo de iconos flat/outline de Figma. `react-icons` agrupa múltiples familias y evita instalar paquetes separados por familia.
**Alternativa descartada**: Lucide React — también válido, pero `react-icons` ofrece más opciones si en fases posteriores se necesitan iconos de otras familias.

### D4: Color de avatar por hash determinístico del nombre
**Por qué**: El mismo usuario siempre verá el mismo color, lo que crea consistencia visual. Se define una paleta de 8-10 colores pastel exactos tomados de Figma. La función `getAvatarColor(name: string): string` hace `sum of charCodes % palette.length`.
**Alternativa descartada**: Color aleatorio en cada render — inconsistente entre sesiones.

### D5: Selector de rol en Login como badge flotante superior izquierdo
**Por qué**: Preserva la visual principal del login (logo grande, botón centrado) sin agregar un formulario al centro. El selector `<select>` se posiciona `absolute top-4 left-4` dentro del contenedor de la página.
**Alternativa descartada**: Mostrar el selector en el centro del formulario — rompe la fidelidad con Figma nodo `52:340`.

### D6: Layout responsive desktop sin anchos fijos de Figma
**Por qué**: Los frames de Figma tienen `width: 1311px` fijo. El layout real debe adaptarse al viewport del docente, que puede ser cualquier monitor desktop. Se elimina cualquier `width` o `max-width` fijo heredado en el contenedor raíz y en el área de contenido — el Sidebar mantiene un ancho fijo semántico (ej. `w-64`), pero el contenido principal usa `flex-1` para ocupar el espacio restante.
**Alternativa descartada**: `max-width: 1311px; margin: auto` — centraría el layout en pantallas grandes pero desperdiciaría espacio horizontal.

### D7: Nueva pantalla ActivityDetail (`/students/:studentId/activities/:activityId`)
**Por qué**: El historial de actividades en el Detalle del Alumno (`52:1012`) tiene un botón "Ver detalle" en cada fila. La pantalla Actividad (`52:1271`) muestra: layout de dos columnas (imagen del manuscrito izquierda, Diagnóstico IA derecha), Transcripción Inteligente con palabras resaltadas en amarillo, Feedback al alumno en quote verde, y botón "Volver al historial". Breadcrumb: `Mis Cursos › [Curso] › [Alumno] › [Título Actividad]`.
**Datos**: Se utiliza el endpoint existente `GET /api/v1/students/{id}` que incluye el historial. Si se necesita más detalle por actividad, se agrega `GET /api/v1/activities/{id}` en una iteración posterior. Para el MVP se trabaja con los datos disponibles en el historial.

### D8: Logo SVG en Sidebar — corrección de alineación
**Por qué**: El logo actual en el Sidebar está mal posicionado. Se reemplaza por `<img src={logo} alt="Ceibal" />` con clases de tamaño y padding exactos que respeten el contenedor del Sidebar (`h-[80px]` de header, padding `px-6`).
**Alternativa descartada**: Usar el SVG como componente React inline — innecesariamente complejo para un logo estático.

## Risks / Trade-offs

- **`@fontsource/inter` aumenta el bundle**: Inter tiene múltiples pesos. Importar solo los pesos necesarios (400, 500, 600, 700) mantiene el impacto acotado. → Mitigation: importar pesos explícitos en lugar del barrel `@fontsource/inter`.
- **Color de avatar determinístico puede generar colisiones visuales**: Dos usuarios con nombres similares podrían tener el mismo color. → Mitigation: paleta de 10 colores es suficiente para la cantidad de usuarios del MVP (30-40 alumnos por docente).
- **react-icons aumenta bundle si se importa el barrel**: → Mitigation: importar siempre íconos individuales (`import { HiHome } from 'react-icons/hi2'`), nunca el barrel completo.

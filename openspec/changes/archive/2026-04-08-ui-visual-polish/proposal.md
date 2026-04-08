## Why

La primera implementación del frontend se realizó sin alcanzar fidelidad visual con los diseños de Figma. La interfaz presenta inconsistencias en tipografía, iconografía, layout del sidebar, colores de avatares y la pantalla de login, lo que aleja el producto de los estándares de diseño acordados con el Centro Ceibal para el MVP 2026.

## What Changes

- **Tipografía**: Adoptar la fuente Inter (Google Fonts) en toda la aplicación, tal como aparece en Figma.
- **Logo**: Reemplazar el logo placeholder por `logo.svg` en `apps/web/src/assets/`, usarlo en el Sidebar y en la pantalla de Login.
- **Sidebar / Navbar**: Corregir el layout para que el Sidebar ocupe el 100% del alto de la pantalla (`height: 100vh`) y permanezca fijo; el scroll del contenido principal no debe afectarlo. Corregir el logo SVG dentro del Sidebar para que se muestre correctamente alineado y prolijo.
- **Layout responsive desktop**: Eliminar anchos fijos heredados de Figma (1311px). El layout debe adaptarse al ancho real del navegador desktop usando unidades fluidas (`flex-1`, `w-full`, `max-w-*` cuando corresponda).
- **Iconografía**: Reemplazar los iconos actuales por la librería `react-icons` (familia `react-icons/hi2`) para alinearlos con el estilo de Figma.
- **Avatares de usuario**: Mantener las iniciales pero asignar colores de fondo aleatorios y consistentes por usuario (basados en el nombre), igual que en Figma.
- **Login**: Rediseñar la pantalla de login para que coincida con Figma (nodo `52:340`). El selector de rol de desarrollo se mueve a la esquina superior izquierda para no romper la visual principal.
- **Pantalla Detalle de Actividad**: Nueva pantalla accesible al clickear "Ver detalle" en el historial de actividades del alumno. Muestra el detalle completo de una actividad individual.

## Capabilities

### New Capabilities
- `ui-visual-system`: Sistema visual base de la aplicación — tipografía Inter, logo SVG, paleta de colores de avatares, e integración de react-icons como librería de iconos estándar.
- `activity-detail`: Nueva pantalla de detalle de actividad individual (`/students/:studentId/activities/:activityId`), accesible desde el historial de actividades del alumno.

### Modified Capabilities
- `frontend-shell`: El layout del Sidebar cambia estructuralmente (height 100vh, sticky, sin verse afectado por el scroll del contenido). Los iconos de navegación se reemplazan. Se agrega el logo SVG correctamente. El layout se hace responsive para desktop (sin anchos fijos de Figma).

## Impact

- **`apps/web/src/`**: Cambios en `main.tsx` (importar fuente Inter), `components/` (Sidebar, avatares), `pages/Login.tsx`, nueva página `ActivityDetail.tsx`.
- **Dependencias**: Agregar `react-icons` y `@fontsource/inter` al `package.json` de `apps/web`.
- **Assets**: `apps/web/src/assets/logo.svg` (ya disponible).
- **Router**: Nueva ruta `/students/:studentId/activities/:activityId`. Frame DOCENTE `53:1411` agrupa todas las pantallas; node IDs actualizados: Login `52:340`, Inicio `52:379`, Mis Cursos `52:574`, Alumnos `52:747`, Alumno `52:1012`, Actividad `52:1271`.
- **Sin cambios en backend**: Solo afecta el frontend.
- **Non-goals**: No se modifica lógica de autenticación ni datos. No hay responsive para mobile/tablet.

## 1. Dependencias y assets

- [x] 1.1 Instalar `@fontsource/inter` en `apps/web` (`npm install @fontsource/inter`)
- [x] 1.2 Instalar `react-icons` en `apps/web` (`npm install react-icons`)
- [x] 1.3 Verificar que `apps/web/src/assets/logo.svg` existe y es el logo correcto

## 2. Tipografía global (Inter)

- [x] 2.1 Importar `@fontsource/inter/400.css`, `500.css`, `600.css`, `700.css` en `apps/web/src/main.tsx`
- [x] 2.2 Agregar `font-family: 'Inter', sans-serif` en el CSS global (`index.css`) para `body` y `*`
- [x] 2.3 Verificar en browser que DevTools > Computed muestra `Inter` como font-family

## 3. Layout del Sidebar (height 100vh, scroll independiente, responsive desktop)

- [x] 3.1 En el componente de layout autenticado (`AuthLayout` o similar), aplicar `flex h-screen overflow-hidden` al contenedor raíz
- [x] 3.2 Al Sidebar aplicar `h-full w-64 flex-shrink-0 overflow-hidden` (ancho semántico fijo, NO ancho de Figma)
- [x] 3.3 Al área de contenido principal aplicar `flex-1 overflow-y-auto` (se expande para llenar el espacio disponible)
- [x] 3.4 Eliminar cualquier `width`, `max-width` o `min-width` fijo en píxeles heredado del Figma en el contenedor raíz o en el contenido
- [x] 3.5 Verificar manualmente que scrollear el contenido NO mueve el Sidebar
- [x] 3.6 Verificar en browser a 1280px, 1440px y 1920px de ancho que el layout se adapta sin scroll horizontal

## 4. Logo SVG en Sidebar (corrección)

- [x] 4.1 Importar `logo.svg` en el componente `Sidebar` como `import logo from '../assets/logo.svg'`
- [x] 4.2 Reemplazar el logo/texto placeholder del Sidebar por `<img src={logo} alt="Ceibal" className="h-8 w-auto" />`
- [x] 4.3 Ajustar padding del contenedor del logo para que quede alineado y prolijo (centrado verticalmente en el header del Sidebar, `px-6 py-6`)

## 5. Iconos con react-icons (hi2)

- [x] 5.1 En el componente `Sidebar`, reemplazar cada ícono de navegación por el equivalente de `react-icons/hi2`
- [x] 5.2 Verificar que los íconos tienen el tamaño y color correctos según Figma
- [x] 5.3 Buscar cualquier otro ícono en la app (botones, badges) y reemplazarlos con `react-icons/hi2`

## 6. Avatares con iniciales y color determinístico

- [x] 6.1 Crear la función utilitaria `getAvatarColor(name: string): string` en `apps/web/src/utils/avatar.ts` con paleta de 10 colores pastel y hash por charCode
- [x] 6.2 Crear (o actualizar) el componente `Avatar` que recibe `name: string` y renderiza un círculo con iniciales y el color calculado
- [x] 6.3 Reemplazar todos los avatares de usuario en el Sidebar (footer con datos del docente) por el nuevo componente `Avatar`
- [x] 6.4 Reemplazar todos los avatares de alumnos en la lista y detalle de alumno por el componente `Avatar`
- [x] 6.5 Verificar que el mismo nombre siempre produce el mismo color

## 7. Pantalla de Login

- [x] 7.1 Rediseñar `apps/web/src/pages/Login.tsx` para que el layout sea centrado y limpio (logo + botón principal), siguiendo Figma nodo `52:340`
- [x] 7.2 Importar y mostrar `logo.svg` de forma prominente en el centro/arriba del login
- [x] 7.3 Mover el `<select>` de rol de desarrollo a `position: absolute; top: 1rem; left: 1rem` dentro del contenedor de la página
- [x] 7.4 Verificar que el selector de rol no interfiere visualmente con el logo ni el botón principal
- [x] 7.5 Verificar que el flujo de login (seleccionar rol → click → redirect a /dashboard) sigue funcionando

## 8. Pantalla Detalle de Actividad (Figma `52:1271`)

- [x] 8.1 Agregar la ruta `/students/:studentId/activities/:activityId` al router (react-router)
- [x] 8.2 En la tabla de historial del alumno (`StudentDetail.tsx`), convertir el botón "Ver detalle" en un `<Link>` a la ruta de detalle de actividad (solo para actividades con estado ≠ NO_ENTREGADO)
- [x] 8.3 Crear `apps/web/src/pages/ActivityDetail.tsx` con layout de dos columnas: columna principal (ancha) y panel lateral Diagnóstico IA (angosto)
- [x] 8.4 Implementar header: badge "CORRECCIÓN ASISTIDA" (verde, ícono check) + título grande + "[Alumno] — Entregado el [fecha]"
- [x] 8.5 Implementar breadcrumb `Mis Cursos › [Curso] › [Alumno] › [Título]` con links navegables
- [x] 8.6 Implementar card "Original del Alumno" con imagen del manuscrito (o placeholder si no hay)
- [x] 8.7 Implementar panel "Diagnóstico IA": subsección "OBSERVACIONES ORTOGRÁFICAS" (card roja "ERRORES DETECTADOS") + "SUGERENCIAS PEDAGÓGICAS" (card azul "RECOMENDACIÓN")
- [x] 8.8 Implementar sección "Transcripción Inteligente" con palabras resaltadas en amarillo y nota aclaratoria
- [x] 8.9 Implementar sección "Feedback Entregado al Alumno" en quote block con borde izquierdo verde, texto en itálica
- [x] 8.10 Agregar botón "Volver al historial" al pie que navega a `/students/:studentId`
- [x] 8.11 Implementar manejo de actividad no encontrada (mensaje de error dentro del layout shell)

## 9. QA visual (comparar contra Figma frame DOCENTE `53:1411`)

- [x] 9.1 Comparar Login contra nodo `52:340` — fondo gris, logo centrado, card blanca con botón teal
- [x] 9.2 Comparar Inicio/Dashboard contra nodo `52:379` — alertas, cursos, actividad reciente
- [x] 9.3 Comparar Mis Cursos contra nodo `52:574` — grid de cards, badges de grado con color
- [x] 9.4 Comparar Lista Alumnos contra nodo `52:747` — tabla con filtros, avatares, progress bars
- [x] 9.5 Comparar Detalle Alumno contra nodo `52:1012` — header, stats, diagnóstico, historial
- [x] 9.6 Comparar Detalle Actividad contra nodo `52:1271` — dos columnas, transcripción, feedback
- [x] 9.7 Verificar layout responsive en 1280px, 1440px y 1920px — sin scroll horizontal ni desbordamientos
- [x] 9.8 Hacer commit con mensaje `feat: ui visual polish — Inter font, react-icons, logo, avatars, login, responsive, activity-detail`

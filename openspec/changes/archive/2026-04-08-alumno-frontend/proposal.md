## Why

Con el backend del alumno listo, hay que construir el flujo completo de 7 pantallas que el alumno ve cuando se loguea. La UI está diseñada en Figma (frame ALUMNO) e incluye: inicio con tareas pendientes, lista completa de tareas, flujos de entrega para escritura (imagen) y lectura (audio), pantallas de corrección con feedback de la IA, y el chat socrático copiloto.

Las rutas del alumno se separan de las del docente por rol, usando el JWT claim `role` para redirigir correctamente desde el login.

## What Changes

- **Modificado**: `store/auth.ts` — soporte para `role: alumno` y claim `student_uuid` en el JWT
- **Modificado**: `pages/Login/Login.tsx` — selector de alumno en dev-mode (dropdown con los 3 alumnos seed)
- **Modificado**: `App.tsx` — routing por rol: `role=alumno` → `/alumno/*`, `role=docente` → rutas existentes
- **Nuevo**: `api/alumno.ts` — funciones fetch: `getMe()`, `getTasks()`, `submitWriting()`, `submitAudio()`, `getCorrection()`
- **Nuevo**: `types/alumno.ts` — tipos TypeScript para el flujo del alumno
- **Nuevo**: `pages/alumno/Inicio/Inicio.tsx` — tareas pendientes con iconos (✏️ escritura, 🎙 lectura), estado vacío, botón "Ver todas"
- **Nuevo**: `pages/alumno/MisTareas/MisTareas.tsx` — lista completa de tareas con estado
- **Nuevo**: `pages/alumno/TareaEscritura/TareaEscritura.tsx` — upload de imagen con preview + borrar/resubir + botón enviar
- **Nuevo**: `pages/alumno/TareaLectura/TareaLectura.tsx` — 3 estados: listo para grabar / grabando / grabado (con reproducir + borrar)
- **Nuevo**: `pages/alumno/CorreccionEscritura/CorreccionEscritura.tsx` — review con transcripción HTML, errores con explicaciones, puntos de mejora, sugerencias socráticas; botones "Ir al chat" / "Volver al inicio"
- **Nuevo**: `pages/alumno/CorreccionLectura/CorreccionLectura.tsx` — review con feedback, errores de lectura oral con explicaciones, consejos; botones "Ir al chat" / "Volver al inicio"
- **Nuevo**: `pages/alumno/ChatCopiloto/ChatCopiloto.tsx` — interfaz de chat socrático, común para escritura y lectura

## Capabilities

### New Capabilities
- `alumno-routing`: Routing por rol desde el login; URLs `/alumno/*` protegidas para rol alumno
- `alumno-inicio`: Pantalla de inicio con tareas pendientes y estado vacío
- `alumno-tareas`: Lista completa de tareas del alumno
- `alumno-entrega-escritura`: Flujo de upload de imagen con preview y resubida
- `alumno-entrega-lectura`: Flujo de grabación de audio con 3 estados
- `alumno-correccion`: Pantallas de revisión post-entrega (escritura y lectura)
- `alumno-chat`: Chat copiloto socrático integrado con el submission

### Modified Capabilities
- `dev-auth`: Login muestra selector de alumno además del selector de docente

## Impact

- **Archivos nuevos**: `api/alumno.ts`, `types/alumno.ts`, 7 páginas bajo `pages/alumno/`
- **Archivos modificados**: `App.tsx`, `store/auth.ts`, `pages/Login/Login.tsx`
- **No tocar**: páginas del docente, API functions existentes, componentes Layout/Sidebar

## Non-goals

- Vista del docente para asignar tareas (viene después)
- Responsive mobile/tablet (desktop-only como el resto del MVP)
- Notificaciones en tiempo real
- Historial de submissions anteriores del alumno (solo la tarea pendiente actual)
- Auth de producción con CAS

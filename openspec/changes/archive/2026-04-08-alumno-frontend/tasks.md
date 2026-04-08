# Tasks — alumno-frontend

## Fundación

- [x] **F1** Crear `types/alumno.ts`: tipos `AlumnoProfile`, `Task`, `WritingCorrectionResponse`, `AudioCorrectionResponse`
- [x] **F2** Crear `api/alumno.ts`: funciones `getMe()`, `getTasks()`, `submitWriting(taskId, file)`, `submitAudio(taskId, blob, textoOriginal)`, `getCorrection(submissionId)`
- [x] **F3** Extender `store/auth.ts`: soporte para campos `student_uuid` y `student_id` en `AuthUser`

## Auth & Routing

- [x] **F4** Modificar `pages/Login/Login.tsx`: cuando se elige rol "Alumno", mostrar dropdown con los 3 alumnos seed; llamar a dev-login con `{ role: "alumno", student_id }`
- [x] **F5** Crear `components/Layout/AlumnoLayout.tsx`: header con nombre + avatar del alumno + botón de logout; sin sidebar
- [x] **F6** Modificar `App.tsx`: agregar rutas `/alumno/*` bajo un guard de rol alumno; redirigir desde login según rol (`alumno` → `/alumno/inicio`, `docente` → `/dashboard`)

## Páginas

- [x] **F7** `pages/alumno/Inicio/Inicio.tsx`: cargar tareas con `getTasks()`, filtrar pendientes, mostrar cards con icono (✏️ escritura / 🎙 lectura) y link a tarea; estado vacío si no hay pendientes; botón "Ver todas" → `/alumno/tareas`
- [x] **F8** `pages/alumno/MisTareas/MisTareas.tsx`: lista completa de tareas con badge de estado (pendiente / entregada)
- [x] **F9** `pages/alumno/TareaEscritura/TareaEscritura.tsx`: upload de imagen con preview, botón borrar para resubir, botón enviar → `submitWriting()` → navega a corrección con `submissionId` en state
- [x] **F10** `pages/alumno/TareaLectura/TareaLectura.tsx`: 3 fases (idle / recording / recorded), MediaRecorder API, preview de audio con `<audio>`, borrar para regrabar, enviar → `submitAudio()` → navega a corrección
- [x] **F11** `pages/alumno/CorreccionEscritura/CorreccionEscritura.tsx`: mostrar capa `alumno` de `getCorrection()`: feedback, `transcripcion_html` con errores resaltados, lista de errores con explicaciones, consejos; botones "Ir al chat" y "Volver al inicio"
- [x] **F12** `pages/alumno/CorreccionLectura/CorreccionLectura.tsx`: mostrar capa `alumno`: feedback, lista de errores de lectura oral con `explicacion_alumno`, consejos; botones "Ir al chat" y "Volver al inicio"
- [x] **F13** `pages/alumno/ChatCopiloto/ChatCopiloto.tsx`: lookup de sesión → start si no existe → cargar historial → input de mensaje → POST y append respuesta; diseño de burbuja chat

## Validación

- [x] **F14** Recorrer el flujo completo end-to-end: login alumno → inicio → tarea escritura → corrección → chat
- [x] **F15** Recorrer el flujo de lectura: inicio → tarea lectura → corrección → chat
- [x] **F16** Verificar estado vacío de inicio (alumno sin tareas pendientes)
- [x] **F17** Verificar que las rutas del docente siguen funcionando sin regresiones

# Design — alumno-frontend

## Routing por rol

El `App.tsx` redirige después del login según `role` en el JWT:

```
/login
  └── role=docente → /dashboard  (rutas existentes, sin cambios)
  └── role=alumno  → /alumno/inicio

Rutas del alumno (todas bajo ProtectedRoute con roleGuard="alumno"):
  /alumno/inicio
  /alumno/tareas
  /alumno/tarea/:taskId/escritura
  /alumno/tarea/:taskId/lectura
  /alumno/tarea/:taskId/correccion-escritura   (recibe submissionId por state o query)
  /alumno/tarea/:taskId/correccion-lectura
  /alumno/chat/:submissionId
```

## Dev-mode: selector de alumno

En `Login.tsx`, cuando se selecciona rol "Alumno" aparece un segundo dropdown con los 3 alumnos seed. Al hacer click en "Entrar", llama a:

```
POST /auth/dev-login { "role": "alumno", "student_id": <id seleccionado> }
```

## Estado global del alumno

`store/auth.ts` ya tiene `user: { id, name, role }`. Se extiende con:
```ts
interface AuthUser {
  id: string
  name: string
  role: UserRole
  student_uuid?: string   // solo para role=alumno
  student_id?: number     // solo para role=alumno
}
```

## Flujo de datos por pantalla

### Inicio
```
mount → GET /api/v1/me/tasks
      → filtra status !== "COMPLETADA" | "CORREGIDA"
      → muestra cards de tareas pendientes
      → si vacío → pantalla "sin tareas pendientes"
```

### Mis Tareas
```
mount → GET /api/v1/me/tasks (todas, sin filtro)
      → lista completa con badge de estado
```

### Tarea Escritura
```
Estado local: { file: File | null, preview: string | null, uploading: bool }
[Subir imagen] → FileReader → preview
[Borrar]       → reset estado
[Enviar]       → POST /api/v1/submissions/analyze
                 FormData: { file, student_id: student_uuid, class_id, grade }
               → on success → navigate(/alumno/tarea/:id/correccion-escritura,
                               { state: { submissionId } })
```

`class_id` y `grade` vienen de `GET /api/v1/me` (course.id → class_id, grado del curso).

### Tarea Lectura
```
Estado local: { phase: "idle"|"recording"|"recorded", audioBlob, audioUrl }

[Grabar]     → navigator.mediaDevices.getUserMedia → MediaRecorder
[Detener]    → MediaRecorder.stop → blob → URL.createObjectURL
[Escuchar]   → <audio src={audioUrl} controls />
[Borrar]     → reset a phase="idle"
[Enviar]     → POST /api/v1/submissions/analyze-audio
               FormData: { file: audioBlob, student_id, class_id, grade,
                           texto_original, nombre }
             → on success → navigate(/alumno/tarea/:id/correccion-lectura,
                             { state: { submissionId } })
```

`texto_original` viene de la tarea (el texto a leer). `nombre` es el nombre del alumno del store.

### Corrección Escritura / Lectura
```
mount → GET /api/v1/submissions/:submissionId/correction
      → muestra capa alumno solamente
      → [Ir al chat] → navigate(/alumno/chat/:submissionId)
      → [Volver al inicio] → navigate(/alumno/inicio)
```

### Chat Copiloto
```
mount → GET /api/v1/submissions/:submissionId/chat-session
      → si no existe → POST /api/v1/submissions/:submissionId/chat/start
      → carga historial GET /api/v1/chat/:sessionId/history
      → [Enviar mensaje] → POST /api/v1/chat/:sessionId/message
                         → append a la lista local
```

## Estructura de archivos

```
apps/web/src/
├── api/
│   └── alumno.ts          ← getMe, getTasks, submitWriting, submitAudio, getCorrection
├── types/
│   └── alumno.ts          ← AlumnoProfile, Task, CorrectionResponse
├── pages/
│   └── alumno/
│       ├── Inicio/
│       │   └── Inicio.tsx
│       ├── MisTareas/
│       │   └── MisTareas.tsx
│       ├── TareaEscritura/
│       │   └── TareaEscritura.tsx
│       ├── TareaLectura/
│       │   └── TareaLectura.tsx
│       ├── CorreccionEscritura/
│       │   └── CorreccionEscritura.tsx
│       ├── CorreccionLectura/
│       │   └── CorreccionLectura.tsx
│       └── ChatCopiloto/
│           └── ChatCopiloto.tsx
```

## Layout del alumno

Las páginas del alumno NO usan el `AuthLayout` del docente (que tiene el Sidebar con "Mis Cursos", etc.). Tienen su propio layout mínimo: header con nombre del alumno + avatar, sin sidebar.

```
┌─────────────────────────────────────────┐
│  👤 María Suárez          [Cerrar sesión]│  ← AlumnoHeader
├─────────────────────────────────────────┤
│                                          │
│           <contenido de página>          │
│                                          │
└─────────────────────────────────────────┘
```

Componente nuevo: `components/Layout/AlumnoLayout.tsx`

## Context

El seed actual crea 6 alumnos con tasks_completed/tasks_total hardcodeados y ALUMNO_TASKS ficticias. Los tres alumnos con UUID fijo (María, Lucas, Valentina) tienen tasks seed que no coinciden con ninguna submission real. Cuando un alumno envía una tarea real, `_link_activity` encuentra esa activity ficticia y la marca como `PENDIENTE_DE_REVISION` — estado que el modelo real no contempla.

El logo en `AlumnoLayout` es un cuadrado verde con "C". El logo real está en `apps/web/src/assets/logo.svg` — SVG de 141×47px con símbolo teal + wordmark "Ceibal".

## Goals / Non-Goals

**Goals:**
- Seed limpio: 5 alumnos, sin activities, contadores en cero
- Status binario: solo `NO_ENTREGADO` y `COMPLETADA`
- Inicio alumno con dos secciones visuales distintas
- MisTareas con acceso a correcciones guardadas
- Logo real en navbar alumno

**Non-Goals:**
- Gamificación, estrellas, barra de progreso
- Wizard crear tarea funcional
- Promedio calculado

## Decisions

### Decisión 1: 5 alumnos, primeros 3 con UUIDs existentes + 2 nuevos

Los UUIDs de María, Lucas y Valentina están fijos en el código de login (`dev-login`). Los dos nuevos alumnos (Sofía García y Mateo Ríos) también reciben UUIDs fijos para que el login alumno funcione de forma predecible en demos. Total: 5 alumnos en un solo curso.

UUIDs nuevos:
- Sofía García: `c9dd2e03-6784-60e7-bc40-3f4d5e6f7081`
- Mateo Ríos: `d0ee3f14-7895-71f8-cd51-4f5e6f708192`

### Decisión 2: `tasks_total` y `tasks_completed` quedan en cero hasta que el docente crea tareas

Con el seed limpio, la lista de alumnos muestra `-` para tareas. Cuando el wizard de tareas tenga funcionalidad real, `tasks_total` se incrementará por API. Por ahora el docente ve `-` y es correcto — no hay tareas asignadas.

### Decisión 3: `average` hardcodeado variado en el seed

Valores distintos por alumno para generar diversidad visual en la lista: 8.5, 6.2, 9.3, 5.8, 7.4. No se calcula en ningún momento.

### Decisión 4: `_link_activity` → `COMPLETADA` (no `PENDIENTE_DE_REVISION`)

El status `PENDIENTE_DE_REVISION` representaba "el alumno entregó pero el docente no revisó". En el modelo actual, la IA ya hizo la revisión en el momento de la entrega — no hay revisión docente pendiente. Por lo tanto, la tarea queda `COMPLETADA` inmediatamente.

### Decisión 5: MisTareas muestra todas las tareas — pendientes con "Empezar", completadas con "Ver corrección"

Es más útil que separar en dos pantallas. El alumno ve su historia completa con filtros. Las completadas navegan a `/alumno/tarea/:taskId/:type` pasando el `submission_id` por state.

### Decisión 6: Logo en AlumnoLayout — SVG importado, sin texto adicional

El SVG ya incluye el wordmark "Ceibal". Se importa como componente React SVG o como `<img>`. Dado que es un SVG de assets, se importa con `import LogoSvg from '../../assets/logo.svg?url'` (Vite) y se usa en un `<img>` con height fija para preservar las proporciones (height: 28px → width auto ≈ 84px).

## Estructura de Inicio alumno

```
Inicio
├── Greeting: "¡Hola, {nombre}!"
│
├── [Si hay NO_ENTREGADO]
│   ├── Sección "Nueva Tarea"
│   └── lista de TaskCard (tipo, nombre, descripción, botón Empezar)
│
├── [Si NO hay NO_ENTREGADO]
│   └── Card "¡Estás al día!" con ilustración
│
└── [Si hay COMPLETADA]
    ├── Sección "Mis Tareas" + link "Ver todas →"
    └── últimas 3 COMPLETADA con badge "¡Completada!"
```

## Estructura de MisTareas

```
MisTareas
├── Header "Mis Tareas"
├── Filtros: Todas / Escritura / Lectura
└── Lista (todas las tareas, ordenadas: NO_ENTREGADO primero, luego COMPLETADA por fecha desc)
    ├── NO_ENTREGADO → ícono tipo + nombre + botón "Empezar"
    └── COMPLETADA   → ícono tipo + nombre + fecha + botón "Ver corrección"
                            └── navega a /alumno/tarea/:id/:type con state { submissionId }
```

## API response — `GET /me/tasks`

Ya devuelve `submission_id` (implementado en el change anterior). Para las completadas, `submission_id` será el UUID de la submission. Para las pendientes, `null`.

La fecha de la actividad (`date`) viene como string (ej. "Hoy"). Para MisTareas se muestra tal cual.

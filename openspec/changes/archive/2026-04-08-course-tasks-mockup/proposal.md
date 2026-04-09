## Why

El docente no tiene forma de crear ni visualizar las tareas asignadas a un curso desde la interfaz. La pantalla de curso actual solo muestra la lista de alumnos, sin visibilidad sobre qué actividades existen ni cuánto progreso tiene la clase en cada una.

## What Changes

- Nueva página `/courses/:courseId` con dos tabs: **Alumnos** y **Tareas**.
- Tab Alumnos: muestra la tabla actual de alumnos (componente extraído de `Students.tsx`).
- Tab Tareas: lista de tareas del curso con badge de tipo (LECTURA / ESCRITURA), título, fecha, barra de progreso de la clase (porcentaje hardcodeado) e ícono de ojo que navega a `/courses/:courseId/tasks/:taskId` (placeholder).
- Botón **"+ Agregar tarea"** visible en el tab Tareas que abre un modal wizard de 2 pasos.
- Modal wizard paso 1: selección de tipo (Lectura / Escritura) con cards visuales.
- Modal wizard paso 2a (Lectura): campos Título, Texto (textarea 5000 chars), Criterio de evaluación (opcional).
- Modal wizard paso 2b (Escritura): campos Título, Consigna (textarea 2000 chars), Criterio de evaluación (opcional).
- `Courses.tsx`: el link "Ver curso" navega a `/courses/:courseId` en lugar de `/courses/:courseId/students`.
- `App.tsx`: nueva ruta `/courses/:courseId` → `CoursePage`; `/courses/:courseId/students` redirige a `/courses/:courseId`.
- **Sin funcionalidad real**: el wizard no persiste datos ni llama a la API; el progreso y las tareas son datos mock hardcodeados.
- Estilo 100% consistente con el sistema de diseño del Figma (colores, tipografía, cards, botones).

## Capabilities

### New Capabilities
- `course-page`: Página de curso con tabs Alumnos/Tareas y wizard de creación de tarea (UI mockup).

### Modified Capabilities
- `frontend-shell`: Nuevas rutas `/courses/:courseId` y redirect de `/courses/:courseId/students`.

## Impact

- **Frontend**: nuevo componente `CoursePage`, `NewTaskModal`, `TaskRow`; `Students.tsx` refactorizado como tab; `Courses.tsx` actualiza link; `App.tsx` nuevas rutas.
- **Backend**: ninguno — datos hardcodeados.
- **Rutas**: `/courses/:courseId/students` deja de ser la ruta principal del curso.

## Non-goals

- Persistencia de tareas en base de datos.
- Llamadas reales a la API para crear o listar tareas.
- Funcionalidad del ícono ojo (detalle de tarea por alumno) — pantalla placeholder únicamente.
- Responsive mobile/tablet.
- Botón "Crear con IA" en el wizard.
- Funcionalidad de "Agregar alumno".

## Why

El flujo del alumno está construido sobre datos ficticios hardcodeados en el seed. Los alumnos tienen tareas fake, contadores inventados y estados intermedios (PENDIENTE_DE_REVISION, CORREGIDA, REVISADA) que no reflejan el modelo de negocio real. El modelo correcto es binario: una tarea está pendiente o completada. Este change limpia todo eso y hace que el flujo sea demostrable de punta a punta.

## What Changes

- **Seed simplificado**: 5 alumnos con UUIDs fijos (3 existentes + 2 nuevos), sin activities, `tasks_total=0`, `tasks_completed=0`, `last_activity=null`, `average` variado hardcodeado. Eliminar todas las ALUMNO_TASKS ficticias del seed.
- **Status simplificado**: `COMPLETADA` es el único estado terminal. `_link_activity` cambia `PENDIENTE_DE_REVISION` → `COMPLETADA`. Cualquier referencia a `PENDIENTE_DE_REVISION`, `CORREGIDA`, `REVISADA` en frontend se elimina o unifica.
- **`AlumnoLayout`**: reemplazar el cuadrado "C" por el SVG de logo Ceibal real (`src/assets/logo.svg`).
- **`Inicio` alumno** (rediseño): sección "Nueva Tarea" con tareas `NO_ENTREGADO` y botón "Empezar" — cuando no hay pendientes mostrar card "¡Estás al día!". Sección "Mis Tareas" con últimas 3 tareas `COMPLETADA` y link "Ver todas →".
- **`MisTareas`**: lista unificada con filtros Todas/Escritura/Lectura. Tareas `NO_ENTREGADO` muestran botón "Empezar". Tareas `COMPLETADA` muestran botón "Ver corrección" que navega a la corrección usando `submission_id`.
- **`StudentsTab`** (docente): mostrar `-` cuando `tasks_total === 0` o `last_activity === null`.
- **Types**: `TaskStatus` simplificado a `'NO_ENTREGADO' | 'COMPLETADA'`.

## Capabilities

### New Capabilities
- `alumno-inicio-redesign`: Pantalla de inicio del alumno con secciones separadas de tareas pendientes y completadas.

### Modified Capabilities
- `alumno-task-flow`: Status del flujo de tareas simplificado a dos estados. Navegación desde completadas hacia la corrección.
- `submission-persistence`: `_link_activity` actualiza a `COMPLETADA` en vez de `PENDIENTE_DE_REVISION`.

## Impact

- **Backend**: `apps/api/app/seed.py`, `apps/api/app/services/submission_service.py`
- **Frontend**: `AlumnoLayout.tsx`, `Inicio.tsx`, `MisTareas.tsx`, `apps/web/src/types/alumno.ts`
- **Docente**: `StudentsTab.tsx` (fix visual menor)
- **Sin cambios de DB ni migraciones** — solo datos del seed y lógica de status

## Non-goals

- Gamificación / sistema de estrellas / barra de progreso de aprendizaje
- Funcionalidad real del wizard "Crear tarea" (sigue siendo mockup)
- Cálculo real del promedio del alumno
- Notificaciones ni actualizaciones en tiempo real

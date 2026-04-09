## 1. Backend — Seed limpio

- [x] 1.1 En `apps/api/app/seed.py`: reemplazar `MOCK_STUDENTS` por 5 alumnos (María Suárez, Lucas Rodríguez, Valentina Pérez, Sofía García, Mateo Ríos) con `tasks_completed=0`, `tasks_total=0`, `last_activity=None`, `status="al_dia"` y `average` variado (8.5, 6.2, 9.3, 5.8, 7.4). Agregar UUIDs fijos para Sofía y Mateo.
- [x] 1.2 Eliminar `ALUMNO_TASKS` y `MOCK_ACTIVITIES_S1` del seed. Eliminar todos los bloques que crean `Activity` rows. El seed solo crea users, courses, students, ai_diagnoses y alerts.
- [x] 1.3 Actualizar el bloque de `ai_diagnoses` para los 5 alumnos (ya no es solo María + resto).
- [x] 1.4 Re-correr el seed: `python -m app.seed` para verificar que levanta sin errores.

## 2. Backend — Status COMPLETADA

- [x] 2.1 En `apps/api/app/services/submission_service.py`: en `_link_activity`, cambiar `activity.status = "PENDIENTE_DE_REVISION"` por `activity.status = "COMPLETADA"`.

## 3. Frontend — Types

- [x] 3.1 En `apps/web/src/types/alumno.ts`: simplificar `TaskStatus` a `'NO_ENTREGADO' | 'COMPLETADA'`. Actualizar cualquier tipo derivado que use los status eliminados.

## 4. Frontend — AlumnoLayout logo

- [x] 4.1 En `apps/web/src/components/Layout/AlumnoLayout.tsx`: reemplazar el div cuadrado con "C" por `<img src={logoUrl} alt="Ceibal" style={{ height: 28, width: 'auto' }} />` importando el logo con `import logoUrl from '../../assets/logo.svg?url'`.

## 5. Frontend — StudentsTab fixes

- [x] 5.1 En `apps/web/src/pages/CoursePage/StudentsTab.tsx`: en la columna "Tareas Resueltas", mostrar `-` cuando `student.tasks_total === 0` en vez de renderizar la barra y el ratio.
- [x] 5.2 En la columna "Última Actividad", mostrar `-` cuando `student.last_activity` sea null, undefined o string vacío.

## 6. Frontend — MisTareas rediseño

- [x] 6.1 En `apps/web/src/pages/alumno/MisTareas/MisTareas.tsx`: simplificar `STATUS_LABEL` y `STATUS_STYLE` a solo `NO_ENTREGADO` y `COMPLETADA`. Eliminar las entradas de `PENDIENTE_DE_REVISION`, `CORREGIDA`, `REVISADA`.
- [x] 6.2 Agregar estado `filter: 'todas' | 'escritura' | 'lectura'` y pills de filtro (Todas/Escritura/Lectura) con el mismo estilo que el resto de la app.
- [x] 6.3 Ordenar las tareas: `NO_ENTREGADO` primero, luego `COMPLETADA` ordenadas por `id` desc (más recientes primero).
- [x] 6.4 Para tareas `NO_ENTREGADO`: mostrar botón "Empezar" que navega a `/alumno/tarea/:id/:type`.
- [x] 6.5 Para tareas `COMPLETADA`: mostrar badge "¡Completada!" (verde) y botón "Ver corrección" que navega a `/alumno/tarea/:id/correccion-:type` pasando `state: { submissionId: task.submission_id }`.

## 7. Frontend — Inicio alumno rediseño

- [x] 7.1 En `apps/web/src/pages/alumno/Inicio/Inicio.tsx`: cargar todas las tareas (no filtrar por status en el fetch). Separar en `pendientes` (`NO_ENTREGADO`) y `completadas` (`COMPLETADA`).
- [x] 7.2 Sección "Nueva Tarea": si `pendientes.length > 0`, renderizar lista de TaskCards con ícono (HiPencil/HiMicrophone), nombre en negrita, descripción en texto secundario y botón "Empezar" en teal. Si `pendientes.length === 0`, mostrar card "¡Estás al día!" con texto "Tu docente te va a asignar nuevas tareas pronto."
- [x] 7.3 Sección "Mis Tareas": si `completadas.length > 0`, renderizar las últimas 3 (`completadas.slice(0, 3)`) con ícono, nombre, fecha y badge "¡Completada!". Mostrar link "Ver todas →" que navega a `/alumno/tareas`. Si `completadas.length === 0`, no renderizar la sección.
- [x] 7.4 Eliminar el emoji 👋 del saludo y reemplazarlo por texto plano "¡Hola, {nombre}!". Subtítulo: "¿Qué aprenderemos hoy?".

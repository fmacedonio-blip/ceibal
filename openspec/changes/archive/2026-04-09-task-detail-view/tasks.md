## 1. Backend — Endpoint de detalle de tarea

- [x] 1.1 En `apps/api/app/routers/courses.py`: agregar el import de `Submission` desde `app.models.submission`.
- [x] 1.2 En `apps/api/app/routers/courses.py`: implementar `GET /api/v1/courses/{course_id}/tasks/{task_id}/students`. El handler debe: (a) verificar que el curso pertenece al docente con `_get_teacher`; (b) cargar la Activity con `id=task_id` para obtener `name` y `type`; (c) obtener todos los Students del curso; (d) para cada student, buscar su Activity con mismo `name`+`type`; (e) si tiene `submission_id`, cargar el Submission y extraer métricas según tipo; (f) devolver `{ task: { name, type, date }, students: [...] }`.
- [x] 1.3 Para lectura: extraer `ppm` y `precision` de `submission.ai_result` (JSONB). Usar `.get("ppm")` y `.get("precision")` con fallback a `null`. Incluir `requires_review` directo de `submission.requires_review`.
- [x] 1.4 Para escritura: usar `submission.total_errors`, `submission.spelling_errors`, `submission.concordance_errors`, `submission.requires_review` directamente como columnas.

## 2. Frontend — API client

- [x] 2.1 En `apps/web/src/api/courses.ts`: agregar la función `getTaskStudents(courseId: string, taskId: string)` que llama a `GET /api/v1/courses/{courseId}/tasks/{taskId}/students` y devuelve `{ task: { name, type, date }, students: TaskStudentRow[] }`. Definir el tipo `TaskStudentRow` con `{ student_id, name, status, metrics: TaskMetrics | null }` y `TaskMetrics` con todos los campos posibles (`ppm?, precision?, total_errors?, spelling_errors?, concordance_errors?, requires_review`).

## 3. Frontend — Página TaskDetail

- [x] 3.1 Crear `apps/web/src/pages/CoursePage/TaskDetail.tsx`. Leer `courseId` y `taskId` de `useParams`. Llamar `getTaskStudents` en un `useEffect`. Mostrar header con nombre de tarea, badge de tipo y fecha. Botón "← Volver" que navega a `/courses/:courseId?tab=tareas`.
- [x] 3.2 Renderizar la tabla con columnas adaptadas al tipo:
  - Lectura: Alumno | Estado | PPM | Precisión | Revisión
  - Escritura: Alumno | Estado | Errores | Ortografía | Revisión
- [x] 3.3 Columna Estado: badge "Completada" verde para `COMPLETADA`, badge "Pendiente" gris para `NO_ENTREGADO`.
- [x] 3.4 Columna Revisión: badge "⚠ Revisar" naranja cuando `metrics.requires_review=true`, "—" cuando false o null.
- [x] 3.5 Métricas de alumnos pendientes: mostrar "—" en todas las celdas de métricas.
- [x] 3.6 Usar `Avatar` de `../../components/Avatar/Avatar` para la columna de alumno, consistente con `StudentsTab`.

## 4. Frontend — Registrar ruta

- [x] 4.1 En `apps/web/src/App.tsx`: reemplazar el `TaskDetailPlaceholder` en la ruta `/courses/:courseId/tasks/:taskId` por el componente `<TaskDetail />` importado desde `./pages/CoursePage/TaskDetail`.

## 5. Frontend — Volver con tab activo

- [x] 5.1 En `apps/web/src/pages/CoursePage/CoursePage.tsx`: leer el query param `?tab=tareas` al montar y activar el tab correspondiente si está presente. Esto permite que el botón "Volver" de `TaskDetail` aterrice en el tab correcto.

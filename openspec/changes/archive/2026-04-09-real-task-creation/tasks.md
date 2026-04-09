## 1. Backend — Actualizar models.py

- [x] 1.1 En `apps/api/app/models.py`: agregar a la clase `Activity` los campos `type` (String, nullable), `description` (Text, nullable), `reading_text` (Text, nullable), `subject` (String, nullable) y `submission_id` (UUID, nullable). Sin crear ninguna migración — los campos ya existen en la DB.

## 2. Backend — Endpoint de creación de tarea

- [x] 2.1 En `apps/api/app/routers/courses.py`: agregar el import de `Activity` al bloque de imports existente.
- [x] 2.2 En `apps/api/app/routers/courses.py`: implementar `POST /api/v1/courses/{course_id}/tasks`. El handler debe: (a) verificar que el curso pertenece al docente autenticado, devolviendo 403 si no; (b) recibir body `{ name: str, type: str, description: str | None, reading_text: str | None }`; (c) obtener todos los `Student` del curso; (d) crear una `Activity` por alumno con `status="NO_ENTREGADO"`, `subject="Lengua"`, `date=str(date.today())`; (e) incrementar `student.tasks_total += 1` en cada alumno; (f) hacer commit y devolver `{ tasks_created: N }` con status 201.

## 3. Frontend — Función createTask en API client

- [x] 3.1 En `apps/web/src/api/courses.ts`: agregar la función `createTask(courseId: number, payload: { name: string; type: 'lectura' | 'escritura'; description?: string; reading_text?: string }): Promise<{ tasks_created: number }>` que llama a `POST /api/v1/courses/{courseId}/tasks`.

## 4. Frontend — Pasar courseId al modal

- [x] 4.1 En `apps/web/src/pages/CoursePage/CoursePage.tsx`: identificar dónde se instancia `<NewTaskModal>`. Agregar la prop `courseId: number` al modal pasando el ID del curso activo (ya debe estar disponible en el estado de la página). Actualizar la interfaz `Props` de `NewTaskModal` para incluir `courseId: number`.

## 5. Frontend — Conectar handleCreate en el modal

- [x] 5.1 En `apps/web/src/pages/CoursePage/NewTaskModal.tsx`: agregar estado `loading: boolean` y `error: string | null`. En `handleCreate()`: setear `loading=true`, llamar `createTask(courseId, { name: title, type: selectedType, description: selectedType === 'escritura' ? mainText : undefined, reading_text: selectedType === 'lectura' ? mainText : undefined })`, al éxito llamar `onCreated?.()` y luego `handleClose()`, al error setear el mensaje de error y dejar el modal abierto. Setear `loading=false` en el finally.
- [x] 5.2 En el botón "Crear tarea": deshabilitar cuando `loading === true` y mostrar texto "Creando..." mientras carga.
- [x] 5.3 Si `error !== null`: mostrar un `<p>` de error en rojo debajo del footer del modal con el mensaje.
- [x] 5.4 Agregar prop opcional `onCreated?: () => void` a la interfaz `Props` del modal.

## 6. Frontend — Refrescar lista al crear

- [x] 6.1 En `apps/web/src/pages/CoursePage/CoursePage.tsx` (o `TasksTab.tsx`): pasar un callback `onCreated` al modal que refresque la lista de tareas del tab (re-fetch o invalidación de estado local).

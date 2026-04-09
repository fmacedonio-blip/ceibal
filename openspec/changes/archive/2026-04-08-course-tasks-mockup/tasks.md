## 1. Router y rutas

- [x] 1.1 En `apps/web/src/App.tsx`: agregar ruta `/courses/:courseId` → `CoursePage`, redirigir `/courses/:courseId/students` → `/courses/:courseId`, agregar ruta `/courses/:courseId/tasks/:taskId` → componente placeholder inline "Próximamente"
- [x] 1.2 En `apps/web/src/pages/Courses/Courses.tsx`: cambiar el link "Ver curso" de `/courses/${id}/students` a `/courses/${id}`

## 2. StudentsTab — extraer tabla de alumnos

- [x] 2.1 Crear `apps/web/src/pages/CoursePage/StudentsTab.tsx` moviendo la lógica de tabla, filtros, búsqueda y paginación de `Students.tsx`. El componente recibe `courseId: string` como prop y no tiene header propio.
- [x] 2.2 Mantener `Students.tsx` funcional o eliminarlo — dado que la ruta redirige, puede eliminarse. Eliminar `Students.tsx` y su import en `App.tsx`.

## 3. TaskRow — componente de fila de tarea

- [x] 3.1 Crear `apps/web/src/pages/CoursePage/TaskRow.tsx` con props `{ id, type: 'lectura' | 'escritura', title, date, progress, courseId }`. Badge LECTURA (bg `#f0fdfa`, color `#0d9488`), badge ESCRITURA (bg `#faf5ff`, color `#7c3aed`). Barra de progreso: verde `#00b89c` ≥80%, amarillo `#f59e0b` ≥50%, rojo `#dc2626` <50%. Ícono `HiEye` navega a `/courses/${courseId}/tasks/${id}`.

## 4. TasksTab — tab de tareas

- [x] 4.1 Crear `apps/web/src/pages/CoursePage/TasksTab.tsx` con los datos mock `MOCK_TASKS` definidos en el design. Filtros Todas/Lectura/Escritura con el mismo estilo de pills que `StudentsTab`. Botón "+ Agregar tarea" (teal, alineado a la derecha) que recibe `onAdd: () => void` como prop. Renderiza lista de `<TaskRow />`.

## 5. NewTaskModal — wizard de 2 pasos

- [x] 5.1 Crear `apps/web/src/pages/CoursePage/NewTaskModal.tsx` con props `{ isOpen, onClose, courseName }`. Overlay `position: fixed, inset: 0, bg: rgba(0,0,0,0.4)`. Modal centrado, `width: 640px, maxHeight: 90vh, overflow-y: auto`, `borderRadius: 16`, bg blanco.
- [x] 5.2 Implementar Paso 1: dos cards seleccionables (Lectura / Escritura) con ícono, título y descripción. Card seleccionada con `border: 2px solid #00b89c, bg: #f0fdfa`. Botón "Siguiente" deshabilitado hasta selección.
- [x] 5.3 Implementar Paso 2a (Lectura): input TÍTULO, textarea TEXTO (maxLength 5000, con contador `X / 5000 characters`), textarea CRITERIO DE EVALUACIÓN (opcional, label con badge). Botón "Crear tarea" deshabilitado si título o texto vacíos. Al hacer click cierra el modal.
- [x] 5.4 Implementar Paso 2b (Escritura): mismo layout que 5.3 pero campo principal es CONSIGNA (maxLength 2000, contador `X / 2000 characters`). Botón "Crear tarea" deshabilitado si título o consigna vacíos.
- [x] 5.5 Indicador de pasos: dos segmentos (rectángulos redondeados, `width: 24px, height: 4px`) — gris el inactivo, teal `#00b89c` el activo. Mostrar en footer del modal junto a los botones de acción.
- [x] 5.6 Botones footer: izquierda "Cancelar" / "← Volver" (texto simple, color `#6b7280`); derecha "Siguiente →" / "Crear tarea ✓" (fondo teal, blanco, `borderRadius: 8, padding: 10px 20px`).

## 6. CoursePage — página principal con tabs

- [x] 6.1 Crear `apps/web/src/pages/CoursePage/CoursePage.tsx`. Lee `courseId` de `useParams`. Estado local `activeTab: 'alumnos' | 'tareas'` inicializado en `'alumnos'`. Estado `isModalOpen: boolean`.
- [x] 6.2 Header: título "Curso" + nombre del curso hardcodeado como `"4to A — Turno Matutino"` (se reemplazará por fetch en el futuro). Tabs con el mismo estilo pill que los filtros de alumnos.
- [x] 6.3 Renderizar `<StudentsTab courseId={courseId} />` cuando `activeTab === 'alumnos'`.
- [x] 6.4 Renderizar `<TasksTab onAdd={() => setIsModalOpen(true)} courseId={courseId} />` cuando `activeTab === 'tareas'`.
- [x] 6.5 Renderizar `<NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} courseName="4to A — Turno Matutino" />`.
- [x] 6.6 Importar y registrar `CoursePage` en `App.tsx`.

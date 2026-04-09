## Context

La pantalla `/courses/:courseId/students` (`Students.tsx`) es hoy una página standalone con tabla de alumnos. Se convierte en un tab dentro de una nueva página de curso (`CoursePage`). El segundo tab, Tareas, es completamente nuevo y de momento solo muestra datos mock.

El sistema de diseño del proyecto usa tokens propios (no Tailwind): colores `#00b89c` (teal primario), `#111827` (texto principal), `#6b7280` (secundario), `#f3f4f6` (fondo chips), cards con `borderRadius: 12`, `boxShadow: 0 1px 4px rgba(0,0,0,0.06)`, fuente Inter.

## Goals / Non-Goals

**Goals:**
- Página de curso con tabs Alumnos / Tareas, tab Alumnos activo por defecto.
- Modal wizard 2 pasos para crear tarea (sin persistencia).
- Lista mock de tareas con progreso de clase como prop.
- Rutas actualizadas, `/courses/:courseId/students` redirige.

**Non-Goals:**
- API calls para tareas.
- Detalle de tarea por alumno.
- Botón "Crear con IA".

## Decisions

### Decisión 1: Tab state en URL vs estado local

**Opciones:**
- A) Tab como query param: `/courses/:courseId?tab=tareas`
- B) Tab como estado local React (`useState`)

**Decisión: B (estado local).** No hay necesidad de linkear directamente al tab de Tareas desde otro lugar en el MVP. El estado local evita complejidad en el router.

### Decisión 2: Extraer lógica de Students como sub-componente

`Students.tsx` hoy es una página completa con su propio header y botón "Agregar alumno". Al convertirlo en tab, el header pasa a `CoursePage`. La tabla y sus filtros se extraen como `<StudentsTab courseId={courseId} />`.

El componente `Students` puede quedar como wrapper para la ruta redirect si se necesita, o simplemente eliminarse y actualizar las rutas.

### Decisión 3: Modal con portal vs inline

El modal del wizard se renderiza con `position: fixed` sobre el layout existente, sin portal ReactDOM. Suficiente para desktop MVP.

### Decisión 4: Datos mock hardcodeados en el componente

Las tareas mock se definen como constante en `CoursePage.tsx`. Cada `TaskRow` recibe `{ id, type, title, date, progress }`. Cuando se implemente la API, se reemplaza la constante por un fetch.

## Estructura de componentes

```
pages/
  CoursePage/
    CoursePage.tsx        ← página principal con tabs
    StudentsTab.tsx       ← tabla de alumnos (extraída de Students.tsx)
    TasksTab.tsx          ← lista de tareas mock
    TaskRow.tsx           ← fila individual de tarea
    NewTaskModal.tsx      ← wizard 2 pasos
```

## Diseño del modal wizard

```
┌─────────────────────────────────────────────────────┐
│  Nueva Tarea                                      × │  ← header teal superior
│  Paso 1 de 2                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ┌──────────────────┐  ┌──────────────────┐       │
│   │   📖             │  │   ✏️             │       │
│   │   Lectura        │  │   Escritura      │       │
│   │                  │  │                  │       │
│   │ Actividades de   │  │ Ejercicios de    │       │
│   │ comprensión...   │  │ redacción...     │       │
│   └──────────────────┘  └──────────────────┘       │
│                                                     │
│  Cancelar              ●○      [Siguiente →]        │
└─────────────────────────────────────────────────────┘

Paso 2 (Lectura):
┌─────────────────────────────────────────────────────┐
│  Nueva Tarea — Lectura                            × │
│  Paso 2 de 2 · Curso: 4to A                         │
├─────────────────────────────────────────────────────┤
│  TÍTULO *                                           │
│  [________________________________]                 │
│                                                     │
│  TEXTO *                                            │
│  [textarea grande, 5000 chars]                      │
│                                   0 / 5000          │
│                                                     │
│  CRITERIO DE EVALUACIÓN  OPCIONAL                   │
│  [textarea pequeño]                                 │
│                                                     │
│  ← Volver         ○●     [Crear tarea ✓]            │
└─────────────────────────────────────────────────────┘
```

## Diseño de TaskRow

```
┌──────────────────────────────────────────────────────────────────┐
│ [LECTURA]  El zorro y la luna          PROGRESO DE LA CLASE  👁  │
│  📅 12 de Octubre                   ████████████░░░░  85%        │
└──────────────────────────────────────────────────────────────────┘
```

- Badge LECTURA: `bg: #f0fdfa, color: #0d9488` (teal claro)
- Badge ESCRITURA: `bg: #faf5ff, color: #7c3aed` (violeta claro)
- Barra de progreso: verde ≥80%, amarillo ≥50%, rojo <50%
- Ícono ojo: `HiEye` de hi2, navega a `/courses/:courseId/tasks/:taskId`

## Datos mock

```ts
const MOCK_TASKS = [
  { id: '1', type: 'lectura',   title: 'El zorro y la luna',      date: '12 de Octubre',  progress: 85 },
  { id: '2', type: 'escritura', title: 'Mi aventura espacial',     date: '15 de Octubre',  progress: 42 },
  { id: '3', type: 'lectura',   title: 'Leyendas del Uruguay',     date: '20 de Octubre',  progress: 100 },
  { id: '4', type: 'lectura',   title: 'Cuentos de la Selva',      date: '25 de Octubre',  progress: 45 },
  { id: '5', type: 'escritura', title: 'Poesía Cotidiana',         date: '28 de Octubre',  progress: 20 },
  { id: '6', type: 'lectura',   title: 'Viaje al Centro de la Tierra', date: '1 de Noviembre', progress: 92 },
];
```

## Rutas

| Ruta | Componente | Notas |
|------|-----------|-------|
| `/courses/:courseId` | `CoursePage` | nueva, tab Alumnos por defecto |
| `/courses/:courseId/students` | redirect → `/courses/:courseId` | compatibilidad |
| `/courses/:courseId/tasks/:taskId` | placeholder "Próximamente" | ícono ojo |

## Open Questions

- ¿El botón "Crear tarea" del wizard muestra un toast de confirmación o simplemente cierra el modal? (En el mockup: cierra el modal, no persiste nada.)

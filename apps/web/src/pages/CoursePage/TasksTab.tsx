import { useState } from 'react';
import { TaskRow } from './TaskRow';

type TaskType = 'lectura' | 'escritura';
type TaskFilter = 'todas' | TaskType;

interface MockTask {
  id: string;
  type: TaskType;
  title: string;
  date: string;
  progress: number;
}

const MOCK_TASKS: MockTask[] = [
  { id: '1', type: 'lectura',   title: 'El zorro y la luna',           date: '12 de Octubre',    progress: 85  },
  { id: '2', type: 'escritura', title: 'Mi aventura espacial',          date: '15 de Octubre',    progress: 42  },
  { id: '3', type: 'lectura',   title: 'Leyendas del Uruguay',          date: '20 de Octubre',    progress: 100 },
  { id: '4', type: 'lectura',   title: 'Cuentos de la Selva',           date: '25 de Octubre',    progress: 45  },
  { id: '5', type: 'escritura', title: 'Poesía Cotidiana',              date: '28 de Octubre',    progress: 20  },
  { id: '6', type: 'lectura',   title: 'Viaje al Centro de la Tierra',  date: '1 de Noviembre',   progress: 92  },
];

const FILTERS: { label: string; value: TaskFilter }[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Lectura', value: 'lectura' },
  { label: 'Escritura', value: 'escritura' },
];

interface Props {
  courseId: string;
  onAdd: () => void;
}

export function TasksTab({ courseId, onAdd }: Props) {
  const [filter, setFilter] = useState<TaskFilter>('todas');

  const filtered = filter === 'todas' ? MOCK_TASKS : MOCK_TASKS.filter((t) => t.type === filter);

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '8px 18px', borderRadius: 8,
                background: filter === f.value ? '#00b89c' : '#f3f4f6',
                color: filter === f.value ? '#fff' : '#374151',
                border: 'none',
                fontWeight: filter === f.value ? 600 : 400,
                fontSize: 14, cursor: 'pointer',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={onAdd}
          style={{
            background: '#00b89c', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          + Agregar tarea
        </button>
      </div>

      {/* Lista */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((task) => (
          <TaskRow
            key={task.id}
            id={task.id}
            type={task.type}
            title={task.title}
            date={task.date}
            progress={task.progress}
            courseId={courseId}
          />
        ))}
        {filtered.length === 0 && (
          <p style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>
            No hay tareas de este tipo.
          </p>
        )}
      </div>
    </div>
  );
}

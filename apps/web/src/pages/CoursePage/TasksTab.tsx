import { useEffect, useState } from 'react';
import { getCourseTasksList } from '../../api/courses';
import { TaskRow } from './TaskRow';

type TaskType = 'lectura' | 'escritura';
type TaskFilter = 'todas' | TaskType;

interface CourseTask {
  id: number;
  name: string;
  type: TaskType;
  date: string;
  progress: number;
}

const FILTERS: { label: string; value: TaskFilter }[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Lectura', value: 'lectura' },
  { label: 'Escritura', value: 'escritura' },
];

interface Props {
  courseId: string;
  onAdd: () => void;
  refreshKey?: number;
}

export function TasksTab({ courseId, onAdd, refreshKey }: Props) {
  const [filter, setFilter] = useState<TaskFilter>('todas');
  const [tasks, setTasks] = useState<CourseTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getCourseTasksList(courseId)
      .then(setTasks)
      .finally(() => setLoading(false));
  }, [courseId, refreshKey]);

  const filtered = filter === 'todas' ? tasks : tasks.filter((t) => t.type === filter);

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
      {loading ? (
        <p style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>
          Cargando tareas...
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((task) => (
            <TaskRow
              key={task.id}
              id={String(task.id)}
              type={task.type}
              title={task.name}
              date={task.date}
              progress={task.progress}
              courseId={courseId}
            />
          ))}
          {filtered.length === 0 && (
            <p style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>
              {tasks.length === 0 ? 'No hay tareas creadas aún.' : 'No hay tareas de este tipo.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

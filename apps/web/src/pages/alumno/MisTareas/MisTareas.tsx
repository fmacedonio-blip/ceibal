import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiPencil, HiMicrophone } from 'react-icons/hi2';
import { getTasks } from '../../../api/alumno';
import type { Task } from '../../../types/alumno';
import { Spinner } from '../../../components/Spinner/Spinner';

type TypeFilter = 'todas' | 'escritura' | 'lectura';

const FILTERS: { label: string; value: TypeFilter }[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Escritura', value: 'escritura' },
  { label: 'Lectura', value: 'lectura' },
];

const ICON_STYLES: Record<'escritura' | 'lectura', { bg: string; color: string }> = {
  escritura: { bg: '#fef9c2', color: '#ca8a04' },
  lectura:   { bg: '#fce7f3', color: '#db2777' },
};

function TaskIcon({ type }: { type: 'escritura' | 'lectura' }) {
  const s = ICON_STYLES[type];
  return (
    <div style={{
      width: 52, height: 52, borderRadius: 16, flexShrink: 0,
      background: s.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {type === 'escritura'
        ? <HiPencil size={24} color={s.color} />
        : <HiMicrophone size={24} color={s.color} />}
    </div>
  );
}

export function MisTareas() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TypeFilter>('todas');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getTasks().then(setTasks).finally(() => setLoading(false));
  }, []);

  const sorted = [...tasks].sort((a, b) => {
    if (a.status === 'NO_ENTREGADO' && b.status !== 'NO_ENTREGADO') return -1;
    if (a.status !== 'NO_ENTREGADO' && b.status === 'NO_ENTREGADO') return 1;
    return b.id - a.id;
  });

  const filtered = filter === 'todas' ? sorted : sorted.filter((t) => t.type === filter);

  return (
    <div>
      {/* Título centrado */}
      <h1 style={{
        fontSize: 32, fontWeight: 700,
        color: '#009689',
        textAlign: 'center',
        marginBottom: 24,
      }}>
        Mis Tareas
      </h1>

      {/* Filtros centrados */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
        {FILTERS.map((f) => {
          const isActive = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '8px 22px',
                borderRadius: 999,
                border: 'none',
                background: isActive ? '#fde047' : 'transparent',
                color: isActive ? '#92400e' : '#4a5565',
                fontWeight: isActive ? 700 : 500,
                fontSize: 15,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading && (
        <Spinner />
      )}

      {!loading && filtered.length === 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.8)', borderRadius: 16,
          padding: '48px 32px', textAlign: 'center', color: '#9ca3af', fontSize: 15,
        }}>
          No tenés tareas {filter !== 'todas' ? `de ${filter}` : ''} aún.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((task) => {
          const isPending = task.status === 'NO_ENTREGADO';
          const isClickable = !isPending && !!task.submission_id;

          return (
            <div
              key={task.id}
              onClick={isClickable ? () => navigate(
                `/alumno/tarea/${task.id}/correccion-${task.type}`,
                { state: { submissionId: task.submission_id } }
              ) : undefined}
              onMouseEnter={(e) => { if (isClickable) e.currentTarget.style.background = 'rgba(255,255,255,0.97)'; }}
              onMouseLeave={(e) => { if (isClickable) e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; }}
              style={{
                background: 'rgba(255,255,255,0.85)',
                borderRadius: 16,
                padding: '18px 22px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.05)',
                display: 'flex', alignItems: 'center', gap: 16,
                cursor: isClickable ? 'pointer' : 'default',
              }}
            >
              <TaskIcon type={task.type} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1e2939', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {task.name}
                </div>
                {task.date && (
                  <div style={{ fontSize: 13, color: '#4a5565' }}>{task.date}</div>
                )}
              </div>

              {/* Acción / badge */}
              {isPending ? (
                <button
                  onClick={(e) => { e.stopPropagation(); navigate(`/alumno/tarea/${task.id}/${task.type}`); }}
                  style={{
                    padding: '10px 24px', borderRadius: 999, border: 'none',
                    background: 'linear-gradient(90deg, #00bba7, #00b8db)',
                    color: '#fff', fontSize: 14, fontWeight: 600,
                    cursor: 'pointer', flexShrink: 0,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  }}
                >
                  Empezar
                </button>
              ) : (
                <span style={{
                  padding: '7px 18px', borderRadius: 999, flexShrink: 0,
                  background: '#dcfce7', color: '#008236',
                  fontSize: 14, fontWeight: 600,
                }}>
                  ¡Completada!
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

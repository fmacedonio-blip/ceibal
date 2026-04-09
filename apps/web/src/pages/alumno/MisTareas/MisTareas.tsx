import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiPencil, HiMicrophone, HiArrowLeft } from 'react-icons/hi2';
import { getTasks } from '../../../api/alumno';
import type { Task } from '../../../types/alumno';

type TypeFilter = 'todas' | 'escritura' | 'lectura';

const FILTERS: { label: string; value: TypeFilter }[] = [
  { label: 'Todas', value: 'todas' },
  { label: 'Escritura', value: 'escritura' },
  { label: 'Lectura', value: 'lectura' },
];

export function MisTareas() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TypeFilter>('todas');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getTasks().then(setTasks).finally(() => setLoading(false));
  }, []);

  // Pendientes primero, luego completadas (más recientes primero por id desc)
  const sorted = [...tasks].sort((a, b) => {
    if (a.status === 'NO_ENTREGADO' && b.status !== 'NO_ENTREGADO') return -1;
    if (a.status !== 'NO_ENTREGADO' && b.status === 'NO_ENTREGADO') return 1;
    return b.id - a.id;
  });

  const filtered = filter === 'todas' ? sorted : sorted.filter((t) => t.type === filter);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <Link
          to="/alumno/inicio"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, textDecoration: 'none', marginBottom: 12 }}
        >
          <HiArrowLeft size={14} /> Volver al inicio
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>Mis Tareas</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
          {loading ? 'Cargando...' : `${tasks.length} tarea${tasks.length !== 1 ? 's' : ''} en total`}
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '8px 18px', borderRadius: 20, border: 'none',
              background: filter === f.value ? '#00b89c' : '#f3f4f6',
              color: filter === f.value ? '#fff' : '#374151',
              fontWeight: filter === f.value ? 600 : 400,
              fontSize: 14, cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '48px 32px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          No tenés tareas {filter !== 'todas' ? `de ${filter}` : ''} aún.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map((task) => {
          const isEscritura = task.type === 'escritura';
          const isPending = task.status === 'NO_ENTREGADO';

          return (
            <div
              key={task.id}
              style={{
                background: '#fff', borderRadius: 12, padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              {/* Ícono tipo */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: isEscritura ? '#eff6ff' : '#f0fdf4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isEscritura
                  ? <HiPencil size={20} color="#3b82f6" />
                  : <HiMicrophone size={20} color="#16a34a" />}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 2 }}>
                  {task.subject} · {isEscritura ? 'Escritura' : 'Lectura'}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {task.name}
                </div>
                {task.date && !isPending && (
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{task.date}</div>
                )}
              </div>

              {/* Acción */}
              {isPending ? (
                <Link
                  to={`/alumno/tarea/${task.id}/${task.type}`}
                  style={{
                    padding: '8px 18px', borderRadius: 8, flexShrink: 0,
                    background: '#00b89c', color: '#fff',
                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  Empezar
                </Link>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: 20,
                    background: '#dcfce7', color: '#166534',
                    fontSize: 12, fontWeight: 600,
                  }}>
                    ¡Completada!
                  </span>
                  {task.submission_id && (
                    <button
                      onClick={() => navigate(
                        `/alumno/tarea/${task.id}/correccion-${task.type}`,
                        { state: { submissionId: task.submission_id } }
                      )}
                      style={{
                        padding: '8px 14px', borderRadius: 8, border: '1px solid #d1d5db',
                        background: '#fff', color: '#374151',
                        fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      }}
                    >
                      Ver corrección
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

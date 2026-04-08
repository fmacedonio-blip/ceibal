import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiPencil, HiMicrophone, HiArrowLeft } from 'react-icons/hi2';
import { getTasks } from '../../../api/alumno';
import type { Task, TaskStatus } from '../../../types/alumno';

const STATUS_LABEL: Record<TaskStatus, string> = {
  NO_ENTREGADO: 'Pendiente',
  PENDIENTE_DE_REVISION: 'En revisión',
  COMPLETADA: 'Entregada',
  CORREGIDA: 'Corregida',
  REVISADA: 'Revisada',
};

const STATUS_STYLE: Record<TaskStatus, { bg: string; color: string }> = {
  NO_ENTREGADO:          { bg: '#fee2e2', color: '#991b1b' },
  PENDIENTE_DE_REVISION: { bg: '#fef3c7', color: '#92400e' },
  COMPLETADA:            { bg: '#dcfce7', color: '#166534' },
  CORREGIDA:             { bg: '#dcfce7', color: '#166534' },
  REVISADA:              { bg: '#e0f2fe', color: '#075985' },
};

export function MisTareas() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTasks().then(setTasks).finally(() => setLoading(false));
  }, []);

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

      {!loading && tasks.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '48px 32px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          No tenés tareas asignadas aún.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {tasks.map((task) => {
          const isEscritura = task.type === 'escritura';
          const isPending = task.status === 'NO_ENTREGADO';
          const statusStyle = STATUS_STYLE[task.status] ?? { bg: '#f3f4f6', color: '#6b7280' };

          return (
            <div
              key={task.id}
              style={{
                background: '#fff', borderRadius: 12, padding: '20px 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                display: 'flex', alignItems: 'center', gap: 16,
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: isEscritura ? '#eff6ff' : '#f0fdf4',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isEscritura
                  ? <HiPencil size={20} color="#3b82f6" />
                  : <HiMicrophone size={20} color="#16a34a" />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 2 }}>
                  {task.subject} · {isEscritura ? 'Escritura' : 'Lectura'}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{task.name}</div>
              </div>

              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: statusStyle.bg, color: statusStyle.color,
                marginRight: 8,
              }}>
                {STATUS_LABEL[task.status] ?? task.status}
              </span>

              {isPending && (
                <Link
                  to={`/alumno/tarea/${task.id}/${task.type}`}
                  style={{
                    padding: '8px 16px', borderRadius: 8,
                    background: '#00b89c', color: '#fff',
                    fontSize: 13, fontWeight: 600, textDecoration: 'none', flexShrink: 0,
                  }}
                >
                  Empezar
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

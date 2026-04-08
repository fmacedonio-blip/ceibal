import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiPencil, HiMicrophone, HiClipboardDocumentList } from 'react-icons/hi2';
import { getTasks } from '../../../api/alumno';
import { useAuthStore } from '../../../store/auth';
import type { Task } from '../../../types/alumno';

const PENDING_STATUSES = ['NO_ENTREGADO', 'PENDIENTE_DE_REVISION'];

export function Inicio() {
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTasks()
      .then((all) => setTasks(all.filter((t) => PENDING_STATUSES.includes(t.status))))
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
          ¡Hola, {firstName}! 👋
        </h1>
        <p style={{ fontSize: 15, color: '#6b7280' }}>
          {loading
            ? 'Cargando tus tareas...'
            : tasks.length > 0
            ? `Tenés ${tasks.length} tarea${tasks.length > 1 ? 's' : ''} pendiente${tasks.length > 1 ? 's' : ''}.`
            : '¡No tenés tareas pendientes por ahora!'}
        </p>
      </div>

      {/* Empty state */}
      {!loading && tasks.length === 0 && (
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '64px 32px',
          textAlign: 'center',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
            ¡Estás al día!
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
            No tenés tareas pendientes. Tu docente te va a asignar nuevas tareas pronto.
          </p>
          <Link
            to="/alumno/tareas"
            style={{ color: '#00b89c', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
          >
            Ver historial de tareas →
          </Link>
        </div>
      )}

      {/* Task cards */}
      {!loading && tasks.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <Link
              to="/alumno/tareas"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: '#6b7280', fontSize: 14, textDecoration: 'none',
                padding: '8px 16px', border: '1px solid #e5e7eb',
                borderRadius: 8, background: '#fff',
              }}
            >
              <HiClipboardDocumentList size={16} />
              Ver todas mis tareas
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  const isEscritura = task.type === 'escritura';
  const href = `/alumno/tarea/${task.id}/${task.type}`;

  return (
    <Link
      to={href}
      style={{ textDecoration: 'none' }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '24px 28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', gap: 20,
        border: '2px solid transparent',
        transition: 'border-color 0.15s',
        cursor: 'pointer',
      }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00b89c')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
      >
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: 16, flexShrink: 0,
          background: isEscritura ? '#eff6ff' : '#f0fdf4',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {isEscritura
            ? <HiPencil size={24} color="#3b82f6" />
            : <HiMicrophone size={24} color="#16a34a" />}
        </div>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.06em', marginBottom: 4 }}>
            {task.subject.toUpperCase()} · {isEscritura ? 'ESCRITURA' : 'LECTURA'}
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            {task.name}
          </h3>
          {task.description && (
            <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
              {task.description}
            </p>
          )}
        </div>

        {/* CTA */}
        <div style={{
          padding: '10px 20px', borderRadius: 10,
          background: '#00b89c', color: '#fff',
          fontSize: 14, fontWeight: 600, flexShrink: 0,
        }}>
          Empezar
        </div>
      </div>
    </Link>
  );
}

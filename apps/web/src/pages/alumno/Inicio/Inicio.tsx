import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiPencil, HiMicrophone, HiCheckCircle } from 'react-icons/hi2';
import { getTasks } from '../../../api/alumno';
import { useAuthStore } from '../../../store/auth';
import type { Task } from '../../../types/alumno';

function TaskTypeIcon({ type }: { type: 'escritura' | 'lectura' }) {
  const isEscritura = type === 'escritura';
  return (
    <div style={{
      width: 48, height: 48, borderRadius: 14, flexShrink: 0,
      background: isEscritura ? '#eff6ff' : '#f0fdf4',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {isEscritura
        ? <HiPencil size={22} color="#3b82f6" />
        : <HiMicrophone size={22} color="#16a34a" />}
    </div>
  );
}

export function Inicio() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTasks().then(setTasks).finally(() => setLoading(false));
  }, []);

  const firstName = user?.name.split(' ')[0] ?? '';
  const pendientes = tasks.filter((t) => t.status === 'NO_ENTREGADO');
  const completadas = tasks.filter((t) => t.status === 'COMPLETADA').slice(0, 3);

  return (
    <div>
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
          ¡Hola, {firstName}!
        </h1>
        <p style={{ fontSize: 15, color: '#6b7280' }}>
          {loading ? 'Cargando tus tareas...' : '¿Qué aprenderemos hoy?'}
        </p>
      </div>

      {!loading && (
        <>
          {/* Sección: Nueva Tarea */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
              Nueva Tarea
            </h2>

            {pendientes.length === 0 ? (
              /* Card "Estás al día" */
              <div style={{
                background: '#fff', borderRadius: 16, padding: '36px 28px',
                textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                border: '1px solid #d1fae5',
              }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <HiCheckCircle size={44} color="#00b89c" />
                </div>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
                  ¡Estás al día!
                </p>
                <p style={{ fontSize: 14, color: '#6b7280' }}>
                  Tu docente te va a asignar nuevas tareas pronto.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pendientes.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      background: '#fff', borderRadius: 14, padding: '18px 20px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      display: 'flex', alignItems: 'center', gap: 16,
                    }}
                  >
                    <TaskTypeIcon type={task.type} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 2 }}>
                        {task.subject}
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 2 }}>
                        {task.name}
                      </div>
                      {task.description && (
                        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.description}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/alumno/tarea/${task.id}/${task.type}`)}
                      style={{
                        padding: '10px 22px', borderRadius: 10, border: 'none',
                        background: '#00b89c', color: '#fff',
                        fontSize: 14, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      Empezar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sección: Mis Tareas (completadas recientes) */}
          {completadas.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>Mis Tareas</h2>
                <Link
                  to="/alumno/tareas"
                  style={{ fontSize: 14, fontWeight: 600, color: '#00b89c', textDecoration: 'none' }}
                >
                  Ver todas →
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {completadas.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      background: '#fff', borderRadius: 14, padding: '16px 20px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    <TaskTypeIcon type={task.type} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.name}
                      </div>
                      {task.date && (
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{task.date}</div>
                      )}
                    </div>
                    <span style={{
                      padding: '4px 12px', borderRadius: 20, flexShrink: 0,
                      background: '#dcfce7', color: '#166534',
                      fontSize: 12, fontWeight: 600,
                    }}>
                      ¡Completada!
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

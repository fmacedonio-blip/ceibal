import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HiPencil, HiMicrophone, HiSparkles, HiStar } from 'react-icons/hi2';
import { getTasks } from '../../../api/alumno';
import { useAuthStore } from '../../../store/auth';
import { Spinner } from '../../../components/Spinner/Spinner';
import type { Task } from '../../../types/alumno';

const ICON_STYLES: Record<'escritura' | 'lectura', { bg: string; color: string }> = {
  escritura: { bg: '#fef9c2', color: '#ca8a04' },
  lectura:   { bg: '#fce7f3', color: '#db2777' },
};

function TaskTypeIcon({ type }: { type: 'escritura' | 'lectura' }) {
  const s = ICON_STYLES[type];
  return (
    <div style={{
      width: 56, height: 56, borderRadius: 16, flexShrink: 0,
      background: s.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {type === 'escritura'
        ? <HiPencil size={26} color={s.color} />
        : <HiMicrophone size={26} color={s.color} />}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

      {/* Saludo */}
      <div>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: '#1e2939', marginBottom: 6, letterSpacing: '-0.5px' }}>
          ¡Hola, {firstName}!
        </h1>
        <p style={{ fontSize: 17, color: '#4a5565' }}>¿Qué aprenderemos hoy?</p>
      </div>

      {loading ? <Spinner /> : (
        <>
          {/* Nueva Tarea */}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e2939', marginBottom: 16 }}>
              Nueva Tarea
            </h2>

            {pendientes.length === 0 ? (
              <div style={{
                background: 'linear-gradient(135deg, #00bba7, #00b8db)',
                borderRadius: 20, padding: '28px 28px',
                boxShadow: '0 8px 20px rgba(0,184,219,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>
                    ¡Felicitaciones!
                  </p>
                  <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.9)' }}>
                    No tenés tareas pendientes. ¡Seguí así, {firstName}! 🌟
                  </p>
                </div>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <HiSparkles size={30} color="#fff" />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {pendientes.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      borderRadius: 16,
                      padding: '20px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.06)',
                      display: 'flex', alignItems: 'center', gap: 16,
                    }}
                  >
                    <TaskTypeIcon type={task.type} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#6a7282', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 3, textTransform: 'uppercase' }}>
                        {task.subject}
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 700, color: '#1e2939', marginBottom: 2 }}>
                        {task.name}
                      </div>
                      {(task.description ?? task.reading_text) && (
                        <div style={{ fontSize: 13, color: '#4a5565', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.description ?? task.reading_text}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/alumno/tarea/${task.id}/${task.type}`)}
                      style={{
                        padding: '11px 26px',
                        borderRadius: 999,
                        border: 'none',
                        background: 'linear-gradient(90deg, #00bba7, #00b8db)',
                        color: '#fff',
                        fontSize: 15,
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      }}
                    >
                      Empezar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tu camino de aprendizaje */}
          <div style={{
            background: 'rgba(255,255,255,0.7)',
            borderRadius: 24,
            padding: '24px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05)',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 999, flexShrink: 0,
                background: 'linear-gradient(135deg, #fdc700, #ff8904)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(253,199,0,0.4)',
              }}>
                <HiStar size={26} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#1e2939' }}>
                  Tu camino de aprendizaje
                </p>
                <p style={{ fontSize: 14, color: '#4a5565' }}>
                  ¡Estás a solo 3 tareas de tu próxima estrella!
                </p>
              </div>
            </div>
            <div style={{ background: '#e5e7eb', borderRadius: 999, height: 12, overflow: 'hidden' }}>
              <div style={{
                height: 12,
                width: '62%',
                background: 'linear-gradient(90deg, #00d5be, #00d3f3)',
                borderRadius: 999,
              }} />
            </div>
          </div>

          {/* Mis Tareas completadas */}
          {completadas.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e2939' }}>Mis Tareas</h2>
                <Link
                  to="/alumno/tareas"
                  style={{ fontSize: 14, fontWeight: 600, color: '#009689', textDecoration: 'none' }}
                >
                  Ver todas →
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {completadas.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => task.submission_id && navigate(
                      `/alumno/tarea/${task.id}/correccion-${task.type}`,
                      { state: { submissionId: task.submission_id } }
                    )}
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      borderRadius: 16,
                      padding: '20px 24px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
                      display: 'flex', alignItems: 'center', gap: 16,
                      cursor: task.submission_id ? 'pointer' : 'default',
                    }}
                    onMouseEnter={(e) => { if (task.submission_id) e.currentTarget.style.background = 'rgba(255,255,255,0.97)'; }}
                    onMouseLeave={(e) => { if (task.submission_id) e.currentTarget.style.background = 'rgba(255,255,255,0.85)'; }}
                  >
                    <TaskTypeIcon type={task.type} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 700, color: '#1e2939', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.name}
                      </div>
                      {task.date && (
                        <div style={{ fontSize: 13, color: '#4a5565', marginTop: 3 }}>{task.date}</div>
                      )}
                    </div>
                    <span style={{
                      padding: '7px 18px', borderRadius: 999, flexShrink: 0,
                      background: '#dcfce7', color: '#008236',
                      fontSize: 14, fontWeight: 600,
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

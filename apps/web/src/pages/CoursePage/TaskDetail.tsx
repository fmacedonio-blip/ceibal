import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft, HiExclamationTriangle } from 'react-icons/hi2';
import { getTaskStudents } from '../../api/courses';
import type { TaskDetailResponse, TaskStudentRow } from '../../api/courses';
import { Avatar } from '../../components/Avatar/Avatar';

const TYPE_BADGE = {
  lectura:   { bg: '#f0fdfa', color: '#0d9488', label: 'LECTURA' },
  escritura: { bg: '#faf5ff', color: '#7c3aed', label: 'ESCRITURA' },
};

function StatusBadge({ status }: { status: TaskStudentRow['status'] }) {
  const isComplete = status === 'COMPLETADA';
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      background: isComplete ? '#dcfce7' : '#f3f4f6',
      color: isComplete ? '#166534' : '#6b7280',
    }}>
      {isComplete ? 'Completada' : 'Pendiente'}
    </span>
  );
}

function ReviewCell({ requiresReview }: { requiresReview: boolean | null | undefined }) {
  if (!requiresReview) return <span style={{ color: '#9ca3af' }}>—</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      background: '#fff7ed', color: '#c2410c',
    }}>
      <HiExclamationTriangle size={13} />
      Revisar
    </span>
  );
}

function MetricCell({ value, suffix = '' }: { value: number | null | undefined; suffix?: string }) {
  if (value == null) return <span style={{ color: '#9ca3af' }}>—</span>;
  return <span style={{ fontSize: 13, color: '#111827', fontWeight: 500 }}>{value}{suffix}</span>;
}

export function TaskDetail() {
  const { courseId, taskId } = useParams<{ courseId: string; taskId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TaskDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId || !taskId) return;
    getTaskStudents(courseId, taskId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [courseId, taskId]);

  const task = data?.task;
  const students = data?.students ?? [];
  const isLectura = task?.type === 'lectura';
  const badge = task ? TYPE_BADGE[task.type] : null;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => navigate(`/courses/${courseId}?tab=tareas`)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#6b7280', fontSize: 13, background: 'none',
            border: 'none', cursor: 'pointer', marginBottom: 16, padding: 0,
            fontFamily: 'inherit',
          }}
        >
          <HiArrowLeft size={14} /> Volver a tareas
        </button>

        {loading ? (
          <p style={{ fontSize: 14, color: '#9ca3af' }}>Cargando...</p>
        ) : task && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            {/* Tipo + título */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              {badge && (
                <span style={{
                  background: badge.bg, color: badge.color,
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                  padding: '3px 10px', borderRadius: 4, flexShrink: 0,
                }}>
                  {badge.label}
                </span>
              )}
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
                {task.name}
              </h1>
              <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 'auto', flexShrink: 0 }}>
                {task.date}
              </span>
            </div>

            {/* Descripción / Consigna */}
            {(task.description || task.reading_text) && (
              <p style={{
                fontSize: 14, color: '#374151', lineHeight: 1.6,
                marginTop: 10, paddingTop: 10,
                borderTop: '1px solid #f3f4f6',
                whiteSpace: 'pre-wrap',
                maxHeight: 120, overflow: 'hidden',
                display: '-webkit-box', WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
              }}>
                {task.description ?? task.reading_text}
              </p>
            )}

            {/* Criterio de evaluación */}
            {task.evaluation_criteria && (
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8, fontStyle: 'italic' }}>
                Criterio: {task.evaluation_criteria}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tabla */}
      {!loading && (
        <div style={{ background: '#fff', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={thStyle}>ALUMNO</th>
                <th style={thCenterStyle}>ESTADO</th>
                {isLectura ? (
                  <>
                    <th style={thCenterStyle}>PPM</th>
                    <th style={thCenterStyle}>PRECISIÓN</th>
                  </>
                ) : (
                  <>
                    <th style={thCenterStyle}>ERRORES</th>
                    <th style={thCenterStyle}>ORTOGRAFÍA</th>
                  </>
                )}
                <th style={thCenterStyle}>REVISIÓN</th>
              </tr>
            </thead>
            <tbody>
              {students.map((row) => {
                const isComplete = row.status === 'COMPLETADA' && row.activity_id != null;
                return (
                <tr
                  key={row.student_id}
                  onClick={isComplete ? () => navigate(`/students/${row.student_id}/activities/${row.activity_id}`) : undefined}
                  style={{ borderTop: '1px solid #f3f4f6', cursor: isComplete ? 'pointer' : 'default' }}
                  onMouseEnter={isComplete ? (e) => (e.currentTarget.style.background = '#f9fafb') : undefined}
                  onMouseLeave={isComplete ? (e) => (e.currentTarget.style.background = '') : undefined}
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={row.name} size={32} fontSize={11} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{row.name}</span>
                    </div>
                  </td>
                  <td style={tdCenterStyle}>
                    <StatusBadge status={row.status} />
                  </td>
                  {isLectura ? (
                    <>
                      <td style={tdCenterStyle}><MetricCell value={row.metrics?.ppm} /></td>
                      <td style={tdCenterStyle}><MetricCell value={row.metrics?.precision} suffix="%" /></td>
                    </>
                  ) : (
                    <>
                      <td style={tdCenterStyle}><MetricCell value={row.metrics?.total_errors} /></td>
                      <td style={tdCenterStyle}><MetricCell value={row.metrics?.spelling_errors} /></td>
                    </>
                  )}
                  <td style={tdCenterStyle}>
                    <ReviewCell requiresReview={row.metrics?.requires_review} />
                  </td>
                </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '40px 16px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                    No hay alumnos en este curso.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 600,
  color: '#9ca3af',
  letterSpacing: '0.05em',
};

const thCenterStyle: React.CSSProperties = {
  ...thStyle,
  textAlign: 'center',
};

const tdStyle: React.CSSProperties = {
  padding: '14px 16px',
};

const tdCenterStyle: React.CSSProperties = {
  padding: '14px 16px',
  textAlign: 'center',
};

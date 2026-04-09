import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft, HiExclamationTriangle } from 'react-icons/hi2';
import { getCourse, getTaskStudents } from '../../api/courses';
import { Spinner } from '../../components/Spinner/Spinner';
import type { TaskDetailResponse, TaskStudentRow } from '../../api/courses';
import { Avatar } from '../../components/Avatar/Avatar';

// Minimum PPM and precision expected per grade
const PPM_MIN: Record<number, number> = { 1: 30, 2: 50, 3: 70, 4: 90, 5: 100, 6: 110 };
const PRECISION_MIN: Record<number, number> = { 1: 70, 2: 70, 3: 70, 4: 70, 5: 70, 6: 70 };
// Maximum total errors accepted per grade
const ERRORS_MAX: Record<number, number> = { 1: 8, 2: 6, 3: 5, 4: 5, 5: 4, 6: 3 };

function parseGrade(courseName: string): number {
  const match = courseName.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 4;
}

function hasProblems(row: TaskStudentRow, isLectura: boolean, grade: number): boolean {
  if (row.status !== 'COMPLETADA' || !row.metrics) return false;
  if (isLectura) {
    const ppm = row.metrics.ppm;
    const precision = row.metrics.precision;
    return (ppm != null && ppm < (PPM_MIN[grade] ?? 90)) ||
           (precision != null && precision < (PRECISION_MIN[grade] ?? 90));
  } else {
    const errors = row.metrics.total_errors;
    return errors != null && errors > (ERRORS_MAX[grade] ?? 5);
  }
}

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

function ProblemsCell({ problems }: { problems: boolean }) {
  if (!problems) return <span style={{ color: '#9ca3af' }}>—</span>;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20,
      fontSize: 12, fontWeight: 600,
      background: '#fef2f2', color: '#dc2626',
    }}>
      <HiExclamationTriangle size={13} />
      Dificultades
    </span>
  );
}

function MetricCell({ value, suffix = '', alert = false }: { value: number | null | undefined; suffix?: string; alert?: boolean }) {
  if (value == null) return <span style={{ color: '#9ca3af' }}>—</span>;
  return (
    <span style={{ fontSize: 13, fontWeight: 600, color: alert ? '#dc2626' : '#111827' }}>
      {value}{suffix}
    </span>
  );
}

export function TaskDetail() {
  const { courseId, taskId } = useParams<{ courseId: string; taskId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TaskDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState(4);

  useEffect(() => {
    if (!courseId || !taskId) return;
    getCourse(courseId).then((c) => setGrade(parseGrade(c.name)));
    getTaskStudents(courseId, taskId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [courseId, taskId]);

  const task = data?.task;
  const students = data?.students ?? [];
  const isLectura = task?.type === 'lectura';
  const badge = task ? TYPE_BADGE[task.type] : null;

  const completed = students.filter(s => s.status === 'COMPLETADA' && s.metrics);
  const completionPct = students.length > 0 ? Math.round((completed.length / students.length) * 100) : 0;
  const avgPpm = completed.length > 0
    ? Math.round(completed.reduce((sum, s) => sum + (s.metrics?.ppm ?? 0), 0) / completed.length)
    : null;
  const avgPrecision = completed.length > 0
    ? Math.round(completed.reduce((sum, s) => sum + (s.metrics?.precision ?? 0), 0) / completed.length)
    : null;
  const avgErrors = completed.length > 0
    ? (completed.reduce((sum, s) => sum + (s.metrics?.total_errors ?? 0), 0) / completed.length).toFixed(1)
    : null;

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
          <Spinner />
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

      {/* Estadísticas globales */}
      {!loading && students.length > 0 && (
        <div style={{
          background: '#fff', borderRadius: 10, padding: '18px 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap',
        }}>
          {/* Barra de completadas */}
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>Completadas</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                {completed.length} de {students.length}
              </span>
            </div>
            <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3 }}>
              <div style={{
                height: 6, borderRadius: 3, background: '#00b89c',
                width: `${completionPct}%`, transition: 'width 0.3s',
              }} />
            </div>
          </div>

          {/* Separador */}
          <div style={{ width: 1, height: 36, background: '#e5e7eb', flexShrink: 0 }} />

          {/* Métricas */}
          {isLectura ? (
            <>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>
                  {avgPpm ?? '—'}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginTop: 2 }}>PPM promedio</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>
                  {avgPrecision != null ? `${avgPrecision}%` : '—'}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginTop: 2 }}>Precisión promedio</div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>
                {avgErrors ?? '—'}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 500, marginTop: 2 }}>Errores promedio</div>
            </div>
          )}
        </div>
      )}

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
                <th style={thCenterStyle}>DIFICULTADES</th>
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
                      <td style={tdCenterStyle}><MetricCell value={row.metrics?.ppm} alert={(row.metrics?.ppm ?? null) !== null && row.metrics!.ppm! < (PPM_MIN[grade] ?? 90)} /></td>
                      <td style={tdCenterStyle}><MetricCell value={row.metrics?.precision} suffix="%" alert={(row.metrics?.precision ?? null) !== null && row.metrics!.precision! < (PRECISION_MIN[grade] ?? 90)} /></td>
                    </>
                  ) : (
                    <>
                      <td style={tdCenterStyle}><MetricCell value={row.metrics?.total_errors} alert={(row.metrics?.total_errors ?? null) !== null && row.metrics!.total_errors! > (ERRORS_MAX[grade] ?? 5)} /></td>
                      <td style={tdCenterStyle}><MetricCell value={row.metrics?.spelling_errors} alert={
                        row.metrics?.spelling_errors != null &&
                        row.metrics?.total_errors != null &&
                        row.metrics.total_errors > 0 &&
                        row.metrics.spelling_errors / row.metrics.total_errors > 0.5
                      } /></td>
                    </>
                  )}
                  <td style={tdCenterStyle}>
                    <ProblemsCell problems={hasProblems(row, isLectura, grade)} />
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

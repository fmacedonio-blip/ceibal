import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiCheckCircle, HiArrowLeft } from 'react-icons/hi2';
import { getStudent } from '../../api/students';
import type { ActivityHistory, StudentDetail } from '../../types/api';

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  CORREGIDA:             { bg: '#dcfce7', color: '#166534', label: 'Corregida' },
  COMPLETADA:            { bg: '#dcfce7', color: '#166534', label: 'Completada' },
  REVISADA:              { bg: '#e0f2fe', color: '#075985', label: 'Revisada' },
  NO_ENTREGADO:          { bg: '#fee2e2', color: '#991b1b', label: 'No entregado' },
  PENDIENTE_DE_REVISION: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente de revisión' },
};
const DEFAULT_STATUS_CONFIG = { bg: '#f3f4f6', color: '#6b7280', label: 'Desconocido' };

export function ActivityDetail() {
  const { studentId, activityId } = useParams<{ studentId: string; activityId: string }>();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [activity, setActivity] = useState<ActivityHistory | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    getStudent(studentId)
      .then((s) => {
        setStudent(s);
        const found = s.activity_history.find((a) => String(a.id) === activityId);
        if (!found) setError(true);
        else setActivity(found);
      })
      .catch(() => setError(true));
  }, [studentId, activityId]);

  if (error) {
    return (
      <div>
        <p style={{ fontSize: 14, color: '#dc2626' }}>Actividad no encontrada.</p>
        <Link to={`/students/${studentId}`} style={{ color: '#00b89c', fontSize: 14 }}>
          ← Volver al alumno
        </Link>
      </div>
    );
  }

  if (!student || !activity) {
    return <p style={{ color: '#6b7280', fontSize: 14 }}>Cargando...</p>;
  }

  const cfg = STATUS_CONFIG[activity.status] ?? DEFAULT_STATUS_CONFIG;
  const isCorrected = activity.status === 'CORREGIDA';

  return (
    <div>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link to="/courses" style={{ color: '#6b7280', textDecoration: 'none' }}>Mis Cursos</Link>
        <span>›</span>
        <Link to={`/courses/${student.course.id}/students`} style={{ color: '#6b7280', textDecoration: 'none' }}>
          {student.course.name} - {student.course.shift}
        </Link>
        <span>›</span>
        <Link to={`/students/${studentId}`} style={{ color: '#6b7280', textDecoration: 'none' }}>
          {student.name}
        </Link>
        <span>›</span>
        <span style={{ color: '#111827', fontWeight: 600 }}>{activity.name}</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        {isCorrected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <HiCheckCircle size={18} color="#16a34a" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: '0.08em' }}>
              CORRECCIÓN ASISTIDA
            </span>
          </div>
        )}
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', marginBottom: 6 }}>
          {activity.name}
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>
          {student.name} — Entregado el {activity.date}
        </p>
      </div>

      {/* Main layout: left column + right panel */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        {/* Left: main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Original del Alumno */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
              Original del Alumno
            </h3>
            <div style={{
              background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb',
              padding: '48px 24px', textAlign: 'center', color: '#9ca3af', fontSize: 13,
            }}>
              Sin imagen adjunta
            </div>
          </div>

          {/* Transcripción Inteligente */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>
                Transcripción Inteligente
              </h3>
              <span style={{ fontSize: 18 }}>✦</span>
            </div>
            {isCorrected ? (
              <>
                <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, marginBottom: 16 }}>
                  La transcripción inteligente de esta actividad no está disponible aún.
                </p>
                <div style={{
                  borderLeft: '3px solid #3b82f6', paddingLeft: 14,
                  background: '#eff6ff', borderRadius: '0 6px 6px 0', padding: '10px 14px',
                }}>
                  <p style={{ fontSize: 12, color: '#1d4ed8' }}>
                    Las palabras resaltadas en amarillo indicarán posibles errores ortográficos o palabras que requieren atención.
                  </p>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 14, color: '#9ca3af' }}>
                Sin transcripción disponible para esta actividad.
              </p>
            )}
          </div>

          {/* Feedback Entregado al Alumno */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
              Feedback Entregado al Alumno
            </h3>
            {isCorrected ? (
              <blockquote style={{
                borderLeft: '3px solid #00b89c', margin: 0,
                paddingLeft: 16, color: '#374151',
              }}>
                <p style={{ fontSize: 14, fontStyle: 'italic', lineHeight: 1.7 }}>
                  "El feedback para esta actividad aún no fue registrado en el sistema."
                </p>
              </blockquote>
            ) : (
              <p style={{ fontSize: 14, color: '#9ca3af' }}>
                Sin feedback registrado.
              </p>
            )}
          </div>
        </div>

        {/* Right: Diagnóstico IA */}
        <div style={{ width: 300, flexShrink: 0 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 18 }}>✦</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Diagnóstico IA</h3>
            </div>

            {/* Estado badge */}
            <div style={{ marginBottom: 20 }}>
              <span style={{
                background: cfg.bg, color: cfg.color,
                padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              }}>
                {cfg.label}
              </span>
              {activity.score != null && (
                <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 700, color: '#111827' }}>
                  {activity.score.toFixed(1)}/10
                </span>
              )}
            </div>

            {/* Observaciones Ortográficas */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 10 }}>
                OBSERVACIONES ORTOGRÁFICAS
              </p>
              {isCorrected ? (
                <div style={{ background: '#fef2f2', borderRadius: 8, padding: '12px 14px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', letterSpacing: '0.06em', marginBottom: 6 }}>
                    ERRORES DETECTADOS
                  </p>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                    {student.ai_diagnosis.text || 'Sin observaciones disponibles para esta actividad.'}
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#9ca3af' }}>Sin observaciones.</p>
              )}
            </div>

            {/* Sugerencias Pedagógicas */}
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 10 }}>
                SUGERENCIAS PEDAGÓGICAS
              </p>
              {isCorrected && student.ai_diagnosis.tags.length > 0 ? (
                <div style={{ background: '#eff6ff', borderRadius: 8, padding: '12px 14px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#3b82f6', letterSpacing: '0.06em', marginBottom: 6 }}>
                    RECOMENDACIÓN
                  </p>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
                    {student.ai_diagnosis.tags.join(', ')}.
                  </p>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#9ca3af' }}>Sin sugerencias.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Volver al historial */}
      <div style={{ marginTop: 32 }}>
        <Link
          to={`/students/${studentId}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            border: '1px solid #e5e7eb', background: '#fff',
            color: '#374151', fontSize: 14, fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <HiArrowLeft size={16} />
          Volver al historial
        </Link>
      </div>
    </div>
  );
}

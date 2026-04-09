import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiEnvelope } from 'react-icons/hi2';
import { getStudent } from '../../api/students';
import { Avatar } from '../../components/Avatar/Avatar';
import type { StudentDetail as StudentDetailType } from '../../types/api';

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  CORREGIDA:             { bg: '#dcfce7', color: '#166534', label: 'Corregida' },
  COMPLETADA:            { bg: '#dcfce7', color: '#166534', label: 'Completada' },
  REVISADA:              { bg: '#e0f2fe', color: '#075985', label: 'Revisada' },
  NO_ENTREGADO:          { bg: '#fee2e2', color: '#991b1b', label: 'No entregado' },
  PENDIENTE_DE_REVISION: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente de revisión' },
};
const DEFAULT_STATUS_CONFIG = { bg: '#f3f4f6', color: '#6b7280', label: 'Desconocido' };

export function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<StudentDetailType | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    getStudent(studentId).then(setStudent).catch(() => setError(true));
  }, [studentId]);

  if (error) return <p style={{ color: '#dc2626', fontSize: 14 }}>Alumno no encontrado.</p>;
  if (!student) return <p style={{ color: '#6b7280', fontSize: 14 }}>Cargando...</p>;

  const avgColor = student.average >= 8 ? '#00b89c' : student.average >= 6 ? '#f59e0b' : '#dc2626';

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
        <span style={{ color: '#111827', fontWeight: 600 }}>{student.name}</span>
      </nav>

      {/* Header */}
      <div style={{
        background: '#fff', borderRadius: 12, padding: '24px 28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={student.name} size={52} fontSize={20} />
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{student.name}</h1>
            <p style={{ fontSize: 14, color: '#6b7280' }}>{student.course.name} — {student.course.shift}</p>
          </div>
        </div>
        <button style={{
          background: '#fff', border: '1px solid #d1d5db',
          borderRadius: 8, padding: '9px 16px', fontSize: 14, cursor: 'pointer', color: '#374151',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <HiEnvelope size={16} />
          Contactar familia
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'PROMEDIO GENERAL', value: student.average, total: 10, color: avgColor },
          { label: 'TAREAS RESUELTAS', value: student.tasks_completed, total: student.tasks_total, color: '#00b89c' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: '#fff', borderRadius: 12, padding: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: 8 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#111827', marginBottom: 12 }}>
              {stat.value}
              <span style={{ fontSize: 16, color: '#6b7280', fontWeight: 400 }}> /{stat.total}</span>
            </div>
            <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3 }}>
              <div style={{ height: 6, borderRadius: 3, background: stat.color, width: `${(stat.value / stat.total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Diagnóstico IA */}
      <div style={{
        background: '#faf5ff', borderRadius: 12, padding: '24px 28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 22, lineHeight: 1 }}>✦</span>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              Diagnóstico IA del Alumno
            </h3>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
              {student.ai_diagnosis.text}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {student.ai_diagnosis.tags.map((tag) => (
                <span key={tag} style={{
                  background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: 20, padding: '4px 12px',
                  fontSize: 12, color: '#374151',
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Actividades */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111827', padding: '20px 24px', borderBottom: '1px solid #f3f4f6', margin: 0 }}>
          Historial de Actividades
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['ACTIVIDAD', 'FECHA', 'ESTADO', 'ACCIONES'].map((h, i) => (
                <th key={h} style={{ padding: '12px 16px', textAlign: i === 0 ? 'left' : 'center', fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {student.activity_history.map((activity) => {
              const cfg = STATUS_CONFIG[activity.status] ?? DEFAULT_STATUS_CONFIG;
              return (
                <tr key={activity.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '14px 16px', fontSize: 14, color: '#111827' }}>{activity.name}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center', fontSize: 13, color: '#6b7280' }}>{activity.date}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      background: cfg.bg, color: cfg.color,
                      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    }}>
                      {cfg.label}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    {activity.status !== 'NO_ENTREGADO' && (
                      <Link
                        to={`/students/${studentId}/activities/${activity.id}`}
                        style={{ color: '#00b89c', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
                      >
                        Ver detalle
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

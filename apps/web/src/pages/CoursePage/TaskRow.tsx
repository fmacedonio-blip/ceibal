import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiEye, HiCalendarDays } from 'react-icons/hi2';

interface Props {
  id: string;
  type: 'lectura' | 'escritura';
  title: string;
  date: string;
  progress: number;
  courseId: string;
}

const TYPE_BADGE: Record<'lectura' | 'escritura', { bg: string; color: string; label: string }> = {
  lectura:   { bg: '#f0fdfa', color: '#0d9488', label: 'LECTURA' },
  escritura: { bg: '#faf5ff', color: '#7c3aed', label: 'ESCRITURA' },
};

export function TaskRow({ id, type, title, date, progress, courseId }: Props) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const badge = TYPE_BADGE[type];
  const barColor = progress >= 80 ? '#00b89c' : progress >= 50 ? '#f59e0b' : '#dc2626';
  const progressColor = progress >= 80 ? '#16a34a' : progress >= 50 ? '#b45309' : '#dc2626';

  return (
    <div
      onClick={() => navigate(`/courses/${courseId}/tasks/${id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#f9fafb' : '#fff',
        borderRadius: 10, padding: '16px 20px',
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.09)' : '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', gap: 16,
        cursor: 'pointer', transition: 'background 0.15s, box-shadow 0.15s',
      }}
    >
      {/* Badge tipo */}
      <span style={{
        background: badge.bg, color: badge.color,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
        padding: '3px 0', borderRadius: 4, flexShrink: 0,
        width: 80, textAlign: 'center', display: 'inline-block',
      }}>
        {badge.label}
      </span>

      {/* Título + fecha */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </p>
        <p style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
          <HiCalendarDays size={13} /> {date}
        </p>
      </div>

      {/* Progreso */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
          PROGRESO DE LA CLASE
        </span>
        <div style={{ width: 140, height: 6, background: '#e5e7eb', borderRadius: 3 }}>
          <div style={{ height: 6, borderRadius: 3, background: barColor, width: `${progress}%`, transition: 'width 0.3s ease' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: progressColor, minWidth: 36, textAlign: 'right' }}>
          {progress}%
        </span>
      </div>

      {/* Ícono ojo */}
      <HiEye size={18} color={hovered ? '#6b7280' : '#d1d5db'} style={{ flexShrink: 0, transition: 'color 0.15s' }} />
    </div>
  );
}

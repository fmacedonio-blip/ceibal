import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  HiChatBubbleLeftRight, HiHome, HiCheckCircle, HiSparkles,
  HiClock, HiPencil, HiLightBulb, HiWrenchScrewdriver,
} from 'react-icons/hi2';
import { getCorrection } from '../../../api/alumno';
import type { WritingCorrectionAlumno } from '../../../types/alumno';

export function CorreccionEscritura() {
  useParams<{ taskId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const submissionId = (location.state as { submissionId?: string })?.submissionId;

  const [alumno, setAlumno] = useState<WritingCorrectionAlumno | null>(null);
  const [realSubmissionId, setRealSubmissionId] = useState<string | null>(submissionId ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!submissionId) { setError(true); setLoading(false); return; }
    getCorrection(submissionId)
      .then((data) => {
        if (data.submission_type !== 'handwrite') { setError(true); return; }
        setAlumno(data.alumno as WritingCorrectionAlumno);
        setRealSubmissionId(data.submission_id);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [submissionId]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#6b7280', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <HiSparkles size={16} /> Analizando tu escritura...
    </div>
  );

  if (error || !alumno) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>No se pudo cargar la corrección.</p>
      <Link to="/alumno/inicio" style={{ color: '#00b89c', fontSize: 14 }}>Volver al inicio</Link>
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
          ¡Ya lo leí! Mirá lo que encontré
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>{alumno.feedback}</p>
      </div>

      {/* Tu texto */}
      {alumno.transcripcion_html && (
        <Section bg="#fff" borderColor="#e5e7eb">
          <SectionTitle icon={<HiSparkles size={16} />} color="#374151">Tu texto</SectionTitle>
          <div
            style={{ fontSize: 15, lineHeight: 2, color: '#374151' }}
            dangerouslySetInnerHTML={{ __html: alumno.transcripcion_html }}
          />
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>
            Las palabras resaltadas tienen algo para mejorar.
          </p>
        </Section>
      )}

      {/* Lo que está muy bien */}
      {alumno.aspectos_positivos.length > 0 && (
        <Section bg="#e8faf5" borderColor="#6ee7b7">
          <SectionTitle icon={<HiCheckCircle size={16} />} color="#065f46">Lo que está muy bien</SectionTitle>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {alumno.aspectos_positivos.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontSize: 14, color: '#065f46', lineHeight: 1.5 }}>
                <span style={{ flexShrink: 0 }}>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Para seguir practicando */}
      {alumno.sugerencias_socraticas.length > 0 && (
        <Section bg="#fefce8" borderColor="#fde68a">
          <SectionTitle icon={<HiClock size={16} />} color="#92400e">Para seguir practicando</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alumno.sugerencias_socraticas.map((q, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 10,
                padding: '12px 16px', fontSize: 14, color: '#374151',
                lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: 8,
              }}>
                {q.startsWith('¿') && <HiPencil size={14} style={{ flexShrink: 0, marginTop: 2, color: '#b45309' }} />}
                <span>{q}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Cosas a corregir */}
      {alumno.errores.length > 0 && (
        <Section bg="#fff7ed" borderColor="#fed7aa">
          <SectionTitle icon={<HiWrenchScrewdriver size={16} />} color="#9a3412">Cosas a corregir</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alumno.errores.map((err, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 8,
                padding: '12px 16px',
                borderLeft: '3px solid #fb923c',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                  "{err.texto}" → "{err.correccion}"
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                  {err.explicacion}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Consejos para la próxima */}
      {alumno.consejos.length > 0 && (
        <Section bg="#fdf4ff" borderColor="#e9d5ff">
          <SectionTitle icon={<HiLightBulb size={16} />} color="#7c3aed">Consejos para la próxima</SectionTitle>
          <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alumno.consejos.map((c, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, fontSize: 14, color: '#374151', lineHeight: 1.5 }}>
                <HiLightBulb size={14} style={{ flexShrink: 0, marginTop: 2, color: '#7c3aed' }} />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        <button
          onClick={() => navigate(`/alumno/chat/${realSubmissionId}`)}
          style={{
            width: '100%', padding: '16px', borderRadius: 14, border: 'none',
            background: '#00b89c', color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <HiChatBubbleLeftRight size={18} /> Seguir charlando con mi Copiloto
        </button>
        <Link
          to="/alumno/inicio"
          style={{
            width: '100%', padding: '14px', borderRadius: 14,
            border: '1px solid #e5e7eb', background: '#fff',
            fontSize: 15, fontWeight: 600, color: '#374151',
            textDecoration: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxSizing: 'border-box',
          }}
        >
          <HiHome size={18} /> Volver al inicio
        </Link>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Section({ bg, borderColor, children }: { bg: string; borderColor: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: bg, border: `1px solid ${borderColor}`,
      borderRadius: 16, padding: '20px 24px', marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, color, children }: { icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ color, display: 'flex', alignItems: 'center' }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color }}>{children}</span>
    </div>
  );
}

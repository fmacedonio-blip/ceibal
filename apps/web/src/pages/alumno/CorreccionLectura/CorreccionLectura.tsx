import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { HiChatBubbleLeftRight, HiHome, HiLightBulb, HiExclamationCircle } from 'react-icons/hi2';
import { getCorrection } from '../../../api/alumno';
import type { AudioCorrectionAlumno } from '../../../types/alumno';

const TIPO_LABEL: Record<string, string> = {
  sustitucion:     'Leíste una palabra diferente',
  omision:         'Te saltaste una palabra',
  repeticion:      'Repetiste una palabra',
  autocorreccion:  'Te trabaste pero lo corregiste (¡muy bien!)',
};

export function CorreccionLectura() {
  useParams<{ taskId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const submissionId = (location.state as { submissionId?: string })?.submissionId;

  const [alumno, setAlumno] = useState<AudioCorrectionAlumno | null>(null);
  const [realSubmissionId, setRealSubmissionId] = useState<string | null>(submissionId ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!submissionId) { setError(true); setLoading(false); return; }
    getCorrection(submissionId)
      .then((data) => {
        if (data.submission_type !== 'audio') { setError(true); return; }
        setAlumno(data.alumno as AudioCorrectionAlumno);
        setRealSubmissionId(data.submission_id);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [submissionId]);

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px 0', color: '#6b7280', fontSize: 14 }}>
      Analizando tu lectura... 🎙️
    </div>
  );

  if (error || !alumno) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>No se pudo cargar la corrección.</p>
      <Link to="/alumno/inicio" style={{ color: '#00b89c', fontSize: 14 }}>Volver al inicio</Link>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: '0.08em' }}>
            🎙️ CORRECCIÓN DE LECTURA
          </span>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#111827' }}>¡Mirá tu corrección!</h1>
      </div>

      {/* Feedback */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
        borderRadius: 16, padding: '24px 28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20,
        border: '1px solid #bbf7d0',
      }}>
        <p style={{ fontSize: 16, color: '#166534', lineHeight: 1.7, fontWeight: 500 }}>
          {alumno.feedback}
        </p>
      </div>

      {/* Errores */}
      {alumno.errores.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HiExclamationCircle size={18} color="#f59e0b" /> Palabras para repasar
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {alumno.errores.map((err, i) => (
              <div key={i} style={{ background: '#fffbeb', borderRadius: 10, padding: '14px 16px', borderLeft: '3px solid #fbbf24' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                  {err.lo_que_leyo
                    ? <>Dijiste <span style={{ color: '#dc2626' }}>"{err.lo_que_leyo}"</span> en vez de <span style={{ color: '#16a34a' }}>"{err.palabra_original}"</ span></>
                    : <>Te saltaste <span style={{ color: '#16a34a' }}>"{err.palabra_original}"</span></>
                  }
                </div>
                {err.explicacion && (
                  <div style={{ fontSize: 13, color: '#6b7280' }}>{err.explicacion}</div>
                )}
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                  {TIPO_LABEL[err.tipo] ?? err.tipo}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consejos */}
      {alumno.consejos.length > 0 && (
        <div style={{ background: '#faf5ff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HiLightBulb size={18} color="#7c3aed" /> Consejos para la próxima
          </h2>
          <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alumno.consejos.map((c, i) => (
              <li key={i} style={{ fontSize: 14, color: '#374151', lineHeight: 1.5 }}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => navigate(`/alumno/chat/${realSubmissionId}`)}
          style={{
            flex: 1, padding: '14px', borderRadius: 12, border: 'none',
            background: '#00b89c', color: '#fff',
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <HiChatBubbleLeftRight size={18} /> Hablar con el Copiloto
        </button>
        <Link
          to="/alumno/inicio"
          style={{
            flex: 1, padding: '14px', borderRadius: 12,
            border: '1px solid #e5e7eb', background: '#fff',
            fontSize: 15, fontWeight: 600, color: '#374151',
            textDecoration: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <HiHome size={18} /> Volver al inicio
        </Link>
      </div>
    </div>
  );
}

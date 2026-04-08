import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { HiChatBubbleLeftRight, HiHome, HiLightBulb, HiExclamationCircle, HiCheckCircle } from 'react-icons/hi2';
import { getCorrection } from '../../../api/alumno';
import type { AudioCorrectionAlumno, AudioCorrectionErrorAlumno } from '../../../types/alumno';


/* ---------- fluency alert labels for students ---------- */

const ALERTA_FLUIDEZ_INFO: Record<string, { icon: string; title: string; tip: string }> = {
  no_respeta_pausas: {
    icon: '⏸️',
    title: 'Pausas y puntuación',
    tip: 'Cuando ves un punto (.) o una coma (,), hacé una pausa cortita antes de seguir. Es como tomar aire.',
  },
  dificultad_polisilabas: {
    icon: '🔤',
    title: 'Palabras largas',
    tip: 'Algunas palabras largas te costaron un poco. ¡Practicá dividiéndolas en sílabas antes de leerlas completas!',
  },
  lectura_palabra_por_palabra: {
    icon: '🐢',
    title: 'Lectura palabra por palabra',
    tip: 'Intentá juntar las palabras en grupos, como si estuvieras hablando. Eso hace que la lectura suene más natural.',
  },
  silabeo: {
    icon: '✂️',
    title: 'Lectura en sílabas',
    tip: 'En vez de separar las sílabas (car-pin-cho), tratá de decir la palabra entera de corrido: carpincho.',
  },
  velocidad_alta_con_errores: {
    icon: '⚡',
    title: 'Velocidad alta',
    tip: 'Leíste rápido pero con algunos errores. Intentá bajar un poquito la velocidad para leer más seguro.',
  },
};

/* ---------- per-type styling ---------- */

const TIPO_CONFIG: Record<string, { label: string; icon: string; borderColor: string; bgColor: string; textColor: string }> = {
  sustitucion: {
    label: 'Leíste una palabra diferente',
    icon: '🔄',
    borderColor: '#fbbf24',
    bgColor: '#fffbeb',
    textColor: '#92400e',
  },
  omision: {
    label: 'Te saltaste una palabra',
    icon: '⏭️',
    borderColor: '#60a5fa',
    bgColor: '#eff6ff',
    textColor: '#1e40af',
  },
  repeticion: {
    label: 'Repetiste una palabra',
    icon: '🔁',
    borderColor: '#fb923c',
    bgColor: '#fff7ed',
    textColor: '#9a3412',
  },
  pronunciacion: {
    label: 'Pronunciaste diferente',
    icon: '🗣️',
    borderColor: '#a78bfa',
    bgColor: '#f5f3ff',
    textColor: '#5b21b6',
  },
  autocorreccion: {
    label: '¡Te corregiste solo!',
    icon: '✅',
    borderColor: '#4ade80',
    bgColor: '#f0fdf4',
    textColor: '#166534',
  },
};

const DEFAULT_CONFIG = TIPO_CONFIG.sustitucion;

function ErrorCard({ err, index }: { err: AudioCorrectionErrorAlumno; index: number }) {
  const cfg = TIPO_CONFIG[err.tipo] ?? DEFAULT_CONFIG;
  const isPositive = err.tipo === 'autocorreccion';

  return (
    <div
      key={index}
      style={{
        background: cfg.bgColor,
        borderRadius: 10,
        padding: '14px 16px',
        borderLeft: `3px solid ${cfg.borderColor}`,
      }}
    >
      {/* Type badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 700, color: cfg.textColor,
        background: `${cfg.borderColor}33`, borderRadius: 6,
        padding: '2px 8px', marginBottom: 8,
      }}>
        <span>{cfg.icon}</span> {cfg.label}
      </div>

      {/* Main error description */}
      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4, lineHeight: 1.5 }}>
        {err.tipo === 'sustitucion' && err.lo_que_leyo && (
          <>Dijiste <span style={{ color: '#dc2626' }}>"{err.lo_que_leyo}"</span> en vez de <span style={{ color: '#16a34a' }}>"{err.palabra_original}"</span></>
        )}
        {err.tipo === 'pronunciacion' && err.lo_que_leyo && (
          <>Dijiste <span style={{ color: '#7c3aed' }}>"{err.lo_que_leyo}"</span> pero se pronuncia <span style={{ color: '#16a34a' }}>"{err.palabra_original}"</span></>
        )}
        {err.tipo === 'pronunciacion' && !err.lo_que_leyo && (
          <>Pronunciaste diferente la palabra <span style={{ color: '#7c3aed' }}>"{err.palabra_original}"</span></>
        )}
        {err.tipo === 'omision' && (
          <>Se te pasó la palabra <span style={{ color: '#2563eb' }}>"{err.palabra_original}"</span></>
        )}
        {err.tipo === 'repeticion' && (
          <>Repetiste <span style={{ color: '#ea580c' }}>"{err.palabra_original}"</span></>
        )}
        {err.tipo === 'autocorreccion' && (
          <>Te trabaste en <span style={{ color: '#16a34a' }}>"{err.palabra_original}"</span> pero lo corregiste 💪</>
        )}
        {/* Fallback for any unknown type */}
        {!['sustitucion', 'pronunciacion', 'omision', 'repeticion', 'autocorreccion'].includes(err.tipo) && err.lo_que_leyo && (
          <>Dijiste <span style={{ color: '#dc2626' }}>"{err.lo_que_leyo}"</span> en vez de <span style={{ color: '#16a34a' }}>"{err.palabra_original}"</span></>
        )}
        {!['sustitucion', 'pronunciacion', 'omision', 'repeticion', 'autocorreccion'].includes(err.tipo) && !err.lo_que_leyo && (
          <>Palabra: <span style={{ color: '#16a34a' }}>"{err.palabra_original}"</span></>
        )}
      </div>

      {/* Explanation from AI */}
      {err.explicacion && (
        <div style={{ fontSize: 13, color: isPositive ? '#166534' : '#6b7280', lineHeight: 1.5, marginTop: 2 }}>
          {err.explicacion}
        </div>
      )}
    </div>
  );
}

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

  // Separate autocorrections (positive) from real errors
  const realErrors = alumno.errores.filter((e) => e.tipo !== 'autocorreccion');
  const autoCorrections = alumno.errores.filter((e) => e.tipo === 'autocorreccion');

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

      {/* Feedback — refuerzo positivo */}
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

      {/* Autocorrections — shown as positive */}
      {autoCorrections.length > 0 && (
        <div style={{ background: '#f0fdf4', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20, border: '1px solid #bbf7d0' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HiCheckCircle size={18} color="#16a34a" /> ¡Bien hecho! Te corregiste solo
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {autoCorrections.map((err, i) => <ErrorCard key={`auto-${i}`} err={err} index={i} />)}
          </div>
        </div>
      )}

      {/* Real errors — grouped */}
      {realErrors.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <HiExclamationCircle size={18} color="#f59e0b" /> Palabras para repasar
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {realErrors.map((err, i) => <ErrorCard key={`err-${i}`} err={err} index={i} />)}
          </div>
        </div>
      )}

      {/* No errors — perfect read */}
      {alumno.errores.length === 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
          borderRadius: 16, padding: '28px', marginBottom: 20,
          textAlign: 'center', border: '1px solid #a7f3d0',
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌟</div>
          <p style={{ fontSize: 18, fontWeight: 700, color: '#065f46' }}>¡Lectura perfecta!</p>
          <p style={{ fontSize: 14, color: '#047857' }}>No se detectaron errores. ¡Seguí así!</p>
        </div>
      )}

      {/* Consejos de fluidez */}
      {(alumno.alertas_fluidez ?? []).length > 0 && (
        <div style={{ background: '#fefce8', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20, border: '1px solid #fde68a' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            📖 Aspectos de tu lectura
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(alumno.alertas_fluidez ?? []).map((alerta, i) => {
              const info = ALERTA_FLUIDEZ_INFO[alerta];
              if (!info) return null;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  background: '#fffef5', borderRadius: 10, padding: '12px 14px',
                  borderLeft: '3px solid #facc15',
                }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{info.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#78350f', marginBottom: 2 }}>{info.title}</div>
                    <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>{info.tip}</div>
                  </div>
                </div>
              );
            })}
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

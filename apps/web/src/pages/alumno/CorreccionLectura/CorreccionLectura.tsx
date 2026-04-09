import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '../../../components/Spinner/Spinner';
import {
  HiChatBubbleLeftRight, HiHome, HiLightBulb, HiStar, HiArrowPath,
} from 'react-icons/hi2';
import { getCorrection } from '../../../api/alumno';
import type { AudioCorrectionAlumno, AudioCorrectionErrorAlumno } from '../../../types/alumno';

const ALERTA_FLUIDEZ_INFO: Record<string, { title: string; tip: string }> = {
  no_respeta_pausas:           { title: 'Pausas y puntuación',        tip: 'Cuando ves un punto o una coma, hacé una pausa cortita antes de seguir.' },
  dificultad_polisilabas:      { title: 'Palabras largas',            tip: '¡Practicá dividiéndolas en sílabas antes de leerlas completas!' },
  lectura_palabra_por_palabra: { title: 'Lectura palabra por palabra', tip: 'Intentá juntar las palabras en grupos para que suene más natural.' },
  silabeo:                     { title: 'Lectura en sílabas',         tip: 'En vez de separar las sílabas, tratá de decir la palabra entera de corrido.' },
  velocidad_alta_con_errores:  { title: 'Velocidad alta',             tip: 'Leíste rápido pero con algunos errores. Bajá un poquito la velocidad.' },
};

function ErrorCard({ err }: { err: AudioCorrectionErrorAlumno }) {
  const isPositive = err.tipo === 'autocorreccion';
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '14px 16px', borderLeft: `3px solid ${isPositive ? '#4ade80' : '#fb923c'}` }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 4, lineHeight: 1.5 }}>
        {err.lo_que_leyo
          ? <><span style={{ color: '#dc2626' }}>"{err.lo_que_leyo}"</span> → <span style={{ color: '#16a34a' }}>"{err.palabra_original}"</span></>
          : <span style={{ color: '#374151' }}>"{err.palabra_original}"</span>}
      </div>
      {err.explicacion && <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{err.explicacion}</div>}
    </div>
  );
}

export function CorreccionLectura() {
  const { taskId } = useParams<{ taskId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as { submissionId?: string; consignaNoCumplida?: boolean } | null;
  const submissionId = locationState?.submissionId;

  const [alumno, setAlumno] = useState<AudioCorrectionAlumno | null>(null);
  const [realSubmissionId, setRealSubmissionId] = useState<string | null>(submissionId ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showConsignaModal, setShowConsignaModal] = useState(locationState?.consignaNoCumplida ?? false);

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

  if (loading) return <Spinner />;

  if (error || !alumno) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>No se pudo cargar la corrección.</p>
      <Link to="/alumno/inicio" style={{ color: '#00b89c', fontSize: 14 }}>Volver al inicio</Link>
    </div>
  );

  const realErrors = alumno.errores.filter(e => e.tipo !== 'autocorreccion');
  const autoCorrections = alumno.errores.filter(e => e.tipo === 'autocorreccion');
  const alertas = alumno.alertas_fluidez ?? [];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Modal consigna no cumplida */}
      {showConsignaModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowConsignaModal(false); }}
        >
          <div style={{
            background: '#fff', borderRadius: 24,
            padding: '36px 32px', maxWidth: 480, width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', gap: 20,
            position: 'relative',
          }}>
            <button
              onClick={() => setShowConsignaModal(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: '#f3f4f6', border: 'none', borderRadius: '50%',
                width: 32, height: 32, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, color: '#6b7280', lineHeight: 1,
              }}
            >
              ×
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 14px', fontSize: 32,
                boxShadow: '0 4px 12px rgba(251,191,36,0.3)',
              }}>
                💛
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1e2939', margin: '0 0 8px' }}>
                ¡Buen intento!
              </h2>
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.6, margin: 0 }}>
                La grabación no corresponde al texto de la tarea. ¡No te preocupes! Podés cerrar este mensaje para ver el análisis, o volver a grabar leyendo el párrafo asignado.
              </p>
            </div>

            <button
              onClick={() => navigate(`/alumno/tarea/${taskId}/lectura`)}
              style={{
                width: '100%', padding: '14px',
                borderRadius: 999, border: 'none',
                background: 'linear-gradient(90deg, #00bba7, #00b8db)',
                color: '#fff', fontSize: 15, fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,184,219,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit',
              }}
            >
              <HiArrowPath size={18} /> Volver a intentarlo
            </button>

            <button
              onClick={() => setShowConsignaModal(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 14, color: '#6b7280', fontFamily: 'inherit', padding: '4px 0',
              }}
            >
              Ver el análisis
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#009689', marginBottom: 6 }}>
          {locationState?.consignaNoCumplida ? '¡Gracias por intentarlo! 💛' : '¡Escuché tu lectura! 🎧'}
        </h1>
        <p style={{ fontSize: 15, color: '#4a5565' }}>
          {locationState?.consignaNoCumplida
            ? 'Revisá el mensaje y volvé a grabar siguiendo el texto de la tarea.'
            : 'Hiciste un gran trabajo leyendo hoy.'}
        </p>
      </div>

      {/* Si consigna no cumplida, no mostrar el análisis vacío */}
      {locationState?.consignaNoCumplida ? null : <>

      {/* Feedback de la IA */}
      <div style={{
        background: 'rgba(255,255,255,0.9)',
        borderRadius: 16, padding: '20px 24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: 0 }}>
          {alumno.feedback}
        </p>
      </div>

      {/* ¡Muy bien! — feedback positivo */}
      {alumno.consejos.length > 0 || autoCorrections.length > 0 ? (
        <Card bg="#ccfbf1" border="#6ee7b7">
          <Title icon="✅" color="#065f46">¡Muy bien!</Title>
          {autoCorrections.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {autoCorrections.map((err, i) => <ErrorCard key={i} err={err} />)}
            </div>
          )}
          {alumno.consejos.slice(0, 2).map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 14, color: '#065f46', lineHeight: 1.5, marginBottom: 4 }}>
              <span>•</span><span>{c}</span>
            </div>
          ))}
        </Card>
      ) : (
        alumno.errores.length === 0 && (
          <Card bg="#ccfbf1" border="#6ee7b7">
            <div style={{ textAlign: 'center' }}>
              <HiStar size={40} color="#065f46" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 18, fontWeight: 700, color: '#065f46' }}>¡Lectura perfecta!</p>
              <p style={{ fontSize: 14, color: '#047857' }}>No se detectaron errores. ¡Seguí así!</p>
            </div>
          </Card>
        )
      )}


      {/* Para seguir mejorando — alertas de fluidez */}
      {(() => {
        const alertasConocidas = alertas.filter(a => ALERTA_FLUIDEZ_INFO[a]);
        if (alertasConocidas.length === 0) return null;
        return (
          <Card bg="#fef9c3" border="#fde68a">
            <Title icon="🔊" color="#92400e">Para seguir mejorando 💪</Title>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alertasConocidas.map((alerta, i) => {
                const info = ALERTA_FLUIDEZ_INFO[alerta];
                return (
                  <div key={i} style={{ display: 'flex', gap: 8, fontSize: 14, color: '#78350f', lineHeight: 1.5 }}>
                    <span style={{ flexShrink: 0 }}>•</span>
                    <span><strong>{info.title}:</strong> {info.tip}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })()}

      {/* Errores en pronunciación */}
      {realErrors.length > 0 && (
        <Card bg="#ffedd5" border="#fed7aa">
          <Title icon="⏱" color="#9a3412">Errores en pronunciación</Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {realErrors.map((err, i) => <ErrorCard key={i} err={err} />)}
          </div>
        </Card>
      )}

      {/* Consejos restantes */}
      {alumno.consejos.length > 2 && (
        <Card bg="#fae8ff" border="#e9d5ff">
          <Title icon="💡" color="#7c3aed">Consejos para la próxima</Title>
          {alumno.consejos.slice(2).map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 14, color: '#374151', lineHeight: 1.5, marginBottom: 4 }}>
              <HiLightBulb size={13} color="#7c3aed" style={{ flexShrink: 0, marginTop: 2 }} /><span>{c}</span>
            </div>
          ))}
        </Card>
      )}

      </>}

      {/* Botones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
        <button
          onClick={() => navigate(`/alumno/chat/${realSubmissionId}`)}
          style={{
            width: '100%', padding: '16px', borderRadius: 999, border: 'none',
            background: 'linear-gradient(90deg, #00bba7, #00b8db)',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(0,184,219,0.3)', fontFamily: 'inherit',
          }}
        >
          <HiChatBubbleLeftRight size={18} /> Seguir charlando con mi Copiloto
        </button>
        <Link
          to="/alumno/inicio"
          style={{
            width: '100%', padding: '14px', borderRadius: 999,
            border: '1px solid #e5e7eb', background: 'rgba(255,255,255,0.8)',
            fontSize: 15, fontWeight: 600, color: '#374151', textDecoration: 'none',
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

function Card({ bg, border, children }: { bg: string; border: string; children: React.ReactNode }) {
  return (
    <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 16, padding: '20px 24px' }}>
      {children}
    </div>
  );
}

function Title({ icon, color, children }: { icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ color, display: 'flex', alignItems: 'center', fontSize: 16 }}>{icon}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color }}>{children}</span>
    </div>
  );
}


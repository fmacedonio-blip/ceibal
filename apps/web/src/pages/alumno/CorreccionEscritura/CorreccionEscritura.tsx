import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Spinner } from '../../../components/Spinner/Spinner';
import {
  HiChatBubbleLeftRight, HiHome, HiCheckCircle,
  HiLightBulb, HiWrenchScrewdriver, HiArrowPath,
} from 'react-icons/hi2';
import { getCorrection } from '../../../api/alumno';
import type { WritingCorrectionAlumno } from '../../../types/alumno';

export function CorreccionEscritura() {
  const { taskId } = useParams<{ taskId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = location.state as { submissionId?: string; consignaNoCumplida?: boolean } | null;
  const submissionId = locationState?.submissionId;

  const [alumno, setAlumno] = useState<WritingCorrectionAlumno | null>(null);
  const [realSubmissionId, setRealSubmissionId] = useState<string | null>(submissionId ?? null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showConsignaModal, setShowConsignaModal] = useState(locationState?.consignaNoCumplida ?? false);

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

  if (loading) return <Spinner />;

  if (error || !alumno) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <p style={{ color: '#dc2626', fontSize: 14, marginBottom: 12 }}>No se pudo cargar la corrección.</p>
      <Link to="/alumno/inicio" style={{ color: '#00b89c', fontSize: 14 }}>Volver al inicio</Link>
    </div>
  );

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
                Lo que escribiste no corresponde a la consigna de la tarea. ¡No te preocupes! Podés cerrar este mensaje para ver el análisis, o volver a intentarlo siguiendo la consigna.
              </p>
            </div>

            <button
              onClick={() => navigate(`/alumno/tarea/${taskId}/escritura`)}
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
          ¡Ya lo leí! Mirá lo que encontré
        </h1>
        <p style={{ fontSize: 15, color: '#4a5565' }}>{alumno.feedback}</p>
      </div>

      {/* Tu texto */}
      {alumno.transcripcion_html && (
        <Card bg="rgba(255,255,255,0.9)" border="#e5e7eb">
          <Title icon="✨" color="#374151">Tu texto</Title>
          <div
            style={{ fontSize: 15, lineHeight: 2, color: '#374151' }}
            dangerouslySetInnerHTML={{ __html: alumno.transcripcion_html }}
          />
          <style>{`.hw-error { background: #fef9c2; border-radius: 2px; padding: 0 2px; }`}</style>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
            Las palabras resaltadas tienen algo para mejorar.
          </p>
        </Card>
      )}

      {/* Lo que está muy bien */}
      {alumno.aspectos_positivos.length > 0 && (
        <Card bg="#ccfbf1" border="#6ee7b7">
          <Title icon={<HiCheckCircle size={17} />} color="#065f46">Lo que está muy bien</Title>
          <BulletList items={alumno.aspectos_positivos} color="#065f46" />
        </Card>
      )}

      {/* Para seguir practicando */}
      {alumno.sugerencias_socraticas.length > 0 && (
        <Card bg="#fef9c3" border="#fde68a">
          <Title icon="⏱" color="#92400e">Para seguir practicando 💪</Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alumno.sugerencias_socraticas.map((q, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 10,
                padding: '12px 16px', fontSize: 14, color: '#374151', lineHeight: 1.5,
              }}>
                {q}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cosas a corregir */}
      {alumno.errores.length > 0 && (
        <Card bg="#ffedd5" border="#fed7aa">
          <Title icon={<HiWrenchScrewdriver size={17} />} color="#9a3412">Cosas a corregir</Title>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alumno.errores.map((err, i) => (
              <div key={i} style={{
                background: '#fff', borderRadius: 8,
                padding: '12px 16px', borderLeft: '3px solid #fb923c',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                  "{err.texto}" → "{err.correccion}"
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{err.explicacion}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Consejos */}
      {alumno.consejos.length > 0 && (
        <Card bg="#fae8ff" border="#e9d5ff">
          <Title icon={<HiLightBulb size={17} />} color="#7c3aed">Consejos para la próxima</Title>
          <BulletList items={alumno.consejos} color="#374151" icon={<HiLightBulb size={13} color="#7c3aed" />} />
        </Card>
      )}

      {/* Botones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
        <button
          onClick={() => navigate(`/alumno/chat/${realSubmissionId}`)}
          style={{
            width: '100%', padding: '16px', borderRadius: 999, border: 'none',
            background: 'linear-gradient(90deg, #00bba7, #00b8db)',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 12px rgba(0,184,219,0.3)',
            fontFamily: 'inherit',
          }}
        >
          <HiChatBubbleLeftRight size={18} /> Seguir charlando con mi Copiloto
        </button>
        <Link
          to="/alumno/inicio"
          style={{
            width: '100%', padding: '14px', borderRadius: 999,
            border: '1px solid #e5e7eb', background: 'rgba(255,255,255,0.8)',
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

function Card({ bg, border, children }: { bg: string; border: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: 16, padding: '20px 24px',
    }}>
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

function BulletList({ items, color, icon }: { items: string[]; color: string; icon?: React.ReactNode }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 8, fontSize: 14, color, lineHeight: 1.5 }}>
          <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{icon ?? '•'}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}


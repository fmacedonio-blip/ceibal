import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiCheckCircle, HiArrowLeft } from 'react-icons/hi2';
import { getStudent } from '../../api/students';
import { getCorrection, getSubmissionImageUrl } from '../../api/alumno';
import type { ActivityHistory, StudentDetail } from '../../types/api';
import type { CorrectionResponse, WritingCorrectionResponse, AudioCorrectionResponse } from '../../types/alumno';

const STATUS_CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  COMPLETADA:   { bg: '#dcfce7', color: '#166534', label: 'Completada' },
  NO_ENTREGADO: { bg: '#fee2e2', color: '#991b1b', label: 'No entregado' },
};
const DEFAULT_STATUS_CONFIG = { bg: '#f3f4f6', color: '#6b7280', label: 'Desconocido' };

export function ActivityDetail() {
  const { studentId, activityId } = useParams<{ studentId: string; activityId: string }>();
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [activity, setActivity] = useState<ActivityHistory | null>(null);
  const [correction, setCorrection] = useState<CorrectionResponse | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [correctionError, setCorrectionError] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    getStudent(studentId)
      .then(async (s) => {
        setStudent(s);
        const found = s.activity_history.find((a) => String(a.id) === activityId);
        if (!found) { setError(true); return; }
        setActivity(found);
        if (found.submission_id) {
          try {
            const corr = await getCorrection(found.submission_id);
            setCorrection(corr);
            setImageUrl(getSubmissionImageUrl(found.submission_id));
          } catch {
            setCorrectionError(true);
          }
        }
      })
      .catch(() => setError(true));
  }, [studentId, activityId]);

  if (error) {
    return (
      <div>
        <p style={{ fontSize: 14, color: '#dc2626' }}>Actividad no encontrada.</p>
        <Link to={`/students/${studentId}`} style={{ color: '#00b89c', fontSize: 14 }}>← Volver al alumno</Link>
      </div>
    );
  }
  if (!student || !activity) return <p style={{ color: '#6b7280', fontSize: 14 }}>Cargando...</p>;

  const cfg = STATUS_CONFIG[activity.status] ?? DEFAULT_STATUS_CONFIG;
  const hasSubmission = !!activity.submission_id;
  const isHandwrite = correction?.submission_type === 'handwrite';
  const isAudio = correction?.submission_type === 'audio';
  const writingCorr = isHandwrite ? (correction as WritingCorrectionResponse) : null;
  const audioCorr = isAudio ? (correction as AudioCorrectionResponse) : null;

  // Métricas derivadas para escritura
  const metrics = writingCorr ? (() => {
    const errores = writingCorr.docente.errores;
    const ortografia = errores.filter(e => /ortograf|acento|tilde|mayuscul/i.test(e.tipo)).length;
    const concordancia = errores.filter(e => /concordancia|genero|numero|verbal/i.test(e.tipo)).length;
    const otros = errores.length - ortografia - concordancia;
    const areasCoherencia = (writingCorr.docente.puntos_de_mejora as Record<string, unknown>[])
      .map(p => (p.area as string) || '')
      .filter(a => /coheren|narrativ|estructura|parrafo|puntuac/i.test(a));
    return { ortografia, concordancia, otros, areasCoherencia, total: errores.length };
  })() : null;

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
        <Link to={`/students/${studentId}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{student.name}</Link>
        <span>›</span>
        <span style={{ color: '#111827', fontWeight: 600 }}>{activity.name}</span>
      </nav>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        {hasSubmission && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <HiCheckCircle size={18} color="#16a34a" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: '0.08em' }}>CORRECCIÓN ASISTIDA</span>
          </div>
        )}
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#101828', marginBottom: 6 }}>{activity.name}</h1>
        <p style={{ fontSize: 14, color: '#4a5565' }}>{student.name} — Entregado el {activity.date}</p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* Left column */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Original del Alumno — solo escritura */}
          {!isAudio && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Original del Alumno</h3>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Trabajo del alumno"
                onError={() => setImageUrl(null)}
                style={{ width: '100%', maxHeight: 480, objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
            ) : (
              <div style={{
                background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb',
                padding: '48px 24px', textAlign: 'center', color: '#9ca3af', fontSize: 13,
              }}>
                Sin imagen adjunta
              </div>
            )}
          </div>
          )}

          {/* Transcripción Inteligente — solo escritura */}
          {!isAudio && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Transcripción Inteligente</h3>
              <span style={{ fontSize: 18 }}>✦</span>
            </div>
            {writingCorr ? (
              <>
                <style>{`.hw-error { background: #fef9c2; border-radius: 2px; padding: 0 2px; }`}</style>
                <p
                  style={{ fontSize: 14, color: '#364153', lineHeight: 1.7, marginBottom: 16 }}
                  dangerouslySetInnerHTML={{ __html: writingCorr.alumno.transcripcion_html || writingCorr.alumno.feedback }}
                />
                <div style={{ borderLeft: '3px solid #2b7fff', background: '#eff6ff', borderRadius: '0 6px 6px 0', padding: '10px 14px' }}>
                  <p style={{ fontSize: 12, color: '#1d4ed8' }}>
                    <strong>Nota:</strong> Las palabras resaltadas en amarillo indican posibles errores ortográficos o palabras que requieren atención.
                  </p>
                </div>
              </>
            ) : (
              <p style={{ fontSize: 14, color: '#9ca3af' }}>
                {correctionError ? 'No se pudo cargar la transcripción.' : 'Sin transcripción disponible para esta actividad.'}
              </p>
            )}
          </div>
          )}

          {/* Feedback Entregado al Alumno */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Feedback Entregado al Alumno</h3>
            {correction ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Feedback principal */}
                <blockquote style={{ borderLeft: '3px solid #00bba7', margin: 0, background: '#f0fdfa', borderRadius: '0 6px 6px 0', padding: '12px 16px' }}>
                  <p style={{ fontSize: 14, fontStyle: 'italic', color: '#374151', lineHeight: 1.7 }}>
                    "{correction.alumno.feedback}"
                  </p>
                </blockquote>

                {/* Aspectos positivos (handwrite only) */}
                {writingCorr && writingCorr.alumno.aspectos_positivos.length > 0 && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: '0.06em', marginBottom: 8 }}>ASPECTOS POSITIVOS</p>
                    <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                      {writingCorr.alumno.aspectos_positivos.map((a, i) => (
                        <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Errores con explicación para el alumno */}
                {writingCorr && writingCorr.alumno.errores.length > 0 && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#b45309', letterSpacing: '0.06em', marginBottom: 8 }}>PALABRAS PARA MEJORAR</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {writingCorr.alumno.errores.map((e, i) => (
                        <div key={i} style={{ fontSize: 13, color: '#374151' }}>
                          <strong style={{ color: '#92400e' }}>{e.texto}</strong>
                          {e.correccion && <span style={{ color: '#6b7280' }}> → {e.correccion}</span>}
                          {e.explicacion && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{e.explicacion}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audio: errores de lectura */}
                {audioCorr && audioCorr.alumno.errores.length > 0 && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#b45309', letterSpacing: '0.06em', marginBottom: 8 }}>ERRORES DE LECTURA</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {audioCorr.alumno.errores.map((e, i) => (
                        <div key={i} style={{ fontSize: 13, color: '#374151' }}>
                          <strong style={{ color: '#92400e' }}>{e.palabra_original}</strong>
                          {e.lo_que_leyo && <span style={{ color: '#6b7280' }}> → leyó "{e.lo_que_leyo}"</span>}
                          {e.explicacion && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>{e.explicacion}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sugerencias socráticas */}
                {writingCorr && writingCorr.alumno.sugerencias_socraticas.length > 0 && (
                  <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '12px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.06em', marginBottom: 8 }}>PREGUNTAS PARA REFLEXIONAR</p>
                    <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                      {writingCorr.alumno.sugerencias_socraticas.map((s, i) => (
                        <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, fontStyle: 'italic' }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Consejos */}
                {correction.alumno.consejos.length > 0 && (
                  <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '12px 16px' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', letterSpacing: '0.06em', marginBottom: 8 }}>CONSEJOS</p>
                    <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                      {correction.alumno.consejos.map((c, i) => (
                        <li key={i} style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 14, color: '#9ca3af' }}>
                {correctionError ? 'No se pudo cargar el feedback.' : 'Sin feedback registrado.'}
              </p>
            )}
          </div>
        </div>

        {/* Right: Diagnóstico IA */}
        <div style={{ width: 314, flexShrink: 0 }}>
          <div style={{
            background: 'linear-gradient(128deg, #faf5ff, #eff6ff)',
            borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 18 }}>✦</span>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#101828' }}>Diagnóstico IA</h3>
            </div>

            {/* Estado + score */}
            <div style={{ marginBottom: 20 }}>
              <span style={{ background: cfg.bg, color: cfg.color, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {cfg.label}
              </span>
              {activity.score != null && (
                <span style={{ marginLeft: 10, fontSize: 14, fontWeight: 700, color: '#111827' }}>
                  {activity.score.toFixed(1)}/10
                </span>
              )}
            </div>

            {/* Métricas rápidas */}
            {metrics && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 10 }}>
                  MÉTRICAS
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: metrics.ortografia > 0 ? '#e7000b' : '#16a34a' }}>{metrics.ortografia}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Ortografía</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: metrics.concordancia > 0 ? '#f59e0b' : '#16a34a' }}>{metrics.concordancia}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Concordancia</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: metrics.otros > 0 ? '#f59e0b' : '#16a34a' }}>{metrics.otros}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Otros</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: metrics.areasCoherencia.length > 0 ? '#f59e0b' : '#16a34a' }}>
                      {metrics.areasCoherencia.length > 0 ? '⚠' : '✓'}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Coherencia</div>
                  </div>
                </div>
                {writingCorr?.docente.requires_review && (
                  <div style={{ marginTop: 8, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 12px', fontSize: 12, color: '#92400e', fontWeight: 600, textAlign: 'center' }}>
                    ⚠ Requiere revisión docente
                  </div>
                )}
              </div>
            )}
            {audioCorr && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 10 }}>
                  MÉTRICAS
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#374151' }}>{audioCorr.docente.ppm.toFixed(0)}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>PPM</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: audioCorr.docente.precision >= 90 ? '#16a34a' : audioCorr.docente.precision >= 70 ? '#f59e0b' : '#e7000b' }}>
                      {audioCorr.docente.precision.toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Precisión</div>
                  </div>
                  <div style={{ gridColumn: '1 / -1', background: 'rgba(255,255,255,0.8)', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>{audioCorr.docente.errores.length} errores</div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>de lectura detectados</div>
                  </div>
                </div>
              </div>
            )}

            {/* Análisis pedagógico docente */}
            {(writingCorr || audioCorr) && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 10 }}>
                  ANÁLISIS PEDAGÓGICO
                </p>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 12, color: '#364153', lineHeight: 1.6 }}>
                    {writingCorr?.docente.razonamiento || audioCorr?.docente.feedback_tecnico || '—'}
                  </p>
                </div>
              </div>
            )}

            {/* Puntos de mejora / alertas */}
            {writingCorr && writingCorr.docente.puntos_de_mejora.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 10 }}>
                  PUNTOS DE MEJORA
                </p>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#155dfc', letterSpacing: '0.06em', marginBottom: 6 }}>RECOMENDACIÓN</p>
                  <ul style={{ margin: 0, padding: '0 0 0 14px' }}>
                    {writingCorr.docente.puntos_de_mejora.map((p: Record<string, unknown>, i) => {
                      const text = (p.explicacion_pedagogica as string) || (p.descripcion as string) || (p.area as string) || '';
                      return text ? (
                        <li key={i} style={{ fontSize: 12, color: '#364153', lineHeight: 1.5, marginBottom: 4 }}>{text}</li>
                      ) : null;
                    })}
                  </ul>
                </div>
              </div>
            )}

            {audioCorr && audioCorr.docente.alertas_fluidez.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 10 }}>
                  ALERTAS DE FLUIDEZ
                </p>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#155dfc', letterSpacing: '0.06em', marginBottom: 6 }}>RECOMENDACIÓN</p>
                  <ul style={{ margin: 0, padding: '0 0 0 14px' }}>
                    {audioCorr.docente.alertas_fluidez.map((a, i) => (
                      <li key={i} style={{ fontSize: 12, color: '#364153', lineHeight: 1.5, marginBottom: 4 }}>{a}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Nivel orientativo (audio) */}
            {audioCorr && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 10 }}>
                  NIVEL ORIENTATIVO
                </p>
                <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '12px 14px' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#364153' }}>{audioCorr.docente.nivel_orientativo}</p>
                </div>
              </div>
            )}

            {/* Vacío */}
            {!correction && (
              <p style={{ fontSize: 13, color: '#9ca3af' }}>
                {correctionError ? 'No se pudo cargar el diagnóstico.' : 'Sin diagnóstico disponible.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Volver */}
      <div style={{ marginTop: 32 }}>
        <Link
          to={`/students/${studentId}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 20px', borderRadius: 8,
            border: '1px solid #d1d5dc', background: '#fff',
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

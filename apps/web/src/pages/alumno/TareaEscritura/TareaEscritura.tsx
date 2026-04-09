import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft, HiCamera, HiPencil } from 'react-icons/hi2';
import { getMe, getTasks, submitWriting } from '../../../api/alumno';
import { useAuthStore } from '../../../store/auth';
import type { Task } from '../../../types/alumno';

export function TareaEscritura() {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [task, setTask] = useState<Task | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTasks().then((tasks) => {
      const found = tasks.find((t) => String(t.id) === taskId);
      setTask(found ?? null);
    });
  }, [taskId]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(selected);
  }

  async function handleSubmit() {
    if (!file || !user?.student_uuid || !task) return;
    setUploading(true);
    setError(null);
    try {
      const me = await getMe();
      const classUuid = me.course?.course_uuid ?? '';
      const gradeMatch = me.course?.name.match(/(\d+)/);
      const grade = gradeMatch ? parseInt(gradeMatch[1]) : 4;

      const result = await submitWriting(file, user.student_uuid, classUuid, grade, Number(taskId));
      navigate(`/alumno/tarea/${taskId}/correccion-escritura`, {
        state: { submissionId: result.submission_id, consignaNoCumplida: result.consigna_no_cumplida },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar. Intentá de nuevo.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  if (!task) return <p style={{ color: '#6b7280', fontSize: 14 }}>Cargando tarea...</p>;

  const canSubmit = !!file && !uploading;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header centrado */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0e7490', letterSpacing: '0.1em', marginBottom: 6 }}>
          MISIÓN DE HOY
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e2939' }}>{task.name}</h1>
      </div>

      {/* Card consigna */}
      {task.description && (
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #e0f2fe, #cffafe)',
            padding: '16px 24px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <HiPencil size={18} color="#0891b2" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0e7490', letterSpacing: '0.07em' }}>
              TAREA DE ESCRITURA · {task.subject}
            </span>
          </div>
          <div style={{ padding: '24px 28px' }}>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: '#374151', textAlign: 'center', margin: 0 }}>
              {task.description}
            </p>
          </div>
        </div>
      )}

      {/* Upload */}
      <div style={{
        background: 'rgba(255,255,255,0.85)',
        borderRadius: 20,
        padding: '28px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#009689', textAlign: 'center', marginBottom: 6 }}>
          Subí la foto de tu texto
        </h2>
        <p style={{ fontSize: 14, color: '#4a5565', textAlign: 'center', marginBottom: 20 }}>
          ¡Vamos a ver qué tal quedó!
        </p>

        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00b89c')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
            style={{
              border: '2px dashed #d1d5db', borderRadius: 16,
              padding: '48px 24px', textAlign: 'center',
              cursor: 'pointer', transition: 'border-color 0.2s',
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #e0f2fe, #cffafe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
              boxShadow: '0 4px 10px rgba(0,184,219,0.2)',
            }}>
              <HiCamera size={32} color="#0e7490" />
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#009689', marginBottom: 0 }}>
              Hacé clic acá para subir una foto
            </p>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => { const overlay = e.currentTarget.querySelector('.img-overlay') as HTMLElement; if (overlay) overlay.style.opacity = '1'; }}
            onMouseLeave={(e) => { const overlay = e.currentTarget.querySelector('.img-overlay') as HTMLElement; if (overlay) overlay.style.opacity = '0'; }}
            style={{ position: 'relative', cursor: 'pointer', borderRadius: 12, overflow: 'hidden' }}
          >
            <img
              src={preview!}
              alt="Vista previa"
              style={{ width: '100%', maxHeight: 420, objectFit: 'contain', display: 'block', borderRadius: 12, border: '1px solid #e5e7eb' }}
            />
            <div
              className="img-overlay"
              style={{
                position: 'absolute', inset: 0, borderRadius: 12,
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
                opacity: 0, transition: 'opacity 0.2s',
              }}
            >
              <HiCamera size={36} color="#fff" />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Cambiar foto</span>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        <p style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <HiCamera size={14} /> Asegurate que la foto se vea bien clarita
        </p>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#dc2626', textAlign: 'center' }}>{error}</p>
      )}

      {/* Botón enviar */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%', padding: '15px',
          borderRadius: 999, border: 'none',
          background: 'linear-gradient(90deg, #00bba7, #00b8db)',
          color: '#fff',
          fontSize: 16, fontWeight: 700,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          opacity: canSubmit ? 1 : 0.45,
          boxShadow: canSubmit ? '0 4px 12px rgba(0,184,219,0.35)' : 'none',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
      >
        {uploading ? 'Analizando tu texto...' : 'Enviar'}
      </button>

      {/* Volver */}
      <button
        onClick={() => navigate('/alumno/inicio')}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          color: '#6b7280', fontSize: 14, background: 'none',
          border: 'none', cursor: 'pointer', padding: '8px 0',
          fontFamily: 'inherit', width: '100%',
        }}
      >
        <HiArrowLeft size={15} /> Volver al inicio
      </button>
    </div>
  );
}

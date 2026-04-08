import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft, HiPhoto, HiTrash, HiPaperAirplane } from 'react-icons/hi2';
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

  function handleRemove() {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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

      const result = await submitWriting(file, user.student_uuid, classUuid, grade);
      navigate(`/alumno/tarea/${taskId}/correccion-escritura`, {
        state: { submissionId: result.submission_id },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar. Intentá de nuevo.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  if (!task) return <p style={{ color: '#6b7280', fontSize: 14 }}>Cargando tarea...</p>;

  return (
    <div>
      <Link
        to="/alumno/inicio"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}
      >
        <HiArrowLeft size={14} /> Volver al inicio
      </Link>

      {/* Task header */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', letterSpacing: '0.06em', marginBottom: 6 }}>
          ✏️ TAREA DE ESCRITURA
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>{task.name}</h1>
        {task.description && (
          <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{task.description}</p>
        )}
      </div>

      {/* Upload area */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>
          Subí una foto de tu hoja
        </h2>

        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #d1d5db', borderRadius: 12,
              padding: '48px 24px', textAlign: 'center',
              cursor: 'pointer', background: '#f9fafb',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00b89c')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
          >
            <HiPhoto size={40} color="#9ca3af" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', marginBottom: 4 }}>
              Tocá para elegir una foto
            </p>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>JPG, PNG o WEBP</p>
          </div>
        ) : (
          <div>
            <img
              src={preview}
              alt="Vista previa"
              style={{ width: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 16 }}
            />
            <button
              onClick={handleRemove}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid #fecaca', background: '#fef2f2',
                color: '#dc2626', fontSize: 13, cursor: 'pointer',
              }}
            >
              <HiTrash size={14} /> Borrar y elegir otra foto
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!file || uploading}
        style={{
          width: '100%', padding: '14px',
          borderRadius: 12, border: 'none',
          background: !file || uploading ? '#d1d5db' : '#00b89c',
          color: '#fff', fontSize: 16, fontWeight: 700,
          cursor: !file || uploading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
      >
        <HiPaperAirplane size={18} />
        {uploading ? 'Enviando y analizando...' : 'Enviar tarea'}
      </button>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft, HiMicrophone, HiStop, HiTrash, HiPaperAirplane } from 'react-icons/hi2';
import { getMe, getTasks, submitAudio } from '../../../api/alumno';
import { useAuthStore } from '../../../store/auth';
import type { Task } from '../../../types/alumno';

type Phase = 'idle' | 'recording' | 'recorded';

export function TareaLectura() {
  const { taskId } = useParams<{ taskId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  useEffect(() => {
    getTasks().then((tasks) => {
      const found = tasks.find((t) => String(t.id) === taskId);
      setTask(found ?? null);
    });
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [taskId]);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setPhase('recorded');
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setPhase('recording');
      elapsedRef.current = 0;
      setElapsed(0);
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
      }, 1000);
    } catch {
      setError('No se pudo acceder al micrófono. Verificá los permisos del navegador.');
    }
  }

  function stopRecording() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mediaRecorderRef.current?.stop();
  }

  function resetRecording() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setPhase('idle');
    elapsedRef.current = 0;
    setElapsed(0);
  }

  async function handleSubmit() {
    if (!audioBlob || !user?.student_uuid || !task) return;
    setUploading(true);
    setError(null);
    try {
      const me = await getMe();
      const classUuid = me.course?.course_uuid ?? '';
      const gradeMatch = me.course?.name.match(/(\d+)/);
      const grade = gradeMatch ? parseInt(gradeMatch[1]) : 4;
      // Use reading_text as texto_original; fall back to description/name
      const textoOriginal = task.reading_text ?? task.description ?? task.name;

      const result = await submitAudio(
        audioBlob, user.student_uuid, classUuid, grade,
        textoOriginal, user.name,
        elapsedRef.current, // pass elapsed so backend doesn't need to parse webm header
      );
      navigate(`/alumno/tarea/${taskId}/correccion-lectura`, {
        state: { submissionId: result.submission_id },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar. Intentá de nuevo.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  }

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (!task) return <p style={{ color: '#6b7280', fontSize: 14 }}>Cargando tarea...</p>;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <Link
        to="/alumno/inicio"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, textDecoration: 'none', marginBottom: 24 }}
      >
        <HiArrowLeft size={14} /> Volver al inicio
      </Link>

      {/* Mission header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.1em', marginBottom: 6 }}>
          MISIÓN DE HOY
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827' }}>Lee este párrafo</h1>
      </div>

      {/* Reading text card */}
      {task.reading_text && (
        <div style={{
          background: '#fff', borderRadius: 16,
          padding: '28px 32px', marginBottom: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          fontSize: 16, lineHeight: 1.8, color: '#374151',
          textAlign: 'center',
        }}>
          "{task.reading_text}"
        </div>
      )}

      {/* Instructions */}
      <p style={{ textAlign: 'center', fontSize: 14, color: '#6b7280', marginBottom: 28 }}>
        {phase === 'idle'
          ? 'Cuando estés listo, hacé clic en el micrófono'
          : phase === 'recording'
          ? 'Leé el texto en voz alta. Cuando termines, presioná detener.'
          : '¡Grabación lista! Escuchala o grabá de nuevo.'}
      </p>

      {/* Mic / recording controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginBottom: 28 }}>

        {/* IDLE */}
        {phase === 'idle' && (
          <button
            onClick={startRecording}
            style={{
              width: 80, height: 80, borderRadius: '50%', border: 'none',
              background: '#00b89c', color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,184,156,0.35)',
            }}
          >
            <HiMicrophone size={32} />
          </button>
        )}

        {/* RECORDING */}
        {phase === 'recording' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', animation: 'pulse 1s infinite' }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
                {formatTime(elapsed)}
              </span>
            </div>
            <button
              onClick={stopRecording}
              style={{
                width: 80, height: 80, borderRadius: '50%', border: 'none',
                background: '#dc2626', color: '#fff',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(220,38,38,0.35)',
              }}
            >
              <HiStop size={32} />
            </button>
          </>
        )}

        {/* RECORDED */}
        {phase === 'recorded' && audioUrl && (
          <>
            <audio src={audioUrl} controls style={{ width: '100%', maxWidth: 360, borderRadius: 8 }} />
            <button
              onClick={resetRecording}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                border: '1px solid #fecaca', background: '#fef2f2',
                color: '#dc2626', fontSize: 13, cursor: 'pointer',
              }}
            >
              <HiTrash size={14} /> Grabar de nuevo
            </button>
          </>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16, textAlign: 'center' }}>{error}</p>
      )}

      {/* Send button — always visible, disabled until recorded */}
      <button
        onClick={handleSubmit}
        disabled={phase !== 'recorded' || uploading}
        style={{
          width: '100%', padding: '16px',
          borderRadius: 14, border: 'none',
          background: phase !== 'recorded' || uploading ? '#d1d5db' : '#00b89c',
          color: phase !== 'recorded' || uploading ? '#9ca3af' : '#fff',
          fontSize: 16, fontWeight: 700,
          cursor: phase !== 'recorded' || uploading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          transition: 'background 0.2s',
        }}
      >
        <HiPaperAirplane size={18} />
        {uploading ? 'Enviando y analizando...' : 'Enviar'}
      </button>
    </div>
  );
}

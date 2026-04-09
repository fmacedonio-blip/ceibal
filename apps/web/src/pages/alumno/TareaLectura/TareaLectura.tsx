import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiArrowLeft, HiMicrophone, HiStop, HiPlay, HiPause, HiTrash } from 'react-icons/hi2';
import { getMe, getTasks, submitAudio } from '../../../api/alumno';
import { useAuthStore } from '../../../store/auth';
import type { Task } from '../../../types/alumno';

type Phase = 'idle' | 'recording' | 'recorded';

function AudioPlayer({ url, onReset }: { url: string; onReset: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function tick() {
    const audio = audioRef.current;
    if (!audio) return;
    const pct = audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0;
    if (barRef.current) barRef.current.style.width = `${pct}%`;
    if (timeRef.current) timeRef.current.textContent =
      `${fmt(audio.currentTime)}${audio.duration > 0 ? ` / ${fmt(audio.duration)}` : ''}`;
    rafRef.current = requestAnimationFrame(tick);
  }

  function toggle() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setPlaying(false);
    } else {
      audioRef.current.play();
      rafRef.current = requestAnimationFrame(tick);
      setPlaying(true);
    }
  }

  function handleEnded() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setPlaying(false);
  }

  return (
    <div style={{
      background: 'linear-gradient(90deg, #ccfbf1, #cffafe)',
      borderRadius: 999, padding: '10px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 2px 8px rgba(0,184,156,0.15)',
      width: '100%', maxWidth: 360,
    }}>
      <audio
        ref={audioRef}
        src={url}
        onEnded={handleEnded}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        style={{ display: 'none' }}
      />
      <button
        onClick={toggle}
        style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
          background: '#00bba7', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,187,167,0.4)',
        }}
      >
        {playing ? <HiPause size={20} /> : <HiPlay size={20} />}
      </button>

      {/* Barra + tiempo superpuesto */}
      <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
        <div style={{ height: 6, background: 'rgba(0,0,0,0.1)', borderRadius: 999, overflow: 'hidden' }}>
          <div ref={barRef} style={{ height: 6, width: '0%', background: '#00bba7', borderRadius: 999 }} />
        </div>
        <span
          ref={timeRef}
          style={{
            position: 'absolute', top: 10, left: 0,
            fontSize: 11, color: '#0d9488', fontVariantNumeric: 'tabular-nums',
            pointerEvents: 'none',
          }}
        >
          {duration > 0 ? `00:00 / ${fmt(duration)}` : '00:00'}
        </span>
      </div>

      <button
        onClick={onReset}
        style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none', flexShrink: 0,
          background: '#ef4444', color: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <HiTrash size={16} />
      </button>
    </div>
  );
}

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
      const textoOriginal = task.reading_text ?? task.description ?? task.name;
      const result = await submitAudio(
        audioBlob, user.student_uuid, classUuid, grade,
        textoOriginal, user.name, Number(taskId), elapsedRef.current,
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

  const canSubmit = phase === 'recorded' && !uploading;

  if (!task) return <p style={{ color: '#6b7280', fontSize: 14 }}>Cargando tarea...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, margin: '0 auto' }}>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0e7490', letterSpacing: '0.1em', marginBottom: 6 }}>
          MISIÓN DE HOY
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e2939' }}>Lee este párrafo</h1>
      </div>

      {/* Card de texto — header rosa como lectura */}
      {task.reading_text && (
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
              <HiMicrophone size={18} color="#0891b2" />
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0e7490', letterSpacing: '0.07em' }}>
              TAREA DE LECTURA · {task.name}
            </span>
          </div>
          <div style={{ padding: '24px 28px' }}>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: '#374151', textAlign: 'center', margin: 0 }}>
              "{task.reading_text}"
            </p>
          </div>
        </div>
      )}

      {/* Instrucción */}
      <p style={{ textAlign: 'center', fontSize: 14, color: '#4a5565', margin: 0 }}>
        {phase === 'idle'
          ? 'Cuando estés listo, hacé clic en el micrófono'
          : phase === 'recording'
          ? 'Leé el texto en voz alta. Cuando termines, presioná detener.'
          : '¡Grabación lista! Escuchala o grabá de nuevo.'}
      </p>

      {/* Controles grabación */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>

        {phase === 'idle' && (
          <button
            onClick={startRecording}
            style={{
              width: 80, height: 80, borderRadius: '50%', border: 'none',
              background: '#00bba7', color: '#fff',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(0,187,167,0.4)',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <HiMicrophone size={34} />
          </button>
        )}

        {phase === 'recording' && (
          <>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Pulse ring */}
              <div style={{
                position: 'absolute', width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(239,68,68,0.3)',
                animation: 'pulse-ring 1.2s ease-out infinite',
              }} />
              <button
                onClick={stopRecording}
                style={{
                  width: 80, height: 80, borderRadius: '50%', border: 'none',
                  background: '#ef4444', color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
                  position: 'relative', zIndex: 1,
                }}
              >
                <HiStop size={32} />
              </button>
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>
              Grabando... {formatTime(elapsed)}
            </span>
          </>
        )}

        {phase === 'recorded' && audioUrl && (
          <AudioPlayer url={audioUrl} onReset={resetRecording} />
        )}
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#dc2626', textAlign: 'center', margin: 0 }}>{error}</p>
      )}

      {/* Botón enviar */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        style={{
          width: '100%', padding: '15px',
          borderRadius: 999, border: 'none',
          background: 'linear-gradient(90deg, #00bba7, #00b8db)',
          color: '#fff', fontSize: 16, fontWeight: 700,
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          opacity: canSubmit ? 1 : 0.45,
          boxShadow: canSubmit ? '0 4px 12px rgba(0,184,219,0.35)' : 'none',
          transition: 'opacity 0.2s',
          fontFamily: 'inherit',
        }}
      >
        {uploading ? 'Analizando tu lectura...' : 'Enviar'}
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

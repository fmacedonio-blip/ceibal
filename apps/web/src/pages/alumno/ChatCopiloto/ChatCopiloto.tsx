import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiHome, HiPaperAirplane } from 'react-icons/hi2';
import { getChatHistory, getChatSession, sendChatMessage, startChat } from '../../../api/alumno';
import { useAuthStore } from '../../../store/auth';
import { Avatar } from '../../../components/Avatar/Avatar';
import { Spinner } from '../../../components/Spinner/Spinner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatCopiloto() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!submissionId) return;
    initChat();
  }, [submissionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function initChat() {
    if (!submissionId) return;
    try {
      const sessionCheck = await getChatSession(submissionId);
      if (!sessionCheck.exists || !sessionCheck.session_id) {
        const started = await startChat(submissionId);
        setMessages([{ role: 'assistant', content: started.first_message.content }]);
        setSessionId(started.session_id);
        return;
      }
      const history = await getChatHistory(sessionCheck.session_id);
      setMessages(history.messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })));
      setSessionId(sessionCheck.session_id);
    } catch {
      setError('No se pudo cargar el chat. Intentá de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || !sessionId || sending) return;
    const userMsg = input.trim();
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setSending(true);
    try {
      const res = await sendChatMessage(sessionId, userMsg);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.content }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Uy, algo salió mal. ¿Podés repetir tu pregunta?' }]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const canSend = !!input.trim() && !sending && !!sessionId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 68px)', margin: '-36px -24px 0', padding: '0' }}>

      {/* Header */}
      <div style={{
        padding: '28px 24px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: 12, color: '#4a5565', fontWeight: 500, marginBottom: 2 }}>Charlemos de tu tarea</p>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#009689', display: 'flex', alignItems: 'center', gap: 6 }}>
            ✨ Mi Copiloto
          </h1>
        </div>
        <button
          onClick={() => navigate('/alumno/inicio')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 999,
            border: '1.5px solid #e5e7eb', background: 'rgba(255,255,255,0.85)',
            color: '#374151', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <HiHome size={16} /> Volver al inicio
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading && <Spinner />}
        {error && (
          <div style={{ textAlign: 'center', color: '#dc2626', fontSize: 14, marginTop: 60 }}>{error}</div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-end',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
          }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              {msg.role === 'assistant' ? (
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00bba7, #00b8db)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,187,167,0.4)',
                }}>
                  <span style={{ color: '#fff', fontSize: 16 }}>✦</span>
                </div>
              ) : (
                <Avatar name={user?.name ?? 'A'} size={34} fontSize={12} />
              )}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
              background: msg.role === 'user'
                ? 'rgba(255,255,255,0.9)'
                : 'linear-gradient(135deg, #00bba7, #00b8db)',
              color: msg.role === 'user' ? '#1e2939' : '#fff',
              fontSize: 15,
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              boxShadow: msg.role === 'user'
                ? '0 2px 8px rgba(0,0,0,0.07)'
                : '0 2px 10px rgba(0,187,167,0.3)',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00bba7, #00b8db)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(0,187,167,0.4)',
            }}>
              <span style={{ color: '#fff', fontSize: 16 }}>✦</span>
            </div>
            <div style={{
              padding: '12px 18px', borderRadius: '4px 18px 18px 18px',
              background: 'linear-gradient(135deg, #00bba7, #00b8db)',
              boxShadow: '0 2px 10px rgba(0,187,167,0.3)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20, letterSpacing: 3 }}>···</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '8px 24px 32px',
        display: 'flex', gap: 10, alignItems: 'flex-end',
      }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Texto a enviar"
          rows={1}
          style={{
            flex: 1, resize: 'none',
            padding: '12px 18px',
            borderRadius: 999,
            border: '1.5px solid #e5e7eb',
            background: 'rgba(255,255,255,0.9)',
            fontSize: 15, fontFamily: 'inherit',
            outline: 'none', lineHeight: 1.5,
            boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '12px 20px', borderRadius: 999, border: 'none',
            background: 'linear-gradient(90deg, #00bba7, #00b8db)',
            color: '#fff', fontSize: 15, fontWeight: 600,
            cursor: canSend ? 'pointer' : 'not-allowed',
            opacity: canSend ? 1 : 0.5,
            flexShrink: 0, fontFamily: 'inherit',
            boxShadow: canSend ? '0 4px 10px rgba(0,184,219,0.35)' : 'none',
          }}
        >
          <HiPaperAirplane size={16} /> Enviar
        </button>
      </div>
    </div>
  );
}

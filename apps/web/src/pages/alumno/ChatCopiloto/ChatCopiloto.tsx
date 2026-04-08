import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiArrowLeft, HiPaperAirplane } from 'react-icons/hi2';
import { getChatHistory, getChatSession, sendChatMessage, startChat } from '../../../api/alumno';
import { useAuthStore } from '../../../store/auth';
import { Avatar } from '../../../components/Avatar/Avatar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatCopiloto() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { user } = useAuthStore();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        // No session yet — start one (generates first socratic message)
        const started = await startChat(submissionId);
        setMessages([{ role: 'assistant', content: started.first_message.content }]);
        setSessionId(started.session_id);
        return;
      }

      // Session exists — load its history
      const history = await getChatHistory(sessionCheck.session_id);
      setMessages(
        history.messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      );
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px - 64px)' }}>
      {/* Top bar */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link
          to="/alumno/inicio"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7280', fontSize: 13, textDecoration: 'none' }}
        >
          <HiArrowLeft size={14} /> Inicio
        </Link>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#00b89c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 16 }}>✦</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Copiloto</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Tu asistente de aprendizaje</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto',
        background: '#fff', borderRadius: 16,
        padding: '20px', marginBottom: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {loading && (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, marginTop: 40 }}>
            Conectando con el Copiloto...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', color: '#dc2626', fontSize: 14, marginTop: 40 }}>{error}</div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              {msg.role === 'assistant' ? (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#00b89c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: '#fff', fontSize: 14 }}>✦</span>
                </div>
              ) : (
                <Avatar name={user?.name ?? 'A'} size={32} fontSize={12} />
              )}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '72%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
              background: msg.role === 'user' ? '#00b89c' : '#f3f4f6',
              color: msg.role === 'user' ? '#fff' : '#111827',
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#00b89c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 14 }}>✦</span>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: '4px 16px 16px 16px', background: '#f3f4f6' }}>
              <span style={{ color: '#9ca3af', fontSize: 14 }}>Pensando...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí tu pregunta..."
          rows={1}
          style={{
            flex: 1, resize: 'none', padding: '12px 16px',
            borderRadius: 12, border: '1px solid #d1d5db',
            fontSize: 14, fontFamily: 'inherit',
            outline: 'none', lineHeight: 1.5,
          }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending || !sessionId}
          style={{
            padding: '12px 16px', borderRadius: 12, border: 'none',
            background: !input.trim() || sending ? '#d1d5db' : '#00b89c',
            color: '#fff', cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
            flexShrink: 0,
          }}
        >
          <HiPaperAirplane size={18} />
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiLockClosed } from 'react-icons/hi2';
import { devLogin } from '../../api/auth';
import { adminListStudents } from '../../api/admin';
import { useAuthStore } from '../../store/auth';
import type { UserRole } from '../../types/api';
import type { AdminStudent } from '../../api/admin';
import logo from '../../assets/logo.svg';

export function Login() {
  const [role, setRole] = useState<UserRole>('docente');
  const [studentId, setStudentId] = useState<number | null>(null);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    adminListStudents().then((list) => {
      setStudents(list);
      if (list.length > 0) setStudentId(list[0].id);
    });
  }, []);

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const res = await devLogin(role, role === 'alumno' && studentId ? studentId : undefined);
      login(res.access_token, res.user);
      navigate(role === 'alumno' ? '/alumno/inicio' : '/dashboard', { replace: true });
    } catch {
      setError('Error al iniciar sesión. Verificá que la API esté corriendo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f3f4f6',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Dev role selector — top left */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <label style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Dev:</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          style={{
            padding: '4px 8px',
            borderRadius: 6,
            border: '1px solid #d1d5db',
            fontSize: 12,
            color: '#374151',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          <option value="docente">Docente</option>
          <option value="alumno">Alumno</option>
          <option value="director">Director/a</option>
          <option value="inspector">Inspector/a</option>
        </select>

        {role === 'alumno' && (
          <select
            value={studentId ?? ''}
            onChange={(e) => setStudentId(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              fontSize: 12,
              color: '#374151',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.course_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Logo */}
      <img src={logo} alt="Ceibal" style={{ height: 36, width: 'auto', marginBottom: 32 }} />

      {/* Card */}
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '48px 40px',
          boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
          width: 400,
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
          Copiloto Pedagógico
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32 }}>
          Ingresá con tu cuenta Ceibal
        </p>

        {error && (
          <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16 }}>{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: 10,
            background: loading ? '#9ca3af' : '#00b89c',
            color: '#fff',
            fontWeight: 600,
            fontSize: 15,
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            marginBottom: 16,
          }}
        >
          <HiLockClosed size={18} />
          {loading ? 'Iniciando...' : 'Iniciar sesión'}
        </button>

        <p style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <HiLockClosed size={13} />
          Acceso mediante Single Sign-On Institucional
        </p>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 24,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          padding: '0 32px',
        }}
      >
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          Centro Ceibal © 2026 · Términos y Condiciones · Privacidad
        </span>
        <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em' }}>
          SISTEMA OPERATIVO
        </span>
      </div>
    </div>
  );
}

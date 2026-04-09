import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
} from 'amazon-cognito-identity-js';
import { HiLockClosed } from 'react-icons/hi2';
import { useAuthStore } from '../../store/auth';
import type { AuthUser, UserRole } from '../../types/api';
import logo from '../../assets/logo.svg';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const userPool = new CognitoUserPool({
      UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    });
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess(result) {
        const token = result.getIdToken().getJwtToken();
        const payload = result.getIdToken().payload;
        const groups: string[] = (payload['cognito:groups'] as string[]) ?? [];
        const role = (groups[0] ?? 'docente') as UserRole;
        const user: AuthUser = {
          id: payload.sub,
          name: (payload.name as string) ?? (payload['cognito:username'] as string) ?? payload.sub,
          role,
        };
        login(token, user);
        navigate(role === 'alumno' ? '/alumno/inicio' : '/dashboard', { replace: true });
      },
      onFailure(err) {
        const msg: Record<string, string> = {
          NotAuthorizedException: 'Email o contraseña incorrectos.',
          UserNotFoundException: 'Usuario no encontrado.',
          UserNotConfirmedException: 'Cuenta no confirmada. Revisá tu email.',
        };
        setError(msg[err.code] ?? err.message ?? 'Error al iniciar sesión.');
        setLoading(false);
      },
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 8,
    border: '1px solid #d1d5db',
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    boxSizing: 'border-box',
  };

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
      <img src={logo} alt="Ceibal" style={{ height: 36, width: 'auto', marginBottom: 32 }} />

      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '48px 40px',
          boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
          width: 400,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 8, textAlign: 'center' }}>
          Copiloto Pedagógico
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 32, textAlign: 'center' }}>
          Ingresá con tu cuenta Ceibal
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@ceibal.edu.uy"
              required
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
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
              marginTop: 4,
            }}
          >
            <HiLockClosed size={18} />
            {loading ? 'Iniciando...' : 'Ingresar'}
          </button>
        </form>

        <p
          style={{
            fontSize: 12,
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 20,
          }}
        >
          <HiLockClosed size={13} />
          Acceso mediante Single Sign-On Institucional
        </p>
      </div>

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

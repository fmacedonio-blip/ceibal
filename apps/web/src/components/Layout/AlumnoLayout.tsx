import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { Avatar } from '../Avatar/Avatar';
import logoUrl from '../../assets/logo.svg?url';

export function AlumnoLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 32px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <img src={logoUrl} alt="Ceibal" style={{ height: 28, width: 'auto' }} />

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={user.name} size={32} fontSize={12} />
            <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>{user.name}</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid #d1d5db',
                background: '#fff',
                fontSize: 13,
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </header>

      {/* Page content */}
      <main style={{ flex: 1, padding: '32px', maxWidth: 860, width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

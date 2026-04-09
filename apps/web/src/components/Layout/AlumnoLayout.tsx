import { Outlet, useNavigate } from 'react-router-dom';
import { HiStar } from 'react-icons/hi2';
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
    <div className="alumno-bg" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.25)',
        padding: '0 32px',
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <img src={logoUrl} alt="Ceibal" style={{ height: 30, width: 'auto' }} />

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Stars badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: '#fef9c3',
              border: '1.5px solid #fde047',
              borderRadius: 999,
              padding: '5px 12px',
            }}>
              <HiStar size={18} color="#f59e0b" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#92400e' }}>5</span>
            </div>

            {/* Avatar with logout on click */}
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                borderRadius: '50%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <Avatar name={user.name} size={38} fontSize={13} />
            </button>
          </div>
        )}
      </header>

      {/* Page content */}
      <main style={{ flex: 1, padding: '36px 24px', maxWidth: 800, width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import {
  HiOutlineHome,
  HiOutlineBookOpen,
  HiOutlineChartBar,
  HiOutlineCog6Tooth,
} from 'react-icons/hi2';
import { useAuthStore } from '../../store/auth';
import { Avatar } from '../Avatar/Avatar';
import logo from '../../assets/logo.svg';

const NAV_ITEMS = [
  { label: 'Inicio', to: '/dashboard', Icon: HiOutlineHome },
  { label: 'Mis Cursos', to: '/courses', Icon: HiOutlineBookOpen },
  { label: 'Reportes', to: '/reports', Icon: HiOutlineChartBar },
  { label: 'Configuración', to: '/settings', Icon: HiOutlineCog6Tooth },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside
      style={{
        width: 220,
        height: '100%',
        background: '#fff',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        onClick={() => navigate('/dashboard')}
        style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid #f3f4f6',
          cursor: 'pointer',
        }}
      >
        <img src={logo} alt="Ceibal" style={{ height: 28, width: 'auto', display: 'block' }} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0' }}>
        {NAV_ITEMS.map(({ label, to, Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '11px 16px',
              margin: '2px 12px',
              borderRadius: 8,
              color: isActive ? '#00b89c' : '#374151',
              background: isActive ? '#e8faf8' : 'transparent',
              textDecoration: 'none',
              fontWeight: isActive ? 600 : 400,
              fontSize: 14,
              transition: 'background 0.15s',
            })}
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          padding: '16px 20px',
        }}
      >
        {user && (
          <div
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            title="Cerrar sesión"
          >
            <Avatar name={user.name} size={40} fontSize={14} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#111827',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.name}
              </div>
              <button
                onClick={handleLogout}
                style={{
                  fontSize: 11,
                  color: '#9ca3af',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  textAlign: 'left',
                  textTransform: 'capitalize',
                }}
              >
                {user.role}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

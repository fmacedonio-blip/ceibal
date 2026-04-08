import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AuthLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', background: '#f9fafb' }}>
        <div style={{ padding: '32px 40px' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

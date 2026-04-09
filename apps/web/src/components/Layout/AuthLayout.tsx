import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/auth';

export function AuthLayout() {
  const { user, login, token } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    apiClient.get<{ name: string; role: string }>('/api/v1/profile').then((res) => {
      if (user && res.data.name !== user.name) {
        login(token, { ...user, name: res.data.name });
      }
    }).catch(() => {});
  }, []);

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

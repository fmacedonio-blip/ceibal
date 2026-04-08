import type { LoginResponse, UserRole } from '../types/api';
import { apiClient } from './client';

export async function devLogin(role: UserRole, studentId?: number): Promise<LoginResponse> {
  const body: Record<string, unknown> = { role };
  if (role === 'alumno' && studentId != null) {
    body.student_id = studentId;
  }
  const res = await apiClient.post<LoginResponse>('/auth/dev-login', body);
  return res.data;
}

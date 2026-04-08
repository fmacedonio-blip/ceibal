import { apiClient } from './client';
import type {
  AlumnoProfile,
  AudioCorrectionResponse,
  CorrectionResponse,
  Task,
  WritingCorrectionResponse,
} from '../types/alumno';

export async function getMe(): Promise<AlumnoProfile> {
  const res = await apiClient.get<AlumnoProfile>('/api/v1/me');
  return res.data;
}

export async function getTasks(): Promise<Task[]> {
  const res = await apiClient.get<Task[]>('/api/v1/me/tasks');
  return res.data;
}

export async function submitWriting(
  file: File,
  studentUuid: string,
  classUuid: string,
  grade: number,
  activityId: number,
): Promise<{ submission_id: string }> {
  const form = new FormData();
  form.append('file', file);
  form.append('student_id', studentUuid);
  form.append('class_id', classUuid);
  form.append('grade', String(grade));
  form.append('activity_id', String(activityId));

  const res = await apiClient.post<{ submission_id: string }>(
    '/api/v1/submissions/analyze',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data;
}

export async function submitAudio(
  audioBlob: Blob,
  studentUuid: string,
  classUuid: string,
  grade: number,
  textoOriginal: string,
  nombre: string,
  activityId: number,
  duracionSeg?: number,
): Promise<{ submission_id: string }> {
  const form = new FormData();
  form.append('file', audioBlob, 'recording.webm');
  form.append('student_id', studentUuid);
  form.append('class_id', classUuid);
  form.append('grade', String(grade));
  form.append('texto_original', textoOriginal);
  form.append('nombre', nombre);
  form.append('activity_id', String(activityId));
  if (duracionSeg != null && duracionSeg > 0) {
    form.append('duracion_seg', String(duracionSeg));
  }

  const res = await apiClient.post<{ submission_id: string }>(
    '/api/v1/submissions/analyze-audio',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data;
}

export function getSubmissionImageUrl(submissionId: string): string {
  const base = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '');
  return `${base}/api/v1/submissions/${submissionId}/image`;
}

export async function getCorrection(submissionId: string): Promise<CorrectionResponse> {
  const res = await apiClient.get<WritingCorrectionResponse | AudioCorrectionResponse>(
    `/api/v1/submissions/${submissionId}/correction`,
  );
  return res.data;
}

// Chat
export async function getChatSession(
  submissionId: string,
): Promise<{ exists: boolean; session_id: string | null }> {
  const res = await apiClient.get<{ exists: boolean; session_id: string | null }>(
    `/api/v1/submissions/${submissionId}/chat-session`,
  );
  return res.data;
}

export async function startChat(
  submissionId: string,
): Promise<{ session_id: string; first_message: { content: string } }> {
  const res = await apiClient.post<{ session_id: string; first_message: { content: string } }>(
    `/api/v1/submissions/${submissionId}/chat/start`,
  );
  return res.data;
}

export async function getChatHistory(
  sessionId: string,
): Promise<{ messages: Array<{ role: string; content: string }> }> {
  const res = await apiClient.get<{ messages: Array<{ role: string; content: string }> }>(
    `/api/v1/chat/${sessionId}/history`,
  );
  return res.data;
}

export async function sendChatMessage(
  sessionId: string,
  content: string,
): Promise<{ content: string }> {
  const res = await apiClient.post<{ content: string }>(
    `/api/v1/chat/${sessionId}/message`,
    { content },
  );
  return res.data;
}

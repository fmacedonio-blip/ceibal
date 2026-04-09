import type { Course, StudentFilter, StudentsResponse } from "../types/api";
import { apiClient } from "./client";

export async function getCourses(): Promise<Course[]> {
  const res = await apiClient.get<Course[]>("/api/v1/courses");
  return res.data;
}

export async function getCourseStudents(
  courseId: string,
  params: { filter?: StudentFilter; search?: string; page?: number; limit?: number }
): Promise<StudentsResponse> {
  const res = await apiClient.get<StudentsResponse>(
    `/api/v1/courses/${courseId}/students`,
    { params }
  );
  return res.data;
}

export async function getCourseTasksList(courseId: string): Promise<{
  id: number; name: string; type: 'lectura' | 'escritura'; date: string; progress: number;
}[]> {
  const res = await apiClient.get(`/api/v1/courses/${courseId}/tasks`);
  return res.data;
}

export async function createTask(
  courseId: number,
  payload: {
    name: string;
    type: 'lectura' | 'escritura';
    description?: string;
    reading_text?: string;
  }
): Promise<{ tasks_created: number }> {
  const res = await apiClient.post<{ tasks_created: number }>(
    `/api/v1/courses/${courseId}/tasks`,
    payload
  );
  return res.data;
}

import type { Course, StudentFilter, StudentsResponse } from "../types/api";
import { apiClient } from "./client";

export async function getCourses(): Promise<Course[]> {
  const res = await apiClient.get<Course[]>("/api/v1/courses");
  return res.data;
}

export async function getCourse(courseId: string): Promise<Course> {
  const courses = await getCourses();
  const course = courses.find((c) => String(c.id) === courseId);
  if (!course) throw new Error(`Course ${courseId} not found`);
  return course;
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

export interface TaskMetrics {
  ppm?: number | null;
  precision?: number | null;
  total_errors?: number | null;
  spelling_errors?: number | null;
  concordance_errors?: number | null;
  requires_review: boolean;
}

export interface TaskStudentRow {
  student_id: number;
  activity_id: number | null;
  name: string;
  status: 'COMPLETADA' | 'NO_ENTREGADO';
  metrics: TaskMetrics | null;
}

export interface TaskDetailResponse {
  task: {
    name: string;
    type: 'lectura' | 'escritura';
    date: string;
    description: string | null;
    reading_text: string | null;
    evaluation_criteria: string | null;
  };
  students: TaskStudentRow[];
}

export async function getTaskStudents(courseId: string, taskId: string): Promise<TaskDetailResponse> {
  const res = await apiClient.get<TaskDetailResponse>(
    `/api/v1/courses/${courseId}/tasks/${taskId}/students`
  );
  return res.data;
}

export async function createTask(
  courseId: number,
  payload: {
    name: string;
    type: 'lectura' | 'escritura';
    description?: string;
    reading_text?: string;
    evaluation_criteria?: string;
  }
): Promise<{ tasks_created: number }> {
  const res = await apiClient.post<{ tasks_created: number }>(
    `/api/v1/courses/${courseId}/tasks`,
    payload
  );
  return res.data;
}

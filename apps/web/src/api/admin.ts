import { apiClient } from "./client";

export interface AdminStudent {
  id: number;
  name: string;
  course_id: number;
  course_name: string;
  student_uuid: string;
  average?: number;
}

export async function adminListStudents(): Promise<AdminStudent[]> {
  const res = await apiClient.get<AdminStudent[]>("/admin/students");
  return res.data;
}

export async function adminCreateStudent(courseId: number, name?: string): Promise<AdminStudent> {
  const res = await apiClient.post<AdminStudent>(`/admin/courses/${courseId}/students`, name ? { name } : {});
  return res.data;
}

export async function adminDeleteCourseStudents(courseId: number): Promise<{ deleted_students: number }> {
  const res = await apiClient.delete<{ deleted_students: number }>(`/admin/courses/${courseId}/students`);
  return res.data;
}

export async function adminDeleteCourseTasks(courseId: number): Promise<{ deleted_tasks: number }> {
  const res = await apiClient.delete<{ deleted_tasks: number }>(`/admin/courses/${courseId}/tasks`);
  return res.data;
}

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

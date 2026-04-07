import type { StudentDetail } from "../types/api";
import { apiClient } from "./client";

export async function getStudent(studentId: string): Promise<StudentDetail> {
  const res = await apiClient.get<StudentDetail>(`/api/v1/students/${studentId}`);
  return res.data;
}

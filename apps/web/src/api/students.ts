import type { AiDiagnosis, StudentDetail } from "../types/api";
import { apiClient } from "./client";

export async function getStudent(studentId: string): Promise<StudentDetail> {
  const res = await apiClient.get<StudentDetail>(`/api/v1/students/${studentId}`);
  return res.data;
}

export async function generateDiagnosis(studentId: string): Promise<AiDiagnosis> {
  const res = await apiClient.post<AiDiagnosis>(`/api/v1/students/${studentId}/generate-diagnosis`);
  return res.data;
}

import type { LoginResponse, UserRole } from "../types/api";
import { apiClient } from "./client";

export async function devLogin(role: UserRole): Promise<LoginResponse> {
  const res = await apiClient.post<LoginResponse>("/auth/dev-login", { role });
  return res.data;
}

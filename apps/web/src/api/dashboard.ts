import type { DashboardResponse } from "../types/api";
import { apiClient } from "./client";

export async function getDashboard(): Promise<DashboardResponse> {
  const res = await apiClient.get<DashboardResponse>("/api/v1/dashboard");
  return res.data;
}

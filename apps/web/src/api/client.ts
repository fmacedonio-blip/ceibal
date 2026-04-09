import axios from "axios";
import { useAuthStore } from "../store/auth";

const TOKEN_KEY = "ceibal_token";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.replace("/login");
    } else if (error.response?.status === 403) {
      const role = useAuthStore.getState().user?.role;
      window.location.replace(role === "alumno" ? "/alumno/inicio" : "/dashboard");
    }
    return Promise.reject(error);
  }
);

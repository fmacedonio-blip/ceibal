import { create } from "zustand";
import type { AuthUser } from "../types/api";

const TOKEN_KEY = "ceibal_token";

function fixEncoding(str: string): string {
  try {
    return decodeURIComponent(escape(str));
  } catch {
    return str;
  }
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isTokenValid: () => boolean;
}

function parseTokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ?? null;
  } catch {
    return null;
  }
}

const storedToken = localStorage.getItem(TOKEN_KEY);
let initialUser: AuthUser | null = null;

if (storedToken) {
  try {
    const payload = JSON.parse(atob(storedToken.split(".")[1]));
    const groups: string[] = payload["cognito:groups"] ?? [];
    const role = payload.role ?? groups[0] ?? "docente";
    initialUser = {
      id: payload.sub,
      name: fixEncoding(payload.name ?? payload["cognito:username"] ?? payload.sub),
      role,
      ...(payload.student_uuid && { student_uuid: payload.student_uuid }),
      ...(payload.student_id != null && { student_id: payload.student_id }),
    };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: storedToken,
  user: initialUser,

  login: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null });
  },

  isTokenValid: () => {
    const { token } = get();
    if (!token) return false;
    const exp = parseTokenExp(token);
    if (!exp) return false;
    return Date.now() / 1000 < exp;
  },
}));

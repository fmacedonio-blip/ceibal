import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { devLogin } from "../../api/auth";
import { useAuthStore } from "../../store/auth";
import type { UserRole } from "../../types/api";

export function Login() {
  const [role, setRole] = useState<UserRole>("docente");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location })?.from?.pathname ?? "/dashboard";

  async function handleLogin() {
    setLoading(true);
    setError(null);
    try {
      const res = await devLogin(role);
      login(res.access_token, res.user);
      navigate(from, { replace: true });
    } catch {
      setError("Error al iniciar sesión. Verificá que la API esté corriendo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#f9fafb",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: "48px 40px",
        boxShadow: "0 1px 8px rgba(0,0,0,0.08)", width: 360, textAlign: "center",
      }}>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#00b89c", marginBottom: 8 }}>
          ● Ceibal
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 6 }}>
          Copiloto Pedagógico
        </h1>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32 }}>
          Entorno de desarrollo — elegí tu rol
        </p>

        <div style={{ marginBottom: 24, textAlign: "left" }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
            Rol
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 8,
              border: "1px solid #d1d5db", fontSize: 14, color: "#111827",
              background: "#fff", cursor: "pointer",
            }}
          >
            <option value="docente">Docente</option>
            <option value="alumno">Alumno</option>
            <option value="director">Director/a</option>
            <option value="inspector">Inspector/a</option>
          </select>
        </div>

        {error && (
          <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 16 }}>{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "12px", borderRadius: 8,
            background: loading ? "#9ca3af" : "#00b89c",
            color: "#fff", fontWeight: 600, fontSize: 15,
            border: "none", cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Iniciando..." : "Iniciar sesión"}
        </button>

        <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 24 }}>
          Centro Ceibal © 2026 · Entorno local
        </p>
      </div>
    </div>
  );
}

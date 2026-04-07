import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../../api/dashboard";
import type { DashboardResponse, AlertSeverity, ActivityStatus } from "../../types/api";

const SEVERITY_COLOR: Record<AlertSeverity, string> = {
  high: "#dc2626",
  medium: "#f59e0b",
  low: "#3b82f6",
};

const STATUS_STYLE: Record<ActivityStatus, { bg: string; color: string }> = {
  COMPLETADA: { bg: "#dcfce7", color: "#166534" },
  PENDIENTE_DE_REVISION: { bg: "#fef3c7", color: "#92400e" },
  REVISADA: { bg: "#e0f2fe", color: "#075985" },
};

export function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboard().then(setData);
  }, []);

  if (!data) return <p style={{ color: "#6b7280" }}>Cargando...</p>;

  return (
    <div>
      {/* Alertas Prioritarias */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 16 }}>
          Alertas Prioritarias
        </h2>
        <div style={{ display: "flex", gap: 16 }}>
          {data.alerts.map((alert) => (
            <div key={alert.id} style={{
              flex: 1, background: "#fff", borderRadius: 10, padding: "16px 20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              borderLeft: `4px solid ${SEVERITY_COLOR[alert.severity]}`,
            }}>
              <p style={{ fontSize: 14, color: "#374151", marginBottom: 10 }}>{alert.message}</p>
              <button style={{
                fontSize: 12, fontWeight: 700, color: SEVERITY_COLOR[alert.severity],
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}>
                VER DETALLE →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Mis Cursos */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Mis Cursos</h2>
          <button onClick={() => navigate("/courses")} style={{
            fontSize: 13, color: "#00b89c", background: "none", border: "none", cursor: "pointer",
          }}>
            Ver todos
          </button>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {data.courses.map((course) => (
            <div key={course.id} style={{
              flex: 1, background: "#fff", borderRadius: 10, padding: "20px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{course.name} — {course.shift}</div>
                  <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{course.student_count} alumnos inscriptos</div>
                </div>
                <div style={{
                  background: "#00b89c", color: "#fff", borderRadius: 6,
                  padding: "4px 8px", fontSize: 12, fontWeight: 700,
                }}>
                  {course.name.replace(/[^0-9A-Z]/g, "").slice(0, 2)}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b7280", marginBottom: 6 }}>
                  <span>Promedio General</span>
                  <span>{course.average}%</span>
                </div>
                <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3 }}>
                  <div style={{ height: 6, borderRadius: 3, background: "#00b89c", width: `${course.average}%` }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actividad Reciente */}
      <section>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827" }}>Actividad Reciente</h2>
          <button style={{ fontSize: 13, color: "#00b89c", background: "none", border: "none", cursor: "pointer" }}>
            Ver todas
          </button>
        </div>
        <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["ALUMNO", "ACTIVIDAD", "FECHA", "ESTADO"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent_activity.map((row, i) => (
                <tr key={i} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "#e5e7eb", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#374151",
                      }}>
                        {row.initials}
                      </div>
                      <span style={{ fontSize: 14, color: "#111827" }}>{row.student_name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 14, color: "#374151" }}>{row.activity}</td>
                  <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>{row.date}</td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      ...STATUS_STYLE[row.status],
                      padding: "4px 10px", borderRadius: 20,
                      fontSize: 11, fontWeight: 600,
                    }}>
                      {row.status.replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

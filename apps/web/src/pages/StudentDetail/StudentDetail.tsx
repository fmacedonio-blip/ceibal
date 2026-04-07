import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getStudent } from "../../api/students";
import type { ActivityDetailStatus, StudentDetail as StudentDetailType } from "../../types/api";

const STATUS_STYLE: Record<ActivityDetailStatus, { bg: string; color: string }> = {
  CORREGIDA: { bg: "#dcfce7", color: "#166534" },
  NO_ENTREGADO: { bg: "#fee2e2", color: "#991b1b" },
  PENDIENTE_DE_REVISION: { bg: "#fef3c7", color: "#92400e" },
};

export function StudentDetail() {
  const { studentId } = useParams<{ studentId: string }>();
  const [student, setStudent] = useState<StudentDetailType | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    getStudent(studentId).then(setStudent).catch(() => setError(true));
  }, [studentId]);

  if (error) return <p style={{ color: "#dc2626" }}>Alumno no encontrado.</p>;
  if (!student) return <p style={{ color: "#6b7280" }}>Cargando...</p>;

  const avgColor = student.average >= 8 ? "#00b89c" : student.average >= 6 ? "#f59e0b" : "#dc2626";

  return (
    <div>
      {/* Breadcrumb */}
      <nav style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>
        <Link to="/courses" style={{ color: "#6b7280", textDecoration: "none" }}>Mis Cursos</Link>
        {" > "}
        <Link to={`/courses/${student.course.id}/students`} style={{ color: "#6b7280", textDecoration: "none" }}>
          {student.course.name} - {student.course.shift}
        </Link>
        {" > "}
        <span style={{ color: "#111827", fontWeight: 600 }}>{student.name}</span>
      </nav>

      {/* Header */}
      <div style={{
        background: "#fff", borderRadius: 12, padding: "24px 28px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", background: "#e5e7eb",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 20, color: "#6b7280",
          }}>
            {student.name[0]}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827" }}>{student.name}</h1>
            <p style={{ fontSize: 14, color: "#6b7280" }}>{student.course.name} — {student.course.shift}</p>
          </div>
        </div>
        <button style={{
          background: "#fff", border: "1px solid #d1d5db",
          borderRadius: 8, padding: "9px 16px", fontSize: 14, cursor: "pointer", color: "#374151",
        }}>
          ✉ Contactar familia
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {[
          { label: "PROMEDIO GENERAL", value: student.average, suffix: "/10", color: avgColor },
          { label: "TAREAS RESUELTAS", value: student.tasks_completed, suffix: `/10`, color: "#00b89c" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "#fff", borderRadius: 12, padding: "24px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em", marginBottom: 8 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#111827", marginBottom: 12 }}>
              {stat.value}
              <span style={{ fontSize: 16, color: "#6b7280" }}>{stat.suffix}</span>
            </div>
            <div style={{ height: 6, background: "#e5e7eb", borderRadius: 3 }}>
              <div style={{ height: 6, borderRadius: 3, background: stat.color, width: `${(stat.value / 10) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Diagnóstico IA */}
      <div style={{
        background: "#faf5ff", borderRadius: 12, padding: "24px 28px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 20,
      }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ fontSize: 22 }}>✦</span>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
              Diagnóstico IA del Alumno
            </h3>
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.6, marginBottom: 12 }}>
              {student.ai_diagnosis.text}
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {student.ai_diagnosis.tags.map((tag) => (
                <span key={tag} style={{
                  background: "#fff", border: "1px solid #e5e7eb",
                  borderRadius: 20, padding: "4px 12px",
                  fontSize: 12, color: "#374151",
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Historial de Actividades */}
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", padding: "20px 24px", borderBottom: "1px solid #f3f4f6" }}>
          Historial de Actividades
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["ACTIVIDAD", "FECHA", "NOTA", "ESTADO", "ACCIONES"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {student.activity_history.map((activity) => (
              <tr key={activity.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: "14px 16px", fontSize: 14, color: "#111827" }}>{activity.name}</td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280" }}>{activity.date}</td>
                <td style={{ padding: "14px 16px", fontSize: 14, fontWeight: 600, color: activity.score ? "#111827" : "#9ca3af" }}>
                  {activity.score != null ? activity.score.toFixed(1) : "—"}
                </td>
                <td style={{ padding: "14px 16px" }}>
                  <span style={{
                    ...STATUS_STYLE[activity.status],
                    padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  }}>
                    {activity.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td style={{ padding: "14px 16px" }}>
                  {activity.status !== "NO_ENTREGADO" && (
                    <button style={{ color: "#00b89c", background: "none", border: "none", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                      Ver detalle
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

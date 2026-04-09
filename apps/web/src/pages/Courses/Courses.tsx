import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCourses } from "../../api/courses";
import { Spinner } from "../../components/Spinner/Spinner";
import type { Course } from "../../types/api";

const BADGE_COLORS = ["#00b89c", "#6366f1", "#f59e0b", "#10b981", "#f97316", "#ec4899"];

export function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCourses().then(setCourses).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Mis Cursos</h1>
          <p style={{ fontSize: 14, color: "#6b7280" }}>
            Administrá tus clases, realizá un seguimiento del progreso de tus estudiantes y accedé a tus reportes de desempeño detallado por curso.
          </p>
        </div>
        <button style={{
          background: "#00b89c", color: "#fff", border: "none",
          borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}>
          + Agregar nuevo curso
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginTop: 32 }}>
        {courses.map((course, i) => (
          <div key={course.id} style={{
            background: "#fff", borderRadius: 12, padding: "24px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#111827" }}>{course.name} — {course.shift}</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{course.student_count} alumnos inscriptos</div>
              </div>
              <div style={{
                background: BADGE_COLORS[i % BADGE_COLORS.length],
                color: "#fff", borderRadius: 6,
                padding: "4px 8px", fontSize: 12, fontWeight: 700,
              }}>
                {course.name.replace(/[^0-9A-Z]/g, "").slice(0, 2)}
              </div>
            </div>

            <button
              onClick={() => navigate(`/courses/${course.id}`)}
              style={{
                width: "100%", padding: "10px", borderRadius: 8,
                background: "#00b89c", color: "#fff",
                border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              Ver curso
            </button>
          </div>
        ))}
      </div>

      {/* Resumen IA */}
      <div style={{
        marginTop: 32, background: "#f8f5ff", borderRadius: 12,
        padding: "24px 32px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{ fontSize: 28 }}>✦</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#111827", marginBottom: 4 }}>Resumen IA</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>
              Obtené insights automáticos sobre el desempeño general de tus cursos y recomendaciones personalizadas para mejorar el aprendizaje.
            </div>
          </div>
        </div>
        <button style={{
          background: "#fff", border: "1px solid #d1d5db",
          borderRadius: 8, padding: "10px 18px", fontSize: 14, cursor: "pointer", whiteSpace: "nowrap",
        }}>
          Ver reporte comparativo
        </button>
      </div>
    </div>
  );
}

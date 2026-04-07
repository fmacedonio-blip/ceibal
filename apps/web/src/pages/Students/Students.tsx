import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCourseStudents } from "../../api/courses";
import type { StudentFilter, StudentListItem } from "../../types/api";

const FILTERS: { label: string; value: StudentFilter }[] = [
  { label: "Todos", value: "todos" },
  { label: "Pendientes", value: "pendientes" },
  { label: "Al día", value: "al_dia" },
];

function AverageBar({ value }: { value: number }) {
  const color = value >= 8 ? "#00b89c" : value >= 6 ? "#f59e0b" : "#dc2626";
  return (
    <div>
      <span style={{ fontSize: 13, color: "#111827", marginRight: 8 }}>{value.toFixed(1)}/10</span>
      <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2, width: 80, display: "inline-block", verticalAlign: "middle" }}>
        <div style={{ height: 4, borderRadius: 2, background: color, width: `${(value / 10) * 100}%` }} />
      </div>
    </div>
  );
}

export function Students() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<StudentFilter>("todos");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ students: StudentListItem[]; total: number } | null>(null);
  const limit = 6;

  useEffect(() => {
    if (!courseId) return;
    getCourseStudents(courseId, { filter, search, page, limit }).then(setData);
  }, [courseId, filter, search, page]);

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Lista de Alumnos</h1>
          <p style={{ fontSize: 14, color: "#6b7280" }}>
            {courseId ? `Curso ${courseId.toUpperCase()} — Turno Matutino` : ""}
          </p>
        </div>
        <button style={{
          background: "#00b89c", color: "#fff", border: "none",
          borderRadius: 8, padding: "10px 18px", fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}>
          + Agregar alumno
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setFilter(f.value); setPage(1); }}
              style={{
                padding: "8px 18px", borderRadius: 8,
                background: filter === f.value ? "#00b89c" : "#f3f4f6",
                color: filter === f.value ? "#fff" : "#374151",
                border: "none", fontWeight: filter === f.value ? 600 : 400,
                fontSize: 14, cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Buscar alumno..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{
            padding: "9px 14px", borderRadius: 8, border: "1px solid #d1d5db",
            fontSize: 14, width: 220, color: "#374151",
          }}
        />
      </div>

      {/* Tabla */}
      <div style={{ background: "#fff", borderRadius: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["NOMBRE DEL ALUMNO", "PROMEDIO", "TAREAS RESUELTAS", "ÚLTIMA ACTIVIDAD", "ACCIONES"].map((h) => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.students ?? []).map((student) => (
              <tr key={student.id} style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: "14px 16px", fontSize: 14, color: "#111827", fontWeight: 500 }}>{student.name}</td>
                <td style={{ padding: "14px 16px" }}><AverageBar value={student.average} /></td>
                <td style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 13, color: "#111827", marginBottom: 4 }}>{student.tasks_completed}/{student.tasks_total}</div>
                  <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2, width: 80 }}>
                    <div style={{ height: 4, borderRadius: 2, background: "#00b89c", width: `${(student.tasks_completed / student.tasks_total) * 100}%` }} />
                  </div>
                </td>
                <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b7280" }}>{student.last_activity}</td>
                <td style={{ padding: "14px 16px" }}>
                  <button onClick={() => navigate(`/students/${student.id}`)} style={{
                    color: "#00b89c", background: "none", border: "none",
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}>
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <span style={{ fontSize: 13, color: "#6b7280" }}>
          Mostrando {((page - 1) * limit) + 1}–{Math.min(page * limit, data?.total ?? 0)} de {data?.total ?? 0} alumnos
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={paginationBtn(page === 1)}>Anterior</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} style={paginationBtn(false, p === page)}>{p}</button>
          ))}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={paginationBtn(page === totalPages)}>Siguiente</button>
        </div>
      </div>
    </div>
  );
}

function paginationBtn(disabled: boolean, active = false): React.CSSProperties {
  return {
    padding: "6px 12px", borderRadius: 6,
    background: active ? "#00b89c" : "#fff",
    color: active ? "#fff" : disabled ? "#d1d5db" : "#374151",
    border: "1px solid #e5e7eb", fontSize: 13, cursor: disabled ? "not-allowed" : "pointer",
  };
}

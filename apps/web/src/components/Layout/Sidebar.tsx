import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth";

const NAV_ITEMS = [
  { label: "Inicio", to: "/dashboard", icon: "⊞" },
  { label: "Mis Cursos", to: "/courses", icon: "📚" },
  { label: "Reportes", to: "/reports", icon: "📊" },
  { label: "Configuración", to: "/settings", icon: "⚙️" },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside style={{
      width: 200,
      minHeight: "100vh",
      background: "#fff",
      borderRight: "1px solid #e5e7eb",
      display: "flex",
      flexDirection: "column",
      padding: "24px 0",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "0 20px 32px" }}>
        <span style={{ fontWeight: 700, fontSize: 18, color: "#00b89c" }}>● Ceibal</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px",
              color: isActive ? "#00b89c" : "#374151",
              background: isActive ? "#f0fdf9" : "transparent",
              textDecoration: "none",
              fontWeight: isActive ? 600 : 400,
              fontSize: 14,
              borderRadius: "0 8px 8px 0",
              marginRight: 12,
            })}
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "#e5e7eb", display: "flex",
            alignItems: "center", justifyContent: "center",
            fontSize: 14, color: "#6b7280",
          }}>
            {user?.name?.[0] ?? "U"}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
              {user?.name ?? "Usuario"}
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", textTransform: "capitalize" }}>
              {user?.role ?? ""}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            fontSize: 12, color: "#6b7280", background: "none",
            border: "none", cursor: "pointer", padding: 0,
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

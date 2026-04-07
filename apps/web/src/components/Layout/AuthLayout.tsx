import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AuthLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f9fafb" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "32px 40px", overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}

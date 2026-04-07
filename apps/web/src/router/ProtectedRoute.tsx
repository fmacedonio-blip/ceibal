import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/auth";

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const { isTokenValid, logout } = useAuthStore();
  const location = useLocation();

  if (!isTokenValid()) {
    logout();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

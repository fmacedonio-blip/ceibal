import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthLayout } from "./components/Layout/AuthLayout";
import { ProtectedRoute } from "./router/ProtectedRoute";
import { Login } from "./pages/Login/Login";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { Courses } from "./pages/Courses/Courses";
import { Students } from "./pages/Students/Students";
import { StudentDetail } from "./pages/StudentDetail/StudentDetail";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <AuthLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId/students" element={<Students />} />
          <Route path="/students/:studentId" element={<StudentDetail />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

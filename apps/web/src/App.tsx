import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from './components/Layout/AuthLayout';
import { AlumnoLayout } from './components/Layout/AlumnoLayout';
import { ProtectedRoute } from './router/ProtectedRoute';
import { Login } from './pages/Login/Login';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { Courses } from './pages/Courses/Courses';
import { Students } from './pages/Students/Students';
import { StudentDetail } from './pages/StudentDetail/StudentDetail';
import { ActivityDetail } from './pages/ActivityDetail/ActivityDetail';
import { Inicio } from './pages/alumno/Inicio/Inicio';
import { MisTareas } from './pages/alumno/MisTareas/MisTareas';
import { TareaEscritura } from './pages/alumno/TareaEscritura/TareaEscritura';
import { TareaLectura } from './pages/alumno/TareaLectura/TareaLectura';
import { CorreccionEscritura } from './pages/alumno/CorreccionEscritura/CorreccionEscritura';
import { CorreccionLectura } from './pages/alumno/CorreccionLectura/CorreccionLectura';
import { ChatCopiloto } from './pages/alumno/ChatCopiloto/ChatCopiloto';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Docente routes */}
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
          <Route path="/students/:studentId/activities/:activityId" element={<ActivityDetail />} />
        </Route>

        {/* Alumno routes */}
        <Route
          element={
            <ProtectedRoute>
              <AlumnoLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/alumno/inicio" element={<Inicio />} />
          <Route path="/alumno/tareas" element={<MisTareas />} />
          <Route path="/alumno/tarea/:taskId/escritura" element={<TareaEscritura />} />
          <Route path="/alumno/tarea/:taskId/lectura" element={<TareaLectura />} />
          <Route path="/alumno/tarea/:taskId/correccion-escritura" element={<CorreccionEscritura />} />
          <Route path="/alumno/tarea/:taskId/correccion-lectura" element={<CorreccionLectura />} />
          <Route path="/alumno/chat/:submissionId" element={<ChatCopiloto />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

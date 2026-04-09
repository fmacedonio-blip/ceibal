export type UserRole = "docente" | "alumno" | "director" | "inspector";

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  student_uuid?: string;
  student_id?: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

// Dashboard
export type AlertSeverity = "high" | "medium" | "low";
export type AlertType = "difficulty" | "pending" | "suggestion";
export type ActivityStatus = "COMPLETADA" | "PENDIENTE_DE_REVISION" | "REVISADA";

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
}

export interface CourseSummary {
  id: string;
  name: string;
  shift: string;
  student_count: number;
  average: number;
}

export interface RecentActivity {
  student_name: string;
  initials: string;
  activity: string;
  date: string;
  status: ActivityStatus;
}

export interface DashboardResponse {
  alerts: Alert[];
  courses: CourseSummary[];
  recent_activity: RecentActivity[];
}

// Courses
export interface Course {
  id: string;
  name: string;
  shift: string;
  student_count: number;
  pending_corrections: number;
}

// Students list
export type StudentStatus = "al_dia" | "pendiente";
export type StudentFilter = "todos" | "pendientes" | "al_dia";

export interface StudentListItem {
  id: string;
  name: string;
  average: number;
  tasks_completed: number;
  tasks_total: number;
  last_activity: string;
  status: StudentStatus;
}

export interface StudentsResponse {
  students: StudentListItem[];
  total: number;
  page: number;
  limit: number;
}

// Student detail
export type ActivityDetailStatus = "NO_ENTREGADO" | "COMPLETADA";

export interface AiDiagnosis {
  text: string;
  tags: string[];
}

export interface ActivityHistory {
  id: string;
  name: string;
  date: string;
  score: number | null;
  status: ActivityDetailStatus;
  submission_id: string | null;
}

export interface StudentDetail {
  id: string;
  name: string;
  course: { id: string; name: string; shift: string };
  average: number;
  tasks_completed: number;
  tasks_total: number;
  ai_diagnosis: AiDiagnosis;
  activity_history: ActivityHistory[];
}

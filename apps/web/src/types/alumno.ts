export interface AlumnoProfile {
  id: number;
  student_uuid: string;
  name: string;
  course: {
    id: number;
    course_uuid: string;
    name: string;
    shift: string;
  } | null;
}

export type TaskType = 'escritura' | 'lectura';
export type TaskStatus = 'NO_ENTREGADO' | 'COMPLETADA' | 'CORREGIDA' | 'PENDIENTE_DE_REVISION' | 'REVISADA';

export interface Task {
  id: number;
  name: string;
  description: string | null;
  reading_text: string | null;
  type: TaskType;
  subject: string;
  date: string;
  score: number | null;
  status: TaskStatus;
  submission_id: string | null;
}

// Writing correction
export interface CorrectionErrorAlumno {
  texto: string;
  correccion: string;
  explicacion: string;
}

export interface WritingCorrectionAlumno {
  feedback: string;
  aspectos_positivos: string[];
  transcripcion_html: string;
  errores: CorrectionErrorAlumno[];
  sugerencias_socraticas: string[];
  consejos: string[];
}

export interface WritingCorrectionDocente {
  razonamiento: string;
  errores: Array<{
    texto: string;
    tipo: string;
    explicacion_tecnica: string;
    ocurrencias: number;
    confianza: number | null;
  }>;
  puntos_de_mejora: Array<Record<string, unknown>>;
  requires_review: boolean;
}

export interface WritingCorrectionResponse {
  submission_id: string;
  submission_type: 'handwrite';
  status: string;
  alumno: WritingCorrectionAlumno;
  docente: WritingCorrectionDocente;
}

// Audio correction
export interface AudioCorrectionErrorAlumno {
  palabra_original: string;
  lo_que_leyo: string | null;
  tipo: string;
  explicacion: string;
}

export interface AudioCorrectionAlumno {
  feedback: string;
  errores: AudioCorrectionErrorAlumno[];
  consejos: string[];
}

export interface AudioCorrectionDocente {
  feedback_tecnico: string;
  ppm: number;
  precision: number;
  nivel_orientativo: string;
  errores: Array<{
    palabra_original: string;
    lo_que_leyo: string | null;
    tipo: string;
    explicacion_tecnica: string;
    dudoso: boolean;
  }>;
  alertas_fluidez: string[];
}

export interface AudioCorrectionResponse {
  submission_id: string;
  submission_type: 'audio';
  status: string;
  alumno: AudioCorrectionAlumno;
  docente: AudioCorrectionDocente;
}

export type CorrectionResponse = WritingCorrectionResponse | AudioCorrectionResponse;

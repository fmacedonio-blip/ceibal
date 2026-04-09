"""
Seed script — populates the database with MVP fixtures.
Run with: python -m app.seed (from apps/api/)
Idempotent: skips insertion if data already exists (does NOT truncate).
"""

import uuid

from app.database import SessionLocal
from app.models import AiDiagnosis, Alert, Course, Student, User

# Fixed UUID for "4to A" — used as class_id in submissions
COURSE_4TO_A_UUID = uuid.UUID("c1d2e3f4-0001-4a5b-8c9d-0e1f2a3b4c5d")

MOCK_COURSES = [
    {"name": "4to A", "shift": "Turno Matutino", "uuid": COURSE_4TO_A_UUID},
    {"name": "3ro B", "shift": "Turno Vespertino", "uuid": None},
    {"name": "6to C", "shift": "Turno Matutino", "uuid": None},
    {"name": "5to A", "shift": "Turno Matutino", "uuid": None},
    {"name": "2do B", "shift": "Turno Vespertino", "uuid": None},
    {"name": "1ro C", "shift": "Turno Matutino", "uuid": None},
]

# Fixed UUIDs for all alumno-role students — used in dev-login JWT
ALUMNO_UUIDS = [
    uuid.UUID("f47ac10b-58cc-4372-a567-0e02b2c3d479"),  # María Suárez
    uuid.UUID("a3bb9c01-4562-48c5-9a2e-1f2b3c4d5e6f"),  # Lucas Rodríguez
    uuid.UUID("b8cc1d02-5673-59d6-ab3f-2f3c4d5e6f70"),  # Valentina Pérez
    uuid.UUID("c9dd2e03-6784-60e7-bc40-3f4d5e6f7081"),  # Sofía García
    uuid.UUID("d0ee3f14-7895-71f8-cd51-4f5e6f708192"),  # Mateo Ríos
]

# 5 students for "4to A" — no tasks, real averages
MOCK_STUDENTS = [
    {"name": "María Suárez",    "average": 8.5},
    {"name": "Lucas Rodríguez", "average": 6.2},
    {"name": "Valentina Pérez", "average": 9.3},
    {"name": "Sofía García",    "average": 5.8},
    {"name": "Mateo Ríos",      "average": 7.4},
]

MOCK_ALERTS = [
    {"type": "difficulty", "severity": "high",   "message": "3 alumnos muestran dificultades significativas en ortografía"},
    {"type": "pending",    "severity": "medium",  "message": "5 tareas sin evaluación pendientes de revisión"},
    {"type": "suggestion", "severity": "low",     "message": "Nuevo grupo recomendado según asistencias irregulares"},
]


def seed() -> None:
    db = SessionLocal()
    try:
        # Skip if already seeded — preserves data created via the UI (tasks, submissions, etc.)
        if db.query(User).filter(User.sub == "dev-docente-001").first():
            print("Seed ya aplicado, saltando.")
            return

        # Teacher user
        teacher = User(sub="dev-docente-001", name="Ana Martínez", role="docente", email="docente@ceibal.edu.uy")
        db.add(teacher)
        db.flush()

        # Courses
        courses = []
        for c in MOCK_COURSES:
            course = Course(
                course_uuid=c["uuid"] or uuid.uuid4(),
                name=c["name"],
                shift=c["shift"],
                teacher_id=teacher.id,
            )
            db.add(course)
            courses.append(course)
        db.flush()

        first_course = courses[0]

        # Students — all 5 with fixed UUIDs, no tasks
        students = []
        for i, s in enumerate(MOCK_STUDENTS):
            student = Student(
                student_uuid=ALUMNO_UUIDS[i],
                name=s["name"],
                course_id=first_course.id,
                average=s["average"],
                tasks_completed=0,
                tasks_total=0,
                last_activity=None,
                status="al_dia",
            )
            db.add(student)
            students.append(student)
        db.flush()

        # AI diagnoses for all students
        DIAGNOSES = [
            {
                "text": (
                    "María presenta un desempeño destacado en producción escrita, mostrando creatividad "
                    "y buena estructura en sus textos. Se recomienda reforzar la comprensión lectora en "
                    "textos más complejos y trabajar en la ortografía de palabras con tildes."
                ),
                "tags": ["Creatividad Alta", "Buena Estructura", "Mejorar Ortografía"],
            },
            {
                "text": "Lucas muestra buen ritmo de lectura pero presenta dificultades en la comprensión de textos argumentativos. Se recomienda trabajo con textos cortos y preguntas guiadas.",
                "tags": ["Fluidez Lectora", "Mejorar Comprensión"],
            },
            {
                "text": "Valentina demuestra un nivel sobresaliente en todas las áreas evaluadas. Su producción escrita es clara, creativa y bien estructurada.",
                "tags": ["Nivel Sobresaliente", "Escritura Creativa", "Líder de Grupo"],
            },
            {
                "text": "Sofía está en proceso de consolidar las habilidades básicas de lectoescritura. Requiere acompañamiento personalizado y actividades de refuerzo.",
                "tags": ["Necesita Refuerzo", "En Proceso", "Acompañamiento Personalizado"],
            },
            {
                "text": "Mateo muestra avances progresivos. Tiene buen desempeño oral pero necesita mejorar la producción escrita, especialmente en coherencia y puntuación.",
                "tags": ["Buen Desempeño Oral", "Mejorar Escritura", "Trabajo en Progreso"],
            },
        ]

        for student, diagnosis in zip(students, DIAGNOSES):
            db.add(AiDiagnosis(
                student_id=student.id,
                text=diagnosis["text"],
                tags=diagnosis["tags"],
            ))

        # Alerts
        for al in MOCK_ALERTS:
            db.add(Alert(teacher_id=teacher.id, type=al["type"], severity=al["severity"], message=al["message"]))

        db.commit()

        print("Seed completado.")
        print(f"  users:        1 (docente)")
        print(f"  courses:      {len(courses)}")
        print(f"  students:     {len(students)} (todos con UUID fijo para login alumno)")
        print(f"  activities:   0 (sin tareas — el docente las crea desde la UI)")
        print(f"  ai_diagnoses: {len(students)}")
        print(f"  alerts:       {len(MOCK_ALERTS)}")
        print()
        print("Alumnos con login disponible:")
        for i, s in enumerate(students):
            print(f"  student_id={i+1}  uuid={ALUMNO_UUIDS[i]}  nombre={s.name}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

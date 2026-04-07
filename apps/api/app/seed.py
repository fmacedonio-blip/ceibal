"""
Seed script — populates the database with MVP fixtures.
Run with: python -m app.seed (from apps/api/)
Idempotent: truncates all tables before inserting.
"""

from app.database import SessionLocal
from app.models import Activity, AiDiagnosis, Alert, Course, Student, User

MOCK_COURSES = [
    {"name": "4to A", "shift": "Turno Matutino"},
    {"name": "3ro B", "shift": "Turno Vespertino"},
    {"name": "6to C", "shift": "Turno Matutino"},
    {"name": "5to A", "shift": "Turno Matutino"},
    {"name": "2do B", "shift": "Turno Vespertino"},
    {"name": "1ro C", "shift": "Turno Matutino"},
]

# Students for "4to A" (index 0)
MOCK_STUDENTS = [
    {"name": "María Suárez",  "average": 8.5, "tasks_completed": 7,  "tasks_total": 10, "last_activity": "Hoy, 10:45",      "status": "al_dia"},
    {"name": "Juan Pérez",    "average": 6.2, "tasks_completed": 4,  "tasks_total": 10, "last_activity": "Ayer, 16:20",     "status": "pendiente"},
    {"name": "Lucía Méndez",  "average": 9.3, "tasks_completed": 10, "tasks_total": 10, "last_activity": "12 Oct, 09:15",   "status": "al_dia"},
    {"name": "Mateo Ríos",    "average": 5.8, "tasks_completed": 3,  "tasks_total": 10, "last_activity": "08 Oct, 11:30",   "status": "pendiente"},
    {"name": "Sofía García",  "average": 7.9, "tasks_completed": 8,  "tasks_total": 10, "last_activity": "Hoy, 14:22",      "status": "al_dia"},
    {"name": "Lucas Castro",  "average": 8.1, "tasks_completed": 9,  "tasks_total": 10, "last_activity": "Ayer, 13:10",     "status": "al_dia"},
]

MOCK_ACTIVITIES_S1 = [
    {"name": "Narración: El viaje a la Luna",          "date": "Hoy, 10:45",      "score": 9.0,  "status": "CORREGIDA"},
    {"name": "Descripción: Mi animal favorito",        "date": "15 Oct, 14:30",   "score": 8.5,  "status": "CORREGIDA"},
    {"name": "Análisis de poema: Alfonsina y el mar",  "date": "13 Oct, 11:00",   "score": None, "status": "NO_ENTREGADO"},
    {"name": "Resumen de lectura: El Principito",      "date": "12 Oct, 09:15",   "score": 8.5,  "status": "CORREGIDA"},
    {"name": "Texto argumentativo: El medioambiente",  "date": "10 Oct, 10:00",   "score": 7.0,  "status": "CORREGIDA"},
]

MOCK_ALERTS = [
    {"type": "difficulty", "severity": "high",   "message": "3 alumnos muestran dificultades significativas en matemática"},
    {"type": "pending",    "severity": "medium",  "message": "5 tareas sin evaluación excede pendientes de revisión"},
    {"type": "suggestion", "severity": "low",    "message": "Nuevo grupo recomendado según asistencias irregulares"},
]


def seed() -> None:
    db = SessionLocal()
    try:
        # Truncate in FK-safe order, resetting sequences for deterministic IDs
        db.execute(__import__("sqlalchemy").text(
            "TRUNCATE activities, ai_diagnoses, alerts, students, courses, users RESTART IDENTITY CASCADE"
        ))
        db.commit()

        # Teacher user — sub matches DEV_USERS["docente"]["id"] in auth.py
        teacher = User(sub="dev-docente-001", name="Docente Demo", role="docente", email="docente@ceibal.edu.uy")
        db.add(teacher)
        db.flush()  # get teacher.id

        # Courses
        courses = []
        for c in MOCK_COURSES:
            course = Course(name=c["name"], shift=c["shift"], teacher_id=teacher.id)
            db.add(course)
            courses.append(course)
        db.flush()

        # Students in "4to A" (first course)
        first_course = courses[0]
        students = []
        for s in MOCK_STUDENTS:
            student = Student(
                name=s["name"],
                course_id=first_course.id,
                average=s["average"],
                tasks_completed=s["tasks_completed"],
                tasks_total=s["tasks_total"],
                last_activity=s["last_activity"],
                status=s["status"],
            )
            db.add(student)
            students.append(student)
        db.flush()

        # Activities and AI diagnosis for first student (María Suárez)
        maria = students[0]
        for a in MOCK_ACTIVITIES_S1:
            db.add(Activity(
                student_id=maria.id,
                name=a["name"],
                date=a["date"],
                score=a["score"],
                status=a["status"],
            ))

        db.add(AiDiagnosis(
            student_id=maria.id,
            text=(
                "María presenta un desempeño destacado en producción escrita, mostrando creatividad "
                "y buena estructura en sus textos. Se recomienda reforzar la comprensión lectora en "
                "textos más complejos y trabajar en la ortografía de palabras con tildes."
            ),
            tags=["Creatividad Alta", "Buena Estructura", "Mejorar Ortografía"],
        ))

        # Basic AI diagnosis for remaining students
        for student in students[1:]:
            db.add(AiDiagnosis(
                student_id=student.id,
                text=f"{student.name} muestra un desempeño en desarrollo. Se recomienda continuar el seguimiento personalizado.",
                tags=["En Desarrollo"],
            ))

        # Alerts
        for al in MOCK_ALERTS:
            db.add(Alert(
                teacher_id=teacher.id,
                type=al["type"],
                severity=al["severity"],
                message=al["message"],
            ))

        db.commit()
        print("Seed completado.")
        print(f"  users:        1")
        print(f"  courses:      {len(courses)}")
        print(f"  students:     {len(students)}")
        print(f"  activities:   {len(MOCK_ACTIVITIES_S1)}")
        print(f"  ai_diagnoses: {len(students)}")
        print(f"  alerts:       {len(MOCK_ALERTS)}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

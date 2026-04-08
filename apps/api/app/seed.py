"""
Seed script — populates the database with MVP fixtures.
Run with: python -m app.seed (from apps/api/)
Idempotent: truncates all tables before inserting.
"""

import uuid

from app.database import SessionLocal
from app.models import Activity, AiDiagnosis, Alert, Course, Student, User

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

# Fixed UUIDs for the 3 alumno-role students — used in dev-login JWT
ALUMNO_UUIDS = [
    uuid.UUID("f47ac10b-58cc-4372-a567-0e02b2c3d479"),  # María Suárez
    uuid.UUID("a3bb9c01-4562-48c5-9a2e-1f2b3c4d5e6f"),  # Lucas Rodríguez
    uuid.UUID("b8cc1d02-5673-59d6-ab3f-2f3c4d5e6f70"),  # Valentina Pérez
]

# Students for "4to A" (index 0) — first 3 are the alumno-role students
MOCK_STUDENTS = [
    {"name": "María Suárez",    "average": 8.5, "tasks_completed": 7,  "tasks_total": 10, "last_activity": "Hoy, 10:45",    "status": "al_dia"},
    {"name": "Lucas Rodríguez", "average": 6.2, "tasks_completed": 4,  "tasks_total": 10, "last_activity": "Ayer, 16:20",   "status": "pendiente"},
    {"name": "Valentina Pérez", "average": 9.3, "tasks_completed": 10, "tasks_total": 10, "last_activity": "12 Oct, 09:15", "status": "al_dia"},
    {"name": "Mateo Ríos",      "average": 5.8, "tasks_completed": 3,  "tasks_total": 10, "last_activity": "08 Oct, 11:30", "status": "pendiente"},
    {"name": "Sofía García",    "average": 7.9, "tasks_completed": 8,  "tasks_total": 10, "last_activity": "Hoy, 14:22",    "status": "al_dia"},
    {"name": "Juan Castro",     "average": 8.1, "tasks_completed": 9,  "tasks_total": 10, "last_activity": "Ayer, 13:10",   "status": "al_dia"},
]

# Docente-side activities for María (for the docente view — existing data)
MOCK_ACTIVITIES_S1 = [
    {"name": "Narración: El viaje a la Luna",         "date": "Hoy, 10:45",    "score": 9.0,  "status": "CORREGIDA"},
    {"name": "Descripción: Mi animal favorito",       "date": "15 Oct, 14:30", "score": 8.5,  "status": "CORREGIDA"},
    {"name": "Análisis de poema: Alfonsina y el mar", "date": "13 Oct, 11:00", "score": None, "status": "NO_ENTREGADO"},
    {"name": "Resumen de lectura: El Principito",     "date": "12 Oct, 09:15", "score": 8.5,  "status": "CORREGIDA"},
    {"name": "Texto argumentativo: El medioambiente", "date": "10 Oct, 10:00", "score": 7.0,  "status": "CORREGIDA"},
]

# Alumno tasks — pending tasks for each alumno-role student
ALUMNO_TASKS = [
    {
        "name": "Dictado: El río y el mar",
        "description": (
            "Escuchá atentamente y escribí el texto que te va a dictar el sistema. "
            "Prestá atención a las mayúsculas al inicio de cada oración y a los signos de puntuación."
        ),
        "type": "escritura",
        "subject": "Lengua",
        "date": "Hoy",
        "score": None,
        "status": "NO_ENTREGADO",
    },
    {
        "name": "Lectura en voz alta: La tortuga y la liebre",
        "description": (
            "Leé el siguiente texto en voz alta lo más claro que puedas. "
            "Tomá tu tiempo, no te apures. El sistema va a escucharte y darte una devolución."
        ),
        "reading_text": (
            "Había una vez una tortuga y una liebre que vivían en el mismo bosque. "
            "Un día, la liebre se burló de la tortuga porque caminaba muy despacio. "
            "La tortuga, sin enojarse, la desafió a una carrera. "
            "La liebre aceptó riendo y salió corriendo muy rápido. "
            "Como pensaba que iba a ganar fácil, se recostó a descansar bajo un árbol. "
            "La tortuga siguió caminando sin parar, paso a paso, y llegó primero a la meta."
        ),
        "type": "lectura",
        "subject": "Lengua",
        "date": "Hoy",
        "score": None,
        "status": "NO_ENTREGADO",
    },
]

MOCK_ALERTS = [
    {"type": "difficulty", "severity": "high",   "message": "3 alumnos muestran dificultades significativas en ortografía"},
    {"type": "pending",    "severity": "medium",  "message": "5 tareas sin evaluación pendientes de revisión"},
    {"type": "suggestion", "severity": "low",     "message": "Nuevo grupo recomendado según asistencias irregulares"},
]


def seed() -> None:
    db = SessionLocal()
    try:
        # Truncate in FK-safe order, resetting sequences for deterministic IDs
        db.execute(__import__("sqlalchemy").text(
            "TRUNCATE activities, ai_diagnoses, alerts, students, courses, users RESTART IDENTITY CASCADE"
        ))
        db.commit()

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

        # Students — first 3 get fixed UUIDs for alumno-role login
        students = []
        for i, s in enumerate(MOCK_STUDENTS):
            student_uuid = ALUMNO_UUIDS[i] if i < len(ALUMNO_UUIDS) else uuid.uuid4()
            student = Student(
                student_uuid=student_uuid,
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

        maria, lucas, valentina = students[0], students[1], students[2]

        # Docente-side activities for María
        for a in MOCK_ACTIVITIES_S1:
            db.add(Activity(
                student_id=maria.id,
                name=a["name"],
                date=a["date"],
                score=a["score"],
                status=a["status"],
                subject="Lengua",
            ))

        # Alumno tasks for each of the 3 alumno students
        for alumno in [maria, lucas, valentina]:
            for task in ALUMNO_TASKS:
                db.add(Activity(
                    student_id=alumno.id,
                    name=task["name"],
                    description=task["description"],
                    reading_text=task.get("reading_text"),
                    type=task["type"],
                    subject=task["subject"],
                    date=task["date"],
                    score=task["score"],
                    status=task["status"],
                ))

        # AI diagnoses
        db.add(AiDiagnosis(
            student_id=maria.id,
            text=(
                "María presenta un desempeño destacado en producción escrita, mostrando creatividad "
                "y buena estructura en sus textos. Se recomienda reforzar la comprensión lectora en "
                "textos más complejos y trabajar en la ortografía de palabras con tildes."
            ),
            tags=["Creatividad Alta", "Buena Estructura", "Mejorar Ortografía"],
        ))
        for student in students[1:]:
            db.add(AiDiagnosis(
                student_id=student.id,
                text=f"{student.name} muestra un desempeño en desarrollo. Se recomienda continuar el seguimiento personalizado.",
                tags=["En Desarrollo"],
            ))

        # Alerts
        for al in MOCK_ALERTS:
            db.add(Alert(teacher_id=teacher.id, type=al["type"], severity=al["severity"], message=al["message"]))

        db.commit()

        alumno_count = len(ALUMNO_TASKS) * 3
        docente_count = len(MOCK_ACTIVITIES_S1)
        print("Seed completado.")
        print(f"  users:        1 (docente)")
        print(f"  courses:      {len(courses)}")
        print(f"  students:     {len(students)} (3 con UUID fijo para login alumno)")
        print(f"  activities:   {docente_count} (docente) + {alumno_count} (alumno tasks)")
        print(f"  ai_diagnoses: {len(students)}")
        print(f"  alerts:       {len(MOCK_ALERTS)}")
        print()
        print("Alumnos con login disponible:")
        for i, s in enumerate(students[:3]):
            print(f"  student_id={i+1}  uuid={ALUMNO_UUIDS[i]}  nombre={s.name}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

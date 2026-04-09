"""
Seed script — populate the DB with 2 docentes and 5 alumnos.

IMPORTANT: The emails here must match exactly the emails of the Cognito users
you create in the AWS Console.

Usage (with the venv active):
    python seed.py

Or from the project root:
    cd apps/api && python seed.py
"""

import sys
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config import settings
from app.models import Base, Course, Student, User

engine = create_engine(settings.database_url)
Session = sessionmaker(bind=engine)

# ─── Edit these to match your Cognito users ──────────────────────────────────

DOCENTES = [
    {"name": "Gabriela Suárez", "email": "gabriela.suarez@ceibal.edu.uy", "role": "docente"},
]

COURSES = [
    {"name": "3ro A", "shift": "Turno Matutino",  "teacher_email": "gabriela.suarez@ceibal.edu.uy"},
    {"name": "6to A", "shift": "Turno Matutino",  "teacher_email": "gabriela.suarez@ceibal.edu.uy"},
]

# Alumnos: email must match Cognito users assigned to the "alumno" group
ALUMNOS = [
    # 3ro A
    {"name": "Sofía Martínez",    "email": "sofia.martinez@ceibal.edu.uy",    "course_name": "3ro A"},
    {"name": "Lucas Rodríguez",   "email": "lucas.rodriguez@ceibal.edu.uy",   "course_name": "3ro A"},
    {"name": "Valentina García",  "email": "valentina.garcia@ceibal.edu.uy",  "course_name": "3ro A"},
    {"name": "Mateo López",       "email": "mateo.lopez@ceibal.edu.uy",       "course_name": "3ro A"},
    {"name": "Emma Fernández",    "email": "emma.fernandez@ceibal.edu.uy",    "course_name": "3ro A"},
    # 6to A
    {"name": "Camila Pérez",      "email": "camila.perez@ceibal.edu.uy",      "course_name": "6to A"},
    {"name": "Nicolás Díaz",      "email": "nicolas.diaz@ceibal.edu.uy",      "course_name": "6to A"},
    {"name": "Florencia Romero",  "email": "florencia.romero@ceibal.edu.uy",  "course_name": "6to A"},
    {"name": "Tomás Álvarez",     "email": "tomas.alvarez@ceibal.edu.uy",     "course_name": "6to A"},
    {"name": "Isabella Torres",   "email": "isabella.torres@ceibal.edu.uy",   "course_name": "6to A"},
]

# ─────────────────────────────────────────────────────────────────────────────


def seed():
    db = Session()
    try:
        # Skip if already seeded — preserves data created via the app
        if db.query(User).first():
            print("Seed ya aplicado, saltando.")
            return

        # Create docentes
        users_by_email: dict[str, User] = {}
        for d in DOCENTES:
            user = User(name=d["name"], email=d["email"], role=d["role"], sub=None)
            db.add(user)
            db.flush()
            users_by_email[d["email"]] = user

        # Create courses
        courses_by_name: dict[str, Course] = {}
        for c in COURSES:
            teacher = users_by_email[c["teacher_email"]]
            course = Course(name=c["name"], shift=c["shift"], teacher_id=teacher.id)
            db.add(course)
            db.flush()
            courses_by_name[c["name"]] = course

        # Create alumnos
        for a in ALUMNOS:
            course = courses_by_name[a["course_name"]]
            student = Student(
                name=a["name"],
                email=a["email"],
                course_id=course.id,
                average=0.0,
                tasks_completed=0,
                tasks_total=0,
                status="al_dia",
            )
            db.add(student)

        db.commit()
        print(f"Seed completado: {len(DOCENTES)} docentes, {len(COURSES)} cursos, {len(ALUMNOS)} alumnos.")
    except Exception as e:
        db.rollback()
        print(f"Error en seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

"""
Mock data fixtures — datos basados en los diseños de Figma.
Reemplazar imports de este módulo por queries a Postgres cuando se implemente la lógica real.
"""

ALERTS = [
    {
        "id": "alert-1",
        "type": "difficulty",
        "severity": "high",
        "message": "3 alumnos muestran dificultades significativas en matemática",
    },
    {
        "id": "alert-2",
        "type": "pending",
        "severity": "medium",
        "message": "5 tareas sin evaluación excede pendientes de revisión",
    },
    {
        "id": "alert-3",
        "type": "suggestion",
        "severity": "low",
        "message": "Nuevo grupo recomendado según asistencias irregulares",
    },
]

RECENT_ACTIVITY = [
    {
        "student_name": "Mateo Rodriguez",
        "initials": "MR",
        "activity": "Lectura del cuento",
        "date": "HOY 11:23",
        "status": "COMPLETADA",
    },
    {
        "student_name": "Sofía García",
        "initials": "SG",
        "activity": "Evaluación Matemática",
        "date": "HOY 10:45",
        "status": "PENDIENTE_DE_REVISION",
    },
    {
        "student_name": "Lucas Castro",
        "initials": "LC",
        "activity": "Ensayo histórico",
        "date": "AYER 17:15",
        "status": "REVISADA",
    },
]

COURSES = [
    {"id": "c1", "name": "4to A", "shift": "Turno Matutino", "student_count": 27, "pending_corrections": 5, "average": 72},
    {"id": "c2", "name": "3ro B", "shift": "Turno Vespertino", "student_count": 24, "pending_corrections": 0, "average": 68},
    {"id": "c3", "name": "6to C", "shift": "Turno Matutino", "student_count": 29, "pending_corrections": 12, "average": 74},
    {"id": "c4", "name": "5to A", "shift": "Turno Matutino", "student_count": 26, "pending_corrections": 3, "average": 70},
    {"id": "c5", "name": "2do B", "shift": "Turno Vespertino", "student_count": 22, "pending_corrections": 8, "average": 65},
    {"id": "c6", "name": "1ro C", "shift": "Turno Matutino", "student_count": 25, "pending_corrections": 0, "average": 71},
]

STUDENTS = {
    "c1": [
        {"id": "s1", "name": "María Suárez", "average": 8.5, "tasks_completed": 7, "tasks_total": 10, "last_activity": "Hoy, 10:45", "status": "al_dia"},
        {"id": "s2", "name": "Juan Pérez", "average": 6.2, "tasks_completed": 4, "tasks_total": 10, "last_activity": "Ayer, 16:20", "status": "pendiente"},
        {"id": "s3", "name": "Lucía Méndez", "average": 9.3, "tasks_completed": 10, "tasks_total": 10, "last_activity": "12 Oct, 09:15", "status": "al_dia"},
        {"id": "s4", "name": "Mateo Ríos", "average": 5.8, "tasks_completed": 3, "tasks_total": 10, "last_activity": "08 Oct, 11:30", "status": "pendiente"},
        {"id": "s5", "name": "Sofía García", "average": 7.9, "tasks_completed": 8, "tasks_total": 10, "last_activity": "Hoy, 14:22", "status": "al_dia"},
        {"id": "s6", "name": "Lucas Castro", "average": 8.1, "tasks_completed": 9, "tasks_total": 10, "last_activity": "Ayer, 13:10", "status": "al_dia"},
    ],
}

# Default vacío para cursos sin datos detallados
for course in COURSES:
    if course["id"] not in STUDENTS:
        STUDENTS[course["id"]] = []

STUDENT_DETAIL = {
    "s1": {
        "id": "s1",
        "name": "María Suárez",
        "course": {"id": "c1", "name": "4to A", "shift": "Turno Matutino"},
        "average": 8.5,
        "tasks_completed": 7,
        "tasks_total": 10,
        "ai_diagnosis": {
            "text": "María presenta un desempeño destacado en producción escrita, mostrando creatividad y buena estructura en sus textos. Se recomienda reforzar la comprensión lectora en textos más complejos y trabajar en la ortografía de palabras con tildes.",
            "tags": ["Creatividad Alta", "Buena Estructura", "Mejorar Ortografía"],
        },
        "activity_history": [
            {"id": "a1", "name": "Narración: El viaje a la Luna", "date": "Hoy, 10:45", "score": 9.0, "status": "CORREGIDA"},
            {"id": "a2", "name": "Descripción: Mi animal favorito", "date": "15 Oct, 14:30", "score": 8.5, "status": "CORREGIDA"},
            {"id": "a3", "name": "Análisis de poema: Alfonsina y el mar", "date": "13 Oct, 11:00", "score": None, "status": "NO_ENTREGADO"},
            {"id": "a4", "name": "Resumen de lectura: El Principito", "date": "12 Oct, 09:15", "score": 8.5, "status": "CORREGIDA"},
            {"id": "a5", "name": "Texto argumentativo: El medioambiente", "date": "10 Oct, 10:00", "score": 7.0, "status": "CORREGIDA"},
        ],
    },
}

# Generar detalles básicos para los demás estudiantes
for course_students in STUDENTS.values():
    for s in course_students:
        if s["id"] not in STUDENT_DETAIL:
            STUDENT_DETAIL[s["id"]] = {
                "id": s["id"],
                "name": s["name"],
                "course": {"id": "c1", "name": "4to A", "shift": "Turno Matutino"},
                "average": s["average"],
                "tasks_completed": s["tasks_completed"],
                "tasks_total": s["tasks_total"],
                "ai_diagnosis": {
                    "text": f"{s['name']} muestra un desempeño en desarrollo. Se recomienda continuar el seguimiento personalizado.",
                    "tags": ["En Desarrollo"],
                },
                "activity_history": [],
            }

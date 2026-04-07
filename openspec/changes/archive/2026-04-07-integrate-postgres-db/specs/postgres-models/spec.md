## ADDED Requirements

### Requirement: SQLAlchemy models for all MVP entities
The system SHALL define SQLAlchemy ORM models in `apps/api/app/models.py` that map to PostgreSQL tables. The models MUST cover: `User`, `Course`, `Student`, `Activity`, `AiDiagnosis`, and `Alert`.

#### Scenario: User model exists with required fields
- **WHEN** `app.models` is imported
- **THEN** a `User` class exists with columns `id` (integer PK), `name` (string), `role` (string), `email` (string, unique), `created_at` (datetime)

#### Scenario: Course model links to a teacher (user)
- **WHEN** a `Course` record is queried
- **THEN** it exposes `id`, `name` (e.g. "4to A"), `shift` (e.g. "Turno Matutino"), `teacher_id` (FK → users.id), computed `student_count`, `pending_corrections`, `average`

#### Scenario: Student model belongs to a course
- **WHEN** a `Student` record is queried
- **THEN** it exposes `id`, `name`, `course_id` (FK → courses.id), `average` (float), `tasks_completed` (int), `tasks_total` (int), `last_activity` (string), `status` (string: "al_dia" | "pendiente")

#### Scenario: Activity model belongs to a student
- **WHEN** an `Activity` record is queried
- **THEN** it exposes `id`, `student_id` (FK → students.id), `name` (string), `date` (string), `score` (float nullable), `status` (string: COMPLETADA | PENDIENTE_DE_REVISION | REVISADA | NO_ENTREGADO | CORREGIDA)

#### Scenario: AiDiagnosis model belongs to a student
- **WHEN** an `AiDiagnosis` record is queried
- **THEN** it exposes `id`, `student_id` (FK → students.id, unique), `text` (text), `tags` (JSON array of strings)

#### Scenario: Alert model belongs to a teacher
- **WHEN** an `Alert` record is queried
- **THEN** it exposes `id`, `teacher_id` (FK → users.id), `type` (string), `severity` (string: high | medium | low), `message` (string)

### Requirement: Declarative Base is importable
The system SHALL export a single `Base = declarative_base()` from `app.models` so Alembic can discover all table metadata via `Base.metadata`.

#### Scenario: Alembic env.py imports Base successfully
- **WHEN** `alembic/env.py` does `from app.models import Base`
- **THEN** `Base.metadata.tables` contains all 6 MVP tables with no import errors

## ADDED Requirements

### Requirement: Reproducible seed script
The system SHALL have a script at `apps/api/app/seed.py` executable via `python -m app.seed` that populates the database with data equivalent to the current `mock_data.py` fixtures.

#### Scenario: Seed is idempotent
- **WHEN** `python -m app.seed` is run multiple times
- **THEN** the database ends up with the same data each time (script truncates tables before inserting)

#### Scenario: Seed inserts one teacher user
- **WHEN** the seed runs
- **THEN** one `User` record exists with `role="docente"` and `name="Docente Demo"`

#### Scenario: Seed inserts all mock courses
- **WHEN** the seed runs
- **THEN** 6 `Course` records exist matching the names and shifts in `mock_data.COURSES`

#### Scenario: Seed inserts students for course c1
- **WHEN** the seed runs
- **THEN** 6 `Student` records exist linked to the "4to A" course with the same averages and task counts as `mock_data.STUDENTS["c1"]`

#### Scenario: Seed inserts activity history for student s1
- **WHEN** the seed runs
- **THEN** 5 `Activity` records exist for the student "María Suárez" matching `mock_data.STUDENT_DETAIL["s1"]["activity_history"]`

#### Scenario: Seed inserts AI diagnosis for student s1
- **WHEN** the seed runs
- **THEN** one `AiDiagnosis` record exists for "María Suárez" with the correct text and tags

#### Scenario: Seed inserts alerts
- **WHEN** the seed runs
- **THEN** 3 `Alert` records exist matching `mock_data.ALERTS` associated with the demo teacher

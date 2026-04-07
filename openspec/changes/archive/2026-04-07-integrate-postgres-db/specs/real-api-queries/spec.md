## ADDED Requirements

### Requirement: Dashboard router queries Postgres
The system SHALL update `apps/api/app/routers/dashboard.py` to inject `db: Session = Depends(get_db)` and fetch alerts, course summaries, and recent activity from the database instead of `mock_data`.

#### Scenario: Dashboard returns real alerts
- **WHEN** `GET /api/v1/dashboard` is called with a valid JWT
- **THEN** the `alerts` array is sourced from the `alerts` table filtered by `teacher_id` matching the JWT `sub`

#### Scenario: Dashboard returns real recent activity
- **WHEN** `GET /api/v1/dashboard` is called
- **THEN** `recent_activity` contains the last 3 activities (ordered by date desc) across all students in the teacher's courses

### Requirement: Courses router queries Postgres
The system SHALL update `apps/api/app/routers/courses.py` to inject `get_db` and return courses from the `courses` table filtered by `teacher_id`.

#### Scenario: Courses endpoint returns only teacher's courses
- **WHEN** `GET /api/v1/courses` is called
- **THEN** only courses where `teacher_id` equals the JWT `sub` are returned

#### Scenario: Response shape is unchanged
- **WHEN** `GET /api/v1/courses` is called
- **THEN** each course object has keys: `id`, `name`, `shift`, `student_count`, `pending_corrections`, `average`

### Requirement: Students list router queries Postgres
The system SHALL update `apps/api/app/routers/courses.py` (students sub-route) to query students from Postgres with support for search and status filters.

#### Scenario: Students filtered by status
- **WHEN** `GET /api/v1/courses/{id}/students?status=pendiente` is called
- **THEN** only students with `status="pendiente"` in the given course are returned

#### Scenario: Students filtered by search term
- **WHEN** `GET /api/v1/courses/{id}/students?search=maria` is called
- **THEN** only students whose `name` contains "maria" (case-insensitive) are returned

### Requirement: Student detail router queries Postgres
The system SHALL update `apps/api/app/routers/students.py` to fetch a student's full detail (stats, AI diagnosis, activity history) from the database.

#### Scenario: Student detail returns 404 if not found
- **WHEN** `GET /api/v1/students/99999` is called for a non-existent ID
- **THEN** the response is HTTP 404 with a `detail` message

#### Scenario: Student detail includes AI diagnosis and activity history
- **WHEN** `GET /api/v1/students/{id}` is called for an existing student
- **THEN** the response includes `ai_diagnosis` (with `text` and `tags`) and `activity_history` array with all activities for that student

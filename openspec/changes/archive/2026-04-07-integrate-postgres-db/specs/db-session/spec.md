## ADDED Requirements

### Requirement: Database engine and session factory
The system SHALL define a SQLAlchemy engine and `SessionLocal` factory in `apps/api/app/database.py`, reading `DATABASE_URL` from `app.config.settings`.

#### Scenario: Engine connects using configured DATABASE_URL
- **WHEN** `database.py` is imported
- **THEN** `engine` is created with `create_engine(settings.database_url)` and no import error is raised

#### Scenario: SessionLocal produces usable sessions
- **WHEN** `SessionLocal()` is called
- **THEN** it returns a SQLAlchemy `Session` configured with `autocommit=False` and `autoflush=False`

### Requirement: FastAPI dependency get_db
The system SHALL expose a `get_db` generator function in `app/database.py` suitable for use with FastAPI `Depends`.

#### Scenario: get_db yields a session and closes it
- **WHEN** a FastAPI route uses `Depends(get_db)`
- **THEN** the route receives an open `Session`, and the session is closed (via `finally`) after the response is sent regardless of success or error

## ADDED Requirements

### Requirement: Alembic is initialized in apps/api
The system SHALL have an `alembic/` directory at `apps/api/alembic/` with a valid `env.py` that imports `Base` from `app.models` and reads `DATABASE_URL` from `app.config.settings`.

#### Scenario: alembic.ini points to the correct migrations folder
- **WHEN** `alembic upgrade head` is run from `apps/api/`
- **THEN** Alembic finds the migrations in `alembic/versions/` and applies them without error

#### Scenario: env.py loads target_metadata from models
- **WHEN** `alembic/env.py` is executed
- **THEN** `target_metadata = Base.metadata` is set so that `--autogenerate` can compare the schema

### Requirement: Initial migration creates all MVP tables
The system SHALL have a migration file `alembic/versions/001_initial_schema.py` that creates tables for `users`, `courses`, `students`, `activities`, `ai_diagnoses`, and `alerts`.

#### Scenario: upgrade() creates all tables
- **WHEN** `alembic upgrade head` is run on an empty database
- **THEN** all 6 tables exist in the `public` schema of the PostgreSQL database

#### Scenario: downgrade() drops all tables
- **WHEN** `alembic downgrade base` is run
- **THEN** all 6 tables are dropped and the database is left in its original empty state

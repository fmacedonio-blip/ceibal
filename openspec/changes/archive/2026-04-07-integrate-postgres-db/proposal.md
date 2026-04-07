## Why

El backend del MVP usa datos ficticios hardcodeados en `mock_data.py`. Para avanzar hacia producción, cada endpoint debe leer y escribir datos reales en la base de datos PostgreSQL que ya corre en Docker, eliminando la dependencia de fixtures estáticos.

## What Changes

- Se introducen modelos SQLAlchemy (ORM) para todas las entidades del MVP: `User`, `Course`, `Student`, `Activity`, `Alert`
- Se configura Alembic para gestionar migraciones de esquema
- Se crea una sesión de base de datos inyectable vía FastAPI `Depends`
- Los routers `dashboard`, `courses` y `students` reemplazan sus imports de `mock_data` por queries reales a Postgres
- Se añade un script de seed inicial con los mismos datos que tiene `mock_data.py` para no romper el frontend durante la transición
- `mock_data.py` queda deprecado y se elimina al final

## Capabilities

### New Capabilities

- `postgres-models`: Definición de tablas y relaciones en SQLAlchemy ORM (User, Course, Student, Activity, Alert, AiDiagnosis)
- `db-session`: Configuración de engine, SessionLocal y dependencia `get_db` para FastAPI
- `alembic-migrations`: Setup de Alembic y primera migración que crea el esquema inicial
- `db-seed`: Script de datos iniciales equivalente al contenido actual de `mock_data.py`
- `real-api-queries`: Reemplazo de imports de `mock_data` por queries SQLAlchemy en los cuatro routers del MVP

### Modified Capabilities

- `mock-api`: Los endpoints cambian su fuente de datos de fixtures estáticos a consultas reales a Postgres. La interfaz HTTP (rutas, schemas de respuesta) no cambia.

## Impact

- **Archivos modificados**: `apps/api/app/routers/dashboard.py`, `courses.py`, `students.py`; `apps/api/app/config.py`; `apps/api/app/main.py` (lifespan para verificar conexión)
- **Archivos nuevos**: `apps/api/app/models.py`, `apps/api/app/database.py`, `apps/api/app/seed.py`, `alembic/` (directorio completo)
- **Archivos eliminados**: `apps/api/app/mock_data.py` (al final de la implementación)
- **Dependencias Python nuevas**: `sqlalchemy`, `alembic`, `psycopg2-binary` (o `asyncpg` si se elige async)
- **Docker**: Postgres ya corre en `docker-compose.yml`; no se requieren cambios
- **No hay cambios en el frontend** — las respuestas JSON mantienen la misma forma

## Non-goals

- Implementar autenticación real CAS (SSO) — sigue usando `dev-login` JWT
- Agregar endpoints nuevos (alumnos, actividades CRUD completo) — solo se conectan los 4 endpoints MVP existentes
- Migrar a async SQLAlchemy o usar un ORM diferente (fase posterior si la carga lo requiere)
- Implementar Neo4j ni ningún otro store (fase posterior)
- Seguridad multi-tenant avanzada (el filtrado por docente es suficiente para el MVP)

## 1. Dependencias e instalación

- [x] 1.1 Agregar `sqlalchemy`, `alembic` y `psycopg2-binary` a `apps/api/requirements.txt` (o `pyproject.toml`) e instalar con `pip install`
- [x] 1.2 Verificar que Postgres está corriendo: `docker compose ps` y que `DATABASE_URL` en `.env` apunta a la instancia local

## 2. Modelos SQLAlchemy

- [x] 2.1 Crear `apps/api/app/models.py` con `Base = declarative_base()` y el modelo `User` (id, name, role, email, created_at)
- [x] 2.2 Agregar modelo `Course` (id, name, shift, teacher_id FK→users) en `models.py`
- [x] 2.3 Agregar modelo `Student` (id, name, course_id FK→courses, average, tasks_completed, tasks_total, last_activity, status) en `models.py`
- [x] 2.4 Agregar modelo `Activity` (id, student_id FK→students, name, date, score nullable, status) en `models.py`
- [x] 2.5 Agregar modelo `AiDiagnosis` (id, student_id FK→students unique, text, tags JSON) en `models.py`
- [x] 2.6 Agregar modelo `Alert` (id, teacher_id FK→users, type, severity, message) en `models.py`

## 3. Sesión de base de datos

- [x] 3.1 Crear `apps/api/app/database.py` con `engine = create_engine(settings.database_url)`, `SessionLocal` y `get_db` como generador FastAPI-compatible
- [x] 3.2 Verificar importando `database.py` desde Python sin error: `python -c "from app.database import engine; print(engine)"`

## 4. Alembic — setup y primera migración

- [x] 4.1 Inicializar Alembic desde `apps/api/`: `alembic init alembic`
- [x] 4.2 Editar `apps/api/alembic/env.py`: importar `Base` desde `app.models` y `settings.database_url` desde `app.config`, asignar `target_metadata = Base.metadata` y configurar `sqlalchemy.url`
- [x] 4.3 Editar `apps/api/alembic.ini` para que `script_location = alembic` sea relativo a `apps/api/`
- [x] 4.4 Generar la primera migración: `alembic revision --autogenerate -m "initial_schema"` (ejecutar desde `apps/api/`)
- [x] 4.5 Revisar el archivo generado en `alembic/versions/` y confirmar que crea las 6 tablas
- [x] 4.6 Aplicar la migración: `alembic upgrade head` y verificar en Postgres con `\dt`

## 5. Script de seed

- [x] 5.1 Crear `apps/api/app/seed.py` que: abre sesión, hace TRUNCATE RESTART IDENTITY CASCADE, inserta 1 usuario docente, 6 cursos, los alumnos de `mock_data.STUDENTS`, actividades e historial de `STUDENT_DETAIL["s1"]`, y las 3 alertas
- [x] 5.2 Ejecutar el seed: `python -m app.seed` y verificar con `SELECT count(*) FROM users;` etc. en psql

## 6. Migrar router dashboard

- [x] 6.1 Reemplazar el import de `mock_data` en `apps/api/app/routers/dashboard.py` por `Depends(get_db)` e importar modelos
- [x] 6.2 Implementar query de alertas: `db.query(Alert).filter(Alert.teacher_id == current_user_id).all()`
- [x] 6.3 Implementar query de cursos resumen (máx 2) y actividad reciente (últimas 3 actividades)
- [x] 6.4 Verificar en Swagger (`/docs`) que `GET /api/v1/dashboard` devuelve datos reales

## 7. Migrar router courses

- [x] 7.1 Reemplazar import de `mock_data` en `apps/api/app/routers/courses.py` (lista de cursos) por query `db.query(Course).filter(Course.teacher_id == ...).all()`
- [x] 7.2 Verificar en Swagger que `GET /api/v1/courses` devuelve los 6 cursos del seed

## 8. Migrar router students (listado y detalle)

- [x] 8.1 Reemplazar import de `mock_data` en la ruta `GET /api/v1/courses/{id}/students` por query con filtro ILIKE para search y filtro de status
- [x] 8.2 Agregar soporte de paginación con `.offset()` y `.limit()` en la query de alumnos
- [x] 8.3 Reemplazar import de `mock_data` en `apps/api/app/routers/students.py` para `GET /api/v1/students/{id}` por join entre Student, AiDiagnosis y Activity
- [x] 8.4 Asegurar que un ID inexistente devuelve HTTP 404
- [x] 8.5 Verificar en Swagger los 3 endpoints: listado, búsqueda/filtro y detalle de alumno

## 9. Limpieza

- [x] 9.1 Eliminar `apps/api/app/mock_data.py`
- [x] 9.2 Buscar y eliminar cualquier import residual de `mock_data` en el codebase (`grep -r "mock_data" apps/api/`)
- [x] 9.3 Ejecutar la app completa y verificar el frontend en `http://localhost:5173` muestra datos reales
- [x] 9.4 Commit: `feat: integrate postgres database, replace mock_data with real queries`

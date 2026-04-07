## Context

El MVP del Copiloto Pedagógico tiene todos sus datos hardcodeados en `apps/api/app/mock_data.py`. El stack ya define PostgreSQL + SQLAlchemy + Alembic como la solución de persistencia, y la base de datos ya corre en Docker (`docker-compose.yml`). La variable `DATABASE_URL` ya está en `config.py`. Lo que falta es el puente: modelos ORM, sesión de DB, migraciones y reemplazar los imports de mock en los routers.

**Estado actual:**
- `mock_data.py` → importado directamente en los 4 routers del MVP
- No existe ningún archivo de modelos SQLAlchemy
- No existe Alembic en el repo
- Postgres corre en Docker pero la base de datos está vacía

**Restricciones:**
- Las respuestas JSON de los endpoints no deben cambiar (el frontend no se modifica)
- El sistema debe seguir funcionando con `dev-login` JWT durante todo el proceso
- Simplicidad: sincronía (`Session`) antes que async, para no añadir complejidad innecesaria

## Goals / Non-Goals

**Goals:**
- Crear modelos SQLAlchemy que representan exactamente los datos del MVP actual
- Configurar Alembic y generar la primera migración (`001_initial_schema`)
- Exponer `get_db` como dependencia de FastAPI para inyección en routers
- Reemplazar todos los imports de `mock_data` por queries reales
- Proveer un script de seed reproducible con los datos de `mock_data.py`
- El frontend sigue funcionando sin cambios

**Non-Goals:**
- Async SQLAlchemy (puede migrarse después si la carga lo requiere)
- Queries multi-tenant complejas (el docente ve sus cursos; no hay multi-escuela en MVP)
- CRUD completo de entidades (solo lectura para el MVP)
- Integraciones con Neo4j o S3

## Decisions

### D1: SQLAlchemy síncrono (`Session`) en lugar de async (`AsyncSession`)

**Elegido:** SQLAlchemy síncrono con `psycopg2-binary` como driver.

**Razón:** FastAPI soporta ambos, pero async agrega complejidad (necesita `asyncpg`, context managers distintos, y testing más difícil). Para el MVP con pocos usuarios concurrentes, la diferencia de rendimiento es irrelevante. Se puede migrar después.

**Alternativa descartada:** `asyncpg` + `AsyncSession` — más rápido en alta concurrencia pero innecesario ahora.

---

### D2: Un solo archivo `models.py` en vez de un módulo `models/`

**Elegido:** `apps/api/app/models.py` con todas las tablas.

**Razón:** Son pocas entidades (5-6 tablas). Separar en módulo agrega fricción sin beneficio. Cuando el modelo crezca significativamente se puede separar.

---

### D3: Alembic autogenerate a partir de los modelos SQLAlchemy

**Elegido:** `alembic revision --autogenerate` lee los metadatos de `Base.metadata`.

**Razón:** Evita escribir el DDL SQL a mano. Alembic compara el estado actual de la DB contra los modelos y genera el `upgrade()`/`downgrade()` automáticamente.

**Prerequisito:** `alembic/env.py` debe importar `Base` desde `app.models` para que funcione.

---

### D4: Script de seed separado (`seed.py`) en vez de datos en la migración

**Elegido:** `apps/api/app/seed.py` ejecutable con `python -m app.seed`.

**Razón:** Los datos de seed no son parte del esquema. Mezclarlos en la migración hace imposible resetear datos sin rollback de esquema. Un script independiente se puede re-ejecutar en cualquier momento.

---

### D5: Mantener `mock_data.py` hasta que todos los routers estén migrados

**Elegido:** Migración gradual router por router; `mock_data.py` se borra al final.

**Razón:** Permite verificar cada endpoint individualmente sin romper el sistema. Si una query falla, el problema está acotado al router que se acaba de migrar.

## Risks / Trade-offs

- **[Risk] La DB en Docker no está corriendo** → Mitigation: verificar con `docker compose ps` antes de arrancar el backend; documentar en README.
- **[Risk] Alembic autogenerate genera columnas incorrectas** → Mitigation: revisar el archivo de migración antes de hacer `alembic upgrade head`; nunca aplicar migraciones ciegas.
- **[Risk] El seed falla si ya hay datos** → Mitigation: el script de seed hace `TRUNCATE ... CASCADE` al inicio para ser idempotente.
- **[Risk] Los tipos de datos entre mock y DB no coinciden** (ej: `average` es `int` en mock pero debería ser `float`) → Mitigation: los modelos usan los tipos correctos desde el principio; el seed convierte valores si es necesario.

## Migration Plan

1. Instalar dependencias: `sqlalchemy`, `alembic`, `psycopg2-binary`
2. Crear `app/database.py` (engine + SessionLocal + `get_db`)
3. Crear `app/models.py` con todos los modelos del MVP
4. Inicializar Alembic: `alembic init alembic` desde `apps/api/`
5. Configurar `alembic/env.py` para importar `Base` y leer `DATABASE_URL` de settings
6. Generar migración: `alembic revision --autogenerate -m "initial_schema"`
7. Revisar el archivo generado y aplicar: `alembic upgrade head`
8. Ejecutar seed: `python -m app.seed`
9. Migrar routers uno a uno (dashboard → courses → students), verificando en Swagger tras cada uno
10. Eliminar `mock_data.py` y sus imports

**Rollback:** `alembic downgrade -1` revierte la última migración. Como es la primera migración, esto deja la DB vacía. El código puede revertirse a `mock_data.py` via git si hace falta.

## Open Questions

- ¿Se necesita un modelo `User` con password? No para el MVP (auth es dev-login JWT). Se puede agregar una tabla `users` vacía para que las foreign keys funcionen, populada por el seed con el docente de prueba.
- ¿Los `ids` de entidades deben ser UUID o integer serial? → Integer serial para simplicidad en el MVP; UUID cuando se implemente multi-tenant real.

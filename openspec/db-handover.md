# Base de datos — Estado actual y pendientes

> Documento para quien tome la continuidad del backend y la integración con Postgres.
> Fecha: 2026-04-07

---

## Qué está hecho

- Modelos SQLAlchemy en `apps/api/app/models.py`: `User`, `Course`, `Student`, `Activity`, `AiDiagnosis`, `Alert`
- Sesión de DB en `apps/api/app/database.py` con `get_db` inyectable en FastAPI
- Alembic inicializado en `apps/api/alembic/` con dos migraciones aplicadas:
  - `initial_schema` — crea las 6 tablas
  - `add_user_sub` — agrega columna `users.sub` para vincular JWT con DB
- Script de seed en `apps/api/app/seed.py` — datos equivalentes al mock original
- Los 4 endpoints del MVP (`dashboard`, `courses`, `courses/{id}/students`, `students/{id}`) leen desde Postgres
- Docker Compose levanta Postgres + API + Frontend con un solo comando, el seed corre automático

---

## Cosas a tener en cuenta

### 1. El seed borra y recarga datos en cada reinicio

El `entrypoint.sh` corre `python -m app.seed` cada vez que el contenedor `api` arranca.
Esto está bien para desarrollo pero **no debe ocurrir en producción**.

**Qué cambiar para producción:**
```sh
# entrypoint.sh — sacar la línea del seed
alembic upgrade head
# python -m app.seed  ← eliminar esta línea en producción
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
```

El seed debería correrse manualmente una sola vez al inicializar el entorno.

---

### 2. Autenticación: el campo `users.sub`

En desarrollo, el JWT tiene `sub = "dev-docente-001"` (hardcodeado en `app/routers/auth.py`).
Los routers buscan el usuario en DB haciendo `db.query(User).filter(User.sub == jwt_sub)`.

**En producción con CAS (SSO Ceibal):**
- El CAS va a proveer un identificador único por usuario (ej: número de cédula o ID institucional)
- Ese valor debe guardarse en `users.sub` la primera vez que el usuario se loguea (auto-provisioning)
- El middleware JWT no cambia — solo cambia de dónde viene el token

Flujo esperado en producción:
```
CAS → token con sub=<id_ceibal> → backend valida → busca User por sub → si no existe, lo crea
```

---

### 3. IDs enteros vs UUID

Las tablas usan `Integer` con autoincrement. Está bien para el MVP.

Si en el futuro hay multi-tenant real (varias escuelas, inspectores, etc.) conviene migrar a `UUID` para evitar colisiones y facilitar sharding. Eso requiere una migración de Alembic.

---

### 4. Campos que son strings cuando deberían ser tipos correctos

| Campo | Tabla | Tipo actual | Tipo correcto para prod |
|---|---|---|---|
| `last_activity` | `students` | `String` | `DateTime` |
| `date` | `activities` | `String` | `DateTime` |

Se guardaron como strings para que el seed fuera simple ("Hoy, 10:45", "Ayer, 16:20"). En producción deben ser `DateTime` reales para poder ordenar y filtrar correctamente.

---

### 5. Campos calculados que hoy son estáticos

`average`, `tasks_completed` y `tasks_total` en `Student` son columnas con valores fijos del seed. En producción deberían calcularse dinámicamente a partir de la tabla `activities`.

**Opción A:** Calcularlos en el endpoint con una query agregada (más simple).  
**Opción B:** Mantenerlos como columnas y actualizarlos con un trigger o job periódico (más performante a escala).

---

### 6. No hay endpoints de escritura

El MVP solo tiene endpoints de lectura (GET). Para que el sistema funcione de verdad se necesitan al menos:

- `POST /api/v1/activities` — crear una actividad (el alumno entrega una tarea)
- `PATCH /api/v1/activities/{id}` — el docente corrige y pone nota
- `POST /api/v1/students` — agregar un alumno a un curso
- `PUT /api/v1/students/{id}/diagnosis` — actualizar diagnóstico IA

---

### 7. El docente de prueba no tiene password

`User` no tiene columna `password`. La auth es completamente externa (CAS en prod, `dev-login` en desarrollo). Esto es correcto por diseño — no cambiar.

---

### 8. Workflow de Alembic para cambios de esquema

Cada vez que se modifica un modelo en `models.py`:

```bash
cd apps/api
source .venv/bin/activate

# 1. Generar migración automática
alembic revision --autogenerate -m "descripcion_del_cambio"

# 2. Revisar el archivo generado en alembic/versions/
#    NUNCA aplicar sin revisar — puede generar DROP TABLE si hay cambios drásticos

# 3. Aplicar
alembic upgrade head

# Para revertir la última migración:
alembic downgrade -1
```

**Regla importante:** nunca editar una migración ya aplicada en producción. Siempre crear una nueva.

---

### 9. Variables de entorno críticas en producción

| Variable | Descripción | Valor dev | Valor prod |
|---|---|---|---|
| `JWT_SECRET` | Firma de tokens | cualquier string ≥32 chars | secreto real, rotable |
| `ENV` | Habilita dev-login | `development` | `production` |
| `DATABASE_URL` | Conexión a Postgres | localhost | host real de la DB |
| `CORS_ORIGINS` | Orígenes permitidos | `http://localhost` | dominio real de la app |

En producción `ENV=production` desactiva automáticamente el endpoint `/auth/dev-login`.

---

### 10. Datos de prueba adicionales

El seed actual carga:
- 1 docente (`sub = "dev-docente-001"`)
- 6 cursos (todos asignados al mismo docente)
- 6 alumnos (todos en "4to A")
- 5 actividades y diagnóstico IA solo para "María Suárez"

Para agregar más datos realistas, editar `apps/api/app/seed.py` y volver a correr `python -m app.seed`.

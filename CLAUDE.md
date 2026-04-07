# Ceibal — Copiloto Pedagógico

Asistente multimodal de IA para la enseñanza personalizada de lectoescritura. Centro Ceibal 2026.

## Arranque del entorno

```bash
# 1. Postgres (solo la primera vez, o si no está corriendo)
docker compose up -d

# 2. Backend
cd apps/api
source .venv/bin/activate
uvicorn app.main:app --reload
# → http://localhost:8000
# → Swagger: http://localhost:8000/docs

# 3. Frontend (otra terminal)
cd apps/web
npm run dev
# → http://localhost:5173
```

## Variables de entorno

Copiar `.env.example` → `.env` y ajustar si es necesario. Variables requeridas:
- `JWT_SECRET`: mínimo 32 caracteres
- `ENV`: `development` (habilita `/auth/dev-login`)
- `DATABASE_URL`: string de conexión a Postgres

## Estructura del proyecto

```
/
├── apps/
│   ├── web/          # React + TypeScript + Vite
│   │   └── src/
│   │       ├── api/        # funciones fetch por entidad
│   │       ├── components/ # Layout (Sidebar, AuthLayout)
│   │       ├── pages/      # Login, Dashboard, Courses, Students, StudentDetail
│   │       ├── router/     # ProtectedRoute
│   │       ├── store/      # Zustand (auth)
│   │       └── types/      # tipos TypeScript de la API
│   └── api/          # FastAPI + Python
│       └── app/
│           ├── auth/       # jwt.py, dependencies.py
│           ├── routers/    # auth, dashboard, courses, students
│           ├── config.py   # pydantic-settings
│           ├── main.py     # FastAPI app + CORS
│           └── mock_data.py # fixtures (reemplazar por queries Postgres)
├── docker-compose.yml  # Postgres 15
├── .env.example
└── openspec/           # documentación del proyecto
```

## Auth en desarrollo

`POST /auth/dev-login { "role": "docente" }` → JWT válido con claims `{ sub, role, name, iat, exp }`.
El frontend guarda el token en `localStorage` bajo la clave `ceibal_token`.
En producción se reemplaza por CAS (SSO Ceibal) — el middleware JWT no cambia.

## Endpoints del MVP

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/auth/dev-login` | Login de desarrollo (solo ENV=development) |
| GET | `/api/v1/dashboard` | Alertas, cursos resumen, actividad reciente |
| GET | `/api/v1/courses` | Lista de cursos del docente |
| GET | `/api/v1/courses/{id}/students` | Alumnos con filtros y paginación |
| GET | `/api/v1/students/{id}` | Detalle del alumno |

## Convenciones

- **Commits**: conventional commits (`feat:`, `fix:`, `chore:`)
- **Código**: inglés (variables, funciones, comentarios)
- **UI**: español rioplatense
- **Mock data**: `apps/api/app/mock_data.py` — reemplazar imports por queries cuando se implemente la DB
- **Colores de promedio**: verde ≥8, amarillo ≥6, rojo <6

## Figma

- MCP corriendo en Figma Desktop: `http://127.0.0.1:3845/mcp`
- Screens: Login `1:2` · Dashboard `1:41` · Mis Cursos `1:237` · Alumnos `1:411` · Detalle `1:677`

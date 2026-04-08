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

## Figma

- MCP corriendo en Figma Desktop: `http://127.0.0.1:3845/mcp`
- Frame raíz: `DOCENTE` (`53:1411`) — todas las pantallas son hijos directos de este frame
- Screens: Login `52:340` · Inicio `52:379` · Mis Cursos `52:574` · Alumnos `52:747` · Detalle Alumno `52:1012` · Detalle Actividad `52:1271`

### Lineamientos de implementación UI

- **Fidelidad al Figma**: Cada pantalla debe quedar lo más fiel posible al diseño de Figma. Tomarse el tiempo necesario para revisar espaciados, colores, tipografías y jerarquía visual antes de dar por terminada una pantalla.
- **Consultar el MCP antes de implementar**: Antes de tocar cualquier componente visual, obtener screenshot del nodo correspondiente en Figma para guiar la implementación.
- **Responsive desktop**: Los frames de Figma tienen anchos fijos (ej. 1311px) que NO deben trasladarse al código. El layout debe adaptarse al viewport real del navegador desktop (1024px–1920px+). Regla: Sidebar con ancho semántico fijo (`w-64`), contenido principal con `flex-1`. Nunca usar `width` fijo en píxeles en contenedores de layout.
- **Sin responsive mobile/tablet en el MVP**: La app está pensada para docentes en desktop. No se implementa responsive para pantallas menores a 1024px.
- **Fuente**: Inter (importada vía `@fontsource/inter`, no CDN externo).
- **Iconos**: `react-icons` familia `hi2` (Heroicons v2). Importar siempre íconos individuales, nunca el barrel completo.
- **Colores de estado por promedio**: verde ≥8, amarillo ≥6, rojo <6.
- **Avatares**: iniciales del nombre + color de fondo determinístico (hash del nombre → paleta de 10 colores pastel).

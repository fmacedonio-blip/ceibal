## 1. Monorepo — Estructura base

- [x] 1.1 Crear estructura de carpetas: `/apps/web`, `/apps/api`, `docker-compose.yml`, `package.json` raíz
- [x] 1.2 Crear `docker-compose.yml` con servicio Postgres 15 (`ceibal_dev`, puerto 5432)
- [x] 1.3 Crear `.env.example` con variables: `JWT_SECRET`, `DATABASE_URL`, `ENV`, `CORS_ORIGINS`
- [x] 1.4 Crear `apps/web` con Vite + React + TypeScript (`npm create vite`)
- [x] 1.5 Instalar dependencias frontend: `react-router-dom`, `zustand`, `axios`
- [x] 1.6 Crear `apps/api` con estructura FastAPI: `app/main.py`, `app/config.py`, `pyproject.toml`
- [x] 1.7 Instalar dependencias backend: `fastapi`, `uvicorn`, `python-jose[cryptography]`, `pydantic-settings`
- [x] 1.8 Configurar `apps/api/app/config.py` con `pydantic-settings` — validar variables requeridas al arrancar

## 2. Backend — Auth de desarrollo

- [x] 2.1 Crear `apps/api/app/auth/jwt.py` con funciones `create_token(sub, role, name)` y `decode_token(token)`
- [x] 2.2 Crear `apps/api/app/auth/dependencies.py` con dependency `get_current_user` (HTTPBearer + decode)
- [x] 2.3 Crear `apps/api/app/routers/auth.py` con `POST /auth/dev-login` — disponible solo si `ENV=development`
- [x] 2.4 Registrar router de auth en `main.py` y configurar CORS para `localhost:5173`
- [x] 2.5 Verificar manualmente: `POST /auth/dev-login { "role": "docente" }` → JWT válido con claims correctos

## 3. Backend — Mock data y endpoints

- [x] 3.1 Crear `apps/api/app/mock_data.py` con fixtures completas para las 5 pantallas (datos del Figma)
- [x] 3.2 Crear `apps/api/app/routers/dashboard.py` con `GET /api/v1/dashboard` — protegido con `get_current_user`
- [x] 3.3 Crear `apps/api/app/routers/courses.py` con `GET /api/v1/courses`
- [x] 3.4 Agregar `GET /api/v1/courses/{course_id}/students` con soporte de query params `filter`, `search`, `page`, `limit`
- [x] 3.5 Crear `apps/api/app/routers/students.py` con `GET /api/v1/students/{student_id}` — retorna 404 si no existe
- [x] 3.6 Registrar todos los routers en `main.py` bajo prefijo `/api/v1`
- [x] 3.7 Verificar todos los endpoints con Swagger UI en `localhost:8000/docs`

## 4. Frontend — Auth y store

- [x] 4.1 Crear `apps/web/src/types/api.ts` con tipos TypeScript para todas las respuestas de la API
- [x] 4.2 Crear `apps/web/src/store/auth.ts` con Zustand: estado `token`, `user`, acciones `login`, `logout`
- [x] 4.3 Crear `apps/web/src/api/client.ts` — instancia de axios con base URL y interceptor para Bearer token
- [x] 4.4 Crear `apps/web/src/api/auth.ts` — función `devLogin(role)` que llama a `/auth/dev-login`
- [x] 4.5 Crear `apps/web/src/api/dashboard.ts`, `courses.ts`, `students.ts` — una función por endpoint

## 5. Frontend — Router y shell

- [x] 5.1 Configurar `react-router-dom` v6 en `App.tsx` con las 5 rutas del MVP
- [x] 5.2 Crear `apps/web/src/router/ProtectedRoute.tsx` — verifica token en store, redirige a `/login` si inválido
- [x] 5.3 Crear `apps/web/src/components/Layout/Sidebar.tsx` — logo Ceibal, nav items, info de usuario al pie
- [x] 5.4 Crear `apps/web/src/components/Layout/AuthLayout.tsx` — Sidebar + `<Outlet />` para rutas protegidas
- [x] 5.5 Aplicar `AuthLayout` como wrapper de todas las rutas protegidas en el router

## 6. Frontend — Pantallas

- [x] 6.1 Crear `pages/Login/` — selector de rol + botón, llama a `devLogin`, guarda token y redirige
- [x] 6.2 Crear `pages/Dashboard/` — fetch de `/api/v1/dashboard`, renderiza alertas, cursos y actividad reciente
- [x] 6.3 Crear `pages/Courses/` — fetch de `/api/v1/courses`, grid de cards con correcciones pendientes
- [x] 6.4 Crear `pages/Students/` — fetch de `/api/v1/courses/:id/students`, tabla con filtros, búsqueda y paginación
- [x] 6.5 Crear `pages/StudentDetail/` — fetch de `/api/v1/students/:id`, stats + diagnóstico IA + historial
- [x] 6.6 Implementar breadcrumb en `StudentDetail` con links a Mis Cursos y a la lista de alumnos del curso

## 7. Verificación end-to-end

- [x] 7.1 Flujo completo: login como docente → dashboard → mis cursos → lista alumnos → detalle alumno
- [x] 7.2 Verificar guard: acceder a `/dashboard` sin token redirige a `/login`
- [x] 7.3 Verificar guard: acceder a `/dashboard` con token expirado redirige a `/login` y limpia localStorage
- [x] 7.4 Verificar filtros en lista de alumnos: Todos / Pendientes / Al día funcionan correctamente
- [x] 7.5 Verificar paginación en lista de alumnos
- [x] 7.6 Crear `CLAUDE.md` en la raíz con comandos de arranque, estructura del proyecto y convenciones

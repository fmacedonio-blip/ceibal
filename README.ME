# Ceibal — Copiloto Pedagógico

Asistente multimodal de IA para la enseñanza personalizada de lectoescritura, orientado a alumnos de 3.º a 6.º de primaria (8–12 años). Proyecto POC para Centro Ceibal 2026.

---

## Descripción

El Copiloto Pedagógico asiste a docentes y alumnos en el proceso de lectoescritura mediante análisis automático de producciones escritas y lecturas en voz alta. Combina modelos de IA multimodal con una interfaz pedagógica para brindar retroalimentación diferenciada: orientada al alumno (socrática, motivadora) y orientada al docente (diagnóstica, técnica).

### Funcionalidades principales

**Para docentes:**
- Dashboard con alertas de seguimiento, resumen de cursos y actividad reciente
- Gestión de cursos y tareas
- Listado de alumnos con filtros (pendientes / todos) y paginación
- Perfil detallado del alumno: promedio, diagnóstico de IA, historial de actividades

**Para alumnos:**
- Listado de tareas pendientes (escritura y lectura)
- Envío de producciones escritas (imagen) y lecturas (audio)
- Correcciones con análisis de IA: errores agrupados, sugerencias de mejora
- Chat socrático para guiar la autocorrección

**Motor de análisis (IA):**
- **Audio**: transcripción, palabras por minuto, precisión, detección de errores (sustituciones, omisiones, repeticiones), clasificación de fluidez
- **Escritura**: transcripción desde imagen, agrupación de errores (ortografía, concordancia, vocabulario, puntuación), sugerencias socráticas, alineación curricular
- Pipeline en dos etapas: detección → síntesis pedagógica

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19, TypeScript, Vite, Zustand, React Router 7 |
| Backend | FastAPI, Python 3.11, SQLAlchemy 2 (async), Alembic |
| Base de datos | PostgreSQL 15 |
| Auth (dev) | JWT — endpoint `/auth/dev-login` |
| Auth (prod) | CAS Ceibal + AWS Cognito |
| IA / Modelos | OpenRouter API (Claude Sonnet 4.6, Gemini, Xiaomi MiMo) |
| Almacenamiento | AWS S3 (imágenes y audios de alumnos) |
| Infraestructura | Docker + Docker Compose |

---

## Estructura del proyecto

```
/
├── apps/
│   ├── web/                  # Frontend React + TypeScript + Vite
│   │   └── src/
│   │       ├── api/          # Funciones fetch por entidad
│   │       ├── components/   # Layout, Sidebar, Avatar, Spinner
│   │       ├── pages/        # Pantallas docente y alumno
│   │       ├── router/       # ProtectedRoute
│   │       ├── store/        # Zustand (auth)
│   │       └── types/        # Tipos TypeScript de la API
│   └── api/                  # Backend FastAPI + Python
│       └── app/
│           ├── auth/         # JWT, Cognito, dependencias
│           ├── routers/      # Endpoints REST
│           ├── models/       # Modelos SQLAlchemy
│           ├── schemas/      # Schemas Pydantic
│           ├── services/     # Lógica de negocio y análisis
│           ├── pipelines/    # Pipelines de análisis IA
│           ├── config.py     # Variables de entorno (pydantic-settings)
│           ├── main.py       # App FastAPI + CORS
│           └── seed.py       # Fixtures para desarrollo
├── feedback_engine_api/      # Microservicio standalone de análisis
├── openspec/                 # Especificaciones del proyecto
├── docker-compose.yml
└── .env.example
```

---

## Requisitos previos

- Docker y Docker Compose
- Node.js 20+
- Python 3.11+

---

## Instalación y arranque

### 1. Variables de entorno

```bash
cp .env.example .env
```

Ajustar las variables requeridas (ver sección [Variables de entorno](#variables-de-entorno)).

### 2. Arranque con Docker Compose (recomendado)

```bash
docker compose up -d
```

Levanta PostgreSQL, el backend (con migraciones y seed automáticos) y el frontend.

| Servicio | URL |
|---------|-----|
| Frontend | http://localhost:80 |
| Backend API | http://localhost:8000 |
| Swagger / Docs | http://localhost:8000/docs |

### 3. Arranque local (desarrollo)

**Base de datos:**
```bash
docker compose up -d postgres
```

**Backend:**
```bash
cd apps/api
source .venv/bin/activate
alembic upgrade head      # migraciones
python seed.py            # datos de prueba
uvicorn app.main:app --reload
# → http://localhost:8000
```

**Frontend (otra terminal):**
```bash
cd apps/web
npm install
npm run dev
# → http://localhost:5173
```

---

## Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `ENV` | `development` habilita `/auth/dev-login` | Sí |
| `JWT_SECRET` | Mínimo 32 caracteres | Sí |
| `DATABASE_URL` | String de conexión a PostgreSQL | Sí |
| `OPENROUTER_API_KEY` | API key de OpenRouter para modelos IA | Sí |
| `AUDIO_MODEL` | Modelo para análisis de audio | Sí |
| `HANDWRITE_MODEL` | Modelo para análisis de escritura | Sí |
| `COGNITO_USER_POOL_ID` | Pool de usuarios Cognito (prod) | Prod |
| `COGNITO_APP_CLIENT_ID` | Client ID de Cognito (prod) | Prod |
| `AWS_REGION` | Región de AWS | Prod |
| `S3_BUCKET_HANDWRITE` | Bucket S3 para imágenes de escritura | Prod |
| `CORS_ORIGINS` | Orígenes permitidos (ej. `http://localhost:5173`) | Sí |
| `VITE_API_URL` | URL del backend (para build del frontend) | Sí |

---

## Auth en desarrollo

Con `ENV=development` se habilita el endpoint de login sin contraseña:

```bash
POST /auth/dev-login
{ "role": "docente" }   # o "alumno"
```

Devuelve un JWT válido con claims `{ sub, role, name, iat, exp }`. El frontend lo guarda en `localStorage` bajo la clave `ceibal_token`.

En producción, el login se realiza a través de CAS (SSO Ceibal) + AWS Cognito. El middleware JWT no cambia.

---

## Endpoints principales

### Docente

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/dev-login` | Login de desarrollo |
| `GET` | `/api/v1/profile` | Perfil del usuario autenticado |
| `GET` | `/api/v1/dashboard` | Alertas, resumen de cursos, actividad reciente |
| `GET` | `/api/v1/courses` | Lista de cursos del docente |
| `GET` | `/api/v1/courses/{id}/students` | Alumnos con filtros y paginación |
| `GET` | `/api/v1/students/{id}` | Detalle del alumno (diagnóstico + historial) |

### Alumno

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/me/tasks` | Tareas del alumno |
| `POST` | `/api/v1/submissions/writing` | Enviar producción escrita (imagen) |
| `POST` | `/api/v1/submissions/audio` | Enviar lectura en voz alta (audio) |
| `POST` | `/api/v1/submissions/{id}/analyze-handwrite` | Disparar análisis de escritura |
| `POST` | `/api/v1/submissions/{id}/analyze-audio` | Disparar análisis de audio |
| `POST` | `/api/v1/submissions/{id}/chat/start` | Iniciar sesión de chat socrático |
| `POST` | `/api/v1/chat/{sessionId}/message` | Enviar mensaje al copiloto |

Documentación interactiva completa disponible en `/docs` (Swagger UI).

---

## Convenciones

- **Commits**: conventional commits — `feat:`, `fix:`, `chore:`
- **Código**: inglés (variables, funciones, comentarios)
- **UI**: español rioplatense
- **Colores de estado por promedio**: verde ≥ 8 · amarillo ≥ 6 · rojo < 6

---

## Licencia

Proyecto interno — Centro Ceibal 2026. No distribuir sin autorización.

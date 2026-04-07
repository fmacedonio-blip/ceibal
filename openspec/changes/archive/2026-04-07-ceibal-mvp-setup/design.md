## Context

El proyecto parte de cero. No existe código previo. La propuesta define 4 capacidades nuevas: estructura del monorepo, auth de desarrollo, API mockeada y shell frontend. Este documento define las decisiones técnicas que aseguran que lo construido en el MVP no requiera refactoring estructural cuando se reemplacen los mocks por lógica real.

El constraint principal: **el middleware JWT y la forma de los endpoints deben ser idénticos al estado productivo**. El dev-login es el único componente descartable; todo lo demás es permanente.

## Goals / Non-Goals

**Goals:**
- Monorepo funcional con hot-reload en ambos servicios desde `docker compose up`
- Auth dev que emite JWT válido — el frontend nunca sabe si está en modo dev o prod
- 5 endpoints que devuelven la forma exacta de respuesta que tendrán en producción
- Guard de JWT en frontend que protege todas las rutas autenticadas
- Layout shell reutilizable para las 5 pantallas del Figma

**Non-Goals:**
- Base de datos con datos reales (los mocks viven en el código, no en Postgres)
- Lógica de negocio real en ningún endpoint
- Integración con Neo4j, gRPC o el AI layer
- SSO/CAS real

## Decisions

### D1 — Monorepo con workspaces de npm + pyproject.toml

```
/
├── apps/
│   ├── web/          # React + TypeScript + Vite
│   └── api/          # FastAPI + Python
├── docker-compose.yml
└── package.json      # workspace root (scripts compartidos)
```

**Por qué no turborepo/nx**: el proyecto tiene exactamente 2 apps con stacks distintos (JS y Python). Agregar un build orchestrator sería complejidad sin beneficio real en esta etapa.

**Por qué no repos separados**: el Figma, los tipos compartidos y las variables de entorno son más fáciles de mantener en un monorepo cuando el equipo es pequeño.

---

### D2 — JWT: forma exacta y middleware

**Forma del token** (idéntica en dev y prod):
```json
{
  "sub": "user-uuid-v4",
  "role": "docente",
  "name": "María González",
  "iat": 1712345678,
  "exp": 1712432078
}
```

**Secret**: variable de entorno `JWT_SECRET` (mínimo 32 chars). En dev se lee desde `.env`.

**Dev login** — `POST /auth/dev-login`:
```json
// request
{ "role": "docente" }

// response
{
  "access_token": "<jwt>",
  "token_type": "bearer",
  "user": {
    "id": "dev-docente-001",
    "name": "Docente Demo",
    "role": "docente"
  }
}
```

**Middleware FastAPI**: `HTTPBearer` dependency en todas las rutas de `/api/v1/`. El middleware decodifica y valida el JWT — si falla retorna 401. No existe modo "bypass".

**Frontend**: el token se guarda en `localStorage` bajo la clave `ceibal_token`. Al montar la app, si el token no existe o está expirado, redirige a `/login`. El guard vive en un `ProtectedRoute` component.

---

### D3 — Mock API: datos en módulo Python, no en base de datos

Los mocks viven en `apps/api/app/mock_data.py`. Cada endpoint importa las fixtures desde ese módulo. Cuando se implemente la lógica real, se reemplaza el import por una query a Postgres — la firma del endpoint no cambia.

**Por qué no usar una librería de mock (Faker, factory_boy)**: los datos deben coincidir exactamente con los diseños de Figma para que el frontend se vea correcto desde el primer día.

---

### D4 — Respuestas exactas de los 5 endpoints

**GET /api/v1/dashboard**
```json
{
  "alerts": [
    { "id": "1", "type": "difficulty", "severity": "high",
      "message": "3 alumnos muestran dificultades significativas en matemática" },
    { "id": "2", "type": "pending", "severity": "medium",
      "message": "5 tareas sin evaluación excede pendientes de revisión" },
    { "id": "3", "type": "suggestion", "severity": "low",
      "message": "Nuevo grupo recomendado según asistencias irregulares" }
  ],
  "courses": [
    { "id": "c1", "name": "4to A", "shift": "Turno Matutino",
      "student_count": 27, "average": 72 },
    { "id": "c2", "name": "3ro B", "shift": "Turno Vespertino",
      "student_count": 23, "average": 68 }
  ],
  "recent_activity": [
    { "student_name": "Mateo Rodriguez", "initials": "MR",
      "activity": "Lectura del cuento", "date": "HOY 11:23",
      "status": "COMPLETADA" },
    { "student_name": "Sofía García", "initials": "SG",
      "activity": "Evaluación Matemática", "date": "HOY 10:45",
      "status": "PENDIENTE_DE_REVISION" },
    { "student_name": "Lucas Castro", "initials": "LC",
      "activity": "Ensayo histórico", "date": "AYER 17:15",
      "status": "REVISADA" }
  ]
}
```

**GET /api/v1/courses**
```json
[
  { "id": "c1", "name": "4to A", "shift": "Turno Matutino",
    "student_count": 27, "pending_corrections": 5 },
  { "id": "c2", "name": "3ro B", "shift": "Turno Vespertino",
    "student_count": 24, "pending_corrections": 0 },
  { "id": "c3", "name": "6to C", "shift": "Turno Matutino",
    "student_count": 29, "pending_corrections": 12 },
  { "id": "c4", "name": "5to A", "shift": "Turno Matutino",
    "student_count": 26, "pending_corrections": 3 },
  { "id": "c5", "name": "2do B", "shift": "Turno Vespertino",
    "student_count": 22, "pending_corrections": 8 },
  { "id": "c6", "name": "1ro C", "shift": "Turno Matutino",
    "student_count": 25, "pending_corrections": 0 }
]
```

**GET /api/v1/courses/{course_id}/students**
Query params: `filter` (todos|pendientes|al_dia), `search` (string), `page` (int), `limit` (int, default 6)
```json
{
  "students": [
    { "id": "s1", "name": "María Suárez", "average": 8.5,
      "tasks_completed": 7, "tasks_total": 10,
      "last_activity": "Hoy, 10:45", "status": "al_dia" },
    { "id": "s2", "name": "Juan Pérez", "average": 6.2,
      "tasks_completed": 4, "tasks_total": 10,
      "last_activity": "Ayer, 16:20", "status": "pendiente" }
  ],
  "total": 27,
  "page": 1,
  "limit": 6
}
```

**GET /api/v1/students/{student_id}**
```json
{
  "id": "s1",
  "name": "María Suárez",
  "course": { "id": "c1", "name": "4to A", "shift": "Turno Matutino" },
  "average": 8.5,
  "tasks_completed": 7,
  "tasks_total": 10,
  "ai_diagnosis": {
    "text": "María presenta un desempeño destacado en producción escrita, mostrando creatividad y buena estructura en sus textos. Se recomienda reforzar la comprensión lectora en textos más complejos y trabajar en la ortografía de palabras con tildes.",
    "tags": ["Creatividad Alta", "Buena Estructura", "Mejorar Ortografía"]
  },
  "activity_history": [
    { "id": "a1", "name": "Narración: El viaje a la Luna",
      "date": "Hoy, 10:45", "score": 9.0, "status": "CORREGIDA" },
    { "id": "a2", "name": "Descripción: Mi animal favorito",
      "date": "15 Oct, 14:30", "score": 8.5, "status": "CORREGIDA" },
    { "id": "a3", "name": "Análisis de poema: Alfonsina y el mar",
      "date": "13 Oct, 11:00", "score": null, "status": "NO_ENTREGADO" }
  ]
}
```

---

### D5 — Frontend: estructura de carpetas

```
apps/web/src/
├── api/           # funciones fetch tipadas (una por endpoint)
├── components/    # componentes reutilizables (Sidebar, Table, Badge, etc.)
├── pages/         # una carpeta por pantalla del Figma
│   ├── Login/
│   ├── Dashboard/
│   ├── Courses/
│   ├── Students/
│   └── StudentDetail/
├── router/        # react-router-dom v6, ProtectedRoute
├── store/         # estado de auth (zustand o context, a decidir)
└── types/         # tipos TypeScript que espejo la forma de la API
```

Los tipos en `types/` se derivan directamente de las respuestas JSON de D4. Cuando la API real entre, los tipos no cambian.

---

### D6 — Estado de auth en frontend

**Zustand** sobre React Context: más simple para persistir en localStorage, sin boilerplate de providers. El store tiene: `token`, `user`, `login(token, user)`, `logout()`.

## Risks / Trade-offs

- **Mock data hardcodeada** → El diseño es intencional: se reemplaza un import, no una arquitectura. Riesgo bajo.
- **localStorage para el token** → Aceptable para dev; en producción evaluar httpOnly cookies. No es scope de este change.
- **Sin CORS configurado para prod** → El `docker-compose` solo expone `localhost`. Se configura cuando haya un deploy real.
- **Un solo archivo `mock_data.py`** → Si crece demasiado, se separa por entidad. Por ahora la simplicidad tiene más valor que la organización prematura.

## Open Questions

- ¿El `docker-compose` levanta solo Postgres, o también levanta `web` y `api`? → Recomendado: solo Postgres en Docker, los servicios corren con `npm run dev` y `uvicorn` directo para mejor DX con hot-reload.
- ¿Qué librería de componentes UI? → Tailwind CSS + shadcn/ui es lo más cercano al estilo del Figma (colores Ceibal, cards, tablas). A confirmar antes de implementar.

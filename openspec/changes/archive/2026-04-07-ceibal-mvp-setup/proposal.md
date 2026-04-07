## Why

El proyecto Copiloto Pedagógico de Ceibal no tiene aún ninguna base de código. Para comenzar el desarrollo iterativo necesitamos un monorepo funcional con frontend y backend conectados, autenticación real (no bypasseada) y endpoints mockeados que respeten la firma de la API definitiva. Esto permite trabajar las 5 pantallas del Figma con datos reales desde el día uno, sin romper nada cuando los mocks se reemplacen por lógica real.

## What Changes

- **Nuevo**: monorepo con `apps/web` (React + TypeScript + Vite) y `apps/api` (FastAPI + PostgreSQL)
- **Nuevo**: endpoint de auth para desarrollo `POST /auth/dev-login` que emite JWT real con claims `{ sub, role, name }` — sin bypass, el token se valida igual que en producción
- **Nuevo**: 5 endpoints REST mockeados bajo `/api/v1/` que devuelven data estructurada según los diseños de Figma (nodos 1:41, 1:237, 1:411, 1:677)
- **Nuevo**: layout shell React con Sidebar + MainContent compartido entre todas las rutas autenticadas
- **Nuevo**: routing con guard de JWT — rutas protegidas redirigen a `/login` si el token está ausente o expirado
- **Nuevo**: estructura de carpetas y configuración base (ESLint, Prettier, Alembic, Docker Compose para Postgres local)

## Capabilities

### New Capabilities

- `monorepo-setup`: Estructura de carpetas, tooling compartido y configuración base del monorepo (web + api)
- `dev-auth`: Autenticación de desarrollo con JWT real — login por rol sin SSO, compatible con middleware de producción
- `mock-api`: Cinco endpoints REST mockeados con respuestas que respetan la forma de la API definitiva
- `frontend-shell`: Layout autenticado (Sidebar + MainContent), routing con guard JWT y navegación entre las 5 pantallas

### Modified Capabilities

## Impact

- Crea toda la estructura del repositorio desde cero
- Requiere Node.js 20+, Python 3.11+, Docker (para Postgres local)
- Los mocks de `/api/v1/` se reemplazarán por lógica real en changes posteriores sin cambiar la firma de los endpoints
- El middleware JWT es idéntico al de producción: cuando se integre CAS, solo cambia `POST /auth/dev-login` por el redirect a CAS

## Non-goals

- No se implementa la vista del alumno (fase posterior)
- No se conecta Neo4j ni el AI layer (gRPC, fase posterior)
- No se integra CAS/SSO real (fase posterior)
- No se implementan Reportes ni Configuración (no tienen diseño en Figma aún)
- No se sube ningún asset a S3/MinIO

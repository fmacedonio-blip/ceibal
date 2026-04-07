## ADDED Requirements

### Requirement: Monorepo con dos aplicaciones independientes
El repositorio SHALL contener dos aplicaciones bajo `/apps/`: `web` (React + TypeScript + Vite) y `api` (FastAPI + Python). Cada una SHALL poder ejecutarse y desarrollarse de forma independiente.

#### Scenario: Arranque del entorno de desarrollo
- **WHEN** el desarrollador ejecuta `docker compose up -d` seguido de `npm run dev` en `apps/web` y `uvicorn` en `apps/api`
- **THEN** ambos servicios arrancan sin errores, con hot-reload activo, y el frontend en `localhost:5173` puede comunicarse con la API en `localhost:8000`

#### Scenario: Postgres disponible localmente
- **WHEN** el desarrollador ejecuta `docker compose up -d`
- **THEN** Postgres 15 corre en `localhost:5432` con la base de datos `ceibal_dev` y credenciales definidas en `.env`

### Requirement: Configuración de variables de entorno
El sistema SHALL leer toda configuración sensible desde archivos `.env` que no se commitean al repositorio. SHALL existir un `.env.example` con todas las variables requeridas documentadas.

#### Scenario: Variables requeridas presentes
- **WHEN** el desarrollador copia `.env.example` a `.env` y completa los valores
- **THEN** ambas aplicaciones arrancan sin errores de configuración faltante

#### Scenario: Variable faltante
- **WHEN** falta una variable requerida (ej: `JWT_SECRET`)
- **THEN** la API falla al arrancar con un mensaje de error claro indicando qué variable falta

### Requirement: Scripts de desarrollo centralizados
El `package.json` raíz SHALL incluir scripts para las operaciones más comunes del monorepo.

#### Scenario: Script de instalación
- **WHEN** el desarrollador ejecuta `npm install` en la raíz
- **THEN** se instalan las dependencias de `apps/web`

## ADDED Requirements

### Requirement: Endpoint de login para desarrollo
El sistema SHALL exponer `POST /auth/dev-login` que acepta un rol y devuelve un JWT firmado con la misma estructura que usará el sistema en producción. Este endpoint SHALL existir únicamente en entorno de desarrollo (`ENV=development`).

#### Scenario: Login como docente
- **WHEN** se hace `POST /auth/dev-login` con body `{ "role": "docente" }`
- **THEN** la respuesta es 200 con `{ "access_token": "<jwt>", "token_type": "bearer", "user": { "id": "dev-docente-001", "name": "Docente Demo", "role": "docente" } }`

#### Scenario: Login como alumno
- **WHEN** se hace `POST /auth/dev-login` con body `{ "role": "alumno" }`
- **THEN** la respuesta es 200 con un JWT válido y `user.role = "alumno"`

#### Scenario: Rol inválido
- **WHEN** se hace `POST /auth/dev-login` con un rol no reconocido
- **THEN** la respuesta es 422 con un mensaje de validación

#### Scenario: Endpoint ausente en producción
- **WHEN** `ENV=production` y se intenta acceder a `POST /auth/dev-login`
- **THEN** la respuesta es 404

### Requirement: JWT con claims canónicos
El JWT emitido SHALL contener exactamente los claims: `sub` (string, ID del usuario), `role` (string, uno de: docente, alumno, director, inspector), `name` (string, nombre display), `iat` (timestamp de emisión), `exp` (timestamp de expiración, 24h desde emisión). El algoritmo SHALL ser HS256.

#### Scenario: Claims completos
- **WHEN** se decodifica el JWT recibido de `/auth/dev-login`
- **THEN** contiene exactamente los campos `sub`, `role`, `name`, `iat`, `exp` y ningún campo adicional no documentado

### Requirement: Middleware de validación JWT en todos los endpoints protegidos
Todas las rutas bajo `/api/v1/` SHALL requerir un `Authorization: Bearer <token>` válido. El middleware SHALL rechazar tokens expirados, tokens con firma inválida y requests sin header.

#### Scenario: Request sin token
- **WHEN** se hace un GET a `/api/v1/dashboard` sin header Authorization
- **THEN** la respuesta es 401 con `{ "detail": "Not authenticated" }`

#### Scenario: Token expirado
- **WHEN** se hace un request con un token cuyo `exp` ya pasó
- **THEN** la respuesta es 401 con `{ "detail": "Token expired" }`

#### Scenario: Token válido
- **WHEN** se hace un request con un token válido y no expirado
- **THEN** el endpoint procesa el request normalmente y retorna 200

## Context

El backend actual (`apps/api`) usa SQLAlchemy síncrono con `create_engine` / `SessionLocal`. Los pipelines de análisis (`handwrite_pipeline`, `audio_pipeline`) llaman a OpenRouter via `httpx.post` síncrono y devuelven el resultado directo al cliente — nada se persiste. Los routers actuales son `async def` sobre I/O bloqueante (patrón aceptable para MVP).

Se agregan dos features integradas: persistencia del análisis y chat socrático. Ambas introducen I/O de DB intenso, por lo que se usa SQLAlchemy async (`asyncpg`) — pero solo para el código nuevo, para no tocar los routers existentes.

## Goals / Non-Goals

**Goals:**
- Persistir el `OutputFinal` del pipeline en `submissions` + `submission_errors` de forma atómica
- Exponer endpoints REST para consultar submissions y métricas de dashboard
- Chat socrático persistido en DB, con historial completo por sesión
- Pipeline abstraction: switchear `handwrite_pipeline` ↔ `handwrite_pipeline_aws` via env var, sin modificar routers ni services de DB

**Non-Goals:**
- Migrar los routers existentes a async
- Implementar `handwrite_pipeline_aws`
- Upload directo a S3 desde el cliente (esta iteración recibe el archivo en el endpoint)
- Frontend del alumno

---

## Decisions

### 1. Async DB solo para features nuevas (no migración total)

**Decisión**: `database_async.py` con `create_async_engine` + `AsyncSession` en paralelo al `database.py` sync existente.

**Alternativas consideradas**:
- *Migrar todo a async*: riesgo de regresión en los 6 routers existentes; trabajo extra sin valor inmediato.
- *Usar sync para todo*: bloqueante en I/O de DB en los nuevos endpoints que hacen múltiples writes; peor latencia percibida.

**Rationale**: Los nuevos endpoints tienen I/O de DB no trivial (insert submission + N submission_errors en transacción, queries de agregación). Async ahí sí importa. Los routers viejos son simples queries de lectura — el overhead sync es despreciable.

```python
# database_async.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

engine_async = create_async_engine(
    settings.database_url.replace("postgresql://", "postgresql+asyncpg://"),
    pool_pre_ping=True,
)
AsyncSessionLocal = async_sessionmaker(engine_async, expire_on_commit=False)

async def get_async_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
```

---

### 2. Pipeline abstraction via Protocol + env var

**Decisión**: `services/handwrite_analyze.py` define un `AnalysisResult` typed dict y una función async `analyze()`. Internamente hace `if settings.handwrite_pipeline == "aws": from ...aws import analyze_aws; ...`. El router y `submission_service` solo conocen `analyze()`.

```
settings.HANDWRITE_PIPELINE = "openrouter" | "aws"

services/handwrite_analyze.py
    analyze(image_bytes, content_type, curso, modelo) -> OutputFinal
        │
        ├── "openrouter" → handwrite_pipeline.pipeline.run() (sync wrapeado en asyncio)
        └── "aws"        → handwrite_pipeline_aws.pipeline.run() (futuro)
```

El pipeline sync existente se llama con `asyncio.to_thread()` para no bloquear el event loop:
```python
result = await asyncio.to_thread(run_sync_pipeline, imagen_bytes, content_type, curso, modelo)
```

**Alternativas consideradas**:
- *Protocol/ABC formal*: más verboso, no agrega valor hasta que existan dos implementaciones reales.
- *DI container*: overkill para este tamaño de proyecto.

---

### 3. Inserción atómica: submission + submission_errors en una transacción

**Decisión**: `submission_service.persist_result()` abre una transacción async, inserta `Submission` con `ai_result` (JSONB blob completo), luego bulk-inserta todos los `SubmissionError`. Si falla cualquier insert, rollback total.

```
async with db.begin():
    db.add(submission)
    await db.flush()   # obtener submission.id para los errors
    db.add_all(errors)
# commit automático al salir del context manager
```

---

### 4. ai_result como JSONB deserializado en responses

**Decisión**: El campo `ai_result` se define como `mapped_column(JSONB)` en SQLAlchemy. Pydantic schema usa `model_config = ConfigDict(from_attributes=True)` y el campo es `dict` (no `str`). FastAPI serializa como objeto JSON, no como string escapado.

---

### 5. Chat socrático — historial completo en cada llamada

**Decisión**: En cada mensaje del alumno, `chat_service` carga el historial completo de `chat_messages` para esa sesión y construye el array `messages[]` para OpenRouter:

```
[
  { "role": "system",    "content": <socratic_system_prompt> },
  { "role": "assistant", "content": <feedback_inicial> },   # primer turn
  { "role": "user",      "content": <msg_1> },
  { "role": "assistant", "content": <resp_1> },
  ...
  { "role": "user",      "content": <nuevo_mensaje> }
]
```

**Alternativas consideradas**:
- *Guardar el historial comprimido*: agrega complejidad, no necesario a este escala.
- *Usar memory API de OpenRouter*: vendor lock-in, dificulta el switch a AWS gateway.

**Límite**: `turn_count >= 20` → `is_active = false`, el endpoint devuelve 422.

---

### 6. System prompt socrático (exacto, no modificar)

```
Sos un asistente pedagógico socrático que ayuda a niños de primaria a mejorar su escritura.

CONTEXTO DEL TEXTO DEL ALUMNO:
Transcripción: {transcripcion}
Errores identificados: {errores_resumidos}
Feedback inicial dado: {feedback_inicial}

REGLAS ABSOLUTAS:
1. NUNCA des la respuesta correcta directamente
2. SIEMPRE respondé con una pregunta abierta que guíe al alumno a descubrirla
3. Usá lenguaje simple, cálido y alentador, apropiado para niños de 8-12 años
4. Referenciá el texto del alumno para que la pregunta sea concreta
5. Máximo 2 oraciones por respuesta
6. Si el alumno da una respuesta correcta, celebrala y avanzá al siguiente error con otra pregunta
```

`{errores_resumidos}` se genera en `chat_service` como: `"; ".join(f"{e['error_type']}: {e['text']}" for e in errores[:10])`.

---

### 7. Refactor models.py → models/ (sin cambios funcionales)

**Decisión**: mover los 6 modelos existentes a `models/existing.py`, crear `models/base.py` con el `Base` compartido, agregar `models/submission.py` y `models/chat.py`. El `__init__.py` re-exporta todo para que los imports actuales (`from app.models import User`) sigan funcionando sin cambios.

---

## API Shape

### POST /api/v1/submissions/analyze
```json
// Request: multipart/form-data
// Fields: file (UploadFile), class_id (UUID), grade (int), student_id (UUID)

// Response 200
{
  "submission_id": "uuid",
  "status": "processed",
  "feedback_inicial": "Tu escritura muestra buena creatividad...",
  "sugerencias_socraticas": ["¿Qué pasaría si revisaras la palabra 'casa'?"],
  "total_errors": 3,
  "requires_review": false
}
```

### GET /api/v1/submissions/{submission_id}
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "submitted_at": "2026-04-08T12:00:00Z",
  "status": "processed",
  "s3_key": null,
  "ai_result": {
    "transcripcion": "Ayer fui al parke...",
    "errores_detectados_agrupados": [
      {
        "text": "parke",
        "error_type": "ortografia_probable",
        "explicacion_pedagogica": "La letra 'k' no se usa en español para este sonido",
        "explicacion_docente": "Error ortográfico frecuente en 4to grado",
        "confianza_lectura": 0.92,
        "es_ambigua": false,
        "requiere_revision_docente": false,
        "ocurrencias": 1
      }
    ],
    "feedback_inicial": "...",
    "sugerencias_socraticas": ["..."],
    "razonamiento_docente": "..."
  },
  "total_errors": 1,
  "avg_confidence": 0.92
}
```

### POST /api/v1/submissions/{submission_id}/chat/start
```json
// Response 200 (nueva sesión o sesión activa existente)
{
  "session_id": "uuid",
  "is_new": true,
  "first_message": {
    "role": "assistant",
    "content": "Tu escritura muestra buena creatividad...",
    "created_at": "2026-04-08T12:01:00Z"
  }
}
```

### POST /api/v1/chat/{session_id}/message
```json
// Request
{ "content": "Creo que 'parke' se escribe con q" }

// Response 200
{
  "message_id": "uuid",
  "content": "¡Interesante! ¿Podés pensar en otras palabras que suenan igual pero se escriben diferente?",
  "turn_count": 2,
  "is_active": true
}
```

### GET /api/v1/classroom/{class_id}/dashboard
```json
[
  {
    "student_id": "uuid",
    "name": "Ana García",
    "entregas": 5,
    "total_errors": 12,
    "avg_confidence": 0.87,
    "requires_review": false
  }
]
```

---

## Risks / Trade-offs

- **[Risk] `asyncio.to_thread` para pipeline sync**: Si el pipeline es muy lento (>30s), el thread pool se puede saturar bajo carga concurrente. → **Mitigation**: timeout de 60s en `asyncio.wait_for`; en el futuro el pipeline AWS resuelve esto.
- **[Risk] Historial creciente en chat**: cada mensaje de turno 19 carga 19 mensajes de DB + los manda a OpenRouter (costo tokens). → **Mitigation**: límite de 20 turnos ya implementado; monitorear `tokens_used` para ajustar.
- **[Risk] Dos engines en el mismo proceso**: `engine` (sync) y `engine_async` apuntan a la misma DB. → **Mitigation**: pool separados, `pool_pre_ping=True` en ambos. No hay transacciones cross-engine.
- **[Risk] `class_id` FK sin tabla `classes`**: la tabla `courses` existe pero se llama `courses`, no `classes`. → **Mitigation**: `class_id` en submissions se guarda como UUID sin FK constraint en esta iteración; se agrega FK cuando se alineen los nombres.

## Open Questions

- ¿`student_id` en `POST /submissions/analyze` viene del JWT (alumno logueado) o como parámetro del body (docente sube en nombre del alumno)? — Por ahora: viene del body para que el docente pueda cargar en nombre de cualquier alumno.
- ¿El modelo a usar para el chat socrático es configurable o fijo `claude-sonnet-4-6`? — Por ahora: fijo en config.

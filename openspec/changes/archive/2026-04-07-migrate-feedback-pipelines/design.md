## Context

`feedback_engine_api` es una segunda API FastAPI que corre por separado y contiene los pipelines de análisis de audio y escritura manuscrita. El objetivo es consolidar todo el backend en `apps/api` para reducir complejidad operacional y tener un único servicio que levantar.

Los pipelines son completamente stateless — no dependen de la base de datos de `apps/api` y pueden coexistir con los routers existentes sin conflictos.

## Goals / Non-Goals

**Goals:**
- Copiar código de pipelines, services y routers al monorepo `apps/api`
- Actualizar imports a convención absoluta (`from app.pipelines...`)
- Registrar los nuevos endpoints en `main.py`
- Unificar dependencias Python

**Non-Goals:**
- Agregar autenticación a los nuevos endpoints
- Persistir resultados de análisis en la base de datos
- Migrar `handwrite_pipeline_aws`
- Modificar la lógica interna de los pipelines

## Decisions

### 1. Estructura de directorios

Los pipelines se ubican bajo `apps/api/app/` manteniendo la misma jerarquía:

```
apps/api/app/
├── pipelines/
│   ├── audio_pipeline/
│   │   ├── __init__.py
│   │   ├── pipeline.py
│   │   ├── call1.py
│   │   ├── call2.py
│   │   ├── models.py
│   │   ├── client.py
│   │   └── prompts.py
│   └── handwrite_pipeline/
│       ├── __init__.py
│       ├── pipeline.py
│       ├── call1.py
│       ├── call2.py
│       ├── models.py
│       ├── client.py
│       ├── prompts.py
│       ├── curriculum.py
│       └── conocimiento_esperado.json
├── services/
│   ├── audio_analyze.py
│   └── handwrite_analyze.py
└── routers/
    ├── audio_analyze.py    ← POST /audio-analyze/
    └── handwrite_analyze.py ← POST /handwrite-analyze/
```

**Alternativa descartada**: Mantener `feedback_engine_api` como submódulo. Añade complejidad de despliegue innecesaria.

### 2. Prefijo de rutas

Los endpoints no siguen el patrón `/api/v1/` del resto porque son endpoints de análisis de archivos (multipart), no de recursos CRUD. Se mantienen en la raíz:
- `POST /audio-analyze/`
- `POST /handwrite-analyze/`

**Alternativa**: `/api/v1/feedback/audio` — considerada para futuro cuando se agregue auth y persistencia.

### 3. Sin auth por ahora

Los nuevos routers se incluyen en `main.py` sin `dependencies=[Depends(get_current_user)]`. Se agregará auth cuando se integren con el flujo de actividades del alumno.

### 4. Variables de entorno LLM

Las variables necesarias para el cliente LLM (API key, base URL, modelos) se agregan a `.env.example` con valores de ejemplo. Se leen desde `os.environ` en los servicios (misma convención que `feedback_engine_api`).

## Risks / Trade-offs

- **[Risk] Path a `conocimiento_esperado.json`**: El pipeline de handwrite carga el JSON con una ruta relativa. Al cambiar de directorio puede romperse. → Mitigation: usar `Path(__file__).parent` para construir la ruta.
- **[Risk] Conflictos de dependencias**: `feedback_engine_api` puede tener versiones distintas de paquetes. → Mitigation: revisar el `requirements.txt` antes de mergear y usar el más reciente compatible.
- **[Trade-off] Sin versionado de API**: Los endpoints `/audio-analyze/` y `/handwrite-analyze/` no siguen `/api/v1/`. Aceptable por ahora dado que no hay clientes externos.

## Open Questions

- ¿Se elimina `feedback_engine_api` del repo o se archiva? (no bloqueante para esta tarea)

## Why

`feedback_engine_api` es una API separada con los pipelines de análisis de audio y escritura manuscrita. Para simplificar el stack del MVP y evitar mantener dos servicios, los pipelines deben vivir en `apps/api` junto con el resto del backend.

## What Changes

- Mover `pipelines/audio_pipeline/` y `pipelines/handwrite_pipeline/` a `apps/api/app/pipelines/`
- Mover `services/audio_analyze.py` y `services/handwrite_analyze.py` a `apps/api/app/services/`
- Mover `routers/audio_analyze.py` y `routers/handwrite_analyze.py` a `apps/api/app/routers/`
- Actualizar todos los imports a estilo absoluto (`from app.pipelines...`)
- Registrar los nuevos routers en `apps/api/app/main.py` (sin auth por ahora)
- Mergear dependencias de `feedback_engine_api` en `apps/api/requirements.txt`
- Agregar variables de entorno LLM al `.env.example`

## Capabilities

### New Capabilities

- `audio-analysis`: Endpoint `POST /audio-analyze/` — recibe audio + texto original + curso, devuelve transcripción, PPM, errores de lectura y feedback pedagógico
- `handwrite-analysis`: Endpoint `POST /handwrite-analyze/` — recibe imagen + curso, devuelve errores detectados, preguntas socráticas y notas para el docente

### Modified Capabilities

_(ninguna — no cambia comportamiento de endpoints existentes)_

## Impact

- `apps/api/app/main.py`: se agregan 2 routers nuevos
- `apps/api/app/pipelines/`: directorio nuevo con ~10 archivos
- `apps/api/app/services/`: directorio nuevo con 2 servicios
- `apps/api/app/routers/`: 2 routers nuevos
- `apps/api/requirements.txt`: nuevas dependencias (cliente LLM, procesamiento de audio/imagen)
- `.env.example`: nuevas variables de entorno para el cliente LLM
- `feedback_engine_api/`: queda sin uso (puede archivarse)

## Non-goals

- No se agrega autenticación a los nuevos endpoints (se hará en fase posterior)
- No se persisten los resultados en la base de datos (sin nuevas tablas)
- No se migra `handwrite_pipeline_aws` (permanece en `feedback_engine_api`)
- No se modifica el frontend
- No se implementa el chatbot (fase posterior)

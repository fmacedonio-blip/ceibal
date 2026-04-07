## 1. Copiar pipelines a apps/api

- [x] 1.1 Crear `apps/api/app/pipelines/__init__.py`
- [x] 1.2 Copiar `feedback_engine_api/pipelines/audio_pipeline/` → `apps/api/app/pipelines/audio_pipeline/`
- [x] 1.3 Copiar `feedback_engine_api/pipelines/handwrite_pipeline/` → `apps/api/app/pipelines/handwrite_pipeline/` (incluyendo `conocimiento_esperado.json`)
- [x] 1.4 Actualizar imports dentro de los archivos de `audio_pipeline` a rutas absolutas (`from app.pipelines.audio_pipeline...`)
- [x] 1.5 Actualizar imports dentro de los archivos de `handwrite_pipeline` a rutas absolutas (`from app.pipelines.handwrite_pipeline...`)
- [x] 1.6 Corregir la carga de `conocimiento_esperado.json` en `curriculum.py` usando `Path(__file__).parent`

## 2. Copiar services a apps/api

- [x] 2.1 Crear `apps/api/app/services/__init__.py`
- [x] 2.2 Copiar `feedback_engine_api/services/audio_analyze.py` → `apps/api/app/services/audio_analyze.py`
- [x] 2.3 Copiar `feedback_engine_api/services/handwrite_analyze.py` → `apps/api/app/services/handwrite_analyze.py`
- [x] 2.4 Actualizar imports en ambos servicios (`from app.pipelines...`, `from app.services...`)

## 3. Copiar routers a apps/api

- [x] 3.1 Copiar `feedback_engine_api/routers/audio_analyze.py` → `apps/api/app/routers/audio_analyze.py`
- [x] 3.2 Copiar `feedback_engine_api/routers/handwrite_analyze.py` → `apps/api/app/routers/handwrite_analyze.py`
- [x] 3.3 Actualizar imports en ambos routers (`from app.services...`)
- [x] 3.4 Registrar ambos routers en `apps/api/app/main.py` (sin auth)

## 4. Dependencias y variables de entorno

- [x] 4.1 Revisar `feedback_engine_api/requirements.txt` e identificar dependencias nuevas respecto a `apps/api/requirements.txt`
- [x] 4.2 Agregar dependencias faltantes a `apps/api/requirements.txt`
- [x] 4.3 Agregar variables de entorno LLM al `.env.example` (API key, base URL, modelos para audio y visión)

## 5. Verificación

- [x] 5.1 Levantar `apps/api` con `uvicorn app.main:app --reload` y verificar que no hay errores de import
- [ ] 5.2 Verificar que los endpoints `/audio-analyze/` y `/handwrite-analyze/` aparecen en `/docs`
- [ ] 5.3 Hacer una llamada de prueba a cada endpoint desde Swagger o curl

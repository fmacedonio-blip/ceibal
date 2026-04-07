# Feedback Engine API

API REST para análisis pedagógico de trabajos escolares: evalúa lecturas orales y textos manuscritos de alumnos de primaria, generando feedback diferenciado para alumnos y docentes.

---

## Overview

El sistema recibe audio o imágenes de trabajos de alumnos (grados 3–6) y, mediante un pipeline de dos llamadas a modelos de IA, produce análisis pedagógico estructurado:

- **Call 1 — Detección**: el modelo analiza el contenido crudo (transcripción, errores, métricas)
- **Call 2 — Síntesis**: un segundo modelo transforma los hallazgos en feedback pedagógico para el alumno y el docente

Toda la inferencia corre sobre modelos multimodales accedidos vía **OpenRouter**, lo que permite intercambiar modelos sin modificar la lógica del pipeline.

---

## Features

### Análisis de lectura oral (`/audio-analyze/`)
- Transcripción automática del audio
- Cálculo de PPM (palabras por minuto) y precisión
- Detección y tipificación de errores: sustituciones, omisiones, repeticiones, autocorrecciones
- Alertas de fluidez: lectura palabra por palabra, dificultad con polisílabos, ignorar puntuación, etc.
- Clasificación del nivel lector: `esperado`, `en_desarrollo`, `requiere_intervencion`
- Flag de baja calidad de audio

### Análisis de escritura manuscrita (`/handwrite-analyze/`)
- Transcripción del texto manuscrito desde imagen
- Detección de errores agrupados por tipo (concordancia, ortografía, vocabulario, puntuación, etc.)
- Scores de confianza por error — permite al docente priorizar revisión manual
- Sugerencias socráticas (preguntas orientadoras, sin dar la respuesta directa)
- Razonamiento docente con vínculo al currículum por grado
- Flag de imagen ilegible

### Transversal
- Feedback diferenciado: bloque alumno (motivador, concreto) y bloque docente (técnico, con tablas)
- Integración curricular: los errores se contextualizan según el bloque de contenido esperado para cada grado
- Tolerancia a respuestas LLM malformadas vía `json-repair`

---

## Tech Stack

| Capa | Tecnología |
|------|------------|
| Framework web | FastAPI |
| Servidor ASGI | Uvicorn |
| Validación de datos | Pydantic v2 |
| HTTP client | httpx |
| Modelos de IA | OpenRouter API |
| Metadatos de audio | mutagen |
| Renderizado de imágenes | Pillow |
| Variables de entorno | python-dotenv |

---

## Project Structure

```
feedback_engine_api/
├── main.py                        # App FastAPI + registro de routers
├── run.py                         # Entry point (uvicorn)
├── requirements.txt
├── .env.example                   # Plantilla de variables de entorno
├── routers/
│   ├── audio_analyze.py           # POST /audio-analyze/
│   └── handwrite_analyze.py       # POST /handwrite-analyze/
├── services/
│   ├── audio_analyze.py           # Orquesta el pipeline de audio
│   └── handwrite_analyze.py       # Orquesta el pipeline de escritura + carga currículum
├── schemas/
│   ├── audio_analyze.py           # AudioAnalyzeResponse
│   └── handwrite_analyze.py       # HandwriteAnalyzeResponse
└── pipelines/
    ├── audio_pipeline/
    │   ├── pipeline.py            # Flujo: call1 → validación → call2
    │   ├── call1.py               # Transcripción + análisis de errores
    │   ├── call2.py               # Generación de feedback pedagógico
    │   ├── client.py              # Cliente OpenRouter + utilidades de audio
    │   ├── models.py              # Modelos Pydantic del pipeline
    │   └── prompts.py             # System prompts + tablas PPM
    └── handwrite_pipeline/
        ├── pipeline.py            # Flujo: call1 → call2
        ├── call1.py               # Transcripción + detección de errores
        ├── call2.py               # Agrupación + feedback + sugerencias
        ├── client.py              # Cliente OpenRouter + utilidades de visión
        ├── models.py              # Modelos Pydantic del pipeline
        ├── curriculum.py          # Validación de grado + bloques curriculares
        └── prompts.py             # System prompts + builders de contexto
```
---

## Environment Variables

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `OPENROUTER_API_KEY` | API key para acceso a modelos vía OpenRouter | Sí |

---

## API Reference

### `POST /audio-analyze/`

Analiza una lectura oral y devuelve métricas de fluidez y feedback pedagógico.

**Parámetros (multipart/form-data)**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `audio` | file | Audio del alumno (mp3, wav, m4a, ogg, webm) |
| `texto_original` | string | Texto que el alumno debía leer |
| `nombre` | string | Nombre del alumno |
| `curso` | int | Grado escolar (3–6) |
| `modelo` | string | *(opcional)* Modelo de IA. Default: `xiaomi/mimo-v2-omni` |

**Response**

```json
{
  "transcripcion": "el niño fue al mercado...",
  "ppm": 72,
  "precision": 94.5,
  "nivel_orientativo": "esperado",
  "errores": [
    {
      "palabra_original": "mercado",
      "lo_que_leyo": "mercodo",
      "tipo": "sustitucion",
      "dudoso": false
    }
  ],
  "alertas_fluidez": ["lectura_palabra_por_palabra"],
  "calidad_audio_baja": false,
  "bloque_alumno": "¡Leíste muy bien! Notamos que...",
  "bloque_docente": "## Resumen técnico\n| Métrica | Valor |..."
}
```

---

### `POST /handwrite-analyze/`

Analiza un texto manuscrito desde una imagen y genera feedback pedagógico.

**Parámetros (multipart/form-data)**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `imagen` | file | Foto del trabajo manuscrito (jpeg, png, webp, gif) |
| `curso` | int | Grado escolar (3–6) |
| `modelo` | string | *(opcional)* Modelo de IA. Default: `google/gemini-2.5-flash-preview` |

**Response**

```json
{
  "transcripcion": "El sol sale todos los dias...",
  "errores_detectados_agrupados": [
    {
      "error_type": "ortografia",
      "ocurrencias": 3,
      "descripcion": "Omisión de tilde en palabras agudas",
      "confianza_lectura": 0.92,
      "requiere_revision_docente": false
    }
  ],
  "puntos_de_mejora": [...],
  "ambiguedades_lectura": [],
  "sugerencias_socraticas": [
    "¿Cómo crees que se escribe una palabra cuando termina en vocal?"
  ],
  "feedback_inicial": "¡Tu texto tiene ideas muy claras!...",
  "razonamiento_docente": "El alumno muestra dominio de...",
  "lectura_insuficiente": false
}
```

---

### `GET /health`

```json
{ "status": "ok" }
```

---

## Design Decisions

**Pipeline de dos llamadas**  
Separar detección (Call 1) de síntesis pedagógica (Call 2) tiene dos ventajas: permite ajustar los prompts de cada etapa de forma independiente, y hace el debugging mucho más directo — si el feedback es incorrecto, es fácil saber si el problema está en la detección o en la generación.

**Scores de confianza en errores**  
Cada error detectado lleva un score `confianza_lectura` (0.0–1.0). En el caso de escritura manuscrita, donde la imagen puede ser ambigua, esto le da al docente visibilidad sobre qué errores son seguros y cuáles requieren revisión manual, en lugar de descartar automáticamente los casos inciertos.

**Abstracción de modelos vía OpenRouter**  
La lógica de negocio no está acoplada a ningún modelo específico. OpenRouter actúa como capa de acceso uniforme, permitiendo cambiar de modelo (ej: pasar de Gemini a GPT-4o) sin tocar los pipelines.

**Tolerancia a respuestas malformadas**  
Los LLMs ocasionalmente devuelven JSON con trailing commas u otros problemas menores. La librería `json-repair` permite parsear estas respuestas sin fallar el pipeline, evitando errores en producción por artefactos de formato.

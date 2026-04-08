# API Reference — Submissions & Chat Socrático

Base URL: `http://localhost:8000` (dev) | `https://api.ceibal.edu.uy` (prod)

Auth: todas las rutas requieren `Authorization: Bearer <token>`.
Token de dev: `POST /auth/dev-login { "role": "alumno" | "docente" }`.

---

## Flujo principal

### Handwrite (imagen de escritura)
```
1. POST /handwrite-analyze/                  → análisis completo con transcripcion_html (sin auth, sin persistencia)
   — o —
   POST /api/v1/submissions/analyze          → submission_id + feedback (con auth, persiste en DB)
2. POST /api/v1/submissions/{id}/chat/start  → session_id + primer mensaje del bot
3. POST /api/v1/chat/{session_id}/message    → respuesta socrática del bot
4. GET  /api/v1/chat/{session_id}/history    → historial completo
```

### Audio (lectura oral)
```
1. POST /api/v1/submissions/analyze-audio    → submission_id + bloque_alumno + métricas
2. POST /api/v1/submissions/{id}/chat/start  → mismo flujo que handwrite
3. POST /api/v1/chat/{session_id}/message    → respuesta socrática sobre lectura oral
4. GET  /api/v1/chat/{session_id}/history    → historial completo
```

> El chat funciona igual para ambos tipos — el backend detecta el `submission_type` automáticamente y ajusta el system prompt socrático.

---

## POST /handwrite-analyze/

Corre el pipeline de análisis sobre una imagen de escritura y devuelve el resultado completo incluyendo `transcripcion_html`. **No requiere auth y no persiste en base de datos.** Pensado para uso directo desde la app del alumno o para pruebas.

**Request** — `multipart/form-data`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `imagen` | file | Imagen del cuaderno (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) |
| `curso` | integer | Grado escolar (3, 4, 5 o 6) |
| `modelo` | string | Modelo de IA a usar (opcional, default: `google/gemini-3.1-flash-lite-preview`) |

**Response 200**

```json
{
  "transcripcion": "Habia una vez un dragon que vivia en el bosque. El dragon era asul y asia fuego.",
  "transcripcion_html": "<error msg=\"había lleva tilde en la i.\">Habia</error> una vez un <error msg=\"dragón lleva tilde en la o.\">dragon</error> que <error msg=\"vivía termina con a.\">vivia</error> en el bosque. El <error msg=\"dragón lleva tilde en la o.\">dragon</error> era <error msg=\"azul se escribe con z.\">asul</error> y <error msg=\"hacía lleva h inicial y tilde en la i.\">asia</error> fuego.",
  "errores_detectados_agrupados": [
    {
      "text": "asul",
      "error_type": "ortografia_probable",
      "ocurrencias": 1,
      "correccion_alumno": "azul se escribe con z",
      "explicacion_pedagogica": "Esta palabra suena parecido pero tiene una letra diferente.",
      "explicacion_docente": "Error ortográfico: 'azul' con z.",
      "confianza_lectura": 0.95,
      "es_ambigua": false,
      "requiere_revision_docente": false
    }
  ],
  "puntos_de_mejora": [
    {
      "tipo": "variedad_lexica",
      "descripcion": "Usaste mucho el conector 'y'.",
      "explicacion_pedagogica": "Podés reemplazar algunos 'y' por 'además' o 'también'.",
      "explicacion_docente": "Conector abusado: 'y' aparece 6 veces."
    }
  ],
  "ambiguedades_lectura": [],
  "sugerencias_socraticas": [
    "¿Cómo creés que se escribe la palabra 'asul'?",
    "¿Qué pasa cuando una oración no tiene punto al final?"
  ],
  "feedback_inicial": "¡Tu texto tiene mucha imaginación! Hay algunas palabras que podemos mejorar juntos.",
  "razonamiento_docente": "El alumno presenta errores ortográficos esperables para el tramo...",
  "lectura_insuficiente": false
}
```

### Campo `transcripcion_html`

La transcripción con cada error envuelto en un tag `<error>`:

```html
<error msg="azul se escribe con z">asul</error>
```

- `msg`: explicación directa y no socrática para el alumno (`correccion_alumno`). Sin mayúscula inicial salvo nombre propio.
- El contenido del tag es la palabra tal como la escribió el alumno.
- Si `correccion_alumno` está vacío, se usa `explicacion_pedagogica` como fallback.
- Las comillas dobles dentro de `msg` se escapan como `&quot;`.

### Campo `correccion_alumno`

Presente en cada objeto de `errores_detectados_agrupados`. Frase corta (máx. 10 palabras) que indica directamente la forma correcta. No es socrática. Ejemplos:

| Error | `correccion_alumno` |
|-------|---------------------|
| `asul` | `"azul se escribe con z"` |
| `abia` | `"había lleva h al principio"` |
| `dragon` | `"dragón lleva tilde en la o"` |
| `viví` | `"viví lleva tilde en la i"` |

**Errores**

| Status | Cuándo |
|--------|--------|
| 400 | Archivo vacío o curso inválido |
| 415 | Tipo de archivo no soportado |
| 500 | Error en el pipeline de IA |

---

## POST /api/v1/submissions/analyze

Sube una imagen de escritura, corre el análisis de IA y persiste el resultado en la base de datos.

> Rol requerido: `docente`

**Request** — `multipart/form-data`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `file` | file | Imagen del cuaderno (`image/jpeg`, `image/png`, `image/webp`, `image/gif`) |
| `student_id` | UUID | ID del alumno |
| `class_id` | UUID | ID del curso/clase |
| `grade` | integer | Grado escolar (3, 4, 5 o 6) |

**Response 200**

```json
{
  "submission_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "processed",
  "feedback_inicial": "¡Tu texto muestra mucha creatividad! Hay algunas palabras que podemos revisar juntos.",
  "sugerencias_socraticas": [
    "¿Cómo creés que se escribe la palabra 'parke'?",
    "¿Qué pasa cuando una oración no tiene punto al final?"
  ],
  "total_errors": 3,
  "requires_review": false
}
```

> El detalle completo (transcripción, errores, `transcripcion_html`, etc.) está disponible via `GET /api/v1/submissions/{id}` en `ai_result`.

**Errores**

| Status | Cuándo |
|--------|--------|
| 400 | Archivo vacío o grado inválido |
| 415 | Tipo de archivo no soportado |
| 500 | Error en el pipeline de IA |

---

## POST /api/v1/submissions/analyze-audio

Sube un archivo de audio de lectura oral, corre el pipeline de análisis y persiste el resultado.

> Rol requerido: `docente`

**Request** — `multipart/form-data`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `file` | file | Audio (`audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/mp4`, `audio/m4a`, `audio/ogg`, `audio/webm`) |
| `student_id` | UUID | ID del alumno |
| `class_id` | UUID | ID del curso/clase |
| `grade` | integer | Grado escolar (3, 4, 5 o 6) |
| `texto_original` | string | El texto que el alumno debía leer en voz alta |
| `nombre` | string | Nombre del alumno (requerido por el pipeline de audio) |

**Response 200**

```json
{
  "submission_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "processed",
  "bloque_alumno": "¡Leíste el texto con buena velocidad! Prestá atención a estas palabras...",
  "nivel_orientativo": "esperado",
  "ppm": 82.5,
  "precision": 94.2,
  "total_errors": 3,
  "requires_review": false
}
```

> El detalle completo (transcripción, errores individuales, etc.) está disponible via `GET /api/v1/submissions/{id}`.
> Timeout interno: 90 segundos. Se recomienda audio de máximo 2 minutos.

**Errores**

| Status | Cuándo |
|--------|--------|
| 400 | Archivo vacío, grado inválido, `texto_original` o `nombre` vacíos |
| 415 | Tipo de audio no soportado |
| 500 | Error en el pipeline de IA |

---

## GET /api/v1/submissions/{submission_id}

Detalle completo de una submission, incluyendo el resultado de la IA.

**Response 200**

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "student_id": "uuid",
  "teacher_id": "uuid",
  "class_id": "uuid",
  "grade": 4,
  "s3_key": null,
  "submitted_at": "2026-04-08T12:00:00Z",
  "processed_at": "2026-04-08T12:00:05Z",
  "status": "processed",
  "total_errors": 3,
  "spelling_errors": 2,
  "concordance_errors": 1,
  "ambiguous_count": 0,
  "avg_confidence": 0.91,
  "submission_type": "handwrite",
  "requires_review": false,
  "lectura_insuficiente": false,
  "ai_result": {
    "transcripcion": "Ayer fui al parke con mi familia...",
    "transcripcion_html": "Ayer fui al <error msg=\"parque se escribe con qu\">parke</error> con mi familia...",
    "errores_detectados_agrupados": [
      {
        "text": "parke",
        "error_type": "ortografia_probable",
        "ocurrencias": 1,
        "correccion_alumno": "parque se escribe con qu",
        "explicacion_pedagogica": "Esta palabra suena igual pero se escribe diferente.",
        "explicacion_docente": "Error ortográfico: 'parque' con qu.",
        "confianza_lectura": 0.95,
        "es_ambigua": false,
        "requiere_revision_docente": false
      }
    ],
    "puntos_de_mejora": [
      {
        "tipo": "variedad_lexica",
        "descripcion": "Usaste mucho el conector 'y'.",
        "explicacion_pedagogica": "Podés reemplazar algunos 'y' por 'además' o 'también'.",
        "explicacion_docente": "Conector abusado: 'y' aparece 6 veces."
      }
    ],
    "ambiguedades_lectura": [],
    "sugerencias_socraticas": [
      "¿Cómo creés que se escribe la palabra 'parke'?",
      "¿Qué otro conector podrías usar en vez de 'y'?"
    ],
    "feedback_inicial": "¡Tu texto muestra mucha creatividad!",
    "razonamiento_docente": "El alumno presenta errores ortográficos esperables para 4to grado...",
    "lectura_insuficiente": false
  }
}
```

> `submission_type` puede ser `"handwrite"` o `"audio"`. El frontend usa este campo para saber cómo renderizar el `ai_result`.
> `transcripcion_html` solo está presente en submissions de tipo `handwrite`.

**Errores**

| Status | Cuándo |
|--------|--------|
| 403 | El alumno intenta ver la submission de otro alumno |
| 404 | Submission no encontrada |

---

## GET /api/v1/submissions/{submission_id}/chat-session

Devuelve la sesión de chat activa más reciente para una submission. Permite al docente obtener el `session_id` para luego consultar el historial.

> Roles: `alumno` (solo su propia submission) · `docente` · `director` · `inspector`

**Response 200**

```json
{
  "session_id": "8a1b2c3d-4e5f-6789-abcd-ef0123456789",
  "student_id": "uuid",
  "turn_count": 3,
  "is_active": true,
  "started_at": "2026-04-08T12:01:00Z",
  "last_message_at": "2026-04-08T12:05:30Z"
}
```

**Errores**

| Status | Cuándo |
|--------|--------|
| 403 | Alumno intenta ver sesión de otra submission |
| 404 | La submission no tiene ninguna sesión de chat iniciada |

---

## POST /api/v1/submissions/{submission_id}/chat/start

Inicia una sesión de chat para una submission ya procesada. **No re-analiza** — solo busca el resultado guardado en la base de datos por `submission_id`. Si ya existe una sesión activa, la devuelve (idempotente).

> El `submission_id` puede venir de un análisis hecho en cualquier momento anterior — no es necesario re-subir la imagen o el audio.

**Request** — sin body

**Response 200**

```json
{
  "session_id": "8a1b2c3d-4e5f-6789-abcd-ef0123456789",
  "is_new": true,
  "first_message": {
    "id": "uuid",
    "role": "assistant",
    "content": "¡Tu texto muestra mucha creatividad! Hay algunas palabras que podemos revisar juntos.",
    "created_at": "2026-04-08T12:01:00Z"
  }
}
```

> `is_new: false` si ya existía una sesión activa — el `first_message` es el mismo feedback inicial.

**Errores**

| Status | Cuándo |
|--------|--------|
| 403 | Solo el rol `alumno` puede iniciar chat / submission pertenece a otro alumno |
| 404 | Submission no encontrada |
| 422 | Submission aún no procesada, o falló el procesamiento |

---

## Cómo funciona el chatbot

El chatbot es **socrático**: nunca da la respuesta correcta directamente, siempre guía al alumno con preguntas abiertas.

### Historial y contexto

En cada turno el backend:
1. Carga todo el historial de mensajes de la sesión desde la DB
2. Construye un array de mensajes con el historial completo
3. Lo envía al LLM junto con un system prompt que incluye el resultado del análisis

```
[system]    contexto del análisis (transcripción, errores, feedback)
[assistant] primer mensaje de bienvenida/feedback
[user]      mensaje del alumno
[assistant] respuesta socrática
[user]      siguiente mensaje
...
```

El modelo no tiene memoria propia — el historial se reconstruye desde la DB en cada llamada.

### System prompt

Se construye dinámicamente según el tipo de submission:

- **Handwrite**: transcripción del texto + errores detectados + feedback inicial
- **Audio**: texto original + lo que leyó el alumno + palabras por minuto + precisión + errores

### Límites

| Parámetro | Valor |
|-----------|-------|
| Turnos máximos por sesión | 20 |
| Max tokens por respuesta | 256 |
| Modelo | `claude-sonnet-4-6` vía OpenRouter |

Al llegar a 20 turnos la sesión se cierra (`is_active: false`) y el siguiente mensaje devuelve 422.

### Persistencia

Cada mensaje (rol `user` y `assistant`) se guarda en la DB. El historial completo está disponible en cualquier momento via `GET /api/v1/chat/{session_id}/history`, ordenado por `created_at` ascendente.

---

## POST /api/v1/chat/{session_id}/message

Envía un mensaje del alumno y recibe la respuesta socrática del bot.

> Rol requerido: `alumno`

**Request** — `application/json`

```json
{
  "content": "Creo que 'parke' se escribe con q"
}
```

**Response 200**

```json
{
  "message_id": "uuid",
  "content": "¡Muy bien que lo notaste! ¿Podés pensar en otras palabras que suenan parecido pero se escriben con 'qu'?",
  "turn_count": 2,
  "is_active": true
}
```

> Cuando `turn_count` llega a 20, `is_active` se vuelve `false` y el siguiente mensaje devuelve 422.

**Errores**

| Status | Cuándo |
|--------|--------|
| 403 | Solo el rol `alumno` puede enviar mensajes / session de otro alumno |
| 404 | Sesión no encontrada |
| 422 | Sesión terminada (`turn_count >= 20`) |

---

## GET /api/v1/chat/{session_id}/history

Devuelve el historial completo del chat. Accesible por el alumno dueño de la sesión y por roles docentes.

> Roles: `alumno` (solo su propia sesión) · `docente` · `director` · `inspector`

**Response 200**

```json
{
  "session": {
    "id": "8a1b2c3d-4e5f-6789-abcd-ef0123456789",
    "submission_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "student_id": "uuid",
    "started_at": "2026-04-08T12:01:00Z",
    "last_message_at": "2026-04-08T12:05:30Z",
    "turn_count": 3,
    "is_active": true
  },
  "messages": [
    {
      "id": "uuid",
      "role": "assistant",
      "content": "¡Tu texto muestra mucha creatividad!...",
      "created_at": "2026-04-08T12:01:00Z"
    },
    {
      "id": "uuid",
      "role": "user",
      "content": "Creo que 'parke' se escribe con q",
      "created_at": "2026-04-08T12:03:00Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "¡Muy bien que lo notaste!...",
      "created_at": "2026-04-08T12:03:01Z"
    }
  ]
}
```

> Los mensajes siempre vienen ordenados por `created_at` ascendente (de más viejo a más nuevo).

**Errores**

| Status | Cuándo |
|--------|--------|
| 403 | Un alumno intenta ver el historial de otro alumno |
| 404 | Sesión no encontrada |

---

## GET /api/v1/classroom/{class_id}/dashboard

Métricas por alumno para el panel del docente.

**Query params** (opcionales): `desde=2026-03-01` · `hasta=2026-04-08`

**Response 200**

```json
[
  {
    "student_id": "uuid",
    "name": null,
    "entregas": 5,
    "total_errors": 14,
    "avg_confidence": 0.88,
    "requires_review": false
  }
]
```

> `name` es `null` por ahora — se puede enriquecer cruzando con `/api/v1/students/{id}`.

---

## GET /api/v1/classroom/{class_id}/error-patterns

Errores más frecuentes en la clase en los últimos N días.

**Query params**: `dias=30` (default)

**Response 200**

```json
[
  { "error_type": "ortografia_probable", "total_ocurrencias": 47, "alumnos_afectados": 12 },
  { "error_type": "concordancia",        "total_ocurrencias": 21, "alumnos_afectados": 8  },
  { "error_type": "conector_abusado",    "total_ocurrencias": 15, "alumnos_afectados": 6  }
]
```

Ordenado por `total_ocurrencias` descendente.

---

## GET /api/v1/students/{student_id}/progress

Evolución semanal de errores y confianza para un gráfico de línea.

**Response 200**

```json
[
  { "semana": "2026-W12", "promedio_errores": 5.2, "avg_confidence": 0.84 },
  { "semana": "2026-W13", "promedio_errores": 4.1, "avg_confidence": 0.87 },
  { "semana": "2026-W14", "promedio_errores": 3.0, "avg_confidence": 0.91 }
]
```

Solo incluye semanas que tengan al menos una submission con `status='processed'`.

---

## Tipos de error (`error_type`)

| Valor | Descripción |
|-------|-------------|
| `ortografia_probable` | Palabra escrita incorrectamente, trazo legible (incluye tildes faltantes) |
| `concordancia` | Falta de acuerdo género/número/persona |
| `repeticion_consecutiva` | Misma palabra dos veces seguidas |
| `repeticion_excesiva` | Misma palabra demasiadas veces en el texto |
| `conector_abusado` | "y", "entonces", etc. repetido más de 3 veces |
| `puntuacion_probable` | Signos de puntuación incorrectos o ausentes |
| `oracion_incompleta` | Oración sin sujeto, verbo o predicado |
| `vocabulario_inadecuado` | Palabra fuera del registro esperado para el grado |
| `texto_muy_corto` | Texto por debajo del mínimo esperado para el tramo |

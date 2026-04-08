# API Reference — Submissions & Chat Socrático

Base URL: `http://localhost:8000` (dev) | `https://api.ceibal.edu.uy` (prod)

Auth: todas las rutas requieren `Authorization: Bearer <token>`.
Token de dev: `POST /auth/dev-login { "role": "alumno" | "docente" }`.

---

## Flujo principal

```
1. POST /api/v1/submissions/analyze     → submission_id + feedback
2. POST /api/v1/submissions/{id}/chat/start  → session_id + primer mensaje del bot
3. POST /api/v1/chat/{session_id}/message   → respuesta socrática del bot
4. GET  /api/v1/chat/{session_id}/history   → historial completo
```

---

## POST /api/v1/submissions/analyze

Sube una imagen de escritura, corre el análisis de IA y persiste el resultado.

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

**Errores**

| Status | Cuándo |
|--------|--------|
| 400 | Archivo vacío o grado inválido |
| 415 | Tipo de archivo no soportado |
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
  "requires_review": false,
  "lectura_insuficiente": false,
  "ai_result": {
    "transcripcion": "Ayer fui al parke con mi familia...",
    "errores_detectados_agrupados": [
      {
        "text": "parke",
        "error_type": "ortografia_probable",
        "explicacion_pedagogica": "Esta palabra suena igual pero se escribe diferente.",
        "explicacion_docente": "Error ortográfico: 'parque' con qu.",
        "confianza_lectura": 0.95,
        "es_ambigua": false,
        "requiere_revision_docente": false,
        "ocurrencias": 1
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

**Errores**

| Status | Cuándo |
|--------|--------|
| 403 | El alumno intenta ver la submission de otro alumno |
| 404 | Submission no encontrada |

---

## POST /api/v1/submissions/{submission_id}/chat/start

Inicia una sesión de chat para una submission. Si ya existe una sesión activa, la devuelve (idempotente).

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
| 403 | Solo el rol `alumno` puede iniciar chat |
| 404 | Submission no encontrada |
| 422 | La submission todavía no está procesada (`status != 'processed'`) |

---

## POST /api/v1/chat/{session_id}/message

Envía un mensaje del alumno y recibe la respuesta socrática del bot.

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

Devuelve el historial completo del chat. Accesible por el alumno dueño de la sesión y por docentes.

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
| `ortografia_probable` | Palabra escrita incorrectamente, trazo legible |
| `concordancia` | Falta de acuerdo género/número/persona |
| `repeticion_consecutiva` | Misma palabra dos veces seguidas |
| `repeticion_excesiva` | Misma palabra demasiadas veces en el texto |
| `conector_abusado` | "y", "entonces", etc. repetido más de 3 veces |
| `puntuacion_probable` | Signos de puntuación incorrectos o ausentes |
| `oracion_incompleta` | Oración sin sujeto, verbo o predicado |
| `vocabulario_inadecuado` | Palabra fuera del registro esperado para el grado |
| `texto_muy_corto` | Texto por debajo del mínimo esperado para el tramo |

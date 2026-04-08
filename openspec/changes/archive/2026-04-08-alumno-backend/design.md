# Design — alumno-backend

## Puente entre los dos mundos de IDs

El modelo `Student` (mundo docente) usa `Integer` como PK. El modelo `Submission` usa `UUID` para `student_id`. Para conectarlos sin romper nada existente, se agrega una columna `student_uuid` a `Student`:

```
students
├── id: Integer (PK) ← mundo docente, sin cambios
├── student_uuid: UUID (unique, default=uuid4) ← nuevo
└── ... resto sin cambios
```

El JWT del alumno incluye `student_uuid` como claim extra. Cuando el alumno sube una tarea, el frontend usa ese UUID como `student_id` al llamar a `/submissions/analyze`.

## Extensión del modelo Activity

```
activities
├── id: Integer (PK)
├── student_id: Integer (FK → students.id)
├── name: String ← ya existe (título de la tarea)
├── date: String ← ya existe
├── score: Float ← ya existe
├── status: String ← ya existe
├── description: Text (nullable) ← NUEVO
├── type: String (nullable) ← NUEVO: "escritura" | "lectura"
└── subject: String (default="Lengua") ← NUEVO
```

## JWT del alumno

```json
{
  "sub": "alumno-maria",
  "role": "alumno",
  "name": "María Suárez",
  "student_uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "student_id": 1,
  "iat": 1712534400,
  "exp": 1712620800
}
```

`/auth/dev-login` acepta body: `{ "role": "alumno", "student_id": 1 }` — busca el Student por ID, genera JWT con ambos IDs.

## Endpoints nuevos

### GET /api/v1/me
```json
{
  "id": 1,
  "student_uuid": "f47ac10b-...",
  "name": "María Suárez",
  "course": { "id": 1, "name": "4to A", "shift": "Turno Matutino" }
}
```

### GET /api/v1/me/tasks
```json
[
  {
    "id": 3,
    "name": "Dictado: El río y el mar",
    "description": "Escribe el texto que te va a dictar el sistema. Prestá atención a las mayúsculas y los puntos.",
    "type": "escritura",
    "subject": "Lengua",
    "status": "PENDIENTE_DE_REVISION",
    "submission_id": null
  },
  {
    "id": 4,
    "name": "Lectura en voz alta: La tortuga y la liebre",
    "description": "Leé el texto en voz alta lo más claro que puedas. Tomá tu tiempo.",
    "type": "lectura",
    "subject": "Lengua",
    "status": "COMPLETADA",
    "submission_id": "a1b2c3d4-..."
  }
]
```

### GET /api/v1/submissions/{id}/correction
Retorna los datos de la corrección separados en capa alumno y capa docente:

```json
{
  "submission_id": "a1b2c3d4-...",
  "submission_type": "handwrite",
  "status": "processed",

  "alumno": {
    "feedback": "¡Muy bien! Tu escritura se entiende claramente...",
    "transcripcion_html": "El <mark class='error'>niño</mark> fue al río...",
    "errores": [
      {
        "texto": "niño",
        "correccion": "niño",
        "explicacion": "Esta palabra lleva tilde en la ñ. Se escribe así: niño."
      }
    ],
    "consejos": ["Revisá el uso de las tildes antes de entregar.", "..."]
  },

  "docente": {
    "razonamiento": "El alumno muestra dificultades en reglas de acentuación...",
    "errores": [
      {
        "texto": "niño",
        "tipo": "ortografia",
        "explicacion_tecnica": "Error de tilde diacrítica en pronombre...",
        "ocurrencias": 2,
        "confianza": 0.94
      }
    ],
    "puntos_de_mejora": [
      { "tipo": "ortografia", "descripcion": "Acentuación diacrítica", "accion_sugerida": "..." }
    ],
    "requires_review": false
  }
}
```

Para `submission_type: "audio"`:
```json
{
  "alumno": {
    "feedback": "¡Leíste muy bien! Fuiste rápido y claro...",
    "errores": [
      {
        "palabra_original": "mariposa",
        "lo_que_leyo": "maripos",
        "tipo": "omision",
        "explicacion": "Omitiste la última letra de esta palabra. La palabra completa es: mariposa."
      }
    ],
    "consejos": ["Respirá antes de empezar para no apurarte al final.", "..."]
  },
  "docente": {
    "feedback_tecnico": "Nivel: en_desarrollo. PPM: 87. Precisión: 91%...",
    "ppm": 87,
    "precision": 91.2,
    "nivel_orientativo": "en_desarrollo",
    "errores": [ ... ],
    "alertas_fluidez": ["Pausas largas en párrafo 2", "..."]
  }
}
```

## Arquitectura de capas en los prompts

Los prompts de call2 (ambos pipelines) ya tienen la estructura de generar campos separados. El ajuste es:

1. **Tono pedagógico** (`explicacion_pedagogica`, `bloque_alumno`, `consejos_para_mejorar`): vocabulario simple, frases cortas, tono alentador. Ejemplo guía en el prompt: _"Escribí como si le hablaras a un niño de 9 años que acaba de terminar una tarea y necesita entender qué mejorar sin desanimarse"_

2. **Tono técnico** (`explicacion_docente`, `razonamiento_docente`, `bloque_docente`): terminología pedagógica, referencia al currículo, sin simplificaciones.

## Seed data

```
Docente: Ana Martínez, 4to A - Turno Matutino

Alumnos:
  1. María Suárez    (student_uuid: uuid fijo)  → 2 tareas: 1 escritura + 1 lectura
  2. Lucas Rodríguez (student_uuid: uuid fijo)  → 2 tareas: 1 escritura + 1 lectura
  3. Valentina Pérez (student_uuid: uuid fijo)  → 2 tareas: 1 escritura + 1 lectura

Tareas (status: PENDIENTE_DE_REVISION para todas — sin entregar aún):
  Escritura: "Dictado: El río y el mar"
    description: "Escribe el texto que te va a dictar el sistema..."
    type: "escritura", subject: "Lengua"
  Lectura: "Lectura: La tortuga y la liebre"
    description: "Leé el texto en voz alta lo más claro que puedas..."
    type: "lectura", subject: "Lengua"
```

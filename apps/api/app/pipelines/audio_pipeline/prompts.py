import json
from typing import Any


SYSTEM_CALL1 = """\
Sos un asistente especializado en análisis de lectura oral para alumnos de primaria.

Recibirás un audio de la lectura oral de un alumno, junto con el texto original que debía leer, su nombre, su curso escolar y la duración exacta del audio en segundos (ya calculada por el sistema).

Tu tarea es producir un análisis estructurado en JSON con las siguientes métricas:

## Proceso

1. Transcribí el audio palabra por palabra, incluyendo repeticiones, trabadas y autocorrecciones.
2. Compará con el texto original. Identificá cada palabra que fue sustituida, omitida, repetida o autocorregida.
3. Contá las palabras del texto original.
4. Determiná cuántas palabras fueron leídas correctamente (las autocorrecciones cuentan como correctas).
5. Usá la duración exacta provista en el prompt (NO la estimes vos).
6. Calculá: PPM = palabras_correctas × 60 / duracion_seg
7. Calculá: precision = palabras_correctas / palabras_texto_original × 100

## Tipos de error

- `sustitucion`: leyó una palabra diferente a la original
- `omision`: se saltó una palabra del texto original
- `repeticion`: repitió una palabra (sin autocorrección)
- `autocorreccion`: se trabó pero corrigió solo (cuenta como correcto)

## Alertas de fluidez

Incluí solo las que aplican:
- `dificultad_polisilabas`: dificultad notable en palabras de 3+ sílabas
- `lectura_palabra_por_palabra`: lee sin fraseo ni entonación natural
- `no_respeta_pausas`: no hace pausas en puntos, comas o signos de pregunta
- `silabeo`: silabea en lugar de leer palabras completas
- `velocidad_alta_con_errores`: lee muy rápido pero con muchos errores

## Calidad de audio

Si la calidad del audio es muy mala para transcribir con confianza, marcá `calidad_audio_baja: true` y explicá en `notas_calidad`.

## Formato de salida

Respondé ÚNICAMENTE con un JSON válido con esta estructura exacta:

```json
{
  "transcripcion": "...",
  "duracion_estimada_seg": 45.0,  // usá el valor exacto provisto, no lo estimes
  "palabras_texto_original": 30,
  "palabras_correctas": 27,
  "ppm": 36.0,
  "precision": 90.0,
  "errores": [
    {
      "palabra_original": "corría",
      "lo_que_leyo": "corria",
      "tipo": "sustitucion",
      "dudoso": false
    }
  ],
  "alertas_fluidez": [],
  "calidad_audio_baja": false,
  "notas_calidad": ""
}
```

No agregues texto fuera del JSON.
"""


def build_call1_prompt(texto_original: str, nombre: str, curso: int, duracion_seg: float) -> str:
    return f"""\
## Alumno

- Nombre: {nombre}
- Curso: {curso}°

## Duración exacta del audio

{duracion_seg:.2f} segundos (usá este valor para calcular PPM, no lo estimes)

## Texto original que debía leer

{texto_original}

Analizá el audio adjunto según las instrucciones del sistema.
"""


SYSTEM_CALL2 = """\
Sos un asistente pedagógico especializado en fluidez lectora para chicos de 8 a 12 años en escuelas argentinas.

Recibirás el resultado estructurado del análisis de lectura oral de un alumno. Tu tarea es generar dos bloques de feedback.

## Bloque 1 — Para el alumno

**Tono**: Cercano, motivador. Tuteá. Usá el nombre del alumno. Adaptá el vocabulario a su edad (más simple para cursos 3°-4°, sin infantilizar para 5°-6°). Elogiá el esfuerzo y la estrategia, nunca la capacidad ("te diste cuenta y lo corregiste" en vez de "sos muy inteligente").

**Estructura**:
1. **Lo que hiciste bien** — 2-3 observaciones concretas mencionando palabras específicas.
2. **Palabras donde te trabaste** — Máximo 3. Usá lenguaje natural:
   - Sustitución: "Donde dice X leíste Y."
   - Omisión: "Te saltaste la palabra X."
   - Trabado/repetición: "En X te costó un poquito."
3. **Las pausas** — Si no respetó puntos, comas o signos de pregunta, señalá la frase exacta y explicá la pausa de forma simple.
4. **Un consejo para la próxima** — Una sola acción concreta y practicable.

**Reglas**:
- Empezá siempre con algo positivo.
- Nunca uses notas numéricas, porcentajes ni jerga técnica.
- Si el rendimiento fue bajo, enfocate en el esfuerzo y lo que puede mejorar.
- Máximo 250 palabras.
- Escribí en español rioplatense.

---

## Bloque 2 — Panel docente

**Tono**: Técnico, conciso. Usá tablas markdown.

Incluí:
1. Tabla resumen con: Alumno, Estado, Palabras del texto, Palabras correctas, Duración estimada, PPM, Precisión
2. Tabla de errores con: Palabra original | Lo que leyó | Tipo
3. Alertas de fluidez (solo las detectadas)
4. Nivel orientativo según la tabla PPM del curso/edad
5. Sugerencia pedagógica: una acción concreta para implementar esta semana

---

## Formato de salida

Respondé ÚNICAMENTE con un JSON válido:

```json
{
  "bloque_alumno": "...",
  "bloque_docente": "..."
}
```

No agregues texto fuera del JSON.
"""


PPM_TABLE = {
    8:  {"esperado": (85, 110),  "en_desarrollo": (65, 84)},
    9:  {"esperado": (100, 125), "en_desarrollo": (80, 99)},
    10: {"esperado": (110, 135), "en_desarrollo": (90, 109)},
    11: {"esperado": (120, 145), "en_desarrollo": (100, 119)},
    12: {"esperado": (130, 155), "en_desarrollo": (110, 129)},
}

CURSO_TO_EDAD = {3: 8, 4: 9, 5: 10, 6: 11}


def clasificar_nivel(ppm: float, curso: int) -> str:
    edad = CURSO_TO_EDAD.get(curso, 9)
    rangos = PPM_TABLE.get(edad, PPM_TABLE[9])
    esperado_min, _ = rangos["esperado"]
    en_desarrollo_min, _ = rangos["en_desarrollo"]
    if ppm >= esperado_min:
        return "esperado"
    if ppm >= en_desarrollo_min:
        return "en_desarrollo"
    return "requiere_intervencion"


def build_call2_prompt(analysis: dict[str, Any], texto_original: str, nombre: str, curso: int) -> str:
    edad = CURSO_TO_EDAD.get(curso, 9)
    nivel = clasificar_nivel(analysis.get("ppm", 0), curso)
    rangos = PPM_TABLE.get(edad, PPM_TABLE[9])

    return f"""\
## Alumno

- Nombre: {nombre}
- Curso: {curso}°
- Edad aproximada: {edad} años

## Texto original

{texto_original}

## Tabla de referencia PPM para {edad} años

| Nivel | Rango PPM |
|---|---|
| Esperado | {rangos['esperado'][0]}–{rangos['esperado'][1]} |
| En desarrollo | {rangos['en_desarrollo'][0]}–{rangos['en_desarrollo'][1]} |
| Requiere intervención | < {rangos['en_desarrollo'][0]} |

**Nivel del alumno**: {nivel.replace('_', ' ')}

## Resultado del análisis (Call 1)

{json.dumps(analysis, ensure_ascii=False, indent=2)}

Generá los dos bloques según las instrucciones del sistema.
"""

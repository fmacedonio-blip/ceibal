import json
from typing import Any


SYSTEM_CALL1 = """\
Sos un asistente especializado en análisis de lectura oral para alumnos de primaria (8-12 años).

Recibirás un audio de la lectura oral de un alumno, junto con el texto original que debía leer, su nombre, su curso escolar y la duración exacta del audio en segundos.

## Proceso

1. Transcribí el audio palabra por palabra, incluyendo repeticiones, trabadas y autocorrecciones.
2. Compará con el texto original. Identificá cada palabra que fue sustituida, omitida, repetida o autocorregida.
3. Contá las palabras del texto original.
4. Determiná cuántas palabras fueron leídas correctamente (las autocorrecciones cuentan como correctas).
5. Usá la duración exacta provista en el prompt (NO la estimes vos).
6. Calculá: PPM = palabras_correctas × 60 / duracion_seg
7. Calculá: precision = palabras_correctas / palabras_texto_original × 100

## Criterio para errores — análisis en dos capas

**IMPORTANTE**: No uses solo la transcripción textual para detectar errores. Escuchá el audio directamente y comparalo con el texto original palabra por palabra.

**Capa 1 — Errores de palabra** (ya tenías esto):
- `sustitucion`: dijo una palabra diferente a la original
- `omision`: se saltó una palabra
- `repeticion`: repitió sin autocorregir

**Capa 2 — Errores fonológicos** (escuchá el audio, no la transcripción):
- **Confusión rr/r**: En español "rr" es vibrante múltiple (trill), "r" es vibrante simple (tap). Si el alumno dice "corre" con r simple → registrá: `palabra_original: "corre"`, `lo_que_leyo: "core (r simple)"`, `tipo: "sustitucion"`, `dudoso: false`
- **Acento de intensidad incorrecto**: Si el alumno estresa la sílaba equivocada, registralo. Usá MAYÚSCULAS en la sílaba enfatizada. Ej: "TORtuga" en vez de "torTUga" → `lo_que_leyo: "TORtuga"`. Escuchá la duración y volumen de cada sílaba.
- **Mispronunciaciones vocálicas**: "tortuga" → "tortoga", "carpincho" → "capincho"
- **Sílabas omitidas o agregadas dentro de la palabra**: "explorar" → "exlorar"

**Regla de detección fonológica**: Para CADA palabra del texto original de más de 2 sílabas, escuchá específicamente:
1. ¿La sílaba acentuada corresponde a la tilde o al acento prosódico correcto?
2. ¿Las r/rr se pronuncian con la vibración correcta?
Si detectás diferencia → registralo como `sustitucion` con `lo_que_leyo` mostrando qué sonó.

## Tipos de error

- `sustitucion`: leyó una palabra diferente, incluyendo mispronunciaciones y errores fonológicos
- `omision`: se saltó una palabra del texto original
- `repeticion`: repitió una palabra (sin autocorrección)
- `autocorreccion`: se trabó pero corrigió solo (cuenta como correcto)

## Alertas de fluidez

Registrá TODAS las que aplican — si hay evidencia, incluila:
- `no_respeta_pausas`: no detiene la voz en puntos, comas o signos de pregunta
- `dificultad_polisilabas`: dificultad notable en palabras de 3+ sílabas
- `lectura_palabra_por_palabra`: lee sin fraseo ni entonación natural
- `silabeo`: silabea en lugar de leer palabras completas
- `velocidad_alta_con_errores`: lee muy rápido pero con muchos errores

## Calidad de audio

Si la calidad del audio es muy mala para transcribir con confianza, marcá `calidad_audio_baja: true` y explicá en `notas_calidad`.

## Formato de salida

Respondé ÚNICAMENTE con un JSON válido:

```json
{
  "transcripcion": "...",
  "duracion_estimada_seg": 45.0,
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
  "alertas_fluidez": ["no_respeta_pausas"],
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
Sos un asistente pedagógico para niños de 8 a 12 años de primaria en Uruguay.

Recibirás el análisis de la lectura oral de un alumno. Generá feedback en JSON con cuatro campos.

---

## bloque_alumno

Texto para que lea el alumno. Tono cálido, rioplatense, tuteando. Sin números, porcentajes ni jerga técnica. Máximo 150 palabras. Estructura fija en este orden:

1. **Refuerzo positivo**: Empezá siempre destacando algo concreto que hizo bien (velocidad, claridad, esfuerzo, palabras que leyó correctamente).

2. **Palabras con dificultad**: Si hubo errores, mencioná las palabras específicas con naturalidad. Ej: "En la palabra 'carpincho' sonó un poquito diferente — se dice car-pin-cho." Solo si hay errores; si no los hay, omití esta sección.

3. **Aspectos de lectura**: Mencioná solo los que apliquen según las alertas detectadas:
   - Pausas: "Cuando ves un punto o una coma, hacé una pausa antes de seguir."
   - Velocidad: "Leíste muy rápido/lento — intentá mantener un ritmo parejo."
   - Fluidez: "Intentá leer las palabras completas sin separarlas en sílabas."

---

## bloque_docente

Resumen técnico conciso. Incluí: nivel, PPM, precisión, lista de errores con tipo, alertas de fluidez, y una sugerencia pedagógica para esta semana.

---

## errores

Para CADA error del array `errores` del input (mismo orden, misma cantidad):
- `explicacion_alumno`: cómo decirle al alumno qué pasó con esa palabra, en lenguaje simple.
- `explicacion_docente`: descripción técnica del error.

Si el input tiene 0 errores → devolvé `[]`.

---

## consejos_para_mejorar

2 a 3 consejos concretos y accionables basados en los errores y alertas detectados. Tono alumno, una oración cada uno.

---

## Formato de salida

Respondé ÚNICAMENTE con JSON válido:

```json
{
  "bloque_alumno": "...",
  "bloque_docente": "...",
  "errores": [
    { "explicacion_alumno": "...", "explicacion_docente": "..." }
  ],
  "consejos_para_mejorar": ["...", "..."]
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

    alertas = analysis.get("alertas_fluidez", [])
    alertas_str = ", ".join(alertas) if alertas else "ninguna"
    errores = analysis.get("errores", [])
    errores_count = len(errores)
    # Flag phonological errors so call2 explains them clearly to the student
    errores_fonologicos = [
        e for e in errores
        if e.get("lo_que_leyo") and (
            "[r simple]" in str(e.get("lo_que_leyo", "")) or
            str(e.get("lo_que_leyo", "")).startswith("[")
        )
    ]

    return f"""\
## Alumno

- Nombre: {nombre}
- Curso: {curso}°
- Edad aproximada: {edad} años

## Texto original

{texto_original}

## Resumen del análisis

- Nivel: **{nivel.replace('_', ' ')}** (PPM: {analysis.get('ppm', 0):.1f}, Precisión: {analysis.get('precision', 0):.1f}%)
- Errores detectados: {errores_count}
- Alertas de fluidez: **{alertas_str}**

⚠️ Si `alertas_fluidez` no está vacía, DEBEN aparecer en `bloque_alumno` con ejemplos concretos del texto original.
⚠️ Los errores donde `lo_que_leyo` empieza con `[` son errores fonológicos (r/rr, acento de intensidad). En `explicacion_alumno` explicá el sonido de forma simple: "La 'rr' suena más fuerte que la 'r'" o "La sílaba que va más fuerte es la segunda: tor-TU-ga".

## Tabla de referencia PPM para {edad} años

| Nivel | Rango PPM |
|---|---|
| Esperado | {rangos['esperado'][0]}–{rangos['esperado'][1]} |
| En desarrollo | {rangos['en_desarrollo'][0]}–{rangos['en_desarrollo'][1]} |
| Requiere intervención | < {rangos['en_desarrollo'][0]} |

## Resultado completo del análisis (Call 1)

{json.dumps(analysis, ensure_ascii=False, indent=2)}

Generá los cuatro componentes según las instrucciones del sistema.
"""

## MODIFIED Requirements

### Requirement: Panel de Diagnóstico IA
La pantalla SHALL mostrar un panel lateral derecho "Diagnóstico IA" con fondo degradado (`linear-gradient(128deg, #faf5ff, #eff6ff)`), con dos subsecciones: "OBSERVACIONES ORTOGRÁFICAS" (con tarjeta interna "ERRORES DETECTADOS" en color `#e7000b`) y "SUGERENCIAS PEDAGÓGICAS" (con tarjeta interna "RECOMENDACIÓN" en color `#155dfc`). Cuando hay un `submission_id` disponible, el contenido SHALL provenir del campo `docente` de `GET /api/v1/submissions/{submission_id}/correction`. En ausencia de `submission_id`, SHALL mostrar un mensaje indicando que el diagnóstico no está disponible.

#### Scenario: Diagnóstico disponible desde submission
- **WHEN** la actividad tiene `submission_id` y `GET /api/v1/submissions/{submission_id}/correction` retorna datos
- **THEN** el panel lateral muestra las observaciones de `correction.docente.errores` y las sugerencias de `correction.docente.puntos_de_mejora`, con sus respectivos colores de acento (`#e7000b` para errores, `#155dfc` para recomendaciones)

#### Scenario: Sin diagnóstico
- **WHEN** la actividad no tiene `submission_id`
- **THEN** el panel lateral muestra un mensaje indicando que el diagnóstico no está disponible aún

### Requirement: Sección Transcripción Inteligente
La pantalla SHALL mostrar una sección "Transcripción Inteligente" con el texto transcripto cuando hay `submission_id`. Para escritura, el contenido proviene de `correction.alumno.transcripcion_html` (HTML con palabras marcadas en amarillo `#fef9c2`). Una nota aclaratoria SHALL indicar que el resaltado en amarillo indica posibles errores o palabras que requieren atención. En ausencia de `submission_id`, SHALL mostrar un placeholder.

#### Scenario: Transcripción con errores resaltados (escritura)
- **WHEN** la actividad tiene `submission_id` y `submission_type === 'handwrite'`
- **THEN** el texto de `correction.alumno.transcripcion_html` se renderiza como HTML con las palabras con `<mark>` resaltadas en amarillo (`#fef9c2`) y una nota explicativa al pie

#### Scenario: Sin transcripción disponible
- **WHEN** la actividad no tiene `submission_id`
- **THEN** la sección muestra "Sin transcripción disponible para esta actividad"

### Requirement: Sección Feedback Entregado al Alumno
La pantalla SHALL mostrar una sección "Feedback Entregado al Alumno" con el texto del feedback cuando hay `submission_id`. El contenido proviene de `correction.alumno.feedback` y se muestra en un bloque quote con borde izquierdo `#00bba7`. En ausencia de `submission_id`, SHALL mostrar un placeholder.

#### Scenario: Feedback visible desde submission
- **WHEN** la actividad tiene `submission_id` y `correction.alumno.feedback` tiene contenido
- **THEN** se muestra en un bloque quote con borde izquierdo verde teal (`#00bba7`) y el texto en cursiva

#### Scenario: Sin feedback
- **WHEN** la actividad no tiene `submission_id`
- **THEN** la sección muestra "Sin feedback registrado"

## ADDED Requirements

### Requirement: Carga de datos reales de submission
La pantalla SHALL detectar si la actividad tiene `submission_id`. Cuando lo tiene, SHALL hacer `GET /api/v1/submissions/{submission_id}/correction` y usar la respuesta para poblar las secciones de transcripción, feedback al alumno y diagnóstico IA. El renderizado SHALL soportar tanto `submission_type === 'handwrite'` como `submission_type === 'audio'`.

#### Scenario: Carga automática al tener submission_id
- **WHEN** la actividad cargada tiene `submission_id` no nulo
- **THEN** la pantalla hace fetch a `/api/v1/submissions/{submission_id}/correction` y reemplaza los placeholders con los datos reales

#### Scenario: Error al cargar correction
- **WHEN** el fetch de correction falla con HTTP 4xx o 5xx
- **THEN** la pantalla muestra los placeholders con un mensaje de error no bloqueante

### Requirement: Vista de audio en ActivityDetail
Cuando `submission_type === 'audio'`, la pantalla SHALL mostrar: en "Original del Alumno" un placeholder de audio (no hay blob disponible en MVP), en "Transcripción Inteligente" el texto original con errores de lectura marcados, en "Feedback Entregado al Alumno" el campo `correction.alumno.feedback`, y en el panel "Diagnóstico IA" las métricas de lectura (`ppm`, `precision`, `nivel_orientativo`) y la lista de errores `correction.docente.errores`.

#### Scenario: ActivityDetail para lectura en voz alta
- **WHEN** la actividad tiene `submission_id` y `submission_type === 'audio'`
- **THEN** el panel "Diagnóstico IA" muestra PPM, precisión y nivel orientativo, y la lista de errores de pronunciación/sustitución del campo `correction.docente.errores`

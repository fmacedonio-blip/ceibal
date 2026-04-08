## ADDED Requirements

### Requirement: Pantalla de detalle de actividad individual
El sistema SHALL proveer una pantalla en la ruta `/students/:studentId/activities/:activityId` que muestra el detalle completo de una actividad del alumno. Usa el layout shell autenticado (Sidebar + área de contenido con scroll). Referencia Figma: nodo `52:1271`.

#### Scenario: Acceso desde el historial de actividades
- **WHEN** el usuario hace click en "Ver detalle" en una fila del historial del alumno
- **THEN** la URL cambia a `/students/:studentId/activities/:activityId` y se renderiza la pantalla sin recarga

#### Scenario: Breadcrumb completo y navegable
- **WHEN** el usuario está en la pantalla de detalle de actividad
- **THEN** el breadcrumb muestra "Mis Cursos › [Curso] › [Nombre Alumno] › [Título Actividad]" y cada segmento es un link navegable hacia su ruta correspondiente

### Requirement: Header de la actividad
La pantalla SHALL mostrar en la parte superior: un badge de estado tipo "CORRECCIÓN ASISTIDA" con ícono check verde cuando la actividad fue corregida, el título de la actividad en tipografía grande, y el nombre del alumno con la fecha/hora de entrega en texto secundario.

#### Scenario: Badge de corrección asistida
- **WHEN** la actividad tiene estado REVISADA o COMPLETADA
- **THEN** se muestra el badge "CORRECCIÓN ASISTIDA" con ícono de check en color verde antes del título

#### Scenario: Header completo visible
- **WHEN** la pantalla se renderiza
- **THEN** se muestran: badge de estado, título de la actividad, y "[Nombre Alumno] — Entregado el [fecha], [hora]"

### Requirement: Sección Original del Alumno
La pantalla SHALL mostrar una card "Original del Alumno" con la imagen del trabajo manuscrito o producción del alumno. Si no hay imagen disponible, SHALL mostrar un placeholder.

#### Scenario: Imagen del trabajo visible
- **WHEN** la actividad tiene una imagen asociada
- **THEN** se muestra la imagen dentro de la card "Original del Alumno" con bordes redondeados

#### Scenario: Sin imagen
- **WHEN** la actividad no tiene imagen asociada
- **THEN** se muestra un placeholder indicando que no hay imagen disponible

### Requirement: Panel de Diagnóstico IA
La pantalla SHALL mostrar un panel lateral derecho "Diagnóstico IA" con dos subsecciones: "OBSERVACIONES ORTOGRÁFICAS" (con tarjeta roja "ERRORES DETECTADOS" y descripción) y "SUGERENCIAS PEDAGÓGICAS" (con tarjeta azul "RECOMENDACIÓN" y descripción).

#### Scenario: Diagnóstico disponible
- **WHEN** la actividad tiene diagnóstico IA
- **THEN** el panel lateral muestra las observaciones ortográficas y las sugerencias pedagógicas con sus respectivos colores de acento (rojo para errores, azul para recomendaciones)

#### Scenario: Sin diagnóstico
- **WHEN** la actividad no tiene diagnóstico IA
- **THEN** el panel lateral muestra un mensaje indicando que el diagnóstico no está disponible aún

### Requirement: Sección Transcripción Inteligente
La pantalla SHALL mostrar una sección "Transcripción Inteligente" con el texto transcripto de la actividad. Las palabras con posibles errores ortográficos SHALL estar resaltadas en amarillo. Una nota aclaratoria SHALL indicar que el resaltado en amarillo indica posibles errores o palabras que requieren atención.

#### Scenario: Transcripción con errores resaltados
- **WHEN** la actividad tiene transcripción y palabras marcadas
- **THEN** el texto se muestra con las palabras problemáticas resaltadas en amarillo y una nota explicativa al pie

### Requirement: Sección Feedback Entregado al Alumno
La pantalla SHALL mostrar una sección "Feedback Entregado al Alumno" con el texto del feedback en un bloque quote con borde izquierdo verde, en estilo itálico entre comillas.

#### Scenario: Feedback visible
- **WHEN** la actividad tiene feedback registrado
- **THEN** se muestra en un bloque quote con borde izquierdo verde y el texto en cursiva

#### Scenario: Sin feedback
- **WHEN** la actividad no tiene feedback registrado
- **THEN** la sección no se renderiza o muestra un mensaje "Sin feedback registrado"

### Requirement: Botón Volver al historial
La pantalla SHALL mostrar un botón "Volver al historial" al final del contenido que navega de regreso al detalle del alumno.

#### Scenario: Navegación de vuelta
- **WHEN** el usuario hace click en "Volver al historial"
- **THEN** navega a `/students/:studentId` sin recargar la página

### Requirement: Estado visual por color en detalle
Los badges de estado SHALL usar los colores del sistema: verde para REVISADA/COMPLETADA, amarillo para PENDIENTE_DE_REVISION, rojo para NO_ENTREGADO.

#### Scenario: Estado REVISADA
- **WHEN** la actividad tiene estado REVISADA o COMPLETADA
- **THEN** el badge se muestra en verde

#### Scenario: Estado PENDIENTE_DE_REVISION
- **WHEN** la actividad tiene estado PENDIENTE_DE_REVISION
- **THEN** el badge se muestra en amarillo/naranja

#### Scenario: Estado NO_ENTREGADO
- **WHEN** la actividad tiene estado NO_ENTREGADO
- **THEN** el badge se muestra en rojo y no hay link "Ver detalle" (la fila en el historial no es clickeable)

### Requirement: Actividad no encontrada
Si el `activityId` no corresponde a ninguna actividad del alumno, la pantalla SHALL mostrar un mensaje de error sin romper el layout shell.

#### Scenario: Actividad no encontrada
- **WHEN** el `activityId` en la URL no existe para ese alumno
- **THEN** se muestra el mensaje "Actividad no encontrada" dentro del área de contenido, manteniendo el Sidebar y el breadcrumb visibles

import json
import logging

from json_repair import repair_json

from app.pipelines.handwrite_pipeline_aws.session import GatewaySession
from app.pipelines.audio_pipeline.models import OutputCall1Audio, OutputFinalAudio
from app.pipelines.audio_pipeline.prompts import clasificar_nivel
from app.pipelines.audio_pipeline_aws.prompts import SYSTEM_CALL2, build_call2_prompt

logger = logging.getLogger(__name__)

DEFAULT_METADATA = {"agent_max_tokens": 8192, "agent_temperature": 0.2}


def generar(
    session: GatewaySession,
    call1_output: OutputCall1Audio,
    texto_original: str,
    nombre: str,
    curso: int,
) -> OutputFinalAudio:
    """
    Second gateway call: generate student + teacher feedback blocks.

    Uses the same session as call1 (message history included automatically).
    Returns OutputFinalAudio.
    """
    analysis_dict = call1_output.model_dump()
    prompt_text = build_call2_prompt(analysis_dict, texto_original, nombre, curso)

    logger.info("Call 2 audio | modelo=%s ppm=%.1f", session.model, call1_output.ppm)

    try:
        raw = session.send(
            user_content=prompt_text,
            system_prompt=SYSTEM_CALL2,
            metadata=DEFAULT_METADATA,
        )
    except Exception as e:
        raise RuntimeError(f"Call 2 audio falló con modelo '{session.model}': {e}") from e

    logger.info("Call 2 audio raw (%d chars): %s", len(raw), raw[:200])

    stripped = raw.strip()
    if stripped.startswith("```"):
        stripped = "\n".join(l for l in stripped.splitlines() if not l.strip().startswith("```")).strip()

    try:
        data = json.loads(stripped)
    except json.JSONDecodeError:
        try:
            data = json.loads(repair_json(stripped))
        except Exception as e:
            raise RuntimeError(
                f"Call 2 audio: JSON inválido con modelo '{session.model}'.\n"
                f"Error: {e}\nRespuesta ({len(raw)} chars): {raw[:800]}"
            ) from e

    nivel = clasificar_nivel(call1_output.ppm, curso)

    # Merge call2 error explanations into call1 errors
    call2_errores = data.get("errores", [])
    errores_enriquecidos = []
    for i, error in enumerate(call1_output.errores):
        enriched = error.model_dump()
        if i < len(call2_errores):
            enriched["explicacion_alumno"] = call2_errores[i].get("explicacion_alumno", "")
            enriched["explicacion_docente"] = call2_errores[i].get("explicacion_docente", "")
        errores_enriquecidos.append(enriched)

    try:
        return OutputFinalAudio(
            bloque_alumno=data.get("bloque_alumno", ""),
            bloque_docente=data.get("bloque_docente", ""),
            transcripcion=call1_output.transcripcion,
            ppm=call1_output.ppm,
            precision=call1_output.precision,
            nivel_orientativo=nivel,
            errores=errores_enriquecidos,
            alertas_fluidez=call1_output.alertas_fluidez,
            calidad_audio_baja=call1_output.calidad_audio_baja,
            consejos_para_mejorar=data.get("consejos_para_mejorar", []),
        )
    except Exception as e:
        raise RuntimeError(
            f"Call 2 audio schema inválido para modelo '{session.model}': {e}"
        ) from e

import json

from json_repair import repair_json

from app.pipelines.audio_pipeline.client import chat_completion
from app.pipelines.audio_pipeline.models import OutputCall1Audio, OutputFinalAudio
from app.pipelines.audio_pipeline.prompts import SYSTEM_CALL2, build_call2_prompt, clasificar_nivel


def generar(
    call1_output: OutputCall1Audio,
    texto_original: str,
    nombre: str,
    curso: int,
    model: str,
) -> OutputFinalAudio:
    analysis_dict = call1_output.model_dump()
    prompt_text = build_call2_prompt(analysis_dict, texto_original, nombre, curso)

    messages = [
        {"role": "system", "content": SYSTEM_CALL2},
        {"role": "user", "content": prompt_text},
    ]

    try:
        response = chat_completion(model, messages, response_format={"type": "json_object"})
    except Exception as e:
        raise RuntimeError(f"Call 2 falló con modelo '{model}': {e}") from e

    raw_content = response["choices"][0]["message"]["content"]

    try:
        data = json.loads(raw_content)
    except json.JSONDecodeError:
        try:
            data = json.loads(repair_json(raw_content))
        except Exception as e:
            raise RuntimeError(
                f"Call 2 devolvió JSON inválido con modelo '{model}': {e}\nRespuesta: {raw_content[:500]}"
            )

    nivel = clasificar_nivel(call1_output.ppm, curso)

    try:
        return OutputFinalAudio(
            bloque_alumno=data.get("bloque_alumno", ""),
            bloque_docente=data.get("bloque_docente", ""),
            transcripcion=call1_output.transcripcion,
            ppm=call1_output.ppm,
            precision=call1_output.precision,
            nivel_orientativo=nivel,
            errores=call1_output.errores,
            alertas_fluidez=call1_output.alertas_fluidez,
            calidad_audio_baja=call1_output.calidad_audio_baja,
        )
    except Exception as e:
        raise RuntimeError(
            f"Call 2 devolvió un JSON que no cumple el schema con modelo '{model}': {e}"
        ) from e

from __future__ import annotations

import re
import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.database_async import get_async_db
from app.schemas.submission import (
    AudioCorrectionResponse,
    AudioSubmissionAnalyzeResponse,
    DashboardStudentRow,
    ErrorPattern,
    ProgressPoint,
    SubmissionAnalyzeResponse,
    SubmissionDetailResponse,
    WritingCorrectionResponse,
)
from app.services import handwrite_analyze as hw_service
from app.services import submission_service
from app.services.audio_analyze import AudioAnalyzeError
from app.services.audio_analyze import analyze as audio_analyze
from app.services.handwrite_analyze import HandwriteAnalyzeError
from app.services.handwrite_analyze_aws import HandwriteAnalyzeAwsError
from app.services.handwrite_analyze_aws import analyze as aws_analyze
from app.services.audio_analyze_aws import AudioAnalyzeAwsError
from app.services.audio_analyze_aws import analyze as aws_audio_analyze
from app.pipelines.handwrite_pipeline_aws.pipeline import DEFAULT_MODEL as AWS_DEFAULT_MODEL
from app.pipelines.audio_pipeline_aws.pipeline import DEFAULT_MODEL as AWS_AUDIO_DEFAULT_MODEL
from app.pipelines.handwrite_pipeline_aws.s3_client import upload_file


def _build_transcripcion_html(transcripcion: str, errores: list) -> str:
    if not transcripcion or not errores:
        return transcripcion
    sorted_errors = sorted(errores, key=lambda e: len(e.text), reverse=True)
    result = transcripcion
    for error in sorted_errors:
        word = re.escape(error.text)
        msg = (error.correccion_alumno or error.explicacion_pedagogica).replace('"', "&quot;")
        tag = f'<error msg="{msg}">{error.text}</error>'
        result = re.sub(rf'\b{word}\b', tag, result, flags=re.IGNORECASE)
    return result

router = APIRouter(prefix="/api/v1", tags=["submissions"])


def _build_transcripcion_html(transcripcion: str, errores: list) -> str:
    """Wrap each detected error word in the transcription with an <mark> tag."""
    if not transcripcion or not errores:
        return transcripcion
    # Sort longest first to avoid partial replacements
    sorted_errors = sorted(errores, key=lambda e: len(e.get("text", "")), reverse=True)
    result = transcripcion
    for error in sorted_errors:
        word = error.get("text", "")
        if not word:
            continue
        tag = f'<mark class="hw-error">{word}</mark>'
        result = re.sub(rf'\b{re.escape(word)}\b', tag, result, count=1, flags=re.IGNORECASE)
    return result

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_AUDIO_TYPES = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/wave", "audio/x-wav",
    "audio/mp4", "audio/m4a", "audio/x-m4a", "audio/ogg", "audio/webm",
}
SUPPORTED_GRADES = {3, 4, 5, 6}


@router.post("/submissions/analyze", response_model=SubmissionAnalyzeResponse, tags=["submissions"])
async def analyze_submission(
    file: UploadFile = File(...),
    class_id: uuid.UUID = Form(...),
    grade: int = Form(...),
    student_id: uuid.UUID = Form(...),
    db=Depends(get_async_db),
) -> SubmissionAnalyzeResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}")
    if grade not in SUPPORTED_GRADES:
        raise HTTPException(status_code=400, detail=f"Grade must be one of {sorted(SUPPORTED_GRADES)}")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        output = await hw_service.analyze(image_bytes, file.content_type, grade)
    except HandwriteAnalyzeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    submission = await submission_service.persist_result(
        db=db,
        student_id=student_id,
        teacher_id=None,
        class_id=class_id,
        grade=grade,
        output=output,
    )

    transcripcion_html = _build_transcripcion_html(output.transcripcion, output.errores_detectados_agrupados)
    output = output.model_copy(update={"transcripcion_html": transcripcion_html})

    return SubmissionAnalyzeResponse(
        submission_id=submission.id,
        status=submission.status,
        **output.model_dump(),
    )


@router.post("/submissions/analyze-aws", response_model=SubmissionAnalyzeResponse, tags=["submissions"])
async def analyze_submission_aws(
    file: UploadFile = File(...),
    class_id: uuid.UUID = Form(...),
    grade: int = Form(...),
    student_id: uuid.UUID = Form(...),
    modelo: str = Form(AWS_DEFAULT_MODEL),
    db=Depends(get_async_db),
) -> SubmissionAnalyzeResponse:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {file.content_type}")
    if grade not in SUPPORTED_GRADES:
        raise HTTPException(status_code=400, detail=f"Grade must be one of {sorted(SUPPORTED_GRADES)}")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty file")

    # Upload to S3 — hard fail, s3_key is required for the gateway-ai call
    try:
        s3_key, _ = upload_file(image_bytes, file.content_type, filename=file.filename or "image.jpg")
    except EnvironmentError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    try:
        output, _session = await aws_analyze(
            image_bytes=image_bytes,
            media_type=file.content_type,
            curso=grade,
            modelo=modelo,
            s3_key=s3_key,
        )
    except HandwriteAnalyzeAwsError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except EnvironmentError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    submission = await submission_service.persist_result(
        db=db,
        student_id=student_id,
        teacher_id=None,
        class_id=class_id,
        grade=grade,
        output=output,
        s3_key=s3_key,
    )

    transcripcion_html = _build_transcripcion_html(output.transcripcion, output.errores_detectados_agrupados)
    output = output.model_copy(update={"transcripcion_html": transcripcion_html})

    return SubmissionAnalyzeResponse(
        submission_id=submission.id,
        status=submission.status,
        **output.model_dump(),
    )


@router.post("/submissions/analyze-audio", response_model=AudioSubmissionAnalyzeResponse, tags=["submissions"])
async def analyze_audio_submission(
    file: UploadFile = File(...),
    student_id: uuid.UUID = Form(...),
    class_id: uuid.UUID = Form(...),
    grade: int = Form(...),
    texto_original: str = Form(...),
    nombre: str = Form(...),
    duracion_seg: Optional[float] = Form(None),  # sent by frontend to bypass webm metadata issue
    db=Depends(get_async_db),
) -> AudioSubmissionAnalyzeResponse:
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported audio type: {file.content_type}")
    if grade not in SUPPORTED_GRADES:
        raise HTTPException(status_code=400, detail=f"Grade must be one of {sorted(SUPPORTED_GRADES)}")
    if not texto_original.strip():
        raise HTTPException(status_code=400, detail="texto_original cannot be empty")
    if not nombre.strip():
        raise HTTPException(status_code=400, detail="nombre cannot be empty")

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    try:
        output = await audio_analyze(audio_bytes, file.content_type, texto_original, nombre, grade, duracion_seg=duracion_seg)
    except AudioAnalyzeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    ai_result_dict = output.model_dump()
    ai_result_dict["texto_original"] = texto_original
    ai_result_dict["nombre"] = nombre

    submission = await submission_service.persist_result(
        db=db,
        student_id=student_id,
        teacher_id=None,
        class_id=class_id,
        grade=grade,
        output=output,
        submission_type="audio",
        ai_result_override=ai_result_dict,
    )

    return AudioSubmissionAnalyzeResponse(
        submission_id=submission.id,
        status=submission.status,
        bloque_alumno=output.bloque_alumno,
        nivel_orientativo=output.nivel_orientativo,
        ppm=output.ppm,
        precision=output.precision,
        total_errors=submission.total_errors or 0,
        requires_review=submission.requires_review,
    )


@router.post("/submissions/analyze-audio-aws", response_model=AudioSubmissionAnalyzeResponse, tags=["submissions"])
async def analyze_audio_submission_aws(
    file: UploadFile = File(...),
    student_id: uuid.UUID = Form(...),
    class_id: uuid.UUID = Form(...),
    grade: int = Form(...),
    texto_original: str = Form(...),
    nombre: str = Form(...),
    modelo: str = Form(AWS_AUDIO_DEFAULT_MODEL),
    db=Depends(get_async_db),
) -> AudioSubmissionAnalyzeResponse:
    if file.content_type not in ALLOWED_AUDIO_TYPES:
        raise HTTPException(status_code=415, detail=f"Unsupported audio type: {file.content_type}")
    if grade not in SUPPORTED_GRADES:
        raise HTTPException(status_code=400, detail=f"Grade must be one of {sorted(SUPPORTED_GRADES)}")
    if not texto_original.strip():
        raise HTTPException(status_code=400, detail="texto_original cannot be empty")
    if not nombre.strip():
        raise HTTPException(status_code=400, detail="nombre cannot be empty")

    audio_bytes = await file.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio file")

    # Upload to S3 — hard fail, s3_key is required for the gateway-ai call
    try:
        s3_key, _ = upload_file(audio_bytes, file.content_type, filename=file.filename or "audio.mp3")
    except EnvironmentError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except (RuntimeError, ValueError) as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    try:
        output, _session = await aws_audio_analyze(
            audio_bytes=audio_bytes,
            media_type=file.content_type,
            texto_original=texto_original,
            nombre=nombre,
            curso=grade,
            modelo=modelo,
            s3_key=s3_key,
        )
    except AudioAnalyzeAwsError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except EnvironmentError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    ai_result_dict = output.model_dump()
    ai_result_dict["texto_original"] = texto_original
    ai_result_dict["nombre"] = nombre

    submission = await submission_service.persist_result(
        db=db,
        student_id=student_id,
        teacher_id=None,
        class_id=class_id,
        grade=grade,
        output=output,
        submission_type="audio",
        ai_result_override=ai_result_dict,
        s3_key=s3_key,
    )

    return AudioSubmissionAnalyzeResponse(
        submission_id=submission.id,
        status=submission.status,
        bloque_alumno=output.bloque_alumno,
        nivel_orientativo=output.nivel_orientativo,
        ppm=output.ppm,
        precision=output.precision,
        total_errors=submission.total_errors or 0,
        requires_review=submission.requires_review,
    )


@router.get("/submissions/{submission_id}", response_model=SubmissionDetailResponse, tags=["submissions"])
async def get_submission(
    submission_id: uuid.UUID,
    db=Depends(get_async_db),
) -> SubmissionDetailResponse:
    submission = await submission_service.get_submission(
        db=db,
        submission_id=submission_id,
        current_user_id=None,
        current_role="docente",
    )
    return SubmissionDetailResponse.model_validate(submission)


@router.get("/classroom/{class_id}/dashboard", response_model=list[DashboardStudentRow], tags=["dashboard"])
async def classroom_dashboard(
    class_id: uuid.UUID,
    desde: date | None = None,
    hasta: date | None = None,
    db=Depends(get_async_db),
) -> list[DashboardStudentRow]:
    return await submission_service.get_classroom_dashboard(db, class_id, desde, hasta)


@router.get("/classroom/{class_id}/error-patterns", response_model=list[ErrorPattern], tags=["dashboard"])
async def classroom_error_patterns(
    class_id: uuid.UUID,
    dias: int = 30,
    db=Depends(get_async_db),
) -> list[ErrorPattern]:
    return await submission_service.get_error_patterns(db, class_id, dias)


@router.get("/students/{student_id}/progress", response_model=list[ProgressPoint], tags=["submissions"])
async def student_progress(
    student_id: uuid.UUID,
    db=Depends(get_async_db),
) -> list[ProgressPoint]:
    return await submission_service.get_student_progress(db, student_id)


@router.get(
    "/submissions/{submission_id}/correction",
    tags=["submissions"],
)
async def get_correction(
    submission_id: uuid.UUID,
    db=Depends(get_async_db),
):
    """Return structured correction data split into alumno and docente layers."""
    submission = await submission_service.get_submission(
        db=db,
        submission_id=submission_id,
        current_user_id=None,
        current_role="docente",
    )
    ai = submission.ai_result or {}

    if submission.submission_type == "audio":
        errores_raw = ai.get("errores", [])
        errores_alumno = [
            {
                "palabra_original": e.get("palabra_original", ""),
                "lo_que_leyo": e.get("lo_que_leyo"),
                "tipo": e.get("tipo", ""),
                "explicacion": e.get("explicacion_alumno", ""),
            }
            for e in errores_raw
        ]
        errores_docente = [
            {
                "palabra_original": e.get("palabra_original", ""),
                "lo_que_leyo": e.get("lo_que_leyo"),
                "tipo": e.get("tipo", ""),
                "explicacion_tecnica": e.get("explicacion_docente", ""),
                "dudoso": e.get("dudoso", False),
            }
            for e in errores_raw
        ]
        return AudioCorrectionResponse(
            submission_id=submission.id,
            submission_type="audio",
            status=submission.status,
            alumno={
                "feedback": ai.get("bloque_alumno", ""),
                "errores": errores_alumno,
                "consejos": ai.get("consejos_para_mejorar", []),
            },
            docente={
                "feedback_tecnico": ai.get("bloque_docente", ""),
                "ppm": ai.get("ppm", 0.0),
                "precision": ai.get("precision", 0.0),
                "nivel_orientativo": ai.get("nivel_orientativo", ""),
                "errores": errores_docente,
                "alertas_fluidez": ai.get("alertas_fluidez", []),
            },
        )

    # handwrite
    errores_agrupados = ai.get("errores_detectados_agrupados", [])
    errores_alumno_hw = [
        {
            "texto": e.get("text", ""),
            "correccion": e.get("correccion_alumno", ""),
            "explicacion": e.get("explicacion_pedagogica", ""),
        }
        for e in errores_agrupados
    ]
    errores_docente_hw = [
        {
            "texto": e.get("text", ""),
            "tipo": e.get("error_type", ""),
            "explicacion_tecnica": e.get("explicacion_docente", ""),
            "ocurrencias": e.get("ocurrencias", 1),
            "confianza": e.get("confianza_lectura"),
        }
        for e in errores_agrupados
    ]
    consejos_hw = [
        p.get("explicacion_pedagogica", p.get("descripcion", ""))
        for p in ai.get("puntos_de_mejora", [])
        if p.get("explicacion_pedagogica") or p.get("descripcion")
    ]
    # Build transcripcion_html on the fly if not stored (submissions via /submissions/analyze)
    transcripcion_html = ai.get("transcripcion_html") or ""
    if not transcripcion_html:
        transcripcion_html = _build_transcripcion_html(
            ai.get("transcripcion", ""), errores_agrupados
        )
    return WritingCorrectionResponse(
        submission_id=submission.id,
        submission_type="handwrite",
        status=submission.status,
        alumno={
            "feedback": ai.get("feedback_inicial", ""),
            "aspectos_positivos": ai.get("aspectos_positivos", []),
            "transcripcion_html": transcripcion_html,
            "errores": errores_alumno_hw,
            "sugerencias_socraticas": ai.get("sugerencias_socraticas", []),
            "consejos": consejos_hw,
        },
        docente={
            "razonamiento": ai.get("razonamiento_docente", ""),
            "errores": errores_docente_hw,
            "puntos_de_mejora": ai.get("puntos_de_mejora", []),
            "requires_review": submission.requires_review,
        },
    )

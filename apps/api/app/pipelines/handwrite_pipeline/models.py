from __future__ import annotations

from typing import Any, Dict, List

from pydantic import BaseModel, Field, model_validator


class ImageInput(BaseModel):
    path: str | None = None
    data_url: str | None = None
    content_bytes_base64: str | None = None
    media_type: str | None = None

    @model_validator(mode="after")
    def validate_single_source(self) -> "ImageInput":
        configured = sum(
            1 for value in (self.path, self.data_url, self.content_bytes_base64) if value is not None
        )
        if configured != 1:
            raise ValueError("La imagen debe definirse con exactamente una fuente: `path`, `data_url` o `content_bytes_base64`.")

        if self.data_url is not None and not self.data_url.startswith("data:image/"):
            raise ValueError("`data_url` debe comenzar con `data:image/`.")

        if self.media_type is not None and not self.media_type.startswith("image/"):
            raise ValueError("`media_type` debe ser un MIME de imagen.")

        if self.content_bytes_base64 is not None and self.media_type is None:
            raise ValueError("Si se usa `content_bytes_base64`, también se debe indicar `media_type`.")

        return self


class PipelineInput(BaseModel):
    imagen: ImageInput | None = None
    texto_compatibilidad: str | None = None
    curso: int
    conocimiento_curricular: Dict[str, Any]

    @model_validator(mode="after")
    def validate_input_mode(self) -> "PipelineInput":
        if self.imagen is None and not self.texto_compatibilidad:
            raise ValueError("Debes enviar `imagen` o `texto_compatibilidad`.")
        return self


class PuntoDeMejora(BaseModel):
    tipo: str
    descripcion: str
    explicacion_pedagogica: str = ""
    explicacion_docente: str = ""

    @model_validator(mode="before")
    @classmethod
    def coerce_from_string(cls, v: Any) -> Any:
        if isinstance(v, str):
            return {"tipo": "mejora", "descripcion": v, "explicacion_pedagogica": v, "explicacion_docente": v}
        return v


class AmbiguedadLectura(BaseModel):
    fragmento: str
    motivo: str
    confianza_lectura: float = Field(ge=0.0, le=1.0)

    @model_validator(mode="before")
    @classmethod
    def coerce_from_string(cls, v: Any) -> Any:
        if isinstance(v, str):
            return {"fragmento": v, "motivo": v, "confianza_lectura": 0.5}
        return v


class ErrorDetectado(BaseModel):
    text: str
    error_type: str
    correccion_alumno: str = ""
    explicacion_pedagogica: str = ""
    explicacion_docente: str = ""
    confianza_lectura: float | None = Field(default=None, ge=0.0, le=1.0)
    es_ambigua: bool = False
    requiere_revision_docente: bool = False


class OutputCall1(BaseModel):
    transcripcion: str = ""
    errores_detectados: List[ErrorDetectado]
    puntos_de_mejora: List[PuntoDeMejora]
    ambiguedades_lectura: List[AmbiguedadLectura]
    lectura_global_confianza: float | None = Field(default=None, ge=0.0, le=1.0)
    lectura_insuficiente: bool = False


class ErrorDetectadoAgrupado(ErrorDetectado):
    ocurrencias: int = Field(ge=1)


class OutputFinal(BaseModel):
    transcripcion: str = ""
    transcripcion_html: str = ""
    errores_detectados_agrupados: List[ErrorDetectadoAgrupado]
    puntos_de_mejora: List[PuntoDeMejora]
    ambiguedades_lectura: List[AmbiguedadLectura]
    sugerencias_socraticas: List[str]
    aspectos_positivos: List[str] = []  # bullet list of what the student did well
    feedback_inicial: str
    razonamiento_docente: str
    lectura_insuficiente: bool = False

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Busca .env en apps/api/ primero, luego en la raíz del monorepo
_API_DIR = Path(__file__).parent.parent
_ROOT_DIR = _API_DIR.parent.parent
_ENV_FILES = [str(_API_DIR / ".env"), str(_ROOT_DIR / ".env")]


_VALID_PIPELINES = {"openrouter", "aws"}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    env: str = "development"
    database_url: str = "postgresql://ceibal:ceibal_dev_pass@localhost:5432/ceibal_dev"
    cors_origins: str = "http://localhost:5173"
    handwrite_pipeline: str = "openrouter"
    audio_pipeline: str = "openrouter"
    openrouter_api_key: str = ""
    openrouter_chat_model: str = "anthropic/claude-sonnet-4-6"
    gateway_ai_url: str = ""
    gateway_file_url: str = ""
    s3_bucket_handwrite: str = "ceibal-gateway-file-uploads-dev"
    aws_region: str = "us-east-1"
    cognito_user_pool_id: str = ""
    cognito_app_client_id: str = ""

    def model_post_init(self, __context: object) -> None:
        if self.handwrite_pipeline not in _VALID_PIPELINES:
            raise ValueError(
                f"HANDWRITE_PIPELINE must be one of {_VALID_PIPELINES}, got '{self.handwrite_pipeline}'"
            )
        if self.audio_pipeline not in _VALID_PIPELINES:
            raise ValueError(
                f"AUDIO_PIPELINE must be one of {_VALID_PIPELINES}, got '{self.audio_pipeline}'"
            )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def is_development(self) -> bool:
        return self.env.lower() == "development"

    @property
    def cognito_jwks_url(self) -> str:
        region = self.cognito_user_pool_id.split("_")[0]
        return f"https://cognito-idp.{region}.amazonaws.com/{self.cognito_user_pool_id}/.well-known/jwks.json"

    @property
    def cognito_issuer(self) -> str:
        region = self.cognito_user_pool_id.split("_")[0]
        return f"https://cognito-idp.{region}.amazonaws.com/{self.cognito_user_pool_id}"


settings = Settings()

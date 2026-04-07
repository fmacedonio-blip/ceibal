from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Busca .env en apps/api/ primero, luego en la raíz del monorepo
_API_DIR = Path(__file__).parent.parent
_ROOT_DIR = _API_DIR.parent.parent
_ENV_FILES = [str(_API_DIR / ".env"), str(_ROOT_DIR / ".env")]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_ENV_FILES,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    env: str = "development"
    jwt_secret: str
    jwt_expire_hours: int = 24
    database_url: str = "postgresql://ceibal:ceibal_dev_pass@localhost:5432/ceibal_dev"
    cors_origins: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def is_development(self) -> bool:
        return self.env.lower() == "development"


settings = Settings()

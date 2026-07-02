from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILE, env_file_encoding="utf-8", extra="ignore")
    DATABASE_URL: str = ""
    SECRET_KEY: str = "change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    ALLOWED_ORIGINS: str = "http://localhost:5173"
    PROMPT_LIMIT_PER_DAY: int = 5
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    EMAIL: str = ""
    PASS: str = ""
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    REMINDER_MINUTES_BEFORE: int = 5
    DEFAULT_TIMEZONE: str = "Asia/Kolkata"

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    @property
    def openai_api_key(self) -> str:
        return self.OPENAI_API_KEY.strip()

    @property
    def smtp_configured(self) -> bool:
        return bool(self.EMAIL.strip() and self.PASS.strip())


settings = Settings()

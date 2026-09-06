from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Never hardcode secrets here - everything is read from the environment.
    See backend/.env.example for the full list of variables.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "VPRO Skills EduTech API"
    environment: str = "development"

    database_url: str
    jwt_secret: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60

    cors_origins: str = "http://localhost:5173"

    # Shared secret for the partner API (app/partner). Empty disables the whole
    # partner surface, so a deployment that has not set it cannot be read by a
    # caller who guesses the URL.
    partner_api_key: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

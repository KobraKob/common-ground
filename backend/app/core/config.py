from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "CommonGround API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    SECRET_KEY: str = ""
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./commonground.db"
    
    # Supabase Settings
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "capacitor://localhost",
        "http://localhost",
        "https://commonground.in",
        "https://www.commonground.in",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

# Never boot a non-development deployment with a predictable signing key.
if settings.ENVIRONMENT.lower() not in {"development", "dev", "local", "test"}:
    if len(settings.SECRET_KEY.strip()) < 32:
        raise RuntimeError("SECRET_KEY must be configured with at least 32 characters outside development.")


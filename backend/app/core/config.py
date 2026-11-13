from typing import List
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "production"
    PROJECT_NAME: str = "CommonGround API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    PORT: int = 8000
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800
    HOST: str = "0.0.0.0"
    SECRET_KEY: str = ""
    
    # Database
    DATABASE_URL: str = ""
    
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

    @model_validator(mode="after")
    def validate_runtime_configuration(self):
        environment = self.ENVIRONMENT.lower()
        if environment in {"development", "dev", "local", "test"}:
            if not self.DATABASE_URL:
                self.DATABASE_URL = "sqlite+aiosqlite:///./commonground.db"
        else:
            if not self.DATABASE_URL:
                raise ValueError("DATABASE_URL is required outside local development")
            if self.DATABASE_URL.startswith("sqlite"):
                raise ValueError("SQLite is not supported as a production database")
            if len(self.SECRET_KEY) < 32:
                raise ValueError("SECRET_KEY must contain at least 32 characters in production")
            if any("localhost" in origin or "127.0.0.1" in origin for origin in self.CORS_ORIGINS):
                raise ValueError("Production CORS_ORIGINS must not include localhost")
        return self

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


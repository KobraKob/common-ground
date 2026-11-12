from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "CommonGround API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    SECRET_KEY: str = "commonground-dev-secret-key-bengaluru-2026"
    
    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./commonground.db"
    
    # Supabase Settings
    SUPABASE_URL: str = "http://localhost:54321"
    SUPABASE_ANON_KEY: str = "dummy-anon-key"
    SUPABASE_SERVICE_ROLE_KEY: str = "dummy-service-role-key"
    SUPABASE_JWT_SECRET: str = "super-secret-jwt-token-with-at-least-32-characters-long"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "capacitor://localhost",
        "http://localhost",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

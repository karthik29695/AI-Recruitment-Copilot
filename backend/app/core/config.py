import os
from pydantic_settings import BaseSettings
from typing import List

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DEFAULT_DB_PATH = os.path.join(BACKEND_DIR, "recruitment_copilot.db").replace("\\", "/")

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Recruitment Copilot"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "infosys-springboard-ai-recruitment-copilot-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    DATABASE_URL: str = f"sqlite:///{DEFAULT_DB_PATH}"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

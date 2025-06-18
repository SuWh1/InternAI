import os
from pydantic_settings import BaseSettings
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Base
    PROJECT_NAME: str = "InternAI API"
    API_V1_STR: str = "/api"
    
    # Database
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5433")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "postgres")
    DATABASE_URL: Optional[str] = None
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "very-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite default
        "http://localhost:3000",  # Alternative React port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:4173",  # Vite preview
        "http://127.0.0.1:4173",  # Vite preview
    ]
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/callback")
    
    class Config:
        case_sensitive = True
        
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.DATABASE_URL = f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings() 
import os
from pydantic_settings import BaseSettings
from typing import Optional, List
from dotenv import load_dotenv

# Load .env from project root (3 levels up from this file)
load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))

class Settings(BaseSettings):
    # Base
    PROJECT_NAME: str = "InternAI API"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "postgres")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "very-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))  # Default to 30 minutes
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30  # 30 days
    
    # CORS - accept as string, will be converted to list
    BACKEND_CORS_ORIGINS: str = ""
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:5173/auth/callback")

    # AWS S3 configuration
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION: str = os.getenv("AWS_REGION", "eu-north-1")
    AWS_S3_AVATAR_BUCKET: str = os.getenv("AWS_S3_AVATAR_BUCKET", "")

    # Brevo (Email) configuration
    BREVO_API_KEY: str = os.getenv("BREVO_API_KEY", "")
    BREVO_FROM_NAME: str = os.getenv("BREVO_FROM_NAME", "InternAI")
    BREVO_FROM_EMAIL: str = os.getenv("BREVO_FROM_EMAIL", "")
    BREVO_TEMPLATE_ID: int = int(os.getenv("BREVO_TEMPLATE_ID", "1"))

    ADMIN_EMAIL: Optional[str] = os.getenv("ADMIN_EMAIL")
    
    class Config:
        case_sensitive = True
        
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.DATABASE_URL:
            self.DATABASE_URL = f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins as a list."""
        if self.BACKEND_CORS_ORIGINS:
            return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]
        return [
            "http://localhost:5173",  # Vite default
            "http://localhost:3000",  # Alternative React port
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
            "http://localhost:4173",  # Vite preview
            "http://127.0.0.1:4173",  # Vite preview
        ]

settings = Settings() 
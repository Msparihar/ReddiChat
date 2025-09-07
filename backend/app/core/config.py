from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)


class Settings(BaseSettings):
    # API Configuration
    PROJECT_NAME: str = "ReddiChat"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Database Configuration
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./redidchat.db")

    # Gemini Configuration
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")

    # Security Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # OAuth Configuration
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: Optional[str] = os.getenv(
        "GOOGLE_REDIRECT_URI", "https://reddichat-backend-267146955755.us-east1.run.app/api/v1/auth/callback/google"
    )
    GITHUB_CLIENT_ID: Optional[str] = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET: Optional[str] = os.getenv("GITHUB_CLIENT_SECRET")
    GITHUB_REDIRECT_URI: Optional[str] = os.getenv(
        "GITHUB_REDIRECT_URI", "https://reddichat-backend-267146955755.us-east1.run.app/api/v1/auth/callback/github"
    )

    # Frontend and CORS Configuration
    FRONTEND_URL: Optional[str] = os.getenv("FRONTEND_URL", "https://reddichat-frontend-267146955755.us-east1.run.app")

    # Server Configuration
    PORT: int = int(os.getenv("PORT", 8000))

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()

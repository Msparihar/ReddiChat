from pydantic_settings import BaseSettings, SettingsConfigDict
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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

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

    REDDIT_CLIENT_ID: Optional[str] = os.getenv("REDDIT_CLIENT_ID")
    REDDIT_CLIENT_SECRET: Optional[str] = os.getenv("REDDIT_CLIENT_SECRET")

    # AWS S3 Configuration
    AWS_ACCESS_KEY_ID: Optional[str] = os.getenv("AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: Optional[str] = os.getenv("AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    S3_BUCKET: str = os.getenv("S3_BUCKET", "reddichat-files")

    # File Upload Configuration
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "50000000"))  # 50MB default
    MAX_FILES_PER_MESSAGE: int = int(os.getenv("MAX_FILES_PER_MESSAGE", "5"))
    SUPPORTED_FILE_TYPES: set = {
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "audio/mpeg",
        "audio/wav",
        "audio/ogg",
        "audio/m4a",
        "video/mp4",
        "video/webm",
        "video/avi",
        "video/mov",
        "application/pdf",
    }

    # Email Configuration
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SENDER_EMAIL: Optional[str] = os.getenv("SENDER_EMAIL")
    SENDER_EMAIL_PASSWORD: Optional[str] = os.getenv("SENDER_EMAIL_PASSWORD")
    NOTIFICATION_EMAIL: str = os.getenv("NOTIFICATION_EMAIL", "manishsparihar2020@gmail.com")

    EMAIL: Optional[str] = os.getenv("EMAIL")
    EMAIL_PASSWORD: Optional[str] = os.getenv("EMAIL_PASSWORD")

    USER: Optional[str] = os.getenv("USER")
    PASSWORD: Optional[str] = os.getenv("PASSWORD")
    HOST: Optional[str] = os.getenv("HOST")
    PORT: Optional[str] = os.getenv("PORT")
    DBNAME: Optional[str] = os.getenv("DBNAME")

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()

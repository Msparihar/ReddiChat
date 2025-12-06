from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import urllib.parse


# Use DATABASE_URL directly if available, otherwise build from components
if settings.DATABASE_URL and not settings.DATABASE_URL.startswith("sqlite"):
    DATABASE_URL = settings.DATABASE_URL
elif settings.USER and settings.PASSWORD and settings.HOST and settings.DB_PORT and settings.DBNAME:
    USER_ENC = urllib.parse.quote_plus(settings.USER)
    PASSWORD_ENC = urllib.parse.quote_plus(settings.PASSWORD)
    DATABASE_URL = f"postgresql://{USER_ENC}:{PASSWORD_ENC}@{settings.HOST}:{settings.DB_PORT}/{settings.DBNAME}"
else:
    DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=2,
)

# Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for declarative models
Base = declarative_base()


def get_db():
    """
    Dependency to get a database session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

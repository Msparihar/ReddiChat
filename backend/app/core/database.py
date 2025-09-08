from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./redidchat.db")

# Create the SQLAlchemy engine with optimized settings
connect_args = {}
if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL optimizations
    connect_args = {
        "connect_timeout": 10,
    }

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False,  # Disabled for better performance
    pool_size=5,  # Smaller pool for better resource management
    max_overflow=10,  # Reasonable overflow limit
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=1800,  # Recycle connections every 30 minutes (faster recycling)
    pool_timeout=20,  # Timeout for getting connection from pool
    isolation_level="READ_COMMITTED",  # Better concurrency
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

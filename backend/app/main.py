from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import chat_router, auth_router, chat_history_router
from app.core.database import engine, Base
import os


# Create all database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION, openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Default localhost origins for development
default_origins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://localhost:3000",
    "https://reddichat-frontend-267146955755.us-east1.run.app",
]

# Add CORS middleware with specific origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# Add authentication middleware (temporarily disabled while using dependencies)
# app.add_middleware(AuthMiddleware)

# Include routers
app.include_router(chat_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(chat_history_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {"message": "Welcome to ReddiChats API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True, log_level="info")

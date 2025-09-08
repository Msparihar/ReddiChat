from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import ChatService
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.core.logger import logger

router = APIRouter(
    prefix="/chat",
    tags=["chat"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=ChatResponse)
def chat(chat_request: ChatRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """
    Process a chat message and return the agent's response

    Args:
        chat_request: The chat request containing the user message
        db: Database session dependency
        user: Current authenticated user

    Returns:
        ChatResponse: The chat response with the agent's reply
    """
    try:
        chat_service = ChatService(db, user)
        response = chat_service.process_chat_message(chat_request)
        return response
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing chat message: {str(e)}")


@router.get("/health")
def health_check():
    """
    Health check endpoint for the chat service

    Returns:
        dict: Health status
    """
    return {"status": "Chat service is healthy"}

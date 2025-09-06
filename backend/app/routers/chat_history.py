from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.chat_service import ChatService
from app.schemas.chat import Conversation
from app.models.chat import Conversation as ConversationModel
from app.dependencies.auth import get_current_user
from app.models.user import User
from typing import List
import math
import uuid
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/chat/history",
    tags=["chat history"],
    responses={404: {"description": "Not found"}},
)


@router.get("/conversations", response_model=dict)
async def get_user_conversations(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
):
    """
    Get paginated list of user's conversations

    Args:
        db: Database session dependency
        user: Current authenticated user
        page: Page number (starting from 1)
        size: Number of conversations per page (1-100)

    Returns:
        dict: Paginated list of conversations with metadata
    """
    try:
        # Calculate offset for pagination
        offset = (page - 1) * size

        # Get total count of user's conversations
        total_conversations = db.query(ConversationModel).filter(ConversationModel.user_id == user.id).count()

        # Get paginated conversations
        conversations = (
            db.query(ConversationModel)
            .filter(ConversationModel.user_id == user.id)
            .order_by(ConversationModel.updated_at.desc())
            .offset(offset)
            .limit(size)
            .all()
        )

        # Calculate total pages
        total_pages = math.ceil(total_conversations / size)

        # Convert SQLAlchemy objects to dictionaries for JSON serialization
        conversations_data = []
        for conv in conversations:
            conv_dict = {
                "id": str(conv.id),
                "title": conv.title,
                "created_at": conv.created_at.isoformat() if conv.created_at else None,
                "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
                "user_id": str(conv.user_id),
            }
            conversations_data.append(conv_dict)

        return {
            "conversations": conversations_data,
            "pagination": {"page": page, "size": size, "total": total_conversations, "pages": total_pages},
        }
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error in get_user_conversations endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving conversations: {str(e)}")


@router.get("/conversations/{conversation_id}", response_model=Conversation)
async def get_conversation_detail(
    conversation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """
    Get detailed conversation with all messages

    Args:
        conversation_id: The ID of the conversation to retrieve
        db: Database session dependency
        user: Current authenticated user

    Returns:
        Conversation: The complete conversation with all messages
    """
    try:
        # Convert conversation_id to UUID if it's a string
        try:
            conversation_uuid = uuid.UUID(conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid conversation ID format")

        # Get conversation for this user
        conversation = (
            db.query(ConversationModel)
            .filter(ConversationModel.id == conversation_uuid, ConversationModel.user_id == user.id)
            .first()
        )

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found or does not belong to user")

        # Eager load messages
        db.refresh(conversation)

        # Convert to Pydantic model for proper serialization
        from app.schemas.chat import Conversation as ConversationSchema

        return ConversationSchema.from_orm(conversation)
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving conversation: {str(e)}")


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """
    Delete a conversation and all its messages

    Args:
        conversation_id: The ID of the conversation to delete
        db: Database session dependency
        user: Current authenticated user

    Returns:
        dict: Success message
    """
    try:
        # Convert conversation_id to UUID if it's a string
        try:
            conversation_uuid = uuid.UUID(conversation_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid conversation ID format")

        # Get conversation for this user
        conversation = (
            db.query(ConversationModel)
            .filter(ConversationModel.id == conversation_uuid, ConversationModel.user_id == user.id)
            .first()
        )

        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found or does not belong to user")

        # Delete the conversation (messages will be deleted due to cascade)
        db.delete(conversation)
        db.commit()

        return {"message": "Conversation deleted successfully"}
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting conversation: {str(e)}")

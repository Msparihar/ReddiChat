from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.chat import Conversation
from app.models.chat import Conversation as ConversationModel
from app.dependencies.auth import get_current_user
from app.models.user import User
import math
import uuid
from app.core.logger import logger

router = APIRouter(
    prefix="/chat/history",
    tags=["chat history"],
    responses={404: {"description": "Not found"}},
)


@router.get("/conversations", response_model=dict)
def get_user_conversations(
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
        logger.info(f"User {user.email} requesting conversations - page: {page}, size: {size}")
        # Calculate offset for pagination
        offset = (page - 1) * size

        # Optimized query: get conversations and count in a single query transaction
        base_query = db.query(ConversationModel).filter(ConversationModel.user_id == user.id)

        # Get total count efficiently
        total_conversations = base_query.count()

        # Get paginated conversations in one optimized query
        conversations = base_query.order_by(ConversationModel.updated_at.desc()).offset(offset).limit(size).all()

        # Calculate total pages
        total_pages = math.ceil(total_conversations / size) if total_conversations > 0 else 1

        # Optimized conversion using list comprehension
        conversations_data = [
            {
                "id": str(conv.id),
                "title": conv.title,
                "created_at": conv.created_at.isoformat() if conv.created_at else None,
                "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
                "user_id": str(conv.user_id),
            }
            for conv in conversations
        ]

        result = {
            "conversations": conversations_data,
            "pagination": {"page": page, "size": size, "total": total_conversations, "pages": total_pages},
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "avatar_url": user.avatar_url,
                "provider": user.provider.value if user.provider else None,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            },
        }
        logger.info(f"Successfully returned {len(conversations_data)} conversations for user {user.email}")
        return result
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error in get_user_conversations endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving conversations: {str(e)}")


@router.get("/conversations/{conversation_id}", response_model=Conversation)
def get_conversation_detail(
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

        return ConversationSchema.model_validate(conversation)
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving conversation: {str(e)}")


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
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

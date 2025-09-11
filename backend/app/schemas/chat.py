from pydantic import BaseModel, validator, model_validator
from typing import List, Optional
from datetime import datetime
from app.models.chat import MessageRole
from app.schemas.file_attachment import FileMetadata
import uuid


class RedditSource(BaseModel):
    """Reddit post source information"""

    title: str
    text: str
    url: str
    subreddit: str
    author: str
    score: int
    num_comments: int
    created_utc: str
    permalink: str


class MessageBase(BaseModel):
    content: str
    role: MessageRole


class MessageCreate(MessageBase):
    sources: Optional[List[RedditSource]] = []
    tool_used: Optional[str] = None


class Message(MessageBase):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: MessageRole
    timestamp: datetime
    sources: Optional[List[RedditSource]] = []
    tool_used: Optional[str] = None
    has_attachments: bool = False
    file_attachments: Optional[List[FileMetadata]] = []

    @validator("sources", pre=True)
    def validate_sources(cls, v):
        """Convert JSON sources to RedditSource objects"""
        if v is None:
            return []
        if isinstance(v, str):
            import json

            try:
                v = json.loads(v)
            except json.JSONDecodeError:
                return []
        if isinstance(v, list):
            return [RedditSource(**source) if isinstance(source, dict) else source for source in v]
        return []

    @model_validator(mode="after")
    def populate_file_attachments(self):
        """Populate file_attachments from SQLAlchemy relationships"""
        # Debug logging
        import logging

        logger = logging.getLogger(__name__)

        # Only populate if we have attachments and they haven't been populated yet
        if not self.file_attachments and self.has_attachments:
            logger.debug("Attempting to populate file_attachments")
            # Get the SQLAlchemy model instance if available
            if hasattr(self, "attachments") and self.attachments:
                attachments = self.attachments
                logger.debug(f"Found {len(attachments)} attachments")
                file_attachments = []
                for i, attachment in enumerate(attachments):
                    logger.debug(f"Processing attachment {i}: {type(attachment)}")
                    if hasattr(attachment, "file_attachment") and attachment.file_attachment:
                        file_attachment = attachment.file_attachment
                        logger.debug(f"File attachment found: {file_attachment.original_filename}")
                        file_metadata = FileMetadata(
                            id=file_attachment.id,
                            filename=file_attachment.original_filename,
                            file_type=file_attachment.file_type,
                            file_size=file_attachment.file_size,
                            mime_type=file_attachment.mime_type,
                            created_at=file_attachment.created_at,
                        )
                        file_attachments.append(file_metadata)
                    else:
                        logger.debug(f"No file_attachment found for attachment {i}")
                self.file_attachments = file_attachments
                logger.debug(f"Populated {len(file_attachments)} file_attachments")
            else:
                logger.debug("No 'attachments' found")

        return self

    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    title: str


class ConversationCreate(ConversationBase):
    pass


class Conversation(ConversationBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    messages: List[Message] = []

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[uuid.UUID] = None


class ChatResponse(BaseModel):
    response: str
    conversation_id: uuid.UUID
    message_id: uuid.UUID
    sources: Optional[List[RedditSource]] = []
    tool_used: Optional[str] = None
    files_processed: int = 0
    file_attachments: Optional[List[FileMetadata]] = []

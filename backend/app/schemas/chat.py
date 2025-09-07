from pydantic import BaseModel, validator
from typing import List, Optional, Union
from datetime import datetime
from app.models.chat import MessageRole
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
    sources: Optional[List[RedditSource]] = []
    tool_used: Optional[str] = None

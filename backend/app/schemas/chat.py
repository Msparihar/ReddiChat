from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.chat import MessageRole
import uuid


class MessageBase(BaseModel):
    content: str
    role: MessageRole


class MessageCreate(MessageBase):
    pass


class Message(MessageBase):
    id: uuid.UUID
    conversation_id: uuid.UUID
    role: MessageRole
    timestamp: datetime

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

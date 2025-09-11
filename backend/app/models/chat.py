from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from typing import List
import enum


class MessageRole(str, enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conversation(id={self.id}, title='{self.title}')>"


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    role = Column(Enum(MessageRole, values_callable=lambda obj: [e.value for e in obj]), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # New fields for Reddit sources and tool usage
    sources = Column(JSON, nullable=True)  # Store Reddit sources as JSON
    tool_used = Column(String, nullable=True)  # Store which tool was used
    has_attachments = Column(Boolean, default=False)  # Flag for messages with file attachments

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    user = relationship("User", back_populates="messages")
    attachments = relationship("MessageAttachment", back_populates="message", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Message(id={self.id}, role='{self.role}', content='{self.content[:50]}...')>"

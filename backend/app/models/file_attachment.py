from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, BigInteger, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
import enum


class FileType(str, enum.Enum):
    IMAGE = "image"
    AUDIO = "audio"
    VIDEO = "video"
    PDF = "pdf"


class ProcessingStatus(str, enum.Enum):
    PROCESSED = "processed"
    FAILED = "failed"


class FileAttachment(Base):
    __tablename__ = "file_attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=False)
    s3_bucket = Column(String(100), nullable=False)
    s3_key = Column(String(255), nullable=False)
    s3_url = Column(Text, nullable=False)
    processing_status = Column(String(20), default=ProcessingStatus.PROCESSED.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    file_metadata = Column(JSON, nullable=True)
    checksum = Column(String(64), nullable=True)

    # Relationships
    user = relationship("User", back_populates="file_attachments")
    message_attachments = relationship(
        "MessageAttachment", back_populates="file_attachment", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<FileAttachment(id={self.id}, filename='{self.original_filename}', type='{self.file_type}')>"


class MessageAttachment(Base):
    __tablename__ = "message_attachments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    message_id = Column(UUID(as_uuid=True), ForeignKey("messages.id"), nullable=False)
    file_attachment_id = Column(UUID(as_uuid=True), ForeignKey("file_attachments.id"), nullable=False)
    attachment_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    message = relationship("Message", back_populates="attachments")
    file_attachment = relationship("FileAttachment", back_populates="message_attachments")

    def __repr__(self):
        return f"<MessageAttachment(message_id={self.message_id}, file_id={self.file_attachment_id})>"

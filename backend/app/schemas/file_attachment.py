from pydantic import BaseModel, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models.file_attachment import FileType, ProcessingStatus
import uuid


class FileAttachmentBase(BaseModel):
    """Base schema for file attachments"""

    original_filename: str
    file_type: str
    file_size: int
    mime_type: str


class FileAttachmentCreate(FileAttachmentBase):
    """Schema for creating file attachments"""

    filename: str
    s3_bucket: str
    s3_key: str
    s3_url: str
    processing_status: str = ProcessingStatus.PROCESSED.value
    metadata: Optional[Dict[str, Any]] = None
    checksum: Optional[str] = None


class FileAttachment(FileAttachmentBase):
    """Schema for file attachment responses"""

    id: uuid.UUID
    user_id: uuid.UUID
    filename: str
    s3_bucket: str
    s3_key: str
    s3_url: str
    processing_status: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    checksum: Optional[str] = None

    class Config:
        from_attributes = True


class FileUploadResponse(BaseModel):
    """Response schema for file uploads"""

    id: uuid.UUID
    filename: str
    file_type: str
    file_size: int
    mime_type: str
    processing_status: str
    created_at: datetime


class MessageAttachmentBase(BaseModel):
    """Base schema for message attachments"""

    message_id: uuid.UUID
    file_attachment_id: uuid.UUID
    attachment_order: int = 0


class MessageAttachmentCreate(MessageAttachmentBase):
    """Schema for creating message attachments"""

    pass


class MessageAttachment(MessageAttachmentBase):
    """Schema for message attachment responses"""

    id: uuid.UUID
    created_at: datetime
    file_attachment: FileAttachment

    class Config:
        from_attributes = True


class FileMetadata(BaseModel):
    """Schema for file metadata in chat responses"""

    id: uuid.UUID
    filename: str
    file_type: str
    file_size: int
    mime_type: str
    created_at: datetime
    file_url: Optional[str] = None  # Pre-signed S3 URL for file access

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
            uuid.UUID: lambda v: str(v) if v else None,
        }

import base64
import fitz  # PyMuPDF
from PIL import Image
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.models.file_attachment import FileAttachment, FileType, ProcessingStatus
from app.models.user import User
from app.core.config import settings
from app.services.s3_service import get_s3_service, S3Service
import logging
import hashlib
import uuid
from typing import List, Optional, Tuple
import io

logger = logging.getLogger(__name__)


class FileProcessingService:
    """Service for processing uploaded files for multimodal LLM usage"""

    def __init__(self, db: Session, user: User, s3_service: S3Service):
        self.db = db
        self.user = user
        self.s3_service = s3_service

    def validate_file(self, file: UploadFile) -> Tuple[bool, str]:
        """
        Validate uploaded file

        Args:
            file: FastAPI UploadFile object

        Returns:
            Tuple[bool, str]: (is_valid, error_message)
        """
        # Check file size
        if hasattr(file, "size") and file.size > settings.MAX_FILE_SIZE:
            return False, f"File size exceeds maximum allowed size of {settings.MAX_FILE_SIZE / 1024 / 1024:.1f}MB"

        # Check content type
        if file.content_type not in settings.SUPPORTED_FILE_TYPES:
            return False, f"File type '{file.content_type}' is not supported"

        # Check filename
        if not file.filename:
            return False, "Filename is required"

        return True, ""

    def determine_file_type(self, content_type: str) -> FileType:
        """Determine file type from content type"""
        if content_type.startswith("image/"):
            return FileType.IMAGE
        elif content_type.startswith("audio/"):
            return FileType.AUDIO
        elif content_type.startswith("video/"):
            return FileType.VIDEO
        elif content_type == "application/pdf":
            return FileType.PDF
        else:
            raise ValueError(f"Unsupported content type: {content_type}")

    def calculate_checksum(self, data: bytes) -> str:
        """Calculate SHA256 checksum"""
        return hashlib.sha256(data).hexdigest()

    async def check_duplicate_file(self, checksum: str) -> Optional[FileAttachment]:
        """Check if file with same checksum already exists for user"""
        return (
            self.db.query(FileAttachment)
            .filter(FileAttachment.checksum == checksum, FileAttachment.user_id == self.user.id)
            .first()
        )

    async def extract_pdf_content(self, pdf_bytes: bytes) -> str:
        """
        Extract text content from PDF using PyMuPDF

        Args:
            pdf_bytes: PDF file binary data

        Returns:
            str: Extracted text content
        """
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            text_content = []

            for page_num in range(min(doc.page_count, 10)):  # Limit to first 10 pages
                page = doc[page_num]
                text = page.get_text()
                if text.strip():
                    text_content.append(f"Page {page_num + 1}:\n{text}")

            doc.close()
            return "\n\n".join(text_content)

        except Exception as e:
            logger.error(f"PDF text extraction failed: {str(e)}")
            return f"[PDF text extraction failed: {str(e)}]"

    async def process_image_metadata(self, image_bytes: bytes) -> dict:
        """Extract metadata from image"""
        try:
            # Check if image bytes are valid
            if not image_bytes:
                logger.warning("Empty image bytes provided")
                return {}

            # Try to open the image to verify it's valid
            image = Image.open(io.BytesIO(image_bytes))
            image.verify()  # Verify the image is valid

            # Reopen for metadata extraction (verify() consumes the image)
            image = Image.open(io.BytesIO(image_bytes))
            metadata = {"width": image.width, "height": image.height, "format": image.format, "mode": image.mode}
            logger.debug(f"Image metadata extracted: {metadata}")
            return metadata
        except Exception as e:
            logger.warning(f"Image metadata extraction failed: {str(e)}")
            return {}

    async def process_uploaded_file(self, file: UploadFile) -> dict:
        """
        Process uploaded file for LLM consumption

        Args:
            file: FastAPI UploadFile object

        Returns:
            dict: Processed file data
        """
        try:
            logger.debug(f"Starting file processing: {file.filename} ({file.content_type})")

            # Validate file
            is_valid, error_msg = self.validate_file(file)
            if not is_valid:
                raise HTTPException(status_code=400, detail=error_msg)

            # Read file content
            logger.debug(f"Reading file content: {file.filename}")
            try:
                content = await file.read()
                logger.debug(f"File read completed: {file.filename}, {len(content)} bytes")
            except Exception as read_error:
                logger.error(f"Error reading file {file.filename}: {str(read_error)}")
                raise

            content_hash = self.calculate_checksum(content)
            logger.debug(f"File checksum calculated: {file.filename}, checksum: {content_hash[:8]}...")

            # Check for duplicate
            logger.debug(f"Checking for duplicate file: {file.filename}")
            existing_file = await self.check_duplicate_file(content_hash)
            if existing_file:
                logger.info(f"Using existing file: {existing_file.id}")
                return {
                    "id": existing_file.id,
                    "binary_data": content,
                    "mime_type": existing_file.mime_type,
                    "filename": existing_file.original_filename,
                    "type": existing_file.file_type,
                    "size": existing_file.file_size,
                    "checksum": existing_file.checksum,
                    "is_duplicate": True,
                }

            # Determine file type
            logger.debug(f"Determining file type: {file.filename}")
            file_type = self.determine_file_type(file.content_type)
            logger.debug(f"Determined file type: {file.filename} -> {file_type.value}")

            # Process based on file type
            logger.debug(f"Processing file data: {file.filename}")
            processed_data = {
                "binary_data": content,
                "mime_type": file.content_type,
                "filename": file.filename,
                "type": file_type.value,
                "size": len(content),
                "checksum": content_hash,
                "is_duplicate": False,
            }

            if file_type == FileType.IMAGE:
                # Extract image metadata
                logger.debug(f"Processing image metadata: {file.filename}")
                metadata = await self.process_image_metadata(content)
                processed_data["file_metadata"] = metadata

            elif file_type == FileType.PDF:
                # Extract text content
                logger.debug(f"Extracting PDF content: {file.filename}")
                extracted_text = await self.extract_pdf_content(content)
                processed_data["extracted_content"] = extracted_text

            # For audio/video, we'll pass binary data directly to LLM
            logger.debug(f"File processing completed: {file.filename}")
            return processed_data

        except Exception as e:
            logger.error(f"Error processing uploaded file {file.filename}: {str(e)}", exc_info=True)
            raise

    def create_multimodal_content(self, text: str, files: List[dict]) -> List[dict]:
        """
        Create LangChain multimodal message format

        Args:
            text: Text message content
            files: List of processed file data

        Returns:
            List[dict]: Multimodal content for LangChain
        """
        content = [{"type": "text", "text": text}]

        for file_data in files:
            file_type = file_data["type"]

            if file_type == "image":
                # Image content for Gemini - use the format expected by LangChain Google Generative AI
                base64_data = base64.b64encode(file_data["binary_data"]).decode("utf-8")
                content.append(
                    {"type": "image_url", "image_url": {"url": f"data:{file_data['mime_type']};base64,{base64_data}"}}
                )

            elif file_type in ["audio", "video"]:
                # Audio/Video content for Gemini
                base64_data = base64.b64encode(file_data["binary_data"]).decode("utf-8")
                content.append({"type": "media", "data": base64_data, "mime_type": file_data["mime_type"]})

            elif file_type == "pdf":
                # Add extracted text content
                if "extracted_content" in file_data:
                    content.append(
                        {
                            "type": "text",
                            "text": f"\n\n[PDF Content: {file_data['filename']}]\n{file_data['extracted_content']}\n[End PDF Content]\n",
                        }
                    )

        return content

    async def store_file_in_s3(self, file_data: dict) -> FileAttachment:
        """
        Store file in S3 and create database record

        Args:
            file_data: Processed file data

        Returns:
            FileAttachment: Database record for the stored file
        """
        try:
            # Generate S3 key
            s3_key = self.s3_service.generate_s3_key(str(self.user.id), file_data["filename"], file_data["checksum"])

            # Prepare metadata for S3
            s3_metadata = {
                "original_filename": file_data["filename"],
                "file_type": file_data["type"],
                "checksum": file_data["checksum"],
                "user_id": str(self.user.id),
            }

            # Upload to S3
            if self.s3_service.is_available():
                upload_result = await self.s3_service.upload_file(
                    file_data["binary_data"], s3_key, file_data["mime_type"], s3_metadata
                )

                s3_url = upload_result["s3_url"]
                s3_bucket = upload_result["s3_bucket"]
                processing_status = ProcessingStatus.PROCESSED

            else:
                # S3 not available, store locally or handle gracefully
                logger.warning("S3 not available, storing file metadata only")
                s3_url = f"local://{s3_key}"
                s3_bucket = "local"
                processing_status = ProcessingStatus.PROCESSED

            # Create database record
            file_attachment = FileAttachment(
                user_id=self.user.id,
                filename=f"{uuid.uuid4()}_{file_data['filename']}",
                original_filename=file_data["filename"],
                file_type=file_data["type"],
                file_size=file_data["size"],
                mime_type=file_data["mime_type"],
                s3_bucket=s3_bucket,
                s3_key=s3_key,
                s3_url=s3_url,
                processing_status=processing_status.value,
                file_metadata=file_data.get("file_metadata"),
                checksum=file_data["checksum"],
            )

            self.db.add(file_attachment)
            self.db.commit()
            self.db.refresh(file_attachment)

            logger.info(f"File stored successfully: {file_attachment.id}")
            return file_attachment

        except Exception as e:
            self.db.rollback()
            error_msg = f"Failed to store file: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)

    async def retrieve_file_for_context(self, file_attachment: FileAttachment) -> Optional[dict]:
        """
        Retrieve file binary data for LLM context

        Args:
            file_attachment: Database record for the file

        Returns:
            dict: File data for multimodal content, or None if retrieval fails
        """
        try:
            if self.s3_service.is_available() and not file_attachment.s3_url.startswith("local://"):
                # Retrieve from S3
                binary_data = await self.s3_service.download_file(file_attachment.s3_key)
            else:
                # Handle local storage or unavailable S3
                logger.warning(f"Cannot retrieve file {file_attachment.id}: S3 not available or local storage")
                return None

            file_data = {
                "binary_data": binary_data,
                "mime_type": file_attachment.mime_type,
                "filename": file_attachment.original_filename,
                "type": file_attachment.file_type,
                "size": file_attachment.file_size,
            }

            # For PDFs, re-extract content if needed
            if file_attachment.file_type == FileType.PDF.value:
                extracted_content = await self.extract_pdf_content(binary_data)
                file_data["extracted_content"] = extracted_content

            return file_data

        except Exception as e:
            logger.error(f"Failed to retrieve file {file_attachment.id}: {str(e)}")
            return None


def get_file_service(db: Session, user: User) -> FileProcessingService:
    """Dependency injection for file processing service"""
    s3_service = get_s3_service()
    return FileProcessingService(db, user, s3_service)

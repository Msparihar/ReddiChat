from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services import ChatService
from app.services.chat_service_multimodal import get_chat_service_multimodal
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.core.config import settings
from typing import List, Optional, AsyncGenerator
import uuid
from app.core.logger import get_logger
from fastapi.responses import StreamingResponse
import json
from datetime import datetime
import io
from starlette.datastructures import UploadFile as StarletteUploadFile

# Set up logging
logger = get_logger(__name__)


class CustomJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle UUID and datetime objects"""

    def default(self, obj):
        if isinstance(obj, uuid.UUID):
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


router = APIRouter(
    prefix="/chat",
    tags=["chat"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=ChatResponse)
async def chat_with_files(
    message: str = Form(...),
    conversation_id: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Process a chat message with optional file attachments and return the agent's response

    Args:
        message: The text message content
        conversation_id: Optional conversation ID
        files: List of uploaded files (images, audio, video, PDFs)
        db: Database session dependency
        user: Current authenticated user

    Returns:
        ChatResponse: The chat response with the agent's reply
    """
    logger.info(f"🔵 Chat request: user={user}, files={len(files)}, conv_id={conversation_id}")

    try:
        # Validate number of files
        if len(files) > settings.MAX_FILES_PER_MESSAGE:
            logger.warning(f"⚠️  Too many files: {len(files)} > {settings.MAX_FILES_PER_MESSAGE}")
            raise HTTPException(
                status_code=400, detail=f"Maximum {settings.MAX_FILES_PER_MESSAGE} files allowed per message"
            )

        # Parse conversation_id if provided
        parsed_conversation_id = None
        if conversation_id:
            try:
                parsed_conversation_id = uuid.UUID(conversation_id)
                logger.debug(f"📝 Using existing conversation: {parsed_conversation_id}")
            except ValueError:
                logger.error(f"❌ Invalid conversation ID format: {conversation_id}")
                raise HTTPException(status_code=400, detail="Invalid conversation ID format")

        # Log file details
        if files:
            file_info = [f"{f.filename}({f.content_type})" for f in files]
            logger.info(f"📁 Processing files: {file_info}")

        # Use multimodal chat service
        logger.debug("🚀 Starting chat processing...")

        # Read file contents immediately to prevent "I/O operation on closed file" error
        # This is necessary because FastAPI may close the temporary file before async processing completes
        processed_files = []
        for file in files:
            if file.filename:  # Only process files with filenames
                # Read file content immediately
                content = await file.read()

                # Create a file-like object with the content in memory
                file_copy = StarletteUploadFile(
                    filename=file.filename, file=io.BytesIO(content), headers=file.headers, size=len(content)
                )
                processed_files.append(file_copy)

        chat_service = get_chat_service_multimodal(db, user)
        response = await chat_service.process_chat_message_with_files(
            message=message, files=processed_files, conversation_id=parsed_conversation_id
        )

        logger.info(f"✅ Chat completed: conv_id={response.conversation_id}, tool={response.tool_used}")
        return response

    except HTTPException as e:
        logger.warning(f"⚠️  HTTP error: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing chat message: {str(e)}")


@router.post("/stream")
async def chat_stream(
    message: str = Form(...),
    conversation_id: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> StreamingResponse:
    """
    Process a chat message with optional file attachments and stream the agent's response via SSE

    Args:
        message: The text message content
        conversation_id: Optional conversation ID
        files: List of uploaded files (images, audio, video, PDFs)
        db: Database session dependency
        user: Current authenticated user

    Returns:
        StreamingResponse: SSE stream of response chunks, tools, and final data
    """
    logger.info(f"🔵 Streaming chat request: user={user}, files={len(files)}, conv_id={conversation_id}")

    try:
        # Validate number of files
        if len(files) > settings.MAX_FILES_PER_MESSAGE:
            logger.warning(f"⚠️  Too many files: {len(files)} > {settings.MAX_FILES_PER_MESSAGE}")
            raise HTTPException(
                status_code=400, detail=f"Maximum {settings.MAX_FILES_PER_MESSAGE} files allowed per message"
            )

        # Parse conversation_id if provided
        parsed_conversation_id = None
        if conversation_id:
            try:
                parsed_conversation_id = uuid.UUID(conversation_id)
                logger.debug(f"📝 Using existing conversation: {parsed_conversation_id}")
            except ValueError:
                logger.error(f"❌ Invalid conversation ID format: {conversation_id}")
                raise HTTPException(status_code=400, detail="Invalid conversation ID format")

        # Log file details
        if files:
            file_info = [f"{f.filename}({f.content_type})" for f in files]
            logger.info(f"📁 Processing files: {file_info}")

        # Read file contents immediately to prevent "I/O operation on closed file" error
        # This is necessary because FastAPI may close the temporary file before async processing completes
        processed_files = []
        for file in files:
            if file.filename:  # Only process files with filenames
                # Read file content immediately
                content = await file.read()

                # Create a file-like object with the content in memory
                file_copy = StarletteUploadFile(
                    filename=file.filename, file=io.BytesIO(content), headers=file.headers, size=len(content)
                )
                processed_files.append(file_copy)

        # Use multimodal chat service
        logger.debug("🚀 Starting streaming chat processing...")
        chat_service = get_chat_service_multimodal(db, user)

        async def event_stream() -> AsyncGenerator[str, None]:
            logger.debug("Starting event stream")
            try:
                async for event in chat_service.process_chat_message_with_files_stream(
                    message=message, files=processed_files, conversation_id=parsed_conversation_id
                ):
                    # Yield SSE formatted event
                    logger.debug(f"Yielding event: {event.get('type', 'unknown')}")
                    # Convert Pydantic models to dictionaries for JSON serialization
                    serializable_event = {}
                    for key, value in event.items():
                        if hasattr(value, "model_dump"):
                            # Pydantic model - convert to dict
                            serializable_event[key] = value.model_dump()
                        elif isinstance(value, list) and value and hasattr(value[0], "model_dump"):
                            # List of Pydantic models - convert each to dict
                            serializable_event[key] = [item.model_dump() for item in value]
                        else:
                            serializable_event[key] = value
                    yield f"data: {json.dumps(serializable_event, cls=CustomJSONEncoder)}\n\n"

                # End of stream
                logger.debug("Stream completed")
                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.error(f"Error in event stream: {str(e)}", exc_info=True)
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)}, cls=CustomJSONEncoder)}\n\n"

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )

    except HTTPException as e:
        logger.warning(f"⚠️  HTTP error in stream endpoint: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in stream endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing streaming chat: {str(e)}")


@router.post("/text-only", response_model=ChatResponse)
async def chat_text_only(
    chat_request: ChatRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """
    Process a text-only chat message (legacy endpoint for backward compatibility)

    Args:
        chat_request: The chat request containing the user message
        db: Database session dependency
        user: Current authenticated user

    Returns:
        ChatResponse: The chat response with the agent's reply
    """
    logger.info(f"🔵 Text-only chat: user={user.name}, conv_id={chat_request.conversation_id}")

    try:
        logger.debug("🚀 Starting text-only chat processing...")
        chat_service = ChatService(db, user)
        response = chat_service.process_chat_message(chat_request)

        # Convert to new response format
        result = ChatResponse(
            response=response.response,
            conversation_id=response.conversation_id,
            message_id=uuid.uuid4(),  # Generate a temporary ID for compatibility
            sources=response.sources,
            tool_used=response.tool_used,
            files_processed=0,
        )

        logger.info(f"✅ Text-only chat completed: conv_id={result.conversation_id}, tool={result.tool_used}")
        return result

    except HTTPException as e:
        logger.warning(f"⚠️  HTTP error in text-only chat: {e.status_code} - {e.detail}")
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error in text-only chat endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing chat message: {str(e)}")


@router.post("/upload-test")
async def test_file_upload(
    files: List[UploadFile] = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)
):
    """
    Test endpoint for file upload functionality

    Args:
        files: List of uploaded files
        db: Database session dependency
        user: Current authenticated user

    Returns:
        dict: Upload test results
    """
    logger.info(f"🧪 Upload test: user={user.name}, files={len(files)}")

    try:
        from app.services.file_service import get_file_service

        file_service = get_file_service(db, user)
        results = []

        for file in files:
            logger.debug(f"📁 Testing upload: {file.filename}")
            try:
                # Process file
                processed_file = await file_service.process_uploaded_file(file)

                # Store in S3
                stored_file = await file_service.store_file_in_s3(processed_file)

                results.append(
                    {
                        "filename": file.filename,
                        "file_type": processed_file["type"],
                        "file_size": processed_file["size"],
                        "status": "success",
                        "file_id": str(stored_file.id),
                        "s3_url": stored_file.s3_url,
                    }
                )
                logger.info(f"✅ Upload success: {file.filename}")

            except Exception as e:
                logger.error(f"❌ Upload failed for {file.filename}: {str(e)}")
                results.append({"filename": file.filename, "status": "error", "error": str(e)})

        successful_uploads = len([r for r in results if r["status"] == "success"])
        logger.info(f"🧪 Upload test completed: {successful_uploads}/{len(files)} successful")

        return {
            "message": "File upload test completed",
            "results": results,
            "total_files": len(files),
            "successful_uploads": successful_uploads,
        }

    except Exception as e:
        logger.error(f"❌ File upload test error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload test failed: {str(e)}")


@router.get("/health")
async def health_check():
    """
    Health check endpoint for the chat service

    Returns:
        dict: Health status
    """
    logger.debug("💓 Health check requested")
    return {"status": "Chat service is healthy"}

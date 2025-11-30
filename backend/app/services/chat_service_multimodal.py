from sqlalchemy.orm import Session, joinedload
from app.models.chat import Conversation, Message, MessageRole
from app.models.file_attachment import FileAttachment, MessageAttachment
from app.models.user import User
from app.schemas.chat import ChatResponse, ConversationCreate, MessageCreate, RedditSource
from app.schemas.file_attachment import FileMetadata
from app.agents.chat_agent import get_chat_response_multimodal, get_chat_response_stream
from app.services.file_service import FileProcessingService
from app.services.s3_service import get_s3_service
import uuid
from typing import List, Optional, Dict, Any, AsyncGenerator
from datetime import datetime, timedelta, timezone
import logging

logger = logging.getLogger(__name__)


class ChatServiceMultimodal:
    """Enhanced chat service with multimodal file support"""

    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user
        self.file_service = FileProcessingService(db, user, get_s3_service())

    def get_or_create_conversation(
        self, conversation_id: Optional[uuid.UUID] = None, initial_title: Optional[str] = None
    ) -> Conversation:
        """
        Get an existing conversation or create a new one

        Args:
            conversation_id: Optional conversation ID
            initial_title: Optional title for new conversations (defaults to "New Chat")

        Returns:
            Conversation: The conversation object
        """
        if conversation_id:
            conversation = (
                self.db.query(Conversation)
                .filter(Conversation.id == conversation_id, Conversation.user_id == self.user.id)
                .first()
            )
            if conversation:
                return conversation

        # Create a new conversation with provided title or default
        title = initial_title if initial_title else "New Chat"
        conversation_data = ConversationCreate(title=title)
        db_conversation = Conversation(**conversation_data.model_dump(), user_id=self.user.id)
        self.db.add(db_conversation)
        self.db.commit()
        self.db.refresh(db_conversation)
        return db_conversation

    def should_include_file_binary(self, message: Message) -> bool:
        """
        Determine if file binary data should be included in chat history
        Strategy: Include files from recent messages within context window
        """
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=1)  # Configurable
        return message.timestamp > cutoff_time

    async def build_multimodal_content_from_message(self, message: Message) -> List[Dict[str, Any]]:
        """
        Reconstruct multimodal content from stored files for a message

        Args:
            message: Message with potential file attachments

        Returns:
            List[Dict]: Multimodal content for LangChain
        """
        content = [{"type": "text", "text": message.content}]

        if not message.attachments:
            return content

        for attachment in message.attachments:
            file_attachment = attachment.file_attachment

            try:
                # Retrieve file data for context
                file_data = await self.file_service.retrieve_file_for_context(file_attachment)

                if file_data:
                    if file_attachment.file_type == "image":
                        import base64

                        base64_data = base64.b64encode(file_data["binary_data"]).decode("utf-8")
                        content.append(
                            {
                                "type": "image_url",
                                "image_url": {"url": f"data:{file_attachment.mime_type};base64,{base64_data}"},
                            }
                        )
                    elif file_attachment.file_type in ["audio", "video"]:
                        import base64

                        base64_data = base64.b64encode(file_data["binary_data"]).decode("utf-8")
                        content.append({"type": "media", "data": base64_data, "mime_type": file_attachment.mime_type})
                    elif file_attachment.file_type == "pdf":
                        if "extracted_content" in file_data:
                            content.append(
                                {
                                    "type": "text",
                                    "text": f"\n\n[PDF: {file_attachment.original_filename}]\n{file_data['extracted_content']}\n[End PDF]\n",
                                }
                            )
                else:
                    # Include metadata only if binary data unavailable
                    content.append(
                        {
                            "type": "text",
                            "text": f"\n\n[File: {file_attachment.original_filename} - Content unavailable]\n",
                        }
                    )

            except Exception as e:
                logger.warning(f"Failed to build multimodal content for file {file_attachment.id}: {str(e)}")
                # Include metadata only
                content.append(
                    {"type": "text", "text": f"\n\n[File: {file_attachment.original_filename} - Content unavailable]\n"}
                )

        return content

    async def get_conversation_history_with_files(
        self, conversation_id: uuid.UUID, include_files: bool = True
    ) -> List[Dict]:
        """
        Retrieve chat history with optional file dereferencing

        Args:
            conversation_id: The conversation ID
            include_files: Whether to include file binary data for recent messages

        Returns:
            List[Dict]: List of messages formatted for LLM
        """
        # Get messages with attachment info
        messages = (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id, Message.user_id == self.user.id)
            .options(joinedload(Message.attachments).joinedload(MessageAttachment.file_attachment))
            .order_by(Message.timestamp)
            .all()
        )

        chat_history = []

        for message in messages:
            msg_data = {"role": "user" if message.role == MessageRole.USER else "assistant", "content": message.content}

            # Handle file attachments
            if message.attachments and include_files and message.role == MessageRole.USER:
                # Only include binary data for recent user messages
                if self.should_include_file_binary(message):
                    multimodal_content = await self.build_multimodal_content_from_message(message)
                    msg_data["content"] = multimodal_content

            chat_history.append(msg_data)

        return chat_history

    def save_message_with_attachments(
        self,
        conversation_id: uuid.UUID,
        content: str,
        role: MessageRole,
        file_attachments: List[FileAttachment] = None,
        sources: Optional[List[dict]] = None,
        tool_used: Optional[str] = None,
    ) -> Message:
        """
        Save a message with file attachments to the database

        Args:
            conversation_id: The conversation ID
            content: The message content
            role: The message role (user/assistant)
            file_attachments: List of file attachments
            sources: Optional list of Reddit sources
            tool_used: Optional tool that was used

        Returns:
            Message: The saved message
        """
        # Create message
        has_attachments = bool(file_attachments)
        message_data = MessageCreate(content=content, role=role, sources=sources or [], tool_used=tool_used)

        db_message = Message(
            **message_data.model_dump(),
            conversation_id=conversation_id,
            user_id=self.user.id,
            has_attachments=has_attachments,
        )

        self.db.add(db_message)
        self.db.flush()  # Get the message ID without committing

        # Create message attachments if files provided
        if file_attachments:
            for order, file_attachment in enumerate(file_attachments):
                message_attachment = MessageAttachment(
                    message_id=db_message.id, file_attachment_id=file_attachment.id, attachment_order=order
                )
                self.db.add(message_attachment)

        self.db.commit()
        self.db.refresh(db_message)
        return db_message

    async def process_chat_message_with_files(
        self, message: str, files: List[Any], conversation_id: Optional[uuid.UUID] = None
    ) -> ChatResponse:
        """
        Process a chat message with optional file attachments

        Args:
            message: Text message content
            files: List of uploaded files (FastAPI UploadFile objects)
            conversation_id: Optional conversation ID

        Returns:
            ChatResponse: The chat response with the agent's reply
        """
        try:
            # Get or create conversation with initial title from first message
            initial_title = message[:50] + "..." if len(message) > 50 else message
            conversation = self.get_or_create_conversation(conversation_id, initial_title)

            # Process uploaded files
            processed_files = []
            stored_files = []

            for file in files:
                # Process file for LLM consumption
                file_data = await self.file_service.process_uploaded_file(file)
                processed_files.append(file_data)

                # Store file in S3 (if not duplicate)
                if not file_data.get("is_duplicate", False):
                    stored_file = await self.file_service.store_file_in_s3(file_data)
                    stored_files.append(stored_file)
                else:
                    # Find existing file record
                    existing_file = self.db.query(FileAttachment).filter(FileAttachment.id == file_data["id"]).first()
                    if existing_file:
                        stored_files.append(existing_file)

            # Create multimodal message for LLM
            if processed_files:
                multimodal_content = self.file_service.create_multimodal_content(message, processed_files)
                llm_message = {"role": "user", "content": multimodal_content}
            else:
                llm_message = {"role": "user", "content": message}

            # Get chat history with dereferenced files if needed
            chat_history = await self.get_conversation_history_with_files(conversation.id)

            # Process with LangGraph agent
            agent_response = get_chat_response_multimodal(llm_message, chat_history)

            # Save user message with attachments
            user_message = self.save_message_with_attachments(conversation.id, message, MessageRole.USER, stored_files)

            # Extract response content and sources
            agent_response_content = agent_response.get("content", "")
            agent_sources = agent_response.get("sources", [])
            tool_used = agent_response.get("tool_used")

            # Save agent message
            agent_message = self.save_message_with_attachments(
                conversation.id,
                agent_response_content,
                MessageRole.ASSISTANT,
                sources=agent_sources,
                tool_used=tool_used,
            )

            # Title is already set during conversation creation, no need to update here

            # Convert agent sources to RedditSource objects
            reddit_sources = []
            if agent_sources:
                for source in agent_sources:
                    try:
                        reddit_source = RedditSource(
                            title=source.get("title", ""),
                            text=source.get("text", ""),
                            url=source.get("url", ""),
                            subreddit=source.get("subreddit", ""),
                            author=source.get("author", ""),
                            score=source.get("score", 0),
                            num_comments=source.get("num_comments", 0),
                            created_utc=source.get("created_utc", ""),
                            permalink=source.get("permalink", ""),
                        )
                        reddit_sources.append(reddit_source)
                    except Exception as e:
                        logger.error(f"Error processing Reddit source: {e}")

            # Generate file URLs for response
            file_attachments_with_urls = []
            s3_service = get_s3_service()

            for file_attachment in stored_files:
                file_metadata = FileMetadata(
                    id=file_attachment.id,
                    filename=file_attachment.original_filename,
                    file_type=file_attachment.file_type,
                    file_size=file_attachment.file_size,
                    mime_type=file_attachment.mime_type,
                    created_at=file_attachment.created_at,
                    file_url=s3_service.generate_presigned_url(file_attachment.s3_key)
                    if s3_service.is_available()
                    else None,
                )
                file_attachments_with_urls.append(file_metadata)

            return ChatResponse(
                response=agent_response_content,
                conversation_id=conversation.id,
                message_id=agent_message.id,
                sources=reddit_sources,
                tool_used=tool_used,
                files_processed=len(stored_files),
                file_attachments=file_attachments_with_urls,
            )

        except Exception as e:
            # Rollback any database changes
            self.db.rollback()
            logger.error(f"Error processing chat message with files: {str(e)}")
            raise Exception(f"Failed to process chat message: {str(e)}")

    async def process_chat_message_with_files_stream(
        self, message: str, files: List[Any], conversation_id: Optional[uuid.UUID] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Process a chat message with optional file attachments via streaming

        Args:
            message: Text message content
            files: List of uploaded files (FastAPI UploadFile objects)
            conversation_id: Optional conversation ID

        Yields:
            Dict: Streaming events with content chunks, tools, and final response
        """
        user_message = None
        try:
            # Get or create conversation with initial title from first message
            initial_title = message[:50] + "..." if len(message) > 50 else message
            conversation = self.get_or_create_conversation(conversation_id, initial_title)

            # Process uploaded files
            processed_files = []
            stored_files = []

            for file in files:
                # Process file for LLM consumption
                logger.debug(f"Processing uploaded file: {file.filename}")
                file_data = await self.file_service.process_uploaded_file(file)
                processed_files.append(file_data)
                logger.debug(f"File processing completed: {file.filename}")

                # Store file in S3 (if not duplicate)
                if not file_data.get("is_duplicate", False):
                    logger.debug(f"Storing file in S3: {file.filename}")
                    stored_file = await self.file_service.store_file_in_s3(file_data)
                    stored_files.append(stored_file)
                    logger.debug(f"File stored in S3: {file.filename}")
                else:
                    # Find existing file record
                    logger.debug(f"Using existing file record: {file.filename}")
                    existing_file = self.db.query(FileAttachment).filter(FileAttachment.id == file_data["id"]).first()
                    if existing_file:
                        stored_files.append(existing_file)
                        logger.debug(f"Existing file record added: {file.filename}")

            # Save user message with attachments early
            user_message = self.save_message_with_attachments(conversation.id, message, MessageRole.USER, stored_files)
            self.db.commit()  # Commit user message

            # Create multimodal message for LLM
            if processed_files:
                multimodal_content = self.file_service.create_multimodal_content(message, processed_files)
                llm_message = {"role": "user", "content": multimodal_content}
            else:
                llm_message = {"role": "user", "content": message}

            # Get chat history with dereferenced files if needed
            chat_history = await self.get_conversation_history_with_files(conversation.id)

            # Build all messages for agent (chat_history already includes the current message)
            all_messages = chat_history

            # Stream from agent
            async for event in get_chat_response_stream(all_messages):
                if event["type"] == "content":
                    yield {
                        "type": "content",
                        "delta": event["delta"],
                        "conversation_id": str(conversation.id),
                    }
                elif event["type"] == "tool_start":
                    yield {
                        "type": "tool_start",
                        "tool": event["tool"],
                        "conversation_id": str(conversation.id),
                    }
                elif event["type"] == "tool_end":
                    yield {
                        "type": "tool_end",
                        "output": event["output"],
                        "conversation_id": str(conversation.id),
                    }
                elif event["type"] == "done":
                    # Save agent message with full content
                    agent_message = self.save_message_with_attachments(
                        conversation.id,
                        event["content"],
                        MessageRole.ASSISTANT,
                        sources=event["sources"],
                        tool_used=event["tool_used"],
                    )

                    # Title is already set during conversation creation, no need to update here

                    # Generate file URLs
                    s3_service = get_s3_service()
                    file_attachments_with_urls = []
                    for file_attachment in stored_files:
                        file_metadata = FileMetadata(
                            id=file_attachment.id,
                            filename=file_attachment.original_filename,
                            file_type=file_attachment.file_type,
                            file_size=file_attachment.file_size,
                            mime_type=file_attachment.mime_type,
                            created_at=file_attachment.created_at,
                            file_url=s3_service.generate_presigned_url(file_attachment.s3_key)
                            if s3_service.is_available()
                            else None,
                        )
                        file_attachments_with_urls.append(file_metadata)

                    # Convert sources to RedditSource objects
                    reddit_sources = event["sources"]  # Already converted in agent

                    yield {
                        "type": "done",
                        "content": event["content"],
                        "conversation_id": str(conversation.id),
                        "message_id": str(agent_message.id),
                        "sources": reddit_sources,
                        "tool_used": event["tool_used"],
                        "files_processed": len(stored_files),
                        "file_attachments": file_attachments_with_urls,
                    }
                elif event["type"] == "error":
                    yield {
                        "type": "error",
                        "content": event["content"],
                        "conversation_id": str(conversation.id),
                    }
                    # Don't save assistant, but user message is already saved

            logger.info(f"✅ Streaming chat completed: conv_id={conversation.id}")

        except Exception as e:
            logger.error(f"Error in streaming chat: {str(e)}")
            if user_message:
                # Optionally delete user message on error, but for now keep it
                pass
            yield {
                "type": "error",
                "content": f"Failed to process chat message: {str(e)}",
                "conversation_id": str(conversation.id) if "conversation" in locals() else None,
            }
            if hasattr(self, "db") and self.db:
                self.db.rollback()


def get_chat_service_multimodal(db: Session, user: User) -> ChatServiceMultimodal:
    """Dependency injection for multimodal chat service"""
    return ChatServiceMultimodal(db, user)

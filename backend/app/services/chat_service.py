from sqlalchemy.orm import Session
from app.models.chat import Conversation, Message, MessageRole
from app.models.user import User
from app.schemas.chat import ChatRequest, ChatResponse, ConversationCreate, MessageCreate, RedditSource
from app.agents import get_chat_response
import uuid
from typing import List, Optional


class ChatService:
    def __init__(self, db: Session, user: User):
        self.db = db
        self.user = user

    def get_or_create_conversation(self, conversation_id: Optional[uuid.UUID] = None) -> Conversation:
        """
        Get an existing conversation or create a new one

        Args:
            conversation_id: Optional conversation ID

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

        # Create a new conversation
        conversation_data = ConversationCreate(title="New Chat")
        db_conversation = Conversation(**conversation_data.model_dump(), user_id=self.user.id)
        self.db.add(db_conversation)
        self.db.commit()
        self.db.refresh(db_conversation)
        return db_conversation

    def get_conversation_history(self, conversation_id: uuid.UUID) -> List[Message]:
        """
        Get the conversation history

        Args:
            conversation_id: The conversation ID

        Returns:
            List[Message]: List of messages in the conversation
        """
        return (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id, Message.user_id == self.user.id)
            .order_by(Message.timestamp)
            .all()
        )

    def save_message(
        self,
        conversation_id: uuid.UUID,
        content: str,
        role: MessageRole,
        sources: Optional[List[dict]] = None,
        tool_used: Optional[str] = None,
    ) -> Message:
        """
        Save a message to the database

        Args:
            conversation_id: The conversation ID
            content: The message content
            role: The message role (user/assistant)
            sources: Optional list of Reddit sources
            tool_used: Optional tool that was used

        Returns:
            Message: The saved message
        """
        message_data = MessageCreate(content=content, role=role, sources=sources or [], tool_used=tool_used)
        db_message = Message(**message_data.model_dump(), conversation_id=conversation_id, user_id=self.user.id)
        self.db.add(db_message)
        self.db.commit()
        self.db.refresh(db_message)
        return db_message

    def process_chat_message(self, chat_request: ChatRequest) -> ChatResponse:
        """
        Process a chat message and generate a response

        Args:
            chat_request: The chat request containing the user message

        Returns:
            ChatResponse: The chat response with the agent's reply
        """
        # Get or create conversation
        conversation = self.get_or_create_conversation(chat_request.conversation_id)

        # Save user message
        user_message = self.save_message(conversation.id, chat_request.message, MessageRole.USER)

        # Get conversation history
        history = self.get_conversation_history(conversation.id)

        # Format history for the agent
        formatted_history = [
            {"role": "user" if msg.role == MessageRole.USER else "assistant", "content": msg.content} for msg in history
        ]

        # Get response from the agent
        agent_result = get_chat_response(formatted_history)

        # Extract response content and sources
        agent_response_content = agent_result.get("content", "")
        agent_sources = agent_result.get("sources", [])
        tool_used = agent_result.get("tool_used")

        # Save agent message with sources
        agent_message = self.save_message(
            conversation.id, agent_response_content, MessageRole.ASSISTANT, sources=agent_sources, tool_used=tool_used
        )

        # Update conversation title if it's the first message
        if len(history) == 1:  # Only the user message we just added
            conversation.title = (
                chat_request.message[:50] + "..." if len(chat_request.message) > 50 else chat_request.message
            )
            self.db.commit()
            self.db.refresh(conversation)

        # Update conversation updated_at timestamp
        self.db.commit()
        self.db.refresh(conversation)

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
                    # Log error but continue with other sources
                    print(f"Error processing Reddit source: {e}")

        return ChatResponse(
            response=agent_response_content,
            conversation_id=conversation.id,
            sources=reddit_sources,
            tool_used=tool_used,
        )

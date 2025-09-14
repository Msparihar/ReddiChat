from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import create_react_agent
from app.core.config import settings
from app.tools.reddit_tool import search_reddit
from app.agents.system_prompt import SYSTEM_PROMPT
from app.core.logger import get_logger
from app.schemas.chat import RedditSource
import json

logger = get_logger(__name__)

# Initialize the Gemini LLM
if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
    raise ValueError(
        "GEMINI_API_KEY environment variable is required. "
        "Please set your Google Gemini API key in the .env file or environment variables."
    )

try:
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=settings.GEMINI_API_KEY,
        temperature=0.7,
        model_kwargs={"streaming": True},
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )
except Exception as e:
    raise RuntimeError(f"Failed to initialize Gemini LLM: {str(e)}")


tools = [search_reddit]

# Create agent with tools
app = create_react_agent(llm, tools)


def get_chat_response(messages: list) -> dict:
    """
    Get a response from the chat agent with multimodal support

    Args:
        messages: List of messages in the conversation (can include multimodal content)

    Returns:
        dict: The agent's response with content and any sources
    """
    logger.info(f"🎯 Processing chat with {len(messages)} messages")

    try:
        # Convert messages to the format expected by LangGraph
        langgraph_messages = [SystemMessage(content=SYSTEM_PROMPT)]
        for i, msg in enumerate(messages):
            if msg["role"] == "user":
                # Handle multimodal content
                if isinstance(msg["content"], list):
                    logger.debug(f"📸 Message {i}: multimodal content")
                    langgraph_messages.append(HumanMessage(content=msg["content"]))
                else:
                    logger.debug(f"💬 Message {i}: text-only")
                    langgraph_messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                langgraph_messages.append(AIMessage(content=msg["content"]))

        # Invoke the agent
        logger.debug("🔄 Invoking agent graph...")
        result = app.invoke({"messages": langgraph_messages})

        # Extract messages from the result
        result_messages = result["messages"]
        logger.debug(f"📥 Received {len(result_messages)} result messages")

        # Find the final AI response and any tool messages
        final_response = None
        tool_results = []
        tool_used = None

        for message in result_messages:
            if isinstance(message, AIMessage) and message.content:
                # Ensure content is always a string
                content = message.content
                if isinstance(content, list):
                    # If content is a list (multimodal), extract text parts
                    text_parts = []
                    for part in content:
                        if isinstance(part, dict) and part.get("type") == "text":
                            text_parts.append(part.get("text", ""))
                        elif isinstance(part, str):
                            text_parts.append(part)
                    final_response = "\n".join(text_parts)
                else:
                    final_response = str(content)
                logger.debug("✅ Found AI response")
            elif isinstance(message, ToolMessage):
                try:
                    tool_data = json.loads(message.content)
                    if message.name == "search_reddit":
                        tool_used = "search_reddit"
                        tool_results.extend(tool_data.get("posts", []))
                        logger.info(f"🔍 Reddit tool found {len(tool_data.get('posts', []))} posts")
                except (json.JSONDecodeError, AttributeError):
                    logger.warning("⚠️ Failed to parse tool message content")

        # If no final response found, get the last message
        if final_response is None:
            last_message = result_messages[-1]
            content = last_message.content if hasattr(last_message, "content") else str(last_message)

            # Ensure content is always a string
            if isinstance(content, list):
                # If content is a list (multimodal), extract text parts
                text_parts = []
                for part in content:
                    if isinstance(part, dict) and part.get("type") == "text":
                        text_parts.append(part.get("text", ""))
                    elif isinstance(part, str):
                        text_parts.append(part)
                final_response = "\n".join(text_parts)
            else:
                final_response = str(content)
            logger.warning("⚠️ Using fallback response from last message")

        logger.info(f"✅ Chat response generated: tool={tool_used}, sources={len(tool_results)}")
        return {"content": final_response, "sources": tool_results, "tool_used": tool_used}

    except Exception as e:
        logger.error(f"❌ Chat agent error: {str(e)}")

        # Return a generic error message
        error_response = """## 🔧 Service Temporarily Unavailable

I'm currently experiencing technical difficulties and unable to process your request. Please try again in a few moments.

If the issue persists, the service may be undergoing maintenance or configuration updates."""

        return {"content": error_response, "sources": [], "tool_used": None}


def get_chat_response_multimodal(message: dict, chat_history: list = None) -> dict:
    """
    Enhanced chat response function with explicit multimodal support

    Args:
        message: Current message (can be multimodal)
        chat_history: Previous messages with optional multimodal content

    Returns:
        dict: The agent's response with content and any sources
    """
    logger.info("🔀 Multimodal chat request")

    try:
        # Build complete message history
        all_messages = []

        # Add chat history if provided
        if chat_history:
            all_messages.extend(chat_history)
            logger.debug(f"📚 Added {len(chat_history)} history messages")

        # Add current message
        all_messages.append(message)
        logger.debug(f"💬 Added current message, total: {len(all_messages)}")

        # Use existing function with enhanced message list
        return get_chat_response(all_messages)

    except Exception as e:
        logger.error(f"❌ Multimodal chat agent error: {str(e)}")
        return {"content": "Error processing multimodal content. Please try again.", "sources": [], "tool_used": None}


from typing import AsyncGenerator
import asyncio


async def get_chat_response_stream(all_messages: list) -> AsyncGenerator[dict, None]:
    """
    Get a streaming response from the chat agent with events for SSE

    Args:
        all_messages: List of messages in the conversation

    Yields:
        dict: Streaming events like {"type": "content", "delta": str}, {"type": "tool_start", ...}, {"type": "done", ...}
    """
    logger.info(f"🎯 Streaming chat with {len(all_messages)} messages")

    # Test tool calling first
    test_tool_calling()

    try:
        # Convert messages to LangGraph format (same as sync)
        langgraph_messages = [SystemMessage(content=SYSTEM_PROMPT)]
        for i, msg in enumerate(all_messages):
            if msg["role"] == "user":
                if isinstance(msg["content"], list):
                    logger.debug(f"📸 Message {i}: multimodal content")
                    langgraph_messages.append(HumanMessage(content=msg["content"]))
                else:
                    logger.debug(f"💬 Message {i}: text-only")
                    langgraph_messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                langgraph_messages.append(AIMessage(content=msg["content"]))

        # Log prompt structure for debugging
        logger.info(f"📨 Prompt to agent: {len(langgraph_messages)} messages")
        logger.info(f"🛠️ Available tools: {[tool.name for tool in tools]}")
        logger.info(f"🤖 LLM model: {getattr(llm, 'model_name', 'unknown')}")
        logger.info(f"🔧 Agent type: {type(app)}")

        for j, m in enumerate(langgraph_messages):
            if isinstance(m, SystemMessage):
                logger.info(f"  {j}: System (prompt length: {len(m.content)} chars)")
            elif isinstance(m, HumanMessage):
                content_summary = str(m.content)[:50] + "..." if len(str(m.content)) > 50 else str(m.content)
                logger.info(f"  {j}: User: {content_summary}")
            elif isinstance(m, AIMessage):
                content_summary = str(m.content)[:50] + "..." if len(str(m.content)) > 50 else str(m.content)
                logger.info(f"  {j}: Assistant: {content_summary}")

        content_parts = []
        tool_results = []
        tool_used = None
        current_llm_content = ""
        response_contents = []

        # Log the input to the agent
        logger.info(f"🚀 Starting agent stream with input: {langgraph_messages}")

        async for event in app.astream_events(
            {"messages": langgraph_messages},
            version="v2",
        ):
            event_kind = event["event"]
            event_name = event.get("name", "unknown")

            # Log all events for debugging
            logger.info(f"🔍 Event: {event_kind} from {event_name}")
            if event.get("data"):
                logger.info(f"   Data keys: {list(event['data'].keys())}")

            # Only process events from the main agent, LLM, or tools
            if event_name not in ["agent", "llm", "unknown", "search_reddit"] and not event_kind.startswith(
                "on_chat_model"
            ):
                logger.info(f"⏭️ Skipping event from {event_name}")
                continue

            if event_kind == "on_chat_model_start":
                current_llm_content = ""
                logger.info("🤖 LLM streaming started")
            elif event_kind == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                delta = chunk.content
                if delta:
                    content_parts.append(delta)
                    current_llm_content += delta
                    logger.info(f"📝 Stream chunk: '{delta}' (current: {len(current_llm_content)} chars)")
                    yield {"type": "content", "delta": delta}
            elif event_kind == "on_chat_model_end":
                response_contents.append(current_llm_content)
                logger.info(f"🏁 LLM stream ended: {len(current_llm_content)} chars")
            elif event_kind == "on_tool_start":
                tool_used = event["name"]
                logger.info(f"🛠️ Tool started: {tool_used}")
                logger.info(f"🔍 Tool name check: '{tool_used}' == 'search_reddit'? {tool_used == 'search_reddit'}")
                yield {"type": "tool_start", "tool": tool_used}
            elif event_kind == "on_tool_end":
                output = event["data"]["output"]
                logger.info(f"🛠️ Tool {tool_used} ended with output: {str(output)[:200]}...")

                if tool_used == "search_reddit":
                    # Handle ToolMessage object - extract content and parse as JSON
                    if hasattr(output, "content"):
                        try:
                            import json

                            output_data = json.loads(output.content)
                            posts = output_data.get("posts", [])
                            logger.info(f"📊 Found {len(posts)} Reddit posts")
                            tool_results.extend(posts)
                            logger.info(f"📈 Total tool results now: {len(tool_results)}")
                        except (json.JSONDecodeError, AttributeError) as e:
                            logger.error(f"❌ Error parsing tool output: {e}")
                            logger.error(f"   Output content: {output.content}")
                    else:
                        logger.error(f"❌ Tool output has no content attribute: {type(output)}")
                else:
                    logger.info(f"⚠️ Tool {tool_used} is not search_reddit, skipping source extraction")

                logger.info(f"✅ Tool ended: {len(tool_results)} results")
                yield {"type": "tool_end", "output": str(output)}

        # Final content is the last LLM response
        final_content = response_contents[-1] if response_contents else "".join(content_parts)
        logger.info(f"📄 Final content: '{final_content[:100]}...' (total: {len(final_content)} chars)")

        # Extract sources similar to sync
        reddit_sources = []
        logger.info(f"🔍 Processing {len(tool_results)} tool results for sources")

        for i, post in enumerate(tool_results):
            try:
                logger.info(f"📝 Processing post {i}: {post.get('title', 'No title')[:50]}...")
                reddit_source = RedditSource(
                    title=post.get("title", ""),
                    text=post.get("text", ""),  # Changed from "selftext" to "text"
                    url=post.get("url", ""),
                    subreddit=post.get("subreddit", ""),
                    author=post.get("author", ""),
                    score=post.get("score", 0),
                    num_comments=post.get("num_comments", 0),
                    created_utc=post.get("created_utc", ""),
                    permalink=post.get("permalink", ""),
                )
                reddit_sources.append(reddit_source)
                logger.info(f"✅ Created RedditSource: {reddit_source.title[:30]}...")
            except Exception as e:
                logger.error(f"❌ Error processing Reddit source in stream: {e}")
                logger.error(f"   Post data: {post}")

        logger.info(f"🎯 Final sources count: {len(reddit_sources)}")
        logger.info(f"🛠️ Tool used: {tool_used}")

        # Convert RedditSource objects to dictionaries for JSON serialization
        sources_dict = [source.model_dump() for source in reddit_sources]
        logger.info(f"📦 Converted {len(sources_dict)} sources to dictionaries for JSON serialization")

        yield {
            "type": "done",
            "content": final_content,
            "sources": sources_dict,
            "tool_used": tool_used,
        }

        logger.info(f"✅ Streaming chat completed: tool={tool_used}, sources={len(tool_results)}")

    except Exception as e:
        logger.error(f"❌ Streaming chat agent error: {str(e)}")
        yield {
            "type": "error",
            "content": "Error processing chat. Please try again.",
            "sources": [],
            "tool_used": None,
        }


def test_tool_calling():
    """Test function to verify tool calling works"""
    logger.info("🧪 Testing tool calling...")

    # Test direct tool call
    try:
        result = search_reddit.invoke({"query": "machine learning", "subreddits": ["MachineLearning"], "limit": 2})
        logger.info(f"✅ Direct tool call successful: {len(result.get('posts', []))} posts")
        return True
    except Exception as e:
        logger.error(f"❌ Direct tool call failed: {e}")
        return False

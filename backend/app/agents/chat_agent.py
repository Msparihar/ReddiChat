from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from app.core.config import settings
from app.tools.reddit_tool import search_reddit
from app.agents.system_prompt import SYSTEM_PROMPT
from app.core.logger import get_logger
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
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )
except Exception as e:
    raise RuntimeError(f"Failed to initialize Gemini LLM: {str(e)}")


tools = [search_reddit]

# Create tool node for LangGraph
tool_node = ToolNode(tools)

# Create the agent with tools
agent_with_tools = llm.bind_tools(tools)


def call_model(state: MessagesState):
    """Call the model with the current state"""
    messages = state["messages"]

    # Add system message if not already present
    if not messages or not isinstance(messages[0], SystemMessage):
        system_msg = SystemMessage(content=SYSTEM_PROMPT)
        messages = [system_msg] + messages
        logger.debug(f"📋 Added system message. Total messages: {len(messages)}")

    logger.debug("🤖 Invoking Gemini model...")
    response = agent_with_tools.invoke(messages)
    return {"messages": response}


# Define the graph
graph = StateGraph(MessagesState)

# Add nodes
graph.add_node("call_model", call_model)
graph.add_node("tools", tool_node)

# Add edges
graph.add_edge(START, "call_model")
graph.add_conditional_edges("call_model", tools_condition, {"tools": "tools", "__end__": END})
graph.add_edge("tools", "call_model")

# Compile the graph
app = graph.compile()


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
        langgraph_messages = []
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
                final_response = message.content
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
            final_response = last_message.content if hasattr(last_message, "content") else str(last_message)
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

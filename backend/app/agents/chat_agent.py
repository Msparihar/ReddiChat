from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from app.core.config import settings
from app.tools.reddit_tool import search_reddit
from app.agents.system_prompt import SYSTEM_PROMPT
import json

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
        print(f"Added system message. Total messages: {len(messages)}")
        print(f"System message preview: {SYSTEM_PROMPT[:100]}...")

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
    Get a response from the chat agent

    Args:
        messages: List of messages in the conversation

    Returns:
        dict: The agent's response with content and any sources
    """
    try:
        # Convert messages to the format expected by LangGraph
        langgraph_messages = []
        for msg in messages:
            if msg["role"] == "user":
                langgraph_messages.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "assistant":
                langgraph_messages.append(AIMessage(content=msg["content"]))

        # Invoke the agent
        result = app.invoke({"messages": langgraph_messages})

        # Extract messages from the result
        result_messages = result["messages"]

        # Find the final AI response and any tool messages
        final_response = None
        tool_results = []
        tool_used = None

        for message in result_messages:
            if isinstance(message, AIMessage) and message.content:
                final_response = message.content
            elif isinstance(message, ToolMessage):
                try:
                    tool_data = json.loads(message.content)
                    if message.name == "search_reddit":
                        tool_used = "search_reddit"
                        tool_results.extend(tool_data.get("posts", []))
                except (json.JSONDecodeError, AttributeError):
                    # Handle cases where tool content isn't valid JSON
                    pass

        # If no final response found, get the last message
        if final_response is None:
            last_message = result_messages[-1]
            final_response = last_message.content if hasattr(last_message, "content") else str(last_message)

        return {"content": final_response, "sources": tool_results, "tool_used": tool_used}

    except Exception as e:
        # Log the error for developers but don't expose it to users
        print(f"Chat agent error: {str(e)}")

        # Return a generic error message
        error_response = """## 🔧 Service Temporarily Unavailable

I'm currently experiencing technical difficulties and unable to process your request. Please try again in a few moments.

If the issue persists, the service may be undergoing maintenance or configuration updates."""

        return {"content": error_response, "sources": [], "tool_used": None}

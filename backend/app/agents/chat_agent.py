from typing import Annotated
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, MessagesState, START, END
from langgraph.types import Command
from app.core.config import settings
import os

# Initialize the Gemini LLM
# Note: Make sure to set the GEMINI_API_KEY environment variable
# For testing purposes, we'll use a mock response if no API key is provided
try:
    if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here":
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7,
            max_tokens=None,
            timeout=None,
            max_retries=2,
        )
    else:
        # Mock LLM for testing
        class MockLLM:
            def bind_tools(self, tools):
                return self

            def invoke(self, messages):
                # Return a mock response
                return AIMessage(content="This is a mock response from the AI assistant.")

        llm = MockLLM()
except Exception as e:
    # Fallback to mock LLM if there's an error
    class MockLLM:
        def bind_tools(self, tools):
            return self

        def invoke(self, messages):
            # Return a mock response
            return AIMessage(content="This is a mock response from the AI assistant.")

    llm = MockLLM()


# Define a simple tool for demonstration
@tool
def get_current_weather(location: str) -> str:
    """Get the current weather for a location"""
    # In a real implementation, this would call a weather API
    return f"The current weather in {location} is sunny with a temperature of 25°C."


# Create the agent with tools
agent_with_tools = llm.bind_tools([get_current_weather]) if hasattr(llm, "bind_tools") else llm


def call_model(state: MessagesState):
    """Call the model with the current state"""
    response = agent_with_tools.invoke(state["messages"])
    return {"messages": response}


# Define the graph
graph = StateGraph(MessagesState)

# Add nodes
graph.add_node("call_model", call_model)

# Add edges
graph.add_edge(START, "call_model")
graph.add_edge("call_model", END)

# Compile the graph
app = graph.compile()


def get_chat_response(messages: list) -> str:
    """
    Get a response from the chat agent

    Args:
        messages: List of messages in the conversation

    Returns:
        str: The agent's response
    """
    # Convert messages to the format expected by LangGraph
    langgraph_messages = []
    for msg in messages:
        if msg["role"] == "user":
            langgraph_messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            langgraph_messages.append(AIMessage(content=msg["content"]))

    # Invoke the agent
    result = app.invoke({"messages": langgraph_messages})

    # Extract the last message from the result
    last_message = result["messages"][-1]

    # Return the content of the last message
    return last_message.content if hasattr(last_message, "content") else str(last_message)

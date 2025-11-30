from langchain_core.tools import tool
from typing import Optional, List, Dict, Any
import requests
import json
import time
from datetime import datetime
from app.core.config import settings
import os


@tool
def web_search(
    query: str,
    num_results: int = 5,
    time_range: str = "month"
) -> Dict[str, Any]:
    """Search the web for current information and news related to the query.

    This tool searches the web for relevant, current information and news articles.
    It's particularly useful for finding recent news, current events, and up-to-date information.

    Args:
        query: Search term or question to find relevant web results
        num_results: Maximum number of results to return (default: 5, max: 10)
        time_range: Time period to search within ("day", "week", "month", "year")

    Returns:
        Dictionary containing search results with articles and metadata
    """
    try:
        # Limit the maximum results to prevent overwhelming responses
        num_results = min(num_results, 10)

        # Use SerpAPI for web search (requires API key)
        # You can replace this with any web search API
        serpapi_key = os.getenv("SERPAPI_API_KEY")

        if not serpapi_key:
            return {
                "query": query,
                "error": "Web search API key not configured. Please set SERPAPI_API_KEY environment variable.",
                "results_count": 0,
                "results": [],
            }

        # Map time_range to SerpAPI parameters
        time_map = {
            "day": "d",
            "week": "w",
            "month": "m",
            "year": "y"
        }

        params = {
            "q": query,
            "num": num_results,
            "api_key": serpapi_key,
            "tbs": f"qdr:{time_map.get(time_range, 'm')}"  # Default to month
        }

        # Make request to SerpAPI
        response = requests.get(
            "https://serpapi.com/search.json",
            params=params,
            timeout=10
        )

        if response.status_code != 200:
            return {
                "query": query,
                "error": f"Web search API returned status code {response.status_code}",
                "results_count": 0,
                "results": [],
            }

        data = response.json()

        # Extract organic search results
        search_results = []
        organic_results = data.get("organic_results", [])

        for result in organic_results[:num_results]:
            # Truncate long snippets
            snippet = result.get("snippet", "")
            if snippet and len(snippet) > 300:
                snippet = snippet[:300] + "..."

            search_results.append({
                "title": result.get("title", ""),
                "snippet": snippet,
                "url": result.get("link", ""),
                "source": result.get("displayed_link", ""),
                "date": result.get("date", ""),
                "cached": result.get("cached_page_link", "")
            })

        return {
            "query": query,
            "results_count": len(search_results),
            "results": search_results,
            "search_params": {
                "num_results": num_results,
                "time_range": time_range
            },
        }

    except requests.exceptions.Timeout:
        return {
            "query": query,
            "error": "Web search request timed out. Please try again.",
            "results_count": 0,
            "results": [],
        }
    except requests.exceptions.RequestException as e:
        return {
            "query": query,
            "error": f"Web search request failed: {str(e)}",
            "results_count": 0,
            "results": [],
        }
    except Exception as e:
        return {
            "query": query,
            "error": f"Unexpected error during web search: {str(e)}",
            "results_count": 0,
            "results": [],
        }

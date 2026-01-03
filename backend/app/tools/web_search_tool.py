from langchain_core.tools import tool
from typing import Optional, List, Dict, Any, Union
from langchain_community.tools import DuckDuckGoSearchResults
from langchain_community.utilities import DuckDuckGoSearchAPIWrapper
import asyncio
import uuid
from app.core.logger import get_logger

logger = get_logger(__name__)

# Global variable to store search events for streaming
search_events = {}


@tool
async def web_search(
    query: Union[str, List[str]], num_results: int = 5, time_range: str = "month", max_concurrent: int = 3
) -> Dict[str, Any]:
    """Search the web using DuckDuckGo for current information and news related to the query.

    This tool searches the web for relevant, current information and news articles.
    It supports both single and multiple queries with parallel execution.

    Args:
        query: Search term or list of search terms
        num_results: Maximum number of results to return per query (default: 5, max: 10)
        time_range: Time period to search within ("day", "week", "month", "year")
        max_concurrent: Maximum number of concurrent searches for multiple queries (default: 3)

    Returns:
        Dictionary containing search results with articles and metadata
    """
    try:
        # Normalize queries to list
        queries = query if isinstance(query, list) else [query]

        # Limit the maximum results to prevent overwhelming responses
        num_results = min(num_results, 10)

        # Map time_range to DuckDuckGo parameters
        time_map = {"day": "d", "week": "w", "month": "m", "year": "y"}

        # Create search wrapper with custom parameters
        wrapper = DuckDuckGoSearchAPIWrapper(
            region="wt-wt",  # Worldwide
            time=time_map.get(time_range, "m"),  # Default to month
            max_results=num_results,
        )

        # Create search instance
        search = DuckDuckGoSearchResults(api_wrapper=wrapper, output_format="list")

        # Execute searches
        if len(queries) == 1:
            # Single query execution
            results = await _execute_single_search(search, queries[0])
            return results
        else:
            # Multiple queries with parallel execution
            results = await _execute_multiple_searches(search, queries, max_concurrent)
            return results

    except Exception as e:
        logger.error(f"Web search error: {str(e)}")
        return {
            "queries": queries if "queries" in locals() else [query],
            "error": f"Web search failed: {str(e)}",
            "results_count": 0,
            "results": [],
        }


async def _execute_single_search(search_tool, query: str) -> Dict[str, Any]:
    """Execute a single search query"""
    try:
        # Generate unique ID for this search
        search_id = str(uuid.uuid4())

        # Emit search started event
        _emit_search_event("search_started", query, search_id)

        # Perform search
        _emit_search_event("search_progress", query, search_id, status="searching")
        results = search_tool.invoke(query)

        # Process results
        processed_results = _process_search_results(results)

        # Emit search completed event
        _emit_search_event("search_completed", query, search_id, results=processed_results)

        return {
            "query": query,
            "results_count": len(processed_results),
            "results": processed_results,
        }

    except Exception as e:
        logger.error(f"Single search error for '{query}': {str(e)}")
        # Emit search error event
        _emit_search_event(
            "search_error", query, str(uuid.uuid4()) if "search_id" not in locals() else search_id, error=str(e)
        )
        return {
            "query": query,
            "error": f"Search failed: {str(e)}",
            "results_count": 0,
            "results": [],
        }


async def _execute_multiple_searches(search_tool, queries: List[str], max_concurrent: int) -> Dict[str, Any]:
    """Execute multiple search queries in parallel"""
    try:
        # Create semaphore to limit concurrent searches
        semaphore = asyncio.Semaphore(max_concurrent)

        async def limited_search(query):
            async with semaphore:
                return await _execute_single_search(search_tool, query)

        # Execute all searches concurrently
        search_tasks = [limited_search(query) for query in queries]
        results = await asyncio.gather(*search_tasks, return_exceptions=True)

        # Process results
        all_results = []
        successful_results = 0

        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Search failed for query '{queries[i]}': {str(result)}")
                all_results.append(
                    {
                        "query": queries[i],
                        "error": f"Search failed: {str(result)}",
                        "results_count": 0,
                        "results": [],
                    }
                )
            else:
                all_results.append(result)
                successful_results += result.get("results_count", 0)

        return {
            "queries": queries,
            "results_count": successful_results,
            "results": all_results,
        }

    except Exception as e:
        logger.error(f"Multiple search error: {str(e)}")
        return {
            "queries": queries,
            "error": f"Multiple search failed: {str(e)}",
            "results_count": 0,
            "results": [],
        }


def _process_search_results(results: List[Dict]) -> List[Dict]:
    """Process and format search results"""
    processed_results = []

    for result in results:
        # Truncate long snippets
        snippet = result.get("snippet", "")
        if snippet and len(snippet) > 300:
            snippet = snippet[:300] + "..."

        processed_results.append(
            {
                "title": result.get("title", ""),
                "snippet": snippet,
                "url": result.get("link", ""),
                "source": result.get("source", ""),
                "date": result.get("date", ""),
            }
        )

    return processed_results


def _emit_search_event(event_type: str, query: str, query_id: str, **kwargs):
    """Emit search event for streaming"""
    event = {"type": event_type, "query": query, "query_id": query_id, **kwargs}

    # Store event for retrieval by streaming endpoint
    if query_id not in search_events:
        search_events[query_id] = []
    search_events[query_id].append(event)

    logger.debug(f"Search event emitted: {event_type} for query '{query}'")


def get_search_events(query_id: str = None) -> List[Dict]:
    """Retrieve search events for streaming"""
    if query_id:
        return search_events.get(query_id, [])
    else:
        # Flatten all events
        all_events = []
        for events in search_events.values():
            all_events.extend(events)
        return all_events


def clear_search_events(query_id: str = None):
    """Clear search events to free memory"""
    if query_id:
        search_events.pop(query_id, None)
    else:
        search_events.clear()

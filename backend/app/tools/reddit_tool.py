from langchain_core.tools import tool
from typing import Optional, List, Dict, Any
import praw
import prawcore
import time
from datetime import datetime
from app.core.config import settings


def get_reddit_instance():
    """Initialize and return Reddit API instance"""
    return praw.Reddit(
        client_id=settings.REDDIT_CLIENT_ID,
        client_secret=settings.REDDIT_CLIENT_SECRET,
        user_agent="ReddiChat:v1.0",
    )


@tool
def search_reddit(
    query: str, subreddits: Optional[List[str]] = None, limit: int = 5, time_filter: str = "month"
) -> Dict[str, Any]:
    """Search Reddit for posts related to the query with optional subreddit filtering.

    This tool searches Reddit for relevant posts and discussions based on your query.
    It's particularly useful for finding recent discussions, opinions, and information
    from Reddit communities.

    Args:
        query: Search term or question to find relevant Reddit posts
        subreddits: Optional list of subreddit names to search in (e.g., ["MachineLearning", "technology"])
        limit: Maximum number of results to return (default: 5, max: 10)
        time_filter: Time period to search within ("day", "week", "month", "year", "all")

    Returns:
        Dictionary containing search results with posts and metadata
    """
    try:
        # Limit the maximum results to prevent overwhelming responses
        limit = min(limit, 10)

        reddit = get_reddit_instance()

        # Determine subreddit(s) to search
        if subreddits:
            subreddit = reddit.subreddit("+".join(subreddits))
        else:
            subreddit = reddit.subreddit("all")

        # Perform search
        search_results = []
        for submission in subreddit.search(query, sort="relevance", time_filter=time_filter, limit=limit):
            # Convert UTC timestamp to readable format
            created_date = datetime.fromtimestamp(submission.created_utc).strftime("%Y-%m-%d %H:%M:%S")

            # Truncate long text content
            text_content = submission.selftext
            if text_content and len(text_content) > 300:
                text_content = text_content[:300] + "..."
            elif not text_content:
                text_content = "[No text content; this is a link post]"

            search_results.append(
                {
                    "title": submission.title,
                    "text": text_content,
                    "url": submission.url,
                    "subreddit": submission.subreddit.display_name,
                    "author": submission.author.name if submission.author else "[Deleted]",
                    "score": submission.score,
                    "num_comments": submission.num_comments,
                    "created_utc": created_date,
                    "permalink": f"https://www.reddit.com{submission.permalink}",
                }
            )

        return {
            "query": query,
            "results_count": len(search_results),
            "posts": search_results,
            "search_params": {"subreddits": subreddits or ["all"], "time_filter": time_filter, "limit": limit},
        }

    except prawcore.exceptions.TooManyRequests as e:
        return {
            "query": query,
            "error": "Reddit API rate limit exceeded. Please try again in a few minutes.",
            "results_count": 0,
            "posts": [],
        }
    except prawcore.exceptions.ResponseException as e:
        return {"query": query, "error": f"Reddit API error: {str(e)}", "results_count": 0, "posts": []}
    except Exception as e:
        return {
            "query": query,
            "error": f"Unexpected error during Reddit search: {str(e)}",
            "results_count": 0,
            "posts": [],
        }

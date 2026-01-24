from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any, Optional
from datetime import datetime
import praw
import prawcore
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/reddit", tags=["reddit"])


def get_reddit_instance():
    """Initialize and return Reddit API instance"""
    return praw.Reddit(
        client_id=settings.REDDIT_CLIENT_ID,
        client_secret=settings.REDDIT_CLIENT_SECRET,
        user_agent="ReddiChat:v1.0",
    )


@router.get("/user/{username}")
async def get_user_history(
    username: str,
    content_type: str = Query("all", pattern="^(posts|comments|all)$"),
    limit: int = Query(100, ge=1, le=100),
    sort: str = Query("new", pattern="^(new|hot|top|controversial)$"),
    after_post: Optional[str] = Query(None, description="Fullname of last post for pagination"),
    after_comment: Optional[str] = Query(None, description="Fullname of last comment for pagination"),
) -> Dict[str, Any]:
    """
    Fetch a Reddit user's public post and comment history.
    Falls back to author search if profile is curated/hidden.
    """
    try:
        reddit = get_reddit_instance()
        user = reddit.redditor(username)

        # Verify user exists by accessing an attribute
        try:
            _ = user.created_utc
        except prawcore.exceptions.NotFound:
            raise HTTPException(status_code=404, detail=f"User '{username}' not found")
        except AttributeError:
            raise HTTPException(status_code=404, detail=f"User '{username}' not found or suspended")

        result = {
            "username": username,
            "posts": [],
            "comments": [],
            "has_more_posts": False,
            "has_more_comments": False,
            "after_post": None,
            "after_comment": None,
            "used_search_fallback": False,
        }

        posts_found_via_profile = False

        # Fetch posts from profile
        if content_type in ("posts", "all"):
            posts = []
            last_fullname = None

            # Build params for pagination
            params = {}
            if after_post:
                params["after"] = after_post

            # Get the appropriate listing based on sort
            if sort == "new":
                submission_listing = user.submissions.new(limit=limit + 1, params=params)
            elif sort == "hot":
                submission_listing = user.submissions.hot(limit=limit + 1, params=params)
            elif sort == "top":
                submission_listing = user.submissions.top(limit=limit + 1, params=params)
            else:  # controversial
                submission_listing = user.submissions.controversial(limit=limit + 1, params=params)

            for i, submission in enumerate(submission_listing):
                if i >= limit:
                    result["has_more_posts"] = True
                    break

                created_date = datetime.fromtimestamp(submission.created_utc).isoformat()
                last_fullname = submission.fullname

                posts.append({
                    "id": submission.id,
                    "fullname": submission.fullname,
                    "title": submission.title,
                    "text": submission.selftext if submission.selftext else None,
                    "url": submission.url if not submission.is_self else None,
                    "subreddit": submission.subreddit.display_name,
                    "score": submission.score,
                    "upvote_ratio": submission.upvote_ratio,
                    "num_comments": submission.num_comments,
                    "created_utc": created_date,
                    "permalink": f"https://www.reddit.com{submission.permalink}",
                    "is_self": submission.is_self,
                    "over_18": submission.over_18,
                    "spoiler": submission.spoiler,
                    "stickied": submission.stickied,
                    "thumbnail": submission.thumbnail if submission.thumbnail not in ("self", "default", "nsfw", "spoiler") else None,
                })

            result["posts"] = posts
            if last_fullname:
                result["after_post"] = last_fullname

            posts_found_via_profile = len(posts) > 0

        # Fetch comments from profile
        if content_type in ("comments", "all"):
            comments = []
            last_fullname = None

            # Build params for pagination
            params = {}
            if after_comment:
                params["after"] = after_comment

            # Get the appropriate listing based on sort
            if sort == "new":
                comment_listing = user.comments.new(limit=limit + 1, params=params)
            elif sort == "hot":
                comment_listing = user.comments.hot(limit=limit + 1, params=params)
            elif sort == "top":
                comment_listing = user.comments.top(limit=limit + 1, params=params)
            else:  # controversial
                comment_listing = user.comments.controversial(limit=limit + 1, params=params)

            for i, comment in enumerate(comment_listing):
                if i >= limit:
                    result["has_more_comments"] = True
                    break

                created_date = datetime.fromtimestamp(comment.created_utc).isoformat()
                last_fullname = comment.fullname

                # Get parent post title safely
                post_title = None
                try:
                    post_title = comment.submission.title
                except Exception:
                    pass

                comments.append({
                    "id": comment.id,
                    "fullname": comment.fullname,
                    "body": comment.body,
                    "subreddit": comment.subreddit.display_name,
                    "score": comment.score,
                    "created_utc": created_date,
                    "permalink": f"https://www.reddit.com{comment.permalink}",
                    "post_title": post_title,
                    "is_submitter": comment.is_submitter,
                    "stickied": comment.stickied,
                    "edited": bool(comment.edited),
                })

            result["comments"] = comments
            if last_fullname:
                result["after_comment"] = last_fullname

        # If no posts found via profile and no pagination cursor, try author search fallback
        if not posts_found_via_profile and not after_post and content_type in ("posts", "all"):
            logger.info(f"Profile empty for u/{username}, trying author search fallback")

            try:
                # Search for posts by this author
                search_results = reddit.subreddit("all").search(
                    f"author:{username}",
                    limit=limit + 1,
                    sort="new"
                )

                posts = []
                for i, submission in enumerate(search_results):
                    if i >= limit:
                        result["has_more_posts"] = True
                        break

                    created_date = datetime.fromtimestamp(submission.created_utc).isoformat()

                    posts.append({
                        "id": submission.id,
                        "fullname": submission.fullname,
                        "title": submission.title,
                        "text": submission.selftext if submission.selftext else None,
                        "url": submission.url if not submission.is_self else None,
                        "subreddit": submission.subreddit.display_name,
                        "score": submission.score,
                        "upvote_ratio": submission.upvote_ratio,
                        "num_comments": submission.num_comments,
                        "created_utc": created_date,
                        "permalink": f"https://www.reddit.com{submission.permalink}",
                        "is_self": submission.is_self,
                        "over_18": submission.over_18,
                        "spoiler": submission.spoiler,
                        "stickied": submission.stickied,
                        "thumbnail": submission.thumbnail if submission.thumbnail not in ("self", "default", "nsfw", "spoiler") else None,
                    })

                if posts:
                    result["posts"] = posts
                    result["used_search_fallback"] = True
                    result["after_post"] = None  # Search doesn't support cursor pagination
                    logger.info(f"Found {len(posts)} posts via author search for u/{username}")

            except Exception as e:
                logger.warning(f"Author search fallback failed for u/{username}: {str(e)}")

        logger.info(f"Fetched history for u/{username}: {len(result['posts'])} posts, {len(result['comments'])} comments (fallback: {result['used_search_fallback']})")
        return result

    except HTTPException:
        raise
    except prawcore.exceptions.TooManyRequests:
        logger.warning(f"Rate limit hit while fetching u/{username}")
        raise HTTPException(status_code=429, detail="Reddit API rate limit exceeded. Please try again in a few minutes.")
    except prawcore.exceptions.Forbidden:
        raise HTTPException(status_code=403, detail=f"User '{username}' has a private profile or is suspended")
    except prawcore.exceptions.NotFound:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")
    except Exception as e:
        logger.error(f"Error fetching history for u/{username}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch user history: {str(e)}")

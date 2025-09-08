from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.services.auth_service import AuthService
from app.schemas.auth import User as UserSchema, UserCreate
from app.models.user import OAuthProvider, User
from datetime import timedelta
import secrets
import httpx
from urllib.parse import urlparse
from loguru import logger

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={404: {"description": "Not found"}},
)

# In a production environment, this should be stored in a database
oauth_states = {}  # Format: {state: {"provider": str, "frontend_origin": str}}


async def exchange_code_for_token(provider: str, code: str) -> dict:
    """
    Exchange authorization code for access token
    """
    config = OAUTH_CONFIG[provider]

    # Prepare the token request data
    data = {
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "redirect_uri": config["redirect_uri"],
        "code": code,
        "grant_type": "authorization_code",
    }

    # Make the token request
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(config["token_url"], data=data)
            response.raise_for_status()
            token_data = response.json()
            return token_data
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error exchanging code for token: {str(e)}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error during token exchange: {str(e)}",
            )


async def get_user_info(provider: str, access_token: str) -> dict:
    """
    Fetch user information from the OAuth provider
    """
    config = OAUTH_CONFIG[provider]

    # Prepare the headers for the user info request
    headers = {"Authorization": f"Bearer {access_token}"}

    # Make the user info request
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(config["user_info_url"], headers=headers)
            response.raise_for_status()
            user_info = response.json()
            return user_info
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Error fetching user info: {str(e)}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Unexpected error fetching user info: {str(e)}",
            )


# OAuth provider configurations
OAUTH_CONFIG = {
    "google": {
        "auth_url": "https://accounts.google.com/o/oauth2/auth",
        "token_url": "https://oauth2.googleapis.com/token",
        "user_info_url": "https://www.googleapis.com/oauth2/v2/userinfo",
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "scope": "openid email profile",
    },
    "github": {
        "auth_url": "https://github.com/login/oauth/authorize",
        "token_url": "https://github.com/login/oauth/access_token",
        "user_info_url": "https://api.github.com/user",
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "redirect_uri": settings.GITHUB_REDIRECT_URI,
        "scope": "user:email",
    },
}


@router.get("/login/{provider}")
async def login(provider: OAuthProvider, request: Request):
    """
    Initiate OAuth login flow for the specified provider
    """
    logger.info(f"=== OAuth login initiated for provider: {provider.value} ===")
    logger.info(f"Request URL: {request.url}")
    logger.info(f"Referer header: {request.headers.get('referer')}")
    logger.info(f"Origin header: {request.headers.get('origin')}")
    logger.info(f"Host header: {request.headers.get('host')}")
    logger.info(f"All headers: {dict(request.headers)}")

    if provider.value not in OAUTH_CONFIG:
        logger.error(f"Unsupported OAuth provider: {provider.value}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported OAuth provider")

    config = OAUTH_CONFIG[provider.value]

    # Extract frontend origin from request headers
    frontend_origin = (
        request.headers.get("referer")
        or request.headers.get("origin")
        or settings.FRONTEND_URL
        or "http://localhost:5173"
    )

    # Clean up the origin (remove trailing slash and path if present)
    if frontend_origin:
        parsed = urlparse(frontend_origin)
        frontend_origin = f"{parsed.scheme}://{parsed.netloc}"

    logger.info(f"Detected frontend origin: {frontend_origin}")

    # Generate a random state parameter for security
    state = secrets.token_urlsafe(32)
    oauth_states[state] = {"provider": provider.value, "frontend_origin": frontend_origin}

    # Construct the authorization URL
    auth_url = (
        f"{config['auth_url']}?"
        f"client_id={config['client_id']}&"
        f"redirect_uri={config['redirect_uri']}&"
        f"scope={config['scope']}&"
        f"state={state}&"
        f"response_type=code"
    )

    # Redirect directly to the OAuth provider
    return RedirectResponse(url=auth_url)


@router.get("/callback/{provider}")
async def oauth_callback(
    provider: OAuthProvider, code: str, state: str, response: Response, db: Session = Depends(get_db)
):
    """
    Handle OAuth callback from the provider
    """
    logger.info(f"=== OAuth callback received for provider: {provider.value} ===")
    logger.info(f"Code: {code[:20]}...")
    logger.info(f"State: {state}")
    logger.info(f"Available states: {list(oauth_states.keys())}")

    # Verify the state parameter
    if state not in oauth_states:
        logger.error(f"State parameter not found: {state}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state parameter")

    state_data = oauth_states[state]
    if state_data["provider"] != provider.value:
        logger.error(f"Invalid state parameter. Expected provider: {state_data['provider']}, Got: {provider.value}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state parameter")

    # Get the frontend origin from state data
    frontend_origin = state_data["frontend_origin"]
    logger.info(f"Using frontend origin from state: {frontend_origin}")

    # Remove the state from the store
    del oauth_states[state]

    try:
        # Exchange the authorization code for an access token
        token_data = await exchange_code_for_token(provider.value, code)
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to obtain access token")

        # Fetch user information using the access token
        user_info = await get_user_info(provider.value, access_token)

        # Log all user information received from OAuth provider (especially for Google)
        logger.info(f"=== User info received from {provider.value} ===")
        logger.info(f"Full user info: {user_info}")

        # Extract relevant user information based on the provider
        if provider.value == "google":
            provider_id = user_info.get("id")
            email = user_info.get("email")
            name = user_info.get("name")
            picture = user_info.get("picture")
            # Log additional Google user info
            if picture:
                logger.info(f"Google user picture URL: {picture}")
            logger.info(f"Google user verified_email: {user_info.get('verified_email')}")
            logger.info(f"Google user given_name: {user_info.get('given_name')}")
            logger.info(f"Google user family_name: {user_info.get('family_name')}")
        elif provider.value == "github":
            provider_id = user_info.get("id")
            email = user_info.get("email")
            name = user_info.get("name")
            picture = None
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported OAuth provider")

        # Validate that we have the required user information
        if not provider_id or not email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing required user information")

        # Create or update the user in our database
        auth_service = AuthService(db)
        user = auth_service.get_user_by_provider_id(provider, str(provider_id))

        if not user:
            # Create new user
            user_data = UserCreate(
                email=email,
                name=name,
                avatar_url=picture,
                provider=provider,
                provider_id=str(provider_id),
            )
            user = auth_service.create_user(user_data)
        else:
            # Update existing user info
            user_data = UserCreate(
                email=email,
                name=name,
                avatar_url=picture,
                provider=provider,
                provider_id=str(provider_id),
            )
            user = auth_service.update_user(user, user_data)

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        session_token = auth_service.create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires)

        # Set secure cookie with session token
        # For localhost development, don't require secure (HTTPS)
        is_localhost = "localhost" in frontend_origin

        logger.info(f"OAuth callback successful for user: {user.email}")
        logger.info(f"Setting cookie - is_localhost: {is_localhost}, secure: {not is_localhost}")
        logger.info(f"Session token length: {len(session_token)}, starts with: {session_token[:20]}...")
        logger.info(f"Cookie settings - secure: {not is_localhost}, samesite: {'lax' if is_localhost else 'none'}")

        # Send token in URL for now (works universally)
        redirect_url = f"{frontend_origin}?access_token={session_token}"
        logger.info(f"Redirecting with token in URL to: {frontend_origin}?access_token=...")
        return RedirectResponse(url=redirect_url)
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle any other unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error during OAuth callback processing: {str(e)}",
        )


@router.get("/me", response_model=UserSchema)
async def read_users_me(request: Request, db: Session = Depends(get_db)):
    """
    Get current user information
    """
    logger.info("=== /me endpoint called ===")
    logger.info(f"Request headers: {dict(request.headers)}")
    logger.info(f"Request cookies: {dict(request.cookies)}")

    token = None

    # Try to get token from Authorization header first
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        logger.info(f"Found token in Authorization header: {token[:20]}...")

    # If no auth header, try to get token from cookie
    if not token:
        cookie_token = request.cookies.get("session")
        if cookie_token:
            token = cookie_token
            logger.info(f"Found token in session cookie: {token[:20]}...")
        else:
            logger.warning("No session cookie found!")

    if not token:
        logger.error("No authentication token found in headers or cookies")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing authentication token")

    auth_service = AuthService(db)

    # Verify and decode the JWT token
    payload = auth_service.verify_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    try:
        # Convert string UUID to UUID object
        import uuid

        user_id = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user ID format")

    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user


@router.post("/logout")
async def logout(request: Request, response: Response):
    """
    Logout the current user
    """
    # Clear the session cookie
    # For localhost development, don't require secure (HTTPS)
    is_localhost = "localhost" in (settings.FRONTEND_URL or "localhost")
    response.delete_cookie(
        key="session",
        path="/",
        secure=not is_localhost,
        httponly=True,
        samesite="lax" if is_localhost else "none",
        domain="localhost" if is_localhost else None,
    )

    # In a real implementation, you would also invalidate the token on the server side
    return {"message": "Successfully logged out"}


@router.get("/test-cookie")
async def test_cookie(response: Response):
    """
    Test endpoint to manually set a cookie and see if it works
    """
    logger.info("=== Test cookie endpoint called ===")

    # For localhost development, don't require secure (HTTPS)
    is_localhost = "localhost" in (settings.FRONTEND_URL or "localhost")

    response.set_cookie(
        key="test_session",
        value="test_token_12345",
        secure=not is_localhost,
        httponly=True,
        samesite="lax" if is_localhost else "none",
        max_age=60 * 60,  # 1 hour
        path="/",
        domain="localhost" if is_localhost else None,
    )

    logger.info(f"Test cookie set - domain: {'localhost' if is_localhost else 'None'}")
    return {"message": "Test cookie set", "domain": "localhost" if is_localhost else None}

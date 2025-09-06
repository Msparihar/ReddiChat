from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.services.auth_service import AuthService
from app.schemas.auth import OAuthLogin, Token, User as UserSchema, UserCreate
from app.models.user import OAuthProvider, User
from datetime import timedelta
import secrets
import os
import httpx

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
    responses={404: {"description": "Not found"}},
)

# In a production environment, this should be stored in a database
oauth_states = {}


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
    if provider.value not in OAUTH_CONFIG:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported OAuth provider")

    config = OAUTH_CONFIG[provider.value]

    # Generate a random state parameter for security
    state = secrets.token_urlsafe(32)
    oauth_states[state] = provider.value

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
async def oauth_callback(provider: OAuthProvider, code: str, state: str, db: Session = Depends(get_db)):
    """
    Handle OAuth callback from the provider
    """
    # Verify the state parameter
    if state not in oauth_states or oauth_states[state] != provider.value:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid state parameter")

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

        # Extract relevant user information based on the provider
        if provider.value == "google":
            provider_id = user_info.get("id")
            email = user_info.get("email")
            name = user_info.get("name")
        elif provider.value == "github":
            provider_id = user_info.get("id")
            email = user_info.get("email")
            name = user_info.get("name")
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
                provider=provider,
                provider_id=str(provider_id),
            )
            user = auth_service.create_user(user_data)
        else:
            # Update existing user info
            user_data = UserCreate(
                email=email,
                name=name,
                provider=provider,
                provider_id=str(provider_id),
            )
            user = auth_service.update_user(user, user_data)

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_service.create_access_token(data={"sub": str(user.id)}, expires_delta=access_token_expires)

        # Redirect user back to frontend with access token
        frontend_url = settings.FRONTEND_URL or "http://localhost:5173"
        redirect_url = f"{frontend_url}?access_token={access_token}"
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
    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid authorization header")

    token = auth_header.split(" ")[1]
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
async def logout(request: Request):
    """
    Logout the current user
    """
    # In a real implementation, you would invalidate the token
    # For now, we'll just return a success message
    return {"message": "Successfully logged out"}

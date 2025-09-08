from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.auth_service import AuthService
from app.models.user import User
import uuid
from app.core.logger import logger


class AuthMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        # Only handle HTTP requests
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Create a Request object from the scope
        request = Request(scope, receive)

        # Skip authentication for auth endpoints, health checks, and documentation endpoints
        if (
            request.url.path.startswith("/api/v1/auth")
            or request.url.path in ["/", "/health", "/docs", "/redoc"]
            or request.url.path.endswith("/openapi.json")
            or request.method == "OPTIONS"
        ):
            await self.app(scope, receive, send)
            return

        try:
            # Extract the token from the Authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                logger.warning(f"Authorization header missing for request: {request.url.path}")
                # Create a response for the error
                response = {
                    "type": "http.response.start",
                    "status": 401,
                    "headers": [(b"content-type", b"application/json")],
                }
                await send(response)
                await send(
                    {
                        "type": "http.response.body",
                        "body": b'{"detail": "Authorization header missing"}',
                    }
                )
                return

            try:
                # Extract token from "Bearer <token>" format
                token_type, token = auth_header.split()
                if token_type.lower() != "bearer":
                    logger.warning(f"Invalid token type: {token_type}")
                    # Create a response for the error
                    response = {
                        "type": "http.response.start",
                        "status": 401,
                        "headers": [(b"content-type", b"application/json")],
                    }
                    await send(response)
                    await send(
                        {
                            "type": "http.response.body",
                            "body": b'{"detail": "Invalid token type"}',
                        }
                    )
                    return
            except ValueError:
                logger.warning("Invalid authorization header format")
                # Create a response for the error
                response = {
                    "type": "http.response.start",
                    "status": 401,
                    "headers": [(b"content-type", b"application/json")],
                }
                await send(response)
                await send(
                    {
                        "type": "http.response.body",
                        "body": b'{"detail": "Invalid authorization header format"}',
                    }
                )
                return

            # Get database session
            from app.core.database import SessionLocal

            db = SessionLocal()
            auth_service = AuthService(db)

            # Verify the token
            payload = auth_service.verify_token(token)
            if not payload:
                logger.warning("Invalid or expired token")
                # Create a response for the error
                response = {
                    "type": "http.response.start",
                    "status": 401,
                    "headers": [(b"content-type", b"application/json")],
                }
                await send(response)
                await send(
                    {
                        "type": "http.response.body",
                        "body": b'{"detail": "Invalid or expired token"}',
                    }
                )
                return

            # Extract user ID from payload
            user_id_str = payload.get("sub")
            if not user_id_str:
                logger.warning("Invalid token payload: missing user ID")
                # Create a response for the error
                response = {
                    "type": "http.response.start",
                    "status": 401,
                    "headers": [(b"content-type", b"application/json")],
                }
                await send(response)
                await send(
                    {
                        "type": "http.response.body",
                        "body": b'{"detail": "Invalid token payload"}',
                    }
                )
                return

            try:
                user_id = uuid.UUID(user_id_str)
            except ValueError:
                logger.warning(f"Invalid user ID in token: {user_id_str}")
                # Create a response for the error
                response = {
                    "type": "http.response.start",
                    "status": 401,
                    "headers": [(b"content-type", b"application/json")],
                }
                await send(response)
                await send(
                    {
                        "type": "http.response.body",
                        "body": b'{"detail": "Invalid user ID in token"}',
                    }
                )
                return

            # Get user from database
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.warning(f"User not found for ID: {user_id}")
                # Create a response for the error
                response = {
                    "type": "http.response.start",
                    "status": 401,
                    "headers": [(b"content-type", b"application/json")],
                }
                await send(response)
                await send(
                    {
                        "type": "http.response.body",
                        "body": b'{"detail": "User not found"}',
                    }
                )
                return

            # Add user to request scope for use in endpoints
            scope["state"] = scope.get("state", {})
            scope["state"]["user"] = user

            # Continue with the request
            try:
                await self.app(scope, receive, send)
            finally:
                db.close()
        except Exception as e:
            # Log unexpected errors
            logger.error(f"Unexpected error in auth middleware: {str(e)}")
            # Create a response for the error
            response = {
                "type": "http.response.start",
                "status": 500,
                "headers": [(b"content-type", b"application/json")],
            }
            await send(response)
            await send(
                {
                    "type": "http.response.body",
                    "body": b'{"detail": "Internal server error during authentication"}',
                }
            )

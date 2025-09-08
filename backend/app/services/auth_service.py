from sqlalchemy.orm import Session
from app.models.user import User, OAuthProvider
from app.schemas.auth import UserCreate
from app.core.config import settings
from datetime import datetime, timedelta
from jose import JWTError, jwt
import uuid


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> User:
        """Get a user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_provider_id(self, provider: OAuthProvider, provider_id: str) -> User:
        """Get a user by OAuth provider and provider ID"""
        return self.db.query(User).filter(User.provider == provider, User.provider_id == provider_id).first()

    def create_user(self, user_data: UserCreate) -> User:
        """Create a new user"""
        db_user = User(**user_data.model_dump())
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user

    def update_user(self, user: User, user_data: UserCreate) -> User:
        """Update an existing user"""
        for key, value in user_data.model_dump().items():
            # Only update avatar_url if a value is provided
            if key == "avatar_url" and value is None:
                continue
            setattr(user, key, value)
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate_user(self, provider: OAuthProvider, provider_id: str) -> User:
        """Authenticate a user by OAuth provider and provider ID"""
        user = self.get_user_by_provider_id(provider, provider_id)
        return user

    def create_access_token(self, data: dict, expires_delta: timedelta = None) -> str:
        """Create a JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm="HS256")
        return encoded_jwt

    def verify_token(self, token: str) -> dict:
        """Verify a JWT token and return the payload"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            return payload
        except JWTError:
            return None

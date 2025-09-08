from pydantic import BaseModel
from typing import Optional
from app.models.user import OAuthProvider
import uuid


class UserBase(BaseModel):
    email: str
    name: str
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    provider: OAuthProvider
    provider_id: str

    class Config:
        from_attributes = True


class User(UserBase):
    id: uuid.UUID
    provider: OAuthProvider
    provider_id: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[uuid.UUID] = None


class OAuthLogin(BaseModel):
    provider: OAuthProvider


class OAuthCallback(BaseModel):
    code: str
    state: str

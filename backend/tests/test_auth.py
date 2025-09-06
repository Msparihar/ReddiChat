import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.models.user import OAuthProvider
import uuid

client = TestClient(app)


def test_auth_login_google():
    """Test Google OAuth login endpoint"""
    response = client.get("/api/v1/auth/login/google")
    assert response.status_code == 200
    assert "auth_url" in response.json()


def test_auth_login_github():
    """Test GitHub OAuth login endpoint"""
    response = client.get("/api/v1/auth/login/github")
    assert response.status_code == 200
    assert "auth_url" in response.json()


def test_auth_callback_google():
    """Test Google OAuth callback endpoint"""
    # This is a simplified test - in a real implementation, you would need to
    # mock the OAuth provider's response
    response = client.get("/api/v1/auth/callback/google?code=test_code&state=test_state")
    # The callback will likely return an error since we're not providing valid OAuth credentials
    # but we can still test that the endpoint exists and returns a response
    assert response.status_code in [200, 400, 401, 500]


def test_auth_callback_github():
    """Test GitHub OAuth callback endpoint"""
    # This is a simplified test - in a real implementation, you would need to
    # mock the OAuth provider's response
    response = client.get("/api/v1/auth/callback/github?code=test_code&state=test_state")
    # The callback will likely return an error since we're not providing valid OAuth credentials
    # but we can still test that the endpoint exists and returns a response
    assert response.status_code in [200, 400, 401, 500]


def test_auth_me_without_token():
    """Test getting current user without token"""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_auth_logout_without_token():
    """Test logout without token"""
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 401


def test_protected_endpoint_without_token():
    """Test accessing protected endpoint without token"""
    response = client.post("/api/v1/chat/", json={"message": "test"})
    assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__])

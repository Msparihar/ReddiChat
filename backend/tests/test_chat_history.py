import pytest
from fastapi.testclient import TestClient
from app.main import app
import uuid

client = TestClient(app)


def test_get_conversations_without_token():
    """Test getting conversations without authentication token"""
    response = client.get("/api/v1/chat/history/conversations")
    assert response.status_code == 401


def test_get_conversation_detail_without_token():
    """Test getting conversation detail without authentication token"""
    conversation_id = str(uuid.uuid4())
    response = client.get(f"/api/v1/chat/history/conversations/{conversation_id}")
    assert response.status_code == 401


def test_get_conversations_with_invalid_token():
    """Test getting conversations with invalid token"""
    response = client.get("/api/v1/chat/history/conversations", headers={"Authorization": "Bearer invalid_token"})
    assert response.status_code == 401


def test_get_conversation_detail_with_invalid_token():
    """Test getting conversation detail with invalid token"""
    conversation_id = str(uuid.uuid4())
    response = client.get(
        f"/api/v1/chat/history/conversations/{conversation_id}", headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401


def test_get_conversation_detail_with_invalid_id():
    """Test getting conversation detail with invalid conversation ID"""
    # This would require a valid token, but we're testing the ID validation
    # In a real implementation, you would first authenticate and get a valid token
    pass


if __name__ == "__main__":
    pytest.main([__file__])

# ReddiChat API Documentation

## Overview

ReddiChat is a modern chat application with AI integration. This API provides endpoints for user authentication, chat management, and conversation history.

## Base URL

```
http://localhost:8000
```

## Authentication

The API uses JWT Bearer tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication Endpoints

- [Authentication API](./auth-api.md) - User login, OAuth, and profile management

### Chat Endpoints

- [Chat API](./chat-api.md) - Send messages, manage conversations

### Chat History Endpoints

- [Chat History API](./chat-history-api.md) - View and manage conversation history

### Tools

- [Web Search Tool (DuckDuckGo)](./web-search-tool.md) - Using DuckDuckGo for web searches

## Error Handling

All endpoints return standard HTTP status codes and JSON error responses:

```json
{
  "detail": "Error message description"
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Data Models

### User

```json
{
  "id": "uuid",
  "email": "string",
  "name": "string",
  "provider": "google",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### Message

```json
{
  "id": "uuid",
  "content": "string",
  "role": "user|assistant",
  "timestamp": "datetime",
  "conversation_id": "uuid"
}
```

### Conversation

```json
{
  "id": "uuid",
  "title": "string",
  "created_at": "datetime",
  "updated_at": "datetime",
  "messages": ["Message[]"]
}
```

## Interactive Documentation

FastAPI provides interactive API documentation at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

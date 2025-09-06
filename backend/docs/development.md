# Development Guide

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── core/
│   │   ├── config.py          # Configuration and environment variables
│   │   └── database.py        # Database connection and session management
│   ├── models/
│   │   ├── user.py            # User SQLAlchemy model
│   │   └── chat.py            # Conversation and Message models
│   ├── schemas/
│   │   ├── auth.py            # Authentication Pydantic schemas
│   │   └── chat.py            # Chat Pydantic schemas
│   ├── routers/
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── chat.py            # Chat endpoints
│   │   └── chat_history.py    # Chat history endpoints
│   ├── services/
│   │   ├── auth_service.py    # Authentication business logic
│   │   └── chat_service.py    # Chat business logic
│   ├── agents/
│   │   └── chat_agent.py      # LangGraph AI agent implementation
│   ├── middleware/
│   │   └── auth_middleware.py # Authentication middleware
│   └── dependencies/
│       └── auth.py            # Authentication dependencies
├── docs/                      # API documentation
├── tests/                     # Test files
└── pyproject.toml            # Python dependencies and project config
```

## Setup and Installation

### Prerequisites

- Python 3.8+
- SQLite (for local development)
- Google OAuth credentials

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Database
DATABASE_URL=sqlite:///./redidchat.db

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173

# LangGraph/AI Configuration
LANGCHAIN_API_KEY=your-langchain-api-key
OPENAI_API_KEY=your-openai-api-key
```

### Installation

```bash
# Install dependencies using uv
uv sync

# Run the development server
uv run uvicorn app.main:app --reload --port 8000
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    provider VARCHAR NOT NULL,
    provider_id VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Conversations Table

```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Messages Table

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    role VARCHAR NOT NULL CHECK (role IN ('user', 'assistant')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Design Patterns

### Response Formats

**Success Response:**

```json
{
  "data": {...},
  "message": "Optional success message"
}
```

**Error Response:**

```json
{
  "detail": "Error description"
}
```

### Authentication Flow

1. **OAuth Initiation**: `GET /api/v1/auth/login/{provider}`
2. **OAuth Callback**: `GET /api/v1/auth/callback`
3. **JWT Token**: Returned in callback response
4. **Protected Endpoints**: Include `Authorization: Bearer <token>` header

### Chat Flow

1. **Send Message**: `POST /api/v1/chat/`
2. **AI Processing**: LangGraph agent processes message
3. **Response**: AI response with conversation tracking
4. **History**: Access via chat history endpoints

## Testing

```bash
# Run tests
uv run pytest

# Run specific test file
uv run pytest tests/test_auth.py

# Run with coverage
uv run pytest --cov=app
```

## Deployment

### Production Environment Variables

Update `.env` for production:

- Use PostgreSQL instead of SQLite
- Set secure `SECRET_KEY`
- Configure production OAuth redirect URIs
- Set production `FRONTEND_URL`

### Docker Deployment

```bash
# Build image
docker build -t reddichat-backend .

# Run container
docker run -p 8000:8000 --env-file .env reddichat-backend
```

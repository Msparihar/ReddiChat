# Chat API

## Endpoints

### POST /api/v1/chat/

Send a message and get AI response.

**Headers:**

- `Authorization: Bearer <jwt_token>`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "message": "string",
  "conversation_id": "uuid" // Optional - omit to start new conversation
}
```

**Response:**

```json
{
  "response": "AI response text",
  "conversation_id": "uuid",
  "message_id": "uuid"
}
```

**Examples:**

**New Conversation:**

```bash
curl -X POST "http://localhost:8000/api/v1/chat/" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?"
  }'
```

**Continue Existing Conversation:**

```bash
curl -X POST "http://localhost:8000/api/v1/chat/" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Can you explain more?",
    "conversation_id": "a40e1441-8298-427f-be4e-cf428d91e7ae"
  }'
```

**Error Responses:**

- `400` - Invalid request format
- `401` - Unauthorized
- `422` - Validation error (empty message, invalid conversation_id)
- `500` - AI service error

## Chat Flow

1. **Start New Conversation**: Send message without `conversation_id`
2. **Continue Conversation**: Use the `conversation_id` from previous responses
3. **AI Processing**: The system processes your message using LangGraph AI agents
4. **Response**: Receive AI response with conversation tracking

## Message Storage

All messages are automatically saved with:

- User message stored as `role: "user"`
- AI response stored as `role: "assistant"`
- Timestamps for all messages
- Association with conversation and user

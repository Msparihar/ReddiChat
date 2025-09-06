# Chat History API

## Endpoints

### GET /api/v1/chat/history/conversations

Get paginated list of user's conversations.

**Headers:**

- `Authorization: Bearer <jwt_token>`

**Query Parameters:**

- `page` (int): Page number (default: 1, min: 1)
- `size` (int): Items per page (default: 10, min: 1, max: 100)

**Response:**

```json
{
  "conversations": [
    {
      "id": "uuid",
      "title": "string",
      "created_at": "2025-09-05T19:43:48.000Z",
      "updated_at": "2025-09-05T19:43:48.000Z",
      "user_id": "uuid"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 10,
    "total": 25,
    "pages": 3
  }
}
```

**Example:**

```bash
curl -X GET "http://localhost:8000/api/v1/chat/history/conversations?page=1&size=10" \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

### GET /api/v1/chat/history/conversations/{conversation_id}

Get detailed conversation with all messages.

**Headers:**

- `Authorization: Bearer <jwt_token>`

**Parameters:**

- `conversation_id` (path): UUID of the conversation

**Response:**

```json
{
  "id": "uuid",
  "title": "string",
  "created_at": "2025-09-05T19:43:48.000Z",
  "updated_at": "2025-09-05T19:43:48.000Z",
  "messages": [
    {
      "id": "uuid",
      "content": "string",
      "role": "user|assistant",
      "timestamp": "2025-09-05T19:43:48.000Z",
      "conversation_id": "uuid"
    }
  ]
}
```

**Error Responses:**

- `400` - Invalid conversation ID format
- `401` - Unauthorized
- `404` - Conversation not found or doesn't belong to user

**Example:**

```bash
curl -X GET "http://localhost:8000/api/v1/chat/history/conversations/a40e1441-8298-427f-be4e-cf428d91e7ae" \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

### DELETE /api/v1/chat/history/conversations/{conversation_id}

Delete a conversation and all its messages.

**Headers:**

- `Authorization: Bearer <jwt_token>`

**Parameters:**

- `conversation_id` (path): UUID of the conversation to delete

**Response:**

```json
{
  "message": "Conversation deleted successfully"
}
```

**Error Responses:**

- `400` - Invalid conversation ID format
- `401` - Unauthorized
- `404` - Conversation not found or doesn't belong to user
- `500` - Database error

**Example:**

```bash
curl -X DELETE "http://localhost:8000/api/v1/chat/history/conversations/a40e1441-8298-427f-be4e-cf428d91e7ae" \
  -H "Authorization: Bearer <your_jwt_token>"
```

## Notes

- All endpoints require authentication
- Users can only access their own conversations
- Deleting a conversation permanently removes all associated messages
- Conversations are ordered by `updated_at` descending (most recent first)
- Message history is preserved with proper role identification for chat reconstruction

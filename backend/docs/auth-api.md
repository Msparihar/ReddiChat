# Authentication API

## Endpoints

### GET /api/v1/auth/login/{provider}

Initiates OAuth login with the specified provider.

**Parameters:**

- `provider` (path): OAuth provider name (currently supports "google")

**Response:**

- `302 Redirect` - Redirects to OAuth provider authorization URL

**Example:**

```bash
curl -X GET "http://localhost:8000/api/v1/auth/login/google"
```

---

### GET /api/v1/auth/callback

Handles OAuth callback from provider.

**Query Parameters:**

- `code` (string): Authorization code from OAuth provider
- `state` (string): State parameter for security

**Response:**

```json
{
  "access_token": "jwt_token_string",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "provider": "google"
  }
}
```

---

### GET /api/v1/auth/me

Get current authenticated user information.

**Headers:**

- `Authorization: Bearer <jwt_token>`

**Response:**

```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "provider": "google",
  "created_at": "2025-09-05T19:43:48.000Z",
  "updated_at": "2025-09-05T19:43:48.000Z"
}
```

**Error Responses:**

- `401` - Invalid or expired token
- `404` - User not found

**Example:**

```bash
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer <your_jwt_token>"
```

---

### POST /api/v1/auth/logout

Logout current user (client-side token invalidation).

**Headers:**

- `Authorization: Bearer <jwt_token>`

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

**Example:**

```bash
curl -X POST "http://localhost:8000/api/v1/auth/logout" \
  -H "Authorization: Bearer <your_jwt_token>"
```

# Changelog

All notable changes to the ReddiChat API will be documented in this file.

## [Unreleased] - 2025-09-06

### 🎉 Major Features Added

- **Complete Conversation Management System**
  - Conversation list with pagination
  - Conversation detail view with full message history
  - Conversation deletion with cascade cleanup
  - Real-time conversation updates

### ✅ Bug Fixes

- **Fixed Black Screen Issue in Frontend**
  - Added missing `role` field to Message Pydantic schema
  - Fixed role enum values to use lowercase (`user`, `assistant`) instead of uppercase
  - Implemented proper message transformation in frontend
  - Fixed timestamp handling between backend and frontend

### 🔧 API Improvements

- **Authentication System**
  - Google OAuth 2.0 integration
  - JWT token-based authentication
  - User profile management
  - Secure authentication middleware

- **Chat System**
  - LangGraph AI agent integration
  - Message persistence with role tracking
  - Conversation context management
  - Real-time AI responses

- **Chat History System**
  - Paginated conversation listing
  - Full conversation detail retrieval
  - Conversation deletion with confirmation
  - User-scoped data access

### 🗃️ Database Schema

- **Users Table**: OAuth user management
- **Conversations Table**: Chat conversation tracking
- **Messages Table**: Message storage with roles and timestamps
- **Proper Foreign Key Relationships**: Data integrity and cascade deletes

### 🛡️ Security

- JWT-based authentication
- User-scoped data access
- OAuth 2.0 security standards
- Input validation and sanitization

### 📝 Documentation

- Comprehensive API documentation
- Interactive Swagger/ReDoc interfaces
- Development setup guide
- Database schema documentation

### 🎨 Frontend Integration

- **Left Panel Improvements**
  - Clickable conversation loading
  - Delete functionality with confirmation
  - Proper sidebar collapse behavior
  - Active conversation highlighting
  - Real-time conversation list updates
  - Mobile-responsive design
  - Keyboard navigation support
  - Error handling with retry mechanisms

### 🔄 Data Flow Fixes

- **Message Role Handling**: Proper role field serialization
- **Timestamp Conversion**: ISO string to Date object transformation
- **State Synchronization**: Frontend-backend data consistency
- **Error Recovery**: Graceful error handling and user feedback

## Technical Details

### API Endpoints

- `GET /api/v1/auth/login/{provider}` - OAuth login initiation
- `GET /api/v1/auth/callback` - OAuth callback handling
- `GET /api/v1/auth/me` - User profile retrieval
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/chat/` - Send message and get AI response
- `GET /api/v1/chat/history/conversations` - List conversations
- `GET /api/v1/chat/history/conversations/{id}` - Get conversation details
- `DELETE /api/v1/chat/history/conversations/{id}` - Delete conversation

### Data Models

- **User**: OAuth user information
- **Conversation**: Chat conversation metadata
- **Message**: Individual chat messages with roles
- **Role Enum**: `user` | `assistant`

### Dependencies

- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM and database management
- **Pydantic**: Data validation and serialization
- **LangGraph**: AI agent orchestration
- **OAuth Libraries**: Google OAuth integration
- **JWT**: Token-based authentication

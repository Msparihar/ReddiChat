# ReddiChat Chat API Documentation

## Overview

ReddiChat provides a unified chat API endpoint that supports both text-only and multimodal interactions, allowing users to send messages with or without file attachments (images, audio, video files, and PDFs). This document describes the API endpoints and functionality.

## Features

- **Unified Chat Endpoint**: Single endpoint for all chat interactions
- **Multimodal Support**: Process text messages with optional file attachments
- **File Processing**: Automatic file processing for LLM consumption
- **S3 Storage**: Secure file storage with AWS S3 integration
- **File Deduplication**: Automatic detection and handling of duplicate files
- **Context Management**: Smart file inclusion in chat history based on relevance and recency

## Supported File Types

| Type | MIME Types | Max Size | Processing |
|------|------------|----------|------------|
| **Images** | `image/jpeg`, `image/png`, `image/gif`, `image/webp` | 10MB | Base64 encoding for visual analysis |
| **Audio** | `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/m4a` | 25MB | Base64 encoding for transcription |
| **Video** | `video/mp4`, `video/webm`, `video/avi`, `video/mov` | 50MB | Base64 encoding for analysis |
| **PDFs** | `application/pdf` | 10MB | Text extraction + OCR |

## API Endpoints

### 1. Unified Chat Endpoint

**POST** `/api/v1/chat/`

Process a chat message with optional file attachments. This is the only endpoint needed for all chat interactions.

#### Request Format

```http
POST /api/v1/chat/
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- message: string (required) - The text message
- conversation_id: string (optional) - UUID of existing conversation
- files: file[] (optional) - Array of files to upload (max 5)
```

#### Example Requests

##### Text-only Message

```bash
curl -X POST "http://localhost:8000/api/v1/chat/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "message=Hello! Can you help me with Python?"
```

##### Message with Image Attachment

```bash
curl -X POST "http://localhost:8000/api/v1/chat/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "message=What do you see in this image?" \
  -F "conversation_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "files=@image.jpg"
```

#### Response Format

```json
{
  "response": "I can see a red test image with the text 'TEST' written on it...",
  "conversation_id": "123e4567-e89b-12d3-a456-426614174000",
  "message_id": "987fcdeb-51a2-43d7-8f9e-123456789abc",
  "sources": [
    {
      "title": "Reddit Post Title",
      "text": "Post content...",
      "url": "https://reddit.com/...",
      "subreddit": "programming",
      "author": "user123",
      "score": 150,
      "num_comments": 25,
      "created_utc": "2024-01-15T10:30:00Z",
      "permalink": "/r/programming/comments/..."
    }
  ],
  "tool_used": "search_reddit",
  "files_processed": 1
}
```

### 2. File Upload Test Endpoint

**POST** `/api/v1/chat/upload-test`

Test file upload functionality without processing through LLM.

#### Request Format

```http
POST /api/v1/chat/upload-test
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- files: file[] (required) - Files to test upload
```

#### Response Format

```json
{
  "message": "File upload test completed",
  "results": [
    {
      "filename": "test.jpg",
      "file_type": "image",
      "file_size": 15420,
      "status": "success",
      "file_id": "abc123...",
      "s3_url": "https://bucket.s3.region.amazonaws.com/path/file.jpg"
    }
  ],
  "total_files": 1,
  "successful_uploads": 1
}
```

### 3. Health Check Endpoint

**GET** `/api/v1/chat/health`

Check the health status of the chat service.

## Configuration

### Environment Variables

Add these environment variables to your `.env` file:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET=reddichat-files

# File Upload Configuration
MAX_FILE_SIZE=50000000  # 50MB in bytes
MAX_FILES_PER_MESSAGE=5
```

### File Size Limits

- **Images**: 10MB max
- **Audio**: 25MB max
- **Video**: 50MB max
- **PDFs**: 10MB max
- **Max files per message**: 5

## Error Handling

The API returns appropriate HTTP status codes and error messages:

### Common Error Codes

- **400 Bad Request**: Invalid input, file too large, unsupported file type
- **401 Unauthorized**: Missing or invalid authentication token
- **413 Payload Too Large**: File exceeds size limits
- **429 Too Many Requests**: Rate limiting exceeded
- **500 Internal Server Error**: Server processing error

### Example Error Response

```json
{
  "detail": "File size exceeds maximum allowed size of 10.0MB"
}
```

## Usage Examples

### 1. Send Text-only Message

```python
import requests

url = "http://localhost:8000/api/v1/chat/"
headers = {"Authorization": "Bearer YOUR_TOKEN"}

# Prepare form data
data = {
    "message": "Hello! Can you help me with Python?"
}

response = requests.post(url, headers=headers, data=data)
result = response.json()
print(f"AI Response: {result['response']}")
```

### 2. Upload Image and Ask About It

```python
import requests

url = "http://localhost:8000/api/v1/chat/"
headers = {"Authorization": "Bearer YOUR_TOKEN"}

# Prepare form data
data = {
    "message": "Analyze this image and tell me what you see"
}

# Upload file
with open("photo.jpg", "rb") as f:
    files = {"files": ("photo.jpg", f, "image/jpeg")}
    response = requests.post(url, headers=headers, data=data, files=files)

result = response.json()
print(f"AI Response: {result['response']}")
```

### 3. Upload PDF and Extract Information

```python
import requests

url = "http://localhost:8000/api/v1/chat/"
headers = {"Authorization": "Bearer YOUR_TOKEN"}

data = {
    "message": "Summarize the key points from this document"
}

with open("document.pdf", "rb") as f:
    files = {"files": ("document.pdf", f, "application/pdf")}
    response = requests.post(url, headers=headers, data=data, files=files)

result = response.json()
print(f"Summary: {result['response']}")
```

### 4. Continue Conversation

```python
import requests

url = "http://localhost:8000/api/v1/chat/"
headers = {"Authorization": "Bearer YOUR_TOKEN"}

# First message creates conversation
data1 = {"message": "Hello! I want to analyze some images."}
response1 = requests.post(url, headers=headers, data=data1)
conversation_id = response1.json()["conversation_id"]

# Second message in same conversation
data2 = {
    "message": "Here's the first image to analyze",
    "conversation_id": conversation_id
}

with open("image1.jpg", "rb") as f:
    files = {"files": ("image1.jpg", f, "image/jpeg")}
    response2 = requests.post(url, headers=headers, data=data2, files=files)

print(f"Analysis: {response2.json()['response']}")
```

## Database Schema

### File Attachments Table

```sql
CREATE TABLE file_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    s3_bucket VARCHAR(100) NOT NULL,
    s3_key VARCHAR(255) NOT NULL,
    s3_url TEXT NOT NULL,
    processing_status VARCHAR(20) DEFAULT 'processed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    checksum VARCHAR(64)
);
```

### Message Attachments Table

```sql
CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    file_attachment_id UUID NOT NULL REFERENCES file_attachments(id) ON DELETE CASCADE,
    attachment_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Security Considerations

1. **File Validation**: All uploaded files are validated for type, size, and content
2. **User Isolation**: Files are isolated per user and cannot be accessed by other users
3. **S3 Security**: Files are stored in S3 with proper access controls
4. **Checksum Verification**: File integrity is verified using SHA256 checksums
5. **Rate Limiting**: API endpoints are rate-limited to prevent abuse

## Performance Optimization

1. **File Deduplication**: Identical files are stored only once per user
2. **Smart Context Loading**: Recent files are included in chat context automatically
3. **Async Processing**: File operations are handled asynchronously
4. **Lazy Loading**: Files are only retrieved from S3 when needed for context

## Monitoring and Logging

The system logs:

- File upload attempts and results
- Processing errors and warnings
- S3 operation status
- LLM processing metrics

## Troubleshooting

### Common Issues

1. **S3 Upload Failures**
   - Check AWS credentials and permissions
   - Verify S3 bucket exists and is accessible
   - Check network connectivity

2. **File Processing Errors**
   - Ensure file types are supported
   - Check file size limits
   - Verify file is not corrupted

3. **LLM Processing Issues**
   - Check Gemini API key configuration
   - Monitor API rate limits
   - Verify multimodal content format

### Debug Endpoints

Use the health check and upload test endpoints to diagnose issues:

```bash
# Check service health
curl http://localhost:8000/api/v1/chat/health

# Test file upload without LLM processing
curl -X POST "http://localhost:8000/api/v1/chat/upload-test" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@test.jpg"
```

## Migration Guide

To migrate from separate text-only and multimodal endpoints to the unified chat endpoint:

1. **Update API Calls**: Replace calls to `/api/v1/chat/text-only` with `/api/v1/chat/`
2. **Maintain Parameters**: All existing parameters work the same way
3. **Simplify Logic**: Remove logic to determine which endpoint to use
4. **Testing**: Use provided test scripts to verify functionality

## Future Enhancements

Planned improvements:

- Additional file format support
- Real-time file processing status
- Batch file upload capabilities
- Advanced file search and filtering
- File sharing between conversations

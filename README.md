# ReddiChat - AI Chat with Reddit Integration

> **[Try ReddiChat Live](https://reddichat.manishsingh.tech/)**

ReddiChat is an intelligent chatbot that combines AI with real-time Reddit insights. Get answers enriched with current discussions, opinions, and trends from Reddit communities.

## Features

### AI-Powered Conversations
- Chat with Gemini 2.5 Flash for intelligent responses
- Context-aware conversations with memory across sessions
- Natural language understanding for complex queries

### Reddit Integration
- **Real-time Reddit Search**: Get current discussions and opinions
- **Source Attribution**: See which Reddit posts inform the AI's responses
- **Community Insights**: Access diverse perspectives from various subreddits
- **Reddit User Lookup**: View any user's posts, comments, and media at `/u/username`

### Rich Chat Experience
- **Persistent Chat History**: All conversations saved and searchable
- **Modern Interface**: Clean, responsive design
- **Source Display**: Interactive cards showing Reddit posts with links, scores, and metadata
- **File Attachments**: Upload images and files to chat

### Secure Authentication
- Google and GitHub OAuth integration
- Session management with Better Auth
- User-specific chat history

## Tech Stack

### Frontend (Next.js 15)
- **Next.js 15** with App Router
- **React 19** with Server Components
- **Tailwind CSS** for styling
- **Zustand** for client state
- **React Query** for server state
- **Better Auth** for authentication
- **Drizzle ORM** for database

### Backend (FastAPI)
- **FastAPI** for API endpoints
- **LangGraph** for AI agent orchestration
- **Google Gemini** for AI capabilities
- **PRAW** for Reddit API
- **PostgreSQL** for data persistence

### Infrastructure
- **Dokploy** on Hostinger VPS
- **Docker** containerization
- **Traefik** reverse proxy
- **Cloudflare** for DNS and CDN

## Quick Start

### Prerequisites
- Node.js 20+ / Bun
- Python 3.13+
- PostgreSQL
- Docker (optional)

### Frontend Setup

```bash
cd frontend
bun install
cp .env.example .env
# Edit .env with your credentials
bun run dev
```

### Backend Setup

```bash
cd backend
uv install
cp env.example .env
# Edit .env with your credentials
uv run uvicorn app.main:app --reload
```

### Environment Variables

#### Frontend (.env)
```env
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your-secret
GEMINI_API_KEY=your-key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=sfo3
S3_BUCKET=your-bucket
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:3000
```

### Docker Deployment

```bash
cd frontend
docker build -t reddichat .
docker run -p 3000:3000 --env-file .env reddichat
```

## Project Structure

```
ReddiChat/
├── frontend/                 # Next.js 15 app
│   ├── app/                  # App Router pages
│   │   ├── (auth)/login/     # Login page
│   │   ├── (chat)/chat/      # Chat interface
│   │   ├── u/[username]/     # Reddit user lookup
│   │   └── api/              # API routes
│   ├── components/           # React components
│   ├── lib/                  # Utilities
│   │   ├── auth/             # Better Auth config
│   │   ├── db/               # Drizzle ORM
│   │   ├── reddit/           # Reddit API client
│   │   └── ai/               # AI agent setup
│   └── stores/               # Zustand stores
├── backend/                  # FastAPI backend (legacy)
│   ├── app/
│   │   ├── agents/           # LangGraph agents
│   │   ├── routers/          # API routes
│   │   └── models/           # SQLAlchemy models
│   └── Dockerfile
└── docker-compose.yml
```

## API Documentation

Backend API docs available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**[Start Chatting Now](https://reddichat.manishsingh.tech/)**

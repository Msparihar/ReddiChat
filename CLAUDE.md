# ReddiChat

## Project Overview
Reddit-powered AI chat application with social authentication and multi-model support.

## Current Version
**v1.1.0** — Multi-model support (Gemini + OpenAI)

## Architecture
- **Frontend only** — No backend; Next.js App Router handles API routes
- **AI:** AI SDK v6 with Google Gemini (`@ai-sdk/google`) and OpenAI (`@ai-sdk/openai`)
- **Auth:** Better Auth with Google/GitHub OAuth
- **Database:** PostgreSQL via Drizzle ORM
- **Storage:** AWS S3 for file uploads
- **Email:** Nodemailer for login notifications
- **State:** Zustand (client state) + React Query (server data)

## Key Files
- `frontend/lib/ai/models.ts` — Model registry (add/remove models here)
- `frontend/lib/ai/agent.ts` — AI streaming, multi-provider model selection, tool orchestration
- `frontend/lib/ai/tools/` — Reddit search and web search tools
- `frontend/stores/chat-store.ts` — Chat state management (messages, threads, model selection)
- `frontend/lib/streaming.ts` — SSE stream parser
- `frontend/app/api/chat/stream/route.ts` — Chat API endpoint (accepts `model` in FormData)
- `frontend/lib/auth/index.ts` — Auth configuration with login notification hooks
- `frontend/lib/email/` — Email service for login notifications

## Versioning & PRD Workflow
- **PRDs live in `docs/prd/`** — one file per version (e.g., `v1.0.0.md`, `v1.1.0.md`)
- **Template:** `docs/prd/TEMPLATE.md` — use this for new versions
- **Workflow:**
  1. Write PRD for the next version
  2. Discuss and finalize scope
  3. Implement
  4. Tag the git release
  5. Update this file's "Current Version"
- **Semantic versioning:** major.minor.patch
  - **Major** — breaking changes, large rewrites
  - **Minor** — new features, non-breaking
  - **Patch** — bug fixes, small improvements

## Roadmap

| Version | Focus | Status |
|---|---|---|
| v1.0.0 | Initial release — Reddit AI chat, auth, streaming | Shipped |
| v1.1.0 | Multi-model support (Gemini + OpenAI) | Shipped |
| v1.2.0 | Production hardening — rate limiting, validation, DB optimization | Shipped |
| v1.3.0 | Security & cost protection — logging, daily limits, token budgets, file hardening | Shipped |
| v1.3.1 | Usage visibility — API endpoint, UI indicator, precise limit errors | Shipped |
| v1.4.0 | Profile dropdown + copy button + mobile layout | Shipped |
| v1.4.1 | In-app contact form | Shipped |
| v1.4.2 | Quick topic chips in contact dialog | Shipped |
| v1.5.0 | Search, export, streaming phases, keyboard shortcuts, error UI, accessibility | Shipped |
| v1.6.0 | User roles & tier-based access control | Shipped |
| v1.7.0 | Design system overhaul — Orangered brand, Apple shadows, warm tokens | In Progress |
| v2.0.0 | Community Intelligence — sentiment, trending, TLDR, subreddit pages | Planned |
| v2.1.0 | Monetization — Stripe billing on top of v1.6.0 tiers | Planned |

## Notes
- Login notifications are sent via Better Auth hooks after social sign-in
- Pre-push hook runs Docker build to validate before pushing (logs to pre-push-build.log)
- Model list can be updated by editing `frontend/lib/ai/models.ts`
- Both `GEMINI_API_KEY` and `OPENAI_API_KEY` are required in `.env` for multi-model support

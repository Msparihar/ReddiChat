# ReddiChat

## Project Overview
Reddit-style chat application with social authentication.

## Architecture
- **Frontend only** - No backend used
- Auth: Better Auth with Google/GitHub OAuth
- Database: PostgreSQL via Drizzle ORM
- Email: Nodemailer for login notifications

## Key Files
- `frontend/lib/auth/index.ts` - Auth configuration with login notification hooks
- `frontend/lib/email/` - Email service for login notifications

## Notes
- Login notifications are sent via Better Auth hooks after social sign-in
- Backend folder exists but is not in use
- Pre-push hook runs Docker build to validate before pushing (logs to pre-push-build.log)

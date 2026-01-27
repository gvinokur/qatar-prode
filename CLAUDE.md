# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Critical Rules

1. **NEVER implement stories in main worktree** (`/qatar-prode`) - Always use story worktrees
2. **NEVER commit to `main` branch** unless user explicitly says "commit to main"
3. **ALWAYS use absolute paths** when working with worktree files (e.g., `/qatar-prode-story-42/app/file.ts`)
4. **ALWAYS copy `.env.local`** to new worktrees (prevents `missing_connection_string` errors)
5. **NEVER commit without user verification** - User must test locally first

## Quick Reference

### Essential Commands
```bash
# Development
npm run dev              # Start dev server (https://localhost:3000)
npm run build            # Production build
npm run test             # Run all tests (Vitest)
npm run lint             # Run ESLint

# Pre-Implementation Verification (MANDATORY before coding)
git worktree list        # Check existing worktrees
git branch --show-current # Verify current branch

# GitHub Projects Workflow
./scripts/github-projects-helper projects stats 1          # View project status
./scripts/github-projects-helper stories suggest 1         # Get candidate stories
./scripts/github-projects-helper story start 42 --project 1   # Start story
./scripts/github-projects-helper pr wait-checks 45         # Wait for CI/CD
./scripts/github-projects-helper story complete 42 --project 1 # Merge & cleanup
```

### Quick Links

For detailed guidance, see:

- **[Git Worktrees Guide](docs/claude/worktrees.md)** - Worktree setup, management, and safety checks
- **[GitHub Projects Workflow](docs/claude/github-projects-workflow.md)** - Complete story workflow from start to completion
- **[Architecture Guide](docs/claude/architecture.md)** - Stack, patterns, server/client boundaries
- **[Testing Guide](docs/claude/testing.md)** - Testing conventions and requirements
- **[Helper Script Docs](scripts/README.md)** - Full documentation for `github-projects-helper`

## Project Context

- **Framework**: Next.js 15.3 with App Router
- **Database**: PostgreSQL with Kysely ORM
- **Auth**: NextAuth.js v5
- **UI**: Material-UI v7
- **Testing**: Vitest (60% coverage minimum)
- **Deployment**: Vercel (auto-deploy on push to main)

## Decision Tree for Implementation

```
User says "implement story #42" or "execute plan"
    ↓
Run: git worktree list && git branch --show-current
    ↓
┌─────────────────────────────────────┐
│ Story worktree exists?              │
│ (e.g., /qatar-prode-story-42)      │
└─────────────────────────────────────┘
    ↓                    ↓
   YES                  NO
    ↓                    ↓
Set WORKTREE_PATH    ASK USER:
Use absolute paths   "Should I create
Proceed             story worktree?"
                         ↓
                    Create with:
                    ./scripts/github-projects-helper story start 42 --project 1
```

## Common Mistakes to Avoid

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|------------------|
| Implementing in `/qatar-prode` | Stories need isolated worktrees | Use `/qatar-prode-story-N` |
| Current branch is `main` | Risk of committing to main | Use feature branch `feature/story-N` |
| Using relative paths | Bash tool doesn't persist `cd` | Use absolute paths: `/qatar-prode-story-N/file.ts` |
| Forgetting `.env.local` | App fails with DB errors | Copy after worktree creation |
| Client imports repository | Causes build errors | Server Components import repos, Client Components get props |
| Auto-committing after changes | User can't verify locally | Only commit when user asks |

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- No unused imports (enforced by pre-commit hooks)

### Security
- Never commit `.env.local` or secrets
- Use Server Actions for all mutations
- Validate user input with Zod schemas
- Check authorization in Server Actions

### Performance
- Use Server Components by default
- Add `'use client'` only when needed (hooks, interactions, browser APIs)
- Optimize images with Next.js `<Image>` component

### Quality Gates (SonarCloud)
- Code coverage: ≥60%
- Security rating: A
- Maintainability: B or higher
- Duplicated code: <5%

## Environment Variables

Required for development (`.env.local`):

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/qatar_prode

# Auth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Email (Nodemailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@example.com

# AWS S3 (file uploads)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_BUCKET_NAME=your-bucket-name

# Web Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Qatar Prode
NEXT_PUBLIC_APP_DESCRIPTION=Sports Prediction Platform
```

## Additional Notes

- Experimental HTTPS in development for PWA testing
- Tournament data stored in `data/` as JSON files
- Database migrations in `migrations/` (manual execution)
- Git hooks via Husky (tests + linting on modified files)

# Architecture Guide

Quick overview of the qatar-prode application architecture with links to detailed documentation.

## Stack Overview

- **Framework**: Next.js 15.3 with App Router (Server Components by default)
- **Database**: PostgreSQL with Kysely ORM (`@vercel/postgres-kysely`)
- **Authentication**: NextAuth.js v5 (beta) with Credentials provider
- **UI**: Material-UI v7 with Emotion styling
- **i18n**: next-intl with locale routing (English, Spanish)
- **Testing**: Vitest 3.2 (primary), Jest 29.7 (legacy integration tests)
- **PWA**: Serwist for service workers and offline support

## Project Structure

```
app/
├── actions/          # Server Actions (business logic layer)
├── db/              # Database layer
│   ├── database.ts           # Kysely instance & schema
│   ├── tables-definition.ts  # Type-safe table schemas
│   └── *-repository.ts       # Repository pattern for data access
├── components/       # React components organized by feature
├── utils/           # Pure functions (calculators, formatters)
└── api/             # API routes (auth, uploads, webhooks)

__tests__/           # Test files mirroring app/ structure
migrations/          # PostgreSQL migration scripts
data/                # Tournament seed data (JSON), organized by tournament
locales/             # Translation files organized by locale (en, es)
```

---

## 🎯 Core Patterns (START HERE)

These are the fundamental patterns that define how the application works.

### Testing Patterns (MANDATORY)

**All tests MUST follow these patterns.** These are non-negotiable requirements.

#### Mock Data (MANDATORY)

- ✅ **ALWAYS** use `testFactories.*` from `__tests__/db/test-factories.ts`
- ❌ **NEVER** create mock data objects manually

```typescript
// ✅ CORRECT
import { testFactories } from '@/__tests__/db/test-factories';
const mockTournament = testFactories.tournament({ id: '1', name: 'Test' });

// ❌ WRONG
const mockTournament = { id: '1', name: 'Test', is_active: true, /* ... */ };
```

#### Database Mocking (MANDATORY)

- ✅ **ALWAYS** use `createMock*Query()` from `__tests__/db/mock-helpers.ts`
- ❌ **NEVER** build Kysely query chains manually in tests

```typescript
// ✅ CORRECT
import { createMockSelectQuery } from '@/__tests__/db/mock-helpers';
const mockQuery = createMockSelectQuery(mockTournament);
vi.mocked(db.selectFrom).mockReturnValue(mockQuery as any);
```

#### Component Rendering (MANDATORY)

- ✅ **ALWAYS** use `renderWithProviders()` from `__tests__/utils/test-utils.tsx`
- ❌ **NEVER** create local theme/context wrappers

```typescript
// ✅ CORRECT
import { renderWithProviders } from '@/__tests__/utils/test-utils';
renderWithProviders(<Component />, { locale: 'en', theme: 'dark' });
```

**Coverage Requirements:** 60% overall, 80% on new code (enforced by SonarCloud)

**See:** [Testing Guide](testing.md) for complete patterns, examples, and utilities documentation.

---

### 📚 Detailed Architecture Documentation

**Core Architectural Patterns:**
- **[Server Actions, Client/Server Boundaries, Repository, Type-Safe Queries](architecture/core-patterns.md)** - CRITICAL patterns for data flow

**Key Patterns:**
- **[Context Providers](architecture/contexts.md)** - Server Component → Provider → Client Component flow (GuessesContext, etc.)
- **[Performance Optimization](architecture/performance.md)** - When to optimize (5-10+ queries), materialization, Vercel tier constraints

**Components:**
- **[Component Organization & Reusable UI](architecture/components.md)** - ScrollShadowContainer, storage utilities, auto-scroll

**Data & Infrastructure:**
- **[Database Schema & Type-Safe Queries](architecture/database.md)** - 18+ tables, Kysely patterns
- **[i18n Infrastructure](architecture/i18n.md)** - Locale routing, translation namespaces, database-driven i18n
- **[Authentication](architecture/authentication.md)** - Auth flow, public vs authenticated views, middleware protection

---

## Scoring System

**Game prediction scoring** in `app/utils/game-score-calculator.ts`:
- Exact score: Maximum points
- Correct winner + goal difference: Medium points
- Correct winner: Base points
- Penalties: Bonus points

**Group standings** calculated by `app/utils/group-position-calculator.ts`:
- Points, goal difference, goals scored, head-to-head

**Award calculations** in `app/utils/award-utils.ts`:
- Best player, top scorer, best goalkeeper, young player
- Use `getAwardsDefinition(t)` for i18n-aware definitions
- Legacy `awardsDefinition` export is deprecated

## Progressive Web App

PWA configuration via Serwist (`@serwist/next`):
- Service worker in `app/service-worker.ts`
- Manifest in `app/manifest.json`
- Offline fallback page: `/offline`
- Push notifications using Web Push API

Install prompt component: `app/components/Install-pwa.tsx`

## Deployment

Configured for Vercel deployment:
- `vercel.json` present
- Environment variables set in Vercel dashboard
- Automatic deployments on push to `main`
- Preview deployments for pull requests

## Additional Notes

- The app uses experimental HTTPS in development (`npm run dev`) for testing PWA features
- Tournament seed data is stored in `data/` directory as JSON files, organized by tournament (copa-america, euro, fifa-2026)
- Database migrations are in `migrations/` directory (manual execution required)
- SonarCloud integration runs automatically on push/PR via GitHub Actions

---

## AdSense Integration

Google AdSense Auto Ads are loaded conditionally for non-ad-free users.

**Script loading flow:**
1. `app/[locale]/layout.tsx` (Server Component) checks `process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && !user?.isAdFree` before rendering the `<Script>` tag — ad-free users never receive the script
2. `AdSensePageViewTracker` (Client Component, always mounted) fires `adsbygoogle.push({})` on each SPA pathname change for non-ad-free sessions, or sets `adsbygoogle.pauseAdRequests = 1` for ad-free users — handles mid-session login/logout without requiring a hard refresh

**`isAdFree` propagation chain:**
- Stored as `is_ad_free: boolean` in the `users` table
- All four auth paths (password, OTP, Google OAuth existing/new) read `is_ad_free` from the DB and set `user.isAdFree` — see `auth.ts`
- `auth.ts` JWT callback merges `isAdFree` into the JWT token; session callback picks it into `session.user`
- `types/next-auth.d.ts` extends `Session.user`, `User`, and `JWT` with `isAdFree: boolean` for type safety
- Admins toggle per-user ad-free status in the Backoffice → Users tab via `toggleUserAdFreeAction`

**Graceful degradation:** If `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is absent (dev/test), no script loads and the tracker is a no-op.

---

## Quick References

- **[Critical Patterns Quick Reference](patterns.md)** - Top 5 patterns with ✅/❌ examples
- **[Testing Guide](testing.md)** - Comprehensive testing patterns and utilities
- **[Common Mistakes](../../CLAUDE.md#common-mistakes-to-avoid)** - What to avoid

# Authentication

This guide covers authentication setup and patterns in the qatar-prode application.

## Table of Contents
- [Authentication Flow](#authentication-flow)
- [Authentication Patterns](#authentication-patterns)

## Authentication Flow

NextAuth.js v5 configured in `auth.ts`:
- Credentials provider with email/password
- Custom session extended with `nickname`, `isAdmin`, `emailVerified`
- Password hashing via `crypto-js` (see `users-repository.ts:getPasswordHash`)
- Sign-in redirect: `/?openSignin=true`

Access current user in Server Components:

```typescript
import { auth } from '@/auth';

const session = await auth();
const userId = session?.user?.id;
```

## Authentication Patterns

### Session Access

**In Server Components:**
```typescript
import { getLoggedInUser } from '@/app/actions/user-actions';

const user = await getLoggedInUser(); // Returns User | null
```

**In Server Actions:**
```typescript
import { auth } from '@/auth';

const session = await auth(); // Returns Session | null
if (!session) throw new Error('Unauthorized');
```

**Pattern:** Server Components use `getLoggedInUser()`, Server Actions use `auth()` directly.

### Public vs Authenticated Views (Conditional Rendering)

**Pattern:** Branch at Server Component level, render different trees based on auth state. No separate `/public/` routes.

```typescript
// Server Component determines auth, branches early
export async function UnifiedGamesPage({ tournamentId }) {
  const user = await getLoggedInUser();

  if (!user) {
    // Public view: Read-only, no user-specific data
    return <PublicGamesPage tournamentId={tournamentId} />;
  }

  // Authenticated view: Full features, user-specific data
  const guesses = await findUserGuesses(user.id, tournamentId);
  const boosts = await calculateBoosts(user.id, tournamentId);

  return (
    <GuessesContextProvider initialGuesses={guesses} initialBoosts={boosts}>
      <AuthenticatedGamesPage />
    </GuessesContextProvider>
  );
}
```

### Public Components

**Location:** `app/components/tournament-page/`

- `PublicGamesPage` / `PublicGamesPageClient` - Read-only tournament view
- `LoggedOffBanner` - Conversion CTA for unauthenticated users (sticky on games page, non-sticky on dashboard)
- `ReadOnlyGameCard` - Non-interactive game cards with lock icons

### Middleware Protection

**Configured in:** `middleware.ts`

- **Protected routes:** Redirect to home with `?openSignin=true`
  - `/[locale]/tournaments/[id]/stats`
  - `/[locale]/tournaments/[id]/friend-groups`
  - `/[locale]/friend-groups/*`

- **Public routes:** Tournament view, rules, results, awards (read-only)

### Rules

- ✅ Branch at Server Component level (`if (!user) return <PublicView />`)
- ✅ Public views fetch only public data (no user-specific queries)
- ✅ Middleware protects routes (no auth checks in Client Components)
- ❌ NEVER check auth in Client Components
- ❌ NEVER use separate `/public/` routes (use conditional rendering)

**Why This Pattern:**
- Single codebase for public/auth views (easier maintenance)
- SEO-friendly (public pages crawlable)
- Marketing/discovery (users see value before signup)
- Server-side auth checks (secure)

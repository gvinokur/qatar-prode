# Architecture Guide

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

## i18n Infrastructure

**Library:** next-intl (App Router compatible, server-side translation support)

### Locale Routing

- **URL-based routing:** `[locale]` dynamic segment (e.g., `/en/tournaments/1`, `/es/tournaments/1`)
- **Supported locales:** `en` (English), `es` (Spanish, default)
- **Middleware locale detection** with priority order:
  1. Cookie (`NEXT_LOCALE`)
  2. User preference from session (authenticated users)
  3. Accept-Language header
  4. Default locale (`es`)

### Translation Namespaces

- **Location:** `/locales/{en|es}/*.json`
- **19 namespaces:** auth, awards, backoffice, common, emails, errors, games, groups, navigation, onboarding, predictions, pwa, qualified-teams, rules, stats, tables, tournament, tournaments, validation
- **Type-safe keys:** Via `IntlMessages` interface in `types/i18n.ts`

### Server vs Client Components

```typescript
// Server Components
import { getLocale, getTranslations } from 'next-intl/server';

const locale = await getLocale();  // 'en' | 'es'
const t = await getTranslations('common');

// Client Components
'use client';
import { useLocale, useTranslations } from 'next-intl';

const locale = useLocale();  // string
const t = useTranslations('common');
```

### Database-Driven i18n (IMPORTANT PATTERN)

Tables store base field + `_i18n` JSONB column (e.g., `name` + `name_i18n`).

**Rules:**
- ❌ **NEVER** add locale parameters to repository functions
- ✅ Repositories return raw data with both columns
- ✅ Server Actions use `applyLocalization()` or `applyLocalizationBatch()` from `app/utils/localization-helper.ts`
- ✅ Components receive pre-localized data

**Example:**
```typescript
// Repository (no locale)
export async function findTournaments() {
  return db.selectFrom('tournaments')
    .select(['id', 'name', 'name_i18n'])
    .execute();
}

// Server Action (apply localization)
export async function getTournaments() {
  const locale = await getLocale();
  const tournaments = await findTournaments();
  return applyLocalizationBatch(tournaments, locale, [
    { field: 'name', i18nField: 'name_i18n' }
  ]);
}
```

**See:** [i18n Patterns Guide](../app/utils/i18n-patterns.md) for comprehensive documentation on translation patterns, database-driven i18n, email templates, date formatting, and migration workflows.

## Key Architectural Patterns

### Testing Patterns (MANDATORY)

All tests **MUST** follow these patterns. These are non-negotiable requirements enforced by the codebase structure.

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

// ❌ WRONG
const mockQuery = {
  where: vi.fn().mockReturnThis(),
  execute: vi.fn().mockResolvedValue([mockTournament])
};
```

#### Component Rendering (MANDATORY)

- ✅ **ALWAYS** use `renderWithProviders()` from `__tests__/utils/test-utils.tsx`
- ❌ **NEVER** create local theme/context wrappers

```typescript
// ✅ CORRECT
import { renderWithProviders } from '@/__tests__/utils/test-utils';
renderWithProviders(<Component />, { locale: 'en', theme: 'dark' });

// ❌ WRONG
const wrapper = ({ children }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);
render(<Component />, { wrapper });
```

#### Coverage Requirements

- **60% overall coverage** (enforced by SonarCloud)
- **80% coverage on new code** (enforced by SonarCloud)

**See:** [Testing Guide](testing.md) for complete patterns, examples, and utilities documentation.

---

### Server Actions Pattern

All business logic lives in `app/actions/*.ts` files marked with `'use server'`:
- `tournament-actions.ts` - Tournament data, groups, playoffs
- `prode-group-actions.ts` - Friend groups and participation
- `game-actions.ts` - Game operations and updates
- `guesses-actions.ts` - User predictions
- `user-actions.ts` - User profiles and auth

Server Actions are imported directly into Client Components for mutations.

### Client/Server Component Boundaries (CRITICAL)

**The Golden Rule:** Server Components import repositories directly. Client Components receive data as props OR call Server Actions for mutations.

#### CORRECT Pattern for Data Fetching

```typescript
// ✅ CORRECT: Server Component imports repository directly
// app/tournaments/[id]/page.tsx
'use server'

import { findTournamentById } from '../../db/tournament-repository'
import TournamentView from '../../components/tournament-view'

export default async function TournamentPage({ params }: Props) {
  // Server Component: Import and call repository directly
  const tournament = await findTournamentById(params.id)

  // Pass data as props to Client Component
  return <TournamentView tournament={tournament} />
}

// ✅ CORRECT: Client Component receives data as props
// app/components/tournament-view.tsx
'use client'

import { Tournament } from '../db/tables-definition'

export default function TournamentView({ tournament }: { tournament: Tournament }) {
  // Client Component: Receives data as props, never imports repositories
  return <div>{tournament.name}</div>
}
```

#### INCORRECT Patterns (cause build errors)

```typescript
// ❌ INCORRECT #1: Client Component imports repository
'use client'

import { findTournamentById } from '../db/tournament-repository'  // ERROR!

export default function TournamentView({ tournamentId }: Props) {
  // This will fail at build time
  const [tournament, setTournament] = useState(null)
  useEffect(() => {
    findTournamentById(tournamentId).then(setTournament)
  }, [tournamentId])
}

```

#### Data Fetching Rules

**Server Components (pages, layouts, templates marked `'use server'`)**:
- ✅ Import and call repositories DIRECTLY (preferred for simple data fetching)
- ✅ Import and call Server Actions (works fine, useful for reusable business logic)
- ✅ Fetch all data needed by child components
- ✅ Pass data down as props to Client Components

**Client Components (marked `'use client'`)**:
- ❌ NEVER import repositories or database functions (server-only code can't run in browser)
- ✅ Receive data as props from parent Server Component
- ✅ Call Server Actions for mutations (form submissions, button clicks)
- ✅ Call Server Actions for dynamic data fetching (if needed)

**Server Actions (files marked `'use server'`)**:
- ✅ Can import and call repositories
- ✅ Used by both Server Components (for reusable logic) and Client Components (for mutations/updates)
- ✅ Encapsulate business logic that's used across multiple components

#### Example: Proper Data Flow

```typescript
// ✅ Server Component (page.tsx) - Imports repository directly
'use server'
import { findTournamentById } from '@/app/db/tournament-repository'

export default async function Page({ params }) {
  // Direct repository call in Server Component
  const tournament = await findTournamentById(params.id)

  return <ClientComponent tournament={tournament} />
}

// ✅ Client Component - Receives props and calls Server Actions for mutations
'use client'
import { updateTournamentAction } from '@/app/actions/tournament-actions'

export default function ClientComponent({ tournament }) {
  async function handleUpdate() {
    // Call Server Action for mutation
    await updateTournamentAction(tournament.id, newData)
  }

  return <button onClick={handleUpdate}>Update</button>
}

// ✅ Server Action - Used by Client Component for mutations
'use server'
import { updateTournament } from '../db/tournament-repository'

export async function updateTournamentAction(id: string, data: any) {
  return updateTournament(id, data)  // ✅ OK - Server Action wraps repository
}
```

#### Why This Matters

**The key restriction:** Client Components bundle to the browser, so they cannot import server-only code (repositories, database connections).

- **Server Components:** Run on the server, can access database directly via repositories OR indirectly via Server Actions
- **Client Components:** Bundle to browser, can ONLY call Server Actions (which then execute on server)
- **Server Actions:** Bridge between client and server, always execute on server even when called from client

**Why Client Components can't import repositories:**
- Repositories use `database.ts` which requires server-side database credentials
- Client code is sent to the browser where these credentials don't exist
- Result: Build fails with "module not found" or runtime errors

**Why Server Components CAN import Server Actions:**
- Both execute on the server, so no bundling issues
- Server Actions are just convenience wrappers around repository calls
- Useful for reusable business logic shared across multiple components

### Context Providers Pattern

**Pattern:** Server Components fetch data, wrap Client Components with Context Providers, pass data as props to provider.

**Available Providers:**
- `GuessesContextProvider` - Game predictions and boost counts (main games page)
- `FilterContextProvider` - Game filtering state
- `EditModeContextProvider` - Toggle prediction edit mode
- `CountdownContextProvider` - Live countdown updates
- `TimezoneContextProvider` - User timezone handling
- `ThemeProvider` - MUI theme management

**Location:** `app/components/context-providers/`

#### Example: GuessesContext Pattern

```typescript
// Server Component fetches data and wraps Client Component with provider
export async function UnifiedGamesPage({ tournamentId }) {
  const user = await getLoggedInUser();
  const games = await findGames(tournamentId);
  const guesses = await findGuesses(user.id, tournamentId);
  const boosts = await calculateBoosts(user.id, tournamentId);

  // Wrap Client Component with provider, pass server-fetched data as props
  return (
    <GuessesContextProvider
      initialGuesses={guesses}
      initialBoosts={boosts}
      games={games}
    >
      <GamesPageClient />  {/* Client Component consumes context */}
    </GuessesContextProvider>
  );
}

// Client Component uses context
'use client'
import { useGuessesContext } from '@/app/components/context-providers/guesses-context-provider';

export function GameCard({ game }) {
  const { gameGuesses, updateGameGuess, boostCounts } = useGuessesContext();
  // Component logic with optimistic updates...
}
```

**Rules:**
- ✅ Server Components fetch data and pass to provider as props
- ✅ Provider wraps Client Components that need the context
- ✅ Client Components use `useContext()` hook to consume
- ❌ NEVER fetch data inside Client Components (use context or props)
- ❌ NEVER put providers in Client Components (causes unnecessary re-renders)

**Why This Pattern:**
- Server-side data fetching (faster, secure, no loading states)
- Client-side state management (interactive, optimistic updates)
- Clean separation of concerns (fetch vs. interact)

### Repository Pattern

Database access is abstracted through repositories in `app/db/*-repository.ts`:

```typescript
// Example: users-repository.ts
export async function findUserByEmail(email: string) {
  return db.selectFrom('users')
    .where('email', '=', email)
    .selectAll()
    .executeTakeFirst();
}
```

Always use repositories for database access - never query `db` directly from actions or components.

### Performance Optimization Patterns

**Context:** Running on Vercel free tier requires careful resource management. Optimize strategically, not prematurely.

#### When to Analyze Performance

✅ **Optimize When:**
- Making **5-10+ database queries** to render a single page/request
- Queries run sequentially (waterfall) when they could be parallel
- Same data queried multiple times in a request
- Query results used only for aggregation/counting (can be pushed to DB)
- Hitting Vercel function duration/memory limits

❌ **Don't Optimize When:**
- Page/request makes <5 queries total
- Queries already run in parallel (`Promise.all`)
- Admin-only features (low traffic)
- One-time data migrations or scripts

🤔 **Consider When:**
- 5-10 queries (borderline) but page feels slow
- Queries could easily be combined with JOINs

#### Optimization Techniques

**1. Materialization Pattern (Story #147 example)**

Pre-calculate and store aggregations in database columns. Update via triggers or batch jobs after source data changes.

```typescript
// Before: On-demand aggregation (48+ queries per user)
const scores = await db.selectFrom('game_guesses')
  .where('user_id', '=', userId)
  .select(db.fn.sum('score').as('total'))
  .execute();

// After: Materialized columns (1 query per user)
const scores = await db.selectFrom('tournament_guesses')
  .where('user_id', '=', userId)
  .select(['total_game_score', 'total_boost_bonus'])  // Pre-calculated
  .executeTakeFirst();

// Impact: 93% compute reduction, 90% faster page loads
```

**Materialized Columns in Schema:**
- `tournament_guesses.total_game_score` - Sum of game scores
- `tournament_guesses.total_boost_bonus` - Sum of boost bonuses
- `tournament_guesses.total_correct_guesses` - Count of correct predictions
- Updated by `calculateGameScores()` action after game results published
- Legacy `legacyGetGameGuessStatisticsForUsers()` kept for validation

**2. Parallel Queries**

```typescript
// ❌ Sequential (slow)
const tournaments = await findTournaments();
const games = await findGames();
const users = await findUsers();

// ✅ Parallel (fast)
const [tournaments, games, users] = await Promise.all([
  findTournaments(),
  findGames(),
  findUsers(),
]);
```

**3. Query Optimization**
- Use JOINs to reduce round trips
- Select only needed columns
- Add indexes for frequently queried columns
- Use `.executeTakeFirst()` when expecting single result

**Measurement:**
- Count queries per page/request (aim for <5)
- Monitor Vercel function duration (check deployment logs)
- Use `legacyFunctionName()` pattern during transition for validation

### Type-Safe Database Queries

The database schema is fully typed via Kysely:

```typescript
// app/db/database.ts
export interface Database {
  users: UserTable
  tournaments: TournamentTable
  games: GameTable
  // ... all tables
}

export const db = createKysely<Database>();
```

TypeScript will catch invalid column names, table names, and type mismatches.

## Component Organization

Components are organized by feature domain:
- `/auth` - Authentication (login, signup, password reset)
- `/tournament-page` - Tournament views and standings
- `/groups-page` - Friend group management
- `/playoffs`, `/playoffs-page` - Playoff brackets
- `/awards` - Award tracking components
- `/backoffice` - Admin interface
- `/common` - Reusable UI components

Use Server Components by default. Add `'use client'` only when needed for:
- User interactions (onClick, onChange)
- React hooks (useState, useEffect, useContext)
- Browser APIs

## Reusable UI Components

### ScrollShadowContainer

**Location:** `app/components/common/scroll-shadow-container.tsx`

Visual feedback component for scrollable content areas. Shows shadows at edges when content overflows.

**Usage:**
```typescript
import { ScrollShadowContainer } from '@/app/components/common/scroll-shadow-container';

const isMobile = useMediaQuery(theme.breakpoints.down('md'));

<ScrollShadowContainer
  direction={isMobile ? 'vertical' : 'none'}  // 'vertical' | 'horizontal' | 'both' | 'none'
  height="100%"
  hideScrollbar={true}
>
  <GamesList />
</ScrollShadowContainer>
```

**Features:**
- Automatic shadow calculation based on scroll position
- ResizeObserver for responsive behavior
- MutationObserver for dynamic content
- Theme-aware (adapts to light/dark mode)
- Debounced resize (250ms), immediate scroll feedback

**Rules:**
- ✅ Use for all scrollable lists (games, stats, qualified teams)
- ✅ Set `direction` prop based on layout needs
- ✅ Use `useMediaQuery` for responsive scrolling
- ❌ NEVER pass `overflow` in `sx` prop (conflicts with `direction`)
- ❌ NEVER create custom scroll indicators (use this component)

**Used In:** Tournament sidebar, games list, results tabs, stats pages, playoffs bracket, qualified teams page (9+ components)

### Storage Utilities

**Location:** `app/utils/dismissal-storage.ts`

localStorage helpers for UI state persistence (dismissible overlays, tournament selection).

**API:**
```typescript
import { getDismissalState, setDismissalState } from '@/app/utils/dismissal-storage';

// Check if overlay dismissed
const isDismissed = getDismissalState('qualified-teams-cta');

// Mark as dismissed
setDismissalState('qualified-teams-cta', true);

// Tournament selection
const lastTournamentId = getLastSelectedTournamentId();
setLastSelectedTournamentId(tournamentId);
```

**Used For:**
- Tournament redirect logic (last selected tournament)
- Dismissible CTAs (qualified teams, awards)
- Snackbar dismissal (new tournament notifications)

### Auto-Scroll Utilities

**Location:** `app/utils/auto-scroll.ts`

Smart scrolling to game cards (finds next upcoming game or last game).

**API:**
```typescript
import { findScrollTarget, scrollToGame } from '@/app/utils/auto-scroll';

const targetGame = findScrollTarget(games);  // Finds next upcoming or last game
scrollToGame(targetGame.id, 'smooth');       // Smooth scroll to game card
```

**Used In:** Main games page (auto-scroll on load to relevant game)

## Database Schema

18+ PostgreSQL tables organized by domain:

**Core entities**: `users`, `tournaments`, `teams`, `players`, `games`

**Tournament structure**:
- `tournament_groups` + `tournament_group_teams` + `tournament_group_games`
- `tournament_playoff_rounds` + `tournament_playoff_round_games`

**Predictions**:
- `game_guesses` (individual game predictions)
- `game_results` (actual outcomes)
- `tournament_guesses` (tournament-level predictions: awards, final positions, includes deprecated `group_position_score` field for historical data)
- `tournament_qualified_teams_predictions` (team qualification predictions)

**Social features**:
- `prode_groups` + `prode_group_participants`
- `prode_group_tournament_betting` + `prode_group_tournament_betting_payments`

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
- `PublicCTABar` - Sticky conversion CTA for unauthenticated users
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

## Common Patterns

### Fetching Data in Server Components

Server Components can fetch data by importing repositories directly OR by calling Server Actions.

```typescript
// ✅ Option 1: Import Server Action (common pattern for reusable logic)
import { getTournaments } from '@/app/actions/tournament-actions';

export default async function Page() {
  const tournaments = await getTournaments();
  return <TournamentList tournaments={tournaments} />;
}

// ✅ Option 2: Import repository directly (simpler for one-off queries)
import { findAllTournaments } from '@/app/db/tournament-repository';

export default async function Page() {
  const tournaments = await findAllTournaments();
  return <TournamentList tournaments={tournaments} />;
}
```

### Client Component with Server Action

```typescript
'use client';
import { submitGuess } from '@/app/actions/guesses-actions';

export function GuessForm({ gameId }: { gameId: string }) {
  async function handleSubmit(formData: FormData) {
    await submitGuess(gameId, formData);
  }

  return <form action={handleSubmit}>...</form>;
}
```

### Type-Safe Database Query

```typescript
import { db } from '@/app/db/database';

export async function getGamesByTournament(tournamentId: string) {
  return db.selectFrom('games')
    .where('tournament_id', '=', tournamentId)
    .orderBy('game_date', 'asc')
    .selectAll()
    .execute();
}
```

### Calculating Scores

```typescript
import { calculateGameScore } from '@/app/utils/game-score-calculator';

const score = calculateGameScore(
  { home: 2, away: 1 },  // guess
  { home: 2, away: 1 }   // actual
);
// Returns points based on accuracy
```

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

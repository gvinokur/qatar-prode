# Architecture Guide

## Stack Overview

- **Framework**: Next.js 15.3 with App Router (Server Components by default)
- **Database**: PostgreSQL with Kysely ORM (`@vercel/postgres-kysely`)
- **Authentication**: NextAuth.js v5 (beta) with Credentials provider
- **UI**: Material-UI v7 with Emotion styling
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
data/                # Tournament data files (JSON)
```

## Key Architectural Patterns

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

// ❌ INCORRECT #2: Server Component imports Server Action that has repository imports
'use server'

import { getTournamentData } from './actions/tournament-actions'  // ERROR!

// If tournament-actions.ts has repository imports at module scope,
// this creates an import chain that pulls database.ts into the bundle

export default async function Page() {
  const data = await getTournamentData(id)  // Causes build error
  return <Component data={data} />
}
```

#### Data Fetching Rules

**Server Components (pages, layouts, templates marked `'use server'`)**:
- ✅ Import and call repositories DIRECTLY
- ✅ Fetch all data needed by child components
- ✅ Pass data down as props to Client Components
- ❌ NEVER import Server Actions that have repository imports at module scope

**Client Components (marked `'use client'`)**:
- ❌ NEVER import repositories or database functions
- ✅ Receive data as props from parent Server Component
- ✅ Call Server Actions for mutations (form submissions, button clicks)
- ✅ Call Server Actions for dynamic data fetching (if needed)

**Server Actions (files marked `'use server'`)**:
- ✅ Can import and call repositories
- ✅ Used by Client Components for mutations and dynamic updates
- ⚠️ WARNING: If a Server Component imports a Server Action file that has repository imports at the top level, it can cause build errors. Keep Server Actions for Client Component use only.

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

- Repositories use `database.ts` which creates a Postgres connection at module load time
- If a Server Component imports a Server Action, and that Server Action imports a repository, the entire import chain (including database.ts) gets bundled
- This causes `database.ts` to execute during build, before DATABASE_URL is available
- Result: Build fails with "missing_connection_string" error
- Solution: Server Components call repositories directly, not through Server Actions

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

## Database Schema

18+ PostgreSQL tables organized by domain:

**Core entities**: `users`, `tournaments`, `teams`, `players`, `games`

**Tournament structure**:
- `tournament_groups` + `tournament_group_teams` + `tournament_group_games`
- `tournament_playoff_rounds` + `tournament_playoff_round_games`

**Predictions**:
- `game_guesses` (individual game predictions)
- `game_results` (actual outcomes)
- `tournament_guesses` (tournament-level predictions: awards, final positions, maintains historical `group_position_score`)
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

## Progressive Web App

PWA configuration via Serwist (`@serwist/next`):
- Service worker in `app/service-worker.ts`
- Manifest in `app/manifest.json`
- Offline fallback page: `/offline`
- Push notifications using Web Push API

Install prompt component: `app/components/Install-pwa.tsx`

## Common Patterns

### Fetching Data in Server Components

```typescript
import { getTournaments } from '@/app/actions/tournament-actions';

export default async function Page() {
  const tournaments = await getTournaments();
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
- Tournament data is stored in `data/` as JSON files for seeding
- Database migrations are in `migrations/` directory (manual execution required)
- SonarCloud integration runs automatically on push/PR via GitHub Actions

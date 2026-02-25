# Core Architectural Patterns

This guide covers the fundamental patterns that define how the qatar-prode application is structured.

## Table of Contents
- [Server Actions Pattern](#server-actions-pattern)
- [Client/Server Component Boundaries](#clientserver-component-boundaries-critical)
- [Repository Pattern](#repository-pattern)
- [Type-Safe Database Queries](#type-safe-database-queries)
- [Common Patterns](#common-patterns)

## Server Actions Pattern

All business logic lives in `app/actions/*.ts` files marked with `'use server'`:
- `tournament-actions.ts` - Tournament data, groups, playoffs
- `prode-group-actions.ts` - Friend groups and participation
- `game-actions.ts` - Game operations and updates
- `guesses-actions.ts` - User predictions
- `user-actions.ts` - User profiles and auth

Server Actions are imported directly into Client Components for mutations.

## Client/Server Component Boundaries (CRITICAL)

**The Golden Rule:** Server Components import repositories directly. Client Components receive data as props OR call Server Actions for mutations.

### CORRECT Pattern for Data Fetching

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

### INCORRECT Patterns (cause build errors)

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

### Data Fetching Rules

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

### Example: Proper Data Flow

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

### Why This Matters

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

## Repository Pattern

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

## Type-Safe Database Queries

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

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # Start development server with experimental HTTPS (https://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
```

### Testing
```bash
npm run test             # Run all tests (Vitest)
npm run test:watch       # Run tests in watch mode
npm run coverage         # Generate test coverage report

# Run a single test file
npx vitest run __tests__/path/to/test-file.test.ts

# Run tests matching a pattern
npx vitest run --reporter=verbose -t "test name pattern"
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run sonar            # Run SonarCloud analysis
npm run sonar:check      # Check SonarCloud quality gate status
```

### Git Hooks
Husky and lint-staged are configured to:
- Run tests for modified test files
- Run linting for modified app files

## Architecture

### Stack Overview
- **Framework**: Next.js 15.3 with App Router (Server Components by default)
- **Database**: PostgreSQL with Kysely ORM (`@vercel/postgres-kysely`)
- **Authentication**: NextAuth.js v5 (beta) with Credentials provider
- **UI**: Material-UI v7 with Emotion styling
- **Testing**: Vitest 3.2 (primary), Jest 29.7 (legacy integration tests)
- **PWA**: Serwist for service workers and offline support

### Project Structure

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

### Key Architectural Patterns

#### Server Actions Pattern
All business logic lives in `app/actions/*.ts` files marked with `'use server'`:
- `tournament-actions.ts` - Tournament data, groups, playoffs
- `prode-group-actions.ts` - Friend groups and participation
- `game-actions.ts` - Game operations and updates
- `guesses-actions.ts` - User predictions
- `user-actions.ts` - User profiles and auth

Server Actions are imported directly into Client Components for mutations.

#### Client/Server Component Boundaries (CRITICAL)

**NEVER import database repositories directly in Client Components or pages that render Client Components.** This causes build errors and violates Next.js architecture.

**CORRECT Pattern for Data Fetching:**

```typescript
// ✅ CORRECT: Server Component fetches data and passes as props
// app/tournaments/[id]/page.tsx
'use server'

import { findTournamentById } from '../../db/tournament-repository'
import TournamentView from '../../components/tournament-view'

export default async function TournamentPage({ params }: Props) {
  const tournament = await findTournamentById(params.id)

  return <TournamentView tournament={tournament} />
}

// ✅ CORRECT: Client Component receives data as props
// app/components/tournament-view.tsx
'use client'

import { Tournament } from '../db/tables-definition'

export default function TournamentView({ tournament }: { tournament: Tournament }) {
  // Use tournament data in client component
  return <div>{tournament.name}</div>
}
```

**INCORRECT Pattern (causes build errors):**

```typescript
// ❌ INCORRECT: Client Component imports repository
'use client'

import { findTournamentById } from '../db/tournament-repository'  // ERROR!

export default function TournamentView({ tournamentId }: Props) {
  const [tournament, setTournament] = useState(null)

  useEffect(() => {
    // This will fail at build time
    findTournamentById(tournamentId).then(setTournament)
  }, [tournamentId])
}
```

**Data Fetching Rules:**

1. **Server Components (default)**: Can directly import and call repositories
   - Use for pages (`page.tsx`)
   - Fetch all data needed by child components
   - Pass data down as props to Client Components

2. **Client Components (`'use client'`)**:
   - NEVER import repositories or database functions
   - For data fetching: Use Server Actions (from `app/actions/*.ts`)
   - For initial data: Receive as props from parent Server Component
   - For mutations: Call Server Actions

3. **Server Actions (`'use server'`)**:
   - Can import and call repositories
   - Used by Client Components for mutations and dynamic data fetching
   - Example: Form submissions, button clicks, real-time updates

**Example: Proper Data Flow**

```typescript
// Server Component (page.tsx) - Fetches initial data
'use server'
import { getTournamentData } from '@/app/actions/tournament-actions'

export default async function Page() {
  const data = await getTournamentData(id)
  return <ClientComponent initialData={data} />
}

// Server Action - Wraps repository for client access
'use server'
export async function getTournamentData(id: string) {
  return findTournamentById(id)  // ✅ OK in Server Action
}

// Client Component - Uses Server Action for updates
'use client'
export default function ClientComponent({ initialData }) {
  const [data, setData] = useState(initialData)

  async function handleUpdate() {
    const updated = await updateTournamentAction(data)  // ✅ OK
    setData(updated)
  }
}
```

**Why This Matters:**
- Repositories use database connections that only work server-side
- Client Components run in the browser (no database access)
- Mixing them causes build failures and runtime errors
- Server Actions bridge the gap safely

#### Repository Pattern
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

#### Type-Safe Database Queries
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

### Component Organization

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

### Database Schema

18+ PostgreSQL tables organized by domain:

**Core entities**: `users`, `tournaments`, `teams`, `players`, `games`

**Tournament structure**:
- `tournament_groups` + `tournament_group_teams` + `tournament_group_games`
- `tournament_playoff_rounds` + `tournament_playoff_round_games`

**Predictions**:
- `game_guesses` (individual game predictions)
- `game_results` (actual outcomes)
- `tournament_guesses` (tournament-level predictions: awards, qualifiers)
- `tournament_group_team_stats_guess` (group position predictions)

**Social features**:
- `prode_groups` + `prode_group_participants`
- `prode_group_tournament_betting` + `prode_group_tournament_betting_payments`

### Authentication Flow

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

### Scoring System

Game prediction scoring logic in `app/utils/game-score-calculator.ts`:
- Exact score: Maximum points
- Correct winner + goal difference: Medium points
- Correct winner: Base points
- Penalties: Bonus points

Group standings calculated by `app/utils/group-position-calculator.ts`:
- Points, goal difference, goals scored, head-to-head

Award calculations in `app/utils/award-utils.ts`:
- Best player, top scorer, best goalkeeper, young player

### Testing Conventions

- **Test files**: `__tests__/` directory mirroring `app/` structure
- **Primary framework**: Vitest with `@testing-library/react`
- **Coverage target**: 60% minimum (enforced by SonarCloud)
- **Test types**:
  - Unit tests for utilities (calculators, formatters)
  - Component tests with `@testing-library/react`
  - Database integration tests (repositories)

Example test file structure:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

Mock AWS S3 with `aws-sdk-client-mock` when testing file uploads.

### Environment Variables

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

### Progressive Web App

PWA configuration via Serwist (`@serwist/next`):
- Service worker in `app/service-worker.ts`
- Manifest in `app/manifest.json`
- Offline fallback page: `/offline`
- Push notifications using Web Push API

Install prompt component: `app/components/Install-pwa.tsx`

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- No unused imports (enforced by `eslint-plugin-unused-imports`)

### Security
- Never commit `.env.local` or secrets
- Use Server Actions for all mutations
- Validate user input with Zod schemas
- Check authorization in Server Actions (verify `session?.user?.id`)

### Performance
- Use Server Components by default (faster initial load)
- Implement virtualization for long lists (`react-window`)
- Optimize images with Next.js `<Image>` component

### Code Quality Gates (SonarCloud)
- Code coverage: ≥60%
- Security rating: A
- Maintainability: B or higher
- Duplicated code: <5%

Pull requests must pass quality gate before merging.

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

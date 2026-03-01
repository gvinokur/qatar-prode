# Database Architecture

This guide covers the database schema and type-safe query patterns.

## Table of Contents
- [Database Schema](#database-schema)
- [Type-Safe Database Queries](#type-safe-database-queries)

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

## ⚠️ Known Limitations

### Transactions Not Supported

Kysely transactions (`db.transaction().execute(...)`) are **not supported** on Vercel Postgres (Neon pooler). Calling them throws:

```
VercelPostgresError - 'kysely_transactions_not_supported': Transactions are not supported yet.
```

**Workaround:** Run multiple operations sequentially without a transaction. Order them so the most critical operation goes first. If a later operation fails, the state is still partially consistent (the first operation persisted).

```typescript
// ❌ DO NOT USE — throws at runtime on Vercel Postgres
await db.transaction().execute(async (trx) => {
  await trx.updateTable('foo').set({ ... }).execute();
  await trx.updateTable('bar').set({ ... }).execute();
});

// ✅ CORRECT — sequential operations without transaction
await db.updateTable('foo').set({ ... }).execute();
await db.updateTable('bar').set({ ... }).execute();
```

### Example Query

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

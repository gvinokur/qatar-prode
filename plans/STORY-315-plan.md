# Story #315 — Rank Materialization Backend

## Story Context

**Epic:** #314 — Tournament Hub & Social Momentum
**Title:** [Story] Rank Materialization Backend
**Priority:** High | **Effort:** Medium

## Objective

Persist group rankings in the database so that rank data is available as a O(1) lookup
instead of being computed at runtime on every page load. Recalculation is triggered only
when an admin updates a match result or confirms a tournament milestone.

This story is the backend foundation required by:
- #319 Leaderboard Peek Widget (reads materialized ranks)
- #320 Migrate FE → Materialized Ranks (replaces frontend rank calculation)
- #321 Rank Change Notifications (reads previous_rank to detect changes)

## Acceptance Criteria

- [ ] New `group_rankings` table exists with columns: `user_id`, `group_id`, `tournament_id`, `current_rank`, `current_score`, `previous_rank`, `previous_score`, `updated_at`
- [ ] Rank recalculation is triggered after admin saves game results (`calculateGameScores`)
- [ ] Rank recalculation is triggered after admin confirms awards (`updateTournamentAwards`)
- [ ] Rank recalculation is triggered after admin confirms honor roll (`updateTournamentHonorRoll`)
- [ ] Rank recalculation is triggered after admin triggers qualified teams scoring (`calculateAndStoreQualifiedTeamsScores`)
- [ ] Recalculation is scoped per group (only groups containing affected tournament participants)
- [ ] `previous_rank` / `previous_score` snapshot the state before each recalculation
- [ ] Server Action exposing materialized rank data for a given user + group + tournament
- [ ] Existing frontend rank calculation is NOT removed (coexistence during transition)
- [ ] Unit tests cover recalculation logic and repository upsert behavior

## Out of Scope

- Removing the existing frontend rank calculation (Story #320)
- Rank change notifications (Story #321)
- Leaderboard widget UI (Story #319)
- Any API endpoint (pure Server Action approach)
- Cron-based recalculation (trigger-based only per story requirements)

---

## Technical Approach

### Database Schema

New table `group_rankings` — event-driven (not daily snapshots):

```sql
CREATE TABLE group_rankings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id        UUID NOT NULL REFERENCES prode_groups(id) ON DELETE CASCADE,
  tournament_id   UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  current_rank    INTEGER NOT NULL,
  current_score   INTEGER NOT NULL DEFAULT 0,
  previous_rank   INTEGER,           -- NULL on first calculation
  previous_score  INTEGER,           -- NULL on first calculation
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT group_rankings_unique UNIQUE (user_id, group_id, tournament_id)
);
CREATE INDEX idx_group_rankings_group_tournament ON group_rankings(group_id, tournament_id);
```

**Design decisions:**
- One row per (user, group, tournament) — not daily snapshots
- `previous_rank` / `previous_score` shift on each upsert (UPSERT shifts current → previous)
- `tournament_id` included because a user can be in the same group across different tournaments
- Differs from `tournament_score_history` (daily time-series) — this is a "current state" table

### Upsert Strategy

On each recalculation, the UPSERT shifts `current → previous` atomically:

```sql
INSERT INTO group_rankings (user_id, group_id, tournament_id, current_rank, current_score)
VALUES (...)
ON CONFLICT (user_id, group_id, tournament_id) DO UPDATE SET
  previous_rank  = group_rankings.current_rank,
  previous_score = group_rankings.current_score,
  current_rank   = EXCLUDED.current_rank,
  current_score  = EXCLUDED.current_score,
  updated_at     = NOW()
```

### Finding Groups for a Tournament

To scope recalculation to affected groups only (avoids global recomputation):

```sql
SELECT DISTINCT pg.id
FROM prode_groups pg
LEFT JOIN prode_group_participants pgp ON pgp.prode_group_id = pg.id
WHERE pg.owner_user_id IN (
  SELECT user_id FROM tournament_guesses WHERE tournament_id = $tournamentId
)
OR pgp.participant_id IN (
  SELECT user_id FROM tournament_guesses WHERE tournament_id = $tournamentId
)
```

This returns all groups that have at least one member who participated in the tournament.

### Trigger Integration Points

All four trigger points are in admin-only server actions:

| Trigger | File | When |
|---------|------|------|
| Game result saved | `backoffice-actions.ts` → `calculateGameScores()` | Admin publishes match scores |
| Individual awards | `backoffice-actions.ts` → `updateTournamentAwards()` | Admin sets award winners |
| Honor roll | `backoffice-actions.ts` → `updateTournamentHonorRoll()` | Admin sets champion/runner-up/3rd |
| Qualified teams | `qualified-teams-scoring-actions.ts` → `calculateAndStoreQualifiedTeamsScores()` | Admin confirms group positions |

Each trigger calls `recalculateGroupRankingsForTournament(tournamentId)` after its primary logic completes.

### Score Source

Reuses existing `getUserScoresForTournament(userIds, tournamentId)` from `prode-group-actions.ts` — the same aggregation function used today for runtime ranking. No new score logic needed.

---

## Files to Create / Modify

| File | Action | Description |
|------|--------|-------------|
| `migrations/20260408000000_create_group_rankings_table.sql` | **CREATE** | New table DDL |
| `app/db/tables-definition.ts` | **MODIFY** | Add `GroupRankingTable`, `GroupRanking`, `GroupRankingNew` types |
| `app/db/database.ts` | **MODIFY** | Register `group_rankings` in `Database` interface |
| `app/db/group-ranking-repository.ts` | **CREATE** | Upsert + query functions |
| `app/actions/group-ranking-actions.ts` | **CREATE** | Recalculation + read Server Action |
| `app/actions/backoffice-actions.ts` | **MODIFY** | Add trigger after calculateGameScores, updateTournamentAwards, updateTournamentHonorRoll |
| `app/actions/qualified-teams-scoring-actions.ts` | **MODIFY** | Add trigger after calculateAndStoreQualifiedTeamsScores |
| `docs/code-structure/db.md` | **MODIFY** | Document group-ranking-repository.ts |
| `docs/code-structure/actions.md` | **MODIFY** | Document group-ranking-actions.ts |
| `CODE-STRUCTURE.md` | **MODIFY** | Update call graph |
| `__tests__/group-ranking-repository.test.ts` | **CREATE** | Repository unit tests |
| `__tests__/group-ranking-actions.test.ts` | **CREATE** | Action unit tests |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 2 (Game scoring pipeline)** — extend `calculateGameScores` to call `recalculateGroupRankingsForTournament` after score materialization
- **Flow 15 (Backoffice game result editing)** — `saveGameResults` → `calculateGameScores` → `recalculateGroupRankingsForTournament`
- **New back-end triggers** — `updateTournamentAwards` and `updateTournamentHonorRoll` call `recalculateGroupRankingsForTournament`

**New flows:**
- **Flow 28 (Group rank materialization)** — admin action → `recalculateGroupRankingsForTournament` → `findGroupsForTournament` → per-group: `getUserScoresForTournament` + `calculateRanks` + `upsertGroupRankings`
- **Flow 29 (Materialized rank read)** — `getGroupRankingForUser(userId, groupId, tournamentId)` → `getGroupRankingByKey` → returns `MaterializedGroupRanking`

---

### `migrations/20260408000000_create_group_rankings_table.sql` *(new)*

Creates `group_rankings` table with unique constraint on `(user_id, group_id, tournament_id)` and index on `(group_id, tournament_id)`. No application code — SQL only.

---

### `app/db/tables-definition.ts` *(modified)*

**New types:**

```typescript
export interface GroupRankingTable {
  id: Generated<string>
  user_id: string
  group_id: string
  tournament_id: string
  current_rank: number
  current_score: number
  previous_rank: number | null
  previous_score: number | null
  updated_at: Generated<Date>
}

export type GroupRanking = Selectable<GroupRankingTable>
export type GroupRankingNew = Pick<
  Insertable<GroupRankingTable>,
  'user_id' | 'group_id' | 'tournament_id' | 'current_rank' | 'current_score'
>
```

---

### `app/db/group-ranking-repository.ts` *(new)*

**New functions:**

- **`upsertGroupRankings(rankings: GroupRankingNew[])`**: `Promise<GroupRanking[]>`
  Batch upsert rows. On conflict, shifts `current_rank → previous_rank`, `current_score → previous_score`, then writes new current values. Returns all upserted rows.
  Calls: db (Kysely `insertInto`, `onConflict`)
  Tests:
  - inserts new row with null previous_rank when no prior row exists
  - updates current_rank and shifts old current to previous on second call
  - handles empty array without error (returns `[]`)
  - upserts multiple users for the same group in one call
  - updates updated_at on each upsert

- **`getGroupRankings(groupId: string, tournamentId: string)`**: `Promise<GroupRanking[]>`
  Returns all ranking rows for a group in a tournament, ordered by `current_rank` ascending.
  Calls: db
  Tests:
  - returns empty array when no rows exist
  - returns rows ordered by current_rank ascending
  - does not return rows from a different group or tournament

- **`getGroupRankingByKey(userId: string, groupId: string, tournamentId: string)`**: `Promise<GroupRanking | undefined>`
  Returns a single ranking row for a specific user/group/tournament combination.
  Calls: db
  Tests:
  - returns undefined when no row exists
  - returns correct row for the given user/group/tournament key
  - does not return rows for other users in the same group

- **`findGroupsForTournament(tournamentId: string)`**: `Promise<{ id: string }[]>`
  Returns distinct group IDs where at least one member (owner or participant) has a `tournament_guesses` row for the given tournament.
  Calls: db
  Tests:
  - returns empty array when no groups have participants in tournament
  - returns group when owner is the tournament participant
  - returns group when participant (not owner) is in the tournament
  - does not return duplicate group IDs when multiple members participate

---

### `app/actions/group-ranking-actions.ts` *(new)*

**New functions:**

- **`recalculateGroupRankings(groupId: string, tournamentId: string)`**: `Promise<void>`
  Fetches all group members (owner + participants), computes scores via `getUserScoresForTournament`, ranks with `calculateRanks`, then upserts via `upsertGroupRankings`. No auth check — internal only (called from admin actions).
  Calls: findProdeGroupById, findParticipantsInGroup, getUserScoresForTournament, calculateRanks, upsertGroupRankings
  Tests:
  - does nothing if group has no tournament participants (scores all 0, but still upserts)
  - correctly ranks users by totalPoints descending
  - applies competition ranking (1-2-2-4 style) on tied scores
  - calls upsertGroupRankings with correct GroupRankingNew objects

- **`recalculateGroupRankingsForTournament(tournamentId: string)`**: `Promise<void>`
  Finds all groups with participants in the tournament via `findGroupsForTournament`, then calls `recalculateGroupRankings` for each group sequentially. No auth check — internal only. Each group call is wrapped in try/catch so a single failure does not abort others.
  Calls: findGroupsForTournament, recalculateGroupRankings
  Tests:
  - does nothing when no groups are found for the tournament
  - calls recalculateGroupRankings once per affected group
  - does not throw and continues processing other groups when one group's upsert fails; logs error

- **`getGroupRankingForUser(userId: string, groupId: string, tournamentId: string)`**: `Promise<MaterializedGroupRanking | null>`
  Server Action. Returns materialized rank data for a user in a group. Returns `null` if no materialized data exists yet (fallback to FE calculation is handled by the caller).
  Calls: getGroupRankingByKey
  Tests:
  - returns null when no materialized row exists
  - returns MaterializedGroupRanking with current and previous values when row exists
  - previous fields are null when it's the first calculation

**New type:**

```typescript
export interface MaterializedGroupRanking {
  userId: string
  groupId: string
  tournamentId: string
  currentRank: number
  currentScore: number
  previousRank: number | null
  previousScore: number | null
  rankChange: number | null  // currentRank - previousRank (negative = improved)
  updatedAt: Date
}
```

---

### `app/actions/backoffice-actions.ts` *(modified)*

**Changed functions:**

- **`calculateGameScores(forceDrafts: boolean, forceAllGuesses: boolean, locale: Locale)`** *(existing)*
  After the existing `recalculateGameScoresForUsers` calls at the end, add:
  ```typescript
  await Promise.all(
    Array.from(usersByTournament.keys()).map(tournamentId =>
      recalculateGroupRankingsForTournament(tournamentId)
    )
  );
  ```
  Tests: (existing tests unchanged; no new unit test needed here since it delegates)

- **`updateTournamentAwards(tournamentId, withUpdate, locale)`** *(existing)*
  After the final `Promise.all(allTournamentGuesses.map(...))` call, add:
  ```typescript
  await recalculateGroupRankingsForTournament(tournamentId);
  ```

- **`updateTournamentHonorRoll(tournamentId, withUpdate, locale)`** *(existing)*
  After the final `Promise.all(allTournamentGuesses.map(...))` call, add:
  ```typescript
  await recalculateGroupRankingsForTournament(tournamentId);
  ```

---

### `app/actions/qualified-teams-scoring-actions.ts` *(modified)*

**Changed functions:**

- **`calculateAndStoreQualifiedTeamsScores(tournamentId, locale)`** *(existing)*
  After all score snapshots are written, add:
  ```typescript
  await recalculateGroupRankingsForTournament(tournamentId);
  ```

---

## Testing Strategy

### Unit Tests (Vitest)

**`__tests__/group-ranking-repository.test.ts`**
- Mock `db` Kysely instance using `vi.mock('../app/db/database')` with `createMockSelectQuery()`
- Use `testFactories.user()`, `testFactories.prodeGroup()`, `testFactories.tournament()` for fixture data — no inline plain objects
- Test each repository function in isolation
- Cover: insert behavior, upsert shift logic, empty input handling, query filtering

**`__tests__/group-ranking-actions.test.ts`**
- Mock repository functions and `getUserScoresForTournament`, `calculateRanks` with `vi.mock`
- Use `testFactories.*` for user, group, and tournament fixtures
- Test: correct rank computation, tied score handling, empty group handling, null previous on first run
- Test `getGroupRankingForUser`: null return when no data, correct field mapping
- Test error isolation: mock one group's upsert to throw, verify other groups still processed

### Coverage Target
- `group-ranking-repository.ts`: ≥80% line coverage
- `group-ranking-actions.ts`: ≥80% line coverage

---

## Validation Considerations

- **SonarCloud:** 0 new issues; no unused imports; no `any` types
- **Migration:** Manual execution required — user must approve before running
- **No FE changes:** Existing `calculateTournamentGroupStats()` remains untouched; both paths coexist
- **Performance:** `findGroupsForTournament` uses a SQL query (not N+1 in-memory filtering)
- **Error isolation:** Each group recalculation in `recalculateGroupRankingsForTournament` is wrapped in try/catch so one failure doesn't abort others

---

## Open Questions

_None — all requirements are clear from the story and codebase exploration._

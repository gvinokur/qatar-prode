# Story #315 — Rank Materialization Backend

## Story Context

**Epic:** #314 — Tournament Hub & Social Momentum
**Title:** [Story] Rank Materialization Backend
**Priority:** High | **Effort:** Medium

## Objective

Persist group rankings in the database as daily snapshots so that rank data is available
as a fast DB query instead of being computed at runtime on every page load. Snapshots are
written whenever an admin action triggers a score update — not through a scheduled process.

This story is the backend foundation required by:
- #319 Leaderboard Peek Widget (reads latest snapshot)
- #320 Migrate FE → Materialized Ranks (replaces frontend rank calculation)
- #321 Rank Change Notifications (compares latest two snapshots to detect changes)

## Acceptance Criteria

- [ ] New `group_rankings` table exists with columns: `user_id`, `group_id`, `tournament_id`, `snapshot_date` (YYYYMMDD), `rank`, `score`
- [ ] Unique constraint on `(user_id, group_id, tournament_id, snapshot_date)` — same-day re-trigger overwrites
- [ ] Index on `(group_id, tournament_id)` for efficient group queries
- [ ] Index on `(group_id, tournament_id, snapshot_date)` for rank history chart queries
- [ ] Snapshot is written after admin saves game results (`calculateGameScores`)
- [ ] Snapshot is written after admin confirms awards (`updateTournamentAwards`)
- [ ] Snapshot is written after admin confirms honor roll (`updateTournamentHonorRoll`)
- [ ] Snapshot is written after admin triggers qualified teams scoring (`calculateAndStoreQualifiedTeamsScores`)
- [ ] Recalculation is scoped per group (only groups containing affected tournament participants)
- [ ] Server Action exposing latest materialized rank + rank change for a given user + group + tournament
- [ ] Rank change computed by comparing the two most recent snapshot dates for the user
- [ ] Existing frontend rank calculation is NOT removed (coexistence during transition)
- [ ] Unit tests cover recalculation logic and repository upsert behavior

## Out of Scope

- Removing the existing frontend rank calculation (Story #320)
- Rank change notifications (Story #321)
- Leaderboard widget UI (Story #319)
- Any API endpoint (pure Server Action approach)
- Scheduled/cron-based snapshot generation

---

## Technical Approach

### Database Schema

New table `group_rankings` — daily snapshot model, consistent with `tournament_score_history`:

```sql
CREATE TABLE group_rankings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id      UUID NOT NULL REFERENCES prode_groups(id) ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  snapshot_date INTEGER NOT NULL,   -- YYYYMMDD (Argentina TZ, via getTodayYYYYMMDD())
  rank          INTEGER NOT NULL,
  score         INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT group_rankings_unique UNIQUE (user_id, group_id, tournament_id, snapshot_date)
);
CREATE INDEX idx_group_rankings_group_tournament
  ON group_rankings(group_id, tournament_id);
CREATE INDEX idx_group_rankings_group_tournament_date
  ON group_rankings(group_id, tournament_id, snapshot_date);
```

**Design decisions:**
- `snapshot_date` integer (YYYYMMDD) matches the pattern in `tournament_score_history` and uses the same `getTodayYYYYMMDD()` utility
- `UNIQUE (user_id, group_id, tournament_id, snapshot_date)`: if admin triggers recalculation multiple times in one day, the second call overwrites the first (same-day idempotency)
- No `previous_rank` / `previous_score` columns — callers derive rank change from the two most recent snapshot dates
- `tournament_id` included because a user can be in the same group across different tournaments

### Upsert Strategy

```sql
INSERT INTO group_rankings (user_id, group_id, tournament_id, snapshot_date, rank, score)
VALUES (...)
ON CONFLICT (user_id, group_id, tournament_id, snapshot_date) DO UPDATE SET
  rank  = EXCLUDED.rank,
  score = EXCLUDED.score
```

Identical pattern to `writeScoreSnapshot` in `score-history-repository.ts` (last-write-wins within the same day).

### Rank Change Derivation

To compute the ↑↓ rank change indicator, fetch the two most recent distinct `snapshot_date` values for the user/group/tournament:

```sql
SELECT rank, score, snapshot_date
FROM group_rankings
WHERE user_id = $userId AND group_id = $groupId AND tournament_id = $tournamentId
ORDER BY snapshot_date DESC
LIMIT 2
```

`rows[0]` = current (latest), `rows[1]` = previous.
`rankChange = rows[1].rank - rows[0].rank` — **positive = improved** (e.g. 3→1 gives rankChange = +2), **negative = dropped**. Returns `null` when only one snapshot exists.

### Finding Groups for a Tournament

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

Returns all groups with at least one member who has participated in the tournament.

### Trigger Integration Points

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
| `app/db/tables-definition.ts` | **MODIFY** | Add `GroupRankingTable`, `GroupRanking`, `GroupRankingSnapshotNew` types |
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
- **New back-end triggers** — `updateTournamentAwards` and `updateTournamentHonorRoll` each call `recalculateGroupRankingsForTournament`

**New flows:**
- **Flow 28 (Group rank snapshot)** — admin action → `recalculateGroupRankingsForTournament` → `findGroupsForTournament` → per-group: `getUserScoresForTournament` + `calculateRanks` + `upsertGroupRankingSnapshots`
- **Flow 29 (Materialized rank read)** — `getGroupRankingForUser(userId, groupId, tournamentId)` → `getLatestTwoGroupRankingSnapshots` → derives `rankChange`, returns `MaterializedGroupRanking`

---

### `migrations/20260408000000_create_group_rankings_table.sql` *(new)*

Creates `group_rankings` table with unique constraint on `(user_id, group_id, tournament_id, snapshot_date)`, index on `(group_id, tournament_id)`, and index on `(group_id, tournament_id, snapshot_date)`. SQL only — no application code.

---

### `app/db/tables-definition.ts` *(modified)*

**New types:**

```typescript
export interface GroupRankingTable {
  id: Generated<string>
  user_id: string
  group_id: string
  tournament_id: string
  snapshot_date: number   // YYYYMMDD integer (Argentina TZ)
  rank: number
  score: number
  created_at: Generated<Date>
}

export type GroupRanking = Selectable<GroupRankingTable>
export type GroupRankingSnapshotNew = Pick<
  Insertable<GroupRankingTable>,
  'user_id' | 'group_id' | 'tournament_id' | 'snapshot_date' | 'rank' | 'score'
>
```

---

### `app/db/group-ranking-repository.ts` *(new)*

**New functions:**

- **`upsertGroupRankingSnapshots(snapshots: GroupRankingSnapshotNew[])`**: `Promise<GroupRanking[]>`
  Batch upserts snapshot rows. On conflict `(user_id, group_id, tournament_id, snapshot_date)`, overwrites `rank` and `score` (last-write-wins within same day). Returns all upserted rows. Mirrors `writeScoreSnapshot` pattern.
  Calls: db
  Tests:
  - inserts new row when no prior snapshot exists for that date
  - overwrites rank and score on same-day re-trigger (idempotent)
  - handles empty array without error (returns `[]`)
  - inserts multiple users for the same group in one call
  - does not overwrite rows from a different snapshot_date

- **`getGroupRankingSnapshots(groupId: string, tournamentId: string)`**: `Promise<GroupRanking[]>`
  Returns all snapshot rows for a group in a tournament, ordered by `snapshot_date` ascending. Used by the rank history chart.
  Calls: db
  Tests:
  - returns empty array when no snapshots exist
  - returns rows ordered by snapshot_date ascending
  - does not return rows from a different group or tournament

- **`getLatestTwoGroupRankingSnapshots(userId: string, groupId: string, tournamentId: string)`**: `Promise<GroupRanking[]>`
  Returns the two most recent snapshot rows for a specific user/group/tournament, ordered by `snapshot_date` descending. Returns 0, 1, or 2 rows depending on history length.
  Calls: db
  Tests:
  - returns empty array when no snapshots exist
  - returns one row when only one snapshot exists
  - returns two rows (most recent first) when multiple snapshots exist
  - does not return rows from other users in the same group

- **`findGroupsForTournament(tournamentId: string)`**: `Promise<{ id: string }[]>`
  Returns distinct group IDs where at least one member (owner or participant) has a `tournament_guesses` row for the given tournament.
  Calls: db
  Tests:
  - returns empty array when no groups have participants in tournament
  - returns group when owner is the tournament participant
  - returns group when a non-owner participant is in the tournament
  - does not return duplicate group IDs when multiple members participate

---

### `app/actions/group-ranking-actions.ts` *(new)*

**New types:**

```typescript
export interface MaterializedGroupRanking {
  userId: string
  groupId: string
  tournamentId: string
  currentRank: number
  currentScore: number
  snapshotDate: number        // YYYYMMDD of latest snapshot
  rankChange: number | null   // rows[1].rank - rows[0].rank: positive = improved (e.g. 3→1 = +2), negative = dropped; null when only one snapshot
  previousRank: number | null // null when only one snapshot exists
}
```

**New functions:**

- **`recalculateGroupRankings(groupId: string, tournamentId: string)`**: `Promise<void>`
  Fetches all group members (owner + participants), computes scores via `getUserScoresForTournament`, ranks with `calculateRanks`, then writes today's snapshots via `upsertGroupRankingSnapshots`. Date set via `getTodayYYYYMMDD()`. No auth check — internal only.
  Calls: findProdeGroupById, findParticipantsInGroup, getUserScoresForTournament, calculateRanks, upsertGroupRankingSnapshots, getTodayYYYYMMDD
  Tests:
  - upserts snapshots for all group members with correct rank and score
  - applies competition ranking (1-2-2-4 style) on tied scores
  - uses today's YYYYMMDD as snapshot_date
  - calls upsertGroupRankingSnapshots with correctly shaped GroupRankingSnapshotNew objects

- **`recalculateGroupRankingsForTournament(tournamentId: string)`**: `Promise<void>`
  Finds all groups with participants in the tournament via `findGroupsForTournament`, then calls `recalculateGroupRankings` for each group. Each group call is wrapped in try/catch so a single failure does not abort others.
  Calls: findGroupsForTournament, recalculateGroupRankings
  Tests:
  - does nothing when no groups are found for the tournament
  - calls recalculateGroupRankings once per affected group
  - does not throw and continues processing other groups when one group's upsert fails; logs error

- **`getGroupRankingForUser(userId: string, groupId: string, tournamentId: string)`**: `Promise<MaterializedGroupRanking | null>`
  Server Action. Fetches the two most recent snapshots via `getLatestTwoGroupRankingSnapshots`, derives `rankChange` from the delta, and returns a `MaterializedGroupRanking`. Returns `null` if no snapshots exist yet.
  Calls: getLatestTwoGroupRankingSnapshots
  Tests:
  - returns null when no snapshots exist
  - returns MaterializedGroupRanking with rankChange null when only one snapshot exists
  - correctly computes rankChange as previousRank minus currentRank (positive = improved)
  - returns latest snapshot values when two snapshots exist

---

### `app/actions/backoffice-actions.ts` *(modified)*

**Changed functions:**

- **`calculateGameScores(forceDrafts, forceAllGuesses, locale)`** *(existing)*
  After the existing `recalculateGameScoresForUsers` block, add:
  ```typescript
  await Promise.all(
    Array.from(usersByTournament.keys()).map(tournamentId =>
      recalculateGroupRankingsForTournament(tournamentId)
    )
  );
  ```
  Note: `usersByTournament` is already a `Map<string, Set<string>>` built in the function body (confirmed from code reading) — keys are tournament IDs, values are sets of affected user IDs. The call above safely iterates its keys.

- **`updateTournamentAwards(tournamentId, withUpdate, locale)`** *(existing)*
  After the final `Promise.all(allTournamentGuesses.map(...))` resolves, add:
  ```typescript
  await recalculateGroupRankingsForTournament(tournamentId);
  ```

- **`updateTournamentHonorRoll(tournamentId, withUpdate, locale)`** *(existing)*
  After the final `Promise.all(allTournamentGuesses.map(...))` resolves, add:
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
- Cover: same-day overwrite behavior, multi-user batch, date ordering, cross-group isolation

**`__tests__/group-ranking-actions.test.ts`**
- Mock repository functions and `getUserScoresForTournament`, `calculateRanks` with `vi.mock`
- Use `testFactories.*` for user, group, and tournament fixtures
- Cover: correct rank computation, tied score handling, rankChange derivation, null when single snapshot
- Test error isolation: mock one group's upsert to throw, verify other groups still processed

### Coverage Target
- `group-ranking-repository.ts`: ≥80% line coverage
- `group-ranking-actions.ts`: ≥80% line coverage

---

## Validation Considerations

- **SonarCloud:** 0 new issues; no unused imports; no `any` types
- **Migration:** Manual execution required — user must approve before running
- **No FE changes:** Existing `calculateTournamentGroupStats()` remains untouched; both paths coexist
- **Performance:** `findGroupsForTournament` uses a single SQL query (not N+1 in-memory filtering)
- **Error isolation:** Each group in `recalculateGroupRankingsForTournament` is wrapped in try/catch so one failure doesn't abort others
- **Same-day idempotency:** Re-triggering admin actions multiple times on the same day safely overwrites the existing snapshot

---

## Open Questions

_None._

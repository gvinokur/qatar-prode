# Plan: Story #272 — Score History Infrastructure + Rank Graph UI

## Context

The current system only stores a single "yesterday" snapshot per user in `tournament_guesses`. There is no historical record of rank or score progression across tournament days, making it impossible to show rank trajectories or power time-based badges (Story C depends on this). This story introduces a `tournament_score_history` table for persistent daily snapshots and a new History tab in the leaderboard with two overlaid line charts: total points over time and rank over time.

---

## Worktree Setup

Before coding:
```bash
./scripts/github-projects-helper story start 272 --project 1
```
Sets `WORKTREE_PATH=/Users/gvinokur/Personal/qatar-prode-story-272`

---

## 1. Migration

**New file:** `migrations/20260312000000_create_score_history_table.sql`

```sql
CREATE TABLE tournament_score_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  tournament_id   TEXT NOT NULL,
  snapshot_date   INTEGER NOT NULL,  -- YYYYMMDD (Argentina TZ, matches existing convention)
  total_game_score         INTEGER NOT NULL DEFAULT 0,
  total_boost_bonus        INTEGER NOT NULL DEFAULT 0,
  honor_roll_score         INTEGER NOT NULL DEFAULT 0,
  individual_awards_score  INTEGER NOT NULL DEFAULT 0,
  qualified_teams_score    INTEGER NOT NULL DEFAULT 0,
  group_position_score     INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER GENERATED ALWAYS AS (
    total_game_score + total_boost_bonus + honor_roll_score +
    individual_awards_score + qualified_teams_score + group_position_score
  ) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT tournament_score_history_unique
    UNIQUE (user_id, tournament_id, snapshot_date),
  CONSTRAINT fk_score_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_score_history_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
);

CREATE INDEX idx_score_history_tournament_users
  ON tournament_score_history (tournament_id, user_id, snapshot_date ASC);
```

**Design decisions:**
- UNIQUE on `(user_id, tournament_id, snapshot_date)` → idempotent upsert; same-day recalculations overwrite with latest values
- Rank NOT stored — user can be in multiple groups; rank computed at read-time per group
- `total_points` GENERATED ALWAYS uses same formula as `tournament_guesses.total_points`; it is read-only and must be omitted from insert/update types
- `snapshot_date` INTEGER (YYYYMMDD) matches existing `last_score_update_date` convention; `getTodayYYYYMMDD()` already exists in `app/utils/date-utils.ts`
- `ON DELETE CASCADE` on `user_id` → if a user is deleted, their history is removed (intentional; avoids orphaned chart data)
- No backfill for Copa America; known limitation: groups running mid-FIFA-2026 will have partial history from migration date onward

---

## 2. Files to Create / Modify

### New Files
| File | Purpose |
|------|---------|
| `migrations/20260312000000_create_score_history_table.sql` | DB migration |
| `app/db/score-history-repository.ts` | DB layer (4 functions) |
| `app/actions/score-history-actions.ts` | Server Action — fetches history data (called from Server Component) |
| `app/components/leaderboard/HistoryTab.tsx` | History tab wrapper |
| `app/components/leaderboard/ScoreHistoryChart.tsx` | Total points line chart |
| `app/components/leaderboard/RankHistoryChart.tsx` | Rank line chart (inverted Y-axis) |

### Modified Files
| File | Change |
|------|--------|
| `app/db/tables-definition.ts` | Add `TournamentScoreHistoryTable` interface |
| `app/db/database.ts` | Register `tournament_score_history` in `Database` |
| `app/db/score-history-repository.ts` | *(new)* |
| `app/db/game-repository.ts` | Add `findLastGameInTournament` |
| `app/db/tournament-guess-repository.ts` | Call `writeScoreSnapshot` inside `recalculateGameScoresForUsers` loop |
| `app/actions/backoffice-actions.ts` | Call `writeScoreSnapshot` after `updateTournamentGuessWithSnapshot` at lines ~580, ~617 |
| `app/components/leaderboard/LeaderboardView.tsx` | Add Standings/History tab switcher; accept `historyData` prop |
| `app/components/leaderboard/types.ts` | Add `historyData?: ScoreHistoryResult` to `LeaderboardViewProps`; add history data types |
| `app/components/friend-groups/friends-group-table.tsx` | Accept `historyByTournament` prop; pass per-tournament `historyData` to `LeaderboardView` |
| `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` | Call `getScoreHistoryForGroup` per tournament; pass to `ProdeGroupTable` |
| `app/[locale]/friend-groups/[id]/page.tsx` | Same — call `getScoreHistoryForGroup` per tournament; pass to `ProdeGroupTable` |
| `locales/en/groups.json` + `locales/es/groups.json` | Add `history` translation keys |
| `package.json` | Add `recharts` |
| `docs/code-structure/db.md`, `actions.md`, `components-leaderboard-stats.md`, `components-friend-groups.md` | Update per CODE-STRUCTURE rules |
| `CODE-STRUCTURE.md` Call Graph | Add flow 5b (history), extend flow 2 |

---

## 3. Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 5 (Group stats / leaderboard)** — extend `LeaderboardView` to add Standings/History tabs; history data loaded in Server Component via `getScoreHistoryForGroup`, passed down as props
- **Flow 2 (Game scoring pipeline)** — extend `recalculateGameScoresForUsers` to call `writeScoreSnapshot` inside its user loop after materialization

**New flows:**
- **Flow 5b (Score history — server-loaded):**
  `TournamentScopedFriendGroup (Server) → getScoreHistoryForGroup [server action]`
  `→ findParticipantsInGroup + getScoreHistoryForUsers + findFirstGameInTournament + findLastGameInTournament`
  `→ ProdeGroupTable → LeaderboardView → HistoryTab [Client, presentational]`
  `→ ScoreHistoryChart [renders], RankHistoryChart [renders]`
- **Score write path:** `updateTournamentAwards / updateTournamentHonorRoll → updateTournamentGuessWithSnapshot → writeScoreSnapshot (NEW)`

---

### `app/db/tables-definition.ts` *(modified)*

New types (add after existing tournament_guesses types):
```typescript
export interface TournamentScoreHistoryTable {
  id: Generated<string>
  user_id: string
  tournament_id: string
  snapshot_date: number        // YYYYMMDD integer
  total_game_score: number
  total_boost_bonus: number
  honor_roll_score: number
  individual_awards_score: number
  qualified_teams_score: number
  group_position_score: number
  total_points: GeneratedAlways<number>  // read-only; omit from inserts
  created_at: Generated<Date>
}

export type TournamentScoreHistory = Selectable<TournamentScoreHistoryTable>
// Omit total_points (GENERATED ALWAYS) so Kysely/TypeScript prevents accidentally setting it
export type TournamentScoreHistoryNew = Omit<
  Insertable<TournamentScoreHistoryTable>,
  'id' | 'total_points' | 'created_at'
>
```

---

### `app/db/score-history-repository.ts` *(new)*

- **`writeScoreSnapshot(snapshot: TournamentScoreHistoryNew): Promise<TournamentScoreHistory>`**
  Upsert one daily snapshot. `ON CONFLICT ON CONSTRAINT tournament_score_history_unique DO UPDATE SET total_game_score = EXCLUDED.total_game_score, total_boost_bonus = EXCLUDED.total_boost_bonus, honor_roll_score = EXCLUDED.honor_roll_score, individual_awards_score = EXCLUDED.individual_awards_score, qualified_teams_score = EXCLUDED.qualified_teams_score, group_position_score = EXCLUDED.group_position_score`.
  Note: `total_points` is excluded from insert/update (GENERATED ALWAYS). Conflict target uses constraint name explicitly.
  Tests:
  - First write for new user+tournament+date creates row
  - Second write same date updates ALL score fields (upsert, last-write-wins)
  - Different date creates separate row (no conflict)

  _Note: `writeScoreSnapshots` (batch variant) is intentionally NOT included — `recalculateGameScoresForUsers` already iterates per-user and calling `writeScoreSnapshot` per user in that loop is correct. A batch function would be dead code._

- **`getScoreHistoryForUsers(userIds: string[], tournamentId: string): Promise<TournamentScoreHistory[]>`**
  Fetch all history rows for given users in tournament, ordered by `snapshot_date` ASC.
  Tests:
  - Returns empty array when no history exists
  - Returns rows for all matching users sorted by date
  - Does not return rows for a different tournament

### `app/db/game-repository.ts` *(modified)*

- **`findLastGameInTournament(tournamentId: string): Promise<Game | undefined>`**
  Companion to existing `findFirstGameInTournament` (same cache + signature pattern). Direct DB query — no project-level function calls.
  ```typescript
  export const findLastGameInTournament = cache(async (tournamentId: string) => {
    return db.selectFrom('games')
      .selectAll()
      .where('tournament_id', '=', tournamentId)
      .orderBy('game_date', 'desc')
      .executeTakeFirst()
  })
  ```
  `getScoreHistoryForGroup` converts `undefined` → `tournamentEndDate: null`.
  Tests:
  - Returns game with latest `game_date` when multiple games exist
  - Returns `undefined` for tournament with no games yet
  - Does not return games from a different tournament (scoped by `tournament_id`)

---

### `app/actions/score-history-actions.ts` *(new)*

```typescript
export interface ScoreHistoryDataPoint {
  date: number       // YYYYMMDD integer (same convention as snapshot_date)
  totalPoints: number
  rank: number       // Competition ranking (1224 style) relative to this group on this date
}

export interface UserScoreHistory {
  userId: string
  displayName: string
  data: ScoreHistoryDataPoint[]   // Only dates where this user has a snapshot (sparse OK)
}

export interface ScoreHistoryResult {
  userHistories: UserScoreHistory[]
  tournamentStartDate: number | null  // YYYYMMDD of first game; null if no games exist yet
  tournamentEndDate: number | null    // YYYYMMDD of last game; null if tournament has no games
  isEmpty: boolean                    // true when userHistories is empty (no snapshots at all)
}

getScoreHistoryForGroup(groupId: string, tournamentId: string): Promise<ScoreHistoryResult>
```

Calls: `findParticipantsInGroup` (resolves current group member IDs), `findUsersByIds` (display names), `getScoreHistoryForUsers` (raw snapshots), `findFirstGameInTournament` *(existing, game-repository.ts line 114)*, `findLastGameInTournament` *(new)*

Internal: compute per-date ranks using **1224 competition ranking** (same logic as `calculateRanks` util in `app/utils/rank-calculator.ts` — ties get same rank, next rank skips).

**X-axis generation:** X-axis spans `tournamentStartDate → tournamentEndDate` using the full tournament game date range. Ticks are generated from this range (not from snapshot dates only), so future dates show as empty space. Converting YYYYMMDD integer → `Date` for display: `new Date(Math.floor(d/10000), Math.floor((d%10000)/100)-1, d%100)`.

**Sparse history handling:** A user who has no snapshot on a given date is excluded from that date's rank calculation entirely. Their chart line has no data point for that date (recharts renders a gap with `connectNulls={false}`). This avoids interpolating misleading ranks.

Tests:
- Returns `isEmpty: true` and empty `userHistories` when no history exists
- Assigns rank 1 to higher-score user, rank 2 to lower on same date
- Ties: two users same score → both rank 1, next user rank 3 (competition ranking)
- User with no snapshot on a date is excluded from that date's data (sparse history)
- `tournamentStartDate` populated from `findFirstGameInTournament` return value
- `isEmpty: false` when at least one snapshot exists even if only one user has data

---

### `app/db/tournament-guess-repository.ts` *(modified)*

**Changed function: `recalculateGameScoresForUsers`**

`recalculateGameScoresForUsers` already fetches the `existing` row from `tournament_guesses` at the start of each user's iteration (to calculate delta updates). After writing the materialized scores, call `writeScoreSnapshot` using:
- Game score fields (`total_game_score`, `total_boost_bonus`) from the computed `updates` object
- Award score fields (`honor_roll_score`, `individual_awards_score`, `qualified_teams_score`, `group_position_score`) from the **already-fetched `existing` row** — no additional DB read needed

```typescript
await writeScoreSnapshot({
  user_id: userId,
  tournament_id: tournamentId,
  snapshot_date: getTodayYYYYMMDD(),
  total_game_score: updates.total_game_score ?? 0,
  total_boost_bonus: updates.total_boost_bonus ?? 0,
  honor_roll_score: existing.honor_roll_score ?? 0,              // from pre-fetched existing row
  individual_awards_score: existing.individual_awards_score ?? 0,
  qualified_teams_score: existing.qualified_teams_score ?? 0,
  group_position_score: existing.group_position_score ?? 0,
})
```

**No race condition risk:** `recalculateGameScoresForUsers` is called per-tournament after game scoring. Award score fields are only mutated by separate admin backoffice actions (not the same function). The `existing` row is fetched at the top of the same iteration loop, so it is always consistent with the current award scores at that moment.

**`snapshot_date` must always use `getTodayYYYYMMDD()`** (Argentina timezone, from `app/utils/date-utils.ts`) — all three write hooks must use this utility. Using UTC `new Date()` would produce a different date value and break daily idempotency near midnight.

Tests (extend existing test file):
- `writeScoreSnapshot` is called with correct `total_game_score` after materialization
- Snapshot includes existing award scores from pre-fetched DB row (not from updates object)
- `writeScoreSnapshot` receives `snapshot_date = getTodayYYYYMMDD()` (not a historical date)

---

### `app/actions/backoffice-actions.ts` *(modified)*

After `updateTournamentGuessWithSnapshot` in both `updateTournamentAwards` (~line 580) and `updateTournamentHonorRoll` (~line 617), call `writeScoreSnapshot` with all 6 scoring segments from the returned updated guess. Coerce NULL → 0 for any field (same as `recalculateGameScoresForUsers` pattern: `updatedGuess.total_game_score ?? 0`). Use `getTodayYYYYMMDD()` for `snapshot_date`.

---

### Data loading: Server Component (architectural decision)

**Per PR feedback:** History data is loaded in the **Server Component** (friend group page), not lazily in the client. Rationale: badge calculations (Story C) will also need this data on the same page, so fetching server-side avoids a redundant client-side fetch later.

**Data flow:**
```
TournamentScopedFriendGroup (Server)
  ├── getScoreHistoryForGroup(groupId, tournamentId)  ← NEW call, per active tournament
  └── ProdeGroupTable [renders]
        └── LeaderboardView [renders]   ← receives historyData as prop
              └── HistoryTab [renders]  ← pure presentational, no fetch
```

**`ProdeGroupTable`** gains a new prop: `historyByTournament: { [tournamentId: string]: ScoreHistoryResult }`. For each tournament tab, it passes `historyByTournament[tournament.id]` to `LeaderboardView`.

**`LeaderboardViewProps`** gains: `historyData?: ScoreHistoryResult`

---

### `app/components/leaderboard/LeaderboardView.tsx` *(modified)*

Add MUI `TabContext / TabList / TabPanel` (same pattern as `ProdeGroupTable`). Default: "Standings" tab. "History" tab renders `<HistoryTab historyData={historyData} />` — data pre-loaded, no client fetch.

**Call site audit:** Only rendered from `friends-group-table.tsx`. `historyData?: ScoreHistoryResult` is optional for backward safety.

Tests:
- Default tab is Standings (LeaderboardCards visible)
- Clicking History tab renders HistoryTab with pre-loaded data
- When `historyData` is undefined, History tab renders empty state

**`recharts`:** Not currently installed. Install with `npm install recharts`. Bundle size ~200kB gzipped — acceptable.

---

### `app/components/leaderboard/HistoryTab.tsx` *(new)*

```typescript
interface HistoryTabProps { historyData?: ScoreHistoryResult }
```

Pure presentational — no data fetching. Renders immediately from props. If `historyData` is undefined or `isEmpty`: shows "no history" message. If data: renders `ScoreHistoryChart` + `RankHistoryChart`. Tab state owned by `LeaderboardView`.

Tests:
- Shows empty state when `historyData` is undefined
- Shows empty state when `historyData.isEmpty` is true
- Shows "not started" message when `tournamentStartDate` is null
- Renders both `ScoreHistoryChart` and `RankHistoryChart` when history data is available

---

### Chart Components

```typescript
// ScoreHistoryChart props
interface ScoreHistoryChartProps {
  userHistories: { userId: string; displayName: string; data: { date: number; totalPoints: number }[] }[]
  currentUserId: string
  startDate: number    // YYYYMMDD — X-axis left bound
  endDate: number      // YYYYMMDD — X-axis right bound
  themeColor?: string
}

// RankHistoryChart props
interface RankHistoryChartProps {
  userHistories: { userId: string; displayName: string; data: { date: number; rank: number }[] }[]
  currentUserId: string
  startDate: number
  endDate: number
  totalUsers: number   // Y-axis domain max = totalUsers
  themeColor?: string
}
```

**`ScoreHistoryChart`** — `recharts` `ResponsiveContainer` + `LineChart`
- X-axis: dates from `startDate` → `endDate`, tick format `DD MMM` (convert YYYYMMDD → Date for formatting)
- Y-axis: total points, auto-domain
- One `Line` per user; current user: `strokeWidth={3}` + `stroke={themeColor}`; others: `strokeWidth={2}`
- `connectNulls={false}` → gaps for dates with no snapshot (sparse)
- `Tooltip` + `Legend`

**`RankHistoryChart`** — same as above but:
- Y-axis: `domain={[1, totalUsers]}`, `reversed={true}` (rank #1 at visual top)
- Y-axis tick formatter: `(v) => '#' + v`

Tests for `ScoreHistoryChart`:
- Renders without crash with 1 user, 1 data point
- Renders N Line elements for N users
- Current user's line uses `themeColor`

Tests for `RankHistoryChart`:
- Renders without crash with 1 user, 1 rank data point
- Y-axis domain reflects `totalUsers` prop
- Current user's line is highlighted

---

## 4. Visual Prototype

### History Tab — Active Tournament

```
┌─────────────────────────────────────────────────────────┐
│  [ Standings ]  [ History ]                             │
│  ─────────────────────────                              │
│                                                         │
│  Total Points Over Time                                 │
│  pts                                                    │
│  100 │                              ── ─────── ● You   │
│   80 │                   ─────────/            ─ Alice  │
│   60 │─────────────── ──/         ─ Bob                 │
│   20 │                                                  │
│    0 └────┬────┬────┬────┬────┬────┬────┬────┬──── date│
│          Jun  Jun  Jul  Jul  Jul  Aug  Aug  Sep          │
│                                                         │
│  Rank Over Time                                         │
│  #1  │─────────────────────────────────────── ● You    │
│  #2  │                   ─────────────────── ─ Alice   │
│  #3  │─────────────────/                     ─ Bob     │
│       └────┬────┬────┬────┬────┬────┬────┬────┬── date │
└─────────────────────────────────────────────────────────┘
```

### History Tab — No History Yet

```
┌─────────────────────────────────────────────────────────┐
│  [ Standings ]  [ History ]                             │
│                 ───────────                             │
│                                                         │
│         📊  No history yet                              │
│         Score history will appear once the tournament   │
│         starts and scores are calculated.               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 5. i18n Keys

Add under `groups.history` in both `locales/en/groups.json` and `locales/es/groups.json`:

```json
"history": {
  "tabLabel": "History",                    // "Historial"
  "standingsTabLabel": "Standings",         // "Clasificación"
  "totalPointsChartTitle": "Total Points Over Time",  // "Puntos totales en el tiempo"
  "rankChartTitle": "Rank Over Time",       // "Posición en el tiempo"
  "noHistory": "No history yet",            // "Sin historial"
  "noHistoryDescription": "Score history will appear once the tournament starts."
}
```

---

## 6. Edge Cases

- **Tournament not started / no snapshots**: `isEmpty: true`, show message (no chart)
- **Tournament ended**: X-axis ends at `findLastGameInTournament` date; chart freezes at last snapshot
- **User joined mid-tournament**: Their line starts from first snapshot date
- **Solo group**: Rank always #1; flat rank line
- **Tie on same date**: Competition ranking (1-1-3 pattern)
- **User removed from group**: Excluded from chart (only current members shown)

---

## 7. Testing Strategy

**Unit tests (parallel creation):**
- `__tests__/db/score-history-repository.test.ts` — all 4 repo functions
- `__tests__/actions/score-history-actions.test.ts` — `getScoreHistoryForGroup` (rank calculation, empty state)
- `__tests__/components/leaderboard/HistoryTab.test.tsx` — mount, loading, empty, with data
- Extend `__tests__/db/tournament-guess-repository.test.ts` — verify snapshot write-through in `recalculateGameScoresForUsers`
- Extend `__tests__/db/game-repository.test.ts` — `findLastGameInTournament`

**Test utilities:** `renderWithProviders`, `createMockSelectQuery`, `testFactories.*`

**Coverage target:** ≥ 80% on all new files

---

## 8. Implementation Tasks (Waves)

**Wave 1 — DB Foundation**
1. Migration SQL + `TournamentScoreHistoryTable` type + `database.ts` registration
2. `score-history-repository.ts` (4 functions)
3. `findLastGameInTournament` in `game-repository.ts`

**Wave 2 — Score Write Path**
4. Hook `writeScoreSnapshot` into `recalculateGameScoresForUsers`
5. Hook `writeScoreSnapshot` into `updateTournamentAwards` + `updateTournamentHonorRoll`

**Wave 3 — Read Path**
6. `score-history-actions.ts` — `getScoreHistoryForGroup`

**Wave 4 — UI**
7. `npm install recharts` (new production dependency, ~200kB gzipped). Add `historyData?: ScoreHistoryResult` to `LeaderboardViewProps` + `historyByTournament` to `ProdeGroupTable` props. Update both friend group page Server Components to call `getScoreHistoryForGroup` per tournament and pass results down.
8. `ScoreHistoryChart.tsx` + `RankHistoryChart.tsx`
9. `HistoryTab.tsx`
10. Modify `LeaderboardView.tsx` to add Standings/History tabs
11. Add i18n keys (en + es)

**Wave 5 — Tests (parallel)**
12a. DB repository tests
12b. Server Action tests
12c. Component tests
12d. Integration: snapshot write-through

**Per-task CODE-STRUCTURE updates** (same commit as code):
- Wave 1: `docs/code-structure/db.md`
- Wave 2: `docs/code-structure/db.md` + `actions.md` + call graph in `CODE-STRUCTURE.md`
- Wave 3: `docs/code-structure/actions.md` + call graph
- Wave 4: `docs/code-structure/components-leaderboard-stats.md` + `components-friend-groups.md`

---

## 9. Verification

1. Run migration on dev DB
2. Publish a game result via backoffice → verify row appears in `tournament_score_history`
3. Update honor roll via backoffice → verify snapshot updated
4. Navigate to a friend group leaderboard → click "History" tab → charts render
5. Check Vercel Preview: charts visible, rank #1 at top, X-axis spans full tournament
6. Run `npm test` (≥ 80% coverage new code), `npm run lint`, `npm run build` — all green

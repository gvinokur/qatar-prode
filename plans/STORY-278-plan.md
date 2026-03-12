# Plan: Story #278 — Remove Yesterday-Score Database Columns

## Context

Story #283 (stop writing to yesterday-score columns) was merged 2026-03-12 and confirmed CLOSED.
The four `yesterday_*` / `last_score_update_date` columns in `tournament_guesses` are now dead: nothing
reads them (removed in Story #277) and nothing writes them (removed in Story #283). This story
removes the columns themselves plus all remaining TypeScript type definitions and test references.

**Pre-condition confirmed:** Story #283 is live — safe to proceed.

---

## Files to Change

| File | Change |
|------|--------|
| `migrations/[timestamp]_drop_yesterday_score_columns.sql` | **CREATE** — drops 4 columns |
| `app/db/tables-definition.ts` | **MODIFY** — remove 4 field definitions + JSDoc |
| `__tests__/db/tournament-guess-repository.test.ts` | **MODIFY** — remove stale mock data + one test |
| `app/__tests__/components/tournament-page/user-tournament-statistics.test.tsx` | **MODIFY** — remove stale mock fields |
| `docs/code-structure/db.md` | **MODIFY** — update `tables-definition.ts` entry |

---

## Implementation Steps

### Step 1 — Write migration

Create `migrations/20260312000001_drop_yesterday_score_columns.sql`:

```sql
-- Story #278: Remove yesterday-score columns from tournament_guesses.
-- These columns were superseded by tournament_score_history snapshots (Story #272/#277).
-- All write paths were removed in Story #283 before this migration was applied.

ALTER TABLE tournament_guesses DROP COLUMN IF EXISTS yesterday_tournament_score;
ALTER TABLE tournament_guesses DROP COLUMN IF EXISTS yesterday_total_game_score;
ALTER TABLE tournament_guesses DROP COLUMN IF EXISTS yesterday_boost_bonus;
ALTER TABLE tournament_guesses DROP COLUMN IF EXISTS last_score_update_date;
```

> ⚠️ **ALWAYS ask user for explicit permission before running this migration.**

### Step 2 — Remove TypeScript type definitions

In `app/db/tables-definition.ts`, remove these four blocks (with their JSDoc comments):

- `last_score_update_date?: number` (~line 380–383)
- `yesterday_tournament_score?: number` (~line 384–389)
- `yesterday_total_game_score?: number` (~line 413–415)
- `yesterday_boost_bonus?: number` (~line 416)

### Step 3 — Clean up test: `tournament-guess-repository.test.ts`

Two changes in `__tests__/db/tournament-guess-repository.test.ts`:

**a) Lines ~264–265** — Remove stale fields from `mockStats` array:
```ts
// REMOVE these two lines from the first user object in mockStats:
yesterday_total_score: 60,
yesterday_boost_bonus: 12,
```
(These were never part of `GameStatisticForUser` after Story #283; the mock is for `legacyGetGameGuessStatisticsForUsers`.)

**b) Lines ~686–739** — Delete the entire `it('should preserve snapshot fields for rank tracking', ...)` test.
This test verified that yesterday-score columns survived an `updateOrCreateTournamentGuess` call.
Since the columns are being dropped, the test is no longer valid.

### Step 4 — Clean up test: `user-tournament-statistics.test.tsx`

In `app/__tests__/components/tournament-page/user-tournament-statistics.test.tsx`, remove lines ~25–26 from the `createMockGameStatistic` helper:
```ts
// REMOVE:
yesterday_total_score: null,
yesterday_boost_bonus: null,
```
These fields were never in the `GameStatisticForUser` type (already removed in Story #277).

### Step 5 — Update CODE-STRUCTURE.md (`docs/code-structure/db.md`)

Update the `app/db/tables-definition.ts` entry to remove mention of `yesterday_*` / `last_score_update_date` fields.
Also clean up any inline parenthetical notes in `legacyGetGameGuessStatisticsForUsers` and `getGameGuessStatisticsForUsers` entries that reference "removed in Story #277/#283" (the columns are gone now, not just "not computed").

---

## Validation

1. `npm run lint` — must be clean (no TS errors from removed fields)
2. `npm run test` — all tests pass (no references to dropped fields remain)
3. `npm run build` — build succeeds
4. Ask user permission to run migration, then apply it
5. Verify leaderboard rank changes (from Story #277) still work correctly in Vercel Preview

---

## Mid-Level Design

No new functions. This story is pure deletion — removing dead code and a migration.

### Call Graph Changes

No call graph changes. The code paths that wrote to `yesterday_*` columns were removed in Story #283.
No page/action/repo flow is added or modified.

### `app/db/tables-definition.ts` *(modified)*

**Removed fields** from `TournamentGuessTable`:
- `last_score_update_date?: number`
- `yesterday_tournament_score?: number`
- `yesterday_total_game_score?: number`
- `yesterday_boost_bonus?: number`

No function signature changes — these are type-only definitions.
No test cases needed (deletions only; existing tests verify nothing breaks).

---

## CODE-STRUCTURE Files to Update

- `docs/code-structure/db.md` — remove yesterday-score field descriptions from `tables-definition.ts` section; clean up stale parenthetical notes in `legacyGetGameGuessStatisticsForUsers` and `getGameGuessStatisticsForUsers`.
- Call graph update: NO (no cross-layer flows changed)

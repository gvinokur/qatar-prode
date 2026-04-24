# Story 381 — Automatic Baseline (Day Zero) for Score History

## Story Context

**Issue:** [#381](https://github.com/gvinokur/qatar-prode/issues/381)
**Title:** [Story] Automatic Baseline (Day Zero) for Score History

**Objective:** Ensure tournament performance charts always start from a zero-point baseline by automatically creating a "Day Zero" entry the first time a user's score history is recorded.

**Problem:** Currently, when a scoring event fires, the chart starts at the user's actual first-day score, making it look like they jumped from "nothing" to that value. By inserting a zero-score snapshot for the day before, charts get a consistent origin at 0 points.

## Acceptance Criteria

- [ ] `writeScoreSnapshot` checks if a user has any existing history entries for the given tournament.
- [ ] If no history exists, it first creates an initial entry for the day before the requested `snapshot_date`.
- [ ] The "Day Zero" entry has 0 points in all six score segments.
- [ ] Date calculation for "Day Zero" correctly handles month/year boundaries (e.g., Jan 1st → Dec 31st).
- [ ] The original requested snapshot is then written as usual.
- [ ] Subsequent scoring events for the same user/tournament do not trigger another "Day Zero" creation.

## Out of Scope

- Retroactive creation of Day Zero entries for users who already have score history data.
- Applying this logic to the `group_rankings` table.

## Technical Approach

### Overview

Two small changes in two files:

1. **`app/utils/date-utils.ts`** — add `getPreviousDayYYYYMMDD(date: number): number` using dayjs with Argentina timezone so all boundary cases are handled correctly.
2. **`app/db/score-history-repository.ts`** — add `hasScoreHistory(userId, tournamentId)` helper and modify `writeScoreSnapshot` to insert a Day Zero entry when history is empty.

### Why db layer (not actions layer)?

`writeScoreSnapshot` is called from three places:
- `app/actions/qualified-teams-scoring-actions.ts`
- `app/actions/backoffice-actions.ts`
- `app/db/tournament-guess-repository.ts` (db layer)

The third caller is in the db layer, making it a layer violation to move the Day Zero logic to actions. Keeping it in `score-history-repository.ts` means all callers get the fix without modification.

### Day Zero Logic Flow

```
writeScoreSnapshot(snapshot) called
  │
  ├─ hasScoreHistory(userId, tournamentId)?
  │   ├─ YES → skip Day Zero, proceed to upsert original snapshot
  │   └─ NO  → write Day Zero first (date = getPreviousDayYYYYMMDD(snapshot.snapshot_date), all scores = 0)
  │            then write original snapshot
  └─ return original snapshot result
```

### Date Calculation

```typescript
// YYYYMMDD integer → dayjs in Argentina TZ → subtract 1 day → YYYYMMDD integer
// Handles all boundaries: Jan 1 → Dec 31, Mar 1 → Feb 28/29, etc.
getPreviousDayYYYYMMDD(20260101) // → 20251231
getPreviousDayYYYYMMDD(20260301) // → 20260228 (non-leap) or 20260229 (leap)
getPreviousDayYYYYMMDD(20260610) // → 20260609
```

## Files to Create / Modify

| File | Action |
|------|--------|
| `app/utils/date-utils.ts` | Modify — add `getPreviousDayYYYYMMDD` |
| `app/db/score-history-repository.ts` | Modify — add `hasScoreHistory`, update `writeScoreSnapshot` |
| `__tests__/utils/date-utils.test.ts` | Modify — add tests for `getPreviousDayYYYYMMDD` |
| `__tests__/db/score-history-repository.test.ts` | Modify — add tests for `hasScoreHistory` and Day Zero behavior |
| `docs/code-structure/utils.md` | Modify — document new function |
| `docs/code-structure/db.md` | Modify — update `writeScoreSnapshot`, document `hasScoreHistory` |

## Mid-Level Design

### Call Graph Changes

No call graph changes. `writeScoreSnapshot` gains an internal dependency on `hasScoreHistory` (same module) and `getPreviousDayYYYYMMDD` (utils), but no new cross-layer call relationships are introduced. The function signature is unchanged and all callers remain unmodified.

---

### `app/utils/date-utils.ts` *(modified)*

**New functions:**

- **`getPreviousDayYYYYMMDD(date: number): number`**
  Parses a YYYYMMDD integer as a date in Argentina timezone, subtracts one day, and returns the result as a YYYYMMDD integer. Handles all month/year boundary cases via dayjs.
  Tests:
  - returns 20251231 when given 20260101 (year boundary)
  - returns 20260228 when given 20260301 (month boundary, non-leap year 2026)
  - returns 20260609 when given 20260610 (normal case — mid-year)
  - returns a valid 8-digit YYYYMMDD integer for any input

---

### `app/db/score-history-repository.ts` *(modified)*

**New functions:**

- **`hasScoreHistory(userId: string, tournamentId: string): Promise<boolean>`**
  Returns `true` if at least one row exists in `tournament_score_history` for the given user+tournament combination; `false` otherwise. Used internally by `writeScoreSnapshot` to guard Day Zero creation.
  Tests:
  - returns `false` when no rows exist for the user in the tournament
  - returns `true` when at least one row exists
  - returns `false` for the correct user if they have rows in a *different* tournament

**Changed functions:**

- **`writeScoreSnapshot(snapshot: TournamentScoreHistoryNew): Promise<TournamentScoreHistory>`** *(was: upsert only)*
  Now checks `hasScoreHistory` before upserting. If no history exists, first inserts a zero-score snapshot for `getPreviousDayYYYYMMDD(snapshot.snapshot_date)`, then proceeds to upsert the original snapshot. Signature unchanged; all callers unaffected.
  Calls: `hasScoreHistory`, `getPreviousDayYYYYMMDD` (conditionally)
  Tests:
  - writes Day Zero entry before original snapshot when user has no history (2 insertInto calls)
  - Day Zero entry has all six score segments = 0
  - Day Zero date equals `getPreviousDayYYYYMMDD(snapshot.snapshot_date)`
  - does NOT write Day Zero when user already has history (only 1 insertInto call)
  - returns the original snapshot result (not the Day Zero entry)
  - Day Zero date correctly handles Jan 1st → Dec 31st boundary

## Testing Strategy

All changes are backend-only with no UI involved. Tests use the existing mock pattern (vi.mock db, createMockInsertQuery, createMockSelectQuery).

### `__tests__/utils/date-utils.test.ts`

Add a `describe('getPreviousDayYYYYMMDD')` block with 4 test cases covering normal, year-boundary, month-boundary, and format-validation scenarios.

### `__tests__/db/score-history-repository.test.ts`

- Add `describe('hasScoreHistory')` block (3 test cases)
- Extend `describe('writeScoreSnapshot')` with 6 new test cases covering the Day Zero behavior

Coverage target: ≥80% on changed files.

## Validation

```bash
# Run tests
npm run test -- --run score-history-repository
npm run test -- --run date-utils

# Lint
npm run lint

# Build
npm run build
```

No UI changes → no Vercel Preview testing needed. No database migrations required (existing schema supports the new zero-score row).

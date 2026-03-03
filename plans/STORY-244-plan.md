# Plan: [BUG] First-round playoff game guesses show inferred teams instead of explicit qualified team predictions (#244)

## Context

When users predict group stage game scores, the system historically inferred qualified teams from those scores to populate first-round playoff game guesses. A new Qualified Teams page was added so users can now explicitly set qualified teams via a JSONB-based prediction system.

The bug: after saving qualified teams on the Qualified Teams page, the first-round playoff game guesses still show the old score-inferred teams rather than the user's explicit choices.

Root cause analysis identified two cooperating bugs in the server-side update chain.

---

## Root Causes

### Bug 1 — React `cache()` stale read (primary)

**File:** `app/db/qualified-teams-repository.ts:41`

`getAllUserGroupPositionsPredictions` is wrapped with React's `cache()`. Within a single Server Action execution (`updateGroupPositionsJsonb`), this function is called **twice**:

1. **Before the write** — inside `validateThirdPlaceForGroup` (`qualification-actions.ts:138`), which populates the React cache with the **pre-save** state
2. **After the write** — inside `updatePlayoffGameGuesses` (`guesses-actions.ts:61`), which receives the **stale cached result** missing the group just saved

React's `cache()` is designed for Server Component render-time deduplication, not for write flows where the DB changes between calls. The two-DB-roundtrip cost of removing it is acceptable since this function is only called in the context of saving qualification predictions.

**Note:** This only triggers for tournaments with `allows_third_place_qualification = true`. For others, `validateThirdPlaceForGroup` returns early without querying the JSONB table, so no cache poisoning occurs.

**Note on `getGroupPositionsPrediction`:** This separate function (line 19) is also wrapped with `cache()` but is only used during Server Component rendering—not in any write flow—so it is safe and correct to leave its `cache()` wrapper intact.

**Fix:** Remove `cache()` from `getAllUserGroupPositionsPredictions` only, converting it to a plain `async function`. The React mock in the test file stays (`getGroupPositionsPrediction` still needs it).

**Alternative considered:** Refactoring `validateThirdPlaceForGroup` to accept pre-fetched predictions as a parameter would avoid the double-fetch. However, this is a larger structural change. The simpler fix (removing `cache()`) is correct and sufficient—the extra DB roundtrip is negligible.

### Bug 2 — SQL `NULL` comparison silently skips UPDATE (secondary)

**File:** `app/db/game-guess-repository.ts:33-36`

In SQL, `col <> NULL` evaluates to `NULL` (not `TRUE`). The WHERE clause in `updateGameGuessByGameId` uses `<>` comparison with potential null values, silently skipping the UPDATE when `withUpdate` values are `null`. This means when `updatePlayoffGameGuesses` tries to clear old score-inferred team IDs by setting `home_team: null`, the row is never updated. Old values persist.

The clause was an optimization to skip no-op UPDATEs. Removing it means all calls execute a DB UPDATE regardless—acceptable since this function is called once per playoff game at save time.

**Fix:** Remove the optimization WHERE clause entirely from `updateGameGuessByGameId`.

### Combined Effect

- Bug 1 → stale JSONB cache → group's teams compute as `undefined` → tries to set `home_team: null`
- Bug 2 → null comparison fails → existing score-inferred team IDs are **never** overwritten
- Old inferred teams persist in `game_guesses` and are displayed in the playoff UI

---

## Technical Approach

### Fix 1: Remove `cache()` from `getAllUserGroupPositionsPredictions`

**File:** `app/db/qualified-teams-repository.ts`

Change from `cache(async function(...) {...})` to a plain `export async function`. `getGroupPositionsPrediction` (line 19) retains its `cache()` wrapper — it's used during rendering and not part of any write flow.

### Fix 2: Remove faulty optimization WHERE from `updateGameGuessByGameId`

**File:** `app/db/game-guess-repository.ts`

Remove the `.where(eb => eb.or([...]))` block that uses `<>` comparisons against potentially null values.

---

## Files to Modify

| File | Change |
|------|--------|
| `app/db/qualified-teams-repository.ts` | Remove `cache()` wrapper from `getAllUserGroupPositionsPredictions` only |
| `app/db/game-guess-repository.ts` | Remove faulty optimization WHERE clause from `updateGameGuessByGameId` |
| `__tests__/db/game-guess-repository.test.ts` | Update/add tests for `updateGameGuessByGameId` |

**No changes needed:**
- `__tests__/db/qualified-teams-repository.test.ts` — React mock stays (needed for `getGroupPositionsPrediction` which still uses `cache()`)
- `__tests__/actions/guesses-actions.test.ts` — mocks `getAllUserGroupPositionsPredictions` via module mock; unaffected by `cache()` removal

---

## Testing Strategy

### Unit Tests — `__tests__/db/game-guess-repository.test.ts`

Changes:
- **Remove** test "should use OR condition for team changes" — the optimization is being removed
- **Add** test: updates successfully when both teams are `null` (clearing all teams)
- **Add** test: updates successfully when `home_team` is `null`, `away_team` is non-null (mixed)
- **Add** test: updates successfully when `home_team` is non-null, `away_team` is `null` (mixed)
- **Keep** existing test "should update guess with team changes" (non-null case)
- **Keep** existing test "should return undefined when no update needed" (no matching row scenario)

### Manual Verification

1. Set up a tournament with `allows_third_place_qualification = true`
2. Create group stage score predictions (which previously populated playoff guesses via score inference)
3. Go to Qualified Teams page → explicitly select **different teams** from what was inferred
4. Save → verify playoff game cards update to reflect the explicit choices
5. Save again with different teams → verify the second update also applies (update-after-update)
6. Repeat for a tournament with `allows_third_place_qualification = false` → verify no regression

---

## Scope

- **No database migrations** required
- **No UI changes** required — both fixes are purely backend/server-side
- **No new server actions or repositories** — only modifying existing functions
- **Very low risk** — isolated changes to two small functions (~5 lines of code total)
- **No performance impact** — extra DB roundtrip is negligible

---

## Open Questions

None — root causes are definitively identified and fixes are straightforward.

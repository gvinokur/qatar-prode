# Plan: Additional Fix — 3rd-place teams not removed from game guesses when disqualified (#244)

## Context

After implementing the two fixes in #244 (stale React `cache()` and NULL-unsafe SQL WHERE), a third related bug was found:

When a user marks a 3rd-place team as **not qualified** on the Qualified Teams page, the playoff game guesses that reference 3rd-place slots are not updated — not even for the team explicitly toggled off. The expected behavior is that all 3rd-place playoff game guess slots are cleared when any group's 3rd-place qualification changes.

---

## Root Cause

**File:** `app/actions/guesses-actions.ts` — `updatePlayoffGameGuesses`, lines 80–96

When building the `guessedPositionsByGroup` standings for the playoff calculator, the function includes **all teams at all positions** from the JSONB data, regardless of the `predicted_to_qualify` flag:

```typescript
const standings = positions
  .toSorted((a, b) => a.predicted_position - b.predicted_position)
  .map(p => ({
    team_id: p.team_id,
    position: p.predicted_position,
    points: 0,
    // ... all zeros
    is_complete: true,
  }))
```

The `predicted_to_qualify` field is read from JSONB (line 76) but **never used** in the standings filter. Teams at position 3 with `predicted_to_qualify: false` are passed into the playoff calculator as if they were qualified.

The playoff calculator (`calculatePlayoffTeamsFromPositions`) then picks up these position-3 teams in the 3rd-place ranking, effectively ignoring the user's explicit disqualification choices.

---

## Cascading Effect on `groupCompleteReducer`

The playoff calculator uses `groupCompleteReducer` (from `app/utils/team-stats-utils.ts`) to determine which groups are "ready" for playoff computation. This function checks `teamPosition.is_complete` for all teams in a group — NOT group size. Since all standings are built with `is_complete: true`, all groups are always considered complete.

The 3rd-place "all groups complete" condition in the calculator:
```typescript
if (thirdTeams.length === Object.keys(positionsByGroup).length) {
```
… checks whether EVERY group has a team at index 2 (position 3). If we filter out non-qualified position-3 teams, any group without a qualified 3rd-place team will lack index 2 in its standings, causing it to be filtered out of `thirdTeams`.

---

## Technical Approach

**Single change:** Add a `.filter()` step before `.toSorted()` in `updatePlayoffGameGuesses`.

**File:** `app/actions/guesses-actions.ts`, lines 80–81

Change from:
```typescript
const standings = positions
  .toSorted((a, b) => a.predicted_position - b.predicted_position)
  .map(p => ({
    team_id: p.team_id,
    position: p.predicted_position,
    ...
  }))
```

Change to:
```typescript
const standings = positions
  .filter(p => p.predicted_position <= 2 || p.predicted_to_qualify)
  .toSorted((a, b) => a.predicted_position - b.predicted_position)
  .map(p => ({
    team_id: p.team_id,
    position: p.predicted_position,
    ...
  }))
```

**Logic:**
- Positions 1 and 2 (`predicted_position <= 2`) are **always** included — group winners and runners-up always advance
- Position 3+ (`predicted_position > 2`) are **only** included when `predicted_to_qualify === true`
- Position 4 teams (if any) are excluded unless explicitly qualified (which validation prevents)

---

## Effect on Playoff Calculator Behavior

With the filter applied, for a typical tournament (e.g., 6 groups, max 4 qualifying 3rd-place teams):

- Groups with `predicted_to_qualify: true` at position 3 → 3 teams in standings (positions 1, 2, 3)
- Groups with `predicted_to_qualify: false` at position 3 → 2 teams in standings (positions 1, 2 only)

In the calculator, `thirdTeams` is built from groups where `positionsMap[2]` is defined. Groups with only 2-team standings contribute `undefined` at index 2, so they are filtered out of `thirdTeams`.

Since `thirdTeams.length` (e.g. 4) will always be less than `Object.keys(positionsByGroup).length` (e.g. 6) for tournaments where fewer than all groups have a qualifying 3rd-place team, the condition:

```typescript
if (thirdTeams.length === Object.keys(positionsByGroup).length) { ... }
```

…fails → `thirdPlaceGroupMap` stays empty `{}` → all 3rd-place playoff slot lookups resolve to `undefined` → `null` → all 3rd-place game guesses cleared.

**Positions 1 and 2 are unaffected** — they still resolve correctly at indices 0 and 1.

**For tournaments where ALL groups qualify for 3rd place** (max equals total groups): the fix works correctly — all groups have position 3 in standings → condition passes → 3rd place assigned normally.

---

## Expected Behavior After Fix

When any group's 3rd-place qualification changes on the Qualified Teams page:
- All playoff game guess slots with `position === 3` are cleared (set to `null`)
- Positions 1 and 2 playoff game guess slots are unaffected
- User sees blank 3rd-place slots in their playoff predictions

This is the "all of them should be removed" behavior the user expects.

---

## Files to Modify

| File | Change |
|------|--------|
| `app/actions/guesses-actions.ts` | Add `.filter()` for `predicted_to_qualify` in `updatePlayoffGameGuesses` (1 line) |
| `__tests__/actions/guesses-actions.test.ts` | Add mock for `qualified-teams-repository`; add tests for `predicted_to_qualify` filtering |

**No changes needed:**
- Database files — no schema changes
- Calculator (`playoff-teams-calculator.ts`) — existing logic correctly handles undefined at index 2
- UI files — no UI changes

---

## Testing Strategy

### Setup: Add mock for `qualified-teams-repository`

The test file currently lacks a mock for this module (it's dynamically imported in `guesses-actions.ts`). Add:

```typescript
vi.mock('../../app/db/qualified-teams-repository', () => ({
  getAllUserGroupPositionsPredictions: vi.fn().mockResolvedValue([]),
}))
const mockGetAllUserGroupPositionsPredictions = vi.mocked(qualifiedTeamsRepository.getAllUserGroupPositionsPredictions)
```

### New Tests in `__tests__/actions/guesses-actions.test.ts` (under `updatePlayoffGameGuesses`)

1. **"excludes position-3 teams with predicted_to_qualify: false from standings"**
   - Mock `getAllUserGroupPositionsPredictions` to return a group with position 3, `predicted_to_qualify: false`
   - Call `updatePlayoffGameGuesses`
   - Verify the standings passed to `calculatePlayoffTeamsFromPositions` do NOT include the position-3 team
   - Verify the standings only have 2 entries (positions 1 and 2)

2. **"includes position-3 teams with predicted_to_qualify: true in standings"**
   - Mock `getAllUserGroupPositionsPredictions` to return a group with position 3, `predicted_to_qualify: true`
   - Call `updatePlayoffGameGuesses`
   - Verify the standings passed to `calculatePlayoffTeamsFromPositions` DO include the position-3 team (3 entries)

3. **"always includes position-1 and position-2 teams regardless of predicted_to_qualify"**
   - Mock with position 1 (`predicted_to_qualify: false`) and position 2 (`predicted_to_qualify: false`)
   - Verify both appear in standings (positions 1 and 2 always qualify)

### Manual Verification

1. Go to the Qualified Teams page for a tournament with `allows_third_place_qualification = true`
2. Verify some 3rd-place teams appear in playoff game guesses (baseline)
3. Toggle one 3rd-place team from "qualified" to "not qualified"
4. Save → verify **all** 3rd-place playoff game guesses are cleared (blank)
5. Toggle back to "qualified"
6. Save → (3rd-place slots remain blank — clearing is one-way, user must re-set via group stage guesses)
7. Verify positions 1 and 2 playoff game guesses are unaffected throughout

---

## Scope

- **No database migrations** required
- **No UI changes** required
- **No new functions** — modifying one existing filter chain
- **Very low risk** — 1-line change to a standalone filter step
- Same PR as the original two fixes (feature/story-244)

---

## Open Questions

None — root cause identified and fix is straightforward.

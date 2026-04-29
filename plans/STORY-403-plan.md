# Plan: Story #403 — Limit Urgent Games Banner to 24-Hour Window

## Story

**Issue:** [#403](https://github.com/gvinokur/qatar-prode/issues/403)
**Title:** [Story] Limit urgent games banner to 24-hour window

## Context

The Action Center's red urgent banner ("X games closing soon") currently fires whenever any unpredicted game with an open deadline exists — even if that game is days away. This creates false urgency and buries other useful states (QT/awards deadlines, stage-transition nudges). The fix: only show the red banner when at least one unpredicted game's deadline is within 24 hours of now.

## Acceptance Criteria

- [ ] The "Games closing soon" urgent banner (red) only triggers if at least one unpredicted game is within 24 hours of its prediction deadline (1h before kickoff).
- [ ] When unpredicted games exist but are all outside the 24h window, the Action Center naturally falls back to the next priority state.
- [ ] The behavior is consistent across all tournaments.
- [ ] The "Upcoming Games" carousel still correctly identifies and highlights these games when they are the primary focus, but doesn't force the "Urgent" banner state at the hub level prematurely.

## Technical Approach

**Root cause:** `computePriorityAttention()` in `app/utils/priority-attention.ts` returns `urgent-games` whenever `data.mode === 'urgent'`, which is set by `getActionCenterGames()` for ANY unpredicted game with an open deadline.

**Fix:** In `computePriorityAttention()`, filter `data.games` to find games whose deadline is ≤ 24h from now. Only return the `urgent-games` state if at least one such game exists; otherwise fall through to lower-priority states.

**Why here (not in `getActionCenterGames`):** The carousel (`games-active-widget`) reads `ActionCenterData.mode` directly — keeping `mode='urgent'` ensures the carousel still shows unpredicted games. Only the banner logic needs to change.

## Files to Create / Modify

| File | Action |
|------|--------|
| `app/utils/priority-attention.ts` | Modify — add 24h deadline check |
| `app/actions/__tests__/hub-actions-priority.test.ts` | Modify — update existing + add new tests |
| `docs/code-structure/utils.md` | Modify — update `computePriorityAttention` description |

## Mid-Level Design

### Call Graph Changes

No new cross-layer flows. `computePriorityAttention` is still called from the same places. The addition of `calculateDeadline` is internal to `priority-attention.ts`.

### `app/utils/priority-attention.ts` *(modified)*

**New imports/constants:**
```typescript
import { calculateDeadline } from './countdown-utils'
const HOURS_24_MS = 24 * 60 * 60 * 1000
```

**Changed functions:**

- **computePriorityAttention(data: ActionCenterData)**: `PriorityAttentionState | null` *(behavior change)*
  Now requires at least one game in `data.games` to have `calculateDeadline(game_date) - now <= 24h` before returning `urgent-games`. Falls through to `buildDeadlineState` when mode='urgent' but no game is within 24h. `urgentCount` now reflects only within-24h games.
  Calls: calculateDeadline, buildDeadlineState, areGroupStageGamesPredicted
  Tests:
  - returns urgent-games when mode=urgent and a game has deadline within 24h
  - does NOT return urgent-games when mode=urgent but all games > 24h away
  - urgentCount equals count of within-24h games, not total games in data.games
  - firstUrgentGameId points to earliest within-24h game
  - falls through to deadline state when mode=urgent but no games within 24h and deadline condition met
  - returns null when mode=urgent, no games within 24h, and no other condition matches

## Implementation Steps

### Task 1 — Update `computePriorityAttention` logic

In `app/utils/priority-attention.ts`:

1. Add import: `import { calculateDeadline } from './countdown-utils'`
2. Add constant: `const HOURS_24_MS = 24 * 60 * 60 * 1000`
3. Replace the `urgent` branch:

```typescript
if (data.mode === 'urgent') {
  const now = Date.now()
  const within24h = data.games.filter(
    (g) => calculateDeadline(g.game_date) - now <= HOURS_24_MS
  )
  if (within24h.length > 0) {
    return {
      type: 'urgent-games',
      urgentCount: within24h.length,
      firstUrgentGameId: within24h[0]?.id,
      completedCount: data.predictedGames,
      totalCount: data.totalGames,
    }
  }
  // No games within 24h — fall through to lower-priority states
}
```

Note: `data.games` when `mode==='urgent'` are already filtered to open deadlines and sorted nearest-first by `getActionCenterGames()`.

**CODE-STRUCTURE files to update:** `docs/code-structure/utils.md` — update `computePriorityAttention` description. Call graph: NO update needed (no new cross-layer flow).

### Task 2 — Update tests

In `app/actions/__tests__/hub-actions-priority.test.ts`:

Add helpers at the top of the describe block:
```typescript
const gameWithin24h = (id: string) => ({
  id,
  game_date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours away
})
const gameOutside24h = (id: string) => ({
  id,
  game_date: new Date(Date.now() + 30 * 60 * 60 * 1000), // 30 hours away
})
```

Update existing tests (lines 104–134) to use `gameWithin24h()` instead of `{ id: 'game-1' }`.

Add new tests in `describe('Tier 1 — urgent-games')`:
- `does NOT return urgent-games when mode=urgent but all games > 24h away`
- `falls through to deadline state when mode=urgent but no games within 24h`
- `urgentCount = count of within-24h games (not all games in data.games)`
- `firstUrgentGameId = earliest within-24h game`

**CODE-STRUCTURE files to update:** None (test file only).

## Testing Strategy

- Unit tests cover all acceptance criteria scenarios (banner shows/hides, fallthrough behavior)
- Existing test suite for `computePriorityAttention` fully updated — no regressions
- Run: `npm run test -- hub-actions-priority`
- Run full suite: `npm run test`

## Validation

- `npm run lint && npm run build` — clean
- Deploy to Vercel Preview
- Verify: red banner does NOT appear when all unpredicted games are 2+ days away
- Verify: red banner DOES appear when a game closes in < 24h
- Verify: carousel still shows unpredicted games in both cases

# Story 433 Plan: "Playoffs round open now" Banner Missing

## Context

**Issue:** [#433](https://github.com/gvinokur/qatar-prode/issues/433)  
**Type:** Bug  
**Title:** "Playoffs round open now" banner missing when playoff teams are defined but games haven't been played

When the admin assigns playoff teams to upcoming games (after group stage concludes), users should see a "Playoffs round open now" priority banner in the hub. This banner is currently missing in certain timing scenarios, causing users to miss the prediction window for playoff rounds.

---

## Root Cause

In `app/utils/priority-attention.ts`, `computePriorityAttention` evaluates:

```
Tier 1 urgent-games → Tier 2 now-available-playoff → ...
```

When playoff games appear in the action center (within the 7-day window, unpredicted, deadline open) **and their deadline is ≤ 24h away**, the function returns `urgent-games` and short-circuits before reaching the `now-available-playoff` check.

The `urgent-games` condition fires for ANY game within 24h of deadline — including playoff games — regardless of whether a playoff round just became available. The "Playoffs round open now" banner is never shown.

**Specific scenario:**
1. Group stage ends. Admin assigns R16 teams to games scheduled within the next 7 days.
2. Those games are within 24h of their deadline (e.g., admin assigns teams close to game day).
3. `mode = 'urgent'` (unpredicted, open deadline).
4. `within24h.length > 0` → returns `urgent-games`.
5. `nowAvailablePlayoffRound` check is never reached → banner missing.

---

## Approach

Modify `computePriorityAttention` to only trigger `urgent-games` when **group-stage** games are within 24h of deadline. Playoff game urgency is better communicated by the more informative `now-available-playoff` banner.

When all within-24h urgent games are playoff games AND `nowAvailablePlayoffRound` is set, fall through to show the playoff-specific banner. When `nowAvailablePlayoffRound` is null (teams not yet assigned, < 3h since last group game), preserve existing urgent-games behavior as a fallback.

This satisfies the acceptance criteria without regressions:
- Group stage urgency is unaffected (any group-stage game within 24h → urgent-games)
- Playoff urgency channels into the more informative now-available-playoff banner
- Edge case (playoff games urgent, teams not yet assigned) still shows urgent-games via the `!data.nowAvailablePlayoffRound` guard

---

## Files to Modify

1. **`app/utils/priority-attention.ts`** — Change `computePriorityAttention` logic
2. **`app/utils/__tests__/priority-attention.test.ts`** — Add 3 new test cases
3. **`docs/code-structure/utils.md`** — Update `computePriorityAttention` description

---

## Mid-Level Design

### Call Graph Changes

No new cross-layer flows. `computePriorityAttention` remains a pure function.

### `app/utils/priority-attention.ts` *(modified)*

**Changed functions:**

- **computePriorityAttention(data: ActionCenterData)**: `PriorityAttentionState | null` *(behavior change only, signature unchanged)*  
  Priority order: `urgent-games` (mode==='urgent' AND at least one **group-stage** game has `calculateDeadline(game_date) - now <= 24h`, OR all within-24h games are playoff games but `nowAvailablePlayoffRound` is null) → `now-available-playoff` (data.nowAvailablePlayoffRound is set) → `deadline` → `new-actions-qt` → `new-actions-awards` → null.  
  The within-24h filter is the same; the new guard is `const allPlayoff = within24h.every(g => !!g.playoffStage)` followed by `if (!allPlayoff || !data.nowAvailablePlayoffRound)` before returning urgent-games.  
  Calls: calculateDeadline, areGroupStageGamesPredicted  
  Tests:
  - returns urgent-games when mode urgent and a group-stage game is within 24h (existing, still passes)
  - returns now-available-playoff when mode urgent, all within-24h games are playoff games, and nowAvailablePlayoffRound is set [NEW]
  - still returns urgent-games when mode urgent, all within-24h games are playoff games, but nowAvailablePlayoffRound is null [NEW]
  - still returns urgent-games when mode urgent, mix of group-stage and playoff games within 24h [NEW]

---

## Implementation Steps

### Task 1 — Fix `computePriorityAttention` in `priority-attention.ts`

In the `if (data.mode === 'urgent')` block, after computing `within24h`, add:

```typescript
if (within24h.length > 0) {
  // Only use urgent-games for group-stage games; playoff urgency surfaces via
  // now-available-playoff (more informative when a new round has just opened).
  const allPlayoff = within24h.every((g) => !!g.playoffStage)
  if (!allPlayoff || !data.nowAvailablePlayoffRound) {
    return {
      type: 'urgent-games',
      urgentCount: within24h.length,
      firstUrgentGameId: within24h[0]?.id,
      completedCount: data.predictedGames,
      totalCount: data.totalGames,
    }
  }
  // All urgent games are playoff games AND nowAvailablePlayoffRound is set
  // → fall through so now-available-playoff tier handles it
}
```

### Task 2 — Add tests to `priority-attention.test.ts`

Add a `playoffGameWithin24h` helper alongside the existing `gameWithin24h` helper (same pattern: inline `as ActionCenterData['games'][0]` cast). Note: `testFactories.game()` returns the base `Game` type without `playoffStage`, so the existing test file's inline mock pattern is the correct approach here.

```typescript
const playoffGameWithin24h = (id: string) =>
  ({
    id,
    game_date: new Date(Date.now() + 2 * 60 * 60 * 1000),
    playoffStage: { tournament_playoff_round_id: 'r16', round_name: 'Round of 16', is_final: false, is_third_place: false },
  }) as ActionCenterData['games'][0]
```

Add 3 new test cases in the "Tier 1 — urgent-games" describe block:

1. `returns now-available-playoff when mode urgent, all within-24h games are playoff games, and nowAvailablePlayoffRound is set`  
   - `mode: 'urgent'`, game is `playoffGameWithin24h('p1')`  
   - `nowAvailablePlayoffRound: { roundId: 'r16', roundName: 'Round of 16', firstGameId: 'p1' }`  
   - expect `result?.type` to be `'now-available-playoff'`

2. `still returns urgent-games when mode urgent, all within-24h games are playoff games, but nowAvailablePlayoffRound is null`  
   - `mode: 'urgent'`, game is `playoffGameWithin24h('p1')`  
   - `nowAvailablePlayoffRound: null`  
   - expect `result?.type` to be `'urgent-games'`

3. `still returns urgent-games when mode urgent and mix of group-stage and playoff games within 24h`  
   - `mode: 'urgent'`, games: `[gameWithin24h('g1'), playoffGameWithin24h('p1')]`  
   - `nowAvailablePlayoffRound` set  
   - expect `result?.type` to be `'urgent-games'`

### Task 3 — Update `docs/code-structure/utils.md`

Update the `computePriorityAttention` description bullet to reflect the new priority order (group-stage check for urgent-games, playoff falls through).

CODE-STRUCTURE files to update: `docs/code-structure/utils.md`  
Call graph update: NO

---

## Testing Strategy

Run existing test suite to confirm no regressions:
```bash
npx vitest run app/utils/__tests__/priority-attention.test.ts
npx vitest run app/actions/__tests__/hub-actions-priority.test.ts
```

All existing tests should pass unchanged because:
- Existing tests use `{ id, game_date } as any` games without `playoffStage` → `!!g.playoffStage = false` → `allPlayoff = false` → same behavior as before

New tests verify the fix specifically.

Full test suite:
```bash
npm run test
```

**No UI changes** — this is a pure logic change in a utility function. No browser testing needed.

---

## Verification

1. Run `npx vitest run app/utils/__tests__/priority-attention.test.ts` — all tests pass including 3 new ones
2. Run `npx vitest run app/actions/__tests__/hub-actions-priority.test.ts` — existing tests unchanged
3. Run `npm run test` — full suite green
4. Run `npm run lint` — no lint issues
5. Run `npm run build` — clean build

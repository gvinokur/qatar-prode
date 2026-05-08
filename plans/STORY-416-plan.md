# Story 416: Eliminate Redundant Tournament Date and Member Profile Fetches

## Context

The global friend group detail page (`app/[locale]/friend-groups/[id]/page.tsx`) loads score history for every active tournament by calling `getScoreHistoryForGroup(allParticipants, tournament.id)` once per tournament. That action is self-contained by design — it internally fetches three things:

1. `findUsersByIds(userIds)` — all member user profiles
2. `findFirstGameInTournament(tournamentId)` — first game date (for chart axis start)
3. `findLastGameInTournament(tournamentId)` — last game date (for chart axis end)

**The redundancy:** The page already fetches (1) and (2) before calling `getScoreHistoryForGroup`:
- Member profiles are fetched at line ~81 via `findUsersByIds(allParticipants)`
- First game date is fetched in the `tournamentData` loop via `getTournamentStartDate(tournament.id)` (which wraps `findFirstGameInTournament`)

For 3 active tournaments, this means 3× `findUsersByIds` + 3× `findFirstGameInTournament` + 3× `findLastGameInTournament` are fired inside `getScoreHistoryForGroup`, all of which duplicate (or could duplicate) prior fetches. The story counts this as ~9 redundant queries.

**Note on React `cache()`**: `findUsersByIds` and `findFirstGameInTournament` are wrapped in React's `cache()`. Since the same array reference (`allParticipants`) and the same string `tournamentId` are passed, those calls may already be deduplicated for the users and first-game queries. The `findLastGameInTournament` calls (3× per page load) are definitively not cached from any prior call. The refactor eliminates all redundant intent regardless and makes the data dependencies explicit.

## Acceptance Criteria
- History tab shows correct score growth chart for all active tournaments
- Rank history chart shows correct rank progression for all members
- Member display names appear correctly in all history charts
- Page behaves correctly when a tournament has no game history yet
- No visible change in content or behavior

## Technical Approach

**Add an optional `prefetched` parameter to `getScoreHistoryForGroup`** that accepts pre-fetched users and game objects. When provided, the function skips those three internal fetches and only queries `getScoreHistoryForUsers` (the score snapshots, which are the unique data it owns).

On the page side, replace `getTournamentStartDate(tournament.id)` with direct calls to `findFirstGameInTournament` + `findLastGameInTournament` inside the `tournamentData` loop (alongside existing parallel fetches). Then pass those results — plus the already-fetched `users` — as `prefetched` to each `getScoreHistoryForGroup` call.

This change is backward-compatible: existing callers (including the tournament-scoped group page) continue to work without passing `prefetched`, since the parameter is optional.

## Files to Modify

| File | Change |
|------|--------|
| `app/actions/score-history-actions.ts` | Add `ScoreHistoryPrefetched` interface; update `getScoreHistoryForGroup` to accept and use prefetched data |
| `app/[locale]/friend-groups/[id]/page.tsx` | Remove `getTournamentStartDate`; add `findFirstGameInTournament`/`findLastGameInTournament`; pass prefetched data |
| `docs/code-structure/actions.md` | Update `getScoreHistoryForGroup` signature entry |
| `__tests__/actions/score-history-actions.test.ts` | Add tests for prefetched code path |

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Friend group detail page data flow** — `tournamentData` loop now calls `findFirstGameInTournament` and `findLastGameInTournament` directly (replacing `getTournamentStartDate`); passes `{ users, firstGame, lastGame }` to `getScoreHistoryForGroup`

**No new cross-layer flows introduced.**

---

### `app/actions/score-history-actions.ts` *(modified)*

**New exported interface:**

```typescript
export interface ScoreHistoryPrefetched {
  users: User[];
  firstGame: Game | undefined;
  lastGame: Game | undefined;
}
```
(Requires adding `import type { User, Game } from '../db/tables-definition'`)

**Changed functions:**

- **getScoreHistoryForGroup(userIds: string[], tournamentId: string, prefetched?: ScoreHistoryPrefetched)**: `Promise<ScoreHistoryResult>`
  
  When `prefetched` is provided: uses `prefetched.users`, `prefetched.firstGame`, `prefetched.lastGame` directly; only awaits `getScoreHistoryForUsers` (the snapshot data).
  
  When `prefetched` is not provided: fetches all four in a `Promise.all` exactly as before (backward compatible).
  
  Calls: getScoreHistoryForUsers; conditionally findUsersByIds, findFirstGameInTournament, findLastGameInTournament
  
  Tests (new `describe` block — uses `testFactories.user()` and `testFactories.game()`):
  - when prefetched.users is provided, returns score history with display names from prefetched users (findUsersByIds not called)
  - when prefetched.firstGame is provided, tournamentStartDate in result matches prefetched game's date (findFirstGameInTournament not called)
  - when prefetched.lastGame is provided, tournamentEndDate in result matches prefetched game's date (findLastGameInTournament not called)
  - when prefetched.firstGame is undefined (tournament has no games), tournamentStartDate is null
  - when prefetched is not provided, result matches expected output using mocked repository calls (backward compat — all 4 fetches occur)
  - when getScoreHistoryForUsers rejects, error propagates to caller (works same with or without prefetched)

---

### `app/[locale]/friend-groups/[id]/page.tsx` *(modified)*

No new exported functions — changes are to the page's data-fetching sequence:

1. **Remove** `import { getTournamentStartDate } from "../../../actions/tournament-actions"`
2. **Add** `import { findFirstGameInTournament, findLastGameInTournament } from "../../../db/game-repository"`
3. **In `tournamentData` loop**, replace `getTournamentStartDate(tournament.id)` with:
   ```typescript
   findFirstGameInTournament(tournament.id),
   findLastGameInTournament(tournament.id),
   ```
   Compute `tournamentStartDate` as: `firstGame?.game_date || new Date(2024, 0, 1)` (same logic as `getTournamentStartDate`).
   Include `firstGame` and `lastGame` in the returned object.
4. **Build per-tournament lookups** after the `tournamentData` loop:
   ```typescript
   const firstGameByTournament = Object.fromEntries(
     tournamentData.map(({ tournamentId, firstGame }) => [tournamentId, firstGame])
   )
   const lastGameByTournament = Object.fromEntries(
     tournamentData.map(({ tournamentId, lastGame }) => [tournamentId, lastGame])
   )
   ```
5. **Pass prefetched data** to each `getScoreHistoryForGroup` call:
   ```typescript
   await getScoreHistoryForGroup(allParticipants, tournament.id, {
     users,
     firstGame: firstGameByTournament[tournament.id],
     lastGame: lastGameByTournament[tournament.id],
   })
   ```

---

### `docs/code-structure/actions.md` *(modified)*

Update `getScoreHistoryForGroup` entry:
- Signature: `getScoreHistoryForGroup(userIds: string[], tournamentId: string, prefetched?: ScoreHistoryPrefetched): Promise<ScoreHistoryResult>`
- Calls: `getScoreHistoryForUsers`; conditionally `findUsersByIds`, `findFirstGameInTournament`, `findLastGameInTournament`
- Add `ScoreHistoryPrefetched` to exported types list

---

### `__tests__/actions/score-history-actions.test.ts` *(modified)*

Add a new `describe('getScoreHistoryForGroup — with prefetched data')` block with the 5 tests listed in the Mid-Level Design above. Uses `testFactories.user()` and `testFactories.game()` to build mock data; mocks `findUsersByIds`, `findFirstGameInTournament`, `findLastGameInTournament` with `vi.fn()` (same setup as existing suite) and asserts they are/aren't called via `expect(findUsersByIds).not.toHaveBeenCalled()`.

## Implementation Steps

1. **Update `score-history-actions.ts`**:
   - Add `User` and `Game` type imports from `../db/tables-definition`
   - Export `ScoreHistoryPrefetched` interface
   - Modify `getScoreHistoryForGroup` to use `prefetched` data when provided

2. **Update `friend-groups/[id]/page.tsx`**:
   - Swap `getTournamentStartDate` for direct `findFirstGameInTournament` + `findLastGameInTournament` calls
   - Build `firstGameByTournament` and `lastGameByTournament` lookups
   - Pass `{ users, firstGame, lastGame }` to `getScoreHistoryForGroup`

3. **Update `docs/code-structure/actions.md`** with new signature

4. **Add tests** in `score-history-actions.test.ts` for prefetched code path

## Testing Strategy

**Unit tests (new)** in `__tests__/actions/score-history-actions.test.ts`:
- 5 new tests covering the `prefetched` code path (listed in Mid-Level Design above)
- All existing tests continue to pass unchanged (backward compat)

**Behavior verification** (no E2E tests needed — pure refactor):
- Run `npm test` to confirm all existing + new unit tests pass
- Run `npm run build` to confirm TypeScript compilation
- Run `npm run lint` for linting

**Manual verification** (on Vercel Preview):
- Visit a friend group page with 1+ active tournaments
- Confirm History tab loads and displays score growth chart
- Confirm rank history chart shows correct progression
- Check the page with a tournament that has no games yet (empty state)

## Verification

```bash
npm run test -- --run __tests__/actions/score-history-actions.test.ts
npm run build
npm run lint
```

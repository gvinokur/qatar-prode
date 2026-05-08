# Story 432: [Bug] Draft game scores are visible to users in hub and games pages

## Context

Game results have a `is_draft: boolean` column in the `game_results` table. Admins can save scores in draft state before officially publishing them. However, two repository functions used for user-facing views fetch game results without filtering out draft rows, causing draft scores to leak to users and ruin the prediction experience.

## Objective

Prevent draft game results from appearing on the hub games widget, the games list/detail page, and the public games view. Published scores should continue appearing immediately upon publish.

## Acceptance Criteria

- Game scores in `is_draft: true` state do not appear on the hub games widget
- Game scores in `is_draft: true` state do not appear on the games list/detail page
- Games with only a draft result render score-less (as if no result exists)
- Once an admin publishes a result (`is_draft: false`), it becomes visible immediately
- Backoffice views are unaffected

---

## Root Cause

Two functions in `app/db/game-repository.ts` embed a `game_results` subquery using `jsonObjectFrom` but omit the `is_draft = false` filter:

**`findGamesForDashboard`** (line ~420) — feeds `getActionCenterGames` and `getCarouselGames` in `hub-actions.ts` → hub widget  
**`getAllTournamentGames`** (line ~478) — feeds `UnifiedGamesPage`, `PublicGamesPage`, `awards/page.tsx`, `qualified-teams/page.tsx`

Both have:
```typescript
jsonObjectFrom(
  eb.selectFrom('game_results')
    .whereRef('game_results.game_id', '=', 'games.id')
    .selectAll()   // ← returns draft results
).as('gameResult')
```

Because this is a correlated subquery (not a JOIN), if only a draft result exists, adding `.where('game_results.is_draft', '=', false)` causes the subquery to return no rows, so `jsonObjectFrom` returns `null` — exactly what we want.

**Not affected (backoffice uses explicit `draftResult=true`):**
- `findGamesInTournament` — callers in backoffice actions pass `includeDraftResults` intentionally
- `getGamesInTournament` → `backoffice/tournament-game-manager-tab.tsx` (admin only)
- `getCompletePlayoffData` → `backoffice/playoff-tab.tsx` (admin only)

---

## Technical Approach

Apply a single-line fix to the `game_results` subquery in both affected functions. No schema changes, no new columns, no migration needed.

---

## Files to Modify

| File | Change |
|------|--------|
| `app/db/game-repository.ts` | Add `.where('game_results.is_draft', '=', false)` to `game_results` subquery in `findGamesForDashboard` and `getAllTournamentGames` |
| `__tests__/db/game-repository.test.ts` | Add tests for `findGamesForDashboard` draft-result null handling |
| `app/db/__tests__/game-repository-ordering.test.ts` | Add test for `getAllTournamentGames` (already has file, easy to extend) |
| `docs/code-structure/db.md` | Update `findGamesForDashboard` and `getAllTournamentGames` descriptions to note draft filtering |

---

## Mid-Level Design

### Call Graph Changes

No call graph changes. Existing flows remain identical — only query behavior changes.

### `app/db/game-repository.ts` *(modified)*

**Changed functions:**

- **findGamesForDashboard(tournamentId: string)**: `Promise<ExtendedGameData[]>` *(internal subquery change only)*  
  The `game_results` correlated subquery now includes `.where('game_results.is_draft', '=', false)`.  
  When only a draft result exists, `gameResult` is `null` instead of the draft data.  
  Signature and return type are unchanged.  
  Calls: `db.selectFrom`, `jsonObjectFrom`, `eb.selectFrom`  
  Tests (use the inline mock pattern from `__tests__/db/game-repository.test.ts` lines 608-668 — `mockQuery` object with `selectAll`, `select`, `where`, `orderBy`, `execute` as `vi.fn().mockReturnThis()`):
  - game with a published result (`is_draft: false`) → `execute()` returns it and function returns it as-is
  - tournament with no games → `execute()` returns `[]`, function returns `[]`
  - DB has only a draft result for a game → `execute()` returns that game with `gameResult: null` (the DB subquery filter produces null because `is_draft = false` matches nothing) → function returns it with `gameResult: null`, score not exposed
  - mixed tournament: `execute()` returns two games — one with `gameResult: { is_draft: false, home_score: 2, away_score: 1 }` and one with `gameResult: null` — both are passed through as-is, null is not dropped
  - `execute()` rejects with error → function propagates the error (db failure reaches caller)

- **getAllTournamentGames(tournamentId: string)**: `Promise<ExtendedGameData[]>` *(internal subquery change only)*  
  Same subquery fix as `findGamesForDashboard`.  
  Signature and return type are unchanged.  
  Calls: `db.selectFrom`, `jsonObjectFrom`, `eb.selectFrom`  
  Tests (use `createMockSelectQuery` from `__tests__/db/mock-helpers.ts` as done in `app/db/__tests__/game-repository-ordering.test.ts`):
  - returns empty array when tournament has no games
  - game with only a draft result → `execute()` returns it with `gameResult: null` (DB filter produces null) → function returns it score-less
  - mixed tournament: games with published results and games with `gameResult: null` are all returned, null is preserved
  - `execute()` rejects with error → function propagates the error

> **Testing note:** The `is_draft = false` filter lives inside the Kysely expression-builder subquery (`eb.selectFrom`), not on the outer `mockQuery` object. The unit mock infrastructure cannot directly verify this inner WHERE clause. Tests verify observable behaviour (null-handling, correct data pass-through) and rely on code review + manual Vercel Preview testing to confirm the DB filter is correctly applied.

---

## Implementation Steps

1. In `findGamesForDashboard`, change:
   ```typescript
   jsonObjectFrom(
     eb.selectFrom('game_results')
       .whereRef('game_results.game_id', '=', 'games.id')
       .selectAll()
   ).as('gameResult')
   ```
   to:
   ```typescript
   jsonObjectFrom(
     eb.selectFrom('game_results')
       .whereRef('game_results.game_id', '=', 'games.id')
       .where('game_results.is_draft', '=', false)
       .selectAll()
   ).as('gameResult')
   ```

2. Apply the identical change to `getAllTournamentGames`.

3. Add/update tests in `__tests__/db/game-repository.test.ts` and `app/db/__tests__/game-repository-ordering.test.ts`.

4. Update `docs/code-structure/db.md` descriptions for both functions.

---

## Testing Strategy

- **Unit tests** (mock-based): Verify null-result handling and existing behaviour is preserved.
- **Manual / Vercel Preview**: Create a game result in draft state via backoffice → confirm score does not appear on hub or games page. Publish the result → confirm it appears immediately.
- Run `npm run test` and `npm run build` before committing.

---

## Validation Considerations

- No new SonarCloud issues expected (tiny additive change, no duplication)
- No migration required — `is_draft` column already exists
- No i18n changes
- No UI changes — the fix is purely in the data layer
- Backoffice functions are unaffected (they use `findGamesInTournament` with explicit draft inclusion)

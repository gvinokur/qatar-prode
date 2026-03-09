# Plan: [Fix] Playoff Bracket Game Tree: Incorrect Game Ordering Across Rounds #267

## Context

`PlayoffsBracketView` builds `bracketRounds` by iterating `playoffStages` and naively mapping each stage's `games` array to game objects. That array is in database insertion / `game_number` order — not bracket-tree order. The layout math (`calculateGamePositions`) assumes game `i` in round N+1 is fed by games `2i` and `2i+1` in round N, so when ordering is wrong, SVG connection lines point to the wrong games.

Each game stores `home_team_rule` and `away_team_rule` as `TeamWinnerRule { game: game_number, winner: bool }` — the ground-truth bracket structure. The fix traverses the game tree from the final backwards to derive the correct per-round ordering before any layout math runs.

## Acceptance Criteria

- Bracket correctly orders each round's games by traversing the tree from the final backwards
- SVG connection lines connect the correct game pairs across rounds
- Games with no `TeamWinnerRule` reference (group-stage qualifiers in round 1) are handled gracefully
- Works for any bracket depth (Round of 32, Round of 16, etc.)
- All existing tests pass; new unit tests cover the tree-traversal logic

## Technical Approach

### New utility function: `buildOrderedBracketRounds`

Add to `app/components/results-page/bracket-layout-utils.ts`.

**Runtime type note:** `home_team_rule` / `away_team_rule` are typed as `JSONColumnType<GroupFinishRule | TeamWinnerRule>` in Kysely's table definition, but at runtime the DB driver deserializes JSON columns into plain JS objects. This is confirmed by existing callers (`playoff-tab.tsx`, `playoff-utils.ts`) that already call `isTeamWinnerRule(game.home_team_rule)` directly without any parse step. The plan relies on this same pattern — no additional parsing needed.

**Algorithm:**
1. `orderedGamesPerStage[]` initialized with each stage's games in original order (Stage 0 = earliest round)
2. Traverse from the last index down to index 1:
   - `orderRoundByLaterGames(orderedGamesPerStage[i], orderedGamesPerStage[i-1], gamesByNumber)` replaces `orderedGamesPerStage[i-1]`
   - `orderRoundByLaterGames` builds a `Set<string>` of game IDs belonging to the current round (prevents cross-round misplacement), then for each game in the later ordered round emits `home_team_rule.game` feeder then `away_team_rule.game` feeder (only if they exist in the current-round set and haven't been placed yet), finally appending any unplaced games at the end
3. Return `BracketRound[]` with the corrected game order

### `PlayoffsBracketView` change

Replace the current `bracketRounds` useMemo:
- Add `gamesByNumber` useMemo: `Object.values(gamesMap)` iterated to build `{ [game_number: number]: ExtendedGameData }`
- Call `buildOrderedBracketRounds(mainStages, gamesMap, gamesByNumber)` instead of the inline `.map()`

## Files to Create / Modify

| File | Change |
|------|--------|
| `app/components/results-page/bracket-layout-utils.ts` | Add `buildOrderedBracketRounds` (and internal helper `orderRoundByLaterGames`) |
| `app/components/results-page/playoffs-bracket-view.tsx` | Replace `bracketRounds` useMemo to use new function; add `gamesByNumber` useMemo |
| `__tests__/components/results-page/bracket-layout-utils.test.ts` | New tests for `buildOrderedBracketRounds` |
| `docs/code-structure/components/components-results-playoffs.md` | Document new exported function |
| `CODE-STRUCTURE.md` | Update last-updated date |

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 11 (Tournament results page)** — `PlayoffsBracketView` now calls `buildOrderedBracketRounds` (new) in its `bracketRounds` useMemo, replacing the inline `.map()`.

**New flows:** none

---

### `app/components/results-page/bracket-layout-utils.ts` *(modified)*

**New functions:**

- **`orderRoundByLaterGames(orderedLaterRoundGames: ExtendedGameData[], currentRoundGames: ExtendedGameData[], gamesByNumber: { [gameNumber: number]: ExtendedGameData }): ExtendedGameData[]`** *(internal — not exported)*
  Signature: `(orderedLaterRoundGames: ExtendedGameData[], currentRoundGames: ExtendedGameData[], gamesByNumber: { [gameNumber: number]: ExtendedGameData }) => ExtendedGameData[]`
  Given the already-ordered games of the later round and the unordered games of the current round, returns `currentRoundGames` re-ordered. Builds a `Set<string>` of game IDs belonging to `currentRoundGames` to prevent cross-round misplacement. For each game in `orderedLaterRoundGames`, extracts `home_team_rule.game` and `away_team_rule.game` (if `TeamWinnerRule`) and places the matching current-round game; unplaced games are appended at the end.
  Calls: `isTeamWinnerRule` (from `app/utils/playoffs-rule-helper`)
  Tests: (covered indirectly through `buildOrderedBracketRounds` tests)

- **`buildOrderedBracketRounds(mainStages: ReadonlyArray<PlayoffRound & { games: ReadonlyArray<{ game_id: string }> }>, gamesMap: { [gameId: string]: ExtendedGameData }, gamesByNumber: { [gameNumber: number]: ExtendedGameData }): BracketRound[]`**
  Signature: `(mainStages: ReadonlyArray<PlayoffRound & { games: ReadonlyArray<{ game_id: string }> }>, gamesMap: { [gameId: string]: ExtendedGameData }, gamesByNumber: { [gameNumber: number]: ExtendedGameData }) => BracketRound[]`
  Returns a `BracketRound[]` where each round's `games` array is ordered according to the actual bracket tree (traversal from final backwards). Replaces the inline useMemo mapping in `PlayoffsBracketView`.
  Calls: `orderRoundByLaterGames`
  Tests:
  - returns single-round bracket games in original order (no TeamWinnerRule pointers exist for first round)
  - correctly orders a 2-round bracket when round-1 games are cross-referenced by round-2 via TeamWinnerRule
  - correctly orders a 4-round (16-game) bracket by full tree traversal
  - appends unplaced games (GroupFinishRule only, no TeamWinnerRule pointing to them) at end of their round
  - skips game references pointing outside the current round's game set (cross-round or missing game_number)
  - confirms `isTeamWinnerRule` correctly identifies the runtime shape of `home_team_rule`/`away_team_rule`

---

### `app/components/results-page/playoffs-bracket-view.tsx` *(modified)*

**Changed logic:**

- **`bracketRounds` useMemo** *(was: `mainStages.map(stage => ({ ..., games: stage.games.map(gId => gamesMap[gId]).filter(...) }))` )*
  Now: calls `buildOrderedBracketRounds(mainStages, gamesMap, gamesByNumber)`. Added dependency: `gamesByNumber`.

- **`gamesByNumber` useMemo** *(new memoized value)*
  Computes `{ [game_number]: ExtendedGameData }` from `gamesMap` for efficient lookup. Dependency: `gamesMap`.

## Visual Prototype

No UI changes — this is a data-ordering fix. The visual output (cards + SVG lines) uses the same rendering logic; only the order of games fed into that logic changes.

## Testing Strategy

**New tests in `bracket-layout-utils.test.ts`** (6 cases):
1. Single-round: no TeamWinnerRule → games in original order
2. Two-round with cross references → earlier round reordered correctly (non-sequential game_numbers)
3. Full 4-round bracket → all rounds in correct tree order
4. Mixed rules (first round has GroupFinishRule games, no feeder pointers) → graceful append
5. Missing/cross-round game_number reference → not placed (treated as missing), remaining games appended
6. Runtime type confirmation: `isTeamWinnerRule` correctly identifies `home_team_rule` objects with `{ game, winner }` shape

**Existing tests:** all 37 `bracket-layout-utils` tests and 31 `playoffs-bracket-view` tests should still pass with no changes needed (the new function is additive; the existing layout util functions are unchanged).

**Manual verification:** In Vercel Preview, open the Results → Playoffs tab and confirm:
- Round of 16 game 1 visually connects to its actual Round of 32 feeders (not just games 1 & 2 by number)
- SVG lines draw correct bracket structure

## Open Questions / Out of Scope

- No database schema or seed data changes
- No changes to how playoff stages are fetched
- No changes to `BracketGameCard` rendering

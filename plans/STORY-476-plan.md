# Story 476 — Bug: Playoff games beyond Round of 16 show predicted team names instead of actual teams

## Objective
Fix winner propagation in the playoff bracket so that when an admin publishes a playoff game's result, the next-round game automatically displays the correct advancing team — not the logged-in user's prediction.

## Problem / Root Cause

There are **two bugs** in `app/actions/backoffice-actions.ts`, both in how `calculateAndSavePlayoffGamesForTournament` is invoked and what it does:

### Bug 1 — `saveGamesAndRecalculate` skips playoff games entirely

```typescript
const groupGame = games.find(g => g.group);
if (groupGame) {
  // ... recalculate group positions ...
  await calculateAndSavePlayoffGamesForTournament(tournamentId); // ← only called for group games
}
```

When a playoff game result is published (R32, QF, SF), `groupGame` is `null`, so `calculateAndSavePlayoffGamesForTournament` is never triggered. Teams for the next round are never set.

### Bug 2 — `calculateAndSavePlayoffGamesForTournament` only processes `playoffStages[0]`

```typescript
const firstPlayoffStage = playoffStages[0]
const calculatedTeamsPerGame = await calculatePlayoffTeams(...)
return Promise.all(firstPlayoffStage.games.map(async (game) => {
  return updateGame(game.game_id, { ... }) // ← only stage 0 games updated
}))
```

Even if called, it only populates the first playoff stage (R32, seeded from group positions). Stages 1+ (R16, QF, SF, Final) are never touched.

### Display consequence
`getTeamNames()` in `team-name-helper.ts` falls back to `gameGuess?.home_team` when `game.home_team` is null. So users see their own prediction team names, not the real advancing team.

---

## Technical Approach

### Fix 1 — Trigger propagation for playoff games in `saveGamesAndRecalculate`

Add a check alongside the existing group-game check:

```typescript
const playoffGame = games.find(g => g.playoffStage && g.gameResult && !g.gameResult.is_draft);
if (playoffGame) {
  await calculateAndSavePlayoffGamesForTournament(tournamentId);
}
```

This ensures publishing any playoff game result triggers downstream winner propagation.

### Fix 2 — Loop through all playoff stages in `calculateAndSavePlayoffGamesForTournament`

After updating stage 0 (existing logic, unchanged), loop through stages 1..N:

For each game in stage N:
- Read `home_team_rule` and `away_team_rule` (both `TeamWinnerRule: { game: number, winner: boolean }`)
- Find the source game by `game_number` in a `gamesByNumber` lookup
- Check if the source game has a published result in `gameResultMap`
- Derive winner or loser team ID from the result scores
- Call `updateGame(game_id, { home_team, away_team })`
- Update the local `gamesMap` so subsequent stages can chain correctly (stage 2 needs stage 1's updated team IDs)

Stages must be processed **sequentially** (stage 1 fully before stage 2) because each stage depends on the prior stage's resolved teams.

### New private helpers — `getWinnerTeamId` / `getLoserTeamId`

`home_score` and `away_score` in `GameResultNew` represent the full-time + extra-time aggregate (standard in this codebase). `home_penalty_score` / `away_penalty_score` are the shootout scores and are only non-null when the match went to penalties.

```typescript
function getWinnerTeamId(result: GameResultNew, game: Game): string | null {
  const home = result.home_score ?? 0;
  const away = result.away_score ?? 0;
  if (home > away) return game.home_team ?? null;
  if (away > home) return game.away_team ?? null;
  // Tied after regular + extra time — use penalty shootout
  const homePen = result.home_penalty_score ?? 0;
  const awayPen = result.away_penalty_score ?? 0;
  if (homePen > awayPen) return game.home_team ?? null;
  if (awayPen > homePen) return game.away_team ?? null;
  return null; // Game not yet fully resolved
}

function getLoserTeamId(result: GameResultNew, game: Game): string | null {
  const winner = getWinnerTeamId(result, game);
  if (!winner) return null;
  return winner === game.home_team ? (game.away_team ?? null) : (game.home_team ?? null);
}
```

`TeamWinnerRule.winner = false` (used for 3rd-place game) routes through `getLoserTeamId`. The stage loop selects explicitly:
```typescript
const teamId = rule.winner
  ? getWinnerTeamId(result, sourceGame)
  : getLoserTeamId(result, sourceGame);
```

### Stage chaining — in-memory gamesMap update

After processing each stage, we mutate `gamesMap` and a parallel `gamesByNumber` lookup in-memory (no DB re-fetch needed). Both maps are updated together:

```typescript
const updateLocalGame = (game_id: string, game_number: number, home_team: string | null, away_team: string | null) => {
  const updated = { ...gamesMap[game_id], home_team, away_team };
  gamesMap[game_id] = updated;
  gamesByNumber[game_number] = updated;
};
```

This ensures stage 2 lookups via `gamesByNumber[rule.game]` return the teams resolved in stage 1.

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `app/actions/backoffice-actions.ts` | Fix `saveGamesAndRecalculate` + `calculateAndSavePlayoffGamesForTournament` + add `getWinnerTeamId` helper |

No UI changes needed — this is a backend-only fix.

---

## Mid-Level Design

### Call Graph Changes

**No new flows.** Existing flow:
- `saveAndPublishSingleGameResult` → `saveGamesAndRecalculate` → `calculateAndSavePlayoffGamesForTournament`

This path now also fires when the game being saved has `playoffStage` (not just `group`).

### `app/actions/backoffice-actions.ts` *(modified)*

**New private functions:**

- **`getWinnerTeamId(result: GameResultNew, game: Game): string | null`**
  Returns the team_id of the winning team based on the published result's scores and penalty scores. Returns null if the outcome cannot be determined.
  Tests:
  - returns `game.home_team` when `home_score > away_score`
  - returns `game.away_team` when `away_score > home_score`
  - returns `game.home_team` when tied on regular scores but `home_penalty_score > away_penalty_score`
  - returns `game.away_team` when tied on regular scores but `away_penalty_score > home_penalty_score`
  - returns `null` when both scores are tied and no penalties are set
  - returns `null` when `game.home_team` is null (teams not yet assigned)

- **`getLoserTeamId(result: GameResultNew, game: Game): string | null`**
  Returns the team_id of the losing team (used for 3rd-place game `winner: false` rules).
  Tests:
  - returns `game.away_team` when home team wins on score
  - returns `game.home_team` when away team wins on penalties
  - returns `null` when `getWinnerTeamId` returns null (game unresolved)

**Changed functions:**

- **`saveGamesAndRecalculate(games, tournamentId, locale)`** *(behavior change)*
  Now also calls `calculateAndSavePlayoffGamesForTournament` when any game in the batch has a `playoffStage` and a published (non-draft) `gameResult`.
  Calls: `saveGameResults`, `findGamesInGroup`, `findTeamsInGroup`, `findTournamentById`, `calculateAndStoreGroupPosition`, `calculateAndSavePlayoffGamesForTournament`, `calculateAndStoreQualifiedTeamsScores`, `calculateGameScores`
  Tests:
  - calls `calculateAndSavePlayoffGamesForTournament` when batch contains a published playoff game
  - does NOT call `calculateAndSavePlayoffGamesForTournament` when playoff game is still draft
  - still calls `calculateAndSavePlayoffGamesForTournament` for group games (existing behavior preserved)
  - calls `calculateAndSavePlayoffGamesForTournament` once when batch contains both a group game and a published playoff game
  - does NOT call `calculateAndSavePlayoffGamesForTournament` when playoff game has no gameResult

- **`calculateAndSavePlayoffGamesForTournament(tournamentId)`** *(behavior change)*
  After processing stage 0 (unchanged), iterates through `playoffStages[1..N]` sequentially. For each game, resolves `home_team` and `away_team` by looking up the source game via `TeamWinnerRule.game` (game_number), reading its published result, and calling `getWinnerTeamId`/`getLoserTeamId`. Updates DB and local `gamesMap` (and `gamesByNumber`) so chains work across stages. If a source game's result is absent or draft, sets team to `null`. If a game's rule is not a `TeamWinnerRule`, skips it (safety guard). Stage 0 logic is not modified.
  Calls: `findGroupsWithGamesAndTeamsInTournament`, `findGamesInTournament`, `findPlayoffStagesWithGamesInTournament`, `findGameResultByGameIds`, `calculatePlayoffTeams`, `updateGame`, `getWinnerTeamId`, `getLoserTeamId`, `isTeamWinnerRule`
  Tests:
  - updates stage 1 game home/away teams when stage 0 results are all published
  - leaves stage 1 game teams as null when stage 0 results are not yet published
  - correctly assigns loser team for `winner: false` rules (3rd-place game)
  - chains correctly through 3 stages when all prior results are published
  - stage 0 logic is unchanged when no subsequent stages exist
  - leaves team as null when source game is referenced by rule but has no result in gameResultMap
  - skips games whose rules are not TeamWinnerRule (safety guard)

---

## Implementation Steps

1. Add private `getWinnerTeamId(result, game)` and `getLoserTeamId(result, game)` helpers (file-private, not exported)
2. Modify `saveGamesAndRecalculate`: add playoff-game trigger alongside existing group-game trigger
3. Modify `calculateAndSavePlayoffGamesForTournament`: build `gamesByNumber` lookup, add `updateLocalGame` helper, update stage 0 to call `updateLocalGame`, add sequential `for` loop for stages 1..N

---

## Testing Strategy

**Unit tests** — extend existing `app/actions/__tests__/backoffice-actions.test.ts` or create it:

- Use `testFactories.game()`, `testFactories.gameResult()` for all mock data
- Mock DB functions (`updateGame`, `findGamesInTournament`, etc.) via `vi.mock`
- `getWinnerTeamId` / `getLoserTeamId`: pure functions, no mocking needed
- `saveGamesAndRecalculate`: mock `calculateAndSavePlayoffGamesForTournament` with `vi.fn()` to verify call/no-call
- `calculateAndSavePlayoffGamesForTournament`: mock `findGamesInTournament`, `findPlayoffStagesWithGamesInTournament`, `findGameResultByGameIds`, `calculatePlayoffTeams`, `updateGame`; verify `updateGame` receives correct team IDs for stage 1+ games

---

## Validation

1. In dev: publish a R32 game result in the backoffice → verify QF game's bracket shows the correct team name
2. Quick score wizard: publish a R32 game → verify bracket updates
3. Verify 3rd-place game: after SF results, 3rd-place game shows the two losing teams
4. Run `npm run test` — all existing tests pass, new tests pass
5. Run `npm run build` — no type errors
6. Run `npm run lint` — no lint issues

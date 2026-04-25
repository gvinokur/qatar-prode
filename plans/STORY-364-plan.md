# Story #364 Plan: Goal Difference Scoring Tier

## Story Context
- **Issue:** #364 — Goal Difference Scoring Tier
- **Branch:** `feature/story-364`
- **Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-364`

## Problem

The current scoring system has only two game prediction tiers:
- **Correct Outcome** (default 1 pt): correct winner/draw direction
- **Exact Score** (default 2 pts): exact score match

There is no reward for predictions that got the exact margin right (e.g., predicted 2-1, actual 3-2 — both "home win by 1"). Adding a "Exact Goal Difference" middle tier improves competitive depth.

## Acceptance Criteria

- [ ] Admins can set `game_correct_goal_difference_points` per tournament in Backoffice (default: 2)
- [ ] Scoring logic awards goal difference tier: same winner AND same margin (home_score - away_score), higher than correct outcome but lower than exact score (non-cumulative, highest tier wins)
- [ ] Ties with different scores (1-1 vs 2-2) receive goal difference points
- [ ] Playoff games ending in ties: user must have correctly predicted the penalty winner to receive goal difference tier
- [ ] Game cards and flippable cards show "Misma Diferencia de Gol" badge when applicable
- [ ] Rules explanation widget includes the new tier
- [ ] Stats page accuracy card includes "Misma diferencia de gol" row alongside "Exactos"
- [ ] Full i18n (es + en)

## Technical Approach

### Core Design Decision: `prediction_tier` column in `game_guesses`

The `game_guesses.score` column stores the actual point *value* (e.g., 2). Since goal difference and exact score can award the same points (both default to 2), a separate `prediction_tier` column is required to distinguish them in stats queries.

**Scoring tier values:** `'exact' | 'goal_difference' | 'correct' | 'missed'`

**Existing stats queries** currently determine "exact" by checking `score > 1`. After this story, they must check `prediction_tier = 'exact'` instead. For backward compat with existing rows (where `prediction_tier` is NULL), the query falls back: `prediction_tier = 'exact' OR (prediction_tier IS NULL AND score > 1)`.

### Goal Difference Logic

Goal difference check happens between exact score check and correct outcome check:

```
if predicted_home == actual_home && predicted_away == actual_away → EXACT
elif (actual_home - actual_away) == (predicted_home - predicted_away) → GOAL_DIFFERENCE  [same margin implies same winner]
elif sign(predicted_diff) == sign(actual_diff) → CORRECT
else → MISSED
```

For playoff penalty scenarios: the existing `checkPlayoffPenaltyScenarios()` helper awards `correct_outcome_points`. No changes needed there — the goal difference check fires before it, so if margin matches, user gets GD points instead.

For tie predictions in playoff (penalty winner required): goal difference check inherits the penalty winner validation from the surrounding logic.

### New Score Values Stored

`calculateScoreForGame()` now returns `{ score: number; tier: PredictionTier }`.
- Callers in `backoffice-actions.ts` destructure and pass `tier` to the updated `updateGameGuessWithBoost()`.
- `prediction_tier` is written to `game_guesses` on every score calculation.

## Files to Create / Modify

### New Files
- `migrations/20260425000000_add_goal_difference_scoring.sql` — adds `game_correct_goal_difference_points` to `tournaments` and `prediction_tier` + accuracy counts to `game_guesses`/`tournament_guesses`
- `app/components/tournament-page/rules-examples/goal-difference.tsx` — new rules example component

### Modified Files

| File | Change |
|------|--------|
| `app/db/tables-definition.ts` | Add `game_correct_goal_difference_points` to TournamentTable; add `prediction_tier` to GameGuessTable; add `total_goal_difference_guesses`, `group_goal_difference_guesses`, `playoff_goal_difference_guesses` to TournamentGuessTable |
| `app/utils/scoring-config.ts` | Add `game_correct_goal_difference_points: number` to `ScoringConfig` and `DEFAULT_SCORING` |
| `app/utils/game-score-calculator.ts` | Add `checkGoalDifferenceMatch()` helper; update `calculateScoreForGame()` to return `{ score: number; tier: PredictionTier }` |
| `app/db/game-guess-repository.ts` | Update `updateGameGuessWithBoost()` to accept `tier`; update `legacyGetGameGuessStatisticsForUsers()` to aggregate `goal_difference_guesses` using `prediction_tier` |
| `app/db/tournament-guess-repository.ts` | Update `recalculateGameScoresForUsers()` to materialize `total_goal_difference_guesses`, `group_goal_difference_guesses`, `playoff_goal_difference_guesses` |
| `app/actions/backoffice-actions.ts` | Pass `game_correct_goal_difference_points` to scoring config; destructure `{ score, tier }` from calculator |
| `app/actions/tournament-scoring-actions.ts` | Include `game_correct_goal_difference_points` in fetch/update/recommended logic |
| `app/utils/stats-calculations.ts` | Add `overallGoalDifference` + `group/playoff` variants to `AccuracyStats` type and `calculateAccuracyStats()` |
| `app/components/tournament-stats/prediction-accuracy-card.tsx` | Add "Misma diferencia de gol" row to overall + phase breakdowns |
| `app/components/actual-result-display.tsx` | Add `'goal_difference'` to `PredictionResult` type; update label + icon logic |
| `app/components/compact-game-view-card.tsx` | Add `'goal_difference'` to `calculatePredictionResult()` return type and logic |
| `app/components/tournament-page/rules.tsx` | Add goal difference rule entry between winnerDraw and exactScore; import new example |
| `app/components/backoffice/tournament-scoring-config-tab.tsx` | Add `game_correct_goal_difference_points` field between outcome and exact fields |
| `locales/es/predictions.json` | Add `predictionResultGoalDifference` key |
| `locales/en/predictions.json` | Add `predictionResultGoalDifference` key |
| `locales/es/rules.json` | Add `goalDifference` rule key |
| `locales/en/rules.json` | Add `goalDifference` rule key |
| `locales/es/stats.json` | Add `goalDifference` accuracy key |
| `locales/en/stats.json` | Add `goalDifference` accuracy key |

## Visual Prototype

### Game Result Badge (ActualResultDisplay)

```
┌─────────────────────────────────────────────┐
│           RESULTADO REAL                    │
│                                             │
│   Argentina    3 - 2    Brasil              │
│                                             │
│   ┌─────────────────────────────────┐       │
│   │ ≈  Misma Diferencia (2 pts)     │       │
│   └─────────────────────────────────┘       │
│         [badge color: warning/amber]        │
└─────────────────────────────────────────────┘
```

**Badge Colors:**
- `exact` → primary/blue (existing)
- `goal_difference` → warning/amber (new, visually between correct and exact)
- `correct` → success/green (existing)
- `incorrect` → error/red (existing)

**Icon for goal_difference:** `CompareArrowsIcon` or `DragHandleIcon` (representing "same difference")

### Backoffice Scoring Config

New field inserted between "Correct Outcome Points" and "Exact Score Points":

```
┌─────────────────────────────────────────────┐
│ Game Prediction Scoring                     │
├─────────────────────────────────────────────┤
│ Correct Outcome Points    [1]  Rec: 1       │
│ Goal Difference Points    [2]  Rec: 2       │  ← NEW
│ Exact Score Points        [2]  Rec: 2       │
│ Champion Points           [5]  Rec: 5       │
│ ...                                         │
└─────────────────────────────────────────────┘
```

### Stats Accuracy Card

New "Misma diferencia de gol" row in the Overall Accuracy section:

```
PRECISIÓN GENERAL
  Resultado Correcto    45 / 64  (70.3%)
  Misma Diferencia      12 / 64  (18.7%)   ← NEW
  Marcador Exacto        8 / 64  (12.5%)
  Falladas               19 / 64  (29.7%)
```

### Rules Display

New rule entry between winnerDraw and exactScore:

```
• 2 Puntos por misma diferencia de gol (ejemplo accordion)
```

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow: Game scoring pipeline** — `calculateScoreForGame()` now returns `{ score, tier }` instead of `number`; `updateGameGuessWithBoost()` writes `prediction_tier` column; `recalculateGameScoresForUsers()` materializes goal_difference counts

**No new flows.**

---

### `app/utils/game-score-calculator.ts` *(modified)*

**Type additions:**

- **`PredictionTier`**: `'exact' | 'goal_difference' | 'correct' | 'missed'`
  Exported type representing the prediction result category.

- **`ScoreResult`**: `{ score: number; tier: PredictionTier }`
  Return type of `calculateScoreForGame`.

**New functions:**

- **`checkGoalDifferenceMatch(gameHomeScore, gameAwayScore, gameGuess, homePenaltyWin, awayPenaltyWin, goalDiffPoints)`**: `{ score: number; tier: PredictionTier } | null`
  Returns goal_difference score+tier when `(gameHomeScore - gameAwayScore) === (gameGuess.home_score! - gameGuess.away_score!)`. Applies same penalty winner validation as checkExactMatch. Returns null when margin doesn't match.
  Calls: (no project functions)
  Tests:
  - returns null when goal difference does not match (e.g. 2-1 vs 3-0)
  - returns goal_difference tier when home-win margins match (e.g. 3-2 vs 2-1)
  - returns goal_difference tier when both are draws (2-2 vs 0-0)
  - returns 0 points (not null) when margin matches but wrong penalty winner in playoff
  - returns goal_difference tier when margins match and penalty winner is correct

**Changed functions:**

- **`checkExactMatch(...)`**: `{ score: number; tier: PredictionTier } | null` *(was: `number | null`)*
  Now returns typed object. Same logic, tier always 'exact'.
  Tests: (existing behavior, just typed change — no new test cases needed)

- **`checkCorrectOutcome(...)`**: `{ score: number; tier: PredictionTier } | null` *(was: `number | null`)*
  Now returns typed object. Same logic, tier always 'correct'.
  Tests: (existing behavior)

- **`checkPlayoffPenaltyScenarios(...)`**: `{ score: number; tier: PredictionTier } | null` *(was: `number | null`)*
  Now returns typed object. Same logic, tier always 'correct'.
  Tests: (existing behavior)

- **`calculateScoreForGame(game, gameGuess, scoringConfig)`**: `ScoreResult` *(was: `number`)*
  Now takes `game_correct_goal_difference_points` from scoringConfig (defaults to 2). Inserts `checkGoalDifferenceMatch()` call between `checkExactMatch` and `checkCorrectOutcome`. Returns `{ score, tier }` in all branches.
  Calls: checkExactMatch, checkGoalDifferenceMatch, checkCorrectOutcome, checkPlayoffPenaltyScenarios, hasValidScores, getPenaltyWinners
  Tests:
  - returns `{ score: 0, tier: 'missed' }` for completely wrong prediction
  - returns `{ score: goal_diff_pts, tier: 'goal_difference' }` when margin matches but score differs
  - returns `{ score: exact_pts, tier: 'exact' }` for exact score match
  - returns `{ score: outcome_pts, tier: 'correct' }` for correct outcome only
  - goal_difference overrides correct_outcome when margin matches
  - playoff tie with wrong penalty winner returns `{ score: 0, tier: 'missed' }`
  - playoff tie with correct penalty winner and matching margin returns goal_difference

---

### `app/db/tables-definition.ts` *(modified)*

**No new functions.** Type-only additions:
- `TournamentTable`: add `game_correct_goal_difference_points?: number`
- `GameGuessTable`: add `prediction_tier?: 'exact' | 'goal_difference' | 'correct' | 'missed' | null`
- `TournamentGuessTable`: add `total_goal_difference_guesses?: number`, `group_goal_difference_guesses?: number`, `playoff_goal_difference_guesses?: number`

---

### `app/utils/scoring-config.ts` *(modified)*

**Changed:**
- `ScoringConfig`: add `game_correct_goal_difference_points: number`
- `DEFAULT_SCORING`: add `game_correct_goal_difference_points: 2`

Tests: (existing tests; the field addition is non-breaking)

---

### `app/db/game-guess-repository.ts` *(modified)*

**Changed functions:**

- **`updateGameGuessWithBoost(guessId, baseScore, boostType, tier)`**: `Promise<GameGuess>` *(was: no `tier` param)*
  Now also writes `prediction_tier` to the row.
  Calls: db.updateTable
  Tests:
  - writes prediction_tier to row alongside score and boost fields
  - existing behavior for score/boost unchanged

- **`legacyGetGameGuessStatisticsForUsers(userIds, tournamentId)`**: (existing return type + new `goal_difference_guesses` field)
  Adds aggregation: `count where prediction_tier = 'goal_difference' OR (prediction_tier IS NULL AND score = <goal_diff_sentinel>)`. Since `goal_difference` tier can have the same point value as exact, the query uses `prediction_tier` column directly: `CASE WHEN prediction_tier = 'goal_difference' THEN 1 ELSE 0 END`.
  Calls: db.selectFrom
  Tests:
  - counts goal_difference_guesses correctly when prediction_tier = 'goal_difference'
  - backward compat: rows with NULL prediction_tier counted as 0 goal_difference_guesses (pre-migration rows)

---

### `app/db/tournament-guess-repository.ts` *(modified)*

**Changed functions:**

- **`recalculateGameScoresForUsers(userIds, tournamentId)`**: `Promise<TournamentGuess[]>` *(interface unchanged)*
  Materializes `total_goal_difference_guesses`, `group_goal_difference_guesses`, `playoff_goal_difference_guesses` from stats.
  Calls: legacyGetGameGuessStatisticsForUsers, updateTournamentGuessByUserIdTournament
  Tests:
  - materializes goal_difference counts alongside existing accuracy counts
  - (existing update logic unchanged)

---

### `app/utils/stats-calculations.ts` *(modified)*

**Changed:**

- **`AccuracyStats`** type: add `overallGoalDifference`, `overallGoalDifferencePercentage`, `groupGoalDifference`, `groupGoalDifferencePercentage`, `playoffGoalDifference`, `playoffGoalDifferencePercentage`

- **`calculateAccuracyStats(userGameStats, totalPredictionsMade, totalGamesAvailable, totalGamesPlayed)`**: `AccuracyStats`
  Accepts `total_goal_difference_guesses`, `group_goal_difference_guesses`, `playoff_goal_difference_guesses` from `userGameStats`. Computes new percentage fields.
  Tests:
  - returns 0 for goal_difference counts when not present in userGameStats (backward compat)
  - correctly computes overallGoalDifferencePercentage
  - existing fields unaffected

---

### `app/components/compact-game-view-card.tsx` *(modified)*

**Changed functions:**

- **`calculatePredictionResult(predictedHome, predictedAway, actualHome, actualAway, penaltyOptions?)`**: `'exact' | 'goal_difference' | 'correct' | 'incorrect'` *(was: `'exact' | 'correct' | 'incorrect'`)*
  Adds goal_difference check between exact and correct checks: `(actualHome - actualAway) === (predictedHome - predictedAway)`. For playoff ties, applies penalty winner check before awarding goal_difference.
  Tests:
  - returns 'goal_difference' when margin matches but score differs (e.g. 3-2 vs 2-1)
  - returns 'goal_difference' for both-draw with different scores (2-2 vs 0-0)
  - returns 'correct' when same winner direction but margin differs
  - returns 'incorrect' for different winner
  - playoff tie: returns 'goal_difference' when margin=0 matches and penalty winner correct
  - playoff tie: returns 'incorrect' when margin=0 but wrong penalty winner

---

### `app/components/actual-result-display.tsx` *(modified)*

**Changed:**
- `PredictionResult` type: `'exact' | 'goal_difference' | 'correct' | 'incorrect'`
- `getPredictionResultLabel()`: add `goal_difference` case using `t('game.predictionResultGoalDifference', { points })`
- `getPredictionResultIcon()`: add `goal_difference` → `CompareArrowsIcon` (amber color)
- Badge color: `goal_difference` → `warning` MUI color

Tests:
- renders amber badge with "Misma Diferencia" label for goal_difference result
- (existing exact/correct/incorrect rendering unchanged)

---

### `app/components/tournament-page/rules.tsx` *(modified)*

**Changed:**
- `getRules()`: Insert new rule between winnerDraw and exactScore when `config.game_correct_goal_difference_points > 0`
- Import `GoalDifferenceExample` component

Tests:
- renders goal difference rule when points > 0
- does not render goal difference rule when points = 0

---

### `app/actions/tournament-scoring-actions.ts` *(modified)*

**Changed functions:**

- **`getTournamentScoringConfigAction(tournamentId)`**: `Promise<ScoringConfig>` *(interface unchanged)*
  Includes `game_correct_goal_difference_points` in returned config.

- **`updateTournamentScoringConfigAction(tournamentId, config)`**: (interface unchanged)
  Writes `game_correct_goal_difference_points` to tournament.

- **`getRecommendedScoringValues(tournamentId)`**: `Promise<ScoringConfig>` *(interface unchanged)*
  Returns recommended value for `game_correct_goal_difference_points` (= 2, between outcome and exact score, matching exact score default).

Tests:
- getTournamentScoringConfigAction includes game_correct_goal_difference_points = 2 by default
- updateTournamentScoringConfigAction persists game_correct_goal_difference_points

---

### `app/components/backoffice/tournament-scoring-config-tab.tsx` *(modified)*

**Changed:**
- Local `ScoringConfig` interface: add `game_correct_goal_difference_points: number`
- `scoringFields` array: insert `{ key: 'game_correct_goal_difference_points', label: 'Goal Difference Points', description: 'Points for correct winner with exact goal margin' }` between outcome and exact fields

Tests:
- (visual only — covered by existing component structure)

---

### `app/components/tournament-stats/prediction-accuracy-card.tsx` *(modified)*

**Changed:**
- Props interface: add `overallGoalDifference`, `overallGoalDifferencePercentage`, `groupGoalDifference`, `groupGoalDifferencePercentage`, `playoffGoalDifference`, `playoffGoalDifferencePercentage`
- Render: add "Misma Diferencia" rows in overall and stage breakdowns

Tests:
- renders goal_difference row with correct count and percentage

---

## Migration

### `migrations/20260425000000_add_goal_difference_scoring.sql`

```sql
-- Add goal difference scoring config to tournaments
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS game_correct_goal_difference_points INTEGER DEFAULT 2;

-- Add prediction tier to game_guesses (nullable for backward compat)
ALTER TABLE game_guesses 
ADD COLUMN IF NOT EXISTS prediction_tier VARCHAR(20);

-- Add goal difference accuracy counts to tournament_guesses
ALTER TABLE tournament_guesses 
ADD COLUMN IF NOT EXISTS total_goal_difference_guesses INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS group_goal_difference_guesses INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS playoff_goal_difference_guesses INTEGER NOT NULL DEFAULT 0;

-- Backfill prediction_tier for existing rows based on current score values
-- score = null → NULL (not yet calculated)
-- score = 0 → 'missed'
-- score = 1 → 'correct' (was correct outcome tier)
-- score > 1 → 'exact' (was exact score tier; no GD data exists pre-migration)
UPDATE game_guesses SET prediction_tier = 
  CASE 
    WHEN score IS NULL THEN NULL
    WHEN score = 0 THEN 'missed'
    WHEN score = 1 THEN 'correct'
    ELSE 'exact'
  END
WHERE prediction_tier IS NULL;
```

**Note:** Admins who want retroactive goal_difference recalculation for existing tournaments can retrigger score calculation from the Backoffice (out of scope per story requirements, but the recalculation pipeline will auto-set `prediction_tier` correctly going forward).

## Testing Strategy

### Unit Tests (per `/test-engineer` skill)

**New test files:**
- `app/utils/__tests__/game-score-calculator.test.ts` — comprehensive tests for `checkGoalDifferenceMatch()` and updated `calculateScoreForGame()` return type
- `app/components/__tests__/compact-game-view-card-goal-diff.test.tsx` — `calculatePredictionResult()` goal_difference scenarios
- `app/utils/__tests__/stats-calculations-goal-diff.test.ts` — `calculateAccuracyStats()` with goal_difference fields

**Existing test files to update:**
- Any tests that assert `calculateScoreForGame()` returns a `number` → update to destructure `{ score }`
- Any tests that assert `calculatePredictionResult()` return type to include `'goal_difference'`

### Coverage Requirement
- ≥80% on all modified files
- Goal difference logic: 100% branch coverage (it's the core algorithmic change)

## Validation Checklist (SonarCloud)

- 0 new issues (no `any` types, no unused vars)
- New `prediction_tier` column: no raw string — use exported `PredictionTier` type
- `calculateScoreForGame()` return type is a proper named type, not inline `{ score: number; tier: string }`
- All `legacyGetGameGuessStatisticsForUsers` changes preserve the `LEGACY` comment warning

## Implementation Waves

### Wave 1 (foundation — no UI)
- Migration file
- `tables-definition.ts` type updates
- `scoring-config.ts` + `game-score-calculator.ts` (logic)
- `game-guess-repository.ts` (updateGameGuessWithBoost + stats aggregation)
- `tournament-guess-repository.ts` (materialize new counts)
- `backoffice-actions.ts` (pass new config field)
- `tournament-scoring-actions.ts` (new field)
- `stats-calculations.ts` (AccuracyStats type)

### Wave 2 (UI)
- `actual-result-display.tsx` + `compact-game-view-card.tsx`
- `prediction-accuracy-card.tsx`
- `tournament-scoring-config-tab.tsx`
- `rules.tsx` + `goal-difference.tsx` example component

### Wave 3 (i18n + tests)
- All locales files (es + en)
- Unit tests

## Open Questions

None.

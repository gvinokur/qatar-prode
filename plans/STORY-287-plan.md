# Plan: Bug: Game card shows 'Exact' label when penalty winner prediction is wrong in playoff games (#287)

## Context

A bug in `calculatePredictionResult` causes game cards to display "Exact" even when the user predicted the correct score (e.g. 1-1) but the wrong penalty winner in a playoff game that went to penalties. The fix requires the function to receive optional penalty data and return 'incorrect' when scores match exactly but the penalty winner prediction is wrong.

The backend scoring logic is already correct (awards 0 points), so this is a UI display-only fix.

## Files to Modify

| File | Change |
|------|--------|
| `app/components/compact-game-view-card.tsx` | Update `calculatePredictionResult` signature + both call sites |
| `__tests__/utils/prediction-result.test.ts` | Add playoff penalty winner test cases |
| `docs/code-structure/components-tournament-games.md` | Update `calculatePredictionResult` entry |

## Technical Approach

### 1. Update `calculatePredictionResult` signature

Add 3 optional parameters:

```typescript
export function calculatePredictionResult(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  predictedHomePenaltyWinner?: boolean,   // true = user predicted home wins penalties
  actualHomePenaltyScore?: number | null,
  actualAwayPenaltyScore?: number | null
): 'exact' | 'correct' | 'incorrect'
```

### 2. Update function logic

Inside the `if (predictedHome === actualHome && predictedAway === actualAway)` branch, before returning `'exact'`, check:

```typescript
const gameWentToPenalties =
  actualHomePenaltyScore != null && actualAwayPenaltyScore != null;

if (gameWentToPenalties && predictedHomePenaltyWinner !== undefined) {
  const actualHomePenaltyWins = actualHomePenaltyScore > actualAwayPenaltyScore!;
  const predictedHomePenaltyWins = predictedHomePenaltyWinner === true;
  if (actualHomePenaltyWins !== predictedHomePenaltyWins) {
    return 'incorrect';
  }
}

return 'exact';
```

### 3. Update call site 1 — border color (line ~164)

```typescript
const result = calculatePredictionResult(
  homeScore!,
  awayScore!,
  specificProps.gameResult!.home_score!,
  specificProps.gameResult!.away_score!,
  isPlayoffGame && specificProps.isGameGuess ? specificProps.homePenaltyWinner : undefined,
  isPlayoffGame ? specificProps.gameResult?.home_penalty_score : undefined,
  isPlayoffGame ? specificProps.gameResult?.away_penalty_score : undefined
);
```

### 4. Update call site 2 — ActualResultDisplay predictionResult prop (line ~367)

```typescript
calculatePredictionResult(
  homeScore,
  awayScore,
  specificProps.gameResult!.home_score!,
  specificProps.gameResult!.away_score!,
  isPlayoffGame && specificProps.isGameGuess ? specificProps.homePenaltyWinner : undefined,
  isPlayoffGame ? specificProps.gameResult?.home_penalty_score : undefined,
  isPlayoffGame ? specificProps.gameResult?.away_penalty_score : undefined
)
```

Note: `specificProps.isGameGuess` guard is needed because `homePenaltyWinner` only exists on `GameGuessProps`. This follows the existing pattern at lines 342-343 and 379-380 of the same file.

## Mid-Level Design

### Call Graph Changes
No call graph changes. `calculatePredictionResult` is called only from within `compact-game-view-card.tsx`.

### `app/components/compact-game-view-card.tsx` *(modified)*

**Changed functions:**

- **calculatePredictionResult(predictedHome: number, predictedAway: number, actualHome: number, actualAway: number, predictedHomePenaltyWinner?: boolean, actualHomePenaltyScore?: number | null, actualAwayPenaltyScore?: number | null)**: `'exact' | 'correct' | 'incorrect'`
  Determines prediction accuracy. Now additionally returns `'incorrect'` when scores match exactly but game went to penalties and predicted penalty winner differs from actual. When `predictedHomePenaltyWinner` is `undefined` or game didn't go to penalties, behavior is unchanged.
  Calls: none
  Tests:
  - returns 'exact' when scores match and no penalty data provided (non-playoff, backward compat)
  - returns 'exact' when scores match, game went to penalties, and predicted home penalty winner is correct
  - returns 'exact' when scores match, game went to penalties, and predicted away penalty winner is correct
  - returns 'incorrect' when scores match, game went to penalties, and predicted home winner but away actually won
  - returns 'incorrect' when scores match, game went to penalties, and predicted away winner but home actually won
  - returns 'exact' when scores match and penalty scores are null/undefined (game didn't go to penalties)
  - returns 'exact' when scores match, game went to penalties, but predictedHomePenaltyWinner is undefined (user made no penalty winner pick — treated leniently)

## CODE-STRUCTURE Files to Update

- `docs/code-structure/components-tournament-games.md` — update `calculatePredictionResult` signature entry
- Call graph: NO update needed

## Testing Strategy

Add a new `describe('Playoff penalty winner')` block to `__tests__/utils/prediction-result.test.ts` with the 7 test cases listed above.

All existing tests must continue to pass (backward-compatible: new params are all optional).

Run `npm test -- --testPathPattern=prediction-result` to validate.

## Acceptance Criteria

- Game shows "Incorrect" when score matches (e.g. 1-1) but penalty winner prediction is wrong
- Game still shows "Exact" when score matches AND penalty winner prediction is correct (or game didn't go to penalties)
- All existing non-playoff tests unaffected
- Border color styling (success/error) matches the corrected label

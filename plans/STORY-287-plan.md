# Plan: Bug: Game card shows 'Exact' label when penalty winner prediction is wrong in playoff games (#287)

## Context

A bug in `calculatePredictionResult` causes game cards to display "Exact" even when the user predicted the correct score (e.g. 1-1) but the wrong penalty winner in a playoff game that went to penalties. The fix requires the function to receive optional penalty data and return 'incorrect' when:
- scores match exactly but the penalty winner prediction is wrong, OR
- scores match exactly but the user made no penalty winner prediction (incomplete prediction) and the game went to penalties.

The backend scoring logic is already correct (awards 0 points), so this is a UI display-only fix.

## Files to Modify

| File | Change |
|------|--------|
| `app/components/compact-game-view-card.tsx` | Update `calculatePredictionResult` signature + both call sites |
| `__tests__/utils/prediction-result.test.ts` | Add playoff penalty winner test cases |
| `docs/code-structure/components-tournament-games.md` | Update `calculatePredictionResult` entry |

## Technical Approach

### 1. Update `calculatePredictionResult` signature

Add 4 optional parameters (both predicted penalty winner props from `GameGuessProps`, plus actual penalty scores):

```typescript
export function calculatePredictionResult(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  predictedHomePenaltyWinner?: boolean,   // true = user predicted home wins penalties
  predictedAwayPenaltyWinner?: boolean,   // true = user predicted away wins penalties
  actualHomePenaltyScore?: number | null,
  actualAwayPenaltyScore?: number | null
): 'exact' | 'correct' | 'incorrect'
```

### 2. Update function logic

Inside the `if (predictedHome === actualHome && predictedAway === actualAway)` branch, before returning `'exact'`, check:

```typescript
const gameWentToPenalties =
  actualHomePenaltyScore != null && actualAwayPenaltyScore != null;

if (gameWentToPenalties) {
  const actualHomePenaltyWins = actualHomePenaltyScore > actualAwayPenaltyScore!;
  const userPredictedHomePenaltyWins = predictedHomePenaltyWinner === true;
  const userPredictedAwayPenaltyWins = predictedAwayPenaltyWinner === true;

  // Incomplete prediction: user didn't predict any penalty winner → incorrect
  if (!userPredictedHomePenaltyWins && !userPredictedAwayPenaltyWins) {
    return 'incorrect';
  }

  // Wrong penalty winner prediction → incorrect
  if (actualHomePenaltyWins !== userPredictedHomePenaltyWins) {
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
  isPlayoffGame && specificProps.isGameGuess ? specificProps.awayPenaltyWinner : undefined,
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
  isPlayoffGame && specificProps.isGameGuess ? specificProps.awayPenaltyWinner : undefined,
  isPlayoffGame ? specificProps.gameResult?.home_penalty_score : undefined,
  isPlayoffGame ? specificProps.gameResult?.away_penalty_score : undefined
)
```

Note: `specificProps.isGameGuess` guard is needed because `homePenaltyWinner`/`awayPenaltyWinner` only exist on `GameGuessProps`. This follows the existing pattern at lines 342-343 and 379-380 of the same file.

## Mid-Level Design

### Call Graph Changes
No call graph changes. `calculatePredictionResult` is called only from within `compact-game-view-card.tsx`.

### `app/components/compact-game-view-card.tsx` *(modified)*

**Changed functions:**

- **calculatePredictionResult(predictedHome: number, predictedAway: number, actualHome: number, actualAway: number, predictedHomePenaltyWinner?: boolean, predictedAwayPenaltyWinner?: boolean, actualHomePenaltyScore?: number | null, actualAwayPenaltyScore?: number | null)**: `'exact' | 'correct' | 'incorrect'`
  Determines prediction accuracy. Now additionally returns `'incorrect'` when scores match exactly and: (a) game went to penalties and user predicted wrong penalty winner, or (b) game went to penalties and user made no penalty winner prediction (incomplete). Fully backward-compatible — new params are all optional.
  Calls: none
  Tests:
  - returns 'exact' when scores match and no penalty data provided (non-playoff, backward compat)
  - returns 'exact' when scores match, game went to penalties, and predicted home penalty winner correctly
  - returns 'exact' when scores match, game went to penalties, and predicted away penalty winner correctly
  - returns 'incorrect' when scores match, game went to penalties, and predicted home winner but away actually won
  - returns 'incorrect' when scores match, game went to penalties, and predicted away winner but home actually won
  - returns 'incorrect' when scores match, game went to penalties, and neither penalty winner was predicted (incomplete prediction)
  - returns 'exact' when scores match and penalty scores are null/undefined (game didn't go to penalties, no params passed)

## CODE-STRUCTURE Files to Update

- `docs/code-structure/components-tournament-games.md` — update `calculatePredictionResult` signature entry
- Call graph: NO update needed

## Testing Strategy

Add a new `describe('Playoff penalty winner')` block to `__tests__/utils/prediction-result.test.ts` with the 7 test cases listed above.

All existing tests must continue to pass (backward-compatible: new params are all optional).

Run `npm test -- --testPathPattern=prediction-result` to validate.

## Acceptance Criteria

- Game shows "Incorrect" when score matches but penalty winner prediction is wrong
- Game shows "Incorrect" when score matches, game went to penalties, but no penalty winner was predicted (incomplete)
- Game still shows "Exact" when score matches AND penalty winner prediction is correct
- Game still shows "Exact" when score matches and game did NOT go to penalties
- All existing non-playoff tests unaffected
- Border color styling (success/error) matches the corrected label

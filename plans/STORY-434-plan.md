# Story 434: Backoffice publish validation for incomplete game scores

## Context

Admins can currently toggle a game result from draft → published regardless of whether score data is complete. This triggers standings and prediction-scoring calculations with missing data, producing incorrect results. The fix adds:
1. A **UI gate**: the publish checkbox is disabled (with tooltip) when scores are incomplete.
2. A **server-side guard**: `saveGameResults()` throws if it receives an incomplete result marked `is_draft: false`.

Two invalidity cases:
- **Partial scores**: home or away score is null/undefined.
- **Tied playoff without penalties**: playoff game where `home_score === away_score` but penalty scores are missing.

Draft saves remain unrestricted (out of scope).

---

## Files to Modify

| File | Change |
|------|--------|
| `app/utils/game-result-utils.ts` | **CREATE** — `isGameResultPublishable` pure utility |
| `app/actions/backoffice-actions.ts` | Add publish validation guard in `saveGameResults()` |
| `app/components/backoffice/backoffice-flippable-game-card.tsx` | Compute `canPublish`, pass to `CompactGameViewCard` |
| `app/components/compact-game-view-card.tsx` | Add `canPublish` prop; disable + retitle tooltip |
| `locales/en/predictions.json` | Add `game.incompleteResult` key |
| `locales/es/predictions.json` | Add `game.incompleteResult` key (Spanish) |
| `docs/code-structure/utils.md` | Add entry for `game-result-utils.ts` |
| `docs/code-structure/components-backoffice.md` | Update `BackofficeFlippableGameCard` signature |

---

## Mid-Level Design

### Call Graph Changes

No call graph changes. The new utility is called inline — no new cross-layer flows.

---

### `app/utils/game-result-utils.ts` *(NEW)*

**New functions:**

- **isGameResultPublishable(result: GameResultNew | null | undefined, isPlayoff: boolean)**: `boolean`
  Pure function. Returns `false` when result is missing, home_score is null/undefined, or away_score is null/undefined. For playoff games where `home_score === away_score`, also returns `false` when either penalty score is null/undefined. Otherwise returns `true`.
  Calls: *(none — pure function)*
  Tests:
  - returns false when result is null
  - returns false when home_score is missing
  - returns false when away_score is missing
  - returns true for group game with both scores set
  - returns true for playoff game where home wins (scores differ)
  - returns false for tied playoff game without penalty scores
  - returns true for tied playoff game with both penalty scores set

---

### `app/actions/backoffice-actions.ts` *(modified)*

**Changed functions:**

- **saveGameResults(gamesWithResults: ExtendedGameData[])**: `Promise<void>` *(was: no validation)*
  Now validates before any publish transition. If `game.gameResult.is_draft === false` and `isGameResultPublishable` returns `false`, throws `Error('Cannot publish incomplete result for game ${game.id}')`. Amendment flow (republish after score change) is also guarded the same way.
  Calls: findGameResultByGameId, updateGameResult, createGameResult, calculateGameScores, **isGameResultPublishable** *(new)*
  Tests:
  - throws when trying to publish with missing away score
  - throws when trying to publish a tied playoff game without penalty scores
  - does not throw when draft-saving an incomplete result
  - publishes successfully when all required scores are present

---

### `app/components/backoffice/backoffice-flippable-game-card.tsx` *(modified)*

**Changed functions:**

- **BackofficeFlippableGameCard({ game, teamsMap, isPlayoffs, onSave, onPublishToggle }: BackofficeFlippableGameCardProps)**: `JSX.Element` *(was: no canPublish derivation)*
  Now computes `canPublish = isGameResultPublishable(game.gameResult, isPlayoffs)` and passes it to `CompactGameViewCard`.
  Uses: isGameResultPublishable *(new import)*
  Tests:
  - passes canPublish=false to CompactGameViewCard when home score is missing
  - passes canPublish=false to CompactGameViewCard when tied playoff has no penalty scores
  - passes canPublish=true to CompactGameViewCard when all required scores are set

---

### `app/components/compact-game-view-card.tsx` *(modified)*

**Changed functions:**

- **CompactGameViewCard(...)**: `JSX.Element` *(changed: GameResultProps gains `canPublish?: boolean`)*
  When `canPublish === false`, the publish Checkbox is disabled and the wrapping Tooltip shows `t('game.incompleteResult')` instead of `t('game.isPublished')`.
  Tests:
  - disables publish checkbox when canPublish is false
  - shows incompleteResult tooltip when canPublish is false
  - shows isPublished tooltip and enabled checkbox when canPublish is true (existing behavior unchanged)

---

## Implementation Steps

1. **Create `app/utils/game-result-utils.ts`** with `isGameResultPublishable`.

2. **Update `saveGameResults()`** in `app/actions/backoffice-actions.ts`:
   - Import `isGameResultPublishable`
   - Before the `updateGameResult` call that sets `is_draft: false` (line 374), call `isGameResultPublishable` and throw if invalid
   - Also validate before setting a new `createGameResult` with `is_draft: false` (line 362)

3. **Update `BackofficeFlippableGameCard`**:
   - Import `isGameResultPublishable`
   - Derive `const canPublish = isGameResultPublishable(game.gameResult, isPlayoffs)`
   - Pass `canPublish` to `CompactGameViewCard` at line 183

4. **Update `CompactGameViewCard`**:
   - Add `canPublish?: boolean` to `GameResultProps` (line 56 area)
   - In the Tooltip + Checkbox block (lines 279–290): conditionally disable the Checkbox and change the tooltip title

5. **Add translation keys**:
   - `locales/en/predictions.json`: `"incompleteResult": "Cannot publish: scores are incomplete"`
   - `locales/es/predictions.json`: `"incompleteResult": "No se puede publicar: los marcadores están incompletos"`

6. **Update CODE-STRUCTURE layer files**:
   - `docs/code-structure/utils.md`: Add `game-result-utils.ts` entry
   - `docs/code-structure/components-backoffice.md`: Update `BackofficeFlippableGameCard` to note `canPublish` derivation

---

## Testing Strategy

**Unit tests (new file):** `app/utils/__tests__/game-result-utils.test.ts`
- 7 test cases covering all branches of `isGameResultPublishable`

**Integration tests (existing file):** `__tests__/actions/backoffice-actions.test.ts`
- 4 tests covering validation in `saveGameResults`

**Component tests (existing files):**
- `__tests__/components/backoffice/backoffice-flippable-game-card.test.tsx`: 3 tests for `canPublish` prop derivation
- `__tests__/components/backoffice/backoffice-game-result-edit-controls.test.tsx` or compact-game-view-card tests: 3 tests for disabled checkbox behavior

**Coverage target:** ≥80% on new code (pure utility function will be 100%).

---

## Verification

1. Start dev server: `npm run dev`
2. Navigate to backoffice game result editing
3. Enter only one score → publish toggle should be disabled with tooltip
4. Enter both scores (group game) → toggle should be enabled
5. Enter equal scores for a playoff game, no penalties → toggle disabled
6. Enter penalty scores → toggle enabled
7. Via API: attempt to POST publish with incomplete score → server should reject

Run: `npm run test`, `npm run lint`, `npm run build`

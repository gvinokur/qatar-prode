# Story 417 Plan: Locked games appear as predictable in header and backend allows saving post-deadline predictions

## Context

After the action-driven `PredictionStatusHeader` was introduced, the "unpredicted games" banner stopped filtering out games whose prediction deadline has already passed. This caused three cascading bugs: the header counts locked games as needing predictions, the "Predict Next" button navigates to locked games, and the backend has no deadline guard, so a prediction for a closed game can actually be saved. A fourth concern (direct-URL access showing games as editable) is already handled by `game-view.tsx` and requires no change.

## Acceptance Criteria

- [ ] The header banner does not count games whose deadline has passed as needing a prediction
- [ ] The "Predict Next" button does not navigate to a game whose deadline has passed
- [ ] The backend rejects saving a prediction for a game whose deadline has passed
- [ ] A user reaching a locked game via direct URL sees it as non-editable (already working — no change)

---

## Root Cause Analysis

| Bug | Location | Root Cause |
|-----|----------|------------|
| Header counts locked games | `games-header-variant.ts:246` | `unpredictedUrgentGames` only filters `!isGuessComplete()` — no deadline check |
| Predict Next opens locked game | `unified-games-page-client.tsx:101` | Compares `g.game_date >= now` instead of checking the actual deadline (`game_date - 1h`) |
| Backend saves past-deadline prediction | `guesses-actions.ts:18` | `updateOrCreateGameGuesses()` has zero deadline validation |
| Direct URL shows locked game as editable | `game-view.tsx:41` | **Already fixed** — `editDisabled = Date.now() + ONE_HOUR > game.game_date.getTime()` |

### Why `closingGames` contains locked games

`getGamesClosingWithin48Hours()` → `findGamesForDashboard()` returns games from the last 24h to the next 7 days. Games from the past 24h have already kicked off. The `prepareData()` function in `games-header-variant.ts` passes these straight into `urgentGames` without a deadline filter, so recently-started games with missing predictions appear as actionable.

---

## Technical Approach

Three targeted fixes, one per bug. No new files.

### Fix 1 — Header: filter locked games out of `unpredictedUrgentGames`

**File:** `app/components/prediction-status-header/games-header-variant.ts`

Add import for `calculateDeadline` and extend the filter on line 246:

```diff
+import { calculateDeadline } from '../../utils/countdown-utils';
 
 const unpredictedUrgentGames = urgentGames.filter(
-  g => !isGuessComplete(gameGuesses[g.id], !!g.playoffStage)
+  g => !isGuessComplete(gameGuesses[g.id], !!g.playoffStage)
+     && calculateDeadline(new Date(g.game_date)) > nowMs
 );
```

`nowMs` is already in scope (`const nowMs = now.getTime()` set earlier in `prepareData()`).

### Fix 2 — Predict Next: skip games whose deadline has passed

**File:** `app/components/unified-games-page-client.tsx`

Import `calculateDeadline` and replace the `game_date >= now` check:

```diff
+import { calculateDeadline } from '../utils/countdown-utils';
 
 const unpredictedUpcoming = games.find(
-  g => g.game_date >= now && !isGuessComplete(guesses[g.id], !!g.playoffStage)
+  g => calculateDeadline(g.game_date) > now.getTime()
+     && !isGuessComplete(guesses[g.id], !!g.playoffStage)
 );
```

`g.game_date` is a `Date` object in `ExtendedGameData`, so it can be passed directly to `calculateDeadline`.

### Fix 3 — Backend: reject post-deadline predictions

**File:** `app/actions/guesses-actions.ts`

Import `findGameById` and `calculateDeadline`, then validate each game's deadline before persisting:

```diff
+import { findGameById, findGamesInTournament } from '../db/game-repository';
+import { calculateDeadline } from '../utils/countdown-utils';
 
 export async function updateOrCreateGameGuesses(...) {
   const t = await getTranslations({ locale, namespace: 'games' });
   try {
     const user = await getLoggedInUser()
     if (!user) throw new Error(t('guess.unauthorized'))
 
+    // Validate each game's deadline before saving
+    const uniqueGameIds = [...new Set(gameGuesses.map(g => g.game_id))]
+    const now = Date.now()
+    const games = await Promise.all(uniqueGameIds.map(id => findGameById(id)))
+    for (const game of games) {
+      if (!game || calculateDeadline(game.game_date) <= now) {
+        return { success: false, error: t('guess.predictionClosed') }
+      }
+    }
 
     const _createdGameGuesses = await Promise.all(...)
```

**Note:** `findGameById` is already imported in `guesses-actions.ts`'s mock in the test file (the mock stub `findGamesInTournament` is there). We add `findGameById` to the existing `game-repository` import.

### Fix 4 — Translation keys

**Files:** `locales/en/games.json`, `locales/es/games.json`

Add `predictionClosed` to the `guess` object:

```json
// en
"guess": {
  "unauthorized": "Unauthorized action",
  "saveFailed": "Failed to save prediction",
  "updateFailed": "Failed to update tournament guess",
  "predictionClosed": "Prediction deadline has passed"
}

// es
"guess": {
  ...
  "predictionClosed": "El tiempo para realizar esta predicción ha finalizado"
}
```

---

## Mid-Level Design

### Call Graph Changes

No new cross-layer flows. This story adds deadline guards to existing save and display flows.

**Modified flows:**
- **games page header flow** — `computeGamesHeaderVariant` now filters `urgentGames` by deadline in addition to completion status
- **games page edit=next flow** — `useEffect` in `UnifiedGamesPageClient` now uses `calculateDeadline` instead of raw `game_date` comparison
- **prediction save flow** — `updateOrCreateGameGuesses` now calls `findGameById` per unique game before delegating to `updateOrCreateGuess`

---

### `app/components/prediction-status-header/games-header-variant.ts` *(modified)*

**Changed functions:**

- **`prepareData(input: GamesHeaderInput, now: Date): GamesHeaderData`** *(internal, was: no deadline filter on urgent games)*  
  `unpredictedUrgentGames` now excludes games whose `calculateDeadline(game_date) <= nowMs`.  
  Tests:
  - game with deadline already passed is excluded from unpredictedUrgentGames even when guess is incomplete
  - game with deadline in the future AND incomplete guess is included in unpredictedUrgentGames
  - game with deadline in the future AND complete guess is excluded from unpredictedUrgentGames

---

### `app/components/unified-games-page-client.tsx` *(modified)*

**Changed functions:**

- **`useEffect` edit=next handler** *(was: `g.game_date >= now`)*  
  Now uses `calculateDeadline(g.game_date) > now.getTime()` so a game starting in 30 minutes (deadline already passed) is skipped.  
  Tests:
  - edit=next skips a game whose deadline has passed (game_date = now + 30min) and opens the next valid game
  - edit=next opens a game whose deadline has not passed (game_date = now + 2h)
  - edit=next falls back to scroll target when all games are either predicted or locked

---

### `app/actions/guesses-actions.ts` *(modified)*

**Changed functions:**

- **`updateOrCreateGameGuesses(gameGuesses: GameGuessNew[], locale?: Locale): Promise<{...}>`** *(was: no deadline check)*  
  Adds a pre-save validation step: fetches each unique game by ID in parallel and returns `{ success: false, error: t('guess.predictionClosed') }` if any game's deadline has already passed or game is not found.  
  Calls: `getLoggedInUser`, `findGameById` (parallel), `calculateDeadline`, `updateOrCreateGuess`  
  Tests:
  - returns `{ success: false, error: 'guess.predictionClosed' }` when game deadline has passed
  - returns `{ success: false, error: 'guess.predictionClosed' }` when game is not found (game_id invalid)
  - still returns `{ success: true, analyticsEvent }` when all games have open deadlines
  - returns `{ success: false, error: 'guess.unauthorized' }` when user is not authenticated (existing behavior preserved)

---

## Files to Modify

| File | Change |
|------|--------|
| `app/components/prediction-status-header/games-header-variant.ts` | Add `calculateDeadline` import; add deadline check to `unpredictedUrgentGames` filter |
| `app/components/unified-games-page-client.tsx` | Add `calculateDeadline` import; fix `edit=next` game filter |
| `app/actions/guesses-actions.ts` | Add `findGameById` import; add deadline validation before saving |
| `locales/en/games.json` | Add `guess.predictionClosed` key |
| `locales/es/games.json` | Add `guess.predictionClosed` key (Spanish) |

**Files NOT modified:**
- `app/components/game-view.tsx` — already handles AC4 correctly
- `app/db/game-repository.ts` — no new queries needed
- `app/actions/tournament-actions.ts` / `app/db/game-repository.ts` (`findGamesForDashboard`) — filtering is intentionally broad (past 24h for recent results widget); the fix belongs at the display layer

---

## Implementation Steps

1. Modify `games-header-variant.ts` — add import + deadline filter
2. Modify `unified-games-page-client.tsx` — add import + fix `edit=next` filter
3. Modify `guesses-actions.ts` — add import + deadline validation block
4. Update both locale JSON files — add `guess.predictionClosed`
5. Update/extend unit tests for all three changed files

---

## Testing Strategy

### Unit Tests

**`games-header-variant.test.ts`** — add to existing describe block:
- `urgentGames` containing `testFactories.extendedGameData({ game_date: new Date(now - 30 * 60 * 1000) })` (deadline 90min ago) should not appear in `unpredictedUrgentGames` even when guess is incomplete
- `testFactories.extendedGameData({ game_date: new Date(now + 2 * 60 * 60 * 1000) })` (deadline in 1h) with incomplete guess → should appear in `unpredictedUrgentGames`

**`unified-games-page-client-url-params.test.tsx`** — add case:
- When `edit=next` and the first unpredicted game is `testFactories.extendedGameData({ game_date: new Date(now + 30 * 60 * 1000) })` (deadline already passed), it should be skipped in favor of a second game with `game_date = new Date(now + 2 * 60 * 60 * 1000)`

**`guesses-actions.test.ts`** — add to existing describe block:
- Mock `findGameById` to return `testFactories.game({ game_date: new Date(now - 30 * 60 * 1000) })` (game already started) → expect `{ success: false, error: 'guess.predictionClosed' }`
- Mock `findGameById` to return `null` (invalid game_id) → expect `{ success: false, error: 'guess.predictionClosed' }`
- Mock `findGameById` to return `testFactories.game({ game_date: new Date(now + 2 * 60 * 60 * 1000) })` (deadline open) → expect `{ success: true }`

### Manual / Integration Verification

1. Deploy to Vercel Preview
2. Create a test scenario where a game has recently started (game_date = now - 10min):
   - Visit `/tournaments/[id]/games` → header should NOT show the started game as unpredicted
   - Navigate to `?edit=next` → should skip the started game and open the next valid one
   - Attempt to POST a prediction for the started game via the prediction flow → should receive error "Prediction deadline has passed"
3. Verify a game with `game_date = now + 2h` is still editable in all three paths

---

## Code-Structure Files to Update

- `docs/code-structure/actions.md` — update `updateOrCreateGameGuesses` signature: add `Calls: findGameById, calculateDeadline`
- `docs/code-structure/components/components-predictions.md` (or games) — note deadline filter added to `prepareData` in `games-header-variant.ts`
- Call graph: **No new cross-layer flows** — no call graph changes needed

---

## Open Questions

None. Root causes are confirmed, approach is consistent with existing patterns (`game-boost-actions.ts` uses the same `findGameById` + deadline check pattern).

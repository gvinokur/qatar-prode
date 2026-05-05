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
| Header counts locked games | `game-repository.ts` (`findGamesForDashboard`) | Query returns games from the past 24h; games that have already kicked off flow through as "unpredicted urgent" |
| Predict Next opens locked game | `unified-games-page-client.tsx:101` | Compares `g.game_date >= now` instead of checking the actual deadline (`game_date - 1h`); works off `getAllTournamentGames`, not `closingGames` |
| Backend saves past-deadline prediction | `guesses-actions.ts:18` | `updateOrCreateGameGuesses()` has zero deadline validation |
| Direct URL shows locked game as editable | `game-view.tsx:41` | **Already fixed** — `editDisabled = Date.now() + ONE_HOUR > game.game_date.getTime()` |

### Why `closingGames` contains locked games

`getGamesClosingWithin48Hours()` → `findGamesForDashboard()` currently returns games from the past 24h to the next 7 days. The past-24h window is vestigial — the comment citing "recent results display" is incorrect; that widget uses `findRecentGamesForDashboard` instead. No consumer meaningfully uses games older than their deadline from this query, but they flow through to the header and accumulate as false "unpredicted urgent" entries.

---

## Technical Approach

Three targeted fixes. No new files.

### Fix 1 — Query: only return games whose deadline hasn't passed

**File:** `app/db/game-repository.ts` — `findGamesForDashboard`

Replace the `past24Hours` lower bound with `now + ONE_HOUR` (i.e. only games whose prediction deadline hasn't closed):

```diff
 export const findGamesForDashboard = cache(async (tournamentId: string) => {
   const now = new Date();
-  const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
+  const deadlineFloor = new Date(now.getTime() + ONE_HOUR); // only games still open for prediction
   const future7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

   return await db.selectFrom(tableName)
     ...
-    .where('game_date', '>=', past24Hours)
+    .where('game_date', '>=', deadlineFloor)
     .where('game_date', '<=', future7Days)
```

`ONE_HOUR` is already imported from `../utils/countdown-utils` in `game-view.tsx`; import it the same way in `game-repository.ts`.

This fixes bug #1 at the root: `closingGames` will never contain locked games, so the header and any other consumer automatically get the correct set.

### Fix 2 — Predict Next: skip games whose deadline has passed

**File:** `app/components/unified-games-page-client.tsx`

This fix is still needed independently because `edit=next` works off `games` (from `getAllTournamentGames` — all tournament games), not `closingGames`. A game starting in 30 minutes has `game_date > now` and passes the current filter, but its deadline has already passed.

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
+import { findGameById } from '../db/game-repository';
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

Pattern follows `game-boost-actions.ts` which uses `findGameById` + date check before applying mutations.

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

No new cross-layer flows. This story narrows an existing DB query and adds deadline guards to existing flows.

**Modified flows:**
- **`findGamesForDashboard` → all consumers** — query now returns only open-deadline games, fixing the header upstream without touching display logic
- **games page edit=next flow** — `useEffect` in `UnifiedGamesPageClient` now uses `calculateDeadline` instead of raw `game_date` comparison
- **prediction save flow** — `updateOrCreateGameGuesses` now calls `findGameById` per unique game before delegating to `updateOrCreateGuess`

---

### `app/db/game-repository.ts` *(modified)*

**Changed functions:**

- **`findGamesForDashboard(tournamentId: string): Promise<ExtendedGameData[]>`** *(was: `game_date >= past24Hours`)*  
  Lower bound changes from 24h in the past to 1h in the future (`game_date >= now + ONE_HOUR`). All consumers that need "closing games" now automatically receive only games still open for prediction.  
  Tests:
  - returns only games whose `game_date` is at least 1 hour in the future
  - excludes a game whose `game_date` is exactly `now + 59min` (deadline already passed)
  - includes a game whose `game_date` is exactly `now + 61min` (deadline 1min away)

---

### `app/components/unified-games-page-client.tsx` *(modified)*

**Changed functions:**

- **`useEffect` edit=next handler** *(was: `g.game_date >= now`)*  
  Now uses `calculateDeadline(g.game_date) > now.getTime()` so a game starting in 30 minutes (deadline already passed) is skipped.  
  Tests:
  - edit=next skips a game whose deadline has passed (`game_date = now + 30min`) and opens the next valid game
  - edit=next opens a game whose deadline has not passed (`game_date = now + 2h`)
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
| `app/db/game-repository.ts` | Change `findGamesForDashboard` lower bound from `past24Hours` to `now + ONE_HOUR` |
| `app/components/unified-games-page-client.tsx` | Add `calculateDeadline` import; fix `edit=next` game filter |
| `app/actions/guesses-actions.ts` | Add `findGameById` + `calculateDeadline` imports; add deadline validation before saving |
| `locales/en/games.json` | Add `guess.predictionClosed` key |
| `locales/es/games.json` | Add `guess.predictionClosed` key (Spanish) |

**Files NOT modified:**
- `app/components/prediction-status-header/games-header-variant.ts` — no longer needs a display-layer fix; query fix handles it upstream
- `app/components/game-view.tsx` — already handles AC4 correctly

---

## Implementation Steps

1. Modify `findGamesForDashboard` in `game-repository.ts` — change lower bound to `now + ONE_HOUR`
2. Modify `unified-games-page-client.tsx` — add import + fix `edit=next` filter
3. Modify `guesses-actions.ts` — add imports + deadline validation block
4. Update both locale JSON files — add `guess.predictionClosed`
5. Update/extend unit tests for all three changed files

---

## Testing Strategy

### Unit Tests

**`game-repository.test.ts`** (or create if it doesn't exist for this function):
- `findGamesForDashboard` excludes `testFactories.game({ game_date: new Date(now + 30 * 60 * 1000) })` (deadline already passed)
- `findGamesForDashboard` includes `testFactories.game({ game_date: new Date(now + 2 * 60 * 60 * 1000) })` (deadline open)

**`unified-games-page-client-url-params.test.tsx`** — add case:
- When `edit=next` and the first unpredicted game is `testFactories.extendedGameData({ game_date: new Date(now + 30 * 60 * 1000) })` (deadline already passed), it should be skipped in favor of a second game with `game_date = new Date(now + 2 * 60 * 60 * 1000)`

**`guesses-actions.test.ts`** — add to existing describe block:
- Mock `findGameById` to return `testFactories.game({ game_date: new Date(now - 30 * 60 * 1000) })` (game already started) → expect `{ success: false, error: 'guess.predictionClosed' }`
- Mock `findGameById` to return `null` (invalid game_id) → expect `{ success: false, error: 'guess.predictionClosed' }`
- Mock `findGameById` to return `testFactories.game({ game_date: new Date(now + 2 * 60 * 60 * 1000) })` (deadline open) → expect `{ success: true }`

### Manual / Integration Verification

1. Deploy to Vercel Preview
2. Create a test scenario where a game has recently started (`game_date = now - 10min`):
   - Visit `/tournaments/[id]/games` → header should NOT show the started game as unpredicted
   - Navigate to `?edit=next` → should skip the started game and open the next valid one
   - Attempt to POST a prediction for the started game via the prediction flow → should receive error "Prediction deadline has passed"
3. Verify a game with `game_date = now + 2h` is still editable in all three paths

---

## Code-Structure Files to Update

- `docs/code-structure/db.md` — update `findGamesForDashboard`: note the lower bound change from `past24Hours` to `now + ONE_HOUR`
- `docs/code-structure/actions.md` — update `updateOrCreateGameGuesses`: add `Calls: findGameById, calculateDeadline`
- Call graph: **No new cross-layer flows** — no call graph changes needed

---

## Implementation Amendments

### Amendment 1: i18n namespace registration
**Date:** 2026-05-05
**Reason:** The `games` namespace was used in `guesses-actions.ts` via `getTranslations({ namespace: 'games' })`, but `types/i18n.ts` had never imported it. This caused a runtime error: "missing internationalized text games.guess.predictionClosed".
**Change:** Added `import games from '@/locales/en/games.json'` and `games: typeof games` to `types/i18n.ts`.

### Amendment 2: Header urgency-count bug fix
**Date:** 2026-05-05
**Reason:** User testing revealed that when games spanned multiple urgency tiers, `buildUrgentUnpredicted` used `unpredictedUrgentGames.length` (all urgent games) for `count` but `urgencyWindow(tone)` for `window`. The tone was set to the most-urgent tier, but the count included games from less-urgent tiers.
**Change:** Modified `buildUrgentUnpredicted` in `games-header-variant.ts` to filter `unpredictedUrgentGames` to `mostUrgentGames` (only those matching `urgencyLevel`) and derive `count`, `window`, and `matchups` from that filtered set.

### Amendment 3: Header 48h upper-bound bug fix
**Date:** 2026-05-05
**Reason:** User testing revealed that `deadlineSoon` (48h tier) showed all remaining open games, including those beyond 48h. `FORTY_EIGHT_HOURS_MS` was defined in `games-header-variant.ts` but unused.
**Change:** Modified `prepareData` in `games-header-variant.ts` to add `msUntilStart < FORTY_EIGHT_HOURS_MS` guard when filtering `unpredictedUrgentGames`. Updated the existing `deadlineSoon` test (which used a game exactly 48h away — now excluded by the strict `<`) to use 46h, and added a new test verifying games at exactly 48h are excluded.

## Open Questions

None. Root causes are confirmed, approach is consistent with existing patterns.

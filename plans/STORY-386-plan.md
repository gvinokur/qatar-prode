# Plan: Story #386 — Games Widget 48h Early Activation

## Story Context

**Issue:** [Bug] Games widget shows informational card until kickoff (should show active games 48h early)
**GitHub:** #386
**Type:** Bug / UX Fix

## Problem

The `GamesPredictionWidget` uses `isStarted` (= `firstGame.game_date <= now`) to decide which view to render. This means the active games carousel (with flippable prediction cards) only appears at the exact moment the first match kicks off. Users cannot use the Hub to fill missing predictions during the critical 48-hour window before the tournament starts.

## Acceptance Criteria

- [ ] Games widget shows the active games carousel starting 48 hours before the first match
- [ ] Before the 48-hour window, the informational pre-tournament summary continues to show
- [ ] Users can fill in and save predictions from the Hub carousel in the 48h window
- [ ] Tutorial/Incomplete banner remains visible if thresholds are not met

## Technical Approach

### Root Cause

In `app/components/tournament-hub/games-prediction-widget.tsx`:
```typescript
if (!isStarted) {
  return <GamesInfoWidget ... />  // ← too conservative; waits for exact kickoff
}
return <GamesActiveWidget ... />
```

In `app/actions/hub-actions.ts`:
```typescript
const isStarted = !!firstGame && firstGame.game_date.getTime() <= now
```

### Key Insight

`getActionCenterGames` already works correctly in pre-tournament mode:
- `findGamesForDashboard` fetches games within the next 7 days — so first-round games are already included
- The `urgentGames` filter surfaces upcoming games with open deadlines and incomplete predictions
- The `openerBackfill` fallback also handles the case where no windowed games are found

The fix is **entirely in the routing and data layer** — no changes needed to the carousel logic itself.

### Fix: Three-File Change

**1. `app/actions/hub-actions.ts`** — Add `isNearStart` to `TournamentHubPageData`

Add a new flag that is `true` when the first match is within 48 hours (or has already started):

```typescript
const PRE_TOURNAMENT_ACTIVE_WINDOW_MS = 48 * 60 * 60 * 1000
const isNearStart = !!firstGame && firstGame.game_date.getTime() - now <= PRE_TOURNAMENT_ACTIVE_WINDOW_MS
```

This covers: 
- Pre-tournament 48h window: `game_date - now <= 48h` → true
- Tournament already started: `game_date - now < 0` → true  
- More than 48h before start: `game_date - now > 48h` → false

**2. `app/[locale]/tournaments/[id]/page.tsx`** — Pass `isNearStart` prop

**3. `app/components/tournament-hub/games-prediction-widget.tsx`** — Use `isNearStart`

Change routing from `!isStarted` → `!isNearStart`.

### Tutorial/Incomplete Banner

`computeIsIncompleteUser` checks `data.tournamentHasStarted` (which equals `isStarted`, not `isNearStart`). In the 48h pre-tournament window, `tournamentHasStarted` is still `false`, so the incomplete banner logic is unaffected — it continues to show correctly when prediction thresholds are not met.

### Data Flow (48h window)

```
Hub page:
  - getTournamentHubPageData() → isNearStart=true (within 48h), isStarted=false
  - getActionCenterGames() → returns urgent/upcoming games (findGamesForDashboard includes next 7 days)

GamesPredictionWidget:
  - isNearStart=true AND actionCenterData != null
  → renders GamesActiveWidget (carousel)
```

## Files to Modify

| File | Change |
|------|--------|
| `app/actions/hub-actions.ts` | Add `isNearStart: boolean` to `TournamentHubPageData` interface; compute in `getTournamentHubPageData` |
| `app/[locale]/tournaments/[id]/page.tsx` | Pass `isNearStart={hubData.isNearStart}` to `<GamesPredictionWidget>` |
| `app/components/tournament-hub/games-prediction-widget.tsx` | Add `isNearStart` prop; replace `!isStarted` guard with `!isNearStart` |

## Mid-Level Design

### Call Graph Changes

No call graph changes. This fix only adds a derived boolean flag to an existing function and threads it through to an existing routing component. No new cross-layer calls are introduced.

### `app/actions/hub-actions.ts` *(modified)*

**Interface change:**
- **`TournamentHubPageData`**: Add `isNearStart: boolean`
  - True when the first match is within 48 hours of now (or has already kicked off)

**Changed functions:**

- **`getTournamentHubPageData(tournamentId: string)`**: `Promise<TournamentHubPageData>` *(unchanged signature)*
  - Now additionally computes and returns `isNearStart`
  - `isNearStart = !!firstGame && (firstGame.game_date.getTime() - Date.now()) <= PRE_TOURNAMENT_ACTIVE_WINDOW_MS`
  - Constant: `PRE_TOURNAMENT_ACTIVE_WINDOW_MS = 48 * 60 * 60 * 1000`
  - Calls: findFirstGameInTournament (already called), findLastGameInTournament (already called)
  - Tests:
    - returns `isNearStart=true` when first game is exactly 48 hours away
    - returns `isNearStart=true` when first game is 24 hours away (inside window)
    - returns `isNearStart=false` when first game is 49 hours away (outside window)
    - returns `isNearStart=true` when first game has already started (in the past)
    - returns `isNearStart=false` when no first game exists

### `app/components/tournament-hub/games-prediction-widget.tsx` *(modified)*

**Changed functions:**

- **`GamesPredictionWidget(props)`**: `JSX.Element | null` *(adds `isNearStart` prop)*
  - Replaces `!isStarted` check with `!isNearStart` for routing between info and active views
  - Props: `{ tournamentId, scoringRules, totalGames, isStarted, isNearStart, isFinished, actionCenterData, gamesHref }`
  - Tests:
    - renders `GamesInfoWidget` when `isNearStart=false` and `isStarted=false` (far pre-tournament)
    - renders `GamesActiveWidget` when `isNearStart=true` and `isStarted=false` (48h window)
    - renders `GamesActiveWidget` when `isNearStart=true` and `isStarted=true` (tournament started)
    - renders `GamesInfoWidget` (logged-off) when `actionCenterData=null` regardless of `isNearStart`
    - returns null when `isFinished=true`

## Testing Strategy

### Unit Tests (existing test files)

**`app/actions/__tests__/hub-actions.test.ts`** (extend `getTournamentHubPageData` describe block):
- Add 5 new test cases for `isNearStart` (see Mid-Level Design above)
- Use same mock pattern as existing `isStarted` tests (mock `findFirstGameInTournament` with `testFactories.game`)

**`app/components/tournament-hub/__tests__/games-prediction-widget.test.tsx`** (NEW file):
- Create test file following pattern from `games-info-widget.test.tsx` and `awards-widget.test.tsx`
- Use `renderWithTheme` and `testFactories`
- Test all routing branches (5 test cases from Mid-Level Design)

### Manual Verification

To test the 48h window, temporarily set a tournament's first game date to `now + 1h` in the DB, navigate to the hub, and verify the active carousel appears. Restore after testing.

## Out of Scope

- Logged-off users: they don't get `actionCenterData`, so they continue to see `GamesInfoWidget` (correct — they cannot make predictions)
- Qualified Teams and Awards widgets: no change
- Games list page: no change
- `computeIsIncompleteUser`: no change needed (uses `tournamentHasStarted`, not `isStarted`)

## Open Questions

None — acceptance criteria and implementation path are clear.

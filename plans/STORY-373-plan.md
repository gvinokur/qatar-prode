# Story 373: Enhanced Tournament Hub Recent Results

## Context

The current Recent Results widget only shows games where the user has an active prediction (INNER JOIN on `game_guesses`). This creates a "blind spot" for games the user missed. Additionally:
- "Correct but not exact" results don't show the user's original prediction
- No support for games in progress (pending status)
- QT and Awards sections clutter the focused results view

This story redesigns the widget to show ALL recent activity (last 24h, up to 10 games), including games with no prediction.

## Acceptance Criteria (from issue #373)
- All games started or finished within last 24 hours (max 10)
- Missing predictions → "0 pts + You didn't enter a prediction"
- Correct but not exact → show original prediction alongside "Correct prediction"
- Pending/in-progress games → yellow clock icon + prediction text
- Remove QT and Awards sections from this widget
- "See Stats" button remains functional
- Full i18n (EN + ES)

## Technical Approach

### Game Status Logic
Game status is derived at runtime (no DB status column):
- `finished`: has published `game_results` row with `is_draft = false`
- `pending`: `game_date <= now()` but no published result (in progress)
- `about_to_start`: `game_date > now()` AND prediction deadline passed (`game_date - 1h <= now()`)

### Data Window
Games visible in this widget: `game_date <= now() + 1h, ORDER BY game_date DESC, LIMIT 10`
- Selects the 10 most recent games where the prediction deadline has passed (closed ≥1h before kickoff)
- No lower bound — shows the 10 most recent regardless of age

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `app/db/game-repository.ts` | Add `findRecentGamesForDashboard` (new function) |
| `app/actions/hub-actions.ts` | Update `RecentGameResultItem`, `RecentResultsData`, `getRecentResultsData` |
| `app/components/tournament-hub/recent-results-widget.tsx` | Redesign widget |
| `locales/en/hub.json` | Add new i18n keys |
| `locales/es/hub.json` | Add new i18n keys |
| `docs/code-structure/db.md` | Document new function |
| `docs/code-structure/actions.md` | Update types and function |
| `docs/code-structure/components/components-tournament-hub.md` | Update |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Recent Results flow** — `TournamentHubRecentResults` → `getRecentResultsData` now calls `findRecentGamesForDashboard` (replaces `findRecentGamesWithUserGuesses`); removes calls to `getTournamentGuessStatsForUsers`, `findQualifiedTeams`, `findTournamentById`, `findTournamentGuessByUserIdTournament`

### `app/db/game-repository.ts` *(modified)*

**New functions:**

- **findRecentGamesForDashboard(userId: string, tournamentId: string, limit: number)**: `Promise<RecentGameForDashboard[]>`
  Fetches all games where `game_date <= now() + 1h`, LEFT JOINing `game_guesses` (user predictions, nullable) and `game_results` (published results only: `is_draft = false`, nullable). Returns up to `limit` rows ordered by `game_date` desc. No lower bound — callers rely on the limit to control scope.

  ```typescript
  export interface RecentGameForDashboard {
    gameId: string
    homeTeamId: string
    awayTeamId: string
    homeScore: number | null       // null = no published result
    awayScore: number | null
    userHomeGuess: number | null   // null = no prediction
    userAwayGuess: number | null
    guessScore: number | null
    boostType: 'silver' | 'golden' | null
    boostMultiplier: number | null
    finalScore: number | null
    gameDate: Date
  }
  ```

  Status derived in action layer by checking if homeScore/awayScore are null and comparing gameDate to now().

  Tests:
  - returns empty array when no games have game_date <= now() + 1h
  - returns games with null scores when result not yet published (pending)
  - returns games with null guesses when user has no prediction
  - excludes games with only draft results (is_draft = true)
  - limits results to the provided limit parameter
  - returns empty array when limit is 0 (guard clause matches existing pattern)

### `app/actions/hub-actions.ts` *(modified)*

**Updated types:**

```typescript
export type GameStatus = 'finished' | 'pending' | 'about_to_start'

export interface RecentGameResultItem {
  gameId: string
  homeTeamName: string
  awayTeamName: string
  homeScore: number | null    // null if game not yet finished
  awayScore: number | null
  userHomeGuess: number | null
  userAwayGuess: number | null
  basePoints: number
  boostType: 'silver' | 'golden' | null
  boostBonus: number
  finalPoints: number
  gameDate: Date
  gameStatus: GameStatus     // NEW field
}

export interface RecentResultsData {
  recentGames: RecentGameResultItem[]
  // qualifiedTeamsScore, qualifiedTeamsCorrect, qualifiedTeamsActualCount REMOVED
  // individualAwardsScore, honorRollScore, honorRollCorrect, individualAwardsCorrect REMOVED
}
```

**Changed functions:**

- **getRecentResultsData(tournamentId: string, locale: Locale)**: `Promise<RecentResultsData>` *(simplified)*
  Now fetches only games data. Removes QT/Awards fetching. Uses `findRecentGamesForDashboard(userId, tournamentId, 10)`. Computes `gameStatus` per game: `finished` if homeScore != null, `about_to_start` if gameDate > now(), else `pending`.
  Calls: getLoggedInUser, findRecentGamesForDashboard, findTeamInTournament, applyLocalizationBatch
  Tests:
  - throws Unauthorized when no active session
  - returns `gameStatus: 'finished'` for games with published results
  - returns `gameStatus: 'pending'` for games that have started but have no published result
  - returns `gameStatus: 'about_to_start'` for games whose date is in the future (prediction closed)
  - includes games where user has no prediction (userHomeGuess: null)
  - returns correct points (0) for games with no user prediction

### `app/components/tournament-hub/recent-results-widget.tsx` *(modified)*

**Changed functions:**

- **GameItem({ item })** *(was: shows only finished, correct/incorrect)*
  Now renders three visual states based on `item.gameStatus`:
  - `finished + no prediction`: CancelOutlined (red) + "You didn't enter a prediction" + "0 pts"
  - `finished + correct exact`: CheckCircle (green) + "Exact prediction" + points
  - `finished + correct not exact`: CheckCircle (green) + "Correct prediction • Your prediction: X–Y" + points
  - `finished + incorrect`: CancelOutlined (red) + "Your prediction: X–Y" + "0 pts"
  - `pending/about_to_start`: WatchLaterIcon (warning.main) + status text + prediction or "No prediction" + "-- pts"
  Tests:
  - renders yellow clock icon for pending game
  - shows "You didn't enter a prediction" for finished game with null guesses
  - shows prediction text alongside "Correct prediction" for correct-not-exact result
  - shows "-- pts" for pending game (not "0 pts")
  - shows "About to start" text for about_to_start status

- **RecentResultsWidget({ data, statsHref })** *(was: had QT/Awards sections)*
  Simplified: only renders games list. Removes QT, Awards sections and their props (qualifiedTeamsHref, awardsHref, resultsHref removed). Adds `WatchLaterIcon` import. Empty state unchanged.
  Tests:
  - renders all 10 game items when data has 10 games
  - renders empty state when recentGames is empty
  - "See Stats" button renders with correct href

---

## New i18n Keys

### `locales/en/hub.json` — `recentResults` section additions:
```json
"youDidntPredict": "You didn't enter a prediction",
"aboutToStart": "About to start",
"matchInProgress": "Match in progress",
"pendingWithPrediction": "Your prediction: {home}–{away}",
"noPredictionShort": "No prediction",
"correctResultWithGuess": "Correct prediction • Your prediction: {home}–{away}"
```

### `locales/es/hub.json` — `recentResults` section additions:
```json
"youDidntPredict": "No ingresaste una predicción",
"aboutToStart": "A punto de comenzar",
"matchInProgress": "Partido en progreso",
"pendingWithPrediction": "Tu predicción: {home}–{away}",
"noPredictionShort": "Sin predicción",
"correctResultWithGuess": "Predicción correcta • Tu predicción: {home}–{away}"
```

---

## Implementation Waves

### Wave 1 — DB + Action (no UI dependencies)
- `app/db/game-repository.ts`: add `findRecentGamesForDashboard`
- `app/actions/hub-actions.ts`: update types + `getRecentResultsData`

### Wave 2 — UI + i18n (depends on Wave 1 types)
- `locales/en/hub.json` + `locales/es/hub.json`: add new keys
- `app/components/tournament-hub/recent-results-widget.tsx`: redesign widget
- `app/components/tournament-hub/tournament-hub-recent-results.tsx`: remove unused props

### Wave 3 — Tests + CODE-STRUCTURE
- Tests for new DB function
- Tests for updated action
- Tests for updated widget
- Update CODE-STRUCTURE layer files

---

## Visual Prototype

```
┌─────────────────────────────────────────────┐
│  📊  Latest Results                          │
├─────────────────────────────────────────────┤
│  RECENT GAMES                               │
│  ─────────────────────────────────────────  │
│  ✅  Argentina 3–3 France        +5 pts     │
│      Exact prediction                       │
│  ─────────────────────────────────────────  │
│  ✅  Croatia 2–1 Morocco         +2 pts     │
│      Correct prediction • Your pred: 1–0   │
│  ─────────────────────────────────────────  │
│  ❌  Netherlands 3–1 USA          0 pts     │
│      You didn't enter a prediction          │
│  ─────────────────────────────────────────  │
│  ❌  Brazil 4–1 South Korea       0 pts     │
│      Your prediction: 2–2                   │
│  ─────────────────────────────────────────  │
│  🕐  Spain vs Italy             -- pts     │
│      Match in progress • Your pred: 1–1    │
│  ─────────────────────────────────────────  │
│  🕐  Germany vs England         -- pts     │
│      About to start • No prediction        │
│                                             │
│           [View full statistics]            │
└─────────────────────────────────────────────┘
```

**Icon legend:**
- ✅ `CheckCircleOutlineIcon` (success.main / green)
- ❌ `CancelOutlinedIcon` (error.main / red)
- 🕐 `WatchLaterIcon` (warning.main / yellow)

---

## Testing Strategy

- **`findRecentGamesForDashboard`**: Unit tests using `createMockSelectQuery()` for Kysely mock and `testFactories.game()` for test data (Vitest)
  - Window boundary: excludes future games beyond the 1h prediction-close window
  - LEFT JOIN behavior (null guesses, null scores)
  - Draft result exclusion
  - Limit enforcement

- **`getRecentResultsData`**: Unit tests with `vi.mock` on DB/action imports; use `testFactories` helpers for game/user data
  - Unauthorized throws
  - Status derivation per game
  - Points = 0 for no-prediction games

- **`RecentResultsWidget`**: Component tests with `renderWithTheme` and `testFactories.recentGameResultItem()` for test data
  - Each icon state renders correctly
  - Text variations per status
  - Empty state
  - "See Stats" link

---

## Validation
- `npm run test` — all tests pass
- `npm run lint` — 0 errors
- `npm run build` — compiles cleanly
- Manual review: visit dashboard with active tournament, verify all 3 game states visible

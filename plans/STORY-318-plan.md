# Story #318 — Recent Prediction Results Widget

## Story Details
- **Issue:** [#318](https://github.com/gvinokur/qatar-prode/issues/318)
- **Priority:** Medium
- **Effort:** Low
- **Category:** Visualization / Tournaments

## Objective
Add a 'Recent Results' widget to the user's hub that summarizes their latest prediction outcomes (games, qualifications, and awards) to provide quick feedback on their performance.

## Acceptance Criteria
- [ ] Displays a compact list of the latest 5 scoring events (Games, Qualified Teams, Tournament Awards)
- [ ] Includes both successful predictions (with points/boosts) and failed predictions (0 pts)
- [ ] Categories are separated by clear headers (Partidos Recientes, Recientemente Clasificados, Premios del Torneo)
- [ ] Game results include the score and a status message (e.g., 'Resultado exacto')
- [ ] Qualification results show how many teams the user guessed correctly (e.g., 'Acertaste 3 de 4 equipos')
- [ ] Tournament awards show score summary when awards have been entered
- [ ] Includes a button 'Ver estadísticas completas' that redirects to the user's tournament stats page
- [ ] Uses project-standard Check (✅) and Close (❌) icons for visual feedback
- [ ] Handles empty and loading states gracefully

## Technical Approach

Replace the placeholder `<Paper>` in hub/page.tsx with a new `TournamentHubRecentResults` async Server Component, following the exact same pattern as `TournamentHubLeaderboardPeek`. The widget consists of:

1. **Async Server Component** (`tournament-hub-recent-results.tsx`) — fetches data, delegates to client
2. **Client Component** (`recent-results-widget.tsx`) — renders 3-section card with MUI
3. **New Server Action** `getRecentResultsData()` in `hub-actions.ts`
4. **New DB query** `findRecentGamesWithUserGuesses()` in `game-repository.ts`

Data sources:
- **Recent Games**: `findRecentGamesWithUserGuesses()` — games with published results + user guess, ordered by game_date desc, limit 5
- **QT Summary**: `getTournamentGuessStatsForUsers()` — `qualified_teams_score`, `qualified_teams_correct` from materialized `tournament_guesses`
- **QT Total**: `getAllUserGroupPositionsPredictions()` — count JSONB entries where `predicted_to_qualify = true`
- **Awards**: `getTournamentGuessStatsForUsers()` — `individual_awards_score`, `honor_roll_score`

"Ver estadísticas completas" links to `/${locale}/tournaments/${tournamentId}/stats`.

## Visual Prototype

```
┌─────────────────────────────────────────┐
│  ÚLTIMOS RESULTADOS                     │
├─────────────────────────────────────────┤
│ PARTIDOS RECIENTES                      │
│  ✅  Argentina 2–1 Francia    +3 pts    │
│      Resultado exacto       hace 4h  ⚡+1│
│  ─────────────────────────────────────  │
│  ❌  Brasil 0–2 Croacia       0 pts     │
│      Predicción: 1–0         ayer       │
│                                         │
│ RECIENTEMENTE CLASIFICADOS              │
│  ✅  Equipos clasificados     +8 pts    │
│      Acertaste 3 de 4 equipos           │
│                                         │
│ PREMIOS DEL TORNEO                      │
│  ✅  Premios individuales     +5 pts    │
│      3 de 4 premios correctos           │
│                                         │
│  [Ver estadísticas completas]           │
└─────────────────────────────────────────┘

Empty state:
┌─────────────────────────────────────────┐
│  ÚLTIMOS RESULTADOS                     │
├─────────────────────────────────────────┤
│           ⚽                            │
│  Aún no tienes resultados recientes.   │
│  Las novedades aparecerán aquí.        │
└─────────────────────────────────────────┘
```

## Files to Create

| File | Purpose |
|------|---------|
| `app/components/tournament-hub/tournament-hub-recent-results.tsx` | Async Server Component wrapper |
| `app/components/tournament-hub/recent-results-widget.tsx` | Client Component renderer |

## Files to Modify

| File | Change |
|------|--------|
| `app/db/game-repository.ts` | Add `findRecentGamesWithUserGuesses()` |
| `app/actions/hub-actions.ts` | Add `getRecentResultsData()` + new types |
| `app/[locale]/tournaments/[id]/hub/page.tsx` | Mount `<TournamentHubRecentResults>` |
| `locales/en/hub.json` | Add `recentResults.*` keys |
| `locales/es/hub.json` | Add `recentResults.*` keys (Spanish) |
| `docs/code-structure/components/components-tournament-hub.md` | Document new components |
| `CODE-STRUCTURE.md` | Add new flow to call graph |

## Mid-Level Design

### Call Graph Changes

**New flow:**
- **Flow N (Hub Recent Results)**
  ```
  TournamentHubPage → TournamentHubRecentResults → getRecentResultsData
    ├─ getLoggedInUser                           [Auth check — throws if no session]
    ├─ findRecentGamesWithUserGuesses            [Fetch scored games + user guesses]
    ├─ getTournamentGuessStatsForUsers           [Fetch materialized QT + award scores]
    ├─ getAllUserGroupPositionsPredictions       [Fetch JSONB predictions to count total predicted]
    └─ findTeamInTournament + applyLocalizationBatch [Localize team names]
  ```
  Aggregation (`qualifiedTeamsTotalPredicted`) is computed inside `getRecentResultsData` by counting JSONB entries where `predicted_to_qualify = true`.

### `app/db/game-repository.ts` *(modified)*

**New types:**
```typescript
export interface RecentGameWithGuess {
  gameId: string
  homeTeamId: string
  awayTeamId: string
  homeScore: number
  awayScore: number
  userHomeGuess: number | null
  userAwayGuess: number | null
  guessScore: number | null      // game_guesses.score (base points)
  boostType: 'silver' | 'golden' | null
  boostMultiplier: number | null
  finalScore: number | null      // game_guesses.final_score
  gameDate: Date
}
```

**New functions:**

- **`findRecentGamesWithUserGuesses(userId: string, tournamentId: string, limit: number)`**: `Promise<RecentGameWithGuess[]>`
  Returns games with published (non-draft) results where the user has a guess, ordered by game_date desc.
  Tests:
  - returns empty array when user has no guesses for tournament
  - returns games ordered by game_date descending
  - excludes games without published results (is_draft = false)
  - respects the limit parameter
  - includes correct guess score and boost fields
  - returns empty array when tournamentId does not exist
  - returns empty array when limit is 0

### `app/actions/hub-actions.ts` *(modified)*

**New types:**
```typescript
export interface RecentGameResultItem {
  gameId: string
  homeTeamName: string        // localized
  awayTeamName: string        // localized
  homeScore: number
  awayScore: number
  userHomeGuess: number | null
  userAwayGuess: number | null
  basePoints: number
  boostType: 'silver' | 'golden' | null
  boostBonus: number          // finalScore - basePoints
  finalPoints: number         // final_score ?? score ?? 0
  gameDate: Date
}

export interface RecentResultsData {
  recentGames: RecentGameResultItem[]
  qualifiedTeamsScore: number | null      // null = not yet scored
  qualifiedTeamsCorrect: number | null
  qualifiedTeamsTotalPredicted: number | null
  individualAwardsScore: number | null    // null = not yet scored
  honorRollScore: number | null
}
```

**New functions:**

- **`getRecentResultsData(tournamentId: string, locale: Locale)`**: `Promise<RecentResultsData>`
  Server Action. Fetches recent game results with user guesses plus aggregated QT/award scores for the authenticated user.
  Calls: getLoggedInUser, findRecentGamesWithUserGuesses, getTournamentGuessStatsForUsers, getAllUserGroupPositionsPredictions, findTeamInTournament, applyLocalizationBatch
  Tests:
  - throws Unauthorized when no active session
  - returns empty recentGames when user has no guesses with published results
  - returns null for qualifiedTeamsScore when QT not yet scored (column is null)
  - computes qualifiedTeamsTotalPredicted by counting JSONB predicted_to_qualify=true entries
  - includes localized team names in game result items
  - correctly computes boostBonus as finalPoints minus basePoints

### `app/components/tournament-hub/tournament-hub-recent-results.tsx` *(new)*

**`TournamentHubRecentResults({ tournamentId, locale })`**: `JSX.Element`
  Async Server Component. Fetches data via `getRecentResultsData` and renders `RecentResultsWidget`.
  Props: `{ tournamentId: string; locale: Locale }`
  Calls: getRecentResultsData
  Renders: RecentResultsWidget
  Tests:
  - renders widget with populated data when results are available
  - renders widget with empty data when no results
  - propagates Unauthorized error from getRecentResultsData when user not authenticated

### `app/components/tournament-hub/recent-results-widget.tsx` *(new)*

**`RecentResultsWidget({ data, statsHref })`**: `JSX.Element`
  Client Component (`'use client'`). Renders the 3-section results card.
  Props: `{ data: RecentResultsData; statsHref: string }`
  Uses: useTranslations('hub'), MUI Card/List/Button
  Tests:
  - renders empty state when recentGames is empty and QT/awards are null
  - renders game items with ✅/❌ icons based on basePoints > 0
  - renders boost chip when boostType is set
  - renders QT section only when qualifiedTeamsScore is not null
  - renders awards section only when individualAwardsScore or honorRollScore is not null
  - "Ver estadísticas completas" button href matches statsHref prop
  - gracefully renders game items when basePoints is null (shows 0 pts)
  - gracefully renders game items when team names are empty strings

## New Translation Keys

**`locales/en/hub.json`** — add under `"recentResults"`:
```json
"recentResults": {
  "title": "Latest Results",
  "recentGames": "Recent Games",
  "recentlyQualified": "Recently Qualified",
  "tournamentAwards": "Tournament Awards",
  "exactResult": "Exact result",
  "correctResult": "Correct result",
  "incorrectResult": "Incorrect result",
  "yourGuess": "Your guess: {{home}}–{{away}}",
  "qualifiedSummary": "You got {{correct}} of {{total}} teams right",
  "awardsSummary": "{{correct}} of {{total}} awards correct",
  "emptyTitle": "No recent results yet.",
  "emptySubtitle": "Your prediction outcomes will appear here!",
  "seeStats": "View full statistics",
  "boostBonus": "+{{bonus}} boost"
}
```

**`locales/es/hub.json`** — Spanish equivalents (see implementation notes below)

## Hub Page Change

Replace the placeholder `<Paper>` block in `hub/page.tsx`:
```tsx
// Remove:
<Paper sx={{ p: 4, textAlign: 'center' }}>
  <Typography variant="h6" color="text.secondary">
    {t('predictionDashboard')}
  </Typography>
</Paper>

// Add:
<TournamentHubRecentResults tournamentId={id} locale={locale} />
```

## Testing Strategy

**DB layer** (`findRecentGamesWithUserGuesses`):
- Integration test against test database; no mocks

**Action layer** (`getRecentResultsData`):
- Use `vitest.mock()` on: `getLoggedInUser`, `findRecentGamesWithUserGuesses`, `getTournamentGuessStatsForUsers`, `getAllUserGroupPositionsPredictions`, `findTeamInTournament`
- Use `testFactories.user()` for mock user; `testFactories.tournament()` for mock tournament
- Each test configures mock return values per scenario (empty array, null score, populated data)

**Component layer** (`RecentResultsWidget`):
- Use `renderWithTheme()` (existing test utility) for all renders
- Create new factory `testFactories.createMockRecentResultsData(overrides?)` returning a `RecentResultsData` with variations:
  - `empty` — all empty arrays, all nulls
  - `gamesOnly` — 2 games (1 correct, 1 wrong), QT/awards null
  - `allSections` — games + QT + awards populated
  - `withBoost` — 1 game with boostType: 'golden' and boostBonus > 0
- Test all render states: empty, games-only, all-3-sections, boost chip visibility

**Server Component** (`TournamentHubRecentResults`):
- Smoke tests mocking `getRecentResultsData` return value

Coverage target: ≥80% on new code

## Validation

- `npm run test` — all tests pass
- `npm run lint` — no new ESLint issues
- `npm run build` — production build succeeds
- Verify in Vercel Preview: widget appears on hub, all 3 states render correctly

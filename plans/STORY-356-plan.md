# Story 356 Plan: Dashboard: Games Prediction Widget

## Story Context

**Issue:** [#356](https://github.com/gvinokur/qatar-prode/issues/356)
**Title:** [Story 4] Dashboard: Games Prediction Widget
**Branch:** `feature/story-356`
**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-356`
**Project:** UX Audit 2026

### Dependency

Story branches from `main` (Stories #354 and #360 are merged). Current `page.tsx` (post-360) is a static no-params component rendering 4 placeholder `DashboardCard` instances with Lorem Ipsum. This story replaces the mock "Games" card with a real widget.

---

## Objective

Replace the mock "Games" `DashboardCard` placeholder in the tournament hub dashboard with a real `GamesPredictionWidget`. The widget must handle three distinct states based on auth status and tournament phase, reusing `getActionCenterGames` for authenticated users and introducing a lightweight new action for guests.

---

## Acceptance Criteria

- [ ] **Flippable Card**: Active state implements the single flippable quick-edit card for upcoming games with left/right navigation arrows.
- [ ] **State Parity**: Logged-Off view mirrors Pre-Start view (scoring rules, description, deadline info) but changes CTA from "Start Predicting" to "Sign In to Predict".

---

## Technical Approach

### Three Widget States

| State | Condition | Content | DashboardCard count |
|-------|-----------|---------|---------------------|
| **Logged-Off** | `!user` | Description + deadline box + scoring rules + CTA: "Sign In to Predict" | none |
| **Pre-Start** | `user && !tournamentHasStarted && !tournamentFinished` | Description + deadline box + scoring rules + progress bar + CTA: "Start Predicting" | `${predictedGames}/${totalGames}` |
| **Active** | `user && tournamentHasStarted && !tournamentFinished` | Single `FlippableGameCard` + left/right arrows + "View All Matches" button | `${predictedGames}/${totalGames}`, `urgent={mode==='urgent'}` |
| **Finished** | `data.tournamentFinished` | `null` (returns nothing) | — |

### Data Flow

- **Logged-Off**: `getGamesWidgetConfig(tournamentId)` — new minimal action, no auth required. Returns `scoringConfig` only.
- **Pre-Start / Active**: `getActionCenterGames(tournamentId, locale)` — existing action, already handles both tournament phases via `tournamentHasStarted` flag. Returns full `ActionCenterData`.

### Component Architecture

```
GamesPredictionWidget (Server Component)
  ├── [logged-off] → DashboardCard + GamesWidgetStaticContent (inline server helper)
  │                  CTA button = Link to /games (games page has its own auth prompts)
  ├── [pre-start]  → DashboardCard + GamesWidgetStaticContent (inline server helper)
  │                  CTA button = Link to /games
  └── [active]     → DashboardCard
                       └── GuessesContextProvider (Client Provider)
                             └── GamesWidgetActiveClient (Client Component)
                                   ├── [currentIndex state]
                                   ├── [editingGameId state]
                                   ├── ← ChevronLeft arrow (disabled at index 0)
                                   ├── FlippableGameCard (reads guesses from GuessesContext)
                                   ├── → ChevronRight arrow (disabled at last index)
                                   └── "View All Matches" Button (Link to /games)
```

`GamesWidgetStaticContent` is an inline server-compatible helper function in `games-prediction-widget.tsx` (no hooks, returns JSX). Not a separate file since it's only used internally.

### page.tsx Changes

`page.tsx` must re-add params to get `tournamentId` for the widget. The locale comes from `getLocale()` from `next-intl/server`.

```tsx
type Props = { params: Promise<{ id: string }> }

export default async function TournamentHubPage({ params }: Props) {
  const { id } = await params
  const locale = toLocale(await getLocale())
  return (
    <Box sx={{ ... }}>
      <Stack gap={2}>
        {/* Banner placeholder unchanged */}
      </Stack>
      <Box sx={{ display: 'grid', ... }}>
        <GamesPredictionWidget tournamentId={id} locale={locale} />
        {/* Other placeholder DashboardCards unchanged */}
      </Box>
    </Box>
  )
}
```

`SportsSoccerIcon` import removed (no longer used directly in page.tsx). `GamesPredictionWidget` import added. `DashboardCard` remains imported for the other 3 placeholder cards.

### GuessesContextProvider in Active State

`GamesPredictionWidget` (Server) wraps `GamesWidgetActiveClient` with `GuessesContextProvider`:
```tsx
<DashboardCard ...>
  <GuessesContextProvider
    gameGuesses={data.gameGuesses}
    autoSave={true}
    tournamentMaxSilver={data.tournamentMaxSilver}
    tournamentMaxGolden={data.tournamentMaxGolden}
  >
    <GamesWidgetActiveClient
      games={data.games}
      teamsMap={data.teamsMap}
      tournamentId={tournamentId}
      gamesHref={gamesHref}
      mode={data.mode}
    />
  </GuessesContextProvider>
</DashboardCard>
```

`GamesWidgetActiveClient` reads `gameGuesses` from `GuessesContext` via `useContext(GuessesContext)` to pass as `homeScore`, `awayScore` etc. to `FlippableGameCard`.

### Scoring Rules Display

Both `GamesWidgetStaticContent` (pre-start and logged-off) display scoring rules. Use `getRulesBySection(scoringConfig, tRules)` from `app/utils/scoring-rules-utils.ts` (same as `PreTournamentNewUserActionCenter`). Pass the games/matches section rules to the static content helper.

Translation note: `getTranslations('rules.rules')` for `tRules`, `getTranslations('hub')` for widget-specific strings.

### Translation Keys

Reuse existing `hub.newUser.tracks.matches.*` keys wherever possible. Add minimal new keys under `hub.gamesWidget`:

| Key | English | Spanish |
|-----|---------|---------|
| `hub.gamesWidget.ctaLogin` | "Sign In to Predict" | "Iniciar sesión para pronosticar" |
| `hub.gamesWidget.ctaViewAll` | "View All Matches" | "Ver todos los partidos" |
| `hub.gamesWidget.deadlineText` | "Changes allowed up to 1 hour before each match." | "Cambios permitidos hasta 1 hora antes de cada partido." |

Reused keys from `hub.newUser.tracks.matches`: `title`, `description`, `cta` (pre-start CTA).
Reused keys from `hub.newUser.tracks`: `deadline.label`, `scoringLabel`.

---

## Visual Prototypes

### State 1: Logged-Off (no user)

```
┌─────────────────────────────────────────────────────┐
│  [👤]  Matches                                      │  ← DashboardCard header
│─────────────────────────────────────────────────────│
│  Predict the results of each tournament match.       │
│  Do what you can now — you can always come back.     │
│                                                     │
│  ┌ · · · · · · · · · · · · · · · · · · · · · · ·┐  │
│  │  🕐  Prediction deadline:                      │  │
│  │      Changes allowed up to 1 hour before       │  │
│  │      each match.                               │  │
│  └─────────────────────────────────────────────── ┘  │
│                                                     │
│  ┌ · · · · · · · · · · · · · · · · · · · · · · ·┐  │
│  │  ⊕  Scoring:                                   │  │
│  │     • 1 point — correct winner/draw            │  │
│  │     • 1 bonus point — exact score              │  │
│  │     • Silver boost: 2x (20 games)              │  │
│  │     • Golden boost: 3x (10 games)              │  │
│  └─────────────────────────────────────────────── ┘  │
│                                                     │
│  [ SIGN IN TO PREDICT                           ]   │  ← Button (contained)
└─────────────────────────────────────────────────────┘
```

### State 2: Pre-Start (authenticated, tournament not started)

```
┌─────────────────────────────────────────────────────┐
│  [⚽]  Matches                     42/104           │  ← DashboardCard header
│─────────────────────────────────────────────────────│
│  Predict the results of each tournament match.       │
│  Do what you can now — you can always come back.     │
│                                                     │
│  ┌ · · · deadline box · · ·┐  ┌ · · · scoring · ·┐ │
│  │ 🕐 Prediction deadline: │  │ ⊕ Scoring:        │ │
│  │    Changes until 1h     │  │   • 1 pt winner   │ │
│  │    before each match.   │  │   • +1 exact      │ │
│  └─────────────────────────┘  └──────────────────┘ │
│                                                     │
│  ████████░░░░░░░░░░░░░░░░░░░░░  40% (progress bar)  │
│  [ START PREDICTING                             ]   │  ← Button (contained)
└─────────────────────────────────────────────────────┘
```

### State 3: Active (authenticated, tournament underway)

```
┌─────────────────────────────────────────────────────┐
│  [⚽]  Matches                     85/104  ← urgent│  ← DashboardCard header (red border)
│─────────────────────────────────────────────────────│
│                                                     │
│  [<]  ┌─────────────────────────────────────┐  [>] │
│       │  Jun 11 14:00 • Closes in 51 days   │       │
│       │  ──────────────────────────────── ✏ │       │
│       │  MEXICO        2 – 4    SOUTH AFRICA │       │
│       │  ────────────────────────────────   │       │
│       │  Estadio Azteca (Mexico City)        │       │
│       └─────────────────────────────────────┘       │
│                                                     │
│  [ VIEW ALL MATCHES                             ]   │  ← Button (text variant)
└─────────────────────────────────────────────────────┘
```

Navigation: `<` arrow disabled at index 0; `>` arrow disabled at last index.
Red border only when `mode === 'urgent'` (unpredicted games with open deadlines).

---

## Mid-Level Design

### Call Graph Changes

**New flows:**
- **Flow 18 (Games Prediction Widget — Active):**
  ```
  TournamentHubPage (Server)
    └── GamesPredictionWidget [renders] (Server)
          ├── getLoggedInUser
          ├── [if !user] getGamesWidgetConfig [server action]
          │     └── findTournamentById
          ├── [if user] getActionCenterGames [server action] (existing flow, now also used here)
          └── GuessesContextProvider [Provider]
                └── GamesWidgetActiveClient [renders]
                      └── FlippableGameCard [renders]
  ```

---

### `app/actions/hub-actions.ts` *(modified)*

**New functions:**

- **getGamesWidgetConfig(tournamentId: string)**: `Promise<{ scoringConfig: ScoringConfig }>`
  Server Action. Returns tournament scoring config for the widget. Does NOT require authentication — safe to call for logged-off users.
  Calls: findTournamentById, buildScoringConfig
  Tests:
  - returns DEFAULT_SCORING when tournament is not found
  - returns custom scoring config when tournament has custom scoring fields
  - succeeds without authentication (no getLoggedInUser call)
  - returns DEFAULT_SCORING when tournament scoring fields are all null
  - returns DEFAULT_SCORING when findTournamentById throws (error propagation: wraps in try-catch at call site)

---

### `app/components/tournament-hub/games-prediction-widget.tsx` *(new)*

**New functions:**

- **GamesPredictionWidget({ tournamentId, locale })**: `Promise<JSX.Element | null>`
  [Server] Async Server Component. Calls `getLoggedInUser()`. Branches: (1) no user → calls `getGamesWidgetConfig`, renders `DashboardCard` wrapping `GamesWidgetStaticContent` with `isLoggedOff=true`; (2) user + `!tournamentHasStarted` → calls `getActionCenterGames`, renders `DashboardCard` with count + `GamesWidgetStaticContent` with `isLoggedOff=false`; (3) user + started → renders `DashboardCard` (urgent when `mode==='urgent'`) wrapping `GuessesContextProvider` + `GamesWidgetActiveClient`; (4) `tournamentFinished` → returns `null`.
  Calls: getLoggedInUser, getGamesWidgetConfig (conditional), getActionCenterGames (conditional), getRulesBySection, getTranslations
  Tests:
  - renders DashboardCard with no count when user is null
  - renders DashboardCard with count when user is authenticated and pre-start
  - renders null when tournamentFinished is true
  - passes isLoggedOff=true to static content when user is null
  - passes isLoggedOff=false to static content when user is authenticated and pre-start
  - renders urgent DashboardCard (error border) when mode is 'urgent'
  - renders non-urgent DashboardCard when mode is 'fallback'

- **GamesWidgetStaticContent(props)**: `JSX.Element`
  [Server-compatible inline helper, not exported] Renders: description paragraph; dashed-border deadline box (ScheduleIcon + deadline label + deadline text); dashed-border scoring rules box (AddCircleOutlineIcon + scoring label + rule strings); `LinearProgress` bar when `!isLoggedOff && totalGames > 0`; CTA `Button component={Link}` — "Sign In to Predict" when `isLoggedOff`, "Start Predicting" otherwise.
  Props: `{ isLoggedOff, description, rules, scoringLabel, deadlineLabel, deadlineText, ctaText, ctaHref, predictedGames, totalGames }`
  Calls: (none — pure MUI composition)
  Tests: (covered by GamesPredictionWidget tests above)

---

### `app/components/tournament-hub/games-prediction-widget-client.tsx` *(new)*

**New functions:**

- **GamesWidgetActiveClient({ games, teamsMap, tournamentId, gamesHref, mode })**: `JSX.Element`
  [Client] Manages `currentIndex: number` (useState, 0-based) and `editingGameId: string | null` (useState). Reads `gameGuesses` from `GuessesContext` via `useContext`. Renders a row of: `IconButton ChevronLeft` (disabled when `currentIndex === 0`), `FlippableGameCard` for `games[currentIndex]` (full width, grows with `flexGrow: 1`), `IconButton ChevronRight` (disabled when `currentIndex === games.length - 1`). Below the row: `Button component={Link} variant="text"` linking to `gamesHref`. Props:
  ```typescript
  interface GamesWidgetActiveClientProps {
    readonly games: ExtendedGameData[]
    readonly teamsMap: Record<string, Team>
    readonly tournamentId: string
    readonly gamesHref: string
    readonly mode: 'urgent' | 'fallback' | 'empty'
  }
  ```
  Uses: useContext(GuessesContext), useState, useTranslations('hub')
  Calls: (none — interacts via context)
  Tests:
  - renders FlippableGameCard for the first game initially (currentIndex starts at 0)
  - left arrow button is disabled when currentIndex is 0
  - right arrow button is disabled when at the last game
  - clicking right arrow increments currentIndex and renders the next game's FlippableGameCard
  - clicking left arrow decrements currentIndex and renders the previous game's FlippableGameCard
  - clicking left from index 0 does not decrement currentIndex below 0 (boundary guard)
  - clicking right from last index does not increment currentIndex beyond games.length - 1 (boundary guard)
  - reads gameGuesses from GuessesContext and passes home_score/away_score as props to FlippableGameCard
  - renders "View All Matches" link button with correct gamesHref
  - renders single-game view when games array has length 1 (both arrows disabled)

---

### `app/[locale]/tournaments/[id]/page.tsx` *(modified)*

**Changed component:**

- **TournamentHubPage({ params })**: `Promise<JSX.Element>` *(was: TournamentHubPage(): JSX.Element with no params)*
  Now async, reads `{ id }` from `params` and `locale` via `getLocale()`. Passes `tournamentId={id}` and `locale={locale}` to `GamesPredictionWidget`. Other 3 placeholder `DashboardCard` instances ("Standings", "Groups", "Results") unchanged.
  Calls: getLocale, toLocale — (re-added from Story 360 cleanup)
  Tests: (Server Component; covered by manual acceptance testing in Vercel Preview)

---

## Files to Create/Modify

| Action | File | Notes |
|--------|------|-------|
| Create | `app/components/tournament-hub/games-prediction-widget.tsx` | Server Component |
| Create | `app/components/tournament-hub/games-prediction-widget-client.tsx` | Client Component |
| Create | `app/components/tournament-hub/__tests__/games-prediction-widget-client.test.tsx` | Unit tests |
| Modify | `app/actions/hub-actions.ts` | Add `getGamesWidgetConfig` |
| Modify | `app/actions/__tests__/hub-actions.test.ts` | Tests for `getGamesWidgetConfig` |
| Modify | `app/[locale]/tournaments/[id]/page.tsx` | Re-add params, use `GamesPredictionWidget` |
| Modify | `locales/en/hub.json` | Add `gamesWidget` sub-object |
| Modify | `locales/es/hub.json` | Add `gamesWidget` sub-object |
| Update | `docs/code-structure/components/components-tournament-hub.md` | Add `GamesPredictionWidget`, `GamesWidgetActiveClient` entries |
| Update | `docs/code-structure/actions.md` | Add `getGamesWidgetConfig` entry |
| Update | `docs/code-structure/pages.md` | Update `TournamentHubPage` to reflect params re-addition |

---

## Implementation Steps

### Wave 1 — Server Action (no dependencies)
1. Add `getGamesWidgetConfig` to `app/actions/hub-actions.ts`
2. Add unit tests in `app/actions/__tests__/hub-actions.test.ts`
3. Update `docs/code-structure/actions.md`

### Wave 2 — New Components (depends on Wave 1)
4. Add translation keys to `locales/en/hub.json` and `locales/es/hub.json`
5. Create `app/components/tournament-hub/games-prediction-widget-client.tsx`
6. Create `app/components/tournament-hub/__tests__/games-prediction-widget-client.test.tsx`
7. Create `app/components/tournament-hub/games-prediction-widget.tsx`

### Wave 3 — Page Integration (depends on Wave 2)
8. Modify `app/[locale]/tournaments/[id]/page.tsx` — re-add params, replace Games mock card

### Wave 4 — Documentation
9. Update `docs/code-structure/components/components-tournament-hub.md`
10. Update `docs/code-structure/pages.md`

---

## Testing Strategy

### Test Infrastructure

All three utilities already exist and are used across the test suite:
- `testFactories.*` — from `__tests__/db/test-factories.ts` (includes `tournament()`, `gameGuess()`, `game()`, `team()`)
- `createMockSelectQuery()` — from `__tests__/db/mock-helpers.ts`
- `renderWithProviders()` — from `__tests__/utils/test-utils.tsx`

No new test utilities need to be created.

### Unit Tests: `getGamesWidgetConfig` (`hub-actions.test.ts`)

Use `testFactories.tournament()` for mock data and `createMockSelectQuery()` for Kysely mocking. No auth mock needed (function does not call `getLoggedInUser`).

### Unit Tests: `GamesWidgetActiveClient` (`games-prediction-widget-client.test.tsx`)

Use `renderWithProviders()`. Wrap with `GuessesContextProvider` seeded with mock guesses via `testFactories.gameGuess()`. Mock `FlippableGameCard` (`vi.mock('../flippable-game-card', ...)`) to render a `data-testid="game-card"` with `data-game-id` attribute — enables asserting which game is displayed without rendering the complex flip component. Simulate arrow button clicks with `userEvent.click`.

Coverage requirement: ≥80% on new code.

### Manual Verification (Vercel Preview)

- **Logged-off** (incognito): Hub page shows Games widget with scoring rules, no progress bar, "Sign In to Predict" CTA linking to `/games`.
- **Pre-start** (authenticated, before tournament): Games widget shows scoring rules + progress bar + "Start Predicting" button.
- **Active** (after tournament starts): Single flippable game card appears; left/right arrows navigate between games; flip works for quick editing; "View All Matches" links to `/games` page.
- **Urgent border**: Red card border when there are unpredicted games (`mode==='urgent'`).
- **Mobile**: Arrows layout stacks cleanly; card is full width.

---

## Validation

- `npm run test` — must pass; ≥80% coverage on new files
- `npm run lint` — must pass
- `npm run build` — must pass
- SonarCloud: 0 new issues of any severity

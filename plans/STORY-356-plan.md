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

Replace the mock "Games" `DashboardCard` placeholder in the tournament hub dashboard with a real `GamesPredictionWidget`. The widget must handle three distinct states based on auth status and tournament phase. Shared tournament data (scoring config, game count, tournament status) is fetched once at the page level and passed to all widgets — eliminating redundant per-widget fetches as more dashboard widgets are built.

---

## Acceptance Criteria

- [ ] **Flippable Card**: Active state implements the single flippable quick-edit card for upcoming games with left/right navigation arrows.
- [ ] **State Parity**: Logged-Off view mirrors Pre-Start view (scoring rules, description, deadline info, progress bar, count) but shows `0/${totalGames}` count and "Sign In to Predict" CTA instead of the real count and "Start Predicting".
- [ ] **Urgency Message**: Active state shows an inline status message above the game card, with a time-based icon (Error/Warning/Info) for unpredicted games, or a plain message when all games are predicted.

---

## Technical Approach

### Three Widget States

| State | Condition | Content | DashboardCard count |
|-------|-----------|---------|---------------------|
| **Logged-Off** | `!user` | Description + deadline box + scoring rules + empty progress bar + CTA: "Sign In to Predict" | `0/${totalGames}` |
| **Pre-Start** | `user && !isStarted` | Description + deadline box + scoring rules + progress bar + CTA: "Start Predicting" | `${predictedGames}/${totalGames}` |
| **Active** | `user && isStarted && !isFinished` | Urgency message + single `FlippableGameCard` + left/right arrows + "View All Matches" button | `${predictedGames}/${totalGames}`, `urgent={mode==='urgent'}` |
| **Finished** | `isFinished` | `null` (returns nothing) | — |

### Data Flow

**Page-level (shared, no auth):** `getTournamentHubPageData(tournamentId)` — fetched once by `TournamentHubPage`. Returns `{ scoringConfig, totalGames, isStarted, isFinished }`. The page also calls `getTranslations('rules.rules')` + `getRulesBySection(scoringConfig, tRules)` to produce `scoringRules: ScoringRulesBySection`, which is passed to all widgets that display scoring info. Future Standings, Groups, and Awards widgets will receive the same page-level data.

**Page-level (auth-conditional):** `getActionCenterGames(tournamentId, locale)` — called by `TournamentHubPage` when the user is authenticated and the tournament is not finished. Returns full `ActionCenterData`, which includes `totalGames`, `predictedGames`, `awardsCompleted/Total`, `qualifiersCompleted/Total`, game carousel data, and guesses. Passed as `actionCenterData: ActionCenterData | null` to all dashboard widgets — `null` means logged-off or tournament finished. Story 357's status widgets will consume the same `actionCenterData` prop from the page, avoiding a second call to `getActionCenterGames`.

> **Note:** `getActionCenterGames` is a misleading name once its data is shared across all widgets. Rename to `getTournamentDashboardData` or similar in a future refactor story.

`GamesPredictionWidget` is a zero-fetch orchestrator — it only routes based on `isFinished`, `actionCenterData`, and `isStarted`.

### Component Architecture

Two self-contained widgets + a thin orchestrator. Each widget owns its `DashboardCard` and its own translations.

```
TournamentHubPage (Server, async)
  ├── [parallel] getTournamentHubPageData(id) + getLoggedInUser()
  ├── getTranslations('rules.rules') → getRulesBySection() → scoringRules
  ├── [if user && !isFinished] getActionCenterGames(id, locale) → actionCenterData
  │
  └── GamesPredictionWidget (zero-fetch orchestrator — no data calls, pure routing)
        ├── [isFinished]                   → null
        ├── [!actionCenterData]            → GamesInfoWidget (isLoggedOff=true, predictedGames=0)
        ├── [actionCenterData + !isStarted] → GamesInfoWidget (isLoggedOff=false)
        └── [actionCenterData + isStarted]  → GamesActiveWidget
                                                  └── DashboardCard
                                                        └── GuessesContextProvider (Client Provider)
                                                              └── GamesActiveClient (Client Component)
                                                                    ├── [Icon] Status message
                                                                    ├── ← ChevronLeft (disabled at index 0)
                                                                    ├── FlippableGameCard
                                                                    ├── → ChevronRight (disabled at last index)
                                                                    └── "View All Matches" Button

  // Story 357 status widgets will also receive actionCenterData from the page
  └── <StatusWidget1 actionCenterData={actionCenterData} hubData={hubData} />
  └── <StatusWidget2 actionCenterData={actionCenterData} hubData={hubData} />
```

`GamesPredictionWidget` has no UI and makes no data calls. `GamesInfoWidget` and `GamesActiveWidget` are independently testable with pre-fetched data props.

### page.tsx Changes

`page.tsx` re-adds params, becomes async, and fetches shared data up front:

```tsx
type Props = { params: Promise<{ id: string }> }

export default async function TournamentHubPage({ params }: Props) {
  const { id } = await params
  const locale = toLocale(await getLocale())
  const gamesHref = `/${locale}/tournaments/${id}/games`

  const [hubData, user] = await Promise.all([
    getTournamentHubPageData(id),
    getLoggedInUser(),
  ])
  const tRules = await getTranslations('rules.rules')
  const scoringRules = getRulesBySection(hubData.scoringConfig, tRules)
  const actionCenterData = (!hubData.isFinished && user)
    ? await getActionCenterGames(id, locale)
    : null

  return (
    <Box sx={{ ... }}>
      <Stack gap={2}>
        {/* Banner placeholder unchanged */}
      </Stack>
      <Box sx={{ display: 'grid', ... }}>
        <GamesPredictionWidget
          tournamentId={id}
          scoringRules={scoringRules}
          totalGames={hubData.totalGames}
          isStarted={hubData.isStarted}
          isFinished={hubData.isFinished}
          actionCenterData={actionCenterData}
          gamesHref={gamesHref}
        />
        {/* Other placeholder DashboardCards unchanged */}
      </Box>
    </Box>
  )
}
```

`SportsSoccerIcon` import removed from page. `GamesPredictionWidget` import added. `DashboardCard` remains for the other 3 placeholders.

### Urgency Message in Active State

`GamesActiveWidget` (Server) computes two values from `data` before rendering `GamesActiveClient`:
- `urgencyLevel: 'critical' | 'high' | 'medium' | 'safe' | 'empty'`
  - `mode === 'empty'` → `'empty'` (no upcoming games — no message shown)
  - `mode === 'fallback'` → `'safe'` (all predicted, some closing)
  - `mode === 'urgent'`: find nearest deadline across `data.games` → `< 2h → 'critical'`, `< 24h → 'high'`, `≤ 48h → 'medium'`
- `unpredictedCount: number` = `data.totalGames - data.predictedGames` (not `data.games.length`, which is the filtered carousel slice)

`GamesActiveClient` renders inline status row above the card:
- `urgencyLevel in ['critical','high','medium']`: `{Icon} "Predict {N} games before it's too late!"`
- `urgencyLevel === 'safe'`: (no icon) `"Some games are closing soon, you can still change their scores."`
- `urgencyLevel === 'empty'`: no message rendered

### GuessesContextProvider in Active State

`GamesActiveWidget` (Server) wraps `GamesActiveClient` inside `DashboardCard`:
```tsx
<DashboardCard title={t('...')} count={count} urgent={data.mode === 'urgent'} icon={<SportsSoccerIcon />}>
  <GuessesContextProvider
    gameGuesses={data.gameGuesses}
    autoSave={true}
    tournamentMaxSilver={data.tournamentMaxSilver}
    tournamentMaxGolden={data.tournamentMaxGolden}
  >
    <GamesActiveClient
      games={data.games}
      teamsMap={data.teamsMap}
      tournamentId={tournamentId}
      gamesHref={gamesHref}
      mode={data.mode}
      urgencyLevel={urgencyLevel}
      unpredictedCount={unpredictedCount}
    />
  </GuessesContextProvider>
</DashboardCard>
```

`GamesActiveClient` reads `gameGuesses` from `GuessesContext` via `useContext(GuessesContext)` to pass `homeScore`, `awayScore` etc. to `FlippableGameCard`.

### Scoring Rules Display

`GamesInfoWidget` uses `getRulesBySection(scoringConfig, tRules)` from `app/utils/scoring-rules-utils.ts` — same pattern as `PreTournamentNewUserActionCenter`. Calls `getTranslations('rules.rules')` itself.

### Translation Keys

Reuse existing `hub.newUser.tracks.matches.*` keys wherever possible. Add minimal new keys under `hub.gamesWidget`:

| Key | English | Spanish |
|-----|---------|---------|
| `hub.gamesWidget.ctaLogin` | "Sign In to Predict" | "Iniciar sesión para pronosticar" |
| `hub.gamesWidget.ctaViewAll` | "View All Matches" | "Ver todos los partidos" |
| `hub.gamesWidget.deadlineText` | "Changes allowed up to 1 hour before each match." | "Cambios permitidos hasta 1 hora antes de cada partido." |
| `hub.gamesWidget.urgentMessage` | "Predict {count} games before it's too late!" | "¡Predice {count} partidos antes de que sea tarde!" |
| `hub.gamesWidget.safeMessage` | "Some games are closing soon, you can still change their scores." | "Algunos partidos están por cerrar, aún puedes cambiar tus resultados." |

Reused keys: `hub.newUser.tracks.matches.title`, `description`, `cta` (pre-start CTA), `hub.newUser.tracks.deadline.label`, `scoringLabel`.

---

## Visual Prototypes

### State 1: Logged-Off (no user) — 0/N count, empty progress bar

```
┌─────────────────────────────────────────────────────┐
│  [⚽]  Matches                     0/104            │  ← DashboardCard header
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
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0% (empty bar)      │
│  [ SIGN IN TO PREDICT                           ]   │  ← Button (contained)
└─────────────────────────────────────────────────────┘
```

### State 2: Pre-Start (authenticated, tournament not started) — vertical stacking

```
┌─────────────────────────────────────────────────────┐
│  [⚽]  Matches                     42/104           │  ← DashboardCard header
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
│  ████████░░░░░░░░░░░░░░░░░░░░░  40% (progress bar)  │
│  [ START PREDICTING                             ]   │  ← Button (contained)
└─────────────────────────────────────────────────────┘
```

### State 3: Active (authenticated, tournament underway) — with urgency message

**Variant A — unpredicted games, warning urgency (< 24h):**
```
┌─────────────────────────────────────────────────────┐
│  [⚽]  Matches                     85/104  urgent   │  ← DashboardCard header (red border)
│─────────────────────────────────────────────────────│
│                                                     │
│  ⚠️  Predict 3 games before it's too late!          │  ← warning icon (yellow)
│                                                     │
│  [<]  ┌─────────────────────────────────────┐  [>] │
│       │  Jun 11 14:00 • Closes in 18 hours  │       │
│       │  ──────────────────────────────── ✏ │       │
│       │  MEXICO        2 – 4    SOUTH AFRICA │       │
│       └─────────────────────────────────────┘       │
│                                                     │
│  [ VIEW ALL MATCHES                             ]   │
└─────────────────────────────────────────────────────┘
```

**Variant B — all games predicted, some closing soon (fallback mode):**
```
┌─────────────────────────────────────────────────────┐
│  [⚽]  Matches                     104/104          │  ← DashboardCard (no red border)
│─────────────────────────────────────────────────────│
│                                                     │
│  Some games are closing soon, you can still change   │
│  their scores.                                      │  ← no icon
│                                                     │
│  [<]  ┌─────────────────────────────────────┐  [>] │
│       │  Jun 11 14:00 • Closes in 2 days    │       │
│       └─────────────────────────────────────┘       │
│                                                     │
│  [ VIEW ALL MATCHES                             ]   │
└─────────────────────────────────────────────────────┘
```

Navigation: `<` arrow disabled at index 0; `>` arrow disabled at last index.
Red border only when `mode === 'urgent'`.

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 18 (Games Prediction Widget):** *(was: GamesPredictionWidget fetched all data itself)*
  ```
  TournamentHubPage (Server)
    ├── getTournamentHubPageData + getLoggedInUser  ← parallel, page-level
    ├── getRulesBySection                           ← page-level, shared scoringRules
    ├── getActionCenterGames                        ← page-level, auth-conditional
    └── GamesPredictionWidget [renders] (zero-fetch orchestrator)
          ├── [isFinished]                   → null
          ├── [!actionCenterData]            → GamesInfoWidget [renders]
          ├── [actionCenterData, !isStarted] → GamesInfoWidget [renders]
          └── [actionCenterData, isStarted]  → GamesActiveWidget [renders]
                                                    └── GuessesContextProvider [Provider]
                                                          └── GamesActiveClient [renders]
                                                                └── FlippableGameCard [renders]
  ```

---

### `app/actions/hub-actions.ts` *(modified)*

**New functions:**

- **getTournamentHubPageData(tournamentId: string)**: `Promise<{ scoringConfig: ScoringConfig, totalGames: number, isStarted: boolean, isFinished: boolean }>`
  Server Action. Returns shared tournament data needed by all dashboard widgets. Does NOT require authentication. Counts total games inline via Kysely (`db.selectFrom('games').select(eb.fn.countAll()).where('tournament_id', '=', tournamentId)`) — reusing the same pattern already used in `tournament-prediction-completion-repository.ts`. No new DB function needed.
  Calls: findTournamentById, buildScoringConfig
  Tests:
  - returns DEFAULT_SCORING when tournament is not found
  - returns custom scoring config when tournament has custom scoring fields
  - returns DEFAULT_SCORING when all tournament scoring fields are null
  - returns correct totalGames count (inline game count query)
  - succeeds without authentication (no getLoggedInUser call)
  - returns isStarted=true when tournament has a startedAt date
  - returns isFinished=true when tournament has a finishedAt date

---

### `app/components/tournament-hub/games-prediction-widget.tsx` *(new)*

**New functions:**

- **GamesPredictionWidget({ tournamentId, scoringRules, totalGames, isStarted, isFinished, actionCenterData, gamesHref })**: `JSX.Element | null`
  [Server] Zero-fetch routing component. No async, no data calls — all data arrives as props from the page. Branches: (1) `isFinished` → returns `null`; (2) `!actionCenterData` → renders `GamesInfoWidget` with `isLoggedOff=true, predictedGames=0`; (3) `actionCenterData && !isStarted` → renders `GamesInfoWidget` with `isLoggedOff=false`; (4) `actionCenterData && isStarted` → renders `GamesActiveWidget`.
  Props:
  ```typescript
  interface GamesPredictionWidgetProps {
    readonly tournamentId: string
    readonly scoringRules: ScoringRulesBySection
    readonly totalGames: number
    readonly isStarted: boolean
    readonly isFinished: boolean
    readonly actionCenterData: ActionCenterData | null
    readonly gamesHref: string
  }
  ```
  Calls: (none)
  Renders: GamesInfoWidget (conditional), GamesActiveWidget (conditional)
  Tests:
  - renders GamesInfoWidget with isLoggedOff=true and predictedGames=0 when actionCenterData is null
  - renders GamesInfoWidget with isLoggedOff=false when actionCenterData is present and isStarted is false
  - renders GamesActiveWidget when actionCenterData is present and isStarted is true
  - returns null when isFinished is true
  - passes scoringRules and totalGames props to GamesInfoWidget when logged-off
  - passes scoringRules and predictedGames from actionCenterData to GamesInfoWidget when pre-start

---

### `app/components/tournament-hub/games-info-widget.tsx` *(new)*

**New functions:**

- **GamesInfoWidget({ isLoggedOff, scoringRules, gamesHref, predictedGames, totalGames })**: `Promise<JSX.Element>`
  [Server] Async Server Component. Calls `getTranslations('hub')` only (scoring rules are pre-computed at page level and passed as `scoringRules: ScoringRulesBySection`). Renders `DashboardCard` with: `title=t('newUser.tracks.matches.title')`, `icon=SportsSoccerIcon`, `count="${predictedGames}/${totalGames}"` (always shown, even for logged-off where predictedGames=0). Inside: description paragraph; dashed-border deadline box (ScheduleIcon) stacked vertically above dashed-border scoring rules box (AddCircleOutlineIcon + rule strings from `scoringRules`); `LinearProgress` bar (value={(predictedGames/totalGames)*100}, shown when `totalGames > 0`); CTA `Button component={Link}` — `t('gamesWidget.ctaLogin')` when `isLoggedOff`, else `t('newUser.tracks.matches.cta')`.
  Props:
  ```typescript
  interface GamesInfoWidgetProps {
    readonly isLoggedOff: boolean
    readonly scoringRules: ScoringRulesBySection
    readonly gamesHref: string
    readonly predictedGames: number
    readonly totalGames: number
  }
  ```
  Calls: getTranslations('hub')
  Tests:
  - renders DashboardCard with "0/${totalGames}" count when isLoggedOff is true (predictedGames=0)
  - renders DashboardCard with predictedGames/totalGames count when isLoggedOff is false
  - renders "Sign In to Predict" CTA text when isLoggedOff is true
  - renders "Start Predicting" CTA text when isLoggedOff is false
  - renders LinearProgress with value=0 (empty) when isLoggedOff is true and totalGames > 0
  - renders LinearProgress with non-zero value when isLoggedOff is false and predictedGames > 0
  - does not render LinearProgress when totalGames is 0
  - renders scoring rule strings from scoringRules prop in the scoring rules box
  - renders deadline box with ScheduleIcon vertically stacked above scoring rules box

---

### `app/components/tournament-hub/games-active-widget.tsx` *(new)*

**New functions:**

- **GamesActiveWidget({ data, tournamentId, gamesHref })**: `Promise<JSX.Element>`
  [Server] Async Server Component. Calls `getTranslations('hub')` for the card title. Computes `urgencyLevel` and `unpredictedCount` from `data.games` and `data.mode`:
  - `unpredictedCount = data.mode === 'urgent' ? data.games.length : 0`
  - `urgencyLevel`: if `mode !== 'urgent'` → `mode === 'fallback' ? 'safe' : null`; else find min deadline across `data.games` → `< 2h → 'critical'`, `< 24h → 'high'`, `≤ 48h → 'medium'`
  Renders `DashboardCard` with count `"${data.predictedGames}/${data.totalGames}"`, `urgent={data.mode === 'urgent'}`, icon=SportsSoccerIcon. Inside: `GuessesContextProvider` wrapping `GamesActiveClient`.
  Props:
  ```typescript
  interface GamesActiveWidgetProps {
    readonly data: ActionCenterData
    readonly tournamentId: string
    readonly gamesHref: string
  }
  ```
  Calls: getTranslations
  Renders: GuessesContextProvider, GamesActiveClient
  Tests:
  - renders DashboardCard with correct predictedGames/totalGames count
  - renders urgent DashboardCard (error border) when data.mode is 'urgent'
  - renders non-urgent DashboardCard when data.mode is 'fallback'
  - passes urgencyLevel='critical' when nearest game deadline is under 2 hours
  - passes urgencyLevel='high' when nearest game deadline is under 24 hours
  - passes urgencyLevel='medium' when nearest game deadline is under 48 hours
  - passes urgencyLevel='safe' when mode is 'fallback'
  - passes urgencyLevel='empty' when mode is 'empty'
  - passes unpredictedCount equal to data.totalGames - data.predictedGames when mode is 'urgent'
  - passes unpredictedCount=0 when mode is 'fallback'

---

### `app/components/tournament-hub/games-active-client.tsx` *(new)*

**New functions:**

- **GamesActiveClient({ games, teamsMap, tournamentId, gamesHref, mode, urgencyLevel, unpredictedCount })**: `JSX.Element`
  [Client] Manages `currentIndex: number` (useState, 0-based) and `editingGameId: string | null` (useState). Reads `gameGuesses` from `GuessesContext` via `useContext`. Renders:
  1. Status row (when `urgencyLevel !== null`): icon (Error/WarningAmber/InfoOutlined based on urgencyLevel, or none for 'safe') + Typography with `t('gamesWidget.urgentMessage', { count: unpredictedCount })` or `t('gamesWidget.safeMessage')`
  2. Navigation row: `IconButton ChevronLeft` (disabled when `currentIndex === 0`), `FlippableGameCard` (flexGrow:1), `IconButton ChevronRight` (disabled when `currentIndex === games.length - 1`)
  3. `Button component={Link} variant="text"` linking to `gamesHref`
  Props:
  ```typescript
  interface GamesActiveClientProps {
    readonly games: ExtendedGameData[]
    readonly teamsMap: Record<string, Team>
    readonly tournamentId: string
    readonly gamesHref: string
    readonly mode: 'urgent' | 'fallback' | 'empty'
    readonly urgencyLevel: 'critical' | 'high' | 'medium' | 'safe' | 'empty'
    readonly unpredictedCount: number
  }
  ```
  Uses: useContext(GuessesContext), useState, useTranslations('hub')
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
  - renders urgency message with Error icon when urgencyLevel is 'critical'
  - renders urgency message with WarningAmber icon when urgencyLevel is 'high'
  - renders urgency message with Info icon when urgencyLevel is 'medium'
  - renders safe message without icon when urgencyLevel is 'safe'
  - renders no status message when urgencyLevel is 'empty'

---

### `app/[locale]/tournaments/[id]/page.tsx` *(modified)*

**Changed component:**

- **TournamentHubPage({ params })**: `Promise<JSX.Element>` *(was: TournamentHubPage(): JSX.Element — static, no params)*
  Now async. Reads `{ id }` and `locale`. Runs `getTournamentHubPageData(id)` + `getLoggedInUser()` in parallel. Computes `scoringRules` via `getTranslations('rules.rules')` + `getRulesBySection`. Fetches `getActionCenterGames(id, locale)` when `user && !isFinished`. Passes all to `GamesPredictionWidget`. Story 357 status widgets will also receive `actionCenterData` from this page — no additional data fetching needed.
  Calls: getLocale, toLocale, getTournamentHubPageData, getLoggedInUser, getTranslations, getRulesBySection, getActionCenterGames (conditional)
  Tests: (Server Component; covered by manual acceptance testing in Vercel Preview)

---

## Files to Create/Modify

| Action | File | Notes |
|--------|------|-------|
| Create | `app/components/tournament-hub/games-prediction-widget.tsx` | Orchestrator Server Component |
| Create | `app/components/tournament-hub/games-info-widget.tsx` | Info state Server Component |
| Create | `app/components/tournament-hub/games-active-widget.tsx` | Active state Server Component (computes urgencyLevel) |
| Create | `app/components/tournament-hub/games-active-client.tsx` | Active state Client Component (status message + nav) |
| Create | `app/components/tournament-hub/__tests__/games-info-widget.test.tsx` | Unit tests |
| Create | `app/components/tournament-hub/__tests__/games-active-client.test.tsx` | Unit tests |
| Modify | `app/actions/hub-actions.ts` | Add `getTournamentHubPageData` (inline game count, no new DB function) |
| Modify | `app/actions/__tests__/hub-actions.test.ts` | Tests for `getTournamentHubPageData` |
| Modify | `app/[locale]/tournaments/[id]/page.tsx` | Re-add params; parallel getTournamentHubPageData+getLoggedInUser; scoringRules; conditional getActionCenterGames; use `GamesPredictionWidget` |
| Modify | `locales/en/hub.json` | Add `gamesWidget` sub-object (5 keys) |
| Modify | `locales/es/hub.json` | Add `gamesWidget` sub-object (5 keys) |
| Update | `docs/code-structure/components/components-tournament-hub.md` | Add all 4 new component entries |
| Update | `docs/code-structure/actions.md` | Add `getTournamentHubPageData` entry |
| Update | `docs/code-structure/pages.md` | Update `TournamentHubPage` (now async, fetches shared data + scoringRules) |

---

## Implementation Steps

### Wave 1 — Data Layer (no dependencies)
1. Add `getTournamentHubPageData` to `app/actions/hub-actions.ts` + tests in `hub-actions.test.ts`
2. Update `docs/code-structure/actions.md`

### Wave 2 — Leaf Components (depends on Wave 1, parallel within wave)
4. Add translation keys to `locales/en/hub.json` and `locales/es/hub.json`
5. Create `app/components/tournament-hub/games-active-client.tsx` + `__tests__/games-active-client.test.tsx`
6. Create `app/components/tournament-hub/games-info-widget.tsx` + `__tests__/games-info-widget.test.tsx`

### Wave 3 — Composite Widgets + Orchestrator (depends on Wave 2)
7. Create `app/components/tournament-hub/games-active-widget.tsx`
8. Create `app/components/tournament-hub/games-prediction-widget.tsx`

### Wave 4 — Page Integration (depends on Wave 3)
9. Modify `app/[locale]/tournaments/[id]/page.tsx` — add params, fetch shared data, use `GamesPredictionWidget`

### Wave 5 — Documentation
10. Update `docs/code-structure/components/components-tournament-hub.md`
11. Update `docs/code-structure/pages.md`

---

## Testing Strategy

### Test Infrastructure

All three utilities already exist:
- `testFactories.*` — from `__tests__/db/test-factories.ts`
- `createMockSelectQuery()` — from `__tests__/db/mock-helpers.ts`
- `renderWithProviders()` — from `__tests__/utils/test-utils.tsx`

### Unit Tests: `getTournamentHubPageData` (`hub-actions.test.ts`)

Use `testFactories.tournament()` for mock data. No auth mock needed. Cover scoring config variants (default, custom, null fields) and `isStarted`/`isFinished` flag derivation.

### Unit Tests: `GamesInfoWidget` (`games-info-widget.test.tsx`)

Server Component test. Mock `getTranslations` and `getRulesBySection`. Use `testFactories.tournament()` to build a `scoringConfig`. Test `isLoggedOff=true` (0/N count, empty bar) and `isLoggedOff=false` (real count, real bar), plus progress bar presence/absence.

### Unit Tests: `GamesActiveClient` (`games-active-client.test.tsx`)

Use `renderWithProviders()`. Wrap with `GuessesContextProvider` seeded with mock guesses via `testFactories.gameGuess()`. Mock `FlippableGameCard` to render `data-testid="game-card"` with `data-game-id` attribute. Test arrow navigation, boundary guards, context integration, and all urgency message variants (critical/high/medium/safe/null).

Coverage requirement: ≥80% on new code.

### Manual Verification (Vercel Preview)

- **Logged-off** (incognito): Games widget shows `0/104`, empty progress bar, scoring rules, "Sign In to Predict" CTA.
- **Pre-start** (authenticated): Games widget shows `N/104`, filled progress bar, scoring rules, "Start Predicting".
- **Active — urgent**: Red border, urgency message with colored icon, single game card, arrow navigation, "View All Matches" link.
- **Active — fallback**: No red border, plain "closing soon" message, game card with navigation.
- **Mobile**: Arrows + card layout stacks cleanly.

---

## Validation

- `npm run test` — must pass; ≥80% coverage on new files
- `npm run lint` — must pass
- `npm run build` — must pass
- SonarCloud: 0 new issues of any severity

---

## Implementation Amendments

### Amendment 1: Refactored Component Architecture — `GamesActiveSection` + Callback Pattern

**Date:** 2026-04-22
**Reason:** Two bugs surfaced after initial implementation: (1) carousel games loaded without scores after page refresh — root cause: `GuessesContextProvider` initializes `gameGuesses` state once on mount; subsequent prop changes from `router.refresh()` are silently ignored. (2) Un-completing a game didn't update urgency text — root cause: urgency was computed server-side in `GamesActiveWidget` and passed as a static prop; client-side guess changes never re-ran the computation.

**What actually changed:**

The original plan placed `GuessesContextProvider` and `GamesActiveClient` directly inside `GamesActiveWidget` (Server Component). The actual implementation adds a new client-owned layer:

```
GamesActiveWidget (Server, now thin wrapper)
  └── GamesActiveSection (NEW Client Component — owns carousel state + refetch)
        └── GuessesContextProvider (key={refetchKey} for clean remount on refetch)
              └── GamesActiveClient (Client)
```

**`GamesActiveSection`** (`app/components/tournament-hub/games-active-section.tsx`) — new Client Component:
- Holds all carousel state: `games`, `gameGuesses`, `teamsMap`, `urgencyLevel`, `urgentGameIds`, `predicted`, `refetchKey`
- `handleAllUrgentComplete` callback: called by `GamesActiveClient` once all urgent games are predicted → triggers refetch → updates all state → increments `refetchKey`
- `key={refetchKey}` on `GuessesContextProvider` forces full unmount+remount — simultaneously resets guess context state AND the `initialGuessesRef` delta snapshot in `GamesActiveClient`
- Contains a duplicate `computeUrgencyLevel` function (same as `GamesActiveWidget`) — will be de-duplicated when the action split lands

**`GamesActiveWidget`** is now a thin async Server Component that reads translations and passes initial data to `GamesActiveSection`.

**`GamesActiveClient`** props changed significantly from plan:

| Plan prop | Actual prop | Notes |
|-----------|-------------|-------|
| `mode: 'urgent' \| 'fallback' \| 'empty'` | _(removed)_ | No longer passed; urgency derived client-side |
| `unpredictedCount: number` | _(removed)_ | Replaced by `urgentGameIds` + live count |
| _(new)_ | `cardTitle: string` | Card header title, now passed as prop |
| _(new)_ | `initialPredicted: number` | Server-rendered predicted count for delta baseline |
| _(new)_ | `totalGames: number` | Total game count for the counter display |
| _(new)_ | `urgentGameIds: string[]` | IDs of games that were in urgent mode at render time |
| _(new)_ | `onAllUrgentComplete: () => Promise<void>` | Callback to `GamesActiveSection` when all urgent games are complete |

**Delta tracking added to `GamesActiveClient`:**
- `initialGuessesRef = useRef(gameGuesses)` — snapshot of guesses on mount (resets on remount via `key`)
- `initialWindowPredicted = countCompleteGuesses(initialGuessesRef.current, games)`
- `currentWindowPredicted = countCompleteGuesses(gameGuesses, games)`
- `delta = currentWindowPredicted - initialWindowPredicted`
- `adjustedPredicted = initialPredicted + delta` — displayed in card header

**Urgency logic moved to `GamesActiveClient`:**
- `urgentRemaining = urgentGameIds.filter(id => !isGuessComplete(gameGuesses[id], isPlayoff)).length`
- `effectiveIsUrgent = urgentGameIds.length > 0 && urgentRemaining > 0`
- `effectiveUrgencyLevel` — derived from `effectiveIsUrgent` + `urgencyLevel` prop
- `useEffect` fires `onAllUrgentComplete` once when `urgentRemaining === 0` (guarded by `refetchTriggeredRef`)

---

### Amendment 2: `isGuessComplete` / `countCompleteGuesses` Extracted to Util

**Date:** 2026-04-22
**Reason:** Both `GamesActiveClient` and `getActionCenterGames` (server) needed the same "is this guess complete?" logic. Extracting to a shared util prevents drift.

**Files created:**
- `app/utils/guess-utils.ts` — two exported functions:
  ```ts
  export function isGuessComplete(guess: GameGuessNew | undefined, isPlayoff: boolean): boolean
  export function countCompleteGuesses(guessMap: Record<string, GameGuessNew>, games: ExtendedGameData[]): number
  ```
- `app/utils/__tests__/guess-utils.test.ts` — comprehensive unit tests covering: undefined guess, 0-0 scores, null/undefined scores, penalty winner rules for playoff games, countCompleteGuesses with empty map and mixed complete/incomplete guesses

---

### Amendment 3: `GuessesContextProvider` — Safety Sync Added

**Date:** 2026-04-22
**Reason:** Defense-in-depth against future prop changes not triggering context reset.

`useEffect(() => { setGameGuesses(serverGameGuesses) }, [serverGameGuesses])` added to `guesses-context-provider.tsx`. With the `key={refetchKey}` remount pattern this is now redundant, but kept as a safety net.

---

### Amendment 4 (PENDING DECISION): Split `getActionCenterGames` — Lightweight Carousel Refetch

**Date:** 2026-04-22
**Reason:** `GamesActiveSection.handleAllUrgentComplete` currently calls `getActionCenterGames`, which internally calls `getTournamentPredictionCompletion`. That function runs **7+ sequential DB queries**: total game count, completed game count (JOIN with game_guesses + playoff filter), tournament guess lookup, tournament start date, final standings completion, awards completion, qualifiers completion. This is expensive for a carousel-only refetch that only needs `games`, `gameGuesses`, `teamsMap`, and `mode`.

**Proposed split:**

**New `getCarouselGames(tournamentId, locale)`** — lightweight carousel-only action:
- Does NOT call `getTournamentPredictionCompletion`
- DB calls: `findGamesForDashboard`, `findGameGuessesByUserId`, `findTeamInTournament`, `findTournamentById` (for `tournamentMaxSilver`/`tournamentMaxGolden` and localization only)
- Returns: `{ games, gameGuesses, teamsMap, mode, urgentGameIds }` — no completion stats
- `GamesActiveSection.handleAllUrgentComplete` calls this instead of `getActionCenterGames`

**`getActionCenterGames` (page-level)** remains unchanged — called once by `TournamentHubPage`, returns full `ActionCenterData` including completion stats.

**Open question — predicted counter after refetch:**

After `getCarouselGames` refetch, `GamesActiveSection` cannot call `setPredicted` (no fresh count). The remounted `GamesActiveClient` has:
- `initialPredicted` = old page-level value (e.g., 8)
- `initialGuessesRef` = new carousel guesses (all complete)
- `delta` = 0
- Display: 8/16 ✗ — STALE (should be 10/16)

**Options to resolve:**

| Option | Approach | Cost | Counter correctness |
|--------|----------|------|---------------------|
| **A** | Keep calling `getActionCenterGames` on refetch (status quo) | 7+ DB queries | ✓ Correct — `fresh.predictedGames` updates `initialPredicted` |
| **B** | `getCarouselGames` returns no count; accept stale counter | Cheapest | ✗ Counter resets to page-load value after refetch |
| **C** | `getCarouselGames` runs 1 lightweight count query: `SELECT COUNT(*) FROM game_guesses WHERE user_id=$1 AND tournament_id=$2 AND home_score IS NOT NULL AND away_score IS NOT NULL AND (playoff penalty filter)` | 1 extra query | ✓ Correct — `GamesActiveSection` calls `setPredicted(fresh.predictedGames)` |
| **D** | Store `adjustedPredicted` in `GamesActiveSection` state; pass it as new `initialPredicted` before key remount | No extra DB call | ✓ Correct — delta-aware, but more complex state management |

**Decision: Option C** — `getCarouselGames` runs a single lightweight aggregate query that returns `predictedGames`, `silverBoostsUsed`, and `goldenBoostsUsed` in one shot (see Amendment 5 for the combined query). `GamesActiveSection` calls `setPredicted(fresh.predictedGames)` before `setRefetchKey(k+1)`, so the remounted component starts with the correct counter.

---

### Amendment 5 (PENDING DECISION): Boost Delta Tracking — Fix Boost Counts Scoped to Carousel

**Date:** 2026-04-22
**Reason:** `GuessesContextProvider` currently computes `silverUsed`/`goldenUsed` by filtering its internal `gameGuesses` state (`guesses.filter(g => g.boost_type === 'silver').length`). But `gameGuesses` only contains carousel game guesses (2-4 games from `getActionCenterGames`). If the user has boosts applied to games outside the current carousel window, the context returns wrong counts — potentially allowing more boosts than the tournament limit allows.

**Current (broken) flow:**
```
GuessesContextProvider
  gameGuesses = { 'g-1': {..., boost_type: 'silver'}, 'g-2': {...} }  ← 2 carousel games only
  silverUsed = gameGuesses.filter(silver) = 1  ← WRONG if user has silver on 10 other games
```

**Proposed fix:**

1. **Add `silverBoostsUsed`/`goldenBoostsUsed` to `ActionCenterData`**:
   `getTournamentPredictionCompletion` already computes these (via `getTournamentGuessStatsForUsers`). Currently not plumbed through to `ActionCenterData`. Add them:
   ```ts
   // ActionCenterData new fields:
   silverBoostsUsed: number   // total across all user games in tournament
   goldenBoostsUsed: number
   ```

2. **Pass to `GamesActiveSection`** as `initialSilverUsed`/`initialGoldenUsed` props.

3. **Add boost delta tracking in `GamesActiveSection`**:
   - `initialBoostRef = useRef(gameGuesses)` — already captured via existing `refetchKey` reset
   - `initialCarouselSilver = countSilver(initialBoostRef.current)` (boosts in carousel at mount time)
   - `currentCarouselSilver = countSilver(gameGuesses)` (current carousel session)
   - `boostDelta = currentCarouselSilver - initialCarouselSilver`
   - Pass `tournamentSilverUsed = initialSilverUsed + boostDelta` to `GuessesContextProvider`

4. **`GuessesContextProvider`** receives new props `tournamentSilverUsed`/`tournamentGoldenUsed` and uses them directly instead of computing from `gameGuesses`:
   ```ts
   // Before (broken):
   const silverUsed = Object.values(gameGuesses).filter(g => g.boost_type === 'silver').length
   // After (correct):
   props.tournamentSilverUsed  // passed from GamesActiveSection
   ```

5. **On carousel refetch**: `getCarouselGames` returns fresh `silverBoostsUsed`/`goldenBoostsUsed` from the same lightweight aggregate query used for `predictedGames` (one combined DB query covering all three counts). `GamesActiveSection` calls `setInitialSilverUsed(fresh.silverBoostsUsed)` before `setRefetchKey(k+1)`, resetting the delta baseline cleanly.

**Combined lightweight aggregate query** (runs as one DB call in `getCarouselGames`):
```sql
-- predicted count (requires JOIN for playoff filter)
SELECT COUNT(*) FROM games
INNER JOIN game_guesses ON game_guesses.game_id = games.id
WHERE games.tournament_id = $1 AND game_guesses.user_id = $2
  AND game_guesses.home_score IS NOT NULL AND game_guesses.away_score IS NOT NULL
  AND (
    games.game_type = 'group'
    OR game_guesses.home_score != game_guesses.away_score
    OR game_guesses.home_penalty_winner = true
    OR game_guesses.away_penalty_winner = true
  )

-- boost counts (simple, no join needed — game_guesses already scoped to tournament via game_id JOIN or user+tournament filter)
SELECT boost_type, COUNT(*) FROM game_guesses
WHERE user_id = $2 AND tournament_id_derived = $1  -- (join games on game_id to filter by tournament)
  AND boost_type IS NOT NULL
GROUP BY boost_type
```

These two can run as parallel `Promise.all` calls in `getCarouselGames` — still far cheaper than the 7+ sequential calls in `getTournamentPredictionCompletion`.

**Scope clarification:** The delta tracking lives in `GamesActiveSection` (not inside `GuessesContextProvider`). `GuessesContextProvider` becomes a dumb receiver — it accepts `tournamentSilverUsed`/`tournamentGoldenUsed` as props and exposes them directly via context, without computing from its own (carousel-scoped) `gameGuesses`.

**Decision:** Implement boost delta tracking. Wrong counts in UI are a bug, even if the BE prevents over-application.

---

### Summary: What Remains to Implement

| Item | Status | Complexity |
|------|--------|------------|
| `GamesActiveSection` + callback refactor | ✅ Done | — |
| `isGuessComplete` / `countCompleteGuesses` util + tests | ✅ Done | — |
| Updated `GamesActiveClient` tests | ✅ Done | — |
| `GuessesContextProvider` safety sync | ✅ Done | — |
| Add `silverBoostsUsed`/`goldenBoostsUsed` to `ActionCenterData` + populate in `getActionCenterGames` | ⏳ To do | Low |
| Create `getCarouselGames` lightweight action (no `getTournamentPredictionCompletion`, but with combined lightweight aggregate query for `predictedGames` + boost counts) | ⏳ To do | Medium |
| `GamesActiveSection`: call `getCarouselGames` instead of `getActionCenterGames`; add `initialSilverUsed`/`initialGoldenUsed` state + delta tracking; pass `tournamentSilverUsed`/`tournamentGoldenUsed` to `GuessesContextProvider` | ⏳ To do | Medium |
| `GuessesContextProvider`: remove internal boost count computation; accept `tournamentSilverUsed`/`tournamentGoldenUsed` as props | ⏳ To do | Low |
| De-duplicate `computeUrgencyLevel` between `GamesActiveWidget` and `GamesActiveSection` (move to shared util) | ⏳ To do | Low |

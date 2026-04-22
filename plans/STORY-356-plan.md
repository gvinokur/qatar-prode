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

**Widget-level (auth-specific):** `getActionCenterGames(tournamentId, locale)` — called by `GamesPredictionWidget` only when the user is authenticated. Returns full `ActionCenterData` with per-user prediction state.

`GamesPredictionWidget` uses `isStarted`/`isFinished` from the page-level props to decide routing — it does not need to wait for `getActionCenterGames` to learn tournament phase.

### Component Architecture

Two self-contained widgets + a thin orchestrator. Each widget owns its `DashboardCard` and its own translations.

```
TournamentHubPage (Server, async)
  └── getTournamentHubPageData(id) → { scoringConfig, totalGames, isStarted, isFinished }
  └── GamesPredictionWidget (thin async orchestrator — no UI, routes by state)
        ├── [isFinished]              → null
        ├── [!user]                   → GamesInfoWidget (isLoggedOff=true, predictedGames=0)
        ├── [user + !isStarted]       → getActionCenterGames → GamesInfoWidget (isLoggedOff=false)
        └── [user + isStarted]        → getActionCenterGames → GamesActiveWidget
                                              └── DashboardCard
                                                    └── GuessesContextProvider (Client Provider)
                                                          └── GamesActiveClient (Client Component)
                                                                ├── [Icon] Status message
                                                                ├── ← ChevronLeft (disabled at index 0)
                                                                ├── FlippableGameCard
                                                                ├── → ChevronRight (disabled at last index)
                                                                └── "View All Matches" Button
```

`GamesPredictionWidget` has no UI of its own. `GamesInfoWidget` and `GamesActiveWidget` are independently testable with pre-fetched data props.

### page.tsx Changes

`page.tsx` re-adds params, becomes async, and fetches shared data up front:

```tsx
type Props = { params: Promise<{ id: string }> }

export default async function TournamentHubPage({ params }: Props) {
  const { id } = await params
  const locale = toLocale(await getLocale())
  const hubData = await getTournamentHubPageData(id)
  const tRules = await getTranslations('rules.rules')
  const scoringRules = getRulesBySection(hubData.scoringConfig, tRules)

  return (
    <Box sx={{ ... }}>
      <Stack gap={2}>
        {/* Banner placeholder unchanged */}
      </Stack>
      <Box sx={{ display: 'grid', ... }}>
        <GamesPredictionWidget
          tournamentId={id}
          locale={locale}
          scoringRules={scoringRules}
          totalGames={hubData.totalGames}
          isStarted={hubData.isStarted}
          isFinished={hubData.isFinished}
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
- **Flow 18 (Games Prediction Widget):** *(was: GamesPredictionWidget fetches scoringConfig itself)*
  ```
  TournamentHubPage (Server)
    ├── getTournamentHubPageData         ← NEW: page-level shared fetch
    └── GamesPredictionWidget [renders] (Server, thin orchestrator)
          ├── getLoggedInUser
          ├── [if !user]          → GamesInfoWidget [renders] (scoringConfig+totalGames from props)
          ├── [if user, !started] → getActionCenterGames → GamesInfoWidget [renders]
          └── [if user, started]  → getActionCenterGames → GamesActiveWidget [renders]
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

- **GamesPredictionWidget({ tournamentId, locale, scoringRules, totalGames, isStarted, isFinished })**: `Promise<JSX.Element | null>`
  [Server] Thin async orchestrator. No UI. Receives shared tournament data (including pre-computed scoring rules) from page. Calls `getLoggedInUser()`. Branches: (1) `isFinished` → returns `null`; (2) no user → renders `GamesInfoWidget` with `isLoggedOff=true, predictedGames=0`; (3) user → calls `getActionCenterGames`, then (a) `!data.tournamentHasStarted` → renders `GamesInfoWidget` with `isLoggedOff=false`; (b) started → renders `GamesActiveWidget`. Does not catch errors from `getActionCenterGames` — they propagate to the page-level Next.js error boundary.
  Props:
  ```typescript
  interface GamesPredictionWidgetProps {
    readonly tournamentId: string
    readonly locale: Locale
    readonly scoringRules: ScoringRulesBySection
    readonly totalGames: number
    readonly isStarted: boolean
    readonly isFinished: boolean
  }
  ```
  Calls: getLoggedInUser, getActionCenterGames (conditional)
  Renders: GamesInfoWidget (conditional), GamesActiveWidget (conditional)
  Tests:
  - renders GamesInfoWidget with isLoggedOff=true and predictedGames=0 when user is null
  - renders GamesInfoWidget with isLoggedOff=false when user is authenticated and tournament not started
  - renders GamesActiveWidget when user is authenticated and tournament has started
  - returns null when isFinished is true
  - passes scoringRules and totalGames props to GamesInfoWidget when logged-off
  - passes scoringRules from props and predictedGames from ActionCenterData to GamesInfoWidget when pre-start
  - (error propagation) errors from getActionCenterGames are not caught — they propagate to the page-level Next.js error boundary

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
  Now async, reads `{ id }` from `params`, calls `getTournamentHubPageData(id)`, calls `getTranslations('rules.rules')`, computes `scoringRules = getRulesBySection(hubData.scoringConfig, tRules)`, passes all to `GamesPredictionWidget`. Other 3 placeholder `DashboardCard` instances unchanged.
  Calls: getLocale, toLocale, getTournamentHubPageData, getTranslations, getRulesBySection
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
| Modify | `app/[locale]/tournaments/[id]/page.tsx` | Re-add params, fetch shared data + scoringRules, use `GamesPredictionWidget` |
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

# STORY-474 Plan: Quick Score Entry Wizard for Recently Finished Games

## Context

Admins currently need multiple navigation steps to enter scores: open backoffice → find tournament → select group/playoff tab → flip game card → enter score → save → publish. This is painful on mobile after a game finishes.

This story adds a "Fill Latest Scores" shortcut in the avatar menu that opens a step-through wizard showing unscored games from the last 24 hours, one at a time, with a single "Save & Publish" action per game.

---

## Acceptance Criteria

- [ ] "Fill Latest Scores" option in avatar menu (admin only)
- [ ] Opens full-screen modal (mobile) / dialog (desktop) with unscored games from last 24h
- [ ] Games shown one at a time with score inputs (existing `BackofficeGameResultEditControls`)
- [ ] Single "Save & Publish" button saves + publishes atomically, then advances
- [ ] Admin can Skip a game (stays unscored, advances wizard)
- [ ] Playoff games with tied scores show penalty score inputs before allowing publish
- [ ] Empty/completion state when no pending games or all processed
- [ ] Progress shown ("Game 2 of 5")
- [ ] Works in English and Spanish

---

## Technical Approach

**Reuse existing score components:** `BackofficeGameResultEditControls` already handles home/away score inputs and penalty shootout detection (shows penalty section when `isPlayoffGame && homeScore === awayScore`). The wizard wraps this component instead of rebuilding score entry.

**Save & Publish flow:** Reuse `saveGameResults([game])` from `backoffice-actions.ts` with `is_draft: false` on the game result. This handles the full pipeline: create/update result + `calculateGameScores` for points recalculation.

**Data loading:** Wizard dialog fetches games lazily on open via a new server action `getRecentUnscoredGames`. Games are from the last 24h across all tournaments where no published result exists.

**State management:** The wizard component tracks `currentIndex` into the loaded games array. Skip and Save both advance the index. Completion state shown when `currentIndex >= games.length`.

---

## Visual Prototypes

### Mobile — Full-Screen Dialog

```
┌──────────────────────────────────┐
│  [✕]    Fill Latest Scores       │
│            Game 2 of 3           │
│  ██████████████░░░░░░░░░░░░░     │  ← LinearProgress
├──────────────────────────────────┤
│                                  │
│  Jun 13 · 21:00 · Quarter-Final  │  ← Game date + stage
│                                  │
│  Spain                  [  2  ]  │
│  France                 [  2  ]  │
│                                  │
│  ─────  Penalty Shootout  ─────  │  ← Only for tied playoff
│  Spain (Pen.)           [  5  ]  │
│  France (Pen.)          [  4  ]  │
│                                  │
│  ┌─────────────┐ ┌─────────────┐ │
│  │    Skip     │ │ Save & Pub  │ │
│  └─────────────┘ └─────────────┘ │
└──────────────────────────────────┘
```

### Desktop — Centered Dialog (max-width ~400px)

```
┌─────────────────────────────────────────┐
│  Fill Latest Scores                [✕]  │
│  Game 2 of 3                            │
│  ████████████████░░░░░░░░░░░            │
├─────────────────────────────────────────┤
│                                         │
│  Jun 13 · 21:00 · Quarter-Final         │
│                                         │
│  Spain                        [  2  ]   │
│  France                       [  2  ]   │
│                                         │
│  ────────  Penalty Shootout  ────────   │
│  Spain (Penalty)              [  5  ]   │
│  France (Penalty)             [  4  ]   │
│                                         │
│                    [Skip]  [Save & Publish] │
└─────────────────────────────────────────┘
```

### Empty / Completion State

```
┌─────────────────────────────────────────┐
│  Fill Latest Scores                [✕]  │
├─────────────────────────────────────────┤
│                                         │
│               ✓  (CheckCircle, green)   │
│          All caught up!                 │
│   No unscored games in the last         │
│   24 hours.                             │
│                                         │
│                            [Close]      │
└─────────────────────────────────────────┘
```

### Loading State

```
┌─────────────────────────────────────────┐
│  Fill Latest Scores                [✕]  │
├─────────────────────────────────────────┤
│                                         │
│         ⏳ Loading games...             │
│         (CircularProgress)              │
│                                         │
└─────────────────────────────────────────┘
```

---

## Files to Create / Modify

### Create
- `app/db/quick-score-repository.ts` — `findRecentUnscoredGames`
- `app/components/header/quick-score-wizard-dialog.tsx` — wizard UI

### Modify
- `app/db/team-repository.ts` — add `findTeamsByIds`
- `app/actions/backoffice-actions.ts` — add `getRecentUnscoredGames` + `saveAndPublishSingleGameResult`
- `app/components/header/user-actions.tsx` — add menu item + dialog render
- `locales/en/backoffice.json` — add `wizard` translation keys
- `locales/es/backoffice.json` — add `wizard` translation keys (Spanish)
- `i18n/request.ts` — register `backoffice` namespace (not yet registered, needed for client-side `useTranslations`)

### CODE-STRUCTURE updates (per-task, in same commit as source change)
- `docs/code-structure/db.md`
- `docs/code-structure/actions.md`
- `docs/code-structure/components/components-shared-ui.md`
- `CODE-STRUCTURE.md` (call graph — new flow added)

---

## Mid-Level Design

### Call Graph Changes

**New flow (Flow 35 — Quick Score Wizard):**
```
UserActions (header) → QuickScoreWizardDialog
  → getRecentUnscoredGames       → findRecentUnscoredGames
  → saveAndPublishSingleGameResult → saveGameResults → processGameResult
                                                      → calculateGameScores
```

---

### `app/db/quick-score-repository.ts` *(new)*

**New functions:**

- **findRecentUnscoredGames(hoursBack: number)**: `Promise<ExtendedGameData[]>`
  Queries all games across all tournaments where `game_date` is between `NOW() - hoursBack hours` and `NOW()`, and no published result exists (LEFT JOIN `game_results` where row is NULL or `is_draft = true`). Includes `group`, `playoffStage`, and `gameResult` (draft) subqueries using `jsonObjectFrom`, mirroring `findGamesInTournament` structure. Ordered by `game_date ASC`.
  Calls: none (raw DB query via Kysely)
  Tests:
  - returns empty array when no games in the time window
  - returns only games with game_date in the past 24h
  - excludes games that already have a published (non-draft) result
  - includes games that have a draft result (unscored)
  - includes playoff stage info when game is a playoff game

---

### `app/db/team-repository.ts` *(modified)*

**New functions:**

- **findTeamsByIds(ids: string[])**: `Promise<Team[]>`
  Fetches teams by a list of IDs. Returns empty array when `ids` is empty.
  Calls: none
  Tests:
  - returns empty array when ids is empty
  - returns teams matching given ids
  - ignores unknown ids

---

### `app/actions/backoffice-actions.ts` *(modified)*

**New functions:**

- **getRecentUnscoredGames(locale: string)**: `Promise<{ games: ExtendedGameData[], teamsMap: Record<string, Team> }>`
  Server Action. Gets all unscored games from last 24h for the score wizard. Checks `user.isAdmin`, calls `findRecentUnscoredGames(24)`, applies localization to games (calls `applyLocalization` for each game via map), collects unique team IDs from `game.home_team` / `game.away_team`, fetches teams via `findTeamsByIds`, applies localization to each team, builds `teamsMap` as `Record<team.id, localizedTeam>`, returns `{ games, teamsMap }`.
  Calls: getLoggedInUser, findRecentUnscoredGames, applyLocalization (per game and per team), findTeamsByIds
  Tests:
  - throws Unauthorized when user is not admin
  - throws Unauthorized when no session
  - returns empty games and teamsMap when no recent unscored games
  - returns localized games and teamsMap for valid admin
  - teamsMap includes all teams referenced by returned games

- **saveAndPublishSingleGameResult(game: ExtendedGameData, locale: string)**: `Promise<void>`
  Server Action. Publishes a single game result from the score wizard. Checks `user.isAdmin`, sets `is_draft: false` on the game result, delegates to `saveGameResults([publishedGame])`.
  Calls: getLoggedInUser, saveGameResults
  Tests:
  - throws Unauthorized when user is not admin
  - calls saveGameResults with is_draft set to false
  - throws when result is not publishable (e.g., tied playoff without penalty scores)

---

### `app/components/header/quick-score-wizard-dialog.tsx` *(new)*

**New components:**

- **QuickScoreWizardDialog({ open, onClose })**: `JSX.Element`
  `[Client]` Full-screen (mobile) / centered (desktop) dialog wizard for scoring recent games.
  
  State: `games`, `teamsMap`, `currentIndex`, `loading`, `saving`, `saveError`, `editHomeScore`, `editAwayScore`, `editHomePenaltyScore`, `editAwayPenaltyScore`
  
  On `open` → `true`: calls `getRecentUnscoredGames(locale)`, populates `games` and `teamsMap`, sets `currentIndex = 0`.
  
  On `currentIndex` change: resets edit scores from `games[currentIndex].gameResult` (or undefined for fresh games).
  
  `handleSaveAndPublish`: builds updated game object with `is_draft: false` and current edit scores, calls `saveAndPublishSingleGameResult`, on success increments `currentIndex`.
  
  `handleSkip`: increments `currentIndex` without saving.
  
  Renders:
  - Loading: `CircularProgress` centered
  - Empty/completion (`games.length === 0` or `currentIndex >= games.length`): `CheckCircleIcon` + empty state text + Close button
  - Active game: `LinearProgress` (value = currentIndex/games.length*100), game date header, `BackofficeGameResultEditControls` with current scores + `onSave={handleSaveAndPublish}` + `onCancel={handleSkip}` (skip acts as cancel in the wizard — but separate Skip button for clarity)
  
  Layout: `Dialog` with `fullScreen={isMobile}` (uses `useMediaQuery(theme.breakpoints.down('sm'))`), `maxWidth="xs"` on desktop.
  
  Calls: getRecentUnscoredGames, saveAndPublishSingleGameResult, useLocale, useTranslations('backoffice'), useTheme, useMediaQuery, useState, useEffect
  Uses: useLocale, useTranslations('backoffice'), useTheme, useMediaQuery, useState, useEffect
  Renders: Dialog, DialogTitle, DialogContent, LinearProgress, Typography, BackofficeGameResultEditControls, Button, CircularProgress, CheckCircleIcon

---

### `app/components/header/user-actions.tsx` *(modified)*

**Changed functions:**

- **UserActions({ user })**: adds `openScoreWizard` state, an admin-only `MenuItem` ("Fill Latest Scores") before the Backoffice link, and a `<QuickScoreWizardDialog open={openScoreWizard} onClose={() => setOpenScoreWizard(false)} />` at the bottom. Menu item calls `setOpenScoreWizard(true); handleCloseUserMenu()`.
  Tests:
  - (existing tests unchanged)
  - new: Fill Latest Scores menu item only renders when user.isAdmin is true
  - new: clicking Fill Latest Scores opens QuickScoreWizardDialog

---

### i18n translations

**`locales/en/backoffice.json`** — add `wizard` key:
```json
"wizard": {
  "title": "Fill Latest Scores",
  "progress": "Game {current} of {total}",
  "saveAndPublish": "Save & Publish",
  "skip": "Skip",
  "emptyTitle": "All caught up!",
  "emptyDescription": "No unscored games in the last 24 hours.",
  "loading": "Loading games...",
  "close": "Close",
  "saveError": "Failed to save. Please try again.",
  "penaltyShootout": "Penalty Shootout"
}
```

**`locales/es/backoffice.json`** — add `wizard` key:
```json
"wizard": {
  "title": "Ingresar Últimos Resultados",
  "progress": "Partido {current} de {total}",
  "saveAndPublish": "Guardar y Publicar",
  "skip": "Omitir",
  "emptyTitle": "¡Todo al día!",
  "emptyDescription": "No hay partidos sin resultado en las últimas 24 horas.",
  "loading": "Cargando partidos...",
  "close": "Cerrar",
  "saveError": "Error al guardar. Por favor, intenta de nuevo.",
  "penaltyShootout": "Tanda de Penales"
}
```

**`i18n/request.ts`** — add:
```typescript
backoffice: (await import(`../locales/${locale}/backoffice.json`)).default,
```

Note: `backoffice.json` already exists and is used server-side by `backoffice-actions.ts` via `getTranslations`. Registering it here makes it available client-side via `useTranslations('backoffice')` in the wizard dialog.

---

## Implementation Steps

### Wave 1 — DB Layer
1. Create `app/db/quick-score-repository.ts` with `findRecentUnscoredGames`
2. Add `findTeamsByIds` to `app/db/team-repository.ts`
3. Update `docs/code-structure/db.md`
4. Commit Wave 1

### Wave 2 — Server Actions
5. Add `getRecentUnscoredGames` and `saveAndPublishSingleGameResult` to `app/actions/backoffice-actions.ts`
6. Add wizard translations to `locales/en/backoffice.json` and `locales/es/backoffice.json`
7. Register `backoffice` namespace in `i18n/request.ts`
8. Update `docs/code-structure/actions.md`
9. Commit Wave 2

### Wave 3 — UI Components
10. Create `app/components/header/quick-score-wizard-dialog.tsx`
11. Add wizard menu item and dialog to `app/components/header/user-actions.tsx`
12. Update `docs/code-structure/components/components-shared-ui.md`
13. Update `CODE-STRUCTURE.md` call graph (Flow 35)
14. Commit Wave 3

---

## Testing Strategy

### Test Infrastructure

All tests use the project's established mock infrastructure:

```typescript
// Data factories — use for all game/team/result fixtures
import { testFactories } from '@/__tests__/db/test-factories'
// e.g. testFactories.game({ game_date: pastDate, tournament_id: 't1' })
//      testFactories.gameResult({ is_draft: true })
//      testFactories.team({ id: 'team-1', name: 'Spain' })

// DB query mocks — use for all repository tests
import { createMockSelectQuery, createMockDatabase } from '@/__tests__/db/mock-helpers'
// e.g. const mockDb = createMockDatabase()
//      mockDb.selectFrom.mockReturnValue(createMockSelectQuery([game]))

// Auth mocks — use for server action tests
import { setupTestMocks } from '@/__tests__/mocks/setup-helpers'
// e.g. setupTestMocks({ session: true, sessionDefaults: { isAdmin: true } })

// i18n mocks — already wired globally in vitest.setup.ts
import { mockUseLocale, mockUseTranslations } from '@/__tests__/mocks/next-intl.mocks'
```

---

### Unit Tests (Vitest)

#### `__tests__/db/quick-score-repository.test.ts`

Setup: `const mockDb = createMockDatabase()` (mocks Kysely chain)

- **returns empty array when no games exist in the 24h window**
  - Input: `findRecentUnscoredGames(24)` with `mockDb.selectFrom` returning `[]`
  - Expected: `[]`

- **returns only games whose game_date falls within [NOW - 24h, NOW]**
  - Setup: 3 games — one 23h ago (in window), one 25h ago (out), one 1h in the future (out)
  - Input: `findRecentUnscoredGames(24)`
  - Expected: array with only the 23h-ago game

- **excludes games that have a published (non-draft) result**
  - Setup: two games in window — one with `gameResult.is_draft = false`, one with no result
  - Expected: only the unresulted game is returned

- **includes games that have only a draft result (not yet published)**
  - Setup: game in window with `gameResult.is_draft = true`
  - Expected: game is returned with its draft `gameResult` attached

- **includes playoff stage info when game is a playoff game**
  - Setup: game in window with no published result, associated with a playoff round
  - Expected: returned `ExtendedGameData` has non-null `playoffStage`

#### `__tests__/db/team-repository.test.ts` (new `it` blocks)

- **findTeamsByIds returns empty array when ids is empty**
  - Input: `findTeamsByIds([])`
  - Expected: `[]` (no DB call made)

- **findTeamsByIds returns matching teams**
  - Setup: `mockDb` returns `[testFactories.team({ id: 'team-1' }), testFactories.team({ id: 'team-2' })]`
  - Input: `findTeamsByIds(['team-1', 'team-2'])`
  - Expected: array of 2 teams

- **findTeamsByIds ignores unknown ids (returns only found rows)**
  - Setup: DB returns only 1 team for ids `['team-1', 'unknown-id']`
  - Expected: array with 1 team

#### `__tests__/actions/backoffice-actions.test.ts` (new `it` blocks)

Setup: `setupTestMocks({ session: true, sessionDefaults: { isAdmin: true } })`

- **getRecentUnscoredGames throws Unauthorized when user is not admin**
  - Setup: `setupTestMocks({ session: true, sessionDefaults: { isAdmin: false } })`
  - Input: `getRecentUnscoredGames('en')`
  - Expected: throws with message matching `backoffice.unauthorized`

- **getRecentUnscoredGames throws Unauthorized when no session**
  - Setup: `setupTestMocks({ session: false })`
  - Expected: throws Unauthorized

- **getRecentUnscoredGames returns empty games and empty teamsMap when no recent unscored games**
  - Setup: `findRecentUnscoredGames` mock returns `[]`, `findTeamsByIds` not called
  - Input: `getRecentUnscoredGames('en')`
  - Expected: `{ games: [], teamsMap: {} }`

- **getRecentUnscoredGames returns localized game names and teamsMap**
  - Setup: `findRecentUnscoredGames` returns `[testFactories.game({ home_team: 'team-1', away_team: 'team-2' })]`; `findTeamsByIds(['team-1', 'team-2'])` returns `[testFactories.team({ id: 'team-1' }), testFactories.team({ id: 'team-2' })]`
  - Expected: `teamsMap` has keys `'team-1'` and `'team-2'`; teams are localized (applyLocalization applied)

- **saveAndPublishSingleGameResult throws Unauthorized when user is not admin**
  - Setup: non-admin session
  - Expected: throws Unauthorized

- **saveAndPublishSingleGameResult calls saveGameResults with is_draft false**
  - Setup: admin session, `saveGameResults` mocked
  - Input: game with `gameResult.home_score = 2, away_score = 1, is_draft = true`
  - Expected: `saveGameResults` called with game where `gameResult.is_draft === false`

- **saveAndPublishSingleGameResult propagates error from saveGameResults (e.g., assertPublishable fails)**
  - Setup: `saveGameResults` mock throws `'Cannot publish incomplete result'`
  - Expected: error propagates to caller

#### `__tests__/components/header/quick-score-wizard-dialog.test.tsx`

Setup: import `testFactories`, `setupTestMocks`, mock `getRecentUnscoredGames` and `saveAndPublishSingleGameResult` as vi.fn()

- **renders loading state immediately on open before server action resolves**
  - Setup: `getRecentUnscoredGames` is a delayed promise (never resolves during test)
  - Render: `<QuickScoreWizardDialog open={true} onClose={jest.fn()} />`
  - Expected: "Loading games..." text or CircularProgress visible

- **renders empty state when getRecentUnscoredGames returns no games**
  - Setup: `getRecentUnscoredGames` resolves with `{ games: [], teamsMap: {} }`
  - Expected: "All caught up!" text visible; no score inputs

- **renders "Game 1 of 2" progress when 2 games are returned**
  - Setup: `getRecentUnscoredGames` resolves with `{ games: [game1, game2], teamsMap }`
  - Expected: progress text "Game 1 of 2" visible; LinearProgress with `value=0`

- **renders score inputs for current game using home/away team names from teamsMap**
  - Setup: game with `home_team: 'team-1'`, `teamsMap: { 'team-1': { name: 'Spain' }, 'team-2': { name: 'France' } }`
  - Expected: "Spain" and "France" labels visible in score form

- **Skip advances wizard to next game without calling saveAndPublishSingleGameResult**
  - Setup: 2 games loaded; user clicks "Skip"
  - Expected: `saveAndPublishSingleGameResult` not called; "Game 2 of 2" progress shown

- **Save & Publish calls saveAndPublishSingleGameResult and advances to next game**
  - Setup: 2 games, user enters scores and clicks "Save & Publish"
  - Expected: `saveAndPublishSingleGameResult` called with first game; "Game 2 of 2" shown

- **shows completion state after all games are processed**
  - Setup: 1 game, user clicks "Skip"
  - Expected: completion/empty state shown ("All caught up!")

- **shows error from saveAndPublishSingleGameResult without advancing**
  - Setup: `saveAndPublishSingleGameResult` rejects with error "Cannot publish incomplete result"
  - Expected: error string rendered in `BackofficeGameResultEditControls`'s `error` prop area (red typography); progress still shows "Game 1 of 1"; `saveAndPublishSingleGameResult` not called a second time

- **Fill Latest Scores menu item not rendered for non-admin user**
  - Setup: render `<UserActions user={testFactories.user({ isAdmin: false })} />`; open menu
  - Expected: "Fill Latest Scores" not in document

- **Fill Latest Scores menu item rendered for admin user**
  - Setup: render `<UserActions user={testFactories.user({ isAdmin: true })} />`; open menu
  - Expected: "Fill Latest Scores" in document

### Integration Points
- The penalty shootout section (from `BackofficeGameResultEditControls`) appears automatically when `isPlayoffGame && homeScore === awayScore`. For wizard tests using `BackofficeGameResultEditControls` directly: no need to re-test this — it's the existing component's behavior. Wizard tests just verify the `isPlayoffGame` prop is set correctly from `!!game.playoffStage`.
- `saveGameResults` (existing) handles the `assertPublishable` guard — wizard catches the thrown error and shows it via `saveError` state → `BackofficeGameResultEditControls`'s `error` prop.

---

## Validation

1. Log in as admin user
2. Open avatar menu — confirm "Fill Latest Scores" appears (hidden for non-admins)
3. With no recent unscored games: open wizard → confirm empty state
4. With a recent unscored group-stage game: open wizard → enter scores → Save & Publish → confirm game shows as published in backoffice
5. With a recent unscored playoff game with tied scores: open wizard → enter tied scores → confirm penalty score inputs appear → enter penalty scores → Save & Publish → confirm published
6. Try publishing tied playoff game without penalty scores → confirm error shown (thrown by `assertPublishable`)
7. Skip a game → confirm wizard advances without publishing
8. Verify progress counter updates correctly
9. Switch locale to English → confirm all wizard text is in English
10. Switch locale to Spanish → confirm all wizard text is in Spanish
11. Test on mobile viewport → confirm full-screen dialog
12. Test on desktop viewport → confirm centered dialog

---

## Open Questions / Assumptions

- **Cross-tournament scope**: Wizard shows games from ALL tournaments (no filter on tournament active status), relying on the 24h time window to limit results. Acceptable for v1.
- **Team names**: Uses `applyLocalization` on teams in the server action; names are display-ready when passed to dialog.
- **Score recalculation latency**: Each `saveAndPublishSingleGameResult` triggers `calculateGameScores` — expected slight delay per game, same as backoffice flow.
- **`is_active` on tournaments**: Not filtering by active status since field existence is uncertain. The 24h window provides natural scope.

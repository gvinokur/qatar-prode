# Story 342: Pre-tournament Engagement Center

## Context

Currently the Tournament Hub's Action Center and Leaderboard widgets show a generic "No games in the next 7 days" empty state and an uninviting blank section when the tournament is more than 7 days away. This is a missed opportunity — users should be completing their prediction brackets and forming friend groups during this period. The goal is to transform the hub into an engaging "Waiting Room" that drives prediction completion and social connection before kickoff.

Reference mockup: `mockups/pre-tournament-action-center-mockup-v2.html`

---

## Worktree

- **Worktree Path:** `/Users/gvinokur/Personal/qatar-prode-story-342`
- **Branch:** `feature/story-342`
- **Plan File:** `plans/STORY-342-plan.md`
- **Context File:** `plans/STORY-342-context.md`

---

## Acceptance Criteria

1. **Permanent Hero Countdown**: When tournament is >7 days away (mode=empty, tournament not started), Action Center shows a prominent visual countdown to kickoff instead of the generic empty state.
2. **Tournament Opener Feature**: The first tournament game is always surfaced as a featured prediction card when >7 days away (even when the game isn't in the 7-day dashboard window).
3. **Side-by-Side Progress**: QT and Individual Awards cards displayed in a responsive grid with progress indicators ("3/12 groups predicted" / "Pending").
4. **Unified Progress Tracking**: Total game prediction completion (predicted games / total games) surfaced with a `CircularProgress` indicator.
5. **Social CTA Replacement**: When user belongs to 0 groups, the Leaderboard "Your Standings" widget is replaced by a "Social Hub" card inviting them to create or find a group.
6. **i18n**: All new elements fully localized in EN and Argentine Spanish (ES).

---

## Technical Approach

The feature builds on the existing Tournament Hub architecture with targeted additions:

### When the pre-tournament view activates

`getActionCenterGames` returns `mode: 'empty'` when `findGamesForDashboard` (last 24h + next 7 days window) returns 0 results. This occurs when tournament starts > 7 days in the future. The new pre-tournament view activates when:

```
data.mode === 'empty' AND data.firstGameDate != null AND !data.tournamentFinished
```

(If the tournament has no games or already finished, keep existing behavior.)

### Architecture of changes

**DB layer** — one new function:
- `findFirstGameFullData(tournamentId)` → `ExtendedGameData | undefined` (first game with group/playoff/gameResult metadata, needed to render the `FlippableGameCard`)

**Actions layer** — expand two existing actions:
- `getActionCenterGames`: add `firstGameDate`, `openerGame`, `totalGames`, `predictedGames`, `hasAwardsPredictions` to `ActionCenterData`; call `findFirstGameFullData` + `getGameCountsForTournament` + `findTournamentGuessByUserIdTournament` when appropriate
- `getLeaderboardPeekData`: change return type to `LeaderboardPeekResult { groups, userHasGroups }` so the component can distinguish "no groups at all" from "groups exist but no rankings yet"

**Component layer** — new sub-components + modified shells:
- `PreTournamentHero` (new Client component): renders the countdown, opener game card, progress section
- `SocialHubCard` (new Client component): renders the social CTA when user has no groups
- `ActionCenterCarousel`: delegates to `PreTournamentHero` when pre-tournament conditions met
- `TournamentHubLeaderboardPeek`: renders `SocialHubCard` when `userHasGroups=false`

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `app/db/game-repository.ts` | Modify | Add `findFirstGameFullData` |
| `app/actions/hub-actions.ts` | Modify | Expand `ActionCenterData`, update `getActionCenterGames` and `getLeaderboardPeekData` |
| `app/components/tournament-hub/pre-tournament-hero.tsx` | **Create** | New Client component |
| `app/components/tournament-hub/social-hub-card.tsx` | **Create** | New Client component |
| `app/components/tournament-hub/action-center-carousel.tsx` | Modify | Delegate to `PreTournamentHero` |
| `app/components/tournament-hub/tournament-hub-leaderboard-peek.tsx` | Modify | Render `SocialHubCard` when no groups |
| `locales/en/hub.json` | Modify | Add `preTournament.*` and `socialHub.*` keys |
| `locales/es/hub.json` | Modify | Same keys in Argentine Spanish |
| `docs/code-structure/components/components-tournament-hub.md` | Modify | Document new components |
| `docs/code-structure/actions.md` | Modify | Update `ActionCenterData` and `getLeaderboardPeekData` signatures |

---

## Visual Design

### Pre-Tournament State Layout (in Action Center)

```
┌─────────────────────────────────────────┐
│            Action Center                │
│        Countdown to kickoff             │
├─────────────────────────────────────────┤
│         TOURNAMENT KICKOFF              │  ← overline, primary color
│                                         │
│    [ 52 ]    [ 14 ]    [ 28 ]           │
│    DAYS      HOURS      MINS            │  ← h3, bold, primary color
│                                         │
│   (gradient paper bg, purple border)   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      Opening Match • June 11, 20:00     │  ← overline, centered
│  [🇲🇽]     VS     [🇫🇷]               │
│  Mexico           France                │
│                                         │
│         [  Predict Opener  ]            │  ← FlippableGameCard (compact)
└─────────────────────────────────────────┘

[  Qualified Teams  ] [Individual Awards ]  ← Grid(xs:12, sm:6) with progress bars
  Groups icon            Trophy icon
  "Predict which          "Golden Boot..."
   teams qualify"
  ████░░░░  3/12       ░░░░░░░░  Pending
  [Go to page]          [Go to page]

┌──────────────────────┐
│  Overall Completion  │  ← dashed border box
│  12 of 104 games    │  → CircularProgress (12%)
└──────────────────────┘
```

### Social Hub Card (replaces Leaderboard "Your Standings" when user has 0 groups)

```
┌─────────────────────────────────────────┐
│           Your Standings                │  ← h6, centered
│    Compete with friends and colleagues  │  ← body2, centered
│                                         │
│           👥  (group_add icon)          │  ← 48px, secondary color
│         Don't play alone!               │  ← h6
│  The best way to enjoy the World Cup    │
│  is in a group. Create yours or join    │
│  an existing one.                       │
│                                         │
│  [Create Group]    [Find Public Group]  │  ← contained/outlined buttons
└─────────────────────────────────────────┘
```

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**

- **Flow 28 (Tournament Hub — Action Center data flow):** `getActionCenterGames` gains additional calls — `getGameCountsForTournament` (for total game count), `findFirstGameFullData` (when mode=empty and tournament not started), and `findTournamentGuessByUserIdTournament` (for awards prediction status). Output extends to `ActionCenterCarousel` → `PreTournamentHero` (new branch).

- **Flow 29 (Tournament Hub — Leaderboard Peek data flow):** `getLeaderboardPeekData` returns new shape `LeaderboardPeekResult`. `TournamentHubLeaderboardPeek` gains a branch: when `userHasGroups=false`, renders `SocialHubCard` instead of existing content.

**New components:**
- `PreTournamentHero` — renders within `ActionCenterCarousel`'s GuessesContextProvider
- `SocialHubCard` — renders within `TournamentHubLeaderboardPeek`

---

### `app/db/game-repository.ts` *(modified)*

**New functions:**

- **findFirstGameFullData(tournamentId: string)**: `Promise<ExtendedGameData | undefined>`
  Returns the first game in the tournament (by `game_date ASC`) with full `ExtendedGameData` shape: includes `group`, `playoffStage`, `gameResult` JSON objects (same subquery pattern as `findGamesForDashboard`). Cached with `cache()`. Used by `getActionCenterGames` when mode would be 'empty' and tournament hasn't started — to provide an opener game card.
  Tests:
  - returns undefined when tournament has no games
  - returns first game sorted by game_date ascending
  - returned object has group and playoffStage fields (ExtendedGameData shape)
  - result is cached (same reference on repeated calls with same tournamentId)

---

### `app/actions/hub-actions.ts` *(modified)*

**New exports:**

- **LeaderboardPeekResult**: `{ groups: GroupPeekData[], userHasGroups: boolean }` — New return shape for `getLeaderboardPeekData` so the component can distinguish "user has no groups at all" from "user has groups but no ranking yet".

**Changed types:**

- **ActionCenterData** *(extended)*:
  ```typescript
  firstGameDate: Date | null           // game_date of first tournament game (null if none)
  openerGame: ExtendedGameData | null  // full game data (populated only when mode=empty + tournament not started)
  totalGames: number                   // total games in tournament (for progress indicator)
  predictedGames: number               // games user has predicted (guessesArray.length)
  hasAwardsPredictions: boolean        // true if user has a non-null tournament guess with any award field set
  ```

**Changed functions:**

- **getActionCenterGames(tournamentId: string, locale: Locale)**: `Promise<ActionCenterData>` *(signature unchanged, return type expanded)*
  Now also calls `getGameCountsForTournament(tournamentId)` for `totalGames`. Sets `predictedGames = guessesArray.length`. Sets `firstGameDate = firstGame?.game_date ?? null`. When `mode === 'empty'` and `firstGame.game_date > Date.now()` (tournament not yet started): calls `findFirstGameFullData(tournamentId)` for `openerGame` and includes its guess in `gameGuesses` if user has predicted it. Calls `findTournamentGuessByUserIdTournament(user.id, tournamentId)` to compute `hasAwardsPredictions` (true if result is non-null and any of `best_player_id`, `top_goalscorer_player_id`, `best_goalkeeper_player_id`, `best_young_player_id` is set).
  Calls: (existing) + getGameCountsForTournament, findFirstGameFullData (conditional), findTournamentGuessByUserIdTournament
  Tests:
  - sets firstGameDate to first game's date when games exist
  - sets firstGameDate to null when no games exist
  - sets openerGame to full ExtendedGameData when mode=empty and tournament not started
  - openerGame is null when mode=empty but tournament is finished
  - openerGame is null when mode=urgent or fallback
  - totalGames reflects getGameCountsForTournament.total
  - predictedGames equals number of game guesses the user has submitted
  - hasAwardsPredictions is false when no tournament guess exists
  - hasAwardsPredictions is true when any award field is set on tournament guess
  - opener game's guess is included in gameGuesses when user has predicted it

- **getLeaderboardPeekData(tournamentId: string, _locale: Locale)**: `Promise<LeaderboardPeekResult>` *(was: `Promise<GroupPeekData[]>`)*
  Now returns `{ groups: GroupPeekData[], userHasGroups: boolean }`. `userHasGroups` is `allGroups.length > 0` — computed before the ranking data filter. Returns `{ groups: [], userHasGroups: false }` when user is unauthenticated. Returns `{ groups: [], userHasGroups: true }` when user has groups but none have ranking data yet.
  Calls: (unchanged)
  Tests:
  - returns userHasGroups=false when user is unauthenticated
  - returns userHasGroups=false when user has no groups (owned or participant)
  - returns userHasGroups=true when user has groups but no ranking data yet
  - returns userHasGroups=true with populated groups array when ranking data exists
  - groups array is same data as before (backward-compatible content)

---

### `app/components/tournament-hub/pre-tournament-hero.tsx` *(new)*

**New components:**

- **PreTournamentHero({ firstGameDate, openerGame, tournamentId, locale, teamsMap, gameGuesses, tournamentMaxSilver, tournamentMaxGolden, qtAndAwardsOpen, msUntilPredictionLock, totalGames, predictedGames, hasAwardsPredictions })**: `JSX.Element` — [Client] Renders three sections in order: (1) `CountdownSection` (gradient Paper, overline label, days/hours/mins boxes from `useCountdown` hook or inline state), (2) if `openerGame` is not null, a compact game card using `FlippableGameCard` with "Opening Match" overline, (3) if `qtAndAwardsOpen`, a `Grid container spacing=2` with QT card (GroupsIcon, progress bar showing groups-predicted / total-groups when available, "Go to page" button) and Awards card (EmojiEventsIcon, "Pending" or check indicator, "Go to page" button), plus an overall progress box showing `predictedGames` of `totalGames` with `CircularProgress`. All text from `useTranslations('hub')`.
  Calls: FlippableGameCard
  Uses: useState, useEffect (for live countdown), useTranslations, LinearProgress, CircularProgress, Grid, Card, Paper, Typography, Button, Link
  Tests:
  - renders countdown days/hours/mins derived from firstGameDate
  - shows "0 Days 0 Hours 0 Mins" (or hides countdown) gracefully when firstGameDate is in the past (boundary: tournament just starting)
  - renders opener card when openerGame is non-null
  - does not render opener card when openerGame is null
  - renders QT and Awards progress cards when qtAndAwardsOpen is true
  - does not render QT/Awards cards when qtAndAwardsOpen is false
  - renders CircularProgress with correct percentage (predictedGames / totalGames * 100)
  - renders CircularProgress at 0% without crashing when totalGames is 0 (guards against division by zero)

---

### `app/components/tournament-hub/social-hub-card.tsx` *(new)*

**New components:**

- **SocialHubCard({ locale, tournamentId })**: `JSX.Element` — [Client] Renders a Paper (secondary-tinted bg, dashed border, centered) containing: GroupAddIcon (48px, secondary color), h6 title, body2 description, and two buttons: "Create Group" (contained, secondary) linking to `/${locale}/tournaments/${tournamentId}/friend-groups/new` (or root friend-groups page), and "Find Public Group" (outlined, secondary) linking to the public group discovery page. All text from `useTranslations('hub.socialHub')`.
  Uses: useTranslations, Paper, Typography, Button, Icon, Link, Stack, Box
  Tests:
  - renders Create Group button with correct href for given locale and tournamentId
  - renders Find Public Group button
  - does not render when called outside proper context (prop-types validated via TypeScript)

---

### `app/components/tournament-hub/action-center-carousel.tsx` *(modified)*

**Changed functions:**

- **ActionCenterCarousel({ data, tournamentId, locale })**: `JSX.Element` — *(signature unchanged, behavior extended)*
  When `data.mode === 'empty'` AND `data.firstGameDate !== null` AND `!data.tournamentFinished`: renders header then `<PreTournamentHero>` (passing all pre-tournament data fields). When `data.mode === 'empty'` AND tournament is finished or has no firstGameDate: keeps existing empty-state box. When `data.mode !== 'empty'`: existing behavior + QT/Awards quick-action cards now also show Awards progress indicator based on `data.hasAwardsPredictions`.
  Renders: PreTournamentHero (new branch), existing branches unchanged
  Tests:
  - renders PreTournamentHero when mode=empty and firstGameDate is set and tournament not finished
  - renders existing empty box when mode=empty and tournamentFinished=true
  - renders existing carousel when mode=urgent or fallback

---

### `app/components/tournament-hub/tournament-hub-leaderboard-peek.tsx` *(modified)*

**Changed functions:**

- **TournamentHubLeaderboardPeek({ tournamentId, locale })**: `JSX.Element | null` — [Server] Now calls updated `getLeaderboardPeekData` which returns `LeaderboardPeekResult`. When `result.userHasGroups === false`: renders section header then `<SocialHubCard locale tournamentId>`. When `result.userHasGroups === true` but `result.groups.length === 0`: renders existing empty-state Paper with `noRankingData` message. When `result.groups.length > 0`: existing group card rendering. Returns `null` only for unauthenticated case (handled by userHasGroups=false short-circuit — renders SocialHubCard instead, which is the right behavior for unauthenticated too since we can invite them to join/create).
  Calls: getLeaderboardPeekData
  Renders: SocialHubCard (new branch), LeaderboardPeekCard (existing)
  Tests:
  - renders SocialHubCard when userHasGroups is false
  - renders noRankingData empty state when userHasGroups=true but groups is empty
  - renders LeaderboardPeekCards when groups is non-empty

---

## i18n Changes

### New keys in `locales/en/hub.json`

```json
{
  "preTournament": {
    "countdownTitle": "Tournament Kickoff",
    "days": "Days",
    "hours": "Hours",
    "mins": "Mins",
    "openerLabel": "Opening Match",
    "predictOpener": "Predict Opener",
    "overallProgress": "Overall Completion",
    "gamesOfTotal": "{predicted} of {total} games predicted",
    "qtProgressLabel": "{predicted} of {total} groups",
    "qtNotStarted": "Not started",
    "awardsNotStarted": "Pending",
    "awardsDone": "Submitted"
  },
  "socialHub": {
    "title": "Don't play alone!",
    "description": "The best way to enjoy the World Cup is in a group. Create yours and invite your friends.",
    "createGroup": "Create Group",
    "findGroup": "Find Public Group"
  }
}
```

### New keys in `locales/es/hub.json` (Argentine Spanish)

```json
{
  "preTournament": {
    "countdownTitle": "Inicio del Torneo",
    "days": "Días",
    "hours": "Horas",
    "mins": "Min",
    "openerLabel": "Partido Inaugural",
    "predictOpener": "Predecir Partido Inaugural",
    "overallProgress": "Progreso General",
    "gamesOfTotal": "{predicted} de {total} partidos predichos",
    "qtProgressLabel": "{predicted} de {total} grupos",
    "qtNotStarted": "Sin empezar",
    "awardsNotStarted": "Pendiente",
    "awardsDone": "Enviado"
  },
  "socialHub": {
    "title": "¡No juegues solo!",
    "description": "La mejor manera de disfrutar el Mundial es en grupo. Creá el tuyo e invitá a tus amigos.",
    "createGroup": "Crear Grupo",
    "findGroup": "Encontrar Grupo Público"
  }
}
```

---

## Implementation Steps

### Wave 1 — DB + Actions (backend foundation)

**Task 1**: Add `findFirstGameFullData` to `game-repository.ts`
- New cached function using same subquery pattern as `findGamesForDashboard` (group + playoffStage + gameResult JSON objects) but ordered by `game_date ASC` with `executeTakeFirst()`
- CODE-STRUCTURE files to update: `docs/code-structure/db.md` (game-repository section); call graph: NO

**Task 2**: Expand `ActionCenterData` + update `getActionCenterGames`
- Add new fields to `ActionCenterData` interface
- Add `getGameCountsForTournament`, `findFirstGameFullData` (conditional), `findTournamentGuessByUserIdTournament` calls
- Compute `predictedGames`, `firstGameDate`, `openerGame`, `hasAwardsPredictions`
- CODE-STRUCTURE files to update: `docs/code-structure/actions.md` (hub-actions section); call graph: YES (Flow 28)

**Task 3**: Update `getLeaderboardPeekData` return type
- Export `LeaderboardPeekResult` interface
- Change return from `GroupPeekData[]` to `LeaderboardPeekResult`
- Compute `userHasGroups = allGroups.length > 0` (before ranking filter)
- CODE-STRUCTURE files to update: `docs/code-structure/actions.md`; call graph: YES (Flow 29)

### Wave 2 — New components (can run after Wave 1)

**Task 4**: Create `PreTournamentHero` component
- Countdown using `useEffect` + `setInterval` (1s updates), computing `days/hours/mins` from `firstGameDate - Date.now()`
- Opener game: `FlippableGameCard` with `GuessesContextProvider` wrapper (inherits from parent carousel's provider)
- Progress section: Grid with QT card (LinearProgress, groups progress text) + Awards card (LinearProgress, hasAwardsPredictions determines 0%/100%)
- Overall progress: `CircularProgress` with `predictedGames/totalGames * 100`
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md`; call graph: NO

**Task 5**: Create `SocialHubCard` component
- CTA card with create/find group buttons
- Hrefs: create group = `/${locale}/tournaments/${tournamentId}/friend-groups` (hub for group creation), find group = public group discovery page
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md`; call graph: NO

### Wave 3 — Wire-up (after Wave 1 + Wave 2)

**Task 6**: Update `ActionCenterCarousel`
- Import `PreTournamentHero`
- Add pre-tournament branch: `data.mode === 'empty' && data.firstGameDate && !data.tournamentFinished`
- Pass all new `ActionCenterData` fields to `PreTournamentHero`
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md`; call graph: NO

**Task 7**: Update `TournamentHubLeaderboardPeek`
- Import `SocialHubCard`
- Call updated `getLeaderboardPeekData` (destructure `{ groups, userHasGroups }`)
- Render `SocialHubCard` when `!userHasGroups`
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md`; call graph: YES (Flow 29)

### Wave 4 — i18n

**Task 8**: Add `preTournament.*` and `socialHub.*` keys to EN and ES hub.json
- CODE-STRUCTURE files to update: none (i18n files are not tracked in CODE-STRUCTURE); call graph: NO

---

## Testing Strategy

### Unit / Integration tests

**`app/components/tournament-hub/__tests__/`** (existing directory):

- `hub-actions.test.ts` (or similar): test `getActionCenterGames` new fields and `getLeaderboardPeekData` new return type (mock DB functions)
- `pre-tournament-hero.test.tsx`: test countdown rendering, opener card presence/absence, progress section, i18n keys
- `social-hub-card.test.tsx`: test button hrefs, i18n keys
- `action-center-carousel.test.tsx` (update): test new PreTournamentHero branch renders correctly
- `tournament-hub-leaderboard-peek.test.tsx` (update): test SocialHubCard renders when userHasGroups=false

### Test factories and mock patterns

Follow existing test patterns found in `app/__tests__/helpers/`:

- **`testFactories.game(overrides?)`** — create mock `ExtendedGameData` objects. Use for `openerGame` and `games` array mocks.
- **`testFactories.gameGuess(overrides?)`** — create mock `GameGuessNew` objects for `gameGuesses` map.
- **`testFactories.tournament(overrides?)`** — create mock tournament objects for `findTournamentById` mock return.
- **`testFactories.tournamentGuess(overrides?)`** — create mock tournament guess for `findTournamentGuessByUserIdTournament` mock return; set award fields to null for `hasAwardsPredictions=false`, set e.g. `best_player_id: 'player-1'` for `hasAwardsPredictions=true`.

**Mocking DB functions in action tests** — use vi.mock at module level:
```typescript
vi.mock('@/app/db/game-repository', () => ({
  findGamesForDashboard: vi.fn(),
  findFirstGameInTournament: vi.fn(),
  findLastGameInTournament: vi.fn(),
  findFirstGameFullData: vi.fn(),
  getGameCountsForTournament: vi.fn(),
}))
```

**Rendering components** — use `renderWithTheme` wrapper from test helpers to ensure MUI theme context is available:
```typescript
import { renderWithTheme } from '@/app/__tests__/helpers/render-with-theme'
```

### Manual verification

1. Set `firstGame.game_date` to a date >7 days in the future (can be done via DB seed or feature flag for testing)
2. Load the Tournament Hub
3. Verify: countdown shows, opener card is present and interactive, progress section appears
4. Create a user with no groups → verify Social Hub card appears instead of standings

### i18n verification

- Check both `/en` and `/es` locales render all new keys
- Verify no missing translation warnings in console

---

## Validation Considerations

- **SonarCloud**: 0 new issues — no any types, proper null checks, no unused imports
- **Coverage**: ≥80% on new files (`pre-tournament-hero.tsx`, `social-hub-card.tsx`)
- **TypeScript strict**: All new fields typed, no implicit any
- **Build**: Verify `npm run build` passes with no type errors
- **Lint**: `npm run lint` clean

---

## Open Questions / Risks

1. **QT group count for progress bar**: The "3/12 groups predicted" label requires knowing how many groups have QT predictions. The QT prediction schema needs to be investigated during implementation (likely stored as JSONB in `tournament_guess` or a separate table). If the exact per-group count is not accessible without a complex query, fall back to: show "Started" vs "Not started" based on whether any QT prediction record exists for the user.

2. **Friend group creation URL**: Need to verify the exact URL for creating a new group. The `SocialHubCard` links to the friend-groups section — confirm the correct route during implementation.

3. **Unauthenticated users and Social Hub**: Currently `getLeaderboardPeekData` returns `userHasGroups=false` for unauthenticated users. The Social Hub CTA will be shown to unauthenticated users, which may be confusing if group creation requires auth. Consider whether to show a "Sign in to create groups" message instead — defer decision to implementation review.

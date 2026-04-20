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

1. **Permanent Hero Countdown**: When tournament is >7 days away (mode=empty, tournament not started), Action Center shows a prominent visual countdown to the first game instead of the generic empty state.
2. **Post-Start Celebration Banner**: For ~48h after the first game kicks off, a celebration banner appears **above** the normal carousel (carousel still shows normally below it).
3. **Tournament Opener Feature**: The first tournament game is always surfaced as a featured prediction card when >7 days away (even when the game isn't in the 7-day dashboard window).
4. **Single-game centering**: When the carousel has exactly 1 game, that card is centered (not left-aligned).
5. **Unified Progress Row**: QT, Individual Awards, and Overall game completion all rendered as `CircularProgress` in a **single responsive row** — full titles on desktop, icon + short label on mobile.
6. **Social CTA Replacement**: When user belongs to 0 groups, the Leaderboard "Your Standings" widget is replaced by a "Social Hub" card inviting them to create or find a group.
7. **Pre-Tournament Groups Preview**: When user HAS groups but no rankings yet, show their group names ("You're in Group X, Group Y, Group Z, and N others.") with 3 CTAs: Go to Groups page, Create a new group, Discover public groups.
8. **i18n**: All new elements fully localized in EN and Argentine Spanish (ES).

---

## Technical Approach

The feature builds on the existing Tournament Hub architecture with targeted additions:

### When each new feature activates

**Pre-tournament countdown hero** (`mode === 'empty' AND firstGameDate != null AND !tournamentFinished`):
- `findGamesForDashboard` returns 0 results (no games in last 24h + next 7-day window)
- Tournament has a first game in the future
- Countdown ticks down to `firstGameDate`
- Opener game card shows for the first tournament game
- Progress row (QT / Awards / Overall) shows below

**Post-start celebration banner** (`tournamentJustStarted === true`):
- First game kicked off within the last 48 hours (`firstGame.game_date < now AND now - firstGame.game_date < 48h`)
- Banner renders ABOVE the normal carousel (which still shows games normally)
- Celebration styling: festive gradient, "🎉 Tournament has started!" message

**Single-game centering**:
- `data.games.length === 1` → center the game card (any mode)

(If the tournament has no games or is long finished, keep existing behavior.)

### Architecture of changes

**DB layer** — one new function:
- `findFirstGameFullData(tournamentId)` → `ExtendedGameData | undefined` (first game with group/playoff/gameResult metadata, needed to render the `FlippableGameCard`)

**Actions layer** — expand two existing actions:
- `getActionCenterGames`: add `firstGameDate`, `openerGame`, `totalGames`, `predictedGames`, `hasAwardsPredictions`, `tournamentJustStarted` to `ActionCenterData`; call `findFirstGameFullData` + `getGameCountsForTournament` + `findTournamentGuessByUserIdTournament` when appropriate
- `getLeaderboardPeekData`: change return type to `LeaderboardPeekResult { groups, userHasGroups, allGroupNames }` so the component can distinguish "no groups at all" from "groups exist but no rankings yet", and can list group names for the pre-tournament preview

**Component layer** — new sub-components + modified shells:
- `PreTournamentHero` (new Client component): renders the countdown, opener game card, 3-item circular progress row
- `TournamentStartBanner` (new Client component): celebration banner shown above the carousel for ~48h after first game kicks off
- `SocialHubCard` (new Client component): renders the social CTA when user has no groups
- `PreTournamentGroupsPreview` (new Client component): renders group names + 3 CTAs when user has groups but no rankings yet
- `ActionCenterCarousel`: delegates to `PreTournamentHero` when pre-tournament, shows `TournamentStartBanner` above carousel for 48h post-start, centers single-game carousel
- `TournamentHubLeaderboardPeek`: renders `SocialHubCard` when `userHasGroups=false`; renders `PreTournamentGroupsPreview` when `userHasGroups=true` but `groups.length=0`

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `app/db/game-repository.ts` | Modify | Add `findFirstGameFullData` |
| `app/actions/hub-actions.ts` | Modify | Expand `ActionCenterData`, update `getActionCenterGames` and `getLeaderboardPeekData` |
| `app/components/tournament-hub/pre-tournament-hero.tsx` | **Create** | Countdown + opener + 3-item circular progress row |
| `app/components/tournament-hub/tournament-start-banner.tsx` | **Create** | 48h post-start celebration banner |
| `app/components/tournament-hub/social-hub-card.tsx` | **Create** | Social CTA when user has 0 groups |
| `app/components/tournament-hub/pre-tournament-groups-preview.tsx` | **Create** | Groups list + 3 CTAs when user has groups but no rankings |
| `app/components/tournament-hub/action-center-carousel.tsx` | Modify | Pre-tournament hero, celebration banner, single-game centering |
| `app/components/tournament-hub/tournament-hub-leaderboard-peek.tsx` | Modify | Render SocialHubCard or GroupsPreview based on state |
| `locales/en/hub.json` | Modify | Add `preTournament.*` and `socialHub.*` keys |
| `locales/es/hub.json` | Modify | Same keys in Argentine Spanish |
| `docs/code-structure/components/components-tournament-hub.md` | Modify | Document new components |
| `docs/code-structure/actions.md` | Modify | Update `ActionCenterData` and `getLeaderboardPeekData` signatures |

---

## Visual Design

### Pre-Tournament State Layout (in Action Center)

```
┌─────────────────────────────────────────┐
│         TOURNAMENT KICKOFF              │  ← overline, primary color
│    [ 52 ]  :  [ 14 ]  :  [ 28 ]        │  ← h3, bold, primary color
│    DAYS        HOURS      MINS          │
│   (gradient paper bg, purple border)   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      Opening Match • June 11, 20:00     │  ← overline, centered
│        FlippableGameCard (full)         │
└─────────────────────────────────────────┘

┌── 3 Circular Progress Items (single row) ────────────────┐
│   [AccountTree]     [EmojiEvents]     [SportsSoccer]      │ ← same icon in both
│    [○ 30%]           [○ 0%]           [○ 12%]             │   desktop & mobile
│   Qualified Teams   Individual Awards  Overall            │ ← desktop: full label
│   3/12 groups       Pending            12/104 games       │
│                                                           │
│    [○]  QT          [○] Awards         [○] Total          │ ← mobile: short label
└───────────────────────────────────────────────────────────┘
```

Each circular progress item links to its page (QT → qualified-teams, Awards → awards, Overall → games list).

### Post-Start Celebration Banner (above carousel, first 48h)

```
┌─────────────────────────────────────────┐
│  🎉  The tournament has started!  🎉   │  ← festive gradient bg
│  "Good luck with your predictions!"    │
│            [See all games →]           │
└─────────────────────────────────────────┘
          ↓  (normal carousel below)
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
│  is in a group. Create yours or join.  │
│                                         │
│  [Create Group]  [Find Public Group]   │  ← contained/outlined buttons
└─────────────────────────────────────────┘
```

### Pre-Tournament Groups Preview (user HAS groups, no rankings yet)

```
┌─────────────────────────────────────────┐
│           Your Standings                │  ← h6, centered
│   You're in [Group X], [Group Y],       │  ← body2, chips for up to 3 groups
│   [Group Z], and 2 others.             │  ← "and N others" if >3
│                                         │
│  [Go to Groups]  [Create]  [Discover]  │  ← 3 CTAs
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
  tournamentJustStarted: boolean       // true when first game kicked off within last 48h
  ```

**Changed functions:**

- **getActionCenterGames(tournamentId: string, locale: Locale)**: `Promise<ActionCenterData>` *(signature unchanged, return type expanded)*
  Now also calls `getGameCountsForTournament(tournamentId)` for `totalGames`. Sets `predictedGames = guessesArray.length`. Sets `firstGameDate = firstGame?.game_date ?? null`. When `mode === 'empty'` and `firstGame.game_date > Date.now()` (tournament not yet started): calls `findFirstGameFullData(tournamentId)` for `openerGame` and includes its guess in `gameGuesses` if user has predicted it. Calls `findTournamentGuessByUserIdTournament(user.id, tournamentId)` to compute `hasAwardsPredictions`. Sets `tournamentJustStarted = firstGame.game_date < now AND now - firstGame.game_date.getTime() < 48 * 3600 * 1000`.
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
  - tournamentJustStarted is true when first game kicked off within last 48h
  - tournamentJustStarted is false when first game kicked off more than 48h ago
  - tournamentJustStarted is false when first game is in the future

- **getLeaderboardPeekData(tournamentId: string, _locale: Locale)**: `Promise<LeaderboardPeekResult>` *(was: `Promise<GroupPeekData[]>`)*
  Now returns `{ groups: GroupPeekData[], userHasGroups: boolean, allGroupNames: Array<{ id: string, name: string }> }`. `userHasGroups` is `allGroups.length > 0` (computed before ranking filter). `allGroupNames` is built from ALL user groups (owned + participant, deduplicated) regardless of whether ranking data exists — used for the pre-tournament groups preview. Returns `{ groups: [], userHasGroups: false, allGroupNames: [] }` when unauthenticated.
  Calls: (unchanged)
  Tests:
  - returns userHasGroups=false and empty allGroupNames when user is unauthenticated
  - returns userHasGroups=false when user has no groups (owned or participant)
  - returns userHasGroups=true with allGroupNames populated when user has groups but no ranking data yet
  - returns userHasGroups=true with populated groups array and allGroupNames when ranking data exists
  - allGroupNames is deduplicated when user is both owner and participant of same group
  - groups array content is backward-compatible with previous GroupPeekData[] return

---

### `app/components/tournament-hub/pre-tournament-hero.tsx` *(new)*

**New components:**

- **PreTournamentHero({ firstGameDate, openerGame, tournamentId, locale, teamsMap, gameGuesses, tournamentMaxSilver, tournamentMaxGolden, qtAndAwardsOpen, msUntilPredictionLock, totalGames, predictedGames, hasAwardsPredictions })**: `JSX.Element` — [Client] Renders three sections in order: (1) `CountdownSection` — gradient Paper, overline "TOURNAMENT KICKOFF", three boxes (days / hours / mins) computed from `firstGameDate - Date.now()` via `useEffect` + `setInterval(1000)`, (2) if `openerGame` is not null, a `FlippableGameCard` with "Opening Match" overline label (centered), (3) a single-row circular progress section — three `CircularProgress` items (QT, Awards, Overall) displayed in a `Stack direction="row" justifyContent="space-around"`. **Icons must match the Group Selector nav bar** — `AccountTreeIcon` for QT, `EmojiEventsIcon` for Awards, `SportsSoccerIcon` for Overall. Icons are shown on BOTH desktop and mobile for visual consistency; labels differ by breakpoint: desktop shows full label + value text beneath the circle, mobile shows abbreviated label only (e.g., "QT" / "Awards" / "Total"). Each item links to its page. Progress % formula: `predictedGames / totalGames * 100` (clamp to 0 when `totalGames === 0`). Awards shows 100% when `hasAwardsPredictions`, else 0%. QT defaults to 0% (see Open Questions).
  Calls: FlippableGameCard
  Uses: useState, useEffect, useTranslations, CircularProgress, Stack, Box, Typography, Button, Link, useTheme, useMediaQuery, AccountTreeIcon, EmojiEventsIcon, SportsSoccerIcon
  Tests:
  - renders countdown days/hours/mins derived from firstGameDate
  - shows "0 Days 0 Hours 0 Mins" gracefully when firstGameDate is in the past (boundary case)
  - renders opener card when openerGame is non-null
  - does not render opener card when openerGame is null
  - renders 3-item circular progress row when qtAndAwardsOpen is true
  - renders CircularProgress at correct percentage for overall (predictedGames / totalGames * 100)
  - renders CircularProgress at 0% without crashing when totalGames is 0 (zero-division guard)
  - Awards shows 100% when hasAwardsPredictions is true, 0% otherwise

---

### `app/components/tournament-hub/tournament-start-banner.tsx` *(new)*

**New components:**

- **TournamentStartBanner({ locale, tournamentId })**: `JSX.Element` — [Client] Festive Paper banner (gradient bg, celebration styling) shown above the carousel for the first 48h after tournament starts. Renders a centered celebration icon, title ("The tournament has started!"), subtitle, and a "See all games" link button. Banner is self-contained; parent decides whether to render it based on `data.tournamentJustStarted`.
  Uses: useTranslations, Paper, Typography, Button, Link, Box, Stack
  Tests:
  - renders celebration title text
  - renders "See all games" link with correct href including locale and tournamentId
  - applies festive/gradient styling (Paper with sx background gradient)

---

### `app/components/tournament-hub/social-hub-card.tsx` *(new)*

**New components:**

- **SocialHubCard({ locale, tournamentId })**: `JSX.Element` — [Client] Renders a Paper (secondary-tinted bg, dashed border, centered) containing: GroupAddIcon (48px, secondary color), h6 title, body2 description, and two buttons: "Create Group" (contained, secondary) linking to `/${locale}/tournaments/${tournamentId}/friend-groups` and "Find Public Group" (outlined, secondary) linking to public group discovery. All text from `useTranslations('hub.socialHub')`.
  Uses: useTranslations, Paper, Typography, Button, Icon, Link, Stack, Box
  Tests:
  - renders Create Group button with correct href for given locale and tournamentId
  - renders Find Public Group button
  - renders GroupAddIcon as the main illustration

---

### `app/components/tournament-hub/pre-tournament-groups-preview.tsx` *(new)*

**New components:**

- **PreTournamentGroupsPreview({ allGroupNames, locale, tournamentId })**: `JSX.Element` — [Client] Shown when `userHasGroups=true` but no ranking data yet. Renders: body2 text "You're in [Chip: Group X], [Chip: Group Y], [Chip: Group Z], and N others." (shows up to 3 group name Chips as links; if `allGroupNames.length > 3` appends "and N others" as plain text). Below that, 3 CTA buttons in a row: (1) "Your Groups" linking to `/${locale}/tournaments/${tournamentId}/friend-groups`, (2) "Create Group" linking to friend-groups page, (3) "Discover Groups" linking to public group discovery. All text from `useTranslations('hub')`.
  Uses: useTranslations, Chip, Stack, Box, Typography, Button, Link
  Tests:
  - renders up to 3 group name chips when allGroupNames has 3 or fewer items
  - appends "and N others" when allGroupNames has more than 3 items
  - renders exactly 3 CTA buttons (Your Groups, Create Group, Discover Groups)
  - does not render "and N others" when allGroupNames has exactly 3 items
  - group chips link to the correct group href

---

### `app/components/tournament-hub/action-center-carousel.tsx` *(modified)*

**Changed functions:**

- **ActionCenterCarousel({ data, tournamentId, locale })**: `JSX.Element` — *(signature unchanged, behavior extended)*
  When `data.tournamentJustStarted === true`: renders `<TournamentStartBanner>` above the regular carousel content (banner is additive, not a replacement). When `data.mode === 'empty'` AND `data.firstGameDate !== null` AND `!data.tournamentFinished`: renders header then `<PreTournamentHero>` instead of the empty-state box. When `data.mode === 'empty'` AND tournament is finished or has no firstGameDate: keeps existing empty-state box. When `data.mode !== 'empty'`: existing carousel + if `data.games.length === 1`, the single card is centered (`justifyContent: 'center'` on the scroll container) rather than left-aligned.
  Renders: TournamentStartBanner (conditional additive), PreTournamentHero (conditional replacement), existing branches
  Tests:
  - renders TournamentStartBanner above carousel when tournamentJustStarted=true
  - does not render TournamentStartBanner when tournamentJustStarted=false
  - renders PreTournamentHero when mode=empty and firstGameDate is set and tournament not finished
  - renders existing empty box when mode=empty and tournamentFinished=true
  - centers the single game card when games.length=1 (scroll container has justifyContent center)
  - does not center when games.length > 1

---

### `app/components/tournament-hub/tournament-hub-leaderboard-peek.tsx` *(modified)*

**Changed functions:**

- **TournamentHubLeaderboardPeek({ tournamentId, locale })**: `JSX.Element | null` — [Server] Now calls updated `getLeaderboardPeekData` which returns `LeaderboardPeekResult`. Three branches: (1) `!result.userHasGroups` → renders section header + `<SocialHubCard>`, (2) `result.userHasGroups && result.groups.length === 0` → renders section header + `<PreTournamentGroupsPreview allGroupNames={result.allGroupNames}>`, (3) `result.groups.length > 0` → existing rendering with `LeaderboardPeekCard` per group.
  Calls: getLeaderboardPeekData
  Renders: SocialHubCard (new branch), PreTournamentGroupsPreview (new branch), LeaderboardPeekCard (existing)
  Tests:
  - renders SocialHubCard when userHasGroups is false
  - renders PreTournamentGroupsPreview when userHasGroups=true but groups array is empty
  - passes allGroupNames to PreTournamentGroupsPreview
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
    "overallProgress": "Overall",
    "gamesOfTotal": "{predicted} of {total} games",
    "qtShort": "QT",
    "awardsShort": "Awards",
    "totalShort": "Total",
    "awardsNotStarted": "Pending",
    "awardsDone": "Submitted"
  },
  "tournamentStarted": {
    "title": "The tournament has started!",
    "subtitle": "Good luck with your predictions!",
    "seeGames": "See all games"
  },
  "socialHub": {
    "title": "Don't play alone!",
    "description": "The best way to enjoy the World Cup is in a group. Create yours and invite your friends.",
    "createGroup": "Create Group",
    "findGroup": "Find Public Group"
  },
  "groupsPreview": {
    "youreIn": "You're in",
    "andOthers": "and {count} others.",
    "goToGroups": "Your Groups",
    "createGroup": "Create Group",
    "discoverGroups": "Discover Groups"
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
    "overallProgress": "Total",
    "gamesOfTotal": "{predicted} de {total} partidos",
    "qtShort": "EQ",
    "awardsShort": "Premios",
    "totalShort": "Total",
    "awardsNotStarted": "Pendiente",
    "awardsDone": "Enviado"
  },
  "tournamentStarted": {
    "title": "¡El torneo comenzó!",
    "subtitle": "¡Buena suerte con tus predicciones!",
    "seeGames": "Ver todos los partidos"
  },
  "socialHub": {
    "title": "¡No juegues solo!",
    "description": "La mejor manera de disfrutar el Mundial es en grupo. Creá el tuyo e invitá a tus amigos.",
    "createGroup": "Crear Grupo",
    "findGroup": "Encontrar Grupo Público"
  },
  "groupsPreview": {
    "youreIn": "Estás en",
    "andOthers": "y {count} más.",
    "goToGroups": "Tus Grupos",
    "createGroup": "Crear Grupo",
    "discoverGroups": "Descubrir Grupos"
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
- Countdown using `useEffect` + `setInterval` (1s updates), computing `days/hours/mins` from `firstGameDate - Date.now()`; clamp at 0 when date is past
- Opener game: `FlippableGameCard` (inherits `GuessesContextProvider` from parent carousel)
- Progress section: 3-item `Stack direction="row"` with `CircularProgress` per item (QT, Awards, Overall); `useMediaQuery` for responsive labels
- Zero-division guard: `totalGames === 0 ? 0 : predictedGames / totalGames * 100`
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md`; call graph: NO

**Task 5**: Create `TournamentStartBanner` component
- Festive Paper with gradient background + celebration title + "See all games" link
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md`; call graph: NO

**Task 6**: Create `SocialHubCard` component
- CTA card with create/find group buttons (2 buttons)
- Hrefs: create group = `/${locale}/tournaments/${tournamentId}/friend-groups`, find group = public group discovery
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md`; call graph: NO

**Task 7**: Create `PreTournamentGroupsPreview` component
- Display up to 3 group names as Chips (each links to its group page); if >3 groups, append "and N others" text
- 3 CTA buttons: Your Groups → friend-groups page, Create Group, Discover Groups
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md`; call graph: NO

### Wave 3 — Wire-up (after Wave 1 + Wave 2)

**Task 8**: Update `ActionCenterCarousel`
- Import `PreTournamentHero`, `TournamentStartBanner`
- Add celebration banner branch: `data.tournamentJustStarted` → render `<TournamentStartBanner>` above carousel
- Add pre-tournament branch: `data.mode === 'empty' && data.firstGameDate && !data.tournamentFinished` → render `<PreTournamentHero>`
- Single-game centering: when `data.games.length === 1`, apply `justifyContent: 'center'` to scroll container
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md`; call graph: NO

**Task 9**: Update `TournamentHubLeaderboardPeek`
- Import `SocialHubCard`, `PreTournamentGroupsPreview`
- Call updated `getLeaderboardPeekData` (destructure `{ groups, userHasGroups, allGroupNames }`)
- Branch 1: `!userHasGroups` → `<SocialHubCard>`
- Branch 2: `userHasGroups && groups.length === 0` → `<PreTournamentGroupsPreview allGroupNames={allGroupNames}>`
- Branch 3: existing `<LeaderboardPeekCard>` rendering
- CODE-STRUCTURE files to update: `docs/code-structure/components/components-tournament-hub.md`; call graph: YES (Flow 29)

### Wave 4 — i18n

**Task 10**: Add all new keys to EN and ES hub.json
- `preTournament.*`, `tournamentStarted.*`, `socialHub.*`, `groupsPreview.*`
- CODE-STRUCTURE files to update: none (i18n files are not tracked in CODE-STRUCTURE); call graph: NO

---

## Testing Strategy

### Unit / Integration tests

**`app/components/tournament-hub/__tests__/`** (existing directory):

- `hub-actions.test.ts` (or similar): test `getActionCenterGames` new fields (incl. `tournamentJustStarted`) and `getLeaderboardPeekData` new return type (`userHasGroups`, `allGroupNames`)
- `pre-tournament-hero.test.tsx`: countdown, opener card presence/absence, circular progress row, zero-division guard
- `tournament-start-banner.test.tsx`: celebration title, "See all games" link href
- `social-hub-card.test.tsx`: button hrefs, i18n keys
- `pre-tournament-groups-preview.test.tsx`: up-to-3 chips, "and N others" text, 3 CTA buttons and hrefs
- `action-center-carousel.test.tsx` (update): pre-tournament hero branch, celebration banner branch, single-game centering
- `tournament-hub-leaderboard-peek.test.tsx` (update): SocialHubCard when no groups, PreTournamentGroupsPreview when has groups but no rankings

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

## Implementation Amendments

### Amendment 1: Architecture Refactor — PreTournamentHero eliminated, opener backfilled into games[]
**Date:** 2026-04-20
**Reason:** User objected to a duplicate rendering path where `ActionCenterCarousel` was entirely replaced by `PreTournamentHero` in pre-tournament mode. This created code duplication and a different rendering path for a state that shares most of the carousel logic.
**Change:** `PreTournamentHero` was stripped to a single named export `PreTournamentCountdown` (countdown widget only). The opener game is now backfilled directly into `data.games` from `getActionCenterGames` when no window games are found and the tournament hasn't started — `openerBackfill: boolean` signals this. The circular progress row was moved into `ActionCenterCarousel` and is shown for ALL users when `data.qtAndAwardsOpen` (not just pre-tournament). An "Opening Match" overline is rendered above the carousel when `openerBackfill=true`. The countdown is shown above the header any time `!data.tournamentHasStarted && data.firstGameDate !== null`.

### Amendment 2: ActionCenterData fields changed
**Date:** 2026-04-20
**Reason:** Follow-on from Amendment 1 — fields were redesigned to match the simplified architecture.
**Change:** `openerGame: ExtendedGameData|null` and `hasAwardsPredictions: boolean` were removed. Added: `tournamentHasStarted: boolean`, `tournamentName: string|null`, `openerBackfill: boolean`, `awardsCompleted: number`, `awardsTotal: number`, `qualifiersCompleted: number`, `qualifiersTotal: number`. Progress data now comes from `getTournamentPredictionCompletion` (consistent with the Predictions Dashboard) instead of `getGameCountsForTournament` + `findTournamentGuessByUserIdTournament`.

### Amendment 3: TournamentStartBanner simplified — no props, no CTA button
**Date:** 2026-04-20
**Reason:** User requested removal of the "See all games" button from the celebration banner. Props (`locale`, `tournamentId`) were only needed for the button link.
**Change:** `TournamentStartBanner` now takes no props. The "See all games" button was removed. Icon changed from `EmojiEvents` to `Celebration`. Styling was matched to the countdown (subtle secondary gradient + border) rather than the original dark festive design.

### Amendment 4: Countdown redesigned — icon + numbers + subtitle, no overline title
**Date:** 2026-04-20
**Reason:** User requested an hourglass icon above the countdown numbers and a localized tournament name subtitle below ("Para que empiece el {tournamentName}"). The original overline title was removed as redundant given the icon.
**Change:** `PreTournamentCountdown` now renders: `HourglassEmptyIcon` with a realistic flip animation (still→flip 180°→still→flip 180° back via per-keyframe `animationTimingFunction`), countdown numbers, and a conditional `countdownSubtitle` below. The overline "TOURNAMENT KICKOFF" text was removed. `tournamentName` prop added.

### Amendment 5: Tournament name localized in both code paths
**Date:** 2026-04-20
**Reason:** The opener backfill path correctly used `applyLocalization` for `tournamentName`, but the normal games-found path used `tournament?.short_name` (raw, not localized). The countdown can show in the games-found path when the first game is within 7 days but hasn't kicked off.
**Change:** Both return branches in `getActionCenterGames` now use `applyLocalization(tournament, locale, [{ field: 'short_name', i18nField: 'short_name_i18n' }]).short_name` for `tournamentName`.

### Amendment 6: i18n keys diverged from plan
**Date:** 2026-04-20
**Reason:** The third progress circle was renamed from "Overall" to "Games" per UX feedback. A new key `countdownSubtitle` was added for the tournament name subtitle.
**Change:** Added `preTournament.countdownSubtitle` ("Until {tournamentName} kicks off" / "Para que empiece el {tournamentName}") and `preTournament.gamesLabel` ("Games" / "Partidos") instead of the planned `overallProgress`. The `overallProgress` key was kept in the JSON files for backward compatibility but is not used by any component.

---

## Open Questions / Risks

1. **QT group count for circular progress**: The exact per-group QT prediction count requires investigating the schema (likely JSONB in `tournament_guess`). For this story, the QT circle defaults to 0% unless the data is easily accessible — implementation to confirm. If found, wire it up; otherwise, QT circle shows "Not started" at 0% until user visits QT page.

2. **Friend group URLs**: Confirm the exact routes for "Create Group" and "Discover Groups" during implementation — current plan uses `/${locale}/tournaments/${tournamentId}/friend-groups` as the base path.

3. **Unauthenticated users**: `getLeaderboardPeekData` returns `userHasGroups=false` for unauthenticated users, so they see `SocialHubCard`. This is acceptable — the CTA naturally prompts sign-in when they try to create/join a group.

4. **Celebration banner duration**: The 48h window is a hardcoded constant `TOURNAMENT_START_CELEBRATION_MS = 48 * 3600 * 1000`. Can be adjusted easily if the product feels it should be shorter/longer.

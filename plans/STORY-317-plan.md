# Story 317 Plan: Smart Predictor Carousel

## Context

Story #317 builds the first real widget on the Tournament Hub (introduced in #316 as 3 empty placeholders). The "Action Center" replaces the `smartPredictorCarousel` placeholder with a horizontal carousel of up to 4 flippable cards, each showing an upcoming game where the user hasn't yet made a prediction. The goal is to surface urgent pending predictions at a glance without navigating to the full predictions page.

Parent epic: #314 — Tournament Hub & Social Momentum. Dependency: #316 (merged, hub route exists).

---

## Acceptance Criteria

- [ ] The hub shows an "Action Center" section above the Prediction Dashboard placeholder
- [ ] The carousel shows up to 4 upcoming games (within 48h) with no prediction yet
- [ ] Each card shows: team names, kickoff time, and a "Closes in Xh" urgency display
- [ ] Tapping a card flips it to reveal the full prediction form (scores, boost, penalty where applicable)
- [ ] Saving a prediction works inline without navigating away
- [ ] When all upcoming games are predicted, fallback shows next 3 scheduled games for review/edit
- [ ] When no games are in the 48h window, shows an appropriate empty state
- [ ] Urgency countdown changes color as deadline approaches (notice → warning → urgent)
- [ ] Works in both English and Spanish

---

## Out of Scope (v1)

- Real-time auto-save / optimistic updates (handled by existing GuessesContext autoSave)
- Swipe gestures for card dismissal

---

## Technical Approach

### Data Flow

```
hub/page.tsx (Server)
  └── <TournamentHubActionCenter tournamentId locale />  (Server Component)
        └── getActionCenterGames(tournamentId, locale) → ActionCenterData
        └── <ActionCenterCarousel data tournamentId locale />  (Client Component, 'use client')
              └── GuessesContextProvider (games' guesses, autoSave=true, boost limits)
                    └── ScrollShadowContainer direction="horizontal"
                          └── <FlippableGameCard /> × N   (existing component, reused as-is)
```

### Game Selection Logic (inside `getActionCenterGames`)

1. Fetch games: `findGamesForDashboard(tournamentId)` → games in −24h…+48h window
2. Fetch guesses: `findGameGuessesByUserId(userId, tournamentId)` → build `guessedGameIds` Set + guesses map
3. Fetch teams: `findTeamInTournament(tournamentId)` → build `teamsById: Record<string, Team>`
4. Fetch boost limits from tournament record (`max_silver_games`, `max_golden_games`)
5. **Urgent mode:** filter to games where `deadline > now` AND `game_id` NOT in `guessedGameIds`, sort by deadline asc → take first 4
6. **Fallback mode:** if urgent list is empty → take next 3 games by `game_date` asc
7. **Empty mode:** if no games in window at all

Deadline = `calculateDeadline(game.game_date)` from `countdown-utils.ts` (1h before kickoff).

### Reusing FlippableGameCard

`FlippableGameCard` is used as-is — no modification. The carousel provides:
- **`GuessesContextProvider`** initialized with the carousel games' existing guesses and `autoSave={true}`. `updateGameGuess` in the context calls `updateOrCreateGameGuesses` automatically.
- **`teamsMap`** passed directly to each card
- **`isPlayoffs`** derived from `!!game.playoffStage`
- **`homeScore` / `awayScore` / `boostType`** from `gameGuesses[game.id]`
- **`onAutoAdvanceNext` / `onAutoGoPrevious`** wired to carousel's `editingGameId` state

The urgency/countdown display is already in the component tree: `FlippableGameCard → GameView → CompactGameViewCard → GameCountdownDisplay`. Nothing to add.

### Carousel Edit State

`ActionCenterCarousel` holds `editingGameId: string | null`. At most one card is open at a time:
- `onEditStart(game.id)` → `setEditingGameId(game.id)`
- `onEditEnd()` → `setEditingGameId(null)`
- `onAutoAdvanceNext` → advance `editingGameId` to next game in list
- `onAutoGoPrevious` → retreat `editingGameId` to previous game

---

## Visual Prototypes

### Carousel Layout

```
┌──────────────────────────────────────────────────────────┐
│  Action Center                                           │
│  Submit your predictions                                 │
├──────────────────────────────────────────────────────────┤
│   ← ░[card1]░░░░░[card2]░░░░░[card3]░░░░░[card4]░░ →   │
│      (gradient shadow at edges, horizontal scroll)       │
│      each card = FlippableGameCard (existing component)  │
└──────────────────────────────────────────────────────────┘
```

Each card's front face already shows: team names, logos, existing scores or placeholders, urgency countdown, kickoff time — all from `GameCountdownDisplay` and `CompactGameViewCard`.

### Empty State (no games in window)

```
┌──────────────────────────────────┐
│  ⚽ No upcoming games            │
│  Check back before kickoff       │
└──────────────────────────────────┘
```

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `app/actions/hub-actions.ts` | **Create** | Server Action: `getActionCenterGames` |
| `app/components/tournament-hub/tournament-hub-action-center.tsx` | **Create** | Server Component wrapper |
| `app/components/tournament-hub/action-center-carousel.tsx` | **Create** | Client Component; GuessesContextProvider + ScrollShadowContainer + FlippableGameCard |
| `app/[locale]/tournaments/[id]/hub/page.tsx` | **Modify** | Replace smartPredictorCarousel Paper with `<TournamentHubActionCenter>` |
| `locales/en/hub.json` | **Modify** | Add `actionCenter.*` keys |
| `locales/es/hub.json` | **Modify** | Add `actionCenter.*` keys (ES) |
| `CODE-STRUCTURE.md` | **Modify** | Update Flow 29; add Flow 30 |
| `docs/code-structure/actions.md` | **Modify** | Add `getActionCenterGames` |
| `docs/code-structure/components/components-tournament-hub.md` | **Create** | Document new hub components |
| `docs/code-structure/pages.md` | **Modify** | Update hub page entry |

`HubPredictionCard` is **not created** — `FlippableGameCard` is reused as-is.

---

## Translation Keys

Translation files live at `locales/{locale}/hub.json`.

EN additions to `locales/en/hub.json`:
```json
{
  "actionCenter": {
    "title": "Action Center",
    "subtitle": "Submit your predictions",
    "emptyState": "No upcoming games to predict",
    "fallbackSubtitle": "All caught up — here's what's coming"
  }
}
```

ES additions to `locales/es/hub.json`:
```json
{
  "actionCenter": {
    "title": "Centro de Acción",
    "subtitle": "Envía tus predicciones",
    "emptyState": "No hay partidos próximos para predecir",
    "fallbackSubtitle": "Todo al día — esto viene próximamente"
  }
}
```

*(Individual card strings — predict, save, urgency — are already in the existing `games` namespace used by FlippableGameCard.)*

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 29 (Tournament Hub shell)** — `TournamentHubPage` now renders `TournamentHubActionCenter` instead of the smartPredictorCarousel `Paper` placeholder

**New flows:**
- **Flow 30 (Action Center data):**
  `TournamentHubActionCenter` (Server) → `getActionCenterGames` → `getLoggedInUser`, `findGamesForDashboard`, `findGameGuessesByUserId`, `findTeamInTournament`, `findTournamentById`
  → `ActionCenterCarousel` [Client] → `GuessesContextProvider` → `FlippableGameCard` (existing) → `updateOrCreateGameGuesses` (via context autoSave)

---

### `app/actions/hub-actions.ts` *(new file)*

**Type:**

```typescript
interface ActionCenterData {
  games: ExtendedGameData[]
  gameGuesses: Record<string, GameGuessNew>   // keyed by game_id; only the carousel games
  teamsMap: Record<string, Team>
  tournamentMaxSilver: number
  tournamentMaxGolden: number
  mode: 'urgent' | 'fallback' | 'empty'
}
```

**Type notes (verified):**
- `GameGuess` / `GameGuessNew` have `home_score?: number`, `away_score?: number`, `boost_type?`, `home_penalty_winner?`, `away_penalty_winner?`
- `findTeamInTournament(tournamentId)` returns `Team[]` — action builds `Record<string, Team>` via `Object.fromEntries(teams.map(t => [t.id, t]))`
- Boost limits come from the tournament record (`tournament.max_silver_games`, `tournament.max_golden_games`)

**New functions:**

- **`getActionCenterGames(tournamentId: string, locale: Locale): Promise<ActionCenterData>`**
  Server Action. Fetches and ranks upcoming games; returns data needed to bootstrap `GuessesContextProvider` and render `FlippableGameCard` cards.
  Calls: `getLoggedInUser`, `findGamesForDashboard`, `findGameGuessesByUserId`, `findTeamInTournament`, `findTournamentById`, `calculateDeadline`
  Tests:
  - returns `mode: 'urgent'` with up to 4 unpredicted open games sorted by deadline ascending
  - returns `mode: 'fallback'` when all open-deadline games in window have an existing guess
  - returns `mode: 'empty'` when `findGamesForDashboard` returns an empty array
  - excludes games whose deadline has already passed (`calculateDeadline(game_date) <= Date.now()`)
  - truncates urgent list to exactly 4 games when 5+ unpredicted open games exist
  - `gameGuesses` map contains entries only for the selected carousel games (not all tournament guesses)
  - throws Unauthorized when `getLoggedInUser` returns null

---

### `app/components/tournament-hub/tournament-hub-action-center.tsx` *(new file)*

- **`TournamentHubActionCenter({ tournamentId, locale }: { tournamentId: string; locale: Locale })`**: `JSX.Element`
  Server Component. Calls `getActionCenterGames`, passes result to `ActionCenterCarousel`.
  Calls: `getActionCenterGames`
  *(Thin wrapper — no unit tests; covered via server action tests)*

---

### `app/components/tournament-hub/action-center-carousel.tsx` *(new file)*

**Props:**
```typescript
interface ActionCenterCarouselProps {
  data: ActionCenterData
  tournamentId: string
  locale: Locale
}
```

- **`ActionCenterCarousel(props: ActionCenterCarouselProps)`**: `JSX.Element`
  Client Component (`'use client'`). Wraps in `GuessesContextProvider`, renders section header + horizontal carousel of `FlippableGameCard` cards.
  State: `editingGameId: string | null` — tracks which card's back face is open (at most one)
  Uses: `GuessesContextProvider` (gameGuesses, autoSave=true, boost limits), `ScrollShadowContainer` (direction="horizontal", hideScrollbar=true), `FlippableGameCard`
  Tests:
  - renders a `FlippableGameCard` for each game in `data.games`
  - renders empty-state message when `data.mode === 'empty'`
  - renders fallback subtitle text when `data.mode === 'fallback'`
  - `onEditStart(gameId)` sets `editingGameId`; only one card is `isEditing` at a time
  - `onEditEnd()` clears `editingGameId`
  - `onAutoAdvanceNext` advances `editingGameId` to the next game in the list
  - `onAutoGoPrevious` retreats `editingGameId` to the previous game in the list
  - passes correct `homeScore`, `awayScore`, `boostType` from `gameGuesses[game.id]` to each card
  - passes `isPlayoffs={!!game.playoffStage}` to each card

---

## Testing Strategy

- **Unit tests** (Vitest + renderWithTheme) for:
  - `getActionCenterGames` — mock `findGamesForDashboard`, `findGameGuessesByUserId`, `findTeamInTournament`, `findTournamentById`, `getLoggedInUser`
  - `ActionCenterCarousel` — carousel edit state, card prop wiring, empty/fallback states
- **No tests** for the thin Server Component wrapper (`TournamentHubActionCenter`)
- **No new tests** for `FlippableGameCard` — it's unchanged and already tested
- Coverage target: ≥80% on new code (SonarCloud gate)

---

## Validation Considerations

- SonarCloud: 0 new issues; new code coverage ≥80%
- `getActionCenterGames` must NOT use `unstable_cache` (depends on per-user data); underlying repo functions already use React `cache`
- Translation keys must be added to both `locales/en/hub.json` and `locales/es/hub.json`; verify with `npm run build` (next-intl throws on missing keys)
- `findTournamentById` — verify exact function name in tournament repository during implementation
- Server action must call `getLoggedInUser()` (not `auth()` directly) — follow existing server action pattern
- `TournamentHubActionCenter` is server-only; `ActionCenterCarousel` is client-only — respect the boundary

---

## Implementation Tasks (Wave Order)

**Wave 1 — Foundation**
1. Create `hub-actions.ts` with `getActionCenterGames` + tests
2. Add translation keys to `locales/{en,es}/hub.json`

**Wave 2 — Components**
3. Create `action-center-carousel.tsx` + tests
4. Create `tournament-hub-action-center.tsx` (thin server wrapper, no tests needed)

**Wave 3 — Integration + Docs**
5. Update `hub/page.tsx` to replace smartPredictorCarousel placeholder
6. Update CODE-STRUCTURE files (actions.md, new components-tournament-hub.md, pages.md, CODE-STRUCTURE.md Flow 29/30)

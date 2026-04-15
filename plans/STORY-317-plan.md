# Story 317 Plan: Smart Predictor Carousel

## Context

Story #317 builds the first real widget on the Tournament Hub (introduced in #316 as 3 empty placeholders). The "Action Center" replaces the `smartPredictorCarousel` placeholder with a horizontal carousel of up to 4 flippable cards, each showing an upcoming game where the user hasn't yet made a prediction. The goal is to surface urgent pending predictions at a glance without navigating to the full predictions page.

Parent epic: #314 — Tournament Hub & Social Momentum. Dependency: #316 (merged, hub route exists).

---

## Acceptance Criteria

- [ ] The hub shows an "Action Center" section above the Prediction Dashboard placeholder
- [ ] The carousel shows up to 4 upcoming games (within 48h) with no prediction yet
- [ ] Each card shows: team names, kickoff time, and a "Closes in Xh" urgency chip
- [ ] Tapping a card flips it to reveal home/away score inputs and a Save button
- [ ] Saving a prediction works inline without navigating away
- [ ] After save, card shows a "Saved ✓" locked state; tapping allows editing
- [ ] When all upcoming games are predicted, fallback shows next 3 scheduled games for review/edit
- [ ] When no games are in the 48h window, shows an appropriate empty state
- [ ] Urgency chip changes color as deadline approaches (notice → warning → urgent)
- [ ] Works in both English and Spanish

---

## Out of Scope (v1)

- Boost selector (hub cards show simplified prediction only)
- Penalty shootout input (round-of-16+ complexity)
- Real-time auto-save / optimistic updates
- Progress bar within each card
- Swipe gestures for card dismissal

---

## Technical Approach

### Data Flow

```
hub/page.tsx (Server)
  └── <TournamentHubActionCenter tournamentId locale />  (Server Component)
        └── getActionCenterGames(tournamentId, locale) → ActionCenterData
        └── <ActionCenterCarousel data locale />           (Client Component, 'use client')
              └── ScrollShadowContainer direction="horizontal"
                    └── <HubPredictionCard /> × N          (Client Component, 'use client')
                          ├── front: teams, countdown chip, scores/placeholders
                          └── back: score inputs + Save button
                                └── updateOrCreateGameGuesses (server action)
```

### Game Selection Logic (inside `getActionCenterGames`)

1. Fetch games: `findGamesForDashboard(tournamentId)` → games in −24h…+48h window
2. Fetch guesses: `findGameGuessesByUserId(userId, tournamentId)` → build `guessedGameIds` Set
3. Fetch teams: `findTeamInTournament(tournamentId)` → build `teamsById` map, apply localization
4. **Urgent mode:** filter to games where `deadline > now` AND `game_id` NOT in `guessedGameIds`, sort by deadline asc → take first 4
5. **Fallback mode:** if urgent list is empty → take next 3 games by `game_date` asc (all predicted or none open)
6. **Empty mode:** if no games in window at all

Deadline = `calculateDeadline(game.game_date)` from `countdown-utils.ts` (1h before kickoff).

### Flip Animation

Use CSS `transform: rotateY(180deg)` with `perspective` and `backface-visibility: hidden` on both faces — same pattern as `FlippableGameCard`. Implemented directly in `HubPredictionCard` as local CSS-in-JS via MUI `sx`. No shared component extraction needed.

### Countdown

Live countdown via `useEffect + setInterval(30_000)` inside `HubPredictionCard`. Formatted with `formatCountdown(ms)` from `countdown-utils.ts`. Color from `getUrgencyColor(theme, getUrgencyLevel(ms))`.

---

## Visual Prototypes

### Card States

**Front — unpredicted, urgent:**
```
┌──────────────────────────────────┐
│ 🔴 Closes in 45m                 │
├──────────────────────────────────┤
│   Argentina        Brazil        │
│   🇦🇷              🇧🇷           │
│                                  │
│      ?   :   ?                   │
│                                  │
│ Jun 14 · 20:00       [Predict→]  │
└──────────────────────────────────┘
```

**Back — editing:**
```
┌──────────────────────────────────┐
│   Argentina        Brazil        │
│   [ 2 ] vs [ 1 ]                 │
│                                  │
│                       [Save]     │
└──────────────────────────────────┘
```

**Front — saved/locked:**
```
┌──────────────────────────────────┐
│ ✓ Predicted          [Edit]      │
├──────────────────────────────────┤
│   Argentina        Brazil        │
│   🇦🇷              🇧🇷           │
│                                  │
│      2   :   1                   │
│                                  │
│ Jun 14 · 20:00                   │
└──────────────────────────────────┘
```

### Carousel Layout

```
┌──────────────────────────────────────────────────────────┐
│  Action Center                                           │
│  Submit your predictions                                 │
├──────────────────────────────────────────────────────────┤
│   ← ░[card1]░░░░░[card2]░░░░░[card3]░░░░░[card4]░░ →   │
│      (gradient shadow at edges, horizontal scroll)       │
└──────────────────────────────────────────────────────────┘
```

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
| `app/components/tournament-hub/action-center-carousel.tsx` | **Create** | Client Component, carousel layout |
| `app/components/tournament-hub/hub-prediction-card.tsx` | **Create** | Client Component, flip card |
| `app/[locale]/tournaments/[id]/hub/page.tsx` | **Modify** | Replace smartPredictorCarousel Paper with `<TournamentHubActionCenter>` |
| `messages/en/hub.json` | **Modify** | Add `actionCenter.*` keys |
| `messages/es/hub.json` | **Modify** | Add `actionCenter.*` keys (ES) |
| `CODE-STRUCTURE.md` | **Modify** | Update Flow 29; add Flow 30 |
| `docs/code-structure/actions.md` | **Modify** | Add `getActionCenterGames` |
| `docs/code-structure/components/components-tournament-hub.md` | **Create** | Document new hub components |
| `docs/code-structure/pages.md` | **Modify** | Update hub page entry |

---

## Translation Keys (hub.json)

EN additions to `messages/en/hub.json`:
```json
{
  "actionCenter": {
    "title": "Action Center",
    "subtitle": "Submit your predictions",
    "predict": "Predict",
    "save": "Save",
    "saving": "Saving...",
    "saved": "Saved",
    "edit": "Edit",
    "closesIn": "Closes in {{time}}",
    "closed": "Closed",
    "notPredicted": "Not predicted",
    "emptyState": "No upcoming games to predict",
    "fallbackSubtitle": "All caught up — here's what's coming"
  }
}
```

ES additions to `messages/es/hub.json`:
```json
{
  "actionCenter": {
    "title": "Centro de Acción",
    "subtitle": "Envía tus predicciones",
    "predict": "Predecir",
    "save": "Guardar",
    "saving": "Guardando...",
    "saved": "Guardado",
    "edit": "Editar",
    "closesIn": "Cierra en {{time}}",
    "closed": "Cerrado",
    "notPredicted": "Sin predicción",
    "emptyState": "No hay partidos próximos para predecir",
    "fallbackSubtitle": "Todo al día — esto viene próximamente"
  }
}
```

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 29 (Tournament Hub shell)** — `TournamentHubPage` now renders `TournamentHubActionCenter` instead of the smartPredictorCarousel `Paper` placeholder

**New flows:**
- **Flow 30 (Action Center data):**  
  `TournamentHubActionCenter` (Server) → `getActionCenterGames` → `getLoggedInUser`, `findGamesForDashboard`, `findGameGuessesByUserId`, `findTeamInTournament`, `applyLocalization`  
  → `ActionCenterCarousel` [Client] → `HubPredictionCard` [Client] → `updateOrCreateGameGuesses`

---

### `app/actions/hub-actions.ts` *(new file)*

**Types:**

```typescript
interface ActionCenterGame {
  game: ExtendedGameData
  homeTeam: Team
  awayTeam: Team
  existingGuess: GameGuess | null
  isPlayoff: boolean
}

interface ActionCenterData {
  games: ActionCenterGame[]
  mode: 'urgent' | 'fallback' | 'empty'
}
```

**New functions:**

- **`getActionCenterGames(tournamentId: string, locale: Locale): Promise<ActionCenterData>`**  
  Server Action. Fetches and ranks upcoming games for the Action Center carousel.  
  Calls: `getLoggedInUser`, `findGamesForDashboard`, `findGameGuessesByUserId`, `findTeamInTournament`, `applyLocalization`, `calculateDeadline`  
  Tests:
  - returns `mode: 'urgent'` with up to 4 unpredicted games sorted by deadline ascending
  - returns `mode: 'fallback'` when all games in window have an existing guess
  - returns `mode: 'empty'` when `findGamesForDashboard` returns an empty array
  - excludes games whose deadline has already passed (`calculateDeadline(game_date) <= Date.now()`)
  - includes `existingGuess: null` for unpredicted games and the actual guess for predicted games
  - throws Unauthorized when `getLoggedInUser` returns null

---

### `app/components/tournament-hub/tournament-hub-action-center.tsx` *(new file)*

- **`TournamentHubActionCenter({ tournamentId, locale }: { tournamentId: string; locale: Locale })`**: `JSX.Element`  
  Server Component. Calls `getActionCenterGames` and delegates rendering to `ActionCenterCarousel`.  
  Calls: `getActionCenterGames`  
  *(Thin wrapper — no unit tests; covered by integration via server action tests)*

---

### `app/components/tournament-hub/action-center-carousel.tsx` *(new file)*

- **`ActionCenterCarousel({ data, locale }: { data: ActionCenterData; locale: Locale })`**: `JSX.Element`  
  Client Component (`'use client'`). Renders the section header and the horizontal scrollable carousel.  
  Uses: `ScrollShadowContainer` (direction="horizontal", hideScrollbar=true), `HubPredictionCard`  
  Tests:
  - renders a `HubPredictionCard` for each game in `data.games`
  - renders empty-state UI when `data.mode === 'empty'` and `data.games` is empty
  - renders fallback subtitle when `data.mode === 'fallback'`
  - passes `existingGuess` correctly to each card

---

### `app/components/tournament-hub/hub-prediction-card.tsx` *(new file)*

**Props:**
```typescript
interface HubPredictionCardProps {
  game: ExtendedGameData
  homeTeam: Team
  awayTeam: Team
  existingGuess: GameGuess | null
  locale: Locale
}
```

- **`HubPredictionCard(props: HubPredictionCardProps)`**: `JSX.Element`  
  Client Component (`'use client'`). 3D flip card with live countdown, score inputs, and inline save.  
  State: `isFlipped: boolean`, `homeScore: string`, `awayScore: string`, `isSaving: boolean`, `isSaved: boolean`, `savedGuess: GameGuess | null`, `remainingMs: number`  
  Calls: `calculateDeadline`, `formatCountdown`, `getUrgencyLevel`, `getUrgencyColor`, `updateOrCreateGameGuesses`  
  Tests:
  - renders home and away team names on the front face
  - shows `"?"` score placeholders when `existingGuess` is null
  - shows existing score values when `existingGuess` is provided
  - renders the urgency chip with correct countdown text
  - flips to back face when Predict button is clicked (`isFlipped` state becomes true)
  - calls `updateOrCreateGameGuesses` with `[{ game_id, home_score, away_score }]` on Save
  - shows saved state (locked) after successful save
  - shows error Snackbar when server action throws
  - disables Save button when both score inputs are empty

---

## Testing Strategy

- **Unit tests** (Vitest + renderWithTheme) for:
  - `getActionCenterGames` — mock `findGamesForDashboard`, `findGameGuessesByUserId`, `findTeamInTournament`, `getLoggedInUser`
  - `ActionCenterCarousel` — snapshot + behavior tests
  - `HubPredictionCard` — flip behavior, save flow, countdown display
- **No tests** for the thin Server Component wrapper (`TournamentHubActionCenter`)
- Coverage target: ≥80% on new code (SonarCloud gate)

---

## Validation Considerations

- SonarCloud: 0 new issues; new code coverage ≥80%
- `getActionCenterGames` must NOT use `unstable_cache` (depends on per-user data); underlying repo functions already use React `cache`
- Translation keys must be added to both `en` and `es` hub.json files; verify with `npm run build` (next-intl will throw on missing keys)
- `findTeamInTournament` return type needs verification during implementation — confirm it's `Team[]` and Team has name/logo fields
- Server action must call `getLoggedInUser()` (not `auth()` directly) — follow existing server action pattern
- All new component files must respect the `'use client'` / Server Component boundary — `TournamentHubActionCenter` is server-only, carousel and card are client-only

---

## Implementation Tasks (Wave Order)

**Wave 1 — Foundation**
1. Create `hub-actions.ts` with `getActionCenterGames` + tests
2. Add translation keys to `hub.json` (en + es)

**Wave 2 — Components**
3. Create `hub-prediction-card.tsx` + tests
4. Create `action-center-carousel.tsx` + tests
5. Create `tournament-hub-action-center.tsx` (thin server wrapper)

**Wave 3 — Integration + Docs**
6. Update `hub/page.tsx` to replace placeholder
7. Update CODE-STRUCTURE files (actions.md, new components-tournament-hub.md, pages.md, CODE-STRUCTURE.md Flow 29/30)

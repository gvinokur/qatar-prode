# Plan: Story #451 — Surface AI-generate CTA for urgent unpredicted games

## Story Context

**Issue:** https://github.com/gvinokur/qatar-prode/issues/451  
**Problem:** A user logging in shortly before kick-off may not realise they haven't predicted an imminent game. The hub already surfaces urgent unpredicted games in its carousel, but requires the user to navigate to the games page and manually enter scores. Adding an AI-generate CTA directly in the hub reduces missed predictions with a single tap.

**Objective:** When games are within a configurable threshold (e.g. 2 h) of kick-off and the user has no prediction for them, show a banner inside the hub's games carousel that lets the user AI-generate all those predictions in one tap without leaving the hub.

---

## Acceptance Criteria

- [ ] Banner appears when ≥1 imminent unpredicted game exists (game within threshold of kick-off, no complete prediction, deadline still open)
- [ ] Tapping the CTA opens a confirm dialog showing the game count; on confirm, predictions are generated for **imminent games only**
- [ ] Banner disappears immediately after all imminent games are predicted
- [ ] Time threshold is configurable per tournament in the backoffice (default: 2 h when null)
- [ ] Feature works in EN and ES

---

## Technical Approach

### Where the CTA lives

The hub's `GamesActiveWidget` → `GamesActiveSection` already renders a `GuessesContextProvider` wrapping `GamesActiveClient`. A new `ImminentGamesAiCta` Client Component will be rendered **inside** that same `GuessesContextProvider`, just above `GamesActiveClient`. This means:
- It reads `gameGuesses` from context to reactively hide itself once all imminent games are predicted
- It calls `context.updateGameGuess` (which auto-saves via the existing `saveGameGuess` server action) — no new server action needed for the prediction-save path
- No new callbacks or prop drilling beyond `imminentGameIds`

### Imminent game detection (server-side)

`getActionCenterGames` already computes `urgentGames` (unpredicted, deadline open). A new filter over that set picks games where `game.game_date.getTime() - now ≤ thresholdMs`. This runs server-side so the client gets a simple list of IDs.

The threshold (`ai_cta_threshold_hours`) is stored as a nullable integer on the `tournaments` table. `null` → code uses 2 h.

### Backoffice configuration

A new "AI CTA threshold (hours)" number field is added to `TournamentMainDataTab`. It reads/writes via the existing `getTournamentById` / `createOrUpdateTournament` actions — no new actions needed.

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/components/tournament-hub/imminent-games-ai-cta.tsx` | New Client Component — banner + dialog + generate logic |
| `app/components/tournament-hub/__tests__/imminent-games-ai-cta.test.tsx` | Unit tests |
| `migrations/20260525000000_add_ai_cta_threshold_to_tournaments.sql` | DB migration |

## Files to Modify

| File | Change |
|------|--------|
| `app/db/tables-definition.ts` | Add `ai_cta_threshold_hours?: number \| null` to `TournamentTable` |
| `app/actions/hub-actions.ts` | Extend `ActionCenterData` + `getActionCenterGames` to compute `imminentUnpredictedGameIds` |
| `app/components/tournament-hub/games-active-widget.tsx` | Extract `imminentGameIds` from `data` and pass to `GamesActiveSection` |
| `app/components/tournament-hub/games-active-section.tsx` | Accept `initialImminentGameIds` prop; render `ImminentGamesAiCta` inside `GuessesContextProvider` |
| `app/components/backoffice/tournament-main-data-tab.tsx` | Add "AI CTA threshold (hours)" NumberField |
| `messages/en.json` | New `hub.imminentAiCta.*` keys |
| `messages/es.json` | New `hub.imminentAiCta.*` keys |
| `docs/code-structure/actions.md` | Update `getActionCenterGames` entry |
| `docs/code-structure/components/components-tournament-hub.md` | Add `ImminentGamesAiCta`, update `GamesActiveSection`, `GamesActiveWidget` |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**

- **Flow: GamesActiveSection (hub carousel)** — add `ImminentGamesAiCta` rendered inside `GuessesContextProvider`, between the provider and `GamesActiveClient`. `ImminentGamesAiCta` reads `GuessesContext` and calls `generateAIPrediction` + `context.updateGameGuess` on confirm.

No new cross-layer flows; the save path reuses the existing `GuessesContextProvider → saveGameGuess` mechanism.

---

### `app/db/tables-definition.ts` *(modified)*

**Changed interface:**

- **TournamentTable** — add field `ai_cta_threshold_hours?: number | null`. No new functions.

---

### `app/actions/hub-actions.ts` *(modified)*

**Extended interface `ActionCenterData`:**

- Add `imminentUnpredictedGameIds: string[]` — IDs of urgent games where `game_date - now ≤ thresholdMs` and the prediction is incomplete. Empty array in fallback/empty modes.

**Changed function:**

- **getActionCenterGames(tournamentId: string, locale: Locale)**: `Promise<ActionCenterData>` *(was: same signature, fewer return fields)*  
  Now reads `tournament.ai_cta_threshold_hours ?? 2`, computes `thresholdMs = thresholdHours * 3_600_000`, filters `urgentGames` to those where `g.game_date.getTime() - now ≤ thresholdMs`, collects their IDs into `imminentUnpredictedGameIds`, and includes it in the returned object. Returns `imminentUnpredictedGameIds: []` in all non-urgent modes.  
  Calls: (same as before — no new repo calls)  
  Tests:
  - returns `imminentUnpredictedGameIds: []` when mode is fallback or empty
  - returns IDs of urgent games within the threshold when they have no complete prediction
  - excludes urgent games outside the threshold from `imminentUnpredictedGameIds`
  - uses `ai_cta_threshold_hours` from tournament when set (3 h example)
  - falls back to 2 h default when `ai_cta_threshold_hours` is null

---

### `app/components/tournament-hub/games-active-widget.tsx` *(modified)*

**Changed component:**

- **GamesActiveWidget({ data, tournamentId, gamesHref })**: `Promise<JSX.Element>` *(no signature change)*  
  Now extracts `const imminentGameIds = data.imminentUnpredictedGameIds` and passes `initialImminentGameIds={imminentGameIds}` to `GamesActiveSection`.  
  Calls: getTranslations('hub'), computeUrgencyLevel  
  Renders: GamesActiveSection

---

### `app/components/tournament-hub/games-active-section.tsx` *(modified)*

**Changed component:**

- **GamesActiveSection({ ..., initialImminentGameIds })**: `JSX.Element` *(adds `initialImminentGameIds: string[]` prop)*  
  Stores `imminentGameIds` in `useState(initialImminentGameIds)`. Inside `GuessesContextProvider`, renders `<ImminentGamesAiCta imminentGameIds={imminentGameIds} games={games} teamsMap={teamsMap} />` above `<GamesActiveClient>`.  
  Calls: getCarouselGames, computeUrgencyLevel  
  Renders: GuessesContextProvider (key={refetchKey}), ImminentGamesAiCta (new), GamesActiveClient

---

### `app/components/tournament-hub/imminent-games-ai-cta.tsx` *(new)*

**New functions:**

- **ImminentGamesAiCta({ imminentGameIds, games, teamsMap })**: `JSX.Element | null` — [Client] Reads `gameGuesses` and `updateGameGuess` from `GuessesContext`. Computes `pendingIds = imminentGameIds.filter(id => !isGuessComplete(gameGuesses[id], isPlayoff(id)))` where `isPlayoff` checks `games.find(g => g.id === id)?.playoffStage`. Returns `null` when `pendingIds.length === 0`. Otherwise renders an outlined Paper banner: `AutoAwesomeIcon` + `t('imminentAiCta.prompt', { count: pendingIds.length })` headline + `t('imminentAiCta.subtitle')` body + "Generate now" Button. Button click sets `dialogOpen=true`. Renders `AiGenerateAllDialog` (dynamic import, ssr:false) with `open={dialogOpen}`, `pendingCount={pendingIds.length}`, `loading` state, and optional `errorMessage`. On `onConfirm`: sets `loading=true`; for each `id` in `pendingIds`, finds the game in `games`, calls `generateAIPrediction(homeRank, awayRank, isPlayoffGame)`, calls `updateGameGuess(id, {...guess, home_score, away_score, ...penaltyFields})`; then sets `loading=false`. On error: sets `errorMessage`. Uses `isGuessComplete` from `app/utils/guess-utils`, `generateAIPrediction` from `app/utils/ai-prediction-generator`.  
  Uses: useContext(GuessesContext), useState, useTranslations('hub'), isGuessComplete, generateAIPrediction, AutoAwesomeIcon, Paper, Stack, Typography, Button, dynamic(AiGenerateAllDialog)  
  Tests:
  - returns null when `imminentGameIds` is empty
  - returns null when all imminent games already have complete predictions in context
  - renders banner with correct game count when pending games exist
  - opens dialog on button click
  - calls `generateAIPrediction` for each pending game and calls `updateGameGuess` with the result on confirm
  - shows error message when `updateGameGuess` throws
  - disables confirm button while loading

---

### `app/components/backoffice/tournament-main-data-tab.tsx` *(modified)*

**Changed component:**

- **TournamentMainDataTab({ tournamentId, onUpdate })**: `JSX.Element` *(no signature change)*  
  Adds a "AI CTA threshold (hours)" `TextField type="number"` reading from `tournament.ai_cta_threshold_hours` (shown as empty string when null). Saves via `createOrUpdateTournament` with `ai_cta_threshold_hours: value || null`. Placed in the Feature Configuration section alongside tiebreaker mode.  
  Tests: (existing snapshot/integration tests — no new unit tests needed for this field alone)

---

## Translation Keys

**`messages/en.json`** — inside `hub` namespace:
```json
"imminentAiCta": {
  "prompt": "{count, plural, one {1 game starting soon} other {# games starting soon}}",
  "subtitle": "Generate AI predictions before kick-off?",
  "cta": "Generate now"
}
```

**`messages/es.json`** — inside `hub` namespace:
```json
"imminentAiCta": {
  "prompt": "{count, plural, one {1 partido comienza pronto} other {# partidos comienzan pronto}}",
  "subtitle": "¿Generar predicciones con IA antes del pitido inicial?",
  "cta": "Generar ahora"
}
```

---

## DB Migration

```sql
-- migrations/20260525000000_add_ai_cta_threshold_to_tournaments.sql
ALTER TABLE tournaments
  ADD COLUMN IF NOT EXISTS ai_cta_threshold_hours INTEGER DEFAULT NULL;

COMMENT ON COLUMN tournaments.ai_cta_threshold_hours IS
  'Hours before kick-off at which the hub AI-generate CTA appears. NULL = use 2 h default.';
```

> ⚠️ **Requires user approval before running.** Safe — additive, nullable, no data changes.

---

## Visual Prototype

The banner renders inside `DashboardCard` (the Games widget card), above the game carousel:

```
┌─────────────────────────────────────────────────┐
│ ✨  2 games starting soon                        │
│     Generate AI predictions before kick-off?    │
│                          [ Generate now ]        │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐  ← existing carousel
│  ARG  2 – 1  BRA   [🎯 Predict]  [✨ AI]       │
│  ← ·  ·  ·  →                                  │
└─────────────────────────────────────────────────┘
```

**Tone:** `outlined Paper` with `secondary.main` left border accent (matches existing urgency styling). Uses MUI theme tokens only.

**States:**
- Visible: `pendingIds.length > 0`
- Hidden (renders null): all imminent games predicted or `imminentGameIds` empty
- Loading: "Generate now" button shows `CircularProgress size={16}` + disabled
- Error: red body2 text below subtitle (same pattern as `AiGenerateAllDialog`)

---

## Implementation Steps

1. **DB + type** — Write migration SQL; add `ai_cta_threshold_hours?: number | null` to `TournamentTable`
2. **Hub action** — Extend `ActionCenterData` interface + compute logic in `getActionCenterGames`
3. **New component** — Implement `ImminentGamesAiCta` with tests
4. **Wire into carousel** — Update `GamesActiveWidget` + `GamesActiveSection`
5. **Backoffice** — Add threshold field to `TournamentMainDataTab`
6. **Translations** — Add new keys to `en.json` and `es.json`
7. **CODE-STRUCTURE** — Update `actions.md` and `components-tournament-hub.md`
8. **Validate** — Run `npm test`, `npm run lint`, `npm run build`

---

## Testing Strategy

**Unit tests (Vitest):**

- `imminent-games-ai-cta.test.tsx` — All scenarios listed in Mid-Level Design (7 tests)
- `hub-actions.test.ts` — 5 new test cases for `imminentUnpredictedGameIds` computation

**Manual verification in Vercel Preview:**
1. Log in, find a tournament with games kicking off within 2 h that have no prediction
2. Navigate to hub — CTA banner should appear in the Games widget
3. Tap "Generate now" → confirm dialog shows correct count → predictions appear in carousel
4. Banner disappears after all imminent games are predicted
5. Repeat with a custom threshold (e.g., 4 h) set in backoffice

---

## Quality Gates

- 0 new SonarCloud issues
- Coverage ≥ 80% on new code (`ImminentGamesAiCta` + hub-actions additions)
- Passes existing hub widget tests

---

## Open Questions

_None — all requirements are clear from the acceptance criteria._

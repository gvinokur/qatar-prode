# Story #394 Plan: Playoff Round Definition Alerts

## Context

Part of Epic #389 (Guided Tournament Prediction Flow), story #394 is the re-engagement engine for playoff rounds. The problem: once group stage ends, playoff games appear in the Games list but users don't know they're now available for prediction. This story adds two surfaces where "Now Available" appears (attention widget + stage separator badge) and unifies how completion data is reported across the app by adding per-playoff-round breakdown to `TournamentPredictionCompletion`.

Prerequisite: Story #390 (Unified Priority Attention Widget) — already merged.

---

## Acceptance Criteria

1. **"Now Available" Resolution (Dual Triggers):** A playoff round is "Now Available" if user has unpredicted games AND (Trigger A: any game in round has real teams assigned) OR (Trigger B: 3h past last game of previous stage)
2. **Attention Widget:** New Level 2 card: "[Round Name] is Now Available for prediction. [Predict Now]" → deep-links to first unpredicted game of that round in edit mode
3. **Games List:** `StageSeparator` and `StageTransitionBanner` display a "Now Available" chip when applicable
4. **Data Consistency:** `TournamentPredictionCompletion` extended with `playoffRoundsCompletion` record; drives both surfaces
5. **Language:** "Now Available" (EN) / "Disponible ahora" (ES)

---

## Technical Approach

### "Now Available" Detection

**Trigger A (Team Definition):** Games table stores actual team names in `home_team` and `away_team` (nullable strings). A game has real teams when both are non-null.

**Trigger B (Timeline):** "Previous stage" for a playoff round = all games in the round with the next-lower `round_order` (or the group stage if it's the first playoff round). Check `max(game_date) + 3h < now`.

Both triggers require:
- Per-round game details (team assignments, game dates)
- User's guess completion per round

### Data Flow

```
getTournamentPredictionCompletion  (extended)
  → adds playoffRoundsCompletion: Record<roundId, { total, completed, round_name }>

computeNowAvailableRoundIds  (new pure util, app/utils/playoff-availability.ts)
  → takes PlayoffRoundAvailabilityInfo[] (which includes hasTeamsDefined + previousStageLastGameDate)
  → returns string[] of round IDs that qualify

getActionCenterGames  (extended)
  → fetches PlayoffRoundAvailabilityInfo via new repository function
  → calls computeNowAvailableRoundIds
  → adds nowAvailablePlayoffRound: { roundId, roundName, firstGameId } | null to ActionCenterData

computePriorityAttention  (extended)
  → checks data.nowAvailablePlayoffRound → returns 'now-available-playoff' state

PriorityAttentionWidget  (extended)
  → renders success/green card with "Predict Now" CTA → gamesHref?edit=<firstGameId>

Games page server component
  → calls new getPlayoffRoundsAvailability(tournamentId, userId) action
  → passes nowAvailableRoundIds: string[] to UnifiedGamesPageClient

UnifiedGamesPageClient  (extended)
  → receives nowAvailableRoundIds
  → passes to GamesListWithScroll as nowAvailableRoundIds: Set<string>

GamesListWithScroll  (extended)
  → passes isNowAvailable={nowAvailableRoundIds.has(roundId)} to StageSeparator/StageTransitionBanner

StageSeparator / StageTransitionBanner  (extended)
  → accept isNowAvailable?: boolean
  → render a "Now Available" Chip when true
```

### Priority in Attention Widget

Updated tier order:
1. `urgent-games` (closing soon, red/error)
2. `now-available-playoff` (new round, success/green) ← NEW
3. `deadline` (QT/awards < 48h, warning/yellow)
4. `new-actions-qt`
5. `new-actions-awards`

### Deep-Linking

The "Predict Now" CTA in the attention widget uses: `${gamesHref}?edit=${firstUnpredictedGameId}`

`firstUnpredictedGameId` = first game (by game_date) in the available round where the user has no complete guess. Computed in `getActionCenterGames` when building `nowAvailablePlayoffRound`.

Existing `?edit=<gameId>` logic in `unified-games-page-client.tsx` handles this: clears filters, scrolls to game, opens edit mode.

---

## Visual Prototype

### Attention Widget — New Card

```
┌────────────────────────────────────────────────────┐
│  [●]  Round of 16 is Now Available               │
│ green  Predict the knockout games now         [Predict Now] │
└────────────────────────────────────────────────────┘
```
- Avatar: `PlayCircleOutlineIcon` on `success.main` background
- Button: `color="success"` (green)
- Title: "[Round Name] is Now Available"
- Subtitle: "Predict the knockout games now"

### Stage Separator — "Now Available" Badge

```
─── ROUND OF 16  [Now Available] ─────────────────────
```
```
─── QUARTER-FINALS ────────────────────────────────────
```
Badge: MUI `<Chip label="Now Available" size="small" color="success" />` inline after the round label

For `StageTransitionBanner` (Group→Playoff boundary):
```
─── ROUND OF 16  [Now Available] ─────  [Check QT Predictions] ───
```

---

## Files to Create / Modify

### New File

- **`app/utils/playoff-availability.ts`** — Pure `computeNowAvailableRoundIds` utility + `PlayoffRoundAvailabilityInfo` type

### Modified Files

| File | Change |
|------|--------|
| `app/db/tables-definition.ts` | Add `PlayoffRoundCompletionData` + `PlayoffRoundAvailabilityInfo` interfaces; extend `TournamentPredictionCompletion.playoffRoundsCompletion` |
| `app/db/tournament-prediction-completion-repository.ts` | Add per-round completion queries in `getTournamentPredictionCompletion` |
| `app/db/tournament-playoff-repository.ts` | New `findPlayoffRoundsWithAvailabilityInfo(tournamentId, userId)` function |
| `app/actions/hub-actions.ts` | Extend `ActionCenterData` with `nowAvailablePlayoffRound`; compute in `getActionCenterGames` |
| `app/utils/priority-attention.ts` | Add `'now-available-playoff'` type + state fields; update `computePriorityAttention` |
| `app/components/tournament-hub/priority-attention-widget.tsx` | Add `'now-available-playoff'` case in `buildCardConfig` |
| `app/components/stage-separator.tsx` | Add `isNowAvailable?: boolean` prop; render `Chip` badge |
| `app/components/stage-transition-banner.tsx` | Add `isNowAvailable?: boolean` prop; render `Chip` badge |
| `app/components/games-list-with-scroll.tsx` | Add `nowAvailableRoundIds?: Set<string>` prop; pass to separators |
| `app/components/secondary-filters.tsx` | Accept `nowAvailableRoundIds?: Set<string>`; render a `Chip` badge next to round name in dropdown `MenuItem` when round is available |
| `app/components/unified-games-page-client.tsx` | Accept `nowAvailableRoundIds: string[]` prop; convert to Set, pass to GamesListWithScroll and SecondaryFilters |
| Games page server component (`app/(app)/[locale]/[tournamentId]/games/page.tsx`) | Call new `getPlayoffRoundsAvailability` action; pass ids to client |
| `locales/en/hub.json` | Add `attentionWidget.nowAvailablePlayoff.*` keys |
| `locales/es/hub.json` | Spanish equivalents |
| `locales/en/predictions.json` | Add `stageSeparator.nowAvailable` key |
| `locales/es/predictions.json` | Spanish equivalent |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 22 (Tournament Hub shell / action center)** — `getActionCenterGames` now calls `findPlayoffRoundsWithAvailabilityInfo` and `computeNowAvailableRoundIds`; adds `nowAvailablePlayoffRound` to `ActionCenterData`
- **Flow 28 (Games Page internal flow)** — Games page server component now calls `getPlayoffRoundsAvailability`; passes `nowAvailableRoundIds` through to `GamesListWithScroll`

**New flows:**
- none

---

### `app/utils/playoff-availability.ts` *(new)*

```typescript
export interface PlayoffRoundAvailabilityInfo {
  roundId: string
  roundOrder: number
  hasTeamsDefined: boolean           // any game has non-null home_team + away_team
  previousStageLastGameDate: Date | null  // max game_date of previous stage
  hasUnpredictedGames: boolean       // completed < total
}
```

**New functions:**

- **computeNowAvailableRoundIds(rounds: PlayoffRoundAvailabilityInfo[], now: number): string[]**
  Pure function. Returns round IDs where user has unpredicted games AND (Trigger A: hasTeamsDefined) OR (Trigger B: previousStageLastGameDate + 3h < now).
  Tests:
  - returns empty array when all rounds are fully predicted
  - returns round with hasTeamsDefined=true when it has unpredicted games
  - returns round when 3h has passed since previousStageLastGameDate
  - does NOT return round when hasTeamsDefined=false and timeline not met
  - does NOT return round when fully predicted even if teams defined
  - handles null previousStageLastGameDate gracefully (only Trigger A applies)

---

### `app/db/tables-definition.ts` *(modified)*

**New interfaces:**

- **PlayoffRoundCompletionData** (interface):
  `{ total: number; completed: number; round_name: string }`
  Used in `TournamentPredictionCompletion.playoffRoundsCompletion`.

**Changed types:**

- **TournamentPredictionCompletion** *(was: no playoff round breakdown)*
  Now adds: `playoffRoundsCompletion: Record<string, PlayoffRoundCompletionData>` — dynamically keyed by round ID, ordered by round_order ascending.

---

### `app/db/tournament-playoff-repository.ts` *(modified)*

**New functions:**

- **findPlayoffRoundsWithAvailabilityInfo(tournamentId: string, userId: string): Promise<PlayoffRoundAvailabilityInfo[]>**
  Queries tournament_playoff_rounds → round_games → games + game_guesses. Computes per-round: total games, user-completed games, hasTeamsDefined (BOOL OR of home_team IS NOT NULL), and previousStageLastGameDate (derived by ordering rounds by round_order and looking up previous round's max game_date, falling back to max group game_date for the first round).
  Calls: db (direct Kysely queries)
  Tests:
  - returns empty array when tournament has no playoff rounds
  - hasTeamsDefined=true when any game in round has both teams set
  - hasTeamsDefined=false when all games have null team slots
  - previousStageLastGameDate is null for the first round when no group games exist
  - previousStageLastGameDate = last group game date for the first playoff round
  - previousStageLastGameDate = last game of previous round for subsequent rounds
  - hasUnpredictedGames=false when user has completed all games in the round

---

### `app/db/tournament-prediction-completion-repository.ts` *(modified)*

**Changed functions:**

- **getTournamentPredictionCompletion(userId, tournamentId, tournament): Promise<TournamentPredictionCompletion>** *(was: no playoffRoundsCompletion)*
  Now additionally queries per-round game counts and populates `playoffRoundsCompletion`.
  Calls: db (existing), findPlayoffRoundCompletionsByUser (new helper)
  Tests:
  - playoffRoundsCompletion is empty Record when tournament has no playoff rounds
  - per-round total matches number of games in that round
  - per-round completed reflects user's game guesses (with penalty winner logic for tied playoff games)
  - returns correct round_name for each entry

---

### `app/actions/hub-actions.ts` *(modified)*

**New interface field in ActionCenterData:**
- `nowAvailablePlayoffRound: { roundId: string; roundName: string; firstGameId: string } | null`

**Changed functions:**

- **getActionCenterGames(tournamentId, locale): Promise<ActionCenterData>** *(was: no playoff round availability)*
  Now calls `findPlayoffRoundsWithAvailabilityInfo` and `computeNowAvailableRoundIds`. Computes `nowAvailablePlayoffRound` by finding the first available round and the first unpredicted game within it.
  Calls: getLoggedInUser, findGamesForDashboard, findGameGuessesByUserId, findTeamInTournament, findTournamentById, findFirstGameInTournament, findLastGameInTournament, getTournamentPredictionCompletion, findPlayoffRoundsWithAvailabilityInfo, computeNowAvailableRoundIds, applyLocalizationBatch, applyLocalization
  Tests:
  - nowAvailablePlayoffRound is null when no playoff rounds are available
  - nowAvailablePlayoffRound is null when all games in available round are predicted
  - nowAvailablePlayoffRound.roundName is localized using applyLocalization
  - nowAvailablePlayoffRound.firstGameId is the earliest-dated unpredicted game in the round

**New exported function:**

- **getPlayoffRoundsAvailability(tournamentId: string, userId: string): Promise<string[]>**
  Server Action. Lightweight action for the Games page. Calls `findPlayoffRoundsWithAvailabilityInfo` + `computeNowAvailableRoundIds`. Returns array of now-available round IDs.
  Calls: getLoggedInUser, findPlayoffRoundsWithAvailabilityInfo, computeNowAvailableRoundIds
  Tests:
  - throws Unauthorized when no active session
  - returns empty array when no rounds qualify
  - returns correct round IDs when triggers are met

---

### `app/utils/priority-attention.ts` *(modified)*

**Changed types:**

- **PriorityAttentionType** *(was: 4 types)*: adds `'now-available-playoff'`

- **PriorityAttentionState** *(was: no playoff fields)*: adds `availableRoundName?: string`, `availableRoundFirstGameId?: string`

**Changed functions:**

- **computePriorityAttention(data: ActionCenterData): PriorityAttentionState | null** *(was: 4 priority tiers)*
  Now checks `data.nowAvailablePlayoffRound` at Tier 2 (after urgent-games, before deadline).
  Tests:
  - returns 'now-available-playoff' when nowAvailablePlayoffRound is set and mode is not 'urgent'
  - does NOT return 'now-available-playoff' when mode is 'urgent' (urgent-games takes priority)
  - still returns 'deadline' when nowAvailablePlayoffRound is null and deadline applies
  - returns null when nowAvailablePlayoffRound is set but tournamentFinished=true

---

### `app/components/stage-separator.tsx` *(modified)*

**Changed functions:**

- **StageSeparator({ label, isNowAvailable? })** *(was: label only)*
  Renders a `<Chip label="Now Available" size="small" color="success" />` inline after the label when `isNowAvailable=true`.
  Tests: (component renders badge when isNowAvailable=true, does not render badge when false/undefined)

---

### `app/components/stage-transition-banner.tsx` *(modified)*

**Changed functions:**

- **StageTransitionBanner({ label, ctaLabel, ctaHref, isNowAvailable? })** *(was: no badge)*
  Renders the same `Chip` badge after the label when `isNowAvailable=true`.
  Tests: (badge renders when isNowAvailable=true)

---

### `app/components/games-list-with-scroll.tsx` *(modified)*

**Changed functions:**

- **GamesListWithScroll({ ..., nowAvailableRoundIds? })** *(was: no playoff availability)*
  Accepts optional `nowAvailableRoundIds?: Set<string>`. Passes `isNowAvailable` to `StageSeparator` and `StageTransitionBanner` based on whether the round's ID is in the set.

---

### `app/components/secondary-filters.tsx` *(modified)*

**Changed functions:**

- **SecondaryFilters({ ..., nowAvailableRoundIds? })** *(was: no availability data)*
  Accepts `nowAvailableRoundIds?: Set<string>`. In the playoffs `Select`, each `MenuItem` for a round renders an inline `<Chip label="Now Available" size="small" color="success" />` when `nowAvailableRoundIds.has(round.id)`.
  Tests:
  - renders "Now Available" chip in dropdown item for an available round
  - does not render chip for rounds not in nowAvailableRoundIds
  - renders normally when nowAvailableRoundIds is undefined

---

### `app/components/unified-games-page-client.tsx` *(modified)*

**Changed functions:**

- **UnifiedGamesPageContent({ ..., nowAvailableRoundIds? })** *(was: no availability data)*
  Accepts `nowAvailableRoundIds?: string[]` prop from server; converts to `Set<string>` via `useMemo`; passes to both `GamesListWithScroll` and `SecondaryFilters`.

---

## Testing Strategy

### Unit Tests (new files)

- `app/utils/__tests__/playoff-availability.test.ts` — 6 test cases for `computeNowAvailableRoundIds`
  Uses: plain `PlayoffRoundAvailabilityInfo` object literals (no DB, pure function)
- `app/utils/__tests__/priority-attention.test.ts` — 4 test cases for new `'now-available-playoff'` tier in `computePriorityAttention`
  Uses: `makeData` helper pattern (see stage-utils.test.ts); construct minimal `ActionCenterData` partials with `nowAvailablePlayoffRound` field

### Integration Tests (extended existing files)

- `app/db/__tests__/tournament-playoff-repository.test.ts` — add 7 test cases for `findPlayoffRoundsWithAvailabilityInfo`
  Uses: `testFactories.tournament()`, `testFactories.game()`, `testFactories.gameGuess()`; requires real DB connection
- `app/db/__tests__/tournament-prediction-completion-repository.test.ts` — add 4 test cases for `playoffRoundsCompletion` field
  Uses: `testFactories.tournament()`, `testFactories.game()`, `testFactories.gameGuess()`

### Component Tests (render)

- Stage separator: `renderWithTheme(<StageSeparator label="Round of 16" isNowAvailable />)` → assert Chip with "Now Available" text is present
- Stage transition banner: `renderWithTheme(<StageTransitionBanner ... isNowAvailable />)` → assert Chip visible
- Attention widget: render with `data.nowAvailablePlayoffRound = { roundId, roundName: "Round of 16", firstGameId }` → assert success-color button and "[Round of 16] is Now Available" text

---

## Translation Keys to Add

**`locales/en/hub.json`** — under `attentionWidget`:
```json
"nowAvailablePlayoff": {
  "title": "{roundName} is Now Available",
  "subtitle": "Predict the knockout games now",
  "cta": "Predict Now"
}
```

**`locales/es/hub.json`** — under `attentionWidget`:
```json
"nowAvailablePlayoff": {
  "title": "{roundName} está Disponible ahora",
  "subtitle": "Predecí los partidos de eliminación",
  "cta": "Predecir ahora"
}
```

**`locales/en/predictions.json`** — under `stageSeparator`:
```json
"nowAvailable": "Now Available"
```

**`locales/es/predictions.json`** — under `stageSeparator`:
```json
"nowAvailable": "Disponible ahora"
```

---

## Implementation Waves

**Wave 1 — Data layer** (no UI deps):
- `tables-definition.ts` — new interfaces + extend TournamentPredictionCompletion
- `tournament-playoff-repository.ts` — new `findPlayoffRoundsWithAvailabilityInfo`
- `tournament-prediction-completion-repository.ts` — add per-round completion
- `playoff-availability.ts` — new pure utility

**Wave 2 — Logic + Actions** (depends on Wave 1):
- `hub-actions.ts` — extend `ActionCenterData` + compute in `getActionCenterGames` + new `getPlayoffRoundsAvailability`
- `priority-attention.ts` — add new type + update `computePriorityAttention`
- Translation files

**Wave 3 — UI** (depends on Wave 2):
- `stage-separator.tsx` — add `isNowAvailable` prop
- `stage-transition-banner.tsx` — add `isNowAvailable` prop
- `priority-attention-widget.tsx` — handle new card type
- `games-list-with-scroll.tsx` — accept `nowAvailableRoundIds`
- `secondary-filters.tsx` — add `nowAvailableRoundIds` prop + MenuItem badge
- `unified-games-page-client.tsx` — pass `nowAvailableRoundIds` to GamesListWithScroll and SecondaryFilters
- Games page server component — call `getPlayoffRoundsAvailability`

---

## CODE-STRUCTURE Files to Update

- `docs/code-structure/utils.md` — add `playoff-availability.ts` entry
- `docs/code-structure/utils.md` — update `priority-attention.ts` entry (new type)
- `docs/code-structure/actions.md` — update `hub-actions.ts` entry (new field + function)
- `docs/code-structure/db.md` — update `tournament-prediction-completion-repository.ts` (new field)
- `docs/code-structure/db.md` — update `tournament-playoff-repository.ts` (new function)
- `docs/code-structure/components/components-tournament-games.md` — update StageSeparator, StageTransitionBanner, GamesListWithScroll, SecondaryFilters, UnifiedGamesPageClient
- `docs/code-structure/components/components-tournament-hub.md` — update PriorityAttentionWidget
- `CODE-STRUCTURE.md` — call graph update for Flow 22 and Flow 28

---

## Open Questions

1. **Games page server component path**: Need to verify exact path of the games page. Will locate during implementation.
2. **`predictions.json` stageSeparator key**: Need to verify if `stageSeparator` section exists already in predictions locale or needs to be created.
3. **Qualified Teams page**: The story mentions driving data into the QT page, but the main concrete changes are attention widget + games page badge. QT page audit may produce no-op if it already reads from `getTournamentPredictionCompletion`.

---

## Validation

1. Run `npm run test` — all existing tests pass, new tests pass
2. Run `npm run lint` — no lint errors
3. Run `npm run build` — no TypeScript errors
4. Deploy to Vercel Preview; manually test:
   - When a playoff round has real teams assigned → attention widget shows "Now Available" card
   - When `?edit=<gameId>` is followed → game opens in edit mode
   - Stage separator shows "Now Available" chip for the eligible round
   - When round is fully predicted → no "Now Available" badge shown
   - Timeline trigger: manually set a game date to > 3h ago and verify the trigger fires

# STORY-407 Plan: Phase-aware Prediction Status Header

## Story Context

**GitHub Issue:** #407 — [Story] Phase-aware prediction status header
**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-407`
**Branch:** `feature/story-407`
**Mockup:** `mockups/STORY-prediction-page-status-header-v5-audited.html`
**Variant Spec:** `docs/stories/prediction-status-header-variant-audit.md`

## Objective

Replace the generic dual-progress bar (`CompactPredictionDashboard`) on all three prediction pages (Games / Qualified Teams / Awards) and the standalone QT auto-fill banner (`QTActionBanner`) with a single, unified, data-driven `PredictionStatusHeader` component. The header automatically picks its variant from live data (tournament phase × user progress × deadlines), making the next action obvious without the user having to interpret raw progress numbers.

## Acceptance Criteria Summary

- One `PredictionStatusHeader` component on all 3 pages, replacing `CompactPredictionDashboard` AND `QTActionBanner`
- Data-driven: variant computed from data, no manual page-level overrides
- MUI v7 theme tokens only (no hex/rgba)
- All action buttons use `color="primary"` regardless of urgency tone (urgency conveyed by background tint + icon + status text)
- All copy works in EN and ES

Full per-variant spec: `docs/stories/prediction-status-header-variant-audit.md`

---

## Current State Analysis

### Components being replaced

| Component | Used on | Status |
|---|---|---|
| `CompactPredictionDashboard` | Games, QT, Awards | **Replace** on all 3 pages; **keep file** (onboarding demo uses it) |
| `QTActionBanner` | QT page only | **Delete** file (no other usages) |
| `PredictionStatusBar` | `tabbed-playoff-page.tsx` only | **Keep as-is** (out of scope) |

### Data already available per page

**Games page** (`UnifiedGamesPageClient`):
- `TournamentPredictionCompletion` — has `completedGroupGames`, `totalGroupGames`, `playoffRoundsCompletion`, `silverBoostsUsed/Max`, etc.
- `closingGames: ExtendedGameData[]` — games closing within 48h (already computed)
- `gameGuesses` — from `GuessesContext`
- `getPredictionDashboardStats()` is already called in `unified-games-page.tsx` (returns boost stats)
- **Missing**: total game prediction points (group_score + playoff_score) → need to add a `getUserGameStats` call

**QT page** (`QualifiedTeamsUI`):
- `TournamentPredictionCompletion` — same as above
- `scoringBreakdown: QualifiedTeamsScoringResult` — has `totalScore` (QT points earned) ✅
- `isLocked` — from page
- QT lock datetime: derived from `tournamentStartDate + PREDICTION_LOCK_OFFSET_MS`

**Awards page** (`AwardsPanel`):
- `tournamentGuesses.individual_awards_score` — already fetched ✅
- `isPredictionLocked` — passed as prop
- `tournamentStartDate` — passed as prop

---

## Technical Approach

### Architecture: Variant Descriptor Pattern

1. **Pure selector functions** compute a `StatusHeaderVariant` descriptor from page data
2. **`PredictionStatusHeader`** (single presentational component) renders any descriptor
3. **Pages** import and call the appropriate selector function

Benefits: testable pure functions, simple renderer, clear separation.

### New Folder

```
app/components/prediction-status-header/
  types.ts                         ← shared types
  prediction-status-header.tsx     ← presentational component
  games-header-variant.ts          ← Games selector
  qt-header-variant.ts             ← QT selector
  awards-header-variant.ts         ← Awards selector
  index.ts                         ← barrel export
  __tests__/
    games-header-variant.test.ts
    qt-header-variant.test.ts
    awards-header-variant.test.ts
    prediction-status-header.test.tsx
```

### `StatusHeaderVariant` Type

```typescript
export type StatusHeaderTone =
  | 'brand'           // pre-tournament, calm
  | 'calm'            // stage-active caught-up
  | 'success'         // completed pre-lock
  | 'deadlineSoon'    // < 48h info
  | 'deadlineUrgent'  // < 24h warning
  | 'deadlineNow'     // < 2h error
  | 'locked'          // post-lock

export type HeaderAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never }

export interface StatusHeaderVariant {
  tone: StatusHeaderTone
  stageLabel?: string           // Games page only: "Grupos" | "Octavos" | ... | "Finalizado"
  leadIcon: 'rocket' | 'check' | 'info' | 'warning' | 'error' | 'lock'
  statusText: string
  chip?: { label: string; color: 'default' | 'success' | 'error' | 'warning' | 'info' }
  boosts?: { silverUsed: number; silverMax: number; goldenUsed: number; goldenMax: number }
  pointsBadge?: string          // e.g. "1.245 pts" — terminal states only
  message?: string              // rich body text (optional)
  action?: HeaderAction
  secondaryAction?: HeaderAction
  // No expandedGames — game list computed into message by computeGamesHeaderVariant
}
```

### Tone → Background color (MUI tokens only)

| Tone | `sx.backgroundColor` | Left border color |
|------|----------------------|------------------|
| brand | `background.paper` | `primary.main` |
| calm | `background.paper` | `divider` |
| success | `success.50` | `success.main` |
| deadlineSoon | `info.50` | `info.main` |
| deadlineUrgent | `warning.50` | `warning.main` |
| deadlineNow | `error.50` | `error.main` |
| locked | `action.hover` | `text.disabled` |

### Variant Priority Order

**Collision decision (Games):** If `urgent-unpredicted` AND `pre-groups-complete-nudge-qt` triggers are both true (groups just finished AND an urgent game closes soon), `urgent-unpredicted` wins. Rationale: urgency (a game closing without a prediction) is more time-critical than navigational nudging. The user needs to act NOW on the urgent game first; they can still go to QT afterward.

**Games:** `tournament-finished` → `urgent-unpredicted` → `pre-groups-complete-nudge-qt` → `pre-tournament` → `stage-active-caught-up`

**QT:** `never-filled-locked` → `locked-with-results` → `locked-pending` → `completed-pre-lock` → `lock-window-urgent` → `pre-tournament-auto-fill-ready` → `pre-tournament-urgent` → `pre-tournament`

**Awards:** `never-filled-locked` → `locked-with-results` → `locked-pending` → `completed-pre-lock` → `pre-tournament` (with urgency modifiers)

### Points Data Plan

| Page | Terminal variant | Points source |
|---|---|---|
| Games | `tournament-finished` | **`getGameGuessStatisticsForUsers([userId], tournamentId)`** (confirmed exists in `app/db/game-guess-repository.ts:258`). Add to `unified-games-page.tsx` parallel fetch, pass `gamePointsEarned = group_score + group_boost_bonus + playoff_score + playoff_boost_bonus` down to client |
| QT | `locked-with-results (complete)` | `scoringBreakdown.totalScore` ✅ already available |
| Awards | `locked-with-results (complete)` | `tournamentGuesses.individual_awards_score` ✅ already fetched in awards page |

### Stage Label Derivation (Games page)

The stage label reflects the **current tournament phase** — derived from game dates, not prediction completion.

`deriveStageLabel` receives `games: ExtendedGameData[]` and `now: Date`. Each stage owns the interval from the previous stage's last game to this stage's last game:

- **Groups:** `[min(groupGames.date), max(groupGames.date)]`
- **R16:** `[max(groupGames.date), max(R16Games.date)]`
- **QF:** `[max(R16Games.date), max(QFGames.date)]`
- ...each subsequent stage inherits the previous stage's `maxDate` as its start

Algorithm:
1. Bucket games by stage: group games (no `playoffStage`) into one bucket; each playoff round into its own bucket — **except: Final (`is_final`) and Third-place (`is_third_place`) games are merged into a single "Finals" bucket** (label = Final round's `round_name`). If no Third-place game exists, Final stands alone as its own bucket.
2. Sort buckets by `maxDate` ascending (groups first, then playoff rounds by their last-game date, Finals bucket last).
3. Groups bucket `startDate = min(groupGames.date)`, all other buckets `startDate = prevBucket.maxDate`.
4. Current stage = **bucket where `startDate ≤ now ≤ maxDate`**.
5. If `now < groups.startDate` → `"Grupos"` (pre-tournament).
6. If `now > maxDate` of last bucket → `"Finalizado"`.
7. **Fallback** (no games) → `undefined`.

Examples:
- `min(groupGames.date) ≤ now ≤ max(groupGames.date)` → `"Grupos"`
- `max(groupGames.date) ≤ now ≤ max(R16Games.date)` → R16 round name
- `max(SFGames.date) ≤ now ≤ max(Final+ThirdGames.date)` → Final round name (Finals bucket)
- `now > max(allGames.date)` → `"Finalizado"`

### Playoff Final+Third Grouping

`PlayoffRound` has explicit `is_final?: boolean` and `is_third_place?: boolean` flags — use these instead of `round_order` ranking (some tournaments have no Third-place game).

**Required: extend `PlayoffRoundCompletionData`** (in `tables-definition.ts`) with `is_final?: boolean` and `is_third_place?: boolean`. **Also extend the query** in `tournament-prediction-completion-repository.ts` line 164 to add `'is_final'` and `'is_third_place'` to `.select(...)` and propagate them into the `playoffRoundsCompletion[round.id]` object.

`collapsePlayoffDenominator` logic:
- Final slot = entry where `is_final === true` (exactly 1 per tournament, always present)
- Third-place slot = entry where `is_third_place === true` (may be absent — tournaments without a 3rd-place game)
- Merge: if Third-place slot exists → combine totals into one "Final-pair" chip slot
- If Third-place slot absent → Final slot stands alone (no merging)
- Result: Final-pair slot has `total = final.total + (third?.total ?? 0)`, `completed = final.completed + (third?.completed ?? 0)`

### QT Auto-fill Migration

**State/callback contract (explicit):**
- `QualifiedTeamsUI` passes `onAutoFillSuccess` callback and `isLocked` to `PredictionStatusHeader`
- `PredictionStatusHeader` holds `dialogOpen`, `isCalculating`, `errorOpen` state internally
- User clicks `Auto-completar` → header opens internal `AutoFillDialog`
- On dialog confirm: header calls `bulkAutoFillFromPredictions(tournamentId, locale)` via `startTransition`
  - Success: clears calculating state, closes dialog, calls `onAutoFillSuccess(predictions)` → page calls `resetPredictions()` to update QT context
  - Failure: clears calculating state, closes dialog, sets `errorOpen = true` → Snackbar inside header shows error
- `isLocked` disables the Auto-completar button
- `AutoFillDialog` sub-component is local to `prediction-status-header.tsx` (not exported) — same copy as the current `QTActionBanner` dialog

---

## Files to Create / Modify

### New files
- `app/components/prediction-status-header/types.ts`
- `app/components/prediction-status-header/prediction-status-header.tsx`
- `app/components/prediction-status-header/games-header-variant.ts`
- `app/components/prediction-status-header/qt-header-variant.ts`
- `app/components/prediction-status-header/awards-header-variant.ts`
- `app/components/prediction-status-header/index.ts`
- `app/components/prediction-status-header/__tests__/games-header-variant.test.ts`
- `app/components/prediction-status-header/__tests__/qt-header-variant.test.ts`
- `app/components/prediction-status-header/__tests__/awards-header-variant.test.ts`
- `app/components/prediction-status-header/__tests__/prediction-status-header.test.tsx`

### Modified files
- `app/db/tables-definition.ts` — extend `PlayoffRoundCompletionData` with `is_final?: boolean; is_third_place?: boolean`
- `app/db/tournament-prediction-completion-repository.ts` — add `'is_final'` and `'is_third_place'` to the playoff rounds query select, propagate into `playoffRoundsCompletion` object
- `app/components/unified-games-page.tsx` — add `getUserGameStats()` call, thread `gamePointsEarned`
- `app/components/unified-games-page-client.tsx` — replace `CompactPredictionDashboard` with `PredictionStatusHeader`
- `app/components/qualified-teams/qualified-teams-client-page.tsx` — replace `CompactPredictionDashboard` + `QTActionBanner` with `PredictionStatusHeader`
- `app/components/awards/award-panel.tsx` — replace `CompactPredictionDashboard` with `PredictionStatusHeader`, thread `individual_awards_score`
- `locales/en/predictions.json` — add `statusHeader.*` translation keys
- `locales/es/predictions.json` — add `statusHeader.*` translation keys
- `docs/code-structure/components/components-tournament-games.md` — update
- `docs/code-structure/components/components-leaderboard-stats.md` — update (QT page)
- `CODE-STRUCTURE.md` — update call graph

### Deleted files
- `app/components/qualified-teams/qt-action-banner.tsx` — no other usages; subsumed

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Games page flow:** `UnifiedGamesPageClient` → `PredictionStatusHeader` (was `CompactPredictionDashboard`)
- **QT page flow:** `QualifiedTeamsUI` → `PredictionStatusHeader` (was `CompactPredictionDashboard` + `QTActionBanner`)
- **QT auto-fill flow (new internal):** `PredictionStatusHeader` → `AutoFillDialog` → `bulkAutoFillFromPredictions` (Server Action) → `onAutoFillSuccess` callback → `QualifiedTeamsUI.resetPredictions()`
- **Awards page flow:** `AwardsPanel` → `PredictionStatusHeader` (was `CompactPredictionDashboard`)

**Removed:** `QTActionBanner` import/usage from `qualified-teams-client-page.tsx`

---

### `app/db/tables-definition.ts` *(modified)*

**Changed type:**

- **`PlayoffRoundCompletionData`**: add `is_final?: boolean` and `is_third_place?: boolean` fields.
  Required by `collapsePlayoffDenominator` to identify Final/Third-place rounds without relying on `round_order` ranking. Prevents incorrect merging in tournaments with no Third-place game.

---

### `app/db/tournament-prediction-completion-repository.ts` *(modified)*

**Changed function:**

- **`getTournamentPredictionCompletion(userId, tournamentId)`**: *(no signature change)*
  Add `'is_final'` and `'is_third_place'` to the `.select(...)` at line 164. Propagate both fields into the `playoffRoundsCompletion[round.id]` object alongside existing `total`, `completed`, `round_name`.
  Calls: `db` (Kysely)
  Tests:
  - `is_final` is `true` on the Final round entry, `undefined`/`false` on others
  - `is_third_place` is `true` on the Third-place round entry when present
  - `is_third_place` is absent/falsy when tournament has no Third-place round

---

### `app/components/prediction-status-header/types.ts` *(new)*

Types only — `StatusHeaderTone`, `HeaderAction`, `StatusHeaderVariant` (see above).

---

### `app/components/prediction-status-header/prediction-status-header.tsx` *(new)*

**Props:**
```typescript
interface PredictionStatusHeaderProps {
  variant: StatusHeaderVariant
  // QT auto-fill support
  onAutoFillSuccess?: (predictions: QualifiedTeamPrediction[]) => void
  isLocked?: boolean
  tournamentId?: string
}
```

- **`PredictionStatusHeader(props: PredictionStatusHeaderProps)`**: `JSX.Element`
  Renders any `StatusHeaderVariant` as a MUI Card. The component knows nothing about games — all display decisions (including the urgent-unpredicted game list) are resolved by the variant selector and stored in `variant.message`.
  - Left-border accent from tone
  - Background tint from tone (MUI `.50` palette tokens)
  - Header row: optional stageLabel chip + leadIcon + statusText (left), chip (right)
  - Optional: boosts row (Games variants)
  - Optional: points badge (top-right, terminal states)
  - Optional: `message` text rendered below header row (multiline, `white-space: pre-line`)
  - Optional: action/secondaryAction buttons
  - Internal `AutoFillDialog` for QT auto-fill actions
  Calls: `bulkAutoFillFromPredictions` (via internal dialog, QT only)
  Tests:
  - renders `statusText` from variant descriptor
  - renders chip when `chip` is defined; omits chip when undefined
  - action button always has `color="primary"` `variant="contained"` for primary action
  - secondary action button has `color="primary"` `variant="outlined"`
  - applies `success.50` background for `success` tone
  - applies `error.50` background for `deadlineNow` tone
  - renders `message` text when defined; omits when undefined
  - renders `pointsBadge` chip when defined; omits when undefined
  - renders boosts row when `boosts` defined; omits when undefined

---

### `app/components/prediction-status-header/games-header-variant.ts` *(new)*

- **`computeGamesHeaderVariant(input: GamesHeaderInput, t: TFunction): StatusHeaderVariant`**
  Pure function. Evaluates priority order: tournament-finished → urgent-unpredicted → pre-groups-complete-nudge-qt → pre-tournament → stage-active-caught-up.
  Calls: `deriveStageLabel`, `getGameUrgencyLevel`, `getNextBatchSummary`, `collapsePlayoffDenominator`
  Tests:
  - returns `tournament-finished` variant when all games have results (`completedGames === totalGames` AND all `game_date` in past)
  - returns `urgent-unpredicted` with `deadlineNow` tone when unpredicted game starts in < 2h
  - returns `urgent-unpredicted` with `deadlineUrgent` when < 24h
  - returns `urgent-unpredicted` with `deadlineSoon` when < 48h
  - returns `pre-groups-complete-nudge-qt` when groups 100% predicted AND QT open AND QT incomplete
  - returns `pre-tournament` with `Empezar` action when `tournamentStartDate > now` AND 0 group games predicted
  - returns `pre-tournament` with `Seguir` action when some groups predicted
  - returns `stage-active-caught-up` with next-batch summary text when no urgency and tournament active
  - `boosts` object included when `silverMax > 0 OR goldenMax > 0`
  - `boosts` is `undefined` when `silverMax === 0 AND goldenMax === 0`
  - `boosts` included when only `silverMax > 0` (goldenMax = 0)
  - stage label `"Grupos"` when most recent game is a group game (date-based)
  - stage label `"Finalizado"` when all games are in the past (date-based)

- **`deriveStageLabel(games: ExtendedGameData[], now: Date): string | undefined`**
  Derives the current tournament stage from game dates using stage interval logic. Final and Third-place games (identified by `is_final`/`is_third_place` on `playoffStage`) are merged into one "Finals" bucket labeled with the Final round's `round_name`. Returns the label for the stage whose interval contains `now`, `"Finalizado"` if past all stages, `"Grupos"` if pre-tournament, `undefined` for empty input.
  Tests:
  - returns `"Grupos"` when `now` is within the group games date range
  - returns `"Grupos"` when `now` is before the first group game (pre-tournament)
  - returns playoff round name when `now` falls in that round's interval
  - returns Final round name when `now` falls in the Finals bucket (Final + Third-place merged)
  - returns Final round name when `now` falls in Finals bucket and tournament has no Third-place game
  - returns `"Finalizado"` when `now` is past the last game of the last stage
  - returns `undefined` for empty games array

- **`getNextBatchSummary(games: ExtendedGameData[], now: Date, t: TFunction): string`**
  Returns "N partidos hoy/mañana/en D días" from soonest upcoming game date.
  Tests:
  - returns today label when soonest game is today
  - returns tomorrow label when soonest game is tomorrow
  - returns "en N días" for further games

- **`collapsePlayoffDenominator(playoffRoundsCompletion: Record<string, PlayoffRoundCompletionData>): Record<string, PlayoffRoundCompletionData>`**
  Merges Final and Third-place rounds (identified by `is_final` / `is_third_place` flags on `PlayoffRoundCompletionData`) into a single slot for chip display. Does NOT use `round_order` ranking — some tournaments have no Third-place round.
  Tests:
  - merges Final and Third-place round counts into one slot when both exist
  - leaves other rounds (R16, QF, SF) unchanged
  - returns single Final slot unchanged when tournament has no Third-place round (no `is_third_place` entry)
  - handles input where Third-place entry has `total = 0` (no games assigned yet)
  - returns empty object when input is empty

- **`GamesHeaderInput`** interface: `{ completion: TournamentPredictionCompletion; games: ExtendedGameData[]; urgentGames: ExtendedGameData[]; gameGuesses: Record<string, GameGuess>; teamsMap: Record<string, Team>; tournamentId: string; gamePointsEarned?: number; locale: string; now?: Date }`
  - `games` — full game list (all rounds); used by `deriveStageLabel` to determine current tournament phase from dates
  - `urgentGames` — games closing soon (already filtered); used for urgent-unpredicted message and urgency level

**Note on message computation:** For the `urgent-unpredicted` variant, `computeGamesHeaderVariant` uses `urgentGames`, `gameGuesses`, and `teamsMap` to build the game list text (team names + countdown) and sets it as `variant.message`. No game data is passed through `PredictionStatusHeader` props — the component simply renders `variant.message` as `white-space: pre-line` text.

---

### `app/components/prediction-status-header/qt-header-variant.ts` *(new)*

- **`computeQTHeaderVariant(input: QTHeaderInput, t: TFunction): StatusHeaderVariant`**
  Pure function. Priority: never-filled-locked → locked-with-results → locked-pending → completed-pre-lock → lock-window-urgent → pre-tournament-auto-fill-ready → pre-tournament-urgent → pre-tournament.
  Calls: `computeQTLockUrgency`
  Tests:
  - returns `never-filled-locked` when `isLocked AND qualifiersCompleted === 0`
  - returns `locked-with-results` (complete sub-state) when `definedSoFar === totalQualifiers` AND user has picks
  - returns `locked-with-results` (partial sub-state) when `definedSoFar < totalQualifiers` AND user has picks
  - returns `locked-pending` when locked AND user ≥1 pick AND `definedSoFar === 0`
  - returns `completed-pre-lock` when QT complete AND not locked
  - returns `lock-window-urgent` with `deadlineNow` when lock in < 2h AND QT incomplete
  - returns `pre-tournament-auto-fill-ready` when all group games predicted AND QT open
  - returns `pre-tournament` when groups incomplete AND no urgency
  - `"Auto-completar"` action is primary (`variant="contained"`) in auto-fill-ready and lock-window-urgent
  - `"Recalcular"` action present in completed-pre-lock

- **`computeQTLockUrgency(qtLockAt: Date, now: Date): StatusHeaderTone`**
  Maps time-to-lock to urgency tone. Thresholds are EXCLUSIVE (< 2h means strictly less than 2 hours).
  Tests:
  - returns `deadlineNow` when `(qtLockAt - now) < 2h`
  - returns `deadlineNow` at exactly 1h59m59s remaining
  - returns `deadlineUrgent` at exactly 2h remaining (boundary — not deadlineNow)
  - returns `deadlineUrgent` when `< 24h` AND `>= 2h`
  - returns `deadlineSoon` when `< 48h` AND `>= 24h`
  - returns `brand` when `>= 48h`

- **`QTHeaderInput`** interface: `{ isLocked: boolean; qtLockAt: Date | null; predictedGroupGames: number; totalGroupGames: number; qualifiersCompleted: number; qualifiersTotal: number; definedSoFar: number; correctSoFar: number; qtPointsEarned?: number; onAutoFillClick: () => void; tournamentId: string; locale: string; now?: Date }`

---

### `app/components/prediction-status-header/awards-header-variant.ts` *(new)*

- **`computeAwardsHeaderVariant(input: AwardsHeaderInput, t: TFunction): StatusHeaderVariant`**
  Pure function. Priority: never-filled-locked → locked-with-results → locked-pending → completed-pre-lock → pre-tournament.
  Calls: `computeAwardsActionLabel`
  Tests:
  - returns `never-filled-locked` when `isLocked AND awardsCompleted === 0`
  - returns `locked-with-results` (complete) when `decidedSoFar === totalAwards` AND user has picks
  - returns `locked-pending` when locked AND user ≥1 pick AND `decidedSoFar === 0`
  - returns `completed-pre-lock` when complete AND not locked
  - returns pre-tournament with `deadlineNow` tone when lock in < 2h AND incomplete
  - action label is `Definir` at 0 picks, `Continuar` mid, `Finalizar` near complete

- **`computeAwardsActionLabel(awardsCompleted: number, awardsTotal: number, t: TFunction): string`**
  Returns `Definir` / `Continuar` / `Finalizar` based on progress.
  Tests:
  - returns "Definir" at 0 completed
  - returns "Continuar" in mid progress
  - returns "Finalizar" at N-1 or close to N

- **`AwardsHeaderInput`** interface: `{ isLocked: boolean; awardsLockAt: Date | null; awardsCompleted: number; awardsTotal: number; decidedSoFar: number; correctSoFar: number; awardsPointsEarned?: number; tournamentId: string; locale: string; now?: Date }`

---

## Implementation Waves

### Wave 1 — Data layer extension + types + pure functions (parallel tasks)
1. Extend `PlayoffRoundCompletionData` in `app/db/tables-definition.ts` — add `is_final?: boolean; is_third_place?: boolean`
2. Extend query in `app/db/tournament-prediction-completion-repository.ts` — add `'is_final'`, `'is_third_place'` to playoff rounds `.select(...)`, propagate into completion object
3. `types.ts` + `index.ts`
4. `games-header-variant.ts` (including `deriveStageLabel`, `getNextBatchSummary`, `collapsePlayoffDenominator`)
5. `qt-header-variant.ts` (including `computeQTLockUrgency`)
6. `awards-header-variant.ts` (including `computeAwardsActionLabel`)

**CODE-STRUCTURE files to update:** `components-tournament-games.md` — update after Wave 1 when the new module is established.

### Wave 2 — Presentational component
5. `prediction-status-header.tsx` — all tone styles, internal auto-fill dialog, boosts/chips/points rendering

**CODE-STRUCTURE files to update:** `components-tournament-games.md` — add `PredictionStatusHeader` entry.

### Wave 3 — Translation keys
6. Add `predictions.statusHeader.*` keys to `locales/en/predictions.json` and `locales/es/predictions.json`
   Coverage: all variant status texts, chip labels, action labels, message bodies, points badge format

### Wave 4 — Server-side data threading (parallel tasks)
7. `unified-games-page.tsx` — add `getUserGameStats` call; add `gamePointsEarned` to `UnifiedGamesPageClient` props and thread down to `computeGamesHeaderVariant`
8. Check if `getUserGameStats` exists or if I need to use a different function (look at stats page: `userGameStats.group_score + playoff_score`)

### Wave 5 — Page integrations (parallel tasks)
9. `unified-games-page-client.tsx` — remove `CompactPredictionDashboard`, add `PredictionStatusHeader` with `computeGamesHeaderVariant`
10. `qualified-teams-client-page.tsx` — remove `CompactPredictionDashboard` + `QTActionBanner`, add `PredictionStatusHeader` with `computeQTHeaderVariant`
11. `award-panel.tsx` — remove `CompactPredictionDashboard`, add `PredictionStatusHeader` with `computeAwardsHeaderVariant`; thread `individual_awards_score`

**CODE-STRUCTURE files to update after Wave 5:** `components-tournament-games.md`, `components-leaderboard-stats.md`, `CODE-STRUCTURE.md` call graph.

### Wave 6 — Tests (parallel with haiku subagents)
12. `games-header-variant.test.ts`
13. `qt-header-variant.test.ts`
14. `awards-header-variant.test.ts`
15. `prediction-status-header.test.tsx`

### Wave 7 — Cleanup
16. Delete `app/components/qualified-teams/qt-action-banner.tsx`
17. Final `CODE-STRUCTURE.md` updates

---

## Testing Strategy

**Unit tests (Vitest) on pure variant selectors:**
- All 7 Games variants with edge cases (0 boosts, 0 predictions, all stages, playoff grouping)
- All 8 QT variants with urgency tier escalation
- All 5 Awards variants with action label Definir/Continuar/Finalizar
- `getNextBatchSummary` with today/tomorrow/N-days cases

**Component render tests:**
- `PredictionStatusHeader` — tone → background, chip rendering, action button `color="primary"`, points badge, boosts, message text rendering

**Coverage target:** ≥80% on all new files.

**No regressions expected in:**
- `CompactPredictionDashboard` (kept, onboarding demo)
- `PredictionStatusBar` (kept, playoff page)

---

## Translation Keys Required

New `statusHeader` namespace in `predictions.json`:

```json
"statusHeader": {
  "games": {
    "preTournament": {
      "status": "Kickoff en {days, plural, one {1 día} other {{days} días}}",
      "message": "Completá los partidos de grupos antes del inicio. Después podés auto-completar los clasificados.",
      "ctaStart": "Empezar", "ctaContinue": "Seguir", "ctaFinish": "Finalizar"
    },
    "urgentUnpredicted": {
      "status": "{count, plural, one {{count} partido} other {{count} partidos}} sin predecir cierra{count, plural, one {} other {n}} en < {window}",
      "boostTail": "¿Le metés boost?",
      "ctaSingle": "Predecilo", "ctaMultiple": "Predecir"
    },
    "nudgeQT": {
      "status": "Grupos completos · Clasificados cierran en {countdown}",
      "message": "Grupos al 100%. Ya podés auto-completar tus clasificados.",
      "cta": "Ir a Clasificados"
    },
    "stageActive": {
      "statusToday": "{count, plural, one {1 partido hoy} other {{count} partidos hoy}}",
      "statusTomorrow": "{count, plural, one {1 partido mañana} other {{count} partidos mañana}}",
      "statusDays": "{count, plural, one {1 partido en {days} días} other {{count} partidos en {days} días}}",
      "cta": "Revisar"
    },
    "finished": {
      "status": "Torneo finalizado · {correct} / {total} aciertos",
      "message": "Mirá cómo te fue y compará con tus grupos.",
      "ctaStats": "Mis estadísticas", "ctaGroups": "Mis grupos"
    },
    "stageFinalizado": "Finalizado",
    "stageGrupos": "Grupos"
  },
  "qt": {
    "preTournament": { "status": "Predecí quién clasifica", "message": "Elegí manualmente o predecí los partidos primero.", "cta": "Predecir Partidos" },
    "autoFillReady": { "status": "Grupos listos · auto-completá tus clasificados", "message": "Tus grupos están listos — auto-completá tus {total} clasificados en un toque o elegí manualmente acá abajo.", "cta": "Auto-completar" },
    "lockWindowUrgent": { "status": "Clasificados cierran en {countdown}", "message": "Tus clasificados cierran en {countdown}. Auto-completá desde tus grupos o elegí manualmente.", "cta": "Auto-completar" },
    "completedPreLock": { "status": "Clasificados listos · cierran en {countdown}", "cta": "Recalcular" },
    "lockedPending": { "status": "Bloqueado · Fase de grupos en juego" },
    "lockedPartial": { "status": "Bloqueado · {correct} / {total} aciertos hasta ahora" },
    "lockedComplete": { "status": "Bloqueado · {correct} / {total} aciertos", "message": "Mirá cómo te fue y compará con tus grupos.", "ctaStats": "Mis estadísticas", "ctaGroups": "Mis grupos" },
    "neverFilled": { "status": "Bloqueado · no completaste a tiempo", "detail": "Sin puntos por clasificados" }
  },
  "awards": {
    "preTournament": { "message": "Elegí podio y premios individuales. Pensá en los equipos que predijiste pasar a la final.", "ctaStart": "Definir", "ctaContinue": "Continuar", "ctaFinish": "Finalizar" },
    "completedPreLock": { "status": "Premios listos · cierran en {countdown}" },
    "lockedPending": { "status": "Bloqueado · esperando resultados" },
    "lockedPartial": { "status": "Bloqueado · {correct} / {total} aciertos hasta ahora" },
    "lockedComplete": { "status": "Bloqueado · {correct} / {total} aciertos", "message": "Mirá cómo te fue y compará con tus grupos.", "ctaStats": "Mis estadísticas", "ctaGroups": "Mis grupos" },
    "neverFilled": { "status": "Bloqueado · no completaste a tiempo", "detail": "Sin puntos por premios" }
  },
  "chipLabel": {
    "partidos": "{predicted} / {total} partidos",
    "clasificados": "{predicted} / {total} clasificados",
    "premios": "{predicted} / {total} premios"
  }
}
```

(ES translations mirror the above in Spanish.)

---

## Validation

**SonarCloud quality gates:**
- 0 new issues of any severity
- ≥80% coverage on new files
- No hardcoded hex/rgba in new components
- No circular dependency from `prediction-status-header` importing from page components

**Manual verification:**
1. Open Games page pre-tournament → see kickoff countdown + Empezar/Seguir/Finalizar
2. Open Games page with urgency → see colored tint + game list expansion
3. Open QT page with groups complete → see Auto-completar in header (no standalone banner below)
4. Open Awards page → see Definir/Continuar/Finalizar action
5. Verify all text renders correctly in ES locale (switch locale in URL)
6. Verify no custom colors in computed styles

**Deploy to Vercel Preview for user testing.**

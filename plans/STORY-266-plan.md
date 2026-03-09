# Plan: [UX] Winner Highlighting in Game Cards and Results Pages #266

## Context

Currently, completed games show scores but provide no visual cue to distinguish the winner from
the loser. The playoff bracket has a winner-highlight pattern (`primary.main` color) that is
inconsistent with the rest of the app. This story introduces "C2" winner styling (bold winner,
dimmed loser) consistently across all result-showing surfaces, and updates the bracket card from
its current `primary.main` style to C2.

**C2 Rule:**
- **Winner** → `fontWeight: 700` + `color: text.primary`
- **Loser** → `fontWeight: 400` + `color: text.secondary`
- **Draw / no result** → both unchanged — pass no winner props (or both false); existing default
  styling is preserved. No loser dimming when there is no winner.

---

## Files to Modify

| File | Change |
|------|--------|
| `app/components/team-score-row.tsx` | Add `homeIsWinner?` / `awayIsWinner?` props + C2 styling |
| `app/components/actual-result-display.tsx` | Derive penalty booleans, compute winner, pass to TeamScoreRow |
| `app/components/compact-game-view-card.tsx` | Inline winner computation for prediction row; actual-result row is handled by ActualResultDisplay |
| `app/components/results-page/minimalistic-games-list.tsx` | Call `getGameWinner` per game, apply C2 sx to name spans |
| `app/components/results-page/bracket-game-card.tsx` | **Color correction only** — replace `primary.main` with C2; extend C2 to score columns |

---

## Implementation Details

### 1. `app/components/team-score-row.tsx`

Add two optional boolean props:
```ts
homeIsWinner?: boolean
awayIsWinner?: boolean
```

Replace current fixed `fontWeight="medium"` on both name Typographys:

```ts
// Home team name Typography sx:
fontWeight: homeIsWinner ? 700 : awayIsWinner ? 400 : 'medium'
color: homeIsWinner ? 'text.primary' : awayIsWinner ? 'text.secondary' : 'inherit'

// Away team name Typography sx:
fontWeight: awayIsWinner ? 700 : homeIsWinner ? 400 : 'medium'
color: awayIsWinner ? 'text.primary' : homeIsWinner ? 'text.secondary' : 'inherit'
```

**State semantics:**
- Draw or game not yet played → both `homeIsWinner` and `awayIsWinner` are false/undefined →
  **no winner props passed** → styling unchanged from today (fontWeight medium, no color override).
  No separate "neutral" case needed; the conditional logic above handles it.

---

### 2. `app/components/actual-result-display.tsx`

Props `homePenaltyScore` and `awayPenaltyScore` arrive as `number | null`. Derive penalty booleans
with an explicit null-safety guard (same pattern as `getGameWinner` in `score-utils.tsx`):

```ts
const homePenaltyWinner =
  typeof homePenaltyScore === 'number' &&
  typeof awayPenaltyScore === 'number' &&
  homePenaltyScore > awayPenaltyScore

const awayPenaltyWinner =
  typeof homePenaltyScore === 'number' &&
  typeof awayPenaltyScore === 'number' &&
  awayPenaltyScore > homePenaltyScore

const homeIsWinner =
  homeScore > awayScore ||
  (homeScore === awayScore && homePenaltyWinner)

const awayIsWinner =
  awayScore > homeScore ||
  (homeScore === awayScore && awayPenaltyWinner)
```

Pass `homeIsWinner` and `awayIsWinner` to `<TeamScoreRow>`.

---

### 3. `app/components/compact-game-view-card.tsx`

This component renders **two separate TeamScoreRow instances**:
1. **Prediction row** (line ~315): shows user's predicted scores — winner computed here
2. **Actual result row** via `<ActualResultDisplay>` (line ~337): shows actual game scores —
   winner computation is handled **inside ActualResultDisplay** (see §2), not passed down from
   `CompactGameViewCard`

For the **prediction row** only: inline winner computation (team IDs not available here, so
`getGuessWinner` from `score-utils.tsx` cannot be used directly):

```ts
let predictionHomeIsWinner = false
let predictionAwayIsWinner = false

if (specificProps.isGameGuess && hasResult) {
  const h = homeScore!
  const a = awayScore!
  if (h > a) {
    predictionHomeIsWinner = true
  } else if (a > h) {
    predictionAwayIsWinner = true
  } else if (specificProps.homePenaltyWinner) {
    predictionHomeIsWinner = true
  } else if (specificProps.awayPenaltyWinner) {
    predictionAwayIsWinner = true
  }
  // Equal + no penalty flag = draw → both remain false → no C2 applied
}
```

Pass `homeIsWinner={predictionHomeIsWinner}` and `awayIsWinner={predictionAwayIsWinner}` to
the prediction `<TeamScoreRow>` (no changes to the `<ActualResultDisplay>` call site).

---

### 4. `app/components/results-page/minimalistic-games-list.tsx`

Import from `@/app/utils/score-utils` (file is `score-utils.tsx`):
```ts
import { getGameWinner } from '@/app/utils/score-utils'
```

Per game:
```ts
const winner = getGameWinner(game)
const homeIsWinner = !!winner && winner === game.home_team
const awayIsWinner = !!winner && winner === game.away_team
```

Apply C2 `sx` to the home and away `Box component="span"` elements:
```tsx
// Home span sx — add:
fontWeight: homeIsWinner ? 700 : awayIsWinner ? 400 : 'inherit',
color: homeIsWinner ? 'text.primary' : awayIsWinner ? 'text.secondary' : 'inherit',

// Away span sx — add:
fontWeight: awayIsWinner ? 700 : homeIsWinner ? 400 : 'inherit',
color: awayIsWinner ? 'text.primary' : homeIsWinner ? 'text.secondary' : 'inherit',
```

---

### 5. `app/components/results-page/bracket-game-card.tsx`

**This is a color correction only.** The component already calls `getGameWinner` and derives
`homeIsWinner`/`awayIsWinner` booleans. The only change is replacing the winner color token and
adding loser dimming + extending C2 to score columns.

**Team name Typography — replace current `color: homeIsWinner ? 'primary.main' : 'text.primary'`:**
```ts
// Home name:
color: homeIsWinner ? 'text.primary' : awayIsWinner ? 'text.secondary' : 'text.primary'
fontWeight: homeIsWinner ? 700 : 400  // unchanged — winner was already 700

// Away name:
color: awayIsWinner ? 'text.primary' : homeIsWinner ? 'text.secondary' : 'text.primary'
fontWeight: awayIsWinner ? 700 : 400  // unchanged
```

**Score Typography — extend C2:**
```ts
// Home score:
fontWeight: homeIsWinner ? 700 : awayIsWinner ? 400 : 500  // 500 = current neutral
color: homeIsWinner ? 'text.primary' : awayIsWinner ? 'text.secondary' : 'text.primary'

// Away score:
fontWeight: awayIsWinner ? 700 : homeIsWinner ? 400 : 500
color: awayIsWinner ? 'text.primary' : homeIsWinner ? 'text.secondary' : 'text.primary'
```

**No-result state** (both `homeIsWinner` and `awayIsWinner` false — game not yet played):
- Both names: `color: 'text.primary'`, `fontWeight: 400` → no dimming, no `primary.main`
- Both scores: `color: 'text.primary'`, `fontWeight: 500` → neutral, unchanged from today

---

## Testing Strategy

**`__tests__/components/team-score-row.test.tsx`** — add:
- `homeIsWinner=true` → home name `fontWeight: 700`; away name `color: text.secondary`
- `awayIsWinner=true` → away name `fontWeight: 700`; home name `color: text.secondary`
- Neither prop set → both names retain default `fontWeight: medium`; no `text.secondary`

**`__tests__/components/actual-result-display.test.tsx`** — add:
- Home win (2-1): homeIsWinner=true reflected in output
- Away win (0-3): awayIsWinner=true reflected in output
- Draw (1-1, homePenaltyScore=null): neither flag → no C2 styling
- Penalty home winner (1-1 regular, homePenaltyScore=4, awayPenaltyScore=3): homeIsWinner=true

**`__tests__/components/compact-game-view-card.test.tsx`** — add (for prediction row):
- Predicted home win (2-0): prediction TeamScoreRow gets `homeIsWinner=true`
- Predicted away win (0-1): prediction TeamScoreRow gets `awayIsWinner=true`
- Predicted draw (1-1, no penalty bools): no winner props
- No prediction (scores undefined): no winner props
- Draw with homePenaltyWinner=true: `predictionHomeIsWinner=true`

**`__tests__/components/results-page/minimalistic-games-list.test.tsx`** — add:
- Home winner game: home span `fontWeight: 700`; away span `color: text.secondary`
- Away winner game: away span `fontWeight: 700`; home span `color: text.secondary`
- Draw game: both spans use inherited styling

**`__tests__/components/results-page/bracket-game-card.test.tsx`** — add:
- Home winner: home name + score highlighted (`text.primary`/bold); away name + score dimmed
- Away winner: away name + score highlighted; home name + score dimmed
- No result: neither team has `text.secondary` or `primary.main`
- Penalty winner (1-1, home pen): home team highlighted per C2

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Game Card prediction row**: `CompactGameViewCard` → inline winner computation → passes `homeIsWinner`/`awayIsWinner` to prediction `TeamScoreRow`
- **Game Card actual result row**: `ActualResultDisplay` → inline winner derivation → passes to `TeamScoreRow` (independent of CompactGameViewCard)
- **Group Stage Results**: `MinimalisticGamesList` now calls `getGameWinner` → C2 sx on spans
- **Playoff Bracket**: `BracketGameCard` keeps existing `getGameWinner` → color token updated + scores extended

---

### `app/components/team-score-row.tsx` *(modified)*

- **TeamScoreRow({ homeTeamName, awayTeamName, homeScore, awayScore, homeIsWinner?, awayIsWinner?, ... })**: `JSX.Element`
  Adds optional boolean props. C2: winner → bold + text.primary, loser → normal + text.secondary.
  Both undefined/false (draw or no result) → existing defaults unchanged.
  Calls: getThemeLogoUrl
  Tests:
  - homeIsWinner=true → home fontWeight 700, away color text.secondary
  - awayIsWinner=true → away fontWeight 700, home color text.secondary
  - neither prop set → both retain fontWeight medium, no text.secondary applied

---

### `app/components/actual-result-display.tsx` *(modified)*

- **ActualResultDisplay({ homeScore, awayScore, homePenaltyScore, awayPenaltyScore, ... })**: `JSX.Element`
  Derives penalty winner booleans via `typeof` guard. Computes homeIsWinner/awayIsWinner inline.
  Calls: none (inline)
  Tests:
  - home win (2-1): winner reflected in team name styling
  - draw (1-1, no penalties, homePenaltyScore=null): no C2 styling on either team
  - penalty home winner (1-1, homePenaltyScore=4, awayPenaltyScore=3): homeIsWinner applied
  - both penalty scores = 0 (edge case): no winner flagged (neither side wins 0-0 pen)

---

### `app/components/compact-game-view-card.tsx` *(modified)*

- **CompactGameViewCard({ homeScore, awayScore, ...specificProps })**: `JSX.Element`
  Adds prediction winner computation for prediction TeamScoreRow only. Actual result row unchanged
  (ActualResultDisplay manages its own winner). Inline computation — no team IDs available.
  Calls: calculateFinalPoints, calculatePredictionResult
  Tests:
  - predicted home win (2-0): prediction row shows homeIsWinner=true
  - predicted away win (0-1): prediction row shows awayIsWinner=true
  - predicted draw (1-1, no penalties): no winner styling on prediction row
  - penalty draw (1-1, homePenaltyWinner=true): home team highlighted on prediction row

---

### `app/components/results-page/minimalistic-games-list.tsx` *(modified)*

- **MinimalisticGamesList({ games, teamsMap })**: `JSX.Element`
  Calls getGameWinner per game; applies C2 fontWeight and color sx to home/away name spans.
  Calls: formatGameScore, getTeamDescription, getGameWinner
  Tests:
  - home winner: home span fontWeight 700, away span color text.secondary
  - away winner: away span fontWeight 700, home span color text.secondary
  - draw (no penalty winner): both spans use inherit styling

---

### `app/components/results-page/bracket-game-card.tsx` *(modified)*

- **BracketGameCard({ game, teamsMap })**: `JSX.Element`
  Color correction only. Replaces primary.main → text.primary for winners. Adds text.secondary for
  losers. Extends C2 to score Typographys. No-result state → both neutral (text.primary, no dimming).
  Calls: formatPenaltyResult, getGameWinner, getTeamDescription
  Tests:
  - home winner: home name+score text.primary/bold; away name+score text.secondary
  - away winner: away name+score text.primary/bold; home name+score text.secondary
  - no result: neither name/score has text.secondary or primary.main color
  - penalty winner (1-1, home pen): correct team highlighted

---

## Execution Order

1. `team-score-row.tsx` (shared leaf — do first)
2. `actual-result-display.tsx` + `compact-game-view-card.tsx` (parallel — both use TeamScoreRow)
3. `minimalistic-games-list.tsx` + `bracket-game-card.tsx` (parallel — independent)
4. All 5 test files (parallel via subagents)

---

## Implementation Summary

**Status:** ✅ Implemented — commit `b6a6195` on `feature/story-266`

**Implemented exactly as planned.** All 5 files modified per specification:

- `team-score-row.tsx` — Added `homeIsWinner?`/`awayIsWinner?` props; C2 sx applied to both name Typographys (moved `fontWeight` from prop to sx to support conditional logic).
- `actual-result-display.tsx` — Inline penalty winner derivation with `typeof` guard; passes `homeIsWinner`/`awayIsWinner` to TeamScoreRow.
- `compact-game-view-card.tsx` — `predictionHomeIsWinner`/`predictionAwayIsWinner` computed inline; passed to prediction TeamScoreRow only.
- `minimalistic-games-list.tsx` — Imports `getGameWinner`; C2 `fontWeight`/`color` sx added to home/away name spans.
- `bracket-game-card.tsx` — `primary.main` replaced with `text.primary`; loser dimming (`text.secondary`) added to names and scores.

**Tests:** 146 tests passing across all 5 test files (5690 total suite). All new C2 winner/loser/draw scenarios covered.

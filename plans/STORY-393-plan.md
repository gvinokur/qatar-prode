# Story #393 Plan: Qualified Teams — Standings Nudges & Transitions

## Context

Users on the Qualified Teams page have no contextual guidance about what to do next. After completing game predictions, they land on the QT page and aren't prompted to fill in team standings or navigate to the knockout stage. This story bridges the gap by adding a state-based inline banner (placed between the CompactPredictionDashboard and the group cards) that shows the right message and CTA depending on where the user is in the flow.

**Part of Epic #389: Guided Tournament Prediction Flow (Implementation Order: 4)**

---

## Acceptance Criteria

1. **State-Based Banner** — Three states, one displayed at a time:
   - **Incomplete Games**: user has unpredicted group-stage games → message + link to Games page
   - **Games Finished / QTs Missing**: all group games predicted but QT incomplete → message + "Auto-fill from Predictions" button (user knows manual editing is always available)
   - **All Qualifiers Valid**: QT predictions complete → message + link to Awards page (user knows they can still edit)

2. **Auto-fill Bulk Calculation**:
   - One click triggers bulk calculation for all groups at once
   - Override warning dialog shown before overwriting manual placements; dialog confirms user can edit afterwards
   - Logic computes simulated group standings from user's OWN game guesses (predicted scores), NOT from actual tournament results in the DB
   - Third-place qualifier selection: rank all groups' 3rd-place teams by simulated points/GD/GF; top `maxThirdPlace` → qualifies = true
   - Single batch server action saves all groups

3. **Locked/Closed Handling** — When tournament is locked, active CTA is disabled (greyed out)

4. **State is computed server-side** in `page.tsx` — no game data needed in client component for state determination

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/utils/group-standings-calculator.ts` | Pure util: compute group standings from game guesses |
| `app/components/qualified-teams/qt-action-banner.tsx` | New banner component (3 states, receives pre-computed state) |
| `app/components/qualified-teams/__tests__/qt-action-banner.test.tsx` | Component tests |
| `app/utils/__tests__/group-standings-calculator.test.ts` | Unit tests for standings calculator |

## Files to Modify

| File | Change |
|------|--------|
| `app/db/tournament-prediction-completion-repository.ts` | Add `completedGroupGames` + `totalGroupGames` counts |
| `app/db/tables-definition.ts` | Extend `TournamentPredictionCompletion` type with new fields |
| `app/actions/qualification-actions.ts` | Add `bulkAutoFillFromPredictions` server action |
| `app/[locale]/tournaments/[id]/qualified-teams/page.tsx` | Compute `qtBannerState` from `tournamentPredictionCompletion`; pass to client |
| `app/components/qualified-teams/qualified-teams-client-page.tsx` | Accept `qtBannerState` prop; mount banner |
| `locales/en/qualified-teams.json` | Add nudge/banner translation keys |
| `locales/es/qualified-teams.json` | Add nudge/banner translation keys (Spanish) |
| `docs/code-structure/components/components-leaderboard-stats.md` | Add `QTActionBanner` entry |
| `docs/code-structure/actions.md` | Add `bulkAutoFillFromPredictions` entry |
| `docs/code-structure/utils.md` | Add `group-standings-calculator.ts` entry |
| `docs/code-structure/db.md` | Update `tournament-prediction-completion-repository` entry |

---

## Technical Approach

### 1. Banner State (Server-Side, in `page.tsx`)

**No new DB calls or additional data fetches.** The page already calls `getTournamentPredictionCompletion` which we extend with two new fields: `completedGroupGames` and `totalGroupGames`. The banner state is then derived purely from the completion object:

```typescript
// In page.tsx, after fetching tournamentPredictionCompletion:
const isQTComplete =
  (tournamentPredictionCompletion?.qualifiers.total ?? 0) > 0 &&
  qualifiedTeamsCompleted >= (tournamentPredictionCompletion?.qualifiers.total ?? 0);

// qualifiedTeamsCompleted from predictions (already computed):
const qualifiedTeamsCompleted = predictions.filter(p => p.predicted_to_qualify).length;

const hasUnpredictedGroupGames =
  (tournamentPredictionCompletion?.completedGroupGames ?? 0) <
  (tournamentPredictionCompletion?.totalGroupGames ?? 1);

const qtBannerState: QTBannerState =
  hasUnpredictedGroupGames ? 'incomplete-games'
  : !isQTComplete          ? 'games-finished'
  :                          'all-valid';
```

**Extending `TournamentPredictionCompletion` (in `tournament-prediction-completion-repository.ts`):**
Add one SQL query alongside the existing `completedGamesResult` query:
```sql
-- completedGroupGames: group games predicted by this user
SELECT COUNT(*) FROM games
INNER JOIN game_guesses ON game_guesses.game_id = games.id
WHERE games.tournament_id = ? AND games.game_type = 'group'
  AND game_guesses.user_id = ?
  AND game_guesses.home_score IS NOT NULL
  AND game_guesses.away_score IS NOT NULL

-- totalGroupGames: total group games in tournament
SELECT COUNT(*) FROM games
WHERE games.tournament_id = ? AND games.game_type = 'group'
```

Return these two values in `TournamentPredictionCompletion` and the `completedGroupGames` / `totalGroupGames` type fields.

Type: `export type QTBannerState = 'incomplete-games' | 'games-finished' | 'all-valid'`

### 2. Auto-fill Algorithm (Using User's Game Guesses)

New utility `app/utils/group-standings-calculator.ts`:
- Pure function — no DB, testable in isolation
- Input: group games (home_team_id, away_team_id, game_id) + guess map
- Output: ranked team standings (teamId, position, points, goalDiff, goalsScored)

Standings computation per group:
1. Initialize stats per team: `{ points: 0, goalsFor: 0, goalsAgainst: 0 }`
2. For each group game where a guess exists:
   - Win → 3pts to winner, 0 to loser
   - Draw → 1pt each
   - Goal difference and goals scored tracked per team
3. Sort: points DESC → goal difference DESC → goals scored DESC → alphabetical
4. Position = rank index + 1 (1-indexed)
5. Skip any game without a guess (treat as 0-0, or simply exclude from calc)

For 3rd-place qualification selection:
- Collect one 3rd-place team per group (position 3 in standings)
- Rank all 3rd-place teams by: points DESC → goal difference DESC → goals scored DESC
- Top `maxThirdPlace` → `predicted_to_qualify = true`

### 3. `bulkAutoFillFromPredictions` Server Action

New function in `app/actions/qualification-actions.ts`:

```typescript
export async function bulkAutoFillFromPredictions(
  tournamentId: string,
  locale: Locale = 'es'
): Promise<{ success: boolean; message: string; groupsProcessed: number }>
```

Algorithm:
1. Auth + lock check
2. Fetch all groups with their teams for the tournament
3. Fetch all group-stage games for the tournament (with `home_team`, `away_team`, `group_id` via `tournament_group_games` join)
4. Fetch user's game guesses (`findGameGuessesByUserId`)
5. For each group: call `computeGroupStandingsFromGuesses(groupGames, guessMap)` → sorted rankings
6. If ANY group has fewer guesses than its game count (incomplete predictions), ABORT the entire operation — return an error. It's all-or-nothing: either all groups can be computed, or none are saved.
7. Collect all 3rd-place teams across groups; rank and select top `maxThirdPlace` as qualifiers
8. For each processed group: call `upsertGroupPositionsPrediction(userId, tournamentId, groupId, positions)`
9. After all groups: call `updatePlayoffGameGuesses(tournamentId, { id: userId })`
10. `revalidatePath` for the QT page
11. Return `{ success: true, groupsProcessed: N }`

---

## Visual Prototypes

### State 1: Incomplete Games

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠  Group stage games are still incomplete.                  │
│                              [Complete group games  →]       │
└──────────────────────────────────────────────────────────────┘
```

Color: `warning.main` left border (4px), `warning.light` background tint.
Button: `variant="outlined"` `color="warning"`, Link to `/{locale}/tournaments/{id}/games`

### State 2: Games Finished / QTs Missing

```
┌──────────────────────────────────────────────────────────────┐
│  ✓  All game predictions are in!                              │
│     Want to auto-fill standings from your predictions?       │
│     You can still edit manually afterwards.                  │
│                      [Auto-fill from Predictions →]          │
└──────────────────────────────────────────────────────────────┘
```

Color: `info.main` left border, `info.light` background tint.
Button: `variant="contained"` `color="info"`, onClick triggers confirm dialog.
If `isLocked`: button disabled + tooltip "Predictions are locked".

#### Confirm Dialog:
```
┌──────────────────────────────────────────────────┐
│  Auto-fill Standings from Predictions            │
│                                                  │
│  Your group standings will be calculated from   │
│  your predicted game scores. Any manual team    │
│  placements will be overwritten.                │
│                                                  │
│  You can adjust the results afterwards at any   │
│  time.                                           │
│                                                  │
│              [Cancel]   [Auto-fill]              │
└──────────────────────────────────────────────────┘
```

### State 3: All Qualifiers Valid

```
┌──────────────────────────────────────────────────────────────┐
│  ✓  Your bracket is ready for the knockout stage.            │
│     Feel free to come back and adjust any time.              │
│                                        [Go to Awards  →]     │
└──────────────────────────────────────────────────────────────┘
```

Color: `success.main` left border, `success.light` background tint.
Button: `variant="outlined"` `color="success"`, Link to `/{locale}/tournaments/{id}/awards`

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 4 (QT prediction flow)** — extend `QualifiedTeamsPage` (server) to compute `qtBannerState` and pass to `QualifiedTeamsClientPage` → `QualifiedTeamsUI` → `QTActionBanner`; banner calls `bulkAutoFillFromPredictions` action on user confirm + calls `router.refresh()` on success.

**New flows:**
- none (modification of existing Flow 4)

---

### `app/utils/group-standings-calculator.ts` *(new)*

**New functions:**

- **computeGroupStandingsFromGuesses(groupGames: GroupGame[], guessMap: Record\<string, { home_score: number | null; away_score: number | null }\>)**: `TeamStanding[]`
  Pure utility. Computes simulated group standings from user's predicted game scores. For each game with a valid guess: distributes points (3/1/0), accumulates goals for/against per team. Returns teams sorted by points DESC → goal difference DESC → goals scored DESC → team ID alphabetical. Teams with no played games appear at end sorted alphabetically. Skips games where home_score or away_score is null.
  Tests:
  - sorts by points descending
  - applies goal difference as tiebreaker when points are equal
  - applies goals scored as secondary tiebreaker
  - skips games without a guess (no score in guessMap)
  - handles a group where all games are draws
  - handles a group where one team wins all games

**Interfaces:**
```typescript
export interface GroupGame {
  id: string;
  home_team: string;
  away_team: string;
}

export interface TeamStanding {
  teamId: string;
  position: number; // 1-indexed
  points: number;
  goalDiff: number;
  goalsFor: number;
}
```

---

### `app/actions/qualification-actions.ts` *(modified)*

**New functions:**

- **bulkAutoFillFromPredictions(tournamentId: string, locale: Locale)**: `Promise<{ success: boolean; message: string; groupsProcessed: number }>`
  Server Action. Computes simulated group standings from the authenticated user's game guesses and saves them as QT predictions for all groups. All-or-nothing: if ANY group has incomplete game predictions, the entire operation fails with an error and nothing is saved. Selects top `maxThirdPlace` 3rd-place teams by simulated performance as qualifiers.
  Calls: getLoggedInUser, findGameGuessesByUserId, computeGroupStandingsFromGuesses, upsertGroupPositionsPrediction, updatePlayoffGameGuesses
  Tests:
  - returns unauthorized error when no active session
  - returns locked error when tournament is not active
  - returns error and saves nothing when any group has incomplete game predictions
  - sets predicted_to_qualify=true for positions 1 and 2
  - selects top maxThirdPlace 3rd-place teams by simulated performance
  - calls updatePlayoffGameGuesses after all upserts
  - returns groupsProcessed count equal to total number of groups

---

### `app/db/tournament-prediction-completion-repository.ts` *(modified)*

**Changed functions:**

- **getTournamentPredictionCompletion(userId, tournamentId, tournament)** — adds two parallel DB queries alongside the existing `completedGamesResult` query to count group-stage game completions specifically. Returns extended `TournamentPredictionCompletion` with `completedGroupGames: number` and `totalGroupGames: number`.
  Calls: (same as before, plus 2 new parallel DB count queries run in Promise.all)
  Tests:
  - returns completedGroupGames=0 when user has no group game guesses
  - returns completedGroupGames equal to number of group games with scores
  - returns totalGroupGames equal to total group game count regardless of guesses

### `app/[locale]/tournaments/[id]/qualified-teams/page.tsx` *(modified)*

**Changed functions:**

- **QualifiedTeamsPage(props)** — derives `qtBannerState: QTBannerState` from the extended completion object (`completedGroupGames`, `totalGroupGames`, `qualifiers`). No new DB calls. Passes `qtBannerState` to `QualifiedTeamsClientPage`.
  Calls: (no new cross-layer calls — uses already-fetched completion data)
  Tests: (page is a server component; tested by verifying the state prop is computed correctly in the existing page test file via mocked DB responses)

---

### `app/components/qualified-teams/qt-action-banner.tsx` *(new)*

**New components:**

- **QTActionBanner(props: QTActionBannerProps)**: `JSX.Element | null`
  Client component. Renders the banner for the given pre-computed `bannerState`. Shows confirmation dialog for auto-fill. Calls `router.refresh()` after successful auto-fill. Returns null when `bannerState` is undefined or falsy.
  Props: bannerState (QTBannerState), tournamentId (string), isLocked (boolean)
  Calls: bulkAutoFillFromPredictions (server action)
  Tests:
  - renders incomplete-games state
  - renders games-finished state with auto-fill button
  - renders all-valid state
  - disables auto-fill button when isLocked
  - shows confirm dialog before calling action
  - does not call action when confirm dialog is cancelled
  - calls router.refresh() after successful auto-fill
  - shows error snackbar when bulkAutoFillFromPredictions returns failure
  - renders null when bannerState is falsy

---

### `app/components/qualified-teams/qualified-teams-client-page.tsx` *(modified)*

**Changed functions:**

- **QualifiedTeamsClientPage(props)** / **QualifiedTeamsUI(props)** — accept new `qtBannerState: QTBannerState` prop; mount `QTActionBanner` between `CompactPredictionDashboard` box and the scrollable content area.
  Calls: (no new cross-layer calls)
  Tests: (existing tests unchanged; banner has its own test file)

---

## Translation Keys to Add

### `locales/en/qualified-teams.json` — add `"nudge"` section:

```json
"nudge": {
  "incompleteGames": {
    "message": "Group stage games are still incomplete.",
    "cta": "Complete group games"
  },
  "gamesFinished": {
    "message": "All game predictions are in! Want to auto-fill standings from your predictions?",
    "note": "You can still edit manually afterwards.",
    "cta": "Auto-fill from Predictions"
  },
  "allValid": {
    "message": "Your bracket is ready for the knockout stage.",
    "note": "Feel free to come back and adjust any time.",
    "cta": "Go to Awards"
  },
  "autoFillDialog": {
    "title": "Auto-fill Standings from Predictions",
    "body": "Your group standings will be calculated from your predicted game scores. Any manual team placements will be overwritten.",
    "note": "You can adjust the results afterwards at any time.",
    "confirm": "Auto-fill",
    "cancel": "Cancel"
  },
  "autoFillError": "Failed to auto-fill standings. Please try again."
}
```

---

## Testing Strategy

### Unit Tests: `group-standings-calculator.ts`
- Pure function — no mocks needed
- Use hard-coded game arrays and guess maps
- Cover sorting logic, ties, skipped games, edge cases

### Unit Tests: `getTournamentPredictionCompletion` (extended)
- Extend existing tests to verify `completedGroupGames` and `totalGroupGames` fields
- Mock `db` queries using project DB mock pattern

### Unit Tests: `bulkAutoFillFromPredictions`
- Mock `db` queries using project DB mock pattern (`vi.mocked`)
- Mock `getLoggedInUser`, `findGameGuessesByUserId`, `upsertGroupPositionsPrediction`, `updatePlayoffGameGuesses`
- Use `testFactories` to create mock tournament, group, and game objects
- Verify all-or-nothing: no `upsertGroupPositionsPrediction` calls when any group is incomplete
- Verify correct third-place selection logic
- Verify `updatePlayoffGameGuesses` called exactly once after all saves

### Component Tests: `QTActionBanner`
- Use `renderWithTheme` test utility
- Use `testFactories` for mock tournament and prediction data
- Mock `bulkAutoFillFromPredictions` server action
- Mock `useRouter` from next/navigation
- Test all states, locked state, dialog flow, error handling

---

## Verification

1. `npm run dev`
2. Navigate to Qualified Teams page on a test tournament
3. Verify all 3 banner states render correctly based on game prediction status
4. Test auto-fill: click "Auto-fill from Predictions" → confirm dialog → standings populate based on your predicted game scores
5. Verify lock state disables CTA
6. Verify manual edits work normally after auto-fill
7. `npm run test -- qualified` + `group-standings`
8. `npm run lint && npm run build`

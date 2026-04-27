# Story #393 Plan: Qualified Teams — Standings Nudges & Transitions

## Context

Users on the Qualified Teams page have no contextual guidance about what to do next. After completing game predictions, they land on the QT page and aren't prompted to fill in team standings or navigate to the knockout stage. This story bridges the gap by adding a state-based inline banner (placed between the CompactPredictionDashboard and the group cards) that shows the right message and CTA depending on where the user is in the flow.

**Part of Epic #389: Guided Tournament Prediction Flow (Implementation Order: 4)**

## Acceptance Criteria

1. **State-Based Banner** — Three states, one displayed at a time:
   - **Incomplete Games**: user has unpredicted group-stage games → message + link to Games page
   - **Games Finished / QTs Missing**: all group games predicted but QT incomplete → message + "Auto-fill from Results" button
   - **All Qualifiers Valid**: QT predictions complete → message + link to Awards page

2. **Auto-fill Bulk Calculation**:
   - One click triggers bulk calculation for all groups at once
   - Override warning dialog shown before overwriting manual placements
   - Logic uses actual `tournament_group_teams` positions + `findQualifiedTeams()` for 3rd-place determination
   - Single batch server action saves all groups atomically

3. **Locked/Closed Handling** — When tournament is locked, active CTA is disabled (greyed out)

4. **Reuses** `game-filters.ts` unpredicted-game logic (Story #392) for Incomplete Games state detection

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/components/qualified-teams/qt-action-banner.tsx` | New banner component (3 states) |
| `app/components/qualified-teams/__tests__/qt-action-banner.test.tsx` | Component tests |

## Files to Modify

| File | Change |
|------|--------|
| `app/actions/qualification-actions.ts` | Add `bulkAutoFillQualifiedTeams` server action |
| `app/actions/__tests__/qualification-actions.test.ts` | New or existing test file for bulk action |
| `app/components/qualified-teams/qualified-teams-client-page.tsx` | Mount banner between dashboard and grid |
| `locales/en/qualified-teams.json` | Add nudge/banner translation keys |
| `locales/es/qualified-teams.json` | Add nudge/banner translation keys (Spanish) |
| `docs/code-structure/components/components-leaderboard-stats.md` | Add `QTActionBanner` entry |
| `docs/code-structure/actions.md` | Add `bulkAutoFillQualifiedTeams` entry |

---

## Technical Approach

### Banner State Determination

Computed inside the banner component from props (no new context state needed):

```
hasUnpredictedGroupGames =
  games
    .filter(g => g.game_type === 'group')
    .some(g => { const guess = gameGuessesMap[g.id]; return !guess || guess.home_score == null || guess.away_score == null; })

isQTComplete = qualifiedTeamsCompleted >= (qualifiersTotal ?? 0) && qualifiersTotal > 0

state =
  hasUnpredictedGroupGames   → 'incomplete-games'
  !hasUnpredictedGroupGames && !isQTComplete → 'games-finished'
  !hasUnpredictedGroupGames && isQTComplete  → 'all-valid'
```

Uses `isGamePredictionComplete` (already imported in `qualified-teams-client-page.tsx`) for parity with the compact dashboard's predicted count — but since game guesses here are raw `any[]` (not `GameGuessNew` with penalty fields), the simpler null check above is sufficient for GROUP games (group games never have penalty winners).

### Banner Visual Design

```
┌─────────────────────────────────────────────────────────────┐
│ ℹ Group stage games are still incomplete.                   │
│                               [Complete group games →]      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ✓ Group predictions are complete! Ready to calculate?       │
│                           [Auto-fill from Results →]        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ✓ Your bracket is ready for the knockout stage.             │
│                                  [Go to Awards →]           │
└─────────────────────────────────────────────────────────────┘
```

Use MUI `Paper` with `sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}` and color-coded left border (warning/info/success). Use MUI `Typography` + `Button` (Link for navigation states, onClick for auto-fill state).

Match the existing `StageTransitionBanner` visual language (label + outlined button on right side). Severity colours: `warning` → incomplete games, `info` → games finished, `success` → all valid.

### Override Warning Dialog

When user clicks "Auto-fill from Results":
1. Show MUI `Dialog` with confirmation message
2. On confirm → call `bulkAutoFillQualifiedTeams`, show loading state on button
3. On success → call `router.refresh()` to reload Server Component data (updates predictions in context via re-render)
4. On error → show error Snackbar

### `bulkAutoFillQualifiedTeams` Server Action

New function in `app/actions/qualification-actions.ts`:

```typescript
export async function bulkAutoFillQualifiedTeams(
  tournamentId: string,
  locale: Locale = 'es'
): Promise<{ success: boolean; message: string; groupsProcessed: number }>
```

Algorithm:
1. Auth check (`getLoggedInUser`)
2. Lock check (same logic as `updateGroupPositionsJsonb`)
3. Fetch all groups for the tournament with their teams (ordered by position from `tournament_group_teams`)
4. Call `findQualifiedTeams(tournamentId)` to get actual 3rd-place qualifiers set
5. For each group, build `TeamPositionPrediction[]`:
   - DB position 0-indexed → predicted_position 1-indexed
   - positions 0 & 1 → `predicted_to_qualify = true`
   - position 2 → `predicted_to_qualify = qualifiedTeamIds.has(teamId)` (from actual results)
   - position 3+ → `predicted_to_qualify = false`
   - If group has no actual positions yet (`is_complete = false`), SKIP that group (only auto-fill complete groups)
6. Call `upsertGroupPositionsPrediction(userId, tournamentId, groupId, positions)` per group
7. Call `updatePlayoffGameGuesses(tournamentId, { id: userId })` once after all groups saved
8. `revalidatePath` for the QT page
9. Return `{ success: true, groupsProcessed: N }`

Note: Bypasses the per-group third-place count validation from `updateGroupPositionsJsonb` intentionally — the auto-fill sets exactly what the actual results dictate, guaranteed to be valid.

---

## Visual Prototypes

### State 1: Incomplete Games

```
┌──────────────────────────────────────────────────────────────┐
│  ⚠  Group stage games are still incomplete.                  │
│                              [Complete group games  →]       │
└──────────────────────────────────────────────────────────────┘
[CompactPredictionDashboard above, GroupCards below]
```

Colour: `warning.main` left border (4px), `warning.light` background tint.
Button: `variant="outlined"` with `color="warning"`, Link to `/[locale]/tournaments/[id]/games`

### State 2: Games Finished / QTs Missing

```
┌──────────────────────────────────────────────────────────────┐
│  ✓  Group predictions are complete! Ready to calculate       │
│     standings?              [Auto-fill from Results →]       │
└──────────────────────────────────────────────────────────────┘
```

Colour: `info.main` left border, `info.light` background tint.
Button: `variant="contained"` with `color="info"`, onClick triggers confirm dialog.
If `isLocked`: button disabled with tooltip "Predictions are locked".

#### Confirm Dialog (appears on click):
```
┌─────────────────────────────────────┐
│  Auto-fill from Results             │
│                                     │
│  This will overwrite any manual     │
│  team placements you've made.       │
│  This action cannot be undone.      │
│                                     │
│          [Cancel]  [Auto-fill]      │
└─────────────────────────────────────┘
```

### State 3: All Qualifiers Valid

```
┌──────────────────────────────────────────────────────────────┐
│  ✓  Your bracket is ready for the knockout stage.            │
│                                        [Go to Awards  →]     │
└──────────────────────────────────────────────────────────────┘
```

Colour: `success.main` left border, `success.light` background tint.
Button: `variant="outlined"` with `color="success"`, Link to `/[locale]/tournaments/[id]/awards`

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 4 (QT prediction flow)** — extend `QualifiedTeamsUI` to mount `QTActionBanner` at top of content area; banner calls `bulkAutoFillQualifiedTeams` action on user confirm + calls `router.refresh()` on success.

**New flows:**
- none (modification of existing Flow 4)

---

### `app/actions/qualification-actions.ts` *(modified)*

**New functions:**

- **bulkAutoFillQualifiedTeams(tournamentId: string, locale: Locale)**: `Promise<{ success: boolean; message: string; groupsProcessed: number }>`
  Server Action. Auto-fills QT predictions for the authenticated user by mapping actual tournament group standings to their predictions. Only processes complete groups (is_complete = true). Saves all groups via upsertGroupPositionsPrediction. Calls updatePlayoffGameGuesses after. Returns how many groups were processed.
  Calls: getLoggedInUser, findQualifiedTeams, upsertGroupPositionsPrediction, updatePlayoffGameGuesses, revalidatePath
  Tests:
  - returns unauthorized error when no active session
  - returns locked error when tournament is not active
  - processes only complete groups, skips incomplete ones
  - sets predicted_to_qualify=true for DB positions 0 and 1
  - sets predicted_to_qualify based on actual 3rd-place qualifiers for DB position 2
  - calls updatePlayoffGameGuesses after saving all groups
  - returns groupsProcessed count matching number of complete groups

---

### `app/components/qualified-teams/qt-action-banner.tsx` *(new)*

**New components:**

- **QTActionBanner(props: QTActionBannerProps)**: `JSX.Element | null`
  Client component. Determines banner state from games + predictions data and renders the appropriate message + CTA. Shows confirmation dialog for auto-fill. Calls router.refresh() after successful auto-fill. Returns null when qualifiersTotal is 0 or not available. Button is loading-locked during action to prevent double-submit.
  Props: games (any[]), gameGuessesMap (Map<string, any>), qualifiedTeamsCompleted (number), qualifiersTotal (number | undefined), tournamentId (string), isLocked (boolean), locale (string)
  Tests:
  - renders incomplete-games state when unpredicted group games exist
  - renders games-finished state when group games predicted but QT incomplete
  - renders all-valid state when QT complete
  - disables auto-fill button when isLocked
  - shows confirm dialog before calling action
  - does not call action when confirm dialog is cancelled
  - calls router.refresh() after successful auto-fill
  - shows error snackbar when bulkAutoFillQualifiedTeams returns failure
  - renders null when qualifiersTotal is 0
  - renders incomplete-games state when games array is empty (0 predicted games)
  - renders games-finished state when gameGuessesMap contains only non-group-game entries

---

### `app/components/qualified-teams/qualified-teams-client-page.tsx` *(modified)*

**Changed functions:**

- **QualifiedTeamsUI(props)** — mounts `QTActionBanner` between the `CompactPredictionDashboard` box and the scrollable content area. Passes `gameGuessesMap`, `qualifiedTeamsCompleted`, `qualifiersTotal`, `tournamentId`, `isLocked`, and the current locale to the banner.
  Calls: bulkAutoFillQualifiedTeams (server action), router.refresh (Next.js router)
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
    "message": "Group predictions complete! Ready to calculate standings?",
    "cta": "Auto-fill from Results"
  },
  "allValid": {
    "message": "Your bracket is ready for the knockout stage.",
    "cta": "Go to Awards"
  },
  "autoFillDialog": {
    "title": "Auto-fill from Results",
    "body": "This will overwrite any manual team placements you've already made. This action cannot be undone.",
    "confirm": "Auto-fill",
    "cancel": "Cancel"
  },
  "autoFillError": "Failed to auto-fill standings. Please try again."
}
```

---

## Testing Strategy

### Unit Tests: `bulkAutoFillQualifiedTeams`
- Mock `db` queries using `vi.mocked(db.selectFrom)` with chained mock builder (project pattern: `createMockSelectQuery`)
- Mock `getLoggedInUser`, `findQualifiedTeams`, `upsertGroupPositionsPrediction`, `updatePlayoffGameGuesses`
- Verify correct position mapping (DB 0→ predicted 1, etc.)
- Verify only complete groups are processed (is_complete = true)
- Verify 3rd-place qualification matches actual results
- Verify `updatePlayoffGameGuesses` called exactly once after all upserts

### Component Tests: `QTActionBanner`
- Use `renderWithTheme` test utility
- Use `testFactories` for games and guesses
- Mock `bulkAutoFillQualifiedTeams` server action
- Mock `useRouter` from next/navigation
- Test all 3 banner states + locked state + dialog flow

---

## Verification

1. Start dev server: `npm run dev`
2. Navigate to Qualified Teams page on a test tournament
3. Verify:
   - With unpredicted group games → Incomplete Games banner shows, link navigates to games page
   - With all games predicted but QT incomplete → Games Finished banner shows, click shows confirm dialog
   - On confirm → Loading state, then page refreshes with auto-filled predictions
   - With all QT complete → All Valid banner shows, link navigates to awards
   - With `isLocked=true` → CTA buttons are disabled
4. Run tests: `npm run test -- qualified`
5. Run lint: `npm run lint`
6. Run build: `npm run build`

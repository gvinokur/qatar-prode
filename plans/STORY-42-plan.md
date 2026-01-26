# Plan: Tournament Prediction Completion Tracker (#42)

## Story Context
- **Issue**: #42 [UXI-025]
- **Milestone**: Sprint 7-9: Engagement & Gamification
- **Priority**: High (9/10)
- **Size Estimate**: 2-3 days

## Objective
Add a tournament prediction completion tracker to help users quickly identify which tournament-level predictions (qualifiers, champions, awards) are incomplete, reducing missed predictions by 50% and increasing tournament prediction completion rate by 35%.

## Acceptance Criteria
- [ ] Display tournament prediction completion status
- [ ] Show individual category progress (qualifiers, final standings, awards)
- [ ] Provide overall completion percentage
- [ ] Add visual indicators (checkmarks, badges, or colors) for completed/incomplete sections
- [ ] Include direct links to incomplete prediction sections
- [ ] Match the design pattern from UXI-002 (PredictionStatusBar) for consistency
- [ ] Unit tests for completion calculation logic
- [ ] Responsive design for mobile and desktop

## Technical Approach

### Architecture Pattern
Follow the **UXI-002 PredictionStatusBar pattern** for visual consistency:
- MUI Card container with outlined variant
- LinearProgress bar for overall completion
- Typography for counts/percentages
- Alert components for urgency warnings
- Direct links to action sections

### Data Model

Tournament predictions tracked across 3 categories:

1. **Final Standings** (2-3 items depending on tournament)
   - Champion (`champion_team_id`)
   - Runner-up (`runner_up_team_id`)
   - Third Place (`third_place_team_id`) - **Only if tournament has `has_third_place_game = true`**

2. **Individual Awards** (4 items)
   - Best Player (`best_player_id`)
   - Top Goalscorer (`top_goalscorer_player_id`)
   - Best Goalkeeper (`best_goalkeeper_player_id`)
   - Best Young Player (`best_young_player_id`)

3. **Qualifiers** (dynamic count based on playoff bracket size)
   - Based on **completing all group game predictions** (which auto-calculates group positions and determines qualifiers)
   - Total count = number of teams in first round of playoffs
   - Not directly based on first-round playoff game predictions, but on having all group stage games predicted

**Total**: 6-7 fixed predictions (depending on third place) + N group game predictions for qualifiers

**Note**: There's a potential future enhancement to decouple qualified team predictions from game score predictions, but that's outside the scope of this story.

### Files to Create

1. **`app/components/tournament-prediction-status-bar.tsx`** (Client Component)
   - Main UI component following PredictionStatusBar pattern
   - Props: completion stats, tournament ID, isLocked
   - Visual sections:
     - Overall progress bar
     - Final standings status (3/3 with checkmarks/indicators)
     - Awards status (4/4 with checkmarks/indicators)
     - Qualifiers status (16/16 or dynamic count)
   - Action buttons: "Complete Podium Predictions", "Complete Award Predictions", "Predict Playoff Teams"

2. **`app/db/tournament-prediction-completion-repository.ts`** (Server)
   - New repository for completion status queries
   - Function: `getTournamentPredictionCompletion(userId, tournamentId)`
   - Returns: `TournamentPredictionCompletion` interface

3. **`__tests__/components/tournament-prediction-status-bar.test.tsx`**
   - Component rendering tests
   - Visual indicator tests (complete/incomplete states)
   - Link generation tests

4. **`__tests__/db/tournament-prediction-completion-repository.test.ts`**
   - Completion calculation tests
   - Edge cases: no predictions, partial predictions, all complete

### Files to Modify

1. **`app/tournaments/[id]/page.tsx`** (Server Component)
   - Add import: `getTournamentPredictionCompletion`
   - Fetch completion data: `const tournamentPredictionStatus = user ? await getTournamentPredictionCompletion(user.id, tournamentId) : null`
   - Add `<TournamentPredictionStatusBar>` component below `<PredictionStatusBar>` (lines 75-87)

2. **`app/db/tables-definition.ts`** (Type definitions)
   - Add new interface: `TournamentPredictionCompletion`

### Type Definitions

```typescript
// app/db/tables-definition.ts
export interface TournamentPredictionCompletion {
  // Final standings (3 items)
  finalStandings: {
    completed: number;
    total: number;
    champion: boolean;
    runnerUp: boolean;
    thirdPlace: boolean;
  };
  // Individual awards (4 items)
  awards: {
    completed: number;
    total: number;
    bestPlayer: boolean;
    topGoalscorer: boolean;
    bestGoalkeeper: boolean;
    bestYoungPlayer: boolean;
  };
  // Qualifiers (dynamic count based on playoff bracket)
  qualifiers: {
    completed: number;
    total: number;
  };
  // Overall
  overallCompleted: number;
  overallTotal: number;
  overallPercentage: number;
  isPredictionLocked: boolean;
}
```

### Implementation Steps

#### Step 1: Create Repository Function
File: `app/db/tournament-prediction-completion-repository.ts`

Query logic:
1. Fetch user's `tournament_guesses` via `findTournamentGuessByUserIdTournament()`
2. Fetch tournament info via `findTournamentById()` to get `has_third_place_game` flag
3. Count first-round playoff game slots (teams in first playoff round) to determine total qualifiers needed
4. Calculate completion status:
   - **Final standings**: Check if champion/runner-up are NOT NULL. Check third-place only if `has_third_place_game = true`
   - **Awards**: Check if all 4 award player IDs are NOT NULL
   - **Qualifiers**: Check if all group stage games have predictions (which auto-calculates group positions and determines which teams qualify)
     - Query: Count group games with guesses vs total group games
     - Total = number of first-round playoff teams (determines how many qualifiers needed)
     - Completed = whether all group games are predicted
5. Calculate overall: sum(completed) / sum(total)
6. Check lock status (5 days after tournament start)

#### Step 2: Create Status Bar Component
File: `app/components/tournament-prediction-status-bar.tsx`

Component structure:
```tsx
<Card variant="outlined" sx={{ p: 2, mb: 2 }}>
  {/* Overall Progress */}
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
    <Typography>Predicciones Torneo: {completed}/{total} ({percentage}%)</Typography>
    <LinearProgress variant="determinate" value={percentage} />
  </Box>

  {/* Category Details */}
  <Grid container spacing={1}>
    <Grid size={12}>
      <CategoryStatus
        title="Podio"
        completed={finalStandings.completed}
        total={finalStandings.total}
        link={`/tournaments/${tournamentId}/awards`}
      />
    </Grid>
    <Grid size={12}>
      <CategoryStatus
        title="Premios Individuales"
        completed={awards.completed}
        total={awards.total}
        link={`/tournaments/${tournamentId}/awards`}
      />
    </Grid>
    <Grid size={12}>
      <CategoryStatus
        title="Clasificados"
        completed={qualifiers.completed}
        total={qualifiers.total}
        link={`/tournaments/${tournamentId}/playoffs`}
      />
    </Grid>
  </Grid>

  {/* Alert if incomplete and unlocked */}
  {overallPercentage < 100 && !isPredictionLocked && (
    <Alert severity="warning" sx={{ mt: 2 }}>
      Completa tus predicciones de torneo antes del cierre
    </Alert>
  )}
</Card>
```

Visual indicators:
- Green checkmark (✓) for completed categories
- Orange warning icon (⚠) for incomplete categories
- Gray lock icon (🔒) if predictions are locked

#### Step 3: Integrate into Tournament Page
File: `app/tournaments/[id]/page.tsx`

Add after line 38 (after dashboardStats fetch):
```typescript
const tournamentPredictionStatus = user ?
  await getTournamentPredictionCompletion(user.id, tournamentId, tournament) :
  null;
```

Add component at line 87 (after PredictionStatusBar):
```tsx
{user && tournamentPredictionStatus && (
  <TournamentPredictionStatusBar
    completion={tournamentPredictionStatus}
    tournamentId={tournamentId}
  />
)}
```

#### Step 4: Write Tests

**Repository tests** (`__tests__/db/tournament-prediction-completion-repository.test.ts`):
- Test: No predictions returns 0/7 completion
- Test: Partial predictions calculates correct counts
- Test: All predictions returns 7/7 completion
- Test: Locked status after 5 days

**Component tests** (`__tests__/components/tournament-prediction-status-bar.test.tsx`):
- Test: Renders progress bar with correct percentage
- Test: Shows checkmarks for completed categories
- Test: Shows warning for incomplete categories
- Test: Renders correct links to prediction sections
- Test: Shows alert when incomplete and unlocked
- Test: Hides alert when locked

#### Step 5: Handle Edge Cases

1. **No third place game**: Check `tournament.has_third_place_game` - if false, only count 2 final standings items (champion + runner-up) instead of 3
2. **Locked predictions**: Show lock icon, disable links, no urgency alert
3. **Zero qualifiers**: Handle tournaments without playoffs (show "N/A" or hide qualifiers section)
4. **User not logged in**: Don't render component (handled by conditional in page.tsx)
5. **Partial group completion**: Qualifiers show as incomplete until ALL group games are predicted (since group positions auto-calculate from complete game predictions)

## Testing Strategy

### Unit Tests
- Repository: Test completion calculation with various data states
- Component: Test rendering, visual indicators, link generation

### Integration Tests
- Test full data flow: database → repository → component
- Verify correct counts for real tournament data

### Manual Testing
1. Create new user account
2. Navigate to tournament page → See 0% completion
3. Add champion prediction → See 1/7 (14%) completion
4. Complete all awards → See 5/7 (71%) completion
5. Complete all predictions → See 7/7 (100%) completion
6. Verify links navigate to correct sections
7. Test responsive layout on mobile

## Rollout Considerations

### Breaking Changes
None - purely additive feature

### Performance Impact
- Minimal: Single additional query per tournament page load
- Query is simple (1 JOIN, no aggregations)

### Visual Consistency
- Matches PredictionStatusBar pattern (UXI-002)
- Uses same MUI components, colors, spacing
- Spanish language labels matching existing UI

## Open Questions
None - implementation approach is clear based on existing patterns.

## Future Enhancement (Out of Scope)
There's potential to decouple qualified team predictions from game score predictions (i.e., let users explicitly predict which teams will qualify without needing to predict all group game scores). This would be a larger task involving:
- New UI for explicit qualifier selection
- Schema changes to store explicit qualifier predictions
- Migration of existing implicit qualifier logic
- This enhancement is acknowledged but deferred to a future story.

## Dependencies
- Existing: `tournament_guesses` table
- Existing: `game_guesses` table (for qualifier counting)
- Existing: MUI components (Card, LinearProgress, Alert, Typography, Grid)
- Existing: Next.js Link component for navigation

## Key Files Reference
- Pattern source: `/Users/gvinokur/Personal/qatar-prode/app/components/prediction-status-bar.tsx`
- Data source: `/Users/gvinokur/Personal/qatar-prode/app/db/tournament-guess-repository.ts`
- Integration point: `/Users/gvinokur/Personal/qatar-prode/app/tournaments/[id]/page.tsx`
- Similar completion logic: `/Users/gvinokur/Personal/qatar-prode/app/db/game-guess-repository.ts` (getPredictionDashboardStats)

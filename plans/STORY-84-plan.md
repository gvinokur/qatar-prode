# Implementation Plan: Tournament User Stats Page (UXI-026)

## Story Context

**Issue:** #84 - [UXI-026] Tournament User Stats Page
**Epic:** UX Improvements
**Priority:** 7/10 (Medium-High Impact, Medium Effort)

### Problem Statement
Users cannot easily view their tournament-specific statistics. There's no consolidated view of:
- Performance metrics and points breakdown
- Prediction accuracy patterns
- Boost effectiveness and ROI
- Overall tournament ranking

### Solution Overview
Create a dedicated tournament stats page (`/tournaments/[id]/stats`) that provides comprehensive user performance data with:
- Performance overview (points, rank, breakdown by stage)
- Prediction accuracy statistics
- Boost analysis (usage, success rate, ROI)
- Friend group participation

## Acceptance Criteria

1. **Route & Access**
   - ✅ Page accessible at `/tournaments/[id]/stats`
   - ✅ Requires authentication (redirect to login if not authenticated)
   - ✅ Shows only user's own statistics (not other users)

2. **Performance Overview Section**
   - ✅ Display total points in tournament
   - ✅ Show points breakdown by stage (group stage, playoffs)
   - ✅ Show tournament-level points (finals, awards, qualifiers, positions)
   - 🔄 Current rank display deferred to Phase 2 (requires fetching all users - performance consideration)

3. **Prediction Accuracy Section**
   - ✅ Display total predictions made vs available
   - ✅ Show correct predictions count and percentage
   - ✅ Show exact predictions count and percentage
   - ✅ Breakdown by stage (group vs playoff)

4. **Boost Analysis Section**
   - ✅ Display boosts used vs available (silver and golden separately)
   - ✅ Show boost success rate
   - ✅ Display points gained from boosts
   - ✅ Calculate and show boost ROI
   - ✅ Show boost allocation by group and playoff

5. **Navigation & UX**
   - ✅ Link from existing UserTournamentStatistics card on tournament home
   - ✅ Responsive design (mobile-first)
   - ✅ Consistent styling with existing tournament pages

6. **Performance**
   - ✅ Server-side data aggregation
   - ✅ Fast page load (<2s on good connection)

## Technical Approach

### Architecture Pattern
- **Server Component** for page (`/app/tournaments/[id]/stats/page.tsx`)
  - Fetches all data server-side using existing repository functions
  - No new database queries needed - all data available from existing functions
  - Passes data as props to Client Components
- **Client Components** for interactive sections
  - Statistics display cards
  - Responsive layout adjustments

### Data Fetching Strategy

All required data can be fetched using existing repository functions:

1. **User Context**
   - `getLoggedInUser()` - Get authenticated user

2. **Game Statistics** (Main data source)
   - `getGameGuessStatisticsForUsers([userId], tournamentId)`
   - Returns: `GameStatisticForUser` with all game prediction stats
   - Includes: correct/exact guesses by stage, scores, boost bonuses

3. **Tournament Predictions**
   - `findTournamentGuessByUserIdTournament(userId, tournamentId)`
   - Returns: Finals predictions (champion, awards) with scores
   - Provides: honor_roll_score, individual_awards_score, qualified_teams_score, group_position_score

4. **Boost Details** (Two separate calls)
   - `getBoostAllocationBreakdown(userId, tournamentId, 'silver')` - Silver boost data
   - `getBoostAllocationBreakdown(userId, tournamentId, 'golden')` - Golden boost data
   - Each returns: `{ byGroup, playoffCount, totalBoosts, scoredGamesCount, totalPointsEarned }`
   - Display silver and golden separately in UI (two sections in same card)
   - Enables: Success rate (`scoredGamesCount/totalBoosts`), ROI (`totalPointsEarned/totalBoosts`)

5. **Prediction Completion**
   - `getTournamentPredictionCompletion(userId, tournamentId, tournament)`
   - Returns: Completion stats for games, finals, awards
   - Provides: Total games vs predicted games

6. **User Ranking** (Optional - for Phase 2)
   - Would require fetching all users in tournament and sorting by total points
   - Defer to future enhancement due to potential performance impact

### Component Structure

```
/app/tournaments/[id]/stats/
├── page.tsx                           (Server Component - data fetching)
└── components/
    ├── performance-overview-card.tsx  (Client Component)
    ├── prediction-accuracy-card.tsx   (Client Component)
    └── boost-analysis-card.tsx        (Client Component)
```

### Calculations & Derived Metrics

**Performance Overview:**
- Total Points = game_score + tournament_score + boost_bonus
  - `game_score = userGameStatistics.total_score`
  - `tournament_score = tournamentGuess.honor_roll_score + individual_awards_score + qualified_teams_score + group_position_score`
  - `boost_bonus = userGameStatistics.total_boost_bonus`
- Points by Stage:
  - Group: `group_score + group_boost_bonus + qualified_teams_score + group_position_score`
  - Playoff: `playoff_score + playoff_boost_bonus + honor_roll_score + individual_awards_score`

**Prediction Accuracy:**
- Accuracy Rate = `(correct_guesses / total_predictions_made) * 100`
  - Handle edge case: If `total_predictions_made === 0`, display "N/A" or "0%"
- Exact Rate = `(exact_guesses / total_predictions_made) * 100`
  - Handle edge case: If `total_predictions_made === 0`, display "N/A" or "0%"
- Total Predictions Made = From prediction completion data
- Available Predictions = Total games in tournament

**Boost Analysis:**
- Boosts Available: `tournament.max_silver_games`, `tournament.max_golden_games`
- Boosts Used: From `getBoostAllocationBreakdown().totalBoosts`
- Success Rate = `(scoredGamesCount / totalBoosts) * 100`
  - Handle edge case: If `totalBoosts === 0`, display "No boosts used" message
- ROI = `totalPointsEarned / totalBoosts`
  - Handle edge case: If `totalBoosts === 0`, display "N/A" or hide ROI metric
- Points Gained = `totalPointsEarned` from boost breakdown

### Styling & Layout

**Responsive Grid Layout:**
```
Desktop (≥900px):
┌─────────────────────────────────────┐
│  Performance Overview (full width)  │
├──────────────────┬──────────────────┤
│ Prediction       │ Boost Analysis   │
│ Accuracy         │                  │
└──────────────────┴──────────────────┘

Mobile (<900px):
┌─────────────────────────────────────┐
│  Performance Overview (full width)  │
├─────────────────────────────────────┤
│  Prediction Accuracy (full width)   │
├─────────────────────────────────────┤
│  Boost Analysis (full width)        │
└─────────────────────────────────────┘
```

**MUI Components:**
- Grid2 with `size={{ xs: 12, md: 6 }}`
- Card + CardHeader + CardContent
- Typography with variants (h4, h6, body1, body2)
- Theme colors: `primary.main`, `primary.light`, `success.main`

## Visual Prototypes

### 1. Performance Overview Card

```
┌──────────────────────────────────────────────────────────────┐
│ 📊 Performance Overview                                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Total Points in Tournament                            247   │
│                                                               │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  Points Breakdown by Stage                                    │
│                                                               │
│  Group Stage                                           142   │
│    • Game Predictions                      92                │
│    • Boost Bonuses                         15                │
│    • Qualified Teams                        8                │
│    • Group Positions                       27                │
│                                                               │
│  Playoff Stage                                         105   │
│    • Game Predictions                      45                │
│    • Boost Bonuses                         10                │
│    • Finals Predictions                    35                │
│    • Individual Awards                     15                │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Layout:**
- Card with primary border
- Large total (Typography variant h4, fontWeight 700)
- Breakdown in two columns on desktop, stacked on mobile
- Nested indentation with bullet points
- Success color for boost bonuses (`success.main`)

**States:**
- Loading: Skeleton loader
- No data: "No predictions made yet" message
- With data: Full breakdown as shown

### 2. Prediction Accuracy Card

```
┌──────────────────────────────────────────────────────────────┐
│ 🎯 Prediction Accuracy                                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Total Predictions                            32 / 38        │
│  Prediction Completion                              84%      │
│                                                               │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  Overall Accuracy                                             │
│    • Correct Outcome                     20 (62.5%)          │
│    • Exact Score                          8 (25.0%)          │
│    • Missed                               4 (12.5%)          │
│                                                               │
│  By Stage                                                     │
│                                                               │
│  Group Stage (24 games)                                       │
│    • Correct Outcome                     15 (62.5%)          │
│    • Exact Score                          6 (25.0%)          │
│                                                               │
│  Playoff (8 games)                                            │
│    • Correct Outcome                      5 (62.5%)          │
│    • Exact Score                          2 (25.0%)          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Layout:**
- Card with primary border
- Summary at top (predictions made, completion %)
- Divider line
- Overall accuracy with percentages
- Stage breakdown below
- Color coding: Green for correct, orange for missed (optional)

**States:**
- No predictions: "Make your first prediction to see accuracy stats"
- Partial predictions: Show completion % and encourage completing
- Full predictions: Show complete breakdown

### 3. Boost Analysis Card

```
┌──────────────────────────────────────────────────────────────┐
│ ⚡ Boost Analysis                                             │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Silver Boosts                                                │
│    • Available                               5                │
│    • Used                                    4 (80%)          │
│    • Scored Games                            3 (75%)          │
│    • Points Earned                          18                │
│    • ROI (Avg per boost)                   4.5 pts           │
│                                                               │
│  Golden Boosts                                                │
│    • Available                               3                │
│    • Used                                    2 (67%)          │
│    • Scored Games                            2 (100%)         │
│    • Points Earned                          20                │
│    • ROI (Avg per boost)                  10.0 pts           │
│                                                               │
│  ─────────────────────────────────────────────────────────   │
│                                                               │
│  Boost Allocation                                             │
│                                                               │
│  Silver: Group A (1), Group B (2), Playoffs (1)              │
│  Golden: Group C (1), Playoffs (1)                           │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Layout:**
- Card with primary border
- Separate sections for silver and golden boosts
- Key metrics: Available, Used (%), Scored (%), Points, ROI
- Boost allocation summary at bottom
- Success color for high ROI boosts

**States:**
- No boosts used: "Use your boosts to maximize points!"
- Boosts pending: Show allocation, note "waiting for results"
- Boosts scored: Full analysis as shown

### Responsive Behavior

**Desktop (≥900px):**
- 3-column grid layout
- Performance overview spans full width
- Prediction accuracy and boost analysis side-by-side

**Mobile (<900px):**
- Single column layout
- Cards stack vertically
- Maintain readability with proper spacing
- Touch-friendly tap targets

**Color Palette:**
- Primary blue: `theme.palette.primary.main` - Headers, key metrics
- Light blue: `theme.palette.primary.light` - Labels, dividers
- Success green: `theme.palette.success.main` - Boost bonuses, positive metrics
- Warning orange: `theme.palette.warning.main` - Missed predictions (optional)
- Text: `theme.palette.text.primary`, `theme.palette.text.secondary`

## Files to Create/Modify

### New Files

1. **`/app/tournaments/[id]/stats/page.tsx`** (Server Component)
   - Main stats page
   - Fetch all data server-side
   - Render statistics cards with data
   - ~200 lines

2. **`/app/components/tournament-stats/performance-overview-card.tsx`** (Client Component)
   - Performance overview display
   - Points breakdown by stage
   - ~150 lines

3. **`/app/components/tournament-stats/prediction-accuracy-card.tsx`** (Client Component)
   - Prediction accuracy display
   - Breakdown by stage and type
   - ~120 lines

4. **`/app/components/tournament-stats/boost-analysis-card.tsx`** (Client Component)
   - Boost usage and effectiveness
   - ROI calculations and allocation
   - ~180 lines

### Modified Files

1. **`/app/components/tournament-page/user-tournament-statistics.tsx`**
   - Add link/button to navigate to detailed stats page
   - Wrap card in Link or add Button with onClick
   - ~5 lines changed

2. **`/app/tournaments/[id]/page.tsx`** (Optional - if we want breadcrumb)
   - No changes needed initially
   - Navigation will work via direct link

## Implementation Steps

### Phase 1: Server Component & Data Fetching (Core)

1. **Create stats page Server Component**
   - Create `/app/tournaments/[id]/stats/page.tsx`
   - Implement data fetching:
     - Get logged-in user with `getLoggedInUser()`
     - If no user: `redirect(\`/tournaments/\${params.id}\`)` (same pattern as awards page)
     - Fetch game statistics with `getGameGuessStatisticsForUsers([userId], tournamentId)`
     - Fetch tournament guesses with `findTournamentGuessByUserIdTournament(userId, tournamentId)`
     - Fetch silver boost data: `getBoostAllocationBreakdown(userId, tournamentId, 'silver')`
     - Fetch golden boost data: `getBoostAllocationBreakdown(userId, tournamentId, 'golden')`
     - Fetch prediction completion with `getTournamentPredictionCompletion(userId, tournamentId, tournament)`
   - Handle edge cases:
     - Empty statistics array → Use default/zero values
     - Null tournament guess → Show empty state for tournament predictions section
     - Zero predictions made → Show "Make your first prediction" message

2. **Implement derived calculations**
   - Calculate total points from all sources
   - Calculate accuracy percentages
   - Calculate boost ROI and success rates
   - Aggregate stage-specific metrics

### Phase 2: UI Components (Display)

3. **Create PerformanceOverviewCard component**
   - Display total points prominently
   - Show stage breakdown (group, playoff)
   - Show tournament predictions scores
   - Apply responsive Grid layout
   - Handle loading and empty states

4. **Create PredictionAccuracyCard component**
   - Display prediction completion
   - Show overall accuracy metrics
   - Show stage-specific breakdown
   - Display correct vs exact vs missed
   - Format percentages consistently

5. **Create BoostAnalysisCard component**
   - Display silver and golden boost metrics separately
   - Show usage, success rate, ROI
   - Display boost allocation by group/playoff
   - Handle case when no boosts used
   - Color code for high-performing boosts

### Phase 3: Navigation & Integration

6. **Update UserTournamentStatistics component**
   - Make card clickable or add "View Details" button
   - Use Next.js Link for navigation
   - Test navigation flow
   - Maintain existing display

### Phase 4: Testing & Quality

7. **Write comprehensive tests**
   - Unit tests for each component
   - Integration test for stats page
   - Test calculations and derived metrics
   - Test responsive layout
   - Test auth redirects and error states

8. **Run validation checks**
   - Run tests: `npm run test`
   - Run linter: `npm run lint`
   - Build project: `npm run build`
   - Ensure 80% coverage on new code

9. **Manual testing**
   - Test on mobile viewport
   - Test on desktop viewport
   - Verify calculations accuracy
   - Test with different data states (no predictions, partial, complete)
   - Test boost allocation display

## Testing Strategy

### Unit Tests

**Component Tests** (`__tests__/components/tournament-stats/`)

1. **`performance-overview-card.test.tsx`**
   - Render with complete data
   - Render with no data (empty state)
   - Verify point calculations
   - Verify stage breakdown display
   - Test responsive layout
   - Test color applications
   - Coverage target: 85%

2. **`prediction-accuracy-card.test.tsx`**
   - Render with predictions data
   - Render with no predictions
   - Verify accuracy percentage calculations
   - Verify stage breakdown
   - Test completion percentage display
   - Coverage target: 85%

3. **`boost-analysis-card.test.tsx`**
   - Render with boost data
   - Render with no boosts used
   - Verify ROI calculations
   - Verify success rate calculations
   - Test boost allocation display
   - Test silver vs golden separation
   - Coverage target: 85%

### Integration Tests

**Page Tests** (`__tests__/tournaments/[id]/stats.page.test.tsx`)

1. **Data Fetching Tests**
   - Mock all repository functions
   - Verify correct data fetching calls
   - Test auth redirect for unauthenticated users
   - Test error handling for missing tournament
   - Coverage target: 80%

2. **Calculation Tests**
   - Verify total points calculation from multiple sources
   - Verify accuracy percentage calculations
   - Verify ROI calculations
   - Test edge cases (zero predictions, zero boosts)
   - Coverage target: 90%

3. **Integration Tests**
   - Test full page render with realistic data
   - Verify all sections display correctly
   - Test responsive layout behavior
   - Coverage target: 80%

### Test Data Patterns

Use existing test utilities and factories:

```typescript
// Setup test data
const mockTournament = testFactories.tournament({ id: 'euro-2024' });
const mockUser = testFactories.user({ id: 'user-123' });

// Game statistics
const mockGameStats: GameStatisticForUser = {
  user_id: mockUser.id,
  total_correct_guesses: 20,
  total_exact_guesses: 8,
  total_score: 92,
  total_boost_bonus: 25,
  group_correct_guesses: 15,
  group_exact_guesses: 6,
  group_score: 62,
  group_boost_bonus: 15,
  playoff_correct_guesses: 5,
  playoff_exact_guesses: 2,
  playoff_score: 30,
  playoff_boost_bonus: 10
};

// Tournament guess
const mockTournamentGuess = testFactories.tournamentGuess({
  tournament_id: mockTournament.id,
  user_id: mockUser.id,
  honor_roll_score: 35,
  individual_awards_score: 15,
  qualified_teams_score: 8,
  group_position_score: 27
});

// Boost allocation
const mockBoostAllocation = {
  byGroup: [
    { groupLetter: 'A', count: 1 },
    { groupLetter: 'B', count: 2 }
  ],
  playoffCount: 1,
  totalBoosts: 4,
  scoredGamesCount: 3,
  totalPointsEarned: 18
};

// Mock repository functions
mockGetGameGuessStatisticsForUsers.mockResolvedValue([mockGameStats]);
mockFindTournamentGuessByUserIdTournament.mockResolvedValue(mockTournamentGuess);
mockGetBoostAllocationBreakdown.mockResolvedValue(mockBoostAllocation);
```

### Utilities to Use

- `renderWithTheme()` - For MUI components
- `testFactories.*` - For creating mock data
- `createMockSelectQuery()` - For database mocks
- `mockGetLoggedInUser()` - For auth mocking
- Mock Next.js router with `__tests__/mocks/next-navigation.mocks.ts`

## Validation Considerations

### SonarCloud Requirements

1. **Code Coverage: ≥80% on new code**
   - Write comprehensive unit tests for all components
   - Write integration tests for page component
   - Test all calculation functions
   - Test edge cases and error states

2. **0 New Issues (All Severities)**
   - Follow ESLint rules
   - No unused variables or imports
   - Proper error handling
   - Type safety (no `any` types)

3. **Security Rating: A**
   - Server-side auth checks
   - Validate user can only see own stats
   - Sanitize any user inputs (though minimal in this feature)

4. **Maintainability: B or higher**
   - DRY principles
   - Clear function names
   - Reasonable component size
   - Proper separation of concerns

### Pre-Commit Checklist

Before committing:
- [ ] All tests pass (`npm run test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Responsive design verified

### Pre-Merge Validation

After deploying to Vercel Preview:
- [ ] Test in Vercel Preview environment
- [ ] User approves functionality
- [ ] SonarCloud shows 0 new issues
- [ ] Coverage ≥80% on new code
- [ ] All CI/CD checks pass

## Open Questions

None at this time. All requirements are clear from the issue description and codebase exploration.

## Success Metrics

**From Issue #84:**
- Stats engagement: +60%
- User understanding of performance: +50%
- Boost strategy improvement: +30%

**Technical Metrics:**
- Page load time: <2s on good connection
- Test coverage: ≥80%
- SonarCloud: 0 new issues
- Mobile responsiveness: Works on all screen sizes

## Dependencies

**Blocks:**
- UXI-008 (Mobile Bottom Navigation) - Will use `/tournaments/[id]/stats` route

**No blockers** - All required data and patterns exist in codebase.

## Estimated Effort

**3-4 days** (as per issue)

- Day 1: Server component, data fetching, calculations (Phase 1)
- Day 2: UI components (Phase 2)
- Day 3: Navigation integration, testing (Phases 3-4)
- Day 4: Validation, fixes, user testing

## Notes

- No new database queries needed - all data available from existing functions
- Responsive design is critical - mobile-first approach
- Follow existing MUI styling patterns for consistency
- **User ranking display deferred to Phase 2** (requires fetching all tournament users - performance/scope consideration)
- This page prepares the route for UXI-008 (mobile bottom nav)
- Components placed at `/app/components/tournament-stats/` (new directory for stats-specific components)
- Language: Follow existing pattern - use Spanish labels like existing UserTournamentStatistics component
- Auth redirect: Redirect to tournament home (`/tournaments/[id]`) if not authenticated (matches awards page pattern)

## Implementation Clarifications (From Plan Review)

**Boost Data Fetching Pattern:**
- Call `getBoostAllocationBreakdown()` **twice** (once with 'silver', once with 'golden')
- Store results separately: `silverBoostData` and `goldenBoostData`
- Display both in same BoostAnalysisCard with separate sections

**Division by Zero Handling:**
- All percentage calculations must check denominator before dividing
- Display "N/A", "0%", or hide metric when denominator is zero
- Applies to: accuracy rate, exact rate, success rate, ROI

**Error States:**
- Empty game statistics → Show "No predictions made yet" with CTA to start predicting
- Null tournament guess → Hide or show empty state for finals/awards sections
- Zero boosts used → Show "Use your boosts to maximize points!" encouragement message

**Test Factories:**
- Verify during implementation that `testFactories.tournament()`, `testFactories.user()`, `testFactories.tournamentGuess()` exist
- Located at: `__tests__/db/test-factories.ts`

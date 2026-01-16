# Plan: [UXI-002] Prediction Tracking Dashboard (#12)

## Story Context
- **Milestone**: Sprint 1-2: Critical Fixes
- **Priority**: Critical (🔥🔥🔥)
- **Effort**: Low 1-2 days
- **Epic**: UX Audit 2026

## Objective
Create a prediction tracking dashboard that reduces time to find unpredicted games from 2-3 minutes to 10 seconds by adding progress indicators, filters, and boost summaries.

## Acceptance Criteria
- [x] Research codebase patterns for game display and predictions
- [ ] Display progress indicator: "32/48 games predicted (67%)"
- [ ] Add filter buttons: All / Unpredicted / Boosted / Closing Soon
- [ ] Show boost summary: "🥈 3/5 Silver  🥇 1/2 Golden"
- [ ] Display badge counts on filter buttons
- [ ] Persist filter preference in localStorage
- [ ] Filter games based on selected filter
- [ ] Mobile responsive layout
- [ ] Show dashboard on group games page
- [ ] Show dashboard on playoff games page
- [ ] Show dashboard on main tournament page
- [ ] Real-time updates when predictions/boosts change
- [ ] Write comprehensive unit tests

## UX Layout & Page Integration

### Where the Dashboard Appears

The dashboard sits **ABOVE the games grid** on every page, creating a consistent prediction management experience:

```
┌─────────────────────────────────────────────────┐
│  PREDICTION DASHBOARD                           │
│  ┌──────────────────────────────────────────┐  │
│  │ Progress: 32/48 (67%)  [■■■■■□□□□□]      │  │
│  │ 🥈 Silver: 3/5    🥇 Golden: 1/2          │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ [All: 48] [Unpredicted: 16] [Boosted: 4] │  │
│  │ [Closing Soon: 8]                         │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  GAMES GRID (filtered based on selection)       │
│  ┌──────────┐  ┌──────────┐                    │
│  │ Game 1   │  │ Game 2   │                    │
│  └──────────┘  └──────────┘                    │
│  ┌──────────┐  ┌──────────┐                    │
│  │ Game 3   │  │ Game 4   │                    │
│  └──────────┘  └──────────┘                    │
└─────────────────────────────────────────────────┘
```

### Integration Points

**1. Group Games Page** (`/tournaments/[id]/groups/[group_id]`)
- **Current**: Shows GamesGrid with editable predictions
- **After**: Dashboard + filtered GamesGrid
- **User Flow**: Filter → See relevant games → Edit predictions → Dashboard updates in real-time

**2. Playoff Games Page** (`/tournaments/[id]/playoffs`)
- **Current**: Tabbed interface (Round of 16, QF, SF, F) with GamesGrid per tab
- **After**: Dashboard per tab + filtered GamesGrid
- **Behavior**: Each tab shows stats for THAT round only (not tournament-wide)
- **User Flow**: Switch tab → See round-specific dashboard → Filter games → Edit

**3. Main Tournament Page** (`/tournaments/[id]`)
- **Current**: Shows "Fixtures" component (recent + upcoming games, read-only)
- **After**: Dashboard + filtered Fixtures
- **Behavior**: Tournament-wide stats, filters work for navigation
- **User Flow**: See unpredicted → Click game → Navigate to edit page

### Real-Time Updates

**Problem Identified**: Boost counts and prediction stats currently don't update immediately when predictions change.

**Solution**: Use `GuessesContext` for reactive updates

```typescript
// GuessesContext provides:
// - gameGuesses: Record<string, GameGuessNew> (reactive state)
// - updateGameGuess: (gameId, guess) => void
// - Context re-renders consumers when gameGuesses changes

// PredictionDashboard will:
1. Consume GuessesContext via useContext
2. Listen to gameGuesses changes via useMemo
3. Recalculate stats automatically when predictions change
4. No manual refresh needed!
```

**Real-time Update Flow**:
```
User edits prediction → updateGameGuess() called
→ GuessesContext updates gameGuesses state
→ PredictionDashboard re-renders (context consumer)
→ Stats recalculated (useMemo triggered)
→ UI updates immediately
```

## Technical Approach

### Architecture
**Client-side filtering approach** - All game data is already loaded in pages (48-64 games typical), so filtering in the client provides instant response with no additional database queries.

**Component Strategy**:
1. **New Component**: `PredictionDashboard.tsx` - Orchestrates status bar, filters, and games grid
2. **New Component**: `PredictionStatusBar.tsx` - Progress indicator with boost chips
3. **New Component**: `PredictionFilters.tsx` - Filter button group with badge counts
4. **Modified**: `GamesGrid.tsx` - Remove standalone `BoostCountsSummary` (now part of dashboard)
5. **Modified**: `TabbedPlayoffsPage.tsx` - Support dashboard integration
6. **Modified**: Pages to integrate dashboard

**Data Flow**:
```
Server Component (page.tsx)
  → Fetch games + guesses from repositories (already done)
  → Pass data as props
Client Component (PredictionDashboard)
  → Calculate stats + badge counts
  → Apply client-side filtering
  → Manage filter state + localStorage
  → Pass filtered games to GamesGrid
```

### Filter Definitions

| Filter | Logic |
|--------|-------|
| **All** | Show all games (default) |
| **Unpredicted** | Games where `home_score` and `away_score` are both undefined |
| **Boosted** | Games where `boost_type` is 'silver' or 'golden' |
| **Closing Soon** | Games starting within 24 hours but more than 1 hour away |

### localStorage Strategy
- **Key**: `prediction_filter_preference`
- **Value**: `"all" | "unpredicted" | "boosted" | "closing_soon"`
- **Behavior**: Load on mount, save on change, default to "all"

## Files to Create

### 1. `/app/components/prediction-dashboard.tsx`
**Purpose**: Main dashboard orchestrator component (Client Component)

**Props**:
```typescript
interface PredictionDashboardProps {
  games: ExtendedGameData[];
  gameGuesses: Record<string, GameGuessNew>;
  teamsMap: Record<string, Team>;
  isPlayoffs: boolean;
  isLoggedIn: boolean;
  tournamentId: string;
  isAwardsPredictionLocked?: boolean;
}
```

**Responsibilities**:
- Manage active filter state
- Load/save filter preference from/to localStorage
- Calculate badge counts for all filters
- Apply filter logic to games array
- Calculate prediction statistics (total, predicted, percentage)
- Render PredictionStatusBar, PredictionFilters, and GamesGrid
- Memoize filtered games and badge counts for performance

**Filter Logic**:
```typescript
const filterGames = (games: ExtendedGameData[], filter: FilterType) => {
  switch(filter) {
    case 'unpredicted':
      return games.filter(game => {
        const guess = gameGuesses[game.id];
        return !guess || (guess.home_score === undefined && guess.away_score === undefined);
      });
    case 'boosted':
      return games.filter(game => {
        const guess = gameGuesses[game.id];
        return guess?.boost_type === 'silver' || guess?.boost_type === 'golden';
      });
    case 'closing_soon':
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const oneHour = 60 * 60 * 1000;
      return games.filter(game => {
        const timeUntilGame = game.game_date.getTime() - now;
        return timeUntilGame > oneHour && timeUntilGame <= twentyFourHours;
      });
    case 'all':
    default:
      return games;
  }
};
```

### 2. `/app/components/prediction-status-bar.tsx`
**Purpose**: Display prediction progress and boost usage (Client Component)

**Props**:
```typescript
interface PredictionStatusBarProps {
  totalGames: number;
  predictedGames: number;
  silverUsed: number;
  silverMax: number;
  goldenUsed: number;
  goldenMax: number;
}
```

**UI Structure**:
- Paper container (elevation={0}, light background)
- Flex layout with gap for horizontal spacing
- Typography showing "Predictions: X/Y (Z%)"
- LinearProgress bar (height: 8px, rounded corners)
- Boost chips with Star icon (silver) and Trophy icon (golden)
- Hide boost chips if max values are 0

**Styling Pattern**: Follow `BoostCountsSummary` pattern
- Silver color: `#C0C0C0`
- Golden color: `#FFD700`
- Paper background: `rgba(0, 0, 0, 0.02)`

### 3. `/app/components/prediction-filters.tsx`
**Purpose**: Filter button group with badge counts (Client Component)

**Props**:
```typescript
interface PredictionFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  badgeCounts: {
    all: number;
    unpredicted: number;
    boosted: number;
    closingSoon: number;
  };
  showBoostedFilter: boolean; // Hide if tournament has no boosts
}
```

**UI Structure**:
- ButtonGroup with outlined buttons
- Active filter shows as contained button
- Badge component showing count for each filter
- Responsive: flexWrap for mobile (buttons wrap)
- Hide "Boosted" button if `showBoostedFilter` is false

**Badge Colors**:
- All: `color="default"` (gray)
- Unpredicted: `color="error"` (red)
- Boosted: `color="primary"` (blue)
- Closing Soon: `color="warning"` (orange)

### 4. `/app/components/prediction-dashboard-types.ts` (optional)
**Purpose**: Type definitions for dashboard components

```typescript
export type FilterType = 'all' | 'unpredicted' | 'boosted' | 'closing_soon';

export interface FilterBadgeCounts {
  all: number;
  unpredicted: number;
  boosted: number;
  closingSoon: number;
}
```

## Files to Modify

### 5. `/app/components/games-grid.tsx`
**Changes**:
- Remove standalone `<BoostCountsSummary />` render (lines ~30-35)
- Component now only renders the Grid container with games
- No other structural changes needed

**Before**:
```tsx
{isLoggedIn && tournamentId && (
  <BoostCountsSummary tournamentId={tournamentId} />
)}
<Grid container spacing={2}>
  {games.map(game => <GameView ... />)}
</Grid>
```

**After**:
```tsx
<Grid container spacing={2}>
  {games.map(game => <GameView ... />)}
</Grid>
```

### 6. `/app/tournaments/[id]/groups/[group_id]/page.tsx`
**Changes**: Integrate PredictionDashboard for logged-in users

**Pattern**:
```tsx
// Import
import { PredictionDashboard } from '@/app/components/prediction-dashboard';

// In render (replace GamesGrid for logged-in users)
{isLoggedIn ? (
  <PredictionDashboard
    games={Object.values(completeGroupData.gamesMap).sort(...)}
    gameGuesses={gameGuesses}
    teamsMap={completeGroupData.teamsMap}
    isPlayoffs={false}
    isLoggedIn={isLoggedIn}
    tournamentId={params.id}
  />
) : (
  <GamesGrid
    isPlayoffs={false}
    games={Object.values(completeGroupData.gamesMap).sort(...)}
    teamsMap={completeGroupData.teamsMap}
    isLoggedIn={false}
  />
)}
```

### 7. `/app/components/playoffs/tabbed-playoff-page.tsx`
**Changes**: Support dashboard integration with new props

**Add Props**:
```typescript
export interface TabbedPlayoffsPageProps {
  sections: Section[];
  teamsMap: Record<string, any>;
  isLoggedIn?: boolean;
  isAwardsPredictionLocked?: boolean;
  tournamentId?: string;
  enablePredictionDashboard?: boolean; // NEW
  gameGuesses?: Record<string, GameGuessNew>; // NEW
}
```

**Modify Render Logic** (in section map):
```tsx
{selectedTab === idx && (
  enablePredictionDashboard && isLoggedIn ? (
    <PredictionDashboard
      games={section.games}
      gameGuesses={gameGuesses}
      teamsMap={teamsMap}
      isPlayoffs={true}
      isLoggedIn={isLoggedIn}
      tournamentId={tournamentId}
      isAwardsPredictionLocked={isAwardsPredictionLocked}
    />
  ) : (
    <GamesGrid
      isPlayoffs={true}
      games={section.games}
      teamsMap={teamsMap}
      isLoggedIn={isLoggedIn}
      isAwardsPredictionLocked={isAwardsPredictionLocked}
      tournamentId={tournamentId}
    />
  )
)}
```

### 8. `/app/tournaments/[id]/playoffs/page.tsx`
**Changes**: Pass new props to TabbedPlayoffsPage

```tsx
<TabbedPlayoffsPage
  sections={completePlayoffData.sections}
  teamsMap={completePlayoffData.teamsMap}
  isLoggedIn={isLoggedIn}
  isAwardsPredictionLocked={tournament?.allow_predictions ? false : true}
  tournamentId={params.id}
  enablePredictionDashboard={true} // NEW
  gameGuesses={gameGuesses} // NEW
/>
```

## Implementation Steps

1. **Create type definitions** (`prediction-dashboard-types.ts` or add to `definitions.ts`)
2. **Create PredictionStatusBar component**
   - Progress indicator with LinearProgress bar
   - Boost chips reusing existing icons/colors
   - Hide boost chips if tournament has no boosts
3. **Create PredictionFilters component**
   - Button group with 4 filter buttons
   - Badge counts on each button
   - Active state highlighting
   - Responsive layout
4. **Create PredictionDashboard component**
   - Filter state management
   - localStorage integration
   - Badge count calculations (memoized)
   - Filter logic implementation
   - Render status bar, filters, and games grid
5. **Modify GamesGrid component**
   - Remove standalone BoostCountsSummary
6. **Integrate in group page**
   - Import PredictionDashboard
   - Replace GamesGrid with PredictionDashboard for logged-in users
7. **Modify TabbedPlayoffsPage component**
   - Add new props for dashboard support
   - Conditionally render dashboard vs grid
8. **Integrate in playoffs page**
   - Pass dashboard props to TabbedPlayoffsPage
9. **Write unit tests** for all new components
10. **Manual testing** on both pages, all filters, mobile

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

**Test File**: `__tests__/components/prediction-dashboard.test.tsx`

**Key Test Cases**:
- Filter logic correctly filters unpredicted games
- Filter logic correctly filters boosted games
- Filter logic correctly filters closing soon games
- Badge counts calculate correctly for each filter
- Progress percentage calculates correctly
- localStorage saves and loads filter preference
- Active filter state updates on button click
- Filtered games passed to GamesGrid

**Test File**: `__tests__/components/prediction-status-bar.test.tsx`

**Key Test Cases**:
- Renders prediction count and percentage
- Shows boost usage correctly
- Hides boost chips when max values are 0
- LinearProgress value matches percentage

**Test File**: `__tests__/components/prediction-filters.test.tsx`

**Key Test Cases**:
- Renders all filter buttons
- Highlights active filter correctly
- Calls onFilterChange on button click
- Shows correct badge counts
- Hides boosted filter when showBoostedFilter is false
- Responsive layout works on small screens

**Mock Data Pattern**:
```typescript
const mockGames = [
  { id: '1', game_date: new Date(Date.now() + 2 * 60 * 60 * 1000) }, // 2 hours away
  { id: '2', game_date: new Date(Date.now() + 12 * 60 * 60 * 1000) }, // 12 hours away
  { id: '3', game_date: new Date(Date.now() + 48 * 60 * 60 * 1000) }, // 2 days away
];

const mockGuesses = {
  '1': { home_score: 2, away_score: 1, boost_type: 'silver' },
  '2': { home_score: undefined, away_score: undefined },
  '3': { home_score: 1, away_score: 1 },
};
```

### Integration Tests

**Test File**: `__tests__/integration/prediction-dashboard-integration.test.tsx`

**Key Test Cases**:
- Full workflow: load dashboard → select filter → games update
- localStorage persistence: set filter → unmount → remount → filter persists
- GuessesContext integration: update guess → badge counts update

### Manual Testing Checklist

- [ ] Dashboard appears on group games page (logged-in users only)
- [ ] Dashboard appears on playoff games page (logged-in users only)
- [ ] Each playoff tab shows correct stats for that round
- [ ] "All" filter shows all games
- [ ] "Unpredicted" filter shows only games without predictions
- [ ] "Boosted" filter shows only silver/golden boosted games
- [ ] "Closing Soon" filter shows games 1-24 hours away
- [ ] Badge counts are accurate for each filter
- [ ] Progress bar reflects correct percentage
- [ ] Boost chips show correct usage (X/Y format)
- [ ] Filter preference persists after page reload
- [ ] Mobile layout is responsive (buttons wrap)
- [ ] Non-logged-in users see standard GamesGrid (no dashboard)
- [ ] Tournament without boosts hides boost chips and "Boosted" filter
- [ ] Empty filter results show appropriate message

## Edge Cases & UX Considerations

1. **Empty Filter Results**: Show message "No games match this filter" with button to reset to "All"
2. **Closing Soon Window**: 24 hours (configurable in future), excludes games within 1 hour (already locked)
3. **Playoff Stats**: Per-tab statistics (each round is separate view)
4. **Tournament Without Boosts**: Hide boost chips and "Boosted" filter button
5. **Non-Logged-In Users**: Fall back to standard GamesGrid (no dashboard)
6. **Mobile Responsiveness**: Button group wraps, vertical layout on very small screens
7. **Filter Persistence Scope**: Global preference (same filter for groups and playoffs)

## Performance Optimizations

- **useMemo** for badge count calculations (avoid recalculation on every render)
- **useMemo** for filtered games (avoid refiltering on unrelated state changes)
- Client-side filtering is O(n) where n < 100 games (negligible performance impact)

## Dependencies

**No new packages needed** - All functionality uses existing dependencies:
- Material-UI components (Paper, Chip, Button, Badge, LinearProgress, Grid)
- React hooks (useState, useEffect, useMemo)
- localStorage (browser API)

**Existing components to reuse**:
- Icons from MUI: Star (silver), EmojiEvents (golden)
- GamesGrid component (receives filtered games)

## Rollout Considerations

### Breaking Changes
None - This is an additive feature

### Migration Steps
1. Deploy new components
2. Update pages to use PredictionDashboard
3. Remove standalone BoostCountsSummary from GamesGrid (done in same PR)

### Feature Flags
Not needed - low risk, optional feature for logged-in users only

### Backward Compatibility
- Non-logged-in users see existing GamesGrid (unchanged)
- Existing prediction flow unchanged
- BoostCountsSummary remains available (though replaced by dashboard)

## Success Metrics

**Target**: Time to find unpredicted: 2-3 min → 10 sec

**Validation Approach** (future enhancement):
- Add analytics: `filter_changed` event with `filter_type` and `result_count`
- Track time between page load and first prediction edit
- Monitor "Unpredicted" filter usage rate

**Expected Improvements**:
- 90% reduction in time to find unpredicted games
- 25% increase in prediction completion rate
- High usage of "Unpredicted" and "Closing Soon" filters

## Open Questions

None - All design decisions made based on existing patterns in codebase.

## Critical Files Summary

**New Files** (3):
- `/app/components/prediction-dashboard.tsx` - Main orchestrator
- `/app/components/prediction-status-bar.tsx` - Progress display
- `/app/components/prediction-filters.tsx` - Filter buttons

**Modified Files** (4):
- `/app/components/games-grid.tsx` - Remove standalone BoostCountsSummary
- `/app/tournaments/[id]/groups/[group_id]/page.tsx` - Integrate dashboard
- `/app/components/playoffs/tabbed-playoff-page.tsx` - Support dashboard props
- `/app/tournaments/[id]/playoffs/page.tsx` - Pass dashboard props

**Test Files** (3):
- `__tests__/components/prediction-dashboard.test.tsx`
- `__tests__/components/prediction-status-bar.test.tsx`
- `__tests__/components/prediction-filters.test.tsx`

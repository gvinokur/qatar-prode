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

## Component Implementation Details

### Real-Time Updates Implementation

**Critical Fix**: The current implementation has a bug where boost counts don't update when predictions change. The solution is to use `GuessesContext` for reactive state:

```typescript
// ❌ WRONG: Pass gameGuesses as prop (static, no updates)
<PredictionDashboard games={games} gameGuesses={serverGuesses} />

// ✅ CORRECT: Get gameGuesses from context (reactive, auto-updates)
function PredictionDashboard({ games }: Props) {
  const { gameGuesses } = useContext(GuessesContext); // Reactive!
  // Stats recalculate automatically when gameGuesses changes
}
```

**Why This Works**:
1. `GuessesContext` provides `gameGuesses` as React state
2. When user edits prediction, `updateGameGuess()` updates state
3. All consumers of context re-render automatically
4. `useMemo` dependencies on `gameGuesses` trigger recalculation
5. UI updates instantly without manual refresh

### Tournament Config Access

PredictionDashboard needs tournament config (boost limits). **Two options**:

**Option A: Pass tournament as prop** (Recommended)
```typescript
interface PredictionDashboardProps {
  games: ExtendedGameData[];
  teamsMap: Record<string, Team>;
  tournament: Tournament; // NEW: for boost limits
  // ... other props
}

// In component:
const silverMax = tournament.max_silver_games ?? 0;
const goldenMax = tournament.max_golden_games ?? 0;
```

**Option B: Fetch via Server Action**
```typescript
// More overhead, requires additional data fetching
const { data: tournament } = useSWR(`/api/tournaments/${tournamentId}`);
```

**Decision**: Use Option A (pass tournament as prop) - already fetched in pages.

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

**Detailed Implementation with JSX**:
```typescript
'use client'

import { useState, useEffect, useMemo, useContext } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { GuessesContext } from './context-providers/guesses-context-provider';
import { PredictionStatusBar } from './prediction-status-bar';
import { PredictionFilters } from './prediction-filters';
import { GamesGrid } from './games-grid';
import type { FilterType } from './prediction-dashboard-types';
import type { ExtendedGameData, Tournament, Team } from '../definitions';

interface PredictionDashboardProps {
  games: ExtendedGameData[];
  teamsMap: Record<string, Team>;
  tournament: Tournament; // For boost limits
  isPlayoffs: boolean;
  isLoggedIn: boolean;
  tournamentId: string;
  isAwardsPredictionLocked?: boolean;
}

export function PredictionDashboard({
  games,
  teamsMap,
  tournament,
  isPlayoffs,
  isLoggedIn,
  tournamentId,
  isAwardsPredictionLocked
}: PredictionDashboardProps) {
  // Get gameGuesses from context (reactive!)
  const { gameGuesses } = useContext(GuessesContext);

  // Filter state
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Load filter preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('prediction_filter_preference');
    if (saved && ['all', 'unpredicted', 'boosted', 'closing_soon'].includes(saved)) {
      setActiveFilter(saved as FilterType);
    }
  }, []);

  // Save filter preference to localStorage
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    localStorage.setItem('prediction_filter_preference', filter);
  };

  // Calculate stats (reactive to gameGuesses)
  const stats = useMemo(() => {
    const predictedCount = games.filter(game => {
      const guess = gameGuesses[game.id];
      return guess && guess.home_score !== undefined && guess.away_score !== undefined;
    }).length;

    const boostedCount = games.filter(game => {
      const guess = gameGuesses[game.id];
      return guess?.boost_type === 'silver' || guess?.boost_type === 'golden';
    }).length;

    const closingSoonCount = games.filter(game => {
      const now = Date.now();
      const timeUntilGame = game.game_date.getTime() - now;
      const oneHour = 60 * 60 * 1000;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      return timeUntilGame > oneHour && timeUntilGame <= twentyFourHours;
    }).length;

    const silverUsed = games.filter(g => gameGuesses[g.id]?.boost_type === 'silver').length;
    const goldenUsed = games.filter(g => gameGuesses[g.id]?.boost_type === 'golden').length;

    return {
      totalGames: games.length,
      predictedGames: predictedCount,
      unpredictedGames: games.length - predictedCount,
      boostedGames: boostedCount,
      closingSoonGames: closingSoonCount,
      silverUsed,
      goldenUsed
    };
  }, [games, gameGuesses]); // Re-calculates when gameGuesses changes!

  // Filter games
  const filteredGames = useMemo(() => {
    return filterGames(games, activeFilter, gameGuesses);
  }, [games, activeFilter, gameGuesses]);

  // Badge counts
  const badgeCounts = useMemo(() => ({
    all: stats.totalGames,
    unpredicted: stats.unpredictedGames,
    boosted: stats.boostedGames,
    closingSoon: stats.closingSoonGames
  }), [stats]);

  // Boost limits from tournament config
  const silverMax = tournament.max_silver_games ?? 0;
  const goldenMax = tournament.max_golden_games ?? 0;
  const showBoostedFilter = silverMax > 0 || goldenMax > 0;

  return (
    <>
      <PredictionStatusBar
        totalGames={stats.totalGames}
        predictedGames={stats.predictedGames}
        silverUsed={stats.silverUsed}
        silverMax={silverMax}
        goldenUsed={stats.goldenUsed}
        goldenMax={goldenMax}
      />

      <PredictionFilters
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
        badgeCounts={badgeCounts}
        showBoostedFilter={showBoostedFilter}
      />

      {filteredGames.length > 0 ? (
        <GamesGrid
          games={filteredGames}
          teamsMap={teamsMap}
          isPlayoffs={isPlayoffs}
          isLoggedIn={isLoggedIn}
          tournamentId={tournamentId}
          isAwardsPredictionLocked={isAwardsPredictionLocked}
        />
      ) : (
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            No games match this filter
          </Typography>
          <Button
            variant="outlined"
            onClick={() => handleFilterChange('all')}
          >
            Show All Games
          </Button>
        </Box>
      )}
    </>
  );
}

// Helper function (can be in same file or separate utils file)
function filterGames(
  games: ExtendedGameData[],
  filter: FilterType,
  gameGuesses: Record<string, GameGuessNew>
): ExtendedGameData[] {
  // ... filter logic from above ...
}
```

**Key Points**:
- Uses `useContext(GuessesContext)` for reactive `gameGuesses`
- All `useMemo` hooks depend on `gameGuesses` → auto-recalculate on changes
- Empty state shows "No games match" with reset button
- localStorage integration for filter persistence
- Tournament prop provides boost limits

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

### 7. `/app/tournaments/[id]/page.tsx` (Main Tournament Page)
**Changes**: Add dashboard to main tournament landing page

**Current State**: Shows "Fixtures" component (recent + upcoming games, read-only)

**After**: Wrap Fixtures with dashboard for tournament-wide prediction overview

**Pattern**:
```tsx
// Import
import { PredictionDashboard } from '@/app/components/prediction-dashboard';
import { GuessesContextProvider } from '@/app/components/context-providers/guesses-context-provider';
import { findGameGuessesByUserId } from '@/app/db/game-guess-repository';

// Fetch data (add to existing fetches)
const gameGuesses = user ? await findGameGuessesByUserId(user.id, tournamentId) : {};
const gameGuessesMap = gameGuesses.reduce((acc, guess) => {
  acc[guess.game_id] = guess;
  return acc;
}, {} as Record<string, GameGuessNew>);

// In render (wrap Fixtures)
<Grid size={{ xs:12, md: 8 }}>
  {user ? (
    <GuessesContextProvider
      gameGuesses={gameGuessesMap}
      autoSave={false} // Read-only on main page
    >
      <PredictionDashboard
        games={gamesAroundMyTime}
        teamsMap={teamsMap}
        tournament={tournament}
        isPlayoffs={false}
        isLoggedIn={true}
        tournamentId={tournamentId}
        // Render Fixtures as child instead of GamesGrid
        customGamesRenderer={(filteredGames) => (
          <Fixtures games={filteredGames} teamsMap={teamsMap} />
        )}
      />
    </GuessesContextProvider>
  ) : (
    <Fixtures games={gamesAroundMyTime} teamsMap={teamsMap}/>
  )}
</Grid>
```

**Alternative Approach** (simpler):
Create separate component `FixturesWithDashboard` that wraps dashboard logic:
```tsx
// app/components/tournament-page/fixtures-with-dashboard.tsx
export function FixturesWithDashboard({ games, teamsMap, tournament }: Props) {
  const { gameGuesses } = useContext(GuessesContext);

  // Dashboard logic here

  return (
    <>
      <PredictionStatusBar ... />
      <PredictionFilters ... />
      <Fixtures games={filteredGames} teamsMap={teamsMap} />
    </>
  );
}
```

**Note**: Main page is read-only (games not editable), so:
- Dashboard shows stats but users can't edit predictions here
- Clicking game navigates to group/playoff page for editing
- Filters still useful for finding games quickly

### 8. `/app/components/playoffs/tabbed-playoff-page.tsx`
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
   - Pass tournament prop for boost limits
7. **Integrate in main tournament page**
   - Add dashboard above Fixtures component
   - Wrap with GuessesContextProvider
   - Consider alternative FixturesWithDashboard component approach
8. **Modify TabbedPlayoffsPage component**
   - Add new props for dashboard support
   - Conditionally render dashboard vs grid
9. **Integrate in playoffs page**
   - Pass dashboard props to TabbedPlayoffsPage
10. **Write unit tests** for all new components
11. **Manual testing** on all 3 pages (groups, playoffs, main), all filters, mobile

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

**Modified Files** (5):
- `/app/components/games-grid.tsx` - Remove standalone BoostCountsSummary
- `/app/tournaments/[id]/groups/[group_id]/page.tsx` - Integrate dashboard
- `/app/tournaments/[id]/page.tsx` - Add dashboard to main tournament page
- `/app/components/playoffs/tabbed-playoff-page.tsx` - Support dashboard props
- `/app/tournaments/[id]/playoffs/page.tsx` - Pass dashboard props

**Test Files** (3):
- `__tests__/components/prediction-dashboard.test.tsx`
- `__tests__/components/prediction-status-bar.test.tsx`
- `__tests__/components/prediction-filters.test.tsx`

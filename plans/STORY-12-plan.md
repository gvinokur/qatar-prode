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
- [ ] Show boost summary: "🥈 3/5 Silver  🥇 1/2 Golden"
- [ ] Show urgency warnings for unpredicted games closing soon:
  - [ ] Red alert: Games closing within 2 hours without prediction
  - [ ] Orange warning: Games closing within 24 hours without prediction
  - [ ] Yellow notice: Games closing within 2-3 days without prediction
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
│  PREDICTION STATUS                              │
│  ┌──────────────────────────────────────────┐  │
│  │ Progress: 32/48 (67%)  [■■■■■□□□□□]      │  │
│  │ 🥈 Silver: 3/5    🥇 Golden: 1/2          │  │
│  └──────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────┐  │
│  │ 🔴 URGENT: 3 games closing in 2 hours    │  │ ← Red Alert
│  │ 🟠 5 games closing within 24 hours       │  │ ← Orange Warning
│  │ 🟡 8 games closing within 2 days         │  │ ← Yellow Notice
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────┐
│  GAMES GRID (all games, no filtering)           │
│  ┌──────────┐  ┌──────────┐                    │
│  │ Game 1   │  │ Game 2   │                    │
│  │ [🔴 2h]  │  │          │                    │ ← Urgency badge on card
│  └──────────┘  └──────────┘                    │
│  ┌──────────┐  ┌──────────┐                    │
│  │ Game 3   │  │ Game 4   │                    │
│  │ [🟠 20h] │  │          │                    │
│  └──────────┘  └──────────┘                    │
└─────────────────────────────────────────────────┘
```

### Integration Points

**1. Group Games Page** (`/tournaments/[id]/groups/[group_id]`)
- **Current**: Shows GamesGrid with editable predictions
- **After**: Dashboard + GamesGrid (all games visible)
- **User Flow**: See urgency warnings → Edit predictions → Dashboard updates in real-time

**2. Playoff Games Page** (`/tournaments/[id]/playoffs`)
- **Current**: Tabbed interface (Round of 16, QF, SF, F) with GamesGrid per tab
- **After**: Dashboard per tab + GamesGrid
- **Behavior**: Each tab shows stats for THAT round only (not tournament-wide)
- **User Flow**: Switch tab → See round-specific dashboard with warnings → Edit predictions

**3. Main Tournament Page** (`/tournaments/[id]`)
- **Current**: Shows "Fixtures" component (recent + upcoming games, read-only)
- **After**: Dashboard + Fixtures
- **Behavior**: Tournament-wide stats with urgency warnings
- **User Flow**: See urgency warnings → Click game → Navigate to edit page

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
**Simplified approach** - No filters, focus on urgency warnings and progress tracking.

**Component Strategy**:
1. **New Component**: `PredictionDashboard.tsx` - Orchestrates status bar and games grid
2. **New Component**: `PredictionStatusBar.tsx` - Progress indicator, boost chips, and urgency warnings
3. **Modified**: `GamesGrid.tsx` - Remove standalone `BoostCountsSummary` (now part of dashboard)
4. **Modified**: `CompactGameViewCard.tsx` - Add urgency badge overlay (optional enhancement)
5. **Modified**: `TabbedPlayoffsPage.tsx` - Support dashboard integration
6. **Modified**: Pages to integrate dashboard

**Data Flow**:
```
Server Component (page.tsx)
  → Fetch games + guesses from repositories (already done)
  → Pass data as props
Client Component (PredictionDashboard)
  → Get gameGuesses from GuessesContext (reactive!)
  → Calculate stats (progress, boosts, urgency warnings)
  → Display status bar with warnings
  → Pass all games to GamesGrid (no filtering)
```

### Urgency Warning Definitions

Calculate time remaining until game closes (1 hour before game_date):

| Urgency Level | Time Remaining | Color | Display |
|---------------|----------------|-------|---------|
| **Red Alert** | < 2 hours | Red (#d32f2f) | "🔴 URGENT: N games closing in X hours" |
| **Orange Warning** | 2-24 hours | Orange (#ed6c02) | "🟠 N games closing within 24 hours" |
| **Yellow Notice** | 24-48 hours | Yellow (#ffa726) | "🟡 N games closing within 2 days" |

**Only count unpredicted games** - Games with no prediction or incomplete prediction (missing home_score or away_score).

**Note**: Games lock 1 hour before kickoff (existing `ONE_HOUR` constant in game-view.tsx)

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
**Purpose**: Display prediction progress, boost usage, and urgency warnings (Client Component)

**Props**:
```typescript
interface UrgencyWarning {
  level: 'red' | 'orange' | 'yellow';
  count: number;
  message: string;
}

interface PredictionStatusBarProps {
  totalGames: number;
  predictedGames: number;
  silverUsed: number;
  silverMax: number;
  goldenUsed: number;
  goldenMax: number;
  urgencyWarnings: UrgencyWarning[]; // NEW: urgency warnings
}
```

**UI Structure**:
```tsx
<Paper elevation={0} sx={{ p: 2, mb: 2, backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: 2 }}>
  {/* Progress Section */}
  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
    <Typography variant="body2" color="text.secondary" fontWeight="medium">
      Predictions: {predictedGames}/{totalGames} ({percentage}%)
    </Typography>
    <LinearProgress
      variant="determinate"
      value={percentage}
      sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
    />
    {/* Boost chips (if enabled) */}
    {silverMax > 0 && <Chip icon={<StarIcon />} label={`🥈 ${silverUsed}/${silverMax}`} size="small" />}
    {goldenMax > 0 && <Chip icon={<EmojiEventsIcon />} label={`🥇 ${goldenUsed}/${goldenMax}`} size="small" />}
  </Box>

  {/* Urgency Warnings Section */}
  {urgencyWarnings.length > 0 && (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {urgencyWarnings.map((warning, idx) => (
        <Alert
          key={idx}
          severity={warning.level === 'red' ? 'error' : warning.level === 'orange' ? 'warning' : 'info'}
          sx={{ py: 0.5 }}
        >
          {warning.message}
        </Alert>
      ))}
    </Box>
  )}
</Paper>
```

**Urgency Calculation** (done in PredictionDashboard, passed as prop):
```typescript
const calculateUrgencyWarnings = (games: ExtendedGameData[], gameGuesses: Record<string, GameGuessNew>): UrgencyWarning[] => {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  const unpredictedGamesClosingSoon = games.filter(game => {
    const guess = gameGuesses[game.id];
    const isPredicted = guess && guess.home_score !== undefined && guess.away_score !== undefined;
    if (isPredicted) return false;

    const timeUntilClose = game.game_date.getTime() - ONE_HOUR - now;
    return timeUntilClose > 0 && timeUntilClose < 48 * 60 * 60 * 1000; // Within 48 hours
  });

  const warnings: UrgencyWarning[] = [];

  const redCount = unpredictedGamesClosingSoon.filter(g => {
    const timeUntilClose = g.game_date.getTime() - ONE_HOUR - now;
    return timeUntilClose < 2 * 60 * 60 * 1000; // < 2 hours
  }).length;

  if (redCount > 0) {
    warnings.push({
      level: 'red',
      count: redCount,
      message: `🔴 URGENT: ${redCount} game${redCount > 1 ? 's' : ''} closing within 2 hours`
    });
  }

  const orangeCount = unpredictedGamesClosingSoon.filter(g => {
    const timeUntilClose = g.game_date.getTime() - ONE_HOUR - now;
    return timeUntilClose >= 2 * 60 * 60 * 1000 && timeUntilClose < 24 * 60 * 60 * 1000; // 2-24 hours
  }).length;

  if (orangeCount > 0) {
    warnings.push({
      level: 'orange',
      count: orangeCount,
      message: `🟠 ${orangeCount} game${orangeCount > 1 ? 's' : ''} closing within 24 hours`
    });
  }

  const yellowCount = unpredictedGamesClosingSoon.filter(g => {
    const timeUntilClose = g.game_date.getTime() - ONE_HOUR - now;
    return timeUntilClose >= 24 * 60 * 60 * 1000 && timeUntilClose < 48 * 60 * 60 * 1000; // 24-48 hours
  }).length;

  if (yellowCount > 0) {
    warnings.push({
      level: 'yellow',
      count: yellowCount,
      message: `🟡 ${yellowCount} game${yellowCount > 1 ? 's' : ''} closing within 2 days`
    });
  }

  return warnings;
};
```

**Styling**:
- Silver color: `#C0C0C0`
- Golden color: `#FFD700`
- Paper background: `rgba(0, 0, 0, 0.02)`
- Red alert: MUI Alert severity="error" (#d32f2f)
- Orange warning: MUI Alert severity="warning" (#ed6c02)
- Yellow notice: MUI Alert severity="info" with custom color (#ffa726)

### 3. `/app/components/prediction-dashboard-types.ts` (optional)
**Purpose**: Type definitions for dashboard components

```typescript
export interface UrgencyWarning {
  level: 'red' | 'orange' | 'yellow';
  count: number;
  message: string;
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
   - `UrgencyWarning` interface
2. **Create PredictionStatusBar component**
   - Progress indicator with LinearProgress bar
   - Boost chips reusing existing icons/colors
   - Urgency warnings with MUI Alert components (Red/Orange/Yellow)
   - Hide boost chips if tournament has no boosts
3. **Create PredictionDashboard component**
   - GuessesContext integration for reactive state
   - Calculate prediction stats (total, predicted, percentage)
   - Calculate boost usage (silver/golden)
   - Calculate urgency warnings with time thresholds
   - Render status bar and games grid (no filtering)
   - Real-time updates via useMemo dependencies
4. **Modify GamesGrid component**
   - Remove standalone BoostCountsSummary
5. **Integrate in group page**
   - Import PredictionDashboard
   - Replace GamesGrid with PredictionDashboard for logged-in users
   - Pass tournament prop for boost limits
6. **Integrate in main tournament page**
   - Add dashboard above Fixtures component
   - Wrap with GuessesContextProvider
   - Consider alternative FixturesWithDashboard component approach
7. **Modify TabbedPlayoffsPage component**
   - Add new props for dashboard support
   - Conditionally render dashboard vs grid
8. **Integrate in playoffs page**
   - Pass dashboard props to TabbedPlayoffsPage
9. **(Optional) Add urgency badges to game cards**
   - Modify CompactGameViewCard to show time remaining badge
   - Color-code badges (Red/Orange/Yellow) based on urgency
   - Only show for unpredicted games
10. **Write unit tests** for all new components
    - Test urgency calculation logic with different time windows
    - Test real-time updates when predictions change
    - Test boost count calculations
11. **Manual testing** on all 3 pages (groups, playoffs, main), urgency warnings, mobile

## Testing Strategy

### Unit Tests (Vitest + React Testing Library)

**Test File**: `__tests__/components/prediction-dashboard.test.tsx`

**Key Test Cases**:
- Urgency warning calculation for red alerts (< 2 hours)
- Urgency warning calculation for orange warnings (2-24 hours)
- Urgency warning calculation for yellow notices (24-48 hours)
- Only counts unpredicted games in urgency warnings
- Progress percentage calculates correctly
- Boost counts calculate correctly (silver/golden)
- Real-time updates when gameGuesses changes (via context)
- Passes all games to GamesGrid (no filtering)

**Test File**: `__tests__/components/prediction-status-bar.test.tsx`

**Key Test Cases**:
- Renders prediction count and percentage
- Shows boost usage correctly
- Hides boost chips when max values are 0
- LinearProgress value matches percentage
- Renders urgency warnings with correct Alert severity
- Red alert shows with severity="error"
- Orange warning shows with severity="warning"
- Yellow notice shows with severity="info"
- No warnings when all games predicted or no games closing soon

**Mock Data Pattern**:
```typescript
const ONE_HOUR = 60 * 60 * 1000;
const now = Date.now();

const mockGames = [
  { id: '1', game_date: new Date(now + ONE_HOUR + 1.5 * 60 * 60 * 1000) }, // Closes in 30 min (1.5h - 1h lock)
  { id: '2', game_date: new Date(now + ONE_HOUR + 12 * 60 * 60 * 1000) }, // Closes in 11 hours
  { id: '3', game_date: new Date(now + ONE_HOUR + 30 * 60 * 60 * 1000) }, // Closes in 29 hours
  { id: '4', game_date: new Date(now + ONE_HOUR + 60 * 60 * 60 * 1000) }, // Closes in 59 hours
];

const mockGuesses = {
  '1': { home_score: undefined, away_score: undefined }, // Unpredicted, red alert
  '2': { home_score: undefined, away_score: undefined }, // Unpredicted, orange warning
  '3': { home_score: 1, away_score: 1 }, // Predicted, no warning
  '4': { home_score: undefined, away_score: undefined }, // Unpredicted, beyond 48h window
};
```

### Integration Tests

**Test File**: `__tests__/integration/prediction-dashboard-integration.test.tsx`

**Key Test Cases**:
- Full workflow: load dashboard → see urgency warnings → edit prediction → warnings update
- GuessesContext integration: update guess → stats and warnings recalculate automatically
- Real-time urgency updates: as time passes, warnings should change (red → orange → yellow)

### Manual Testing Checklist

- [ ] Dashboard appears on group games page (logged-in users only)
- [ ] Dashboard appears on playoff games page (logged-in users only)
- [ ] Dashboard appears on main tournament page (logged-in users only)
- [ ] Each playoff tab shows correct stats for that round
- [ ] Progress bar reflects correct percentage
- [ ] Boost chips show correct usage (X/Y format)
- [ ] Red alert shows for unpredicted games closing within 2 hours
- [ ] Orange warning shows for unpredicted games closing within 24 hours
- [ ] Yellow notice shows for unpredicted games closing within 2 days
- [ ] Urgency warnings disappear when predictions are made
- [ ] Urgency warnings update in real-time when predictions change
- [ ] No warnings show when all games are predicted
- [ ] Mobile layout is responsive (warnings stack vertically)
- [ ] Non-logged-in users see standard GamesGrid (no dashboard)
- [ ] Tournament without boosts hides boost chips
- [ ] All games visible in grid (no filtering)

## Edge Cases & UX Considerations

1. **No Urgency Warnings**: When all games predicted or no games closing soon, show only progress/boost section
2. **Urgency Time Windows**: Red < 2h, Orange 2-24h, Yellow 24-48h (calculated from game_date - 1 hour lock)
3. **Playoff Stats**: Per-tab statistics (each round is separate view)
4. **Tournament Without Boosts**: Hide boost chips when max_silver_games and max_golden_games are 0
5. **Non-Logged-In Users**: Fall back to standard GamesGrid (no dashboard)
6. **Mobile Responsiveness**: Alerts stack vertically, progress bar remains readable
7. **Time Zone Handling**: Urgency calculated using game.game_date (UTC), respects ONE_HOUR lock constant

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

## Future Considerations

### Tournament Guesses Urgency Warnings

The current story focuses on **game predictions** (individual match scores). Tournament Guesses (awards like Best Player, Top Scorer, Champion, etc.) also have deadlines and could benefit from urgency warnings.

**Recommendation**: Handle Tournament Guesses in a separate story because:
1. Different UI (awards prediction form, not game cards)
2. Different deadline (usually tournament start, not game-by-game)
3. Different data model (`tournament_guesses` table vs `game_guesses`)
4. Less urgent (one deadline vs 48+ game deadlines)

**Future Story**: "[UXI-XXX] Tournament Guesses Urgency Indicator"
- Show warning when tournament guesses (awards) deadline approaching
- Similar color coding (Red/Orange/Yellow)
- Display in awards prediction page
- Smaller scope, can be quick follow-up story

## Critical Files Summary

**New Files** (2):
- `/app/components/prediction-dashboard.tsx` - Main orchestrator
- `/app/components/prediction-status-bar.tsx` - Progress display with urgency warnings

**Modified Files** (6):
- `/app/components/games-grid.tsx` - Remove standalone BoostCountsSummary
- `/app/tournaments/[id]/groups/[group_id]/page.tsx` - Integrate dashboard
- `/app/tournaments/[id]/page.tsx` - Add dashboard to main tournament page
- `/app/components/playoffs/tabbed-playoff-page.tsx` - Support dashboard props
- `/app/tournaments/[id]/playoffs/page.tsx` - Pass dashboard props
- `/app/components/compact-game-view-card.tsx` - (Optional) Add urgency badge overlay

**Test Files** (2):
- `__tests__/components/prediction-dashboard.test.tsx`
- `__tests__/components/prediction-status-bar.test.tsx`

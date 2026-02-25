# Plan: CompactPredictionDashboard Refactor & Auto-Refresh Fix (Story #214)

**Issue:** [Bug] Predictions Dashboard: Auto-Recalculation & Incomplete Game Guess Counting Issues

## Context

The CompactPredictionDashboard currently receives `predictedGames` as a server-side prop. When users update predictions, using `revalidatePath()` causes full page refreshes, resulting in poor UX (scroll position resets, jarring reloads).

The root issue is that different pages update different types of predictions:
- **Home page**: Users update game guesses
- **Qualified teams page**: Users update team positions
- **Awards page**: Users update awards/honor roll

But the dashboard always shows the same `predictedGames` count from server data, which becomes stale when users make changes. We need the dashboard to be reactive to the relevant context for each page.

## Solution Overview

Refactor CompactPredictionDashboard to use a **fixed + dynamic data model**:
- **Fixed data**: Metrics that don't change on the current page (retrieved once from server)
- **Dynamic data**: Metrics calculated from client context (updates in real-time)
- **Configuration**: Pass `null` in fixedData for metrics to calculate dynamically

Each page configures which metrics are dynamic by passing null in fixedData:
- **Home**: Games = `null` → Parent extracts `gameGuesses` from GuessesContext and passes as prop
- **Qualified Teams**: Qualified teams = `null` → Parent extracts `predictions` from QualifiedTeamsContext and passes as prop
- **Awards**: FinalStandings + Awards = `null` → Parent passes `tournamentGuesses` local state as prop

**Key architectural principle**: Dashboard is a pure component with NO context dependencies. Parent components are responsible for consuming contexts and passing data as props. This makes the dashboard simpler, more testable, and easier to understand.

Additionally, change the dashboard game row click behavior from opening an edit dialog to navigating to the tournament home page with scroll/edit/filter parameters.

**Note**: Awards are split into two categories:
- **Final Standings** (3 items): Champion, Runner-up, Third Place
- **Individual Awards** (4 items): Top Goalscorer, Best Player, Best Goalkeeper, Best Young Player

## Acceptance Criteria

- [ ] Dashboard updates in real-time without page refresh
- [ ] No scroll position resets when predictions change
- [ ] Playoff tie validation works correctly (ties need penalty winner)
- [ ] Navigation from dashboard clicks works (scroll to first incomplete game + set filter to 'all')
- [ ] All three pages show correct counts reactively
- [ ] All tests pass with 80%+ coverage on new code
- [ ] QualifiedTeamsContext availability handled gracefully on pages without it

## New Dashboard Interface

**Required imports**:
```typescript
import { TournamentGuessNew } from '../db/tables-definition';
import { TournamentPredictionCompletion } from '../definitions';
import { ExtendedGameData, Team } from '../definitions';
```

**Interface definition**:
```typescript
interface CompactPredictionDashboardProps {
  // Core tournament context
  readonly tournamentId?: string;
  readonly tournamentStartDate?: Date;
  readonly games?: ExtendedGameData[]; // For urgency calculation and dynamic game count
  readonly demoMode?: boolean;

  // Data for dynamic calculations (passed by parent components)
  readonly gameGuesses?: Record<string, GameGuessNew>; // For dynamic game count calculation
  readonly qualifiedTeamsPredictions?: Map<string, QualifiedTeamPrediction>; // For dynamic qualified teams count
  readonly tournamentGuesses?: TournamentGuessNew; // For dynamic awards calculation

  // Fixed data (retrieved once from server, won't change on this page)
  readonly fixedData: {
    readonly totalGames: number;
    readonly gamePredictions: number | null; // null = calculate dynamically from gameGuesses prop
    readonly qualifiedTeams: number | null; // null = calculate dynamically from qualifiedTeamsPredictions prop
    readonly finalStandings: number | null; // null = calculate dynamically from tournamentGuesses prop
    readonly awards: number | null; // null = calculate dynamically from tournamentGuesses prop
  };

  readonly tournamentPredictions?: TournamentPredictionCompletion;

  // Note: Dashboard does NOT consume contexts - parent components extract and pass data as props
  // Note: Removed teamsMap and isPlayoffs as GameDetailsPopover is replaced by navigation
}
```

**Note**: Removed `dynamicMode` - calculation is now automatic based on null values in fixedData.

## Client-Side Calculation Functions

### 1. Game Predictions (with Playoff Tie Validation)

**Location**: `app/utils/dashboard-calculations.ts` (new file)

**Note**: This enhances the current simple validation (which only checks for non-null scores) by adding playoff tie validation. This ensures playoff games with tied scores are only counted as complete when a penalty winner is selected.

```typescript
function calculateGamePredictions(
  games: ExtendedGameData[],
  gameGuesses: Record<string, GameGuessNew>
): number {
  return games.filter(game => {
    const guess = gameGuesses[game.id];
    if (!guess) return false;

    // Must have both scores
    if (guess.home_score == null || guess.away_score == null) return false;

    const isPlayoff = !!game.playoffStage;
    const isTie = guess.home_score === guess.away_score;

    // Non-playoff: just need scores
    if (!isPlayoff) return true;

    // Playoff with decisive score: complete
    if (!isTie) return true;

    // Playoff tie: need penalty winner (enhancement over simple validation)
    return guess.home_penalty_winner || guess.away_penalty_winner;
  }).length;
}
```

**Current behavior** (UnifiedGamesPageClient line 58-61): Only checks `home_score !== null && away_score !== null`

**Enhanced behavior**: Also validates playoff ties have penalty winner selected

**Impact**: More accurate prediction counts, prevents users from thinking incomplete playoff ties are complete

### 2. Qualified Teams Calculation

```typescript
function calculateQualifiedTeamsPredictions(
  predictions: Map<string, QualifiedTeamPrediction>
): number {
  return Array.from(predictions.values()).filter(
    p => p.predicted_to_qualify === true
  ).length;
}
```

**Note**: Checks `predicted_to_qualify` flag, not just position. A team can have a position (e.g., 5th) but not qualify.

### 3. Final Standings Calculation

```typescript
function calculateFinalStandings(
  tournamentGuesses: TournamentGuessNew | null
): number {
  if (!tournamentGuesses) return 0;

  const fields: Array<keyof TournamentGuessNew> = [
    'champion_team_id',
    'runner_up_team_id',
    'third_place_team_id'
  ];

  return fields.filter(field => tournamentGuesses[field] != null).length;
}
```

### 4. Awards Calculation

```typescript
function calculateAwards(
  tournamentGuesses: TournamentGuessNew | null
): number {
  if (!tournamentGuesses) return 0;

  const fields: Array<keyof TournamentGuessNew> = [
    'top_goalscorer_player_id',
    'best_player_id',
    'best_goalkeeper_player_id',
    'best_young_player_id'
  ];

  return fields.filter(field => tournamentGuesses[field] != null).length;
}
```

## Dashboard Component Changes

**File**: `app/components/compact-prediction-dashboard.tsx`

Dashboard receives all data as props (no context consumption). Add useMemo hook to combine fixed + dynamic data:

```typescript
const calculatedData = useMemo(() => {
  // Calculate game predictions if fixedData.gamePredictions is null
  const gamePredictions = fixedData.gamePredictions !== null
    ? fixedData.gamePredictions
    : (games && gameGuesses ? calculateGamePredictions(games, gameGuesses) : 0);

  // Calculate qualified teams if fixedData.qualifiedTeams is null
  const qualifiedTeams = fixedData.qualifiedTeams !== null
    ? fixedData.qualifiedTeams
    : (qualifiedTeamsPredictions
        ? calculateQualifiedTeamsPredictions(qualifiedTeamsPredictions)
        : 0);

  // Calculate final standings if fixedData.finalStandings is null
  const finalStandings = fixedData.finalStandings !== null
    ? fixedData.finalStandings
    : calculateFinalStandings(tournamentGuesses ?? null);

  // Calculate awards if fixedData.awards is null
  const awards = fixedData.awards !== null
    ? fixedData.awards
    : calculateAwards(tournamentGuesses ?? null);

  return { gamePredictions, qualifiedTeams, finalStandings, awards };
}, [
  fixedData.gamePredictions,
  fixedData.qualifiedTeams,
  fixedData.finalStandings,
  fixedData.awards,
  games,
  gameGuesses,
  qualifiedTeamsPredictions, // Map reference identity critical for re-renders
  tournamentGuesses
]);
```

**Key architectural improvement**: Dashboard is now a pure component - no context dependencies, just props. Parent components are responsible for extracting data from contexts and passing to dashboard.

## Navigation Behavior Change

**Current**: Game row click → `GameDetailsPopover` → `GameResultEditDialog`

**New**: Game row click → Navigate to tournament home + URL params

```typescript
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

const router = useRouter();
const locale = useLocale();

const handleGameRowClick = useCallback(() => {
  if (demoMode || !tournamentId) return;

  const url = `/${locale}/tournaments/${tournamentId}?scrollToGame=auto&filter=all`;
  router.push(url);
}, [demoMode, tournamentId, router, locale]);
```

**UnifiedGamesPageClient** must handle URL params:

```typescript
import { useSearchParams } from 'next/navigation';

const searchParams = useSearchParams();

// Handle URL parameters - runs when searchParams change
useEffect(() => {
  const filter = searchParams.get('filter');
  const scrollToGame = searchParams.get('scrollToGame');

  if (filter === 'all') {
    setActiveFilter('all');
    setGroupFilter('all');
    setRoundFilter('all');
  }

  if (scrollToGame === 'auto') {
    // Delay to allow filter state to settle and filteredGames to update
    setTimeout(() => {
      const targetId = findScrollTarget(filteredGames);
      if (targetId) {
        scrollToGameFn(targetId, 'smooth');
      }
    }, 300);
  }

  // Note: filteredGames is intentionally NOT in dependency array to avoid infinite loops.
  // The setTimeout allows filter state changes to propagate before scroll calculation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [searchParams]);
```

**Critical coordination note**: The existing filter-based auto-scroll logic should be updated to check if URL params were processed to avoid double-scrolling.

## Visual Prototype: Navigation Flow

### Before (Current Behavior)

**User on Awards Page**:
```
┌─────────────────────────────────────────┐
│  Awards Page                            │
├─────────────────────────────────────────┤
│                                         │
│  ┌────────────────────────────────┐    │
│  │ Prediction Dashboard (Compact) │    │
│  │                                │    │
│  │ Games: 15/38                   │◄───┼─── User clicks here
│  │ Qualified Teams: 12/16         │    │
│  │ Final Standings: 2/3           │    │
│  │ Awards: 3/4                    │    │
│  └────────────────────────────────┘    │
│                                         │
│  [Opens GameDetailsPopover]            │ ◄─ OLD: Opens popover dialog
│  ┌────────────────────────────────┐    │    with game details
│  │ Game Details                   │    │
│  │ ┌────────────────────────────┐ │    │
│  │ │ Edit Dialog                │ │    │
│  │ │ Home: ARG [2] ▼           │ │    │
│  │ │ Away: BRA [1] ▼           │ │    │
│  │ │ [Save] [Cancel]           │ │    │
│  │ └────────────────────────────┘ │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘

PROBLEM: User loses context, popover feels disconnected from game list
```

### After (New Behavior)

**User on Awards Page → Navigates to Home → Auto-scroll to incomplete game**:

```
Step 1: User clicks dashboard game row
┌─────────────────────────────────────────┐
│  Awards Page                            │
├─────────────────────────────────────────┤
│  ┌────────────────────────────────┐    │
│  │ Prediction Dashboard (Compact) │    │
│  │ Games: 15/38                   │◄───┼─── Click
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
        ↓ Navigate to: /tournaments/123?scrollToGame=auto&filter=all

Step 2: Arrives at Tournament Home page
┌─────────────────────────────────────────┐
│  Tournament Home Page                   │
├─────────────────────────────────────────┤
│  [Filters: All ▼] [Groups: All ▼]      │◄─ Filters set to "all" via URL param
│                                         │
│  ┌────────────────────────────────┐    │
│  │ Prediction Dashboard (Compact) │    │
│  │ Games: 15/38 (same count)      │    │
│  └────────────────────────────────┘    │
│                                         │
│  Game List (scrolling...)               │
│  ┌────────────────────────────────┐    │
│  │ ✅ ARG vs BRA - Predicted      │    │
│  └────────────────────────────────┘    │
│  ┌────────────────────────────────┐    │
│  │ ✅ CHI vs URU - Predicted      │    │
│  └────────────────────────────────┘    │
│                  ↓                      │
│         [Auto-scroll to here]           │
│                  ↓                      │
│  ┌────────────────────────────────┐    │◄─ First incomplete game
│  │ ⚠️ COL vs ECU - Not Predicted │    │   (findScrollTarget result)
│  │ Click to flip and predict      │    │
│  └────────────────────────────────┘    │
│                                         │
│  ┌────────────────────────────────┐    │
│  │ ❌ PER vs VEN - Not Predicted  │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘

BENEFIT: User sees full context, can scroll through all games, natural flow
```

### Mobile View (Awards → Home with scroll)

```
┌──────────────────────┐      ┌──────────────────────┐
│ Awards Page          │      │ Tournament Home      │
│                      │      │                      │
│ ╔══════════════════╗ │      │ [All ▼] [All ▼]     │
│ ║ Dashboard        ║ │      │                      │
│ ║ Games: 15/38     ║◄┼─Click│ ╔══════════════════╗ │
│ ║ Teams: 12/16     ║ │      │ ║ Dashboard        ║ │
│ ║ Final: 2/3       ║ │  →   │ ║ Games: 15/38     ║ │
│ ║ Awards: 3/4      ║ │  Navigate ║ Teams: 12/16  ║ │
│ ╚══════════════════╝ │      │ ╚══════════════════╝ │
│                      │      │                      │
│ [Champion]   ▼      │      │ ┌─────────────────┐  │
│ [Runner-up]  ▼      │      │ │✅ ARG vs BRA    │  │
│                      │      │ └─────────────────┘  │
└──────────────────────┘      │         ⬇️           │
                              │ ┌─────────────────┐  │
                              │ │⚠️ COL vs ECU   │◄─Scroll
                              │ │ Not predicted  │  │
                              │ └─────────────────┘  │
                              │ ┌─────────────────┐  │
                              │ │❌ PER vs VEN    │  │
                              │ └─────────────────┘  │
                              └──────────────────────┘

MOBILE BENEFIT: Full-screen game list, easier to flip cards, see more context
```

### Key UX Improvements

1. **Context Preservation**: User sees full game list, not isolated popover
2. **Scroll to Incomplete**: Automatically scrolls to first game needing prediction
3. **Filter Reset**: Sets filters to "all" to show maximum games
4. **Consistent Navigation**: All three pages (Home, Qualified Teams, Awards) use same pattern
5. **Mobile-Friendly**: Better use of screen real estate on mobile devices

## Per-Page Configuration

### Home Page

**File**: `app/components/unified-games-page-client.tsx`

```typescript
// Parent component consumes context and extracts data
const { gameGuesses } = useContext(GuessesContext);

<CompactPredictionDashboard
  tournamentId={tournamentId}
  tournamentStartDate={tournamentStartDate}
  games={closingGames}  // Only games closing within 48hrs (for urgency + dynamic count)
  gameGuesses={gameGuesses}  // Extracted from context, passed as prop
  fixedData={{
    totalGames: games.length,  // All games count for denominator
    gamePredictions: null,  // Calculate dynamically from gameGuesses prop
    qualifiedTeams: tournamentPredictionCompletion?.qualifiers.completed ?? 0,
    finalStandings: tournamentPredictionCompletion?.finalStandings.completed ?? 0,
    awards: tournamentPredictionCompletion?.awards.completed ?? 0
  }}
  tournamentPredictions={tournamentPredictionCompletion}
/>
```

**Note**: Parent component (UnifiedGamesPageClient) is responsible for consuming GuessesContext and passing data to dashboard as props.

### Qualified Teams Page

**File**: `app/[locale]/tournaments/[id]/qualified-teams/page.tsx`
- Replace `getAllTournamentGames(params.id)` with `getGamesClosingWithin48Hours(params.id)`
- Pass `closingGames` to component for urgency calculation (not all games)

**File**: `app/components/qualified-teams/qualified-teams-client-page.tsx`

```typescript
// Parent component consumes context and extracts data
const { predictions } = useContext(QualifiedTeamsContext);

<CompactPredictionDashboard
  tournamentId={tournament.id}
  tournamentStartDate={tournamentStartDate}
  games={closingGames}  // Only games closing within 48hrs (for urgency calculation)
  qualifiedTeamsPredictions={predictions}  // Extracted from context, passed as prop
  fixedData={{
    totalGames: allGamesCount,  // Total from server (not closingGames.length)
    gamePredictions: gameGuessesArray.length,  // Fixed from server (NO GuessesContext needed)
    qualifiedTeams: null,  // Calculate dynamically from qualifiedTeamsPredictions prop
    finalStandings: tournamentPredictionCompletion?.finalStandings.completed ?? 0,
    awards: tournamentPredictionCompletion?.awards.completed ?? 0
  }}
  tournamentPredictions={tournamentPredictionCompletion}
/>
```

**Note**: Parent component is responsible for consuming QualifiedTeamsContext and passing data to dashboard as props. NO GuessesContext needed.

### Awards Page

**File**: `app/[locale]/tournaments/[id]/awards/page.tsx`
- Replace `getAllTournamentGames(params.id)` with `getGamesClosingWithin48Hours(params.id)`
- Also fetch total games count separately: `getTournamentGameCounts(user.id, params.id)` for `totalGames`
- Pass `closingGames` to component for urgency calculation (not all games)

**File**: `app/components/awards/award-panel.tsx`

```typescript
// tournamentGuesses is local state, just pass it as prop
<CompactPredictionDashboard
  tournamentId={tournament.id}
  tournamentStartDate={tournamentStartDate}
  games={closingGames}  // Only games closing within 48hrs (for urgency calculation)
  tournamentGuesses={tournamentGuesses}  // Local state, passed as prop for dynamic calculation
  fixedData={{
    totalGames: allGamesCount,  // Total from server (not closingGames.length)
    gamePredictions: gameGuessesArray.length,  // Fixed from server
    qualifiedTeams: tournamentPredictionCompletion?.qualifiers.completed ?? 0,
    finalStandings: null,  // Calculate dynamically from tournamentGuesses prop
    awards: null  // Calculate dynamically from tournamentGuesses prop
  }}
  tournamentPredictions={tournamentPredictionCompletion}
/>
```

**Note**: Remove `GuessesContextProvider` wrapper - not needed. Dashboard receives tournamentGuesses from local state as prop. NO contexts consumed.

## Implementation Steps

### Phase 1: Calculation Functions
1. Create `app/utils/dashboard-calculations.ts`
2. Implement `calculateGamePredictions()` with playoff tie validation
3. Implement `calculateQualifiedTeamsPredictions()`
4. Implement `calculateFinalStandings()` (champion, runner-up, third place)
5. Implement `calculateAwards()` (individual awards)
6. Add unit tests in `__tests__/utils/dashboard-calculations.test.ts`

### Phase 2: Dashboard Refactor
1. Update CompactPredictionDashboard interface (remove dynamicMode, add tournamentGuesses)
2. Add context consumption at top level (handle missing QualifiedTeamsContext with try-catch)
3. Add useMemo calculation logic (null check triggers dynamic calculation)
4. Update PredictionProgressRow data binding (use calculatedData)
5. Add JSDoc documentation
6. Add integration tests

### Phase 3: Page Updates
1. Update Qualified Teams server page: Use `getGamesClosingWithin48Hours()` instead of `getAllTournamentGames()`
2. Update Awards server page: Use `getGamesClosingWithin48Hours()` instead of `getAllTournamentGames()`
3. Update component props to receive `closingGames` and `allGamesCount` separately
4. Remove `GuessesContextProvider` wrapper from Awards page
5. Verify real-time updates work on each page
6. Verify performance: Only closing games fetched for non-home pages, no unnecessary contexts

### Phase 4: Navigation Changes
1. Update `handleGameRowClick` in CompactPredictionDashboard
2. Add URL param handling in UnifiedGamesPageClient
3. Test navigation flow

### Phase 5: Cleanup
1. Remove or deprecate GameDetailsPopover edit functionality
2. Update documentation
3. Run full test suite

## Critical Files

- `app/components/compact-prediction-dashboard.tsx` - Core refactor
- `app/utils/dashboard-calculations.ts` - New calculation functions
- `app/components/unified-games-page-client.tsx` - Home page updates
- `app/components/qualified-teams/qualified-teams-client-page.tsx` - Qualified teams updates
- `app/components/awards/award-panel.tsx` - Awards page updates
- `__tests__/utils/dashboard-calculations.test.ts` - New tests

## Testing Strategy

### Unit Tests
- Test each calculation function independently
- Test playoff tie validation edge cases
- Test with empty/null data

### Integration Tests
- Test dashboard with fixed data only
- Test dashboard with dynamic calculation
- Test navigation behavior
- Test URL param handling

### E2E Testing
1. Update game guess → Verify dashboard updates immediately
2. Update team position → Verify dashboard updates immediately
3. Update award → Verify dashboard updates immediately
4. Click dashboard → Verify navigation + scroll + filters

## Edge Cases

- **No games in tournament** → Display 0/0
- **No predictions yet** → Display 0/N
- **Context not available** → Fall back to fixed data (null checks handle gracefully)
- **QualifiedTeamsContext missing** → Optional chaining returns undefined, calculation returns 0
- **Playoff game without teams** → Filter out from games array
- **Playoff tie without penalty winner** → NOT counted (enhancement over current simple validation)
- **Playoff tie with both penalty winners** → Counted as complete (invalid state, but UI validation prevents this)
- **Locked state** → Display normally (locks handled elsewhere, dashboard is read-only)
- **Rapid prediction updates** → useMemo prevents excessive recalculations (Map reference identity critical)
- **URL params + filter changes** → 300ms delay allows state to settle before scroll

## Success Criteria

✅ Dashboard updates in real-time without page refresh
✅ No scroll position resets
✅ Playoff tie validation works correctly
✅ Navigation from dashboard works
✅ All three pages show correct counts
✅ All tests pass

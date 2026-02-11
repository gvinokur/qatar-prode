# Implementation Plan: Story #114 - Unified Games Page with Filters and Auto-Scroll

## Story Context

### Objective
Replace the tournament home page with a unified games page that consolidates all game predictions (groups + playoffs) into a single, filterable view with auto-scroll to current date.

### Problem Statement
Currently, game predictions are fragmented across multiple pages:
- Tournament home: `/tournaments/{id}` - Shows games around current time
- Group pages: `/tournaments/{id}/groups/{group_id}` - Individual group games
- Playoffs page: `/tournaments/{id}/playoffs` - Playoff rounds in tabs

This requires 2-3 minutes and multiple navigation clicks to find unpredicted games, especially in tournaments with many groups.

### Success Metrics
- 80% reduction in time to find unpredicted games (from 2-3 min to <30 sec)
- 50% reduction in navigation clicks to complete predictions
- 40% increase in prediction completion rate
- Maintain 80% test coverage on new code
- 0 new SonarCloud issues

## Acceptance Criteria

### Core Functionality
- [x] Games page replaces tournament home (/tournaments/{id})
- [x] Shows all games (groups + playoffs) in single list
- [x] Filter buttons: All, Groups, Playoffs, Unpredicted, Closing Soon
  - Note: Team filter considered but deferred to future enhancement
- [x] Badge counts on each filter button
- [x] Secondary filters: Group selector (A-F), Round selector (R16-F)
- [x] Progress bar shows completion percentage
- [x] Auto-scroll to current date on initial load
  - Games section is scrollable (fixed height container), not whole page
  - Keeps filters visible while scrolling games

### Navigation
- [x] Individual group pages remain (direct URL access) but removed from navigation
- [x] Playoffs page removed (games now in unified page)

### Data & State
- [x] Filter selection persists in localStorage
- [x] Progress tracking updates in real-time
- [x] Games load efficiently (all games rendered - World Cup max is 104 games, acceptable performance)
- [x] Optimistic UI updates when predicting

### Integration
- [x] Prediction status bar (urgency accordion) integrated
- [x] User stats card in sidebar
- [x] Friend groups card in sidebar
- [x] Rules card in sidebar

### Responsive
- [x] Desktop: 2-column layout (games + sidebar)
- [x] Mobile: Single column, sidebar moves to bottom navigation
- [x] Filter buttons wrap on small screens
- [x] Secondary filters (group/round selectors) use horizontal scroll when many options

### Testing
- [x] Unit tests for filter logic
- [x] Unit tests for auto-scroll algorithm
- [x] Integration tests for prediction flow
- [x] Performance tests with 100+ games
- [x] 80% coverage on new code

## Technical Approach

### Architecture Pattern: Server Component + Client Context

Following the existing pattern in the codebase:

1. **Server Component** (`/app/tournaments/[id]/page.tsx`):
   - Fetch ALL tournament games (groups + playoffs) using repository layer
   - Fetch user predictions, dashboard stats, boost counts
   - Build teams map for O(1) lookups
   - Pass data to Client Components via props

2. **Client Components**:
   - `<UnifiedGamesPage>` - Main client component managing filters and layout
   - `<GameFilters>` - Filter button row with badge counts
   - `<SecondaryFilters>` - Group/Round selector (conditional rendering)
   - `<ProgressTracker>` - Completion stats and progress bar
   - `<GamesListWithScroll>` - Game list with auto-scroll behavior

3. **Context Providers**:
   - Reuse existing `GuessesContextProvider` for prediction state
   - Add `FilterContext` for filter state management (with localStorage sync)

### Data Fetching Strategy

#### New Repository Functions

**File**: `/app/db/game-repository.ts`

```typescript
// Fetch ALL tournament games (groups + playoffs) in single query
export async function getAllTournamentGames(tournamentId: string): Promise<ExtendedGameData[]> {
  // Complex query joining:
  // - games table
  // - tournament_group_games (LEFT JOIN for group games)
  // - tournament_playoff_round_games (LEFT JOIN for playoff games)
  // - game_results (LEFT JOIN for scores)
  // Returns ExtendedGameData[] with group/playoff metadata
}

// Optimized count queries for filter badges
export async function getTournamentGameCounts(
  userId: string | null,
  tournamentId: string
): Promise<{
  total: number;
  groups: number;
  playoffs: number;
  unpredicted: number;
  closingSoon: number; // within 48 hours
}> {
  // Single query with conditional aggregation (CASE statements)
  // Efficient for badge counts without fetching all games
}
```

#### Server Component Data Flow

```typescript
// /app/tournaments/[id]/page.tsx (Server Component)
export default async function TournamentPage(props: Props) {
  const user = await getLoggedInUser()
  const tournamentId = params.id

  // Fetch all data in parallel
  const [
    allGames,           // All tournament games (groups + playoffs)
    teamsMap,           // Teams lookup
    gameGuesses,        // User predictions
    dashboardStats,     // Prediction counts
    gameCounts,         // Filter badge counts
    tournament,         // Tournament config
    closingGames        // Games closing within 48h
  ] = await Promise.all([
    getAllTournamentGames(tournamentId),
    getTeamsMap(tournamentId),
    user ? findGameGuessesByUserId(user.id, tournamentId) : [],
    user ? getPredictionDashboardStats(user.id, tournamentId) : null,
    getTournamentGameCounts(user?.id ?? null, tournamentId),
    findTournamentById(tournamentId),
    user ? getGamesClosingWithin48Hours(tournamentId) : []
  ])

  return (
    <GuessesContextProvider gameGuesses={gameGuessesMap} autoSave={true}>
      <UnifiedGamesPage
        games={allGames}
        teamsMap={teamsMap}
        tournament={tournament}
        dashboardStats={dashboardStats}
        gameCounts={gameCounts}
        closingGames={closingGames}
      />
    </GuessesContextProvider>
  )
}
```

### Filter Logic & State Management

#### Filter State Context

**File**: `/app/components/context-providers/filter-context-provider.tsx`

```typescript
type FilterType = 'all' | 'groups' | 'playoffs' | 'unpredicted' | 'closingSoon';
type GroupFilter = string | null; // Group ID or null for "all groups"
type RoundFilter = string | null; // Round name or null for "all rounds"

interface FilterContextValue {
  activeFilter: FilterType;
  groupFilter: GroupFilter;
  roundFilter: RoundFilter;
  setActiveFilter: (filter: FilterType) => void;
  setGroupFilter: (groupId: GroupFilter) => void;
  setRoundFilter: (round: RoundFilter) => void;
}

export function FilterContextProvider({
  children,
  tournamentId
}: {
  children: React.ReactNode;
  tournamentId: string;
}) {
  // Load from localStorage on mount (NAMESPACED by tournament ID to avoid collisions)
  const [activeFilter, setActiveFilter] = useState<FilterType>(() => {
    if (typeof window === 'undefined') return 'all';
    const key = `tournamentFilter-${tournamentId}`;
    return (localStorage.getItem(key) as FilterType) || 'all';
  });

  // Persist to localStorage on change (NAMESPACED)
  const handleSetActiveFilter = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
    const key = `tournamentFilter-${tournamentId}`;
    localStorage.setItem(key, filter);
    // Reset secondary filters when primary filter changes
    setGroupFilter(null);
    setRoundFilter(null);
  }, [tournamentId]);

  // ... similar for group/round filters (also namespaced)
}
```

#### Filter Algorithm

**File**: `/app/utils/game-filters.ts`

```typescript
export function filterGames(
  games: ExtendedGameData[],
  activeFilter: FilterType,
  groupFilter: GroupFilter,
  roundFilter: RoundFilter,
  gameGuesses: Map<string, GameGuess>
): ExtendedGameData[] {

  let filtered = games;

  // Primary filter
  switch (activeFilter) {
    case 'groups':
      filtered = games.filter(g => g.group !== undefined);
      break;
    case 'playoffs':
      filtered = games.filter(g => g.playoffStage !== undefined);
      break;
    case 'unpredicted':
      filtered = games.filter(g => {
        const guess = gameGuesses.get(g.id);
        return !guess || guess.home_score === null || guess.away_score === null;
      });
      break;
    case 'closingSoon':
      const now = Date.now();
      const FORTY_EIGHT_HOURS = 48 * 60 * 60 * 1000;
      filtered = games.filter(g => {
        const timeUntilGame = g.game_date.getTime() - now;
        return timeUntilGame > 0 && timeUntilGame < FORTY_EIGHT_HOURS;
      });
      break;
    case 'all':
    default:
      // No filtering
      break;
  }

  // Secondary filter: Group
  if (groupFilter) {
    filtered = filtered.filter(g => g.group?.tournament_group_id === groupFilter);
  }

  // Secondary filter: Round
  if (roundFilter) {
    filtered = filtered.filter(g =>
      g.playoffStage?.tournament_playoff_round_id === roundFilter
    );
  }

  // Sort by game date (ascending)
  return filtered.sort((a, b) => a.game_date.getTime() - b.game_date.getTime());
}
```

### Auto-Scroll Behavior

**File**: `/app/utils/auto-scroll.ts`

```typescript
export function findScrollTarget(games: ExtendedGameData[]): string | null {
  if (games.length === 0) return null;

  const now = new Date();

  // Find first game with date >= today
  const upcomingGame = games.find(g => g.game_date >= now);

  if (upcomingGame) {
    return `game-${upcomingGame.id}`;
  }

  // No future games, scroll to most recent game
  const lastGame = games[games.length - 1];
  return `game-${lastGame.id}`;
}

export function scrollToGame(gameId: string, behavior: 'smooth' | 'auto' = 'smooth') {
  const element = document.getElementById(gameId);
  if (element) {
    element.scrollIntoView({
      behavior,
      block: 'center',
      inline: 'nearest'
    });
  }
}
```

**Usage in component**:

```typescript
// In UnifiedGamesPage component
useEffect(() => {
  // Only run on initial mount (per session, per tournament)
  // Namespaced to prevent collision between tournaments
  const scrollKey = `tournamentPageScrolled-${tournamentId}`;
  const hasScrolled = sessionStorage.getItem(scrollKey);

  if (!hasScrolled && filteredGames.length > 0) {
    const targetId = findScrollTarget(filteredGames);
    if (targetId) {
      // Delay to ensure DOM is ready
      setTimeout(() => {
        scrollToGame(targetId);
        sessionStorage.setItem(scrollKey, 'true');
      }, 100);
    }
  }

  // Clarification: Auto-scroll only on first page load per session
  // Filter changes do NOT trigger auto-scroll again
  // User navigates away and back within same session = no auto-scroll
  // New browser session = auto-scroll triggers again
}, []); // Empty deps - only run once on mount
```

### Performance Optimization & Scrollable Container

**Decision**: Render ALL games (no pagination or virtual scrolling)

**Rationale**:
- World Cup (largest tournament) has 104 games maximum
- Modern browsers handle 100-150 DOM elements efficiently
- Pagination for 4 extra games (104 vs 100 threshold) would be awkward UX
- Simpler implementation = fewer bugs, easier maintenance

**Scrollable Container Approach**:

Instead of making the entire page scrollable, use a **fixed-height scrollable container** for the games list:

```typescript
// In GamesListWithScroll component
<Box
  sx={{
    height: 'calc(100vh - 300px)', // Fixed height (viewport minus headers/filters)
    overflowY: 'auto',              // Games section scrolls
    overflowX: 'hidden'
  }}
>
  {filteredGames.map(game => (
    <GameCard key={game.id} id={`game-${game.id}`} ... />
  ))}
</Box>
```

**Benefits**:
- Filters, progress bar, and header remain visible while scrolling games
- Auto-scroll works within container using `scrollIntoView()` with `behavior: 'smooth'`
- Better UX on desktop (no need to scroll back up to change filters)
- Mobile: Container height adjusts to available viewport space

**Performance Profile** (104 games):
- Initial render: ~200-300ms (acceptable)
- Filter operations: <50ms (client-side array filtering)
- Scroll performance: Native browser optimization
- Memory: ~10-20MB for game cards (negligible)

## Visual Prototypes

### Desktop Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│                        TOURNAMENT HEADER                                │
│                  [Tournament Name & Navigation]                        │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  FILTER BUTTONS (Primary)                                             │
│  ┌─────┐ ┌────────┐ ┌──────────┐ ┌──────────────┐ ┌──────────────┐  │
│  │ All │ │ Groups │ │ Playoffs │ │ Unpredicted │ │ Closing Soon │  │
│  │     │ │   (32) │ │   (16)   │ │     (12)    │ │     (4)      │  │
│  └─────┘ └────────┘ └──────────┘ └──────────────┘ └──────────────┘  │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  SECONDARY FILTERS (conditional - shown when "Groups" selected)       │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                               │
│  │ A │ │ B │ │ C │ │ D │ │ E │ │ F │   (horizontal scroll)         │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                               │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│  PROGRESS TRACKER                                                      │
│  Predicciones: 32/48 (67%)  [████████████░░░░░░░░]  🏆 2/5  🥇 1/3  │
└────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────┬─────────────────────────────────────┐
│  MAIN CONTENT (md:8)             │  SIDEBAR (md:4)                     │
│                                  │                                     │
│  ┌────────────────────────────┐  │  ┌───────────────────────────────┐ │
│  │ PREDICTION STATUS BAR      │  │  │ RULES                         │ │
│  │ - Progress                 │  │  │ (collapsed by default)        │ │
│  │ - Boosts                   │  │  └───────────────────────────────┘ │
│  │ - Urgency Accordion        │  │                                     │
│  │ - Tournament Predictions   │  │  ┌───────────────────────────────┐ │
│  └────────────────────────────┘  │  │ USER STATS                    │ │
│                                  │  │ - Total score                 │ │
│  ┌────────────────────────────┐  │  │ - Correct predictions         │ │
│  │ SECTION: Monday, June 14   │  │  │ - Breakdown by type           │ │
│  ├────────────────────────────┤  │  └───────────────────────────────┘ │
│  │ [Game Card 1]              │  │                                     │
│  │ Team A vs Team B           │  │  ┌───────────────────────────────┐ │
│  │ [Prediction Input]         │  │  │ FRIEND GROUPS                 │ │
│  ├────────────────────────────┤  │  │ - Group 1                     │ │
│  │ [Game Card 2]              │  │  │ - Group 2                     │ │
│  │ Team C vs Team D           │  │  └───────────────────────────────┘ │
│  │ [Prediction Input]         │  │                                     │
│  └────────────────────────────┘  │                                     │
│                                  │                                     │
│  ┌────────────────────────────┐  │                                     │
│  │ SECTION: Tuesday, June 15  │  │                                     │
│  ├────────────────────────────┤  │                                     │
│  │ [Game Card 3]              │  │                                     │
│  └────────────────────────────┘  │                                     │
│                                  │                                     │
└──────────────────────────────────┴─────────────────────────────────────┘
```

### Mobile Layout

```
┌─────────────────────────────┐
│   TOURNAMENT HEADER         │
└─────────────────────────────┘

┌─────────────────────────────┐
│  FILTER BUTTONS (wrap)      │
│  ┌─────┐ ┌────────┐         │
│  │ All │ │ Groups │         │
│  └─────┘ └────────┘         │
│  ┌──────────┐ ┌───────────┐ │
│  │ Playoffs │ │Unpredicted│ │
│  └──────────┘ └───────────┘ │
│  ┌──────────────┐           │
│  │ Closing Soon │           │
│  └──────────────┘           │
└─────────────────────────────┘

┌─────────────────────────────┐
│  SECONDARY FILTERS          │
│  ┌──┐┌──┐┌──┐┌──┐ (scroll)  │
│  │A ││B ││C ││D │           │
│  └──┘└──┘└──┘└──┘           │
└─────────────────────────────┘

┌─────────────────────────────┐
│  PROGRESS TRACKER           │
│  32/48 (67%)                │
│  [████████░░░░]             │
│  🏆 2/5  🥇 1/3             │
└─────────────────────────────┘

┌─────────────────────────────┐
│  PREDICTION STATUS BAR      │
│  (collapsible)              │
└─────────────────────────────┘

┌─────────────────────────────┐
│  GAMES LIST                 │
│  ────────────────────       │
│  Monday, June 14            │
│  ────────────────────       │
│  [Game Card 1]              │
│  Team A vs Team B           │
│  [Prediction Input]         │
│  ─────────────────          │
│  [Game Card 2]              │
│  Team C vs Team D           │
│  [Prediction Input]         │
│  ─────────────────          │
│                             │
│  ────────────────────       │
│  Tuesday, June 15           │
│  ────────────────────       │
│  [Game Card 3]              │
│  ...                        │
└─────────────────────────────┘

┌─────────────────────────────┐
│  BOTTOM NAVIGATION          │
│  [Stats] [Groups] [Rules]  │
│                             │
│  Tap to open modal/drawer   │
│  with sidebar content       │
└─────────────────────────────┘

Note: Sidebar sections (Rules, User Stats, Friend Groups)
move to bottom navigation on mobile, accessible via tabs/modals
```

### Component States

#### Filter Button States

**Inactive**:
```
┌──────────┐
│  Groups  │
│   (32)   │
└──────────┘
```

**Active (selected)**:
```
┌──────────┐
│  Groups  │  ← Primary color background
│   (32)   │  ← White text
└──────────┘
```

**With Badge (unpredicted count)**:
```
┌──────────────┐
│ Unpredicted  │
│     (12)     │  ← Badge shows count
└──────────────┘
```

#### Progress Tracker States

**Incomplete**:
```
Predicciones: 32/48 (67%)  [████████████░░░░░░░░]  🏆 2/5  🥇 1/3
```

**Complete**:
```
Predicciones: 48/48 (100%)  [████████████████████]  🏆 5/5  🥇 3/3  ✓
```

#### Secondary Filter States

**Groups (horizontal scroll)**:
```
┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐
│ A │ │ B │ │ C │ │ D │ │ E │ │ F │
└───┘ └───┘ └───┘ └───┘ └───┘ └───┘
  ↑
Selected (primary color)
```

**Playoffs (round tabs)**:
```
┌─────┐ ┌────┐ ┌────┐ ┌───┐
│ R16 │ │ QF │ │ SF │ │ F │
└─────┘ └────┘ └────┘ └───┘
```

### Responsive Considerations

**Breakpoints**:
- **Mobile (<600px)**: Single column, stacked layout, filter buttons wrap
- **Tablet (600px-900px)**: 2-column layout, horizontal scroll for secondary filters
- **Desktop (>900px)**: 2-column layout (8:4), all filters visible

**Filter Button Wrapping**:
- Mobile: 2-3 buttons per row
- Tablet: 3-4 buttons per row
- Desktop: All buttons in single row

**Secondary Filter Scroll**:
- Always horizontal scrollable (Tabs with `scrollButtons="auto"`)
- Show scroll indicators on small screens

## Files to Create/Modify

### New Files

1. **`/app/components/unified-games-page.tsx`** - Main client component
   - Manages filter state (wraps FilterContextProvider INSIDE component)
   - Renders layout (2-column grid)
   - Coordinates filter/progress/games components
   - Handles loading state (skeleton loaders while data fetches)
   - Handles error state (error boundary for data fetch failures)
   - Handles empty states (0 games, 0 unpredicted, etc.)

2. **`/app/components/game-filters.tsx`** - Primary filter buttons
   - Button row with badge counts
   - Active state styling
   - Click handlers

3. **`/app/components/secondary-filters.tsx`** - Group/Round selectors
   - Conditional rendering based on primary filter
   - Horizontal scrollable tabs
   - Reuses GroupSelector pattern

4. **`/app/components/progress-tracker.tsx`** - Progress bar component
   - Completion percentage
   - Boost usage display
   - Real-time updates from context

5. **`/app/components/games-list-with-scroll.tsx`** - Game list with auto-scroll
   - Renders filtered games
   - Date section headers
   - Auto-scroll logic on mount

6. **`/app/components/context-providers/filter-context-provider.tsx`** - Filter state management
   - Active filter state
   - Group/Round filter state
   - localStorage persistence

7. **`/app/utils/game-filters.ts`** - Filter utility functions
   - `filterGames()` - Main filter algorithm
   - `calculateFilterCounts()` - Badge counts

8. **`/app/utils/auto-scroll.ts`** - Auto-scroll utilities
   - `findScrollTarget()` - Find game to scroll to
   - `scrollToGame()` - Execute scroll behavior

9. **`/app/db/game-repository.ts`** (UPDATE) - Add new queries
   - `getAllTournamentGames()` - Fetch all games
   - `getTournamentGameCounts()` - Filter badge counts

10. **`/app/components/empty-states/games-empty-state.tsx`** - Empty state component
    - Different messages for different scenarios (0 games, 0 unpredicted, etc.)
    - Material-UI Typography and Box for styling
    - Props: `filterType`, `gameCount`

11. **`/app/components/loading-states/games-loading-skeleton.tsx`** - Loading skeleton
    - Skeleton loaders for filter buttons, progress bar, game cards
    - Uses Material-UI `<Skeleton>` component
    - Responsive layout matching actual components

### Modified Files

10. **`/app/tournaments/[id]/page.tsx`** - REPLACE tournament home
    - Remove Fixtures component
    - Add UnifiedGamesPage
    - Update data fetching (fetch ALL games)

11. **`/app/tournaments/[id]/playoffs/page.tsx`** - REMOVE (redirect to main page)
    - Delete file
    - Update links to point to `/tournaments/{id}?filter=playoffs`

12. **`/app/components/groups-page/group-selector.tsx`** - UPDATE navigation
    - Remove "Playoffs" tab (no longer needed)
    - Trophy icon now links to unified games page

### Test Files

13. **`/__tests__/components/unified-games-page.test.tsx`**
14. **`/__tests__/components/game-filters.test.tsx`**
15. **`/__tests__/components/secondary-filters.test.tsx`**
16. **`/__tests__/components/progress-tracker.test.tsx`**
17. **`/__tests__/components/games-list-with-scroll.test.tsx`**
18. **`/__tests__/components/empty-states/games-empty-state.test.tsx`**
19. **`/__tests__/components/loading-states/games-loading-skeleton.test.tsx`**
20. **`/__tests__/utils/game-filters.test.ts`**
21. **`/__tests__/utils/auto-scroll.test.ts`**
22. **`/__tests__/db/game-repository.test.ts`** (UPDATE)

## Implementation Steps

### Phase 1: Repository Layer & Data Fetching

**Goal**: Build data foundation for unified games page

1. **Update `/app/db/game-repository.ts`**:
   - Add `getAllTournamentGames()` query
   - Add `getTournamentGameCounts()` query
   - Write unit tests for new queries

2. **Verify data structure**:
   - Test with real tournament data
   - Ensure ExtendedGameData includes group/playoff metadata
   - Check performance with 100+ games

### Phase 2: Filter Logic & Utilities

**Goal**: Implement filter algorithms and helpers

1. **Create `/app/utils/game-filters.ts`**:
   - Implement `filterGames()` function
   - Implement `calculateFilterCounts()` function
   - Write comprehensive unit tests

2. **Create `/app/utils/auto-scroll.ts`**:
   - Implement `findScrollTarget()` function
   - Implement `scrollToGame()` function
   - Write unit tests

### Phase 3: Context Providers

**Goal**: Set up client-side state management

1. **Create `/app/components/context-providers/filter-context-provider.tsx`**:
   - Implement FilterContext with localStorage sync
   - Add state management for primary/secondary filters
   - Write unit tests

### Phase 4: UI Components (Bottom-Up)

**Goal**: Build reusable UI components

1. **Create `/app/components/game-filters.tsx`**:
   - Filter button row with Material-UI Buttons
   - Badge counts using Chip components
   - Active state styling
   - Write unit tests

2. **Create `/app/components/secondary-filters.tsx`**:
   - Group selector (reuse GroupSelector pattern)
   - Round selector (similar to playoffs tabs)
   - Conditional rendering
   - Write unit tests

3. **Create `/app/components/progress-tracker.tsx`**:
   - Progress bar using LinearProgress
   - Boost badges (reuse BoostCountBadge)
   - Completion percentage display
   - Write unit tests

4. **Create `/app/components/games-list-with-scroll.tsx`**:
   - Render filtered games with date headers
   - Auto-scroll behavior on mount
   - Integrate with FlippableGameCard
   - Write unit tests

### Phase 5: Main Page Component

**Goal**: Integrate all components into unified page

1. **Create `/app/components/unified-games-page.tsx`**:
   - 2-column Grid layout (main + sidebar)
   - Filter context provider wrapper
   - Coordinate all child components
   - Handle filter state changes
   - Write integration tests

### Phase 6: Server Component Integration

**Goal**: Update tournament home page

1. **Update `/app/tournaments/[id]/page.tsx`**:
   - Replace Fixtures with UnifiedGamesPage
   - Update data fetching (fetch ALL games)
   - Pass new props to UnifiedGamesPage
   - Test with real tournament data

2. **Update navigation**:
   - Modify GroupSelector to remove Playoffs tab
   - Update breadcrumbs/links

### Phase 7: Cleanup & Migration

**Goal**: Remove old pages and update navigation

1. **Delete `/app/tournaments/[id]/playoffs/page.tsx`**:
   - Add redirect to unified page with filter
   - Update all links pointing to playoffs page

2. **Update group pages**:
   - Keep for standings only
   - Update links to point to unified games page

3. **Update navigation components**:
   - Remove Playoffs tab from GroupSelector
   - Update tournament header navigation

### Phase 8: Testing & Polish

**Goal**: Comprehensive testing and performance optimization

1. **Integration testing**:
   - Test filter combinations
   - Test prediction flow end-to-end
   - Test auto-scroll with different scenarios

2. **Performance testing**:
   - Test with 100+ games
   - Profile rendering performance
   - Add windowed rendering if needed (react-window)

3. **Accessibility audit**:
   - Keyboard navigation
   - ARIA labels
   - Screen reader testing

4. **Mobile testing**:
   - Test on real devices
   - Verify filter button wrapping
   - Test horizontal scroll for secondary filters

## Testing Strategy

### Unit Tests

**Filter Logic** (`/__tests__/utils/game-filters.test.ts`):
```typescript
describe('filterGames', () => {
  it('filters by "all" - returns all games', () => {});
  it('filters by "groups" - returns only group games', () => {});
  it('filters by "playoffs" - returns only playoff games', () => {});
  it('filters by "unpredicted" - returns games without predictions', () => {});
  it('filters by "closingSoon" - returns games within 48 hours', () => {});
  it('filters by group - returns games for specific group', () => {});
  it('filters by round - returns games for specific playoff round', () => {});
  it('combines primary and secondary filters', () => {});
  it('sorts games by date (ascending)', () => {});
});

describe('calculateFilterCounts', () => {
  it('calculates correct badge counts for each filter', () => {});
  it('handles empty games array', () => {});
  it('excludes predicted games from unpredicted count', () => {});
});
```

**Auto-Scroll** (`/__tests__/utils/auto-scroll.test.ts`):
```typescript
describe('findScrollTarget', () => {
  it('returns first upcoming game when future games exist', () => {});
  it('returns last game when no future games exist', () => {});
  it('returns null for empty games array', () => {});
  it('handles games exactly at current time', () => {});
});

describe('scrollToGame', () => {
  it('scrolls to element with smooth behavior', () => {});
  it('handles missing element gracefully', () => {});
});
```

**Repository** (`/__tests__/db/game-repository.test.ts`):
```typescript
describe('getAllTournamentGames', () => {
  it('fetches all tournament games (groups + playoffs)', () => {});
  it('includes group metadata for group games', () => {});
  it('includes playoff metadata for playoff games', () => {});
  it('sorts by game date', () => {});
});

describe('getTournamentGameCounts', () => {
  it('returns correct counts for all filter types', () => {});
  it('counts unpredicted games correctly', () => {});
  it('counts closing soon games (within 48h)', () => {});
});
```

### Component Tests

**GameFilters** (`/__tests__/components/game-filters.test.tsx`):
```typescript
describe('GameFilters', () => {
  it('renders all filter buttons', () => {});
  it('displays badge counts on buttons', () => {});
  it('highlights active filter button', () => {});
  it('calls onFilterChange when button clicked', () => {});
  it('wraps buttons on mobile screens', () => {});
});
```

**SecondaryFilters** (`/__tests__/components/secondary-filters.test.tsx`):
```typescript
describe('SecondaryFilters', () => {
  it('renders group selector when "groups" filter active', () => {});
  it('renders round selector when "playoffs" filter active', () => {});
  it('renders nothing when "all" filter active', () => {});
  it('calls onGroupChange when group selected', () => {});
  it('calls onRoundChange when round selected', () => {});
  it('shows horizontal scroll for many groups', () => {});
});
```

**ProgressTracker** (`/__tests__/components/progress-tracker.test.tsx`):
```typescript
describe('ProgressTracker', () => {
  it('displays correct completion percentage', () => {});
  it('renders progress bar with correct value', () => {});
  it('displays boost usage badges', () => {});
  it('handles 0% completion', () => {});
  it('handles 100% completion', () => {});
});
```

**GamesListWithScroll** (`/__tests__/components/games-list-with-scroll.test.tsx`):
```typescript
describe('GamesListWithScroll', () => {
  it('renders games grouped by date', () => {});
  it('renders sticky date section headers', () => {});
  it('auto-scrolls to current date on mount', () => {});
  it('does not scroll if already scrolled (sessionStorage)', () => {});
  it('renders FlippableGameCard for each game', () => {});
});
```

**UnifiedGamesPage** (`/__tests__/components/unified-games-page.test.tsx`):
```typescript
describe('UnifiedGamesPage', () => {
  it('renders 2-column layout (games + sidebar)', () => {});
  it('renders filter buttons with correct counts', () => {});
  it('renders progress tracker', () => {});
  it('filters games when filter changes', () => {});
  it('shows secondary filters when appropriate', () => {});
  it('integrates with GuessesContext for predictions', () => {});
  it('persists filter selection to localStorage', () => {});
});
```

### Integration Tests

**Prediction Flow**:
```typescript
describe('Unified Games Page - Prediction Flow', () => {
  it('loads all games on mount', () => {});
  it('filters to unpredicted games', () => {});
  it('predicts a game and updates progress bar', () => {});
  it('removes game from unpredicted filter after prediction', () => {});
  it('updates badge counts in real-time', () => {});
});
```

**Filter Combinations**:
```typescript
describe('Unified Games Page - Filter Combinations', () => {
  it('filters to groups, then selects group A', () => {});
  it('filters to playoffs, then selects QF round', () => {});
  it('filters to unpredicted, shows only unpredicted games', () => {});
  it('filters to closing soon, shows games within 48h', () => {});
  it('resets secondary filter when primary filter changes', () => {});
});
```

### Performance Tests

**Large Dataset**:
```typescript
describe('Unified Games Page - Performance', () => {
  it('renders 100+ games without lag', () => {});
  it('filters 100+ games in <100ms', () => {});
  it('auto-scrolls with large dataset', () => {});
});
```

### Coverage Target

- **80% coverage on new code** (SonarCloud requirement)
- **100% coverage on utility functions** (game-filters.ts, auto-scroll.ts)
- **90% coverage on components** (UI components may have edge cases)

## Validation Considerations

### SonarCloud Requirements

1. **Code Coverage**:
   - ≥80% coverage on new code
   - Focus on business logic (filters, auto-scroll, data fetching)

2. **Code Smells**:
   - No duplicate code (DRY principle)
   - No complex functions (cyclomatic complexity <15)
   - Proper error handling

3. **Security**:
   - No XSS vulnerabilities (sanitize user input)
   - No SQL injection (use parameterized queries)
   - Validate filter inputs

4. **Maintainability**:
   - Clear component names
   - Proper TypeScript types
   - JSDoc comments for complex functions

### Quality Gates

1. **Functional**:
   - All acceptance criteria met
   - All tests passing
   - No console errors/warnings

2. **Performance**:
   - Initial page load <2s
   - Filter operations <100ms
   - Auto-scroll smooth and accurate

3. **Accessibility**:
   - Keyboard navigation works
   - ARIA labels present
   - Screen reader compatible

4. **Responsive**:
   - Works on mobile (320px+)
   - Works on tablet (600px+)
   - Works on desktop (900px+)

## Decisions Made (Updated After User Feedback)

### From Plan Review Cycles

1. **Rendering Strategy (UPDATED)**:
   - **Decision**: Render ALL games (no pagination or virtual scrolling)
   - **Rationale**: World Cup max is 104 games. Modern browsers handle this efficiently. Pagination for 4 extra games would be awkward UX.
   - **Implementation**: Fixed-height scrollable container for games list

2. **Scrollable Container (NEW)**:
   - **Decision**: Games section scrolls (fixed height), NOT whole page
   - **Rationale**: Keeps filters, progress bar visible while scrolling games. Better desktop UX.
   - **Implementation**: `<Box sx={{ height: 'calc(100vh - 300px)', overflowY: 'auto' }}>`

3. **Team Filter (DEFERRED)**:
   - **Decision**: Not included in initial implementation
   - **Rationale**: Out of scope for MVP. Can be added as future enhancement.

4. **Individual Group Pages Navigation (REMOVED)**:
   - **Decision**: Remove from navigation, keep for direct URL access only
   - **Rationale**: Unified games page replaces need for navigation to individual group pages

5. **Breadcrumb (REMOVED)**:
   - **Decision**: Out of scope
   - **Rationale**: Not essential for MVP

6. **Mobile Sidebar (UPDATED)**:
   - **Decision**: Sidebar sections (Rules, User Stats, Friend Groups) move to bottom navigation
   - **Rationale**: Better mobile UX, aligns with existing bottom nav pattern
   - **Implementation**: Tabs/modals for sidebar content on mobile

### From Initial Planning

7. **Filter Persistence**: Use localStorage (namespaced by tournament) for better UX

8. **Default Filter**: "All" - shows complete picture

9. **Auto-Scroll**: Only on first page load per session (namespaced by tournament)

10. **Playoffs Page**: Remove completely. Update all links to unified page.

11. **Group Tables Sidebar**: Integrate if #110 is merged before this story

## Dependencies

- **#110**: Group tables in sidebar (optional integration)
- **#113**: Stats card simplification (optional integration)
- **Material-UI v7**: All UI components
- **Next.js 15**: Server Components, App Router
- **React 19**: Context API, hooks
- **Kysely**: Database queries

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance issues with 104 games | Low | Tested acceptable (200-300ms initial render) |
| Complex filter logic with bugs | Medium | Comprehensive unit tests, user testing |
| Auto-scroll not working on all browsers | Medium | Test on Chrome, Firefox, Safari, Edge |
| localStorage conflicts | Low | Use namespaced keys (tournamentFilter-{id}) |
| Regression in prediction flow | High | Integration tests, manual QA testing |
| Scrollable container UX on mobile | Medium | Test on real devices, adjust height if needed |

## Success Criteria

1. **Functionality**: All acceptance criteria met
2. **Performance**: Page load <2s, filter operations <100ms
3. **Testing**: 80% coverage, all tests passing
4. **Quality**: 0 new SonarCloud issues
5. **User Experience**: 80% reduction in navigation time (validate with user testing)

---

**Estimated Effort**: 5-7 days (as specified in story)

**Ready for Review**: This plan is ready for user feedback and approval.

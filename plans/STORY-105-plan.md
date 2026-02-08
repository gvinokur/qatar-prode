# Implementation Plan: Story #105

**Title:** [UXI] Modernize Group Standings Table with Card-Based UI

**Story Link:** https://github.com/gvinokur/qatar-prode/issues/105

---

## Story Context & Objectives

### Problem Statement
The current tournament group standings table (`GroupTable` component) uses a traditional HTML table layout that:
- Looks outdated compared to the modern friend groups leaderboard
- Has an unnecessary "Tabla de Pronosticos" (predictions table) toggle that's no longer needed
- Is not easily reusable in different width contexts (e.g., sidebar on main tournament page)
- Lacks rank change animation support

### Goals
1. **Modernize UI**: Refactor group standings to use the card-based LeaderboardCard pattern
2. **Remove predictions toggle**: Eliminate predictions/actual standings toggle - only show actual standings
3. **Responsive design**: Component adapts to its container width for reuse in different contexts
4. **Animation support**: Leverage existing RankChangeIndicator for future rank change functionality

### Success Criteria
- Tournament group standings use modern card-based UI matching friend groups leaderboard
- Predictions table toggle is completely removed
- Component works in narrow sidebar and full-width contexts
- Rank change indicators are supported (even without rank change logic implemented)
- All team information is displayed clearly (position, name, points, stats)
- Mobile-responsive design
- Smooth animations for card interactions

---

## Acceptance Criteria

From the original issue:
- [ ] Tournament group standings use card-based UI matching friend groups leaderboard
- [ ] Predictions table toggle is removed (only show actual standings)
- [ ] Component adapts to container width (works in sidebar and main views)
- [ ] Rank change indicators are supported (even if rank change logic not yet implemented)
- [ ] Each team card shows: position, team name, points, goal difference, qualified status
- [ ] Expandable details show: wins, draws, losses, goals for/against
- [ ] Maintains current highlighting for qualified teams
- [ ] Mobile-responsive (works well on all screen sizes)
- [ ] Smooth animations for card interactions (hover, expand/collapse)

---

## Technical Approach

### Architecture Overview

We will refactor the `GroupTable` component to adopt the modern card-based pattern from `LeaderboardCard`, while maintaining the team standings domain logic.

**Key Pattern:** Create new components that parallel the leaderboard structure but are specialized for team standings:
- `TeamStandingsCards` (container - like LeaderboardCards)
- `TeamStandingCard` (individual card - like LeaderboardCard)
- Reuse existing `RankChangeIndicator` (no changes needed)

### Data Flow

```
GroupTable (refactored)
  ├── TeamStandingsCards (new container component)
  │     ├── State: expandedCardId, sortBy (future)
  │     ├── Transform: TeamStats[] → TeamStanding[]
  │     ├── Layout: Framer Motion LayoutGroup
  │     └── Cards: TeamStandingCard[]
  │
  └── TeamStandingCard (new individual card)
        ├── Header: Rank badge + Team logo/name + Points
        ├── RankChangeIndicator (existing component)
        ├── Expandable: Win/Draw/Loss/GF/GA stats
        └── Highlight: Qualified teams (background color)
```

### Data Transformation

**Input:** `TeamStats[]` from existing API
```typescript
interface TeamStats {
  team_id: string
  games_played: number
  points: number
  win: number
  draw: number
  loss: number
  goals_for: number
  goals_against: number
  goal_difference: number
  conduct_score: number
  is_complete: boolean
}
```

**Transform to:** `TeamStanding` (new interface)
```typescript
interface TeamStanding {
  id: string              // team_id
  position: number        // calculated rank
  team: Team              // from teamsMap
  points: number
  goalDifference: number  // goal_difference
  isQualified: boolean    // from qualifiedTeams
  // Detail stats (for expanded view)
  gamesPlayed: number
  wins: number            // win
  draws: number           // draw
  losses: number          // loss
  goalsFor: number        // goals_for
  goalsAgainst: number    // goals_against
  // Future rank change support
  previousPosition?: number
}
```

### Component Structure

#### 1. TeamStandingsCards (Container)

**Location:** `/app/components/groups-page/team-standings-cards.tsx`

**Purpose:** Container that manages state, transforms data, and coordinates animations.

**Key Features:**
- Framer Motion LayoutGroup for coordinated animations
- Manages `expandedCardId` state (only one card expanded at a time)
- Transforms TeamStats[] to TeamStanding[]
- Calculates positions using competition ranking (ties get same rank)
- Future-ready for rank change data (previousPosition)
- Responsive max-width: 1000px (matches LeaderboardCards)

**Props:**
```typescript
interface TeamStandingsCardsProps {
  teamStats: TeamStats[]
  teamsMap: { [key: string]: Team }
  qualifiedTeams: Team[]  // Array of qualified Team objects (matches current GroupTable API)
  // Future rank change support
  previousTeamStats?: TeamStats[]
}
```

#### 2. TeamStandingCard (Individual Card)

**Location:** `/app/components/groups-page/team-standing-card.tsx`

**Purpose:** Individual team card with expand/collapse and animations.

**Visual Structure:**
```
┌─────────────────────────────────────────────────┐
│  [#1] [Team Logo] Team Name            24 pts   │
│         ↑ +2 (rank change indicator)            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Goal Difference: +5                            │
│  Tap to view details                            │
│                                                  │
│  [Expanded - only when clicked]                 │
│  ┌──────────────────────────────────────────┐  │
│  │ Stats                                     │  │
│  │ Games Played: 3                           │  │
│  │ Wins: 2 | Draws: 1 | Losses: 0            │  │
│  │ Goals For: 7 | Goals Against: 2           │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Key Features:**
- Card with motion animations (Framer Motion)
- Rank badge with RankChangeIndicator
- Team logo/flag display
- Primary: Team name, position, points
- Secondary: Goal difference (always visible)
- Qualified teams: Semi-transparent success background
- Expandable details: Games, W/D/L, GF/GA
- Hover effect: slight lift, shadow increase
- Keyboard accessible (Enter/Space to expand)

**Props:**
```typescript
interface TeamStandingCardProps {
  standing: TeamStanding
  isExpanded: boolean
  onToggleExpand: () => void
  rankChange?: number  // Positive = improved, negative = declined, 0 = no change
}
```

#### 3. GroupTable (Refactored)

**Location:** `/app/components/groups-page/group-table.tsx` (modify existing)

**Changes:**
- Remove predictions table toggle logic
- Remove GuessesContext dependency
- Remove prediction-related props (isPredictions, qualifiedTeamGuesses, realPositions)
- Simplify to only show actual standings using TeamStandingsCards
- Keep Paper wrapper for consistent page styling

**New implementation:**
```typescript
export default function GroupTable({
  teamStats,
  teamsMap,
  qualifiedTeams,
  // Future: previousTeamStats for rank changes
}: GroupTableProps) {
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Standings
      </Typography>
      <TeamStandingsCards
        teamStats={teamStats}
        teamsMap={teamsMap}
        qualifiedTeams={qualifiedTeams}
      />
    </Paper>
  )
}
```

### Styling Approach

**Following LeaderboardCard patterns:**
- `elevation` for card depth (hover: increase to 3)
- `alpha()` for semi-transparent backgrounds (qualified teams: success.main @ 0.1 alpha)
- Hover effects: `translateY(-2px)`, increased elevation
- Focus state: `2px solid primary.main` outline
- Responsive spacing: `py: 1.5, px: 2` for cards
- Typography hierarchy: h6 for points, body1 for name, body2 for stats

**Color scheme:**
- Qualified teams: `alpha(theme.palette.success.main, 0.1)` background
- Rank badge: primary color circle
- RankChangeIndicator: green (up), red (down), gray (no change)

### Animation Details

**Using Framer Motion:**
- LayoutGroup wraps all cards for coordinated layout animations
- AnimatePresence for expand/collapse transitions
- Collapse component for expandable details (300ms timeout)
- Card hover animation: `whileHover={{ scale: 1.01 }}`
- Layout transition: `layout` prop for automatic position animations

### Rank Change Support (Future-Ready)

**Current Implementation:**
- Always pass `undefined` for previousPosition
- RankChangeIndicator shows no change (gray dash)

**Future Enhancement:**
- Pass `previousTeamStats` prop to calculate rank changes
- Use `calculateRanksWithChange()` from rank-calculator.ts
- RankChangeIndicator automatically displays up/down arrows with numbers

### Responsive Breakpoints (Clarified)

**Container Strategy:**
- Container fills available width (100%)
- Max-width constraint: 1000px (matches LeaderboardCards)
- Centered with auto margins when width > 1000px

**Breakpoints:**
- **< 600px (Mobile):**
  - Compact card layout
  - Essential info: position, team, points, goal difference
  - Hide secondary details in card header
  - Stack all elements vertically
  - Smaller typography and spacing

- **600px - 960px (Tablet):**
  - Medium card layout
  - Show more details inline
  - Slightly larger spacing
  - Hybrid horizontal/vertical layout

- **> 960px (Desktop):**
  - Full card layout with all details
  - Horizontal layout for primary info
  - Maximum spacing and typography sizes
  - Descriptive labels

**Sidebar Context (<400px):**
- Ultra-compact mode triggered by container width
- Abbreviated team names (first 3-4 chars)
- Minimal padding (py: 1, px: 1)
- Hide rank change indicators (only show dash)

### Current GroupTable API (Verified)

**Existing Props (to be removed):**
```typescript
interface GroupTableProps {
  isPredictions: boolean           // REMOVE: Toggle between predictions/actual
  teamsMap: { [k: string]: Team }  // KEEP
  qualifiedTeams?: Team[]          // KEEP (note: Team[], not Set)
  qualifiedTeamGuesses?: Team[]    // REMOVE: For predictions
  realPositions: TeamStats[]       // RENAME to teamStats
}
```

**New Simplified Props:**
```typescript
interface GroupTableProps {
  teamStats: TeamStats[]           // Renamed from realPositions
  teamsMap: { [k: string]: Team }
  qualifiedTeams?: Team[]          // Keep as optional array
}
```

**Current Usages (Verified):**
1. `/app/tournaments/[id]/groups/[group_id]/page.tsx` - Tournament group page (PRIMARY)
2. `/app/tournaments/[id]/friend-groups/[group_id]/page.tsx` - Friend group standings
3. `/app/friend-groups/[id]/page.tsx` - Friend group detail
4. `/app/components/backoffice/group-backoffice-tab.tsx` - Admin interface
5. `__tests__/components/friend-groups/friends-group-table.test.tsx` - Tests

**Migration Impact:**
- All 5 usages need props updated
- Remove GuessesProvider wrappers where used
- TypeScript will catch any missed updates

---

## Visual Prototypes

### Mobile View (< 600px)

```
┌─────────────────────────┐
│  ┌───────────────────┐  │
│  │ [1] 🏴 England     │  │
│  │ 7 pts    ━ GD: +5 │  │
│  │ (Qualified)        │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ [2] 🇺🇸 USA        │  │
│  │ 4 pts    ━ GD: +1 │  │
│  │ (Qualified)        │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │ [3] 🇦🇷 Argentina  │  │
│  │ 3 pts    ━ GD: 0  │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

**Mobile Features:**
- Compact card layout, 100% width
- Essential info only: position, team, points, GD
- Qualified badge below name
- Tap to expand for detailed stats
- Stack cards vertically with small gaps

### Desktop View (> 960px)

```
┌──────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────────┐  │
│  │  [1] 🏴 England                         7 points    │  │
│  │      ↑ +2 (since last matchday)                     │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  Goal Difference: +5  •  Qualified                  │  │
│  │  Tap to view detailed stats                         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [2] 🇺🇸 USA                            4 points    │  │
│  │      ⬆ +1                                            │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  Goal Difference: +1  •  Qualified                  │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  [3] 🇦🇷 Argentina                      3 points    │  │
│  │      ━ 0                                             │  │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │
│  │  Goal Difference: 0                                 │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Desktop Features:**
- Wider cards with more breathing room
- Rank change indicator with label
- Qualified badge inline with GD
- Horizontal layout for primary info
- More descriptive labels

### Expanded Card State

```
┌────────────────────────────────────────────────────┐
│  [1] 🏴 England                         7 points    │
│      ↑ +2 (since last matchday)                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Goal Difference: +5  •  Qualified                  │
│  Tap to collapse                                    │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Detailed Stats                                  │ │
│  │                                                 │ │
│  │ Games Played: 3                                 │ │
│  │                                                 │ │
│  │ Record                                          │ │
│  │ • Wins: 2                                       │ │
│  │ • Draws: 1                                      │ │
│  │ • Losses: 0                                     │ │
│  │                                                 │ │
│  │ Goals                                           │ │
│  │ • Goals For: 7                                  │ │
│  │ • Goals Against: 2                              │ │
│  └────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
```

**Expanded Features:**
- Smooth 300ms collapse animation
- Organized sections: Record, Goals
- Only one card expanded at a time
- Click card or press Enter/Space to toggle

### Responsive Container (Sidebar Context)

```
Sidebar (350px width):
┌─────────────────┐
│ Group A         │
│ ┌─────────────┐ │
│ │ [1] ENG     │ │
│ │ 7 pts  ━    │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ [2] USA     │ │
│ │ 4 pts  ━    │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ [3] ARG     │ │
│ │ 3 pts  ━    │ │
│ └─────────────┘ │
└─────────────────┘
```

**Sidebar Adaptations:**
- Ultra-compact card layout
- Abbreviated team names
- Minimal spacing
- Essential info only
- Scrollable if many teams

---

## Files to Create

### New Components

1. **`/app/components/groups-page/team-standings-cards.tsx`**
   - Container component for team standings
   - Manages state (expanded card)
   - Transforms TeamStats[] to TeamStanding[]
   - Calculates ranks using competition ranking
   - Wraps cards in LayoutGroup for animations

2. **`/app/components/groups-page/team-standing-card.tsx`**
   - Individual team card component
   - Displays team info with expand/collapse
   - Uses RankChangeIndicator
   - Qualified team highlighting
   - Keyboard accessible interactions

3. **`/app/components/groups-page/types.ts`**
   - TypeScript interfaces for team standings
   - TeamStanding interface
   - TeamStandingsCardsProps interface
   - TeamStandingCardProps interface

---

## Files to Modify

1. **`/app/components/groups-page/group-table.tsx`**
   - **Change:** Refactor to use TeamStandingsCards instead of MUI Table
   - **Remove:** Predictions table toggle logic and UI
   - **Remove:** GuessesContext dependency
   - **Remove:** Props: isPredictions, qualifiedTeamGuesses, realPositions
   - **Simplify:** Props to only teamStats, teamsMap, qualifiedTeams
   - **Update:** Component to render TeamStandingsCards in Paper wrapper

2. **`/app/tournaments/[id]/groups/[group_id]/page.tsx`**
   - **Change:** Remove predictions-related props when calling GroupTable
   - **Remove:** GuessesProvider wrapper (no longer needed)
   - **Simplify:** Pass only teamStats, teamsMap, qualifiedTeams to GroupTable
   - **Keep:** All data fetching logic unchanged

---

## Files to Reference (No Changes)

These files provide patterns and utilities to follow:

1. **`/app/components/leaderboard/LeaderboardCard.tsx`**
   - Reference for card structure and styling
   - Animation patterns with Framer Motion
   - Expand/collapse interaction handling
   - Hover and focus states

2. **`/app/components/leaderboard/LeaderboardCards.tsx`**
   - Reference for container structure
   - State management (expandedCardId)
   - LayoutGroup usage
   - Data transformation pattern

3. **`/app/components/leaderboard/RankChangeIndicator.tsx`**
   - Reuse as-is for rank change display
   - No modifications needed
   - Already supports up/down/no-change states

4. **`/app/utils/rank-calculator.ts`**
   - Use `calculateRanks()` for position calculation
   - Handles ties with competition ranking (1-2-2-4)
   - Future: `calculateRanksWithChange()` for rank deltas

---

## Implementation Steps

### Step 1: Create Type Definitions
**File:** `/app/components/groups-page/types.ts`

1. Define `TeamStanding` interface with all team data fields
2. Define `TeamStandingsCardsProps` interface
3. Define `TeamStandingCardProps` interface
4. Export all interfaces

**Testing:** TypeScript compilation passes

---

### Step 2: Create TeamStandingCard Component
**File:** `/app/components/groups-page/team-standing-card.tsx`

1. Create functional component with TeamStandingCardProps
2. Implement card structure with motion.div wrapper
3. Add rank badge with position number
4. Add team display (logo/flag + name)
5. Add points display (prominent h6 typography)
6. Add RankChangeIndicator (pass previousPosition)
7. Add goal difference display (always visible)
8. Add qualified team highlighting (success background with alpha)
9. Implement Collapse component for expandable details
10. Add detailed stats section (games, W/D/L, GF/GA)
11. Add hover animation (translateY, elevation)
12. Add keyboard accessibility (onKeyDown for Enter/Space)
13. Add responsive styling (mobile vs desktop)

**Testing:**
- Render in isolation with mock data
- Test expand/collapse interaction
- Test keyboard navigation
- Verify qualified team styling

---

### Step 3: Create TeamStandingsCards Container
**File:** `/app/components/groups-page/team-standings-cards.tsx`

1. Create functional component with TeamStandingsCardsProps
2. Add state for expandedCardId
3. Import calculateRanks from rank-calculator
4. Implement data transformation function:
   - **Pre-sort teamStats** by points DESC, then goal_difference DESC
   - Use calculateRanks() with 'points' field to add ranks
   - Map to TeamStanding[] format
   - Map team data from teamsMap
   - Check qualification status (find team in qualifiedTeams array)
   - Calculate rank change if previousTeamStats provided
5. Wrap in LayoutGroup from Framer Motion
6. Map over standings to render TeamStandingCard components
7. Pass isExpanded, onToggleExpand, and rankChange to each card
8. Add responsive container styling (width: 100%, max-width: 1000px)
9. Handle empty state (no teams) with message
10. Add mutual exclusion (only one card expanded at a time)

**Key Implementation Detail:**
```typescript
// Pre-sort for tiebreaking (calculateRanks only looks at one field)
const sorted = [...teamStats].sort((a, b) => {
  if (b.points !== a.points) return b.points - a.points
  return b.goal_difference - a.goal_difference
})

// Add ranks (competition ranking for ties)
const ranked = calculateRanks(sorted, 'points')

// Transform to TeamStanding format
const standings: TeamStanding[] = ranked.map(stats => ({
  id: stats.team_id,
  position: stats.currentRank,
  team: teamsMap[stats.team_id],
  points: stats.points,
  goalDifference: stats.goal_difference,
  isQualified: qualifiedTeams.some(t => t.id === stats.team_id),
  // ... other fields
}))
```

**Testing:**
- Render with mock team stats (standard fixture)
- Test with ties fixture (verify competition ranking 1-2-2-4)
- Test expand/collapse of multiple cards
- Verify only one card expanded at a time
- Verify tiebreaking by goal difference works

---

### Step 4: Refactor GroupTable Component
**File:** `/app/components/groups-page/group-table.tsx`

1. Remove all predictions-related logic:
   - Remove isPredictions prop and state
   - Remove toggle button UI
   - Remove GuessesContext usage
   - Remove qualifiedTeamGuesses prop
   - Remove realPositions prop
2. Simplify component props to:
   - teamStats: TeamStats[]
   - teamsMap: { [key: string]: Team }
   - qualifiedTeams: Team[]  // Array of Team objects (not Set)
3. Replace MUI Table rendering with TeamStandingsCards
4. Keep Paper wrapper for consistency
5. Update Typography header to "Standings" (remove toggle)
6. Remove prediction indicator logic (green checkmarks/red X)
7. Clean up imports (remove unused GuessesContext, etc.)

**Testing:**
- Render in actual tournament group page
- Verify standings display correctly
- Verify qualified teams highlighted
- Test responsive behavior

---

### Step 5: Update Page Component
**File:** `/app/tournaments/[id]/groups/[group_id]/page.tsx`

1. Remove GuessesProvider wrapper
2. Remove isPredictions from GroupTable props
3. Remove qualifiedTeamGuesses from GroupTable props
4. Remove realPositions from GroupTable props
5. Keep teamStats, teamsMap, qualifiedTeams props
6. Verify data fetching logic unchanged
7. Clean up imports (remove GuessesProvider if imported)

**Testing:**
- Navigate to tournament group page
- Verify standings load correctly
- Test with different groups
- Verify no console errors

---

### Step 6: Manual Testing & Visual QA

**Test Scenarios:**

1. **Desktop View (1920x1080)**
   - Navigate to tournament group page
   - Verify cards display with proper spacing
   - Click to expand card, verify smooth animation
   - Click another card, verify first card collapses
   - Hover over cards, verify lift effect
   - Verify qualified teams have success background

2. **Tablet View (768px)**
   - Resize browser to tablet width
   - Verify cards adapt to narrower width
   - Test expand/collapse interactions
   - Verify touch targets are adequate

3. **Mobile View (375px)**
   - Resize browser to mobile width
   - Verify compact card layout
   - Verify essential info visible (position, team, points, GD)
   - Test tap to expand
   - Verify scrolling works smoothly

4. **Keyboard Navigation**
   - Tab to each card
   - Press Enter to expand, Enter to collapse
   - Press Space to toggle expanded state
   - Verify focus outline visible

5. **Edge Cases**
   - Group with ties (2nd and 3rd place same points)
   - Group with no qualified teams
   - Group with all teams qualified
   - Empty group (no games played yet)

**Visual Verification:**
- [ ] Cards match LeaderboardCard aesthetic
- [ ] Qualified teams clearly highlighted
- [ ] Rank badges consistent with friend groups
- [ ] Goal difference clearly visible
- [ ] Expanded details well-organized
- [ ] Animations smooth (no jank)
- [ ] Mobile layout compact and readable
- [ ] Desktop layout spacious and professional

---

## Testing Strategy

### Unit Tests

**File:** `/app/components/groups-page/__tests__/team-standings-cards.test.tsx`

**Test Cases:**
1. **Render with team stats**
   - Renders correct number of cards
   - Displays team names correctly
   - Displays points correctly
   - Displays positions correctly

2. **Qualified team highlighting**
   - Qualified teams have success background
   - Non-qualified teams have default background

3. **Expand/collapse interaction**
   - Click card to expand
   - Click again to collapse
   - Clicking another card collapses first card
   - Only one card expanded at a time

4. **Rank calculation with ties**
   - Two teams with same points get same rank
   - Next team gets correct rank (e.g., 1-2-2-4, not 1-2-2-3)

5. **Empty state**
   - Renders empty state message when no teams

6. **Keyboard accessibility**
   - Enter key toggles expansion
   - Space key toggles expansion
   - Tab navigation works

**File:** `/app/components/groups-page/__tests__/team-standing-card.test.tsx`

**Test Cases:**
1. **Render team data**
   - Displays position badge
   - Displays team name
   - Displays points
   - Displays goal difference

2. **Expandable details**
   - Details hidden by default
   - Click to show details
   - Displays wins, draws, losses
   - Displays goals for, goals against

3. **Qualified team styling**
   - isQualified=true shows success background
   - isQualified=false shows default background

4. **Rank change indicator**
   - previousPosition undefined shows no change (dash)
   - previousPosition > position shows up arrow (improved)
   - previousPosition < position shows down arrow (declined)

### Integration Tests

**File:** `/app/components/groups-page/__tests__/group-table.test.tsx`

**Test Cases:**
1. **Refactored GroupTable renders**
   - Renders "Standings" header
   - Renders TeamStandingsCards
   - Passes correct props to TeamStandingsCards

2. **Predictions toggle removed**
   - No toggle button in UI
   - No isPredictions prop
   - Only shows actual standings

3. **Data flow**
   - teamStats prop flows to TeamStandingsCards
   - teamsMap prop flows correctly
   - qualifiedTeams prop flows correctly

### Testing Utilities

**Use existing test utilities:**
- `renderWithTheme()` from `@/__tests__/utils/test-utils` for Material-UI context
- `renderWithProviders()` if any additional providers needed
- Mock team data factories from `@/__tests__/db/test-factories`

**Mock Data Fixtures:**

**Standard Group (No Ties):**
```typescript
const mockTeamStats: TeamStats[] = [
  {
    team_id: 'team-1',
    games_played: 3,
    points: 7,
    win: 2,
    draw: 1,
    loss: 0,
    goals_for: 7,
    goals_against: 2,
    goal_difference: 5,
    conduct_score: 0,
    is_complete: true,
  },
  {
    team_id: 'team-2',
    games_played: 3,
    points: 4,
    win: 1,
    draw: 1,
    loss: 1,
    goals_for: 4,
    goals_against: 3,
    goal_difference: 1,
    conduct_score: 0,
    is_complete: true,
  },
  {
    team_id: 'team-3',
    games_played: 3,
    points: 3,
    win: 1,
    draw: 0,
    loss: 2,
    goals_for: 3,
    goals_against: 5,
    goal_difference: -2,
    conduct_score: 0,
    is_complete: true,
  },
  {
    team_id: 'team-4',
    games_played: 3,
    points: 1,
    win: 0,
    draw: 1,
    loss: 2,
    goals_for: 2,
    goals_against: 6,
    goal_difference: -4,
    conduct_score: 0,
    is_complete: true,
  },
]

const mockTeamsMap = {
  'team-1': { id: 'team-1', name: 'England', code: 'ENG' },
  'team-2': { id: 'team-2', name: 'USA', code: 'USA' },
  'team-3': { id: 'team-3', name: 'Argentina', code: 'ARG' },
  'team-4': { id: 'team-4', name: 'Wales', code: 'WAL' },
}

const mockQualifiedTeams = [
  mockTeamsMap['team-1'],
  mockTeamsMap['team-2']
]
```

**Group with Ties (2nd and 3rd place):**
```typescript
const mockTeamStatsWithTies: TeamStats[] = [
  { team_id: 'team-1', points: 7, goal_difference: 5, games_played: 3, win: 2, draw: 1, loss: 0, goals_for: 7, goals_against: 2, conduct_score: 0, is_complete: true },
  { team_id: 'team-2', points: 4, goal_difference: 2, games_played: 3, win: 1, draw: 1, loss: 1, goals_for: 5, goals_against: 3, conduct_score: 0, is_complete: true },
  { team_id: 'team-3', points: 4, goal_difference: 0, games_played: 3, win: 1, draw: 1, loss: 1, goals_for: 3, goals_against: 3, conduct_score: 0, is_complete: true },
  { team_id: 'team-4', points: 1, goal_difference: -7, games_played: 3, win: 0, draw: 1, loss: 2, goals_for: 2, goals_against: 9, conduct_score: 0, is_complete: true },
]
// Expected ranks: 1, 2, 2, 4 (not 1, 2, 2, 3)
// team-2 ranks above team-3 due to better GD (tiebreaker)
```

**Empty Group (No Games Played):**
```typescript
const mockEmptyGroup: TeamStats[] = [
  { team_id: 'team-1', points: 0, goal_difference: 0, games_played: 0, win: 0, draw: 0, loss: 0, goals_for: 0, goals_against: 0, conduct_score: 0, is_complete: false },
  { team_id: 'team-2', points: 0, goal_difference: 0, games_played: 0, win: 0, draw: 0, loss: 0, goals_for: 0, goals_against: 0, conduct_score: 0, is_complete: false },
  { team_id: 'team-3', points: 0, goal_difference: 0, games_played: 0, win: 0, draw: 0, loss: 0, goals_for: 0, goals_against: 0, conduct_score: 0, is_complete: false },
  { team_id: 'team-4', points: 0, goal_difference: 0, games_played: 0, win: 0, draw: 0, loss: 0, goals_for: 0, goals_against: 0, conduct_score: 0, is_complete: false },
]
// All teams ranked 1 (all tied at 0 points)
```

**Group with All Teams Qualified:**
```typescript
const mockAllQualified = [
  mockTeamsMap['team-1'],
  mockTeamsMap['team-2'],
  mockTeamsMap['team-3'],
  mockTeamsMap['team-4'],
]
// All cards should have success background
```

**Group with No Qualified Teams:**
```typescript
const mockNoQualified: Team[] = []
// No cards should have success background
```


### Framer Motion Testing Notes

**Challenge:** Framer Motion animations are difficult to test directly.

**Strategy:**
- Focus tests on component logic, not animation behavior
- Mock Framer Motion components if needed:
  ```typescript
  jest.mock('framer-motion', () => ({
    motion: {
      div: 'div',  // Render as plain div in tests
    },
    LayoutGroup: ({ children }: any) => children,
    AnimatePresence: ({ children }: any) => children,
  }))
  ```
- Use `@testing-library/user-event` for realistic interactions
- Test data transformations and state changes, not animations
- Visual animations verified in manual testing (Step 6)

### Coverage Goals

- **Target:** 80% coverage on new code (SonarCloud enforces this)
- **Focus areas:**
  - TeamStandingsCards: All branches (qualified, not qualified, expanded, collapsed)
  - TeamStandingCard: All interactions (click, keyboard, hover)
  - Rank calculation: Ties and edge cases
  - Data transformation: All field mappings
- **Exclude from coverage concerns:**
  - Framer Motion animation props (whileHover, layout, etc.)
  - Visual styling (sx props)
  - Focus coverage on business logic

---

## Validation Considerations

### SonarCloud Requirements

**Quality Gates:**
- **Coverage:** ≥80% on new code
  - Unit tests for TeamStandingsCards
  - Unit tests for TeamStandingCard
  - Integration tests for GroupTable refactor
- **Duplicated Code:** <5%
  - Reuse RankChangeIndicator (don't duplicate)
  - Reuse rank-calculator utilities
  - Follow DRY principles for card styling
- **Issues:** 0 new issues of any severity
  - Fix any code smells immediately
  - Address security hotspots
  - Resolve maintainability issues
- **Security Rating:** A
  - No XSS vulnerabilities in team name rendering
  - Sanitize any user-generated content
- **Maintainability:** B or higher
  - Keep components small and focused
  - Clear prop interfaces
  - Descriptive variable names

### Manual Validation

**Pre-commit checklist:**
1. Run `npm test` - all tests pass
2. Run `npm run lint` - no linting errors
3. Run `npm run build` - production build succeeds
4. Visual test on desktop, tablet, mobile
5. Test keyboard navigation
6. Test with real tournament data
7. Verify no console errors/warnings

**User acceptance:**
- Matches modern aesthetic of friend groups leaderboard
- Feels responsive and smooth
- Works well on mobile devices
- Qualified teams clearly distinguished
- All team stats accessible

---

## Open Questions

**None at this time.** All requirements are clear from the issue and codebase exploration.

**If any arise during implementation:**
- Use AskUserQuestion for clarifications
- Document decisions in commit messages
- Update this plan if approach changes significantly

---

## Risk Assessment

### Technical Risks

1. **Animation Performance**
   - **Risk:** Framer Motion animations may be janky with many teams
   - **Mitigation:** Use LayoutGroup efficiently, limit animations to visible area
   - **Fallback:** Reduce animation complexity if performance issues

2. **Responsive Design Complexity**
   - **Risk:** Card layout may not adapt well to very narrow sidebars
   - **Mitigation:** Test thoroughly at various breakpoints
   - **Fallback:** Ultra-compact mode for <400px widths

3. **Qualified Team Highlighting**
   - **Risk:** Success color background may not be visible enough
   - **Mitigation:** Use alpha(success.main, 0.1) for subtle but clear distinction
   - **Fallback:** Add "Qualified" badge if background not sufficient

### Migration Risks

1. **Breaking Changes to GroupTable API**
   - **Risk:** Other pages may use GroupTable with old props
   - **Mitigation:** Search codebase for all GroupTable usages before refactoring
   - **Verification:** TypeScript will catch any prop mismatches

2. **Predictions Table Users**
   - **Risk:** Users may expect predictions toggle to still exist
   - **Mitigation:** This is intentional (per issue requirements)
   - **Note:** Group qualification predictions are now separate

### Testing Gaps

1. **Real Data Edge Cases**
   - **Risk:** Mock data may not cover all real scenarios
   - **Mitigation:** Test with actual tournament data in dev environment
   - **Examples:** Unusual team names, special characters, long names

---

## Success Metrics

### Functional Success
- [ ] All acceptance criteria met
- [ ] Zero TypeScript errors
- [ ] All tests passing
- [ ] SonarCloud quality gates passed

### User Experience Success
- [ ] Cards feel modern and polished
- [ ] Animations are smooth (no jank)
- [ ] Mobile experience is excellent
- [ ] Keyboard navigation is intuitive
- [ ] Information hierarchy is clear

### Code Quality Success
- [ ] Components are reusable
- [ ] Code is well-documented
- [ ] Test coverage ≥80%
- [ ] No code duplication
- [ ] Follows existing patterns

---

## Timeline Estimate

**Phase 1:** Type definitions and TeamStandingCard (2-3 hours)
**Phase 2:** TeamStandingsCards container (2-3 hours)
**Phase 3:** GroupTable refactor (1-2 hours)
**Phase 4:** Page component updates (1 hour)
**Phase 5:** Testing (2-3 hours)
**Phase 6:** Visual QA and fixes (1-2 hours)

**Total:** ~10-14 hours of focused development time

---

## Appendix: Reference Components

### LeaderboardCard Reference

Key patterns to adopt from `/app/components/leaderboard/LeaderboardCard.tsx`:
- motion.div wrapper with layout prop
- Collapse component for expandable content
- whileHover animation
- Keyboard event handling (Enter/Space)
- Current user highlighting with alpha background
- Typography hierarchy (h6 for primary, body1/body2 for secondary)

### RankChangeIndicator Usage

From `/app/components/leaderboard/RankChangeIndicator.tsx`:

**VERIFIED API:**
```typescript
// RankChangeIndicator props: { change: number, size?: 'small' | 'medium' }

// Calculate change from previous position
const rankChange = standing.previousPosition !== undefined
  ? standing.previousPosition - standing.position  // Positive = improved (moved up)
  : 0  // No previous data = no change

<RankChangeIndicator
  change={rankChange}
  size="small"
/>
```

**Behavior:**
- `change > 0`: ↑ green (rank improved - moved to lower rank number)
- `change < 0`: ↓ red (rank declined - moved to higher rank number)
- `change === 0`: — gray (no change)
- Automatically handles display, no changes needed

### Rank Calculation Reference

From `/app/utils/rank-calculator.ts`:

**VERIFIED API:**
```typescript
import { calculateRanks } from '@/app/utils/rank-calculator'

// calculateRanks signature (takes field name, not function):
// calculateRanks<T>(users: T[], scoreField: keyof T): UserWithRank<T>[]

// For team standings, we need custom sorting with tiebreaker
// Sort by points DESC, then by goal_difference DESC
const sortedTeamStats = [...teamStats].sort((a, b) => {
  if (b.points !== a.points) return b.points - a.points
  return b.goal_difference - a.goal_difference
})

// Then calculate ranks (only looks at points field, tiebreaker handled by pre-sort)
const rankedTeams = calculateRanks(sortedTeamStats, 'points')
```

**Key Points:**
- calculateRanks() only takes a field name, not a function
- Does NOT support tiebreaker parameter - must pre-sort data
- Returns array with `currentRank` property added
- Handles ties with competition ranking (1-2-2-4)

**For Rank Change Calculation:**
```typescript
import { calculateRanksWithChange } from '@/app/utils/rank-calculator'

// If previous stats available, calculate rank changes
const rankedWithChanges = calculateRanksWithChange(
  rankedTeams,
  'yesterdayPoints' // Field name for previous score
)
// Returns array with `rankChange` added (positive = improved)
```

---

**End of Implementation Plan**

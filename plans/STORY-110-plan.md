# Implementation Plan: Show Tournament Group Standings in Sidebar (#110)

## Story Context

Add group standings directly to the tournament home page for quick reference, eliminating the need to navigate to separate group pages to check team positions.

**User Story:** As a tournament participant, I want to see group standings at a glance on the tournament home page, so that I can quickly check team positions without navigating to separate pages.

**Issue:** #110
**Labels:** UX Improvement, Visualization, Tournament Features
**Priority:** Medium

## Objectives

1. Display group standings in tournament home page sidebar (desktop) and home feed (mobile)
2. Use tabs to switch between groups (A, B, C, D...)
3. Show ultra-compact view: Position, Team Name, Points only
4. Highlight qualified teams with green background
5. Default to group with latest finished game (fallback to Group A)
6. Keep groups visible throughout tournament lifecycle

## Acceptance Criteria

- [ ] Group standings visible in desktop sidebar (right column, after UserTournamentStatistics)
- [ ] Group standings visible in mobile home feed (same position in stacked layout)
- [ ] Tabs component allows switching between all tournament groups
- [ ] Shows one group at a time in ultra-compact view (Pos, Team, Pts)
- [ ] Qualified teams have green background highlight
- [ ] Default tab shows group with latest finished game (fallback to Group A)
- [ ] Same UI/UX for both desktop and mobile (tabs + compact view)
- [ ] Follows existing card styling pattern (CardHeader with primary border, CardContent)
- [ ] Groups remain visible even after group stage ends
- [ ] Responsive and works on all screen sizes
- [ ] 80% test coverage on new code (SonarCloud requirement)

## Visual Prototype

### Desktop Sidebar View
```
┌─────────────────────────────────┐
│ USER TOURNAMENT STATISTICS      │  ← Existing component
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ GROUP STANDINGS           [📋]  │  ← New component (CardHeader)
│ ─────────────────────────────── │
│ [A] [B] [C] [D] [E] [F]         │  ← Scrollable tabs
│                                 │
│ GRUPO A                         │
│  1. ARG  9 pts    ✓             │  ← Green bg if qualified
│  2. MEX  6 pts                  │
│  3. CHI  3 pts                  │
│  4. PER  0 pts                  │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ FRIEND GROUPS                   │  ← Existing component
└─────────────────────────────────┘
```

### Mobile View (Stacked)
```
Same pattern, full width:
┌──────────────────────────────────┐
│ GROUP STANDINGS            [📋]  │
│ ────────────────────────────────│
│ [A][B][C][D][E][F]              │  ← Scrollable
│                                 │
│ GRUPO A                         │
│  1. ARG  9 pts    ✓             │
│  2. MEX  6 pts                  │
│  3. CHI  3 pts                  │
│  4. PER  0 pts                  │
└──────────────────────────────────┘
```

### Ultra-Compact Layout (Each Team Row)
```
Position | Team Short Name | Points
   #1    |     ARG        | 9 pts     [green background if qualified]
   #2    |     MEX        | 6 pts
```

**Key Visual Elements:**
- **Card Header:** "GROUP STANDINGS" with primary color and bottom border
- **Tabs:** Scrollable, rounded selection background, group letter labels
- **Team Rows:** Minimal spacing, ultra-compact font, qualified = light green background
- **Responsive:** Same pattern for desktop and mobile (no accordion needed)

## Technical Approach

### 1. New Server Action for Data Fetching

**File:** `app/actions/tournament-actions.ts`

Create new function to fetch all groups with standings data:

```typescript
export async function getGroupStandingsForTournament(tournamentId: string) {
  // 1. Fetch all tournament groups
  const groups = await findGroupsInTournament(tournamentId)

  // 2. Fetch qualified teams for entire tournament (returns teams with position and is_complete flags)
  const qualifiedTeamsResult = await findQualifiedTeams(tournamentId) // NO groupId - get ALL groups
  const qualifiedTeamIds = new Set(qualifiedTeamsResult.teams.map(t => t.id))

  // 3. For each group, fetch team standings using existing calculateGroupPosition utility
  const groupsWithStandings = await Promise.all(
    groups.map(async (group) => {
      // Fetch group's games with results
      const games = await findGamesInGroup(group.id, true, false) // completeGame=true, draftResult=false

      // Fetch teams in group
      const teams = await findTeamInGroup(group.id)
      const teamsMap = toMap(teams)
      const teamIds = teams.map(t => t.id)

      // Calculate positions using existing utility (FIFA tiebreaker rules)
      const teamStats = calculateGroupPosition(
        teamIds,
        games.map(game => ({
          ...game,
          resultOrGuess: game.gameResult // Use actual results, not guesses
        })),
        group.sort_by_games_between_teams // Use group-specific tiebreaker rules
      )

      // Transform TeamStats[] to simplified TeamStanding[] for ultra-compact view
      const standings = teamStats.map((stats, index) => ({
        id: stats.team_id,
        position: index + 1, // 1-based position
        team: teamsMap[stats.team_id],
        points: stats.points,
        goalDifference: stats.goal_difference,
        gamesPlayed: stats.games_played,
        // Only show qualified status for teams that are BOTH:
        // 1. In the qualified teams list
        // 2. Have is_complete = true (group positions finalized)
        isQualified: qualifiedTeamIds.has(stats.team_id)
      }))

      return {
        id: group.id,
        letter: group.group_letter,
        standings
      }
    })
  )

  // 4. Find latest finished game to determine default selected group
  const latestFinishedGame = await findLatestFinishedGroupGame(tournamentId)
  const defaultGroupId = latestFinishedGame?.tournament_group_id || groups[0]?.id

  return {
    groups: groupsWithStandings,
    defaultGroupId,
    qualifiedTeamIds
  }
}
```

**Helper function to find latest finished group game:**

```typescript
export async function findLatestFinishedGroupGame(tournamentId: string) {
  return await db.selectFrom('games')
    .innerJoin('tournament_group_games', 'tournament_group_games.game_id', 'games.id')
    .innerJoin('game_results', 'game_results.game_id', 'games.id')
    .where('games.tournament_id', '=', tournamentId)
    .where('game_results.is_draft', '=', false)  // Only non-draft results
    .select([
      'games.id',
      'games.game_date',
      'tournament_group_games.tournament_group_id'
    ])
    .orderBy('games.game_date', 'desc')
    .executeTakeFirst()
}
```

**Data transformation logic (reuse existing utilities):**
- **REUSE** `calculateGroupPosition()` from `app/utils/group-position-calculator.ts`
  - Handles FIFA tiebreaker rules (points → goal_difference → goals_for → conduct_score)
  - Supports `sort_by_games_between_teams` flag for group-specific rules
  - Returns `TeamStats[]` with all calculated fields
- **REUSE** `findQualifiedTeams()` from `app/db/team-repository.ts`
  - Returns qualified teams for entire tournament with `is_complete` flag
  - Handles progressive scoring (1st/2nd place immediate, 3rd place after playoff bracket)
- **TRANSFORM** `TeamStats` → simplified `TeamStanding` for ultra-compact view

### 2. New Client Component: GroupStandingsSidebar

**File:** `app/components/tournament-page/group-standings-sidebar.tsx`

```typescript
'use client'

import { Card, CardHeader, CardContent, Tabs, Tab, Typography, Box, useTheme } from '@mui/material'
import { useState } from 'react'
import { TeamStandingRow } from './team-standing-row'
import { CompactTeamStanding } from './types'

interface GroupStandingsSidebarProps {
  groups: Array<{
    id: string
    letter: string
    standings: CompactTeamStanding[]
  }>
  defaultGroupId: string
  qualifiedTeamIds: Set<string>
}

export function GroupStandingsSidebar({ groups, defaultGroupId, qualifiedTeamIds }: GroupStandingsSidebarProps) {
  const [selectedGroupId, setSelectedGroupId] = useState(defaultGroupId)
  const theme = useTheme()

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || groups[0]

  return (
    <Card>
      <CardHeader
        title="GROUP STANDINGS"
        sx={{
          color: theme.palette.primary.main,
          borderBottom: `${theme.palette.primary.light} solid 1px`
        }}
      />
      <CardContent>
        {/* Tabs for group selection */}
        <Tabs
          value={selectedGroupId}
          onChange={(_, value) => setSelectedGroupId(value)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          aria-label="Group standings selector"
          sx={tabsStyles}
        >
          {groups.map(group => (
            <Tab
              key={group.id}
              label={group.letter.toUpperCase()}
              value={group.id}
              sx={tabStyles}
            />
          ))}
        </Tabs>

        {/* Group name header */}
        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
          GRUPO {selectedGroup.letter.toUpperCase()}
        </Typography>

        {/* Standings list */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {selectedGroup.standings.map(standing => (
            <TeamStandingRow
              key={standing.id}
              standing={standing}
              isQualified={qualifiedTeamIds.has(standing.id)}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  )
}
```

**Styling details:**
- Tabs: Follow GroupSelector pattern (scrollable, auto scroll buttons, rounded selection)
- Card: Follow UserTournamentStatistics pattern (CardHeader with border, primary colors)
- Compact spacing: `gap: 0.5` between rows
- Typography: h6 for group name, body1 for team rows

### 3. New Component: TeamStandingRow (Ultra-Compact)

**File:** `app/components/tournament-page/team-standing-row.tsx`

```typescript
'use client'

import { Box, Typography, alpha, useTheme } from '@mui/material'
import { CompactTeamStanding } from './types'

interface TeamStandingRowProps {
  standing: CompactTeamStanding
  isQualified: boolean
}

export function TeamStandingRow({ standing, isQualified }: TeamStandingRowProps) {
  const theme = useTheme()

  // Handle short_name fallback - check if it exists and is not empty string
  const displayName = standing.team.short_name?.trim() || standing.team.name

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        py: 0.75,
        px: 1,
        backgroundColor: isQualified
          ? alpha(theme.palette.success.main, 0.1)
          : 'transparent',
        borderRadius: 1,
      }}
    >
      {/* Position */}
      <Typography
        variant="body1"
        sx={{
          minWidth: '24px',
          fontWeight: 'bold',
          color: 'text.secondary'
        }}
      >
        {standing.position}.
      </Typography>

      {/* Team short name */}
      <Typography
        variant="body1"
        sx={{
          flex: 1,
          fontWeight: isQualified ? 'bold' : 'normal'
        }}
      >
        {displayName}
      </Typography>

      {/* Points */}
      <Typography
        variant="body1"
        sx={{
          fontWeight: 'bold',
          color: 'text.primary'
        }}
      >
        {standing.points} pts
      </Typography>

      {/* Qualified indicator (checkmark) */}
      {isQualified && (
        <Typography
          variant="body1"
          sx={{ color: 'success.main', fontWeight: 'bold' }}
        >
          ✓
        </Typography>
      )}
    </Box>
  )
}
```

**Features:**
- Ultra-compact: Only Position, Team, Points, Qualified indicator
- Green background for qualified teams (alpha 0.1)
- Bold font for qualified team names
- Checkmark icon for qualified teams
- Responsive padding and gaps

### 4. Integration into Tournament Page

**File:** `app/tournaments/[id]/page.tsx`

**Changes:**
1. Import new server action and component
2. Fetch group standings data in server component
3. Add GroupStandingsSidebar to sidebar Grid after UserTournamentStatistics

```typescript
// Add to imports
import { GroupStandingsSidebar } from "../../components/tournament-page/group-standings-sidebar"
import { getGroupStandingsForTournament } from "../../actions/tournament-actions"

// In TournamentLandingPage function
export default async function TournamentLandingPage(props: Props) {
  // ... existing code ...

  // Fetch group standings data
  const groupStandings = await getGroupStandingsForTournament(tournamentId)

  return (
    // ... existing layout ...
    <Grid size={{ xs:12, md: 4 }}>
      <Grid container rowSpacing={2}>
        <Grid size={12}>
          <Rules ... />
        </Grid>

        {user && (
          <Grid size={12}>
            <UserTournamentStatistics ... />
          </Grid>
        )}

        {/* NEW: Group Standings Section - After UserTournamentStatistics */}
        {groupStandings.groups.length > 0 && (
          <Grid size={12}>
            <GroupStandingsSidebar
              groups={groupStandings.groups}
              defaultGroupId={groupStandings.defaultGroupId}
              qualifiedTeamIds={groupStandings.qualifiedTeamIds}
            />
          </Grid>
        )}

        {prodeGroups && (
          <Grid size={12}>
            <FriendGroupsList ... />
          </Grid>
        )}
      </Grid>
    </Grid>
  )
}
```

**Position in sidebar:** After UserTournamentStatistics, before FriendGroupsList (per story acceptance criteria: "right column, after UserTournamentStatistics")

### 5. Type Definitions

**File:** `app/components/tournament-page/types.ts` (create new file)

```typescript
import { Team } from '@/app/db/tables-definition'

/**
 * Ultra-compact team standing for sidebar display
 * NOTE: Different from groups-page/types.ts TeamStanding which has full details
 * This version only includes fields needed for ultra-compact view (Position, Team, Points)
 */
export interface CompactTeamStanding {
  id: string
  position: number  // 1-based position (1st, 2nd, 3rd, 4th)
  team: Team        // Full team object (has name and short_name)
  points: number    // Total points
  goalDifference: number  // For sorting/tiebreaking (not displayed in UI)
  gamesPlayed: number     // For context (not displayed in UI)
  isQualified: boolean    // Triggers green background
}

export interface GroupStandingsData {
  groups: Array<{
    id: string
    letter: string
    standings: CompactTeamStanding[]
  }>
  defaultGroupId: string
  qualifiedTeamIds: Set<string>
}
```

**Rationale for new type name:**
- Existing `TeamStanding` in `groups-page/types.ts` has full details (wins, draws, losses, goalsFor, goalsAgainst, conductScore)
- Sidebar needs ultra-compact version with minimal fields
- Named `CompactTeamStanding` to avoid naming conflicts
- Makes intent clear: "this is for compact display"

## Implementation Steps

### Phase 1: Data Layer (Server)
1. ✅ Create `findLatestFinishedGroupGame()` helper in `game-repository.ts`
2. ✅ Implement `getGroupStandingsForTournament()` in `tournament-actions.ts`
3. ✅ Reuse rank calculation logic from `rank-calculator.ts`
4. ✅ Transform data into TeamStanding[] format for each group
5. ✅ Determine default selected group based on latest finished game

### Phase 2: UI Components (Client)
6. ✅ Create `TeamStandingRow` component (ultra-compact variant)
7. ✅ Create `GroupStandingsSidebar` component (tabs + standings list)
8. ✅ Implement tab selection state management
9. ✅ Apply card styling pattern (CardHeader, CardContent)
10. ✅ Implement qualified team highlighting (green background)

### Phase 3: Integration
11. ✅ Add component to `tournaments/[id]/page.tsx` sidebar
12. ✅ Fetch data in server component
13. ✅ Pass data to client component as props
14. ✅ Position after Rules and before UserTournamentStatistics
15. ✅ Verify responsive behavior (desktop/mobile)

### Phase 4: Testing (Parallel with implementation)
16. ✅ Unit tests for `getGroupStandingsForTournament()` (server action)
17. ✅ Unit tests for `findLatestFinishedGroupGame()` helper
18. ✅ Unit tests for `TeamStandingRow` component (qualified highlighting, ultra-compact layout)
19. ✅ Unit tests for `GroupStandingsSidebar` component (tab switching, default selection)
20. ✅ Integration test for tournament page rendering with group standings
21. ✅ Responsive behavior tests (desktop/mobile breakpoints)
22. ✅ Edge case tests (no groups, no finished games, all playoff games)

### Phase 5: Validation
23. ✅ Run `npm test` - all tests pass
24. ✅ Run `npm run lint` - no errors
25. ✅ Run `npm run build` - successful build
26. ✅ Verify 80% coverage on new code (SonarCloud)
27. ✅ Visual testing in browser (desktop/mobile views)

## Files to Create

1. `app/components/tournament-page/group-standings-sidebar.tsx` - Main sidebar component (client)
2. `app/components/tournament-page/team-standing-row.tsx` - Ultra-compact row component (client)
3. `app/components/tournament-page/types.ts` - Type definitions (CompactTeamStanding, GroupStandingsData)

## Files to Modify

1. `app/actions/tournament-actions.ts` - Add `getGroupStandingsForTournament()` and `findLatestFinishedGroupGame()` functions
2. `app/tournaments/[id]/page.tsx` - Add GroupStandingsSidebar to sidebar layout (after UserTournamentStatistics)

## Testing Strategy

### Unit Tests (Vitest)

**Server Actions (`__tests__/actions/tournament-actions.test.ts`):**
- ✅ Test `getGroupStandingsForTournament()` returns correct group data
- ✅ Test default group selection (latest finished game)
- ✅ Test fallback to Group A when no finished games
- ✅ Test fallback to Group A when latest game is playoff
- ✅ Test qualified team ID set is correct
- ✅ Test rank calculation and sorting (points DESC, goal_difference DESC)
- ✅ Test competition ranking for ties (1-2-2-4 pattern)

**Game Repository (`__tests__/db/game-repository.test.ts`):**
- ✅ Test `findLatestFinishedGroupGame()` returns most recent finished group game
- ✅ Test excludes draft results
- ✅ Test excludes playoff games
- ✅ Test returns null when no finished games
- ✅ Test ordering by game_date DESC

**Components (`__tests__/components/tournament-page/`):**

`group-standings-sidebar.test.tsx`:
- ✅ Renders card with correct header
- ✅ Renders tabs for all groups
- ✅ Default tab matches defaultGroupId prop
- ✅ Tab click changes selected group
- ✅ Renders standings for selected group only
- ✅ Empty state handling (no groups)
- ✅ Theme colors applied correctly

`team-standing-row.test.tsx`:
- ✅ Renders position, team name, points
- ✅ Qualified team has green background
- ✅ Qualified team has checkmark icon
- ✅ Qualified team name is bold
- ✅ Uses team short_name if available, fallback to name
- ✅ Compact spacing and layout
- ✅ Accessibility (proper semantic HTML)

**Integration Tests:**

`__tests__/app/tournaments/[id]/page.test.tsx`:
- ✅ Group standings sidebar renders on tournament page
- ✅ Positioned correctly in sidebar (after Rules, before UserTournamentStatistics)
- ✅ Shows correct default group
- ✅ Tab switching works
- ✅ Qualified teams highlighted
- ✅ Responsive layout (desktop/mobile)

### Test Utilities to Use

```typescript
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { testFactories } from '@/__tests__/db/test-factories'
import { createMockSelectQuery, createMockDB } from '@/__tests__/db/mock-helpers'
```

**Mock Data Factories:**
- `testFactories.team()` - Create mock Team objects
- `testFactories.tournamentGroup()` - Create mock TournamentGroup objects
- `testFactories.game()` - Create mock Game objects
- `testFactories.teamStats()` - Create mock TeamStats objects

### Coverage Goals
- **Target:** 80% coverage on all new code (SonarCloud requirement)
- **Focus:** Server actions, client components, edge cases
- **Priority:** Business logic (rank calculation, default selection, qualified highlighting)

## Edge Cases & Considerations

### Data Edge Cases
1. **No groups exist** - Hide component entirely (conditional render)
2. **No finished games** - Default to Group A
3. **Latest finished game is playoff** - Default to Group A
4. **Ties in standings** - Use competition ranking (1-2-2-4)
5. **Group stage ended** - Groups still visible per requirements
6. **No qualified teams yet** - No green highlighting

### UI Edge Cases
1. **Many groups (>6)** - Scrollable tabs handle overflow
2. **Long team names** - Use short_name if available
3. **Mobile narrow screens** - Ultra-compact variant keeps minimal width
4. **Tab width overflow** - Scrollable tabs with scroll buttons
5. **Empty standings** - Show message "No standings available"

### Performance
- **Server-side data fetching** - No client-side loading states needed
- **Minimal re-renders** - useState for tab selection only
- **Cached queries** - Leverage existing `cache()` on repository functions

## Validation & Quality Gates

### Pre-Commit Validation (MANDATORY)
1. ✅ Run `npm test` - All tests pass
2. ✅ Run `npm run lint` - No linting errors
3. ✅ Run `npm run build` - Successful production build
4. ✅ Check for migrations - Ask user permission if needed

### SonarCloud Requirements
- ✅ 80% test coverage on new code
- ✅ 0 new issues (all severities)
- ✅ Security rating: A
- ✅ Maintainability: B or higher
- ✅ No code duplication

### Visual Verification
- ✅ Desktop sidebar layout correct
- ✅ Mobile stacked layout correct
- ✅ Tabs scrollable on narrow screens
- ✅ Qualified teams have green background
- ✅ Ultra-compact spacing maintained
- ✅ Theme colors applied consistently

## Assumptions & Open Questions

### Assumptions
1. ✅ Tournament always has at least one group
2. ✅ Groups remain visible even after group stage ends (per requirements)
3. ✅ Same UI for desktop and mobile (no Accordion needed per story clarification)
4. ✅ Position in sidebar: After UserTournamentStatistics, before FriendGroupsList (per acceptance criteria)
5. ✅ Default tab: Latest finished GROUP game (not playoff) or Group A
6. ✅ Qualified teams data: Use tournament-wide `findQualifiedTeams(tournamentId)` - returns all groups' qualified teams
7. ✅ Group position calculation: Reuse existing `calculateGroupPosition()` utility with FIFA tiebreaker rules
8. ✅ Type naming: Use `CompactTeamStanding` to avoid conflict with existing `TeamStanding` type
9. ✅ Team name display: Use `short_name?.trim()` with fallback to `name` to handle empty strings

### Questions for User (if needed)
1. ✅ **RESOLVED - Sidebar position:** After UserTournamentStatistics (per acceptance criteria)
2. ✅ **RESOLVED - Data fetching:** Reuse `calculateGroupPosition()` and `findQualifiedTeams()` utilities
3. ⏳ **Empty state:** What to show if a group has no teams assigned yet?
   - **Will show message: "No standings available"** or hide empty groups?
4. ⏳ **Default tab tiebreaker:** If multiple groups have games finishing at exact same time, which is default?
   - **Will use first group alphabetically (Group A, then B, then C...)**

## Dependencies & Related Code

### Existing Code to Reuse
- ✅ `app/utils/rank-calculator.ts` - Competition ranking logic
- ✅ `app/db/tournament-group-repository.ts` - Group queries
- ✅ `app/db/team-repository.ts` - Team queries and qualified teams
- ✅ `app/db/game-repository.ts` - Game queries
- ✅ `app/components/groups-page/team-standing-card.tsx` - Reference for styling/layout
- ✅ `app/components/groups-page/group-selector.tsx` - Reference for tabs pattern
- ✅ `app/components/tournament-page/user-tournament-statistics.tsx` - Reference for card pattern

### External Dependencies (Already in package.json)
- ✅ Material-UI v7 (Card, CardHeader, CardContent, Tabs, Tab, Typography, Box, useTheme)
- ✅ Next.js 15 (Server Components, Client Components)
- ✅ React 19
- ✅ Kysely ORM (Database queries)

### No New Dependencies Required
- All UI components available in Material-UI
- All utilities and patterns already exist in codebase
- No additional packages needed

## Risk Assessment

### Low Risk
- ✅ Reusing existing patterns (card layout, tabs, standings logic)
- ✅ Server-side data fetching (no client-side loading complexity)
- ✅ Well-defined requirements and visual prototypes
- ✅ Additive change (not modifying existing features)

### Medium Risk
- ⚠️ Default tab selection logic needs testing (edge cases: no games, playoff games)
- ⚠️ Responsive behavior on very narrow screens (ultra-compact)
- ⚠️ Performance with many groups (10+) - tabs should handle but needs verification

### Mitigation
- ✅ Comprehensive unit tests for default selection logic
- ✅ Responsive testing across breakpoints
- ✅ Edge case tests for empty/playoff scenarios
- ✅ Scrollable tabs handle overflow

## Success Metrics

### Functional Success
- ✅ All acceptance criteria met
- ✅ Users can see standings without leaving home page
- ✅ Default tab shows most relevant group
- ✅ Qualified teams clearly highlighted
- ✅ Works seamlessly on desktop and mobile

### Technical Success
- ✅ 80% test coverage achieved
- ✅ 0 SonarCloud issues
- ✅ No performance degradation
- ✅ Clean, maintainable code following existing patterns
- ✅ Successful production build
- ✅ All validation checks pass

## Timeline Estimate

**Total Effort:** ~1-2 days

**Breakdown:**
- Phase 1 (Data Layer): 2-3 hours
- Phase 2 (UI Components): 3-4 hours
- Phase 3 (Integration): 1 hour
- Phase 4 (Testing): 3-4 hours
- Phase 5 (Validation): 1 hour

**Note:** Timeline excludes user review/feedback cycles.

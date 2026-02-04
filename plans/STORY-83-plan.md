# Implementation Plan: Story #83 - Tournament Groups Overview Page

## Story Context

**Goal:** Create a consolidated tournament groups page at `/tournaments/[id]/groups` showing all friend groups with tournament-specific data.

**Route:** `/tournaments/[id]/groups`

**Key Features:**
1. List all global friend groups user participates in
2. Display tournament-specific stats for each group (position, points, leader)
3. Quick navigation to detailed group pages
4. Handle edge cases (0, 1, or many groups)
5. Quick actions: Create new group, Join group with code
6. Responsive design (mobile-first)

**Success Metrics:**
- Group discovery time: -60%
- Multi-group engagement: +40%
- Navigation efficiency: +50%

## Technical Approach

### Architecture

**Page Structure:**
- Server Component at `/app/tournaments/[id]/groups/page.tsx`
- Fetches data server-side using existing `getGroupsForUser()` and `getUserScoresForTournament()`
- Calculates tournament-specific stats for each group
- Passes data to client components for rendering

**Component Hierarchy:**
```
TournamentGroupsPage (Server)
├── TournamentGroupsList (Client)
│   ├── TournamentGroupCard × N (Client)
│   ├── EmptyGroupsState (Client)
│   └── QuickActions (Client)
```

### Data Flow

1. **Server-side data fetching:**
   - Fetch user's groups: `getGroupsForUser()` → `{ userGroups, participantGroups }`
   - For each group:
     - Get participants: `findParticipantsInGroup(groupId)`
     - Get tournament scores: `getUserScoresForTournament(userIds, tournamentId)`
     - Calculate stats: position, points, leader info
   - Return `TournamentGroupStats[]` to client component

2. **Client-side rendering:**
   - Display groups in responsive grid (2 columns desktop, 1 column mobile)
   - Handle create/join dialogs
   - Navigate to group detail pages

### New Data Structure

```typescript
// In app/definitions.ts
export interface TournamentGroupStats {
  groupId: string
  groupName: string
  isOwner: boolean
  totalParticipants: number
  userPosition: number  // 1-indexed
  userPoints: number
  leaderName: string
  leaderPoints: number
  themeColor?: string | null
}
```

## Visual Prototypes

### Desktop Layout (≥900px)
```
┌─────────────────────────────────────────────────────────────┐
│  Tournament Groups                          [Create] [Join]  │
├─────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────┐  ┌───────────────────────────┐│
│  │ 🏆 My Friends Group       │  │ 🏆 Office League          ││
│  │                           │  │                           ││
│  │ Your Position: #3 of 12   │  │ Your Position: #1 of 8    ││
│  │ Your Points: 45           │  │ Your Points: 52           ││
│  │ Leader: John (48 pts)     │  │ Leader: You! (52 pts)     ││
│  │                           │  │                           ││
│  │            [View Details →]│  │            [View Details →]││
│  └───────────────────────────┘  └───────────────────────────┘│
│  ┌───────────────────────────┐  ┌───────────────────────────┐│
│  │ 🏆 College Buddies        │  │ 🏆 Family Tournament      ││
│  │                           │  │                           ││
│  │ Your Position: #7 of 15   │  │ Your Position: #2 of 5    ││
│  │ Your Points: 32           │  │ Your Points: 41           ││
│  │ Leader: Sarah (51 pts)    │  │ Leader: Dad (43 pts)      ││
│  │                           │  │                           ││
│  │            [View Details →]│  │            [View Details →]││
│  └───────────────────────────┘  └───────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

**Layout Details:**
- Material-UI Grid v2 with `spacing={2}`
- Card-based design with `variant="outlined"`
- 2-column grid: `size={{ xs: 12, sm: 6 }}`
- Max width: 868px, centered with `mx={{md: 'auto'}}`
- Trophy emoji or EmojiEvents icon for visual consistency

### Mobile Layout (<600px)
```
┌──────────────────────────┐
│ Tournament Groups        │
│ [Create] [Join]          │
├──────────────────────────┤
│ 🏆 My Friends Group      │
│ Position: #3 / 12        │
│ Points: 45               │
│ Leader: John (48)        │
│ [View Details →]         │
├──────────────────────────┤
│ 🏆 Office League         │
│ Position: #1 / 8         │
│ Points: 52               │
│ Leader: You! (52)        │
│ [View Details →]         │
├──────────────────────────┤
│ ...                      │
└──────────────────────────┘
```

**Mobile Optimizations:**
- Single column layout: `size={{ xs: 12 }}`
- Compact card design with reduced padding
- Abbreviated text ("Position" instead of "Your Position")
- Full-width buttons
- Stack action buttons vertically if space constrained

**Internationalization Note:**
- Spanish UI strings are hardcoded in this implementation (e.g., "Ver Todos los Grupos", "Crear Nuevo Grupo")
- Consistent with existing codebase pattern (see `friend-groups-list.tsx`)
- No i18n library currently used in project
- Future enhancement: Extract strings to i18n files if internationalization is added project-wide

### Empty State (0 groups)
```
┌────────────────────────────────┐
│                                │
│       🏆                       │
│   No Groups Yet!               │
│                                │
│ Create your first group or     │
│ join an existing one to        │
│ compete with friends!          │
│                                │
│  [Create Your First Group]     │
│  [Join with Code]              │
│                                │
└────────────────────────────────┘
```

**Empty State Components:**
- Material-UI Paper with elevation={2}
- Centered content with vertical spacing
- Large emoji or EmojiEvents icon (size: 64px)
- Typography variant="h5" for heading
- Typography variant="body1" for description
- Two prominent Button components (variant="contained" and "outlined")
- Motivational, friendly tone

### Single Group Optimization (1 group)
```
┌─────────────────────────────────────────────┐
│  Your Group: My Friends Group               │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ 🏆 Tournament Stats                  │  │
│  │                                      │  │
│  │ Your Position: #3 of 12 participants│  │
│  │ Your Points: 45                      │  │
│  │ Leader: John with 48 points          │  │
│  │                                      │  │
│  │         [View Full Leaderboard →]    │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  💡 Tip: Create more groups or join        │
│     others to compete with different       │
│     friend circles!                        │
│                                             │
│  [Create Another Group] [Join Group]        │
└─────────────────────────────────────────────┘
```

**Single Group Features:**
- Larger, centered card
- More detailed statistics
- Encouragement message for multi-group participation
- Still shows create/join actions

### Card Component Detail
```
┌─────────────────────────────────┐
│ CardHeader                       │
│ ├─ Avatar: Trophy emoji         │
│ ├─ Title: "My Friends Group"    │
│ └─ Action: [options menu]       │
├─────────────────────────────────┤
│ CardContent                      │
│ ├─ Grid container (spacing 1)   │
│ │  ├─ Position: #3 of 12        │
│ │  ├─ Points: 45 pts            │
│ │  └─ Leader: John (48 pts)     │
│ └─ Divider                       │
├─────────────────────────────────┤
│ CardActions                      │
│ └─ Button: "View Details" →     │
└─────────────────────────────────┘
```

**Card Styling:**
- Border color: tournament theme primary color (if group has theme)
- Highlight if user is leader: `bgcolor: 'success.light'` with alpha 0.1
- Hover effect: slight elevation increase
- Typography: body2 for stats, caption for labels

## Files to Create

### New Files

1. **`/app/tournaments/[id]/groups/page.tsx`** - Main page (Server Component)
   - Fetch user groups and tournament stats
   - Calculate position/points/leader for each group
   - Pass data to client component
   - Handle authentication and permissions

2. **`/app/components/tournament-page/tournament-groups-list.tsx`** - Container (Client)
   - Render group cards in responsive grid
   - Manage create/join dialog state
   - Show empty state if no groups
   - Props: `groups`, `tournamentId`, `userId`, `userName`

3. **`/app/components/tournament-page/tournament-group-card.tsx`** - Individual card (Client)
   - Display group stats (position, points, leader)
   - Highlight if user is leader
   - Link to group detail page (`/friend-groups/[id]?tournamentId={tournamentId}`)
   - Props: `group`, `tournamentId`, `isCurrentUserLeader`

4. **`/app/components/tournament-page/empty-groups-state.tsx`** - Empty state (Client)
   - Motivational messaging
   - CTAs for create/join groups
   - Props: `tournamentId`, `onCreateGroup`, `onJoinGroup`

5. **`/app/components/tournament-page/join-group-dialog.tsx`** - Join dialog (Client)
   - Input field for group code (UUID format)
   - Validate format before navigating
   - Navigate to `/friend-groups/join/[id]`
   - Props: `open`, `onClose`, `tournamentId`

### Test Files

6. **`/__tests__/app/tournaments/[id]/groups/page.test.tsx`**
   - Test data fetching and stats calculation
   - Test authentication requirements
   - Test error handling

7. **`/__tests__/components/tournament-page/tournament-groups-list.test.tsx`**
   - Test multiple groups rendering
   - Test empty state display
   - Test dialog interactions
   - Test responsive grid

8. **`/__tests__/components/tournament-page/tournament-group-card.test.tsx`**
   - Test stat display
   - Test leader highlighting
   - Test navigation link
   - Test theme colors

9. **`/__tests__/components/tournament-page/empty-groups-state.test.tsx`**
   - Test messaging display
   - Test button callbacks
   - Test accessibility

10. **`/__tests__/components/tournament-page/join-group-dialog.test.tsx`**
    - Test dialog open/close
    - Test input validation
    - Test navigation

## Files to Modify

1. **`/app/definitions.ts`**
   - Add `TournamentGroupStats` interface
   - Add `TournamentGroupsListProps` interface
   - Add `TournamentGroupCardProps` interface
   - Add `EmptyGroupsStateProps` interface

2. **`/app/actions/prode-group-actions.ts`**
   - Add `calculateTournamentGroupStats()` helper function
   - Returns `Promise<TournamentGroupStats>`
   - Aggregates group data with tournament scores

3. **`/app/components/tournament-page/friend-groups-list.tsx`**
   - Add `tournamentId?: string` prop
   - Add "View All Groups" button in CardActions
   - Conditional: only show if (userGroups + participantGroups).length > 1
   - Link: `/tournaments/${tournamentId}/groups`
   - Spanish text: "Ver Todos los Grupos"

4. **`/app/tournaments/[id]/page.tsx`**
   - Pass `tournamentId` prop to `FriendGroupsList` component
   - Extract tournament.id and pass to component

## Implementation Steps

### Phase 1: Data Layer (Foundation)

**Step 1.1: Add TypeScript Interfaces**
- File: `app/definitions.ts`
- Add `TournamentGroupStats` interface with all required fields
- Add props interfaces for new components
- Ensure proper type exports

**Step 1.2: Create Stats Calculation Helper**
- File: `app/actions/prode-group-actions.ts`
- Implement `calculateTournamentGroupStats(groupId, tournamentId, currentUserId)`
- Fetch participants using `findParticipantsInGroup()`
- Get scores using `getUserScoresForTournament()`
- Calculate user position (1-indexed rank using **competition ranking**: tied scores get same rank, next rank skips)
  - Example: Scores [50, 45, 45, 40] → Ranks [#1, #2, #2, #4] (not #1, #2, #3, #4)
  - Algorithm: Sort by totalPoints DESC, assign rank based on position in sorted array, if tied with previous, use previous rank
- Identify leader (highest totalPoints, if tied, use first in alphabetical order by name)
- Return `TournamentGroupStats` object
- **Data fetching optimization note:** For users with 10+ groups, consider batch fetching scores in future iteration to reduce N+1 queries

**Step 1.3: Unit Test Stats Calculation**
- File: `__tests__/actions/prode-group-actions.test.ts`
- Mock repository methods
- Test position calculation (tied scores, single user, etc.)
- Test leader identification
- Test edge cases (empty group, no scores)

### Phase 2: Page & Layout (Core)

**Step 2.1: Create Tournament Groups Page**
- File: `app/tournaments/[id]/groups/page.tsx`
- Server Component with params: `{ id: string }`
- Check authentication with `getLoggedInUser()`
- Redirect if not logged in
- Fetch tournament to verify it exists
- Fetch user groups: `getGroupsForUser()`
- Calculate stats for all groups using helper
- Pass data to `TournamentGroupsList` client component
- Wrap in `ViewTransition` for smooth navigation

**Step 2.2: Handle Edge Cases in Page**
- Tournament not found → return 404 or redirect
- User has no groups → pass empty array (component shows empty state)
- Error fetching data → show error UI with retry

**Step 2.3: Test Page Component**
- File: `__tests__/app/tournaments/[id]/groups/page.test.tsx`
- Mock `getLoggedInUser`, `getGroupsForUser`, stats calculation
- Test authenticated user sees groups
- Test unauthenticated user redirects
- Test empty groups handling
- Test error states

### Phase 3: Components (UI)

**Step 3.1: Create TournamentGroupsList Component**
- File: `app/components/tournament-page/tournament-groups-list.tsx`
- Client Component with `'use client'`
- Props: `groups`, `tournamentId`, `userId`, `userName`
- State: `createDialogOpen`, `joinDialogOpen`
- Render Material-UI Grid container
- If groups empty → render `EmptyGroupsState`
- If groups exist → map to `TournamentGroupCard` components
- Grid: `spacing={2}`, `maxWidth={868}`, `mx={{md: 'auto'}}`
- Each card: `size={{ xs: 12, sm: 6 }}`
- Quick actions at top: Create and Join buttons

**Step 3.2: Create TournamentGroupCard Component**
- File: `app/components/tournament-page/tournament-group-card.tsx`
- Client Component
- Props: `group`, `tournamentId`, `isCurrentUserLeader`
- Material-UI Card with variant="outlined"
- CardHeader: group name + trophy icon
- CardContent: position, points, leader stats
- If `isCurrentUserLeader`: highlight with success color
- CardActions: "View Details" button linking to group page
- Link: `/friend-groups/${group.groupId}` (can add tournamentId as query param if needed)
- Apply theme colors if group has custom theme

**Step 3.3: Create EmptyGroupsState Component**
- File: `app/components/tournament-page/empty-groups-state.tsx`
- Client Component
- Props: `tournamentId`, `onCreateGroup`, `onJoinGroup`
- Material-UI Paper centered content
- Large trophy icon (EmojiEvents, size 64px)
- Heading: "No Groups Yet!"
- Description: motivational text
- Two buttons: "Create Your First Group" (primary), "Join with Code" (outlined)
- Callbacks trigger parent dialog opens

**Step 3.4: Test Components**
- Files: `__tests__/components/tournament-page/*.test.tsx`
- Use `renderWithTheme` from test-utils
- Mock `useRouter` from next/navigation
- Test rendering, interactions, accessibility
- Test responsive behavior with media queries

### Phase 4: Quick Actions (Interactivity)

**Step 4.1: Create JoinGroupDialog Component**
- File: `app/components/tournament-page/join-group-dialog.tsx`
- Client Component
- Props: `open`, `onClose`, `tournamentId`
- Material-UI Dialog with TextField for group ID
- Validate input (UUID format)
- Button: "Join" navigates to `/friend-groups/join/${groupId}`
- Use Next.js `useRouter` for navigation
- Show error if invalid format

**Step 4.2: Integrate Create Group Dialog**
- Reuse existing dialog from `friend-groups-list.tsx`
- Import and render in `TournamentGroupsList`
- After creation, refresh page to show new group
- Use `router.refresh()` to refetch server component data
- **After join group flow:** User joins via `/friend-groups/join/[id]` → Redirects to group detail page `/friend-groups/[id]` → If user navigates back to tournament → natural refresh shows new group

**Step 4.3: Add Navigation Links**
- Card "View Details" button uses Next.js Link
- Destination: `/friend-groups/${groupId}`
- Soft navigation (client-side routing)

**Step 4.4: Test Dialogs and Actions**
- Test dialog open/close states
- Test create group flow
- Test join group validation
- Test navigation triggers

### Phase 5: Integration (Navigation)

**Step 5.1: Update FriendGroupsList Component**
- File: `app/components/tournament-page/friend-groups-list.tsx`
- Add optional prop: `tournamentId?: string`
- In CardActions, add conditional button:
  ```tsx
  {tournamentId && (userGroups.length + participantGroups.length > 1) && (
    <Link href={`/tournaments/${tournamentId}/groups`}>
      <Button size="small">Ver Todos los Grupos</Button>
    </Link>
  )}
  ```
- Position before "Crear Nuevo Grupo" button
- Use Material-UI Button with size="small"

**Step 5.2: Update Tournament Home Page**
- File: `app/tournaments/[id]/page.tsx`
- Find where `FriendGroupsList` is rendered
- Add prop: `tournamentId={tournament.id}`
- Ensure tournament object has id available

**Step 5.3: Test Navigation Flow**
- From tournament home → click "Ver Todos los Grupos" → groups page
- From groups page → click card "View Details" → individual group page
- Back navigation works correctly
- URL structure is clean

### Phase 6: Edge Cases & Polish

**Step 6.1: Implement Loading States**
- Add Skeleton components from MUI
- Show while fetching data in page component
- Maintain layout (same grid structure)
- Skeleton cards with same dimensions

**Step 6.2: Handle Error States**
- Tournament not found → 404 page or redirect
- Permission denied → redirect to home with message
- Network error → Show retry UI with Snackbar
- Empty scores → Display 0 points, N/A or "—" for position

**Step 6.3: Optimize Single Group Layout**
- In `TournamentGroupsList`, detect if groups.length === 1
- Render larger, centered card
- Add encouragement message below
- Still show create/join buttons
- More prominent "View Details" button

**Step 6.4: Test with Various Group Counts**
- 0 groups: empty state renders
- 1 group: optimized layout
- 2-5 groups: standard grid
- 10+ groups: scrollable, performant
- Use React.memo on TournamentGroupCard for performance

**Step 6.5: Real-time Updates**
- After creating group: `router.refresh()` to refetch
- After joining group: same refresh pattern
- Consider using React Suspense for smoother loading

### Phase 7: Testing

**Step 7.1: Complete Unit Tests**
- All 5 new components have test files
- Test rendering, props, state, callbacks
- Use test utilities: `renderWithTheme`, mock factories
- Mock Next.js: `useRouter`, `usePathname`
- Mock database: use `createMockSelectQuery` helpers

**Step 7.2: Integration Tests**
- Test navigation flows end-to-end
- Test data consistency across pages
- Test dialog interactions
- Test responsive breakpoints

**Step 7.3: Coverage Verification**
- Run `npm run test -- --coverage`
- Ensure ≥80% coverage on new code
- No uncovered critical paths
- Add tests for missed branches

**Coverage Target Breakdown (Total: 80%+):**
- Page component (page.tsx): ~85% (10-12 test cases: auth, data fetching, error handling, edge cases)
- TournamentGroupsList component: ~80% (8-10 test cases: render states, dialogs, grid layout)
- TournamentGroupCard component: ~85% (8-10 test cases: display, highlighting, navigation, themes)
- EmptyGroupsState component: ~90% (5-6 test cases: render, callbacks, accessibility)
- JoinGroupDialog component: ~85% (6-8 test cases: open/close, validation, navigation)
- calculateTournamentGroupStats helper: ~90% (8-10 test cases: position calculation, ties, leader, edge cases)
- Modified components (friend-groups-list.tsx): ~80% (test new "View All" link)
- **Target: ~100 total test cases across 10 test files to achieve 80%+ coverage**

**Step 7.4: Manual Testing**
- Test on Chrome, Firefox, Safari
- Test on mobile devices (iOS, Android)
- Test with screen reader (accessibility)
- Test with slow network (loading states)

## Testing Strategy

### Unit Tests Required

**Page Component Tests** (`page.test.tsx`):
```typescript
describe('Tournament Groups Page', () => {
  it('fetches groups and calculates stats correctly', async () => {
    // Mock getLoggedInUser, getGroupsForUser, calculateStats
    // Render page component
    // Assert groups are displayed
  })

  it('redirects unauthenticated users', async () => {
    // Mock getLoggedInUser to return null
    // Assert redirect is called
  })

  it('handles empty groups array', async () => {
    // Mock to return empty groups
    // Assert empty state is shown
  })

  it('handles tournament not found', async () => {
    // Mock tournament fetch to throw
    // Assert 404 or error state
  })
})
```

**TournamentGroupsList Tests** (`tournament-groups-list.test.tsx`):
```typescript
describe('TournamentGroupsList', () => {
  it('renders multiple group cards in grid', () => {
    const groups = [mockGroup1, mockGroup2]
    render(<TournamentGroupsList groups={groups} ... />)
    expect(screen.getAllByRole('article')).toHaveLength(2)
  })

  it('shows empty state when no groups', () => {
    render(<TournamentGroupsList groups={[]} ... />)
    expect(screen.getByText('No Groups Yet!')).toBeInTheDocument()
  })

  it('opens create dialog on button click', () => {
    render(<TournamentGroupsList groups={[]} ... />)
    fireEvent.click(screen.getByText('Create Your First Group'))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('uses responsive grid layout', () => {
    // Test grid props
    // Test breakpoints
  })
})
```

**TournamentGroupCard Tests** (`tournament-group-card.test.tsx`):
```typescript
describe('TournamentGroupCard', () => {
  it('displays group name and stats', () => {
    const group = { groupName: 'Test Group', userPosition: 3, ... }
    render(<TournamentGroupCard group={group} ... />)
    expect(screen.getByText('Test Group')).toBeInTheDocument()
    expect(screen.getByText('#3 of 12')).toBeInTheDocument()
  })

  it('highlights when user is leader', () => {
    render(<TournamentGroupCard isCurrentUserLeader={true} ... />)
    // Assert special styling or indicator
  })

  it('navigates to group details on click', () => {
    const mockPush = jest.fn()
    useRouter.mockReturnValue({ push: mockPush })
    render(<TournamentGroupCard ... />)
    fireEvent.click(screen.getByText('View Details'))
    expect(mockPush).toHaveBeenCalledWith('/friend-groups/...')
  })

  it('applies theme colors if present', () => {
    const group = { themeColor: '#FF0000', ... }
    render(<TournamentGroupCard group={group} ... />)
    // Assert theme color is applied
  })
})
```

**EmptyGroupsState Tests** (`empty-groups-state.test.tsx`):
```typescript
describe('EmptyGroupsState', () => {
  it('displays motivational message', () => {
    render(<EmptyGroupsState ... />)
    expect(screen.getByText(/Create your first group/i)).toBeInTheDocument()
  })

  it('renders create and join buttons', () => {
    render(<EmptyGroupsState ... />)
    expect(screen.getByText('Create Your First Group')).toBeInTheDocument()
    expect(screen.getByText('Join with Code')).toBeInTheDocument()
  })

  it('triggers callbacks on button clicks', () => {
    const onCreate = jest.fn()
    const onJoin = jest.fn()
    render(<EmptyGroupsState onCreateGroup={onCreate} onJoinGroup={onJoin} ... />)
    fireEvent.click(screen.getByText('Create Your First Group'))
    expect(onCreate).toHaveBeenCalled()
  })
})
```

**JoinGroupDialog Tests** (`join-group-dialog.test.tsx`):
```typescript
describe('JoinGroupDialog', () => {
  it('opens and closes correctly', () => {
    const onClose = jest.fn()
    const { rerender } = render(<JoinGroupDialog open={true} onClose={onClose} ... />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    rerender(<JoinGroupDialog open={false} onClose={onClose} ... />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('validates UUID format', () => {
    render(<JoinGroupDialog open={true} ... />)
    const input = screen.getByLabelText('Group Code')
    fireEvent.change(input, { target: { value: 'invalid' } })
    fireEvent.click(screen.getByText('Join'))
    expect(screen.getByText(/Invalid format/i)).toBeInTheDocument()
  })

  it('navigates to join page with valid code', () => {
    const mockPush = jest.fn()
    useRouter.mockReturnValue({ push: mockPush })
    render(<JoinGroupDialog open={true} ... />)
    const input = screen.getByLabelText('Group Code')
    fireEvent.change(input, { target: { value: 'valid-uuid-123' } })
    fireEvent.click(screen.getByText('Join'))
    expect(mockPush).toHaveBeenCalledWith('/friend-groups/join/valid-uuid-123')
  })
})
```

### Test Scenarios by User Context

**Scenario 1: New User (0 groups)**
- Page renders empty state
- Shows large CTAs for create/join
- Motivational messaging encourages participation
- Create button opens dialog
- Join button opens dialog
- No "View All Groups" link on tournament home

**Scenario 2: User with 1 group**
- Page renders single large card
- Shows optimized layout with more details
- Encouragement message for multi-group participation
- "View Details" button navigates to group page
- Create/join buttons still visible
- "View All Groups" link appears on tournament home

**Scenario 3: User with multiple groups (2-9)**
- Page renders grid with all cards
- 2-column layout on desktop
- 1-column on mobile
- Each card shows stats correctly
- Position calculations accurate
- Leader identification correct

**Scenario 4: User with many groups (10+)**
- Page renders all cards without performance issues
- Scrolling works smoothly
- React.memo optimizations prevent unnecessary re-renders
- Consider adding search/filter in future

**Scenario 5: User is leader in some groups**
- Leader groups highlighted visually
- Shows "You!" as leader name
- Special styling (light success background)
- Non-leader groups render normally

**Scenario 6: Groups with custom themes**
- Theme colors applied to card borders
- Colors maintain readability (contrast check)
- Trophy icon matches theme
- Typography remains legible

### Mock Requirements

**Mocking Strategy:**
```typescript
// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn()
  }),
  usePathname: () => '/tournaments/123/groups'
}))

// Mock server actions
jest.mock('@/app/actions/prode-group-actions', () => ({
  getGroupsForUser: jest.fn().mockResolvedValue({
    userGroups: [mockUserGroup],
    participantGroups: [mockParticipantGroup]
  }),
  calculateTournamentGroupStats: jest.fn().mockResolvedValue(mockStats)
}))

// Mock repository methods
import { createMockSelectQuery } from '@/__tests__/db/mock-helpers'
import { testFactories } from '@/__tests__/db/test-factories'

// Use test utilities
import { renderWithTheme, renderWithProviders } from '@/__tests__/utils/test-utils'
```

**Test Data Factories:**
```typescript
const mockTournamentGroupStats = (): TournamentGroupStats => ({
  groupId: 'group-123',
  groupName: 'My Friends Group',
  isOwner: true,
  totalParticipants: 12,
  userPosition: 3,
  userPoints: 45,
  leaderName: 'John Doe',
  leaderPoints: 48,
  themeColor: '#1976d2'
})
```

## Edge Cases

### 0 Groups
**Behavior:**
- Show `EmptyGroupsState` component
- Large, centered Paper container
- Trophy icon (64px, muted color)
- Heading: "No Groups Yet!" (Typography variant="h5")
- Body text: Motivational message
- Two prominent buttons: Create (primary), Join (outlined)
- No "View All Groups" link on tournament home (condition: groups.length > 1)

**Testing:**
- Verify empty state renders
- Verify buttons trigger correct actions
- Verify no crash with empty array

### 1 Group
**Behavior:**
- Render single card with optimized layout
- Larger card size (max 600px width, centered)
- More detailed stats display
- Add encouragement message below card
- "💡 Tip: Create more groups..." with LightbulbIcon
- Create/join buttons still present
- "View All Groups" link DOES appear on tournament home (>1 check passes)

**Testing:**
- Verify single-card optimized layout
- Verify encouragement message
- Verify navigation still works

### Many Groups (10+)
**Behavior:**
- Maintain standard grid layout (no special handling)
- All cards render in grid
- Page scrolls normally
- Performance optimization: Use React.memo on TournamentGroupCard
- Future enhancement: Add search/filter if >20 groups
- Future enhancement: Virtual scrolling if >50 groups

**Current Implementation:**
- Simple scrolling (acceptable for 10-20 groups)
- No pagination (keep it simple for v1)

**Testing:**
- Create test with 15-20 mock groups
- Verify all render without performance issues
- Verify scroll behavior

### Loading States
**Implementation:**
- While page fetches data: Show Skeleton cards
- Use MUI Skeleton component
- Match card dimensions (height ~200px)
- Show 4-6 skeleton cards in grid
- Maintain responsive layout during load

**Code Example:**
```tsx
{isLoading ? (
  <>
    {[1,2,3,4].map(i => (
      <Grid key={i} size={{ xs: 12, sm: 6 }}>
        <Card>
          <CardHeader
            avatar={<Skeleton variant="circular" width={40} height={40} />}
            title={<Skeleton width="60%" />}
          />
          <CardContent>
            <Skeleton />
            <Skeleton />
            <Skeleton width="80%" />
          </CardContent>
        </Card>
      </Grid>
    ))}
  </>
) : (
  // Actual cards
)}
```

### Error States

**1. Tournament Not Found:**
- Return 404 from page component
- Or redirect to tournaments list
- Show error message with retry

**2. Permission Denied:**
- Redirect to tournament home
- Show Snackbar: "You don't have permission to view this page"
- Log security event

**3. Network Error:**
- Show error UI in page
- Snackbar with "Failed to load groups" message
- Retry button
- Don't crash the page

**4. Empty Scores:**
- Handle gracefully (tournament just started)
- Show: "No predictions yet"
- Position: "—" or "N/A"
- Points: 0

**Testing:**
- Mock API failures
- Verify error messages display
- Verify retry functionality
- Verify no crashes

### Real-time Updates

**After Creating Group:**
```typescript
const handleCreateGroup = async () => {
  await createDbGroup(groupName)
  router.refresh() // Refetch server component data
  setCreateDialogOpen(false)
  // Show success snackbar
}
```

**After Joining Group:**
- Join happens on separate page (`/friend-groups/join/[id]`)
- Redirects to group page after join
- If user navigates back to tournaments → refresh happens naturally
- Consider: Add query param to trigger refresh/highlight

## Integration Points

### 1. Tournament Home Page Navigation

**File:** `/app/components/tournament-page/friend-groups-list.tsx`

**Current Implementation:**
```tsx
<CardActions sx={{ justifyContent: 'flex-end', direction: 'rtl' }}>
  <Button onClick={() => setOpenCreateDialog(true)}>
    Crear Nuevo Grupo
  </Button>
</CardActions>
```

**New Implementation:**
```tsx
<CardActions sx={{ justifyContent: 'flex-end', direction: 'rtl' }}>
  {tournamentId && (userGroups.length + participantGroups.length > 1) && (
    <Link href={`/tournaments/${tournamentId}/groups`} passHref legacyBehavior>
      <Button size="small">Ver Todos los Grupos</Button>
    </Link>
  )}
  <Button onClick={() => setOpenCreateDialog(true)}>
    Crear Nuevo Grupo
  </Button>
</CardActions>
```

**Props Interface Update:**
```typescript
interface FriendGroupsListProps {
  readonly userGroups: ProdeGroupParticipant[]
  readonly participantGroups: ProdeGroupParticipant[]
  readonly tournamentId?: string  // NEW
}
```

### 2. Pass Tournament ID from Tournament Home

**File:** `/app/tournaments/[id]/page.tsx`

**Current Implementation:**
```tsx
{prodeGroups && (
  <Grid size={12}>
    <FriendGroupsList
      userGroups={prodeGroups.userGroups}
      participantGroups={prodeGroups.participantGroups}
    />
  </Grid>
)}
```

**New Implementation:**
```tsx
{prodeGroups && (
  <Grid size={12}>
    <FriendGroupsList
      userGroups={prodeGroups.userGroups}
      participantGroups={prodeGroups.participantGroups}
      tournamentId={tournament.id}  // NEW
    />
  </Grid>
)}
```

### 3. Future: Mobile Bottom Nav (UXI-008)

**When Implemented:**
- Bottom navigation will have "Groups" tab
- Tab links to `/tournaments/[id]/groups`
- Icon: `<Groups />` from @mui/icons-material
- Label: "Grupos"
- Active state when on groups page

**This story lays the groundwork:**
- Page route structure matches expectation
- Mobile-responsive design ready
- Data fetching patterns established

**Future Integration Points:**
- Add groups tab to bottom nav component
- Use `usePathname()` to detect active tab
- Maintain consistency with other tabs

## Validation Considerations

### SonarCloud Requirements

**Code Coverage: ≥80% on new code**
- All new components must have unit tests
- Critical paths 100% covered
- Edge cases tested
- Use coverage report to identify gaps

**0 New Issues (any severity)**
- No code smells
- No bugs
- No security vulnerabilities
- No maintainability issues

**Code Quality Metrics:**
- Functions < 20 lines (extract helpers if needed)
- Cognitive complexity < 15 per function
- No duplicated code blocks
- Clear, self-documenting code

**Specific Checks:**
- No `any` types in TypeScript
- No unused variables
- No console.log statements
- Proper error handling

**SonarCloud Linting Watch List (monitor during implementation):**
- Missing null checks on score data (scores array, user scores, leader)
- Potential division by zero in position calculation
- Unused component props or state variables
- Cognitive complexity >15 in stats calculation function
- Duplicate code between card variations (standard vs single group)
- Missing accessibility attributes (ARIA labels on interactive elements)

### Quality Checklist

**TypeScript Strict Mode:**
- ✅ All types explicitly defined
- ✅ No implicit any
- ✅ Proper null/undefined handling
- ✅ Return types specified

**ESLint Compliance:**
- ✅ No unused imports
- ✅ Consistent formatting (Prettier)
- ✅ No linting errors
- ✅ React hooks rules followed

**Accessibility:**
- ✅ ARIA labels on interactive elements
- ✅ Keyboard navigation works
- ✅ Focus states visible
- ✅ Screen reader compatible
- ✅ Color contrast meets WCAG AA

**Performance:**
- ✅ React.memo on card components
- ✅ Efficient data fetching (no N+1 queries)
- ✅ No unnecessary re-renders
- ✅ Optimized images (if used)

**Responsive Design:**
- ✅ Mobile (320px+): Single column, stacked
- ✅ Tablet (600px+): Two columns
- ✅ Desktop (900px+): Two columns, centered
- ✅ Touch targets ≥44px
- ✅ Text legible at all sizes

### Pre-Commit Validation Commands

**Before ANY commit:**
```bash
# 1. Run all tests
npm run test
# Must pass with 0 failures

# 2. Run linter
npm run lint
# Must have 0 errors (warnings acceptable)

# 3. Build project
npm run build
# Must complete successfully
```

**If any command fails:**
- Fix issues before committing
- Do not bypass checks
- Do not use --no-verify

**After commit, before PR merge:**
- Wait for CI/CD checks
- Review SonarCloud report
- Fix any new issues

## Success Criteria

### Functional Requirements
✅ Page renders at `/tournaments/[id]/groups` for authenticated users
✅ Shows all user's friend groups (owned + participant)
✅ Displays tournament-specific stats per group:
  - User's position (1-indexed, "#3 of 12" format)
  - User's total points
  - Leader's name and points
✅ Calculates position correctly (handles ties, edge cases)
✅ Navigation to group detail page works
✅ Create group dialog opens and functions
✅ Join group dialog opens and validates input
✅ Handles 0 groups: shows empty state
✅ Handles 1 group: optimized layout
✅ Handles many groups: performant rendering

### Non-Functional Requirements
✅ Responsive on all screen sizes (mobile, tablet, desktop)
✅ 80% unit test coverage on new code
✅ 0 new SonarCloud issues
✅ Passes ESLint with no errors
✅ Builds successfully
✅ Accessible (ARIA, keyboard nav, screen reader)
✅ Performant (no lag with 20+ groups)

### Integration Requirements
✅ "View All Groups" link appears on tournament home (when >1 group)
✅ Link correctly navigates to groups page
✅ Groups page integrates with tournament layout/theme
✅ Back navigation works correctly
✅ Create/join flows redirect appropriately

### User Experience
✅ Loading states display during data fetch
✅ Error states handled gracefully
✅ Empty state encourages participation
✅ Leader status highlighted visually
✅ Smooth navigation transitions
✅ Clear, motivational messaging

## Open Questions

**None** - All requirements are clear from the story, exploration, and existing patterns.

## Known Limitations (Future Enhancements)

**Real-time data consistency:**
- After user creates/joins a group, uses `router.refresh()` to refetch
- If another user adds current user to a group in another tab, groups page won't auto-update
- User must manually refresh page
- Acceptable for v1, consider WebSocket updates in future

**Data fetching performance:**
- With 20+ groups, makes multiple database queries (N+1 pattern)
- Consider batch query optimization if performance becomes issue
- Current approach acceptable for typical usage (2-10 groups per user)

**Search/filter:**
- No search or filter for many groups (10+)
- Consider adding if users report difficulty finding specific groups

## Dependencies

**No External Dependencies:**
- Uses existing Material-UI components
- Uses existing repository methods
- Uses existing server actions
- No new npm packages required

**Existing Code Dependencies:**
- `app/actions/prode-group-actions.ts` (existing)
- `app/db/prode-group-repository.ts` (existing)
- `app/components/tournament-page/friend-groups-list.tsx` (modify)
- Material-UI Grid v2, Card, Dialog components

**Data Dependencies:**
- Requires `prode_groups` table (exists)
- Requires `prode_group_participants` table (exists)
- Requires score calculation logic (exists)
- No database migrations needed

## Estimated Effort

**Story Points:** 5 (Medium-Large)
**Time Estimate:** 2-3 days

**Breakdown by Phase:**
- Phase 1 (Data Layer): 0.5 day
  - Interfaces, helper function, tests
- Phase 2 (Page & Layout): 0.5 day
  - Server component, data fetching, error handling
- Phase 3 (Components): 1 day
  - 4 new client components, responsive layout
- Phase 4 (Quick Actions): 0.5 day
  - Dialogs, navigation integration
- Phase 5 (Integration): 0.25 day
  - Update existing components, test navigation
- Phase 6 (Edge Cases): 0.25 day
  - Loading states, error states, optimizations
- Phase 7 (Testing): 0.5 day
  - Write tests, achieve 80% coverage, fix issues

**Buffer:** 0.5 day for unexpected issues, refactoring, polish

**Risks:**
- Score calculation edge cases (ties, empty tournaments)
- Performance with large number of groups (>20)
- Integration with existing dialog patterns
- Responsive design tweaks

**Mitigations:**
- Comprehensive unit tests for stats calculation
- React.memo optimization for cards
- Follow existing dialog patterns closely
- Test on real devices early

## Critical Files Summary

**New Files (5 components + 5 tests):**
1. `/app/tournaments/[id]/groups/page.tsx` - Server Component
2. `/app/components/tournament-page/tournament-groups-list.tsx` - Client Container
3. `/app/components/tournament-page/tournament-group-card.tsx` - Client Card
4. `/app/components/tournament-page/empty-groups-state.tsx` - Client Empty State
5. `/app/components/tournament-page/join-group-dialog.tsx` - Client Dialog
6. `/__tests__/app/tournaments/[id]/groups/page.test.tsx`
7. `/__tests__/components/tournament-page/tournament-groups-list.test.tsx`
8. `/__tests__/components/tournament-page/tournament-group-card.test.tsx`
9. `/__tests__/components/tournament-page/empty-groups-state.test.tsx`
10. `/__tests__/components/tournament-page/join-group-dialog.test.tsx`

**Modified Files (4):**
1. `/app/definitions.ts` - Add interfaces
2. `/app/actions/prode-group-actions.ts` - Add helper function
3. `/app/components/tournament-page/friend-groups-list.tsx` - Add "View All" link
4. `/app/tournaments/[id]/page.tsx` - Pass tournamentId prop

**Existing Reference Files:**
- `/app/tournaments/[id]/page.tsx` - Server Component pattern
- `/app/components/tournament-page/friend-groups-list.tsx` - Card layout pattern
- `/app/components/friend-groups/friends-group-table.tsx` - Score display pattern
- `/app/db/prode-group-repository.ts` - Data access patterns
- `/app/actions/prode-group-actions.ts` - Server action patterns

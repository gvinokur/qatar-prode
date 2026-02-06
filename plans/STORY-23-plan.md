# Implementation Plan: [UXI-015] Card-Based Mobile Leaderboard

## Story Context

**Issue:** #23 - [UXI-015] Card-Based Mobile Leaderboard
**Milestone:** Sprint 5-6: Mobile Optimization
**Effort:** 2-3 days
**Priority:** Medium (6/10)

### Problem Statement
- Current leaderboard tables require horizontal scrolling on mobile devices
- Information is too dense and difficult to scan on small screens
- Poor mobile reading experience degrades user engagement

### Solution Overview
Replace table-based leaderboard with card-based layout on mobile devices:
- Individual cards for each user's stats
- Rank change indicators (↑2, ↓1)
- Expandable cards for detailed statistics
- Progress bars for visual accuracy representation
- Highlighted card for current user
- Avatar with user initials

### Success Metrics
- Mobile leaderboard engagement: +40%
- Horizontal scroll elimination: 100%
- Information clarity: +35%

## Acceptance Criteria

1. **Mobile Detection**
   - Use `useMediaQuery` to detect mobile viewport (≤600px)
   - Render cards on mobile, table on desktop
   - Smooth transition between layouts

2. **Card Layout**
   - One card per user
   - Display: rank, name, points, rank change
   - Visual rank change indicators (up/down arrows with delta)
   - Avatar with user initials
   - Progress bar showing accuracy percentage
   - Current user's card highlighted (different background)

3. **Expandable Cards**
   - Collapsed state: rank, name, total points, rank change
   - Expanded state: detailed breakdown (group points, knockout points, boosts used, accuracy)
   - Smooth expand/collapse animation
   - Toggle on card tap

4. **Visual Feedback**
   - Green arrow for rank improvement (↑)
   - Red arrow for rank decline (↓)
   - Gray indicator for no change (—)
   - Highlighted current user card with distinct border/background

5. **Performance**
   - No horizontal scrolling on mobile
   - Smooth animations (< 300ms)
   - Responsive to viewport changes

6. **Desktop Compatibility**
   - Maintain existing table layout on desktop (≥600px)
   - No regression in desktop UX

## Technical Approach

### Architecture

**Responsive Component Pattern:**
1. Create new client component: `LeaderboardView.tsx`
2. Use responsive conditional rendering based on viewport
3. Extract shared logic into custom hook: `useLeaderboardData()`
4. Separate components for card and table views

**Component Structure:**
```
LeaderboardView (parent)
├── useMediaQuery hook (mobile detection)
├── LeaderboardCards (mobile view)
│   ├── LeaderboardCard (individual card)
│   │   ├── Card header (rank, avatar, name)
│   │   ├── Points display
│   │   ├── Rank change indicator
│   │   ├── Accuracy progress bar
│   │   └── Expandable details
│   └── Sort controls
└── LeaderboardTable (desktop view)
    └── Existing table implementation
```

### Data Flow

**Input:**
- User scores array from `getUserScoresForTournament()`
- Current user ID for highlighting
- Tournament phase for filtering

**Processing:**
- Calculate rank changes (compare current vs previous rankings)
- Sort by total points descending
- Identify current user position
- Format accuracy percentages

**Output:**
- Structured data for both card and table views
- Rank delta calculations
- Visual indicator data

### Mobile Breakpoint Strategy

Use Material-UI breakpoints:
- **Mobile:** `xs` (0-600px) and `sm` (600-900px) → Card layout
- **Desktop:** `md` (900px+) → Table layout
- Breakpoint: `theme.breakpoints.down('md')`

### State Management

**Local state (in LeaderboardCards):**
- `expandedCardId: string | null` - Which card is expanded
- Toggle via `handleCardClick(userId)`

**Props passed from parent:**
- `scores: UserScore[]` - Leaderboard data
- `currentUserId: string` - For highlighting
- `tournament: Tournament` - Context for filtering

### Styling Approach

**Theme Integration:**
- Use `useTheme()` for consistent colors
- Primary color for current user highlight
- Success/error colors for rank changes
- Card elevation: 1 (normal), 3 (highlighted)

**Responsive Sizing:**
```typescript
sx={{
  py: 1.5,
  px: 2,
  mb: 1.5,
  borderRadius: 2,
  border: isCurrentUser ? `2px solid ${theme.palette.primary.main}` : 'none',
  backgroundColor: isCurrentUser ? alpha(theme.palette.primary.main, 0.05) : 'inherit'
}}
```

## Visual Prototypes

### Mobile Card Layout (Collapsed State)

```
┌─────────────────────────────────────────────────────────────┐
│  #1  [👤] John Smith                            1,245 pts  │
│                                                  ↑ 2        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 87%          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐ ← Highlighted (Current User)
│  #2  [👤] You (Jane Doe)                        1,198 pts  │
│                                                  ↓ 1        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 82%          │
│  [Tap to view details]                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  #3  [👤] Mike Johnson                          1,156 pts  │
│                                                  —          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 79%          │
└─────────────────────────────────────────────────────────────┘
```

**Card Components:**
- **Rank badge:** `#1` - Bold, large font (h6)
- **Avatar:** Circle with initials (32x32px), background color derived from user ID
- **Name:** Body1 font, truncate with ellipsis if too long
- **Points:** h6 font, right-aligned
- **Rank change:** Small chip with arrow + delta
  - Up: Green background, ↑ icon
  - Down: Red background, ↓ icon
  - No change: Gray background, — icon
- **Progress bar:** LinearProgress with label (accuracy %)
- **Expand hint:** Small text at bottom (only on current user's card initially)

### Mobile Card Layout (Expanded State)

```
┌─────────────────────────────────────────────────────────────┐
│  #2  [👤] You (Jane Doe)                        1,198 pts  │
│                                                  ↓ 1        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 82%          │
│  ┌────────────────────────────────────────────────────────┐│
│  │ Detailed Stats                                         ││
│  │                                                        ││
│  │ Group Stage Points:        856 pts                    ││
│  │ Knockout Points:           342 pts                    ││
│  │ Boosts Used:               3/5                        ││
│  │ Correct Predictions:       41/50                      ││
│  │ Accuracy:                  82% (41 played)            ││
│  │                                                        ││
│  └────────────────────────────────────────────────────────┘│
│  [Tap to collapse]                                          │
└─────────────────────────────────────────────────────────────┘
```

**Expanded Section Components:**
- **Collapsible container:** Using MUI Collapse component
- **Stats grid:** Two-column layout (label | value)
- **Label typography:** body2, secondary color
- **Value typography:** body1, bold, primary color
- **Spacing:** 1.5 between rows
- **Animation:** Smooth expand/collapse (300ms)

### Responsive Behavior

**Mobile (xs, sm: 0-900px):**
```
[Mobile View - Card Stack]

┌────────────────┐
│  Sort: Points ▼│
└────────────────┘

[Card 1]
[Card 2] ← Current user (highlighted)
[Card 3]
[Card 4]
...
```

**Desktop (md+: 900px+):**
```
[Desktop View - Table]

┌──────────────────────────────────────────────────────────────┐
│ Rank │ Player      │ Total │ Group │ KO  │ Boosts │ Accuracy │
├──────┼─────────────┼───────┼───────┼─────┼────────┼──────────┤
│  1↑2 │ John Smith  │ 1,245 │ 890   │ 355 │  4/5   │   87%    │
│  2↓1 │ You         │ 1,198 │ 856   │ 342 │  3/5   │   82%    │
│  3—  │ Mike Johnson│ 1,156 │ 820   │ 336 │  2/5   │   79%    │
└──────┴─────────────┴───────┴───────┴─────┴────────┴──────────┘
```

### State Variations

**Loading State:**
```
┌─────────────────────────────────────────┐
│  [Skeleton] Loading...                  │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  [Skeleton] Loading...                  │
└─────────────────────────────────────────┘
```
- Use MUI Skeleton component
- Match card dimensions

**Empty State:**
```
┌─────────────────────────────────────────┐
│         No leaderboard data             │
│                                         │
│   Check back after predictions close    │
└─────────────────────────────────────────┘
```

**Error State:**
```
┌─────────────────────────────────────────┐
│  ⚠️  Failed to load leaderboard         │
│                                         │
│        [Retry Button]                   │
└─────────────────────────────────────────┘
```

### Material-UI Components to Use

- **Card:** `Card`, `CardHeader`, `CardContent` from `@mui/material`
- **Layout:** `Box`, `Stack`, `Grid` for structure
- **Avatar:** `Avatar` component with initials
- **Progress:** `LinearProgress` with label
- **Icons:** `TrendingUp`, `TrendingDown`, `Remove` from `@mui/icons-material`
- **Chip:** `Chip` component for rank change indicator
- **Collapse:** `Collapse` for expandable details
- **Typography:** `Typography` with variants (h6, body1, body2)
- **Skeleton:** `Skeleton` for loading states

### Accessibility Considerations

1. **Semantic HTML:**
   - Use proper heading hierarchy
   - `role="list"` for card container
   - `role="listitem"` for each card

2. **Keyboard Navigation:**
   - Cards focusable with Tab key
   - Enter/Space to expand/collapse
   - aria-expanded attribute

3. **Screen Readers:**
   - aria-label for rank change ("Rank improved by 2 positions")
   - aria-label for progress bar ("Accuracy: 82 percent")
   - aria-live region for expanded content

4. **Visual:**
   - Color not sole indicator (use icons + color)
   - Sufficient contrast ratios (WCAG AA)
   - Focus indicators visible

## Files to Create/Modify

### New Files

1. **`/app/components/leaderboard/LeaderboardView.tsx`**
   - Main responsive container component
   - Handles mobile detection and conditional rendering
   - Props: scores, currentUserId, tournament

2. **`/app/components/leaderboard/LeaderboardCards.tsx`**
   - Mobile card layout container
   - Manages expanded card state
   - Renders list of LeaderboardCard components

3. **`/app/components/leaderboard/LeaderboardCard.tsx`**
   - Individual user card component
   - Handles expand/collapse interaction
   - Props: user, rank, isCurrentUser, isExpanded, onToggle

4. **`/app/components/leaderboard/RankChangeIndicator.tsx`**
   - Reusable rank change chip component
   - Shows up/down/no-change with arrow
   - Props: change (number), size (small/medium)

5. **`/app/components/leaderboard/LeaderboardTable.tsx`**
   - Desktop table view (extracted from existing)
   - Keep existing table implementation
   - Props: scores, currentUserId

6. **`/__tests__/components/leaderboard/LeaderboardCard.test.tsx`**
   - Unit tests for individual card component
   - Tests: rendering, expand/collapse, highlighting, rank indicators

7. **`/__tests__/components/leaderboard/LeaderboardCards.test.tsx`**
   - Integration tests for card container
   - Tests: multiple cards, current user highlighting, sorting

8. **`/__tests__/components/leaderboard/LeaderboardView.test.tsx`**
   - Tests for responsive behavior
   - Mock useMediaQuery for mobile/desktop scenarios

### Modified Files

1. **`/app/components/friend-groups/friends-group-table.tsx`**
   - Replace table-only implementation with LeaderboardView
   - Pass scores and currentUserId props
   - Remove direct table rendering (delegate to LeaderboardView)
   - Lines to modify: ~50-200 (table rendering section)

2. **Potentially:** Other leaderboard usages
   - Scan for other places showing user rankings
   - Apply same responsive pattern

## Implementation Steps

### Phase 1: Foundation (Day 1, Morning)

1. **Create base components structure**
   - Create `/app/components/leaderboard/` directory
   - Stub out component files with TypeScript interfaces

2. **Define TypeScript interfaces**
   ```typescript
   interface LeaderboardUser {
     id: string
     name: string
     totalPoints: number
     groupPoints: number
     knockoutPoints: number
     boostsUsed: number
     totalBoosts: number
     correctPredictions: number
     playedGames: number // Only games already played/decided, NOT future predictions
     accuracy: number // correctPredictions / playedGames (%)
     rankChange: number // positive = up, negative = down, 0 = no change
   }

   interface LeaderboardViewProps {
     scores: UserScore[]
     currentUserId: string
     tournament: Tournament
   }
   ```

3. **Implement RankChangeIndicator component**
   - Small, self-contained component
   - Easy to test in isolation
   - Will be reused in both card and table views

### Phase 2: Card Components (Day 1, Afternoon)

4. **Implement LeaderboardCard (collapsed state)**
   - Card layout with rank, avatar, name, points
   - Rank change indicator integration
   - Progress bar for accuracy
   - Highlighting logic for current user
   - No expand/collapse yet (simplified first iteration)

5. **Implement LeaderboardCards container**
   - Map over scores array
   - Render LeaderboardCard for each user
   - Calculate ranks and rank changes
   - Sort controls (if needed)

6. **Add expand/collapse functionality**
   - Add state management for expanded card
   - Implement toggle handler
   - Add Collapse component with detailed stats
   - Smooth animation

### Phase 3: Responsive Integration (Day 2, Morning)

7. **Implement LeaderboardView (responsive container)**
   - Use `useMediaQuery(theme.breakpoints.down('md'))`
   - Conditional rendering: `isMobile ? <LeaderboardCards /> : <LeaderboardTable />`
   - Pass props to both views

8. **Extract LeaderboardTable component**
   - Copy existing table implementation from friends-group-table.tsx
   - Make it a standalone component
   - Ensure props interface matches LeaderboardView

9. **Integrate into friends-group-table.tsx**
   - Replace direct table rendering with LeaderboardView
   - Test both mobile and desktop layouts
   - Verify no regressions in desktop view

### Phase 4: Testing (Day 2, Afternoon)

10. **Create unit tests for LeaderboardCard**
    - Test rendering of collapsed state
    - Test rendering of expanded state
    - Test rank change indicators (up, down, no change)
    - Test current user highlighting
    - Test expand/collapse toggle

11. **Create integration tests for LeaderboardCards**
    - Test rendering multiple cards
    - Test sorting
    - Test current user card is highlighted
    - Test only one card expanded at a time

12. **Create tests for LeaderboardView**
    - Mock useMediaQuery for mobile scenario
    - Verify LeaderboardCards renders on mobile
    - Mock useMediaQuery for desktop scenario
    - Verify LeaderboardTable renders on desktop
    - Test prop passing to child components

### Phase 5: Polish & Validation (Day 3)

13. **Accessibility enhancements**
    - Add ARIA labels to rank change indicators
    - Add ARIA labels to progress bars
    - Add keyboard navigation for expand/collapse
    - Test with screen reader
    - Ensure focus management
    - **Add accessibility tests (MANDATORY for coverage):**
      - Test aria-label attributes render correctly
      - Test keyboard navigation (Tab, Enter, Space)
      - Test focus management on expand/collapse
      - Test screen reader announcements (aria-live)

14. **Visual polish**
    - Fine-tune spacing and alignment
    - Verify colors match theme
    - Test animations smoothness
    - Add loading skeletons
    - Add empty state handling

15. **Performance optimization**
    - Memoize expensive calculations
    - Use `React.memo` for LeaderboardCard
    - Verify no unnecessary re-renders
    - Test with large datasets (100+ users)
    - **Performance budget:**
      - Initial render with 50 cards: < 500ms
      - Initial render with 100 cards: < 1000ms
      - Expand/collapse animation: 60fps (< 16ms per frame)
      - Layout shift (CLS): < 0.1
    - **Optimization strategies:**
      - Virtual scrolling if > 100 cards (use `react-window`)
      - Lazy load card details on expand
      - Debounce viewport resize handler

16. **Cross-browser testing**
    - Test on Chrome, Firefox, Safari
    - Test on iOS Safari, Android Chrome
    - Verify viewport transitions work smoothly
    - Test touch interactions on mobile devices

## Testing Strategy

### Unit Tests

**LeaderboardCard.test.tsx:**
```typescript
describe('LeaderboardCard', () => {
  it('renders rank, name, and points', () => {
    // Test basic rendering
  })

  it('highlights current user card', () => {
    // Test isCurrentUser prop changes styling
  })

  it('shows rank improvement indicator', () => {
    // Test positive rankChange renders up arrow
  })

  it('shows rank decline indicator', () => {
    // Test negative rankChange renders down arrow
  })

  it('expands on click', () => {
    // Test onToggle callback fired
  })

  it('shows detailed stats when expanded', () => {
    // Test expanded state renders all stats
  })

  it('truncates long user names', () => {
    // Test name > 25 chars shows ellipsis
  })

  it('handles zero accuracy gracefully', () => {
    // Test 0/0 predictions shows 0% accuracy
  })

  it('has accessible labels', () => {
    // Test aria-label for rank change and progress bar
  })

  it('is keyboard navigable', () => {
    // Test Tab focus, Enter/Space expand
  })
})
```

**RankChangeIndicator.test.tsx:**
```typescript
describe('RankChangeIndicator', () => {
  it('renders up arrow for positive change', () => {})
  it('renders down arrow for negative change', () => {})
  it('renders dash for no change', () => {})
  it('uses correct colors', () => {})
})
```

### Integration Tests

**LeaderboardCards.test.tsx:**
```typescript
describe('LeaderboardCards', () => {
  it('renders all user cards', () => {
    // Test mapping over scores array
  })

  it('highlights current user', () => {
    // Test currentUserId matching
  })

  it('sorts by total points descending', () => {
    // Test ranking order
  })

  it('allows only one expanded card', () => {
    // Test mutual exclusion of expanded state
  })

  it('handles users with tied scores', () => {
    // Test deterministic tie-breaking (by user ID)
  })

  it('handles empty leaderboard', () => {
    // Test empty state renders
  })

  it('handles single user', () => {
    // Test single card renders correctly
  })

  it('handles missing currentUserId', () => {
    // Test no cards highlighted when undefined
  })
})
```

**LeaderboardView.test.tsx:**
```typescript
describe('LeaderboardView', () => {
  it('renders cards on mobile', () => {
    // Mock useMediaQuery to return true
    // Assert LeaderboardCards rendered
  })

  it('renders table on desktop', () => {
    // Mock useMediaQuery to return false
    // Assert LeaderboardTable rendered
  })
})
```

### Manual Testing

1. **Mobile devices:**
   - iPhone (Safari)
   - Android phone (Chrome)
   - Tablet (iPad)

2. **Desktop browsers:**
   - Chrome
   - Firefox
   - Safari
   - Edge

3. **Responsive behavior:**
   - Resize browser window from mobile to desktop
   - Verify smooth transition between layouts
   - No layout shifts or flashing

4. **Interactions:**
   - Tap to expand card
   - Tap again to collapse
   - Expand different card (first one should collapse)
   - Scroll performance with 50+ cards

### Test Utilities

**Use existing test utilities:**
- `renderWithTheme()` from `@/__tests__/utils/test-utils`
- Mock `useMediaQuery` from `@mui/material`
- Mock user scores data using test factories

**Test data factory (use existing project utilities):**
```typescript
// MANDATORY: Use @/__tests__/db/test-factories per CLAUDE.md
import { testFactories } from '@/__tests__/db/test-factories'

// Create mock user score using existing factories
const createMockUserScore = (overrides?: Partial<UserScore>): UserScore => ({
  ...testFactories.createUserScore(), // Use existing factory
  ...overrides
})

// Create mock leaderboard user (transformed)
const createMockLeaderboardUser = (overrides?: Partial<LeaderboardUser>): LeaderboardUser => ({
  id: 'user-1',
  name: 'John Doe',
  totalPoints: 1000,
  groupPoints: 700,
  knockoutPoints: 300,
  boostsUsed: 3,
  totalBoosts: 5,
  correctPredictions: 40,
  playedGames: 50, // Only completed games
  accuracy: 80, // percentage, not decimal (correctPredictions / playedGames)
  rankChange: 2,
  ...overrides
})
```

## Validation Considerations

### SonarCloud Requirements

1. **Code Coverage: ≥80% on new code**
   - All new components must have unit tests
   - Critical paths must be covered (expand/collapse, highlighting, ranking)
   - Edge cases tested (no rank change, first place, last place)

2. **0 New Issues (Any Severity)**
   - No unused imports
   - No console.log statements
   - Proper TypeScript typing (no `any`)
   - No accessibility violations
   - No code smells (complex functions, duplicated code)

3. **Security Rating: A**
   - No XSS vulnerabilities (sanitize user names if needed)
   - No sensitive data exposed in client components

4. **Maintainability: B or Higher**
   - Functions < 20 lines
   - Components < 150 lines
   - Cognitive complexity < 15
   - Extract helper functions for calculations

### Pre-Commit Checklist

Before committing:
- [ ] Run `npm test` - All tests pass
- [ ] Run `npm run lint` - No linting errors
- [ ] Run `npm run build` - Production build succeeds
- [ ] Manual test on mobile device - Card layout works
- [ ] Manual test on desktop - Table layout works
- [ ] Accessibility audit - No violations
- [ ] Visual review - Matches design prototypes

### Quality Gates

1. **Functionality:**
   - Cards render correctly on mobile
   - Table renders correctly on desktop
   - Expand/collapse works smoothly
   - Current user highlighted
   - Rank changes accurate

2. **Performance:**
   - No layout shifts (CLS < 0.1)
   - Smooth animations (60fps)
   - Fast initial render (< 1s)

3. **Accessibility:**
   - WCAG AA compliant
   - Keyboard navigable
   - Screen reader friendly
   - Color contrast meets standards

4. **Responsive:**
   - Works on all viewport sizes
   - No horizontal scroll on mobile
   - Smooth transition between breakpoints

## Rank Change Calculation (RESOLVED)

**Approach:** Calculate rank changes by comparing current leaderboard to previous snapshot.

**Implementation:**
```typescript
// In LeaderboardView or custom hook
const calculateRankChanges = (
  currentScores: UserScore[],
  previousScores?: UserScore[]
): Map<string, number> => {
  const rankChanges = new Map<string, number>()

  // Sort current scores by total points
  const currentRanked = [...currentScores]
    .sort((a, b) => b.totalPoints - a.totalPoints)

  // If no previous data, all rank changes are 0
  if (!previousScores) {
    currentRanked.forEach(user => rankChanges.set(user.id, 0))
    return rankChanges
  }

  // Sort previous scores by total points
  const previousRanked = [...previousScores]
    .sort((a, b) => b.totalPoints - a.totalPoints)

  // Build previous rank map
  const previousRankMap = new Map<string, number>()
  previousRanked.forEach((user, index) => {
    previousRankMap.set(user.id, index + 1)
  })

  // Calculate rank change for each user
  currentRanked.forEach((user, currentIndex) => {
    const currentRank = currentIndex + 1
    const previousRank = previousRankMap.get(user.id)

    if (previousRank === undefined) {
      // New user - no rank change
      rankChanges.set(user.id, 0)
    } else {
      // Rank change = previous - current (positive = improved)
      rankChanges.set(user.id, previousRank - currentRank)
    }
  })

  return rankChanges
}
```

**Edge Cases:**
- **No previous data:** All rank changes = 0
- **New user in current:** Rank change = 0
- **User left tournament:** Not in current, ignored
- **Ties (same points):** Rank by user ID (deterministic sorting)

## Data Transformation Logic

**Source:** `UserScore` from `getUserScoresForTournament()` (existing function)

**Transformation:**
```typescript
interface UserScore {
  userId: string
  userName: string
  totalPoints: number
  groupStagePoints?: number
  knockoutPoints?: number
  boostsUsed: number
  correctPredictions: number
  playedGames: number // Games already completed/decided (NOT future predictions)
}

// Transform to LeaderboardUser
const transformToLeaderboardUser = (
  score: UserScore,
  rankChange: number
): LeaderboardUser => ({
  id: score.userId,
  name: score.userName,
  totalPoints: score.totalPoints,
  groupPoints: score.groupStagePoints ?? 0,
  knockoutPoints: score.knockoutPoints ?? 0,
  boostsUsed: score.boostsUsed,
  totalBoosts: 5, // Tournament default
  correctPredictions: score.correctPredictions,
  playedGames: score.playedGames,
  accuracy: score.playedGames > 0
    ? Math.round((score.correctPredictions / score.playedGames) * 100)
    : 0,
  rankChange
})
```

**Null/Undefined Handling:**
- `groupStagePoints` undefined → default to 0
- `knockoutPoints` undefined → default to 0
- `playedGames` = 0 → accuracy = 0 (avoid division by zero)
- `userName` empty → fallback to "Unknown User"

**Important Note on Accuracy:**
- **Accuracy is calculated ONLY from games already played/decided**, not from total predictions
- `playedGames` includes:
  - Completed matches (final score known)
  - Decided outcomes (e.g., qualified teams for knockout stage)
- `playedGames` excludes:
  - Future matches (not yet played)
  - Pending predictions (match in progress but not finalized)
- This ensures accuracy reflects actual performance, not diluted by pending predictions

## Open Questions

1. **Sorting Options:**
   - Should users be able to sort by different criteria (accuracy, group points, etc.)?
   - Or always sort by total points?
   - **Assume: Always sort by total points for MVP**

2. **Pagination:**
   - Should we paginate for tournaments with 100+ participants?
   - Or show all cards with infinite scroll?
   - **Assume: Show all cards for MVP, optimize later if needed**

3. **Expand Behavior:**
   - Should only one card be expanded at a time (mutual exclusion)?
   - Or allow multiple cards expanded?
   - **Assume: Mutual exclusion (better mobile UX)**

4. **Animation Duration:**
   - What's the optimal expand/collapse animation duration?
   - **Assume: 300ms (Material-UI standard)**

## Edge Case Handling

### Tie-Breaking (Same Total Points)
```typescript
// Sort with tie-breaking by user ID (deterministic)
const sortedScores = [...scores].sort((a, b) => {
  if (b.totalPoints !== a.totalPoints) {
    return b.totalPoints - a.totalPoints
  }
  // Tie: sort by user ID alphabetically
  return a.userId.localeCompare(b.userId)
})
```

### Long User Names
- Truncate with ellipsis after 25 characters
- Full name in tooltip/aria-label
- CSS: `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`

### Special Characters in Names
- User names already sanitized on backend (trust server data)
- Use React's built-in XSS protection (no dangerouslySetInnerHTML)
- If HTML entities present, use `he.decode()` from `he` library (already in project)

### Missing Data
- `currentUserId` undefined → No card highlighted
- `scores` empty array → Show empty state
- Individual score fields undefined → Use fallback values (see Data Transformation)

### Number Formatting
- Use `toLocaleString()` for points (1,245)
- No internationalization for MVP (assume en-US locale)
- Future: Use Next.js i18n if project adds multi-language support

## Dependencies

- Material-UI v7 (already in project)
- React 19 (already in project)
- TypeScript (already configured)
- Vitest (testing framework)

No external dependencies needed.

## Risk Assessment

### Low Risk
- Using existing Material-UI patterns
- Following established component structure
- Simple state management (local state only)

### Medium Risk
- Responsive behavior edge cases (viewport transitions)
- Performance with large datasets (100+ users)
- Animation smoothness on lower-end devices
- Component size exceeding 150 line limit (LeaderboardCard with expanded state)

### Mitigation Strategies
1. **Responsive edge cases:** Thorough testing on real devices, debounce resize handler
2. **Performance:** Use React.memo, useMemo for expensive calculations, virtual scrolling if > 100 cards
3. **Animation:** Reduce motion for users with prefers-reduced-motion
4. **Component size:** Split LeaderboardCard into sub-components (CardHeader, CardContent, CardDetails) if approaching limit

## Success Criteria

This implementation is successful when:

1. ✅ Mobile leaderboard shows cards instead of table
2. ✅ Desktop leaderboard maintains table layout
3. ✅ No horizontal scrolling on mobile
4. ✅ Current user card is highlighted
5. ✅ Rank change indicators are accurate and visible
6. ✅ Expand/collapse works smoothly
7. ✅ All tests pass with ≥80% coverage
8. ✅ 0 new SonarCloud issues
9. ✅ Accessibility standards met (WCAG AA)
10. ✅ No performance regressions

## Notes

- This is a UI-focused story with no backend changes
- Server Components pass data to Client Components (existing pattern)
- Rank change calculation logic may need refinement based on product feedback
- Consider adding analytics tracking for expand/collapse interactions (future enhancement)

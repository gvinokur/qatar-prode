# Plan: Countdown Timers for Game Deadlines (#13)

## Story Context

**Issue**: [UXI-003] Countdown Timers for Deadlines (#13)
**Milestone**: Sprint 1-2: Critical Fixes
**Priority**: Critical
**Effort**: Low (1-2 days)

### Problem
- Static timestamps require mental calculation ("Jan 18, 15:00")
- Users miss prediction deadlines due to timezone confusion
- No sense of urgency

### Solution
Replace timestamps with dynamic countdown timers showing:
- **Relative countdown**: "Closes in 3 hours 45 minutes"
- **Actual time reference**: Show static timestamp alongside or in tooltip (users need schedule reference)
- **Color-coded urgency** (matching existing prediction-status-bar.tsx pattern):
  - 🔴 Error/Red (<2h): Closing within 2 hours - urgent action needed
  - 🟠 Warning/Orange (2-24h): Closing today - plan to predict soon
  - 🔵 Info/Blue (24-48h): Closing tomorrow - notice to prepare
  - ⚪ Neutral (>48h): No urgency - don't distract user
  - ⚫ Disabled/Gray: Closed for predictions
- **Progress bar visual**: Only show when <48h (conditional to avoid clutter)
- **Pulsing animation**: When <2h to match urgency level

### Success Metrics
- Deadline calculation time: 5-10 sec → 0 sec
- Late submissions: -40%
- Urgency awareness: +60%

## Technical Context

**Current Implementation:**
- Line 146 of `compact-game-view-card.tsx` shows: `#{gameNumber} - {showLocalTime ? getUserLocalTime(gameDate) : getLocalGameTime(gameDate, gameTimezone)}`
- Timezone toggle exists (lines 148-157)
- Prediction deadline: 1 hour before game start
- Edit disabled calculated in `game-view.tsx`: `Date.now() + ONE_HOUR > game.game_date.getTime()`

**Architecture:**
- Client component (needs real-time updates)
- Framer Motion available for animations (`celebration-effects.tsx` pattern)
- dayjs with timezone plugin for date handling
- TimezoneProvider already exists in layout
- Multiple cards displayed in GamesGrid (performance critical)
- **Existing urgency patterns**: `prediction-dashboard.tsx` (lines 81-95) and `prediction-status-bar.tsx` define urgency thresholds:
  - Urgent: <2h (error/red)
  - Warning: 2-24h (warning/orange)
  - Notice: 24-48h (info/blue)

## Implementation Approach

### Strategy
Create a performance-optimized countdown system with:
1. Shared timer context (one interval for all cards)
2. Reusable countdown component
3. Integration into CompactGameViewCard
4. Color-coded urgency with pulsing animation

### Urgency Levels (Aligned with prediction-status-bar.tsx)
- **Neutral** (>48h): Gray (`text.secondary`) - no urgency
- **Notice** (24-48h): Blue (`info.main` from MUI Alert)
- **Warning** (2-24h): Orange (`warning.main` from MUI Alert)
- **Urgent** (<2h): Red (`error.main` from MUI Alert) + pulsing
- **Closed** (<0): Gray (`text.disabled`)

### Progress Bar (Conditional Display)
- **Only show when <48h** to avoid clutter (games >90 days away would be confusing)
- Linear progress from 100% (48h before) to 0% (deadline)
- Color matches urgency level (blue → orange → red as time decreases)
- 4px height, rounded corners
- Hidden for games >48h away

## Files to Create

### 1. `/Users/gvinokur/Personal/qatar-prode-story-13/app/utils/countdown-utils.ts`
**Purpose**: Pure utility functions for countdown logic

**Functions**:
```typescript
export const ONE_HOUR = 60 * 60 * 1000;

// Calculate deadline (1 hour before game)
export function calculateDeadline(gameDate: Date): number

// Format milliseconds as "3h 45m", "45m", "2 days"
export function formatCountdown(ms: number): string

// Return urgency level based on time remaining
// Matches thresholds from prediction-dashboard.tsx
export function getUrgencyLevel(ms: number): 'neutral' | 'notice' | 'warning' | 'urgent' | 'closed'

// Calculate progress bar percentage (100% at 48h, 0% at deadline)
export function calculateProgress(gameDate: Date, currentTime: number): number

// Get MUI theme color for urgency level
export function getUrgencyColor(theme: Theme, urgency: UrgencyLevel): string
```

### 2. `/Users/gvinokur/Personal/qatar-prode-story-13/app/components/context-providers/countdown-context-provider.tsx`
**Purpose**: Shared timer to prevent performance issues with multiple cards

**Implementation**:
- Single `setInterval` updating every 1 second
- Provides `currentTime` to all subscribers
- Cleanup on unmount

### 3. `/Users/gvinokur/Personal/qatar-prode-story-13/app/hooks/use-game-countdown.ts`
**Purpose**: Custom hook for countdown state

**Returns**:
```typescript
{
  display: string,           // "Closes in 3h 45m"
  urgency: UrgencyLevel,     // For color coding
  progressPercent: number,   // 0-100
  timeRemaining: number,     // milliseconds
  isClosed: boolean
}
```

### 4. `/Users/gvinokur/Personal/qatar-prode-story-13/app/components/game-countdown-display.tsx`
**Purpose**: Reusable countdown UI component

**Features**:
- **Countdown display**: "Closes in 3h 45m" in color-coded text
- **Actual time reference**: Show static timestamp alongside (users need schedule reference) or in tooltip
- Color-coded text based on urgency (matches Alert severity colors)
- Optional progress bar (MUI LinearProgress) - **only shown when <48h**
- Pulsing animation (framer-motion) when <2h (urgent)
- Handles "Closed" and "In Progress" states
- Respects TimezoneContext for toggle behavior

**Props**:
```typescript
{
  gameDate: Date,
  gameTimezone?: string,
  showProgressBar?: boolean,  // Default: true, but conditional rendering if <48h
  showActualTime?: boolean,    // Show timestamp alongside countdown (default: true)
  compact?: boolean
}
```

### 5. Test Files
- `__tests__/utils/countdown-utils.test.ts`
- `__tests__/hooks/use-game-countdown.test.ts`
- `__tests__/components/game-countdown-display.test.tsx`

## Files to Modify

### 1. `/Users/gvinokur/Personal/qatar-prode-story-13/app/layout.tsx`
**Change**: Add CountdownProvider wrapper

**Location**: After line 50 (after TimezoneProvider)
```typescript
<TimezoneProvider>
  <CountdownProvider>
    <NextThemeProvider ...>
      ...
    </NextThemeProvider>
  </CountdownProvider>
</TimezoneProvider>
```

### 2. `/Users/gvinokur/Personal/qatar-prode-story-13/app/components/compact-game-view-card.tsx`
**Change**: Replace timestamp with countdown display

**Location**: Line 144-157 (game number and date section)

**Before**:
```typescript
<Typography variant="body2" color="text.secondary">
  #{gameNumber} - {showLocalTime ? getUserLocalTime(gameDate) : getLocalGameTime(gameDate, gameTimezone)}
</Typography>
```

**After**:
```typescript
<Box display="flex" flexDirection="column" gap={0.5} flex={1}>
  <Box display="flex" alignItems="center" gap={1}>
    <Typography variant="body2" color="text.secondary">
      #{gameNumber}
    </Typography>
    <GameCountdownDisplay
      gameDate={gameDate}
      gameTimezone={showLocalTime ? undefined : gameTimezone}
      showProgressBar={true}
      showActualTime={true}  // Show both countdown and timestamp
      compact={true}
    />
  </Box>
</Box>
```

**Note**: The GameCountdownDisplay component will internally show both:
- Primary: Countdown timer ("Closes in 3h 45m")
- Secondary: Actual time (e.g., in tooltip or smaller text) for schedule reference

**Imports to add**:
```typescript
import GameCountdownDisplay from './game-countdown-display';
```

### 3. `/Users/gvinokur/Personal/qatar-prode-story-13/app/components/game-view.tsx`
**Optional Change**: Import ONE_HOUR from countdown-utils for consistency

**Current**: Line has local constant
**After**: `import { ONE_HOUR } from '../utils/countdown-utils';`

## Implementation Steps

### Phase 1: Foundation (Utilities & Tests)
1. Create `countdown-utils.ts` with all utility functions
2. Write unit tests for `countdown-utils.test.ts`
   - Test formatCountdown with various time ranges
   - Test getUrgencyLevel boundary conditions
   - Test calculateProgress edge cases
   - Test calculateDeadline accuracy
3. Verify all tests pass

### Phase 2: Context & Hook
4. Create `countdown-context-provider.tsx`
   - Single setInterval updating every second
   - Provide currentTime via context
5. Create `use-game-countdown.ts` hook
   - Subscribe to countdown context
   - Calculate countdown state from gameDate
   - Memoize calculations
6. Write hook tests with `vi.useFakeTimers()`
7. Add CountdownProvider to `layout.tsx` (line 50)

### Phase 3: Display Component
8. Create `game-countdown-display.tsx`
   - Use `use-game-countdown` hook
   - Implement color-coded display
   - Add MUI LinearProgress for progress bar
   - Add framer-motion pulsing for urgent state
9. Write component tests
   - Test different urgency levels
   - Verify colors applied correctly
   - Test progress bar rendering
   - Test "Closed" state

### Phase 4: Integration
10. Modify `compact-game-view-card.tsx`
    - Import GameCountdownDisplay
    - Replace timestamp (line 146)
    - Maintain timezone toggle functionality
11. Test in GamesGrid with multiple cards
12. Verify performance with 12+ cards
13. Test timezone toggle still works

### Phase 5: Polish
14. Handle "In Progress" state (game started, no result)
15. Test across timezone boundaries
16. Verify responsive design on mobile
17. Test with past games, future games, games in progress
18. Check dark/light theme compatibility

## Testing Strategy

### Unit Tests (Vitest)

**countdown-utils.test.ts**:
- `formatCountdown()`: Various time ranges (days, hours, minutes, seconds)
- `getUrgencyLevel()`: Boundary conditions (exactly 1h, 24h, 48h)
- `calculateProgress()`: Edge cases (past deadline, far future)
- `calculateDeadline()`: Verify 1-hour offset

**use-game-countdown.test.ts**:
- Mock Date.now() with vi.useFakeTimers()
- Test countdown updates when context time changes
- Test urgency level transitions
- Test "closed" state handling
- Verify memoization works

### Component Tests

**game-countdown-display.test.tsx**:
- Render with different urgency levels
- Verify correct theme colors applied
- Test progress bar visibility and value
- Test pulsing animation presence (mock framer-motion if needed)
- Test "Closed" display

### Integration Tests

**Manual testing in development**:
- [ ] Multiple cards (12+) render without lag
- [ ] Countdowns update in real-time every second
- [ ] Colors change at correct thresholds (48h, 24h, 2h) - matching prediction-status-bar.tsx
- [ ] Pulsing animation starts at < 2 hours (urgent level)
- [ ] Progress bar animates smoothly and only shows when <48h
- [ ] "Closed" shows for past games
- [ ] Actual time displayed alongside countdown
- [ ] Timezone toggle works correctly
- [ ] Mobile responsive
- [ ] Dark/light theme compatibility

### Performance Validation
- Open React DevTools Profiler
- Render GamesGrid with 20+ cards
- Monitor render count per card (should be minimal)
- Verify single interval running (not N intervals)
- Check memory usage stays stable

## Verification Steps

### Development Testing
1. Run dev server: `npm run dev`
2. Navigate to page with multiple game cards
3. Observe countdown timers updating every second
4. Verify colors change at thresholds
5. Test timezone toggle functionality
6. Check performance with many cards

### Automated Testing
1. Run unit tests: `npm test countdown-utils`
2. Run hook tests: `npm test use-game-countdown`
3. Run component tests: `npm test game-countdown-display`
4. Verify coverage: `npm run coverage`

### Pre-merge Checklist
- [ ] All unit tests passing
- [ ] All component tests passing
- [ ] Coverage >60% for new files
- [ ] Manual testing complete
- [ ] Performance validated (20+ cards)
- [ ] Timezone toggle works
- [ ] Responsive on mobile
- [ ] Dark/light theme tested
- [ ] No console errors
- [ ] ESLint passes

## Edge Cases

### Handled States
1. **Past games**: Show "Closed" (gray text)
2. **Games in progress**: Show "In Progress" with clock icon
3. **Far future**: Show "Opens in X days" for games >7 days away
4. **Timezone DST**: dayjs handles automatically
5. **Invalid timezone**: Falls back to user local time
6. **Clock skew**: Use client time (acceptable for countdown)

### Accessibility
- ARIA labels for screen readers ("Predictions close in 3 hours")
- Color not sole indicator (text always present)
- Respect `prefers-reduced-motion` (disable pulsing)

## Design Decisions (Based on Feedback)

### 1. Display Both Countdown and Actual Time
**Decision**: Show countdown as primary info with actual time as secondary reference
**Options considered**:
- **Option A (Recommended)**: Countdown with tooltip showing actual time
  - Hover/tap on countdown shows "Feb 15, 2026 - 15:00"
  - Clean, not cluttered
- **Option B**: Side-by-side display
  - "Closes in 3h 45m (Feb 15, 15:00)"
  - More visible but takes more space
- **Option C**: Toggle between countdown and actual time
  - Already have timezone toggle, too many toggles

**Implementation**: Start with Option A (tooltip), can adjust based on user testing

### 2. Progress Bar Visibility
**Decision**: Only show when <48h
**Reason**: Games >90 days away would show confusing/meaningless progress bars

### 3. Color Scheme Alignment
**Decision**: Match existing prediction-status-bar.tsx patterns
**Thresholds**: <2h (error), 2-24h (warning), 24-48h (info), >48h (neutral)
**Reason**: Consistency across the app, users already understand these colors

### 4. Pulsing Animation Threshold
**Decision**: <2h (urgent level only)
**Reason**: Matches the most critical urgency level from existing patterns

## Dependencies

**No new packages required**:
- dayjs (already installed)
- framer-motion (already installed)
- @mui/material (already installed)
- React hooks (built-in)

## Rollback Plan

If issues arise:
1. Revert changes to `compact-game-view-card.tsx`
2. Remove CountdownProvider from `layout.tsx`
3. Static timestamps remain functional
4. No data layer changes, so safe to rollback

## Critical Files Reference

**Integration point**: `/Users/gvinokur/Personal/qatar-prode-story-13/app/components/compact-game-view-card.tsx` (line 146)

**Existing patterns**: `/Users/gvinokur/Personal/qatar-prode/app/components/celebration-effects.tsx` (framer-motion examples)

**Date utilities**: `/Users/gvinokur/Personal/qatar-prode/app/utils/date-utils.ts`

**Layout**: `/Users/gvinokur/Personal/qatar-prode/app/layout.tsx` (line 50 for provider)

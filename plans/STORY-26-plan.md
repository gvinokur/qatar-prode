# Implementation Plan: Story #26 - Rank Change Animations

## Story Context

**Issue:** [UXI-016] Rank Change Animations (#26)
**Milestone:** Sprint 7-9: Engagement & Gamification
**Effort:** Low (1-2 days)
**Priority:** Medium

### Problem
- Rank changes in leaderboards feel static and lifeless
- Users don't notice when they move up or down in rankings
- No celebration when users improve their position
- Missed opportunity to create emotional engagement and delight

### Solution
Add animated rank transitions to leaderboards with:
- Slide animations when positions change
- Green glow and confetti effects for rank improvements
- Animated point counters showing changes
- Staggered animations (cascade effect) for multiple users
- Haptic feedback on mobile devices

### Success Metrics
- User excitement: +30%
- Emotional engagement: +25%
- Rank change awareness: +40%

## Technical Approach

### Overview

This implementation adds rank change tracking and animations to the friends group leaderboard table. We'll:

1. **Add database columns** to track daily rank snapshots
2. **Update repository logic** to automatically snapshot scores daily
3. **Create rank calculation utilities** to compute current vs yesterday's ranks
4. **Build reusable animation components** for rank changes
5. **Integrate animations** into the existing leaderboard table

### Database Changes

**Migration:** `20260206000000_add_rank_tracking_to_tournament_guesses.sql`

Add two columns to `tournament_guesses` table:
```sql
ALTER TABLE tournament_guesses
  ADD COLUMN last_score_update_date INTEGER,
  ADD COLUMN yesterday_tournament_score INTEGER;

COMMENT ON COLUMN tournament_guesses.last_score_update_date IS 'Date (YYYYMMDD format) when tournament scores were last updated - used to trigger daily snapshots';
COMMENT ON COLUMN tournament_guesses.yesterday_tournament_score IS 'Snapshot of previous day''s tournament score total (sum of honor_roll + individual_awards + qualified_teams + group_position scores)';
```

**Why this approach works:**
- Game scores already have implicit history via `games.game_date`
- Only tournament scores need daily snapshots (no natural timestamps)
- No new tables required - minimal schema change
- Automatic snapshot on first update each day

### Rank Change Calculation Strategy

**Current Rank Calculation:**
```typescript
// Game points: All completed games
const gamePoints = SUM(game_guesses.final_score)

// Tournament points: All tournament scoring categories
const tournamentPoints =
  (tournament_guesses.honor_roll_score || 0) +
  (tournament_guesses.individual_awards_score || 0) +
  (tournament_guesses.qualified_teams_score || 0) +
  (tournament_guesses.group_position_score || 0)

const currentTotal = gamePoints + tournamentPoints
```

**Previous Rank Calculation (Yesterday):**
```typescript
// Game points: Only games completed before today
const yesterdayGamePoints = SUM(game_guesses.final_score
  WHERE games.game_date < today)

// Tournament points: Snapshot from yesterday
const yesterdayTournamentPoints =
  tournament_guesses.yesterday_tournament_score || 0

const yesterdayTotal = yesterdayGamePoints + yesterdayTournamentPoints
```

**Ranking Logic:**
```typescript
// Sort users by total points descending
const sortedByTotal = users.sort((a, b) => b.total - a.total)

// Assign ranks with tie handling (competition ranking)
// Example: [50, 45, 45, 40] → Ranks [1, 2, 2, 4]
let rank = 1
for (let i = 0; i < sortedByTotal.length; i++) {
  if (i > 0 && sortedByTotal[i].total < sortedByTotal[i-1].total) {
    rank = i + 1
  }
  sortedByTotal[i].rank = rank
}
```

### Architecture: Server vs Client Components

**Server-Side (Database Access):**
- `app/actions/rank-calculation-actions.ts` - Server action for rank calculations
- `app/utils/rank-calculator.ts` - Pure calculation logic (can be used server or client)
- Parent page components that fetch rank data

**Client-Side (Animations):**
- `app/components/leaderboard/rank-change-animations.tsx` - All animation components
- `app/components/friend-groups/friends-group-table.tsx` - Remains client component

**Data Flow:**
```
Parent Page (Server Component)
  ↓ (calls server action)
calculateUserRanksWithHistory() [Server Action]
  ↓ (fetches from DB)
Database queries
  ↓ (calculates)
Rank calculation utility
  ↓ (returns data)
Parent Page
  ↓ (passes as props)
ProdeGroupTable [Client Component]
  ↓ (renders with)
Animation Components [Client Components]
```

### Files to Create

#### 1. Migration File
**Path:** `migrations/20260206000000_add_rank_tracking_to_tournament_guesses.sql`
- Add `last_score_update_date` column (INTEGER)
- Add `yesterday_tournament_score` column (INTEGER)
- Add comments for documentation

#### 2. Date Utility
**Path:** `app/utils/date-utils.ts`
```typescript
/**
 * Get today's date in YYYYMMDD format
 * @returns Integer representation of today (e.g., 20260206)
 */
export function getTodayYYYYMMDD(): number
```

#### 3. Rank Calculation Utility
**Path:** `app/utils/rank-calculator.ts`
```typescript
/**
 * Calculate current and previous ranks for users
 * @param users - Array of users with scores
 * @param gameScores - Current game scores by user
 * @param yesterdayGameScores - Yesterday's game scores by user
 * @param tournamentGuesses - Tournament guesses with snapshots
 * @returns Array of users with current rank, previous rank, and rank change
 */
export function calculateRankChanges(...)

/**
 * Get yesterday's game scores (games before today)
 */
export async function getYesterdayGameScores(...)
```

#### 3. Server Action for Rank Calculation
**Path:** `app/actions/rank-calculation-actions.ts`
- Server action: `calculateUserRanksWithHistory()`
- Includes error handling with graceful degradation
- Returns rank data for client consumption

#### 4. Animation Components
**Path:** `app/components/leaderboard/rank-change-animations.tsx`

Components to create:
- `<RankChangeIndicator>` - Shows rank change arrow (↑ or ↓) with number
- `<AnimatedRankCell>` - Table cell with slide animation on rank change
- `<AnimatedPointsCounter>` - Animated number that counts up/down
- `<RankUpCelebration>` - Confetti + glow effect for rank improvements (haptic on mount if show=true, only for logged-in user)
- `<StaggeredLeaderboardRow>` - Row with staggered entrance animation
**Path:** `app/actions/rank-calculation-actions.ts`
- Server-side function to calculate ranks with yesterday comparison
- Fetches yesterday game scores and tournament snapshots
- Returns fully calculated rank data for client consumption

#### 5. Updated Table Component
**Path:** `app/components/friend-groups/friends-group-table.tsx`
- Remains a Client Component for animations
- Receives pre-calculated rank data from parent
- Replaces static cells with animated components
- Add staggered animation timing

### Implementation Steps

#### Step 1: Database Migration
1. Create migration file `20260206000000_add_rank_tracking_to_tournament_guesses.sql`
2. Add columns to `tournament_guesses` table
3. Add documentation comments
4. **Do not run migration yet** - wait for approval

#### Step 2: Update Repository Logic
1. Open `app/db/tournament-guess-repository.ts`
2. Create wrapper function `updateTournamentGuessWithSnapshot`:
   ```typescript
   async function updateTournamentGuessWithSnapshot(
     guessId: string,
     updates: TournamentGuessUpdate
   ): Promise<TournamentGuess | undefined> {
     const existing = await findTournamentGuessById(guessId)
     const today = getTodayYYYYMMDD()

     // Check if new day - snapshot if needed
     // Race condition protection: Only snapshot if yesterday_tournament_score is still from previous day
     if (existing?.last_score_update_date &&
         today > existing.last_score_update_date) {
       // Calculate current tournament score total
       const currentTotal =
         (existing.honor_roll_score || 0) +
         (existing.individual_awards_score || 0) +
         (existing.qualified_teams_score || 0) +
         (existing.group_position_score || 0)

       updates.yesterday_tournament_score = currentTotal
     }

     // Always update date - even if no snapshot
     // This prevents race: first update snapshots, subsequent same-day updates don't
     updates.last_score_update_date = today
     return updateTournamentGuess(guessId, updates)
   }
   ```
3. Export the wrapper function
4. Add JSDoc comment explaining race condition handling:
   ```typescript
   /**
    * Update tournament guess with automatic daily snapshot.
    * Snapshots are created only on first update each day (race-safe).
    * Subsequent updates on same day will not re-snapshot.
    */
   ```

#### Step 3: Update Backoffice Actions
1. Open `app/actions/backoffice-actions.ts`
2. Find all places that call `updateTournamentGuess` (4 locations):
   - Line ~604: Honor roll score updates
   - Line ~522: Qualified teams score updates
   - Line ~569: Individual awards score updates
   - Line ~906: Group position score updates
3. Replace calls with `updateTournamentGuessWithSnapshot`
4. Import the new wrapper function

#### Step 4: Create Rank Calculation Utility
1. Create `app/utils/rank-calculator.ts`
2. Implement `calculateRankChanges` function:
   - Accept user scores, game scores, yesterday game scores, tournament guesses
   - Calculate current total and rank for each user
   - Calculate yesterday total and rank for each user
   - Return array with rank change data
3. Implement `getYesterdayGameScores` helper:
   - Query game_guesses joined with games
   - Filter WHERE `games.game_date < today()`
   - Aggregate by user_id
4. Add unit tests for rank calculation logic

#### Step 5: Create Animation Components
1. Create `app/components/leaderboard/rank-change-animations.tsx`
2. Implement `<RankChangeIndicator>`:
   - Props: `rankChange` (number), `size` (optional)
   - Show ↑ arrow + number if positive (green)
   - Show ↓ arrow + number if negative (red)
   - No indicator if no change
3. Implement `<AnimatedRankCell>`:
   - Props: `rank` (number), `previousRank` (number | undefined)
   - Use `motion.div` from framer-motion
   - Slide animation if rank changed
   - Glow effect on rank improvement
4. Implement `<AnimatedPointsCounter>`:
   - Props: `value` (number), `previousValue` (number | undefined), `duration` (optional)
   - Use `useSpring` from framer-motion
   - Animate from previous to current value
   - Green text if increased, red if decreased
5. Implement `<RankUpCelebration>`:
   - Props: `show` (boolean), `rank` (number)
   - Reuse `<ConfettiEffect>` from `celebration-effects.tsx`
   - Add green glow effect with CSS box-shadow
   - Trigger haptic feedback on mobile
6. Implement `<StaggeredLeaderboardRow>`:
   - Props: `children`, `index` (number), `staggerDelay` (optional)
   - Use `motion.tr` with entrance animation
   - Delay based on index for cascade effect

#### Step 6: Create Server Action for Rank Calculation
1. Create `app/actions/rank-calculation-actions.ts`
2. Define complete return type structure:
   ```typescript
   'use server'

   export type RankData = {
     userId: string
     currentRank: number
     previousRank?: number
     rankChange: number
     currentPoints: number
     previousPoints?: number
   }

   export type RankCalculationResult = {
     users: RankData[]
     hasRankChanges: boolean
     error?: boolean
   }
   ```
3. Implement server action:
   ```typescript
   export async function calculateUserRanksWithHistory(
     tournamentId: string,
     userIds: string[]
   ): Promise<RankCalculationResult> {
     try {
       // Fetch yesterday's game scores
       const yesterdayGameScores = await getYesterdayGameScores(
         tournamentId,
         userIds
       )

       // Fetch current data
       const currentGameScores = await getCurrentGameScores(
         tournamentId,
         userIds
       )

       const tournamentGuesses = await findTournamentGuessByUserIdsTournament(
         userIds,
         tournamentId
       )

       // Calculate ranks
       const result = calculateRankChanges(
         currentGameScores,
         yesterdayGameScores,
         tournamentGuesses
       )

       return {
         users: result,
         hasRankChanges: result.some(u => u.rankChange !== 0)
       }
     } catch (error) {
       console.error('Failed to calculate ranks:', error)
       // Return empty data on error (graceful degradation)
       return {
         users: [],
         hasRankChanges: false,
         error: true
       }
     }
   }
   ```
4. Export the function and types

#### Step 7: Integrate Animations into Leaderboard
1. Open `app/components/friend-groups/friends-group-table.tsx`
2. Import animation components only (data comes from props)
3. Update component props to accept rank data:
   ```typescript
   import type { RankCalculationResult } from '@/app/actions/rank-calculation-actions'

   type Props = {
     // ... existing props
     rankData?: RankCalculationResult
   }
   ```
4. In parent component (page that renders ProdeGroupTable):
   - Call server action to get rank data
   - Pass rank data as prop
5. Use rank data in table rendering (no async in render)
4. Handle "no previous data" scenario and find rank data:
   ```typescript
   // Check if we have any rank history
   const hasHistory = rankData && !rankData.error && rankData.hasRankChanges

   // Find rank data for current user
   const userRankData = rankData?.users.find(r => r.userId === userScore.userId)

   // Display message on first viewing (no history yet)
   {!hasHistory && (
     <Typography variant="caption" color="text.secondary">
       Vuelve mañana para ver cambios en la clasificación
     </Typography>
   )}
   ```
5. Replace static rank cell (line 191):
   ```typescript
   <TableCell>
     <AnimatedRankCell
       rank={userRankData?.currentRank || index + 1}
       previousRank={userRankData?.previousRank}
     />
     {userRankData && (
       <RankChangeIndicator rankChange={userRankData.rankChange} />
     )}
   </TableCell>
   ```
6. Replace static points cell (line 223):
   ```typescript
   <TableCell>
     <AnimatedPointsCounter
       value={userScore.totalPoints}
       previousValue={userRankData?.previousPoints}
     />
   </TableCell>
   ```
7. Replace `<TableRow>` (line 190) with `<StaggeredLeaderboardRow>`:
   ```typescript
   <StaggeredLeaderboardRow
     key={userScore.userId}
     index={index}
     selected={userScore.userId === loggedInUser}
   >
     {/* existing cells */}
     {userRankData && userRankData.rankChange > 0 && (
       <RankUpCelebration
         show={true}
         rank={userRankData.currentRank}
       />
     )}
   </StaggeredLeaderboardRow>
   ```

#### Step 8: Add Haptic Feedback (Mobile)
1. Create utility function in `app/utils/haptics.ts`:
   ```typescript
   export function triggerRankUpHaptic() {
     if (typeof window !== 'undefined' &&
         'vibrate' in navigator) {
       // Short-long-short pattern for rank up
       navigator.vibrate([50, 100, 50])
     }
   }
   ```
2. Call from `<RankUpCelebration>` component on mount using `useEffect`:
   ```typescript
   useEffect(() => {
     if (show) {
       triggerRankUpHaptic()
     }
   }, [show])
   ```
3. Only trigger for logged-in user's rank improvement (not all users)

#### Step 9: Update Type Definitions
1. Open `app/db/tables-definition.ts`
2. Update `TournamentGuessTable` interface (line 261):
   ```typescript
   export interface TournamentGuessTable extends Identifiable {
     // ... existing fields ...
     group_position_score?: number

     // New fields for rank tracking
     last_score_update_date?: number  // YYYYMMDD format
     yesterday_tournament_score?: number  // Snapshot of previous day's score
   }
   ```
3. Verify derived types are updated:
   - `TournamentGuess` (Selectable)
   - `TournamentGuessNew` (Insertable)
   - `TournamentGuessUpdate` (Updateable)

   These should automatically include the new fields due to TypeScript mapped types.

4. **EXPLICIT VERIFICATION - Do not skip this:**
   - After updating `TournamentGuessTable`, check `TournamentGuessUpdate` type
   - Add a test assignment in Step 2 wrapper function:
     ```typescript
     // Type verification: These assignments should not error
     const testUpdate: TournamentGuessUpdate = {
       last_score_update_date: 20260206,
       yesterday_tournament_score: 100
     }
     ```
   - If TypeScript errors: The mapped types didn't work, manually add fields to `TournamentGuessUpdate`
   - Remove test code after verification

#### Step 10: Verify Repository Wrapper Integration
1. After Step 3 (updating backoffice-actions.ts), verify all 4 locations:
   - Search for all `updateTournamentGuess(` calls in backoffice-actions.ts
   - Confirm each is replaced with `updateTournamentGuessWithSnapshot(`
   - Verify import statement at top of file
2. Run TypeScript compilation to catch any type errors:
   ```bash
   npm run build
   ```

### Visual Prototypes

#### 1. Leaderboard Table with Rank Changes

```
┌────────────────────────────────────────────────────────────────┐
│                    Tabla de Posiciones                          │
├───┬──────────────┬────────────┬─────────────┬─────────────────┤
│ # │ Usuario      │ Puntos     │ Cambio      │ Partidos        │
├───┼──────────────┼────────────┼─────────────┼─────────────────┤
│ 1 │ Alice       │ 125 [glow] │ ↑ 2 [green] │ 87              │
│   │              │ +5 pts     │ [confetti]  │                 │
├───┼──────────────┼────────────┼─────────────┼─────────────────┤
│ 2 │ Bob          │ 123        │ ↓ 1 [red]   │ 85              │
│   │              │ +0 pts     │             │                 │
├───┼──────────────┼────────────┼─────────────┼─────────────────┤
│ 3 │ Charlie      │ 120        │ — [gray]    │ 82              │
│   │              │ +3 pts     │             │                 │
└───┴──────────────┴────────────┴─────────────┴─────────────────┘

Legend:
  [glow]     = Green box-shadow animation on row
  [confetti] = Confetti particles burst effect
  ↑ 2        = Moved up 2 positions (green, bold)
  ↓ 1        = Moved down 1 position (red)
  —          = No rank change (gray)
  +5 pts     = Points gained since yesterday (animated counter)
```

#### 2. Rank Change Indicator Component

```
┌─────────────────────────────────────────┐
│  Rank Up (Green)                        │
│  ┌───┐                                  │
│  │ ↑ │  +3                              │
│  └───┘                                  │
│  [animated slide up, green color]       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Rank Down (Red)                        │
│  ┌───┐                                  │
│  │ ↓ │  -2                              │
│  └───┘                                  │
│  [animated slide down, red color]       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  No Change (Gray)                       │
│  ┌───┐                                  │
│  │ — │                                  │
│  └───┘                                  │
│  [no animation, gray color]             │
└─────────────────────────────────────────┘
```

#### 3. Animated Points Counter

```
Animation sequence for points increase (120 → 125):

Frame 1 (0ms):    120
Frame 2 (100ms):  121  [green text]
Frame 3 (200ms):  122  [green text]
Frame 4 (300ms):  123  [green text]
Frame 5 (400ms):  124  [green text]
Frame 6 (500ms):  125  [green text, bold]

Animation uses spring physics for natural feel
Duration: ~500-700ms depending on difference
```

#### 4. Rank Up Celebration Effect

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│         ·   ·        ·                              │
│      ·         ·  ·     ·    [confetti particles]   │
│   ·      ┌──────────┐     ·                         │
│      ·   │  Rank 1  │   ·      [burst pattern]     │
│   ·      │  Alice   │     ·                         │
│      ·   │  125 pts │   ·                           │
│   ·      └──────────┘     ·                         │
│      ·       [glow]    ·                            │
│         ·   ·        ·                              │
│                                                     │
└─────────────────────────────────────────────────────┘

Glow effect:
  box-shadow: 0 0 20px rgba(76, 175, 80, 0.5)

Confetti:
  - 12 particles
  - Radial burst pattern
  - 0.8s duration
  - Easing: ease-out
```

#### 5. Staggered Row Animation

```
Time:  0ms     100ms    200ms    300ms    400ms
Row 1: [enter] [stable] [stable] [stable] [stable]
Row 2:         [enter]  [stable] [stable] [stable]
Row 3:                  [enter]  [stable] [stable]
Row 4:                           [enter]  [stable]
Row 5:                                    [enter]

Enter animation:
  - Fade in: opacity 0 → 1
  - Slide up: translateY(20px) → 0
  - Duration: 300ms
  - Easing: ease-out
  - Stagger delay: 100ms per row
```

#### 6. Responsive Behavior

**Desktop (>600px):**
- Full rank change indicators with arrows and numbers
- Animated points counter visible
- Confetti effect enabled
- All columns visible

**Mobile (<600px):**
- Compact rank change indicator (just arrow, no number on smallest screens)
- Points counter still animated
- Confetti effect enabled (smaller particles)
- Haptic feedback active
- Some columns hidden (as per existing responsive design)

#### 7. State Variations

**Loading State:**
- Show skeleton loaders for rank and points cells
- No animations triggered
- Preserve table structure

**No Previous Data:**
- First time viewing leaderboard (no yesterday data)
- Show current ranks without change indicators
- No animations
- Display message: "Vuelve mañana para ver cambios en la clasificación"

**Error State:**
- If rank calculation fails, fall back to static display
- Log error to console
- Show current ranks without animations
- No user-facing error message (graceful degradation)

### Testing Strategy

#### Unit Tests

**1. Rank Calculator Tests** (`__tests__/utils/rank-calculator.test.ts`)
- Create `getTodayYYYYMMDD()` utility in `app/utils/date-utils.ts` first
- Mock `getTodayYYYYMMDD()` in tests for deterministic results
- Test rank calculation with various score distributions
- Test tie handling (competition ranking: 1, 2, 2, 4)
- Test rank change calculation (positive, negative, no change)
- Test yesterday score calculation with game date filtering
- Test edge cases: empty arrays, single user, all tied

**2. Repository Tests** (`__tests__/db/tournament-guess-repository.test.ts`)
- Test `updateTournamentGuessWithSnapshot` creates snapshot on new day
- Test no snapshot on same-day updates
- Test correct calculation of yesterday_tournament_score
- Test `last_score_update_date` is always updated
- Mock `getTodayYYYYMMDD()` for deterministic tests

**3. Animation Component Tests** (`__tests__/components/leaderboard/rank-change-animations.test.tsx`)
- Test `<RankChangeIndicator>` renders correct arrow and number
- Test `<AnimatedRankCell>` applies correct classes for rank changes
- Test `<AnimatedPointsCounter>` displays correct final value
- Test `<RankUpCelebration>` triggers confetti when show=true
- Test `<StaggeredLeaderboardRow>` applies correct stagger delay

#### Integration Tests

**4. Server Action Tests** (`__tests__/actions/rank-calculation-actions.test.ts`)
- Test rank calculation server action with valid data
- Test graceful degradation on database errors
- Test return format matches expected structure
- Mock database queries for isolated testing

**5. Backoffice Actions Tests** (`__tests__/actions/backoffice-actions.test.ts`)
- Test honor roll score update triggers snapshot on new day
- Test qualified teams score update triggers snapshot
- Test individual awards score update triggers snapshot
- Test group position score update triggers snapshot
- Verify `last_score_update_date` is updated in all cases
- Verify all 4 locations use wrapper function (not direct updateTournamentGuess)

**6. Leaderboard Table Tests** (`__tests__/components/friend-groups/friends-group-table.test.tsx`)
- Test rank changes are displayed correctly
- Test points counter animation is rendered
- Test confetti shows for rank improvements
- Test no animations when no previous data
- Test responsive behavior (desktop vs mobile)

#### Manual Testing Checklist

- [ ] Migration runs successfully without errors
- [ ] Rank snapshots are created on first update each day
- [ ] No snapshot on subsequent same-day updates
- [ ] Current ranks are calculated correctly
- [ ] Yesterday ranks match expected values
- [ ] Rank up animation triggers with confetti and glow
- [ ] Rank down animation shows red indicator
- [ ] No change shows gray dash
- [ ] Points counter animates smoothly
- [ ] Staggered row animation creates cascade effect
- [ ] Haptic feedback works on mobile (iOS and Android)
- [ ] Responsive design works on mobile and tablet
- [ ] Performance is acceptable with 20+ users in table
- [ ] Graceful degradation when no previous data
- [ ] Console shows no errors or warnings

### Validation Considerations

#### SonarCloud Requirements

**Coverage Target:** ≥80% on new code
- All utility functions must have unit tests
- Animation components must have component tests
- Repository changes must have integration tests
- Use test utilities from `@/__tests__/utils/test-utils`

**Code Quality:**
- No code duplication (use shared animation components)
- Proper TypeScript types for all functions
- JSDoc comments for public APIs
- No console.log statements (use proper logging if needed)

**Security:**
- No SQL injection risks (using Kysely query builder)
- Input validation for date calculations
- No sensitive data in snapshots (just scores)

#### Testing Guidelines

**Test Utilities to Use:**
- `renderWithTheme()` for animation components
- `createMockSelectQuery()` for database mocks
- `testFactories.createTournamentGuess()` for test data
- Mock `useMediaQuery` from MUI for responsive tests

**Animation Testing:**
- Use `@testing-library/react` with `waitFor` for async animations
- Don't test exact animation frames (flaky)
- Test final state and that animation classes are applied
- Mock `framer-motion` for faster test execution

### Dependencies

**Existing:**
- `framer-motion` (^12.11.0) - Already installed ✓
- `@mui/material` - Already installed ✓

**No New Dependencies Required**

### Migration Rollback

If needed, rollback migration:
```sql
ALTER TABLE tournament_guesses
  DROP COLUMN last_score_update_date,
  DROP COLUMN yesterday_tournament_score;
```

### Performance Considerations

**Database:**
- New columns are nullable, no impact on existing rows
- No new indexes needed (queries use existing primary keys)
- Minimal storage overhead (2 integers per tournament guess)

**Frontend:**
- Animations use GPU-accelerated transforms (translateY, scale)
- Stagger animation limited to reasonable row count (<50)
- Memoize rank calculations to avoid recomputation
- Lazy load confetti effect (only render when needed)

**Optimization Opportunities:**
- Consider server-side rank calculation if client-side becomes slow
- Cache yesterday scores in memory for session duration
- Debounce rank recalculation on rapid data changes

### Open Questions

None - approach has been clarified with user.

### Acceptance Criteria

- [ ] Database migration adds required columns to `tournament_guesses`
- [ ] Repository automatically snapshots scores on first update each day
- [ ] Rank calculation utility correctly computes current and previous ranks
- [ ] Leaderboard displays animated rank changes
- [ ] Rank improvements show confetti and green glow effect
- [ ] Points counter animates from previous to current value
- [ ] Rows animate in with staggered timing (cascade effect)
- [ ] Haptic feedback triggers on mobile for rank improvements
- [ ] Responsive design works on mobile, tablet, and desktop
- [ ] Graceful fallback when no previous data available
- [ ] Unit tests achieve ≥80% coverage on new code
- [ ] All tests pass
- [ ] SonarCloud shows 0 new issues
- [ ] Code review approved
- [ ] Deployed to Vercel Preview and tested by user

### Success Indicators

After implementation:
- Users notice and comment on rank changes
- Positive feedback on animations and celebrations
- Increased engagement with leaderboard (measured by page views)
- No performance degradation
- No bugs reported related to rank tracking

# Implementation Plan: [UXI-022] Skeleton Screens (Loading States)

## Story Context

**Issue:** #18 - [UXI-022] Skeleton Screens (Loading States)

**Problem:**
- Generic spinners (CircularProgress) during loading
- Content "pops in" abruptly when data loads
- Feels slow even when loading is fast
- Poor perceived performance

**Solution:**
Content-aware skeleton screens that:
- Match actual content shape and dimensions
- Use MUI Skeleton component with pulse animation
- Replace page-level CircularProgress spinners (keep button spinners)
- Improve perceived performance by +30%
- Reduce loading frustration by -40%

**Priority:** Medium (5/10)
**Effort:** Low (1-2 days)
**Milestone:** Sprint 3-4: Prediction Experience

## Acceptance Criteria

1. ✅ All **page-level** loading states use skeleton screens instead of generic spinners
2. ✅ Skeletons match actual content dimensions and layout (responsive)
3. ✅ Pulse animation provides visual feedback
4. ✅ Replace identified page-level CircularProgress instances (keep button/inline spinners)
5. ✅ Skeleton variants for each major content type:
   - Game cards (compact and full variants)
   - Tournament group cards
   - Friend group lists
   - Leaderboard tables
   - Stats cards
6. ✅ 80%+ test coverage on new skeleton components
7. ✅ Zero new SonarCloud issues
8. ✅ Accessibility: All skeletons have aria-busy, aria-label, and role attributes
9. ✅ No layout shift during loading transitions

## Technical Approach

### 1. Create Skeleton Component Library

Create reusable skeleton components in `app/components/skeletons/`:

**Files to create:**
- `game-card-skeleton.tsx` - Skeleton for game cards
- `tournament-group-card-skeleton.tsx` - Skeleton for tournament group cards
- `friend-group-list-skeleton.tsx` - Skeleton for friend group lists
- `leaderboard-skeleton.tsx` - Skeleton for table rows
- `stats-card-skeleton.tsx` - Skeleton for stats cards
- `index.ts` - Barrel export for all skeletons

### 2. Implementation Strategy

**Phase 1: Audit CircularProgress Usage**
- Search all CircularProgress instances (22 files identified)
- Categorize each instance:
  - **Page-level loading** (replace with skeleton): Full-page, section, or content area loading
  - **Button/inline loading** (keep CircularProgress): Button states, small inline operations
  - **Dialog/modal loading** (evaluate case-by-case): Depends on context
- Decision criteria:
  - **Replace with skeleton:** Content shape is known, full section loading
  - **Keep spinner:** Button loading, indeterminate progress, small inline operations
- Document replacement plan before implementing

**Phase 2: Create Skeleton Components**
- Use MUI `Skeleton` component from `@mui/material`
- **Responsive dimensions:**
  - Use **percentage widths** where possible (adapts to container)
  - Use **pixel heights** only (maintains visual consistency)
  - Fixed pixel dimensions only for visual elements (logos, icons)
- Use pulse animation (default MUI behavior)
- Support light/dark theme (automatic with MUI theme)
- **Accessibility built-in:**
  - Add `aria-busy="true"` to all skeleton containers
  - Add descriptive `aria-label` (e.g., "Loading game cards")
  - Use `role="status"` for loading regions

**Phase 3: Integrate Skeletons**
- **Loading State Pattern:**
  - **Server Components:** Use React Suspense with skeleton fallback
  - **Client Components:** Add `isLoading` prop, conditionally render skeleton or content
  - No explicit loading prop needed for Suspense boundaries
- **Error Handling:**
  - Skeletons never show errors (parent component responsibility)
  - If data fails after timeout, parent shows error UI instead
  - Skeleton simply replaces with content when data arrives
  - Add page-level error boundaries for server components
- **Conditional Rendering Pattern:**
  ```tsx
  // Server Component pattern
  <Suspense fallback={<GameCardSkeleton />}>
    <GamesList />
  </Suspense>

  // Client Component pattern
  {isLoading ? <GameCardSkeleton /> : <GameCard data={data} />}
  ```

**Phase 4: Remove Old Spinners**
- Remove CircularProgress imports from converted files
- Verify replacements during testing
- Document any CircularProgress instances kept (with justification in decision log)

### 3. Component Specifications

#### Game Card Skeleton

**Matches:** CompactGameViewCard, GameView

**Layout:**
```
┌────────────────────────────────────────┐
│ Game #XX • Group X                     │
│ ──────────────────────────────────────│
│                                        │
│ [Logo] Team Name     0 - 0  [Logo]   │
│         ─────────    ─   ─   ───── │
│                                        │
│ Location • Date                        │
│ ────────   ────                        │
└────────────────────────────────────────┘
```

**Elements:**
- Rectangle for game number/stage (width: 60%, height: 20px)
- Divider (full width)
- Circle for home team logo (40x40px - fixed for consistent look)
- Rectangle for home team name (width: 35%, height: 24px)
- Rectangle for score (width: 20%, height: 32px, centered)
- Circle for away team logo (40x40px - fixed)
- Rectangle for away team name (width: 35%, height: 24px)
- Rectangle for location (width: 40%, height: 16px)
- Rectangle for date/time (width: 50%, height: 16px)

**Responsive:** Percentage widths adapt to container, pixel heights maintain visual consistency

**Variants:**
- `variant="compact"` - Smaller version for grids (reduced heights)
- `variant="full"` - Full card with all details (default)

**Accessibility:**
- Container: `aria-busy="true"`, `aria-label="Loading game card"`, `role="status"`

**Props:**
```tsx
interface GameCardSkeletonProps {
  variant?: 'compact' | 'full'
}
```

#### Tournament Group Card Skeleton

**Matches:** TournamentGroupCard

**Layout:**
```
┌────────────────────────────────────────┐
│ 🏆 ─────────────────                  │
│                                        │
│ Your Position                          │
│ #── of ──                             │
│                                        │
│ Your Points                            │
│ ─── pts                               │
│                                        │
│ Current Leader                         │
│ ──────────                            │
│                                        │
│ Members                                │
│ ── participants                        │
│                                        │
│              [────────────]            │
└────────────────────────────────────────┘
```

**Elements:**
- Rectangle for group name (width: 70%, height: 28px)
- Rectangles for stats labels (width: 60%, height: 16px)
- Rectangles for stat values (width: 40%, height: 24px)
- Rectangle for button (width: 50%, max 120px, height: 36px, centered)

**Responsive:** Percentage widths adapt to card container

**Accessibility:**
- Container: `aria-busy="true"`, `aria-label="Loading tournament group"`, `role="status"`

**Props:**
```tsx
interface TournamentGroupCardSkeletonProps {
  // No props needed
}
```

#### Friend Group List Skeleton

**Matches:** Tournament groups list, friend groups list

**Layout:**
```
┌────────────────────────────────────────┐
│ Tournament Groups                      │
│                                        │
│ ┌────────────────────────────────────┐│
│ │ 🏆 ─────────────────              ││
│ │ Your Position: #── of ──          ││
│ │                                    ││
│ └────────────────────────────────────┘│
│                                        │
│ ┌────────────────────────────────────┐│
│ │ 🏆 ─────────────────              ││
│ │ Your Position: #── of ──          ││
│ │                                    ││
│ └────────────────────────────────────┘│
│                                        │
│ ┌────────────────────────────────────┐│
│ │ 🏆 ─────────────────              ││
│ │ Your Position: #── of ──          ││
│ │                                    ││
│ └────────────────────────────────────┘│
└────────────────────────────────────────┘
```

**Elements:**
- Title skeleton (width: 60%, height: 32px)
- Grid of 3-6 card skeletons (use TournamentGroupCardSkeleton)
- Props: `count` (number of cards to show, default 3)

**Responsive:** Grid layout adapts (1 col mobile, 2 cols tablet, 3 cols desktop)

**Accessibility:**
- Container: `aria-busy="true"`, `aria-label="Loading tournament groups"`, `role="status"`

**Props:**
```tsx
interface FriendGroupListSkeletonProps {
  count?: number // default 3
}
```

#### Leaderboard Skeleton

**Matches:** ProdeGroupTable (friend groups leaderboard)

**Layout:**
```
┌────────────────────────────────────────┐
│ Rank | Player      | Points | Trend   │
│──────────────────────────────────────│
│ ──   ──────────── ────── ───        │
│ ──   ──────────── ────── ───        │
│ ──   ──────────── ────── ───        │
│ ──   ──────────── ────── ───        │
│ ──   ──────────── ────── ───        │
└────────────────────────────────────────┘
```

**Elements:**
- Table header (static, no skeleton)
- 5-10 rows with:
  - Small rectangle for rank (width: 10%, height: 20px)
  - Rectangle for player name (width: 45%, height: 20px)
  - Rectangle for points (width: 25%, height: 20px)
  - Small rectangle for trend (width: 15%, height: 20px)
- Props: `rows` (number of rows, default 10)

**Responsive:** Column widths adapt to table container

**Accessibility:**
- Table container: `aria-busy="true"`, `aria-label="Loading leaderboard"`, `role="status"`

**Props:**
```tsx
interface LeaderboardSkeletonProps {
  rows?: number // default 10
}
```

#### Stats Card Skeleton

**Matches:** PerformanceOverviewCard, PredictionAccuracyCard, BoostAnalysisCard

**Layout:**
```
┌────────────────────────────────────────┐
│ ─────────────                          │
│                                        │
│ ────────                               │
│ ────                                   │
│                                        │
│ ────────                               │
│ ────                                   │
│                                        │
│ ────────                               │
│ ────                                   │
└────────────────────────────────────────┘
```

**Elements:**
- Rectangle for title (width: 70%, height: 28px)
- Multiple stat rows:
  - Rectangle for label (width: 60%, height: 16px)
  - Rectangle for value (width: 35%, height: 24px)
- Spacing matches actual card layout
- Props: `rows` (number of stat rows, default 3)

**Responsive:** Widths adapt to card container

**Accessibility:**
- Container: `aria-busy="true"`, `aria-label="Loading statistics"`, `role="status"`

**Props:**
```tsx
interface StatsCardSkeletonProps {
  rows?: number // default 3
}
```

## Files to Create

### New Files

1. **`/app/components/skeletons/game-card-skeleton.tsx`**
   - GameCardSkeleton component
   - Props: `variant` ('compact' | 'full')
   - Uses MUI Skeleton with pulse animation
   - Responsive widths, accessibility attributes

2. **`/app/components/skeletons/tournament-group-card-skeleton.tsx`**
   - TournamentGroupCardSkeleton component
   - Matches TournamentGroupCard dimensions
   - Responsive widths, accessibility

3. **`/app/components/skeletons/friend-group-list-skeleton.tsx`**
   - FriendGroupListSkeleton component
   - Grid of TournamentGroupCardSkeleton (3-6 cards)
   - Props: `count` (number of cards to show, default 3)
   - Responsive grid layout, accessibility

4. **`/app/components/skeletons/leaderboard-skeleton.tsx`**
   - LeaderboardSkeleton component
   - Table structure with skeleton rows
   - Props: `rows` (number of rows, default 10)
   - Responsive column widths, accessibility

5. **`/app/components/skeletons/stats-card-skeleton.tsx`**
   - StatsCardSkeleton component
   - Matches stats card layout
   - Props: `rows` (number of stat rows, default 3)
   - Responsive widths, accessibility

6. **`/app/components/skeletons/index.ts`**
   - Barrel export for all skeletons

### Files to Modify

1. **`/app/components/game-prediction-edit-controls.tsx`**
   - **Decision:** Keep CircularProgress for button loading (inline, appropriate)
   - Small spinner in button while saving is context-appropriate
   - No skeleton replacement needed

2. **`/app/components/tournament-page/tournament-groups-list.tsx`** (Client Component)
   - **Pattern:** Add `isLoading` state prop
   - **Integration:**
     ```tsx
     {isLoading ? (
       <FriendGroupListSkeleton count={3} />
     ) : (
       <Grid>{groups.map(...)}</Grid>
     )}
     ```
   - Parent component (page.tsx) manages loading state

3. **`/app/components/tournament-page/friend-groups-list.tsx`** (Client Component)
   - **Pattern:** Same as tournament-groups-list (isLoading prop)
   - **Integration:** Conditional render skeleton vs groups list
   - Parent manages loading

4. **`/app/friend-groups/[id]/page.tsx`** (Server Component)
   - **Pattern:** Wrap ProdeGroupTable in Suspense
   - **Integration:**
     ```tsx
     <Suspense fallback={<LeaderboardSkeleton rows={10} />}>
       <ProdeGroupTable {...props} />
     </Suspense>
     ```
   - Server component uses Suspense boundary
   - ProdeGroupTable data fetching triggers Suspense
   - **Error Handling:** Add page-level error boundary to catch data fetch errors

5. **`/app/tournaments/[id]/stats/page.tsx`** (Server Component)
   - **Pattern:** Multiple Suspense boundaries (one per stats card)
   - **Integration:**
     ```tsx
     <Grid>
       <Suspense fallback={<StatsCardSkeleton rows={3} />}>
         <PerformanceOverviewCard {...props} />
       </Suspense>
       <Suspense fallback={<StatsCardSkeleton rows={4} />}>
         <PredictionAccuracyCard {...props} />
       </Suspense>
       <Suspense fallback={<StatsCardSkeleton rows={3} />}>
         <BoostAnalysisCard {...props} />
       </Suspense>
     </Grid>
     ```
   - Independent Suspense per card (parallel loading)
   - **Error Handling:** Add page-level error boundary

6. **Other CircularProgress instances** (22 files found)
   - **Audit Required:** Categorize all 22 instances before implementation
   - **Categories:**
     - Button/inline loading: Keep CircularProgress
     - Page-level loading: Replace with skeleton
     - Dialog loading: Case-by-case evaluation
   - **Decision Log:** Document each instance kept (with justification)
   - Most are in backoffice components (likely button loading - keep as is)

## Implementation Steps

### Step 0: Pre-Implementation Audit (30 mins)
1. Search all CircularProgress usage (22 files identified)
2. Categorize each instance:
   - Button/inline loading (keep)
   - Page-level/section loading (replace with skeleton)
   - Dialog/modal loading (evaluate case-by-case)
3. Create decision log in plan comments
4. Identify 5-10 key pages for skeleton integration

### Step 1: Create Base Skeleton Components (2-3 hours)
1. Create `/app/components/skeletons/` directory
2. Implement `game-card-skeleton.tsx`:
   - Props: `variant` ('compact' | 'full')
   - Responsive widths (percentages)
   - Accessibility attributes
3. Implement `tournament-group-card-skeleton.tsx`:
   - Match TournamentGroupCard layout
   - Responsive widths
   - Accessibility
4. Implement `friend-group-list-skeleton.tsx`:
   - Props: `count` (default 3)
   - Grid of TournamentGroupCardSkeleton
   - Responsive grid layout
   - Accessibility
5. Implement `leaderboard-skeleton.tsx`:
   - Props: `rows` (default 10)
   - Table structure with skeleton rows
   - Responsive column widths
   - Accessibility
6. Implement `stats-card-skeleton.tsx`:
   - Props: `rows` (default 3)
   - Card layout with stat rows
   - Responsive widths
   - Accessibility
7. Create barrel export `index.ts`

### Step 2: Integrate Skeletons in Client Components (1-2 hours)
1. **tournament-groups-list.tsx:**
   - Add `isLoading` prop to component
   - Conditional render: `{isLoading ? <FriendGroupListSkeleton /> : <Groups />}`
   - Parent page manages loading state
2. **friend-groups-list.tsx:**
   - Same pattern as tournament-groups-list
   - Add `isLoading` prop
   - Conditional render skeleton vs content

### Step 3: Integrate Skeletons in Server Components (1-2 hours)
1. **friend-groups/[id]/page.tsx:**
   - Wrap ProdeGroupTable in Suspense:
     `<Suspense fallback={<LeaderboardSkeleton rows={10} />}>`
   - Add page-level error boundary for error handling
2. **tournaments/[id]/stats/page.tsx:**
   - Wrap each stats card in independent Suspense boundaries
   - Use appropriate StatsCardSkeleton with row count per card
   - Add page-level error boundary

### Step 4: CircularProgress Audit & Selective Replacement (1 hour)
1. Review decision log from Step 0
2. Replace identified page-level CircularProgress with skeletons
3. Document any CircularProgress kept (with justification)
4. Remove unused CircularProgress imports from converted files

### Step 5: Testing & Validation (2-3 hours)
1. Unit test each skeleton component (5 test files)
2. Test Client Component loading transitions (isLoading toggle)
3. Test Server Component Suspense boundaries
4. Visual regression: Verify skeleton dimensions match content
5. Accessibility: Test screen reader announcements
6. Responsive: Test mobile/tablet/desktop layouts

### Step 6: Cleanup & Documentation (30 mins)
1. Remove unused CircularProgress imports
2. Update decision log with final CircularProgress inventory
3. Verify all skeletons use consistent patterns
4. Run linter and fix any issues

## Testing Strategy

### Unit Tests

**Test files to create:**

1. **`__tests__/components/skeletons/game-card-skeleton.test.tsx`**
   - Renders compact variant correctly
   - Renders full variant correctly
   - Uses pulse animation (MUI Skeleton default)
   - Matches theme colors (light/dark) - automatic with MUI
   - Has correct accessibility attributes (aria-busy, aria-label, role)
   - Responsive widths render correctly

2. **`__tests__/components/skeletons/tournament-group-card-skeleton.test.tsx`**
   - Renders all skeleton elements
   - Matches card dimensions (responsive widths)
   - Uses MUI Skeleton component
   - Has correct accessibility attributes

3. **`__tests__/components/skeletons/friend-group-list-skeleton.test.tsx`**
   - Renders correct number of card skeletons
   - Default count is 3
   - Custom count prop works
   - Grid layout renders correctly
   - Has correct accessibility attributes

4. **`__tests__/components/skeletons/leaderboard-skeleton.test.tsx`**
   - Renders table structure
   - Default row count is 10
   - Custom row count prop works
   - Table headers are present (static, no skeleton)
   - Has correct accessibility attributes

5. **`__tests__/components/skeletons/stats-card-skeleton.test.tsx`**
   - Renders card structure
   - Default row count is 3
   - Custom row count prop works
   - Has correct accessibility attributes

### Integration Tests

1. **Tournament groups list (Client Component):**
   - Shows skeleton while loading (isLoading=true)
   - Shows actual groups after load (isLoading=false)
   - Smooth transition (no layout shift)
   - Parent component manages loading state correctly

2. **Friend groups page (Server Component):**
   - Shows leaderboard skeleton while Suspense is active
   - Shows actual leaderboard after Suspense resolves
   - Smooth transition (no layout shift)
   - Error boundary catches errors correctly

3. **Tournament stats page (Server Component):**
   - Shows stats card skeletons while Suspense is active
   - Shows actual stats after Suspense resolves
   - Multiple independent Suspense boundaries work
   - Parallel loading behavior verified
   - Error boundary catches errors correctly

### Visual Regression

- Manually verify skeletons match content dimensions
- Check light and dark themes (MUI Skeleton automatic support)
- Verify mobile responsiveness (percentage widths adapt)
- Confirm pulse animation is smooth and not distracting
- No layout shift when transitioning from skeleton to content

## Testing Requirements

- **Coverage:** 80%+ on new skeleton components
- **Test utilities:** Use `renderWithTheme()` from `@/__tests__/utils/test-utils`
- **Component testing:** Each skeleton component gets comprehensive unit tests
- **Integration testing:**
  - Test loading states in parent components
  - Test Suspense boundaries with skeleton fallback
  - Test conditional rendering (isLoading toggle)
  - Test accessibility attributes

## Validation Considerations

### SonarCloud Requirements
- **Code coverage:** ≥80% on new code ✅
- **Security:** No security issues (client-only components, no data handling)
- **Maintainability:** Keep skeleton components simple and focused
- **Duplicated code:** Share common skeleton patterns via props/composition

### Quality Checks
1. ✅ All page-level CircularProgress spinners evaluated (replace or keep with justification)
2. ✅ Skeleton dimensions match actual content (no layout shift)
3. ✅ Pulse animation is smooth and not distracting
4. ✅ Dark mode support verified (MUI Skeleton automatic)
5. ✅ Mobile responsive verified (percentage widths adapt)
6. ✅ Accessibility:
   - All skeletons have `aria-busy="true"`
   - All skeletons have descriptive `aria-label`
   - All skeletons have `role="status"`
   - Screen reader announces loading state correctly
7. ✅ No unused CircularProgress imports remain
8. ✅ Decision log documents all CircularProgress instances kept

## Dependencies

- **None:** This is a self-contained UI improvement
- Uses existing MUI Skeleton component (@mui/material already installed)
- No API or database changes needed
- No migration required

## Open Questions

None - requirements are clear from story and UX audit documentation.

## Notes

### Why Skeleton Screens?

From UX research:
- **Perceived performance:** +30% improvement
- **Loading frustration:** -40% reduction
- Users perceive skeleton loading as faster than spinners
- Content-aware skeletons reduce "pop-in" effect
- Maintains layout structure during loading (no shift)

### CircularProgress vs Skeleton

**Keep CircularProgress for:**
- Button loading states (inline, small)
- Small inline operations (save, delete)
- Determinate progress (with percentage)
- Dialog/modal operations (case-by-case)

**Use Skeleton for:**
- Page-level loading
- Content loading (cards, tables, lists)
- Full-screen or section loading
- When shape of content is known

### MUI Skeleton Features

- Built-in pulse animation
- Theme-aware (light/dark mode) - automatic
- Accessible by default (can be enhanced with custom aria attributes)
- Variant support: text, circular, rectangular
- Wave animation available (we'll use pulse for consistency)

### Loading State Patterns

**Server Components (preferred for data fetching):**
- Use React Suspense with skeleton fallback
- Automatic loading state management
- Parallel loading with multiple Suspense boundaries
- Error boundaries for error handling

**Client Components (for interactive loading):**
- Use explicit `isLoading` prop
- Parent component manages loading state
- Conditional rendering: `{isLoading ? <Skeleton /> : <Content />}`
- Error handling in parent component

## Success Metrics

**Before (baseline):**
- Generic CircularProgress spinners for page-level loading
- Abrupt content "pop-in"
- No indication of content shape
- Button spinners are appropriate (keep these)

**After (target):**
- Content-aware skeleton screens for page-level loading
- Smooth loading experience
- Reduced perceived loading time
- Professional, polished feel
- Button spinners still used appropriately

**Validation:**
- ✅ Zero page-level CircularProgress (all replaced with skeletons)
- ✅ Button/inline CircularProgress retained (documented in decision log)
- ✅ All major content types have skeleton variants
- ✅ 80%+ test coverage on new components
- ✅ Zero new SonarCloud issues
- ✅ No layout shift during loading transitions
- ✅ Accessibility attributes present on all skeletons

## CircularProgress Decision Log (To be completed in Step 0)

**Format:**
```
File: /path/to/file.tsx
Usage: Button loading / Page-level loading / Dialog loading
Decision: Keep / Replace with [SkeletonName]
Justification: [Reason]
```

**Example:**
```
File: /app/components/game-prediction-edit-controls.tsx
Usage: Button loading (save button)
Decision: Keep CircularProgress
Justification: Small inline spinner appropriate for button loading state
```

(Complete this section during Step 0 of implementation)

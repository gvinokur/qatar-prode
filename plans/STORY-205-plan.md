# Implementation Plan: Enable Unauthenticated Access to Tournament Public View (#205)

## Context

Currently, unauthenticated users cannot access tournament content. When they try to view a tournament, they hit authentication barriers. This creates friction for discovery and limits the app's reach.

**The Problem:**
- Tournament pages require authentication
- `UnifiedGamesPage` returns "Please log in to view games" for unauth users
- No public view of tournament data (games, standings, rules)
- Tournament-specific rules can't be shown to potential users

**The Solution:**
- Create `/tournaments/[id]/public` route for unauthenticated access
- Show read-only tournament data (games, results, standings, rules)
- Provide clear CTAs to sign up
- Enable onboarding flow without requiring auth
- Set foundation for making tournaments the default landing page

**Key Benefits:**
- **Marketing/Discovery**: Users see value before signing up
- **Correct Rules**: Show tournament-specific rules (solving app home confusion)
- **Engagement**: Live data creates FOMO
- **Conversion**: Natural "Sign up to predict" CTAs

## Acceptance Criteria

### 1. Routing & Access Control
- [ ] Create `/tournaments/[id]/public` route
- [ ] Redirect unauthenticated users from auth-only tournament routes to `/public`
- [ ] Redirect authenticated users accessing `/public` to main tournament view
- [ ] Handle edge cases (tournament not found, inactive tournaments)

### 2. Tournament Public Page (Main Content)
- [ ] Display games list (schedule + results) - read-only
- [ ] Show tournament header (name, dates, logo)
- [ ] Prominent sticky CTA: "Sign up to make predictions"
- [ ] "Learn how predictions work" button → triggers onboarding flow
- [ ] All prediction inputs locked/hidden (show lock icons or disabled state)
- [ ] Clean "read-only" state without feeling broken

### 3. Navigation (Unauthenticated State)
- [ ] **Sidebar shows only:**
  - Groups & Results (tournament groups/standings)
  - Rules (tournament-specific)
- [ ] **Sidebar hides:**
  - Friend Groups
  - User Stats
  - Any other auth-required sections
- [ ] **Bottom Nav** reflects same limited options as Sidebar
- [ ] Navigation components handle auth state gracefully

### 4. Groups & Results Page (Public View)
- [ ] Show tournament group standings (e.g., Group A, B, C)
- [ ] Show match results
- [ ] Read-only view (no interactions)
- [ ] Works without authentication

### 5. Rules Page (Public View)
- [ ] Display tournament-specific rules (dynamic, from database)
- [ ] No authentication required
- [ ] Same rules content that authenticated users see

### 6. Onboarding Flow Integration
- [ ] Onboarding can be triggered from public page
- [ ] Works without authentication (educational only)
- [ ] End of onboarding shows "Sign up to start predicting" CTA
- [ ] Does not require/modify auth state

### 7. Future-Proof Architecture
- [ ] Code structure supports making tournament the default landing page (Phase 2)
- [ ] Authentication state easily toggles between limited/full nav
- [ ] Reuses existing components where possible (DRY principle)

## Technical Approach

### Architecture Overview

This implementation follows a **conditional rendering pattern** rather than duplicate routes. The existing tournament layout and pages will be modified to gracefully handle unauthenticated users.

**Key Insight:** Results page (`app/[locale]/tournaments/[id]/results/page.tsx`) and Rules page already work without auth. We can follow their pattern.

### Routing Strategy

**Decision: Use query parameter instead of separate `/public` route**

Instead of creating `/tournaments/[id]/public`, use the existing `/tournaments/[id]` route with auth-aware rendering:

**Rationale:**
1. **Simpler**: One route, conditional rendering based on auth state
2. **SEO-friendly**: Clean URL structure (`/tournaments/123` works for all)
3. **Consistent**: Results and Rules pages already work this way
4. **Future-proof**: When tournament becomes default landing, no route migration needed

**Implementation:**
- Modify tournament layout to NOT require auth
- Modify UnifiedGamesPage to handle unauth users
- Sidebar/BottomNav conditionally render based on auth state

### Component Modifications

#### 1. Tournament Layout (`app/[locale]/tournaments/[id]/layout.tsx`)

**Current behavior:**
- Fetches user with `getLoggedInUser()`
- Passes user to child components
- Conditionally fetches `prodeGroups` and `userGameStatistics` if user exists

**Required changes:**
- Remove auth requirement (keep `getLoggedInUser()` but make user optional)
- Update dev tournament permission check to redirect unauth users (line 48-50)
- Keep conditional data fetching (lines 103-105) - already correct
- Layout already passes optional user to components - no change needed

**Impact:** Minimal - layout already mostly supports this pattern

#### 2. UnifiedGamesPage (`app/components/unified-games-page.tsx`)

**Current behavior:**
- Returns "Please log in to view games" if !user (lines 22-27)
- Fetches all data with user.id

**Required changes:**
1. Remove early return for !user
2. Make data fetching conditional:
   - Games, teamsMap, tournament, groups, rounds, closingGames - fetch always
   - gameGuesses, dashboardStats, tournamentPredictionCompletion - only if user
3. Create public version of UnifiedGamesPageClient:
   - Shows games read-only (no prediction inputs)
   - Displays "Sign up to predict" CTA
   - "Learn how predictions work" button → triggers onboarding

**New component structure:**
```
UnifiedGamesPage (Server Component)
├─ If user: UnifiedGamesPageClient (current, with predictions)
└─ If !user: UnifiedGamesPagePublic (new, read-only with CTAs)
```

**Data fetching pattern (Optimized for Parallel Queries):**
```typescript
// Fetch public data in parallel (no dependencies between queries)
const [games, teamsMap, tournament, groups, rounds, closingGames] = await Promise.all([
  getAllTournamentGames(tournamentId),
  getTeamsMap(tournamentId),
  findTournamentById(tournamentId),
  findGroupsInTournament(tournamentId),
  findPlayoffStagesWithGamesInTournament(tournamentId),
  getGamesClosingWithin48Hours(tournamentId),
])

// Fetch user-specific data in parallel (all queries independent)
// Note: getTournamentPredictionCompletion needs tournament, so can't be in first batch
const userSpecificData = user ? await Promise.all([
  findGameGuessesByUserId(user.id, tournamentId),
  getPredictionDashboardStats(user.id, tournamentId),
  getTournamentGameCounts(user.id, tournamentId),
  // This query needs tournament result from above, but that's already resolved
  getTournamentPredictionCompletion(user.id, tournamentId, tournament)
]) : null

// Total query time:
// - Unauth users: 1 parallel batch (public queries only)
// - Auth users: 2 sequential batches (public, then user-specific)
// No N+1 query issues - all queries within each batch are parallel
```

**Query Independence Verification:**
- ✅ All public queries are independent (no dependencies)
- ✅ User-specific queries can run in parallel after tournament is fetched
- ✅ No waterfall effects within each batch

#### 3. TournamentSidebar (`app/components/tournament-page/tournament-sidebar.tsx`)

**Current behavior:**
- Client component
- Shows 4 sections: GroupStandings, UserStats, FriendGroups, Rules
- Already conditionally renders UserStats (line 96: `{user && ...}`)
- Already conditionally renders FriendGroups (line 106: `{prodeGroups && ...}`)

**Required changes:**
- Already mostly correct! Just needs verification
- GroupStandings and Rules should always show (they don't require auth)
- UserStats and FriendGroups already hidden when data not present

**Impact:** Minimal - component already supports this pattern

#### 4. TournamentBottomNav (`app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`)

**Current behavior:**
- Shows 5 items: Home, Results, Rules, Stats, Friend Groups

**Required changes:**
- Accept `user` prop
- Conditionally render items:
  - Always show: Home, Results, Rules
  - Hide if !user: Stats, Friend Groups

**Implementation:**
```typescript
interface TournamentBottomNavProps {
  readonly tournamentId: string
  readonly currentPath: string
  readonly user?: User  // NEW: optional user
}

// In render:
<BottomNavigation>
  <BottomNavigationAction label="Home" value="main-home" icon={<Home />} />
  <BottomNavigationAction label="Results" value="results" icon={<Assessment />} />
  <BottomNavigationAction label="Rules" value="rules" icon={<Gavel />} />
  {user && <BottomNavigationAction label="Stats" value="stats" icon={<BarChart />} />}
  {user && <BottomNavigationAction label="Groups" value="friend-groups" icon={<Groups />} />}
</BottomNavigation>
```

**Wrapper update:**
- Pass user from layout to wrapper to bottom nav

#### 5. Onboarding Integration

**Current implementation:**
- Onboarding triggered from user menu (authenticated users only)
- Uses `OnboardingDialogClient` component

**✅ VERIFIED:** `OnboardingDialogClient` works WITHOUT user context
- Component location: `app/components/onboarding/onboarding-dialog-client.tsx`
- Fetches tournament data independently using `getTournaments()` action
- No user dependencies or `useSession()` calls
- Safe to use for unauthenticated users

**Required changes:**
1. Create public onboarding trigger button in `UnifiedGamesPagePublic`
2. Import and use existing `OnboardingDialogClient` (no modifications needed)
3. Verify "Sign up to start predicting" CTA exists at end (check OnboardingDialog component)

**Button placement:**
- Sticky CTA bar at top: "Sign up to make predictions | Learn How"
- "Learn How" button opens onboarding dialog

#### 6. Results Page

**Current state:** ✅ Already works without auth
**Action:** No changes needed

#### 7. Rules Page

**Current state:** ✅ Already works without auth
**Action:** No changes needed

### Visual Prototypes

#### Public Tournament Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  [App Logo] [Tournament Logo] Qatar Prode   [Theme] [🌐] [Login] │  ← Header (modified)
├─────────────────────────────────────────────────────────┤
│  [Group A] [Group B] [Group C] [Group D]              │  ← Group Selector
├─────────────────────────────────────────────────────────┤
│  ⚠️ Sign up to make predictions  |  [Learn How] [Sign Up]  │  ← Sticky CTA Bar (NEW)
├──────────────────────────────────┬──────────────────────┤
│                                  │                      │
│  📅 GAMES LIST (Read-Only)      │  SIDEBAR             │
│                                  │                      │
│  ┌────────────────────────┐    │  📊 Group Standings  │
│  │ Team A 🔒 [ ] - [ ] 🔒 B│    │  ┌────────────────┐  │
│  │ Nov 20, 14:00          │    │  │ 1. Spain    9pts│  │
│  │ [Predictions Locked]   │    │  │ 2. Germany  6pts│  │
│  │ Sign up to predict →   │    │  │ 3. Italy    3pts│  │
│  └────────────────────────┘    │  └────────────────┘  │
│                                  │                      │
│  ┌────────────────────────┐    │  📖 Rules            │
│  │ Team C 2 - 1 Team D    │    │  (Tournament-specific)│
│  │ Nov 21, 16:00 FINAL    │    │                      │
│  │ [View Details →]       │    │  ❌ User Stats       │
│  └────────────────────────┘    │  (Hidden)            │
│                                  │                      │
│  ┌────────────────────────┐    │  ❌ Friend Groups    │
│  │ 🔒 Make your predictions! │    │  (Hidden)            │
│  │ [Sign Up] [Learn More] │    │                      │
│  └────────────────────────┘    │                      │
└──────────────────────────────────┴──────────────────────┘
│  [🏠 Home] [📊 Results] [📖 Rules]                     │  ← Bottom Nav (mobile)
│  ❌ Stats (Hidden)  ❌ Groups (Hidden)                  │
└─────────────────────────────────────────────────────────┘
```

**Key Visual Elements:**

1. **Sticky CTA Bar** (NEW component):
   - Background: Primary color with contrast
   - Left: Warning icon + "Sign up to make predictions"
   - Right: [Learn How] [Sign Up] buttons
   - Sticky position: Below group selector
   - Dismissible: Optional (UX decision)

2. **Read-Only Game Cards**:
   - Prediction inputs shown with 🔒 lock icon
   - Grayed out/disabled appearance
   - Overlay text: "Sign up to predict"
   - Click behavior: Opens sign-up dialog

3. **Sidebar - Public Mode**:
   - ✅ Shows: Group Standings, Rules
   - ❌ Hides: User Stats, Friend Groups
   - No visual gaps (smooth layout)

4. **Bottom Nav - Public Mode** (mobile):
   - ✅ Shows: Home, Results, Rules (3 items)
   - ❌ Hides: Stats, Groups
   - Evenly spaced with 3 items

5. **Onboarding Dialog** (triggered by "Learn How"):
   ```
   ┌──────────────────────────────┐
   │  How Predictions Work        │
   ├──────────────────────────────┤
   │  [Step 1: Pick match scores] │
   │  [Step 2: Tournament awards] │
   │  [Step 3: Scoring system]    │
   ├──────────────────────────────┤
   │  [Back] [Next] [Skip]        │
   │                               │
   │  At end: [Sign Up to Start!] │
   └──────────────────────────────┘
   ```

#### Mobile Responsive Considerations

**Mobile (xs - sm):**
- Sidebar hidden (existing behavior)
- Bottom Nav shows 3 items only (Home, Results, Rules)
- Sticky CTA bar full width
- Game cards stack vertically

**Desktop (md+):**
- Sidebar visible with limited sections
- Bottom Nav hidden (existing behavior)
- Sticky CTA bar in content area
- Game cards in grid

### State Variations

**Loading States:**
- Show skeleton loaders for games list
- Sidebar shows placeholder cards
- CTA bar always visible (no skeleton)

**Error States:**
- Tournament not found: Show message + link to home
- Network error: Retry button with error message
- Auth optional: No blocking errors for unauth users

**Empty States (Comprehensive):**

1. **No Games:**
   - Message: "Tournament starting soon. Check back later!"
   - Icon: Calendar or hourglass
   - CTA still visible: "Sign up to get notified"

2. **No Groups:**
   - Hide group standings sidebar card entirely
   - No empty state message needed (card just not shown)

3. **No Results:**
   - Message: "Results will appear here after matches are played"
   - Show empty table/bracket structure (grayed out)

4. **No Rules (Edge Case):**
   - Message: "Rules will be available soon"
   - Fallback: Show default scoring explanation
   - This should never happen in production

5. **Tournament Not Found:**
   - Error message: "Tournament not found"
   - CTA: "Browse available tournaments" → link to home
   - Status: 404 (handled at route level)

6. **Loading States:**
   - Games list: Show skeleton game cards (3-5 placeholders)
   - Sidebar: Show skeleton cards for sections
   - CTA bar: Always visible (no skeleton)
   - Use Material-UI Skeleton component

**Consistent Empty State Pattern:**
- Icon (optional, if space permits)
- Primary message (what's missing)
- Secondary explanation (why it's missing or when it will appear)
- CTA (if applicable)

## Files to Create

### New Files

1. **`app/components/unified-games-page-public.tsx`** (Server Component)
   - Public read-only version of games page
   - Fetches games, teams, tournament data
   - Passes to client component
   - No user-specific data

2. **`app/components/unified-games-page-public-client.tsx`** (Client Component)
   - Renders games in read-only mode
   - Shows sticky CTA bar
   - Triggers onboarding dialog
   - Displays sign-up CTAs

3. **`app/components/tournament-page/public-cta-bar.tsx`** (Client Component)
   - Sticky CTA bar component
   - "Sign up to make predictions | Learn How | Sign Up"
   - Handles dialog triggers
   - Responsive design

4. **`app/components/tournament-page/read-only-game-card.tsx`** (Client Component)
   - Game card with locked prediction inputs
   - Lock icon overlays
   - Click opens sign-up dialog
   - Same styling as regular cards

5. **`app/[locale]/tournaments/[id]/public/page.tsx`** (OPTIONAL - only if we do separate route)
   - Alternative: Could use query param or pathname check instead
   - Decision: Skip this file, use conditional rendering in main page

## Files to Modify

### Critical Files

1. **`app/[locale]/tournaments/[id]/layout.tsx`**
   - **Line 91**: Keep `getLoggedInUser()` but handle undefined user
   - **Line 48-50**: Redirect unauth users only for dev tournaments
   - **Line 103-105**: Already conditional - no change
   - **Line 280-292**: Wrap EmptyAwardsSnackbar in user check (already there)
   - **Line 296**: Pass user to TournamentBottomNavWrapper
   - **Impact**: Low-risk changes, mostly already correct

2. **`app/[locale]/tournaments/[id]/page.tsx`**
   - **Current**: Uses `UnifiedGamesPage` directly
   - **Change**: Route to `UnifiedGamesPage` (which handles auth internally)
   - **Impact**: Minimal - UnifiedGamesPage does the work

3. **`app/components/unified-games-page.tsx`**
   - **Line 22-27**: Remove early return for !user
   - **Line 30-55**: Split data fetching (always vs user-specific)
   - **Line 69-89**: Conditional rendering:
     - If user: Return current `UnifiedGamesPageClient`
     - If !user: Return new `UnifiedGamesPagePublic`
   - **Impact**: High - core logic change, needs careful testing

4. **`app/components/tournament-bottom-nav/tournament-bottom-nav-wrapper.tsx`**
   - **Line 8**: Add `user?: User` prop
   - **Line 11-26**: Pass user to `TournamentBottomNav`
   - **Impact**: Low - simple prop passing

5. **`app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`**
   - **Line 10-11**: Add `user?: User` prop
   - **Line 79-84**: Conditional rendering of Stats and Groups items
   - **Impact**: Low - straightforward conditional rendering

6. **`app/components/tournament-page/tournament-sidebar.tsx`**
   - **Line 96-97**: Already correct - UserStats only if user
   - **Line 106-107**: Already correct - FriendGroups only if prodeGroups
   - **Action**: Verify with test before implementation (see Pre-Implementation Verification below)
   - **Impact**: None - already correct, just needs verification

### Secondary Files (Possible)

7. **`app/components/header/user-actions.tsx`**
   - Already has onboarding trigger (line 74-81)
   - `OnboardingDialogClient` is already importable (no export changes needed)
   - **Impact**: None - no changes needed

8. **`app/components/onboarding/onboarding-dialog-client.tsx`**
   - ✅ VERIFIED: Works without user context (fetches tournament independently)
   - Action: Verify "Sign up" CTA exists at end of OnboardingDialog
   - **Impact**: Low - verification only, possibly no changes

9. **`app/components/auth/login-or-signup-dialog.tsx`** (Sign-up dialog)
   - ✅ IDENTIFIED: This is the sign-up/auth dialog component
   - Used by game card clicks and CTA buttons
   - Flow: Email → Login/Signup → Verification/Success → Dialog closes
   - After signup: User needs to verify email, then sign in
   - **Impact**: None - no changes needed, just use existing component

## Pre-Implementation Verification (MANDATORY)

**Before starting Phase 1, verify these assumptions:**

### 1. Verify Sidebar Conditional Rendering

Run existing sidebar test or manually test:
```bash
npm test tournament-sidebar.test.tsx
```

**Expected behavior:**
- UserStats component hidden when `user` prop is undefined
- FriendGroups component hidden when `prodeGroups` prop is undefined
- GroupStandings always visible (no user dependency)
- Rules always visible (no user dependency)

**If test fails:** Update sidebar component before proceeding.

### 2. Verify Bottom Nav Material-UI Behavior

Create quick test file or manually verify:
```typescript
// Test: Render BottomNavigation with 3 items, then 5 items
// Expected: Items evenly spaced in both cases (Material-UI handles flex correctly)
```

**Material-UI `BottomNavigation` Behavior:**
- Conditional children (via `&&`) work correctly
- Layout adjusts automatically (flexbox)
- No custom CSS needed for even spacing

### 3. Verify Dev Tournament Redirect Logic

Check `tournament/[id]/layout.tsx` lines 38-57:
```typescript
// Current code redirects if:
// - tournament.dev_only && !isDevelopmentMode() && !user
// Target: `/${locale}?openSignin=true&returnUrl=...`
```

**Expected:** Redirect works correctly for unauth users on dev tournaments.

### 4. Verify Sign-Up Dialog Post-Flow

Manually test `LoginOrSignupDialog`:
- User signs up → Verification email sent
- Dialog shows "Check your email"
- User verifies email via link
- User signs in → Returns to previous page

**Expected:** Standard email verification flow works.

---

## Implementation Steps

### Phase 1: Layout & Navigation (Foundation)

**Goal:** Make tournament layout and navigation auth-aware

1. **Modify Tournament Layout**
   - Update `app/[locale]/tournaments/[id]/layout.tsx`
   - Handle optional user in dev tournament check
   - Pass user to TournamentBottomNavWrapper
   - Test: Layout renders without auth

2. **Modify Bottom Nav**
   - Update `tournament-bottom-nav-wrapper.tsx` to accept user prop
   - Update `tournament-bottom-nav.tsx` to conditionally render items
   - Test: Stats and Groups hidden when !user

3. **Verify Sidebar**
   - Review `tournament-sidebar.tsx` conditional rendering
   - Test: User Stats and Friend Groups hidden when !user
   - Test: Group Standings and Rules always visible

**Validation:**
- [ ] Layout renders for unauth users
- [ ] Bottom nav shows 3 items (Home, Results, Rules) for unauth
- [ ] Sidebar shows 2 sections (Groups, Rules) for unauth
- [ ] No errors in console

### Phase 2: Public Games Page (Core Feature)

**Goal:** Create read-only games page for unauth users

4. **Create Public CTA Bar Component**
   - Create `app/components/tournament-page/public-cta-bar.tsx`
   - Sticky positioning below group selector
   - "Sign up to make predictions | Learn How | Sign Up" layout
   - Responsive design (mobile + desktop)

5. **Create Read-Only Game Card Component**
   - Create `app/components/tournament-page/read-only-game-card.tsx`
   - Reuse existing game card styles
   - Add lock icons on prediction inputs
   - Add overlay text "Sign up to predict"
   - Click opens sign-up dialog

6. **Create Public Games Page Client**
   - Create `app/components/unified-games-page-public-client.tsx`
   - Render games list with read-only cards
   - Include public CTA bar
   - Include onboarding trigger
   - Handle empty states

7. **Create Public Games Page Server Component**
   - Create `app/components/unified-games-page-public.tsx`
   - Fetch games, teams, tournament data (no user-specific)
   - Pass to `UnifiedGamesPagePublicClient`
   - Handle errors gracefully

8. **Modify UnifiedGamesPage**
   - Update `app/components/unified-games-page.tsx`
   - Remove early return for !user (line 22-27)
   - Conditional data fetching (lines 30-55)
   - Route to public or auth version based on user

**Validation:**
- [ ] Games list displays for unauth users
- [ ] Prediction inputs shown as locked
- [ ] CTA bar visible and sticky
- [ ] Onboarding can be triggered
- [ ] Sign-up dialog opens on card click

### Phase 3: Onboarding Integration

**Goal:** Enable onboarding for unauth users

9. **Verify Onboarding Works Without Auth**
   - Test `OnboardingDialogClient` without user context
   - Ensure no user-specific data dependencies
   - Add "Sign up to start" CTA at end if not present

10. **Integrate Onboarding Trigger**
    - Add "Learn How" button to public CTA bar
    - Trigger onboarding dialog on click
    - Handle dialog close

**Validation:**
- [ ] Onboarding opens from "Learn How" button
- [ ] All onboarding steps work without auth
- [ ] "Sign up" CTA shown at end
- [ ] Dialog closes gracefully

### Phase 4: Results & Rules Verification

**Goal:** Confirm existing pages work for unauth

11. **Test Results Page**
    - Verify `/tournaments/[id]/results` works without auth
    - Verify group standings display correctly
    - Verify no auth-related errors

12. **Test Rules Page**
    - Verify `/tournaments/[id]/rules` works without auth
    - Verify tournament-specific rules display
    - Verify no auth-related errors

**Validation:**
- [ ] Results page loads without auth
- [ ] Rules page loads without auth
- [ ] Navigation works between pages
- [ ] No console errors

### Phase 5: Edge Cases & Polish

**Goal:** Handle all edge cases and improve UX

13. **Handle Auth Redirects**
    - If user signs up, reload page to show auth version
    - If user logs out, stay on public version
    - Handle dev tournament permissions

14. **Improve Visual States**
    - Add loading skeletons for public pages
    - Add empty states ("Tournament starting soon")
    - Add error states with retry

15. **Mobile Responsive Polish**
    - Test CTA bar on mobile (full width)
    - Test bottom nav (3 items, evenly spaced)
    - Test game cards (stacked vertically)

**Validation:**
- [ ] Auth state changes handled gracefully
- [ ] Loading states display correctly
- [ ] Empty states display correctly
- [ ] Error states display correctly
- [ ] Mobile layout works on iOS/Android

## Testing Strategy

### Unit Tests (Required for 80% Coverage)

**New Components:**

1. **`public-cta-bar.test.tsx`**
   - Renders correctly
   - "Learn How" button triggers onboarding
   - "Sign Up" button opens auth dialog
   - Sticky positioning correct
   - Responsive behavior

2. **`read-only-game-card.test.tsx`**
   - Displays game data correctly
   - Shows lock icons on inputs
   - Click opens sign-up dialog
   - Matches visual design

3. **`unified-games-page-public-client.test.tsx`**
   - Renders games list
   - Shows CTA bar
   - Onboarding integration works
   - Empty states display

4. **`unified-games-page-public.test.tsx`**
   - Fetches data correctly (no user context)
   - Handles errors
   - Passes data to client component

**Modified Components:**

5. **`unified-games-page.test.tsx`**
   - Routes to auth version when user present
   - Routes to public version when no user
   - Data fetching conditional logic
   - Error handling

6. **`tournament-bottom-nav.test.tsx`**
   - Shows all 5 items when user present
   - Shows 3 items (Home, Results, Rules) when no user
   - Navigation works correctly

7. **`tournament-sidebar.test.tsx`** (verification)
   - UserStats hidden when no user
   - FriendGroups hidden when no prodeGroups
   - GroupStandings always visible
   - Rules always visible

### Integration Tests

**Auth State Transitions:**
- Unauth user views tournament → Signs up → Page reloads with predictions
- Auth user views tournament → Logs out → Page switches to public view
- Dev tournament: Unauth user redirected to sign-in

**Navigation Flow:**
- Unauth user: Home → Results → Rules → Back to Home
- Unauth user: Clicks game card → Sign-up dialog opens
- Unauth user: Clicks "Learn How" → Onboarding opens

**Component Integration:**
- CTA bar + Games list work together
- Sidebar + Main content sync correctly
- Bottom nav + Page content sync

### Manual Testing Checklist

**Desktop:**
- [ ] Layout renders correctly for unauth
- [ ] Sidebar shows Groups and Rules only
- [ ] Games list displays as read-only
- [ ] CTA bar sticky and visible
- [ ] Onboarding opens from "Learn How"
- [ ] Sign-up dialog opens from game card click
- [ ] Navigation works (Home, Results, Rules)

**Mobile:**
- [ ] Bottom nav shows 3 items
- [ ] CTA bar full width
- [ ] Game cards stack vertically
- [ ] Onboarding responsive
- [ ] All touch targets 44x44px minimum

**Edge Cases:**
- [ ] Tournament not found → Error message
- [ ] No games yet → Empty state
- [ ] Network error → Retry button
- [ ] Dev tournament + unauth → Redirect to sign-in
- [ ] Sign up during session → Reload shows auth version

### Test Data Requirements

**Existing Utilities (Use these):**
- `@/__tests__/utils/test-utils` - renderWithTheme, renderWithProviders
- `@/__tests__/mocks/next-navigation.mocks` - Mock Next.js router
- `@/__tests__/mocks/next-auth.mocks` - Mock auth (null user for unauth)
- `@/__tests__/db/mock-helpers` - Mock DB queries
- `@/__tests__/db/test-factories` - Generate mock data

**Mock Scenarios:**
1. Unauth user (user = null)
2. Auth user with complete data
3. Empty tournament (no games)
4. Dev tournament in production
5. Network error

## Validation Checklist

**Before committing:**
- [ ] All unit tests pass (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Coverage ≥ 80% on new code
- [ ] No TypeScript errors

**Before creating PR:**
- [ ] Manual testing on desktop (Chrome, Safari)
- [ ] Manual testing on mobile (iOS Safari, Android Chrome)
- [ ] All acceptance criteria met
- [ ] No console errors or warnings
- [ ] Performance acceptable (no lag)

**Before marking ready for review:**
- [ ] SonarCloud: 0 new issues
- [ ] SonarCloud: Coverage ≥ 80%
- [ ] Vercel Preview deployed successfully
- [ ] User tested in Vercel Preview
- [ ] All feedback addressed

## Design Decisions (Finalized)

**These decisions are FINAL for this implementation:**

1. **✅ CTA Bar Dismissibility: NON-DISMISSIBLE**
   - No X button to dismiss
   - Sticky and always visible on public pages
   - Rationale: Clear conversion path more important than reduced clutter
   - Future: Can add dismissal if user feedback shows it's intrusive

2. **✅ Onboarding Trigger: MANUAL (Click Only)**
   - Onboarding does NOT auto-open on first visit
   - Only opens when user clicks "Learn How" button
   - Rationale: Less intrusive, user-initiated learning
   - Provides clear path for curious users

3. **✅ Game Card Interaction: OPEN SIGN-UP DIALOG**
   - Clicking a read-only game card opens sign-up dialog
   - Clear call-to-action: "Want to predict? Sign up!"
   - Rationale: Converts engagement into action
   - Alternative (no-op) would frustrate users

4. **✅ Results Page CTAs: OUT OF SCOPE**
   - Keep results page purely informational (no CTAs)
   - Rationale: Results are for reference, games page is for conversion
   - Future: Can add subtle CTAs if conversion data shows value

5. **✅ Bottom Nav Home Icon: NAVIGATE TO `/`**
   - "Home" icon goes to app home (`/`)
   - Even for unauth users (app home also needs auth currently)
   - Rationale: Consistent behavior, separate story to fix app home
   - Note: App home auth requirement is separate issue

6. **✅ Dev Tournament Redirect: REDIRECT TO SIGN-IN**
   - Dev tournaments in production require auth
   - Unauth users redirected to `/${locale}?openSignin=true&returnUrl=/${locale}/tournaments/${tournamentId}`
   - After sign-in, check permission; if no permission, show 404
   - Rationale: Dev tournaments are restricted, not public

7. **✅ Post-Signup Flow: VERIFY EMAIL → MANUAL SIGN-IN**
   - User signs up → Verification email sent
   - Dialog shows "Check your email" message
   - User clicks verification link → Redirected to sign-in
   - User signs in → Returns to tournament with auth
   - Rationale: Standard Next-Auth email verification flow

## Open Questions (For Implementation Phase)

1. **SEO Considerations:**
   - Should public tournament pages have meta tags for sharing?
   - Open Graph tags with tournament details?
   - This could be a follow-up story

2. **Analytics:**
   - Should we track unauth user behavior (pageviews, CTA clicks)?
   - This would require analytics setup (separate story)

## Out of Scope (MVP)

**Explicitly NOT included in this story:**

- ❌ Social proof ("X users predicted this match")
- ❌ Session persistence for return visitors
- ❌ Friend groups visibility (even anonymized)
- ❌ User stats/profiles/leaderboards
- ❌ Predictions dashboard
- ❌ Individual user predictions (anonymized or real)
- ❌ Making tournament the default landing page (Phase 2)
- ❌ Progressive CTAs for return visitors
- ❌ Public sharing features (share links, embeds)
- ❌ SEO optimization (meta tags, structured data)
- ❌ Analytics tracking

**These can be follow-up stories if needed.**

## Dependencies

**External:**
- Next.js 15.3 (App Router)
- NextAuth.js v5 (auth)
- Material-UI v7 (components)
- Kysely (database queries)

**Internal:**
- Existing components (game cards, sidebar, bottom nav)
- Existing test utilities (test-utils, mock-helpers)
- Tournament data repositories
- Onboarding flow components

**Blocking:**
- None - all dependencies already in place

## Risks & Mitigations

**Risk 1: Breaking Auth Users**
- **Impact**: High
- **Likelihood**: Medium
- **Mitigation**: Conditional rendering, extensive testing of both auth states

**Risk 2: Performance - Fetching Data for Unauth**
- **Impact**: Medium (slower page loads)
- **Likelihood**: Low (data fetch is already fast)
- **Mitigation**: Only fetch necessary data for unauth (skip user-specific queries)

**Risk 3: Onboarding Without Context**
- **Impact**: Medium (confusing UX)
- **Likelihood**: Low
- **Mitigation**: Ensure onboarding is self-contained, doesn't assume user data

**Risk 4: Mobile UX Degradation**
- **Impact**: High (most users on mobile)
- **Likelihood**: Low
- **Mitigation**: Responsive design testing, touch target sizes, mobile-first approach

## Success Metrics (Post-Launch)

**Not required for MVP, but good to consider:**

- Conversion rate: % of unauth visitors who sign up
- Engagement: Time spent on public pages
- Bounce rate: % who leave immediately
- CTA effectiveness: Click rate on "Sign up" vs "Learn How"
- Onboarding completion: % who complete onboarding flow

**These would require analytics setup (separate story).**

## Related Stories

**Future Enhancements:**
- Make tournament default landing page for all users
- Add social proof to public pages
- Add public sharing features (share buttons, embeds)
- Progressive CTAs for return visitors
- SEO optimization for tournament pages

**Depends On:**
- None

**Blocks:**
- Future story: "Make Tournament Default Landing Page"

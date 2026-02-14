# Implementation Plan: Desktop Tabbed Navigation and Tables in Mobile Bottom Nav

**Story:** #115
**Title:** [UXI] Desktop Tabbed Navigation and Tables in Mobile Bottom Nav
**Effort:** Medium (3-4 days)
**Priority:** High

## Story Context & Objectives

### Goal
Add consistent tabbed navigation on desktop and easy access to group tables on mobile, enabling users to quickly switch between Games, Tables, Stats, and Friend Groups on any device.

### Background
- Builds on #114 (Unified Games Page) - **VERIFIED: Merged and deployed**
- Tournament home page now uses UnifiedGamesPage
- Part of navigation audit (#111) to improve information architecture
- Completes mobile navigation by adding Tables tab

### User Value
- **Desktop:** Quick access to all sections via horizontal tabs
- **Mobile:** Comprehensive bottom navigation with Tables access
- **Consistency:** Unified mental model across devices
- **Efficiency:** 60% reduction in navigation clicks

## Prerequisites Verification

**Checked and confirmed:**
- ✅ #114 (Unified Games Page) is deployed - PR #117 merged
- ✅ Tournament home uses UnifiedGamesPage component
- ✅ Existing navigation structure understood
- ✅ Group standings component (GroupStandingsSidebar) exists and is reusable

## Acceptance Criteria

### Desktop Tabs
- [ ] Tabs visible on desktop (>=900px) below GroupSelector
- [ ] Four tabs: Games, Tables, Stats, Friend Groups
- [ ] Clicking tab navigates to respective route
- [ ] Active tab visually highlighted based on current route
- [ ] Tabs are sticky (remain visible on scroll)
- [ ] Smooth Material-UI transitions
- [ ] Responsive breakpoint at md (900px)

### Mobile Bottom Nav
- [ ] Five tabs: Home, Games, Tables, Groups, Stats
- [ ] "Tables" tab added between Games and Groups
- [ ] Fixed at bottom of viewport (56px height)
- [ ] Active tab highlighted based on current route
- [ ] Icons and labels clearly visible
- [ ] Tap targets >= 44x44px (Material-UI default)
- [ ] Z-index: 1300

### Tables Page
- [ ] Desktop: Accessible via "Tables" tab
- [ ] Mobile: Accessible via bottom nav "Tables" tab
- [ ] Shows all tournament groups with tabs to switch
- [ ] Qualified teams highlighted
- [ ] Reuses existing GroupStandingsSidebar patterns
- [ ] Consistent with Results page layout

### Navigation Flow
- [ ] Desktop: Active tab detection works correctly
- [ ] Mobile: Active tab detection works correctly
- [ ] URL navigation works for all routes
- [ ] Back/forward browser buttons work correctly
- [ ] Deep linking to /tables works

### Testing
- [ ] Unit tests for TournamentDesktopTabs component
- [ ] Unit tests for updated TournamentBottomNav
- [ ] Unit tests for TablesPage component
- [ ] Integration tests for navigation flows
- [ ] Accessibility tests (keyboard nav, ARIA labels)
- [ ] 80% coverage on new code

## Technical Approach

### Architecture Decision: Route-Based Navigation

**Approach:** Use separate routes for each section (not query parameters)

**Rationale:**
- Consistent with existing app structure (/stats, /friend-groups, /results are separate pages)
- Better SEO and deep linking
- Each page can be an independent Server Component
- Simpler state management
- Browser back/forward works naturally

**Routes:**
- Games: `/tournaments/[id]` (default)
- Tables: `/tournaments/[id]/tables` (NEW)
- Stats: `/tournaments/[id]/stats` (existing)
- Friend Groups: `/tournaments/[id]/friend-groups` (existing)

### Component Strategy

**1. TournamentDesktopTabs (NEW)**
- Client component ('use client')
- Uses Material-UI Tabs with Link components
- Active tab detection via usePathname()
- **Route Detection Priority:** Check specific routes BEFORE parent route:
  1. Check `/tournaments/{id}/tables` first
  2. Then `/tournaments/{id}/stats`
  3. Then `/tournaments/{id}/friend-groups`
  4. Finally `/tournaments/{id}` (default Games)
- Sticky positioning below GroupSelector
- Desktop-only (hidden on mobile)

**2. TablesPage (NEW)**
- Server Component (default)
- Route: `/tournaments/[id]/tables/page.tsx`
- Reuses GroupStandingsSidebar component patterns
- Shows all groups with tab navigation
- Consistent layout with other tournament pages

**3. TournamentBottomNav (UPDATE)**
- Update tabs configuration
- Add TableChartIcon from @mui/icons-material
- Update labels: "Tournament" → "Games", "Friend Groups" → "Groups"
- Remove "Resultados" tab
- Add "Tables" tab
- **Route Detection Priority:** Same ordering as desktop tabs to ensure consistent active state

**4. TournamentLayout (UPDATE)**
- Add TournamentDesktopTabs component below GroupSelector
- Position: after GroupSelector, before main content
- Desktop-only visibility
- **Z-Index Coordination:** Header (1100) > Tabs (100) > Content (0) < Bottom Nav (1300)

### Data Flow

```
User clicks tab
  ↓
Next.js Link navigation
  ↓
Route change (/tournaments/[id]/tables)
  ↓
Server Component renders
  ↓
Active tab highlighted via pathname matching
```

### Styling Approach

- Use Material-UI Tabs component (variant: "standard")
- Tournament theme colors for active indicator
- Sticky positioning: `position: 'sticky', top: 64, zIndex: 100`
- Responsive hiding: `display: { xs: 'none', md: 'flex' }`
- Bottom nav: `display: { xs: 'flex', md: 'none' }`

**Z-Index Layering (verified):**
- Tournament Header/AppBar: `zIndex: 1100` (sticky at top)
- Desktop Tabs: `zIndex: 100` (sticky below header)
- Content: `zIndex: 0` (default)
- Bottom Nav: `zIndex: 1300` (fixed at bottom, must be above everything)

**Layout Shift Prevention:**
- Desktop tabs positioned AFTER GroupSelector (inside AppBar)
- Tabs use `bgcolor: 'background.paper'` to match header
- No additional padding/margin to avoid layout shifts
- Responsive breakpoint (md: 900px) hides/shows without reflow

## Visual Prototypes

### Desktop Tabbed Navigation

```
┌──────────────────────────────────────────────────────────────┐
│ ┌──┐                                                          │
│ │🏠│ La Maquina    🏆 Copa del Mundo     🌓  👤             │
│ └──┘                                                          │
├──────────────────────────────────────────────────────────────┤
│  [A] [B] [C] [D] [E] [F] [G] [H]  ← GroupSelector           │
├──────────────────────────────────────────────────────────────┤
│  [ Games ]  [ Tables ]  [ Stats ]  [ Friend Groups ]         │ ← NEW
│  ══════════                                                   │
│  Active tab has underline indicator                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  Main Content Area                                           │
│  (Changes based on selected tab/route)                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Specs:**
- **Height:** 48px
- **Position:** Sticky (top: 64px = header height)
- **Background:** background.paper (white/dark based on theme)
- **Border:** Bottom border (divider color)
- **Z-index:** 100 (below header's 1100, above content)
- **Active Indicator:** Primary color, 2px height, bottom position
- **Typography:** button text (14px, medium weight)
- **Spacing:** Full-width tabs with equal distribution

**Tab States:**
1. **Active:** Bold text, primary color, bottom indicator
2. **Hover:** Light primary color background (alpha 0.04)
3. **Focus:** Keyboard focus ring
4. **Default:** Gray text (text.secondary)

### Mobile Bottom Navigation (Updated)

```
BEFORE (Current):
┌────────┬────────────┬───────────┬───────────────┬────────┐
│  Home  │ Tournament │ Resultados│ Friend Groups │  Stats │
│   🏠   │     🏆     │    📊     │      👥       │   📈   │
└────────┴────────────┴───────────┴───────────────┴────────┘

AFTER (New):
┌────────┬────────┬────────┬────────┬────────┐
│  Home  │ Games  │ Tables │ Groups │ Stats  │
│   🏠   │   🏆   │   📋   │   👥   │   📊   │
└────────┴────────┴────────┴────────┴────────┘
```

**Specs:**
- **Height:** 56px (Material-UI default)
- **Position:** Fixed bottom
- **Z-index:** 1300
- **Width:** 100%
- **Border:** Top border (divider color)
- **Background:** background.paper
- **Display:** Mobile only (xs), hidden on desktop (md+)

**Tab Configuration:**
| Label | Icon | Route | Value |
|-------|------|-------|-------|
| Home | HomeIcon | `/` | 'main-home' |
| Games | EmojiEventsIcon | `/tournaments/{id}` | 'games' |
| Tables | TableChartIcon | `/tournaments/{id}/tables` | 'tables' |
| Groups | PeopleIcon | `/tournaments/{id}/friend-groups` | 'groups' |
| Stats | AssessmentIcon | `/tournaments/{id}/stats` | 'stats' |

**Active State:**
- Primary color for icon and label
- Ripple effect on tap
- Label text: 12px (caption)

### Tables Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Tournament Header                                             │
│ GroupSelector                                                 │
│ Desktop Tabs ([ Games ] [ TABLES ] [ Stats ] [ Groups ])     │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  GROUP STANDINGS                                       │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │ [ A ] [ B ] [ C ] [ D ] [ E ] [ F ] [ G ] [ H ]  │ │  │
│  │  │ Active: A                                         │ │  │
│  │  └──────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │  ┌────────────────────────────────────────────────┐   │  │
│  │  │  GRUPO A                                       │   │  │
│  │  ├────────────────────────────────────────────────┤   │  │
│  │  │  1. 🇦🇷 Argentina     7 pts  ⭐ Qualified    │   │  │
│  │  │     3W 0D 0L  GF:7 GA:0  GD:+7              │   │  │
│  │  ├────────────────────────────────────────────────┤   │  │
│  │  │  2. 🇲🇽 Mexico        6 pts  ⭐ Qualified    │   │  │
│  │  │     2W 0D 1L  GF:5 GA:3  GD:+2              │   │  │
│  │  ├────────────────────────────────────────────────┤   │  │
│  │  │  3. 🇵🇱 Poland        3 pts                  │   │  │
│  │  │     1W 0D 2L  GF:4 GA:5  GD:-1              │   │  │
│  │  ├────────────────────────────────────────────────┤   │  │
│  │  │  4. 🇸🇦 Saudi Arabia  0 pts                  │   │  │
│  │  │     0W 0D 3L  GF:2 GA:10 GD:-8              │   │  │
│  │  └────────────────────────────────────────────────┘   │  │
│  │                                                        │  │
│  │  [← Previous]  GRUPO A  [Next →]                      │  │
│  │  (Keyboard: Arrow Left/Right)                         │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

**Specs:**
- **Container:** maxWidth: "lg", centered
- **Card:** Material-UI Card with padding
- **Group Tabs:** Material-UI Tabs, scrollable if many groups
- **Navigation:** Arrow buttons + keyboard support + swipe gestures
- **Team Cards:** Reuse TeamStandingsCards component (from GroupStandingsSidebar)
- **Qualified Badge:** Gold star icon, primary color
- **Responsive:** Full-width on mobile, centered on desktop

**States:**
1. **Loading:** Skeleton loaders for team cards
2. **Empty:** "No groups available" message
3. **Single Group:** Hide navigation arrows
4. **Multiple Groups:** Show carousel navigation

### Responsive Behavior

**Desktop (>= 900px):**
- Desktop tabs: VISIBLE
- Bottom nav: HIDDEN
- Sidebar: VISIBLE (on Games page only)
- Tables page: Full-width card layout

**Mobile (< 900px):**
- Desktop tabs: HIDDEN
- Bottom nav: VISIBLE
- Sidebar: HIDDEN (content cards stack vertically)
- Tables page: Full-width, touch-friendly navigation

**Breakpoint:** `md` (900px) - consistent with existing app patterns

### Accessibility Considerations

**Keyboard Navigation:**
- Tab key: Cycle through tabs
- Enter/Space: Activate tab
- Arrow keys: Navigate between groups (on Tables page)
- Focus indicators: Clear visual focus states

**Screen Readers:**
- ARIA labels: "Desktop navigation tabs", "Mobile bottom navigation"
- ARIA current: "page" for active tab
- Tab labels: Clear and descriptive
- Group navigation: Announce "Group A of H" etc.

**Touch Targets:**
- Minimum 44x44px (Material-UI default ensures this)
- Adequate spacing between tabs
- Ripple feedback on touch

## Files to Create

### 1. TournamentDesktopTabs Component
**Path:** `app/components/tournament-page/tournament-desktop-tabs.tsx`

**Purpose:** Horizontal tab navigation for desktop

**Key Features:**
- Client component with usePathname hook
- Material-UI Tabs with Link components
- Active tab detection based on pathname
- Sticky positioning
- Desktop-only visibility

**Dependencies:**
- @mui/material: Tabs, Tab, Box
- next/link: Link
- next/navigation: usePathname

### 2. TablesPage Component
**Path:** `app/tournaments/[id]/tables/page.tsx`

**Purpose:** Full-page view of all group standings

**Key Features:**
- Server Component (fetch group standings data)
- Material-UI Tabs for group selection
- Reuses TeamStandingsCards component
- Keyboard and swipe navigation
- Responsive layout

**Dependencies:**
- Server actions: getGroupStandingsForTournament
- Components: TeamStandingsCards
- @mui/material: Card, Tabs, Tab, Box, IconButton

### 3. TablesPage Client Component
**Path:** `app/components/tournament-page/tables-page-client.tsx`

**Purpose:** Client-side interactive group navigation

**Key Features:**
- Group carousel with arrow buttons
- Keyboard navigation (arrow keys)
- Touch swipe support
- Active group state management

### 4. Test Files
**Paths:**
- `app/__tests__/components/tournament-page/tournament-desktop-tabs.test.tsx`
- `app/__tests__/components/tournament-page/tables-page-client.test.tsx`
- `app/tournaments/[id]/tables/__tests__/page.test.tsx`
- `app/__tests__/integration/tournament-desktop-tabs-navigation.test.tsx`

## Files to Modify

### 1. TournamentLayout
**Path:** `app/tournaments/[id]/layout.tsx`

**Changes:**
- Import TournamentDesktopTabs
- Add component below GroupSelector (line ~182)
- Position between GroupSelector and main content

**Before:**
```tsx
</Grid>
</AppBar>
<Box sx={{ flexGrow: 1, ... }}>
  {children}
</Box>
```

**After:**
```tsx
</Grid>
</AppBar>
<TournamentDesktopTabs tournamentId={params.id} />
<Box sx={{ flexGrow: 1, ... }}>
  {children}
</Box>
```

### 2. TournamentBottomNav
**Path:** `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`

**Changes:**
- Update tabs array (lines 34-76)
- Add TableChartIcon import
- Update labels: "Tournament" → "Games", "Friend Groups" → "Groups"
- Remove "Resultados" tab
- Add "Tables" tab
- Update useEffect active tab detection (lines 18-32)
- Update handleChange switch cases (lines 34-55)

**New tabs array:**
```tsx
const tabs = [
  { label: 'Home', value: 'main-home', icon: <Home />, href: '/' },
  { label: 'Games', value: 'games', icon: <EmojiEvents />, href: `/tournaments/${tournamentId}` },
  { label: 'Tables', value: 'tables', icon: <TableChart />, href: `/tournaments/${tournamentId}/tables` },
  { label: 'Groups', value: 'groups', icon: <People />, href: `/tournaments/${tournamentId}/friend-groups` },
  { label: 'Stats', value: 'stats', icon: <Assessment />, href: `/tournaments/${tournamentId}/stats` },
];
```

### 3. Bottom Nav Tests
**Paths:**
- `app/__tests__/components/tournament-bottom-nav/tournament-bottom-nav.test.tsx`
- `app/__tests__/components/tournament-bottom-nav/tournament-bottom-nav-wrapper.test.tsx`

**Changes:**
- Update test cases for new tab configuration
- Add tests for "Tables" tab
- Update expected tab counts (4 → 5)
- Update label assertions
- Test navigation to /tables route

## Implementation Steps

### Phase 1: Desktop Tabs Component (Day 1)

**Step 1.1: Create TournamentDesktopTabs Component**
- Create `app/components/tournament-page/tournament-desktop-tabs.tsx`
- Implement with Material-UI Tabs
- Add active tab detection with usePathname
- Configure sticky positioning
- Add responsive display (desktop-only)

**Step 1.2: Integrate into Layout**
- Update `app/tournaments/[id]/layout.tsx`
- Import TournamentDesktopTabs
- Add component below GroupSelector (within or after AppBar)
- **CRITICAL:** Verify z-index layering (header: 1100, tabs: 100, bottom nav: 1300)
- **CRITICAL:** Test no layout shift at md breakpoint (900px)
- Test positioning and stickiness on scroll

**Step 1.3: Test Desktop Tabs**
- Create unit tests for TournamentDesktopTabs
- Test active tab detection logic
- Test navigation with Link components
- Test responsive visibility
- Verify accessibility (keyboard nav, ARIA)

### Phase 2: Tables Page (Day 1-2)

**Step 2.1: Create Tables Page Server Component**
- Create `app/tournaments/[id]/tables/page.tsx`
- Fetch group standings data (reuse getGroupStandingsForTournament)
- Pass data to client component
- Handle auth check (redirect if not logged in)
- Handle empty state (no groups)

**Step 2.2: Create Tables Page Client Component**
- Create `app/components/tournament-page/tables-page-client.tsx`
- Implement group carousel with tabs
- Add arrow button navigation
- Add keyboard navigation (useEffect for arrow keys)
- Add touch swipe support (useEffect for touch events)
- Reuse TeamStandingsCards component

**Step 2.3: Test Tables Page**
- Create unit tests for TablesPageClient
- Test group navigation (tabs, arrows, keyboard)
- Test active group state management
- Create integration test for server/client interaction
- Test empty states and error handling

### Phase 3: Mobile Bottom Nav Update (Day 2)

**Step 3.1: Update TournamentBottomNav Component**
- Add TableChartIcon import from @mui/icons-material
- Update tabs configuration array
- **CRITICAL:** Update useEffect active tab detection with correct route priority:
  ```typescript
  // Check specific routes FIRST (before parent route)
  if (currentPath === `/tournaments/${tournamentId}/tables`) {
    setValue('tables');
  } else if (currentPath.startsWith(`/tournaments/${tournamentId}/stats`)) {
    setValue('stats');
  } else if (currentPath === `/tournaments/${tournamentId}/friend-groups`) {
    setValue('groups');
  } else if (currentPath === `/tournaments/${tournamentId}`) {
    setValue('games'); // Default - check LAST
  }
  ```
- Update handleChange navigation logic
- Remove "Resultados" tab logic
- Add "Tables" tab logic
- **NOTE:** Badge count feature is OUT OF SCOPE for this story (mentioned in AC but not implemented)

**Step 3.2: Update Bottom Nav Tests**
- Update `tournament-bottom-nav.test.tsx`
- Change expected tab count assertions (4 → 5)
- Add test cases for "Tables" tab
- Update navigation tests for new routes
- Test active tab detection for /tables route
- Verify "Resultados" tab is removed

**Step 3.3: Manual Testing on Mobile Devices**
- Test on iOS Safari (iPhone)
- Test on Android Chrome
- Verify tap targets are adequate
- Test navigation flow
- Verify active tab highlighting

### Phase 4: Integration & Polish (Day 3)

**Step 4.1: End-to-End Navigation Testing**
- Test desktop tabs → Tables page navigation
- Test mobile bottom nav → Tables page navigation
- Test direct URL navigation (/tournaments/[id]/tables)
- Test browser back/forward buttons
- Test deep linking from external sources

**Step 4.2: Visual Polish**
- Verify tournament theme colors apply correctly
- Check active tab indicators on both desktop and mobile
- Verify sticky positioning works with scrolling
- Test responsive breakpoint transitions (900px)
- Check z-index layering (tabs, header, bottom nav)

**Step 4.3: Accessibility Audit**
- Keyboard navigation through all tabs
- Screen reader testing (VoiceOver, NVDA)
- Focus indicators visible and clear
- ARIA labels present and correct
- Color contrast meets WCAG AA standards
- Touch targets >= 44x44px

**Step 4.4: Performance Testing**
- Measure initial page load time
- Check for layout shifts (CLS)
- Verify smooth tab transitions
- Test with many groups (8+)
- Check memory usage with navigation

### Phase 5: Testing & Quality Gates (Day 3-4)

**Step 5.1: Run Full Test Suite**
```bash
npm test
```
- Verify all new tests pass
- Verify no regressions in existing tests
- Check code coverage >= 80% on new code

**Step 5.2: Linting & Type Checking**
```bash
npm run lint
npm run build
```
- Fix any ESLint errors
- Resolve TypeScript type errors
- Verify production build succeeds

**Step 5.3: Visual Regression Testing**
- Compare before/after screenshots
- Verify layout consistency
- Check theme color application
- Test dark mode appearance

## Testing Strategy

### Testing Utilities (Project Patterns)

**IMPORTANT:** Use project's existing test utilities for consistency and reliability.

**From `@/__tests__/utils/test-utils`:**
- `renderWithTheme()` - Render components with Material-UI theme
- `renderWithProviders()` - Render with all context providers

**Mock Next.js Navigation:**
- Mock `usePathname()` from 'next/navigation' for active tab testing
- Use `vi.mock('next/navigation')` pattern from existing tests
- Mock router for Link component testing

**Example Test Pattern:**
```typescript
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/tournaments/123/tables'),
  useRouter: vi.fn(() => ({ push: vi.fn() }))
}));

describe('TournamentDesktopTabs', () => {
  it('highlights Tables tab when pathname is /tables', () => {
    renderWithTheme(<TournamentDesktopTabs tournamentId="123" />);
    // Assert Tables tab has active styling
  });
});
```

### Unit Tests

**TournamentDesktopTabs:**
```typescript
describe('TournamentDesktopTabs', () => {
  it('renders 4 tabs', () => {});
  it('highlights active tab based on pathname', () => {});
  it('detects /tables route before /tournaments/{id}', () => {}); // NEW
  it('navigates to correct route on tab click', () => {});
  it('is hidden on mobile', () => {});
  it('has sticky positioning', () => {});
  it('supports keyboard navigation', () => {});
  it('has correct ARIA labels', () => {});
});
```

**TablesPageClient:**
```typescript
describe('TablesPageClient', () => {
  it('renders group tabs', () => {});
  it('switches groups on tab click', () => {});
  it('navigates with arrow buttons', () => {});
  it('supports keyboard arrow keys', () => {});
  it('supports touch swipe gestures', () => {});
  it('disables previous button on first group', () => {});
  it('disables next button on last group', () => {});
  it('shows qualified badge for qualified teams', () => {});
});
```

**TournamentBottomNav (Updated):**
```typescript
describe('TournamentBottomNav', () => {
  it('renders 5 tabs', () => {});
  it('includes Tables tab with TableChartIcon', () => {});
  it('does not include Resultados tab', () => {});
  it('navigates to /tables on Tables tab click', () => {});
  it('highlights Tables tab when on /tables route', () => {});
  it('detects /tables route before /tournaments/{id}', () => {}); // NEW
  it('updates labels correctly', () => {});
});
```

### Integration Tests

**Desktop Navigation Flow:**
```typescript
describe('Desktop Tabs Navigation', () => {
  it('navigates from Games to Tables', () => {});
  it('maintains active tab state across navigation', () => {});
  it('works with browser back/forward', () => {});
  it('supports direct URL navigation', () => {});
});
```

**Mobile Navigation Flow:**
```typescript
describe('Mobile Bottom Nav Navigation', () => {
  it('navigates from Games to Tables', () => {});
  it('highlights correct tab on route change', () => {});
  it('hides desktop tabs on mobile', () => {});
  it('shows bottom nav on mobile', () => {});
});
```

### Accessibility Tests

```typescript
describe('Accessibility', () => {
  it('desktop tabs have correct ARIA labels', () => {});
  it('bottom nav has correct ARIA labels', () => {});
  it('active tab has aria-current="page"', () => {});
  it('supports keyboard navigation', () => {});
  it('has visible focus indicators', () => {});
  it('meets color contrast requirements', () => {});
});
```

### Manual Testing Checklist

**Desktop (>= 900px):**
- [ ] Desktop tabs visible below GroupSelector
- [ ] Tabs are sticky when scrolling
- [ ] Active tab highlighted correctly
- [ ] Tab navigation works (all 4 tabs)
- [ ] Bottom nav hidden
- [ ] Tournament theme colors applied

**Mobile (< 900px):**
- [ ] Desktop tabs hidden
- [ ] Bottom nav visible and fixed at bottom
- [ ] 5 tabs visible (Home, Games, Tables, Groups, Stats)
- [ ] Tables tab has TableChartIcon
- [ ] Active tab highlighted correctly
- [ ] Navigation works for all tabs
- [ ] Tap targets are adequate

**Tables Page:**
- [ ] Accessible via desktop tabs
- [ ] Accessible via mobile bottom nav
- [ ] Direct URL navigation works
- [ ] Group tabs render correctly
- [ ] Arrow navigation works
- [ ] Keyboard arrow keys work
- [ ] Touch swipe works (mobile)
- [ ] Qualified teams highlighted
- [ ] Empty state handled gracefully

**Browser Compatibility:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] iOS Safari
- [ ] Android Chrome

## Validation Considerations

### SonarCloud Quality Gates

**Coverage Requirements:**
- Minimum 80% coverage on all new code
- Focus on:
  - TournamentDesktopTabs component
  - TablesPageClient component
  - Updated TournamentBottomNav logic
  - Navigation state management

**Code Quality:**
- 0 new bugs
- 0 new vulnerabilities
- 0 new code smells
- Maintainability rating: A
- Security rating: A

**Duplication:**
- Ensure TeamStandingsCards is properly reused (no duplication)
- Share common navigation logic where possible
- Use existing utilities for pathname detection

### Pre-Commit Checks

```bash
# Run tests
npm test

# Check coverage
npm test -- --coverage

# Lint
npm run lint

# Build
npm run build
```

### Deployment Verification

**After Vercel Preview Deploy:**
1. Test desktop tabs on production-like environment
2. Test mobile bottom nav on real devices
3. Verify theme colors apply correctly
4. Test navigation flows end-to-end
5. Check performance metrics (Lighthouse)
6. Verify no console errors
7. Test deep linking

**Post-Merge:**
1. Monitor error logs for navigation issues
2. Check analytics for tab usage patterns
3. Gather user feedback on discoverability
4. Verify success metrics (60% reduction in clicks)

## Open Questions & Clarifications

### Badge Count Feature (AC Mentioned, Not Implemented)
**Status:** OUT OF SCOPE for this story

**Reasoning:**
- Story AC mentions "Badge count on Games tab (if unpredicted games exist)"
- However, NO implementation details provided in story
- Current bottom nav doesn't have badge logic
- Would require: data fetching, state management, real-time updates
- Adds significant complexity and testing overhead

**Recommendation:**
- Implement basic navigation first (this story)
- Create separate follow-up story for badge count feature if needed
- User can provide clarification if badge is critical for initial release

### Route Detection Implementation (Resolved)
**Solution:** Specific routes checked BEFORE parent route to avoid incorrect matches
- Priority: /tables → /stats → /friend-groups → /tournaments/{id} (default)

### Layout Z-Index Coordination (Resolved)
**Solution:** Explicit z-index layering documented
- Header: 1100, Tabs: 100, Content: 0, Bottom Nav: 1300

## Risk Assessment

**Low Risks:**
- Desktop tabs integration - straightforward Material-UI component
- Tables page - reuses existing components and patterns
- Bottom nav updates - well-defined changes

**Medium Risks:**
- Active tab detection across different routes - needs thorough testing
- Responsive breakpoint transitions - verify smooth behavior at 900px
- Touch swipe gestures on Tables page - ensure no conflicts with other gestures

**Mitigation:**
- Comprehensive unit and integration tests
- Manual testing on multiple devices and browsers
- Gradual rollout with monitoring

## Success Metrics

**Target Improvements:**
- 60% reduction in navigation clicks to access Tables/Stats/Groups
- 100% feature discoverability (users find all sections easily)
- 90%+ user satisfaction with navigation experience
- 0 new SonarCloud issues
- 80%+ test coverage on new code

**Measurement:**
- Analytics tracking for tab click events
- User feedback surveys post-deployment
- Navigation flow analysis
- Error rate monitoring

## Notes

- Story #114 (Unified Games Page) is confirmed deployed ✅
- Existing GroupStandingsSidebar component is well-structured for reuse
- Route-based navigation is consistent with app architecture
- Material-UI components provide built-in accessibility
- Responsive design follows existing app patterns (md breakpoint at 900px)

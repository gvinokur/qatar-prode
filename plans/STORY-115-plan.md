# Implementation Plan: Story #115 - Desktop Tabbed Navigation and Tables in Mobile Bottom Nav

## Story Context

### Objective
Add horizontal tabbed navigation on desktop for quick access to Games, Tables, Stats, and Friend Groups, and update mobile bottom navigation with clearer labels and icons for improved discoverability.

### Dependencies
- ✅ **#114 (Unified Games Page)** - Completed and deployed
- Integration with #110 (Group Tables in Sidebar) for Tables page content

### Problem Statement
After implementing the Unified Games Page (#114), we have an opportunity to:
1. **Desktop**: Add tabbed navigation for quick switching between tournament sections (currently no tabs exist)
2. **Mobile**: Improve bottom navigation labels and icons for better clarity:
   - "Tournament" → "Games" (clearer purpose)
   - "Resultados" → "Tables" (aligns with desktop terminology)
   - Better icon choices (trophy for Games, table chart for Tables, bar chart for Stats)

### Success Metrics
- 60% reduction in navigation clicks to access Tables/Stats/Groups
- 100% feature discoverability (users find all sections easily)
- 90%+ user satisfaction with navigation experience

## Current State Analysis

### Current Mobile Bottom Nav (5 tabs)
```typescript
// app/components/tournament-bottom-nav/tournament-bottom-nav.tsx
[Home] [Tournament] [Resultados] [Friend Groups] [Stats]
  Home    EmojiEvents   Assessment      Groups        Person

Routes:
- Home → /
- Tournament → /tournaments/[id]
- Resultados → /tournaments/[id]/results
- Friend Groups → /tournaments/[id]/friend-groups
- Stats → /tournaments/[id]/stats
```

### Current Desktop Layout
- Tournament header (AppBar with logo, title, theme)
- GroupSelector component (PARTIDOS, CLASIFICADOS tabs)
- Main content area
- Sidebar (desktop only) - Rules, Stats, Group Standings, Friend Groups
- **NO horizontal tabs for tournament navigation**

### Existing Patterns in Codebase

**Tabs implementations:**
1. `app/components/tournament-stats/stats-tabs.tsx` - Internal tabs within stats page
2. `app/components/results-page/results-page-client.tsx` - Groups vs Playoffs tabs
3. `app/components/groups-page/group-selector.tsx` - Link-based tabs with Tabs component

**Key pattern:** Material-UI Tabs with Link components for navigation, using pathname/searchParams for active state detection.

## Acceptance Criteria

### Desktop Tabs
- [ ] Horizontal tabs visible on desktop (>=900px) below tournament header
- [ ] Four tabs: Games, Tables, Stats, Friend Groups
- [ ] Tabs positioned below header, above main content
- [ ] Active tab visually highlighted based on current route
- [ ] Smooth transitions between tabs
- [ ] Sticky positioning (tabs remain visible on scroll)
- [ ] Tabs use Link component for client-side navigation

### Mobile Bottom Nav Updates
- [ ] Update "Tournament" label to "Games"
- [ ] Update "Resultados" label to "Tables"
- [ ] Update icons:
  - Games: EmojiEventsIcon (trophy) - already correct
  - Tables: TableChartIcon (new)
  - Groups: PeopleIcon (new)
  - Stats: BarChartIcon (new)
- [ ] Maintain 5-tab structure (Home, Games, Tables, Groups, Stats)
- [ ] Active tab detection works correctly for all routes
- [ ] Fixed at bottom with proper z-index

### Tables Page
- [ ] Accessible via desktop "Tables" tab
- [ ] Accessible via mobile "Tables" bottom nav tab
- [ ] Shows all tournament groups with standings
- [ ] Group selector for switching between groups
- [ ] Qualified teams highlighted
- [ ] Reuses GroupStandingsSidebar component logic from #110

### Navigation & Routing
- [ ] Desktop tabs navigate to correct routes:
  - Games → `/tournaments/[id]`
  - Tables → `/tournaments/[id]/results` (reuse existing results page)
  - Stats → `/tournaments/[id]/stats`
  - Friend Groups → `/tournaments/[id]/friend-groups`
- [ ] Mobile bottom nav routes remain consistent with desktop
- [ ] Active tab detection works for all routes
- [ ] Browser back/forward buttons work correctly

### Responsive Behavior
- [ ] Desktop tabs only visible on md+ breakpoint (>=900px)
- [ ] Mobile bottom nav only visible on xs-sm breakpoint (<900px)
- [ ] No layout shift when switching between mobile/desktop

### Testing Requirements
- [ ] Unit tests for TournamentDesktopTabs component
- [ ] Unit tests for updated TournamentBottomNav (icon changes, label changes)
- [ ] Integration test for tab navigation flow (desktop)
- [ ] Integration test for bottom nav navigation flow (mobile)
- [ ] Accessibility tests (keyboard navigation, ARIA labels, screen reader)
- [ ] Visual regression tests for tabs appearance
- [ ] 80% coverage on new/modified code

## Technical Approach

### 1. Desktop Tabs Component

**Create:** `app/components/tournament-page/tournament-desktop-tabs.tsx`

This will be a new Client Component that renders horizontal tabs for desktop navigation.

**Component Structure:**
```typescript
'use client';

import { Tabs, Tab, Box } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface TournamentDesktopTabsProps {
  readonly tournamentId: string;
}

export function TournamentDesktopTabs({ tournamentId }: TournamentDesktopTabsProps) {
  const pathname = usePathname();

  // Determine active tab based on pathname
  const getActiveTab = (): string => {
    if (pathname === `/tournaments/${tournamentId}`) return 'games';
    if (pathname.startsWith(`/tournaments/${tournamentId}/results`)) return 'tables';
    if (pathname.startsWith(`/tournaments/${tournamentId}/stats`)) return 'stats';
    if (pathname.startsWith(`/tournaments/${tournamentId}/friend-groups`)) return 'groups';
    return 'games'; // default
  };

  const activeTab = getActiveTab();

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 1100,
        bgcolor: 'background.paper',
        display: { xs: 'none', md: 'block' }, // Desktop only
      }}
    >
      <Tabs
        value={activeTab}
        aria-label="tournament navigation tabs"
        variant="fullWidth"
        TabIndicatorProps={{
          sx: {
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        }}
      >
        <Tab
          label="Games"
          value="games"
          component={Link}
          href={`/tournaments/${tournamentId}`}
        />
        <Tab
          label="Tables"
          value="tables"
          component={Link}
          href={`/tournaments/${tournamentId}/results`}
        />
        <Tab
          label="Stats"
          value="stats"
          component={Link}
          href={`/tournaments/${tournamentId}/stats`}
        />
        <Tab
          label="Friend Groups"
          value="groups"
          component={Link}
          href={`/tournaments/${tournamentId}/friend-groups`}
        />
      </Tabs>
    </Box>
  );
}
```

**Key Design Decisions:**
1. **Nested inside AppBar**: Tabs will be added as a third Grid section INSIDE the AppBar component (after header and GroupSelector), so they're part of the same sticky container. This avoids z-index conflicts and ensures tabs stick together with the header.
2. **No separate sticky positioning**: Since tabs are nested in AppBar, they don't need their own `position: sticky` - they inherit sticky behavior from AppBar.
3. **fullWidth variant**: Tabs span full width with equal spacing
4. **Link component**: Client-side navigation for fast transitions
5. **Display: none on mobile**: Only shown on md+ breakpoint
6. **Route-based active state**: Uses pathname to determine active tab

**Z-Index Strategy:**
- AppBar (line 80 in layout.tsx): `position: sticky, top: 0, zIndex: 1100`
- Desktop tabs nested inside AppBar: No additional z-index needed (inherits from AppBar)
- Mobile bottom nav: `zIndex: 1300` (stays above tabs)
- Result: No z-index conflicts, clean stacking order

### 2. Update Mobile Bottom Nav

**Modify:** `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`

**Changes:**
1. Update labels: "Tournament" → "Games", "Resultados" → "Tables"
2. Update icons: Import TableChartIcon, PeopleIcon, BarChartIcon
3. Update route detection logic for consistency
4. Ensure Groups icon is PeopleIcon (currently Groups, should be PeopleIcon)

**Updated Navigation Actions:**
```typescript
import { Home, EmojiEvents, TableChart, People, BarChart } from '@mui/icons-material';

// Current:
<BottomNavigationAction label="Tournament" value="tournament-home" icon={<EmojiEvents />} />
<BottomNavigationAction label="Resultados" value="results" icon={<Assessment />} />
<BottomNavigationAction label="Friend Groups" value="friend-groups" icon={<Groups />} />
<BottomNavigationAction label="Stats" value="stats" icon={<Person />} />

// New:
<BottomNavigationAction label="Games" value="tournament-home" icon={<EmojiEvents />} />
<BottomNavigationAction label="Tables" value="results" icon={<TableChart />} />
<BottomNavigationAction label="Groups" value="friend-groups" icon={<People />} />
<BottomNavigationAction label="Stats" value="stats" icon={<BarChart />} />
```

**Label Rationale:**
- Mobile uses **"Groups"** (1 word) instead of "Friend Groups" (2 words) to avoid truncation on small screens (320px width)
- Desktop tabs can use full **"Friend Groups"** label as there's more horizontal space

**No route changes needed** - routes remain the same, just better labels/icons.

### 3. Integrate Desktop Tabs into Layout

**Modify:** `app/tournaments/[id]/layout.tsx`

**Integration Point:** Add TournamentDesktopTabs as a third Grid section INSIDE the AppBar (after header and GroupSelector).

**Changes:**
```typescript
import { TournamentDesktopTabs } from '../../components/tournament-page/tournament-desktop-tabs';

// In layout JSX:
return (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '...' }}>
    <AppBar position={'sticky'} sx={{ top: 0, zIndex: 1100 }}>
      <Grid container>
        {/* Section 1: Tournament header (logo, title, theme) */}
        <Grid size={12} pt={2} pb={1} pl={2} pr={2}>
          {/* ... existing header content ... */}
        </Grid>

        {/* Section 2: GroupSelector (PARTIDOS, CLASIFICADOS tabs) */}
        <Grid size={12} pb={{ xs: 1, md: 0.5 }} pl={1} pr={1}>
          <GroupSelector {...props} />
        </Grid>

        {/* Section 3: NEW - Desktop tabs (Games, Tables, Stats, Friend Groups) */}
        <Grid size={12} sx={{ display: { xs: 'none', md: 'block' } }}>
          <TournamentDesktopTabs tournamentId={params.id} />
        </Grid>
      </Grid>
    </AppBar>

    {/* Main content area */}
    <Box sx={{ flexGrow: 1, overflow: 'auto', px: 2, pb: 2 }}>
      {children}
    </Box>

    {/* Mobile bottom nav */}
    <TournamentBottomNavWrapper tournamentId={params.id} />
  </Box>
);
```

**Key Points:**
- **Tabs nested INSIDE AppBar Grid** as a third section (after header and GroupSelector)
- **Inherits sticky behavior from AppBar** - no separate sticky positioning needed
- Desktop tabs and mobile bottom nav coexist (mutually exclusive via breakpoints)
- No z-index conflicts - tabs are part of the AppBar sticky container
- Tabs automatically hidden on mobile via `display: { xs: 'none', md: 'block' }` on the Grid wrapper

### 4. Tables Page (Reuse Existing Results Page)

**No new page needed!** The `/tournaments/[id]/results` page already exists and displays group standings.

**Current Results Page Structure:**
- `app/tournaments/[id]/results/page.tsx` - Server Component fetching data
- `app/components/results-page/results-page-client.tsx` - Client Component with Groups/Playoffs tabs
- `app/components/results-page/groups-stage-view.tsx` - Displays group standings

**What users see when clicking "Tables" tab:**
1. Desktop: Click "Tables" tab → navigates to `/tournaments/[id]/results`
2. Mobile: Tap "Tables" in bottom nav → navigates to `/tournaments/[id]/results`
3. Results page displays:
   - Internal tabs: "Grupos" | "Playoffs"
   - Groups view: All groups with standings, qualified teams highlighted
   - Group selector to switch between groups (A, B, C, etc.)

**This perfectly satisfies the Tables requirement - no additional work needed!**

### 5. Visual Design Specifications

#### Desktop Tabs Styling
```typescript
// Material-UI Tabs component
{
  variant: 'fullWidth',
  TabIndicatorProps: {
    sx: {
      height: 3,
      borderRadius: '3px 3px 0 0',
    },
  },
  sx: {
    borderBottom: 1,
    borderColor: 'divider',
    bgcolor: 'background.paper',
    '& .MuiTab-root': {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '1rem',
      minHeight: 48,
    },
    '& .Mui-selected': {
      color: 'primary.main',
    },
  }
}
```

**Design Choices:**
- **textTransform: none** - Keep tab labels in sentence case (Games, Tables, Stats, Friend Groups)
- **fontWeight: 600** - Semi-bold for readability
- **minHeight: 48px** - Consistent with Material-UI guidelines
- **fullWidth variant** - Equal spacing across all tabs
- **3px indicator** - Clear visual feedback for active tab
- **Sticky positioning** - Tabs stay visible while scrolling content

#### Mobile Bottom Nav (No Visual Changes)
Current styling is already correct - only updating labels and icons.

```typescript
sx={{
  display: { xs: 'flex', md: 'none' },
  position: 'fixed',
  bottom: 0,
  width: '100%',
  height: 56,
  zIndex: 1300,
  borderTop: 1,
  borderColor: 'divider',
}}
```

### 6. Accessibility Requirements

#### Desktop Tabs
- [ ] **Keyboard navigation**: Tab key moves between tabs, Enter/Space activates
- [ ] **ARIA labels**: `aria-label="tournament navigation tabs"` on Tabs container
- [ ] **Focus indicators**: Clear visual focus state for keyboard users
- [ ] **Screen reader support**: Tab labels announced correctly ("Games tab", "Tables tab", etc.)

#### Mobile Bottom Nav
- [ ] **Touch targets**: Minimum 44x44px (already satisfied with height: 56)
- [ ] **ARIA labels**: Each tab has descriptive label
- [ ] **Active state**: Clear visual and semantic indication of active tab
- [ ] **Screen reader**: Navigation purpose announced ("tournament navigation")

### 7. Testing Strategy

#### Unit Tests

**Test: TournamentDesktopTabs Component**
- File: `__tests__/components/tournament-page/tournament-desktop-tabs.test.tsx`
- Coverage:
  - ✅ Renders 4 tabs with correct labels
  - ✅ Active tab detection based on pathname
  - ✅ Link hrefs are correct for each tab
  - ✅ Hidden on mobile (xs-sm), visible on desktop (md+)
  - ✅ Tabs component has correct ARIA attributes

**Test: Updated TournamentBottomNav Component**
- File: `__tests__/components/tournament-bottom-nav/tournament-bottom-nav.test.tsx`
- Coverage:
  - ✅ Updated labels render correctly ("Games", "Tables", "Groups")
  - ✅ New icons render correctly (TableChart, People, BarChart)
  - ✅ Active tab detection works for all routes
  - ✅ Navigation to correct routes on click
  - ✅ Hidden on desktop, visible on mobile

**Coverage Strategy for Label/Icon Updates:**
To ensure 80% coverage on modified code, add these additional test scenarios:
- Test that old labels ("Tournament", "Resultados", "Friend Groups") do NOT appear
- Test icon component types (TableChart, People, BarChart) are correct instances
- Test accessibility: ARIA labels match new labels ("Games", "Tables", "Groups")
- Test icon colors/styles render correctly
- This ensures sufficient new test lines to meet SonarCloud 80% coverage threshold

#### Integration Tests

**Test: Desktop Tab Navigation Flow**
- File: `__tests__/integration/tournament-desktop-tabs-navigation.test.tsx`
- Scenario:
  1. User on `/tournaments/123`
  2. Clicks "Tables" tab → navigates to `/tournaments/123/results`
  3. Clicks "Stats" tab → navigates to `/tournaments/123/stats`
  4. Clicks "Games" tab → returns to `/tournaments/123`
  5. Active tab updates correctly at each step

**Test: Nested Route Matching Edge Cases**
- Include in integration test above
- Additional scenarios:
  1. User on nested route `/tournaments/123/results/group/A` → "Tables" tab should be active (tests `startsWith()` logic)
  2. User on `/tournaments/123/stats/performance` → "Stats" tab should be active
  3. User on `/tournaments/123/friend-groups/456` → "Friend Groups" tab should be active
- Ensures active tab detection works for nested routes, not just top-level pages

**Test: Mobile Bottom Nav Flow**
- File: `__tests__/integration/tournament-layout-bottom-nav.test.tsx` (update existing)
- Scenario:
  1. User on mobile device
  2. Taps "Tables" in bottom nav → navigates to results page
  3. Taps "Games" → returns to tournament home
  4. Active tab updates correctly

#### Accessibility Tests

**Test: Keyboard Navigation**
- File: `__tests__/accessibility/tournament-tabs-a11y.test.tsx`
- Coverage:
  - ✅ Tab key navigates between tabs
  - ✅ Enter/Space activates tab
  - ✅ Focus visible indicators present
  - ✅ ARIA roles correct (tablist, tab, tabpanel)

**Test: Screen Reader**
- Manual testing with VoiceOver (macOS) / NVDA (Windows)
- Verify tab labels announced correctly
- Verify active tab state announced

### 8. Migration & Deployment Strategy

#### Phase 1: Create Desktop Tabs Component
1. Create `tournament-desktop-tabs.tsx`
2. Write unit tests for component
3. Verify component renders correctly in Storybook (optional)

#### Phase 2: Update Mobile Bottom Nav
1. Update `tournament-bottom-nav.tsx` with new labels/icons
2. Update existing unit tests
3. Verify no regressions in mobile navigation

#### Phase 3: Integrate into Layout
1. Import TournamentDesktopTabs in layout
2. Position after AppBar, before content
3. Test desktop/mobile breakpoint switching
4. Verify no layout shifts

#### Phase 4: Testing & Polish
1. Run all unit tests (aim for 80%+ coverage)
2. Run integration tests
3. Manual accessibility testing
4. Visual regression testing
5. Cross-browser testing (Chrome, Firefox, Safari, Edge)

#### Phase 5: Deploy to Vercel Preview
1. Push to feature branch
2. Vercel auto-deploys preview
3. User tests in preview environment:
   - Desktop: Test tab navigation
   - Mobile: Test updated bottom nav
   - Test all routes and active tab detection
   - Verify accessibility with keyboard/screen reader

### 9. Files to Create

**New Files:**
1. `app/components/tournament-page/tournament-desktop-tabs.tsx` - Desktop tabs component
2. `__tests__/components/tournament-page/tournament-desktop-tabs.test.tsx` - Unit tests
3. `__tests__/integration/tournament-desktop-tabs-navigation.test.tsx` - Integration test
4. `__tests__/accessibility/tournament-tabs-a11y.test.tsx` - Accessibility tests

**Files to Modify:**
1. `app/tournaments/[id]/layout.tsx` - Add TournamentDesktopTabs
2. `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx` - Update labels/icons
3. `__tests__/components/tournament-bottom-nav/tournament-bottom-nav.test.tsx` - Update tests
4. `__tests__/integration/tournament-layout-bottom-nav.test.tsx` - Update integration test

**Files NOT Modified:**
- ✅ Results page (`app/tournaments/[id]/results/page.tsx`) - Already implements Tables functionality
- ✅ Stats page - No changes needed
- ✅ Friend Groups page - No changes needed
- ✅ Tournament home page - No changes needed

## Implementation Steps

### Step 1: Create Desktop Tabs Component
**Task:** Implement TournamentDesktopTabs component with route-based active state detection.

**Blockers:** None

**Acceptance:**
- Component renders 4 tabs (Games, Tables, Stats, Friend Groups)
- Active tab determined by pathname
- Link navigation works
- Desktop-only display (md+ breakpoint)
- Sticky positioning

### Step 2: Write Tests for Desktop Tabs
**Task:** Create comprehensive unit tests for TournamentDesktopTabs.

**Blockers:** Step 1

**Acceptance:**
- Tests cover all tab labels and hrefs
- Tests verify active tab detection logic
- Tests verify responsive behavior (hidden on mobile)
- Tests verify accessibility attributes
- 80%+ coverage

### Step 3: Update Mobile Bottom Nav
**Task:** Update labels, icons, and imports in TournamentBottomNav.

**Blockers:** None

**Acceptance:**
- Labels updated: "Games", "Tables", "Groups"
- Icons updated: TableChart, People, BarChart
- Active tab detection still works
- No visual regressions

### Step 4: Update Bottom Nav Tests
**Task:** Update existing bottom nav tests with new labels/icons.

**Blockers:** Step 3

**Acceptance:**
- All tests pass with updated labels/icons
- No test coverage loss
- Integration tests still pass

### Step 5: Integrate Tabs into Layout
**Task:** Add TournamentDesktopTabs to layout, positioned after AppBar.

**Blockers:** Step 1, Step 3

**Acceptance:**
- Tabs render below header on desktop
- Mobile bottom nav still works
- No layout shifts on breakpoint changes
- Content area scrolls correctly

### Step 6: Integration Testing
**Task:** Create and run integration tests for tab navigation flow.

**Blockers:** Step 5

**Acceptance:**
- Desktop tab navigation test passes
- Mobile bottom nav test passes
- All routes navigate correctly
- Active states update correctly

### Step 7: Accessibility Testing
**Task:** Manual and automated accessibility testing.

**Blockers:** Step 6

**Acceptance:**
- Keyboard navigation works (Tab, Enter, Space)
- Focus indicators visible
- Screen reader announces tabs correctly
- ARIA attributes correct

### Step 8: Visual Polish & Cross-Browser Testing
**Task:** Final visual polish and test across browsers.

**Blockers:** Step 7

**Acceptance:**
- Tabs look consistent across Chrome, Firefox, Safari, Edge
- Hover/active states work correctly
- Transitions smooth
- No visual glitches

### Step 9: Deploy to Vercel Preview
**Task:** Push to feature branch, test in Vercel preview environment.

**Blockers:** Step 8

**Acceptance:**
- All validation checks pass (tests, lint, build)
- No database migrations
- Vercel preview deployed successfully
- User testing in preview environment complete

## Risk Assessment

### Low Risk
- ✅ **Reusing existing Results page** - No new page creation, just improved navigation
- ✅ **Material-UI Tabs component** - Well-documented, widely used
- ✅ **Existing patterns** - Following StatsTabs and ResultsPageClient patterns
- ✅ **No routing changes** - Routes stay the same, just better labels

### Medium Risk
- ⚠️ **Breakpoint switching** - Ensure no layout shift when switching mobile/desktop
  - Mitigation: Test thoroughly at md breakpoint (900px)
- ⚠️ **Z-index conflicts** - Tabs (1100) vs AppBar (1100) vs bottom nav (1300)
  - Mitigation: Adjust z-index if needed, test stacking order
- ⚠️ **Active tab detection** - Multiple routes map to same tabs
  - Mitigation: Use startsWith() for route matching, test all edge cases

### High Risk
- None identified

## Open Questions

### Q1: Should we consolidate routes to use query params?
**Context:** Story suggests `?tab=tables` instead of `/results` route.

**Options:**
1. Keep existing routes (`/results`, `/stats`, `/friend-groups`) ✅ **RECOMMENDED**
   - Pros: No breaking changes, SEO-friendly URLs, simpler implementation
   - Cons: Not using query params as story suggests
2. Migrate to query params (`?tab=tables`, `?tab=stats`)
   - Pros: Matches story description
   - Cons: Major routing refactor, breaking changes, more complex

**Decision:** Keep existing routes. Story description may be outdated, and current route structure is clean and SEO-friendly.

### Q2: Should desktop tabs support keyboard shortcuts?
**Context:** Power users may want Cmd+1, Cmd+2, etc. to switch tabs.

**Decision:** Defer to future enhancement. Focus on standard keyboard navigation (Tab, Enter) first.

### Q3: Should we add badge counts to desktop tabs?
**Context:** Mobile bottom nav has badge counts for unpredicted games on Games tab.

**Decision:** Not in this story. Games tab already shows badges via UnifiedGamesPage. Adding badges to desktop tabs would require passing badge counts as props, increasing complexity. Defer to future enhancement if user testing shows demand.

### Q4: Why no "Home" tab on desktop?
**Context:** Mobile has 5 tabs (Home, Games, Tables, Groups, Stats), but desktop has only 4 tabs (Games, Tables, Stats, Friend Groups).

**Rationale:**
- Desktop users have the "La Maquina" logo in the AppBar header (line 91-103 in layout.tsx) that links to home (`/`)
- Desktop users can also use browser navigation (back button, bookmarks) more easily than mobile
- Mobile users need the Home tab because:
  - No persistent header logo visible while scrolling
  - Harder to use browser navigation on mobile
  - Home tab provides quick escape from tournament context
- **Decision:** Keep desktop at 4 tabs (no Home tab). Logo in header serves as home navigation on desktop.

### Q5: Material-UI breakpoint boundary behavior
**Context:** Plan uses `md` breakpoint (900px) to switch between mobile/desktop navigation.

**Clarification:**
- Material-UI `md` breakpoint: `@media (min-width: 900px)` (inclusive)
- At exactly 900px → md (desktop tabs visible)
- At 899px → sm (mobile bottom nav visible)
- Tabs use `display: { xs: 'none', md: 'block' }` → hidden below 900px, visible at 900px and above
- Bottom nav uses `display: { xs: 'flex', md: 'none' }` → visible below 900px, hidden at 900px and above
- **Test at 899px and 900px to verify clean transition without both navigations showing simultaneously**

## Success Validation

### Before Merge
- [ ] All unit tests pass (80%+ coverage on new/modified code)
- [ ] All integration tests pass
- [ ] ESLint passes with 0 errors/warnings
- [ ] Build succeeds with 0 errors
- [ ] Manual accessibility testing complete (keyboard, screen reader)
- [ ] Visual regression testing shows no unintended changes
- [ ] Cross-browser testing complete (Chrome, Firefox, Safari, Edge)
- [ ] SonarCloud shows 0 new issues, 80%+ coverage on new code

### After Deploy to Vercel Preview
- [ ] User tests desktop tab navigation successfully
- [ ] User tests mobile bottom nav updates successfully
- [ ] No visual regressions reported by user
- [ ] Navigation feels intuitive and responsive
- [ ] User approves for merge

## Definition of Done

- [ ] Desktop tabs component created and tested
- [ ] Mobile bottom nav updated with new labels/icons
- [ ] Desktop tabs integrated into tournament layout
- [ ] All routes navigate correctly
- [ ] Active tab detection works for all scenarios
- [ ] Accessibility requirements met (keyboard, screen reader, ARIA)
- [ ] Unit tests written and passing (80%+ coverage)
- [ ] Integration tests written and passing
- [ ] Manual testing complete (desktop, mobile, accessibility)
- [ ] Code review approved
- [ ] SonarCloud quality gate passed (0 new issues, 80%+ coverage)
- [ ] Deployed to Vercel Preview and user-tested
- [ ] User approved for merge

---

## Summary

This story adds desktop tabbed navigation and improves mobile bottom nav labels/icons for better discoverability. The implementation is straightforward because:

1. **No new pages needed** - Reusing existing `/results`, `/stats`, `/friend-groups` pages
2. **Following existing patterns** - StatsTabs and ResultsPageClient provide clear examples
3. **Low risk** - No routing changes, just improved navigation UI
4. **High impact** - Users can quickly switch between tournament sections

The key deliverable is the new `TournamentDesktopTabs` component that provides horizontal tabs on desktop, while mobile bottom nav gets clearer labels and better icons for improved UX.

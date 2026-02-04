# Implementation Plan: [UXI-008] Mobile Bottom Navigation (#20)

## Story Context

**Issue:** #20 - [UXI-008] Mobile Bottom Navigation
**Dependencies:** UXI-025 (Tournament Groups Overview) ✅ Complete, UXI-026 (Tournament User Stats) ✅ Complete
**Priority:** 8/10 (High Impact, High Effort)
**Estimated Effort:** 3-4 days

### Problem Statement
Current top-heavy navigation within tournaments is hard to reach with thumb on mobile devices. Users must use back button or header links to navigate between tournament sections, resulting in poor one-handed usability and low feature discoverability.

### Success Metrics
- Navigation taps within tournaments: -40%
- One-handed usability: +60%
- Feature discoverability: +35%
- Tournament engagement: +25%

## Acceptance Criteria

1. ✅ Bottom navigation appears ONLY when inside tournament context (`/tournaments/[id]/*`)
2. ✅ Bottom navigation displays 4 tabs with icons and labels:
   - 🏠 **Home**: Exit to main app home (`/`)
   - 🏆 **Tournament**: Tournament home (`/tournaments/[id]`)
   - 👥 **Friend Groups**: User's prode groups overview (`/tournaments/[id]/friend-groups`)
   - 👤 **Stats**: Tournament user stats (`/tournaments/[id]/stats`)
3. ✅ Active tab is highlighted based on current route
4. ✅ Smooth transitions between tabs using Next.js navigation
5. ✅ Shows ONLY on mobile screens (<900px, breakpoint: `md`)
6. ✅ Hides on desktop screens (≥900px)
7. ✅ No bottom navigation on main home page (`/`)
8. ✅ Works with existing footer (56px height already accounted for in layout)

## Visual Prototypes

### Mobile Bottom Navigation Layout

```
┌─────────────────────────────────────────┐
│ 🏆  GRUPO A  GRUPO B  PLAYOFFS  PREMIOS │  ← GroupSelector Tabs
├─────────────────────────────────────────┤   (Always visible - needed
│                                         │    for tournament structure
│        TOURNAMENT CONTENT               │    navigation)
│        (Groups, Stats, etc.)            │
│                                         │
│                                         │
│                                         │
└─────────────────────────────────────────┘
│  🏠      🏆       👥          👤       │  ← 56px height
│ Home  Tournament  Friend    Stats      │  ← Bottom Navigation
│                   Groups               │    (Mobile only)
│ (active tab highlighted with primary)   │
└─────────────────────────────────────────┘
```

### Component Structure

```typescript
<BottomNavigation>
  <BottomNavigationAction
    label="Home"
    icon={<HomeIcon />}
    value="main-home"
  />
  <BottomNavigationAction
    label="Tournament"
    icon={<EmojiEventsIcon />}
    value="tournament-home"
  />
  <BottomNavigationAction
    label="Friend Groups"
    icon={<GroupsIcon />}
    value="friend-groups"
  />
  <BottomNavigationAction
    label="Stats"
    icon={<PersonIcon />}
    value="stats"
  />
</BottomNavigation>
```

### Desktop Behavior
```
Desktop (≥900px):
- Bottom navigation: HIDDEN
- GroupSelector tabs: SHOWN (tournament structure navigation)
- Footer: Standard footer content

Mobile (<900px):
- Bottom navigation: SHOWN (main tournament navigation)
- GroupSelector tabs: SHOWN (tournament structure navigation)
- Both navigation systems coexist on mobile
- Footer: Replaced by bottom navigation
```

### Navigation System Architecture

**Two distinct navigation layers on mobile:**

1. **GroupSelector Tabs (Horizontal, at top):**
   - **Purpose:** Tournament structure navigation
   - **Items:** Trophy icon (home), GRUPO A, GRUPO B, ..., PLAYOFFS, PREMIOS
   - **Routes:**
     - `/tournaments/[id]` (trophy icon)
     - `/tournaments/[id]/groups/[group_id]` (game groups)
     - `/tournaments/[id]/playoffs`
     - `/tournaments/[id]/awards`
   - **Must remain visible:** Provides access to tournament structure
   - **Scrollable:** Horizontal scroll for many groups

2. **Bottom Navigation (Fixed, at bottom):**
   - **Purpose:** Main tournament section navigation
   - **Items:** Home, Tournament, Friend Groups, Stats
   - **Routes:**
     - `/` (main app home)
     - `/tournaments/[id]` (tournament home)
     - `/tournaments/[id]/groups` (user's prode/friend groups overview)
     - `/tournaments/[id]/stats` (user statistics)
   - **Mobile only:** Hidden on desktop (≥900px)
   - **Fixed position:** Always visible at bottom

**Key distinction:**
- **"Friend Groups"** (bottom nav) = Social/competition groups (`/tournaments/[id]/friend-groups`)
- **"Tournament Groups"** (GroupSelector) = Game structure groups (`/tournaments/[id]/groups/[group_id]`)

**URL Change:** This story includes renaming the route from `/tournaments/[id]/groups` to `/tournaments/[id]/friend-groups` for clarity.
```

### State Variations

**Active State:**
- Current page tab highlighted with primary color
- Icon and label use theme primary color
- Other tabs use default/muted color

**Navigation Behavior:**
- Tap "Home" → Navigate to `/` (main app home)
- Tap "Tournament" → Navigate to `/tournaments/[id]` (tournament home)
- Tap "Friend Groups" → Navigate to `/tournaments/[id]/friend-groups` (user's prode groups)
- Tap "Stats" → Navigate to `/tournaments/[id]/stats`

**Route Detection Logic:**
```typescript
// Determine active tab based on pathname
// Using startsWith() to avoid false positives with future routes
if (pathname === '/') {
  activeTab = 'main-home';
} else if (pathname === `/tournaments/${tournamentId}`) {
  activeTab = 'tournament-home';
} else if (pathname === `/tournaments/${tournamentId}/friend-groups`) {
  // Exact match for friend groups overview
  activeTab = 'friend-groups';
} else if (pathname.startsWith(`/tournaments/${tournamentId}/stats`)) {
  activeTab = 'stats';
} else {
  activeTab = 'tournament-home'; // fallback
}
```

### Responsive Design

**Mobile (<900px / sm breakpoint):**
- Bottom navigation: `display: flex`
- Position: `fixed` at bottom
- Height: 56px (matches current footer)
- Z-index: 1300 (same as current footer)
- Background: Theme-aware (dark/light mode)

**Desktop (≥900px / sm breakpoint):**
- Bottom navigation: `display: none`
- Current navigation patterns remain unchanged

## Technical Approach

### 1. Context Detection Strategy

**Route Pattern Matching:**
- Use `usePathname()` from Next.js navigation
- Check if pathname starts with `/tournaments/[id]`
- Extract tournament ID from pathname: `/tournaments/(\d+)/`
- Show bottom nav only when tournament ID is present in URL

**Implementation:**
```typescript
const pathname = usePathname();
const tournamentMatch = pathname.match(/^\/tournaments\/(\d+)/);
const isInTournamentContext = !!tournamentMatch;
const tournamentId = tournamentMatch?.[1];
```

### 2. Component Architecture

**New Component: `TournamentBottomNav`**
- Location: `/app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`
- Client component (`'use client'`)
- Uses MUI `BottomNavigation` and `BottomNavigationAction`
- Props:
  - `tournamentId: string` - Current tournament ID
  - `currentPath: string` - Current pathname for active state
- Responsibilities:
  - Render 4 navigation tabs
  - Detect active tab based on route
  - Handle navigation on tab change
  - Apply theme-aware styling

**Integration Point:**
- Modify `/app/tournaments/[id]/layout.tsx` to conditionally render `TournamentBottomNav`
- Use `useMediaQuery(theme.breakpoints.down('md'))` to detect mobile
- Render bottom nav only when `isMobile && isInTournamentContext`

### 3. Styling and Theme Integration

**Material-UI Styling:**
- Use MUI `sx` prop for responsive styling
- Leverage theme colors: `theme.palette.primary.main`, `theme.palette.background.paper`
- Match existing footer styling (dark background in dark mode, light in light mode)

**CSS Considerations:**
- Position: `fixed`
- Bottom: `0`
- Width: `100%`
- Height: `56px`
- Z-index: `1300` (same as current footer)
- Background: Use theme background color
- Border-top: Subtle border for separation

**Responsive Logic:**
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

### 4. Navigation Handling

**Using Next.js Router:**
- Import `useRouter()` from `next/navigation`
- On tab change, call `router.push(targetPath)`
- Handle special "Back" action:
  - Push to `/` (main home)
  - Alternative: Use `router.back()` (but may not always go to main home)

**Navigation Targets:**
- Home: `/` (main app home)
- Tournament: `/tournaments/${tournamentId}` (tournament home)
- Friend Groups: `/tournaments/${tournamentId}/friend-groups` (user's prode groups overview)
- Stats: `/tournaments/${tournamentId}/stats`

**Active Tab Detection:**
```typescript
const getActiveTab = (pathname: string, tournamentId: string): string => {
  if (pathname === '/') return 'main-home';
  if (pathname === `/tournaments/${tournamentId}`) return 'tournament-home';
  // EXACT match for friend groups overview
  if (pathname === `/tournaments/${tournamentId}/friend-groups`) return 'friend-groups';
  if (pathname.startsWith(`/tournaments/${tournamentId}/stats`)) return 'stats';
  return 'tournament-home';
};
```

**Important:** The "Friend Groups" tab should ONLY be active on the exact route `/tournaments/[id]/friend-groups` (overview page). Game groups remain at `/tournaments/[id]/groups/[group_id]` and are handled by GroupSelector tabs.

### 5. Footer Integration

**Current Footer Component:**
- Location: `/app/components/home/footer.tsx`
- Fixed AppBar at bottom (56px height)
- Currently shows teasing messages

**Integration Strategy:**

**Option A (Recommended): Conditional Footer**
- Keep footer component as-is for desktop
- Hide footer on mobile when in tournament context
- Bottom navigation replaces footer on mobile within tournaments
- Implementation:
  ```typescript
  // In footer.tsx
  const isInTournamentContext = pathname.startsWith('/tournaments/');
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const shouldHideFooter = isMobile && isInTournamentContext;

  if (shouldHideFooter) return null;
  ```

**Option B: Shared Container**
- Create a wrapper component that conditionally renders footer OR bottom nav
- More complex, but keeps all bottom UI in one place

**Decision:** Use Option A for simplicity and clear separation of concerns.

### 6. Layout Adjustments

**Current Layout:**
- `/app/layout.tsx` has `paddingBottom: 64px` for fixed footer
- This is already sufficient for 56px bottom navigation

**No changes needed** to main layout padding since bottom nav height (56px) is smaller than current padding (64px).

**Tournament Layout:**
- `/app/tournaments/[id]/layout.tsx` - Add bottom nav rendering logic
- Add mobile detection
- Conditionally render `TournamentBottomNav`

## Files to Create/Modify

### Files to Create

1. **`/app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`** (NEW)
   - Main component for mobile bottom navigation
   - Uses MUI BottomNavigation
   - Handles route detection and navigation
   - Responsive styling with theme integration

### Files to Move/Rename

1. **`/app/tournaments/[id]/groups/page.tsx`** → **`/app/tournaments/[id]/friend-groups/page.tsx`** (MOVE)
   - Rename directory from `groups/` to `friend-groups/`
   - Move the page file to new location
   - Update any relative imports if needed

### Files to Modify

1. **`/app/tournaments/[id]/layout.tsx`** (MODIFY)
   - Import and render `TournamentBottomNav` on mobile
   - Add mobile detection with `useMediaQuery`
   - Pass tournament ID and current path to bottom nav
   - Conditional rendering based on screen size

2. **`/app/components/home/footer.tsx`** (MODIFY)
   - Add logic to hide footer on mobile when in tournament context
   - Use `usePathname()` and `useMediaQuery()` for detection
   - Return `null` when bottom nav should take over

3. **`next.config.js` or create `/app/tournaments/[id]/groups/page.tsx` as redirect** (MODIFY/CREATE)
   - Add redirect from old URL (`/tournaments/[id]/groups`) to new URL (`/tournaments/[id]/friend-groups`)
   - Preserve backward compatibility for bookmarks/links

4. **Search and update all links** (MODIFY MULTIPLE)
   - Find all instances of `href="/tournaments/${id}/groups"` or `href={`/tournaments/${tournamentId}/groups`}`
   - Update to `href="/tournaments/${id}/friend-groups"` or `href={`/tournaments/${tournamentId}/friend-groups`}`
   - Common locations:
     - Navigation components
     - Button/link components
     - Server actions that return redirect URLs
     - Test files

### Files to Reference (Read-Only)

1. **`/app/components/groups-page/group-selector.tsx`**
   - Reference for route detection patterns
   - Reference for usePathname() usage

2. **`/app/layout.tsx`**
   - Verify existing padding-bottom handling

## Implementation Steps

### Step 0: Rename Friend Groups Route

**Goal:** Rename `/tournaments/[id]/groups` to `/tournaments/[id]/friend-groups` for clarity.

**Steps:**

1. **Move the page file:**
   ```bash
   # In worktree root
   mkdir -p app/tournaments/[id]/friend-groups
   mv app/tournaments/[id]/groups/page.tsx app/tournaments/[id]/friend-groups/page.tsx
   rmdir app/tournaments/[id]/groups
   ```

2. **Search for all references to the old URL:**
   ```bash
   # Use grep to find all occurrences
   grep -r "tournaments/.*}/groups" app/
   grep -r 'tournaments/${.*}/groups' app/
   grep -r "tournaments/['\"\`].*['\"\`]/groups" app/
   ```

3. **Update all found references:**
   - Change `/tournaments/${id}/groups` → `/tournaments/${id}/friend-groups`
   - Change `/tournaments/${tournamentId}/groups` → `/tournaments/${tournamentId}/friend-groups`
   - Common files to check:
     - Navigation components
     - Link components
     - Server actions with redirects
     - Test files

4. **Add redirect for backward compatibility:**

   **Option A: Using Next.js middleware** (recommended):
   Create or update `middleware.ts`:
   ```typescript
   import { NextResponse } from 'next/server';
   import type { NextRequest } from 'next/server';

   export function middleware(request: NextRequest) {
     const { pathname } = request.nextUrl;

     // Redirect old friend groups URL to new URL
     const groupsMatch = pathname.match(/^\/tournaments\/(\d+)\/groups$/);
     if (groupsMatch) {
       const tournamentId = groupsMatch[1];
       return NextResponse.redirect(
         new URL(`/tournaments/${tournamentId}/friend-groups`, request.url)
       );
     }

     return NextResponse.next();
   }
   ```

   **Option B: Using next.config.js redirects**:
   ```javascript
   // In next.config.js
   async redirects() {
     return [
       {
         source: '/tournaments/:id/groups',
         destination: '/tournaments/:id/friend-groups',
         permanent: true, // 301 redirect
       },
     ];
   }
   ```

5. **Update tests:**
   - Update any test files that reference `/tournaments/[id]/groups`
   - Update mock data with new URLs
   - Update navigation test assertions

6. **Verify changes:**
   ```bash
   # Ensure no remaining references to old URL (except redirects)
   grep -r "tournaments/.*}/groups\"" app/
   grep -r 'tournaments/${.*}/groups"' app/
   ```

### Step 1: Create TournamentBottomNav Component

**File:** `/app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`

**Implementation:**
1. Create client component with `'use client'` directive
2. Import required MUI components:
   - `BottomNavigation` from `@mui/material/BottomNavigation`
   - `BottomNavigationAction` from `@mui/material/BottomNavigationAction`
3. Import icons:
   - `HomeIcon` from `@mui/icons-material/Home`
   - `EmojiEventsIcon` from `@mui/icons-material/EmojiEvents` (Trophy icon)
   - `GroupsIcon` from `@mui/icons-material/Groups`
   - `PersonIcon` from `@mui/icons-material/Person`
4. Import Next.js hooks: `useRouter` from `next/navigation`
5. Define props interface:
   ```typescript
   interface TournamentBottomNavProps {
     tournamentId: string;
     currentPath: string;
   }
   ```
6. Implement active tab detection logic
7. Implement navigation handler
8. Render BottomNavigation with 4 actions
9. Apply responsive styling and theming

**Pseudocode:**
```typescript
'use client';

import { BottomNavigation, BottomNavigationAction } from '@mui/material';
import { Home, EmojiEvents, Groups, Person } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Props {
  tournamentId: string;
  currentPath: string;
}

export default function TournamentBottomNav({ tournamentId, currentPath }: Props) {
  const router = useRouter();
  const [value, setValue] = useState<string>('tournament-home');

  // Determine active tab based on currentPath
  useEffect(() => {
    if (currentPath === '/') {
      setValue('main-home');
    } else if (currentPath === `/tournaments/${tournamentId}`) {
      setValue('tournament-home');
    } else if (currentPath === `/tournaments/${tournamentId}/friend-groups`) {
      // EXACT match for friend groups overview
      setValue('friend-groups');
    } else if (currentPath.startsWith(`/tournaments/${tournamentId}/stats`)) {
      setValue('stats');
    }
    // Note: Individual game groups (/tournaments/[id]/groups/[group_id]) don't activate any bottom nav tab
  }, [currentPath, tournamentId]);

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);

    // Navigate based on selected tab
    switch (newValue) {
      case 'main-home':
        router.push('/');
        break;
      case 'tournament-home':
        router.push(`/tournaments/${tournamentId}`);
        break;
      case 'friend-groups':
        router.push(`/tournaments/${tournamentId}/friend-groups`);
        break;
      case 'stats':
        router.push(`/tournaments/${tournamentId}/stats`);
        break;
    }
  };

  return (
    <BottomNavigation
      value={value}
      onChange={handleChange}
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
    >
      <BottomNavigationAction label="Home" value="main-home" icon={<Home />} />
      <BottomNavigationAction label="Tournament" value="tournament-home" icon={<EmojiEvents />} />
      <BottomNavigationAction label="Friend Groups" value="friend-groups" icon={<Groups />} />
      <BottomNavigationAction label="Stats" value="stats" icon={<Person />} />
    </BottomNavigation>
  );
}
```

### Step 2: Integrate into Tournament Layout

**File:** `/app/tournaments/[id]/layout.tsx`

**Modifications:**
1. Import `TournamentBottomNav`
2. Import `usePathname` from `next/navigation`
3. Import `useMediaQuery` and `useTheme` from `@mui/material`
4. Add client component directive if not already present (`'use client'`)
5. Detect mobile with `useMediaQuery(theme.breakpoints.down('md'))`
6. Get current pathname with `usePathname()`
7. Extract tournament ID from params
8. Conditionally render `TournamentBottomNav` when `isMobile`

**Pseudocode:**
```typescript
'use client';

import TournamentBottomNav from '@/app/components/tournament-bottom-nav/tournament-bottom-nav';
import { usePathname } from 'next/navigation';
import { useMediaQuery, useTheme } from '@mui/material';

export default function TournamentLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const tournamentId = params.id;

  return (
    <>
      {/* Existing layout content */}
      {children}

      {/* Bottom navigation - only on mobile */}
      {isMobile && (
        <TournamentBottomNav
          tournamentId={tournamentId}
          currentPath={pathname}
        />
      )}
    </>
  );
}
```

### Step 3: Update Footer Component

**File:** `/app/components/home/footer.tsx`

**Modifications:**
1. Add `'use client'` directive if not present
2. Import `usePathname` from `next/navigation`
3. Import `useMediaQuery` and `useTheme` from `@mui/material`
4. Add logic to hide footer on mobile when in tournament context
5. Early return `null` when bottom nav should take over

**Pseudocode:**
```typescript
'use client';

import { usePathname } from 'next/navigation';
import { useMediaQuery, useTheme } from '@mui/material';

export default function Footer() {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Hide footer on mobile when inside tournament context
  const isInTournamentContext = pathname.startsWith('/tournaments/');
  if (isMobile && isInTournamentContext) {
    return null;
  }

  // Existing footer rendering
  return (
    <AppBar position="fixed" sx={{ ... }}>
      {/* Existing footer content */}
    </AppBar>
  );
}
```

### Step 4: Testing and Refinement

1. **Manual Testing:**
   - Test on mobile viewport (<900px)
   - Verify bottom nav appears in tournament context
   - Test all 4 navigation actions
   - Verify active tab highlights correctly
   - Test navigation behavior
   - Verify bottom nav hidden on desktop
   - Test footer behavior on main home page

2. **Route Testing:**
   - Navigate to `/tournaments/1` → Bottom nav shows, "Tournament" active
   - Navigate to `/tournaments/1/friend-groups` → "Friend Groups" active
   - Navigate to `/tournaments/1/groups/abc123` → No tab active (GroupSelector handles this)
   - Navigate to `/tournaments/1/stats` → "Stats" active
   - Tap "Home" → Navigate to `/`
   - Navigate to `/` → No bottom nav (outside tournament context)
   - **Redirect test:** Navigate to old URL `/tournaments/1/groups` → Redirects to `/tournaments/1/friend-groups`

3. **Responsive Testing:**
   - Resize browser from desktop to mobile
   - Verify bottom nav appears/disappears at breakpoint
   - Test in Chrome DevTools mobile emulation
   - Test on actual mobile device

4. **Theme Testing:**
   - Test in light mode
   - Test in dark mode
   - Verify colors match theme

5. **Navigation Density Assessment:**
   - Measure total chrome height on mobile (headers + bottom nav)
   - Document available content space
   - Take screenshots of navigation layers
   - Gather user feedback on usability
   - Document findings for follow-up story

### Step 5: Create Follow-Up Story

**Create new GitHub issue for header optimization:**

**Title:** `[UXI-XXX] Mobile Header Optimization for Tournament Context`

**Description:**
```markdown
## Problem
After implementing mobile bottom navigation (UXI-008), mobile screens have significant navigation chrome:
- Global header (~70px): Logo, title, theme switcher, user settings
- Tournament header (~90px): Tournament name + GroupSelector tabs
- Bottom navigation (56px): Home, Tournament, Friend Groups, Stats
- **Total chrome:** ~216px on typical mobile screen (360px height = 60% content, 40% navigation)

## Solution Options to Explore

### Option A: Hide Global Header on Mobile in Tournaments
- Hide logo, "La Maquina Prode" title on mobile within tournament context
- Keep theme switcher and user settings accessible via:
  - Add to bottom navigation as 5th tab
  - Add as overlay/drawer triggered by bottom nav button
  - Add to tournament header

### Option B: Collapsible Headers
- Auto-hide headers on scroll (show on scroll up)
- Collapse tournament name to icon/badge
- Merge global and tournament headers on mobile

### Option C: Compact Tournament Header
- Reduce tournament header height
- Move GroupSelector tabs below tournament name (vertical stack)
- Use smaller font sizes and tighter spacing

## Dependencies
- UXI-008 (Mobile Bottom Navigation) - MUST be complete

## Acceptance Criteria
- Increase content area by 20-30% on mobile in tournaments
- Maintain access to user settings and theme switcher
- Maintain access to all GroupSelector tabs
- No loss of functionality
- Improved one-handed usability

## Testing Requirements
- Test on multiple screen sizes (320px - 767px width)
- A/B test different approaches with users
- Measure content area improvement
- Verify all functionality remains accessible
```

**Labels:** `type/ux-improvement`, `priority/medium`, `mobile`

**Milestone:** Assign to appropriate sprint

**Link to UXI-008:** Add comment: "Follow-up to #20 (UXI-008 Mobile Bottom Navigation)"

## Testing Strategy

### Unit Tests (80% coverage target)

**File:** `/app/components/tournament-bottom-nav/tournament-bottom-nav.test.tsx`

**Test Cases:**
1. **Rendering Tests:**
   - ✅ Renders 4 navigation actions with correct labels (Home, Tournament, Friend Groups, Stats)
   - ✅ Renders correct icons (Home, EmojiEvents, Groups, Person)
   - ✅ Applies responsive styling (hidden on desktop)
   - ✅ Shows on mobile screens

2. **Active Tab Detection:**
   - ✅ Sets "main-home" as active when currentPath is `/`
   - ✅ Sets "tournament-home" as active when currentPath is `/tournaments/1`
   - ✅ Sets "friend-groups" as active when currentPath is EXACTLY `/tournaments/1/friend-groups`
   - ✅ Does NOT set "friend-groups" as active when on `/tournaments/1/groups/abc123` (individual game group)
   - ✅ Sets "stats" as active when currentPath starts with `/tournaments/1/stats`
   - ✅ Defaults to "tournament-home" for unknown tournament paths

3. **Navigation Behavior:**
   - ✅ Clicking "Home" navigates to `/`
   - ✅ Clicking "Tournament" navigates to `/tournaments/${tournamentId}`
   - ✅ Clicking "Friend Groups" navigates to `/tournaments/${tournamentId}/friend-groups`
   - ✅ Clicking "Stats" navigates to `/tournaments/${tournamentId}/stats`
   - ✅ Mock `useRouter().push()` to verify navigation calls

4. **Route Specificity Tests:**
   - ✅ Friend Groups tab active on `/tournaments/1/friend-groups` (exact match)
   - ✅ Friend Groups tab NOT active on `/tournaments/1/groups/abc123` (game group)
   - ✅ This ensures GroupSelector tabs remain primary navigation for game groups

5. **Redirect Tests:**
   - ✅ Old URL `/tournaments/1/groups` redirects to `/tournaments/1/friend-groups`
   - ✅ Redirect preserves query parameters if present
   - ✅ Redirect uses 301 (permanent) status code

4. **Theme Integration:**
   - ✅ Uses theme colors for active/inactive states
   - ✅ Uses theme border colors
   - ✅ Renders correctly in light and dark mode

**Test Utilities:**
- Use `@testing-library/react` for component rendering
- Use `renderWithTheme()` from test utilities for theme context
- Mock `useRouter()` from Next.js with `@/__tests__/mocks/next-navigation.mocks`
- Mock `useMediaQuery()` for responsive testing

**Example Test Structure:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { mockUseRouter } from '@/__tests__/mocks/next-navigation.mocks';
import TournamentBottomNav from './tournament-bottom-nav';

describe('TournamentBottomNav', () => {
  const defaultProps = {
    tournamentId: '1',
    currentPath: '/tournaments/1',
  };

  it('renders 4 navigation actions', () => {
    renderWithTheme(<TournamentBottomNav {...defaultProps} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Tournament')).toBeInTheDocument();
    expect(screen.getByText('Friend Groups')).toBeInTheDocument();
    expect(screen.getByText('Stats')).toBeInTheDocument();
  });

  it('navigates to main home when Home is clicked', () => {
    const mockPush = vi.fn();
    mockUseRouter({ push: mockPush });

    renderWithTheme(<TournamentBottomNav {...defaultProps} />);
    fireEvent.click(screen.getByText('Home'));

    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('navigates to friend groups when Friend Groups is clicked', () => {
    const mockPush = vi.fn();
    mockUseRouter({ push: mockPush });

    renderWithTheme(<TournamentBottomNav {...defaultProps} />);
    fireEvent.click(screen.getByText('Friend Groups'));

    expect(mockPush).toHaveBeenCalledWith('/tournaments/1/friend-groups');
  });

  // ... more tests
});
```

### Integration Tests

**File:** `/app/tournaments/[id]/layout.test.tsx`

**Test Cases:**
1. ✅ Renders TournamentBottomNav on mobile within tournament context
2. ✅ Hides TournamentBottomNav on desktop
3. ✅ Passes correct tournamentId and currentPath props

**File:** `/app/components/home/footer.test.tsx`

**Test Cases:**
1. ✅ Footer renders on main home page (mobile and desktop)
2. ✅ Footer hidden on mobile when in tournament context
3. ✅ Footer shows on desktop when in tournament context

### E2E Tests (Manual)

1. **Mobile Navigation Flow:**
   - Open app on mobile device
   - Navigate to a tournament
   - Verify bottom nav appears
   - Tap each nav item and verify correct page loads
   - Tap "Home" and verify navigation to main app home (`/`)
   - Verify active tab highlights correctly

2. **Responsive Behavior:**
   - Start on desktop (no bottom nav)
   - Resize to mobile (bottom nav appears)
   - Resize back to desktop (bottom nav disappears)

3. **Theme Switching:**
   - Test bottom nav in light mode
   - Switch to dark mode
   - Verify colors adapt correctly

## Validation Considerations

### SonarCloud Quality Gates

**Coverage Requirements:**
- Target: ≥80% coverage on new code
- Focus areas:
  - `tournament-bottom-nav.tsx` component logic
  - Active tab detection function
  - Navigation handler
  - Theme integration

**Code Quality:**
- No new code smells
- No new bugs or vulnerabilities
- Maintainability rating: B or higher
- Security rating: A

**Specific Checks:**
- Avoid duplicate code (DRY principle)
- No complex functions (cognitive complexity <15)
- No unused imports or variables
- Type safety (strict TypeScript)

### Performance Considerations

**Bundle Size:**
- MUI BottomNavigation components are tree-shakeable
- Import only needed icons
- Estimated impact: +5-10KB gzipped

**Runtime Performance:**
- useEffect runs only when pathname or tournamentId changes
- No expensive computations
- Navigation uses Next.js client-side routing (fast)

**Mobile Performance:**
- Fixed positioning may cause reflows on scroll
- Consider `will-change: transform` if scroll jank occurs
- Test on low-end devices

### Pre-Implementation Verification

**Before starting implementation, verify:**
1. ✅ Test utilities exist:
   - `@/__tests__/utils/test-utils.tsx` (CONFIRMED: exists)
   - `@/__tests__/mocks/next-navigation.mocks.ts` (CONFIRMED: exists)
2. ✅ Layout padding sufficient:
   - `/app/layout.tsx` has `paddingBottom: 64px` (CONFIRMED: line 50)
   - Sufficient for 56px bottom nav height
3. ✅ Navigation button labels: RESOLVED (Home, Tournament, Groups, Stats)
4. ✅ Breakpoint consistency: Using `md` (900px) throughout plan
5. ✅ Icon choices: RESOLVED (Home, EmojiEvents/Trophy, Groups, Person)
6. ✅ GroupSelector visibility: RESOLVED (must remain visible on mobile for tournament structure access)
7. ✅ Routing specificity: Use EXACT match for friend groups (`===`), not startsWith, to avoid conflicts with game groups

## Open Questions

1. **GroupSelector Tabs on Mobile:** ✅ **RESOLVED**
   - GroupSelector MUST remain visible on mobile
   - **Reason:** Provides access to tournament structure (GRUPO A/B/C, Playoffs, Awards)
   - **Decision:** Both navigation systems coexist on mobile
     - GroupSelector: Tournament structure navigation (top)
     - Bottom Nav: Main section navigation (bottom)
   - No overlap in functionality - they serve different purposes

2. **Navigation Button Labels:** ✅ **RESOLVED**
   - Original story used "Back" to exit to main home, which was semantically confusing
   - **Decision:** Rename first button from "Back" to "Home" (navigates to `/`)
   - **Updated structure:**
     - Home (🏠): Exit to main app home (`/`)
     - Tournament (🏆): Tournament home page (`/tournaments/[id]`)
     - Groups (👥): Tournament groups (`/tournaments/[id]/groups`)
     - Stats (👤): User stats (`/tournaments/[id]/stats`)
   - This makes the navigation semantics clearer and matches user expectations

3. **Animation/Transition:** ⚠️ **DEFERRED**
   - Should bottom nav slide in/out on route changes?
   - Should it hide on scroll for more screen space (as mentioned in story)?
   - **Decision:** Start with static bottom nav (always visible on mobile)
   - **Rationale:** Simpler implementation, test usability first
   - **Future enhancement:** Add scroll-hide behavior if user testing shows need for more screen space

4. **Badge Counts (Future):**
   - Story mentions "Consider showing notification badges (future)"
   - **Recommendation:** Skip badges for now, add in future story

5. **Icon Selection:** ✅ **RESOLVED**
   - Updated icon choices based on user feedback:
     - Home: HomeIcon 🏠 (main app home)
     - Tournament: EmojiEventsIcon 🏆 (tournament home - trophy icon)
     - Groups: GroupsIcon 👥 (tournament groups)
     - Stats: PersonIcon 👤 (user stats)
   - These icons clearly distinguish between main app home and tournament home

## Dependencies

- ✅ **UXI-025** (Tournament Groups Overview Page) - Complete (#83)
  - Route: `/tournaments/[id]/groups`
  - Page exists at `/app/tournaments/[id]/groups/page.tsx`

- ✅ **UXI-026** (Tournament User Stats Page) - Complete (#84)
  - Route: `/tournaments/[id]/stats`
  - Page exists at `/app/tournaments/[id]/stats/page.tsx`

Both dependencies are satisfied. All required routes exist and are functional.

## Navigation Density Concern & Follow-Up Story

**Issue Identified:** Mobile navigation will have significant chrome:
1. Global header (logo, title, theme, user settings) - sticky
2. Tournament header (name + GroupSelector tabs) - sticky
3. Bottom navigation (new) - fixed
4. Content area - squeezed between headers and bottom nav

**Decision:** Implement bottom navigation in this story, defer header optimization to follow-up story.

**Rationale:**
- Allows testing bottom nav functionality independently
- Header optimization is a separate UX concern
- Iterative approach reduces risk

**Follow-Up Story Requirements:**

Create new UXI story: **"Mobile Header Optimization for Tournament Context"**

**Scope:**
- Investigate hiding/collapsing global header on mobile within tournaments
- Explore moving user settings (theme, avatar menu) to alternate location
- Consider merging tournament name into condensed header
- Test content space vs navigation trade-offs
- Maintain access to essential functions (settings, theme, logout)

**Acceptance Criteria for THIS Story:**
- ✅ Bottom navigation implemented and functional
- ✅ Documentation added about navigation density concern
- ✅ Follow-up UXI story created in backlog with detailed requirements
- ✅ Follow-up story linked to this story for context

**Documentation to Include:**
- Visual diagram showing all navigation layers on mobile
- Measurements of vertical space consumed by navigation
- User testing feedback on navigation density
- Recommendations for follow-up optimization

## Risk Assessment

**Low Risk:**
- Using proven MUI component (BottomNavigation)
- Simple route detection logic (already used in GroupSelector)
- Next.js navigation is stable
- No database or server-side changes

**Medium Risk:**
- Responsive behavior interaction with existing components
- Footer replacement on mobile may affect other features
- Need to test across devices and browsers
- **Navigation density** - Multiple sticky/fixed elements reduce content space

**High Risk (Deferred to Follow-Up):**
- Header optimization requires careful UX consideration
- Moving user settings requires additional design work
- Global header changes affect entire app, not just tournaments

**Mitigation:**
- Thorough testing on multiple devices
- Incremental rollout (test on staging first)
- Keep footer as fallback (conditional rendering)
- Create follow-up story before completing this one
- Document navigation density issue for future optimization

## Timeline Estimate

- **Day 1:** Create TournamentBottomNav component + unit tests (4-6 hours)
- **Day 2:** Integrate into tournament layout + footer updates (3-4 hours)
- **Day 3:** Testing, refinement, and documentation (4-6 hours)
- **Day 4:** Code review feedback, final adjustments (2-3 hours)

**Total:** 3-4 days (matches story estimate)

## Success Criteria

### Functional Requirements
- ✅ Bottom navigation appears only in tournament context on mobile
- ✅ All 4 tabs navigate correctly (Home, Tournament, Friend Groups, Stats)
- ✅ Active tab highlights based on current route
- ✅ Footer hidden on mobile within tournaments
- ✅ Desktop navigation unchanged
- ✅ GroupSelector tabs remain visible and functional on mobile

### Quality Requirements
- ✅ 80% test coverage on new code
- ✅ 0 new SonarCloud issues
- ✅ Passes all quality gates
- ✅ User approval after Vercel Preview testing

### Documentation Requirements
- ✅ Navigation density concern documented in plan
- ✅ Visual diagrams of navigation layers included
- ✅ Follow-up story created for header optimization
- ✅ Follow-up story linked to this story

### Post-Implementation
- ✅ Screenshots of mobile navigation with all layers
- ✅ Measurements of content area vs navigation chrome
- ✅ User feedback collected on navigation density
- ✅ Recommendations documented for follow-up story

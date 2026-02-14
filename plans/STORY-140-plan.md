# Implementation Plan: Story #140 - Consistent Navigation: Persistent Sidebar & Unified Bottom Nav

## Story Context and Objectives

**Problem:** Inconsistent navigation across tournament pages creates poor UX:
- **Desktop**: Sidebar (Rules, Stats, Tables, Friend Groups) only visible on home page - users must return to home to access these sections from other pages
- **Mobile**: "Tournament" tab in bottom nav is redundant with "PARTIDOS" in top nav, and Rules page has no mobile access point

**Goal:** Provide consistent access to all tournament sections from any page:
- **Desktop (≥900px)**: Make sidebar persistent across ALL tournament pages
- **Mobile (<900px)**: Update bottom nav to remove redundancy and add Rules access

**Success Metrics:**
- 100% feature accessibility on desktop (all sections accessible from any page)
- 100% feature accessibility on mobile (Rules now accessible)
- 0 redundant navigation elements
- Consistent layout across all tournament pages

## Acceptance Criteria

### Desktop Sidebar (≥900px)
- [x] Sidebar visible on ALL tournament pages at md breakpoint (900px+)
- [x] Sidebar shows 4 cards: Rules, User Stats, Tables & Results, Friend Groups
- [x] Current page's card is visually marked as "active" (border, background, or badge)
- [x] Current page's card is NOT removed from sidebar
- [x] All sidebar cards remain clickable (even active one, acts as refresh/scroll-to-top)
- [x] Sidebar scrollable if content exceeds viewport height
- [x] Main nav tabs show selected state ONLY for PARTIDOS, CLASIFICADOS, PREMIOS
- [x] Main nav tabs do NOT show selected state when on Rules, Stats, Tables, or Friend Groups pages

### Mobile Bottom Nav (<900px)
- [x] Bottom nav has 5 tabs: Home, Tablas, Reglas, Stats, Grupos
- [x] "Tournament" tab removed (no longer exists)
- [x] "Reglas" tab navigates to `/tournaments/[id]/rules`
- [x] "Tablas" tab navigates to `/tournaments/[id]/results`
- [x] "Grupos" tab navigates to `/tournaments/[id]/friend-groups`
- [x] Active tab correctly highlighted based on current route
- [x] Icons properly aligned vertically

### Layout Consistency
- [x] All tournament child pages have same max-width: **1200px** (updated from 868px)
- [x] Max-width enforced in layout, not per-page
- [x] **ALL pages use 8/4 column layout** (8 columns main content, 4 columns sidebar on desktop ≥900px)
- [x] Main content scrolls independently when needed (overflow handled per-page)
- [x] Top nav content (buttons section) respects max-width
- [x] Top nav background color spans full viewport width
- [x] Sidebar uses same max-width container as main content

### Bug Fixes
- [x] Bottom nav Friend Groups icon vertically aligned with other icons
- [x] All sidebar cards have consistent link styling (all show icons)
- [x] **Sidebar icons MUST match mobile bottom nav icons exactly:**
  - Home/Games: Home icon
  - Tables & Results: Assessment icon
  - Rules: Gavel icon
  - User Stats: BarChart icon
  - Friend Groups: Groups icon

## Technical Approach

### Architecture Overview

**Key Pattern:** Move sidebar data fetching and rendering from page.tsx to layout.tsx to make it available across all tournament child routes.

**Layout Structure (New):**
```
TournamentLayout
├── AppBar (top nav - with max-width fix)
├── Box (main content area - centered max-width container)
│   ├── Grid container (8/12 + 4/12 split on desktop)
│   │   ├── Grid item (8/12 on md+) - Main content
│   │   │   └── {children} (page content)
│   │   └── Grid item (4/12 on md+) - Sidebar
│   │       └── TournamentSidebar (NEW component)
│   │           ├── Rules card
│   │           ├── UserTournamentStatistics card
│   │           ├── GroupStandingsSidebar card
│   │           └── FriendGroupsList card
└── TournamentBottomNavWrapper (mobile only)
```

**Data Fetching Strategy:**
- Move sidebar data fetching from `page.tsx` to `layout.tsx`
- Layout fetches once for all child pages (acceptable performance trade-off)
- Sidebar components receive data as props
- Each card determines if it's "active" based on current pathname

### Implementation Phases

**Phase 1: Create TournamentSidebar Component**
- Extract sidebar rendering from home page
- Add `isActive` prop to each sidebar card component
- Implement active state styling (left border + background)
- Create helper function to determine current section from pathname

**Phase 2: Update Layout to Include Sidebar**
- Move data fetching from page.tsx to layout.tsx
- Restructure layout to use centered max-width container
- Integrate TournamentSidebar into layout Grid
- Update main content to use 8/12 split on desktop

**Phase 3: Update Sidebar Card Components**
- Add `isActive` prop to Rules, UserTournamentStatistics, GroupStandingsSidebar, FriendGroupsList
- Add active state styling when `isActive={true}`
- Add icons to all card action buttons (consistency)
- Use Material-UI icons: Gavel, BarChart, Assessment, People

**Phase 4: Update Bottom Navigation**
- Remove "Tournament" tab (redundant with PARTIDOS)
- Add "Reglas" tab with Gavel icon
- Rename "Resultados" → "Tablas"
- Rename "Friend Groups" → "Grupos"
- Update route detection to include `/rules` path
- Fix icon alignment (fontSize: 24 for all)

**Phase 5: Clean Up Individual Pages**
- Remove max-width styling from pages (handled by layout)
- Remove sidebar code from home page (now in layout)
- Simplify page components (focus on content only)

**Phase 6: Fix Top Nav Max-Width**
- Restructure AppBar to have full-width background
- Nest content Box with max-width inside
- Ensure proper centering on wide screens

## Files to Create/Modify

### New Files
- `app/components/tournament-page/tournament-sidebar.tsx` - New component wrapping sidebar cards

### Modified Files

**Layout & Structure:**
- `app/tournaments/[id]/layout.tsx` - Major refactor (sidebar data + max-width container)
- `app/tournaments/[id]/page.tsx` - Remove sidebar, simplify to just main content

**Sidebar Components (add isActive prop):**
- `app/components/tournament-page/rules.tsx` - Add isActive prop & styling, add icon to button
- `app/components/tournament-page/user-tournament-statistics.tsx` - Add isActive prop & styling, add icon to button
- `app/components/tournament-page/group-standings-sidebar.tsx` - Add isActive prop & styling
- `app/components/tournament-page/friend-groups-list.tsx` - Add isActive prop & styling, add icon to button

**Navigation:**
- `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx` - Update tabs, icons, route detection

**Individual Pages (remove max-width):**
- `app/tournaments/[id]/rules/page.tsx` - Remove Container with maxWidth
- `app/tournaments/[id]/stats/page.tsx` - Remove maxWidth from Box
- `app/tournaments/[id]/results/page.tsx` - Remove maxWidth from Box
- `app/tournaments/[id]/friend-groups/page.tsx` - Remove any page-specific width constraints

## Implementation Steps

### Step 1: Create TournamentSidebar Component

**File:** `app/components/tournament-page/tournament-sidebar.tsx`

**Implementation:**
```tsx
'use client'

import { Box, Grid } from '@mui/material'
import { usePathname } from 'next/navigation'
import Rules, { ScoringConfig } from './rules'
import { UserTournamentStatistics } from './user-tournament-statistics'
import GroupStandingsSidebar from './group-standings-sidebar'
import FriendGroupsList from './friend-groups-list'
import type { GameStatisticForUser } from '@/types/definitions'
import type { TournamentGuess, User } from '@/app/db/tables-definition'

interface TournamentSidebarProps {
  readonly tournamentId: string
  readonly scoringConfig?: ScoringConfig
  readonly userGameStatistics?: GameStatisticForUser
  readonly tournamentGuess?: TournamentGuess
  readonly groupStandings?: {
    groups: any[]
    defaultGroupId: string
    qualifiedTeams: any[]
  }
  readonly prodeGroups?: {
    userGroups: any[]
    participantGroups: any[]
  }
  readonly user?: User
}

// Helper to determine current section from pathname
function getCurrentSection(pathname: string, tournamentId: string): string | null {
  if (pathname === `/tournaments/${tournamentId}/rules`) return 'rules'
  if (pathname.startsWith(`/tournaments/${tournamentId}/stats`)) return 'stats'
  if (pathname === `/tournaments/${tournamentId}/results`) return 'results'
  if (pathname.startsWith(`/tournaments/${tournamentId}/friend-groups`)) return 'friend-groups'
  return null
}

export default function TournamentSidebar({
  tournamentId,
  scoringConfig,
  userGameStatistics,
  tournamentGuess,
  groupStandings,
  prodeGroups,
  user,
}: TournamentSidebarProps) {
  const pathname = usePathname()
  const currentSection = getCurrentSection(pathname, tournamentId)

  return (
    <Grid
      size={{ xs: 12, md: 4 }}
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        minHeight: 0,
        pt: 2,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        '&::-webkit-scrollbar': {
          display: 'none'
        }
      }}>
        <Grid container rowSpacing={2}>
          <Grid size={12}>
            <Rules
              expanded={false}
              scoringConfig={scoringConfig}
              tournamentId={tournamentId}
              isActive={currentSection === 'rules'}
            />
          </Grid>
          {user && (
            <Grid size={12}>
              <UserTournamentStatistics
                userGameStatistics={userGameStatistics}
                tournamentGuess={tournamentGuess}
                tournamentId={tournamentId}
                isActive={currentSection === 'stats'}
              />
            </Grid>
          )}
          {groupStandings && groupStandings.groups.length > 0 && (
            <Grid size={12}>
              <GroupStandingsSidebar
                groups={groupStandings.groups}
                defaultGroupId={groupStandings.defaultGroupId}
                qualifiedTeams={groupStandings.qualifiedTeams}
                tournamentId={tournamentId}
                isActive={currentSection === 'results'}
              />
            </Grid>
          )}
          {prodeGroups && (
            <Grid size={12}>
              <FriendGroupsList
                userGroups={prodeGroups.userGroups}
                participantGroups={prodeGroups.participantGroups}
                tournamentId={tournamentId}
                isActive={currentSection === 'friend-groups'}
              />
            </Grid>
          )}
        </Grid>
      </Box>
    </Grid>
  )
}
```

**Rationale:**
- Client component (uses `usePathname` hook)
- Reuses existing sidebar card components
- Determines "active" section from current pathname
- Matches exact structure from home page
- Handles conditional rendering (user-only cards, empty groups)

### Step 2: Update Sidebar Card Components (Add isActive Prop)

**Pattern (apply to all 4 cards):**

**Example: Rules Component**

```tsx
// Add isActive prop to interface
interface RulesProps {
  expanded?: boolean
  fullpage?: boolean
  scoringConfig?: ScoringConfig
  tournamentId?: string
  isActive?: boolean // NEW
}

// Update component signature
export default function Rules({
  expanded: defaultExpanded = true,
  fullpage = false,
  scoringConfig,
  tournamentId,
  isActive = false // NEW
}: RulesProps) {

  // Add active styling to Card
  return (
    <Card sx={{
      maxWidth: fullpage ? '800px' : '100%',
      mx: fullpage ? 'auto' : 0,
      ...(isActive && {
        borderLeft: 3,
        borderColor: 'primary.main',
        backgroundColor: 'action.selected',
      })
    }}>
      <CardHeader
        title='Reglas Generales'
        subheader={isActive ? 'Estás aquí' : undefined} // NEW
        // ... rest of props
      />
      {/* ... rest of component */}
      {!fullpage && (
        <CardActions sx={{ justifyContent: 'center', px: 2, py: 1.5 }}>
          <Button
            component={Link}
            href={tournamentId ? `/tournaments/${tournamentId}/rules` : "/rules"}
            startIcon={<GavelIcon />} // NEW - add icon
            variant="text"
            color="primary"
          >
            Ver Reglas Completas
          </Button>
        </CardActions>
      )}
    </Card>
  )
}
```

**Apply same pattern to:**
- `user-tournament-statistics.tsx` - Add BarChartIcon to button
- `group-standings-sidebar.tsx` - Already has AssessmentIcon (keep it)
- `friend-groups-list.tsx` - Add PeopleIcon to "Ver Grupos" button

**Active State Styling:**
- Left border: 3px solid primary color
- Background: `action.selected` (theme value for selected items)
- Subheader: "Estás aquí" text

### Step 3: Update Layout with Sidebar and Max-Width Container

**File:** `app/tournaments/[id]/layout.tsx`

**Key Changes:**

1. **Move sidebar data fetching from page.tsx:**
```tsx
// Add these fetches at top of layout (move from page.tsx)
const user = await getLoggedInUser()
const tournament = await findTournamentById(params.id)
const prodeGroups = await getGroupsForUser()
const groupStandings = await getGroupStandingsForTournament(params.id)
const userGameStatistics = user ?
  await getGameGuessStatisticsForUsers([user.id], params.id) :
  []
const tournamentGuess = user ?
  await findTournamentGuessByUserIdTournament(user.id, params.id) :
  undefined

// Extract scoring config
const scoringConfig: ScoringConfig | undefined = tournament ? {
  game_exact_score_points: tournament.game_exact_score_points ?? 2,
  game_correct_outcome_points: tournament.game_correct_outcome_points ?? 1,
  champion_points: tournament.champion_points ?? 5,
  runner_up_points: tournament.runner_up_points ?? 3,
  third_place_points: tournament.third_place_points ?? 1,
  individual_award_points: tournament.individual_award_points ?? 3,
  qualified_team_points: tournament.qualified_team_points ?? 1,
  exact_position_qualified_points: tournament.exact_position_qualified_points ?? 2,
  max_silver_games: tournament.max_silver_games ?? 0,
  max_golden_games: tournament.max_golden_games ?? 0,
} : undefined
```

2. **Update AppBar structure (fix max-width issue):**
```tsx
<AppBar position={'sticky'} sx={{ top: 0, zIndex: 1100 }}>
  {/* Background color spans full width */}
  <Box sx={{
    backgroundColor: layoutData.tournament?.theme?.primary_color,
    display: 'flex',
    justifyContent: 'center',
    width: '100%'
  }}>
    {/* Content respects max-width */}
    <Box sx={{
      width: '100%',
      maxWidth: '1200px',
      px: 2
    }}>
      <Grid container>
        <Grid size={12} pt={2} pb={1} sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1
        }}>
          {/* Logo, title, user actions - existing code */}
        </Grid>
        <Grid size={12} pb={{ xs: 1, md: 0.5 }}>
          <GroupSelector ... />
        </Grid>
      </Grid>
    </Box>
  </Box>
</AppBar>
```

3. **Update main content area with sidebar:**
```tsx
<Box sx={{
  flexGrow: 1,
  overflow: 'auto',
  minHeight: 0,
  display: 'flex',
  justifyContent: 'center',
  px: 2,
  pb: 2
}}>
  {/* Centered max-width container */}
  <Box sx={{
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    gap: 2
  }}>
    <Grid container spacing={2} sx={{ height: '100%', width: '100%' }}>
      {/* Main content - 8/12 on desktop, full on mobile */}
      <Grid size={{ xs: 12, md: 8 }} sx={{
        display: 'flex',
        flexDirection: 'column'
      }}>
        {children}
      </Grid>

      {/* Sidebar - 4/12 on desktop, hidden on mobile */}
      <TournamentSidebar
        tournamentId={params.id}
        scoringConfig={scoringConfig}
        userGameStatistics={userGameStatistics?.[0]}
        tournamentGuess={tournamentGuess}
        groupStandings={groupStandings}
        prodeGroups={prodeGroups}
        user={user}
      />
    </Grid>
  </Box>
</Box>
```

**Import additions:**
```tsx
import TournamentSidebar from '../../components/tournament-page/tournament-sidebar'
import { findTournamentById } from '../../db/tournament-repository'
import type { ScoringConfig } from '../../components/tournament-page/rules'
import { getGameGuessStatisticsForUsers } from '../../db/game-guess-repository'
// ... other imports
```

### Step 4: Update Bottom Navigation

**File:** `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`

**Changes:**

1. **Update tabs array:**
```tsx
import { Assessment, Gavel, BarChart, Groups, Home } from '@mui/icons-material'

const tabs = [
  {
    label: 'Home',
    value: 'main-home',
    icon: <Home />,
    href: '/'
  },
  {
    label: 'Tablas', // RENAMED from "Resultados"
    value: 'results',
    icon: <Assessment />,
    href: `/tournaments/${tournamentId}/results`
  },
  {
    label: 'Reglas', // NEW
    value: 'rules',
    icon: <Gavel />,
    href: `/tournaments/${tournamentId}/rules`
  },
  {
    label: 'Stats',
    value: 'stats',
    icon: <BarChart />,
    href: `/tournaments/${tournamentId}/stats`
  },
  {
    label: 'Grupos', // RENAMED from "Friend Groups"
    value: 'friend-groups',
    icon: <Groups sx={{ fontSize: 24 }} />, // FIX alignment
    href: `/tournaments/${tournamentId}/friend-groups`
  },
]
```

2. **Update route detection in useEffect:**
```tsx
useEffect(() => {
  if (currentPath === '/') {
    setValue('main-home')
  } else if (currentPath === `/tournaments/${tournamentId}`) {
    setValue('') // IMPORTANT: No bottom nav tab selected (PARTIDOS is in top nav)
  } else if (currentPath.startsWith(`/tournaments/${tournamentId}/results`)) {
    setValue('results')
  } else if (currentPath.startsWith(`/tournaments/${tournamentId}/rules`)) {
    setValue('rules') // NEW
  } else if (currentPath.startsWith(`/tournaments/${tournamentId}/stats`)) {
    setValue('stats')
  } else if (currentPath === `/tournaments/${tournamentId}/friend-groups`) {
    setValue('friend-groups')
  }
}, [currentPath, tournamentId])
```

**Key Changes:**
- Remove "Tournament" tab (EmojiEvents icon) - REDUNDANT
- Add "Reglas" tab with Gavel icon - NEW ACCESS POINT
- Rename labels for brevity ("Tablas", "Grupos")
- Fix Groups icon alignment with fontSize: 24
- Update route detection to include Rules

### Step 5: Simplify Individual Pages (Remove Max-Width)

**Pattern (apply to all pages):**

**Before (rules/page.tsx):**
```tsx
return (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Rules fullpage scoringConfig={scoringConfig} />
  </Container>
)
```

**After (rules/page.tsx):**
```tsx
return (
  <Box sx={{ pt: 2 }}> {/* Simple wrapper, no max-width */}
    <Rules fullpage scoringConfig={scoringConfig} />
  </Box>
)
```

**Apply to:**
- `app/tournaments/[id]/rules/page.tsx` - Remove Container, use Box
- `app/tournaments/[id]/stats/page.tsx` - Remove maxWidth from Box
- `app/tournaments/[id]/results/page.tsx` - Remove maxWidth from Box
- `app/tournaments/[id]/friend-groups/page.tsx` - No changes needed (already simple)

**Rationale:** Layout now handles max-width, pages focus on content only.

### Step 6: Update Home Page (Remove Sidebar Code)

**File:** `app/tournaments/[id]/page.tsx`

**Before:**
- Has Grid container with sidebar cards
- Fetches sidebar data (prodeGroups, userGameStatistics, etc.)
- Uses 8/12 + 4/12 split

**After:**
- Just render main content (UnifiedGamesPage)
- Remove sidebar rendering (now in layout)
- Remove sidebar data fetching (moved to layout)
- Simplify Grid structure

```tsx
export default async function TournamentLandingPage(props: Props) {
  const params = await props.params
  const tournamentId = params.id

  return (
    <Box sx={{ pt: 1 }}> {/* Simple wrapper */}
      <UnifiedGamesPage tournamentId={tournamentId} />
    </Box>
  )
}
```

**Removed:**
- All sidebar data fetching (user, prodeGroups, groupStandings, etc.)
- Grid container with 8/12 + 4/12 split
- Sidebar cards rendering
- ViewTransition wrapper (not needed for simple page)

## Visual Prototypes

### Desktop Sidebar - Active State

**Before (Rules card - not active):**
```
┌──────────────────────────────────┐
│ Reglas Generales             [v] │
├──────────────────────────────────┤
│                                  │
│ • 1 Punto por Ganador/Empate    │
│ • 1 punto extra por exacto      │
│ • ...                           │
│                                  │
├──────────────────────────────────┤
│    [Ver Reglas Completas]  📜    │
└──────────────────────────────────┘
```

**After (Rules card - ACTIVE on /rules page):**
```
║══════════════════════════════════║  ← 3px blue left border
║ Reglas Generales             [v] ║
║ Estás aquí                       ║  ← "You are here" subheader
╠══════════════════════════════════╣
║                                  ║
║ • 1 Punto por Ganador/Empate    ║  ← Light blue background
║ • 1 punto extra por exacto      ║     (action.selected)
║ • ...                           ║
║                                  ║
╠══════════════════════════════════╣
║    [📜 Ver Reglas Completas]     ║  ← Icon added to button
╚══════════════════════════════════╝
```

**Active State Indicators:**
1. **Left border:** 3px solid primary.main (blue)
2. **Background:** action.selected theme color (light blue/gray)
3. **Subheader:** "Estás aquí" text below title
4. **Still clickable:** Acts as refresh/scroll-to-top

### Desktop Layout - Persistent Sidebar

**Current (sidebar only on home):**
```
┌────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]  │
└────────────────────────────────────────────────┘

HOME PAGE                    OTHER PAGES
┌─────────────┬──────────┐   ┌──────────────────┐
│ Games       │ Sidebar  │   │ Full Width       │
│ (8/12)      │ (4/12)   │   │ Content          │
│             │          │   │                  │
│             │ Rules    │   │ (No sidebar!)    │
│             │ Stats    │   │                  │
│             │ Tables   │   │                  │
│             │ Groups   │   │                  │
└─────────────┴──────────┘   └──────────────────┘
```

**New (sidebar on ALL pages):**
```
┌────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]  │
└────────────────────────────────────────────────┘

ALL PAGES (Home, Rules, Stats, Results, Groups)
┌─────────────────────┬──────────────────────┐
│ Main Content (8/12) │ Sidebar (4/12)       │
│                     │                      │
│ [Page-specific]     │ ║ Rules              │
│ [Content here]      │ ║ Stats (if user)    │
│                     │ ║ Tables             │
│                     │ ║ Groups             │
│                     │                      │
│                     │ Active card has blue │
│                     │ left border          │
└─────────────────────┴──────────────────────┘
```

**Max-Width Container (1200px - UPDATED):**
```
┌─────────────────────────────────────────────────────────┐
│ WIDE SCREEN (>1200px)                                   │
│                                                          │
│      [empty]     ┌───────────────────┐      [empty]    │
│                  │  1200px container │                  │
│                  │  ┌────────┬─────┐ │                  │
│                  │  │ Main   │ Side│ │                  │
│                  │  │ (8/12) │(4/12)│                  │
│                  │  └────────┴─────┘ │                  │
│                  └───────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

**Scrolling Behavior Clarification:**
- **Layout:** Fixed height container (`height: 100%` or `calc(100vh - nav)`)
- **Main Content (8/12):** Each page handles its own scrolling needs
  - Some pages scroll (long content like Rules full page)
  - Some pages are fixed height (games list with internal scroll)
- **Sidebar (4/12):** Scrollable if cards exceed viewport (`overflow: auto`)
- **Pattern:** Both columns CAN scroll independently if needed

### Mobile Bottom Nav - Before & After

**Before (5 tabs with redundancy):**
```
┌──────────────────────────────────────────────┐
│ [🏠]      [🏆]      [📊]      [👥]      [📈]  │
│ Home   Tournament Resultados Groups   Stats │
│          (REDUNDANT)                         │
└──────────────────────────────────────────────┘

ISSUE: "Tournament" goes to home, same as "PARTIDOS" in top nav
ISSUE: Rules page has NO mobile access point
```

**After (5 tabs, no redundancy):**
```
┌──────────────────────────────────────────────┐
│ [🏠]    [📊]    [📜]    [📈]    [👥]         │
│ Home   Tablas  Reglas  Stats   Grupos       │
│       (renamed) (NEW!)         (renamed)     │
└──────────────────────────────────────────────┘

FIXED: Removed "Tournament" redundancy
FIXED: Added "Reglas" (Rules) access point
IMPROVED: Shorter labels for better fit
```

**Icon Alignment Fix:**
```
BEFORE:
🏠 ← fontSize: inherit
🏆 ← fontSize: inherit
📊 ← fontSize: inherit
👥 ← fontSize: inherit (MISALIGNED - too small)
📈 ← fontSize: inherit

AFTER:
🏠 ← fontSize: 24
📊 ← fontSize: 24
📜 ← fontSize: 24
📈 ← fontSize: 24
👥 ← fontSize: 24 (ALIGNED!)
```

### Top Nav Max-Width Fix

**Before (content doesn't respect max-width):**
```
┌─────────────────────────────────────────────────────┐
│ [Logo] Tournament Title           [Theme] [User]    │  ← Stretches full width
│ [PARTIDOS] [CLASIFICADOS] [PREMIOS]                 │  ← On wide screens
└─────────────────────────────────────────────────────┘
```

**After (background full-width, content max-width):**
```
┌─────────────────────────────────────────────────────┐
│                                                       │
│    [Logo] Tournament Title      [Theme] [User]      │  ← Centered 868px
│    [PARTIDOS] [CLASIFICADOS] [PREMIOS]              │  ← Consistent with content
│                                                       │
└─────────────────────────────────────────────────────┘
     ^                                             ^
     Empty (color spans)        Empty (color spans)
```

**Structure:**
```tsx
<AppBar>
  <Box sx={{ bgcolor: primary, width: '100%', justifyContent: 'center' }}>
    <Box sx={{ maxWidth: '1200px', px: 2 }}>
      {/* Content here - logo, title, tabs */}
    </Box>
  </Box>
</AppBar>
```

## Comprehensive Page Mockups (Before & After)

### Overview: Desktop Layout Transformation

**Current State:** Only Home page has sidebar (8/4 split). All other pages are full-width.

**Target State:** ALL tournament pages have persistent sidebar (8/4 split) at ≥900px breakpoint.

**Max-width:** 1200px (centered container)

**Pages Affected:** 7 pages total
1. Home/Games (already has sidebar, but updating max-width)
2. Rules
3. User Stats
4. Tables & Results
5. Friend Groups List
6. Friend Group (owner view)
7. Friend Group (member view)

**Pages NOT Affected:** Qualified Teams, Individual Awards (keep full-width as is)

---

### Page 1: Home/Games

**BEFORE (Current - 868px max-width):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS*] [CLASIFICADOS] [PREMIOS]             │
└────────────────────────────────────────────────────────────┘
┌─────────────────────────────┬──────────────────────────────┐
│ Games List (8/12)           │ Sidebar (4/12)               │
│                             │                              │
│ [Group A v]                 │ ┌────────────────────────┐  │
│                             │ │ Reglas Generales       │  │
│ ┌─────────────────────────┐ │ │ • Rules summary...     │  │
│ │ Team A vs Team B        │ │ └────────────────────────┘  │
│ │ Date, Time              │ │                              │
│ │ [Your Prediction]       │ │ ┌────────────────────────┐  │
│ └─────────────────────────┘ │ │ Tus Estadísticas       │  │
│                             │ │ Points, accuracy...     │  │
│ ┌─────────────────────────┐ │ └────────────────────────┘  │
│ │ Team C vs Team D        │ │                              │
│ │ Date, Time              │ │ ┌────────────────────────┐  │
│ │ [Your Prediction]       │ │ │ Tabla de Posiciones    │  │
│ └─────────────────────────┘ │ │ Groups dropdown...      │  │
│                             │ └────────────────────────┘  │
│ (scrollable list)           │                              │
│                             │ ┌────────────────────────┐  │
│                             │ │ Grupos de Amigos       │  │
│                             │ │ Your groups list...     │  │
│                             │ └────────────────────────┘  │
└─────────────────────────────┴──────────────────────────────┘
     Max-width: 868px (current)
```

**AFTER (Target - 1200px max-width):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS*] [CLASIFICADOS] [PREMIOS]             │
└────────────────────────────────────────────────────────────┘
┌─────────────────────────────┬──────────────────────────────┐
│ Games List (8/12)           │ Sidebar (4/12)               │
│                             │                              │
│ [Group A v]                 │ ┌────────────────────────┐  │
│                             │ │ Reglas Generales       │  │
│ ┌─────────────────────────┐ │ │ • Rules summary...     │  │
│ │ Team A vs Team B        │ │ │ [📜 Ver Reglas]        │  │
│ │ Date, Time              │ │ └────────────────────────┘  │
│ │ [Your Prediction]       │ │                              │
│ └─────────────────────────┘ │ ┌────────────────────────┐  │
│                             │ │ Tus Estadísticas       │  │
│ ┌─────────────────────────┐ │ │ Points, accuracy...     │  │
│ │ Team C vs Team D        │ │ │ [📊 Ver Detalle]       │  │
│ │ Date, Time              │ │ └────────────────────────┘  │
│ │ [Your Prediction]       │ │                              │
│ └─────────────────────────┘ │ ┌────────────────────────┐  │
│                             │ │ Tabla de Posiciones    │  │
│ (scrollable list)           │ │ Groups dropdown...      │  │
│                             │ │ [📈 Ver Resultados]    │  │
│                             │ └────────────────────────┘  │
│                             │                              │
│                             │ ┌────────────────────────┐  │
│                             │ │ Grupos de Amigos       │  │
│                             │ │ Your groups list...     │  │
│                             │ │ [👥 Ver Grupos]        │  │
│                             │ └────────────────────────┘  │
└─────────────────────────────┴──────────────────────────────┘
     Max-width: 1200px (UPDATED - more spacious)
```

**Key Changes:**
- Max-width increased from 868px → 1200px (more breathing room)
- All sidebar buttons now have icons matching mobile bottom nav
- No active state (home page doesn't correspond to a sidebar card)

---

### Page 2: Rules (Reglas)

**BEFORE (Current - full-width):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]              │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│                 Reglas Generales                           │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Fase de Grupos                                        ││
│ │ • Pronóstico exacto: 2 puntos                         ││
│ │ • Ganador correcto: 1 punto                           ││
│ │ • ...                                                  ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Equipos Clasificados                                  ││
│ │ • Por equipo correcto: 1 punto                        ││
│ │ • Posición exacta: 2 puntos extra                     ││
│ │ ...                                                    ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ (Full-width centered content - NO SIDEBAR)                │
│ (Scrollable if long)                                       │
└────────────────────────────────────────────────────────────┘
```

**AFTER (Target - 8/4 layout with sidebar):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]              │
└────────────────────────────────────────────────────────────┘
┌─────────────────────────────┬──────────────────────────────┐
│ Rules Content (8/12)        │ Sidebar (4/12)               │
│                             │                              │
│ Reglas Generales            │ ║══════════════════════════║│
│                             │ ║ Reglas Generales    [v] ║│
│ ┌─────────────────────────┐ │ ║ Estás aquí              ║│
│ │ Fase de Grupos          │ │ ╠══════════════════════════╣│
│ │ • Pronóstico exacto: 2  │ │ ║ • Rules summary...      ║│
│ │ • Ganador: 1 punto      │ │ ║ [📜 Ver Reglas]         ║│
│ │ • ...                   │ │ ╚══════════════════════════╝│
│ └─────────────────────────┘ │      ↑ ACTIVE (blue border) │
│                             │                              │
│ ┌─────────────────────────┐ │ ┌────────────────────────┐  │
│ │ Equipos Clasificados    │ │ │ Tus Estadísticas       │  │
│ │ • Por equipo: 1 punto   │ │ │ Points, accuracy...     │  │
│ │ • Posición exacta: +2   │ │ │ [📊 Ver Detalle]       │  │
│ │ ...                     │ │ └────────────────────────┘  │
│ └─────────────────────────┘ │                              │
│                             │ ┌────────────────────────┐  │
│ (Content fits in 8 columns) │ │ Tabla de Posiciones    │  │
│ (Scrollable if needed)      │ │ Groups dropdown...      │  │
│                             │ │ [📈 Ver Resultados]    │  │
│                             │ └────────────────────────┘  │
│                             │                              │
│                             │ ┌────────────────────────┐  │
│                             │ │ Grupos de Amigos       │  │
│                             │ │ [👥 Ver Grupos]        │  │
│                             │ └────────────────────────┘  │
└─────────────────────────────┴──────────────────────────────┘
     Max-width: 1200px, 8/4 split
```

**Key Changes:**
- Rules content NOW constrained to 8 columns (was full-width)
- Sidebar APPEARS with Rules card ACTIVE (blue left border, light background)
- Rules card shows "Estás aquí" subheader
- Content must fit in narrower space (may need minor adjustments)

---

### Page 3: User Stats (Estadísticas)

**BEFORE (Current - full-width with tabs):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]              │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────┐  │
│ │ [Rendimiento*] [Precisión] [Boosts]                 │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Performance Overview Card                             ││
│ │                                                        ││
│ │ Total Points: 45                                      ││
│ │ Group Stage: 30 pts                                   ││
│ │ Playoff Stage: 15 pts                                 ││
│ │                                                        ││
│ │ [Detailed breakdown charts/tables]                    ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ (Full-width card - NO SIDEBAR)                            │
└────────────────────────────────────────────────────────────┘
```

**AFTER (Target - 8/4 layout with sidebar):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]              │
└────────────────────────────────────────────────────────────┘
┌─────────────────────────────┬──────────────────────────────┐
│ Stats Content (8/12)        │ Sidebar (4/12)               │
│                             │                              │
│ ┌─────────────────────────┐ │ ┌────────────────────────┐  │
│ │ [Rendimiento*]          │ │ │ Reglas Generales       │  │
│ │ [Precisión] [Boosts]    │ │ │ [📜 Ver Reglas]        │  │
│ └─────────────────────────┘ │ └────────────────────────┘  │
│                             │                              │
│ ┌─────────────────────────┐ │ ║══════════════════════════║│
│ │ Performance Overview    │ │ ║ Tus Estadísticas    [v] ║│
│ │                         │ │ ║ Estás aquí              ║│
│ │ Total: 45 pts           │ │ ╠══════════════════════════╣│
│ │ Group: 30 pts           │ │ ║ Points, accuracy...     ║│
│ │ Playoff: 15 pts         │ │ ║ [📊 Ver Detalle]        ║│
│ │                         │ │ ╚══════════════════════════╝│
│ │ [Breakdown tables]      │ │      ↑ ACTIVE              │
│ │ (Fits in 8 columns)     │ │                              │
│ └─────────────────────────┘ │ ┌────────────────────────┐  │
│                             │ │ Tabla de Posiciones    │  │
│                             │ │ [📈 Ver Resultados]    │  │
│                             │ └────────────────────────┘  │
│                             │                              │
│                             │ ┌────────────────────────┐  │
│                             │ │ Grupos de Amigos       │  │
│                             │ │ [👥 Ver Grupos]        │  │
│                             │ └────────────────────────┘  │
└─────────────────────────────┴──────────────────────────────┘
     Max-width: 1200px, 8/4 split
```

**Key Changes:**
- Stats tabs and card NOW in 8 columns (was full-width)
- Sidebar APPEARS with Stats card ACTIVE
- Tables/charts may need responsive adjustments for narrower width
- Stats card shows BarChart icon (📊) matching mobile nav

---

### Page 4: Tables & Results (Tablas y Resultados)

**BEFORE (Current - full-width with group grids):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]              │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│            Resultados y Tablas                             │
│                                                            │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ [Fase de Grupos*] [Playoffs]                         │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌───────────────┬───────────────┬───────────────┐        │
│ │ Grupo A       │ Grupo B       │ Grupo C       │        │
│ │ 1. Team...    │ 1. Team...    │ 1. Team...    │        │
│ │ 2. Team...    │ 2. Team...    │ 2. Team...    │        │
│ │ 3. Team...    │ 3. Team...    │ 3. Team...    │        │
│ └───────────────┴───────────────┴───────────────┘        │
│                                                            │
│ (Full-width grid layout - NO SIDEBAR)                     │
└────────────────────────────────────────────────────────────┘
```

**AFTER (Target - 8/4 layout with sidebar):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]              │
└────────────────────────────────────────────────────────────┘
┌─────────────────────────────┬──────────────────────────────┐
│ Results Content (8/12)      │ Sidebar (4/12)               │
│                             │                              │
│ Resultados y Tablas         │ ┌────────────────────────┐  │
│                             │ │ Reglas Generales       │  │
│ ┌─────────────────────────┐ │ │ [📜 Ver Reglas]        │  │
│ │ [Fase de Grupos*]       │ │ └────────────────────────┘  │
│ │ [Playoffs]              │ │                              │
│ └─────────────────────────┘ │ ┌────────────────────────┐  │
│                             │ │ Tus Estadísticas       │  │
│ ┌──────────┬──────────┐    │ │ [📊 Ver Detalle]       │  │
│ │ Grupo A  │ Grupo B  │    │ └────────────────────────┘  │
│ │ 1. Team  │ 1. Team  │    │                              │
│ │ 2. Team  │ 2. Team  │    │ ║══════════════════════════║│
│ │ 3. Team  │ 3. Team  │    │ ║ Tabla de Posiciones [v] ║│
│ └──────────┴──────────┘    │ ║ Estás aquí              ║│
│                             │ ╠══════════════════════════╣│
│ ┌──────────┬──────────┐    │ ║ Groups dropdown...      ║│
│ │ Grupo C  │ Grupo D  │    │ ║ [📈 Ver Resultados]    ║│
│ │ 1. Team  │ 1. Team  │    │ ╚══════════════════════════╝│
│ │ 2. Team  │ 2. Team  │    │      ↑ ACTIVE              │
│ └──────────┴──────────┘    │                              │
│                             │ ┌────────────────────────┐  │
│ (Group grids in 8 cols)     │ │ Grupos de Amigos       │  │
│ (May need 2x2 or stacked)   │ │ [👥 Ver Grupos]        │  │
│                             │ └────────────────────────┘  │
└─────────────────────────────┴──────────────────────────────┘
     Max-width: 1200px, 8/4 split
```

**Key Changes:**
- Group standings grid NOW in 8 columns (was full-width)
- Sidebar APPEARS with Tables card ACTIVE
- Grid may need to be 2x2 or stacked vertically to fit 8-column width
- Tables card shows Assessment icon (📈) matching mobile nav

---

### Page 5: Friend Groups List (Lista de Grupos)

**BEFORE (Current - full-width with group cards):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]              │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────┐  │
│ │ [Crear Nuevo Grupo]                                  │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Grupo: La Scaloneta                                   ││
│ │ 15 miembros | Tu posición: 3rd                        ││
│ │ [Ver Detalles]                                        ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ ┌────────────────────────────────────────────────────────┐│
│ │ Grupo: Mundial 2022                                   ││
│ │ 8 miembros | Tu posición: 1st                         ││
│ │ [Ver Detalles]                                        ││
│ └────────────────────────────────────────────────────────┘│
│                                                            │
│ (Full-width cards - NO SIDEBAR)                           │
└────────────────────────────────────────────────────────────┘
```

**AFTER (Target - 8/4 layout with sidebar):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]              │
└────────────────────────────────────────────────────────────┘
┌─────────────────────────────┬──────────────────────────────┐
│ Groups List (8/12)          │ Sidebar (4/12)               │
│                             │                              │
│ ┌─────────────────────────┐ │ ┌────────────────────────┐  │
│ │ [Crear Nuevo Grupo]     │ │ │ Reglas Generales       │  │
│ └─────────────────────────┘ │ │ [📜 Ver Reglas]        │  │
│                             │ └────────────────────────┘  │
│ ┌─────────────────────────┐ │                              │
│ │ Grupo: La Scaloneta     │ │ ┌────────────────────────┐  │
│ │ 15 miembros | Pos: 3rd  │ │ │ Tus Estadísticas       │  │
│ │ [Ver Detalles]          │ │ │ [📊 Ver Detalle]       │  │
│ └─────────────────────────┘ │ └────────────────────────┘  │
│                             │                              │
│ ┌─────────────────────────┐ │ ┌────────────────────────┐  │
│ │ Grupo: Mundial 2022     │ │ │ Tabla de Posiciones    │  │
│ │ 8 miembros | Pos: 1st   │ │ │ [📈 Ver Resultados]    │  │
│ │ [Ver Detalles]          │ │ └────────────────────────┘  │
│ └─────────────────────────┘ │                              │
│                             │ ║══════════════════════════║│
│ (Group cards in 8 cols)     │ ║ Grupos de Amigos    [v] ║│
│                             │ ║ Estás aquí              ║│
│                             │ ╠══════════════════════════╣│
│                             │ ║ Your groups list...     ║│
│                             │ ║ [👥 Ver Grupos]        ║│
│                             │ ╚══════════════════════════╝│
│                             │      ↑ ACTIVE              │
└─────────────────────────────┴──────────────────────────────┘
     Max-width: 1200px, 8/4 split
```

**Key Changes:**
- Group cards NOW in 8 columns (was full-width)
- Sidebar APPEARS with Friend Groups card ACTIVE
- Cards fit comfortably in 8-column width
- Groups card shows Groups icon (👥) matching mobile nav

---

### Page 6: Friend Group Detail - Owner View

**BEFORE (Current - full-width with 2-column layout):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]              │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│ Grupo: La Scaloneta                                        │
│                                                            │
│ ┌──────────────────────────┬─────────────────────────────┐│
│ │ Leaderboard Table        │ Group Customization Panel  ││
│ │                          │                             ││
│ │ 1. User A - 150 pts      │ [Editar Nombre]            ││
│ │ 2. User B - 145 pts      │ [Invitar Miembros]         ││
│ │ 3. You - 140 pts         │ [Ver Invitaciones]         ││
│ │ 4. User C - 135 pts      │ [Configuración]            ││
│ │ ...                      │                             ││
│ │                          │ [Danger Zone]              ││
│ │                          │ [Eliminar Grupo]           ││
│ └──────────────────────────┴─────────────────────────────┘│
│                                                            │
│ (Full-width 2-column layout - NO SIDEBAR)                 │
└────────────────────────────────────────────────────────────┘
```

**AFTER (Target - 8/4 layout with sidebar):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]              │
└────────────────────────────────────────────────────────────┘
┌─────────────────────────────┬──────────────────────────────┐
│ Group Detail (8/12)         │ Sidebar (4/12)               │
│                             │                              │
│ Grupo: La Scaloneta         │ ┌────────────────────────┐  │
│                             │ │ Reglas Generales       │  │
│ ┌─────────────────────────┐ │ │ [📜 Ver Reglas]        │  │
│ │ Leaderboard Table       │ │ └────────────────────────┘  │
│ │                         │ │                              │
│ │ 1. User A - 150 pts     │ │ ┌────────────────────────┐  │
│ │ 2. User B - 145 pts     │ │ │ Tus Estadísticas       │  │
│ │ 3. You - 140 pts        │ │ │ [📊 Ver Detalle]       │  │
│ │ 4. User C - 135 pts     │ │ └────────────────────────┘  │
│ │ ...                     │ │                              │
│ └─────────────────────────┘ │ ┌────────────────────────┐  │
│                             │ │ Tabla de Posiciones    │  │
│ ┌─────────────────────────┐ │ │ [📈 Ver Resultados]    │  │
│ │ Customization Panel     │ │ └────────────────────────┘  │
│ │ [Editar Nombre]         │ │                              │
│ │ [Invitar Miembros]      │ │ ║══════════════════════════║│
│ │ [Ver Invitaciones]      │ │ ║ Grupos de Amigos    [v] ║│
│ │ [Configuración]         │ │ ║ Estás aquí              ║│
│ │ [Danger: Eliminar]      │ │ ╠══════════════════════════╣│
│ └─────────────────────────┘ │ ║ Your groups...          ║│
│                             │ ║ [👥 Ver Grupos]        ║│
│ (Stacked vertical layout)   │ ╚══════════════════════════╝│
│ (Fits in 8 columns)         │      ↑ ACTIVE              │
└─────────────────────────────┴──────────────────────────────┘
     Max-width: 1200px, 8/4 split
```

**Key Changes:**
- Page NOW uses 8 columns (was full-width with 2 columns)
- **LAYOUT CHANGE:** Leaderboard and customization panel may need to stack vertically instead of side-by-side
- Sidebar APPEARS with Friend Groups card ACTIVE
- This page requires most significant UI adaptation for narrower width

---

### Page 7: Friend Group Detail - Member View

**BEFORE (Current - full-width centered single column):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]              │
└────────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────────┐
│                                                            │
│         Grupo: Mundial 2022                                │
│                                                            │
│     ┌──────────────────────────────────────────────┐      │
│     │ Leaderboard Table (centered, single column) │      │
│     │                                              │      │
│     │ 1. User A - 150 pts                          │      │
│     │ 2. User B - 145 pts                          │      │
│     │ 3. You - 140 pts                             │      │
│     │ 4. User C - 135 pts                          │      │
│     │ ...                                          │      │
│     │                                              │      │
│     │ [Salir del Grupo]                            │      │
│     └──────────────────────────────────────────────┘      │
│                                                            │
│ (Full-width centered - NO SIDEBAR)                        │
└────────────────────────────────────────────────────────────┘
```

**AFTER (Target - 8/4 layout with sidebar):**
```
┌────────────────────────────────────────────────────────────┐
│ TOP NAV: [PARTIDOS] [CLASIFICADOS] [PREMIOS]              │
└────────────────────────────────────────────────────────────┘
┌─────────────────────────────┬──────────────────────────────┐
│ Group Detail (8/12)         │ Sidebar (4/12)               │
│                             │                              │
│ Grupo: Mundial 2022         │ ┌────────────────────────┐  │
│                             │ │ Reglas Generales       │  │
│ ┌─────────────────────────┐ │ │ [📜 Ver Reglas]        │  │
│ │ Leaderboard Table       │ │ └────────────────────────┘  │
│ │                         │ │                              │
│ │ 1. User A - 150 pts     │ │ ┌────────────────────────┐  │
│ │ 2. User B - 145 pts     │ │ │ Tus Estadísticas       │  │
│ │ 3. You - 140 pts        │ │ │ [📊 Ver Detalle]       │  │
│ │ 4. User C - 135 pts     │ │ └────────────────────────┘  │
│ │ ...                     │ │                              │
│ │                         │ │ ┌────────────────────────┐  │
│ │ [Salir del Grupo]       │ │ │ Tabla de Posiciones    │  │
│ └─────────────────────────┘ │ │ [📈 Ver Resultados]    │  │
│                             │ └────────────────────────┘  │
│ (Single column in 8 cols)   │                              │
│                             │ ║══════════════════════════║│
│                             │ ║ Grupos de Amigos    [v] ║│
│                             │ ║ Estás aquí              ║│
│                             │ ╠══════════════════════════╣│
│                             │ ║ Your groups...          ║│
│                             │ ║ [👥 Ver Grupos]        ║│
│                             │ ╚══════════════════════════╝│
│                             │      ↑ ACTIVE              │
└─────────────────────────────┴──────────────────────────────┘
     Max-width: 1200px, 8/4 split
```

**Key Changes:**
- Leaderboard NOW in 8 columns (was full-width centered)
- Sidebar APPEARS with Friend Groups card ACTIVE
- Table remains single column but narrower
- Simpler adaptation than owner view

---

### Summary of UI Adaptations Needed

**Pages requiring UI adjustments for 8-column width:**

1. **Tables & Results:** Group standings grid may need to change from 4-across to 2x2 or stacked
2. **Friend Group (Owner):** 2-column layout (table + panel) must stack vertically
3. **Friend Group (Member):** Single column table becomes narrower (minimal impact)

**Pages with minimal impact:**
- Home/Games: Already 8-column, just wider max-width
- Rules: Content fits naturally in 8 columns (text-based)
- User Stats: Cards/tabs adapt easily
- Friend Groups List: Cards already responsive

**Consistent across ALL pages:**
- Max-width: 1200px (centered)
- 8/4 column split on desktop (≥900px)
- Sidebar visible with appropriate card active
- Icons match between sidebar and mobile bottom nav

## Testing Strategy

### Unit Tests

**New Component Tests:**
- `app/components/tournament-page/tournament-sidebar.test.tsx`
  - Renders all 4 sidebar cards
  - getCurrentSection() helper returns correct section
  - Passes isActive prop to correct card based on pathname
  - Handles missing user (no UserTournamentStatistics)
  - Handles empty groups (no GroupStandingsSidebar)

**Updated Component Tests:**
- `app/components/tournament-page/rules.test.tsx`
  - Accepts isActive prop
  - Shows active styling when isActive={true}
  - Shows "Estás aquí" subheader when active
  - Button has GavelIcon

- `app/components/tournament-page/user-tournament-statistics.test.tsx`
  - Accepts isActive prop
  - Shows active styling when isActive={true}
  - Button has BarChartIcon

- `app/components/tournament-page/group-standings-sidebar.test.tsx`
  - Accepts isActive prop
  - Shows active styling when isActive={true}
  - Button already has AssessmentIcon (verify it's still there)

- `app/components/tournament-page/friend-groups-list.test.tsx`
  - Accepts isActive prop
  - Shows active styling when isActive={true}
  - "Ver Grupos" button has PeopleIcon

- `app/components/tournament-bottom-nav/tournament-bottom-nav.test.tsx`
  - Renders 5 tabs (not 6)
  - No "Tournament" tab exists
  - Has "Reglas" tab with Gavel icon
  - Route detection includes /rules path
  - All icons have fontSize: 24
  - Tabs array updated correctly

### Visual Regression Tests

**Desktop (≥900px):**
- Sidebar visible on home page
- Sidebar visible on /rules page
- Sidebar visible on /stats page
- Sidebar visible on /results page
- Sidebar visible on /friend-groups page
- Active card has blue left border and background
- Non-active cards have default styling
- All card buttons have icons
- Max-width container centered on wide screens

**Mobile (<900px):**
- Bottom nav shows 5 tabs
- No "Tournament" tab
- "Reglas" tab exists
- All icons aligned vertically
- Active tab highlighted correctly
- Sidebar NOT visible

**Top Nav:**
- Background color spans full width
- Content respects max-width (868px)
- Centered on wide screens

### E2E Tests

**Desktop Navigation Flow:**
1. Start on home page → Sidebar visible, no active card
2. Click "Ver Reglas Completas" → Navigate to /rules, Rules card active
3. Click "Ver Detalle" (Stats) → Navigate to /stats, Stats card active
4. Click "Ver Resultados" → Navigate to /results, Tables card active
5. Click "Ver Grupos" → Navigate to /friend-groups, Groups card active
6. Click active card → Page refreshes/scrolls to top
7. Verify sidebar always visible throughout journey

**Mobile Navigation Flow:**
1. Start on home page → Bottom nav visible, no tab selected
2. Tap "Reglas" → Navigate to /rules, Reglas tab active
3. Tap "Stats" → Navigate to /stats, Stats tab active
4. Tap "Tablas" → Navigate to /results, Tablas tab active
5. Tap "Grupos" → Navigate to /friend-groups, Grupos tab active
6. Tap "Home" → Navigate to home, Home tab active
7. Verify sidebar NOT visible throughout journey

**Layout Consistency:**
1. Navigate to each page (home, rules, stats, results, friend-groups, friend-group/[id], qualified-teams, awards)
2. Verify all have same max-width (1200px)
3. Verify content aligned consistently
4. Verify sidebar appears on all except qualified-teams and awards (7 pages with sidebar total)
5. Verify 8/4 column split on all pages with sidebar (desktop ≥900px)

### Manual Testing Checklist

**Desktop (900px+):**
- [ ] Sidebar visible on all tournament pages
- [ ] Active card styling appears correctly
- [ ] Active card is clickable (refreshes page)
- [ ] Sidebar scrolls if content tall
- [ ] Top nav centered with max-width
- [ ] All card buttons have icons
- [ ] Main nav tabs only highlight PARTIDOS/CLASIFICADOS/PREMIOS

**Mobile (<900px):**
- [ ] Bottom nav shows 5 tabs
- [ ] "Reglas" tab navigates to rules page
- [ ] No "Tournament" tab visible
- [ ] All icons aligned vertically
- [ ] Active tab highlights correctly
- [ ] Sidebar hidden on all pages

**Responsive Breakpoints:**
- [ ] Test at 899px (sidebar hidden)
- [ ] Test at 900px (sidebar appears)
- [ ] Test at 1200px (content centered)
- [ ] Test at 1600px (wide screen, centered)

**Accessibility:**
- [ ] Keyboard navigation works for sidebar cards
- [ ] Active card has proper ARIA labels
- [ ] Screen reader announces active state
- [ ] Bottom nav tabs have proper ARIA labels

## Validation Considerations

### SonarCloud Requirements

**Coverage Target:** 80% on new code

**New Files:**
- `tournament-sidebar.tsx` - Need unit tests (render, active state detection)
- `tournament-sidebar.test.tsx` - Test file itself

**Modified Files:**
- All sidebar card components - Test isActive prop behavior
- Bottom nav - Test updated tabs array and route detection
- Layout - Integration test with sidebar (may need E2E instead of unit)

**Test Scenarios to Cover:**
1. TournamentSidebar renders all cards conditionally
2. getCurrentSection() returns correct value for each route
3. isActive prop passed correctly to each card
4. Active styling applied when isActive={true}
5. Bottom nav tabs array has correct 5 items
6. Bottom nav route detection includes /rules

**Complexity Concerns:**
- Layout component becomes more complex (data fetching + structure)
- Keep layout logic simple, delegate to TournamentSidebar
- Ensure testability by separating concerns

### Quality Gates

**0 New Issues (Any Severity):**
- No unused imports (ESLint)
- No type errors (TypeScript strict mode)
- Proper prop types for all components
- No accessibility violations

**Security Rating: A**
- No security concerns (UI-only changes)
- No new authentication/authorization logic

**Maintainability: B or Higher**
- Extract TournamentSidebar as separate component (good separation)
- Keep layout focused on structure, delegate rendering
- Use consistent patterns across sidebar cards

**Duplicated Code: <5%**
- Reuse getCurrentSection() helper (don't duplicate)
- Consistent active state styling pattern (define once)
- Reuse Grid patterns from existing code

## Edge Cases & Error Handling

**Edge Cases:**
1. **User not logged in:**
   - UserTournamentStatistics card should NOT render
   - Layout should handle user being undefined
   - Other cards still visible

2. **No groups in tournament:**
   - GroupStandingsSidebar should NOT render
   - Conditional rendering already exists in code

3. **No friend groups:**
   - FriendGroupsList still renders (with "Crear Grupo" button)
   - Existing behavior maintained

4. **Mobile breakpoint edge (899px → 900px):**
   - Sidebar should smoothly appear/disappear
   - MUI breakpoints handle this automatically
   - Test smooth transition

5. **Very long sidebar content:**
   - Sidebar scrollable with hidden scrollbar
   - Already implemented in home page code

6. **Qualified teams and awards pages:**
   - Story doesn't specify adding sidebar to these pages
   - Keep them without sidebar (as is)
   - Future enhancement if needed

**Error Handling:**
- Layout data fetching failures already handled by parent
- getCurrentSection() returns null for unknown routes (safe)
- Sidebar cards gracefully handle missing data (existing behavior)

## Performance Considerations

**Data Fetching Trade-off:**
- Moving sidebar data fetching to layout means fetching on ALL pages
- Previously only fetched on home page
- Trade-off: Slightly slower page loads vs. better UX (persistent sidebar)
- Mitigation: Next.js caching, data is small (< 10KB total)

**Rendering Performance:**
- TournamentSidebar is client component (uses usePathname)
- But child cards are mostly server components (good)
- Active state detection is fast (simple string comparison)

**Bundle Size:**
- New component adds ~2KB gzipped
- No new dependencies
- Icons already imported (no additional weight)

**Optimization Opportunities (Future):**
- Consider React.memo() for TournamentSidebar
- Consider SWR or React Query for sidebar data caching
- Not needed for MVP (data is fast to fetch)

## Open Questions

1. **Should qualified-teams and awards pages also have sidebar?**
   - Story doesn't specify
   - Recommendation: NO (they're less frequently accessed)
   - Can add in future iteration if needed

2. **Should clicking active sidebar card scroll to top or just stay put?**
   - Story says "acts as refresh/scroll-to-top"
   - Recommendation: Default Next.js Link behavior (scrolls to top)
   - No custom implementation needed

3. **Should sidebar remain expanded/collapsed state persist across pages?**
   - Story doesn't specify
   - Recommendation: NO (cards start collapsed by default)
   - Consistent experience across page transitions

4. **What happens on tablet breakpoint (768px-899px)?**
   - Story focuses on <900px vs ≥900px
   - Recommendation: Follow desktop pattern at 900px+
   - Sidebar hidden below 900px (mobile nav shown)

## Success Metrics

**Objective Measures:**
- [ ] Sidebar visible on 5+ pages (home, rules, stats, results, friend-groups)
- [ ] Bottom nav has exactly 5 tabs (not 6)
- [ ] Rules page accessible from mobile (new capability)
- [ ] 0 new SonarCloud issues
- [ ] 80%+ test coverage on new code
- [ ] All E2E tests passing

**Subjective Measures (User Testing):**
- Users can navigate between sections without returning to home
- Mobile users can access Rules page
- Layout feels consistent across all pages
- Active card indication is clear and helpful

## Rollout Plan

**Phase 1: Development (This Story)**
- Implement all changes described above
- Full test coverage
- Pass all quality gates

**Phase 2: Testing**
- Manual testing on desktop (multiple breakpoints)
- Manual testing on mobile devices
- Accessibility audit
- Visual regression testing

**Phase 3: Deployment**
- Deploy to Vercel preview
- User acceptance testing
- Monitor for issues

**Phase 4: Future Enhancements (Out of Scope)**
- Add sidebar to qualified-teams and awards pages (if desired)
- Swipe gestures between sidebar sections on mobile
- Customizable sidebar card order
- Persistent sidebar state (collapsed/expanded)

## Dependencies

**Blocked By:** None

**Depends On:**
- #114 - Unified Games Page (completed)
- #129 - Tables & Results page (completed)

**Blocks:**
- Future navigation improvements
- User analytics on section access patterns

## Timeline Estimate

**Development:** 3-4 days

- Day 1: Create TournamentSidebar, update layout, add isActive props
- Day 2: Update bottom nav, fix icons, update individual pages
- Day 3: Testing, bug fixes, accessibility audit
- Day 4: Final polish, documentation, deployment prep

**Risk Factors:**
- Layout refactor may uncover edge cases (+0.5 day)
- Test coverage requirement may take longer (+0.5 day)
- Visual polish and alignment issues (+0.5 day)

## Conclusion

This implementation provides consistent navigation across all tournament pages on both desktop and mobile. The persistent sidebar improves desktop UX by eliminating the need to return home for section access, while the updated bottom nav improves mobile UX by removing redundancy and adding Rules access.

**Key Technical Decisions:**
1. Move sidebar to layout (persistent across pages)
2. Extract TournamentSidebar component (separation of concerns)
3. Use isActive prop pattern (consistent active state indication)
4. Centralize max-width in layout (consistent page widths)
5. Update bottom nav tabs (remove redundancy, add Rules)

**Expected Outcomes:**
- 100% feature accessibility on desktop
- 100% feature accessibility on mobile
- Consistent layout across all pages
- Improved navigation UX
- No technical debt introduced

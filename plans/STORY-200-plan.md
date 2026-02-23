# Implementation Plan: Page Layout & Scrolling Consistency - 5 Fixes

## Story Context

**Issue #200:** [UX] Page Layout & Scrolling Consistency - 5 Fixes

This story addresses inconsistent page layout patterns, scrolling behaviors, alert banner handling, and prediction dashboard consistency across the application.

**User's additional requirements:**
1. Apply Tournament Layout header max-width pattern to Application Layout (Header component)
2. Apply Tournament Layout tonal backgrounds and scroll shadows to App home page
3. Remove paddings on Awards and Qualified Teams pages that narrow the content unnecessarily

## Objectives

1. **Remove Duplicative Page Titles** - Results, Qualified Teams, and User Stats pages have titles that duplicate tab navigation
2. **Remove ThirdPlaceSummary Component** - Qualified Teams page has prominent summary component creating visual clutter
3. **Unified Predictions Dashboard** - Add CompactPredictionDashboard to Qualified Teams and Awards pages for consistency
4. **Fixed Header Pattern (Desktop Only)** - Qualified Teams and User Stats pages need fixed headers on desktop, full page scroll on mobile
5. **Convert Alert Banners to Closable Overlays** - Qualified Teams and Awards pages have fixed Alert components taking permanent space
6. **Header Max-Width Consistency** - Application header needs max-width like Tournament header
7. **Tonal Backgrounds & Scroll Shadows** - App home page needs consistent styling

## Technical Approach

### Fix 1: Remove Page Titles

**Files to modify:**
- `app/[locale]/tournaments/[id]/results/page.tsx` (lines 65-72)
- `app/components/qualified-teams/qualified-teams-client-page.tsx` (lines 255-263)
- `app/[locale]/tournaments/[id]/stats/page.tsx` - No page title found

**Implementation:**
- Results page: Remove Typography component with "Results & Tables" title
- Qualified Teams: Remove entire header Box (lines 255-263) by setting `showHeader={false}` default or removing the header entirely
- Stats page: Already has no page title, verify no changes needed

### Fix 2: Remove ThirdPlaceSummary Component

**Files to modify:**
- `app/components/qualified-teams/qualified-teams-client-page.tsx` (lines 306-313)

**Implementation:**
- Remove entire conditional block that renders `<ThirdPlaceSummary />` component
- Keep the component file for potential future use but remove from UI
- Third place qualification status still visible via checkboxes in groups grid

### Fix 3: Unified Predictions Dashboard

**Files to modify:**
- `app/[locale]/tournaments/[id]/qualified-teams/page.tsx` (server component)
- `app/components/qualified-teams/qualified-teams-client-page.tsx` (client component)
- `app/[locale]/tournaments/[id]/awards/page.tsx` (server component)
- `app/components/awards/award-panel.tsx` (client component)

**Implementation:**

**Qualified Teams Page:**
1. **Server component** (`qualified-teams/page.tsx`):
   - Import `getTournamentPredictionCompletion` from `db/tournament-prediction-completion-repository`
   - Import `getAllTournamentGames`, `getTournamentGameCounts` from `db/game-repository`
   - Import `getTeamsMap` from `actions/tournament-actions`
   - Import `findGameGuessesByUserId` from `db/game-guess-repository`
   - Fetch tournament prediction completion data
   - Fetch games for tournament (`getAllTournamentGames` returns `ExtendedGameData[]`)
   - Fetch game guesses to get predicted games count
   - Fetch tournament data to get boost limits (max_silver_games, max_golden_games)
   - Pass to client component as props (games, teamsMap, tournamentPredictionCompletion, tournamentStartDate, gameGuessesArray, tournament)

2. **Client component** (`qualified-teams-client-page.tsx`):
   - Import `CompactPredictionDashboard` from `../compact-prediction-dashboard`
   - Import `GuessesContextProvider` from `../context-providers/guesses-context-provider`
   - Import `customToMap` from `../utils/ObjectUtils` to convert gameGuesses array to map
   - Add new props: `games`, `teamsMap`, `tournamentPredictionCompletion`, `tournamentStartDate`, `gameGuessesArray`, `tournament`
   - **Wrap entire component in `GuessesContextProvider`** (CRITICAL - dashboard depends on GuessesContext):
     ```tsx
     <GuessesContextProvider
       gameGuesses={gameGuessesMap}
       autoSave={true}
       tournamentMaxSilver={tournament.max_silver_games || 0}
       tournamentMaxGolden={tournament.max_golden_games || 0}
     >
       {/* Existing content */}
     </GuessesContextProvider>
     ```
   - Convert gameGuesses array to map: `const gameGuessesMap = customToMap(gameGuessesArray, (g) => g.game_id)`
   - Render dashboard at top of Container, before locked alert
   - Dashboard props: `totalGames={games.length}`, `predictedGames={gameGuessesArray.length}`, `tournamentPredictions={tournamentPredictionCompletion}`, `tournamentId={tournament.id}`, `tournamentStartDate`, `games`, `teamsMap`

**Awards Page:**
1. **Server component** (`awards/page.tsx`):
   - Import `getTournamentPredictionCompletion` from `db/tournament-prediction-completion-repository`
   - Import `getAllTournamentGames`, `getTournamentGameCounts` from `db/game-repository`
   - Import `findGameGuessesByUserId` from `db/game-guess-repository`
   - Import `getTeamsMap` from `actions/tournament-actions`
   - Fetch tournament prediction completion data (need tournament object for getTournamentPredictionCompletion)
   - Fetch games (`getAllTournamentGames` returns `ExtendedGameData[]`)
   - Fetch game guesses array
   - Fetch tournament start date (earliest game date from games array)
   - Pass to client component: games, gameGuessesArray, tournamentPredictionCompletion, tournamentStartDate, teamsMap, tournament

2. **Client component** (`award-panel.tsx`):
   - Import `CompactPredictionDashboard` from `../compact-prediction-dashboard`
   - Import `GuessesContextProvider` from `../context-providers/guesses-context-provider`
   - Import `customToMap` from `../utils/ObjectUtils`
   - Add new props: `games`, `gameGuessesArray`, `tournamentPredictionCompletion`, `tournamentStartDate`, `teamsMap`, (tournament already exists)
   - **Wrap entire component return in `GuessesContextProvider`** (CRITICAL):
     ```tsx
     export default function AwardsPanel({ ... }) {
       const gameGuessesMap = customToMap(gameGuessesArray, (g) => g.game_id)

       return (
         <GuessesContextProvider
           gameGuesses={gameGuessesMap}
           autoSave={true}
           tournamentMaxSilver={tournament.max_silver_games || 0}
           tournamentMaxGolden={tournament.max_golden_games || 0}
         >
           <CompactPredictionDashboard ... />
           {/* Existing awards content */}
         </GuessesContextProvider>
       )
     }
     ```
   - Render dashboard at top, before locked alert/snackbar

**Pattern reference:** `app/components/unified-games-page.tsx` (lines 19-90) shows complete pattern for fetching data and wrapping in GuessesContextProvider

### Fix 4: Fixed Header Pattern (Desktop Only)

**Files to modify:**
- `app/components/qualified-teams/qualified-teams-client-page.tsx`
- `app/[locale]/tournaments/[id]/stats/page.tsx` or client component

**Implementation:**

**Qualified Teams (Desktop):**
- Use responsive layout pattern from `app/components/results-page/results-page-client.tsx` (lines 46-114)
- Current structure: `Container` (full page scroll, lines 254-362)
- New structure (desktop only, ≥960px):
  ```tsx
  // At component level
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Responsive container structure
  <Box sx={{
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    ...(isMobile && { overflow: 'auto' }) // Mobile: full page scroll
  }}>
    {/* Fixed header (desktop) */}
    <Box sx={{ flexShrink: 0 }}>
      <CompactPredictionDashboard ... />
    </Box>

    {/* Scrollable content (desktop) */}
    {isMobile ? (
      // Mobile: No ScrollShadowContainer, groups render directly
      <Box sx={{ px: 2, py: 2 }}>
        <QualifiedTeamsGrid ... />
      </Box>
    ) : (
      // Desktop: Scrollable with shadows
      <ScrollShadowContainer
        direction="vertical"
        hideScrollbar={true}
        sx={{ flex: 1, minHeight: 0, px: 2, py: 2 }}
      >
        <QualifiedTeamsGrid ... />
      </ScrollShadowContainer>
    )}
  </Box>
  ```
- Remove Container wrapper (conflicts with parent ScrollableContentArea from tournament layout)
- Mobile: Use `useMediaQuery(theme.breakpoints.down('md'))` to switch to full page scroll

**User Stats:**
- Current structure: StatsTabs renders at root (lines 204-217 in stats/page.tsx)
- StatsTabs already exists, currently scrolls full page
- **No changes needed** - Stats page already matches the desired pattern (tabs at top, content scrolls)

**Pattern reference:**
- Results page client: `app/components/results-page/results-page-client.tsx` (lines 46-114)
- Tabs structure: `app/components/tournament-stats/stats-tabs.tsx` for responsive tabs pattern

### Fix 5: Convert Alert Banners to Closable Overlays

**Files to modify:**
- `app/components/qualified-teams/qualified-teams-client-page.tsx` (lines 300-304)
- `app/components/awards/award-panel.tsx` (lines 133-137)

**Implementation:**
- Replace Alert with Snackbar component (import from @mui/material)
- Use Info severity (blue) for consistency
- Add close button via `onClose` prop
- Position at bottom of viewport (`anchorOrigin: { vertical: 'bottom', horizontal: 'center' }`)
- Store dismissal state in localStorage with key: `dismissedLocked_${tournamentId}_qualifiedTeams` or `_awards`
- Use useState + useEffect to manage dismissal state
- Icon: LockIcon (already imported)
- **Dismissal behavior:**
  - Show Snackbar if `isLocked === true` AND not dismissed
  - On user dismiss: Store `true` in localStorage for that tournament+page
  - Dismissal persists across sessions (localStorage indefinitely)
  - **If tournament lock status changes** (locked → unlocked), dismissal state should NOT reset (user already knows)
  - Strategy: Per-tournament dismissal, persist indefinitely (user controls visibility)

**Pattern reference:** Existing Snackbar usage in `qualified-teams-client-page.tsx` (lines 329-349) and `award-panel.tsx` (lines 298-302)

**localStorage utility:**
- Create `app/utils/dismissal-storage.ts` with helpers:
  - `getDismissalState(key: string): boolean` - Returns false if key not in localStorage
  - `setDismissalState(key: string, dismissed: boolean): void` - Stores boolean in localStorage
  - Keys: `dismissedLocked_${tournamentId}_qualifiedTeams` and `dismissedLocked_${tournamentId}_awards`

### Fix 6: Header Max-Width Consistency (User Requirement 1a)

**Files to modify:**
- `app/components/header/header.tsx`

**Current state:**
- Tournament header has max-width: 1200px wrapper (lines 137-142 in tournament layout)
- App header has no max-width constraint

**Implementation:**
- Wrap header content in centered max-width container
- **Responsive behavior:** Apply max-width on all screen sizes (consistent with tournament layout)
- Tournament header pattern from `app/[locale]/tournaments/[id]/layout.tsx` (lines 129-143):
  - Outer Box: `display: 'flex'`, `justifyContent: 'center'`, `width: '100%'` (centers content)
  - Inner Box: `width: '100%'`, `maxWidth: '1200px'`, `px: 2` (constrains content, adds padding)
- Current header structure (lines 26-74):
  - AppBar → Box (display flex row) → [Logo, Title, Actions]
- New structure:
```tsx
<AppBar position={'sticky'}>
  {/* Outer wrapper: centers content */}
  <Box sx={{
    display: 'flex',
    justifyContent: 'center',
    width: '100%'
  }}>
    {/* Inner wrapper: max-width constraint */}
    <Box sx={{
      width: '100%',
      maxWidth: '1200px',
      display: 'flex',
      flexDirection: 'row',
      px: 2,
      py: 1,
      gap: 2,
      justifyContent: 'space-between'
    }}>
      {/* Existing header content (Logo, Title, Actions) */}
    </Box>
  </Box>
</AppBar>
```

### Fix 7: Tonal Backgrounds & Scroll Shadows (User Requirement 1b)

**Files to modify:**
- `app/[locale]/layout.tsx` - Wrap children appropriately
- `app/components/home/home-component.tsx` - Add scroll container

**Current state:**
- Tournament pages use `ScrollableContentArea` component which provides:
  - Tonal background: `alpha(theme.palette.primary.main, 0.06)`
  - ScrollShadowContainer with scroll shadows
- App home has no scroll management or tonal background

**Implementation:**

**Chosen Approach: Option B - Wrap in home component** (granular control, only home page affected)

**Reason:** Tournament layout applies ScrollableContentArea to all tournament pages (matches, results, qualified teams, awards, stats). App layout should match - apply to all app-level pages OR only home. Since user only mentioned "app home", applying only to home is appropriate and prevents unintended visual changes on other pages (e.g., auth pages, settings, friends pages if they exist).

**Steps:**
1. Import ScrollableContentArea in `home-component.tsx`:
   ```tsx
   import ScrollableContentArea from '../tournament-page/scrollable-content-area'
   ```

2. Wrap Grid container (currently lines 26-80):
   ```tsx
   return (
     <ScrollableContentArea>
       <Grid container spacing={2} maxWidth={'1000px'} mx={'auto'}>
         {/* Existing content */}
       </Grid>
     </ScrollableContentArea>
   )
   ```

3. Remove `p={2}` from Grid (ScrollableContentArea provides padding via ScrollShadowContainer)

**Pattern reference:**
- `app/components/tournament-page/scrollable-content-area.tsx` (component implementation)
- Tournament layout usage: `app/[locale]/tournaments/[id]/layout.tsx` (line 262)

### Fix 8: Remove Content-Narrowing Paddings (User Requirement 2)

**Files to modify:**
- `app/components/awards/award-panel.tsx` (lines 138, 231)

**Current state:**
- Cards have `maxWidth: '800px'` which narrows content unnecessarily
- Container already has `maxWidth: '1200px'` from layout

**Implementation:**
- Remove `sx={{ maxWidth: '800px', mr: 'auto', ml: 'auto'}}` from both Card components (Podium card line 138, Individual awards card line 231)
- Let cards expand to full container width
- Keep spacing between cards (`marginTop: '24px'` on line 231)

## Visual Prototypes

### Qualified Teams Page (Desktop - ≥960px)

**Before:**
```
┌─────────────────────────────────────┐
│ Qualified Teams                     │ ← Page title (REMOVE)
├─────────────────────────────────────┤
│ 🔒 Predictions locked (fixed Alert) │ ← Alert (CONVERT to Snackbar)
├─────────────────────────────────────┤
│ Third Place Summary Card            │ ← ThirdPlaceSummary (REMOVE)
│ • Team A, Team B (2/4)             │
├─────────────────────────────────────┤
│                                     │
│  Groups Grid (scrolls)              │
│                                     │
└─────────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────────┐
│ [FIXED HEADER AREA]                 │
│ ┌─────────────────────────────────┐ │
│ │ CompactPredictionDashboard      │ │ ← NEW: Dashboard
│ │ Games: 32/48 (67%)              │ │
│ │ Tournament: 85%                 │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│                                     │
│  [SCROLLABLE CONTENT]               │
│                                     │
│  Groups Grid (scrolls independently)│
│                                     │
└─────────────────────────────────────┘

[Snackbar at bottom - dismissible]
🔒 Predictions locked [X]
```

### Awards Page (Desktop)

**Before:**
```
┌─────────────────────────────────────┐
│ 🔒 Predictions locked (fixed Alert) │ ← Alert (CONVERT to Snackbar)
├─────────────────────────────────────┤
│     ┌───────────────────┐           │ ← Narrow cards (800px)
│     │ Podium Card       │           │
│     │                   │           │
│     └───────────────────┘           │
│     ┌───────────────────┐           │
│     │ Individual Awards │           │
│     │                   │           │
│     └───────────────────┘           │
└─────────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ CompactPredictionDashboard      │ │ ← NEW: Dashboard
│ │ Games: 32/48 (67%)              │ │
│ │ Tournament: 85%                 │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │ ← Full width cards
│ │ Podium Card                     │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Individual Awards Card          │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

[Snackbar at bottom - dismissible]
🔒 Predictions locked [X]
```

### Mobile Pattern (<960px)

All pages use **full page scroll** - no fixed headers, no sticky positioning. ScrollShadowContainer direction changes based on `useMediaQuery(theme.breakpoints.down('md'))`.

## Responsive Behavior

| Page | Desktop (≥960px) | Mobile (<960px) |
|------|-----------------|-----------------|
| **Qualified Teams** | Dashboard fixed, groups scroll | Full page scroll |
| **Awards** | Dashboard only, forms scroll | Full page scroll |
| **User Stats** | Tabs fixed, cards scroll | Full page scroll |
| **Results** | Tabs fixed, content scrolls | Full page scroll (existing) |
| **Home (Matches)** | Dashboard/filters fixed, games scroll | Full page scroll (existing) |

## Files to Create

1. `app/utils/dismissal-storage.ts` - localStorage helpers for dismissible overlays

## Files to Modify

### Fix 1 - Remove Page Titles:
1. `app/[locale]/tournaments/[id]/results/page.tsx`
2. `app/components/qualified-teams/qualified-teams-client-page.tsx`

### Fix 2 - Remove ThirdPlaceSummary:
3. `app/components/qualified-teams/qualified-teams-client-page.tsx`

### Fix 3 - Unified Dashboard:
4. `app/[locale]/tournaments/[id]/qualified-teams/page.tsx`
5. `app/components/qualified-teams/qualified-teams-client-page.tsx`
6. `app/[locale]/tournaments/[id]/awards/page.tsx`
7. `app/components/awards/award-panel.tsx`

### Fix 4 - Fixed Header Pattern:
8. `app/components/qualified-teams/qualified-teams-client-page.tsx`
9. `app/[locale]/tournaments/[id]/stats/page.tsx` or stats client component

### Fix 5 - Closable Overlays:
10. `app/components/qualified-teams/qualified-teams-client-page.tsx`
11. `app/components/awards/award-panel.tsx`

### Fix 6 - Header Max-Width:
12. `app/components/header/header.tsx`

### Fix 7 - Tonal Backgrounds:
13. `app/components/home/home-component.tsx`

### Fix 8 - Remove Paddings:
14. `app/components/awards/award-panel.tsx`

## Implementation Steps

1. **Fix 1: Remove page titles** (simple text removal)
2. **Fix 2: Remove ThirdPlaceSummary** (component removal)
3. **Create dismissal-storage utility** (new file)
4. **Fix 5: Convert alerts to snackbars** (straightforward replacement)
5. **Fix 8: Remove card maxWidth** (simple style change)
6. **Fix 6: Header max-width** (wrap content in centered container)
7. **Fix 7: Tonal backgrounds** (wrap home in ScrollableContentArea)
8. **Fix 3: Unified dashboard** (complex - data fetching + props)
   - Qualified Teams (server + client)
   - Awards (server + client)
9. **Fix 4: Fixed header pattern** (complex - responsive layout)
   - Qualified Teams (desktop/mobile split)
   - User Stats (desktop/mobile split)

## Testing Strategy

### Unit Tests (80% coverage requirement)

**New utility:**
- `app/utils/dismissal-storage.test.ts`
  - Test getDismissalState returns false for new keys
  - Test setDismissalState stores and retrieves correctly
  - Test localStorage mocking

**Modified components:**
- `qualified-teams-client-page.test.tsx` updates:
  - Remove tests for ThirdPlaceSummary
  - Add tests for CompactPredictionDashboard rendering
  - Add tests for Snackbar dismissal behavior
  - Add tests for responsive layout (desktop/mobile)

- `award-panel.test.tsx` updates:
  - Add tests for CompactPredictionDashboard rendering
  - Add tests for Snackbar dismissal behavior
  - Test full-width card rendering

- `header.test.tsx` updates:
  - Test max-width wrapper rendering
  - Test centered layout

**Pattern reference:** Existing test utilities in `@/__tests__/utils/test-utils` for theme/context setup

### Manual Testing Checklist

- [ ] **Fix 1:** Page titles removed from Results, Qualified Teams, User Stats
- [ ] **Fix 2:** ThirdPlaceSummary not visible on Qualified Teams page
- [ ] **Fix 3:** CompactPredictionDashboard visible on Qualified Teams and Awards pages with correct data
- [ ] **Fix 4:** Desktop (≥960px) - Qualified Teams has fixed dashboard, scrollable groups
- [ ] **Fix 4:** Desktop (≥960px) - User Stats has fixed tabs, scrollable cards
- [ ] **Fix 4:** Mobile (<960px) - All pages use full page scroll
- [ ] **Fix 5:** Snackbars dismissible, state persists in localStorage
- [ ] **Fix 6:** Header content max-width 1200px on app pages
- [ ] **Fix 7:** App home has tonal background and scroll shadows
- [ ] **Fix 8:** Awards cards use full width
- [ ] Dark mode: All fixes work correctly
- [ ] Light mode: All fixes work correctly
- [ ] Responsive: Mobile, tablet, desktop all tested
- [ ] Accessibility: WCAG AA contrast maintained, no regressions

## Validation Considerations

### SonarCloud Requirements:
- 0 new issues of any severity
- 80% coverage on new code (dismissal-storage utility, component changes)
- No code duplicates (reuse existing patterns)

### Performance:
- CompactPredictionDashboard adds minimal rendering overhead (uses useMemo, useCallback)
- localStorage operations are synchronous but fast
- ScrollShadowContainer uses ResizeObserver with debouncing (20ms)

### Accessibility:
- Snackbars use proper ARIA attributes (Alert component inherits)
- Dismissible overlays keyboard accessible (close button)
- No color-only indicators (icons + text)
- Contrast ratios maintained in both themes

## Dependencies

- Material-UI components: Box, Snackbar, Alert, IconButton
- Material-UI icons: LockIcon, CloseIcon
- React hooks: useState, useEffect, useMemo, useCallback, useRef
- useMediaQuery for responsive behavior
- Existing components: CompactPredictionDashboard, ScrollShadowContainer, ScrollableContentArea, GuessesContextProvider
- Database repositories: getTournamentPredictionCompletion, findGamesInTournament, findGameGuessesByUserId

## Open Questions

None - all requirements are clear from the issue description and user's additional requirements.

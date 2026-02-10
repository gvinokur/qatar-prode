# Implementation Plan: Story #112 - Unify Desktop Header to Match Mobile Pattern

## Story Context

**Issue:** #112 - [UXI] Unify Desktop Header to Match Mobile Pattern
**Priority:** Critical
**Effort:** Low (1-2 days)

### Current Problem
Desktop shows two separate headers on tournament pages:
1. Main app header (logo, title, theme, user menu) - always visible
2. Tournament-specific header (tournament logo, name) - on tournament pages

**Note:** Tab selection for tournament sections (groups, playoffs, qualified teams, etc.) is separate from the header and should follow mobile pattern with sub menu navigation.

Mobile has a cleaner experience by hiding the main header on tournament pages, showing only the tournament header. This creates:
- More screen space for content
- Single navigation context
- Cleaner interface

### Objective
Unify desktop to match mobile pattern: hide main app header on tournament pages, show only tournament header with all necessary actions accessible.

## Acceptance Criteria

- [ ] Desktop hides main header on all tournament pages (`/tournaments/{id}/*`)
- [ ] Desktop shows main header on non-tournament pages (`/`, `/profile`, etc.)
- [ ] Tournament header remains visible and functional on desktop
- [ ] User menu actions (Settings, Tutorial, Back Office, Sign Out, Delete Account) accessible from tournament header on desktop
- [ ] Theme switcher accessible from tournament header on desktop
- [ ] No visual glitches or layout shifts during header transitions
- [ ] Responsive behavior works across all desktop breakpoints (≥960px - Material-UI `md` breakpoint)
- [ ] All existing functionality preserved (navigation, authentication, theme switching)

## Technical Approach

### Overview
The solution involves two simple changes:
1. **Remove mobile-only restriction** from `ConditionalHeader` logic
2. **Show user actions on desktop** in tournament header (currently mobile-only)

### Current Implementation

**File:** `app/components/header/conditional-header.tsx`
```tsx
const isMobile = useMediaQuery(theme.breakpoints.down('md'))
const isTournamentPage = pathname.startsWith('/tournaments/')

if (isTournamentPage && isMobile) {
  return null  // Only hides on mobile
}
```

**File:** `app/tournaments/[id]/layout.tsx`
```tsx
// User actions and theme switcher currently hidden on desktop
<Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
  <ThemeSwitcher />
  <UserActions user={user} />
</Box>
```

### Proposed Changes

#### 1. Update ConditionalHeader Logic
**File:** `app/components/header/conditional-header.tsx`

Remove the `isMobile` check to apply hiding logic to all viewports:

```tsx
// Before:
const isMobile = useMediaQuery(theme.breakpoints.down('md'))
const isTournamentPage = pathname.startsWith('/tournaments/')
if (isTournamentPage && isMobile) {
  return null
}

// After:
const isTournamentPage = pathname.startsWith('/tournaments/')
if (isTournamentPage) {
  return null  // Hide on all viewports when on tournament pages
}
```

**Benefits:**
- Consistent behavior across all screen sizes
- Simpler logic (no media query needed)
- Matches mobile UX on desktop

**Considerations:**
- Remove `useMediaQuery` hook since no longer needed
- Remove `isMobile` variable
- Keep `usePathname` hook for route detection
- This change removes all responsive logic from ConditionalHeader, making breakpoint values irrelevant to this component

#### 2. Show User Actions on Desktop in Tournament Header
**File:** `app/tournaments/[id]/layout.tsx`

Change user actions container from mobile-only to always visible:

```tsx
// Before:
<Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
  <ThemeSwitcher />
  <UserActions user={user} />
</Box>

// After:
<Box sx={{ display: 'flex', gap: 1 }}>
  <ThemeSwitcher />
  <UserActions user={user} />
</Box>
```

**Benefits:**
- User actions accessible when main header is hidden
- Theme switcher remains accessible
- Consistent action placement across viewports

**Layout Implications:**
- Tournament header layout on desktop:
  - Left: Home link (La Maquina logo)
  - Center: Tournament logo + name
  - Right: Theme switcher + User actions (NEW on desktop)
- Mobile layout unchanged (already has these actions)
- Tab navigation for sections (groups, playoffs, qualified teams) is separate from header and follows mobile sub menu pattern

### Alternative Approaches Considered

#### Alternative 1: Keep main header, collapse it
**Rejected:** Doesn't achieve the goal of matching mobile pattern and maximizing content space.

#### Alternative 2: Only hide on specific tournament sub-routes
**Rejected:** Inconsistent experience. Better to hide on all tournament pages for simplicity.

#### Alternative 3: Add user actions to a different location
**Rejected:** Tournament header already has proper structure with user actions. Just need to make them visible on desktop.

## Visual Prototypes

### Current Desktop Layout (Before)
```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] La Maquina Prode          [🌙 Theme]  [👤 User Menu]    │ ← Main Header (Always visible)
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│ [Home] [Tournament Logo] Qatar 2022                             │ ← Tournament Header
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    Tournament Content                           │
│              (with tab navigation below header)                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Proposed Desktop Layout (After - Matches Mobile)
```
┌─────────────────────────────────────────────────────────────────┐
│ [Home] [Tournament Logo] Qatar 2022              [🌙] [👤]     │ ← Tournament Header (User actions now visible)
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    Tournament Content                           │
│                    (More vertical space!)                       │
│         (Tab navigation: groups, playoffs, qualified teams      │
│          shown as sub menu like mobile)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Non-Tournament Pages (Unchanged)
```
┌─────────────────────────────────────────────────────────────────┐
│ [Logo] La Maquina Prode          [🌙 Theme]  [👤 User Menu]    │ ← Main Header (Visible)
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    Home / Profile / Settings                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Component Placement Details

**Tournament Header Layout (Desktop - After Change):**
```
┌──────────────┬─────────────────────────┬─────────────────────────┐
│ Grid (3 col) │ Grid (9 col)            │ User Actions (NEW)      │
│              │                         │                         │
│ [Home Link]  │ [Logo] Tournament Name  │ [🌙 Theme] [👤 Menu]   │
│ La Maquina   │                         │                         │
└──────────────┴─────────────────────────┴─────────────────────────┘
```

**Note:** Tab selection for tournament sections (groups, playoffs, qualified teams, etc.) is separate and appears below the header as sub menu navigation, matching mobile pattern.

**Responsive Considerations:**
- Desktop (≥960px - Material-UI `md` breakpoint): Single-row header with tournament identity and actions
- Mobile (<960px): Stacked layout (tournament identity row with user actions)
- Theme switcher: Icon-only button (24x24px)
- User actions: Avatar (40x40px) with dropdown menu
- Tab navigation (groups, playoffs, qualified teams): Separate from header, follows mobile sub menu pattern
- **Note:** Menu positioning may need verification - UserActions component has hardcoded `mt: '45px'` offset designed for main header layout

## Files to Modify

### 1. `app/components/header/conditional-header.tsx`
**Changes:**
- Remove `useMediaQuery` hook import (no longer needed)
- Remove `isMobile` variable
- Change condition from `isTournamentPage && isMobile` to just `isTournamentPage`
- Simplify logic

**Current imports:**
```tsx
import { useMediaQuery } from '@mui/material'
```

**Updated imports:**
```tsx
// Remove useMediaQuery import
```

**Estimated lines changed:** ~5 lines

### 2. `app/tournaments/[id]/layout.tsx`
**Changes:**
- Remove responsive display constraint on user actions container
- Change `display: { xs: 'flex', md: 'none' }` to `display: 'flex'`
- Keep all other styling (gap, alignment, etc.)

**Estimated lines changed:** ~1 line (single prop change)

### 3. `app/components/header/__tests__/conditional-header.test.tsx`
**Changes:**
- Update test expectations to reflect new behavior
- Remove tests that verify mobile-only hiding
- Add tests that verify hiding on all viewports for tournament pages
- Ensure desktop viewport tests now expect header to hide on tournament pages

**Test scenarios to update:**
- Desktop + Tournament page: Should hide (currently expects visible)
- Desktop + Non-tournament page: Should show (no change)
- Mobile + Tournament page: Should hide (no change)
- Mobile + Non-tournament page: Should show (no change)

**Estimated lines changed:** ~20-30 lines

## Implementation Steps

### Phase 1: Update Conditional Header Logic
1. Open `app/components/header/conditional-header.tsx`
2. Remove `useMediaQuery` import from Material-UI
3. Remove `isMobile` variable declaration
4. Update condition to remove `isMobile` check
5. Verify logic: hide header when `pathname.startsWith('/tournaments/')`

### Phase 2: Update Tournament Layout
1. Open `app/tournaments/[id]/layout.tsx`
2. Locate user actions container (Box with ThemeSwitcher and UserActions)
3. Change `display` prop from `{ xs: 'flex', md: 'none' }` to `'flex'`
4. Verify layout grid remains intact

### Phase 3: Update Tests
1. Open `app/components/header/__tests__/conditional-header.test.tsx`
2. Review existing test cases
3. Update test for desktop + tournament page (should now hide)
4. Ensure all other tests remain valid
5. Run tests to verify: `npm test conditional-header`

### Phase 4: Manual Testing
1. Start dev server: `npm run dev`
2. Test scenarios:
   - Desktop: Navigate to home → verify main header visible
   - Desktop: Navigate to tournament page → verify main header hidden, tournament header visible with user actions
   - Desktop: Click user avatar → **CRITICAL: verify menu opens with correct positioning and all actions visible** (menu has hardcoded `mt: '45px'` designed for main header; may need adjustment for tournament header layout)
   - Desktop: Toggle theme → verify theme changes
   - Desktop: Navigate back to home → verify main header reappears
   - Desktop: Test nested tournament routes (`/tournaments/{id}/groups/A`, `/tournaments/{id}/stats`) → verify header hidden on all
   - Mobile: Verify no regression (should work same as before)
3. Test at breakpoint boundaries (960px - Material-UI `md` breakpoint)
4. Check for layout shifts or glitches

### Phase 5: Build & Lint
1. Run linter: `npm run lint`
2. Fix any linting issues
3. Run build: `npm run build`
4. Verify no build errors

## Testing Strategy

### Unit Tests
**File:** `app/components/header/__tests__/conditional-header.test.tsx`

**Test Cases to Update:**
1. ✅ Desktop viewport + Non-tournament page → Header visible
2. 🔄 Desktop viewport + Tournament page (`/tournaments/123`) → Header hidden (UPDATE: currently expects visible)
3. ✅ Mobile viewport + Non-tournament page → Header visible
4. ✅ Mobile viewport + Tournament page → Header hidden

**New Test Cases:**
- Desktop viewport + Nested tournament route (`/tournaments/123/groups/A`) → Header hidden
- Desktop viewport + Tournament stats route (`/tournaments/123/stats`) → Header hidden
- Desktop viewport + Other nested routes → Header hidden (ensure `pathname.startsWith('/tournaments/')` works correctly)

**Testing Approach:**
- Use existing test utilities: `renderWithTheme()` from `@/__tests__/utils/test-utils`
- Mock `usePathname` from `next/navigation` using `@/__tests__/mocks/next-navigation.mocks`
- Use Vitest `vi.mock()` for `usePathname`
- No need to mock Material-UI `useMediaQuery` (no longer used)

### Integration Tests
**Manual testing required:**
- Visual verification of header hiding/showing behavior
- User actions menu functionality on desktop
- Theme switching on desktop from tournament header
- Navigation flows (home ↔ tournament)
- Responsive behavior at breakpoint (900px)

### Visual Regression
**Verify:**
- No layout shifts when navigating between pages
- Tournament header maintains proper spacing
- User actions menu positioning correct
- Theme switcher icon visible and clickable

## Validation Considerations

### SonarCloud Requirements
- **Target:** 80% coverage on new code
- **Strategy:** Update existing tests (no new code, mostly removals)
- **Expected:** 100% coverage maintained (removing code, updating tests)

### Quality Gates
- 0 new issues of any severity
- No security vulnerabilities introduced
- No code duplication
- Maintainability rating: B or higher

### Pre-Merge Checklist
- [ ] All unit tests pass
- [ ] Lint passes with no errors
- [ ] Build succeeds
- [ ] Manual testing complete (all scenarios)
- [ ] No console errors or warnings
- [ ] No visual regressions
- [ ] SonarCloud analysis passes

## Risk Assessment

### Low Risk
- Simple logic changes (removing conditions, not adding complexity)
- No database changes
- No API changes
- Existing components reused (ThemeSwitcher, UserActions already work)
- Well-tested area of codebase

### Potential Issues
1. **User confusion:** Desktop users accustomed to two headers
   - **Mitigation:** Better UX long-term, matches mobile pattern
2. **Layout shift during navigation:** Header appearing/disappearing
   - **Mitigation:** Test thoroughly at different viewports, ensure smooth transitions
3. **User actions not accessible:** If tournament header fails to render actions
   - **Mitigation:** Tournament header already includes these components on mobile, just making them visible on desktop
4. **User menu positioning incorrect:** Menu has hardcoded `mt: '45px'` offset for main header layout; may render off-screen or incorrectly in tournament header
   - **Mitigation:** Test menu positioning in Phase 4; if incorrect, adjust Menu `anchorOrigin` or `transformOrigin` props in UserActions component or override sx prop for tournament header context

### Rollback Plan
If issues arise post-deployment:
1. Revert changes to `conditional-header.tsx` (restore mobile-only check)
2. Revert changes to tournament layout (restore mobile-only display)
3. Revert test updates
4. Deploy rollback

## Dependencies

### No Blocking Dependencies
- Uses existing components (ConditionalHeader, UserActions, ThemeSwitcher)
- No new libraries or packages
- No database migrations
- No API changes

### Related Work
- **Parent Issue:** #111 - Navigation audit
- **Future:** Desktop tabbed navigation story (will build on this unified header)

## Open Questions

### Resolved
- ✅ Should user actions be accessible on desktop when main header is hidden?
  - **Answer:** Yes, tournament header already includes them on mobile, just make visible on desktop
- ✅ Should theme switcher remain accessible?
  - **Answer:** Yes, included in tournament header user actions area
- ✅ What about non-authenticated users?
  - **Answer:** UserActions component already handles both states (Login button vs user menu)

### None Remaining
All requirements are clear from issue and codebase exploration.

## Success Metrics

### Functional
- [ ] Desktop header behavior matches mobile on tournament pages
- [ ] All user actions remain accessible
- [ ] Theme switching works from tournament header
- [ ] Navigation flows work correctly

### Technical
- [ ] All tests pass (unit + build + lint)
- [ ] SonarCloud analysis passes (0 new issues, 80%+ coverage)
- [ ] No console errors or warnings
- [ ] No performance regressions

### User Experience
- [ ] Cleaner interface on desktop tournament pages
- [ ] More vertical space for content
- [ ] Consistent mental model across devices
- [ ] No visual glitches or layout shifts

## Timeline

**Estimated Effort:** 1-2 days

**Breakdown:**
- Phase 1 (Conditional Header): 30 minutes
- Phase 2 (Tournament Layout): 15 minutes
- Phase 3 (Update Tests): 1-2 hours
- Phase 4 (Manual Testing): 1-2 hours
- Phase 5 (Build & Lint): 30 minutes
- Buffer for fixes: 2-4 hours

**Total:** 4-8 hours of active work

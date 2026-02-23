# Implementation Plan: Story #199 - Visual Consistency Improvements (6 UI Fixes)

## Story Context

**Issue:** #199 - [UX] Visual Consistency Improvements - 6 UI Fixes

This story addresses 6 visual/UX inconsistencies across the application to improve visual hierarchy, consistency, and user experience without changing functionality. These fixes were identified during a UX audit and target specific UI issues in the header, layout, sidebar, team cards, and locked state indicators.

## Objectives

Implement 6 independent UI fixes that improve visual consistency:

1. **Login Button Alignment** - Match login button styling with theme/language avatar badges
2. **Footer Gap + Heights** - Remove gap between content and footer, standardize heights to 56px
3. **Sidebar Prominence** - Reduce sidebar from 33% to 25% width (more space for main content)
4. **Elevation Inconsistency** - Use tonal backgrounds instead of mixed elevation styles
5. **Team Card Size** - Reduce team card size by ~20-25% for cleaner, less crowded appearance
6. **Locked State Color** - Standardize all locked states to use Info blue color

## Technical Approach

Each fix is independent and targets specific components. Changes are primarily CSS/styling adjustments with minimal logic changes.

### Fix #1: Login Button Alignment with Theme/Language Avatars

**Current State:**
- `app/components/header/user-actions.tsx` (lines 147-154): **Non-authenticated users see `<Button>` component** with text "LOG IN"
- Authenticated users (lines 92-110) already use Avatar (40x40px) - this is CORRECT and doesn't need changes
- ThemeSwitcher and LanguageSwitcher use `<Avatar>` components (40x40px, rounded, hover effects)
- Login button visually misaligned and inconsistent with avatar badges

**What's Wrong:**
- Login `<Button>` (non-authenticated state) uses default button styling (rectangular, text-based)
- This doesn't match the circular Avatar styling used by theme/language switchers
- Creates visual inconsistency in header alignment

**Proposed Changes:**
- Replace non-authenticated `<Button>` (lines 147-154) with `<Avatar>` component styled as compact rounded badge
- Match existing Avatar styling: 40px width/height, rounded variant, hover effects (scale 1.05)
- Display localized text inside Avatar: "LOG IN" or "INICIAR SESIÓN" based on current locale
- Use `useTranslations('navigation')` for localization (already imported at line 27)
- Apply similar sx props as ThemeSwitcher (lines 26-36): bgcolor, cursor, transition, hover effects

**Files to Modify:**
- `app/components/header/user-actions.tsx` - Update non-authenticated user UI only (lines 147-155)
- Do NOT modify authenticated user Avatar (lines 92-110) - already correct

**Visual Result:**
- Login button appears as rounded badge matching theme/language avatars
- Consistent 40px height across all header actions (theme, language, login/user)
- Unified hover behavior (scale 1.05, smooth transition)
- Text may need to be abbreviated or use smaller font to fit in 40px circle

### Fix #2: Remove Footer Gap + Standardize Footer/Nav Heights

**Current State (VERIFIED FROM CODE):**
- Footer: `app/components/home/footer.tsx` - `Toolbar` with `minHeight: 56` (line 83)
- Bottom Nav: `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx` - `height: 56` (line 74)
- Layout: `app/[locale]/tournaments/[id]/layout.tsx`:
  - Container Box: `height: 'calc(100vh - 56px)'` (line 124) - Already accounts for 56px bottom element
  - Main content Box (lines 246-252): Has `pb: 2` (bottom padding 16px)
  - Grid container (line 259): No bottom padding/margin specified
- Heights are already consistent at 56px

**The Gap Issue:**
According to original issue, there's a "visible gap between main content and footer (tournament layout only)". Based on code review:
- **Likely cause**: Main content Box has `pb: 2` (line 251) = 16px bottom padding
- **Result**: 16px gap between scrollable content bottom and footer top
- **Expected behavior**: Content should be flush with footer/nav (0px gap)

**Investigation During Implementation:**
1. Test in running app to confirm 16px gap exists
2. Check if ScrollShadowContainer (lines 262-268) adds any bottom margin/padding
3. Verify footer positioning (position: 'fixed', bottom: 0) is correct

**Proposed Changes:**
- Remove bottom padding from main content Box (line 246-252): `pb: 2` → `pb: 0`
- OR adjust container height calculation to account for padding: `calc(100vh - 56px - 16px)`
- Ensure Grid container (line 259) has no bottom margin
- Verify ScrollShadowContainer doesn't add bottom spacing

**Files to Modify:**
- `app/[locale]/tournaments/[id]/layout.tsx`:
  - Main content Box (line 246-252): Remove or reduce `pb: 2` to `pb: 0`
  - OR adjust container height (line 124) if padding is needed for other reasons

**Files to Verify (No changes expected):**
- `app/components/home/footer.tsx` - Footer positioning already correct (fixed, bottom: 0)
- `app/components/tournament-bottom-nav/tournament-bottom-nav.tsx` - Nav height already 56px

**Visual Result:**
- Content flush with footer (desktop) and bottom nav (mobile) - 0px gap
- No visible space between main content bottom and fixed bottom element
- Footer and nav both remain 56px height (already correct)

**Implementation Note:**
This fix requires visual verification in running app first. The solution is straightforward (remove pb: 2), but confirm gap exists and that removing padding doesn't break other layouts.

### Fix #3: Reduce Sidebar Prominence (4 cols → 3 cols)

**Current State:**
- Main content: Grid size={{ xs: 12, md: 8 }} → 66.67% width (line 261 in layout.tsx)
- Sidebar: Grid size={{ xs: 12, md: 4 }} → 33.33% width (line 58 in tournament-sidebar.tsx)
- Sidebar sections use Card components with headers (need to investigate font sizes)

**Proposed Changes:**

**Grid Layout (CLEAR):**
- Change main content grid: `size={{ xs: 12, md: 9 }}` → 75% width (line 261 in layout.tsx)
- Change sidebar grid: `size={{ xs: 12, md: 3 }}` → 25% width (line 58 in tournament-sidebar.tsx)

**Font Size Reductions (NEED TO INVESTIGATE DURING IMPLEMENTATION):**
- Target: Reduce sidebar section header fonts from ~16px to ~14px
- **IMPORTANT: Do NOT use custom fontSize** - must use theme typography variants or add new variant to theme
- During implementation: Read each sidebar section component to identify header elements
- Components to check:
  - `app/components/tournament-page/group-standings-sidebar.tsx`
  - `app/components/tournament-page/user-tournament-statistics.tsx`
  - `app/components/tournament-page/friend-groups-list.tsx`
  - `app/components/tournament-page/rules.tsx`
- Look for: Typography variant="h6" (default 20px) or CardHeader title props
- Change to: Typography variant="subtitle1" (16px) **OR** add new theme variant if needed (e.g., "subtitle2")
- Rule: Do NOT reduce if current font is already ≤14px
- If no suitable variant exists: Add to theme configuration (app/components/context-providers/theme-provider.tsx)

**Files to Modify:**
- `app/[locale]/tournaments/[id]/layout.tsx` - Main content grid (line 261) - **DEFINITE**
- `app/components/tournament-page/tournament-sidebar.tsx` - Sidebar grid (line 58) - **DEFINITE**
- Sidebar section components (list above) - **INVESTIGATE FIRST**, then modify if headers found

**Visual Result:**
- Main content gets +8.33% more horizontal space (from 66.67% to 75%)
- Clearer visual hierarchy (main content more prominent)
- Sidebar headers slightly smaller but still readable
- Desktop only (mobile sidebar hidden)

**Implementation Note:**
Grid changes are straightforward. Font size changes require reading each sidebar section component first to identify current header typography before making changes.

### Fix #4: Sidebar/Main Content Elevation Inconsistency

**Current State:**
- Main content: Wrapped in `ScrollShadowContainer` (no elevation, transparent background) - lines 262-268 in layout.tsx
- Sidebar: Contains `Paper elevation={1}` wrapper (line 76 in tournament-sidebar.tsx) around all content
- Creates visual inconsistency: sidebar appears "floating" while main content flat

**Proposed Changes:**
- Remove `Paper elevation={1}` wrapper from sidebar (line 76)
- Add tonal background to both regions using theme-aware alpha:
  - Main content container: `alpha(theme.palette.primary.main, 0.02)` (subtle tonal)
  - Sidebar container: `alpha(theme.palette.primary.main, 0.04)` (slightly brighter to differentiate)
- **Add padding to tonal background containers:**
  - Main content: Add `p: 2` (16px padding) to Box with tonal background to prevent content flush with edges
  - Sidebar: Add `p: 2` (16px padding) to Grid with tonal background
- **Ensure spacing between main and sidebar:**
  - Grid container (line 259) must have `spacing={2}` prop to create gap between main and sidebar
  - This creates 16px gap between the two tonal regions
- Both regions clearly defined without elevation conflict
- All cards (within main and sidebar) keep their existing elevation level (elevation={1})

**Dark Mode Considerations:**
- Use MUI `alpha()` helper function (import from '@mui/material/styles')
- Alpha overlays work in both light and dark mode (tested pattern in Material Design 3)
- Alternative if alpha doesn't work: Use `theme.palette.action.hover` (theme-aware background)
- Test early in implementation to verify visibility in dark mode

**Files to Modify:**
- `app/[locale]/tournaments/[id]/layout.tsx`:
  - Add tonal background to main content Box (lines 246-252) with `p: 2` padding
  - Ensure Grid container (line 259) has `spacing={2}` prop
- `app/components/tournament-page/tournament-sidebar.tsx`:
  - Remove Paper wrapper (line 76)
  - Add tonal background to outer Grid with `p: 2` padding

**Visual Result:**
- Both regions have subtle tonal backgrounds (Material Design 3 pattern)
- Sidebar slightly brighter (0.04 vs 0.02 alpha) for visual separation
- No elevation conflict or "floating" appearance
- Works in both light and dark modes (verified with alpha function)

**Testing Priority:**
- Test dark mode FIRST after implementing (high risk area)
- If alpha backgrounds not visible in dark mode, switch to `theme.palette.action.hover`

### Fix #5: Reduce Team Card Size + Fix Content Crowding

**Current State (VERIFIED FROM CODE):**
- `app/components/qualified-teams/draggable-team-card.tsx`:
  - Position indicator: minWidth/height 48px (line 187-188), fontSize '1.1rem' (line 196)
  - Team name: variant="h6" (line 209) - MUI default ~20.02px
  - Chip label: size="small", fontSize '0.75rem' (line 338-339), fontWeight 600
  - Status explanation text: fontSize '0.65rem' (line 348)
  - Card padding: p: 2 (line 452) - MUI default 16px
  - Status shows icon (CheckCircleIcon/CancelIcon/HourglassEmptyIcon at lines 298-314) + chip + text

**Proposed Changes (SPECIFIC REDUCTIONS):**
- Position indicator (PositionBadge component, lines 182-203):
  - minWidth: 48 → 40
  - height: 48 → 40
  - fontSize: '1.1rem' → '0.9rem' (reduces from ~17.6px to ~14.4px, -18%)

- Team name (TeamInfo component, line 209):
  - variant: "h6" → "subtitle1" (reduces from ~20px to ~16px, -20%)

- Chip label (ResultsOverlay, line 338-339):
  - fontSize: '0.75rem' → '0.6875rem' (reduces from ~12px to ~11px, -8%)
  - Keep fontWeight: 600

- Status text (ResultsOverlay, line 348):
  - fontSize: '0.65rem' → '0.6rem' (reduces from ~10.4px to ~9.6px, -8%)

- Card padding (CardContent, line 452):
  - p: 2 → p: 1.5 (reduces from 16px to 12px, -25%)

- Remove status icon (ResultsOverlay, lines 330-333):
  - Remove `<Box>` wrapper containing icon (CheckCircleIcon, CancelIcon, HourglassEmptyIcon)
  - Keep chip with label (already color-coded)
  - Keep explanation text below chip
  - Icon is redundant - color-coded chip already shows state

**IMPORTANT: Keep all color coding:**
- Green borders/chips for points awarded (success.main, success.light)
- Red borders/chips for no points (error.main, error.light)
- Blue borders/chips for pending states (info.main, info.light)

**Files to Modify:**
- `app/components/qualified-teams/draggable-team-card.tsx` (only file):
  - PositionBadge component (lines 182-203): Update minWidth, height, fontSize
  - TeamInfo component (line 209): Change Typography variant
  - ResultsOverlay component (lines 250-360): Update Chip fontSize, status text fontSize, remove icon Box
  - CardContent (line 447-454): Change p: 2 to p: 1.5

**Visual Result:**
- Team cards ~20-25% more compact vertically (measured reduction)
- Position badges smaller but still prominent
- Team names slightly smaller but readable
- Status information more compact without redundant icon
- Color coding preserved (critical for UX - green/red/blue)
- Maintains WCAG AA readability (all fonts ≥9.6px)

### Fix #6: Inconsistent Locked State Color Coding

**Current State (PARTIAL - NEEDS INVESTIGATION):**

**Known (Verified from code):**
- **Qualified Teams Page**: Shows Alert component (line 7 import in qualified-teams-client-page.tsx) - severity needs verification
- **Awards Page**: Uses `<Alert severity="info">` (line 133 in award-panel.tsx) - **ALREADY CORRECT**
- **Team Cards (Qualified)**: Use info.main for pending/locked states (draggable-team-card.tsx lines 79, 84, 99, 278-279) - **ALREADY CORRECT**

**Unknown (Needs Investigation During Implementation):**
- **Game Cards "Closed" Label**: Need to find game card component (not yet located)
  - Search pattern: Look for components with "game" and "card" in filename
  - Search for text: "Closed" or "closed" in game-related components
  - Expected location: `app/components/` directory
- **Dashboard Locked Indicators**: Need to find dashboard/prediction status components
  - May be in home page, tournament overview, or prediction dashboard
  - Look for chip components with gray/warning colors in locked states

**Proposed Changes:**

**Phase 1: Verify Current State**
1. Check qualified-teams-client-page.tsx Alert severity (should be "info")
2. Locate game card component with "Closed" label
3. Locate dashboard locked state indicators
4. Document current colors for each

**Phase 2: Update to Info Blue + Add Closed Icons**
- **Qualified Teams**: Verify Alert severity="info" (may already be correct)
  - **NEW**: Add "closed" icon (Lock icon) to each group card header when locked
  - Provides visual clarity on why cards are not editable
- **Awards**: No changes needed (already uses severity="info")
  - **NEW**: Add "closed" icon (Lock icon) to each award selector when locked
  - Provides visual clarity on why selectors are disabled
- **Game Cards**: Change "Closed" label color from gray/muted → info.main (blue)
- **Dashboard**: Change locked state chips from warning/gray → info.main (blue)
  - Keep icons gray if used for visual hierarchy
  - Change chip background to info color

**Additional Icons (NEW REQUIREMENT):**
- Use Lock icon from `@mui/icons-material/Lock`
- Place icon next to group card title or in card header
- Place icon next to award selector label
- Use info.main color for consistency
- Small size (fontSize: 'small' or ~16px)
- Only show when locked/disabled state is true

**Rationale:**
- Locked state is **informational** (not warning/error)
- Tournaments naturally lock when they start (expected behavior, not a problem)
- Blue is standard for read-only/informational states in Material Design
- Consistent color language improves UX and reduces confusion

**Files to Modify (Once Located):**
- `app/components/qualified-teams/qualified-teams-client-page.tsx` - Verify Alert severity
- `app/components/qualified-teams/group-card.tsx` - Add Lock icon to group card header when locked
- `app/components/awards/award-panel.tsx` - Add Lock icon to award selectors when locked
- Game card component (TBD - find during implementation) - Update "Closed" label color
- Dashboard locked indicator components (TBD - find during implementation) - Update chip colors

**Visual Result:**
- All locked state indicators use consistent Info blue color
- Prediction pages (Qualified, Awards): Prominent blue alert banners
- Dashboard: Info blue chips for status (icons may stay gray for hierarchy)
- Game cards: Blue "Closed" labels instead of gray
- Unified, intuitive color language across entire app

**Implementation Strategy:**
1. Start by searching codebase for game card and dashboard components
2. Verify current locked state styling in each
3. Update colors to Info blue where needed
4. Test across all pages to ensure consistency

## Files to Create/Modify

### Modify:
1. `app/components/header/user-actions.tsx` - Fix #1 (login button)
2. `app/[locale]/tournaments/[id]/layout.tsx` - Fix #2 (verify gap), Fix #3 (grid layout), Fix #4 (tonal background)
3. `app/components/tournament-page/tournament-sidebar.tsx` - Fix #3 (grid), Fix #4 (remove Paper, add tonal)
4. `app/components/qualified-teams/draggable-team-card.tsx` - Fix #5 (reduce sizes)
5. Sidebar section components (Fix #3 - reduce header fonts):
   - `app/components/tournament-page/group-standings-sidebar.tsx`
   - `app/components/tournament-page/user-tournament-statistics.tsx`
   - `app/components/tournament-page/friend-groups-list.tsx`
   - `app/components/tournament-page/rules.tsx`
6. Game card component (Fix #6 - identify and update "Closed" label)
7. Dashboard components (Fix #6 - identify and update locked state chips)
8. `app/components/qualified-teams/qualified-teams-client-page.tsx` (Fix #6 - verify Alert severity)

### Create:
- None (all modifications to existing components)

## Implementation Steps

### Phase 1: Independent Fixes (Can be done in parallel)

1. **Fix #1: Login Button**
   - Update user-actions.tsx to use Avatar instead of Button
   - Test with both English and Spanish locales
   - Verify alignment with theme/language avatars

2. **Fix #3: Sidebar Grid**
   - Update layout.tsx main content grid to md: 9
   - Update tournament-sidebar.tsx grid to md: 3
   - Reduce sidebar header fonts to 14px
   - Test responsive behavior (desktop only, mobile unchanged)

3. **Fix #4: Tonal Backgrounds**
   - Add tonal background to main content container
   - Remove Paper wrapper from sidebar, add tonal background
   - Test in light and dark modes

4. **Fix #5: Team Card Size**
   - Reduce position badge, typography, padding
   - Remove status icons (keep chips and text)
   - Verify color coding preserved
   - Test in various states (unlocked, pending, scored)

### Phase 2: Investigation + Implementation

5. **Fix #2: Footer Gap**
   - Verify if gap exists in current implementation
   - If gap exists, identify source (padding, margin, positioning)
   - Remove gap, ensure content flush with footer/nav
   - Test on desktop and mobile

6. **Fix #6: Locked State Colors**
   - Locate game card "Closed" label component
   - Locate dashboard locked state indicators
   - Verify qualified teams alert color
   - Update all to use Info blue consistently
   - Test across all pages (Qualified, Awards, Dashboard, Game cards)

### Phase 3: Integration Testing

7. **Cross-browser/viewport testing:**
   - Test all fixes on desktop (Chrome, Firefox, Safari)
   - Test mobile responsive behavior
   - Verify dark mode works correctly

8. **Accessibility check:**
   - Verify contrast ratios meet WCAG AA (especially team card text after size reduction)
   - Test keyboard navigation still works
   - Screen reader compatibility

## Testing Strategy

### Unit Tests

**New Tests to Create:**
1. **user-actions.tsx**:
   - Test login Avatar renders correctly (non-authenticated state)
   - Test displays localized text ("LOG IN" vs "INICIAR SESIÓN")
   - Test Avatar has correct size (40x40), hover behavior

2. **tournament-sidebar.tsx**:
   - Test grid size props (md: 3)
   - Test tonal background alpha applied to container
   - Test Paper wrapper removed

3. **draggable-team-card.tsx**:
   - Test reduced sizes (40px badge, subtitle1 team name, smaller chips)
   - Test color coding preserved (green/red/blue borders and chips)
   - Test status icons removed but chips remain
   - Test padding reduced to 1.5

4. **layout.tsx (tournament)**:
   - Test grid size for main content (md: 9)
   - Test tonal background applied
   - Test bottom padding removed (Fix #2)

**Update Existing Tests:**
- `app/components/header/__tests__/conditional-header.test.tsx` - Verify doesn't break with Avatar login button
- `app/components/tournament-page/tournament-sidebar.test.tsx` - Update grid size from md:4 to md:3
- `app/components/qualified-teams/draggable-team-card.test.tsx` - Update size/typography expectations (40px badge, subtitle1, etc.)
- Game card tests (once located) - Update locked state color expectations
- Dashboard tests (once located) - Update locked state chip color expectations

### Manual Testing Checklist

**Per Fix (Functional):**
- [ ] Fix #1: Login Avatar renders, aligned with theme/language avatars, localized text displays correctly
- [ ] Fix #2: No gap between content bottom and footer/nav, visual flush alignment on desktop and mobile
- [ ] Fix #3: Main content visibly wider (75%), sidebar narrower (25%), headers readable, desktop only
- [ ] Fix #4: Tonal backgrounds visible in both light and dark mode, no floating appearance, consistent elevation
- [ ] Fix #5: Team cards visibly more compact, color coding works (green/red/blue), icons removed, text readable
- [ ] Fix #6: All locked states use Info blue (qualified, awards, dashboard, game cards)

**Cross-Cutting (Quality):**
- [ ] All fixes work in **light mode** - test each fix
- [ ] All fixes work in **dark mode** - test each fix (priority: Fix #4)
- [ ] Responsive behavior correct:
  - [ ] Desktop (≥900px) - sidebar visible, grid 9/3
  - [ ] Tablet (600-900px) - test breakpoint behavior
  - [ ] Mobile (<600px) - sidebar hidden, bottom nav visible
- [ ] Accessibility maintained:
  - [ ] Contrast ratios meet WCAG AA (especially team card text after reduction)
  - [ ] Keyboard navigation works (tab through header avatars)
  - [ ] Screen reader announces login Avatar text
- [ ] No visual glitches:
  - [ ] No layout shifts or reflows
  - [ ] No overlapping elements
  - [ ] Smooth transitions and hover states
- [ ] Typography readable after reductions (minimum 9.6px = 0.6rem)

**Browser Testing:**
- [ ] Chrome (primary)
- [ ] Firefox
- [ ] Safari (especially dark mode tonal backgrounds)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### Test Coverage Target

- **80% coverage on new/modified code** (SonarCloud requirement)
- **Specific coverage areas:**
  - Component rendering with different props/states
  - Responsive behavior (grid breakpoints, mobile vs desktop)
  - Theme mode switching (light/dark)
  - Locked vs unlocked states (Fix #6)
  - Localization (Fix #1 - English vs Spanish)

### Accessibility Verification

**WCAG AA Contrast Requirements:**
- Normal text (< 18px): Minimum 4.5:1 contrast ratio
- Large text (≥ 18px): Minimum 3:1 contrast ratio

**Specific Checks:**
- Team card text after size reduction: Verify 9.6px text on tonal background meets 4.5:1
- Login Avatar text: Verify white text on action.hover background meets 4.5:1
- Sidebar tonal background: Verify text contrast on alpha(primary, 0.04) meets 4.5:1

**Tools:**
- Use browser DevTools color picker to measure contrast ratios
- Test with screen reader (VoiceOver on Mac, NVDA on Windows)
- Test keyboard navigation with Tab key

## Validation Considerations

### SonarCloud Quality Gates

- **0 new issues** of any severity (blocker, critical, major, minor)
- **80% test coverage** on new/modified code
- **Security rating: A** (no new vulnerabilities)
- **Maintainability: B or higher**
- **Code duplication: <5%**

### Pre-Commit Checks

- `npm test` - All tests pass
- `npm run lint` - No linting errors
- `npm run build` - Production build succeeds

### Vercel Preview Testing

After implementation:
- User tests all 6 fixes in Vercel Preview environment
- Verify responsive behavior on real devices
- Check dark mode on actual mobile devices
- Confirm no regressions on unrelated pages

## Open Questions

1. **Fix #2 (Footer Gap):** Does gap actually exist in current implementation? Need to verify in running app.
2. **Fix #6 (Locked States):** What component renders game card "Closed" label? Need to locate.
3. **Fix #6 (Dashboard):** Where are dashboard locked state indicators? Need to identify component.
4. **Fix #3 (Sidebar Fonts):** Are sidebar section headers using custom Typography or CardHeader default? May need to check each component.
5. **Accessibility:** Will 20-25% size reduction in team cards maintain WCAG AA contrast ratios? Need to verify after implementation.

## Success Criteria

- [ ] All 6 fixes implemented as specified
- [ ] All unit tests pass with 80%+ coverage
- [ ] Lint and build checks pass
- [ ] Works correctly in light and dark modes
- [ ] Responsive behavior correct (desktop and mobile)
- [ ] No accessibility regressions (WCAG AA maintained)
- [ ] 0 new SonarCloud issues
- [ ] User approval after Vercel Preview testing
- [ ] No regressions on unrelated pages

## Risks and Mitigation

### Risk: Team card size reduction affects readability
- **Mitigation:** Test with actual content, verify WCAG AA contrast maintained
- **Fallback:** Reduce by smaller percentage (15-20% instead of 20-25%)

### Risk: Tonal backgrounds don't work well in dark mode
- **Mitigation:** Test both modes early, adjust opacity if needed
- **Fallback:** Use different approach (subtle borders or backdrop filters)

### Risk: Grid layout change breaks responsive behavior
- **Mitigation:** Test all breakpoints, verify mobile unchanged
- **Fallback:** Add intermediate breakpoints if needed

### Risk: Locked state color change confuses existing users
- **Mitigation:** Blue is standard for informational states, more intuitive
- **Fallback:** Revert if user feedback negative

## Notes

- All fixes are CSS/styling changes - minimal risk of breaking functionality
- Each fix is independent - can be implemented and tested separately
- No database migrations required
- No API changes required
- Focus on visual consistency without changing behavior

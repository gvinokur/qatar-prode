# Implementation Plan: Story #89 - Mobile Header Optimization to Reduce Vertical Space

## Story Context

**Story:** #89 - Mobile Header Optimization to Reduce Vertical Space
**Type:** Enhancement
**Epic:** UX Audit 2026
**Related:** UXI-008 (Mobile Bottom Navigation - Completed)

### Objective
Reduce vertical space consumption on mobile by addressing the double sticky header problem on tournament pages, maximizing content viewport area on mobile devices.

### Problem Statement (Revised)
Tournament pages currently have **TWO sticky headers** stacking on top of each other:
1. **App Header** (~76px) - Global navigation with app logo, app name, theme switcher, user actions
2. **Tournament Header** (~100px) - Tournament logo + name + GroupSelector tabs

**Total:** ~176px of sticky headers + ~56px bottom navigation = **232px of chrome**
- On iPhone SE (667px): **35% of screen** consumed by navigation!
- On iPhone 14 (844px): **27% of screen** consumed by navigation!

The tournament header already has a reasonable layout. The problem is the **double sticky header architecture**.

### Success Criteria
- ✅ Header height reduced by at least 30% on mobile (~76px saved by removing App Header)
- ✅ All user actions remain accessible (theme switcher, user menu, home link)
- ✅ Tournament branding remains prominent and recognizable
- ✅ Group navigation is accessible within 2 taps/interactions
- ✅ Smooth transitions with no performance degradation
- ✅ User testing shows positive feedback (no usability regressions)
- ✅ Lighthouse mobile score remains high (90+)

---

## Technical Approach

### Chosen Solution: Merge Headers on Tournament Pages

**Strategy:** On tournament pages (mobile only), hide the global App Header and integrate its functionality into the Tournament Header.

**What this achieves:**
- **Space savings:** ~76px (entire App Header removed)
- **All functionality preserved:** User actions, theme switcher, home navigation all available in Tournament Header
- **Clean UX:** Single unified header for tournament context
- **Desktop unchanged:** Keep both headers on desktop (plenty of screen real estate)

### Architecture Changes

**Before (Mobile):**
```
┌─────────────────────────────────────────┐
│ [App Logo] La Maquina | [Theme] [User] │ ← App Header (~76px)
├─────────────────────────────────────────┤
│         [Tournament Logo]               │
│          Tournament Name                │ ← Tournament Header (~100px)
├─────────────────────────────────────────┤
│  [🏆] [GRUPO A] [GRUPO B] [PLAYOFFS]   │
└─────────────────────────────────────────┘
Total: ~176px
```

**After (Mobile):**
```
┌─────────────────────────────────────────┐
│ [🏠] [Tnmt Logo] Name | [Theme] [User] │ ← Merged Header (~56px)
├─────────────────────────────────────────┤
│  [🏆] [GRUPO A] [GRUPO B] [PLAYOFFS]   │ ← Tabs (~44px)
└─────────────────────────────────────────┘
Total: ~100px (43% reduction!)
```

**Desktop (unchanged):**
```
┌─────────────────────────────────────────────────────┐
│ [App Logo] La Maquina    [Theme] [User]            │ ← App Header
├─────────────────────────────────────────────────────┤
│ [Logo] Name              [Tabs........................] │ ← Tournament
└─────────────────────────────────────────────────────┘
```

---

## Implementation Strategy

### Phase 1: Hide App Header on Tournament Pages (MVP)

**Goal:** Conditionally hide the App Header when on tournament pages (mobile only).

**Changes:**
1. Update `app/layout.tsx` to conditionally render Header based on route
2. Detect if current route is a tournament page (`/tournaments/*`)
3. Hide Header on mobile (`< 900px`) for tournament routes
4. Keep Header on desktop for all routes

**Space savings:** ~76px immediately

### Phase 2: Add User Actions to Tournament Header

**Goal:** Integrate App Header functionality into Tournament Header.

**Changes:**
1. Add home button (icon link to `/`) to Tournament Header
2. Add ThemeSwitcher component to Tournament Header
3. Add UserActions component to Tournament Header
4. Optimize Tournament Header layout for mobile:
   - Horizontal flex layout: [Home] [Logo] [Name] | [Theme] [User]
   - Reduce logo size: 36px (from 48px)
   - Tighter padding
5. Responsive: Only show integrated actions on mobile, desktop keeps original layout

**Result:** Fully functional single header on mobile tournament pages

### Phase 3: Visual Polish & Optimization

**Goal:** Fine-tune layout, transitions, and responsive behavior.

**Changes:**
1. Add smooth transition when switching between pages (header show/hide)
2. Optimize spacing and alignment for different screen sizes
3. Ensure tournament name truncates properly with actions present
4. Test with different tournaments (long names, different logo sizes)

---

## Visual Prototypes

### Mobile Tournament Header - Before (Current State)

```
┌───────────────────────────────────────────┐
│                                           │
│  [60px    ] La Maquina Prode              │ ← App Header
│  App Logo                    [🌙] [👤]    │   (~76px)
│                                           │
├───────────────────────────────────────────┤
│                                           │
│         [48px Tournament Logo]            │
│          Qatar World Cup 2022             │ ← Tournament Header
│                                           │   Logo + Name (~64px)
├───────────────────────────────────────────┤
│                                           │
│  [🏆] [GRUPO A] [GRUPO B] [PLAYOFFS]     │ ← Tabs (~44px)
│                                           │
└───────────────────────────────────────────┘
Total: ~184px (3 rows)
```

### Mobile Tournament Header - After (Merged)

```
┌───────────────────────────────────────────┐
│ [🏠] [36px] Qatar WC | [🌙] [👤]         │ ← Merged Header
│       Logo  2022                          │   (~56px)
├───────────────────────────────────────────┤
│ [🏆] [GRUPO A] [GRUPO B] [PLAYOFFS]      │ ← Tabs (~44px)
└───────────────────────────────────────────┘
Total: ~100px (2 rows, 46% reduction)
```

**Layout Details:**
- **Home icon:** 32x32px IconButton with HomeIcon
- **Tournament logo:** 36px height (reduced from 48px)
- **Tournament name:** Truncated with ellipsis, `noWrap`
- **Theme switcher:** Existing ThemeSwitcher component
- **User actions:** Existing UserActions component
- **Spacing:** `gap={1}` (8px) between elements
- **Padding:** `px={1.5} py={0.75}` (12px horizontal, 6px vertical)

### Desktop Tournament Header - Unchanged

```
┌───────────────────────────────────────────────────────────┐
│  [App Logo] La Maquina Prode         [🌙] [👤]           │ ← App Header
├───────────────────────────────────────────────────────────┤
│  [Logo] Qatar WC 2022      [🏆] [GRUPO A] [GRUPO B] ...  │ ← Tournament
└───────────────────────────────────────────────────────────┘
Both headers visible, side-by-side layouts
```

---

## Files to Create/Modify

### Phase 1: Hide App Header on Tournament Pages

**Files to Modify:**

1. **`/app/layout.tsx`**
   - Add route detection logic to check if current path starts with `/tournaments/`
   - Conditionally render `<Header>` based on route and screen size
   - Use `usePathname()` from `next/navigation` (client-side hook)
   - **Problem:** layout.tsx is a Server Component - can't use client hooks directly
   - **Solution:** Create a client wrapper component for conditional rendering

**Files to Create:**

2. **`/app/components/header/conditional-header.tsx`** (New Client Component)
   - **Purpose:** Wrap Header with route-based visibility logic
   - **Props:**
     - `children: React.ReactNode` (Header component)
     - `hideOnMobile?: boolean` (whether to hide on mobile)
   - **Behavior:**
     - Uses `usePathname()` to detect current route
     - Uses `useMediaQuery()` to detect mobile breakpoint
     - Returns null if on tournament route AND on mobile
     - Returns children otherwise
   - Client component with `'use client'` directive

### Phase 2: Add User Actions to Tournament Header

**Files to Modify:**

3. **`/app/tournaments/[id]/layout.tsx`**
   - Import `ThemeSwitcher` and `UserActions` components
   - Import `HomeIcon` from MUI icons
   - Update logo + name Grid section (lines 70-123):
     - Add home icon button (links to `/`)
     - Add ThemeSwitcher component
     - Add UserActions component
     - Change to horizontal flex layout
     - Reduce logo size to 36px on mobile
     - Tighter padding: `px={1.5} py={0.75}`
     - Responsive: Show actions only on mobile (`display: { xs: 'flex', md: 'none' }`)
   - Update GroupSelector Grid section:
     - Tighter padding: `py={0.5}`

4. **`/app/components/header/theme-switcher.tsx`**
   - (Review) May need size prop for smaller icon in tournament header
   - If current size is too large, add optional `size` prop

5. **`/app/components/header/user-actions.tsx`**
   - (Review) May need compact mode for tournament header
   - If current layout is too wide, add optional `compact` prop

---

## Implementation Steps

### Phase 1: Hide App Header on Tournament Pages

**Step 1.1: Create Conditional Header Wrapper**
- Create `/app/components/header/conditional-header.tsx`
- Implement route detection with `usePathname()`
- Implement breakpoint detection with `useMediaQuery(theme.breakpoints.down('md'))`
- Logic: Hide if path starts with `/tournaments/` AND mobile
- Export as client component

**Step 1.2: Integrate Conditional Header in Root Layout**
- Update `/app/layout.tsx`
- Wrap `<Header>` with `<ConditionalHeader>`
- Test: App Header should disappear on tournament pages (mobile only)
- Test: App Header should remain on home page (all screen sizes)
- Test: App Header should remain on desktop tournament pages

**Step 1.3: Test Route Detection**
- Test `/tournaments/123` - Header should hide on mobile
- Test `/tournaments/123/groups/A` - Header should hide on mobile
- Test `/` - Header should show
- Test `/profile` - Header should show
- Test on desktop - Header should always show

### Phase 2: Add User Actions to Tournament Header

**Step 2.1: Add Home Icon to Tournament Header**
- Import `HomeIcon` from `@mui/icons-material`
- Add `IconButton` with `HomeIcon` as first element in logo section
- Link to `/` using Next.js `Link`
- Size: 32x32px
- Test: Click navigates to home

**Step 2.2: Add Theme Switcher to Tournament Header**
- Import `ThemeSwitcher` from `@/app/components/header/theme-switcher`
- Add after tournament name, before UserActions
- Use responsive display: `sx={{ display: { xs: 'flex', md: 'none' } }}`
- Test: Theme switching works correctly

**Step 2.3: Add User Actions to Tournament Header**
- Import `UserActions` from `@/app/components/header/user-actions`
- Pass `user` prop from layout props
- Add as last element in logo section
- Use responsive display: `sx={{ display: { xs: 'flex', md: 'none' } }}`
- Test: User menu works (login, logout, profile)

**Step 2.4: Optimize Layout for Integrated Actions**
- Update Grid section to horizontal flex:
  - `display: 'flex'`
  - `flexDirection: 'row'`
  - `justifyContent: 'space-between'`
  - `alignItems: 'center'`
  - `gap: 1` (8px)
- Reduce logo size: `maxHeight: { xs: '36px', md: '48px' }`
- Update padding: `px={{ xs: 1.5, md: 2 }} py={{ xs: 0.75, md: 2 }}`
- Add name truncation: `noWrap` on Typography

**Step 2.5: Responsive Behavior**
- Actions visible only on mobile: `display: { xs: 'flex', md: 'none' }`
- Desktop keeps original layout (no actions in tournament header)
- Test on 320px, 375px, 600px, 900px widths

### Phase 3: Visual Polish

**Step 3.1: Spacing & Alignment**
- Fine-tune gaps between elements
- Ensure vertical centering of all elements
- Test with short and long tournament names
- Test with dev tournament badges

**Step 3.2: Transition Effects (Optional)**
- Add smooth fade-in/out for header visibility changes
- Use CSS transitions for route changes
- Target: 200ms fade transition

**Step 3.3: Edge Cases**
- Test with very long tournament names (truncation)
- Test with different logo aspect ratios
- Test with user not logged in (no user menu)
- Test theme switching on tournament page

---

## Testing Strategy

### Unit Tests

**File:** `/app/components/header/__tests__/conditional-header.test.tsx`

**Test Cases:**
1. **Shows header on home page:**
   - Mock `usePathname()` to return `/`
   - Mock `useMediaQuery()` to return `true` (mobile)
   - Verify children are rendered

2. **Hides header on tournament page (mobile):**
   - Mock `usePathname()` to return `/tournaments/123`
   - Mock `useMediaQuery()` to return `true` (mobile)
   - Verify children are NOT rendered (null)

3. **Shows header on tournament page (desktop):**
   - Mock `usePathname()` to return `/tournaments/123`
   - Mock `useMediaQuery()` to return `false` (desktop)
   - Verify children are rendered

4. **Handles nested tournament routes:**
   - Mock paths: `/tournaments/123/groups/A`, `/tournaments/123/stats`
   - Verify header hides on mobile for all

**Test Utilities:**
- Mock `next/navigation` `usePathname()` hook
- Mock MUI `useMediaQuery()` hook
- Use `renderWithTheme()` from test utils

### Integration Tests

**File:** `/app/tournaments/[id]/__tests__/layout.test.tsx`

**Test Cases:**
1. **Mobile tournament header includes all actions:**
   - Render with mobile viewport
   - Verify home icon button present
   - Verify theme switcher present
   - Verify user actions present (if logged in)

2. **Desktop tournament header excludes actions:**
   - Render with desktop viewport
   - Verify actions NOT present in tournament header
   - Verify original layout preserved

3. **Tournament logo size reduced on mobile:**
   - Render with mobile viewport
   - Verify logo max-height is 36px

4. **Tournament name truncates when too long:**
   - Render with very long tournament name
   - Verify Typography has `noWrap`
   - Verify text truncates with ellipsis

5. **Home button navigates correctly:**
   - Render tournament header
   - Click home icon button
   - Verify Link href is `/`

**Test Data:**
- Use `testFactories.createTournament()` with custom theme
- Mock `getTournamentAndGroupsData()`
- Mock user authentication state (logged in/out)

### Manual Testing Checklist

**Phase 1:**
- [ ] App Header hidden on tournament pages (mobile)
- [ ] App Header visible on home page (mobile)
- [ ] App Header visible on all pages (desktop)
- [ ] No layout shift when navigating between pages
- [ ] Test on different tournament routes:
  - [ ] `/tournaments/123`
  - [ ] `/tournaments/123/groups/A`
  - [ ] `/tournaments/123/stats`
  - [ ] `/tournaments/123/playoffs`

**Phase 2:**
- [ ] Home icon appears in tournament header (mobile only)
- [ ] Home icon navigates to home page
- [ ] Theme switcher appears in tournament header (mobile only)
- [ ] Theme switching works correctly
- [ ] User actions appear in tournament header (mobile only)
- [ ] User menu works (login, logout, profile)
- [ ] Tournament logo reduced to 36px (mobile)
- [ ] Tournament name truncates when too long
- [ ] Layout fits within viewport (no horizontal scroll)
- [ ] Test with logged out user:
  - [ ] Login button appears in tournament header
- [ ] Test with different tournaments:
  - [ ] Short names, long names
  - [ ] Different logos and colors
  - [ ] Dev tournament badges

**Responsive Testing:**
- [ ] 320px (iPhone SE): All elements fit, no overlap
- [ ] 375px (iPhone 12/13): Comfortable spacing
- [ ] 390px (iPhone 14): Comfortable spacing
- [ ] 600px (tablet): Transition to desktop behavior
- [ ] 900px+ (desktop): Original layout, no actions in tournament header

**Accessibility:**
- [ ] Home icon button has accessible label
- [ ] Keyboard navigation works (Tab through all elements)
- [ ] Screen reader announces home button correctly
- [ ] Focus indicators visible on all interactive elements
- [ ] Theme switcher remains accessible
- [ ] User menu remains accessible

**Performance:**
- [ ] No layout shifts (CLS < 0.1)
- [ ] Smooth route transitions
- [ ] No unnecessary re-renders
- [ ] Lighthouse mobile score ≥ 90

---

## Validation & Quality Gates

### Pre-Commit Validation

**MANDATORY - Run these before ANY commit:**

1. **Tests:** `npm test`
   - All unit tests pass
   - All integration tests pass
   - Coverage ≥ 80% on new code

2. **Linter:** `npm run lint`
   - No ESLint errors
   - No unused imports

3. **Build:** `npm run build`
   - Production build succeeds
   - No TypeScript errors

4. **Manual Visual Check:**
   - View on mobile device or simulator
   - Verify header merged correctly
   - Verify all actions work

### Post-Deployment Validation

**After deploying to Vercel Preview:**

1. **User Testing:**
   - Test on real mobile device (iPhone, Android)
   - Gather feedback on space savings and usability
   - Verify no confusion about missing App Header

2. **Lighthouse Audit:**
   - Run on Vercel Preview URL
   - Verify mobile score ≥ 90
   - Verify CLS < 0.1

3. **SonarCloud Checks:**
   - Wait for CI/CD to complete
   - Analyze: `./scripts/github-projects-helper pr sonar-issues <PR_NUMBER>`
   - **Must have:** 0 new issues of ANY severity
   - **Must have:** ≥80% coverage on new code

---

## Open Questions

### For User Review:

1. **Should the home icon be visible on desktop as well?**
   - Current plan: Mobile only (desktop has App Header with home link)
   - Alternative: Show on desktop too for consistency

2. **Tournament logo size: 36px or 40px on mobile?**
   - 36px: More space savings
   - 40px: Better branding, less aggressive

3. **Should we add a transition animation when hiding/showing App Header?**
   - Fade transition (200ms) when navigating between pages
   - Or instant hide/show for snappier feel?

4. **What about other non-tournament pages (profile, settings, etc.)?**
   - Current plan: Keep App Header on all non-tournament pages
   - Should any other pages hide App Header?

---

## Dependencies

- ✅ UXI-008 (Mobile Bottom Navigation) - Completed
- ✅ Material-UI v7 with Grid v2 - Already in use
- ✅ Next.js 15.3 with App Router - Already in use
- ✅ Tournament layout structure - Already in place
- ✅ ThemeSwitcher component - Already exists
- ✅ UserActions component - Already exists

---

## Migration & Rollback Plan

### Migration Strategy

**Phase 1:** Hide App Header (non-breaking)
- Conditionally hide App Header on tournament pages
- No functionality loss (actions still in App Header on desktop)
- Safe to deploy, test, and rollback easily

**Phase 2:** Add actions to Tournament Header (additive)
- Add components to Tournament Header
- Actions duplicated in both headers temporarily
- Can deploy and test before Phase 3

**Phase 3:** Finalize (cleanup)
- No additional changes, just testing and polish

**Deployment:**
- Deploy Phase 1 first, gather feedback
- Deploy Phase 2 after Phase 1 validated
- All phases can be deployed independently

### Rollback Plan

If issues arise:

**Phase 1 rollback:**
1. Remove ConditionalHeader wrapper from layout.tsx
2. Restore direct `<Header>` rendering
3. App Header visible on all pages again

**Phase 2 rollback:**
1. Remove added components from Tournament Header layout
2. Tournament Header returns to original state
3. App Header remains hidden if Phase 1 not rolled back
4. OR rollback Phase 1 as well for full restoration

**No data loss risk:**
- No database changes
- No breaking changes to data structures
- Pure UI changes

---

## Success Metrics

**Quantitative:**
- Header height reduced from ~176px to ~100px (43% reduction!)
- Space savings: ~76px on mobile
- Lighthouse mobile score maintains ≥90
- CLS (Cumulative Layout Shift) < 0.1

**Qualitative:**
- User testing shows positive feedback
- No increase in support tickets about navigation
- Users don't report missing functionality
- Tournament branding remains recognizable
- Navigation feels intuitive

---

## Notes

- This approach addresses the root cause: double sticky headers
- Desktop experience unchanged (plenty of screen space)
- Mobile gets significant space savings while maintaining functionality
- Tournament pages feel more focused and immersive
- Consider A/B testing with real users before full rollout
- May want to add analytics to track header interaction patterns

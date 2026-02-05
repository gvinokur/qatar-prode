# Implementation Plan: Story #89 - Mobile Header Optimization to Reduce Vertical Space

## Story Context

**Story:** #89 - Mobile Header Optimization to Reduce Vertical Space
**Type:** Enhancement
**Epic:** UX Audit 2026
**Related:** UXI-008 (Mobile Bottom Navigation - Completed)

### Objective
Reduce vertical space consumption on mobile by optimizing the tournament header layout to complement the new mobile bottom navigation, maximizing content viewport area on mobile devices.

### Problem Statement
The current tournament header (logo + name + GroupSelector tabs) consumes significant vertical space (~100px) on mobile. Combined with the fixed bottom navigation from UXI-008, this reduces the available content area significantly on small screens.

### Success Criteria
- ✅ Header height reduced by at least 30% on mobile during typical usage
- ✅ Tournament branding remains prominent and recognizable
- ✅ Group navigation is accessible within 2 taps/interactions
- ✅ Smooth scroll behavior with no performance degradation
- ✅ User testing shows positive feedback (no usability regressions)
- ✅ Lighthouse mobile score remains high (90+)

---

## Technical Approach

### Chosen Solution: Hybrid Approach (Option 4)

After analyzing all four proposed options, I recommend a **hybrid approach** that combines:

1. **Static Layout Optimization** (Phase 1 - MVP):
   - Horizontal logo + name layout on mobile (side-by-side instead of stacked)
   - Reduced logo size (48px → 36px) on mobile only
   - Tighter padding and margins
   - Single-line header layout
   - **Estimated savings:** 20-25% reduction (~25px saved)

2. **Progressive Enhancement - Scroll-based Collapsing** (Phase 2 - Optional):
   - Hide logo and name when scrolling down
   - Show only GroupSelector tabs in collapsed state
   - Expand back to full header when scrolling up
   - Smooth animations using MUI's `useScrollTrigger`
   - **Additional savings:** 40-50% reduction when scrolling (~40-50px total saved)

### Why This Approach?

**Advantages:**
- ✅ Progressive enhancement: Works without JS
- ✅ Immediate space savings from layout optimization
- ✅ Additional space savings from scroll behavior
- ✅ Maintains easy group navigation (tabs always visible)
- ✅ Tournament branding visible when at top of page
- ✅ Smooth, modern UX that feels natural
- ✅ No hamburger menu = no extra interaction required

**Alternatives Considered:**
- **Option 1 (Scroll-only):** Doesn't save space when at top of page
- **Option 2 (Layout-only):** Limited space savings (~20-25%)
- **Option 3 (Hamburger):** Violates "max 2 taps" requirement, reduces discoverability

---

## Visual Prototypes

### Current Mobile Header Layout (Before)

```
┌─────────────────────────────────────────┐
│                                         │
│         [Tournament Logo]               │ ← 48px height
│          Tournament Name                │ ← Centered
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  [🏆] [GRUPO A] [GRUPO B] [PLAYOFFS]   │ ← 36px height + padding
│                                         │
└─────────────────────────────────────────┘
Total: ~100px (logo section + tabs section)
```

### Phase 1: Optimized Horizontal Layout (Static)

```
┌─────────────────────────────────────────┐
│ [Logo] Tournament Name                  │ ← 36px height, side-by-side
├─────────────────────────────────────────┤
│ [🏆] [GRUPO A] [GRUPO B] [PLAYOFFS]    │ ← 36px height
└─────────────────────────────────────────┘
Total: ~72px (20-25% reduction)
```

**Layout Changes:**
- Logo and name on same line (horizontal flex layout)
- Logo reduced from 48px to 36px (mobile only)
- Reduced padding: `pt={1} pb={0.5}` instead of `pt={2} pb={1}`
- Left-aligned instead of centered
- Tournament name truncated with ellipsis if needed

### Phase 2: Collapsed State (Scrolling Down)

```
┌─────────────────────────────────────────┐
│ [🏆] [GRUPO A] [GRUPO B] [PLAYOFFS]    │ ← Only tabs visible (36px)
└─────────────────────────────────────────┘
Total: ~44px (50% reduction from original)
```

**Scroll Behavior:**
- When scrolling down: Logo and name slide up and fade out
- When scrolling up: Logo and name slide down and fade in
- Smooth transitions (250ms ease-in-out)
- Uses MUI `useScrollTrigger` with threshold (50px scroll)

### Phase 2: Expanded State (At Top or Scrolling Up)

```
┌─────────────────────────────────────────┐
│ [Logo] Tournament Name                  │ ← Visible again (36px)
├─────────────────────────────────────────┤
│ [🏆] [GRUPO A] [GRUPO B] [PLAYOFFS]    │ ← Always visible (36px)
└─────────────────────────────────────────┘
Total: ~72px
```

### Component Structure

**Material-UI Components:**
- **AppBar** with `position="sticky"` (keep current)
- **Grid v2** for responsive layout (keep current)
- **Slide** component for smooth logo/name transitions (Phase 2)
- **useScrollTrigger** hook for scroll detection (Phase 2)
- **Tabs** component (GroupSelector - no changes needed)

### Responsive Behavior

**Mobile (xs < 900px):**
- Phase 1: Horizontal logo + name layout, reduced sizes
- Phase 2: Scroll-based collapsing enabled

**Desktop (md ≥ 900px):**
- No changes - keep current side-by-side layout (logo left, tabs right)
- No scroll-based behavior (plenty of screen real estate)

### State Management

**For Phase 2 (Client Component):**
```tsx
const trigger = useScrollTrigger({
  threshold: 50, // Start collapsing after 50px scroll
  disableHysteresis: false, // Smooth transitions
});

// trigger = true when scrolled past threshold
// trigger = false when at top or scrolling up
```

---

## Files to Create/Modify

### Phase 1: Static Layout Optimization

**Files to Modify:**

1. **`/app/tournaments/[id]/layout.tsx`** (Primary Changes)
   - **Lines 70-123:** Logo + name Grid section
     - **KEEP Grid sizing:** `size={{ xs: 12, md: 3 }}` (unchanged - horizontal layout achieved via inner Box flex)
     - Update padding: `pt={1} pb={0.5} pl={1.5}` (mobile), keep `pt={2} pb={1} pl={2}` (desktop)
     - **Change INNER Box layout** from centered to horizontal flex:
       - `display: 'flex'`
       - `flexDirection: 'row'`
       - `gap: 1` (8px between logo and name)
       - `alignItems: 'center'`
     - Add mobile-specific logo size: `maxHeight: { xs: '36px', md: '48px' }`
     - Update text alignment: `textAlign: 'left'` (remove center on mobile)
     - Add `Typography` `noWrap` for name truncation
     - **Note:** Grid item stays full-width (xs: 12), but inner content is horizontal flex

   - **Lines 124-135:** GroupSelector Grid section
     - Update padding: `pt={0.5} pb={0.5}` (mobile), keep `pt={2} pb={1}` (desktop)
     - **KEEP Grid sizing:** `size={{ xs: 12, md: 9 }}` (unchanged)

   - **Result:** Two stacked rows on mobile:
     - Row 1: Logo + name (horizontal flex within Grid item)
     - Row 2: Group tabs (full width)

2. **No Changes Needed:**
   - `/app/components/groups-page/group-selector.tsx` - Already responsive
   - `/app/components/common/dev-tournament-badge.tsx` - Stays inline with name

### Phase 2: Scroll-based Collapsing (Progressive Enhancement)

**Files to Create:**

3. **`/app/components/tournament/collapsible-tournament-header.tsx`** (New Client Component)
   - **Purpose:** Wraps logo+name section with scroll-based visibility
   - **Props:**
     - `children: React.ReactNode` (logo + name content)
     - `backgroundColor?: string` (theme primary color)
     - `threshold?: number` (default 50px)
   - **Behavior:**
     - Uses `useScrollTrigger` to detect scroll
     - Wraps children in `Slide` component (direction="down")
     - Shows children when `!trigger` (at top or scrolling up)
     - Hides children when `trigger` (scrolling down past threshold)
   - **Animation:**
     - Smooth slide + fade transitions (250ms)
     - **Layout shift prevention:**
       - Use `visibility: hidden` instead of unmounting when collapsed
       - OR: Set fixed `min-height` on parent Grid to prevent height changes
       - Measure CLS (Cumulative Layout Shift) in Lighthouse to verify
   - **Performance:**
     - Scroll listener uses MUI's optimized `useScrollTrigger` (built-in throttling)
     - Test on slow devices to verify 60fps maintained

**Files to Modify:**

4. **`/app/tournaments/[id]/layout.tsx`** (Phase 2 Updates)
   - Import `CollapsibleTournamentHeader` (dynamic import for client-side only)
   - Wrap logo+name Grid section with collapsible wrapper
   - Add `'use client'` directive if needed (or keep Server Component and use dynamic import)
   - Pass tournament theme colors to wrapper

**Server/Client Boundary:**
- **Current:** `layout.tsx` is a Server Component by default (Next.js App Router convention)
  - Note: The `'use server'` directive at top of file is for Server Actions, not the component itself
  - The layout performs server-side data fetching and remains a Server Component
- **Solution:** Use dynamic import to load client component for Phase 2:
  ```tsx
  const CollapsibleHeader = dynamic(() => import('@/components/tournament/collapsible-tournament-header'), {
    ssr: false // Client-side only, no SSR to avoid hydration mismatches
  });
  ```
- This keeps the layout as a Server Component while adding progressive enhancement
- **Hydration:** With `ssr: false`, the collapsible wrapper mounts only on client side
  - No hydration warnings expected (client-only component)
  - Logo/name content rendered on server, wrapped by client component post-mount
  - Minimal layout shift during mount (component appears instantly)

---

## Implementation Steps

### Phase 1: Static Layout Optimization (MVP)

**Step 1.1: Update Logo + Name Grid Section**
- Modify `/app/tournaments/[id]/layout.tsx` lines 70-123
- Change to horizontal flex layout on mobile
- Reduce logo size to 36px on mobile
- Tighten padding to `pt={1} pb={0.5}`
- Add `noWrap` to tournament name Typography
- Test: Verify header is shorter, logo and name are side-by-side

**Step 1.2: Update GroupSelector Grid Section**
- Modify `/app/tournaments/[id]/layout.tsx` lines 124-135
- Reduce padding to `pt={0.5} pb={0.5}` on mobile
- Test: Verify tabs are closer to logo section

**Step 1.3: Responsive Breakpoint Verification**
- Test on mobile (< 900px): Horizontal layout, reduced sizes
- Test on desktop (≥ 900px): Original layout unchanged
- Test with different tournament themes (colors, logos)
- Test with dev tournament badges

**Step 1.4: Visual Regression Testing**
- Compare before/after screenshots
- Measure header heights (should be ~72px on mobile, down from ~100px)
- Verify 20-25% space savings

### Phase 2: Scroll-based Collapsing (Progressive Enhancement)

**Step 2.1: Create Collapsible Header Component**
- Create `/app/components/tournament/collapsible-tournament-header.tsx`
- Implement `useScrollTrigger` logic (threshold: 50px)
- Wrap children in `Slide` component
- Add smooth transitions (250ms ease-in-out)
- Export as client component with `'use client'` directive

**Step 2.2: Integrate into Layout**
- Add dynamic import to `/app/tournaments/[id]/layout.tsx`
- Wrap logo+name Grid section with `CollapsibleHeader`
- Pass theme colors and threshold props
- Test: Verify scroll behavior works smoothly

**Step 2.3: Animation Tuning**
- Test scroll performance (should maintain 60fps)
- Adjust threshold if needed (50px may need tuning)
- Verify no layout shifts or jank
- Test on slower devices and throttled CPU

**Step 2.4: Edge Case Testing**
- Test with short pages (no scroll)
- Test with rapid scroll up/down
- Test with touch vs. mouse scroll
- Test on iOS Safari, Chrome Mobile, Firefox Mobile

---

## Testing Strategy

### Unit Tests

**File:** `/app/components/tournament/__tests__/collapsible-tournament-header.test.tsx`

**Test Cases:**
1. **Renders children when not scrolled:**
   - Mock `useScrollTrigger` to return `false`
   - Verify children are visible

2. **Hides children when scrolled past threshold:**
   - Mock `useScrollTrigger` to return `true`
   - Verify `Slide` component has `in={false}`

3. **Respects custom threshold prop:**
   - Pass custom threshold (e.g., 100px)
   - Verify it's passed to `useScrollTrigger`

4. **Applies background color correctly:**
   - Pass custom `backgroundColor` prop
   - Verify it's applied to wrapper

5. **Smooth transition timing:**
   - Verify transition duration is 250ms
   - Verify easing function is `ease-in-out`

**Test Utilities:**
- Use `@testing-library/react` with `renderWithTheme()` from test utils
- **Mock `@mui/material/useScrollTrigger`** for unit tests (see existing patterns in codebase)
- Use `screen.getByText()` to verify children visibility
- **For integration tests:** Use `fireEvent.scroll()` to simulate scroll events:
  ```tsx
  fireEvent.scroll(window, { target: { scrollY: 100 } });
  ```
- Test realistic scroll distances (50px, 100px, 200px) to verify threshold behavior

### Integration Tests

**File:** `/app/tournaments/[id]/__tests__/layout.test.tsx`

**Test Cases:**
1. **Phase 1 - Mobile layout is horizontal:**
   - Render layout with mobile viewport
   - Verify logo and name are in same Grid row
   - Verify logo max-height is 36px on mobile

2. **Phase 1 - Desktop layout unchanged:**
   - Render layout with desktop viewport
   - Verify logo section is md=3, tabs section is md=9
   - Verify logo max-height is 48px on desktop

3. **Phase 2 - Collapsible header integrates correctly:**
   - Mock dynamic import to return test component
   - Verify logo+name section is wrapped
   - Verify theme colors are passed correctly

4. **Dev tournament badge positioning:**
   - Render with dev tournament data
   - Verify badge appears inline with name
   - Verify layout doesn't break

**Test Data:**
- Use `testFactories.createTournament()` with custom theme
- Mock `getTournamentAndGroupsData()` with tournament + groups data
- Mock user authentication state

### Manual Testing Checklist

**Phase 1:**
- [ ] Measure header height on mobile (iPhone, Android)
- [ ] Verify 20-25% space savings (target: ~72px)
- [ ] Test with different screen sizes (320px to 900px)
  - [ ] 320px (iPhone SE)
  - [ ] 375px (iPhone 12/13)
  - [ ] 390px (iPhone 14)
  - [ ] 600px (tablet breakpoint)
  - [ ] 900px (desktop breakpoint)
- [ ] Test with different tournament themes (colors, logos)
- [ ] **CRITICAL: Logo branding validation at 36px**
  - [ ] Screenshot all tournament logos at 36px on real mobile device
  - [ ] Verify logos remain recognizable and not pixelated
  - [ ] Get stakeholder approval on 36px sizing before commit
  - [ ] If 36px too small, try 40px as fallback
- [ ] Test tournament name truncation with long names
- [ ] Test dev tournament badge positioning
- [ ] Verify desktop layout unchanged (≥ 900px)

**Phase 2:**
- [ ] Scroll down slowly - verify smooth collapse
- [ ] Scroll up slowly - verify smooth expand
- [ ] Rapid scroll up/down - verify no jank
- [ ] Test on short pages (no scroll available)
- [ ] Test on long pages (extensive scrolling)
- [ ] Measure FPS during scroll (should be 60fps)
- [ ] Test on iOS Safari (iPhone)
- [ ] Test on Chrome Mobile (Android)
- [ ] Test on Firefox Mobile
- [ ] Test with touch gestures vs. mouse wheel

**Accessibility:**
- [ ] Keyboard navigation works (tab through header elements)
- [ ] Screen reader announces tournament name correctly
- [ ] **Screen reader support for collapsed state (Phase 2):**
  - [ ] Test with VoiceOver (Mac/iOS) and NVDA/JAWS (Windows)
  - [ ] Verify collapsed/expanded state is announced
  - [ ] Add ARIA attributes if needed (aria-hidden, aria-expanded)
- [ ] **Focus management during collapse (Phase 2):**
  - [ ] Test Tab key navigation before/after collapse
  - [ ] Verify focus doesn't get lost when header collapses
  - [ ] Ensure focus indicator remains visible during animation
- [ ] Focus indicators are visible
- [ ] No accessibility warnings in browser console
- [ ] Test with keyboard-only navigation (no mouse)

**Performance:**
- [ ] Run Lighthouse mobile audit (target: 90+)
  - [ ] **Measure CLS (Cumulative Layout Shift)** - should be < 0.1
  - [ ] Verify no layout shifts during scroll collapse (Phase 2)
- [ ] Check Performance tab in DevTools (no dropped frames)
- [ ] **Scroll performance profiling (Phase 2):**
  - [ ] Record scroll interaction in DevTools Performance tab
  - [ ] Verify 60fps maintained during scroll (16ms per frame)
  - [ ] Check for scroll listener bottlenecks
  - [ ] Test on slow 3G + CPU throttle (4x slowdown)
  - [ ] Monitor battery drain on mobile device (extensive scrolling)
- [ ] Verify no unnecessary re-renders
- [ ] **Consider debouncing if jank detected** (add to implementation if needed)

---

## Validation & Quality Gates

### Pre-Commit Validation

**MANDATORY - Run these before ANY commit:**

1. **Tests:** `npm test`
   - All unit tests pass
   - All integration tests pass
   - No skipped or failing tests

2. **Linter:** `npm run lint`
   - No ESLint errors
   - No unused imports
   - Code style consistent

3. **Build:** `npm run build`
   - Production build succeeds
   - No TypeScript errors
   - No build warnings

4. **Manual Visual Check:**
   - View on mobile device or simulator
   - Verify header looks correct
   - Verify scroll behavior is smooth (Phase 2)

### Post-Deployment Validation

**After deploying to Vercel Preview:**

1. **User Testing:**
   - Ask user to test on real mobile device
   - Gather feedback on space savings
   - Verify no usability regressions

2. **Lighthouse Audit:**
   - Run on Vercel Preview URL
   - Verify mobile score ≥ 90
   - Verify performance metrics meet baseline

3. **SonarCloud Checks:**
   - Wait for CI/CD to complete
   - Analyze SonarCloud results: `./scripts/github-projects-helper pr sonar-issues <PR_NUMBER>`
   - **Must have:** 0 new issues of ANY severity
   - **Must have:** ≥80% coverage on new code
   - Fix any issues before merging

---

## Open Questions

### For User Review:

1. **Phase 1 Logo Size:** Is 36px acceptable for mobile logo, or should we try 40px first?
   - 36px: More space savings, but may look too small
   - 40px: Less savings, but safer for branding

2. **Phase 2 Scroll Threshold:** Should we use 50px or 100px scroll before collapsing?
   - 50px: Collapses quickly, maximizes space
   - 100px: More conservative, less aggressive

3. **Progressive Rollout:** Should we deploy Phase 1 first and gather feedback before implementing Phase 2?
   - Advantage: Iterative, less risk
   - Disadvantage: Longer timeline to full space savings

4. **Desktop Behavior:** Should Phase 2 scroll behavior apply to desktop as well, or keep it mobile-only?
   - Current plan: Mobile-only (desktop has plenty of space)
   - Alternative: Apply to all screen sizes for consistency

---

## Dependencies

- ✅ UXI-008 (Mobile Bottom Navigation) - Completed
- ✅ Material-UI v7 with Grid v2 - Already in use
- ✅ Next.js 15.3 with App Router - Already in use
- ✅ Tournament layout structure - Already in place

---

## Migration & Rollback Plan

### Migration Strategy
- **Phase 1:** Simple prop changes, backward compatible
  - Can be deployed independently without Phase 2
  - No breaking changes to GroupSelector component
  - No database changes needed
  - Safe to deploy to production immediately after testing
- **Phase 2:** Progressive enhancement, works without JS
  - **Requires Phase 1 to be deployed first** (depends on Phase 1 layout changes)
  - Can be deployed separately after Phase 1 is validated by users
  - Fails gracefully if JS disabled (reverts to Phase 1 static layout)
  - No database changes needed
- **Deployment Timeline:**
  - Option A: Deploy Phase 1, gather feedback, then deploy Phase 2 (recommended)
  - Option B: Deploy both phases together if Phase 1 testing shows no issues

### Rollback Plan
If issues arise:
1. **Phase 1 rollback:**
   - Revert padding and layout changes (simple Git revert)
   - No data loss risk (no DB changes)
   - Restore original header spacing immediately
2. **Phase 2 rollback:**
   - Remove dynamic import and collapsible wrapper (Git revert)
   - Phase 1 changes remain intact (static layout optimization stays)
   - No data loss risk (no DB changes)
3. **Full rollback:**
   - Revert both Phase 1 and Phase 2 commits
   - Returns to original header layout
   - No cleanup required (no DB schema changes)

---

## Timeline Estimate

**Phase 1 (MVP):**
- Implementation: ~2-3 hours
- Testing: ~1 hour
- Review & deployment: ~1 hour
- **Total:** ~4-5 hours

**Phase 2 (Enhancement):**
- Implementation: ~3-4 hours
- Testing: ~2 hours
- Performance tuning: ~1 hour
- Review & deployment: ~1 hour
- **Total:** ~7-8 hours

**Grand Total:** ~11-13 hours (if both phases)

---

## Success Metrics

**Quantitative:**
- Header height reduced from ~100px to ~72px (Phase 1) or ~44px when scrolling (Phase 2)
- 28-56% space savings achieved
- Lighthouse mobile score maintains ≥90
- 60fps scroll performance maintained

**Qualitative:**
- User testing shows positive feedback
- No increase in support tickets about navigation
- No accessibility regressions
- Tournament branding remains recognizable

---

## Notes

- Focus on mobile experience first (< 900px breakpoint)
- Desktop experience remains unchanged (plenty of screen space)
- Consider creating separate PRs for Phase 1 and Phase 2 for easier review
- Material-UI's `useScrollTrigger` is well-tested and performant
- Progressive enhancement ensures functionality even if JS fails/is disabled

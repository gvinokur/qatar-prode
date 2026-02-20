# Implementation Plan: Scroll Shadow Indicator Component

**Story:** #187 - [UX Enhancement] Implement Generic Scroll Shadow Indicator Component
**Branch:** feature/story-187
**Worktree:** /Users/gvinokur/Personal/qatar-prode-story-187

---

## Context

The application has multiple scrollable containers throughout the UI, but users lack visual feedback indicating when there's hidden content beyond the current scroll position. This creates poor UX where users may not realize they can scroll to see more content.

**Current Issues:**
- Tournament Bracket view has a broken CSS mask implementation (lines 149-154 in `playoffs-bracket-view.tsx`)
- Results page tabs, games lists, and other containers use `overflow: auto` with no scroll indicators
- Users can't tell if there's more content to scroll to

**User Testing Results:**
After evaluating three approaches via interactive HTML mockup (`scroll-shadow-mockups.html`):
- ✅ **Approach 3 (Dynamic JavaScript-controlled)** was selected as the clear winner
- Works perfectly in both light/dark themes
- Only shows shadows when content actually overflows
- Shadows appear/disappear dynamically based on scroll position
- Excellent browser support using standard web APIs

---

## Acceptance Criteria

- [ ] `ScrollShadowContainer` component created and exported
- [ ] Shadows only appear when content overflows in respective directions
- [ ] Shadows correctly indicate available scroll directions (top/bottom/left/right)
- [ ] Works seamlessly with MUI light/dark themes
- [ ] Handles window resize gracefully via ResizeObserver
- [ ] 80% test coverage (SonarCloud requirement)
- [ ] Accessible (doesn't interfere with keyboard navigation or screen readers)
- [ ] Performance tested with large content (100+ items)
- [ ] Tournament bracket shadows working correctly (fix broken mask implementation)
- [ ] At least 3 existing scroll containers migrated successfully:
  - [ ] Tournament Bracket View (CRITICAL - broken mask fix)
  - [ ] Tournament Layout Main Content (HIGH IMPACT - all tournament pages)
  - [ ] Tournament Sidebar (HIGH IMPACT - navigation area)

---

## Technical Approach

### Component Architecture

**File Location:** `app/components/scroll-shadow-container.tsx`

**Implementation Strategy: Dynamic JavaScript-controlled shadows**

Use actual DOM elements (not pseudo-elements) for shadow overlays:
- 4 separate `<div>` elements positioned absolutely (top, bottom, left, right)
- Each shadow controlled independently with `visible` class
- Scroll event listener updates shadow visibility based on scroll position
- ResizeObserver handles dynamic content changes
- MUI theme integration for light/dark mode shadow colors

**Why This Approach:**
- ✅ Full control over shadow appearance and behavior
- ✅ Adapts to MUI theme changes automatically
- ✅ Only shows shadows when needed (smart detection)
- ✅ Works for vertical, horizontal, or 2D scrolling
- ✅ Excellent browser support (no experimental features)
- ✅ User-validated via mockup testing

### Component API

```typescript
interface ScrollShadowContainerProps {
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal' | 'both'; // default: 'vertical'
  shadowSize?: number; // default: 50px
  shadowIntensity?: number; // default: 0.2
  disabled?: boolean; // disable shadows entirely
  sx?: SxProps; // additional MUI styling
  height?: string | number;
  width?: string | number;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void; // forwarded directly, no throttling
}
```

**Note on `onScroll`:** Callback is forwarded directly to the scroll container without throttling. Parent components should handle their own throttling if needed to avoid performance issues with expensive operations.

### Shadow Detection Logic

**Overflow Detection:**
```typescript
const isVerticalScrollable = scrollHeight > clientHeight;
const isHorizontalScrollable = scrollWidth > clientWidth;
```

**Scroll Position Detection (5px threshold):**
```typescript
const isAtTop = scrollTop <= 5;
const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
const isAtLeft = scrollLeft <= 5;
const isAtRight = scrollLeft + clientWidth >= scrollWidth - 5;
```

**Shadow Visibility Rules:**
- Top shadow: Show if vertically scrollable AND not at top
- Bottom shadow: Show if vertically scrollable AND not at bottom
- Left shadow: Show if horizontally scrollable AND not at left
- Right shadow: Show if horizontally scrollable AND not at right

### Theme Integration

**Light Mode Shadows:**
```typescript
background: linear-gradient(to bottom,
  rgba(0,0,0,0.2) 0%,
  rgba(0,0,0,0.1) 50%,
  transparent 100%)
```

**Dark Mode Shadows:**
```typescript
background: linear-gradient(to bottom,
  rgba(255,255,255,0.2) 0%,
  rgba(255,255,255,0.1) 50%,
  transparent 100%)
```

Use `useTheme()` hook to detect current theme and apply appropriate shadow colors.

### Performance Optimizations

1. **Passive Event Listeners:**
```typescript
scrollContainer.addEventListener('scroll', updateShadows, { passive: true });
```

2. **ResizeObserver for Dynamic Content:**
```typescript
const resizeObserver = new ResizeObserver(() => updateShadows());
resizeObserver.observe(scrollContainer);
resizeObserver.observe(contentContainer);
```

3. **Cleanup on Unmount:**
```typescript
useEffect(() => {
  // ... setup
  return () => {
    scrollContainer.removeEventListener('scroll', updateShadows);
    resizeObserver.disconnect();
  };
}, []);
```

---

## Scroll Container Audit (Updated based on PR feedback)

**User feedback:** "I think we also need to change tournament layout as it's using scrolling containers for the sidebar and for the tournament main content, right? Any other that we should look for?"

**Audit completed:** Comprehensive search for all `overflow: auto` instances in codebase.

### User-Facing Containers (Priority for Migration)

1. **Tournament Bracket View** - `playoffs-bracket-view.tsx`
   - Lines 149-154: Broken mask implementation
   - **Priority: CRITICAL** (currently broken, needs fix)

2. **Tournament Layout - Main Content** - `app/[locale]/tournaments/[id]/layout.tsx`
   - Line 261: Main content Grid with `overflow: 'auto'`
   - Affects ALL tournament pages (games, results, groups, stats)
   - **Priority: HIGH** (✨ NEW from user feedback - highest user impact)

3. **Tournament Sidebar** - `tournament-page/tournament-sidebar.tsx`
   - Line 68: Sidebar scroll with hidden scrollbars
   - Contains rules, stats, friend groups
   - **Priority: HIGH** (✨ NEW from user feedback - main navigation)

4. **Results Page Tabs** - `results-page-client.tsx`
   - Lines 78, 95: Both tab panels
   - **Priority: MEDIUM**

5. **Games List Container** - `unified-games-page-client.tsx`
   - Vertical scrolling with hidden scrollbars
   - **Priority: MEDIUM**

### Additional Containers (Lower Priority)

6. **Popovers** - `tournament-details-popover.tsx` (line 43), `game-details-popover.tsx` (line 58)
   - **Priority: LOW** (small modals)

7. **Backoffice Components** - Admin-only features
   - `tournament-third-place-rules-tab.tsx` (lines 232, 297)
   - `internal/group-dialog.tsx` (lines 178, 211)
   - `tournament-main-data-tab.tsx` (line 559)
   - **Priority: VERY LOW** (admin only)

**Total Found:** 10 scroll containers (7 user-facing + 3 backoffice)

---

## Files to Create/Modify

### New Files

1. **`app/components/scroll-shadow-container.tsx`** (NEW)
   - Main component implementation
   - TypeScript interfaces
   - MUI theme integration
   - Shadow detection logic
   - ~150-200 lines

2. **`__tests__/components/scroll-shadow-container.test.tsx`** (NEW)
   - Component rendering tests
   - Overflow detection tests
   - Scroll position tests
   - Theme integration tests
   - ResizeObserver tests
   - Accessibility tests
   - ~300-400 lines (80% coverage requirement)

### Modified Files (Updated based on user feedback)

**Core Migrations (Required - 3 minimum):**

1. **`app/components/results-page/playoffs-bracket-view.tsx`** (PRIORITY 1 - CRITICAL)
   - Remove broken mask implementation (lines 149-154)
   - Wrap bracket container with `<ScrollShadowContainer direction="both">`
   - Update container styling (remove mask-related sx props)

2. **`app/[locale]/tournaments/[id]/layout.tsx`** (PRIORITY 2 - HIGH IMPACT) ✨ NEW
   - Line 261: Wrap main content Grid with `<ScrollShadowContainer direction="vertical">`
   - Affects ALL tournament pages (games, results, groups, stats)
   - Maintain existing height/overflow styling
   - **Note:** Server component - may need client wrapper for ScrollShadowContainer

3. **`app/components/tournament-page/tournament-sidebar.tsx`** (PRIORITY 3 - HIGH IMPACT) ✨ NEW
   - Line 68: Wrap sidebar Box with `<ScrollShadowContainer direction="vertical">`
   - Keep existing hidden scrollbar styling
   - Test with expanded rules, multiple friend groups

**Stretch Goals (If time permits):**

4. **`app/components/results-page/results-page-client.tsx`**
   - Lines 78, 95: Wrap both tab panels with `<ScrollShadowContainer direction="vertical">`
   - Maintain existing sx styling for flex layout

5. **`app/components/unified-games-page-client.tsx`**
   - Wrap games scroll container with `<ScrollShadowContainer direction="vertical">`
   - Keep existing hidden scrollbar styling

**Impact:** Updated plan has significantly broader user benefit - enhances all tournament pages instead of just 2-3 specific pages.

---

## Implementation Steps

### Phase 1: Core Component Development

1. **Create component file structure**
   - Set up TypeScript interfaces
   - Create component skeleton with props
   - Add 'use client' directive (uses hooks)

2. **Implement shadow DOM elements**
   - Create 4 shadow div elements (top, bottom, left, right)
   - Position absolutely within wrapper
   - Apply base gradient styling
   - Add visibility transitions

3. **Implement scroll detection logic**
   - useRef for scroll container and shadow elements
   - updateShadows function with overflow/position detection
   - Apply visible class based on scroll state

4. **Add MUI theme integration**
   - useTheme hook to detect current theme
   - Conditional gradient colors (dark vs light)
   - Respect theme mode changes

5. **Add event listeners and cleanup**
   - Scroll event listener (passive)
   - ResizeObserver for container and content
   - Cleanup in useEffect return

### Phase 2: Testing

1. **Setup test utilities**
   - Import renderWithTheme from test-utils
   - Mock ResizeObserver
   - Create test wrapper component for testing hooks

2. **Test overflow detection**
   - Content fits (no overflow) → no shadows
   - Content overflows vertically → top/bottom shadows
   - Content overflows horizontally → left/right shadows
   - Content overflows both → all 4 shadows

3. **Test scroll position updates**
   - At top → no top shadow, show bottom shadow
   - At bottom → show top shadow, no bottom shadow
   - In middle → show both shadows
   - Same for horizontal
   - Verify scroll listeners are called correctly

4. **Test theme integration**
   - Light theme → dark shadows (rgba(0,0,0,...))
   - Dark theme → light shadows (rgba(255,255,255,...))
   - **Theme switching during scroll:** Switch theme while scrolled to middle position, verify shadows update colors without position glitch
   - Theme changes trigger re-render via useTheme() hook

5. **Test resize handling**
   - Trigger ResizeObserver callback
   - Verify shadows update after resize
   - Test window resize scenarios

6. **Test edge cases**
   - Empty content (no children)
   - Disabled prop (no shadows)
   - Custom shadow size/intensity props
   - onScroll callback forwarding (verify not throttled)
   - **Touch scrolling on mobile:** Shadows update correctly with touch events
   - **Mixed content with sticky elements:** Verify no z-index conflicts
   - **Dynamic direction changes:** If content becomes scrollable in new direction, shadows adapt

7. **Test accessibility**
   - Shadows have pointer-events: none
   - Tab navigation works through container
   - Screen reader can access content
   - Run axe-core tests to verify no a11y violations

### Phase 3: Migration

**Core Migrations (Required - 3 minimum):**

1. **Fix Tournament Bracket View (CRITICAL)**
   - Remove broken mask implementation (lines 149-154)
   - Wrap with ScrollShadowContainer direction="both"
   - Test horizontal + vertical scrolling
   - Verify in light/dark themes
   - Check z-index conflicts with SVG connectors

2. **Update Tournament Layout Main Content (HIGH IMPACT)** ✨ NEW
   - Wrap main content Grid in `app/[locale]/tournaments/[id]/layout.tsx` line 261
   - Use ScrollShadowContainer direction="vertical"
   - Maintain existing height/overflow styling
   - Test across all tournament pages (games, results, groups, stats)
   - Verify responsive behavior
   - Note: Server component - may need client wrapper

3. **Update Tournament Sidebar (HIGH IMPACT)** ✨ NEW
   - Wrap sidebar Box in `tournament-sidebar.tsx` line 68
   - Use ScrollShadowContainer direction="vertical"
   - Keep existing hidden scrollbar styling
   - Test with expanded rules, multiple friend groups, conditional content
   - Verify sidebar navigation still works correctly

**Stretch Goals (If time permits):**

4. **Update Results Page Tabs**
   - Wrap Groups tab panel with ScrollShadowContainer
   - Wrap Playoffs tab panel with ScrollShadowContainer
   - Test tab switching behavior
   - Verify shadows update when switching tabs

5. **Update Games List Container**
   - Wrap unified-games-page-client scroll container
   - Keep existing hidden scrollbar styling
   - Test with large game lists (50+ games)
   - Verify auto-scroll behavior still works

6. **Audit remaining containers**
   - Evaluate popovers and backoffice containers
   - Document any containers intentionally not migrated

---

## Testing Strategy

### Unit Tests (Vitest)

**Coverage Target:** ≥80% on new code (SonarCloud requirement)

**Test Categories:**
1. Component rendering (with/without shadows)
2. Overflow detection logic
3. Scroll position tracking
4. Theme integration
5. ResizeObserver handling
6. Props validation
7. Edge cases and error handling

**Testing Utilities:**
- `renderWithTheme()` - For MUI theme testing
- `screen`, `fireEvent` from @testing-library/react
- `vi.fn()` for mocking ResizeObserver
- `act()` for state updates

**Mock Strategy:**
```typescript
// Mock ResizeObserver - store callback for controlled async testing
let resizeCallback: ResizeObserverCallback;
global.ResizeObserver = vi.fn().mockImplementation((callback) => {
  resizeCallback = callback;
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  };
});

// Trigger resize in tests
const triggerResize = (element: HTMLElement, width: number, height: number) => {
  act(() => {
    resizeCallback([{
      target: element,
      contentRect: { width, height },
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: []
    }], {} as ResizeObserver);
  });
};

// Mock scroll behavior - set properties THEN fire event
const mockScrollTo = (container: HTMLElement, scrollTop: number, scrollLeft: number) => {
  Object.defineProperty(container, 'scrollTop', { value: scrollTop, writable: true });
  Object.defineProperty(container, 'scrollLeft', { value: scrollLeft, writable: true });
  Object.defineProperty(container, 'scrollHeight', { value: 1000, writable: true });
  Object.defineProperty(container, 'scrollWidth', { value: 1000, writable: true });
  Object.defineProperty(container, 'clientHeight', { value: 400, writable: true });
  Object.defineProperty(container, 'clientWidth', { value: 400, writable: true });

  fireEvent.scroll(container);
};
```

### Integration Testing

**Manual Testing Checklist:**
- [ ] Tournament bracket scrolls smoothly with shadows
- [ ] Results page tabs show shadows correctly
- [ ] Games list shadows work with 50+ games
- [ ] Shadows work in light mode
- [ ] Shadows work in dark mode
- [ ] **Theme switching mid-scroll:** Switch theme while scrolling, verify smooth transition
- [ ] Shadows respond to window resize
- [ ] Shadows work on mobile viewport (touch scrolling)
- [ ] Keyboard navigation not affected
- [ ] **Sticky elements:** No z-index conflicts with bracket view connectors
- [ ] No console errors or warnings

### Performance Testing

**Large Content Test:**
- Create test with 100+ game cards
- Monitor scroll performance (should be 60fps)
- Check memory usage (no leaks)
- Verify ResizeObserver doesn't cause thrashing

---

## Validation Considerations

### SonarCloud Quality Gates

**Coverage:** ≥80% on new code
- Comprehensive unit tests for component
- Test all props and edge cases
- Test theme integration
- Test event listeners and cleanup

**Code Quality:**
- 0 new code smells
- 0 new bugs
- 0 new security vulnerabilities
- Maintainability rating: A

### Accessibility (a11y)

**Requirements:**
- Shadows don't interfere with keyboard navigation
- pointer-events: none on shadow overlays
- Content remains accessible to screen readers
- No focusable elements within shadow overlays
- ARIA labels if needed (likely not required)

### Browser Compatibility

**Target Browsers:**
- Chrome/Edge (2020+)
- Firefox (2020+)
- Safari desktop & iOS (2020+)

**Web APIs Used:**
- ResizeObserver (2020+ support)
- Scroll events (universal)
- classList API (universal)
- CSS transitions (universal)
- Linear gradients (2012+ support)

---

## Risks & Mitigations

### 1. Performance with Scroll Events

**Risk:** Scroll listener could impact performance on low-end devices
**Impact:** Medium
**Mitigation:**
- Use passive event listeners (already planned)
- Shadows update is lightweight (just class toggles)
- No heavy DOM manipulation in scroll handler
- Consider throttling if issues arise (unlikely needed)

### 2. ResizeObserver Browser Support

**Risk:** Older browsers might not support ResizeObserver
**Impact:** Low (target browsers all support it)
**Mitigation:**
- Target browsers (2020+) all support ResizeObserver
- Could add polyfill if needed (not planned initially)
- Graceful degradation: shadows still work, just won't update on resize

### 3. Dynamic Content Changes

**Risk:** Content height/width changes might not trigger shadow updates
**Impact:** Medium
**Mitigation:**
- ResizeObserver on both container AND content
- Parent components can manually trigger update by re-rendering
- Document when manual updates might be needed

### 4. SSR/Hydration Mismatch

**Risk:** Server-rendered content might not match client shadows
**Impact:** Low
**Mitigation:**
- Component is client-only ('use client' directive)
- Shadows calculated entirely client-side
- No server-side rendering of shadow state

### 5. Theme Switching During Scroll

**Risk:** Visual glitch if user switches theme mid-scroll
**Impact:** Low
**Mitigation:**
- MUI's `useTheme()` hook triggers re-render on theme change
- Component re-renders with new theme colors
- CSS transitions (0.3s ease) smooth the color change
- Shadow positions remain stable (only colors change)
- Verified in mockup testing - no flashing observed
- Explicit test case added: "Theme switching mid-scroll"

### 6. Z-Index Conflicts with Sticky/Fixed Elements

**Risk:** Shadow overlays might conflict with sticky child elements (e.g., bracket view SVG connectors)
**Impact:** Low
**Mitigation:**
- Shadow overlays use z-index: 10
- Verify no conflicts during migration testing
- Adjust z-index if needed for specific containers
- pointer-events: none prevents interaction issues
- Tournament bracket uses z-index: 0-1 for SVG/cards (verified in exploration)

---

## Comprehensive Scroll Container Audit

**Audit completed based on user PR feedback:** All `overflow: auto` instances in the codebase have been identified and categorized.

### User-Facing Containers (Priority for Migration)

1. **Tournament Bracket View** (`playoffs-bracket-view.tsx`)
   - Currently has broken mask implementation (lines 149-154)
   - Needs horizontal + vertical shadows
   - **Priority: CRITICAL** (currently broken)

2. **Tournament Layout - Main Content** (`app/[locale]/tournaments/[id]/layout.tsx`)
   - Line 261: Main content Grid with `overflow: 'auto'`
   - Contains the primary tournament pages (games, results, groups, stats)
   - **Priority: HIGH** (main user navigation area)
   - **Status: NEW - Added from user feedback**

3. **Tournament Sidebar** (`tournament-page/tournament-sidebar.tsx`)
   - Line 68: Sidebar scroll container with hidden scrollbars
   - Contains rules, stats, group standings, friend groups
   - **Priority: HIGH** (main user navigation area)
   - **Status: NEW - Added from user feedback**

4. **Results Page Tabs** (`results-page-client.tsx`)
   - Lines 78, 95: Both tab panels have `overflow: 'auto'`
   - Groups stage and Playoffs tabs
   - **Priority: MEDIUM**

5. **Games List Container** (`unified-games-page-client.tsx`)
   - Vertical scrolling of game cards with hidden scrollbars
   - **Priority: MEDIUM**

### Additional Containers (Lower Priority / Optional)

6. **Popovers** (Good candidates for UX enhancement)
   - `tournament-details-popover.tsx` line 43: `maxHeight: '80vh', overflow: 'auto'`
   - `game-details-popover.tsx` line 58: `maxHeight: '80vh', overflow: 'auto'`
   - **Priority: LOW** (small modals, less critical)

7. **Backoffice Components** (Admin only, lowest priority)
   - `tournament-third-place-rules-tab.tsx` lines 232, 297
   - `internal/group-dialog.tsx` lines 178, 211
   - `tournament-main-data-tab.tsx` line 559
   - **Priority: VERY LOW** (admin-only features)

**Total Identified:** 10 scroll containers (7 user-facing + 3 backoffice)

### Migration Strategy

**Core Migrations (Required - 3 minimum for acceptance criteria):**

**Migration #1: Tournament Bracket View (CRITICAL)**
- File: `playoffs-bracket-view.tsx`
- Action: Remove broken mask (lines 149-154), wrap with `<ScrollShadowContainer direction="both">`
- Impact: Fixes currently broken functionality
- Testing: Horizontal + vertical scrolling, z-index conflicts with SVG, light/dark themes

**Migration #2: Tournament Layout Main Content (HIGH IMPACT)** ✨ NEW
- File: `app/[locale]/tournaments/[id]/layout.tsx` line 261
- Action: Wrap main content Grid with `<ScrollShadowContainer direction="vertical">`
- Impact: All tournament pages get scroll indicators (games, results, stats, groups)
- Testing: Test across all tournament pages, responsive behavior, long content
- Notes: This is the primary container users interact with

**Migration #3: Tournament Sidebar (HIGH IMPACT)** ✨ NEW
- File: `tournament-sidebar.tsx` line 68
- Action: Wrap sidebar Box with `<ScrollShadowContainer direction="vertical">`
- Impact: Sidebar navigation gets scroll indicators
- Testing: Expanded rules, multiple friend groups, conditional content
- Notes: Keep existing hidden scrollbar styling

**Rationale for Updated Priority:**
- User feedback highlighted tournament layout containers as important
- These containers have **highest user visibility** (main navigation areas)
- **Broader impact** than original plan (affects all tournament pages, not just results)
- Original plan targeted Results Tabs + Games List, but tournament layout is more critical

### Migration Contingency

**If Tournament Layout migration has issues:**
- Layout.tsx is server component, might need client component wrapper
- Children rendering patterns must be preserved
- If blocked, fall back to Results Tabs (#4) or Games List (#5)
- Minimum 3 migrations still achievable with backup options

**Risk mitigation:**
- Test tournament layout migration carefully
- Verify no hydration issues with server/client boundary
- Ensure children prop forwarding works correctly

---

## Open Questions

None - all requirements clarified via:
- Interactive mockup validation with user
- Comprehensive issue documentation
- Codebase exploration
- Testing pattern analysis
- User PR feedback on additional scroll containers

---

## Dependencies

**No new external dependencies required.**

All implementation uses:
- React built-in hooks (useState, useEffect, useRef)
- MUI useTheme hook (already in package.json)
- Standard Web APIs (ResizeObserver, addEventListener)

---

## Rollout Plan

### Phase 1: Component + Tests
- Create ScrollShadowContainer component
- Write comprehensive unit tests
- Achieve 80% coverage

### Phase 2: Fix Broken Implementation
- Migrate Tournament Bracket view (highest priority - currently broken)
- Verify shadows work correctly in 2D scrolling scenario

### Phase 3: Enhance Existing Containers
- Migrate Results page tabs
- Migrate Games list container
- Test each migration thoroughly

### Phase 4: Audit & Document
- Search for remaining scroll containers
- Document component usage in codebase
- Create usage examples if needed

---

## Success Metrics

- ✅ 0 SonarCloud issues introduced
- ✅ ≥80% test coverage on new code
- ✅ Tournament bracket shadows working (broken mask fixed)
- ✅ 3+ containers successfully migrated
- ✅ No performance degradation
- ✅ No accessibility issues
- ✅ Works in all target browsers
- ✅ User can clearly see when more content is available to scroll

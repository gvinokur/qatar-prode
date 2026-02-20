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
- [ ] At least 3 existing scroll containers migrated successfully

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

### Modified Files

1. **`app/components/results-page/playoffs-bracket-view.tsx`**
   - Remove broken mask implementation (lines 149-154)
   - Wrap bracket container with `<ScrollShadowContainer direction="both">`
   - Update container styling (remove mask-related sx props)

2. **`app/components/results-page/results-page-client.tsx`**
   - Wrap both tab panels (lines 71-86, 88-103) with `<ScrollShadowContainer direction="vertical">`
   - Maintain existing sx styling for flex layout

3. **`app/components/unified-games-page-client.tsx`**
   - Wrap games scroll container (lines 178-192) with `<ScrollShadowContainer direction="vertical">`
   - Keep existing hidden scrollbar styling

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

1. **Fix Tournament Bracket View**
   - Remove broken mask implementation
   - Wrap with ScrollShadowContainer direction="both"
   - Test horizontal + vertical scrolling
   - Verify in light/dark themes

2. **Update Results Page Tabs**
   - Wrap Groups tab panel with ScrollShadowContainer
   - Wrap Playoffs tab panel with ScrollShadowContainer
   - Test tab switching behavior
   - Verify shadows update when switching tabs

3. **Update Games List Container**
   - Wrap unified-games-page-client scroll container
   - Keep existing hidden scrollbar styling
   - Test with large game lists (50+ games)
   - Verify auto-scroll behavior still works

4. **Audit remaining containers**
   - Search for overflow: auto in codebase
   - Evaluate each for shadow enhancement
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

## Open Questions

None - all requirements clarified via:
- Interactive mockup validation with user
- Comprehensive issue documentation
- Codebase exploration
- Testing pattern analysis

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

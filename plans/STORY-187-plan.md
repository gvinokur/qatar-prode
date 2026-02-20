# Implementation Plan: Story #187 - Generic Scroll Shadow Indicator Component

## Story Context

**Issue:** [#187 - [UX Enhancement] Implement Generic Scroll Shadow Indicator Component](https://github.com/gvinokur/qatar-prode/issues/187)

**Problem:**
The application has multiple scrollable containers throughout the UI, but users lack visual feedback to indicate when there's hidden content above, below, or to the sides of their current scroll position. This creates a poor UX where users may not realize they can scroll to see more content.

**Current Issues:**
- Tournament Bracket view attempts scroll shadows using CSS masks (lines 149-154 in `playoffs-bracket-view.tsx`), but it's **not working properly** because the mask is applied to content instead of the scroll container
- TournamentSidebar has `overflow: 'auto'` with hidden scrollbar but no scroll indicators
- Results page tabs have `overflow: 'auto'` with no scroll indicators
- Multiple components use `overflow: auto` without user guidance

**Objectives:**
1. Create a reusable `ScrollShadowContainer` component that provides visual feedback for scrollable content
2. Integrate seamlessly with MUI theming (light/dark mode support)
3. Only show shadows when content actually overflows
4. Support vertical, horizontal, and bidirectional scrolling
5. Roll out progressively across the application in phases

---

## Acceptance Criteria

- [ ] `ScrollShadowContainer` component created
- [ ] Shadows only appear when content overflows
- [ ] Shadows correctly indicate scroll direction possibilities (top/bottom/left/right)
- [ ] Works with MUI light/dark themes
- [ ] Handles window resize gracefully
- [ ] 80% test coverage
- [ ] Accessible (doesn't interfere with keyboard/screen readers)
- [ ] Performance tested with large content
- [ ] **Phase 1:** TournamentSidebar uses ScrollShadowContainer
- [ ] **Phase 2:** At least 3 additional scroll containers migrated (results tabs, main content area, etc.)
- [ ] Broken Tournament bracket mask implementation fixed or removed

---

## Technical Approach

### Implementation Strategy: JavaScript + IntersectionObserver

**Rationale:**
- Best browser compatibility (vs. scroll-state container queries which have limited support)
- Full control over shadow appearance and theming
- Works seamlessly with MUI's theme system
- Can detect actual overflow (vs. pure CSS which shows shadows even when not scrollable)
- Better than pure CSS gradient approach which is harder to theme

### Component Architecture

**File:** `/app/components/common/scroll-shadow-container.tsx`

**Core Features:**
1. **Overflow Detection:** Use ResizeObserver to detect when content overflows container
2. **Scroll Position Tracking:** Use scroll event listeners to track position
3. **Shadow Rendering:** Conditionally render shadow overlays based on scroll position
4. **Theme Integration:** Use MUI's `useTheme()` and `alpha()` for theme-aware shadows
5. **Accessibility:** Shadows are purely decorative (no ARIA changes needed)

**API Design:**
```typescript
interface ScrollShadowContainerProps {
  children: React.ReactNode;
  direction?: 'vertical' | 'horizontal' | 'both';
  shadowSize?: number; // default: 40px
  shadowColor?: string; // default: theme-based (black with alpha). Accepts: hex (#000000), rgba(0,0,0,0.2), CSS color names
  hideScrollbar?: boolean; // default: false. When true, hides native scrollbars with CSS (TournamentSidebar needs this)
  height?: string | number;
  width?: string | number;
  sx?: SxProps<Theme>;
}
```

**Usage Example:**
```tsx
<ScrollShadowContainer
  direction="vertical"
  height="100%"
  hideScrollbar={true}
>
  <YourScrollableContent />
</ScrollShadowContainer>
```

### Shadow Implementation Details

**Shadow Appearance:**
- Top shadow: Gradient from `rgba(0,0,0,0.2)` to transparent (light mode)
- Top shadow: Gradient from `rgba(0,0,0,0.4)` to transparent (dark mode)
- Height/width: 40px default (configurable)
- Positioned absolutely at edges of container
- Fades in/out smoothly based on scroll position

**Shadow Visibility Logic:**
- **Top shadow:** Visible when `scrollTop > 0`
- **Bottom shadow:** Visible when `scrollTop < (scrollHeight - clientHeight)`
- **Left shadow:** Visible when `scrollLeft > 0`
- **Right shadow:** Visible when `scrollLeft < (scrollWidth - clientWidth)`

**Performance:**
- **Scroll events:** Do NOT debounce state updates (shadows must respond immediately for visual feedback)
- **ResizeObserver:** Debounce recalculation (250ms) since resize events are less frequent
- Use `requestAnimationFrame` for rendering updates (not state changes)
- Clean up event listeners and observers on unmount

**State Management:**
- Use single state object for all shadows to avoid SonarCloud "use compound state" code smell:
  ```typescript
  type ShadowState = { top: boolean; bottom: boolean; left: boolean; right: boolean }
  const [shadows, setShadows] = useState<ShadowState>({ top: false, bottom: false, left: false, right: false })
  ```

---

## Visual Prototypes

### Component: ScrollShadowContainer (Vertical Scrolling)

**Scroll Position: Top (scrollTop = 0)**
```
┌─────────────────────────────────────┐
│  No shadow at top                   │
│                                     │
│  [Content visible]                  │
│  Line 1                             │
│  Line 2                             │
│  Line 3                             │
│  ...more content below...           │
│                                     │
├─────────────────────────────────────┤
│  ▼ Shadow indicates more content ▼  │
│     (gradient: dark → transparent)  │
└─────────────────────────────────────┘
```

**Scroll Position: Middle (scrollTop > 0 and not at bottom)**
```
┌─────────────────────────────────────┐
│  ▲ Shadow indicates content above ▲ │
│     (gradient: transparent → dark)  │
├─────────────────────────────────────┤
│                                     │
│  [Content visible]                  │
│  Line 10                            │
│  Line 11                            │
│  Line 12                            │
│  ...more content above & below...   │
│                                     │
├─────────────────────────────────────┤
│  ▼ Shadow indicates more content ▼  │
│     (gradient: dark → transparent)  │
└─────────────────────────────────────┘
```

**Scroll Position: Bottom (scrollTop = scrollHeight - clientHeight)**
```
┌─────────────────────────────────────┐
│  ▲ Shadow indicates content above ▲ │
│     (gradient: transparent → dark)  │
├─────────────────────────────────────┤
│  ...content above...                │
│  Line 48                            │
│  Line 49                            │
│  Line 50 (last)                     │
│                                     │
│  No shadow at bottom                │
└─────────────────────────────────────┘
```

### Visual Design Details

**Shadow Gradient:**
- **Light mode:** `linear-gradient(to bottom, rgba(0,0,0,0.2), transparent)`
- **Dark mode:** `linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)`
- **Size:** 40px tall for vertical, 40px wide for horizontal
- **Transition:** `opacity 0.2s ease-in-out` for smooth fade

**States:**
- **No overflow:** No shadows visible at all
- **Overflow + scrollable:** Shadows appear at non-visible edges
- **Resize:** Shadows recalculate when container/content size changes

**Theme Integration:**
- Uses `theme.palette.mode` to determine light/dark
- Shadow color customizable via `shadowColor` prop
- Falls back to `theme.palette.text.primary` with alpha if no color specified

---

## Phased Implementation

### Phase 1: Component Development + Sidebar Integration

**Objective:** Create the component and validate it works in one real-world use case (TournamentSidebar)

**Steps:**
1. Create `ScrollShadowContainer` component
2. Implement overflow detection with ResizeObserver
3. Implement scroll position tracking
4. Add shadow rendering logic
5. Integrate with MUI theme
6. Apply to TournamentSidebar (first real use case)
7. Test with different content sizes and themes

**Files Modified:**
- **NEW:** `/app/components/common/scroll-shadow-container.tsx`
- **MODIFIED:** `/app/components/tournament-page/tournament-sidebar.tsx`

**Success Criteria:**
- TournamentSidebar shows scroll shadows when content overflows
- Shadows disappear when content doesn't overflow (e.g., on large screens)
- Works in both light and dark modes
- No performance issues or jank

### Phase 2: Progressive Migration to Other Surfaces

**Objective:** Roll out to other identified scroll containers

**Surfaces to Migrate (in priority order):**
1. **Results Page Tabs** (`/app/components/results-page/results-page-client.tsx`)
   - Lines 78, 95: Two tab panels with `overflow: 'auto'`

2. **Main Content Area** (`/app/[locale]/tournaments/[id]/layout.tsx`)
   - Line 261: Grid item with `overflow: 'auto'`

3. **Playoffs Bracket View** (`/app/components/results-page/playoffs-bracket-view.tsx`)
   - **Investigation step:** Load tournament with playoffs in browser, check:
     a) Does content overflow horizontally/vertically?
     b) Is the CSS mask (lines 149-154) actually visible/working?
   - **If bracket is scrollable:** Remove mask, apply ScrollShadowContainer
   - **If bracket is fixed-size:** Remove non-functional mask implementation (lines 149-154)
   - Document decision in plan amendment

4. **Audit remaining containers:**
   - Search codebase for `overflow: 'auto'` or `overflow: 'scroll'`
   - Evaluate each on case-by-case basis
   - Apply ScrollShadowContainer where appropriate

**Steps:**
1. Apply to results page tabs (highest impact)
2. Apply to main content area
3. Fix or remove broken bracket mask implementation
4. Audit codebase with `grep -r "overflow.*auto"` and `grep -r "overflow.*scroll"`
5. Document any containers that intentionally don't use ScrollShadowContainer (with reason)

**Success Criteria:**
- At least 3 additional containers migrated
- Broken bracket mask removed or fixed
- All new integrations tested in light/dark mode
- No visual regressions

---

## Files to Create/Modify

### Phase 1: Component + Sidebar

**New Files:**
1. `/app/components/common/scroll-shadow-container.tsx` - Main component
2. `/app/components/common/scroll-shadow-container.test.tsx` - Unit tests

**Modified Files:**
1. `/app/components/tournament-page/tournament-sidebar.tsx` - Apply ScrollShadowContainer

### Phase 2: Migration

**Modified Files:**
1. `/app/components/results-page/results-page-client.tsx` - Results tabs
2. `/app/[locale]/tournaments/[id]/layout.tsx` - Main content area
3. `/app/components/results-page/playoffs-bracket-view.tsx` - Fix broken mask

---

## Implementation Steps

### Step 1: Create ScrollShadowContainer Component

**File:** `/app/components/common/scroll-shadow-container.tsx`

**Implementation:**
```typescript
'use client'

import { useTheme, Box, alpha } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import type { SxProps, Theme } from '@mui/material'

interface ScrollShadowContainerProps {
  children: React.ReactNode
  direction?: 'vertical' | 'horizontal' | 'both'
  shadowSize?: number
  shadowColor?: string
  hideScrollbar?: boolean
  height?: string | number
  width?: string | number
  sx?: SxProps<Theme>
}

export function ScrollShadowContainer({
  children,
  direction = 'vertical',
  shadowSize = 40,
  shadowColor,
  hideScrollbar = false,
  height,
  width,
  sx = {},
}: ScrollShadowContainerProps) {
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  // Single state object to avoid SonarCloud "use compound state" code smell
  type ShadowState = { top: boolean; bottom: boolean; left: boolean; right: boolean }
  const [shadows, setShadows] = useState<ShadowState>({
    top: false,
    bottom: false,
    left: false,
    right: false
  })

  // Helper function for testability and cognitive complexity reduction
  const calculateShadowVisibility = useCallback((
    el: HTMLElement,
    dir: 'vertical' | 'horizontal' | 'both'
  ): ShadowState => {
    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = el

    return {
      top: dir !== 'horizontal' && scrollTop > 0,
      bottom: dir !== 'horizontal' && scrollTop < scrollHeight - clientHeight,
      left: dir !== 'vertical' && scrollLeft > 0,
      right: dir !== 'vertical' && scrollLeft < scrollWidth - clientWidth,
    }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scroll event handler (NO debouncing - immediate visual feedback)
    const handleScroll = () => {
      setShadows(calculateShadowVisibility(container, direction))
    }

    // ResizeObserver (debounced 250ms - resize is less frequent)
    let resizeTimeout: NodeJS.Timeout
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        setShadows(calculateShadowVisibility(container, direction))
      }, 250)
    })

    container.addEventListener('scroll', handleScroll)
    resizeObserver.observe(container)

    // Initial calculation
    handleScroll()

    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
      clearTimeout(resizeTimeout)
    }
  }, [direction, calculateShadowVisibility])

  // Return Box with scroll container + shadow overlays
  // Shadows positioned absolutely with pointer-events: none
  // Content should have padding; shadows sit on top
}
```

**Key Implementation Details:**
- Use `useRef` to access scroll container DOM element
- Single `useState<ShadowState>` to track which shadows should be visible (avoid SonarCloud code smell)
- `useEffect` to set up ResizeObserver (debounced 250ms) and scroll listeners (NOT debounced)
- Extract shadow visibility calculation into separate helper function for testability and cognitive complexity:
  ```typescript
  function calculateShadowVisibility(
    direction: 'vertical' | 'horizontal' | 'both',
    scroll: { top: number; left: number },
    size: { scrollHeight: number; clientHeight: number; scrollWidth: number; clientWidth: number }
  ): ShadowState
  ```
- Shadow overlays positioned absolutely with `pointer-events: none`
- Shadows sit on top of content (content should have padding if needed)
- Clean up observers/listeners on unmount

### Step 2: Apply to TournamentSidebar

**File:** `/app/components/tournament-page/tournament-sidebar.tsx`

**Changes:**
- Import ScrollShadowContainer
- Wrap existing scrollable Box content with ScrollShadowContainer
- Remove inline scrollbar hiding CSS from inner Box (lines 71-75: `scrollbarWidth: 'none'`, `msOverflowStyle: 'none'`, `'&::-webkit-scrollbar'`)
- Pass `direction="vertical"` and `hideScrollbar={true}` to component (TournamentSidebar always hides scrollbars)
- ScrollShadowContainer inherits `overflow: 'auto'` from wrapped Box

**Before (lines 68-75):**
```tsx
<Box sx={{
  overflow: 'auto',
  scrollbarWidth: 'none', // Firefox
  msOverflowStyle: 'none', // IE/Edge
  '&::-webkit-scrollbar': { display: 'none' }, // Chrome/Safari
  ...
}}>
  {content}
</Box>
```

**After:**
```tsx
<ScrollShadowContainer
  direction="vertical"
  hideScrollbar={true}
  height="100%"
  sx={{ flexGrow: 1, minHeight: 0 }}
>
  {content}
</ScrollShadowContainer>
```

**Note:** ScrollShadowContainer will apply `overflow: 'auto'` internally, so remove it from the wrapped Box. The `hideScrollbar` prop handles the scrollbar CSS.

### Step 3: Create Comprehensive Unit Tests

**File:** `/app/components/common/scroll-shadow-container.test.tsx`

**Test Cases:**
1. **Rendering:** Component renders children correctly
2. **No overflow:** No shadows when content doesn't overflow
3. **Vertical overflow:** Shows bottom shadow when scrolled to top
4. **Vertical overflow:** Shows both shadows when scrolled to middle
5. **Vertical overflow:** Shows top shadow when scrolled to bottom
6. **Horizontal overflow:** Similar tests for left/right shadows
7. **Both directions:** Tests for bidirectional scrolling
8. **Theme integration:** Shadows use correct colors in light/dark mode
9. **Resize handling:** Shadows recalculate when container resizes
10. **Custom props:** shadowSize, shadowColor, hideScrollbar work correctly
11. **Cleanup:** Event listeners removed on unmount

**Testing Strategy:**
- Use Vitest with @testing-library/react
- Mock ResizeObserver (JSDOM doesn't provide it)
- Simulate scroll events with `fireEvent.scroll()`
- Test shadow visibility with `getComputedStyle()` or data attributes
- Mock theme with MUI's ThemeProvider test wrapper

**Coverage Target:** 80%+ on new code

### Step 4: Apply to Results Page Tabs

**File:** `/app/components/results-page/results-page-client.tsx`

**Changes:**
- Wrap both tab panel contents with ScrollShadowContainer
- Lines 71-86 (Groups tab) and 88-103 (Playoffs tab)
- Keep existing overflow behavior
- Test with different result set sizes

### Step 5: Apply to Main Content Area

**File:** `/app/[locale]/tournaments/[id]/layout.tsx`

**Changes:**
- Wrap Grid item content with ScrollShadowContainer (line 246-262)
- Maintain existing height calculations
- Test with different viewport sizes

### Step 6: Fix Broken Playoffs Bracket Mask

**File:** `/app/components/results-page/playoffs-bracket-view.tsx`

**Investigation Steps:**
1. Load tournament with playoffs in local dev
2. Check if bracket content overflows container (horizontal/vertical)
3. Verify if current CSS mask (lines 149-154) is visible/working

**Acceptance Criteria:**
- **If bracket IS scrollable:**
  - Remove CSS mask (lines 149-154)
  - Apply ScrollShadowContainer with `direction="both"` (horizontal + vertical)
  - Test scrolling in both directions
- **If bracket is fixed-size (no overflow):**
  - Remove non-functional mask implementation (lines 149-154)
  - No ScrollShadowContainer needed
- **Document decision:** Add amendment to plan explaining which option was chosen and why

### Step 7: Audit Remaining Containers

**Action:**
```bash
# Find all overflow: auto/scroll declarations
grep -r "overflow.*auto" app/
grep -r "overflow.*scroll" app/
```

**Evaluation:** For each result, determine if ScrollShadowContainer should be applied

---

## Testing Strategy

### Unit Tests (80% Coverage Required)

**File:** `/app/components/common/scroll-shadow-container.test.tsx`

**Test Utilities:**
- Use `renderWithTheme()` from `@/__tests__/utils/test-utils`
- Mock ResizeObserver: Create mock class that tracks callbacks
- Mock scroll behavior: Set `scrollTop`, `scrollHeight`, `clientHeight` on mock elements, then dispatch scroll event

**Example Test (Complete Working Example):**
```typescript
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { fireEvent } from '@testing-library/react'
import { ScrollShadowContainer } from '../scroll-shadow-container'

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('ScrollShadowContainer', () => {
  it('shows bottom shadow when content overflows and scrolled to top', () => {
    const { container } = renderWithTheme(
      <ScrollShadowContainer direction="vertical" height="100px">
        <div style={{ height: '200px' }}>Tall content</div>
      </ScrollShadowContainer>
    )

    const scrollContainer = container.querySelector('[data-scroll-container]')

    // Set up overflow condition
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 200, configurable: true })
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 0, configurable: true })

    // Manually trigger scroll event listener (fireEvent.scroll doesn't update scrollTop)
    scrollContainer.dispatchEvent(new Event('scroll'))

    // Assert bottom shadow is visible
    const bottomShadow = container.querySelector('[data-shadow="bottom"]')
    expect(bottomShadow).toBeVisible()
    expect(bottomShadow).toHaveAttribute('data-visible', 'true')
  })

  it('shows both shadows when scrolled to middle', () => {
    const { container } = renderWithTheme(
      <ScrollShadowContainer direction="vertical" height="100px">
        <div style={{ height: '300px' }}>Very tall content</div>
      </ScrollShadowContainer>
    )

    const scrollContainer = container.querySelector('[data-scroll-container]')

    // Set up overflow + middle scroll position
    Object.defineProperty(scrollContainer, 'scrollHeight', { value: 300, configurable: true })
    Object.defineProperty(scrollContainer, 'clientHeight', { value: 100, configurable: true })
    Object.defineProperty(scrollContainer, 'scrollTop', { value: 100, configurable: true })

    scrollContainer.dispatchEvent(new Event('scroll'))

    // Assert both top and bottom shadows visible
    const topShadow = container.querySelector('[data-shadow="top"]')
    const bottomShadow = container.querySelector('[data-shadow="bottom"]')

    expect(topShadow).toHaveAttribute('data-visible', 'true')
    expect(bottomShadow).toHaveAttribute('data-visible', 'true')
  })
})
```

**Testing Notes:**
- Use `dispatchEvent(new Event('scroll'))` to manually trigger scroll listeners (fireEvent.scroll doesn't update DOM properties)
- Set `configurable: true` on defineProperty so properties can be changed between tests
- Use data attributes (`data-visible`, `data-shadow`) to make testing easier than checking computed styles

**Coverage Areas:**
- Shadow visibility logic (all scroll positions)
- ResizeObserver integration
- Theme color calculation
- Cleanup on unmount
- Props validation (direction, shadowSize, etc.)
- Edge cases (content exactly fits container, very small containers)

### Integration Tests

**Test in Browser:**
1. TournamentSidebar with varying content heights
2. Results tabs with many/few results
3. Theme switching (light ↔ dark)
4. Window resize
5. Mobile responsive behavior

**Manual Testing Checklist:**
- [ ] Shadows appear/disappear correctly when scrolling
- [ ] Shadows respect theme colors (light/dark mode)
- [ ] No jank or performance issues
- [ ] Shadows don't interfere with clicking content
- [ ] Keyboard navigation still works
- [ ] Screen reader experience unchanged
- [ ] Works on Chrome, Firefox, Safari

### Performance Testing

**Metrics:**
- Scroll event handling should not cause jank (>60fps)
- ResizeObserver should not cause layout thrashing
- Component should handle containers with 1000+ child elements

**Testing:**
- Use Chrome DevTools Performance tab
- Record scroll interactions
- Ensure no forced reflows or excessive paints

---

## Validation Considerations

### SonarCloud Quality Gates

**Requirements:**
- 80% coverage on new code ✓ (comprehensive unit tests)
- 0 new issues of any severity
- Security rating: A
- Maintainability: B or higher

**Potential Issues to Avoid:**
- Cognitive complexity: Keep methods small and focused
- Code duplication: Extract shadow rendering logic into helpers
- Accessibility: Ensure shadows are decorative only (no semantic meaning)
- Performance: Debounce scroll events, use requestAnimationFrame

### Pre-Merge Checklist

**Phase 1:**
- [ ] ScrollShadowContainer component created and tested
- [ ] TournamentSidebar integration complete
- [ ] Unit tests pass with 80%+ coverage
- [ ] Manual testing in light/dark mode
- [ ] No console errors or warnings
- [ ] SonarCloud shows 0 new issues

**Phase 2:**
- [ ] Results tabs integration complete
- [ ] Main content area integration complete
- [ ] Broken bracket mask fixed or removed
- [ ] Audit of remaining containers complete
- [ ] All integrations tested
- [ ] Documentation updated (if needed)

### Accessibility

**Requirements:**
- Shadows must be purely decorative (no semantic content)
- No ARIA labels needed (shadows don't convey information)
- Component must not interfere with keyboard navigation
- Component must not interfere with screen readers

**Testing:**
- Use keyboard to navigate scrollable content
- Use screen reader (NVDA/JAWS/VoiceOver) to verify no interference

---

## Open Questions

1. **Sidebar scrollbar hiding:** Should we keep `hideScrollbar` as an option, or always hide scrollbars when using ScrollShadowContainer?
   - **Recommendation:** Make it optional, default to false (show scrollbars)

2. **Shadow color customization:** Should we expose more theme-aware shadow colors (e.g., use primary color for shadows)?
   - **Recommendation:** Start simple with black + alpha, can enhance later if needed

3. **Bracket view:** Is the playoffs bracket supposed to be scrollable, or is it a fixed-size SVG?
   - **Action needed:** Test in browser to determine correct behavior

4. **Animation timing:** Should shadows fade in/out, or appear instantly?
   - **Recommendation:** Smooth fade (0.2s) for better UX

5. **RTL (Right-to-Left) support:** Does the app support RTL layouts?
   - **Investigation needed:** Check if app has RTL support (Arabic, Hebrew, etc.)
   - If yes: Left/right shadows may need to flip
   - If no: Document that RTL is not currently supported

6. **Content padding vs shadow overlap:** Should shadows sit on top of content padding?
   - **Recommendation:** Shadows positioned absolutely on container edges
   - Content should have padding if needed (shadows will sit on top)
   - Document this in component usage notes

---

## Success Metrics

**Phase 1 Complete When:**
- ScrollShadowContainer component exists and passes tests
- TournamentSidebar uses the component
- Manual testing confirms it works in light/dark mode
- SonarCloud shows no new issues

**Phase 2 Complete When:**
- At least 3 additional containers migrated
- Broken bracket mask issue resolved
- All migrations tested and working
- User can clearly see when content is scrollable

**Overall Success:**
- Users have clear visual feedback for scrollable content
- Component is reusable across the entire app
- No performance regressions
- Meets all quality gates

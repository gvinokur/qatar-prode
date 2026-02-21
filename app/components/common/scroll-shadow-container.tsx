'use client'

import { useTheme, Box, alpha } from '@mui/material'
import { useEffect, useRef, useState, useCallback } from 'react'
import type { SxProps, Theme } from '@mui/material'

/**
 * ScrollShadowContainer - A container component that displays shadow indicators
 * when content is scrollable.
 *
 * This component wraps scrollable content and automatically shows/hides shadow overlays
 * at the edges to indicate that more content is available in that direction.
 *
 * ## Architecture
 *
 * **Single Box Structure:**
 * The component uses ONE box element (not nested boxes) with:
 * - `position: 'relative'` - for shadow positioning
 * - `overflow` - calculated from `direction` prop (overflowX/overflowY)
 * - User's `sx` props - height, width, padding, etc.
 * - Shadow overlays as absolutely-positioned children
 *
 * This single-box approach prevents height/overflow conflicts that occur with nested containers.
 *
 * ## Direction Prop
 *
 * Controls scroll behavior and shadow visibility:
 * - `'vertical'` - Scrolls vertically (overflowY: auto, overflowX: hidden)
 * - `'horizontal'` - Scrolls horizontally (overflowX: auto, overflowY: hidden)
 * - `'both'` - Scrolls in both directions (both overflow: auto)
 * - `'none'` - No scrolling (both overflow: hidden, no shadows)
 *
 * **IMPORTANT:** Do NOT pass `overflow`, `overflowX`, or `overflowY` in the `sx` prop.
 * Always use the `direction` prop to control scroll behavior.
 *
 * ## Responsive Scrolling Pattern
 *
 * For containers that should scroll on mobile but not desktop (or vice versa),
 * use `useMediaQuery` to set the direction prop dynamically:
 *
 * @example
 * ```tsx
 * import { useTheme, useMediaQuery } from '@mui/material';
 *
 * function MyComponent() {
 *   const theme = useTheme();
 *   const isMobile = useMediaQuery(theme.breakpoints.down('md'));
 *
 *   return (
 *     <ScrollShadowContainer
 *       direction={isMobile ? 'vertical' : 'none'}
 *       height="100%"
 *     >
 *       <Content />
 *     </ScrollShadowContainer>
 *   );
 * }
 * ```
 *
 * ## Nested ScrollShadowContainers
 *
 * When nesting ScrollShadowContainers (e.g., outer stack with inner games list),
 * use `direction='none'` to prevent one from scrolling while allowing the other:
 *
 * @example
 * ```tsx
 * function GamesPage() {
 *   const isMobile = useMediaQuery(theme.breakpoints.down('md'));
 *
 *   return (
 *     // Outer: scrolls on mobile, doesn't scroll on desktop
 *     <ScrollShadowContainer
 *       direction={isMobile ? 'vertical' : 'none'}
 *       height="100%"
 *     >
 *       <Dashboard />
 *       <Filters />
 *
 *       // Inner container: doesn't scroll on mobile, scrolls on desktop
 *       <ScrollShadowContainer
 *         direction={isMobile ? 'none' : 'vertical'}
 *         sx={{ flexGrow: 1, minHeight: 0 }}
 *       >
 *         <GamesList />
 *       </ScrollShadowContainer>
 *     </ScrollShadowContainer>
 *   );
 * }
 * ```
 *
 * This prevents double-scrolling on mobile and ensures proper behavior on both screen sizes.
 *
 * ## sx vs scrollContainerSx
 *
 * **Use `sx` for:** Outer wrapper styles (size, position)
 * - `height`, `width` (though dedicated props are preferred)
 * - Rarely needed since most styling goes on scroll container
 *
 * **Use `scrollContainerSx` for:** Inner scroll container styles (layout, spacing)
 * - `display: 'flex'`, `flexDirection`, `gap` (for flex layout of children)
 * - `padding`, `paddingTop`, `paddingBottom` (spacing inside scroll area)
 * - Any styles that affect how children are laid out
 *
 * @example
 * ```tsx
 * // Flex layout with children - use scrollContainerSx
 * <ScrollShadowContainer
 *   direction="vertical"
 *   height="100%"
 *   scrollContainerSx={{
 *     display: 'flex',
 *     flexDirection: 'column',
 *     gap: 2,
 *     pt: 2,
 *   }}
 * >
 *   <Dashboard />
 *   <Filters />
 *   <GamesList sx={{ flexGrow: 1 }} />
 * </ScrollShadowContainer>
 * ```
 *
 * ## Basic Examples
 *
 * @example
 * ```tsx
 * // Simple vertical scrolling
 * <ScrollShadowContainer
 *   direction="vertical"
 *   height="400px"
 *   hideScrollbar={true}
 * >
 *   <YourScrollableContent />
 * </ScrollShadowContainer>
 * ```
 *
 * @example
 * ```tsx
 * // With HTML attributes for accessibility
 * <ScrollShadowContainer
 *   role="tabpanel"
 *   id="panel-1"
 *   aria-labelledby="tab-1"
 *   hidden={selectedTab !== 0}
 *   direction="vertical"
 *   height="100%"
 * >
 *   <TabContent />
 * </ScrollShadowContainer>
 * ```
 *
 * ## Requirements
 *
 * **Container Size:**
 * The container MUST have a defined height (for vertical scrolling) or width
 * (for horizontal scrolling):
 * - Absolute: `height="400px"` or `width="600px"`
 * - Relative: `height="100%"` or `width="100%"` (parent must have defined size)
 * - Viewport-relative: `height="100vh"` or `width="100vw"`
 *
 * Without a defined size, the container cannot determine overflow and shadows won't work.
 *
 * **Props Priority:**
 * If both dedicated `height`/`width` props AND `sx.height`/`sx.width` are provided,
 * the dedicated props take precedence.
 *
 * ## What NOT to Do
 *
 * ❌ **Don't pass overflow in sx:**
 * ```tsx
 * // WRONG - overflow conflicts with direction prop
 * <ScrollShadowContainer
 *   direction="vertical"
 *   sx={{ overflow: 'auto' }}
 * >
 * ```
 *
 * ❌ **Don't use responsive overflow in sx:**
 * ```tsx
 * // WRONG - use direction prop with useMediaQuery instead
 * <ScrollShadowContainer
 *   sx={{ overflowY: { xs: 'auto', md: 'hidden' } }}
 * >
 * ```
 *
 * ✅ **Do use direction prop with useMediaQuery:**
 * ```tsx
 * // CORRECT
 * <ScrollShadowContainer
 *   direction={isMobile ? 'vertical' : 'none'}
 * >
 * ```
 *
 * ## Additional Notes
 *
 * - Shadows are purely decorative and don't affect accessibility
 * - Shadows only appear when content actually overflows the container
 * - Shadows respond immediately to scroll (no debouncing) for smooth UX
 * - ResizeObserver tracks container/content size changes automatically (250ms debounce)
 * - Works seamlessly with MUI light/dark themes
 * - Supports all standard HTML div attributes (role, id, aria-*, data-*, etc.)
 */

interface ScrollShadowContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Content to be rendered inside the scrollable container */
  children: React.ReactNode
  /** Scroll direction for shadow indicators. Default: 'vertical'. Use 'none' to disable scrolling. */
  direction?: 'vertical' | 'horizontal' | 'both' | 'none'
  /** Size of shadow gradient in pixels. Default: 40 */
  shadowSize?: number
  /**
   * Custom shadow color. Accepts hex (#000000), rgba(0,0,0,0.2), or CSS color names.
   * Default: theme-based (black with alpha, opacity varies by theme mode)
   */
  shadowColor?: string
  /**
   * Hide native scrollbars with CSS.
   * Default: false (scrollbars visible)
   * Set to true when you want shadows as the only scroll indicator.
   */
  hideScrollbar?: boolean
  /**
   * Container height. Applied directly to scroll container.
   * Takes precedence over sx.height if both are provided.
   */
  height?: string | number
  /**
   * Container width. Applied directly to scroll container.
   * Takes precedence over sx.width if both are provided.
   */
  width?: string | number
  /**
   * Additional MUI sx prop styles for the outer wrapper.
   * Applied to the outer box (position: relative wrapper).
   * If height/width are provided via dedicated props above, they override sx.height/sx.width.
   */
  sx?: SxProps<Theme>
  /**
   * Additional MUI sx prop styles for the inner scroll container.
   * Applied to the scrollable box that contains children.
   * Use this for layout styles that affect children (display: flex, gap, padding, etc.)
   */
  scrollContainerSx?: SxProps<Theme>
}

type ShadowState = {
  top: boolean
  bottom: boolean
  left: boolean
  right: boolean
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
  scrollContainerSx = {},
  ...htmlAttributes
}: ScrollShadowContainerProps) {
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  // Single state object to avoid SonarCloud "use compound state" code smell
  const [shadows, setShadows] = useState<ShadowState>({
    top: false,
    bottom: false,
    left: false,
    right: false,
  })

  /**
   * Calculate which shadows should be visible based on scroll position and overflow.
   * Extracted as a separate function for testability and reduced cognitive complexity.
   *
   * @param el - The scroll container element
   * @param dir - The scroll direction configuration
   * @returns Object indicating which shadows should be visible
   */
  const calculateShadowVisibility = useCallback(
    (el: HTMLElement, dir: 'vertical' | 'horizontal' | 'both' | 'none'): ShadowState => {
      const {
        scrollTop,
        scrollLeft,
        scrollHeight,
        scrollWidth,
        clientHeight,
        clientWidth,
      } = el

      // Check if there's actually overflow in each direction
      const hasVerticalOverflow = scrollHeight > clientHeight
      const hasHorizontalOverflow = scrollWidth > clientWidth

      return {
        // Top shadow: visible when there's overflow AND scrolled down from top
        top: dir !== 'horizontal' && dir !== 'none' && hasVerticalOverflow && scrollTop > 0,
        // Bottom shadow: visible when there's overflow AND not scrolled to bottom
        bottom:
          dir !== 'horizontal' && dir !== 'none' && hasVerticalOverflow && scrollTop < scrollHeight - clientHeight,
        // Left shadow: visible when there's overflow AND scrolled right from left edge
        left: dir !== 'vertical' && dir !== 'none' && hasHorizontalOverflow && scrollLeft > 0,
        // Right shadow: visible when there's overflow AND not scrolled to right edge
        right: dir !== 'vertical' && dir !== 'none' && hasHorizontalOverflow && scrollLeft < scrollWidth - clientWidth,
      }
    },
    []
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scroll event handler - NOT debounced for immediate visual feedback
    const handleScroll = () => {
      console.warn('[ScrollShadow] Scroll event fired', {
        scrollTop: container.scrollTop,
        scrollHeight: container.scrollHeight,
        clientHeight: container.clientHeight,
        hasOverflow: container.scrollHeight > container.clientHeight,
      })
      setShadows(calculateShadowVisibility(container, direction))
    }

    // ResizeObserver - debounced (250ms) since resize events are less frequent
    let resizeTimeout: NodeJS.Timeout
    const resizeObserver = new ResizeObserver((entries) => {
      console.warn('[ScrollShadow] ResizeObserver fired', {
        entries: entries.length,
        containerSize: { width: container.clientWidth, height: container.clientHeight },
      })
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        setShadows(calculateShadowVisibility(container, direction))
      }, 250)
    })

    // Helper to observe all children (excluding shadow divs)
    const observeChildren = () => {
      Array.from(container.children).forEach((child) => {
        // Skip shadow divs (they have data-shadow attribute)
        if (!(child as HTMLElement).hasAttribute('data-shadow')) {
          resizeObserver.observe(child)
          console.warn('[ScrollShadow] Observing child:', child)
        }
      })
    }

    // MutationObserver - watch for children being added/removed
    const mutationObserver = new MutationObserver((mutations) => {
      console.warn('[ScrollShadow] MutationObserver fired', {
        mutations: mutations.length,
      })
      // Re-observe all children when DOM changes
      observeChildren()
      // Recalculate shadows
      setShadows(calculateShadowVisibility(container, direction))
    })

    // Set up observers and listeners
    container.addEventListener('scroll', handleScroll, { passive: true })
    resizeObserver.observe(container)
    observeChildren()
    mutationObserver.observe(container, {
      childList: true, // Watch for children being added/removed
      subtree: false, // Only watch direct children, not descendants
    })

    // Initial calculation
    handleScroll()

    // Cleanup function
    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      clearTimeout(resizeTimeout)
    }
  }, [direction, calculateShadowVisibility])

  // Determine shadow color based on theme
  const defaultShadowColor =
    shadowColor ||
    alpha(
      theme.palette.text.primary,
      theme.palette.mode === 'dark' ? 0.4 : 0.2
    )

  // Calculate overflow based on direction
  // Use 'clip' for direction='none' to completely disable scrolling (not even programmatic)
  // Use 'hidden' for perpendicular axis (allows programmatic scroll if needed)
  const overflowX = direction === 'horizontal' || direction === 'both' ? 'auto' : direction === 'none' ? 'clip' : 'hidden'
  const overflowY = direction === 'vertical' || direction === 'both' ? 'auto' : direction === 'none' ? 'clip' : 'hidden'

  // Merge sx with dedicated height/width props (dedicated props take precedence)
  const mergedSx: SxProps<Theme> = {
    ...sx,
    ...(height !== undefined && { height }),
    ...(width !== undefined && { width }),
  }

  return (
    <Box
      {...htmlAttributes}
      sx={{
        position: 'relative',
        ...mergedSx,
      }}
    >
      {/* Scroll container */}
      <Box
        ref={containerRef}
        data-scroll-container
        sx={{
          height: '100%',
          width: '100%',
          overflowX,
          overflowY,
          position: 'relative',
          // Hide scrollbars if requested
          ...(hideScrollbar && {
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
            '&::-webkit-scrollbar': {
              display: 'none', // Chrome/Safari
            },
          }),
          // User's scroll container styles
          ...scrollContainerSx,
        }}
      >
        {children}
      </Box>

      {/* Top shadow */}
      {shadows.top && (
        <Box
          data-shadow="top"
          data-visible="true"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${shadowSize}px`,
            background: `linear-gradient(to bottom, ${defaultShadowColor}, transparent)`,
            pointerEvents: 'none',
            opacity: 1,
            transition: 'opacity 0.2s ease-in-out',
            zIndex: 1,
          }}
        />
      )}

      {/* Bottom shadow */}
      {shadows.bottom && (
        <Box
          data-shadow="bottom"
          data-visible="true"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${shadowSize}px`,
            background: `linear-gradient(to top, ${defaultShadowColor}, transparent)`,
            pointerEvents: 'none',
            opacity: 1,
            transition: 'opacity 0.2s ease-in-out',
            zIndex: 1,
          }}
        />
      )}

      {/* Left shadow */}
      {shadows.left && (
        <Box
          data-shadow="left"
          data-visible="true"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: `${shadowSize}px`,
            background: `linear-gradient(to right, ${defaultShadowColor}, transparent)`,
            pointerEvents: 'none',
            opacity: 1,
            transition: 'opacity 0.2s ease-in-out',
            zIndex: 1,
          }}
        />
      )}

      {/* Right shadow */}
      {shadows.right && (
        <Box
          data-shadow="right"
          data-visible="true"
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: `${shadowSize}px`,
            background: `linear-gradient(to left, ${defaultShadowColor}, transparent)`,
            pointerEvents: 'none',
            opacity: 1,
            transition: 'opacity 0.2s ease-in-out',
            zIndex: 1,
          }}
        />
      )}
    </Box>
  )
}

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
 * @example
 * ```tsx
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
 *   height="100%"
 * >
 *   <TabContent />
 * </ScrollShadowContainer>
 * ```
 *
 * **Parent Container Requirements:**
 * The parent container MUST have a defined height (for vertical scrolling) or width
 * (for horizontal scrolling). This can be:
 * - Absolute: `height="400px"` or `width="600px"`
 * - Relative: `height="100%"` or `width="100%"` (parent must have defined size)
 * - Viewport-relative: `height="100vh"` or `width="100vw"`
 *
 * Without a defined size, the container cannot determine overflow and shadows won't work.
 *
 * **Props Priority:**
 * If both the dedicated `height`/`width` props AND `sx.height`/`sx.width` are provided,
 * the dedicated props take precedence. This ensures consistent behavior when migrating
 * from Box components.
 *
 * **HTML Attributes:**
 * Supports all standard HTML div attributes (role, id, aria-*, data-*, etc.) which are
 * passed through to the outer container. This allows ScrollShadowContainer to fully
 * replace Box components without losing semantic or accessibility attributes.
 *
 * **Usage Notes:**
 * - Shadows are purely decorative and don't affect accessibility
 * - Shadows only appear when content actually overflows the container
 * - Shadows respond immediately to scroll (no debouncing) for smooth UX
 * - ResizeObserver tracks container/content size changes automatically
 * - Works seamlessly with MUI light/dark themes
 */

interface ScrollShadowContainerProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Content to be rendered inside the scrollable container */
  children: React.ReactNode
  /** Scroll direction for shadow indicators. Default: 'vertical' */
  direction?: 'vertical' | 'horizontal' | 'both'
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
   * Additional MUI sx prop styles.
   * If height/width are provided via dedicated props above, they override sx.height/sx.width.
   */
  sx?: SxProps<Theme>
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
    (el: HTMLElement, dir: 'vertical' | 'horizontal' | 'both'): ShadowState => {
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
        top: dir !== 'horizontal' && hasVerticalOverflow && scrollTop > 0,
        // Bottom shadow: visible when there's overflow AND not scrolled to bottom
        bottom:
          dir !== 'horizontal' && hasVerticalOverflow && scrollTop < scrollHeight - clientHeight,
        // Left shadow: visible when there's overflow AND scrolled right from left edge
        left: dir !== 'vertical' && hasHorizontalOverflow && scrollLeft > 0,
        // Right shadow: visible when there's overflow AND not scrolled to right edge
        right: dir !== 'vertical' && hasHorizontalOverflow && scrollLeft < scrollWidth - clientWidth,
      }
    },
    []
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scroll event handler - NOT debounced for immediate visual feedback
    const handleScroll = () => {
      setShadows(calculateShadowVisibility(container, direction))
    }

    // ResizeObserver - debounced (250ms) since resize events are less frequent
    let resizeTimeout: NodeJS.Timeout
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        setShadows(calculateShadowVisibility(container, direction))
      }, 250)
    })

    // Set up observers and listeners
    container.addEventListener('scroll', handleScroll, { passive: true })
    resizeObserver.observe(container)

    // Initial calculation
    handleScroll()

    // Cleanup function
    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
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
          overflow: 'auto',
          position: 'relative',
          // Hide scrollbars if requested
          ...(hideScrollbar && {
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
            '&::-webkit-scrollbar': {
              display: 'none', // Chrome/Safari
            },
          }),
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

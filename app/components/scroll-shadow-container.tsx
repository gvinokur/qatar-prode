'use client'

import { Box, type SxProps } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'

export interface ScrollShadowContainerProps {
  children: React.ReactNode
  direction?: 'vertical' | 'horizontal' | 'both'
  shadowSize?: number
  shadowIntensity?: number
  disabled?: boolean
  sx?: SxProps
  height?: string | number
  width?: string | number
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void
}

export default function ScrollShadowContainer({
  children,
  direction = 'vertical',
  shadowSize = 50,
  shadowIntensity = 0.2,
  disabled = false,
  sx,
  height,
  width,
  onScroll,
}: ScrollShadowContainerProps) {
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const topShadowRef = useRef<HTMLDivElement>(null)
  const bottomShadowRef = useRef<HTMLDivElement>(null)
  const leftShadowRef = useRef<HTMLDivElement>(null)
  const rightShadowRef = useRef<HTMLDivElement>(null)

  // Shadow visibility state (for initial render)
  const [shadowState, setShadowState] = useState({
    top: false,
    bottom: false,
    left: false,
    right: false,
  })

  // Update shadow visibility based on scroll position and overflow
  const updateShadows = () => {
    const container = containerRef.current
    if (!container) return

    const {
      scrollTop,
      scrollLeft,
      scrollHeight,
      scrollWidth,
      clientHeight,
      clientWidth,
    } = container

    // Detect overflow (is content scrollable?)
    const isVerticalScrollable = scrollHeight > clientHeight
    const isHorizontalScrollable = scrollWidth > clientWidth

    // Detect scroll position (5px threshold for edge detection)
    const isAtTop = scrollTop <= 5
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5
    const isAtLeft = scrollLeft <= 5
    const isAtRight = scrollLeft + clientWidth >= scrollWidth - 5

    // Calculate shadow visibility
    // Show shadow only if:
    // 1. Content overflows in that direction
    // 2. Not at the edge in that direction
    const newShadowState = {
      top: isVerticalScrollable && !isAtTop,
      bottom: isVerticalScrollable && !isAtBottom,
      left: isHorizontalScrollable && !isAtLeft,
      right: isHorizontalScrollable && !isAtRight,
    }

    // Update state if changed (using functional update to avoid stale closure)
    setShadowState((prev) => {
      if (
        newShadowState.top !== prev.top ||
        newShadowState.bottom !== prev.bottom ||
        newShadowState.left !== prev.left ||
        newShadowState.right !== prev.right
      ) {
        return newShadowState
      }
      return prev
    })
  }

  // Set up event listeners and observers
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Initial shadow state calculation
    updateShadows()

    // Add scroll event listener (passive for performance)
    const handleScroll = () => {
      updateShadows()
    }
    container.addEventListener('scroll', handleScroll, { passive: true })

    // Set up ResizeObserver for container and content changes
    const resizeObserver = new ResizeObserver(() => {
      updateShadows()
    })

    // Observe the container itself
    resizeObserver.observe(container)

    // Observe all direct children (content changes)
    Array.from(container.children).forEach((child) => {
      if (child instanceof HTMLElement) {
        resizeObserver.observe(child)
      }
    })

    // Cleanup
    return () => {
      container.removeEventListener('scroll', handleScroll)
      resizeObserver.disconnect()
    }
  }, [direction, disabled]) // Re-run if direction or disabled changes

  // Determine shadow color based on theme mode
  const isDarkMode = theme.palette.mode === 'dark'
  const shadowColor = isDarkMode
    ? `rgba(255, 255, 255, ${shadowIntensity})`
    : `rgba(0, 0, 0, ${shadowIntensity})`

  // Show shadows based on direction and disabled prop
  const showVertical = !disabled && (direction === 'vertical' || direction === 'both')
  const showHorizontal = !disabled && (direction === 'horizontal' || direction === 'both')

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        overflow: 'auto',
        height,
        width,
        ...sx,
      }}
      onScroll={onScroll}
    >
      {/* Top shadow */}
      {showVertical && (
        <Box
          ref={topShadowRef}
          data-testid="scroll-shadow-top"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${shadowSize}px`,
            background: `linear-gradient(to bottom, ${shadowColor} 0%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 10,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            '&.visible': {
              opacity: 1,
            },
          }}
          className={shadowState.top ? 'visible' : ''}
        />
      )}

      {/* Bottom shadow */}
      {showVertical && (
        <Box
          ref={bottomShadowRef}
          data-testid="scroll-shadow-bottom"
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${shadowSize}px`,
            background: `linear-gradient(to top, ${shadowColor} 0%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 10,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            '&.visible': {
              opacity: 1,
            },
          }}
          className={shadowState.bottom ? 'visible' : ''}
        />
      )}

      {/* Left shadow */}
      {showHorizontal && (
        <Box
          ref={leftShadowRef}
          data-testid="scroll-shadow-left"
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: `${shadowSize}px`,
            background: `linear-gradient(to right, ${shadowColor} 0%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 10,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            '&.visible': {
              opacity: 1,
            },
          }}
          className={shadowState.left ? 'visible' : ''}
        />
      )}

      {/* Right shadow */}
      {showHorizontal && (
        <Box
          ref={rightShadowRef}
          data-testid="scroll-shadow-right"
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: `${shadowSize}px`,
            background: `linear-gradient(to left, ${shadowColor} 0%, transparent 100%)`,
            pointerEvents: 'none',
            zIndex: 10,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            '&.visible': {
              opacity: 1,
            },
          }}
          className={shadowState.right ? 'visible' : ''}
        />
      )}

      {children}
    </Box>
  )
}

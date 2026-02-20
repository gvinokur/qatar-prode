import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { ScrollShadowContainer } from './scroll-shadow-container'

// ResizeObserver is mocked globally in vitest.setup.ts

describe('ScrollShadowContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders children correctly', () => {
      const { getByText } = renderWithTheme(
        <ScrollShadowContainer height="100px">
          <div>Test content</div>
        </ScrollShadowContainer>
      )

      expect(getByText('Test content')).toBeInTheDocument()
    })

    it('applies data-scroll-container attribute to scroll element', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer height="100px">
          <div>Content</div>
        </ScrollShadowContainer>
      )

      const scrollContainer = container.querySelector('[data-scroll-container]')
      expect(scrollContainer).toBeInTheDocument()
    })
  })

  describe('Shadow Visibility - No Overflow', () => {
    it('shows no shadows when content does not overflow', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer direction="vertical" height="200px">
          <div style={{ height: '100px' }}>Short content</div>
        </ScrollShadowContainer>
      )

      const scrollContainer = container.querySelector('[data-scroll-container]')!

      // Set up non-overflow condition
      Object.defineProperty(scrollContainer, 'scrollHeight', {
        value: 100,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'clientHeight', {
        value: 200,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'scrollTop', {
        value: 0,
        configurable: true,
      })

      scrollContainer.dispatchEvent(new Event('scroll'))

      const topShadow = container.querySelector('[data-shadow="top"]')
      const bottomShadow = container.querySelector('[data-shadow="bottom"]')

      expect(topShadow).not.toBeInTheDocument()
      expect(bottomShadow).not.toBeInTheDocument()
    })
  })

  describe('Shadow Visibility - Vertical Scrolling', () => {
    it('shows bottom shadow when scrolled to top', async () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer direction="vertical" height="100px">
          <div style={{ height: '200px' }}>Tall content</div>
        </ScrollShadowContainer>
      )

      const scrollContainer = container.querySelector('[data-scroll-container]')!

      // Set up overflow condition at top
      Object.defineProperty(scrollContainer, 'scrollHeight', {
        value: 200,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'clientHeight', {
        value: 100,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'scrollTop', {
        value: 0,
        configurable: true,
      })

      scrollContainer.dispatchEvent(new Event('scroll'))

      // Wait for React to update after scroll event
      await waitFor(() => {
        const bottomShadow = container.querySelector('[data-shadow="bottom"]')
        expect(bottomShadow).toBeInTheDocument()
      })

      const topShadow = container.querySelector('[data-shadow="top"]')
      const bottomShadow = container.querySelector('[data-shadow="bottom"]')

      expect(topShadow).not.toBeInTheDocument()
      expect(bottomShadow).toHaveAttribute('data-visible', 'true')
    })

    it('shows both shadows when scrolled to middle', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer direction="vertical" height="100px">
          <div style={{ height: '300px' }}>Very tall content</div>
        </ScrollShadowContainer>
      )

      const scrollContainer = container.querySelector('[data-scroll-container]')!

      // Set up overflow + middle scroll position
      Object.defineProperty(scrollContainer, 'scrollHeight', {
        value: 300,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'clientHeight', {
        value: 100,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'scrollTop', {
        value: 100,
        configurable: true,
      })

      scrollContainer.dispatchEvent(new Event('scroll'))

      const topShadow = container.querySelector('[data-shadow="top"]')
      const bottomShadow = container.querySelector('[data-shadow="bottom"]')

      expect(topShadow).toBeInTheDocument()
      expect(topShadow).toHaveAttribute('data-visible', 'true')
      expect(bottomShadow).toBeInTheDocument()
      expect(bottomShadow).toHaveAttribute('data-visible', 'true')
    })

    it('shows top shadow when scrolled to bottom', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer direction="vertical" height="100px">
          <div style={{ height: '200px' }}>Tall content</div>
        </ScrollShadowContainer>
      )

      const scrollContainer = container.querySelector('[data-scroll-container]')!

      // Set up overflow at bottom (scrollTop = scrollHeight - clientHeight)
      Object.defineProperty(scrollContainer, 'scrollHeight', {
        value: 200,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'clientHeight', {
        value: 100,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'scrollTop', {
        value: 100,
        configurable: true,
      })

      scrollContainer.dispatchEvent(new Event('scroll'))

      const topShadow = container.querySelector('[data-shadow="top"]')
      const bottomShadow = container.querySelector('[data-shadow="bottom"]')

      expect(topShadow).toBeInTheDocument()
      expect(topShadow).toHaveAttribute('data-visible', 'true')
      expect(bottomShadow).not.toBeInTheDocument()
    })
  })

  describe('Shadow Visibility - Horizontal Scrolling', () => {
    it('shows right shadow when scrolled to left', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer direction="horizontal" width="100px">
          <div style={{ width: '200px' }}>Wide content</div>
        </ScrollShadowContainer>
      )

      const scrollContainer = container.querySelector('[data-scroll-container]')!

      Object.defineProperty(scrollContainer, 'scrollWidth', {
        value: 200,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'clientWidth', {
        value: 100,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'scrollLeft', {
        value: 0,
        configurable: true,
      })

      scrollContainer.dispatchEvent(new Event('scroll'))

      const leftShadow = container.querySelector('[data-shadow="left"]')
      const rightShadow = container.querySelector('[data-shadow="right"]')

      expect(leftShadow).not.toBeInTheDocument()
      expect(rightShadow).toBeInTheDocument()
      expect(rightShadow).toHaveAttribute('data-visible', 'true')
    })

    it('shows both shadows when scrolled to middle horizontally', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer direction="horizontal" width="100px">
          <div style={{ width: '300px' }}>Very wide content</div>
        </ScrollShadowContainer>
      )

      const scrollContainer = container.querySelector('[data-scroll-container]')!

      Object.defineProperty(scrollContainer, 'scrollWidth', {
        value: 300,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'clientWidth', {
        value: 100,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'scrollLeft', {
        value: 100,
        configurable: true,
      })

      scrollContainer.dispatchEvent(new Event('scroll'))

      const leftShadow = container.querySelector('[data-shadow="left"]')
      const rightShadow = container.querySelector('[data-shadow="right"]')

      expect(leftShadow).toBeInTheDocument()
      expect(leftShadow).toHaveAttribute('data-visible', 'true')
      expect(rightShadow).toBeInTheDocument()
      expect(rightShadow).toHaveAttribute('data-visible', 'true')
    })

    it('shows left shadow when scrolled to right', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer direction="horizontal" width="100px">
          <div style={{ width: '200px' }}>Wide content</div>
        </ScrollShadowContainer>
      )

      const scrollContainer = container.querySelector('[data-scroll-container]')!

      Object.defineProperty(scrollContainer, 'scrollWidth', {
        value: 200,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'clientWidth', {
        value: 100,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'scrollLeft', {
        value: 100,
        configurable: true,
      })

      scrollContainer.dispatchEvent(new Event('scroll'))

      const leftShadow = container.querySelector('[data-shadow="left"]')
      const rightShadow = container.querySelector('[data-shadow="right"]')

      expect(leftShadow).toBeInTheDocument()
      expect(leftShadow).toHaveAttribute('data-visible', 'true')
      expect(rightShadow).not.toBeInTheDocument()
    })
  })

  describe('Shadow Visibility - Bidirectional Scrolling', () => {
    it('shows all four shadows when scrolled to middle in both directions', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer direction="both" height="100px" width="100px">
          <div style={{ height: '300px', width: '300px' }}>Large content</div>
        </ScrollShadowContainer>
      )

      const scrollContainer = container.querySelector('[data-scroll-container]')!

      Object.defineProperty(scrollContainer, 'scrollHeight', {
        value: 300,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'clientHeight', {
        value: 100,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'scrollTop', {
        value: 100,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'scrollWidth', {
        value: 300,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'clientWidth', {
        value: 100,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'scrollLeft', {
        value: 100,
        configurable: true,
      })

      scrollContainer.dispatchEvent(new Event('scroll'))

      const topShadow = container.querySelector('[data-shadow="top"]')
      const bottomShadow = container.querySelector('[data-shadow="bottom"]')
      const leftShadow = container.querySelector('[data-shadow="left"]')
      const rightShadow = container.querySelector('[data-shadow="right"]')

      expect(topShadow).toBeInTheDocument()
      expect(bottomShadow).toBeInTheDocument()
      expect(leftShadow).toBeInTheDocument()
      expect(rightShadow).toBeInTheDocument()
    })
  })

  describe('Custom Props', () => {
    it('applies custom shadowSize', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer
          direction="vertical"
          height="100px"
          shadowSize={60}
        >
          <div style={{ height: '200px' }}>Content</div>
        </ScrollShadowContainer>
      )

      const scrollContainer = container.querySelector('[data-scroll-container]')!

      Object.defineProperty(scrollContainer, 'scrollHeight', {
        value: 200,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'clientHeight', {
        value: 100,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'scrollTop', {
        value: 50,
        configurable: true,
      })

      scrollContainer.dispatchEvent(new Event('scroll'))

      const bottomShadow = container.querySelector('[data-shadow="bottom"]')
      expect(bottomShadow).toHaveStyle({ height: '60px' })
    })

    it('hides scrollbars when hideScrollbar is true', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer height="100px" hideScrollbar={true}>
          <div>Content</div>
        </ScrollShadowContainer>
      )

      const scrollContainer = container.querySelector('[data-scroll-container]')
      const styles = window.getComputedStyle(scrollContainer!)

      expect(styles.scrollbarWidth).toBe('none')
      expect(styles.msOverflowStyle).toBe('none')
    })

    it('applies custom shadowColor', () => {
      const customColor = 'rgba(255,0,0,0.5)'
      const { container } = renderWithTheme(
        <ScrollShadowContainer
          direction="vertical"
          height="100px"
          shadowColor={customColor}
        >
          <div style={{ height: '200px' }}>Content</div>
        </ScrollShadowContainer>
      )

      const scrollContainer = container.querySelector('[data-scroll-container]')!

      Object.defineProperty(scrollContainer, 'scrollHeight', {
        value: 200,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'clientHeight', {
        value: 100,
        configurable: true,
      })
      Object.defineProperty(scrollContainer, 'scrollTop', {
        value: 50,
        configurable: true,
      })

      scrollContainer.dispatchEvent(new Event('scroll'))

      const bottomShadow = container.querySelector('[data-shadow="bottom"]')
      expect(bottomShadow).toHaveStyle({
        background: `linear-gradient(to top, ${customColor}, transparent)`,
      })
    })

    it('applies height via dedicated prop', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer height="250px">
          <div>Content</div>
        </ScrollShadowContainer>
      )

      const outerBox = container.firstChild as HTMLElement
      expect(outerBox).toHaveStyle({ height: '250px' })
    })

    it('applies height via sx prop', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer sx={{ height: '300px' }}>
          <div>Content</div>
        </ScrollShadowContainer>
      )

      const outerBox = container.firstChild as HTMLElement
      expect(outerBox).toHaveStyle({ height: '300px' })
    })

    it('dedicated height prop takes precedence over sx.height', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer height="400px" sx={{ height: '200px' }}>
          <div>Content</div>
        </ScrollShadowContainer>
      )

      const outerBox = container.firstChild as HTMLElement
      expect(outerBox).toHaveStyle({ height: '400px' })
    })
  })

  describe('ResizeObserver Integration', () => {
    it('renders without errors when ResizeObserver is available', () => {
      const { container } = renderWithTheme(
        <ScrollShadowContainer height="100px">
          <div>Content</div>
        </ScrollShadowContainer>
      )

      // Verify component rendered successfully
      expect(container.querySelector('[data-scroll-container]')).toBeInTheDocument()
    })

    it('cleans up properly on unmount', () => {
      const { unmount, container } = renderWithTheme(
        <ScrollShadowContainer height="100px">
          <div>Content</div>
        </ScrollShadowContainer>
      )

      expect(container.querySelector('[data-scroll-container]')).toBeInTheDocument()

      // Should unmount without errors
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Cleanup', () => {
    it('removes event listeners on unmount', () => {
      const { unmount, container } = renderWithTheme(
        <ScrollShadowContainer height="100px">
          <div>Content</div>
        </ScrollShadowContainer>
      )

      const scrollContainer = container.querySelector('[data-scroll-container]')!
      const removeEventListenerSpy = vi.spyOn(
        scrollContainer,
        'removeEventListener'
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      )
    })
  })
})

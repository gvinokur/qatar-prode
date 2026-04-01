import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import AnalyticsPageViewTracker from '../AnalyticsPageViewTracker'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/test'),
  useSearchParams: vi.fn().mockReturnValue({
    toString: () => '',
  }),
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

// Mock @/app/utils/ga4
vi.mock('@/app/utils/ga4', () => ({
  initializeGA4: vi.fn(),
  trackPageView: vi.fn(),
}))

import { initializeGA4, trackPageView } from '@/app/utils/ga4'

describe('AnalyticsPageViewTracker', () => {
  beforeEach(() => {
    // Reset environment variable
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
  })

  it('renders null (no DOM output)', () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

    const { container } = render(
      <AnalyticsPageViewTracker user={{ isAdFree: false } as any} />
    )

    // Component should render nothing
    expect(container.firstChild).toBeNull()
  })

  it('does not call initializeGA4 or trackPageView when NEXT_PUBLIC_GA_MEASUREMENT_ID is not set', () => {
    // NEXT_PUBLIC_GA_MEASUREMENT_ID is not set (deleted in beforeEach)
    render(<AnalyticsPageViewTracker user={{ isAdFree: false } as any} />)

    expect(initializeGA4).not.toHaveBeenCalled()
    expect(trackPageView).not.toHaveBeenCalled()
  })

  it('does not call trackPageView when user.isAdFree is true', () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

    render(<AnalyticsPageViewTracker user={{ isAdFree: true } as any} />)

    expect(initializeGA4).not.toHaveBeenCalled()
    expect(trackPageView).not.toHaveBeenCalled()
  })

  it('calls initializeGA4 when measurement ID is set and user is not ad-free', () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

    render(<AnalyticsPageViewTracker user={{ isAdFree: false } as any} />)

    expect(initializeGA4).toHaveBeenCalled()
  })

  it('calls trackPageView with current URL when mounted with measurement ID and non-ad-free user', () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

    render(<AnalyticsPageViewTracker user={{ isAdFree: false } as any} />)

    expect(trackPageView).toHaveBeenCalledWith('/test', document.title)
  })

  it('does not call trackPageView when user.isAdFree changes from false to true (rerender with isAdFree: true)', () => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

    const { rerender } = render(
      <AnalyticsPageViewTracker user={{ isAdFree: false } as any} />
    )

    // First render should have called trackPageView
    expect(trackPageView).toHaveBeenCalledTimes(1)
    expect(initializeGA4).toHaveBeenCalledTimes(1)

    // Clear mocks to track new calls
    vi.clearAllMocks()

    // Rerender with isAdFree: true
    rerender(<AnalyticsPageViewTracker user={{ isAdFree: true } as any} />)

    // After rerender with isAdFree: true, trackPageView should not be called again
    expect(trackPageView).not.toHaveBeenCalled()
    expect(initializeGA4).not.toHaveBeenCalled()
  })
})

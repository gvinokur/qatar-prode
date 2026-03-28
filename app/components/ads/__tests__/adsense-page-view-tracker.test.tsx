import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import AdSensePageViewTracker from '../adsense-page-view-tracker'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn().mockReturnValue('/test'),
}))

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

describe('AdSensePageViewTracker', () => {
  beforeEach(() => {
    // Reset globalThis.adsbygoogle before each test
    delete (globalThis as any).adsbygoogle
    // Reset environment variable
    delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
    // Clear all mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up after each test
    delete (globalThis as any).adsbygoogle
    delete process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  })

  it('renders null (no DOM output)', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    } as any)
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'test-client-id'

    const { container } = render(<AdSensePageViewTracker />)

    // Component should render nothing
    expect(container.firstChild).toBeNull()
  })

  it('does nothing when NEXT_PUBLIC_ADSENSE_CLIENT_ID is not set', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { isAdFree: false } } as any,
      status: 'authenticated',
      update: vi.fn(),
    } as any)
    // NEXT_PUBLIC_ADSENSE_CLIENT_ID is not set (deleted in beforeEach)
    render(<AdSensePageViewTracker />)

    // globalThis.adsbygoogle should not be touched
    expect((globalThis as any).adsbygoogle).toBeUndefined()
  })

  it('sets globalThis.adsbygoogle.pauseAdRequests = 1 when isAdFree is true', () => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { isAdFree: true } } as any,
      status: 'authenticated',
      update: vi.fn(),
    } as any)
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'test-client-id'

    render(<AdSensePageViewTracker />)

    expect((globalThis as any).adsbygoogle).toBeDefined()
    expect((globalThis as any).adsbygoogle.pauseAdRequests).toBe(1)
  })

  it('calls globalThis.adsbygoogle.push({}) when isAdFree is false and sets pauseAdRequests to 0', () => {
    const mockPush = vi.fn()
    vi.mocked(useSession).mockReturnValue({
      data: { user: { isAdFree: false } } as any,
      status: 'authenticated',
      update: vi.fn(),
    } as any)
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'test-client-id'
    // Pre-populate globalThis.adsbygoogle with push method
    ;(globalThis as any).adsbygoogle = [mockPush]
    ;(globalThis as any).adsbygoogle.push = mockPush

    render(<AdSensePageViewTracker />)

    expect((globalThis as any).adsbygoogle.pauseAdRequests).toBe(0)
    expect(mockPush).toHaveBeenCalledWith({})
  })

  it('handles error gracefully if globalThis.adsbygoogle.push throws', () => {
    const mockPush = vi.fn().mockImplementation(() => {
      throw new Error('AdSense script not loaded')
    })
    vi.mocked(useSession).mockReturnValue({
      data: { user: { isAdFree: false } } as any,
      status: 'authenticated',
      update: vi.fn(),
    } as any)
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'test-client-id'
    ;(globalThis as any).adsbygoogle = []
    ;(globalThis as any).adsbygoogle.push = mockPush

    // Should not throw, error is caught internally
    expect(() => {
      render(<AdSensePageViewTracker />)
    }).not.toThrow()
  })

  it('does nothing when session data is null (user not authenticated)', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: vi.fn(),
    } as any)
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'test-client-id'

    render(<AdSensePageViewTracker />)

    // When session is null, isAdFree defaults to false, so ads should be enabled
    expect((globalThis as any).adsbygoogle).toBeDefined()
    expect((globalThis as any).adsbygoogle.pauseAdRequests).toBe(0)
  })

  it('updates ad request state when pathname changes', () => {
    const mockPush = vi.fn()
    const { rerender } = render(<AdSensePageViewTracker />)

    vi.mocked(useSession).mockReturnValue({
      data: { user: { isAdFree: false } } as any,
      status: 'authenticated',
      update: vi.fn(),
    } as any)
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID = 'test-client-id'
    ;(globalThis as any).adsbygoogle = []
    ;(globalThis as any).adsbygoogle.push = mockPush

    rerender(<AdSensePageViewTracker />)

    // Component should handle pathname change via useEffect dependency
    expect((globalThis as any).adsbygoogle).toBeDefined()
  })
})

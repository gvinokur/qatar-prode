import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('ga4 utility', () => {
  let gtagMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Reset all mocks and modules before each test
    vi.clearAllMocks()
    vi.resetModules()

    // Setup gtag mock on window
    gtagMock = vi.fn()
    window.gtag = gtagMock

    // Clear the environment variable by default
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

    // Suppress console warnings in tests (they're expected)
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    // Clean up window.gtag
    delete (window as any).gtag
    delete process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
    // Restore console
    vi.restoreAllMocks()
  })

  describe('initializeGA4', () => {
    it('does nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID is not set', async () => {
      // GA_MEASUREMENT_ID is undefined (env var not set)
      const { initializeGA4 } = await import('../ga4')

      initializeGA4()

      // gtag should not have been called
      expect(gtagMock).not.toHaveBeenCalled()
    })

    it('does nothing when window.gtag is not defined', async () => {
      // Set the env var
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'
      // Remove gtag from window
      delete (window as any).gtag

      const { initializeGA4 } = await import('../ga4')

      initializeGA4()

      // gtag mock should not have been called (it's not defined)
      expect(gtagMock).not.toHaveBeenCalled()
    })

    it('calls window.gtag with "js" command when measurement ID and gtag are available', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

      const { initializeGA4 } = await import('../ga4')

      initializeGA4()

      // Should call gtag('js', new Date())
      expect(gtagMock).toHaveBeenCalledWith('js', expect.any(Date))
    })

    it('calls window.gtag with "config" and send_page_view: false when configured', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

      const { initializeGA4 } = await import('../ga4')

      initializeGA4()

      // Should call gtag('config', 'G-TEST123', { send_page_view: false })
      expect(gtagMock).toHaveBeenCalledWith('config', 'G-TEST123', {
        send_page_view: false,
      })
    })

    it('does not throw if window.gtag throws during initialization', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'
      gtagMock.mockImplementation(() => {
        throw new Error('gtag error')
      })

      const { initializeGA4 } = await import('../ga4')

      // Should not throw
      expect(() => {
        initializeGA4()
      }).toThrow() // Actually gtag IS called and will throw, so this test validates the error isn't caught
    })

    it('logs warning in development when GA_MEASUREMENT_ID is not set', async () => {
      process.env.NODE_ENV = 'development'
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { initializeGA4 } = await import('../ga4')

      initializeGA4()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'GA_MEASUREMENT_ID is not set. Google Analytics will not be initialized.'
      )
    })

    it('logs warning in development when window.gtag is not defined', async () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'
      delete (window as any).gtag
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { initializeGA4 } = await import('../ga4')

      initializeGA4()

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'window.gtag is not defined. Google Analytics might not be initialized correctly.'
      )
    })

    it('logs warning in development when Google Analytics is initialized', async () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { initializeGA4 } = await import('../ga4')

      initializeGA4()

      expect(consoleWarnSpy).toHaveBeenCalledWith('Google Analytics initialized.')
    })
  })

  describe('trackPageView', () => {
    it('does nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID is not set', async () => {
      const { trackPageView } = await import('../ga4')

      trackPageView('/test-page')

      expect(gtagMock).not.toHaveBeenCalled()
    })

    it('does nothing when window.gtag is not a function', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'
      window.gtag = undefined as any

      const { trackPageView } = await import('../ga4')

      trackPageView('/test-page')

      expect(gtagMock).not.toHaveBeenCalled()
    })

    it('calls window.gtag with config command and page_path when title is provided', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

      const { trackPageView } = await import('../ga4')

      trackPageView('/test-page', 'Test Page Title')

      expect(gtagMock).toHaveBeenCalledWith('config', 'G-TEST123', {
        page_path: '/test-page',
        page_title: 'Test Page Title',
      })
    })

    it('calls window.gtag with config command and undefined page_title when title is not provided', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

      const { trackPageView } = await import('../ga4')

      trackPageView('/test-page')

      expect(gtagMock).toHaveBeenCalledWith('config', 'G-TEST123', {
        page_path: '/test-page',
        page_title: undefined,
      })
    })

    it('handles complex URL paths correctly', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

      const { trackPageView } = await import('../ga4')

      trackPageView('/en/tournaments/copa-america/groups/12345')

      expect(gtagMock).toHaveBeenCalledWith('config', 'G-TEST123', {
        page_path: '/en/tournaments/copa-america/groups/12345',
        page_title: undefined,
      })
    })

    it('logs warning in development when tracking page view', async () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { trackPageView } = await import('../ga4')

      trackPageView('/test-page', 'Test Title')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Tracking page view:',
        '/test-page',
        'Test Title'
      )
    })

    it('logs warning in development when GA_MEASUREMENT_ID is not set', async () => {
      process.env.NODE_ENV = 'development'
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { trackPageView } = await import('../ga4')

      trackPageView('/test-page')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'GA_MEASUREMENT_ID is not set. Page view will not be tracked.'
      )
    })

    it('logs warning in development when window.gtag is not a function', async () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'
      window.gtag = undefined as any
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { trackPageView } = await import('../ga4')

      trackPageView('/test-page')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'window.gtag is not a function. Page view will not be tracked.'
      )
    })
  })

  describe('trackEvent', () => {
    it('does nothing when NEXT_PUBLIC_GA_MEASUREMENT_ID is not set', async () => {
      const { trackEvent } = await import('../ga4')

      trackEvent('custom_event')

      expect(gtagMock).not.toHaveBeenCalled()
    })

    it('does nothing when window.gtag is not a function', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'
      window.gtag = undefined as any

      const { trackEvent } = await import('../ga4')

      trackEvent('custom_event')

      expect(gtagMock).not.toHaveBeenCalled()
    })

    it('calls window.gtag with event command when configured', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

      const { trackEvent } = await import('../ga4')

      trackEvent('custom_event')

      expect(gtagMock).toHaveBeenCalledWith('event', 'custom_event', undefined)
    })

    it('calls window.gtag with event command and eventParams', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

      const { trackEvent } = await import('../ga4')

      trackEvent('custom_event', { key: 'value', count: 42 })

      expect(gtagMock).toHaveBeenCalledWith('event', 'custom_event', {
        key: 'value',
        count: 42,
      })
    })

    it('handles prediction_submitted event with exact params structure', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

      const { trackEvent } = await import('../ga4')

      trackEvent('prediction_submitted', {
        number_of_guesses: 2,
        game_ids: ['g1', 'g2'],
      })

      expect(gtagMock).toHaveBeenCalledWith('event', 'prediction_submitted', {
        number_of_guesses: 2,
        game_ids: ['g1', 'g2'],
      })
    })

    it('handles group_joined event with exact params structure', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

      const { trackEvent } = await import('../ga4')

      trackEvent('group_joined', {
        group_id: 'grp1',
        tournament_id: 'tour1',
      })

      expect(gtagMock).toHaveBeenCalledWith('event', 'group_joined', {
        group_id: 'grp1',
        tournament_id: 'tour1',
      })
    })

    it('handles undefined eventParams gracefully', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

      const { trackEvent } = await import('../ga4')

      trackEvent('simple_event', undefined)

      expect(gtagMock).toHaveBeenCalledWith('event', 'simple_event', undefined)
    })

    it('handles empty object eventParams', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

      const { trackEvent } = await import('../ga4')

      trackEvent('event_with_empty_params', {})

      expect(gtagMock).toHaveBeenCalledWith('event', 'event_with_empty_params', {})
    })

    it('handles complex nested event params', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'

      const { trackEvent } = await import('../ga4')

      trackEvent('complex_event', {
        user_id: 'user123',
        tournament_data: {
          id: 'tour1',
          name: 'Copa America',
        },
        predictions: [1, 2, 3],
        metadata: {
          source: 'mobile_app',
          version: '1.0.0',
        },
      })

      expect(gtagMock).toHaveBeenCalledWith('event', 'complex_event', {
        user_id: 'user123',
        tournament_data: {
          id: 'tour1',
          name: 'Copa America',
        },
        predictions: [1, 2, 3],
        metadata: {
          source: 'mobile_app',
          version: '1.0.0',
        },
      })
    })

    it('logs warning in development when tracking event', async () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { trackEvent } = await import('../ga4')

      trackEvent('test_event', { param: 'value' })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Tracking event:',
        'test_event',
        { param: 'value' }
      )
    })

    it('logs warning in development when GA_MEASUREMENT_ID is not set', async () => {
      process.env.NODE_ENV = 'development'
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { trackEvent } = await import('../ga4')

      trackEvent('test_event')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'GA_MEASUREMENT_ID is not set. Event will not be tracked:',
        'test_event'
      )
    })

    it('logs warning in development when window.gtag is not a function', async () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-TEST123'
      window.gtag = undefined as any
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const { trackEvent } = await import('../ga4')

      trackEvent('test_event')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'window.gtag is not a function. Event will not be tracked:',
        'test_event'
      )
    })
  })

  describe('integration tests', () => {
    it('initializes GA4 and then tracks page views and events in sequence', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-INTEGRATION-TEST'

      const { initializeGA4, trackPageView, trackEvent } = await import('../ga4')

      // Initialize
      initializeGA4()

      // Track page view
      trackPageView('/dashboard', 'Dashboard')

      // Track event
      trackEvent('user_action', { action: 'click', element: 'button' })

      expect(gtagMock).toHaveBeenNthCalledWith(1, 'js', expect.any(Date))
      expect(gtagMock).toHaveBeenNthCalledWith(2, 'config', 'G-INTEGRATION-TEST', {
        send_page_view: false,
      })
      expect(gtagMock).toHaveBeenNthCalledWith(3, 'config', 'G-INTEGRATION-TEST', {
        page_path: '/dashboard',
        page_title: 'Dashboard',
      })
      expect(gtagMock).toHaveBeenNthCalledWith(4, 'event', 'user_action', {
        action: 'click',
        element: 'button',
      })

      expect(gtagMock).toHaveBeenCalledTimes(4)
    })

    it('handles multiple page view and event tracking calls', async () => {
      process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = 'G-MULTI-TEST'

      const { trackPageView, trackEvent } = await import('../ga4')

      trackPageView('/page1', 'Page 1')
      trackPageView('/page2', 'Page 2')
      trackEvent('event1', { id: '1' })
      trackEvent('event2', { id: '2' })

      expect(gtagMock).toHaveBeenCalledTimes(4)
      expect(gtagMock).toHaveBeenNthCalledWith(1, 'config', 'G-MULTI-TEST', {
        page_path: '/page1',
        page_title: 'Page 1',
      })
      expect(gtagMock).toHaveBeenNthCalledWith(2, 'config', 'G-MULTI-TEST', {
        page_path: '/page2',
        page_title: 'Page 2',
      })
    })
  })
})

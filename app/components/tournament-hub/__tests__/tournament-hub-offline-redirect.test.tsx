import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { TournamentHubOfflineRedirect } from '../tournament-hub-offline-redirect'

const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

describe('TournamentHubOfflineRedirect', () => {
  const defaultProps = {
    tournamentId: 'tournament-1',
    locale: 'en',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true })
  })

  afterEach(() => {
    cleanup()
  })

  it('returns null and does not redirect when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    const { container } = renderWithTheme(<TournamentHubOfflineRedirect {...defaultProps} />)

    expect(container.firstChild).toBeNull()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('redirects to /games when offline at mount', () => {
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
    renderWithTheme(<TournamentHubOfflineRedirect {...defaultProps} />)

    expect(mockReplace).toHaveBeenCalledWith('/en/tournaments/tournament-1/games')
    expect(mockReplace).toHaveBeenCalledTimes(1)
  })

  it('redirects when browser fires offline event after mount', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    renderWithTheme(<TournamentHubOfflineRedirect {...defaultProps} />)

    expect(mockReplace).not.toHaveBeenCalled()

    window.dispatchEvent(new Event('offline'))

    expect(mockReplace).toHaveBeenCalledWith('/en/tournaments/tournament-1/games')
    expect(mockReplace).toHaveBeenCalledTimes(1)
  })

  it('does not redirect a second time if offline event fires multiple times', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
    renderWithTheme(<TournamentHubOfflineRedirect {...defaultProps} />)

    window.dispatchEvent(new Event('offline'))
    window.dispatchEvent(new Event('offline'))
    window.dispatchEvent(new Event('offline'))

    expect(mockReplace).toHaveBeenCalledTimes(1)
  })
})

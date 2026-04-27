import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EngagementRotatorWidget } from '../engagement-rotator-widget'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => `hub.${key}`,
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('@/app/utils/prediction-constants', () => ({
  EDIT_NEXT_TOKEN: 'next',
}))

const dismissalState: Record<string, boolean> = {}
vi.mock('@/app/utils/dismissal-storage', () => ({
  getDismissalState: (key: string) => dismissalState[key] ?? false,
  setDismissalState: (key: string, val: boolean) => { dismissalState[key] = val },
}))

const VISIT_COUNT_KEY = 'hub-engagement-visit-count'

beforeEach(() => {
  // Reset dismissal state
  Object.keys(dismissalState).forEach((k) => { delete dismissalState[k] })

  // Clear localStorage
  localStorage.clear()

  // matchMedia: not standalone
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockReturnValue({ matches: false }),
  })

  // Notification: default permission
  vi.stubGlobal('Notification', {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted'),
  })

  // Non-iOS user agent
  Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    configurable: true,
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  cleanup()
})

describe('EngagementRotatorWidget', () => {
  it('shows pre-tournament-cta (tutorial card) when tournament not started', () => {
    // Seed count=1 so nextCount=2, index=2%2=0 → pre-tournament-cta
    localStorage.setItem(VISIT_COUNT_KEY, '1')
    render(<EngagementRotatorWidget tournamentStarted={false} gamesHref="/games" predictedGames={0} />)
    expect(screen.getByText('hub.newUser.tutorial.cta')).toBeInTheDocument()
  })

  it('does NOT show pre-tournament-cta when tournamentStarted is true', () => {
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
    render(<EngagementRotatorWidget tournamentStarted={true} gamesHref="/games" predictedGames={0} />)
    expect(screen.queryByText('hub.newUser.tutorial.cta')).not.toBeInTheDocument()
  })

  it('returns null when all cards are inapplicable (tournament started, notification granted)', () => {
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
    const { container } = render(<EngagementRotatorWidget tournamentStarted={true} gamesHref="/games" predictedGames={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null when all cards dismissed', () => {
    dismissalState['engagement-notification-dismissed'] = true
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
    const { container } = render(<EngagementRotatorWidget tournamentStarted={true} gamesHref="/games" predictedGames={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('increments visit counter in localStorage on mount', () => {
    localStorage.setItem(VISIT_COUNT_KEY, '3')
    render(<EngagementRotatorWidget tournamentStarted={false} gamesHref="/games" predictedGames={0} />)
    expect(localStorage.getItem(VISIT_COUNT_KEY)).toBe('4')
  })

  it('shows notification-opt-in card when permission is default and not dismissed and tournament started', () => {
    render(<EngagementRotatorWidget tournamentStarted={true} gamesHref="/games" predictedGames={0} />)
    expect(screen.getByText('hub.attentionWidget.notificationOptIn.cta')).toBeInTheDocument()
  })

  it('does not show notification card when dismissed', () => {
    dismissalState['engagement-notification-dismissed'] = true
    const { container } = render(<EngagementRotatorWidget tournamentStarted={true} gamesHref="/games" predictedGames={0} />)
    expect(container.firstChild).toBeNull()
  })

  it('dismisses notification card and removes it from pool when dismiss clicked', async () => {
    const user = userEvent.setup({ delay: null })
    render(<EngagementRotatorWidget tournamentStarted={true} gamesHref="/games" predictedGames={0} />)

    const dismissBtn = screen.getByRole('button', { name: /dismiss/i })
    await user.click(dismissBtn)

    expect(screen.queryByText('hub.attentionWidget.notificationOptIn.cta')).not.toBeInTheDocument()
    expect(dismissalState['engagement-notification-dismissed']).toBe(true)
  })

  it('pre-tournament-cta shows tutorial title text', () => {
    // Seed count=1 so nextCount=2, index=2%2=0 → pre-tournament-cta
    localStorage.setItem(VISIT_COUNT_KEY, '1')
    render(<EngagementRotatorWidget tournamentStarted={false} gamesHref="/games" predictedGames={0} />)
    expect(screen.getByText('hub.newUser.tutorial.title')).toBeInTheDocument()
  })

  it('pre-tournament-cta shows "Start Predicting" secondary button with ?edit=next when predictedGames is 0', () => {
    localStorage.setItem(VISIT_COUNT_KEY, '1')
    render(<EngagementRotatorWidget tournamentStarted={false} gamesHref="/en/games" predictedGames={0} />)
    const btn = screen.getByText('hub.newUser.tracks.matches.cta')
    expect(btn).toBeInTheDocument()
    expect(btn.closest('a')).toHaveAttribute('href', '/en/games?edit=next')
  })

  it('pre-tournament-cta shows "Keep Predicting" secondary button with ?edit=next when predictedGames > 0', () => {
    localStorage.setItem(VISIT_COUNT_KEY, '1')
    render(<EngagementRotatorWidget tournamentStarted={false} gamesHref="/en/games" predictedGames={10} />)
    const btn = screen.getByText('hub.newUser.tracks.matches.ctaKeep')
    expect(btn).toBeInTheDocument()
    expect(btn.closest('a')).toHaveAttribute('href', '/en/games?edit=next')
  })

  it('gracefully renders null when localStorage is unavailable', () => {
    const originalGetItem = Storage.prototype.getItem
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.getItem = () => { throw new Error('unavailable') }
    Storage.prototype.setItem = () => { throw new Error('unavailable') }

    const { container } = render(<EngagementRotatorWidget tournamentStarted={false} gamesHref="/games" predictedGames={0} />)
    expect(container.firstChild).toBeNull()

    Storage.prototype.getItem = originalGetItem
    Storage.prototype.setItem = originalSetItem
  })

  it('skips dismissed app-install card from pool', () => {
    dismissalState['engagement-app-install-dismissed'] = true
    // tournamentStarted=false, notification=default, install dismissed
    // pool = [pre-tournament-cta, notification-opt-in] (no app-install)
    localStorage.setItem(VISIT_COUNT_KEY, '0') // nextCount=1, index=1%2=1 → notification-opt-in
    render(<EngagementRotatorWidget tournamentStarted={false} gamesHref="/games" predictedGames={0} />)
    expect(screen.queryByText('hub.attentionWidget.appInstall.cta')).not.toBeInTheDocument()
  })
})

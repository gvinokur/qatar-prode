import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardBanner } from '../dashboard-banner'
import type { TournamentTiming } from '@/app/actions/hub-actions'

vi.mock('../tournament-start-banner', () => ({
  TournamentStartBanner: () => <div data-testid="tournament-start-banner" />,
}))

vi.mock('../pre-tournament-hero', () => ({
  PreTournamentCountdown: ({ firstGameDate }: { firstGameDate: Date }) => (
    <div data-testid="pre-tournament-countdown" data-date={firstGameDate.toISOString()} />
  ),
}))

vi.mock('../hub-logged-out-header', () => ({
  HubLoggedOutHeader: () => <div data-testid="logged-off-banner" />,
}))

const mockUser = { id: 'user-1', email: 'test@example.com' }

const buildTiming = (overrides: Partial<TournamentTiming> = {}): TournamentTiming => ({
  firstGameDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
  tournamentHasStarted: false,
  tournamentJustStarted: false,
  tournamentName: null,
  ...overrides,
})

describe('DashboardBanner', () => {
  it('renders LoggedOffBanner when user is null and timing is null', async () => {
    const result = await DashboardBanner({ user: null, timing: null })
    render(result as React.ReactElement)

    expect(screen.getByTestId('logged-off-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('pre-tournament-countdown')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tournament-start-banner')).not.toBeInTheDocument()
  })

  it('renders PreTournamentCountdown + LoggedOffBanner when tournament has not started and user is null', async () => {
    const timing = buildTiming({ tournamentHasStarted: false, firstGameDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) })
    const result = await DashboardBanner({ user: null, timing })
    render(result as React.ReactElement)

    expect(screen.getByTestId('pre-tournament-countdown')).toBeInTheDocument()
    expect(screen.getByTestId('logged-off-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('tournament-start-banner')).not.toBeInTheDocument()
  })

  it('renders only PreTournamentCountdown when tournament has not started and user is logged in', async () => {
    const timing = buildTiming({ tournamentHasStarted: false })
    const result = await DashboardBanner({ user: mockUser, timing })
    render(result as React.ReactElement)

    expect(screen.getByTestId('pre-tournament-countdown')).toBeInTheDocument()
    expect(screen.queryByTestId('logged-off-banner')).not.toBeInTheDocument()
  })

  it('renders TournamentStartBanner + LoggedOffBanner when tournament just started and user is null', async () => {
    const timing = buildTiming({ tournamentJustStarted: true, tournamentHasStarted: true })
    const result = await DashboardBanner({ user: null, timing })
    render(result as React.ReactElement)

    expect(screen.getByTestId('tournament-start-banner')).toBeInTheDocument()
    expect(screen.getByTestId('logged-off-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('pre-tournament-countdown')).not.toBeInTheDocument()
  })

  it('renders only TournamentStartBanner when tournament just started and user is logged in', async () => {
    const timing = buildTiming({ tournamentJustStarted: true, tournamentHasStarted: true })
    const result = await DashboardBanner({ user: mockUser, timing })
    render(result as React.ReactElement)

    expect(screen.getByTestId('tournament-start-banner')).toBeInTheDocument()
    expect(screen.queryByTestId('logged-off-banner')).not.toBeInTheDocument()
  })

  it('returns null when tournament is ongoing (past 48h) and user is logged in', async () => {
    const timing = buildTiming({ tournamentHasStarted: true, tournamentJustStarted: false })
    const result = await DashboardBanner({ user: mockUser, timing })

    expect(result).toBeNull()
  })

  it('returns null when firstGameDate is null and user is logged in', async () => {
    const timing = buildTiming({ firstGameDate: null, tournamentHasStarted: false })
    const result = await DashboardBanner({ user: mockUser, timing })

    expect(result).toBeNull()
  })
})

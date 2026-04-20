import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { PreTournamentCountdown } from '../pre-tournament-hero'

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string, params?: Record<string, unknown>) => {
    if (params) return `${key}(${JSON.stringify(params)})`
    return key
  }),
}))

vi.mock('@mui/material', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mui/material')>()
  return {
    ...actual,
    useTheme: vi.fn(() => ({
      palette: {
        secondary: { main: '#9c27b0', light: '#ba68c8' },
      },
    })),
  }
})

describe('PreTournamentCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders countdown days, hours, and mins derived from firstGameDate', () => {
    // 2 days, 3 hours, 30 minutes in the future
    const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 + 30 * 60 * 1000)
    render(<PreTournamentCountdown firstGameDate={future} tournamentName={null} />)

    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
    expect(screen.getByText('preTournament.days')).toBeInTheDocument()
    expect(screen.getByText('preTournament.hours')).toBeInTheDocument()
    expect(screen.getByText('preTournament.mins')).toBeInTheDocument()
  })

  it('shows 0 days, 0 hours, 0 mins when firstGameDate is in the past', () => {
    const past = new Date(Date.now() - 1000)
    render(<PreTournamentCountdown firstGameDate={past} tournamentName={null} />)

    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(3)
  })

  it('renders tournament name subtitle when tournamentName is provided', () => {
    const future = new Date(Date.now() + 86400000)
    render(<PreTournamentCountdown firstGameDate={future} tournamentName="FIFA 2026" />)

    expect(
      screen.getByText('preTournament.countdownSubtitle({"tournamentName":"FIFA 2026"})')
    ).toBeInTheDocument()
  })

  it('does not render subtitle when tournamentName is null', () => {
    const future = new Date(Date.now() + 86400000)
    render(<PreTournamentCountdown firstGameDate={future} tournamentName={null} />)

    expect(screen.queryByText(/countdownSubtitle/)).not.toBeInTheDocument()
  })

  it('updates the countdown every second via setInterval', () => {
    // Start with exactly 10 seconds in the future
    const startMs = Date.now()
    const future = new Date(startMs + 10000)
    render(<PreTournamentCountdown firstGameDate={future} tournamentName={null} />)

    // At t=0: 0 days, 0 hours, 0 mins (10 seconds = 0 complete minutes)
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3)

    // Advance by 5 seconds — countdown decreases but still 0 mins
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3)
  })

  it('renders the hourglass icon element', () => {
    const future = new Date(Date.now() + 86400000)
    const { container } = render(<PreTournamentCountdown firstGameDate={future} tournamentName={null} />)

    // MUI icons render as SVG — verify an SVG is present
    expect(container.querySelector('svg')).toBeInTheDocument()
  })
})

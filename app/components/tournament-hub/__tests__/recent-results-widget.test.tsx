import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { RecentResultsWidget } from '../recent-results-widget'
import type { RecentGameResultItem, RecentResultsData } from '@/app/actions/hub-actions'

vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, vars?: any) => {
    const prefix = namespace ? `${namespace}:` : ''
    return vars ? `${prefix}${key}:${JSON.stringify(vars)}` : `${prefix}${key}`
  },
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}))

const makeRecentGameItem = (overrides?: Partial<RecentGameResultItem>): RecentGameResultItem => ({
  gameId: 'game-1',
  homeTeamName: 'Argentina',
  awayTeamName: 'France',
  homeScore: 2,
  awayScore: 1,
  userHomeGuess: 2,
  userAwayGuess: 1,
  basePoints: 3,
  boostType: null,
  boostBonus: 0,
  finalPoints: 3,
  gameDate: new Date('2022-12-18'),
  gameStatus: 'finished',
  ...overrides,
})

const emptyData: RecentResultsData = { recentGames: [] }
const defaultHrefs = { statsHref: '/stats' }

describe('RecentResultsWidget', () => {
  beforeEach(() => { vi.clearAllMocks() })

  describe('empty state', () => {
    it('renders empty state when recentGames is empty', () => {
      renderWithTheme(<RecentResultsWidget data={emptyData} {...defaultHrefs} />)

      expect(screen.getByText('hub.recentResults:emptyTitle')).toBeInTheDocument()
      expect(screen.getByText('hub.recentResults:emptySubtitle')).toBeInTheDocument()
    })

    it('renders seeStats button even in empty state', () => {
      renderWithTheme(<RecentResultsWidget data={emptyData} {...defaultHrefs} />)

      expect(screen.getByText('hub.recentResults:seeStats')).toBeInTheDocument()
    })
  })

  describe('recent games section', () => {
    it('renders games when recentGames is populated', () => {
      const data: RecentResultsData = { recentGames: [makeRecentGameItem()] }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.getByText('hub.recentResults:recentGames')).toBeInTheDocument()
      expect(screen.getByText('Argentina 2–1 France')).toBeInTheDocument()
    })

    it('shows "+N pts" for finished correct predictions', () => {
      const data: RecentResultsData = { recentGames: [makeRecentGameItem({ finalPoints: 3 })] }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.getByText('+3 pts')).toBeInTheDocument()
    })

    it('shows "0 pts" for finished incorrect predictions', () => {
      const data: RecentResultsData = {
        recentGames: [makeRecentGameItem({ finalPoints: 0, userHomeGuess: 1, userAwayGuess: 1 })],
      }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.getByText('0 pts')).toBeInTheDocument()
    })

    it('shows "-- pts" for pending games (not "0 pts")', () => {
      const data: RecentResultsData = {
        recentGames: [
          makeRecentGameItem({
            gameStatus: 'pending',
            homeScore: null,
            awayScore: null,
            finalPoints: 0,
          }),
        ],
      }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.getByText('-- pts')).toBeInTheDocument()
      expect(screen.queryByText('0 pts')).not.toBeInTheDocument()
    })

    it('shows "-- pts" for about_to_start games', () => {
      const data: RecentResultsData = {
        recentGames: [
          makeRecentGameItem({
            gameStatus: 'about_to_start',
            homeScore: null,
            awayScore: null,
            finalPoints: 0,
          }),
        ],
      }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.getByText('-- pts')).toBeInTheDocument()
    })

    it('renders yellow clock icon text for pending game (matchInProgress key)', () => {
      const data: RecentResultsData = {
        recentGames: [
          makeRecentGameItem({
            gameStatus: 'pending',
            homeScore: null,
            awayScore: null,
            finalPoints: 0,
            userHomeGuess: 1,
            userAwayGuess: 1,
          }),
        ],
      }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.getByText(/hub.recentResults:matchInProgress/)).toBeInTheDocument()
    })

    it('shows "About to start" text for about_to_start status', () => {
      const data: RecentResultsData = {
        recentGames: [
          makeRecentGameItem({
            gameStatus: 'about_to_start',
            homeScore: null,
            awayScore: null,
            finalPoints: 0,
            userHomeGuess: 1,
            userAwayGuess: 1,
          }),
        ],
      }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.getByText(/hub.recentResults:aboutToStart/)).toBeInTheDocument()
    })

    it('shows youDidntPredict for finished game with null guesses', () => {
      const data: RecentResultsData = {
        recentGames: [
          makeRecentGameItem({ userHomeGuess: null, userAwayGuess: null, finalPoints: 0 }),
        ],
      }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.getByText('hub.recentResults:youDidntPredict')).toBeInTheDocument()
    })

    it('shows correctResultWithGuess for correct but not exact prediction', () => {
      const data: RecentResultsData = {
        recentGames: [
          makeRecentGameItem({
            finalPoints: 2,
            homeScore: 1,
            awayScore: 0,
            userHomeGuess: 2,
            userAwayGuess: 0,
          }),
        ],
      }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(
        screen.getByText(/hub.recentResults:correctResultWithGuess/)
      ).toBeInTheDocument()
    })

    it('shows exactResult for exact prediction', () => {
      const data: RecentResultsData = {
        recentGames: [
          makeRecentGameItem({ finalPoints: 5, homeScore: 2, awayScore: 1, userHomeGuess: 2, userAwayGuess: 1 }),
        ],
      }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.getByText('hub.recentResults:exactResult')).toBeInTheDocument()
    })

    it('shows noPredictionShort for pending game with no prediction', () => {
      const data: RecentResultsData = {
        recentGames: [
          makeRecentGameItem({
            gameStatus: 'pending',
            homeScore: null,
            awayScore: null,
            finalPoints: 0,
            userHomeGuess: null,
            userAwayGuess: null,
          }),
        ],
      }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.getByText(/hub.recentResults:noPredictionShort/)).toBeInTheDocument()
    })

    it('shows "vs" instead of score for non-finished games', () => {
      const data: RecentResultsData = {
        recentGames: [
          makeRecentGameItem({
            gameStatus: 'pending',
            homeScore: null,
            awayScore: null,
            finalPoints: 0,
          }),
        ],
      }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.getByText('Argentina vs France')).toBeInTheDocument()
    })

    it('renders BoostBadge when boostType is set and boostBonus > 0', () => {
      const data: RecentResultsData = {
        recentGames: [makeRecentGameItem({ boostType: 'golden', boostBonus: 5, finalPoints: 8, basePoints: 3 })],
      }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.getByText('3x')).toBeInTheDocument()
    })

    it('does not render BoostBadge when boostBonus is 0', () => {
      const data: RecentResultsData = {
        recentGames: [makeRecentGameItem({ boostType: 'silver', boostBonus: 0 })],
      }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.queryByText('2x')).not.toBeInTheDocument()
    })

    it('renders all 10 game items when data has 10 games', () => {
      const games = Array.from({ length: 10 }, (_, i) =>
        makeRecentGameItem({ gameId: `game-${i}`, homeTeamName: `Team${i}` })
      )
      const data: RecentResultsData = { recentGames: games }

      renderWithTheme(<RecentResultsWidget data={data} {...defaultHrefs} />)

      expect(screen.getByText('Team0 2–1 France')).toBeInTheDocument()
      expect(screen.getByText('Team9 2–1 France')).toBeInTheDocument()
    })
  })

  describe('stats button', () => {
    it('"See Stats" button renders with correct href', () => {
      const data: RecentResultsData = { recentGames: [makeRecentGameItem()] }

      renderWithTheme(<RecentResultsWidget data={data} statsHref="/en/tournaments/t1/stats" />)

      const button = screen.getByText('hub.recentResults:seeStats')
      expect(button.closest('a')).toHaveAttribute('href', '/en/tournaments/t1/stats')
    })
  })
})

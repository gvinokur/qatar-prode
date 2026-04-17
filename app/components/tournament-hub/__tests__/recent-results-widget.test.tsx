import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { RecentResultsWidget } from '../recent-results-widget'
import type { RecentGameResultItem, RecentResultsData } from '@/app/actions/hub-actions'

// Mock next-intl — returns namespace-prefixed keys so tests can assert on both namespace and key
vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, vars?: any) => {
    const prefix = namespace ? `${namespace}:` : ''
    return vars ? `${prefix}${key}:${JSON.stringify(vars)}` : `${prefix}${key}`
  },
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ href, children }: any) => (
    <a href={href}>{children}</a>
  ),
}))

const makeRecentGameItem = (
  overrides?: Partial<RecentGameResultItem>
): RecentGameResultItem => ({
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
  ...overrides,
})

const emptyData: RecentResultsData = {
  recentGames: [],
  qualifiedTeamsScore: null,
  qualifiedTeamsCorrect: null,
  qualifiedTeamsActualCount: 0,
  individualAwardsScore: null,
  honorRollScore: null,
}

const defaultHrefs = {
  statsHref: '/stats',
  resultsHref: '/results',
  qualifiedTeamsHref: '/qualified-teams',
  awardsHref: '/awards',
}

describe('RecentResultsWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('empty state', () => {
    it('renders empty state when recentGames is empty and QT/awards are all null/zero', () => {
      renderWithTheme(
        <RecentResultsWidget data={emptyData} {...defaultHrefs} />
      )

      expect(
        screen.getByText('hub.recentResults:emptyTitle')
      ).toBeInTheDocument()
      expect(
        screen.getByText('hub.recentResults:emptySubtitle')
      ).toBeInTheDocument()
    })

    it('renders seeStats button even in empty state (button is outside the card)', () => {
      renderWithTheme(
        <RecentResultsWidget data={emptyData} {...defaultHrefs} />
      )

      expect(
        screen.getByText('hub.recentResults:seeStats')
      ).toBeInTheDocument()
    })
  })

  describe('recent games section', () => {
    it('renders only Recent Games section when games populated but QT/awards are null', () => {
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [makeRecentGameItem()],
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      expect(
        screen.getByText('hub.recentResults:recentGames')
      ).toBeInTheDocument()
      expect(screen.getByText('Argentina 2–1 France')).toBeInTheDocument()
    })

    it('renders game item with CheckCircle icon when finalPoints > 0 (correct prediction)', () => {
      const game = makeRecentGameItem({ finalPoints: 3 })
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [game],
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      // Should show positive points
      expect(screen.getByText('+3 pts')).toBeInTheDocument()
      // CheckCircleOutlineIcon is rendered (component has correct/success styling)
      expect(screen.getByText('Argentina 2–1 France')).toBeInTheDocument()
    })

    it('renders game item with Cancel icon when finalPoints === 0 (wrong prediction)', () => {
      const game = makeRecentGameItem({
        finalPoints: 0,
        userHomeGuess: 1,
        userAwayGuess: 1,
      })
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [game],
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      // Should show "0 pts" label
      expect(screen.getByText('0 pts')).toBeInTheDocument()
      // Should show the guess
      expect(
        screen.getByText(
          /hub.recentResults:yourGuess:\{"home":1,"away":1\}/
        )
      ).toBeInTheDocument()
    })

    it('renders boost chip when boostType is set and boostBonus > 0', () => {
      const game = makeRecentGameItem({
        boostType: 'golden',
        boostBonus: 5,
        finalPoints: 8,
        basePoints: 3,
      })
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [game],
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      // Boost chip should show
      expect(
        screen.getByText(
          /hub.recentResults:boostBonus:\{"bonus":5\}/
        )
      ).toBeInTheDocument()
    })

    it('does not render boost chip when boostBonus is 0', () => {
      const game = makeRecentGameItem({
        boostType: 'silver',
        boostBonus: 0,
      })
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [game],
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      // No boost chip should appear
      expect(screen.queryByText(/boostBonus/)).not.toBeInTheDocument()
    })

    it('renders multiple game items with dividers between them', () => {
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [
          makeRecentGameItem({ gameId: 'game-1' }),
          makeRecentGameItem({
            gameId: 'game-2',
            homeTeamName: 'Brazil',
            awayTeamName: 'Germany',
          }),
        ],
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      expect(screen.getByText('Argentina 2–1 France')).toBeInTheDocument()
      expect(screen.getByText('Brazil 2–1 Germany')).toBeInTheDocument()
    })

    it('game section links to resultsHref', () => {
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [makeRecentGameItem()],
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} resultsHref="/en/tournaments/t1/results" />
      )

      const links = screen.getAllByRole('link')
      expect(links.some(l => l.getAttribute('href') === '/en/tournaments/t1/results')).toBe(true)
    })
  })

  describe('qualified teams section', () => {
    it('renders QT section only when qualifiedTeamsActualCount > 0', () => {
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [],
        qualifiedTeamsScore: 10,
        qualifiedTeamsCorrect: 8,
        qualifiedTeamsActualCount: 10,
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      expect(
        screen.getByText('hub.recentResults:qualifiedTeams')
      ).toBeInTheDocument()
      expect(screen.getByText('+10 pts')).toBeInTheDocument()
    })

    it('shows qualified summary with actual count as denominator', () => {
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [],
        qualifiedTeamsScore: 10,
        qualifiedTeamsCorrect: 8,
        qualifiedTeamsActualCount: 10,
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      expect(
        screen.getByText(
          /hub.recentResults:qualifiedSummary:\{"correct":8,"total":10\}/
        )
      ).toBeInTheDocument()
    })

    it('does not render QT section when qualifiedTeamsActualCount is 0', () => {
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [],
        qualifiedTeamsScore: 0,  // score may be 0 even before teams qualify
        qualifiedTeamsActualCount: 0,
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      const elements = screen.queryAllByText(
        'hub.recentResults:qualifiedTeams'
      )
      expect(elements.length).toBe(0)
    })

    it('renders QT section when qualifiedTeamsActualCount > 0 even if score is 0', () => {
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [],
        qualifiedTeamsScore: 0,
        qualifiedTeamsCorrect: 0,
        qualifiedTeamsActualCount: 8,
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      expect(
        screen.getByText('hub.recentResults:qualifiedTeams')
      ).toBeInTheDocument()
    })

    it('QT section links to qualifiedTeamsHref', () => {
      const data: RecentResultsData = {
        ...emptyData,
        qualifiedTeamsScore: 10,
        qualifiedTeamsActualCount: 8,
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} qualifiedTeamsHref="/en/tournaments/t1/qualified-teams" />
      )

      const links = screen.getAllByRole('link')
      expect(links.some(l => l.getAttribute('href') === '/en/tournaments/t1/qualified-teams')).toBe(true)
    })
  })

  describe('awards section', () => {
    it('renders awards section only when individualAwardsScore is not null', () => {
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [],
        individualAwardsScore: 5,
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      expect(
        screen.getByText('hub.recentResults:tournamentAwards')
      ).toBeInTheDocument()
      expect(screen.getByText('+5 pts')).toBeInTheDocument()
    })

    it('renders honor roll score when honorRollScore > 0', () => {
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [],
        honorRollScore: 3,
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      expect(screen.getByText('Honor Roll')).toBeInTheDocument()
      expect(screen.getByText('+3 pts')).toBeInTheDocument()
    })

    it('does not render honor roll when honorRollScore is 0 or null', () => {
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [],
        honorRollScore: 0,
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      expect(screen.queryByText('Honor Roll')).not.toBeInTheDocument()
    })

    it('renders both individual awards and honor roll when both are set', () => {
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [],
        individualAwardsScore: 5,
        honorRollScore: 3,
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      expect(screen.getByText('+5 pts')).toBeInTheDocument()
      expect(screen.getByText('+3 pts')).toBeInTheDocument()
      expect(screen.getByText('Honor Roll')).toBeInTheDocument()
    })

    it('awards section links to awardsHref', () => {
      const data: RecentResultsData = {
        ...emptyData,
        individualAwardsScore: 5,
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} awardsHref="/en/tournaments/t1/awards" />
      )

      const links = screen.getAllByRole('link')
      expect(links.some(l => l.getAttribute('href') === '/en/tournaments/t1/awards')).toBe(true)
    })
  })

  describe('view stats button', () => {
    it('renders "View full statistics" button when data is not empty', () => {
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [makeRecentGameItem()],
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      const button = screen.getByText('hub.recentResults:seeStats')
      expect(button).toBeInTheDocument()
    })

    it('button href matches statsHref prop', () => {
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [makeRecentGameItem()],
      }

      renderWithTheme(
        <RecentResultsWidget
          data={data}
          {...defaultHrefs}
          statsHref="/en/tournaments/t1/stats"
        />
      )

      const statsButton = screen.getByText('hub.recentResults:seeStats')
      expect(statsButton.closest('a')).toHaveAttribute('href', '/en/tournaments/t1/stats')
    })

    it('renders stats button even in empty state (button is outside the card)', () => {
      renderWithTheme(
        <RecentResultsWidget data={emptyData} {...defaultHrefs} />
      )

      expect(
        screen.getByText('hub.recentResults:seeStats')
      ).toBeInTheDocument()
    })
  })

  describe('title rendering', () => {
    it('always renders widget title', () => {
      renderWithTheme(
        <RecentResultsWidget data={emptyData} {...defaultHrefs} />
      )

      expect(
        screen.getByText('hub.recentResults:title')
      ).toBeInTheDocument()
    })
  })

  describe('game items - score display', () => {
    it('shows correct result label for exact prediction', () => {
      const game = makeRecentGameItem({
        finalPoints: 5,
        userHomeGuess: 2,
        userAwayGuess: 1,
        homeScore: 2,
        awayScore: 1,
      })
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [game],
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      expect(
        screen.getByText('hub.recentResults:exactResult')
      ).toBeInTheDocument()
    })

    it('shows correct result label for non-exact but correct prediction', () => {
      const game = makeRecentGameItem({
        finalPoints: 1,
        userHomeGuess: 2,
        userAwayGuess: 0,
        homeScore: 1,
        awayScore: 0,
      })
      const data: RecentResultsData = {
        ...emptyData,
        recentGames: [game],
      }

      renderWithTheme(
        <RecentResultsWidget data={data} {...defaultHrefs} />
      )

      expect(
        screen.getByText('hub.recentResults:correctResult')
      ).toBeInTheDocument()
    })
  })
})

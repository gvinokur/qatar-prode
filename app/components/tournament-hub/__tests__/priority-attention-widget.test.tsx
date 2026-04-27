import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PriorityAttentionWidget } from '../priority-attention-widget'
import type { ActionCenterData } from '@/app/actions/hub-actions'
import type { PriorityAttentionState } from '@/app/utils/priority-attention'

vi.mock('@/app/utils/prediction-constants', () => ({
  EDIT_NEXT_TOKEN: 'next',
}))

vi.mock('@/app/utils/priority-attention', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/app/utils/priority-attention')>()
  return { ...actual, computePriorityAttention: vi.fn() }
})

vi.mock('../engagement-rotator-widget', () => ({
  EngagementRotatorWidget: ({ tournamentStarted }: { tournamentStarted: boolean }) => (
    <div
      data-testid="engagement-rotator-widget"
      data-tournament-started={String(tournamentStarted)}
    />
  ),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async (ns: string) => {
    return (key: string, params?: Record<string, unknown>) => {
      const fullKey = `${ns}.${key}`
      if (params && Object.keys(params).length > 0) {
        return `${fullKey}(${JSON.stringify(params)})`
      }
      return fullKey
    }
  }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

import * as hubActions from '@/app/utils/priority-attention'

const defaultScoringConfig = {
  game_exact_score_points: 3,
  game_correct_goal_difference_points: 2,
  game_correct_outcome_points: 1,
  champion_points: 5,
  runner_up_points: 3,
  third_place_points: 1,
  individual_award_points: 3,
  qualified_team_points: 1,
  exact_position_qualified_points: 2,
  max_silver_games: 0,
  max_golden_games: 0,
}

const makeData = (overrides: Partial<ActionCenterData> = {}): ActionCenterData => ({
  games: [],
  gameGuesses: {},
  teamsMap: {},
  tournamentMaxSilver: 0,
  tournamentMaxGolden: 0,
  mode: 'empty',
  qtAndAwardsOpen: false,
  msUntilPredictionLock: 0,
  tournamentFinished: false,
  firstGameDate: null,
  tournamentHasStarted: true,
  tournamentName: null,
  openerBackfill: false,
  totalGames: 64,
  predictedGames: 0,
  awardsCompleted: 0,
  awardsTotal: 7,
  qualifiersCompleted: 0,
  qualifiersTotal: 32,
  tournamentJustStarted: false,
  silverBoostsUsed: 0,
  goldenBoostsUsed: 0,
  scoringConfig: defaultScoringConfig,
  ...overrides,
})

const defaultProps = {
  data: makeData(),
  gamesHref: '/en/tournaments/t-1/games',
  qtHref: '/en/tournaments/t-1/qualified-teams',
  awardsHref: '/en/tournaments/t-1/awards',
  locale: 'en' as const,
  tournamentId: 't-1',
}

function mockPriority(state: PriorityAttentionState | null) {
  vi.mocked(hubActions.computePriorityAttention).mockReturnValue(state)
}

describe('PriorityAttentionWidget', () => {
  it('renders EngagementRotatorWidget when computePriorityAttention returns null', async () => {
    mockPriority(null)
    render(await PriorityAttentionWidget(defaultProps))
    expect(screen.getByTestId('engagement-rotator-widget')).toBeInTheDocument()
  })

  it('passes tournamentStarted=true to EngagementRotatorWidget when tournament has started', async () => {
    mockPriority(null)
    render(await PriorityAttentionWidget({ ...defaultProps, data: makeData({ tournamentHasStarted: true }) }))
    expect(screen.getByTestId('engagement-rotator-widget')).toHaveAttribute('data-tournament-started', 'true')
  })

  it('passes tournamentStarted=false to EngagementRotatorWidget when tournament has not started', async () => {
    mockPriority(null)
    render(await PriorityAttentionWidget({ ...defaultProps, data: makeData({ tournamentHasStarted: false }) }))
    expect(screen.getByTestId('engagement-rotator-widget')).toHaveAttribute('data-tournament-started', 'false')
  })

  it('renders a Paper card (not EngagementRotatorWidget) when priority is non-null', async () => {
    mockPriority({ type: 'urgent-games', urgentCount: 2, firstUrgentGameId: 'g1', completedCount: 10, totalCount: 64 })
    render(await PriorityAttentionWidget(defaultProps))
    expect(screen.queryByTestId('engagement-rotator-widget')).not.toBeInTheDocument()
  })

  describe('urgent-games card', () => {
    it('renders error-color CTA with href containing ?edit=next', async () => {
      mockPriority({ type: 'urgent-games', urgentCount: 3, firstUrgentGameId: 'g1', completedCount: 5, totalCount: 64 })
      render(await PriorityAttentionWidget(defaultProps))
      const link = screen.getByRole('link')
      expect(link.getAttribute('href')).toContain('?edit=next')
      expect(link.getAttribute('href')).toContain('/games')
    })
  })

  describe('qt-deadline card', () => {
    it('renders CTA href pointing to qtHref', async () => {
      mockPriority({ type: 'qt-deadline', completedCount: 10, totalCount: 32 })
      render(await PriorityAttentionWidget(defaultProps))
      const link = screen.getByRole('link')
      expect(link.getAttribute('href')).toBe('/en/tournaments/t-1/qualified-teams')
    })
  })

  describe('awards-deadline card', () => {
    it('renders CTA href pointing to awardsHref', async () => {
      mockPriority({ type: 'awards-deadline', completedCount: 3, totalCount: 7 })
      render(await PriorityAttentionWidget(defaultProps))
      const link = screen.getByRole('link')
      expect(link.getAttribute('href')).toBe('/en/tournaments/t-1/awards')
    })
  })

  describe('transition-to-qt card', () => {
    it('renders CTA href pointing to qtHref', async () => {
      mockPriority({ type: 'transition-to-qt', completedCount: 64, totalCount: 64 })
      render(await PriorityAttentionWidget(defaultProps))
      const link = screen.getByRole('link')
      expect(link.getAttribute('href')).toBe('/en/tournaments/t-1/qualified-teams')
    })
  })

  describe('transition-to-awards card', () => {
    it('renders CTA href pointing to awardsHref', async () => {
      mockPriority({ type: 'transition-to-awards', completedCount: 32, totalCount: 32 })
      render(await PriorityAttentionWidget(defaultProps))
      const link = screen.getByRole('link')
      expect(link.getAttribute('href')).toBe('/en/tournaments/t-1/awards')
    })
  })

  describe('fallback-games card', () => {
    it('renders CTA href containing ?edit=next', async () => {
      mockPriority({ type: 'fallback-games', completedCount: 20, totalCount: 64 })
      render(await PriorityAttentionWidget(defaultProps))
      const link = screen.getByRole('link')
      expect(link.getAttribute('href')).toContain('?edit=next')
    })
  })

  describe('qt-nudge card', () => {
    it('renders CTA href pointing to qtHref', async () => {
      mockPriority({ type: 'qt-nudge', completedCount: 10, totalCount: 32 })
      render(await PriorityAttentionWidget(defaultProps))
      const link = screen.getByRole('link')
      expect(link.getAttribute('href')).toBe('/en/tournaments/t-1/qualified-teams')
    })
  })

  describe('awards-nudge card', () => {
    it('renders CTA href pointing to awardsHref', async () => {
      mockPriority({ type: 'awards-nudge', completedCount: 4, totalCount: 7 })
      render(await PriorityAttentionWidget(defaultProps))
      const link = screen.getByRole('link')
      expect(link.getAttribute('href')).toBe('/en/tournaments/t-1/awards')
    })
  })
})

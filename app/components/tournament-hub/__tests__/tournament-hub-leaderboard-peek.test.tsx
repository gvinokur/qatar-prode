import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TournamentHubLeaderboardPeek } from '../tournament-hub-leaderboard-peek'
import * as hubActions from '@/app/actions/hub-actions'
import type { LeaderboardPeekResult, GroupPeekData } from '@/app/actions/hub-actions'

vi.mock('@/app/actions/hub-actions', () => ({
  getLeaderboardPeekData: vi.fn(),
}))

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(() => (key: string) => key),
}))

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

vi.mock('../social-hub-card', () => ({
  SocialHubCard: ({
    locale,
    tournamentId,
    loginHref,
  }: {
    locale: string
    tournamentId: string
    loginHref?: string
  }) => (
    <div
      data-testid="social-hub-card"
      data-locale={locale}
      data-tournament-id={tournamentId}
      data-login-href={loginHref ?? ''}
    >
      SocialHubCard
    </div>
  ),
}))

vi.mock('../pre-tournament-groups-preview', () => ({
  PreTournamentGroupsPreview: ({
    allGroupNames,
  }: {
    allGroupNames: Array<{ id: string; name: string }>
  }) => (
    <div data-testid="pre-tournament-groups-preview" data-count={allGroupNames.length}>
      PreTournamentGroupsPreview
    </div>
  ),
}))

vi.mock('../leaderboard-peek-card', () => ({
  LeaderboardPeekCard: ({ data }: { data: GroupPeekData }) => (
    <div data-testid={`leaderboard-peek-card-${data.groupId}`}>{data.groupName}</div>
  ),
}))

const noGroupsResult: LeaderboardPeekResult = {
  groups: [],
  userHasGroups: false,
  allGroupNames: [],
}

const hasGroupsNoRankingResult: LeaderboardPeekResult = {
  groups: [],
  userHasGroups: true,
  allGroupNames: [
    { id: 'g-1', name: 'Alpha' },
    { id: 'g-2', name: 'Beta' },
  ],
}

const makeGroupPeekData = (id: string, name: string): GroupPeekData => ({
  groupId: id,
  groupName: name,
  totalMembers: 5,
  userRank: 2,
  rankChange: null,
  rows: [],
})

const hasRankingResult: LeaderboardPeekResult = {
  groups: [
    makeGroupPeekData('g-1', 'Alpha'),
    makeGroupPeekData('g-2', 'Beta'),
    makeGroupPeekData('g-3', 'Gamma'),
  ],
  userHasGroups: true,
  allGroupNames: [
    { id: 'g-1', name: 'Alpha' },
    { id: 'g-2', name: 'Beta' },
    { id: 'g-3', name: 'Gamma' },
  ],
}

const defaultProps = { tournamentId: 'tour-42', locale: 'en' as const }

describe('TournamentHubLeaderboardPeek', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders DashboardCard with SocialHubCard and login href when isAuthenticated is false', async () => {
    render(
      await TournamentHubLeaderboardPeek({ ...defaultProps, isAuthenticated: false })
    )

    const card = screen.getByTestId('social-hub-card')
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute('data-login-href', '/en/auth/signin')
  })

  it('does not call getLeaderboardPeekData when isAuthenticated is false', async () => {
    render(
      await TournamentHubLeaderboardPeek({ ...defaultProps, isAuthenticated: false })
    )

    expect(hubActions.getLeaderboardPeekData).not.toHaveBeenCalled()
  })

  it('renders SocialHubCard without loginHref when authenticated but userHasGroups is false', async () => {
    vi.mocked(hubActions.getLeaderboardPeekData).mockResolvedValue(noGroupsResult)

    render(
      await TournamentHubLeaderboardPeek({ ...defaultProps, isAuthenticated: true })
    )

    const card = screen.getByTestId('social-hub-card')
    expect(card).toBeInTheDocument()
    expect(card).toHaveAttribute('data-login-href', '')
    expect(screen.queryByTestId('pre-tournament-groups-preview')).not.toBeInTheDocument()
  })

  it('renders PreTournamentGroupsPreview when userHasGroups=true but groups array is empty', async () => {
    vi.mocked(hubActions.getLeaderboardPeekData).mockResolvedValue(hasGroupsNoRankingResult)

    render(
      await TournamentHubLeaderboardPeek({ ...defaultProps, isAuthenticated: true })
    )

    expect(screen.getByTestId('pre-tournament-groups-preview')).toBeInTheDocument()
    expect(screen.queryByTestId('social-hub-card')).not.toBeInTheDocument()
  })

  it('renders one LeaderboardPeekCard per group when groups is non-empty', async () => {
    vi.mocked(hubActions.getLeaderboardPeekData).mockResolvedValue(hasRankingResult)

    render(
      await TournamentHubLeaderboardPeek({ ...defaultProps, isAuthenticated: true })
    )

    expect(screen.getByTestId('leaderboard-peek-card-g-1')).toBeInTheDocument()
    expect(screen.getByTestId('leaderboard-peek-card-g-2')).toBeInTheDocument()
    expect(screen.queryByTestId('social-hub-card')).not.toBeInTheDocument()
    expect(screen.queryByTestId('pre-tournament-groups-preview')).not.toBeInTheDocument()
  })

  it('renders exactly 3 LeaderboardPeekCard components when groups has 3 items', async () => {
    vi.mocked(hubActions.getLeaderboardPeekData).mockResolvedValue(hasRankingResult)

    render(
      await TournamentHubLeaderboardPeek({ ...defaultProps, isAuthenticated: true })
    )

    expect(screen.getAllByTestId(/^leaderboard-peek-card-/)).toHaveLength(3)
  })
})

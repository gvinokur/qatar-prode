import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import LeaderboardCard from '../LeaderboardCard'
import type { LeaderboardUser, Badge } from '../types'

// Mock next-intl with key pass-through
vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl')
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  }
})

// Mock framer-motion to avoid animation complexity in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  LayoutGroup: ({ children }: any) => <>{children}</>,
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const mockUser: LeaderboardUser = {
  id: 'user-1',
  name: 'Test Player',
  totalPoints: 500,
  groupPoints: 300,
  knockoutPoints: 200,
  groupStageScore: 250,
  groupStageQualifiersScore: 50,
  groupPositionScore: 0,
  playoffScore: 180,
  groupBoostBonus: 0,
  playoffBoostBonus: 20,
  honorRollScore: 5,
  individualAwardsScore: 0,
}

const positiveBadge: Badge = { id: 'crack', emoji: '🥇', type: 'positive' }
const negativeBadge: Badge = { id: 'dead-last', emoji: '💩', type: 'negative' }

describe('LeaderboardCard badge integration', () => {
  it('renders badge row below points in collapsed state', () => {
    renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        badges={[positiveBadge]}
        isCurrentUser={false}
        isExpanded={false}
        onToggle={() => {}}
      />
    )

    expect(screen.getAllByText('🥇').length).toBeGreaterThan(0)
    expect(screen.getByText(`${mockUser.totalPoints.toLocaleString()} pts`)).toBeInTheDocument()
  })

  it('does not render badge row when badges array is empty', () => {
    const { container } = renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        badges={[]}
        isCurrentUser={false}
        isExpanded={false}
        onToggle={() => {}}
      />
    )

    // No emoji spans should be present
    expect(screen.queryByText('🥇')).not.toBeInTheDocument()
  })

  it('renders Insignias section with badges when expanded and badges non-empty', () => {
    renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        badges={[positiveBadge, negativeBadge]}
        isCurrentUser={false}
        isExpanded={true}
        onToggle={() => {}}
      />
    )

    // sectionLabel key should be rendered (key pass-through mock)
    expect(screen.getByText('sectionLabel')).toBeInTheDocument()
    // Badges should appear
    expect(screen.getAllByText('🥇').length).toBeGreaterThan(0)
    expect(screen.getAllByText('💩').length).toBeGreaterThan(0)
  })

  it('does not render Insignias section when badges array is empty', () => {
    renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        badges={[]}
        isCurrentUser={false}
        isExpanded={true}
        onToggle={() => {}}
      />
    )

    expect(screen.queryByText('sectionLabel')).not.toBeInTheDocument()
  })

  it('renders without badges prop (defaults to empty array)', () => {
    renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        isCurrentUser={false}
        isExpanded={false}
        onToggle={() => {}}
      />
    )

    // Should render normally without crashing
    expect(screen.getByText(`${mockUser.totalPoints.toLocaleString()} pts`)).toBeInTheDocument()
  })
})

describe('LeaderboardCard compact mode', () => {
  it('does not render expand toggle hint when compact=true', () => {
    renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        isCurrentUser={false}
        isExpanded={false}
        onToggle={() => {}}
        compact
      />
    )

    expect(screen.queryByText('tapToViewDetails')).not.toBeInTheDocument()
  })

  it('does not render action buttons (Compare, Share) when compact=true', () => {
    renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={2}
        isCurrentUser={false}
        isExpanded={false}
        onToggle={() => {}}
        onCompare={() => {}}
        compact
      />
    )

    expect(screen.queryByLabelText(/Compare with/)).not.toBeInTheDocument()
  })

  it('does not render Collapse detail section when compact=true', () => {
    renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        isCurrentUser={false}
        isExpanded={true}
        onToggle={() => {}}
        compact
      />
    )

    // pointBreakdown key is only rendered inside the Collapse
    expect(screen.queryByText('pointBreakdown')).not.toBeInTheDocument()
  })

  it('still applies primary background highlight for current user when compact=true', () => {
    renderWithTheme(
      <LeaderboardCard
        user={mockUser}
        rank={1}
        isCurrentUser={true}
        isExpanded={false}
        onToggle={() => {}}
        compact
      />
    )

    // The "You" text indicates the current user highlight path was taken
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText(`${mockUser.totalPoints.toLocaleString()} pts`)).toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithTheme } from '@/__tests__/utils/test-utils'
import { LeaderboardPeekCard } from '../leaderboard-peek-card'
import type { GroupPeekData } from '@/app/actions/hub-actions'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

vi.mock('next-intl', async () => {
  const actual = await vi.importActual('next-intl')
  return {
    ...actual,
    useTranslations: () => (key: string) => key,
  }
})

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  LayoutGroup: ({ children }: any) => <>{children}</>,
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

const makeGroupData = (overrides?: Partial<GroupPeekData>): GroupPeekData => ({
  groupId: 'group-1',
  groupName: 'Group Alpha',
  totalMembers: 5,
  userRank: 3,
  rankChange: 2,
  rows: [
    { userId: 'user-1', userName: 'Carlos', rank: 2, score: 892, isCurrentUser: false },
    { userId: 'user-me', userName: 'You', rank: 3, score: 800, isCurrentUser: true },
    { userId: 'user-3', userName: 'Maria', rank: 4, score: 750, isCurrentUser: false },
  ],
  ...overrides,
})

describe('LeaderboardPeekCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders group name in card header', () => {
    renderWithTheme(
      <LeaderboardPeekCard
        data={makeGroupData()}
        groupLeaderboardHref="/en/tournaments/t1/friend-groups/group-1"
      />
    )

    expect(screen.getByText('Group Alpha')).toBeInTheDocument()
  })

  it('renders rank label with correct rank number', () => {
    renderWithTheme(
      <LeaderboardPeekCard
        data={makeGroupData({ userRank: 7 })}
        groupLeaderboardHref="/en/tournaments/t1/friend-groups/group-1"
      />
    )

    expect(screen.getByText('#7')).toBeInTheDocument()
  })

  it('renders exactly data.rows.length LeaderboardCard rows', () => {
    renderWithTheme(
      <LeaderboardPeekCard
        data={makeGroupData()}
        groupLeaderboardHref="/en/tournaments/t1/friend-groups/group-1"
      />
    )

    expect(screen.getByText('892 pts')).toBeInTheDocument()
    expect(screen.getByText('800 pts')).toBeInTheDocument()
    expect(screen.getByText('750 pts')).toBeInTheDocument()
  })

  it('applies height: 100% style on the root Card', () => {
    const { container } = renderWithTheme(
      <LeaderboardPeekCard
        data={makeGroupData()}
        groupLeaderboardHref="/en/tournaments/t1/friend-groups/group-1"
      />
    )

    const card = container.firstChild as HTMLElement
    expect(card).toHaveStyle({ height: '100%' })
  })

  it('calls router.push with groupLeaderboardHref when CardActionArea is clicked', () => {
    renderWithTheme(
      <LeaderboardPeekCard
        data={makeGroupData()}
        groupLeaderboardHref="/en/tournaments/t1/friend-groups/group-1"
      />
    )

    const actionArea = screen.getByRole('button')
    fireEvent.click(actionArea)

    expect(mockPush).toHaveBeenCalledWith('/en/tournaments/t1/friend-groups/group-1')
  })

  it('renders zero LeaderboardCard rows when data.rows is an empty array', () => {
    renderWithTheme(
      <LeaderboardPeekCard
        data={makeGroupData({ rows: [] })}
        groupLeaderboardHref="/en/tournaments/t1/friend-groups/group-1"
      />
    )

    expect(screen.queryByText('pts')).not.toBeInTheDocument()
    expect(screen.getByText('Group Alpha')).toBeInTheDocument()
  })

  it('renders without crashing when rankChange is null', () => {
    renderWithTheme(
      <LeaderboardPeekCard
        data={makeGroupData({ rankChange: null })}
        groupLeaderboardHref="/en/tournaments/t1/friend-groups/group-1"
      />
    )

    expect(screen.getByText('Group Alpha')).toBeInTheDocument()
  })
})

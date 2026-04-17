import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getGroupRankHistory } from '../group-ranking-actions'
import * as groupRankingRepository from '@/app/db/group-ranking-repository'
import { testFactories } from '../../../__tests__/db/test-factories'

vi.mock('@/app/db/group-ranking-repository', () => ({
  getGroupRankingSnapshots: vi.fn(),
}))

// Required by 'use server' — suppress next-intl and auth imports
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
  getLocale: vi.fn().mockResolvedValue('en'),
}))

const mockGetGroupRankingSnapshots = vi.mocked(
  groupRankingRepository.getGroupRankingSnapshots
)

describe('getGroupRankHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns null when group has no ranking snapshots', async () => {
    mockGetGroupRankingSnapshots.mockResolvedValue([])
    const result = await getGroupRankHistory('group-1', 1)
    expect(result).toBeNull()
  })

  it('groups snapshots by userId with correct date and rank values', async () => {
    mockGetGroupRankingSnapshots.mockResolvedValue([
      testFactories.groupRanking({ user_id: 'user-1', snapshot_date: 20260601, rank: 2 }),
      testFactories.groupRanking({ user_id: 'user-2', snapshot_date: 20260601, rank: 1 }),
      testFactories.groupRanking({ user_id: 'user-1', snapshot_date: 20260602, rank: 1 }),
    ])

    const result = await getGroupRankHistory('group-1', 1)

    expect(result).not.toBeNull()
    const user1 = result!.find((e) => e.userId === 'user-1')
    const user2 = result!.find((e) => e.userId === 'user-2')

    expect(user1?.data).toEqual([
      { date: 20260601, rank: 2 },
      { date: 20260602, rank: 1 },
    ])
    expect(user2?.data).toEqual([{ date: 20260601, rank: 1 }])
  })

  it('each user data array is ordered by snapshot_date ascending (matches repo order)', async () => {
    // Repository returns rows ordered date ASC — action preserves that order
    mockGetGroupRankingSnapshots.mockResolvedValue([
      testFactories.groupRanking({ user_id: 'user-1', snapshot_date: 20260601, rank: 3 }),
      testFactories.groupRanking({ user_id: 'user-1', snapshot_date: 20260602, rank: 2 }),
      testFactories.groupRanking({ user_id: 'user-1', snapshot_date: 20260603, rank: 1 }),
    ])

    const result = await getGroupRankHistory('group-1', 1)

    const dates = result![0].data.map((d) => d.date)
    expect(dates).toEqual([20260601, 20260602, 20260603])
  })

  it('handles a group with a single user correctly', async () => {
    mockGetGroupRankingSnapshots.mockResolvedValue([
      testFactories.groupRanking({ user_id: 'solo-user', snapshot_date: 20260601, rank: 1 }),
    ])

    const result = await getGroupRankHistory('group-solo', 42)

    expect(result).toHaveLength(1)
    expect(result![0]).toEqual({
      userId: 'solo-user',
      data: [{ date: 20260601, rank: 1 }],
    })
  })

  it('returns entries for every user that has at least one snapshot', async () => {
    mockGetGroupRankingSnapshots.mockResolvedValue([
      testFactories.groupRanking({ user_id: 'user-a', snapshot_date: 20260601, rank: 1 }),
      testFactories.groupRanking({ user_id: 'user-b', snapshot_date: 20260601, rank: 2 }),
      testFactories.groupRanking({ user_id: 'user-c', snapshot_date: 20260601, rank: 3 }),
    ])

    const result = await getGroupRankHistory('group-1', 1)

    const userIds = result!.map((e) => e.userId).sort()
    expect(userIds).toEqual(['user-a', 'user-b', 'user-c'])
  })
})

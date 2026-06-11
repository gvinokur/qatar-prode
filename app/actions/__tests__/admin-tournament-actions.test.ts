import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserTournamentCompletionsAction, getAllGroupsForAdminAction } from '../admin-tournament-actions'

vi.mock('@/app/db/user-tournament-completion-repository', () => ({
  getUserTournamentCompletionsPaginated: vi.fn(),
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ get: vi.fn() })),
}))

vi.mock('next-intl/server', () => ({ getTranslations: vi.fn() }))
vi.mock('@/app/utils/email', () => ({ sendEmail: vi.fn() }))
vi.mock('@/app/utils/email-templates', () => ({
  generatePasswordResetEmail: vi.fn(),
  generateVerificationEmail: vi.fn(),
}))
vi.mock('@/app/db/prode-group-repository', () => ({
  deleteAllParticipantsFromGroup: vi.fn(),
  deleteParticipantFromAllGroups: vi.fn(),
  deleteProdeGroup: vi.fn(),
  findProdeGroupsByOwner: vi.fn(),
  findAllProdeGroupsForAdmin: vi.fn(),
}))
vi.mock('@/app/db/tournament-guess-repository', () => ({
  deleteAllUserTournamentGuesses: vi.fn(),
}))
vi.mock('@/app/db/game-guess-repository', () => ({
  deleteAllUserGameGuesses: vi.fn(),
}))

import { auth } from '@/auth'
import * as repo from '@/app/db/user-tournament-completion-repository'
import * as groupRepo from '@/app/db/prode-group-repository'

const TOURNAMENT_ID = 'tournament-1'
const PAGE = 0
const PAGE_SIZE = 25

const fakeResult = {
  rows: [
    {
      userId: 'u1',
      nickname: 'Alice',
      isEmailVerified: true,
      gamesPredicted: 5,
      totalGames: 48,
      qualifiersFilled: 2,
      qualifiersTotal: 20,
      awardsFilled: 1,
      awardsTotal: 7,
      groupCount: 1,
      groupNames: ['Friends'],
      overallPct: 11,
    },
  ],
  total: 1,
}

describe('getUserTournamentCompletionsAction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws Unauthorized when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: false } } as never)

    await expect(
      getUserTournamentCompletionsAction(TOURNAMENT_ID, PAGE, PAGE_SIZE)
    ).rejects.toThrow('Unauthorized')
  })

  it('throws Unauthorized when session is null', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    await expect(
      getUserTournamentCompletionsAction(TOURNAMENT_ID, PAGE, PAGE_SIZE)
    ).rejects.toThrow('Unauthorized')
  })

  it('returns repository data unchanged for admin caller', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: true } } as never)
    vi.mocked(repo.getUserTournamentCompletionsPaginated).mockResolvedValue(fakeResult)

    const result = await getUserTournamentCompletionsAction(TOURNAMENT_ID, PAGE, PAGE_SIZE)

    expect(repo.getUserTournamentCompletionsPaginated).toHaveBeenCalledWith(
      TOURNAMENT_ID,
      PAGE,
      PAGE_SIZE,
      undefined
    )
    expect(result).toEqual(fakeResult)
  })

  it('passes groupId to repository when provided', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: true } } as never)
    vi.mocked(repo.getUserTournamentCompletionsPaginated).mockResolvedValue({ rows: [], total: 0 })

    await getUserTournamentCompletionsAction(TOURNAMENT_ID, PAGE, PAGE_SIZE, 'group-1')

    expect(repo.getUserTournamentCompletionsPaginated).toHaveBeenCalledWith(
      TOURNAMENT_ID,
      PAGE,
      PAGE_SIZE,
      'group-1'
    )
  })
})

describe('getAllGroupsForAdminAction', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws Unauthorized when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: false } } as never)

    await expect(getAllGroupsForAdminAction()).rejects.toThrow('Unauthorized')
  })

  it('throws Unauthorized when session is null', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    await expect(getAllGroupsForAdminAction()).rejects.toThrow('Unauthorized')
  })

  it('returns groups array from repository for admin caller', async () => {
    const fakeGroups = [
      { id: 'g1', name: 'Alpha' },
      { id: 'g2', name: 'Beta' },
    ]
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: true } } as never)
    vi.mocked(groupRepo.findAllProdeGroupsForAdmin).mockResolvedValue(fakeGroups)

    const result = await getAllGroupsForAdminAction()

    expect(groupRepo.findAllProdeGroupsForAdmin).toHaveBeenCalledOnce()
    expect(result).toEqual(fakeGroups)
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUsersPaginated } from '../user-actions'

vi.mock('@/app/db/users-repository', () => ({
  findUsersPaginated: vi.fn(),
  countUsers: vi.fn(),
  // Stub remaining exports so the module resolves
  createUser: vi.fn(),
  findUserByEmail: vi.fn(),
  getPasswordHash: vi.fn(),
  updateUser: vi.fn(),
  findUserByResetToken: vi.fn(),
  findUserByVerificationToken: vi.fn(),
  verifyEmail: vi.fn(),
  deleteUser: vi.fn(),
  userHasPasswordAuth: vi.fn(),
  findAllUsers: vi.fn(),
}))

vi.mock('@/app/actions/user-actions', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../user-actions')>()
  return mod
})

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ get: vi.fn() })),
}))

// Mock all other heavy dependencies in user-actions.ts
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
}))
vi.mock('@/app/db/tournament-guess-repository', () => ({
  deleteAllUserTournamentGuesses: vi.fn(),
}))
vi.mock('@/app/db/game-guess-repository', () => ({
  deleteAllUserGameGuesses: vi.fn(),
}))

import * as usersRepo from '@/app/db/users-repository'

// getLoggedInUser uses auth() from next-auth — mock the session
vi.mock('../../actions/user-actions', async () => {
  const actual = await vi.importActual<typeof import('../user-actions')>('../user-actions')
  return actual
})

// Override getLoggedInUser by mocking auth
import { auth } from '@/auth'

describe('getUsersPaginated', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws Unauthorized when user is not admin', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: false } } as never)

    await expect(getUsersPaginated('', 0, 25)).rejects.toThrow('Unauthorized')
  })

  it('throws Unauthorized when session is null', async () => {
    vi.mocked(auth).mockResolvedValue(null)

    await expect(getUsersPaginated('', 0, 25)).rejects.toThrow('Unauthorized')
  })

  it('returns users and total for admin user', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: true } } as never)

    const fakeUsers = [{ id: 'u1', email: 'a@a.com' }]
    vi.mocked(usersRepo.findUsersPaginated).mockResolvedValue(fakeUsers as never)
    vi.mocked(usersRepo.countUsers).mockResolvedValue(1)

    const result = await getUsersPaginated('a', 0, 25)

    expect(usersRepo.findUsersPaginated).toHaveBeenCalledWith('a', 0, 25)
    expect(usersRepo.countUsers).toHaveBeenCalledWith('a')
    expect(result).toEqual({ users: fakeUsers, total: 1 })
  })
})

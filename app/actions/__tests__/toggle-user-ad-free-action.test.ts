import { describe, it, expect, vi, beforeEach } from 'vitest';
import { toggleUserAdFreeAction } from '../user-actions';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ get: vi.fn() })),
}));

vi.mock('@/app/db/users-repository', () => ({
  findUserByEmail: vi.fn(),
  createUser: vi.fn(),
  getPasswordHash: vi.fn(),
  updateUser: vi.fn(),
  findUserByResetToken: vi.fn(),
  findUserByVerificationToken: vi.fn(),
  verifyEmail: vi.fn(),
  deleteUser: vi.fn(),
  userHasPasswordAuth: vi.fn(),
  findUsersPaginated: vi.fn(),
  countUsers: vi.fn(),
  updateUserAdFreeStatus: vi.fn(),
}));

vi.mock('next-intl/server', () => ({ getTranslations: vi.fn() }));
vi.mock('@/app/utils/email', () => ({ sendEmail: vi.fn() }));
vi.mock('@/app/utils/email-templates', () => ({
  generatePasswordResetEmail: vi.fn(),
  generateVerificationEmail: vi.fn(),
}));
vi.mock('@/app/db/prode-group-repository', () => ({
  deleteAllParticipantsFromGroup: vi.fn(),
  deleteParticipantFromAllGroups: vi.fn(),
  deleteProdeGroup: vi.fn(),
  findProdeGroupsByOwner: vi.fn(),
}));
vi.mock('@/app/db/tournament-guess-repository', () => ({ deleteAllUserTournamentGuesses: vi.fn() }));
vi.mock('@/app/db/game-guess-repository', () => ({ deleteAllUserGameGuesses: vi.fn() }));
vi.mock('@/app/db/qualified-teams-repository', () => ({ deleteAllUserGroupPositionsPredictions: vi.fn() }));

import { auth } from '@/auth';
import * as usersRepo from '@/app/db/users-repository';
import { testFactories } from '../../../__tests__/db/test-factories';

describe('toggleUserAdFreeAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws Unauthorized when caller is not admin', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: false } } as never);

    await expect(toggleUserAdFreeAction('user-1', true)).rejects.toThrow('Unauthorized');
  });

  it('updates is_ad_free to true for target user', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: true } } as never);
    vi.mocked(usersRepo.updateUserAdFreeStatus).mockResolvedValue(
      testFactories.user({ id: 'user-1', is_ad_free: true })
    );

    await toggleUserAdFreeAction('user-1', true);

    expect(usersRepo.updateUserAdFreeStatus).toHaveBeenCalledWith('user-1', true);
  });

  it('updates is_ad_free to false for target user', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: true } } as never);
    vi.mocked(usersRepo.updateUserAdFreeStatus).mockResolvedValue(
      testFactories.user({ id: 'user-1', is_ad_free: false })
    );

    await toggleUserAdFreeAction('user-1', false);

    expect(usersRepo.updateUserAdFreeStatus).toHaveBeenCalledWith('user-1', false);
  });
});

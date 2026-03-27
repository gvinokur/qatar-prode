import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdSettingsAction, updateAdSettingsAction } from '../ad-settings-actions';
import { testFactories } from '../../../__tests__/db/test-factories';

vi.mock('@/app/db/ad-settings-repository', () => ({
  getAdSettings: vi.fn(),
  upsertAdSettings: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ get: vi.fn() })),
}));

// user-actions imports many heavy modules; stub them all
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
import { getAdSettings, upsertAdSettings } from '@/app/db/ad-settings-repository';

describe('getAdSettingsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns hard-coded defaults (30, 10) when settings row does not exist', async () => {
    vi.mocked(getAdSettings).mockResolvedValue(undefined);

    const result = await getAdSettingsAction();

    expect(result).toEqual({ modalMinMinutesBetween: 30, modalMinPageviewsBetween: 10 });
  });

  it('returns stored values when settings row exists', async () => {
    vi.mocked(getAdSettings).mockResolvedValue(
      testFactories.adSettings({ modal_min_minutes_between: 60, modal_min_pageviews_between: 5 })
    );

    const result = await getAdSettingsAction();

    expect(result.modalMinMinutesBetween).toBe(60);
    expect(result.modalMinPageviewsBetween).toBe(5);
  });

  it('camelCases the returned fields correctly', async () => {
    vi.mocked(getAdSettings).mockResolvedValue(testFactories.adSettings());

    const result = await getAdSettingsAction();

    expect(result).toHaveProperty('modalMinMinutesBetween');
    expect(result).toHaveProperty('modalMinPageviewsBetween');
  });

  it('catches any error from getAdSettings and returns defaults without re-throwing', async () => {
    vi.mocked(getAdSettings).mockRejectedValue(new Error('DB connection error'));

    const result = await getAdSettingsAction();

    expect(result).toEqual({ modalMinMinutesBetween: 30, modalMinPageviewsBetween: 10 });
  });
});

describe('updateAdSettingsAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws Unauthorized when caller is not admin', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: false } } as never);

    await expect(updateAdSettingsAction(30, 10)).rejects.toThrow('Unauthorized');
  });

  it('throws Unauthorized when session is null', async () => {
    vi.mocked(auth).mockResolvedValue(null);

    await expect(updateAdSettingsAction(30, 10)).rejects.toThrow('Unauthorized');
  });

  it('persists minMinutes value via upsertAdSettings', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: true } } as never);
    vi.mocked(upsertAdSettings).mockResolvedValue(testFactories.adSettings({ modal_min_minutes_between: 45 }));

    await updateAdSettingsAction(45, 10);

    expect(upsertAdSettings).toHaveBeenCalledWith(
      expect.objectContaining({ modal_min_minutes_between: 45 })
    );
  });

  it('persists minPageviews value via upsertAdSettings', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: true } } as never);
    vi.mocked(upsertAdSettings).mockResolvedValue(testFactories.adSettings({ modal_min_pageviews_between: 3 }));

    await updateAdSettingsAction(30, 3);

    expect(upsertAdSettings).toHaveBeenCalledWith(
      expect.objectContaining({ modal_min_pageviews_between: 3 })
    );
  });

  it("throws Error('Invalid values') when minMinutes < 0", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: true } } as never);

    await expect(updateAdSettingsAction(-1, 10)).rejects.toThrow('Invalid values');
  });

  it("throws Error('Invalid values') when minPageviews < 0", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { isAdmin: true } } as never);

    await expect(updateAdSettingsAction(30, -1)).rejects.toThrow('Invalid values');
  });
});

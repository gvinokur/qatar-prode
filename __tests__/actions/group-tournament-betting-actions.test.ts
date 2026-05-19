import { vi, describe, it, expect, beforeEach } from 'vitest';
import { testFactories } from '../db/test-factories';

vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/app/actions/user-actions', () => ({ getLoggedInUser: vi.fn() }));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));

vi.mock('@/app/db/prode-group-repository', () => ({
  findProdeGroupById: vi.fn(),
  findParticipantsInGroup: vi.fn(),
  getGroupTournamentBettingConfig: vi.fn(),
  createGroupTournamentBettingConfig: vi.fn(),
  updateGroupTournamentBettingConfig: vi.fn(),
  setUserGroupTournamentBettingPayment: vi.fn(),
  getUserGroupTournamentBettingPayment: vi.fn(),
  getGroupTournamentBettingPayments: vi.fn(),
}));

import * as userActions from '@/app/actions/user-actions';
import * as prodeGroupRepository from '@/app/db/prode-group-repository';
import {
  setGroupTournamentBettingConfigAction,
  setUserGroupTournamentBettingPaymentAction,
} from '@/app/actions/group-tournament-betting-actions';

const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);
const mockFindProdeGroupById = vi.mocked(prodeGroupRepository.findProdeGroupById);
const mockFindParticipantsInGroup = vi.mocked(prodeGroupRepository.findParticipantsInGroup);
const mockGetGroupTournamentBettingConfig = vi.mocked(prodeGroupRepository.getGroupTournamentBettingConfig);
const mockCreateGroupTournamentBettingConfig = vi.mocked(prodeGroupRepository.createGroupTournamentBettingConfig);
const mockUpdateGroupTournamentBettingConfig = vi.mocked(prodeGroupRepository.updateGroupTournamentBettingConfig);
const mockSetUserGroupTournamentBettingPayment = vi.mocked(prodeGroupRepository.setUserGroupTournamentBettingPayment);

describe('Group Tournament Betting Actions', () => {
  const mockOwner = testFactories.user({ id: 'owner-1', email: 'owner@test.com' });
  const mockUser = testFactories.user({ id: 'user-1', email: 'user@test.com' });
  const mockGroup = testFactories.prodeGroup({ id: 'group-1', owner_user_id: 'owner-1' });
  const mockBettingConfig = testFactories.prodeGroupTournamentBetting({ id: 'betting-1', group_id: 'group-1', tournament_id: 'tournament-1' });
  const mockPayment = testFactories.prodeGroupTournamentBettingPayment({ id: 'payment-1' });

  const adminParticipant = { user_id: 'user-1', prode_group_id: 'group-1', participant_id: 'user-1', is_admin: true };
  const nonAdminParticipant = { user_id: 'user-2', prode_group_id: 'group-1', participant_id: 'user-2', is_admin: false };

  const configPayload = {
    betting_enabled: true,
    betting_amount: 100,
    betting_payout_description: 'Winner takes all',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
    mockFindProdeGroupById.mockResolvedValue(mockGroup as any);
    mockFindParticipantsInGroup.mockResolvedValue([nonAdminParticipant] as any);
    mockGetGroupTournamentBettingConfig.mockResolvedValue(null);
    mockCreateGroupTournamentBettingConfig.mockResolvedValue(mockBettingConfig as any);
    mockUpdateGroupTournamentBettingConfig.mockResolvedValue(mockBettingConfig as any);
    mockSetUserGroupTournamentBettingPayment.mockResolvedValue(mockPayment as any);
  });

  // ---------------------------------------------------------------------------
  // setGroupTournamentBettingConfigAction
  // ---------------------------------------------------------------------------
  describe('setGroupTournamentBettingConfigAction', () => {
    it('throws if user is not authenticated', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);
      await expect(
        setGroupTournamentBettingConfigAction('group-1', 'tournament-1', configPayload)
      ).rejects.toThrow('notAuthenticated');
    });

    it('throws if group not found', async () => {
      mockFindProdeGroupById.mockResolvedValue(undefined);
      await expect(
        setGroupTournamentBettingConfigAction('group-1', 'tournament-1', configPayload)
      ).rejects.toThrow('betting.ownerOnly');
    });

    it('throws if user is not owner or admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockUser as any);
      mockFindParticipantsInGroup.mockResolvedValue([nonAdminParticipant] as any);
      await expect(
        setGroupTournamentBettingConfigAction('group-1', 'tournament-1', configPayload)
      ).rejects.toThrow('betting.ownerOnly');
    });

    it('allows admin participant to update config', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockUser as any);
      mockFindParticipantsInGroup.mockResolvedValue([adminParticipant] as any);
      mockGetGroupTournamentBettingConfig.mockResolvedValue(mockBettingConfig as any);

      const result = await setGroupTournamentBettingConfigAction('group-1', 'tournament-1', configPayload);

      expect(mockUpdateGroupTournamentBettingConfig).toHaveBeenCalled();
      expect(result).toEqual(mockBettingConfig);
    });

    it('creates new config when none exists', async () => {
      mockGetGroupTournamentBettingConfig.mockResolvedValue(null);

      const result = await setGroupTournamentBettingConfigAction('group-1', 'tournament-1', configPayload);

      expect(mockCreateGroupTournamentBettingConfig).toHaveBeenCalledWith({
        ...configPayload,
        group_id: 'group-1',
        tournament_id: 'tournament-1',
      });
      expect(mockUpdateGroupTournamentBettingConfig).not.toHaveBeenCalled();
      expect(result).toEqual(mockBettingConfig);
    });

    it('updates existing config when one exists', async () => {
      mockGetGroupTournamentBettingConfig.mockResolvedValue(mockBettingConfig as any);

      const result = await setGroupTournamentBettingConfigAction('group-1', 'tournament-1', configPayload);

      expect(mockUpdateGroupTournamentBettingConfig).toHaveBeenCalledWith('betting-1', configPayload);
      expect(mockCreateGroupTournamentBettingConfig).not.toHaveBeenCalled();
      expect(result).toEqual(mockBettingConfig);
    });
  });

  // ---------------------------------------------------------------------------
  // setUserGroupTournamentBettingPaymentAction
  // ---------------------------------------------------------------------------
  describe('setUserGroupTournamentBettingPaymentAction', () => {
    it('throws if user is not authenticated', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);
      await expect(
        setUserGroupTournamentBettingPaymentAction('betting-1', 'user-2', true, 'group-1')
      ).rejects.toThrow('notAuthenticated');
    });

    it('throws if user is not owner or admin', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockUser as any);
      mockFindParticipantsInGroup.mockResolvedValue([nonAdminParticipant] as any);
      await expect(
        setUserGroupTournamentBettingPaymentAction('betting-1', 'user-2', true, 'group-1')
      ).rejects.toThrow('betting.ownerOnly');
    });

    it('sets payment status for valid admin', async () => {
      const result = await setUserGroupTournamentBettingPaymentAction('betting-1', 'user-2', true, 'group-1');

      expect(mockSetUserGroupTournamentBettingPayment).toHaveBeenCalledWith('betting-1', 'user-2', true);
      expect(result).toEqual(mockPayment);
    });
  });
});

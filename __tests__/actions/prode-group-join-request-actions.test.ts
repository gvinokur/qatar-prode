import { vi, describe, it, expect, beforeEach } from 'vitest';
import { testFactories } from '../db/test-factories';

// Mock the auth module to prevent Next-auth module resolution errors
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/app/actions/user-actions', () => ({ getLoggedInUser: vi.fn() }));
vi.mock('@/app/db/prode-group-join-request-repository', () => ({
  createJoinRequest: vi.fn(),
  findJoinRequestsByGroup: vi.fn(),
  findJoinRequestsByUser: vi.fn(),
  findPendingJoinRequest: vi.fn(),
  findRecentRejectedRequest: vi.fn(),
  approveJoinRequest: vi.fn(),
  rejectJoinRequest: vi.fn(),
  cancelJoinRequest: vi.fn(),
  countPendingRequestsForGroup: vi.fn(),
}));
vi.mock('@/app/db/prode-group-repository', () => ({
  findProdeGroupById: vi.fn(),
  findParticipantsInGroup: vi.fn(),
}));
vi.mock('@/app/db/users-repository', () => ({
  findUsersByIds: vi.fn(),
}));
vi.mock('@/app/utils/email', () => ({ sendEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/app/utils/email-templates', () => ({
  generateJoinRequestNotificationEmail: vi.fn().mockResolvedValue({ to: 'admin@test.com', subject: 'New request', html: '<p>test</p>' }),
  generateJoinRequestApprovedEmail: vi.fn().mockResolvedValue({ to: 'user@test.com', subject: 'Approved', html: '<p>test</p>' }),
  generateJoinRequestRejectedEmail: vi.fn().mockResolvedValue({ to: 'user@test.com', subject: 'Rejected', html: '<p>test</p>' }),
}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import * as userActions from '@/app/actions/user-actions';
import * as joinRequestRepository from '@/app/db/prode-group-join-request-repository';
import * as prodeGroupRepository from '@/app/db/prode-group-repository';
import * as usersRepository from '@/app/db/users-repository';
import * as emailUtils from '@/app/utils/email';
import * as emailTemplates from '@/app/utils/email-templates';
import { revalidatePath } from 'next/cache';
import {
  requestToJoinGroup,
  getUserJoinRequests,
  getGroupJoinRequests,
  approveJoinRequestAction,
  rejectJoinRequestAction,
  cancelJoinRequestAction,
  getPendingRequestCount,
} from '@/app/actions/prode-group-join-request-actions';

const mockGetLoggedInUser = vi.mocked(userActions.getLoggedInUser);
const mockCreateJoinRequest = vi.mocked(joinRequestRepository.createJoinRequest);
const mockFindJoinRequestsByGroup = vi.mocked(joinRequestRepository.findJoinRequestsByGroup);
const mockFindJoinRequestsByUser = vi.mocked(joinRequestRepository.findJoinRequestsByUser);
const mockFindPendingJoinRequest = vi.mocked(joinRequestRepository.findPendingJoinRequest);
const mockFindRecentRejectedRequest = vi.mocked(joinRequestRepository.findRecentRejectedRequest);
const mockApproveJoinRequest = vi.mocked(joinRequestRepository.approveJoinRequest);
const mockRejectJoinRequest = vi.mocked(joinRequestRepository.rejectJoinRequest);
const mockCancelJoinRequest = vi.mocked(joinRequestRepository.cancelJoinRequest);
const mockCountPendingRequestsForGroup = vi.mocked(joinRequestRepository.countPendingRequestsForGroup);
const mockFindProdeGroupById = vi.mocked(prodeGroupRepository.findProdeGroupById);
const mockFindParticipantsInGroup = vi.mocked(prodeGroupRepository.findParticipantsInGroup);
const mockFindUsersByIds = vi.mocked(usersRepository.findUsersByIds);
const mockGenerateJoinRequestNotificationEmail = vi.mocked(emailTemplates.generateJoinRequestNotificationEmail);
const mockGenerateJoinRequestApprovedEmail = vi.mocked(emailTemplates.generateJoinRequestApprovedEmail);
const mockGenerateJoinRequestRejectedEmail = vi.mocked(emailTemplates.generateJoinRequestRejectedEmail);
const mockSendEmail = vi.mocked(emailUtils.sendEmail);
const mockRevalidatePath = vi.mocked(revalidatePath);

describe('Prode Group Join Request Actions', () => {
  const mockUser = testFactories.user({ id: 'user-1', email: 'user@test.com', nickname: 'User1' });
  const mockOwner = testFactories.user({ id: 'owner-1', email: 'owner@test.com', nickname: 'Owner' });
  const mockGroup = testFactories.prodeGroup({ id: 'group-1', owner_user_id: 'owner-1', name: 'Test Group' });

  const mockRequest = {
    id: 'request-1',
    group_id: 'group-1',
    user_id: 'user-1',
    status: 'pending' as const,
    request_source: 'invite_link' as const,
    requested_at: new Date('2026-01-15T10:00:00Z'),
    resolved_at: null,
    resolved_by_user_id: null,
  };

  // Participant objects — findParticipantsInGroup returns { user_id, is_admin }
  const nonAdminParticipant = { user_id: 'user-2', prode_group_id: 'group-1', participant_id: 'user-2', is_admin: false };
  const adminParticipant = { user_id: 'user-1', prode_group_id: 'group-1', participant_id: 'user-1', is_admin: true };
  const ownerAsParticipant = { user_id: 'owner-1', prode_group_id: 'group-1', participant_id: 'owner-1', is_admin: false };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default happy-path setup
    mockGetLoggedInUser.mockResolvedValue(mockUser as any);
    mockFindProdeGroupById.mockResolvedValue(mockGroup as any);
    mockFindParticipantsInGroup.mockResolvedValue([nonAdminParticipant] as any);
    mockFindPendingJoinRequest.mockResolvedValue(undefined);
    mockFindRecentRejectedRequest.mockResolvedValue(undefined);
    mockCreateJoinRequest.mockResolvedValue(mockRequest as any);
    mockFindUsersByIds.mockResolvedValue([mockOwner] as any);
    mockApproveJoinRequest.mockResolvedValue(mockRequest as any);
    mockRejectJoinRequest.mockResolvedValue(mockRequest as any);
    mockCancelJoinRequest.mockResolvedValue(undefined);
    mockCountPendingRequestsForGroup.mockResolvedValue(3);
    mockFindJoinRequestsByGroup.mockResolvedValue([] as any);
    mockFindJoinRequestsByUser.mockResolvedValue([] as any);
    mockGenerateJoinRequestNotificationEmail.mockResolvedValue({ to: 'admin@test.com', subject: 'New request', html: '<p>test</p>' });
    mockGenerateJoinRequestApprovedEmail.mockResolvedValue({ to: 'user@test.com', subject: 'Approved', html: '<p>test</p>' });
    mockGenerateJoinRequestRejectedEmail.mockResolvedValue({ to: 'user@test.com', subject: 'Rejected', html: '<p>test</p>' });
    mockSendEmail.mockResolvedValue(undefined);
  });

  // ---------------------------------------------------------------------------
  // requestToJoinGroup
  // ---------------------------------------------------------------------------
  describe('requestToJoinGroup', () => {
    it('throws if user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);
      await expect(requestToJoinGroup('group-1')).rejects.toThrow(
        'Should not call this action from a logged out page'
      );
    });

    it('throws if group is not found', async () => {
      mockFindProdeGroupById.mockResolvedValue(undefined);
      await expect(requestToJoinGroup('group-1')).rejects.toThrow('Group not found');
    });

    it('throws if user is the group owner', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
      await expect(requestToJoinGroup('group-1')).rejects.toThrow(
        'You are the owner of this group'
      );
    });

    it('throws if user is already a member', async () => {
      // Current user is in the participants list
      mockFindParticipantsInGroup.mockResolvedValue([
        { user_id: 'user-1', prode_group_id: 'group-1', participant_id: 'user-1', is_admin: false },
      ] as any);
      await expect(requestToJoinGroup('group-1')).rejects.toThrow(
        'You are already a member of this group'
      );
    });

    it('throws if user already has a pending request', async () => {
      mockFindPendingJoinRequest.mockResolvedValue(mockRequest as any);
      await expect(requestToJoinGroup('group-1')).rejects.toThrow(
        'You already have a pending request for this group'
      );
    });

    it('throws with eligible date when rejection cooldown is active', async () => {
      // Rejection was 3 days ago → cooldown still active (7 days total)
      const rejectedAt = new Date();
      rejectedAt.setDate(rejectedAt.getDate() - 3);
      mockFindRecentRejectedRequest.mockResolvedValue({
        ...mockRequest,
        status: 'rejected',
        resolved_at: rejectedAt,
      } as any);

      await expect(requestToJoinGroup('group-1', 'invite_link', 'en')).rejects.toThrow(
        /You can request to join again on/
      );
    });

    it('does NOT throw when rejection cooldown has already expired', async () => {
      // Rejection was 8 days ago → cooldown has expired
      const rejectedAt = new Date();
      rejectedAt.setDate(rejectedAt.getDate() - 8);
      mockFindRecentRejectedRequest.mockResolvedValue({
        ...mockRequest,
        status: 'rejected',
        resolved_at: rejectedAt,
      } as any);

      const result = await requestToJoinGroup('group-1');
      expect(result).toEqual({ success: true, message: 'Join request submitted successfully' });
    });

    it('succeeds and creates the join request', async () => {
      const result = await requestToJoinGroup('group-1');

      expect(mockCreateJoinRequest).toHaveBeenCalledWith('group-1', 'user-1', 'invite_link', undefined);
      expect(result).toEqual({ success: true, message: 'Join request submitted successfully' });
    });

    it('passes message to createJoinRequest when provided', async () => {
      await requestToJoinGroup('group-1', 'invite_link', 'es', undefined, 'Hey, I know you from the gym!');

      expect(mockCreateJoinRequest).toHaveBeenCalledWith('group-1', 'user-1', 'invite_link', 'Hey, I know you from the gym!');
    });

    it('passes undefined to createJoinRequest when message is empty string', async () => {
      await requestToJoinGroup('group-1', 'invite_link', 'es', undefined, '');

      expect(mockCreateJoinRequest).toHaveBeenCalledWith('group-1', 'user-1', 'invite_link', undefined);
    });

    it('passes undefined to createJoinRequest when message is whitespace only', async () => {
      await requestToJoinGroup('group-1', 'invite_link', 'es', undefined, '   ');

      expect(mockCreateJoinRequest).toHaveBeenCalledWith('group-1', 'user-1', 'invite_link', undefined);
    });

    it('passes message to email notification when provided', async () => {
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockFindUsersByIds.mockResolvedValue([mockOwner] as any);

      await requestToJoinGroup('group-1', 'invite_link', 'en', undefined, 'Hello from the gym!');

      await vi.runAllTimersAsync().catch(() => {});

      expect(mockGenerateJoinRequestNotificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.objectContaining({ message: 'Hello from the gym!' })
      );
    });

    it('throws Zod error when message exceeds 300 characters', async () => {
      const longMessage = 'a'.repeat(301);
      await expect(
        requestToJoinGroup('group-1', 'invite_link', 'es', undefined, longMessage)
      ).rejects.toThrow();
    });

    it('accepts message of exactly 300 characters', async () => {
      const exactMessage = 'a'.repeat(300);
      const result = await requestToJoinGroup('group-1', 'invite_link', 'es', undefined, exactMessage);

      expect(mockCreateJoinRequest).toHaveBeenCalledWith('group-1', 'user-1', 'invite_link', exactMessage);
      expect(result).toEqual({ success: true, message: 'Join request submitted successfully' });
    });

    it('sends notification email to owner when request is created', async () => {
      // Owner is not a participant — admins list is empty, so only owner gets the email
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockFindUsersByIds.mockResolvedValue([mockOwner] as any);

      await requestToJoinGroup('group-1');

      // Allow fire-and-forget promises to settle
      await vi.runAllTimersAsync().catch(() => {});

      expect(mockFindUsersByIds).toHaveBeenCalledWith(['owner-1']);
      expect(mockGenerateJoinRequestNotificationEmail).toHaveBeenCalled();
    });

    it('sends notification emails to owner and admins when admins exist', async () => {
      const adminUser = testFactories.user({ id: 'admin-1', email: 'admin@test.com', nickname: 'Admin' });
      mockFindParticipantsInGroup.mockResolvedValue([
        { user_id: 'admin-1', prode_group_id: 'group-1', participant_id: 'admin-1', is_admin: true },
      ] as any);
      mockFindUsersByIds.mockResolvedValue([mockOwner, adminUser] as any);

      await requestToJoinGroup('group-1');

      // Should include owner + admin IDs (deduped)
      expect(mockFindUsersByIds).toHaveBeenCalledWith(['owner-1', 'admin-1']);
    });

    it('includes tournament path in groupUrl when tournamentId is provided', async () => {
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockFindUsersByIds.mockResolvedValue([mockOwner] as any);

      await requestToJoinGroup('group-1', 'invite_link', 'en', 'tournament-1');

      await vi.runAllTimersAsync().catch(() => {});

      // Verify generateJoinRequestNotificationEmail was called with a URL containing the tournament path
      expect(mockGenerateJoinRequestNotificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.stringContaining('tournaments/tournament-1/friend-groups/group-1'),
        expect.objectContaining({ locale: expect.any(String) })
      );
    });

    it('uses non-tournament groupUrl when tournamentId is not provided', async () => {
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockFindUsersByIds.mockResolvedValue([mockOwner] as any);

      await requestToJoinGroup('group-1', 'invite_link', 'en');

      await vi.runAllTimersAsync().catch(() => {});

      expect(mockGenerateJoinRequestNotificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.stringContaining('friend-groups/group-1'),
        expect.objectContaining({ locale: expect.any(String) })
      );
      expect(mockGenerateJoinRequestNotificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.not.stringContaining('tournaments'),
        expect.objectContaining({ locale: expect.any(String) })
      );
    });

    it('deduplicates admin user IDs when owner is also in participants list', async () => {
      // Owner is also listed as a participant (edge case)
      mockFindParticipantsInGroup.mockResolvedValue([
        ownerAsParticipant,
      ] as any);
      mockFindUsersByIds.mockResolvedValue([mockOwner] as any);

      await requestToJoinGroup('group-1');

      // Despite owner appearing twice (once as owner_user_id, once as participant),
      // findUsersByIds should be called with a deduplicated list
      const calledWith = mockFindUsersByIds.mock.calls[0][0];
      const uniqueIds = [...new Set(calledWith)];
      expect(calledWith).toEqual(uniqueIds);
    });
  });

  // ---------------------------------------------------------------------------
  // getUserJoinRequests
  // ---------------------------------------------------------------------------
  describe('getUserJoinRequests', () => {
    it('returns an empty array when user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);
      const result = await getUserJoinRequests();
      expect(result).toEqual([]);
    });

    it('returns pending requests', async () => {
      const pendingRequest = {
        ...mockRequest,
        status: 'pending',
        resolved_at: null,
      };
      mockFindJoinRequestsByUser.mockResolvedValue([pendingRequest] as any);

      const result = await getUserJoinRequests();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('pending');
    });

    it('returns resolved requests that were resolved within the last 30 days', async () => {
      const recentlyResolved = new Date();
      recentlyResolved.setDate(recentlyResolved.getDate() - 10); // 10 days ago

      const recentRequest = {
        ...mockRequest,
        status: 'approved',
        resolved_at: recentlyResolved,
      };
      mockFindJoinRequestsByUser.mockResolvedValue([recentRequest] as any);

      const result = await getUserJoinRequests();

      expect(result).toHaveLength(1);
    });

    it('filters out resolved requests older than 30 days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31); // 31 days ago

      const oldRequest = {
        ...mockRequest,
        status: 'approved',
        resolved_at: oldDate,
      };
      mockFindJoinRequestsByUser.mockResolvedValue([oldRequest] as any);

      const result = await getUserJoinRequests();

      expect(result).toHaveLength(0);
    });

    it('returns mix of pending and recent resolved, excludes old resolved', async () => {
      const thirtyOneDaysAgo = new Date();
      thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);

      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      const requests = [
        { ...mockRequest, id: 'req-1', status: 'pending', resolved_at: null },
        { ...mockRequest, id: 'req-2', status: 'approved', resolved_at: fiveDaysAgo },
        { ...mockRequest, id: 'req-3', status: 'rejected', resolved_at: thirtyOneDaysAgo },
      ];
      mockFindJoinRequestsByUser.mockResolvedValue(requests as any);

      const result = await getUserJoinRequests();

      expect(result).toHaveLength(2);
      const ids = result.map(r => r.id);
      expect(ids).toContain('req-1');
      expect(ids).toContain('req-2');
      expect(ids).not.toContain('req-3');
    });

    it('calls findJoinRequestsByUser with the logged-in user id', async () => {
      mockFindJoinRequestsByUser.mockResolvedValue([]);

      await getUserJoinRequests();

      expect(mockFindJoinRequestsByUser).toHaveBeenCalledWith('user-1');
    });
  });

  // ---------------------------------------------------------------------------
  // getGroupJoinRequests
  // ---------------------------------------------------------------------------
  describe('getGroupJoinRequests', () => {
    it('throws if user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);
      await expect(getGroupJoinRequests('group-1')).rejects.toThrow(
        'Should not call this action from a logged out page'
      );
    });

    it('throws if group is not found', async () => {
      mockFindProdeGroupById.mockResolvedValue(undefined);
      await expect(getGroupJoinRequests('group-1')).rejects.toThrow('Group not found');
    });

    it('throws if user is neither owner nor admin', async () => {
      // mockUser (user-1) is not owner-1 and is not an admin
      mockFindParticipantsInGroup.mockResolvedValue([nonAdminParticipant] as any);
      // mockUser.id = 'user-1', nonAdminParticipant.user_id = 'user-2' → not found → isAdmin undefined
      await expect(getGroupJoinRequests('group-1')).rejects.toThrow(
        'Only group owner or admins can view join requests'
      );
    });

    it('throws if user is a non-admin participant (not owner)', async () => {
      // user-1 is a participant but not admin
      mockFindParticipantsInGroup.mockResolvedValue([
        { user_id: 'user-1', prode_group_id: 'group-1', participant_id: 'user-1', is_admin: false },
      ] as any);
      await expect(getGroupJoinRequests('group-1')).rejects.toThrow(
        'Only group owner or admins can view join requests'
      );
    });

    it('returns pending requests and recently-rejected requests if user is owner', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
      mockFindParticipantsInGroup.mockResolvedValue([] as any);

      const recentlyRejectedAt = new Date();
      recentlyRejectedAt.setDate(recentlyRejectedAt.getDate() - 2); // 2 days ago

      const oldRejectedAt = new Date();
      oldRejectedAt.setDate(oldRejectedAt.getDate() - 8); // 8 days ago

      const pendingReq = { ...mockRequest, id: 'req-pending', status: 'pending', resolved_at: null };
      const recentRejectedReq = { ...mockRequest, id: 'req-recent-rej', status: 'rejected', resolved_at: recentlyRejectedAt };
      const oldRejectedReq = { ...mockRequest, id: 'req-old-rej', status: 'rejected', resolved_at: oldRejectedAt };

      mockFindJoinRequestsByGroup.mockImplementation(async (_groupId, status) => {
        if (status === 'pending') return [pendingReq] as any;
        if (status === 'rejected') return [recentRejectedReq, oldRejectedReq] as any;
        return [];
      });

      const result = await getGroupJoinRequests('group-1');

      const ids = result.map(r => r.id);
      expect(ids).toContain('req-pending');
      expect(ids).toContain('req-recent-rej');
      expect(ids).not.toContain('req-old-rej');
    });

    it('returns pending requests and recently-rejected requests if user is admin', async () => {
      // user-1 is an admin (not owner)
      mockFindParticipantsInGroup.mockResolvedValue([adminParticipant] as any);

      const recentlyRejectedAt = new Date();
      recentlyRejectedAt.setDate(recentlyRejectedAt.getDate() - 1); // 1 day ago

      const pendingReq = { ...mockRequest, id: 'req-pending', status: 'pending', resolved_at: null };
      const recentRejectedReq = { ...mockRequest, id: 'req-recent-rej', status: 'rejected', resolved_at: recentlyRejectedAt };

      mockFindJoinRequestsByGroup.mockImplementation(async (_groupId, status) => {
        if (status === 'pending') return [pendingReq] as any;
        if (status === 'rejected') return [recentRejectedReq] as any;
        return [];
      });

      const result = await getGroupJoinRequests('group-1');

      const ids = result.map(r => r.id);
      expect(ids).toContain('req-pending');
      expect(ids).toContain('req-recent-rej');
    });

    it('returns only pending when there are no recently-rejected requests', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
      mockFindParticipantsInGroup.mockResolvedValue([] as any);

      const pendingReq = { ...mockRequest, id: 'req-pending', status: 'pending', resolved_at: null };

      mockFindJoinRequestsByGroup.mockImplementation(async (_groupId, status) => {
        if (status === 'pending') return [pendingReq] as any;
        if (status === 'rejected') return [] as any;
        return [];
      });

      const result = await getGroupJoinRequests('group-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('req-pending');
    });

    it('returns empty array when there are no pending or recently-rejected requests', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockFindJoinRequestsByGroup.mockResolvedValue([] as any);

      const result = await getGroupJoinRequests('group-1');

      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // approveJoinRequestAction
  // ---------------------------------------------------------------------------
  describe('approveJoinRequestAction', () => {
    it('throws if user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);
      await expect(approveJoinRequestAction('request-1', 'group-1')).rejects.toThrow(
        'Should not call this action from a logged out page'
      );
    });

    it('throws if group is not found', async () => {
      mockFindProdeGroupById.mockResolvedValue(undefined);
      await expect(approveJoinRequestAction('request-1', 'group-1')).rejects.toThrow(
        'Group not found'
      );
    });

    it('throws if user is not owner or admin', async () => {
      // user-1 is a non-admin participant
      mockFindParticipantsInGroup.mockResolvedValue([
        { user_id: 'user-1', prode_group_id: 'group-1', participant_id: 'user-1', is_admin: false },
      ] as any);
      await expect(approveJoinRequestAction('request-1', 'group-1')).rejects.toThrow(
        'Only group owner or admins can approve join requests'
      );
    });

    it('succeeds as owner: calls approveJoinRequest and revalidatePath', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockFindUsersByIds.mockResolvedValue([mockUser] as any);

      const result = await approveJoinRequestAction('request-1', 'group-1');

      expect(mockApproveJoinRequest).toHaveBeenCalledWith('request-1', 'owner-1');
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        `/tournaments/[tournament_id]/friend-groups/group-1`
      );
      expect(result).toEqual(expect.objectContaining({ success: true, message: 'Join request approved' }));
    });

    it('succeeds as admin: calls approveJoinRequest and revalidatePath', async () => {
      // user-1 is admin
      mockFindParticipantsInGroup.mockResolvedValue([adminParticipant] as any);
      mockFindUsersByIds.mockResolvedValue([mockUser] as any);

      const result = await approveJoinRequestAction('request-1', 'group-1');

      expect(mockApproveJoinRequest).toHaveBeenCalledWith('request-1', 'user-1');
      expect(mockRevalidatePath).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ success: true, message: 'Join request approved' }));
    });

    it('sends approval email to the requester (fire-and-forget)', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockFindUsersByIds.mockResolvedValue([mockUser] as any);

      await approveJoinRequestAction('request-1', 'group-1');

      await vi.runAllTimersAsync().catch(() => {});

      expect(mockFindUsersByIds).toHaveBeenCalledWith(['user-1']);
      expect(mockGenerateJoinRequestApprovedEmail).toHaveBeenCalled();
    });

    it('includes tournament path in groupUrl for approval email when tournamentId is provided', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockFindUsersByIds.mockResolvedValue([mockUser] as any);

      await approveJoinRequestAction('request-1', 'group-1', 'tournament-99');

      await vi.runAllTimersAsync().catch(() => {});

      expect(mockGenerateJoinRequestApprovedEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.stringContaining('tournaments/tournament-99/friend-groups/group-1'),
        expect.any(String)
      );
    });

    it('does not send email when requester user is not found', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockFindUsersByIds.mockResolvedValue([] as any);

      await approveJoinRequestAction('request-1', 'group-1');

      expect(mockGenerateJoinRequestApprovedEmail).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // rejectJoinRequestAction
  // ---------------------------------------------------------------------------
  describe('rejectJoinRequestAction', () => {
    it('throws if user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);
      await expect(rejectJoinRequestAction('request-1', 'group-1')).rejects.toThrow(
        'Should not call this action from a logged out page'
      );
    });

    it('throws if group is not found', async () => {
      mockFindProdeGroupById.mockResolvedValue(undefined);
      await expect(rejectJoinRequestAction('request-1', 'group-1')).rejects.toThrow(
        'Group not found'
      );
    });

    it('throws if user is not owner or admin', async () => {
      // user-1 is a non-admin participant
      mockFindParticipantsInGroup.mockResolvedValue([
        { user_id: 'user-1', prode_group_id: 'group-1', participant_id: 'user-1', is_admin: false },
      ] as any);
      await expect(rejectJoinRequestAction('request-1', 'group-1')).rejects.toThrow(
        'Only group owner or admins can reject join requests'
      );
    });

    it('succeeds as owner: calls rejectJoinRequest and revalidatePath', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockFindUsersByIds.mockResolvedValue([mockUser] as any);

      const result = await rejectJoinRequestAction('request-1', 'group-1');

      expect(mockRejectJoinRequest).toHaveBeenCalledWith('request-1', 'owner-1');
      expect(mockRevalidatePath).toHaveBeenCalledWith(
        `/tournaments/[tournament_id]/friend-groups/group-1`
      );
      expect(result).toEqual({ success: true, message: 'Join request rejected' });
    });

    it('succeeds as admin: calls rejectJoinRequest and revalidatePath', async () => {
      // user-1 is admin
      mockFindParticipantsInGroup.mockResolvedValue([adminParticipant] as any);
      mockFindUsersByIds.mockResolvedValue([mockUser] as any);

      const result = await rejectJoinRequestAction('request-1', 'group-1');

      expect(mockRejectJoinRequest).toHaveBeenCalledWith('request-1', 'user-1');
      expect(mockRevalidatePath).toHaveBeenCalled();
      expect(result).toEqual({ success: true, message: 'Join request rejected' });
    });

    it('sends rejection email to the requester (fire-and-forget)', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockFindUsersByIds.mockResolvedValue([mockUser] as any);

      await rejectJoinRequestAction('request-1', 'group-1');

      await vi.runAllTimersAsync().catch(() => {});

      expect(mockFindUsersByIds).toHaveBeenCalledWith(['user-1']);
      expect(mockGenerateJoinRequestRejectedEmail).toHaveBeenCalled();
    });

    it('does not send email when requester user is not found', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockFindUsersByIds.mockResolvedValue([] as any);

      await rejectJoinRequestAction('request-1', 'group-1');

      expect(mockGenerateJoinRequestRejectedEmail).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // cancelJoinRequestAction
  // ---------------------------------------------------------------------------
  describe('cancelJoinRequestAction', () => {
    it('throws if user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);
      await expect(cancelJoinRequestAction('request-1')).rejects.toThrow(
        'Should not call this action from a logged out page'
      );
    });

    it('succeeds: calls cancelJoinRequest with requestId and userId', async () => {
      const result = await cancelJoinRequestAction('request-1');

      expect(mockCancelJoinRequest).toHaveBeenCalledWith('request-1', 'user-1');
      expect(result).toEqual({ success: true, message: 'Join request cancelled' });
    });

    it('passes the correct user id from the logged-in session', async () => {
      const anotherUser = testFactories.user({ id: 'another-user', email: 'another@test.com' });
      mockGetLoggedInUser.mockResolvedValue(anotherUser as any);

      await cancelJoinRequestAction('request-99');

      expect(mockCancelJoinRequest).toHaveBeenCalledWith('request-99', 'another-user');
    });
  });

  // ---------------------------------------------------------------------------
  // getPendingRequestCount
  // ---------------------------------------------------------------------------
  describe('getPendingRequestCount', () => {
    it('returns 0 if user is not logged in', async () => {
      mockGetLoggedInUser.mockResolvedValue(undefined);
      const result = await getPendingRequestCount('group-1');
      expect(result).toBe(0);
    });

    it('returns 0 if group is not found', async () => {
      mockFindProdeGroupById.mockResolvedValue(undefined);
      const result = await getPendingRequestCount('group-1');
      expect(result).toBe(0);
    });

    it('returns 0 if user is not owner or admin', async () => {
      // user-1 is a non-admin participant
      mockFindParticipantsInGroup.mockResolvedValue([
        { user_id: 'user-1', prode_group_id: 'group-1', participant_id: 'user-1', is_admin: false },
      ] as any);
      const result = await getPendingRequestCount('group-1');
      expect(result).toBe(0);
    });

    it('returns 0 if user is not in the group at all (and is not owner)', async () => {
      mockFindParticipantsInGroup.mockResolvedValue([nonAdminParticipant] as any);
      // mockUser (user-1) is not in participants (only user-2 is) and is not owner (owner-1)
      const result = await getPendingRequestCount('group-1');
      expect(result).toBe(0);
    });

    it('returns the count if user is the group owner', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockCountPendingRequestsForGroup.mockResolvedValue(5);

      const result = await getPendingRequestCount('group-1');

      expect(mockCountPendingRequestsForGroup).toHaveBeenCalledWith('group-1');
      expect(result).toBe(5);
    });

    it('returns the count if user is a group admin', async () => {
      // user-1 is admin
      mockFindParticipantsInGroup.mockResolvedValue([adminParticipant] as any);
      mockCountPendingRequestsForGroup.mockResolvedValue(2);

      const result = await getPendingRequestCount('group-1');

      expect(mockCountPendingRequestsForGroup).toHaveBeenCalledWith('group-1');
      expect(result).toBe(2);
    });

    it('returns 0 count when there are no pending requests', async () => {
      mockGetLoggedInUser.mockResolvedValue(mockOwner as any);
      mockFindParticipantsInGroup.mockResolvedValue([] as any);
      mockCountPendingRequestsForGroup.mockResolvedValue(0);

      const result = await getPendingRequestCount('group-1');

      expect(result).toBe(0);
    });
  });
});

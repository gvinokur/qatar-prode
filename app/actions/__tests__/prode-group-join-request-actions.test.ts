import { describe, it, expect, vi, beforeEach } from 'vitest';
import { approveJoinRequestAction } from '../prode-group-join-request-actions';

vi.mock('../user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

vi.mock('../../db/prode-group-join-request-repository', () => ({
  approveJoinRequest: vi.fn(),
}));

vi.mock('../../db/prode-group-repository', () => ({
  findProdeGroupById: vi.fn(),
  findParticipantsInGroup: vi.fn(),
}));

vi.mock('../../db/users-repository', () => ({
  findUsersByIds: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('../../utils/email', () => ({
  sendEmail: vi.fn(),
}));

vi.mock('../../utils/email-templates', () => ({
  generateJoinRequestApprovedEmail: vi.fn(),
  generateJoinRequestNotificationEmail: vi.fn(),
  generateJoinRequestRejectedEmail: vi.fn(),
}));

import { getLoggedInUser } from '../user-actions';
import { approveJoinRequest } from '../../db/prode-group-join-request-repository';
import { findProdeGroupById, findParticipantsInGroup } from '../../db/prode-group-repository';
import { findUsersByIds } from '../../db/users-repository';
import { generateJoinRequestApprovedEmail } from '../../utils/email-templates';
import { testFactories } from '../../../__tests__/db/test-factories';

describe('approveJoinRequestAction - Analytics Event', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return success response with analyticsEvent when join request is approved', async () => {
    const adminUser = testFactories.user({ id: 'admin-user-id', nickname: 'Admin' });
    const requesterUser = testFactories.user({ id: 'requester-id', email: 'requester@example.com' });
    const group = testFactories.prodeGroup({ id: 'group-id', owner_user_id: 'admin-user-id', name: 'Test Group' });

    vi.mocked(getLoggedInUser).mockResolvedValue(adminUser);
    vi.mocked(findProdeGroupById).mockResolvedValue(group);
    vi.mocked(findParticipantsInGroup).mockResolvedValue([]);
    vi.mocked(approveJoinRequest).mockResolvedValue({ user_id: requesterUser.id });
    vi.mocked(findUsersByIds).mockResolvedValue([requesterUser]);
    vi.mocked(generateJoinRequestApprovedEmail).mockResolvedValue({ to: requesterUser.email, subject: 'Approved' } as never);

    const result = await approveJoinRequestAction('request-id', 'group-id');

    expect(result).toEqual({
      success: true,
      message: 'Join request approved',
      analyticsEvent: expect.objectContaining({
        name: 'group_joined',
        params: expect.any(Object),
      }),
    });
  });

  it('should include analyticsEvent.name as group_joined', async () => {
    const adminUser = testFactories.user({ id: 'admin-user-id' });
    const requesterUser = testFactories.user({ id: 'requester-id' });
    const group = testFactories.prodeGroup({ owner_user_id: 'admin-user-id' });

    vi.mocked(getLoggedInUser).mockResolvedValue(adminUser);
    vi.mocked(findProdeGroupById).mockResolvedValue(group);
    vi.mocked(findParticipantsInGroup).mockResolvedValue([]);
    vi.mocked(approveJoinRequest).mockResolvedValue({ user_id: requesterUser.id });
    vi.mocked(findUsersByIds).mockResolvedValue([requesterUser]);
    vi.mocked(generateJoinRequestApprovedEmail).mockResolvedValue({ to: requesterUser.email } as never);

    const result = await approveJoinRequestAction('request-id', 'group-id');

    expect(result.analyticsEvent?.name).toBe('group_joined');
  });

  it('should include group_id in analyticsEvent params', async () => {
    const adminUser = testFactories.user({ id: 'admin-user-id' });
    const requesterUser = testFactories.user({ id: 'requester-id' });
    const group = testFactories.prodeGroup({ id: 'my-group-id', owner_user_id: 'admin-user-id' });

    vi.mocked(getLoggedInUser).mockResolvedValue(adminUser);
    vi.mocked(findProdeGroupById).mockResolvedValue(group);
    vi.mocked(findParticipantsInGroup).mockResolvedValue([]);
    vi.mocked(approveJoinRequest).mockResolvedValue({ user_id: requesterUser.id });
    vi.mocked(findUsersByIds).mockResolvedValue([requesterUser]);
    vi.mocked(generateJoinRequestApprovedEmail).mockResolvedValue({ to: requesterUser.email } as never);

    const result = await approveJoinRequestAction('request-id', 'my-group-id');

    expect(result.analyticsEvent?.params.group_id).toBe('my-group-id');
  });

  it('should include tournament_id in analyticsEvent params when provided', async () => {
    const adminUser = testFactories.user({ id: 'admin-user-id' });
    const requesterUser = testFactories.user({ id: 'requester-id' });
    const group = testFactories.prodeGroup({ id: 'group-id', owner_user_id: 'admin-user-id' });

    vi.mocked(getLoggedInUser).mockResolvedValue(adminUser);
    vi.mocked(findProdeGroupById).mockResolvedValue(group);
    vi.mocked(findParticipantsInGroup).mockResolvedValue([]);
    vi.mocked(approveJoinRequest).mockResolvedValue({ user_id: requesterUser.id });
    vi.mocked(findUsersByIds).mockResolvedValue([requesterUser]);
    vi.mocked(generateJoinRequestApprovedEmail).mockResolvedValue({ to: requesterUser.email } as never);

    const result = await approveJoinRequestAction('request-id', 'group-id', 'tournament-123');

    expect(result.analyticsEvent?.params.tournament_id).toBe('tournament-123');
  });

  it('should include tournament_id in analyticsEvent params even when undefined', async () => {
    const adminUser = testFactories.user({ id: 'admin-user-id' });
    const requesterUser = testFactories.user({ id: 'requester-id' });
    const group = testFactories.prodeGroup({ id: 'group-id', owner_user_id: 'admin-user-id' });

    vi.mocked(getLoggedInUser).mockResolvedValue(adminUser);
    vi.mocked(findProdeGroupById).mockResolvedValue(group);
    vi.mocked(findParticipantsInGroup).mockResolvedValue([]);
    vi.mocked(approveJoinRequest).mockResolvedValue({ user_id: requesterUser.id });
    vi.mocked(findUsersByIds).mockResolvedValue([requesterUser]);
    vi.mocked(generateJoinRequestApprovedEmail).mockResolvedValue({ to: requesterUser.email } as never);

    const result = await approveJoinRequestAction('request-id', 'group-id');

    expect(result.analyticsEvent?.params).toHaveProperty('tournament_id');
    expect(result.analyticsEvent?.params.tournament_id).toBeUndefined();
  });
});

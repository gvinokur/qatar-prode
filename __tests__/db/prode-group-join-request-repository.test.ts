import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  createJoinRequest,
  findJoinRequestsByGroup,
  findJoinRequestsByUser,
  findPendingJoinRequest,
  findRecentRejectedRequest,
  approveJoinRequest,
  rejectJoinRequest,
  cancelJoinRequest,
  countPendingRequestsForGroup,
} from '../../app/db/prode-group-join-request-repository';
import {
  createMockSelectQuery,
  createMockInsertQuery,
  createMockUpdateQuery,
  createMockDeleteQuery,
  createMockNullQuery,
  createMockErrorQuery,
} from './mock-helpers';

// Use vi.hoisted so mockDb is available inside vi.mock factory
const mockDb = vi.hoisted(() => ({
  selectFrom: vi.fn(),
  insertInto: vi.fn(),
  updateTable: vi.fn(),
  deleteFrom: vi.fn(),
}));

vi.mock('../../app/db/database', () => ({ db: mockDb }));

// Mock react cache to just pass the function through
vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return { ...actual, cache: (fn: Function) => fn };
});

describe('Prode Group Join Request Repository', () => {
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

  const mockApprovedRequest = {
    ...mockRequest,
    id: 'request-1',
    status: 'approved' as const,
    resolved_at: new Date('2026-01-16T10:00:00Z'),
    resolved_by_user_id: 'admin-1',
  };

  const mockRejectedRequest = {
    ...mockRequest,
    id: 'request-1',
    status: 'rejected' as const,
    resolved_at: new Date('2026-01-16T10:00:00Z'),
    resolved_by_user_id: 'admin-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createJoinRequest', () => {
    it('should insert with correct values and return created request', async () => {
      const mockQuery = createMockInsertQuery(mockRequest);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      const result = await createJoinRequest('group-1', 'user-1', 'invite_link');

      expect(mockDb.insertInto).toHaveBeenCalledWith('prode_group_join_requests');
      expect(mockQuery.values).toHaveBeenCalledWith({
        group_id: 'group-1',
        user_id: 'user-1',
        status: 'pending',
        request_source: 'invite_link',
      });
      expect(mockQuery.returningAll).toHaveBeenCalled();
      expect(mockQuery.executeTakeFirstOrThrow).toHaveBeenCalled();
      expect(result).toEqual(mockRequest);
    });

    it('should default request_source to invite_link when not provided', async () => {
      const mockQuery = createMockInsertQuery(mockRequest);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      await createJoinRequest('group-1', 'user-1');

      expect(mockQuery.values).toHaveBeenCalledWith(
        expect.objectContaining({ request_source: 'invite_link' })
      );
    });

    it('should use the provided source when specified', async () => {
      const manualRequest = { ...mockRequest, request_source: 'manual' as const };
      const mockQuery = createMockInsertQuery(manualRequest);
      mockDb.insertInto.mockReturnValue(mockQuery as any);

      await createJoinRequest('group-1', 'user-1', 'manual');

      expect(mockQuery.values).toHaveBeenCalledWith(
        expect.objectContaining({ request_source: 'manual' })
      );
    });
  });

  describe('findJoinRequestsByGroup', () => {
    const mockRequestWithUser = {
      ...mockRequest,
      user_nickname: 'TestUser',
      user_email: 'test@example.com',
    };

    it('should find all requests for a group without status filter', async () => {
      const mockQuery = createMockSelectQuery([mockRequestWithUser]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findJoinRequestsByGroup('group-1');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('prode_group_join_requests');
      expect(mockQuery.leftJoin).toHaveBeenCalledWith(
        'users',
        'users.id',
        'prode_group_join_requests.user_id'
      );
      expect(mockQuery.where).toHaveBeenCalledWith(
        'prode_group_join_requests.group_id',
        '=',
        'group-1'
      );
      expect(mockQuery.orderBy).toHaveBeenCalledWith(
        'prode_group_join_requests.requested_at',
        'desc'
      );
      expect(mockQuery.execute).toHaveBeenCalled();
      expect(result).toEqual([mockRequestWithUser]);
    });

    it('should apply status filter when status is provided', async () => {
      const mockQuery = createMockSelectQuery([mockRequestWithUser]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await findJoinRequestsByGroup('group-1', 'pending');

      expect(mockQuery.where).toHaveBeenCalledWith(
        'prode_group_join_requests.group_id',
        '=',
        'group-1'
      );
      expect(mockQuery.where).toHaveBeenCalledWith(
        'prode_group_join_requests.status',
        '=',
        'pending'
      );
    });

    it('should not apply status filter when status is not provided', async () => {
      const mockQuery = createMockSelectQuery([mockRequestWithUser]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await findJoinRequestsByGroup('group-1');

      // where should only be called once (for group_id), not for status
      const whereCalls = mockQuery.where.mock.calls;
      const statusFilterCall = whereCalls.find(
        (call: any[]) => call[0] === 'prode_group_join_requests.status'
      );
      expect(statusFilterCall).toBeUndefined();
    });

    it('should return empty array when no requests exist for group', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findJoinRequestsByGroup('empty-group');

      expect(result).toEqual([]);
    });
  });

  describe('findJoinRequestsByUser', () => {
    const mockRequestWithGroup = {
      ...mockRequest,
      group_name: 'Test Group',
      group_theme: null,
      member_count: '5',
    };

    it('should find all requests for a user without status filter', async () => {
      const mockQuery = createMockSelectQuery([mockRequestWithGroup]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findJoinRequestsByUser('user-1');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('prode_group_join_requests');
      expect(mockQuery.leftJoin).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalledWith(
        'prode_group_join_requests.user_id',
        '=',
        'user-1'
      );
      expect(mockQuery.orderBy).toHaveBeenCalledWith(
        'prode_group_join_requests.requested_at',
        'desc'
      );
      expect(mockQuery.execute).toHaveBeenCalled();
      expect(result).toEqual([mockRequestWithGroup]);
    });

    it('should apply status filter when status is provided', async () => {
      const mockQuery = createMockSelectQuery([mockRequestWithGroup]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await findJoinRequestsByUser('user-1', 'pending');

      expect(mockQuery.where).toHaveBeenCalledWith(
        'prode_group_join_requests.user_id',
        '=',
        'user-1'
      );
      expect(mockQuery.where).toHaveBeenCalledWith(
        'prode_group_join_requests.status',
        '=',
        'pending'
      );
    });

    it('should not apply status filter when status is not provided', async () => {
      const mockQuery = createMockSelectQuery([mockRequestWithGroup]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await findJoinRequestsByUser('user-1');

      const whereCalls = mockQuery.where.mock.calls;
      const statusFilterCall = whereCalls.find(
        (call: any[]) => call[0] === 'prode_group_join_requests.status'
      );
      expect(statusFilterCall).toBeUndefined();
    });

    it('should return empty array when user has no requests', async () => {
      const mockQuery = createMockSelectQuery([]);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findJoinRequestsByUser('user-with-no-requests');

      expect(result).toEqual([]);
    });
  });

  describe('findPendingJoinRequest', () => {
    it('should return the pending request when found', async () => {
      const mockQuery = createMockSelectQuery(mockRequest);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findPendingJoinRequest('group-1', 'user-1');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('prode_group_join_requests');
      expect(mockQuery.selectAll).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalledWith('group_id', '=', 'group-1');
      expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
      expect(mockQuery.where).toHaveBeenCalledWith('status', '=', 'pending');
      expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
      expect(result).toEqual(mockRequest);
    });

    it('should return null when no pending request exists', async () => {
      const mockQuery = createMockNullQuery();
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findPendingJoinRequest('group-1', 'user-with-no-request');

      expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('findRecentRejectedRequest', () => {
    it('should return recent rejected request when found within 7 days', async () => {
      const mockQuery = createMockSelectQuery(mockRejectedRequest);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findRecentRejectedRequest('group-1', 'user-1');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('prode_group_join_requests');
      expect(mockQuery.selectAll).toHaveBeenCalled();
      expect(mockQuery.where).toHaveBeenCalledWith('group_id', '=', 'group-1');
      expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
      expect(mockQuery.where).toHaveBeenCalledWith('status', '=', 'rejected');
      // Verify the date filter is applied with resolved_at and a Date argument
      expect(mockQuery.where).toHaveBeenCalledWith(
        'resolved_at',
        '>',
        expect.any(Date)
      );
      expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
      expect(result).toEqual(mockRejectedRequest);
    });

    it('should return null when no recent rejected request exists', async () => {
      const mockQuery = createMockNullQuery();
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findRecentRejectedRequest('group-1', 'user-without-recent-rejection');

      expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should calculate the date filter as approximately 7 days ago', async () => {
      const mockQuery = createMockSelectQuery(mockRejectedRequest);
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const beforeCall = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      await findRecentRejectedRequest('group-1', 'user-1');
      const afterCall = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const whereCalls = mockQuery.where.mock.calls;
      const dateFilterCall = whereCalls.find((call: any[]) => call[0] === 'resolved_at');
      expect(dateFilterCall).toBeDefined();
      const dateArg: Date = dateFilterCall[2];
      expect(dateArg.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime() - 1000);
      expect(dateArg.getTime()).toBeLessThanOrEqual(afterCall.getTime() + 1000);
    });
  });

  describe('approveJoinRequest', () => {
    it('should update request status to approved and insert participant on success', async () => {
      const mockUpdateQuery = createMockUpdateQuery(mockApprovedRequest);
      mockDb.updateTable.mockReturnValue(mockUpdateQuery as any);

      const mockInsertQuery = createMockInsertQuery({ prode_group_id: 'group-1', participant_id: 'user-1', is_admin: false });
      mockDb.insertInto.mockReturnValue(mockInsertQuery as any);

      const result = await approveJoinRequest('request-1', 'admin-1');

      // Verify the update step
      expect(mockDb.updateTable).toHaveBeenCalledWith('prode_group_join_requests');
      expect(mockUpdateQuery.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'approved',
          resolved_by_user_id: 'admin-1',
          resolved_at: expect.any(Date),
        })
      );
      expect(mockUpdateQuery.where).toHaveBeenCalledWith('id', '=', 'request-1');
      expect(mockUpdateQuery.returningAll).toHaveBeenCalled();
      expect(mockUpdateQuery.executeTakeFirstOrThrow).toHaveBeenCalled();

      // Verify the insert step
      expect(mockDb.insertInto).toHaveBeenCalledWith('prode_group_participants');
      expect(mockInsertQuery.values).toHaveBeenCalledWith({
        prode_group_id: mockApprovedRequest.group_id,
        participant_id: mockApprovedRequest.user_id,
        is_admin: false,
      });
      expect(mockInsertQuery.execute).toHaveBeenCalled();

      expect(result).toEqual(mockApprovedRequest);
    });

    it('should perform compensating rollback when participant insert fails', async () => {
      const insertError = new Error('Duplicate participant');

      // First updateTable call: approve the request
      const mockApproveQuery = createMockUpdateQuery(mockApprovedRequest);
      // Second updateTable call: compensating rollback (reverts to pending)
      const mockRollbackQuery = createMockUpdateQuery(mockRequest);

      mockDb.updateTable
        .mockReturnValueOnce(mockApproveQuery as any)
        .mockReturnValueOnce(mockRollbackQuery as any);

      // insertInto fails at execute() — needs values() to be chainable first
      const mockFailingInsertQuery = {
        values: vi.fn().mockReturnThis(),
        execute: vi.fn().mockRejectedValue(insertError),
      };
      mockDb.insertInto.mockReturnValue(mockFailingInsertQuery as any);

      await expect(approveJoinRequest('request-1', 'admin-1')).rejects.toThrow(
        'Duplicate participant'
      );

      // Verify the compensating rollback update was called
      expect(mockDb.updateTable).toHaveBeenCalledTimes(2);
      expect(mockRollbackQuery.set).toHaveBeenCalledWith({
        status: 'pending',
        resolved_at: null,
        resolved_by_user_id: null,
      });
      expect(mockRollbackQuery.where).toHaveBeenCalledWith('id', '=', 'request-1');
      expect(mockRollbackQuery.execute).toHaveBeenCalled();
    });

    it('should rethrow the original error after compensating rollback', async () => {
      const originalError = new Error('Connection timeout');

      const mockApproveQuery = createMockUpdateQuery(mockApprovedRequest);
      const mockRollbackQuery = createMockUpdateQuery(mockRequest);

      mockDb.updateTable
        .mockReturnValueOnce(mockApproveQuery as any)
        .mockReturnValueOnce(mockRollbackQuery as any);

      // insertInto fails at execute() — needs values() to be chainable first
      const mockFailingInsertQuery = {
        values: vi.fn().mockReturnThis(),
        execute: vi.fn().mockRejectedValue(originalError),
      };
      mockDb.insertInto.mockReturnValue(mockFailingInsertQuery as any);

      await expect(approveJoinRequest('request-1', 'admin-1')).rejects.toThrow(
        'Connection timeout'
      );
    });
  });

  describe('rejectJoinRequest', () => {
    it('should update request status to rejected with correct values', async () => {
      const mockQuery = createMockUpdateQuery(mockRejectedRequest);
      mockDb.updateTable.mockReturnValue(mockQuery as any);

      const result = await rejectJoinRequest('request-1', 'admin-1');

      expect(mockDb.updateTable).toHaveBeenCalledWith('prode_group_join_requests');
      expect(mockQuery.set).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'rejected',
          resolved_by_user_id: 'admin-1',
          resolved_at: expect.any(Date),
        })
      );
      expect(mockQuery.where).toHaveBeenCalledWith('id', '=', 'request-1');
      expect(mockQuery.returningAll).toHaveBeenCalled();
      expect(mockQuery.executeTakeFirstOrThrow).toHaveBeenCalled();
      expect(result).toEqual(mockRejectedRequest);
    });
  });

  describe('cancelJoinRequest', () => {
    it('should delete request with correct where conditions', async () => {
      const mockQuery = createMockDeleteQuery(mockRequest);
      mockDb.deleteFrom.mockReturnValue(mockQuery as any);

      await cancelJoinRequest('request-1', 'user-1');

      expect(mockDb.deleteFrom).toHaveBeenCalledWith('prode_group_join_requests');
      expect(mockQuery.where).toHaveBeenCalledWith('id', '=', 'request-1');
      expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
      expect(mockQuery.execute).toHaveBeenCalled();
    });

    it('should scope deletion to the requesting user to prevent unauthorized cancellation', async () => {
      const mockQuery = createMockDeleteQuery(mockRequest);
      mockDb.deleteFrom.mockReturnValue(mockQuery as any);

      await cancelJoinRequest('request-1', 'user-1');

      // Both conditions must be present so another user cannot cancel someone else's request
      expect(mockQuery.where).toHaveBeenCalledWith('id', '=', 'request-1');
      expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
    });
  });

  describe('countPendingRequestsForGroup', () => {
    it('should return the count as a number when pending requests exist', async () => {
      const mockQuery = createMockSelectQuery({ count: '3' });
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await countPendingRequestsForGroup('group-1');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('prode_group_join_requests');
      expect(mockQuery.where).toHaveBeenCalledWith('group_id', '=', 'group-1');
      expect(mockQuery.where).toHaveBeenCalledWith('status', '=', 'pending');
      expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
      expect(result).toBe(3);
    });

    it('should return 0 when no pending requests exist', async () => {
      const mockQuery = createMockSelectQuery({ count: '0' });
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await countPendingRequestsForGroup('group-with-no-requests');

      expect(result).toBe(0);
    });

    it('should return 0 when query returns null/undefined result', async () => {
      const mockQuery = createMockNullQuery();
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await countPendingRequestsForGroup('non-existent-group');

      expect(result).toBe(0);
    });

    it('should convert string count to number', async () => {
      const mockQuery = createMockSelectQuery({ count: '42' });
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await countPendingRequestsForGroup('group-1');

      expect(typeof result).toBe('number');
      expect(result).toBe(42);
    });
  });
});

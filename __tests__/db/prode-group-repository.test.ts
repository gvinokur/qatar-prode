import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  findProdeGroupById,
  findProdeGroupsByOwner,
  findProdeGroupsByParticipant,
  createProdeGroup,
  updateProdeGroup,
  deleteProdeGroup,
  addParticipantToGroup,
  deleteAllParticipantsFromGroup,
  deleteParticipantFromAllGroups,
  findParticipantsInGroup,
  deleteParticipantFromGroup,
  updateParticipantAdminStatus,
  getGroupTournamentBettingConfig,
  createGroupTournamentBettingConfig,
  updateGroupTournamentBettingConfig,
  getGroupTournamentBettingPayments,
  getUserGroupTournamentBettingPayment,
  setUserGroupTournamentBettingPayment,
} from '../../app/db/prode-group-repository';
import { db } from '../../app/db/database';
import { testFactories } from './test-factories';
import { createMockSelectQuery, createMockInsertQuery, createMockUpdateQuery, createMockDeleteQuery } from './mock-helpers';

// Mock the database
vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    updateTable: vi.fn(),
    deleteFrom: vi.fn(),
  },
}));

// Mock base-repository
const mockBaseFunctions = vi.hoisted(() => ({
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
vi.mock('../../app/db/base-repository', () => ({
  createBaseFunctions: vi.fn(() => mockBaseFunctions),
}));

// Mock React cache
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    cache: vi.fn((fn) => fn),
  };
});

describe('Prode Group Repository', () => {
  const mockDb = vi.mocked(db);
  const mockGroup = testFactories.prodeGroup();
  const mockGroups = [
    testFactories.prodeGroup({ id: 'group-1', name: 'Friends Group' }),
    testFactories.prodeGroup({ id: 'group-2', name: 'Family Group' }),
  ];
  const mockUser = testFactories.user();
  const mockBetting = testFactories.prodeGroupTournamentBetting();
  const mockPayment = testFactories.prodeGroupTournamentBettingPayment();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Base CRUD Functions', () => {
    describe('findProdeGroupById', () => {
      it('should call base findById function', async () => {
        mockBaseFunctions.findById.mockResolvedValue(mockGroup);

        const result = await findProdeGroupById('group-1');

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('group-1');
        expect(result).toEqual(mockGroup);
      });
    });

    describe('createProdeGroup', () => {
      it('should call base create function', async () => {
        mockBaseFunctions.create.mockResolvedValue(mockGroup);

        const result = await createProdeGroup({
          owner_user_id: 'user-1',
          name: 'New Group',
        });

        expect(mockBaseFunctions.create).toHaveBeenCalledWith({
          owner_user_id: 'user-1',
          name: 'New Group',
        });
        expect(result).toEqual(mockGroup);
      });
    });

    describe('updateProdeGroup', () => {
      it('should call base update function', async () => {
        mockBaseFunctions.update.mockResolvedValue(mockGroup);

        const result = await updateProdeGroup('group-1', { name: 'Updated Name' });

        expect(mockBaseFunctions.update).toHaveBeenCalledWith('group-1', { name: 'Updated Name' });
        expect(result).toEqual(mockGroup);
      });
    });

    describe('deleteProdeGroup', () => {
      it('should call base delete function', async () => {
        mockBaseFunctions.delete.mockResolvedValue(mockGroup);

        const result = await deleteProdeGroup('group-1');

        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('group-1');
        expect(result).toEqual(mockGroup);
      });
    });
  });

  describe('Group Query Functions', () => {
    describe('findProdeGroupsByOwner', () => {
      it('should find groups by owner ID', async () => {
        const mockQuery = createMockSelectQuery(mockGroups);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findProdeGroupsByOwner('user-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('prode_groups');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.where).toHaveBeenCalledWith('prode_groups.owner_user_id', '=', 'user-1');
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(mockGroups);
      });

      it('should return empty array when user owns no groups', async () => {
        const mockQuery = createMockSelectQuery([]);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findProdeGroupsByOwner('user-with-no-groups');

        expect(result).toEqual([]);
      });
    });

    describe('findProdeGroupsByParticipant', () => {
      it('should find groups with participant join', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockGroups),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findProdeGroupsByParticipant('user-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('prode_groups');
        expect(mockQuery.innerJoin).toHaveBeenCalledWith(
          'prode_group_participants',
          'prode_group_participants.prode_group_id',
          'prode_groups.id'
        );
        expect(mockQuery.selectAll).toHaveBeenCalledWith('prode_groups');
        expect(mockQuery.where).toHaveBeenCalledWith('prode_group_participants.participant_id', '=', 'user-1');
        expect(result).toEqual(mockGroups);
      });

      it('should return empty array when user participates in no groups', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findProdeGroupsByParticipant('user-not-in-groups');

        expect(result).toEqual([]);
      });
    });
  });

  describe('Participant Management Functions', () => {
    describe('addParticipantToGroup', () => {
      it('should add participant as regular member', async () => {
        const mockQuery = createMockInsertQuery({ prode_group_id: 'group-1', participant_id: 'user-1', is_admin: false });
        mockDb.insertInto.mockReturnValue(mockQuery as any);

        await addParticipantToGroup(mockGroup, mockUser as any, false);

        expect(mockDb.insertInto).toHaveBeenCalledWith('prode_group_participants');
        expect(mockQuery.values).toHaveBeenCalledWith({
          prode_group_id: mockGroup.id,
          participant_id: mockUser.id,
          is_admin: false,
        });
        expect(mockQuery.returningAll).toHaveBeenCalled();
        expect(mockQuery.execute).toHaveBeenCalled();
      });

      it('should add participant as admin', async () => {
        const mockQuery = createMockInsertQuery({ prode_group_id: 'group-1', participant_id: 'user-1', is_admin: true });
        mockDb.insertInto.mockReturnValue(mockQuery as any);

        await addParticipantToGroup(mockGroup, mockUser as any, true);

        expect(mockQuery.values).toHaveBeenCalledWith({
          prode_group_id: mockGroup.id,
          participant_id: mockUser.id,
          is_admin: true,
        });
      });

      it('should default to non-admin when isAdmin not specified', async () => {
        const mockQuery = createMockInsertQuery({ prode_group_id: 'group-1', participant_id: 'user-1', is_admin: false });
        mockDb.insertInto.mockReturnValue(mockQuery as any);

        await addParticipantToGroup(mockGroup, mockUser as any);

        expect(mockQuery.values).toHaveBeenCalledWith(
          expect.objectContaining({ is_admin: false })
        );
      });
    });

    describe('deleteAllParticipantsFromGroup', () => {
      it('should delete all participants from group', async () => {
        const mockQuery = createMockDeleteQuery([]);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        await deleteAllParticipantsFromGroup('group-1');

        expect(mockDb.deleteFrom).toHaveBeenCalledWith('prode_group_participants');
        expect(mockQuery.where).toHaveBeenCalledWith('prode_group_participants.prode_group_id', '=', 'group-1');
        expect(mockQuery.execute).toHaveBeenCalled();
      });
    });

    describe('deleteParticipantFromAllGroups', () => {
      it('should delete user from all groups', async () => {
        const mockQuery = createMockDeleteQuery([]);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        await deleteParticipantFromAllGroups('user-1');

        expect(mockDb.deleteFrom).toHaveBeenCalledWith('prode_group_participants');
        expect(mockQuery.where).toHaveBeenCalledWith('prode_group_participants.participant_id', '=', 'user-1');
        expect(mockQuery.execute).toHaveBeenCalled();
      });
    });

    describe('findParticipantsInGroup', () => {
      it('should find all participants in group', async () => {
        const participants = [
          { user_id: 'user-1', is_admin: true },
          { user_id: 'user-2', is_admin: false },
        ];
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(participants),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findParticipantsInGroup('group-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('prode_group_participants');
        expect(mockQuery.select).toHaveBeenCalledWith(['participant_id as user_id', 'is_admin']);
        expect(mockQuery.where).toHaveBeenCalledWith('prode_group_id', '=', 'group-1');
        expect(result).toEqual(participants);
      });

      it('should return empty array when group has no participants', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findParticipantsInGroup('empty-group');

        expect(result).toEqual([]);
      });
    });

    describe('deleteParticipantFromGroup', () => {
      it('should delete specific participant from specific group', async () => {
        const mockQuery = createMockDeleteQuery([]);
        mockDb.deleteFrom.mockReturnValue(mockQuery as any);

        await deleteParticipantFromGroup('group-1', 'user-1');

        expect(mockDb.deleteFrom).toHaveBeenCalledWith('prode_group_participants');
        expect(mockQuery.where).toHaveBeenCalledWith('prode_group_participants.prode_group_id', '=', 'group-1');
        expect(mockQuery.where).toHaveBeenCalledWith('prode_group_participants.participant_id', '=', 'user-1');
        expect(mockQuery.execute).toHaveBeenCalled();
      });
    });

    describe('updateParticipantAdminStatus', () => {
      it('should promote participant to admin', async () => {
        const mockQuery = createMockUpdateQuery([]);
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        await updateParticipantAdminStatus('group-1', 'user-1', true);

        expect(mockDb.updateTable).toHaveBeenCalledWith('prode_group_participants');
        expect(mockQuery.set).toHaveBeenCalledWith({ is_admin: true });
        expect(mockQuery.where).toHaveBeenCalledWith('prode_group_id', '=', 'group-1');
        expect(mockQuery.where).toHaveBeenCalledWith('participant_id', '=', 'user-1');
        expect(mockQuery.execute).toHaveBeenCalled();
      });

      it('should demote participant from admin', async () => {
        const mockQuery = createMockUpdateQuery([]);
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        await updateParticipantAdminStatus('group-1', 'user-1', false);

        expect(mockQuery.set).toHaveBeenCalledWith({ is_admin: false });
      });
    });
  });

  describe('Betting Configuration Functions', () => {
    describe('getGroupTournamentBettingConfig', () => {
      it('should find betting config for group and tournament', async () => {
        const mockQuery = createMockSelectQuery(mockBetting);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getGroupTournamentBettingConfig('group-1', 'tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('prode_group_tournament_betting');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.where).toHaveBeenCalledWith('group_id', '=', 'group-1');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
        expect(result).toEqual(mockBetting);
      });

      it('should return undefined when config not found', async () => {
        const mockQuery = createMockSelectQuery(null);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getGroupTournamentBettingConfig('group-1', 'tournament-1');

        expect(result).toBeNull();
      });
    });

    describe('createGroupTournamentBettingConfig', () => {
      it('should create betting config', async () => {
        const mockQuery = createMockInsertQuery(mockBetting);
        mockDb.insertInto.mockReturnValue(mockQuery as any);

        const config = {
          group_id: 'group-1',
          tournament_id: 'tournament-1',
          betting_enabled: true,
          betting_amount: 50,
        };

        const result = await createGroupTournamentBettingConfig(config);

        expect(mockDb.insertInto).toHaveBeenCalledWith('prode_group_tournament_betting');
        expect(mockQuery.values).toHaveBeenCalledWith(config);
        expect(mockQuery.returningAll).toHaveBeenCalled();
        expect(mockQuery.executeTakeFirstOrThrow).toHaveBeenCalled();
        expect(result).toEqual(mockBetting);
      });
    });

    describe('updateGroupTournamentBettingConfig', () => {
      it('should update betting config', async () => {
        const mockQuery = createMockUpdateQuery(mockBetting);
        mockDb.updateTable.mockReturnValue(mockQuery as any);

        const update = { betting_amount: 100 };
        const result = await updateGroupTournamentBettingConfig('betting-1', update);

        expect(mockDb.updateTable).toHaveBeenCalledWith('prode_group_tournament_betting');
        expect(mockQuery.set).toHaveBeenCalledWith(update);
        expect(mockQuery.where).toHaveBeenCalledWith('id', '=', 'betting-1');
        expect(mockQuery.returningAll).toHaveBeenCalled();
        expect(mockQuery.executeTakeFirstOrThrow).toHaveBeenCalled();
        expect(result).toEqual(mockBetting);
      });
    });
  });

  describe('Betting Payment Functions', () => {
    describe('getGroupTournamentBettingPayments', () => {
      it('should find all payments for betting config', async () => {
        const payments = [mockPayment];
        const mockQuery = createMockSelectQuery(payments);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getGroupTournamentBettingPayments('betting-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('prode_group_tournament_betting_payments');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.where).toHaveBeenCalledWith('group_tournament_betting_id', '=', 'betting-1');
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(payments);
      });
    });

    describe('getUserGroupTournamentBettingPayment', () => {
      it('should find specific user payment', async () => {
        const mockQuery = createMockSelectQuery(mockPayment);
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await getUserGroupTournamentBettingPayment('betting-1', 'user-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('prode_group_tournament_betting_payments');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.where).toHaveBeenCalledWith('group_tournament_betting_id', '=', 'betting-1');
        expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
        expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
        expect(result).toEqual(mockPayment);
      });
    });

    describe('setUserGroupTournamentBettingPayment', () => {
      it('should update existing payment', async () => {
        // Mock getUserGroupTournamentBettingPayment query to return existing payment
        const mockSelectQuery = createMockSelectQuery(mockPayment);
        mockDb.selectFrom.mockReturnValueOnce(mockSelectQuery as any);

        // Mock update query
        const mockUpdateQuery = createMockUpdateQuery(mockPayment);
        mockDb.updateTable.mockReturnValue(mockUpdateQuery as any);

        const result = await setUserGroupTournamentBettingPayment('betting-1', 'user-1', true);

        expect(mockDb.updateTable).toHaveBeenCalledWith('prode_group_tournament_betting_payments');
        expect(mockUpdateQuery.set).toHaveBeenCalledWith({ has_paid: true });
        expect(mockUpdateQuery.where).toHaveBeenCalledWith('group_tournament_betting_id', '=', 'betting-1');
        expect(mockUpdateQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-1');
        expect(result).toEqual(mockPayment);
      });

      it('should insert new payment if not exists', async () => {
        // Mock getUserGroupTournamentBettingPayment query to return undefined (not found)
        const mockSelectQuery = createMockSelectQuery(undefined);
        mockDb.selectFrom.mockReturnValueOnce(mockSelectQuery as any);

        // Mock insert query
        const mockInsertQuery = createMockInsertQuery(mockPayment);
        mockDb.insertInto.mockReturnValue(mockInsertQuery as any);

        const result = await setUserGroupTournamentBettingPayment('betting-1', 'user-1', true);

        expect(mockDb.insertInto).toHaveBeenCalledWith('prode_group_tournament_betting_payments');
        expect(mockInsertQuery.values).toHaveBeenCalledWith({
          group_tournament_betting_id: 'betting-1',
          user_id: 'user-1',
          has_paid: true,
        });
        expect(result).toEqual(mockPayment);
      });

      it('should set payment to false', async () => {
        // Mock getUserGroupTournamentBettingPayment query to return undefined
        const mockSelectQuery = createMockSelectQuery(undefined);
        mockDb.selectFrom.mockReturnValueOnce(mockSelectQuery as any);

        // Mock insert query
        const mockInsertQuery = createMockInsertQuery(mockPayment);
        mockDb.insertInto.mockReturnValue(mockInsertQuery as any);

        await setUserGroupTournamentBettingPayment('betting-1', 'user-1', false);

        expect(mockInsertQuery.values).toHaveBeenCalledWith({
          group_tournament_betting_id: 'betting-1',
          user_id: 'user-1',
          has_paid: false,
        });
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      const mockQuery = {
        selectAll: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockRejectedValue(new Error('Connection lost')),
      };
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      await expect(findProdeGroupsByOwner('user-1')).rejects.toThrow('Connection lost');
    });
  });
});

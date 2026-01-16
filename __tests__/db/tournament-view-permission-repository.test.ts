import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  TournamentViewPermission,
  TournamentViewPermissionNew
} from '../../app/db/tables-definition';

// Create hoisted mocks for base functions
const mockBaseFunctions = vi.hoisted(() => ({
  findById: vi.fn(),
  create: vi.fn(),
  delete: vi.fn()
}));

// Mock the database connection
vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    deleteFrom: vi.fn()
  }
}));

// Mock the base repository functions
vi.mock('../../app/db/base-repository', () => ({
  createBaseFunctions: vi.fn(() => mockBaseFunctions)
}));

// Import after mocking
import * as permissionRepository from '../../app/db/tournament-view-permission-repository';
import { db } from '../../app/db/database';

describe('Tournament View Permission Repository', () => {
  const mockPermission: TournamentViewPermission = {
    id: 'permission-123',
    tournament_id: 'tournament-123',
    user_id: 'user-123',
    created_at: new Date('2026-01-15T00:00:00Z')
  };

  const mockPermissionNew: TournamentViewPermissionNew = {
    tournament_id: 'tournament-123',
    user_id: 'user-123'
  };

  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = vi.mocked(db);

    // Setup default mock implementations
    mockDb.selectFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue([]),
      executeTakeFirst: vi.fn().mockResolvedValue(null)
    });

    mockDb.insertInto.mockReturnValue({
      values: vi.fn().mockReturnThis(),
      onConflict: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(undefined)
    });

    mockDb.deleteFrom.mockReturnValue({
      where: vi.fn().mockReturnThis(),
      execute: vi.fn().mockResolvedValue(undefined)
    });

    mockBaseFunctions.findById.mockResolvedValue(null);
    mockBaseFunctions.create.mockResolvedValue(mockPermission);
    mockBaseFunctions.delete.mockResolvedValue(mockPermission);
  });

  describe('Base CRUD Operations', () => {
    describe('findPermissionById', () => {
      it('should call base findById function', async () => {
        mockBaseFunctions.findById.mockResolvedValue(mockPermission);

        const result = await permissionRepository.findPermissionById('permission-123');

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('permission-123');
        expect(result).toBe(mockPermission);
      });

      it('should return null when permission not found', async () => {
        mockBaseFunctions.findById.mockResolvedValue(null);

        const result = await permissionRepository.findPermissionById('nonexistent-id');

        expect(result).toBeNull();
      });
    });

    describe('createPermission', () => {
      it('should call base create function', async () => {
        mockBaseFunctions.create.mockResolvedValue(mockPermission);

        const result = await permissionRepository.createPermission(mockPermissionNew);

        expect(mockBaseFunctions.create).toHaveBeenCalledWith(mockPermissionNew);
        expect(result).toBe(mockPermission);
      });
    });

    describe('deletePermission', () => {
      it('should call base delete function', async () => {
        mockBaseFunctions.delete.mockResolvedValue(mockPermission);

        const result = await permissionRepository.deletePermission('permission-123');

        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('permission-123');
        expect(result).toBe(mockPermission);
      });
    });
  });

  describe('findUserIdsForTournament', () => {
    it('should return array of user IDs for a tournament', async () => {
      const mockPermissions = [
        { user_id: 'user-1' },
        { user_id: 'user-2' },
        { user_id: 'user-3' }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(mockPermissions)
      };
      mockDb.selectFrom.mockReturnValue(mockQuery);

      const result = await permissionRepository.findUserIdsForTournament('tournament-123');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_view_permissions');
      expect(mockQuery.select).toHaveBeenCalledWith('user_id');
      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-123');
      expect(mockQuery.execute).toHaveBeenCalled();
      expect(result).toEqual(['user-1', 'user-2', 'user-3']);
    });

    it('should return empty array when no permissions found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([])
      };
      mockDb.selectFrom.mockReturnValue(mockQuery);

      const result = await permissionRepository.findUserIdsForTournament('tournament-123');

      expect(result).toEqual([]);
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockRejectedValue(new Error('Database error'))
      };
      mockDb.selectFrom.mockReturnValue(mockQuery);

      await expect(permissionRepository.findUserIdsForTournament('tournament-123'))
        .rejects.toThrow('Database error');
    });
  });

  describe('hasUserPermission', () => {
    it('should return true when user has permission', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockPermission)
      };
      mockDb.selectFrom.mockReturnValue(mockQuery);

      const result = await permissionRepository.hasUserPermission('tournament-123', 'user-123');

      expect(mockDb.selectFrom).toHaveBeenCalledWith('tournament_view_permissions');
      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-123');
      expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-123');
      expect(result).toBe(true);
    });

    it('should return false when user does not have permission', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null)
      };
      mockDb.selectFrom.mockReturnValue(mockQuery);

      const result = await permissionRepository.hasUserPermission('tournament-123', 'user-456');

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockRejectedValue(new Error('Database error'))
      };
      mockDb.selectFrom.mockReturnValue(mockQuery);

      await expect(permissionRepository.hasUserPermission('tournament-123', 'user-123'))
        .rejects.toThrow('Database error');
    });
  });

  describe('addUsersToTournament', () => {
    it('should add multiple users to tournament', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];

      const mockQuery = {
        values: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(undefined)
      };
      mockDb.insertInto.mockReturnValue(mockQuery);

      await permissionRepository.addUsersToTournament('tournament-123', userIds);

      expect(mockDb.insertInto).toHaveBeenCalledWith('tournament_view_permissions');
      expect(mockQuery.values).toHaveBeenCalledWith([
        { tournament_id: 'tournament-123', user_id: 'user-1' },
        { tournament_id: 'tournament-123', user_id: 'user-2' },
        { tournament_id: 'tournament-123', user_id: 'user-3' }
      ]);
      expect(mockQuery.onConflict).toHaveBeenCalled();
      expect(mockQuery.execute).toHaveBeenCalled();
    });

    it('should handle empty user array gracefully', async () => {
      await permissionRepository.addUsersToTournament('tournament-123', []);

      expect(mockDb.insertInto).not.toHaveBeenCalled();
    });

    it('should handle duplicate permissions with onConflict', async () => {
      const userIds = ['user-1'];

      const mockOnConflict = vi.fn().mockReturnThis();
      const mockQuery = {
        values: vi.fn().mockReturnThis(),
        onConflict: mockOnConflict,
        execute: vi.fn().mockResolvedValue(undefined)
      };
      mockDb.insertInto.mockReturnValue(mockQuery);

      await permissionRepository.addUsersToTournament('tournament-123', userIds);

      expect(mockOnConflict).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        values: vi.fn().mockReturnThis(),
        onConflict: vi.fn().mockReturnThis(),
        execute: vi.fn().mockRejectedValue(new Error('Database error'))
      };
      mockDb.insertInto.mockReturnValue(mockQuery);

      await expect(permissionRepository.addUsersToTournament('tournament-123', ['user-1']))
        .rejects.toThrow('Database error');
    });
  });

  describe('removeAllTournamentPermissions', () => {
    it('should remove all permissions for a tournament', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(undefined)
      };
      mockDb.deleteFrom.mockReturnValue(mockQuery);

      await permissionRepository.removeAllTournamentPermissions('tournament-123');

      expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_view_permissions');
      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-123');
      expect(mockQuery.execute).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockRejectedValue(new Error('Database error'))
      };
      mockDb.deleteFrom.mockReturnValue(mockQuery);

      await expect(permissionRepository.removeAllTournamentPermissions('tournament-123'))
        .rejects.toThrow('Database error');
    });
  });

  describe('removeUserFromTournament', () => {
    it('should remove specific user permission', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(undefined)
      };
      mockDb.deleteFrom.mockReturnValue(mockQuery);

      await permissionRepository.removeUserFromTournament('tournament-123', 'user-123');

      expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_view_permissions');
      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-123');
      expect(mockQuery.where).toHaveBeenCalledWith('user_id', '=', 'user-123');
      expect(mockQuery.execute).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockRejectedValue(new Error('Database error'))
      };
      mockDb.deleteFrom.mockReturnValue(mockQuery);

      await expect(permissionRepository.removeUserFromTournament('tournament-123', 'user-123'))
        .rejects.toThrow('Database error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null values gracefully', async () => {
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(null)
      };
      mockDb.selectFrom.mockReturnValue(mockQuery);

      const result = await permissionRepository.hasUserPermission('', '');
      expect(result).toBe(false);
    });

    it('should handle special characters in IDs', async () => {
      const specialId = 'tournament-123-special!@#';
      const mockQuery = {
        where: vi.fn().mockReturnThis(),
        selectAll: vi.fn().mockReturnThis(),
        executeTakeFirst: vi.fn().mockResolvedValue(mockPermission)
      };
      mockDb.selectFrom.mockReturnValue(mockQuery);

      await permissionRepository.hasUserPermission(specialId, 'user-123');

      expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', specialId);
    });
  });
});

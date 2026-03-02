import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getShortUrlByCode,
  getShortUrlForGroup,
  getOrCreateShortUrl,
  createShortUrl,
  incrementClickCount,
} from '../short-url-repository';
import { db } from '../database';
import { ShortUrl } from '../tables-definition';
import { createMockSelectQuery, createMockInsertQuery, createMockUpdateQuery } from '../../../__tests__/db/mock-helpers';

// Mock crypto for deterministic testing (must be hoisted before vi.mock)
const mockRandomBytes = vi.hoisted(() => vi.fn());

// Mock the database
vi.mock('../database', () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    updateTable: vi.fn(),
  },
}));

// Mock crypto
vi.mock('node:crypto', () => ({
  default: {
    randomBytes: mockRandomBytes,
  },
  randomBytes: mockRandomBytes,
}));

describe('short-url-repository', () => {
  const mockShortUrl: ShortUrl = {
    id: 'short-url-1',
    code: 'abc123',
    group_id: 'group-1',
    tournament_id: 'tournament-1',
    created_at: new Date('2026-03-01'),
    click_count: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getShortUrlByCode', () => {
    it('should retrieve short URL by code', async () => {
      const mockQuery = createMockSelectQuery(mockShortUrl);
      (db.selectFrom as any).mockReturnValue(mockQuery);

      const result = await getShortUrlByCode('abc123');

      expect(db.selectFrom).toHaveBeenCalledWith('short_urls');
      expect(mockQuery.where).toHaveBeenCalledWith('code', '=', 'abc123');
      expect(mockQuery.selectAll).toHaveBeenCalled();
      expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
      expect(result).toEqual(mockShortUrl);
    });

    it('should return undefined for non-existent code', async () => {
      const mockQuery = createMockSelectQuery(undefined);
      (db.selectFrom as any).mockReturnValue(mockQuery);

      const result = await getShortUrlByCode('invalid');

      expect(result).toBeUndefined();
    });
  });

  describe('getShortUrlForGroup', () => {
    it('should retrieve short URL by group_id only', async () => {
      const mockQuery = createMockSelectQuery(mockShortUrl);
      (db.selectFrom as any).mockReturnValue(mockQuery);

      const result = await getShortUrlForGroup('group-1');

      expect(db.selectFrom).toHaveBeenCalledWith('short_urls');
      expect(mockQuery.where).toHaveBeenCalledWith('group_id', '=', 'group-1');
      expect(mockQuery.selectAll).toHaveBeenCalled();
      expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
      expect(result).toEqual(mockShortUrl);
    });

    it('should return undefined if group has no short URL', async () => {
      const mockQuery = createMockSelectQuery(undefined);
      (db.selectFrom as any).mockReturnValue(mockQuery);

      const result = await getShortUrlForGroup('group-2');

      expect(result).toBeUndefined();
    });
  });

  describe('createShortUrl', () => {
    beforeEach(() => {
      // Mock crypto.randomBytes to return deterministic values
      mockRandomBytes.mockReturnValue(Buffer.from([1, 2, 3, 4, 5, 6]));
    });

    it('should create short URL with generated code', async () => {
      const mockQuery = createMockInsertQuery(mockShortUrl);
      (db.insertInto as any).mockReturnValue(mockQuery);

      const result = await createShortUrl('group-1', 'tournament-1');

      expect(db.insertInto).toHaveBeenCalledWith('short_urls');
      expect(mockQuery.values).toHaveBeenCalledWith(expect.objectContaining({
        group_id: 'group-1',
        tournament_id: 'tournament-1',
        click_count: 0,
      }));
      expect(mockQuery.returningAll).toHaveBeenCalled();
      expect(mockQuery.executeTakeFirstOrThrow).toHaveBeenCalled();
      expect(result).toEqual(mockShortUrl);
    });

    it('should create short URL with null tournament_id when not provided', async () => {
      const mockShortUrlNoTournament = { ...mockShortUrl, tournament_id: null };
      const mockQuery = createMockInsertQuery(mockShortUrlNoTournament);
      (db.insertInto as any).mockReturnValue(mockQuery);

      const result = await createShortUrl('group-1');

      expect(mockQuery.values).toHaveBeenCalledWith(expect.objectContaining({
        tournament_id: null,
      }));
      expect(result).toEqual(mockShortUrlNoTournament);
    });

    it('should retry on code collision and succeed', async () => {
      // First call returns collision, second call succeeds
      mockRandomBytes
        .mockReturnValueOnce(Buffer.from([1, 2, 3, 4, 5, 6])) // First attempt - collision
        .mockReturnValueOnce(Buffer.from([7, 8, 9, 10, 11, 12])); // Second attempt - success

      let callCount = 0;
      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            // First call - simulate unique constraint violation on code
            const error: any = new Error('unique constraint violation');
            error.code = '23505';
            error.constraint = 'idx_short_urls_code';
            throw error;
          }
          // Second call - success
          return Promise.resolve(mockShortUrl);
        }),
      };

      (db.insertInto as any).mockReturnValue(mockInsertQuery);

      const result = await createShortUrl('group-1', 'tournament-1');

      expect(mockInsertQuery.executeTakeFirstOrThrow).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockShortUrl);
    });

    it('should throw error after max retry attempts', async () => {
      mockRandomBytes.mockReturnValue(Buffer.from([1, 2, 3, 4, 5, 6]));

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockImplementation(() => {
          // Always fail with code collision
          const error: any = new Error('unique constraint violation');
          error.code = '23505';
          error.constraint = 'idx_short_urls_code';
          throw error;
        }),
      };

      (db.insertInto as any).mockReturnValue(mockInsertQuery);

      await expect(createShortUrl('group-1', 'tournament-1')).rejects.toThrow(
        'Failed to generate unique short code after 5 attempts'
      );

      expect(mockInsertQuery.executeTakeFirstOrThrow).toHaveBeenCalledTimes(5);
    });

    it('should throw descriptive error on group_id collision', async () => {
      mockRandomBytes.mockReturnValue(Buffer.from([1, 2, 3, 4, 5, 6]));

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockImplementation(() => {
          // Simulate unique constraint violation on group_id
          const error: any = new Error('unique constraint violation');
          error.code = '23505';
          error.constraint = 'idx_short_urls_group';
          throw error;
        }),
      };

      (db.insertInto as any).mockReturnValue(mockInsertQuery);

      await expect(createShortUrl('group-1', 'tournament-1')).rejects.toThrow(
        'Group group-1 already has a short URL. Use getOrCreateShortUrl instead.'
      );
    });

    it('should re-throw non-constraint errors', async () => {
      mockRandomBytes.mockReturnValue(Buffer.from([1, 2, 3, 4, 5, 6]));

      const mockInsertQuery = {
        values: vi.fn().mockReturnThis(),
        returningAll: vi.fn().mockReturnThis(),
        executeTakeFirstOrThrow: vi.fn().mockRejectedValue(new Error('Database connection error')),
      };

      (db.insertInto as any).mockReturnValue(mockInsertQuery);

      await expect(createShortUrl('group-1', 'tournament-1')).rejects.toThrow('Database connection error');
    });
  });

  describe('getOrCreateShortUrl', () => {
    it('should return existing short URL if found', async () => {
      const mockSelectQuery = createMockSelectQuery(mockShortUrl);
      (db.selectFrom as any).mockReturnValue(mockSelectQuery);

      const result = await getOrCreateShortUrl('group-1', 'tournament-1');

      expect(db.selectFrom).toHaveBeenCalledWith('short_urls');
      expect(result).toEqual(mockShortUrl);
      expect(db.insertInto).not.toHaveBeenCalled();
      expect(db.updateTable).not.toHaveBeenCalled();
    });

    it('should create new short URL if not found', async () => {
      mockRandomBytes.mockReturnValue(Buffer.from([1, 2, 3, 4, 5, 6]));

      const mockSelectQuery = createMockSelectQuery(undefined);
      (db.selectFrom as any).mockReturnValue(mockSelectQuery);

      const mockInsertQuery = createMockInsertQuery(mockShortUrl);
      (db.insertInto as any).mockReturnValue(mockInsertQuery);

      const result = await getOrCreateShortUrl('group-1', 'tournament-1');

      expect(db.selectFrom).toHaveBeenCalledWith('short_urls');
      expect(db.insertInto).toHaveBeenCalledWith('short_urls');
      expect(result).toEqual(mockShortUrl);
    });

    it('should update tournament_id if it changed', async () => {
      const existingShortUrl = { ...mockShortUrl, tournament_id: 'old-tournament' };
      const updatedShortUrl = { ...mockShortUrl, tournament_id: 'new-tournament' };

      const mockSelectQuery = createMockSelectQuery(existingShortUrl);
      (db.selectFrom as any).mockReturnValue(mockSelectQuery);

      const mockUpdateQuery = createMockUpdateQuery(updatedShortUrl);
      (db.updateTable as any).mockReturnValue(mockUpdateQuery);

      const result = await getOrCreateShortUrl('group-1', 'new-tournament');

      expect(db.selectFrom).toHaveBeenCalledWith('short_urls');
      expect(db.updateTable).toHaveBeenCalledWith('short_urls');
      expect(mockUpdateQuery.set).toHaveBeenCalledWith({ tournament_id: 'new-tournament' });
      expect(mockUpdateQuery.where).toHaveBeenCalledWith('id', '=', existingShortUrl.id);
      expect(result).toEqual(updatedShortUrl);
    });

    it('should update tournament_id to null if changed from non-null', async () => {
      const existingShortUrl = { ...mockShortUrl, tournament_id: 'old-tournament' };
      const updatedShortUrl = { ...mockShortUrl, tournament_id: null };

      const mockSelectQuery = createMockSelectQuery(existingShortUrl);
      (db.selectFrom as any).mockReturnValue(mockSelectQuery);

      const mockUpdateQuery = createMockUpdateQuery(updatedShortUrl);
      (db.updateTable as any).mockReturnValue(mockUpdateQuery);

      const result = await getOrCreateShortUrl('group-1', undefined);

      expect(mockUpdateQuery.set).toHaveBeenCalledWith({ tournament_id: null });
      expect(result).toEqual(updatedShortUrl);
    });

    it('should not update if tournament_id unchanged', async () => {
      const mockSelectQuery = createMockSelectQuery(mockShortUrl);
      (db.selectFrom as any).mockReturnValue(mockSelectQuery);

      const result = await getOrCreateShortUrl('group-1', 'tournament-1');

      expect(db.updateTable).not.toHaveBeenCalled();
      expect(result).toEqual(mockShortUrl);
    });
  });

  describe('incrementClickCount', () => {
    it('should increment click_count by 1', async () => {
      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue(undefined),
      };

      (db.updateTable as any).mockReturnValue(mockUpdateQuery);

      await incrementClickCount('abc123');

      expect(db.updateTable).toHaveBeenCalledWith('short_urls');
      expect(mockUpdateQuery.set).toHaveBeenCalled();
      expect(mockUpdateQuery.where).toHaveBeenCalledWith('code', '=', 'abc123');
      expect(mockUpdateQuery.execute).toHaveBeenCalled();
    });

    it('should handle database errors gracefully (fire-and-forget)', async () => {
      const mockUpdateQuery = {
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockRejectedValue(new Error('Database error')),
      };

      (db.updateTable as any).mockReturnValue(mockUpdateQuery);

      // Should not throw - fire-and-forget
      await expect(incrementClickCount('abc123')).rejects.toThrow('Database error');
    });
  });
});

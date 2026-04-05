import { describe, it, expect, vi, beforeEach } from 'vitest';
import { findAllPublicGroupsForSitemap } from '../prode-group-repository';
import { db } from '../database';
import { createMockSelectQuery, createMockErrorQuery } from '../../../__tests__/db/mock-helpers';

vi.mock('../database', () => ({
  db: {
    selectFrom: vi.fn(),
  },
}));

describe('findAllPublicGroupsForSitemap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when no public groups exist', async () => {
    const mockQuery = createMockSelectQuery([]);
    (db.selectFrom as any).mockReturnValue(mockQuery);

    const result = await findAllPublicGroupsForSitemap();

    expect(result).toEqual([]);
  });

  it('returns only groups with is_public = true', async () => {
    const publicGroups = [{ id: 'group-1' }, { id: 'group-2' }];
    const mockQuery = createMockSelectQuery(publicGroups);
    (db.selectFrom as any).mockReturnValue(mockQuery);

    const result = await findAllPublicGroupsForSitemap();

    expect(db.selectFrom).toHaveBeenCalledWith('prode_groups');
    expect(mockQuery.where).toHaveBeenCalledWith('is_public', '=', true);
    expect(mockQuery.execute).toHaveBeenCalled();
    expect(result).toEqual(publicGroups);
  });

  it('selects only the id column (no joins or extra fields)', async () => {
    const mockQuery = createMockSelectQuery([{ id: 'group-1' }]);
    (db.selectFrom as any).mockReturnValue(mockQuery);

    await findAllPublicGroupsForSitemap();

    expect(mockQuery.select).toHaveBeenCalledWith('id');
    expect(mockQuery.innerJoin).not.toHaveBeenCalled();
    expect(mockQuery.leftJoin).not.toHaveBeenCalled();
  });

  it('re-throws when the database query fails', async () => {
    const mockQuery = createMockErrorQuery(new Error('Connection timeout'));
    (db.selectFrom as any).mockReturnValue(mockQuery);

    await expect(findAllPublicGroupsForSitemap()).rejects.toThrow('Connection timeout');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAdSettings, upsertAdSettings } from '../ad-settings-repository';
import { db } from '../database';
import {
  createMockSelectQuery,
  createMockInsertQuery,
  createMockUpdateQuery,
} from '../../../__tests__/db/mock-helpers';
import { testFactories } from '../../../__tests__/db/test-factories';

vi.mock('../database', () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    updateTable: vi.fn(),
  },
}));

describe('ad-settings-repository', () => {
  const mockSettings = testFactories.adSettings();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAdSettings', () => {
    it('returns the settings row when it exists', async () => {
      const mockQuery = createMockSelectQuery(mockSettings);
      (db.selectFrom as any).mockReturnValue(mockQuery);

      const result = await getAdSettings();

      expect(db.selectFrom).toHaveBeenCalledWith('ad_settings');
      expect(result).toEqual(mockSettings);
    });

    it('returns undefined when table is empty', async () => {
      const mockQuery = createMockSelectQuery(undefined);
      (db.selectFrom as any).mockReturnValue(mockQuery);

      const result = await getAdSettings();

      expect(result).toBeUndefined();
    });

    it('returns correct field values for a seeded row', async () => {
      const seeded = testFactories.adSettings({
        modal_min_minutes_between: 60,
        modal_min_pageviews_between: 20,
      });
      const mockQuery = createMockSelectQuery(seeded);
      (db.selectFrom as any).mockReturnValue(mockQuery);

      const result = await getAdSettings();

      expect(result?.modal_min_minutes_between).toBe(60);
      expect(result?.modal_min_pageviews_between).toBe(20);
    });
  });

  describe('upsertAdSettings', () => {
    it('updates modal_min_minutes_between to provided value when row exists', async () => {
      const mockSelectQuery = createMockSelectQuery(mockSettings);
      (db.selectFrom as any).mockReturnValue(mockSelectQuery);

      const updated = testFactories.adSettings({ modal_min_minutes_between: 45 });
      const mockUpdateQuery = createMockUpdateQuery(updated);
      (db.updateTable as any).mockReturnValue(mockUpdateQuery);

      const result = await upsertAdSettings({ modal_min_minutes_between: 45 });

      expect(db.updateTable).toHaveBeenCalledWith('ad_settings');
      expect(mockUpdateQuery.set).toHaveBeenCalledWith({ modal_min_minutes_between: 45 });
      expect(result.modal_min_minutes_between).toBe(45);
    });

    it('updates modal_min_pageviews_between to provided value when row exists', async () => {
      const mockSelectQuery = createMockSelectQuery(mockSettings);
      (db.selectFrom as any).mockReturnValue(mockSelectQuery);

      const updated = testFactories.adSettings({ modal_min_pageviews_between: 5 });
      const mockUpdateQuery = createMockUpdateQuery(updated);
      (db.updateTable as any).mockReturnValue(mockUpdateQuery);

      const result = await upsertAdSettings({ modal_min_pageviews_between: 5 });

      expect(result.modal_min_pageviews_between).toBe(5);
    });

    it('creates row if none exists (first-call scenario)', async () => {
      const mockSelectQuery = createMockSelectQuery(undefined);
      (db.selectFrom as any).mockReturnValue(mockSelectQuery);

      const mockInsertQuery = createMockInsertQuery(mockSettings);
      (db.insertInto as any).mockReturnValue(mockInsertQuery);

      const result = await upsertAdSettings({
        modal_min_minutes_between: 30,
        modal_min_pageviews_between: 10,
      });

      expect(db.insertInto).toHaveBeenCalledWith('ad_settings');
      expect(result).toEqual(mockSettings);
    });
  });
});

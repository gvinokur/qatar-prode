import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateShortUrlForGroup, buildShortUrl } from '../short-url-actions';
import * as shortUrlRepository from '@/app/db/short-url-repository';
import { ShortUrl } from '@/app/db/tables-definition';

// Mock the repository
vi.mock('@/app/db/short-url-repository', () => ({
  getOrCreateShortUrl: vi.fn(),
}));

// Mock environment variable
const originalEnv = process.env;

describe('short-url-actions', () => {
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
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateShortUrlForGroup', () => {
    it('should call getOrCreateShortUrl with group and tournament', async () => {
      (shortUrlRepository.getOrCreateShortUrl as any).mockResolvedValue(mockShortUrl);

      const result = await generateShortUrlForGroup('group-1', 'tournament-1');

      expect(shortUrlRepository.getOrCreateShortUrl).toHaveBeenCalledWith('group-1', 'tournament-1');
      expect(result).toEqual(mockShortUrl);
    });

    it('should call getOrCreateShortUrl with group only when no tournament', async () => {
      const mockShortUrlNoTournament = { ...mockShortUrl, tournament_id: null };
      (shortUrlRepository.getOrCreateShortUrl as any).mockResolvedValue(mockShortUrlNoTournament);

      const result = await generateShortUrlForGroup('group-1');

      expect(shortUrlRepository.getOrCreateShortUrl).toHaveBeenCalledWith('group-1', undefined);
      expect(result).toEqual(mockShortUrlNoTournament);
    });

    it('should return short URL object with code', async () => {
      (shortUrlRepository.getOrCreateShortUrl as any).mockResolvedValue(mockShortUrl);

      const result = await generateShortUrlForGroup('group-1', 'tournament-1');

      expect(result).toHaveProperty('code');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('group_id');
      expect(result).toHaveProperty('tournament_id');
      expect(result).toHaveProperty('click_count');
    });

    it('should propagate repository errors', async () => {
      (shortUrlRepository.getOrCreateShortUrl as any).mockRejectedValue(
        new Error('Database error')
      );

      await expect(generateShortUrlForGroup('group-1', 'tournament-1')).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('buildShortUrl', () => {
    it('should build full URL using NEXT_PUBLIC_APP_URL', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://prodemundial.app';

      const result = await buildShortUrl('abc123');

      expect(result).toBe('https://prodemundial.app/j/abc123');
    });

    it('should use default URL when NEXT_PUBLIC_APP_URL is not set', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      const result = await buildShortUrl('abc123');

      expect(result).toBe('https://prodemundial.app/j/abc123');
    });

    it('should build correct URL format with code', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

      const result = await buildShortUrl('xyz789');

      expect(result).toBe('https://example.com/j/xyz789');
    });

    it('should handle codes with mixed case', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://prodemundial.app';

      const result = await buildShortUrl('Ab12Xy');

      expect(result).toBe('https://prodemundial.app/j/Ab12Xy');
    });

    it('should not encode or transform the code', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://prodemundial.app';

      const result = await buildShortUrl('123abc');

      expect(result).toBe('https://prodemundial.app/j/123abc');
      expect(result).not.toContain('%');
    });
  });
});

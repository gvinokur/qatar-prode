import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect, notFound } from 'next/navigation';
import ShortUrlRedirect from '../page';
import * as shortUrlRepository from '@/app/db/short-url-repository';
import { ShortUrl } from '@/app/db/tables-definition';

// Mock Next.js navigation functions
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

// Mock the short URL repository
vi.mock('@/app/db/short-url-repository', () => ({
  getShortUrlByCode: vi.fn(),
  incrementClickCount: vi.fn(),
}));

// Mock next/headers cookies
const mockCookiesGet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: mockCookiesGet,
  })),
}));

describe('ShortUrlRedirect', () => {
  const mockShortUrl: ShortUrl = {
    id: 'short-url-1',
    code: 'abc123',
    group_id: 'group-1',
    tournament_id: 'tournament-1',
    created_at: new Date('2026-03-01'),
    click_count: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock redirect to throw (Next.js redirect throws to interrupt execution)
    (redirect as any).mockImplementation((path: string) => {
      throw new Error(`REDIRECT: ${path}`);
    });
    (notFound as any).mockImplementation(() => {
      throw new Error('NOT_FOUND');
    });
    // Default mock for incrementClickCount (can be overridden in specific tests)
    (shortUrlRepository.incrementClickCount as any).mockResolvedValue(undefined);
    // Default mock for locale cookie (English)
    mockCookiesGet.mockReturnValue({ value: 'en' });
  });

  describe('valid short codes', () => {
    it('should redirect to tournament-scoped join page with English locale', async () => {
      (shortUrlRepository.getShortUrlByCode as any).mockResolvedValue(mockShortUrl);
      mockCookiesGet.mockReturnValue({ value: 'en' });

      const props = {
        params: Promise.resolve({ code: 'abc123' }),
      };

      await expect(ShortUrlRedirect(props)).rejects.toThrow(
        'REDIRECT: /en/tournaments/tournament-1/friend-groups/join/group-1'
      );

      expect(shortUrlRepository.getShortUrlByCode).toHaveBeenCalledWith('abc123');
      expect(shortUrlRepository.incrementClickCount).toHaveBeenCalledWith('abc123');
      expect(redirect).toHaveBeenCalledWith('/en/tournaments/tournament-1/friend-groups/join/group-1');
    });

    it('should redirect to tournament-scoped join page with Spanish locale', async () => {
      (shortUrlRepository.getShortUrlByCode as any).mockResolvedValue(mockShortUrl);
      mockCookiesGet.mockReturnValue({ value: 'es' });

      const props = {
        params: Promise.resolve({ code: 'abc123' }),
      };

      await expect(ShortUrlRedirect(props)).rejects.toThrow(
        'REDIRECT: /es/tournaments/tournament-1/friend-groups/join/group-1'
      );

      expect(redirect).toHaveBeenCalledWith('/es/tournaments/tournament-1/friend-groups/join/group-1');
    });

    it('should redirect to global join page when tournament_id is null', async () => {
      const mockShortUrlNoTournament = { ...mockShortUrl, tournament_id: null };
      (shortUrlRepository.getShortUrlByCode as any).mockResolvedValue(mockShortUrlNoTournament);

      const props = {
        params: Promise.resolve({ code: 'abc123' }),
      };

      await expect(ShortUrlRedirect(props)).rejects.toThrow(
        'REDIRECT: /en/friend-groups/join/group-1'
      );

      expect(redirect).toHaveBeenCalledWith('/en/friend-groups/join/group-1');
    });

    it('should increment click count before redirecting', async () => {
      (shortUrlRepository.getShortUrlByCode as any).mockResolvedValue(mockShortUrl);
      (shortUrlRepository.incrementClickCount as any).mockResolvedValue(undefined);

      const props = {
        params: Promise.resolve({ code: 'abc123' }),
      };

      await expect(ShortUrlRedirect(props)).rejects.toThrow('REDIRECT');

      expect(shortUrlRepository.incrementClickCount).toHaveBeenCalledWith('abc123');
      expect(shortUrlRepository.incrementClickCount).toHaveBeenCalledBefore(redirect as any);
    });

    it('should redirect even if incrementClickCount fails (fire-and-forget)', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      (shortUrlRepository.getShortUrlByCode as any).mockResolvedValue(mockShortUrl);
      (shortUrlRepository.incrementClickCount as any).mockRejectedValue(new Error('Database error'));

      const props = {
        params: Promise.resolve({ code: 'abc123' }),
      };

      // Should still redirect despite click count failure
      await expect(ShortUrlRedirect(props)).rejects.toThrow('REDIRECT');

      expect(redirect).toHaveBeenCalled();

      // Verify error was logged (fire-and-forget behavior)
      await new Promise(resolve => setTimeout(resolve, 0)); // Let promise rejection handler run
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('invalid short codes', () => {
    it('should return 404 for non-existent code', async () => {
      (shortUrlRepository.getShortUrlByCode as any).mockResolvedValue(undefined);

      const props = {
        params: Promise.resolve({ code: 'invalid' }),
      };

      await expect(ShortUrlRedirect(props)).rejects.toThrow('NOT_FOUND');

      expect(shortUrlRepository.getShortUrlByCode).toHaveBeenCalledWith('invalid');
      expect(notFound).toHaveBeenCalled();
      expect(redirect).not.toHaveBeenCalled();
      expect(shortUrlRepository.incrementClickCount).not.toHaveBeenCalled();
    });

    it('should return 404 for empty code', async () => {
      (shortUrlRepository.getShortUrlByCode as any).mockResolvedValue(undefined);

      const props = {
        params: Promise.resolve({ code: '' }),
      };

      await expect(ShortUrlRedirect(props)).rejects.toThrow('NOT_FOUND');

      expect(notFound).toHaveBeenCalled();
    });

    it('should return 404 for code with special characters', async () => {
      (shortUrlRepository.getShortUrlByCode as any).mockResolvedValue(undefined);

      const props = {
        params: Promise.resolve({ code: 'abc@123' }),
      };

      await expect(ShortUrlRedirect(props)).rejects.toThrow('NOT_FOUND');

      expect(notFound).toHaveBeenCalled();
    });
  });

  describe('locale detection', () => {
    it('should use English locale from cookie in redirect URL', async () => {
      (shortUrlRepository.getShortUrlByCode as any).mockResolvedValue(mockShortUrl);

      const props = {
        params: Promise.resolve({ code: 'abc123' }),
      };

      await expect(ShortUrlRedirect(props)).rejects.toThrow(
        'REDIRECT: /en/tournaments/tournament-1/friend-groups/join/group-1'
      );
    });

    it('should use Spanish locale from cookie in redirect URL', async () => {
      (shortUrlRepository.getShortUrlByCode as any).mockResolvedValue(mockShortUrl);
      mockCookiesGet.mockReturnValue({ value: 'es' });

      const props = {
        params: Promise.resolve({ code: 'abc123' }),
      };

      await expect(ShortUrlRedirect(props)).rejects.toThrow(
        'REDIRECT: /es/tournaments/tournament-1/friend-groups/join/group-1'
      );
    });
  });

  describe('deleted tournament handling', () => {
    it('should redirect to global join page when tournament is deleted (tournament_id null)', async () => {
      const mockShortUrlDeletedTournament = { ...mockShortUrl, tournament_id: null };
      (shortUrlRepository.getShortUrlByCode as any).mockResolvedValue(mockShortUrlDeletedTournament);

      const props = {
        params: Promise.resolve({ code: 'abc123' }),
      };

      await expect(ShortUrlRedirect(props)).rejects.toThrow(
        'REDIRECT: /en/friend-groups/join/group-1'
      );

      expect(redirect).toHaveBeenCalledWith('/en/friend-groups/join/group-1');
    });
  });
});

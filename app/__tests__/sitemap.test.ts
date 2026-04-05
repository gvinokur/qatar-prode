import { describe, it, expect, vi, beforeEach } from 'vitest';
import sitemap from '../sitemap';

vi.mock('../db/tournament-repository', () => ({
  findAllActiveTournaments: vi.fn(),
}));

vi.mock('../db/prode-group-repository', () => ({
  findAllPublicGroupsForSitemap: vi.fn(),
}));

import { findAllActiveTournaments } from '../db/tournament-repository';
import { findAllPublicGroupsForSitemap } from '../db/prode-group-repository';

const mockTournament = { id: 'tour-1' } as any;
const mockGroup = { id: 'group-1' };

beforeEach(() => {
  vi.clearAllMocks();
  (findAllActiveTournaments as any).mockResolvedValue([]);
  (findAllPublicGroupsForSitemap as any).mockResolvedValue([]);
});

describe('sitemap', () => {
  describe('home pages', () => {
    it('returns home page URL entries for each locale when no tournaments or groups exist', async () => {
      const entries = await sitemap();
      const urls = entries.map((e) => e.url);
      expect(urls).toEqual(expect.arrayContaining([
        expect.stringContaining('/en'),
        expect.stringContaining('/es'),
      ]));
    });

    it('each home page entry has alternates.languages with both en and es', async () => {
      const entries = await sitemap();
      const homeEn = entries.find((e) => e.url.endsWith('/en'));
      expect(homeEn?.alternates?.languages).toMatchObject({
        en: expect.stringContaining('/en'),
        es: expect.stringContaining('/es'),
      });
    });
  });

  describe('tournament pages', () => {
    beforeEach(() => {
      (findAllActiveTournaments as any).mockResolvedValue([mockTournament]);
    });

    it('includes all 6 tournament sub-page types for each locale', async () => {
      const entries = await sitemap();
      const subPages = ['', '/results', '/rules', '/awards', '/stats', '/qualified-teams'];
      const locales = ['en', 'es'];

      for (const locale of locales) {
        for (const subPage of subPages) {
          const expected = expect.stringContaining(`/${locale}/tournaments/tour-1${subPage}`);
          expect(entries.map((e) => e.url)).toEqual(expect.arrayContaining([expected]));
        }
      }
    });

    it('each tournament entry has alternates.languages pointing to both locales', async () => {
      const entries = await sitemap();
      const tournamentMainEn = entries.find((e) => e.url.endsWith('/en/tournaments/tour-1'));
      expect(tournamentMainEn?.alternates?.languages).toMatchObject({
        en: expect.stringContaining('/en/tournaments/tour-1'),
        es: expect.stringContaining('/es/tournaments/tour-1'),
      });
    });

    it('returns no tournament entries when tournaments array is empty', async () => {
      (findAllActiveTournaments as any).mockResolvedValue([]);
      const entries = await sitemap();
      const hasTournamentUrl = entries.some((e) => e.url.includes('/tournaments/'));
      expect(hasTournamentUrl).toBe(false);
    });
  });

  describe('friend-group pages', () => {
    beforeEach(() => {
      (findAllPublicGroupsForSitemap as any).mockResolvedValue([mockGroup]);
    });

    it('includes friend-group entries for each locale', async () => {
      const entries = await sitemap();
      const urls = entries.map((e) => e.url);
      expect(urls).toEqual(expect.arrayContaining([
        expect.stringContaining('/en/friend-groups/group-1'),
        expect.stringContaining('/es/friend-groups/group-1'),
      ]));
    });

    it('each friend-group entry has alternates.languages with both locales', async () => {
      const entries = await sitemap();
      const groupEn = entries.find((e) => e.url.includes('/en/friend-groups/group-1'));
      expect(groupEn?.alternates?.languages).toMatchObject({
        en: expect.stringContaining('/en/friend-groups/group-1'),
        es: expect.stringContaining('/es/friend-groups/group-1'),
      });
    });

    it('returns no friend-group entries when public groups array is empty', async () => {
      (findAllPublicGroupsForSitemap as any).mockResolvedValue([]);
      const entries = await sitemap();
      const hasFriendGroupUrl = entries.some((e) => e.url.includes('/friend-groups/'));
      expect(hasFriendGroupUrl).toBe(false);
    });
  });

  describe('error handling', () => {
    it('re-throws when findAllActiveTournaments fails', async () => {
      (findAllActiveTournaments as any).mockRejectedValue(new Error('DB error'));
      await expect(sitemap()).rejects.toThrow('DB error');
    });

    it('re-throws when findAllPublicGroupsForSitemap fails', async () => {
      (findAllPublicGroupsForSitemap as any).mockRejectedValue(new Error('DB error'));
      await expect(sitemap()).rejects.toThrow('DB error');
    });
  });
});

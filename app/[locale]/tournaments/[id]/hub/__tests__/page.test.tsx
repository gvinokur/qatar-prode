import { describe, it, expect, vi, beforeEach } from 'vitest';
import TournamentHubRedirectPage from '../page';

const mockRedirect = vi.fn()

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}));

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getLocale: vi.fn().mockResolvedValue('es'),
}));

describe('TournamentHubRedirectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls redirect to /${locale}/tournaments/${id} for es locale', async () => {
    const { getLocale } = await import('next-intl/server');
    vi.mocked(getLocale).mockResolvedValue('es');

    await TournamentHubRedirectPage({ params: Promise.resolve({ id: 'tournament-1' }) });

    expect(mockRedirect).toHaveBeenCalledWith('/es/tournaments/tournament-1');
  });

  it('calls redirect to /${locale}/tournaments/${id} for en locale', async () => {
    const { getLocale } = await import('next-intl/server');
    vi.mocked(getLocale).mockResolvedValue('en');

    await TournamentHubRedirectPage({ params: Promise.resolve({ id: 'tournament-2' }) });

    expect(mockRedirect).toHaveBeenCalledWith('/en/tournaments/tournament-2');
  });

  it('redirect uses the correct tournamentId from params', async () => {
    const { getLocale } = await import('next-intl/server');
    vi.mocked(getLocale).mockResolvedValue('es');

    await TournamentHubRedirectPage({ params: Promise.resolve({ id: 'my-special-tournament' }) });

    expect(mockRedirect).toHaveBeenCalledWith('/es/tournaments/my-special-tournament');
  });
});

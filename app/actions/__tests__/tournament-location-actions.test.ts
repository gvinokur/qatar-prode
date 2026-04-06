import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTournamentLocations } from '../tournament-actions';
import * as tournamentRepository from '@/app/db/tournament-repository';
import { testFactories } from '../../../__tests__/db/test-factories';

vi.mock('@/app/db/tournament-repository', () => ({
  findTournamentById: vi.fn(),
  findAllTournaments: vi.fn(),
  findAllActiveTournaments: vi.fn(),
  findPastTournaments: vi.fn(),
  updateTournament: vi.fn(),
  createTournament: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
  getLocale: vi.fn().mockResolvedValue('en'),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

describe('getTournamentLocations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when tournament has no locations', async () => {
    vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(
      testFactories.tournament({ locations: [] })
    );

    const result = await getTournamentLocations('tournament-1');

    expect(result).toEqual([]);
  });

  it('returns array of location strings for tournament with locations', async () => {
    vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(
      testFactories.tournament({ locations: ['Qatar', 'Lusail', 'Al Rayyan'] })
    );

    const result = await getTournamentLocations('tournament-1');

    expect(result).toEqual(['Qatar', 'Lusail', 'Al Rayyan']);
  });

  it('returns empty array when tournament is not found', async () => {
    vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(undefined);

    const result = await getTournamentLocations('nonexistent-tournament');

    expect(result).toEqual([]);
  });

  it('calls findTournamentById with the provided tournamentId', async () => {
    vi.mocked(tournamentRepository.findTournamentById).mockResolvedValue(
      testFactories.tournament({ id: 'specific-id' })
    );

    await getTournamentLocations('specific-id');

    expect(tournamentRepository.findTournamentById).toHaveBeenCalledWith('specific-id');
  });
});

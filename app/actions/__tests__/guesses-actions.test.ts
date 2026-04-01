import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateOrCreateGameGuesses } from '../guesses-actions';
import { GameGuessNew } from '../../db/tables-definition';

vi.mock('../user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

vi.mock('../../db/game-guess-repository', () => ({
  updateOrCreateGuess: vi.fn(),
  updateGameGuessByGameId: vi.fn(),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(),
}));

vi.mock('../../db/game-repository', () => ({
  findGamesInTournament: vi.fn(),
}));

vi.mock('../../db/tournament-group-repository', () => ({
  findGroupsInTournament: vi.fn(),
}));

vi.mock('../../db/tournament-playoff-repository', () => ({
  findPlayoffStagesWithGamesInTournament: vi.fn(),
}));

vi.mock('../../db/tournament-guess-repository', () => ({
  updateOrCreateTournamentGuess: vi.fn(),
}));

vi.mock('../../utils/playoff-teams-calculator', () => ({
  calculatePlayoffTeamsFromPositions: vi.fn(),
}));

vi.mock('../../utils/ObjectUtils', () => ({
  toMap: vi.fn(),
}));

vi.mock('../../db/database', () => ({
  db: {},
}));

import { getLoggedInUser } from '../user-actions';
import { updateOrCreateGuess } from '../../db/game-guess-repository';
import { getTranslations } from 'next-intl/server';

describe('updateOrCreateGameGuesses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('success response includes analyticsEvent with name "prediction_submitted" and params { number_of_guesses, game_ids }', async () => {
    const mockUser = { id: 'user-1' };
    const mockGameGuesses: GameGuessNew[] = [
      {
        game_id: 'game-1',
        home_score: 2,
        away_score: 1,
        user_id: 'user-1',
      },
      {
        game_id: 'game-2',
        home_score: 1,
        away_score: 0,
        user_id: 'user-1',
      },
    ];

    vi.mocked(getLoggedInUser).mockResolvedValue(mockUser as never);
    vi.mocked(updateOrCreateGuess).mockResolvedValue({} as never);
    vi.mocked(getTranslations).mockResolvedValue(((key: string) => key) as never);

    const result = await updateOrCreateGameGuesses(mockGameGuesses);

    expect(result.success).toBe(true);
    expect(result.analyticsEvent).toBeDefined();
    expect(result.analyticsEvent?.name).toBe('prediction_submitted');
    expect(result.analyticsEvent?.params).toEqual({
      number_of_guesses: 2,
      game_ids: ['game-1', 'game-2'],
    });
  });

  it('error response does NOT include analyticsEvent', async () => {
    const mockGameGuesses: GameGuessNew[] = [
      {
        game_id: 'game-1',
        home_score: 2,
        away_score: 1,
        user_id: 'user-1',
      },
    ];

    vi.mocked(getLoggedInUser).mockResolvedValue(null as never);
    vi.mocked(getTranslations).mockResolvedValue((() => 'guess.unauthorized') as never);

    const result = await updateOrCreateGameGuesses(mockGameGuesses);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.analyticsEvent).toBeUndefined();
  });

  it('analyticsEvent.params.number_of_guesses matches the number of guesses passed in', async () => {
    const mockUser = { id: 'user-1' };
    const mockGameGuesses: GameGuessNew[] = [
      {
        game_id: 'game-1',
        home_score: 2,
        away_score: 1,
        user_id: 'user-1',
      },
      {
        game_id: 'game-2',
        home_score: 1,
        away_score: 0,
        user_id: 'user-1',
      },
      {
        game_id: 'game-3',
        home_score: 3,
        away_score: 2,
        user_id: 'user-1',
      },
    ];

    vi.mocked(getLoggedInUser).mockResolvedValue(mockUser as never);
    vi.mocked(updateOrCreateGuess).mockResolvedValue({} as never);
    vi.mocked(getTranslations).mockResolvedValue(((key: string) => key) as never);

    const result = await updateOrCreateGameGuesses(mockGameGuesses);

    expect(result.success).toBe(true);
    expect(result.analyticsEvent?.params.number_of_guesses).toBe(3);
    expect(result.analyticsEvent?.params.number_of_guesses).toBe(mockGameGuesses.length);
  });
});

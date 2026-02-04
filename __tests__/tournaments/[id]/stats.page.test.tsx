import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { redirect } from 'next/navigation';
import TournamentStatsPage from '../../../app/tournaments/[id]/stats/page';
import { getLoggedInUser } from '../../../app/actions/user-actions';
import {
  getGameGuessStatisticsForUsers,
  getBoostAllocationBreakdown,
  findGameGuessesByUserId,
} from '../../../app/db/game-guess-repository';
import { findTournamentGuessByUserIdTournament } from '../../../app/db/tournament-guess-repository';
import { getTournamentPredictionCompletion } from '../../../app/db/tournament-prediction-completion-repository';
import { findTournamentById } from '../../../app/db/tournament-repository';
import { findGamesInTournament } from '../../../app/db/game-repository';
import { testFactories } from '../../db/test-factories';
import type { GameStatisticForUser, BoostAllocationBreakdown } from '../../../types/definitions';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT_TO:${url}`);
  }),
}));

// Mock user actions
vi.mock('../../../app/actions/user-actions', () => ({
  getLoggedInUser: vi.fn(),
}));

// Mock repositories
vi.mock('../../../app/db/game-guess-repository', () => ({
  getGameGuessStatisticsForUsers: vi.fn(),
  getBoostAllocationBreakdown: vi.fn(),
  findGameGuessesByUserId: vi.fn(),
}));

vi.mock('../../../app/db/tournament-guess-repository', () => ({
  findTournamentGuessByUserIdTournament: vi.fn(),
}));

vi.mock('../../../app/db/tournament-prediction-completion-repository', () => ({
  getTournamentPredictionCompletion: vi.fn(),
}));

vi.mock('../../../app/db/tournament-repository', () => ({
  findTournamentById: vi.fn(),
}));

vi.mock('../../../app/db/game-repository', () => ({
  findGamesInTournament: vi.fn(),
}));

describe('TournamentStatsPage', () => {
  const mockTournamentId = 'tournament-1';
  const mockUser = testFactories.user({ id: 'user-1', nickname: 'TestUser' });
  const mockTournament = testFactories.tournament({
    id: mockTournamentId,
    game_exact_score_points: 10,
    game_correct_outcome_points: 5,
    max_silver_games: 5,
    max_golden_games: 3,
  });

  const mockGameStats: GameStatisticForUser = {
    user_id: 'user-1',
    total_predictions: 32,
    group_correct_guesses: 15,
    group_exact_guesses: 6,
    group_score: 92,
    group_boost_bonus: 15,
    playoff_correct_guesses: 5,
    playoff_exact_guesses: 2,
    playoff_score: 45,
    playoff_boost_bonus: 10,
  };

  const mockTournamentGuess = testFactories.tournamentGuess({
    id: 'guess-1',
    user_id: 'user-1',
    tournament_id: mockTournamentId,
    honor_roll_score: 35,
    individual_awards_score: 15,
    qualified_teams_score: 8,
    group_position_score: 27,
  });

  const mockSilverBoostData: BoostAllocationBreakdown = {
    boostType: 'silver',
    available: 5,
    used: 4,
    scoredGames: 3,
    pointsEarned: 18,
    allocationByGroup: [
      { groupLetter: 'A', count: 1 },
      { groupLetter: 'B', count: 2 },
    ],
    allocationPlayoffs: 1,
  };

  const mockGoldenBoostData: BoostAllocationBreakdown = {
    boostType: 'golden',
    available: 3,
    used: 2,
    scoredGames: 2,
    pointsEarned: 20,
    allocationByGroup: [{ groupLetter: 'C', count: 1 }],
    allocationPlayoffs: 1,
  };

  const mockPredictionCompletion = {
    total_games: 38,
    predicted_games: 32,
    completion_percentage: 84.2,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    vi.mocked(getLoggedInUser).mockResolvedValue(mockUser);

    // Default: tournament exists
    vi.mocked(findTournamentById).mockResolvedValue(mockTournament);

    // Default: user has stats
    vi.mocked(getGameGuessStatisticsForUsers).mockResolvedValue([mockGameStats]);
    vi.mocked(findTournamentGuessByUserIdTournament).mockResolvedValue(mockTournamentGuess);
    vi.mocked(getBoostAllocationBreakdown)
      .mockResolvedValueOnce(mockSilverBoostData)
      .mockResolvedValueOnce(mockGoldenBoostData);
    vi.mocked(getTournamentPredictionCompletion).mockResolvedValue(mockPredictionCompletion);

    // Mock game guesses (32 predictions)
    const mockGameGuesses = Array.from({ length: 32 }, (_, i) =>
      testFactories.gameGuess({ id: `guess-${i + 1}`, user_id: mockUser.id })
    );
    vi.mocked(findGameGuessesByUserId).mockResolvedValue(mockGameGuesses);

    // Mock all games (38 total)
    const mockGames = Array.from({ length: 38 }, (_, i) =>
      testFactories.game({ id: `game-${i + 1}`, tournament_id: mockTournamentId })
    );
    vi.mocked(findGamesInTournament).mockResolvedValue(mockGames as any);
  });

  describe('Authentication', () => {
    it('redirects to tournament page when user is not authenticated', async () => {
      vi.mocked(getLoggedInUser).mockResolvedValue(null);

      const props = {
        params: Promise.resolve({ id: mockTournamentId }),
        searchParams: Promise.resolve({}),
      };

      await expect(TournamentStatsPage(props)).rejects.toThrow(`REDIRECT_TO:/tournaments/${mockTournamentId}`);
      expect(redirect).toHaveBeenCalledWith(`/tournaments/${mockTournamentId}`);
    });

    it('renders stats page when user is authenticated', async () => {
      const props = {
        params: Promise.resolve({ id: mockTournamentId }),
        searchParams: Promise.resolve({}),
      };

      const result = await TournamentStatsPage(props);
      render(result);

      // Should render the performance card
      expect(screen.getByText('Rendimiento General')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('fetches all required data with correct parameters', async () => {
      const props = {
        params: Promise.resolve({ id: mockTournamentId }),
        searchParams: Promise.resolve({}),
      };

      await TournamentStatsPage(props);

      expect(getLoggedInUser).toHaveBeenCalled();
      expect(findTournamentById).toHaveBeenCalledWith(mockTournamentId);
      expect(getGameGuessStatisticsForUsers).toHaveBeenCalledWith([mockUser.id], mockTournamentId);
      expect(findTournamentGuessByUserIdTournament).toHaveBeenCalledWith(mockUser.id, mockTournamentId);
      expect(getBoostAllocationBreakdown).toHaveBeenCalledWith(mockUser.id, mockTournamentId, 'silver');
      expect(getBoostAllocationBreakdown).toHaveBeenCalledWith(mockUser.id, mockTournamentId, 'golden');
      expect(getTournamentPredictionCompletion).toHaveBeenCalledWith(
        mockUser.id,
        mockTournamentId,
        mockTournament
      );
    });
  });

  describe('Performance Overview Card', () => {
    it('displays total points and breakdown correctly', async () => {
      const props = {
        params: Promise.resolve({ id: mockTournamentId }),
        searchParams: Promise.resolve({}),
      };

      const result = await TournamentStatsPage(props);
      render(result);

      // Total points
      expect(screen.getByText('Rendimiento General')).toBeInTheDocument();

      // Group stage points
      expect(screen.getByText('92')).toBeInTheDocument(); // group game points
      expect(screen.getByText('8')).toBeInTheDocument(); // qualified teams
      expect(screen.getByText('27')).toBeInTheDocument(); // group positions

      // Boost bonuses
      expect(screen.getByText('+15')).toBeInTheDocument(); // group boost
      expect(screen.getByText('+10')).toBeInTheDocument(); // playoff boost

      // Playoff stage points
      expect(screen.getByText('45')).toBeInTheDocument(); // playoff game points
      expect(screen.getByText('35')).toBeInTheDocument(); // honor roll
      expect(screen.getByText('15')).toBeInTheDocument(); // individual awards
    });

    it('calculates total points correctly', async () => {
      const props = {
        params: Promise.resolve({ id: mockTournamentId }),
        searchParams: Promise.resolve({}),
      };

      const result = await TournamentStatsPage(props);
      render(result);

      // Total should be: 92 + 15 + 8 + 27 + 45 + 10 + 35 + 15 = 247
      expect(screen.getByText('247')).toBeInTheDocument();
    });
  });

  // Note: Detailed rendering of cards is tested in component tests.
  // Page tests focus on integration and data flow.

  describe('Edge Cases', () => {
    it('handles empty game statistics gracefully', async () => {
      vi.mocked(getGameGuessStatisticsForUsers).mockResolvedValue([]);

      // Mock tournament guess with zero values for empty state
      vi.mocked(findTournamentGuessByUserIdTournament).mockResolvedValue({
        ...mockTournamentGuess,
        honor_roll_score: 0,
        individual_awards_score: 0,
        qualified_teams_score: 0,
        group_position_score: 0,
      });

      const props = {
        params: Promise.resolve({ id: mockTournamentId }),
        searchParams: Promise.resolve({}),
      };

      const result = await TournamentStatsPage(props);
      render(result);

      // Should render cards with zero values (empty state)
      expect(screen.getByText('Rendimiento General')).toBeInTheDocument();
      expect(screen.getByText(/Comienza a predecir/i)).toBeInTheDocument();
    });

    it('handles null tournament guess gracefully', async () => {
      vi.mocked(findTournamentGuessByUserIdTournament).mockResolvedValue(null);

      const props = {
        params: Promise.resolve({ id: mockTournamentId }),
        searchParams: Promise.resolve({}),
      };

      const result = await TournamentStatsPage(props);
      render(result);

      // Should render without errors, using zero for null values
      expect(screen.getByText('Rendimiento General')).toBeInTheDocument();
    });

    it('handles zero predictions correctly', async () => {
      const emptyStats: GameStatisticForUser = {
        user_id: 'user-1',
        total_predictions: 0,
        group_correct_guesses: 0,
        group_exact_guesses: 0,
        group_score: 0,
        group_boost_bonus: 0,
        playoff_correct_guesses: 0,
        playoff_exact_guesses: 0,
        playoff_score: 0,
        playoff_boost_bonus: 0,
      };

      vi.mocked(getGameGuessStatisticsForUsers).mockResolvedValue([emptyStats]);

      // Also mock tournament guess with zero values
      vi.mocked(findTournamentGuessByUserIdTournament).mockResolvedValue({
        ...mockTournamentGuess,
        honor_roll_score: 0,
        individual_awards_score: 0,
        qualified_teams_score: 0,
        group_position_score: 0,
      });

      const emptyBoostData: BoostAllocationBreakdown = {
        boostType: 'silver',
        available: 5,
        used: 0,
        scoredGames: 0,
        pointsEarned: 0,
        allocationByGroup: [],
        allocationPlayoffs: 0,
      };

      vi.mocked(getBoostAllocationBreakdown)
        .mockResolvedValueOnce(emptyBoostData)
        .mockResolvedValueOnce({ ...emptyBoostData, boostType: 'golden', available: 3 });

      const props = {
        params: Promise.resolve({ id: mockTournamentId }),
        searchParams: Promise.resolve({}),
      };

      const result = await TournamentStatsPage(props);
      render(result);

      // Verify tabs are rendered and first tab (Performance) shows empty state
      expect(screen.getByRole('tab', { name: /rendimiento/i })).toBeInTheDocument();
      expect(screen.getByText('Rendimiento General')).toBeInTheDocument();
      // Empty state message is tested in component tests
    });

    it('handles division by zero in percentage calculations', async () => {
      const statsWithZero: GameStatisticForUser = {
        user_id: 'user-1',
        total_predictions: 0,
        group_correct_guesses: 0,
        group_exact_guesses: 0,
        group_score: 0,
        group_boost_bonus: 0,
        playoff_correct_guesses: 0,
        playoff_exact_guesses: 0,
        playoff_score: 0,
        playoff_boost_bonus: 0,
      };

      vi.mocked(getGameGuessStatisticsForUsers).mockResolvedValue([statsWithZero]);
      vi.mocked(getTournamentPredictionCompletion).mockResolvedValue({
        total_games: 38,
        predicted_games: 0,
        completion_percentage: 0,
      });

      const props = {
        params: Promise.resolve({ id: mockTournamentId }),
        searchParams: Promise.resolve({}),
      };

      const result = await TournamentStatsPage(props);

      // Should not throw error
      expect(() => render(result)).not.toThrow();
    });
  });

  describe('Layout', () => {
    it('renders with tabbed interface', async () => {
      const props = {
        params: Promise.resolve({ id: mockTournamentId }),
        searchParams: Promise.resolve({}),
      };

      const result = await TournamentStatsPage(props);
      render(result);

      // Check that tabs are rendered
      expect(screen.getByRole('tab', { name: /rendimiento/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /precisión/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /análisis de boosts/i })).toBeInTheDocument();

      // Check that the first tab content is visible by default
      expect(screen.getByText('Rendimiento General')).toBeInTheDocument();
    });
  });
});

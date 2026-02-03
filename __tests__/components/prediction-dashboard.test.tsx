import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import type { ExtendedGameData } from '../../app/definitions';
import type { Tournament } from '../../app/db/tables-definition';

// Mock GuessesContext to avoid NextAuth module resolution issues
vi.mock('../../app/components/context-providers/guesses-context-provider', () => {
  const React = require('react');
  return {
    GuessesContext: React.createContext({
      gameGuesses: {},
      setGameGuesses: vi.fn(),
    }),
  };
});

// Import AFTER mock is set up
import { PredictionDashboard } from '../../app/components/prediction-dashboard';
import { GuessesContext } from '../../app/components/context-providers/guesses-context-provider';

// Mock child components
vi.mock('../../app/components/prediction-status-bar', () => ({
  PredictionStatusBar: ({ totalGames, predictedGames, silverUsed, goldenUsed, urgentGames, warningGames, noticeGames }: any) => (
    <div data-testid="prediction-status-bar">
      <div data-testid="total-games">{totalGames}</div>
      <div data-testid="predicted-games">{predictedGames}</div>
      <div data-testid="silver-used">{silverUsed}</div>
      <div data-testid="golden-used">{goldenUsed}</div>
      <div data-testid="urgent-games">{urgentGames}</div>
      <div data-testid="warning-games">{warningGames}</div>
      <div data-testid="notice-games">{noticeGames}</div>
    </div>
  ),
}));

vi.mock('../../app/components/games-grid', () => ({
  default: ({ games }: any) => (
    <div data-testid="games-grid">
      <div data-testid="games-count">{games.length}</div>
    </div>
  ),
}));

describe('PredictionDashboard', () => {
  const mockTournament: Tournament = {
    id: 'tournament-1',
    short_name: 'TT',
    long_name: 'Test Tournament',
    is_active: true,
    champion_team_id: null,
    runner_up_team_id: null,
    third_place_team_id: null,
    theme: null,
    max_silver_games: 20,
    max_golden_games: 10,
  } as Tournament;

  const mockTeamsMap = {
    'team-1': { id: 'team-1', name: 'Team A', short_name: 'TA', theme: null },
    'team-2': { id: 'team-2', name: 'Team B', short_name: 'TB', theme: null },
  };

  const createMockGame = (id: string, dateOffset: number): ExtendedGameData => ({
    id,
    game_date: new Date(Date.now() + dateOffset),
    home_team: 'team-1',
    away_team: 'team-2',
    tournament_id: 'tournament-1',
    game_number: 1,
  } as ExtendedGameData);

  const mockContextValue = {
    gameGuesses: {},
    setGameGuesses: vi.fn(),
    guessedPositions: [],
    updateGameGuess: vi.fn(),
    pendingSaves: new Set<string>(),
    saveErrors: {},
    clearSaveError: vi.fn(),
    flushPendingSave: vi.fn(),
  };

  const renderWithContext = (ui: React.ReactElement, contextValue = mockContextValue) => {
    return render(
      <GuessesContext.Provider value={contextValue}>
        {ui}
      </GuessesContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Prediction Count Calculation', () => {
    it('counts games with both scores as predicted', () => {
      const games = [
        createMockGame('game-1', 1000000),
        createMockGame('game-2', 2000000),
        createMockGame('game-3', 3000000),
      ];

      const gameGuesses = {
        'game-1': { home_score: 2, away_score: 1 },
        'game-2': { home_score: 1, away_score: 1 },
        'game-3': { home_score: null, away_score: null },
      };

      renderWithContext(
        <PredictionDashboard
          games={games}
          teamsMap={mockTeamsMap}
          tournament={mockTournament}
          isPlayoffs={false}
          isLoggedIn={true}
          tournamentId="tournament-1"
          dashboardStats={{
            totalGames: 3,
            predictedGames: 2,
            silverUsed: 0,
            goldenUsed: 0,
          }}
        />,
        { ...mockContextValue, gameGuesses }
      );

      expect(screen.getByTestId('total-games')).toHaveTextContent('3');
      expect(screen.getByTestId('predicted-games')).toHaveTextContent('2');
    });

    it('does not count games with only one score', () => {
      const games = [
        createMockGame('game-1', 1000000),
        createMockGame('game-2', 2000000),
      ];

      const gameGuesses = {
        'game-1': { home_score: 2, away_score: null },
        'game-2': { home_score: null, away_score: 1 },
      };

      renderWithContext(
        <PredictionDashboard
          games={games}
          teamsMap={mockTeamsMap}
          tournament={mockTournament}
          isPlayoffs={false}
          isLoggedIn={true}
          tournamentId="tournament-1"
          dashboardStats={{
            totalGames: 2,
            predictedGames: 0,
            silverUsed: 0,
            goldenUsed: 0,
          }}
        />,
        { ...mockContextValue, gameGuesses }
      );

      expect(screen.getByTestId('predicted-games')).toHaveTextContent('0');
    });

    it('does not count games with undefined scores', () => {
      const games = [createMockGame('game-1', 1000000)];

      const gameGuesses = {
        'game-1': { home_score: undefined, away_score: undefined },
      };

      renderWithContext(
        <PredictionDashboard
          games={games}
          teamsMap={mockTeamsMap}
          tournament={mockTournament}
          isPlayoffs={false}
          isLoggedIn={true}
          tournamentId="tournament-1"
          dashboardStats={{
            totalGames: 1,
            predictedGames: 0,
            silverUsed: 0,
            goldenUsed: 0,
          }}
        />,
        { ...mockContextValue, gameGuesses }
      );

      expect(screen.getByTestId('predicted-games')).toHaveTextContent('0');
    });

    it('handles games with score 0 correctly', () => {
      const games = [createMockGame('game-1', 1000000)];

      const gameGuesses = {
        'game-1': { home_score: 0, away_score: 0 },
      };

      renderWithContext(
        <PredictionDashboard
          games={games}
          teamsMap={mockTeamsMap}
          tournament={mockTournament}
          isPlayoffs={false}
          isLoggedIn={true}
          tournamentId="tournament-1"
          dashboardStats={{
            totalGames: 1,
            predictedGames: 1,
            silverUsed: 0,
            goldenUsed: 0,
          }}
        />,
        { ...mockContextValue, gameGuesses }
      );

      expect(screen.getByTestId('predicted-games')).toHaveTextContent('1');
    });
  });

  describe('Boost Count Calculation (Tournament-Wide)', () => {
    it('counts silver boosts across all games in context', () => {
      const games = [createMockGame('game-1', 1000000)];

      const gameGuesses = {
        'game-1': { home_score: 2, away_score: 1, boost_type: 'silver' },
        'game-2': { home_score: 1, away_score: 0, boost_type: 'silver' }, // Not in current view
        'game-3': { home_score: 3, away_score: 2, boost_type: null },
      };

      renderWithContext(
        <PredictionDashboard
          games={games}
          teamsMap={mockTeamsMap}
          tournament={mockTournament}
          isPlayoffs={false}
          isLoggedIn={true}
          tournamentId="tournament-1"
          dashboardStats={{
            totalGames: 1,
            predictedGames: 1,
            silverUsed: 2,
            goldenUsed: 0,
          }}
        />,
        { ...mockContextValue, gameGuesses }
      );

      // Should count 2 silver boosts (including game-2 not in current view)
      expect(screen.getByTestId('silver-used')).toHaveTextContent('2');
    });

    it('counts golden boosts across all games in context', () => {
      const games = [createMockGame('game-1', 1000000)];

      const gameGuesses = {
        'game-1': { home_score: 2, away_score: 1, boost_type: 'golden' },
        'game-2': { home_score: 1, away_score: 0, boost_type: 'golden' }, // Not in current view
        'game-3': { home_score: 3, away_score: 2, boost_type: 'golden' }, // Not in current view
      };

      renderWithContext(
        <PredictionDashboard
          games={games}
          teamsMap={mockTeamsMap}
          tournament={mockTournament}
          isPlayoffs={false}
          isLoggedIn={true}
          tournamentId="tournament-1"
          dashboardStats={{
            totalGames: 1,
            predictedGames: 1,
            silverUsed: 0,
            goldenUsed: 3,
          }}
        />,
        { ...mockContextValue, gameGuesses }
      );

      // Should count 3 golden boosts (including games not in current view)
      expect(screen.getByTestId('golden-used')).toHaveTextContent('3');
    });
  });


  describe('Component Integration', () => {
    it('passes games to GamesGrid', () => {
      const games = [
        createMockGame('game-1', 1000000),
        createMockGame('game-2', 2000000),
      ];

      renderWithContext(
        <PredictionDashboard
          games={games}
          teamsMap={mockTeamsMap}
          tournament={mockTournament}
          isPlayoffs={false}
          isLoggedIn={true}
          tournamentId="tournament-1"
          dashboardStats={{
            totalGames: 2,
            predictedGames: 0,
            silverUsed: 0,
            goldenUsed: 0,
          }}
        />,
        mockContextValue
      );

      expect(screen.getByTestId('games-count')).toHaveTextContent('2');
    });

    it('renders both status bar and games grid', () => {
      const games = [createMockGame('game-1', 1000000)];

      renderWithContext(
        <PredictionDashboard
          games={games}
          teamsMap={mockTeamsMap}
          tournament={mockTournament}
          isPlayoffs={false}
          isLoggedIn={true}
          tournamentId="tournament-1"
          dashboardStats={{
            totalGames: 1,
            predictedGames: 0,
            silverUsed: 0,
            goldenUsed: 0,
          }}
        />,
        mockContextValue
      );

      expect(screen.getByTestId('prediction-status-bar')).toBeInTheDocument();
      expect(screen.getByTestId('games-grid')).toBeInTheDocument();
    });
  });
});

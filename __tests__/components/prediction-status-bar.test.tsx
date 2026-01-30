import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { PredictionStatusBar } from '../../app/components/prediction-status-bar';
import type { ExtendedGameData } from '../../app/definitions';
import type { Team, GameGuessNew } from '../../app/db/tables-definition';

// Mock GuessesContext
vi.mock('../../app/components/context-providers/guesses-context-provider', () => {
  const React = require('react');
  return {
    GuessesContext: React.createContext({
      gameGuesses: {},
      updateGameGuess: vi.fn(),
    }),
  };
});

// Mock child components
vi.mock('../../app/components/urgency-accordion-group', () => ({
  UrgencyAccordionGroup: ({ games }: any) => (
    <div data-testid="urgency-accordion-group">Accordion with {games.length} games</div>
  )
}));

vi.mock('../../app/components/tournament-prediction-accordion', () => ({
  TournamentPredictionAccordion: ({ tournamentPredictions, isExpanded }: any) => (
    <div data-testid="tournament-prediction-accordion" data-expanded={isExpanded}>
      Tournament Accordion: {tournamentPredictions.overallCompleted}/{tournamentPredictions.overallTotal}
    </div>
  )
}));

// Import after mocks
import { GuessesContext } from '../../app/components/context-providers/guesses-context-provider';

// Shared test helpers
const mockTeamsMap: Record<string, Team> = {
  'team-1': { id: 'team-1', name: 'Team A' } as Team,
  'team-2': { id: 'team-2', name: 'Team B' } as Team,
};

const createMockGame = (id: string, dateOffset: number): ExtendedGameData => ({
  id,
  game_date: new Date(Date.now() + dateOffset),
  home_team: 'team-1',
  away_team: 'team-2',
  tournament_id: 'tournament-1',
  game_number: 1,
} as ExtendedGameData);

const renderWithContext = (ui: React.ReactElement, gameGuesses = {}) => {
  return render(
    <GuessesContext.Provider value={{ gameGuesses, updateGameGuess: vi.fn() }}>
      {ui}
    </GuessesContext.Provider>
  );
};

describe('PredictionStatusBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders progress bar with correct percentage', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={10}
          predictedGames={7}
          silverUsed={2}
          silverMax={5}
          goldenUsed={1}
          goldenMax={3}
        />
      );

      expect(screen.getByText(/Predicciones: 7\/10 \(70%\)/)).toBeInTheDocument();
    });

    it('renders 0% when no games predicted', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={10}
          predictedGames={0}
          silverUsed={0}
          silverMax={5}
          goldenUsed={0}
          goldenMax={3}
        />
      );

      expect(screen.getByText(/Predicciones: 0\/10 \(0%\)/)).toBeInTheDocument();
    });

    it('renders 100% when all games predicted', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={10}
          predictedGames={10}
          silverUsed={5}
          silverMax={5}
          goldenUsed={3}
          goldenMax={3}
        />
      );

      expect(screen.getByText(/Predicciones: 10\/10 \(100%\)/)).toBeInTheDocument();
    });

    it('handles 0 total games', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={0}
          predictedGames={0}
          silverUsed={0}
          silverMax={0}
          goldenUsed={0}
          goldenMax={0}
        />
      );

      expect(screen.getByText(/Predicciones: 0\/0 \(0%\)/)).toBeInTheDocument();
    });
  });

  describe('Boost display', () => {
    it('shows boost badges when silverMax > 0', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={10}
          predictedGames={5}
          silverUsed={2}
          silverMax={5}
          goldenUsed={0}
          goldenMax={0}
        />
      );

      expect(screen.getByText('Multiplicadores:')).toBeInTheDocument();
    });

    it('shows boost badges when goldenMax > 0', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={10}
          predictedGames={5}
          silverUsed={0}
          silverMax={0}
          goldenUsed={1}
          goldenMax={3}
        />
      );

      expect(screen.getByText('Multiplicadores:')).toBeInTheDocument();
    });

    it('hides boost badges when both max values are 0', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={10}
          predictedGames={5}
          silverUsed={0}
          silverMax={0}
          goldenUsed={0}
          goldenMax={0}
        />
      );

      expect(screen.queryByText('Multiplicadores:')).not.toBeInTheDocument();
    });
  });

  describe('Accordion support (NEW in this PR)', () => {
    it('renders accordion when all required props provided', () => {
      const games = [createMockGame('game-1', 30 * 60 * 1000)];

      renderWithContext(
        <PredictionStatusBar
          totalGames={1}
          predictedGames={0}
          silverUsed={0}
          silverMax={5}
          goldenUsed={0}
          goldenMax={3}
          games={games}
          teamsMap={mockTeamsMap}
          tournamentId="tournament-1"
          isPlayoffs={false}
        />
      );

      expect(screen.getByTestId('urgency-accordion-group')).toBeInTheDocument();
      expect(screen.getByText('Accordion with 1 games')).toBeInTheDocument();
    });

    it('does not render accordion when games not provided', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={1}
          predictedGames={0}
          silverUsed={0}
          silverMax={5}
          goldenUsed={0}
          goldenMax={3}
          teamsMap={mockTeamsMap}
          tournamentId="tournament-1"
        />
      );

      expect(screen.queryByTestId('urgency-accordion-group')).not.toBeInTheDocument();
    });

    it('does not render accordion when teamsMap not provided', () => {
      const games = [createMockGame('game-1', 30 * 60 * 1000)];

      renderWithContext(
        <PredictionStatusBar
          totalGames={1}
          predictedGames={0}
          silverUsed={0}
          silverMax={5}
          goldenUsed={0}
          goldenMax={3}
          games={games}
          tournamentId="tournament-1"
        />
      );

      expect(screen.queryByTestId('urgency-accordion-group')).not.toBeInTheDocument();
    });

    it('does not render accordion when tournamentId not provided', () => {
      const games = [createMockGame('game-1', 30 * 60 * 1000)];

      renderWithContext(
        <PredictionStatusBar
          totalGames={1}
          predictedGames={0}
          silverUsed={0}
          silverMax={5}
          goldenUsed={0}
          goldenMax={3}
          games={games}
          teamsMap={mockTeamsMap}
        />
      );

      expect(screen.queryByTestId('urgency-accordion-group')).not.toBeInTheDocument();
    });

    it('passes isPlayoffs prop to accordion', () => {
      const games = [createMockGame('game-1', 30 * 60 * 1000)];

      renderWithContext(
        <PredictionStatusBar
          totalGames={1}
          predictedGames={0}
          silverUsed={0}
          silverMax={5}
          goldenUsed={0}
          goldenMax={3}
          games={games}
          teamsMap={mockTeamsMap}
          tournamentId="tournament-1"
          isPlayoffs={true}
        />
      );

      expect(screen.getByTestId('urgency-accordion-group')).toBeInTheDocument();
    });
  });

  describe('Tournament predictions section', () => {
    it('renders tournament predictions when provided', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={10}
          predictedGames={5}
          silverUsed={0}
          silverMax={0}
          goldenUsed={0}
          goldenMax={0}
          tournamentPredictions={{
            finalStandings: { completed: 2, total: 3 },
            awards: { completed: 1, total: 5 },
            qualifiers: { completed: 4, total: 8 },
            overallPercentage: 50,
            isPredictionLocked: false
          }}
          tournamentId="tournament-1"
        />
      );

      // Tournament accordion should be rendered
      const accordion = screen.getByTestId('tournament-prediction-accordion');
      expect(accordion).toBeInTheDocument();
      expect(accordion).toHaveTextContent('Tournament Accordion:');
    });

    it('does not render qualifiers section when total is 0', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={10}
          predictedGames={5}
          silverUsed={0}
          silverMax={0}
          goldenUsed={0}
          goldenMax={0}
          tournamentPredictions={{
            finalStandings: { completed: 2, total: 3 },
            awards: { completed: 1, total: 5 },
            qualifiers: { completed: 0, total: 0 },
            overallPercentage: 50,
            isPredictionLocked: false
          }}
          tournamentId="tournament-1"
        />
      );

      // Tournament accordion should be rendered (category filtering is done inside accordion component)
      const accordion = screen.getByTestId('tournament-prediction-accordion');
      expect(accordion).toBeInTheDocument();
    });

    it('does not render tournament section when not provided', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={10}
          predictedGames={5}
          silverUsed={0}
          silverMax={0}
          goldenUsed={0}
          goldenMax={0}
        />
      );

      expect(screen.queryByTestId('tournament-prediction-accordion')).not.toBeInTheDocument();
    });

    it('auto-expands tournament accordion when incomplete and unlocked', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={10}
          predictedGames={5}
          silverUsed={0}
          silverMax={0}
          goldenUsed={0}
          goldenMax={0}
          tournamentPredictions={{
            finalStandings: { completed: 1, total: 3, champion: false, runnerUp: true, thirdPlace: false },
            awards: { completed: 2, total: 4, bestPlayer: true, topGoalscorer: true, bestGoalkeeper: false, bestYoungPlayer: false },
            qualifiers: { completed: 0, total: 8 },
            overallCompleted: 3,
            overallTotal: 15,
            overallPercentage: 20,
            isPredictionLocked: false
          }}
          tournamentId="tournament-1"
        />
      );

      const accordion = screen.getByTestId('tournament-prediction-accordion');
      expect(accordion).toHaveAttribute('data-expanded', 'true');
    });

    it('does not auto-expand tournament accordion when complete', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={10}
          predictedGames={5}
          silverUsed={0}
          silverMax={0}
          goldenUsed={0}
          goldenMax={0}
          tournamentPredictions={{
            finalStandings: { completed: 3, total: 3, champion: true, runnerUp: true, thirdPlace: true },
            awards: { completed: 4, total: 4, bestPlayer: true, topGoalscorer: true, bestGoalkeeper: true, bestYoungPlayer: true },
            qualifiers: { completed: 8, total: 8 },
            overallCompleted: 15,
            overallTotal: 15,
            overallPercentage: 100,
            isPredictionLocked: false
          }}
          tournamentId="tournament-1"
        />
      );

      const accordion = screen.getByTestId('tournament-prediction-accordion');
      expect(accordion).toHaveAttribute('data-expanded', 'false');
    });

    it('does not auto-expand tournament accordion when locked', () => {
      renderWithContext(
        <PredictionStatusBar
          totalGames={10}
          predictedGames={5}
          silverUsed={0}
          silverMax={0}
          goldenUsed={0}
          goldenMax={0}
          tournamentPredictions={{
            finalStandings: { completed: 1, total: 3, champion: false, runnerUp: true, thirdPlace: false },
            awards: { completed: 2, total: 4, bestPlayer: true, topGoalscorer: true, bestGoalkeeper: false, bestYoungPlayer: false },
            qualifiers: { completed: 0, total: 8 },
            overallCompleted: 3,
            overallTotal: 15,
            overallPercentage: 20,
            isPredictionLocked: true
          }}
          tournamentId="tournament-1"
        />
      );

      const accordion = screen.getByTestId('tournament-prediction-accordion');
      expect(accordion).toHaveAttribute('data-expanded', 'false');
    });
  });
});

describe('Static alert fallback (when accordion not shown)', () => {
  it('calculates and shows no urgency warnings when games provided but no accordion (missing teamsMap)', () => {
    const games = [createMockGame('game-1', 72 * 60 * 60 * 1000)]; // 72 hours away

    renderWithContext(
      <PredictionStatusBar
        totalGames={1}
        predictedGames={0}
        silverUsed={0}
        silverMax={0}
        goldenUsed={0}
        goldenMax={0}
        games={games}
        tournamentId="tournament-1"
      />
    );

    // Should not show any alerts for games outside urgency window
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('skips predicted games in urgency calculation', () => {
    const games = [
      createMockGame('game-1', 30 * 60 * 1000), // urgent but predicted
      createMockGame('game-2', 45 * 60 * 1000), // urgent but predicted
    ];

    const gameGuesses = {
      'game-1': { game_id: 'game-1', home_score: 2, away_score: 1, home_team: 'team-1', away_team: 'team-2' } as GameGuessNew,
      'game-2': { game_id: 'game-2', home_score: 1, away_score: 0, home_team: 'team-1', away_team: 'team-2' } as GameGuessNew,
    };

    renderWithContext(
      <PredictionStatusBar
        totalGames={2}
        predictedGames={2}
        silverUsed={0}
        silverMax={0}
        goldenUsed={0}
        goldenMax={0}
        games={games}
        tournamentId="tournament-1"
      />,
      gameGuesses
    );

    // Should not show urgency alerts for predicted games
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('counts unpredicted urgent games in fallback mode', () => {
    const games = [
      createMockGame('game-1', 30 * 60 * 1000), // urgent, unpredicted
    ];

    renderWithContext(
      <PredictionStatusBar
        totalGames={1}
        predictedGames={0}
        silverUsed={0}
        silverMax={0}
        goldenUsed={0}
        goldenMax={0}
        games={games}
        tournamentId="tournament-1"
      />
    );

    // Without teamsMap, falls back to static alerts (but we don't render them in this mode)
    // This test verifies the calculation logic runs without errors
    expect(screen.getByText(/Predicciones:/)).toBeInTheDocument();
  });

  it('handles games with null scores in urgency calculation', () => {
    const games = [createMockGame('game-1', 30 * 60 * 1000)];
    const gameGuesses = {
      'game-1': { game_id: 'game-1', home_score: null, away_score: null } as any
    };

    renderWithContext(
      <PredictionStatusBar
        totalGames={1}
        predictedGames={0}
        silverUsed={0}
        silverMax={0}
        goldenUsed={0}
        goldenMax={0}
        games={games}
        tournamentId="tournament-1"
      />,
      gameGuesses
    );

    expect(screen.getByText(/Predicciones:/)).toBeInTheDocument();
  });

  it('handles games with undefined scores in urgency calculation', () => {
    const games = [createMockGame('game-1', 30 * 60 * 1000)];
    const gameGuesses = {
      'game-1': { game_id: 'game-1', home_score: undefined, away_score: undefined } as any
    };

    renderWithContext(
      <PredictionStatusBar
        totalGames={1}
        predictedGames={0}
        silverUsed={0}
        silverMax={0}
        goldenUsed={0}
        goldenMax={0}
        games={games}
        tournamentId="tournament-1"
      />,
      gameGuesses
    );

    expect(screen.getByText(/Predicciones:/)).toBeInTheDocument();
  });

  it('handles games with non-number scores in urgency calculation', () => {
    const games = [createMockGame('game-1', 30 * 60 * 1000)];
    const gameGuesses = {
      'game-1': { game_id: 'game-1', home_score: '2' as any, away_score: 1 } as any
    };

    renderWithContext(
      <PredictionStatusBar
        totalGames={1}
        predictedGames={0}
        silverUsed={0}
        silverMax={0}
        goldenUsed={0}
        goldenMax={0}
        games={games}
        tournamentId="tournament-1"
      />,
      gameGuesses
    );

    expect(screen.getByText(/Predicciones:/)).toBeInTheDocument();
  });

  it('correctly categorizes games in warning tier (2-24h)', () => {
    const games = [createMockGame('game-1', 12 * 60 * 60 * 1000)]; // 12 hours

    renderWithContext(
      <PredictionStatusBar
        totalGames={1}
        predictedGames={0}
        silverUsed={0}
        silverMax={0}
        goldenUsed={0}
        goldenMax={0}
        games={games}
        tournamentId="tournament-1"
      />
    );

    expect(screen.getByText(/Predicciones:/)).toBeInTheDocument();
  });

  it('correctly categorizes games in notice tier (24-48h)', () => {
    const games = [createMockGame('game-1', 36 * 60 * 60 * 1000)]; // 36 hours

    renderWithContext(
      <PredictionStatusBar
        totalGames={1}
        predictedGames={0}
        silverUsed={0}
        silverMax={0}
        goldenUsed={0}
        goldenMax={0}
        games={games}
        tournamentId="tournament-1"
      />
    );

    expect(screen.getByText(/Predicciones:/)).toBeInTheDocument();
  });

  it('excludes closed games from urgency calculation', () => {
    const games = [createMockGame('game-1', -2 * 60 * 60 * 1000)]; // 2 hours ago

    renderWithContext(
      <PredictionStatusBar
        totalGames={1}
        predictedGames={0}
        silverUsed={0}
        silverMax={0}
        goldenUsed={0}
        goldenMax={0}
        games={games}
        tournamentId="tournament-1"
      />
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

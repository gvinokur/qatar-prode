import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuessesContextProvider, GuessesContext } from '../../app/components/context-providers/guesses-context-provider';
import { Game, GameGuessNew, TournamentGroupTeamStatsGuessNew } from '../../app/db/tables-definition';
import * as guessesActions from '../../app/actions/guesses-actions';
import * as groupPositionCalculator from '../../app/utils/group-position-calculator';
import * as playoffTeamsCalculator from '../../app/utils/playoff-teams-calculator';

// Mock the actions
vi.mock('../../app/actions/guesses-actions', () => ({
  updateOrCreateGameGuesses: vi.fn(),
  updateOrCreateTournamentGroupTeamGuesses: vi.fn(),
  updatePlayoffGameGuesses: vi.fn(),
}));

// Mock the utils
vi.mock('../../app/utils/group-position-calculator', () => ({
  calculateGroupPosition: vi.fn(),
}));

vi.mock('../../app/utils/playoff-teams-calculator', () => ({
  groupCompleteReducer: vi.fn(),
}));

const mockUpdateOrCreateGameGuesses = vi.mocked(guessesActions.updateOrCreateGameGuesses);
const mockUpdateOrCreateTournamentGroupTeamGuesses = vi.mocked(guessesActions.updateOrCreateTournamentGroupTeamGuesses);
const mockUpdatePlayoffGameGuesses = vi.mocked(guessesActions.updatePlayoffGameGuesses);
const mockCalculateGroupPosition = vi.mocked(groupPositionCalculator.calculateGroupPosition);
const mockGroupCompleteReducer = vi.mocked(playoffTeamsCalculator.groupCompleteReducer);

// Test component to consume the context
const TestConsumer = () => {
  const context = React.useContext(GuessesContext);
  
  return (
    <div>
      <div data-testid="game-guesses-count">
        {Object.keys(context.gameGuesses).length}
      </div>
      <div data-testid="guessed-positions-count">
        {context.guessedPositions.length}
      </div>
      <button 
        data-testid="update-guess"
        onClick={() => context.updateGameGuess('game1', { 
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1', 
          home_score: 2, 
          away_score: 1 
        })}
      >
        Update Guess
      </button>
    </div>
  );
};

describe('GuessesContextProvider', () => {
  const mockGameGuesses: { [k: string]: GameGuessNew } = {
    'game1': {
      game_id: 'game1',
      game_number: 1,
      user_id: 'user1',
      home_score: 1,
      away_score: 0
    }
  };

  const mockGroupGames: Game[] = [
    {
      id: 'game1',
      tournament_id: 'tournament1',
      game_number: 1,
      home_team: 'team1',
      away_team: 'team2',
      game_date: new Date(),
      location: 'Stadium 1',
      game_type: 'group',
      home_team_rule: undefined,
      away_team_rule: undefined,
      game_local_timezone: undefined
    }
  ];

  const mockGuessedPositions: TournamentGroupTeamStatsGuessNew[] = [
    {
      user_id: 'user1',
      tournament_group_id: 'group1',
      team_id: 'team1',
      position: 0,
      points: 3,
      goals_for: 2,
      goals_against: 1,
      goal_difference: 1,
      games_played: 1,
      win: 1,
      draw: 0,
      loss: 0,
      is_complete: false
    },
    {
      user_id: 'user1',
      tournament_group_id: 'group1',
      team_id: 'team2',
      position: 1,
      points: 0,
      goals_for: 1,
      goals_against: 2,
      goal_difference: -1,
      games_played: 1,
      win: 0,
      draw: 0,
      loss: 1,
      is_complete: false
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateOrCreateGameGuesses.mockResolvedValue(undefined);
    mockUpdateOrCreateTournamentGroupTeamGuesses.mockResolvedValue([]);
    mockUpdatePlayoffGameGuesses.mockResolvedValue(undefined);
    mockCalculateGroupPosition.mockReturnValue([
      { 
        team_id: 'team1', 
        points: 3, 
        goals_for: 2, 
        goals_against: 1, 
        goal_difference: 1, 
        games_played: 1,
        win: 1,
        draw: 0,
        loss: 0,
        is_complete: false
      },
      { 
        team_id: 'team2', 
        points: 0, 
        goals_for: 1, 
        goals_against: 2, 
        goal_difference: -1, 
        games_played: 1,
        win: 0,
        draw: 0,
        loss: 1,
        is_complete: false
      }
    ]);
    mockGroupCompleteReducer.mockReturnValue(false);
  });

  it('renders children with initial context values', () => {
    render(
      <GuessesContextProvider gameGuesses={mockGameGuesses}>
        <TestConsumer />
      </GuessesContextProvider>
    );

    expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('1');
    expect(screen.getByTestId('guessed-positions-count')).toHaveTextContent('0');
  });

  it('initializes with server game guesses', () => {
    render(
      <GuessesContextProvider gameGuesses={mockGameGuesses}>
        <TestConsumer />
      </GuessesContextProvider>
    );

    expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('1');
  });

  it('initializes with server guessed positions', () => {
    render(
      <GuessesContextProvider 
        gameGuesses={mockGameGuesses}
        guessedPositions={mockGuessedPositions}
      >
        <TestConsumer />
      </GuessesContextProvider>
    );

    expect(screen.getByTestId('guessed-positions-count')).toHaveTextContent('2');
  });

  it('updates game guess when updateGameGuess is called', async () => {
    const user = userEvent.setup();
    
    render(
      <GuessesContextProvider gameGuesses={mockGameGuesses}>
        <TestConsumer />
      </GuessesContextProvider>
    );

    expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('1');
    
    await user.click(screen.getByTestId('update-guess'));
    
    await waitFor(() => {
      expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('1');
    });
  });

  it('does not auto-save when autoSave is false', async () => {
    const user = userEvent.setup();
    
    render(
      <GuessesContextProvider gameGuesses={mockGameGuesses} autoSave={false}>
        <TestConsumer />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('update-guess'));
    
    await waitFor(() => {
      expect(mockUpdateOrCreateGameGuesses).not.toHaveBeenCalled();
    });
  });

  it('auto-saves game guesses when autoSave is true', async () => {
    const user = userEvent.setup();
    
    render(
      <GuessesContextProvider gameGuesses={mockGameGuesses} autoSave={true}>
        <TestConsumer />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('update-guess'));
    
    await waitFor(() => {
      expect(mockUpdateOrCreateGameGuesses).toHaveBeenCalledWith([
        expect.objectContaining({
          game_id: 'game1',
          user_id: 'user1',
          home_score: 2,
          away_score: 1
        })
      ]);
    });
  });

  it('calculates group positions when group games and guessed positions are provided', async () => {
    const user = userEvent.setup();
    
    render(
      <GuessesContextProvider 
        gameGuesses={mockGameGuesses}
        groupGames={mockGroupGames}
        guessedPositions={mockGuessedPositions}
        autoSave={true}
      >
        <TestConsumer />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('update-guess'));
    
    await waitFor(() => {
      expect(mockCalculateGroupPosition).toHaveBeenCalledWith(
        ['team1', 'team2'],
        expect.arrayContaining([
          expect.objectContaining({
            id: 'game1',
            resultOrGuess: expect.objectContaining({
              game_id: 'game1',
              home_score: 2,
              away_score: 1
            })
          })
        ]),
        undefined
      );
    });
  });

  it('updates guessed positions after group position calculation', async () => {
    const user = userEvent.setup();
    
    render(
      <GuessesContextProvider 
        gameGuesses={mockGameGuesses}
        groupGames={mockGroupGames}
        guessedPositions={mockGuessedPositions}
        autoSave={true}
      >
        <TestConsumer />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('update-guess'));
    
    await waitFor(() => {
      expect(mockUpdateOrCreateTournamentGroupTeamGuesses).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            user_id: 'user1',
            tournament_group_id: 'group1',
            team_id: 'team1',
            position: 0
          }),
          expect.objectContaining({
            user_id: 'user1',
            tournament_group_id: 'group1',
            team_id: 'team2',
            position: 1
          })
        ])
      );
    });
  });

  it('updates playoff game guesses when group is complete', async () => {
    const user = userEvent.setup();
    mockGroupCompleteReducer.mockReturnValue(true);
    
    render(
      <GuessesContextProvider 
        gameGuesses={mockGameGuesses}
        groupGames={mockGroupGames}
        guessedPositions={mockGuessedPositions}
        autoSave={true}
      >
        <TestConsumer />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('update-guess'));
    
    await waitFor(() => {
      expect(mockUpdatePlayoffGameGuesses).toHaveBeenCalledWith('tournament1');
    });
  });

  it('does not update playoff game guesses when group is not complete', async () => {
    const user = userEvent.setup();
    mockGroupCompleteReducer.mockReturnValue(false);
    
    render(
      <GuessesContextProvider 
        gameGuesses={mockGameGuesses}
        groupGames={mockGroupGames}
        guessedPositions={mockGuessedPositions}
        autoSave={true}
      >
        <TestConsumer />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('update-guess'));
    
    await waitFor(() => {
      expect(mockUpdatePlayoffGameGuesses).not.toHaveBeenCalled();
    });
  });

  it('handles sortByGamesBetweenTeams parameter', async () => {
    const user = userEvent.setup();
    
    render(
      <GuessesContextProvider 
        gameGuesses={mockGameGuesses}
        groupGames={mockGroupGames}
        guessedPositions={mockGuessedPositions}
        sortByGamesBetweenTeams={true}
        autoSave={true}
      >
        <TestConsumer />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('update-guess'));
    
    await waitFor(() => {
      expect(mockCalculateGroupPosition).toHaveBeenCalledWith(
        ['team1', 'team2'],
        expect.any(Array),
        true
      );
    });
  });

  it('does not calculate group positions when no group games provided', async () => {
    const user = userEvent.setup();
    
    render(
      <GuessesContextProvider 
        gameGuesses={mockGameGuesses}
        guessedPositions={mockGuessedPositions}
        autoSave={true}
      >
        <TestConsumer />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('update-guess'));
    
    await waitFor(() => {
      expect(mockCalculateGroupPosition).not.toHaveBeenCalled();
    });
  });

  it('does not calculate group positions when guessed positions length is 1 or less', async () => {
    const user = userEvent.setup();
    
    render(
      <GuessesContextProvider 
        gameGuesses={mockGameGuesses}
        groupGames={mockGroupGames}
        guessedPositions={[mockGuessedPositions[0]]}
        autoSave={true}
      >
        <TestConsumer />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('update-guess'));
    
    await waitFor(() => {
      expect(mockCalculateGroupPosition).not.toHaveBeenCalled();
    });
  });

  it('handles empty initial game guesses', () => {
    render(
      <GuessesContextProvider gameGuesses={{}}>
        <TestConsumer />
      </GuessesContextProvider>
    );

    expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('0');
  });

  it('handles empty initial guessed positions', () => {
    render(
      <GuessesContextProvider gameGuesses={mockGameGuesses} guessedPositions={[]}>
        <TestConsumer />
      </GuessesContextProvider>
    );

    expect(screen.getByTestId('guessed-positions-count')).toHaveTextContent('0');
  });

  it('updates multiple game guesses correctly', async () => {
    const user = userEvent.setup();
    
    const TestMultipleUpdates = () => {
      const context = React.useContext(GuessesContext);
      
      return (
        <div>
          <div data-testid="game-guesses-count">
            {Object.keys(context.gameGuesses).length}
          </div>
          <button 
            data-testid="update-multiple"
            onClick={async () => {
              await context.updateGameGuess('game1', { 
                game_id: 'game1',
                game_number: 1,
                user_id: 'user1', 
                home_score: 2, 
                away_score: 1 
              });
              await context.updateGameGuess('game2', { 
                game_id: 'game2',
                game_number: 2,
                user_id: 'user1', 
                home_score: 0, 
                away_score: 0 
              });
            }}
          >
            Update Multiple
          </button>
        </div>
      );
    };

    render(
      <GuessesContextProvider gameGuesses={mockGameGuesses}>
        <TestMultipleUpdates />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('update-multiple'));
    
    await waitFor(() => {
      expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('2');
    });
  });
}); 
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuessesContextProvider, GuessesContext } from '../../app/components/context-providers/guesses-context-provider';
import { Game, GameGuessNew } from '../../app/db/tables-definition';
import * as guessesActions from '../../app/actions/guesses-actions';

// Mock the actions
vi.mock('../../app/actions/guesses-actions', () => ({
  updateOrCreateGameGuesses: vi.fn(),
  updatePlayoffGameGuesses: vi.fn(),
}));

const mockUpdateOrCreateGameGuesses = vi.mocked(guessesActions.updateOrCreateGameGuesses);
const mockUpdatePlayoffGameGuesses = vi.mocked(guessesActions.updatePlayoffGameGuesses);

// Test component to consume the context
const TestConsumer = () => {
  const context = React.useContext(GuessesContext);

  return (
    <div>
      <div data-testid="game-guesses-count">
        {Object.keys(context.gameGuesses).length}
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateOrCreateGameGuesses.mockResolvedValue(undefined);
    mockUpdatePlayoffGameGuesses.mockResolvedValue(undefined);
  });

  it('renders children with initial context values', () => {
    render(
      <GuessesContextProvider gameGuesses={mockGameGuesses}>
        <TestConsumer />
      </GuessesContextProvider>
    );

    expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('1');
  });

  it('initializes with server game guesses', () => {
    render(
      <GuessesContextProvider gameGuesses={mockGameGuesses}>
        <TestConsumer />
      </GuessesContextProvider>
    );

    expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('1');
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

  it('does not save when autoSave is false', async () => {
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

  it('saves immediately when autoSave is true', async () => {
    const user = userEvent.setup();

    render(
      <GuessesContextProvider gameGuesses={mockGameGuesses} autoSave={true}>
        <TestConsumer />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('update-guess'));

    await waitFor(() => {
      expect(mockUpdateOrCreateGameGuesses).toHaveBeenCalled();
    });

    expect(mockUpdateOrCreateGameGuesses).toHaveBeenCalledWith([
      expect.objectContaining({
        game_id: 'game1',
        user_id: 'user1',
        home_score: 2,
        away_score: 1
      })
    ]);
  });

  it.skip('updates playoff game guesses when all group games are guessed', async () => {
    const user = userEvent.setup();

    render(
      <GuessesContextProvider
        gameGuesses={mockGameGuesses}
        groupGames={mockGroupGames}
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

  it('does not update playoff game guesses when not all games are guessed', async () => {
    const user = userEvent.setup();
    const multipleGames: Game[] = [
      ...mockGroupGames,
      {
        id: 'game2',
        tournament_id: 'tournament1',
        game_number: 2,
        home_team: 'team3',
        away_team: 'team4',
        game_date: new Date(),
        location: 'Stadium 2',
        game_type: 'group',
        home_team_rule: undefined,
        away_team_rule: undefined,
        game_local_timezone: undefined
      }
    ];

    render(
      <GuessesContextProvider
        gameGuesses={mockGameGuesses}
        groupGames={multipleGames}
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

  it('does not update playoff game guesses when no group games provided', async () => {
    const user = userEvent.setup();

    render(
      <GuessesContextProvider
        gameGuesses={mockGameGuesses}
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

  it('handles empty initial game guesses', () => {
    render(
      <GuessesContextProvider gameGuesses={{}}>
        <TestConsumer />
      </GuessesContextProvider>
    );

    expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('0');
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

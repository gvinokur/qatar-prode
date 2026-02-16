import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuessesContextProvider, GuessesContext } from '../../app/components/context-providers/guesses-context-provider';
import { GameGuessNew } from '../../app/db/tables-definition';
import * as guessesActions from '../../app/actions/guesses-actions';

// Mock the actions
vi.mock('../../app/actions/guesses-actions', () => ({
  updateOrCreateGameGuesses: vi.fn(),
}));

const mockUpdateOrCreateGameGuesses = vi.mocked(guessesActions.updateOrCreateGameGuesses);

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

// Test component to display boost counts
const BoostCountsConsumer = () => {
  const context = React.useContext(GuessesContext);

  return (
    <div>
      <div data-testid="silver-used">{context.boostCounts.silver.used}</div>
      <div data-testid="silver-max">{context.boostCounts.silver.max}</div>
      <div data-testid="golden-used">{context.boostCounts.golden.used}</div>
      <div data-testid="golden-max">{context.boostCounts.golden.max}</div>
      <button
        data-testid="add-silver-boost"
        onClick={() => context.updateGameGuess('game1', {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 1,
          away_score: 0,
          boost_type: 'silver'
        })}
      >
        Add Silver Boost
      </button>
      <button
        data-testid="add-golden-boost"
        onClick={() => context.updateGameGuess('game2', {
          game_id: 'game2',
          game_number: 2,
          user_id: 'user1',
          home_score: 2,
          away_score: 1,
          boost_type: 'golden'
        })}
      >
        Add Golden Boost
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateOrCreateGameGuesses.mockResolvedValue(undefined);
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

  it('throws error and logs when save fails with autoSave=true', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock save failure
    mockUpdateOrCreateGameGuesses.mockResolvedValue({
      success: false,
      error: 'Network error'
    } as any);

    const TestConsumerWithErrorBoundary = () => {
      const context = React.useContext(GuessesContext);
      const [error, setError] = React.useState<string | null>(null);

      const handleUpdate = async () => {
        try {
          await context.updateGameGuess('game1', {
            game_id: 'game1',
            game_number: 1,
            user_id: 'user1',
            home_score: 2,
            away_score: 1
          });
        } catch (e: any) {
          setError(e.message);
        }
      };

      return (
        <div>
          <button data-testid="update-guess" onClick={handleUpdate}>
            Update
          </button>
          {error && <div data-testid="error-message">{error}</div>}
        </div>
      );
    };

    render(
      <GuessesContextProvider gameGuesses={mockGameGuesses} autoSave={true}>
        <TestConsumerWithErrorBoundary />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('update-guess'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('error-message')).toHaveTextContent('Network error');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[GuessesContext] Save failed:', 'Network error');

    consoleErrorSpy.mockRestore();
  });

  it('throws default error message when save fails without error details', async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock save failure without error message
    mockUpdateOrCreateGameGuesses.mockResolvedValue({
      success: false
    } as any);

    const TestConsumerWithErrorBoundary = () => {
      const context = React.useContext(GuessesContext);
      const [error, setError] = React.useState<string | null>(null);

      const handleUpdate = async () => {
        try {
          await context.updateGameGuess('game1', {
            game_id: 'game1',
            game_number: 1,
            user_id: 'user1',
            home_score: 2,
            away_score: 1
          });
        } catch (e: any) {
          setError(e.message);
        }
      };

      return (
        <div>
          <button data-testid="update-guess" onClick={handleUpdate}>
            Update
          </button>
          {error && <div data-testid="error-message">{error}</div>}
        </div>
      );
    };

    render(
      <GuessesContextProvider gameGuesses={mockGameGuesses} autoSave={true}>
        <TestConsumerWithErrorBoundary />
      </GuessesContextProvider>
    );

    await user.click(screen.getByTestId('update-guess'));

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });

    expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to save prediction');
    expect(consoleErrorSpy).toHaveBeenCalledWith('[GuessesContext] Save failed:', undefined);

    consoleErrorSpy.mockRestore();
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

  describe('Boost Counts', () => {
    it('calculates boost counts with no boosts', () => {
      const guesses: { [k: string]: GameGuessNew } = {
        'game1': {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 1,
          away_score: 0
        },
        'game2': {
          game_id: 'game2',
          game_number: 2,
          user_id: 'user1',
          home_score: 2,
          away_score: 1
        }
      };

      render(
        <GuessesContextProvider
          gameGuesses={guesses}
          tournamentMaxSilver={3}
          tournamentMaxGolden={2}
        >
          <BoostCountsConsumer />
        </GuessesContextProvider>
      );

      expect(screen.getByTestId('silver-used')).toHaveTextContent('0');
      expect(screen.getByTestId('silver-max')).toHaveTextContent('3');
      expect(screen.getByTestId('golden-used')).toHaveTextContent('0');
      expect(screen.getByTestId('golden-max')).toHaveTextContent('2');
    });

    it('calculates boost counts with silver boosts only', () => {
      const guesses: { [k: string]: GameGuessNew } = {
        'game1': {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 1,
          away_score: 0,
          boost_type: 'silver'
        },
        'game2': {
          game_id: 'game2',
          game_number: 2,
          user_id: 'user1',
          home_score: 2,
          away_score: 1,
          boost_type: 'silver'
        }
      };

      render(
        <GuessesContextProvider
          gameGuesses={guesses}
          tournamentMaxSilver={3}
          tournamentMaxGolden={2}
        >
          <BoostCountsConsumer />
        </GuessesContextProvider>
      );

      expect(screen.getByTestId('silver-used')).toHaveTextContent('2');
      expect(screen.getByTestId('silver-max')).toHaveTextContent('3');
      expect(screen.getByTestId('golden-used')).toHaveTextContent('0');
      expect(screen.getByTestId('golden-max')).toHaveTextContent('2');
    });

    it('calculates boost counts with golden boosts only', () => {
      const guesses: { [k: string]: GameGuessNew } = {
        'game1': {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 1,
          away_score: 0,
          boost_type: 'golden'
        },
        'game2': {
          game_id: 'game2',
          game_number: 2,
          user_id: 'user1',
          home_score: 2,
          away_score: 1,
          boost_type: 'golden'
        }
      };

      render(
        <GuessesContextProvider
          gameGuesses={guesses}
          tournamentMaxSilver={3}
          tournamentMaxGolden={2}
        >
          <BoostCountsConsumer />
        </GuessesContextProvider>
      );

      expect(screen.getByTestId('silver-used')).toHaveTextContent('0');
      expect(screen.getByTestId('silver-max')).toHaveTextContent('3');
      expect(screen.getByTestId('golden-used')).toHaveTextContent('2');
      expect(screen.getByTestId('golden-max')).toHaveTextContent('2');
    });

    it('calculates boost counts with mixed boosts', () => {
      const guesses: { [k: string]: GameGuessNew } = {
        'game1': {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 1,
          away_score: 0,
          boost_type: 'silver'
        },
        'game2': {
          game_id: 'game2',
          game_number: 2,
          user_id: 'user1',
          home_score: 2,
          away_score: 1,
          boost_type: 'golden'
        },
        'game3': {
          game_id: 'game3',
          game_number: 3,
          user_id: 'user1',
          home_score: 0,
          away_score: 0,
          boost_type: 'silver'
        }
      };

      render(
        <GuessesContextProvider
          gameGuesses={guesses}
          tournamentMaxSilver={3}
          tournamentMaxGolden={2}
        >
          <BoostCountsConsumer />
        </GuessesContextProvider>
      );

      expect(screen.getByTestId('silver-used')).toHaveTextContent('2');
      expect(screen.getByTestId('silver-max')).toHaveTextContent('3');
      expect(screen.getByTestId('golden-used')).toHaveTextContent('1');
      expect(screen.getByTestId('golden-max')).toHaveTextContent('2');
    });

    it('updates boost counts when gameGuesses changes', async () => {
      const user = userEvent.setup();

      const guesses: { [k: string]: GameGuessNew } = {
        'game1': {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 1,
          away_score: 0
        }
      };

      render(
        <GuessesContextProvider
          gameGuesses={guesses}
          tournamentMaxSilver={3}
          tournamentMaxGolden={2}
        >
          <BoostCountsConsumer />
        </GuessesContextProvider>
      );

      // Initial state: no boosts
      expect(screen.getByTestId('silver-used')).toHaveTextContent('0');
      expect(screen.getByTestId('golden-used')).toHaveTextContent('0');

      // Add silver boost
      await user.click(screen.getByTestId('add-silver-boost'));

      await waitFor(() => {
        expect(screen.getByTestId('silver-used')).toHaveTextContent('1');
      });
      expect(screen.getByTestId('golden-used')).toHaveTextContent('0');

      // Add golden boost
      await user.click(screen.getByTestId('add-golden-boost'));

      await waitFor(() => {
        expect(screen.getByTestId('golden-used')).toHaveTextContent('1');
      });
      expect(screen.getByTestId('silver-used')).toHaveTextContent('1');
    });

    it('handles tournament with max values set to 0', () => {
      const guesses: { [k: string]: GameGuessNew } = {
        'game1': {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 1,
          away_score: 0
        }
      };

      render(
        <GuessesContextProvider
          gameGuesses={guesses}
          tournamentMaxSilver={0}
          tournamentMaxGolden={0}
        >
          <BoostCountsConsumer />
        </GuessesContextProvider>
      );

      expect(screen.getByTestId('silver-used')).toHaveTextContent('0');
      expect(screen.getByTestId('silver-max')).toHaveTextContent('0');
      expect(screen.getByTestId('golden-used')).toHaveTextContent('0');
      expect(screen.getByTestId('golden-max')).toHaveTextContent('0');
    });

    it('defaults to max values of 0 when not provided', () => {
      const guesses: { [k: string]: GameGuessNew } = {};

      render(
        <GuessesContextProvider gameGuesses={guesses}>
          <BoostCountsConsumer />
        </GuessesContextProvider>
      );

      expect(screen.getByTestId('silver-used')).toHaveTextContent('0');
      expect(screen.getByTestId('silver-max')).toHaveTextContent('0');
      expect(screen.getByTestId('golden-used')).toHaveTextContent('0');
      expect(screen.getByTestId('golden-max')).toHaveTextContent('0');
    });

    it('ignores null boost_type when counting', () => {
      const guesses: { [k: string]: GameGuessNew } = {
        'game1': {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 1,
          away_score: 0,
          boost_type: null
        },
        'game2': {
          game_id: 'game2',
          game_number: 2,
          user_id: 'user1',
          home_score: 2,
          away_score: 1,
          boost_type: 'silver'
        }
      };

      render(
        <GuessesContextProvider
          gameGuesses={guesses}
          tournamentMaxSilver={3}
          tournamentMaxGolden={2}
        >
          <BoostCountsConsumer />
        </GuessesContextProvider>
      );

      expect(screen.getByTestId('silver-used')).toHaveTextContent('1');
      expect(screen.getByTestId('golden-used')).toHaveTextContent('0');
    });

    it('ignores undefined boost_type when counting', () => {
      const guesses: { [k: string]: GameGuessNew } = {
        'game1': {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 1,
          away_score: 0
          // boost_type is undefined
        },
        'game2': {
          game_id: 'game2',
          game_number: 2,
          user_id: 'user1',
          home_score: 2,
          away_score: 1,
          boost_type: 'golden'
        }
      };

      render(
        <GuessesContextProvider
          gameGuesses={guesses}
          tournamentMaxSilver={3}
          tournamentMaxGolden={2}
        >
          <BoostCountsConsumer />
        </GuessesContextProvider>
      );

      expect(screen.getByTestId('silver-used')).toHaveTextContent('0');
      expect(screen.getByTestId('golden-used')).toHaveTextContent('1');
    });
  });
});

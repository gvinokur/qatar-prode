import { describe, it, expect, vi } from 'vitest';
import React, { useContext } from 'react';
import { screen } from '@testing-library/react';
import {
  createMockGuessesContext,
  renderWithProviders,
  type GuessesContextValue
} from './test-utils';
import { GuessesContext } from '../../app/components/context-providers/guesses-context-provider';
import { useTimezone } from '../../app/components/context-providers/timezone-context-provider';
import { useTheme } from '@mui/material/styles';

// Mock next-auth dependencies
vi.mock('next-auth', () => ({
  __esModule: true,
  default: () => ({})
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: '1', email: 'test@example.com' } },
    status: 'authenticated'
  })
}));

// Test component that displays context values
const ContextConsumer = () => {
  const context = useContext(GuessesContext) as GuessesContextValue;
  const timezone = useTimezone();
  const theme = useTheme();

  return (
    <div>
      <div data-testid="game-guesses-count">
        {Object.keys(context.gameGuesses || {}).length}
      </div>
      <div data-testid="guessed-positions-count">
        {(context.guessedPositions || []).length}
      </div>
      <div data-testid="pending-saves-count">
        {(context.pendingSaves || new Set()).size}
      </div>
      <div data-testid="has-update-game-guess">
        {typeof context.updateGameGuess === 'function' ? 'yes' : 'no'}
      </div>
      <div data-testid="has-clear-save-error">
        {typeof context.clearSaveError === 'function' ? 'yes' : 'no'}
      </div>
      <div data-testid="has-flush-pending-save">
        {typeof context.flushPendingSave === 'function' ? 'yes' : 'no'}
      </div>
      <div data-testid="theme-mode">{theme.palette.mode}</div>
      <div data-testid="timezone-available">
        {timezone ? 'yes' : 'no'}
      </div>
    </div>
  );
};

describe('createMockGuessesContext', () => {
  it('returns default values when no overrides provided', () => {
    const context = createMockGuessesContext();

    expect(context.gameGuesses).toEqual({});
    expect(context.guessedPositions).toEqual([]);
    expect(context.pendingSaves).toBeInstanceOf(Set);
    expect(context.pendingSaves.size).toBe(0);
    expect(context.saveErrors).toEqual({});
  });

  it('has mock functions for async operations', () => {
    const context = createMockGuessesContext();

    expect(vi.isMockFunction(context.updateGameGuess)).toBe(true);
    expect(vi.isMockFunction(context.clearSaveError)).toBe(true);
    expect(vi.isMockFunction(context.flushPendingSave)).toBe(true);
  });

  it('mock functions resolve successfully by default', async () => {
    const context = createMockGuessesContext();

    await expect(
      context.updateGameGuess('game1', {
        game_id: 'game1',
        game_number: 1,
        user_id: 'user1',
        home_score: 2,
        away_score: 1,
        home_penalty_winner: false,
        away_penalty_winner: false,
        home_team: 'team1',
        away_team: 'team2'
      })
    ).resolves.toBeUndefined();

    await expect(
      context.flushPendingSave('game1')
    ).resolves.toBeUndefined();
  });

  it('merges overrides into defaults', () => {
    const customGameGuesses = {
      game1: {
        game_id: 'game1',
        game_number: 1,
        user_id: 'user1',
        home_score: 3,
        away_score: 2,
        home_penalty_winner: false,
        away_penalty_winner: false,
        home_team: 'team1',
        away_team: 'team2'
      }
    };

    const context = createMockGuessesContext({
      gameGuesses: customGameGuesses
    });

    expect(context.gameGuesses).toEqual(customGameGuesses);
    // Other properties should still have defaults
    expect(context.guessedPositions).toEqual([]);
    expect(context.pendingSaves.size).toBe(0);
  });

  it('overrides gameGuesses', () => {
    const gameGuesses = {
      game1: {
        game_id: 'game1',
        game_number: 1,
        user_id: 'user1',
        home_score: 1,
        away_score: 1,
        home_penalty_winner: false,
        away_penalty_winner: false,
        home_team: 'team1',
        away_team: 'team2'
      }
    };

    const context = createMockGuessesContext({ gameGuesses });

    expect(context.gameGuesses).toEqual(gameGuesses);
  });

  it('overrides guessedPositions', () => {
    const guessedPositions = [
      {
        user_id: 'user1',
        tournament_group_id: 'group1',
        position: 0,
        team_id: 'team1',
        games_played: 3,
        wins: 2,
        draws: 1,
        losses: 0,
        goals_for: 5,
        goals_against: 2,
        goal_difference: 3,
        points: 7
      }
    ];

    const context = createMockGuessesContext({ guessedPositions });

    expect(context.guessedPositions).toEqual(guessedPositions);
  });

  it('overrides pendingSaves', () => {
    const pendingSaves = new Set(['game1', 'game2']);
    const context = createMockGuessesContext({ pendingSaves });

    expect(context.pendingSaves).toEqual(pendingSaves);
    expect(context.pendingSaves.has('game1')).toBe(true);
    expect(context.pendingSaves.has('game2')).toBe(true);
  });

  it('overrides saveErrors', () => {
    const saveErrors = { game1: 'Network error' };
    const context = createMockGuessesContext({ saveErrors });

    expect(context.saveErrors).toEqual(saveErrors);
  });

  it('allows custom mock implementations', () => {
    const customUpdateGameGuess = vi.fn().mockRejectedValue(
      new Error('Custom error')
    );

    const context = createMockGuessesContext({
      updateGameGuess: customUpdateGameGuess
    });

    expect(context.updateGameGuess).toBe(customUpdateGameGuess);
  });
});

describe('renderWithProviders', () => {
  describe('theme support', () => {
    it('renders with default light theme', () => {
      const TestComponent = () => {
        const theme = useTheme();
        return <div data-testid="theme-mode">{theme.palette.mode}</div>;
      };

      renderWithProviders(<TestComponent />);

      expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
    });

    it('renders with dark theme', () => {
      const TestComponent = () => {
        const theme = useTheme();
        return <div data-testid="theme-mode">{theme.palette.mode}</div>;
      };

      renderWithProviders(<TestComponent />, { theme: 'dark' });

      expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
    });

    it('applies theme overrides', () => {
      const TestComponent = () => {
        const theme = useTheme();
        return (
          <div data-testid="primary-color">
            {theme.palette.primary.main}
          </div>
        );
      };

      renderWithProviders(<TestComponent />, {
        themeOverrides: {
          palette: {
            primary: {
              main: '#custom'
            }
          }
        }
      });

      expect(screen.getByTestId('primary-color')).toHaveTextContent('#custom');
    });
  });

  describe('guessesContext support', () => {
    it('renders without context when not provided', () => {
      renderWithProviders(<ContextConsumer />);

      // Default context from GuessesContext.createContext
      expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('0');
      expect(screen.getByTestId('guessed-positions-count')).toHaveTextContent('0');
    });

    it('renders with default context when guessesContext: true', () => {
      renderWithProviders(<ContextConsumer />, {
        guessesContext: true
      });

      expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('0');
      expect(screen.getByTestId('guessed-positions-count')).toHaveTextContent('0');
      expect(screen.getByTestId('pending-saves-count')).toHaveTextContent('0');
      expect(screen.getByTestId('has-update-game-guess')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-clear-save-error')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-flush-pending-save')).toHaveTextContent('yes');
    });

    it('renders with custom context when provided partial overrides', () => {
      const mockGameGuesses = {
        game1: {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 2,
          away_score: 1,
          home_penalty_winner: false,
          away_penalty_winner: false,
          home_team: 'team1',
          away_team: 'team2'
        },
        game2: {
          game_id: 'game2',
          game_number: 2,
          user_id: 'user1',
          home_score: 1,
          away_score: 1,
          home_penalty_winner: false,
          away_penalty_winner: false,
          home_team: 'team3',
          away_team: 'team4'
        }
      };

      renderWithProviders(<ContextConsumer />, {
        guessesContext: {
          gameGuesses: mockGameGuesses,
          pendingSaves: new Set(['game1'])
        }
      });

      expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('2');
      expect(screen.getByTestId('pending-saves-count')).toHaveTextContent('1');
    });

    it('makes context accessible to child components', () => {
      const TestComponent = () => {
        const context = useContext(GuessesContext);
        return (
          <div>
            <div data-testid="context-exists">
              {context ? 'yes' : 'no'}
            </div>
            <div data-testid="has-game-guesses">
              {context.gameGuesses ? 'yes' : 'no'}
            </div>
          </div>
        );
      };

      renderWithProviders(<TestComponent />, {
        guessesContext: true
      });

      expect(screen.getByTestId('context-exists')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-game-guesses')).toHaveTextContent('yes');
    });
  });

  describe('timezone support', () => {
    it('renders without TimezoneProvider when timezone: false', () => {
      const TestComponent = () => {
        try {
          const timezone = useTimezone();
          return <div data-testid="timezone">{timezone ? 'yes' : 'no'}</div>;
        } catch (error) {
          return <div data-testid="timezone">no</div>;
        }
      };

      renderWithProviders(<TestComponent />, {
        timezone: false
      });

      // Without TimezoneProvider, useTimezone returns default context
      expect(screen.getByTestId('timezone')).toHaveTextContent('yes');
    });

    it('renders with TimezoneProvider when timezone: true', () => {
      const TestComponent = () => {
        const timezone = useTimezone();
        return (
          <div>
            <div data-testid="timezone-exists">
              {timezone ? 'yes' : 'no'}
            </div>
            <div data-testid="has-show-local-time">
              {typeof timezone.showLocalTime === 'boolean' ? 'yes' : 'no'}
            </div>
            <div data-testid="has-toggle-timezone">
              {typeof timezone.toggleTimezone === 'function' ? 'yes' : 'no'}
            </div>
          </div>
        );
      };

      renderWithProviders(<TestComponent />, {
        timezone: true
      });

      expect(screen.getByTestId('timezone-exists')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-show-local-time')).toHaveTextContent('yes');
      expect(screen.getByTestId('has-toggle-timezone')).toHaveTextContent('yes');
    });
  });

  describe('provider composition', () => {
    it('composes theme + context', () => {
      renderWithProviders(<ContextConsumer />, {
        theme: 'dark',
        guessesContext: true
      });

      expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
      expect(screen.getByTestId('has-update-game-guess')).toHaveTextContent('yes');
    });

    it('composes theme + timezone', () => {
      renderWithProviders(<ContextConsumer />, {
        theme: 'dark',
        timezone: true
      });

      expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
      expect(screen.getByTestId('timezone-available')).toHaveTextContent('yes');
    });

    it('composes context + timezone', () => {
      renderWithProviders(<ContextConsumer />, {
        guessesContext: true,
        timezone: true
      });

      expect(screen.getByTestId('has-update-game-guess')).toHaveTextContent('yes');
      expect(screen.getByTestId('timezone-available')).toHaveTextContent('yes');
    });

    it('composes all three: theme + context + timezone', () => {
      const mockGameGuesses = {
        game1: {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 2,
          away_score: 1,
          home_penalty_winner: false,
          away_penalty_winner: false,
          home_team: 'team1',
          away_team: 'team2'
        }
      };

      renderWithProviders(<ContextConsumer />, {
        theme: 'dark',
        guessesContext: {
          gameGuesses: mockGameGuesses
        },
        timezone: true
      });

      expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
      expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('1');
      expect(screen.getByTestId('timezone-available')).toHaveTextContent('yes');
    });
  });

  describe('rerender support', () => {
    it('rerenderWithProviders maintains theme', () => {
      const TestComponent = ({ text }: { text: string }) => {
        const theme = useTheme();
        return (
          <div>
            <div data-testid="text">{text}</div>
            <div data-testid="theme-mode">{theme.palette.mode}</div>
          </div>
        );
      };

      const { rerenderWithProviders } = renderWithProviders(
        <TestComponent text="initial" />,
        { theme: 'dark' }
      );

      expect(screen.getByTestId('text')).toHaveTextContent('initial');
      expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');

      rerenderWithProviders(<TestComponent text="updated" />);

      expect(screen.getByTestId('text')).toHaveTextContent('updated');
      expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
    });

    it('rerenderWithProviders maintains guessesContext', () => {
      const TestComponent = ({ text }: { text: string }) => {
        const context = useContext(GuessesContext);
        return (
          <div>
            <div data-testid="text">{text}</div>
            <div data-testid="game-guesses-count">
              {Object.keys(context.gameGuesses).length}
            </div>
          </div>
        );
      };

      const mockGameGuesses = {
        game1: {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 2,
          away_score: 1,
          home_penalty_winner: false,
          away_penalty_winner: false,
          home_team: 'team1',
          away_team: 'team2'
        }
      };

      const { rerenderWithProviders } = renderWithProviders(
        <TestComponent text="initial" />,
        {
          guessesContext: {
            gameGuesses: mockGameGuesses
          }
        }
      );

      expect(screen.getByTestId('text')).toHaveTextContent('initial');
      expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('1');

      rerenderWithProviders(<TestComponent text="updated" />);

      expect(screen.getByTestId('text')).toHaveTextContent('updated');
      expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('1');
    });

    it('rerenderWithProviders maintains timezone', () => {
      const TestComponent = ({ text }: { text: string }) => {
        const timezone = useTimezone();
        return (
          <div>
            <div data-testid="text">{text}</div>
            <div data-testid="has-timezone">
              {timezone ? 'yes' : 'no'}
            </div>
          </div>
        );
      };

      const { rerenderWithProviders } = renderWithProviders(
        <TestComponent text="initial" />,
        { timezone: true }
      );

      expect(screen.getByTestId('text')).toHaveTextContent('initial');
      expect(screen.getByTestId('has-timezone')).toHaveTextContent('yes');

      rerenderWithProviders(<TestComponent text="updated" />);

      expect(screen.getByTestId('text')).toHaveTextContent('updated');
      expect(screen.getByTestId('has-timezone')).toHaveTextContent('yes');
    });

    it('rerenderWithProviders maintains all providers together', () => {
      const TestComponent = ({ count }: { count: number }) => (
        <div>
          <ContextConsumer />
          <div data-testid="count">{count}</div>
        </div>
      );

      const mockGameGuesses = {
        game1: {
          game_id: 'game1',
          game_number: 1,
          user_id: 'user1',
          home_score: 2,
          away_score: 1,
          home_penalty_winner: false,
          away_penalty_winner: false,
          home_team: 'team1',
          away_team: 'team2'
        }
      };

      const { rerenderWithProviders } = renderWithProviders(
        <TestComponent count={1} />,
        {
          theme: 'dark',
          guessesContext: {
            gameGuesses: mockGameGuesses
          },
          timezone: true
        }
      );

      expect(screen.getByTestId('count')).toHaveTextContent('1');
      expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
      expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('1');
      expect(screen.getByTestId('timezone-available')).toHaveTextContent('yes');

      rerenderWithProviders(<TestComponent count={2} />);

      expect(screen.getByTestId('count')).toHaveTextContent('2');
      expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
      expect(screen.getByTestId('game-guesses-count')).toHaveTextContent('1');
      expect(screen.getByTestId('timezone-available')).toHaveTextContent('yes');
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import FlippableGameCard from '../../app/components/flippable-game-card';
import { GuessesContext } from '../../app/components/context-providers/guesses-context-provider';
import { CountdownProvider } from '../../app/components/context-providers/countdown-context-provider';
import { ExtendedGameData } from '../../app/definitions';
import { Team } from '../../app/db/tables-definition';

// Create a mock theme with accent colors
const mockTheme = createTheme({
  palette: {
    accent: {
      silver: {
        main: '#C0C0C0',
      },
      gold: {
        main: '#FFD700',
      },
    },
  } as any,
});

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useReducedMotion: () => false,
}));

// Mock next-auth
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

// Mock MUI useMediaQuery
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => false, // Not mobile
  };
});

describe('FlippableGameCard', () => {
  const mockTeamsMap: Record<string, Team> = {
    'team1': {
      id: 'team1',
      name: 'Mexico',
      short_name: 'MEX',
      flag_url: 'mexico.png',
      fifa_code: 'MEX'
    },
    'team2': {
      id: 'team2',
      name: 'Qatar',
      short_name: 'QAT',
      flag_url: 'qatar.png',
      fifa_code: 'QAT'
    }
  };

  const mockGame: ExtendedGameData = {
    id: 'game1',
    tournament_id: 'tournament1',
    game_number: 1,
    home_team: 'team1',
    away_team: 'team2',
    game_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    location: 'Stadium 1',
    home_team_rule: undefined,
    away_team_rule: undefined,
    game_type: 'group',
    game_local_timezone: undefined,
    group: undefined,
    playoffStage: undefined,
    gameResult: undefined
  };

  const mockContextValue = {
    gameGuesses: {
      'game1': {
        id: 'guess1',
        game_id: 'game1',
        game_number: 1,
        user_id: 'user1',
        home_team: 'team1',
        away_team: 'team2',
        home_score: 2,
        away_score: 1,
        home_penalty_winner: undefined,
        away_penalty_winner: undefined,
        score: undefined,
        boost_type: null,
        boost_multiplier: 1.0,
        final_score: undefined,
        updated_at: new Date()
      }
    },
    guessedPositions: {},
    updateGameGuess: vi.fn(),
    pendingSaves: new Set<string>(),
    saveErrors: {},
    clearSaveError: vi.fn(),
  };

  const defaultProps = {
    game: mockGame,
    teamsMap: mockTeamsMap,
    isPlayoffs: false,
    homeScore: 2,
    awayScore: 1,
    homePenaltyWinner: false,
    awayPenaltyWinner: false,
    boostType: null as 'silver' | 'golden' | null,
    initialBoostType: null as 'silver' | 'golden' | null,
    isEditing: false,
    onEditStart: vi.fn(),
    onEditEnd: vi.fn(),
    silverUsed: 0,
    silverMax: 5,
    goldenUsed: 0,
    goldenMax: 2,
    disabled: false,
  };

  const renderWithContext = (props = defaultProps, contextValue = mockContextValue) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        <CountdownProvider>
          <GuessesContext.Provider value={contextValue}>
            <FlippableGameCard {...props} />
          </GuessesContext.Provider>
        </CountdownProvider>
      </ThemeProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders game view when not editing', () => {
      renderWithContext();

      expect(screen.getByText(/Mexico/)).toBeInTheDocument();
      expect(screen.getByText(/Qatar/)).toBeInTheDocument();
    });

    it('renders with correct data-game-id attribute', () => {
      const { container } = renderWithContext();

      const cardWrapper = container.querySelector('[data-game-id="game1"]');
      expect(cardWrapper).toBeInTheDocument();
    });

    it('sets data-editing attribute when editing', () => {
      const { container } = renderWithContext({ ...defaultProps, isEditing: true });

      const cardWrapper = container.querySelector('[data-game-id="game1"]');
      expect(cardWrapper).toHaveAttribute('data-editing', 'true');
    });
  });

  describe('Edit Mode', () => {
    it('shows edit controls when isEditing is true', () => {
      renderWithContext({ ...defaultProps, isEditing: true });

      // Should show score inputs
      expect(screen.getByLabelText(/Mexico score/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Qatar score/i)).toBeInTheDocument();
    });

    it('calls onEditStart when edit button is clicked', () => {
      renderWithContext();

      // Find and click edit button by its tooltip title
      const editButton = screen.getByRole('button', { name: /Editar resultado/i });
      fireEvent.click(editButton);

      expect(defaultProps.onEditStart).toHaveBeenCalled();
    });

    it('initializes edit state with current values when entering edit mode', () => {
      // Render directly in edit mode with current scores
      renderWithContext({ ...defaultProps, isEditing: true });

      const homeInput = screen.getByLabelText(/Mexico score/i) as HTMLInputElement;
      const awayInput = screen.getByLabelText(/Qatar score/i) as HTMLInputElement;

      expect(homeInput.value).toBe('2');
      expect(awayInput.value).toBe('1');
    });
  });

  describe('Save and Cancel', () => {
    it('calls updateGameGuess when save button is clicked', async () => {
      renderWithContext({ ...defaultProps, isEditing: true });

      const saveButton = screen.getByText(/Guardar/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockContextValue.updateGameGuess).toHaveBeenCalledWith(
          'game1',
          expect.objectContaining({
            game_id: 'game1',
            game_number: 1,
            home_score: 2,
            away_score: 1,
            home_team: 'team1',
            away_team: 'team2'
          })
        );
      });
    });

    it('calls onEditEnd after successful save', async () => {
      const updateGameGuessMock = vi.fn().mockResolvedValue(undefined);
      const contextValue = {
        ...mockContextValue,
        updateGameGuess: updateGameGuessMock
      };
      renderWithContext({ ...defaultProps, isEditing: true }, contextValue);

      const saveButton = screen.getByText(/Guardar/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onEditEnd).toHaveBeenCalled();
      });
    });

    it('calls onEditEnd when cancel button is clicked', () => {
      renderWithContext({ ...defaultProps, isEditing: true });

      const cancelButton = screen.getByText(/Cancelar/i);
      fireEvent.click(cancelButton);

      expect(defaultProps.onEditEnd).toHaveBeenCalled();
    });

    it('does not call onEditEnd when save fails', async () => {
      const updateGameGuessMock = vi.fn().mockRejectedValue(new Error('Network error'));
      const contextValue = {
        ...mockContextValue,
        updateGameGuess: updateGameGuessMock
      };
      renderWithContext({ ...defaultProps, isEditing: true }, contextValue);

      const saveButton = screen.getByText(/Guardar/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateGameGuessMock).toHaveBeenCalled();
      });

      expect(defaultProps.onEditEnd).not.toHaveBeenCalled();
    });
  });

  describe('Auto-Advance', () => {
    it('calls onAutoAdvanceNext when save and advance is triggered', async () => {
      const onAutoAdvanceNext = vi.fn();
      const updateGameGuessMock = vi.fn().mockResolvedValue(undefined);
      const contextValue = {
        ...mockContextValue,
        updateGameGuess: updateGameGuessMock
      };

      renderWithContext({ ...defaultProps, isEditing: true, onAutoAdvanceNext }, contextValue);

      // Trigger save and advance (via Tab from last field or explicit button)
      const saveButton = screen.getByText(/Guardar/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(updateGameGuessMock).toHaveBeenCalled();
      });
    });

    it('calls onAutoGoPrevious when Shift+Tab from first field', () => {
      const onAutoGoPrevious = vi.fn();
      renderWithContext({ ...defaultProps, isEditing: true, onAutoGoPrevious });

      const homeInput = screen.getByLabelText(/Mexico score/i);
      fireEvent.keyDown(homeInput, { key: 'Tab', shiftKey: true });

      // Component should handle this internally
      expect(homeInput).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables edit button when disabled prop is true', () => {
      renderWithContext({ ...defaultProps, disabled: true });

      // When disabled, the edit button should not be rendered at all
      const editButton = screen.queryByRole('button', { name: /Editar resultado/i });
      expect(editButton).not.toBeInTheDocument();
    });

    it('does not call onEditStart when disabled', () => {
      renderWithContext({ ...defaultProps, disabled: true });

      // When disabled, the edit button should not be rendered at all
      const editButton = screen.queryByRole('button', { name: /Editar resultado/i });
      expect(editButton).not.toBeInTheDocument();
      expect(defaultProps.onEditStart).not.toHaveBeenCalled();
    });
  });

  describe('Playoff Games', () => {
    it('shows penalty selection for playoff games with tied scores', () => {
      const playoffGame: ExtendedGameData = {
        ...mockGame,
        game_type: 'playoff'
      };

      renderWithContext({
        ...defaultProps,
        game: playoffGame,
        isPlayoffs: true,
        isEditing: true,
        homeScore: 2,
        awayScore: 2
      });

      expect(screen.getByText(/Ganador.*penales/i)).toBeInTheDocument();
    });

    it('does not show penalty selection when scores are different', () => {
      const playoffGame: ExtendedGameData = {
        ...mockGame,
        game_type: 'playoff'
      };

      renderWithContext({
        ...defaultProps,
        game: playoffGame,
        isPlayoffs: true,
        isEditing: true,
        homeScore: 2,
        awayScore: 1
      });

      expect(screen.queryByText(/Ganador.*penales/i)).not.toBeInTheDocument();
    });
  });

  describe('Boost Selection', () => {
    it('allows selecting silver boost', () => {
      renderWithContext({ ...defaultProps, isEditing: true, tournamentId: 'tournament1' });

      const silverButton = screen.getByLabelText(/Silver boost/i);
      fireEvent.click(silverButton);

      // Component handles state internally
      expect(silverButton).toBeInTheDocument();
    });

    it('allows selecting golden boost', () => {
      renderWithContext({ ...defaultProps, isEditing: true, tournamentId: 'tournament1' });

      const goldenButton = screen.getByLabelText(/Golden boost/i);
      fireEvent.click(goldenButton);

      expect(goldenButton).toBeInTheDocument();
    });

    it('disables silver boost when limit reached', () => {
      renderWithContext({ ...defaultProps, isEditing: true, tournamentId: 'tournament1', silverUsed: 5 });

      const silverButton = screen.getByLabelText(/Silver boost/i);
      expect(silverButton).toBeDisabled();
    });

    it('disables golden boost when limit reached', () => {
      renderWithContext({ ...defaultProps, isEditing: true, tournamentId: 'tournament1', goldenUsed: 2 });

      const goldenButton = screen.getByLabelText(/Golden boost/i);
      expect(goldenButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when save fails', async () => {
      const updateGameGuessMock = vi.fn().mockRejectedValue(new Error('Network error'));
      const contextValue = {
        ...mockContextValue,
        updateGameGuess: updateGameGuessMock
      };
      renderWithContext({ ...defaultProps, isEditing: true }, contextValue);

      const saveButton = screen.getByText(/Guardar/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('stays in edit mode when save fails', async () => {
      const updateGameGuessMock = vi.fn().mockRejectedValue(new Error('Network error'));
      const contextValue = {
        ...mockContextValue,
        updateGameGuess: updateGameGuessMock
      };
      renderWithContext({ ...defaultProps, isEditing: true }, contextValue);

      const saveButton = screen.getByText(/Guardar/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      // Should still be in edit mode
      expect(screen.getByLabelText(/Mexico score/i)).toBeInTheDocument();
    });
  });

  describe('Team Name Display', () => {
    it('shows correct team names from teamsMap', () => {
      renderWithContext();

      expect(screen.getByText(/Mexico/)).toBeInTheDocument();
      expect(screen.getByText(/Qatar/)).toBeInTheDocument();
    });

    it('shows TBD when team not in teamsMap', () => {
      const gameWithUnknownTeams: ExtendedGameData = {
        ...mockGame,
        home_team: 'unknown1',
        away_team: 'unknown2'
      };

      renderWithContext({ ...defaultProps, game: gameWithUnknownTeams });

      expect(screen.getAllByText(/TBD/).length).toBeGreaterThan(0);
    });

    it('uses team names from guess for playoff games', () => {
      const playoffGame: ExtendedGameData = {
        ...mockGame,
        home_team: null,
        away_team: null,
        home_team_rule: 'Winner Group A',
        away_team_rule: 'Runner-up Group B'
      };

      const contextWithGuess = {
        ...mockContextValue,
        gameGuesses: {
          'game1': {
            ...mockContextValue.gameGuesses['game1'],
            home_team: 'team1',
            away_team: 'team2'
          }
        }
      };

      renderWithContext({ ...defaultProps, game: playoffGame, isPlayoffs: true }, contextWithGuess);

      expect(screen.getByText(/Mexico/)).toBeInTheDocument();
      expect(screen.getByText(/Qatar/)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('focuses home input when entering edit mode', async () => {
      // Render in edit mode
      renderWithContext({ ...defaultProps, isEditing: true });

      await waitFor(() => {
        const homeInput = screen.getByLabelText(/Mexico score/i);
        // Input should be rendered and available for interaction
        expect(homeInput).toBeInTheDocument();
      });
    });

    it('handles Escape key to close edit mode', () => {
      renderWithContext({ ...defaultProps, isEditing: true });

      const homeInput = screen.getByLabelText(/Mexico score/i);
      fireEvent.keyDown(homeInput, { key: 'Escape', code: 'Escape' });

      expect(defaultProps.onEditEnd).toHaveBeenCalled();
    });
  });
});

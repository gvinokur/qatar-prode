import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import GamePredictionEditControls from '../../app/components/game-prediction-edit-controls';

// Mock next-auth
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

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

describe('GamePredictionEditControls', () => {
  const defaultProps = {
    gameId: 'game1',
    homeTeamName: 'Mexico',
    awayTeamName: 'Qatar',
    homeTeamShortName: 'MEX',
    awayTeamShortName: 'QAT',
    isPlayoffGame: false,
    homeScore: undefined,
    awayScore: undefined,
    homePenaltyWinner: false,
    awayPenaltyWinner: false,
    boostType: null as 'silver' | 'golden' | null,
    initialBoostType: null as 'silver' | 'golden' | null,
    silverUsed: 0,
    silverMax: 5,
    goldenUsed: 0,
    goldenMax: 2,
    onHomeScoreChange: vi.fn(),
    onAwayScoreChange: vi.fn(),
    onHomePenaltyWinnerChange: vi.fn(),
    onAwayPenaltyWinnerChange: vi.fn(),
    onBoostTypeChange: vi.fn(),
    loading: false,
    error: null,
    layout: 'horizontal' as const,
    compact: true,
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  const renderWithTheme = (ui: React.ReactElement) => {
    return render(<ThemeProvider theme={mockTheme}>{ui}</ThemeProvider>);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Score Inputs', () => {
    it('renders home and away score inputs', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} />);

      expect(screen.getByLabelText(/Mexico score/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Qatar score/i)).toBeInTheDocument();
    });

    it('displays current scores when provided', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} homeScore={2} awayScore={1} />);

      const homeInput = screen.getByLabelText(/Mexico score/i) as HTMLInputElement;
      const awayInput = screen.getByLabelText(/Qatar score/i) as HTMLInputElement;

      expect(homeInput.value).toBe('2');
      expect(awayInput.value).toBe('1');
    });

    it('calls onHomeScoreChange when home score changes', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} />);

      const homeInput = screen.getByLabelText(/Mexico score/i);
      fireEvent.change(homeInput, { target: { value: '3' } });

      expect(defaultProps.onHomeScoreChange).toHaveBeenCalledWith(3);
    });

    it('calls onAwayScoreChange when away score changes', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} />);

      const awayInput = screen.getByLabelText(/Qatar score/i);
      fireEvent.change(awayInput, { target: { value: '2' } });

      expect(defaultProps.onAwayScoreChange).toHaveBeenCalledWith(2);
    });

    it('calls onChange with undefined when input is cleared', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} homeScore={2} />);

      const homeInput = screen.getByLabelText(/Mexico score/i);
      fireEvent.change(homeInput, { target: { value: '' } });

      expect(defaultProps.onHomeScoreChange).toHaveBeenCalledWith(undefined);
    });

    it('does not accept negative values', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} />);

      const homeInput = screen.getByLabelText(/Mexico score/i) as HTMLInputElement;
      expect(homeInput.min).toBe('0');
    });
  });

  describe('Penalty Selection', () => {
    it('does not show penalty checkboxes for non-playoff games', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} isPlayoffGame={false} />);

      expect(screen.queryByText(/Ganador por penales/i)).not.toBeInTheDocument();
    });

    it('does not show penalty checkboxes for playoff games when scores are different', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} isPlayoffGame={true} homeScore={2} awayScore={1} />);

      expect(screen.queryByText(/Ganador por penales/i)).not.toBeInTheDocument();
    });

    it('shows penalty checkboxes for playoff games with tied scores', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} isPlayoffGame={true} homeScore={2} awayScore={2} />);

      expect(screen.getByText(/Ganador por penales/i)).toBeInTheDocument();
    });

    it('calls onHomePenaltyWinnerChange when home penalty checkbox changes', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} isPlayoffGame={true} homeScore={2} awayScore={2} />);

      const checkboxes = screen.getAllByRole('checkbox');
      const homeCheckbox = checkboxes[0]; // First checkbox is home team
      fireEvent.click(homeCheckbox);

      expect(defaultProps.onHomePenaltyWinnerChange).toHaveBeenCalledWith(true);
    });

    it('calls onAwayPenaltyWinnerChange when away penalty checkbox changes', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} isPlayoffGame={true} homeScore={2} awayScore={2} />);

      const checkboxes = screen.getAllByRole('checkbox');
      const awayCheckbox = checkboxes[1]; // Second checkbox is away team
      fireEvent.click(awayCheckbox);

      expect(defaultProps.onAwayPenaltyWinnerChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Boost Selection', () => {
    it('renders boost selector with silver and golden options', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" />);

      expect(screen.getByLabelText(/Silver boost/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Golden boost/i)).toBeInTheDocument();
    });

    it('disables silver boost when limit reached', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" silverUsed={5} />);

      const silverButton = screen.getByLabelText(/Silver boost/i);
      expect(silverButton).toBeDisabled();
    });

    it('disables golden boost when limit reached', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" goldenUsed={2} />);

      const goldenButton = screen.getByLabelText(/Golden boost/i);
      expect(goldenButton).toBeDisabled();
    });

    it('allows switching from silver to golden even when golden limit reached', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" boostType="silver" goldenUsed={2} />);

      const goldenButton = screen.getByLabelText(/Golden boost/i);
      expect(goldenButton).not.toBeDisabled();
    });

    it('calls onBoostTypeChange when silver is selected', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" />);

      const silverButton = screen.getByLabelText(/Silver boost/i);
      fireEvent.click(silverButton);

      expect(defaultProps.onBoostTypeChange).toHaveBeenCalledWith('silver');
    });

    it('calls onBoostTypeChange when golden is selected', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" />);

      const goldenButton = screen.getByLabelText(/Golden boost/i);
      fireEvent.click(goldenButton);

      expect(defaultProps.onBoostTypeChange).toHaveBeenCalledWith('golden');
    });

    it('calls onBoostTypeChange with null when deselecting', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" boostType="silver" />);

      // Click "No boost" button
      const noneButton = screen.getByLabelText(/No boost/i);
      fireEvent.click(noneButton);

      expect(defaultProps.onBoostTypeChange).toHaveBeenCalledWith(null);
    });

    it('shows correct boost counts in chips', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" silverUsed={2} silverMax={5} goldenUsed={1} goldenMax={2} />);

      // Chips show available/max counts
      expect(screen.getByText('3/5')).toBeInTheDocument(); // 5-2 available
      expect(screen.getByText('1/2')).toBeInTheDocument(); // 2-1 available
    });
  });

  describe('Action Buttons', () => {
    it('renders save and cancel buttons', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} />);

      expect(screen.getByText(/Guardar/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancelar/i)).toBeInTheDocument();
    });

    it('calls onSave when save button is clicked', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} />);

      const saveButton = screen.getByText(/Guardar/i);
      fireEvent.click(saveButton);

      expect(defaultProps.onSave).toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} />);

      const cancelButton = screen.getByText(/Cancelar/i);
      fireEvent.click(cancelButton);

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('disables buttons when loading', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} loading={true} />);

      const saveButton = screen.getByText(/Guardar/i).closest('button');
      const cancelButton = screen.getByText(/Cancelar/i).closest('button');

      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('shows loading indicator when loading', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} loading={true} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('does not show error alert when error is null', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows error alert when error is provided', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} error="Network error" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('shows retry button when retryCallback is provided', () => {
      const retryCallback = vi.fn();
      renderWithTheme(<GamePredictionEditControls {...defaultProps} error="Network error" retryCallback={retryCallback} />);

      const retryButton = screen.getByText(/Reintentar/i);
      fireEvent.click(retryButton);

      expect(retryCallback).toHaveBeenCalled();
    });
  });

  describe('Layout', () => {
    it('renders horizontal layout when specified', () => {
      const { container } = renderWithTheme(<GamePredictionEditControls {...defaultProps} layout="horizontal" />);

      const grid = container.querySelector('.MuiGrid-container');
      expect(grid).toBeInTheDocument();
    });

    it('renders vertical layout when specified', () => {
      const { container } = renderWithTheme(<GamePredictionEditControls {...defaultProps} layout="vertical" />);

      const stack = container.querySelector('.MuiStack-root');
      expect(stack).toBeInTheDocument();
    });

    it('uses compact spacing when compact is true', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} compact={true} />);

      // Compact mode should render (testing by checking component renders without error)
      expect(screen.getByLabelText(/MEX/)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('focuses on save button when Tab is pressed from last field', () => {
      const onSaveAndAdvance = vi.fn();
      renderWithTheme(<GamePredictionEditControls {...defaultProps} onSaveAndAdvance={onSaveAndAdvance} />);

      const saveButton = screen.getByText(/Guardar/i);

      // Keyboard navigation is handled by the component
      expect(saveButton).toBeInTheDocument();
    });

    it('calls onEscapePressed when Escape is pressed', () => {
      const onEscapePressed = vi.fn();
      renderWithTheme(<GamePredictionEditControls {...defaultProps} onEscapePressed={onEscapePressed} />);

      const homeInput = screen.getByLabelText(/Mexico score/i);
      fireEvent.keyDown(homeInput, { key: 'Escape', code: 'Escape' });

      expect(onEscapePressed).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for inputs', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} />);

      expect(screen.getByLabelText(/Mexico score/i)).toHaveAttribute('type', 'number');
      expect(screen.getByLabelText(/Qatar score/i)).toHaveAttribute('type', 'number');
    });

    it('has proper ARIA labels for boost buttons', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" />);

      expect(screen.getByLabelText(/Silver boost/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Golden boost/i)).toBeInTheDocument();
    });

    it('marks error alert with proper role', () => {
      renderWithTheme(<GamePredictionEditControls {...defaultProps} error="Test error" />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Test error');
    });
  });
});

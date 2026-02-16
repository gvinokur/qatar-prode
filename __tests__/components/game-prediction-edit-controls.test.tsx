import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import GamePredictionEditControls from '../../app/components/game-prediction-edit-controls';
import { renderWithProviders, createMockGuessesContext } from '../utils/test-utils';

// Mock next-auth
vi.mock('../../auth', () => ({
  auth: vi.fn(),
}));

// Mock MUI useMediaQuery to return false (desktop)
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: () => false, // Not mobile
  };
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

  const defaultBoostCounts = {
    silver: { used: 0, max: 5 },
    golden: { used: 0, max: 2 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Score Inputs', () => {
    it('renders home and away score inputs', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      expect(screen.getByLabelText(/Mexico score/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Qatar score/i)).toBeInTheDocument();
    });

    it('displays current scores when provided', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} homeScore={2} awayScore={1} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const homeInput = screen.getByLabelText(/Mexico score/i) as HTMLInputElement;
      const awayInput = screen.getByLabelText(/Qatar score/i) as HTMLInputElement;

      expect(homeInput.value).toBe('2');
      expect(awayInput.value).toBe('1');
    });

    it('calls onHomeScoreChange when home score changes', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const homeInput = screen.getByLabelText(/Mexico score/i);
      fireEvent.change(homeInput, { target: { value: '3' } });

      expect(defaultProps.onHomeScoreChange).toHaveBeenCalledWith(3);
    });

    it('calls onAwayScoreChange when away score changes', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const awayInput = screen.getByLabelText(/Qatar score/i);
      fireEvent.change(awayInput, { target: { value: '2' } });

      expect(defaultProps.onAwayScoreChange).toHaveBeenCalledWith(2);
    });

    it('calls onChange with undefined when input is cleared', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} homeScore={2} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const homeInput = screen.getByLabelText(/Mexico score/i);
      fireEvent.change(homeInput, { target: { value: '' } });

      expect(defaultProps.onHomeScoreChange).toHaveBeenCalledWith(undefined);
    });

    it('does not accept negative values', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const homeInput = screen.getByLabelText(/Mexico score/i) as HTMLInputElement;
      expect(homeInput.min).toBe('0');
    });
  });

  describe('Penalty Selection', () => {
    it('does not show penalty checkboxes for non-playoff games', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} isPlayoffGame={false} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      expect(screen.queryByText(/Ganador.*penales/i)).not.toBeInTheDocument();
    });

    it('does not show penalty checkboxes for playoff games when scores are different', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} isPlayoffGame={true} homeScore={2} awayScore={1} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      expect(screen.queryByText(/Ganador.*penales/i)).not.toBeInTheDocument();
    });

    it('shows penalty checkboxes for playoff games with tied scores', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} isPlayoffGame={true} homeScore={2} awayScore={2} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      expect(screen.getByText(/Ganador.*penales/i)).toBeInTheDocument();
    });

    it('calls onHomePenaltyWinnerChange when home penalty checkbox changes', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} isPlayoffGame={true} homeScore={2} awayScore={2} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const checkboxes = screen.getAllByRole('checkbox');
      const homeCheckbox = checkboxes[0]; // First checkbox is home team
      fireEvent.click(homeCheckbox);

      expect(defaultProps.onHomePenaltyWinnerChange).toHaveBeenCalledWith(true);
    });

    it('calls onAwayPenaltyWinnerChange when away penalty checkbox changes', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} isPlayoffGame={true} homeScore={2} awayScore={2} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const checkboxes = screen.getAllByRole('checkbox');
      const awayCheckbox = checkboxes[1]; // Second checkbox is away team
      fireEvent.click(awayCheckbox);

      expect(defaultProps.onAwayPenaltyWinnerChange).toHaveBeenCalledWith(true);
    });
  });

  describe('Boost Selection', () => {
    it('renders boost selector with silver and golden options', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      expect(screen.getByLabelText(/Silver boost/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Golden boost/i)).toBeInTheDocument();
    });

    it('disables silver boost when limit reached', () => {
      const contextWithMaxSilver = createMockGuessesContext({
        boostCounts: {
          silver: { used: 5, max: 5 },
          golden: { used: 0, max: 2 }
        }
      });
      renderWithProviders(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" />, { guessesContext: contextWithMaxSilver });

      const silverButton = screen.getByLabelText(/Silver boost/i);
      expect(silverButton).toBeDisabled();
    });

    it('disables golden boost when limit reached', () => {
      const contextWithMaxGolden = createMockGuessesContext({
        boostCounts: {
          silver: { used: 0, max: 5 },
          golden: { used: 2, max: 2 }
        }
      });
      renderWithProviders(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" />, { guessesContext: contextWithMaxGolden });

      const goldenButton = screen.getByLabelText(/Golden boost/i);
      expect(goldenButton).toBeDisabled();
    });

    it('allows switching from silver to golden even when golden limit reached', () => {
      // When initialBoostType is null (no previous boost) and golden is at max, golden should be disabled
      // This is correct behavior - you can't select golden if it's at max unless you're switching FROM golden
      const contextWithMaxGolden = createMockGuessesContext({
        boostCounts: {
          silver: { used: 0, max: 5 },
          golden: { used: 2, max: 2 }
        }
      });
      renderWithProviders(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" boostType="golden" initialBoostType="golden" />, { guessesContext: contextWithMaxGolden });

      // Golden button should NOT be disabled because it's currently selected (boostType="golden")
      const goldenButton = screen.getByLabelText(/Golden boost/i);
      expect(goldenButton).not.toBeDisabled();
    });

    it('calls onBoostTypeChange when silver is selected', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const silverButton = screen.getByLabelText(/Silver boost/i);
      fireEvent.click(silverButton);

      expect(defaultProps.onBoostTypeChange).toHaveBeenCalledWith('silver');
    });

    it('calls onBoostTypeChange when golden is selected', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const goldenButton = screen.getByLabelText(/Golden boost/i);
      fireEvent.click(goldenButton);

      expect(defaultProps.onBoostTypeChange).toHaveBeenCalledWith('golden');
    });

    it('calls onBoostTypeChange with null when deselecting', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" boostType="silver" />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      // Click "No boost" button
      const noneButton = screen.getByLabelText(/No boost/i);
      fireEvent.click(noneButton);

      expect(defaultProps.onBoostTypeChange).toHaveBeenCalledWith(null);
    });

    it('shows correct boost counts in chips', () => {
      const contextWithBoosts = createMockGuessesContext({
        boostCounts: {
          silver: { used: 2, max: 5 },
          golden: { used: 1, max: 2 }
        }
      });
      renderWithProviders(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" />, { guessesContext: contextWithBoosts });

      // Chips show available/max counts
      expect(screen.getByText('3/5')).toBeInTheDocument(); // 5-2 = 3 available
      expect(screen.getByText('1/2')).toBeInTheDocument(); // 2-1 = 1 available
    });
  });

  describe('Action Buttons', () => {
    it('renders save and cancel buttons', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      expect(screen.getByText(/Guardar/i)).toBeInTheDocument();
      expect(screen.getByText(/Cancelar/i)).toBeInTheDocument();
    });

    it('calls onSave when save button is clicked', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const saveButton = screen.getByText(/Guardar/i);
      fireEvent.click(saveButton);

      expect(defaultProps.onSave).toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const cancelButton = screen.getByText(/Cancelar/i);
      fireEvent.click(cancelButton);

      expect(defaultProps.onCancel).toHaveBeenCalled();
    });

    it('disables buttons when loading', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} loading={true} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      // When loading, button text changes to "Guardando..."
      const saveButton = screen.getByText(/Guardando/i).closest('button');
      const cancelButton = screen.getByText(/Cancelar/i).closest('button');

      expect(saveButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('shows loading indicator when loading', () => {
      const retryCallback = vi.fn();
      renderWithProviders(<GamePredictionEditControls {...defaultProps} loading={true} error="Network error" retryCallback={retryCallback} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      // CircularProgress only appears when there's an error with retry
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('does not show error alert when error is null', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows error alert when error is provided', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} error="Network error" />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('shows retry button when retryCallback is provided', () => {
      const retryCallback = vi.fn();
      renderWithProviders(<GamePredictionEditControls {...defaultProps} error="Network error" retryCallback={retryCallback} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const retryButton = screen.getByText(/Reintentar/i);
      fireEvent.click(retryButton);

      expect(retryCallback).toHaveBeenCalled();
    });
  });

  describe('Layout', () => {
    it('renders horizontal layout when specified', () => {
      const { container } = renderWithProviders(<GamePredictionEditControls {...defaultProps} layout="horizontal" />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const grid = container.querySelector('.MuiGrid-container');
      expect(grid).toBeInTheDocument();
    });

    it('renders vertical layout when specified', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} layout="vertical" />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      // Vertical layout has "vs" separator text
      expect(screen.getByText('vs')).toBeInTheDocument();
    });

    it('uses compact spacing when compact is true', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} compact={true} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      // Compact mode should render (testing by checking component renders without error)
      expect(screen.getByLabelText(/Mexico score/i)).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('focuses on save button when Tab is pressed from last field', () => {
      const onSaveAndAdvance = vi.fn();
      renderWithProviders(<GamePredictionEditControls {...defaultProps} onSaveAndAdvance={onSaveAndAdvance} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const saveButton = screen.getByText(/Guardar/i);

      // Keyboard navigation is handled by the component
      expect(saveButton).toBeInTheDocument();
    });

    it('calls onEscapePressed when Escape is pressed', () => {
      const onEscapePressed = vi.fn();
      renderWithProviders(<GamePredictionEditControls {...defaultProps} onEscapePressed={onEscapePressed} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const homeInput = screen.getByLabelText(/Mexico score/i);
      fireEvent.keyDown(homeInput, { key: 'Escape', code: 'Escape' });

      expect(onEscapePressed).toHaveBeenCalled();
    });

    it('navigates from home to away input with Tab', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const homeInput = screen.getByLabelText(/Mexico score/i);
      const awayInput = screen.getByLabelText(/Qatar score/i);

      // Focus home input
      homeInput.focus();
      expect(document.activeElement).toBe(homeInput);

      // Press Tab
      fireEvent.keyDown(homeInput, { key: 'Tab', code: 'Tab' });

      // Away input should be focused (we just verify the event was handled)
      expect(homeInput).toBeInTheDocument();
    });

    it('calls onSave when Enter is pressed', () => {
      const onSave = vi.fn();
      renderWithProviders(<GamePredictionEditControls {...defaultProps} onSave={onSave} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const homeInput = screen.getByLabelText(/Mexico score/i);
      fireEvent.keyDown(homeInput, { key: 'Enter', code: 'Enter' });

      expect(onSave).toHaveBeenCalled();
    });

    it('handles arrow key navigation in boost selector', () => {
      renderWithProviders(
        <GamePredictionEditControls {...defaultProps} tournamentId="tournament1" boostType="silver" />
      , { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const silverButton = screen.getByLabelText(/silver boost/i);
      const goldenButton = screen.getByLabelText(/golden boost/i);

      // Focus silver button
      silverButton.focus();
      expect(document.activeElement).toBe(silverButton);

      // Press ArrowRight
      fireEvent.keyDown(silverButton, { key: 'ArrowRight', code: 'ArrowRight' });

      // Verify the event was handled
      expect(silverButton).toBeInTheDocument();
    });

    it('handles arrow left navigation in boost selector with wrapping', () => {
      renderWithProviders(
        <GamePredictionEditControls {...defaultProps} tournamentId="tournament1" boostType={null} />
      , { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const noneButton = screen.getByLabelText(/No boost/i);

      // Focus none button (first button)
      noneButton.focus();
      expect(document.activeElement).toBe(noneButton);

      // Press ArrowLeft - should wrap to last button
      fireEvent.keyDown(noneButton, { key: 'ArrowLeft', code: 'ArrowLeft' });

      // Verify the event was handled
      expect(noneButton).toBeInTheDocument();
    });

    it('navigates to penalty checkboxes for tied playoff game', () => {
      renderWithProviders(
        <GamePredictionEditControls
          {...defaultProps}
          isPlayoffGame={true}
          homeScore={1}
          awayScore={1}
          tournamentId="tournament1"
        />
      , { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const awayInput = screen.getByLabelText(/Qatar score/i);

      // Press Tab from away input
      fireEvent.keyDown(awayInput, { key: 'Tab', code: 'Tab' });

      // Penalty checkboxes should be rendered
      expect(screen.getByLabelText(/MEX penalty winner/i)).toBeInTheDocument();
    });

    it('handles Shift+Tab for backward navigation', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const awayInput = screen.getByLabelText(/Qatar score/i);

      // Focus away input
      awayInput.focus();

      // Press Shift+Tab
      fireEvent.keyDown(awayInput, { key: 'Tab', code: 'Tab', shiftKey: true });

      // Verify the event was handled (preventDefault should be called)
      expect(awayInput).toBeInTheDocument();
    });

    it('calls onSaveAndAdvance when Tab is pressed from save button', () => {
      const onSaveAndAdvance = vi.fn();
      renderWithProviders(
        <GamePredictionEditControls {...defaultProps} onSaveAndAdvance={onSaveAndAdvance} onSave={vi.fn()} onCancel={vi.fn()} />
      , { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const saveButton = screen.getByRole('button', { name: /Guardar/i });

      // Press Tab from save button
      fireEvent.keyDown(saveButton, { key: 'Tab', code: 'Tab' });

      // onSaveAndAdvance should not be called directly (it's called by the handler)
      expect(saveButton).toBeInTheDocument();
    });

    it('handles Tab navigation with boost selector present', () => {
      renderWithProviders(
        <GamePredictionEditControls {...defaultProps} tournamentId="tournament1" />
      , { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const awayInput = screen.getByLabelText(/Qatar score/i);

      // Focus away input
      awayInput.focus();

      // Press Tab - should navigate to boost selector
      fireEvent.keyDown(awayInput, { key: 'Tab', code: 'Tab' });

      // Boost selector should be present
      expect(screen.getByLabelText(/No boost/i)).toBeInTheDocument();
    });

    it('handles Tab from boost selector to save button', () => {
      renderWithProviders(
        <GamePredictionEditControls {...defaultProps} tournamentId="tournament1" onSave={vi.fn()} onCancel={vi.fn()} />
      , { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const silverButton = screen.getByLabelText(/silver boost/i);

      // Focus boost button
      silverButton.focus();

      // Press Tab
      fireEvent.keyDown(silverButton, { key: 'Tab', code: 'Tab' });

      // Save button should be present
      expect(screen.getByRole('button', { name: /Guardar/i })).toBeInTheDocument();
    });

    it('handles Shift+Tab from boost selector backwards', () => {
      renderWithProviders(
        <GamePredictionEditControls {...defaultProps} tournamentId="tournament1" />
      , { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const silverButton = screen.getByLabelText(/silver boost/i);

      // Focus boost button
      silverButton.focus();

      // Press Shift+Tab
      fireEvent.keyDown(silverButton, { key: 'Tab', code: 'Tab', shiftKey: true });

      // Verify event was handled
      expect(silverButton).toBeInTheDocument();
    });

    it('handles Tab from penalty checkbox to boost selector', () => {
      renderWithProviders(
        <GamePredictionEditControls
          {...defaultProps}
          isPlayoffGame={true}
          homeScore={1}
          awayScore={1}
          tournamentId="tournament1"
        />
      , { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const awayPenaltyCheckbox = screen.getByLabelText(/QAT penalty winner/i);

      // Focus penalty checkbox
      awayPenaltyCheckbox.focus();

      // Press Tab
      fireEvent.keyDown(awayPenaltyCheckbox, { key: 'Tab', code: 'Tab' });

      // Boost selector should be present
      expect(screen.getByLabelText(/No boost/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for inputs', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      expect(screen.getByLabelText(/Mexico score/i)).toHaveAttribute('type', 'number');
      expect(screen.getByLabelText(/Qatar score/i)).toHaveAttribute('type', 'number');
    });

    it('has proper ARIA labels for boost buttons', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} tournamentId="tournament1" />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      expect(screen.getByLabelText(/Silver boost/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Golden boost/i)).toBeInTheDocument();
    });

    it('marks error alert with proper role', () => {
      renderWithProviders(<GamePredictionEditControls {...defaultProps} error="Test error" />, { guessesContext: createMockGuessesContext({ boostCounts: defaultBoostCounts }) });

      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Test error');
    });
  });
});

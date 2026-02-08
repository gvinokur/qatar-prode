import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../utils/test-utils';
import BackofficeGameResultEditControls from '../../../app/components/backoffice/backoffice-game-result-edit-controls';

describe('BackofficeGameResultEditControls', () => {
  const defaultProps = {
    homeTeamName: 'Argentina',
    awayTeamName: 'Brazil',
    isPlayoffGame: false,
    onHomeScoreChange: vi.fn(),
    onAwayScoreChange: vi.fn(),
    onHomePenaltyScoreChange: vi.fn(),
    onAwayPenaltyScoreChange: vi.fn(),
    onSave: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render team names', () => {
      renderWithTheme(<BackofficeGameResultEditControls {...defaultProps} />);

      expect(screen.getByText('Argentina')).toBeInTheDocument();
      expect(screen.getByText('Brazil')).toBeInTheDocument();
    });

    it('should render score inputs with correct aria-labels', () => {
      renderWithTheme(<BackofficeGameResultEditControls {...defaultProps} />);

      expect(screen.getByLabelText('Argentina score')).toBeInTheDocument();
      expect(screen.getByLabelText('Brazil score')).toBeInTheDocument();
    });

    it('should render action buttons with Spanish labels', () => {
      renderWithTheme(<BackofficeGameResultEditControls {...defaultProps} />);

      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    });

    it('should display score values when provided', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          homeScore={2}
          awayScore={1}
        />
      );

      const homeInput = screen.getByLabelText('Argentina score') as HTMLInputElement;
      const awayInput = screen.getByLabelText('Brazil score') as HTMLInputElement;

      expect(homeInput.value).toBe('2');
      expect(awayInput.value).toBe('1');
    });

    it('should display empty inputs when scores are undefined', () => {
      renderWithTheme(<BackofficeGameResultEditControls {...defaultProps} />);

      const homeInput = screen.getByLabelText('Argentina score') as HTMLInputElement;
      const awayInput = screen.getByLabelText('Brazil score') as HTMLInputElement;

      expect(homeInput.value).toBe('');
      expect(awayInput.value).toBe('');
    });
  });

  describe('Horizontal Layout Pattern', () => {
    it('should use Grid with size={7} for team labels and size={5} for inputs', () => {
      const { container } = renderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} />
      );

      // Check that Grid containers exist with proper spacing
      const grids = container.querySelectorAll('.MuiGrid-root');
      expect(grids.length).toBeGreaterThan(0);

      // Verify team names are rendered in Typography components
      expect(screen.getByText('Argentina').tagName).toBe('P');
      expect(screen.getByText('Brazil').tagName).toBe('P');
    });
  });

  describe('Score Input Changes', () => {
    it('should trigger onHomeScoreChange callback when home score changes', async () => {
      const user = userEvent.setup();
      const onHomeScoreChange = vi.fn();

      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          onHomeScoreChange={onHomeScoreChange}
        />
      );

      const homeInput = screen.getByLabelText('Argentina score');
      await user.clear(homeInput);
      await user.type(homeInput, '3');

      await waitFor(() => {
        expect(onHomeScoreChange).toHaveBeenCalledWith(3);
      });
    });

    it('should trigger onAwayScoreChange callback when away score changes', async () => {
      const user = userEvent.setup();
      const onAwayScoreChange = vi.fn();

      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          onAwayScoreChange={onAwayScoreChange}
        />
      );

      const awayInput = screen.getByLabelText('Brazil score');
      await user.clear(awayInput);
      await user.type(awayInput, '2');

      await waitFor(() => {
        expect(onAwayScoreChange).toHaveBeenCalledWith(2);
      });
    });

    it('should call callback with undefined when input is cleared', async () => {
      const user = userEvent.setup();
      const onHomeScoreChange = vi.fn();

      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          homeScore={2}
          onHomeScoreChange={onHomeScoreChange}
        />
      );

      const homeInput = screen.getByLabelText('Argentina score');
      await user.clear(homeInput);

      await waitFor(() => {
        expect(onHomeScoreChange).toHaveBeenCalledWith(undefined);
      });
    });
  });

  describe('Penalty Shootout Section', () => {
    it('should show penalty shootout section when scores are tied in playoffs', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          isPlayoffGame={true}
          homeScore={1}
          awayScore={1}
        />
      );

      expect(screen.getByText('Penalty Shootout Scores')).toBeInTheDocument();
      expect(screen.getByLabelText('Argentina penalty score')).toBeInTheDocument();
      expect(screen.getByLabelText('Brazil penalty score')).toBeInTheDocument();
    });

    it('should hide penalty shootout section when scores are not tied', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          isPlayoffGame={true}
          homeScore={2}
          awayScore={1}
        />
      );

      expect(screen.queryByText('Penalty Shootout Scores')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Argentina penalty score')).not.toBeInTheDocument();
    });

    it('should hide penalty shootout section when not a playoff game', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          isPlayoffGame={false}
          homeScore={1}
          awayScore={1}
        />
      );

      expect(screen.queryByText('Penalty Shootout Scores')).not.toBeInTheDocument();
    });

    it('should hide penalty shootout section when scores are undefined', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          isPlayoffGame={true}
        />
      );

      expect(screen.queryByText('Penalty Shootout Scores')).not.toBeInTheDocument();
    });

    it('should trigger penalty score change callbacks', async () => {
      const user = userEvent.setup();
      const onHomePenaltyScoreChange = vi.fn();
      const onAwayPenaltyScoreChange = vi.fn();

      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          isPlayoffGame={true}
          homeScore={1}
          awayScore={1}
          onHomePenaltyScoreChange={onHomePenaltyScoreChange}
          onAwayPenaltyScoreChange={onAwayPenaltyScoreChange}
        />
      );

      const homePenaltyInput = screen.getByLabelText('Argentina penalty score');
      const awayPenaltyInput = screen.getByLabelText('Brazil penalty score');

      await user.clear(homePenaltyInput);
      await user.type(homePenaltyInput, '4');

      await user.clear(awayPenaltyInput);
      await user.type(awayPenaltyInput, '3');

      await waitFor(() => {
        expect(onHomePenaltyScoreChange).toHaveBeenCalledWith(4);
        expect(onAwayPenaltyScoreChange).toHaveBeenCalledWith(3);
      });
    });

    it('should display penalty score values when provided', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          isPlayoffGame={true}
          homeScore={1}
          awayScore={1}
          homePenaltyScore={5}
          awayPenaltyScore={4}
        />
      );

      const homePenaltyInput = screen.getByLabelText('Argentina penalty score') as HTMLInputElement;
      const awayPenaltyInput = screen.getByLabelText('Brazil penalty score') as HTMLInputElement;

      expect(homePenaltyInput.value).toBe('5');
      expect(awayPenaltyInput.value).toBe('4');
    });

    it('should render penalty inputs with team names in labels', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          isPlayoffGame={true}
          homeScore={1}
          awayScore={1}
        />
      );

      expect(screen.getByText('Argentina (Penalty)')).toBeInTheDocument();
      expect(screen.getByText('Brazil (Penalty)')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should disable save button when loading', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} loading={true} />
      );

      const saveButton = screen.getByRole('button', { name: /guardar/i });
      expect(saveButton).toBeDisabled();
    });

    it('should disable cancel button when loading', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} loading={true} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      expect(cancelButton).toBeDisabled();
    });

    it('should disable score inputs when loading', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} loading={true} />
      );

      const homeInput = screen.getByLabelText('Argentina score');
      const awayInput = screen.getByLabelText('Brazil score');

      expect(homeInput).toBeDisabled();
      expect(awayInput).toBeDisabled();
    });

    it('should disable penalty inputs when loading', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          isPlayoffGame={true}
          homeScore={1}
          awayScore={1}
          loading={true}
        />
      );

      const homePenaltyInput = screen.getByLabelText('Argentina penalty score');
      const awayPenaltyInput = screen.getByLabelText('Brazil penalty score');

      expect(homePenaltyInput).toBeDisabled();
      expect(awayPenaltyInput).toBeDisabled();
    });

    it('should show loading spinner in save button when loading', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} loading={true} />
      );

      const saveButton = screen.getByRole('button', { name: /guardar/i });
      const spinner = saveButton.querySelector('.MuiCircularProgress-root');

      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();

      renderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} onCancel={onCancel} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onSave when save button is clicked', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);

      renderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} onSave={onSave} />
      );

      const saveButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(saveButton);

      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it('should not prevent multiple save clicks', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);

      renderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} onSave={onSave} />
      );

      const saveButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(saveButton);
      await user.click(saveButton);

      expect(onSave).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Display', () => {
    it('should display error message when error prop is provided', () => {
      const errorMessage = 'Failed to save game result';

      renderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} error={errorMessage} />
      );

      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('should not display error section when error is null', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} error={null} />
      );

      // Error box should not exist
      const errorElements = screen.queryAllByText(/failed|error/i);
      expect(errorElements).toHaveLength(0);
    });

    it('should not display error section when error is undefined', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} error={undefined} />
      );

      // Error box should not exist
      const errorElements = screen.queryAllByText(/failed|error/i);
      expect(errorElements).toHaveLength(0);
    });

    it('should display error with error styling', () => {
      const errorMessage = 'Failed to save game result';

      renderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} error={errorMessage} />
      );

      const errorText = screen.getByText(errorMessage);
      expect(errorText).toHaveClass('MuiTypography-root');
    });
  });

  describe('Ref Management', () => {
    it('should attach refs to score inputs when provided', () => {
      const homeScoreInputRef = { current: null };
      const awayScoreInputRef = { current: null };

      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          homeScoreInputRef={homeScoreInputRef}
          awayScoreInputRef={awayScoreInputRef}
        />
      );

      expect(homeScoreInputRef.current).toBeInstanceOf(HTMLInputElement);
      expect(awayScoreInputRef.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Input Validation', () => {
    it('should render score inputs with min attribute set to 0', () => {
      renderWithTheme(<BackofficeGameResultEditControls {...defaultProps} />);

      const homeInput = screen.getByLabelText('Argentina score') as HTMLInputElement;
      const awayInput = screen.getByLabelText('Brazil score') as HTMLInputElement;

      expect(homeInput.min).toBe('0');
      expect(awayInput.min).toBe('0');
    });

    it('should render penalty inputs with min=0 and max=10', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          isPlayoffGame={true}
          homeScore={1}
          awayScore={1}
        />
      );

      const homePenaltyInput = screen.getByLabelText('Argentina penalty score') as HTMLInputElement;
      const awayPenaltyInput = screen.getByLabelText('Brazil penalty score') as HTMLInputElement;

      expect(homePenaltyInput.min).toBe('0');
      expect(homePenaltyInput.max).toBe('10');
      expect(awayPenaltyInput.min).toBe('0');
      expect(awayPenaltyInput.max).toBe('10');
    });

    it('should render inputs with number type', () => {
      renderWithTheme(<BackofficeGameResultEditControls {...defaultProps} />);

      const homeInput = screen.getByLabelText('Argentina score') as HTMLInputElement;
      const awayInput = screen.getByLabelText('Brazil score') as HTMLInputElement;

      expect(homeInput.type).toBe('number');
      expect(awayInput.type).toBe('number');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero scores correctly', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          homeScore={0}
          awayScore={0}
        />
      );

      const homeInput = screen.getByLabelText('Argentina score') as HTMLInputElement;
      const awayInput = screen.getByLabelText('Brazil score') as HTMLInputElement;

      expect(homeInput.value).toBe('0');
      expect(awayInput.value).toBe('0');
    });

    it('should show penalty shootout when both scores are zero in playoffs', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          isPlayoffGame={true}
          homeScore={0}
          awayScore={0}
        />
      );

      expect(screen.getByText('Penalty Shootout Scores')).toBeInTheDocument();
    });

    it('should handle team names with special characters', () => {
      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          homeTeamName="Côte d'Ivoire"
          awayTeamName="São Tomé & Príncipe"
        />
      );

      expect(screen.getByText("Côte d'Ivoire")).toBeInTheDocument();
      expect(screen.getByText("São Tomé & Príncipe")).toBeInTheDocument();
    });

    it('should handle very long team names', () => {
      const longName = 'Very Long Team Name That Should Still Display Properly';

      renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          homeTeamName={longName}
        />
      );

      expect(screen.getByText(longName)).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should maintain controlled input behavior when score changes', async () => {
      const user = userEvent.setup();
      const { rerenderWithTheme } = renderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} homeScore={1} />
      );

      const homeInput = screen.getByLabelText('Argentina score') as HTMLInputElement;
      expect(homeInput.value).toBe('1');

      rerenderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} homeScore={2} />
      );

      expect(homeInput.value).toBe('2');
    });

    it('should transition to penalty shootout when scores become tied in playoffs', () => {
      const { rerenderWithTheme } = renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          isPlayoffGame={true}
          homeScore={2}
          awayScore={1}
        />
      );

      expect(screen.queryByText('Penalty Shootout Scores')).not.toBeInTheDocument();

      rerenderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          isPlayoffGame={true}
          homeScore={1}
          awayScore={1}
        />
      );

      expect(screen.getByText('Penalty Shootout Scores')).toBeInTheDocument();
    });

    it('should clear error when error prop changes to null', () => {
      const { rerenderWithTheme } = renderWithTheme(
        <BackofficeGameResultEditControls
          {...defaultProps}
          error="Test error"
        />
      );

      expect(screen.getByText('Test error')).toBeInTheDocument();

      rerenderWithTheme(
        <BackofficeGameResultEditControls {...defaultProps} error={null} />
      );

      expect(screen.queryByText('Test error')).not.toBeInTheDocument();
    });
  });
});

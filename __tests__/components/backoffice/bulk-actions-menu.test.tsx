import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../utils/test-utils';
import BulkActionsMenu from '../../../app/components/backoffice/bulk-actions-menu';
import * as gameScoreGeneratorActions from '../../../app/actions/game-score-generator-actions';

// Mock the server actions module
vi.mock('../../../app/actions/game-score-generator-actions', () => ({
  autoFillGameScores: vi.fn(),
  clearGameScores: vi.fn(),
}));

// Mock ConfirmDialog component
vi.mock('../../../app/components/confirm-dialog', () => ({
  default: ({ open, title, message, onConfirm, onCancel, confirmText, cancelText, confirmColor, loading }: any) => {
    if (!open) return null;
    return (
      <div data-testid="confirm-dialog">
        <div data-testid="dialog-title">{title}</div>
        <div data-testid="dialog-message">{message}</div>
        <button
          data-testid="dialog-cancel"
          onClick={onCancel}
          disabled={loading}
        >
          {cancelText}
        </button>
        <button
          data-testid="dialog-confirm"
          onClick={onConfirm}
          disabled={loading}
        >
          {confirmText}
        </button>
      </div>
    );
  },
}));

describe('BulkActionsMenu', () => {
  const mockOnComplete = vi.fn();
  const mockAutoFillGameScores = vi.mocked(gameScoreGeneratorActions.autoFillGameScores);
  const mockClearGameScores = vi.mocked(gameScoreGeneratorActions.clearGameScores);

  const defaultProps = {
    groupId: 'group-1',
    sectionName: 'Group A',
    onComplete: mockOnComplete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render bulk actions button', () => {
      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      const button = screen.getByRole('button', { name: /bulk actions/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Bulk Actions');
    });

    it('should render button with settings icon', () => {
      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      const button = screen.getByRole('button', { name: /bulk actions/i });
      expect(button.querySelector('svg')).toBeInTheDocument();
    });

    it('should render button in non-disabled state initially', () => {
      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      const button = screen.getByRole('button', { name: /bulk actions/i });
      expect(button).not.toBeDisabled();
    });
  });

  describe('Menu interactions', () => {
    it('should open menu on button click', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      const button = screen.getByRole('button', { name: /bulk actions/i });
      await user.click(button);

      // Menu should be open with both options visible
      expect(screen.getByText('Auto-fill Scores')).toBeInTheDocument();
      expect(screen.getByText('Clear All Scores')).toBeInTheDocument();
    });

    it('should display auto-fill option in menu', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));

      const autoFillOption = screen.getByText('Auto-fill Scores');
      expect(autoFillOption).toBeInTheDocument();
    });

    it('should display clear option in menu', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));

      const clearOption = screen.getByText('Clear All Scores');
      expect(clearOption).toBeInTheDocument();
    });

    it('should close menu when clicking outside', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      expect(screen.getByText('Auto-fill Scores')).toBeInTheDocument();

      // Click outside by pressing Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByText('Auto-fill Scores')).not.toBeInTheDocument();
      });
    });
  });

  describe('Auto-fill functionality', () => {
    it('should call autoFillGameScores server action when auto-fill is clicked', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockResolvedValue({
        success: true,
        filledCount: 5,
        skippedCount: 0,
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      expect(mockAutoFillGameScores).toHaveBeenCalledWith('group-1', undefined);
    });

    it('should pass playoffRoundId to autoFillGameScores when provided', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockResolvedValue({
        success: true,
        filledCount: 3,
        skippedCount: 0,
      });

      renderWithTheme(
        <BulkActionsMenu
          playoffRoundId="round-1"
          sectionName="Quarterfinals"
          onComplete={mockOnComplete}
        />
      );

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      expect(mockAutoFillGameScores).toHaveBeenCalledWith(undefined, 'round-1');
    });

    it('should show success snackbar after successful auto-fill', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockResolvedValue({
        success: true,
        filledCount: 5,
        skippedCount: 0,
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      await waitFor(() => {
        expect(screen.getByText('Auto-filled 5 games in Group A')).toBeInTheDocument();
      });
    });

    it('should show success snackbar with skipped games count', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockResolvedValue({
        success: true,
        filledCount: 3,
        skippedCount: 2,
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      await waitFor(() => {
        expect(screen.getByText('Auto-filled 3 games in Group A (skipped 2 published games)')).toBeInTheDocument();
      });
    });

    it('should show singular form for one game filled', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockResolvedValue({
        success: true,
        filledCount: 1,
        skippedCount: 0,
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      await waitFor(() => {
        expect(screen.getByText('Auto-filled 1 game in Group A')).toBeInTheDocument();
      });
    });

    it('should show singular form for one skipped game', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockResolvedValue({
        success: true,
        filledCount: 5,
        skippedCount: 1,
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      await waitFor(() => {
        expect(screen.getByText('Auto-filled 5 games in Group A (skipped 1 published game)')).toBeInTheDocument();
      });
    });

    it('should show error snackbar when auto-fill fails', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      await waitFor(() => {
        expect(screen.getByText('Failed to auto-fill scores: Database connection failed')).toBeInTheDocument();
      });
    });

    it('should show error snackbar when auto-fill throws exception', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockRejectedValue(new Error('Network error'));

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });

    it('should call onComplete callback after successful auto-fill', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockResolvedValue({
        success: true,
        filledCount: 5,
        skippedCount: 0,
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onComplete callback after failed auto-fill', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockResolvedValue({
        success: false,
        error: 'Operation failed',
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      await waitFor(() => {
        expect(screen.getByText(/Failed to auto-fill scores/)).toBeInTheDocument();
      });

      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should disable button while auto-fill is in progress', async () => {
      const user = userEvent.setup();
      let resolveAutoFill: any;
      mockAutoFillGameScores.mockReturnValue(
        new Promise((resolve) => {
          resolveAutoFill = resolve;
        })
      );

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      const button = screen.getByRole('button', { name: /bulk actions/i });
      await user.click(button);
      await user.click(screen.getByText('Auto-fill Scores'));

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      // Resolve the promise
      resolveAutoFill({ success: true, filledCount: 5, skippedCount: 0 });

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should show loading indicator while auto-fill is in progress', async () => {
      const user = userEvent.setup();
      let resolveAutoFill: any;
      mockAutoFillGameScores.mockReturnValue(
        new Promise((resolve) => {
          resolveAutoFill = resolve;
        })
      );

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      const button = screen.getByRole('button', { name: /bulk actions/i });
      await user.click(button);
      await user.click(screen.getByText('Auto-fill Scores'));

      await waitFor(() => {
        expect(button.querySelector('.MuiCircularProgress-root')).toBeInTheDocument();
      });

      // Resolve the promise
      resolveAutoFill({ success: true, filledCount: 5, skippedCount: 0 });

      await waitFor(() => {
        expect(button.querySelector('.MuiCircularProgress-root')).not.toBeInTheDocument();
      });
    });
  });

  describe('Clear functionality', () => {
    it('should show confirmation dialog when clear is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Clear All Scores'));

      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Clear All Scores in Group A?');
      expect(screen.getByTestId('dialog-message')).toHaveTextContent(
        'This will remove all scores and set all games to DRAFT status in Group A. This action cannot be undone.'
      );
    });

    it('should not call clearGameScores when cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Clear All Scores'));

      const cancelButton = screen.getByTestId('dialog-cancel');
      await user.click(cancelButton);

      expect(mockClearGameScores).not.toHaveBeenCalled();
    });

    it('should call clearGameScores server action when confirm is clicked', async () => {
      const user = userEvent.setup();
      mockClearGameScores.mockResolvedValue({
        success: true,
        clearedCount: 5,
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Clear All Scores'));

      const confirmButton = screen.getByTestId('dialog-confirm');
      await user.click(confirmButton);

      expect(mockClearGameScores).toHaveBeenCalledWith('group-1', undefined);
    });

    it('should pass playoffRoundId to clearGameScores when provided', async () => {
      const user = userEvent.setup();
      mockClearGameScores.mockResolvedValue({
        success: true,
        clearedCount: 3,
      });

      renderWithTheme(
        <BulkActionsMenu
          playoffRoundId="round-1"
          sectionName="Semifinals"
          onComplete={mockOnComplete}
        />
      );

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Clear All Scores'));
      await user.click(screen.getByTestId('dialog-confirm'));

      expect(mockClearGameScores).toHaveBeenCalledWith(undefined, 'round-1');
    });

    it('should show success snackbar after successful clear', async () => {
      const user = userEvent.setup();
      mockClearGameScores.mockResolvedValue({
        success: true,
        clearedCount: 5,
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Clear All Scores'));
      await user.click(screen.getByTestId('dialog-confirm'));

      await waitFor(() => {
        expect(screen.getByText('Cleared scores from 5 games in Group A')).toBeInTheDocument();
      });
    });

    it('should show singular form for one game cleared', async () => {
      const user = userEvent.setup();
      mockClearGameScores.mockResolvedValue({
        success: true,
        clearedCount: 1,
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Clear All Scores'));
      await user.click(screen.getByTestId('dialog-confirm'));

      await waitFor(() => {
        expect(screen.getByText('Cleared scores from 1 game in Group A')).toBeInTheDocument();
      });
    });

    it('should show error snackbar when clear fails', async () => {
      const user = userEvent.setup();
      mockClearGameScores.mockResolvedValue({
        success: false,
        error: 'Permission denied',
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Clear All Scores'));
      await user.click(screen.getByTestId('dialog-confirm'));

      await waitFor(() => {
        expect(screen.getByText('Failed to clear scores: Permission denied')).toBeInTheDocument();
      });
    });

    it('should show error snackbar when clear throws exception', async () => {
      const user = userEvent.setup();
      mockClearGameScores.mockRejectedValue(new Error('Network error'));

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Clear All Scores'));
      await user.click(screen.getByTestId('dialog-confirm'));

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
      });
    });

    it('should call onComplete callback after successful clear', async () => {
      const user = userEvent.setup();
      mockClearGameScores.mockResolvedValue({
        success: true,
        clearedCount: 5,
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Clear All Scores'));
      await user.click(screen.getByTestId('dialog-confirm'));

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledTimes(1);
      });
    });

    it('should not call onComplete callback after failed clear', async () => {
      const user = userEvent.setup();
      mockClearGameScores.mockResolvedValue({
        success: false,
        error: 'Operation failed',
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Clear All Scores'));
      await user.click(screen.getByTestId('dialog-confirm'));

      await waitFor(() => {
        expect(screen.getByText(/Failed to clear scores/)).toBeInTheDocument();
      });

      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should close confirmation dialog after cancel', async () => {
      const user = userEvent.setup();
      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Clear All Scores'));

      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();

      await user.click(screen.getByTestId('dialog-cancel'));

      await waitFor(() => {
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      });
    });

    it('should close confirmation dialog after confirm and start loading', async () => {
      const user = userEvent.setup();
      mockClearGameScores.mockResolvedValue({
        success: true,
        clearedCount: 5,
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Clear All Scores'));
      await user.click(screen.getByTestId('dialog-confirm'));

      await waitFor(() => {
        expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      });
    });

    it('should disable button while clear is in progress', async () => {
      const user = userEvent.setup();
      let resolveClear: any;
      mockClearGameScores.mockReturnValue(
        new Promise((resolve) => {
          resolveClear = resolve;
        })
      );

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      const button = screen.getByRole('button', { name: /bulk actions/i });
      await user.click(button);
      await user.click(screen.getByText('Clear All Scores'));
      await user.click(screen.getByTestId('dialog-confirm'));

      await waitFor(() => {
        expect(button).toBeDisabled();
      });

      // Resolve the promise
      resolveClear({ success: true, clearedCount: 5 });

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Snackbar interactions', () => {
    it('should close snackbar when close button is clicked', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockResolvedValue({
        success: true,
        filledCount: 5,
        skippedCount: 0,
      });

      renderWithTheme(<BulkActionsMenu {...defaultProps} />);

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      await waitFor(() => {
        expect(screen.getByText('Auto-filled 5 games in Group A')).toBeInTheDocument();
      });

      // Click the close button in the snackbar
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Auto-filled 5 games in Group A')).not.toBeInTheDocument();
      });
    });
  });

  describe('Menu options with different props', () => {
    it('should work with only groupId', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockResolvedValue({
        success: true,
        filledCount: 3,
        skippedCount: 0,
      });

      renderWithTheme(
        <BulkActionsMenu
          groupId="group-2"
          sectionName="Group B"
        />
      );

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      expect(mockAutoFillGameScores).toHaveBeenCalledWith('group-2', undefined);
    });

    it('should work with only playoffRoundId', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockResolvedValue({
        success: true,
        filledCount: 2,
        skippedCount: 0,
      });

      renderWithTheme(
        <BulkActionsMenu
          playoffRoundId="round-2"
          sectionName="Finals"
        />
      );

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      expect(mockAutoFillGameScores).toHaveBeenCalledWith(undefined, 'round-2');
    });

    it('should work without onComplete callback', async () => {
      const user = userEvent.setup();
      mockAutoFillGameScores.mockResolvedValue({
        success: true,
        filledCount: 4,
        skippedCount: 0,
      });

      renderWithTheme(
        <BulkActionsMenu
          groupId="group-3"
          sectionName="Group C"
        />
      );

      await user.click(screen.getByRole('button', { name: /bulk actions/i }));
      await user.click(screen.getByText('Auto-fill Scores'));

      await waitFor(() => {
        expect(screen.getByText('Auto-filled 4 games in Group C')).toBeInTheDocument();
      });

      // No error should be thrown
      expect(mockAutoFillGameScores).toHaveBeenCalled();
    });
  });
});

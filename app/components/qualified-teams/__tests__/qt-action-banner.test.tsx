import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QTActionBanner } from '../qt-action-banner';
import { renderWithTheme } from '@/__tests__/utils/test-utils';

vi.mock('../../../actions/qualification-actions', () => ({
  bulkAutoFillFromPredictions: vi.fn(),
}));

import { bulkAutoFillFromPredictions } from '../../../actions/qualification-actions';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => '/es',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const mockOnAutoFillSuccess = vi.fn();

const defaultProps = {
  tournamentId: 'tournament-1',
  isLocked: false,
  onAutoFillSuccess: mockOnAutoFillSuccess,
};

describe('QTActionBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders null when bannerState is falsy', () => {
    const { container } = renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders incomplete-games state with link to next unpredicted game', () => {
    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="incomplete-games" />
    );
    // Spanish: "Los partidos de la fase de grupos aún no están completos."
    expect(screen.getAllByText(/fase de grupos|partidos/i).length).toBeGreaterThan(0);
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', expect.stringContaining('edit=next'));
  });

  it('renders games-finished state with auto-fill button', () => {
    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="games-finished" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders all-valid state with awards link and recalculate button', () => {
    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="all-valid" />
    );
    expect(screen.getByRole('link')).toBeInTheDocument();
    // Spanish: "Recalcular"
    expect(screen.getByRole('button', { name: /recalcul/i })).toBeInTheDocument();
  });

  it('disables auto-fill button when isLocked', () => {
    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="games-finished" isLocked={true} />
    );
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables recalculate button when isLocked', () => {
    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="all-valid" isLocked={true} />
    );
    expect(screen.getByRole('button', { name: /recalcul/i })).toBeDisabled();
  });

  it('shows confirm dialog before calling the action', () => {
    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="games-finished" />
    );
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(bulkAutoFillFromPredictions).not.toHaveBeenCalled();
  });

  it('does not call action when confirm dialog is cancelled', () => {
    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="games-finished" />
    );
    fireEvent.click(screen.getByRole('button'));
    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);
    expect(bulkAutoFillFromPredictions).not.toHaveBeenCalled();
  });

  it('calls onAutoFillSuccess with predictions after successful auto-fill', async () => {
    const mockPredictions = [
      { id: 'p1', user_id: 'u1', tournament_id: 't1', group_id: 'g1', team_id: 'team-1', predicted_position: 1, predicted_to_qualify: true, created_at: undefined, updated_at: undefined },
    ];
    vi.mocked(bulkAutoFillFromPredictions).mockResolvedValue({
      success: true,
      message: 'done',
      groupsProcessed: 3,
      predictions: mockPredictions,
    });

    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="games-finished" />
    );

    fireEvent.click(screen.getByRole('button'));
    // Spanish: "Completar" is the confirm button in the dialog
    const dialogButtons = screen.getAllByRole('button');
    const confirmButton = dialogButtons.find((b) => b.textContent?.match(/completar/i) && !b.disabled);
    fireEvent.click(confirmButton!);

    await waitFor(() => {
      expect(bulkAutoFillFromPredictions).toHaveBeenCalledWith('tournament-1', expect.any(String));
      expect(mockOnAutoFillSuccess).toHaveBeenCalledWith(mockPredictions);
    });
  });

  it('shows error snackbar when bulkAutoFillFromPredictions returns failure', async () => {
    vi.mocked(bulkAutoFillFromPredictions).mockResolvedValue({
      success: false,
      message: 'error message',
      groupsProcessed: 0,
    });

    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="games-finished" />
    );

    fireEvent.click(screen.getByRole('button'));
    const dialogButtons = screen.getAllByRole('button');
    const confirmButton = dialogButtons.find((b) => b.textContent?.match(/completar/i) && !b.disabled);
    fireEvent.click(confirmButton!);

    await waitFor(() => {
      expect(mockOnAutoFillSuccess).not.toHaveBeenCalled();
    });
  });

  it('opens confirm dialog from recalculate button in all-valid state', () => {
    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="all-valid" />
    );
    const recalcButton = screen.getByRole('button', { name: /recalcul/i });
    fireEvent.click(recalcButton);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(bulkAutoFillFromPredictions).not.toHaveBeenCalled();
  });
});

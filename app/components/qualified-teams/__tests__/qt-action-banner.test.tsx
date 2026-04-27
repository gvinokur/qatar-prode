import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QTActionBanner } from '../qt-action-banner';
import { renderWithTheme } from '@/__tests__/utils/test-utils';

vi.mock('../../../actions/qualification-actions', () => ({
  bulkAutoFillFromPredictions: vi.fn(),
}));

import { bulkAutoFillFromPredictions } from '../../../actions/qualification-actions';

const mockRefresh = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
  usePathname: () => '/es',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

const defaultProps = {
  tournamentId: 'tournament-1',
  isLocked: false,
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

  it('renders incomplete-games state', () => {
    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="incomplete-games" />
    );
    // Spanish: "Los partidos de la fase de grupos aún no están completos."
    expect(screen.getAllByText(/fase de grupos|partidos/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('renders games-finished state with auto-fill button', () => {
    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="games-finished" />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders all-valid state', () => {
    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="all-valid" />
    );
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('disables auto-fill button when isLocked', () => {
    renderWithTheme(
      <QTActionBanner {...defaultProps} bannerState="games-finished" isLocked={true} />
    );
    expect(screen.getByRole('button')).toBeDisabled();
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

  it('calls router.refresh() after successful auto-fill', async () => {
    vi.mocked(bulkAutoFillFromPredictions).mockResolvedValue({
      success: true,
      message: 'done',
      groupsProcessed: 3,
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
      expect(mockRefresh).toHaveBeenCalled();
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
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });
});

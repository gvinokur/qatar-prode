import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewTournamentSnackbar from '../new-tournament-snackbar';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import * as dismissalStorage from '@/app/utils/dismissal-storage';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, string>) => {
    const translations: Record<string, string> = {
      'title': 'Multiple Tournaments Active!',
      'currentTournament': "You're viewing {name}.",
      'otherTournaments': 'Other tournaments:',
      'instructions': 'Switch anytime using the dropdown in the header.',
    };
    let text = translations[key] || key;
    // Replace placeholders if values provided
    if (values) {
      Object.keys(values).forEach(placeholder => {
        text = text.replace(`{${placeholder}}`, values[placeholder]);
      });
    }
    return text;
  },
}));

// Mock dismissal-storage functions
vi.mock('@/app/utils/dismissal-storage', () => ({
  getDismissalState: vi.fn(),
  setDismissalState: vi.fn(),
}));

describe('NewTournamentSnackbar', () => {
  const mockGetDismissalState = vi.mocked(dismissalStorage.getDismissalState);
  const mockSetDismissalState = vi.mocked(dismissalStorage.setDismissalState);

  const defaultProps = {
    tournamentId: 'tournament-1',
    tournamentName: 'World Cup 2026',
    otherTournaments: [
      { id: 'tournament-2', long_name: 'Copa America 2024' },
      { id: 'tournament-3', long_name: 'Euro 2024' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: not dismissed
    mockGetDismissalState.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('does not show when no other tournaments', () => {
    renderWithTheme(
      <NewTournamentSnackbar
        {...defaultProps}
        otherTournaments={[]}
      />
    );

    expect(screen.queryByText('Multiple Tournaments Active!')).not.toBeInTheDocument();
  });

  it('shows snackbar when other tournaments exist', async () => {
    renderWithTheme(<NewTournamentSnackbar {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Multiple Tournaments Active!')).toBeInTheDocument();
    });
  });

  it('shows current tournament name', async () => {
    renderWithTheme(<NewTournamentSnackbar {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("You're viewing World Cup 2026.")).toBeInTheDocument();
    });
  });

  it('lists other available tournaments', async () => {
    renderWithTheme(<NewTournamentSnackbar {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Other tournaments:')).toBeInTheDocument();
      expect(screen.getByText('Copa America 2024')).toBeInTheDocument();
      expect(screen.getByText('Euro 2024')).toBeInTheDocument();
    });
  });

  it('does not show if previously dismissed', () => {
    mockGetDismissalState.mockReturnValue(true);

    renderWithTheme(<NewTournamentSnackbar {...defaultProps} />);

    expect(screen.queryByText('Multiple Tournaments Active!')).not.toBeInTheDocument();
    expect(mockGetDismissalState).toHaveBeenCalledWith('tournamentSnackbar_tournament-1');
  });

  it('dismisses and saves to localStorage on close button click', async () => {
    const user = userEvent.setup();

    renderWithTheme(<NewTournamentSnackbar {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Multiple Tournaments Active!')).toBeInTheDocument();
    });

    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // Verify setDismissalState was called
    expect(mockSetDismissalState).toHaveBeenCalledWith('tournamentSnackbar_tournament-1', true);

    // Verify snackbar is no longer visible
    await waitFor(() => {
      expect(screen.queryByText('Multiple Tournaments Active!')).not.toBeInTheDocument();
    });
  });

  it('auto-dismisses after timeout', async () => {
    vi.useFakeTimers();

    try {
      renderWithTheme(<NewTournamentSnackbar {...defaultProps} />);

      // Run microtasks to trigger useEffect and timers
      await act(async () => {
        await vi.runAllTimersAsync();
      });

      // Verify setDismissalState was called after auto-hide duration
      expect(mockSetDismissalState).toHaveBeenCalledWith('tournamentSnackbar_tournament-1', true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses correct dismissal key based on tournament ID', () => {
    renderWithTheme(
      <NewTournamentSnackbar
        {...defaultProps}
        tournamentId="custom-tournament-id"
      />
    );

    expect(mockGetDismissalState).toHaveBeenCalledWith('tournamentSnackbar_custom-tournament-id');
  });

  it('shows instructions for switching tournaments', async () => {
    renderWithTheme(<NewTournamentSnackbar {...defaultProps} />);

    // Wait for snackbar to open
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Switch anytime using the dropdown in the header.')).toBeInTheDocument();
  });

  it('renders with info severity and outlined variant', async () => {
    const { container } = renderWithTheme(<NewTournamentSnackbar {...defaultProps} />);

    // Wait for snackbar to open
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const alert = container.querySelector('.MuiAlert-root');
    expect(alert).toHaveClass('MuiAlert-outlinedInfo');
  });

  it('renders tournaments as a list', async () => {
    renderWithTheme(<NewTournamentSnackbar {...defaultProps} />);

    // Wait for snackbar to open
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });

  it('shows snackbar when component re-mounts with different tournament', async () => {
    const { rerenderWithTheme } = renderWithTheme(<NewTournamentSnackbar {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Multiple Tournaments Active!')).toBeInTheDocument();
    });

    // Rerender with different tournament (not dismissed)
    mockGetDismissalState.mockReturnValue(false);
    rerenderWithTheme(
      <NewTournamentSnackbar
        {...defaultProps}
        tournamentId="tournament-2"
        tournamentName="Copa America 2024"
      />
    );

    // Wait for rerender to complete
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(mockGetDismissalState).toHaveBeenCalledWith('tournamentSnackbar_tournament-2');
    expect(screen.getByText("You're viewing Copa America 2024.")).toBeInTheDocument();
  });

  it('remains hidden when tournament changes but new one is also dismissed', () => {
    mockGetDismissalState.mockReturnValue(true);

    const { rerenderWithTheme } = renderWithTheme(<NewTournamentSnackbar {...defaultProps} />);

    expect(screen.queryByText('Multiple Tournaments Active!')).not.toBeInTheDocument();

    // Rerender with different tournament (also dismissed)
    rerenderWithTheme(
      <NewTournamentSnackbar
        {...defaultProps}
        tournamentId="tournament-2"
        tournamentName="Copa America 2024"
      />
    );

    expect(screen.queryByText('Multiple Tournaments Active!')).not.toBeInTheDocument();
  });
});

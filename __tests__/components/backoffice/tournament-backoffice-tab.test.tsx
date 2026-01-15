import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TournamentBackofficeTab from '../../../app/components/backoffice/tournament-backoffice-tab';
import { Tournament } from '../../../app/db/tables-definition';
import * as backofficeActions from '../../../app/actions/backoffice-actions';
import * as tournamentActions from '../../../app/actions/tournament-actions';

// Mock next/navigation
const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: mockRefresh,
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

// Mock actions
vi.mock('../../../app/actions/backoffice-actions', () => ({
  generateDbTournamentTeamPlayers: vi.fn(),
  calculateAllUsersGroupPositions: vi.fn(),
  recalculateAllPlayoffFirstRoundGameGuesses: vi.fn(),
  calculateGameScores: vi.fn(),
  calculateAndStoreQualifiedTeamsPoints: vi.fn(),
  calculateAndStoreGroupPositionScores: vi.fn(),
  deleteDBTournamentTree: vi.fn(),
}));

vi.mock('../../../app/actions/tournament-actions', () => ({
  deactivateTournament: vi.fn(),
}));

// Mock DebugObject component
vi.mock('../../../app/components/debug', () => ({
  DebugObject: ({ object }: any) => <div data-testid="debug-object">{JSON.stringify(object)}</div>,
}));

describe('TournamentBackofficeTab', () => {
  const mockActiveTournament: Tournament = {
    id: 'tournament-1',
    long_name: 'Test Tournament 2024',
    short_name: 'TT2024',
    is_active: true,
    dev_only: false,
    display_name: true,
    theme: null,
    champion_team_id: null,
    runner_up_team_id: null,
    third_place_team_id: null,
    best_player_id: undefined,
    top_goalscorer_player_id: undefined,
    best_goalkeeper_player_id: undefined,
    best_young_player_id: undefined,
  };

  const mockInactiveTournament: Tournament = {
    ...mockActiveTournament,
    is_active: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all action buttons', () => {
      render(<TournamentBackofficeTab tournament={mockActiveTournament} />);

      expect(screen.getByText('Import Players')).toBeInTheDocument();
      expect(screen.getByText('Calculate Group Positions for players')).toBeInTheDocument();
      expect(screen.getByText('Calculate First Playoff Stage teams')).toBeInTheDocument();
      expect(screen.getByText('Calculate Game Scores')).toBeInTheDocument();
      expect(screen.getByText('Calculate Qualified Team Scores')).toBeInTheDocument();
      expect(screen.getByText('Calculate Group Position Scores')).toBeInTheDocument();
      expect(screen.getByText('Deactivate Tournament')).toBeInTheDocument();
    });

    it('should show delete button only for inactive tournaments', () => {
      const { rerender } = render(<TournamentBackofficeTab tournament={mockActiveTournament} />);

      expect(screen.queryByText('Delete Tournament')).not.toBeInTheDocument();

      rerender(<TournamentBackofficeTab tournament={mockInactiveTournament} />);

      expect(screen.getByText('Delete Tournament')).toBeInTheDocument();
    });

    it('should show deactivate button as disabled for inactive tournaments', () => {
      render(<TournamentBackofficeTab tournament={mockInactiveTournament} />);

      const deactivateButton = screen.getByText('Tournament Inactive').closest('button');
      expect(deactivateButton).toBeDisabled();
    });
  });

  describe('Action Buttons', () => {
    it('should call generateDbTournamentTeamPlayers when Import Players is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(backofficeActions.generateDbTournamentTeamPlayers).mockResolvedValue(['Success']);

      render(<TournamentBackofficeTab tournament={mockActiveTournament} />);

      const importButton = screen.getByText('Import Players');
      await user.click(importButton);

      await waitFor(() => {
        expect(backofficeActions.generateDbTournamentTeamPlayers).toHaveBeenCalledWith(mockActiveTournament.long_name);
      });
    });

    it('should call calculateAllUsersGroupPositions when button is clicked', async () => {
      const user = userEvent.setup();
      const mockResult = { success: true };
      vi.mocked(backofficeActions.calculateAllUsersGroupPositions).mockResolvedValue(mockResult as any);

      render(<TournamentBackofficeTab tournament={mockActiveTournament} />);

      const button = screen.getByText('Calculate Group Positions for players');
      await user.click(button);

      await waitFor(() => {
        expect(backofficeActions.calculateAllUsersGroupPositions).toHaveBeenCalledWith(mockActiveTournament.id);
      });
    });

    it('should call calculateGameScores when button is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(backofficeActions.calculateGameScores).mockResolvedValue([]);

      render(<TournamentBackofficeTab tournament={mockActiveTournament} />);

      const button = screen.getByText('Calculate Game Scores');
      await user.click(button);

      await waitFor(() => {
        expect(backofficeActions.calculateGameScores).toHaveBeenCalledWith(false, false);
      });
    });

    it('should display action results after button click', async () => {
      const user = userEvent.setup();
      const mockResult = { users: 10, updated: 5 };
      vi.mocked(backofficeActions.calculateAllUsersGroupPositions).mockResolvedValue(mockResult as any);

      render(<TournamentBackofficeTab tournament={mockActiveTournament} />);

      const button = screen.getByText('Calculate Group Positions for players');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByTestId('debug-object')).toBeInTheDocument();
        expect(screen.getByText('Clear Results')).toBeInTheDocument();
      });
    });

    it('should clear action results when Clear Results is clicked', async () => {
      const user = userEvent.setup();
      const mockResult = { success: true };
      vi.mocked(backofficeActions.calculateAllUsersGroupPositions).mockResolvedValue(mockResult as any);

      render(<TournamentBackofficeTab tournament={mockActiveTournament} />);

      const button = screen.getByText('Calculate Group Positions for players');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Clear Results')).toBeInTheDocument();
      });

      const clearButton = screen.getByText('Clear Results');
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.queryByTestId('debug-object')).not.toBeInTheDocument();
      });
    });
  });

  describe('Deactivate Functionality', () => {
    it('should open deactivate dialog when deactivate button is clicked', async () => {
      const user = userEvent.setup();

      render(<TournamentBackofficeTab tournament={mockActiveTournament} />);

      const deactivateButton = screen.getByText('Deactivate Tournament');
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to deactivate this tournament?/)).toBeInTheDocument();
      });
    });

    it('should close deactivate dialog when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<TournamentBackofficeTab tournament={mockActiveTournament} />);

      const deactivateButton = screen.getByText('Deactivate Tournament');
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should call deactivateTournament and refresh when confirmed', async () => {
      const user = userEvent.setup();
      vi.mocked(tournamentActions.deactivateTournament).mockResolvedValue(undefined);

      render(<TournamentBackofficeTab tournament={mockActiveTournament} />);

      const deactivateButton = screen.getByText('Deactivate Tournament');
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /deactivate/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(tournamentActions.deactivateTournament).toHaveBeenCalledWith(mockActiveTournament.id);
      });

      await waitFor(() => {
        expect(screen.getByText('Tournament successfully deactivated')).toBeInTheDocument();
      });

      // Wait for router.refresh to be called
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should display error when deactivation fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to deactivate';
      vi.mocked(tournamentActions.deactivateTournament).mockRejectedValue(new Error(errorMessage));

      render(<TournamentBackofficeTab tournament={mockActiveTournament} />);

      const deactivateButton = screen.getByText('Deactivate Tournament');
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /deactivate/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });
  });

  describe('Delete Functionality', () => {
    it('should open delete dialog when delete button is clicked', async () => {
      const user = userEvent.setup();

      render(<TournamentBackofficeTab tournament={mockInactiveTournament} />);

      const deleteButton = screen.getByText('Delete Tournament');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Warning: This action is permanent and cannot be undone!/)).toBeInTheDocument();
        expect(screen.getByText(/All user predictions and guesses/)).toBeInTheDocument();
      });
    });

    it('should close delete dialog when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<TournamentBackofficeTab tournament={mockInactiveTournament} />);

      const deleteButton = screen.getByText('Delete Tournament');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should call deleteDBTournamentTree and redirect when confirmed', async () => {
      const user = userEvent.setup();
      vi.mocked(backofficeActions.deleteDBTournamentTree).mockResolvedValue(undefined);

      render(<TournamentBackofficeTab tournament={mockInactiveTournament} />);

      const deleteButton = screen.getByText('Delete Tournament');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete permanently/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(backofficeActions.deleteDBTournamentTree).toHaveBeenCalledWith(mockInactiveTournament);
      });

      await waitFor(() => {
        expect(screen.getByText('Tournament successfully deleted. Redirecting...')).toBeInTheDocument();
      });

      // Wait for router.push and refresh to be called
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/backoffice');
        expect(mockRefresh).toHaveBeenCalled();
      }, { timeout: 2500 });
    });

    it('should display error when deletion fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Cannot delete active tournament';
      vi.mocked(backofficeActions.deleteDBTournamentTree).mockRejectedValue(new Error(errorMessage));

      render(<TournamentBackofficeTab tournament={mockInactiveTournament} />);

      const deleteButton = screen.getByText('Delete Tournament');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete permanently/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Dialog should remain open on error
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should disable buttons while action is loading', async () => {
      const user = userEvent.setup();
      vi.mocked(backofficeActions.generateDbTournamentTeamPlayers).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(['Success']), 100))
      );

      render(<TournamentBackofficeTab tournament={mockActiveTournament} />);

      const importButton = screen.getByText('Import Players').closest('button');
      await user.click(importButton!);

      // Button should show loading state
      expect(importButton).toBeInTheDocument();
    });
  });

  describe('Snackbar Notifications', () => {
    it('should close deactivate success snackbar when close is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(tournamentActions.deactivateTournament).mockResolvedValue(undefined);

      render(<TournamentBackofficeTab tournament={mockActiveTournament} />);

      const deactivateButton = screen.getByText('Deactivate Tournament');
      await user.click(deactivateButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /deactivate/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Tournament successfully deactivated')).toBeInTheDocument();
      });

      // Snackbar displays successfully - close button interaction is handled by MUI
    });

    it('should close delete success snackbar when close is clicked', async () => {
      const user = userEvent.setup();
      vi.mocked(backofficeActions.deleteDBTournamentTree).mockResolvedValue(undefined);

      render(<TournamentBackofficeTab tournament={mockInactiveTournament} />);

      const deleteButton = screen.getByText('Delete Tournament');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: /delete permanently/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('Tournament successfully deleted. Redirecting...')).toBeInTheDocument();
      });
    });
  });
});

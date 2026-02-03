import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateTournamentModal from '../../../../app/components/backoffice/internal/create-tournament-modal';
import * as tournamentActions from '../../../../app/actions/tournament-actions';
import * as backofficeActions from '../../../../app/actions/backoffice-actions';
import { Tournament } from '../../../../app/db/tables-definition';

// Mock actions
vi.mock('../../../../app/actions/tournament-actions', () => ({
  createOrUpdateTournament: vi.fn(),
  getAllTournaments: vi.fn(),
}));

vi.mock('../../../../app/actions/backoffice-actions', () => ({
  copyTournament: vi.fn(),
}));

describe('CreateTournamentModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const mockTournaments: Tournament[] = [
    {
      id: 'tournament-1',
      long_name: 'World Cup 2024',
      short_name: 'WC2024',
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
      game_exact_score_points: 3,
      game_correct_outcome_points: 1,
      champion_points: 10,
      runner_up_points: 5,
      third_place_points: 3,
      individual_award_points: 5,
      qualified_team_points: 1,
      exact_position_qualified_points: 1,
      max_silver_games: 3,
      max_golden_games: 1,
    },
    {
      id: 'tournament-2',
      long_name: 'Euro 2024',
      short_name: 'Euro2024',
      is_active: false,
      dev_only: false,
      display_name: false,
      theme: null,
      champion_team_id: null,
      runner_up_team_id: null,
      third_place_team_id: null,
      best_player_id: undefined,
      top_goalscorer_player_id: undefined,
      best_goalkeeper_player_id: undefined,
      best_young_player_id: undefined,
      game_exact_score_points: 3,
      game_correct_outcome_points: 1,
      champion_points: 10,
      runner_up_points: 5,
      third_place_points: 3,
      individual_award_points: 5,
      qualified_team_points: 1,
      exact_position_qualified_points: 1,
      max_silver_games: 3,
      max_golden_games: 1,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tournamentActions.getAllTournaments).mockResolvedValue(mockTournaments);
  });

  describe('Rendering', () => {
    it('should render modal when open is true', () => {
      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText('Create New Tournament')).toBeInTheDocument();
      expect(screen.getByLabelText(/long name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/short name/i)).toBeInTheDocument();
    });

    it('should not render modal when open is false', () => {
      render(
        <CreateTournamentModal
          open={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.queryByText('Create New Tournament')).not.toBeInTheDocument();
    });

    it('should render creation method radio buttons', () => {
      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByLabelText('Create from scratch')).toBeInTheDocument();
      expect(screen.getByLabelText('Copy existing tournament')).toBeInTheDocument();
    });
  });

  describe('Form Interactions', () => {
    it('should update long name when typing', async () => {
      const user = userEvent.setup();

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const longNameInput = screen.getByLabelText(/long name/i);
      await user.clear(longNameInput);
      await user.type(longNameInput, 'Test Tournament');

      expect(longNameInput).toHaveValue('Test Tournament');
    });

    it('should update short name when typing', async () => {
      const user = userEvent.setup();

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const shortNameInput = screen.getByLabelText(/short name/i);
      await user.clear(shortNameInput);
      await user.type(shortNameInput, 'TT');

      expect(shortNameInput).toHaveValue('TT');
    });
  });

  describe('Copy Mode', () => {
    it('should load tournaments when modal opens', async () => {
      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(tournamentActions.getAllTournaments).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should create new tournament when in new mode', async () => {
      const user = userEvent.setup();
      const mockNewTournament = { id: 'new-tournament', long_name: 'New Tournament', short_name: 'NT' };
      vi.mocked(tournamentActions.createOrUpdateTournament).mockResolvedValue(mockNewTournament as any);

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const longNameInput = screen.getByLabelText(/long name/i);
      const shortNameInput = screen.getByLabelText(/short name/i);

      await user.type(longNameInput, 'New Tournament');
      await user.type(shortNameInput, 'NT');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(tournamentActions.createOrUpdateTournament).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalledWith(mockNewTournament);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error when names are empty', async () => {
      const user = userEvent.setup();

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/both long name and short name are required/i)).toBeInTheDocument();
      });
    });

    it('should show error when creation fails', async () => {
      const user = userEvent.setup();
      vi.mocked(tournamentActions.createOrUpdateTournament).mockRejectedValue(new Error('Creation failed'));

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const longNameInput = screen.getByLabelText(/long name/i);
      const shortNameInput = screen.getByLabelText(/short name/i);

      await user.type(longNameInput, 'New Tournament');
      await user.type(shortNameInput, 'NT');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/creation failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modal Closing', () => {
    it('should reset form when modal is closed', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const longNameInput = screen.getByLabelText(/long name/i);
      await user.type(longNameInput, 'Test Tournament');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();

      // Reopen modal
      rerender(
        <CreateTournamentModal
          open={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      rerender(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        const longNameInputReopened = screen.getByLabelText(/long name/i);
        expect(longNameInputReopened).toHaveValue('');
      });
    });

    it('should reset creation mode when modal is closed', async () => {
      const user = userEvent.setup();

      const { rerender } = render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const copyRadio = screen.getByLabelText('Copy existing tournament');
      await user.click(copyRadio);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Reopen modal
      rerender(
        <CreateTournamentModal
          open={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      rerender(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        const newRadio = screen.getByLabelText('Create from scratch');
        expect(newRadio).toBeChecked();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state for tournaments', async () => {
      vi.mocked(tournamentActions.getAllTournaments).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100))
      );

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await waitFor(() => {
        expect(tournamentActions.getAllTournaments).toHaveBeenCalled();
      });
    });

    it('should disable buttons while loading', async () => {
      const user = userEvent.setup();
      vi.mocked(tournamentActions.createOrUpdateTournament).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({} as any), 100))
      );

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const longNameInput = screen.getByLabelText(/long name/i);
      const shortNameInput = screen.getByLabelText(/short name/i);

      await user.type(longNameInput, 'Test');
      await user.type(shortNameInput, 'T');

      const createButton = screen.getByRole('button', { name: /create/i });
      await user.click(createButton);

      // Cancel button should be disabled during loading
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeDisabled();
    });
  });
});
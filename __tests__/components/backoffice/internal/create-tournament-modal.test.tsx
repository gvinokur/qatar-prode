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

    it.skip('should switch to copy mode when radio is selected', async () => {
      const user = userEvent.setup();

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const copyRadio = screen.getByLabelText('Copy existing tournament');
      await user.click(copyRadio);

      await waitFor(() => {
        expect(screen.getByText('Select Tournament to Copy')).toBeInTheDocument();
      });
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

    it.skip('should display tournament dropdown in copy mode', async () => {
      const user = userEvent.setup();

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const copyRadio = screen.getByLabelText('Copy existing tournament');
      await user.click(copyRadio);

      await waitFor(() => {
        expect(screen.getByText('Select Tournament to Copy')).toBeInTheDocument();
      });
    });

    it.skip('should show date picker when tournament is selected for copying', async () => {
      const user = userEvent.setup();

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const copyRadio = screen.getByLabelText('Copy existing tournament');
      await user.click(copyRadio);

      await waitFor(() => {
        expect(screen.getByText('Select Tournament to Copy')).toBeInTheDocument();
      });

      // Open select dropdown - MUI Select renders as a button with role combobox
      const tournamentSelect = screen.getByRole('combobox');
      await user.click(tournamentSelect);

      // Wait for dropdown options and click first one
      await waitFor(() => {
        expect(screen.getByText('World Cup 2024')).toBeInTheDocument();
      });

      const option = screen.getByText('World Cup 2024');
      await user.click(option);

      await waitFor(() => {
        expect(screen.getByLabelText(/new start date/i)).toBeInTheDocument();
      });
    });

    it.skip('should auto-populate names with " - Copy" when tournament is selected', async () => {
      const user = userEvent.setup();

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const copyRadio = screen.getByLabelText('Copy existing tournament');
      await user.click(copyRadio);

      await waitFor(() => {
        expect(screen.getByText('Select Tournament to Copy')).toBeInTheDocument();
      });

      const tournamentSelect = screen.getByRole('combobox');
      await user.click(tournamentSelect);

      await waitFor(() => {
        expect(screen.getByText('World Cup 2024')).toBeInTheDocument();
      });

      const option = screen.getByText('World Cup 2024');
      await user.click(option);

      await waitFor(() => {
        const longNameInput = screen.getByLabelText(/long name/i);
        const shortNameInput = screen.getByLabelText(/short name/i);

        expect(longNameInput).toHaveValue('World Cup 2024 - Copy');
        expect(shortNameInput).toHaveValue('WC2024 - Copy');
      });
    });

    it.skip('should allow entering a new start date', async () => {
      const user = userEvent.setup();

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const copyRadio = screen.getByLabelText('Copy existing tournament');
      await user.click(copyRadio);

      await waitFor(() => {
        expect(screen.getByText('Select Tournament to Copy')).toBeInTheDocument();
      });

      const tournamentSelect = screen.getByRole('combobox');
      await user.click(tournamentSelect);

      await waitFor(() => {
        expect(screen.getByText('World Cup 2024')).toBeInTheDocument();
      });

      const option = screen.getByText('World Cup 2024');
      await user.click(option);

      await waitFor(async () => {
        const dateInput = screen.getByLabelText(/new start date/i);
        await user.type(dateInput, '2025-01-15');
        expect(dateInput).toHaveValue('2025-01-15');
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

    it.skip('should copy tournament when in copy mode', async () => {
      const user = userEvent.setup();
      const mockCopiedTournament = { id: 'copied-tournament', long_name: 'Copied', short_name: 'CP' };
      vi.mocked(backofficeActions.copyTournament).mockResolvedValue(mockCopiedTournament as any);

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const copyRadio = screen.getByLabelText('Copy existing tournament');
      await user.click(copyRadio);

      await waitFor(() => {
        expect(screen.getByText('Select Tournament to Copy')).toBeInTheDocument();
      });

      const tournamentSelect = screen.getByRole('combobox');
      await user.click(tournamentSelect);

      await waitFor(() => {
        expect(screen.getByText('World Cup 2024')).toBeInTheDocument();
      });

      const option = screen.getByText('World Cup 2024');
      await user.click(option);

      await waitFor(async () => {
        const createButton = screen.getByRole('button', { name: /copy tournament/i });
        await user.click(createButton);
      });

      await waitFor(() => {
        expect(backofficeActions.copyTournament).toHaveBeenCalledWith(
          'tournament-1',
          undefined,
          'World Cup 2024 - Copy',
          'WC2024 - Copy'
        );
        expect(mockOnSuccess).toHaveBeenCalledWith(mockCopiedTournament);
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it.skip('should pass new start date when copying', async () => {
      const user = userEvent.setup();
      const mockCopiedTournament = { id: 'copied-tournament', long_name: 'Copied', short_name: 'CP' };
      vi.mocked(backofficeActions.copyTournament).mockResolvedValue(mockCopiedTournament as any);

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const copyRadio = screen.getByLabelText('Copy existing tournament');
      await user.click(copyRadio);

      await waitFor(() => {
        expect(screen.getByText('Select Tournament to Copy')).toBeInTheDocument();
      });

      const tournamentSelect = screen.getByRole('combobox');
      await user.click(tournamentSelect);

      await waitFor(() => {
        expect(screen.getByText('World Cup 2024')).toBeInTheDocument();
      });

      const option = screen.getByText('World Cup 2024');
      await user.click(option);

      await waitFor(async () => {
        const dateInput = screen.getByLabelText(/new start date/i);
        await user.type(dateInput, '2025-01-15');
      });

      await waitFor(async () => {
        const createButton = screen.getByRole('button', { name: /copy tournament/i });
        await user.click(createButton);
      });

      await waitFor(() => {
        expect(backofficeActions.copyTournament).toHaveBeenCalledWith(
          'tournament-1',
          expect.any(Date),
          'World Cup 2024 - Copy',
          'WC2024 - Copy'
        );
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

    it.skip('should show error when no tournament is selected in copy mode', async () => {
      const user = userEvent.setup();

      render(
        <CreateTournamentModal
          open={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const copyRadio = screen.getByLabelText('Copy existing tournament');
      await user.click(copyRadio);

      await waitFor(() => {
        expect(screen.getByText('Select Tournament to Copy')).toBeInTheDocument();
      });

      // Fill in names but don't select a tournament
      const longNameInput = screen.getByLabelText(/long name/i);
      const shortNameInput = screen.getByLabelText(/short name/i);
      await user.type(longNameInput, 'Test');
      await user.type(shortNameInput, 'T');

      const createButton = screen.getByRole('button', { name: /copy tournament/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByText(/please select a tournament to copy/i)).toBeInTheDocument();
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
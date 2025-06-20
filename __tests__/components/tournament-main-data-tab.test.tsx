import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TournamentMainDataTab from '../../app/components/backoffice/tournament-main-data-tab';
import { createOrUpdateTournament, getTournamentById, getPlayoffRounds } from '../../app/actions/tournament-actions';
import { getThemeLogoUrl } from '../../app/utils/theme-utils';

// Mock the dependencies
vi.mock('../../app/actions/tournament-actions');
vi.mock('../../app/utils/theme-utils');
vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    updateTable: vi.fn(),
    deleteFrom: vi.fn(),
  }
}));
vi.mock('../../app/components/friend-groups/image-picker', () => ({
  default: function MockImagePicker({ onChange, defaultValue }: any) {
    return (
      <div data-testid="image-picker">
        <input
          type="file"
          onChange={onChange}
          data-testid="logo-input"
          accept="image/*"
        />
        {defaultValue && <img src={defaultValue} alt="logo" data-testid="logo-preview" />}
      </div>
    );
  }
}));
vi.mock('../../app/components/backoffice/internal/playoff-round-dialog', () => ({
  default: function MockPlayoffRoundDialog({ open, onClose, onSave, round, nextOrder }: any) {
    if (!open) return null;
    return (
      <div data-testid="playoff-round-dialog">
        <button onClick={onClose} data-testid="close-dialog">Close</button>
        <button onClick={onSave} data-testid="save-round">Save Round</button>
        <span data-testid="round-order">{nextOrder}</span>
        {round && <span data-testid="editing-round">{round.round_name}</span>}
      </div>
    );
  }
}));
vi.mock('next-auth', () => ({
  __esModule: true,
  default: () => ({}),
  getSession: vi.fn(),
  useSession: () => ({ data: null, status: 'unauthenticated' }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  auth: vi.fn(),
}));
vi.mock('@auth/core', () => ({}));
vi.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: () => ({}),
}));
vi.mock('../../app/actions/s3', () => ({
  createS3Client: () => ({
    uploadFile: vi.fn(),
    deleteFile: vi.fn(),
  })
}));
vi.mock('mui-color-input', () => ({
  MuiColorInput: ({ value, onChange }: any) => (
    <input data-testid="color-input" value={value} onChange={e => onChange(e.target.value)} />
  )
}));

const mockGetTournamentById = getTournamentById as vi.MockedFunction<typeof getTournamentById>;
const mockCreateOrUpdateTournament = createOrUpdateTournament as vi.MockedFunction<typeof createOrUpdateTournament>;
const mockGetPlayoffRounds = getPlayoffRounds as vi.MockedFunction<typeof getPlayoffRounds>;
const mockGetThemeLogoUrl = getThemeLogoUrl as vi.MockedFunction<typeof getThemeLogoUrl>;

describe('TournamentMainDataTab', () => {
  const mockTournament = {
    id: 'test-tournament-id',
    long_name: 'FIFA World Cup 2022',
    short_name: 'World Cup 2022',
    dev_only: false,
    display_name: true,
    is_active: true,
    champion_team_id: null,
    runner_up_team_id: null,
    third_place_team_id: null,
    best_player_id: undefined,
    top_goalscorer_player_id: undefined,
    best_goalkeeper_player_id: undefined,
    best_young_player_id: undefined,
    theme: {
      primary_color: '#1976d2',
      secondary_color: '#dc004e',
      web_page: 'https://fifa.com',
      logo: 'test-logo-url',
      is_s3_logo: false,
      s3_logo_key: ''
    }
  };

  const mockPlayoffRounds = [
    {
      id: 'round-1',
      tournament_id: 'test-tournament-id',
      round_name: 'Round of 16',
      round_order: 1,
      total_games: 8,
      is_final: false,
      is_third_place: false,
      is_first_stage: true,
      games: []
    },
    {
      id: 'round-2',
      tournament_id: 'test-tournament-id',
      round_name: 'Quarter Finals',
      round_order: 2,
      total_games: 4,
      is_final: false,
      is_third_place: false,
      is_first_stage: false,
      games: []
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetThemeLogoUrl.mockReturnValue('mocked-logo-url');
  });

  describe('Loading States', () => {
    it('should show loading spinner when fetching data', () => {
      mockGetTournamentById.mockImplementation(() => new Promise(() => {})); // Never resolves
      mockGetPlayoffRounds.mockResolvedValue([]);

      render(<TournamentMainDataTab tournamentId="test-id" />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show error when tournament data fails to load', async () => {
      mockGetTournamentById.mockRejectedValue(new Error('Tournament not found'));
      mockGetPlayoffRounds.mockResolvedValue([]);

      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText('Tournament not found')).toBeInTheDocument();
      });
    });
  });

  describe('Form Rendering', () => {
    beforeEach(() => {
      mockGetTournamentById.mockResolvedValue(mockTournament);
      mockGetPlayoffRounds.mockResolvedValue(mockPlayoffRounds);
    });

    it('should render form fields with tournament data', async () => {
      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('FIFA World Cup 2022')).toBeInTheDocument();
        expect(screen.getByDisplayValue('World Cup 2022')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://fifa.com')).toBeInTheDocument();
      });
    });

    it('should render switches with correct initial states', async () => {
      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        const devOnlySwitch = screen.getByRole('checkbox', { name: /development mode only/i });
        const displayNameSwitch = screen.getByRole('checkbox', { name: /display name/i });
        const activeSwitch = screen.getByRole('checkbox', { name: /active/i });

        expect(devOnlySwitch).not.toBeChecked();
        expect(displayNameSwitch).toBeChecked();
        expect(activeSwitch).toBeChecked();
      });
    });

    it('should render playoff rounds list', async () => {
      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText('Round of 16')).toBeInTheDocument();
        expect(screen.getByText('Quarter Finals')).toBeInTheDocument();
        expect(screen.getByText('Order: 1 | Games: 8')).toBeInTheDocument();
        expect(screen.getByText('Order: 2 | Games: 4')).toBeInTheDocument();
      });
    });
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      mockGetTournamentById.mockResolvedValue(mockTournament);
      mockGetPlayoffRounds.mockResolvedValue(mockPlayoffRounds);
    });

    it('should update form fields when user types', async () => {
      const user = userEvent.setup();
      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('FIFA World Cup 2022')).toBeInTheDocument();
      });

      const longNameField = screen.getByDisplayValue('FIFA World Cup 2022');
      await user.clear(longNameField);
      await user.type(longNameField, 'New Tournament Name');

      expect(screen.getByDisplayValue('New Tournament Name')).toBeInTheDocument();
    });

    it('should handle switch toggles', async () => {
      const user = userEvent.setup();
      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /development mode only/i })).toBeInTheDocument();
      });

      const devOnlySwitch = screen.getByRole('checkbox', { name: /development mode only/i });
      await user.click(devOnlySwitch);

      expect(devOnlySwitch).toBeChecked();
    });

    it('should handle logo file selection', async () => {
      const user = userEvent.setup();
      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByTestId('logo-input')).toBeInTheDocument();
      });

      const file = new File(['logo content'], 'logo.png', { type: 'image/png' });
      const logoInput = screen.getByTestId('logo-input') as HTMLInputElement;
      
      await user.upload(logoInput, file);

      expect(logoInput.files?.[0]).toBe(file);
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      mockGetTournamentById.mockResolvedValue(mockTournament);
      mockGetPlayoffRounds.mockResolvedValue(mockPlayoffRounds);
      mockCreateOrUpdateTournament.mockResolvedValue(mockTournament);
    });

    it('should submit form successfully', async () => {
      const user = userEvent.setup();
      const onUpdateMock = vi.fn();
      
      render(<TournamentMainDataTab tournamentId="test-id" onUpdate={onUpdateMock} />);

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateOrUpdateTournament).toHaveBeenCalledWith('test-id', expect.any(FormData));
        expect(onUpdateMock).toHaveBeenCalledWith(mockTournament);
        expect(screen.getByText('Tournament information updated successfully')).toBeInTheDocument();
      });
    });

    it('should handle form submission error', async () => {
      const user = userEvent.setup();
      mockCreateOrUpdateTournament.mockRejectedValue(new Error('Update failed'));

      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Update failed')).toBeInTheDocument();
      });
    });

    it('should handle activation toggle', async () => {
      const user = userEvent.setup();
      const onUpdateMock = vi.fn();
      mockCreateOrUpdateTournament.mockResolvedValue({ ...mockTournament, is_active: false });

      render(<TournamentMainDataTab tournamentId="test-id" onUpdate={onUpdateMock} />);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /active/i })).toBeInTheDocument();
      });

      const activeSwitch = screen.getByRole('checkbox', { name: /active/i });
      await user.click(activeSwitch);

      await waitFor(() => {
        expect(mockCreateOrUpdateTournament).toHaveBeenCalledWith('test-id', expect.any(FormData));
        expect(onUpdateMock).toHaveBeenCalled();
        expect(screen.getByText('Tournament information updated successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Playoff Rounds Management', () => {
    beforeEach(() => {
      mockGetTournamentById.mockResolvedValue(mockTournament);
      mockGetPlayoffRounds.mockResolvedValue(mockPlayoffRounds);
    });

    it('should open create playoff round dialog', async () => {
      const user = userEvent.setup();
      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText('Add Round')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Round');
      await user.click(addButton);

      expect(screen.getByTestId('playoff-round-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('round-order')).toHaveTextContent('3');
    });

    it('should open edit playoff round dialog', async () => {
      const user = userEvent.setup();
      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText('Round of 16')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByTestId('EditIcon');
      await user.click(editButtons[0]);

      expect(screen.getByTestId('playoff-round-dialog')).toBeInTheDocument();
      expect(screen.getByTestId('editing-round')).toHaveTextContent('Round of 16');
    });

    it('should close playoff round dialog', async () => {
      const user = userEvent.setup();
      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText('Add Round')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Round');
      await user.click(addButton);

      expect(screen.getByTestId('playoff-round-dialog')).toBeInTheDocument();

      const closeButton = screen.getByTestId('close-dialog');
      await user.click(closeButton);

      expect(screen.queryByTestId('playoff-round-dialog')).not.toBeInTheDocument();
    });

    it('should handle playoff round save', async () => {
      const user = userEvent.setup();
      mockGetPlayoffRounds.mockResolvedValueOnce(mockPlayoffRounds);
      
      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText('Add Round')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Round');
      await user.click(addButton);

      const saveButton = screen.getByTestId('save-round');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Playoff round saved successfully')).toBeInTheDocument();
      });
    });

    it('should show info message when no playoff rounds exist', async () => {
      mockGetPlayoffRounds.mockResolvedValue([]);

      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText('No playoff rounds defined for this tournament.')).toBeInTheDocument();
      });
    });
  });

  describe('Snackbar Notifications', () => {
    beforeEach(() => {
      mockGetTournamentById.mockResolvedValue(mockTournament);
      mockGetPlayoffRounds.mockResolvedValue(mockPlayoffRounds);
    });

    it('should close success snackbar', async () => {
      const user = userEvent.setup();
      mockCreateOrUpdateTournament.mockResolvedValue(mockTournament);
      
      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText('Save Changes')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Tournament information updated successfully')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      await waitForElementToBeRemoved(() => screen.queryByText('Tournament information updated successfully'));
    });
  });

  describe('Error Handling', () => {
    it('should handle playoff rounds loading error', async () => {
      mockGetTournamentById.mockResolvedValue(mockTournament);
      mockGetPlayoffRounds.mockRejectedValue(new Error('Failed to load playoff rounds'));

      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load playoff rounds')).toBeInTheDocument();
      });
    });

    it('should handle activation toggle error', async () => {
      const user = userEvent.setup();
      mockGetTournamentById.mockResolvedValue(mockTournament);
      mockGetPlayoffRounds.mockResolvedValue(mockPlayoffRounds);
      mockCreateOrUpdateTournament.mockRejectedValue(new Error('Activation failed'));

      render(<TournamentMainDataTab tournamentId="test-id" />);

      await waitFor(() => {
        expect(screen.getByRole('checkbox', { name: /active/i })).toBeInTheDocument();
      });

      const activeSwitch = screen.getByRole('checkbox', { name: /active/i });
      await user.click(activeSwitch);

      await waitFor(() => {
        expect(screen.getByText('Activation failed')).toBeInTheDocument();
      });
    });
  });
}); 
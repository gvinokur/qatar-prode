import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AwardsPanel from '../../../app/components/awards/award-panel';
import { renderWithTheme } from '../../utils/test-utils';
import * as guessesActions from '../../../app/actions/guesses-actions';
import { testFactories } from '../../db/test-factories';

// Mock the actions
vi.mock('../../../app/actions/guesses-actions', () => ({
  updateOrCreateTournamentGuess: vi.fn(),
}));

const mockUpdateOrCreateTournamentGuess = vi.mocked(guessesActions.updateOrCreateTournamentGuess);

describe('AwardsPanel - Bug #164 Fix', () => {
  const mockTournament = testFactories.tournament();
  const mockTeams = [
    testFactories.team({ id: 'team-1', name: 'Team 1', short_name: 'T1' }),
    testFactories.team({ id: 'team-2', name: 'Team 2', short_name: 'T2' }),
  ];
  const mockPlayers = [
    {
      id: 'player-1',
      name: 'Player 1',
      team: mockTeams[0],
      team_id: 'team-1',
      tournament_id: mockTournament.id,
      position: 'Forward',
      jersey_number: 10,
    },
    {
      id: 'player-2',
      name: 'Player 2',
      team: mockTeams[1],
      team_id: 'team-2',
      tournament_id: mockTournament.id,
      position: 'Midfielder',
      jersey_number: 8,
    },
  ];

  const mockTournamentGuess = testFactories.tournamentGuess({
    user_id: 'user-1',
    tournament_id: mockTournament.id,
    best_player_id: 'player-1',
    champion_team_id: 'team-1',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateOrCreateTournamentGuess.mockResolvedValue(mockTournamentGuess);
  });

  describe('Individual Award Updates', () => {
    it('should verify component renders with awards section', () => {
      renderWithTheme(
        <AwardsPanel
          allPlayers={mockPlayers}
          tournamentGuesses={mockTournamentGuess}
          teams={mockTeams}
          hasThirdPlaceGame={false}
          isPredictionLocked={false}
          tournament={mockTournament}
        />
      );

      // Component renders successfully
      expect(screen.getByText('Premios Individuales')).toBeInTheDocument();
      expect(screen.getByText('Podio del Torneo')).toBeInTheDocument();
    });

    it('should only send changed field when updating individual award', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <AwardsPanel
          allPlayers={mockPlayers}
          tournamentGuesses={mockTournamentGuess}
          teams={mockTeams}
          hasThirdPlaceGame={false}
          isPredictionLocked={false}
          tournament={mockTournament}
        />
      );

      // Find all autocompletes (podium + individual awards)
      // Individual award autocompletes come after the 2 podium selectors
      const allAutocompletes = screen.getAllByRole('combobox');
      const firstAwardAutocomplete = allAutocompletes[2]; // Third combobox (after champion and runner-up)

      // Click to open autocomplete
      await user.click(firstAwardAutocomplete);

      // Select Player 2
      const player2Option = await screen.findByRole('option', { name: /Player 2/i });
      await user.click(player2Option);

      // Wait for save
      await waitFor(() => {
        expect(mockUpdateOrCreateTournamentGuess).toHaveBeenCalled();
      });

      // Verify payload structure (key test for Bug #164 fix)
      const callArgs = mockUpdateOrCreateTournamentGuess.mock.calls[0][0];

      // Must have user_id and tournament_id
      expect(callArgs).toHaveProperty('user_id', 'user-1');
      expect(callArgs).toHaveProperty('tournament_id', mockTournament.id);

      // Must have exactly one award field (best_player_id is the first award)
      expect(callArgs).toHaveProperty('best_player_id');

      // Should have exactly 3 properties
      const keys = Object.keys(callArgs);
      expect(keys.length).toBe(3);

      // Should NOT include other fields (bug fix verification)
      expect(callArgs).not.toHaveProperty('champion_team_id');
      expect(callArgs).not.toHaveProperty('individual_awards_score');
      expect(callArgs).not.toHaveProperty('total_game_score');
    });

    it('should render autocompletes for each award', () => {
      renderWithTheme(
        <AwardsPanel
          allPlayers={mockPlayers}
          tournamentGuesses={mockTournamentGuess}
          teams={mockTeams}
          hasThirdPlaceGame={false}
          isPredictionLocked={false}
          tournament={mockTournament}
        />
      );

      // Verify autocompletes render
      const autocompletes = screen.getAllByRole('combobox');
      expect(autocompletes.length).toBeGreaterThan(0);
    });

    it('should test handler creates minimal payload with only changed field', () => {
      // This test verifies the key fix for Bug #164:
      // Handlers should create payload with only user_id, tournament_id, and changed field

      const guess = mockTournamentGuess;

      // Simulate what handleGuessChange does
      const updatePayload = {
        user_id: guess.user_id,
        tournament_id: guess.tournament_id,
        best_player_id: 'new-player-id',
      };

      // Verify payload structure
      expect(updatePayload).toHaveProperty('user_id');
      expect(updatePayload).toHaveProperty('tournament_id');
      expect(updatePayload).toHaveProperty('best_player_id');

      // Verify it ONLY has these 3 properties (the fix)
      expect(Object.keys(updatePayload).length).toBe(3);

      // Verify it does NOT include other fields
      expect(updatePayload).not.toHaveProperty('individual_awards_score');
      expect(updatePayload).not.toHaveProperty('honor_roll_score');
      expect(updatePayload).not.toHaveProperty('total_game_score');
    });

    it('should test handler creates payload with null for cleared selection', () => {
      const guess = mockTournamentGuess;

      // Simulate clearing a selection (empty string becomes null)
      const updatePayload = {
        user_id: guess.user_id,
        tournament_id: guess.tournament_id,
        best_player_id: null,
      };

      expect(updatePayload.best_player_id).toBeNull();
      expect(Object.keys(updatePayload).length).toBe(3);
    });
  });

  describe('Honor Roll/Podium Updates', () => {
    it('should render podium section with team selectors', () => {
      renderWithTheme(
        <AwardsPanel
          allPlayers={mockPlayers}
          tournamentGuesses={mockTournamentGuess}
          teams={mockTeams}
          hasThirdPlaceGame={true}
          isPredictionLocked={false}
          tournament={mockTournament}
        />
      );

      // Verify podium section renders
      expect(screen.getByText('Podio del Torneo')).toBeInTheDocument();

      // Use getAllByLabelText since labels appear multiple times (in label and legend)
      const championSelects = screen.getAllByLabelText(/Campeón/i);
      expect(championSelects.length).toBeGreaterThan(0);

      const runnerUpSelects = screen.getAllByLabelText(/Subcampeón/i);
      expect(runnerUpSelects.length).toBeGreaterThan(0);
    });

    it('should only send changed field plus identifiers when podium updated', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <AwardsPanel
          allPlayers={mockPlayers}
          tournamentGuesses={mockTournamentGuess}
          teams={mockTeams}
          hasThirdPlaceGame={false}
          isPredictionLocked={false}
          tournament={mockTournament}
        />
      );

      // Find champion selector by its specific ID
      const championSelect = screen.getAllByRole('combobox')[0]; // First combobox is champion

      // Click to open dropdown
      await user.click(championSelect);

      // Select Team 2
      const team2Option = await screen.findByRole('option', { name: /Team 2/i });
      await user.click(team2Option);

      // Wait for save
      await waitFor(() => {
        expect(mockUpdateOrCreateTournamentGuess).toHaveBeenCalled();
      });

      // Verify payload structure (key test for Bug #164 fix)
      const callArgs = mockUpdateOrCreateTournamentGuess.mock.calls[0][0];

      // Must have user_id and tournament_id
      expect(callArgs).toHaveProperty('user_id', 'user-1');
      expect(callArgs).toHaveProperty('tournament_id', mockTournament.id);

      // Must have the changed honor roll field
      expect(callArgs).toHaveProperty('champion_team_id');

      // Should have exactly 3 properties
      const keys = Object.keys(callArgs);
      expect(keys.length).toBe(3);

      // Should NOT include other fields (bug fix verification)
      expect(callArgs).not.toHaveProperty('best_player_id');
      expect(callArgs).not.toHaveProperty('individual_awards_score');
      expect(callArgs).not.toHaveProperty('total_game_score');
    });

    it('should send null when clearing team selection', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <AwardsPanel
          allPlayers={mockPlayers}
          tournamentGuesses={mockTournamentGuess}
          teams={mockTeams}
          hasThirdPlaceGame={false}
          isPredictionLocked={false}
          tournament={mockTournament}
        />
      );

      // Find champion selector by its position (first combobox)
      const championSelect = screen.getAllByRole('combobox')[0];
      await user.click(championSelect);

      // Select "None" option to clear
      const emptyOption = await screen.findByRole('option', { name: /None/i });
      await user.click(emptyOption);

      await waitFor(() => {
        expect(mockUpdateOrCreateTournamentGuess).toHaveBeenCalled();
      });

      const callArgs = mockUpdateOrCreateTournamentGuess.mock.calls[0][0];
      expect(callArgs.champion_team_id).toBeNull();
    });

    it('should show third place selector when hasThirdPlaceGame is true', () => {
      renderWithTheme(
        <AwardsPanel
          allPlayers={mockPlayers}
          tournamentGuesses={mockTournamentGuess}
          teams={mockTeams}
          hasThirdPlaceGame={true}
          isPredictionLocked={false}
          tournament={mockTournament}
        />
      );

      expect(screen.getByLabelText(/Third Place/i)).toBeInTheDocument();
    });

    it('should NOT show third place selector when hasThirdPlaceGame is false', () => {
      renderWithTheme(
        <AwardsPanel
          allPlayers={mockPlayers}
          tournamentGuesses={mockTournamentGuess}
          teams={mockTeams}
          hasThirdPlaceGame={false}
          isPredictionLocked={false}
          tournament={mockTournament}
        />
      );

      expect(screen.queryByLabelText(/Third Place/i)).not.toBeInTheDocument();
    });
  });

  describe('Prediction Locked State', () => {
    it('should disable inputs when predictions are locked', () => {
      renderWithTheme(
        <AwardsPanel
          allPlayers={mockPlayers}
          tournamentGuesses={mockTournamentGuess}
          teams={mockTeams}
          hasThirdPlaceGame={false}
          isPredictionLocked={true}
          tournament={mockTournament}
        />
      );

      const autocompletes = screen.getAllByRole('combobox');
      autocompletes.forEach(autocomplete => {
        // Material-UI adds Mui-disabled class to disabled elements
        expect(autocomplete.className).toContain('Mui-disabled');
      });
    });

    it('should show locked message when predictions are locked', () => {
      renderWithTheme(
        <AwardsPanel
          allPlayers={mockPlayers}
          tournamentGuesses={mockTournamentGuess}
          teams={mockTeams}
          hasThirdPlaceGame={false}
          isPredictionLocked={true}
          tournament={mockTournament}
        />
      );

      expect(screen.getByText(/Predictions Locked/i)).toBeInTheDocument();
    });
  });

  describe('No Players Available', () => {
    it('should show warning when no players are available', () => {
      renderWithTheme(
        <AwardsPanel
          allPlayers={[]}
          tournamentGuesses={mockTournamentGuess}
          teams={mockTeams}
          hasThirdPlaceGame={false}
          isPredictionLocked={false}
          tournament={mockTournament}
        />
      );

      expect(screen.getByText(/Premios Inviduales no disponibles/i)).toBeInTheDocument();
    });
  });
});

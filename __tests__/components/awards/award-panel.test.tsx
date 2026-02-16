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

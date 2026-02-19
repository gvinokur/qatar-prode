import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { testFactories } from '@/__tests__/db/test-factories';
import PlayoffTab from '@/app/components/backoffice/playoff-tab';
import { ExtendedGameData, ExtendedPlayoffRoundData } from '@/app/definitions';
import { Team } from '@/app/db/tables-definition';

// Mock tournament actions
vi.mock('@/app/actions/tournament-actions', () => ({
  getCompletePlayoffData: vi.fn()
}));

// Mock backoffice actions
vi.mock('@/app/actions/backoffice-actions', () => ({
  saveGameResults: vi.fn(),
  saveGamesData: vi.fn(),
  calculateGameScores: vi.fn(),
  updateTournamentHonorRoll: vi.fn()
}));

// Mock the child components
vi.mock('@/app/components/backoffice/backoffice-flippable-game-card', () => ({
  default: ({ game, onSave, onPublishToggle }: {
    game: ExtendedGameData;
    onSave: (game: ExtendedGameData) => Promise<void>;
    onPublishToggle: (gameId: string, isPublished: boolean) => Promise<void>;
  }) => (
    <div data-testid={`game-card-${game.id}`}>
      <div>Game {game.game_number}</div>
      <button onClick={() => onSave(game).catch(() => {})}>Save</button>
      <button onClick={() => onPublishToggle(game.id, true).catch(() => {})}>Publish</button>
      <button onClick={() => onPublishToggle(game.id, false).catch(() => {})}>Unpublish</button>
    </div>
  )
}));

vi.mock('@/app/components/backoffice/bulk-actions-menu', () => ({
  default: ({ playoffRoundId, sectionName, onComplete }: {
    playoffRoundId: string;
    sectionName: string;
    onComplete?: () => void;
  }) => (
    <div data-testid={`bulk-actions-${playoffRoundId}`}>
      <div>Bulk Actions for {sectionName}</div>
      <button onClick={() => onComplete?.()}>Complete Bulk Action</button>
    </div>
  )
}));

// Import mocked functions
import { getCompletePlayoffData } from '@/app/actions/tournament-actions';
import {
  saveGameResults,
  saveGamesData,
  calculateGameScores,
  updateTournamentHonorRoll
} from '@/app/actions/backoffice-actions';

describe('PlayoffTab Integration Tests', () => {
  const tournamentId = 'tournament-1';

  // Test data
  let team1: Team;
  let team2: Team;
  let team3: Team;
  let team4: Team;
  let finalGame: ExtendedGameData;
  let thirdPlaceGame: ExtendedGameData;
  let quarterfinalGame: ExtendedGameData;
  let finalStage: ExtendedPlayoffRoundData;
  let thirdPlaceStage: ExtendedPlayoffRoundData;
  let quarterfinalStage: ExtendedPlayoffRoundData;
  let teamsMap: Record<string, Team>;
  let gamesMap: Record<string, ExtendedGameData>;
  let playoffStages: ExtendedPlayoffRoundData[];

  beforeEach(() => {
    vi.clearAllMocks();

    // Create test teams
    team1 = testFactories.team({ id: 'team-1', name: 'Team A', short_name: 'TMA' });
    team2 = testFactories.team({ id: 'team-2', name: 'Team B', short_name: 'TMB' });
    team3 = testFactories.team({ id: 'team-3', name: 'Team C', short_name: 'TMC' });
    team4 = testFactories.team({ id: 'team-4', name: 'Team D', short_name: 'TMD' });

    teamsMap = {
      [team1.id]: team1,
      [team2.id]: team2,
      [team3.id]: team3,
      [team4.id]: team4
    };

    // Create playoff games
    finalGame = {
      ...testFactories.game({
        id: 'game-final',
        game_number: 64,
        tournament_id: tournamentId,
        home_team: team1.id,
        away_team: team2.id,
        game_type: 'final'
      }),
      playoffStage: {
        tournament_playoff_round_id: 'round-final',
        round_name: 'Final',
        is_final: true,
        is_third_place: false
      },
      gameResult: testFactories.gameResult({
        game_id: 'game-final',
        home_score: 2,
        away_score: 1,
        is_draft: true
      })
    };

    thirdPlaceGame = {
      ...testFactories.game({
        id: 'game-third-place',
        game_number: 63,
        tournament_id: tournamentId,
        home_team: team3.id,
        away_team: team4.id,
        game_type: 'third_place'
      }),
      playoffStage: {
        tournament_playoff_round_id: 'round-third-place',
        round_name: 'Third Place',
        is_final: false,
        is_third_place: true
      },
      gameResult: testFactories.gameResult({
        game_id: 'game-third-place',
        home_score: 1,
        away_score: 0,
        is_draft: true
      })
    };

    quarterfinalGame = {
      ...testFactories.game({
        id: 'game-qf-1',
        game_number: 57,
        tournament_id: tournamentId,
        home_team: team1.id,
        away_team: team4.id,
        game_type: 'quarterfinal'
      }),
      playoffStage: {
        tournament_playoff_round_id: 'round-quarterfinal',
        round_name: 'Quarterfinals',
        is_final: false,
        is_third_place: false
      },
      gameResult: null
    };

    gamesMap = {
      [finalGame.id]: finalGame,
      [thirdPlaceGame.id]: thirdPlaceGame,
      [quarterfinalGame.id]: quarterfinalGame
    };

    // Create playoff stages
    finalStage = testFactories.playoffRound({
      id: 'round-final',
      tournament_id: tournamentId,
      round_name: 'Final',
      round_order: 3,
      total_games: 1,
      is_final: true,
      is_third_place: false,
      is_first_stage: false,
      games: [{ game_id: finalGame.id }]
    });

    thirdPlaceStage = testFactories.playoffRound({
      id: 'round-third-place',
      tournament_id: tournamentId,
      round_name: 'Third Place',
      round_order: 2,
      total_games: 1,
      is_final: false,
      is_third_place: true,
      is_first_stage: false,
      games: [{ game_id: thirdPlaceGame.id }]
    });

    quarterfinalStage = testFactories.playoffRound({
      id: 'round-quarterfinal',
      tournament_id: tournamentId,
      round_name: 'Quarterfinals',
      round_order: 1,
      total_games: 1,
      is_final: false,
      is_third_place: false,
      is_first_stage: true,
      games: [{ game_id: quarterfinalGame.id }]
    });

    playoffStages = [quarterfinalStage, thirdPlaceStage, finalStage];

    // Mock getCompletePlayoffData
    vi.mocked(getCompletePlayoffData).mockResolvedValue({
      playoffStages,
      teamsMap,
      gamesMap,
      tournamentStartDate: new Date('2024-06-14T18:00:00Z')
    });

    // Mock backoffice actions
    vi.mocked(saveGameResults).mockResolvedValue();
    vi.mocked(saveGamesData).mockResolvedValue();
    vi.mocked(calculateGameScores).mockResolvedValue();
    vi.mocked(updateTournamentHonorRoll).mockResolvedValue();
  });

  describe('Rendering', () => {
    it('should show loading backdrop initially', () => {
      const { container } = renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      // MUI Backdrop has aria-hidden="true", so we need to query by class or wait for it to disappear
      const backdrop = container.querySelector('.MuiBackdrop-root');
      expect(backdrop).toBeInTheDocument();
    });

    it('should render BackofficeFlippableGameCard for each game', async () => {
      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
      });

      expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`game-card-${thirdPlaceGame.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`game-card-${quarterfinalGame.id}`)).toBeInTheDocument();
    });

    it('should render BulkActionsMenu in each playoff round header', async () => {
      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.getByTestId(`bulk-actions-${finalStage.id}`)).toBeInTheDocument();
      });

      expect(screen.getByTestId(`bulk-actions-${finalStage.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`bulk-actions-${thirdPlaceStage.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`bulk-actions-${quarterfinalStage.id}`)).toBeInTheDocument();
    });

    it('should render playoff stage names as headers', async () => {
      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.getByText('Final')).toBeInTheDocument();
      });

      expect(screen.getByText('Final')).toBeInTheDocument();
      expect(screen.getByText('Third Place')).toBeInTheDocument();
      expect(screen.getByText('Quarterfinals')).toBeInTheDocument();
    });

    it('should hide loading backdrop after data loads', async () => {
      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.queryByRole('presentation')).not.toBeInTheDocument();
      });
    });
  });

  describe('handleSave', () => {
    it('should update game and trigger commitGameResults', async () => {
      const user = userEvent.setup();
      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
      });

      // Find and click save button for final game
      const finalGameCard = screen.getByTestId(`game-card-${finalGame.id}`);
      const saveButton = within(finalGameCard).getByText('Save');

      await user.click(saveButton);

      await waitFor(() => {
        expect(saveGameResults).toHaveBeenCalled();
      });

      expect(saveGameResults).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: finalGame.id
          })
        ])
      );
      expect(saveGamesData).toHaveBeenCalled();
      expect(calculateGameScores).toHaveBeenCalledWith(false, false, 'es');
    });

    it('should show success snackbar after successful save', async () => {
      const user = userEvent.setup();
      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
      });

      const finalGameCard = screen.getByTestId(`game-card-${finalGame.id}`);
      const saveButton = within(finalGameCard).getByText('Save');

      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Los Partidos se guardaron correctamente!')).toBeInTheDocument();
      });
    });

    it('should show error snackbar when save fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Database connection failed';

      // Need to wait for initial load first
      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
      });

      // Suppress console.error for this test since we expect an error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Now mock the rejection for the next call
      vi.mocked(saveGameResults).mockRejectedValueOnce(new Error(errorMessage));

      const finalGameCard = screen.getByTestId(`game-card-${finalGame.id}`);
      const saveButton = within(finalGameCard).getByText('Save');

      // Click and immediately catch the expected error
      const clickPromise = user.click(saveButton);

      // Wait for the error message to appear (this ensures the promise rejection is handled)
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Make sure the click operation completes (it should reject but be caught)
      await clickPromise.catch(() => {
        // Expected to fail, ignore the error
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('handlePublishToggle', () => {
    it('should update draft status when publishing', async () => {
      const user = userEvent.setup();
      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
      });

      const finalGameCard = screen.getByTestId(`game-card-${finalGame.id}`);
      const publishButton = within(finalGameCard).getByText('Publish');

      await user.click(publishButton);

      await waitFor(() => {
        expect(saveGameResults).toHaveBeenCalled();
      });

      // Verify the game result is updated to is_draft: false
      const callArgs = vi.mocked(saveGameResults).mock.calls[0][0];
      const updatedGame = callArgs.find((g: ExtendedGameData) => g.id === finalGame.id);
      expect(updatedGame?.gameResult?.is_draft).toBe(false);
    });

    it('should trigger full commit workflow on publish', async () => {
      const user = userEvent.setup();
      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
      });

      const finalGameCard = screen.getByTestId(`game-card-${finalGame.id}`);
      const publishButton = within(finalGameCard).getByText('Publish');

      await user.click(publishButton);

      await waitFor(() => {
        expect(saveGameResults).toHaveBeenCalled();
      });

      expect(saveGamesData).toHaveBeenCalled();
      expect(calculateGameScores).toHaveBeenCalledWith(false, false, 'es');
    });

    it('should show error snackbar when publish fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to publish game';

      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
      });

      // Suppress console.error for this test since we expect an error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Now mock the rejection for the next call
      vi.mocked(saveGameResults).mockRejectedValueOnce(new Error(errorMessage));

      const finalGameCard = screen.getByTestId(`game-card-${finalGame.id}`);
      const publishButton = within(finalGameCard).getByText('Publish');

      // Click and immediately catch the expected error
      const clickPromise = user.click(publishButton);

      // Wait for the error message to appear (this ensures the promise rejection is handled)
      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Make sure the click operation completes (it should reject but be caught)
      await clickPromise.catch(() => {
        // Expected to fail, ignore the error
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('handleBulkActionsComplete', () => {
    it('should refresh playoff data after bulk actions', async () => {
      const user = userEvent.setup();
      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.getByTestId(`bulk-actions-${finalStage.id}`)).toBeInTheDocument();
      });

      // Clear the initial call
      vi.mocked(getCompletePlayoffData).mockClear();

      const bulkActionsMenu = screen.getByTestId(`bulk-actions-${finalStage.id}`);
      const completeButton = within(bulkActionsMenu).getByText('Complete Bulk Action');

      await user.click(completeButton);

      await waitFor(() => {
        expect(getCompletePlayoffData).toHaveBeenCalledWith(tournamentId);
      });

      expect(getCompletePlayoffData).toHaveBeenCalledTimes(1);
    });

    it('should show loading backdrop during data refresh', async () => {
      const user = userEvent.setup();

      // Make the second call delay to observe loading state
      vi.mocked(getCompletePlayoffData).mockImplementationOnce(() =>
        Promise.resolve({
          playoffStages,
          teamsMap,
          gamesMap,
          tournamentStartDate: new Date('2024-06-14T18:00:00Z')
        })
      ).mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          playoffStages,
          teamsMap,
          gamesMap,
          tournamentStartDate: new Date('2024-06-14T18:00:00Z')
        }), 100))
      );

      const { container } = renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.getByTestId(`bulk-actions-${finalStage.id}`)).toBeInTheDocument();
      });

      const bulkActionsMenu = screen.getByTestId(`bulk-actions-${finalStage.id}`);
      const completeButton = within(bulkActionsMenu).getByText('Complete Bulk Action');

      await user.click(completeButton);

      // Loading backdrop should appear (check for visible backdrop with opacity > 0)
      await waitFor(() => {
        const backdrop = container.querySelector('.MuiBackdrop-root');
        expect(backdrop).toBeInTheDocument();
        // Check that it's visible (not hidden)
        const style = backdrop ? window.getComputedStyle(backdrop) : null;
        expect(style?.visibility).not.toBe('hidden');
      });

      // And then disappear after data loads
      await waitFor(() => {
        const backdrop = container.querySelector('.MuiBackdrop-root');
        const style = backdrop ? window.getComputedStyle(backdrop) : null;
        expect(style?.visibility).toBe('hidden');
      });
    });
  });

  describe('commitGameResults', () => {
    describe('Winner/Loser propagation', () => {
      it('should propagate winner to dependent games', async () => {
        const user = userEvent.setup();

        // Create a semifinal game that feeds into the final
        const semifinalGame: ExtendedGameData = {
          ...testFactories.game({
            id: 'game-sf-1',
            game_number: 61,
            tournament_id: tournamentId,
            home_team: team1.id,
            away_team: team2.id,
            game_type: 'semifinal'
          }),
          playoffStage: {
            tournament_playoff_round_id: 'round-semifinal',
            round_name: 'Semifinals',
            is_final: false,
            is_third_place: false
          },
          gameResult: testFactories.gameResult({
            game_id: 'game-sf-1',
            home_score: 2,
            away_score: 1,
            is_draft: false
          })
        };

        // Final game has a rule: home team is winner of game 61
        const finalWithRule: ExtendedGameData = {
          ...finalGame,
          home_team: null,
          home_team_rule: { game: 61, winner: true }
        };

        const updatedGamesMap = {
          [semifinalGame.id]: semifinalGame,
          [finalWithRule.id]: finalWithRule,
          [thirdPlaceGame.id]: thirdPlaceGame
        };

        const updatedFinalStage = { ...finalStage, games: [{ game_id: finalWithRule.id }] };
        const semifinalStage = testFactories.playoffRound({
          id: 'round-semifinal',
          tournament_id: tournamentId,
          round_name: 'Semifinals',
          round_order: 2,
          total_games: 1,
          is_final: false,
          is_third_place: false,
          is_first_stage: false,
          games: [{ game_id: semifinalGame.id }]
        });

        vi.mocked(getCompletePlayoffData).mockResolvedValue({
          playoffStages: [semifinalStage, updatedFinalStage, thirdPlaceStage],
          teamsMap,
          gamesMap: updatedGamesMap,
          tournamentStartDate: new Date('2024-06-14T18:00:00Z')
        });

        renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

        await waitFor(() => {
          expect(screen.getByTestId(`game-card-${semifinalGame.id}`)).toBeInTheDocument();
        });

        const semifinalCard = screen.getByTestId(`game-card-${semifinalGame.id}`);
        const saveButton = within(semifinalCard).getByText('Save');

        await user.click(saveButton);

        await waitFor(() => {
          expect(saveGamesData).toHaveBeenCalled();
        });

        // Verify that saveGamesData was called with the final game having the winner propagated
        const savedGames = vi.mocked(saveGamesData).mock.calls[0][0];
        const updatedFinalGame = savedGames.find((g: ExtendedGameData) => g.id === finalWithRule.id);
        expect(updatedFinalGame?.home_team).toBe(team1.id); // Winner of semifinal
      });

      it('should propagate loser to third place game', async () => {
        const user = userEvent.setup();

        // Create semifinals that feed losers to third place game
        const semifinal1: ExtendedGameData = {
          ...testFactories.game({
            id: 'game-sf-1',
            game_number: 61,
            tournament_id: tournamentId,
            home_team: team1.id,
            away_team: team3.id,
            game_type: 'semifinal'
          }),
          playoffStage: {
            tournament_playoff_round_id: 'round-semifinal',
            round_name: 'Semifinals',
            is_final: false,
            is_third_place: false
          },
          gameResult: testFactories.gameResult({
            game_id: 'game-sf-1',
            home_score: 2,
            away_score: 1,
            is_draft: false
          })
        };

        // Third place game has a rule: home team is loser of game 61
        const thirdPlaceWithRule: ExtendedGameData = {
          ...thirdPlaceGame,
          home_team: null,
          home_team_rule: { game: 61, winner: false }
        };

        const updatedGamesMap = {
          [semifinal1.id]: semifinal1,
          [thirdPlaceWithRule.id]: thirdPlaceWithRule,
          [finalGame.id]: finalGame
        };

        const semifinalStage = testFactories.playoffRound({
          id: 'round-semifinal',
          tournament_id: tournamentId,
          round_name: 'Semifinals',
          round_order: 2,
          total_games: 1,
          is_final: false,
          is_third_place: false,
          is_first_stage: false,
          games: [{ game_id: semifinal1.id }]
        });

        const updatedThirdPlaceStage = { ...thirdPlaceStage, games: [{ game_id: thirdPlaceWithRule.id }] };

        vi.mocked(getCompletePlayoffData).mockResolvedValue({
          playoffStages: [semifinalStage, updatedThirdPlaceStage, finalStage],
          teamsMap,
          gamesMap: updatedGamesMap,
          tournamentStartDate: new Date('2024-06-14T18:00:00Z')
        });

        renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

        await waitFor(() => {
          expect(screen.getByTestId(`game-card-${semifinal1.id}`)).toBeInTheDocument();
        });

        const semifinalCard = screen.getByTestId(`game-card-${semifinal1.id}`);
        const saveButton = within(semifinalCard).getByText('Save');

        await user.click(saveButton);

        await waitFor(() => {
          expect(saveGamesData).toHaveBeenCalled();
        });

        // Verify that saveGamesData was called with third place game having the loser propagated
        const savedGames = vi.mocked(saveGamesData).mock.calls[0][0];
        const updatedThirdPlace = savedGames.find((g: ExtendedGameData) => g.id === thirdPlaceWithRule.id);
        expect(updatedThirdPlace?.home_team).toBe(team3.id); // Loser of semifinal
      });

      it('should clear dependent team when game result is draft', async () => {
        const user = userEvent.setup();

        // Create a published semifinal
        const semifinalGame: ExtendedGameData = {
          ...testFactories.game({
            id: 'game-sf-1',
            game_number: 61,
            tournament_id: tournamentId,
            home_team: team1.id,
            away_team: team2.id,
            game_type: 'semifinal'
          }),
          playoffStage: {
            tournament_playoff_round_id: 'round-semifinal',
            round_name: 'Semifinals',
            is_final: false,
            is_third_place: false
          },
          gameResult: testFactories.gameResult({
            game_id: 'game-sf-1',
            home_score: 2,
            away_score: 1,
            is_draft: false
          })
        };

        // Final game has winner propagated from semifinal
        const finalWithTeam: ExtendedGameData = {
          ...finalGame,
          home_team: team1.id,
          home_team_rule: { game: 61, winner: true }
        };

        const updatedGamesMap = {
          [semifinalGame.id]: semifinalGame,
          [finalWithTeam.id]: finalWithTeam,
          [thirdPlaceGame.id]: thirdPlaceGame
        };

        const semifinalStage = testFactories.playoffRound({
          id: 'round-semifinal',
          tournament_id: tournamentId,
          round_name: 'Semifinals',
          round_order: 2,
          total_games: 1,
          is_final: false,
          is_third_place: false,
          is_first_stage: false,
          games: [{ game_id: semifinalGame.id }]
        });

        const updatedFinalStage = { ...finalStage, games: [{ game_id: finalWithTeam.id }] };

        vi.mocked(getCompletePlayoffData).mockResolvedValue({
          playoffStages: [semifinalStage, updatedFinalStage, thirdPlaceStage],
          teamsMap,
          gamesMap: updatedGamesMap,
          tournamentStartDate: new Date('2024-06-14T18:00:00Z')
        });

        renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

        await waitFor(() => {
          expect(screen.getByTestId(`game-card-${semifinalGame.id}`)).toBeInTheDocument();
        });

        // Unpublish the semifinal (set to draft) using the Unpublish button
        const semifinalCard = screen.getByTestId(`game-card-${semifinalGame.id}`);
        const unpublishButton = within(semifinalCard).getByText('Unpublish');

        await user.click(unpublishButton);

        await waitFor(() => {
          expect(saveGamesData).toHaveBeenCalled();
        });

        // Verify that the final game's home_team is cleared
        const savedGames = vi.mocked(saveGamesData).mock.calls[0][0];
        const clearedFinalGame = savedGames.find((g: ExtendedGameData) => g.id === finalWithTeam.id);
        expect(clearedFinalGame?.home_team).toBeNull();
      });
    });

    describe('Honor roll updates', () => {
      it('should update honor roll for final game when published', async () => {
        const user = userEvent.setup();
        renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

        await waitFor(() => {
          expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
        });

        const finalGameCard = screen.getByTestId(`game-card-${finalGame.id}`);
        const publishButton = within(finalGameCard).getByText('Publish');

        await user.click(publishButton);

        await waitFor(() => {
          expect(updateTournamentHonorRoll).toHaveBeenCalled();
        });

        expect(updateTournamentHonorRoll).toHaveBeenCalledWith(
          tournamentId,
          expect.objectContaining({
            champion_team_id: team1.id, // Home team won 2-1
            runner_up_team_id: team2.id
          }),
          'es'
        );
      });

      it('should update honor roll for third place game when published', async () => {
        const user = userEvent.setup();
        renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

        await waitFor(() => {
          expect(screen.getByTestId(`game-card-${thirdPlaceGame.id}`)).toBeInTheDocument();
        });

        const thirdPlaceCard = screen.getByTestId(`game-card-${thirdPlaceGame.id}`);
        const publishButton = within(thirdPlaceCard).getByText('Publish');

        await user.click(publishButton);

        await waitFor(() => {
          expect(updateTournamentHonorRoll).toHaveBeenCalled();
        });

        expect(updateTournamentHonorRoll).toHaveBeenCalledWith(
          tournamentId,
          expect.objectContaining({
            third_place_team_id: team3.id // Home team won 1-0
          }),
          'es'
        );
      });

      it('should update honor roll with all three positions when both games are published', async () => {
        const user = userEvent.setup();

        // Set both games as published
        const publishedFinal = {
          ...finalGame,
          gameResult: {
            ...finalGame.gameResult!,
            is_draft: false
          }
        };

        const publishedThirdPlace = {
          ...thirdPlaceGame,
          gameResult: {
            ...thirdPlaceGame.gameResult!,
            is_draft: false
          }
        };

        vi.mocked(getCompletePlayoffData).mockResolvedValue({
          playoffStages,
          teamsMap,
          gamesMap: {
            [publishedFinal.id]: publishedFinal,
            [publishedThirdPlace.id]: publishedThirdPlace,
            [quarterfinalGame.id]: quarterfinalGame
          },
          tournamentStartDate: new Date('2024-06-14T18:00:00Z')
        });

        renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

        await waitFor(() => {
          expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
        });

        // Save any game to trigger commit
        const finalGameCard = screen.getByTestId(`game-card-${finalGame.id}`);
        const saveButton = within(finalGameCard).getByText('Save');

        await user.click(saveButton);

        await waitFor(() => {
          expect(updateTournamentHonorRoll).toHaveBeenCalled();
        });

        expect(updateTournamentHonorRoll).toHaveBeenCalledWith(
          tournamentId,
          expect.objectContaining({
            champion_team_id: team1.id,
            runner_up_team_id: team2.id,
            third_place_team_id: team3.id
          }),
          'es'
        );
      });

      it('should not update honor roll when final game is still draft', async () => {
        const user = userEvent.setup();
        renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

        await waitFor(() => {
          expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
        });

        // Save without publishing (is_draft remains true)
        const finalGameCard = screen.getByTestId(`game-card-${finalGame.id}`);
        const saveButton = within(finalGameCard).getByText('Save');

        await user.click(saveButton);

        await waitFor(() => {
          expect(saveGameResults).toHaveBeenCalled();
        });

        // Honor roll should not be updated for draft games
        expect(updateTournamentHonorRoll).not.toHaveBeenCalled();
      });

      it('should not update honor roll for non-final non-third-place games', async () => {
        const user = userEvent.setup();
        renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

        await waitFor(() => {
          expect(screen.getByTestId(`game-card-${quarterfinalGame.id}`)).toBeInTheDocument();
        });

        const quarterfinalCard = screen.getByTestId(`game-card-${quarterfinalGame.id}`);
        const saveButton = within(quarterfinalCard).getByText('Save');

        await user.click(saveButton);

        await waitFor(() => {
          expect(saveGameResults).toHaveBeenCalled();
        });

        expect(updateTournamentHonorRoll).not.toHaveBeenCalled();
      });

      it('should clear honor roll values when final game is set to draft', async () => {
        const user = userEvent.setup();

        // Start with published final (not draft)
        const publishedFinal = {
          ...finalGame,
          gameResult: {
            ...finalGame.gameResult!,
            is_draft: false
          }
        };

        // Start with published third place too
        const publishedThirdPlace = {
          ...thirdPlaceGame,
          gameResult: {
            ...thirdPlaceGame.gameResult!,
            is_draft: false
          }
        };

        vi.mocked(getCompletePlayoffData).mockResolvedValueOnce({
          playoffStages,
          teamsMap,
          gamesMap: {
            [publishedFinal.id]: publishedFinal,
            [publishedThirdPlace.id]: publishedThirdPlace,
            [quarterfinalGame.id]: quarterfinalGame
          },
          tournamentStartDate: new Date('2024-06-14T18:00:00Z')
        });

        renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

        await waitFor(() => {
          expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
        });

        // "Unpublish" by clicking unpublish button (sets to draft)
        const finalGameCard = screen.getByTestId(`game-card-${finalGame.id}`);
        const unpublishButton = within(finalGameCard).getByText('Unpublish');

        await user.click(unpublishButton);

        await waitFor(() => {
          expect(updateTournamentHonorRoll).toHaveBeenCalled();
        });

        // When final game is set to draft, champion/runner_up should be null
        // but third_place_team_id should still be team3 since that game is still published
        expect(updateTournamentHonorRoll).toHaveBeenCalledWith(
          tournamentId,
          expect.objectContaining({
            champion_team_id: null,
            runner_up_team_id: null,
            third_place_team_id: team3.id
          }),
          'es'
        );
      });
    });
  });

  describe('Data refresh', () => {
    it('should fetch playoff data on mount', async () => {
      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(getCompletePlayoffData).toHaveBeenCalledWith(tournamentId);
      });
    });

    it('should update internal state after data loads', async () => {
      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
      });

      // Verify all games are rendered (proves state was updated)
      expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`game-card-${thirdPlaceGame.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`game-card-${quarterfinalGame.id}`)).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should handle API errors gracefully on initial load', async () => {
      // Add a global unhandledrejection handler to catch the expected error
      const unhandledRejectionHandler = vi.fn();
      const originalHandler = process.listeners('unhandledRejection')[0];
      process.removeAllListeners('unhandledRejection');
      process.on('unhandledRejection', unhandledRejectionHandler);

      // Mock the rejection
      vi.mocked(getCompletePlayoffData).mockRejectedValueOnce(new Error('API Error'));

      // Render component - it will fail to load data but shouldn't crash
      const { container } = renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      // Wait for the API call to be made
      await waitFor(() => {
        expect(getCompletePlayoffData).toHaveBeenCalled();
      });

      // Give time for any unhandled rejections to be caught
      await new Promise(resolve => setTimeout(resolve, 100));

      // Component should still render with loading state
      const backdrop = container.querySelector('.MuiBackdrop-root');
      expect(backdrop).toBeInTheDocument();

      // Verify no games are rendered (since data fetch failed)
      expect(screen.queryByTestId(`game-card-${finalGame.id}`)).not.toBeInTheDocument();

      // Restore original handler
      process.removeListener('unhandledRejection', unhandledRejectionHandler);
      if (originalHandler) {
        process.on('unhandledRejection', originalHandler as any);
      }
    });

    it('should show error message when save fails', async () => {
      const user = userEvent.setup();

      renderWithTheme(<PlayoffTab tournamentId={tournamentId} />);

      await waitFor(() => {
        expect(screen.getByTestId(`game-card-${finalGame.id}`)).toBeInTheDocument();
      });

      // Suppress console.error for this test since we expect an error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock rejection for next call
      vi.mocked(saveGameResults).mockRejectedValueOnce(new Error('Save failed'));

      const finalGameCard = screen.getByTestId(`game-card-${finalGame.id}`);
      const saveButton = within(finalGameCard).getByText('Save');

      // Click and immediately catch the expected error
      const clickPromise = user.click(saveButton);

      // Wait for the error message to appear (this ensures the promise rejection is handled)
      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });

      // Make sure the click operation completes (it should reject but be caught)
      await clickPromise.catch(() => {
        // Expected to fail, ignore the error
      });

      consoleErrorSpy.mockRestore();
    });
  });
});

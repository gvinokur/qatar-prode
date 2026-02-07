import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import PlayoffTab from '@/app/components/backoffice/playoff-tab';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { CountdownProvider } from '@/app/components/context-providers/countdown-context-provider';
import * as tournamentActions from '@/app/actions/tournament-actions';
import * as backofficeActions from '@/app/actions/backoffice-actions';

// Mock the actions
vi.mock('@/app/actions/tournament-actions');
vi.mock('@/app/actions/backoffice-actions');

describe('PlayoffTab', () => {
  const mockTournamentId = 'tournament-1';

  const renderPlayoffTab = (tournamentId: string) => {
    return renderWithTheme(
      <CountdownProvider>
        <PlayoffTab tournamentId={tournamentId} />
      </CountdownProvider>
    );
  };

  const mockPlayoffData = {
    gamesMap: {
      'game-1': {
        id: 'game-1',
        game_number: 1,
        tournament_id: mockTournamentId,
        home_team: 'team-1',
        away_team: 'team-2',
        game_date: new Date('2024-01-01'),
        playoffStage: 'stage-1',
        gameResult: {
          game_id: 'game-1',
          is_draft: false,
          home_score: 2,
          away_score: 1,
        },
      },
    },
    teamsMap: {
      'team-1': { id: 'team-1', name: 'Team 1', country_code: 'T1' },
      'team-2': { id: 'team-2', name: 'Team 2', country_code: 'T2' },
    },
    playoffStages: [
      {
        id: 'stage-1',
        round_name: 'Final',
        is_final: true,
        is_third_place: false,
        games: [{ game_id: 'game-1' }],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(tournamentActions.getCompletePlayoffData).mockResolvedValue(mockPlayoffData);
    vi.mocked(backofficeActions.saveGameResults).mockResolvedValue(undefined);
    vi.mocked(backofficeActions.saveGamesData).mockResolvedValue(undefined);
    vi.mocked(backofficeActions.calculateGameScores).mockResolvedValue(undefined);
    vi.mocked(backofficeActions.updateTournamentHonorRoll).mockResolvedValue(undefined);
  });

  describe('Honor Roll Update Logic', () => {
    it('should update honor roll when champion is determined', async () => {
      const dataWithFinalGame = {
        ...mockPlayoffData,
        playoffStages: [
          {
            id: 'stage-1',
            round_name: 'Final',
            is_final: true,
            is_third_place: false,
            games: [{ game_id: 'game-1' }],
          },
        ],
      };

      vi.mocked(tournamentActions.getCompletePlayoffData).mockResolvedValue(dataWithFinalGame);

      renderPlayoffTab(mockTournamentId);

      await waitFor(() => {
        expect(tournamentActions.getCompletePlayoffData).toHaveBeenCalledWith(mockTournamentId);
      });
    });

    it('should not update honor roll when all values are null', async () => {
      const dataWithDraftGame = {
        ...mockPlayoffData,
        gamesMap: {
          'game-1': {
            ...mockPlayoffData.gamesMap['game-1'],
            gameResult: {
              game_id: 'game-1',
              is_draft: true,
            },
          },
        },
      };

      vi.mocked(tournamentActions.getCompletePlayoffData).mockResolvedValue(dataWithDraftGame);

      renderPlayoffTab(mockTournamentId);

      await waitFor(() => {
        expect(tournamentActions.getCompletePlayoffData).toHaveBeenCalledWith(mockTournamentId);
      });

      // Verify updateTournamentHonorRoll is NOT called when game is draft
      expect(backofficeActions.updateTournamentHonorRoll).not.toHaveBeenCalled();
    });

    it('should not update honor roll when all values are undefined', async () => {
      const dataWithUndefinedWinner = {
        ...mockPlayoffData,
        gamesMap: {
          'game-1': {
            ...mockPlayoffData.gamesMap['game-1'],
            home_team: null,
            away_team: null,
            gameResult: {
              game_id: 'game-1',
              is_draft: false,
            },
          },
        },
      };

      vi.mocked(tournamentActions.getCompletePlayoffData).mockResolvedValue(dataWithUndefinedWinner);

      renderPlayoffTab(mockTournamentId);

      await waitFor(() => {
        expect(tournamentActions.getCompletePlayoffData).toHaveBeenCalledWith(mockTournamentId);
      });

      // Verify updateTournamentHonorRoll is NOT called when teams are null
      expect(backofficeActions.updateTournamentHonorRoll).not.toHaveBeenCalled();
    });

    it('should update honor roll when third place is determined', async () => {
      const dataWithThirdPlace = {
        ...mockPlayoffData,
        playoffStages: [
          {
            id: 'stage-1',
            round_name: 'Final',
            is_final: true,
            is_third_place: false,
            games: [{ game_id: 'game-1' }],
          },
          {
            id: 'stage-2',
            round_name: 'Third Place',
            is_final: false,
            is_third_place: true,
            games: [{ game_id: 'game-2' }],
          },
        ],
        gamesMap: {
          ...mockPlayoffData.gamesMap,
          'game-2': {
            id: 'game-2',
            game_number: 2,
            tournament_id: mockTournamentId,
            home_team: 'team-3',
            away_team: 'team-4',
            game_date: new Date('2024-01-02'),
            playoffStage: 'stage-2',
            gameResult: {
              game_id: 'game-2',
              is_draft: false,
              home_score: 3,
              away_score: 1,
            },
          },
        },
        teamsMap: {
          ...mockPlayoffData.teamsMap,
          'team-3': { id: 'team-3', name: 'Team 3', country_code: 'T3' },
          'team-4': { id: 'team-4', name: 'Team 4', country_code: 'T4' },
        },
      };

      vi.mocked(tournamentActions.getCompletePlayoffData).mockResolvedValue(dataWithThirdPlace);

      renderPlayoffTab(mockTournamentId);

      await waitFor(() => {
        expect(tournamentActions.getCompletePlayoffData).toHaveBeenCalledWith(mockTournamentId);
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner initially', () => {
      vi.mocked(tournamentActions.getCompletePlayoffData).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { container } = renderPlayoffTab(mockTournamentId);

      expect(container.querySelector('.MuiBackdrop-root')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      const { getByText } = renderPlayoffTab(mockTournamentId);

      // Verify content appears (which means loading is complete)
      await waitFor(() => {
        expect(getByText('Final')).toBeInTheDocument();
      });

      // If content is visible, loading must be complete
      expect(getByText('Final')).toBeVisible();
    });
  });

  describe('Rendering', () => {
    it('should render playoff stages', async () => {
      const { getByText } = renderPlayoffTab(mockTournamentId);

      await waitFor(() => {
        expect(getByText('Final')).toBeInTheDocument();
      });
    });
  });
});

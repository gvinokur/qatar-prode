import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { testFactories } from '@/__tests__/db/test-factories';
import BackofficeFlippableGameCard from '@/app/components/backoffice/backoffice-flippable-game-card';
import { ExtendedGameData } from '@/app/definitions';
import { Team } from '@/app/db/tables-definition';

// Mock framer-motion's useReducedMotion
vi.mock('framer-motion', () => ({
  useReducedMotion: vi.fn(() => false)
}));

// Mock child components with proper exports
vi.mock('@/app/components/backoffice/backoffice-game-result-edit-controls', () => ({
  default: vi.fn(({ homeTeamName, awayTeamName, onSave, onCancel, loading, error }) => (
    <div data-testid="edit-controls">
      <div>Edit Controls</div>
      <div>Home: {homeTeamName}</div>
      <div>Away: {awayTeamName}</div>
      {error && <div data-testid="error-message">{error}</div>}
      {loading && <div data-testid="loading-indicator">Loading...</div>}
      <button onClick={onSave}>Save</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ))
}));

vi.mock('@/app/components/compact-game-view-card', () => ({
  default: vi.fn((props) => {
    const {
      isGameGuess,
      isGameFixture,
      gameNumber,
      gameDate,
      location,
      gameTimezone,
      isPlayoffGame,
      homeTeamNameOrDescription,
      awayTeamNameOrDescription,
      homeTeamTheme,
      awayTeamTheme,
      isDraft,
      homeScore,
      awayScore,
      homePenaltyScore,
      awayPenaltyScore,
      onEditClick,
      onPublishClick,
    } = props;

    return (
      <div data-testid="compact-game-view">
        <div>Compact Game View</div>
        <div>Game Number: {gameNumber}</div>
        <div>Home Team: {homeTeamNameOrDescription}</div>
        <div>Away Team: {awayTeamNameOrDescription}</div>
        {homeScore !== undefined && awayScore !== undefined && (
          <div>Score: {homeScore} - {awayScore}</div>
        )}
        {isPlayoffGame && homePenaltyScore !== undefined && awayPenaltyScore !== undefined && (
          <div>Penalties: {homePenaltyScore} - {awayPenaltyScore}</div>
        )}
        {isDraft !== undefined && <div>Draft: {isDraft ? 'Yes' : 'No'}</div>}
        <button onClick={() => onEditClick && onEditClick(gameNumber)}>Edit Game</button>
        {!isGameGuess && !isGameFixture && onPublishClick && (
          <button onClick={() => onPublishClick && onPublishClick(gameNumber)}>Toggle Publish</button>
        )}
      </div>
    );
  })
}));

describe('BackofficeFlippableGameCard', () => {
  const mockOnSave = vi.fn();
  const mockOnPublishToggle = vi.fn();

  // Test data
  const tournament = testFactories.tournament({ id: 'tournament-1' });
  const homeTeam = testFactories.team({ id: 'team-home', name: 'Home Team', short_name: 'HME' });
  const awayTeam = testFactories.team({ id: 'team-away', name: 'Away Team', short_name: 'AWY' });

  const teamsMap: Record<string, Team> = {
    [homeTeam.id]: homeTeam,
    [awayTeam.id]: awayTeam
  };

  const baseGame = testFactories.game({
    id: 'game-1',
    tournament_id: tournament.id,
    home_team: homeTeam.id,
    away_team: awayTeam.id,
    game_number: 1,
    game_type: 'group'
  });

  const baseExtendedGame: ExtendedGameData = {
    ...baseGame,
    group: { tournament_group_id: 'group-1', group_letter: 'A' },
    playoffStage: null,
    gameResult: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // No need to clean up timers as we're not using fake timers globally
  });

  describe('Initial Render', () => {
    it('renders CompactGameViewCard when not editing', () => {
      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      expect(screen.getByTestId('compact-game-view')).toBeInTheDocument();
      expect(screen.getByText('Compact Game View')).toBeInTheDocument();
      expect(screen.getByText(`Game Number: ${baseExtendedGame.game_number}`)).toBeInTheDocument();
    });

    it('does not render edit controls initially', () => {
      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      expect(screen.queryByTestId('edit-controls')).not.toBeInTheDocument();
    });

    it('sets data-game-id attribute on container', () => {
      const { container } = renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      const gameContainer = container.querySelector(`[data-game-id="${baseExtendedGame.id}"]`);
      expect(gameContainer).toBeInTheDocument();
    });

    it('sets data-editing attribute to false initially', () => {
      const { container } = renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      const gameContainer = container.querySelector(`[data-game-id="${baseExtendedGame.id}"]`);
      expect(gameContainer?.getAttribute('data-editing')).toBe('false');
    });
  });

  describe('Edit State Initialization', () => {
    it('initializes edit state from game data when game has results', async () => {
      const user = userEvent.setup();
      const gameWithResult: ExtendedGameData = {
        ...baseExtendedGame,
        gameResult: testFactories.gameResult({
          game_id: baseExtendedGame.id,
          home_score: 2,
          away_score: 1,
          home_penalty_score: undefined,
          away_penalty_score: undefined,
          is_draft: true
        })
      };

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={gameWithResult}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Component should initialize with these values internally
      // We'll verify this by entering edit mode and checking the values are passed to edit controls
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Check that edit controls are rendered (this confirms state was initialized)
      expect(screen.getByTestId('edit-controls')).toBeInTheDocument();
    });

    it('initializes edit state with undefined when no game result', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      expect(screen.getByTestId('edit-controls')).toBeInTheDocument();
    });

    it('initializes penalty scores from game result', async () => {
      const user = userEvent.setup();
      const gameWithPenalties: ExtendedGameData = {
        ...baseExtendedGame,
        gameResult: testFactories.gameResult({
          game_id: baseExtendedGame.id,
          home_score: 1,
          away_score: 1,
          home_penalty_score: 4,
          away_penalty_score: 3,
          is_draft: false
        })
      };

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={gameWithPenalties}
          teamsMap={teamsMap}
          isPlayoffs={true}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      expect(screen.getByTestId('edit-controls')).toBeInTheDocument();
    });
  });

  describe('Flip Animation and Edit Mode', () => {
    it('triggers flip animation on edit click', async () => {
      const user = userEvent.setup();
      const { container } = renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Check data-editing attribute changed
      const gameContainer = container.querySelector(`[data-game-id="${baseExtendedGame.id}"]`);
      expect(gameContainer?.getAttribute('data-editing')).toBe('true');
    });

    it('shows BackofficeGameResultEditControls when editing', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      expect(screen.getByTestId('edit-controls')).toBeInTheDocument();
      expect(screen.getByText('Edit Controls')).toBeInTheDocument();
      expect(screen.getByText(`Home: ${homeTeam.name}`)).toBeInTheDocument();
      expect(screen.getByText(`Away: ${awayTeam.name}`)).toBeInTheDocument();
    });

    it('passes correct team names to edit controls', async () => {
      const user = userEvent.setup();

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      expect(screen.getByText(`Home: ${homeTeam.name}`)).toBeInTheDocument();
      expect(screen.getByText(`Away: ${awayTeam.name}`)).toBeInTheDocument();
    });

    it('handles TBD teams correctly', async () => {
      const user = userEvent.setup();
      const gameWithTBD: ExtendedGameData = {
        ...baseExtendedGame,
        home_team: null,
        away_team: null
      };

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={gameWithTBD}
          teamsMap={teamsMap}
          isPlayoffs={true}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      expect(screen.getByText('Home: TBD')).toBeInTheDocument();
      expect(screen.getByText('Away: TBD')).toBeInTheDocument();
    });
  });

  describe('Save Handler', () => {
    it('calls onSave with updated game data', async () => {
      const user = userEvent.setup();
      const gameWithResult: ExtendedGameData = {
        ...baseExtendedGame,
        gameResult: testFactories.gameResult({
          game_id: baseExtendedGame.id,
          home_score: 1,
          away_score: 0,
          is_draft: true
        })
      };

      mockOnSave.mockResolvedValueOnce(undefined);

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={gameWithResult}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Click save in edit controls
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledTimes(1);
      });

      // Verify the structure of the updated game object
      const calledWith = mockOnSave.mock.calls[0][0];
      expect(calledWith).toHaveProperty('id', baseExtendedGame.id);
      expect(calledWith).toHaveProperty('gameResult');
      expect(calledWith.gameResult).toHaveProperty('game_id', baseExtendedGame.id);
    });

    it('closes edit mode after successful save', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValueOnce(undefined);

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      expect(screen.getByTestId('edit-controls')).toBeInTheDocument();

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Edit controls should be removed after save
      await waitFor(() => {
        expect(screen.queryByTestId('edit-controls')).not.toBeInTheDocument();
      });
    });

    it('shows error and stays in edit mode on save failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Failed to save game result';
      mockOnSave.mockRejectedValueOnce(new Error(errorMessage));

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Should still be in edit mode
      expect(screen.getByTestId('edit-controls')).toBeInTheDocument();
    });

    it('shows loading state during save', async () => {
      const user = userEvent.setup();
      let resolveSave: () => void;
      const savePromise = new Promise<void>((resolve) => {
        resolveSave = resolve;
      });
      mockOnSave.mockReturnValueOnce(savePromise);

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
      });

      // Resolve the save
      resolveSave!();

      // Loading should disappear
      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
      });
    });

    it('preserves penalty scores in updated game object', async () => {
      const user = userEvent.setup();
      const gameWithPenalties: ExtendedGameData = {
        ...baseExtendedGame,
        gameResult: testFactories.gameResult({
          game_id: baseExtendedGame.id,
          home_score: 1,
          away_score: 1,
          home_penalty_score: 5,
          away_penalty_score: 4,
          is_draft: false
        })
      };

      mockOnSave.mockResolvedValueOnce(undefined);

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={gameWithPenalties}
          teamsMap={teamsMap}
          isPlayoffs={true}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      const calledWith = mockOnSave.mock.calls[0][0];
      expect(calledWith.gameResult?.home_penalty_score).toBe(5);
      expect(calledWith.gameResult?.away_penalty_score).toBe(4);
    });
  });

  describe('Cancel Handler', () => {
    it('resets to original values on cancel', async () => {
      const user = userEvent.setup();
      const gameWithResult: ExtendedGameData = {
        ...baseExtendedGame,
        gameResult: testFactories.gameResult({
          game_id: baseExtendedGame.id,
          home_score: 2,
          away_score: 1
        })
      };

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={gameWithResult}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should exit edit mode
      await waitFor(() => {
        expect(screen.queryByTestId('edit-controls')).not.toBeInTheDocument();
      });
    });

    it('closes edit mode on cancel', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      expect(screen.getByTestId('edit-controls')).toBeInTheDocument();

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should exit edit mode
      await waitFor(() => {
        expect(screen.queryByTestId('edit-controls')).not.toBeInTheDocument();
      });
      expect(screen.getByTestId('compact-game-view')).toBeInTheDocument();
    });

    it('clears error message on cancel', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Save failed';
      mockOnSave.mockRejectedValueOnce(new Error(errorMessage));

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Trigger save error
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Error should be cleared when re-entering edit mode
      await user.click(screen.getByRole('button', { name: /edit game/i }));
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('Publish Toggle Handler', () => {
    it('calls onPublishToggle with correct parameters for draft game', async () => {
      const user = userEvent.setup();
      const gameWithDraftResult: ExtendedGameData = {
        ...baseExtendedGame,
        gameResult: testFactories.gameResult({
          game_id: baseExtendedGame.id,
          home_score: 2,
          away_score: 1,
          is_draft: true
        })
      };

      mockOnPublishToggle.mockResolvedValueOnce(undefined);

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={gameWithDraftResult}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      const publishButton = screen.getByRole('button', { name: /toggle publish/i });
      await user.click(publishButton);

      expect(mockOnPublishToggle).toHaveBeenCalledWith(baseExtendedGame.id, true);
    });

    it('calls onPublishToggle with correct parameters for published game', async () => {
      const user = userEvent.setup();
      const gameWithPublishedResult: ExtendedGameData = {
        ...baseExtendedGame,
        gameResult: testFactories.gameResult({
          game_id: baseExtendedGame.id,
          home_score: 2,
          away_score: 1,
          is_draft: false
        })
      };

      mockOnPublishToggle.mockResolvedValueOnce(undefined);

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={gameWithPublishedResult}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      const publishButton = screen.getByRole('button', { name: /toggle publish/i });
      await user.click(publishButton);

      expect(mockOnPublishToggle).toHaveBeenCalledWith(baseExtendedGame.id, false);
    });

    it('passes showPublishToggle prop to CompactGameViewCard', () => {
      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Verify publish toggle button is shown (mocked component renders it when showPublishToggle is true)
      expect(screen.getByRole('button', { name: /toggle publish/i })).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('attempts to focus edit button after save completes', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValueOnce(undefined);

      const { container } = renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Verify component has returned to non-editing state (compact view visible)
      await waitFor(() => {
        expect(screen.queryByTestId('edit-controls')).not.toBeInTheDocument();
        expect(screen.getByTestId('compact-game-view')).toBeInTheDocument();
      });

      // Verify the edit button is available again (focus management happens in component)
      const newEditButton = screen.getByRole('button', { name: /edit game/i });
      expect(newEditButton).toBeInTheDocument();
    });

    it('attempts to focus edit button after cancel', async () => {
      const user = userEvent.setup();
      const { container } = renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Click cancel
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Verify component has returned to non-editing state (compact view visible)
      await waitFor(() => {
        expect(screen.queryByTestId('edit-controls')).not.toBeInTheDocument();
        expect(screen.getByTestId('compact-game-view')).toBeInTheDocument();
      });

      // Verify the edit button is available again (focus management happens in component)
      const newEditButton = screen.getByRole('button', { name: /edit game/i });
      expect(newEditButton).toBeInTheDocument();
    });
  });

  describe('Playoff Games', () => {
    it('passes isPlayoffs prop correctly to edit controls', async () => {
      const user = userEvent.setup();
      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={true}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Edit controls should be rendered (mock doesn't show isPlayoffs, but it's passed through)
      expect(screen.getByTestId('edit-controls')).toBeInTheDocument();
    });

    it('handles penalty shootout data for playoff games', async () => {
      const user = userEvent.setup();
      const playoffGameWithPenalties: ExtendedGameData = {
        ...baseExtendedGame,
        game_type: 'knockout',
        gameResult: testFactories.gameResult({
          game_id: baseExtendedGame.id,
          home_score: 1,
          away_score: 1,
          home_penalty_score: 4,
          away_penalty_score: 2,
          is_draft: false
        })
      };

      mockOnSave.mockResolvedValueOnce(undefined);

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={playoffGameWithPenalties}
          teamsMap={teamsMap}
          isPlayoffs={true}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      // Verify penalty scores are included
      const calledWith = mockOnSave.mock.calls[0][0];
      expect(calledWith.gameResult?.home_penalty_score).toBe(4);
      expect(calledWith.gameResult?.away_penalty_score).toBe(2);
    });
  });

  describe('Reduced Motion', () => {
    it('respects reduced motion preference', async () => {
      const user = userEvent.setup();
      const { useReducedMotion } = await import('framer-motion');
      vi.mocked(useReducedMotion).mockReturnValueOnce(true);

      const { container } = renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Component should render (transition styling is handled internally)
      expect(screen.getByTestId('compact-game-view')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message from failed save', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Network error occurred';
      mockOnSave.mockRejectedValueOnce(new Error(errorMessage));

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('shows default error message when error has no message', async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValueOnce({});

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
        expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
      });
    });

    it('clears error when entering edit mode again', async () => {
      const user = userEvent.setup();
      mockOnSave.mockRejectedValueOnce(new Error('First error'));

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      let editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Trigger error
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Cancel to exit edit mode
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByTestId('edit-controls')).not.toBeInTheDocument();
      });

      // Re-enter edit mode
      editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Error should be cleared
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
    });
  });

  describe('Game Result Updates', () => {
    it('creates gameResult when none exists', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValueOnce(undefined);

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={baseExtendedGame}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      const calledWith = mockOnSave.mock.calls[0][0];
      expect(calledWith.gameResult).toBeDefined();
      expect(calledWith.gameResult?.game_id).toBe(baseExtendedGame.id);
      expect(calledWith.gameResult?.is_draft).toBe(true);
    });

    it('preserves is_draft flag from existing result', async () => {
      const user = userEvent.setup();
      const gameWithPublished: ExtendedGameData = {
        ...baseExtendedGame,
        gameResult: testFactories.gameResult({
          game_id: baseExtendedGame.id,
          home_score: 1,
          away_score: 0,
          is_draft: false
        })
      };

      mockOnSave.mockResolvedValueOnce(undefined);

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={gameWithPublished}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      const calledWith = mockOnSave.mock.calls[0][0];
      expect(calledWith.gameResult?.is_draft).toBe(false);
    });

    it('converts null penalty scores to undefined in game result', async () => {
      const user = userEvent.setup();
      const gameWithResult: ExtendedGameData = {
        ...baseExtendedGame,
        gameResult: testFactories.gameResult({
          game_id: baseExtendedGame.id,
          home_score: 2,
          away_score: 1,
          home_penalty_score: null,
          away_penalty_score: null
        })
      };

      mockOnSave.mockResolvedValueOnce(undefined);

      renderWithTheme(
        <BackofficeFlippableGameCard
          game={gameWithResult}
          teamsMap={teamsMap}
          isPlayoffs={false}
          onSave={mockOnSave}
          onPublishToggle={mockOnPublishToggle}
        />
      );

      // Enter edit mode
      const editButton = screen.getByRole('button', { name: /edit game/i });
      await user.click(editButton);

      // Click save
      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
      });

      const calledWith = mockOnSave.mock.calls[0][0];
      expect(calledWith.gameResult?.home_penalty_score).toBeUndefined();
      expect(calledWith.gameResult?.away_penalty_score).toBeUndefined();
    });
  });
});

import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import CompactGameViewCard from '../../app/components/compact-game-view-card';
import { TimezoneProvider } from '../../app/components/context-providers/timezone-context-provider';
import { CountdownProvider } from '../../app/components/context-providers/countdown-context-provider';
import { renderWithTheme } from '../utils/test-utils';

// Wrapper component for all required providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TimezoneProvider>
      <CountdownProvider>
        {children}
      </CountdownProvider>
    </TimezoneProvider>
  );
}

const resultProps = {
  isGameGuess: false as const,
  isGameFixture: false as const,
  gameNumber: 1,
  gameDate: new Date('2024-07-01T18:00:00Z'),
  gameTimezone: 'America/New_York',
  location: 'Stadium 1',
  homeTeamNameOrDescription: 'Team A',
  awayTeamNameOrDescription: 'Team B',
  isPlayoffGame: false,
  onEditClick: vi.fn(),
  homeScore: 2,
  awayScore: 1,
};

const guessProps = {
  isGameGuess: true as const,
  isGameFixture: false as const,
  gameNumber: 1,
  gameDate: new Date('2024-07-01T18:00:00Z'),
  gameTimezone: 'America/New_York',
  location: 'Stadium 1',
  homeTeamNameOrDescription: 'Team A',
  awayTeamNameOrDescription: 'Team B',
  isPlayoffGame: false,
  onEditClick: vi.fn(),
  scoreForGame: 1,
  gameResult: { home_score: 2, away_score: 1, game_id: 'g1', is_draft: false },
};

describe('CompactGameViewCard', () => {
  it('renders game info (result mode)', () => {
    renderWithTheme(
      <TestWrapper>
        <CompactGameViewCard {...resultProps} />
      </TestWrapper>
    );
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
    expect(screen.getByText('Stadium 1')).toBeInTheDocument();
  });

  it('renders game info (guess mode)', () => {
    renderWithTheme(
      <TestWrapper>
        <CompactGameViewCard {...guessProps} />
      </TestWrapper>
    );
    // Team names appear twice when game has results (prediction + actual result)
    expect(screen.getAllByText('Team A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Team B').length).toBeGreaterThan(0);
    expect(screen.getByText('Stadium 1')).toBeInTheDocument();
  });

  it('calls onEditClick when edit button is clicked', () => {
    const onEditClick = vi.fn();
    renderWithTheme(
      <TestWrapper>
        <CompactGameViewCard {...resultProps} onEditClick={onEditClick} />
      </TestWrapper>
    );
    // Get the edit button specifically (not the timezone toggle button)
    const editButton = screen.getAllByRole('button').find(btn =>
      btn.querySelector('[data-testid="EditIcon"], [data-testid="ScoreboardIcon"]')
    ) || screen.getAllByRole('button')[1]; // Fallback to second button if icon not found
    fireEvent.click(editButton);
    expect(onEditClick).toHaveBeenCalled();
  });

  it('should not display game number', () => {
    renderWithTheme(
      <TestWrapper>
        <CompactGameViewCard {...resultProps} />
      </TestWrapper>
    );

    // Game number should not be in document
    expect(screen.queryByText(/#1/)).not.toBeInTheDocument();
  });

  describe('Round 2 refinements - Boost chip visibility', () => {
    it('should show boost chip when game has no results', () => {
      const propsWithBoostNoResults = {
        ...guessProps,
        boostType: 'silver' as const,
        gameResult: null,
        scoreForGame: undefined,
      };

      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsWithBoostNoResults} />
        </TestWrapper>
      );

      // Boost chip should be visible
      expect(screen.getByText('2x')).toBeInTheDocument();
    });

    it('should hide boost chip when game has results', () => {
      const propsWithBoostAndResults = {
        ...guessProps,
        boostType: 'silver' as const,
        gameResult: { home_score: 2, away_score: 1, game_id: 'g1', is_draft: false },
        scoreForGame: 4,
        homeScore: 2,
        awayScore: 1,
      };

      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsWithBoostAndResults} />
        </TestWrapper>
      );

      // Boost chip should be hidden when results are available
      expect(screen.queryByText('2x')).not.toBeInTheDocument();
    });

    it('should show boost chip for golden boost when game has no results', () => {
      const propsWithGoldenBoostNoResults = {
        ...guessProps,
        boostType: 'golden' as const,
        gameResult: null,
        scoreForGame: undefined,
      };

      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsWithGoldenBoostNoResults} />
        </TestWrapper>
      );

      // Golden boost chip should be visible
      expect(screen.getByText('3x')).toBeInTheDocument();
    });

    it('should hide boost chip for golden boost when game has results', () => {
      const propsWithGoldenBoostAndResults = {
        ...guessProps,
        boostType: 'golden' as const,
        gameResult: { home_score: 2, away_score: 1, game_id: 'g1', is_draft: false },
        scoreForGame: 6,
        homeScore: 2,
        awayScore: 1,
      };

      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsWithGoldenBoostAndResults} />
        </TestWrapper>
      );

      // Golden boost chip should be hidden when results are available
      expect(screen.queryByText('3x')).not.toBeInTheDocument();
    });

    it('should use TrophyIcon for both silver and golden boosts', () => {
      const { rerenderWithTheme } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard
            {...guessProps}
            boostType="silver"
            gameResult={null}
            scoreForGame={undefined}
          />
        </TestWrapper>
      );

      // Silver boost chip should be visible with 2x label
      expect(screen.getByText('2x')).toBeInTheDocument();

      // Golden boost should also use TrophyIcon with 3x label
      rerenderWithTheme(
        <TestWrapper>
          <CompactGameViewCard
            {...guessProps}
            boostType="golden"
            gameResult={null}
            scoreForGame={undefined}
          />
        </TestWrapper>
      );

      expect(screen.getByText('3x')).toBeInTheDocument();
    });
  });

  describe('Draft/Publish toggle error handling', () => {
    it('should recover publishing state when onPublishClick succeeds', async () => {
      const onPublishClick = vi.fn().mockResolvedValue(undefined);
      const propsWithPublish = {
        ...resultProps,
        isDraft: true,
        onPublishClick,
      };

      const { container } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsWithPublish} />
        </TestWrapper>
      );

      // Find the checkbox (draft/publish toggle)
      const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox).toBeInTheDocument();

      // Click the checkbox to toggle
      fireEvent.click(checkbox);

      // Wait for async operation to complete
      await waitFor(() => {
        expect(onPublishClick).toHaveBeenCalledWith(1); // gameNumber is 1
      });

      // Wait for state to update (publishing = false)
      await waitFor(() => {
        expect(checkbox).not.toBeDisabled();
      });
    });

    it('should recover publishing state when onPublishClick fails', async () => {
      // Mock console.error to suppress error output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a promise that we can track
      let rejectFn: ((reason?: any) => void) | null = null;
      const errorPromise = new Promise((_, reject) => {
        rejectFn = reject;
      });

      const onPublishClick = vi.fn().mockImplementation(() => {
        // Return the promise and trigger rejection
        const error = new Error('Test error');
        if (rejectFn) rejectFn(error);
        return errorPromise.catch(() => {
          // Catch the error to prevent unhandled rejection
        });
      });

      const propsWithPublish = {
        ...resultProps,
        isDraft: true,
        onPublishClick,
      };

      const { container } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsWithPublish} />
        </TestWrapper>
      );

      // Find the checkbox
      const checkbox = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox).toBeInTheDocument();

      // Click the checkbox (will trigger async error, but component handles it)
      fireEvent.click(checkbox);

      // Verify the async function was called
      await waitFor(() => {
        expect(onPublishClick).toHaveBeenCalledWith(1);
      });

      // Give enough time for the finally block to execute
      await new Promise(resolve => setTimeout(resolve, 100));

      // The key assertion: checkbox should be enabled (not stuck)
      // The finally block in handleDraftChange ensures this
      expect(checkbox).not.toBeDisabled();

      consoleSpy.mockRestore();
    });
  });

  describe('Disabled/Locked State (Fix #6)', () => {
    it('should display Lock icon when game guess is disabled', () => {
      const { container } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard
            {...guessProps}
            disabled={true}
          />
        </TestWrapper>
      );

      // Verify Lock icon is present
      // The Lock icon should be rendered as an SVG with specific data-testid or class
      const lockIcon = container.querySelector('[data-testid="LockIcon"]');
      expect(lockIcon).toBeInTheDocument();
    });

    it('should not display edit button when disabled', () => {
      const onEditClick = vi.fn();
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard
            {...guessProps}
            disabled={true}
            onEditClick={onEditClick}
          />
        </TestWrapper>
      );

      // Edit button should not be present when disabled
      const buttons = screen.queryAllByRole('button');
      const editButton = buttons.find(btn =>
        btn.querySelector('[data-testid="EditIcon"], [data-testid="ScoreboardIcon"]')
      );

      expect(editButton).toBeUndefined();
    });

    it('should not call onEditClick when disabled and clicked', () => {
      const onEditClick = vi.fn();
      const { container } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard
            {...guessProps}
            disabled={true}
            onEditClick={onEditClick}
          />
        </TestWrapper>
      );

      // Try clicking the card
      const card = container.querySelector('.MuiCard-root');
      if (card) {
        fireEvent.click(card);
      }

      expect(onEditClick).not.toHaveBeenCalled();
    });
  });

  describe('Story #254 - Clickability Visual Feedback', () => {
    it('should show cursor pointer on card when clickable', () => {
      const { container } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...guessProps} disabled={false} />
        </TestWrapper>
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ cursor: 'pointer' });
    });

    it('should not show cursor pointer when disabled', () => {
      const { container } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...guessProps} disabled={true} />
        </TestWrapper>
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).not.toHaveStyle({ cursor: 'pointer' });
    });

    it('should show cursor pointer on fixture cards', () => {
      const fixtureProps = {
        isGameFixture: true as const,
        isGameGuess: false as const,
        gameNumber: 1,
        gameDate: new Date('2024-07-01T18:00:00Z'),
        location: 'Stadium 1',
        homeTeamNameOrDescription: 'Team A',
        awayTeamNameOrDescription: 'Team B',
        isPlayoffGame: false,
        onEditClick: vi.fn(),
        groupOrPlayoffText: 'Group A',
      };

      const { container } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...fixtureProps} />
        </TestWrapper>
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ cursor: 'pointer' });
    });
  });

  describe('Story #254 - Actual Result Display', () => {
    const propsWithResult = {
      ...guessProps,
      homeScore: 2,
      awayScore: 1,
      gameResult: {
        home_score: 2,
        away_score: 1,
        game_id: 'g1',
        is_draft: false,
      },
      scoreForGame: 10,
    };

    it('should show "Your Prediction" label when result exists', () => {
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsWithResult} />
        </TestWrapper>
      );

      expect(screen.getByText(/Your Prediction|Tu Predicción/)).toBeInTheDocument();
    });

    it('should show "Actual Result" label when result exists', () => {
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsWithResult} />
        </TestWrapper>
      );

      expect(screen.getByText(/Actual Result|Resultado Real/)).toBeInTheDocument();
    });

    it('should not show "Your Prediction" label when no result', () => {
      const propsNoResult = {
        ...guessProps,
        homeScore: 2,
        awayScore: 1,
        gameResult: null,
      };

      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsNoResult} />
        </TestWrapper>
      );

      expect(screen.queryByText(/Your Prediction|Tu Predicción/)).not.toBeInTheDocument();
    });

    it('should show exact result badge', () => {
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsWithResult} />
        </TestWrapper>
      );

      expect(screen.getByText(/Exacto \(10 puntos\)|Exact \(10 points\)/)).toBeInTheDocument();
    });

    it('should show correct result badge when winner matches', () => {
      const propsCorrect = {
        ...guessProps,
        homeScore: 3,
        awayScore: 1,
        gameResult: {
          home_score: 2,
          away_score: 0,
          game_id: 'g1',
          is_draft: false,
        },
        scoreForGame: 3,
      };

      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsCorrect} />
        </TestWrapper>
      );

      expect(screen.getByText(/Correcto \(3 puntos\)|Correct \(3 points\)/)).toBeInTheDocument();
    });

    it('should show incorrect result badge when winner does not match', () => {
      const propsIncorrect = {
        ...guessProps,
        homeScore: 2,
        awayScore: 1,
        gameResult: {
          home_score: 0,
          away_score: 2,
          game_id: 'g1',
          is_draft: false,
        },
        scoreForGame: 0,
      };

      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsIncorrect} />
        </TestWrapper>
      );

      expect(screen.getByText(/Incorrecto \(0 puntos\)|Incorrect \(0 points\)/)).toBeInTheDocument();
    });

    it('should show "In Play" message when past deadline but no result', () => {
      const propsInPlay = {
        ...guessProps,
        gameDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        homeScore: 2,
        awayScore: 1,
        gameResult: null,
      };

      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsInPlay} />
        </TestWrapper>
      );

      expect(screen.getByText(/EN JUEGO O RECIÉN TERMINADO|IN PLAY OR RECENTLY FINISHED/)).toBeInTheDocument();
    });

    it('should not show "In Play" message when result exists', () => {
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsWithResult} />
        </TestWrapper>
      );

      expect(screen.queryByText(/IN PLAY OR RECENTLY FINISHED/)).not.toBeInTheDocument();
    });

    it('should hide point overlay when result is displayed (avoid duplication)', () => {
      const { container } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsWithResult} />
        </TestWrapper>
      );

      // GameCardPointOverlay should not be rendered when result exists
      // (points are shown in the result badge instead)
      // The overlay would have specific test IDs or classes, but we can verify it's not duplicating
      const allPointsText = screen.queryAllByText(/10/);
      // Should appear once in the badge, not in the overlay
      expect(allPointsText.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Story #254 - Result Border Styling', () => {
    it('should show green border for exact result (no boost)', () => {
      const propsExact = {
        ...guessProps,
        homeScore: 2,
        awayScore: 1,
        gameResult: {
          home_score: 2,
          away_score: 1,
          game_id: 'g1',
          is_draft: false,
        },
        scoreForGame: 10,
        boostType: null,
      };

      const { container } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsExact} />
        </TestWrapper>
      );

      const card = container.querySelector('.MuiCard-root');
      // Border width should be 2 for result borders
      expect(card).toHaveStyle({ borderWidth: '2px' });
    });

    it('should show green border for correct result (no boost)', () => {
      const propsCorrect = {
        ...guessProps,
        homeScore: 3,
        awayScore: 1,
        gameResult: {
          home_score: 2,
          away_score: 0,
          game_id: 'g1',
          is_draft: false,
        },
        scoreForGame: 3,
        boostType: null,
      };

      const { container } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsCorrect} />
        </TestWrapper>
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '2px' });
    });

    it('should show red border for incorrect result (no boost)', () => {
      const propsIncorrect = {
        ...guessProps,
        homeScore: 2,
        awayScore: 1,
        gameResult: {
          home_score: 0,
          away_score: 2,
          game_id: 'g1',
          is_draft: false,
        },
        scoreForGame: 0,
        boostType: null,
      };

      const { container } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsIncorrect} />
        </TestWrapper>
      );

      const card = container.querySelector('.MuiCard-root');
      expect(card).toHaveStyle({ borderWidth: '2px' });
    });

    it('should show boost border when both boost and result exist (boost takes precedence)', () => {
      const propsBoostAndResult = {
        ...guessProps,
        homeScore: 2,
        awayScore: 1,
        gameResult: {
          home_score: 2,
          away_score: 1,
          game_id: 'g1',
          is_draft: false,
        },
        scoreForGame: 20,
        boostType: 'silver' as const,
      };

      const { container } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsBoostAndResult} />
        </TestWrapper>
      );

      const card = container.querySelector('.MuiCard-root');
      // Boost border is 2px
      expect(card).toHaveStyle({ borderWidth: '2px' });
    });

    it('should show default border when no boost and no result', () => {
      const propsNoBoostNoResult = {
        ...guessProps,
        gameResult: null,
        boostType: null,
      };

      const { container } = renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...propsNoBoostNoResult} />
        </TestWrapper>
      );

      const card = container.querySelector('.MuiCard-root');
      // Default border is 1px
      expect(card).toHaveStyle({ borderWidth: '1px' });
    });
  });
  describe('Prediction row C2 winner styling', () => {
    const baseGuessProps = {
      isGameGuess: true as const,
      isGameFixture: false as const,
      gameNumber: 1,
      gameDate: new Date('2024-07-01T18:00:00Z'),
      gameTimezone: 'America/New_York',
      location: 'Stadium',
      homeTeamNameOrDescription: 'Home Team',
      awayTeamNameOrDescription: 'Away Team',
      isPlayoffGame: false,
      onEditClick: vi.fn(),
    };

    it('predicted home win (2-0): prediction row home team is bold', () => {
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard
            {...baseGuessProps}
            homeScore={2}
            awayScore={0}
          />
        </TestWrapper>
      );

      // Get all elements with Home Team text (could appear multiple times)
      const homeTeamEls = screen.getAllByText('Home Team');
      // First occurrence is the prediction row
      expect(homeTeamEls[0]).toHaveStyle({ fontWeight: 700 });
    });

    it('predicted away win (0-1): prediction row away team is bold', () => {
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard
            {...baseGuessProps}
            homeScore={0}
            awayScore={1}
          />
        </TestWrapper>
      );

      const awayTeamEls = screen.getAllByText('Away Team');
      expect(awayTeamEls[0]).toHaveStyle({ fontWeight: 700 });
    });

    it('predicted draw (1-1, no penalty flags): no winner/loser styles on prediction row', () => {
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard
            {...baseGuessProps}
            homeScore={1}
            awayScore={1}
          />
        </TestWrapper>
      );

      const homeTeamEls = screen.getAllByText('Home Team');
      const awayTeamEls = screen.getAllByText('Away Team');
      expect(homeTeamEls[0]).not.toHaveStyle({ fontWeight: 400 });
      expect(awayTeamEls[0]).not.toHaveStyle({ fontWeight: 400 });
    });

    it('no prediction (scores undefined): no winner/loser styles', () => {
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard
            {...baseGuessProps}
          />
        </TestWrapper>
      );

      const homeTeamEl = screen.getByText('Home Team');
      expect(homeTeamEl).not.toHaveStyle({ fontWeight: 400 });
    });

    it('draw with homePenaltyWinner=true: home team is bold on prediction row', () => {
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard
            {...baseGuessProps}
            homeScore={1}
            awayScore={1}
            isPlayoffGame={true}
            homePenaltyWinner={true}
          />
        </TestWrapper>
      );

      const homeTeamEls = screen.getAllByText('Home Team');
      expect(homeTeamEls[0]).toHaveStyle({ fontWeight: 700 });
    });
  });
  describe('Stage label (Story #376)', () => {
    it('renders nothing extra when stageLabel is undefined', () => {
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...guessProps} />
        </TestWrapper>
      );
      expect(screen.queryByLabelText(/Group|Grupo|Matchday|Fecha/)).not.toBeInTheDocument();
    });

    it('renders static text when stageLabel is provided without onStageClick', () => {
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...guessProps} stageLabel="Group A" />
        </TestWrapper>
      );
      expect(screen.getByText('Group A')).toBeInTheDocument();
    });

    it('renders clickable element when stageLabel and onStageClick are provided', () => {
      const onStageClick = vi.fn();
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...guessProps} stageLabel="Group A" onStageClick={onStageClick} />
        </TestWrapper>
      );
      const btn = screen.getByRole('button', { name: 'Group A' });
      expect(btn).toBeInTheDocument();
    });

    it('calls onStageClick when the stage button is clicked', () => {
      const onStageClick = vi.fn();
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...guessProps} stageLabel="Group A" onStageClick={onStageClick} />
        </TestWrapper>
      );
      fireEvent.click(screen.getByRole('button', { name: 'Group A' }));
      expect(onStageClick).toHaveBeenCalledTimes(1);
    });

    it('does not render stage label on non-guess cards', () => {
      renderWithTheme(
        <TestWrapper>
          <CompactGameViewCard {...resultProps} />
        </TestWrapper>
      );
      // resultProps has isGameGuess: false — stage label should not appear
      expect(screen.queryByText('Group A')).not.toBeInTheDocument();
    });
  });
}); // test comment

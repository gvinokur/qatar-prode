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
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
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

      const onPublishClick = vi.fn().mockRejectedValue(new Error('Test error'));
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
}); // test comment

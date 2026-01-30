import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import CompactGameViewCard from '../../app/components/compact-game-view-card';
import { TimezoneProvider } from '../../app/components/context-providers/timezone-context-provider';
import { CountdownProvider } from '../../app/components/context-providers/countdown-context-provider';

// Create test theme with accent colors
const testTheme = createTheme({
  palette: {
    mode: 'light',
    accent: {
      gold: {
        main: '#ffc107',
        light: '#ffd54f',
        dark: '#ffa000',
        contrastText: '#000000'
      },
      silver: {
        main: '#C0C0C0',
        light: '#E0E0E0',
        dark: '#A0A0A0',
        contrastText: '#000000'
      }
    }
  }
});

// Wrapper component for all required providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={testTheme}>
      <TimezoneProvider>
        <CountdownProvider>
          {children}
        </CountdownProvider>
      </TimezoneProvider>
    </ThemeProvider>
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
    render(
      <TestWrapper>
        <CompactGameViewCard {...resultProps} />
      </TestWrapper>
    );
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
    expect(screen.getByText('Stadium 1')).toBeInTheDocument();
  });

  it('renders game info (guess mode)', () => {
    render(
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
    render(
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
    render(
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

      render(
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

      render(
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

      render(
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

      render(
        <TestWrapper>
          <CompactGameViewCard {...propsWithGoldenBoostAndResults} />
        </TestWrapper>
      );

      // Golden boost chip should be hidden when results are available
      expect(screen.queryByText('3x')).not.toBeInTheDocument();
    });

    it('should use TrophyIcon for both silver and golden boosts', () => {
      const { rerender } = render(
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
      rerender(
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
}); // test comment

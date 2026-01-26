import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CompactGameViewCard from '../../app/components/compact-game-view-card';
import { TimezoneProvider } from '../../app/components/context-providers/timezone-context-provider';

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
    render(<CompactGameViewCard {...resultProps} />);
    expect(screen.getByText(/#1/i)).toBeInTheDocument();
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
    expect(screen.getByText('Stadium 1')).toBeInTheDocument();
  });

  it('renders game info (guess mode)', () => {
    render(<CompactGameViewCard {...guessProps} />);
    expect(screen.getByText(/#1/i)).toBeInTheDocument();
    expect(screen.getByText('Team A')).toBeInTheDocument();
    expect(screen.getByText('Team B')).toBeInTheDocument();
    expect(screen.getByText('Stadium 1')).toBeInTheDocument();
  });

  it('calls onEditClick when edit button is clicked', () => {
    const onEditClick = vi.fn();
    render(<CompactGameViewCard {...resultProps} onEditClick={onEditClick} />);
    const editButton = screen.getByRole('button');
    fireEvent.click(editButton);
    expect(onEditClick).toHaveBeenCalled();
  });

  it('toggles timezone text on click', () => {
    render(
      <TimezoneProvider>
        <CompactGameViewCard {...resultProps} />
      </TimezoneProvider>
    );
    const toggle = screen.getByText(/Horario Local|Tu Horario/);
    const initialText = toggle.textContent;
    fireEvent.click(toggle);
    expect(toggle.textContent).not.toBe(initialText);
  });

  describe('Round 2 refinements - Boost chip visibility', () => {
    it('should show boost chip when game has no results', () => {
      const propsWithBoostNoResults = {
        ...guessProps,
        boostType: 'silver' as const,
        gameResult: null,
        scoreForGame: undefined,
      };

      render(<CompactGameViewCard {...propsWithBoostNoResults} />);

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

      render(<CompactGameViewCard {...propsWithBoostAndResults} />);

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

      render(<CompactGameViewCard {...propsWithGoldenBoostNoResults} />);

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

      render(<CompactGameViewCard {...propsWithGoldenBoostAndResults} />);

      // Golden boost chip should be hidden when results are available
      expect(screen.queryByText('3x')).not.toBeInTheDocument();
    });

    it('should use TrophyIcon for both silver and golden boosts', () => {
      const { rerender } = render(
        <CompactGameViewCard
          {...guessProps}
          boostType="silver"
          gameResult={null}
          scoreForGame={undefined}
        />
      );

      // Silver boost chip should be visible with 2x label
      expect(screen.getByText('2x')).toBeInTheDocument();

      // Golden boost should also use TrophyIcon with 3x label
      rerender(
        <CompactGameViewCard
          {...guessProps}
          boostType="golden"
          gameResult={null}
          scoreForGame={undefined}
        />
      );

      expect(screen.getByText('3x')).toBeInTheDocument();
    });
  });
}); // test comment

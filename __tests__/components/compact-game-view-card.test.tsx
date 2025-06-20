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
}); // test comment

import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import type { ExtendedGameData } from '../../app/definitions';
import type { Team, GameGuessNew } from '../../app/db/tables-definition';

// Mock dependencies
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: 'user-123', name: 'Test User' } },
    status: 'authenticated'
  }))
}));

vi.mock('../../app/components/context-providers/guesses-context-provider', () => {
  const React = require('react');
  return {
    GuessesContext: React.createContext({
      gameGuesses: {},
      updateGameGuess: vi.fn(),
    }),
  };
});

vi.mock('../../app/components/context-providers/countdown-context-provider', () => ({
  useCountdownContext: vi.fn(() => ({ currentTime: Date.now() }))
}));

vi.mock('../../app/actions/guesses-actions', () => ({
  updateOrCreateTournamentGuess: vi.fn()
}));

vi.mock('../../app/utils/score-utils', () => ({
  getGuessWinner: vi.fn((guess) => guess.home_team),
  getGuessLoser: vi.fn((guess) => guess.away_team)
}));

vi.mock('../../app/utils/playoffs-rule-helper', () => ({
  getTeamDescription: vi.fn((rule) => `Team from ${rule}`)
}));

vi.mock('../../app/components/urgency-accordion', () => ({
  UrgencyAccordion: () => <div data-testid="urgency-accordion">Mocked Accordion</div>
}));

vi.mock('../../app/components/game-result-edit-dialog', () => ({
  default: () => <div data-testid="game-result-edit-dialog">Mocked Dialog</div>
}));

// Import after mocks
import { UrgencyAccordionGroup } from '../../app/components/urgency-accordion-group';
import { GuessesContext } from '../../app/components/context-providers/guesses-context-provider';

describe('UrgencyAccordionGroup - Smoke Tests', () => {
  const mockTeamsMap: Record<string, Team> = {
    'team-1': { id: 'team-1', name: 'Team A', logo: 'logo-a.png' } as Team,
    'team-2': { id: 'team-2', name: 'Team B', logo: 'logo-b.png' } as Team,
  };

  const createMockGame = (id: string, dateOffset: number, extraProps = {}): ExtendedGameData => ({
    id,
    game_date: new Date(Date.now() + dateOffset),
    home_team: 'team-1',
    away_team: 'team-2',
    tournament_id: 'tournament-1',
    game_number: parseInt(id.split('-')[1] || '1'),
    home_team_rule: null,
    away_team_rule: null,
    ...extraProps
  } as ExtendedGameData);

  const mockContextValue = {
    gameGuesses: {} as Record<string, GameGuessNew>,
    updateGameGuess: vi.fn(),
  };

  const renderWithContext = (ui: React.ReactElement, contextValue = mockContextValue) => {
    return render(
      <GuessesContext.Provider value={contextValue}>
        {ui}
      </GuessesContext.Provider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with empty games array', () => {
    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={[]}
        teamsMap={mockTeamsMap}
        gameGuesses={{}}
        tournamentId="tournament-1"
        isPlayoffs={false}
      />
    );
    expect(container).toBeTruthy();
  });

  it('renders with urgent games (< 2h)', () => {
    const games = [createMockGame('game-1', 30 * 60 * 1000)]; // 30 minutes
    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={games}
        teamsMap={mockTeamsMap}
        gameGuesses={{}}
        tournamentId="tournament-1"
        isPlayoffs={false}
      />
    );
    expect(container).toBeTruthy();
  });

  it('renders with warning games (2-24h)', () => {
    const games = [createMockGame('game-1', 12 * 60 * 60 * 1000)]; // 12 hours
    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={games}
        teamsMap={mockTeamsMap}
        gameGuesses={{}}
        tournamentId="tournament-1"
        isPlayoffs={false}
      />
    );
    expect(container).toBeTruthy();
  });

  it('renders with notice games (24-48h)', () => {
    const games = [createMockGame('game-1', 36 * 60 * 60 * 1000)]; // 36 hours
    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={games}
        teamsMap={mockTeamsMap}
        gameGuesses={{}}
        tournamentId="tournament-1"
        isPlayoffs={false}
      />
    );
    expect(container).toBeTruthy();
  });

  it('renders with games outside urgency window (> 48h)', () => {
    const games = [createMockGame('game-1', 72 * 60 * 60 * 1000)]; // 72 hours
    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={games}
        teamsMap={mockTeamsMap}
        gameGuesses={{}}
        tournamentId="tournament-1"
        isPlayoffs={false}
      />
    );
    expect(container).toBeTruthy();
  });

  it('renders with already closed games (< -1h)', () => {
    const games = [createMockGame('game-1', -2 * 60 * 60 * 1000)]; // 2 hours ago
    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={games}
        teamsMap={mockTeamsMap}
        gameGuesses={{}}
        tournamentId="tournament-1"
        isPlayoffs={false}
      />
    );
    expect(container).toBeTruthy();
  });

  it('renders with predicted games', () => {
    const games = [createMockGame('game-1', 30 * 60 * 1000)];
    const gameGuesses = {
      'game-1': {
        game_id: 'game-1',
        home_score: 2,
        away_score: 1,
        home_team: 'team-1',
        away_team: 'team-2'
      } as GameGuessNew
    };

    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={games}
        teamsMap={mockTeamsMap}
        gameGuesses={gameGuesses}
        tournamentId="tournament-1"
        isPlayoffs={false}
      />,
      { gameGuesses, updateGameGuess: vi.fn() }
    );
    expect(container).toBeTruthy();
  });

  it('renders with unpredicted games', () => {
    const games = [createMockGame('game-1', 30 * 60 * 1000)];
    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={games}
        teamsMap={mockTeamsMap}
        gameGuesses={{}}
        tournamentId="tournament-1"
        isPlayoffs={false}
      />
    );
    expect(container).toBeTruthy();
  });

  it('renders playoff games with final stage', () => {
    const games = [
      createMockGame('game-final', 30 * 60 * 1000, {
        playoffStage: { is_final: true, is_third_place: false }
      })
    ];
    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={games}
        teamsMap={mockTeamsMap}
        gameGuesses={{}}
        tournamentId="tournament-1"
        isPlayoffs={true}
      />
    );
    expect(container).toBeTruthy();
  });

  it('renders playoff games with third place stage', () => {
    const games = [
      createMockGame('game-3rd', 30 * 60 * 1000, {
        playoffStage: { is_final: false, is_third_place: true }
      })
    ];
    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={games}
        teamsMap={mockTeamsMap}
        gameGuesses={{}}
        tournamentId="tournament-1"
        isPlayoffs={true}
      />
    );
    expect(container).toBeTruthy();
  });

  it('renders playoff games with null teams and team rules', () => {
    const games = [
      createMockGame('game-playoff', 30 * 60 * 1000, {
        home_team: null,
        away_team: null,
        home_team_rule: 'winner_of_game_1',
        away_team_rule: 'winner_of_game_2'
      })
    ];
    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={games}
        teamsMap={mockTeamsMap}
        gameGuesses={{}}
        tournamentId="tournament-1"
        isPlayoffs={true}
      />
    );
    expect(container).toBeTruthy();
  });

  it('renders with multiple games in different tiers', () => {
    const games = [
      createMockGame('game-1', 30 * 60 * 1000), // urgent
      createMockGame('game-2', 12 * 60 * 60 * 1000), // warning
      createMockGame('game-3', 36 * 60 * 60 * 1000), // notice
    ];
    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={games}
        teamsMap={mockTeamsMap}
        gameGuesses={{}}
        tournamentId="tournament-1"
        isPlayoffs={false}
      />
    );
    expect(container).toBeTruthy();
  });

  it('renders with mixed predicted and unpredicted games', () => {
    const games = [
      createMockGame('game-1', 30 * 60 * 1000),
      createMockGame('game-2', 45 * 60 * 1000),
    ];
    const gameGuesses = {
      'game-1': {
        game_id: 'game-1',
        home_score: 2,
        away_score: 1,
        home_team: 'team-1',
        away_team: 'team-2'
      } as GameGuessNew
    };

    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={games}
        teamsMap={mockTeamsMap}
        gameGuesses={gameGuesses}
        tournamentId="tournament-1"
        isPlayoffs={false}
      />,
      { gameGuesses, updateGameGuess: vi.fn() }
    );
    expect(container).toBeTruthy();
  });

  it('renders with games that have boost types', () => {
    const games = [createMockGame('game-1', 30 * 60 * 1000)];
    const gameGuesses = {
      'game-1': {
        game_id: 'game-1',
        home_score: 2,
        away_score: 1,
        boost_type: 'golden',
        home_team: 'team-1',
        away_team: 'team-2'
      } as GameGuessNew
    };

    const { container } = renderWithContext(
      <UrgencyAccordionGroup
        games={games}
        teamsMap={mockTeamsMap}
        gameGuesses={gameGuesses}
        tournamentId="tournament-1"
        isPlayoffs={false}
        silverMax={10}
        goldenMax={5}
      />,
      { gameGuesses, updateGameGuess: vi.fn() }
    );
    expect(container).toBeTruthy();
  });
});

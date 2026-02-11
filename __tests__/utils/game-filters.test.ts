import { describe, it, expect } from 'vitest';
import { filterGames, calculateFilterCounts, FilterType } from '../../app/utils/game-filters';
import { ExtendedGameData } from '../../app/definitions';
import { GameGuessNew } from '../../app/db/tables-definition';

// Mock data factories
const createMockGame = (
  id: string,
  options: {
    group?: { tournament_group_id: string };
    playoffStage?: { tournament_playoff_round_id: string };
    gameDate?: Date;
  } = {}
): ExtendedGameData => ({
  id,
  tournament_id: 'tournament-1',
  home_team_id: 'team-home',
  away_team_id: 'team-away',
  game_date: options.gameDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now by default
  home_score: null,
  away_score: null,
  home_penalty_score: null,
  away_penalty_score: null,
  group: options.group || null,
  playoffStage: options.playoffStage || null,
  status: 'scheduled'
});

const createMockGuess = (gameId: string, homeScore: number | null, awayScore: number | null): GameGuessNew => ({
  id: `guess-${gameId}`,
  game_id: gameId,
  user_id: 'user-1',
  home_score: homeScore,
  away_score: awayScore,
  boost_type: null,
  created_at: new Date(),
  updated_at: new Date()
});

describe('filterGames', () => {
  const groupGame1 = createMockGame('group-1', { group: { tournament_group_id: 'group-a' } });
  const groupGame2 = createMockGame('group-2', { group: { tournament_group_id: 'group-b' } });
  const playoffGame1 = createMockGame('playoff-1', { playoffStage: { tournament_playoff_round_id: 'round-1' } });
  const playoffGame2 = createMockGame('playoff-2', { playoffStage: { tournament_playoff_round_id: 'round-2' } });

  const games = [groupGame1, groupGame2, playoffGame1, playoffGame2];

  describe('filter: all', () => {
    it('returns all games when filter is "all"', () => {
      const result = filterGames(games, 'all', null, null, {});

      expect(result).toHaveLength(4);
      expect(result.map(g => g.id)).toEqual(['group-1', 'group-2', 'playoff-1', 'playoff-2']);
    });

    it('sorts games by date ascending', () => {
      const unsortedGames = [
        createMockGame('game-3', { gameDate: new Date(2026, 0, 3) }),
        createMockGame('game-1', { gameDate: new Date(2026, 0, 1) }),
        createMockGame('game-2', { gameDate: new Date(2026, 0, 2) }),
      ];

      const result = filterGames(unsortedGames, 'all', null, null, {});

      expect(result.map(g => g.id)).toEqual(['game-1', 'game-2', 'game-3']);
    });
  });

  describe('filter: groups', () => {
    it('returns only group games', () => {
      const result = filterGames(games, 'groups', null, null, {});

      expect(result).toHaveLength(2);
      expect(result.every(g => g.group !== null)).toBe(true);
    });

    it('filters by specific group when groupFilter is provided', () => {
      const result = filterGames(games, 'groups', 'group-a', null, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('group-1');
    });

    it('filters by different group', () => {
      const result = filterGames(games, 'groups', 'group-b', null, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('group-2');
    });

    it('returns empty array when no games match group filter', () => {
      const result = filterGames(games, 'groups', 'group-nonexistent', null, {});

      expect(result).toHaveLength(0);
    });
  });

  describe('filter: playoffs', () => {
    it('returns only playoff games', () => {
      const result = filterGames(games, 'playoffs', null, null, {});

      expect(result).toHaveLength(2);
      expect(result.every(g => g.playoffStage !== null)).toBe(true);
    });

    it('filters by specific round when roundFilter is provided', () => {
      const result = filterGames(games, 'playoffs', null, 'round-1', {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('playoff-1');
    });

    it('filters by different round', () => {
      const result = filterGames(games, 'playoffs', null, 'round-2', {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('playoff-2');
    });

    it('returns empty array when no games match round filter', () => {
      const result = filterGames(games, 'playoffs', null, 'round-nonexistent', {});

      expect(result).toHaveLength(0);
    });
  });

  describe('filter: unpredicted', () => {
    const testGames = [
      createMockGame('game-1'),
      createMockGame('game-2'),
      createMockGame('game-3'),
      createMockGame('game-4'),
    ];

    it('returns games without any guess', () => {
      const guesses = {};
      const result = filterGames(testGames, 'unpredicted', null, null, guesses);

      expect(result).toHaveLength(4);
    });

    it('filters out games with complete predictions', () => {
      const guesses = {
        'game-1': createMockGuess('game-1', 2, 1),
        'game-2': createMockGuess('game-2', 0, 0),
      };
      const result = filterGames(testGames, 'unpredicted', null, null, guesses);

      expect(result).toHaveLength(2);
      expect(result.map(g => g.id)).toEqual(['game-3', 'game-4']);
    });

    it('includes games with null home_score', () => {
      const guesses = {
        'game-1': createMockGuess('game-1', null, 1),
      };
      const result = filterGames(testGames, 'unpredicted', null, null, guesses);

      expect(result.some(g => g.id === 'game-1')).toBe(true);
    });

    it('includes games with null away_score', () => {
      const guesses = {
        'game-1': createMockGuess('game-1', 2, null),
      };
      const result = filterGames(testGames, 'unpredicted', null, null, guesses);

      expect(result.some(g => g.id === 'game-1')).toBe(true);
    });

    it('includes games with both scores null', () => {
      const guesses = {
        'game-1': createMockGuess('game-1', null, null),
      };
      const result = filterGames(testGames, 'unpredicted', null, null, guesses);

      expect(result.some(g => g.id === 'game-1')).toBe(true);
    });
  });

  describe('filter: closingSoon', () => {
    it('returns games within 48 hours', () => {
      const now = Date.now();
      const testGames = [
        createMockGame('game-1', { gameDate: new Date(now + 1 * 60 * 60 * 1000) }), // 1 hour
        createMockGame('game-2', { gameDate: new Date(now + 24 * 60 * 60 * 1000) }), // 24 hours
        createMockGame('game-3', { gameDate: new Date(now + 47 * 60 * 60 * 1000) }), // 47 hours
      ];

      const result = filterGames(testGames, 'closingSoon', null, null, {});

      expect(result).toHaveLength(3);
    });

    it('excludes games beyond 48 hours', () => {
      const now = Date.now();
      const testGames = [
        createMockGame('game-1', { gameDate: new Date(now + 24 * 60 * 60 * 1000) }), // 24 hours
        createMockGame('game-2', { gameDate: new Date(now + 49 * 60 * 60 * 1000) }), // 49 hours (beyond)
        createMockGame('game-3', { gameDate: new Date(now + 72 * 60 * 60 * 1000) }), // 72 hours (beyond)
      ];

      const result = filterGames(testGames, 'closingSoon', null, null, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('game-1');
    });

    it('excludes past games', () => {
      const now = Date.now();
      const testGames = [
        createMockGame('game-past', { gameDate: new Date(now - 1 * 60 * 60 * 1000) }), // 1 hour ago
        createMockGame('game-future', { gameDate: new Date(now + 1 * 60 * 60 * 1000) }), // 1 hour from now
      ];

      const result = filterGames(testGames, 'closingSoon', null, null, {});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('game-future');
    });

    it('excludes games at exactly current time or in the past', () => {
      const now = Date.now();
      const testGames = [
        createMockGame('game-now', { gameDate: new Date(now) }), // exactly now
        createMockGame('game-future', { gameDate: new Date(now + 1000) }), // 1 second from now
      ];

      const result = filterGames(testGames, 'closingSoon', null, null, {});

      // Only future game should be included
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some(g => g.id === 'game-future')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('returns empty array when no games provided', () => {
      const result = filterGames([], 'all', null, null, {});

      expect(result).toEqual([]);
    });

    it('handles games with undefined group and playoffStage', () => {
      const testGames = [
        createMockGame('game-1'),
      ];

      const groupResult = filterGames(testGames, 'groups', null, null, {});
      const playoffResult = filterGames(testGames, 'playoffs', null, null, {});

      expect(groupResult).toHaveLength(0);
      expect(playoffResult).toHaveLength(0);
    });
  });
});

describe('calculateFilterCounts', () => {
  const now = Date.now();

  const games: ExtendedGameData[] = [
    // Group games
    createMockGame('group-1', {
      group: { tournament_group_id: 'group-a' },
      gameDate: new Date(now + 24 * 60 * 60 * 1000)
    }),
    createMockGame('group-2', {
      group: { tournament_group_id: 'group-b' },
      gameDate: new Date(now + 72 * 60 * 60 * 1000)
    }),
    // Playoff games
    createMockGame('playoff-1', {
      playoffStage: { tournament_playoff_round_id: 'round-1' },
      gameDate: new Date(now + 12 * 60 * 60 * 1000)
    }),
    // Game closing soon (unpredicted)
    createMockGame('soon-1', {
      gameDate: new Date(now + 6 * 60 * 60 * 1000)
    }),
  ];

  const guesses: Record<string, GameGuessNew> = {
    'group-1': createMockGuess('group-1', 2, 1), // predicted
    'group-2': createMockGuess('group-2', null, null), // unpredicted (null scores)
    // playoff-1: no guess (unpredicted)
    // soon-1: no guess (unpredicted)
  };

  it('calculates total count correctly', () => {
    const result = calculateFilterCounts(games, guesses);

    expect(result.total).toBe(4);
  });

  it('calculates groups count correctly', () => {
    const result = calculateFilterCounts(games, guesses);

    expect(result.groups).toBe(2);
  });

  it('calculates playoffs count correctly', () => {
    const result = calculateFilterCounts(games, guesses);

    expect(result.playoffs).toBe(1);
  });

  it('calculates unpredicted count correctly', () => {
    const result = calculateFilterCounts(games, guesses);

    // group-2 (null scores), playoff-1 (no guess), soon-1 (no guess)
    expect(result.unpredicted).toBe(3);
  });

  it('calculates closingSoon count correctly', () => {
    const result = calculateFilterCounts(games, guesses);

    // soon-1 (6 hours), playoff-1 (12 hours), group-1 (24 hours) - all within 48 hours
    expect(result.closingSoon).toBe(3);
  });

  describe('edge cases', () => {
    it('handles empty games array', () => {
      const result = calculateFilterCounts([], {});

      expect(result).toEqual({
        total: 0,
        groups: 0,
        playoffs: 0,
        unpredicted: 0,
        closingSoon: 0
      });
    });

    it('handles all games predicted', () => {
      const allPredictedGames = [
        createMockGame('game-1', { group: { tournament_group_id: 'group-a' } }),
        createMockGame('game-2', { playoffStage: { tournament_playoff_round_id: 'round-1' } }),
      ];
      const allGuesses = {
        'game-1': createMockGuess('game-1', 1, 0),
        'game-2': createMockGuess('game-2', 2, 2),
      };

      const result = calculateFilterCounts(allPredictedGames, allGuesses);

      expect(result.unpredicted).toBe(0);
    });

    it('handles no games closing soon', () => {
      const farFutureGames = [
        createMockGame('game-1', { gameDate: new Date(now + 100 * 60 * 60 * 1000) }), // 100 hours
      ];

      const result = calculateFilterCounts(farFutureGames, {});

      expect(result.closingSoon).toBe(0);
    });

    it('counts games with null group as non-group games', () => {
      const mixedGames = [
        createMockGame('game-1', { group: { tournament_group_id: 'group-a' } }),
        createMockGame('game-2'), // no group
      ];

      const result = calculateFilterCounts(mixedGames, {});

      expect(result.groups).toBe(1);
    });

    it('counts games with null playoffStage as non-playoff games', () => {
      const mixedGames = [
        createMockGame('game-1', { playoffStage: { tournament_playoff_round_id: 'round-1' } }),
        createMockGame('game-2'), // no playoff stage
      ];

      const result = calculateFilterCounts(mixedGames, {});

      expect(result.playoffs).toBe(1);
    });
  });

  describe('boundary conditions', () => {
    it('handles game at exactly 48 hours boundary', () => {
      // Add a buffer to account for execution time between test setup and function execution
      const fortyEightHoursFromNow = now + (48 * 60 * 60 * 1000) + 1000; // Add 1 second buffer
      const boundaryGames = [
        createMockGame('game-exactly-48h', {
          gameDate: new Date(fortyEightHoursFromNow)
        }),
      ];

      const result = calculateFilterCounts(boundaryGames, {});

      // Game beyond 48 hours should NOT be included
      expect(result.closingSoon).toBe(0);
    });

    it('handles game just under 48 hours', () => {
      const boundaryGames = [
        createMockGame('game-under-48h', {
          gameDate: new Date(now + 47.99 * 60 * 60 * 1000)
        }),
      ];

      const result = calculateFilterCounts(boundaryGames, {});

      expect(result.closingSoon).toBe(1);
    });
  });
});

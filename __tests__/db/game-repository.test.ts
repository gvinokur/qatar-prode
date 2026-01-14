import { vi, describe, it, expect, beforeEach } from 'vitest';
import {
  findGameById,
  createGame,
  updateGame,
  deleteGame,
  findGamesInTournament,
  findFirstGameInTournament,
  findGamesInGroup,
  deleteAllGamesFromTournament,
  findAllGamesWithPublishedResultsAndGameGuesses,
  findGamesAroundCurrentTime,
  findGamesInNext24Hours,
} from '../../app/db/game-repository';
import { db } from '../../app/db/database';
import { testFactories } from './test-factories';
import { createMockSelectQuery, createMockDeleteQuery } from './mock-helpers';

// Mock the database
vi.mock('../../app/db/database', () => ({
  db: {
    selectFrom: vi.fn(),
    insertInto: vi.fn(),
    updateTable: vi.fn(),
    deleteFrom: vi.fn(),
  },
}));

// Mock base-repository
const mockBaseFunctions = vi.hoisted(() => ({
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
vi.mock('../../app/db/base-repository', () => ({
  createBaseFunctions: vi.fn(() => mockBaseFunctions),
}));

// Mock React cache
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    cache: vi.fn((fn) => fn),
  };
});

describe('Game Repository', () => {
  const mockDb = vi.mocked(db);
  const mockGame = testFactories.game();
  const mockGames = [
    testFactories.game({ id: 'game-1', game_number: 1 }),
    testFactories.game({ id: 'game-2', game_number: 2 }),
  ];

  const mockExtendedGame = {
    ...mockGame,
    group: { tournament_group_id: 'group-1', group_letter: 'A' },
    playoffStage: null,
    gameResult: { game_id: 'game-1', home_score: 2, away_score: 1, is_draft: false },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Base CRUD Functions', () => {
    describe('findGameById', () => {
      it('should call base findById function', async () => {
        mockBaseFunctions.findById.mockResolvedValue(mockGame);

        const result = await findGameById('game-1');

        expect(mockBaseFunctions.findById).toHaveBeenCalledWith('game-1');
        expect(result).toEqual(mockGame);
      });

      it('should return null when game not found', async () => {
        mockBaseFunctions.findById.mockResolvedValue(null);

        const result = await findGameById('nonexistent');

        expect(result).toBeNull();
      });
    });

    describe('createGame', () => {
      it('should call base create function', async () => {
        const newGame = testFactories.game({ game_number: 10 });
        mockBaseFunctions.create.mockResolvedValue(newGame);

        const gameData = {
          tournament_id: 'tournament-1',
          game_number: 10,
          home_team: 'team-1',
          away_team: 'team-2',
          game_date: new Date(),
          location: 'Stadium',
          game_type: 'group' as const,
          game_local_timezone: 'America/New_York',
        };

        const result = await createGame(gameData);

        expect(mockBaseFunctions.create).toHaveBeenCalledWith(gameData);
        expect(result).toEqual(newGame);
      });
    });

    describe('updateGame', () => {
      it('should call base update function', async () => {
        const updates = { home_team: 'new-team-1', away_team: 'new-team-2' };
        mockBaseFunctions.update.mockResolvedValue({ ...mockGame, ...updates });

        const result = await updateGame('game-1', updates);

        expect(mockBaseFunctions.update).toHaveBeenCalledWith('game-1', updates);
        expect(result.home_team).toBe('new-team-1');
      });
    });

    describe('deleteGame', () => {
      it('should call base delete function', async () => {
        mockBaseFunctions.delete.mockResolvedValue(mockGame);

        const result = await deleteGame('game-1');

        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('game-1');
        expect(result).toEqual(mockGame);
      });
    });
  });

  describe('Complex Query Functions', () => {
    describe('findGamesInTournament', () => {
      it('should find games with nested group, playoff, and result data', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([mockExtendedGame]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGamesInTournament('tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('games');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.select).toHaveBeenCalledWith(expect.any(Function));
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual([mockExtendedGame]);
      });

      it('should handle draftResult parameter', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([mockExtendedGame]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await findGamesInTournament('tournament-1', false);

        expect(mockQuery.select).toHaveBeenCalledWith(expect.any(Function));
      });

      it('should return empty array when tournament has no games', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGamesInTournament('empty-tournament');

        expect(result).toEqual([]);
      });
    });

    describe('findFirstGameInTournament', () => {
      it('should find first game ordered by date', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(mockGame),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findFirstGameInTournament('tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('games');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.orderBy).toHaveBeenCalledWith('game_date asc');
        expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
        expect(result).toEqual(mockGame);
      });

      it('should return undefined when tournament has no games', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          executeTakeFirst: vi.fn().mockResolvedValue(undefined),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findFirstGameInTournament('empty-tournament');

        expect(result).toBeUndefined();
      });
    });

    describe('findGamesInGroup', () => {
      it('should find games in group with basic data', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockGames),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGamesInGroup('group-1', false, false);

        expect(mockDb.selectFrom).toHaveBeenCalledWith('games');
        expect(mockQuery.innerJoin).toHaveBeenCalledWith('tournament_group_games', 'tournament_group_games.game_id', 'games.id');
        expect(mockQuery.selectAll).toHaveBeenCalledWith('games');
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_group_games.tournament_group_id', '=', 'group-1');
        expect(mockQuery.execute).toHaveBeenCalled();
        expect(result).toEqual(mockGames);
      });

      it('should find games with complete data when completeGame is true', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([mockExtendedGame]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGamesInGroup('group-1', true, false);

        expect(mockQuery.select).toHaveBeenCalledWith(expect.any(Function));
        expect(result).toEqual([mockExtendedGame]);
      });

      it('should handle draftResult parameter when completeGame is true', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([mockExtendedGame]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await findGamesInGroup('group-1', true, true);

        expect(mockQuery.select).toHaveBeenCalledWith(expect.any(Function));
      });

      it('should return empty array when group has no games', async () => {
        const mockQuery = {
          innerJoin: vi.fn().mockReturnThis(),
          selectAll: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGamesInGroup('empty-group');

        expect(result).toEqual([]);
      });
    });

    describe('findAllGamesWithPublishedResultsAndGameGuesses', () => {
      it('should find games with results and guesses using jsonObjectFrom and jsonArrayFrom', async () => {
        const mockGameWithResultAndGuesses = {
          ...mockGame,
          gameResult: { game_id: 'game-1', home_score: 2, away_score: 1 },
          gameGuesses: [
            { id: 'guess-1', user_id: 'user-1', game_id: 'game-1' },
            { id: 'guess-2', user_id: 'user-2', game_id: 'game-1' },
          ],
        };

        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([mockGameWithResultAndGuesses]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllGamesWithPublishedResultsAndGameGuesses(false, false);

        expect(mockDb.selectFrom).toHaveBeenCalledWith('games');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.select).toHaveBeenCalledWith(expect.any(Function));
        expect(mockQuery.where).toHaveBeenCalledWith(expect.any(Function));
        expect(result).toEqual([mockGameWithResultAndGuesses]);
      });

      it('should handle forceDrafts parameter', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await findAllGamesWithPublishedResultsAndGameGuesses(true, false);

        expect(mockQuery.where).toHaveBeenCalledWith(expect.any(Function));
      });

      it('should handle forceAllGameGuesses parameter', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await findAllGamesWithPublishedResultsAndGameGuesses(false, true);

        expect(mockQuery.where).toHaveBeenCalledWith(expect.any(Function));
      });

      it('should return empty array when no games match criteria', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findAllGamesWithPublishedResultsAndGameGuesses(false, false);

        expect(result).toEqual([]);
      });
    });

    describe('findGamesAroundCurrentTime', () => {
      it('should find games sorted by date difference with SQL calculation', async () => {
        const gamesWithDateDiff = [
          { ...mockGames[0], datediff: 3600, group: null, playoffStage: null, gameResult: null },
          { ...mockGames[1], datediff: 7200, group: null, playoffStage: null, gameResult: null },
        ];

        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(gamesWithDateDiff),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGamesAroundCurrentTime('tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('games');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.select).toHaveBeenCalledWith(expect.any(Function));
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.orderBy).toHaveBeenCalledWith('datediff asc');
        expect(mockQuery.limit).toHaveBeenCalledWith(5);
        expect(result).toHaveLength(2);
      });

      it('should sort results by game_date after SQL ordering', async () => {
        const game1 = { ...mockGames[0], game_date: new Date('2024-06-15'), datediff: 3600 };
        const game2 = { ...mockGames[1], game_date: new Date('2024-06-14'), datediff: 7200 };

        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([game1, game2]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGamesAroundCurrentTime('tournament-1');

        // Should be sorted by game_date (game2 before game1)
        expect(result[0].game_date.getTime()).toBeLessThan(result[1].game_date.getTime());
      });

      it('should return empty array when no games in tournament', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGamesAroundCurrentTime('empty-tournament');

        expect(result).toEqual([]);
      });
    });

    describe('findGamesInNext24Hours', () => {
      it('should find games within 24 hour window', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockGames),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGamesInNext24Hours('tournament-1');

        expect(mockDb.selectFrom).toHaveBeenCalledWith('games');
        expect(mockQuery.selectAll).toHaveBeenCalled();
        expect(mockQuery.select).toHaveBeenCalledWith(expect.any(Function));
        expect(mockQuery.where).toHaveBeenCalledWith('tournament_id', '=', 'tournament-1');
        expect(mockQuery.where).toHaveBeenCalledWith('game_date', '>=', expect.any(Date));
        expect(mockQuery.where).toHaveBeenCalledWith('game_date', '<=', expect.any(Date));
        expect(mockQuery.orderBy).toHaveBeenCalledWith('game_date', 'asc');
        expect(result).toEqual(mockGames);
      });

      it('should calculate 24 hour window from current time', async () => {
        const beforeTime = Date.now();

        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        await findGamesInNext24Hours('tournament-1');

        const afterTime = Date.now();

        // Verify where was called with date filters
        expect(mockQuery.where).toHaveBeenCalledTimes(3); // tournament_id, >= now, <= tomorrow
      });

      it('should return empty array when no games in next 24 hours', async () => {
        const mockQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          orderBy: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValue(mockQuery as any);

        const result = await findGamesInNext24Hours('tournament-1');

        expect(result).toEqual([]);
      });
    });
  });

  describe('Delete Operations', () => {
    describe('deleteAllGamesFromTournament', () => {
      it('should cascade delete game associations and games', async () => {
        // Mock findGamesInTournament to return test games
        const mockFindQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockGames),
        };
        mockDb.selectFrom.mockReturnValueOnce(mockFindQuery as any);

        // Mock delete queries
        const mockDeleteQuery = createMockDeleteQuery([]);
        mockDb.deleteFrom.mockReturnValue(mockDeleteQuery as any);

        // Mock base delete function
        mockBaseFunctions.delete.mockResolvedValue(mockGame);

        await deleteAllGamesFromTournament('tournament-1');

        expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_playoff_round_games');
        expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournament_group_games');
        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('game-1');
        expect(mockBaseFunctions.delete).toHaveBeenCalledWith('game-2');
      });

      it('should handle tournament with no games', async () => {
        // Mock findGamesInTournament to return empty array
        const mockFindQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue([]),
        };
        mockDb.selectFrom.mockReturnValueOnce(mockFindQuery as any);

        const result = await deleteAllGamesFromTournament('empty-tournament');

        expect(mockDb.deleteFrom).not.toHaveBeenCalled();
        expect(mockBaseFunctions.delete).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      });

      it('should handle deletion errors', async () => {
        // Mock findGamesInTournament to return test games
        const mockFindQuery = {
          selectAll: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockResolvedValue(mockGames),
        };
        mockDb.selectFrom.mockReturnValueOnce(mockFindQuery as any);

        // Mock delete to throw error
        const mockDeleteQuery = {
          where: vi.fn().mockReturnThis(),
          execute: vi.fn().mockRejectedValue(new Error('Delete failed')),
        };
        mockDb.deleteFrom.mockReturnValue(mockDeleteQuery as any);

        await expect(deleteAllGamesFromTournament('tournament-1')).rejects.toThrow('Delete failed');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle database connection errors', async () => {
      vi.clearAllMocks();

      const mockQuery = {
        selectAll: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockRejectedValue(new Error('Connection lost')),
      };
      mockDb.selectFrom.mockReturnValueOnce(mockQuery as any);

      await expect(findGamesInTournament('tournament-1')).rejects.toThrow('Connection lost');
    });

    it('should handle games with null group and playoff stage', async () => {
      const gameWithNullNested = {
        ...mockGame,
        group: null,
        playoffStage: null,
        gameResult: null,
      };

      const mockQuery = {
        selectAll: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([gameWithNullNested]),
      };
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGamesInTournament('tournament-1');

      expect(result[0].group).toBeNull();
      expect(result[0].playoffStage).toBeNull();
    });

    it('should handle games with both group and playoff stage data', async () => {
      const gameWithBoth = {
        ...mockGame,
        group: { tournament_group_id: 'group-1', group_letter: 'A' },
        playoffStage: { tournament_playoff_round_id: 'round-1', round_name: 'Final', is_final: true },
        gameResult: null,
      };

      const mockQuery = {
        selectAll: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        execute: vi.fn().mockResolvedValue([gameWithBoth]),
      };
      mockDb.selectFrom.mockReturnValue(mockQuery as any);

      const result = await findGamesInTournament('tournament-1');

      expect(result[0].group).toBeDefined();
      expect(result[0].playoffStage).toBeDefined();
    });
  });
});

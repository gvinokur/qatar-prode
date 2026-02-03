import { vi } from 'vitest';

/**
 * Reusable mock builders for Kysely query chains.
 * These helpers reduce boilerplate when testing database repositories.
 *
 * Usage:
 * ```typescript
 * const mockQuery = createMockSelectQuery([mockTournament]);
 * mockDb.selectFrom.mockReturnValue(mockQuery);
 *
 * await findTournaments();
 *
 * expect(mockQuery.execute).toHaveBeenCalled();
 * ```
 */

/**
 * Creates a complete mock for SELECT queries that return data.
 *
 * Automatically creates a full Kysely query chain including:
 * - Filtering: where, distinct, distinctOn
 * - Joins: innerJoin, leftJoin, rightJoin, fullJoin
 * - Ordering: orderBy, groupBy, limit, offset
 * - Locking: forUpdate, forNoKeyUpdate, forShare, forKeyShare
 * - Execution: execute, executeTakeFirst, executeTakeFirstOrThrow
 *
 * @template T - The type of data being queried
 * @param result - The data to return (single record or array). If array, execute() returns it as-is.
 *                 If single record, execute() wraps it in array, executeTakeFirst() returns it directly.
 * @returns Mock query object with all Kysely SELECT methods as chainable vi.fn() mocks
 *
 * @example
 * // Single result
 * const mockTournament = testFactories.tournament({ id: '1' });
 * const mockQuery = createMockSelectQuery(mockTournament);
 * mockDb.selectFrom.mockReturnValue(mockQuery);
 *
 * await tournamentRepository.findById('1');
 *
 * expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
 *
 * @example
 * // Multiple results
 * const tournaments = createMany(testFactories.tournament, 3);
 * const mockQuery = createMockSelectQuery(tournaments);
 * mockDb.selectFrom.mockReturnValue(mockQuery);
 *
 * const results = await tournamentRepository.findAll();
 * expect(results).toHaveLength(3);
 *
 * @see {@link createMockEmptyQuery} for queries returning empty arrays
 * @see {@link createMockNullQuery} for queries returning null
 * @see {@link createMockErrorQuery} for queries that throw errors
 */
export function createMockSelectQuery<T>(result: T | T[]) {
  return {
    where: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    rightJoin: vi.fn().mockReturnThis(),
    fullJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    groupBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    distinct: vi.fn().mockReturnThis(),
    distinctOn: vi.fn().mockReturnThis(),
    forUpdate: vi.fn().mockReturnThis(),
    forNoKeyUpdate: vi.fn().mockReturnThis(),
    forShare: vi.fn().mockReturnThis(),
    forKeyShare: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(Array.isArray(result) ? result : [result]),
    executeTakeFirst: vi.fn().mockResolvedValue(Array.isArray(result) ? result[0] : result),
    executeTakeFirstOrThrow: vi.fn().mockResolvedValue(Array.isArray(result) ? result[0] : result),
  };
}

/**
 * Creates a complete mock for INSERT queries that return the created record.
 *
 * Automatically creates a full Kysely INSERT chain including:
 * - values, returningAll, returning
 * - onConflict, ignore, doNothing, doUpdateSet
 * - execute, executeTakeFirst, executeTakeFirstOrThrow
 *
 * @template T - The type of record being inserted
 * @param result - The inserted record to return from execute/executeTakeFirst
 * @returns Mock query object with all Kysely INSERT methods as chainable vi.fn() mocks
 *
 * @example
 * const newTournament = { long_name: 'New Tournament', short_name: 'NEW' };
 * const createdTournament = testFactories.tournament(newTournament);
 * const mockQuery = createMockInsertQuery(createdTournament);
 * mockDb.insertInto.mockReturnValue(mockQuery);
 *
 * const result = await tournamentRepository.create(newTournament);
 *
 * expect(result).toEqual(createdTournament);
 * expect(mockQuery.values).toHaveBeenCalledWith(expect.objectContaining(newTournament));
 */
export function createMockInsertQuery<T>(result: T) {
  return {
    values: vi.fn().mockReturnThis(),
    returningAll: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    onConflict: vi.fn().mockReturnThis(),
    ignore: vi.fn().mockReturnThis(),
    doNothing: vi.fn().mockReturnThis(),
    doUpdateSet: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue([result]),
    executeTakeFirst: vi.fn().mockResolvedValue(result),
    executeTakeFirstOrThrow: vi.fn().mockResolvedValue(result),
  };
}

/**
 * Creates a complete mock for UPDATE queries that return updated record(s).
 *
 * Automatically creates a full Kysely UPDATE chain including:
 * - set, where, returningAll, returning
 * - from, innerJoin, leftJoin
 * - execute, executeTakeFirst, executeTakeFirstOrThrow
 *
 * @template T - The type of record being updated
 * @param result - The updated record(s) to return. Can be single record or array.
 * @returns Mock query object with all Kysely UPDATE methods as chainable vi.fn() mocks
 *
 * @example
 * const updates = { long_name: 'Updated Tournament' };
 * const updatedTournament = testFactories.tournament({ id: '1', ...updates });
 * const mockQuery = createMockUpdateQuery(updatedTournament);
 * mockDb.updateTable.mockReturnValue(mockQuery);
 *
 * const result = await tournamentRepository.update('1', updates);
 *
 * expect(result).toEqual(updatedTournament);
 * expect(mockQuery.set).toHaveBeenCalledWith(updates);
 * expect(mockQuery.where).toHaveBeenCalledWith('id', '=', '1');
 */
export function createMockUpdateQuery<T>(result: T | T[]) {
  return {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returningAll: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(Array.isArray(result) ? result : [result]),
    executeTakeFirst: vi.fn().mockResolvedValue(Array.isArray(result) ? result[0] : result),
    executeTakeFirstOrThrow: vi.fn().mockResolvedValue(Array.isArray(result) ? result[0] : result),
  };
}

/**
 * Creates a complete mock for DELETE queries that return deleted record(s).
 *
 * Automatically creates a full Kysely DELETE chain including:
 * - where, using, returningAll, returning
 * - execute, executeTakeFirst, executeTakeFirstOrThrow
 *
 * @template T - The type of record being deleted
 * @param result - The deleted record(s) to return. Can be single record or array.
 * @returns Mock query object with all Kysely DELETE methods as chainable vi.fn() mocks
 *
 * @example
 * const deletedTournament = testFactories.tournament({ id: '1' });
 * const mockQuery = createMockDeleteQuery(deletedTournament);
 * mockDb.deleteFrom.mockReturnValue(mockQuery);
 *
 * const result = await tournamentRepository.delete('1');
 *
 * expect(result).toEqual(deletedTournament);
 * expect(mockQuery.where).toHaveBeenCalledWith('id', '=', '1');
 */
export function createMockDeleteQuery<T>(result: T | T[]) {
  return {
    where: vi.fn().mockReturnThis(),
    using: vi.fn().mockReturnThis(),
    returningAll: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue(Array.isArray(result) ? result : [result]),
    executeTakeFirst: vi.fn().mockResolvedValue(Array.isArray(result) ? result[0] : result),
    executeTakeFirstOrThrow: vi.fn().mockResolvedValue(Array.isArray(result) ? result[0] : result),
  };
}

/**
 * Creates a mock SELECT query that returns an empty array (no results).
 *
 * Convenience wrapper around `createMockSelectQuery([])` that makes intent clearer.
 *
 * @returns Mock query object that returns empty array from execute()
 *
 * @example
 * const mockQuery = createMockEmptyQuery();
 * mockDb.selectFrom.mockReturnValue(mockQuery);
 *
 * const results = await tournamentRepository.findAll();
 *
 * expect(results).toEqual([]);
 * expect(results).toHaveLength(0);
 *
 * @see {@link createMockSelectQuery} for the underlying implementation
 * @see {@link createMockNullQuery} for queries returning null instead of empty array
 */
export function createMockEmptyQuery() {
  return createMockSelectQuery([]);
}

/**
 * Creates a mock SELECT query that returns null (no single result found).
 *
 * Use for testing `executeTakeFirst()` scenarios where a record doesn't exist.
 * Different from `createMockEmptyQuery()` which returns empty array for `execute()`.
 *
 * @returns Mock query object that returns null from executeTakeFirst()
 *
 * @example
 * const mockQuery = createMockNullQuery();
 * mockDb.selectFrom.mockReturnValue(mockQuery);
 *
 * const result = await tournamentRepository.findById('non-existent');
 *
 * expect(result).toBeNull();
 *
 * @see {@link createMockEmptyQuery} for queries returning empty arrays
 * @see {@link createMockSelectQuery} for queries returning data
 */
export function createMockNullQuery() {
  return {
    ...createMockSelectQuery(null),
    executeTakeFirst: vi.fn().mockResolvedValue(null),
  };
}

/**
 * Creates a mock query that throws an error when executed.
 *
 * Use for testing error handling, connection failures, constraint violations,
 * and other database error scenarios.
 *
 * @param error - Optional custom error to throw. Defaults to generic "Database query failed" error.
 * @returns Mock query object that rejects with error on execute/executeTakeFirst/executeTakeFirstOrThrow
 *
 * @example
 * // Generic error
 * const mockQuery = createMockErrorQuery();
 * mockDb.selectFrom.mockReturnValue(mockQuery);
 *
 * await expect(tournamentRepository.findById('1')).rejects.toThrow('Database query failed');
 *
 * @example
 * // Custom error
 * const mockQuery = createMockErrorQuery(new Error('Connection timeout'));
 * mockDb.selectFrom.mockReturnValue(mockQuery);
 *
 * await expect(tournamentRepository.findById('1')).rejects.toThrow('Connection timeout');
 *
 * @example
 * // Testing error recovery/retry logic
 * mockDb.selectFrom
 *   .mockReturnValueOnce(createMockErrorQuery(new Error('Temporary failure')))
 *   .mockReturnValueOnce(createMockSelectQuery(mockTournament));
 *
 * const result = await tournamentRepositoryWithRetry.findById('1');
 * expect(result).toEqual(mockTournament);
 */
export function createMockErrorQuery(error?: Error) {
  const defaultError = error || new Error('Database query failed');
  return {
    where: vi.fn().mockReturnThis(),
    selectAll: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    execute: vi.fn().mockRejectedValue(defaultError),
    executeTakeFirst: vi.fn().mockRejectedValue(defaultError),
    executeTakeFirstOrThrow: vi.fn().mockRejectedValue(defaultError),
  };
}

/**
 * Creates a complete database mock with all CRUD operations pre-configured.
 *
 * Returns a mock object with selectFrom, insertInto, updateTable, and deleteFrom methods.
 * Each method returns appropriate query mocks with default behavior:
 * - selectFrom: Returns empty array
 * - insertInto: Returns { id: 'mock-id' }
 * - updateTable: Returns { id: 'mock-id' }
 * - deleteFrom: Returns { id: 'mock-id' }
 *
 * Override specific operations as needed by mocking the methods.
 *
 * @returns Mock database object with all CRUD methods
 *
 * @example
 * const mockDb = createMockDatabase();
 *
 * // Override specific operations
 * const mockTournaments = [testFactories.tournament()];
 * mockDb.selectFrom.mockReturnValue(createMockSelectQuery(mockTournaments));
 *
 * // Test code that uses multiple query types
 * await complexRepository.performOperation();
 *
 * expect(mockDb.selectFrom).toHaveBeenCalled();
 * expect(mockDb.insertInto).toHaveBeenCalled();
 *
 * @see {@link createMockSelectQuery} for customizing SELECT behavior
 * @see {@link createMockInsertQuery} for customizing INSERT behavior
 * @see {@link createMockUpdateQuery} for customizing UPDATE behavior
 * @see {@link createMockDeleteQuery} for customizing DELETE behavior
 */
export function createMockDatabase() {
  return {
    selectFrom: vi.fn(() => createMockSelectQuery([])),
    insertInto: vi.fn(() => createMockInsertQuery({ id: 'mock-id' })),
    updateTable: vi.fn(() => createMockUpdateQuery({ id: 'mock-id' })),
    deleteFrom: vi.fn(() => createMockDeleteQuery({ id: 'mock-id' })),
  };
}

/**
 * Creates mock implementations of base repository CRUD functions.
 *
 * Useful for mocking repository dependencies in higher-level code (services, actions)
 * without mocking the entire database layer.
 *
 * @template T - The type of entity the repository handles
 * @param defaultResult - Optional default value to return from all methods. If not provided,
 *                        findById returns null, other methods return { id: 'mock-id' }
 * @returns Mock object with findById, create, update, and delete functions
 *
 * @example
 * const mockTournament = testFactories.tournament();
 * const mockRepo = createMockBaseFunctions(mockTournament);
 *
 * const service = new TournamentService(mockRepo);
 * const result = await service.getTournament('1');
 *
 * expect(mockRepo.findById).toHaveBeenCalledWith('1');
 * expect(result).toEqual(mockTournament);
 *
 * @example
 * // Without default result
 * const mockRepo = createMockBaseFunctions();
 *
 * // findById returns null by default
 * expect(await mockRepo.findById('1')).toBeNull();
 *
 * // Other methods return { id: 'mock-id' }
 * expect(await mockRepo.create({})).toEqual({ id: 'mock-id' });
 */
export function createMockBaseFunctions<T>(defaultResult?: T) {
  return {
    findById: vi.fn().mockResolvedValue(defaultResult || null),
    create: vi.fn().mockResolvedValue(defaultResult || { id: 'mock-id' }),
    update: vi.fn().mockResolvedValue(defaultResult || { id: 'mock-id' }),
    delete: vi.fn().mockResolvedValue(defaultResult || { id: 'mock-id' }),
  };
}

/**
 * Fluent assertion builder for verifying Kysely database calls.
 *
 * Provides chainable methods to verify that database and query methods were called
 * with expected arguments. More readable than using `expect(...).toHaveBeenCalledWith(...)`
 * for multiple chained calls.
 *
 * @param mockDb - The mocked database object (typically the result of vi.mocked(db))
 * @param mockQuery - The mocked query object (result of createMockSelectQuery, etc.)
 * @returns Chainable assertion object with verification methods
 *
 * @example
 * // Verify simple SELECT query
 * const mockQuery = createMockSelectQuery([mockUser]);
 * mockDb.selectFrom.mockReturnValue(mockQuery);
 *
 * await userRepository.findById('user-1');
 *
 * expectKyselyQuery(mockDb, mockQuery)
 *   .toHaveCalledSelectFrom('users')
 *   .toHaveCalledWhere('id', '=', 'user-1')
 *   .toHaveCalledExecuteTakeFirst();
 *
 * @example
 * // Verify complex query with joins
 * const mockQuery = createMockSelectQuery([mockGameWithTeams]);
 * mockDb.selectFrom.mockReturnValue(mockQuery);
 *
 * await gameRepository.findWithTeams('game-1');
 *
 * expectKyselyQuery(mockDb, mockQuery)
 *   .toHaveCalledSelectFrom('games')
 *   .toHaveCalledInnerJoin('teams as home_team', 'games.home_team', 'home_team.id')
 *   .toHaveCalledInnerJoin('teams as away_team', 'games.away_team', 'away_team.id')
 *   .toHaveCalledWhere('games.id', '=', 'game-1')
 *   .toHaveCalledOrderBy('games.game_date', 'asc')
 *   .toHaveCalledExecuteTakeFirst();
 *
 * @example
 * // Verify INSERT
 * const mockQuery = createMockInsertQuery(mockTournament);
 * mockDb.insertInto.mockReturnValue(mockQuery);
 *
 * await tournamentRepository.create(mockTournament);
 *
 * expectKyselyQuery(mockDb, mockQuery)
 *   .toHaveCalledInsertInto('tournaments');
 */
export function expectKyselyQuery(mockDb: any, mockQuery: any) {
  return {
    toHaveCalledSelectFrom(tableName: string) {
      expect(mockDb.selectFrom).toHaveBeenCalledWith(tableName);
      return this;
    },
    toHaveCalledInsertInto(tableName: string) {
      expect(mockDb.insertInto).toHaveBeenCalledWith(tableName);
      return this;
    },
    toHaveCalledUpdateTable(tableName: string) {
      expect(mockDb.updateTable).toHaveBeenCalledWith(tableName);
      return this;
    },
    toHaveCalledDeleteFrom(tableName: string) {
      expect(mockDb.deleteFrom).toHaveBeenCalledWith(tableName);
      return this;
    },
    toHaveCalledWhere(...args: any[]) {
      expect(mockQuery.where).toHaveBeenCalledWith(...args);
      return this;
    },
    toHaveCalledInnerJoin(...args: any[]) {
      expect(mockQuery.innerJoin).toHaveBeenCalledWith(...args);
      return this;
    },
    toHaveCalledLeftJoin(...args: any[]) {
      expect(mockQuery.leftJoin).toHaveBeenCalledWith(...args);
      return this;
    },
    toHaveCalledOrderBy(...args: any[]) {
      expect(mockQuery.orderBy).toHaveBeenCalledWith(...args);
      return this;
    },
    toHaveCalledGroupBy(...args: any[]) {
      expect(mockQuery.groupBy).toHaveBeenCalledWith(...args);
      return this;
    },
    toHaveCalledLimit(limit: number) {
      expect(mockQuery.limit).toHaveBeenCalledWith(limit);
      return this;
    },
    toHaveCalledExecute() {
      expect(mockQuery.execute).toHaveBeenCalled();
      return this;
    },
    toHaveCalledExecuteTakeFirst() {
      expect(mockQuery.executeTakeFirst).toHaveBeenCalled();
      return this;
    },
    toHaveCalledExecuteTakeFirstOrThrow() {
      expect(mockQuery.executeTakeFirstOrThrow).toHaveBeenCalled();
      return this;
    },
  };
}

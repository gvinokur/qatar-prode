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
 * Creates a mock for SELECT queries with full method chain support
 *
 * @param result - The data to return from execute/executeTakeFirst
 * @returns Mock query object with chainable methods
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
 * Creates a mock for INSERT queries with full method chain support
 *
 * @param result - The inserted record to return
 * @returns Mock query object with chainable methods
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
 * Creates a mock for UPDATE queries with full method chain support
 *
 * @param result - The updated record to return
 * @returns Mock query object with chainable methods
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
 * Creates a mock for DELETE queries with full method chain support
 *
 * @param result - The deleted record to return
 * @returns Mock query object with chainable methods
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
 * Creates a mock query that returns an empty array (no results)
 */
export function createMockEmptyQuery() {
  return createMockSelectQuery([]);
}

/**
 * Creates a mock query that returns null (no single result)
 */
export function createMockNullQuery() {
  return {
    ...createMockSelectQuery(null),
    executeTakeFirst: vi.fn().mockResolvedValue(null),
  };
}

/**
 * Creates a mock query that throws an error
 *
 * @param error - The error to throw (default: generic database error)
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
 * Creates a complete database mock with all CRUD operations
 *
 * Useful for tests that need to mock multiple query types
 *
 * @returns Mock database object
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
 * Helper to create a mock for base repository functions
 *
 * @returns Mock base functions (findById, create, update, delete)
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
 * Helper to verify that a mock was called with specific Kysely method calls
 *
 * Usage:
 * ```typescript
 * const mockQuery = createMockSelectQuery([mockTeam]);
 * mockDb.selectFrom.mockReturnValue(mockQuery);
 *
 * await findTeamById('team-1');
 *
 * expectKyselyQuery(mockDb, mockQuery)
 *   .toHaveCalledSelectFrom('teams')
 *   .toHaveCalledWhere('id', '=', 'team-1')
 *   .toHaveCalledExecuteTakeFirst();
 * ```
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

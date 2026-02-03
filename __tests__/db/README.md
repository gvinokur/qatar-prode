# Database Testing Utilities

Complete guide to testing utilities for mocking Kysely database queries and creating test data.

## Table of Contents

- [Overview](#overview)
- [Quick Reference](#quick-reference)
- [Mock Helpers (`mock-helpers.ts`)](#mock-helpers-mock-helpersts)
  - [SELECT Queries](#select-queries)
  - [INSERT Queries](#insert-queries)
  - [UPDATE Queries](#update-queries)
  - [DELETE Queries](#delete-queries)
  - [Complete Mocks](#complete-mocks)
  - [Assertions](#assertions)
- [Test Factories (`test-factories.ts`)](#test-factories-test-factoriests)
  - [Available Factories](#available-factories)
  - [Using Overrides](#using-overrides)
  - [Bulk Creation](#bulk-creation)
- [Integration Test Helpers](#integration-test-helpers)
  - [Setup Helpers](#setup-helpers)
  - [Auth Mocks](#auth-mocks)
  - [Navigation Mocks](#navigation-mocks)
- [Common Patterns](#common-patterns)
- [Migration Guide](#migration-guide)
- [When to Use What](#when-to-use-what)
- [Troubleshooting](#troubleshooting)

---

## Overview

This directory contains comprehensive testing utilities that simplify database testing in this codebase. These utilities help you write cleaner, more maintainable tests by providing:

### What's Available

**1. Mock Helpers** (`mock-helpers.ts`)
- **10 helper functions** for mocking Kysely database queries
- Complete mock implementations for SELECT, INSERT, UPDATE, DELETE operations
- Special helpers for empty results, null results, and error cases
- Fluent assertion builder for verifying database calls

**2. Test Factories** (`test-factories.ts`)
- **18+ type-safe factories** for creating test data
- Factories for all major domain entities (tournaments, users, teams, games, etc.)
- Override support for customizing specific properties
- Bulk creation helper for generating multiple instances

**3. Integration Test Helpers** (`__tests__/mocks/`)
- **setupTestMocks** - Orchestrates navigation, session, and auth mocks
- **Auth mocks** - Session and authentication utilities
- **Navigation mocks** - Router and search params for Next.js components

### Why Use These Utilities?

#### Before (Manual Mock Building)
```typescript
// Setting up a simple SELECT query mock - 8-10 lines
const mockExecuteTakeFirst = vi.fn().mockResolvedValue(mockTournament);
const mockSelectAll = vi.fn().mockReturnValue({
  executeTakeFirst: mockExecuteTakeFirst,
});
const mockWhere = vi.fn().mockReturnValue({
  selectAll: mockSelectAll,
});
mockDb.selectFrom.mockReturnValue({
  where: mockWhere,
} as any);
```

#### After (Using Helpers)
```typescript
// Same mock with helpers - 2 lines
const mockQuery = createMockSelectQuery(mockTournament);
mockDb.selectFrom.mockReturnValue(mockQuery);
```

**Benefits:**
- ✅ **Less boilerplate** - Reduce test code by 60-80%
- ✅ **Type safety** - Full TypeScript support with proper types
- ✅ **Consistency** - All tests use the same mocking patterns
- ✅ **Maintainability** - Update mock behavior in one place
- ✅ **Readability** - Tests focus on logic, not mock setup
- ✅ **Faster** - Write tests more quickly with less repetition

### Architecture

These utilities fit into the testing pyramid:

```
┌─────────────────────────────────┐
│   Integration Tests (Component) │  ← Uses setupTestMocks, factories
│   └─ setupTestMocks             │
│   └─ test factories              │
├─────────────────────────────────┤
│   Unit Tests (Repository)       │  ← Uses mock helpers, factories
│   └─ createMockSelectQuery      │
│   └─ expectKyselyQuery           │
│   └─ test factories              │
├─────────────────────────────────┤
│   E2E Tests                      │  ← Real database, no mocks
└─────────────────────────────────┘
```

**Testing Principles:**
- **Unit tests** mock the database layer using mock-helpers
- **Integration tests** mock external dependencies (auth, navigation) using integration helpers
- **Test data** always uses factories for consistency
- **Assertions** use expectKyselyQuery for fluent, readable verification

---

## Quick Reference

Common testing operations and their helpers:

| Task | Helper | Example |
|------|--------|---------|
| Mock SELECT returning data | `createMockSelectQuery` | `createMockSelectQuery(mockTournament)` |
| Mock SELECT returning empty | `createMockEmptyQuery` | `createMockEmptyQuery()` |
| Mock SELECT returning null | `createMockNullQuery` | `createMockNullQuery()` |
| Mock INSERT | `createMockInsertQuery` | `createMockInsertQuery(mockRecord)` |
| Mock UPDATE | `createMockUpdateQuery` | `createMockUpdateQuery(mockRecord)` |
| Mock DELETE | `createMockDeleteQuery` | `createMockDeleteQuery(mockRecord)` |
| Mock error case | `createMockErrorQuery` | `createMockErrorQuery(new Error('Failed'))` |
| Create test tournament | `testFactories.tournament` | `testFactories.tournament({ id: '1' })` |
| Create test user | `testFactories.user` | `testFactories.user({ email: 'test@example.com' })` |
| Create multiple entities | `createMany` | `createMany(testFactories.team, 4)` |
| Setup component mocks | `setupTestMocks` | `setupTestMocks({ session: true, navigation: true })` |
| Verify database calls | `expectKyselyQuery` | `expectKyselyQuery(mockDb, mockQuery).toHaveCalledSelectFrom('users')` |

---

## Mock Helpers (`mock-helpers.ts`)

Reusable mock builders for Kysely query chains that reduce boilerplate when testing database repositories.

### Helper Relationships

Understanding how the helpers work together:

- **Query-specific helpers** (`createMockSelectQuery`, `createMockInsertQuery`, etc.) create individual query mocks
- **Special query helpers** (`createMockEmptyQuery`, `createMockNullQuery`, `createMockErrorQuery`) are convenience wrappers around query mocks
- **Complete mock helper** (`createMockDatabase`) uses individual query helpers to create a full database mock
- **Assertion helper** (`expectKyselyQuery`) verifies calls on any query mock

```
createMockDatabase()
├─ Uses: createMockSelectQuery([])
├─ Uses: createMockInsertQuery({ id: 'mock' })
├─ Uses: createMockUpdateQuery({ id: 'mock' })
└─ Uses: createMockDeleteQuery({ id: 'mock' })

createMockEmptyQuery()
└─ Uses: createMockSelectQuery([])

createMockNullQuery()
└─ Uses: createMockSelectQuery(null) + custom executeTakeFirst

expectKyselyQuery()
└─ Works with: Any query mock
```

### SELECT Queries

#### `createMockSelectQuery<T>(result: T | T[])`

Creates a complete mock for SELECT queries that return data. Automatically creates a full Kysely query chain with all methods (where, select, join, orderBy, etc.).

**Use when:** Your repository method performs a SELECT and expects results.

**Example - Single Result:**
```typescript
import { createMockSelectQuery } from '@/__tests__/db/mock-helpers';
import { testFactories } from '@/__tests__/db/test-factories';

describe('TournamentRepository', () => {
  it('should find tournament by id', async () => {
    // Arrange
    const mockTournament = testFactories.tournament({ id: '1' });
    const mockQuery = createMockSelectQuery(mockTournament);
    mockDb.selectFrom.mockReturnValue(mockQuery);

    // Act
    const result = await tournamentRepository.findById('1');

    // Assert
    expect(result).toEqual(mockTournament);
    expect(mockDb.selectFrom).toHaveBeenCalledWith('tournaments');
  });
});
```

**Example - Multiple Results:**
```typescript
it('should find all active tournaments', async () => {
  const mockTournaments = createMany(testFactories.tournament, 3, (i) => ({
    id: `tournament-${i}`,
    is_active: true
  }));

  const mockQuery = createMockSelectQuery(mockTournaments);
  mockDb.selectFrom.mockReturnValue(mockQuery);

  const results = await tournamentRepository.findAll();

  expect(results).toHaveLength(3);
  expect(mockQuery.execute).toHaveBeenCalled();
});
```

**Before/After Comparison:**

**Before (manual chain - 8 lines):**
```typescript
const mockExecuteTakeFirst = vi.fn().mockResolvedValue(mockTournament);
const mockSelectAll = vi.fn().mockReturnValue({
  executeTakeFirst: mockExecuteTakeFirst,
});
const mockWhere = vi.fn().mockReturnValue({
  selectAll: mockSelectAll,
});
mockDb.selectFrom.mockReturnValue({
  where: mockWhere,
} as any);
```

**After (helper - 2 lines):**
```typescript
const mockQuery = createMockSelectQuery(mockTournament);
mockDb.selectFrom.mockReturnValue(mockQuery);
```

**What it mocks:**
All Kysely SELECT query methods: `where`, `select`, `selectAll`, `innerJoin`, `leftJoin`, `rightJoin`, `fullJoin`, `orderBy`, `groupBy`, `limit`, `offset`, `distinct`, `execute`, `executeTakeFirst`, `executeTakeFirstOrThrow`

---

#### `createMockEmptyQuery()`

Creates a mock query that returns an empty array (no results).

**Use when:** Testing scenarios where no records are found.

**Example:**
```typescript
it('should return empty array when no tournaments exist', async () => {
  const mockQuery = createMockEmptyQuery();
  mockDb.selectFrom.mockReturnValue(mockQuery);

  const results = await tournamentRepository.findAll();

  expect(results).toEqual([]);
  expect(results).toHaveLength(0);
});
```

**Why not just use `createMockSelectQuery([])`?**

You can! `createMockEmptyQuery()` is a convenience wrapper that makes intent clearer:

```typescript
// Both are equivalent
const mockQuery = createMockEmptyQuery();
const mockQuery = createMockSelectQuery([]);

// But createMockEmptyQuery() is more explicit about intent
```

---

#### `createMockNullQuery()`

Creates a mock query that returns `null` (no single result found).

**Use when:** Testing `executeTakeFirst()` scenarios where a record doesn't exist.

**Example:**
```typescript
it('should return null when tournament not found', async () => {
  const mockQuery = createMockNullQuery();
  mockDb.selectFrom.mockReturnValue(mockQuery);

  const result = await tournamentRepository.findById('non-existent');

  expect(result).toBeNull();
});
```

**Empty array vs null:**
- **Empty array `[]`** - Used with `execute()` when query returns multiple results
- **Null** - Used with `executeTakeFirst()` when query returns single result

```typescript
// execute() returns array (possibly empty)
const results = await query.execute(); // [] or [item1, item2]

// executeTakeFirst() returns single item or null
const result = await query.executeTakeFirst(); // item or null
```

---

#### `createMockErrorQuery(error?: Error)`

Creates a mock query that throws an error when executed.

**Use when:** Testing error handling in repository methods.

**Example - Generic Error:**
```typescript
it('should handle database errors gracefully', async () => {
  const mockQuery = createMockErrorQuery(new Error('Connection lost'));
  mockDb.selectFrom.mockReturnValue(mockQuery);

  await expect(tournamentRepository.findById('1')).rejects.toThrow('Connection lost');
});
```

**Example - Specific Error Type:**
```typescript
it('should handle constraint violation errors', async () => {
  const constraintError = new Error('Unique constraint violated');
  const mockQuery = createMockErrorQuery(constraintError);
  mockDb.insertInto.mockReturnValue(mockQuery);

  await expect(tournamentRepository.create(mockTournament)).rejects.toThrow(
    'Unique constraint violated'
  );
});
```

**Example - Testing Error Recovery:**
```typescript
it('should retry on transient errors', async () => {
  const mockQuery = createMockErrorQuery(new Error('Temporary failure'));
  mockDb.selectFrom.mockReturnValueOnce(mockQuery);

  const successQuery = createMockSelectQuery(mockTournament);
  mockDb.selectFrom.mockReturnValueOnce(successQuery);

  const result = await tournamentRepositoryWithRetry.findById('1');

  expect(result).toEqual(mockTournament);
  expect(mockDb.selectFrom).toHaveBeenCalledTimes(2);
});
```

---

### INSERT Queries

#### `createMockInsertQuery<T>(result: T)`

Creates a complete mock for INSERT queries that return the created record.

**Use when:** Testing repository create/insert methods.

**Example:**
```typescript
it('should create new tournament', async () => {
  const newTournament = { long_name: 'New Tournament', short_name: 'NEW' };
  const createdTournament = testFactories.tournament(newTournament);

  const mockQuery = createMockInsertQuery(createdTournament);
  mockDb.insertInto.mockReturnValue(mockQuery);

  const result = await tournamentRepository.create(newTournament);

  expect(result).toEqual(createdTournament);
  expect(mockDb.insertInto).toHaveBeenCalledWith('tournaments');
  expect(mockQuery.values).toHaveBeenCalledWith(expect.objectContaining(newTournament));
});
```

**What it mocks:**
All Kysely INSERT query methods: `values`, `returningAll`, `returning`, `onConflict`, `ignore`, `doNothing`, `doUpdateSet`, `execute`, `executeTakeFirst`, `executeTakeFirstOrThrow`

---

### UPDATE Queries

#### `createMockUpdateQuery<T>(result: T | T[])`

Creates a complete mock for UPDATE queries that return updated record(s).

**Use when:** Testing repository update methods.

**Example - Update Single Record:**
```typescript
it('should update tournament', async () => {
  const updates = { long_name: 'Updated Tournament' };
  const updatedTournament = testFactories.tournament({ id: '1', ...updates });

  const mockQuery = createMockUpdateQuery(updatedTournament);
  mockDb.updateTable.mockReturnValue(mockQuery);

  const result = await tournamentRepository.update('1', updates);

  expect(result).toEqual(updatedTournament);
  expect(mockDb.updateTable).toHaveBeenCalledWith('tournaments');
  expect(mockQuery.set).toHaveBeenCalledWith(updates);
  expect(mockQuery.where).toHaveBeenCalledWith('id', '=', '1');
});
```

**Example - Update Multiple Records:**
```typescript
it('should deactivate all tournaments', async () => {
  const updatedTournaments = createMany(testFactories.tournament, 3, (i) => ({
    id: `tournament-${i}`,
    is_active: false
  }));

  const mockQuery = createMockUpdateQuery(updatedTournaments);
  mockDb.updateTable.mockReturnValue(mockQuery);

  const results = await tournamentRepository.deactivateAll();

  expect(results).toHaveLength(3);
  expect(results.every(t => !t.is_active)).toBe(true);
});
```

**What it mocks:**
All Kysely UPDATE query methods: `set`, `where`, `returningAll`, `returning`, `from`, `innerJoin`, `leftJoin`, `execute`, `executeTakeFirst`, `executeTakeFirstOrThrow`

---

### DELETE Queries

#### `createMockDeleteQuery<T>(result: T | T[])`

Creates a complete mock for DELETE queries that return deleted record(s).

**Use when:** Testing repository delete methods.

**Example:**
```typescript
it('should delete tournament', async () => {
  const deletedTournament = testFactories.tournament({ id: '1' });

  const mockQuery = createMockDeleteQuery(deletedTournament);
  mockDb.deleteFrom.mockReturnValue(mockQuery);

  const result = await tournamentRepository.delete('1');

  expect(result).toEqual(deletedTournament);
  expect(mockDb.deleteFrom).toHaveBeenCalledWith('tournaments');
  expect(mockQuery.where).toHaveBeenCalledWith('id', '=', '1');
});
```

**What it mocks:**
All Kysely DELETE query methods: `where`, `using`, `returningAll`, `returning`, `execute`, `executeTakeFirst`, `executeTakeFirstOrThrow`

---

### Complete Mocks

#### `createMockDatabase()`

Creates a complete database mock with all CRUD operations pre-configured.

**Use when:** You need to mock multiple query types in a single test.

**Example:**
```typescript
it('should perform complex multi-table operations', async () => {
  const mockDb = createMockDatabase();

  // Override specific operations as needed
  const mockTournaments = [testFactories.tournament()];
  mockDb.selectFrom.mockReturnValue(createMockSelectQuery(mockTournaments));

  // Test code that uses multiple query types
  const result = await complexRepository.performOperation();

  expect(mockDb.selectFrom).toHaveBeenCalled();
  expect(mockDb.insertInto).toHaveBeenCalled();
  expect(mockDb.updateTable).toHaveBeenCalled();
});
```

**Default behavior:**
- `selectFrom()` → Returns empty array `[]`
- `insertInto()` → Returns `{ id: 'mock-id' }`
- `updateTable()` → Returns `{ id: 'mock-id' }`
- `deleteFrom()` → Returns `{ id: 'mock-id' }`

**When to use vs individual mocks:**
- **Use `createMockDatabase()`** when testing code that uses multiple CRUD operations
- **Use individual mocks** (`createMockSelectQuery`, etc.) for focused, single-operation tests

---

#### `createMockBaseFunctions<T>(defaultResult?: T)`

Creates mock implementations of base repository CRUD functions.

**Use when:** Mocking repository dependencies in higher-level code.

**Example:**
```typescript
it('should use repository in service layer', async () => {
  const mockTournament = testFactories.tournament();
  const mockRepo = createMockBaseFunctions(mockTournament);

  const service = new TournamentService(mockRepo);
  const result = await service.getTournament('1');

  expect(mockRepo.findById).toHaveBeenCalledWith('1');
  expect(result).toEqual(mockTournament);
});
```

**What it mocks:**
- `findById(id)` → Returns `defaultResult` or `null`
- `create(data)` → Returns `defaultResult` or `{ id: 'mock-id' }`
- `update(id, data)` → Returns `defaultResult` or `{ id: 'mock-id' }`
- `delete(id)` → Returns `defaultResult` or `{ id: 'mock-id' }`

---

### Assertions

#### `expectKyselyQuery(mockDb, mockQuery)`

Fluent assertion builder for verifying Kysely database calls.

**Use when:** You want to write readable, chainable assertions for database operations.

**Example - Verify Simple SELECT:**
```typescript
it('should query users table correctly', async () => {
  const mockQuery = createMockSelectQuery([mockUser]);
  mockDb.selectFrom.mockReturnValue(mockQuery);

  await userRepository.findById('user-1');

  expectKyselyQuery(mockDb, mockQuery)
    .toHaveCalledSelectFrom('users')
    .toHaveCalledWhere('id', '=', 'user-1')
    .toHaveCalledExecuteTakeFirst();
});
```

**Example - Verify Complex Query with Joins:**
```typescript
it('should query with joins and filters', async () => {
  const mockQuery = createMockSelectQuery([mockGameWithTeams]);
  mockDb.selectFrom.mockReturnValue(mockQuery);

  await gameRepository.findWithTeams('game-1');

  expectKyselyQuery(mockDb, mockQuery)
    .toHaveCalledSelectFrom('games')
    .toHaveCalledInnerJoin('teams as home_team', 'games.home_team', 'home_team.id')
    .toHaveCalledInnerJoin('teams as away_team', 'games.away_team', 'away_team.id')
    .toHaveCalledWhere('games.id', '=', 'game-1')
    .toHaveCalledExecuteTakeFirst();
});
```

**Example - Verify INSERT:**
```typescript
it('should insert tournament correctly', async () => {
  const mockQuery = createMockInsertQuery(mockTournament);
  mockDb.insertInto.mockReturnValue(mockQuery);

  await tournamentRepository.create(mockTournament);

  expectKyselyQuery(mockDb, mockQuery)
    .toHaveCalledInsertInto('tournaments');
});
```

**Available Assertions:**
- `.toHaveCalledSelectFrom(tableName)`
- `.toHaveCalledInsertInto(tableName)`
- `.toHaveCalledUpdateTable(tableName)`
- `.toHaveCalledDeleteFrom(tableName)`
- `.toHaveCalledWhere(...args)`
- `.toHaveCalledInnerJoin(...args)`
- `.toHaveCalledLeftJoin(...args)`
- `.toHaveCalledOrderBy(...args)`
- `.toHaveCalledGroupBy(...args)`
- `.toHaveCalledLimit(limit)`
- `.toHaveCalledExecute()`
- `.toHaveCalledExecuteTakeFirst()`
- `.toHaveCalledExecuteTakeFirstOrThrow()`

**Why use this instead of `expect(...).toHaveBeenCalledWith(...)`?**

```typescript
// Standard assertion - verbose
expect(mockDb.selectFrom).toHaveBeenCalledWith('users');
expect(mockQuery.where).toHaveBeenCalledWith('id', '=', 'user-1');
expect(mockQuery.executeTakeFirst).toHaveBeenCalled();

// expectKyselyQuery - chainable and readable
expectKyselyQuery(mockDb, mockQuery)
  .toHaveCalledSelectFrom('users')
  .toHaveCalledWhere('id', '=', 'user-1')
  .toHaveCalledExecuteTakeFirst();
```

---

## Test Factories (`test-factories.ts`)

Type-safe test data factories for creating mock database records with sensible defaults. Each factory creates a valid object that can be customized with overrides.

### Available Factories

All 18 domain entity factories with default values:

| Factory | Description | Key Properties |
|---------|-------------|----------------|
| `tournament()` | Tournament/competition | `id`, `short_name`, `long_name`, `is_active`, point values |
| `user()` | User account | `id`, `email`, `nickname`, `password_hash`, `is_admin` |
| `team()` | Team/country | `id`, `name`, `short_name`, `theme` |
| `game()` | Match/game | `id`, `tournament_id`, `home_team`, `away_team`, `game_date` |
| `gameGuess()` | User's game prediction | `id`, `game_id`, `user_id`, `home_score`, `away_score` |
| `gameResult()` | Actual game result | `game_id`, `home_score`, `away_score`, `is_draft` |
| `player()` | Player | `id`, `team_id`, `tournament_id`, `name`, `position` |
| `tournamentGroup()` | Tournament group (e.g., Group A) | `id`, `tournament_id`, `group_letter` |
| `tournamentGroupTeam()` | Team standings in group | `id`, `tournament_group_id`, `team_id`, `points`, stats |
| `tournamentGroupGame()` | Game-group association | `tournament_group_id`, `game_id` |
| `tournamentGroupTeamStatsGuess()` | User's group standings prediction | `id`, `tournament_group_id`, `user_id`, `team_id`, stats |
| `playoffRound()` | Playoff round | `id`, `tournament_id`, `round_name`, `round_order` |
| `prodeGroup()` | User prediction group | `id`, `owner_user_id`, `name`, `theme` |
| `tournamentGuess()` | User's tournament outcome prediction | `id`, `tournament_id`, `user_id`, champion/runner-up IDs |
| `tournamentVenue()` | Stadium/venue | `id`, `tournament_id`, `name`, `location` |
| `tournamentThirdPlaceRules()` | Third place playoff rules | `id`, `tournament_id`, `combination_key`, `rules` |
| `prodeGroupTournamentBetting()` | Group betting configuration | `id`, `group_id`, `tournament_id`, `betting_enabled` |
| `prodeGroupTournamentBettingPayment()` | User betting payment status | `id`, `group_tournament_betting_id`, `user_id`, `has_paid` |

**Plus helper function:**
- `createMany()` - Bulk creation with sequential IDs

### Using Overrides

All factories accept optional `overrides` to customize specific properties.

**Example - Basic Usage:**
```typescript
import { testFactories } from '@/__tests__/db/test-factories';

// Use defaults
const tournament = testFactories.tournament();
// { id: 'tournament-1', short_name: 'TEST', long_name: 'Test Tournament 2024', ... }

// Override specific properties
const customTournament = testFactories.tournament({
  id: 'world-cup-2026',
  short_name: 'WC26',
  long_name: 'FIFA World Cup 2026',
  is_active: true
});
```

**Example - Related Entities:**
```typescript
// Create tournament first
const tournament = testFactories.tournament({ id: 'copa-america-2024' });

// Create games for that tournament
const game1 = testFactories.game({
  id: 'game-1',
  tournament_id: tournament.id,
  home_team: 'argentina',
  away_team: 'brazil'
});

const game2 = testFactories.game({
  id: 'game-2',
  tournament_id: tournament.id,
  home_team: 'chile',
  away_team: 'uruguay'
});
```

**Example - User and Predictions:**
```typescript
const user = testFactories.user({
  id: 'user-123',
  email: 'john@example.com',
  nickname: 'JohnDoe'
});

const gameGuess = testFactories.gameGuess({
  user_id: user.id,
  game_id: 'game-1',
  home_score: 2,
  away_score: 1
});
```

**Before/After Comparison:**

**Before (manual object creation - 15 lines):**
```typescript
const mockTournament = {
  id: 'tournament-1',
  short_name: 'TEST',
  long_name: 'Test Tournament',
  is_active: true,
  champion_team_id: null,
  runner_up_team_id: null,
  third_place_team_id: null,
  best_player_id: undefined,
  top_goalscorer_player_id: undefined,
  best_goalkeeper_player_id: undefined,
  best_young_player_id: undefined,
  dev_only: false,
  display_name: true,
  // ... 10 more point configuration fields
};
```

**After (factory - 1 line):**
```typescript
const mockTournament = testFactories.tournament({ id: 'tournament-1' });
```

### Bulk Creation

#### `createMany<T>(factory, count, overridesFn?)`

Creates multiple instances with sequential IDs using a function to customize each instance.

**Example - Simple Bulk Creation:**
```typescript
import { createMany } from '@/__tests__/db/test-factories';

// Create 4 teams with sequential IDs
const teams = createMany(testFactories.team, 4);
// [{ id: 'team-1', ...}, { id: 'team-2', ...}, { id: 'team-3', ...}, { id: 'team-4', ...}]
```

**Example - Custom Sequential Data:**
```typescript
// Create 4 teams with custom sequential properties
const teams = createMany(testFactories.team, 4, (i) => ({
  id: `team-${i}`,
  name: `Team ${i}`,
  short_name: `T${i}`
}));

// Result:
// [
//   { id: 'team-1', name: 'Team 1', short_name: 'T1', ... },
//   { id: 'team-2', name: 'Team 2', short_name: 'T2', ... },
//   { id: 'team-3', name: 'Team 3', short_name: 'T3', ... },
//   { id: 'team-4', name: 'Team 4', short_name: 'T4', ... }
// ]
```

**Example - Creating Tournament with Multiple Games:**
```typescript
const tournament = testFactories.tournament({ id: 'euro-2024' });

// Create 6 group stage games
const groupGames = createMany(testFactories.game, 6, (i) => ({
  id: `game-${i}`,
  tournament_id: tournament.id,
  game_number: i,
  game_type: 'group',
  game_date: new Date(`2024-06-${14 + i}T18:00:00Z`)
}));
```

**Example - Creating Users with Guesses:**
```typescript
// Create 10 users
const users = createMany(testFactories.user, 10, (i) => ({
  id: `user-${i}`,
  email: `user${i}@example.com`,
  nickname: `User${i}`
}));

// Create a guess for each user for the same game
const guesses = users.map(user =>
  testFactories.gameGuess({
    user_id: user.id,
    game_id: 'game-1',
    home_score: Math.floor(Math.random() * 4),
    away_score: Math.floor(Math.random() * 4)
  })
);
```

**When to use `createMany` vs manual array creation:**

```typescript
// ❌ DON'T - Repetitive manual creation
const teams = [
  testFactories.team({ id: 'team-1', name: 'Team 1' }),
  testFactories.team({ id: 'team-2', name: 'Team 2' }),
  testFactories.team({ id: 'team-3', name: 'Team 3' }),
  testFactories.team({ id: 'team-4', name: 'Team 4' }),
];

// ✅ DO - Use createMany for sequential data
const teams = createMany(testFactories.team, 4, (i) => ({
  id: `team-${i}`,
  name: `Team ${i}`
}));
```

### Common Factory Patterns

#### Pattern 1: Full Tournament Setup

```typescript
// Create complete tournament hierarchy
const tournament = testFactories.tournament({ id: 'wc-2026' });

const groupA = testFactories.tournamentGroup({
  tournament_id: tournament.id,
  group_letter: 'A'
});

const teams = createMany(testFactories.team, 4, (i) => ({
  id: `team-a${i}`
}));

const groupTeams = teams.map((team, i) =>
  testFactories.tournamentGroupTeam({
    tournament_group_id: groupA.id,
    team_id: team.id,
    position: i
  })
);

const games = createMany(testFactories.game, 6, (i) => ({
  tournament_id: tournament.id,
  game_number: i + 1
}));
```

#### Pattern 2: User with Predictions

```typescript
// Create user with complete prediction set
const user = testFactories.user({ id: 'test-user' });
const tournament = testFactories.tournament({ id: 'tournament-1' });

// Tournament-level predictions
const tournamentGuess = testFactories.tournamentGuess({
  user_id: user.id,
  tournament_id: tournament.id,
  champion_team_id: 'argentina',
  runner_up_team_id: 'brazil'
});

// Game predictions
const games = createMany(testFactories.game, 10);
const gameGuesses = games.map(game =>
  testFactories.gameGuess({
    user_id: user.id,
    game_id: game.id
  })
);
```

#### Pattern 3: Testing Leaderboards

```typescript
// Create multiple users with different scores
const users = createMany(testFactories.user, 5, (i) => ({
  id: `user-${i}`,
  nickname: `Player${i}`
}));

const tournament = testFactories.tournament();
const game = testFactories.game({ tournament_id: tournament.id });

// Create guesses with varying accuracy for leaderboard testing
const guesses = users.map((user, i) =>
  testFactories.gameGuess({
    user_id: user.id,
    game_id: game.id,
    score: i * 5, // Incrementing scores: 0, 5, 10, 15, 20
    final_score: i * 5
  })
);
```

### Factory Type Safety

All factories are fully typed with TypeScript:

```typescript
// ✅ Type-safe - TypeScript validates properties
const tournament = testFactories.tournament({
  short_name: 'WC26',
  is_active: true
});

// ❌ TypeScript error - unknown property
const tournament = testFactories.tournament({
  invalid_property: 'value' // Error: Object literal may only specify known properties
});

// ❌ TypeScript error - wrong type
const tournament = testFactories.tournament({
  is_active: 'yes' // Error: Type 'string' is not assignable to type 'boolean'
});
```

### Factory Default Values

Each factory has sensible defaults for testing. Some key defaults:

**Tournament:**
- Points: Exact score (10), correct outcome (5), champion (15)
- Max boosts: Silver (5), Golden (3)
- All optional award IDs: `undefined` or `null`

**User:**
- Default password hash: `'hashed_password_123'`
- Default role: Not admin (`is_admin: false`)
- Email verified: `true`

**Game:**
- Default date: `'2024-06-14T18:00:00Z'`
- Default type: `'group'`
- Default timezone: `'America/New_York'`

**GameGuess:**
- Default boost multiplier: `1.0`
- Default scores: Home 2, Away 1

These defaults let you create valid test data quickly without specifying every field.

---

## Integration Test Helpers

Utilities for testing React components that depend on Next.js navigation, authentication, and other external dependencies.

### Setup Helpers

#### `setupTestMocks(options)`

Orchestrates the setup of navigation, session, and signIn mocks with a single function call. Only creates mocks that are explicitly requested via options.

**Location:** `__tests__/mocks/setup-helpers.ts`

**Example - Component with Session:**
```typescript
import { setupTestMocks } from '@/__tests__/mocks/setup-helpers';
import { render, screen } from '@testing-library/react';
import { UserProfile } from '@/app/components/UserProfile';

describe('UserProfile', () => {
  it('should display user information when authenticated', () => {
    const { session } = setupTestMocks({
      session: true,
      sessionDefaults: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com'
      }
    });

    render(<UserProfile />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should show login prompt when unauthenticated', () => {
    const { session } = setupTestMocks({
      session: true,
      sessionDefaults: null // null = unauthenticated
    });

    render(<UserProfile />);

    expect(screen.getByText('Please log in')).toBeInTheDocument();
  });
});
```

**Example - Component with Navigation:**
```typescript
import { setupTestMocks } from '@/__tests__/mocks/setup-helpers';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameCard } from '@/app/components/GameCard';

describe('GameCard', () => {
  it('should navigate to game details on click', () => {
    const { router } = setupTestMocks({
      navigation: true
    });

    render(<GameCard gameId="game-1" />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(router.push).toHaveBeenCalledWith('/games/game-1');
  });
});
```

**Example - Component with Search Params:**
```typescript
describe('TournamentFilter', () => {
  it('should read filter from search params', () => {
    const { searchParams } = setupTestMocks({
      navigation: true,
      searchParamsDefaults: { filter: 'active', sort: 'date' }
    });

    render(<TournamentFilter />);

    expect(searchParams.get('filter')).toBe('active');
    expect(searchParams.get('sort')).toBe('date');
  });
});
```

**Example - Login Form with All Mocks:**
```typescript
describe('LoginForm', () => {
  it('should handle login flow', async () => {
    const mocks = setupTestMocks({
      navigation: true,
      session: true,
      signIn: true,
      searchParamsDefaults: { redirect: '/dashboard' },
      sessionDefaults: null, // Start unauthenticated
      signInDefaults: { ok: true } // Successful login
    });

    render(<LoginForm />);

    // Fill form
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'user@example.com' }
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' }
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    // Verify signIn was called
    await waitFor(() => {
      expect(mocks.signIn).toHaveBeenCalledWith('credentials', {
        email: 'user@example.com',
        password: 'password123',
        redirect: false
      });
    });

    // Verify navigation after successful login
    expect(mocks.router.push).toHaveBeenCalledWith('/dashboard');
  });
});
```

**Options Interface:**
```typescript
interface SetupTestMocksOptions {
  // Enable navigation mocks (router + searchParams)
  navigation?: boolean;

  // Enable session mock
  session?: boolean;

  // Enable signIn mock
  signIn?: boolean;

  // Custom router defaults (only if navigation: true)
  routerDefaults?: Partial<MockRouter>;

  // Custom search params (only if navigation: true)
  searchParamsDefaults?: Record<string, string>;

  // Custom session user data (only if session: true)
  // Set to null for unauthenticated session
  sessionDefaults?: Partial<Session['user']> | null;

  // Custom signIn result (only if signIn: true)
  signInDefaults?: { ok: boolean; error?: string };
}
```

**Return Type:**
```typescript
interface TestMocks {
  router?: MockRouter;            // Only if navigation: true
  searchParams?: MockSearchParams; // Only if navigation: true
  session?: SessionContextValue;   // Only if session: true
  signIn?: MockSignIn;            // Only if signIn: true
}
```

---

### Auth Mocks

**Location:** `__tests__/mocks/next-auth.mocks.ts`

These are pure factory functions for creating auth-related mocks. They don't have side effects - you control when and how to use them.

#### `createMockSession(overrides?)`

Creates a mock NextAuth Session object with default or custom user data.

**Example:**
```typescript
import { createMockSession } from '@/__tests__/mocks/next-auth.mocks';

const session = createMockSession({
  user: {
    id: 'user-123',
    name: 'Jane Doe',
    email: 'jane@example.com'
  },
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
});

// Use in your test
expect(session.user.name).toBe('Jane Doe');
```

---

#### `createAuthenticatedSessionValue(userOverrides?)`

Creates a mock `SessionContextValue` for authenticated state (what `useSession()` returns).

**Example:**
```typescript
import { createAuthenticatedSessionValue } from '@/__tests__/mocks/next-auth.mocks';
import { useSession } from 'next-auth/react';

const mockSession = createAuthenticatedSessionValue({
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@example.com'
});

vi.mocked(useSession).mockReturnValue(mockSession);

// Component using useSession will get:
// - data: { user: { id: 'admin-1', name: 'Admin User', ... }, expires: '...' }
// - status: 'authenticated'
```

---

#### `createUnauthenticatedSessionValue()`

Creates a mock `SessionContextValue` for unauthenticated state.

**Example:**
```typescript
import { createUnauthenticatedSessionValue } from '@/__tests__/mocks/next-auth.mocks';
import { useSession } from 'next-auth/react';

const mockSession = createUnauthenticatedSessionValue();

vi.mocked(useSession).mockReturnValue(mockSession);

// Component using useSession will get:
// - data: null
// - status: 'unauthenticated'
```

**Use Case - Testing Protected Components:**
```typescript
describe('ProtectedDashboard', () => {
  it('should show content when authenticated', () => {
    const mockSession = createAuthenticatedSessionValue();
    vi.mocked(useSession).mockReturnValue(mockSession);

    render(<ProtectedDashboard />);

    expect(screen.getByText('Welcome to Dashboard')).toBeInTheDocument();
  });

  it('should redirect when unauthenticated', () => {
    const mockSession = createUnauthenticatedSessionValue();
    vi.mocked(useSession).mockReturnValue(mockSession);
    const mockRouter = createMockRouter();
    vi.mocked(useRouter).mockReturnValue(mockRouter);

    render(<ProtectedDashboard />);

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });
});
```

---

#### `createMockSignIn(result?)`

Creates a mock `signIn` function with configurable result.

**Example - Successful Login:**
```typescript
import { createMockSignIn } from '@/__tests__/mocks/next-auth.mocks';
import { signIn } from 'next-auth/react';

const mockSignIn = createMockSignIn({ ok: true });
vi.mocked(signIn).mockImplementation(mockSignIn);

// Test login form
await signIn('credentials', { email: 'user@example.com', password: 'pass' });

expect(mockSignIn).toHaveBeenCalledWith('credentials', {
  email: 'user@example.com',
  password: 'pass'
});
```

**Example - Failed Login:**
```typescript
const mockSignIn = createMockSignIn({
  ok: false,
  error: 'Invalid credentials'
});

vi.mocked(signIn).mockImplementation(mockSignIn);

const result = await signIn('credentials', { email: 'wrong@example.com', password: 'wrong' });

expect(result.ok).toBe(false);
expect(result.error).toBe('Invalid credentials');
```

---

### Navigation Mocks

**Location:** `__tests__/mocks/next-navigation.mocks.ts`

Pure factory functions for creating Next.js App Router navigation mocks.

#### `createMockRouter(overrides?)`

Creates a mock `AppRouterInstance` with all required methods.

**Example - Basic Router Mock:**
```typescript
import { createMockRouter } from '@/__tests__/mocks/next-navigation.mocks';
import { useRouter } from 'next/navigation';

const mockRouter = createMockRouter();
vi.mocked(useRouter).mockReturnValue(mockRouter);

// Test navigation
await userEvent.click(screen.getByText('Go to Dashboard'));

expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
```

**Example - Custom Router Behavior:**
```typescript
const mockRouter = createMockRouter({
  push: vi.fn().mockResolvedValue(true),
  replace: vi.fn().mockResolvedValue(false) // Simulate navigation failure
});

vi.mocked(useRouter).mockReturnValue(mockRouter);
```

**Available Methods:**
- `push(href)` - Navigate to new route
- `replace(href)` - Replace current route
- `refresh()` - Refresh current route
- `back()` - Navigate back
- `forward()` - Navigate forward
- `prefetch(href)` - Prefetch route

---

#### `createMockSearchParams(params?)`

Creates a mock `ReadonlyURLSearchParams` with default behavior.

**Example - Read Search Params in Component:**
```typescript
import { createMockSearchParams } from '@/__tests__/mocks/next-navigation.mocks';
import { useSearchParams } from 'next/navigation';

const mockSearchParams = createMockSearchParams({
  page: '2',
  filter: 'active',
  sort: 'date'
});

vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

render(<TournamentList />);

// Component reads params
expect(mockSearchParams.get('page')).toBe('2');
expect(mockSearchParams.get('filter')).toBe('active');
expect(mockSearchParams.has('sort')).toBe(true);
```

**Example - Override in Test:**
```typescript
const mockSearchParams = createMockSearchParams({ redirect: '/dashboard' });

// Override specific behavior for this test
mockSearchParams.get.mockImplementation((key) =>
  key === 'special' ? 'value' : null
);

expect(mockSearchParams.get('special')).toBe('value');
expect(mockSearchParams.get('other')).toBeNull();
```

**Available Methods:**
- `get(name)` - Get single value
- `getAll(name)` - Get all values for name
- `has(name)` - Check if param exists
- `entries()` - Get entries iterator
- `keys()` - Get keys iterator
- `values()` - Get values iterator
- `forEach(callback)` - Iterate over params
- `toString()` - Convert to query string

---

### Complete Component Test Example

Putting it all together:

```typescript
import { setupTestMocks } from '@/__tests__/mocks/setup-helpers';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TournamentDashboard } from '@/app/tournaments/dashboard';
import { testFactories } from '@/__tests__/db/test-factories';

describe('TournamentDashboard', () => {
  it('should display tournament list for authenticated user', async () => {
    // Setup all required mocks
    const mocks = setupTestMocks({
      navigation: true,
      session: true,
      sessionDefaults: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com'
      },
      searchParamsDefaults: {
        filter: 'active'
      }
    });

    // Mock server data
    const mockTournaments = createMany(testFactories.tournament, 3, (i) => ({
      id: `tournament-${i}`,
      is_active: true
    }));

    // Render component
    render(<TournamentDashboard tournaments={mockTournaments} />);

    // Verify display
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);

    // Test navigation
    const firstTournament = screen.getAllByRole('article')[0];
    fireEvent.click(firstTournament);

    await waitFor(() => {
      expect(mocks.router.push).toHaveBeenCalledWith('/tournaments/tournament-1');
    });
  });

  it('should redirect to login when unauthenticated', () => {
    const mocks = setupTestMocks({
      navigation: true,
      session: true,
      sessionDefaults: null // Unauthenticated
    });

    render(<TournamentDashboard tournaments={[]} />);

    expect(mocks.router.push).toHaveBeenCalledWith('/login');
  });
});

---

## Common Patterns

### Pattern 1: Testing Repository Methods

Complete example showing arrange-act-assert pattern with mocks and factories:

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { createMockSelectQuery, expectKyselyQuery } from '@/__tests__/db/mock-helpers';
import { testFactories } from '@/__tests__/db/test-factories';
import { tournamentRepository } from '@/app/db/tournaments-repository';
import { db } from '@/app/db/database';

vi.mock('@/app/db/database');

describe('TournamentRepository', () => {
  const mockDb = vi.mocked(db);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find tournament by id', async () => {
    // Arrange: Create test data and mock
    const mockTournament = testFactories.tournament({ id: 'euro-2024' });
    const mockQuery = createMockSelectQuery(mockTournament);
    mockDb.selectFrom.mockReturnValue(mockQuery);

    // Act: Call the method under test
    const result = await tournamentRepository.findById('euro-2024');

    // Assert: Verify result and database calls
    expect(result).toEqual(mockTournament);
    expectKyselyQuery(mockDb, mockQuery)
      .toHaveCalledSelectFrom('tournaments')
      .toHaveCalledWhere('id', '=', 'euro-2024')
      .toHaveCalledExecuteTakeFirst();
  });
});
```

### Pattern 2: Testing Error Cases

Using `createMockErrorQuery` to test error handling:

```typescript
it('should handle database connection errors', async () => {
  // Arrange: Mock error case
  const mockQuery = createMockErrorQuery(new Error('Connection timeout'));
  mockDb.selectFrom.mockReturnValue(mockQuery);

  // Act & Assert: Expect error to be thrown
  await expect(tournamentRepository.findById('1')).rejects.toThrow('Connection timeout');
});

it('should retry on transient errors', async () => {
  // Arrange: First call fails, second succeeds
  mockDb.selectFrom
    .mockReturnValueOnce(createMockErrorQuery(new Error('Temporary failure')))
    .mockReturnValueOnce(createMockSelectQuery(mockTournament));

  // Act: Call method with retry logic
  const result = await tournamentRepositoryWithRetry.findById('1');

  // Assert: Verify retry happened and succeeded
  expect(result).toEqual(mockTournament);
  expect(mockDb.selectFrom).toHaveBeenCalledTimes(2);
});
```

### Pattern 3: Testing Empty Results

Distinguish between empty array and null:

```typescript
it('should return empty array when no tournaments exist', async () => {
  const mockQuery = createMockEmptyQuery();
  mockDb.selectFrom.mockReturnValue(mockQuery);

  const results = await tournamentRepository.findAll();

  expect(results).toEqual([]);
  expect(results).toHaveLength(0);
});

it('should return null when tournament not found', async () => {
  const mockQuery = createMockNullQuery();
  mockDb.selectFrom.mockReturnValue(mockQuery);

  const result = await tournamentRepository.findById('non-existent');

  expect(result).toBeNull();
});
```

### Pattern 4: Testing Component with Auth

Using `setupTestMocks` for integration tests:

```typescript
import { setupTestMocks } from '@/__tests__/mocks/setup-helpers';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserDashboard } from '@/app/components/UserDashboard';

describe('UserDashboard', () => {
  it('should display user info when authenticated', () => {
    // Arrange: Setup authenticated session
    const { session } = setupTestMocks({
      session: true,
      sessionDefaults: {
        id: 'user-123',
        name: 'John Doe',
        email: 'john@example.com'
      }
    });

    // Act: Render component
    render(<UserDashboard />);

    // Assert: Verify display
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should redirect to login when unauthenticated', () => {
    // Arrange: Setup unauthenticated session
    const { session, router } = setupTestMocks({
      session: true,
      sessionDefaults: null,
      navigation: true
    });

    // Act: Render component
    render(<UserDashboard />);

    // Assert: Verify redirect
    expect(router.push).toHaveBeenCalledWith('/login');
  });
});
```

### Pattern 5: Testing with Related Entities

Creating complete data hierarchies:

```typescript
describe('GameRepository - Complex Queries', () => {
  it('should find game with teams and tournament', async () => {
    // Arrange: Create related entities
    const tournament = testFactories.tournament({ id: 'euro-2024' });
    const homeTeam = testFactories.team({ id: 'germany', name: 'Germany' });
    const awayTeam = testFactories.team({ id: 'spain', name: 'Spain' });
    const game = testFactories.game({
      id: 'game-1',
      tournament_id: tournament.id,
      home_team: homeTeam.id,
      away_team: awayTeam.id
    });

    // Mock database response with joined data
    const mockGameWithRelations = {
      ...game,
      tournament,
      home_team_data: homeTeam,
      away_team_data: awayTeam
    };

    const mockQuery = createMockSelectQuery(mockGameWithRelations);
    mockDb.selectFrom.mockReturnValue(mockQuery);

    // Act
    const result = await gameRepository.findWithRelations('game-1');

    // Assert: Verify complex query
    expect(result.tournament.id).toBe('euro-2024');
    expect(result.home_team_data.name).toBe('Germany');
    expect(result.away_team_data.name).toBe('Spain');
  });
});
```

### Pattern 6: Bulk Testing with createMany

Testing leaderboards, rankings, and multi-user scenarios:

```typescript
it('should calculate correct leaderboard rankings', async () => {
  // Arrange: Create 5 users with different scores
  const users = createMany(testFactories.user, 5, (i) => ({
    id: `user-${i}`,
    nickname: `Player${i}`
  }));

  const tournament = testFactories.tournament();
  const game = testFactories.game({ tournament_id: tournament.id });

  // Create guesses with incrementing scores: 0, 5, 10, 15, 20
  const guesses = users.map((user, i) =>
    testFactories.gameGuess({
      user_id: user.id,
      game_id: game.id,
      final_score: i * 5
    })
  );

  const mockQuery = createMockSelectQuery(guesses);
  mockDb.selectFrom.mockReturnValue(mockQuery);

  // Act
  const leaderboard = await leaderboardRepository.getForTournament(tournament.id);

  // Assert: Verify correct ranking
  expect(leaderboard[0].final_score).toBe(20); // Player 5 wins
  expect(leaderboard[4].final_score).toBe(0);  // Player 1 last
});
```

---

## Migration Guide

### From Manual Chains to Helpers

#### Example 1: SELECT Query

**Before (manual chain - 8 lines):**
```typescript
const mockExecuteTakeFirst = vi.fn().mockResolvedValue(mockTournament);
const mockSelectAll = vi.fn().mockReturnValue({
  executeTakeFirst: mockExecuteTakeFirst,
});
const mockWhere = vi.fn().mockReturnValue({
  selectAll: mockSelectAll,
});
mockDb.selectFrom.mockReturnValue({
  where: mockWhere,
} as any);
```

**After (helper - 2 lines):**
```typescript
const mockQuery = createMockSelectQuery(mockTournament);
mockDb.selectFrom.mockReturnValue(mockQuery);
```

**Line reduction: 75% fewer lines**

---

#### Example 2: INSERT Query

**Before (manual - 6 lines):**
```typescript
const mockExecuteTakeFirst = vi.fn().mockResolvedValue(createdRecord);
const mockReturningAll = vi.fn().mockReturnValue({ executeTakeFirst: mockExecuteTakeFirst });
const mockValues = vi.fn().mockReturnValue({ returningAll: mockReturningAll });
mockDb.insertInto.mockReturnValue({
  values: mockValues,
} as any);
```

**After (helper - 2 lines):**
```typescript
const mockQuery = createMockInsertQuery(createdRecord);
mockDb.insertInto.mockReturnValue(mockQuery);
```

---

#### Example 3: Test Data Creation

**Before (manual object - 25+ lines):**
```typescript
const mockTournament = {
  id: 'tournament-1',
  short_name: 'TEST',
  long_name: 'Test Tournament',
  is_active: true,
  champion_team_id: null,
  runner_up_team_id: null,
  third_place_team_id: null,
  best_player_id: undefined,
  top_goalscorer_player_id: undefined,
  best_goalkeeper_player_id: undefined,
  best_young_player_id: undefined,
  dev_only: false,
  display_name: true,
  theme: null,
  game_exact_score_points: 10,
  game_correct_outcome_points: 5,
  champion_points: 15,
  runner_up_points: 10,
  third_place_points: 5,
  individual_award_points: 3,
  qualified_team_points: 2,
  exact_position_qualified_points: 1,
  max_silver_games: 5,
  max_golden_games: 3,
};
```

**After (factory - 1 line):**
```typescript
const mockTournament = testFactories.tournament({ id: 'tournament-1' });
```

**Line reduction: 96% fewer lines**

---

### Migration Steps

**Step 1: Identify Manual Mocks**

Look for patterns like:
- `vi.fn().mockReturnValue({ method: vi.fn() })` chains
- Manual object literals with all properties
- Repetitive mock setup in multiple tests

**Step 2: Replace with Helpers**

- **SELECT queries** → `createMockSelectQuery()`
- **Empty results** → `createMockEmptyQuery()`
- **Null results** → `createMockNullQuery()`
- **INSERT queries** → `createMockInsertQuery()`
- **UPDATE queries** → `createMockUpdateQuery()`
- **DELETE queries** → `createMockDeleteQuery()`
- **Manual objects** → `testFactories.*`

**Step 3: Update Imports**

Add imports at top of test file:
```typescript
import { createMockSelectQuery, createMockInsertQuery, ... } from '@/__tests__/db/mock-helpers';
import { testFactories } from '@/__tests__/db/test-factories';
```

**Step 4: Verify Tests Still Pass**

Run tests after migration:
```bash
npm test path/to/your.test.ts
```

---

### Complete File Migration Example

**Before:**
```typescript
import { vi, describe, it, expect } from 'vitest';
import { tournamentRepository } from '@/app/db/tournaments-repository';

vi.mock('@/app/db/database');

describe('TournamentRepository', () => {
  it('should find tournament by id', async () => {
    const mockTournament = {
      id: 'tournament-1',
      short_name: 'TEST',
      // ... 20+ more properties
    };

    const mockExecuteTakeFirst = vi.fn().mockResolvedValue(mockTournament);
    const mockSelectAll = vi.fn().mockReturnValue({
      executeTakeFirst: mockExecuteTakeFirst,
    });
    const mockWhere = vi.fn().mockReturnValue({
      selectAll: mockSelectAll,
    });
    mockDb.selectFrom.mockReturnValue({
      where: mockWhere,
    } as any);

    const result = await tournamentRepository.findById('tournament-1');

    expect(result).toEqual(mockTournament);
  });
});
```

**After:**
```typescript
import { vi, describe, it, expect } from 'vitest';
import { createMockSelectQuery } from '@/__tests__/db/mock-helpers';
import { testFactories } from '@/__tests__/db/test-factories';
import { tournamentRepository } from '@/app/db/tournaments-repository';

vi.mock('@/app/db/database');

describe('TournamentRepository', () => {
  it('should find tournament by id', async () => {
    const mockTournament = testFactories.tournament({ id: 'tournament-1' });
    const mockQuery = createMockSelectQuery(mockTournament);
    mockDb.selectFrom.mockReturnValue(mockQuery);

    const result = await tournamentRepository.findById('tournament-1');

    expect(result).toEqual(mockTournament);
  });
});
```

**Results:**
- Lines reduced: 35 → 14 (60% reduction)
- More readable and maintainable
- Type-safe with full autocomplete

---

## When to Use What

### Decision Tree for Mock Helpers

```
What are you testing?
│
├─ Repository method (database interaction)
│  │
│  └─ What operation?
│     │
│     ├─ SELECT
│     │  │
│     │  └─ Expected result?
│     │     ├─ Data found → createMockSelectQuery(data)
│     │     ├─ No results (array) → createMockEmptyQuery()
│     │     ├─ No results (single) → createMockNullQuery()
│     │     └─ Error/failure → createMockErrorQuery(error)
│     │
│     ├─ INSERT → createMockInsertQuery(createdRecord)
│     ├─ UPDATE → createMockUpdateQuery(updatedRecord)
│     └─ DELETE → createMockDeleteQuery(deletedRecord)
│
├─ Component with dependencies
│  │
│  └─ What dependencies?
│     ├─ Auth (session) → setupTestMocks({ session: true })
│     ├─ Navigation (router) → setupTestMocks({ navigation: true })
│     ├─ Both → setupTestMocks({ session: true, navigation: true })
│     └─ SignIn function → setupTestMocks({ signIn: true })
│
└─ Need test data?
   │
   └─ How many instances?
      ├─ Single → testFactories.*(overrides)
      └─ Multiple → createMany(testFactories.*, count, overridesFn)
```

### Helper Selection Guide

| Scenario | Use This | Example |
|----------|----------|---------|
| Testing SELECT that returns data | `createMockSelectQuery` | `createMockSelectQuery(mockUser)` |
| Testing SELECT with no results (array) | `createMockEmptyQuery` | `createMockEmptyQuery()` |
| Testing findById that returns nothing | `createMockNullQuery` | `createMockNullQuery()` |
| Testing INSERT operation | `createMockInsertQuery` | `createMockInsertQuery(newUser)` |
| Testing UPDATE operation | `createMockUpdateQuery` | `createMockUpdateQuery(updatedUser)` |
| Testing DELETE operation | `createMockDeleteQuery` | `createMockDeleteQuery(deletedUser)` |
| Testing error/exception handling | `createMockErrorQuery` | `createMockErrorQuery(new Error('Failed'))` |
| Testing complex multi-CRUD operations | `createMockDatabase` | `mockDb = createMockDatabase()` |
| Need single test record | `testFactories.*` | `testFactories.user({ id: '1' })` |
| Need multiple test records | `createMany` | `createMany(testFactories.user, 10)` |
| Testing component with auth | `setupTestMocks` | `setupTestMocks({ session: true })` |
| Testing component with navigation | `setupTestMocks` | `setupTestMocks({ navigation: true })` |
| Verify database calls | `expectKyselyQuery` | `expectKyselyQuery(mockDb, mockQuery)` |

### Factory Selection

| Need | Factory | Example |
|------|---------|---------|
| Tournament/competition | `testFactories.tournament` | `testFactories.tournament({ is_active: true })` |
| User account | `testFactories.user` | `testFactories.user({ is_admin: true })` |
| Team/country | `testFactories.team` | `testFactories.team({ name: 'Argentina' })` |
| Match/game | `testFactories.game` | `testFactories.game({ home_team: 'arg' })` |
| Game prediction | `testFactories.gameGuess` | `testFactories.gameGuess({ home_score: 2 })` |
| Game result | `testFactories.gameResult` | `testFactories.gameResult({ home_score: 3 })` |
| Player | `testFactories.player` | `testFactories.player({ position: 'Forward' })` |
| Tournament group | `testFactories.tournamentGroup` | `testFactories.tournamentGroup({ group_letter: 'A' })` |
| Prediction group | `testFactories.prodeGroup` | `testFactories.prodeGroup({ name: 'Friends' })` |

### Common Questions

**Q: Should I use `createMockEmptyQuery()` or `createMockNullQuery()`?**

A: Depends on the query method:
- `execute()` → Use `createMockEmptyQuery()` (returns `[]`)
- `executeTakeFirst()` → Use `createMockNullQuery()` (returns `null`)

**Q: When should I use `createMockDatabase()` vs individual query mocks?**

A:
- **Use `createMockDatabase()`** for complex operations testing multiple CRUD types
- **Use individual mocks** for focused, single-operation tests (better for most cases)

**Q: Should I mock at database or repository level?**

A:
- **Unit tests (repository)** → Mock database with `createMockSelectQuery`, etc.
- **Integration tests (service/action)** → Mock repository with `createMockBaseFunctions`

**Q: How do I test multiple sequential operations?**

A: Use `mockReturnValueOnce` for different behaviors:
```typescript
mockDb.selectFrom
  .mockReturnValueOnce(createMockSelectQuery(user1))
  .mockReturnValueOnce(createMockSelectQuery(user2));
```

**Q: Should I create factories for every entity?**

A: Only create factories if you use an entity in 3+ tests. For one-off needs, manual objects are fine.

---

## Troubleshooting

### Issue: "Type error with mock query"

**Problem:**
```typescript
const mockQuery = createMockSelectQuery(mockTournament);
// Type error: Type 'X' is not assignable to type 'Y'
```

**Solution:**
Ensure the generic type matches your data:
```typescript
// ✅ Correct
const mockQuery = createMockSelectQuery<Tournament>(mockTournament);
mockDb.selectFrom.mockReturnValue(mockQuery);

// Or let TypeScript infer it
const mockTournament: Tournament = testFactories.tournament();
const mockQuery = createMockSelectQuery(mockTournament);
```

---

### Issue: "Mock not being called"

**Problem:**
```typescript
const mockQuery = createMockSelectQuery(data);
mockDb.selectFrom.mockReturnValue(mockQuery);

// Test fails: expect(mockQuery.execute).toHaveBeenCalled()
// Error: expect(jest.fn()).toHaveBeenCalled()
```

**Possible Causes:**

1. **Mock setup in wrong scope:**
```typescript
// ❌ Wrong - mock setup after test runs
it('should find user', async () => {
  await userRepository.findById('1');

  const mockQuery = createMockSelectQuery(mockUser);
  mockDb.selectFrom.mockReturnValue(mockQuery); // Too late!
});

// ✅ Correct - mock setup before test
it('should find user', async () => {
  const mockQuery = createMockSelectQuery(mockUser);
  mockDb.selectFrom.mockReturnValue(mockQuery);

  await userRepository.findById('1');
});
```

2. **Hoisted mock not configured:**
```typescript
// Check if you need hoisted mocks for base repository
vi.mock('../../app/db/base-repository', () => {
  const mockBaseFunctions = {
    findById: vi.fn(),
    create: vi.fn(),
    // ...
  };

  return {
    createBaseFunctions: vi.fn(() => mockBaseFunctions),
  };
});
```

---

### Issue: "Factory missing property"

**Problem:**
```typescript
const user = testFactories.user();
// Error: Property 'custom_field' does not exist on type 'User'
```

**Solution:**
Use overrides parameter:
```typescript
// ✅ Correct
const user = testFactories.user({
  custom_field: 'value'
});
```

Or update the factory if the property should always be included:
```typescript
// In test-factories.ts
user: (overrides?: Partial<User>): User => ({
  // ... existing properties
  custom_field: 'default_value',
  ...overrides,
})
```

---

### Issue: "How to mock errors in Kysely chains"

**Problem:**
Need to test what happens when database query fails.

**Solution:**
Use `createMockErrorQuery`:
```typescript
const mockQuery = createMockErrorQuery(new Error('Connection timeout'));
mockDb.selectFrom.mockReturnValue(mockQuery);

await expect(repository.findById('1')).rejects.toThrow('Connection timeout');
```

For specific error types:
```typescript
// Constraint violation
const error = new Error('Unique constraint violated');
error.code = '23505'; // PostgreSQL error code
const mockQuery = createMockErrorQuery(error);

// Connection error
const error = new Error('Connection refused');
const mockQuery = createMockErrorQuery(error);
```

---

### Issue: "When to use createMockDatabase vs individual query mocks"

**Problem:**
Not sure which approach to use.

**Decision Guide:**

**Use `createMockDatabase()` when:**
- Testing code that performs multiple different CRUD operations
- Need a complete database mock quickly
- Testing complex transactions

**Use individual query mocks when:**
- Testing a single operation type (SELECT, INSERT, etc.)
- Need precise control over query behavior
- Writing focused unit tests

**Example:**
```typescript
// ✅ Good use of createMockDatabase (multiple operations)
it('should perform complex operation', async () => {
  const mockDb = createMockDatabase();
  mockDb.selectFrom.mockReturnValue(createMockSelectQuery(users));
  mockDb.insertInto.mockReturnValue(createMockInsertQuery(newUser));

  await complexService.processUsers();

  expect(mockDb.selectFrom).toHaveBeenCalled();
  expect(mockDb.insertInto).toHaveBeenCalled();
});

// ✅ Good use of individual mock (single operation)
it('should find user by id', async () => {
  const mockQuery = createMockSelectQuery(mockUser);
  mockDb.selectFrom.mockReturnValue(mockQuery);

  const result = await userRepository.findById('1');

  expect(result).toEqual(mockUser);
});
```

---

### Issue: "Test fails with 'Cannot read property of undefined'"

**Problem:**
```typescript
// Error: Cannot read property 'execute' of undefined
```

**Common Causes:**

1. **Forgot to mock the database:**
```typescript
// ❌ Missing mock
await userRepository.findById('1'); // Fails

// ✅ Add mock
vi.mock('@/app/db/database');
const mockDb = vi.mocked(db);
```

2. **Mock not set up for the right table:**
```typescript
// ❌ Wrong table
mockDb.selectFrom.mockReturnValue(mockQuery);
await userRepository.findById('1'); // Calls selectFrom('users')
// but mock is on selectFrom('tournaments')

// ✅ Correct - mock applies to all selectFrom calls
mockDb.selectFrom.mockReturnValue(mockQuery);
```

3. **Method chain not mocked:**
```typescript
// Query uses .innerJoin() but mock doesn't include it
// Solution: Use createMockSelectQuery which includes all methods
```

---

### Issue: "setupTestMocks not working"

**Problem:**
```typescript
setupTestMocks({ session: true });
// Component still shows "not authenticated"
```

**Solution:**
Ensure you're mocking the hooks:
```typescript
// At top of test file
vi.mock('next-auth/react');
vi.mock('next/navigation');

// Then in test
const { session } = setupTestMocks({
  session: true,
  sessionDefaults: { id: 'user-1', name: 'Test' }
});

// The mock is now configured correctly
```

---

### Issue: "How to verify complex query chains"

**Problem:**
Need to verify a query with joins, where, orderBy, etc.

**Solution:**
Use `expectKyselyQuery` fluent builder:
```typescript
expectKyselyQuery(mockDb, mockQuery)
  .toHaveCalledSelectFrom('games')
  .toHaveCalledInnerJoin('teams', 'games.home_team', 'teams.id')
  .toHaveCalledWhere('games.tournament_id', '=', 'tournament-1')
  .toHaveCalledOrderBy('games.game_date', 'asc')
  .toHaveCalledLimit(10)
  .toHaveCalledExecute();
```

This is much more readable than:
```typescript
expect(mockDb.selectFrom).toHaveBeenCalledWith('games');
expect(mockQuery.innerJoin).toHaveBeenCalledWith('teams', 'games.home_team', 'teams.id');
expect(mockQuery.where).toHaveBeenCalledWith('games.tournament_id', '=', 'tournament-1');
// ... etc
```

---

### Getting Help

If you encounter issues not covered here:

1. **Check existing test files** for similar patterns
2. **Read the JSDoc** on helper functions (includes examples)
3. **Review the examples** in this README
4. **Ask the team** - others may have solved similar problems

Common files with good examples:
- `__tests__/db/tournaments.repository.test.ts` - Complex queries
- `__tests__/db/users.repository.test.ts` - CRUD operations
- `__tests__/db/game-guesses.repository.test.ts` - Error handling

---
name: test-engineer
description: Testing skill — use when creating tests during implementation. Covers parallel Haiku subagent test creation, mandatory test utilities (renderWithTheme, testFactories, mock helpers), and 80% coverage requirements.
context: fork
agent: haiku
---

# Test Engineer (Testing Skill)

## Step 0: Read Story Context File

**First action — get WORKTREE_PATH and STORY_NUMBER:**

```typescript
const contextFile = `${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-context.md`
Read({ file_path: contextFile })
// Extract: WORKTREE_PATH, STORY_NUMBER
```

**If bootstrapping from scratch** (fresh subagent with no prior context):
```bash
ls /Users/gvinokur/Personal/qatar-prode-story-*/plans/STORY-*-context.md 2>/dev/null | tail -1
```

---

## MANDATORY UTILITIES — READ THIS FIRST

**❌ NEVER do these:**
- ❌ Create local theme setup — use `renderWithTheme()` from test utilities
- ❌ Create local context wrappers — use `renderWithProviders()` from test utilities
- ❌ Mock Next.js inline with `as any` — use mock utilities from `@/__tests__/mocks/`
- ❌ Build Kysely query chains manually — use `createMockSelectQuery()` etc.
- ❌ Create mock data objects manually — use `testFactories.*`
- ❌ Use inline arrow functions in `vi.mock()` at module level — causes Vitest to hang

**✅ ALWAYS use:**
```typescript
// Component testing
import { renderWithTheme, renderWithProviders, createMockGuessesContext } from '@/__tests__/utils/test-utils';

// Next.js mocking
import { createMockRouter, createMockSearchParams } from '@/__tests__/mocks/next-navigation.mocks';
import { createAuthenticatedSessionValue, createUnauthenticatedSessionValue } from '@/__tests__/mocks/next-auth.mocks';

// Database mocking
import { createMockSelectQuery, createMockInsertQuery } from '@/__tests__/db/mock-helpers';
import { testFactories, createMany } from '@/__tests__/db/test-factories';
```

---

## Testing Conventions

- **Test files**: `__tests__/` directory mirroring `app/` structure
- **Primary framework**: Vitest 3.2 with `@testing-library/react`
- **Coverage target**: 60% minimum (enforced by SonarCloud)
- **New code coverage**: 80%+ (enforced by SonarCloud)
- **Legacy**: Jest 29.7 (legacy integration tests)

## Test Utilities Location

```
__tests__/
├── db/
│   ├── mock-helpers.ts          # Database query mocking (MANDATORY)
│   ├── test-factories.ts        # Mock data factories (MANDATORY)
│   └── README.md                # Database testing guide
├── utils/
│   ├── test-utils.tsx           # Component rendering utilities (MANDATORY)
│   ├── test-theme.ts            # Theme testing utilities
│   └── README.md                # Component testing guide
└── mocks/
    ├── next-navigation.mocks.ts # Next.js hook mocks (MANDATORY)
    ├── next-auth.mocks.ts       # Authentication mocks (MANDATORY)
    └── README.md                # Mock utilities guide
```

## Quick Reference: Available Test Factories

All factories from `@/__tests__/db/test-factories`:

```typescript
testFactories.tournament(overrides?)    // Tournament entity
testFactories.user(overrides?)          // User entity
testFactories.team(overrides?)          // Team entity
testFactories.game(overrides?)          // Game entity
testFactories.gameGuess(overrides?)     // Game guess entity
testFactories.player(overrides?)        // Player entity
testFactories.boost(overrides?)         // Boost entity
testFactories.leaderboardEntry(overrides?)  // Leaderboard entry

// Bulk creation helper
createMany(factory, count, customizer?)  // Create multiple entities
```

All factories accept partial overrides and return complete, valid objects with defaults for all required fields.

**Example:**
```typescript
const tournament = testFactories.tournament({ id: 'custom-1', short_name: 'WC2026' });
const users = createMany(testFactories.user, 3, (i) => ({ email: `user${i}@example.com` }));
```

---

## Test Types Overview

### Unit Tests for Utilities

Test pure functions in `app/utils/`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateGameScore } from '@/app/utils/game-score-calculator';

describe('calculateGameScore', () => {
  it('should award maximum points for exact score', () => {
    const result = calculateGameScore({ home: 2, away: 1 }, { home: 2, away: 1 });
    expect(result).toEqual({ points: 5, exactScore: true });
  });

  it('should award no points for incorrect prediction', () => {
    const result = calculateGameScore({ home: 0, away: 2 }, { home: 3, away: 1 });
    expect(result).toEqual({ points: 0 });
  });
});
```

### Component Tests

See `test-utilities.md` for complete examples with `renderWithTheme` and `renderWithProviders`.

**Quick decision:**
- Component with MUI only → `renderWithTheme(<Component />)`
- Component with context → `renderWithProviders(<Component />, { guessesContext: true })`
- Component with MUI + context → `renderWithProviders(...)` (theme included)

### Next.js Mocking

See `test-utilities.md` for router, search params, and auth mocking examples.

**Critical:** Always use `vi.fn()` at module level, configure mock behavior in `beforeEach`. **Never** use inline arrow functions in `vi.mock()` — causes Vitest collection to hang.

### Repository/Database Testing

See `test-utilities.md` for complete mocked and integration test examples.

**Decision:**
- Unit testing repo logic / fast CI feedback → use mock helpers (`createMockSelectQuery` etc.)
- Testing DB constraints, transactions, complex queries → use integration tests (real database)

---

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run coverage

# Run a single test file
npx vitest run __tests__/path/to/test-file.test.ts

# Run tests matching a pattern
npx vitest run --reporter=verbose -t "test name pattern"
```

### Testing in Worktrees

When working in a worktree, use absolute paths:

```bash
# ✅ CORRECT: Use absolute path
npx vitest run /Users/username/qatar-prode-story-42/__tests__/app/utils/calculator.test.ts

# ❌ INCORRECT: Relative path (runs tests from wrong directory)
cd /Users/username/qatar-prode-story-42
npx vitest run __tests__/app/utils/calculator.test.ts
```

---

## Best Practices

### DO

1. **Use test utilities** - `renderWithTheme()`, `renderWithProviders()` from `@/__tests__/utils/test-utils`
2. **Use test factories** - `testFactories.tournament()` instead of manual object creation
3. **Use mock helpers** - `createMockSelectQuery()` instead of building chains manually
4. **Test behavior** - `screen.getByText('Welcome')` not `component.state.isLoggedIn`
5. **Query by role/label** - `getByRole('button')`, `getByLabelText('Email')` not `getByTestId()`
6. **Use userEvent** - `await user.click()` not `fireEvent.click()`
7. **Clean up mocks** - `beforeEach(() => vi.clearAllMocks())`
8. **Test error paths** - Not just happy paths

### Query Priority (most to least preferred)

1. `getByRole` — Best for accessibility: `screen.getByRole('button', { name: 'Submit' })`
2. `getByLabelText` — Forms and inputs: `screen.getByLabelText('Email')`
3. `getByPlaceholderText` — When label isn't available
4. `getByText` — Text content: `screen.getByText('Welcome back')`
5. `getByDisplayValue` — Current form values
6. `getByAltText` — Images
7. `getByTitle` — Less common
8. `getByTestId` — **Last resort** (implementation detail)

---

## Section 10: Parallel Test Creation

When implementing 2+ files that need tests, launch multiple Haiku subagents in a **single message** (multiple Task calls):

```typescript
// All three Task calls in ONE message = parallel execution
Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Create tests for repository layer",
  prompt: `Create Vitest tests for [file].

Requirements:
- Use testFactories.* for mock data (MANDATORY — never create mock objects manually)
- Use createMockSelectQuery() for DB mocks (MANDATORY — never build Kysely chains manually)
- 80% coverage target
- Test happy path, errors, edge cases
- Import: import { createMockSelectQuery, createMockEmptyQuery, createMockErrorQuery } from '@/__tests__/db/mock-helpers'
- Import: import { testFactories } from '@/__tests__/db/test-factories'

[paste file content]`
})

Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Create tests for server action",
  prompt: `Create Vitest tests for [action file].

Requirements:
- Use testFactories.* for mock data
- Mock repository functions with vi.mock()
- Test: auth check (throws when unauthenticated), happy path, error handling
- 80% coverage target

[paste file content]`
})

Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Create tests for UI component",
  prompt: `Create Vitest tests for [component file].

Requirements:
- Use renderWithTheme() or renderWithProviders() (MANDATORY — never create local theme wrappers)
- Use testFactories.* for mock data
- Test: renders with valid props, handles empty/null state, user interaction triggers callback
- CRITICAL: Use vi.fn() for any vi.mock() calls, never inline arrow functions (causes hanging)
- 80% coverage target

[paste file content]`
})
```

**Key rules:**
- Single message = parallel execution (not sequential messages)
- Include file content and conventions in prompt
- Include mandatory imports in prompt to prevent wrong patterns
- Review outputs before running tests
- Main agent runs `npm run test` after all subagents complete

**When to use parallel test creation:**
- Always when implementing 2+ files that need tests
- ALWAYS when implementing a full feature (db + action + component)

**Subagent prompt must include:**
- The actual file content to test
- Mandatory imports (factories, mock helpers, test utils)
- What patterns are forbidden (inline mocks, manual chains, local theme wrappers)
- Coverage target (80%)
- Specific scenarios to test (happy path, auth failures, edge cases)

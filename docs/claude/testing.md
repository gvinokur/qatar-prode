# Testing Guide

## Testing Conventions

- **Test files**: `__tests__/` directory mirroring `app/` structure
- **Primary framework**: Vitest 3.2 with `@testing-library/react`
- **Coverage target**: 60% minimum (enforced by SonarCloud)
- **New code coverage**: 80%+ (enforced by SonarCloud)
- **Legacy**: Jest 29.7 (legacy integration tests)

## Test Utilities

All testing utilities are centralized in `__tests__/` for maximum reusability:

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

**Quick imports:**
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

**For complete guides, see:**
- **[Component Testing Guide](__tests__/utils/README.md)** - Theme and context providers
- **[Mock Utilities Guide](__tests__/mocks/README.md)** - Next.js and NextAuth mocking
- **[Database Testing Guide](__tests__/db/README.md)** - Repository and database mocking

### Quick Reference: Available Test Factories

All factories from `@/__tests__/db/test-factories`:

```typescript
testFactories.tournament(overrides?)    // Tournament entity
testFactories.user(overrides?)          // User entity
testFactories.team(overrides?)          // Team entity
testFactories.game(overrides?)          // Game entity
testFactories.gameGuess(overrides?)     // Game guess entity
testFactories.player(overrides?)        // Player entity
testFactories.tournamentGroupTeamStatsGuess(overrides?)  // Group stats guess
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

## Test Types

### Unit Tests for Utilities

Test pure functions in `app/utils/`:
- Calculators (scores, positions)
- Formatters (dates, numbers)
- Validators

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { calculateGameScore } from '@/app/utils/game-score-calculator';

describe('calculateGameScore', () => {
  it('should award maximum points for exact score', () => {
    const result = calculateGameScore(
      { home: 2, away: 1 },  // guess
      { home: 2, away: 1 }   // actual
    );
    expect(result).toEqual({ points: 5, exactScore: true });
  });

  it('should award medium points for correct winner and goal difference', () => {
    const result = calculateGameScore(
      { home: 3, away: 2 },  // guess
      { home: 2, away: 1 }   // actual
    );
    expect(result).toEqual({ points: 3, correctWinner: true, correctGoalDiff: true });
  });

  it('should award base points for correct winner only', () => {
    const result = calculateGameScore(
      { home: 2, away: 0 },  // guess
      { home: 3, away: 1 }   // actual
    );
    expect(result).toEqual({ points: 1, correctWinner: true });
  });

  it('should award no points for incorrect prediction', () => {
    const result = calculateGameScore(
      { home: 0, away: 2 },  // guess
      { home: 3, away: 1 }   // actual
    );
    expect(result).toEqual({ points: 0 });
  });
});
```

---

### Component Tests

**ALWAYS use component testing utilities from `@/__tests__/utils/test-utils`.**

#### Decision: renderWithTheme vs renderWithProviders

Use this decision tree:

```
Does component use context (GuessesContext, etc.)?
    ↓                           ↓
   YES                         NO
    ↓                           ↓
renderWithProviders()      Does it use MUI/theme?
(includes theme support)        ↓           ↓
                               YES         NO
                                ↓           ↓
                        renderWithTheme()  render()
```

**Key point:** `renderWithProviders()` includes theme support via options, so if you need context, always use it (even if you also need theme).

**Examples:**
- Component with MUI only → `renderWithTheme(<Component />)`
- Component with context only → `renderWithProviders(<Component />, { guessesContext: true })`
- Component with MUI + context → `renderWithProviders(<Component />, { guessesContext: true })` (theme is included)
- Plain React component → `render(<Component />)` (standard RTL)

#### Basic Components with Theme

Use `renderWithTheme()` for any component that uses MUI components or theme:

```typescript
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import { screen } from '@testing-library/react';
import { BoostBadge } from '@/app/components/boost-badge';

describe('BoostBadge', () => {
  it('should render with theme colors', () => {
    renderWithTheme(<BoostBadge boost="gold" />);

    const badge = screen.getByTestId('boost-badge');
    expect(badge).toHaveStyle({ backgroundColor: '#ffc107' });
  });

  it('should render in dark mode', () => {
    renderWithTheme(<BoostBadge boost="silver" />, { theme: 'dark' });

    expect(screen.getByTestId('boost-badge')).toBeInTheDocument();
  });
});
```

#### Components with Context Providers

Use `renderWithProviders()` for components that use contexts:

```typescript
import { renderWithProviders, createMockGuessesContext } from '@/__tests__/utils/test-utils';
import { testFactories } from '@/__tests__/db/test-factories';

describe('GameCard', () => {
  it('should display game guesses', () => {
    const mockGuesses = {
      'game-1': testFactories.gameGuess({
        game_id: 'game-1',
        home_team_score: 2,
        away_team_score: 1
      })
    };

    renderWithProviders(<GameCard gameId="game-1" />, {
      guessesContext: createMockGuessesContext({ gameGuesses: mockGuesses }),
      timezone: true
    });

    expect(screen.getByText('2 - 1')).toBeInTheDocument();
  });
});
```

**Available options:**
- `theme`: 'light' | 'dark'
- `themeOverrides`: Custom theme config
- `guessesContext`: Context mock (true for defaults, or partial override)
- `timezone`: boolean (wrap with TimezoneProvider)

**See [Component Testing Guide](__tests__/utils/README.md) for complete examples.**

---

### Next.js Mocking

**ALWAYS use mock utilities from `@/__tests__/mocks/` for Next.js hooks.**

#### Router Mocking

```typescript
import { createMockRouter } from '@/__tests__/mocks/next-navigation.mocks';
import { useRouter } from 'next/navigation';
import { vi } from 'vitest';

// Mock the module ONCE
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn()
}));

describe('LoginForm', () => {
  let mockRouter: ReturnType<typeof createMockRouter>;

  beforeEach(() => {
    mockRouter = createMockRouter();
    vi.mocked(useRouter).mockReturnValue(mockRouter);
  });

  it('should navigate after login', async () => {
    renderWithTheme(<LoginForm />);

    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
  });
});
```

#### Search Params Mocking

```typescript
import { createMockSearchParams } from '@/__tests__/mocks/next-navigation.mocks';
import { useSearchParams } from 'next/navigation';

describe('SearchableList', () => {
  it('should filter by search param', () => {
    const mockSearchParams = createMockSearchParams({ q: 'test query', status: 'active' });
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

    renderWithTheme(<SearchableList />);

    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
  });
});
```

#### Authentication Mocking

```typescript
import { createAuthenticatedSessionValue, createUnauthenticatedSessionValue } from '@/__tests__/mocks/next-auth.mocks';
import { useSession } from 'next-auth/react';

// Mock the module
vi.mock('next-auth/react');

describe('ProfilePage', () => {
  it('should display user info when authenticated', () => {
    const mockSession = createAuthenticatedSessionValue({
      id: 'user-123',
      email: 'test@example.com'
    });
    vi.mocked(useSession).mockReturnValue(mockSession);

    renderWithTheme(<ProfilePage />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('should redirect when not authenticated', () => {
    const mockSession = createUnauthenticatedSessionValue();
    vi.mocked(useSession).mockReturnValue(mockSession);

    const mockRouter = createMockRouter();
    vi.mocked(useRouter).mockReturnValue(mockRouter);

    renderWithTheme(<ProfilePage />);

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });
});
```

**See [Mock Utilities Guide](__tests__/mocks/README.md) for complete examples.**

---

### Repository/Database Testing

**MANDATORY: ALWAYS use helpers from `@/__tests__/db/mock-helpers.ts` for database mocking.**

**NEVER build Kysely query chains manually** - use the provided helpers.

#### Decision: Mock vs Integration Tests

Use this criteria:

**Use mock helpers (createMockSelectQuery, etc.) when:**
- ✅ Unit testing repository function logic
- ✅ Testing error handling and edge cases
- ✅ Need fast, isolated tests
- ✅ Testing business logic that uses repositories
- ✅ CI/CD pipeline (fast feedback)

**Use integration tests (real database) when:**
- ✅ Testing database constraints and validations
- ✅ Testing transactions and rollbacks
- ✅ Testing complex queries with joins
- ✅ End-to-end repository testing
- ✅ Final validation before deployment

**Best practice:** Write both - mocked tests for speed and isolation, integration tests for confidence.

#### Mocked Database Tests

```typescript
import { createMockSelectQuery, createMockInsertQuery } from '@/__tests__/db/mock-helpers';
import { testFactories } from '@/__tests__/db/test-factories';
import { mockDb } from '@/__tests__/vitest.setup';

describe('TournamentRepository', () => {
  it('should find tournament by id', async () => {
    // ALWAYS use test factories for mock data
    const mockTournament = testFactories.tournament({ id: 'tournament-1' });

    // ALWAYS use mock helpers for query chains
    const mockQuery = createMockSelectQuery(mockTournament);
    mockDb.selectFrom.mockReturnValue(mockQuery);

    const result = await tournamentRepository.findById('tournament-1');

    expect(result).toEqual(mockTournament);
    expect(mockQuery.execute).toHaveBeenCalled();
  });

  it('should create tournament', async () => {
    const newTournament = testFactories.tournament();
    const mockQuery = createMockInsertQuery(newTournament);
    mockDb.insertInto.mockReturnValue(mockQuery);

    const result = await tournamentRepository.create(newTournament);

    expect(result).toEqual(newTournament);
  });
});
```

**Available helpers:**
- `createMockSelectQuery(result)` - SELECT with single or array result
- `createMockEmptyQuery()` - SELECT returning []
- `createMockNullQuery()` - SELECT returning null
- `createMockErrorQuery(error?)` - Query that throws
- `createMockInsertQuery(result)` - INSERT returning created record
- `createMockUpdateQuery(result)` - UPDATE returning updated record(s)
- `createMockDeleteQuery(result)` - DELETE returning deleted record(s)

**See [Database Testing Guide](__tests__/db/README.md) for complete examples and all available helpers.**

---

### Database Integration Tests

Test repositories with real database queries:

**Example:**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { findUserByEmail, createUser } from '@/app/db/users-repository';
import { db } from '@/app/db/database';

describe('users-repository', () => {
  let testUserId: string;

  beforeEach(async () => {
    // Setup: Create test user
    testUserId = await createUser({
      email: 'test@example.com',
      nickname: 'testuser',
      password: 'hashedpassword'
    });
  });

  afterEach(async () => {
    // Cleanup: Delete test user
    await db.deleteFrom('users')
      .where('id', '=', testUserId)
      .execute();
  });

  it('should find user by email', async () => {
    const user = await findUserByEmail('test@example.com');

    expect(user).toBeDefined();
    expect(user?.email).toBe('test@example.com');
    expect(user?.nickname).toBe('testuser');
  });

  it('should return undefined for non-existent user', async () => {
    const user = await findUserByEmail('nonexistent@example.com');
    expect(user).toBeUndefined();
  });
});
```

---

## Running Tests

### Basic Commands

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

### ✅ DO

1. **Use test utilities** - `renderWithTheme()`, `renderWithProviders()` from `@/__tests__/utils/test-utils`
2. **Use test factories** - `testFactories.tournament()` instead of manual object creation
3. **Use mock helpers** - `createMockSelectQuery()` instead of building chains manually
4. **Test behavior** - `screen.getByText('Welcome')` not `component.state.isLoggedIn`
5. **Query by role/label** - `getByRole('button')`, `getByLabelText('Email')` not `getByTestId()`
6. **Use userEvent** - `await user.click()` not `fireEvent.click()`
7. **Clean up mocks** - `beforeEach(() => vi.clearAllMocks())`
8. **Test error paths** - Not just happy paths

### ❌ DON'T

1. **Don't duplicate theme setup** - Use `renderWithTheme()` from test utilities
2. **Don't duplicate context wrappers** - Use `renderWithProviders()` from test utilities
3. **Don't mock Next.js inline** - Use `createMockRouter()` from `@/__tests__/mocks/`
4. **Don't build query chains manually** - Use mock helpers from `@/__tests__/db/mock-helpers`
5. **Don't create mock data manually** - Use test factories from `@/__tests__/db/test-factories`
6. **Don't use `as any`** - Use properly typed mocks
7. **Don't use fireEvent** - Use userEvent for realistic interactions
8. **Don't test implementation details** - Test user-visible behavior

**For detailed examples of each, see the utility-specific README files:**
- Component testing: `__tests__/utils/README.md`
- Next.js mocking: `__tests__/mocks/README.md`
- Database testing: `__tests__/db/README.md`

---

## Query Priority

**Use this query priority (most to least preferred):**

1. **`getByRole`** - Best for accessibility
   ```typescript
   screen.getByRole('button', { name: 'Submit' })
   screen.getByRole('heading', { name: 'Page Title' })
   screen.getByRole('textbox', { name: 'Email' })
   ```

2. **`getByLabelText`** - Forms and inputs
   ```typescript
   screen.getByLabelText('Email')
   screen.getByLabelText('Password')
   ```

3. **`getByPlaceholderText`** - When label isn't available
   ```typescript
   screen.getByPlaceholderText('Enter your email')
   ```

4. **`getByText`** - Text content
   ```typescript
   screen.getByText('Welcome back')
   screen.getByText(/welcome/i) // Case-insensitive regex
   ```

5. **`getByDisplayValue`** - Current form values
   ```typescript
   screen.getByDisplayValue('john@example.com')
   ```

6. **`getByAltText`** - Images
   ```typescript
   screen.getByAltText('User avatar')
   ```

7. **`getByTitle`** - Less common
   ```typescript
   screen.getByTitle('Close dialog')
   ```

8. **`getByTestId`** - Last resort (implementation detail)
   ```typescript
   // Only use when no better option exists
   screen.getByTestId('custom-widget')
   ```

**Example:**
```typescript
it('should submit form with correct values', async () => {
  const user = userEvent.setup();
  renderWithTheme(<LoginForm />);

  // ✅ GOOD - Query by label (accessible)
  const emailInput = screen.getByLabelText('Email');
  const passwordInput = screen.getByLabelText('Password');

  await user.type(emailInput, 'test@example.com');
  await user.type(passwordInput, 'password123');

  // ✅ GOOD - Query by role (accessible)
  await user.click(screen.getByRole('button', { name: 'Sign In' }));

  // ✅ GOOD - Query by text (user-visible)
  expect(await screen.findByText('Login successful')).toBeInTheDocument();
});
```

---

## Mocking

### Mocking AWS S3

When testing file uploads:

```typescript
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Mock = mockClient(S3Client);

describe('file upload', () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it('should upload file to S3', async () => {
    s3Mock.on(PutObjectCommand).resolves({
      ETag: '"mock-etag"'
    });

    const result = await uploadFile('test.png', buffer);

    expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'test-bucket',
      Key: expect.stringContaining('test.png')
    });
  });
});
```

### Mocking Server Actions

When testing Client Components that call Server Actions:

```typescript
import { vi } from 'vitest';
import * as actions from '@/app/actions/game-actions';

vi.mock('@/app/actions/game-actions', () => ({
  submitGuess: vi.fn()
}));

describe('GuessForm', () => {
  it('should submit guess on form submit', async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.mocked(actions.submitGuess);

    render(<GuessForm gameId="game-123" />);

    await user.type(screen.getByLabelText('Home Score'), '2');
    await user.type(screen.getByLabelText('Away Score'), '1');
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(mockSubmit).toHaveBeenCalledWith('game-123', {
      homeScore: 2,
      awayScore: 1
    });
  });
});
```

---

## User Interactions

### Use userEvent for interactions

```typescript
import { userEvent } from '@testing-library/user-event';

describe('LoginForm', () => {
  it('should submit form', async () => {
    const user = userEvent.setup();
    renderWithTheme(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(mockSignIn).toHaveBeenCalled();
  });
});
```

**❌ DON'T use fireEvent:**
```typescript
// ❌ DON'T USE fireEvent - doesn't simulate real user behavior
fireEvent.change(input, { target: { value: 'test' } });
fireEvent.click(button);
```

**✅ DO use userEvent:**
```typescript
// ✅ USE userEvent - simulates real user interactions
const user = userEvent.setup();
await user.type(input, 'test');
await user.click(button);
```

---

## Async Testing

### Waiting for Elements

```typescript
import { waitFor, screen } from '@testing-library/react';

it('should display loading then data', async () => {
  renderWithTheme(<AsyncComponent />);

  // Loading state
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for data
  await waitFor(() => {
    expect(screen.getByText(/data loaded/i)).toBeInTheDocument();
  });
});
```

### Finding Elements that Appear Asynchronously

```typescript
it('should display success message', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Form />);

  await user.click(screen.getByRole('button', { name: /submit/i }));

  // Use findBy* for async elements
  expect(await screen.findByText(/success/i)).toBeInTheDocument();
});
```

---

## Code Coverage Requirements

### SonarCloud Quality Gate

Tests must meet these minimums to pass:
- **Overall coverage**: ≥60%
- **New code coverage**: ≥80% (on new lines added in PR)
- **Security rating**: A
- **Maintainability**: B or higher
- **Duplicated code**: <5%

### Checking Coverage Locally

```bash
# Generate coverage report
npm run coverage

# View HTML report
open coverage/index.html
```

### Coverage Exceptions

Some files can be excluded from coverage:
- Configuration files (`*.config.ts`, `*.config.js`)
- Type definitions (`*.d.ts`)
- Migration scripts
- Entry points (`middleware.ts`, `auth.ts`)

Add exclusions in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    coverage: {
      exclude: [
        '*.config.ts',
        '*.config.js',
        'middleware.ts',
        'auth.ts',
        'migrations/**'
      ]
    }
  }
});
```

---

## Testing Checklist

Before committing tests, verify:

### Test Quality
- [ ] All tests pass locally (`npm run test`)
- [ ] Coverage meets requirements (`npm run coverage`)
  - [ ] Overall coverage ≥60%
  - [ ] New code coverage ≥80%
- [ ] Tests follow Arrange-Act-Assert pattern
- [ ] Descriptive test names explain behavior
- [ ] No `console.log` or debugging code left in tests

### Test Utilities Usage
- [ ] Using `renderWithTheme()` for MUI components
- [ ] Using `renderWithProviders()` for components with context
- [ ] Using mock utilities from `@/__tests__/mocks/` for Next.js hooks
- [ ] Using mock helpers from `@/__tests__/db/mock-helpers` for database
- [ ] Using test factories from `@/__tests__/db/test-factories` for mock data

### Query Selection
- [ ] Using accessibility-first queries (`getByRole`, `getByLabelText`)
- [ ] Avoiding `getByTestId` unless necessary
- [ ] Using `userEvent` (not `fireEvent`)

### Test Independence
- [ ] Each test can run independently
- [ ] Using `beforeEach` for setup, `afterEach` for cleanup
- [ ] Mocks are cleaned up between tests (`vi.clearAllMocks()`)

### Best Practices
- [ ] Testing behavior, not implementation details
- [ ] Testing both happy paths and error cases
- [ ] Awaiting async operations properly
- [ ] No `as any` type casts (using typed mocks)

---

## Common Issues

### "Cannot find module" errors

Ensure path aliases are configured in `vitest.config.ts`:

```typescript
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app')
    }
  }
});
```

### Tests timing out

Increase timeout for slow operations:

```typescript
it('should process large dataset', async () => {
  const result = await processLargeDataset();
  expect(result).toBeDefined();
}, 10000); // 10 second timeout
```

### Database connection errors

Ensure `.env.local` is present with `DATABASE_URL` when running integration tests.

### Tests pass locally but fail in CI

Check for:
- Timezone differences (use UTC in tests)
- Race conditions (async operations not awaited)
- File system paths (use cross-platform paths)
- Environment variables (CI needs same vars as local)

---

## Parallel Test Creation (RECOMMENDED)

When implementing 2 or more files that need tests, create tests in parallel using subagents for significant time savings.

### When to Use

**ALWAYS use when:**
- Implementing 2+ components
- Implementing 2+ utilities
- Implementing 2+ server actions
- Implementing 2+ repository functions

**Example:** After implementing files A, B, C - create tests for all 3 in parallel

### Benefits

- **2-3x faster** than sequential test creation
- **Consistent quality** - all follow same conventions
- **Cost efficient** - use Haiku model
- **No dependencies** - tests are naturally independent

### Process

**Step 1: Complete implementation of multiple files**

```typescript
// Files implemented:
// - app/components/FeatureA.tsx
// - app/components/FeatureB.tsx
// - app/utils/calculator.ts
```

**Step 2: Launch parallel test subagents**

**CRITICAL: Use a SINGLE message with multiple Task calls for true parallelism**

```typescript
// Launch 3 subagents in parallel (single message, three Task calls)

// Subagent 1: Test FeatureA component
Task({
  subagent_type: "general-purpose",
  model: "haiku", // Use Haiku for cost efficiency
  description: "Create tests for FeatureA",
  prompt: `Create comprehensive tests for the FeatureA component.

Implementation file:
${await Read({ file_path: \`\${WORKTREE_PATH}/app/components/FeatureA.tsx\` })}

Testing conventions:
${await Read({ file_path: '/Users/gvinokur/Personal/qatar-prode/docs/claude/testing.md' })}

Requirements:
1. Create test file at: \${WORKTREE_PATH}/__tests__/components/FeatureA.test.tsx
2. Use Vitest + @testing-library/react
3. MUST use renderWithTheme() or renderWithProviders() from @/__tests__/utils/test-utils
4. Test all user interactions and rendering scenarios
5. Test edge cases and error handling
6. Aim for >80% coverage
7. Follow Arrange-Act-Assert pattern
8. Use existing tests as examples (e.g., __tests__/components/GameCard.test.tsx)

Use the Write tool to create the test file.
`
})

// Subagent 2: Test FeatureB component (parallel to Subagent 1)
Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Create tests for FeatureB",
  prompt: `Create comprehensive tests for the FeatureB component.

Implementation file:
${await Read({ file_path: \`\${WORKTREE_PATH}/app/components/FeatureB.tsx\` })}

Requirements:
1. Create test file at: \${WORKTREE_PATH}/__tests__/components/FeatureB.test.tsx
2. Use Vitest + @testing-library/react
3. MUST use renderWithTheme() or renderWithProviders() from @/__tests__/utils/test-utils
4. Test all props combinations and interactions
5. Test edge cases
6. Aim for >80% coverage

Use the Write tool to create the test file.
`
})

// Subagent 3: Test calculator utility (parallel to Subagents 1 & 2)
Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Create tests for calculator",
  prompt: `Create comprehensive tests for the calculator utility.

Implementation file:
${await Read({ file_path: \`\${WORKTREE_PATH}/app/utils/calculator.ts\` })}

Requirements:
1. Create test file at: \${WORKTREE_PATH}/__tests__/utils/calculator.test.ts
2. Use Vitest
3. Test all functions with multiple scenarios
4. Test edge cases (empty inputs, boundaries, invalid data)
5. Aim for 100% coverage (utilities should be fully tested)

Use the Write tool to create the test file.
`
})
```

**Step 3: Review subagent outputs**

```typescript
// After all subagents complete, review each test file
Read({ file_path: `${WORKTREE_PATH}/__tests__/components/FeatureA.test.tsx` })
Read({ file_path: `${WORKTREE_PATH}/__tests__/components/FeatureB.test.tsx` })
Read({ file_path: `${WORKTREE_PATH}/__tests__/utils/calculator.test.ts` })

// Check for:
// - Proper structure (describe blocks, it blocks)
// - Good test coverage (happy path + edge cases)
// - Correct imports and setup
// - Following conventions (Arrange-Act-Assert)
// - Descriptive test names
// - MANDATORY utility usage (renderWithTheme, test factories, etc.)
```

**Step 4: Run all tests and verify**

```bash
# Run all new tests
npm run test

# Check coverage
npm run coverage

# Expected: All tests pass, >80% coverage on new code
```

**Step 5: Fix any issues**

If tests fail or coverage is low:
- Review test logic
- Add missing test cases
- Fix implementation bugs if found

### Context for Test Subagents

**Include in subagent prompt:**
- ✅ Implementation file being tested
- ✅ Testing conventions (this document or key excerpts)
- ✅ **MANDATORY** utilities reminder (renderWithTheme, test factories, mock helpers)
- ✅ Example test file as reference (optional but helpful)
- ✅ Related types/interfaces (if component uses them)

**DO NOT include:**
- ❌ Entire codebase
- ❌ Unrelated files
- ❌ Multiple example test files (pick best one)

### Example: Testing 3 Files

```
Implementation complete:
- app/components/ProfileForm.tsx
- app/actions/profile-actions.ts
- app/db/profile-repository.ts

Launch 3 test subagents in parallel:
1. Test ProfileForm component (UI interactions, validation)
2. Test profile-actions (server action logic, auth checks)
3. Test profile-repository (database queries with mock helpers)

Wait for completion: ~5 minutes (vs ~15 minutes sequential)
Review: Check structure, coverage, utility usage
Run: npm run test (all should pass)
Result: 3 test files created in parallel, >80% coverage
```

### When NOT to Use Parallel Test Creation

**Don't parallelize when:**
- Only 1 file needs tests (overhead not worth it)
- Tests have dependencies on each other (rare, but possible)
- Implementation is still in flux (wait until stable)

**Instead:** Create tests sequentially yourself

---

## Writing Tests for New Code

When implementing new features:

1. **Create tests in parallel** if 2+ files implemented (see above)
2. **ALWAYS use test utilities** - renderWithTheme, test factories, mock helpers
3. **Test happy path AND edge cases**
4. **Aim for >80% coverage on new code**
5. **Run tests locally before pushing**: `npm run test`
6. **Check coverage**: `npm run coverage`
7. **Verify utility usage** - check Testing Checklist

### Example TDD Workflow

```bash
# 1. Write failing test
echo "describe('newFeature', () => {
  it('should work', () => {
    expect(newFeature()).toBe('expected');
  });
});" > __tests__/new-feature.test.ts

# 2. Run test (should fail)
npx vitest run __tests__/new-feature.test.ts

# 3. Implement feature
# (write code in app/new-feature.ts)

# 4. Run test again (should pass)
npx vitest run __tests__/new-feature.test.ts

# 5. Check coverage
npm run coverage
```

---

## Git Hooks

Pre-commit hooks automatically run:
- Tests for modified test files
- Linting for modified app files

Configured via Husky and lint-staged.

If tests fail, commit is blocked until issues are resolved.

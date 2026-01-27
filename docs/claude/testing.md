# Testing Guide

## Testing Conventions

- **Test files**: `__tests__/` directory mirroring `app/` structure
- **Primary framework**: Vitest 3.2 with `@testing-library/react`
- **Coverage target**: 60% minimum (enforced by SonarCloud)
- **Legacy**: Jest 29.7 (legacy integration tests)

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

### Component Tests

Test React components with `@testing-library/react`:

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import ComponentName from '@/app/components/ComponentName';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<ComponentName onClick={handleClick} />);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

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

### Mocking Database

For unit tests that need to isolate from database:

```typescript
import { vi } from 'vitest';
import * as userRepo from '@/app/db/users-repository';

describe('user action', () => {
  it('should handle user creation', async () => {
    const mockCreateUser = vi.spyOn(userRepo, 'createUser').mockResolvedValue('user-123');

    const result = await createUserAction({ email: 'test@example.com' });

    expect(mockCreateUser).toHaveBeenCalledWith({
      email: 'test@example.com'
    });
    expect(result).toBe('user-123');

    mockCreateUser.mockRestore();
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

## Best Practices

### Test Structure

Follow the Arrange-Act-Assert pattern:

```typescript
it('should do something', () => {
  // Arrange: Setup test data and mocks
  const input = { value: 42 };
  const expected = 84;

  // Act: Execute the code under test
  const result = doublValue(input.value);

  // Assert: Verify the result
  expect(result).toBe(expected);
});
```

### Test Names

Use descriptive test names that explain behavior:

```typescript
// ✅ GOOD: Describes behavior and expected outcome
it('should award bonus points when predicting penalty shootout winner', () => {
  // ...
});

// ❌ BAD: Too vague
it('should work correctly', () => {
  // ...
});
```

### Test Independence

Each test should be independent and idempotent:

```typescript
// ✅ GOOD: Uses beforeEach for setup, afterEach for cleanup
describe('user repository', () => {
  let userId: string;

  beforeEach(async () => {
    userId = await createTestUser();
  });

  afterEach(async () => {
    await deleteTestUser(userId);
  });

  it('should find user', async () => {
    const user = await findUser(userId);
    expect(user).toBeDefined();
  });
});

// ❌ BAD: Tests depend on each other
describe('user repository', () => {
  let userId: string;

  it('should create user', async () => {
    userId = await createUser(); // State leaks to next test
  });

  it('should find user', async () => {
    const user = await findUser(userId); // Depends on previous test
  });
});
```

### Async Testing

Always await async operations:

```typescript
// ✅ GOOD: Properly awaits async operations
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});

// ❌ BAD: Doesn't await, test passes before operation completes
it('should fetch data', () => {
  const data = fetchData();
  expect(data).toBeDefined(); // Wrong: data is a Promise
});
```

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

## Writing Tests for New Code

When implementing new features:

1. **Write tests BEFORE implementation** (TDD approach)
2. **Test happy path AND edge cases**
3. **Aim for >80% coverage on new code**
4. **Run tests locally before pushing**: `npm run test`
5. **Check coverage**: `npm run coverage`

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

## Git Hooks

Pre-commit hooks automatically run:
- Tests for modified test files
- Linting for modified app files

Configured via Husky and lint-staged.

If tests fail, commit is blocked until issues are resolved.

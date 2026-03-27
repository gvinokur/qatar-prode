# Test Utilities — Detailed Examples

Complete examples for all test types. Referenced from `/test-engineer` SKILL.md.

## Component Testing with renderWithTheme / renderWithProviders

### Decision: renderWithTheme vs renderWithProviders

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

### Basic Components with Theme

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

### Components with Context Providers

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

**Available options for renderWithProviders:**
- `theme`: 'light' | 'dark'
- `themeOverrides`: Custom theme config
- `guessesContext`: Context mock (true for defaults, or partial override)
- `timezone`: boolean (wrap with TimezoneProvider)

---

## Next.js Mocking Examples

### Router Mocking

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

### Search Params Mocking

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

### Authentication Mocking

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

---

## Database Testing Examples

### Mocked Database Tests

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

  it('should return null when not found', async () => {
    const mockQuery = createMockNullQuery();
    mockDb.selectFrom.mockReturnValue(mockQuery);

    const result = await tournamentRepository.findById('nonexistent');
    expect(result).toBeNull();
  });

  it('should create tournament', async () => {
    const newTournament = testFactories.tournament();
    const mockQuery = createMockInsertQuery(newTournament);
    mockDb.insertInto.mockReturnValue(mockQuery);

    const result = await tournamentRepository.create(newTournament);

    expect(result).toEqual(newTournament);
  });

  it('should throw on database error', async () => {
    const mockQuery = createMockErrorQuery(new Error('DB error'));
    mockDb.selectFrom.mockReturnValue(mockQuery);

    await expect(tournamentRepository.findById('id')).rejects.toThrow('DB error');
  });
});
```

### All Available Mock Helpers

```typescript
// SELECT with single or array result
createMockSelectQuery(result)

// SELECT returning []
createMockEmptyQuery()

// SELECT returning null
createMockNullQuery()

// Query that throws
createMockErrorQuery(error?)

// INSERT returning created record
createMockInsertQuery(result)

// UPDATE returning updated record(s)
createMockUpdateQuery(result)

// DELETE returning deleted record(s)
createMockDeleteQuery(result)
```

### Database Integration Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { findUserByEmail, createUser } from '@/app/db/users-repository';
import { db } from '@/app/db/database';

describe('users-repository', () => {
  let testUserId: string;

  beforeEach(async () => {
    testUserId = await createUser({
      email: 'test@example.com',
      nickname: 'testuser',
      password: 'hashedpassword'
    });
  });

  afterEach(async () => {
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

## i18n Testing (next-intl Mocking)

**CRITICAL: Use `vi.fn()` pattern — NEVER inline arrow functions at module level.**

### Why Inline Functions Cause Hanging

```typescript
// ❌ DON'T DO THIS - Test will hang during collection
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = { /* ... */ };
    return translations[key] || key;
  },
  useLocale: () => 'es',
}));
```

**Symptoms of the wrong pattern:**
- Test hangs during collection (before any test runs)
- No console output, no error message
- Timeout after 60+ seconds
- `0 tests` collected

### Correct Pattern (vi.fn() + beforeEach)

```typescript
// ✅ DO THIS - Mock at module level with vi.fn()
import { useTranslations, useLocale } from 'next-intl';
import { vi } from 'vitest';

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(),
}));

// Define mock implementation
const mockT = vi.fn((key: string) => {
  const translations: Record<string, string> = {
    'resetPassword.title': 'Reset Password',
    'resetPassword.newPassword.label': 'New Password',
    // ... more translations
  };
  return translations[key] || key;
});

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    // Setup mock behavior in beforeEach
    vi.mocked(useTranslations).mockReturnValue(mockT);
    vi.mocked(useLocale).mockReturnValue('es');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render with translations', () => {
    renderWithTheme(<ResetPasswordPage />);
    expect(screen.getByText('Reset Password')).toBeInTheDocument();
  });
});
```

---

## Common Mistakes

| Mistake | Correct Approach |
|---------|------------------|
| `renderWithTheme` for context component | Use `renderWithProviders()` instead |
| Build Kysely chains manually | Use `createMockSelectQuery()` etc. from mock-helpers |
| Create mock data inline (`{ id: '1', ... }`) | Use `testFactories.user({ id: '1' })` |
| Inline arrow fn in `vi.mock()` | Use `vi.fn()` at module level, configure in `beforeEach` |
| Mock Next.js with `as any` | Use `createMockRouter()` from mocks |
| Use `fireEvent` | Use `userEvent.setup()` for realistic interactions |
| Query by `testId` first | Prefer `getByRole` > `getByLabelText` > `getByText` > `getByTestId` |
| Test implementation details | Test user-visible behavior |

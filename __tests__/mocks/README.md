# Mock Utilities Guide

This directory contains reusable mock utilities for testing Next.js hooks and NextAuth functionality.

## Contents

- **next-navigation.mocks.ts** - Mock factories for Next.js App Router hooks (`useRouter`, `useSearchParams`)
- **next-auth.mocks.ts** - Mock factories for NextAuth session management (`useSession`, `signIn`)

## Quick Start

```typescript
import { createMockRouter, createMockSearchParams } from '@/__tests__/mocks/next-navigation.mocks';
import { createAuthenticatedSessionValue } from '@/__tests__/mocks/next-auth.mocks';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { vi } from 'vitest';

// Mock router
const mockRouter = createMockRouter();
vi.mocked(useRouter).mockReturnValue(mockRouter);

// Mock session
const mockSession = createAuthenticatedSessionValue({ id: 'user-123' });
vi.mocked(useSession).mockReturnValue(mockSession);
```

---

## Next.js Router Mocking

### createMockRouter()

Creates a fully typed mock AppRouterInstance with all required methods. This is a **pure factory function** - it doesn't modify any modules or globals.

#### Function Signature

```typescript
function createMockRouter(
  overrides?: Partial<MockRouter>
): MockRouter

type MockRouter = ReturnType<typeof useRouter>
```

#### Default Methods

All methods are Vitest mock functions (`vi.fn()`):
- `push` - Navigate to new route
- `replace` - Replace current route
- `refresh` - Refresh current route
- `back` - Navigate back
- `forward` - Navigate forward
- `prefetch` - Prefetch route

#### Usage Examples

##### Basic Router Mock

```typescript
import { createMockRouter } from '@/__tests__/mocks/next-navigation.mocks';
import { useRouter } from 'next/navigation';
import { vi } from 'vitest';

// Mock the module ONCE in test file or setup
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

##### Custom Router Behavior

```typescript
it('should handle navigation error', async () => {
  const mockRouter = createMockRouter({
    push: vi.fn().mockRejectedValue(new Error('Navigation failed'))
  });
  vi.mocked(useRouter).mockReturnValue(mockRouter);

  renderWithTheme(<MyComponent />);

  await userEvent.click(screen.getByRole('button'));

  expect(screen.getByText('Navigation failed')).toBeInTheDocument();
});
```

##### Testing Router Methods

```typescript
it('should prefetch routes on hover', async () => {
  const mockRouter = createMockRouter();
  vi.mocked(useRouter).mockReturnValue(mockRouter);

  renderWithTheme(<NavigationMenu />);

  await userEvent.hover(screen.getByRole('link', { name: 'Dashboard' }));

  expect(mockRouter.prefetch).toHaveBeenCalledWith('/dashboard');
});

it('should go back when cancel button clicked', async () => {
  const mockRouter = createMockRouter();
  vi.mocked(useRouter).mockReturnValue(mockRouter);

  renderWithTheme(<EditForm />);

  await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

  expect(mockRouter.back).toHaveBeenCalled();
});
```

---

### createMockSearchParams()

Creates a fully typed mock ReadonlyURLSearchParams with all required methods. Returns mock functions with **default behavior** based on provided params.

#### Function Signature

```typescript
function createMockSearchParams(
  params?: Record<string, string>
): MockSearchParams

type MockSearchParams = ReturnType<typeof useSearchParams>
```

#### Available Methods

All methods are Vitest mock functions with default implementations:
- `get(name)` - Get single param value
- `getAll(name)` - Get all values for param
- `has(name)` - Check if param exists
- `forEach(callback)` - Iterate over params
- `entries()` - Get entries iterator
- `keys()` - Get keys iterator
- `values()` - Get values iterator
- `toString()` - Convert to query string

#### Usage Examples

##### Basic Search Params Mock

```typescript
import { createMockSearchParams } from '@/__tests__/mocks/next-navigation.mocks';
import { useSearchParams } from 'next/navigation';
import { vi } from 'vitest';

// Mock the module
vi.mock('next/navigation');

describe('SearchableList', () => {
  it('should filter by search param', () => {
    const mockSearchParams = createMockSearchParams({ q: 'test query', status: 'active' });
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

    renderWithTheme(<SearchableList />);

    expect(screen.getByDisplayValue('test query')).toBeInTheDocument();
    expect(screen.getByText(/Active items/)).toBeInTheDocument();
  });
});
```

##### Empty Search Params

```typescript
it('should show all items when no search params', () => {
  const mockSearchParams = createMockSearchParams(); // Empty params
  vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

  renderWithTheme(<SearchableList />);

  expect(screen.getByText('All items')).toBeInTheDocument();
});
```

##### Override Default Behavior

```typescript
it('should handle custom param logic', () => {
  const mockSearchParams = createMockSearchParams({ page: '2' });

  // Override specific method
  mockSearchParams.get.mockImplementation((name) => {
    if (name === 'page') return '5'; // Custom value
    return null;
  });

  vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

  renderWithTheme(<Pagination />);

  expect(screen.getByText('Page 5')).toBeInTheDocument();
});
```

---

## NextAuth Mocking

### createAuthenticatedSessionValue()

Creates a mock SessionContextValue for authenticated state. Returns a complete session context with user data and `'authenticated'` status.

#### Function Signature

```typescript
function createAuthenticatedSessionValue(
  userOverrides?: Partial<Session['user']>
): SessionContextValue

interface Session {
  user: {
    id: string;
    email: string;
    name: string;
  };
  expires: string;
}
```

#### Default Values

- `data.user.id`: `'1'`
- `data.user.email`: `'test@example.com'`
- `data.user.name`: `'Test User'`
- `status`: `'authenticated'`
- `update`: Mock function

#### Usage Examples

##### Basic Authenticated Session

```typescript
import { createAuthenticatedSessionValue } from '@/__tests__/mocks/next-auth.mocks';
import { useSession } from 'next-auth/react';
import { vi } from 'vitest';

// Mock the module
vi.mock('next-auth/react');

describe('ProfilePage', () => {
  it('should display user info', () => {
    const mockSession = createAuthenticatedSessionValue({
      id: 'user-123',
      email: 'john@example.com',
      name: 'John Doe'
    });
    vi.mocked(useSession).mockReturnValue(mockSession);

    renderWithTheme(<ProfilePage />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
```

##### Use Default Values

```typescript
it('should render with default session', () => {
  const mockSession = createAuthenticatedSessionValue(); // Uses defaults
  vi.mocked(useSession).mockReturnValue(mockSession);

  renderWithTheme(<ProfilePage />);

  expect(screen.getByText('Test User')).toBeInTheDocument();
});
```

##### Override Specific Fields

```typescript
it('should display custom user name', () => {
  const mockSession = createAuthenticatedSessionValue({
    name: 'Custom Name' // Only override name
  });
  vi.mocked(useSession).mockReturnValue(mockSession);

  renderWithTheme(<ProfilePage />);

  expect(screen.getByText('Custom Name')).toBeInTheDocument();
  // Other fields use defaults:
  // - id: '1'
  // - email: 'test@example.com'
});
```

---

### createUnauthenticatedSessionValue()

Creates a mock SessionContextValue for unauthenticated state. Returns session context with `null` data and `'unauthenticated'` status.

#### Function Signature

```typescript
function createUnauthenticatedSessionValue(): SessionContextValue
```

#### Default Values

- `data`: `null`
- `status`: `'unauthenticated'`
- `update`: Mock function

#### Usage Examples

##### Basic Unauthenticated Session

```typescript
import { createUnauthenticatedSessionValue } from '@/__tests__/mocks/next-auth.mocks';
import { useSession } from 'next-auth/react';
import { vi } from 'vitest';

describe('AuthGuard', () => {
  it('should redirect when not authenticated', () => {
    const mockSession = createUnauthenticatedSessionValue();
    vi.mocked(useSession).mockReturnValue(mockSession);

    const mockRouter = createMockRouter();
    vi.mocked(useRouter).mockReturnValue(mockRouter);

    renderWithTheme(<AuthGuard><ProtectedContent /></AuthGuard>);

    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });
});
```

##### Show Login Form

```typescript
it('should show login form for unauthenticated users', () => {
  const mockSession = createUnauthenticatedSessionValue();
  vi.mocked(useSession).mockReturnValue(mockSession);

  renderWithTheme(<HomePage />);

  expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
});
```

---

### createMockSignIn()

Creates a mock signIn function with configurable result. Returns a Vitest mock function that resolves with the specified result.

#### Function Signature

```typescript
function createMockSignIn(
  result?: { ok: boolean; error?: string }
): MockedFunction<typeof signIn>
```

#### Default Result

- `ok`: `true`
- `error`: undefined

#### Usage Examples

##### Successful Sign In

```typescript
import { createMockSignIn } from '@/__tests__/mocks/next-auth.mocks';
import { signIn } from 'next-auth/react';
import { vi } from 'vitest';

describe('LoginForm', () => {
  it('should handle login success', async () => {
    const mockSignIn = createMockSignIn({ ok: true });
    vi.mocked(signIn).mockImplementation(mockSignIn);

    renderWithTheme(<LoginForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(mockSignIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password123',
      redirect: false
    });

    expect(screen.getByText('Login successful')).toBeInTheDocument();
  });
});
```

##### Failed Sign In

```typescript
it('should handle login failure', async () => {
  const mockSignIn = createMockSignIn({ ok: false, error: 'Invalid credentials' });
  vi.mocked(signIn).mockImplementation(mockSignIn);

  renderWithTheme(<LoginForm />);

  await userEvent.type(screen.getByLabelText('Email'), 'wrong@example.com');
  await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
  await userEvent.click(screen.getByRole('button', { name: 'Login' }));

  expect(mockSignIn).toHaveBeenCalled();
  expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
});
```

---

## Type Safety Benefits

All mock utilities are **fully typed** - no `as any` casts needed!

### Before: Unsafe Inline Mocking

```typescript
// ❌ BAD - Type unsafe, error-prone
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}));

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  // Missing methods! Runtime errors possible
} as any; // Type safety lost

(useRouter as any).mockReturnValue(mockRouter);
```

### After: Type-Safe Mock Utilities

```typescript
// ✅ GOOD - Fully typed, all methods present
import { createMockRouter } from '@/__tests__/mocks/next-navigation.mocks';
import { useRouter } from 'next/navigation';

const mockRouter = createMockRouter(); // Complete, typed router
vi.mocked(useRouter).mockReturnValue(mockRouter);

// TypeScript ensures all methods exist
mockRouter.push('/dashboard'); // ✓ Type-safe
mockRouter.invalidMethod(); // ✗ Compile error
```

### Type Inference

Mock utilities use `ReturnType<typeof hook>` to infer correct types directly from Next.js:

```typescript
// Automatically typed from Next.js
type MockRouter = ReturnType<typeof useRouter>;
type MockSearchParams = ReturnType<typeof useSearchParams>;

// No manual type definitions needed!
```

---

## DO NOT DO - Common Antipatterns

### ❌ Don't Mock Inline with `as any`

```typescript
// ❌ BAD - Loses type safety, error-prone
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}));

const mockPush = vi.fn();
(useRouter as any).mockReturnValue({
  push: mockPush,
  replace: vi.fn()
  // Missing methods!
} as any);
```

✅ **GOOD - Use typed mock factory:**

```typescript
// ✅ GOOD - Type-safe and complete
import { createMockRouter } from '@/__tests__/mocks/next-navigation.mocks';
const mockRouter = createMockRouter();
vi.mocked(useRouter).mockReturnValue(mockRouter);
```

### ❌ Don't Create Partial Mocks

```typescript
// ❌ BAD - Incomplete mock, missing methods cause runtime errors
const mockRouter = {
  push: vi.fn()
  // Where are replace, refresh, back, forward, prefetch?
};
(useRouter as any).mockReturnValue(mockRouter);

// Component calls router.refresh() → runtime error!
```

✅ **GOOD - Use complete mock:**

```typescript
// ✅ GOOD - All methods present
const mockRouter = createMockRouter();
vi.mocked(useRouter).mockReturnValue(mockRouter);
// Component can call ANY router method safely
```

### ❌ Don't Build URLSearchParams Manually

```typescript
// ❌ BAD - Manual, verbose, error-prone
const mockGet = vi.fn((name) => {
  if (name === 'q') return 'test';
  if (name === 'page') return '2';
  return null;
});
const mockSearchParams = {
  get: mockGet,
  has: vi.fn(),
  // ... more manual setup
} as any;
```

✅ **GOOD - Use factory with params:**

```typescript
// ✅ GOOD - Clean, declarative
const mockSearchParams = createMockSearchParams({
  q: 'test',
  page: '2'
});
vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);
```

### ❌ Don't Create Session Objects Manually

```typescript
// ❌ BAD - Easy to miss required fields
const mockSession = {
  data: {
    user: {
      id: '1'
      // Missing email, name!
    }
  },
  status: 'authenticated'
  // Missing update method!
} as any;
```

✅ **GOOD - Use session factory:**

```typescript
// ✅ GOOD - All required fields present
const mockSession = createAuthenticatedSessionValue({ id: 'user-123' });
// Includes id, email, name, status, update, expires
```

---

## Common Patterns

### Router + Auth Together

```typescript
import { createMockRouter } from '@/__tests__/mocks/next-navigation.mocks';
import { createAuthenticatedSessionValue } from '@/__tests__/mocks/next-auth.mocks';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { vi } from 'vitest';

describe('Dashboard', () => {
  let mockRouter: ReturnType<typeof createMockRouter>;

  beforeEach(() => {
    // Setup router
    mockRouter = createMockRouter();
    vi.mocked(useRouter).mockReturnValue(mockRouter);

    // Setup authenticated session
    const mockSession = createAuthenticatedSessionValue({ id: 'user-123' });
    vi.mocked(useSession).mockReturnValue(mockSession);
  });

  it('should navigate and display user info', () => {
    renderWithTheme(<Dashboard />);

    expect(screen.getByText('user-123')).toBeInTheDocument();
    // Test navigation...
  });
});
```

### Search + Filter Components

```typescript
describe('FilterableList', () => {
  it('should filter and paginate', () => {
    const mockSearchParams = createMockSearchParams({
      category: 'sports',
      page: '2',
      sort: 'date'
    });
    vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);

    renderWithTheme(<FilterableList />);

    expect(screen.getByText('Sports')).toBeInTheDocument();
    expect(screen.getByText('Page 2')).toBeInTheDocument();
  });
});
```

---

## Module Mocking Setup

Mock the modules **once** at the top of your test file or in a setup file:

```typescript
import { vi } from 'vitest';

// Mock modules ONCE
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn()
}));

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn()
}));

// Then use factories in each test
describe('MyComponent', () => {
  beforeEach(() => {
    const mockRouter = createMockRouter();
    vi.mocked(useRouter).mockReturnValue(mockRouter);

    const mockSession = createAuthenticatedSessionValue();
    vi.mocked(useSession).mockReturnValue(mockSession);
  });

  // Tests...
});
```

---

## Related Documentation

- **[Component Testing Guide](../utils/README.md)** - Theme and context provider utilities
- **[Testing Guide](../../docs/claude/testing.md)** - Complete testing guidelines
- **[Database Testing Guide](../db/README.md)** - Repository and database mocking

---

## Summary

**Mock utilities provided:**
1. **`createMockRouter()`** - Complete Next.js router mock
2. **`createMockSearchParams()`** - URL search params mock with default behavior
3. **`createAuthenticatedSessionValue()`** - Authenticated session mock
4. **`createUnauthenticatedSessionValue()`** - Unauthenticated session mock
5. **`createMockSignIn()`** - SignIn function mock

**Key benefits:**
- ✅ Fully typed (no `as any` needed)
- ✅ Complete implementations (all methods present)
- ✅ Reusable across tests
- ✅ Easy to customize with overrides
- ✅ Type-safe by design

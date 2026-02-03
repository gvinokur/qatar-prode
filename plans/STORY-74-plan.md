# Implementation Plan: Story #74 - Create Next.js Mock Utilities

**Story:** #74 - Story 2: Create Next.js Mock Utilities
**Epic:** #72 - Test Pattern Refactoring & Utility Standardization
**Priority:** P1 - HIGH (Type safety improvement)
**Effort Estimate:** 1.5-2 hours (updated based on actual file count)
**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-74`
**Branch:** `feature/story-74`

---

## Story Context

Create reusable, type-safe mock factories for Next.js router, SearchParams, and NextAuth to eliminate ~80-100 lines of duplicated mock setup across 6 test files and restore type safety by removing `as any` bypasses.

### Problem Statement

**Current State (from codebase exploration):**
- **Duplication:** 6 test files contain ~80-100 lines of repeated mock setup (~10% of test code)
- **Type Safety:** 44 instances of `as any` bypasses defeat TypeScript benefits
- **Inconsistency:** Different mock shapes across files (mockSearchParams.get vs new URLSearchParams)
- **Maintenance:** Changes to Next.js/NextAuth APIs require updating 6 files

**Evidence from exploration:**
```typescript
// Repeated in 5+ files with type bypasses
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

beforeEach(() => {
  (useRouter as any).mockReturnValue(mockRouter); // ❌ Type bypass!
  (useSearchParams as any).mockReturnValue(mockSearchParams); // ❌ Type bypass!
});
```

### Success Criteria

- Eliminate ~80-100 lines of duplicated mock setup
- Remove all `as any` bypasses from Next.js/NextAuth mocks (44 instances)
- Create consistent, reusable mock utilities following existing `__tests__/db/mock-helpers.ts` pattern
- All 6 test files updated with zero test behavior changes
- 100% TypeScript compliance with no type errors
- Pure factory functions (no module mocking side effects)

---

## Acceptance Criteria

### Files Created
- [ ] `__tests__/mocks/` directory created
- [ ] `__tests__/mocks/next-navigation.mocks.ts` created with:
  - `createMockRouter()` - factory with proper AppRouterInstance type
  - `setupRouterMock()` - test setup helper
  - `createMockSearchParams()` - factory with ReadonlyURLSearchParams type
  - `setupSearchParamsMock()` - test setup helper
  - Zero `as any` bypasses
  - JSDoc documentation
  - vi.mock() at file level

- [ ] `__tests__/mocks/next-auth.mocks.ts` created with:
  - `createMockSession()` - factory with proper Session type
  - `setupAuthenticatedSession()` - authenticated state helper
  - `setupUnauthenticatedSession()` - unauthenticated state helper
  - `setupSignInMock()` - signIn function mock helper
  - Zero `as any` bypasses
  - JSDoc documentation
  - vi.mock() at file level

### Files Updated (6 total)

**Confirmed files using Next.js/NextAuth mocks:**
1. `__tests__/components/auth/login-form.test.tsx`
2. `__tests__/components/auth/signup-form.test.tsx`
3. `__tests__/components/auth/user-settings-dialog.test.tsx`
4. `__tests__/components/auth/delete-account-button.test.tsx`
5. `__tests__/components/auth/session-wrapper.test.tsx`
6. `__tests__/app/user-actions.test.tsx`

**Update requirements for each file:**
- [ ] Remove inline vi.mock() declarations (5-10 lines per file)
- [ ] Remove `as any` type bypasses for Next.js/NextAuth mocks
- [ ] Add imports from new mock utilities
- [ ] Replace mock setup with utility functions in beforeEach/tests
- [ ] Verify tests pass with identical behavior

### Quality Gates
- [ ] All tests passing (`npm test`)
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Zero `as any` in new mock utilities
- [ ] Zero `as any` for Next.js/NextAuth mocks in test files
- [ ] No decrease in code coverage

### Documentation
- [ ] JSDoc added to all exported functions
- [ ] Usage examples in comments
- [ ] Type annotations explicit and complete
- [ ] Parameter descriptions provided

---

## Technical Approach

### Architecture Pattern

Follow the **existing database mock pattern** established in `__tests__/db/mock-helpers.ts` (248 lines):

**Existing pattern (database mocks):**
```typescript
// Factory function with proper types
export function createMockSelectQuery<T>(result: T[]): SelectQueryBuilder<DB, any, T> {
  // ... properly typed implementation
}

// Test setup helper
export function createMockDatabase(): Kysely<DB> {
  // ... returns fully typed mock
}
```

**Apply same pattern (router/auth mocks):**
```typescript
// Factory function with proper types
export function createMockRouter(
  overrides: Partial<AppRouterInstance> = {}
): AppRouterInstance {
  // ... properly typed implementation
}

// Test setup helper
export function setupRouterMock(
  router = createMockRouter()
): AppRouterInstance {
  // ... returns fully typed mock
}
```

### Type Safety Strategy

**Import types using ReturnType inference (avoids internal Next.js paths):**

```typescript
// Next.js types (inferred from hooks)
import type { useRouter, useSearchParams } from 'next/navigation';
type MockRouter = ReturnType<typeof useRouter>;
type MockSearchParams = ReturnType<typeof useSearchParams>;

// NextAuth types (from public exports)
import type { Session } from 'next-auth';
import type { SessionContextValue } from 'next-auth/react';
```

**Type-safe mock creation:**
```typescript
// ✅ Compiler enforces all AppRouterInstance methods
export const createMockRouter = (
  overrides: Partial<AppRouterInstance> = {}
): AppRouterInstance => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  ...overrides // Type-checked against AppRouterInstance
});
```

### File Organization

```
__tests__/
├── mocks/                          # NEW directory
│   ├── next-navigation.mocks.ts   # NEW - Router & SearchParams utilities
│   └── next-auth.mocks.ts         # NEW - Session & SignIn utilities
├── db/
│   └── mock-helpers.ts            # EXISTING - Database mock pattern
└── components/
    └── auth/                       # UPDATED - Use new utilities
        ├── login-form.test.tsx    # Remove 15-20 lines of mock setup
        ├── signup-form.test.tsx   # Remove 15-20 lines of mock setup
        └── ...
```

### Migration Strategy

**Batch approach to minimize risk:**

1. **Create utilities** - New files, zero risk
2. **Proof of concept** - Update 1-2 test files, verify behavior unchanged
3. **Batch 1: Auth components** - Update 5 files, test after each 2-3 files
4. **Batch 2: Profile & settings** - Update remaining files, test frequently
5. **Batch 3: Navigation & layout** - Complete migration
6. **Final validation** - Full test suite run

---

## Implementation Steps

### Phase 1: Create Mock Utilities (45 minutes)

#### Step 1.1: Create `next-navigation.mocks.ts`

**File:** `__tests__/mocks/next-navigation.mocks.ts`

**Exports:**
```typescript
import { vi } from 'vitest';
import type { useRouter, useSearchParams } from 'next/navigation';

// Use ReturnType to infer types from Next.js hooks (avoids internal paths)
type MockRouter = ReturnType<typeof useRouter>;
type MockSearchParams = ReturnType<typeof useSearchParams>;

/**
 * Creates a mock AppRouterInstance with all required methods.
 * Pure factory function - no module mocking side effects.
 * @param overrides - Partial router to override defaults
 * @returns Fully typed mock router
 */
export const createMockRouter = (
  overrides: Partial<MockRouter> = {}
): MockRouter => ({
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  prefetch: vi.fn(),
  ...overrides
} as MockRouter);

/**
 * Creates a mock ReadonlyURLSearchParams from key-value pairs.
 * Pure factory function - returns readonly interface implementation.
 * @param params - Object with search param key-value pairs
 * @returns Mock search params with readonly interface
 */
export const createMockSearchParams = (
  params: Record<string, string> = {}
): MockSearchParams => {
  const urlParams = new URLSearchParams(params);

  // Return object implementing ReadonlyURLSearchParams interface
  // (not casting mutable URLSearchParams)
  return {
    get: (name: string) => urlParams.get(name),
    getAll: (name: string) => urlParams.getAll(name),
    has: (name: string) => urlParams.has(name),
    forEach: (callbackfn: (value: string, key: string, parent: URLSearchParams) => void) =>
      urlParams.forEach(callbackfn),
    entries: () => urlParams.entries(),
    keys: () => urlParams.keys(),
    values: () => urlParams.values(),
    [Symbol.iterator]: () => urlParams[Symbol.iterator](),
    size: urlParams.size,
    toString: () => urlParams.toString(),
  } as MockSearchParams;
};
```

**Usage in tests:**
```typescript
// Test file handles vi.mock() declarations (existing pattern)
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Import utilities for factory functions only
import { createMockRouter, createMockSearchParams } from '@/__tests__/mocks/next-navigation.mocks';
import { useRouter, useSearchParams } from 'next/navigation';

// In beforeEach - synchronous setup
beforeEach(() => {
  const mockRouter = createMockRouter();
  vi.mocked(useRouter).mockReturnValue(mockRouter);

  const mockSearchParams = createMockSearchParams({ foo: 'bar' });
  vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);
});
```

**Validation:**
- TypeScript compiles without errors
- No `as any` bypasses
- Pure factory functions (no side effects)
- All router methods present
- JSDoc on all exports

#### Step 1.2: Create `next-auth.mocks.ts`

**File:** `__tests__/mocks/next-auth.mocks.ts`

**Exports:**
```typescript
import { vi } from 'vitest';
import type { Session } from 'next-auth';
import type { SessionContextValue } from 'next-auth/react';

/**
 * Creates a mock Session with default or custom user data.
 * Pure factory function with proper type safety for partial overrides.
 * @param overrides - Partial session data to override defaults
 * @returns Fully typed mock session
 */
export const createMockSession = (
  overrides: {
    user?: Partial<Session['user']>;
    expires?: string;
  } = {}
): Session => {
  // Ensure all required fields are present
  const defaultUser: Session['user'] = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  };

  return {
    user: {
      ...defaultUser,
      ...overrides.user, // Type-safe partial override
    },
    expires: overrides.expires || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
};

/**
 * Creates a mock SessionContextValue for authenticated state.
 * Pure factory function - no module mocking side effects.
 * @param userOverrides - User data to override defaults
 * @returns Mock session context value
 */
export const createAuthenticatedSessionValue = (
  userOverrides: Partial<Session['user']> = {}
): SessionContextValue => ({
  data: createMockSession({ user: userOverrides }),
  status: 'authenticated',
  update: vi.fn(),
});

/**
 * Creates a mock SessionContextValue for unauthenticated state.
 * Pure factory function - no module mocking side effects.
 * @returns Mock session context value
 */
export const createUnauthenticatedSessionValue = (): SessionContextValue => ({
  data: null,
  status: 'unauthenticated',
  update: vi.fn(),
});

/**
 * Creates a mock signIn function with configurable result.
 * Pure factory function - no module mocking side effects.
 * @param result - SignIn result to return (default: { ok: true })
 * @returns Mock signIn function
 */
export const createMockSignIn = (result = { ok: true }) => {
  return vi.fn().mockResolvedValue(result);
};
```

**Usage in tests:**
```typescript
// Test file handles vi.mock() declarations (existing pattern)
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
  signIn: vi.fn(),
}));

// Import utilities for factory functions only
import {
  createAuthenticatedSessionValue,
  createUnauthenticatedSessionValue,
  createMockSignIn
} from '@/__tests__/mocks/next-auth.mocks';
import { useSession, signIn } from 'next-auth/react';

// In beforeEach - synchronous setup
beforeEach(() => {
  const mockSession = createAuthenticatedSessionValue({ id: 'test-123' });
  vi.mocked(useSession).mockReturnValue(mockSession);

  const mockSignIn = createMockSignIn({ ok: true });
  vi.mocked(signIn).mockImplementation(mockSignIn);
});
```

**Validation:**
- TypeScript compiles without errors
- No `as any` bypasses
- Pure factory functions (no side effects)
- Proper Session type structure with type-safe partial overrides
- JSDoc on all exports

### Phase 2: Proof of Concept (20 minutes)

#### Step 2.1: Update 2 test files as POC

**Files:**
- `__tests__/components/auth/login-form.test.tsx`
- `__tests__/components/auth/signup-form.test.tsx`

**Changes per file:**
1. **KEEP** inline vi.mock() calls (test files own the mocking)
2. Add imports for factory functions:
   ```typescript
   import { createMockRouter, createMockSearchParams } from '@/__tests__/mocks/next-navigation.mocks';
   import { createAuthenticatedSessionValue, createMockSignIn } from '@/__tests__/mocks/next-auth.mocks';
   ```
3. Replace mock setup in beforeEach:
   ```typescript
   // Before (15-20 lines with as any)
   const mockRouter = { push: vi.fn(), refresh: vi.fn(), ... };
   (useRouter as any).mockReturnValue(mockRouter);
   (useSearchParams as any).mockReturnValue(mockSearchParams);

   // After (3-4 lines, type-safe, synchronous)
   const mockRouter = createMockRouter();
   vi.mocked(useRouter).mockReturnValue(mockRouter);

   const mockSearchParams = createMockSearchParams({ foo: 'bar' });
   vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);
   ```
4. Run tests individually after each file update

**Validation (critical - run after EACH file):**
- Run specific test file: `npm test login-form.test`
- Verify test count unchanged (no tests lost)
- Verify identical behavior (all assertions pass)
- Check TypeScript compilation: `npm run build`
- Confirm no `as any` for Next.js mocks
- Verify mock method calls work (push, refresh, etc.)

### Phase 3: Complete Migration - Remaining Files (25 minutes)

#### Step 3.1: Update remaining test files

**Files (4 remaining):**
1. `__tests__/components/auth/user-settings-dialog.test.tsx`
2. `__tests__/components/auth/delete-account-button.test.tsx`
3. `__tests__/components/auth/session-wrapper.test.tsx`
4. `__tests__/app/user-actions.test.tsx`

**Process:**
- Apply same changes as POC
- **CRITICAL:** Test after EACH file individually (not in batch)
- Track lines removed (~15-20 per file = 60-80 total)

**Validation checkpoint:**
- Run all 6 updated tests: `npm test -- --run __tests__/components/auth __tests__/app/user-actions`
- All 6 files pass
- Verify test count unchanged
- ~80-100 lines eliminated total

### Phase 4: Final Validation (25 minutes)

#### Step 4.1: Quality checks

```bash
# TypeScript compilation
npm run build

# Linting
npm run lint

# Full test suite
npm test

# Coverage check (should not decrease)
npm test -- --coverage
```

#### Step 4.2: Type safety audit

```bash
# Search for remaining `as any` in test files (should find zero for Next.js/NextAuth mocks)
grep -r "as any" __tests__/components --include="*.test.tsx" | grep -E "(useRouter|useSearchParams|useSession|signIn)"
```

**Expected:** Zero matches (all Next.js/NextAuth mocks are type-safe)

#### Step 4.3: Mock utilities validation test

**Add explicit test to verify mock factory behavior:**

Create `__tests__/mocks/__tests__/mock-utilities.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createMockRouter, createMockSearchParams } from '../next-navigation.mocks';
import { createAuthenticatedSessionValue, createMockSignIn } from '../next-auth.mocks';

describe('Mock Utilities', () => {
  describe('createMockRouter', () => {
    it('should create router with all required methods', () => {
      const router = createMockRouter();

      expect(router.push).toBeDefined();
      expect(router.replace).toBeDefined();
      expect(router.refresh).toBeDefined();
      expect(router.back).toBeDefined();
      expect(router.forward).toBeDefined();
      expect(router.prefetch).toBeDefined();

      // Verify methods are mocks
      expect(vi.isMockFunction(router.push)).toBe(true);
    });

    it('should allow overrides', () => {
      const customPush = vi.fn();
      const router = createMockRouter({ push: customPush });

      expect(router.push).toBe(customPush);
    });
  });

  describe('createMockSearchParams', () => {
    it('should create search params with values', () => {
      const params = createMockSearchParams({ foo: 'bar', baz: 'qux' });

      expect(params.get('foo')).toBe('bar');
      expect(params.get('baz')).toBe('qux');
      expect(params.has('foo')).toBe(true);
      expect(params.has('missing')).toBe(false);
    });
  });

  describe('createAuthenticatedSessionValue', () => {
    it('should create authenticated session with defaults', () => {
      const session = createAuthenticatedSessionValue();

      expect(session.status).toBe('authenticated');
      expect(session.data).toBeDefined();
      expect(session.data?.user.email).toBe('test@example.com');
    });

    it('should allow user overrides', () => {
      const session = createAuthenticatedSessionValue({ id: 'custom-123' });

      expect(session.data?.user.id).toBe('custom-123');
    });
  });

  describe('createMockSignIn', () => {
    it('should create mock signIn function', () => {
      const mockSignIn = createMockSignIn();

      expect(vi.isMockFunction(mockSignIn)).toBe(true);
    });

    it('should resolve with custom result', async () => {
      const customResult = { ok: false, error: 'Invalid' };
      const mockSignIn = createMockSignIn(customResult);

      const result = await mockSignIn();
      expect(result).toEqual(customResult);
    });
  });
});
```

**Run:** `npm test mock-utilities.test` to verify all factories work correctly

#### Step 4.4: Verify consistency

**Manual review:**
- All test files use mock utilities (not inline mocks)
- All imports from `@/__tests__/mocks/` are correct
- No duplicated mock setup remains

---

## Testing Strategy

### Unit Tests for Mock Utilities

**Direct testing of mock utilities:**
- Create `__tests__/mocks/__tests__/mock-utilities.test.ts` to validate factory behavior
- Ensures mock shapes match expected interfaces
- Catches behavioral issues that TypeScript can't detect
- Verifies overrides work correctly

**Benefits:**
1. Explicit validation of mock factory behavior
2. Catches missing mock methods before component tests fail
3. Documents expected mock shapes through tests
4. Regression protection if mock utilities change

### Validation Through Existing Tests

**Coverage:**
- All 6 updated test files serve as integration tests for mock utilities
- Each file tests different mock scenarios:
  - Authenticated vs unauthenticated sessions
  - Router navigation (push, refresh)
  - Search params (get, has)
  - SignIn success/error cases

**Test scenarios covered:**
1. **Login flow** - signIn mock, unauthenticated session
2. **Signup flow** - signIn mock, router.push navigation
3. **Profile editing** - authenticated session, router.refresh
4. **Settings updates** - authenticated session with custom user data
5. **Navigation** - router mocks with search params

### Regression Testing

**Approach:**
1. Run tests BEFORE migration → Capture baseline results
2. Update files in batches → Run tests after each batch
3. Run tests AFTER migration → Compare with baseline
4. Any test failures → Rollback and investigate

**Success criteria:**
- All tests pass
- Same number of tests (no tests lost)
- Same assertions (no behavior changes)
- Coverage maintained or improved

### Type Safety Testing

**Validation methods:**
1. TypeScript compilation - catches type errors
2. IDE type checking - hover over functions to verify types
3. Intentional type error test - add wrong type and verify compiler catches it

---

## Validation Considerations

### SonarCloud Requirements

**Coverage:**
- New mock utilities will be covered by existing tests
- No new code coverage requirements (infrastructure utilities)
- Existing test coverage should remain stable (~80%+)

**Code Quality:**
- Zero code smells (properly typed, no `any`)
- Zero bugs (mock utilities are simple factories)
- Zero security issues (no secrets, no external inputs)
- Maintainability: A (clear function names, JSDoc, simple logic)

### Pre-Commit Validation

**Required checks (from implementation.md Section 7):**
```bash
# MANDATORY - ALL must pass before commit
npm test          # All tests pass
npm run lint      # Zero linting errors
npm run build     # TypeScript compiles
```

### Vercel Preview Testing

**After commit:**
- No user-facing changes (infrastructure only)
- Vercel Preview will deploy successfully
- CI/CD checks will pass

---

## Risk Assessment & Mitigation

### Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| Test behavior changes | HIGH | LOW | Incremental migration, test after each batch |
| TypeScript compilation errors | MEDIUM | LOW | Follow existing type patterns, proper imports |
| Import path issues | MEDIUM | MEDIUM | Use `@/` alias consistently, test imports |
| Mock timing issues (async) | MEDIUM | LOW | Use `async/await` in setup helpers |
| Missed test files | LOW | MEDIUM | Use grep to find all files, systematic search |

### Rollback Plan

**If issues arise:**
1. Mock utilities are additive - don't break existing code
2. Can rollback individual file updates (git checkout)
3. Old patterns still work if needed
4. Can pause migration and continue later

---

## Open Questions

1. **MUI component mocks**: Story focuses on Next.js/NextAuth, but exploration found 30+ lines of MUI mocks. Should we also create MUI mock utilities?
   - **Recommendation:** Out of scope for this story (focus on Next.js/NextAuth). Could be follow-up story if valuable.

2. **Validator mocks**: Found duplicated validator mocks across files. Include in this story?
   - **Recommendation:** Out of scope (different category). Suggest separate story if needed.

3. **Global mocks in vitest.setup.ts**: Should we add router/auth mocks to global setup?
   - **Recommendation:** No. Keep mocks in test files for explicitness and control. Global mocks can cause confusion.

---

## Dependencies

**Depends on:** None (can start immediately)

**Blocks:** None (independent)

**Related:** Story 1 (Theme Utilities) - can work in parallel, no conflicts

---

## Estimated Impact

### Quantitative
- **Lines eliminated:** 80-100 lines (15-20 per file × 6 files)
- **Type safety:** Eliminate 44 `as any` bypasses
- **Files to create:** 3 files (2 mock utilities + 1 utility test)
- **Files to update:** 6 test files
- **Time saved in future:** ~5-10 minutes per new test file (no mock setup needed)

### Qualitative
- **Developer experience:** Easier to write tests, clear mock utilities
- **Maintainability:** Single source of truth for mocks
- **Type safety:** Breaking changes caught at compile time
- **Consistency:** All tests use same mock shapes

---

## Success Metrics

**Definition of Done:**
- [ ] All acceptance criteria met
- [ ] Zero `as any` for Next.js/NextAuth mocks (eliminate 44 instances)
- [ ] All 6 test files updated
- [ ] Mock utilities test created and passing
- [ ] All tests passing (including utility tests)
- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] JSDoc complete on all utilities
- [ ] Pure factory functions (no module mocking side effects)
- [ ] PR created with plan and implementation
- [ ] SonarCloud validates (0 new issues)

---

## References

### Codebase Patterns
- **Existing pattern:** `__tests__/db/mock-helpers.ts` (database mocks)
- **Test examples:** `__tests__/components/auth/login-form.test.tsx`

### Type Sources
```typescript
// Next.js types (use ReturnType to avoid internal paths)
import type { useRouter, useSearchParams } from 'next/navigation';
type MockRouter = ReturnType<typeof useRouter>;
type MockSearchParams = ReturnType<typeof useSearchParams>;

// NextAuth types (public exports)
import type { Session } from 'next-auth';
import type { SessionContextValue } from 'next-auth/react';
```

### Documentation
- **Vitest mocking:** https://vitest.dev/guide/mocking.html
- **Next.js types:** next/dist/shared/lib/app-router-context.shared-runtime
- **NextAuth types:** next-auth (Session, SessionContextValue)

---

## Plan Review History

### Cycle 1 (2026-02-02)
**Major issues identified:**
1. ❌ Critical: Vitest Mock Registration Pattern Violation - utilities had `vi.mock()` calls
2. ❌ Incomplete File Enumeration - only 6 files found, not 15
3. ❌ Async/Await Pattern Creates Runtime Complexity
4. ❌ Type Import Path Issue - using internal Next.js paths
5. ❌ Session Type Mismatch - unsafe partial override handling
6. ❌ No Clear Testing Strategy for Mock Utilities

**Resolutions:**
1. ✅ Removed `vi.mock()` from utilities - pure factory functions now
2. ✅ Updated file count from 15 to 6, adjusted time estimate to 1.5-2 hours
3. ✅ Removed async/await - all functions synchronous now
4. ✅ Changed to `ReturnType<typeof useRouter>` to avoid internal paths
5. ✅ Fixed Session type safety with proper partial override handling
6. ✅ Added explicit mock utilities test file for validation

---

**Plan created:** 2026-02-02
**Plan updated:** 2026-02-02 (after review cycle 1)
**Story number:** #74
**Estimated completion:** 1.5-2 hours
**Plan status:** Ready for review cycle 2

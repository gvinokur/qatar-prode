import { vi } from 'vitest';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import { createMockRouter, createMockSearchParams } from './next-navigation.mocks';
import {
  createAuthenticatedSessionValue,
  createUnauthenticatedSessionValue,
  createMockSignIn,
} from './next-auth.mocks';
import type { Session } from 'next-auth';

/**
 * Options for setting up test mocks.
 */
export interface SetupTestMocksOptions {
  /**
   * Enable router and searchParams mocks.
   * @default false
   */
  navigation?: boolean;

  /**
   * Enable session mock.
   * @default false
   */
  session?: boolean;

  /**
   * Enable signIn mock.
   * @default false
   */
  signIn?: boolean;

  /**
   * Default values for router mock.
   * Only used if navigation: true.
   */
  routerDefaults?: Partial<ReturnType<typeof createMockRouter>>;

  /**
   * Default search params.
   * Only used if navigation: true.
   */
  searchParamsDefaults?: Record<string, string>;

  /**
   * Default user data for authenticated session.
   * Only used if session: true.
   * Set to null to create unauthenticated session instead.
   */
  sessionDefaults?: Partial<Session['user']> | null;

  /**
   * Default signIn result.
   * Only used if signIn: true.
   */
  signInDefaults?: { ok: boolean; error?: string };
}

/**
 * Return type for setupTestMocks, containing only requested mocks.
 */
export interface TestMocks {
  router?: ReturnType<typeof createMockRouter>;
  searchParams?: ReturnType<typeof createMockSearchParams>;
  session?: ReturnType<typeof createAuthenticatedSessionValue | typeof createUnauthenticatedSessionValue>;
  signIn?: ReturnType<typeof createMockSignIn>;
}

/**
 * Sets up test mocks based on provided options.
 * Only creates and configures mocks that are explicitly requested via flags.
 *
 * @param options - Configuration for which mocks to set up and their defaults
 * @returns Object containing only the requested mock instances
 *
 * @example
 * ```ts
 * // Setup navigation mocks only
 * beforeEach(() => {
 *   const { router, searchParams } = setupTestMocks({ navigation: true });
 * });
 * ```
 *
 * @example
 * ```ts
 * // Setup session and signIn mocks
 * beforeEach(() => {
 *   const { session, signIn } = setupTestMocks({ session: true, signIn: true });
 * });
 * ```
 *
 * @example
 * ```ts
 * // Setup both navigation and auth with custom defaults
 * beforeEach(() => {
 *   const mocks = setupTestMocks({
 *     navigation: true,
 *     signIn: true,
 *     searchParamsDefaults: { redirect: '/dashboard' },
 *     signInDefaults: { ok: true },
 *   });
 * });
 * ```
 *
 * @example
 * ```ts
 * // Setup unauthenticated session
 * beforeEach(() => {
 *   const { session } = setupTestMocks({
 *     session: true,
 *     sessionDefaults: null, // null = unauthenticated
 *   });
 * });
 * ```
 */
export function setupTestMocks(options: SetupTestMocksOptions = {}): TestMocks {
  const mocks: TestMocks = {};

  // Setup navigation mocks if requested
  if (options.navigation) {
    mocks.router = createMockRouter(options.routerDefaults);
    mocks.searchParams = createMockSearchParams(options.searchParamsDefaults);

    vi.mocked(useRouter).mockReturnValue(mocks.router);
    vi.mocked(useSearchParams).mockReturnValue(mocks.searchParams);
  }

  // Setup session mock if requested
  if (options.session) {
    // Handle unauthenticated vs authenticated session
    if (options.sessionDefaults === null) {
      mocks.session = createUnauthenticatedSessionValue();
    } else {
      mocks.session = createAuthenticatedSessionValue(options.sessionDefaults);
    }

    vi.mocked(useSession).mockReturnValue(mocks.session);
  }

  // Setup signIn mock if requested
  if (options.signIn) {
    mocks.signIn = createMockSignIn(options.signInDefaults);
    vi.mocked(signIn).mockImplementation(mocks.signIn);
  }

  return mocks;
}

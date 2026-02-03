import { vi } from 'vitest';
import type { Session } from 'next-auth';
import type { SessionContextValue } from 'next-auth/react';

/**
 * Creates a mock Session with default or custom user data.
 * Pure factory function with proper type safety for partial overrides.
 *
 * @param overrides - Partial session data to override defaults
 * @returns Fully typed mock session
 *
 * @example
 * ```ts
 * const session = createMockSession({ user: { id: 'custom-123', name: 'Custom User' } });
 * // Returns session with custom user data, other fields use defaults
 * ```
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
 *
 * @param userOverrides - User data to override defaults
 * @returns Mock session context value with authenticated status
 *
 * @example
 * ```ts
 * const mockSession = createAuthenticatedSessionValue({ id: 'user-123' });
 * vi.mocked(useSession).mockReturnValue(mockSession);
 *
 * // Usage in component
 * const { data, status } = useSession();
 * // data.user.id === 'user-123'
 * // status === 'authenticated'
 * ```
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
 *
 * @returns Mock session context value with unauthenticated status
 *
 * @example
 * ```ts
 * const mockSession = createUnauthenticatedSessionValue();
 * vi.mocked(useSession).mockReturnValue(mockSession);
 *
 * // Usage in component
 * const { data, status } = useSession();
 * // data === null
 * // status === 'unauthenticated'
 * ```
 */
export const createUnauthenticatedSessionValue = (): SessionContextValue => ({
  data: null,
  status: 'unauthenticated',
  update: vi.fn(),
});

/**
 * Creates a mock signIn function with configurable result.
 * Pure factory function - no module mocking side effects.
 *
 * @param result - SignIn result to return (default: { ok: true })
 * @returns Mock signIn function
 *
 * @example
 * ```ts
 * const mockSignIn = createMockSignIn({ ok: true });
 * vi.mocked(signIn).mockImplementation(mockSignIn);
 *
 * // Usage in component
 * const result = await signIn('credentials', { ... });
 * // result.ok === true
 * ```
 *
 * @example
 * // Error case
 * ```ts
 * const mockSignIn = createMockSignIn({ ok: false, error: 'Invalid credentials' });
 * vi.mocked(signIn).mockImplementation(mockSignIn);
 * ```
 */
export const createMockSignIn = (result = { ok: true }) => {
  return vi.fn().mockResolvedValue(result);
};

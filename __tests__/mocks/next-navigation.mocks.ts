import { vi } from 'vitest';
import type { useRouter, useSearchParams } from 'next/navigation';

// Use ReturnType to infer types from Next.js hooks (avoids internal paths)
type MockRouter = ReturnType<typeof useRouter>;
type MockSearchParams = ReturnType<typeof useSearchParams>;

/**
 * Creates a mock AppRouterInstance with all required methods.
 * Pure factory function - no module mocking side effects.
 *
 * @param overrides - Partial router to override defaults
 * @returns Fully typed mock router
 *
 * @example
 * ```ts
 * const mockRouter = createMockRouter({ push: vi.fn().mockResolvedValue(true) });
 * vi.mocked(useRouter).mockReturnValue(mockRouter);
 * ```
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
 * Pure factory function - returns mock functions for all methods.
 *
 * @param params - Object with search param key-value pairs (sets default behavior)
 * @returns Mock search params with vi.fn() methods
 *
 * @example
 * ```ts
 * const mockSearchParams = createMockSearchParams({ foo: 'bar' });
 * vi.mocked(useSearchParams).mockReturnValue(mockSearchParams);
 *
 * // Default behavior
 * mockSearchParams.get('foo'); // Returns 'bar'
 * mockSearchParams.has('foo'); // Returns true
 *
 * // Can override in tests
 * mockSearchParams.get.mockImplementation((key) => key === 'custom' ? 'value' : null);
 * ```
 */
export const createMockSearchParams = (
  params: Record<string, string> = {}
): MockSearchParams => {
  const urlParams = new URLSearchParams(params);

  // Return object with vi.fn() mocks that have default implementations
  return {
    get: vi.fn((name: string) => urlParams.get(name)),
    getAll: vi.fn((name: string) => urlParams.getAll(name)),
    has: vi.fn((name: string) => urlParams.has(name)),
    forEach: vi.fn((callbackfn: (value: string, key: string, parent: URLSearchParams) => void) =>
      urlParams.forEach(callbackfn)
    ),
    entries: vi.fn(() => urlParams.entries()),
    keys: vi.fn(() => urlParams.keys()),
    values: vi.fn(() => urlParams.values()),
    [Symbol.iterator]: vi.fn(() => urlParams[Symbol.iterator]()),
    size: urlParams.size,
    toString: vi.fn(() => urlParams.toString()),
  } as MockSearchParams;
};

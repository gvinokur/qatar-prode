import { describe, it, expect, vi } from 'vitest';
import { createMockRouter, createMockSearchParams } from '../next-navigation.mocks';
import {
  createMockSession,
  createAuthenticatedSessionValue,
  createUnauthenticatedSessionValue,
  createMockSignIn,
} from '../next-auth.mocks';

describe('Next.js Mock Utilities', () => {
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
      expect(vi.isMockFunction(router.replace)).toBe(true);
      expect(vi.isMockFunction(router.refresh)).toBe(true);
    });

    it('should allow overrides', () => {
      const customPush = vi.fn();
      const router = createMockRouter({ push: customPush });

      expect(router.push).toBe(customPush);
      expect(vi.isMockFunction(router.replace)).toBe(true);
    });
  });

  describe('createMockSearchParams', () => {
    it('should create search params with default empty values', () => {
      const params = createMockSearchParams();

      expect(params.get('foo')).toBeNull();
      expect(params.has('foo')).toBe(false);
    });

    it('should create search params with provided values', () => {
      const params = createMockSearchParams({ foo: 'bar', baz: 'qux' });

      expect(params.get('foo')).toBe('bar');
      expect(params.get('baz')).toBe('qux');
      expect(params.has('foo')).toBe(true);
      expect(params.has('missing')).toBe(false);
    });

    it('should have mockable methods', () => {
      const params = createMockSearchParams({ foo: 'bar' });

      // Verify methods are mocks that can be overridden
      expect(vi.isMockFunction(params.get)).toBe(true);
      expect(vi.isMockFunction(params.has)).toBe(true);

      // Override behavior
      params.get.mockImplementation((key) => (key === 'custom' ? 'value' : null));
      expect(params.get('custom')).toBe('value');
      expect(params.get('other')).toBeNull();
    });

    it('should support getAll method', () => {
      const params = createMockSearchParams({ tags: 'one,two' });

      const result = params.getAll('tags');
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

describe('NextAuth Mock Utilities', () => {
  describe('createMockSession', () => {
    it('should create session with default user', () => {
      const session = createMockSession();

      expect(session.user).toBeDefined();
      expect(session.user.id).toBe('1');
      expect(session.user.email).toBe('test@example.com');
      expect(session.user.name).toBe('Test User');
      expect(session.expires).toBeDefined();
    });

    it('should allow user overrides', () => {
      const session = createMockSession({
        user: { id: 'custom-123', name: 'Custom User' },
      });

      expect(session.user.id).toBe('custom-123');
      expect(session.user.name).toBe('Custom User');
      expect(session.user.email).toBe('test@example.com'); // Default preserved
    });

    it('should allow custom expires date', () => {
      const customExpires = '2026-12-31T00:00:00.000Z';
      const session = createMockSession({ expires: customExpires });

      expect(session.expires).toBe(customExpires);
    });
  });

  describe('createAuthenticatedSessionValue', () => {
    it('should create authenticated session with defaults', () => {
      const sessionValue = createAuthenticatedSessionValue();

      expect(sessionValue.status).toBe('authenticated');
      expect(sessionValue.data).toBeDefined();
      expect(sessionValue.data?.user.email).toBe('test@example.com');
      expect(vi.isMockFunction(sessionValue.update)).toBe(true);
    });

    it('should allow user overrides', () => {
      const sessionValue = createAuthenticatedSessionValue({
        id: 'custom-123',
        email: 'custom@example.com',
      });

      expect(sessionValue.data?.user.id).toBe('custom-123');
      expect(sessionValue.data?.user.email).toBe('custom@example.com');
      expect(sessionValue.status).toBe('authenticated');
    });
  });

  describe('createUnauthenticatedSessionValue', () => {
    it('should create unauthenticated session', () => {
      const sessionValue = createUnauthenticatedSessionValue();

      expect(sessionValue.status).toBe('unauthenticated');
      expect(sessionValue.data).toBeNull();
      expect(vi.isMockFunction(sessionValue.update)).toBe(true);
    });
  });

  describe('createMockSignIn', () => {
    it('should create mock signIn function with default success', async () => {
      const mockSignIn = createMockSignIn();

      expect(vi.isMockFunction(mockSignIn)).toBe(true);

      const result = await mockSignIn();
      expect(result.ok).toBe(true);
    });

    it('should create mock signIn with custom result', async () => {
      const customResult = { ok: false, error: 'Invalid credentials' };
      const mockSignIn = createMockSignIn(customResult);

      const result = await mockSignIn();
      expect(result).toEqual(customResult);
    });

    it('should be callable multiple times', async () => {
      const mockSignIn = createMockSignIn({ ok: true });

      await mockSignIn('credentials', { email: 'test@example.com' });
      await mockSignIn('credentials', { email: 'test2@example.com' });

      expect(mockSignIn).toHaveBeenCalledTimes(2);
    });
  });
});

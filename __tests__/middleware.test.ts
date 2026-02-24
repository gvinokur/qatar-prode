import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

// Mock modules before importing middleware
vi.mock('../auth', () => ({
  auth: vi.fn(),
}));

vi.mock('next-intl/middleware', () => ({
  default: vi.fn((config) => {
    return (request: NextRequest) => {
      // Simple mock that adds locale handling
      const response = NextResponse.next();
      response.headers.set('x-middleware-intl', 'processed');
      return response;
    };
  }),
}));

// Import after mocking
import middleware from '../middleware';
import { auth } from '../auth';
import { createMockSession } from './mocks/next-auth.mocks';

describe('middleware', () => {
  const mockAuth = vi.mocked(auth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Public routes - API and static files bypass middleware', () => {
    it('should allow API routes without any middleware processing', async () => {
      const request = new NextRequest('http://localhost:3000/api/tournaments');

      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it('should allow _next static files', async () => {
      const request = new NextRequest('http://localhost:3000/_next/static/chunk.js');

      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it('should allow favicon.ico', async () => {
      const request = new NextRequest('http://localhost:3000/favicon.ico');

      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it('should allow manifest.json', async () => {
      const request = new NextRequest('http://localhost:3000/manifest.json');

      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(mockAuth).not.toHaveBeenCalled();
    });

    it('should allow sw.js service worker', async () => {
      const request = new NextRequest('http://localhost:3000/sw.js');

      const response = await middleware(request);

      expect(response.status).toBe(200);
      expect(mockAuth).not.toHaveBeenCalled();
    });
  });

  describe('Public routes - Auth routes bypass protection', () => {
    it('should allow /es/auth/signin without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/es/auth/signin');

      const response = await middleware(request);

      expect(mockAuth).not.toHaveBeenCalled();
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });

    it('should allow /en/auth/signup without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/en/auth/signup');

      const response = await middleware(request);

      expect(mockAuth).not.toHaveBeenCalled();
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });

    it('should allow /es/verify-email without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/es/verify-email');

      const response = await middleware(request);

      expect(mockAuth).not.toHaveBeenCalled();
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });

    it('should allow /en/verify-email without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/en/verify-email');

      const response = await middleware(request);

      expect(mockAuth).not.toHaveBeenCalled();
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });
  });

  describe('PUBLIC: Main tournament page allows access without auth', () => {
    it('should allow /es/tournaments/123 without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/es/tournaments/123');

      const response = await middleware(request);

      expect(mockAuth).not.toHaveBeenCalled();
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(308);
    });

    it('should allow /en/tournaments/456 without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/en/tournaments/456');

      const response = await middleware(request);

      expect(mockAuth).not.toHaveBeenCalled();
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
      expect(response.status).not.toBe(307);
      expect(response.status).not.toBe(308);
    });

    it('should allow /es/tournaments/1 without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/es/tournaments/1');

      const response = await middleware(request);

      expect(mockAuth).not.toHaveBeenCalled();
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });
  });

  describe('PROTECTED: Tournament stats requires authentication', () => {
    it('should redirect /es/tournaments/123/stats when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const request = new NextRequest('http://localhost:3000/es/tournaments/123/stats');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);

      const redirectUrl = new URL(response.headers.get('location') || '');
      expect(redirectUrl.pathname).toBe('/es/');
      expect(redirectUrl.searchParams.get('openSignin')).toBe('true');
      expect(redirectUrl.searchParams.get('returnUrl')).toBe('/es/tournaments/123/stats');
    });

    it('should allow /es/tournaments/123/stats when authenticated', async () => {
      const mockSession = createMockSession({ user: { id: 'user-1', name: 'Test User' } });
      mockAuth.mockResolvedValueOnce(mockSession);

      const request = new NextRequest('http://localhost:3000/es/tournaments/123/stats');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).not.toBe(307);
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });

    it('should redirect /en/tournaments/456/stats when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const request = new NextRequest('http://localhost:3000/en/tournaments/456/stats');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);

      const redirectUrl = new URL(response.headers.get('location') || '');
      expect(redirectUrl.pathname).toBe('/en/');
      expect(redirectUrl.searchParams.get('openSignin')).toBe('true');
      expect(redirectUrl.searchParams.get('returnUrl')).toBe('/en/tournaments/456/stats');
    });

    it('should allow /en/tournaments/456/stats when authenticated', async () => {
      const mockSession = createMockSession({ user: { id: 'user-2', name: 'Another User' } });
      mockAuth.mockResolvedValueOnce(mockSession);

      const request = new NextRequest('http://localhost:3000/en/tournaments/456/stats');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).not.toBe(307);
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });
  });

  describe('PROTECTED: Tournament friend-groups requires authentication', () => {
    it('should redirect /es/tournaments/123/friend-groups when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const request = new NextRequest('http://localhost:3000/es/tournaments/123/friend-groups');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);

      const redirectUrl = new URL(response.headers.get('location') || '');
      expect(redirectUrl.pathname).toBe('/es/');
      expect(redirectUrl.searchParams.get('openSignin')).toBe('true');
      expect(redirectUrl.searchParams.get('returnUrl')).toBe('/es/tournaments/123/friend-groups');
    });

    it('should allow /es/tournaments/123/friend-groups when authenticated', async () => {
      const mockSession = createMockSession({ user: { id: 'user-3', name: 'Authenticated User' } });
      mockAuth.mockResolvedValueOnce(mockSession);

      const request = new NextRequest('http://localhost:3000/es/tournaments/123/friend-groups');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).not.toBe(307);
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });

    it('should redirect /en/tournaments/789/friend-groups when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const request = new NextRequest('http://localhost:3000/en/tournaments/789/friend-groups');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);

      const redirectUrl = new URL(response.headers.get('location') || '');
      expect(redirectUrl.pathname).toBe('/en/');
      expect(redirectUrl.searchParams.get('openSignin')).toBe('true');
      expect(redirectUrl.searchParams.get('returnUrl')).toBe('/en/tournaments/789/friend-groups');
    });

    it('should allow /en/tournaments/789/friend-groups when authenticated', async () => {
      const mockSession = createMockSession({ user: { id: 'user-4', name: 'Test User 4' } });
      mockAuth.mockResolvedValueOnce(mockSession);

      const request = new NextRequest('http://localhost:3000/en/tournaments/789/friend-groups');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).not.toBe(307);
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });
  });

  describe('PROTECTED: Global friend-groups route requires authentication', () => {
    it('should redirect /es/friend-groups when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const request = new NextRequest('http://localhost:3000/es/friend-groups');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);

      const redirectUrl = new URL(response.headers.get('location') || '');
      expect(redirectUrl.pathname).toBe('/es/');
      expect(redirectUrl.searchParams.get('openSignin')).toBe('true');
      expect(redirectUrl.searchParams.get('returnUrl')).toBe('/es/friend-groups');
    });

    it('should allow /es/friend-groups when authenticated', async () => {
      const mockSession = createMockSession({ user: { id: 'user-5', name: 'Test User 5' } });
      mockAuth.mockResolvedValueOnce(mockSession);

      const request = new NextRequest('http://localhost:3000/es/friend-groups');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).not.toBe(307);
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });

    it('should redirect /en/friend-groups when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const request = new NextRequest('http://localhost:3000/en/friend-groups');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);

      const redirectUrl = new URL(response.headers.get('location') || '');
      expect(redirectUrl.pathname).toBe('/en/');
      expect(redirectUrl.searchParams.get('openSignin')).toBe('true');
      expect(redirectUrl.searchParams.get('returnUrl')).toBe('/en/friend-groups');
    });

    it('should allow /en/friend-groups when authenticated', async () => {
      const mockSession = createMockSession({ user: { id: 'user-6', name: 'Test User 6' } });
      mockAuth.mockResolvedValueOnce(mockSession);

      const request = new NextRequest('http://localhost:3000/en/friend-groups');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).not.toBe(307);
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });
  });

  describe('PROTECTED: Predictions route requires authentication', () => {
    it('should redirect /es/predictions when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const request = new NextRequest('http://localhost:3000/es/predictions');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);

      const redirectUrl = new URL(response.headers.get('location') || '');
      expect(redirectUrl.pathname).toBe('/es/');
      expect(redirectUrl.searchParams.get('openSignin')).toBe('true');
      expect(redirectUrl.searchParams.get('returnUrl')).toBe('/es/predictions');
    });

    it('should allow /es/predictions when authenticated', async () => {
      const mockSession = createMockSession({ user: { id: 'user-7', name: 'Test User 7' } });
      mockAuth.mockResolvedValueOnce(mockSession);

      const request = new NextRequest('http://localhost:3000/es/predictions');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).not.toBe(307);
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });

    it('should redirect /en/predictions/tournament/123 when not authenticated', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const request = new NextRequest('http://localhost:3000/en/predictions/tournament/123');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);

      const redirectUrl = new URL(response.headers.get('location') || '');
      expect(redirectUrl.pathname).toBe('/en/');
      expect(redirectUrl.searchParams.get('openSignin')).toBe('true');
      expect(redirectUrl.searchParams.get('returnUrl')).toBe('/en/predictions/tournament/123');
    });

    it('should allow /en/predictions/tournament/123 when authenticated', async () => {
      const mockSession = createMockSession({ user: { id: 'user-8', name: 'Test User 8' } });
      mockAuth.mockResolvedValueOnce(mockSession);

      const request = new NextRequest('http://localhost:3000/en/predictions/tournament/123');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).not.toBe(307);
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });
  });

  describe('Route redirects - Legacy /groups to /friend-groups', () => {
    it('should redirect /es/tournaments/123/groups to /es/tournaments/123/friend-groups', async () => {
      const request = new NextRequest('http://localhost:3000/es/tournaments/123/groups');

      const response = await middleware(request);

      expect(response.status).toBe(301);

      const redirectUrl = new URL(response.headers.get('location') || '');
      expect(redirectUrl.pathname).toBe('/es/tournaments/123/friend-groups');
    });

    it('should redirect /en/tournaments/456/groups to /en/tournaments/456/friend-groups', async () => {
      const request = new NextRequest('http://localhost:3000/en/tournaments/456/groups');

      const response = await middleware(request);

      expect(response.status).toBe(301);

      const redirectUrl = new URL(response.headers.get('location') || '');
      expect(redirectUrl.pathname).toBe('/en/tournaments/456/friend-groups');
    });
  });

  describe('Redirect URL parameters', () => {
    it('should include both openSignin and returnUrl in redirect for protected routes', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const request = new NextRequest('http://localhost:3000/es/tournaments/123/stats?tab=overview');

      const response = await middleware(request);

      expect(response.status).toBe(307);

      const redirectUrl = new URL(response.headers.get('location') || '');
      expect(redirectUrl.pathname).toBe('/es/');
      expect(redirectUrl.searchParams.get('openSignin')).toBe('true');
      // Note: returnUrl should only include pathname, not query params (based on middleware implementation)
      expect(redirectUrl.searchParams.get('returnUrl')).toBe('/es/tournaments/123/stats');
    });

    it('should preserve locale in redirect URL', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const request = new NextRequest('http://localhost:3000/en/tournaments/789/friend-groups');

      const response = await middleware(request);

      expect(response.status).toBe(307);

      const redirectUrl = new URL(response.headers.get('location') || '');
      expect(redirectUrl.pathname).toBe('/en/');
      expect(redirectUrl.searchParams.get('openSignin')).toBe('true');
      expect(redirectUrl.searchParams.get('returnUrl')).toBe('/en/tournaments/789/friend-groups');
    });
  });

  describe('Edge cases - Tournament route variations', () => {
    it('should NOT protect /es/tournaments root (listing page)', async () => {
      const request = new NextRequest('http://localhost:3000/es/tournaments');

      const response = await middleware(request);

      expect(mockAuth).not.toHaveBeenCalled();
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });

    it('should protect /es/tournaments/123/stats even with trailing slash', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const request = new NextRequest('http://localhost:3000/es/tournaments/123/stats/');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);
    });

    it('should NOT protect tournament page with additional path segments that are not protected sub-routes', async () => {
      const request = new NextRequest('http://localhost:3000/es/tournaments/123/overview');

      const response = await middleware(request);

      // Should not call auth since 'overview' is not in protectedTournamentSubRoutes
      expect(mockAuth).not.toHaveBeenCalled();
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });

    it('should handle tournament IDs with various formats', async () => {
      mockAuth.mockResolvedValueOnce(null);
      const request = new NextRequest('http://localhost:3000/es/tournaments/world-cup-2026/stats');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.status).toBe(307);
    });
  });

  describe('Intl middleware integration', () => {
    it('should process routes through intl middleware', async () => {
      const request = new NextRequest('http://localhost:3000/es/');

      const response = await middleware(request);

      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });

    it('should process authenticated routes through intl middleware after auth check', async () => {
      const mockSession = createMockSession({ user: { id: 'user-9', name: 'Test User 9' } });
      mockAuth.mockResolvedValueOnce(mockSession);

      const request = new NextRequest('http://localhost:3000/es/predictions');

      const response = await middleware(request);

      expect(mockAuth).toHaveBeenCalledOnce();
      expect(response.headers.get('x-middleware-intl')).toBe('processed');
    });
  });

});

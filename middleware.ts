import createMiddleware from 'next-intl/middleware';
import { auth } from './auth';
import { NextResponse, type NextRequest } from 'next/server';

// Create i18n middleware
const intlMiddleware = createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'es',
  localePrefix: 'always'
});

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip locale middleware for API routes and static files
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')  // Static files (favicon.ico, manifest.json, etc.)
  ) {
    return NextResponse.next();
  }

  // 2. Apply i18n middleware first (handles locale routing)
  const intlResponse = intlMiddleware(request);

  // If i18n middleware returned a redirect, return it immediately
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }

  // 3. Exclude public auth routes from NextAuth protection
  const isPublicRoute = pathname.match(/^\/[^/]+\/auth/) || pathname.match(/^\/[^/]+\/verify-email/);
  if (isPublicRoute) {
    return intlResponse; // Public routes don't need auth
  }

  // 4. Apply NextAuth middleware for protected routes
  const protectedRoutes = ['/predictions', '/friend-groups', '/tournaments'];
  const isProtectedRoute = protectedRoutes.some(route => {
    // Check if pathname matches pattern like /es/predictions/* or /en/tournaments/*
    const regex = new RegExp(`^/[^/]+${route}`);
    return regex.test(pathname);
  });

  if (isProtectedRoute) {
    const session = await auth();
    if (!session) {
      // User not authenticated, redirect to signin
      const signInUrl = new URL(`/${pathname.split('/')[1]}/`, request.url);
      signInUrl.searchParams.set('openSignin', 'true');
      signInUrl.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // 5. Apply route redirects (existing logic, updated for locale)
  const groupsMatch = pathname.match(/^\/([^/]+)\/tournaments\/(\d+)\/groups$/);
  if (groupsMatch) {
    const locale = groupsMatch[1];
    const tournamentId = groupsMatch[2];
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/tournaments/${tournamentId}/friend-groups`;
    return NextResponse.redirect(url, 301);
  }

  return intlResponse;
}

export const config = {
  // Match all routes except API, static files, and auth routes
  matcher: [
    // Include all routes
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\..*).*)',
  ]
};

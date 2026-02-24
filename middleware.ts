import createMiddleware from 'next-intl/middleware';
import { auth } from './auth';
import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { parseAcceptLanguage, matchLocale } from './app/utils/locale-detection';
import { locales, defaultLocale } from './i18n.config';
import type { Locale } from './i18n.config';

// Helper function for custom locale detection
async function detectLocale(request: NextRequest): Promise<Locale> {
  // Priority order for locale detection:
  // 1. Cookie (NEXT_LOCALE)
  // 2. User preference from session (if authenticated)
  // 3. Accept-Language header
  // 4. Default locale

  // 1. Check cookie first (fastest)
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // 2. Check authenticated user's preference from session
  const session = await auth();
  if (session?.user?.preferred_locale && locales.includes(session.user.preferred_locale as Locale)) {
    // Set cookie for future requests
    cookieStore.set('NEXT_LOCALE', session.user.preferred_locale, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    });
    return session.user.preferred_locale as Locale;
  }

  // 3. Parse Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const acceptedLanguages = parseAcceptLanguage(acceptLanguage);
    const matchedLocale = matchLocale(acceptedLanguages, locales);
    if (matchedLocale) {
      // Set cookie for future requests
      cookieStore.set('NEXT_LOCALE', matchedLocale, {
        maxAge: 365 * 24 * 60 * 60, // 1 year
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
      });
      return matchedLocale;
    }
  }

  // 4. Fall back to default locale
  return defaultLocale;
}

// Create i18n middleware
const intlMiddleware = createMiddleware({
  locales: locales as unknown as string[],
  defaultLocale,
  localePrefix: 'always',
  localeDetection: false // Disable built-in detection, use custom function
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

  // 2. Check if path already has a locale prefix
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // 3. If no locale prefix, detect and redirect
  if (!pathnameHasLocale) {
    const detectedLocale = await detectLocale(request);
    const newUrl = new URL(`/${detectedLocale}${pathname}`, request.url);
    // Preserve query parameters
    newUrl.search = request.nextUrl.search;
    return NextResponse.redirect(newUrl);
  }

  // 4. Apply i18n middleware (handles locale routing)
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
  const protectedRoutes = ['/predictions', '/friend-groups'];
  const isProtectedRoute = protectedRoutes.some(route => {
    // Check if pathname matches pattern like /es/predictions/* or /en/friend-groups/*
    const regex = new RegExp(`^/[^/]+${route}`);
    return regex.test(pathname);
  });

  // Protected tournament sub-routes (stats, friend-groups within tournament context)
  const protectedTournamentSubRoutes = ['/stats', '/friend-groups'];
  const isProtectedTournamentRoute = pathname.match(/^\/[^/]+\/tournaments\/[^/]+/) &&
    protectedTournamentSubRoutes.some(route => pathname.includes(route));

  if (isProtectedRoute || isProtectedTournamentRoute) {
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

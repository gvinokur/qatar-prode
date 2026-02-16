# Implementation Plan: I18n Library Setup & Configuration (Story #149)

## Story Context

**Issue:** #149 - [i18n] I18n Library Setup & Configuration

**Objective:** Set up next-intl as the foundation for internationalization support across the application, enabling multi-language content with English and Spanish initially.

**Priority:** Critical - Blocker for all other i18n stories (#150, #151, #152, #153)

**Current State:**
- No i18n library installed
- Hardcoded Spanish text throughout the application
- Root layout uses hardcoded `lang="en"` attribute
- Existing middleware handles NextAuth route protection
- Material-UI theme provider already in place

**Target State:**
- next-intl installed and configured
- Middleware handles locale routing (`/en/...`, `/es/...`)
- Root layout supports dynamic locale
- Translation file structure in place (`/locales/en/`, `/locales/es/`)
- Language switcher component in header
- TypeScript configured for type-safe translations
- Spanish as default locale

## Acceptance Criteria

- [ ] next-intl package installed
- [ ] Middleware configured for locale routing with URL-based strategy
- [ ] Root layout updated to support dynamic `locale` parameter
- [ ] Locale folder structure created (`/locales/en/`, `/locales/es/`)
- [ ] Initial translation files created (common.json, navigation.json)
- [ ] Language switcher component added to header
- [ ] TypeScript types for translations configured
- [ ] Spanish set as default locale
- [ ] English and Spanish both functional
- [ ] Existing NextAuth middleware integrated with i18n middleware
- [ ] Tests achieve ≥80% coverage on new code
- [ ] 0 new SonarCloud issues
- [ ] Build succeeds without warnings

## Technical Approach

### 1. Library Selection: next-intl

**Rationale:**
- **Recommended for Next.js 15 App Router** - Official Next.js team collaboration
- **Server Component support** - Works seamlessly with RSC
- **Type-safe** - Full TypeScript support with autocomplete
- **URL-based routing** - Built-in support for `/[locale]/...` patterns
- **Better than react-i18next** for App Router - No Client Component requirement for basic usage
- **Active maintenance** - Regular updates for Next.js compatibility

### 2. Locale Strategy: URL-Based (`/[locale]/...`)

**Pattern:**
```
/en/tournaments/[id]
/es/tournaments/[id]
```

**Rationale:**
- **SEO-friendly** - Each language has unique URL
- **Shareable links** - URLs explicitly state language
- **Cacheable** - Static generation per locale
- **Clear state** - No ambiguity about current language
- **Recommended by next-intl** - First-class support

**Default Locale:** Spanish (`es`) - Latam user base

### 3. Architecture: Parallel Routes Pattern

**Root Structure:**
```
app/
  [locale]/           # Dynamic locale segment
    layout.tsx        # Locale-aware layout (wraps with IntlProvider)
    page.tsx          # Moved from app/page.tsx
    tournaments/      # All existing routes
    ...
  layout.tsx          # Root layout (moved from current layout)
  api/                # API routes (no locale)
```

**Migration Strategy:**
- Move current `app/layout.tsx` to `app/[locale]/layout.tsx`
- Create new minimal `app/layout.tsx` as root wrapper
- Move all route pages under `app/[locale]/`
- Keep `api/` routes at root (no locale)

### 4. Route Migration Strategy (Comprehensive Checklist)

**Challenge:** Moving 20+ route pages under `app/[locale]/` requires careful planning to avoid breaking routes, auth, API endpoints, and static generation.

**Migration Checklist:**

**Phase A: Prepare Locale Directory Structure**
1. Create `app/[locale]/` directory
2. Add `generateStaticParams` to locale layout for static generation:
```typescript
// app/[locale]/layout.tsx
export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }];
}
```

**Phase B: Identify Routes to Migrate**
```bash
# Current app directory structure (to be moved)
app/
  page.tsx                          → app/[locale]/page.tsx
  delete-account/page.tsx           → app/[locale]/delete-account/page.tsx
  backoffice/page.tsx               → app/[locale]/backoffice/page.tsx
  verify-email/page.tsx             → app/[locale]/verify-email/page.tsx
  rules/page.tsx                    → app/[locale]/rules/page.tsx
  reset-password/page.tsx           → app/[locale]/reset-password/page.tsx
  tournaments/[id]/page.tsx         → app/[locale]/tournaments/[id]/page.tsx
  tournaments/[id]/results/page.tsx → app/[locale]/tournaments/[id]/results/page.tsx
  tournaments/[id]/rules/page.tsx   → app/[locale]/tournaments/[id]/rules/page.tsx
  tournaments/[id]/awards/page.tsx  → app/[locale]/tournaments/[id]/awards/page.tsx
  tournaments/[id]/qualified-teams/page.tsx → app/[locale]/tournaments/[id]/qualified-teams/page.tsx
  # ... and all other route pages (~20 total)
```

**Phase C: Routes to EXCLUDE from Migration (keep at root)**
```bash
# These stay at app/* (no locale prefix needed)
app/
  api/**/*                  # API routes - no locale
  manifest.json            # PWA manifest
  service-worker.ts        # Service worker
  offline/page.tsx         # Offline page (optional: could also move)
```

**Phase D: Migration Process (Per Route)**
For each route page:
1. **Move file** - `app/page.tsx` → `app/[locale]/page.tsx`
2. **Update imports** - Adjust relative imports if path depth changed
3. **NO param changes needed** - Pages don't need to accept locale param (locale comes from context)
4. **Update internal links** - See "Link Updates Strategy" below
5. **Update generateStaticParams** - Include locale param if route has static generation (only for dynamic segments like `[id]`)
6. **Test route** - Verify route works at `/es/...` and `/en/...`

**Key simplification:** Pages do NOT need to accept `locale` as a param. The locale is available via:
- Client Components: `useLocale()` hook from `next-intl`
- Server Components: `getLocale()` from `next-intl/server`

**Phase E: Link Updates Strategy**

**Server Components** (most common in this app):
- Use `next/link` with manual locale prefix
- Get locale from `getLocale()`:
```typescript
// Before
<Link href="/tournaments">Tournaments</Link>

// After (in Server Component)
import { getLocale } from 'next-intl/server';

export default async function MyPage() {
  const locale = await getLocale();
  return <Link href={`/${locale}/tournaments`}>Tournaments</Link>
}
```

**Client Components:**
- Use `next-intl`'s `Link` and `useRouter` (automatically adds locale):
```typescript
import { Link } from 'next-intl';
import { useRouter } from 'next-intl/client';

// Link automatically adds locale
<Link href="/tournaments">Tournaments</Link>  // → /es/tournaments or /en/tournaments

// Router automatically adds locale
const router = useRouter();
router.push('/tournaments');  // → /es/tournaments or /en/tournaments
```

**Alternative for Server Components (even simpler):**
If a Server Component doesn't need other locale-specific logic, you can keep using `next/link` and let the middleware handle locale routing (it will redirect properly).

**Phase F: Update Redirects**

Current redirect in middleware needs locale handling:
```typescript
// Before
pathname.match(/^\/tournaments\/(\d+)\/groups$/)

// After (updated in middleware section)
pathname.match(/^\/([^/]+)\/tournaments\/(\d+)\/groups$/)
// Extract both locale and tournament ID
```

**Phase G: Validation After Migration**
- [ ] All routes accessible at `/es/...` and `/en/...`
- [ ] Root `/` redirects to `/es/` (default locale)
- [ ] Invalid locales (e.g., `/fr/...`) redirect to default
- [ ] API routes still work at `/api/...` (no locale)
- [ ] Static files (favicon, manifest) still accessible
- [ ] Auth flow works (signin, signout, callbacks)
- [ ] Protected routes redirect to `/[locale]/auth/signin`
- [ ] Build succeeds without errors
- [ ] No broken links in development

**Estimated scope:** ~20 route pages to migrate, ~50-100 links to update

### 5. Middleware Edge Cases & Performance

**Challenge:** Broad middleware matcher affects ALL routes, including public routes (login, signup), auth callbacks, and static assets. Need explicit exclusions to avoid performance issues and auth conflicts.

**Edge Cases to Handle:**

**A. Public Routes (Auth Pages)**
- `/es/auth/signin` - Must NOT trigger auth middleware (creates redirect loop)
- `/es/auth/signup` - Public registration page
- `/es/auth/callback` - OAuth callback routes
- `/es/verify-email` - Email verification (public, but needs locale)

**Strategy:** Exclude auth routes from NextAuth middleware protection:
```typescript
const isPublicRoute = pathname.match(/^\/[^/]+\/auth/) || pathname.match(/^\/[^/]+\/verify-email/);
if (isPublicRoute) {
  return intlResponse; // Skip auth check for public auth routes
}
```

**B. Static Files & Assets**
- `/favicon.ico`, `/logo.webp`, `/manifest.json` - No locale needed
- `/_next/static/*` - Next.js static assets
- `/_next/image/*` - Next.js image optimization

**Strategy:** Already excluded in matcher config via `.*\\..*` pattern

**C. API Routes**
- `/api/auth/*` - NextAuth API routes (no locale)
- `/api/tournaments/*` - Application API routes (no locale)

**Strategy:** Skip locale middleware for all `/api/*` routes (check in middleware)

**D. Service Worker & Offline**
- `/sw.js`, `/offline` - PWA offline support

**Strategy:** Exclude from matcher (static files) or keep at root level

**E. Root Path Edge Cases**
- `/` - Root visits → Redirect to `/es/` (default)
- `/?openSignin=true` - Query params preserved during redirect
- `/#section` - Hash fragments preserved

**Strategy:** next-intl middleware handles this automatically with locale detection

**F. Query Parameters & Auth Redirects**
- NextAuth redirect: `/es/tournaments/42` (protected) → `/es/auth/signin?callbackUrl=/es/tournaments/42`
- Language switch: `/es/tournaments/42?tab=standings` → `/en/tournaments/42?tab=standings`

**Strategy:**
- NextAuth: Already handles callbackUrl
- Language switcher: Updated to preserve query params (see Language Switcher section)

**Performance Considerations:**

**Impact Analysis:**
- **Before:** Middleware runs on 3 route patterns only (`/predictions/:path*`, `/friend-groups/:path*`, `/tournaments/:path*`)
- **After:** Middleware runs on ALL routes (except API and static files)
- **Concern:** Increased middleware execution frequency

**Mitigation:**
1. **Fast execution** - i18n middleware is lightweight (just locale detection/redirect)
2. **Early returns** - Explicit checks exit early for excluded routes
3. **No auth overhead on public routes** - Only protected routes run auth logic
4. **Static generation** - Most pages are statically generated (no middleware in production)
5. **Edge caching** - Vercel Edge Network caches responses

**Monitoring:**
- Track middleware execution time in production
- Monitor Vercel Analytics for any performance degradation
- If issues arise: Consider moving some routes to route groups to reduce matcher scope

### 6. Middleware Implementation (Complete)

**Implementation incorporating all edge case handling:**

```typescript
import createMiddleware from 'next-intl/middleware';
import { auth } from './auth';
import { NextResponse } from 'next/server';

// Create i18n middleware
const intlMiddleware = createMiddleware({
  locales: ['en', 'es'],
  defaultLocale: 'es',
  localePrefix: 'always'
});

export default async function middleware(request: Request) {
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
    const authResult = await auth(request);
    if (authResult) {
      return authResult; // Redirect to signin if not authenticated
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
```

**Key implementation details:**
1. **i18n middleware runs FIRST** - Handles locale detection and routing before auth
2. **Explicit route exclusions** - API routes, static files skip locale middleware
3. **Public route bypass** - Auth pages don't trigger NextAuth protection
4. **Conditional auth** - Only protected routes run auth logic
5. **Route redirects updated** - Extract locale from pathname for redirects

**Auth flow with locales:**
- User visits `/` → next-intl redirects to `/es` (default locale)
- User visits `/es/tournaments` → Protected, NextAuth checks auth, redirects to `/es/auth/signin?callbackUrl=/es/tournaments` if needed
- User visits `/es/auth/signin` → Public route, no auth check (prevents redirect loop)
- User visits `/api/auth/signin` → Skips locale middleware, goes directly to auth API

### 7. Folder Structure for Translations

**Structure:**
```
locales/
  en/
    common.json       # Common translations (buttons, labels, errors)
    navigation.json   # Navigation items (header, footer, menus)
  es/
    common.json
    navigation.json
```

**Initial Translation Files:**

**`locales/en/common.json`:**
```json
{
  "app": {
    "name": "Qatar Prode",
    "description": "Sports Prediction Platform",
    "loading": "Loading...",
    "error": "An error occurred",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close"
  }
}
```

**`locales/es/common.json`:**
```json
{
  "app": {
    "name": "Prode Mundial",
    "description": "Plataforma de pronósticos deportivos",
    "loading": "Cargando...",
    "error": "Ocurrió un error",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "close": "Cerrar"
  }
}
```

**`locales/en/navigation.json`:**
```json
{
  "header": {
    "home": "Home",
    "tournaments": "Tournaments",
    "profile": "Profile",
    "logout": "Logout",
    "login": "Login"
  }
}
```

**`locales/es/navigation.json`:**
```json
{
  "header": {
    "home": "Inicio",
    "tournaments": "Torneos",
    "profile": "Perfil",
    "logout": "Cerrar sesión",
    "login": "Iniciar sesión"
  }
}
```

### 8. TypeScript Configuration (Multiple Namespaces)

**Challenge:** Applications use multiple translation namespaces (common, navigation, etc.). TypeScript needs to know about ALL namespaces for type safety.

**Create `types/i18n.ts` (supports multiple namespaces):**
```typescript
import common from '@/locales/en/common.json';
import navigation from '@/locales/en/navigation.json';

// Merge all namespaces into single type
type Messages = {
  common: typeof common;
  navigation: typeof navigation;
};

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}

// Export for use in getMessages() server-side
export default Messages;
```

**Usage in components:**
```typescript
// Client Component
'use client'
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('common');      // TypeScript knows about common.*
  const tNav = useTranslations('navigation'); // TypeScript knows about navigation.*

  return <div>{t('app.name')}</div>; // ✅ Autocomplete + type checking
}

// Server Component
import { getTranslations } from 'next-intl/server';

export async function MyServerComponent() {
  const t = await getTranslations('common');
  return <div>{t('app.loading')}</div>; // ✅ Type-safe
}
```

**Update `tsconfig.json`:**
```json
{
  "compilerOptions": {
    // ... existing config
    "paths": {
      "@/*": ["./*"],
      "@locales/*": ["./locales/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    "types/*.ts"
  ]
}
```

**Note:** When adding new translation namespaces later (e.g., `auth.json`, `errors.json`), import them in `types/i18n.ts` and add to the `Messages` type.

### 9. Root Layout Updates

**New minimal root layout (`app/layout.tsx`):**
```typescript
import '../styles/globals.css';
import {Metadata} from "next";

export async function generateMetadata() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Prode Mundial';
  const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Plataforma de pronósticos deportivos';

  return {
    title: appName,
    description: appDescription,
    manifest: '/manifest.json',
    // ... rest of metadata (same as before)
  } as Metadata;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children; // Just pass through, locale layout handles the rest
}
```

**Locale-aware layout (`app/[locale]/layout.tsx`):**
```typescript
'use server'

import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import SessionWrapper from "../components/session-wrapper";
import ThemeProvider from "../components/context-providers/theme-provider";
import NextThemeProvider from '../components/context-providers/next-theme-wrapper-provider';
import InstallPwa from "../components/Install-pwa";
import OfflineDetection from "../components/offline-detection";
import Header from "../components/header/header";
import ConditionalHeader from "../components/header/conditional-header";
import {getLoggedInUser} from "../actions/user-actions";
import { unstable_ViewTransition as ViewTransition } from 'react'
import { TimezoneProvider } from '../components/context-providers/timezone-context-provider';
import { CountdownProvider } from '../components/context-providers/countdown-context-provider';
import Footer from '../components/home/footer';

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const user = await getLoggedInUser();
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Prode Mundial';
  const messages = await getMessages();

  return (
    <html lang={locale} style={{ height: '100%' }}>
      <head>
        <meta name="apple-mobile-web-app-title" content={appName}/>
      </head>
      <body style={{minHeight: '100%', paddingBottom: '64px'}}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <TimezoneProvider>
            <CountdownProvider>
              <NextThemeProvider defaultTheme={'system'} enableSystem={true}>
                <ThemeProvider>
                  <SessionWrapper>
                    <ConditionalHeader>
                      <Header user={user}/>
                    </ConditionalHeader>
                    <ViewTransition
                      name={'main'}
                      enter={'page-enter'}
                      exit={'page-exit duration-100'}
                    >
                      {children}
                    </ViewTransition>
                    <Footer message={`${appName} © 2025`} />
                    <InstallPwa />
                    <OfflineDetection />
                  </SessionWrapper>
                </ThemeProvider>
              </NextThemeProvider>
            </CountdownProvider>
          </TimezoneProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

**Key changes:**
- Added `locale={locale}` prop to `NextIntlClientProvider` (provides locale to context)
- Removed `locale={locale}` from `<Header>` (Header gets it from context now)
- Children and all nested components can now access locale via `useLocale()` (client) or `getLocale()` (server)
```

### 10. Language Switcher Component

**Create `app/components/header/language-switcher.tsx` (preserves query params & hash):**
```typescript
'use client'

import { useLocale } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { IconButton, Menu, MenuItem } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useState } from 'react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇦🇷' },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (newLocale: string) => {
    // Replace current locale in pathname
    const segments = pathname.split('/');
    segments[1] = newLocale; // Replace locale segment
    const newPathname = segments.join('/');

    // Preserve query parameters and hash
    const queryString = searchParams.toString();
    const hash = window.location.hash;
    const fullUrl = `${newPathname}${queryString ? `?${queryString}` : ''}${hash}`;

    router.push(fullUrl);
    handleClose();
  };

  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <>
      <IconButton
        onClick={handleOpen}
        aria-label="Select language"
        sx={{ color: 'inherit' }}
      >
        <LanguageIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            selected={language.code === locale}
          >
            <span style={{ marginRight: '8px' }}>{language.flag}</span>
            {language.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
```

**Key fix:** Added `useSearchParams()` to preserve query parameters when switching languages.

**Example:**
- Before fix: `/es/tournaments/42?tab=standings` → `/en/tournaments/42` (loses `?tab=standings`)
- After fix: `/es/tournaments/42?tab=standings` → `/en/tournaments/42?tab=standings` ✅

**Update `app/components/header/header.tsx`:**
```typescript
'use server'

import * as React from "react";
import {
  AppBar,
  Typography,
  Box,
  Avatar,
} from "@mui/material";
import UserActions from "./user-actions";
import Link from "next/link";
import {User} from "next-auth";
import ThemeSwitcher from "./theme-switcher";
import LanguageSwitcher from "./language-switcher"; // NEW
import { getLocale } from 'next-intl/server'; // NEW

type FrameProps = {
  readonly user?: User;
}

export default async function Header(props: FrameProps) {
  const locale = await getLocale(); // Get locale from context

  return (
    <AppBar position={'sticky'}>
      <Box
        display={'flex'}
        flexDirection={'row'}
        px={2}
        py={1}
        gap={2}
        justifyContent={'space-between'}
      >
        <Box>
          <Link href={`/${locale}`}> {/* Add locale prefix */}
            <Avatar
              variant={"rounded"}
              src={'/logo.webp'}
              alt='la-maquina-prode'
              sx={{
                backgroundColor: 'white',
                height: 60,
                width: 60,
                mr: 2,
              }}/>
          </Link>
        </Box>
        <Typography
          variant="h6"
          noWrap
          alignContent={'center'}
          sx={{
            fontWeight: 700,
            color: 'inherit',
            textDecoration: 'none',
            cursor: 'pointer'
          }}>
          <Link href={`/${locale}`}>La Maquina Prode</Link> {/* Add locale prefix */}
        </Typography>
        <Box
          alignContent={'center'}
          display={'flex'}
          flexDirection={'row'}
          justifyContent={'flex-end'}
          flexWrap={'wrap'}
          minWidth={'96px'}
        >
          <LanguageSwitcher /> {/* NEW */}
          <ThemeSwitcher />
          <UserActions user={props.user}/>
        </Box>
      </Box>
    </AppBar>
  )
}
```

**Key changes:**
- Removed `locale` from props (no longer passed from layout)
- Added `getLocale()` from `next-intl/server` to get locale from context
- Header now gets locale automatically without needing it passed as prop

### 11. i18n Configuration File

**Create `i18n.config.ts`:**
```typescript
export const locales = ['en', 'es'] as const;
export const defaultLocale = 'es' as const;

export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
};
```

### 12. Navigation Integration

**Update internal links to use locale:**

Next.js will automatically handle locale prefixes with next-intl's Link component:

```typescript
import {Link} from 'next-intl';

// Usage (automatically adds locale prefix)
<Link href="/tournaments">Tournaments</Link>
// Renders as: /es/tournaments or /en/tournaments
```

**For links in Server Components:**
- Use `next/link` with manual locale prefix: `href={`/${locale}/tournaments`}`
- OR create a helper function to build locale-aware paths

## Implementation Steps

### Phase 1: Install and Configure next-intl
1. Install next-intl package: `npm install next-intl`
2. Create i18n configuration file: `i18n.config.ts`
3. Create TypeScript types: `types/i18n.ts`
4. Update `tsconfig.json` with locale path aliases

### Phase 2: Create Translation File Structure
1. Create `locales/en/common.json` with initial translations
2. Create `locales/en/navigation.json` with navigation translations
3. Create `locales/es/common.json` with Spanish translations
4. Create `locales/es/navigation.json` with Spanish navigation

### Phase 3: Update Middleware
1. Create combined middleware integrating next-intl with NextAuth
2. Update middleware config matcher to include all routes except API/static
3. Handle locale detection and routing
4. Test middleware with protected routes

### Phase 4: Restructure App Directory
1. Create `app/[locale]/` directory
2. Move current `app/layout.tsx` to `app/[locale]/layout.tsx`
3. Update locale layout with `NextIntlClientProvider`
4. Create minimal root `app/layout.tsx`
5. Move all route pages under `app/[locale]/`
   - `app/page.tsx` → `app/[locale]/page.tsx`
   - `app/tournaments/` → `app/[locale]/tournaments/`
   - etc.
6. Keep `app/api/` at root level (no locale)

### Phase 5: Create Language Switcher Component
1. Create `LanguageSwitcher` client component
2. Add to header component
3. Implement locale switching logic
4. Style with Material-UI

### Phase 6: Update Header Component
1. Pass `locale` prop to Header
2. Add locale prefix to Link hrefs
3. Integrate LanguageSwitcher component
4. Test header rendering in both locales

### Phase 7: Update Existing Links
1. Identify all internal links in codebase
2. Update to use locale-aware paths
3. For Server Components: Use manual `/${locale}/...` prefixes
4. For Client Components: Use next-intl's `Link` component or `useRouter`

### Phase 8: Testing & Validation
1. Create tests for LanguageSwitcher component
2. Create tests for middleware locale routing
3. Create tests for locale layout rendering
4. Test language switching in browser
5. Run linter, tests, build
6. Verify both English and Spanish work

## Files to Create

**New Files:**
- `i18n.config.ts` - i18n configuration
- `types/i18n.ts` - TypeScript types for translations
- `locales/en/common.json` - English common translations
- `locales/en/navigation.json` - English navigation translations
- `locales/es/common.json` - Spanish common translations
- `locales/es/navigation.json` - Spanish navigation translations
- `app/[locale]/layout.tsx` - Locale-aware layout (IntlProvider wrapper)
- `app/[locale]/page.tsx` - Moved from `app/page.tsx`
- `app/components/header/language-switcher.tsx` - Language switcher component

**Test Files:**
- `__tests__/components/header/language-switcher.test.tsx` - Language switcher tests
- `__tests__/middleware.test.ts` - Middleware locale routing tests
- `__tests__/app/[locale]/layout.test.tsx` - Locale layout tests

## Files to Modify

**Modified Files:**
- `middleware.ts` - Integrate next-intl middleware with NextAuth
- `app/layout.tsx` - Minimal root layout (pass-through)
- `app/components/header/header.tsx` - Add LanguageSwitcher, locale prop, locale-aware links
- `tsconfig.json` - Add locale path aliases
- `package.json` - Add next-intl dependency

**Files to Move:**
- `app/layout.tsx` → `app/[locale]/layout.tsx` (with modifications)
- `app/page.tsx` → `app/[locale]/page.tsx`
- All route pages → `app/[locale]/...` (bulk move, no modifications yet)

**Note:** This story focuses on infrastructure setup. Translation of existing content will be handled in subsequent stories (#150-#153).

## Testing Strategy

### Unit Tests

**Component Tests (Vitest + React Testing Library):**

1. **`language-switcher.test.tsx` (new):**
   - Renders language switcher button
   - Opens menu on click
   - Shows all available languages
   - Highlights current language
   - Switches language on selection
   - Updates URL with new locale
   - Closes menu after selection
   - Accessibility: keyboard navigation, aria-labels

2. **`header.test.tsx` (update existing):**
   - Renders with locale prop
   - Passes locale to language switcher
   - Links have locale prefix
   - Renders all header components

3. **`layout.test.tsx` (new - for locale layout):**
   - Renders with locale param
   - Wraps children with NextIntlClientProvider
   - Sets correct html lang attribute
   - Loads messages correctly
   - Renders all context providers

**Middleware Tests:**

4. **`middleware.test.ts` (update existing):**
   - Redirects root `/` to `/es` (default locale)
   - Accepts `/en` and `/es` paths
   - Redirects invalid locales to default
   - Applies locale to all routes
   - Integrates with NextAuth (protected routes still work)
   - Old route redirects still work with locale prefix

**Integration Tests:**

5. **`i18n-routing.test.ts` (new):**
   - Navigate to `/en/tournaments` → renders English
   - Navigate to `/es/tournaments` → renders Spanish
   - Switch language → URL updates and content changes
   - Deep links work with locale
   - API routes unaffected by locale

### Test Utilities

**Use mandatory utilities:**
- `renderWithTheme()` from `@/__tests__/utils/test-utils`
- `renderWithProviders()` for context wrappers (including IntlProvider)
- Mock next-intl hooks: `useLocale`, `useTranslations`
- Mock Next.js navigation: `useRouter`, `usePathname`

**Create i18n test utilities:**
```typescript
// __tests__/utils/i18n-test-utils.tsx
import { NextIntlClientProvider } from 'next-intl';

export function renderWithIntl(
  ui: React.ReactElement,
  {
    locale = 'en',
    messages = {},
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return renderWithTheme(ui, { wrapper: Wrapper, ...renderOptions });
}
```

### Coverage Goals

- ≥80% coverage on all new files
- Branch coverage for:
  - Locale switching logic
  - Middleware routing decisions
  - Message loading
  - Default locale fallback
- All user interaction flows (language switching)

## Accessibility Requirements

### WCAG 2.1 AA Compliance

**1. Language Attributes:**
- `<html lang={locale}>` dynamically set per locale
- Announces language to screen readers
- Helps with text-to-speech pronunciation

**2. Language Switcher:**
- Keyboard accessible (IconButton with focus indicator)
- `aria-label="Select language"` on button
- Menu items keyboard navigable (Tab, Arrow keys, Enter)
- Current language indicated (selected state + visual indicator)

**3. Screen Reader Announcements:**
- Language change announced to screen readers
- Menu items have clear labels ("English", "Español")
- Selected state announced

**4. Focus Management:**
- Focus remains on language switcher after close
- No keyboard traps in menu
- Focus visible indicators

## Validation Considerations

### SonarCloud Requirements

**To meet quality gates:**

1. **Code Coverage:** ≥80% on new code
   - Test language switcher component
   - Test middleware locale routing
   - Test layout IntlProvider integration

2. **Code Duplication:** <5%
   - Reuse i18n config across middleware and layout
   - Extract locale switching logic into utility if needed

3. **Complexity:** Keep functions simple
   - Middleware should delegate to next-intl
   - Language switcher has clear, single responsibility

4. **Security:** No vulnerabilities
   - Validate locale parameter against allowed locales
   - No injection risks in locale handling

5. **Maintainability:** B or higher
   - Clear naming conventions for locale files
   - Documented i18n configuration
   - Consistent with Next.js patterns

### Pre-Commit Checks

**Before committing (MANDATORY):**
1. Run tests: `npm test`
2. Run linter: `npm run lint`
3. Run build: `npm run build`
4. All must pass ✅

### Vercel Preview Testing

**After commit/push:**
1. Test language switching in both directions (EN ↔ ES)
2. Verify URL updates correctly
3. Test deep links with locale prefix
4. Verify protected routes still work
5. Check header rendering in both locales
6. Test on mobile (menu behavior)
7. Verify no console errors

## Design Decisions

### 1. Default Locale: Spanish ✅
**Rationale:** Current user base is primarily Latam (Spanish-speaking)
**Evidence:** Story #107 mentions "We only have Latam spanish as language"

### 2. URL-Based Locale Strategy ✅
**Rationale:** SEO-friendly, shareable links, recommended by next-intl
**Alternative considered:** Cookie-based (rejected - less transparent, not shareable)

### 3. Always Show Locale Prefix ✅
**Rationale:** Explicit, no ambiguity, easier to reason about
**Alternative considered:** Hide default locale (rejected - inconsistent URLs)

### 4. Combined Middleware ✅
**Rationale:** Single middleware function for both i18n and auth
**Alternative considered:** Separate middlewares (rejected - composition complexity)

### 5. Parallel Routes Pattern ✅
**Rationale:** Next.js recommended pattern for i18n with App Router
**Alternative considered:** Rewrite-based (rejected - more complex, less type-safe)

## Open Questions

### Question 1: Should API routes be localized?
**Context:** API routes typically return JSON, not user-facing content

**Options:**
- **Option A:** Keep API routes at root level (no locale)
- **Option B:** Localize API error messages

**Recommendation:** Option A - API routes don't need localization in this story. Error message localization can be handled later if needed.

### Question 2: Should we redirect root `/` to default locale?
**Context:** User visits root URL without locale

**Options:**
- **Option A:** Redirect to `/es` (default locale)
- **Option B:** Detect browser language and redirect accordingly

**Recommendation:** Option B - next-intl middleware handles this automatically (detects `Accept-Language` header, falls back to default if not supported)

### Question 3: Should locale be persisted in a cookie?
**Context:** Remember user's language choice across sessions

**Options:**
- **Option A:** URL-only (no cookie)
- **Option B:** Cookie + URL (user choice persisted)

**Recommendation:** Option B - next-intl supports this via `localeDetection` config. User's last choice is remembered.

## Risk Assessment

### Low Risk ✅
- ✅ **next-intl is mature** - Well-maintained, widely used
- ✅ **Official Next.js patterns** - Following App Router best practices
- ✅ **Minimal code changes** - Infrastructure setup, not content translation
- ✅ **Incremental migration** - This story doesn't translate existing content
- ✅ **Test coverage** - Comprehensive tests for new components

### Medium Risk ⚠️
- ⚠️ **Middleware complexity** - Combining NextAuth + i18n middleware
- ⚠️ **Route migrations** - Moving all pages under `[locale]/`
- ⚠️ **Link updates** - All internal links need locale awareness
- ⚠️ **Build impact** - Vercel build time might increase with multiple locales

### Mitigation Strategies
1. Test middleware thoroughly (unit tests + manual testing)
2. Move routes incrementally (start with homepage, then others)
3. Use TypeScript to catch broken links at compile time
4. Monitor Vercel build times (static generation should be fast)
5. Test in Vercel Preview before merging

## Success Metrics

**Definition of Done:**
- [ ] next-intl package installed
- [ ] Middleware routes to `/en` and `/es` correctly
- [ ] Root layout sets `lang` attribute dynamically
- [ ] Locale folder structure created with initial translations
- [ ] Language switcher component renders in header
- [ ] Language switching works (EN ↔ ES)
- [ ] URL updates on language change
- [ ] Spanish is default locale
- [ ] TypeScript types for translations configured
- [ ] Existing NextAuth middleware still works
- [ ] Tests pass with ≥80% coverage on new code
- [ ] 0 new SonarCloud issues
- [ ] Linter passes
- [ ] Build succeeds
- [ ] No console warnings/errors
- [ ] User approval in Vercel Preview

## Related Documentation

- **next-intl Docs:** https://next-intl-docs.vercel.app/
- **Next.js i18n:** https://nextjs.org/docs/app/building-your-application/routing/internationalization
- **Architecture:** [architecture.md](../docs/claude/architecture.md) - Server/Client boundaries
- **Testing:** [testing.md](../docs/claude/testing.md) - Use mandatory test utilities
- **Validation:** [validation.md](../docs/claude/validation.md) - SonarCloud quality gates

## Next Steps

After plan approval:
1. Read [implementation.md](../docs/claude/implementation.md) completely
2. Define tasks with TaskCreate (atomic, with dependencies)
3. Implement infrastructure setup following approved design
4. Create tests in parallel
5. Run validation checks (test, lint, build)
6. Commit and deploy to Vercel Preview
7. User testing and feedback
8. Final SonarCloud validation
9. Ready to merge

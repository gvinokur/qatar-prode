# Implementation Plan: [i18n] PWA Manifest & Metadata Localization (#158)

## Context

The application currently has a static PWA manifest (`/app/manifest.json`) hardcoded in Spanish, and metadata in the root layout that uses environment variables without locale awareness. This creates an inconsistent user experience where:

- PWA users installing the app see Spanish name/description regardless of their language preference
- SEO metadata (Open Graph, Twitter cards) is not localized
- Search engines and social media platforms see only Spanish content
- Apple touch icon names are not localized

This impacts international user experience, SEO performance, and professional appearance when the app is shared on social platforms.

## Objectives

1. Convert static manifest to dynamic, locale-aware manifests
2. Generate locale-specific PWA manifests for Spanish and English
3. Localize all metadata (title, description, Open Graph, Twitter cards)
4. Improve SEO with proper locale tags and social media metadata
5. Reuse existing translations from `common.json` (no new keys needed)
6. Ensure PWA functionality remains unchanged

## Acceptance Criteria

- [ ] PWA manifest serves Spanish content when locale is 'es'
- [ ] PWA manifest serves English content when locale is 'en'
- [ ] Metadata (`title`, `description`) is localized in both languages
- [ ] Open Graph tags are locale-aware (including `og:locale`)
- [ ] Twitter cards are localized
- [ ] Apple touch icon metadata is localized (meta tag `apple-mobile-web-app-title`)
- [ ] Manifest language (`lang`) matches locale
- [ ] PWA installation works correctly in both languages
- [ ] Social media previews show correct language
- [ ] Tests verify metadata localization
- [ ] 80% coverage on new test files (SonarCloud requirement)

## Technical Approach

### 1. Dynamic Manifest with Next.js 15 Route Handler

**Next.js 15 Pattern:** Create `app/[locale]/manifest.ts` to generate locale-specific manifests.

**File:** `app/[locale]/manifest.ts` (NEW)

```typescript
import { MetadataRoute } from 'next'
import { getTranslations } from 'next-intl/server'

export default async function manifest(
  { params }: { params: Promise<{ locale: string }> }
): Promise<MetadataRoute.Manifest> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })

  return {
    id: 'prode_mundial',
    start_url: `/${locale}`,
    name: t('app.name'),
    short_name: t('app.name'),
    description: t('app.description'),
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    theme_color: '#242424',
    background_color: '#242424',
    display: 'standalone',
    dir: 'auto',
    lang: locale, // Dynamic locale
    orientation: 'any',
    categories: ['social', 'sports']
  }
}
```

**Caching Strategy:**
- Next.js 15 automatically generates static manifests at build time for each locale
- Uses `generateStaticParams` from parent locale layout (already defines 'es' and 'en')
- No dynamic caching needed - manifests are fully static since translations don't change at runtime
- Service worker will handle manifest updates when PWA is reinstalled

**Rationale:**
- Next.js 15 serves manifests from `[locale]/manifest.ts` at `/{locale}/manifest.webmanifest`
- Uses existing translations from `common.json` (no new keys needed)
- Dynamically sets `lang` and `start_url` based on locale
- Maintains all existing PWA configuration

### 2. Localized Metadata in Layouts

**Update Root Layout** - Add SEO metadata (Open Graph, Twitter cards)

**File:** `app/layout.tsx` (MODIFY)

**Changes:**
1. Keep existing metadata structure
2. Add Open Graph metadata
3. Add Twitter card metadata
4. Use environment variables (locale-agnostic fallbacks)

```typescript
export async function generateMetadata() {
  const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Prode Mundial';
  const appDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Plataforma de pronósticos deportivos';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prodemundial.app';

  return {
    title: appName,
    description: appDescription,
    manifest: '/manifest.json', // Keep for backwards compatibility
    metadataBase: new URL(appUrl),
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: appName,
    },
    openGraph: {
      type: 'website',
      siteName: appName,
      title: appName,
      description: appDescription,
      url: appUrl,
      images: [
        {
          url: '/web-app-manifest-512x512.png',
          width: 512,
          height: 512,
          alt: appName,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: appName,
      description: appDescription,
      images: ['/web-app-manifest-512x512.png'],
    },
    icons: [
      {rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml'},
      {rel: 'icon', url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png'},
      {rel: 'shortcut icon', url: '/favicon.ico'},
      {rel: 'apple-touch-icon', url: '/apple-touch-icon.png', sizes: '180x180'},
    ]
  } as Metadata;
}
```

**Update Locale Layout** - Add locale-aware metadata

**File:** `app/[locale]/layout.tsx` (MODIFY)

**Changes:**
1. Add `generateMetadata` function (async)
2. Localize title, description, Open Graph, Twitter cards
3. Add proper `og:locale` and `og:locale:alternate` tags
4. Use `getTranslations` from `next-intl/server`
5. Update manifest reference to locale-specific manifest

```typescript
import {getMessages, getTranslations} from 'next-intl/server';
import {Metadata} from "next";

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'es' }];
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prodemundial.app'

  const appName = t('app.name')
  const appDescription = t('app.description')

  // Determine alternate locale
  const alternateLocale = locale === 'es' ? 'en' : 'es'

  return {
    title: appName,
    description: appDescription,
    manifest: `/${locale}/manifest.webmanifest`, // Locale-specific manifest
    metadataBase: new URL(appUrl),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'es': '/es',
        'en': '/en',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale,
      alternateLocale: [alternateLocale],
      siteName: appName,
      title: appName,
      description: appDescription,
      url: `${appUrl}/${locale}`,
      images: [
        {
          url: '/web-app-manifest-512x512.png',
          width: 512,
          height: 512,
          alt: appName,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: appName,
      description: appDescription,
      images: ['/web-app-manifest-512x512.png'],
    },
  }
}

export default async function LocaleLayout({
  children,
  params
}: {
  readonly children: React.ReactNode;
  readonly params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getLoggedInUser();
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'common' })

  const appName = t('app.name')

  return (
    <html lang={locale} style={{ height: '100%' }}>
      <head>
        <meta name="apple-mobile-web-app-title" content={appName}/>
      </head>
      <body style={{minHeight: '100%', paddingBottom: '64px'}}>
        {/* Rest of layout remains unchanged */}
      </body>
    </html>
  )
}
```

**Rationale:**
- Locale layout generates locale-specific metadata
- Open Graph `og:locale` and `og:locale:alternate` improve SEO
- Twitter cards enhance social media sharing
- Manifest reference points to dynamic locale manifest
- Reuses existing `common.json` translations (already exist!)

### 3. Translation Keys (Existing - No Changes Needed)

**Good news:** All required translations already exist in `common.json`!

**Spanish (locales/es/common.json):**
```json
{
  "app": {
    "name": "Prode Mundial",
    "description": "Plataforma de pronósticos deportivos"
  }
}
```

**English (locales/en/common.json):**
```json
{
  "app": {
    "name": "World Cup Predictions",
    "description": "Sports prediction platform"
  }
}
```

**No new translation keys needed!** We simply reuse these existing values.

### 4. Static Manifest Migration Strategy

**File:** `app/manifest.json` (KEEP temporarily, DELETE after verification)

**Migration approach:**
1. **During development:** Keep both static and dynamic manifests
   - Static manifest at `/app/manifest.json` (current)
   - Dynamic manifests at `/es/manifest.webmanifest` and `/en/manifest.webmanifest` (new)
   - Root layout points to `/manifest.json` (backwards compatibility)
   - Locale layout points to `/${locale}/manifest.webmanifest` (new behavior)

2. **After verification in Vercel Preview:**
   - Confirm both `/es/manifest.webmanifest` and `/en/manifest.webmanifest` work correctly
   - Test PWA installation in both locales
   - Verify no console errors or warnings

3. **Cleanup (only after verification):**
   - Delete `app/manifest.json`
   - Remove or update `manifest: '/manifest.json'` reference in root layout
   - All requests will use locale-specific manifests

**Why keep static manifest initially:**
- Prevents breaking existing PWA installations during development
- Allows gradual migration and testing
- Provides fallback if dynamic manifests have issues

**Fallback behavior:**
- App routes are locale-prefixed (`/es`, `/en`), so all manifest requests include locale
- No need for locale-less fallback - middleware redirects root `/` to default locale

### 5. Testing Strategy

**Create comprehensive tests for metadata localization**

#### Test File 1: Manifest Tests

**File:** `app/[locale]/__tests__/manifest.test.ts` (NEW)

**Test utilities:**
- Use Vitest's mocking capabilities for `next-intl/server`
- Mock `getTranslations` to return locale-specific values
- No need for `renderWithTheme` (not a component)

**Test scenarios:**
1. **Spanish manifest** - Verify Spanish name/description
2. **English manifest** - Verify English name/description
3. **Locale-specific properties** - Verify `lang` and `start_url` are locale-specific
4. **PWA structure** - Verify all required manifest fields exist

```typescript
import { describe, it, expect, vi } from 'vitest'
import manifest from '../manifest'

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) => {
    const translations: Record<string, Record<string, string>> = {
      'es': {
        'app.name': 'Prode Mundial',
        'app.description': 'Plataforma de pronósticos deportivos'
      },
      'en': {
        'app.name': 'World Cup Predictions',
        'app.description': 'Sports prediction platform'
      }
    }
    return (key: string) => translations[locale]?.[key] || key
  }
}))

describe('Locale-specific PWA Manifest', () => {

describe('Locale-specific PWA Manifest', () => {
  it('generates Spanish manifest with correct locale', async () => {
    const result = await manifest({ params: Promise.resolve({ locale: 'es' }) })

    expect(result.name).toBe('Prode Mundial')
    expect(result.description).toBe('Plataforma de pronósticos deportivos')
    expect(result.lang).toBe('es')
    expect(result.start_url).toBe('/es')
  })

  it('generates English manifest with correct locale', async () => {
    const result = await manifest({ params: Promise.resolve({ locale: 'en' }) })

    expect(result.name).toBe('World Cup Predictions')
    expect(result.description).toBe('Sports prediction platform')
    expect(result.lang).toBe('en')
    expect(result.start_url).toBe('/en')
  })

  it('includes all required PWA fields', async () => {
    const result = await manifest({ params: Promise.resolve({ locale: 'es' }) })

    expect(result.id).toBe('prode_mundial')
    expect(result.theme_color).toBe('#242424')
    expect(result.background_color).toBe('#242424')
    expect(result.display).toBe('standalone')
    expect(result.icons).toHaveLength(3)
    expect(result.categories).toEqual(['social', 'sports'])
  })

  it('includes correct icon configurations', async () => {
    const result = await manifest({ params: Promise.resolve({ locale: 'es' }) })

    expect(result.icons[0]).toMatchObject({
      src: '/web-app-manifest-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable'
    })

    expect(result.icons[1]).toMatchObject({
      src: '/web-app-manifest-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable'
    })
  })
})
```

#### Test File 2: Layout Metadata Tests

**File:** `app/[locale]/__tests__/layout-metadata.test.tsx` (NEW)

**Test utilities:**
- Mock `next-intl/server` (getTranslations, getMessages)
- Mock `next/navigation` if needed for routing
- No rendering needed - testing metadata function directly

**Test scenarios:**
1. **Spanish metadata** - Verify Spanish title/description
2. **English metadata** - Verify English title/description
3. **Open Graph locale** - Verify `og:locale` is set correctly
4. **Alternate locales** - Verify `og:locale:alternate` includes other locale
5. **Manifest reference** - Verify manifest URL includes locale
6. **Twitter cards** - Verify Twitter metadata is localized

```typescript
import { describe, it, expect, vi } from 'vitest'
import { generateMetadata } from '../layout'

// Mock next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: async ({ locale, namespace }: { locale: string; namespace: string }) => {
    const translations: Record<string, Record<string, string>> = {
      'es': {
        'app.name': 'Prode Mundial',
        'app.description': 'Plataforma de pronósticos deportivos'
      },
      'en': {
        'app.name': 'World Cup Predictions',
        'app.description': 'Sports prediction platform'
      }
    }
    return (key: string) => translations[locale]?.[key] || key
  },
  getMessages: async () => ({}) // Return empty messages object
}))

// Mock user actions (LocaleLayout uses getLoggedInUser)
vi.mock('../../../../actions/user-actions', () => ({
  getLoggedInUser: async () => null
}))

describe('LocaleLayout Metadata', () => {

describe('LocaleLayout Metadata', () => {
  it('generates Spanish metadata with correct locale', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'es' })
    })

    expect(metadata.title).toBe('Prode Mundial')
    expect(metadata.description).toBe('Plataforma de pronósticos deportivos')
    expect(metadata.manifest).toBe('/es/manifest.webmanifest')
  })

  it('generates English metadata with correct locale', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' })
    })

    expect(metadata.title).toBe('World Cup Predictions')
    expect(metadata.description).toBe('Sports prediction platform')
    expect(metadata.manifest).toBe('/en/manifest.webmanifest')
  })

  it('includes Open Graph metadata with correct locale', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'es' })
    })

    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      locale: 'es',
      alternateLocale: ['en'],
      siteName: 'Prode Mundial',
      title: 'Prode Mundial',
      description: 'Plataforma de pronósticos deportivos',
    })
  })

  it('includes Twitter card metadata', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' })
    })

    expect(metadata.twitter).toMatchObject({
      card: 'summary',
      title: 'World Cup Predictions',
      description: 'Sports prediction platform',
    })
  })

  it('includes canonical and language alternates', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ locale: 'es' })
    })

    expect(metadata.alternates).toMatchObject({
      canonical: '/es',
      languages: {
        'es': '/es',
        'en': '/en',
      },
    })
  })

  it('sets alternate locale correctly for both languages', async () => {
    const esMetadata = await generateMetadata({
      params: Promise.resolve({ locale: 'es' })
    })
    const enMetadata = await generateMetadata({
      params: Promise.resolve({ locale: 'en' })
    })

    expect(esMetadata.openGraph?.alternateLocale).toEqual(['en'])
    expect(enMetadata.openGraph?.alternateLocale).toEqual(['es'])
  })
})
```

**Coverage target:** 80% minimum (SonarCloud requirement)
- Both test files provide comprehensive coverage
- Tests verify all critical metadata fields
- Edge cases covered (both locales tested)

## Implementation Steps

### Step 1: Create Dynamic Manifest
1. Create `app/[locale]/manifest.ts`
2. Import `MetadataRoute` from 'next'
3. Import `getTranslations` from 'next-intl/server'
4. Implement manifest function with locale parameter
5. Use `t('app.name')` and `t('app.description')`
6. Set `lang` to locale dynamically
7. Set `start_url` to `/${locale}`

### Step 2: Update Root Layout Metadata
1. Open `app/layout.tsx`
2. Add `metadataBase` with app URL
3. Add `openGraph` with site metadata
4. Add `twitter` card metadata
5. Keep existing icons and `appleWebApp` config

### Step 3: Update Locale Layout Metadata
1. Open `app/[locale]/layout.tsx`
2. Import `getTranslations` and `Metadata` type
3. Create `generateMetadata` async function
4. Extract locale from params
5. Use `getTranslations` to get app name/description
6. Add Open Graph metadata with `og:locale`
7. Add Twitter card metadata
8. Update manifest reference to `/${locale}/manifest.webmanifest`
9. Add `alternates` for SEO
10. Update body to use `t('app.name')` for apple-mobile-web-app-title

### Step 4: Create Tests
1. Create `app/[locale]/__tests__/manifest.test.ts`
   - Test Spanish manifest generation
   - Test English manifest generation
   - Test PWA structure completeness
   - Test icon configurations
2. Create `app/[locale]/__tests__/layout-metadata.test.tsx`
   - Test Spanish metadata
   - Test English metadata
   - Test Open Graph locale tags
   - Test Twitter cards
   - Test alternates
   - Test alternate locale logic

### Step 5: Validation
1. **Unit tests:** Run `npm test manifest.test` and `npm test layout-metadata.test` - verify all tests pass
2. **Coverage:** Verify 80% coverage on new test files
3. **Lint:** Run `npm run lint` - verify no new issues
4. **Build:** Run `npm run build` - verify no build errors
5. **Migrations:** Confirm no migrations required (frontend-only changes)
6. **Manual verification (Vercel Preview):**
   - Navigate to `/es` → View page source → Verify Spanish metadata
   - Navigate to `/en` → View page source → Verify English metadata
   - Check `/es/manifest.webmanifest` → Verify Spanish manifest
   - Check `/en/manifest.webmanifest` → Verify English manifest
   - Use browser PWA install → Verify correct language shown
   - Share `/es` link on social media → Verify Spanish preview
   - Share `/en` link on social media → Verify English preview
   - Check SEO tools (Facebook Debugger, Twitter Card Validator)

### Step 6: Cleanup (After Verification)
1. **Delete static manifest** - Remove `app/manifest.json` (only after confirming dynamic manifests work)
2. **Update root layout manifest reference** - Remove or update `manifest: '/manifest.json'` line

## Files to Create/Modify

### Files to Create
1. **app/[locale]/manifest.ts** - Dynamic, locale-aware PWA manifest
2. **app/[locale]/__tests__/manifest.test.ts** - Manifest tests
3. **app/[locale]/__tests__/layout-metadata.test.tsx** - Layout metadata tests

### Files to Modify
1. **app/layout.tsx** - Add Open Graph and Twitter card metadata
2. **app/[locale]/layout.tsx** - Add `generateMetadata`, localize all metadata

### Files to Delete (After Verification)
1. **app/manifest.json** - Replaced by dynamic manifests (delete only after testing)

## Quality Gates

### SonarCloud Requirements
- **Coverage:** ≥80% on new test files
- **New Issues:** 0 new issues (any severity)
- **Security:** No security hotspots
- **Maintainability:** Maintain B or higher
- **Duplicated code:** <5%

### Pre-Commit Checklist
- [ ] All unit tests pass
- [ ] ESLint passes with no new warnings
- [ ] Build completes successfully
- [ ] 80% coverage on new code
- [ ] No migrations required

## Risks and Mitigations

### Risk: Breaking existing PWA functionality
**Mitigation:**
- Keep static manifest during development
- Comprehensive testing of manifest structure
- Manual verification with actual PWA installation
- Delete static manifest only after confirming dynamic manifests work

### Risk: SEO regression
**Mitigation:**
- Proper `og:locale` and `og:locale:alternate` tags
- `alternates` for canonical and language links
- Test with SEO tools (Facebook Debugger, Twitter Card Validator)

### Risk: Manifest not loading correctly
**Mitigation:**
- Next.js 15 automatically serves `[locale]/manifest.ts` at correct paths
- Test both `/es/manifest.webmanifest` and `/en/manifest.webmanifest`
- Verify in browser DevTools → Application → Manifest

### Risk: Translation keys not found
**Mitigation:**
- Translations already exist in `common.json` (verified)
- No new keys needed
- Tests verify translation loading

### Risk: Browser caching old static manifest
**Mitigation:**
- Test in incognito mode
- Clear browser cache before testing
- Use different browsers for verification
- Service worker updates should handle manifest changes

## Open Questions

None - the approach is straightforward:
- Reuse existing translations from `common.json`
- Follow Next.js 15 best practices for dynamic manifests
- Standard metadata implementation with locale awareness
- Comprehensive testing ensures quality

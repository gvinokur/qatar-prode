# Implementation Plan: Language Persistence & Detection (#162)

## Context

Currently, the app uses next-intl for internationalization with URL-based locale routing (`/en/...` or `/es/...`). The locale is determined solely by the URL path prefix, which means:
- Users must manually select their language every time they visit without a specific locale URL
- Language preference is not remembered across sessions
- No automatic detection based on browser settings or user's saved preferences

This story implements smart language detection and persistence to improve UX by:
- Storing user language preference in the database
- Using cookies for quick preference lookup
- Detecting browser language from Accept-Language header
- Following a clear priority order for locale detection

## Story Requirements

### Tasks from Issue
- Store user language preference in database
- Cookie-based language preference
- Browser language detection (Accept-Language header)
- Geo-location based default (Spanish for LATAM, English otherwise) - **OPTIONAL**

### Detection Priority (from issue)
1. User's saved preference (database/cookie)
2. URL locale (`/en/...` or `/es/...`)
3. Browser Accept-Language header
4. Default to Spanish (current user base)

## Acceptance Criteria

1. **Database Storage**: User table has `preferred_locale` field to store language preference
2. **Cookie Persistence**: Language preference stored in cookie `NEXT_LOCALE` for quick access
3. **Middleware Detection**: Custom locale detection in middleware following priority order
4. **UI for Selection**: User settings dialog includes language selector
5. **Server Action**: `updateUserLocale` action to persist preference to database
6. **Automatic Detection**: First-time visitors get locale from browser Accept-Language header
7. **Fallback Behavior**: Default to Spanish if no preference detected
8. **Session Update**: NextAuth session updated with preferred locale for server-side access

## Technical Approach

### 1. Database Schema Changes

**Add field to users table:**
```sql
ALTER TABLE users
ADD COLUMN preferred_locale VARCHAR(2) DEFAULT NULL;
```

**Migration file:** `migrations/20260224000000_add_user_preferred_locale.sql`

### 2. Update Type Definitions

**File:** `app/db/tables-definition.ts`

Add `preferred_locale` field to `UserTable` interface:
```typescript
export interface UserTable extends Identifiable {
  // ... existing fields ...
  preferred_locale?: string | null  // 'en' or 'es'
}
```

### 3. NextAuth Session Enhancement

**File:** `auth.ts` (NextAuth configuration)

To avoid database queries in middleware (performance issue), we'll store `preferred_locale` in the NextAuth session during login.

**Changes needed:**
1. Add `preferred_locale` to session user object
2. Update session callback to include user's locale from DB
3. Middleware reads from session instead of making DB queries

**Implementation in NextAuth callbacks:**
```typescript
// In auth.ts callbacks.jwt
jwt: async ({ token, user, trigger, session }) => {
  if (user) {
    // Initial sign in - include preferred_locale from DB
    token.preferred_locale = user.preferred_locale
  }
  if (trigger === 'update' && session?.preferred_locale) {
    // Session update triggered by updateUserLocale action
    token.preferred_locale = session.preferred_locale
  }
  return token
}

// In auth.ts callbacks.session
session: async ({ session, token }) => {
  session.user.preferred_locale = token.preferred_locale
  return session
}
```

**Type definition update needed in `types/next-auth.d.ts`:**
```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      // ... existing fields
      preferred_locale?: string | null
    }
  }

  interface User {
    // ... existing fields
    preferred_locale?: string | null
  }
}
```

### 4. Middleware Enhancement

**File:** `middleware.ts`

The current middleware uses `createMiddleware` from next-intl with default locale detection. We need to customize this to follow our priority order.

**Strategy:**
1. Check for cookie `NEXT_LOCALE` (fastest lookup)
2. If no cookie and user is authenticated, check user's `preferred_locale` from NextAuth session (NO DB QUERY)
3. If no saved preference, check Accept-Language header
4. Fall back to default locale (Spanish)
5. Set cookie with detected locale for future requests

**Implementation approach:**
- Add custom `localeDetection` callback to `createMiddleware` config
- Use `next/headers` `cookies()` to read/write cookies
- Read `preferred_locale` from NextAuth session via `auth()` (already imported)
- Read Accept-Language header from request
- Parse Accept-Language to extract preferred locales (sorted by quality value)
- Match against supported locales ['en', 'es']

**Note:** next-intl v4.8 supports custom locale detection via the middleware config. We'll leverage this instead of manually handling redirects.

### 5. Server Action for Locale Update

**File:** `app/actions/user-actions.ts`

Create new server action:
```typescript
/**
 * Update user's preferred locale
 * @param locale - The locale to set ('en' or 'es')
 */
export async function updateUserLocale(locale: Locale): Promise<void>
```

**Implementation:**
1. Get authenticated user with `getLoggedInUser()`
2. Validate locale is in allowed locales (from `i18n.config.ts`)
3. Update user record with `updateUser(userId, { preferred_locale: locale })`
4. Set cookie `NEXT_LOCALE` with locale value
5. Return success

**Client-side session update:**
- Component must call `useSession().update({ preferred_locale: locale })` after action succeeds
- This triggers NextAuth JWT callback with `trigger: 'update'`
- Session is updated with new locale
- NextAuth automatically refreshes session on next request

### 6. User Settings Dialog Enhancement

**File:** `app/components/auth/user-settings-dialog.tsx`

Add language selector to existing user settings form:

**UI Changes:**
- Add Select field with language options (English/Español)
- Position below nickname field
- Use Material-UI Select component
- Display current locale from `useLocale()` hook as default value
- On change, call `updateUserLocale` server action
- After successful action, call `useSession().update({ preferred_locale: newLocale })`
- Optionally, redirect to same URL to refresh locale context immediately

**Form state:**
```typescript
type NicknameFormData = {
  nickname: string,
  enableNotifications: boolean,
  preferredLocale: Locale  // NEW
}
```

**Session update flow:**
```typescript
const { update } = useSession();
const router = useRouter();

async function handleLocaleChange(newLocale: Locale) {
  await updateUserLocale(newLocale); // Updates DB and sets cookie
  await update({ preferred_locale: newLocale }); // Updates session token
  router.refresh(); // Triggers middleware re-execution with new session
}
```

**Important timing consideration:**
- `await update()` ensures session is updated before `router.refresh()`
- `router.refresh()` triggers middleware which reads from updated session
- Middleware sets cookie if not already set (idempotent)
- User sees new locale immediately after refresh completes

### 7. Accept-Language Header Parsing

**New utility file:** `app/utils/locale-detection.ts`

Create utility functions:
```typescript
/**
 * Parse Accept-Language header and return locales sorted by quality value (highest first)
 * Example: "en-US,en;q=0.9,es;q=0.8,fr;q=0.5" -> ['en', 'es', 'fr']
 *
 * Quality value handling:
 * - Parse quality values (q=0.9) for each language
 * - Default to 1.0 for languages without explicit quality
 * - Sort by quality in descending order
 * - Extract base language code (en-US -> en)
 * - Remove duplicates
 */
export function parseAcceptLanguage(header: string): string[]

/**
 * Match parsed languages against supported locales
 * Returns first match or null
 */
export function matchLocale(
  acceptedLanguages: string[],
  supportedLocales: readonly Locale[]
): Locale | null
```

**Example parsing behavior:**
- Input: `"en-US,en;q=0.9,es;q=0.8"`
- Parsed with quality: `[{lang: 'en-US', q: 1.0}, {lang: 'en', q: 0.9}, {lang: 'es', q: 0.8}]`
- Sorted: `['en-US', 'en', 'es']`
- Base codes: `['en', 'en', 'es']`
- Deduplicated: `['en', 'es']`

### 8. Cookie Management

**Cookie name:** `NEXT_LOCALE`
**Cookie options:**
- `maxAge`: 365 * 24 * 60 * 60 (31,536,000 seconds = 1 year)
- `path`: '/' (available across entire site)
- `httpOnly`: true (security best practice - prevents XSS attacks)
- `sameSite`: 'lax' (CSRF protection)
- `secure`: true in production

**Security rationale:**
- `httpOnly: true` is safe because locale detection happens in middleware (server-side)
- Client receives locale via next-intl's context after initial render
- No need for client-side JavaScript to read this cookie directly

**API Note:**
- Next.js 15 `next/headers` cookies().set() uses `maxAge` in **seconds** (not milliseconds)
- This is consistent with standard HTTP Set-Cookie maxAge parameter
- Verified in Next.js documentation: https://nextjs.org/docs/app/api-reference/functions/cookies#options

### 8. Geo-location Based Default (OPTIONAL - Phase 2)

**Deferred to future story:**
- Requires external API (e.g., CloudFlare headers, IP geolocation service)
- Adds complexity and potential latency
- Current priority is sufficient for MVP

**If implemented later:**
- Use request headers (e.g., `CF-IPCountry` from CloudFlare)
- Maintain priority order: cookie > user pref > browser > geo > default

## Files to Create

1. `migrations/20260224000000_add_user_preferred_locale.sql` - Database migration
2. `app/utils/locale-detection.ts` - Accept-Language parsing utilities with quality value sorting
3. `__tests__/utils/locale-detection.test.ts` - Unit tests for locale detection
4. `__tests__/middleware.test.ts` - Unit tests for middleware locale detection logic

## Files to Modify

1. `app/db/tables-definition.ts` - Add `preferred_locale` field to UserTable interface
2. `auth.ts` - Update NextAuth callbacks to include `preferred_locale` in session
3. `types/next-auth.d.ts` - Add `preferred_locale` to Session and User type definitions
4. `middleware.ts` - Add custom locale detection reading from session (not DB)
5. `app/actions/user-actions.ts` - Add `updateUserLocale` server action
6. `app/components/auth/user-settings-dialog.tsx` - Add language selector with session update
7. `locales/en/auth.json` - Add translation keys for language selector
8. `locales/es/auth.json` - Add translation keys for language selector

## Implementation Steps

### Step 1: Database Migration
1. Create migration file with SQL to add `preferred_locale` column
2. Run migration locally: `psql $DATABASE_URL -f migrations/20260224000000_add_user_preferred_locale.sql`
3. Verify column exists: `\d users` in psql

### Step 2: Update Type Definitions
1. Add `preferred_locale?: string | null` to `UserTable` interface in `tables-definition.ts`
2. Verify TypeScript compilation: `npm run build`

### Step 3: Update NextAuth Configuration
1. Open `auth.ts` (or wherever NextAuth is configured)
2. Update `callbacks.jwt` to include `preferred_locale` from user object
3. Handle `trigger: 'update'` case to update token when locale changes
4. Update `callbacks.session` to include `preferred_locale` in session
5. Update `types/next-auth.d.ts` to add `preferred_locale` to Session and User types
6. Verify TypeScript compilation: `npm run build`

### Step 4: Create Locale Detection Utilities
1. Create `app/utils/locale-detection.ts`
2. Implement `parseAcceptLanguage` function with quality value parsing and sorting
3. Implement `matchLocale` function
4. Create unit tests in `__tests__/utils/locale-detection.test.ts`
5. Test cases:
   - Parse simple Accept-Language: "en-US" -> ['en']
   - Parse complex header with quality values: "en-US,en;q=0.9,es;q=0.8" -> ['en', 'es']
   - Parse with mixed quality: "es;q=0.9,en-US,fr;q=0.5" -> ['en', 'es', 'fr'] (sorted by quality)
   - Match against supported locales
   - Handle invalid/missing headers
   - Handle empty header
   - Handle no matches (should return null)

### Step 5: Enhance Middleware
1. Import locale detection utilities
2. Add custom `localeDetection` config to `createMiddleware`
3. Implement priority order:
   - Check `NEXT_LOCALE` cookie (fastest)
   - If authenticated, check user's `preferred_locale` from NextAuth session (NO DB QUERY)
   - Parse Accept-Language header using `parseAcceptLanguage()` and `matchLocale()`
   - Fall back to default 'es'
4. Set `NEXT_LOCALE` cookie with detected locale (only if not already set)
5. Test with different scenarios:
   - First visit (no cookie, no user pref) → Uses Accept-Language
   - Returning user with cookie → Uses cookie
   - Authenticated user with saved preference in session → Uses session preference
   - URL override (/en/... should still work) → URL takes precedence

### Step 6: Create Server Action
1. Add `updateUserLocale` function to `user-actions.ts`
2. Import `locales` from `i18n.config.ts` for validation
3. Implementation:
   ```typescript
   import { locales } from '@/i18n.config';
   import { cookies } from 'next/headers';

   export async function updateUserLocale(locale: Locale) {
     const user = await getLoggedInUser()
     if (!user) throw new Error('Unauthorized')

     // Validate locale against allowed values
     if (!locales.includes(locale)) {
       throw new Error(`Invalid locale: ${locale}`)
     }

     // Update database
     await updateUser(user.id, { preferred_locale: locale })

     // Set cookie
     cookies().set('NEXT_LOCALE', locale, {
       maxAge: 365 * 24 * 60 * 60, // 1 year
       path: '/',
       sameSite: 'lax',
       httpOnly: true,
       secure: process.env.NODE_ENV === 'production'
     })

     // Note: Client must call useSession().update() to refresh session
   }
   ```
4. Create unit tests in `__tests__/actions/user-actions.test.ts`

### Step 7: Update User Settings Dialog
1. Import `updateUserLocale` action
2. Import `useSession` from next-auth/react
3. Import `useRouter` from next/navigation
4. Add `preferredLocale` to form schema
5. Add Select field with current locale from `useLocale()` hook:
   ```tsx
   <Select
     value={currentLocale}
     onChange={handleLocaleChange}
     label={t('userSettings.language.label')}
   >
     <MenuItem value="en">English</MenuItem>
     <MenuItem value="es">Español</MenuItem>
   </Select>
   ```
6. Implement `handleLocaleChange`:
   ```tsx
   async function handleLocaleChange(newLocale: Locale) {
     setLoading(true);
     try {
       await updateUserLocale(newLocale);
       await update({ preferred_locale: newLocale });
       router.refresh(); // Reload page with new locale
     } catch (error) {
       // Handle error
     } finally {
       setLoading(false);
     }
   }
   ```
7. Handle loading and error states

### Step 8: Add Translation Keys
1. `locales/en/auth.json`:
   ```json
   {
     "userSettings": {
       "language": {
         "label": "Language",
         "description": "Select your preferred language"
       }
     }
   }
   ```
2. `locales/es/auth.json`:
   ```json
   {
     "userSettings": {
       "language": {
         "label": "Idioma",
         "description": "Selecciona tu idioma preferido"
       }
     }
   }
   ```

### Step 9: Integration Testing
1. Test first-time visitor flow:
   - Visit site without cookie
   - Verify locale detected from browser
   - Verify cookie set
2. Test authenticated user flow:
   - Log in
   - Change language in settings
   - Verify database updated
   - Verify cookie updated
   - Refresh page, verify preference persisted
3. Test URL override:
   - Visit `/en/...` while having Spanish preference
   - Verify English content displayed
   - Verify preference not overwritten
4. Test fallback behavior:
   - Clear cookies
   - Set Accept-Language to unsupported locale (e.g., "fr")
   - Verify fallback to Spanish

## Testing Strategy

### Unit Tests

**File:** `__tests__/utils/locale-detection.test.ts`
- Test `parseAcceptLanguage` with various headers
- Test `matchLocale` with different language combinations
- Test edge cases (empty header, invalid format, no match)
- **Coverage target:** 100% (pure functions, easy to test)

**File:** `__tests__/actions/user-actions.test.ts` (extend existing)
- Test `updateUserLocale` success case
- Test unauthorized user (should throw)
- Test invalid locale (should throw)
- Test cookie is set correctly
- Mock `updateUser` repository call
- **Coverage target:** 80%+

**File:** `__tests__/components/auth/user-settings-dialog.test.tsx` (extend existing)
- Test language selector renders
- Test language selection triggers action
- Test loading state during update
- Test error handling
- Test session update is called after locale change
- **Coverage target:** 80%+

**File:** `__tests__/middleware.test.ts` (new - middleware testing)
- Test locale detection priority order:
  - Cookie present → Uses cookie value
  - No cookie + authenticated user → Uses session.user.preferred_locale
  - No cookie + no user pref → Uses Accept-Language header
  - No preferences at all → Falls back to 'es'
- Test cookie is set when not present
- Test Accept-Language parsing integration
- Test URL locale override doesn't change cookie/preference
- Mock NextAuth session for authenticated user scenarios
- Mock cookies() and headers() from next/headers
- **Coverage target:** 80%+

**Testing approach for middleware:**
- Create test wrapper that mocks NextRequest and NextResponse
- Mock `auth()` function to return session with different preferred_locale values
- Mock `cookies()` to simulate cookie presence/absence
- Mock `headers()` to provide Accept-Language values
- Verify middleware returns correct redirect or passes through

**Alternative: Integration Testing Approach**
- If mocking `createMiddleware` internals proves too brittle, use integration tests:
  - Spin up test server with middleware
  - Make actual HTTP requests with different headers/cookies
  - Verify redirect responses and final locale
  - Use `@playwright/test` or similar for end-to-end middleware testing
- Hybrid approach: Unit test locale detection utilities (100% coverage) + integration test middleware behavior

### Integration Tests

1. **Manual testing in dev environment:**
   - Test all flows in Testing Strategy section above
   - Test on different browsers with different language settings
   - Test mobile and desktop

2. **E2E testing (optional, if E2E suite exists):**
   - Full user flow: signup → set language → refresh → verify persistence

### Quality Gates (SonarCloud)

- **Coverage:** 80%+ on new code (locale detection utilities should be 100%)
- **Maintainability:** A rating
- **Security:** A rating (no sensitive data in cookies, proper validation)
- **Duplicated code:** <5%

## Edge Cases & Considerations

1. **URL Locale vs Saved Preference:**
   - URL locale should ALWAYS take precedence for that page view
   - But saved preference should not be overwritten by URL navigation
   - Example: User has Spanish preference, visits `/en/tournaments`, sees English, but preference stays Spanish

2. **Cookie Conflicts:**
   - If cookie and database disagree, database wins (source of truth)
   - Cookie should be refreshed to match database

3. **Performance:**
   - Cookie check is fastest (no DB query)
   - Database check only for authenticated users
   - Accept-Language parsing is lightweight

4. **Security:**
   - Validate locale input in server action (prevent injection)
   - Use allowlist approach (only 'en' or 'es' accepted)
   - Cookie is httpOnly (prevents XSS attacks, no client-side access needed)
   - NextAuth session provides server-side access to preference

5. **Migration Rollback:**
   - If needed: `ALTER TABLE users DROP COLUMN preferred_locale;`

## Validation Checklist

Before marking as complete:

- [ ] Database migration applied successfully
- [ ] Type definitions updated and compile without errors
- [ ] Unit tests pass for locale detection utilities (100% coverage)
- [ ] Unit tests pass for user actions (80%+ coverage)
- [ ] Middleware correctly detects locale in all priority scenarios
- [ ] User settings dialog includes language selector
- [ ] Language change updates database and cookie
- [ ] Translation keys added for both English and Spanish
- [ ] Manual testing completed for all user flows
- [ ] SonarCloud shows 0 new issues
- [ ] Code coverage ≥80% on new code

## Open Questions

None at this time. Requirements are clear from issue description.

## Dependencies & Risks

**Dependencies:**
- None. This is a self-contained feature.

**Risks:**
- **Low:** Cookie/database sync issues → Mitigated by treating database as source of truth
- **Low:** Browser language detection edge cases → Mitigated by fallback to Spanish
- **Low:** Performance impact from DB query → Mitigated by cookie caching

## Future Enhancements (Out of Scope)

1. **Geo-location based defaults** - Requires external API integration
2. **Language auto-detection based on content interaction** - ML/analytics
3. **Per-tournament language override** - Allow different language for different tournaments
4. **More locales** - Support additional languages beyond en/es

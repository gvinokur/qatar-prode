# Implementation Plan: Story #151 - Translation Helper Utilities & Patterns

## Story Context

**Issue**: #151 - [i18n] Translation Helper Utilities & Patterns
**Epic**: i18n Infrastructure & Implementation
**Priority**: High
**Effort**: Low (2-4 hours)
**Related Stories**:
- #149 (i18n Library Setup) - ✅ Completed
- #150 (Translation Key Extraction) - ✅ Completed

### Why This Story Exists

The i18n infrastructure is in place (#149) and translation keys have been extracted (#150), but the codebase still has hardcoded Spanish strings in utilities. This story creates reusable helper utilities and patterns that enable locale-aware formatting throughout the application.

**Current Problems:**
- `/app/utils/date-utils.ts` has hardcoded Spanish labels ("Horario Local", "Tu Horario")
- `/app/utils/email-templates.ts` generates only Spanish emails, ignoring translation files
- No number/currency formatting utilities exist
- No pluralization helpers
- Developers don't have clear patterns for Server vs Client Component i18n usage

**Scope**: Create utilities and patterns, NOT implement translations across entire codebase. Other stories will use these utilities.

## Acceptance Criteria

- [x] Date/time formatting with locale support (using dayjs locales)
- [x] Number formatting (scores, points)
- [x] Pluralization helpers
- [x] Email template generator with locale support
- [x] Server Component vs Client Component translation patterns
- [x] Error message translation utility
- [x] Deliverables:
  - `app/utils/i18n-helpers.ts` (or organized under `app/utils/i18n/`)
  - Date formatting utilities
  - Updated email template functions
  - Code examples in implementation guide
  - Testing utilities for translations
- [x] 80% test coverage on new code
- [x] All tests passing

## Technical Approach

### Simplified Scope (Based on User Feedback)

**Focus on real value**: Refactor existing utilities that currently have hardcoded Spanish to be locale-aware.

**Files to refactor:**
1. `/app/utils/date-utils.ts` - Add locale parameter to all functions
2. `/app/utils/email-templates.ts` - Create locale-aware versions using translations
3. `/app/utils/i18n-patterns.md` - New documentation file for Server/Client patterns

**Skip:**
- ❌ Thin wrappers (number formatting, pluralization, error utilities)
- ❌ New i18n directory structure
- ✅ Use `Intl.NumberFormat` directly in components
- ✅ Use `next-intl`'s built-in plural support
- ✅ Use `getTranslations('errors')` directly in components

### 1. Refactor Date/Time Formatting (`/app/utils/date-utils.ts`)

**Current State**: Hardcoded Spanish labels
```typescript
getCompactGameTime() // Returns "DD MMM HH:mm GMT±X (Horario Local)"
getCompactUserTime() // Returns "DD MMM HH:mm (Tu Horario)"
```

**Solution**: Add locale parameter and translation label parameters

**Changes to make:**

1. **Add locale import**:
```typescript
import { Locale } from '@/i18n.config';
import 'dayjs/locale/en'; // Add English locale
```

2. **Update `getCompactGameTime()`**:
```typescript
// OLD signature:
export function getCompactGameTime(date: Date, gameTimezone?: string): string

// NEW signature:
export function getCompactGameTime(
  date: Date,
  gameTimezone: string,
  locale: Locale,
  timezoneLabel: string // e.g., "Local Time" or "Horario Local"
): string {
  const d = dayjs(date);
  if (gameTimezone && Intl.supportedValuesOf('timeZone').includes(gameTimezone)) {
    const formatted = d.tz(gameTimezone).locale(locale).format('D MMM HH:mm');
    const offset = d.tz(gameTimezone).format('Z');
    const offsetShort = `GMT${offset.substring(0, 3)}`;
    return `${formatted} ${offsetShort} (${timezoneLabel})`;
  }
  return d.locale(locale).format('D MMM HH:mm');
}
```

3. **Update `getCompactUserTime()`**:
```typescript
// OLD signature:
export function getCompactUserTime(date: Date): string

// NEW signature:
export function getCompactUserTime(
  date: Date,
  locale: Locale,
  userTimezoneLabel: string // e.g., "Your Time" or "Tu Horario"
): string {
  return `${dayjs(date).locale(locale).format('D MMM HH:mm')} (${userTimezoneLabel})`;
}
```

4. **Update other functions**:
```typescript
// Add locale parameter to getLocalGameTime and getUserLocalTime
export function getLocalGameTime(date: Date, gameTimezone?: string, locale: Locale = 'es'): string {
  const d = dayjs(date).locale(locale);
  if (gameTimezone && Intl.supportedValuesOf('timeZone').includes(gameTimezone)) {
    return d.tz(gameTimezone).format('MMM D, YYYY - HH:mm');
  }
  return d.format('MMM D, YYYY - HH:mm');
}

export function getUserLocalTime(date: Date, locale: Locale = 'es'): string {
  return dayjs(date).locale(locale).format('MMM D, YYYY - HH:mm');
}
```

**Backward compatibility**: Add default parameters (`locale = 'es'`) to maintain existing behavior for functions not yet updated.

**Usage Pattern - Client Component**:
```typescript
'use client'
import { useLocale, useTranslations } from 'next-intl';
import { getCompactGameTime } from '@/app/utils/i18n/formatters';

function GameTime({ game }) {
  const locale = useLocale();
  const t = useTranslations('common');

  return (
    <span>
      {getCompactGameTime(
        game.date,
        game.timezone,
        locale,
        t('time.localTime')  // "Local Time" | "Horario Local"
      )}
    </span>
  );
}
```

**Usage Pattern - Server Component**:
```typescript
import { getLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';
import { getCompactGameTime } from '@/app/utils/i18n/formatters';

async function GameTime({ game }) {
  const locale = await getLocale();
  const t = await getTranslations('common');

  return (
    <span>
      {getCompactGameTime(
        game.date,
        game.timezone,
        locale,
        t('time.localTime')
      )}
    </span>
  );
}
```

### 2. Refactor Email Templates (`/app/utils/email-templates.ts`)

**Current State**: `/app/utils/email-templates.ts` generates hardcoded Spanish emails

**Solution**: Create locale-aware email generator that uses `getTranslations('emails')`

**Implementation**:
```typescript
import { getTranslations } from 'next-intl/server';
import { Locale } from '@/i18n.config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Generate verification email with locale support
 * @param email - Recipient email
 * @param verificationLink - Email verification URL
 * @param locale - User's locale
 * @returns Email options for nodemailer
 */
export async function generateLocalizedVerificationEmail(
  email: string,
  verificationLink: string,
  locale: Locale
): Promise<EmailOptions> {
  const t = await getTranslations({ locale, namespace: 'emails' });

  // Security Note: Translation values from controlled JSON files are safe.
  // If adding user-provided values in future, use HTML escaping library.
  return {
    to: email,
    subject: t('verification.subject'),
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
            <h1 style="color: #333; margin-bottom: 20px;">${t('verification.title')}</h1>
            <p style="color: #666; margin-bottom: 20px;">${t('verification.greeting')}</p>
            <a
              href="${verificationLink}"
              style="display: inline-block; background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-bottom: 20px;"
            >
              ${t('verification.button')}
            </a>
            <p style="color: #999; font-size: 14px; margin-bottom: 20px;">${t('verification.expiration')}</p>
            <p style="color: #666;">${t('verification.signature')}</p>
          </div>
        </body>
      </html>
    `,
  };
}

/**
 * Generate password reset email with locale support
 * @param email - Recipient email
 * @param resetLink - Password reset URL
 * @param locale - User's locale
 * @returns Email options for nodemailer
 */
export async function generateLocalizedPasswordResetEmail(
  email: string,
  resetLink: string,
  locale: Locale
): Promise<EmailOptions> {
  const t = await getTranslations({ locale, namespace: 'emails' });

  return {
    to: email,
    subject: t('passwordReset.subject'),
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
            <h1 style="color: #333; margin-bottom: 20px;">${t('passwordReset.title')}</h1>
            <a
              href="${resetLink}"
              style="display: inline-block; background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-bottom: 20px;"
            >
              ${t('passwordReset.button')}
            </a>
            <p style="color: #999; font-size: 14px; margin-bottom: 20px;">${t('passwordReset.expiration')}</p>
            <p style="color: #666;">${t('passwordReset.signature')}</p>
          </div>
        </body>
      </html>
    `,
  };
}
```

**Migration Strategy**: Keep old functions, add new locale-aware versions alongside them. Future story will migrate callers.

### 3. Documentation (`/app/utils/i18n-patterns.md`)

Create comprehensive guide with examples for:
- Server Component translation patterns
- Client Component translation patterns
- Date/time formatting best practices
- Email generation with i18n
- Number formatting examples
- Pluralization strategies
- Error message handling
- Testing i18n utilities

Include code examples from exploration report showing:
- How to use `getLocale()` vs `useLocale()`
- How to use `getTranslations()` vs `useTranslations()`
- When to fetch translations in Server Components vs pass to Client Components

## Files to Create/Modify

### Files to Modify

1. **`/app/utils/date-utils.ts`** - Add locale parameter to all functions
2. **`/app/utils/email-templates.ts`** - Add locale-aware email generators

### New Files

1. **`/app/utils/i18n-patterns.md`** - Developer documentation for Server/Client i18n patterns

### Translation Files to Update

**Note on `EnOf()` format**: This is the placeholder format from story #150 used to mark English translations that need proper translation. The format `EnOf(Spanish text)` makes it easy to identify strings that still need translation from Spanish to English.

1. **`/locales/en/common.json`** - Add time labels:
   ```json
   {
     "time": {
       "localTime": "EnOf(Horario Local)",
       "yourTime": "EnOf(Tu Horario)"
     }
   }
   ```

2. **`/locales/es/common.json`** - Add time labels:
   ```json
   {
     "time": {
       "localTime": "Horario Local",
       "yourTime": "Tu Horario"
     }
   }
   ```

### Migration Path

**This story**: Refactor `date-utils.ts` and `email-templates.ts` to support locale parameter with backward-compatible defaults

**Future stories**: Update components/actions to pass locale when calling these utilities

## Testing Strategy

### Test Files to Update

1. **`/__tests__/utils/date-utils.test.ts`** - Update existing tests:
   - Add locale parameter tests for 'en' and 'es'
   - Test backward compatibility (default 'es' locale)
   - Timezone handling with different locales
   - Edge cases: invalid locales, undefined timezones

2. **`/__tests__/utils/email-templates.test.ts`** - Update existing tests:
   - Add locale parameter to existing email tests
   - Test both 'en' and 'es' email generation
   - HTML structure preservation across locales
   - Variable interpolation (links, names)
   - Translation key usage

### Mock Strategy

**Date/Time Tests**:
```typescript
// Mock dayjs at module scope
vi.mock('dayjs', () => {
  const actualDayjs = vi.importActual('dayjs');
  return {
    default: vi.fn().mockImplementation((date) => actualDayjs(date)),
  };
});

// Mock Intl.supportedValuesOf for timezone validation
Object.defineProperty(Intl, 'supportedValuesOf', {
  value: vi.fn(() => ['America/Argentina/Buenos_Aires', 'America/New_York']),
});
```

**Email Tests**:
```typescript
// Mock getTranslations from next-intl/server
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn((config) => {
    const translations = {
      en: { 'verification.subject': 'Account Verification' },
      es: { 'verification.subject': 'Verificación de Cuenta' },
    };
    return (key) => translations[config.locale][key];
  }),
}));
```

**Number Format Tests**:
```typescript
// Use real Intl.NumberFormat (no mock needed)
describe('formatLocalizedNumber', () => {
  it('should format with Spanish locale', () => {
    expect(formatLocalizedNumber(1234.56, 'es')).toBe('1.234,56');
  });

  it('should format with English locale', () => {
    expect(formatLocalizedNumber(1234.56, 'en')).toBe('1,234.56');
  });
});
```

### Coverage Targets

- **Date formatting**: 85%+ (comprehensive timezone/locale combinations)
- **Email templates**: 90%+ (straightforward template generation)
- **Number formatting**: 90%+ (simple Intl.NumberFormat wrappers)
- **Pluralization**: 85%+ (rule combinations)
- **Overall**: ≥80% (SonarCloud requirement)

### Test Patterns from Existing Codebase

Follow patterns from:
- `/__tests__/utils/date-utils.test.ts` - Date formatting test structure
- `/__tests__/utils/email-templates.test.ts` - Email HTML validation
- `/__tests__/mocks/next-intl.mocks.ts` - i18n mocking patterns

## Implementation Steps

### Phase 1: Refactor Date Utils (45 minutes)

1. Update `/app/utils/date-utils.ts`:
   - Add English locale import: `import 'dayjs/locale/en'`
   - Add locale parameter to all functions with default `locale = 'es'`
   - Update `getCompactGameTime()` to accept `timezoneLabel` parameter
   - Update `getCompactUserTime()` to accept `userTimezoneLabel` parameter
   - Use `.locale(locale)` in all dayjs calls

2. Update tests in `/__tests__/utils/date-utils.test.ts`:
   - Test functions with both 'en' and 'es' locales
   - Test backward compatibility (no locale = defaults to 'es')
   - Verify month names are localized

### Phase 2: Refactor Email Templates (45 minutes)

1. Update `/app/utils/email-templates.ts`:
   - Add locale parameter to `generateVerificationEmail()`
   - Add locale parameter to `generatePasswordResetEmail()`
   - Use `getTranslations({ locale, namespace: 'emails' })` instead of hardcoded strings
   - Add backward compatibility: default to 'es' locale

2. Update tests in `/__tests__/utils/email-templates.test.ts`:
   - Mock `getTranslations` from `next-intl/server`
   - Test both locales produce correct content
   - Verify translation keys are used

### Phase 3: Translation Keys (10 minutes)

1. Add time labels to `/locales/en/common.json` and `/locales/es/common.json`
2. Verify email keys in `emails.json` (already exist from story #150)

### Phase 4: Documentation (30 minutes)

1. Create `/app/utils/i18n-patterns.md` with:
   - Server Component i18n patterns (`getLocale`, `getTranslations`)
   - Client Component i18n patterns (`useLocale`, `useTranslations`)
   - Examples of using refactored date-utils and email-templates
   - Number formatting (use Intl directly)
   - Pluralization (use next-intl built-in)
   - Error messages (use getTranslations directly)

### Phase 5: Validation (15 minutes)

1. Run linting: `npm run lint`
2. Run tests: `npm run test`
3. Run build: `npm run build`
4. Verify 0 new SonarCloud issues
5. Verify 80%+ coverage on modified functions

## Validation Considerations

### Quality Gates

1. **SonarCloud**:
   - 0 new issues of any severity
   - 80%+ coverage on all new files
   - No code smells introduced

2. **TypeScript**:
   - Full type safety (no `any` types)
   - Proper return type inference
   - Type-safe translation keys

3. **Testing**:
   - All utilities have comprehensive unit tests
   - Edge cases covered (invalid inputs, missing translations)
   - Both locales tested for each utility

### Integration Points

**This story creates utilities. Future stories will:**
- Refactor `date-utils.ts` to use new helpers
- Update Server Actions to use localized emails
- Migrate components to use new formatters

**No breaking changes** - Old utilities remain functional during migration.

## Dependencies

### Completed Stories
- ✅ #149 - i18n library installed and configured
- ✅ #150 - Translation files created and populated

### Blocks Future Stories
- #152+ - Stories implementing translations across app will use these utilities

## Clarifications from Plan Review

### Scope Simplification (User Feedback):

**Original plan**: Create new i18n utility directory with date, number, currency, pluralization, and error helpers

**Simplified plan**: Refactor existing `date-utils.ts` and `email-templates.ts` to be locale-aware

**Rationale**:
- ✅ Date/time and email utilities have real value (currently hardcoded Spanish)
- ❌ Number/currency formatters are thin wrappers (use `Intl.NumberFormat` or `next-intl`'s `useFormatter()` directly)
- ❌ Pluralization helpers are redundant (`next-intl` has built-in plural support)
- ❌ Error utilities don't add abstraction value (call `getTranslations('errors')` directly)

**Result**: Focused, practical implementation that delivers real value in ~2.5 hours instead of 2-4 hours

### Review Cycle 1 & 2 Feedback Addressed:

1. **✅ Dayjs timezone plugin**: Verified existing imports in date-utils.ts
2. **✅ Email translation keys**: Verified all required keys exist in `locales/{locale}/emails.json` from story #150
3. **✅ HTML security**: Added security note in email template functions
4. **✅ EnOf() format**: Documented placeholder format from story #150

### Dependencies Confirmed:
- ✅ dayjs (v1.11.11) - installed with timezone and utc plugins
- ✅ next-intl (v4.8.3) - installed with getTranslations API
- ✅ Translation keys - all required keys exist in emails.json (verified)

## Open Questions

None - all requirements are clear and review feedback has been addressed.

## Risk Assessment

**Low Risk**:
- Creating new utilities (not modifying existing)
- No breaking changes to current code
- Well-defined requirements
- Established patterns from exploration

**Mitigation**:
- Comprehensive test coverage
- Clear documentation for developers
- Incremental adoption (other stories will migrate gradually)

## Success Metrics

- ✅ All utilities implemented and tested
- ✅ 80%+ test coverage achieved
- ✅ Documentation complete with examples
- ✅ 0 new SonarCloud issues
- ✅ All tests passing
- ✅ Build succeeds
- ✅ Ready for other stories to use utilities

## Timeline

**Total Estimated Time**: 2-2.5 hours (reduced from 2-4 hours)

- Phase 1 (Refactor Date Utils): 45 minutes
- Phase 2 (Refactor Email Templates): 45 minutes
- Phase 3 (Translation Keys): 10 minutes
- Phase 4 (Documentation): 30 minutes
- Phase 5 (Validation): 15 minutes

**Delivery**: Single PR with refactored utilities, updated tests, and i18n patterns documentation.

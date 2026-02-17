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

### File Organization

Create utilities under organized structure:

```
app/utils/i18n/
├── index.ts                     # Re-export all helpers
├── formatters.ts                # Date, number, currency formatting
├── email-templates.ts           # Email generation with i18n
├── pluralization.ts             # Plural handling
└── patterns.md                  # Documentation on Server vs Client patterns
```

### 1. Date/Time Formatting (`formatters.ts`)

**Current State**: `/app/utils/date-utils.ts` has hardcoded Spanish:
```typescript
getCompactGameTime() // Returns "DD MMM HH:mm GMT±X (Horario Local)"
getCompactUserTime() // Returns "DD MMM HH:mm (Tu Horario)"
```

**Solution**: Refactor to use locale-aware formatting

**Implementation**:
```typescript
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { Locale } from '@/i18n.config';

// Load dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

// Load dayjs locales
import 'dayjs/locale/es';
import 'dayjs/locale/en';

/**
 * Format date with locale-specific formatting
 * @param date - Date to format
 * @param locale - User's locale ('en' | 'es')
 * @param format - dayjs format string
 * @returns Formatted date string
 */
export function formatLocalizedDate(
  date: Date | string,
  locale: Locale,
  format: string = 'DD MMM HH:mm'
): string {
  return dayjs(date).locale(locale).format(format);
}

/**
 * Get compact game time with translatable timezone label
 * @param date - Game date
 * @param timezone - Game timezone (e.g., 'America/Argentina/Buenos_Aires')
 * @param locale - User's locale
 * @param timezoneLabel - Translation for "Local Time"
 * @returns Formatted string like "17 Dec 15:00 GMT-3 (Local Time)"
 */
export function getCompactGameTime(
  date: Date | string,
  timezone: string,
  locale: Locale,
  timezoneLabel: string
): string {
  const localTime = dayjs(date).tz(timezone).locale(locale);
  const formatted = localTime.format('DD MMM HH:mm');
  const offset = localTime.format('Z');
  const gmtOffset = `GMT${offset.slice(0, 3)}`;

  return `${formatted} ${gmtOffset} (${timezoneLabel})`;
}

/**
 * Get compact user local time with translatable label
 * @param date - Date to format
 * @param locale - User's locale
 * @param userTimezoneLabel - Translation for "Your Time"
 * @returns Formatted string like "17 Dec 15:00 (Your Time)"
 */
export function getCompactUserTime(
  date: Date | string,
  locale: Locale,
  userTimezoneLabel: string
): string {
  const formatted = dayjs(date).locale(locale).format('DD MMM HH:mm');
  return `${formatted} (${userTimezoneLabel})`;
}

/**
 * Format relative time ("2 hours ago", "hace 2 horas")
 * @param date - Date to format
 * @param locale - User's locale
 * @returns Relative time string
 */
export function formatRelativeTime(
  date: Date | string,
  locale: Locale
): string {
  return dayjs(date).locale(locale).fromNow();
}
```

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

### 2. Number & Currency Formatting (`formatters.ts`)

**Implementation**:
```typescript
import { Locale } from '@/i18n.config';

/**
 * Format number with locale-specific separators
 * @param value - Number to format
 * @param locale - User's locale
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatLocalizedNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format currency with locale-specific formatting
 * @param value - Amount to format
 * @param locale - User's locale
 * @param currency - Currency code (e.g., 'ARS', 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  locale: Locale,
  currency: string = 'ARS'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format percentage with locale-specific formatting
 * @param value - Decimal value (0.75 = 75%)
 * @param locale - User's locale
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  locale: Locale,
  decimals: number = 0
): string {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}
```

**Usage with next-intl's useFormatter** (alternative):
```typescript
'use client'
import { useFormatter, useLocale } from 'next-intl';

function ScoreDisplay({ score }) {
  const format = useFormatter();

  return <span>{format.number(score)}</span>;
}
```

### 3. Pluralization Helpers (`pluralization.ts`)

**Implementation**:
```typescript
import { Locale } from '@/i18n.config';

/**
 * Get plural form key for a count
 * @param count - Number to pluralize for
 * @param locale - User's locale
 * @returns 'zero' | 'one' | 'two' | 'few' | 'many' | 'other'
 */
export function getPluralForm(count: number, locale: Locale): Intl.LDMLPluralRule {
  const rules = new Intl.PluralRules(locale);
  return rules.select(count);
}

/**
 * Helper for building plural translation keys
 * @param baseKey - Base translation key (e.g., 'members')
 * @param count - Number for plural form
 * @param locale - User's locale
 * @returns Full key like 'members.one' or 'members.other'
 */
export function pluralKey(baseKey: string, count: number, locale: Locale): string {
  const form = getPluralForm(count, locale);
  return `${baseKey}.${form}`;
}
```

**Translation File Structure** (`locales/en/common.json`):
```json
{
  "members": {
    "one": "1 member",
    "other": "{count} members"
  },
  "points": {
    "one": "1 point",
    "other": "{count} points"
  }
}
```

**Usage**:
```typescript
'use client'
import { useTranslations, useLocale } from 'next-intl';
import { pluralKey } from '@/app/utils/i18n/pluralization';

// Approach 1: Custom helper (explicit control)
function MemberCount({ count }) {
  const t = useTranslations('common');
  const locale = useLocale();
  const key = pluralKey('members', count, locale);

  return <span>{t(key, { count })}</span>;
}

// Approach 2: Use next-intl's built-in plural support (recommended)
// next-intl automatically detects plural forms based on locale
function MemberCount({ count }) {
  const t = useTranslations('common');
  return <span>{t('members', { count })}</span>;
}
```

**Recommendation**: Use next-intl's built-in plural support (Approach 2) for most cases. The custom helper is available for advanced scenarios where explicit plural form control is needed.

### 4. Email Template Generator (`email-templates.ts`)

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

**Migration Path**:
1. Create new localized functions
2. Update Server Actions to use new functions with user's locale
3. Deprecate old functions in `/app/utils/email-templates.ts`
4. Future story: Remove old functions after migration complete

### 5. Error Message Translation Utility (`formatters.ts`)

**Implementation**:
```typescript
/**
 * Format error message with locale support
 * @param errorKey - Translation key in 'errors' namespace
 * @param locale - User's locale
 * @param params - Dynamic parameters for interpolation
 * @returns Translated error message
 */
export async function getLocalizedError(
  errorKey: string,
  locale: Locale,
  params?: Record<string, string | number>
): Promise<string> {
  const t = await getTranslations({ locale, namespace: 'errors' });
  return t(errorKey, params);
}

/**
 * Client-side error message utility
 * (use in Client Components with useTranslations hook)
 */
export function useLocalizedError() {
  const t = useTranslations('errors');

  return (errorKey: string, params?: Record<string, string | number>) => {
    return t(errorKey, params);
  };
}
```

**Usage in Server Action**:
```typescript
'use server'
import { getLocale } from 'next-intl/server';
import { getLocalizedError } from '@/app/utils/i18n/formatters';

export async function updateUser(data: UpdateUserInput) {
  const locale = await getLocale();

  try {
    // ... update logic
  } catch (error) {
    return {
      success: false,
      error: await getLocalizedError('generic.serverError', locale)
    };
  }
}
```

### 6. Index File (`index.ts`)

Re-export all utilities for convenient imports:
```typescript
export {
  formatLocalizedDate,
  getCompactGameTime,
  getCompactUserTime,
  formatRelativeTime,
  formatLocalizedNumber,
  formatCurrency,
  formatPercentage,
  getLocalizedError,
  useLocalizedError, // Client Component hook for error messages
} from './formatters';

export {
  generateLocalizedVerificationEmail,
  generateLocalizedPasswordResetEmail,
} from './email-templates';

export {
  getPluralForm,
  pluralKey,
} from './pluralization';
```

### 7. Documentation (`patterns.md`)

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

### New Files

1. **`/app/utils/i18n/index.ts`** - Main export file
2. **`/app/utils/i18n/formatters.ts`** - Date, number, currency, error formatting
3. **`/app/utils/i18n/email-templates.ts`** - Localized email generators
4. **`/app/utils/i18n/pluralization.ts`** - Plural helpers
5. **`/app/utils/i18n/patterns.md`** - Developer documentation

### Translation Files to Update

**Note on `EnOf()` format**: This is the placeholder format from story #150 used to mark English translations that need proper translation. The format `EnOf(Spanish text)` makes it easy to identify strings that still need translation from Spanish to English.

1. **`/locales/en/common.json`** - Add time labels:
   ```json
   {
     "time": {
       "localTime": "EnOf(Horario Local)",
       "yourTime": "EnOf(Tu Horario)"
     },
     "members": {
       "one": "EnOf(1 miembro)",
       "other": "EnOf({count} miembros)"
     }
   }
   ```

2. **`/locales/es/common.json`** - Add time labels:
   ```json
   {
     "time": {
       "localTime": "Horario Local",
       "yourTime": "Tu Horario"
     },
     "members": {
       "one": "1 miembro",
       "other": "{count} miembros"
     }
   }
   ```

### Existing Files (Future Migration - Not This Story)

These files have hardcoded Spanish but will be refactored in **future stories** using the helpers created here:

- `/app/utils/date-utils.ts` - Refactor to use `formatLocalizedDate()` helpers
- `/app/utils/email-templates.ts` - Deprecate in favor of localized versions
- Components using date formatting - Update to use new helpers
- Email sending Server Actions - Update to use localized generators

**Important**: This story creates the utilities, but does NOT migrate the entire codebase. That's a separate story.

## Testing Strategy

### Test Files to Create

1. **`/__tests__/utils/i18n/formatters.test.ts`**
   - Date formatting with 'en' and 'es' locales
   - Timezone handling
   - Number formatting with different locales
   - Currency formatting
   - Percentage formatting
   - Error message generation
   - Edge cases: invalid locales, undefined values, null parameters

2. **`/__tests__/utils/i18n/email-templates.test.ts`**
   - Email generation for both locales
   - HTML structure preservation
   - Variable interpolation (links, names, etc.)
   - Subject line translation
   - Content translation

3. **`/__tests__/utils/i18n/pluralization.test.ts`**
   - Plural rules for English and Spanish
   - Edge cases: 0, 1, 2, many
   - Translation key building

### Testing Utilities to Create/Update

1. **`/__tests__/mocks/i18n.mocks.ts`** - Extend with:
   - `createMockFormatter()` - Factory for `useFormatter()` mock
   - `createMockGetTranslations()` - Mock for server-side `getTranslations()`
   - Locale-specific test data

2. **`/__tests__/mocks/setup-helpers.ts`** - Add i18n setup options

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

### Phase 1: Core Utilities (1-2 hours)

1. Create directory structure: `/app/utils/i18n/`
2. Implement `formatters.ts`:
   - Date/time formatting functions
   - Number/currency formatting functions
   - Error message utilities
3. Implement `pluralization.ts`:
   - Plural form detection
   - Translation key building
4. Implement `email-templates.ts`:
   - Localized verification email generator
   - Localized password reset email generator
5. Create `index.ts` with re-exports

### Phase 2: Translation Keys (15 minutes)

1. Add time labels to `common.json` (both locales)
2. Add plural keys to `common.json` (both locales)
3. Verify `emails.json` has all needed keys:
   - ✅ Already verified: `locales/en/emails.json` and `locales/es/emails.json` contain:
     - `verification.subject`, `verification.title`, `verification.greeting`, `verification.button`, `verification.expiration`, `verification.signature`
     - `passwordReset.subject`, `passwordReset.title`, `passwordReset.button`, `passwordReset.expiration`, `passwordReset.signature`
   - These keys were added in story #150 and are ready to use

### Phase 3: Testing (1-1.5 hours)

1. Create test files for all utilities
2. Extend test mocks for i18n
3. Run tests and ensure 80%+ coverage
4. Fix any failing tests

### Phase 4: Documentation (30 minutes)

1. Create `patterns.md` with:
   - Server Component examples
   - Client Component examples
   - Date formatting best practices
   - Email generation guide
   - Number formatting examples
   - Pluralization strategies
   - Testing patterns
2. Add JSDoc comments to all utility functions

### Phase 5: Validation (15 minutes)

1. Run linting: `npm run lint`
2. Run tests: `npm run test`
3. Run build: `npm run build`
4. Verify 0 new SonarCloud issues
5. Verify 80%+ coverage on new files

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

### Review Cycle 1 Feedback Addressed:

1. **✅ Dayjs timezone plugin**: Added explicit imports (`dayjs/plugin/timezone` and `dayjs/plugin/utc`) and plugin extension calls in formatters.ts examples
2. **✅ Email translation keys**: Verified all required keys exist in `locales/{locale}/emails.json` from story #150
3. **✅ useLocalizedError export**: Added to index.ts exports with clarifying comment
4. **✅ HTML security**: Added security note in email template functions explaining translation values are safe (from controlled JSON)
5. **✅ Pluralization strategy**: Clarified that next-intl's built-in plural support is recommended; custom helper available for advanced cases
6. **✅ EnOf() format**: Documented that this is the placeholder format from story #150 for marking untranslated English strings

### Dependencies Confirmed:
- ✅ dayjs (v1.11.11) - installed with timezone and utc plugins
- ✅ next-intl (v4.8.3) - installed with getTranslations API
- ✅ Translation namespaces - all required keys exist in emails.json and common.json

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

**Total Estimated Time**: 2-4 hours

- Phase 1 (Core Utilities): 1-2 hours
- Phase 2 (Translation Keys): 15 minutes
- Phase 3 (Testing): 1-1.5 hours
- Phase 4 (Documentation): 30 minutes
- Phase 5 (Validation): 15 minutes

**Delivery**: Single PR with all utilities, tests, and documentation.

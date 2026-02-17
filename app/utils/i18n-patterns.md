# i18n Patterns and Best Practices

Guide for implementing internationalization (i18n) in the qatar-prode application using next-intl.

## Table of Contents

1. [Server Component Patterns](#server-component-patterns)
2. [Client Component Patterns](#client-component-patterns)
3. [Date and Time Formatting](#date-and-time-formatting)
4. [Email Templates](#email-templates)
5. [Number Formatting](#number-formatting)
6. [Pluralization](#pluralization)
7. [Error Messages](#error-messages)

---

## Server Component Patterns

Server Components can use async functions to fetch translations.

### Basic Usage

```typescript
import { getLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

export default async function MyServerComponent() {
  // Get current locale
  const locale = await getLocale(); // 'en' | 'es'

  // Get translations for a namespace
  const t = await getTranslations('common');

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>{locale === 'en' ? 'English version' : 'Versión en español'}</p>
    </div>
  );
}
```

### With Multiple Namespaces

```typescript
import { getTranslations } from 'next-intl/server';

export default async function ProfilePage() {
  const tCommon = await getTranslations('common');
  const tAuth = await getTranslations('auth');
  const tErrors = await getTranslations('errors');

  return (
    <div>
      <h1>{tCommon('profile')}</h1>
      <button>{tAuth('logout')}</button>
    </div>
  );
}
```

### With Interpolation

```typescript
const t = await getTranslations('groups');

// Translation key: "invite.title": "Invitar a {groupName}"
return <h1>{t('invite.title', { groupName: group.name })}</h1>;
```

---

## Client Component Patterns

Client Components use hooks to access translations.

### Basic Usage

```typescript
'use client';

import { useLocale, useTranslations } from 'next-intl';

export default function MyClientComponent() {
  // Get current locale
  const locale = useLocale(); // 'en' | 'es'

  // Get translations for a namespace
  const t = useTranslations('common');

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <p>Current locale: {locale}</p>
    </div>
  );
}
```

### Example: Game Countdown Display

Real example from the codebase showing locale-aware date formatting:

```typescript
'use client';

import { useLocale } from 'next-intl';
import { getCompactGameTime, getCompactUserTime } from '../utils/date-utils';

export default function GameCountdownDisplay({ gameDate, gameTimezone }) {
  const locale = useLocale();

  // Format game time with current locale
  const gameTime = getCompactGameTime(gameDate, gameTimezone, locale);
  // Returns: "18 Jan 15:00 GMT-5" (en) or "18 ene 15:00 GMT-5" (es)

  const userTime = getCompactUserTime(gameDate, locale);
  // Returns: "18 Jan 14:00" (en) or "18 ene 14:00" (es)

  return (
    <div>
      <p>Game time: {gameTime}</p>
      <p>Your time: {userTime}</p>
    </div>
  );
}
```

---

## Date and Time Formatting

Use the refactored `date-utils.ts` functions with locale parameter.

### Available Functions

```typescript
import { getCompactGameTime, getCompactUserTime, getLocalGameTime, getUserLocalTime } from '@/app/utils/date-utils';
import { useLocale } from 'next-intl'; // Client Component
import { getLocale } from 'next-intl/server'; // Server Component

// Client Component
const locale = useLocale();
const gameTime = getCompactGameTime(game.date, game.timezone, locale);

// Server Component
const locale = await getLocale();
const gameTime = getCompactGameTime(game.date, game.timezone, locale);
```

### Function Reference

- **`getCompactGameTime(date, timezone, locale = 'es')`**
  Returns: `"18 Jan 15:00 GMT-5"` or `"18 ene 15:00 GMT-5"`
  Note: Label ("Horario Local") handled separately by component

- **`getCompactUserTime(date, locale = 'es')`**
  Returns: `"18 Jan 14:00"` or `"18 ene 14:00"`
  Note: Label ("Tu Horario") handled separately by component

- **`getLocalGameTime(date, timezone?, locale = 'es')`**
  Returns: `"Jan 18, 2026 - 15:00"` or `"ene 18, 2026 - 15:00"`

- **`getUserLocalTime(date, locale = 'es')`**
  Returns: `"Jan 18, 2026 - 14:00"` or `"ene 18, 2026 - 14:00"`

### Custom Date Formatting

For custom formats, use dayjs directly with locale:

```typescript
import dayjs from 'dayjs';
import { useLocale } from 'next-intl';
import 'dayjs/locale/es';
import 'dayjs/locale/en';

const locale = useLocale();
const formatted = dayjs(date).locale(locale).format('DD MMMM YYYY');
// "18 January 2026" (en) or "18 enero 2026" (es)
```

---

## Email Templates

Use the refactored email template functions with locale parameter.

### Server Actions

```typescript
'use server';

import { getLocale } from 'next-intl/server';
import { generateVerificationEmail, generatePasswordResetEmail } from '@/app/utils/email-templates';
import { sendEmail } from '@/app/utils/email';

export async function sendVerificationEmail(email: string, verificationLink: string) {
  // Get user's locale
  const locale = await getLocale();

  // Generate localized email
  const emailContent = await generateVerificationEmail(email, verificationLink, locale);

  // Send email
  await sendEmail(emailContent);
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const locale = await getLocale();
  const emailContent = await generatePasswordResetEmail(email, resetLink, locale);
  await sendEmail(emailContent);
}
```

### Available Functions

- **`generateVerificationEmail(email, verificationLink, locale = 'es')`**
  Returns: `{ to, subject, html }` with localized content

- **`generatePasswordResetEmail(email, resetLink, locale = 'es')`**
  Returns: `{ to, subject, html }` with localized content

---

## Number Formatting

Use `Intl.NumberFormat` directly (no wrapper needed).

### Basic Number Formatting

```typescript
const locale = useLocale(); // or await getLocale()

// Format number with locale-specific separators
const formatted = new Intl.NumberFormat(locale).format(1234.56);
// "1,234.56" (en) or "1.234,56" (es)
```

### Currency Formatting

```typescript
const locale = useLocale();

// Format currency
const formatted = new Intl.NumberFormat(locale, {
  style: 'currency',
  currency: 'ARS',
}).format(1500);
// "$1,500.00" (en) or "$1.500,00" (es)
```

### Percentage Formatting

```typescript
const locale = useLocale();

const formatted = new Intl.NumberFormat(locale, {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
}).format(0.75);
// "75%" (both locales)
```

### Using next-intl's useFormatter (Alternative)

```typescript
'use client';

import { useFormatter } from 'next-intl';

export default function ScoreDisplay({ score }) {
  const format = useFormatter();

  return (
    <div>
      <p>Score: {format.number(score)}</p>
      <p>Accuracy: {format.number(0.85, { style: 'percent' })}</p>
    </div>
  );
}
```

---

## Pluralization

Use next-intl's built-in pluralization support.

### Translation File Structure

```json
// locales/en/common.json
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

```json
// locales/es/common.json
{
  "members": {
    "one": "1 miembro",
    "other": "{count} miembros"
  },
  "points": {
    "one": "1 punto",
    "other": "{count} puntos"
  }
}
```

### Usage

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function MemberCount({ count }) {
  const t = useTranslations('common');

  // next-intl automatically selects the correct plural form
  return <span>{t('members', { count })}</span>;
}

// count = 1: "1 member" (en) or "1 miembro" (es)
// count = 5: "5 members" (en) or "5 miembros" (es)
```

### Rich Text in Plurals

```typescript
const t = useTranslations('common');

// Translation: "points": { "other": "{count} <b>points</b>" }
return <span>{t.rich('points', { count, b: (chunks) => <b>{chunks}</b> })}</span>;
```

---

## Error Messages

Use `getTranslations('errors')` directly (no wrapper needed).

### Server Actions

```typescript
'use server';

import { getLocale } from 'next-intl/server';
import { getTranslations } from 'next-intl/server';

export async function updateUserProfile(data: UpdateProfileInput) {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'errors' });

  try {
    // ... update logic
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: t('generic.serverError'), // Localized error message
    };
  }
}
```

### Client Components

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function ProfileForm() {
  const t = useTranslations('errors');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data) => {
    const result = await updateUserProfile(data);
    if (!result.success) {
      setError(t('auth.invalidCredentials'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {/* form fields */}
    </form>
  );
}
```

### Error Translation Keys

Available in `locales/{locale}/errors.json`:

- `generic.serverError` - "An error occurred. Please try again."
- `generic.networkError` - "Network error. Check your connection."
- `auth.invalidCredentials` - "Invalid email or password."
- `auth.emailInUse` - "This email is already registered."
- And more...

---

## Best Practices

### 1. Always Pass Locale to Utilities

```typescript
// ❌ Bad: Hardcoding locale
const time = dayjs(date).locale('es').format('DD MMM');

// ✅ Good: Using current locale
const locale = useLocale(); // or await getLocale()
const time = dayjs(date).locale(locale).format('DD MMM');
```

### 2. Use Backward-Compatible Defaults

```typescript
// Functions default to 'es' for backward compatibility
export function getCompactGameTime(date: Date, timezone?: string, locale: Locale = 'es'): string {
  // ...
}
```

### 3. Namespace Organization

- `common` - Shared strings (buttons, actions, labels)
- `navigation` - Header, footer, navigation links
- `auth` - Authentication flows (login, signup, password reset)
- `groups` - Friend groups management
- `emails` - Email templates content
- `validation` - Form validation messages
- `errors` - Error messages

### 4. Server vs Client Decision Tree

```
Need translations?
  ├─ In Server Component?
  │   ├─ Use: getLocale() and getTranslations()
  │   └─ Import from: 'next-intl/server'
  │
  └─ In Client Component?
      ├─ Use: useLocale() and useTranslations()
      └─ Import from: 'next-intl'
```

### 5. Testing with Locales

```typescript
// Mock locale in tests
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => `Translated: ${key}`,
}));
```

---

## Migration Checklist

When adding i18n to existing code:

- [ ] Identify hardcoded strings
- [ ] Add translation keys to appropriate namespace
- [ ] Import `useLocale` or `getLocale`
- [ ] Pass locale to formatting functions
- [ ] Replace hardcoded strings with `t(key)`
- [ ] Test with both English and Spanish
- [ ] Update tests to mock translations

---

## Resources

- **next-intl Documentation**: https://next-intl-docs.vercel.app/
- **Translation Files**: `/locales/{en|es}/*.json`
- **i18n Configuration**: `/i18n.config.ts`, `/i18n/routing.ts`
- **Date Utilities**: `/app/utils/date-utils.ts`
- **Email Templates**: `/app/utils/email-templates.ts`

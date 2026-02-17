# i18n Developer Guide

Complete guide for working with translations in the Qatar Prode application.

## Overview

This project uses `next-intl` (v4.8.3) for internationalization with Next.js 15 App Router. Translations are organized in namespace-based JSON files, loaded dynamically based on the current locale.

**Supported locales:**
- Spanish (`es`) - Default
- English (`en`)

**Locale routing:** All routes require locale prefix (`/es/...` or `/en/...`)

## Adding New Translations

### 1. Choose the Right Namespace

Select the appropriate namespace for your translation keys:

- **`common.json`** - Generic UI elements (buttons, actions, app-wide strings)
- **`navigation.json`** - Header, navigation, footer elements
- **`auth.json`** - Authentication, login, signup, password flows
- **`groups.json`** - Friend groups, invites, group management
- **`emails.json`** - Email templates and subjects
- **`validation.json`** - Form validation messages
- **`errors.json`** - Error messages
- **`onboarding.json`** - Onboarding flow (future)
- **`games.json`** - Game predictions, cards (future)
- **`tournaments.json`** - Tournament-specific content (future)

**Guidelines:**
- Feature-specific strings go in feature namespaces
- Reusable UI elements go in `common`
- Validation messages go in `validation`
- Error messages go in `errors`

### 2. Add Translation Keys

**Step 1:** Add Spanish baseline to `locales/es/{namespace}.json`

```json
{
  "section": {
    "subsection": {
      "key": "Texto en español"
    }
  }
}
```

**Step 2:** Add English translation to `locales/en/{namespace}.json`

```json
{
  "section": {
    "subsection": {
      "key": "Text in English"
    }
  }
}
```

**Important:** Keep the key structure identical in both locales.

### 3. Use in Components

#### Client Components

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('namespace'); // Specify namespace

  return (
    <div>
      <h1>{t('section.subsection.key')}</h1>
    </div>
  );
}
```

**With Interpolation:**

```typescript
const t = useTranslations('groups');

// Translation: "Invitar amigos a {groupName}"
return <h1>{t('invite.title', { groupName: 'Mi Grupo' })}</h1>;
// Result: "Invitar amigos a Mi Grupo"
```

**Multiple namespaces in one component:**

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');

  return (
    <>
      <button>{tCommon('buttons.save')}</button>
      <h1>{tAuth('login.title')}</h1>
    </>
  );
}
```

#### Server Components

```typescript
import { getTranslations } from 'next-intl/server';

export default async function MyServerComponent() {
  const t = await getTranslations('namespace'); // Async on server

  return <h1>{t('section.key')}</h1>;
}
```

**With interpolation:**

```typescript
import { getTranslations } from 'next-intl/server';

export default async function Page({ params }: { params: { name: string } }) {
  const t = await getTranslations('common');

  return <h1>{t('welcome.message', { name: params.name })}</h1>;
}
```

### 4. Naming Conventions

**Use camelCase for keys:**
```json
{
  "emailLabel": "E-Mail",
  "passwordPlaceholder": "Tu contraseña"
}
```

**Organize by hierarchy:**
```json
{
  "auth": {
    "login": {
      "email": {
        "label": "E-Mail",
        "placeholder": "tu@email.com"
      }
    }
  }
}
```

**Keep keys descriptive:**
```json
{
  "deleteAccount": {
    "confirmation": {
      "prompt": "Para confirmar, escribe ELIMINAR"
    }
  }
}
```

**Group related keys:**
```json
{
  "email": {
    "label": "E-Mail",
    "placeholder": "tu@email.com",
    "required": "Por favor ingrese su e-mail",
    "invalid": "Direccion de E-Mail invalida"
  }
}
```

### 5. Check for Existing Keys

Before adding new keys, check if similar translations exist:

```bash
# Search across all namespace files
grep -r "Guardar" locales/es/
```

**When to Consolidate to Common:**

If you find an existing translation in a feature-specific namespace that applies broadly:

**Move to `common.json` if:**
- Used in 3+ different feature areas (e.g., "Guardar" button in auth, groups, and games)
- Generic UI element (buttons, actions, labels)
- No feature-specific context needed

**Move to `errors.json` if:**
- Generic error message (e.g., "Ocurrió un error inesperado")
- Reusable across features
- Follows error message patterns

**Keep in feature namespace if:**
- Specific to that feature (e.g., "Unirse al Grupo" is groups-specific)
- Contains feature context in the text
- Only used within that feature area

**Example:**
```typescript
// ❌ BAD: auth.json has "save": "Guardar"
//         groups.json also has "save": "Guardar"

// ✅ GOOD: common.buttons.save: "Guardar" (used everywhere)

// ❌ BAD: common.json has "groupNotFound": "Grupo no encontrado"

// ✅ GOOD: errors.groups.notFound: "Grupo no encontrado" (feature-specific error)
```

### 6. Testing Translations

**Switch language in dev:**
- Navigate to `/en/` or `/es/` routes
- Use language switcher in header

**Test interpolation:**
```typescript
// Make sure dynamic values render correctly
const message = t('welcome', { name: 'Juan' });
// Should render with actual name, not "{name}"
```

**Verify all locales:**
```bash
npm run build
```

TypeScript will catch missing translation keys at build time.

## Interpolation Patterns

### Simple Variables

```json
{
  "welcome": "Bienvenido, {name}"
}
```

```typescript
t('welcome', { name: 'Juan' })
// Result: "Bienvenido, Juan"
```

### Multiple Variables

```json
{
  "greeting": "Hola {name}, tienes {count} mensajes"
}
```

```typescript
t('greeting', { name: 'Juan', count: 5 })
// Result: "Hola Juan, tienes 5 mensajes"
```

### Rich Text with Components

```typescript
t.rich('message', {
  b: (chunks) => <strong>{chunks}</strong>,
  link: (chunks) => <a href="/help">{chunks}</a>
})
```

### Number Formatting

```typescript
import { useFormatter } from 'next-intl';

const format = useFormatter();

format.number(1234.56); // "1.234,56" (Spanish)
format.number(1234.56); // "1,234.56" (English)
```

### Date Formatting

```typescript
import { useFormatter } from 'next-intl';

const format = useFormatter();

format.dateTime(new Date(), {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
// Spanish: "17 de febrero de 2026"
// English: "February 17, 2026"
```

## Common Patterns

### Form Fields

```json
{
  "email": {
    "label": "E-Mail",
    "placeholder": "tu@email.com",
    "required": "Por favor ingrese su e-mail",
    "invalid": "Direccion de E-Mail invalida"
  }
}
```

```typescript
<TextField
  label={t('email.label')}
  placeholder={t('email.placeholder')}
  helperText={error ? t('email.invalid') : ''}
  required
/>
```

### Buttons

```json
{
  "buttons": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "confirm": "Confirmar"
  }
}
```

```typescript
<Button>{t('buttons.save')}</Button>
```

### Error Messages

```json
{
  "errors": {
    "generic": "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
    "auth": {
      "invalidCredentials": "Email o Contraseña Invalida"
    }
  }
}
```

```typescript
const tErrors = useTranslations('errors');

if (error === 'INVALID_CREDENTIALS') {
  showError(tErrors('auth.invalidCredentials'));
}
```

### Validation Messages

```json
{
  "password": {
    "required": "La contraseña es requerida",
    "minLength": "La contraseña debe tener al menos {min} caracteres"
  }
}
```

```typescript
const tValidation = useTranslations('validation');

if (password.length < 8) {
  return tValidation('password.minLength', { min: 8 });
}
```

## Locale Detection

The app automatically detects locale from the URL:
- `/es/dashboard` → Spanish
- `/en/dashboard` → English

### Switching Locales

```typescript
'use client';

import { useRouter, usePathname } from '@/i18n/routing';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: 'en' | 'es') => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <select value={locale} onChange={(e) => switchLocale(e.target.value as 'en' | 'es')}>
      <option value="es">Español</option>
      <option value="en">English</option>
    </select>
  );
}
```

## TypeScript Integration

Translation keys are fully type-safe. TypeScript will error if you reference a non-existent key:

```typescript
const t = useTranslations('auth');

t('login.title'); // ✅ Valid
t('login.invalidKey'); // ❌ TypeScript error
```

**Type definitions are generated from:**
- `types/i18n.ts` - Namespace imports
- `locales/en/*.json` - English files used for types

## Troubleshooting

### Missing Translation Error

**Error:** `Missing message: "key" for locale "es"`

**Solution:** Add the key to `locales/es/{namespace}.json`

### TypeScript Error on Valid Key

**Error:** Type error even though key exists

**Solution:**
1. Check that key exists in **English** file (types generated from EN)
2. Rebuild: `npm run build`
3. Restart TypeScript server in your editor

### Translation Not Updating

**Solution:**
1. Restart dev server: `npm run dev`
2. Clear `.next` cache: `rm -rf .next && npm run dev`

### Interpolation Not Working

**Problem:** Seeing `{name}` instead of actual value

**Solution:** Pass variables object as second parameter:
```typescript
// ❌ Wrong
t('welcome', name)

// ✅ Correct
t('welcome', { name: 'Juan' })
```

## Scripts

### Extract Hardcoded Strings

Find hardcoded Spanish strings in the codebase:

```bash
./scripts/extract-hardcoded-strings.sh
```

This searches for common Spanish patterns and outputs file locations.

### Generate English Placeholders

When adding new Spanish translations, generate corresponding English placeholder files:

```bash
./scripts/generate-english-placeholders.sh
```

This creates English files with `EnOf(<Spanish text>)` format for easy translation.

## Best Practices

1. **Always add Spanish first** - Spanish is the primary language, English is secondary
2. **Keep keys in sync** - Same structure in both `es` and `en` files
3. **Use descriptive keys** - `auth.login.email.label` not `a.l.e.l`
4. **Group related content** - All email fields under `email` object
5. **Avoid duplication** - Check for existing keys before adding new ones
6. **Test both locales** - Always verify translations work in both Spanish and English
7. **Use interpolation** - Don't concatenate strings: `"Hola " + name` ❌ Use `t('greeting', {name})` ✅

## Migration Guide

### Converting Hardcoded Strings

**Before:**
```typescript
<Button>Guardar</Button>
```

**After:**
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common');
  return <Button>{t('buttons.save')}</Button>;
}
```

**Before (Server Component):**
```typescript
return <h1>Iniciar Sesión</h1>;
```

**After:**
```typescript
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('auth');
  return <h1>{t('login.title')}</h1>;
}
```

## Resources

- **next-intl Documentation:** https://next-intl-docs.vercel.app/
- **Translation Files:** `locales/{locale}/{namespace}.json`
- **Type Definitions:** `types/i18n.ts`
- **Configuration:** `i18n.config.ts`, `i18n/routing.ts`, `i18n/request.ts`

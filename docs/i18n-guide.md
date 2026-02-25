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

## Translation Workflow for New Keys

This section describes the recommended workflow for translating new content between Spanish and English using LLM-assisted translation.

### Quick Start

**When adding new translation keys**, follow this workflow to ensure consistent, high-quality translations:

1. **Add Spanish content first** (Spanish is the primary language)
2. **Use LLM translation** with our templates for English
3. **Validate** with automated script
4. **Review** tone and interpolation

### Terminology Decision

**Brand Name:** **"Prode"** remains untranslated in all locales
- In English contexts, use full branding: **"Prode - Football Cups Pick'em"**
- This maintains brand identity while clarifying the purpose for English-speaking users
- Think of it like "Uber" or "Spotify" - brand names don't translate

### Step-by-Step Translation Process

#### Step 1: Add Spanish Content

Add your new translation keys to the appropriate namespace in Spanish:

```json
// locales/es/groups.json
{
  "newFeature": {
    "title": "Nueva Funcionalidad",
    "description": "Descripción con variable: {userName}",
    "action": "Comenzar"
  }
}
```

**Important:** Ensure interpolation variables like `{userName}` use English names (code convention).

#### Step 2: Use Translation Prompt Template

Use our LLM translation templates for consistent, high-quality English translations:

**📄 See:** [`/docs/translation-prompt-template.md`](translation-prompt-template.md)

**Process:**
1. Copy the **Spanish → English** prompt template
2. Provide your Spanish JSON to Claude, GPT-4, or another LLM
3. The template includes:
   - "Prode" brand terminology guidance
   - Sports-specific terminology
   - Tone requirements (casual, friendly)
   - Interpolation variable preservation
   - UI constraints (concise button text)

**Example prompt usage:**
```
[Copy ES→EN template from translation-prompt-template.md]

Spanish JSON to translate:
{
  "newFeature": {
    "title": "Nueva Funcionalidad",
    "description": "Descripción con variable: {userName}",
    "action": "Comenzar"
  }
}
```

**Expected output:**
```json
{
  "newFeature": {
    "title": "New Feature",
    "description": "Description with variable: {userName}",
    "action": "Start"
  }
}
```

#### Step 3: Use Sports Terminology Glossary

For consistent terminology across all translations, reference our glossary:

**📄 See:** [`/docs/translation-glossary.md`](translation-glossary.md)

**Quick reference:**
- Prode → **Prode** (brand name, untranslated)
- Partido → **Match** (preferred for international football)
- Torneo → **Tournament**
- Fase de grupos → **Group Stage**
- Eliminatorias → **Knockout Stage**
- Tabla de posiciones → **Standings**
- Grupo (social) → **Group**
- Pronóstico → **Prediction** or **Pick'em** (context-dependent)

**The glossary includes:**
- Core platform terms
- Sports terminology
- Social features vocabulary
- UI/UX terms
- Error message patterns

#### Step 4: Validate Translations

Run our automated validation script to catch common issues:

```bash
./scripts/validate-translations.sh
```

**The script checks:**
1. ✅ No `EnOf()` or `EsOf()` placeholders remaining
2. ✅ Valid JSON syntax in all files
3. ✅ Structure consistency between Spanish and English
4. ✅ Interpolation variables preserved (e.g., `{userName}` not changed)
5. ✅ All expected translation files present

**If errors found:** Fix issues and re-run validation until all checks pass.

#### Step 5: Manual Quality Review

**Check these aspects:**

**Tone verification:**
- [ ] Casual and friendly (not formal)
- [ ] Sports enthusiasm maintained
- [ ] "Prode" used correctly (brand name)

**UI constraints:**
- [ ] Button text concise (<15 characters ideally)
- [ ] Error messages clear and helpful
- [ ] Form labels brief but informative

**Interpolation:**
- [ ] Variables render correctly: `{userName}` → actual name (not literal `{userName}`)
- [ ] Variable names unchanged from source

### Reverse Translation (English → Spanish)

If you have English content that needs Spanish translation:

**Use Template 2:** English → Spanish prompt (in [`translation-prompt-template.md`](translation-prompt-template.md))

**Same process:**
1. Copy EN→ES template
2. Provide English JSON
3. Reference glossary for terminology
4. Validate with script
5. Review tone (Latin American Spanish, casual, friendly)

### Common Pitfalls to Avoid

**❌ Translating variable names:**
```json
// Spanish
"invite": "Invitar a {groupName}"

// ❌ WRONG English
"invite": "Invite {nombreGrupo}"

// ✅ CORRECT English
"invite": "Invite {groupName}"
```

**❌ Removing interpolation braces:**
```json
// Spanish
"members": "{count} miembros"

// ❌ WRONG English
"members": "count members"

// ✅ CORRECT English
"members": "{count} members"
```

**❌ Translating brand name:**
```json
// Spanish
"welcome": "Bienvenido a Prode"

// ❌ WRONG English
"welcome": "Welcome to Prediction"

// ✅ CORRECT English
"welcome": "Welcome to Prode"
```

**❌ Overly formal tone:**
```json
// Spanish (casual)
"error": "No pudimos guardar tus cambios"

// ❌ WRONG English (too formal)
"error": "The system was unable to persist your modifications"

// ✅ CORRECT English (casual, friendly)
"error": "Couldn't save your changes"
```

### Resources

**Translation Tools:**
- **Prompt Templates:** [`/docs/translation-prompt-template.md`](translation-prompt-template.md)
- **Terminology Glossary:** [`/docs/translation-glossary.md`](translation-glossary.md)
- **Validation Script:** `/scripts/validate-translations.sh`

**Testing:**
- Switch locales: Navigate to `/en/` or `/es/` routes
- Use language switcher in header
- Verify interpolation renders correctly
- Check button text fits in UI (test on mobile)

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

## Database-Driven Internationalization

For dynamic content that administrators manage (tournaments, teams, venues, etc.), we store translations in PostgreSQL JSONB columns rather than static JSON files.

### When to Use Database i18n

**Use Database i18n for:**
- Tournament names, descriptions
- Team names
- Venue/location names
- Playoff round names
- Any admin-managed content that needs translation

**Use Static i18n (JSON files) for:**
- UI elements (buttons, labels, navigation)
- Error messages
- Validation messages
- Email templates
- All hardcoded interface text

### Database Schema Pattern

**JSONB Column Structure:**

```typescript
// Database column type
name_i18n: JSONColumnType<Record<string, string>> | null

// Stored JSON format in database
{
  "en": "World Cup 2026",
  "es": "Copa Mundial 2026"
}
```

**Example Database Schema:**

```sql
CREATE TABLE tournaments (
  id TEXT PRIMARY KEY,
  short_name TEXT NOT NULL,           -- Original/fallback value
  short_name_i18n JSONB,              -- Translations: { "en": "...", "es": "..." }
  long_name TEXT NOT NULL,
  long_name_i18n JSONB,
  ...
);

CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,                 -- Original/fallback value
  name_i18n JSONB,                    -- Translations: { "en": "...", "es": "..." }
  ...
);

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  location TEXT NOT NULL,             -- Original/fallback value
  location_i18n JSONB,                -- Translations: { "en": "...", "es": "..." }
  ...
);
```

### Localization Helper Functions

Use the localization helpers to apply translations in Server Actions:

```typescript
import { applyLocalization, applyLocalizationBatch } from '@/app/utils/localization-helper';
import { getLocale } from 'next-intl/server';

// Single object localization
export async function getTournament(id: string) {
  const locale = await getLocale();

  // 1. Fetch from database (returns raw data with i18n fields)
  const tournament = await db
    .selectFrom('tournaments')
    .where('id', '=', id)
    .select(['id', 'short_name', 'short_name_i18n', 'long_name', 'long_name_i18n'])
    .executeTakeFirst();

  // 2. Apply localization
  const localized = applyLocalization(tournament, locale, [
    { field: 'short_name', i18nField: 'short_name_i18n' },
    { field: 'long_name', i18nField: 'long_name_i18n' }
  ]);

  return localized;
  // Returns: { id, short_name: "World Cup" (en) or "Copa Mundial" (es), ... }
}

// Batch localization for arrays
export async function getTeams() {
  const locale = await getLocale();

  // 1. Fetch array from database
  const teams = await db
    .selectFrom('teams')
    .select(['id', 'name', 'name_i18n', 'short_name'])
    .execute();

  // 2. Apply localization to all items
  const localized = applyLocalizationBatch(teams, locale, [
    { field: 'name', i18nField: 'name_i18n' }
  ]);

  return localized;
}
```

### Localization Architecture

**Three-Layer Pattern:**

```
┌─────────────────────────────────────────────────────────┐
│ 1. REPOSITORY LAYER (Kysely queries)                   │
│ - Returns raw data with i18n fields                    │
│ - Selects both base field and i18n field               │
│ - NO localization applied here                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. SERVER ACTION LAYER                                  │
│ - Calls repository function                            │
│ - Gets current locale with getLocale()                 │
│ - Applies localization with applyLocalization()        │
│ - Returns localized data                               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. SERVER COMPONENT                                     │
│ - Calls Server Action                                  │
│ - Receives pre-localized data                          │
│ - Renders to user                                      │
└─────────────────────────────────────────────────────────┘
```

**Complete Example:**

```typescript
// ============================================
// 1. Repository (app/db/tournament-repository.ts)
// ============================================
import { db } from './database';

export async function findTournamentById(id: string) {
  return await db
    .selectFrom('tournaments')
    .where('id', '=', id)
    .select([
      'id',
      'short_name',       // Base field
      'short_name_i18n',  // JSONB translations
      'long_name',
      'long_name_i18n'
    ])
    .executeTakeFirst();
}

// ============================================
// 2. Server Action (app/actions/tournament-actions.ts)
// ============================================
'use server';

import { getLocale } from 'next-intl/server';
import { applyLocalization } from '@/app/utils/localization-helper';
import { findTournamentById } from '@/app/db/tournament-repository';

export async function getTournamentById(id: string) {
  // Get current user's locale
  const locale = await getLocale(); // 'en' or 'es'

  // Fetch raw data from repository
  const tournament = await findTournamentById(id);

  if (!tournament) return null;

  // Apply localization
  const localized = applyLocalization(tournament, locale, [
    { field: 'short_name', i18nField: 'short_name_i18n' },
    { field: 'long_name', i18nField: 'long_name_i18n' }
  ]);

  return localized;
}

// ============================================
// 3. Server Component (app/[locale]/tournaments/page.tsx)
// ============================================
import { getTournamentById } from '@/app/actions/tournament-actions';

export default async function TournamentPage({ params }) {
  const tournament = await getTournamentById(params.id);

  return (
    <div>
      <h1>{tournament.short_name}</h1>
      {/* Displays "World Cup" (en) or "Copa Mundial" (es) */}
      <p>{tournament.long_name}</p>
    </div>
  );
}
```

### Fallback Behavior

The localization helpers implement smart fallback logic:

```typescript
const data = {
  name: 'World Cup',           // Original value
  name_i18n: { es: 'Copa Mundial' }  // Missing English translation
};

const result = applyLocalization(data, 'en', [
  { field: 'name', i18nField: 'name_i18n' }
]);

console.log(result.name); // "World Cup" (falls back to original)
```

**Fallback priority:**
1. Try to get translation for requested locale from i18n field
2. If not found or empty, use original base field value
3. Original value is always preserved as fallback

### Backoffice Usage Guide

Administrators can add translations through the backoffice interface using the `I18nFieldEditor` component.

**Adding translations to a tournament:**

1. Navigate to Backoffice → Tournaments
2. Edit an existing tournament or create new one
3. Find fields with language flags (🇬🇧 English / 🇪🇸 Spanish)
4. Enter translations for each locale:
   - English field: Translation shown to English users
   - Spanish field: Translation shown to Spanish users
5. If a translation is empty, users will see the original value as fallback
6. Save the form

**I18nFieldEditor features:**
- Side-by-side English/Spanish input fields
- Shows current original value as reference
- Optional validation (at least one locale required)
- Clear labels indicating which locale each field represents
- Helper text explaining when each translation is displayed

### Type Handling in TypeScript

Database JSONB columns use `JSONColumnType` for type safety:

```typescript
import { JSONColumnType } from 'kysely';

// Database table definition
interface TournamentsTable {
  id: string;
  short_name: string;
  // JSONColumnType allows different types for select/insert/update
  short_name_i18n: JSONColumnType<Record<string, string>> | null;
}

// When reading from database, cast to expected format
const tournament = await db.selectFrom('tournaments')
  .select(['short_name_i18n'])
  .executeTakeFirst();

// Type assertion when needed in UI components
const i18nValue = tournament.short_name_i18n as { en: string; es: string } | null;
```

### Adding New Locales

To add support for a new locale (e.g., Portuguese):

**1. Update static i18n configuration:**
```typescript
// i18n.config.ts
export const locales = ['en', 'es', 'pt'] as const;
```

**2. Add translation JSON files:**
```bash
mkdir -p locales/pt
cp locales/en/*.json locales/pt/
# Edit locales/pt/*.json with Portuguese translations
```

**3. Update database i18n structure:**
```typescript
// Existing format works for any number of locales
{
  "en": "World Cup",
  "es": "Copa Mundial",
  "pt": "Copa do Mundo"  // Just add new locale key
}
```

**4. Update I18nFieldEditor component:**
```typescript
// Add Portuguese input field to I18nFieldEditor
// The component structure supports any number of locales
```

**5. Test localization helpers:**
```typescript
// Localization helpers automatically support new locales
const result = applyLocalization(data, 'pt', [
  { field: 'name', i18nField: 'name_i18n' }
]);
```

### Important Warnings

**❌ DO NOT localize in Client Components:**
```typescript
// ❌ BAD: Client Component trying to localize
'use client';

export default function TournamentCard({ tournament }) {
  const locale = useLocale();
  // Cannot call applyLocalization here - data should already be localized
  return <h1>{tournament.name}</h1>;
}
```

**✅ DO localize in Server Actions:**
```typescript
// ✅ GOOD: Server Action localizes before passing to client
'use server';

export async function getTournamentData(id: string) {
  const locale = await getLocale();
  const tournament = await findTournamentById(id);
  return applyLocalization(tournament, locale, [...]);
}
```

**❌ DO NOT localize in repositories:**
```typescript
// ❌ BAD: Repository trying to localize
export async function findTournamentById(id: string) {
  const locale = await getLocale(); // NO! Repository should not know about locale
  const data = await db.select(...);
  return applyLocalization(data, locale, [...]); // NO! Keep repositories pure
}
```

**✅ DO return raw data from repositories:**
```typescript
// ✅ GOOD: Repository returns raw data with i18n fields
export async function findTournamentById(id: string) {
  return await db
    .selectFrom('tournaments')
    .select(['id', 'name', 'name_i18n']) // Include both base and i18n field
    .executeTakeFirst();
}
```

### Testing Database i18n

See unit tests for localization helpers:

```typescript
// __tests__/utils/localization-helper.test.ts
import { applyLocalization, applyLocalizationBatch } from '@/app/utils/localization-helper';

describe('applyLocalization', () => {
  it('should apply localization for single field', () => {
    const data = {
      name: 'Original Name',
      name_i18n: { en: 'English Name', es: 'Spanish Name' }
    };

    const result = applyLocalization(data, 'en', [
      { field: 'name', i18nField: 'name_i18n' }
    ]);

    expect(result.name).toBe('English Name');
  });

  it('should fallback to original when locale is missing', () => {
    const data = {
      name: 'Original Name',
      name_i18n: { es: 'Nombre en Español' }
    };

    const result = applyLocalization(data, 'en', [
      { field: 'name', i18nField: 'name_i18n' }
    ]);

    expect(result.name).toBe('Original Name'); // Fallback
  });
});
```

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

## Translation Quality Assurance

Automated tooling to ensure translation completeness and prevent regressions.

### Running QA Scripts Locally

**Check for missing/unused keys:**
```bash
npm run i18n:check
```

This runs both missing keys detection and unused keys detection.

**Generate coverage report:**
```bash
npm run i18n:coverage
```

Outputs a markdown table with translation metrics per namespace.

**Individual scripts:**
```bash
./scripts/detect-missing-keys.sh    # Detect missing keys
./scripts/detect-unused-keys.sh     # Detect unused keys
./scripts/translation-coverage.sh   # Generate report
```

### Interpreting Results

#### Missing Keys

**What they are:** Translation keys used in code (`t('key')`) but not present in JSON files.

**Severity:** ❌ **Critical errors** - must be fixed before merging.

**Example output:**
```
❌ MISSING KEYS FOUND:

Namespace: auth
  File: app/components/auth/login-form.tsx:45
  Key: login.submitButton
  Missing in: en

Summary: 1 missing keys found across 1 namespaces
```

**How to fix:**
1. Add the missing key to both `locales/en/{namespace}.json` and `locales/es/{namespace}.json`
2. Follow the [Translation Workflow](#translation-workflow-for-new-keys) for proper translation
3. Run `npm run i18n:check` again to verify

#### Unused Keys

**What they are:** Translation keys in JSON files that are never referenced in the codebase.

**Severity:** ⚠️  **Warnings only** - review before removing, but won't block PRs.

**Example output:**
```
⚠️  UNUSED KEYS FOUND:

Namespace: auth (2 unused keys)
  - auth.login.forgotPasswordOld
  - auth.signup.termsCheckbox

Summary: 2 unused keys across 1 namespaces
Note: These are warnings only. Review before removing.
```

**How to handle:**
- Review each unused key carefully
- Key might be used in dynamic scenarios (edge case)
- Key might be planned for future feature
- If truly unused, remove from both locale files
- See [Quarterly Cleanup Workflow](#quarterly-cleanup-workflow-for-unused-keys) below

#### Coverage Report

**What it shows:** Metrics on translation completeness across all namespaces.

**Example output:**
```markdown
# Translation Coverage Report

## Summary
- Total Namespaces: 19
- Total Keys (EN): 1,234
- Total Keys (ES): 1,234
- Missing Keys: 0
- Unused Keys: 4

## By Namespace

| Namespace | EN Keys | ES Keys | Coverage | Missing | Unused |
|-----------|---------|---------|----------|---------|--------|
| auth      | 85      | 85      | 100%     | 0       | 2      |
| common    | 120     | 120     | 100%     | 0       | 1      |
...

## ✅ Status: PASS
All namespaces have complete translations.
```

**Understanding coverage percentage:**
- 100% = Same number of keys in both locales
- <100% = One locale has fewer keys than the other
- Formula: (min keys / max keys) * 100

### Best Practices for Avoiding Missing/Unused Keys

**1. Add translations immediately:**
Don't commit code with `t('key')` calls without corresponding JSON keys. Add translations as you write the code.

**2. Run QA before committing:**
```bash
npm run i18n:check
```
Catch issues early before they reach CI/CD.

**3. Use literal keys (avoid dynamic construction):**
```typescript
// ✅ GOOD: Literal string
t('auth.login.title')

// ❌ BAD: Dynamic key (QA tools can't detect)
const action = 'login';
t(`auth.${action}.title`)
```

**4. Remove unused keys regularly:**
Follow the quarterly cleanup workflow below to prevent bloat.

**5. Check coverage reports periodically:**
Review `npm run i18n:coverage` output to monitor translation health.

### CI/CD Integration

GitHub Actions automatically runs translation QA on all PRs:

**What runs:**
1. `validate-translations.sh` - Structure and syntax validation
2. `detect-missing-keys.sh` - Missing keys detection (❌ fails build if found)
3. `detect-unused-keys.sh` - Unused keys detection (⚠️  warnings only)
4. `translation-coverage.sh` - Generate coverage report (uploaded as artifact)

**Status check behavior:**
- ✅ **Missing keys** - Blocks PR merge (required status check)
- ⚠️  **Unused keys** - Informational only (doesn't block)
- 📊 **Coverage report** - Available as downloadable artifact

**Viewing coverage report in CI:**
1. Go to PR checks on GitHub
2. Find "SonarCloud Analysis" workflow
3. Download "translation-coverage-report" artifact
4. Open the markdown file

### Quarterly Cleanup Workflow for Unused Keys

Unused keys accumulate over time as features change. Establish a quarterly cleanup process:

**When:** Every quarter (January, April, July, October)
**Who:** Tech lead or designated team member

**Process:**

**Step 1: Generate report**
```bash
npm run i18n:check > unused-keys-report.txt
```

**Step 2: Review unused keys**
- Open `unused-keys-report.txt`
- For each unused key, verify it's truly unused:
  - Search codebase manually for dynamic usage
  - Check if planned for upcoming feature
  - Confirm with team if unsure

**Step 3: Remove confirmed unused keys**
- Delete keys from both `locales/en/{namespace}.json` and `locales/es/{namespace}.json`
- Keep structure consistent between locales
- Do NOT remove keys if you're uncertain

**Step 4: Create cleanup PR**
- Title: `chore: Remove unused translation keys (Q1 2026)`
- Include list of removed keys in PR description
- Run `npm run i18n:check` to verify no regressions
- Merge after review

**Responsibility:** This should be a recurring calendar event to prevent translation bloat.

### Troubleshooting

**Q: `npm run i18n:check` fails with "command not found"**
A: Run `npm install` to ensure scripts are installed.

**Q: Script reports false positive (key is used but marked as unused)**
A: The script only detects literal strings. Check if you're using dynamic key construction:
```typescript
// This won't be detected by the script
t(`auth.${action}.title`)
```
If this is the case, consider refactoring to use literal keys, or document the dynamic usage.

**Q: How do I skip translation QA temporarily?**
A: You can't and shouldn't. Translation QA is critical for UX. Fix the missing keys instead - it's usually faster than trying to work around it.

**Q: CI fails but I need to merge urgently**
A: Add the missing keys to both locale files:
```json
// locales/en/namespace.json
{
  "new": {
    "key": "English text"
  }
}

// locales/es/namespace.json
{
  "new": {
    "key": "Spanish text"
  }
}
```
This takes <2 minutes and unblocks your PR.

**Q: Script is very slow**
A: The script scans all TypeScript files in the project. Expected runtime is <10 seconds for ~720 files. If it's slower, check:
- Are you running from project root?
- Is `node_modules` being scanned (should be excluded)?
- Try clearing `.next` cache: `rm -rf .next`

### Common Mistakes

**❌ Committing code with missing keys**
```typescript
// Don't do this
<Button>{t('newFeature.button')}</Button>
// Without adding the key to JSON files first
```

**❌ Translating variable names in interpolation**
```json
// Spanish
"invite": "Invitar a {groupName}"

// ❌ WRONG English
"invite": "Invite {nombreGrupo}"

// ✅ CORRECT English
"invite": "Invite {groupName}"
```

**❌ Removing all unused keys without review**
Some "unused" keys might be used dynamically or planned for future features. Always review before removing.

**❌ Ignoring quarterly cleanup**
Unused keys accumulate. Regular cleanup keeps translation files lean and maintainable.

---

## Resources

- **next-intl Documentation:** https://next-intl-docs.vercel.app/
- **Translation Files:** `locales/{locale}/{namespace}.json`
- **Type Definitions:** `types/i18n.ts`
- **Configuration:** `i18n.config.ts`, `i18n/routing.ts`, `i18n/request.ts`
- **Localization Helpers:** `app/utils/localization-helper.ts`
- **I18n Architecture:** `claude/architecture/i18n.md`
- **Backoffice Components:** `app/components/backoffice/i18n-field-editor.tsx`
- **Translation QA Scripts:** `scripts/lib/translation-qa.ts`

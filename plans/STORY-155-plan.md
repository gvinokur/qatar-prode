# Implementation Plan: Story #155 - Translate Common UI Components

## Context

This story prepares common/shared UI components for internationalization to support both Spanish and English locales. Following the project's established i18n pattern from Stories #152, #159, and others, this work focuses on preparing components for translation WITHOUT actually translating content.

**Why this change is needed:**
- Issue #155 requires: Header, Footer, Confirmation dialogs, Navigation menus, Loading/error states, User actions
- Common UI components currently have hardcoded text (mix of Spanish and English)
- These components are used throughout the app and need i18n support
- Users in different locales need to see translated UI elements

**User Requirements (CRITICAL):**
- **DO NOT fully translate anything** - only prepare for i18n
- **Validation:** No duplicate keys for same content across locale files
- **Validation:** Keys used in components MUST match keys in message files

**Current State:**
- Working from story worktree: `/Users/gvinokur/Personal/qatar-prode-story-155`
- Branch: `feature/story-155`
- Some i18n infrastructure already exists (common.json, navigation.json)
- Previous i18n stories (#152, #159, etc.) established the pattern

## Pattern to Follow (From Story #159)

### 1. Client Component Pattern
```typescript
import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common'); // or appropriate namespace

  return (
    <Button>{t('buttons.save')}</Button>
  );
}
```

### 2. Server Component Pattern
```typescript
import { getTranslations } from 'next-intl/server';
import { getLocale } from 'next-intl/server';

export default async function MyComponent() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <Typography>{t('app.name')}</Typography>
  );
}
```

### 3. Translation Placeholder Pattern (CRITICAL)

**For keys being added:**

**If source text is in English:**
- `locales/en/*.json`: Keep English text as-is
- `locales/es/*.json`: Use `EsOf(English text)` placeholder

**If source text is in Spanish:**
- `locales/es/*.json`: Keep Spanish text as-is
- `locales/en/*.json`: Use `EnOf(Spanish text)` placeholder

**Example:**
```json
// Source code has: "La Maquina Prode" (Spanish)

// locales/es/common.json:
{
  "app": {
    "title": "La Maquina Prode"  // Keep Spanish as-is
  }
}

// locales/en/common.json:
{
  "app": {
    "title": "EnOf(La Maquina Prode)"  // Placeholder - translation happens in separate story
  }
}
```

**Purpose:**
- Placeholder format indicates what needs translation
- **Actual translation happens in a SEPARATE story** (not Story #155)
- This story ONLY prepares components for i18n

### 4. Translation Key Structure
- **Namespace:** Use `common` for shared UI, `navigation` for header/menu items
- **Format:** `section.subsection.key` (e.g., `buttons.save`, `header.userMenu.settings`)
- **Consistency:** Check existing keys in common.json and navigation.json to avoid duplicates

## Scope

### ✅ In Scope

**1. Header Component (`app/components/header/header.tsx`)**
- App title: "La Maquina Prode"
- Logo alt text: 'la-maquina-prode'

**2. User Actions Component (`app/components/header/user-actions.tsx`)**
- Tooltip: "Abrir Menu de Usuario"
- Menu items:
  - "Configuracion"
  - "Ver Tutorial"
  - "Ir al Back Office"
  - "Salir"
  - "Delete Account"
- Login button: "Log In"

**3. Footer Component (`app/components/home/footer.tsx`)**
- Teasing messages (hardcoded Spanish):
  - '👑👑 Grande Rey, vas primero, a ver si te podes mantener!! 👑👑'
  - '💩💩 Vas Ultimo, caquita!! 💩💩'
- Alt text: "Footer Logo"

**4. Confirm Dialog Component (`app/components/confirm-dialog.tsx`)**
- Default button text:
  - confirmText: 'Confirm'
  - cancelText: 'Cancel'

**5. Theme Switcher Component (`app/components/header/theme-switcher.tsx`)**
- Title attribute: `` `Switch to ${themeMode === 'light' ? 'dark' : 'light'} mode` ``

**6. Language Switcher Component (`app/components/header/language-switcher.tsx`)**
- Aria-label: "Select language"
- Note: Language names ('English', 'Español') can stay hardcoded as they're self-referential

**7. Mobile Bottom Nav Component (`app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`)**
- Navigation labels (mix of Spanish/English):
  - "Home"
  - "Tablas"
  - "Reglas"
  - "Stats"
  - "Grupos"

### ❌ Out of Scope

- Actual translation from placeholders (separate story)
- Toast notifications (no toast library currently used in these components)
- Loading skeletons (handled by individual feature components)
- Empty states (handled by individual feature components)
- Error boundaries (already handled in Story #159)
- Not-found pages (separate story if needed)

## Files to Create/Modify

### Components to Modify
1. `/Users/gvinokur/Personal/qatar-prode-story-155/app/components/header/header.tsx`
2. `/Users/gvinokur/Personal/qatar-prode-story-155/app/components/header/user-actions.tsx`
3. `/Users/gvinokur/Personal/qatar-prode-story-155/app/components/home/footer.tsx`
4. `/Users/gvinokur/Personal/qatar-prode-story-155/app/components/confirm-dialog.tsx`
5. `/Users/gvinokur/Personal/qatar-prode-story-155/app/components/header/theme-switcher.tsx`
6. `/Users/gvinokur/Personal/qatar-prode-story-155/app/components/header/language-switcher.tsx`
7. `/Users/gvinokur/Personal/qatar-prode-story-155/app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`

### Translation Files to Modify
1. `/Users/gvinokur/Personal/qatar-prode-story-155/locales/en/common.json`
2. `/Users/gvinokur/Personal/qatar-prode-story-155/locales/es/common.json`
3. `/Users/gvinokur/Personal/qatar-prode-story-155/locales/en/navigation.json`
4. `/Users/gvinokur/Personal/qatar-prode-story-155/locales/es/navigation.json`

## Implementation Steps

### Step 0: Pre-Implementation Verification (MANDATORY)
**Before modifying any components, verify:**
1. Check if `common.buttons.confirm` and `common.buttons.cancel` exist in current common.json files
2. Check if any `header.*` or `header.userMenu.*` keys already exist in navigation.json files
3. Verify footer component is client component (uses 'use client' directive)

**If keys already exist:** Reuse them instead of creating duplicates
**If keys don't exist:** Proceed with adding new keys as planned

### Step 1: Update Header Component (Server Component)
- Import `getTranslations` and `getLocale` from 'next-intl/server'
- Replace "La Maquina Prode" with `t('app.title')`
- Replace logo alt text with `t('app.logoAlt')`
- Add keys to common.json files

### Step 2: Update User Actions Component (Client Component)
- Import `useTranslations` from 'next-intl'
- **Pre-check:** Verify no duplicate keys exist in navigation.json
- Add translations for:
  - Tooltip: `t('header.userMenu.tooltip')` (namespace: 'navigation')
  - Menu items: `t('header.userMenu.settings')`, etc. (namespace: 'navigation')
  - Login button: `t('header.login')` (namespace: 'navigation')
- Add keys to navigation.json files

### Step 3: Update Footer Component (Client Component)
- Import `useTranslations` from 'next-intl'
- **Confirmed:** Footer is a client component (uses 'use client')
- Replace hardcoded teasing messages with translation keys
- Add keys to common.json files:
  - `footer.teasingMessages.firstPlace`
  - `footer.teasingMessages.lastPlace`
  - `footer.logoAlt`

### Step 4: Update Confirm Dialog Component (Client Component)
- **Pre-check:** Verify if `common.buttons.confirm` and `common.buttons.cancel` already exist
- **If they exist:** Keep defaults as literal strings, consumers pass translated strings
- **If they don't exist:** Add these keys to common.json in Step 7
- Add note in component: Consumers should pass translated strings via props

### Step 5: Update Theme Switcher Component (Client Component)
- Import `useTranslations` from 'next-intl'
- Replace title attribute with `t('common.theme.switchTo', { mode: ... })`
- Add keys to common.json files

### Step 6: Update Language Switcher Component (Client Component)
- Import `useTranslations` from 'next-intl'
- Replace aria-label with `t('language.selectLanguage')` (namespace: 'common')
- Add key to common.json files

### Step 7: Update Mobile Bottom Nav Component (Client Component)
- Import `useTranslations` from 'next-intl'
- **Component already uses** `useLocale` from next-intl
- Replace navigation labels with translation keys:
  - "Home" → `t('navigation.bottomNav.home')`
  - "Tablas" → `t('navigation.bottomNav.results')`
  - "Reglas" → `t('navigation.bottomNav.rules')`
  - "Stats" → `t('navigation.bottomNav.stats')`
  - "Grupos" → `t('navigation.bottomNav.groups')`
- Add keys to navigation.json files

### Step 8: Update Translation Files
**Add keys to `locales/en/common.json`:**
```json
{
  "app": {
    "name": "World Cup Predictions",
    "title": "EnOf(La Maquina Prode)",
    "logoAlt": "EnOf(La Maquina Prode)",
    "description": "Sports prediction platform",
    "loading": "Loading...",
    "error": "An error occurred"
  },
  "theme": {
    "switchTo": "Switch to {mode} mode",
    "light": "light",
    "dark": "dark"
  },
  "language": {
    "selectLanguage": "Select language"
  },
  "footer": {
    "logoAlt": "Footer Logo",
    "teasingMessages": {
      "firstPlace": "EnOf(👑👑 Grande Rey, vas primero, a ver si te podes mantener!! 👑👑)",
      "lastPlace": "EnOf(💩💩 Vas Ultimo, caquita!! 💩💩)"
    }
  },
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close",
    "create": "Create",
    "confirm": "Confirm",
    "continue": "Continue",
    "resend": "Resend",
    "sending": "Sending...",
    "copy": "Copy",
    "send": "Send",
    "change": "Change"
  },
  "actions": {
    "showMore": "show more",
    "viewAll": "View all",
    "back": "Back"
  },
  "home": {
    "availableTournaments": "Available Tournaments"
  }
}
```

**Add keys to `locales/es/common.json`:**
```json
{
  "app": {
    "name": "Prode Mundial",
    "title": "La Maquina Prode",
    "logoAlt": "La Maquina Prode",
    "description": "Plataforma de pronósticos deportivos",
    "loading": "Cargando...",
    "error": "Ocurrió un error"
  },
  "theme": {
    "switchTo": "EsOf(Switch to {mode} mode)",
    "light": "EsOf(light)",
    "dark": "EsOf(dark)"
  },
  "language": {
    "selectLanguage": "EsOf(Select language)"
  },
  "footer": {
    "logoAlt": "EsOf(Footer Logo)",
    "teasingMessages": {
      "firstPlace": "👑👑 Grande Rey, vas primero, a ver si te podes mantener!! 👑👑",
      "lastPlace": "💩💩 Vas Ultimo, caquita!! 💩💩"
    }
  },
  "buttons": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "close": "Cerrar",
    "create": "Crear",
    "confirm": "Confirmar",
    "continue": "Continuar",
    "resend": "Reenviar",
    "sending": "Enviando...",
    "copy": "Copiar",
    "send": "Enviar",
    "change": "Cambiar"
  },
  "actions": {
    "showMore": "mostrar más",
    "viewAll": "Ver todo",
    "back": "Volver"
  },
  "home": {
    "availableTournaments": "Torneos Disponibles"
  }
}
```

**Add keys to `locales/en/navigation.json`:**
```json
{
  "header": {
    "home": "Home",
    "tournaments": "Tournaments",
    "profile": "Profile",
    "logout": "Log out",
    "login": "Log In",
    "userMenu": {
      "tooltip": "EnOf(Abrir Menu de Usuario)",
      "settings": "EnOf(Configuracion)",
      "tutorial": "EnOf(Ver Tutorial)",
      "backoffice": "EnOf(Ir al Back Office)",
      "logout": "EnOf(Salir)",
      "deleteAccount": "Delete Account"
    }
  },
  "bottomNav": {
    "home": "Home",
    "results": "EnOf(Tablas)",
    "rules": "EnOf(Reglas)",
    "stats": "EnOf(Stats)",
    "groups": "EnOf(Grupos)"
  }
}
```

**Add keys to `locales/es/navigation.json`:**
```json
{
  "header": {
    "home": "Inicio",
    "tournaments": "Torneos",
    "profile": "Perfil",
    "logout": "Cerrar sesión",
    "login": "EsOf(Log In)",
    "userMenu": {
      "tooltip": "Abrir Menu de Usuario",
      "settings": "Configuracion",
      "tutorial": "Ver Tutorial",
      "backoffice": "Ir al Back Office",
      "logout": "Salir",
      "deleteAccount": "EsOf(Delete Account)"
    }
  },
  "bottomNav": {
    "home": "EsOf(Home)",
    "results": "Tablas",
    "rules": "Reglas",
    "stats": "Stats",
    "groups": "Grupos"
  }
}
```

## Testing Strategy

### Unit Tests Required

**1. Header Component Tests**
- Test that app title renders with translation key
- Test that logo alt text uses translation key
- Verify correct namespace usage (`common`)

**2. User Actions Component Tests**
- Test menu items render with translation keys
- Test login button uses translation key
- Test tooltip uses translation key
- Verify correct namespace usage (`navigation`)

**3. Footer Component Tests**
- Test teasing messages use translation keys
- Test logo alt text uses translation key
- Mock translation function to verify key usage

**4. Confirm Dialog Component Tests**
- Test that default button text is properly set
- Test that custom button text overrides defaults
- Verify translation keys are used

**5. Theme Switcher Component Tests**
- Test title attribute uses translation with interpolation
- Test mode value is correctly passed to translation

**6. Language Switcher Component Tests**
- Test aria-label uses translation key
- Verify correct namespace usage

**7. Mobile Bottom Nav Component Tests**
- Test all navigation labels use translation keys
- Test correct namespace usage (`navigation`)
- Verify label text renders with translations
- Test that existing functionality (navigation, active tab) still works

### Test Utilities to Use
- `renderWithTheme()` from `@/__tests__/utils/test-utils`
- Mock `useTranslations` and `getTranslations` from next-intl:
  ```typescript
  // Mock useTranslations to return a function that returns the key
  vi.mock('next-intl', () => ({
    useTranslations: () => (key: string) => key,
    useLocale: () => 'en'
  }));

  // Then assert that the component calls t() with the correct key
  expect(screen.getByText('app.title')).toBeInTheDocument();
  ```
- Use utilities from `@/__tests__/mocks/next-navigation.mocks`
- For server components, mock `getTranslations` to verify correct namespace and key usage

### Manual Testing
1. Switch between English and Spanish locales
2. Verify all UI text updates correctly
3. Check that no hardcoded text remains visible
4. Verify placeholder format is preserved (don't see "EsOf()" or "EnOf()" in UI)
5. Test user menu, confirm dialogs, theme switcher, language switcher
6. Verify footer teasing messages display correctly

### Coverage Target
- **80% coverage on new/modified code** (SonarCloud requirement)
- Focus on translation key usage and component rendering

## Validation Considerations

### Pre-Commit Validation (MANDATORY)
1. **Run tests:** `npm test` - All tests must pass
2. **Run lint:** `npm run lint` - 0 linting errors
3. **Run build:** `npm run build` - Build must succeed
4. **Manual check:** Verify no duplicate keys across locale files
5. **Manual check:** Verify keys in components match keys in JSON files

### SonarCloud Requirements
- **Coverage:** ≥80% on new/modified code
- **New Issues:** 0 new issues of ANY severity
- **Duplicated Code:** <5%

### Key Validation Checks (USER REQUIREMENTS)
1. **No duplicate keys:** Same content should not have different keys
2. **Key consistency:** Every key used in components MUST exist in both en/ and es/ JSON files
3. **Placeholder format:** Verify EsOf()/EnOf() placeholders are used correctly
4. **No premature translation:** Placeholders should remain as placeholders, not translated

### Testing in Vercel Preview
- User will test in Vercel Preview environment (default workflow)
- Deploy triggers automatically on push to branch
- User tests language switching, UI components in both locales

## Visual Prototypes

Not applicable - This story maintains existing UI appearance while preparing for i18n. No visual changes expected; only text replacement with translation keys.

## Open Questions

None - Requirements are clear from Story #155 description and user instructions.

## Risks and Considerations

1. **Risk:** Accidentally translating placeholders instead of keeping EsOf()/EnOf() format
   - **Mitigation:** Follow pattern strictly; validate in code review

2. **Risk:** Creating duplicate keys for same content
   - **Mitigation:** Check existing common.json/navigation.json before adding keys

3. **Risk:** Keys in components don't match keys in JSON files (typos)
   - **Mitigation:** Manual validation step; unit tests will fail if keys missing

4. **Risk:** Breaking existing functionality during refactor
   - **Mitigation:** Comprehensive unit tests for all modified components

5. **Consideration:** Confirm dialog pattern - should defaults use translation keys or stay as literals?
   - **Decision:** Keep defaults as literals for now; consumers pass translated strings

## Dependencies

- Previous i18n stories (#152, #159, etc.) must be merged
- No external dependencies or migrations required
- Standard i18n infrastructure (next-intl) already in place

## Success Criteria

1. ✅ All hardcoded text in target components replaced with translation keys
2. ✅ Translation keys added to both en/ and es/ JSON files
3. ✅ Placeholder format (EsOf/EnOf) used correctly
4. ✅ No duplicate keys for same content
5. ✅ Keys in components match keys in JSON files
6. ✅ All unit tests pass with 80%+ coverage
7. ✅ Build, lint, tests all pass
8. ✅ 0 new SonarCloud issues
9. ✅ Manual testing in Vercel Preview confirms functionality
10. ✅ Code review approval

## Estimated Effort

Medium (4-6 hours) - As estimated in Story #155
- Component refactoring: 2-3 hours
- Translation file updates: 1 hour
- Unit test creation: 2-3 hours
- Testing and validation: 1 hour

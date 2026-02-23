# Change Plan 1: [i18n] PWA Manifest & Metadata Localization (#158)

## Context

The initial implementation (completed) covered PWA manifest and metadata localization for SEO/social platforms. However, user feedback identified that the PWA-related **UI components** (install prompts and offline notification) also need i18n to provide a complete localized experience.

**What was completed in original plan:**
- ✅ Dynamic locale-aware PWA manifest
- ✅ Localized metadata (Open Graph, Twitter cards)
- ✅ SEO improvements

**What's missing (scope expansion):**
- ❌ Install PWA prompt UI (hardcoded Spanish)
- ❌ Offline detection snackbar (hardcoded Spanish)
- ❌ Notification subscription prompt (hardcoded Spanish)

This change plan expands the scope to localize these user-facing components for consistency with the overall i18n effort.

## Changes from Original Plan

### Staying the Same:
- Manifest and metadata localization (already implemented)
- No new translation namespace needed (will use existing `common.json` and `navigation.json`)
- Testing approach and quality gates

### Adding:
- i18n for `Install-pwa.tsx` component
- i18n for `offline-detection.tsx` component
- i18n for `notifications-subscription-prompt.tsx` component
- Translation keys for all UI strings
- Tests for component i18n

## Revised Technical Approach

### 1. Add Translation Keys

**Create new namespace: `locales/{locale}/pwa.json`**

This keeps PWA-specific strings organized and separate from common/navigation.

**Spanish (locales/es/pwa.json):**
```json
{
  "install": {
    "title": "Instalar como App",
    "heading": "Instala esta aplicación en tu dispositivo",
    "description": "Instala esta aplicación en tu pantalla de inicio para un acceso rápido y fácil cuando estés en movimiento.",
    "button": "Instalar Aplicación",
    "ios": {
      "heading": "Instala esta aplicación en tu dispositivo iOS",
      "showGuide": "Mostrar guía de instalación",
      "hideGuide": "Ocultar guía de instalación",
      "instructions": {
        "title": "Para instalar esta aplicación en tu iPhone:",
        "step1": "Toca el botón Compartir en la parte inferior de la pantalla",
        "step2": "Desplázate hacia abajo y toca 'Añadir a pantalla de inicio'",
        "step3": "Toca 'Añadir' en la esquina superior derecha"
      }
    }
  },
  "offline": {
    "message": "Estás navegando sin conexión. Algunas funciones pueden no estar disponibles."
  },
  "notifications": {
    "title": "Notificaciones",
    "message": "¿Te gustaría recibir notificaciones para estar al día con las últimas actualizaciones?",
    "neverAsk": "No preguntar más",
    "notNow": "Ahora no",
    "activate": "Activar"
  }
}
```

**English (locales/en/pwa.json):**
```json
{
  "install": {
    "title": "Install as App",
    "heading": "Install this app on your device",
    "description": "Install this app on your home screen for quick and easy access when you're on the go.",
    "button": "Install App",
    "ios": {
      "heading": "Install this app on your iOS device",
      "showGuide": "Show installation guide",
      "hideGuide": "Hide installation guide",
      "instructions": {
        "title": "To install this app on your iPhone:",
        "step1": "Tap the Share button at the bottom of the screen",
        "step2": "Scroll down and tap 'Add to Home Screen'",
        "step3": "Tap 'Add' in the top right corner"
      }
    }
  },
  "offline": {
    "message": "You're browsing offline. Some features may not be available."
  },
  "notifications": {
    "title": "Notifications",
    "message": "Would you like to receive notifications to stay up-to-date with the latest updates?",
    "neverAsk": "Don't ask again",
    "notNow": "Not now",
    "activate": "Enable"
  }
}
```

**Rationale:**
- New `pwa` namespace keeps PWA UI strings organized
- Hierarchical structure mirrors component organization
- All user-facing strings captured

### 2. Update Components with i18n

#### Component 1: offline-detection.tsx

**Changes:**
- Import `useTranslations` from 'next-intl'
- Replace hardcoded Spanish string with translation

**Before:**
```tsx
<Alert severity="warning">
  Estás navegando sin conexión. Algunas funciones pueden no estar disponibles.
</Alert>
```

**After:**
```tsx
'use client'

import { useTranslations } from 'next-intl'; // ADD

export default function OfflineDetection() {
  const t = useTranslations('pwa.offline'); // ADD
  // ... rest of code

  return (
    <Snackbar ...>
      <Alert severity="warning">
        {t('message')} {/* CHANGE */}
      </Alert>
    </Snackbar>
  );
}
```

#### Component 2: Install-pwa.tsx

**Changes:**
- Import `useTranslations` from 'next-intl'
- Replace all hardcoded Spanish strings with translations
- Fix typo: "Intalar" → use translation key

**Key replacements:**
- AlertTitle: `t('install.title')`
- Heading: `t('install.heading')`
- Description: `t('install.description')`
- Button: `t('install.button')`
- iOS heading: `t('install.ios.heading')`
- iOS guide toggle: `showIOSGuide ? t('install.ios.hideGuide') : t('install.ios.showGuide')`
- iOS instructions title: `t('install.ios.instructions.title')`
- iOS step 1: `t('install.ios.instructions.step1')`
- iOS step 2: `t('install.ios.instructions.step2')`
- iOS step 3: `t('install.ios.instructions.step3')`

#### Component 3: notifications-subscription-prompt.tsx

**Changes:**
- Import `useTranslations` from 'next-intl'
- Replace all hardcoded Spanish strings with translations

**Key replacements:**
- AlertTitle: `t('notifications.title')`
- Message: `t('notifications.message')`
- "No preguntar más": `t('notifications.neverAsk')`
- "Ahora no": `t('notifications.notNow')`
- "Activar": `t('notifications.activate')`

### 3. Testing Strategy

Create i18n tests following existing patterns (like `tournament-bottom-nav-i18n.test.tsx`):

#### Test File 1: offline-detection-i18n.test.tsx

**File:** `app/components/__tests__/offline-detection-i18n.test.tsx` (NEW)

**Test scenarios:**
1. Uses pwa.offline namespace
2. Renders offline message with translation key
3. Shows message when offline
4. Hides message when online

#### Test File 2: Install-pwa-i18n.test.tsx

**File:** `app/components/__tests__/Install-pwa-i18n.test.tsx` (NEW)

**Test scenarios:**
1. Uses pwa.install namespace
2. Renders all install strings with translation keys
3. Renders iOS-specific strings when on iOS device
4. Toggle guide shows/hides correctly with translated button text

#### Test File 3: notifications-subscription-prompt-i18n.test.tsx

**File:** `app/components/__tests__/notifications-subscription-prompt-i18n.test.tsx` (NEW)

**Test scenarios:**
1. Uses pwa.notifications namespace
2. Renders all notification strings with translation keys
3. Button actions work correctly with translated labels

**Coverage target:** 80% minimum on modified components

## Revised Implementation Steps

### Step 1: Create Translation Files
1. Create `locales/es/pwa.json` with Spanish PWA strings
2. Create `locales/en/pwa.json` with English PWA strings

### Step 2: Register PWA Namespace in i18n Configuration

**CRITICAL:** The `pwa` namespace must be registered in two places for next-intl to recognize it.

#### Step 2.1: Register in `types/i18n.ts`

Add import at top with other namespace imports:
```typescript
import pwa from '@/locales/en/pwa.json';
```

Add to `Messages` type:
```typescript
type Messages = {
  common: typeof common;
  navigation: typeof navigation;
  // ... other namespaces ...
  pwa: typeof pwa;  // ADD THIS
};
```

#### Step 2.2: Register in `i18n/request.ts`

Add to `messages` object in `getRequestConfig`:
```typescript
return {
  locale,
  messages: {
    common: (await import(`../locales/${locale}/common.json`)).default,
    navigation: (await import(`../locales/${locale}/navigation.json`)).default,
    // ... other namespaces ...
    pwa: (await import(`../locales/${locale}/pwa.json`)).default  // ADD THIS
  }
};
```

**Why this is required:**
- `types/i18n.ts` provides TypeScript type safety for translation keys
- `i18n/request.ts` loads the actual translation JSON at runtime
- Without both registrations, `useTranslations('pwa')` will fail

### Step 3: Update offline-detection.tsx
1. Import `useTranslations`
2. Add `const t = useTranslations('pwa.offline')`
3. Replace hardcoded string with `t('message')`

### Step 4: Update Install-pwa.tsx
1. Import `useTranslations`
2. Add `const t = useTranslations('pwa.install')`
3. Replace all hardcoded strings with translation keys
4. Fix "Intalar" typo (via translation key)

### Step 5: Update notifications-subscription-prompt.tsx
1. Import `useTranslations`
2. Add `const t = useTranslations('pwa.notifications')`
3. Replace all hardcoded strings with translation keys

### Step 6: Create Tests
1. Create `offline-detection-i18n.test.tsx`
2. Create `Install-pwa-i18n.test.tsx`
3. Create `notifications-subscription-prompt-i18n.test.tsx`
4. Follow existing i18n test patterns (mock next-intl, verify keys)

### Step 7: Validation
1. Run tests (`npm test`)
2. Run lint (`npm run lint`)
3. Run build (`npm run build`)
4. Manual verification in Vercel Preview:
   - Switch to Spanish → Verify install prompt, offline message, notification prompt in Spanish
   - Switch to English → Verify all UI in English
   - Test on iOS Safari (if available) → Verify iOS guide strings

## Files to Create/Modify

### Files to Create
1. **locales/es/pwa.json** - Spanish PWA UI strings
2. **locales/en/pwa.json** - English PWA UI strings
3. **app/components/__tests__/offline-detection-i18n.test.tsx** - Offline detection i18n tests
4. **app/components/__tests__/Install-pwa-i18n.test.tsx** - Install PWA i18n tests
5. **app/components/__tests__/notifications-subscription-prompt-i18n.test.tsx** - Notifications i18n tests

### Files to Modify
1. **types/i18n.ts** - Register `pwa` namespace for TypeScript type safety
2. **i18n/request.ts** - Register `pwa` namespace for runtime loading
3. **app/components/offline-detection.tsx** - Add i18n
4. **app/components/Install-pwa.tsx** - Add i18n (10+ strings)
5. **app/components/notifications-subscription-prompt.tsx** - Add i18n (5 strings)

## Impact Assessment

**Files already modified (from original plan):**
- ✅ `app/[locale]/manifest.ts` (created)
- ✅ `app/layout.tsx` (metadata added)
- ✅ `app/[locale]/layout.tsx` (metadata added)
- ✅ Tests for manifest and layout metadata

**New files to modify (change plan):**
- 2 i18n configuration files (namespace registration)
- 3 component files (i18n implementation)
- 2 translation files (new `pwa` namespace)
- 3 test files (i18n tests)

**Files that no longer need modification:**
- None (change plan is additive only)

## Testing Updates

**Original testing:**
- Manifest tests ✅
- Layout metadata tests ✅

**Added testing:**
- Offline detection i18n tests (NEW)
- Install PWA i18n tests (NEW)
- Notification prompt i18n tests (NEW)

**Total test coverage:**
- Original: 19 tests
- Added: ~15 tests (estimated)
- Total: ~34 tests

## Quality Gates

Same as original plan:
- **Coverage:** ≥80% on new/modified code
- **New Issues:** 0 new issues (any severity)
- **Tests:** All tests passing
- **Build:** Successful build
- **Lint:** No new linting errors

## Risks and Mitigations

### Risk: Breaking existing PWA functionality
**Mitigation:**
- Only changing display strings, not logic
- Comprehensive tests verify functionality preserved
- Manual testing in Vercel Preview

### Risk: Translation keys not loading in client components
**Mitigation:**
- All components already have 'use client' directive
- Follow proven pattern from other client components
- Tests verify translation loading

### Risk: Increased bundle size with new namespace
**Mitigation:**
- PWA namespace is small (~20 strings total)
- Next-intl loads translations efficiently
- Negligible impact on performance

## Open Questions

None - the approach is straightforward extension of existing i18n patterns to PWA UI components.

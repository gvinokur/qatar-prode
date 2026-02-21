# Implementation Plan: Story #182 - [i18n] Translate Individual Awards Page

## Context

This story is part of the ongoing internationalization effort to make the application fully bilingual (English/Spanish). The Individual Awards page and related components currently contain hardcoded text (mixed Spanish and English) that needs to be extracted into translation files and replaced with next-intl translation calls.

**Story Details:**
- **Issue #182:** [i18n] Translate Individual Awards Page
- **Priority:** High
- **Effort:** Medium (4-6 hours)
- **Labels:** i18n

**What needs translation:**
- **Awards page** (`/tournaments/[id]/awards`) - Podium predictions and individual award predictions
- **Award panel components** - Podium section (Champion, Runner-up, Third place) and Individual Awards section
- **Award categories** - Best Player, Top Goalscorer, Best Goalkeeper, Best Young Player
- **Empty awards notification** - Snackbar alerting users to complete awards predictions
- **Award utilities** - Dynamic award label definitions
- **Related UI elements** - Team selector, autocomplete placeholders

**Why this matters:**
- Essential for bilingual user experience
- Part of larger i18n initiative (milestone)
- Fixes language inconsistencies (mixed English/Spanish currently)
- Fixes typo: "Inviduales" → "Individuales"
- Follows successful pattern from stories #155 (Common UI), #178 (Tables), #180 (User Stats)

**Current Issues Found:**
- Mixed languages: Some strings in English ("Third Place", "Predictions Locked"), others in Spanish
- Typo in Spanish: "Premios Inviduales" should be "Premios Individuales"
- Hardcoded labels in 6 different files
- Onboarding component already uses i18n correctly (`onboarding.steps.tournamentAwards`) - good reference pattern

## Technical Approach

### Translation Strategy

1. **Create new translation namespace:** `awards.json` for awards-specific strings
2. **Reuse existing namespace:** Some strings already exist in `predictions.json` under `tournament.individualAwards`
3. **Use next-intl pattern:**
   - Client Components: `useTranslations('awards')` + `t('key')`
   - Server Components: `await getTranslations('awards')` + `t('key')` (if needed)
   - **Dynamic values:** Use interpolation for player/team names
4. **EnOf marker pattern:**
   - All hardcoded strings are in Spanish (original language)
   - **ES file:** Clean Spanish text (the source)
   - **EN file:** `EnOf(Spanish text)` to mark "needs English translation"
5. **Award label translations:**
   - Award category labels must be translatable (Best Player, Top Goalscorer, etc.)
   - Move from hardcoded labels in `award-utils.ts` to translation keys

### String Interpolation Examples

**Translation file format:**
```json
// es/awards.json (source)
{
  "podium": {
    "title": "Podio del Torneo",
    "champion": {
      "label": "Campeón",
      "helper": "Selecciona el equipo que predigas que ganará el torneo"
    }
  },
  "categories": {
    "bestPlayer": "Mejor Jugador",
    "topGoalscorer": "Goleador",
    "bestGoalkeeper": "Mejor Arquero",
    "bestYoungPlayer": "Mejor Jugador Joven"
  }
}

// en/awards.json (to be translated)
{
  "podium": {
    "title": "EnOf(Podio del Torneo)",
    "champion": {
      "label": "EnOf(Campeón)",
      "helper": "EnOf(Selecciona el equipo que predigas que ganará el torneo)"
    }
  },
  "categories": {
    "bestPlayer": "EnOf(Mejor Jugador)",
    "topGoalscorer": "EnOf(Goleador)",
    "bestGoalkeeper": "EnOf(Mejor Arquero)",
    "bestYoungPlayer": "EnOf(Mejor Jugador Joven)"
  }
}
```

**Component usage:**
```typescript
// Award panel
const t = useTranslations('awards')
<CardHeader title={t('podium.title')} />
<TextField label={t('podium.champion.label')} helperText={t('podium.champion.helper')} />

// Award utilities - pass translation function
const getAwardLabel = (property: string, t: any) => {
  const labelMap = {
    'best_player_id': t('categories.bestPlayer'),
    'top_goalscorer_player_id': t('categories.topGoalscorer'),
    'best_goalkeeper_player_id': t('categories.bestGoalkeeper'),
    'best_young_player_id': t('categories.bestYoungPlayer')
  }
  return labelMap[property]
}
```

### Translation File Structure

**New file: `/locales/es/awards.json`** (Spanish - source language)
```json
{
  "podium": {
    "title": "Podio del Torneo",
    "champion": {
      "label": "Campeón",
      "helper": "Selecciona el equipo que predigas que ganará el torneo"
    },
    "runnerUp": {
      "label": "Subcampeón",
      "helper": "Selecciona el equipo que predigas que llegará a la final"
    },
    "thirdPlace": {
      "label": "Tercer Lugar",
      "helper": "Selecciona el equipo que predigas que ganará el partido por el tercer lugar"
    }
  },
  "individual": {
    "title": "Premios Individuales",
    "selectPlayer": "Elegir Jugador",
    "unavailableTitle": "Premios Individuales no disponibles",
    "unavailableMessage": "Esta sección estará disponible una vez que se den a conocer las nóminas de los equipos participantes en el torneo",
    "successMessage": "Tus pronósticos se guardaron correctamente!",
    "lockedTitle": "Predicciones Bloqueadas",
    "lockedMessage": "Las predicciones ya no están disponibles ya que el torneo ya ha comenzado"
  },
  "categories": {
    "bestPlayer": "Mejor Jugador",
    "topGoalscorer": "Goleador",
    "bestGoalkeeper": "Mejor Arquero",
    "bestYoungPlayer": "Mejor Jugador Joven"
  },
  "notification": {
    "title": "Pronóstico de Premios no Finalizado",
    "message": "Hemos detectado que no has elegido quién será el campeón o los premios individuales.",
    "deadline": "La selección de dichas predicciones cierra 5 días luego del inicio del campeonato.",
    "action": "Puedes ir a la página de premios para hacer tus predicciones.",
    "button": "Ir a Premios"
  },
  "selector": {
    "none": "Ninguno",
    "selectItem": "Seleccionar"
  }
}
```

**New file: `/locales/en/awards.json`** (English - needs translation)
```json
{
  "podium": {
    "title": "EnOf(Podio del Torneo)",
    "champion": {
      "label": "EnOf(Campeón)",
      "helper": "EnOf(Selecciona el equipo que predigas que ganará el torneo)"
    },
    "runnerUp": {
      "label": "EnOf(Subcampeón)",
      "helper": "EnOf(Selecciona el equipo que predigas que llegará a la final)"
    },
    "thirdPlace": {
      "label": "EnOf(Tercer Lugar)",
      "helper": "EnOf(Selecciona el equipo que predigas que ganará el partido por el tercer lugar)"
    }
  },
  "individual": {
    "title": "EnOf(Premios Individuales)",
    "selectPlayer": "EnOf(Elegir Jugador)",
    "unavailableTitle": "EnOf(Premios Individuales no disponibles)",
    "unavailableMessage": "EnOf(Esta sección estará disponible una vez que se den a conocer las nóminas de los equipos participantes en el torneo)",
    "successMessage": "EnOf(Tus pronósticos se guardaron correctamente!)",
    "lockedTitle": "EnOf(Predicciones Bloqueadas)",
    "lockedMessage": "EnOf(Las predicciones ya no están disponibles ya que el torneo ya ha comenzado)"
  },
  "categories": {
    "bestPlayer": "EnOf(Mejor Jugador)",
    "topGoalscorer": "EnOf(Goleador)",
    "bestGoalkeeper": "EnOf(Mejor Arquero)",
    "bestYoungPlayer": "EnOf(Mejor Jugador Joven)"
  },
  "notification": {
    "title": "EnOf(Pronóstico de Premios no Finalizado)",
    "message": "EnOf(Hemos detectado que no has elegido quién será el campeón o los premios individuales.)",
    "deadline": "EnOf(La selección de dichas predicciones cierra 5 días luego del inicio del campeonato.)",
    "action": "EnOf(Puedes ir a la página de premios para hacer tus predicciones.)",
    "button": "EnOf(Ir a Premios)"
  },
  "selector": {
    "none": "EnOf(Ninguno)",
    "selectItem": "EnOf(Seleccionar)"
  }
}
```

## Files to Create/Modify

### Translation Files (New)
1. `/locales/es/awards.json` - Spanish translations (source language, clean text, fix typo)
2. `/locales/en/awards.json` - English placeholders (with EnOf markers until translated)
3. `/types/i18n.ts` - Add `awards` namespace to type definitions
4. `/i18n/request.ts` - Register `awards` namespace in messages configuration

### Client Components (5 files)

4. `/app/components/awards/award-panel.tsx`
   - Add `useTranslations('awards')`
   - Replace hardcoded text in podium section (lines 137, 148, 153, 177, 182, 206, 211)
   - Replace hardcoded text in individual awards section (lines 119, 230, 234-235, 298)
   - Fix typo: "Premios Inviduales" → use correct translation "Premios Individuales"
   - Fix language inconsistency: "Third Place" (English) → use translation
   - Pass translation function to award utilities for dynamic labels

5. `/app/components/awards/empty-award-notification.tsx`
   - Add `useTranslations('awards')`
   - Replace notification title, message, and button text (lines 22, 25-28)

6. `/app/components/awards/team-selector.tsx`
   - Add `useTranslations('awards')`
   - Replace "None" with `t('selector.none')` (line 75)

7. `/app/components/awards/mobile-friendly-autocomplete.tsx`
   - Add `useTranslations('awards')`
   - Replace "Select Item" with `t('selector.selectItem')` (line 64)
   - Make label prop accept translation key OR maintain current behavior

8. `/app/utils/award-utils.ts`
   - Add new function `getAwardsDefinition(t: any)` that accepts translation function parameter
   - Replace hardcoded labels with translation keys in new function
   - Keep old `awardsDefinition` export with `@deprecated` JSDoc tag
   - Export both for backward compatibility

### Test Files (5 test files)

9. `__tests__/components/awards/award-panel.test.tsx` - Create i18n tests for main component
10. `__tests__/components/awards/empty-award-notification.test.tsx` - Create i18n tests
11. `__tests__/components/awards/team-selector.test.tsx` - Update existing tests for i18n
12. `__tests__/components/awards/mobile-friendly-autocomplete.test.tsx` - Update tests
13. `__tests__/utils/award-utils.test.tsx` - Test award label translations (both old and new functions)

**Total: 5 test files** (all new or significant updates)

**NOTE:** Backoffice component (`/app/components/backoffice/awards-tab.tsx`) is EXCLUDED from this story and can be addressed in a future i18n story if needed.

## Implementation Steps

### Phase 1: Translation Files (Create foundation)
1. Create `/locales/es/awards.json` with clean Spanish text (fix typo: "Inviduales" → "Individuales")
2. Create `/locales/en/awards.json` with `EnOf(Spanish text)` markers
3. Update `/types/i18n.ts` to import and include `awards` namespace
4. **Register namespace in `/i18n/request.ts`:**
   - Add to messages object: `awards: (await import(\`../locales/\${locale}/awards.json\`)).default,`
   - Insert alphabetically after `auth:` and before `common:`
5. **Validate translation key parity:** Ensure EN and ES have matching keys

**Key Parity Validation:**
```bash
# Compare keys in both files (should output nothing if keys match)
diff <(jq -r 'paths(scalars) | join(".")' locales/en/awards.json | sort) \
     <(jq -r 'paths(scalars) | join(".")' locales/es/awards.json | sort)
```

**I18n-Specific Verification Steps (MANDATORY):**

After creating translation files and before moving to Phase 2, verify:

a) **All used keys exist in messages:**
   - Grep all components for `t('awards.` or `t("awards.` calls
   - Cross-reference against keys defined in `/locales/es/awards.json`
   - Ensure every `t()` call maps to an existing key path

b) **No duplicate content keys:**
   - Check that no two keys have identical values in Spanish
   - Document reasoning for any intentional duplicates

c) **Namespace files properly imported:**
   - Verify `/types/i18n.ts` imports `awards` from both locales
   - Verify the namespace is added to the `Messages` type
   - Verify `/i18n/request.ts` includes `awards` in messages configuration
   - Check that TypeScript compilation succeeds

d) **Proper translation pattern usage:**
   - Client components use `useTranslations('awards')` (not `getTranslations`)
   - Server components use `await getTranslations('awards')` (not `useTranslations`)

e) **Terminology consistency across namespaces:**
   - Award category terms match between `awards.json` and `onboarding.json` (if overlapping)
   - No conflicting translations for same concept

**Verification Commands:**
```bash
# a) Find all t() calls in awards components
grep -r "t('awards\|t(\"awards" app/components/awards/

# b) Check for duplicate values in Spanish file
jq -r '.. | strings' locales/es/awards.json | sort | uniq -d

# c) Verify TypeScript compilation
npm run build

# d) Verify correct pattern usage
grep -r "useTranslations" app/components/awards/

# e) Check terminology consistency
grep -h "Premios Individuales\|Campeón\|Mejor Jugador" locales/es/*.json | sort | uniq -c
```

### Phase 2: Award Utilities (Foundation for other components)
5. Update `/app/utils/award-utils.ts`:
   - Create new function `getAwardsDefinition(t: any)` that accepts translation function
   - Replace hardcoded labels with translation keys:
     ```typescript
     // OLD
     { label: 'Mejor Jugador', property: 'best_player_id', ... }

     // NEW
     { label: t('categories.bestPlayer'), property: 'best_player_id', ... }
     ```
   - Export both old `awardsDefinition` (for backward compatibility) and new `getAwardsDefinition(t)`
   - Later phases will migrate components to use `getAwardsDefinition(t)`

### Phase 3: Main Awards Panel Component (Core functionality)
6. Update `/app/components/awards/award-panel.tsx`:
   - Import `useTranslations` from 'next-intl'
   - Add `const t = useTranslations('awards')` at top of component
   - Import `getAwardsDefinition` from award-utils

   **Replace podium section (lines 137-211):**
   - Line 137: `title={'Podio del Torneo'}` → `title={t('podium.title')}`
   - Line 148: `label="Campeón"` → `label={t('podium.champion.label')}`
   - Line 153: `helperText="Selecciona el equipo..."` → `helperText={t('podium.champion.helper')}`
   - Line 177: `label="Subcampeón"` → `label={t('podium.runnerUp.label')}`
   - Line 182: `helperText="Selecciona el equipo que predigas..."` → `helperText={t('podium.runnerUp.helper')}`
   - Line 206: `label="Third Place"` → `label={t('podium.thirdPlace.label')}` (FIXES ENGLISH TEXT!)
   - Line 211: `helperText="Select the team..."` → `helperText={t('podium.thirdPlace.helper')}` (FIXES ENGLISH TEXT!)

   **Replace individual awards section (lines 119, 230-235, 298):**
   - Line 119: `label="Elegir Jugador"` → `label={t('individual.selectPlayer')}`
   - Line 230: `title={'Premios Individuales'}` → `title={t('individual.title')}`
   - Line 234: `<AlertTitle>Premios Inviduales no disponibles</AlertTitle>` → `<AlertTitle>{t('individual.unavailableTitle')}</AlertTitle>` (FIXES TYPO!)
   - Line 235: `Esta seccion estara disponible...` → `{t('individual.unavailableMessage')}`
   - Line 298: `Tus pronosticos se guardaron correctamente!` → `{t('individual.successMessage')}`

   **Replace locked alert (lines 132-133):**
   - Line 132: `<AlertTitle>Predictions Locked</AlertTitle>` → `<AlertTitle>{t('individual.lockedTitle')}</AlertTitle>` (FIXES ENGLISH TEXT!)
   - Line 133: `Predictions are no longer available...` → `{t('individual.lockedMessage')}` (FIXES ENGLISH TEXT!)

   **Update award definitions usage:**
   - Replace `awardsDefinition` with `getAwardsDefinition(t)` to get translated labels
   - This will dynamically translate: "Mejor Jugador", "Goleador", "Mejor Arquero", "Mejor Jugador Joven"

### Phase 4: Empty Awards Notification Component
7. Update `/app/components/awards/empty-award-notification.tsx`:
   - Import `useTranslations` from 'next-intl'
   - Add `const t = useTranslations('awards')`
   - Line 22: `"Ir a Premios"` → `{t('notification.button')}`
   - Line 25: `<AlertTitle>Pronostico de Premios no Finalizado</AlertTitle>` → `<AlertTitle>{t('notification.title')}</AlertTitle>`
   - Line 26-28: Replace all notification message text with:
     ```tsx
     {t('notification.message')} {t('notification.deadline')} {t('notification.action')}
     ```

### Phase 5: Team Selector Component
8. Update `/app/components/awards/team-selector.tsx`:
   - Import `useTranslations` from 'next-intl'
   - Add `const t = useTranslations('awards')`
   - Line 75: `<em>None</em>` → `<em>{t('selector.none')}</em>`

### Phase 6: Mobile Autocomplete Component
9. Update `/app/components/awards/mobile-friendly-autocomplete.tsx`:
   - Import `useTranslations` from 'next-intl'
   - Add `const t = useTranslations('awards')`
   - Line 64: `label="Select Item"` → `label={t('selector.selectItem')}`

### Phase 7: Testing (Create comprehensive test coverage)
10. Establish coverage baseline:
   ```bash
   # Run coverage report before changes to establish baseline
   npm test -- --coverage --collectCoverageFrom='app/components/awards/**' --collectCoverageFrom='app/utils/award-utils.ts'
   ```
11. Create/update i18n tests for all 5 components
12. Test both English and Spanish translations
13. Test dynamic award labels with translation function
14. Test all podium fields render with correct translations
15. Test notification displays translated messages
16. Test team selector shows translated "None" option
17. Ensure 80% coverage threshold met

**Testing pattern:**
```typescript
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import enAwards from '@/locales/en/awards.json'
import esAwards from '@/locales/es/awards.json'

describe('AwardPanel i18n', () => {
  const renderWithAwards = (component: React.ReactNode, locale = 'es') => {
    const messages = { awards: locale === 'en' ? enAwards : esAwards }
    return render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        {component}
      </NextIntlClientProvider>
    )
  }

  it('renders Spanish podium title', () => {
    renderWithAwards(<AwardPanel {...mockProps} />, 'es')
    expect(screen.getByText('Podio del Torneo')).toBeInTheDocument()
  })

  it('renders English placeholder for podium title', () => {
    renderWithAwards(<AwardPanel {...mockProps} />, 'en')
    expect(screen.getByText(/EnOf\(Podio del Torneo\)/)).toBeInTheDocument()
  })

  it('renders translated award categories', () => {
    renderWithAwards(<AwardPanel {...mockProps} />, 'es')
    expect(screen.getByText('Mejor Jugador')).toBeInTheDocument()
    expect(screen.getByText('Goleador')).toBeInTheDocument()
    expect(screen.getByText('Mejor Arquero')).toBeInTheDocument()
    expect(screen.getByText('Mejor Jugador Joven')).toBeInTheDocument()
  })

  it('fixes typo in unavailable message', () => {
    renderWithAwards(<AwardPanel {...mockProps} />, 'es')
    // Should say "Individuales", not "Inviduales"
    expect(screen.getByText('Premios Individuales no disponibles')).toBeInTheDocument()
    expect(screen.queryByText(/Inviduales/)).not.toBeInTheDocument()
  })

  it('fixes language inconsistency for third place', () => {
    renderWithAwards(<AwardPanel {...mockProps} hasThirdPlace />, 'es')
    // Should be Spanish "Tercer Lugar", not English "Third Place"
    expect(screen.getByText('Tercer Lugar')).toBeInTheDocument()
    expect(screen.queryByText('Third Place')).not.toBeInTheDocument()
  })
})
```

## Testing Strategy

### Unit Tests Required (80% coverage target)
1. **Translation files validation:**
   - Verify JSON structure is valid
   - **Key parity validation:** Automated check that EN and ES have identical key structure
   - Validate EnOf markers in English

2. **Component i18n tests (6 components):**
   - Test each component renders with English translations (EnOf placeholders)
   - Test each component renders with Spanish translations
   - Test award categories use translated labels
   - Test typo is fixed ("Individuales" not "Inviduales")
   - Test language consistency (no mixed English/Spanish)

3. **Award utilities tests:**
   - Test `getAwardsDefinition(t)` returns awards with correct translated labels
   - Test all 4 award categories have translations

4. **Integration tests:**
   - Test awards page with both locales
   - Test podium fields show correct labels and helpers
   - Test individual awards section displays correctly
   - Test empty awards notification in both languages

### Manual Testing Checklist
- [ ] Switch language to English → verify all text is in English placeholders
- [ ] Switch language to Spanish → verify all text is in Spanish
- [ ] Verify typo is fixed: "Premios Individuales" (not "Inviduales")
- [ ] Verify no mixed languages: All podium labels in same language
- [ ] Test podium section displays translated labels (Champion, Runner-up, Third Place)
- [ ] Test individual awards section shows translated award categories
- [ ] Test empty awards notification displays translated message
- [ ] Test team selector shows translated "None" option
- [ ] Test success message appears in correct language after saving
- [ ] Test unavailable message appears in correct language when awards locked

## Validation Considerations

### Pre-Commit Validation
1. **Run i18n verification steps from Phase 1** → all keys exist, no unintended duplicates, namespace imported, correct patterns
2. Run `npm test` → all tests pass (including new i18n tests)
3. Run `npm run lint` → no linting errors
4. Run `npm run build` → build succeeds without errors (also verifies TypeScript types for i18n)

### SonarCloud Requirements
- **Code coverage:** ≥80% on new/modified code
- **New issues:** 0 (any severity)
- **Security rating:** A
- **Maintainability:** B or higher
- **Duplicated code:** <5%

### Deployment Validation
- Deploy to Vercel Preview
- Test language switching in preview environment
- Verify all awards page sections render correctly in both languages
- Check for console errors or warnings
- Test podium predictions work correctly
- Test individual awards predictions work correctly
- Verify empty awards notification appears when applicable

## Decisions Made (Based on Plan Review)

### 1. Backoffice Component Scope - EXCLUDED
**Decision:** `/app/components/backoffice/awards-tab.tsx` is EXCLUDED from this story.
- **Rationale:** Backoffice is admin-only and can be addressed in a separate i18n story if needed
- **Impact:** Reduces scope, removes Phase 7 and 1 test file
- **Definition of Done:** This story completes when user-facing awards components are i18n-ready

### 2. Mobile Autocomplete Label Configuration - HARDCODED TRANSLATION
**Decision:** `mobile-friendly-autocomplete.tsx` will use hardcoded translation `t('selector.selectItem')`
- **Rationale:** Consistent with other UI elements using translations directly
- **Implementation:** Line 64 changes from `label="Select Item"` to `label={t('selector.selectItem')}`
- **No prop configuration needed** - label is internal to component

### 3. Award Utilities Backward Compatibility - DUAL EXPORT STRATEGY
**Decision:** Export both `awardsDefinition` (deprecated) and `getAwardsDefinition(t)` (new)
- **Phase 2 implementation:**
  - Keep old `awardsDefinition` export untouched for now
  - Add new `getAwardsDefinition(t: any)` function
  - Add JSDoc `@deprecated` tag to old export
- **Migration strategy:**
  - This story migrates `award-panel.tsx` to use new function
  - Future stories will migrate other consumers (if any exist)
  - After all consumers migrated, remove old export in cleanup story

### 4. SonarCloud Coverage Strategy - EXPLICIT BASELINE & TARGETS
**Coverage approach:**
- **Pre-implementation:** Run coverage report to establish baseline for affected files
- **Target:** New/modified lines must reach ≥80% coverage (not entire file average)
- **Strategy:**
  - Each component gets comprehensive i18n tests (both locales)
  - Award utilities get tests for both old and new functions
  - Use `NextIntlClientProvider` pattern for consistent test setup
- **Validation:** Run `npm test -- --coverage` before commit to verify threshold met

### 5. "Predictions Locked" Alert - CONFIRMED AND MAPPED
**Verified in code:**
- Line 132: `<AlertTitle>Predictions Locked</AlertTitle>`
- Line 133: `Predictions are no longer available as the tournament has already started.`
- **Translation keys:**
  - `t('individual.lockedTitle')` for AlertTitle
  - `t('individual.lockedMessage')` for message text
- **Fix:** Both English strings will be replaced with Spanish translations

### 6. Terminology Consistency Check - ADDED TO VALIDATION
**New validation step in Phase 1:**
After creating translation files, verify terminology consistency:
```bash
# Check for duplicate or similar terms across namespaces
grep -h "Premios Individuales\|Individual Awards" locales/es/*.json
grep -h "Campeón\|Champion" locales/es/*.json
grep -h "Mejor Jugador\|Best Player" locales/es/*.json
```
- Ensure award category terms match across `awards.json` and `onboarding.json`
- Document any intentional variations in translation notes

## Notes
- Follow exact pattern from story #178 (Tables & Groups i18n) and #180 (User Stats i18n)
- This story FIXES bugs: typo ("Inviduales"), mixed languages ("Third Place" in English)
- Award labels need special handling - must pass translation function to utilities
- Onboarding component (`onboarding-steps/tournament-awards-step.tsx`) already uses i18n correctly - good reference
- Test with both languages in development before creating PR
- Consider creating visual prototype showing before/after for language consistency fixes

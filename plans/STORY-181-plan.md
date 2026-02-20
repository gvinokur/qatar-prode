# Implementation Plan: Story #181 - [i18n] Translate Qualified Teams Page

## Context

This story is part of the ongoing internationalization effort to make the application fully bilingual (English/Spanish). The Qualified Teams page currently contains hardcoded Spanish text that needs to be extracted into translation files and replaced with next-intl translation calls.

**Story Details:**
- **Issue #181:** [i18n] Translate Qualified Teams Page
- **Priority:** High
- **Effort:** Low (2-4 hours)
- **Labels:** i18n

**What needs translation:**
- **Qualified Teams page** (`/tournaments/[id]/qualified-teams`) - Prediction interface for group qualification
- **Team listings** - Draggable team cards with positions
- **Qualification status displays** - Checkboxes, results overlays, pending states
- **Third place summary** - Progress tracker and selected teams
- **Related navigation elements** - Info popover, alerts, snackbars

**Why this matters:**
- Essential for bilingual user experience
- Part of larger i18n initiative (milestone)
- Follows successful pattern from stories #178 (Tables), #179 (Rules), #180 (User Stats), #159 (Error Messages)

## Technical Approach

### Translation Strategy

1. **Create new translation namespace:** `qualified-teams.json` for qualified teams-specific strings
2. **Use next-intl pattern:**
   - Client Components: `useTranslations('qualified-teams')` + `t('key')`
   - Server Components: `await getTranslations('qualified-teams')` + `t('key')` (for redirect URL)
   - **Dynamic values:** Use interpolation: `t('group.header', { letter: 'A' })` → "GRUPO A" (ES) / "GROUP A" (EN)
3. **EnOf marker pattern:**
   - All hardcoded strings are in Spanish (original language)
   - **ES file:** Clean Spanish text (the source)
   - **EN file:** `EnOf(Spanish text)` to mark "needs English translation"
4. **Position suffix handling:**
   - Spanish: "1°", "2°", "3°", "4°" (ordinal indicator)
   - English: "1st", "2nd", "3rd", "4th"
   - Create helper function that uses `t()` to get correct suffix

### String Interpolation Examples

**Translation file format:**
```json
// es/qualified-teams.json (source)
{
  "group": {
    "header": "GRUPO {letter}",
    "points": "{count, plural, =1 {punto} other {puntos}}"
  }
}

// en/qualified-teams.json (to be translated)
{
  "group": {
    "header": "EnOf(GRUPO {letter})",
    "points": "EnOf({count, plural, =1 {punto} other {puntos}})"
  }
}
```

**Component usage:**
```typescript
// Dynamic group letter
const label = t('group.header', { letter: group.letter.toUpperCase() })
// Result in ES: "GRUPO A"
// Result in EN: "EnOf(GRUPO A)" (until translated to "GROUP A")

// Plural handling
const pointsText = t('group.points', { count: totalPoints })
// count = 1: "punto" (ES) / "point" (EN)
// count = 2: "puntos" (ES) / "points" (EN)
```

### Translation File Structure

**New file: `/locales/es/qualified-teams.json`** (Spanish - source language)
```json
{
  "page": {
    "title": "Prediccion de Clasificados",
    "lockedAlert": "Las predicciones están bloqueadas para este torneo. Puedes ver tus predicciones pero no puedes hacer cambios.",
    "savedSuccess": "Predicciones guardadas exitosamente",
    "saveError": "Error al guardar las predicciones"
  },
  "instructions": {
    "title": "Cómo hacer predicciones:",
    "dragTeams": "Arrastra los equipos para cambiar su posición en el grupo",
    "autoQualify": "Los equipos en posiciones 1-2 clasifican automáticamente",
    "thirdPlace": "Para el 3er puesto: usa el checkbox \"Clasifica\" para seleccionar qué equipos predices que clasificarán",
    "autoSave": "Tus cambios se guardan automáticamente."
  },
  "group": {
    "header": "GRUPO {letter}",
    "points": "{count, plural, =1 {punto} other {puntos}}",
    "pointsAbbrev": "{count, plural, =1 {pt} other {pts}}",
    "selected": "{count} seleccionado{count, plural, =1 {} other {s}}"
  },
  "position": {
    "first": "1°",
    "second": "2°",
    "third": "3°",
    "fourth": "4°",
    "label": "Clasifica"
  },
  "results": {
    "pending": "Pendiente",
    "waitingGroup": "Esperando resultados del grupo",
    "waitingAll": "Esperando todos los grupos",
    "waitingBestThirds": "Esperando mejores terceros",
    "points1": "+1 pt",
    "points2": "+2 pts",
    "points0": "+0 pts",
    "predictedVsActual": "Predicho {predicted}, terminó {actual}",
    "didNotQualify": "Predicho {predicted}, no calificó"
  },
  "thirdPlace": {
    "title": "Clasificados en Tercer Lugar",
    "overLimit": "Has seleccionado {selected} equipos, pero solo {max} pueden clasificar. Deselecciona {excess} equipo{excess, plural, =1 {} other {s}}.",
    "noSelection": "Aún no has seleccionado equipos de tercer lugar. Selecciona equipos desde la posición 3 en cada grupo para predecir cuáles clasificarán.",
    "progress": "{count} / {max}"
  }
}
```

**New file: `/locales/en/qualified-teams.json`** (English - needs translation)
```json
{
  "page": {
    "title": "EnOf(Prediccion de Clasificados)",
    "lockedAlert": "EnOf(Las predicciones están bloqueadas para este torneo. Puedes ver tus predicciones pero no puedes hacer cambios.)",
    "savedSuccess": "EnOf(Predicciones guardadas exitosamente)",
    "saveError": "EnOf(Error al guardar las predicciones)"
  },
  "instructions": {
    "title": "EnOf(Cómo hacer predicciones:)",
    "dragTeams": "EnOf(Arrastra los equipos para cambiar su posición en el grupo)",
    "autoQualify": "EnOf(Los equipos en posiciones 1-2 clasifican automáticamente)",
    "thirdPlace": "EnOf(Para el 3er puesto: usa el checkbox \"Clasifica\" para seleccionar qué equipos predices que clasificarán)",
    "autoSave": "EnOf(Tus cambios se guardan automáticamente.)"
  },
  "group": {
    "header": "EnOf(GRUPO {letter})",
    "points": "EnOf({count, plural, =1 {punto} other {puntos}})",
    "pointsAbbrev": "EnOf({count, plural, =1 {pt} other {pts}})",
    "selected": "EnOf({count} seleccionado{count, plural, =1 {} other {s}})"
  },
  "position": {
    "first": "EnOf(1°)",
    "second": "EnOf(2°)",
    "third": "EnOf(3°)",
    "fourth": "EnOf(4°)",
    "label": "EnOf(Clasifica)"
  },
  "results": {
    "pending": "EnOf(Pendiente)",
    "waitingGroup": "EnOf(Esperando resultados del grupo)",
    "waitingAll": "EnOf(Esperando todos los grupos)",
    "waitingBestThirds": "EnOf(Esperando mejores terceros)",
    "points1": "EnOf(+1 pt)",
    "points2": "EnOf(+2 pts)",
    "points0": "EnOf(+0 pts)",
    "predictedVsActual": "EnOf(Predicho {predicted}, terminó {actual})",
    "didNotQualify": "EnOf(Predicho {predicted}, no calificó)"
  },
  "thirdPlace": {
    "title": "EnOf(Clasificados en Tercer Lugar)",
    "overLimit": "EnOf(Has seleccionado {selected} equipos, pero solo {max} pueden clasificar. Deselecciona {excess} equipo{excess, plural, =1 {} other {s}}.)",
    "noSelection": "EnOf(Aún no has seleccionado equipos de tercer lugar. Selecciona equipos desde la posición 3 en cada grupo para predecir cuáles clasificarán.)",
    "progress": "EnOf({count} / {max})"
  }
}
```

## Files to Create/Modify

### Translation Files (New)
1. `/locales/es/qualified-teams.json` - Spanish translations (source language, clean text)
2. `/locales/en/qualified-teams.json` - English placeholders (with EnOf markers until translated)
3. `/types/i18n.ts` - Add `qualified-teams` namespace to type definitions

### Server Components (1 file)
4. `/app/[locale]/tournaments/[id]/qualified-teams/page.tsx`
   - Import `getTranslations` from next-intl/server
   - Replace hardcoded `/es/` in redirect URL with dynamic locale from params
   - Use `await getTranslations()` pattern if needed for error messages

### Client Components (4 files)

5. `/app/components/qualified-teams/qualified-teams-client-page.tsx`
   - Add `useTranslations('qualified-teams')`
   - Replace: "Prediccion de Clasificados", "Cómo hacer predicciones:", all instruction text, info popover content
   - Replace: "Las predicciones están bloqueadas...", "Predicciones guardadas exitosamente", "Error al guardar las predicciones"

6. `/app/components/qualified-teams/group-card.tsx`
   - Add `useTranslations('qualified-teams')`
   - Replace: "GRUPO {letter}", "punto"/"puntos", "pt"/"pts", "seleccionado"/"seleccionados"
   - Use plural forms for dynamic text

7. `/app/components/qualified-teams/draggable-team-card.tsx`
   - Add `useTranslations('qualified-teams')`
   - Replace `getPositionSuffix()` function to use translations (1st, 2nd, 3rd, 4th for EN / 1°, 2°, 3°, 4° for ES)
   - Replace `getPositionSuffixSpanish()` with generic translation-based approach
   - Replace: "Clasifica" checkbox label
   - Replace all results overlay text: "Pendiente", "Esperando...", "+X pts", "Predicho...", "no calificó"

8. `/app/components/qualified-teams/third-place-summary.tsx`
   - Add `useTranslations('qualified-teams')`
   - Replace: "Clasificados en Tercer Lugar", over-limit alert text, no-selection alert text
   - Use plural forms for dynamic counts

### Test Files (5 test files)

9. `__tests__/components/qualified-teams/qualified-teams-client-page.test.tsx` - Update existing test for i18n
10. `__tests__/components/qualified-teams/group-card.test.tsx` - Update existing test for i18n
11. `__tests__/components/qualified-teams/draggable-team-card.test.tsx` - Update existing test for i18n
12. `__tests__/components/qualified-teams/third-place-summary.test.tsx` - Update existing test for i18n
13. `__tests__/app/[locale]/tournaments/[id]/qualified-teams/page.test.tsx` - Create new server component i18n test

**Total: 5 test files** (4 updates + 1 new)

## Implementation Steps

### Phase 1: Translation Files (Create foundation)
1. Create `/locales/es/qualified-teams.json` with clean Spanish text (source language)
2. Create `/locales/en/qualified-teams.json` with `EnOf(Spanish text)` markers (to be translated later)
3. Update `/types/i18n.ts` to import and include `qualified-teams` namespace
4. **Validate translation key parity:** Run validation script to ensure EN and ES have matching keys

**Key Parity Validation:**
```bash
# Compare keys in both files
diff <(jq -r 'paths(scalars) | join(".")' locales/en/qualified-teams.json | sort) \
     <(jq -r 'paths(scalars) | join(".")' locales/es/qualified-teams.json | sort)
# Should output nothing (no differences)
```

### Phase 2: Server Component (1 file)
5. Update `/app/[locale]/tournaments/[id]/qualified-teams/page.tsx`:
   - Extract `locale` from params
   - Replace hardcoded `/es/auth/login?redirect=/es/tournaments/${tournamentId}/qualified-teams` with dynamic locale
   - Update to: `/${locale}/auth/login?redirect=/${locale}/tournaments/${tournamentId}/qualified-teams`

### Phase 3: Main Client Page Component (1 file)
6. Update `/app/components/qualified-teams/qualified-teams-client-page.tsx`:
   - Import `useTranslations` from 'next-intl'
   - Add `const t = useTranslations('qualified-teams')` at top of QualifiedTeamsUI component

   **Replace page title and info popover:**
   - Line 255: "Prediccion de Clasificados" → `t('page.title')`
   - Line 278: "Cómo hacer predicciones:" → `t('instructions.title')`
   - Line 281: "• Arrastra los equipos para cambiar su posición en el grupo" → `• {t('instructions.dragTeams')}`
   - Line 284: "• Los equipos en posiciones 1-2 clasifican automáticamente" → `• {t('instructions.autoQualify')}`
   - Line 288: "• Para el 3er puesto: usa el checkbox..." → `• {t('instructions.thirdPlace')}`
   - Line 292: "Tus cambios se guardan automáticamente." → `{t('instructions.autoSave')}`

   **Replace alerts and snackbars:**
   - Line 299: "Las predicciones están bloqueadas..." → `{t('page.lockedAlert')}`
   - Line 333: "Predicciones guardadas exitosamente" → `{t('page.savedSuccess')}`
   - Line 344 (error message fallback): `{error || 'Error al guardar las predicciones'}` → `{error || t('page.saveError')}`

   **Note:** Line numbers are approximate and should be verified during implementation. The info popover has 5 separate instruction text blocks that must all be replaced.

### Phase 4: Group Card Component (1 file)
7. Update `/app/components/qualified-teams/group-card.tsx`:
   - Import `useTranslations` from 'next-intl'
   - Add `const t = useTranslations('qualified-teams')`
   - Replace line 63: `GRUPO {groupLetter.toUpperCase()}` → `t('group.header', { letter: groupLetter.toUpperCase() })`
   - Replace line 71: Dynamic "punto"/"puntos" → `t('group.points', { count: groupTotalPoints })`
   - Replace line 236: "GRUPO" → `t('group.header', { letter: group.group_letter.toUpperCase() })`
   - Replace line 236: "seleccionado"/"seleccionados" → `t('group.selected', { count: qualifiedCount })`
   - Replace line 244: "pt"/"pts" → `t('group.pointsAbbrev', { count: groupTotalPoints })`

### Phase 5: Draggable Team Card Component (1 file)
8. Update `/app/components/qualified-teams/draggable-team-card.tsx`:
   - Import `useTranslations` from 'next-intl'
   - Add `const t = useTranslations('qualified-teams')` in component (at top of component function)

   **Position suffix helper function refactoring:**
   - Replace `getPositionSuffix()` function (currently lines 38-43):
     ```typescript
     // OLD (English-only):
     function getPositionSuffix(pos: number): string {
       if (pos === 1) return 'st';
       if (pos === 2) return 'nd';
       if (pos === 3) return 'rd';
       return 'th';
     }

     // NEW (i18n with translation):
     function getPositionSuffix(pos: number, t: any): string {
       if (pos === 1) return t('position.first');
       if (pos === 2) return t('position.second');
       if (pos === 3) return t('position.third');
       return t('position.fourth');
     }
     ```

   - Replace `getPositionSuffixSpanish()` function (currently lines 242-245):
     ```typescript
     // OLD (Spanish-only):
     function getPositionSuffixSpanish(pos: number | null): string {
       if (pos === null) return '';
       return `${pos}°`;
     }

     // NEW (i18n with translation):
     function getPositionDisplay(pos: number | null, t: any): string {
       if (pos === null) return '';
       if (pos === 1) return t('position.first');
       if (pos === 2) return t('position.second');
       if (pos === 3) return t('position.third');
       return t('position.fourth');
     }
     ```

   - **Update all calls to these functions:**
     - `getPositionSuffix(position)` in PositionBadge → `getPositionSuffix(position, t)`
     - `getPositionSuffixSpanish(result.predictedPosition)` in ResultsOverlay → `getPositionDisplay(result.predictedPosition, t)`
     - `getPositionSuffixSpanish(result.actualPosition)` in ResultsOverlay → `getPositionDisplay(result.actualPosition, t)`

   - Replace line 233: "Clasifica" → `t('position.label')`

   - Replace ResultsOverlay component (lines 247-349):
     - Line 272: "Pendiente" (first occurrence) → `t('results.pending')`
     - Line 279: "Esperando resultados del grupo" → `t('results.waitingGroup')`
     - Line 281: "Esperando todos los grupos" → `t('results.waitingAll')`
     - Line 286: "Pendiente" (second occurrence) → `t('results.pending')`
     - Line 290: "Esperando mejores terceros" → `t('results.waitingBestThirds')`
     - Line 294: "+1 pt" / "+2 pts" (dynamic) → `t('results.points1')` / `t('results.points2')`
     - Line 306: "+0 pts" → `t('results.points0')`
     - Line 302: "Predicho {predictedPos}, terminó {actualPos}" → `t('results.predictedVsActual', { predicted: predictedPos, actual: actualPos })`
     - Line 313: "Predicho {predictedPos}, no calificó" → `t('results.didNotQualify', { predicted: predictedPos })`

   **Note:** The position display functions (`getPositionDisplay`) must be called with the translation function `t` as a parameter, since they need access to the current locale's translations.

### Phase 6: Third Place Summary Component (1 file)
9. Update `/app/components/qualified-teams/third-place-summary.tsx`:
   - Import `useTranslations` from 'next-intl'
   - Add `const t = useTranslations('qualified-teams')`
   - Replace line 113: "Clasificados en Tercer Lugar" → `t('thirdPlace.title')`
   - Replace lines 121-122: Over-limit alert → `t('thirdPlace.overLimit', { selected: count, max: maxThirdPlace, excess: count - maxThirdPlace })`
   - Replace lines 129-130: No-selection alert → `t('thirdPlace.noSelection')`

### Phase 7: Testing (Create comprehensive test coverage)
10. Update/create i18n tests for 5 components (4 updates + 1 new)
11. Test both English and Spanish translations
12. Test dynamic interpolation (group letters, counts, plural forms)
13. Test position suffixes in both languages
14. Test results overlay states (pending, success, error)
15. Ensure 80% coverage threshold met

**Testing pattern:**
```typescript
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import Component from './component'

describe('Component i18n', () => {
  it('should display English translations', () => {
    const messages = {
      'qualified-teams': {
        page: { title: 'Qualified Teams Prediction' },
        group: { header: 'GROUP {letter}' }
      }
    }

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Component group={{ group_letter: 'a' }} {...otherProps} />
      </NextIntlClientProvider>
    )

    expect(screen.getByText('Qualified Teams Prediction')).toBeInTheDocument()
    expect(screen.getByText('GROUP A')).toBeInTheDocument() // Test interpolation
  })

  it('should display Spanish translations', () => {
    const messages = {
      'qualified-teams': {
        page: { title: 'Prediccion de Clasificados' },
        group: { header: 'GRUPO {letter}' }
      }
    }

    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <Component group={{ group_letter: 'a' }} {...otherProps} />
      </NextIntlClientProvider>
    )

    expect(screen.getByText('Prediccion de Clasificados')).toBeInTheDocument()
    expect(screen.getByText('GRUPO A')).toBeInTheDocument()
  })

  it('should handle plural forms correctly', () => {
    const messages = {
      'qualified-teams': {
        group: { points: '{count, plural, =1 {point} other {points}}' }
      }
    }

    const { rerender } = render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Component totalPoints={1} />
      </NextIntlClientProvider>
    )
    expect(screen.getByText(/1 point/)).toBeInTheDocument()

    rerender(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Component totalPoints={5} />
      </NextIntlClientProvider>
    )
    expect(screen.getByText(/5 points/)).toBeInTheDocument()
  })
})
```

**Note:** Using `NextIntlClientProvider` directly (not `renderWithTheme`) because the project's test utilities don't currently support i18n context. This matches the pattern from story #178.

## Testing Strategy

### Unit Tests Required (80% coverage target)
1. **Translation files validation:**
   - Verify JSON structure is valid
   - **Key parity validation:** Automated check that EN and ES have identical key structure
   - Validate EnOf markers in English

2. **Component i18n tests (all 5 components):**
   - Test each component renders with English translations
   - Test each component renders with Spanish translations
   - Test dynamic interpolation (group letters, counts, plural forms)
   - Test position suffixes in both languages (1st/2nd/3rd/4th vs 1°/2°/3°/4°)
   - Test results overlay with all states (pending, success, error)

3. **Integration tests:**
   - Test qualified teams page with both locales (server component)
   - Test drag-and-drop with translated UI
   - Test third place selection with translated alerts
   - Test position suffix functions with translation parameter

### Manual Testing Checklist
- [ ] Switch language to English → verify all text is in English
- [ ] Switch language to Spanish → verify all text is in Spanish
- [ ] Test info popover displays translated instructions
- [ ] Test locked alert displays correct translated message
- [ ] Test success/error snackbars show translated messages
- [ ] Test group headers show translated "GROUP X" / "GRUPO X"
- [ ] Test position suffixes show correct format (1st/2nd/3rd/4th vs 1°/2°/3°/4°)
- [ ] Test "Clasifica" checkbox label is translated
- [ ] Test results overlay shows translated states
- [ ] Test third place summary shows translated title and alerts
- [ ] Test plural forms work correctly (1 punto vs 5 puntos, etc.)

## Validation Considerations

### Pre-Commit Validation
1. Run `npm test` → all tests pass (including new i18n tests)
2. Run `npm run lint` → no linting errors
3. Run `npm run build` → build succeeds without errors

### SonarCloud Requirements
- **Code coverage:** ≥80% on new/modified code
- **New issues:** 0 (any severity)
- **Security rating:** A
- **Maintainability:** B or higher
- **Duplicated code:** <5%

### Deployment Validation
- Deploy to Vercel Preview
- Test language switching in preview environment
- Verify all pages render correctly in both languages
- Check for console errors or warnings
- Test drag-and-drop functionality still works
- Test third place selection with limit validation

## Clarifications from Plan Review (Cycle 1)

1. **✅ Position suffix handling:** Resolved - Using separate translation keys (`position.first`, `position.second`, etc.) for 1st-4th positions, mapped in both Spanish (1°, 2°, 3°, 4°) and English (1st, 2nd, 3rd, 4th)
2. **✅ Helper function refactoring:** Both `getPositionSuffix()` and `getPositionSuffixSpanish()` will accept `t` parameter and use translation keys
3. **✅ Info popover mapping:** Explicit line-by-line mapping provided in Phase 3 implementation steps
4. **✅ Error message handling:** Fallback pattern `{error || t('page.saveError')}` preserves dynamic error while providing translated default
5. **✅ Line number references:** All line numbers are approximate - must be verified during implementation
6. **✅ Test utilities:** Using `NextIntlClientProvider` pattern from story #178 - no updates to test utilities since then
7. **✅ Translation file consistency:** Using static keys for results points (+1 pt, +2 pts, +0 pts) since these are fixed values, not dynamic counts

## Open Questions
None at this time.

## Notes
- Follow exact pattern from story #178 (Tables & Groups i18n)
- Use next-intl's plural forms for "punto/puntos", "pt/pts", "seleccionado/seleccionados"
- Position suffixes need special handling (different formats in EN vs ES)
- Results overlay has many states - ensure all are translated
- Test with both languages in development before creating PR

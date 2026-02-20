# Implementation Plan: Story #178 - [i18n] Translate Tables & Groups Pages

## Context

This story is part of the ongoing internationalization effort to make the application fully bilingual (English/Spanish). The Tables & Groups pages currently contain hardcoded Spanish text that needs to be extracted into translation files and replaced with next-intl translation calls.

**Story Details:**
- **Issue #178:** [i18n] Translate Tables & Groups Pages
- **Priority:** Medium
- **Effort:** Medium (4-6 hours)
- **Labels:** i18n

**What needs translation:**
- **Tables page** (`/tournaments/[id]/results`) - Results and standings page with Groups/Playoffs tabs
- **Groups components** - Tournament group standings cards within results page
- **Sidebar component** - Group standings sidebar
- **Team standings** - Cards and detailed stats used in results page

**Out of scope:**
- Tournament layout navigation (group-selector.tsx)
- Friend groups pages (group-table.tsx)

**Why this matters:**
- Essential for bilingual user experience
- Part of larger i18n initiative (milestone)
- Follows successful pattern from stories #154, #155, #156, #159, #179

## Technical Approach

### Translation Strategy

1. **Create new translation namespace:** `tables.json` for tables/results-specific strings
2. **No updates needed to navigation.json:** Bottom nav already uses translated keys (`t('bottomNav.results')`, `t('bottomNav.groups')`)
3. **Use next-intl pattern:**
   - Client Components: `useTranslations('tables')` + `t('key')`
   - Server Components: `await getTranslations('tables')` + `t('key')`
   - **Dynamic values:** Use interpolation: `t('groups.groupLabel', { letter: 'A' })` → "GRUPO A" (ES) / "GROUP A" (EN)
4. **EnOf marker pattern:**
   - All hardcoded strings are in Spanish (original language)
   - **ES file:** Clean Spanish text (the source)
   - **EN file:** `EnOf(Spanish text)` to mark "needs English translation"

### String Interpolation Examples

**Translation file format:**
```json
// es/tables.json (source)
{
  "groups": {
    "groupLabel": "GRUPO {letter}"
  }
}

// en/tables.json (to be translated)
{
  "groups": {
    "groupLabel": "EnOf(GRUPO {letter})"
  }
}
```

**Component usage:**
```typescript
// Dynamic group letter
const label = t('groups.groupLabel', { letter: group.letter.toUpperCase() })
// Result in ES: "GRUPO A"
// Result in EN: "EnOf(GRUPO A)" (until translated to "GROUP A")
```

**For point display:**
```typescript
const gdFormatted = standing.goalDifference >= 0 ? `+${standing.goalDifference}` : standing.goalDifference
const pointsText = t('stats.pointsDisplay', {
  points: standing.points,
  gamesPlayed: standing.gamesPlayed,
  goalDifference: gdFormatted
})
// Result in ES: "15 pts (3 PJ, +5 DG)"
// Result in EN: "EnOf(15 pts (3 PJ, +5 DG))" (until translated)
```

### Translation File Structure

**New file: `/locales/es/tables.json`** (Spanish - source language)
```json
{
  "results": {
    "title": "Resultados y Tablas",
    "unavailable": "Resultados no disponibles",
    "unavailableDescription": "Los resultados se mostrarán aquí cuando los partidos comiencen",
    "error": "Error al cargar resultados",
    "errorDescription": "Por favor, intenta nuevamente más tarde"
  },
  "tabs": {
    "groups": "Grupos",
    "playoffs": "Playoffs"
  },
  "groups": {
    "title": "Grupos",
    "groupLabel": "GRUPO {letter}",
    "statusHere": "Estás aquí",
    "noGroups": "No hay grupos configurados",
    "noGroupsDescription": "Los grupos se mostrarán aquí cuando estén disponibles",
    "viewResults": "Ver Resultados"
  },
  "standings": {
    "title": "Tabla de Posiciones",
    "noStandings": "No hay posiciones disponibles todavía",
    "games": "Partidos:",
    "table": "Tabla de Posiciones:"
  },
  "stats": {
    "detailedStats": "Estadísticas Detalladas",
    "gamesPlayed": "Partidos Jugados",
    "gamesPlayedShort": "PJ",
    "goalDifference": "Diferencia de Gol",
    "goalDifferenceShort": "DG",
    "pointsDisplay": "{points} pts ({gamesPlayed} PJ, {goalDifference} DG)",
    "pointsCompact": "{points} pts",
    "record": "Récord",
    "wins": "Ganados",
    "draws": "Empatados",
    "losses": "Perdidos",
    "goals": "Goles",
    "goalsFor": "Goles a Favor",
    "goalsAgainst": "Goles en Contra",
    "conductScore": "Puntos de Conducta",
    "points": "pts"
  },
  "aria": {
    "previousGroup": "Grupo anterior",
    "nextGroup": "Siguiente grupo",
    "tournamentNavigation": "Navegación del torneo",
    "expandMore": "mostrar más"
  },
  "navigation": {
    "games": "PARTIDOS",
    "qualified": "CLASIFICADOS",
    "awards": "PREMIOS",
    "expandMore": "mostrar más"
  }
}
```

**New file: `/locales/en/tables.json`** (English - needs translation)
```json
{
  "results": {
    "title": "EnOf(Resultados y Tablas)",
    "unavailable": "EnOf(Resultados no disponibles)",
    "unavailableDescription": "EnOf(Los resultados se mostrarán aquí cuando los partidos comiencen)",
    "error": "EnOf(Error al cargar resultados)",
    "errorDescription": "EnOf(Por favor, intenta nuevamente más tarde)"
  },
  "tabs": {
    "groups": "EnOf(Grupos)",
    "playoffs": "EnOf(Playoffs)"
  },
  "groups": {
    "title": "EnOf(Grupos)",
    "groupLabel": "EnOf(GRUPO {letter})",
    "statusHere": "EnOf(Estás aquí)",
    "noGroups": "EnOf(No hay grupos configurados)",
    "noGroupsDescription": "EnOf(Los grupos se mostrarán aquí cuando estén disponibles)",
    "viewResults": "EnOf(Ver Resultados)"
  },
  "standings": {
    "title": "EnOf(Tabla de Posiciones)",
    "noStandings": "EnOf(No hay posiciones disponibles todavía)",
    "games": "EnOf(Partidos:)",
    "table": "EnOf(Tabla de Posiciones:)"
  },
  "stats": {
    "detailedStats": "EnOf(Estadísticas Detalladas)",
    "gamesPlayed": "EnOf(Partidos Jugados)",
    "gamesPlayedShort": "EnOf(PJ)",
    "goalDifference": "EnOf(Diferencia de Gol)",
    "goalDifferenceShort": "EnOf(DG)",
    "pointsDisplay": "EnOf({points} pts ({gamesPlayed} PJ, {goalDifference} DG))",
    "pointsCompact": "EnOf({points} pts)",
    "record": "EnOf(Récord)",
    "wins": "EnOf(Ganados)",
    "draws": "EnOf(Empatados)",
    "losses": "EnOf(Perdidos)",
    "goals": "EnOf(Goles)",
    "goalsFor": "EnOf(Goles a Favor)",
    "goalsAgainst": "EnOf(Goles en Contra)",
    "conductScore": "EnOf(Puntos de Conducta)",
    "points": "EnOf(pts)"
  },
  "aria": {
    "previousGroup": "EnOf(Grupo anterior)",
    "nextGroup": "EnOf(Siguiente grupo)",
    "tournamentNavigation": "EnOf(Navegación del torneo)",
    "expandMore": "EnOf(mostrar más)"
  },
  "navigation": {
    "games": "EnOf(PARTIDOS)",
    "qualified": "EnOf(CLASIFICADOS)",
    "awards": "EnOf(PREMIOS)",
    "expandMore": "EnOf(mostrar más)"
  }
}
```

**Note:** `navigation.json` already contains all necessary bottom nav translations. No updates needed.

## Files to Create/Modify

### Translation Files (New)
1. `/locales/es/tables.json` - Spanish translations (source language, clean text)
2. `/locales/en/tables.json` - English placeholders (with EnOf markers until translated)

**Note:** No updates to navigation.json needed - bottom nav already fully translated.

### Server Components (1 file)
3. `/app/[locale]/tournaments/[id]/results/page.tsx`
   - Import `getTranslations` from next-intl/server
   - Replace: "Resultados no disponibles", "Los resultados se mostrarán aquí cuando los partidos comiencen", "Resultados y Tablas", "Error al cargar resultados", "Por favor, intenta nuevamente más tarde"
   - Use `await getTranslations('tables')` pattern

### Client Components (6 files)

4. `/app/components/results-page/results-page-client.tsx`
   - Add `useTranslations('tables')`
   - Replace tab labels: "Grupos" → `t('tabs.groups')`, "Playoffs" → `t('tabs.playoffs')`

5. `/app/components/results-page/groups-stage-view.tsx`
   - Add `useTranslations('tables')`
   - Replace: "No hay grupos configurados", "Los grupos se mostrarán aquí cuando estén disponibles"

6. `/app/components/results-page/group-result-card.tsx`
   - Add `useTranslations('tables')`
   - Replace: "GRUPO {letter}", "Partidos:", "Tabla de Posiciones:", "mostrar más"

7. `/app/components/groups-page/team-standings-cards.tsx`
   - Add `useTranslations('tables')`
   - Replace: "No hay posiciones disponibles todavía."
   - **Note:** Used in `group-result-card.tsx` (results page component tree)

8. `/app/components/groups-page/team-standing-card.tsx`
   - Add `useTranslations('tables')`
   - Update helper functions to accept `t` parameter (see detailed refactoring below)
   - Replace all Spanish stats labels
   - **Note:** Used in `team-standings-cards.tsx` (results page component tree)

9. `/app/components/tournament-page/group-standings-sidebar.tsx`
   - Add `useTranslations('tables')`
   - Replace: "Grupos", "Estás aquí", "GRUPO {letter}", "Ver Resultados"

### Helper Function Refactoring (team-standing-card.tsx)

**Scope:** Three pure helper functions need to accept `t` parameter for i18n:

1. **`getPointsDisplayText()` (lines 46-59)** - Currently uses hardcoded "pts", "PJ", "DG"
   - Before: `return "${points} pts (${gamesPlayed} PJ, ${gdSign}${goalDifference} DG)"`
   - After: `return t('stats.pointsDisplay', { points, gamesPlayed, goalDifference: gdSign + goalDifference })`
   - **Impact:** Only used within this component, no external dependencies

2. **`getAriaLabel()` (lines 35-44)** - Uses "Expanded", "Collapsed", "Press Enter or Space..."
   - Add aria translation keys for accessibility
   - **Impact:** Only used within this component

3. **Expanded details section (lines 191-243)** - Multiple hardcoded Spanish labels
   - "Estadísticas Detalladas", "Partidos Jugados", "Récord", "Ganados", etc.
   - Replace with `t('stats.detailedStats')`, `t('stats.gamesPlayed')`, etc.
   - **Impact:** All within same component, no ripple effects

**Key point:** All three helpers are internal to `team-standing-card.tsx`. No external consumers to update.

### Aria-Label Audit

**Components with aria-labels requiring translation:**

1. **group-result-card.tsx (line 95):** `aria-label="mostrar más"` → `aria-label={t('aria.expandMore')}`
2. **group-standings-sidebar.tsx (lines 176, 203):** "Previous group", "Next group" → `t('aria.previousGroup')`, `t('aria.nextGroup')`
3. **group-selector.tsx (line 52):** `aria-label="Navegación del torneo"` → `aria-label={t('aria.tournamentNavigation')}`
4. **results-page-client.tsx (line 50):** `aria-label="results tabs"` → Already in English, consider `t('aria.resultsTabs')`

**All aria-labels explicitly listed for i18n coverage.**

### Test Files (7 test files)

10. `__tests__/components/results-page/results-page-client.test.tsx` - i18n test
11. `__tests__/components/results-page/groups-stage-view.test.tsx` - i18n test
12. `__tests__/components/results-page/group-result-card.test.tsx` - i18n test
13. `__tests__/components/groups-page/team-standings-cards.test.tsx` - i18n test
14. `__tests__/components/groups-page/team-standing-card.test.tsx` - i18n test (including helper functions)
15. `__tests__/components/tournament-page/group-standings-sidebar.test.tsx` - Update existing test for i18n
16. `__tests__/app/[locale]/tournaments/[id]/results/page.test.tsx` - Server component i18n test

**Total: 7 test files** (6 new + 1 update)

## Implementation Steps

### Phase 1: Translation Files (Create foundation)
1. Create `/locales/es/tables.json` with clean Spanish text (source language)
2. Create `/locales/en/tables.json` with `EnOf(Spanish text)` markers (to be translated later)
3. **Validate translation key parity:** Run validation script to ensure EN and ES have matching keys

**Key Parity Validation:**
```bash
# Compare keys in both files
diff <(jq -r 'paths(scalars) | join(".")' locales/en/tables.json | sort) \
     <(jq -r 'paths(scalars) | join(".")' locales/es/tables.json | sort)
# Should output nothing (no differences)
```

### Phase 2: Server Components (1 file)
4. Update `/app/[locale]/tournaments/[id]/results/page.tsx`:
   - Import `getTranslations` from 'next-intl/server'
   - Add `const t = await getTranslations('tables')` at top of component
   - Replace all hardcoded strings with `t('results.title')`, `t('results.unavailable')`, etc.

### Phase 3: Results Page Client Components (3 files)
5. Update `/app/components/results-page/results-page-client.tsx`:
   - Import `useTranslations` from 'next-intl'
   - Add `const t = useTranslations('tables')`
   - Replace tab labels: line 55 "Grupos" → `t('tabs.groups')`, line 62 "Playoffs" → `t('tabs.playoffs')`

6. Update `/app/components/results-page/groups-stage-view.tsx`:
   - Add `'use client'` directive if not present
   - Import `useTranslations` from 'next-intl'
   - Add `const t = useTranslations('tables')`
   - Replace lines 33, 36 with translated strings

7. Update `/app/components/results-page/group-result-card.tsx`:
   - Import `useTranslations` from 'next-intl'
   - Add `const t = useTranslations('tables')`
   - Replace lines 55, 63, 78, 95 with translated strings

### Phase 4: Team Standings Components (2 files)
8. Update `/app/components/groups-page/team-standings-cards.tsx`:
   - Import `useTranslations` from 'next-intl'
   - Add `const t = useTranslations('tables')`
   - Replace line 77: "No hay posiciones disponibles todavía."

9. Update `/app/components/groups-page/team-standing-card.tsx`:
   - Import `useTranslations` from 'next-intl'
   - Add `const t = useTranslations('tables')`
   - Update helper functions to accept `t` parameter
   - Replace all hardcoded Spanish in lines 58, 197, 203, 209, 212, 215, 218, 225, 228, 231, 234, 240

### Phase 5: Sidebar Component (1 file)
10. Update `/app/components/tournament-page/group-standings-sidebar.tsx`:
    - Import `useTranslations` from 'next-intl'
    - Add `const t = useTranslations('tables')`
    - Replace lines 153, 157, 196, 232

### Phase 6: Testing (Create comprehensive test coverage)
11. Create i18n tests for 7 components (6 new + 1 update)
12. Test both English and Spanish translations
13. Test dynamic interpolation (group letters, point displays)
14. Test aria-labels in both languages
15. Test empty states, error states, and all UI text
16. Ensure 80% coverage threshold met

**Testing pattern:**
```typescript
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import Component from './component'

describe('Component i18n', () => {
  it('should display English translations', () => {
    const messages = {
      tables: {
        groups: { title: 'Groups', groupLabel: 'GROUP {letter}' }
      }
    }

    render(
      <NextIntlClientProvider locale="en" messages={messages}>
        <Component group={{ letter: 'A' }} {...otherProps} />
      </NextIntlClientProvider>
    )

    expect(screen.getByText('Groups')).toBeInTheDocument()
    expect(screen.getByText('GROUP A')).toBeInTheDocument() // Test interpolation
  })

  it('should display Spanish translations', () => {
    const messages = {
      tables: {
        groups: { title: 'Grupos', groupLabel: 'GRUPO {letter}' }
      }
    }

    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <Component group={{ letter: 'A' }} {...otherProps} />
      </NextIntlClientProvider>
    )

    expect(screen.getByText('Grupos')).toBeInTheDocument()
    expect(screen.getByText('GRUPO A')).toBeInTheDocument()
  })
})
```

**Note:** Using `NextIntlClientProvider` directly (not `renderWithTheme`) because the project's test utilities don't currently support i18n context. This matches the pattern from story #156.

## Testing Strategy

### Unit Tests Required (80% coverage target)
1. **Translation files validation:**
   - Verify JSON structure is valid
   - **Key parity validation:** Automated check that EN and ES have identical key structure
   - Validate EnOf markers in Spanish

2. **Component i18n tests (all 7 components):**
   - Test each component renders with English translations
   - Test each component renders with Spanish translations
   - Test dynamic interpolation (group letters: "GROUP {letter}" → "GROUP A")
   - Test point displays with interpolation (points, GP, GD)
   - Test aria-labels in both languages

3. **Integration tests:**
   - Test results page with both locales (server component)
   - Test group selector navigation with both locales
   - Test sidebar accordion with both locales
   - Test helper functions in team-standing-card.tsx with translation parameter

### Manual Testing Checklist
- [ ] Switch language to English → verify all text is in English
- [ ] Switch language to Spanish → verify all text is in Spanish
- [ ] Test empty states display correct translated messages
- [ ] Test error states display correct translated messages
- [ ] Test group navigation tabs show translated labels
- [ ] Test standings table shows translated column headers
- [ ] Test detailed stats expand to show translated labels
- [ ] Test sidebar accordion shows translated group labels

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

## Clarifications from Plan Review (Cycle 1)

1. **✅ Dynamic string interpolation:** Using `t('key', { param: value })` pattern from next-intl
2. **✅ Helper function scope:** Only 3 internal helpers in team-standing-card.tsx, no external dependencies
3. **✅ Test utilities:** Using NextIntlClientProvider directly (matches story #156 pattern)
4. **✅ Key parity validation:** Added explicit diff command to verify EN/ES key matching
5. **✅ Component count:** Corrected to 7 test files (6 new + 1 update) after removing out-of-scope components
6. **✅ Aria-labels:** Explicit audit added with all 4 components requiring translation
7. **✅ Navigation.json:** Confirmed already complete, no updates needed

## Open Questions
None. All concerns from plan review addressed.

## Notes
- Follow exact pattern from story #156 (Friend Groups i18n)
- Reuse existing `common.json` keys where appropriate (e.g., `common.buttons.save`)
- Ensure all aria-labels are also internationalized for accessibility
- Test with both languages in development before creating PR

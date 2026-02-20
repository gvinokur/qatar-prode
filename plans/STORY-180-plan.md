# Implementation Plan: Story #180 - Translate User Stats Pages

## Context

This story prepares the User Stats pages and related components for internationalization to support both Spanish and English locales. Following the project's established i18n pattern from Stories #155, #159, and others, this work focuses on preparing components for translation WITHOUT actually translating content.

**Why this change is needed:**
- Issue #180 requires: User stats page, Sidebar card for User Stats, Statistics display components, Performance metrics, Achievement displays
- User stats components currently have hardcoded Spanish text
- These components display tournament statistics and need i18n support
- Users in different locales need to see translated stats labels and descriptions

**User Requirements (CRITICAL):**
- **DO NOT fully translate anything** - only prepare for i18n
- **Validation:** No duplicate keys for same content across locale files
- **Validation:** Keys used in components MUST match keys in message files
- Follow the established placeholder pattern: `EnOf(Spanish text)` for English locale placeholders

**Current State:**
- Working from story worktree: `/Users/gvinokur/Personal/qatar-prode-story-180`
- Branch: `feature/story-180`
- No stats.json namespace exists yet - need to create it
- Previous i18n stories (#155, #159, etc.) established the pattern

## Pattern to Follow

### 1. Client Component Pattern
```typescript
import { useTranslations } from 'next-intl';

export function MyStatsComponent() {
  const t = useTranslations('stats'); // New stats namespace

  return (
    <Typography>{t('performance.title')}</Typography>
  );
}
```

### 2. Translation Placeholder Pattern (CRITICAL)

**All source text is in Spanish, so:**
- `locales/es/stats.json`: Keep Spanish text as-is
- `locales/en/stats.json`: Use `EnOf(Spanish text)` placeholder

**Example:**
```json
// Source code has: "Tus Estadísticas" (Spanish)

// locales/es/stats.json:
{
  "sidebar": {
    "title": "Tus Estadísticas"  // Keep Spanish as-is
  }
}

// locales/en/stats.json:
{
  "sidebar": {
    "title": "EnOf(Tus Estadísticas)"  // Placeholder - translation happens in separate story
  }
}
```

### 3. Translation Key Structure
- **Namespace:** Create new `stats` namespace for all statistics-related translations
- **Format:** `section.subsection.key` (e.g., `sidebar.title`, `performance.totalPoints`)
- **Organization:** Group by component/section for maintainability

## Scope

### ✅ In Scope

**1. User Tournament Statistics Sidebar Card (`app/components/tournament-page/user-tournament-statistics.tsx`)**
- Card title: "Tus Estadísticas"
- Subheader: "Estás aquí"
- Stat labels: "Grupos:", "Playoffs:", "Clasificados:", "Premios:", "Total:"
- Button text: "Ver Detalle"
- ARIA labels: "Estadísticas del usuario", "mostrar más", "Ver página de estadísticas detalladas"

**2. Performance Overview Card (`app/components/tournament-stats/performance-overview-card.tsx`)**
- Card title: "Rendimiento General"
- Empty state: "No hay predicciones aún. ¡Comienza a predecir para ver tus estadísticas!"
- Section labels:
  - "Puntos Totales en Torneo"
  - "Desglose por Fase"
  - "Fase de Grupos"
  - "Puntos por Partidos"
  - "Bonus por Boosts"
  - "Aciertos Clasificados (Exactos)"
  - "Puntos por Clasificados"
  - "Total Fase de Grupos"
  - "Fase de Playoffs"
  - "Predicciones Finales"
  - "Premios Individuales"
  - "Total Fase de Playoffs"

**3. Prediction Accuracy Card (`app/components/tournament-stats/prediction-accuracy-card.tsx`)**
- Card title: "Precisión de Predicciones"
- Empty state: "Haz tu primera predicción para ver estadísticas de precisión"
- Section labels:
  - "Predicciones Totales"
  - "Completado"
  - "Precisión General"
  - "Resultado Correcto"
  - "Marcador Exacto"
  - "Falladas"
  - "Por Fase"
  - "Fase de Grupos"
  - "Fase de Playoffs"

**4. Boost Analysis Card (`app/components/tournament-stats/boost-analysis-card.tsx`)**
- Card title: "Análisis de Boosts"
- Empty state: "¡Usa tus boosts para maximizar puntos!", "Disponibles: {silver} Silver, {golden} Golden"
- Section labels:
  - "Boosts Silver"
  - "Boosts Golden"
  - "Disponibles"
  - "Usados"
  - "Partidos Acertados"
  - "Puntos Ganados"
  - "ROI (Promedio por boost)"
  - "Distribución de Boosts"
- Dynamic text: "Grupo {letter} ({count})", "Playoffs ({count})", "Ninguno"

**5. Stats Tabs Component (`app/components/tournament-stats/stats-tabs.tsx`)**
- Tab labels: "Rendimiento", "Precisión", "Análisis de Boosts"
- ARIA label: "estadísticas del torneo"

### ❌ Out of Scope
- Stats page route (`app/[locale]/tournaments/[id]/stats/page.tsx`) - Server Component, no visible text to translate
- Tournament sidebar wrapper (`app/components/tournament-page/tournament-sidebar.tsx`) - No text specific to stats
- Helper functions and calculations - Business logic, no user-facing text
- Actual translation of Spanish text to English - Separate story

## Technical Approach

### 1. Create New Stats Namespace

**Files to create:**
- `/Users/gvinokur/Personal/qatar-prode-story-180/locales/en/stats.json`
- `/Users/gvinokur/Personal/qatar-prode-story-180/locales/es/stats.json`

**Structure:**
```json
{
  "sidebar": {
    "title": "...",
    "activeIndicator": "...",
    "labels": {
      "groups": "...",
      "playoffs": "...",
      "qualified": "...",
      "awards": "...",
      "total": "..."
    },
    "viewDetails": "...",
    "ariaLabels": {
      "card": "...",
      "expandButton": "...",
      "viewDetailsButton": "..."
    }
  },
  "performance": {
    "title": "...",
    "emptyState": "...",
    "totalPoints": "...",
    "breakdown": "...",
    "groupStage": {
      "title": "...",
      "gamePoints": "...",
      "boostBonus": "...",
      "qualifiedCorrect": "...",
      "qualifiedPoints": "...",
      "total": "..."
    },
    "playoffStage": {
      "title": "...",
      "gamePoints": "...",
      "boostBonus": "...",
      "finalPredictions": "...",
      "individualAwards": "...",
      "total": "..."
    }
  },
  "accuracy": {
    "title": "...",
    "emptyState": "...",
    "totalPredictions": "...",
    "completed": "...",
    "overallAccuracy": "...",
    "resultCorrect": "...",
    "exactScore": "...",
    "missed": "...",
    "byPhase": "...",
    "groupStage": "...",
    "playoffStage": "..."
  },
  "boosts": {
    "title": "...",
    "emptyState": {
      "message": "...",
      "available": "..."
    },
    "silver": "...",
    "golden": "...",
    "available": "...",
    "used": "...",
    "scoredGames": "...",
    "pointsEarned": "...",
    "roi": "...",
    "distribution": "...",
    "group": "...",
    "playoffs": "...",
    "none": "..."
  },
  "tabs": {
    "performance": "...",
    "accuracy": "...",
    "boosts": "...",
    "ariaLabel": "..."
  }
}
```

### 2. Update Type Definitions

**File:** `/Users/gvinokur/Personal/qatar-prode-story-180/types/i18n.ts`

Add stats namespace import and type:
```typescript
import stats from '@/locales/en/stats.json';

type Messages = {
  // ... existing namespaces
  stats: typeof stats;
};
```

### 3. Update Components

**For each component:**
1. Import `useTranslations` hook
2. Get translator: `const t = useTranslations('stats')`
3. Replace hardcoded Spanish strings with `t('key.path')`
4. Update ARIA labels with translated text
5. Handle dynamic text (interpolation) where needed

**Component update order:**
1. `user-tournament-statistics.tsx` (sidebar card)
2. `performance-overview-card.tsx`
3. `prediction-accuracy-card.tsx`
4. `boost-analysis-card.tsx`
5. `stats-tabs.tsx`

### 4. Dynamic Text Interpolation

For dynamic text like "Grupo A (2)", use next-intl interpolation:

```typescript
// Component code (boost-analysis-card.tsx):
const t = useTranslations('stats');

// Current code has:
const groupParts = boost.allocationByGroup
  .map(g => `Grupo ${g.groupLetter} (${g.count})`)
  .join(', ')

// Replace with:
const groupParts = boost.allocationByGroup
  .map(g => t('boosts.groupAllocation', { letter: g.groupLetter, count: g.count }))
  .join(', ')

// Translation files:
// locales/es/stats.json:
{
  "boosts": {
    "groupAllocation": "Grupo {letter} ({count})",
    "playoffsAllocation": "Playoffs ({count})"
  }
}

// locales/en/stats.json:
{
  "boosts": {
    "groupAllocation": "EnOf(Grupo {letter} ({count}))",
    "playoffsAllocation": "EnOf(Playoffs ({count}))"
  }
}
```

**Empty state with variables:**
```typescript
// Current: `Disponibles: ${props.silverBoost.available} Silver, ${props.goldenBoost.available} Golden`
// Replace with:
t('boosts.emptyState.available', {
  silver: props.silverBoost.available,
  golden: props.goldenBoost.available
})

// Translation:
{
  "boosts": {
    "emptyState": {
      "available": "Disponibles: {silver} Silver, {golden} Golden"
    }
  }
}
```

### 5. Percentage Formatting

Keep percentage formatting in code (e.g., `.toFixed(1)%`) - numbers don't need translation.

## Implementation Steps

### Step 0: Pre-Implementation Verification (MANDATORY)

**Before creating any files, verify assumptions:**

1. **Component existence and content:**
   - Read each of the 5 component files
   - Confirm they contain the Spanish strings listed in scope
   - Note any discrepancies between plan and actual code

2. **Type definition pattern:**
   - Read `types/i18n.ts` to see current structure
   - Verify how previous namespaces (common, navigation, etc.) are imported
   - Confirm the pattern for adding new namespace

3. **Test utilities availability:**
   - Review `app/components/tournament-bottom-nav/__tests__/tournament-bottom-nav-i18n.test.tsx` for i18n testing pattern
   - Note: `renderWithProviders` in test-utils only supports rules namespace currently
   - For stats tests, use `NextIntlClientProvider` directly (like tournament-bottom-nav pattern)
   - Create helper function `renderWithStats()` in test files for consistency

4. **Test directory structure:**
   - Verify actual test file locations
   - Confirm naming conventions for i18n test files
   - Check existing stats component tests

5. **Out-of-scope verification:**
   - Read stats page route to confirm no visible translatable text
   - Read tournament sidebar to confirm no stats-specific text

**If any verification fails:** Update plan with actual findings before proceeding.

### Step 1: Create Translation Files
1. Create `locales/es/stats.json` with all Spanish strings (verified from components)
2. Create `locales/en/stats.json` with `EnOf(...)` placeholders (matching es structure exactly)
3. Verify JSON is valid and keys match exactly between locales
4. Double-check all dynamic text has proper interpolation placeholders

### Step 2: Update Type Definitions
1. Add stats import to `types/i18n.ts`
2. Add stats to Messages type
3. Verify TypeScript compilation succeeds

### Step 3: Update Components (One at a time)
1. **UserTournamentStatistics:**
   - Import useTranslations
   - Replace all hardcoded strings
   - Update ARIA labels

2. **PerformanceOverviewCard:**
   - Import useTranslations
   - Replace title, labels, and empty state

3. **PredictionAccuracyCard:**
   - Import useTranslations
   - Replace title, labels, and empty state

4. **BoostAnalysisCard:**
   - Import useTranslations
   - Replace title, labels, empty state
   - Handle dynamic group allocation text

5. **StatsTabs:**
   - Import useTranslations
   - Replace tab labels and ARIA label

### Step 4: Update Tests

**Strategy:** Keep existing tests, add i18n-specific tests alongside them.

1. **Update existing component tests:**
   - `user-tournament-statistics.test.tsx`:
     - Keep existing tests that verify behavior (expand/collapse, calculations)
     - Update assertions that check for hardcoded Spanish text to work with translations
     - **Testing approach:** Follow the pattern from `tournament-bottom-nav-i18n.test.tsx`:
       - Create `NextIntlClientProvider` wrapper with stats messages
       - Import both `en/stats.json` and `es/stats.json` in test file
       - Wrap component in provider with appropriate locale and messages
     - Tests will still verify correct text renders, just through translation system

   **Example pattern:**
   ```typescript
   import { NextIntlClientProvider } from 'next-intl';
   import enStats from '@/locales/en/stats.json';
   import esStats from '@/locales/es/stats.json';

   const renderWithStats = (component, locale = 'es') => {
     return renderWithTheme(
       <NextIntlClientProvider
         locale={locale}
         messages={{ stats: locale === 'en' ? enStats : esStats }}
       >
         {component}
       </NextIntlClientProvider>
     );
   };
   ```

2. **Create i18n-specific validation tests:**
   - `__tests__/i18n/stats-namespace.test.ts`:
     - Verify stats.json exists in both locales
     - Verify all keys match between en and es
     - Verify English uses `EnOf(...)` placeholders
     - Verify Spanish has no placeholders
     - Verify dynamic interpolation keys are valid

3. **Create component i18n tests** (separate files):
   - `__tests__/components/tournament-stats/user-tournament-statistics-i18n.test.tsx`
   - `__tests__/components/tournament-stats/performance-overview-i18n.test.tsx`
   - `__tests__/components/tournament-stats/prediction-accuracy-i18n.test.tsx`
   - `__tests__/components/tournament-stats/boost-analysis-i18n.test.tsx`
   - `__tests__/components/tournament-stats/stats-tabs-i18n.test.tsx`

   Each tests:
   - Renders with Spanish locale (default) - verify Spanish text
   - Renders with English locale - verify EnOf placeholders
   - Tests translation keys load correctly
   - Tests dynamic interpolation (for boost allocation)
   - Tests ARIA labels are translated

4. **Stats page test:**
   - Check `__tests__/tournaments/[id]/stats.page.test.tsx`
   - Likely won't need updates (server component, no UI text)
   - Verify during Step 0 pre-implementation check

## Testing Strategy

### Unit Tests

**1. Translation File Tests** (`__tests__/i18n/stats-namespace.test.ts`)
- Verify stats.json exists in both locales
- Verify all keys match between en and es
- Verify English uses `EnOf(...)` placeholders
- Verify Spanish has no placeholders

**2. Component i18n Tests**
Each component gets an i18n test file:
- Test renders with Spanish locale (default)
- Test renders with English locale
- Test translation keys are loaded correctly
- Test dynamic interpolation works (for boost allocation)

**3. Update Existing Component Tests**
- `user-tournament-statistics.test.tsx`: Update to work with translations
- Add test utilities if needed (e.g., renderWithLocale wrapper)

### Manual Testing Checklist
1. ✅ View stats page in Spanish locale - all text renders correctly
2. ✅ Switch to English locale - placeholder text renders (EnOf format visible)
3. ✅ Expand/collapse sidebar card - labels remain translated
4. ✅ Navigate between tabs - tab labels are translated
5. ✅ Empty states show translated messages
6. ✅ Dynamic boost allocation text renders correctly with multiple groups
7. ✅ Boost empty state shows correct available counts
8. ✅ Percentage formatting displays correctly (numeric, not translated)
9. ✅ ARIA labels are translated:
   - Use browser dev tools to inspect aria-label attributes
   - Verify screen reader announcements (optional: use NVDA/JAWS)
   - Check both Spanish and English locales
10. ✅ No console errors or missing translation warnings
11. ✅ TypeScript compilation succeeds (no type errors)
12. ✅ Verify 80% code coverage on new/modified code

## Validation Considerations

### SonarCloud Requirements
- **Coverage:** ≥80% on new code (translation files, component updates, tests)
- **Duplications:** Avoid duplicate translation keys across namespaces
- **Code Smells:** Keep components simple, single responsibility
- **Security:** No user input in translation keys (static keys only)

### Quality Gates
1. **No duplicate keys:** Each Spanish string maps to exactly one key
2. **Key consistency:** English and Spanish files have identical key structure
3. **Placeholder format:** All English placeholders use `EnOf(...)` format
4. **Type safety:** TypeScript validates all translation keys
5. **Test coverage:** ≥80% coverage on modified components

### Pre-commit Checks
```bash
npm run test      # All tests pass
npm run lint      # No linting errors
npm run build     # TypeScript compilation succeeds
```

## Files to Create/Modify

### New Files
- `locales/en/stats.json` - English translations (placeholders)
- `locales/es/stats.json` - Spanish translations
- `__tests__/i18n/stats-namespace.test.ts` - Namespace validation tests
- `__tests__/components/tournament-stats/performance-overview-i18n.test.tsx` - Component i18n tests
- `__tests__/components/tournament-stats/prediction-accuracy-i18n.test.tsx` - Component i18n tests
- `__tests__/components/tournament-stats/boost-analysis-i18n.test.tsx` - Component i18n tests
- `__tests__/components/tournament-stats/stats-tabs-i18n.test.tsx` - Component i18n tests

### Modified Files
- `types/i18n.ts` - Add stats namespace
- `app/components/tournament-page/user-tournament-statistics.tsx` - Add i18n
- `app/components/tournament-stats/performance-overview-card.tsx` - Add i18n
- `app/components/tournament-stats/prediction-accuracy-card.tsx` - Add i18n
- `app/components/tournament-stats/boost-analysis-card.tsx` - Add i18n
- `app/components/tournament-stats/stats-tabs.tsx` - Add i18n
- `app/components/tournament-page/user-tournament-statistics.test.tsx` - Update tests

## Risk Assessment

### Low Risk
- ✅ Following established i18n pattern from previous stories
- ✅ Translation files are isolated - errors won't break app
- ✅ TypeScript catches missing/wrong keys at compile time
- ✅ Client components only - no server-side complexity

### Potential Issues
- ⚠️ Dynamic text interpolation for boost allocation - need to test carefully
- ⚠️ Existing tests expect Spanish text - will need updates
- ⚠️ Percentage formatting must stay in code, not translations

### Mitigation
- Thorough testing of dynamic text scenarios
- Update tests alongside component changes
- Keep formatting logic in components, only labels in translations

## Success Criteria

1. ✅ All stats components use `useTranslations('stats')` hook
2. ✅ No hardcoded Spanish text in components
3. ✅ Both locales have complete stats.json files
4. ✅ English locale uses `EnOf(...)` placeholders consistently
5. ✅ All tests pass with ≥80% coverage
6. ✅ TypeScript compilation succeeds
7. ✅ Manual testing confirms stats render in both locales
8. ✅ SonarCloud shows 0 new issues
9. ✅ Dynamic boost allocation text renders correctly
10. ✅ ARIA labels are translated for accessibility

## Open Questions

None - pattern is well-established from previous i18n stories.

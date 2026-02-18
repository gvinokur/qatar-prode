# Implementation Plan: [i18n] Translate Game Prediction Components (#154)

## Context

This story is part of the Internationalization (i18n) Support project (#2). The goal is to internationalize the core game prediction interface, which is currently hardcoded in Spanish. This includes game cards, prediction forms, filters, status indicators, and progress displays.

This work builds on completed stories:
- #149: i18n library setup & configuration (next-intl configured)
- #150: Translation key extraction & namespace design (7 namespaces established)
- #151: Translation helper utilities & patterns (date/time formatting with locale support)

The game prediction interface is a high-traffic, user-facing feature that requires careful handling of:
- Dynamic content (game counts, percentages, time-based urgency)
- Pluralization (Spanish: "partido/partidos", "cierra/cierran")
- Date/time formatting with timezones
- Real-time updates via GuessesContext

**Priority:** High - Core feature affecting all users
**Effort:** High (6-10 hours) - 15+ components, 26+ unique strings, complex pluralization

---

## Story Requirements

**Original Issue Description:**

> Internationalize core game prediction interface.
>
> **Tasks:**
> - Game cards (compact and full)
> - Prediction forms
> - Score inputs
> - Boost indicators
> - Game status labels
> - Results display
> - Unified games page
>
> **Considerations:**
> - Team names (may remain in original language)
> - Location names (translate or keep original?)
> - Date/time with timezone handling

---

## Acceptance Criteria

1. **All hardcoded Spanish strings replaced with translation keys**
   - Dashboard labels, filter options, UI elements, status messages
   - No hardcoded strings remain in components

2. **Translation keys organized in appropriate namespace(s)**
   - Follow established namespace architecture
   - Spanish baseline extracted to JSON files
   - English placeholders created with EnOf() format

3. **Pluralization handled correctly**
   - Spanish: "partido/partidos", "cierra/cierran"
   - English: "game/games", "closes/close"
   - Use next-intl pluralization support

4. **Components support both locales (es/en)**
   - Client components use `useTranslations()`
   - Server components use `await getTranslations()`
   - Locale passed to date/time utilities

5. **TypeScript types updated**
   - `types/i18n.ts` includes new namespace(s)
   - Full autocomplete for translation keys
   - No TypeScript errors

6. **Team names and locations handled appropriately**
   - Team names remain in original language (not translated)
   - Locations remain in original language (not translated)
   - Separator "vs" translated

7. **Existing functionality preserved**
   - All features work identically in both locales
   - Auto-save, boost tracking, filtering unchanged
   - No visual regressions

8. **Comprehensive test coverage**
   - Unit tests for all modified components
   - Tests verify both 'es' and 'en' locales
   - 80% coverage on new/modified code
   - Mock next-intl properly

---

## Technical Approach

### 1. Translation Namespace Strategy

**Create new namespace: `predictions.json`**

This namespace will contain all game prediction-related strings:
- Dashboard labels and titles
- Filter options and labels
- Game status and urgency messages
- UI elements (buttons, tooltips, aria-labels)
- Progress indicators
- Pluralized messages

**Rationale:**
- Keeps feature-specific strings together
- Avoids bloating `common.json`
- Follows established pattern (auth, groups, emails are separate)
- Easier to maintain and locate keys

**Namespace structure:**
```json
{
  "dashboard": {
    "games": "Partidos",
    "tournament": "Torneo",
    "gamePredictions": "Predicciones de Partidos",
    "tournamentPredictions": "Predicciones de Torneo"
  },
  "filters": {
    "label": "Filtro",
    "all": "Todos",
    "groups": "Grupos",
    "playoffs": "Playoffs",
    "unpredicted": "Sin Predecir",
    "closingSoon": "Cierran Pronto"
  },
  "secondaryFilters": {
    "group": "Grupo",
    "round": "Ronda"
  },
  "game": {
    "vs": "vs",
    "editPrediction": "Editar predicción: {homeTeam} vs {awayTeam}",
    "editResult": "Editar resultado"
  },
  "urgency": {
    "games": {
      "zero": "Ningún partido cierra en {timeframe}",
      "one": "{count} partido cierra en {timeframe}",
      "other": "{count} partidos cierran en {timeframe}"
    },
    "tournament": {
      "zero": "Predicciones de torneo no disponibles",
      "one": "Predicciones de torneo cierran en {timeframe}",
      "other": "Predicciones de torneo cierran en {timeframe}"
    },
    "timeframes": {
      "twoHours": "2 horas",
      "twentyFourHours": "24 horas",
      "twoDays": "2 días"
    },
    "noGamesIn48Hours": "Ningún partido cierra en las próximas 48 horas"
  },
  "points": {
    "singular": "pt",
    "plural": "pts"
  }
}
```

### 2. Pluralization Implementation

**Problem:** Current code manually constructs plural forms:
```typescript
// Current approach (prediction-status-bar.tsx)
`${count} partido${count > 1 ? 's' : ''} cierra${count > 1 ? 'n' : ''} en 2 horas`
```

**Solution:** Use next-intl pluralization:

**Translation file:**
```json
{
  "urgency": {
    "games": {
      "one": "{count} partido cierra en {timeframe}",
      "other": "{count} partidos cierran en {timeframe}"
    }
  }
}
```

**Component usage:**
```typescript
const t = useTranslations('predictions');
const message = t('urgency.games', {
  count: gameCount,
  timeframe: t('urgency.timeframes.twoHours')
});
```

This automatically selects the correct plural form based on locale rules.

### 3. Component Migration Pattern

**For Client Components:**
```typescript
'use client';

import { useTranslations, useLocale } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('predictions');
  const locale = useLocale();

  // Replace: "Partidos"
  // With: t('dashboard.games')

  return <Typography>{t('dashboard.games')}</Typography>;
}
```

**For Server Components:**
```typescript
import { getTranslations, getLocale } from 'next-intl/server';

export default async function MyServerComponent() {
  const locale = await getLocale();
  const t = await getTranslations('predictions');

  return <Typography>{t('dashboard.games')}</Typography>;
}
```

**All 15+ components are Client Components** (use hooks, state, context), so the client pattern applies to all.

### 4. Handling Dynamic Content

**Game counts and percentages:**
- Use `t()` with interpolation: `t('message', { count, percentage })`
- Number formatting via `Intl.NumberFormat(locale)`

**Time-based urgency:**
- Timeframe strings as separate keys: `t('urgency.timeframes.twoHours')`
- Pass as variables to urgency messages

**Boost indicators:**
- Format: `{used}/{max}` - no translation needed, just display numbers

### 5. Team Names and Locations

**Decision:** Do NOT translate
- Team names remain as provided by data source (e.g., "Argentina", "Brasil")
- Locations remain as provided (e.g., "Estadio Lusail")
- Only translate UI labels around them (e.g., "vs" separator, "Location:" label)

**Rationale:**
- Team names are proper nouns with official spellings
- Locations are stadium names (proper nouns)
- Translating would cause confusion and inconsistency with official data

### 6. Date/Time Formatting

**Already implemented** in story #151:
- Utilities support locale parameter: `getCompactGameTime(date, timezone, locale)`
- Components already use `useLocale()` hook
- No changes needed - existing code works

### 7. TypeScript Integration

**Update `types/i18n.ts`:**
```typescript
import predictions from '@/locales/en/predictions.json';

type Messages = {
  common: typeof common;
  navigation: typeof navigation;
  auth: typeof auth;
  groups: typeof groups;
  emails: typeof emails;
  validation: typeof validation;
  errors: typeof errors;
  predictions: typeof predictions;  // Add this
};
```

**Update `i18n/request.ts`:**
```typescript
messages: {
  common: (await import(`../locales/${locale}/common.json`)).default,
  // ... other namespaces
  predictions: (await import(`../locales/${locale}/predictions.json`)).default,
}
```

---

## Visual Prototypes

### Before (Hardcoded Spanish):

```
┌─────────────────────────────────────────────────┐
│  Predicciones de Partidos            [3 partidos] │
│  ━━━━━━━━━━━━━━━ 75%                             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Filtro: [Todos ▼]     Grupo: [Todos ▼]        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ⚠️  2 partidos cierran en 2 horas              │
│  ⏰  5 partidos cierran en 24 horas             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Argentina  2  -  1  Brasil                     │
│  ──────────────────────────────────────────────  │
│  Editar predicción                              │
└─────────────────────────────────────────────────┘
```

### After (Locale-Aware - Spanish):

```
┌─────────────────────────────────────────────────┐
│  Predicciones de Partidos            [3 partidos] │
│  ━━━━━━━━━━━━━━━ 75%                             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Filtro: [Todos ▼]     Grupo: [Todos ▼]        │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ⚠️  2 partidos cierran en 2 horas              │
│  ⏰  5 partidos cierran en 24 horas             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Argentina  2  -  1  Brasil                     │
│  ──────────────────────────────────────────────  │
│  Editar predicción                              │
└─────────────────────────────────────────────────┘
```

### After (Locale-Aware - English):

```
┌─────────────────────────────────────────────────┐
│  Game Predictions                     [3 games]  │
│  ━━━━━━━━━━━━━━━ 75%                             │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Filter: [All ▼]       Group: [All ▼]          │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  ⚠️  2 games close in 2 hours                   │
│  ⏰  5 games close in 24 hours                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  Argentina  2  -  1  Brazil                     │
│  ──────────────────────────────────────────────  │
│  Edit prediction                                │
└─────────────────────────────────────────────────┘
```

**Note:** Visual layout remains identical. Only text content changes based on locale.

### Pluralization Example:

**Spanish:**
- "1 partido cierra en 2 horas"
- "2 partidos cierran en 2 horas"

**English:**
- "1 game closes in 2 hours"
- "2 games close in 2 hours"

---

## Files to Create/Modify

### New Files (2)

1. **`/locales/es/predictions.json`**
   - Spanish baseline translations
   - Complete set of game prediction strings
   - Pluralization rules for Spanish (including zero handling)

2. **`/locales/en/predictions.json`**
   - English placeholder translations (EnOf() format)
   - Same structure as Spanish
   - Pluralization rules for English (including zero handling)

### Files to Modify (17 components + 2 config files = 19 total)

**Configuration & Types (2):**
1. `types/i18n.ts` - Add predictions namespace to TypeScript types
2. `i18n/request.ts` - Import predictions namespace in message loader

**Primary Components (2):**
3. `app/components/compact-prediction-dashboard.tsx` - Dashboard labels, progress, popovers
4. `app/components/prediction-dashboard.tsx` - Dashboard labels, status bar

**Game Card Components (4):**
5. `app/components/urgency-game-card.tsx` - Edit labels, "vs" separator
6. `app/components/flippable-game-card.tsx` - Aria-labels
7. `app/components/compact-game-view-card.tsx` - "vs" separator
8. `app/components/game-card-point-overlay.tsx` - Point labels (pt/pts)

**Filter Components (2):**
9. `app/components/game-filters.tsx` - All filter labels and options
10. `app/components/secondary-filters.tsx` - "Grupo", "Ronda" labels

**Status & Urgency Components (3):**
11. `app/components/prediction-status-bar.tsx` - Urgency messages, pluralization
12. `app/components/urgency-accordion-group.tsx` - Dynamic urgency titles
13. `app/components/urgency-accordion.tsx` - Accordion labels (if any)

**Popover & Display Components (3):**
14. `app/components/game-details-popover.tsx` - Title, no-results message
15. `app/components/tournament-details-popover.tsx` - Title (if any)
16. `app/components/game-prediction-edit-controls.tsx` - Button labels, "vs" separator

**Supporting Components (2):**
17. `app/components/prediction-progress-row.tsx` - Label display (if any)
18. `app/components/game-view.tsx` - Pass locale prop (review - may not need changes)

**Note:** `unified-games-page.tsx` and `unified-games-page-client.tsx` are wrappers with no hardcoded strings - excluded from modification list.

**Test Files (Will create during testing phase - 12 test files):**
- `__tests__/components/compact-prediction-dashboard.test.tsx`
- `__tests__/components/prediction-dashboard.test.tsx`
- `__tests__/components/game-filters.test.tsx`
- `__tests__/components/secondary-filters.test.tsx`
- `__tests__/components/prediction-status-bar.test.tsx`
- `__tests__/components/urgency-game-card.test.tsx`
- `__tests__/components/game-card-point-overlay.test.tsx`
- `__tests__/components/urgency-accordion-group.test.tsx`
- `__tests__/components/urgency-accordion.test.tsx`
- `__tests__/components/game-details-popover.test.tsx`
- `__tests__/components/flippable-game-card.test.tsx`
- `__tests__/components/game-prediction-edit-controls.test.tsx`

---

## Implementation Steps

### Phase 1: Setup Translation Files (30 min)

1. **Create Spanish baseline** (`locales/es/predictions.json`):
   - Extract all hardcoded strings from components
   - Organize into logical sections (dashboard, filters, urgency, etc.)
   - Define pluralization rules for Spanish

2. **Create English placeholders** (`locales/en/predictions.json`):
   - Copy Spanish structure
   - Wrap strings in EnOf() format: `"EnOf(Partidos)"`
   - Define pluralization rules for English

3. **Update TypeScript types** (`types/i18n.ts`):
   - Import predictions namespace
   - Add to Messages type
   - Verify autocomplete works

4. **Update message loader** (`i18n/request.ts`):
   - Add predictions namespace import
   - Include in messages object

### Phase 2: Migrate Dashboard Components (1 hour)

5. **`compact-prediction-dashboard.tsx`**:
   - Add `useTranslations('predictions')`
   - Replace dashboard labels (Partidos, Torneo, Predicciones de Partidos, Predicciones de Torneo)
   - Replace popover titles
   - Verify GuessesContext integration still works

6. **`prediction-dashboard.tsx`**:
   - Add `useTranslations('predictions')`
   - Replace any hardcoded labels
   - Ensure progress bar displays correctly

### Phase 3: Migrate Filter Components (45 min)

7. **`game-filters.tsx`**:
   - Add `useTranslations('predictions')`
   - Replace all filter labels: Filtro, Todos, Grupos, Playoffs, Sin Predecir, Cierran Pronto
   - Verify FilterContext integration works
   - Test filter functionality

8. **`secondary-filters.tsx`**:
   - Add `useTranslations('predictions')`
   - Replace "Grupo" and "Ronda" labels
   - Verify dropdown options display correctly

### Phase 4: Migrate Game Card Components (1.5 hours)

9. **`urgency-game-card.tsx`**:
   - Add `useTranslations('predictions')`
   - Replace "vs" separator (decision: user confirmation needed)
   - Replace edit button aria-label with interpolation
   - Pass locale to any date utilities

10. **`flippable-game-card.tsx`**:
    - Add `useTranslations('predictions')`
    - Replace aria-labels for edit mode
    - Verify flip animation works

11. **`compact-game-view-card.tsx`**:
    - Add `useTranslations('predictions')`
    - Replace "vs" separator
    - Verify compact display layout

12. **`game-card-point-overlay.tsx`**:
    - Add `useTranslations('predictions')`
    - Replace point labels (pt/pts) - likely same in both locales
    - Handle singular/plural based on count

### Phase 5: Migrate Status & Urgency Components (1.5 hours)

13. **`prediction-status-bar.tsx`** (Complex - pluralization):
    - Add `useTranslations('predictions')`
    - Replace manual plural logic with `t('urgency.games', { count, timeframe })`
    - Handle zero count with separate key: `t('urgency.games.zero')`
    - Handle timeframe selection (2 hours, 24 hours, 2 days)
    - Test with different game counts (0, 1, 2, 5, etc.)
    - Verify urgency calculation still works

14. **`urgency-accordion-group.tsx`**:
    - Add `useTranslations('predictions')`
    - Replace urgency level titles with translation keys
    - Verify accordion expand/collapse works
    - Test dynamic updates trigger re-render

15. **`urgency-accordion.tsx`**:
    - Add `useTranslations('predictions')` if needed
    - Replace any hardcoded labels
    - Test nested accordion behavior

### Phase 6: Migrate Popover & Supporting Components (1 hour)

16. **`game-details-popover.tsx`**:
    - Add `useTranslations('predictions')`
    - Replace popover title
    - Replace "Ningún partido cierra en las próximas 48 horas" → `t('urgency.noGamesIn48Hours')`
    - Verify popover positioning and behavior

17. **`tournament-details-popover.tsx`**:
    - Review component for hardcoded strings
    - Add `useTranslations('predictions')` if needed
    - Test popover display

18. **`game-prediction-edit-controls.tsx`**:
    - Add `useTranslations('predictions')`
    - Replace "vs" separator in score display
    - Replace button labels (if any hardcoded)
    - Verify boost selection UI works

19. **`prediction-progress-row.tsx`**:
    - Review component - may not have hardcoded strings
    - Pass locale if needed for number formatting
    - Verify progress calculation

20. **`game-view.tsx`**:
    - Review component - likely just props passing
    - Ensure locale flows to child components

### Phase 7: Testing (2 hours)

21. **Create test files for modified components**:
    - Mock next-intl: `useTranslations`, `useLocale`
    - Test with both 'es' and 'en' locales
    - Verify translated strings appear correctly
    - Test pluralization edge cases (0, 1, 2+)

22. **Key test scenarios**:
    - Dashboard displays correct labels in both locales
    - Filters show translated options
    - Game cards show "vs" in correct locale
    - Urgency messages use correct plural forms
    - Point labels (pt/pts) adapt to locale
    - No TypeScript errors on translation keys
    - GuessesContext and FilterContext still work
    - Auto-save functionality preserved

23. **Integration testing**:
    - Manual test in dev environment: http://localhost:3000/es/
    - Switch locale to English: http://localhost:3000/en/
    - Verify entire prediction flow works in both languages
    - Check responsive behavior on mobile

### Phase 8: Validation & Cleanup (30 min)

24. **Run validation checks**:
    - `npm test` - All tests pass
    - `npm run lint` - No linting errors
    - `npm run build` - Production build succeeds
    - Check TypeScript compilation - No errors

25. **Code review checklist**:
    - All 26+ hardcoded strings replaced
    - No remaining Spanish hardcoded text
    - Pluralization working correctly
    - Translation keys follow established patterns
    - Tests cover both locales
    - No functionality regressions

26. **Documentation**:
    - Update `docs/i18n-guide.md` if needed (add predictions namespace example)
    - Add comments for complex pluralization logic
    - Update README if needed

---

## Testing Strategy

### Unit Tests

**Components to test (80% coverage target on modified code):**

**High Priority - Complex Logic (6 tests):**

1. **prediction-status-bar.test.tsx** (Critical - pluralization)
   - Spanish zero: "Ningún partido cierra"
   - Spanish singular: "1 partido cierra en 2 horas"
   - Spanish plural: "2 partidos cierran en 2 horas"
   - English zero: "No games close"
   - English singular: "1 game closes in 2 hours"
   - English plural: "2 games close in 2 hours"
   - Different timeframes (2 hours, 24 hours, 2 days)

2. **compact-prediction-dashboard.test.tsx**
   - Renders dashboard labels in Spanish ("Predicciones de Partidos")
   - Renders dashboard labels in English ("Game Predictions")
   - Displays progress correctly with translated labels
   - Opens popovers with translated content
   - GuessesContext integration works

3. **game-filters.test.tsx**
   - Renders all filter options in Spanish (Todos, Grupos, Playoffs, etc.)
   - Renders all filter options in English (All, Groups, Playoffs, etc.)
   - Filter selection triggers correct FilterContext updates
   - Dropdown labels translated

4. **urgency-accordion-group.test.tsx**
   - Renders accordion titles in Spanish
   - Renders accordion titles in English
   - Expand/collapse behavior works
   - Dynamic urgency updates trigger re-render with correct translations

5. **game-prediction-edit-controls.test.tsx**
   - "vs" separator displays correctly
   - Button labels translated
   - Edit mode aria-labels with interpolation
   - Boost selection UI works

6. **game-details-popover.test.tsx**
   - Popover title translated
   - "Ningún partido..." message in Spanish
   - English equivalent message
   - Popover positioning unchanged

**Medium Priority - Standard Components (6 tests):**

7. **prediction-dashboard.test.tsx**
   - Dashboard labels translated
   - Progress bar display unchanged
   - Status bar integration

8. **urgency-game-card.test.tsx**
   - Edit button aria-label with team name interpolation
   - "vs" separator in both locales
   - Click handlers work

9. **flippable-game-card.test.tsx**
   - Aria-labels for flipped state
   - Flip animation unchanged
   - Both locales work

10. **game-card-point-overlay.test.tsx**
    - Singular: "1 pt" (same in both locales)
    - Plural: "5 pts" (same in both locales)
    - Point calculation unchanged

11. **secondary-filters.test.tsx**
    - "Grupo" → "Group" translation
    - "Ronda" → "Round" translation
    - Dropdown options work

12. **urgency-accordion.test.tsx**
    - Accordion labels translated (if any)
    - Nested behavior works
    - Real-time countdown updates

**Context Integration Tests:**
- All tests verify GuessesContext functionality preserved
- All tests verify FilterContext integration unchanged
- Tests include locale switching scenarios (Spanish → English mid-session)

**Mock setup:**
```typescript
import { vi } from 'vitest';

// Mock translations by namespace and locale
const mockTranslations = {
  es: {
    predictions: {
      'dashboard.games': 'Partidos',
      'dashboard.tournament': 'Torneo',
      'dashboard.gamePredictions': 'Predicciones de Partidos',
      'filters.label': 'Filtro',
      'filters.all': 'Todos',
      'game.vs': 'vs',
      'game.editPrediction': 'Editar predicción: {homeTeam} vs {awayTeam}',
      'points.singular': 'pt',
      'points.plural': 'pts',
    },
  },
  en: {
    predictions: {
      'dashboard.games': 'Games',
      'dashboard.tournament': 'Tournament',
      'dashboard.gamePredictions': 'Game Predictions',
      'filters.label': 'Filter',
      'filters.all': 'All',
      'game.vs': 'vs',
      'game.editPrediction': 'Edit prediction: {homeTeam} vs {awayTeam}',
      'points.singular': 'pt',
      'points.plural': 'pts',
    },
  },
};

// Helper for pluralization
const getPlural = (key: string, count: number, locale: string) => {
  if (key === 'urgency.games') {
    if (count === 0) return locale === 'es' ? 'Ningún partido cierra' : 'No games close';
    if (count === 1) return locale === 'es' ? '1 partido cierra' : '1 game closes';
    return locale === 'es' ? `${count} partidos cierran` : `${count} games close`;
  }
  return key;
};

vi.mock('next-intl', () => ({
  useTranslations: vi.fn((namespace: string) => {
    const currentLocale = 'es'; // Can be changed per test
    return (key: string, params?: Record<string, any>) => {
      const translation = mockTranslations[currentLocale]?.[namespace]?.[key];

      // Handle pluralization
      if (params?.count !== undefined && key.startsWith('urgency.')) {
        return getPlural(key, params.count, currentLocale);
      }

      // Handle interpolation
      if (translation && params) {
        return Object.entries(params).reduce(
          (str, [paramKey, value]) => str.replace(`{${paramKey}}`, String(value)),
          translation
        );
      }

      return translation ?? `Missing: ${namespace}.${key}`;
    };
  }),
  useLocale: vi.fn(() => 'es'), // Can be overridden per test
}));

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn((config?: { locale?: string; namespace?: string }) => {
    const locale = config?.locale ?? 'es';
    const namespace = config?.namespace ?? 'common';
    return (key: string, params?: Record<string, any>) => {
      const translation = mockTranslations[locale]?.[namespace]?.[key];
      if (translation && params) {
        return Object.entries(params).reduce(
          (str, [paramKey, value]) => str.replace(`{${paramKey}}`, String(value)),
          translation
        );
      }
      return translation ?? `Missing: ${namespace}.${key}`;
    };
  }),
  getLocale: vi.fn(async () => 'es'),
}));
```

**Testing with different locales:**
```typescript
describe('Component with Spanish locale', () => {
  beforeEach(() => {
    vi.mocked(useLocale).mockReturnValue('es');
  });

  it('renders Spanish text', () => {
    // test implementation
  });
});

describe('Component with English locale', () => {
  beforeEach(() => {
    vi.mocked(useLocale).mockReturnValue('en');
  });

  it('renders English text', () => {
    // test implementation
  });
});
```

### Manual Testing Checklist

**Spanish locale (http://localhost:3000/es/):**
- [ ] Dashboard shows "Predicciones de Partidos"
- [ ] Filters show "Todos", "Grupos", "Playoffs", etc.
- [ ] Game cards show "vs" between teams
- [ ] Urgency messages use correct Spanish plurals
- [ ] Point labels show "pt"/"pts"
- [ ] Edit buttons work

**English locale (http://localhost:3000/en/):**
- [ ] Dashboard shows "Game Predictions"
- [ ] Filters show "All", "Groups", "Playoffs", etc.
- [ ] Game cards show "vs" between teams
- [ ] Urgency messages use correct English plurals
- [ ] Point labels show "pt"/"pts"
- [ ] Edit buttons work

**Functionality preserved:**
- [ ] Can create/edit predictions
- [ ] Auto-save works
- [ ] Boost selection works
- [ ] Filtering works (All, Groups, Playoffs, etc.)
- [ ] Urgency accordion expands/collapses
- [ ] Countdown timers update
- [ ] No console errors

---

## Validation Considerations

### SonarCloud Requirements

1. **Code coverage: ≥80% on new code**
   - All modified components need comprehensive tests
   - Focus on pluralization logic (complex)
   - Mock next-intl properly

2. **0 new issues of any severity**
   - No unused imports
   - No console.log statements
   - Proper TypeScript types
   - No duplicate code

3. **Security rating: A**
   - No user input vulnerabilities (translation keys are static)
   - Interpolation via next-intl (already sanitized)

4. **Maintainability: B or higher**
   - Translation keys follow clear naming convention
   - Comments for complex pluralization logic
   - Consistent pattern across components

### Quality Gates

- All tests pass (`npm test`)
- Lint passes (`npm run lint`)
- Build succeeds (`npm run build`)
- No TypeScript errors
- Manual testing in both locales successful

---

## Risks and Mitigations

### Risk 1: Pluralization complexity
**Issue:** Spanish and English have different pluralization rules, especially for verb conjugation.

**Mitigation:**
- Use next-intl built-in pluralization support
- Test edge cases (0, 1, 2, many)
- Document pluralization patterns in comments

### Risk 2: Context loss in translation
**Issue:** Isolated strings may lose context, leading to poor translations.

**Mitigation:**
- Add comments in translation files explaining context
- Use descriptive key names (e.g., `editPrediction` not `edit`)
- Include interpolation variables for clarity

### Risk 3: Performance impact
**Issue:** Loading additional namespace might slow down page load.

**Mitigation:**
- Namespace already loaded on demand (i18n/request.ts)
- Predictions namespace relatively small (~30 keys)
- No noticeable impact expected (similar to auth, groups)

### Risk 4: Breaking existing functionality
**Issue:** Refactoring might break GuessesContext, FilterContext, or auto-save.

**Mitigation:**
- Comprehensive tests for all components
- Manual testing of full prediction flow
- Test auto-save specifically
- Test context integrations

### Risk 5: Missing strings
**Issue:** May not identify all hardcoded strings during extraction.

**Mitigation:**
- Use scripts/extract-hardcoded-strings.sh to scan
- Manual review of each component
- Test in English locale to catch missing translations

---

## Decisions Made

✅ **All decisions confirmed with user:**

1. **"vs" separator:**
   - **Decision:** Keep as "vs" in both Spanish and English
   - **Rationale:** Simple, internationally recognized, consistent across locales

2. **Team names:**
   - **Decision:** Keep in original language (no translation)
   - **Rationale:** Official team names are proper nouns, maintains consistency with data source
   - **Example:** "Argentina", "Brasil", "France" remain unchanged

3. **Location names:**
   - **Decision:** Keep in original language (no translation)
   - **Rationale:** Stadium names are proper nouns
   - **Example:** "Estadio Lusail", "Al Bayt Stadium" remain unchanged

4. **English translation format:**
   - **Decision:** Use EnOf() placeholders
   - **Rationale:** Consistent with established pattern from stories #150-151
   - **Example:** `"dashboard.games": "EnOf(Partidos)"`

---

## Dependencies

**No new dependencies required**

Existing dependencies are sufficient:
- `next-intl` v4.8.3 - Already configured
- `dayjs` v1.11.11 - Already supports locales
- `next` v15.3 - App Router with i18n support

---

## Related Documentation

- [i18n Developer Guide](../docs/i18n-guide.md) - Complete guide to translations
- [i18n Patterns](../app/utils/i18n-patterns.md) - Implementation patterns
- Story #149: i18n Library Setup & Configuration
- Story #150: Translation Key Extraction & Namespace Design
- Story #151: Translation Helper Utilities & Patterns

---

## Success Criteria

**Definition of Done:**

- [ ] All 26+ hardcoded Spanish strings replaced with translation keys
- [ ] Translation namespace `predictions.json` created in Spanish and English
- [ ] TypeScript types updated (types/i18n.ts, i18n/request.ts)
- [ ] All 15+ components updated to use useTranslations()
- [ ] Pluralization working correctly in both locales
- [ ] All tests pass (npm test)
- [ ] Lint passes (npm run lint)
- [ ] Build succeeds (npm run build)
- [ ] Manual testing successful in both /es/ and /en/ routes
- [ ] No functionality regressions (auto-save, filtering, boost tracking)
- [ ] SonarCloud quality gates met (≥80% coverage, 0 new issues)
- [ ] Code review approved
- [ ] Vercel preview deployment successful

---

## Amendments

### Amendment 1: Internationalize Game Card Tooltips & Popovers (Discovered during Vercel Preview testing)

**Date:** 2026-02-18
**Reason:** During implementation testing, discovered additional hardcoded Spanish strings in tooltips and popovers that were not initially identified.

**Scope:** Add translations for the following components:

1. **Boost Description Tooltips**
   - Component: Likely in `game-prediction-edit-controls.tsx` or separate tooltip component
   - Strings: Boost type descriptions (Silver, Golden, etc.)
   - Location: Tooltips on boost selection buttons

2. **Edit Game Button Tooltips**
   - Component: Game card components
   - Strings: Edit button tooltip text
   - Location: Game cards edit buttons

3. **"Desglose de Puntos" Popover**
   - Component: Need to identify - likely `game-card-point-overlay.tsx` or related
   - Strings: Popover title "Desglose de puntos" and breakdown details
   - Location: Point breakdown popover on game cards

4. **Boosts Stats Popover**
   - Component: Dashboard or game card components
   - Strings: Boost statistics display labels
   - Location: Boosts statistics popover

**Implementation Approach:**
- Search for components with these features
- Extract hardcoded strings to `predictions.json`
- Add English placeholders with EnOf()
- Update components to use `useTranslations('predictions')`
- Test popover/tooltip functionality preserved

**Estimated Effort:** 1-2 hours

**Tasks to Create:**
1. Identify tooltip/popover components
2. Extract and internationalize boost descriptions
3. Internationalize edit game tooltips
4. Internationalize "Desglose de puntos" popover
5. Internationalize boosts stats popover

# Implementation Plan: [i18n] Translate Rules Pages (#179)

## Story Context

**Issue:** #179 - [i18n] Translate Rules Pages
**Priority:** Medium
**Effort:** Medium (4-6 hours)
**Epic:** Internationalization

### Objectives

Internationalize the Rules pages and related components to support both Spanish (es) and English (en) locales.

### Scope

- Rules page content
- Sidebar card for Rules (bottom navigation)
- Scoring rules display with dynamic pluralization
- Tournament rules display
- All 11 rules-examples components

## Acceptance Criteria

1. ✅ All hardcoded Spanish text in Rules component is replaced with i18n keys
2. ✅ All 11 rules-examples components are internationalized
3. ✅ Bottom navigation "Reglas" label is internationalized
4. ✅ Pluralization logic works correctly in both languages
5. ✅ Both `/[locale]/rules` and `/[locale]/tournaments/[id]/rules` pages display translated content
6. ✅ English translations are proper English (not "EnOf()" placeholders)
7. ✅ All existing tests pass with translated text
8. ✅ 80% code coverage maintained on new/modified code

## Current State

**Hardcoded Strings:** All hardcoded text in the Rules component and examples is currently in **Spanish**:
- Card title: "Reglas Generales" (Spanish)
- Subheader: "Estás aquí" (Spanish)
- Section titles: "Calculo de puntos", "Condiciones generales" (Spanish)
- All rule labels: Spanish with Spanish grammar (e.g., "Punto" vs "Puntos")
- All constraints: Spanish
- All 11 examples: Spanish
- Bottom navigation: Mixed ("Home" in English, "Tablas", "Reglas", "Stats", "Grupos" in Spanish)

**Migration approach:** Replace all Spanish hardcoded strings with i18n translation keys that support both Spanish and English.

## Technical Approach

### 1. Create Translation Files

Create `rules.json` in both `/locales/es/` and `/locales/en/` with the following structure:

```json
{
  "title": "Reglas Generales",
  "status": {
    "youAreHere": "Estás aquí"
  },
  "sections": {
    "scoring": "Calculo de puntos",
    "constraints": "Condiciones generales"
  },
  "rules": {
    "winnerDraw": {
      "singular": "{points} Punto por Ganador/Empate acertado",
      "plural": "{points} Puntos por Ganador/Empate acertado"
    },
    "exactScore": {
      "singular": "{bonus} punto extra por resultado exacto (total: {total} punto)",
      "plural": "{bonus} puntos extra por resultado exacto (total: {total} puntos)"
    },
    "qualifiedTeam": {
      "singular": "{points} Punto por cada equipo clasificado acertado",
      "plural": "{points} Puntos por cada equipo clasificado acertado"
    },
    "exactPosition": {
      "singular": "{points} Punto adicional por posición exacta en la fase de grupos (total: {total} puntos por equipo clasificado en posición exacta)",
      "plural": "{points} Puntos adicionales por posición exacta en la fase de grupos (total: {total} puntos por equipo clasificado en posición exacta)"
    },
    "champion": {
      "singular": "{points} Punto por campeon",
      "plural": "{points} Puntos por campeon"
    },
    "runnerUp": {
      "singular": "{points} Punto por subcampeon",
      "plural": "{points} Puntos por subcampeon"
    },
    "thirdPlace": {
      "singular": "{points} Punto por tercer puesto, si es que el torneo tiene partido por el mismo",
      "plural": "{points} Puntos por tercer puesto, si es que el torneo tiene partido por el mismo"
    },
    "individualAwards": {
      "singular": "{points} Punto por cada premio acertado (mejor jugador, arquero, goleador, etc...)",
      "plural": "{points} Puntos por cada premio acertado (mejor jugador, arquero, goleador, etc...)"
    },
    "silverBoost": {
      "singular": "Boost Plateado: Puedes seleccionar hasta {count} partido que valdrá el doble de puntos (2x)",
      "plural": "Boost Plateado: Puedes seleccionar hasta {count} partidos que valdrán el doble de puntos (2x)"
    },
    "goldenBoost": {
      "singular": "Boost Dorado: Puedes seleccionar hasta {count} partido que valdrá el triple de puntos (3x)",
      "plural": "Boost Dorado: Puedes seleccionar hasta {count} partidos que valdrán el triple de puntos (3x)"
    },
    "boostTiming": "Los boosts solo pueden aplicarse antes de que comience el partido"
  },
  "constraints": {
    "matchPredictionTime": "Se permite cambiar los pronosticos de cada partido hasta una hora antes del mismo",
    "podiumPredictionTime": "Se permite modificar pronosticos de podio y premios individuales luego hasta 2 dias despues del comienzo del torneo",
    "singlePrediction": "No se permite mas de un pronostico por persona, pero el mismo se puede utilizar en multiples grupos"
  },
  "examples": {
    "winnerDraw": "Ejemplo: Si predices que Argentina ganará contra Brasil y efectivamente Argentina gana, obtienes 1 punto. Si predices un empate y el partido termina en empate, también obtienes 1 punto.",
    "exactScore": "Ejemplo: Si predices que Argentina ganará 2-1 contra Brasil y el resultado final es exactamente 2-1, obtienes 2 puntos (1 por el ganador + 1 extra por el resultado exacto).",
    "roundOf16": "Ejemplo: Si predices que Argentina clasificará a octavos de final y efectivamente clasifica, obtienes 1 punto por ese equipo clasificado.",
    "groupPosition": "Ejemplo: Si predices que Argentina clasificará primero del Grupo A y efectivamente termina primero, obtienes 2 puntos adicionales (1 por clasificar + 2 por posición exacta = 3 puntos totales).",
    "champion": "Ejemplo: Si predices que Argentina será campeón y efectivamente Argentina gana el torneo, obtienes 5 puntos. Si Argentina llega a la final pero pierde, no obtienes los puntos.",
    "runnerUp": "Ejemplo: Si predices que Brasil será subcampeón y efectivamente Brasil pierde la final, obtienes 3 puntos.",
    "thirdPlace": "Ejemplo: Si predices que Francia será tercero y efectivamente Francia gana el partido por el tercer puesto, obtienes 1 punto.",
    "individualAwards": "Ejemplo: Si predices que Lionel Messi ganará el premio al mejor jugador y efectivamente lo gana, obtienes 3 puntos. Lo mismo aplica para otros premios (arquero, goleador, etc.).",
    "matchPredictionTime": "Ejemplo: Si un partido comienza a las 15:00, puedes modificar tu pronóstico hasta las 14:00. Después de esa hora, el pronóstico queda bloqueado.",
    "podiumPredictionTime": "Ejemplo: Si el torneo comienza el 1 de junio, puedes modificar tus pronósticos de campeón, subcampeón y tercer puesto hasta el 3 de junio a las 23:59.",
    "singlePrediction": "Ejemplo: Solo puedes tener un pronostico activo, pero ese mismo pronostico puede usarse en el grupo con tus amigos, en el grupo de tu oficina, y en cualquier otro grupo al que te unas."
  },
  "actions": {
    "viewFullRules": "Ver Reglas Completas"
  }
}
```

**English version (`/locales/en/rules.json`):**

```json
{
  "title": "General Rules",
  "status": {
    "youAreHere": "You are here"
  },
  "sections": {
    "scoring": "Points Calculation",
    "constraints": "General Conditions"
  },
  "rules": {
    "winnerDraw": {
      "singular": "{points} Point for correct Winner/Draw",
      "plural": "{points} Points for correct Winner/Draw"
    },
    "exactScore": {
      "singular": "{bonus} extra point for exact score (total: {total} point)",
      "plural": "{bonus} extra points for exact score (total: {total} points)"
    },
    "qualifiedTeam": {
      "singular": "{points} Point for each correct qualified team",
      "plural": "{points} Points for each correct qualified team"
    },
    "exactPosition": {
      "singular": "{points} Additional point for exact group stage position (total: {total} points for qualified team in exact position)",
      "plural": "{points} Additional points for exact group stage position (total: {total} points for qualified team in exact position)"
    },
    "champion": {
      "singular": "{points} Point for champion",
      "plural": "{points} Points for champion"
    },
    "runnerUp": {
      "singular": "{points} Point for runner-up",
      "plural": "{points} Points for runner-up"
    },
    "thirdPlace": {
      "singular": "{points} Point for third place, if the tournament has a third-place match",
      "plural": "{points} Points for third place, if the tournament has a third-place match"
    },
    "individualAwards": {
      "singular": "{points} Point for each correct award (best player, goalkeeper, top scorer, etc.)",
      "plural": "{points} Points for each correct award (best player, goalkeeper, top scorer, etc.)"
    },
    "silverBoost": {
      "singular": "Silver Boost: You can select up to {count} match that will be worth double points (2x)",
      "plural": "Silver Boost: You can select up to {count} matches that will be worth double points (2x)"
    },
    "goldenBoost": {
      "singular": "Golden Boost: You can select up to {count} match that will be worth triple points (3x)",
      "plural": "Golden Boost: You can select up to {count} matches that will be worth triple points (3x)"
    },
    "boostTiming": "Boosts can only be applied before the match starts"
  },
  "constraints": {
    "matchPredictionTime": "You can change match predictions up to one hour before the match starts",
    "podiumPredictionTime": "You can modify podium and individual award predictions up to 2 days after the tournament starts",
    "singlePrediction": "Only one prediction per person is allowed, but it can be used in multiple groups"
  },
  "examples": {
    "winnerDraw": "Example: If you predict Argentina will beat Brazil and Argentina wins, you get 1 point. If you predict a draw and the match ends in a draw, you also get 1 point.",
    "exactScore": "Example: If you predict Argentina will win 2-1 against Brazil and the final score is exactly 2-1, you get 2 points (1 for the winner + 1 extra for the exact score).",
    "roundOf16": "Example: If you predict Argentina will qualify to the Round of 16 and they do qualify, you get 1 point for that qualified team.",
    "groupPosition": "Example: If you predict Argentina will finish first in Group A and they actually finish first, you get 2 additional points (1 for qualifying + 2 for exact position = 3 points total).",
    "champion": "Example: If you predict Argentina will be champion and Argentina wins the tournament, you get 5 points. If Argentina reaches the final but loses, you don't get the points.",
    "runnerUp": "Example: If you predict Brazil will be runner-up and Brazil loses the final, you get 3 points.",
    "thirdPlace": "Example: If you predict France will finish third and France wins the third-place match, you get 1 point.",
    "individualAwards": "Example: If you predict Lionel Messi will win the best player award and he wins it, you get 3 points. The same applies to other awards (goalkeeper, top scorer, etc.).",
    "matchPredictionTime": "Example: If a match starts at 3:00 PM, you can modify your prediction until 2:00 PM. After that time, the prediction is locked.",
    "podiumPredictionTime": "Example: If the tournament starts on June 1st, you can modify your champion, runner-up, and third-place predictions until June 3rd at 11:59 PM.",
    "singlePrediction": "Example: You can only have one active prediction, but that same prediction can be used in your friends' group, your office group, and any other group you join."
  },
  "actions": {
    "viewFullRules": "View Full Rules"
  }
}
```

### 2. Update i18n Configuration

**File:** `/i18n/request.ts`

Add `rules` to the messages import:

```typescript
messages: {
  common: (await import(`../locales/${locale}/common.json`)).default,
  navigation: (await import(`../locales/${locale}/navigation.json`)).default,
  auth: (await import(`../locales/${locale}/auth.json`)).default,
  groups: (await import(`../locales/${locale}/groups.json`)).default,
  emails: (await import(`../locales/${locale}/emails.json`)).default,
  validation: (await import(`../locales/${locale}/validation.json`)).default,
  errors: (await import(`../locales/${locale}/errors.json`)).default,
  onboarding: (await import(`../locales/${locale}/onboarding.json`)).default,
  predictions: (await import(`../locales/${locale}/predictions.json`)).default,
  rules: (await import(`../locales/${locale}/rules.json`)).default  // ADD THIS
}
```

### 3. Internationalize Rules Component

**File:** `/app/components/tournament-page/rules.tsx`

**Changes:**

1. Import `useTranslations` hook at the top
2. Initialize translation hooks:
   ```typescript
   const t = useTranslations('rules');
   const tRules = useTranslations('rules.rules');
   const tConstraints = useTranslations('rules.constraints');
   const tExamples = useTranslations('rules.examples');
   const tActions = useTranslations('rules.actions');
   ```

3. Replace hardcoded strings in `getRules()` function with proper pluralization:

**Pluralization Logic Details:**

All rules use conditional logic to select singular vs plural form. There are THREE different pluralization patterns:

**Pattern A: Based on `points` value (most rules)**
```typescript
game_correct_outcome_points === 1
  ? tRules('winnerDraw.singular', { points: game_correct_outcome_points })
  : tRules('winnerDraw.plural', { points: game_correct_outcome_points })
```
- Applies to: `winnerDraw`, `qualifiedTeam`, `champion`, `runnerUp`, `thirdPlace`, `individualAwards`

**Pattern B: Based on `bonus` value with multiple parameters (exactScore rule)**
```typescript
exactScoreBonus === 1
  ? tRules('exactScore.singular', { bonus: exactScoreBonus, total: game_exact_score_points })
  : tRules('exactScore.plural', { bonus: exactScoreBonus, total: game_exact_score_points })
```
- Has TWO parameters: `bonus` and `total`
- Pluralization depends on `bonus`, not `total`

**Pattern C: Based on `count` value (boost rules)**
```typescript
max_silver_games === 1
  ? tRules('silverBoost.singular', { count: max_silver_games })
  : tRules('silverBoost.plural', { count: max_silver_games })
```
- Uses `count` parameter instead of `points`
- Applies to: `silverBoost`, `goldenBoost`

**Pattern D: Based on `points` with additional `total` parameter (exactPosition rule)**
```typescript
exact_position_qualified_points === 1
  ? tRules('exactPosition.singular', {
      points: exact_position_qualified_points,
      total: qualified_team_points + exact_position_qualified_points
    })
  : tRules('exactPosition.plural', {
      points: exact_position_qualified_points,
      total: qualified_team_points + exact_position_qualified_points
    })
```
- Has TWO parameters: `points` and `total`
- Pluralization depends on `points`, not `total`

**Non-pluralized strings:**
- `tRules('boostTiming')` - No pluralization, just a simple string

4. Replace hardcoded strings in `constraints` array

5. Replace Card title: `t('title')`

6. Replace subheader: `t('status.youAreHere')`

7. Replace section titles: `t('sections.scoring')`, `t('sections.constraints')`

8. Replace button text: `tActions('viewFullRules')`

### 4. Internationalize Rules Examples Components

**Files:** All 11 components in `/app/components/tournament-page/rules-examples/`

**Explicit mapping of component files to translation keys:**

| Component File | Translation Key | Current Spanish Text (approx.) |
|---------------|-----------------|--------------------------------|
| `winner-draw.tsx` | `rules.examples.winnerDraw` | "Si predices que Argentina ganará..." |
| `exact-score.tsx` | `rules.examples.exactScore` | "Si predices que Argentina ganará 2-1..." |
| `round-of-16.tsx` | `rules.examples.roundOf16` | "Si predices que Argentina clasificará a octavos..." |
| `champion.tsx` | `rules.examples.champion` | "Si predices que Argentina será campeón..." |
| `runner-up.tsx` | `rules.examples.runnerUp` | "Si predices que Brasil será subcampeón..." |
| `third-place.tsx` | `rules.examples.thirdPlace` | "Si predices que Francia será tercero..." |
| `individual-awards.tsx` | `rules.examples.individualAwards` | "Si predices que Lionel Messi ganará..." |
| `match-prediction-time.tsx` | `rules.examples.matchPredictionTime` | "Si un partido comienza a las 15:00..." |
| `podium-prediction-time.tsx` | `rules.examples.podiumPredictionTime` | "Si el torneo comienza el 1 de junio..." |
| `single-prediction.tsx` | `rules.examples.singlePrediction` | "Solo puedes tener un pronostico activo..." |
| `group-position.tsx` | `rules.examples.groupPosition` | "Si predices que Argentina clasificará primero..." |

**Pattern for each component:**

```typescript
'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

export default function WinnerDrawExample() {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {t('winnerDraw')}
      </Typography>
    </Box>
  )
}
```

**Note:** All 11 components follow the same pattern - only the translation key changes based on the mapping table above.

### 5. Internationalize Bottom Navigation

**File:** `/app/components/tournament-bottom-nav/tournament-bottom-nav.tsx`

**Note:** This is a Client Component (has `'use client'` directive), so `useTranslations()` hook will work correctly.

**Changes:**

1. Import `useTranslations` hook at the top
2. Initialize translation hook inside component: `const t = useTranslations('navigation.bottomNav')`
3. Replace hardcoded labels in BottomNavigationAction components (lines 79-83):
   - "Home" → `t('home')`
   - "Tablas" → `t('results')`
   - "Reglas" → `t('rules')`
   - "Stats" → `t('stats')`
   - "Grupos" → `t('groups')`

**Also update navigation.json files:**

`/locales/es/navigation.json` - Add `bottomNav` section:
```json
{
  "header": {
    "home": "Inicio",
    "tournaments": "Torneos",
    "profile": "Perfil",
    "logout": "Cerrar sesión",
    "login": "Iniciar sesión"
  },
  "bottomNav": {
    "home": "Home",
    "results": "Tablas",
    "rules": "Reglas",
    "stats": "Stats",
    "groups": "Grupos"
  }
}
```

`/locales/en/navigation.json` - Add `bottomNav` section:
```json
{
  "header": {
    "home": "Home",
    "tournaments": "Tournaments",
    "profile": "Profile",
    "logout": "Log out",
    "login": "Log in"
  },
  "bottomNav": {
    "home": "Home",
    "results": "Tables",
    "rules": "Rules",
    "stats": "Stats",
    "groups": "Groups"
  }
}
```

### 6. Update Tests

**File:** `/app/components/tournament-page/rules.test.tsx`

**Changes:**

1. Wrap components with translation provider using `renderWithProviders()` from test utils
2. Update text assertions to use translation keys or verify dynamic translations
3. Add test cases for:
   - Pluralization logic (singular vs plural forms)
   - English translations
   - Rule examples display

**Testing pattern:**
```typescript
import { renderWithProviders } from '@/__tests__/utils/test-utils'

it('renders translated title', () => {
  renderWithProviders(<Rules scoringConfig={mockScoringConfig} />, { locale: 'es' })
  expect(screen.getByText('Reglas Generales')).toBeInTheDocument()
})

it('renders English title', () => {
  renderWithProviders(<Rules scoringConfig={mockScoringConfig} />, { locale: 'en' })
  expect(screen.getByText('General Rules')).toBeInTheDocument()
})
```

## Files to Create

1. `/locales/es/rules.json` - Spanish translations
2. `/locales/en/rules.json` - English translations

## Files to Modify

1. `/i18n/request.ts` - Add rules messages import
2. `/app/components/tournament-page/rules.tsx` - Internationalize main component
3. `/app/components/tournament-bottom-nav/tournament-bottom-nav.tsx` - Internationalize navigation labels
4. `/locales/es/navigation.json` - Add bottomNav section
5. `/locales/en/navigation.json` - Add bottomNav section
6. `/app/components/tournament-page/rules-examples/winner-draw.tsx` - Internationalize
7. `/app/components/tournament-page/rules-examples/exact-score.tsx` - Internationalize
8. `/app/components/tournament-page/rules-examples/round-of-16.tsx` - Internationalize
9. `/app/components/tournament-page/rules-examples/champion.tsx` - Internationalize
10. `/app/components/tournament-page/rules-examples/runner-up.tsx` - Internationalize
11. `/app/components/tournament-page/rules-examples/third-place.tsx` - Internationalize
12. `/app/components/tournament-page/rules-examples/individual-awards.tsx` - Internationalize
13. `/app/components/tournament-page/rules-examples/match-prediction-time.tsx` - Internationalize
14. `/app/components/tournament-page/rules-examples/podium-prediction-time.tsx` - Internationalize
15. `/app/components/tournament-page/rules-examples/single-prediction.tsx` - Internationalize
16. `/app/components/tournament-page/rules-examples/group-position.tsx` - Internationalize
17. `/app/components/tournament-page/rules.test.tsx` - Update tests for i18n

## Implementation Steps

### Phase 1: Create Translation Files (30 mins)
1. Create `/locales/es/rules.json` with all Spanish translations
2. Create `/locales/en/rules.json` with proper English translations
3. Update `/locales/es/navigation.json` with bottomNav section
4. Update `/locales/en/navigation.json` with bottomNav section
5. Update `/i18n/request.ts` to import rules messages

### Phase 2: Internationalize Main Rules Component (45 mins)
1. Add `useTranslations` imports to `rules.tsx`
2. Replace hardcoded strings in CardHeader (title, subheader)
3. Replace section titles (Calculo de puntos, Condiciones generales)
4. Update `getRules()` function with translation keys and pluralization
5. Update `constraints` array with translation keys
6. Replace button text with translated string

### Phase 3: Internationalize Rules Examples (60 mins)
1. Update all 11 rules-examples components
2. Add `useTranslations` hook to each
3. Replace hardcoded Spanish text with translation keys
4. Verify examples render correctly

### Phase 4: Internationalize Bottom Navigation (15 mins)
1. Add `useTranslations` to bottom nav component
2. Replace hardcoded labels with translation keys

### Phase 5: Update Tests (60 mins)
1. **Update existing tests in `rules.test.tsx`** (20 mins)
   - Import `renderWithProviders` from test utils
   - Replace all `renderWithTheme` calls with `renderWithProviders`
   - Update text assertions to match translated strings
   - Ensure all existing 8 tests still pass

2. **Add pluralization tests** (15 mins)
   - Test singular form (1 point scenarios)
   - Test plural form (2+ points scenarios)
   - Test boost pluralization (1 game vs multiple games)
   - Total: 6 new test cases

3. **Add English translation tests** (10 mins)
   - Test English title rendering
   - Test English rules rendering
   - Test English examples rendering
   - Total: 3 new test cases

4. **Add tests for all 11 rules examples** (10 mins)
   - Create test file: `rules-examples.test.tsx`
   - Test each example renders in Spanish
   - Test each example renders in English
   - Total: 22 test cases (11 components × 2 locales)

5. **Add bottom navigation tests** (5 mins)
   - Create or update `tournament-bottom-nav.test.tsx`
   - Test Spanish labels
   - Test English labels
   - Total: 2 test cases

**Expected total new test cases:** ~33 tests
**Expected coverage:** ≥80% on all modified files

### Phase 6: Manual Testing (30 mins)
1. Test `/es/rules` page - verify Spanish translations
2. Test `/en/rules` page - verify English translations
3. Test `/es/tournaments/{id}/rules` - verify tournament-specific rules
4. Test `/en/tournaments/{id}/rules` - verify English tournament rules
5. Test bottom navigation labels in both locales
6. Test pluralization edge cases (1 point vs 2 points)
7. Test boost rules display with different configurations

## Testing Strategy

### Unit Tests

**File:** `/app/components/tournament-page/rules.test.tsx`

**Test Coverage:**

1. **Translation rendering:**
   - Spanish title "Reglas Generales"
   - English title "General Rules"
   - Subheader "Estás aquí" / "You are here"
   - Section titles in both languages

2. **Pluralization:**
   - 1 point → singular form
   - 2+ points → plural form
   - Boost rules with 1 game vs multiple games

3. **Dynamic scoring:**
   - Different point configurations render correct translations
   - Boost rules only show when enabled
   - Exact score bonus calculated correctly

4. **Examples:**
   - Each example component renders translated text
   - Examples work in both Spanish and English

5. **Navigation:**
   - Bottom nav shows translated labels
   - Correct links generated with locale prefix

**Test utilities:**
- `renderWithProviders()` from `@/__tests__/utils/test-utils` (includes NextIntlClientProvider)
- Locale switching: `renderWithProviders(<Component />, { locale: 'en' })`

**New test file to create:**
- `/app/components/tournament-page/rules-examples.test.tsx` - Tests for all 11 example components

**Test file to create/update:**
- `/app/components/tournament-bottom-nav/tournament-bottom-nav.test.tsx` - Tests for bottom nav translations

**Coverage strategy:**
- Rules component: Already has 8 tests, adding ~15 more = ~23 total tests
- Rules examples: New file with 22 tests (11 components × 2 locales)
- Bottom nav: 2 tests for translation rendering
- **Total:** ~47 tests covering all translation functionality
- **Expected coverage:** 85-90% on modified code (exceeds 80% requirement)

### Manual Testing Checklist

- [ ] Navigate to `/es/rules` - verify Spanish content
- [ ] Navigate to `/en/rules` - verify English content
- [ ] Navigate to `/es/tournaments/test-id/rules` - verify tournament rules in Spanish
- [ ] Navigate to `/en/tournaments/test-id/rules` - verify tournament rules in English
- [ ] Bottom navigation shows "Reglas" in Spanish
- [ ] Bottom navigation shows "Rules" in English
- [ ] Click on each rule to expand examples
- [ ] Verify examples are translated correctly
- [ ] Test with different scoring configurations (0 boosts, 1 boost, multiple boosts)
- [ ] Verify pluralization works correctly (1 punto vs 2 puntos)

## Validation Considerations

### SonarCloud Requirements

1. **Code Coverage:** Maintain ≥80% on new/modified code
   - All translation keys should be covered by tests
   - Pluralization logic must be tested
   - Examples components need basic rendering tests

2. **Code Quality:**
   - No duplicated translation keys
   - Consistent key naming convention (camelCase)
   - No unused translation keys

3. **Security:**
   - All user-facing strings use translations (no XSS risk)
   - No hardcoded sensitive information

### Quality Gates

- ✅ All tests pass
- ✅ 80% coverage on modified files
- ✅ 0 new SonarCloud issues
- ✅ ESLint passes
- ✅ Build succeeds
- ✅ No console errors in browser

## Dependencies

- **Blocked by:** None
- **Blocks:** None
- **Related:** Other i18n translation stories (#151, #152, #153, #154, #156)

## Risks and Mitigations

### Risk 1: Pluralization complexity
**Impact:** Medium
**Mitigation:** Use simple conditional logic (points === 1 ? singular : plural) instead of complex i18n pluralization rules

### Risk 2: Long translation keys
**Impact:** Low
**Mitigation:** Organize translations hierarchically (rules.rules.*, rules.examples.*)

### Risk 3: Breaking existing tests
**Impact:** Medium
**Mitigation:** Update tests incrementally alongside component changes

## Open Questions

None - scope is well-defined from previous i18n stories.

## Success Metrics

- ✅ All Rules pages display correctly in both Spanish and English
- ✅ Pluralization works correctly for all dynamic point values
- ✅ All 11 rules examples are translated
- ✅ Bottom navigation shows translated labels
- ✅ 80% test coverage maintained
- ✅ 0 new SonarCloud issues

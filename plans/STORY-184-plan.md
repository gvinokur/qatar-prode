# Implementation Plan: Audit and Fix Hardcoded Point Values in Rules Examples (#184)

## Context

The rules examples in the internationalization files contain hardcoded point values, even though the actual rules are configurable via `ScoringConfig`. This creates a discrepancy where users see examples with default point values (e.g., "5 puntos" for champion) even when the tournament is configured with different values (e.g., 10 points for champion).

Additionally, the qualified teams constraint is missing from the constraints section, while other prediction types (podium, individual awards) have their time constraints documented.

**Current State Clarification:**
- ✅ **Rule LABELS are already parameterized** - The main rule descriptions (lines 10-42 in `rules.json`) correctly use `{points}` parameters and are passed via `getPluralized()` in `rules.tsx`
- ❌ **Rule EXAMPLES are hardcoded** - The example descriptions (lines 58-66 in `rules.json`) contain hardcoded values like "1 punto", "5 puntos", "3 puntos"
- ❌ **Example components don't receive props** - All 11 example components in `rules-examples/` directory render without parameters
- ❌ **Qualified teams constraint is missing** - Only 3 constraints exist (matchPredictionTime, podiumPredictionTime, singlePrediction)

**Problem:**
- **25+ hardcoded point values** across `locales/en/rules.json` and `locales/es/rules.json` in examples section
- Example components don't receive or pass parameters to translations
- Users see misleading examples that don't match actual tournament configuration
- Qualified teams prediction timing constraint is undocumented (should match podium timing: 2 days after tournament start)

**Why this matters:**
- Confuses users when examples show "5 puntos" but tournament awards 10 points
- Inconsistent UX: rule labels are dynamic but examples are hardcoded
- Missing documentation for qualified teams prediction deadline

## Objectives

1. Replace all hardcoded point values in translation examples with dynamic parameters
2. Update example components to pass `ScoringConfig` values to translations
3. Add qualified teams constraint to match individual awards constraint
4. Maintain clarity and readability of examples with dynamic values
5. Support pluralization (1 punto vs. N puntos)

## Acceptance Criteria

- [ ] All 8 scoring examples are parameterized (winnerDraw, exactScore, roundOf16, groupPosition, champion, runnerUp, thirdPlace, individualAwards)
- [ ] Examples correctly display tournament-specific point values
- [ ] Qualified teams constraint is added and displayed in constraints section
- [ ] Both English and Spanish translations are updated
- [ ] Examples remain clear and understandable with dynamic values
- [ ] Pluralization works correctly (1 punto vs 2 puntos)
- [ ] All tests pass
- [ ] Visual verification in dev environment confirms correct point values

## Technical Approach

### Phase 1: Update Translation Files (Parameterization)

**Files:**
- `locales/en/rules.json`
- `locales/es/rules.json`

**Strategy:**

For each example with hardcoded point values, convert to use `{paramName}` placeholders that next-intl will interpolate.

**Examples requiring parameterization:**

| Example Key | Parameters Needed | Config Source |
|-------------|-------------------|---------------|
| `winnerDraw` | `{points}` | `game_correct_outcome_points` |
| `exactScore` | `{total}`, `{correctOutcome}`, `{bonus}` | `game_exact_score_points`, `game_correct_outcome_points` |
| `roundOf16` | `{points}` | `qualified_team_points` |

**Example for exactScore with multiple parameters:**
```json
"exactScore": "Ejemplo: Si predices que Argentina ganará 2-1 contra Brasil y el resultado final es exactamente 2-1, obtienes {total} {total, plural, one {punto} other {puntos}} ({correctOutcome} por el ganador + {bonus} extra por el resultado exacto)."
```
This will render as: "obtienes 2 puntos (1 por el ganador + 1 extra por el resultado exacto)" with default config.
| `groupPosition` | `{qualifiedPoints}`, `{exactPositionPoints}`, `{totalPoints}` | `qualified_team_points`, `exact_position_qualified_points` |
| `champion` | `{points}` | `champion_points` |
| `runnerUp` | `{points}` | `runner_up_points` |
| `thirdPlace` | `{points}` | `third_place_points` |
| `individualAwards` | `{points}` | `individual_award_points` |

**Example transformation:**

**Before (Spanish):**
```json
"champion": "Ejemplo: Si predices que Argentina será campeón y efectivamente Argentina gana el torneo, obtienes 5 puntos."
```

**After (Spanish with parameterization):**
```json
"champion": "Ejemplo: Si predices que Argentina será campeón y efectivamente Argentina gana el torneo, obtienes {points} {points, plural, one {punto} other {puntos}}."
```

**Note on Pluralization:**
- Use ICU MessageFormat syntax: `{count, plural, one {singular} other {plural}}`
- This allows correct grammar: "1 punto" vs "2 puntos"
- next-intl automatically selects the correct form based on parameter value

**Note on EnOf() Markers:**
- English translations have `EnOf()` wrappers indicating "English version Of (Spanish content)"
- These are translation workflow markers, NOT a sign that parameterization exists
- Both English and Spanish examples currently have the same hardcoded values
- Parameterization should be added within the EnOf() wrappers for English

### Phase 2: Update Example Components

**Files (verified to exist):**
- `app/components/tournament-page/rules-examples/winner-draw.tsx` ✓
- `app/components/tournament-page/rules-examples/exact-score.tsx` ✓
- `app/components/tournament-page/rules-examples/round-of-16.tsx` ✓
- `app/components/tournament-page/rules-examples/group-position.tsx` ✓
- `app/components/tournament-page/rules-examples/champion.tsx` ✓
- `app/components/tournament-page/rules-examples/runner-up.tsx` ✓
- `app/components/tournament-page/rules-examples/third-place.tsx` ✓
- `app/components/tournament-page/rules-examples/individual-awards.tsx` ✓

**Current Pattern (no parameters):**
```typescript
export default function ChampionExample() {
  const t = useTranslations('rules.examples')
  return <Typography>{t('champion')}</Typography>  // No params passed
}
```

**New Pattern (with parameters):**
```typescript
interface ChampionExampleProps {
  readonly points: number;
}

export default function ChampionExample({ points }: ChampionExampleProps) {
  const t = useTranslations('rules.examples')
  return <Typography>{t('champion', { points })}</Typography>  // Params passed to translation
}
```

**How next-intl Handles This:**
- `t()` function accepts second parameter as object with values
- Translation string with `{points}` placeholder gets value interpolated
- ICU MessageFormat pluralization (`{points, plural, ...}`) works automatically
- This is standard next-intl behavior - confirmed working in `rules.tsx` for rule labels

**Changes for each component:**
1. Add interface for props with required config values
2. Accept props in function signature
3. Pass props to `t()` function as second argument

### Phase 3: Update Rules Component to Pass Props

**File:** `app/components/tournament-page/rules.tsx`

**Current Code (lines 94-129):**
```typescript
const baseRules: Rule[] = [
  {
    label: getPluralized('winnerDraw', config.game_correct_outcome_points,
      { points: config.game_correct_outcome_points }),
    component: <WinnerDrawExample />  // NO PROPS PASSED
  },
  // ... more rules
]
```

**Updated Code:**
```typescript
const baseRules: Rule[] = [
  {
    label: getPluralized('winnerDraw', config.game_correct_outcome_points,
      { points: config.game_correct_outcome_points }),
    component: <WinnerDrawExample points={config.game_correct_outcome_points} />
  },
  {
    label: getPluralized('exactScore', exactScoreBonus,
      { bonus: exactScoreBonus, total: config.game_exact_score_points }),
    component: <ExactScoreExample
      total={config.game_exact_score_points}
      correctOutcome={config.game_correct_outcome_points}
      bonus={exactScoreBonus}
    />
  },
  // ... continue for all 8 examples
]
```

**Exact Props Mapping:**

| Example Component | Props to Pass |
|-------------------|---------------|
| `WinnerDrawExample` | `points={config.game_correct_outcome_points}` |
| `ExactScoreExample` | `total={config.game_exact_score_points}`, `correctOutcome={config.game_correct_outcome_points}`, `bonus={exactScoreBonus}` |
| `RoundOf16Example` | `points={config.qualified_team_points}` |
| `GroupPositionExample` | `qualifiedPoints={config.qualified_team_points}`, `exactPositionPoints={config.exact_position_qualified_points}`, `totalPoints={config.qualified_team_points + config.exact_position_qualified_points}` |
| `ChampionExample` | `points={config.champion_points}` |
| `RunnerUpExample` | `points={config.runner_up_points}` |
| `ThirdPlaceExample` | `points={config.third_place_points}` |
| `IndividualAwardsExample` | `points={config.individual_award_points}` |

### Phase 4: Add Qualified Teams Constraint

**Rationale:**
The issue explicitly states "qualified teams constraint needs to be aligned with the individual awards constraint." Looking at the current constraints:
- `podiumPredictionTime`: "Se permite modificar pronosticos de podio y premios individuales luego hasta 2 dias despues del comienzo del torneo"
- This mentions BOTH podium AND individual awards timing
- Qualified teams predictions (group stage qualified teams) have the SAME 2-day deadline
- Currently there's no explicit documentation that qualified teams follow this timing
- Users may be confused whether qualified teams have the same deadline as podium/awards or a different one (like match predictions which are 1 hour before)

**Solution:** Add explicit constraint documenting that qualified teams predictions can be modified up to 2 days after tournament start, matching the podium/awards constraint.

**Files:**
- `locales/en/rules.json`
- `locales/es/rules.json`
- `app/components/tournament-page/rules.tsx`

**1. Add Translation Keys:**

**Spanish (`locales/es/rules.json`):**
```json
"constraints": {
  "matchPredictionTime": "Se permite cambiar los pronosticos de cada partido hasta una hora antes del mismo",
  "podiumPredictionTime": "Se permite modificar pronosticos de podio y premios individuales luego hasta 2 dias despues del comienzo del torneo",
  "qualifiedTeamsPredictionTime": "Se permite modificar pronosticos de equipos clasificados hasta 2 dias despues del comienzo del torneo",
  "singlePrediction": "No se permite mas de un pronostico por persona, pero el mismo se puede utilizar en multiples grupos"
}
```

**English (`locales/en/rules.json`):**
```json
"constraints": {
  "matchPredictionTime": "EnOf(Se permite cambiar los pronosticos de cada partido hasta una hora antes del mismo)",
  "podiumPredictionTime": "EnOf(Se permite modificar pronosticos de podio y premios individuales luego hasta 2 dias despues del comienzo del torneo)",
  "qualifiedTeamsPredictionTime": "EnOf(Se permite modificar pronosticos de equipos clasificados hasta 2 dias despues del comienzo del torneo)",
  "singlePrediction": "EnOf(No se permite mas de un pronostico por persona, pero el mismo se puede utilizar en multiples grupos)"
}
```

**2. Add Example Component:**

Create `app/components/tournament-page/rules-examples/qualified-teams-prediction-time.tsx`:

```typescript
'use client'

import { Box, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'

export default function QualifiedTeamsPredictionTimeExample() {
  const t = useTranslations('rules.examples')

  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {t('qualifiedTeamsPredictionTime')}
      </Typography>
    </Box>
  )
}
```

**3. Add Example Translation:**

**Spanish (`locales/es/rules.json`):**
```json
"examples": {
  // ... existing examples
  "qualifiedTeamsPredictionTime": "Ejemplo: Si el torneo comienza el 1 de junio, puedes modificar tus pronósticos de equipos clasificados hasta el 3 de junio a las 23:59."
}
```

**English (`locales/en/rules.json`):**
```json
"examples": {
  // ... existing examples
  "qualifiedTeamsPredictionTime": "EnOf(Ejemplo: Si el torneo comienza el 1 de junio, puedes modificar tus pronósticos de equipos clasificados hasta el 3 de junio a las 23:59.)"
}
```

**4. Update Rules Component:**

In `app/components/tournament-page/rules.tsx`, add to constraints array (after line 171):

```typescript
const constraints: Rule[] = [
  {
    label: tConstraints('matchPredictionTime'),
    component: <MatchPredictionTimeExample />
  },
  {
    label: tConstraints('podiumPredictionTime'),
    component: <PodiumPredictionTimeExample />
  },
  {
    label: tConstraints('qualifiedTeamsPredictionTime'),  // NEW (adding, not replacing)
    component: <QualifiedTeamsPredictionTimeExample />    // NEW
  },
  {
    label: tConstraints('singlePrediction'),
    component: <SinglePredictionExample />
  }
];
```

**Note:** This is a NEW constraint added alongside the existing `podiumPredictionTime` constraint. The qualified teams constraint provides explicit documentation, while the podium constraint continues to document both podium and individual awards timing.

**5. Update Import Statement:**

Add to imports at top of `rules.tsx`:
```typescript
import QualifiedTeamsPredictionTimeExample from './rules-examples/qualified-teams-prediction-time';
```

## Implementation Steps

### Step 1: Update Translation Files
1. Open `locales/es/rules.json`
2. Update all 8 example keys with parameterized versions (use ICU MessageFormat for pluralization)
3. Add `qualifiedTeamsPredictionTime` to constraints section
4. Add `qualifiedTeamsPredictionTime` to examples section
5. Repeat for `locales/en/rules.json` (keeping EnOf() wrappers)

### Step 2: Update Example Components
1. For each of the 8 example components in `app/components/tournament-page/rules-examples/`:
   - Add props interface
   - Update function signature to accept props
   - Pass props to `t()` function
2. Create new `qualified-teams-prediction-time.tsx` component

### Step 3: Update Rules Component
1. Open `app/components/tournament-page/rules.tsx`
2. Update `getRules()` function to pass props to each example component (lines 94-129)
3. Add import for `QualifiedTeamsPredictionTimeExample`
4. Add qualified teams constraint to constraints array (after line 171)

### Step 4: Manual Verification
1. Start dev server: `npm run dev`
2. Navigate to rules page
3. Verify examples show correct dynamic values
4. Test with different tournament configurations if possible
5. Check both English and Spanish translations

## Testing Strategy

### Unit Tests

**Existing Test Coverage:**
- `app/components/tournament-page/rules.test.tsx` already has comprehensive pluralization tests (lines 100-143)
- Tests verify that rule LABELS display correct point values with proper pluralization
- Tests use `renderWithTheme()` from test utilities

**Test Files to Update:**

1. **`app/components/tournament-page/rules.test.tsx`** (update existing - BUILD ON existing tests)
   - ADD: Test that examples receive correct props from config (new test suite)
   - ADD: Test with custom `ScoringConfig` values showing examples update (not just labels)
   - ADD: Verify example components render with parameterized translations
   - ADD: Test qualified teams constraint is displayed in constraints array
   - REUSE: Existing pluralization patterns for example tests

2. **`app/components/tournament-page/rules-examples.test.tsx`** (update existing)
   - UPDATE: Each example component test to verify props are accepted and passed
   - ADD: Test edge cases (0 points, 1 point, large numbers) for proper pluralization
   - ADD: Test that examples render correctly in both tooltip and expanded modes

**Test Scenarios:**

```typescript
describe('Rules Examples with Dynamic Values', () => {
  it('should display champion example with custom points', () => {
    const customConfig = { ...DEFAULT_SCORING, champion_points: 10 };
    render(<Rules scoringConfig={customConfig} />);

    // Should show "10 puntos" not "5 puntos"
    expect(screen.getByText(/10 puntos/)).toBeInTheDocument();
    expect(screen.queryByText(/5 puntos/)).not.toBeInTheDocument();
  });

  it('should handle singular pluralization correctly', () => {
    const customConfig = { ...DEFAULT_SCORING, third_place_points: 1 };
    render(<Rules scoringConfig={customConfig} />);

    // Should show "1 punto" not "1 puntos"
    expect(screen.getByText(/1 punto/)).toBeInTheDocument();
  });

  it('should show qualified teams constraint', () => {
    render(<Rules />);
    expect(screen.getByText(/equipos clasificados/)).toBeInTheDocument();
  });
});
```

### Manual Testing Checklist

- [ ] Examples display default point values correctly
- [ ] Examples update when different `ScoringConfig` is passed
- [ ] Pluralization works (1 punto vs N puntos)
- [ ] Qualified teams constraint appears in constraints section
- [ ] Qualified teams example expands/collapses in fullpage mode
- [ ] Both English and Spanish translations work
- [ ] No console errors or warnings
- [ ] Tooltips show examples correctly in card mode
- [ ] Examples expand correctly in fullpage mode

## Files to Create/Modify

### Files to Modify (11 files)

| File | Changes |
|------|---------|
| `locales/es/rules.json` | Parameterize 8 examples, add qualified teams constraint + example |
| `locales/en/rules.json` | Parameterize 8 examples, add qualified teams constraint + example |
| `app/components/tournament-page/rules.tsx` | Pass props to 8 example components, add qualified teams constraint |
| `app/components/tournament-page/rules-examples/winner-draw.tsx` | Add props interface, accept props, pass to translation |
| `app/components/tournament-page/rules-examples/exact-score.tsx` | Add props interface, accept props, pass to translation |
| `app/components/tournament-page/rules-examples/round-of-16.tsx` | Add props interface, accept props, pass to translation |
| `app/components/tournament-page/rules-examples/group-position.tsx` | Add props interface, accept props, pass to translation |
| `app/components/tournament-page/rules-examples/champion.tsx` | Add props interface, accept props, pass to translation |
| `app/components/tournament-page/rules-examples/runner-up.tsx` | Add props interface, accept props, pass to translation |
| `app/components/tournament-page/rules-examples/third-place.tsx` | Add props interface, accept props, pass to translation |
| `app/components/tournament-page/rules-examples/individual-awards.tsx` | Add props interface, accept props, pass to translation |

### Files to Create (1 file)

| File | Purpose |
|------|---------|
| `app/components/tournament-page/rules-examples/qualified-teams-prediction-time.tsx` | New example component for qualified teams constraint |

### Test Files to Update (2 files)

| File | Changes |
|------|---------|
| `app/components/tournament-page/rules.test.tsx` | Add tests for parameterized examples, qualified teams constraint |
| `app/components/tournament-page/rules-examples.test.tsx` | Update tests for all example components with props |

## Validation & Quality Gates

### Pre-Commit Validation (MANDATORY)

1. **Run tests:** `npm test` (must pass)
2. **Run linter:** `npm run lint` (0 errors)
3. **Run build:** `npm run build` (must succeed)

### SonarCloud Requirements

- **80% coverage on new code** (adding tests for parameterized examples)
- **0 new issues** (any severity)
- Focus on test coverage for:
  - Updated example components with props
  - Updated Rules component prop passing
  - New qualified teams constraint

### Visual Verification

After deployment to Vercel Preview:
1. Navigate to `/[locale]/tournaments/[id]/rules`
2. Verify examples show correct point values from tournament config
3. Test with multiple tournaments if available (different configs)
4. Check qualified teams constraint appears
5. Test both English and Spanish locales

## Edge Cases & Considerations

1. **Pluralization:**
   - Handle 1 punto vs N puntos correctly
   - Use ICU MessageFormat: `{count, plural, one {punto} other {puntos}}`

2. **Default vs Custom Config:**
   - Examples should work with default config (backward compatibility)
   - Examples should update with custom tournament configs

3. **Translation Pending (EnOf markers):**
   - English translations still have `EnOf()` markers
   - Parameterization should work within EnOf() wrappers
   - Example: `EnOf(... {points} ...)`

4. **Exact Score Calculation:**
   - `exactScoreBonus` is calculated: `game_exact_score_points - game_correct_outcome_points`
   - Example needs 3 params: `total`, `correctOutcome`, `bonus`

5. **Group Position Complex Example:**
   - Shows multiple values: qualified points, exact position bonus, and total
   - Needs 3 params: `qualifiedPoints`, `exactPositionPoints`, `totalPoints`

6. **Boost Rules:**
   - Currently have NO examples (silverBoost, goldenBoost, boostTiming)
   - Out of scope for this story (not in requirements)

## Dependencies

- **next-intl:** Already in use, no new dependencies
- **Material-UI:** Already in use for example components
- **Existing test utilities:** Use `renderWithTheme()` from `@/__tests__/utils/test-utils`

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Pluralization breaks with ICU MessageFormat | Test with values 0, 1, 2+ to verify |
| English translations still have EnOf() markers | Keep markers, parameterize content within |
| Breaking existing tests | Update tests incrementally, run after each change |
| Examples become less readable | Review example text for clarity after parameterization |

## Out of Scope

- Parameterizing constraint time values (1 hour, 2 days) - not in ScoringConfig
- Adding examples for boost rules (silverBoost, goldenBoost)
- Translating EnOf() marked English content (separate i18n effort)
- Creating UI for editing ScoringConfig in backoffice

## Success Metrics

- ✅ All 8 examples parameterized and display dynamic values
- ✅ Qualified teams constraint added and visible
- ✅ 80%+ test coverage on new/modified code
- ✅ 0 new SonarCloud issues
- ✅ Visual verification confirms correct point values
- ✅ Both language files updated consistently

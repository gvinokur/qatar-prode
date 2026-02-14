# Implementation Plan: Dynamic Tournament Configuration in Onboarding Flow

**Story:** #135 - [UXI] Dynamic Tournament Configuration in Onboarding Flow

## Story Context

Currently, the onboarding flow displays hardcoded default values for:
- Points section: Fixed scoring values (2 pts exact score, 1 pt correct outcome, etc.)
- Boosts section: Generic multiplier explanations (×2 silver, ×3 golden)

This creates confusion when tournaments use different configurations. The goal is to make onboarding display the actual configuration of the active tournament the user will be playing.

## Acceptance Criteria

### Points Section
- [ ] Points section displays tournament-specific scoring values when active tournament exists
- [ ] Falls back to default values gracefully when no active tournament
- [ ] Disclaimer mentions specific tournament name when available
- [ ] All 8 scoring categories reflect tournament config:
  1. Game exact score points
  2. Game correct outcome points
  3. Champion points
  4. Runner-up points
  5. Third place points
  6. Individual award points
  7. Qualified team points (team qualifies, wrong position)
  8. Exact position qualified points (team qualifies, exact position)

### Boosts Section
- [ ] Boost step is hidden entirely when tournament has boosts disabled
- [ ] Boost step shows specific counts when enabled
- [ ] Progress bar and step count adjust dynamically (4 vs 5 steps)
- [ ] Multiplier explanations (×2, ×3) remain unchanged

### Tournament Loading
- [ ] Uses existing `findAllActiveTournaments(userId)` for access control
- [ ] Respects dev_only flag and user permissions
- [ ] Selects first active tournament when multiple exist
- [ ] Handles no active tournaments gracefully

### Visual Polish
- [ ] No layout shifts when tournament data loads
- [ ] Values align properly in cards/tables
- [ ] Tournament name displayed when available

## Visual Prototypes

### Scoring Explanation Step - Before vs After

**BEFORE (Current - Hardcoded):**
```
┌─────────────────────────────────────────────────┐
│     ¿Cómo se Calcula el Puntaje?                │
├─────────────────────────────────────────────────┤
│                                                  │
│  ⚽ Partidos                                     │
│  ⭐ Resultado exacto ............... [2 pts]    │
│  ✓  Resultado correcto ............ [1 pt]     │
│                                                  │
│  🏆 Torneo                                       │
│  🥇 Campeón ....................... [5 pts]    │
│  🥈 Subcampeón .................... [3 pts]    │
│  🥉 Tercer lugar .................. [1 pt]     │
│                                                  │
│  ⭐ Premios Individuales                         │
│  Por cada premio correcto ......... [3 pts]    │
│                                                  │
│  👥 Clasificación                                │
│  Posición exacta + clasificado .... [1 pt]     │
│  Clasificado (posición incorrecta). [1 pt]     │
│                                                  │
│  ⓘ Importante                                   │
│  Los valores de puntaje pueden variar según     │
│  el torneo. Los valores mostrados son típicos.  │
└─────────────────────────────────────────────────┘
```

**AFTER (Dynamic - With Active Tournament):**
```
┌─────────────────────────────────────────────────┐
│     ¿Cómo se Calcula el Puntaje?                │
├─────────────────────────────────────────────────┤
│                                                  │
│  ⚽ Partidos                                     │
│  ⭐ Resultado exacto ............... [3 pts] ← │
│  ✓  Resultado correcto ............ [2 pts] ← │
│                                                  │
│  🏆 Torneo                                       │
│  🥇 Campeón ....................... [10 pts] ← │
│  🥈 Subcampeón .................... [5 pts] ←  │
│  🥉 Tercer lugar .................. [2 pts] ←  │
│                                                  │
│  ⭐ Premios Individuales                         │
│  Por cada premio correcto ......... [5 pts] ←  │
│                                                  │
│  👥 Clasificación                                │
│  Posición exacta + clasificado .... [2 pts] ←  │
│  Clasificado (posición incorrecta). [1 pt]     │
│                                                  │
│  ⓘ Configuración de Copa del Mundo 2026         │
│  Estos son los valores de puntaje para este     │
│  torneo específico.                              │
└─────────────────────────────────────────────────┘

Legend: ← = Dynamic value from tournament config
```

**AFTER (Fallback - No Active Tournament):**
```
Same as BEFORE, keeps hardcoded defaults
Generic disclaimer remains
```

### Boost Introduction Step - Before vs After

**BEFORE (Current - Vague Language):**
```
┌─────────────────────────────────────────────────┐
│   Multiplica Tus Puntos con Boosts              │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌───────────────────────────────────────┐     │
│  │ 🥈 Boost Plateado                     │     │
│  │                                        │     │
│  │ Multiplica × 2                         │     │
│  │ Duplica tus puntos en el partido       │     │
│  │ que elijas                             │     │
│  │                                        │     │
│  │ [Cantidad limitada por torneo]         │     │
│  └───────────────────────────────────────┘     │
│                                                  │
│  ┌───────────────────────────────────────┐     │
│  │ 🔥 Boost Dorado                        │     │
│  │                                        │     │
│  │ Multiplica × 3                         │     │
│  │ Triplica tus puntos en tu partido      │     │
│  │ más importante                         │     │
│  │                                        │     │
│  │ [Muy escaso - ¡úsalo sabiamente!]     │     │
│  └───────────────────────────────────────┘     │
│                                                  │
│  ⓘ Puntos Importantes:                          │
│  • Los boosts son específicos de cada torneo    │
│  • Solo aplican a predicciones de partidos      │
│  • Puedes cambiarlos hasta 1 hora antes         │
│  • Cada torneo tiene cantidades limitadas       │
└─────────────────────────────────────────────────┘
```

**AFTER (Dynamic - Specific Counts):**
```
┌─────────────────────────────────────────────────┐
│   Multiplica Tus Puntos con Boosts              │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌───────────────────────────────────────┐     │
│  │ 🥈 Boost Plateado                     │     │
│  │                                        │     │
│  │ Multiplica × 2                         │     │
│  │ Duplica tus puntos en el partido       │     │
│  │ que elijas                             │     │
│  │                                        │     │
│  │ [Tienes 5 boosts disponibles] ←       │     │
│  │ [por torneo]                   ←       │     │
│  └───────────────────────────────────────┘     │
│                                                  │
│  ┌───────────────────────────────────────┐     │
│  │ 🔥 Boost Dorado                        │     │
│  │                                        │     │
│  │ Multiplica × 3                         │     │
│  │ Triplica tus puntos en tu partido      │     │
│  │ más importante                         │     │
│  │                                        │     │
│  │ [Tienes 2 boosts disponibles] ←       │     │
│  │ [por torneo]                   ←       │     │
│  └───────────────────────────────────────┘     │
│                                                  │
│  ⓘ Configuración para Copa del Mundo 2026       │
│  • Los boosts son específicos de cada torneo    │
│  • Solo aplican a predicciones de partidos      │
│  • Puedes cambiarlos hasta 1 hora antes         │
└─────────────────────────────────────────────────┘

Legend: ← = Dynamic count from tournament config
```

**AFTER (Boosts Disabled - STEP HIDDEN):**
```
[Boost step not shown at all]

Onboarding flow:
1. Welcome
2. Sample Prediction
3. Scoring Explanation
4. Checklist  ← (was step 5, now step 4)

Progress bar shows "4/4" instead of "5/5"
```

### Onboarding Progress Bar - Dynamic Step Count

**With Boosts Enabled (5 steps):**
```
═══════════════════════════════════════════
▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░  20%
Paso 1 de 5
```

**With Boosts Disabled (4 steps):**
```
═══════════════════════════════════════════
▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░  25%
Paso 1 de 4
```

### State Variations

**Loading State (Not applicable):**
- No loading state needed - tournament data loaded server-side
- Component renders immediately with data or defaults
- No skeleton loaders, no spinners

**Error State (Not applicable):**
- If `getTournaments()` fails, returns empty array
- Component treats as "no active tournaments"
- Falls back to default values gracefully

**Edge Case - Singular Boost:**
```
Tournament has max_silver_games: 1, max_golden_games: 1

Display:
[Tienes 1 boost disponible por torneo]  ← Singular form
(Not "boosts")
```

### Responsive Considerations

**Desktop/Tablet/Mobile:**
- No responsive changes needed
- Existing onboarding layout already responsive
- Only text content changes (values and labels)
- Cards, spacing, alignment unchanged

## Technical Approach

### Architecture Decision: Server Component vs Client Component

**Current State:**
- `OnboardingTrigger` is a client component (uses useState, useEffect)
- `OnboardingDialog` is a client component (manages state, navigation)
- Both scoring and boost steps are client components

**Options Considered:**

1. **Option A: Keep everything client-side, fetch tournament via server action**
   - Add `getTournamentConfig()` server action
   - Call it from `OnboardingTrigger` on mount
   - Pass tournament down through props
   - ❌ Adds extra network request after page load
   - ❌ Risk of layout shift when data arrives
   - ❌ Complicates loading states

2. **Option B: Make OnboardingTrigger a server component** (RECOMMENDED)
   - Load tournament in `OnboardingTrigger` (server component)
   - Pass tournament to `OnboardingDialog` (client component)
   - Scoring/boost steps remain client components
   - ✅ No extra network request
   - ✅ No layout shifts (data ready before render)
   - ✅ Leverages existing server-side auth
   - ✅ Follows Next.js 15 patterns (server by default)

**Decision: Option B**

### Implementation Steps

#### 1. Convert OnboardingTrigger to Server Component

**File:** `app/components/onboarding/onboarding-trigger.tsx`

**Changes:**
- Remove `'use client'` directive
- Remove React hooks (useState, useEffect)
- Import and call `getTournaments()` server action
- Select first active tournament (if available)
- Pass tournament to `OnboardingDialog` as prop
- Remove delay logic (dialog opens immediately now)

**Rationale:**
- Server components can fetch data directly
- No need for client-side hooks for data fetching
- The 500ms delay was for page render - no longer needed since we're server-side

**New signature:**
```typescript
export default async function OnboardingTrigger() {
  const tournaments = await getTournaments()
  const activeTournament = tournaments[0] // First active tournament

  return <OnboardingDialog open={true} onClose={...} tournament={activeTournament} />
}
```

**Edge cases:**
- No active tournaments → `tournament` will be `undefined`, components handle gracefully

#### 2. Update OnboardingDialog to Accept Tournament Prop

**File:** `app/components/onboarding/onboarding-dialog.tsx`

**Changes:**
- Add `tournament?: Tournament` prop
- Determine if boosts are enabled: `hasBoosts = (tournament?.max_silver_games ?? 0) > 0 || (tournament?.max_golden_games ?? 0) > 0`
- Dynamically build `STEP_ORDER` array:
  ```typescript
  const STEP_ORDER: OnboardingStep[] = [
    'welcome',
    'prediction',
    'scoring',
    ...(hasBoosts ? ['boost' as OnboardingStep] : []),
    'checklist'
  ]
  ```
- Pass `tournament` to `<ScoringExplanationStep>` and `<BoostIntroductionStep>`

**Why dynamic step order:**
- Progress bar must reflect actual step count (4 vs 5 steps)
- Step indices must be correct for "Atrás" button navigation
- Progress percentage calculation uses `STEP_ORDER.length`

**Alternative considered:**
- Keep all 5 steps, conditionally render boost step content
- ❌ Progress bar would show 5 steps even when boost is hidden
- ❌ Confusing UX (step 4/5 then suddenly 5/5 without step 4 content)

#### 3. Update ScoringExplanationStep Component

**File:** `app/components/onboarding/onboarding-steps/scoring-explanation-step.tsx`

**Changes:**
- Add `tournament?: Tournament` prop
- Import `DEFAULT_SCORING` from `tournament-page/rules.tsx` for fallback values
- Replace hardcoded values with tournament config:
  ```typescript
  const points = {
    gameExact: tournament?.game_exact_score_points ?? DEFAULT_SCORING.game_exact_score_points,
    gameOutcome: tournament?.game_correct_outcome_points ?? DEFAULT_SCORING.game_correct_outcome_points,
    champion: tournament?.champion_points ?? DEFAULT_SCORING.champion_points,
    runnerUp: tournament?.runner_up_points ?? DEFAULT_SCORING.runner_up_points,
    thirdPlace: tournament?.third_place_points ?? DEFAULT_SCORING.third_place_points,
    individualAward: tournament?.individual_award_points ?? DEFAULT_SCORING.individual_award_points,
    qualifiedTeam: tournament?.qualified_team_points ?? DEFAULT_SCORING.qualified_team_points,
    exactPosition: tournament?.exact_position_qualified_points ?? DEFAULT_SCORING.exact_position_qualified_points,
  }
  ```
- Update all `<Chip>` labels to use dynamic values: `label={`${points.gameExact} pts`}`
- Update disclaimer:
  ```typescript
  {tournament ? (
    <AlertTitle>Configuración de {tournament.long_name || tournament.short_name}</AlertTitle>
    <Typography variant="body2">
      Estos son los valores de puntaje para este torneo específico.
    </Typography>
  ) : (
    <AlertTitle>Importante</AlertTitle>
    <Typography variant="body2">
      Los valores de puntaje pueden variar según el torneo. Los valores mostrados son típicos.
    </Typography>
  )}
  ```

**Specific line changes:**
- Line 36: Exact score chip → `label={`${points.gameExact} pts`}`
- Line 44: Correct outcome chip → `label={`${points.gameOutcome} pt${points.gameOutcome === 1 ? '' : 's'}`}`
- Line 61: Champion chip → `label={`${points.champion} pts`}`
- Line 66: Runner-up chip → `label={`${points.runnerUp} pts`}`
- Line 71: Third place chip → `label={`${points.thirdPlace} pt${points.thirdPlace === 1 ? '' : 's'}`}`
- Line 87: Individual awards chip → `label={`${points.individualAward} pts`}`
- Line 116: **Exact position + qualified chip** → `label={`${points.exactPosition + points.qualifiedTeam} pt${(points.exactPosition + points.qualifiedTeam) === 1 ? '' : 's'}`}`
- Line 121: **Qualified (wrong position) chip** → `label={`${points.qualifiedTeam} pt${points.qualifiedTeam === 1 ? '' : 's'}`}`
- Lines 127-130: Alert component (update disclaimer)

**Important Clarification:**
The "Clasificación" section has TWO separate point values that must be displayed independently:
1. **Exact position + qualified**: Uses `qualified_team_points` + `exact_position_qualified_points` (total)
2. **Qualified (wrong position)**: Uses `qualified_team_points` only

Current hardcoded values show both as "1 pt", but tournament config may differ (e.g., 1 pt for qualified, 2 pts bonus for exact position = 3 pts total for exact)

#### 4. Update BoostIntroductionStep Component

**File:** `app/components/onboarding/onboarding-steps/boost-introduction-step.tsx`

**Changes:**
- Add `tournament?: Tournament` prop
- Extract boost counts:
  ```typescript
  const silverBoosts = tournament?.max_silver_games ?? 0
  const goldenBoosts = tournament?.max_golden_games ?? 0
  ```
- Update silver boost card (line 34-41):
  ```typescript
  <Chip
    label={`Tienes ${silverBoosts} ${silverBoosts === 1 ? 'boost' : 'boosts'} disponible${silverBoosts === 1 ? '' : 's'} por torneo`}
    size="small"
    sx={{ mt: 1.5 }}
    color="default"
    variant="outlined"
  />
  ```
- Update golden boost card (line 59-66):
  ```typescript
  <Chip
    label={`Tienes ${goldenBoosts} ${goldenBoosts === 1 ? 'boost' : 'boosts'} disponible${goldenBoosts === 1 ? '' : 's'} por torneo`}
    size="small"
    sx={{ mt: 1.5 }}
    color="warning"
    variant="outlined"
  />
  ```
- Update info alert to mention tournament (if available):
  ```typescript
  {tournament && (
    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
      Configuración para {tournament.long_name || tournament.short_name}:
    </Typography>
  )}
  ```

**Note:** Multiplier values (×2, ×3) remain hardcoded as these are business rules, not configuration.

#### 5. Handle Edge Cases

**No Active Tournament:**
- `OnboardingTrigger` passes `undefined` as tournament
- Both steps fall back to `DEFAULT_SCORING` values
- Generic disclaimer shown: "Los valores pueden variar según el torneo"

**Multiple Active Tournaments:**
- Use first tournament in list: `tournaments[0]`
- This is consistent with user's likely first tournament experience
- Future enhancement: Allow user to select which tournament

**Dev-Only Tournaments:**
- `getTournaments()` already handles permissions via `findAllActiveTournaments(userId)`
- Production users automatically filtered to see only accessible tournaments
- No additional logic needed

**Boosts Disabled:**
- Boost step excluded from `STEP_ORDER` array
- Progress bar shows 4 steps total
- Navigation indices automatically correct

## Files to Create/Modify

### Modify
1. **`app/components/onboarding/onboarding-trigger.tsx`**
   - Convert to server component
   - Load tournaments via `getTournaments()`
   - Pass tournament to dialog

2. **`app/components/onboarding/onboarding-dialog.tsx`**
   - Accept `tournament?: Tournament` prop
   - Dynamically build `STEP_ORDER` based on boosts
   - Pass tournament to child steps

3. **`app/components/onboarding/onboarding-steps/scoring-explanation-step.tsx`**
   - Accept `tournament?: Tournament` prop
   - Use dynamic scoring values
   - Update disclaimer with tournament name

4. **`app/components/onboarding/onboarding-steps/boost-introduction-step.tsx`**
   - Accept `tournament?: Tournament` prop
   - Display specific boost counts
   - Update with tournament context

### No New Files
- All changes use existing infrastructure
- Existing patterns from `rules.tsx` for dynamic config

## Testing Strategy

### Unit Tests

#### 1. OnboardingTrigger Tests (`onboarding-trigger.test.tsx`)
- **Update existing tests:**
  - Remove timer-based tests (no longer has delay)
  - Mock `getTournaments()` server action
  - Test tournament is passed to dialog
  - Test undefined tournament when no active tournaments

- **New test cases:**
  ```typescript
  describe('Tournament loading', () => {
    it('passes first active tournament to dialog', async () => {
      // Mock getTournaments to return tournaments
      // Render OnboardingTrigger
      // Assert dialog receives tournament[0]
    })

    it('handles no active tournaments gracefully', async () => {
      // Mock getTournaments to return []
      // Render OnboardingTrigger
      // Assert dialog receives undefined
    })

    it('uses first tournament when multiple active', async () => {
      // Mock getTournaments with 2+ tournaments
      // Render OnboardingTrigger
      // Assert dialog receives first one
    })
  })
  ```

#### 2. OnboardingDialog Tests (`onboarding-dialog.test.tsx`)
- **Update existing tests:**
  - Pass `tournament` prop in test renders
  - Test dynamic step order

- **New test cases:**
  ```typescript
  describe('Dynamic step order', () => {
    it('includes boost step when boosts enabled', () => {
      const tournament = { ...mockTournament, max_silver_games: 5 }
      render(<OnboardingDialog tournament={tournament} />)
      // Assert STEP_ORDER.length === 5
      // Assert boost step is included
    })

    it('excludes boost step when boosts disabled', () => {
      const tournament = { ...mockTournament, max_silver_games: 0, max_golden_games: 0 }
      render(<OnboardingDialog tournament={tournament} />)
      // Assert STEP_ORDER.length === 4
      // Assert boost step not in order
    })

    it('handles undefined tournament', () => {
      render(<OnboardingDialog tournament={undefined} />)
      // Should render without errors
      // Boost step excluded by default
    })
  })
  ```

#### 3. ScoringExplanationStep Tests (NEW: `scoring-explanation-step.test.tsx`)
- **Test cases:**
  ```typescript
  describe('ScoringExplanationStep', () => {
    it('displays tournament-specific values', () => {
      const tournament = testFactories.tournament({
        game_exact_score_points: 3,
        game_correct_outcome_points: 2,
        champion_points: 10
      })
      render(<ScoringExplanationStep tournament={tournament} />)
      expect(screen.getByText('3 pts')).toBeInTheDocument() // Exact score
      expect(screen.getByText('2 pts')).toBeInTheDocument() // Outcome
      expect(screen.getByText('10 pts')).toBeInTheDocument() // Champion
    })

    it('falls back to default values when no tournament', () => {
      render(<ScoringExplanationStep tournament={undefined} />)
      expect(screen.getByText('2 pts')).toBeInTheDocument() // Default exact
      expect(screen.getByText('1 pt')).toBeInTheDocument() // Default outcome
      expect(screen.getByText('5 pts')).toBeInTheDocument() // Default champion
    })

    it('displays tournament name in disclaimer', () => {
      const tournament = testFactories.tournament({ long_name: 'Copa del Mundo 2026' })
      render(<ScoringExplanationStep tournament={tournament} />)
      expect(screen.getByText(/Copa del Mundo 2026/)).toBeInTheDocument()
    })

    it('shows generic disclaimer when no tournament', () => {
      render(<ScoringExplanationStep tournament={undefined} />)
      expect(screen.getByText(/Los valores de puntaje pueden variar/)).toBeInTheDocument()
    })

    it('displays qualifier points correctly', () => {
      const tournament = testFactories.tournament({
        qualified_team_points: 1,
        exact_position_qualified_points: 2
      })
      render(<ScoringExplanationStep tournament={tournament} />)
      // Exact position + qualified = 1 + 2 = 3 pts
      expect(screen.getByText('3 pts')).toBeInTheDocument()
      // Qualified (wrong position) = 1 pt
      expect(screen.getByText('1 pt')).toBeInTheDocument()
    })
  })
  ```

#### 4. BoostIntroductionStep Tests (NEW: `boost-introduction-step.test.tsx`)
- **Test cases:**
  ```typescript
  describe('BoostIntroductionStep', () => {
    it('displays tournament-specific boost counts', () => {
      const tournament = testFactories.tournament({ max_silver_games: 5, max_golden_games: 2 })
      render(<BoostIntroductionStep tournament={tournament} />)
      expect(screen.getByText(/Tienes 5 boosts disponibles/)).toBeInTheDocument()
      expect(screen.getByText(/Tienes 2 boosts disponibles/)).toBeInTheDocument()
    })

    it('handles singular boost count', () => {
      const tournament = testFactories.tournament({ max_silver_games: 1, max_golden_games: 1 })
      render(<BoostIntroductionStep tournament={tournament} />)
      expect(screen.getByText(/Tienes 1 boost disponible/)).toBeInTheDocument()
    })

    it('displays tournament name in context', () => {
      const tournament = testFactories.tournament({ long_name: 'Copa América 2024', max_silver_games: 3 })
      render(<BoostIntroductionStep tournament={tournament} />)
      expect(screen.getByText(/Copa América 2024/)).toBeInTheDocument()
    })
  })
  ```

### Test Utilities Required

**Mock Data:**
Use existing `testFactories.tournament()` from `__tests__/db/test-factories.ts`:
```typescript
// In test files:
import { testFactories } from '@/__tests__/db/test-factories'

// Default tournament (uses DEFAULT_SCORING values)
const defaultTournament = testFactories.tournament()

// Custom scoring tournament
const customTournament = testFactories.tournament({
  game_exact_score_points: 3,
  game_correct_outcome_points: 2,
  champion_points: 10,
  qualified_team_points: 1,
  exact_position_qualified_points: 2, // Total: 3 pts for exact position
})

// Boosts disabled tournament
const noBoostsTournament = testFactories.tournament({
  max_silver_games: 0,
  max_golden_games: 0
})
```

**Note**: `testFactories.tournament()` already exists with all necessary fields. No need to create new factory - use existing one with overrides for test cases.

**Mock Server Actions:**
```typescript
// Mock getTournaments in tests
vi.mock('../../actions/tournament-actions', () => ({
  getTournaments: vi.fn()
}))

// In test setup
const mockGetTournaments = vi.mocked(getTournaments)
mockGetTournaments.mockResolvedValue([testFactories.tournament()])
```

### Integration Testing Scenarios

**Manual Testing Checklist:**
1. ✅ Test with active public tournament → Shows tournament config
2. ✅ Test with no active tournaments → Shows default values
3. ✅ Test with tournament with boosts enabled → Shows 5 steps with counts
4. ✅ Test with tournament with boosts disabled → Shows 4 steps, no boost step
5. ✅ Test in production as regular user → Only sees permitted tournaments
6. ✅ Test in production as dev user → Sees dev tournaments with permission
7. ✅ Test with multiple active tournaments → Uses first tournament
8. ✅ Test progress bar with 4 steps vs 5 steps
9. ✅ Test navigation (Atrás button) works correctly in both flows
10. ✅ Test with `?showOnboarding=true` URL parameter

## Quality Gates

### SonarCloud Requirements
- **Coverage:** ≥80% on new/modified code
- **New Issues:** 0 issues of any severity
- **Security:** No vulnerabilities
- **Code Smells:** Address all new code smells

### Testing Targets
- **Unit test coverage:** 100% on modified components
- **Edge cases:** All edge cases covered (no tournament, boosts disabled, etc.)
- **Regression:** Existing onboarding tests still pass

### Performance
- **No layout shifts:** Server-side data loading prevents CLS
- **No extra network requests:** Tournament loaded in server component
- **Fast initial render:** No client-side fetching delay

## Validation Considerations

### Pre-Commit Validation
1. **Run tests:** `npm test` (all tests must pass)
2. **Run lint:** `npm run lint` (no new warnings)
3. **Run build:** `npm run build` (TypeScript compilation succeeds)
4. **Check coverage:** Review coverage report for ≥80% on new code

### Manual Verification
1. **Test onboarding flow:** Visit `/?showOnboarding=true`
2. **Verify dynamic values:** Check Points section shows tournament config
3. **Verify boost visibility:** Test with boosts enabled/disabled
4. **Verify step count:** Progress bar should show 4 or 5 steps correctly
5. **Verify navigation:** "Atrás" button works in both flows
6. **Test fallbacks:** Deactivate all tournaments, verify default values shown

### SonarCloud Validation
- Wait for CI/CD checks to complete
- Review SonarCloud report for new issues
- Address any issues before requesting review
- Verify coverage meets threshold

## Open Questions

None - requirements are clear from the issue.

## Dependencies

- Existing `getTournaments()` server action
- Existing `DEFAULT_SCORING` from `rules.tsx`
- Existing `Tournament` type definition
- Existing `findAllActiveTournaments()` repository function

## Risk Assessment

**Low Risk:**
- Uses established patterns (same approach as `rules.tsx`)
- Minimal changes to existing components
- Strong fallback behavior (defaults when no tournament)
- All changes are additive (no breaking changes)

**Potential Issues:**
- Server component conversion requires updating tests
- Dynamic step order needs careful testing for navigation

**Mitigation:**
- Comprehensive test coverage for all edge cases
- Manual testing checklist covers all scenarios
- Fallback values ensure graceful degradation

## Implementation Notes

**Order of implementation:**
1. Update types/interfaces first
2. Convert `OnboardingTrigger` to server component
3. Update `OnboardingDialog` with dynamic step order
4. Update `ScoringExplanationStep` with dynamic values
5. Update `BoostIntroductionStep` with dynamic counts
6. Create/update unit tests
7. Manual testing
8. SonarCloud validation

**Commit strategy:**
- Single atomic commit with all changes
- Tests included in same commit
- Ensures code + tests always in sync

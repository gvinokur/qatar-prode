# Implementation Plan: [i18n] Translate Onboarding Flow (#153)

## Context

The 7-step onboarding dialog currently has all text hardcoded in Spanish. This prevents English-speaking users from understanding the tutorial flow, which is critical for new user experience. This story internationalizes the entire onboarding flow to support both English and Spanish, leveraging the existing next-intl infrastructure.

## Story Overview

**Issue:** #153 - [i18n] Translate Onboarding Flow
**Priority:** High - Critical for new user experience
**Effort:** Medium (5-7 hours)
**Epic:** Internationalization (i18n) Support

**Scope:**
- 7 onboarding step components (Welcome, Game Prediction, Qualified Teams, Tournament Awards, Scoring Explanation, Boost Introduction, Checklist)
- Main onboarding dialog (buttons: Skip, Back, Next, Finish)
- Progress indicator (step labels)
- ~90 total strings requiring translation
- Complex content with pluralization, interpolation, and dynamic data

## Acceptance Criteria

- [ ] All hardcoded Spanish text replaced with translation keys using `useTranslations('onboarding')`
- [ ] Spanish translations preserved in `locales/es/onboarding.json`
- [ ] English placeholder translations created in `locales/en/onboarding.json` using `EnOf()` wrapper
- [ ] i18n types updated to include onboarding namespace
- [ ] Request config updated to load onboarding namespace
- [ ] Full onboarding flow testable in both languages
- [ ] Language switching works while onboarding dialog is open
- [ ] Demo data displays correctly in both locales
- [ ] Responsive layouts accommodate longer English translations
- [ ] All existing tests updated with translation mocks
- [ ] 80% code coverage maintained on modified files

## Technical Approach

### 1. Create Translation Namespace Files

**New files:**
- `locales/es/onboarding.json` - Full Spanish translations (source of truth)
- `locales/en/onboarding.json` - English placeholders with `EnOf(<Spanish text>)` pattern

**Namespace structure:**
```json
{
  "dialog": {
    "skipButton": "...",
    "backButton": "...",
    "nextButton": "...",
    "finishButton": "..."
  },
  "progress": {
    "welcome": "...",
    "gamePrediction": "...",
    "qualifiedTeams": "...",
    "tournamentAwards": "...",
    "scoring": "...",
    "boosts": "...",
    "checklist": "..."
  },
  "steps": {
    "welcome": {
      "title": "...",
      "description": "...",
      "durationInfo": "..."
    },
    "gamePrediction": {
      "title": "...",
      "instructions": "...",
      "dashboardLabel": "...",
      "cardInstructions": "...",
      "groupGameLabel": "...",
      "playoffGameLabel": "...",
      "demoNote": "...",
      "successAlert": "...",
      "infoTip": "..."
    },
    "qualifiedTeams": {
      "title": "...",
      "instructions": "...",
      "infoTip": "..."
    },
    "tournamentAwards": {
      "title": "...",
      "instructions": "...",
      "podiumHeader": "...",
      "champion": { "label": "...", "helper": "..." },
      "runnerUp": { "label": "...", "helper": "..." },
      "thirdPlace": { "label": "...", "helper": "..." },
      "individualAwardsHeader": "...",
      "bestPlayer": { "label": "...", "helper": "..." },
      "topScorer": { "label": "...", "helper": "..." },
      "bestGoalkeeper": { "label": "...", "helper": "..." },
      "bestYoungPlayer": { "label": "...", "helper": "..." },
      "podiumSuccessAlert": "...",
      "awardsSuccessAlert": "...",
      "infoTip": "..."
    },
    "scoring": {
      "title": "...",
      "instructions": "...",
      "matchesHeader": "...",
      "exactResult": { "label": "...", "points": "..." },
      "correctResult": { "label": "...", "points": "..." },
      "tournamentHeader": "...",
      "championMedal": "...",
      "runnerUpMedal": "...",
      "thirdPlaceMedal": "...",
      "individualAwardsHeader": "...",
      "awardPoints": { "label": "...", "points": "..." },
      "bestPlayerChip": "...",
      "topScorerChip": "...",
      "bestGoalkeeperChip": "...",
      "youngPlayerChip": "...",
      "totalPossible": "...",
      "classificationHeader": "...",
      "exactPosition": { "label": "...", "points": "..." },
      "classified": { "label": "...", "points": "..." },
      "importantAlert": {
        "title": "...",
        "tournamentContext": "...",
        "genericContext": "..."
      }
    },
    "boosts": {
      "title": "...",
      "instructions": "...",
      "silverBoost": {
        "label": "...",
        "multiplier": "...",
        "description": "...",
        "available": "{count, plural, one {Tienes {count} boost disponible por torneo} other {Tienes {count} boosts disponibles por torneo}}"
      },
      "goldenBoost": {
        "label": "...",
        "multiplier": "...",
        "description": "...",
        "available": "{count, plural, one {Tienes {count} boost disponible por torneo} other {Tienes {count} boosts disponibles por torneo}}"
      },
      "configAlert": {
        "header": "...",
        "subheader": "...",
        "bullet1": "...",
        "bullet2": "...",
        "bullet3": "..."
      },
      "strategicTip": {
        "title": "...",
        "text": "..."
      }
    },
    "checklist": {
      "title": "...",
      "instructions": "...",
      "items": {
        "firstPrediction": "...",
        "championAndAwards": "...",
        "qualifiedTeams": "...",
        "joinGroup": "...",
        "reviewRules": "..."
      },
      "deadlinesHeader": "...",
      "matchPredictions": { "label": "...", "deadline": "..." },
      "tournamentAndClassification": { "label": "...", "deadline": "..." },
      "boosts": { "label": "...", "deadline": "..." },
      "infoTip": "...",
      "startButton": "..."
    }
  }
}
```

**Pluralization pattern for counts (ICU Message Format):**
next-intl v4.8.3 uses ICU message format for pluralization:
```json
{
  "silverBoost": {
    "available": "{count, plural, one {Tienes {count} boost disponible por torneo} other {Tienes {count} boosts disponibles por torneo}}"
  }
}
```

**Usage in component:**
```typescript
const t = useTranslations('onboarding.steps.boosts');
// Simple call - next-intl automatically handles pluralization
t('silverBoost.available', { count: silverBoosts })
```

### 2. Update i18n Configuration

**File: `types/i18n.ts`**
Add onboarding namespace import and type:
```typescript
import onboarding from '@/locales/en/onboarding.json';

type Messages = {
  // ... existing namespaces
  onboarding: typeof onboarding;
};
```

**File: `i18n/request.ts`**
Add onboarding.json to runtime loader:
```typescript
return {
  locale,
  messages: {
    // ... existing imports
    onboarding: (await import(`../locales/${locale}/onboarding.json`)).default
  }
};
```

### 3. Update Onboarding Components

**All components are Client Components** - use `useTranslations('onboarding')` hook.

#### Main Dialog (`onboarding-dialog.tsx`)
```typescript
import { useTranslations } from 'next-intl';

export function OnboardingDialog({ ... }) {
  const t = useTranslations('onboarding.dialog');

  return (
    <Dialog>
      <Button onClick={handleSkip}>{t('skipButton')}</Button>
      <Button onClick={handleBack}>{t('backButton')}</Button>
      <Button onClick={handleNext}>{t('nextButton')}</Button>
      <Button onClick={handleFinish}>{t('finishButton')}</Button>
    </Dialog>
  );
}
```

#### Progress Indicator (`onboarding-progress.tsx`)
Current issue: Step labels built dynamically in array, can't use hooks in loop.

**Solution:** Fetch all labels upfront:
```typescript
const t = useTranslations('onboarding.progress');

const stepLabels = [
  t('welcome'),
  t('gamePrediction'),
  t('qualifiedTeams'),
  t('tournamentAwards'),
  t('scoring')
];

if (includeBoosts) {
  stepLabels.push(t('boosts'));
}
stepLabels.push(t('checklist'));
```

#### Individual Step Components
Pattern for each step:
```typescript
import { useTranslations } from 'next-intl';

export function WelcomeStep() {
  const t = useTranslations('onboarding.steps.welcome');

  return (
    <>
      <Typography variant="h4">{t('title')}</Typography>
      <Typography variant="body1">{t('description')}</Typography>
      <Typography variant="caption">{t('durationInfo')}</Typography>
    </>
  );
}
```

**Pluralization example (Boost Introduction):**
```typescript
const t = useTranslations('onboarding.steps.boosts');

// Before (inline pluralization):
`Tienes ${silverBoosts} ${silverBoosts === 1 ? 'boost disponible' : 'boosts disponibles'}`

// After (ICU message format):
t('silverBoost.available', { count: silverBoosts })

// JSON structure (locales/es/onboarding.json):
{
  "steps": {
    "boosts": {
      "silverBoost": {
        "available": "{count, plural, one {Tienes {count} boost disponible por torneo} other {Tienes {count} boosts disponibles por torneo}}"
      }
    }
  }
}
```

**How ICU pluralization works:**
- `{count, plural, ...}` triggers plural logic based on the `count` value
- `one {...}` handles singular case (count === 1)
- `other {...}` handles all other cases (0, 2, 3, ...)
- `{count}` within the message interpolates the actual number
- next-intl automatically selects the correct variant

**Interpolation example (Scoring Explanation):**
```typescript
const t = useTranslations('onboarding.steps.scoring');

// Dynamic tournament name
t('boosts.configAlert.header', { tournament: tournament.long_name })

// Dynamic point values
t('exactResult.points', { points: points.gameOutcome })
```

### 4. Demo Data Considerations

**File: `demo/demo-data.ts`**
- Team names (Brasil, Argentina, Uruguay, Chile) - **Do NOT translate** (proper nouns)
- Player names (Neymar, Messi, Suárez, Vidal) - **Do NOT translate** (proper nouns)
- No changes needed to demo data file

**Demo component files (`demo/*.tsx`):**
- `game-card-onboarding-demo.tsx` - Demo logic only, no hardcoded text
- `qualified-teams-onboarding-demo.tsx` - Demo logic only, no hardcoded text
- `onboarding-demo-context.tsx` - Context provider, no hardcoded text
- **No translation needed** for demo infrastructure files

### 5. Language Switching Behavior

Current LanguageSwitcher component works at app level. When user switches language:
1. Next.js router navigates to new locale path (`/en/...` or `/es/...`)
2. All components re-render with new locale
3. Onboarding dialog remounts with new translations
4. **Current step state is lost** (component uses local `useState`)

**Known limitation:** If user switches language mid-onboarding, they restart from step 1. This is acceptable because:
- Onboarding is a one-time flow (most users complete it once)
- Language switching during onboarding is an edge case
- Tutorial steps take ~2 minutes to complete
- User data (predictions, tournament selections) is not affected

**Alternative (if state preservation required):** Pass `currentStep` prop from parent and lift state up, but this adds complexity for minimal benefit.

**Testing approach:** Verify language switch works correctly (dialog re-renders with new translations), document that progress resets.

## Files to Create

1. `locales/es/onboarding.json` - Spanish translations (~250 lines)
2. `locales/en/onboarding.json` - English placeholders (~250 lines)

## Files to Modify

### i18n Configuration (2 files)
1. `types/i18n.ts` - Add onboarding namespace type
2. `i18n/request.ts` - Add onboarding.json import

### Components (10 files)
3. `app/components/onboarding/onboarding-dialog.tsx` - Dialog buttons (4 strings)
4. `app/components/onboarding/onboarding-progress.tsx` - Step labels (7-8 strings)
5. `app/components/onboarding/onboarding-steps/welcome-step.tsx` - Welcome content (3 strings)
6. `app/components/onboarding/onboarding-steps/game-prediction-step.tsx` - Game prediction content (8 strings)
7. `app/components/onboarding/onboarding-steps/qualified-teams-prediction-step.tsx` - Qualified teams content (3 strings)
8. `app/components/onboarding/onboarding-steps/tournament-awards-step.tsx` - Tournament awards content (15 strings)
9. `app/components/onboarding/onboarding-steps/scoring-explanation-step.tsx` - Scoring content (20+ strings, complex)
10. `app/components/onboarding/onboarding-steps/boost-introduction-step.tsx` - Boost content (10 strings)
11. `app/components/onboarding/onboarding-steps/checklist-step.tsx` - Checklist content (20 strings)
12. `app/components/onboarding/onboarding-steps/sample-prediction-step.tsx` - Sample predictions content (3 strings)

**Note:** `onboarding-dialog-client.tsx` is a data-loading wrapper with NO hardcoded text - no translation needed.

### Tests (13 files)
13. `__tests__/components/onboarding/onboarding-dialog.test.tsx`
14. `__tests__/components/onboarding/onboarding-dialog-client.test.tsx` - Verify data loading logic (no translation mocks needed)
15. `__tests__/components/onboarding/onboarding-progress.test.tsx`
16. `__tests__/components/onboarding/onboarding-checklist.test.tsx`
17. `__tests__/components/onboarding/onboarding-tooltip.test.tsx`
18. `__tests__/components/onboarding/onboarding-trigger.test.tsx`
19. `__tests__/components/onboarding/checklist-step.test.tsx`
20. `__tests__/components/onboarding/onboarding-steps/game-prediction-step.test.tsx`
21. `__tests__/components/onboarding/onboarding-steps/boost-introduction-step.test.tsx`
22. `__tests__/components/onboarding/onboarding-steps/scoring-explanation-step.test.tsx`
23. `__tests__/components/onboarding/demo/game-card-onboarding-demo.test.tsx`
24. `__tests__/components/onboarding/demo/onboarding-demo-context.test.tsx`
25. `__tests__/components/onboarding/demo/qualified-teams-onboarding-demo.test.tsx`

**Total: 25 files** (2 new, 23 modified)

## Implementation Steps

### Phase 1: Create Translation Files
1. Extract all hardcoded Spanish strings from onboarding components
2. Design hierarchical key structure in JSON
3. Create `locales/es/onboarding.json` with full Spanish translations
4. Create `locales/en/onboarding.json` with `EnOf()` placeholders
5. Update `types/i18n.ts` to include onboarding namespace
6. Update `i18n/request.ts` to load onboarding.json
7. Verify TypeScript compilation with new types

### Phase 2: Update Dialog & Progress Components
8. Update `onboarding-dialog.tsx` to use `useTranslations('onboarding.dialog')`
9. Update `onboarding-progress.tsx` to use `useTranslations('onboarding.progress')`
10. Verify dialog buttons and progress labels render correctly

### Phase 3: Update Step Components (Simpler Steps First)
11. Update `welcome-step.tsx` - Simple, 3 strings
12. Update `qualified-teams-prediction-step.tsx` - Simple, 3 strings
13. Update `game-prediction-step.tsx` - Medium complexity, 8 strings
14. Update `tournament-awards-step.tsx` - High complexity, 15 strings
15. Update `boost-introduction-step.tsx` - High complexity, pluralization
16. Update `scoring-explanation-step.tsx` - Very high complexity, pluralization + interpolation
17. Update `checklist-step.tsx` - High complexity, array of items

### Phase 4: Update Tests
18. Create mock translation utility for tests (`__tests__/utils/mock-translations.ts`)
19. Update `onboarding-dialog.test.tsx` with translation mocks
20. Update `onboarding-progress.test.tsx` with translation mocks
21. Update all step component tests with translation mocks (7 files)
22. Verify all tests pass with mocked translations

### Phase 5: Manual Testing & Validation
23. Test complete onboarding flow in Spanish (default)
24. Test complete onboarding flow in English
25. Test language switching while onboarding dialog is open
26. Verify demo data displays correctly in both locales
27. Check responsive layouts with longer English translations (especially button text)
28. Verify pluralization works correctly (boost counts)
29. Verify interpolation works correctly (tournament names, point values)

## Testing Strategy

### Unit Tests

**Test utilities to create:**
```typescript
// __tests__/utils/mock-translations.ts
export function createMockTranslations(namespace: string) {
  return (key: string, values?: Record<string, any>) => {
    // Return mock translation with key and values
    return `[${namespace}.${key}]${values ? JSON.stringify(values) : ''}`;
  };
}
```

**Pattern for component tests:**

**Before (current test - hardcoded Spanish):**
```typescript
// __tests__/components/onboarding/onboarding-progress.test.tsx
import { render, screen } from '@testing-library/react';
import OnboardingProgress from '@/app/components/onboarding/onboarding-progress';

describe('OnboardingProgress', () => {
  it('renders step labels', () => {
    render(<OnboardingProgress currentStep={0} totalSteps={7} includeBoosts={false} />);
    expect(screen.getByText('Bienvenida')).toBeInTheDocument();  // ❌ Hardcoded Spanish
    expect(screen.getByText('Partidos')).toBeInTheDocument();
  });
});
```

**After (with translation mocks):**
```typescript
// __tests__/components/onboarding/onboarding-progress.test.tsx
import { render, screen } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import OnboardingProgress from '@/app/components/onboarding/onboarding-progress';
import { createMockTranslations } from '@/__tests__/utils/mock-translations';

vi.mock('next-intl', () => ({
  useTranslations: vi.fn()
}));

describe('OnboardingProgress', () => {
  beforeEach(() => {
    // Mock returns translation keys wrapped in brackets
    vi.mocked(useTranslations).mockReturnValue(createMockTranslations('onboarding.progress'));
  });

  it('renders step labels using translations', () => {
    render(<OnboardingProgress currentStep={0} totalSteps={7} includeBoosts={false} />);
    expect(screen.getByText('[welcome]')).toBeInTheDocument();  // ✅ Mocked translation key
    expect(screen.getByText('[gamePrediction]')).toBeInTheDocument();
  });

  it('conditionally renders boosts step', () => {
    render(<OnboardingProgress currentStep={5} totalSteps={7} includeBoosts={true} />);
    expect(screen.getByText('[boosts]')).toBeInTheDocument();
  });
});
```

**Mock translation utility:**
```typescript
// __tests__/utils/mock-translations.ts
export function createMockTranslations(namespace: string) {
  return (key: string, values?: Record<string, any>) => {
    if (values) {
      // Handle interpolation: "welcome" + {name: "Juan"} → "[welcome]{name:Juan}"
      const valuesStr = JSON.stringify(values).replace(/[{}"]/g, '');
      return `[${key}]{${valuesStr}}`;
    }
    return `[${key}]`;
  };
}
```

**Coverage requirements:**
- All step components: 80%+ coverage
- Translation key usage verified
- Pluralization logic tested
- Interpolation with dynamic values tested

### Integration Tests

**Full flow test:**
```typescript
describe('Onboarding Flow i18n', () => {
  it('completes full flow in Spanish', async () => {
    // Set locale to 'es'
    // Render OnboardingDialog
    // Verify Spanish text in each step
    // Complete all 7 steps
  });

  it('completes full flow in English', async () => {
    // Set locale to 'en'
    // Render OnboardingDialog
    // Verify English text in each step
    // Complete all 7 steps
  });

  it('handles language switch mid-flow', async () => {
    // Start in Spanish
    // Progress to step 3
    // Switch to English
    // Verify step 3 now shows English
    // Complete remaining steps
  });
});
```

### Manual Testing Checklist

- [ ] Spanish onboarding flow displays correctly (all 7 steps)
- [ ] English onboarding flow displays correctly (all 7 steps)
- [ ] Language switcher works while dialog is open
- [ ] Progress indicator updates correctly
- [ ] Dialog buttons show correct text in both languages
- [ ] Demo data (teams, players) remains unchanged
- [ ] Pluralization displays correctly for boost counts
- [ ] Dynamic tournament name interpolates correctly
- [ ] Point values display correctly in scoring explanation
- [ ] Success alerts show translated text
- [ ] Info tips show translated text
- [ ] Checklist items show translated text
- [ ] Responsive layouts work with longer English text
- [ ] No layout breaks on mobile/tablet/desktop
- [ ] TypeScript types work correctly with new namespace

## Validation Considerations

### SonarCloud Requirements

**Quality gates:**
- 80% code coverage on new/modified code
- 0 new issues (any severity)
- Security rating: A
- Maintainability: B or higher

**Expected impact:**
- Translation files: No logic, JSON only (not counted in coverage)
- Component changes: Minimal logic changes (string replacement with function calls)
- Test updates: Maintain existing coverage with mocked translations

**Risk mitigation:**
- Existing tests already cover component logic
- Only changing hardcoded strings to translation calls
- Mock translations preserve test behavior
- Coverage should remain stable or improve

### Accessibility

**Translation considerations:**
- Screen readers will announce translated text correctly
- aria-labels should also be translated if present
- Focus management unchanged (no impact)
- Keyboard navigation unchanged (no impact)

### Performance

**Bundle size impact:**
- Adding ~250 lines × 2 locales = ~500 lines JSON
- Minimal impact (~5-10KB gzipped)
- Lazy loaded per locale (only active locale loaded)

**Runtime impact:**
- Translation lookup is O(1) (object property access)
- No performance degradation expected
- next-intl is optimized for performance

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Long English translations break layout | Medium | Test responsive layouts thoroughly, adjust spacing if needed |
| Missing translation keys cause runtime errors | High | TypeScript types catch missing keys at compile time |
| Pluralization logic incorrect | Medium | Test with various count values (0, 1, 2, 10) |
| Test coverage drops below 80% | High | Update all tests with proper mocks before removing hardcoded strings |
| Language switching mid-flow loses state | Low | Component state managed by props, remounting preserves state |

## Success Criteria

**Functional:**
- ✅ All 7 onboarding steps display in both English and Spanish
- ✅ Language switching works seamlessly during onboarding
- ✅ Demo data displays correctly in both locales
- ✅ Pluralization works for all count-based strings
- ✅ Interpolation works for all dynamic values (tournament names, points)

**Technical:**
- ✅ TypeScript compilation succeeds with new namespace types
- ✅ All 20 tests pass with translation mocks
- ✅ 80%+ code coverage on modified files
- ✅ 0 new SonarCloud issues
- ✅ No console errors or warnings
- ✅ Bundle size increase < 10KB

**Quality:**
- ✅ Translation keys follow naming conventions from i18n guide
- ✅ JSON structure is logical and maintainable
- ✅ English placeholders use correct `EnOf()` format
- ✅ Code follows existing patterns from other i18n components

## Open Questions

None - approach is clear based on existing i18n infrastructure.

## Dependencies

**Required:**
- Story #150 (Translation Key Extraction & Namespace Design) - ✅ Completed
- Story #151 (Translation Helper Utilities & Patterns) - ✅ Completed

**Blocks:**
- Future stories requiring onboarding translations will use this namespace

## Related Documentation

- `/docs/i18n-guide.md` - Complete i18n developer guide
- `/app/utils/i18n-patterns.md` - Practical translation patterns
- `/plans/STORY-150-plan.md` - Translation architecture plan
- `/plans/STORY-151-plan.md` - Helper utilities plan

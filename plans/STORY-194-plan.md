# Implementation Plan: [i18n] Translate Main Navigation Tabs (#194)

## Context

Story #155 was intended to translate "Header and navigation" but only covered the top header component (logo, app title, theme/language switchers). The main navigation tabs (PARTIDOS, CLASIFICADOS, PREMIOS) in the GroupSelector component were overlooked and remain hardcoded in Spanish.

This creates an inconsistent user experience where the language switcher exists but doesn't affect the primary navigation labels. Users selecting English still see Spanish navigation tabs.

## Objectives

1. Add translation keys for the three main navigation tabs (Matches, Qualified, Awards)
2. Update GroupSelector component to use `useTranslations` hook
3. Translate the aria-label for accessibility
4. Create comprehensive i18n tests following existing patterns
5. Ensure tab functionality remains unchanged

## Acceptance Criteria

- [ ] Navigation tabs display "PARTIDOS", "CLASIFICADOS", "PREMIOS" when locale is 'es'
- [ ] Navigation tabs display "MATCHES", "QUALIFIED TEAMS", "AWARDS" when locale is 'en'
- [ ] Aria-label is translated in both languages
- [ ] Tab navigation functionality unchanged (routing still works correctly)
- [ ] Tab selection state works correctly
- [ ] Tests verify translation keys are used
- [ ] 80% coverage on new test file (SonarCloud requirement)

## Technical Approach

### 1. Translation Keys Structure

Add a `topNav` section to navigation namespace, parallel to existing `bottomNav`:

**locales/es/navigation.json:**
```json
{
  "header": { ... },
  "bottomNav": { ... },
  "topNav": {
    "matches": "PARTIDOS",
    "qualified": "CLASIFICADOS",
    "awards": "PREMIOS",
    "ariaLabel": "Navegación del torneo"
  }
}
```

**locales/en/navigation.json:**
```json
{
  "header": { ... },
  "bottomNav": { ... },
  "topNav": {
    "matches": "MATCHES",
    "qualified": "QUALIFIED TEAMS",
    "awards": "AWARDS",
    "ariaLabel": "Tournament navigation"
  }
}
```

**Rationale:**
- Use `topNav` to distinguish from `bottomNav` (mobile navigation)
- Keep uppercase styling in translations (design requirement)
- Group all top navigation strings together for maintainability

### 2. Component Updates

**File:** `app/components/groups-page/group-selector.tsx`

**Changes:**
1. Import `useTranslations` hook from 'next-intl'
2. Initialize translations: `const t = useTranslations('navigation.topNav')`
3. Replace hardcoded labels with translation calls
4. Replace hardcoded aria-label with translation

**Before:**
```tsx
const GroupSelector = ({ groups, tournamentId, backgroundColor, textColor }: Props) => {
  const locale = useLocale();
  // ...

  return (
    <Tabs
      aria-label="Navegación del torneo"
      // ...
    >
      <Tab label="PARTIDOS" ... />
      <Tab label="CLASIFICADOS" ... />
      <Tab label="PREMIOS" ... />
    </Tabs>
  );
};
```

**After:**
```tsx
'use client'

import { useTranslations } from 'next-intl'; // ADD THIS

const GroupSelector = ({ groups, tournamentId, backgroundColor, textColor }: Props) => {
  const locale = useLocale();
  const t = useTranslations('navigation.topNav'); // ADD THIS
  // ...

  return (
    <Tabs
      aria-label={t('ariaLabel')} // TRANSLATE THIS
      // ...
    >
      <Tab label={t('matches')} ... />      // TRANSLATE THIS
      <Tab label={t('qualified')} ... />    // TRANSLATE THIS
      <Tab label={t('awards')} ... />       // TRANSLATE THIS
    </Tabs>
  );
};
```

### 3. Testing Strategy

**File:** `app/components/groups-page/__tests__/group-selector-i18n.test.tsx` (NEW)

**Test pattern:** Follow `tournament-bottom-nav/__tests__/tournament-bottom-nav-i18n.test.tsx` pattern

**Test scenarios:**
1. **Renders all tabs with translation keys** - Verify all 3 tabs render with correct translation keys
2. **Uses navigation.topNav namespace** - Verify translation namespace is correct
3. **Translates aria-label** - Verify accessibility label uses translation
4. **Tab functionality preserved** - Verify Links and values work correctly

**Test structure:**
```tsx
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import GroupSelector from '../group-selector'
import { renderWithTheme } from '__tests__/utils/test-utils'

// Mock next-intl - returns keys as-is for verification
// This approach follows tournament-bottom-nav-i18n.test.tsx pattern
// We verify translation keys are used correctly, not actual translations
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/en/tournaments/test-tournament',
}))

describe('GroupSelector i18n', () => {
  const defaultProps = {
    groups: [
      { group_letter: 'A', id: 'group-a' },
      { group_letter: 'B', id: 'group-b' },
    ],
    tournamentId: 'test-tournament',
  }

  it('renders all tabs with translation keys', () => {
    renderWithTheme(<GroupSelector {...defaultProps} />)

    // Verify all 3 tabs use translation keys
    expect(screen.getByRole('tab', { name: /matches/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /qualified/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /awards/i })).toBeInTheDocument()
  })

  it('uses navigation.topNav namespace', () => {
    renderWithTheme(<GroupSelector {...defaultProps} />)

    // Mock returns key as-is, so rendered text will be the key
    expect(screen.getByRole('tab', { name: /matches/i })).toBeInTheDocument()
  })

  it('translates aria-label for accessibility', () => {
    const { container } = renderWithTheme(<GroupSelector {...defaultProps} />)

    // Find the Tabs component and verify aria-label
    const tabsElement = container.querySelector('[role="tablist"]')
    expect(tabsElement).toHaveAttribute('aria-label', 'ariaLabel')
  })

  it('preserves tab navigation functionality', () => {
    renderWithTheme(<GroupSelector {...defaultProps} />)

    const matchesTab = screen.getByRole('tab', { name: /matches/i })
    const qualifiedTab = screen.getByRole('tab', { name: /qualified/i })
    const awardsTab = screen.getByRole('tab', { name: /awards/i })

    // Verify tabs have correct href attributes
    expect(matchesTab.closest('a')).toHaveAttribute('href', '/en/tournaments/test-tournament')
    expect(qualifiedTab.closest('a')).toHaveAttribute('href', '/en/tournaments/test-tournament/qualified-teams')
    expect(awardsTab.closest('a')).toHaveAttribute('href', '/en/tournaments/test-tournament/awards')
  })
})
```

**Coverage target:** 80% minimum (SonarCloud requirement)
- 4 test scenarios cover all critical paths
- Component is simple (no complex logic), high coverage achievable

## Implementation Steps

### Step 1: Add Translation Keys
1. Update `locales/es/navigation.json`:
   - Add `topNav` section with Spanish labels
2. Update `locales/en/navigation.json`:
   - Add `topNav` section with English labels

### Step 2: Update GroupSelector Component
1. Import `useTranslations` from 'next-intl'
2. Add `const t = useTranslations('navigation.topNav')` hook
3. Replace "PARTIDOS" with `t('matches')`
4. Replace "CLASIFICADOS" with `t('qualified')`
5. Replace "PREMIOS" with `t('awards')`
6. Replace "Navegación del torneo" with `t('ariaLabel')`

### Step 3: Create i18n Tests
1. Create `app/components/groups-page/__tests__/group-selector-i18n.test.tsx`
2. Set up mocks (next-intl, next/navigation)
3. Implement 4 test scenarios:
   - All tabs render with translation keys
   - Correct namespace usage
   - Aria-label translation
   - Navigation functionality preserved

### Step 4: Validation
1. **Unit tests:** Run `npm test group-selector-i18n` - verify all tests pass
2. **Coverage:** Verify 80% coverage on new test file
3. **Lint:** Run `npm run lint` - verify no new issues
4. **Build:** Run `npm run build` - verify no build errors
5. **Migrations:** Confirm no migrations required (i18n-only changes)
6. **Manual verification (Vercel Preview):**
   - Switch to Spanish (es) → Verify "PARTIDOS", "CLASIFICADOS", "PREMIOS"
   - Switch to English (en) → Verify "MATCHES", "QUALIFIED TEAMS", "AWARDS"
   - Click each tab → Verify navigation works
   - Check aria-label with dev tools → Verify translated

## Files to Create/Modify

### Files to Modify
1. **locales/es/navigation.json** - Add topNav section with Spanish labels
2. **locales/en/navigation.json** - Add topNav section with English labels
3. **app/components/groups-page/group-selector.tsx** - Add useTranslations, replace hardcoded strings

### Files to Create
1. **app/components/groups-page/__tests__/group-selector-i18n.test.tsx** - i18n tests

## Quality Gates

### SonarCloud Requirements
- **Coverage:** ≥80% on new test file (group-selector-i18n.test.tsx)
- **New Issues:** 0 new issues (any severity)
- **Security:** No security hotspots
- **Maintainability:** Maintain B or higher

### Pre-Commit Checklist
- [ ] All unit tests pass
- [ ] ESLint passes with no new warnings
- [ ] Build completes successfully
- [ ] 80% coverage on new code

## Risks and Mitigations

### Risk: Breaking existing functionality
**Mitigation:** Comprehensive tests verify navigation still works, manual verification in Vercel Preview

### Risk: Translation keys not loading
**Mitigation:** Follow exact pattern from tournament-bottom-nav (proven working pattern)

### Risk: Styling breaks with dynamic labels
**Mitigation:** Labels are same length in both languages, uppercase maintained in translations

### Risk: Accessibility regression
**Mitigation:** Aria-label translation included, verified in tests

## Open Questions

None - approach is straightforward i18n implementation following established patterns.

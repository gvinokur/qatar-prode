# Implementation Plan: Story #157 - Tournament & Static Data Internationalization

## Story Context

**Issue:** #157
**Title:** [i18n] Tournament & Static Data Internationalization
**Priority:** Medium
**Effort:** High (8-12 hours)

### Problem Statement

Currently, tournament static data (team names, venue locations, playoff stage names) is hardcoded in English within the `/data/` directory and database. Users viewing the app in Spanish see English names for teams, venues, and tournament stages, creating an inconsistent localization experience.

### Objectives

1. Internationalize tournament static data including:
   - Tournament names (e.g., "Copa América 2024" vs "Copa America 2024")
   - Team names (canonical vs translated)
   - Venue/location names
   - Playoff stage names (e.g., "Octavos de Final" / "Round of 16")
   - Player names (keep original - international standard)

2. Determine localization strategy:
   - **Option 1:** Keep canonical names in data, add translations to i18n JSON files (recommended)
   - **Option 2:** Add locale fields to database schema
   - **Option 3:** External translation mapping file

3. Maintain backward compatibility with existing tournament data
4. Ensure minimal performance impact
5. Support extensibility for future tournaments and languages

## Acceptance Criteria

- [ ] Tournament names display in user's selected locale (EN/ES)
- [ ] Team names display appropriately (decision: canonical or translated)
- [ ] Venue names are localized
- [ ] Playoff stage names are localized (e.g., "Octavos de Final" → "Round of 16")
- [ ] Player names remain in original form (international standard)
- [ ] No breaking changes to existing tournament data structure
- [ ] All existing tests pass
- [ ] New tests added for localization logic (80% coverage minimum)
- [ ] Documentation updated with localization approach

## Technical Approach

### Strategy Decision: Option 1 (Recommended)

**Approach:** Keep canonical/original names in data structures and database, add translations to i18n JSON namespace files.

**Rationale:**
1. ✅ **Minimal data structure changes** - No database migrations needed
2. ✅ **Leverages existing i18n infrastructure** - Uses next-intl framework already in place
3. ✅ **Separation of concerns** - Data layer stays canonical, presentation layer handles localization
4. ✅ **Easy to maintain** - Translations in same place as other UI strings
5. ✅ **Extensible** - Adding new languages doesn't require data migration
6. ✅ **Type-safe** - Leverages existing TypeScript i18n type system

**Tradeoffs:**
- ⚠️ Requires translation key lookups at render time (negligible performance impact)
- ⚠️ Must maintain consistency between data canonical names and translation keys

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (Canonical)                   │
│  /data/euro/teams.ts: { name: "Germany", ... }             │
│  /data/copa-america/teams.ts: { name: "Argentina", ... }   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Translation Mapping Layer (NEW)                │
│  Utility: getTeamName(canonicalName, locale)              │
│  Utility: getVenueName(canonicalName, locale)             │
│  Utility: getStageName(canonicalName, locale)             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│            i18n JSON Files (Presentation Layer)             │
│  /locales/en/tournaments.json                              │
│  /locales/es/tournaments.json                              │
│    - teams: { "Germany": "Alemania", ... }                │
│    - venues: { "Munich Football Arena": "Arena de..." }   │
│    - stages: { "Round of 16": "Octavos de Final" }        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    UI Components (Render)                   │
│  Team display: {getTeamName(team.name, locale)}           │
│  Venue display: {getVenueName(game.location, locale)}     │
└─────────────────────────────────────────────────────────────┘
```

### Translation Structure

Create new nested sections in existing `tournaments.json` namespace:

**`/locales/en/tournaments.json`** (additions):
```json
{
  "staticData": {
    "teams": {
      "Germany": "Germany",
      "Spain": "Spain",
      "Argentina": "Argentina",
      "Brazil": "Brazil",
      ...
    },
    "venues": {
      "Olympiastadion Berlin": "Berlin Olympic Stadium",
      "Munich Football Arena": "Munich Football Arena",
      "Estadio Monumental": "Monumental Stadium",
      ...
    },
    "stages": {
      "Octavos de Final": "Round of 16",
      "Cuartos de Final": "Quarterfinals",
      "Semifinal": "Semifinals",
      "Final": "Final",
      "Tercer Puesto": "Third Place"
    },
    "tournamentNames": {
      "euro-2024": "UEFA Euro 2024",
      "copa-america-2024": "Copa América 2024",
      "fifa-2026": "FIFA World Cup 2026"
    }
  }
}
```

**`/locales/es/tournaments.json`** (additions):
```json
{
  "staticData": {
    "teams": {
      "Germany": "Alemania",
      "Spain": "España",
      "Argentina": "Argentina",
      "Brazil": "Brasil",
      ...
    },
    "venues": {
      "Olympiastadion Berlin": "Estadio Olímpico de Berlín",
      "Munich Football Arena": "Arena de Fútbol de Múnich",
      "Estadio Monumental": "Estadio Monumental",
      ...
    },
    "stages": {
      "Octavos de Final": "Octavos de Final",
      "Cuartos de Final": "Cuartos de Final",
      "Semifinal": "Semifinal",
      "Final": "Final",
      "Tercer Puesto": "Tercer Puesto"
    },
    "tournamentNames": {
      "euro-2024": "Eurocopa 2024",
      "copa-america-2024": "Copa América 2024",
      "fifa-2026": "Copa Mundial FIFA 2026"
    }
  }
}
```

### Helper Utilities

Create new file: `/app/utils/tournament-i18n-helpers.ts`

```typescript
import { getTranslations } from 'next-intl/server';
import { useTranslations } from 'next-intl';

/**
 * Server-side team name localization
 */
export async function getTeamName(canonicalName: string, locale: string): Promise<string> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  const translatedName = t(`staticData.teams.${canonicalName}`, { defaultValue: canonicalName });

  // Development mode: warn if translation missing
  if (process.env.NODE_ENV === 'development' && translatedName === canonicalName) {
    console.warn(`[i18n] Missing team translation for "${canonicalName}" in locale "${locale}"`);
  }

  return translatedName;
}

/**
 * Client-side team name localization hook
 */
export function useTeamName(canonicalName: string): string {
  const t = useTranslations('tournaments.staticData.teams');
  return t(canonicalName, { defaultValue: canonicalName });
}

/**
 * Server-side venue name localization
 */
export async function getVenueName(canonicalName: string, locale: string): Promise<string> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  return t(`staticData.venues.${canonicalName}`, { defaultValue: canonicalName });
}

/**
 * Client-side venue name localization hook
 */
export function useVenueName(canonicalName: string): string {
  const t = useTranslations('tournaments.staticData.venues');
  return t(canonicalName, { defaultValue: canonicalName });
}

/**
 * Server-side stage name localization
 */
export async function getStageName(canonicalName: string, locale: string): Promise<string> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  return t(`staticData.stages.${canonicalName}`, { defaultValue: canonicalName });
}

/**
 * Client-side stage name localization hook
 */
export function useStageName(canonicalName: string): string {
  const t = useTranslations('tournaments.staticData.stages');
  return t(canonicalName, { defaultValue: canonicalName });
}

/**
 * Server-side tournament name localization
 */
export async function getTournamentName(tournamentKey: string, locale: string): Promise<string> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  return t(`staticData.tournamentNames.${tournamentKey}`, { defaultValue: tournamentKey });
}

/**
 * Client-side tournament name localization hook
 */
export function useTournamentName(tournamentKey: string): string {
  const t = useTranslations('tournaments.staticData.tournamentNames');
  return t(tournamentKey, { defaultValue: tournamentKey });
}

/**
 * Batch translation for team arrays (server-side)
 * Uses parallel execution for performance
 */
export async function getTeamNames(canonicalNames: string[], locale: string): Promise<string[]> {
  return Promise.all(canonicalNames.map(name => getTeamName(name, locale)));
}

/**
 * Validate translation completeness for a given locale
 * Returns array of missing translation keys
 * Used in build validation and tests
 */
export async function validateTranslationCompleteness(
  locale: string,
  requiredKeys: { teams: string[], venues: string[], stages: string[], tournamentNames: string[] }
): Promise<{ missing: string[], total: number }> {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  const missing: string[] = [];

  // Check team names
  for (const team of requiredKeys.teams) {
    const translation = t(`staticData.teams.${team}`, { defaultValue: '__MISSING__' });
    if (translation === '__MISSING__') missing.push(`teams.${team}`);
  }

  // Check venues
  for (const venue of requiredKeys.venues) {
    const translation = t(`staticData.venues.${venue}`, { defaultValue: '__MISSING__' });
    if (translation === '__MISSING__') missing.push(`venues.${venue}`);
  }

  // Check stages
  for (const stage of requiredKeys.stages) {
    const translation = t(`staticData.stages.${stage}`, { defaultValue: '__MISSING__' });
    if (translation === '__MISSING__') missing.push(`stages.${stage}`);
  }

  // Check tournament names
  for (const tournament of requiredKeys.tournamentNames) {
    const translation = t(`staticData.tournamentNames.${tournament}`, { defaultValue: '__MISSING__' });
    if (translation === '__MISSING__') missing.push(`tournamentNames.${tournament}`);
  }

  const total = requiredKeys.teams.length + requiredKeys.venues.length +
                requiredKeys.stages.length + requiredKeys.tournamentNames.length;

  return { missing, total };
}
```

### Team Name Strategy Decision

**Recommendation:** Keep team names in **original/canonical English form**.

**Rationale:**
1. ✅ **International standard** - Team names are proper nouns (e.g., "Manchester United", "Real Madrid")
2. ✅ **Recognition** - Fans recognize teams by official names regardless of language
3. ✅ **Consistency** - FIFA, UEFA use official English names in multilingual contexts
4. ✅ **Simplicity** - Avoid translation inconsistencies (e.g., "Germany" vs "Alemania" vs "Deutschland")

**Exceptions:**
- Country demonyms in UI context (e.g., "German team" → "Equipo alemán")
- Adjectives referring to teams (e.g., "Spanish victory" → "Victoria española")

**Implementation:**
- Keep canonical names in data: `{ name: "Germany", ... }`
- Provide translations ONLY if explicitly needed in UI copy (not for team identification)
- Use helper functions with `defaultValue: canonicalName` fallback

### Venue Name Strategy

**Recommendation:** Translate venue names for better UX.

**Rationale:**
1. ✅ **Geographic context** - Users benefit from localized location names
2. ✅ **Accessibility** - Easier to understand for non-English speakers
3. ✅ **Consistency** - Matches localization of other geographic content

**Implementation:**
- Maintain canonical English names in `/data/` files
- Add translations to `tournaments.staticData.venues.*` in i18n files
- Use `getVenueName()` / `useVenueName()` helpers in UI components

### Player Name Strategy

**Recommendation:** Keep player names in **original form** (no translation).

**Rationale:**
1. ✅ **Proper nouns** - Player names are personal identifiers
2. ✅ **International standard** - Sports media globally uses original player names
3. ✅ **Data integrity** - No risk of mistranslation or confusion

**Implementation:**
- No changes needed - current implementation already correct
- Player names remain as stored in `/data/*/players.ts`

## Files to Create

### New Files

1. **`/app/utils/tournament-i18n-helpers.ts`**
   - Helper functions for server-side translation
   - Helper hooks for client-side translation
   - Batch translation utilities
   - Export: `getTeamName`, `getVenueName`, `getStageName`, `getTournamentName`
   - Export: `useTeamName`, `useVenueName`, `useStageName`, `useTournamentName`

2. **`/__tests__/utils/tournament-i18n-helpers.test.ts`**
   - Unit tests for helper functions
   - Test both server and client variants
   - Test fallback behavior (defaultValue)
   - Test batch translation

3. **`/locales/en/tournaments.json`** (extend existing)
   - Add `staticData.teams.*` section
   - Add `staticData.venues.*` section
   - Add `staticData.stages.*` section
   - Add `staticData.tournamentNames.*` section

4. **`/locales/es/tournaments.json`** (extend existing)
   - Add Spanish translations for all static data sections

## Files to Modify

### Translation Files

1. **`/locales/en/tournaments.json`**
   - Add `staticData` section with all static data translations

2. **`/locales/es/tournaments.json`**
   - Add `staticData` section with all static data translations

### UI Components (Examples - identify all usages)

**Components likely needing updates:**

3. **`/app/components/game-card/game-card.tsx`**
   - Replace direct `game.location` with `getVenueName(game.location, locale)`
   - Replace direct team name rendering with `getTeamName(team.name, locale)`

4. **`/app/components/groups-page/group-table.tsx`**
   - Replace team name rendering with helper function

5. **`/app/components/awards/team-selector.tsx`**
   - Replace team name rendering in autocomplete

6. **`/app/components/qualified-teams/qualified-teams-panel.tsx`**
   - Replace team name rendering

7. **`/app/components/tournament-stages/playoff-bracket.tsx`**
   - Replace stage name rendering with `getStageName(stage.name, locale)`
   - Replace team name rendering

8. **`/app/[locale]/tournaments/[tournamentId]/page.tsx`**
   - Replace tournament name rendering with `getTournamentName(tournament.short_name, locale)`

### Repository/Service Files

9. **`/app/db/tournament-repository.ts`**
   - Add locale parameter to query functions that return tournament data
   - Apply translations in data transformation layer

10. **`/app/actions/tournament-actions.ts`**
    - Pass locale to repository functions
    - Apply helper functions to transform data before returning to client

## Implementation Steps

### Phase 0: Pre-Implementation Audit (1 hour)

**⚠️ This phase is REQUIRED before Phase 1 begins.**

1. **Complete component inventory audit**
   - Use Grep to find ALL references to tournament static data:
     - Search: `team.name`, `team_name`, `home_team`, `away_team`
     - Search: `game.location`, `location`
     - Search: `stage.name`, `playoff.stage`, `round_name`
     - Search: `tournament.long_name`, `tournament.short_name`, `tournament_name`
   - Create exhaustive list of components that render tournament data
   - Document in plan (append to "Files to Modify" section)
   - Estimate test coverage needed (number of components × 2 test cases per component)

2. **Verify venue canonical names**
   - Read all tournament data files in `/data/`:
     - `/data/euro/base-data.ts` (Venues object)
     - `/data/copa-america/base-data.ts` (Venues object)
     - `/data/fifa-2026/base-data.ts` (Venues object)
   - If Decision 3 = Option A (standardize to English):
     - List all Copa América Spanish venue names to be changed
     - Create mapping: Spanish canonical → English canonical → Spanish translation
   - If Decision 3 = Option B (keep original language):
     - Document mixed canonical source strategy
     - Create bidirectional mapping for Copa América venues

3. **Extract all unique static data values**
   - Create comprehensive lists:
     - All team names (across all tournaments: Euro, Copa, FIFA)
     - All venue names (with canonical source language noted)
     - All stage names (with current language noted)
     - All tournament names/keys
   - Save lists as reference for Phase 1 translation data creation

4. **Validate translation namespace**
   - Confirm `tournaments` namespace is registered in:
     - `/i18n/request.ts` (should already exist)
     - `/types/i18n.ts` (should already exist)
   - Read existing `/locales/en/tournaments.json` and `/locales/es/tournaments.json`
   - Verify structure compatibility for adding `staticData.*` sections

**Deliverables:**
- [ ] Complete component inventory list (appended to plan)
- [ ] Venue canonical name mapping (if applicable)
- [ ] Exhaustive static data value lists
- [ ] Namespace validation confirmed

**Only proceed to Phase 1 after completing all Phase 0 tasks.**

---

### Phase 1: Infrastructure Setup (2-3 hours)

1. **Create helper utilities file**
   - Create `/app/utils/tournament-i18n-helpers.ts`
   - Implement server-side helper functions (`getTeamName`, `getVenueName`, `getStageName`, `getTournamentName`)
   - Implement client-side hooks (`useTeamName`, `useVenueName`, `useStageName`, `useTournamentName`)
   - Add TypeScript types and JSDoc documentation

2. **Add translation data**
   - Analyze all tournaments in `/data/` to extract:
     - All unique team names (Euro 2024: 24 teams, Copa América 2024: 16 teams, FIFA 2026: 48 teams)
     - All unique venue names
     - All unique stage names
     - All tournament names
   - Add English translations to `/locales/en/tournaments.json` under `staticData.*`
   - Add Spanish translations to `/locales/es/tournaments.json` under `staticData.*`

3. **Verify translation namespace registration**
   - Confirm `tournaments` namespace is in `i18n/request.ts` (already exists)
   - Confirm `tournaments` namespace is in `types/i18n.ts` (already exists)

### Phase 2: Component Migration (4-5 hours)

4. **Identify all components using tournament static data**
   - Use `Grep` to find components rendering:
     - `team.name` or `game.home_team` / `game.away_team`
     - `game.location`
     - `stage.name` or `playoff.stage`
     - `tournament.long_name` / `tournament.short_name`

5. **Update Server Components**
   - Import `getTeamName`, `getVenueName`, `getStageName`, `getTournamentName`
   - Import `getLocale` from `next-intl/server`
   - Replace direct data access with helper function calls
   - Pass locale to helpers

6. **Update Client Components**
   - Import `useTeamName`, `useVenueName`, `useStageName`, `useTournamentName`
   - Import `useLocale` from `next-intl`
   - Replace direct data access with hook calls

7. **Update repository/service layer (if needed)**
   - Add locale parameter to functions returning tournament display data
   - Apply translations at data transformation layer
   - Maintain backward compatibility with default locale fallback

### Phase 3: Testing (2-3 hours)

8. **Create unit tests for helpers**
   - Create `/__tests__/utils/tournament-i18n-helpers.test.ts`
   - Test server-side helpers:
     - Correct translation retrieval (EN and ES)
     - Fallback to canonical name if translation missing
     - Batch translation functions
   - Test client-side hooks:
     - Correct translation retrieval
     - Fallback behavior
   - Mock `next-intl` functions using existing mock utilities

9. **Create/update component i18n tests**
   - For each modified component, create/update `*-i18n.test.tsx` file
   - Test rendering in both EN and ES locales
   - Verify correct translations appear
   - Use existing test utilities (`createMockTranslations`, `renderWithProviders`)

10. **Integration testing**
    - Manually test in dev environment:
      - Switch language (EN ↔ ES)
      - Verify team names, venue names, stage names update correctly
      - Test across different tournaments (Euro, Copa América, FIFA)
    - Check all pages:
      - Tournament list page
      - Tournament detail page
      - Games list
      - Groups standings
      - Playoff bracket
      - Awards page (team selector)

### Phase 4: Documentation & Validation (1-2 hours)

11. **Validate translation completeness**
    - Run `validateTranslationCompleteness()` for both EN and ES locales
    - Check for missing translations in all categories:
      - Teams (Euro: 24, Copa: 16, FIFA: 48)
      - Venues (all unique venue names from Phase 0 audit)
      - Stages (all playoff stage names)
      - Tournament names (all tournament keys)
    - If missing translations found:
      - Add missing translations to JSON files
      - Re-run validation until 100% complete
    - Create validation test that fails on missing translations

12. **Update documentation**
    - Update `/docs/i18n-guide.md`:
      - Add section on tournament static data localization
      - Document helper functions and hooks
      - Add examples of usage
      - Add guidance on when to use server vs client helpers:
        - **Server helpers** (`getTeamName`, etc.): Use in Server Components, Server Actions, metadata generation
        - **Client hooks** (`useTeamName`, etc.): Use in Client Components with `'use client'` directive
      - Add performance guidance:
        - Use batch functions (`getTeamNames`) for arrays of 5+ items
        - Individual functions for single lookups or small arrays
    - Update `/app/utils/i18n-patterns.md`:
      - Add pattern for tournament static data
      - Add examples for server and client components
      - Add fallback behavior documentation

13. **Run validation checks**
    - Run `npm test` - All tests must pass
    - Run `npm run lint` - No linting errors
    - Run `npm run build` - Build must succeed
    - Verify 80% coverage on new code (calculate: modified components × 2 tests = target coverage)
    - Check SonarCloud preview (if available)

## Testing Strategy

### Unit Tests

**File:** `/__tests__/utils/tournament-i18n-helpers.test.ts`

**Test Coverage:**
- ✅ `getTeamName()` returns English translation for EN locale
- ✅ `getTeamName()` returns Spanish translation for ES locale
- ✅ `getTeamName()` falls back to canonical name if translation missing
- ✅ `getVenueName()` returns correct translation for both locales
- ✅ `getStageName()` returns correct translation for both locales
- ✅ `getTournamentName()` returns correct translation for both locales
- ✅ Client hooks (`useTeamName`, etc.) return correct values
- ✅ Batch translation functions work correctly

**Example Test:**
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTeamName, getVenueName, getStageName } from '@/app/utils/tournament-i18n-helpers';
import * as nextIntl from 'next-intl/server';

vi.mock('next-intl/server');

describe('tournament-i18n-helpers', () => {
  describe('getTeamName', () => {
    it('should return English team name for EN locale', async () => {
      vi.mocked(nextIntl.getTranslations).mockResolvedValue((key: string) => {
        if (key === 'staticData.teams.Germany') return 'Germany';
        return key;
      });

      const result = await getTeamName('Germany', 'en');
      expect(result).toBe('Germany');
    });

    it('should return Spanish team name for ES locale', async () => {
      vi.mocked(nextIntl.getTranslations).mockResolvedValue((key: string) => {
        if (key === 'staticData.teams.Germany') return 'Alemania';
        return key;
      });

      const result = await getTeamName('Germany', 'es');
      expect(result).toBe('Alemania');
    });

    it('should fall back to canonical name if translation missing', async () => {
      vi.mocked(nextIntl.getTranslations).mockResolvedValue((key: string, options: any) => {
        return options?.defaultValue || key;
      });

      const result = await getTeamName('UnknownTeam', 'en');
      expect(result).toBe('UnknownTeam');
    });
  });

  // Similar tests for getVenueName, getStageName, getTournamentName
});
```

### Component Tests

**Pattern:** For each modified component, create/update `*-i18n.test.tsx`

**Example:** `/__tests__/components/game-card/game-card-i18n.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import GameCard from '@/app/components/game-card/game-card';
import * as nextIntl from 'next-intl';
import { createMockTranslations } from '@/__tests__/utils/mock-translations';

vi.mock('next-intl');

describe('GameCard - i18n', () => {
  beforeEach(() => {
    vi.mocked(nextIntl.useLocale).mockReturnValue('es');
    vi.mocked(nextIntl.useTranslations).mockReturnValue(
      createMockTranslations('tournaments')
    );
  });

  it('should display localized venue name in Spanish', () => {
    const mockGame = {
      location: 'Munich Football Arena',
      // ... other game data
    };

    render(<GameCard game={mockGame} />);

    // Verify Spanish venue name appears
    expect(screen.getByText(/Arena de Fútbol de Múnich/i)).toBeInTheDocument();
  });

  it('should display localized venue name in English', () => {
    vi.mocked(nextIntl.useLocale).mockReturnValue('en');

    const mockGame = {
      location: 'Munich Football Arena',
      // ... other game data
    };

    render(<GameCard game={mockGame} />);

    // Verify English venue name appears
    expect(screen.getByText(/Munich Football Arena/i)).toBeInTheDocument();
  });

  // Test team names, stage names, etc.
});
```

### Manual Testing Checklist

**Happy Path:**
- [ ] Switch language from ES to EN
  - [ ] Team names update correctly (or remain canonical if Decision 1 = Option A)
  - [ ] Venue names update to English translations
  - [ ] Stage names update (e.g., "Octavos de Final" → "Round of 16")
  - [ ] Tournament names update (e.g., "Eurocopa 2024" → "UEFA Euro 2024")
- [ ] Switch language from EN to ES
  - [ ] All translations revert to Spanish correctly
  - [ ] No English remnants visible

**Fallback Behavior:**
- [ ] Verify canonical names appear when translation missing
  - [ ] Add a fake team name to data, don't add translation
  - [ ] Confirm canonical name displays (not broken or empty)
  - [ ] Check console for development warning
- [ ] Test with partially complete translations
  - [ ] Remove one venue translation from EN file
  - [ ] Verify fallback to canonical name
  - [ ] Verify no app crashes

**Tournament-Specific Tests:**
- [ ] Euro 2024 (24 teams, 10 venues)
  - [ ] All venue names translate correctly
  - [ ] All stage names translate correctly
- [ ] Copa América 2024 (16 teams, multiple venues)
  - [ ] If Decision 3 = Option A: Verify English canonical names work correctly
  - [ ] Venue translations match updated canonical names
- [ ] FIFA 2026 (48 teams, North American venues)
  - [ ] All 48 team names display correctly
  - [ ] North American venue names translate correctly

**Page-Level Tests:**
- [ ] Tournament list page
  - [ ] Tournament names display in correct locale
- [ ] Tournament detail page
  - [ ] Tournament name, team names, venue names all localized
- [ ] Games page
  - [ ] Venue names localized
  - [ ] Team names display correctly
- [ ] Groups standings page
  - [ ] Team names in table display correctly
- [ ] Playoff bracket page
  - [ ] Stage names localized (e.g., "Round of 16", "Quarterfinals")
  - [ ] Team names display correctly
- [ ] Awards page (team selector autocomplete)
  - [ ] Team names in dropdown display correctly
  - [ ] Search/filter works with both canonical and translated names (if applicable)
- [ ] Qualified teams page
  - [ ] Team names display correctly

**Edge Cases:**
- [ ] Locale switching during async page load
  - [ ] Switch locale while page is loading
  - [ ] Verify no race conditions or stale translations
- [ ] Multiple tournaments displayed simultaneously
  - [ ] Verify translations work across different tournaments on same page
- [ ] Long venue names
  - [ ] Check for UI overflow or truncation issues
  - [ ] Verify responsive design handles long translated names

## Validation Considerations

### SonarCloud Requirements

- ✅ **Code Coverage:** ≥80% on new code
  - Helper functions fully tested
  - Component translations tested
- ✅ **0 New Issues:** No new bugs, vulnerabilities, code smells
- ✅ **Security:** No hardcoded secrets or XSS vulnerabilities
- ✅ **Maintainability:** Functions are small, well-documented
- ✅ **Duplicated Code:** <5% duplication

### Performance Considerations

- **Translation lookup performance:**
  - `next-intl` uses efficient key lookup (O(1) hash map access)
  - Minimal overhead compared to direct string access
  - No noticeable performance impact expected

- **Batch operations:**
  - Use `getTeamNames()` for arrays of teams to reduce async overhead
  - Consider memoization for frequently accessed translations (if needed)

### Backward Compatibility

- ✅ **No database schema changes** - Existing data structure unchanged
- ✅ **Graceful fallbacks** - If translation missing, display canonical name
- ✅ **Optional locale parameter** - Repository functions maintain current signatures

### Extensibility

- ✅ **New languages:** Simply add new locale files (e.g., `/locales/pt/tournaments.json`)
- ✅ **New tournaments:** Add canonical data to `/data/`, add translations to i18n files
- ✅ **New teams/venues:** Add to translation files without code changes

## Pre-Implementation Checkpoint: Required Decisions

**⚠️ CRITICAL: These decisions MUST be confirmed before implementation can begin.**

The following architectural decisions are blockers for Phase 1 and Phase 2. User approval required.

### Decision 1: Team Name Translation Strategy

**Question:** Should we translate team names or keep them in canonical English?

**Options:**
- A. Keep canonical (e.g., "Germany", "Spain") - **RECOMMENDED**
- B. Translate country teams (e.g., "Germany" → "Alemania")

**Recommendation:** **Option A** - Keep canonical names
- Rationale: International sports standard, fan recognition, simplicity
- Implementation: Provide translations only if explicitly needed in UI copy

**Impact if delayed:** 40% of Phase 2 work (component updates) depends on this decision.

**⚠️ Decision needed from user before starting Phase 1.**

### Decision 2: Database Display Name Column

**Question:** Should we add a `display_name` column to `teams` table for pre-computed localized names?

**Options:**
- A. No database changes (use i18n JSON only) - **RECOMMENDED**
- B. Add `display_name_en` and `display_name_es` columns

**Recommendation:** **Option A** - No database changes
- Rationale: Simpler, more maintainable, follows existing i18n pattern
- Performance: Negligible overhead with next-intl key lookups

**Impact if delayed:** Affects helper function design and repository layer changes.

**⚠️ Decision needed from user before starting Phase 1.**

### Decision 3: Venue Name Canonical Source

**Question:** Should we standardize venue canonical names to English or keep original language?

**Current State:** Mix of English and Spanish in data files
- Euro 2024: English venue names
- Copa América: Spanish venue names (e.g., "Estadio Monumental")

**Options:**
- A. Standardize all canonical names to English - **RECOMMENDED**
- B. Keep original language (requires mapping canonical → English → other locales)

**Recommendation:** **Option A** - Standardize to English
- Rationale: Consistency, simpler translation mapping, single source of truth
- Implementation: Update `/data/copa-america/base-data.ts` to use English canonical names
- **Before/After Example:**
  - Before: `COL: 'Estadio Monumental'`
  - After: `COL: 'Monumental Stadium'`
  - Spanish translation: `"Monumental Stadium": "Estadio Monumental"`

**Impact if delayed:** Affects Phase 1 translation data creation and Copa América venue tests.

**⚠️ Decision needed from user before starting Phase 1.**

---

**Checkpoint Verification:**
- [ ] Decision 1 confirmed by user
- [ ] Decision 2 confirmed by user
- [ ] Decision 3 confirmed by user
- [ ] All three decisions documented in plan

**Only proceed to Phase 0 after all decisions confirmed.**

## Risk Assessment

### Low Risk
- ✅ No database schema changes
- ✅ Leverages existing i18n infrastructure
- ✅ Graceful fallbacks prevent breaking changes

### Medium Risk
- ⚠️ **Large number of components to update** - Mitigated by systematic component audit
- ⚠️ **Translation consistency** - Mitigated by centralized translation files and review

### High Risk
- ❌ None identified

## Dependencies

- ✅ `next-intl` v4.8.3 (already installed)
- ✅ Existing `tournaments` namespace (already configured)
- ✅ Existing i18n infrastructure (routing, locale detection)

## Timeline Estimate

- **Phase 0:** Pre-Implementation Audit - 1 hour
- **Phase 1:** Infrastructure Setup - 2-3 hours
- **Phase 2:** Component Migration - 4-5 hours
- **Phase 3:** Testing - 2-3 hours
- **Phase 4:** Documentation & Validation - 1-2 hours

**Total:** 10-14 hours (aligns with High effort estimate of 8-12 hours, with buffer for unknowns)

## Success Metrics

- [ ] All tournament static data displays in correct locale (EN/ES)
- [ ] 0 new SonarCloud issues
- [ ] ≥80% test coverage on new code
- [ ] All existing tests pass
- [ ] Build succeeds without errors
- [ ] Manual testing checklist complete
- [ ] Documentation updated

---

**Next Steps After Plan Approval:**
1. Resolve open questions with user
2. Execute Phase 1: Infrastructure Setup
3. Execute Phase 2: Component Migration
4. Execute Phase 3: Testing
5. Execute Phase 4: Documentation & Validation
6. Deploy to Vercel Preview for user testing

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

### Strategy Decision: Option 2 (User-Selected)

**Approach:** Add locale-specific JSON fields to database tables, use a generic `getLocalizedName()` helper function with fallback to original field value.

**User Decision Rationale:**
1. ✅ **Centralized data management** - All data (including translations) managed through backoffice
2. ✅ **No sync issues** - Translations stored alongside canonical data
3. ✅ **Flexible fallback** - If locale-specific value missing, falls back to original field
4. ✅ **Extensible** - Easy to add more languages by extending JSON structure
5. ✅ **Backoffice-driven** - Admins can manage translations without code changes

**Tradeoffs:**
- ⚠️ **Database schema changes required** - Need migrations for 4 tables
- ⚠️ **Backoffice updates required** - Must update config pages to support locale fields
- ⚠️ **Data migration complexity** - Current mixed-language data (some ES, some EN) needs handling
- ⚠️ **Potential data duplication** - Locale values stored in DB vs. i18n JSON approach

**Migration Strategy:**
- **No automatic migration** - Existing non-localized strings remain as fallback default
- Admins will add locale-specific values through backoffice as needed
- `getLocalizedName()` returns original value if locale field is null or empty

### Architecture

**🎯 KEY DECISION: Localization happens at Service/Action Layer (NOT Repository Layer)**

```
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer (NEW)                     │
│  tournaments: { long_name, long_name_i18n: {en,es} }      │
│  teams: { name, name_i18n: {en,es} }                      │
│  playoff_rounds: { round_name, round_name_i18n: {en,es} } │
│  games: { location, location_i18n: {en,es} }              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Repository Layer (UNCHANGED)                   │
│  ⚠️  Returns RAW data with i18n fields intact              │
│  ⚠️  NO locale parameter                                   │
│  ⚠️  NO localization logic                                 │
│                                                             │
│  Example:                                                   │
│  findTournamentById(id) → {                                │
│    long_name: "Copa América 2024",                         │
│    long_name_i18n: { en: "...", es: "..." }               │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         🎯 Service/Action Layer (LOCALIZATION HERE)        │
│                                                             │
│  1. Get locale from next-intl                              │
│  2. Fetch raw data from repository                         │
│  3. Apply localization with applyLocalization()            │
│  4. Return localized data to component                     │
│                                                             │
│  Example Server Action:                                     │
│  export async function getTournament(id) {                 │
│    const locale = await getLocale();                       │
│    const raw = await tournamentRepo.findById(id);          │
│    return applyLocalization(raw, locale, [...]);           │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Generic Localization Helpers (NEW)             │
│  applyLocalization(data, locale, fields)                   │
│    → Replaces field values with locale-specific versions   │
│    → Returns new object with localized strings            │
│                                                             │
│  applyLocalizationBatch(dataArray, locale, fields)         │
│    → Same but for arrays                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    UI Components (Render)                   │
│  Receive fully localized data from actions                 │
│  Team display: {team.name} (already localized)            │
│  Venue display: {game.location} (already localized)       │
│  ⚠️  NO localization logic in components                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Backoffice Admin UI (Modified)                 │
│  Forms to edit i18n fields: { en: "...", es: "..." }      │
│  Validation: at least one locale value required           │
└─────────────────────────────────────────────────────────────┘
```

**Why Service/Action Layer?**
1. **Repository Purity** - Repositories stay pure data access, no presentation logic
2. **Clear Responsibility** - Actions orchestrate: fetch data, transform for presentation, return to components
3. **Flexible Caching** - Can cache raw repository results, localize per-request
4. **Component Simplicity** - Components receive clean, localized data (no i18n logic)
5. **Next.js Pattern** - Server Actions are the natural "API layer" between server and client

### Database Schema Changes

**Tables to modify:**

1. **`tournaments` table** - Add i18n columns for names:
   ```sql
   ALTER TABLE tournaments
   ADD COLUMN long_name_i18n JSONB,
   ADD COLUMN short_name_i18n JSONB;
   ```
   Example data:
   ```json
   {
     "long_name": "Copa América 2024",
     "long_name_i18n": {
       "en": "Copa América 2024",
       "es": "Copa América 2024"
     },
     "short_name": "copa-america-2024",
     "short_name_i18n": {
       "en": "Copa América 2024",
       "es": "Copa América 2024"
     }
   }
   ```

2. **`teams` table** - Add i18n column for team names:
   ```sql
   ALTER TABLE teams
   ADD COLUMN name_i18n JSONB;
   ```
   Example data:
   ```json
   {
     "name": "Germany",
     "name_i18n": {
       "en": "Germany",
       "es": "Alemania"
     }
   }
   ```

3. **`playoff_rounds` table** - Add i18n column for stage names:
   ```sql
   ALTER TABLE playoff_rounds
   ADD COLUMN round_name_i18n JSONB;
   ```
   Example data:
   ```json
   {
     "round_name": "Round of 16",
     "round_name_i18n": {
       "en": "Round of 16",
       "es": "Octavos de Final"
     }
   }
   ```

4. **`games` table** - Add i18n column for venue names:
   ```sql
   ALTER TABLE games
   ADD COLUMN location_i18n JSONB;
   ```
   Example data:
   ```json
   {
     "location": "Munich Football Arena",
     "location_i18n": {
       "en": "Munich Football Arena",
       "es": "Arena de Fútbol de Múnich"
     }
   }
   ```

**JSON Structure:** `{ "en": "English value", "es": "Spanish value" }`
- Extensible to more locales: `{ "en": "...", "es": "...", "pt": "..." }`
- Nullable: If `null` or missing locale key, falls back to original field value

### Localization Helper Functions

Create new file: `/app/utils/localization-helper.ts`

```typescript
/**
 * Apply localization to an object with multiple i18n fields
 *
 * ⚠️ IMPORTANT: This function should be called in Server Actions ONLY
 * ⚠️ DO NOT call this in repositories or components
 * ⚠️ Repositories return raw data, Actions apply localization
 *
 * @param data - Object with both field and field_i18n properties
 * @param locale - Target locale ('en' | 'es')
 * @param fields - Array of field mappings: { field: 'name', i18nField: 'name_i18n' }
 * @returns New object with localized field values
 *
 * @example
 * // ✅ CORRECT: Use in Server Action
 * export async function getTournament(id: string) {
 *   const locale = await getLocale();
 *   const tournament = await tournamentRepo.findById(id); // Raw data
 *   return applyLocalization(tournament, locale, [
 *     { field: 'long_name', i18nField: 'long_name_i18n' },
 *     { field: 'short_name', i18nField: 'short_name_i18n' }
 *   ]);
 * }
 *
 * @example
 * // ❌ WRONG: Do NOT use in repository
 * export function findTournamentById(id: string, locale: string) {
 *   const tournament = await db.selectFrom('tournaments')...;
 *   return applyLocalization(tournament, locale, [...]); // NO!
 * }
 */
export function applyLocalization<T extends Record<string, any>>(
  data: T,
  locale: string,
  fields: Array<{ field: keyof T; i18nField: keyof T }>
): T {
  const localized = { ...data };

  for (const { field, i18nField } of fields) {
    const originalValue = data[field] as string;
    const i18nJson = data[i18nField] as Record<string, string> | null | undefined;

    // If no i18n JSON provided, keep original value
    if (!i18nJson) {
      continue;
    }

    // If locale exists in JSON, use it
    if (i18nJson[locale]) {
      localized[field] = i18nJson[locale] as T[keyof T];
    } else {
      // Fallback to original value
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[i18n] Missing locale "${locale}" for field "${String(field)}" ` +
          `with value "${originalValue}". Available locales: ${Object.keys(i18nJson).join(', ')}`
        );
      }
      // Keep original value (already in localized object)
    }
  }

  return localized;
}

/**
 * Batch localization for arrays of objects
 *
 * ⚠️ IMPORTANT: Use in Server Actions ONLY (same rules as applyLocalization)
 *
 * @example
 * // ✅ CORRECT: Use in Server Action
 * export async function getGamesForTournament(tournamentId: string) {
 *   const locale = await getLocale();
 *   const games = await gameRepo.findByTournament(tournamentId); // Raw data
 *   return applyLocalizationBatch(games, locale, [
 *     { field: 'location', i18nField: 'location_i18n' }
 *   ]);
 * }
 */
export function applyLocalizationBatch<T extends Record<string, any>>(
  dataArray: T[],
  locale: string,
  fields: Array<{ field: keyof T; i18nField: keyof T }>
): T[] {
  return dataArray.map(item => applyLocalization(item, locale, fields));
}
```

### Data Localization Strategy

With database locale fields, all internationalizable data follows the same pattern:

**1. Tournament Names:**
- Store original value in `long_name` / `short_name`
- Store localized versions in `long_name_i18n` / `short_name_i18n` JSON fields
- Example:
  ```json
  {
    "long_name": "Copa América 2024",
    "long_name_i18n": { "en": "Copa América 2024", "es": "Copa América 2024" }
  }
  ```

**2. Team Names:**
- Store original value in `name`
- Store localized versions in `name_i18n` JSON field
- Admin can decide: translate ("Germany" → "Alemania") or keep canonical for both locales
- Example (translated):
  ```json
  {
    "name": "Germany",
    "name_i18n": { "en": "Germany", "es": "Alemania" }
  }
  ```
- Example (canonical):
  ```json
  {
    "name": "Germany",
    "name_i18n": { "en": "Germany", "es": "Germany" }
  }
  ```

**3. Venue/Location Names:**
- Store original value in `location`
- Store localized versions in `location_i18n` JSON field
- Example:
  ```json
  {
    "location": "Munich Football Arena",
    "location_i18n": { "en": "Munich Football Arena", "es": "Arena de Fútbol de Múnich" }
  }
  ```

**4. Playoff Stage Names:**
- Store original value in `round_name`
- Store localized versions in `round_name_i18n` JSON field
- Example:
  ```json
  {
    "round_name": "Round of 16",
    "round_name_i18n": { "en": "Round of 16", "es": "Octavos de Final" }
  }
  ```

**5. Player Names (No Changes):**
- Keep player names in **original form** (no translation)
- Rationale: Proper nouns, international standard
- No i18n field needed for players table

## Files to Create

### New Files

1. **`/migrations/YYYYMMDDHHMMSS_add_i18n_columns.sql`**
   - Add `long_name_i18n` and `short_name_i18n` columns to `tournaments` table
   - Add `name_i18n` column to `teams` table
   - Add `round_name_i18n` column to `playoff_rounds` table
   - Add `location_i18n` column to `games` table
   - All columns: `JSONB` type, nullable

2. **`/app/utils/localization-helper.ts`**
   - `applyLocalization()` function for single objects
   - `applyLocalizationBatch()` function for arrays
   - Export both functions
   - **Extensive JSDoc documentation** with warnings about where to use

3. **`/__tests__/utils/localization-helper.test.ts`**
   - Unit tests for `applyLocalization()`
   - Test fallback behavior when i18n JSON is null
   - Test fallback behavior when locale missing from JSON
   - Test multiple field localization
   - Test `applyLocalizationBatch()` for arrays

4. **Backoffice Components** (location TBD based on existing backoffice structure)
   - **`/app/components/backoffice/i18n-field-editor.tsx`**
     - Reusable component for editing i18n JSON fields
     - Inputs for EN and ES values
     - Validation: at least one locale required
   - **`/app/components/backoffice/tournament-form-i18n.tsx`** (or extend existing)
     - Integrate i18n field editor for tournament names
   - **`/app/components/backoffice/team-form-i18n.tsx`** (or extend existing)
     - Integrate i18n field editor for team names
   - **`/app/components/backoffice/playoff-round-form-i18n.tsx`** (or extend existing)
     - Integrate i18n field editor for stage names
   - **`/app/components/backoffice/game-form-i18n.tsx`** (or extend existing)
     - Integrate i18n field editor for venue names

## Files to Modify

### Database Schema

1. **`/app/db/tables-definition.ts`**
   - Add i18n columns with **extensive documentation for future agents**:

```typescript
/**
 * Tournament table with internationalization support
 *
 * ⚠️ LOCALIZATION PATTERN:
 * - Repositories return RAW data (both 'long_name' and 'long_name_i18n')
 * - Server Actions apply localization using applyLocalization()
 * - Components receive localized data (only 'long_name' matters to them)
 *
 * ⚠️ DO NOT add locale parameters to repository functions
 * ⚠️ DO add applyLocalization() calls in Server Actions
 */
export interface TournamentTable extends Identifiable {
  // ... existing fields ...

  /**
   * Localized tournament name (JSON: { en: "...", es: "..." })
   * ⚠️ Must be localized in Server Action before returning to component
   * @see applyLocalization() in /app/utils/localization-helper.ts
   */
  long_name_i18n?: JSONColumnType<Record<string, string>>;

  /**
   * Localized short name (JSON: { en: "...", es: "..." })
   * ⚠️ Must be localized in Server Action before returning to component
   */
  short_name_i18n?: JSONColumnType<Record<string, string>>;
}

/**
 * Team table with internationalization support
 *
 * ⚠️ Same localization pattern as TournamentTable
 */
export interface TeamTable extends Identifiable {
  // ... existing fields ...

  /**
   * Localized team name (JSON: { en: "...", es: "..." })
   * ⚠️ Must be localized in Server Action before returning to component
   */
  name_i18n?: JSONColumnType<Record<string, string>>;
}

/**
 * Playoff round table with internationalization support
 *
 * ⚠️ Same localization pattern as TournamentTable
 */
export interface PlayoffRoundTable extends Identifiable {
  // ... existing fields ...

  /**
   * Localized round name (JSON: { en: "...", es: "..." })
   * ⚠️ Must be localized in Server Action before returning to component
   */
  round_name_i18n?: JSONColumnType<Record<string, string>>;
}

/**
 * Game table with internationalization support
 *
 * ⚠️ Same localization pattern as TournamentTable
 */
export interface GameTable extends Identifiable {
  // ... existing fields ...

  /**
   * Localized location/venue name (JSON: { en: "...", es: "..." })
   * ⚠️ Must be localized in Server Action before returning to component
   */
  location_i18n?: JSONColumnType<Record<string, string>>;
}
```

### Repository Layer

**⚠️ CRITICAL: Repositories DO NOT apply localization**

2. **`/app/db/tournament-repository.ts`**
   - **NO changes to function signatures** (no locale parameter)
   - **NO localization logic**
   - Returns raw data with i18n fields intact
   - Add JSDoc documentation:

```typescript
/**
 * Find tournament by ID
 *
 * ⚠️ RETURNS RAW DATA - i18n fields must be localized in Server Action
 * ⚠️ DO NOT add locale parameter to this function
 * ⚠️ DO NOT apply localization here
 *
 * @returns Tournament with both 'long_name' and 'long_name_i18n' fields
 * @see applyLocalization() must be called in Server Action layer
 */
export async function findTournamentById(id: string): Promise<Tournament> {
  // ... existing implementation (unchanged) ...
}
```

3. **`/app/db/team-repository.ts`** (if exists)
   - Same pattern: NO locale parameter, NO localization
   - Add JSDoc warnings

4. **`/app/db/game-repository.ts`**
   - Same pattern: NO locale parameter, NO localization
   - Add JSDoc warnings

5. **`/app/db/playoff-round-repository.ts`** (if exists)
   - Same pattern: NO locale parameter, NO localization
   - Add JSDoc warnings

### Server Actions

**🎯 THIS IS WHERE LOCALIZATION HAPPENS**

6. **`/app/actions/tournament-actions.ts`**
   - **Add localization logic to ALL actions that return tournament data**
   - Pattern for every action:
     1. Get locale from `next-intl/server`
     2. Fetch raw data from repository
     3. Apply localization with `applyLocalization()`
     4. Return localized data

```typescript
import { getLocale } from 'next-intl/server';
import { applyLocalization } from '@/app/utils/localization-helper';
import * as tournamentRepo from '@/app/db/tournament-repository';

/**
 * Get tournament by ID with localized names
 *
 * ✅ CORRECT: Applies localization before returning to component
 */
export async function getTournament(id: string) {
  const locale = await getLocale();
  const rawTournament = await tournamentRepo.findTournamentById(id);

  return applyLocalization(rawTournament, locale, [
    { field: 'long_name', i18nField: 'long_name_i18n' },
    { field: 'short_name', i18nField: 'short_name_i18n' }
  ]);
}

/**
 * Get all tournaments with localized names
 */
export async function getAllTournaments() {
  const locale = await getLocale();
  const rawTournaments = await tournamentRepo.findAllTournaments();

  return applyLocalizationBatch(rawTournaments, locale, [
    { field: 'long_name', i18nField: 'long_name_i18n' },
    { field: 'short_name', i18nField: 'short_name_i18n' }
  ]);
}
```

7. **`/app/actions/game-actions.ts`** (if exists)
   - Same pattern: get locale, fetch raw data, apply localization
   - Localize `location` field with `location_i18n`

8. **`/app/actions/team-actions.ts`** (if exists)
   - Same pattern: localize `name` field with `name_i18n`

9. **`/app/actions/playoff-round-actions.ts`** (if exists)
   - Same pattern: localize `round_name` field with `round_name_i18n`

### UI Components (Examples - identify all usages via Phase 0 audit)

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

### Phase 1: Database Schema & Helper Infrastructure (2-3 hours)

1. **Create database migration**
   - Create `/migrations/YYYYMMDDHHMMSS_add_i18n_columns.sql`
   - Add JSONB columns to 4 tables:
     - `tournaments`: `long_name_i18n`, `short_name_i18n`
     - `teams`: `name_i18n`
     - `playoff_rounds`: `round_name_i18n`
     - `games`: `location_i18n`
   - All columns nullable (existing data won't have values yet)
   - **⚠️ IMPORTANT:** Ask user permission before running migration (see implementation.md Section 9 Step 4)

2. **Update TypeScript schema definitions**
   - Update `/app/db/tables-definition.ts`
   - Add i18n column types to interfaces:
     - `TournamentTable`: `long_name_i18n`, `short_name_i18n`
     - `TeamTable`: `name_i18n`
     - `PlayoffRoundTable`: `round_name_i18n`
     - `GameTable`: `location_i18n`
   - Use `JSONColumnType<Record<string, string>>` type

3. **Create localization helper utilities**
   - Create `/app/utils/localization-helper.ts`
   - Implement `applyLocalization()` - single object localization
   - Implement `applyLocalizationBatch()` - array localization
   - **Add extensive JSDoc documentation** with:
     - ⚠️ Warnings that this should ONLY be used in Server Actions
     - ❌ Examples of what NOT to do (using in repositories)
     - ✅ Examples of correct usage (Server Actions pattern)
   - Add development mode warnings for missing locales

### Phase 2: Service/Action Layer Updates (2-3 hours)

**🎯 CRITICAL: This is the ONLY place where localization happens**

4. **Add JSDoc documentation to repository functions**
   - **DO NOT change function logic** - repositories stay pure
   - **DO NOT add locale parameters**
   - **DO add warnings in JSDoc** for future agents:

```typescript
/**
 * ⚠️ RETURNS RAW DATA - must be localized in Server Action
 * ⚠️ DO NOT add locale parameter
 * ⚠️ DO NOT apply localization here
 * @see applyLocalization() in /app/utils/localization-helper.ts
 */
```

   - Add to all repository functions that return:
     - Tournaments (long_name, short_name)
     - Teams (name)
     - Games (location)
     - Playoff rounds (round_name)

5. **Update ALL Server Actions that return localizable data**

   **Pattern (apply to EVERY action):**
   ```typescript
   import { getLocale } from 'next-intl/server';
   import { applyLocalization } from '@/app/utils/localization-helper';

   export async function getXyz() {
     const locale = await getLocale();
     const rawData = await xyzRepo.find...(); // Raw data from repo
     return applyLocalization(rawData, locale, [...]); // Localize here
   }
   ```

   **Actions to update:**
   - `/app/actions/tournament-actions.ts` - ALL actions returning tournaments
   - `/app/actions/game-actions.ts` - ALL actions returning games
   - `/app/actions/team-actions.ts` (if exists) - ALL actions returning teams
   - `/app/actions/playoff-round-actions.ts` (if exists) - ALL actions returning playoff rounds
   - Any other actions that return tournament data

6. **Verify UI Components need NO changes**
   - Components already call Server Actions
   - Actions now return localized data
   - Components just render `{team.name}`, `{game.location}`, etc.
   - **No component changes needed** (data arrives pre-localized)

### Phase 3: Backoffice UI Updates (3-4 hours)

**Existing Backoffice Structure:**
- **Tournament Data Management** (includes Playoff Stage Management sub-component)
- **Game Management**
- **Team Management**

---

#### 7. Create Reusable i18n Field Editor Component

**File:** `/app/components/backoffice/i18n-field-editor.tsx`

**Component Design:**

```typescript
interface I18nFieldEditorProps {
  label: string;
  value: { en?: string; es?: string } | null;
  onChange: (value: { en: string; es: string }) => void;
  originalValue?: string; // Display reference to original field
  required?: boolean;
  helperText?: string;
}

export function I18nFieldEditor({ label, value, onChange, originalValue, ... }: I18nFieldEditorProps) {
  // ...
}
```

**Visual Layout:**

```
┌────────────────────────────────────────────────────┐
│ Tournament Name (Localized)                        │
├────────────────────────────────────────────────────┤
│                                                    │
│ Original Value (Reference):                       │
│ [Copa América 2024                            ]   │
│ (Read-only, grayed out)                           │
│                                                    │
│ English (en):                                     │
│ [Copa América 2024                            ]   │
│                                                    │
│ Spanish (es):                                     │
│ [Copa América 2024                            ]   │
│                                                    │
│ ⓘ At least one language must be provided         │
└────────────────────────────────────────────────────┘
```

**Features:**
- Two text inputs (EN and ES)
- Optional display of original field value as reference
- Validation: at least one locale required
- Clear labels with flag emojis: "🇺🇸 English" / "🇦🇷 Spanish"
- Helper text explaining fallback behavior

---

#### 8. Update Tournament Data Management

**Location:** Existing Tournament form (exact path TBD - you'll know the structure)

**Changes Needed:**

**A. Tournament Form (long_name, short_name)**

Add i18n fields after the original fields:

```
┌─────────────────────────────────────────────────────────┐
│ Tournament Information                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Long Name:                                              │
│ [Copa América 2024                                  ]   │
│                                                         │
│ ↓ Add below ↓                                          │
│                                                         │
│ <I18nFieldEditor                                       │
│   label="Long Name (Localized)"                        │
│   value={tournament.long_name_i18n}                    │
│   originalValue={tournament.long_name}                 │
│   onChange={(v) => setTournament({...tournament,       │
│     long_name_i18n: v                                  │
│   })}                                                   │
│ />                                                      │
│                                                         │
│ Short Name:                                             │
│ [copa-america-2024                                  ]   │
│                                                         │
│ <I18nFieldEditor                                       │
│   label="Short Name (Localized)"                        │
│   value={tournament.short_name_i18n}                   │
│   originalValue={tournament.short_name}                │
│   onChange={...}                                        │
│ />                                                      │
│                                                         │
│ [Save Tournament]                                       │
└─────────────────────────────────────────────────────────┘
```

**Server Action Update:**
- Modify `createTournament()` or `updateTournament()` action
- Accept `long_name_i18n` and `short_name_i18n` from form
- Save to database: `{ ...data, long_name_i18n, short_name_i18n }`

**B. Playoff Stage Management Sub-Component**

Add i18n field for `round_name`:

```
┌─────────────────────────────────────────────────────────┐
│ Playoff Stages                                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Stage Name:                                             │
│ [Round of 16                                        ]   │
│                                                         │
│ <I18nFieldEditor                                       │
│   label="Stage Name (Localized)"                        │
│   value={stage.round_name_i18n}                        │
│   originalValue={stage.round_name}                     │
│   onChange={...}                                        │
│ />                                                      │
│                                                         │
│ [Add Stage] [Edit] [Delete]                            │
└─────────────────────────────────────────────────────────┘
```

**Server Action Update:**
- Modify playoff stage create/update actions
- Accept `round_name_i18n` from form
- Save to database

---

#### 9. Update Game Management

**Location:** Existing Game form

**Changes Needed:**

Add i18n field for `location`:

```
┌─────────────────────────────────────────────────────────┐
│ Game Information                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Home Team:                                              │
│ [Select team ▼]                                        │
│                                                         │
│ Away Team:                                              │
│ [Select team ▼]                                        │
│                                                         │
│ Location/Venue:                                         │
│ [Munich Football Arena                              ]   │
│                                                         │
│ ↓ Add below ↓                                          │
│                                                         │
│ <I18nFieldEditor                                       │
│   label="Location (Localized)"                          │
│   value={game.location_i18n}                           │
│   originalValue={game.location}                        │
│   onChange={(v) => setGame({...game,                   │
│     location_i18n: v                                   │
│   })}                                                   │
│ />                                                      │
│                                                         │
│ Game Date:                                              │
│ [2024-06-14 ▼]                                         │
│                                                         │
│ [Save Game]                                             │
└─────────────────────────────────────────────────────────┘
```

**Server Action Update:**
- Modify `createGame()` or `updateGame()` action
- Accept `location_i18n` from form
- Save to database

---

#### 10. Update Team Management

**Location:** Existing Team form

**Changes Needed:**

Add i18n field for `name`:

```
┌─────────────────────────────────────────────────────────┐
│ Team Information                                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Team Name:                                              │
│ [Germany                                            ]   │
│                                                         │
│ ↓ Add below ↓                                          │
│                                                         │
│ <I18nFieldEditor                                       │
│   label="Team Name (Localized)"                         │
│   value={team.name_i18n}                               │
│   originalValue={team.name}                            │
│   onChange={(v) => setTeam({...team,                   │
│     name_i18n: v                                       │
│   })}                                                   │
│   helperText="Keep same in both languages for          │
│     canonical names (e.g., 'Germany'), or translate    │
│     (e.g., EN: 'Germany', ES: 'Alemania')"             │
│ />                                                      │
│                                                         │
│ Short Name:                                             │
│ [GER]                                                   │
│                                                         │
│ Colors:                                                 │
│ Primary: [#000000] Secondary: [#FF0000]                │
│                                                         │
│ [Save Team]                                             │
└─────────────────────────────────────────────────────────┘
```

**Server Action Update:**
- Modify `createTeam()` or `updateTeam()` action
- Accept `name_i18n` from form
- Save to database

---

#### 11. Form Validation Rules

**All forms must validate:**
1. At least one locale value (EN or ES) is provided
2. If both provided, neither can be empty string
3. Validation error message: "Please provide at least one translation (English or Spanish)"

**Example validation logic:**
```typescript
function validateI18nField(value: { en?: string; es?: string } | null): boolean {
  if (!value) return false;
  const hasEn = value.en && value.en.trim().length > 0;
  const hasEs = value.es && value.es.trim().length > 0;
  return hasEn || hasEs; // At least one must be provided
}
```

---

#### Implementation Notes

**For each form update:**
1. Import `I18nFieldEditor` component
2. Add state for `*_i18n` field
3. Place `I18nFieldEditor` below original field
4. Update Server Action to accept i18n field
5. Update database insert/update query to include i18n column
6. Add validation before save

**No breaking changes:**
- Existing forms continue working (i18n fields are nullable)
- Old tournaments/teams/games without i18n values still function
- Admins can gradually add translations over time

### Phase 4: Testing (2-3 hours)

12. **Create unit tests for helpers**
    - Create `/__tests__/utils/localization-helper.test.ts`
    - Test `getLocalizedName()`:
      - Returns locale value when i18n JSON provided
      - Falls back to fieldValue when i18n JSON is null
      - Falls back to fieldValue when locale missing from JSON
      - Logs warning in development mode
    - Test `applyLocalization()`:
      - Localizes single object correctly
      - Handles multiple fields
    - Test `applyLocalizationBatch()`:
      - Localizes array of objects correctly

13. **Create/update repository tests**
    - Test repository functions with locale parameter
    - Mock database responses with i18n JSON fields
    - Verify localization applied correctly
    - Test fallback behavior when i18n JSON is null

14. **Create/update component i18n tests** (if components were modified)
    - For each modified component, create/update `*-i18n.test.tsx` file
    - Mock repository responses with localized data
    - Test rendering in both EN and ES locales
    - Verify correct translations appear

15. **Backoffice UI tests**
    - Test i18n field editor component
    - Test form submissions with i18n values
    - Verify JSON is saved correctly to database

### Phase 5: Documentation & Validation (1-2 hours)

16. **Update documentation**
    - Update `/docs/i18n-guide.md`:
      - Add section: "Database-Driven Internationalization"
      - Document `getLocalizedName()` function and usage
      - Document `applyLocalization()` pattern in repositories
      - Add examples of JSON structure: `{ "en": "...", "es": "..." }`
      - Add guidance on adding new locales
    - Update `/app/utils/i18n-patterns.md`:
      - Add pattern for database i18n fields
      - Add repository layer localization examples
      - Document fallback behavior
    - Add backoffice documentation:
      - How to add localized values through admin UI
      - Validation requirements (at least one locale)
      - Best practices for translation quality

17. **Run validation checks**
    - Run `npm test` - All tests must pass
    - Run `npm run lint` - No linting errors
    - Run `npm run build` - Build must succeed
    - Verify 80% coverage on new code
    - Check SonarCloud preview (if available)

18. **Manual integration testing**
    - Test locale switching (EN ↔ ES):
      - Tournament names update
      - Team names update (if localized in backoffice)
      - Venue names update
      - Stage names update
    - Test fallback behavior:
      - View tournaments/teams without i18n values
      - Verify original field value displays correctly
    - Test backoffice:
      - Create new tournament with i18n values
      - Edit existing tournament to add i18n values
      - Verify values save and display correctly on frontend
    - Test across all tournaments:
      - Euro 2024, Copa América 2024, FIFA 2026

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
import { describe, it, expect } from 'vitest';
import { getLocalizedName, applyLocalization } from '@/app/utils/localization-helper';

describe('localization-helper', () => {
  describe('getLocalizedName', () => {
    it('should return localized value when i18n JSON provided', () => {
      const i18nJson = { en: 'Germany', es: 'Alemania' };
      const result = getLocalizedName('Germany', i18nJson, 'es');
      expect(result).toBe('Alemania');
    });

    it('should return English value for EN locale', () => {
      const i18nJson = { en: 'Germany', es: 'Alemania' };
      const result = getLocalizedName('Germany', i18nJson, 'en');
      expect(result).toBe('Germany');
    });

    it('should fall back to field value when i18n JSON is null', () => {
      const result = getLocalizedName('Germany', null, 'es');
      expect(result).toBe('Germany');
    });

    it('should fall back to field value when locale missing from JSON', () => {
      const i18nJson = { en: 'Germany' }; // Missing 'es'
      const result = getLocalizedName('Germany', i18nJson, 'es');
      expect(result).toBe('Germany');
    });
  });

  describe('applyLocalization', () => {
    it('should localize multiple fields in object', () => {
      const tournament = {
        long_name: 'Copa América 2024',
        long_name_i18n: { en: 'Copa América 2024', es: 'Copa América 2024' },
        short_name: 'copa-america-2024',
        short_name_i18n: { en: 'Copa América 2024', es: 'Copa América 2024' }
      };

      const localized = applyLocalization(tournament, 'es', [
        { field: 'long_name', i18nField: 'long_name_i18n' },
        { field: 'short_name', i18nField: 'short_name_i18n' }
      ]);

      expect(localized.long_name).toBe('Copa América 2024');
      expect(localized.short_name).toBe('Copa América 2024');
    });
  });
});
```

### Component Tests

**Pattern:** Test repository functions with locale parameter

**Example:** `/__tests__/db/game-repository-i18n.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { findGamesInTournament } from '@/app/db/game-repository';
import { getLocalizedName } from '@/app/utils/localization-helper';

describe('game-repository - i18n', () => {
  it('should return localized game location for ES locale', async () => {
    // Mock database response
    const mockDbGames = [{
      id: '1',
      location: 'Munich Football Arena',
      location_i18n: { en: 'Munich Football Arena', es: 'Arena de Fútbol de Múnich' },
      // ... other fields
    }];

    // Mock DB query (implementation-specific)
    vi.mocked(db.selectFrom).mockReturnValue(mockDbGames);

    const games = await findGamesInTournament('tournament-1', 'es');

    expect(games[0].location).toBe('Arena de Fútbol de Múnich');
  });

  it('should fall back to original location when i18n is null', async () => {
    const mockDbGames = [{
      id: '1',
      location: 'Munich Football Arena',
      location_i18n: null, // No localization data
      // ... other fields
    }];

    vi.mocked(db.selectFrom).mockReturnValue(mockDbGames);

    const games = await findGamesInTournament('tournament-1', 'es');

    expect(games[0].location).toBe('Munich Football Arena'); // Fallback
  });
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

- **JSONB field access:**
  - PostgreSQL JSONB is binary format (faster than text JSON)
  - Indexing not needed for i18n fields (small objects, not queried)
  - Negligible overhead compared to string columns

- **Repository layer localization:**
  - `getLocalizedName()` is synchronous (no async overhead)
  - `applyLocalization()` runs in-memory (no database calls)
  - Batch operations (`applyLocalizationBatch()`) use map (efficient for arrays)

- **No caching needed:**
  - Localization applied at query time (repository layer)
  - Results cached by Next.js (Server Components, React Server Cache)
  - No additional caching strategy required

### Backward Compatibility

- ✅ **Nullable i18n columns** - Existing rows work without i18n values
- ✅ **Graceful fallbacks** - `getLocalizedName()` returns original field value if i18n JSON is null
- ✅ **Optional locale parameter** - Repository functions default to 'es' if locale not provided
- ✅ **No breaking changes** - Components receive localized data transparently

### Extensibility

- ✅ **New languages:** Extend JSON structure: `{ "en": "...", "es": "...", "pt": "..." }`
- ✅ **New tournaments:** Add through backoffice with i18n values
- ✅ **New teams/venues:** Add through backoffice with i18n values
- ✅ **New localizable fields:** Add `*_i18n` column, update repository, add to backoffice form
- ✅ **No code changes** needed to add translations (done through admin UI)

## Pre-Implementation Decisions: ✅ RESOLVED

**User has selected Option 2: Database locale fields approach**

All architectural decisions have been made:

### ✅ Decision 1: Localization Strategy
**Selected:** Database JSON locale fields with `getLocalizedName()` fallback function
- Add i18n columns to: tournaments, teams, playoff_rounds, games tables
- JSON format: `{ "en": "...", "es": "..." }`
- Fallback: If i18n JSON is null or locale missing, return original field value

### ✅ Decision 2: Team Name Translation
**Selected:** Admin-controlled via backoffice
- Admins can choose to translate or keep canonical per team
- Example translated: `{ "name": "Germany", "name_i18n": { "en": "Germany", "es": "Alemania" } }`
- Example canonical: `{ "name": "Germany", "name_i18n": { "en": "Germany", "es": "Germany" } }`

### ✅ Decision 3: Backoffice Scope
**Selected:** Include backoffice updates in this story
- Create reusable i18n field editor component
- Update tournament, team, playoff round, and game forms
- Forms will allow admins to enter EN and ES values

### ✅ Decision 4: Migration Strategy
**Selected:** No automatic migration
- Leave existing non-localized strings as fallback default
- Admins add locale values through backoffice as needed
- `getLocalizedName()` handles missing values gracefully

### ✅ Decision 5: Venue Canonical Names
**Selected:** Accept current mixed-language state
- No standardization needed (covered by i18n JSON approach)
- Current Spanish venue names (Copa América) remain as-is
- Admins add English translations via backoffice

---

**All decisions locked. Ready to proceed to Phase 0.**

## Risk Assessment

### Low Risk
- ✅ Graceful fallbacks prevent breaking changes (returns original value if i18n JSON null)
- ✅ Nullable columns - existing data continues working
- ✅ Backoffice-driven - no code changes needed to add new translations

### Medium Risk
- ⚠️ **Database schema changes** - Mitigated by:
  - Nullable columns (no data required initially)
  - User permission required before running migration
  - Rollback plan: drop columns if issues arise
- ⚠️ **Backoffice UI complexity** - Mitigated by:
  - Reusable i18n field editor component
  - Clear validation rules
  - Consistent pattern across all forms
- ⚠️ **Repository layer changes** - Mitigated by:
  - Systematic audit in Phase 0
  - Backward compatibility (locale parameter optional with default)
  - Generic `applyLocalization()` function reduces duplication

### High Risk
- ❌ None identified

**Mitigation Strategies:**
- Test migration on dev database first
- Create database backup before running migration
- Implement comprehensive fallback logic
- Extensive testing of repository localization
- User acceptance testing in Vercel Preview before merge

## Dependencies

- ✅ PostgreSQL database with JSONB support (already in use)
- ✅ Kysely ORM with JSONColumnType (already in use)
- ✅ `next-intl` for locale detection (already installed)
- ✅ Existing backoffice infrastructure (forms, server actions)
- ⚠️ Database migration permissions (must ask user before running)

**New Dependencies:** None (all required libraries already installed)

## Timeline Estimate

- **Phase 0:** Pre-Implementation Audit - 1 hour
- **Phase 1:** Database Schema & Helper Infrastructure - 2-3 hours
- **Phase 2:** Repository & Service Layer Updates - 3-4 hours
- **Phase 3:** Backoffice UI Updates - 3-4 hours
- **Phase 4:** Testing - 2-3 hours
- **Phase 5:** Documentation & Validation - 1-2 hours

**Total:** 12-17 hours

**Note:** Original estimate was 8-12 hours, but database approach + backoffice UI work adds 4-5 hours.
- Database migrations + TypeScript updates: +1-2 hours
- Backoffice UI components (4 forms + reusable editor): +3-4 hours
- Additional testing (backoffice tests): +1 hour

**Recommendation:** Update story effort estimate to reflect actual scope.

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

# Implementation Plan: Story #159 - Error Messages & Validation Internationalization

## Context

This story internationalizes all remaining error messages and validation throughout the app to support both Spanish and English locales. Story #152 (Auth Flow) already internationalized some server action files and established the i18n pattern. Story #159 extends this pattern to ALL remaining server action files and error boundaries.

**Why this change is needed:**
- Issue #159 requires: Form validation, Server action errors, API error responses, Network errors, Database errors, Error boundaries
- Unknown number of hardcoded error messages remain after Stories #152-#154
- Users in different locales see untranslated errors
- Error boundaries lack i18n support

**Current State (IMPORTANT):**
- Working from MAIN branch (no story worktree created yet)
- Stories #152-#154 were just merged (Feb 18, 2026)
- MUST audit main branch to understand what's actually been done vs. what remains
- Previous abandoned attempt had stale task list - ignore it

**Revised Approach:**
This is NOT greenfield implementation. This is **audit → gap analysis → remediation** work.

## Pattern to Follow (From Story #152 - PR #173)

### 1. Locale Parameter Pattern
- **Position:** Last parameter in function signature
- **Type:** `Locale` from `i18n.config`
- **Default:** `'es'` (Spanish default)

```typescript
import type { Locale } from '../../i18n.config';

export async function functionName(
  param1: string,
  param2: Type,
  locale: Locale = 'es'
): Promise<{ success: boolean; error?: string; data?: T }> {
  // ...
}
```

### 2. Translation Function Usage
- **Use `getTranslations` directly** from `next-intl/server` (NO wrapper utility)
- **Two-namespace pattern:**
  - Primary namespace for domain-specific messages (auth, groups, tournaments, etc.)
  - Fallback `errors` namespace in catch blocks

```typescript
import { getTranslations } from 'next-intl/server';

export async function yourAction(param: string, locale: Locale = 'es') {
  const t = await getTranslations({ locale, namespace: 'domain-namespace' });

  try {
    // Validation with primary namespace
    if (!param) {
      return { success: false, error: t('section.field.required') };
    }

    // Success
    return { success: true, data: result };
  } catch (error) {
    console.error("Error:", error);

    // Fallback to errors namespace
    const tErrors = await getTranslations({ locale, namespace: 'errors' });
    return { success: false, error: tErrors('generic') };
  }
}
```

### 3. Error Response Format
```typescript
// Standard return type
Promise<{ success: boolean; error?: string; data?: T }>

// Success
return { success: true };
return { success: true, data: result };

// Error
return { success: false, error: t('key') };
```

### 4. Translation Key Structure
- **Format:** `namespace.context.key` or `context.key` within namespace
- **Dot notation:** `t('section.subsection.key')`
- **Interpolation:** `t('key', { var: value })`

### 5. Translation Placeholder Pattern (CRITICAL)

**For new translation keys being added:**

**English files (`locales/en/*.json`):**
- Use `EnOf(Spanish text)` as placeholder for content that needs English translation
- Example: `"unauthorized": "EnOf(No autorizado)"`
- Indicates: This is Spanish text that needs to be translated TO English

**Spanish files (`locales/es/*.json`):**
- Use `EsOf(English text)` as placeholder for content that needs Spanish translation
- Example: `"unauthorized": "EsOf(Unauthorized)"`
- Indicates: This is English text that needs to be translated TO Spanish

**Purpose:**
- Placeholder format indicates what needs translation and provides source text for reference
- Makes it easy to identify untranslated content during review
- **Actual translation to English/Spanish happens in a SEPARATE story** (not Story #159)

**Workflow for Story #159:**
1. Add keys with placeholder format based on source language in code
2. **KEEP the EnOf/EsOf placeholders** - DO NOT attempt actual translations
3. Commit translation files WITH placeholders intact
4. Translation from placeholders to actual English/Spanish is OUT OF SCOPE for this story

**Example based on source language:**
```json
// If source code has: "Unauthorized: Admin only"
// locales/en/errors.json:
{
  "admin": {
    "unauthorized": "Unauthorized: Admin only"  // Keep English as-is
  }
}

// locales/es/errors.json:
{
  "admin": {
    "unauthorized": "EsOf(Unauthorized: Admin only)"  // KEEP placeholder - translation happens in separate story
  }
}

// If source code has: "No autorizado: Solo admin"
// locales/en/errors.json:
{
  "admin": {
    "unauthorized": "EnOf(No autorizado: Solo admin)"  // KEEP placeholder - translation happens in separate story
  }
}

// locales/es/errors.json:
{
  "admin": {
    "unauthorized": "No autorizado: Solo admin"  // Keep Spanish as-is
  }
}
```

## Scope Clarification

**✅ SCOPE CONFIRMED BY USER**

**In Scope for Story #159:**
- ✅ Server action error messages (all app/actions/*.ts files)
- ✅ Error boundary messages
- ✅ Client components calling server actions
- ✅ **Client-side form validation** (Zod schemas, React Hook Form, etc.) - USER CONFIRMED
- ✅ **API route error responses** (app/api/* if they exist) - USER CONFIRMED
- ✅ **Network error handling wrappers** (fetch/axios if they exist) - USER CONFIRMED

**Out of Scope:**
- ❌ **Push notification content** (game-notification-actions.ts) - Separate story
- ❌ **Actual translation of EnOf/EsOf placeholders** - Separate story (keep placeholders in this story)

**Impact of Expanded Scope:**
- Phase 0 audit must include: client-side forms, API routes, network utilities
- Translation keys needed for: client validation errors, API error codes, network failures
- Effort estimate increases to moderate-high range (15-25 hours vs. original 7-19 hours)
- Hybrid execution mode more likely due to increased file count

## Implementation Strategy

### Phase 0: Current State Audit (CRITICAL FIRST STEP)

**Purpose:** Understand what Stories #152-#154 actually accomplished in main branch before planning remaining work.

**Step 0.1: Create Story Worktree**
```bash
./scripts/github-projects-helper story start 159 --project 1
# Creates /Users/gvinokur/Personal/qatar-prode-story-159
# Copies .env.local and .claude/ automatically
cd /Users/gvinokur/Personal/qatar-prode-story-159
```

**Step 0.2: Audit Server Action Files**

For each server action file in `app/actions/`:

1. **Check i18n implementation status:**
   - [ ] Has locale parameter? (position: last, default: 'es', type: Locale)
   - [ ] Uses getTranslations directly? (not wrapper)
   - [ ] Uses two-namespace pattern? (primary + errors fallback)
   - [ ] Returns { success, error?, data? } format?

2. **Find remaining hardcoded strings:**
   ```bash
   # Search for common error patterns
   grep -n "throw new Error" app/actions/*.ts
   grep -n "Unauthorized" app/actions/*.ts
   grep -n "not found" app/actions/*.ts
   grep -n "Failed to" app/actions/*.ts
   ```

3. **Categorize each file:**
   - ✅ COMPLETE: Full i18n implementation, no hardcoded strings
   - 🟡 PARTIAL: Has locale parameter but some hardcoded strings remain
   - ❌ NOT STARTED: No i18n implementation

**Step 0.3: Audit Translation Files**

Check existing translation files:
```bash
ls -la locales/en/
ls -la locales/es/
```

For each translation file:
- [ ] errors.json - What keys exist? What's missing?
- [ ] validation.json - Complete or needs additions?
- [ ] auth.json - Check Story #152's additions
- [ ] Other namespaces? (tournaments, games, groups, backoffice, etc.)

**Step 0.4: Audit Error Boundaries**

Find all error boundary files:
```bash
find app -name "error.tsx"
```

For each error boundary:
- [ ] Is it internationalized?
- [ ] Uses useTranslations?
- [ ] Has hardcoded strings?

**Step 0.5: Audit Client Components & Forms**

```bash
# Find components importing server actions
grep -r "from.*actions" app --include="*.tsx" | head -20

# Check if they pass locale parameter
grep -A 5 "await.*Action\(" app/components/*.tsx | head -50

# Find client-side form validation (Zod schemas)
grep -r "z\." app --include="*.tsx" --include="*.ts" | grep -v node_modules | head -30

# Find React Hook Form usage
grep -r "useForm\|react-hook-form" app --include="*.tsx"

# Find form validation error displays
grep -r "errors\." app --include="*.tsx" | head -20
```

**Step 0.6: Audit API Routes**

```bash
# Find API route handlers
find app/api -name "route.ts" 2>/dev/null

# Check for error responses in API routes
grep -r "Response\|NextResponse" app/api --include="*.ts" | grep -i error
```

**Step 0.7: Audit Network Error Handling**

```bash
# Find fetch/axios wrappers or utilities
grep -r "fetch\|axios" app/utils --include="*.ts"

# Find error handling for network requests
grep -r "catch.*error" app/utils --include="*.ts"
```

**Step 0.8: Create Gap Analysis Document**

Document findings:
```markdown
## Gap Analysis Results

### Server Actions Status
- COMPLETE (0 files): [list]
- PARTIAL (X files): [list with issues]
- NOT STARTED (Y files): [list]

### Translation Files Status
- errors.json: [X keys, missing: Y keys]
- validation.json: [X keys, missing: Y keys]
- New namespaces needed: [list]

### Error Boundaries Status
- Total found: X
- Internationalized: Y
- Need work: Z

### Client Components Status
- Sample checked: X components
- Pattern compliance: Y/X passing locale correctly

### Client-Side Forms Status
- Zod schemas found: X files
- Form validation patterns: [describe]
- Error display mechanisms: [describe]

### API Routes Status
- Total routes found: X
- Routes with error responses: Y
- Need i18n: Z routes

### Network Error Handling Status
- Utilities found: [list]
- Error handling patterns: [describe]
- Need i18n: [Y/N]

### Estimated Remaining Work
- Server actions to update: X files
- Client components to update: ~Y components
- Client forms to update: ~Z forms
- API routes to update: ~W routes
- Network utilities to update: ~V files
- Translation keys to add: ~U keys
- Tests to create/update: ~T tests
```

**Output:** Clear understanding of actual remaining work vs. assumptions

---

### Phase 1: Translation Key Planning & Creation

**1.1 Analyze Error Categories**
Based on survey, 15 server action files contain these error types:
- Authorization/Authentication: ~35 messages
- Data validation: ~20 messages
- Business logic: ~15 messages
- Data lookup ("not found"): ~12 messages
- File operations: ~8 messages
- Other: ~7 messages

**1.2 Organize Translation Keys by Namespace**

**Namespace Strategy Decision (Hybrid Approach):**

**Option Chosen: Hybrid - Generic in errors.json, Domain-specific get own files**

Rationale:
- **errors.json** - Keep generic cross-cutting errors (generic, unauthorized, notFound, etc.)
- **Domain namespace files** - Domain-specific errors that belong to a feature area

**Translation Files Strategy:**

**EXTEND EXISTING:**
- `locales/en/errors.json` - Add generic errors only (not domain-specific)
- `locales/es/errors.json` - Spanish translations
- `locales/en/validation.json` - Add validation rules (if needed based on audit)
- `locales/es/validation.json` - Spanish translations

**CREATE NEW (Only if audit shows they're needed):**
- `locales/en/tournaments.json` + `locales/es/tournaments.json` - Tournament domain errors
- `locales/en/groups.json` + `locales/es/groups.json` - Prode group errors
- `locales/en/games.json` + `locales/es/games.json` - Game-specific errors
- `locales/en/backoffice.json` + `locales/es/backoffice.json` - Admin/backoffice errors

**Note on existing errors.json structure:**
Current errors.json has: `{ generic, auth: {...}, email: {...}, groups: {...} }`

**Decision:** Move `groups` sub-object to `groups.json` for consistency with other domain namespaces.

**Pattern:**
- Generic errors: `t('generic')` from `errors` namespace
- Domain errors: `t('tournament.notFound')` from `tournaments` namespace
- Fallback: Always use `errors` namespace in catch blocks

**1.3 Extract and Map Error Messages**

Create mapping of hardcoded strings → translation keys for each file:

**Example mapping for backoffice-actions.ts:**
```
"Unauthorized: Only administrators can delete tournaments" (English source)
  → t('admin.deleteUnauthorized') [backoffice namespace]
  → en/backoffice.json: "Unauthorized: Only administrators can delete tournaments"
  → es/backoffice.json: "EsOf(Unauthorized: Only administrators can delete tournaments)"

"Cannot delete an active tournament. Please deactivate it first." (English source)
  → t('tournament.cannotDeleteActive') [backoffice namespace]
  → en/backoffice.json: "Cannot delete an active tournament. Please deactivate it first."
  → es/backoffice.json: "EsOf(Cannot delete an active tournament. Please deactivate it first.)"

"El torneo ya existe" (Spanish source - from line 186 of backoffice-actions.ts)
  → t('tournament.alreadyExists') [backoffice namespace]
  → en/backoffice.json: "EnOf(El torneo ya existe)"
  → es/backoffice.json: "El torneo ya existe"

"Tournament {id} not found" (English source)
  → tErrors('tournaments.notFound', { id}) [errors namespace]
  → en/errors.json: "Tournament {id} not found"
  → es/errors.json: "EsOf(Tournament {id} not found)"
```

**Pattern Rule:**
- **English source text** → en file gets final English, es file gets `EsOf(English text)` placeholder
- **Spanish source text** → es file gets final Spanish, en file gets `EnOf(Spanish text)` placeholder
- **KEEP ALL placeholders** (`EnOf`/`EsOf`) in final commit - DO NOT attempt translations in this story

### Phase 2: Server Action File Updates

**2.1 Priority Order (Group by Domain)**

**Group 1: Tournament Management (5 files)**
- `tournament-actions.ts` (9+ functions)
- `tournament-scoring-actions.ts` (3 functions)
- `qualification-actions.ts` (5+ functions) - **Spanish errors via custom class**
- `qualified-teams-scoring-actions.ts` (3 functions)
- `third-place-rules-actions.ts` (3 functions)

**Group 2: Game Management (5 files)**
- `game-actions.ts` (4 functions)
- `game-boost-actions.ts` (2 functions)
- `game-notification-actions.ts` (2 functions) - **Spanish hardcoded**
- `game-score-generator-actions.ts` (2 functions)
- `guesses-actions.ts` (2 functions)

**Group 3: Groups & Betting (2 files)**
- `prode-group-actions.ts` (12+ functions) - **Partially done, needs completion**
- `group-tournament-betting-actions.ts` (6 functions)

**Group 4: Admin & Infrastructure (3 files)**
- `backoffice-actions.ts` (14 functions) - **Mixed English/Spanish**
- `team-actions.ts` (8 functions)
- `notification-actions.ts` (4 functions)

**2.2 Implementation Pattern per File**

For each server action file:

1. **Add imports:**
```typescript
import { getTranslations } from 'next-intl/server';
import type { Locale } from '../../i18n.config';
```

2. **Add locale parameter to each exported function:**
```typescript
// Before
export async function functionName(param1: string)

// After
export async function functionName(param1: string, locale: Locale = 'es')
```

3. **Get translations at function start:**
```typescript
const t = await getTranslations({ locale, namespace: 'domain-namespace' });
```

4. **Replace hardcoded error strings:**
```typescript
// Before
throw new Error("Unauthorized: Only administrators can manage teams");

// After
return { success: false, error: t('admin.unauthorized') };
```

5. **Add fallback error handling in catch blocks:**
```typescript
try {
  // business logic
} catch (error) {
  console.error("Error in functionName:", error);
  const tErrors = await getTranslations({ locale, namespace: 'errors' });
  return { success: false, error: tErrors('generic') };
}
```

**2.3 Special Cases**

**qualification-actions.ts - QualificationPredictionError Pattern**

**Current (WRONG for i18n):**
```typescript
export class QualificationPredictionError extends Error {
  public readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

// Usage:
throw new QualificationPredictionError('Torneo no encontrado', 'TOURNAMENT_NOT_FOUND');
```

**Problems:**
1. Error constructors are synchronous - can't use `await getTranslations()`
2. Throwing errors contradicts Story #152 pattern (uses return { success, error })
3. Hardcoded Spanish messages

**Correct Approach (Aligned with Story #152):**

**Option A: Remove throws, use returns (RECOMMENDED)**
```typescript
// BEFORE:
if (!tournament) {
  throw new QualificationPredictionError('Torneo no encontrado', 'TOURNAMENT_NOT_FOUND');
}

// AFTER:
if (!tournament) {
  const t = await getTranslations({ locale, namespace: 'tournaments' });
  return { success: false, error: t('notFound'), code: 'TOURNAMENT_NOT_FOUND' };
}
```

**Benefits:**
- Consistent with Story #152 pattern
- Allows i18n with getTranslations
- Client components can check response.success
- Can include error codes in response for client-side logic

**Migration Steps:**
1. Add translations for all error codes to tournaments.json
2. Replace all `throw new QualificationPredictionError(...)` with return statements
3. Update client components to handle { success, error, code? } response
4. Remove QualificationPredictionError class (no longer needed)

**Breaking Change Alert:** Client components expecting thrown errors must be updated.

---

**game-notification-actions.ts - Notification Content (OUT OF SCOPE)**

**Current State:**
- Contains Spanish hardcoded push notification text
- These are NOT error messages - they're notification content

**Examples:**
```typescript
const title = `Partidos de Mañana (${games.length})`;
const title = `Finalizó el partido #${game.game_number}`;
const message = `El partido entre ${home} y ${away} ha finalizado...`;
```

**Recommendation:**
- **Mark as OUT OF SCOPE for Story #159** (error messages & validation)
- Create separate story for notification i18n if needed
- Notification content requires different translation structure (rich formatting, interpolation)

**Rationale:** Story #159 focuses on error messages and validation. Notification content internationalization is a separate feature domain.

---

**prode-group-actions.ts - Completion Work**

**Status from audit:** May be partially done
- Check if Zod validation already has i18n
- Complete remaining error messages
- Ensure consistency with Story #152 pattern

### Phase 3: Client Component Updates

**3.1 Identify Components Calling Updated Server Actions**

For each updated server action, find all client components that call it:
- Use Grep to search for function name imports and invocations
- Track in implementation phase

**3.2 Add Locale Passing Pattern**

In each client component:

1. **Add useLocale import:**
```typescript
import { useLocale } from 'next-intl';
```

2. **Get locale in component:**
```typescript
const locale = useLocale();
```

3. **Pass locale to server action:**
```typescript
// Before
const result = await serverAction(param1, param2);

// After
const result = await serverAction(param1, param2, locale);
```

**3.3 Handle Error Display**

Ensure error messages from server actions are displayed to users:
```typescript
if (!result.success && result.error) {
  // Show error to user (toast, alert, form error, etc.)
  showError(result.error);
}
```

### Phase 4: Error Boundary Internationalization

**4.1 Update Existing Error Boundary**

**File:** `app/[locale]/tournaments/[id]/error.tsx`

Current issues:
- Hardcoded English: "Access Denied", "You don't have permission to view this tournament"
- Uses `useLocale()` but doesn't use it for messages

Update pattern:
```typescript
'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useEffect } from 'react';

export default function TournamentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations('errors');

  useEffect(() => {
    console.error('Tournament error:', error);
  }, [error]);

  // Check for specific error types
  const isAccessDenied = error.message.includes('Access Denied') ||
                         error.message.includes('permission');

  return (
    <div>
      <h2>{isAccessDenied ? t('tournament.accessDenied') : t('generic')}</h2>
      <p>{isAccessDenied ? t('tournament.noPermission') : error.message}</p>
      <button onClick={reset}>{t('tryAgain')}</button>
    </div>
  );
}
```

**4.2 Add Translation Keys for Error Boundaries**

Add to `errors.json`:
```json
{
  "tryAgain": "Try again",
  "tournament": {
    "accessDenied": "Access Denied",
    "noPermission": "You don't have permission to view this tournament"
  }
}
```

**4.3 Expand Error Boundary Coverage (Optional - Out of Scope)**

Note: Story #159 focuses on existing error boundaries. Creating new error boundaries for other routes (games, groups, etc.) could be a follow-up story if needed.

### Phase 5: Testing & Validation

**5.1 Automated Testing**

**Audit Existing Tests First:**
```bash
# Run current test suite
npm test

# Check coverage report
npm test -- --coverage

# Identify gaps
grep -r "describe.*Action" __tests__/ --include="*.test.ts"
```

**Then Create/Update Tests:**

1. **Unit tests for server actions:**
   - Test each UPDATED server action with both `locale: 'en'` and `locale: 'es'`
   - Verify error messages are translated correctly
   - Test validation error paths
   - Test authorization error paths
   - Use existing test utilities (renderWithTheme, mock factories, etc.)

2. **Coverage requirements:**
   - 80% coverage on new/modified code (SonarCloud enforced)
   - Focus on error handling paths (catch blocks, validation checks)

3. **Pattern Consistency Tests:**
   - Verify locale parameter exists and works
   - Test that missing translation keys don't crash (fallback behavior)
   - Test interpolation variables work correctly

**5.2 Manual Testing in Vercel Preview**

Test error scenarios in both locales:

1. **Authorization errors:**
   - Try admin actions as non-admin user → Verify unauthorized error
   - Test in English (/en/...) and Spanish (/es/...)

2. **Validation errors:**
   - Submit forms with invalid data → Verify validation messages
   - Test empty fields, format errors, etc.

3. **Business logic errors:**
   - Try deleting active tournament → Verify "cannot delete" error
   - Test boost limits → Verify limit errors
   - Test qualification rules → Verify rule validation errors

4. **Data lookup errors:**
   - Access non-existent tournament → Verify "not found" error
   - Test with invalid IDs in both locales

5. **Error boundary testing:**
   - Force errors in tournament pages → Verify error boundary shows translated messages
   - Test reset functionality

6. **File upload errors:**
   - Test team logo upload with oversized file → Verify size limit error
   - Test failed S3 uploads → Verify upload error messages

**5.3 Translation Quality Check**

- Verify all Spanish translations are grammatically correct
- Ensure consistent tone and terminology
- Check interpolation variables work correctly
- Verify no hardcoded strings remain

## Critical Files

**NOTE: Actual list of files needing work will be determined by Phase 0 audit.**

### Server Action Files (Candidates for Update)

**Known Complete (from Story #152):**
- ✅ `app/actions/user-actions.ts` (verified in audit prep)
- ✅ `app/actions/oauth-actions.ts`
- ✅ `app/actions/otp-actions.ts`

**Status Unknown (Check in Phase 0):**

**Tournament Domain:**
1. `app/actions/tournament-actions.ts`
2. `app/actions/tournament-scoring-actions.ts`
3. `app/actions/qualification-actions.ts` - **Special: QualificationPredictionError migration**
4. `app/actions/qualified-teams-scoring-actions.ts`
5. `app/actions/third-place-rules-actions.ts`

**Game Domain:**
6. `app/actions/game-actions.ts`
7. `app/actions/game-boost-actions.ts`
8. `app/actions/game-notification-actions.ts` - **Out of scope: notification content**
9. `app/actions/game-score-generator-actions.ts`
10. `app/actions/guesses-actions.ts`

**Groups & Betting:**
11. `app/actions/prode-group-actions.ts` - **May be partially done**
12. `app/actions/group-tournament-betting-actions.ts`
13. `app/actions/onboarding-actions.ts` - **Check if Story #153 did this**

**Admin & Infrastructure:**
14. `app/actions/backoffice-actions.ts`
15. `app/actions/team-actions.ts`
16. `app/actions/notification-actions.ts`

**Total Candidates:** ~16 files (audit will determine which actually need work)

### Translation Files (6 existing + 8 new = 14 files)

**Existing to extend:**
- `locales/en/errors.json`
- `locales/es/errors.json`
- `locales/en/validation.json`
- `locales/es/validation.json`

**New to create:**
- `locales/en/tournaments.json` + `locales/es/tournaments.json`
- `locales/en/groups.json` + `locales/es/groups.json`
- `locales/en/games.json` + `locales/es/games.json`
- `locales/en/backoffice.json` + `locales/es/backoffice.json`

### Error Boundary Files (1 to modify)

- `app/[locale]/tournaments/[id]/error.tsx`

### Client Component Files (TBD - discover during implementation)

- Components will be identified during implementation via Grep searches
- Estimate: 30-50 components based on similar scope in Story #152

## Plan Amendments Strategy

**Purpose:** Document deviations discovered during implementation (per implementation.md Section 8)

If gaps/issues are discovered during implementation that weren't in this plan:

1. **Document as amendment** in this plan file
2. **Add "## Amendments" section** at end of plan with:
   - Date discovered
   - What was found
   - Why it wasn't in original plan
   - How it's being addressed
3. **Commit plan + code together** (per implementation.md Section 8)

**Examples of amendment triggers:**
- Audit reveals significantly different scope than estimated
- Client components have unexpected patterns requiring new approach
- Additional error boundaries found that need internationalization
- QualificationPredictionError used in more places than expected
- Stories #152-#154 did more/less work than assumed

## Pattern Consistency Checklist

**Use this checklist after updating each file to ensure Story #152 pattern compliance:**

### Server Action File
- [ ] Import: `import { getTranslations } from 'next-intl/server';`
- [ ] Import: `import type { Locale } from '../../i18n.config';`
- [ ] All exported functions: `locale: Locale = 'es'` as LAST parameter
- [ ] Error returns: `return { success: false, error: t('key') };` (NOT throw)
- [ ] Catch blocks: Use `errors` namespace fallback
- [ ] NO hardcoded strings in error returns

### Client Component
- [ ] Import useLocale, get locale, pass to action
- [ ] Handle error display from response

### Translation Files
- [ ] Key exists in BOTH en/ and es/ files
- [ ] Interpolation variables match (e.g., `{id}` in en matches `{id}` in es)
- [ ] Key structure: `domain.context.key`
- [ ] **Placeholders are CORRECT** (`EnOf(...)` in English for Spanish source, `EsOf(...)` in Spanish for English source)
- [ ] Source language text is properly preserved (English source → en file, Spanish source → es file)
- [ ] Placeholder wraps the correct source text

## Execution Strategy

**⚠️ DEFER UNTIL AFTER PHASE 0 AUDIT**

The execution approach (main agent only vs. hybrid mode with subagents) will be determined based on:
1. **Phase 0 audit results** - How many files actually need work?
2. **User scope clarifications** - What's actually in scope?
3. **Complexity discovered** - Are there unexpected patterns or edge cases?

**Decision Criteria:**
- **≤5 files need work** → Main agent only, sequential implementation
- **6-10 files need work** → Main agent with possible task parallelization
- **>10 files need work** → Consider hybrid mode with Haiku subagents
- **User expands scope significantly** → Reassess approach entirely

**This decision will be made during implementation (after exiting plan mode) based on actual findings.**

**Note:** If hybrid mode is chosen, coordination strategy will follow implementation.md Section 2.5 patterns (main agent creates translation files, subagents work on independent domains, main agent reviews/merges).

## Dependencies & Risks

### Dependencies
- Story #152 (Auth Flow) - ✅ COMPLETED (establishes pattern)
- Story #151 (Translation Utilities) - ✅ COMPLETED (next-intl setup)
- Story #150 (Namespace Design) - ✅ COMPLETED (namespace structure)

### Risks & Mitigations

**Risk 1: Client Component Discovery & Update Patterns**
- 30-50 components may need locale parameter passing
- Components may have different patterns (direct calls, callbacks, form actions, transitions)
- Error handling may need updates beyond just passing locale
- Some components may use Server Components (don't need useLocale, already have locale from params)
- **Mitigation:**
  1. Use Grep to systematically find all call sites for each server action
  2. Categorize by pattern type before updating (client vs server components, call patterns)
  3. Create example updates for each pattern type
  4. Consider subagent parallelization if >20 components need work
  5. Use TypeScript compiler to catch missed call sites after signature changes

**Risk 2: Translation Quality**
- Spanish translations need to be accurate and consistent
- **Mitigation:** User review during Vercel Preview testing; follow existing translation patterns

**Risk 3: Custom Error Classes**
- qualification-actions.ts uses QualificationPredictionError
- **Mitigation:** Update class constructor to accept locale; maintain existing error handling flow

**Risk 4: Mixed Language Cleanup**
- backoffice-actions.ts has Spanish strings ("El torneo ya existe", "Primero lo borro")
- game-notification-actions.ts fully Spanish
- **Mitigation:** Extract all to translation files; ensure nothing remains hardcoded

**Risk 5: Test Coverage**
- 92 error paths need test coverage for 80% requirement
- **Mitigation:** Create focused test suites per file; use test factories for consistent setup

## Success Criteria

**Based on Phase 0 Audit Results:**

1. ✅ All server action files have locale parameter and follow Story #152 pattern
2. ✅ All remaining hardcoded error messages extracted to translation files
3. ✅ Error boundaries internationalized with translated messages
4. ✅ All client components pass locale to server actions correctly
5. ✅ All tests passing with 80%+ coverage on modified code
6. ✅ Manual testing in both locales confirms correct translations
7. ✅ No hardcoded user-facing strings remain (verified by Grep)
8. ✅ SonarCloud: 0 new issues, maintainability B+
9. ✅ Pattern consistency verified (all files follow checklist)
10. ✅ QualificationPredictionError migrated to return pattern (if applicable)
11. ✅ **Key parity verified:** All keys exist in BOTH en/ and es/ files
12. ✅ **No duplicate content:** All translation values are unique (or documented if intentional)
13. ✅ **Translation tracking complete:** Tracking file or LLM audit confirms all keys are accounted for

## Verification Steps

### During Implementation
1. After each server action update: Grep for hardcoded strings in that file
2. After client updates: Test in dev with both `/en` and `/es` routes
3. After each phase: Run `npm test` to ensure no regressions

## Visual Prototypes

**Decision:** Not needed for this story.

**Rationale:** Error messages are text-only changes. No layout/design changes to error boundaries. Error boundary UI remains the same, only message content is internationalized.

---

### Before Commit
1. **Run validation checks (MANDATORY):**
   ```bash
   npm test    # All tests must pass
   npm run lint  # No lint errors
   npm run build # Build must succeed
   ```

2. **Check for remaining hardcoded strings:**
   ```bash
   # Search for common error patterns
   grep -r "Unauthorized" app/actions/
   grep -r "not found" app/actions/
   grep -r "Failed to" app/actions/
   ```

3. **Verify translation file completeness:**
   ```bash
   # Verify placeholder formats are used correctly
   grep -r "EnOf(" locales/en/  # Should find placeholders - this is EXPECTED
   grep -r "EsOf(" locales/es/  # Should find placeholders - this is EXPECTED
   ```
   - Check all keys used in code exist in both en/ and es/ files
   - Verify interpolation variables match in both languages
   - **Verify placeholders are CORRECT** (EnOf in English files, EsOf in Spanish files)
   - Ensure source language text is preserved correctly in non-placeholder file
   - Check that placeholder wraps the correct source text

4. **Advanced Translation Key Verification (CRITICAL):**

   **A. Key Parity Verification (en/ ↔ es/ sync)**

   **Option 1: Translation Key Tracking File (Recommended)**

   Create a temporary tracking file during implementation:
   ```bash
   # Create tracking file at root of worktree
   touch /Users/gvinokur/Personal/qatar-prode-story-159/.translation-keys-added.json
   ```

   Format:
   ```json
   {
     "keys": [
       {
         "namespace": "errors",
         "key": "admin.unauthorized",
         "fullKey": "errors.admin.unauthorized",
         "usedIn": ["app/actions/backoffice-actions.ts:99", "app/actions/team-actions.ts:27"],
         "enFile": "locales/en/errors.json",
         "esFile": "locales/es/errors.json",
         "enValue": "Unauthorized: Only administrators can...",
         "esValue": "EsOf(Unauthorized: Only administrators can...)"
       }
     ]
   }
   ```

   **During implementation:**
   - Add entry to tracking file for each new translation key
   - Include namespace, key path, files using it, and both en/es values

   **Before commit verification:**
   ```bash
   # Verify all keys in tracking file exist in both locales
   node scripts/verify-translation-parity.js .translation-keys-added.json

   # Or manual verification:
   # For each key in tracking file, verify it exists in both en/ and es/ files
   ```

   **Option 2: LLM Audit Based on Branch Changes**

   ```bash
   # Get all changed translation files in this branch
   git diff origin/main --name-only | grep "locales/"

   # Get full diff of translation files
   git diff origin/main locales/ > /tmp/translation-changes.diff
   ```

   Then use LLM (Task tool with general-purpose agent) to:
   - Parse the diff and extract all added keys from en/ files
   - Parse the diff and extract all added keys from es/ files
   - Compare: Every key added to en/*.json must have corresponding key in es/*.json
   - Report missing keys

   **Verification Script (Create during implementation):**
   ```typescript
   // scripts/verify-translation-parity.ts
   // Read all en/ JSON files, extract all keys
   // Read all es/ JSON files, extract all keys
   // Compare: enKeys === esKeys (same keys in both)
   // Report differences
   ```

   **B. Duplicate Content Detection**

   Prevent duplicate translation content across keys:

   ```bash
   # Find duplicate values in translation files
   # This checks if the same text appears in multiple keys

   # For English files (excluding placeholders)
   find locales/en -name "*.json" -exec jq -r '.. | strings' {} \; | \
     grep -v "^EnOf(" | sort | uniq -d

   # For Spanish files (excluding placeholders)
   find locales/es -name "*.json" -exec jq -r '.. | strings' {} \; | \
     grep -v "^EsOf(" | sort | uniq -d
   ```

   **Verification Script (Create during implementation):**
   ```typescript
   // scripts/check-duplicate-translations.ts
   // For each locale (en, es):
   //   1. Load all translation files
   //   2. Flatten all keys and values
   //   3. Find values that appear more than once (excluding placeholders)
   //   4. Report duplicates with key paths

   // Example output:
   // DUPLICATE FOUND in en/errors.json:
   //   "Unauthorized" appears in:
   //     - errors.admin.unauthorized
   //     - errors.auth.unauthorized
   //   RECOMMENDATION: Use a shared key or make text more specific
   ```

   **Duplicate Detection Strategy:**
   - Run before final commit
   - Ignore placeholder values (EnOf/EsOf)
   - Flag exact text matches across different keys
   - Review each duplicate:
     - If intentionally same → Document why
     - If accidental → Consolidate to single key
     - If similar context → Make text more specific

   **Allowed Duplicates:**
   - Generic messages like "generic": "An unexpected error occurred" (expected in errors namespace)
   - Common validation messages shared across forms (document in comments)

   **5. Complete Verification Checklist:**

   Before final commit, verify:
   - [ ] Tracking file `.translation-keys-added.json` is complete (if using Option 1)
   - [ ] All keys in tracking file exist in BOTH en/ and es/ files
   - [ ] OR: LLM audit confirms key parity (if using Option 2)
   - [ ] No duplicate content detected (or documented if intentional)
   - [ ] All keys used in code exist in translation files
   - [ ] All translation files have corresponding keys in both locales
   - [ ] Interpolation variables match across locales

### After Deployment to Vercel Preview

**Test Matrix:**

| Feature Area | Test Case | Locale EN | Locale ES |
|--------------|-----------|-----------|-----------|
| **Auth Errors** | Admin action as non-admin | ✓ Check error | ✓ Check error |
| **Validation** | Empty form submission | ✓ Check error | ✓ Check error |
| **Tournament** | Delete active tournament | ✓ Check error | ✓ Check error |
| **Games** | Set boost after game start | ✓ Check error | ✓ Check error |
| **Qualification** | Duplicate teams | ✓ Check return format | ✓ Check return format |
| **File Upload** | Oversized team logo | ✓ Check error | ✓ Check error |
| **Not Found** | Invalid tournament ID | ✓ Check error | ✓ Check error |
| **Error Boundary** | Force tournament page error | ✓ Check display | ✓ Check display |

**Expected Behavior:**
- All error messages display in correct language based on URL locale
- No English text appears in /es/ routes
- No Spanish text appears in /en/ routes
- Error messages are clear and actionable
- Error boundary shows translated "Try again" button

### Sign-off Checklist
- [ ] All error messages extracted to translation keys (with EnOf/EsOf placeholders)
- [ ] Error boundary displays correct locale
- [ ] No hardcoded strings found in grep searches
- [ ] **Key parity verified:** All new keys exist in BOTH en/ and es/ files
- [ ] **No duplicate content detected** (or documented if intentional)
- [ ] Translation tracking file complete (or LLM audit done)
- [ ] User confirms both locales work correctly in Vercel Preview
- [ ] SonarCloud passes (0 new issues, 80%+ coverage)
- [ ] Ready for merge

---

## Rollback Strategy

If critical issues are found during Vercel Preview testing:

1. **Identify broken functionality** - Document which features/components are broken
2. **Assess severity:**
   - **Minor issues** (translations wrong, formatting issues): Fix and re-deploy
   - **Major issues** (app crashes, features broken): Consider rollback

3. **Rollback Process (if needed):**
   ```bash
   # Option 1: Revert commits (safe, preserves history)
   git log --online -10  # Find commit hashes
   git revert <hash1> <hash2> ...  # Revert problematic commits
   git push  # No force needed - revert creates new commits

   # Option 2: If user explicitly approves, can use force push
   # (Must ask permission first per CLAUDE.md git safety protocol)
   git reset --hard <good-commit-hash>
   git push --force-with-lease  # Only with explicit user approval
   ```

4. **Create Change Plan:**
   - Enter plan mode again
   - Document what went wrong
   - Create revised approach addressing root causes
   - Get user approval before re-implementing

5. **Alternative: Start fresh from main if too many issues**

---

## Implementation Notes

- Follow Story #152's exact pattern for consistency
- Do NOT create utility wrappers (use getTranslations directly)
- Locale parameter is ALWAYS last with default `'es'`
- Use two-namespace pattern (primary + fallback errors)
- Test both locales for every error path
- Client components MUST pass locale to server actions
- **KEEP EnOf/EsOf placeholders** - do NOT attempt actual translations in this story

**Translation Key Tracking:**
- Create `.translation-keys-added.json` at worktree root at start of implementation
- Update tracking file as each new key is added
- Include: namespace, key path, usage locations, en/es values
- Use for verification before final commit
- **DO NOT commit tracking file** - it's temporary for verification only

**Verification Scripts to Create (Optional but Recommended):**
- `scripts/verify-translation-parity.ts` - Check en/es key parity
- `scripts/check-duplicate-translations.ts` - Find duplicate content
- These scripts can be committed and reused for future i18n stories

## Estimated Effort

**IMPORTANT: Effort depends on Phase 0 audit results. Estimates below assume moderate gaps found.**

**Note:** Phase 0 (Audit) is the FIRST STEP of implementation phase, happening after exiting plan mode.

**UPDATED ESTIMATE (With Expanded Scope):**

**Conservative Estimate (Based on Expanded Scope):**
- Phase 0 (Audit) - FIRST STEP POST-EXIT: 2-3 hours (expanded audit scope)
- Phase 1 (Translation Keys): 2-3 hours (more namespaces needed)
- Phase 2 (Server Actions): 2-6 hours (depends on how many files need work)
- Phase 3 (Client Components): 2-5 hours (depends on how many need updates)
- Phase 4 (Client Forms & Validation): 3-6 hours (Zod i18n, error displays)
- Phase 5 (API Routes): 1-3 hours (if routes exist)
- Phase 6 (Network Utilities): 1-2 hours (if utilities exist)
- Phase 7 (Error Boundaries): 0.5-1 hour (likely just 1 boundary needs work)
- Phase 8 (Testing): 3-5 hours (test updates + manual testing)
- **Total Implementation Range:** 16.5-34 hours

**Scenarios:**

**Best Case (Most server work done, minimal client forms/API routes):**
- 3-5 server actions need updates
- 10-15 client components need updates
- 5-10 forms need Zod i18n
- 0-2 API routes exist
- No network utilities
- **Estimated: 16-20 hours**

**Moderate Case (Partial server work, moderate client forms):**
- 8-10 server actions need updates
- 20-30 client components need updates
- 15-20 forms need Zod i18n
- 3-5 API routes exist
- 1-2 network utilities
- **Estimated: 22-28 hours**

**Worst Case (Minimal server work done, extensive client forms/API routes):**
- All 15+ server actions need updates
- 40-50 client components need updates
- 25+ forms need Zod i18n
- 5-10 API routes exist
- 2-3 network utilities
- **Estimated: 30-34 hours**

**Original Issue Estimate:** 4-6 hours (Medium)
**Realistic Assessment with Expanded Scope:** 20-28 hours (SIGNIFICANTLY HIGHER)
**Recommended:** User should be aware effort is 4-5x original estimate due to scope expansion

**Note:** With hybrid parallelization, calendar time can be reduced significantly even with higher total effort.

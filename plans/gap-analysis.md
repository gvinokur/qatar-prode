# Gap Analysis Results - Story #159
## Error Messages & Validation Internationalization

**Analysis Date:** February 19, 2026
**Base Branch:** feature/story-159 (based on main after Stories #152-#154)

---

## Executive Summary

**Stories #152-#154 Impact:** Only 3 of 21 server action files were internationalized (user-actions.ts, otp-actions.ts, oauth-actions.ts from Story #152). The majority of error messages remain hardcoded.

**Scope:** 18 server action files + 1 error boundary + client components need internationalization work.

---

## Server Actions Status

### ✅ COMPLETE (3 files)
Story #152 (Auth Flow) internationalized:
- `user-actions.ts` - ✅ Full i18n pattern
- `otp-actions.ts` - ✅ Full i18n pattern
- `oauth-actions.ts` - ✅ Full i18n pattern

### ❌ NOT STARTED (18 files)

**Tournament Domain (5 files):**
1. `tournament-actions.ts` - Multiple functions, no i18n
2. `tournament-scoring-actions.ts` - No i18n
3. `qualification-actions.ts` - **Special case: QualificationPredictionError with Spanish messages**
4. `qualified-teams-scoring-actions.ts` - No i18n
5. `third-place-rules-actions.ts` - No i18n

**Game Domain (5 files):**
6. `game-actions.ts` - Hardcoded "Unauthorized" errors
7. `game-boost-actions.ts` - Hardcoded errors ("Game not found", "Cannot set boost...")
8. `game-notification-actions.ts` - **OUT OF SCOPE (notification content, not errors)**
9. `game-score-generator-actions.ts` - Mix of error strings
10. `guesses-actions.ts` - Hardcoded errors

**Groups & Betting (2 files):**
11. `prode-group-actions.ts` - Has Zod schema, some errors
12. `group-tournament-betting-actions.ts` - No i18n

**Admin & Infrastructure (4 files):**
13. `backoffice-actions.ts` - **Most errors:** ~14 hardcoded English messages
14. `team-actions.ts` - No i18n
15. `notifiaction-actions.ts` [sic - typo in filename] - Multiple hardcoded errors
16. `onboarding-actions.ts` - Simple "Unauthorized" errors repeated

**Other (2 files):**
17. `s3.ts` - File operations (may have errors)
18. `qualification-errors.ts` - Error class definition (needs migration)

---

## Translation Files Status

### Existing Translation Files

**errors.json:**
- Current keys: `generic`, `auth.*`, `email.*`, `groups.copyFailed`
- **Missing:** Tournament, game, backoffice, qualification error keys
- **Need:** ~50-70 new keys for server action errors

**validation.json:**
- Current keys: Basic field validation (email, password, nickname, groupName, confirmPassword)
- **Adequate** for current scope
- May need minor additions for new validation scenarios

**Other namespaces (adequate):**
- `auth.json` - Complete from Story #152
- `groups.json` - From Story #156
- `onboarding.json` - From Story #153
- `predictions.json` - From Story #154

### New Namespaces Needed

**tournaments.json** (NEW):
- Tournament domain errors (not found, active status, creation, deletion, etc.)
- Estimated: 15-20 keys

**games.json** (NEW):
- Game domain errors (boosts, scheduling, score generation, etc.)
- Estimated: 10-15 keys

**backoffice.json** (NEW):
- Admin operation errors (authorization, bulk operations, etc.)
- Estimated: 15-20 keys

**Total new keys needed:** ~90-120 keys across all namespaces

---

## Error Boundaries Status

### Total Found: 1 error boundary
- `app/[locale]/tournaments/[id]/error.tsx`

### ❌ Need Work: 1 error boundary

**Current Issues:**
- Imports `useLocale` but doesn't use it for translations
- Hardcoded English strings:
  - "Access Denied"
  - "You don't have permission to view this tournament..."
  - "If you believe you should have access, please contact an administrator."
  - "Return to Home"

**Fix Required:**
- Add `useTranslations('errors')` hook
- Replace all strings with translation keys
- Add keys to `errors.json`: `tournament.accessDenied`, `tournament.noPermission`, etc.

---

## Client Components Status

### Sample Components Calling Server Actions (Checked 10):

**Auth Components:**
- `login-or-signup-dialog.tsx` → calls `sendOTPCode`
- `forgot-password-form.tsx` → calls `sendPasswordResetLink`
- `account-setup-form.tsx` → calls `createAccountViaOTP`, `checkNicknameAvailability`
- `email-input-form.tsx` → calls `checkAuthMethods`
- `nickname-setup-dialog.tsx` → calls `setNickname`
- `user-settings-dialog.tsx` → calls `updateNickname`

**Group Components:**
- `tournament-groups-list.tsx` → calls `createDbGroup`
- `friend-groups-list.tsx` → calls `createDbGroup`, `deleteGroup`

**Observation:** Auth components likely already passing locale (Story #152). Other components need verification.

**Pattern Compliance Check Needed:**
- Do they import `useLocale()`?
- Do they pass `locale` as last parameter to server actions?
- Do they handle error responses correctly?

**Estimated Total Components:** ~30-50 components may need locale parameter passing

---

## Client-Side Forms Status

### React Hook Form Usage: 16 files found

**Sample Analysis (grep results):**
- Multiple forms use React Hook Form for validation
- Some may use Zod schemas for client-side validation
- Error message display mechanisms vary

**Zod Schema Usage:**
- Found: `imageSchema` in `prode-group-actions.ts`
- Likely more schemas in components and actions

**Client-Side Validation i18n Needs:**
- Zod error messages (custom error messages per field)
- Form validation displays (React Hook Form integration)
- Client-side validation feedback

**Approach:**
- Check if Zod schemas use custom error messages
- If yes, extract to translation keys
- Ensure validation.json has all needed keys
- May need to use `zod-i18n` library or custom error maps

**Estimated Effort:** Moderate (depends on number of schemas and validation patterns)

---

## API Routes Status

### Total Routes Found: 2

**app/api/auth/[...nextauth]/route.ts:**
- NextAuth framework route
- **OUT OF SCOPE** (framework-managed, no custom error messages)

**app/api/update-guesses/route.ts:**
- Calls `calculateGameScores` server action
- Returns `NextResponse.json({ ok: true, result })`
- **Minimal i18n needed** (mostly delegates to server action)
- May need error handling if server action fails

**Conclusion:** API routes have minimal impact on this story.

---

## Network Error Handling Status

**Search Results:** No custom fetch/axios wrappers found in `app/utils`

**Conclusion:** Network error handling likely handled at component level or uses default fetch. Minimal additional i18n work needed beyond server action errors.

---

## Special Cases

### 1. QualificationPredictionError Migration

**Current Pattern (WRONG for i18n):**
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

**Issues:**
- Error constructors are synchronous (can't use `await getTranslations()`)
- Throwing errors contradicts Story #152 pattern (uses `return { success, error }`)
- All messages hardcoded in Spanish

**Usage Statistics:**
- 12 `throw new QualificationPredictionError` statements in qualification-actions.ts
- All with Spanish hardcoded messages

**Recommended Approach:**
- **Remove throws entirely**, use return pattern from Story #152
- Update all functions to return `{ success: false, error: t('key'), code?: string }`
- Client components will need updates to handle response instead of catching errors
- Remove `QualificationPredictionError` class (no longer needed)

**Breaking Change:** Yes - client components currently catching this error type must be updated.

### 2. Notification Content (OUT OF SCOPE)

**File:** `game-notification-actions.ts`

**Contains:**
- Spanish hardcoded push notification content
- Examples: `"Partidos de Mañana (${games.length})"`, `"Finalizó el partido #${game.game_number}"`

**Recommendation:** OUT OF SCOPE for Story #159 (error messages & validation). Notification content internationalization should be a separate story.

### 3. Backoffice Actions (Highest Error Count)

**File:** `backoffice-actions.ts`

**Statistics:**
- ~14 hardcoded error messages (most of any file)
- Mix of English messages
- Examples:
  - "Unauthorized: Only administrators can delete tournaments"
  - "Cannot delete an active tournament. Please deactivate it first."
  - "Tournament {id} not found"

**Priority:** HIGH (largest impact file)

---

## Estimated Remaining Work

### By Category:

**Server Actions:** 18 files
- Simple updates (5-10 errors each): 10 files × 1-2 hours = 10-20 hours
- Complex updates (qualification migration): 1 file × 3-4 hours = 3-4 hours
- Medium updates: 7 files × 1.5-2 hours = 10.5-14 hours

**Translation Keys:** 90-120 new keys
- Key extraction and mapping: 2-3 hours
- Writing English translations: 1-2 hours
- Writing Spanish translations: 2-3 hours
- Organization across namespaces: 1 hour
- **Subtotal:** 6-9 hours

**Client Components:** ~30-50 components
- Pattern verification (grep, sampling): 1-2 hours
- Locale parameter passing updates: 2-4 hours
- Error handling updates: 1-2 hours
- **Subtotal:** 4-8 hours

**Client-Side Forms & Validation:** 16 forms + Zod schemas
- Audit Zod schemas: 1-2 hours
- Extract validation errors to i18n: 2-3 hours
- Update error displays: 2-3 hours
- **Subtotal:** 5-8 hours

**Error Boundaries:** 1 file
- Simple update: 0.5-1 hour

**API Routes:** 2 routes
- Minimal work: 0.5-1 hour

**Testing:**
- Unit tests for updated server actions: 4-6 hours
- Integration tests: 2-3 hours
- Manual testing (Vercel Preview): 2-3 hours
- **Subtotal:** 8-12 hours

### **Total Implementation Range: 46.5-73 hours**

### Scenarios:

**Best Case (Lower Complexity):** 46-55 hours
- Many server actions have few errors
- Client components mostly follow pattern
- Forms use simple validation
- Hybrid mode with parallelization

**Moderate Case (Expected):** 55-65 hours
- Average error count per file
- Moderate client component work
- Some complex Zod validation
- Hybrid mode execution

**Worst Case (High Complexity):** 65-73 hours
- High error count, complex patterns
- Many client components need updates
- Complex form validation scenarios
- QualificationPredictionError migration breaks more than expected

**Original Issue Estimate:** 4-6 hours (Medium)
**Realistic Assessment:** 55-65 hours (12-15× original estimate)

**Recommendation:** User should be aware this is SIGNIFICANTLY larger than originally estimated.

---

## Execution Mode Recommendation

**Given scope (18 server action files + extensive client work):**

**RECOMMEND: Hybrid Mode**

**Rationale:**
- 18 server action files is large enough to benefit from parallelization
- Many files are simple, isolated updates following established pattern
- Can delegate simple files to Haiku subagents
- Main agent handles complex cases (qualification migration, backoffice)
- Estimated 30-40% time savings with hybrid approach

**Complexity Breakdown (Preliminary):**
- **Simple (Haiku-ready):** ~10-12 files (straightforward error extraction, follow pattern)
- **Complex (Main agent):** ~6-8 files (backoffice, qualification migration, complex logic)

**Final execution mode decision will be made after task definition phase per implementation.md Section 2.5.**

---

## Recommendations

### High Priority:
1. **Start with backoffice-actions.ts** (highest error count, biggest impact)
2. **Handle QualificationPredictionError migration early** (breaking change, affects client components)
3. **Create all translation namespace files first** (unblocks parallel work)

### Medium Priority:
4. Update tournament and game domain files
5. Update client components for locale parameter passing
6. Internationalize error boundary

### Lower Priority:
7. Client-side form validation i18n (if time allows)
8. API route error handling (minimal work needed)

### Out of Scope:
- Notification content (game-notification-actions.ts)
- NextAuth route (framework-managed)

---

## Next Steps

1. ✅ Gap analysis complete
2. **Define tasks with TaskCreate/TaskUpdate** (implementation.md Section 2)
3. **Choose execution mode with user** (implementation.md Section 2.5)
4. **Execute implementation in waves**

---

## Files Requiring Changes

### Server Actions (18 files):
1. tournament-actions.ts
2. tournament-scoring-actions.ts
3. qualification-actions.ts ⚠️ COMPLEX
4. qualified-teams-scoring-actions.ts
5. third-place-rules-actions.ts
6. game-actions.ts
7. game-boost-actions.ts
8. game-score-generator-actions.ts
9. guesses-actions.ts
10. prode-group-actions.ts
11. group-tournament-betting-actions.ts
12. backoffice-actions.ts ⚠️ HIGHEST PRIORITY
13. team-actions.ts
14. notifiaction-actions.ts
15. onboarding-actions.ts
16. s3.ts
17. qualification-errors.ts ⚠️ COMPLEX (migration)

### Translation Files (6 new):
- locales/en/tournaments.json (CREATE)
- locales/es/tournaments.json (CREATE)
- locales/en/games.json (CREATE)
- locales/es/games.json (CREATE)
- locales/en/backoffice.json (CREATE)
- locales/es/backoffice.json (CREATE)
- locales/en/errors.json (EXTEND)
- locales/es/errors.json (EXTEND)

### Error Boundaries (1 file):
- app/[locale]/tournaments/[id]/error.tsx

### Client Components (TBD during implementation):
- Estimated 30-50 components (determined via grep during execution)

### Tests (TBD during implementation):
- Unit tests for all updated server actions
- Integration tests for critical paths

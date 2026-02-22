# Implementation Plan: Story #161 - LLM-Assisted English Translation

## Story Context

**Objective:** Use LLM (Claude/GPT-4) for bidirectional translation - complete English translations from Spanish content AND proper Spanish translations for placeholder English text.

**Why:** Complete the internationalization (i18n) infrastructure by ensuring ALL user-facing content is properly translated in BOTH locales (Spanish and English).

**Epic:** Internationalization (i18n) Support
**Priority:** High
**Effort:** High (14-18 hours)

**Issue:** #161 - [i18n] LLM-Assisted English Translation

## Acceptance Criteria

1. ✅ All English translation files have Spanish→English translations
2. ✅ All Spanish translation files have proper Spanish content (no English placeholders)
3. ✅ No `EnOf()` or `EsOf()` placeholders remain in ANY files (both locales)
4. ✅ Translation prompt template created for both directions (ES→EN and EN→ES)
5. ✅ Translation guide with sports terminology glossary created
6. ✅ Quick review of auth + onboarding flows completed (verify translations in context)
7. ✅ All translations follow tone and style guidelines (casual, friendly, concise)

## Current State Analysis

**Translation Infrastructure:**
- ✅ `next-intl` v4.8.3 configured and working
- ✅ 17 namespace files in both Spanish (`/locales/es/`) and English (`/locales/en/`)
- ✅ Test utilities for i18n testing already in place

**Translation Status:**

**Fully Translated in BOTH Locales (0 placeholders):**
- ✅ `auth.json` - Complete authentication flows
- ✅ `awards.json` - Recognition system
- ✅ `emails.json` - Email templates
- ✅ `onboarding.json` - User onboarding
- ✅ `predictions.json` - Core predictions
- ✅ `qualified-teams.json` - Tournament teams
- ✅ `rules.json` - Game rules
- ✅ `stats.json` - Statistics
- ✅ `tables.json` - Standings
- ✅ `validation.json` - Form validation

**English Files Need Translation (EnOf placeholders - Spanish→English):**
- `onboarding.json`: 111 placeholders
- `predictions.json`: 108 placeholders
- `groups.json`: 101 placeholders
- `stats.json`: 58 placeholders
- `tables.json`: 49 placeholders
- `rules.json`: 42 placeholders
- `qualified-teams.json`: 31 placeholders
- `awards.json`: 25 placeholders
- `navigation.json`: 13 placeholders
- `tournaments.json`: 13 placeholders
- `common.json`: 4 placeholders

**Spanish Files Need Translation (EsOf placeholders - English→Spanish):**
- `games.json`: 15 placeholders
- `backoffice.json`: 12 placeholders
- `tournaments.json`: 10 placeholders
- `errors.json`: 9 placeholders
- `common.json`: 5 placeholders
- `navigation.json`: 3 placeholders
- `groups.json`: 1 placeholder

**Total translation work:**
- **~555 keys need Spanish→English translation** (in 11 English files)
- **~55 keys need English→Spanish translation** (in 7 Spanish files)
- **Total: ~610 translation keys**

**Files requiring bidirectional work:**
- `common.json`: 4 EN + 5 ES = 9 keys (most critical - used everywhere)
- `navigation.json`: 13 EN + 3 ES = 16 keys (visible on every page)
- `groups.json`: 101 EN + 1 ES = 102 keys (heavy interpolation: `{groupName}`, `{count}`)
- `tournaments.json`: 13 EN + 10 ES = 23 keys (core feature)

**Files requiring English translation only:**
- `onboarding.json`: 111 EN keys (user onboarding flow)
- `predictions.json`: 108 EN keys (core feature with `{score}`, `{team}`)
- `stats.json`: 58 EN keys (statistics dashboard)
- `tables.json`: 49 EN keys (standings display)
- `rules.json`: 42 EN keys (help content)
- `qualified-teams.json`: 31 EN keys (tournament teams)
- `awards.json`: 25 EN keys (recognition system)

**Files requiring Spanish translation only:**
- `games.json`: 15 ES keys
- `backoffice.json`: 12 ES keys
- `errors.json`: 9 ES keys (error messages - critical clarity)

## Technical Approach

### Phase 1: Translation Prompt Template Development

Create a reusable translation prompt that captures domain context and style requirements.

**Deliverable:** `/docs/translation-prompt-template.md`

**Key elements:**
1. **Context section:**
   - Sports prediction platform (Prode)
   - Target audience: Spanish-speaking users expanding to English
   - Features: Score predictions, friend groups, leaderboards, tournaments

2. **Terminology guidelines:**
   - "Prode" → Keep as "Prode" or "Predictions" (consistent choice needed)
   - Tournament names: World Cup, Copa América, Euro
   - Sports terms: authentic English terminology

3. **Style guidelines:**
   - Tone: Casual, friendly (not formal)
   - UI constraints: Button text must be concise (space limits)
   - Form errors: Clear and helpful
   - Maintain excitement for sports content

4. **Technical constraints:**
   - Preserve JSON structure exactly
   - Keep interpolation variables intact: `{variable}`
   - Preserve HTML tags in rich text
   - Don't translate: Brand names, proper nouns, emoji

### Phase 2: Sports Terminology Glossary

Create a comprehensive glossary for consistent translations across namespaces.

**Deliverable:** `/docs/translation-glossary.md`

**Categories:**
1. **Core Platform Terms:**
   - Prode/Predictions (choose one consistently)
   - Pronóstico/Predicción → Prediction
   - Puntos → Points
   - Tabla de posiciones → Leaderboard/Standings

2. **Sports Terms:**
   - Partido → Match/Game
   - Torneo → Tournament
   - Fase de grupos → Group Stage
   - Eliminatorias → Playoffs/Knockout Stage
   - Gol → Goal
   - Empate → Draw/Tie

3. **Social Features:**
   - Grupo → Group
   - Amigos → Friends
   - Invitación → Invitation
   - Ranking → Ranking/Leaderboard

4. **UI/UX Terms:**
   - Guardar → Save
   - Cancelar → Cancel
   - Confirmar → Confirm
   - Editar → Edit

### Phase 3: Bidirectional Translation Workflow

Translate files in both directions using Claude with the approved prompt template.

**Process for each namespace with placeholders:**

**A. Spanish→English Translation (for EnOf placeholders in English files):**

1. **Load Spanish source:** Read the Spanish file as source of truth
2. **Identify EnOf placeholders** in English file
3. **Apply ES→EN translation prompt:**
   - Use translation prompt template
   - Source language: Spanish
   - Target language: English
   - Include namespace-specific context
   - Provide sports terminology glossary
4. **Merge with existing English content:**
   - Keep already-translated content
   - Replace only `EnOf()` placeholders
5. **Validate translation:**
   - JSON structure matches Spanish file
   - All keys present
   - Interpolation variables intact: `{count}`, `{name}`, etc.
   - No `EnOf()` placeholders remaining
6. **Save to English file**

**B. English→Spanish Translation (for EsOf placeholders in Spanish files):**

1. **Load English content as source**
2. **Identify EsOf placeholders** in Spanish file
3. **Apply EN→ES translation prompt:**
   - Use translation prompt template (adapted for EN→ES)
   - Source language: English
   - Target language: Spanish
   - Maintain casual, friendly tone
   - Keep sports terminology authentic
4. **Merge with existing Spanish content:**
   - Keep already-translated content
   - Replace only `EsOf()` placeholders
5. **Validate translation:**
   - JSON structure matches English file
   - All keys present
   - Interpolation variables intact
   - No `EsOf()` placeholders remaining
6. **Save to Spanish file**

**Translation Order (by priority and complexity):**

**Phase A: Critical Bidirectional Files (high visibility + interpolation risk):**
1. `common.json`: 4 EN + 5 ES = 9 keys - Used everywhere, low interpolation
2. `navigation.json`: 13 EN + 3 ES = 16 keys - Visible on every page
3. `groups.json`: 101 EN + 1 ES = 102 keys - **HIGH interpolation risk** (`{groupName}`, `{count}`, `{error}`)
4. `tournaments.json`: 13 EN + 10 ES = 23 keys - Core feature

**Phase B: High-Volume English Files (prioritize by user frequency):**
5. `onboarding.json`: 111 EN keys - First user experience (critical tone)
6. `predictions.json`: 108 EN keys - Core feature with interpolation (`{score}`, `{team}`)
7. `stats.json`: 58 EN keys - Statistics dashboard
8. `tables.json`: 49 EN keys - Standings display
9. `rules.json`: 42 EN keys - Help content (can be more formal)
10. `qualified-teams.json`: 31 EN keys - Tournament teams
11. `awards.json`: 25 EN keys - Recognition system

**Phase C: Spanish-Only Files (EN→ES):**
12. `games.json`: 15 ES keys - Game predictions
13. `backoffice.json`: 12 ES keys - Admin interface (can be more formal)
14. `errors.json`: 9 ES keys - **CRITICAL clarity** for error messages

**Strategy:**
- Bidirectional files first (establish terminology consistency)
- Large English files next (bulk of work)
- Spanish-only files last (reference established patterns)
- **CRITICAL:** Validate interpolation variables `{var}` after EACH file

### Phase 4: Quality Verification

**Automated Validation Script:**

Create `/scripts/validate-translations.sh`:

```bash
#!/bin/bash
# Validates all translation files for completeness and correctness

echo "🔍 Validating translation files..."
echo ""

ERRORS=0

# 1. Check for remaining placeholders
echo "1️⃣  Checking for EnOf/EsOf placeholders..."
for file in locales/en/*.json locales/es/*.json; do
  if grep -q "EnOf\|EsOf" "$file"; then
    echo "❌ ERROR: Placeholders found in $file"
    grep -n "EnOf\|EsOf" "$file" | head -5
    ERRORS=$((ERRORS + 1))
  fi
done
if [ $ERRORS -eq 0 ]; then
  echo "✅ No placeholders found"
fi
echo ""

# 2. Validate JSON syntax
echo "2️⃣  Validating JSON syntax..."
for file in locales/en/*.json locales/es/*.json; do
  if ! jq empty "$file" 2>/dev/null; then
    echo "❌ ERROR: Invalid JSON in $file"
    ERRORS=$((ERRORS + 1))
  fi
done
if [ $ERRORS -eq 0 ]; then
  echo "✅ All JSON files valid"
fi
echo ""

# 3. Check structure matches between locales
echo "3️⃣  Checking structure consistency..."
for es_file in locales/es/*.json; do
  filename=$(basename "$es_file")
  en_file="locales/en/$filename"

  es_keys=$(jq -r 'paths(scalars) as $p | $p | join(".")' "$es_file" | sort)
  en_keys=$(jq -r 'paths(scalars) as $p | $p | join(".")' "$en_file" | sort)

  if ! diff <(echo "$es_keys") <(echo "$en_keys") > /dev/null 2>&1; then
    echo "❌ ERROR: Structure mismatch in $filename"
    echo "   Keys in ES but not EN:"
    comm -23 <(echo "$es_keys") <(echo "$en_keys") | head -3
    echo "   Keys in EN but not ES:"
    comm -13 <(echo "$es_keys") <(echo "$en_keys") | head -3
    ERRORS=$((ERRORS + 1))
  fi
done
if [ $ERRORS -eq 0 ]; then
  echo "✅ Structure matches across locales"
fi
echo ""

# 4. Validate interpolation variables preserved
echo "4️⃣  Validating interpolation variables..."
for es_file in locales/es/*.json; do
  filename=$(basename "$es_file")
  en_file="locales/en/$filename"

  # Extract all {variable} patterns from both files
  es_vars=$(jq -r '.. | strings' "$es_file" | grep -o '{[^}]*}' | sort -u)
  en_vars=$(jq -r '.. | strings' "$en_file" | grep -o '{[^}]*}' | sort -u)

  # Check if variable sets match
  if [ "$es_vars" != "$en_vars" ]; then
    echo "⚠️  WARNING: Interpolation variables differ in $filename"
    echo "   Spanish variables: $(echo $es_vars | tr '\n' ' ')"
    echo "   English variables: $(echo $en_vars | tr '\n' ' ')"
    # Don't increment ERRORS - this is a warning, not a blocker
  fi
done
echo "✅ Interpolation validation complete"
echo ""

# 5. Summary
if [ $ERRORS -eq 0 ]; then
  echo "✅ ✅ ✅ All validation checks passed!"
  exit 0
else
  echo "❌ ❌ ❌ Found $ERRORS error(s). Please fix before proceeding."
  exit 1
fi
```

**Usage:**
```bash
chmod +x scripts/validate-translations.sh
./scripts/validate-translations.sh
```

**Run after EACH translation batch** to catch issues early.

**Manual QA Checklist:**

**Test in BOTH English (`/en/`) and Spanish (`/es/`) locales:**

**1. Auth Flows (Already Translated - Smoke Test):**
- [ ] Login page (`/en/login`, `/es/login`)
  - Email/password fields labeled correctly
  - Error messages clear and helpful
  - Buttons fit in UI (no overflow)
- [ ] Signup page (`/en/signup`, `/es/signup`)
  - Form validation messages clear
  - Success messages friendly tone
- [ ] Password reset flow
  - Instructions clear
  - Email sent confirmation displays correctly

**2. Onboarding Flow (NEW - Full Test):**
- [ ] Complete onboarding in English (`/en/onboarding`)
  - All instructions clear and concise
  - Button text fits (check on mobile)
  - Progress indicators translated
  - Friendly, welcoming tone maintained
- [ ] Repeat in Spanish (`/es/onboarding`)
  - Verify tone consistency with existing Spanish

**3. Core Features (Interpolation Risk):**
- [ ] **Groups page** (`/en/groups`, `/es/groups`)
  - Group names display correctly with `{groupName}`
  - Member counts with `{count}` render properly
  - Invite messages with interpolation work
  - Error messages with `{error}` display correctly
- [ ] **Predictions page** (`/en/tournaments/{id}/predictions`)
  - Score inputs labeled correctly
  - Team names with `{team}` interpolation work
  - Prediction counts with `{count}` display
- [ ] **Tournaments page** (`/en/tournaments`, `/es/tournaments`)
  - Tournament names and descriptions translated
  - Date/time formats localized
  - Navigation tabs translated correctly

**4. UI Constraints (Visual Check):**
- [ ] **Desktop view:**
  - Button text doesn't overflow
  - Form labels align properly
  - Table headers fit columns
  - Navigation menu items fit
- [ ] **Mobile view:**
  - Bottom navigation labels fit
  - Compact tournament cards render
  - Group invite buttons fit (critical - Spanish often longer)
  - Error toasts display fully

**5. Tone & Style Verification:**
- [ ] **Casual/friendly tone maintained:**
  - Welcome messages feel inviting
  - Help text is conversational
  - Success messages celebrate user
  - Footer teasing messages (check common.json) maintain playful tone
- [ ] **Concise for UI:**
  - Button text < 15 characters where possible
  - Form labels brief but clear
  - Error messages helpful but not verbose
- [ ] **Sports terminology authentic:**
  - "Match" vs "Game" consistent
  - "Standings" vs "Leaderboard" vs "Table" consistent
  - Tournament stage names (Group Stage, Knockouts) correct

**6. Interpolation Variables (Critical):**
- [ ] Test pages with dynamic content:
  - `"Welcome, {name}"` → Displays actual name, not `{name}`
  - `"Invitar a {groupName}"` → Shows group name
  - `"Expires in: {time}"` → Shows countdown time
  - `"{count} members"` → Shows actual count
- [ ] Verify variables NOT translated:
  - Check no instances of `{nombre}` (Spanish) in English files
  - Check no instances of `{name}` left untranslated in Spanish

**Success Criteria:**
- All checkboxes above completed
- No UI overflow or layout issues
- Tone feels natural in both locales
- Interpolation works correctly in all tested scenarios

### Phase 5: Documentation

**Create translation guide:**

**Deliverable:** `/docs/translation-guide.md`

**Contents:**
1. **Quick Start:**
   - How to use translation prompt template
   - When to add new translations
   - How to maintain consistency

2. **Sports Terminology Glossary:**
   - Link to or embed glossary
   - Examples of usage in context

3. **Style Guidelines:**
   - Tone: Casual vs formal examples
   - UI constraints: Button text best practices
   - Error messages: Helpful vs unhelpful examples

4. **Process:**
   - Adding new translation keys
   - Using LLM for translation
   - Validation steps
   - Testing translations

5. **Common Pitfalls:**
   - Forgetting interpolation variables
   - Breaking JSON structure
   - Inconsistent terminology
   - Overly formal tone

## Files to Create

### New Documentation Files

1. **`/docs/translation-prompt-template.md`** (NEW)
   - Purpose: Reusable prompt for LLM translation
   - Audience: Developers adding new translations
   - Contents: Bidirectional prompts (ES→EN and EN→ES), context, terminology, style guidelines, technical constraints, interpolation preservation instructions

2. **`/docs/translation-glossary.md`** (NEW)
   - Purpose: Consistent sports/platform terminology
   - Audience: Translators, developers, reviewers
   - Contents: Bidirectional term mappings (ES↔EN) with usage examples

### New Scripts

3. **`/scripts/validate-translations.sh`** (NEW)
   - Purpose: Automated validation of translation files
   - Validates: No placeholders, valid JSON, structure consistency, interpolation variables preserved
   - Run after each translation batch

### Documentation Updates

4. **Update `/docs/i18n-guide.md`** (ENHANCE EXISTING)
   - Add section: "Translation Workflow for New Keys"
   - Add reference to translation-prompt-template.md
   - Add reference to translation-glossary.md
   - Add reference to validation script
   - **DO NOT create separate translation-guide.md** - consolidate into existing i18n-guide.md

### Files to Modify

**English translation files** (need Spanish→English) - **11 files, 555 keys:**
- `/locales/en/onboarding.json` - 111 EnOf→proper English
- `/locales/en/predictions.json` - 108 EnOf→proper English
- `/locales/en/groups.json` - 101 EnOf→proper English
- `/locales/en/stats.json` - 58 EnOf→proper English
- `/locales/en/tables.json` - 49 EnOf→proper English
- `/locales/en/rules.json` - 42 EnOf→proper English
- `/locales/en/qualified-teams.json` - 31 EnOf→proper English
- `/locales/en/awards.json` - 25 EnOf→proper English
- `/locales/en/navigation.json` - 13 EnOf→proper English
- `/locales/en/tournaments.json` - 13 EnOf→proper English
- `/locales/en/common.json` - 4 EnOf→proper English

**Spanish translation files** (need English→Spanish) - **7 files, 55 keys:**
- `/locales/es/games.json` - 15 EsOf→proper Spanish
- `/locales/es/backoffice.json` - 12 EsOf→proper Spanish
- `/locales/es/tournaments.json` - 10 EsOf→proper Spanish
- `/locales/es/errors.json` - 9 EsOf→proper Spanish
- `/locales/es/common.json` - 5 EsOf→proper Spanish
- `/locales/es/navigation.json` - 3 EsOf→proper Spanish
- `/locales/es/groups.json` - 1 EsOf→proper Spanish

**Total files to modify:** 18 files (11 EN + 7 ES, with 4 files bidirectional)
**Total keys to translate:** ~610 keys

**No code changes needed** - Infrastructure already complete.

## Implementation Steps

### Step 1: User Decision - "Prode" vs "Predictions"

**Decision needed:** How to translate "Prode" in English?

**Options:**
1. Keep "Prode" (brand name, no translation)
2. Translate to "Predictions" or "Prediction Game"

**Impact:** Affects multiple translation keys across namespaces.

**Decision Matrix:**

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| **Keep "Prode"** | Brand identity, authentic Argentine term | English users may not understand | ✅ **RECOMMENDED** - Build brand |
| **Translate to "Predictions"** | Clear for English users | Loses cultural authenticity, generic | ❌ Not recommended |
| **"Prode Predictions"** | Balances both needs | Verbose for UI buttons | ⚠️ Compromise option |

**Examples of current usage:**
- Footer teasing messages: "👑👑 Grande Rey, vas primero..." (common.json)
- These are intentionally playful/Spanish - likely keep as-is even in English
- App name: "Prode Mundial" → Keep "Prode" or translate "Mundial" to "World Cup Prode"?

**Recommendation:** Keep "Prode" as brand name (like "Uber" or "Spotify" - untranslated globally)

**Action:** Use AskUserQuestion to confirm decision before proceeding to templates.

### Step 2: Create Translation Prompt Templates (Bidirectional)

1. Create `/docs/translation-prompt-template.md`
2. Include **two prompt templates:**

   **A. Spanish→English Prompt Template:**
   - Context about Qatar Prode platform
   - User's decision on "Prode" terminology
   - Sports terminology guidelines (ES→EN)
   - Style requirements (casual, friendly, concise English)
   - Technical constraints (JSON structure, interpolation)

   **B. English→Spanish Prompt Template:**
   - Same context about Qatar Prode platform
   - Keep "Prode" terminology consistent
   - Sports terminology guidelines (EN→ES)
   - Style requirements (casual, friendly, concise Spanish - maintain original tone)
   - Technical constraints (JSON structure, interpolation)

### Step 3: Create Sports Terminology Glossary

1. Create `/docs/translation-glossary.md`
2. Extract common Spanish terms from existing files
3. Define English equivalents with examples
4. Organize by category (platform, sports, social, UI)

### Step 4: Bidirectional Translation (Priority Order)

**For each file with placeholders:**

**A. Bidirectional files (translate both directions together):**

1. **common.json** (4 EN + 5 ES):
   - Read both files, identify placeholders
   - Translate Spanish→English for EnOf markers
   - Translate English→Spanish for EsOf markers
   - Validate both files
   - Write both updated files

2. **navigation.json** (13 EN + 3 ES):
   - Same bidirectional process

3. **groups.json** (101 EN + 1 ES):
   - Same bidirectional process

4. **tournaments.json** (13 EN + 10 ES):
   - Same bidirectional process

**B. Spanish-only translation (EN→ES):**

5. **backoffice.json** (12 ES):
   - Read English content as source
   - Translate to Spanish
   - Replace EsOf markers
   - Validate and save

6. **errors.json** (9 ES):
   - Same EN→ES process

7. **games.json** (15 ES):
   - Same EN→ES process

**Translation Process for Each File:**

1. **Read source files** (both locales)
2. **Identify all placeholders** (EnOf in EN, EsOf in ES)
3. **Use Claude with appropriate prompt:**
   - ES→EN prompt for EnOf placeholders
   - EN→ES prompt for EsOf placeholders
   - Include glossary and namespace context
4. **Merge translations** (keep existing, replace placeholders)
5. **Validate:**
   - JSON structure matches
   - No placeholders remaining
   - Interpolation intact
6. **Write updated files** (EN and/or ES)
7. **Quick manual review** (spot check)

### Step 5: Run Automated Validation

```bash
# Check for remaining placeholders
./scripts/check-translation-placeholders.sh

# Verify JSON structure consistency
./scripts/verify-translation-structure.sh

# Check interpolation variables
./scripts/verify-interpolation-variables.sh
```

**Note:** These scripts may need to be created if they don't exist.

### Step 6: Manual Review of Key Flows

1. **Auth flows** (already translated):
   - Login: `/en/login`
   - Signup: `/en/signup`
   - Password reset: `/en/reset-password`
   - Verify: Tone, clarity, UI fit

2. **Onboarding flow** (newly translated):
   - Complete onboarding in English
   - Verify instructions are clear
   - Check button text fits

3. **Core features:**
   - Create prediction
   - Join/create group
   - View tournament standings
   - Check leaderboard

### Step 7: Create Translation Guide

1. Create `/docs/translation-guide.md`
2. Consolidate:
   - Translation prompt template reference
   - Glossary reference
   - Process documentation
   - Examples and best practices
3. Include "Future Additions" section

### Step 8: Update Existing i18n Documentation

1. Update `/docs/i18n-guide.md`:
   - Add reference to translation guide
   - Add glossary reference
   - Add note about completed English translations

2. Update `/app/utils/i18n-patterns.md` if needed:
   - Add translation workflow reference

## Testing Strategy

### Unit Tests

**No new unit tests required.**
- Existing i18n tests already cover translation functionality
- Tests use mock translations (not dependent on actual content)
- Translation content is data, not code

### Manual Testing

**Test plan:**

1. **Locale Switching:**
   - Navigate to `/en/` routes
   - Verify all translated content displays
   - Check header language switcher works

2. **Auth Flows (Smoke Test):**
   - `/en/login` - Login form displays English
   - `/en/signup` - Signup form displays English
   - Verify error messages in English
   - Test password reset flow

3. **Onboarding Flow (Full Test):**
   - Complete onboarding in English
   - Verify all instructions clear
   - Check buttons/labels fit UI
   - Confirm friendly tone

4. **Core Features (Spot Check):**
   - Predictions page: `/en/tournaments/{id}/predictions`
   - Groups page: `/en/groups`
   - Standings: `/en/tournaments/{id}/tables`
   - Stats: `/en/tournaments/{id}/stats`

5. **UI Constraints:**
   - Check button text doesn't overflow
   - Verify form labels align properly
   - Confirm mobile responsiveness

6. **Interpolation Variables:**
   - Test pages with dynamic content: `"Welcome, {name}"`
   - Verify variables render correctly (not as `{name}`)

### Build Verification

```bash
# TypeScript build (type-checks all translation keys)
npm run build

# Should complete without errors
# next-intl enforces type safety on translation keys
```

## Quality Gates

### Pre-Commit Validation

**Automated checks (before commit):**
1. ✅ No `EnOf()` or `EsOf()` placeholders in any English file
2. ✅ All JSON files valid (no syntax errors)
3. ✅ JSON structure matches between Spanish and English files
4. ✅ TypeScript build succeeds (translation keys type-safe)

### SonarCloud Requirements

**This story involves documentation and translation data files only:**
- ✅ No code coverage requirements (no new code)
- ✅ No new code complexity issues
- ✅ No security vulnerabilities

**Validation:**
- Documentation files are markdown (not analyzed by SonarCloud)
- Translation files are JSON data (not analyzed for coverage)

### Deployment Verification

**Vercel Preview:**
1. Deploy to Vercel Preview
2. Test key flows in English: `/en/...`
3. Verify translations display correctly
4. Check UI renders properly (no overflow, proper spacing)

## Dependencies

**Blocked by:** None
- i18n infrastructure complete (from previous stories)
- Test utilities in place
- All components already use `next-intl`

**Blocks:** None
- Future: New features will add translations using this workflow
- Future: Other languages (if needed) can follow same process

## Open Questions

### Q1: "Prode" Terminology Decision

**Question:** Should "Prode" be kept as-is (brand name) or translated to "Predictions"?

**Context:**
- "Prode" is Argentine slang for prediction game
- English users may not understand "Prode"
- But it could be used as a brand name

**Options:**
1. Keep "Prode" everywhere (brand identity)
2. Translate to "Predictions" (clarity for English users)
3. Use "Prode Predictions" as full name

**Impact:** Affects multiple translation keys in common, navigation, emails

**Decision needed before Step 2.**

### Q2: Tone Verification

**Question:** Should we do a final review of tone/style after translation?

**Context:**
- LLM translations may be too formal
- Spanish version is casual/friendly
- Need to ensure English matches tone

**Recommendation:** Yes, quick manual review of key namespaces after translation.

### Q3: Scripts Creation

**Question:** Do we need to create validation scripts for translation checking?

**Context:**
- Planning phase mentions placeholder/structure validation scripts
- These may not exist yet

**Recommendation:**
- If scripts don't exist: Add inline bash commands to validation step
- If time permits: Create helper scripts for future use

## Risk Assessment

### Low Risk Items

✅ **Infrastructure ready:** All components use `next-intl`, no code changes needed
✅ **Translation files isolated:** Changes don't affect code logic
✅ **Type-safe:** TypeScript catches missing/invalid keys at build time
✅ **Reversible:** Can easily update translations if issues found

### Medium Risk Items

⚠️ **Translation quality:** LLM may produce overly formal or awkward translations
- **Mitigation:** Manual review of key flows, glossary guidance
- **Fallback:** Iterative refinement of translations

⚠️ **UI constraints:** Some English text may be longer than Spanish
- **Mitigation:** Test on actual UI, adjust if needed
- **Fallback:** Use abbreviations or rephrase

⚠️ **Terminology consistency:** Different namespaces translated separately
- **Mitigation:** Use glossary, consistent prompt template
- **Fallback:** Second pass to align terminology

### High Risk Items

❌ None identified.

## Success Metrics

1. ✅ **Completeness:** 0 placeholders remaining in English files
2. ✅ **Quality:** Manual review passes for auth + onboarding flows
3. ✅ **Build:** TypeScript build succeeds without errors
4. ✅ **UI:** No text overflow or layout issues in English
5. ✅ **Documentation:** Translation guide complete and usable
6. ✅ **Future-ready:** Template and glossary enable consistent future translations

## Timeline Estimate

**Total effort:** 14-18 hours (HIGH complexity due to volume)

**Breakdown:**

**Phase A: Setup (2 hours)**
- Step 1 (Prode decision + terminology alignment): 30 min
- Step 2 (Translation prompt templates - ES→EN and EN→ES): 1 hour
- Step 3 (Sports glossary - bidirectional with examples): 30 min

**Phase B: Translation Work (9-11 hours)** ⚠️ **LARGEST EFFORT**
- **Bidirectional files (4 files, 150 keys):** 2-3 hours
  - common.json (9 keys): 30 min
  - navigation.json (16 keys): 30 min
  - groups.json (102 keys - HIGH interpolation): 60-90 min
  - tournaments.json (23 keys): 30 min

- **English-only files (7 files, 555 keys):** 6-7 hours
  - onboarding.json (111 keys): 60-75 min
  - predictions.json (108 keys - interpolation risk): 60-75 min
  - stats.json (58 keys): 45 min
  - tables.json (49 keys): 40 min
  - rules.json (42 keys): 35 min
  - qualified-teams.json (31 keys): 30 min
  - awards.json (25 keys): 25 min

- **Spanish-only files (3 files, 55 keys):** 1-1.5 hours
  - games.json (15 keys): 20-25 min
  - backoffice.json (12 keys): 20-25 min
  - errors.json (9 keys - CRITICAL clarity): 20-25 min

**Phase C: Validation & QA (2-3 hours)**
- Step 5 (Create + run validation script): 1 hour
- Step 6 (Manual QA - both locales, full checklist): 1.5-2 hours

**Phase D: Documentation (1-1.5 hours)**
- Step 7 (Translation guide with examples): 45 min
- Step 8 (Update existing i18n docs): 30 min

**Contingency:** +2 hours for:
- Fixing interpolation issues
- Tone refinement iterations
- UI overflow fixes
- Validation script debugging

**Note:** Each file includes:
- Reading source files
- Applying LLM translation
- Manual spot-check of output
- Validation script run
- Fix any issues found

**Critical Path:** Translation work (Phase B) is the bottleneck at 9-11 hours for 610 keys.

## Definition of Done

- [x] User decision on "Prode" terminology obtained
- [ ] Translation prompt templates created (ES→EN and EN→ES) (`/docs/translation-prompt-template.md`)
- [ ] Sports terminology glossary created (bidirectional) (`/docs/translation-glossary.md`)
- [ ] All 4 English translation files updated (no EnOf placeholders)
- [ ] All 7 Spanish translation files updated (no EsOf placeholders)
- [ ] Automated validation passes (no placeholders in EITHER locale, valid JSON, structure matches)
- [ ] Manual review of auth flows passes (smoke test - both locales)
- [ ] Manual review of onboarding flow passes (full test - both locales)
- [ ] Manual review of new Spanish translations (backoffice, errors, games)
- [ ] Translation guide created (bidirectional workflow) (`/docs/translation-guide.md`)
- [ ] Existing i18n documentation updated
- [ ] TypeScript build succeeds
- [ ] UI constraints verified (no overflow in both locales)
- [ ] Vercel Preview deployment tested in English AND Spanish
- [ ] All quality gates passed
- [ ] Documentation committed to PR

## Notes

- **No code changes:** This is a pure content/documentation story
- **No new tests:** Existing i18n tests sufficient (content-agnostic)
- **Bidirectional work:** Both Spanish→English AND English→Spanish translation
- **Scope increase:** Original story focused on EN, now includes completing ES as well
- **Total keys:** ~186 translation keys (131 EN + 55 ES)
- **Iterative refinement:** May need to adjust translations after user feedback in both locales
- **Future additions:** Bidirectional templates and glossary make adding translations easy

---

**Plan created by:** Claude Sonnet 4.5
**Date:** 2026-02-21
**Story:** #161 - [i18n] LLM-Assisted English Translation

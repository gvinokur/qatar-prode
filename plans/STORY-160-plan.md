# Implementation Plan: Translation QA & Missing Keys Detection

**Story:** #160 - [i18n] Translation QA & Missing Keys Detection
**Created:** 2026-02-25
**Status:** Planning

---

## Context

This story implements comprehensive translation quality assurance tooling for the Qatar Prode application. Currently, the app has a robust i18n system using next-intl with Spanish (default) and English locales, organized across 19+ namespaces (auth, common, errors, games, etc.). While there's an existing validation script (`validate-translations.sh`) that checks for structural issues, placeholders, and syntax errors, there's no automated way to:

1. **Detect missing translation keys** - When developers add new `t('key')` calls but forget to add the translation to JSON files
2. **Find unused translation keys** - Dead keys in JSON files that bloat the translation files and confuse translators
3. **Enforce translation completeness in CI** - Prevent merging code with missing translations
4. **Generate coverage reports** - Visibility into translation health across namespaces

This creates a risk of:
- Untranslated UI text appearing to users (especially in English locale)
- Growing technical debt in translation files
- Lack of visibility into translation quality metrics

**Why now:** With ~720 TypeScript files and 19+ namespaces, manual translation management is error-prone. This QA tooling will catch issues early and maintain translation quality as the app grows.

---

## Objectives

1. **Detect missing translation keys** - Build script that scans codebase for `t('key')` calls and verifies keys exist in JSON files
2. **Find unused translation keys** - Build script that identifies JSON keys never referenced in code
3. **CI/CD integration** - Add translation checks to GitHub Actions workflow (fail on missing keys, warn on unused)
4. **Translation coverage report** - Generate markdown/JSON report with metrics per namespace
5. **Documentation** - Update i18n guide with QA workflow and best practices

---

## Acceptance Criteria

- [ ] **Missing Keys Script** - `scripts/detect-missing-keys.sh` scans all .tsx/.ts files and reports missing translation keys with namespace, file location, and line number
- [ ] **Unused Keys Script** - `scripts/detect-unused-keys.sh` identifies keys in JSON files never referenced in codebase
- [ ] **CI Integration** - GitHub Actions workflow includes translation QA step that:
  - Runs missing keys detection (fails build if found)
  - Runs unused keys detection (warns but doesn't fail)
  - Runs existing `validate-translations.sh`
- [ ] **Coverage Report** - `scripts/translation-coverage.sh` generates report with:
  - Total keys per namespace
  - English/Spanish coverage percentage
  - Missing keys count
  - Unused keys count
  - Output as markdown table
- [ ] **Documentation** - Update `docs/i18n-guide.md` with:
  - How to run QA scripts locally
  - How to interpret coverage report
  - Best practices for avoiding missing/unused keys
- [ ] **Unit Tests** - Test scripts with sample data to verify accuracy
- [ ] **80% Test Coverage** - All new utility functions have comprehensive unit tests

---

## Technical Approach

### Architecture Decision: TypeScript Core + Bash Wrappers

**To achieve 80% test coverage and satisfy SonarCloud requirements, we will:**

1. **Core logic in TypeScript** - All key extraction, JSON parsing, and report generation logic will be written as TypeScript utilities
2. **Bash script wrappers** - Thin bash scripts will call the TypeScript utilities
3. **Testing in Vitest** - TypeScript utilities will have comprehensive unit tests
4. **Integration tests** - Bash scripts will have integration tests to verify end-to-end behavior

**File structure:**
```
scripts/
  detect-missing-keys.sh       # Bash wrapper
  detect-unused-keys.sh        # Bash wrapper
  translation-coverage.sh      # Bash wrapper
  lib/
    translation-qa.ts          # TypeScript core logic
```

**Benefits:**
- ✅ TypeScript code is testable in Vitest
- ✅ SonarCloud can measure coverage on TypeScript
- ✅ Bash scripts remain simple and focused on CLI output
- ✅ Core logic is reusable (could be used by future web UI, etc.)

---

### 1. Missing Keys Detection Script

**Script:** `scripts/detect-missing-keys.sh`
**Core Logic:** `scripts/lib/translation-qa.ts` (TypeScript)

**Algorithm:**
1. Find all `.tsx` and `.ts` files (exclude `node_modules`, `.next`, `__tests__`, `coverage`)
2. Parse each file to extract:
   - Namespace from `useTranslations('namespace')` or `getTranslations('namespace')` calls
   - Translation keys from `t('key.path')` or `t.rich('key.path')` calls
3. For each key usage:
   - Map to the namespace's JSON file (e.g., `useTranslations('auth')` → `locales/en/auth.json`)
   - Check if key exists in both English and Spanish JSON files
   - If missing, record: namespace, file path, line number, missing locale(s)
4. Output results as structured report (exit code 1 if any missing keys found)

**Implementation details:**

**TypeScript utilities (testable):**
```typescript
// scripts/lib/translation-qa.ts

export interface TranslationUsage {
  namespace: string;
  key: string;
  file: string;
  line: number;
}

export interface MissingKey {
  namespace: string;
  key: string;
  file: string;
  line: number;
  missingLocales: string[];
}

// Extract namespace from file content
export function extractNamespaces(content: string, filePath: string): Map<string, string> {
  // Regex: /useTranslations\(['"`](\w+)['"`]\)/g or /getTranslations\(['"`](\w+)['"`]\)/g
  const namespacePattern = /(?:useTranslations|getTranslations)\(['"`](\w+)['"`]\)/g;
  // Returns Map of variable name → namespace
}

// Extract translation keys from file content
export function extractTranslationKeys(content: string, filePath: string): TranslationUsage[] {
  // Regex: /\bt\(['"`]([a-zA-Z0-9_.]+)['"`]\)/g or /\bt\.rich\(['"`]([a-zA-Z0-9_.]+)['"`]\)/g
  const keyPattern = /\bt(?:\.rich)?\(['"`]([a-zA-Z0-9_.]+)['"`]\)/g;
  // Returns array of TranslationUsage
}

// Check if key exists in JSON file
export function checkKeyExists(key: string, jsonData: any): boolean {
  // Split key by '.' and traverse JSON object
  const parts = key.split('.');
  let current = jsonData;
  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return false;
    }
    current = current[part];
  }
  return true;
}

// Main detection function
export function detectMissingKeys(
  files: string[],
  localesPath: string
): MissingKey[] {
  // Coordinate extraction and checking
  // Return array of missing keys
}
```

**Bash wrapper:**
```bash
#!/bin/bash
# scripts/detect-missing-keys.sh

set -e

# Run TypeScript utility
npx tsx scripts/lib/translation-qa.ts detect-missing-keys

# Exit with code from TypeScript
exit $?
```

**Concrete regex patterns:**
```javascript
// Namespace extraction (handles both useTranslations and getTranslations)
/(?:useTranslations|getTranslations)\(['"`](\w+)['"`]\)/g

// Key extraction (handles both t() and t.rich())
/\bt(?:\.rich)?\(['"`]([a-zA-Z0-9_.]+)['"`]\)/g

// Examples matched:
// - useTranslations('auth')
// - getTranslations('common')
// - t('login.submitButton')
// - t.rich('message.welcome')

// Examples NOT matched (intentionally):
// - t(dynamicKey)          // Dynamic key (will warn)
// - t(`template.${var}`)   // Template literal (will warn)
// - // t('commented.key')  // Comments (excluded by file content parser)
```

**jq commands for JSON validation:**
```bash
# Check if nested key "auth.login.submitButton" exists
echo '{}' | jq --arg key "auth.login.submitButton" '
  ($key | split(".")) as $parts |
  reduce $parts[] as $part (.; .[$part] // empty) |
  if . then true else false end
'

# Actual usage in TypeScript:
# We'll use JSON.parse() and traverse objects instead of jq
# This is more reliable and testable
```

**Output format:**
```
🔍 Scanning for missing translation keys...

❌ MISSING KEYS FOUND:

Namespace: auth
  File: app/components/auth/login-form.tsx:45
  Key: login.submitButton
  Missing in: en

Namespace: common
  File: app/components/header/header.tsx:23
  Key: navigation.dashboard
  Missing in: en, es

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary: 2 missing keys found across 2 namespaces
```

### 2. Unused Keys Detection Script

**Script:** `scripts/detect-unused-keys.sh`
**Core Logic:** `scripts/lib/translation-qa.ts` (TypeScript)

**Algorithm:**
1. Load all translation keys from JSON files (both locales, all namespaces)
2. Find all `.tsx` and `.ts` files (exclude `node_modules`, `.next`, `__tests__`, `coverage`)
3. For each translation key:
   - Search codebase for `t('exact.key')` usage
   - Mark as used if found, otherwise mark as unused
4. Output list of unused keys grouped by namespace
5. **Exit code 0 (warnings only, not errors) - Both locally and in CI**

**Implementation details:**

**TypeScript utilities:**
```typescript
// scripts/lib/translation-qa.ts

export interface UnusedKey {
  namespace: string;
  key: string;
  existsIn: string[]; // ['en', 'es']
}

// Extract all keys from JSON file (returns flat list of dot-notation keys)
export function extractAllKeys(jsonData: any, prefix = ''): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(jsonData)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recurse for nested objects
      keys.push(...extractAllKeys(value, fullKey));
    } else {
      // Leaf node - this is a translatable key
      keys.push(fullKey);
    }
  }

  return keys;
}

// Search codebase for key usage
export function isKeyUsedInCodebase(key: string, files: string[]): boolean {
  // Read all file contents
  // Search for t('key') or t.rich('key') or t("key") or t.rich("key")
  // Return true if found anywhere

  // Regex: new RegExp(`\\bt(?:\\.rich)?\\(['\"\`]${escapeRegex(key)}['\"\`]\\)`)
}

// Main detection function
export function detectUnusedKeys(
  localesPath: string,
  sourceFiles: string[]
): UnusedKey[] {
  // Load all JSON keys
  // Check each key against codebase
  // Return unused keys
}
```

**Exit code behavior (clarified):**
- **Local execution:** Always exit 0 (informational warnings)
- **CI execution:** Always exit 0 (informational warnings)
- **Rationale:** Unused keys are technical debt but not critical errors. Developers should review and clean up quarterly, but shouldn't block PRs.

**Output format:**
```
🔍 Scanning for unused translation keys...

⚠️  UNUSED KEYS FOUND:

Namespace: auth (3 unused keys)
  - auth.login.forgotPasswordOld
  - auth.signup.termsCheckbox
  - auth.errors.deprecated

Namespace: common (1 unused key)
  - common.buttons.submitOld

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary: 4 unused keys across 2 namespaces
Note: These are warnings only. Review before removing.
```

### 3. Translation Coverage Report Script

**Script:** `scripts/translation-coverage.sh`
**Core Logic:** `scripts/lib/translation-qa.ts` (TypeScript)

**Algorithm:**
1. For each namespace JSON file:
   - Count total **leaf keys** (keys with non-object values) in English file
   - Count total **leaf keys** in Spanish file
   - Calculate coverage percentage
2. Run missing keys detection and count results
3. Run unused keys detection and count results
4. Generate markdown table with metrics

**Key Counting Logic (Precisely Defined):**

**Definition:** A "key" is a **leaf node** - a property whose value is NOT an object.

**Examples:**
```json
{
  "auth": {
    "login": {
      "email": {
        "label": "Email",           // ← LEAF KEY: "auth.login.email.label"
        "placeholder": "Enter email" // ← LEAF KEY: "auth.login.email.placeholder"
      },
      "submitButton": "Login"       // ← LEAF KEY: "auth.login.submitButton"
    }
  }
}
```
**Count:** 3 leaf keys total (not 4, auth and login are intermediate objects)

**TypeScript implementation:**
```typescript
// scripts/lib/translation-qa.ts

export interface NamespaceCoverage {
  namespace: string;
  enKeys: number;    // Leaf key count in English
  esKeys: number;    // Leaf key count in Spanish
  coverage: number;  // Percentage (0-100)
  missingKeys: number;
  unusedKeys: number;
}

// Count leaf keys in JSON
export function countLeafKeys(jsonData: any): number {
  // Use extractAllKeys() utility (returns flat list)
  return extractAllKeys(jsonData).length;
}

// Calculate coverage percentage
export function calculateCoverage(enKeys: number, esKeys: number): number {
  // Formula: (min(enKeys, esKeys) / max(enKeys, esKeys)) * 100
  // This handles cases where ES might have more keys than EN
  if (enKeys === 0 && esKeys === 0) return 100; // Both empty = 100% match
  if (enKeys === 0 || esKeys === 0) return 0;   // One empty = 0% match

  const min = Math.min(enKeys, esKeys);
  const max = Math.max(enKeys, esKeys);
  return Math.round((min / max) * 100);
}

// Generate coverage report
export function generateCoverageReport(
  namespaceCoverages: NamespaceCoverage[]
): string {
  // Generate markdown table
  // Include summary statistics
  // Return formatted string
}
```

**Coverage Percentage Logic:**
- If EN and ES have same number of keys → 100% coverage
- If EN has more keys than ES → (ES/EN) * 100
- If ES has more keys than EN → (EN/ES) * 100
- **Example:** EN=100 keys, ES=80 keys → 80% coverage
- **Example:** EN=50 keys, ES=60 keys → 83% coverage (50/60)

**Output format:**
```markdown
# Translation Coverage Report

Generated: 2026-02-25 14:30:00 UTC

## Summary
- Total Namespaces: 19
- Total Keys (EN): 1,234
- Total Keys (ES): 1,234
- Missing Keys: 2
- Unused Keys: 4

## By Namespace

| Namespace | EN Keys | ES Keys | Coverage | Missing | Unused |
|-----------|---------|---------|----------|---------|--------|
| auth | 85 | 85 | 100% | 1 | 2 |
| common | 120 | 120 | 100% | 0 | 1 |
| errors | 45 | 45 | 100% | 0 | 0 |
| ... | ... | ... | ... | ... | ... |

## ✅ Status: PASS
All namespaces have complete translations.

## Recommendations
- Review 4 unused keys for potential removal
- Keep translation files lean and maintainable
```

**Badge generation** (optional):
- Generate coverage badge JSON for README
- Format: `{"schemaVersion":1,"label":"i18n","message":"100%","color":"brightgreen"}`

### 4. CI/CD Integration

**File:** `.github/workflows/sonarcloud.yml`

**Timing:** Translation QA runs **BEFORE** SonarCloud scan but **AFTER** tests.

**Rationale:**
- Tests must pass first (no point validating translations if code is broken)
- Translation QA can fail fast (before expensive SonarCloud scan)
- SonarCloud gets clean code (no missing translation issues)

**New step** (add after "Run tests with coverage" step, BEFORE "Run linter" step):
```yaml
- name: Validate Translations
  run: |
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔍 Translation Quality Assurance"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    echo ""
    echo "1️⃣ Validating translation structure..."
    ./scripts/validate-translations.sh

    echo ""
    echo "2️⃣ Checking for missing translation keys..."
    ./scripts/detect-missing-keys.sh
    # This will exit 1 and fail the build if missing keys found

    echo ""
    echo "3️⃣ Checking for unused translation keys..."
    ./scripts/detect-unused-keys.sh
    # This always exits 0 (warnings only)

    echo ""
    echo "4️⃣ Generating coverage report..."
    ./scripts/translation-coverage.sh > translation-coverage.md

    echo ""
    echo "✅ Translation QA complete!"

- name: Upload Translation Coverage Report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: translation-coverage-report
    path: translation-coverage.md
    retention-days: 30
```

**Status Check Behavior:**

| Check | Local Exit Code | CI Exit Code | Blocks PR? | Notes |
|-------|----------------|-------------|-----------|-------|
| **Missing keys** | 1 (fails) | 1 (fails) | ✅ YES | Critical - must fix before merging |
| **Unused keys** | 0 (warns) | 0 (warns) | ❌ NO | Informational - cleanup quarterly |
| **Coverage report** | 0 (always) | 0 (always) | ❌ NO | Artifact for review |

**Branch Protection Rules:**
- Translation QA is part of the "SonarCloud Analysis" required status check
- If translation QA fails (missing keys), the entire SonarCloud Analysis status check fails
- PR cannot be merged until fixed

**Developer Experience:**
- **On PR open:** GitHub Actions runs translation QA automatically
- **If missing keys found:** Build fails with clear error message and file locations
- **If unused keys found:** Build passes but artifact shows warnings for review
- **Coverage report:** Always available as downloadable artifact

### 5. Fallback Message Handling

**Current state:** next-intl already provides fallback behavior:
- If key missing → Shows key path as fallback (e.g., "auth.login.title")
- If locale missing → Falls back to default locale (Spanish)

**Improvements:**
- Add development mode warning when fallback is triggered
- Document fallback behavior in `docs/i18n-guide.md`
- Consider adding custom fallback messages for production (future story)

**No code changes needed** - This is primarily documentation.

---

## Files to Create

### Core TypeScript Logic (Testable)
1. **`scripts/lib/translation-qa.ts`** - All core logic (extractors, validators, report generator)
   - `extractNamespaces()`
   - `extractTranslationKeys()`
   - `checkKeyExists()`
   - `extractAllKeys()`
   - `countLeafKeys()`
   - `calculateCoverage()`
   - `detectMissingKeys()`
   - `detectUnusedKeys()`
   - `generateCoverageReport()`
   - CLI entry points for each command

### Bash Wrappers (Thin, focused on CLI output)
2. **`scripts/detect-missing-keys.sh`** - Wrapper that calls TypeScript utility
3. **`scripts/detect-unused-keys.sh`** - Wrapper that calls TypeScript utility
4. **`scripts/translation-coverage.sh`** - Wrapper that calls TypeScript utility

### Tests
5. **`__tests__/scripts/translation-qa.test.ts`** - Comprehensive unit tests
   - Test all TypeScript utilities
   - Mock file system operations
   - Test edge cases (dynamic keys, template literals, etc.)
   - Achieve 80% coverage

### Documentation
6. **Update `docs/i18n-guide.md`** - Add "Translation QA" section with:
   - How to run scripts locally
   - How to interpret results
   - Best practices for avoiding missing/unused keys
   - CI/CD integration details

### CI/CD
7. **Update `.github/workflows/sonarcloud.yml`** - Add translation validation step

---

## Files to Modify

1. **`.github/workflows/sonarcloud.yml`** - Add translation QA step
2. **`docs/i18n-guide.md`** - Add QA section
3. **`package.json`** - Add npm scripts:
   ```json
   "scripts": {
     "i18n:check": "./scripts/detect-missing-keys.sh && ./scripts/detect-unused-keys.sh",
     "i18n:coverage": "./scripts/translation-coverage.sh"
   }
   ```

---

## Implementation Steps

### Step 1: Create TypeScript Core Logic
- Write `scripts/lib/translation-qa.ts`
- Implement all utility functions (extractors, validators, report generator)
- Add CLI entry points for each command
- Test locally with sample data

**Key functions to implement:**
1. `extractNamespaces()` - Parse useTranslations/getTranslations
2. `extractTranslationKeys()` - Parse t() and t.rich() calls
3. `checkKeyExists()` - Validate key in JSON
4. `extractAllKeys()` - Flatten JSON structure
5. `countLeafKeys()` - Count only leaf nodes
6. `calculateCoverage()` - Coverage percentage formula
7. `detectMissingKeys()` - Main missing keys detection
8. `detectUnusedKeys()` - Main unused keys detection
9. `generateCoverageReport()` - Markdown report generation

### Step 2: Write Comprehensive Unit Tests
- Create `__tests__/scripts/translation-qa.test.ts`
- Test all utility functions with edge cases
- Mock file system operations
- Ensure 80% coverage (measured by Vitest)
- Run `npm run coverage` to verify

### Step 3: Create Bash Wrapper Scripts
- Write `scripts/detect-missing-keys.sh` (calls TypeScript utility)
- Write `scripts/detect-unused-keys.sh` (calls TypeScript utility)
- Write `scripts/translation-coverage.sh` (calls TypeScript utility)
- Make scripts executable (`chmod +x`)
- Add colored output and proper formatting
- Test locally on actual codebase

### Step 4: Performance Validation
- Benchmark scripts on actual codebase
- Verify runtime is <10 seconds total
- Optimize if needed (caching, parallel processing)
- Document actual performance in plan

### Step 5: Add CI/CD Integration
- Update `.github/workflows/sonarcloud.yml`
- Add translation validation step (after tests, before SonarCloud)
- Configure artifact upload for coverage report
- Test CI behavior with test PR (both pass and fail scenarios)

### Step 6: Update Documentation
- Add "Translation QA" section to `docs/i18n-guide.md`
- Document how to run scripts locally
- Document how to interpret results
- Add best practices section (avoid dynamic keys, etc.)
- Document CI/CD integration and status checks
- Add quarterly cleanup workflow for unused keys

### Step 7: Add npm Scripts
- Update `package.json` with convenience scripts
- Test npm run commands locally
- Verify scripts work from project root

### Step 8: Final Validation
- Run all QA scripts on actual codebase
- Review output for accuracy
- Create test PR with intentional issues
- Verify CI catches missing keys
- Verify unused keys don't block PR
- Download and review coverage report artifact

---

## Testing Strategy

### TypeScript Unit Tests (80% Coverage Target)

**Test file:** `__tests__/scripts/translation-qa.test.ts`

**What we test:**
- ✅ `extractNamespaces()` - Parse useTranslations/getTranslations calls
- ✅ `extractTranslationKeys()` - Parse t() and t.rich() calls
- ✅ `checkKeyExists()` - Traverse nested JSON objects
- ✅ `extractAllKeys()` - Flatten JSON to dot-notation keys
- ✅ `countLeafKeys()` - Count only leaf nodes
- ✅ `calculateCoverage()` - Coverage percentage formula
- ✅ `detectMissingKeys()` - End-to-end missing key detection
- ✅ `detectUnusedKeys()` - End-to-end unused key detection
- ✅ `generateCoverageReport()` - Markdown report generation

**Test approach:**
```typescript
import { describe, it, expect } from 'vitest';
import {
  extractNamespaces,
  extractTranslationKeys,
  checkKeyExists,
  countLeafKeys,
  calculateCoverage
} from '@/scripts/lib/translation-qa';

describe('translation-qa utilities', () => {
  describe('extractNamespaces', () => {
    it('should extract namespace from useTranslations call', () => {
      const content = `const t = useTranslations('auth');`;
      const result = extractNamespaces(content, 'test.tsx');
      expect(result.get('t')).toBe('auth');
    });

    it('should extract namespace from getTranslations call', () => {
      const content = `const t = await getTranslations('common');`;
      const result = extractNamespaces(content, 'test.tsx');
      expect(result.get('t')).toBe('common');
    });

    it('should handle multiple namespaces', () => {
      const content = `
        const tAuth = useTranslations('auth');
        const tCommon = useTranslations('common');
      `;
      const result = extractNamespaces(content, 'test.tsx');
      expect(result.get('tAuth')).toBe('auth');
      expect(result.get('tCommon')).toBe('common');
    });
  });

  describe('extractTranslationKeys', () => {
    it('should extract keys from t() calls', () => {
      const content = `
        <Button>{t('login.submitButton')}</Button>
        <p>{t("auth.error.message")}</p>
      `;
      const result = extractTranslationKeys(content, 'test.tsx');
      expect(result).toContainEqual({
        key: 'login.submitButton',
        file: 'test.tsx',
        line: expect.any(Number)
      });
    });

    it('should extract keys from t.rich() calls', () => {
      const content = `t.rich('message.welcome', { b: chunks => <b>{chunks}</b> })`;
      const result = extractTranslationKeys(content, 'test.tsx');
      expect(result[0].key).toBe('message.welcome');
    });
  });

  describe('checkKeyExists', () => {
    it('should return true for existing nested key', () => {
      const json = { auth: { login: { email: { label: 'Email' } } } };
      expect(checkKeyExists('auth.login.email.label', json)).toBe(true);
    });

    it('should return false for missing key', () => {
      const json = { auth: { login: {} } };
      expect(checkKeyExists('auth.login.email.label', json)).toBe(false);
    });

    it('should return false for partial path', () => {
      const json = { auth: { login: 'string' } };
      expect(checkKeyExists('auth.login.email', json)).toBe(false);
    });
  });

  describe('countLeafKeys', () => {
    it('should count only leaf nodes', () => {
      const json = {
        auth: {
          login: {
            email: 'Email',
            password: 'Password'
          },
          signup: {
            title: 'Sign Up'
          }
        }
      };
      expect(countLeafKeys(json)).toBe(3); // email, password, title
    });

    it('should return 0 for empty object', () => {
      expect(countLeafKeys({})).toBe(0);
    });
  });

  describe('calculateCoverage', () => {
    it('should return 100% for equal counts', () => {
      expect(calculateCoverage(100, 100)).toBe(100);
    });

    it('should return percentage when ES < EN', () => {
      expect(calculateCoverage(100, 80)).toBe(80);
    });

    it('should return percentage when EN < ES', () => {
      expect(calculateCoverage(50, 60)).toBe(83);
    });

    it('should return 0 for zero keys', () => {
      expect(calculateCoverage(0, 100)).toBe(0);
      expect(calculateCoverage(100, 0)).toBe(0);
    });
  });
});
```

**Coverage Goal:** 80% on all TypeScript utilities (measured by SonarCloud)

---

### Bash Integration Tests

**Test file:** `__tests__/scripts/detect-missing-keys.sh` (bash script)

**What we test:**
- ✅ Script exits 0 when no missing keys
- ✅ Script exits 1 when missing keys found
- ✅ Output format is correct
- ✅ Error messages are clear

**Test approach:**
```bash
#!/bin/bash
# __tests__/scripts/detect-missing-keys.sh

# Setup test fixture
mkdir -p test-fixture/locales/en
mkdir -p test-fixture/locales/es
mkdir -p test-fixture/src

echo '{"auth":{"login":{"title":"Login"}}}' > test-fixture/locales/en/auth.json
echo '{"auth":{"login":{"title":"Iniciar Sesión"}}}' > test-fixture/locales/es/auth.json

echo "const t = useTranslations('auth'); t('login.title')" > test-fixture/src/page.tsx

# Run script
./scripts/detect-missing-keys.sh --root test-fixture

# Verify exit code
if [ $? -eq 0 ]; then
  echo "✅ PASS: No missing keys detected"
else
  echo "❌ FAIL: Expected no missing keys"
  exit 1
fi

# Cleanup
rm -rf test-fixture
```

**Note:** Bash tests are **optional** - not required for SonarCloud coverage. Main focus is TypeScript unit tests.

---

### Manual Testing Checklist

Before merging:
- [ ] Run `scripts/detect-missing-keys.sh` on actual codebase
- [ ] Run `scripts/detect-unused-keys.sh` on actual codebase
- [ ] Run `scripts/translation-coverage.sh` and review report
- [ ] Create test PR with intentional missing keys - verify CI fails
- [ ] Create test PR with valid translations - verify CI passes
- [ ] Download translation-coverage.md artifact from GitHub Actions
- [ ] Verify all scripts have executable permissions (`chmod +x`)

---

### Performance Validation

**Baseline:** Run scripts on actual codebase and measure time

**Expected performance:**
- **Codebase size:** ~720 TypeScript files, ~1,200 translation keys
- **Target runtime:** <10 seconds for all scripts combined
- **Acceptable runtime:** <30 seconds (would still be faster than test suite)

**Benchmark before merging:**
```bash
time ./scripts/detect-missing-keys.sh
time ./scripts/detect-unused-keys.sh
time ./scripts/translation-coverage.sh
```

**Optimization strategies** (if needed):
- Cache file reads (read each file once, process multiple times)
- Use parallel processing (Node.js worker threads for large file counts)
- Skip node_modules and .next directories early (glob patterns)

**Acceptable tradeoff:** Accuracy > Speed. Better to be correct and take 30 seconds than be fast and miss keys.

---

## Edge Cases & Considerations

### 1. Dynamic Translation Keys
```typescript
// This is hard to detect statically
const key = isAdmin ? 'admin.title' : 'user.title';
t(key);
```
**Solution:** Warn if non-literal string detected, suggest using full keys

### 2. Template Literal Keys
```typescript
t(`auth.${action}.title`)
```
**Solution:** Detect pattern and warn, suggest using full keys

### 3. Rich Text Translations
```typescript
t.rich('message', { b: (chunks) => <strong>{chunks}</strong> })
```
**Solution:** Support both `t('key')` and `t.rich('key')` patterns

### 4. Multiple Namespaces in One File
```typescript
const tCommon = useTranslations('common');
const tAuth = useTranslations('auth');
```
**Solution:** Track multiple namespaces per file, map keys to correct namespace

### 5. Server vs Client Components
```typescript
// Server: getTranslations
const t = await getTranslations('auth');

// Client: useTranslations
const t = useTranslations('auth');
```
**Solution:** Support both patterns in regex

### 6. Test Files with Mock Translations
```typescript
// __tests__/mocks/next-intl.mocks.ts
useTranslations: () => (key: string) => key
```
**Solution:** Exclude `__tests__` directory from missing keys check, but include in unused keys detection

### 7. Interpolation Variables
```typescript
t('welcome', { name: 'John' })
```
**Solution:** Extract key only, ignore interpolation object

---

## Performance Considerations

- **Scope:** ~720 TypeScript files, 19+ namespaces, ~1,200+ translation keys
- **Expected runtime:** <10 seconds for all scripts combined
- **CI impact:** Minimal (adds <15 seconds to workflow)
- **Optimization:** Use parallel grep searches where possible

---

## Validation Considerations

### SonarCloud Requirements
- **Coverage:** 80% on new script utility functions (if written in TypeScript)
- **Code Quality:** No new issues
- **Maintainability:** Scripts should be readable and well-documented

### Pre-Commit Validation
- All scripts must be executable (`chmod +x`)
- All scripts must have proper shebang (`#!/bin/bash`)
- All scripts must handle errors gracefully
- All scripts must have clear output

---

## Security Considerations

- **No secrets in scripts** - All scripts read from file system only
- **No external API calls** - Scripts work offline
- **Input validation** - Sanitize file paths before processing
- **Error handling** - Fail gracefully on malformed JSON

---

## Documentation Updates

### `docs/i18n-guide.md` - Add New Section

```markdown
## Translation Quality Assurance

### Running QA Scripts Locally

**Check for missing/unused keys:**
```bash
npm run i18n:check
```

**Generate coverage report:**
```bash
npm run i18n:coverage
```

**Individual scripts:**
```bash
./scripts/detect-missing-keys.sh    # Detect missing keys
./scripts/detect-unused-keys.sh     # Detect unused keys
./scripts/translation-coverage.sh   # Generate report
```

### Interpreting Results

**Missing keys:** These are errors and must be fixed before merging.
- Add the key to both `locales/en/{namespace}.json` and `locales/es/{namespace}.json`
- Follow the translation workflow in this guide

**Unused keys:** These are warnings. Review carefully before removing.
- Key might be used in dynamic scenarios (edge case)
- Key might be planned for future feature
- If truly unused, remove from both locale files

### Best Practices

1. **Run QA before committing** - Catch issues early
2. **Add translations immediately** - Don't commit code with `t('key')` calls without corresponding JSON keys
3. **Review unused keys quarterly** - Clean up dead translations to reduce bloat (see Quarterly Cleanup Workflow below)
4. **Use literal keys** - Avoid dynamic key construction (`t('auth.' + action)`)

### Quarterly Cleanup Workflow for Unused Keys

Unused keys accumulate over time as features change. Establish a quarterly cleanup process:

**Step 1: Generate report**
```bash
npm run i18n:check > unused-keys-report.txt
```

**Step 2: Review unused keys**
- Open `unused-keys-report.txt`
- For each unused key, verify it's truly unused:
  - Search codebase manually for dynamic usage
  - Check if planned for upcoming feature
  - Confirm with team if unsure

**Step 3: Remove confirmed unused keys**
- Delete keys from both `locales/en/{namespace}.json` and `locales/es/{namespace}.json`
- Keep structure consistent

**Step 4: Create cleanup PR**
- Title: "chore: Remove unused translation keys (Q1 2026)"
- Include list of removed keys in PR description
- Run QA to verify no regressions

**Responsibility:** Tech lead or designated team member performs this quarterly (Jan, Apr, Jul, Oct)

### CI/CD Integration

GitHub Actions automatically runs translation QA on all PRs:
- ✅ **Missing keys** - Build fails
- ⚠️ **Unused keys** - Warning only
- 📊 **Coverage report** - Available as workflow artifact

### Troubleshooting

**Q: `jq` command not found**
A: Install jq - `brew install jq` (macOS) or `apt-get install jq` (Ubuntu)

**Q: `npx tsx` command not found**
A: Install tsx globally - `npm install -g tsx` or run `npm install` to get it locally

**Q: Script reports false positive (key is used but marked as unused)**
A: Check for dynamic key usage - the script only detects literal strings

**Q: CI fails but I need to merge urgently**
A: Add missing keys to JSON files - this is the fastest fix. Don't skip translation QA.

**Q: How do I skip translation QA temporarily?**
A: You can't and shouldn't. Translation QA is critical for UX. Fix the missing keys instead.
```

---

## Open Questions

None at this time. Requirements are clear from the issue description.

---

## Success Metrics

- **No missing translation keys** in production
- **<5% unused keys** across all namespaces (clean, lean translation files)
- **100% CI coverage** - All PRs run translation QA
- **Developer satisfaction** - Clear error messages, fast feedback

---

## Future Enhancements (Out of Scope)

- Automated translation suggestions using LLM
- Translation memory/cache for repeated keys
- Interactive CLI for fixing missing keys
- Browser extension for in-app translation editing
- Translation usage analytics (which keys are shown to users most)
- Support for additional locales (Portuguese, French, etc.)
- Visual diff tool for translation changes in PRs

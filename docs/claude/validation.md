# Validation & Quality Gates

Complete workflow for validating code quality before final PR review and merge.

## Overview

After implementation is complete, code is committed/pushed, and user has tested in Vercel Preview and is satisfied, run final SonarCloud validation. This is a hard gate - all issues must be resolved before proceeding to merge.

**Note:** Tests, lint, and build are run BEFORE commit (see implementation.md Section 7). This validation phase focuses on SonarCloud analysis and quality gates.

## Critical Rules

1. **ONLY validate when user says "code looks good" after testing in Vercel Preview** - Not before
2. **Tests/lint/build already passed** - These were run before commit (implementation.md Section 7)
3. **0 new SonarCloud issues of ANY severity** - Low, medium, high, or critical
4. **80% coverage on new code** - SonarCloud enforces this automatically
5. **NEVER auto-fix issues** - Always show user and ask permission
6. **All checks must pass** - CI/CD, SonarCloud quality gates

## When to Run Validation

**Default workflow (Vercel Preview testing):**
1. Implementation complete → Commit & push
2. User tests in Vercel Preview
3. User says "code looks good" or "I'm satisfied" (after testing in preview)
4. **NOW run this validation workflow** (SonarCloud analysis)

**Trigger phrases from user (after Vercel Preview testing):**
- "Code looks good" (tested in Vercel Preview)
- "I'm satisfied with the implementation"
- "Ready to merge"
- "Let's check quality gates"
- "Looks good in preview"

**DO NOT validate:**
- During implementation
- Before user has tested in Vercel Preview
- When user is still iterating on functionality
- Before commit (tests/lint/build happen before commit, not here)

## Complete Validation Workflow

**Prerequisites (already completed in implementation phase):**
- ✅ Tests run and passing (done before commit - implementation.md Section 7 Step 3)
- ✅ Linting passed (done before commit - implementation.md Section 7 Step 3)
- ✅ Build succeeded (done before commit - implementation.md Section 7 Step 3)
- ✅ Code committed and pushed
- ✅ Vercel Preview deployment created

### 1. Verify User Satisfaction from Vercel Preview

Confirm user has tested in Vercel Preview and is satisfied with:
- Functionality works as expected in preview environment
- UI looks correct in preview environment
- Edge cases are handled
- No obvious bugs
- User has explicitly said "code looks good" or similar

**Only proceed when user explicitly confirms satisfaction after testing in Vercel Preview.**

### 2. Wait for CI/CD Checks

```bash
# Wait for Vercel and SonarCloud
./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}
```

**Monitor:**
- Vercel deployment status
- SonarCloud analysis status

**Once checks complete, immediately fetch SonarCloud issues:**
```bash
# Get detailed SonarCloud analysis
./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}
```

### 3. Analyze SonarCloud Results

**Get SonarCloud issues using helper script:**
```bash
# Fetch detailed SonarCloud issues for the PR
./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}
```

This command will:
- ✅ Fetch coverage percentage on new code
- ✅ Fetch all new issues from SonarCloud for the PR
- ✅ Categorize by severity (BLOCKER, CRITICAL, MAJOR, MINOR, INFO)
- ✅ Categorize by type (BUG, VULNERABILITY, CODE_SMELL, SECURITY_HOTSPOT)
- ✅ Show detailed issue descriptions with file locations and line numbers
- ✅ Show the rule violated for each issue
- ✅ Provide direct link to SonarCloud report
- ✅ Output JSON for programmatic parsing

**Example output:**
```
Coverage on new code: 97.83%

Found 5 New Issues

By Severity:
  🟡 MAJOR: 3
  🟢 MINOR: 2

By Type:
  👃 CODE_SMELL: 5

Detailed Issues:

1. [🟡 MAJOR] [👃 CODE_SMELL]
   Move this component definition out of the parent component and pass data as props.
   📁 app/components/compact-game-view-card.tsx:214
   📋 Rule: typescript:S6478

[... more issues ...]
```

**Interpreting severity levels:**
- BLOCKER (🔴🔴🔴) - Critical issues that block release
- CRITICAL (🔴🔴) - Serious issues that must be fixed
- MAJOR (🟡) - Important issues that should be fixed
- MINOR (🟢) - Minor issues that should be addressed
- INFO (ℹ️) - Informational findings

**Quality Gate Criteria:**
- ✅ **0 new issues** of ANY severity (including MINOR)
- ✅ **80%+ coverage** on new code
- ✅ **Security rating: A**
- ✅ **Maintainability: B or higher**
- ✅ **< 5% duplicated code**

**IMPORTANT:** ALL new issues must be fixed, regardless of severity. Even MINOR code smells must be resolved before merge.

### 4. Handle Quality Gate Failures

**If SonarCloud reports new issues:**

1. **Fetch and present issues to user:**
```bash
./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}
```

2. **Parse and present results:**
```
SonarCloud Quality Gate Failed ❌

Coverage on new code: 97.83%

Found 5 New Issues

By Severity:
  🟡 MAJOR: 3
  🟢 MINOR: 2

By Type:
  👃 CODE_SMELL: 5

Detailed Issues:

1. [🟡 MAJOR] [👃 CODE_SMELL]
   Move this component definition out of the parent component and pass data as props.
   📁 app/components/compact-game-view-card.tsx:214
   📋 Rule: typescript:S6478

2. [🟡 MAJOR] [👃 CODE_SMELL]
   Extract this nested ternary operation into an independent statement.
   📁 app/components/game-countdown-display.tsx:52
   📋 Rule: typescript:S3358

3. [🟢 MINOR] [👃 CODE_SMELL]
   Mark the props of the component as read-only.
   📁 app/components/context-providers/countdown-context-provider.tsx:28
   📋 Rule: typescript:S6759

[... remaining issues ...]

SonarCloud Report: https://sonarcloud.io/project/issues?pullRequest=61&id=gvinokur_qatar-prode&resolved=false

These issues must be resolved before merging.
Would you like me to fix these issues?
```

2. **Wait for user permission:**
   - User says "yes, fix them" → Proceed to fix
   - User says "no, I'll fix manually" → Stop, wait for user
   - User wants specific fixes only → Fix only those

3. **Fix issues (if authorized):**
   - Read the code with issues
   - Apply fixes for each issue
   - Run tests to verify fixes
   - Commit and push
   - Wait for re-analysis

4. **Verify fixes:**
```bash
# Wait for updated SonarCloud check
./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}
```

**If coverage is below 80% on new code:**

1. **Present to user:**
```
Code Coverage Below Threshold ❌

Coverage on new code: 65%
Required: 80%

Files with low coverage:
- app/components/NewFeature.tsx: 45%
- app/utils/helper.ts: 60%

SonarCloud Report: [URL]

Would you like me to add tests to improve coverage?
```

2. **Wait for user permission**
3. **Add tests (if authorized)**
4. **Commit, push, re-validate**

### 9. Validate Vercel Deployment

**Check deployment:**
```bash
# Get Vercel preview URL
gh pr view ${PR_NUMBER} --json statusCheckRollup --jq '.statusCheckRollup[] | select(.name | contains("vercel")) | .targetUrl'
```

**Verify:**
- ✅ Deployment successful
- ✅ Preview URL accessible
- ✅ Application loads without errors

**If deployment fails:**
- Review deployment logs
- Fix build/runtime errors
- Commit, push, re-validate

### 10. Final Quality Gate Confirmation

**Present summary to user:**
```
✅ All Quality Gates Passed!

Build: ✓ Success
Tests: ✓ All passing
SonarCloud: ✓ 0 new issues, 97.83% coverage on new code
Vercel: ✓ Deployed successfully

Preview URL: [URL]
SonarCloud Report: [URL]

Ready to merge PR #${PR_NUMBER}
```

**Commands used:**
```bash
# 1. Wait for checks
./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}

# 2. Get detailed SonarCloud results
./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}

# 3. If all passes, complete story
./scripts/github-projects-helper story complete ${STORY_NUMBER} --project ${PROJECT_NUMBER}
```

## Quality Gate Enforcement

### Zero Tolerance for New Issues

**NO EXCUSES for skipping SonarCloud issues:**
- ❌ "It's just a low severity issue" → Fix it
- ❌ "It's minor code smell" → Fix it
- ❌ "It doesn't affect functionality" → Fix it
- ❌ "We can fix it later" → Fix it now
- ✅ **0 new issues** is the only acceptable outcome

### Common SonarCloud Issues and Fixes

**Code Smells:**
- Function complexity too high → Refactor into smaller functions
- Duplicate code blocks → Extract to shared utility
- Too many parameters → Use options object
- Cognitive complexity → Simplify logic flow

**Bugs:**
- Potential null pointer → Add null checks
- Unused variable → Remove or use it
- Type mismatch → Fix type annotations

**Security:**
- Weak cryptography → Use secure alternatives
- SQL injection risk → Use parameterized queries
- XSS vulnerability → Sanitize user input

**Coverage:**
- Low coverage on new code → Add unit tests
- Uncovered branches → Add test cases for edge cases
- Uncovered lines → Test error paths

## Integration with Workflow

**Validation fits in the overall workflow:**

```
Implementation Complete
         ↓
User: "Code looks good, I'm satisfied"
         ↓
Run Local Tests (npm run test)
         ↓
Run Linter (npm run lint)
         ↓
Build Production (npm run build)
         ↓
Commit & Push
         ↓
Wait for CI/CD Checks
./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}
         ↓
Analyze SonarCloud Results
./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}
         ↓
    ┌─────────────────────┐
    │ Any issues found?   │
    │ Coverage < 80%?     │
    └─────────────────────┘
      ↓              ↓
     YES            NO
      ↓              ↓
  Show issues    ✅ Quality Gates Passed
  Ask permission     ↓
  to fix         Coverage: 97.83%
      ↓          0 new issues
  Fix if             ↓
  approved       Ready to Merge
      ↓              ↓
  Re-run checks      ↓
      ↓              ↓
      └──────────────┘
```

## Best Practices

1. **Never skip validation** - Even if code "looks good"
2. **Use helper script for SonarCloud** - `./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}` provides accurate, detailed results
3. **Fix all issues before merge** - No technical debt, even for MINOR issues
4. **Ask permission to fix** - Don't surprise user with changes
5. **Run tests after fixes** - Ensure fixes don't break anything
6. **Document fixes** - Clear commit messages for what was fixed
7. **Re-validate after fixes** - Wait for SonarCloud re-analysis and run helper script again
8. **Check coverage on new code** - Must be ≥80%, the helper script shows this automatically

## Common Mistakes

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|------------------|
| Auto-fixing issues | User loses context and control | Show issues, ask permission |
| Ignoring low severity | Accumulates technical debt | Fix ALL new issues |
| Validating too early | User hasn't tested yet | Wait for user satisfaction |
| Skipping re-validation | Don't confirm fixes worked | Always re-check after fixes |
| Merging with issues | Fails quality standards | 0 new issues before merge |

## Examples

### Good Flow
```
User: "Code works great, let's get this merged"
Claude: [Runs tests, builds, commits, pushes]
Claude: [Runs ./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}]
Claude: [Runs ./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}]
Claude: "SonarCloud found 3 MAJOR and 2 MINOR code smells:
        - Coverage on new code: 97.83%
        - Issues found in:
          * app/components/compact-game-view-card.tsx:214
          * app/components/game-countdown-display.tsx:52
          * app/components/context-providers/countdown-context-provider.tsx:28,41
          * app/components/game-countdown-display.tsx:27
        Would you like me to fix these issues?"
User: "Yes, fix them"
Claude: [Fixes issues, commits, pushes]
Claude: [Runs ./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}]
Claude: [Runs ./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}]
Claude: "✅ All quality gates passed!
        - Coverage: 98.1%
        - 0 new issues
        Ready to merge."
```

### Bad Flow (DON'T DO THIS)
```
User: "Code works great, let's get this merged"
Claude: [Runs tests, commits, pushes]
Claude: [Checks GitHub status without using helper script]
Claude: "SonarCloud check passed, ready to merge!" ❌
[Doesn't fetch actual issues, misses 5 code smells]
[Issues slip through, technical debt increases]
```

**OR**

```
User: "Code works great, let's get this merged"
Claude: [Runs tests, commits, pushes]
Claude: [Runs ./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}]
Claude: "Found 2 MINOR code smells but they're minor, ready to merge!" ❌
[Ignores quality gate, technical debt increases]
```

**ALWAYS:**
- Use the helper script to get detailed SonarCloud results
- Fix ALL issues regardless of severity
- Wait for re-validation before merging

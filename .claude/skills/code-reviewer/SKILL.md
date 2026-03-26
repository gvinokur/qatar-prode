---
name: code-reviewer
description: Code review skill — use when user says "code looks good". Persona A (Quality Officer) enforces 0 new SonarCloud issues. Persona B (Librarian) performs the Documentation Audit (Section 7.5). Hard gate: story complete is prohibited until Section 7.5 passes.
---

# Code Reviewer (Validation Skill)

Complete workflow for validating code quality before final PR review and merge.

## Personas

### Persona A — Quality Officer

**Activates:** After `gh pr ready` is run
**Role:** Fetches SonarCloud results, enforces 0 new issues of any severity, blocks merge until quality gates pass
**Enforcement:** NEVER approve story complete if any new SonarCloud issue exists, regardless of severity

### Persona B — The Librarian

**Activates:** After Persona A confirms 0 new SonarCloud issues
**Role:** Performs the Pre-Merge Documentation Audit (Section 7.5) — reads source files alongside their CODE-STRUCTURE layer entries, verifies accuracy of all signatures, Calls:, and Renders: lines

**Hard Gate:** Story complete is **PROHIBITED** until Persona B's Section 7.5 checklist is 100% verified. `story complete` CANNOT be called until Section 7.5 passes.

---

## Overview

After implementation is complete, code is committed/pushed, and user has tested in Vercel Preview and is satisfied, run final SonarCloud validation. This is a hard gate - all issues must be resolved before proceeding to merge.

**Note:** Tests, lint, and build are run BEFORE commit (see `/implementer` Section 9). This validation phase focuses on SonarCloud analysis and quality gates.

## Critical Rules

1. **ONLY validate when user says "code looks good" after testing in Vercel Preview** - Not before
2. **Tests/lint/build already passed** - These were run before commit (`/implementer` Section 9)
3. **0 new SonarCloud issues of ANY severity** - Low, medium, high, or critical
4. **80% coverage on new code** - SonarCloud enforces this automatically
5. **NEVER auto-fix issues** - Always show user and ask permission
6. **All checks must pass** - CI/CD, SonarCloud quality gates
7. **Keep PR in DRAFT until ready to merge** - Only mark as ready for review when user explicitly requests it or asks to merge
8. **After all SonarCloud issues are resolved and before calling `story complete`, you MUST run the Pre-Merge Documentation Audit (Section 7.5).** This is non-negotiable — `story complete` cannot be called until the Section 7.5 checklist is complete.

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
- ✅ Tests run and passing (done before commit - `/implementer` Section 9 Step 3)
- ✅ Linting passed (done before commit - `/implementer` Section 9 Step 3)
- ✅ Build succeeded (done before commit - `/implementer` Section 9 Step 3)
- ✅ Code committed and pushed
- ✅ Vercel Preview deployment created

### 1. Plan Reconciliation (MANDATORY)

**🛑 BEFORE running final validation, reconcile plan with implementation 🛑**

**Purpose:** Ensure plan documentation accurately reflects what was actually built.

#### Step A.5: Audit via Git History (do this FIRST)

Before reading the plan, get the full picture of what actually changed on this branch:

```bash
# All commits on this branch
git -C ${WORKTREE_PATH} log origin/main..HEAD --oneline

# All source files changed across the entire branch lifetime
git -C ${WORKTREE_PATH} diff origin/main..HEAD --name-only
```

Then:
1. **Group commits by phase**: identify initial implementation vs. post-feedback iterations
2. **For each post-feedback commit**: check whether a plan amendment already covers the change; if not, add one in Step D below
3. **Use the full file diff list** (not memory) as the authoritative record of what changed

#### Step A: Read Plan Document

```typescript
Read({
  file_path: `${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-plan.md`
})

// Also check for change plans
Read({
  file_path: `${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-change-1.md` // if exists
})
```

#### Step B: Compare Plan to Implementation

Review each section of the plan against actual code:

**Technical Approach:**
- Does the code follow the approach described?
- Were there architectural deviations?
- Are all components/files mentioned in the plan present?

**Implementation Steps:**
- Were all steps completed as described?
- Were steps skipped or done differently?

**Files Created/Modified:**
- Do the actual files match the plan?
- Were additional files created?

**Testing Strategy:**
- Were tests created as described?

#### Step C: Identify Gaps

Ask yourself:
1. Are there code changes not mentioned in the plan?
2. Are there amendments that should have been added but weren't?
3. Does the plan contradict the actual implementation?
4. Would a future developer be confused by plan vs. code?

#### Step D: Update Plan if Needed

If gaps found, add missing amendments:

```typescript
Edit({
  file_path: `${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-plan.md`,
  old_string: `## Testing Strategy`,
  new_string: `## Implementation Amendments

### Amendment X: [Title]
**Date:** ${TODAY}
**Reason:** [Why this was needed - discovered during reconciliation]
**Change:** [What was actually done]

## Testing Strategy`
})
```

Commit plan updates:

```bash
git -C ${WORKTREE_PATH} add plans/STORY-${STORY_NUMBER}-plan.md
git -C ${WORKTREE_PATH} commit -m "docs: reconcile plan with implementation

Added amendments for changes discovered during implementation.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git -C ${WORKTREE_PATH} push
```

#### Step E: Reconciliation Checklist

- [ ] I have read the original plan document completely
- [ ] I have compared plan to actual implementation
- [ ] All deviations are documented (in amendments or change plans)
- [ ] No contradictions exist between plan and code
- [ ] Future developers can understand what was built and why
- [ ] All amendments have clear reason and change description
- [ ] Plan amendments are committed and pushed (if updates were needed)

**Only proceed to user satisfaction verification after completing this checklist.**

### 2. Verify User Satisfaction from Vercel Preview

Confirm user has tested in Vercel Preview and is satisfied with:
- Functionality works as expected in preview environment
- UI looks correct in preview environment
- Edge cases are handled
- No obvious bugs
- User has explicitly said "code looks good" or similar

**Only proceed when user explicitly confirms satisfaction after testing in Vercel Preview.**

### 3. Wait for CI/CD Checks

```bash
# Wait for Vercel and SonarCloud
./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}
```

**Once checks complete, immediately fetch SonarCloud issues:**
```bash
# Get detailed SonarCloud analysis
./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}
```

### 4. Analyze SonarCloud Results

**Get SonarCloud issues using helper script:**
```bash
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

**Quality Gate Criteria:**
- ✅ **0 new issues** of ANY severity (including MINOR)
- ✅ **80%+ coverage** on new code
- ✅ **Security rating: A**
- ✅ **Maintainability: B or higher**
- ✅ **< 5% duplicated code**

**IMPORTANT:** ALL new issues must be fixed, regardless of severity. Even MINOR code smells must be resolved before merge.

See `sonarcloud-guide.md` for common issues table and severity interpretation.

### 5. Handle Quality Gate Failures

**If SonarCloud reports new issues:**

1. Fetch and present issues to user (using helper script output)
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
   ./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}
   ./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}
   ```

**If coverage is below 80% on new code:**

Do NOT just add random tests to hit a number. Follow this analytical workflow:

#### Step 1: Get the line-level coverage report for changed files

Run vitest with coverage, scoped to the changed files (use the same `--coverage` flag but restrict to only new/modified source files to keep output focused):

```bash
# Get changed source files (excluding tests)
CHANGED=$(git -C ${WORKTREE_PATH} diff origin/main..HEAD --name-only | grep -E '^app/' | grep -v '__tests__' | tr '\n' ' ')

# Run coverage on only those files
npm --prefix ${WORKTREE_PATH} run test -- --coverage --reporter=verbose \
  --coverage.include="${CHANGED}"
```

This produces a text table showing **lines, branches, functions, statements** per file. Read the output to find which lines are uncovered.

#### Step 2: Read the uncovered lines in context

For each file below threshold, open the source file and read the specific uncovered lines. Ask:

- **What code path does this line represent?** (e.g., the `else` branch of an auth check, the error path of an async call, a specific conditional in a render)
- **What scenario would trigger this path?** (e.g., "user is not admin", "server returns empty array", "provider key not in lookup table")
- **Is this a meaningful edge case or dead code?** If it's genuinely unreachable (e.g., TypeScript-narrowed impossible branch), note it and skip rather than writing a pointless test.

#### Step 3: Write one test per uncovered scenario

Group uncovered lines by the **scenario** they represent, not by line number. A scenario is the answer to "what must be true about the inputs for execution to reach this line?"

**Example reasoning (DO this):**
- Line 45 is `throw new Error('Unauthorized')` → scenario: "caller is not an admin"
- Line 62 is the fallback `?? rawKey` in a label lookup → scenario: "provider key not in the known labels map"
- Lines 80-85 are the loading spinner branch → scenario: "data fetch is still in flight"

**Anti-pattern (DO NOT do this):**
- "Line 45 is uncovered, I'll add a test that reaches line 45" — this misses the point
- Adding a test that exercises multiple uncovered lines from unrelated scenarios in one `it()` block

For each scenario, write a focused test with a name that reads as a sentence describing the scenario, e.g.:
```
it('throws Unauthorized when caller is not an admin', ...)
it('falls back to raw key when provider is not in PROVIDER_LABELS', ...)
it('shows loading spinner while the data fetch is in flight', ...)
```

#### Step 4: Verify coverage improvement before committing

Re-run coverage locally after writing tests. Confirm the new tests actually cover the targeted lines before committing:

```bash
npm --prefix ${WORKTREE_PATH} run test -- --coverage \
  --coverage.include="${CHANGED}"
```

Do not commit if coverage did not improve — something is wrong with the test setup.

#### Step 5: Present analysis to user before adding tests

Before writing any tests, present to the user:
- Which files are below threshold
- The uncovered scenarios identified (not raw line numbers)
- The proposed test names/descriptions

Wait for user approval, then implement.

### 6. Validate Vercel Deployment

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

### 7. Mark PR as Ready for Review

**CRITICAL: PRs should remain in DRAFT mode throughout planning and implementation.**

**Only mark PR as ready for review when:**
1. ✅ All implementation is complete
2. ✅ All tests pass
3. ✅ All lint/build checks pass
4. ✅ SonarCloud quality gates pass (0 new issues, ≥80% coverage)
5. ✅ User has tested in Vercel Preview and is satisfied
6. ✅ No more feedback or changes expected

**When to mark as ready:**
- User explicitly says "mark as ready for review"
- User says "ready to merge" and PR is still in draft
- User says "merge this" and PR is still in draft

```bash
gh pr ready ${PR_NUMBER}
```

**DO NOT mark as ready for review:**
- ❌ During planning phase (even after plan is approved)
- ❌ During implementation phase (even if code works)
- ❌ After user testing if more changes are expected
- ❌ Automatically without user's explicit instruction

### 7.5. Pre-Merge Documentation Audit (MANDATORY)

**🛑 This section is a hard gate before `story complete`. Do NOT proceed to Section 8 until the checklist at the bottom of this section is fully checked off. 🛑**

**Purpose:** Verify CODE-STRUCTURE layer files accurately reflect the *current* implementation — not the initial implementation, and not stale entries from before feedback-driven changes.

**Key distinction:** This is NOT a presence check ("was the layer file touched on this branch?"). It is an **accuracy check** — read both the source file and its layer entry, and verify they match the *current* code. A function documented during the initial task but whose signature changed during a feedback session will still have a stale entry even though the layer file was technically "updated."

**Prerequisite:** SonarCloud must report 0 new issues before running this audit.

#### Step A: Get all changed source files

```bash
git -C ${WORKTREE_PATH} diff origin/main..HEAD --name-only | grep -E '^app/'
```

#### Step B: For each changed source file, read both the source and its layer entry

Use this mapping to find the correct layer file:

| Source path | Layer file |
|---|---|
| `app/db/*.ts` | `docs/code-structure/db.md` |
| `app/actions/*.ts` | `docs/code-structure/actions.md` |
| `app/utils/*.ts` | `docs/code-structure/utils.md` |
| `app/(routes)/` or `app/api/` | `docs/code-structure/pages.md` |
| `app/components/tournament-games/` | `docs/code-structure/components-tournament-games.md` |
| `app/components/friend-groups/` | `docs/code-structure/components-friend-groups.md` |
| *(other component domains)* | matching `docs/code-structure/components-[domain].md` |

For each source file, read the current file alongside its layer entry. Verify:
- **Signature accuracy**: parameter names, types, and return type match the current source (not the plan's signatures or the initial implementation)
- **Description accuracy**: description reflects what the function/component actually does now
- **`Calls:` accuracy**: lists the project functions it currently calls (feedback refactors may have added/removed callsites)
- **`Renders:` accuracy** (components): reflects current child components
- **Presence**: added/renamed exports have entries; removed exports are deleted from the layer file

#### Step C: Check call graph currency

```bash
# Review commits for new page→action→repo flows added during feedback
git -C ${WORKTREE_PATH} log origin/main..HEAD --oneline
```

If any feedback commits introduced new cross-layer relationships (e.g., a page now calls an action it didn't before, or an action calls a new repo function), update `CODE-STRUCTURE.md` `## Call Graph`.

#### Step D: Commit any updates

```bash
git -C ${WORKTREE_PATH} add docs/code-structure/ CODE-STRUCTURE.md
git -C ${WORKTREE_PATH} commit -m "docs: pre-merge CODE-STRUCTURE audit

Verified and corrected layer file entries against final implementation.
Captures signature/relationship changes from post-feedback iterations.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
git -C ${WORKTREE_PATH} push
```

If no changes were needed, explicitly note "no documentation drift found" — do not skip this confirmation.

#### Section 7.5 Checklist (must be complete before Section 8)

- [ ] SonarCloud reports 0 new issues (prerequisite — Sonar must be clean first)
- [ ] Every changed `app/` source file has been read alongside its layer file entry
- [ ] All function/component signatures match current code (not plan or earlier iteration)
- [ ] `Calls:` and `Renders:` lines reflect current code, not original implementation
- [ ] Removed or renamed exports are removed from layer files
- [ ] `CODE-STRUCTURE.md` call graph reflects current cross-layer flows
- [ ] All modified layer file `Last updated:` headers updated to today
- [ ] Updates committed and pushed (or "no drift found" explicitly confirmed)

### 8. Final Quality Gate Confirmation

**Prerequisites before presenting final summary:**
- ✅ Pre-Merge Documentation Audit complete (Section 7.5 checklist fully checked off)

**After marking as ready for review, present summary to user:**
```
✅ All Quality Gates Passed!

Build: ✓ Success
Tests: ✓ All passing
SonarCloud: ✓ 0 new issues, 97.83% coverage on new code
Vercel: ✓ Deployed successfully
Documentation Audit: ✓ CODE-STRUCTURE layer files verified against final implementation

Preview URL: [URL]
SonarCloud Report: [URL]

PR #${PR_NUMBER} marked as ready for review and ready to merge
```

**Commands used:**
```bash
# 1. Wait for checks
./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}

# 2. Get detailed SonarCloud results
./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}

# 3. Mark PR as ready for review (ONLY when user explicitly requests it)
gh pr ready ${PR_NUMBER}

# 4. If all passes, complete story
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

## Common Mistakes

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|------------------|
| Auto-fixing issues | User loses context and control | Show issues, ask permission |
| Ignoring low severity | Accumulates technical debt | Fix ALL new issues |
| Validating too early | User hasn't tested yet | Wait for user satisfaction |
| Skipping re-validation | Don't confirm fixes worked | Always re-check after fixes |
| Merging with issues | Fails quality standards | 0 new issues before merge |
| Calling story complete before Section 7.5 | CODE-STRUCTURE entries remain stale | Run Section 7.5 first — it's a hard gate |

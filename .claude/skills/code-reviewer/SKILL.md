---
name: code-reviewer
description: Code review skill — use when user says "code looks good". Persona A (Quality Officer) enforces 0 new SonarCloud issues. Persona B (Librarian) performs the Documentation Audit (Section 7.5). Hard gate: story complete is prohibited until Section 7.5 passes.
context: inline
---

# Code Reviewer (Validation Skill)

Complete workflow for validating code quality before final PR review and merge.

## Step 0: Read Story Context File (MANDATORY)

**First action before anything else:**

```typescript
// Find and read the context file
const contextFile = `${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-context.md`
Read({ file_path: contextFile })
```

Extract from the context file:
- `STORY_NUMBER` — the story being reviewed
- `WORKTREE_PATH` — absolute path to the story's worktree
- `PR_NUMBER` — the PR to review

**If you don't know WORKTREE_PATH or STORY_NUMBER yet** (fresh session after `/compact` or `/clear`):
```bash
# Find the context file from the most recent story worktree
ls /Users/gvinokur/Personal/qatar-prode-story-*/plans/STORY-*-context.md 2>/dev/null | tail -1
```
Read that file to bootstrap your session.

**Why this matters:** After a `/compact` or `/clear`, conversation history is gone. The context file is the single source of truth for story metadata.

---

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

**Prerequisite:** PR must already be marked as ready (Section 7 must have run). SonarCloud does not run on draft PRs.

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

**CRITICAL: This step runs IMMEDIATELY when "code looks good" is received — BEFORE waiting for CI/CD (Section 3). SonarCloud only runs on non-draft PRs, so this must come first.**

**Trigger:** User says "code looks good" / "I'm satisfied" / "looks good in preview" (any phrase from the "When to Run Validation" section above).

**Action:** Run immediately after confirming user satisfaction (Section 2):
```bash
gh pr ready ${PR_NUMBER}
```

This removes the DRAFT status, which triggers SonarCloud analysis. Then proceed to Section 3 (Wait for CI/CD).

**DO NOT mark as ready for review:**
- ❌ During planning phase
- ❌ During implementation phase
- ❌ Before user has tested in Vercel Preview
- ❌ When user is still iterating on functionality

### 7.5. Pre-Merge Documentation Audit (MANDATORY)

**🛑 This section is a hard gate before `story complete`. Do NOT proceed to Section 8 until the checklist at the bottom of this section is fully checked off. 🛑**

**Purpose:** Verify CODE-STRUCTURE layer files accurately reflect the *current* implementation — not the initial implementation, and not stale entries from before feedback-driven changes.

**Key distinction:** This is NOT a presence check ("was the layer file touched on this branch?"). It is an **accuracy check** — read both the source file and its layer entry, and verify they match the *current* code. A function documented during the initial task but whose signature changed during a feedback session will still have a stale entry even though the layer file was technically "updated."

**Prerequisite:** SonarCloud must report 0 new issues before running this audit.

#### Step A: Get all changed source files

```bash
git -C ${WORKTREE_PATH} diff origin/main..HEAD --name-only | grep -E '^app/'
```

#### Step B: Delegate accuracy audit to Gemini Librarian

Collect all inputs and pass them to Gemini — it scans all changed files in a single call and identifies every instance of drift.

```bash
PROJECT_ROOT=$(git worktree list --porcelain | head -1 | sed 's/^worktree //')
CHANGED_FILES=$(git -C ${WORKTREE_PATH} diff origin/main..HEAD --name-only | grep -E '^app/')
SOURCE_CONTENTS=$(for f in ${CHANGED_FILES}; do
  echo "=== ${f} ==="
  cat ${WORKTREE_PATH}/${f}
done)
COMMIT_LOG=$(git -C ${WORKTREE_PATH} log origin/main..HEAD --oneline)
LAYER_CONTENTS=$(cat ${WORKTREE_PATH}/docs/code-structure/db.md \
                 ${WORKTREE_PATH}/docs/code-structure/actions.md \
                 ${WORKTREE_PATH}/docs/code-structure/utils.md \
                 ${WORKTREE_PATH}/docs/code-structure/pages.md \
                 ${WORKTREE_PATH}/docs/code-structure/components/*.md)

gemini --yolo -m gemini-2.5-flash -o json -p "$(cat ${PROJECT_ROOT}/.ai/agents/librarian-agent.md)

---
CHANGED_FILES:
${CHANGED_FILES}

SOURCE_CONTENTS:
${SOURCE_CONTENTS}

LAYER_FILE_CONTENTS:
${LAYER_CONTENTS}

COMMIT_LOG:
${COMMIT_LOG}
" > /tmp/gemini-story-${STORY_NUMBER}-audit-1.json
python3 -c "\
import json, re, sys
content = open(sys.argv[1]).read()
for m in re.finditer(r'\\{', content):
    try:
        obj = json.loads(content[m.start():])
        if 'session_id' in obj:
            open(sys.argv[1], 'w').write(json.dumps(obj))
            break
    except: pass
" /tmp/gemini-story-${STORY_NUMBER}-audit-1.json

SESSION_ID=$(jq -r '.session_id' /tmp/gemini-story-${STORY_NUMBER}-audit-1.json)
AUDIT_RESULT=$(jq -r '.response'  /tmp/gemini-story-${STORY_NUMBER}-audit-1.json)
```

Read `AUDIT_RESULT`:
- If verdict is **`DRIFT FOUND`**: apply each correction listed in the Drift Found section directly to the layer files using Edit tool
- If verdict is **`CLEAN`**: note it explicitly — "Gemini Librarian: no documentation drift found"

#### Quality Assessment

Apply the **Quality Assessment Loop** (see `/gemini`). Expected output sections for this agent:
- Files Audited list
- Drift Found (with specific corrections) or CLEAN verdict
- Call Graph Assessment (YES/NO with description)

If any section is missing:
```bash
SESSION_ID=$(jq -r '.session_id' /tmp/gemini-story-${STORY_NUMBER}-audit-1.json)
gemini --yolo -m gemini-2.5-flash --resume-chat ${SESSION_ID} -o json \
  -p "The response is missing [section]. Please provide it." \
  > /tmp/gemini-story-${STORY_NUMBER}-audit-2.json
python3 -c "\
import json, re, sys
content = open(sys.argv[1]).read()
for m in re.finditer(r'\\{', content):
    try:
        obj = json.loads(content[m.start():])
        if 'session_id' in obj:
            open(sys.argv[1], 'w').write(json.dumps(obj))
            break
    except: pass
" /tmp/gemini-story-${STORY_NUMBER}-audit-2.json
AUDIT_RESULT=$(jq -r '.response' /tmp/gemini-story-${STORY_NUMBER}-audit-2.json)
```
Maximum 2 follow-up attempts.

#### Step C: Apply call graph updates if flagged

If Gemini's **Call Graph Assessment** says YES, update `CODE-STRUCTURE.md` `## Call Graph` with the new flows identified.

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

#### Re-audit path

After applying drift corrections from a DRIFT FOUND verdict, verify accuracy by resuming the session with only the updated layer file entries — no need to re-send all source files:

```bash
SESSION_ID=$(jq -r '.session_id' /tmp/gemini-story-${STORY_NUMBER}-audit-1.json)
gemini --yolo -m gemini-2.5-flash --resume-chat ${SESSION_ID} -o json \
  -p "Here are the updated layer file entries after corrections were applied:

[paste only the modified entries]

Do these corrections now accurately reflect the source code? Are there any remaining drift issues?" \
  > /tmp/gemini-story-${STORY_NUMBER}-audit-2.json
python3 -c "\
import json, re, sys
content = open(sys.argv[1]).read()
for m in re.finditer(r'\\{', content):
    try:
        obj = json.loads(content[m.start():])
        if 'session_id' in obj:
            open(sys.argv[1], 'w').write(json.dumps(obj))
            break
    except: pass
" /tmp/gemini-story-${STORY_NUMBER}-audit-2.json
AUDIT_RESULT=$(jq -r '.response' /tmp/gemini-story-${STORY_NUMBER}-audit-2.json)
```

Only proceed to the checklist below once the re-audit confirms CLEAN or all remaining issues are explicitly noted.

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

**Present this summary to the user and STOP.** Fill in real values — do not use placeholder text:

```
## Validation Summary — Story #${STORY_NUMBER}

### Pre-Merge Checks
| Check | Status | Details |
|-------|--------|---------|
| Tests | ✓ Pass | [N] tests passing |
| Lint | ✓ Pass | No lint errors |
| Build | ✓ Pass | Build succeeded |

### CI/CD
| Check | Status | Details |
|-------|--------|---------|
| Vercel | ✓ Deployed | [preview URL] |
| SonarCloud | ✓ Pass | 0 new issues, [X]% coverage on new code |

### Documentation Audit (Section 7.5)
| Check | Status | Details |
|-------|--------|---------|
| CODE-STRUCTURE drift | ✓ Clean | [or: X corrections applied] |
| Call graph | ✓ Up to date | [or: updated] |

### Plan Reconciliation
| Check | Status | Details |
|-------|--------|---------|
| Plan vs. implementation | ✓ Aligned | [or: N amendments added] |

SonarCloud report: [URL]
PR: #${PR_NUMBER} — [PR URL]
```

**🛑 STOP HERE. DO NOT PROCEED FURTHER. 🛑**

After presenting the summary above, WAIT for the user. Do not run any additional commands.

**What you MUST NOT do after presenting the summary:**
- ❌ Do NOT run `story complete` — only run when user explicitly says "merge", "complete the story", or similar
- ❌ Do NOT ask "would you like me to merge?" or "shall I complete the story?"
- ❌ Do NOT suggest next steps that imply proceeding

**To merge:** Wait for user to explicitly say "merge" / "merge this" / "complete the story" / "story complete", then run via `/git-ops` Section 4:
```bash
# Complete story (merge + cleanup) — ONLY on explicit user request
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

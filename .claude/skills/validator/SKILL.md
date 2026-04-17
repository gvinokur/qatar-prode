---
name: validator
description: Quality analysis skill — invoke when user says "check quality gates" or "sonar results". Fetches SonarCloud issues, writes human-readable explanation to tmp/sonar-explanation.md, presents findings, and awaits user authorization before fixing anything.
context: fork
agent: general-purpose
---

# Validator (Quality Analysis Skill)

## Step 0: Read Story Context File (MANDATORY)

**First action before anything else:**

```typescript
const contextFile = `${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-context.md`
Read({ file_path: contextFile })
```

Extract from the context file:
- `STORY_NUMBER` — used in output file naming
- `PR_NUMBER` — used to fetch SonarCloud results
- `WORKTREE_PATH` — used for project root resolution

**If you don't know these values** (fresh session after `/compact` or `/clear`):
```bash
ls /Users/gvinokur/Personal/qatar-prode-story-*/plans/STORY-*-context.md 2>/dev/null | tail -1
```
Read that file to bootstrap your session.

---

## When to Invoke

- User says "check quality gates" / "sonar results" / "show me the issues"
- Called from within `/code-reviewer` Section 4 after CI checks complete
- After pushing a fix to verify the gate now passes

---

## Step 1: Fetch Raw SonarCloud Output

```bash
SONAR_OUTPUT=$(./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER})
echo "${SONAR_OUTPUT}"
```

---

## Step 2: Analyze and Write Explanation

Read and analyze the SonarCloud output. Write a structured explanation to `tmp/sonar-explanation.md`:

```bash
PROJECT_ROOT=$(git worktree list --porcelain | head -1 | sed 's/^worktree //')
mkdir -p ${PROJECT_ROOT}/tmp
```

Write `${PROJECT_ROOT}/tmp/sonar-explanation.md` with:
- **Quality Gate status**: PASS or FAIL
- **Coverage metrics**: new code coverage %
- **Issues by severity**: for each issue — file, line, rule, description, and a concrete fix suggestion

---

## Step 3: Present Explanation

Read `tmp/sonar-explanation.md` and present the full contents to the user.

---

## Step 4: Await Authorization

**NEVER auto-fix.** Always present issues first, then wait for explicit user instruction.

| User says | Action |
|-----------|--------|
| "yes, fix them" | Proceed to Step 5 |
| "fix only [X]" | Fix only the specified issues |
| "no" / "I'll handle it" | Stop here, do nothing |

---

## Step 5: Apply Fixes (If Authorized)

Follow the fix workflow from `/code-reviewer` Section 5:
- Read the file with the issue
- Apply the fix
- Run tests to verify: `npm --prefix ${WORKTREE_PATH} run test`
- Commit and push

Apply issues in priority order (BLOCKER → CRITICAL → MAJOR → MINOR).

---

## Step 6: Re-Validate

After fixes are committed and pushed:

```bash
./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}
SONAR_OUTPUT=$(./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER})
```

Re-analyze the new output and update `tmp/sonar-explanation.md`. Loop back to **Step 3** (re-present the updated explanation). Re-run until Quality Gate shows **PASS**.

---

## Notes

- `tmp/` is gitignored — `sonar-explanation.md` is ephemeral, regenerated each run
- If `tmp/` is not yet in `.gitignore`, add it before the first run

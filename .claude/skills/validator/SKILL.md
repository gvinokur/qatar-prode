---
name: validator
description: Quality analysis skill — invoke when user says "check quality gates" or "sonar results". Fetches SonarCloud issues, delegates to Gemini Explainer agent, writes human-readable explanation to tmp/sonar-explanation.md, presents findings, and awaits user authorization before fixing anything.
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
- `STORY_NUMBER` — used in Gemini output file naming (`/tmp/gemini-story-${STORY_NUMBER}-sonar-1.json`)
- `PR_NUMBER` — used to fetch SonarCloud results
- `WORKTREE_PATH` — used for `PROJECT_ROOT` resolution

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
```

---

## Step 2: Delegate to Gemini Explainer

```bash
PROJECT_ROOT=$(git worktree list --porcelain | head -1 | sed 's/^worktree //')
mkdir -p ${PROJECT_ROOT}/tmp

gemini --yolo -m gemini-2.5-flash -o json -p "$(cat ${PROJECT_ROOT}/.ai/agents/explainer-agent.md)

---
PR_NUMBER: ${PR_NUMBER}
SONAR_OUTPUT:
${SONAR_OUTPUT}
COVERAGE_THRESHOLD: 80
" > /tmp/gemini-story-${STORY_NUMBER}-sonar-1.json
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
" /tmp/gemini-story-${STORY_NUMBER}-sonar-1.json

SESSION_ID=$(jq -r '.session_id' /tmp/gemini-story-${STORY_NUMBER}-sonar-1.json)
jq -r '.response' /tmp/gemini-story-${STORY_NUMBER}-sonar-1.json > ${PROJECT_ROOT}/tmp/sonar-explanation.md
```

---

## Step 2.5: Quality Assessment

Apply the **Quality Assessment Loop** (see `/gemini`). Expected sections in `tmp/sonar-explanation.md`:
- Quality Gate status (PASS/FAIL)
- Coverage metrics
- Issues by Severity, each with a concrete fix suggestion

If any issue lacks a concrete fix suggestion:
```bash
SESSION_ID=$(jq -r '.session_id' /tmp/gemini-story-${STORY_NUMBER}-sonar-1.json)
gemini --yolo -m gemini-2.5-flash --resume-chat ${SESSION_ID} -o json \
  -p "The following issues lack concrete fix suggestions: [list them]. Please provide specific fix guidance for each." \
  > /tmp/gemini-story-${STORY_NUMBER}-sonar-2.json
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
" /tmp/gemini-story-${STORY_NUMBER}-sonar-2.json
jq -r '.response' /tmp/gemini-story-${STORY_NUMBER}-sonar-2.json > ${PROJECT_ROOT}/tmp/sonar-explanation.md
```
Maximum 2 follow-up attempts.

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

Apply issues in the priority order from `tmp/sonar-explanation.md`.

---

## Step 6: Re-Validate

After fixes are committed and pushed:

```bash
./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}
```

Then fetch the new sonar output and resume the existing session — do not re-run from Step 1:

```bash
SONAR_OUTPUT=$(./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER})
SESSION_ID=$(jq -r '.session_id' /tmp/gemini-story-${STORY_NUMBER}-sonar-1.json)

gemini --yolo -m gemini-2.5-flash --resume-chat ${SESSION_ID} -o json \
  -p "Here is the updated SonarCloud output after fixes were applied:

${SONAR_OUTPUT}

Identify which issues remain, which were resolved, and update your analysis. Provide fix suggestions for any remaining issues." \
  > /tmp/gemini-story-${STORY_NUMBER}-sonar-2.json
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
" /tmp/gemini-story-${STORY_NUMBER}-sonar-2.json
jq -r '.response' /tmp/gemini-story-${STORY_NUMBER}-sonar-2.json > ${PROJECT_ROOT}/tmp/sonar-explanation.md
```

Then loop back to **Step 3** (re-present the updated explanation). Re-run until Quality Gate shows **PASS**.

---

## Notes

- `tmp/` is gitignored — `sonar-explanation.md` is ephemeral, regenerated each run
- If `tmp/` is not yet in `.gitignore`, add it before the first run
- Gemini requires `.gemini/GEMINI.md` to exist at the project root
- `PROJECT_ROOT` resolves portably via `git worktree list` — works from any worktree

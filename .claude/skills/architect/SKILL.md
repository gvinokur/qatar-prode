---
name: architect
description: Planning phase skill — use when implementing a story. Covers context gathering, ASCII prototyping, creating /plans/STORY-N-plan.md, plan review via /plan-reviewer, and committing via /git-ops. Key guardrail: NEVER exit plan mode until user says "execute the plan".
---

# Architect (Planning Skill)

Complete workflow for planning story implementation before writing code.

## Overview

Every story must go through a planning phase before implementation. The plan is committed and reviewed via PR to ensure alignment and gather feedback before coding begins.

## Critical Rules

1. **ALWAYS create plan** at `/plans/STORY-{N}-plan.md` before coding
2. **ALWAYS run plan review subagent** for 2-3 cycles until "no significant concerns" — invoke `/plan-reviewer`
3. **ALWAYS commit plan and create PR** using a Bash subagent (stay in plan mode) — use `/git-ops` Section 1
4. **NEVER EXIT PLAN MODE** until user says "execute the plan"
5. **USE SUBAGENTS FOR GIT OPERATIONS** - Launch Bash subagent to commit/push (you stay in plan mode)
6. **EXIT PLAN MODE = START IMPLEMENTATION** - Clear, unambiguous rule
7. **ITERATE on feedback** - Update plan, use subagent to commit, stay in plan mode

## CRITICAL: NEVER Exit Plan Mode Until "Execute the Plan"

**The Rule:**
- **STAY IN PLAN MODE** from start to finish of planning phase
- **NEVER exit** until user says "execute the plan"
- Use **subagents for git operations** (commit, push, create PR)
- Subagents can run Bash while you stay in plan mode

**Why this approach:**
- Eliminates confusion between "temporary" and "final" exits
- Clear rule: **Exit plan mode = start implementation**
- No risk of accidentally starting to code after a commit

**How to commit while in plan mode:**
- Launch a Bash subagent to run git commands
- You stay in plan mode
- Subagent does: add, commit, push, create PR
- Subagent completes, you're still in plan mode

**The ONLY time you exit plan mode:**
- User explicitly says "execute the plan"
- This is your signal to start implementation
- Exit once = done planning forever (for this story)

## Tool Commitment Checklist

**Before proceeding, acknowledge you WILL use these tools during planning:**

**Required tools (non-negotiable):**
- [ ] **Write tool** - to create plan file at `plans/STORY-N-plan.md` (not just think about it)
- [ ] **Task tool with subagent_type: "general-purpose"** - for Plan Reviewer via `/plan-reviewer` (2-3 cycles)
- [ ] **Task tool with subagent_type: "general-purpose"** - for ALL git operations (commit, push, PR creation) via `/git-ops` Section 1

**These tools are MANDATORY. If you skip any tool, you've violated the workflow.**

---

## Complete Planning Workflow

### 0. Read This Guide First (MANDATORY)

**This is the complete planning workflow. You are reading it now.**

**This project's planning workflow (uses specific tools):**
- Think through the plan → **WRITE to file** (required)
- **LAUNCH Plan Reviewer subagent** via `/plan-reviewer` (required)
- **LAUNCH Bash subagent** to commit and create PR via `/git-ops` Section 1 (required)
- User reviews PR → Provides feedback or approves
- Start coding

**If you follow standard Claude planning, you've failed this project's requirements.**

---

### 1. Enter Plan Mode

Use the EnterPlanMode tool to transition into planning mode:

```typescript
// This gives you access to exploration tools without code editing
EnterPlanMode()
```

### 2. Research & Gather Context

**Read CODE-STRUCTURE.md first:**

Before exploring individual files, read `CODE-STRUCTURE.md` (the index + call graph) to
understand the overall structure and identify which layer files to read next.

```typescript
Read({
  file_path: `${WORKTREE_PATH}/CODE-STRUCTURE.md`
})
```

**Then read the relevant layer files** based on what the story touches:

| Story touches... | Read... |
|-----------------|---------|
| Data access / DB queries | `docs/code-structure/db.md` |
| Business logic / mutations | `docs/code-structure/actions.md` |
| Utility / calculation logic | `docs/code-structure/utils.md` |
| Page routes / layouts | `docs/code-structure/pages.md` |
| UI components | one or more `docs/code-structure/components/components-[domain].md` — read whichever domains are relevant |

As you read, note which existing functions you'll call from new code. These will go in the `Calls:` lines of your Mid-Level Design.

**Read story details:**
```bash
# Fetch full issue details
gh issue view ${STORY_NUMBER} --json number,title,body,labels,milestone,projectItems

# If linked to epic, fetch epic details
gh issue view <EPIC_NUMBER> --json body

# If part of milestone, fetch milestone description
gh api repos/{owner}/{repo}/milestones/<milestone_number> --jq '.description'
```

**Explore codebase:**
- Use Glob to find relevant files
- Use Grep to search for patterns
- Use Read to understand existing implementations
- Identify files that need to be created or modified

**Clarify requirements:**
- Use AskUserQuestion tool for ambiguities
- Confirm technical approach options
- Validate assumptions
- Get decisions on implementation choices

### 2.5. Delegate Analysis to Gemini Architect (MANDATORY before drafting plan)

After gathering context in Step 2, call Gemini to produce the Story Definition + File Impact Map + Mid-Level Design scaffold. **Do this before writing a single line of the plan document.**

```bash
PROJECT_ROOT=$(git worktree list --porcelain | head -1 | sed 's/^worktree //')
STORY_CONTENT=$(gh issue view ${STORY_NUMBER} --json number,title,body --jq '.body')
CODE_STRUCTURE=$(cat ${WORKTREE_PATH}/CODE-STRUCTURE.md)
# Read the layer files relevant to this story's domain
LAYER_FILES=$(cat ${WORKTREE_PATH}/docs/code-structure/actions.md \
              ${WORKTREE_PATH}/docs/code-structure/db.md)

gemini --yolo -m gemini-2.5-flash -o json -p "$(cat ${PROJECT_ROOT}/.ai/agents/architect-agent.md)

---
STORY_CONTENT:
${STORY_CONTENT}

CODE_STRUCTURE:
${CODE_STRUCTURE}

RELEVANT_LAYER_FILES:
${LAYER_FILES}
" > /tmp/gemini-story-${STORY_NUMBER}-architect-1.json
# Note: this call can take 3-5 minutes for large codebases — use timeout: 300000 in Bash tool

# Strip MCP warning prefix (e.g. "MCP issues detected...{") before parsing JSON
sed -i 's/^[^{]*//' /tmp/gemini-story-${STORY_NUMBER}-architect-1.json

SESSION_ID=$(jq -r '.session_id' /tmp/gemini-story-${STORY_NUMBER}-architect-1.json)
GEMINI_DRAFT=$(jq -r '.response'  /tmp/gemini-story-${STORY_NUMBER}-architect-1.json)
```

**Adjust `LAYER_FILES`** based on what the story touches (add components, utils, pages layer files if relevant).

`GEMINI_DRAFT` will contain:
- **Story Definition** (Objective, Acceptance Criteria, Out of Scope)
- **File Impact Map** (files to create/modify, layers, notes)
- **Architecture Concerns** (risks and constraints)
- **Mid-Level Design Scaffold** (function signatures using real types, Calls:, test scenarios)
- **Call Graph Changes** (YES/NO + description)

#### Quality Assessment

Apply the **Quality Assessment Loop** (see `/gemini`). Expected output sections for this agent:
- Story Definition (Objective, Acceptance Criteria, Out of Scope)
- File Impact Map
- Architecture Concerns
- Mid-Level Design Scaffold
- Call Graph Changes

If any section is missing or vague, resume with:
```bash
SESSION_ID=$(jq -r '.session_id' /tmp/gemini-story-${STORY_NUMBER}-architect-1.json)
gemini --yolo -m gemini-2.5-flash --resume-chat ${SESSION_ID} -o json \
  -p "The response is missing [section]. Please provide it." \
  > /tmp/gemini-story-${STORY_NUMBER}-architect-2.json
sed -i 's/^[^{]*//' /tmp/gemini-story-${STORY_NUMBER}-architect-2.json
GEMINI_DRAFT=$(jq -r '.response' /tmp/gemini-story-${STORY_NUMBER}-architect-2.json)
```
Maximum 2 follow-up attempts. If still incomplete, proceed and note the gap.

Use `GEMINI_DRAFT` as the starting scaffold for the plan. Claude's job is to:
1. Validate the analysis against the actual code (Gemini may occasionally miss context)
2. Add Visual Prototypes (Step 3.1) if UI changes are involved — Gemini doesn't write HTML
3. Add Testing Strategy and Validation Considerations sections
4. Add any clarifications from `AskUserQuestion` rounds

### 3. Create Plan Document

Create the plan at `plans/STORY-{N}-plan.md` in the story worktree.

**Location:**
```bash
PLAN_FILE="${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-plan.md"
```

**Use the plan template from `/architect` `plan-template.md`** - it includes:
- Story context and objectives
- Acceptance criteria
- Technical approach
- Files to create/modify
- Mid-Level Design (see Step 3.2 below)
- Implementation steps
- Testing strategy (must include unit tests)
- Validation considerations (SonarCloud requirements, quality gates)
- **Visual prototypes** (if UI changes - see below)
- Open questions

### 3.1. Visual Prototypes (MANDATORY for UI Changes)

**When UI changes are involved, you MUST create visual prototypes.**

**Determine if prototypes are needed:**
- ✅ New UI components
- ✅ Changes to existing UI
- ✅ Layout modifications
- ✅ New pages or views
- ✅ Form designs
- ✅ User interactions
- ❌ Backend-only changes
- ❌ Database schema changes (no UI)
- ❌ API endpoints (no UI)

**How to create prototypes:**

1. **Describe the visual design in detail:**
   ```markdown
   ## Visual Prototype

   ### Component: User Profile Form

   **Layout:**
   - Two-column form layout
   - Left column: Avatar upload with preview (120x120px circle)
   - Right column: Form fields

   **Fields:**
   - Name (text input, required)
   - Email (email input, required, read-only)
   - Bio (textarea, optional, max 500 chars)
   - Location (text input, optional)

   **Actions:**
   - Save button (primary, bottom right)
   - Cancel button (secondary, bottom right)

   **Validation:**
   - Inline errors below fields
   - Red border on invalid fields
   - Success toast on save
   ```

2. **Use ASCII diagrams for layout:**
   ```
   ┌─────────────────────────────────────┐
   │         User Profile Form           │
   ├─────────────┬───────────────────────┤
   │             │                       │
   │   [Avatar]  │  Name: [________]     │
   │    Upload   │                       │
   │             │  Email: [________]    │
   │             │  (read-only)          │
   │             │                       │
   │             │  Bio:                 │
   │             │  [________________]   │
   │             │  [________________]   │
   │             │                       │
   │             │  Location: [______]   │
   │             │                       │
   │             │      [Cancel] [Save]  │
   └─────────────┴───────────────────────┘
   ```

3. **Reference existing patterns:**
   ```markdown
   **Similar to:** GameCard component layout
   **Material-UI components:**
   - TextField for inputs
   - Button for actions
   - Avatar for profile picture
   - Paper for container
   ```

4. **Show state variations:**
   ```markdown
   **States:**
   - Loading: Show skeleton loaders for fields
   - Error: Display error message banner
   - Success: Show success toast and disable form
   - Editing: All fields enabled except email
   ```

**Include in plan document:**
Add a "Visual Prototypes" section after "Technical Approach" with:
- Detailed descriptions
- ASCII diagrams
- Component references
- State variations
- Responsive considerations (mobile, tablet, desktop)

**Why this is critical:**
- Ensures alignment on UI before coding
- Catches UX issues early
- User can approve design before implementation
- Reduces back-and-forth during implementation

---

### 3.2. Mid-Level Design (MANDATORY for all stories with code changes)

A function-by-function specification of every new or significantly changed function, server action, component, and utility. Uses the same format as `CODE-STRUCTURE.md` — **read `docs/claude/code-structure.md` for the complete format rules and examples** before writing this section.

**Why it matters:**
- Tests can be written before implementation (TDD) — implementer writes tests against these specs
- Reviewer evaluates architecture at signature level, not just intent
- Testing subagent can create tests in parallel using this section
- Design issues (wrong types, missing params, wrong call chain) surface before any code is written

**When to skip:** Only if the story has zero code changes (docs-only, config-only).

**Add a `## Mid-Level Design` section to the plan, structured as:**

```markdown
## Mid-Level Design

### Call Graph Changes

*(Required when the story adds/changes any cross-layer call relationship, new context
provider, or new end-to-end UI flow. Write "No call graph changes." if truly none.)*

**Modified flows:**
- **Flow 5 (Group stats / leaderboard)** — extend `LeaderboardCards` to render
  `SharePreviewModal` + `LeaderboardTemplate` (off-screen) for image export
- **Flow 13 (Friend group management)** — add `NotificationDialog` →
  `sendGroupNotification` branch under `AdminSectionTabs`

**New flows:**
- none

### `app/db/group-repository.ts` *(modified)*

**New functions:**

- **findGroupsByUser(userId: string)**: `Promise<Group[]>`
  Returns all active group memberships for the user, ordered by name.
  Tests:
  - returns empty array when user has no group memberships
  - returns groups sorted by name ascending
  - excludes groups where membership is inactive

### `app/actions/group-actions.ts` *(modified)*

**New functions:**

- **getUserGroups(locale: string)**: `Promise<LocalizedGroup[]>`
  Server Action. Fetches and localizes groups for the authenticated user.
  Calls: getLoggedInUser, findGroupsByUser, applyLocalization
  Tests:
  - throws Unauthorized when no active session
  - returns localized groups for valid user
  - returns empty array when user has no groups

**Changed functions:**

- **createGroup(data: GroupNew, locale: string)**: `Promise<LocalizedGroup>` *(was: no locale param)*
  Now localizes before returning so callers get display-ready data.
  Calls: getLoggedInUser, insertGroup, applyLocalization
  Tests:
  - (existing tests unchanged)
  - new: returned group name matches the locale parameter
```

**Key rules (full rules in `docs/claude/code-structure.md`):**
- **Always include `### Call Graph Changes`** — even if "No call graph changes." Forces conscious evaluation
- Signatures use real TypeScript types from the codebase (not invented types)
- `Calls:` lists project functions only — omit npm packages, stdlib, framework calls
- Test cases are observable behavior descriptions, ≥3 per function including at least one error/edge case
- Cover all new exported functions/components; changed functions only if signature or behavior meaningfully differs

---

**✋ CHECKPOINT: Have you used the Write tool?**

After creating the plan content, verify:
- [ ] I used the Write tool to create `plans/STORY-${STORY_NUMBER}-plan.md`
- [ ] The file exists (not just in my memory)
- [ ] The file contains the complete plan with all sections

**Verification command:**
```bash
ls -la ${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-plan.md
```

**If the file doesn't exist:** You forgot to use Write tool. Use it NOW:
```typescript
Write({
  file_path: `${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-plan.md`,
  content: `[Your plan content here]`
})
```

**Do NOT proceed to Step 4 without using Write tool to create the plan file.**

---

### 4. Pre-Review Checklist (MANDATORY)

**🛑 STOP - Complete this checklist before launching plan review 🛑**

Before invoking `/plan-reviewer`:
- [ ] **I used Write tool** to create `plans/STORY-N-plan.md` (file exists, not just in memory)
- [ ] Plan document is complete with all sections
- [ ] Visual prototypes included (if UI changes)
- [ ] Technical approach is detailed
- [ ] Files to create/modify are listed
- [ ] Mid-Level Design section included: all new/changed functions have signatures, Calls:, and ≥3 test cases each
- [ ] Mid-Level Design includes `### Call Graph Changes` subsection (even if "No call graph changes.")
- [ ] Testing strategy is comprehensive
- [ ] I am STILL IN PLAN MODE
- [ ] I have NOT exited plan mode
- [ ] I have NOT started implementing

**Only proceed to plan review after completing this checklist.**

---

### 5. Plan Review with Subagent (MANDATORY)

**CRITICAL:** Before committing the plan to PR, you MUST run a Plan Reviewer subagent for 2-3 review cycles.

Invoke `/plan-reviewer` for the full dual-persona review loop. The skill contains the complete Haiku subagent pattern with Persona A (The Architect) and Persona B (The TDD Engineer).

**Run 2-3 cycles until:**
- Subagent responds "No significant concerns" → proceed to Step 6
- OR 3 cycles completed → stop regardless (diminishing returns)

**DO NOT:**
- ❌ Skip the review loop
- ❌ Stop after only 1 cycle if concerns were raised
- ❌ Continue beyond 3 cycles (over-iteration)

---

### 6. Pre-Commit Checklist (MANDATORY)

**🛑 STOP - Complete this checklist before committing plan 🛑**

Before launching Bash subagent via `/git-ops` Section 1:
- [ ] Plan review loop completed (2-3 cycles OR "no significant concerns")
- [ ] All reviewer feedback incorporated
- [ ] Visual prototypes included (if UI changes)
- [ ] Plan is comprehensive and ready for user review
- [ ] I am STILL IN PLAN MODE
- [ ] I have NOT exited plan mode
- [ ] I have NOT started implementing
- [ ] I will use Bash SUBAGENT to commit (not exit plan mode)

**Only proceed to commit after completing this checklist.**

---

### 7. Commit Plan and Create PR

**CRITICAL: You are STILL IN PLAN MODE. Do NOT exit plan mode. Do NOT run git commands directly.**

**Step 7 has exactly ONE action: invoke the `/git-ops` skill and follow Section 1.**

**🛑 MANDATORY FIRST ACTION — invoke the git-ops skill now:**

```typescript
Skill({ skill: "git-ops" })
```

Then follow **Section 1** of the loaded skill exactly. It contains the complete Task() template you must use to launch a general-purpose subagent that handles all git operations while you stay in plan mode.

**If the `/git-ops` skill is not available or you are unsure how to proceed:** STOP. Tell the user: "I need to commit the plan and create a PR but I don't have the git-ops template. Please tell me how to proceed (hint: invoke `/git-ops`)."

**🛑 BEFORE YOU PROCEED - Answer These Verification Questions: 🛑**

1. **Have I completed the plan review loop (2-3 cycles)?** (Answer MUST be YES)
2. **Have I invoked the `/git-ops` skill?** (Answer MUST be YES)
3. **Am I using the Task tool with subagent_type: "general-purpose"?** (Answer MUST be YES)
4. **Am I still in plan mode?** (Answer MUST be YES)
5. **Am I about to exit plan mode to commit?** (Answer MUST be NO)
6. **Am I trying to commit manually with git commands?** (Answer MUST be NO)

**If ANY answer is wrong, STOP and fix it before proceeding.**

**CRITICAL: PR Title Format**
- Always use actual issue title (fetch with `gh issue view`)
- Include issue number in title: `#${STORY_NUMBER}` (for easy reference)
- Include `Fixes #${STORY_NUMBER}` in body (for GitHub auto-linking)
- Format: `"Plan: ${issueTitle} #${STORY_NUMBER}"`
- Always create as **DRAFT** (`--draft` flag)

**Output to user:**
- PR number and URL
- Plan file location
- Next steps (waiting for review/feedback)

**🛑🛑🛑 CRITICAL CHECKPOINT - STOP AND VERIFY 🛑🛑🛑**

**🚨 MANDATORY: DO NOT PROCEED PAST THIS POINT WITHOUT COMPLETING THIS SECTION 🚨**

You have just committed the plan and created a PR. This is a **CRITICAL CHECKPOINT**.

**What you have done:**
- ✅ Created implementation plan
- ✅ Reviewed with subagent via `/plan-reviewer` (2-3 cycles)
- ✅ Committed plan using Bash subagent via `/git-ops`
- ✅ Created DRAFT PR for user review

**What state you are in:**
- ✅ You are STILL IN PLAN MODE (you never exited)
- ✅ The Bash subagent handled git operations
- ✅ You remained in plan mode the entire time

**VERIFICATION CHECKLIST - You MUST answer these questions to yourself:**
- [ ] Did I use Task tool with subagent_type: "general-purpose" to commit and create PR? (Answer MUST be YES)
- [ ] Did I exit plan mode? (Answer MUST be NO)
- [ ] Am I still in plan mode? (Answer MUST be YES)
- [ ] Did the user say "execute the plan"? (Answer MUST be NO)
- [ ] Have I started implementing? (Answer MUST be NO)
- [ ] Have I used TaskCreate? (Answer MUST be NO)
- [ ] Am I reading implementation files? (Answer MUST be NO)

**🛑 YOUR NEXT MESSAGE TO THE USER MUST CONTAIN EXACTLY THIS AND NOTHING MORE: 🛑**

Required content:
- ✅ Report PR number and URL
- ✅ Say "Waiting for your review and feedback"
- ✅ STOP - Say NOTHING ELSE

**🚫 YOUR NEXT MESSAGE TO THE USER MUST NOT CONTAIN: 🚫**

Forbidden phrases (if you use any of these, you have FAILED):
- ❌ "Would you like to proceed?"
- ❌ "Should I start implementation?"
- ❌ "Ready to implement"
- ❌ "Shall I move forward?"
- ❌ "Would you like me to begin?"
- ❌ "Next steps would be to..."
- ❌ "I can now start..."
- ❌ Any suggestion of proceeding beyond plan review

**IF YOUR NEXT MESSAGE CONTAINS MORE THAN THE REQUIRED CONTENT ABOVE, YOU HAVE VIOLATED THE WORKFLOW.**

**What you MUST do now:**
- ✅ STAY IN PLAN MODE
- ✅ WAIT for user to review plan
- ✅ Be ready to iterate on feedback
- ✅ Only proceed when user says "execute the plan"

**What you MUST NOT do:**
- ❌ DO NOT exit plan mode
- ❌ DO NOT start coding
- ❌ DO NOT read implementation files
- ❌ DO NOT create tasks with TaskCreate
- ❌ DO NOT use the implementation guide
- ❌ DO NOT think about implementation details
- ❌ DO NOT ask about proceeding

**You are now in the Plan Iteration Phase (see Step 8 below).**

---

### 8. Plan Iteration Phase

**YOU ARE HERE after creating the PR. STAY IN PLAN MODE.**

**ITERATE IN A CYCLE** - This is the key pattern:

**When user provides feedback:**

1. **While IN plan mode (you NEVER exit):**
   - Read the feedback from PR comments or direct messages
   - Update the plan document: `plans/STORY-${STORY_NUMBER}-plan.md`

2. **Launch subagent to commit updates:**
   ```typescript
   Skill({ skill: "git-ops" })
   ```
   Then follow **Section 2** of the loaded skill for the exact commit template. If unsure, STOP and tell the user: "I need to commit plan updates but need the git-ops template — please invoke `/git-ops`."

3. **Repeat cycle** until user approves with "execute the plan"

**Resume path for architectural reconsideration:** If feedback in this step requires architectural rethinking (changed requirements, new constraints, wrong approach), do NOT make a fresh Gemini call. Use:
```bash
SESSION_ID=$(jq -r '.session_id' /tmp/gemini-story-${STORY_NUMBER}-architect-1.json)
gemini --yolo -m gemini-2.5-flash --resume-chat ${SESSION_ID} -o json \
  -p "[only the feedback delta — what changed and why]" \
  > /tmp/gemini-story-${STORY_NUMBER}-architect-2.json
sed -i 's/^[^{]*//' /tmp/gemini-story-${STORY_NUMBER}-architect-2.json
GEMINI_DRAFT=$(jq -r '.response' /tmp/gemini-story-${STORY_NUMBER}-architect-2.json)
```
Gemini retains the original story and codebase context. Send only the new constraints.

**YOU NEVER EXIT PLAN MODE during this iteration cycle. Subagents handle all git operations.**

---

### 9. Pre-Execution Checklist (MANDATORY)

**🛑 STOP - Complete this checklist before exiting plan mode 🛑**

**This checklist runs when user says "execute the plan".**

Before exiting plan mode:
- [ ] User has explicitly said "execute the plan" or similar approval phrase
- [ ] Plan has been reviewed and approved by user
- [ ] All feedback has been incorporated
- [ ] I have read `/implementer` completely
- [ ] I understand I will use TaskCreate to define tasks
- [ ] I understand I will set dependencies with TaskUpdate
- [ ] I understand implementation workflow
- [ ] I am ready to start coding (not before!)

**If ANY checkbox is unchecked, DO NOT exit plan mode. WAIT.**

**Only proceed to Step 10 after:**
1. User says "execute the plan"
2. All checklist items are verified
3. You have read `/implementer`

---

### 10. Final Exit: Execute the Plan

**This is the ONLY time you exit plan mode.**

**Wait for explicit approval signal from user:**
- User says "execute the plan"
- User says "start implementation"
- User says "looks good, proceed"
- User says "approved, go ahead"

**ONLY when you receive this signal:**
```typescript
// Exit plan mode - this is your ONLY exit during planning
// Now you start implementation
ExitPlanMode()
```

**Then start coding according to the approved plan.**

**Key difference with this approach:**
- You NEVER exited plan mode during iterations (subagents handled commits)
- This is your FIRST and ONLY exit from plan mode
- Exit = clear signal to start implementation
- No ambiguity, no confusion

**AFTER exiting plan mode:**

1. **Read `/implementer`**: Before doing ANYTHING, read the implementation skill
2. **Create tasks**: Use TaskCreate to break down the plan
3. **Set dependencies**: Use TaskUpdate to define execution order
4. **Start implementing**: Follow the implementation workflow

**DO NOT:**
- ❌ Start coding immediately after ExitPlanMode
- ❌ Skip reading `/implementer`
- ❌ Skip task definition

## Plan Iteration Cycle (Visual)

```
┌─────────────────────────────────────────┐
│         PLAN ITERATION CYCLE            │
│     (NEVER EXIT PLAN MODE)              │
└─────────────────────────────────────────┘

STAY IN PLAN MODE ─────────────────┐
  │                                │
  │ User provides feedback         │
  │ Update plan document           │
  │                                │
  │ Launch Bash subagent           │
  │   → git add, commit, push      │
  │   → subagent completes         │
  │                                │
  │ Still in plan mode ────────────┘
  │
  │ Repeat until user approves
  │
  v
User says "EXECUTE THE PLAN"
  │
  v
EXIT PLAN MODE (ONLY EXIT)
  │
  │ START IMPLEMENTATION
  │ (Read /implementer, use TaskCreate)
  │
  v
```

## Common Mistakes

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|------------------|
| Skipping PR for plan | User can't review in familiar interface | Always create DRAFT PR for plan |
| Exiting plan mode to commit | Starting to code accidentally | Use `/git-ops` Section 1 (Bash subagent) |
| Only 1 plan review cycle | Misses issues iterative review catches | Run 2-3 cycles via `/plan-reviewer` |
| Starting implementation after PR | User hasn't approved yet | Commit plan → PR → Checkpoint → WAIT |
| Not completing verification checkpoint | Jump to implementation prematurely | Complete all checklist items |

---

## Appendix: Change Plans (Mid-Implementation Replanning)

When significant user feedback requires approach changes during implementation:

### When to Create a Change Plan

**Use change plan for:**
- 6+ changes needed
- Scope change (different from original plan)
- Architectural changes required
- New requirements discovered
- User feedback fundamentally changes the approach

**Use Workflow A (just TaskCreate) for:**
- 2-5 changes
- Bug fixes
- Minor enhancements within scope

### Change Plan Workflow

1. Enter plan mode again
2. Create change plan document: `/plans/STORY-${STORY_NUMBER}-change-1.md`
3. Run plan review via `/plan-reviewer`
4. Commit change plan using `/git-ops` Section 2 (to same PR)
5. Wait for user approval: "execute the change plan"
6. Exit plan mode
7. **Define tasks from change plan using TaskCreate/TaskUpdate** (MANDATORY)
8. Execute in waves

### Change Plan Document Location

```bash
/plans/STORY-${STORY_NUMBER}-change-1.md
/plans/STORY-${STORY_NUMBER}-change-2.md  # for subsequent changes
```

### After "Execute the Change Plan"

Follow `/implementer` workflow, but base task definitions on the change plan rather than the original plan.

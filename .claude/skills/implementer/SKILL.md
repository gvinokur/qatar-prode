---
name: implementer
description: Implementation phase skill — use when user says "execute the plan". Covers wave-based execution, TaskCreate/TaskUpdate usage, CODE-STRUCTURE updates in same commit, mandatory validation (tests+lint+build) before commit, and Vercel Preview default workflow.
---

# Implementer (Implementation Skill)

Complete workflow for implementing stories after plan approval.

## 🛑 BEFORE STARTING: Read This Guide First

**MANDATORY:** You should ONLY be reading this guide after:
1. ✅ Planning phase is complete
2. ✅ Plan has been reviewed and approved by user
3. ✅ User has explicitly said "execute the plan"
4. ✅ You have exited plan mode (final exit)

**If ANY of the above is NOT true, STOP and go back to `/architect`.**

**Checklist before proceeding:**
- [ ] I have exited plan mode because user said "execute the plan"
- [ ] I have read this `/implementer` guide completely
- [ ] I understand I MUST use TaskCreate to define tasks
- [ ] I understand I MUST use TaskUpdate to set dependencies
- [ ] I understand execution happens in waves based on dependencies
- [ ] I understand I do NOT commit until validation checks pass

**Only proceed to implementation after completing this checklist.**

---

## Overview

After the planning phase is complete and the user approves the plan with "execute the plan", you move into implementation. This guide covers task definition, execution strategies, progress tracking, and coding best practices.

## Critical Rules

1. **ALWAYS read this guide first** - Before starting implementation
2. **ALWAYS define tasks** using TaskCreate before starting implementation
3. **ALWAYS define dependencies** using TaskUpdate (blockedBy, blocks)
4. **ALWAYS use absolute paths** when working in worktrees
5. **ALWAYS follow the approved plan** - no scope creep
6. **ALWAYS mark tasks in_progress** when starting, completed when done
7. **NEVER commit without running validation checks** - MUST run tests, lint, and build before ANY commit (see Section 9)
8. **ALWAYS document deviations from plan** - Add amendments when gaps/issues discovered (see Section 8)

## Implementation Workflow

### 1. Exit Plan Mode (Final Exit)

**Wait for explicit user approval:**
- User says "execute the plan"
- User says "start implementation"
- User says "looks good, proceed"

**Only then:**
```typescript
// Exit plan mode for the LAST TIME to begin implementation
ExitPlanMode()
```

This is the final signal to start coding.

### 2. Task Definition Phase (MANDATORY)

**Purpose:** Break the approved plan into atomic, well-defined tasks with explicit dependencies to enable parallelization and clear progress tracking.

**Critical:** This step is MANDATORY for all non-trivial stories. Do NOT skip to coding immediately.

#### Step A: Read and Analyze Plan

```typescript
// Read the approved plan
const plan = await Read({
  file_path: `${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-plan.md`
})

// Analyze the "Implementation Steps" section
// Identify atomic units of work
// Determine dependencies between units
```

#### Step B: Create Tasks with TaskCreate

**Use TaskCreate for each atomic unit of work.**

**Task anatomy:**
```typescript
TaskCreate({
  subject: "Imperative action (e.g., Add database tables)",
  description: `Detailed description including:
  - Files to create/modify
  - Dependencies on other tasks
  - Success criteria
  - Any special considerations

CODE-STRUCTURE files to update:
  - docs/code-structure/[layer].md — list each layer file that covers the files you're changing
  - CODE-STRUCTURE.md call graph — YES/NO: does this task add/change any cross-layer call?
  `,
  activeForm: "Present continuous (e.g., Adding database tables)"
})
```

> **⚠️ CODE-STRUCTURE is MANDATORY for every task that creates or modifies source files.**
> Every task description MUST include a "CODE-STRUCTURE files to update" section.
> Update the relevant layer files and call graph **in the same commit** as the source changes — never defer to later.

**Example: Feature with multiple components**

```typescript
// Task 1: Database layer
TaskCreate({
  subject: "Add database tables and repository for feature X",
  description: `
Create database schema and repository functions.

Files to create/modify:
- migrations/001_add_feature_x_tables.sql
- app/db/feature-x-repository.ts

Success criteria:
- Migration runs successfully
- Repository functions have proper TypeScript types
- Basic CRUD operations work
- Functions handle errors appropriately

CODE-STRUCTURE files to update:
- docs/code-structure/db.md — add/update entries for all new/modified repository functions
- CODE-STRUCTURE.md call graph — NO (repository functions are called by actions; update call graph in the action task)
`,
  activeForm: "Adding database layer"
})

// Task 2: Server action (depends on Task 1)
TaskCreate({
  subject: "Implement server action for feature X",
  description: `
Create server action that uses repository functions.

Files to create:
- app/actions/feature-x-actions.ts

Dependencies:
- Task 1 must be complete (needs repository functions)

Success criteria:
- Action validates input with Zod schema
- Action checks user authorization
- Action calls repository functions correctly
- Proper error handling and logging
- Returns typed response

CODE-STRUCTURE files to update:
- docs/code-structure/actions.md — add/update entries for all new/modified server actions
- CODE-STRUCTURE.md call graph — YES: add/extend the flow showing page → action → repository call chain
`,
  activeForm: "Implementing server action"
})

// Task 3: UI component (independent of Task 2, can run parallel)
TaskCreate({
  subject: "Create UI component for feature X",
  description: `
Build Client Component for feature X user interface.

Files to create:
- app/components/FeatureX.tsx

Dependencies:
- None (component receives data via props)

Success criteria:
- Component renders correctly with provided props
- Handles user interactions (clicks, input changes)
- Proper TypeScript types for props
- Follows Material-UI design patterns
- Accessible (ARIA labels, keyboard navigation)

CODE-STRUCTURE files to update:
- docs/code-structure/components/components-[domain].md — add entry for the new component with [Client] tag, props, Renders: children
- CODE-STRUCTURE.md call graph — NO (component is wired in during integration task; update call graph there)
`,
  activeForm: "Creating UI component"
})

// Task 4: Integration (depends on Tasks 2 & 3)
TaskCreate({
  subject: "Integrate feature X into dashboard page",
  description: `
Wire up Server Component to fetch data and pass to Client Component.

Files to modify:
- app/dashboard/page.tsx

Dependencies:
- Task 2 (server action must exist)
- Task 3 (UI component must exist)

Success criteria:
- Page fetches data using server action
- Data passed as props to Client Component
- No client-side data fetching (keep Server Component pattern)
- Loading states handled appropriately

CODE-STRUCTURE files to update:
- docs/code-structure/pages.md — update page entry to reflect new server action call and rendered component
- CODE-STRUCTURE.md call graph — YES: extend the existing flow (or add a new flow) to show page → action → repo and page [renders] component
`,
  activeForm: "Integrating feature into page"
})
```

#### **[Canonical] CODE-STRUCTURE.md Update Rule (MANDATORY)**

**Every task that creates or modifies source files must update `CODE-STRUCTURE.md` as part of its commit.**

Do NOT defer CODE-STRUCTURE.md updates to the end of a story. Update it per-task, immediately after completing the code changes for that task, before committing.

**How to update CODE-STRUCTURE.md for a task:**

1. **Read `docs/claude/code-structure.md`** — the format guide. Follow it exactly to ensure consistency with existing entries.

2. **For each file you created or modified in this task:**
   - Identify the correct layer file to update:
     - `app/db/` → `docs/code-structure/db.md`
     - `app/actions/` → `docs/code-structure/actions.md`
     - `app/utils/` → `docs/code-structure/utils.md`
     - `app/[locale]/` pages → `docs/code-structure/pages.md`
     - `app/components/` → the matching `docs/code-structure/components/components-[domain].md`
   - Locate (or create) the `### path/to/file.ts` section in the relevant layer file
   - Update all function/component entries to reflect current signatures
   - Add entries for new functions/components
   - Remove entries for deleted functions/components
   - Keep the 1–2 sentence file description accurate

3. **Update the `## Call Graph`** in `CODE-STRUCTURE.md` if ANY of the following is true:
   - A new page, Server Action, or component was added that calls something across layers
   - An existing call chain changed (new param added, different action called, new repo function used)
   - A context provider was added or removed from a flow
   - A new UI flow exists end-to-end that isn't represented by any existing flow in the graph

   **Concrete triggers requiring a call graph update:**
   - New page → new action → new repo call: add a new numbered flow or extend an existing one
   - Added sharing/export feature to a leaderboard: extend the leaderboard flow tree
   - New context provider wrapping a flow: add it as a `[Provider]` node in the tree
   - New admin action in backoffice: extend the backoffice flow

   **When in doubt, update the call graph.** A slightly over-specified graph is better than a stale one.

4. **Stage `CODE-STRUCTURE.md` alongside the task's source files** — it should be in the same commit, not a separate one.

**Checking your work:**
- Every exported function/component in modified files must have a matching entry
- Signatures in CODE-STRUCTURE.md must exactly match the implemented signatures
- `Calls:` lines must list only project functions (no npm packages or stdlib)
- If a function listed in the plan's Mid-Level Design changed during implementation, the CODE-STRUCTURE.md entry reflects the **actual** implementation, not the plan

#### Step C: Define Dependencies with TaskUpdate

```typescript
// Task 2 is blocked by Task 1
TaskUpdate({
  taskId: "2", // Server action
  addBlockedBy: ["1"] // Blocked by database task
})

// Task 4 is blocked by Tasks 2 and 3
TaskUpdate({
  taskId: "4", // Integration
  addBlockedBy: ["2", "3"] // Blocked by both server action and UI component
})

// Note: Tasks 2 and 3 have no dependency between them
// They can be implemented in parallel
```

#### Step D: Identify Execution Waves

```
Execution Waves:
┌─────────────────────────────────────┐
│ Wave 1: Task 1 (database)           │
│ - Must run first                    │
│ - Blocks: Tasks 2 & 4               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Wave 2 (PARALLEL):                  │
│ - Task 2 (server action)            │
│ - Task 3 (UI component)             │
│ - Can run simultaneously            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ Wave 3: Task 4 (integration)        │
│ - Must run after wave 2 completes   │
└─────────────────────────────────────┘
```

#### Step E: Output Summary to User

```markdown
Created implementation tasks:

**Wave 1 (Sequential):**
- Task 1: Add database layer

**Wave 2 (Parallel):**
- Task 2: Implement server action (blocked by Task 1)
- Task 3: Create UI component (independent)

**Wave 3 (Sequential):**
- Task 4: Integrate into page (blocked by Tasks 2, 3)

**→ Next: Proceeding to execution mode selection**
```

### 2.5. Execution Mode Selection Checkpoint

**STOP HERE - Do not proceed to implementation until completing this step.**

**Purpose:** After defining tasks, classify them by complexity and choose whether to execute with main agent (default) or use hybrid/subagent delegation for efficiency gains. **Proceed immediately with recommendation — no user input needed.**

#### Step A: Classify Tasks by Complexity

**Simple Tasks (Subagent-Ready - Haiku):**
- Clear, unambiguous specification
- Isolated change (1-2 files)
- Following established patterns (similar code exists)
- Basic logic (CRUD, simple validation, standard component)
- No architectural decisions needed

**Complex Tasks (Main Agent - Sonnet):**
- Ambiguous requirements needing judgment
- Cross-cutting changes (3+ files with coordination)
- Greenfield work (establishing new patterns)
- Complex business logic
- Architectural or design decisions

**Medium Tasks (Could Go Either Way):**
- 2-3 files with light coordination
- Some judgment needed but mostly following patterns
- Decision: Use your best judgment or default to main agent

#### Step B: Apply Recommendation Criteria

**Recommend "Hybrid Mode" when:**
- 5+ total tasks AND 3+ simple tasks
- Tasks are well-isolated (clear boundaries)
- Established patterns (not greenfield)

**Recommend "Main Agent Mode" when:**
- <4 total tasks OR <2 simple tasks
- Highly coupled tasks
- First time implementing this type of feature

#### Step C: Present Analysis and Proceed

Format your analysis, then **immediately proceed** with the recommendation — do NOT wait for user input.

### 3. Execution Phase

#### Starting a Task

```typescript
// Claim the task and mark it in progress
TaskUpdate({
  taskId: "1",
  status: "in_progress",
  owner: "main-agent"
})
// Then start implementation
```

#### During Implementation

**Follow the approved plan:**
- Read the task description carefully
- Implement exactly what's specified (no scope creep)
- Use absolute paths for all file operations
- Follow architecture and coding guidelines
- Add appropriate error handling and types

**Run checks frequently during development:**
```bash
# Run tests for files you've modified
npm --prefix ${WORKTREE_PATH} run test

# Check for linting issues
npm --prefix ${WORKTREE_PATH} run lint

# Verify build still works
npm --prefix ${WORKTREE_PATH} run build
```

#### After Completing a Task

```typescript
TaskUpdate({
  taskId: "1",
  status: "completed"
})

// Check what's unblocked
TaskList()

// Start next available task(s)
```

### 3.5. Hybrid Execution Mode (Optional)

**Only follow this section if hybrid mode was selected in Section 2.5.**

This section describes how to execute implementation using a hybrid approach: main agent for complex tasks, Haiku subagents for simple tasks.

#### Delegating Simple Tasks to Haiku Subagents

```typescript
// Mark task as in_progress
TaskUpdate({
  taskId: "3",
  status: "in_progress",
  owner: "haiku-subagent"
})

// Launch Haiku subagent
Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Add database field",
  prompt: `You are implementing a simple, well-defined task as part of a larger story.

**Task:** [description]

**Context:**
- Follow existing patterns exactly

**Files to modify:**
- ${WORKTREE_PATH}/[file] ([what to change])

**Success criteria:**
- [criterion 1]
- [criterion 2]

**Instructions:**
1. Read the existing file to understand the pattern
2. Make the specified change
3. If you encounter ambiguity, report it (don't guess)
`
})

// After subagent completes:
// 1. Review the output
// 2. Verify it matches requirements
// 3. Fix any issues if needed
// 4. Mark task as completed
TaskUpdate({taskId: "3", status: "completed"})
```

#### Parallel Subagent Execution

When multiple simple tasks in a wave are independent:

```typescript
// Launch multiple Haiku subagents in parallel (single message, multiple Task calls)
TaskUpdate({taskId: "3", status: "in_progress"})
TaskUpdate({taskId: "4", status: "in_progress"})
TaskUpdate({taskId: "5", status: "in_progress"})

Task({ subagent_type: "general-purpose", model: "haiku", description: "Task 3", prompt: "..." })
Task({ subagent_type: "general-purpose", model: "haiku", description: "Task 4", prompt: "..." })
Task({ subagent_type: "general-purpose", model: "haiku", description: "Task 5", prompt: "..." })

// After ALL subagents complete:
// 1. Review all outputs
// 2. Verify consistency across changes
// 3. Fix any issues
// 4. Mark all as completed
```

**CRITICAL: Always review subagent outputs before marking complete.**

**Check for:**
- ✅ Follows the task specification
- ✅ Matches existing code style and patterns
- ✅ TypeScript types are correct
- ✅ No unexpected changes (scope creep)
- ✅ Integrates correctly with other tasks

#### When to Abandon Hybrid Mode Mid-Story

Switch back to main agent mode if:
- Subagent outputs are low quality (requires too much fixing)
- Tasks are more coupled than expected
- Coordination overhead > time saved

### 4. Parallel Execution Strategy (Main Agent Mode)

**When multiple tasks have no dependencies:**

**Option A: Implement sequentially (Recommended)**
```typescript
// Main agent implements Task 2, then Task 3
TaskUpdate({taskId: "2", status: "in_progress"})
// ... implement ...
TaskUpdate({taskId: "2", status: "completed"})

TaskUpdate({taskId: "3", status: "in_progress"})
// ... implement ...
TaskUpdate({taskId: "3", status: "completed"})
```

**Option B: Use subagents for true parallelism** (Advanced, rarely needed)

See subagent-workflows.md for details. For most stories, Option A is sufficient.

### 5. Progress Tracking

```typescript
// See all tasks and their status
TaskList()

// Output shows:
// - Task 1: completed ✓
// - Task 2: in_progress (50% done)
// - Task 3: pending (blocked by Task 2)
// - Task 4: pending (blocked by Tasks 2, 3)
```

### 6. When to Deviate from Plan

**Small adjustments:** Just make them
- Minor implementation details
- Better variable names
- Small refactorings

**Significant changes:** Create a change plan
- Scope changes
- Different architecture
- New requirements discovered

See `/architect` Appendix: Change Plans for complete workflow.

### 7. Handling User Feedback - ALWAYS Define Tasks First

**🚨 CRITICAL: NEVER make sequential code changes without defining tasks first 🚨**

When user provides feedback (during implementation OR after testing in Vercel Preview), you MUST analyze and plan before coding.

**KEY PRINCIPLE: If you're making 2+ non-trivial changes, ALWAYS define tasks first.**

See `/implementer` `feedback-patterns.md` for the complete decision tree, Workflow A (2-5 changes), Workflow B (6+ changes or scope change), amendment format examples, and sequential vs parallel execution examples.

**Summary:**
- **Trivial change** (single line, typo): Just fix it
- **2-5 changes**: Workflow A — TaskCreate/TaskUpdate, then execute in waves
- **6+ changes or scope change**: Workflow B — Change Plan via `/architect`, then tasks

**IF YOU START MAKING CHANGES WITHOUT DEFINING TASKS (for 2+ non-trivial changes), YOU HAVE VIOLATED THE WORKFLOW.**

### 8. Plan Amendments (Keeping Plan in Sync)

**Purpose:** Ensure plan documentation matches actual implementation by capturing deviations as they occur.

**Add amendments for:**
- Bug fixes discovered during implementation
- Edge cases not in original plan
- Small scope additions (within story boundaries)
- Technical adjustments (different function name, different file structure)
- Performance optimizations
- UX improvements within original design

**Don't add amendments for:**
- Trivial changes (single line, typo fix)
- Changes already covered by change plans
- Normal implementation details (variable names, etc.)

**Amendment Format:**

Add an `## Implementation Amendments` section to your plan document:

```markdown
## Implementation Amendments

### Amendment 1: Handle Empty Game List
**Date:** 2026-02-12
**Reason:** Original plan didn't account for scenario where user has no games
**Change:** Added EmptyState component displaying "No games yet" message with call-to-action button

### Amendment 2: Fix Kysely Query Type Error
**Date:** 2026-02-12
**Reason:** Kysely `.execute()` doesn't return single row, causes TypeScript error
**Change:** Used `.executeTakeFirst()` instead of `.execute()` for single-row queries
```

**How to Add Amendments During Implementation:**

When you discover a gap/issue:
1. **Fix the code** (implement the solution)
2. **Update plan document** with amendment (Edit tool)
3. **Commit with implementation changes** — add both plan and code in same commit

```bash
# Add both plan and code changes
git -C ${WORKTREE_PATH} add plans/STORY-${STORY_NUMBER}-plan.md src/...

# Commit together
git -C ${WORKTREE_PATH} commit -m "feat: implement X (with plan amendment for Y)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

### 9. After Implementation Complete

**🚨 CRITICAL: VALIDATE, DEPLOY, THEN USER TESTS IN VERCEL PREVIEW 🚨**

The default workflow is to deploy to Vercel Preview for user testing (NOT local testing). Follow ALL steps below.

#### Step 1: Verify All Tasks Completed

```typescript
TaskList()
// Ensure all tasks show "completed"
```

#### Step 2: Create Tests

See `/test-engineer` for the complete testing guide and parallel subagent pattern.

#### Step 3: Run Local Validation Checks

**🛑 MANDATORY VALIDATION BEFORE ANY COMMIT 🛑**

**0. Ensure dependencies are installed in the worktree**

Each worktree has its own `node_modules`. NEVER reuse `node_modules` from the main worktree or any other worktree.

```bash
ls ${WORKTREE_PATH}/node_modules
```
- ✅ Exists → Continue
- ❌ Missing → Run `npm --prefix ${WORKTREE_PATH} install` before proceeding

You MUST run validation checks before committing:

1. **Run Tests**
   ```bash
   npm --prefix ${WORKTREE_PATH} run test
   ```
   - ✅ All tests passing → Continue
   - ❌ Tests failing → Fix tests first, DO NOT proceed

2. **Run Linter**
   ```bash
   npm --prefix ${WORKTREE_PATH} run lint
   ```
   - ✅ No linting errors → Continue
   - ❌ Linting errors → Fix errors first, DO NOT proceed

3. **Run Build**
   ```bash
   npm --prefix ${WORKTREE_PATH} run build
   ```
   - ✅ Build succeeds → Continue
   - ❌ Build fails → Fix build errors first, DO NOT proceed

**🛑 VERIFICATION QUESTIONS - Answer Before Proceeding: 🛑**

1. **Have I run `npm run test`?** (Answer MUST be YES)
2. **Did all tests pass?** (Answer MUST be YES)
3. **Have I run `npm run lint`?** (Answer MUST be YES)
4. **Did linting pass with no errors?** (Answer MUST be YES)
5. **Have I run `npm run build`?** (Answer MUST be YES)
6. **Did the build succeed?** (Answer MUST be YES)
7. **Have I updated CODE-STRUCTURE.md for every file created or modified in this commit?** (Answer MUST be YES)
8. **Do the CODE-STRUCTURE.md entries match actual implemented signatures (not plan signatures if they changed)?** (Answer MUST be YES)
9. **Have I updated the `## Call Graph` in `CODE-STRUCTURE.md` if this commit added/changed any cross-layer call relationship, new context provider, new UI flow, or new action call?** (Answer MUST be YES or "not applicable — no call relationships changed")

**If ANY answer is NO, DO NOT COMMIT. Fix the issues first.**

**🚫 NEVER COMMIT IF: 🚫**
- ❌ Tests are failing
- ❌ Linter has errors
- ❌ Build fails
- ❌ Migrations need to run and you don't have permission

**IF YOU COMMIT WITHOUT RUNNING ALL VALIDATION CHECKS, YOU HAVE VIOLATED THE WORKFLOW.**

#### Step 4: Check for Database Migrations

**🚨 ALWAYS ASK PERMISSION BEFORE RUNNING MIGRATIONS 🚨**

Check if there are new migrations that need to be run:

```bash
ls -la ${WORKTREE_PATH}/migrations/
```

**If new migration files exist:**

Ask user for permission:
```markdown
I found new database migrations that need to be run before deployment:
- migrations/YYYY-MM-DD-description.sql

These migrations will modify the database schema.

**Do you want me to run these migrations now?**
```

**NEVER run migrations without explicit user permission.**

#### Step 5: Commit and Push (Triggers Vercel Preview Deployment)

**Only commit if ALL validation checks passed:**

```bash
# Add changes
git -C ${WORKTREE_PATH} add .

# Commit with co-author
git -C ${WORKTREE_PATH} commit -m "$(cat <<'EOF'
feat: implement story #${STORY_NUMBER}

[Brief description of changes]

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"

# Push to remote (triggers Vercel Preview deployment)
git -C ${WORKTREE_PATH} push
```

#### Step 6: Inform User to Test in Vercel Preview

After pushing, inform the user:

```markdown
✅ Implementation complete and pushed to branch.

Summary:
✓ All tasks completed
✓ Tests created and passing (npm test)
✓ Linting passed (npm lint)
✓ Build succeeded (npm build)
✓ Migrations: [ran/not needed/user will run manually]

**Vercel Preview deployment will be available shortly.**

Please test the changes in the Vercel Preview environment and let me know:
- "Code looks good" (to proceed with final SonarCloud validation)
- Or provide feedback for any issues found

Preview URL will appear in the PR checks once deployment completes.
```

**STOP and WAIT for user to test in Vercel Preview**

#### Step 7: Wait for User Feedback from Vercel Preview

**Scenario A: User says "code looks good" or "I'm satisfied"**
- No issues found
- Ready for final validation
- **Action**: Follow `/code-reviewer` workflow

**Scenario B: User provides feedback or reports issues**
- Changes needed
- **Action**:
  - Define tasks first (see Section 7 and `feedback-patterns.md`)
  - Fix the issues
  - Go back to Step 3 (run validation checks again)
  - Commit and push again (new Vercel Preview)
  - Wait for user to test again

**Scenario C: User requests local testing instead**
- **Action**: Wait for user to test locally and provide feedback

#### Step 8: Final SonarCloud Validation (After User Approval)

Once user says "code looks good" after testing in Vercel Preview, follow the complete validation workflow in `/code-reviewer`.

---

## Alternative Workflow: Local Testing (If User Requests)

If user explicitly says "test locally" or "I'll test locally", follow this alternative flow:

1. Complete Steps 1-4 above (tasks, tests, validation, migrations)
2. **DO NOT commit yet**
3. Inform user: "Implementation complete. Please test locally."
4. **STOP and WAIT** for user to test locally
5. When user says "code looks good":
   - Commit and push (Step 5)
   - Follow `/code-reviewer` for CI/CD and SonarCloud (Step 8)

**The default is Vercel Preview testing unless user explicitly requests local testing.**

# Feedback Patterns

Detailed patterns for handling user feedback during and after implementation. Referenced from `/implementer` Section 7.

## Decision Tree: How to Handle Feedback

**Step 1: Analyze the feedback**

Ask yourself:
1. How many files will this affect?
2. Are there multiple independent changes?
3. Can any work be parallelized?
4. Is this a scope change or bug fix?

**Step 2: Choose the appropriate workflow**

```
Is this trivial? (single line, typo, minor wording change)
    ↓                    ↓
   YES                  NO
    ↓                    ↓
Just fix it      How many changes needed?
                        ↓
            ┌───────────┴───────────┐
         2-5 changes        6+ changes OR scope change
            ↓                       ↓
    WORKFLOW A:          WORKFLOW B:
    Task Definition      Change Plan + Tasks
```

---

## Workflow A: Task Definition for 2-5 Changes (MANDATORY)

**When to use:**
- User reports bug affecting 2-3 files
- User requests enhancement touching multiple components
- Multiple independent fixes needed
- Changes can be parallelized

**MANDATORY PROCESS - DO NOT SKIP:**

**1. Analyze feedback and break into tasks**

Example:
```markdown
User feedback: "The form validation isn't working correctly and the
error messages are unclear"

Breaking this down:
1. Fix form validation logic (validation.ts)
2. Update error message formatting (ErrorDisplay.tsx)
3. Add validation tests (validation.test.ts)
4. Update error message tests (ErrorDisplay.test.tsx)
```

**2. Define tasks using TaskCreate**

```typescript
// Task 1
TaskCreate({
  subject: "Fix form validation logic",
  description: "Update validation.ts to properly validate email format
  and required fields. Currently allowing invalid emails through.",
  activeForm: "Fixing form validation logic"
})

// Task 2
TaskCreate({
  subject: "Update error message formatting",
  description: "Make error messages more user-friendly in
  ErrorDisplay.tsx. Use plain language instead of technical errors.",
  activeForm: "Updating error message formatting"
})

// Task 3
TaskCreate({
  subject: "Add validation tests",
  description: "Create tests for email validation and required field
  validation in validation.test.ts",
  activeForm: "Adding validation tests"
})

// Task 4
TaskCreate({
  subject: "Update error message tests",
  description: "Update ErrorDisplay.test.tsx to match new error
  message format",
  activeForm: "Updating error message tests"
})
```

**3. Set dependencies using TaskUpdate**

```typescript
// Tests depend on implementation being done
TaskUpdate({
  taskId: "3",
  addBlockedBy: ["1"]  // Validation tests blocked by validation logic
})

TaskUpdate({
  taskId: "4",
  addBlockedBy: ["2"]  // Error message tests blocked by error messages
})
```

**4. Identify execution waves**

```
Wave 1 (parallel):
- Task 1: Fix form validation logic
- Task 2: Update error message formatting

Wave 2 (parallel, after Wave 1 completes):
- Task 3: Add validation tests
- Task 4: Update error message tests
```

**5. Execute in waves**

- Mark Task 1 and Task 2 as in_progress
- Work on both (in parallel if possible, or sequentially if needed)
- Mark as completed when done
- Then move to Task 3 and Task 4

**🛑 VERIFICATION QUESTIONS - Answer Before Starting Changes: 🛑**

1. **Have I analyzed the feedback and identified all changes needed?** (MUST be YES)
2. **Have I created tasks for each distinct change?** (MUST be YES)
3. **Have I defined dependencies between tasks?** (MUST be YES)
4. **Have I identified which tasks can run in parallel?** (MUST be YES)
5. **Am I about to make sequential changes without tasks?** (MUST be NO)

**If ANY answer is wrong, STOP and define tasks first.**

**NEVER DO THIS (Sequential Changes Without Tasks):**

```
❌ User: "Fix the validation and error messages"
❌ Agent: [Immediately starts editing validation.ts]
❌ Agent: [Then edits ErrorDisplay.tsx]
❌ Agent: [Then edits tests sequentially]
❌ Agent: [No task tracking, no parallelization, inefficient]
```

**ALWAYS DO THIS (Task Definition First):**

```
✅ User: "Fix the validation and error messages"
✅ Agent: [Analyzes feedback - affects 4 files]
✅ Agent: [Creates 4 tasks with TaskCreate]
✅ Agent: [Sets dependencies with TaskUpdate]
✅ Agent: [Identifies 2 execution waves with parallelization]
✅ Agent: [Works in waves, marks progress, efficient]
```

**IF YOU START MAKING CHANGES WITHOUT DEFINING TASKS, YOU HAVE VIOLATED THE WORKFLOW.**

---

## Workflow B: Change Plan + Tasks (6+ Changes or Scope Change)

**When to use:**
- 6+ changes needed
- Scope change (different from original plan)
- Architectural changes required
- New requirements discovered
- User feedback fundamentally changes the approach

**Process:**

1. Enter plan mode again
2. Create change plan document: `/plans/STORY-${STORY_NUMBER}-change-1.md`
3. Review with Plan Reviewer subagent via `/plan-reviewer`
4. Commit change plan using Bash subagent via `/git-ops` Section 2
5. Wait for user approval: "execute the change plan"
6. Exit plan mode
7. **Define tasks from change plan using TaskCreate/TaskUpdate** (MANDATORY)
8. Execute in waves

See `/architect` Appendix: Change Plans for complete workflow.

---

## Trivial Changes (No Task Definition Needed)

**When to use:**
- Single line change
- Typo fix
- Variable renaming
- Minor wording change
- Single import addition/removal

**Just make the change directly** - no task definition needed.

---

## Amendment Format Examples

When you discover gaps/bugs during implementation, add amendments to the plan:

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

### Amendment 3: Add Response Caching
**Date:** 2026-02-13
**Reason:** Vercel Preview showed 3s load time, unacceptable for UX
**Change:** Added `next: { revalidate: 60 }` to fetch calls for 60-second cache
```

**Amendment structure:**
- **Title:** Brief, descriptive (what was changed)
- **Date:** When the change was made
- **Reason:** Why it was needed (context for future readers)
- **Change:** What was actually done (implementation detail)

---

## Sequential vs Parallel Execution Examples

### Sequential (Wave-based)

```
Wave 1:
- Task 1 (database) → must run first

Wave 2 (after Wave 1):
- Task 2 (server action)  ← parallel
- Task 3 (UI component)   ← parallel

Wave 3 (after Wave 2):
- Task 4 (integration) → depends on Tasks 2 & 3
```

### Parallel (Multiple TaskCreate in same wave)

```typescript
// Both tasks run simultaneously (no dependency between them)
TaskUpdate({taskId: "2", status: "in_progress"})
TaskUpdate({taskId: "3", status: "in_progress"})

// Implement Task 2 (server action)
// ...

// Mark 2 complete, then start 3 (or do both sequentially)
TaskUpdate({taskId: "2", status: "completed"})
// ...
TaskUpdate({taskId: "3", status: "completed"})
```

**For true parallel execution** (multiple files simultaneously), use Haiku subagents:

```typescript
// Launch subagents in parallel (single message = parallel execution)
Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Implement server action",
  prompt: "..."
})

Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Create UI component",
  prompt: "..."
})
```

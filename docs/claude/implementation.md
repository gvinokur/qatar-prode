# Implementation Guide

Complete workflow for implementing stories after plan approval.

## 🛑 BEFORE STARTING: Read This Guide First

**MANDATORY:** You should ONLY be reading this guide after:
1. ✅ Planning phase is complete
2. ✅ Plan has been reviewed and approved by user
3. ✅ User has explicitly said "execute the plan"
4. ✅ You have exited plan mode (final exit)

**If ANY of the above is NOT true, STOP and go back to planning phase.**

**Now read this entire guide:**
1. Read all sections below completely
2. Understand the task definition workflow
3. Understand execution waves and dependencies
4. Note the coding best practices

**Checklist before proceeding:**
- [ ] I have exited plan mode because user said "execute the plan"
- [ ] I have read this implementation.md guide completely
- [ ] I understand I MUST use TaskCreate to define tasks
- [ ] I understand I MUST use TaskUpdate to set dependencies
- [ ] I understand execution happens in waves based on dependencies
- [ ] I understand I do NOT commit until user verifies

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
7. **NEVER commit without user verification** - user tests locally first
8. **NEVER commit without running validation checks** - MUST run tests, lint, and build before ANY commit (see Section 7)

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

This is different from temporary exits during plan iteration - this is the final signal to start coding.

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
  `,
  activeForm: "Present continuous (e.g., Adding database tables)"
})
```

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
- Basic CRUD operations work (create, read, update, delete)
- Functions handle errors appropriately
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
`,
  activeForm: "Integrating feature into page"
})
```

#### Step C: Define Dependencies with TaskUpdate

**Set up dependency chain using TaskUpdate:**

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

**Visualize the execution plan:**

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

Starting implementation with Wave 1...
```

### Task Definition Best Practices

#### Good Task Boundaries

✅ **Single file or tightly related files**
```typescript
TaskCreate({
  subject: "Add user profile repository",
  description: "Files: app/db/user-profile-repository.ts, types in app/db/types.ts"
})
```

✅ **Clear inputs and outputs**
```typescript
TaskCreate({
  subject: "Implement profile update server action",
  description: "Input: User profile data. Output: Updated profile or error."
})
```

✅ **Testable in isolation**
```typescript
TaskCreate({
  subject: "Create profile form component",
  description: "Can be tested independently with mock props"
})
```

✅ **1-3 hours of work** (right-sized)

#### Bad Task Boundaries

❌ **Too broad**
```typescript
// DON'T DO THIS
TaskCreate({
  subject: "Implement entire feature",
  description: "Do everything"
})
```

❌ **Too granular**
```typescript
// DON'T DO THIS
TaskCreate({
  subject: "Add import statement to file",
  description: "Add one line"
})
```

❌ **Circular dependencies**
```typescript
// DON'T DO THIS
// Task A depends on Task B
// Task B depends on Task A
```

❌ **Unclear success criteria**
```typescript
// DON'T DO THIS
TaskCreate({
  subject: "Make it work",
  description: "Fix stuff"
})
```

#### Success Criteria Should Include

- **Files to create/modify** - Explicit list
- **What "done" looks like** - Concrete, testable outcomes
- **Dependencies** - What must complete first
- **Quality requirements** - Types, validation, error handling

### 3. Execution Phase

#### Starting a Task

**Always mark task as in_progress before starting:**

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

**Why run checks during development:**
- Catch issues early (easier to fix)
- Faster feedback loop
- Avoid accumulating errors
- Less work at validation phase

**Example implementation:**

```typescript
// Task 1: Add database repository
// TaskUpdate({taskId: "1", status: "in_progress"})

// Read existing patterns
const existingRepo = await Read({
  file_path: `${WORKTREE_PATH}/app/db/users-repository.ts`
})

// Implement new repository following same patterns
Write({
  file_path: `${WORKTREE_PATH}/app/db/feature-x-repository.ts`,
  content: `// Implementation following patterns from users-repository...`
})

// Mark task complete
TaskUpdate({
  taskId: "1",
  status: "completed"
})
```

#### After Completing a Task

**Mark as completed and move to next:**

```typescript
TaskUpdate({
  taskId: "1",
  status: "completed"
})

// Check what's unblocked
TaskList()

// Start next available task(s)
```

### 4. Parallel Execution Strategy

**When multiple tasks have no dependencies:**

**Option A: Implement sequentially yourself**
```typescript
// Main agent implements Task 2
TaskUpdate({taskId: "2", status: "in_progress"})
// ... implement ...
TaskUpdate({taskId: "2", status: "completed"})

// Then implement Task 3
TaskUpdate({taskId: "3", status: "in_progress"})
// ... implement ...
TaskUpdate({taskId: "3", status: "completed"})
```

**Option B: Use subagents for true parallelism** (Advanced)
```typescript
// Launch subagents in parallel for independent tasks
// This is more complex and only worth it for larger tasks
// See subagent-workflows.md for details
```

**Recommendation:** For most stories, Option A (sequential) is sufficient. Save parallel subagents for very large stories or when specifically beneficial.

### 5. Progress Tracking

**Use TaskList to check progress:**

```bash
# See all tasks and their status
TaskList()

# Output shows:
# - Task 1: completed ✓
# - Task 2: in_progress (50% done)
# - Task 3: pending (blocked by Task 2)
# - Task 4: pending (blocked by Tasks 2, 3)
```

**User can see progress in real-time:**
- Tasks marked in_progress show activeForm in UI spinner
- Completed tasks show checkmarks
- Clear visibility into what's done, what's in progress, what's blocked

### 6. When to Deviate from Plan

**Small adjustments:** Just make them
- Minor implementation details
- Better variable names
- Small refactorings

**Significant changes:** Create a change plan
- Scope changes
- Different architecture
- New requirements discovered

See [Planning Guide - Change Plans](planning.md#change-plans-mid-implementation-replanning)

### 7. After Implementation Complete

**🚨 CRITICAL: NEVER COMMIT WITHOUT VALIDATION 🚨**

Before even considering a commit, you MUST complete ALL steps below.

#### Step 1: Verify All Tasks Completed

```typescript
TaskList()
// Ensure all tasks show "completed"
```

#### Step 2: Create Tests

See [Testing Guide](testing.md) and parallel test creation pattern.

#### Step 3: Inform User - Wait for Testing

```markdown
Implementation complete. All tasks finished:
✓ Task 1: Add database layer
✓ Task 2: Implement server action
✓ Task 3: Create UI component
✓ Task 4: Integrate into page

Tests created and passing.

Please test locally before I proceed with validation.
```

**STOP and WAIT for user to test locally and say "code looks good" or "I'm satisfied"**

#### Step 4: User Says "Code Looks Good" - Run Validation Checks

**🛑 MANDATORY VALIDATION BEFORE ANY COMMIT 🛑**

When user says "code looks good" or "I'm satisfied", you MUST run validation checks:

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

**🛑 VERIFICATION QUESTIONS - Answer Before Committing: 🛑**

1. **Have I run `npm run test`?** (Answer MUST be YES)
2. **Did all tests pass?** (Answer MUST be YES)
3. **Have I run `npm run lint`?** (Answer MUST be YES)
4. **Did linting pass with no errors?** (Answer MUST be YES)
5. **Have I run `npm run build`?** (Answer MUST be YES)
6. **Did the build succeed?** (Answer MUST be YES)
7. **Has the user tested locally and said "code looks good"?** (Answer MUST be YES)

**If ANY answer is NO, DO NOT COMMIT. Fix the issues first.**

#### Step 5: Commit (Only After All Checks Pass)

**Only commit if ALL validation checks passed:**

```bash
# Add changes
git -C ${WORKTREE_PATH} add .

# Commit with co-author
git -C ${WORKTREE_PATH} commit -m "$(cat <<'EOF'
feat: implement story #${STORY_NUMBER}

[Brief description of changes]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"

# Push to remote
git -C ${WORKTREE_PATH} push
```

**🚫 NEVER COMMIT IF: 🚫**
- ❌ Tests are failing
- ❌ Linter has errors
- ❌ Build fails
- ❌ User hasn't tested locally
- ❌ User hasn't said "code looks good"

**IF YOU COMMIT WITHOUT RUNNING ALL VALIDATION CHECKS, YOU HAVE VIOLATED THE WORKFLOW.**

#### Step 6: After Committing - Follow Validation Workflow

After pushing, follow the complete validation workflow in [validation.md](validation.md):
- Wait for CI/CD checks
- Analyze SonarCloud results
- Fix any new issues
- Ensure 0 new issues and 80% coverage

## Coding Best Practices

### File Operations

**Always use absolute paths:**

```typescript
// ✅ CORRECT: Absolute path
Read({ file_path: `/Users/username/qatar-prode-story-42/app/component.tsx` })

// ❌ INCORRECT: Relative path
Read({ file_path: `app/component.tsx` })
```

**Use worktree path variable:**

```typescript
const WORKTREE_PATH = '/Users/username/qatar-prode-story-42'

Read({ file_path: `${WORKTREE_PATH}/app/component.tsx` })
```

### Server vs Client Components

**Default to Server Components:**
```typescript
// app/dashboard/page.tsx
// No 'use client' directive = Server Component
export default async function DashboardPage() {
  const data = await fetchData() // Can call async functions directly
  return <ClientComponent data={data} />
}
```

**Use Client Components only when needed:**
```typescript
// app/components/InteractiveForm.tsx
'use client' // Only add when you need hooks, event handlers, or browser APIs

import { useState } from 'react'

export default function InteractiveForm() {
  const [value, setValue] = useState('')
  return <input value={value} onChange={(e) => setValue(e.target.value)} />
}
```

**Server Components can import repositories:**
```typescript
// ✅ CORRECT: Server Component imports repository
import { getUserProfile } from '@/app/db/users-repository'

export default async function ProfilePage() {
  const profile = await getUserProfile()
  return <ProfileDisplay profile={profile} />
}
```

**Client Components receive data via props:**
```typescript
// ✅ CORRECT: Client Component receives props
'use client'

export default function ProfileDisplay({ profile }: { profile: Profile }) {
  return <div>{profile.name}</div>
}
```

### Error Handling

**Server Actions:**
```typescript
'use server'

export async function createProfile(data: ProfileData) {
  try {
    // Validate input
    const validated = profileSchema.parse(data)

    // Check authorization
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Perform operation
    const profile = await createProfileInDb(validated)

    revalidatePath('/profile')
    return { success: true, profile }
  } catch (error) {
    console.error('Error creating profile:', error)
    return { success: false, error: 'Failed to create profile' }
  }
}
```

### Validation

**Always validate user input with Zod:**
```typescript
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  bio: z.string().max(500).optional()
})

export async function updateProfile(data: unknown) {
  // Validate throws if invalid
  const validated = profileSchema.parse(data)

  // Now safe to use validated data
  return await updateProfileInDb(validated)
}
```

### TypeScript Types

**Always use proper types:**
```typescript
// ✅ CORRECT: Explicit types
interface Profile {
  id: string
  name: string
  email: string
}

async function getProfile(userId: string): Promise<Profile | null> {
  // Implementation
}

// ❌ INCORRECT: Using 'any'
async function getProfile(userId: any): Promise<any> {
  // Implementation
}
```

## Common Mistakes to Avoid

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|------------------|
| Skipping task definition | No clear progress tracking, can't parallelize | Always create tasks before coding |
| Tasks without dependencies | Can't determine execution order | Use TaskUpdate to set blockedBy/blocks |
| Not marking tasks in_progress | User can't see what you're working on | TaskUpdate status before starting |
| Not marking tasks completed | Progress not tracked, next tasks stay blocked | TaskUpdate status when done |
| Using relative paths | Bash doesn't persist `cd`, leads to errors | Always use absolute paths |
| Implementing beyond scope | Scope creep, misalignment | Follow approved plan exactly |
| Committing without user verification | User can't test locally | Wait for "code looks good" signal |
| Client Component imports repository | Build error, breaks architecture | Server Components fetch data, pass as props |
| No input validation | Security vulnerabilities | Always validate with Zod schemas |
| Missing error handling | Poor user experience | Wrap operations in try/catch |

## Integration with Other Workflows

### Before Implementation
- **[Planning Guide](planning.md)** - Plan must be approved before starting implementation
- **[Git Worktrees Guide](worktrees.md)** - Ensure working in correct worktree

### During Implementation
- **[Architecture Guide](architecture.md)** - Follow stack patterns and conventions
- **[Testing Guide](testing.md)** - Create tests after implementation (or during, if TDD)

### After Implementation
- **[Testing Guide](testing.md)** - Parallel test creation pattern
- **[Validation Guide](validation.md)** - Run quality gates before merge

## Quick Reference

### Task Creation Template

```typescript
// 1. Create tasks
TaskCreate({
  subject: "Action to take",
  description: `
Files: list of files
Dependencies: what blocks this
Success criteria: what done looks like
`,
  activeForm: "Action in present continuous"
})

// 2. Define dependencies
TaskUpdate({
  taskId: "X",
  addBlockedBy: ["Y", "Z"]
})

// 3. Start task
TaskUpdate({
  taskId: "X",
  status: "in_progress"
})

// 4. Complete task
TaskUpdate({
  taskId: "X",
  status: "completed"
})
```

### Execution Checklist

- [ ] Exit plan mode (after user says "execute the plan")
- [ ] Read approved plan
- [ ] Create tasks with TaskCreate
- [ ] Define dependencies with TaskUpdate
- [ ] Identify execution waves
- [ ] Start Wave 1 tasks
- [ ] Mark tasks in_progress before starting
- [ ] Implement following approved plan
- [ ] Mark tasks completed when done
- [ ] Move to next wave
- [ ] Create tests (see testing.md)
- [ ] Inform user when done
- [ ] Wait for user verification

## Examples

### Example: Simple Story (2-3 Tasks)

```
Story: "Add user profile display"

Tasks:
1. Add profile repository function (read existing profile)
2. Create profile display component
3. Add to dashboard page

Dependencies:
- Task 2 is independent (just needs mock props)
- Task 3 blocked by Tasks 1 & 2

Execution:
- Wave 1: Task 1
- Wave 2: Task 2 (could do in parallel, but simple enough to do sequentially)
- Wave 3: Task 3
```

### Example: Medium Story (4-6 Tasks)

```
Story: "Add profile editing feature"

Tasks:
1. Add database migration (new fields)
2. Update repository (add update function)
3. Create server action (validation + auth)
4. Create edit form component
5. Create profile page (Server Component)
6. Wire up form submission

Dependencies:
- Task 2 blocked by Task 1
- Task 3 blocked by Task 2
- Task 4 independent
- Task 5 blocked by Task 3
- Task 6 blocked by Tasks 4 & 5

Execution:
- Wave 1: Task 1
- Wave 2: Task 2
- Wave 3: Task 3 AND Task 4 (parallel)
- Wave 4: Task 5
- Wave 5: Task 6
```

### Example: Complex Story (7+ Tasks)

```
Story: "Add friend groups feature"

Tasks:
1. Database schema (groups, memberships)
2. Groups repository
3. Memberships repository
4. Create group server action
5. Join group server action
6. Group list component
7. Group card component
8. Add group button component
9. Groups page (Server Component)
10. Wire up interactions

Dependencies:
- Task 2 blocked by Task 1
- Task 3 blocked by Task 1
- Task 4 blocked by Task 2
- Task 5 blocked by Tasks 2 & 3
- Tasks 6, 7, 8 independent (can be parallel)
- Task 9 blocked by Tasks 4, 5
- Task 10 blocked by Tasks 6, 7, 8, 9

Execution:
- Wave 1: Task 1
- Wave 2: Tasks 2 & 3 (parallel)
- Wave 3: Tasks 4 & 5 (parallel)
- Wave 4: Tasks 6, 7, 8 (parallel - 3 independent components)
- Wave 5: Task 9
- Wave 6: Task 10
```

## Advanced: Subagent Usage in Implementation

For very large stories, you may want to use subagents for parallel implementation. This is advanced and optional.

See **[Subagent Workflows Guide](subagent-workflows.md)** for details on:
- When to use implementation subagents
- How to prepare context for subagents
- Coordination strategies
- Integration patterns

**General guidance:** For most stories, sequential implementation by the main agent is sufficient and preferred. Only use implementation subagents for stories with 8+ well-isolated tasks.

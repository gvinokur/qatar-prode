# Planning Guide

Complete workflow for planning story implementation before writing code.

## Overview

Every story must go through a planning phase before implementation. The plan is committed and reviewed via PR to ensure alignment and gather feedback before coding begins.

## Critical Rules

1. **ALWAYS create plan** at `/plans/STORY-{N}-plan.md` before coding
2. **ALWAYS run plan review subagent** for 2-3 cycles until "no significant concerns"
3. **ALWAYS commit plan and create PR** using a Bash subagent (stay in plan mode)
4. **NEVER EXIT PLAN MODE** until user says "execute the plan"
5. **USE SUBAGENTS FOR GIT OPERATIONS** - Launch Bash subagent to commit/push (you stay in plan mode)
6. **EXIT PLAN MODE = START IMPLEMENTATION** - Clear, unambiguous rule
7. **ITERATE on feedback** - Update plan, use subagent to commit, stay in plan mode

## ⚠️ CRITICAL: NEVER Exit Plan Mode Until "Execute the Plan"

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

## Complete Planning Workflow

### 0. Read This Guide First (MANDATORY)

**🛑 BEFORE DOING ANYTHING - READ THIS ENTIRE GUIDE 🛑**

Before entering plan mode or creating any plan:
1. **Read this file completely**: `docs/claude/planning.md`
2. **Understand the workflow**: All 7 steps below
3. **Note the STOP points**: Where you MUST wait for user
4. **Understand exit rules**: NEVER exit until "execute the plan"

**Why this is critical:**
- You MUST follow the exact workflow below
- Skipping steps or rushing to implementation causes problems
- The user has reported issues with agents jumping ahead
- Reading this first ensures you follow the process correctly

**Checklist before proceeding:**
- [ ] I have read this planning.md guide completely
- [ ] I understand I stay in plan mode until user says "execute the plan"
- [ ] I understand I use subagents for git operations
- [ ] I understand the plan review loop (2-3 cycles)
- [ ] I understand I STOP and WAIT after creating PR

**Only proceed to Step 1 after completing this checklist.**

---

### 1. Enter Plan Mode

Use the EnterPlanMode tool to transition into planning mode:

```typescript
// This gives you access to exploration tools without code editing
EnterPlanMode()
```

### 2. Research & Gather Context

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

### 3. Create Plan Document

Create the plan at `plans/STORY-{N}-plan.md` in the story worktree.

**Location:**
```bash
PLAN_FILE="${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-plan.md"
```

**Use Claude's default plan template** - it includes:
- Story context and objectives
- Acceptance criteria
- Technical approach
- Files to create/modify
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

### 4. Pre-Review Checklist (MANDATORY)

**🛑 STOP - Complete this checklist before launching plan review 🛑**

Before launching the plan reviewer subagent:
- [ ] Plan document is complete with all sections
- [ ] Visual prototypes included (if UI changes)
- [ ] Technical approach is detailed
- [ ] Files to create/modify are listed
- [ ] Testing strategy is comprehensive
- [ ] I am STILL IN PLAN MODE
- [ ] I have NOT exited plan mode
- [ ] I have NOT started implementing

**Only proceed to plan review after completing this checklist.**

---

### 5. Plan Review with Subagent (MANDATORY)

**CRITICAL:** Before committing the plan to PR, you MUST run a Plan Reviewer subagent for 2-3 review cycles.

**Purpose:** Automated review catches feasibility issues, testability concerns, and missing considerations before user review - reducing iteration cycles.

**🛑 BEFORE YOU PROCEED - Answer These Verification Questions: 🛑**

1. **Am I about to launch a Plan Reviewer subagent?** (Answer MUST be YES)
2. **Am I using the Task tool with subagent_type: "general-purpose"?** (Answer MUST be YES)
3. **Am I using model: "haiku"?** (Answer MUST be YES)
4. **Will I run 2-3 review cycles?** (Answer MUST be YES)
5. **Am I trying to review the plan manually instead?** (Answer MUST be NO)

**If ANY answer is wrong, STOP and fix it before proceeding.**

**MANDATORY LOOP - DO NOT SKIP:**

```
Initialize: reviewCycle = 1, maxCycles = 3

WHILE reviewCycle <= maxCycles:
    1. Read current plan
    2. Launch Plan Reviewer subagent
    3. Wait for feedback
    4. IF feedback says "No significant concerns":
         BREAK (plan is ready)
    5. IF feedback has concerns:
         - Update plan with improvements
         - reviewCycle++
         - CONTINUE to next iteration
    6. IF reviewCycle > maxCycles:
         BREAK (diminishing returns)

After loop completes → Proceed to commit plan
```

**Detailed Implementation:**

```typescript
// REVIEW CYCLE 1
console.log("Starting plan review cycle 1...")

const planContent = await Read({
  file_path: `${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-plan.md`
})

// Launch Plan Reviewer subagent (use Haiku for speed/cost)
Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Review implementation plan (Cycle 1)",
  prompt: `Review the implementation plan for story #${STORY_NUMBER}.

This is review cycle 1 of up to 3. Focus on major issues.

Original ticket:
${TICKET_CONTENT}

Implementation plan:
${planContent}

Review criteria:
1. **Feasibility**: Is the technical approach sound? Any missing dependencies or blockers?
2. **Testability**: Can this be easily tested? Are test scenarios clear and comprehensive?
3. **Boundaries**: Are task boundaries well-defined? Clear success criteria for each step?
4. **Risks**: Any potential issues, edge cases, security concerns, or architectural problems?
5. **Quality Gates**: Will this meet SonarCloud requirements (80% coverage on new code, 0 new issues)?
6. **Completeness**: Any gaps in requirements, acceptance criteria, or implementation steps?

Provide specific, constructive feedback. Focus on issues that would cause problems during implementation.
If the plan looks solid, say "No significant concerns."
`
})

// Wait for subagent response and review feedback
// IF feedback says "No significant concerns" → SKIP to Step 5 (commit plan)
// IF feedback has concerns → Update plan, proceed to REVIEW CYCLE 2

// REVIEW CYCLE 2 (if cycle 1 had concerns)
console.log("Plan updated. Starting review cycle 2...")

const updatedPlanContent = await Read({
  file_path: `${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-plan.md`
})

Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Review implementation plan (Cycle 2)",
  prompt: `Review the UPDATED implementation plan for story #${STORY_NUMBER}.

This is review cycle 2. The plan has been updated based on previous feedback.

Implementation plan:
${updatedPlanContent}

Review the updates and check for:
- Were previous concerns addressed?
- Any new issues introduced?
- Any remaining gaps or risks?

If the plan looks solid now, say "No significant concerns."
Otherwise, provide specific feedback.
`
})

// Wait for subagent response
// IF "No significant concerns" → SKIP to Step 5
// IF still has concerns → Update plan, proceed to REVIEW CYCLE 3

// REVIEW CYCLE 3 (if cycle 2 still had concerns)
console.log("Plan updated again. Starting review cycle 3 (final)...")

// Same pattern as cycle 2, but this is the final review
// After cycle 3, proceed to commit regardless (diminishing returns)
```

**Stop conditions:**
- Reviewer says "No significant concerns" → Stop, plan is ready
- OR 3 review cycles completed → Stop (diminishing returns after this)

**DO NOT:**
- ❌ Skip the review loop
- ❌ Stop after only 1 cycle if concerns were raised
- ❌ Continue beyond 3 cycles (over-iteration)

**Example feedback to incorporate:**
```
Reviewer: "Add validation for email uniqueness in the server action.
Consider what happens if user updates email to one that already exists.
Also, test strategy should include testing this edge case."

Main agent:
- Updates "Technical Approach" section with email uniqueness validation
- Updates "Testing Strategy" with edge case test scenario
- Launches second review
```

**Benefits:**
- Catches 2-3 issues per story before user review
- Reduces user review cycles (fewer "did you think about X?" comments)
- Forces consideration of testability and quality gates
- Improves plan quality with minimal overhead

**Cautions:**
- Don't over-iterate (>3 cycles = diminishing returns)
- Reviewer should be constructive, not overly critical
- Main agent still makes final decisions
- This doesn't replace user review - it prepares for it

### 6. Pre-Commit Checklist (MANDATORY)

**🛑 STOP - Complete this checklist before committing plan 🛑**

Before launching Bash subagent to commit and create PR:
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

**CRITICAL: You are STILL IN PLAN MODE. Use a subagent to commit.**

**🛑 BEFORE YOU PROCEED - Answer These Verification Questions: 🛑**

1. **Have I completed the plan review loop (2-3 cycles)?** (Answer MUST be YES)
2. **Am I about to launch a Bash subagent to commit?** (Answer MUST be YES)
3. **Am I using the Task tool with subagent_type: "Bash"?** (Answer MUST be YES)
4. **Am I still in plan mode?** (Answer MUST be YES)
5. **Am I about to exit plan mode to commit?** (Answer MUST be NO)
6. **Am I trying to commit manually with git commands?** (Answer MUST be NO)

**If ANY answer is wrong, STOP and fix it before proceeding.**

**Launch Bash subagent to handle git operations:**

```typescript
// First, fetch the actual issue title for the PR
const issueTitle = await Bash({
  command: `gh issue view ${STORY_NUMBER} --json title --jq '.title'`,
  description: "Get issue title for PR"
})

Task({
  subagent_type: "Bash",
  description: "Commit plan and create PR",
  prompt: `Commit the implementation plan and create a PR.

Execute these commands in sequence:

1. Add plan file:
git -C ${WORKTREE_PATH} add plans/STORY-${STORY_NUMBER}-plan.md

2. Commit with co-author:
git -C ${WORKTREE_PATH} commit -m "docs: add implementation plan for story #${STORY_NUMBER}

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

3. Push to remote:
git -C ${WORKTREE_PATH} push -u origin ${BRANCH_NAME}

4. Create PR with proper issue linking:
gh pr create --base main --head ${BRANCH_NAME} \\
  --title "Plan: ${issueTitle} #${STORY_NUMBER}" \\
  --body "Fixes #${STORY_NUMBER}

## Summary
Implementation plan for the story.

## Plan Document
See \`plans/STORY-${STORY_NUMBER}-plan.md\` for full details.

## Next Steps
- Review and approve plan
- Iterate on plan based on feedback
- Execute plan once approved

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

Report back the PR number and URL.
`
})

// Wait for subagent to complete
// You remain IN PLAN MODE the entire time
```

**CRITICAL: PR Title Format**
- Always use actual issue title (fetch with `gh issue view`)
- Include issue number in title: `#${STORY_NUMBER}` (for easy reference)
- Include `Fixes #${STORY_NUMBER}` in body (for GitHub auto-linking)
- Format: `"Plan: ${issueTitle} #${STORY_NUMBER}"`

**Output to user:**
- PR number and URL
- Plan file location
- Next steps (waiting for review/feedback)

**🛑🛑🛑 CRITICAL CHECKPOINT - STOP AND VERIFY 🛑🛑🛑**

**🚨 MANDATORY: DO NOT PROCEED PAST THIS POINT WITHOUT COMPLETING THIS SECTION 🚨**

**READ THIS ENTIRE SECTION CAREFULLY:**

You have just committed the plan and created a PR. This is a **CRITICAL CHECKPOINT**.

**What you have done:**
- ✅ Created implementation plan
- ✅ Reviewed with subagent (2-3 cycles)
- ✅ Committed plan using Bash subagent
- ✅ Created PR for user review

**What state you are in:**
- ✅ You are STILL IN PLAN MODE (you never exited)
- ✅ The Bash subagent handled git operations
- ✅ You remained in plan mode the entire time

**VERIFICATION CHECKLIST - You MUST answer these questions to yourself:**
- [ ] Did I exit plan mode? (Answer MUST be NO - Type to yourself: "I did not exit plan mode")
- [ ] Am I still in plan mode? (Answer MUST be YES - Type to yourself: "I am in plan mode")
- [ ] Did the user say "execute the plan"? (Answer MUST be NO - Type to yourself: "User has not approved")
- [ ] Have I started implementing? (Answer MUST be NO - Type to yourself: "I have not started implementing")
- [ ] Have I used TaskCreate? (Answer MUST be NO - Type to yourself: "I have not used TaskCreate")
- [ ] Am I reading implementation files? (Answer MUST be NO - Type to yourself: "I am not reading implementation files")

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

**If you are confused about what to do next:**
1. Re-read this section
2. Confirm you are in plan mode
3. Report PR to user and say "Waiting for your review and feedback"
4. Wait for user input
5. Do nothing else

**You are now in the Plan Iteration Phase (see Step 8 below).**

---

### 8. Plan Iteration Phase

**YOU ARE HERE after creating the PR. STAY IN PLAN MODE.**

**ITERATE IN A CYCLE** - This is the key pattern:

**When user provides feedback:**

1. **While IN plan mode (you NEVER exit):**
   - Read the feedback from PR comments or direct messages
   - Update the plan document: `plans/STORY-${STORY_NUMBER}-plan.md`

2. **Launch Bash subagent to commit updates:**
   ```typescript
   Task({
     subagent_type: "Bash",
     description: "Commit plan updates",
     prompt: `Commit the updated plan based on user feedback.

   Execute these commands:

   1. Add updated plan:
   git -C ${WORKTREE_PATH} add plans/STORY-${STORY_NUMBER}-plan.md

   2. Commit:
   git -C ${WORKTREE_PATH} commit -m "docs: update plan based on feedback

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

   3. Push to remote:
   git -C ${WORKTREE_PATH} push
   `
   })

   // Wait for subagent to complete
   // You remain IN PLAN MODE
   ```

3. **Repeat cycle** until user approves with "execute the plan"

**YOU NEVER EXIT PLAN MODE during this iteration cycle. Subagents handle all git operations.**

---

### 9. Pre-Execution Checklist (MANDATORY)

**🛑 STOP - Complete this checklist before exiting plan mode 🛑**

**This checklist runs when user says "execute the plan".**

Before exiting plan mode:
- [ ] User has explicitly said "execute the plan" or similar approval phrase
- [ ] Plan has been reviewed and approved by user
- [ ] All feedback has been incorporated
- [ ] I have read docs/claude/implementation.md completely
- [ ] I understand I will use TaskCreate to define tasks
- [ ] I understand I will set dependencies with TaskUpdate
- [ ] I understand implementation workflow
- [ ] I am ready to start coding (not before!)

**If ANY checkbox is unchecked, DO NOT exit plan mode. WAIT.**

**Only proceed to Step 10 after:**
1. User says "execute the plan"
2. All checklist items are verified
3. You have read implementation.md

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

**Key difference with new approach:**
- You NEVER exited plan mode during iterations (subagents handled commits)
- This is your FIRST and ONLY exit from plan mode
- Exit = clear signal to start implementation
- No ambiguity, no confusion

**AFTER exiting plan mode:**

1. **Read implementation.md**: Before doing ANYTHING, read the implementation guide
2. **Create tasks**: Use TaskCreate to break down the plan
3. **Set dependencies**: Use TaskUpdate to define execution order
4. **Start implementing**: Follow the implementation workflow

**DO NOT:**
- ❌ Start coding immediately after ExitPlanMode
- ❌ Skip reading implementation.md
- ❌ Skip task definition

**Next:** **[Read Implementation Guide First](implementation.md)** before starting implementation.

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
  │ (Write code with TaskCreate)
  │
  v
```

## Common Mistakes

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|------------------|
| Skipping PR for plan | User can't review in familiar interface | Always create PR for plan |
| Confusing iteration exit with final exit | Starting to code during iteration | Exit→Commit→Re-enter during iteration; Final exit only when user says "execute" |
| Starting to code during planning | Premature implementation | Only edit plan document in plan mode |
| Not iterating on feedback | Plan doesn't align with user expectations | Update plan, commit, push, re-enter |
| Forgetting to commit plan updates | Changes not visible in PR | Always exit→commit→re-enter during iteration |
| Staying in plan mode to commit | Can't run git commands in plan mode | Must exit to commit, then re-enter |

## Benefits of This Workflow

1. **User reviews plan in GitHub PR** - Familiar interface with inline comments
2. **Clear approval gate** - Explicit "execute the plan" signal
3. **Iteration is tracked** - All feedback and changes are in PR history
4. **Prevents wasted effort** - No coding until approach is validated
5. **Better alignment** - User and Claude agree on approach before implementation

## Examples

### Good Flow (with new subagent approach)
```
User: "Implement story #42"
Claude: [Checks worktree, enters plan mode, researches, creates plan]
Claude: [STAYS IN PLAN MODE]
Claude: [Runs plan review loop 2-3 times until "no concerns"]
Claude: [Launches Bash subagent to commit plan and create PR #123]
Claude: [STILL IN PLAN MODE after subagent completes]
Claude: "Created plan at plans/STORY-42-plan.md and opened PR #123"

User: "Add consideration for mobile responsive design"
Claude: [IN PLAN MODE - Updates plan document]
Claude: [Launches Bash subagent to commit updated plan]
Claude: [STILL IN PLAN MODE after subagent completes]
Claude: "Updated plan with mobile considerations"

User: "Perfect! Execute the plan"
Claude: [Exits plan mode - ONLY EXIT during entire planning phase]
Claude: [Begins implementation with TaskCreate]
```

### Bad Flow (DON'T DO THIS)
```
User: "Implement story #42"
Claude: [Enters plan mode, creates plan]
Claude: [Exits plan mode to commit]  ❌ Don't exit! Use Bash subagent
Claude: [Re-enters plan mode]  ❌ Unnecessary confusion
```

**OR**

```
User: "Implement story #42"
Claude: [Enters plan mode, creates plan]
Claude: [Runs only 1 plan review cycle]  ❌ Need 2-3 cycles
Claude: [Launches Bash subagent to commit and create PR]
Claude: [Exits plan mode]  ❌ User hasn't said "execute"! Stay in plan mode
```

## Change Plans (Mid-Implementation Replanning)

Sometimes during implementation, significant feedback or discoveries require substantial changes to the approach. This triggers a "change plan" workflow.

### When to Create a Change Plan

Create a change plan when:
- User explicitly says "we need a change plan"
- User provides feedback that significantly changes scope or approach
- You discover technical constraints that require different architecture
- Requirements change beyond original acceptance criteria

**Don't create a change plan for:**
- Small feedback or minor adjustments
- Bug fixes during implementation
- Clarifications that don't change approach

### Change Plan Workflow

**1. User triggers change plan:**
```
User: "We need a change plan for this"
User: "Let's revise the approach based on this feedback"
```

**2. Enter plan mode again:**
```typescript
// Re-enter plan mode to pause implementation
EnterPlanMode()
```

**3. Create change plan document:**
```bash
# Increment change number (1, 2, 3...)
CHANGE_PLAN_FILE="${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-change-1.md"
```

**Change plan structure:**
```markdown
# Change Plan 1: [Story Title] (#STORY_NUMBER)

## Context
Brief summary of why this change plan is needed.

## Changes from Original Plan
- What's changing from the original approach
- What's staying the same

## Revised Technical Approach
[Updated approach based on feedback/discoveries]

## Revised Implementation Steps
[Updated step-by-step plan]

## Impact Assessment
- Files already modified that need changes
- New files needed
- Files that no longer need modification

## Testing Updates
[How testing strategy changes]
```

**4. Commit change plan to same PR (using Bash subagent):**
```typescript
Task({
  subagent_type: "Bash",
  description: "Commit change plan to PR",
  prompt: `Commit the change plan to the existing PR.

Execute these commands:

1. Add change plan:
git -C ${WORKTREE_PATH} add plans/STORY-${STORY_NUMBER}-change-1.md

2. Commit with descriptive message:
git -C ${WORKTREE_PATH} commit -m "docs: add change plan 1 for story #${STORY_NUMBER}

[Brief description of what changed]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

3. Push to same branch (updates existing PR):
git -C ${WORKTREE_PATH} push
`
})

// Wait for subagent to complete
// You remain IN PLAN MODE
```

**5. STAY IN PLAN MODE (you never exited):**
- ❌ DO NOT exit plan mode
- ❌ DO NOT resume coding
- ✅ Iterate on change plan based on feedback
- ✅ Update change plan document as needed

**6. Wait for explicit approval:**
- User says "execute the change plan"
- User says "looks good, proceed with changes"

**7. Exit plan mode and resume implementation:**
```typescript
ExitPlanMode()
```

### Change Plan Numbering

- First change: `plans/STORY-42-change-1.md`
- Second change: `plans/STORY-42-change-2.md`
- Third change: `plans/STORY-42-change-3.md`

Each change plan is a separate file for clear history.

### Example Flow

```
[Initial planning complete, implementation in progress]

User: "Actually, we need to handle offline mode. Let's do a change plan"
Claude: [Enters plan mode, creates change plan document]
Claude: [Launches Bash subagent to commit change plan to PR #123]
Claude: [STAYS IN PLAN MODE after subagent completes]
Claude: "Created change plan at plans/STORY-42-change-1.md and pushed to PR #123"

User: "Add consideration for data sync when coming back online"
Claude: [IN PLAN MODE - Updates change plan document]
Claude: [Launches Bash subagent to commit updates]
Claude: [STAYS IN PLAN MODE after subagent completes]
Claude: "Updated change plan with sync considerations"

User: "Perfect, execute the change plan"
Claude: [Exits plan mode - resumes implementation with new approach]
```

### Benefits

1. **Clear history** - Each change plan is documented
2. **Same PR context** - All planning in one place
3. **Explicit approval** - No surprise mid-implementation pivots
4. **Audit trail** - Can see how approach evolved

## Integration with Other Workflows

- **After:** [Worktree Setup](worktrees.md)
- **Before:** Implementation (see [GitHub Projects Workflow](github-projects-workflow.md))
- **Related:** [Architecture Guide](architecture.md) and [Testing Guide](testing.md)

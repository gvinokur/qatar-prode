# Planning Guide

Complete workflow for planning story implementation before writing code.

## Overview

Every story must go through a planning phase before implementation. The plan is committed and reviewed via PR to ensure alignment and gather feedback before coding begins.

## Critical Rules

1. **ALWAYS create plan** at `/plans/STORY-{N}-plan.md` before coding
2. **ALWAYS commit plan and create PR** for user review
3. **STAY IN PLAN MODE** - Do NOT exit until user says "execute the plan"
4. **NEVER start coding** - Only edit the plan document during this phase
5. **ITERATE on feedback** - Update plan based on user comments, commit changes to same PR

## Complete Planning Workflow

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
- Open questions

### 4. Commit Plan and Create PR

**CRITICAL STEP - Do NOT skip this:**

```bash
# Add plan file
git -C ${WORKTREE_PATH} add plans/STORY-${STORY_NUMBER}-plan.md

# Commit with co-author
git -C ${WORKTREE_PATH} commit -m "docs: add implementation plan for story #${STORY_NUMBER}

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to remote
git -C ${WORKTREE_PATH} push -u origin ${BRANCH_NAME}

# Create PR
gh pr create --base main --head ${BRANCH_NAME} \
  --title "Plan: [Story Title] (#${STORY_NUMBER})" \
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
```

**Output to user:**
- PR number and URL
- Plan file location
- Next steps (waiting for review/feedback)

### 5. Plan Iteration Phase

**ITERATE IN A CYCLE** - This is the key pattern:

**When user provides feedback:**

1. **While IN plan mode:**
   - Read the feedback from PR comments or direct messages
   - Update the plan document: `plans/STORY-${STORY_NUMBER}-plan.md`

2. **Exit plan mode temporarily to commit:**
   ```typescript
   // Exit ONLY to commit the updated plan
   ExitPlanMode()
   ```

3. **Commit and push the updated plan:**
   ```bash
   git -C ${WORKTREE_PATH} add plans/STORY-${STORY_NUMBER}-plan.md
   git -C ${WORKTREE_PATH} commit -m "docs: update plan based on feedback

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   git -C ${WORKTREE_PATH} push
   ```

4. **Re-enter plan mode to continue iteration:**
   ```typescript
   // Return to plan mode to wait for more feedback
   EnterPlanMode()
   ```

5. **Repeat cycle** until user approves with "execute the plan"

**CRITICAL: Exiting plan mode ≠ Starting implementation**
- During iteration: Exit → Commit → Re-enter
- For execution: Exit → Start coding (only when user says "execute the plan")

### 6. Final Exit: Execute the Plan

**THIS IS DIFFERENT from iteration exits - this is the final approval to start coding.**

**Wait for explicit approval signal from user:**
- User says "execute the plan"
- User says "start implementation"
- User says "looks good, proceed"
- User says "approved, go ahead"

**ONLY when you receive this signal:**
```typescript
// Exit plan mode for the LAST TIME to begin implementation
ExitPlanMode()
```

**Then start coding according to the approved plan.**

**Reminder:** During iteration (step 5), you exit temporarily to commit plan updates, then re-enter plan mode. This final exit is different - it means you're starting implementation.

## Plan Iteration Cycle (Visual)

```
┌─────────────────────────────────────────┐
│         PLAN ITERATION CYCLE            │
└─────────────────────────────────────────┘

IN PLAN MODE ──────────────────────┐
  │                                │
  │ User provides feedback         │
  │ Update plan document           │
  │                                │
  v                                │
EXIT PLAN MODE (temporarily)       │
  │                                │
  │ Commit updated plan            │
  │ Push to PR                     │
  │                                │
  v                                │
RE-ENTER PLAN MODE ────────────────┘
  │
  │ Repeat until user approves
  │
  v
User says "EXECUTE THE PLAN" ──────────────┐
  │                                         │
  v                                         │
FINAL EXIT PLAN MODE                        │
  │                                         │
  │ START IMPLEMENTATION                    │
  │ (Write code)                            │
  └─────────────────────────────────────────┘
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

### Good Flow (with iteration cycle)
```
User: "Implement story #42"
Claude: [Checks worktree, enters plan mode, researches, creates plan]
Claude: [Exits plan mode temporarily]
Claude: [Commits plan, creates PR #123]
Claude: [Re-enters plan mode]
Claude: "Created plan at plans/STORY-42-plan.md and opened PR #123"

User: "Add consideration for mobile responsive design"
Claude: [IN PLAN MODE - Updates plan document]
Claude: [Exits plan mode temporarily to commit]
Claude: [Commits updated plan, pushes to PR #123]
Claude: [Re-enters plan mode]
Claude: "Updated plan with mobile considerations"

User: "Perfect! Execute the plan"
Claude: [Exits plan mode for FINAL time]
Claude: [Begins implementation - writes code]
```

### Bad Flow (DON'T DO THIS)
```
User: "Implement story #42"
Claude: [Enters plan mode, creates plan]
Claude: "Here's my plan: [shows plan content]"
Claude: [Exits plan mode and starts coding]  ❌ NO PR, no approval!
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

**4. Commit change plan to same PR:**
```bash
# Add change plan
git -C ${WORKTREE_PATH} add plans/STORY-${STORY_NUMBER}-change-1.md

# Commit with descriptive message
git -C ${WORKTREE_PATH} commit -m "docs: add change plan 1 for story #${STORY_NUMBER}

[Brief description of what changed]

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to same branch (updates existing PR)
git -C ${WORKTREE_PATH} push
```

**5. STAY IN PLAN MODE:**
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
Claude: [Enters plan mode]
Claude: "Created change plan at plans/STORY-42-change-1.md and pushed to PR #123"
User: "Add consideration for data sync when coming back online"
Claude: [Updates change plan, commits, pushes]
User: "Perfect, execute the change plan"
Claude: [Exits plan mode, resumes implementation with new approach]
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

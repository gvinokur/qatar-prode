---
name: git-ops
description: Git operations skill — use when committing plans, creating PRs, or completing stories. Contains exact Bash subagent templates for plan commits (DRAFT PR), plan iteration commits, CI/CD polling, story complete workflow, and post-merge main worktree update.
---

# Git Ops (Git Operations Skill)

Exact templates for all git operations in the story workflow. Referenced from `/architect` Steps 7-8, `/code-reviewer`, and `github-projects-workflow.md`.

---

## Section 1: Commit Plan and Create DRAFT PR

**When to use:** After plan review completes in `/architect` Step 7.

**CRITICAL:** You must be in plan mode. This is a Bash subagent — you stay in plan mode while it runs.

```typescript
// First, fetch the actual issue title for the PR
const issueTitle = await Bash({
  command: `gh issue view ${STORY_NUMBER} --json title --jq '.title'`,
  description: "Get issue title for PR"
})

Task({
  subagent_type: "general-purpose",
  description: "Commit plan and create DRAFT PR",
  prompt: `Commit the implementation plan and create a DRAFT PR.

Execute these commands in sequence:

1. Add plan file:
git -C ${WORKTREE_PATH} add plans/STORY-${STORY_NUMBER}-plan.md

2. Commit with co-author:
git -C ${WORKTREE_PATH} commit -m "docs: add implementation plan for story #${STORY_NUMBER}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

3. Push to remote:
git -C ${WORKTREE_PATH} push -u origin ${BRANCH_NAME}

4. Create DRAFT PR with proper issue linking:
gh pr create --draft --base main --head ${BRANCH_NAME} \\
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
- **Always create as DRAFT** (`--draft` flag)

After this runs:
- Report PR number and URL to user
- Say "Waiting for your review and feedback"
- STOP and WAIT (see `/architect` Step 7 CRITICAL CHECKPOINT)

---

## Section 2: Plan Iteration Commits

**When to use:** After updating the plan document based on user feedback in `/architect` Step 8.

**CRITICAL:** You must be in plan mode. This is a Bash subagent — you stay in plan mode while it runs.

```typescript
Task({
  subagent_type: "general-purpose",
  description: "Commit plan updates",
  prompt: `Commit the updated plan based on user feedback.

Execute these commands:

1. Add updated plan:
git -C ${WORKTREE_PATH} add plans/STORY-${STORY_NUMBER}-plan.md

2. Commit:
git -C ${WORKTREE_PATH} commit -m "docs: update plan based on feedback

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"

3. Push to remote:
git -C ${WORKTREE_PATH} push
`
})

// Wait for subagent to complete
// You remain IN PLAN MODE
```

After this runs:
- Confirm to user that plan has been updated
- STOP and WAIT for more feedback or "execute the plan"

---

## Section 3: Wait for CI/CD

**When to use:** After pushing implementation commits, waiting for Vercel and SonarCloud.

```bash
# Wait for all PR checks to complete (Vercel + SonarCloud)
./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}

# Custom timeout (default: 1800 seconds / 30 minutes)
./scripts/github-projects-helper pr wait-checks ${PR_NUMBER} --timeout 3600

# Custom poll interval (default: 30 seconds)
./scripts/github-projects-helper pr wait-checks ${PR_NUMBER} --poll-interval 60
```

**Once checks complete, immediately fetch SonarCloud issues:**
```bash
./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}
```

**What `pr wait-checks` does:**
1. Polls PR checks every 30 seconds
2. Monitors Vercel deployment status
3. Monitors SonarCloud analysis status
4. Displays live status updates
5. Exits when both checks complete
6. Reports final success/failure

**Example output:**
```
Waiting for PR #45 checks to complete...
[30s] Vercel: IN_PROGRESS SonarCloud: QUEUED
[60s] Vercel: IN_PROGRESS SonarCloud: IN_PROGRESS
[90s] Vercel: COMPLETED SonarCloud: IN_PROGRESS
[120s] Vercel: COMPLETED SonarCloud: COMPLETED

✓ Vercel: SUCCESS
✓ SonarCloud: SUCCESS
```

---

## Section 4: Story Complete Workflow

**When to use:** After all quality gates pass and user wants to merge.

**Prerequisites before running:**
- ✅ `gh pr ready ${PR_NUMBER}` already run (PR not in draft)
- ✅ SonarCloud: 0 new issues
- ✅ Coverage: ≥80% on new code
- ✅ Section 7.5 Documentation Audit complete (see `/code-reviewer`)
- ✅ User explicitly requested merge

```bash
# Complete the story (merge PR, close issue, cleanup worktree)
# IMPORTANT: Include --project flag to enable automatic status updates
./scripts/github-projects-helper story complete ${STORY_NUMBER} --project ${PROJECT_NUMBER}

# Specify PR number explicitly (otherwise auto-detected)
./scripts/github-projects-helper story complete ${STORY_NUMBER} --pr ${PR_NUMBER} --project ${PROJECT_NUMBER}

# Use regular merge instead of squash
./scripts/github-projects-helper story complete ${STORY_NUMBER} --merge-method merge --project ${PROJECT_NUMBER}
```

**What this command does:**
1. Finds the PR for the story (if not specified)
2. Verifies PR is open and mergeable
3. Merges the PR with specified method (default: squash)
4. Deletes the feature branch automatically
5. Closes the issue with reason "completed"
6. Updates project status to "Done"
7. Removes the worktree directory
8. Deletes the local branch
9. Prunes worktree references

After story complete, run Section 5 (post-merge main worktree update).

---

## Section 5: Post-Merge Main Worktree Update

**When to use:** Immediately after `story complete` runs.

**WHY THIS MATTERS:**
- ✅ Keeps main worktree in sync with remote
- ✅ Next story worktree will branch from latest code
- ✅ Prevents conflicts and confusion
- ✅ Ensures fresh start for next story

**Common mistake:**
- ❌ Starting new story without updating main → branching from old commit
- ✅ Update main first → new story branches from latest code

```bash
cd /Users/gvinokur/Personal/qatar-prode && git pull origin main
```

Full sequence:
```bash
# Switch to main worktree
cd /Users/gvinokur/Personal/qatar-prode

# Verify you're on main branch
git branch --show-current

# Pull latest changes from remote
git pull origin main

# Verify you're on the latest commit
git log --oneline -1
```

**When to do this:**
- Immediately after running `./scripts/github-projects-helper story complete`
- After any PR is merged to main
- Before starting work on a new story

---

## Section 6: Story Lifecycle Commands

### View Project Status

```bash
# Get comprehensive project statistics
./scripts/github-projects-helper projects stats 1
```

Provides:
- Total items count
- Breakdown by status (Todo, In Progress, Done)
- Breakdown by priority with emojis
- Breakdown by milestone

### Get Candidate Stories

```bash
# Get top candidate stories (automatically prioritized)
./scripts/github-projects-helper stories suggest 1

# Filter by milestone
./scripts/github-projects-helper stories suggest 1 --milestone "Sprint 1-2"

# Filter by priority
./scripts/github-projects-helper stories suggest 1 --priority Critical

# Customize number of suggestions
./scripts/github-projects-helper stories suggest 1 --limit 10
```

**Automatic Prioritization:** Script uses scoring algorithm:
- Priority weight: Critical (10), High (7), Medium (5), Low (3)
- Effort bonus: Low effort (3), Medium (2), High (1)
- Higher scores = better candidates (quick wins prioritized)

### Start a Story

```bash
# Start work on a story (all-in-one command)
# IMPORTANT: Include --project flag to enable automatic status updates
./scripts/github-projects-helper story start 42 --project 1
```

**What this command does:**
1. Creates worktree at `../qatar-prode-story-<STORY_NUMBER>`
2. Creates feature branch `feature/story-<STORY_NUMBER>`
3. Copies `.env.local` to the new worktree
4. Copies `.claude/` directory to the new worktree
5. Assigns the issue to current user
6. Updates project status to "In Progress"

### Manual Status Updates

If automatic status updates fail:

```bash
# Update story status manually
./scripts/github-projects-helper status update 42 "In Progress" --project 1
./scripts/github-projects-helper status update 42 "Pending Review" --project 1
./scripts/github-projects-helper status update 42 "Done" --project 1
```

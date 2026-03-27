# GitHub Projects Workflow

Complete workflow for managing stories using GitHub Projects and the helper script.

## Overview

This project uses GitHub Projects for project management, tracking epics, stories, and milestones. The workflow is streamlined using a Python helper script (`scripts/github-projects-helper`).

**Helper Script Benefits:**
- ✅ Single commands instead of 5-10 bash invocations
- ✅ Reduced token usage in Claude conversations
- ✅ Automatic prioritization of candidate stories
- ✅ Built-in error handling with clear, colored output
- ✅ JSON output for programmatic parsing
- ✅ Comprehensive workflow from story start to completion

## Prerequisites

- Python 3.7+ installed
- GitHub CLI (`gh`) must be installed and authenticated
- User must have write access to the repository and projects
- Repository must be linked to GitHub Projects

## Terminology

- **Project**: A GitHub Project board (e.g., "Qatar Prode v2.0")
- **Epic**: Large work items (issues with label "epic")
- **Story**: Individual work items (issues with labels "story" or "user-story")
- **Milestone**: Grouping of related issues with a target date
- **Project Fields**: Custom fields on GitHub Projects (Status, Priority, Size, etc.)

## Complete Workflow

### 1. Querying Project Status

**Get open projects overview:**

```bash
# List all open projects with item counts and details
./scripts/github-projects-helper projects list
```

Present summary including:
- Project name and number
- Total issues/items
- Project description and URL

**Get detailed project information:**

```bash
# Get comprehensive project statistics
./scripts/github-projects-helper projects stats <PROJECT_NUMBER>
```

This provides:
- Total items count
- Breakdown by status (Todo, In Progress, Done)
- Breakdown by priority (Critical, High, Medium, Low) with emojis
- Breakdown by milestone with item counts
- Breakdown by effort estimation
- Breakdown by category

### 2. Creating New Stories

**CRITICAL REQUIREMENT:** When creating new stories, you MUST set all three project fields:
1. **Priority** (Critical, High, Medium, Low)
2. **Effort** (High 5d-10d, Medium 3d-5d, Low 1d-2s)
3. **Category** (see available categories below)

**Why this is critical:**
- Stories without these fields won't appear in prioritization queries
- The helper script's automatic prioritization relies on these fields
- Project statistics and planning depend on complete field data
- Label-based categorization (e.g., `priority/high`) does NOT work - fields must be set properly

**Available Field Values:**

**Priority:**
- 🔥🔥🔥 Critical - Blocks users, security issues, critical bugs
- 🔥🔥 High - Important features, major improvements
- 🔥 Medium - Nice-to-have features, minor improvements
- ⭐ Low - Polish, optimization, future enhancements

**Effort:**
- High 5d-10d - Large features requiring architectural changes
- Medium 3d-5d - Standard features with multiple components
- Low 1d-2s - Small features, bug fixes, simple improvements

**Category:**
- Onboarding - User registration, first-time experience
- Prediction - Game prediction entry and management
- Mobile - Mobile-specific improvements
- Scoring - Scoring calculations and display
- Visualization - Charts, graphs, data visualization
- Aesthetics - Visual design, UI polish
- Technical UX - Performance, error handling, loading states
- i18n - Internationalization and localization
- Admin - Backoffice and admin-facing features

**Creating a new story:**

```bash
# 1. Create the issue using gh CLI
gh issue create --title "[STORY] Your Story Title" \
  --body "Story description..." \
  --label "story" \
  --project "Qatar Prode v2.0"

# 2. Add to project and set fields via GitHub UI or API
# Note: The gh CLI doesn't support setting custom project fields during creation
# You must set Priority, Effort, and Category through the GitHub Projects UI
```

**After creation via UI:**
1. Create the issue through GitHub Projects interface
2. Immediately set Priority, Effort, and Category fields
3. Add appropriate labels (story, epic, bug, etc.)
4. Assign to a milestone if applicable

**Creating New Categories:**

If you need a category that doesn't exist, you can add it programmatically:

```bash
# Add a new category option to the project
# Example: Adding "Performance" category
gh api graphql -f query='
mutation {
  updateProjectV2Field(input: {
    fieldId: "PVTSSF_lAHOACX4Hs4BMsVnzg751Kk"
    singleSelectOptions: [
      {name: "Onboarding", color: BLUE, description: ""}
      {name: "Prediction", color: GREEN, description: ""}
      {name: "Mobile", color: YELLOW, description: ""}
      {name: "Scoring", color: ORANGE, description: ""}
      {name: "Visualization", color: RED, description: ""}
      {name: "Aesthetics", color: PINK, description: ""}
      {name: "Technical UX", color: PURPLE, description: ""}
      {name: "i18n", color: GRAY, description: ""}
      {name: "Admin", color: BLUE, description: ""}
      {name: "Performance", color: GREEN, description: ""}
    ]
  }) {
    projectV2Field {
      ... on ProjectV2SingleSelectField {
        name
        options { id name color }
      }
    }
  }
}'
```

**Important:** When adding a new category:
1. Include ALL existing categories in the mutation (shown above)
2. Add your new category at the end
3. Choose an appropriate color
4. Update this documentation with the new category

**Common Mistake to Avoid:**

❌ **WRONG:** Creating stories with `priority/high`, `effort/medium`, `category/prediction` labels
✅ **CORRECT:** Setting Priority field = "High", Effort field = "Medium 3d-5d", Category field = "Prediction"

If stories were created with labels instead of fields, use the fix script:
```bash
./scripts/fix-project-fields.sh
```

### 3. Proposing Stories to Work On

```bash
# Get top candidate stories (automatically prioritized)
./scripts/github-projects-helper stories suggest <PROJECT_NUMBER>

# Filter by milestone
./scripts/github-projects-helper stories suggest <PROJECT_NUMBER> --milestone "Sprint 1-2"

# Filter by priority
./scripts/github-projects-helper stories suggest <PROJECT_NUMBER> --priority Critical

# Customize number of suggestions
./scripts/github-projects-helper stories suggest <PROJECT_NUMBER> --limit 10
```

**Automatic Prioritization:**
The script uses a scoring algorithm:
- **Priority weight**: Critical (10), High (7), Medium (5), Low (3)
- **Effort bonus**: Low effort (3), Medium (2), High (1)
- **Combined score**: Higher scores = better candidates (quick wins prioritized)

**Output includes:**
- Story number and title
- Priority with emoji indicators
- Effort estimation
- Milestone association
- Calculated score

Only suggests stories with status "Todo" or "Ready".

### 4. Starting Work on a Story

```bash
# Start work on a story (all-in-one command)
# IMPORTANT: Include --project flag to enable automatic status updates
./scripts/github-projects-helper story start <STORY_NUMBER> --project <PROJECT_NUMBER>
```

**What this command does:**
1. Creates worktree at `../qatar-prode-story-<STORY_NUMBER>`
2. Creates feature branch `feature/story-<STORY_NUMBER>`
3. Copies `.env.local` to the new worktree
4. Assigns the issue to current user (`@me`)
5. Updates project status to "In Progress"
6. Outputs JSON with worktree path, branch name, and issue details

**Example output:**
```json
{
  "worktree_path": "/Users/username/qatar-prode-story-123",
  "branch_name": "feature/story-123",
  "issue_number": 123,
  "issue_title": "Progressive Onboarding Flow"
}
```

Present to user:
- Worktree location
- Branch name
- Issue title
- Next steps (plan the work)

### 5. Planning Work

Invoke `/architect` — it contains the complete planning workflow (Steps 0-10), including context gathering, plan document creation, plan review via `/plan-reviewer`, and committing the plan as a DRAFT PR via `/git-ops` Section 1.

### 6. Executing the Plan

Invoke `/implementer` — it contains the complete implementation workflow (Sections 1-9), including task definition, wave-based execution, validation, and Vercel Preview deployment.

### 7. Pushing and Waiting for Checks

**Push to remote:**
```bash
git -C ${WORKTREE_PATH} push
```

**Wait for deployment checks:**
```bash
# Wait for Vercel and SonarCloud checks (single command)
./scripts/github-projects-helper pr wait-checks <PR_NUMBER>

# Custom timeout (default: 1800 seconds / 30 minutes)
./scripts/github-projects-helper pr wait-checks <PR_NUMBER> --timeout 3600

# Custom poll interval (default: 30 seconds)
./scripts/github-projects-helper pr wait-checks <PR_NUMBER> --poll-interval 60
```

**What this command does:**
1. Polls PR checks every 30 seconds
2. Monitors Vercel deployment status
3. Monitors SonarCloud analysis status
4. Displays live status updates
5. Exits when both checks complete
6. Reports final success/failure with colors
7. Outputs JSON with check results

**Example output:**
```
Waiting for PR #45 checks to complete...
[30s] Vercel: IN_PROGRESS SonarCloud: QUEUED
[60s] Vercel: IN_PROGRESS SonarCloud: IN_PROGRESS
[90s] Vercel: COMPLETED SonarCloud: IN_PROGRESS
[120s] Vercel: COMPLETED SonarCloud: COMPLETED

✓ Vercel: SUCCESS
✓ SonarCloud: SUCCESS

{
  "vercel": "SUCCESS",
  "sonar": "SUCCESS"
}
```

### 8. Handling Failed Checks

**Vercel deployment failure:**
```bash
# Get deployment logs
gh pr view ${PR_NUMBER} --json statusCheckRollup --jq '.statusCheckRollup[] | select(.name | contains("vercel"))'
```

Common causes:
- Build errors (TypeScript, linting)
- Missing environment variables
- Import/module resolution issues

Propose fixes:
- Review build logs
- Check TypeScript: `npm run build` in worktree
- Verify imports and dependencies
- Fix and commit, then wait for re-deployment

**SonarCloud failure:**
```bash
# Get SonarCloud report URL
gh pr view ${PR_NUMBER} --json statusCheckRollup --jq '.statusCheckRollup[] | select(.name | contains("SonarCloud")) | .targetUrl'
```

Common issues:
- Code coverage below 60%
- Code smells or bugs detected
- Security vulnerabilities
- Duplicated code

Propose fixes:
- Add missing tests
- Refactor code smells
- Fix security issues
- Reduce duplication
- Fix and commit, then wait for re-analysis

**When checks pass:**
Present to user:
- ✓ Vercel deployment successful: [Preview URL]
- ✓ SonarCloud quality gate passed: [Report URL]
- Code is ready for final review
- User can verify functionality on preview deployment

### 9. Merging and Completing Story

```bash
# Complete the story (all-in-one command)
# IMPORTANT: Include --project flag to enable automatic status updates
./scripts/github-projects-helper story complete <STORY_NUMBER> --project <PROJECT_NUMBER>

# Specify PR number explicitly (otherwise auto-detected)
./scripts/github-projects-helper story complete <STORY_NUMBER> --pr <PR_NUMBER> --project <PROJECT_NUMBER>

# Use regular merge instead of squash
./scripts/github-projects-helper story complete <STORY_NUMBER> --merge-method merge --project <PROJECT_NUMBER>
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

**Example output:**
```
Completing story #123...
ℹ Finding PR for story...
✓ Found PR #45
ℹ Checking if PR is mergeable...
ℹ Merging PR #45 with squash...
✓ PR #45 merged and branch deleted
ℹ Closing issue #123...
✓ Issue #123 closed
ℹ Cleaning up worktree at /Users/username/qatar-prode-story-123...
✓ Worktree removed

Story Complete! 🎉
  Story #123 has been merged and closed
  Worktree cleaned up
  Ready to start the next story!
```

## Common Patterns

**Maintain context:**
- Story number
- Worktree path
- Branch name
- PR number (once created)
- Project and field IDs

**Error handling:**
- Check authentication: `gh auth status`
- Verify project access
- Check for existing worktrees
- Verify field IDs for status updates

**Best practices:**
- Always confirm destructive operations
- Provide clear status updates at each step
- Include relevant links in summaries
- Use TodoWrite for multi-step workflows
- Keep user informed about wait times

## Manual Status Updates

If automatic status updates fail:

```bash
# Update story status manually
./scripts/github-projects-helper status update <STORY_NUMBER> "Status Name" --project <PROJECT_NUMBER>

# Examples:
./scripts/github-projects-helper status update 42 "In Progress" --project 1
./scripts/github-projects-helper status update 42 "Pending Review" --project 1
./scripts/github-projects-helper status update 42 "Done" --project 1
```

### 10. Post-Merge Cleanup: Update Main Worktree

**CRITICAL:** After merging a story, the main branch on GitHub is updated but your local main worktree is still on the old commit. You MUST update the main worktree to stay in sync.

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

**Why this matters:**
- ✅ Keeps main worktree in sync with remote
- ✅ Next story worktree will branch from latest code
- ✅ Prevents conflicts and confusion
- ✅ Ensures fresh start for next story

**When to do this:**
- Immediately after running `./scripts/github-projects-helper story complete`
- After any PR is merged to main
- Before starting work on a new story

**Common mistake:**
- ❌ Starting new story without updating main → branching from old commit
- ✅ Update main first → new story branches from latest code

## GitHub API Reference

For manual operations, see `scripts/README.md` for:
- Finding project and field IDs
- Updating project fields with GraphQL
- Working with GitHub Projects API

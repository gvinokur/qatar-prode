# Scripts Directory

Utility scripts for development workflow automation.

## github-projects-helper

A comprehensive Python CLI tool for GitHub Projects operations that streamlines the story-based development workflow.

### Prerequisites

- Python 3.7+
- GitHub CLI (`gh`) installed and authenticated
- Repository must be linked to GitHub Projects

### Installation

The script is ready to use directly:

```bash
./scripts/github-projects-helper --help
```

### Usage

#### List Projects

```bash
# List all open projects
./scripts/github-projects-helper projects list

# Get detailed statistics for a project
./scripts/github-projects-helper projects stats 1
```

**Output:**
- Total items
- Breakdown by status (Todo, In Progress, Done)
- Breakdown by priority (Critical, High, Medium, Low)
- Breakdown by milestone
- Breakdown by effort estimation

#### Suggest Stories

```bash
# Suggest top 5 candidate stories from a project
./scripts/github-projects-helper stories suggest 1

# Filter by milestone
./scripts/github-projects-helper stories suggest 1 --milestone "Sprint 1-2"

# Filter by priority
./scripts/github-projects-helper stories suggest 1 --priority Critical

# Limit results
./scripts/github-projects-helper stories suggest 1 --limit 10
```

**Scoring Algorithm:**
Stories are scored based on:
- Priority: Critical (10), High (7), Medium (5), Low (3)
- Effort: Low (3), Medium (2), High (1)
- Quick wins (high priority + low effort) score highest

#### Start Working on a Story

```bash
# Start work on story #123
./scripts/github-projects-helper story start 123

# Include project number for status updates
./scripts/github-projects-helper story start 123 --project 1
```

**What it does:**
1. Creates a new worktree at `../qatar-prode-story-123`
2. Creates feature branch `feature/story-123`
3. Copies `.env.local` to the new worktree
4. Assigns the issue to you (@me)
5. Outputs JSON with worktree path and branch name

**Output JSON:**
```json
{
  "worktree_path": "/Users/username/qatar-prode-story-123",
  "branch_name": "feature/story-123",
  "issue_number": 123,
  "issue_title": "Progressive Onboarding Flow"
}
```

#### Wait for PR Checks

```bash
# Wait for Vercel and SonarCloud checks on PR #45
./scripts/github-projects-helper pr wait-checks 45

# Custom timeout (default: 1800 seconds)
./scripts/github-projects-helper pr wait-checks 45 --timeout 3600

# Custom poll interval (default: 30 seconds)
./scripts/github-projects-helper pr wait-checks 45 --poll-interval 60
```

**What it does:**
1. Polls PR checks every 30 seconds (configurable)
2. Monitors Vercel deployment status
3. Monitors SonarCloud analysis status
4. Exits when both checks complete
5. Displays final success/failure status
6. Outputs JSON with check results

**Output JSON:**
```json
{
  "vercel": "SUCCESS",
  "sonar": "SUCCESS"
}
```

#### Complete a Story

```bash
# Complete story #123 (auto-detects PR)
./scripts/github-projects-helper story complete 123

# Specify PR number explicitly
./scripts/github-projects-helper story complete 123 --pr 45

# Use merge commit instead of squash
./scripts/github-projects-helper story complete 123 --merge-method merge
```

**What it does:**
1. Finds the PR for the story (if not specified)
2. Verifies PR is mergeable
3. Merges the PR with specified method (default: squash)
4. Deletes the feature branch
5. Closes the issue with reason "completed"
6. Removes the worktree
7. Prunes worktree references

### Integration with Claude Code

The script is designed to be called from Claude Code with single commands instead of multiple tool invocations:

**Before (multiple commands):**
```bash
gh project item-list 1 --owner gvinokur --format json
# Parse JSON, calculate stats, format output
# Multiple jq commands to aggregate data
```

**After (single command):**
```bash
./scripts/github-projects-helper projects stats 1
```

**Before (story start - 8+ commands):**
```bash
gh issue view 123
git worktree add -b feature/story-123 ../qatar-prode-story-123
cp .env.local ../qatar-prode-story-123/.env.local
gh issue edit 123 --add-assignee @me
# GraphQL mutation for project status...
```

**After (single command):**
```bash
./scripts/github-projects-helper story start 123
```

### Example Workflow

```bash
# 1. List projects
./scripts/github-projects-helper projects list

# 2. Get project stats
./scripts/github-projects-helper projects stats 1

# 3. Suggest stories for Sprint 1-2
./scripts/github-projects-helper stories suggest 1 --milestone "Sprint 1-2"

# 4. Start work on story #12
./scripts/github-projects-helper story start 12 --project 1

# 5. ... do the work, commit, push ...

# 6. Wait for CI checks
./scripts/github-projects-helper pr wait-checks 45

# 7. Complete the story
./scripts/github-projects-helper story complete 12
```

### Error Handling

The script includes comprehensive error handling:
- Validates GitHub CLI authentication
- Checks for existing worktrees before creating
- Verifies PR is mergeable before merging
- Provides clear error messages with colors
- Exits with appropriate status codes

### Color Output

The script uses ANSI color codes for better readability:
- 🟢 Green: Success messages
- 🔴 Red: Error messages
- 🟡 Yellow: Warning messages
- 🔵 Cyan: Info messages
- Bold: Headers and emphasis

### Troubleshooting

**"Command failed: gh"**
- Ensure GitHub CLI is installed: `brew install gh`
- Authenticate: `gh auth login`

**"Worktree already exists"**
- Remove existing worktree: `git worktree remove ../qatar-prode-story-123`
- Or use a different story number

**"No PR found for story"**
- Ensure you've pushed your branch and created a PR
- Or specify PR number explicitly: `--pr 45`

### Development

To modify the script:

1. Edit `scripts/github-projects-helper`
2. Test with various commands
3. The script outputs JSON for programmatic parsing when appropriate

### Future Enhancements

Potential improvements:
- [ ] Project field updates via GraphQL (Status, Priority)
- [ ] Support for multiple repository configurations
- [ ] Caching of project/issue data for faster operations
- [ ] Interactive mode with prompts
- [ ] Integration with Jira/Linear for cross-platform syncing
- [ ] Automated plan generation from issue templates

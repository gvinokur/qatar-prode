# Git Worktrees Guide

Git worktrees allow working on multiple branches simultaneously in different directories. This is essential for parallelizing development tasks.

## Why Worktrees?

**Use cases:**
- Work on multiple features simultaneously without branch switching
- Run parallel test suites on different branches
- Compare implementations side-by-side
- Keep stable branch running while developing
- Review PRs without disrupting current work

## ⚠️ CRITICAL: Pre-Implementation Checklist

**BEFORE implementing any plan or writing code, ALWAYS run:**

```bash
git worktree list
git branch --show-current
```

### Decision Rules

1. ✅ If story worktree exists (e.g., `/qatar-prode-story-42`) → Work there using absolute paths
2. ❌ NEVER implement stories in main worktree (`/qatar-prode`)
3. ❌ NEVER commit to `main` branch unless user explicitly says "commit to main"
4. ✅ When user says "implement the plan" → verify worktree first, ASK if unclear

### Red Flags (you're doing it wrong)

- Current branch is `main` while implementing a story
- Using relative paths instead of absolute paths like `/qatar-prode-story-42/app/file.ts`
- Working in `/qatar-prode` directory instead of `/qatar-prode-story-N`

## Creating Worktrees

### Using the Helper Script (Recommended)

```bash
# Start work on a story (creates worktree automatically)
./scripts/github-projects-helper story start <STORY_NUMBER> --project <PROJECT_NUMBER>
```

This command:
1. Creates worktree at `../qatar-prode-story-<STORY_NUMBER>`
2. Creates feature branch `feature/story-<STORY_NUMBER>`
3. **Copies `.env.local` to the new worktree** (critical!)
4. Assigns the issue to current user
5. Updates project status to "In Progress"

### Manual Creation

```bash
# Create new worktree with a new branch
git worktree add -b feature/branch-name ../qatar-prode-branch-name

# Create worktree from existing branch
git worktree add ../qatar-prode-branch-name existing-branch-name

# CRITICAL: Copy environment files to new worktree
cp .env.local ../qatar-prode-branch-name/.env.local
```

## Environment Files

**⚠️ ALWAYS copy `.env.local` after creating a worktree**

- Each worktree is a separate directory and needs its own `.env.local` file
- Without environment variables, the app will fail with `missing_connection_string` errors
- The `.env.local` file is gitignored, so it must be manually copied

```bash
cp .env.local /path/to/worktree/.env.local
```

## Managing Worktrees

```bash
# List all worktrees
git worktree list

# Remove a worktree (after deleting the directory)
git worktree remove ../qatar-prode-branch-name

# Prune stale worktree administrative files
git worktree prune
```

## Working with Files in Worktrees

### Important Behavior with Claude Code

- The Bash tool maintains the original working directory as its default
- Commands do NOT persist directory changes between tool invocations
- **Always use absolute paths** when working with worktree files

### Correct Usage

```bash
# ✅ CORRECT: Use absolute paths
npm test /Users/username/qatar-prode-story-42/app/file.ts
git -C /Users/username/qatar-prode-story-42 status
git -C /Users/username/qatar-prode-story-42 add .
git -C /Users/username/qatar-prode-story-42 commit -m "message"
```

### Incorrect Usage

```bash
# ❌ INCORRECT: Relying on cd between commands
cd /Users/username/qatar-prode-story-42
npm test  # This runs in the original directory, not the worktree!
git add .  # This affects the wrong directory!
```

## Commit Safety Checks

**⚠️ ALWAYS verify branch before committing:**

```bash
# Check current branch in worktree
git -C ${WORKTREE_PATH} branch --show-current

# If result is "main" → STOP and ASK USER
# If result is feature branch → Proceed with commit
```

**NEVER commit to main unless user explicitly says "commit to main" or "push to main"**

## Complete Workflow Example

```bash
# 1. Start story (creates worktree)
./scripts/github-projects-helper story start 42 --project 1

# Output shows worktree path
# WORKTREE_PATH="/Users/username/qatar-prode-story-42"

# 2. Verify setup
git worktree list
ls -la ${WORKTREE_PATH}/.env.local  # Verify .env.local exists

# 3. Work with absolute paths
git -C ${WORKTREE_PATH} status
npm test ${WORKTREE_PATH}/app/file.test.ts

# 4. Before committing, verify branch
git -C ${WORKTREE_PATH} branch --show-current
# Expected: "feature/story-42"

# 5. Commit (only when user asks)
git -C ${WORKTREE_PATH} add .
git -C ${WORKTREE_PATH} commit -m "feat: implement story

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 6. Push to remote
git -C ${WORKTREE_PATH} push -u origin feature/story-42

# 7. Complete story (cleanup)
./scripts/github-projects-helper story complete 42 --project 1
```

## Troubleshooting

### "missing_connection_string" error
- **Cause**: Missing `.env.local` in worktree
- **Fix**: `cp .env.local ${WORKTREE_PATH}/.env.local`

### Commands affecting wrong directory
- **Cause**: Using relative paths or `cd` between commands
- **Fix**: Use absolute paths with `git -C` flag

### Accidentally on `main` branch
- **Cause**: Didn't verify branch before implementing
- **Fix**: Create feature branch: `git -C ${WORKTREE_PATH} checkout -b feature/story-N`

### Worktree already exists
- **Cause**: Previous worktree not cleaned up
- **Fix**: Remove old worktree: `git worktree remove ${WORKTREE_PATH}` or use `story complete` command

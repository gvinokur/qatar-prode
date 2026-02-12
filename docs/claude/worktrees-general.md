# Git Worktrees Guide (General)

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

1. ✅ If feature worktree exists (e.g., `/project-feature-x`) → Work there using absolute paths
2. ❌ NEVER implement features in main worktree (e.g., `/project`)
3. ❌ NEVER commit to `main` branch unless explicitly instructed
4. ✅ When starting implementation → verify worktree first, ASK if unclear

### Red Flags (you're doing it wrong)

- Current branch is `main` while implementing a feature
- Using relative paths instead of absolute paths like `/project-feature-x/src/file.ts`
- Working in main worktree directory instead of feature worktree

## Creating Worktrees

### Basic Creation

```bash
# Create new worktree with a new branch
git worktree add -b feature/branch-name ../project-branch-name

# Create worktree from existing branch
git worktree add ../project-branch-name existing-branch-name
```

### Naming Conventions

**Recommended patterns:**

```bash
# Feature branches
git worktree add -b feature/user-auth ../project-user-auth

# Bug fixes
git worktree add -b fix/login-error ../project-fix-login

# Story/ticket numbers
git worktree add -b feature/ticket-123 ../project-ticket-123
```

**Path patterns:**
- `../project-name-feature-name` - Sibling directory to main repo
- `/path/to/worktrees/feature-name` - Dedicated worktrees directory

## Required Files for Worktrees

**⚠️ ALWAYS copy gitignored configuration files after creating a worktree:**

### Common Files to Copy

1. **Environment Variables**
   - `.env`, `.env.local`, `.env.development`, etc.
   - Configuration files with secrets, API keys, database URLs
   - Each worktree needs its own copy to run independently

   ```bash
   cp .env.local ../project-feature/.env.local
   ```

2. **Editor/Tool Configuration** (if gitignored)
   - `.vscode/` settings (if not committed)
   - `.idea/` settings (JetBrains IDEs)
   - `.claude/` permissions (for Claude Code)
   - Any other local tool configuration

   ```bash
   cp -r .vscode ../project-feature/.vscode
   cp -r .claude ../project-feature/.claude
   ```

3. **Build Artifacts or Cache** (if needed)
   - `node_modules/` - Usually reinstall with `npm install` instead
   - `.next/`, `dist/`, `build/` - Usually rebuild instead of copy

### Project-Specific Files Checklist

Create a checklist for your project:

```bash
# Example for Node.js project
cp .env.local ../project-feature/.env.local
cp .npmrc ../project-feature/.npmrc  # If it contains auth tokens
cp -r .vscode ../project-feature/.vscode
cd ../project-feature && npm install
```

## Managing Worktrees

```bash
# List all worktrees
git worktree list

# Remove a worktree
git worktree remove ../project-feature

# Remove with force (if there are uncommitted changes)
git worktree remove --force ../project-feature

# Prune stale worktree administrative files
git worktree prune

# Move a worktree to a new location
git worktree move ../project-old-name ../project-new-name
```

## Working with Files in Worktrees

### Important Behavior with Claude Code

- The Bash tool maintains the original working directory as its default
- Commands do NOT persist directory changes between tool invocations
- **Always use absolute paths** when working with worktree files

### Correct Usage

```bash
# ✅ CORRECT: Use absolute paths
npm test /Users/username/project-feature/src/file.test.ts
git -C /Users/username/project-feature status
git -C /Users/username/project-feature add .
git -C /Users/username/project-feature commit -m "message"

# Or use full path with commands
cd /Users/username/project-feature && npm test && git status

# For multiple commands, chain with && in one call
git -C /path/to/worktree add . && \
  git -C /path/to/worktree commit -m "message" && \
  git -C /path/to/worktree push
```

### Incorrect Usage

```bash
# ❌ INCORRECT: Relying on cd between separate commands
cd /Users/username/project-feature
npm test  # This runs in the original directory, not the worktree!
git add .  # This affects the wrong directory!
```

### Using Environment Variables for Paths

Store the worktree path in a variable for convenience:

```bash
# Set once
WORKTREE_PATH="/Users/username/project-feature"

# Use throughout session
git -C ${WORKTREE_PATH} status
npm --prefix ${WORKTREE_PATH} test
git -C ${WORKTREE_PATH} add .
```

## Commit Safety Checks

**⚠️ ALWAYS verify branch before committing:**

```bash
# Check current branch in worktree
git -C ${WORKTREE_PATH} branch --show-current

# If result is "main" or "master" → STOP and ASK USER
# If result is feature branch → Proceed with commit
```

**NEVER commit to main/master unless explicitly instructed**

## Complete Workflow Example

```bash
# 1. Create worktree for new feature
FEATURE_NAME="user-authentication"
WORKTREE_PATH="../project-${FEATURE_NAME}"
git worktree add -b feature/${FEATURE_NAME} ${WORKTREE_PATH}

# 2. Copy required files
cp .env.local ${WORKTREE_PATH}/.env.local
cp -r .vscode ${WORKTREE_PATH}/.vscode
cp -r .claude ${WORKTREE_PATH}/.claude

# 3. Install dependencies
cd ${WORKTREE_PATH} && npm install

# 4. Verify setup
git worktree list
ls -la ${WORKTREE_PATH}/.env.local  # Verify .env.local exists

# 5. Work with absolute paths
git -C ${WORKTREE_PATH} status
npm --prefix ${WORKTREE_PATH} test

# 6. Before committing, verify branch
git -C ${WORKTREE_PATH} branch --show-current
# Expected: "feature/user-authentication"

# 7. Commit (only when ready)
git -C ${WORKTREE_PATH} add .
git -C ${WORKTREE_PATH} commit -m "feat: add user authentication"

# 8. Push to remote
git -C ${WORKTREE_PATH} push -u origin feature/${FEATURE_NAME}

# 9. After PR is merged, cleanup
git worktree remove ${WORKTREE_PATH}
git branch -d feature/${FEATURE_NAME}
```

## Automation Patterns

### Create Helper Script

Create a project-specific script to automate worktree creation:

```bash
#!/bin/bash
# scripts/worktree-create.sh

FEATURE_NAME=$1
REPO_NAME="project"  # Your project name
WORKTREE_PATH="../${REPO_NAME}-${FEATURE_NAME}"

# Create worktree
git worktree add -b feature/${FEATURE_NAME} ${WORKTREE_PATH}

# Copy required files
cp .env.local ${WORKTREE_PATH}/.env.local
cp -r .vscode ${WORKTREE_PATH}/.vscode
cp -r .claude ${WORKTREE_PATH}/.claude

# Install dependencies
cd ${WORKTREE_PATH} && npm install

echo "Worktree created at: ${WORKTREE_PATH}"
echo "Branch: feature/${FEATURE_NAME}"
```

Usage:
```bash
./scripts/worktree-create.sh user-authentication
```

### Cleanup Helper Script

```bash
#!/bin/bash
# scripts/worktree-remove.sh

FEATURE_NAME=$1
REPO_NAME="project"
WORKTREE_PATH="../${REPO_NAME}-${FEATURE_NAME}"

# Remove worktree
git worktree remove ${WORKTREE_PATH}

# Delete branch (if merged)
git branch -d feature/${FEATURE_NAME}

echo "Worktree removed: ${WORKTREE_PATH}"
```

## Best Practices

### 1. One Feature, One Worktree
- Create separate worktrees for each feature/bugfix
- Avoid mixing multiple features in one worktree
- Keep worktrees short-lived (delete after merge)

### 2. Consistent Naming
- Use consistent branch naming: `feature/`, `fix/`, `refactor/`
- Use descriptive worktree directory names
- Include ticket/issue numbers if applicable

### 3. Environment Isolation
- Each worktree should run independently
- Copy all necessary configuration files
- Test that the app runs in the worktree before starting work

### 4. Regular Cleanup
- Remove worktrees after PRs are merged
- Prune stale references: `git worktree prune`
- Keep your worktree list clean: `git worktree list`

### 5. Absolute Paths Always
- Never rely on `cd` persisting between commands
- Use `git -C <path>` or `npm --prefix <path>`
- Store worktree path in environment variable for convenience

## Troubleshooting

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| App won't start in worktree | Missing `.env.local` or config files | Copy required files from main worktree |
| Commands affecting wrong directory | Using relative paths or `cd` | Use absolute paths with `git -C` or `npm --prefix` |
| Accidentally on `main` branch | Didn't verify branch before implementing | `git -C ${WORKTREE_PATH} checkout -b feature/name` |
| Worktree already exists | Previous worktree not cleaned up | `git worktree remove ${WORKTREE_PATH}` or delete directory then `git worktree prune` |
| Can't remove worktree | Uncommitted changes exist | Either commit changes or use `--force` flag |
| Node modules issues | Dependencies out of sync | Re-run `npm install` in worktree |

### Error Messages

**"'path' is already checked out at 'other-path'"**
- You're trying to checkout a branch that's already checked out in another worktree
- Solution: Use a different branch name or remove the existing worktree

**"fatal: 'path' already exists"**
- Directory already exists at that location
- Solution: Use a different path or remove the existing directory

**"fatal: invalid reference: feature/name"**
- Branch doesn't exist yet
- Solution: Use `-b` flag to create new branch: `git worktree add -b feature/name path`

## Advanced Usage

### Working with Multiple Worktrees

```bash
# List all worktrees with branches
git worktree list

# Work on multiple features simultaneously
WORKTREE_1="../project-feature-a"
WORKTREE_2="../project-feature-b"

# Run tests in parallel
npm --prefix ${WORKTREE_1} test &
npm --prefix ${WORKTREE_2} test &
wait

# Compare implementations
diff -r ${WORKTREE_1}/src ${WORKTREE_2}/src
```

### Sharing Builds Between Worktrees

For large `node_modules/` or build caches, consider:

```bash
# Use npm workspaces or pnpm (shares dependencies)
# Or symlink node_modules (be careful!)
ln -s /main/project/node_modules ${WORKTREE_PATH}/node_modules

# Better: Use pnpm which handles this automatically
```

### Remote Worktrees

```bash
# Checkout remote branch into worktree
git worktree add -b feature/remote-branch ../project-remote origin/feature/remote-branch

# Or track remote branch
git worktree add ../project-remote
cd ../project-remote
git checkout -b feature/remote-branch origin/feature/remote-branch
```

## Integration with CI/CD

Worktrees are local development tools. For CI/CD:
- CI/CD systems typically use fresh clones
- No special worktree configuration needed in CI
- Each CI job runs in isolation automatically

## Summary

**Key Principles:**
1. ✅ Always use absolute paths
2. ✅ Verify branch before committing
3. ✅ Copy required config files
4. ✅ One feature per worktree
5. ✅ Clean up after merging

**Common Pattern:**
```bash
git worktree add -b feature/name ../project-name
cp .env.local ../project-name/.env.local
git -C ../project-name status
git -C ../project-name add .
git -C ../project-name commit -m "message"
git worktree remove ../project-name
```

This approach keeps your main working directory stable while allowing parallel development on multiple features.

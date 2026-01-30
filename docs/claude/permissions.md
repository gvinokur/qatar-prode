# Claude Code Permissions Guide

Guide for configuring Claude Code permissions to enable autonomous operation without repetitive permission prompts.

## Overview

Claude Code uses a permission system to control what operations it can perform. Without proper permissions configured, Claude will ask for approval for every file operation, bash command, etc., which interrupts the workflow.

## Configuration File

**Location:** `.claude/settings.local.json` (in project root)

**This file is:**
- ✅ Local to your machine (safe to customize)
- ✅ Gitignored (won't be committed)
- ✅ Per-project configuration

## Recommended Permissions

**For qatar-prode project:**

```json
{
  "permissions": {
    "allow": [
      "WebSearch",
      "WebFetch(domain:github.com)",
      "WebFetch(domain:raw.githubusercontent.com)",
      "WebFetch(domain:vercel.link)",
      "WebFetch(domain:vercel.com)",
      "WebFetch(domain:sonarcloud.io)",
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "Bash(git *)",
      "Bash(npm *)",
      "Bash(gh *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(find *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(mv *)",
      "Bash(./scripts/*)"
    ]
  }
}
```

## Permission Types Explained

### File Operations (Broad Permissions)

**`Read`** - Read any file in the project
- No need to approve every file read
- Safe: Read-only operation

**`Write`** - Write new files in the project
- Needed for creating components, tests, etc.
- Safe: You review before commits

**`Edit`** - Edit existing files in the project
- Needed for modifying code
- Safe: You review before commits

**`Glob`** - Search for files by pattern
- Needed for finding files (e.g., `**/*.tsx`)
- Safe: Read-only operation

**`Grep`** - Search file contents
- Needed for code search
- Safe: Read-only operation

### Bash Commands (Pattern-Based Permissions)

**`Bash(git *)`** - All git commands
- Covers: git status, git add, git commit, git push, git diff, etc.
- Needed for: Version control operations
- Safe: Won't force push or do destructive operations (guidelines prevent this)

**`Bash(npm *)`** - All npm commands
- Covers: npm run test, npm run build, npm run lint, etc.
- Needed for: Running scripts, testing, building
- Safe: Just runs scripts defined in package.json

**`Bash(gh *)`** - All GitHub CLI commands
- Covers: gh pr create, gh issue view, gh pr merge, etc.
- Needed for: PR operations, issue management
- Safe: Operations on GitHub, not local files

**`Bash(ls *)`, `Bash(cat *)`, `Bash(find *)`** - Basic utilities
- Needed for: File system exploration
- Safe: Read-only operations

**`Bash(mkdir *)`, `Bash(cp *)`, `Bash(mv *)`** - File operations
- Needed for: Directory creation, copying files
- Safe: You review before commits

**`Bash(./scripts/*)`** - Project scripts
- Covers: All scripts in the scripts/ directory
- Needed for: github-projects-helper and other tooling
- Safe: Project-specific utilities you control

### Web Access (Domain-Specific Permissions)

**`WebSearch`** - Search the web
- Needed for: Research, finding documentation
- Safe: Read-only

**`WebFetch(domain:...)`** - Fetch from specific domains
- Needed for: Fetching docs, checking APIs, reading issues
- Safe: Read-only, restricted to specific domains

## What This Enables

**With these permissions, Claude can:**
- ✅ Read any file in the project without asking
- ✅ Write/edit files without asking (you still review before commit)
- ✅ Run git commands without asking
- ✅ Run npm scripts (test, build, lint) without asking
- ✅ Use GitHub CLI without asking
- ✅ Search files and content without asking
- ✅ Run project scripts without asking

**What it CANNOT do (still requires approval):**
- ❌ Operations outside these patterns
- ❌ Destructive bash commands (rm, etc.) - not granted
- ❌ Operations outside project directory
- ❌ Access to system files

## Safety Considerations

### Why These Permissions Are Safe

1. **Scoped to project**: Permissions only apply to the current project directory
2. **Review before commit**: You test locally before any commit
3. **Guidelines prevent abuse**: CLAUDE.md guidelines prevent destructive operations
4. **Git safety net**: All changes are tracked, can be reverted
5. **No destructive commands**: Permissions don't include rm, format, etc.

### What You Should NOT Grant

**Dangerous patterns to avoid:**
- ❌ `Bash(rm *)` - File deletion
- ❌ `Bash(sudo *)` - System admin operations
- ❌ `Bash(chmod *)` - Permission changes
- ❌ Broad patterns on sensitive commands

### Best Practices

1. **Start with recommended permissions** (above)
2. **Add specific domains** as needed for WebFetch
3. **Review .claude/settings.local.json** periodically
4. **Don't commit this file** (already in .gitignore)
5. **Grant permissions per project** (each project has its own)

## Adding New Permissions

**When Claude asks for permission repeatedly:**

1. Note the operation it's requesting
2. Add a pattern to `.claude/settings.local.json`
3. Restart the session (or wait for next session)

**Example:**
```
Claude asks: "Permission to run: Bash(npx vitest run)"
```

**Add to settings:**
```json
"Bash(npx *)"
```

## Worktree Permissions

**Worktrees need their own `.claude/` directory:**
- Each worktree is a separate directory
- Claude Code looks for settings in the current working directory
- The `.claude/` directory must be copied to each worktree

**Automatic copying (using helper script):**
```bash
./scripts/github-projects-helper story start 42 --project 1
# Automatically copies .claude/ to new worktree
```

**Manual copying (if creating worktree manually):**
```bash
git worktree add -b feature/story-42 ../qatar-prode-story-42
cp -r .claude ../qatar-prode-story-42/.claude
cp .env.local ../qatar-prode-story-42/.env.local
```

**Why this is needed:**
- Permissions are per-directory, not per-git-repository
- Without `.claude/` in the worktree, Claude will ask for permissions for every operation
- The helper script handles this automatically

## Troubleshooting

### Claude Still Asking for Permissions

**Possible causes:**

1. **Settings not loaded**: Restart Claude session
2. **Typo in permission**: Check JSON syntax
3. **Wrong pattern**: Pattern doesn't match operation
4. **Subagent permissions**: Subagents may need explicit permissions

**Solution for subagents:**
When launching subagents that need permissions:
```typescript
Task({
  subagent_type: "Bash",
  allowed_tools: ["Bash(git *)"], // Grant specific permissions
  // ...
})
```

### Permission Denied Errors

**If you see errors like "permission denied":**
- Check file system permissions (not Claude permissions)
- Ensure you have write access to the directory
- Check if files are locked or in use

## Updating Permissions

**To modify permissions:**

1. Edit `.claude/settings.local.json`
2. Save the file
3. Permissions take effect in next session (or restart current session)

**To reset to defaults:**
Delete `.claude/settings.local.json` and Claude will recreate it with minimal permissions on next ask.

## Example: Full Configuration

**For a typical Next.js project like qatar-prode:**

```json
{
  "permissions": {
    "allow": [
      "WebSearch",
      "WebFetch(domain:github.com)",
      "WebFetch(domain:vercel.com)",
      "WebFetch(domain:sonarcloud.io)",
      "WebFetch(domain:docs.anthropic.com)",
      "WebFetch(domain:nextjs.org)",
      "WebFetch(domain:react.dev)",
      "Read",
      "Write",
      "Edit",
      "Glob",
      "Grep",
      "Bash(git *)",
      "Bash(npm *)",
      "Bash(npx *)",
      "Bash(gh *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(find *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(mv *)",
      "Bash(./scripts/*)",
      "Bash(node *)",
      "Bash(tsc *)"
    ]
  }
}
```

## Integration with Workflow

**These permissions enable the documented workflows:**

1. **Planning Phase**: Read files, commit with git, create PR with gh
2. **Implementation Phase**: Write/edit files, run tests, build
3. **Testing Phase**: Create test files, run npm test
4. **Validation Phase**: Run lint, build, commit, push

**Without proper permissions:** Claude would ask for approval at every step, breaking the autonomous workflow.

**With proper permissions:** Claude can execute the entire workflow smoothly, only asking for your input at critical decision points (approve plan, fix issues, etc.).

## Quick Start

**For new developers on this project:**

1. Clone the repository
2. The `.claude/settings.local.json` is already gitignored
3. Copy the recommended permissions (from this doc) into `.claude/settings.local.json`
4. Start working - Claude will have proper permissions

**For other projects:**

Create `.claude/settings.local.json` in the project root with similar patterns adjusted for that project's needs.

## Related Documentation

- **[CLAUDE.md](../../CLAUDE.md)** - Main project guidelines
- **[Git Worktrees Guide](worktrees.md)** - Working with multiple branches
- **[GitHub Projects Workflow](github-projects-workflow.md)** - Using helper scripts

## Summary

**Key Takeaways:**
- ✅ Configure `.claude/settings.local.json` with broad permissions for autonomous operation
- ✅ Permissions are safe (scoped to project, you review before commits)
- ✅ Eliminates repetitive permission prompts
- ✅ Enables Claude to follow documented workflows smoothly
- ✅ Per-project configuration (each project can have different permissions)

With proper permissions configured, Claude Code works much more autonomously while still maintaining safety through code review and guidelines.

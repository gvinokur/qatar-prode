# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# 🛑🛑🛑 STOP - READ THIS FIRST - STOP 🛑🛑🛑

## BEFORE YOU DO ANYTHING - READ THIS SECTION COMPLETELY

**If user says "implement story #42" or similar, you MUST follow this EXACT sequence:**

### THE ONLY VALID WORKFLOW:

```
1. READ docs/claude/planning.md COMPLETELY - NOT OPTIONAL
   ↓
   planning.md contains ALL the details on HOW to:
   - Use Plan Reviewer subagent (Step 5 - MANDATORY)
   - Use Bash subagent for git operations (Step 7 - MANDATORY)
   - Complete all checklists (Steps 4, 6, 9)
   - Handle iteration loop (Step 8)
   ↓
2. EnterPlanMode (NEVER exit until user says "execute the plan")
   ↓
3. Create plan + visual prototypes (if UI changes)
   ↓
4. MANDATORY: Launch Plan Reviewer SUBAGENT (2-3 cycles)
   HOW: See planning.md Step 5 for complete implementation
   ↓
5. MANDATORY: Launch BASH SUBAGENT to commit plan and create PR
   HOW: See planning.md Step 7 for complete implementation
   WHY: You STAY in plan mode while subagent handles git
   ↓
6. STOP ⛔ STAY IN PLAN MODE ⛔ WAIT FOR USER
   ↓
7. Iterate on feedback using BASH SUBAGENT
   HOW: See planning.md Step 8
   ↓
8. User says "execute the plan" (ONLY THEN proceed)
   ↓
9. READ docs/claude/implementation.md COMPLETELY
   ↓
10. ExitPlanMode (ONLY exit in entire planning phase)
   ↓
11. Use TaskCreate to define tasks
   ↓
12. Implement
```

### CRITICAL - WHY YOU MUST READ PLANNING.MD

**If you skip reading planning.md, you will:**
- ❌ Not know HOW to use Plan Reviewer subagent
- ❌ Not know HOW to use Bash subagent for commits
- ❌ Exit plan mode when you shouldn't
- ❌ Skip mandatory checklists
- ❌ Start implementing before user approval

**planning.md contains:**
- ✅ Exact subagent prompts and parameters
- ✅ Complete review loop implementation (2-3 cycles)
- ✅ Complete git subagent commands
- ✅ All mandatory checklists
- ✅ Critical checkpoints with verification questions

**This section does NOT duplicate planning.md - it tells you to READ IT.**

### CRITICAL - YOU MUST STOP AFTER CREATING PR (STEP 6)

**After you create the PR, you MUST:**
- ✅ STAY in plan mode
- ✅ WAIT for user to review the plan
- ✅ WAIT for user to say "execute the plan"

**After you create the PR, you MUST NOT:**
- ❌ Ask "would you like to proceed?"
- ❌ Ask "should I start implementation?"
- ❌ Exit plan mode
- ❌ Start implementing
- ❌ Use TaskCreate
- ❌ Read implementation files

### IF YOU ARE CONFUSED ABOUT WHAT TO DO:

**Ask yourself:**
1. Did the user say "execute the plan"?
   - If NO → STOP, stay in plan mode, WAIT
   - If YES → Read implementation.md, then proceed

2. Have I created a PR with the plan?
   - If NO → Create it first (with Bash subagent)
   - If YES → STOP, stay in plan mode, WAIT for user

3. Am I in plan mode?
   - If YES and user hasn't said "execute" → WAIT
   - If NO and user said "execute" → Good, proceed to implementation

**THE GOLDEN RULE: WHEN IN DOUBT, STOP AND WAIT FOR USER INPUT.**

---

## ⚠️ Critical Rules

1. **NEVER implement stories in main worktree** (`/qatar-prode`) - Always use story worktrees (see [worktrees.md](docs/claude/worktrees.md))
2. **NEVER commit to `main` branch** unless user explicitly says "commit to main" (see worktrees.md "Commit Safety Checks")
3. **ALWAYS use absolute paths** when working with worktree files (see worktrees.md "Working with Files in Worktrees")
4. **ALWAYS copy `.env.local` and `.claude/`** to new worktrees (automated by helper script - see worktrees.md "Required Files")
5. **NEVER commit without user verification** - User must test locally first
6. **NEVER ask "would you like to proceed?" after creating plan PR** - Just WAIT for user (see planning.md Step 7 "CRITICAL CHECKPOINT")

## Permissions Configuration

**Location:** `.claude/settings.local.json` (already configured with project permissions)

**What's enabled:**
- File operations: Read, Write, Edit, Glob, Grep (all project files)
- Git commands: All git operations
- NPM commands: test, build, lint, scripts
- GitHub CLI: PR operations, issue management
- Project scripts: All scripts in ./scripts/

**See:** [Permissions Guide](docs/claude/permissions.md) for details on configuration

**This enables autonomous operation without repetitive permission prompts.**

## Planning Phase (MANDATORY before implementation)

### 🛑 FIRST ACTION: Use Read Tool to Load Planning Guide

**YOUR FIRST ACTION when user says "implement story":**

```typescript
// Before doing ANYTHING else, read the planning guide
Read({
  file_path: "/Users/gvinokur/Personal/qatar-prode/docs/claude/planning.md"
})
```

**This is NOT optional. Planning.md contains:**
- Complete 10-step workflow (you need ALL steps)
- HOW to use Plan Reviewer subagent (Step 5 - exact prompts)
- HOW to use Bash subagent for commits (Step 7 - exact commands)
- Mandatory checklists at each transition (Steps 4, 6, 9)
- Critical checkpoints where you MUST STOP

**Without reading planning.md, you WILL:**
- ❌ Skip mandatory subagents
- ❌ Exit plan mode when you shouldn't
- ❌ Not know when to STOP and WAIT
- ❌ Start implementing before approval

### Critical Rules
1. **ALWAYS read planning.md Step 0 first** - Before entering plan mode
2. **ALWAYS create plan** at `/plans/STORY-{N}-plan.md` - See planning.md Step 3
3. **ALWAYS include visual prototypes** for UI changes - See planning.md Step 3.1 (MANDATORY for UI Changes)
4. **ALWAYS run plan review subagent for 2-3 cycles** - See planning.md Step 5 (MANDATORY LOOP)
5. **ALWAYS commit plan using Bash subagent** - See planning.md Step 7 (Commit Plan and Create PR)
6. **NEVER EXIT PLAN MODE** until user says "execute the plan" - See planning.md "CRITICAL: NEVER Exit Plan Mode"
7. **USE SUBAGENTS FOR GIT OPERATIONS** - See planning.md Step 7 (Launch Bash subagent)
8. **COMPLETE CHECKLISTS** at each checkpoint - See planning.md Steps 4, 6, 9 (Pre-Review, Pre-Commit, Pre-Execution)
9. **EXIT PLAN MODE = START IMPLEMENTATION** - Simple, unambiguous rule

### Process Overview

**Complete workflow:** [Planning Guide](docs/claude/planning.md) (10 steps)

**Key phases:**

1. **Enter plan mode** → See planning.md Step 1
2. **Research & create plan** → See planning.md Steps 2-3 (include visual prototypes for UI changes - Step 3.1)
3. **Run plan review subagent** → See planning.md Step 5 (2-3 cycles until "no significant concerns")
4. **Commit plan with Bash subagent** → See planning.md Step 7 (PR format: "Plan: ${issueTitle} #${STORY_NUMBER}")
5. **🛑 CRITICAL CHECKPOINT** → See planning.md Step 7 "CRITICAL CHECKPOINT - STOP AND VERIFY"
   - STAY in plan mode, WAIT for user review
   - Complete verification checklist
   - Do NOT exit plan mode, do NOT start implementation
6. **Iterate on feedback** → See planning.md Step 8 (Plan Iteration Phase)
   - Update plan, use Bash subagent to commit
   - Repeat until user says "execute the plan"
7. **When user says "execute the plan"** → See planning.md Steps 9-10
   - Complete pre-execution checklist
   - Read [docs/claude/implementation.md](docs/claude/implementation.md) COMPLETELY
   - Exit plan mode (ONLY exit during entire planning phase)
   - Follow implementation workflow

**Mid-implementation replanning:**
- If significant feedback requires approach changes, create a "change plan"
- Enter plan mode again, create `/plans/STORY-{N}-change-1.md`
- Use Bash subagent to commit to same PR
- Iterate, wait for "execute the change plan"

## Implementation Phase (After plan approval)

### 🛑 BEFORE STARTING: Read the Implementation Guide

**MANDATORY:** You should ONLY start implementation after:
- ✅ Planning phase is complete
- ✅ User explicitly said "execute the plan"
- ✅ You have exited plan mode (final exit)

**READ [docs/claude/implementation.md](docs/claude/implementation.md) COMPLETELY**

### Critical Rules
1. **ALWAYS read implementation.md first** - Before starting to code
2. **ALWAYS define tasks using TaskCreate** - Break down plan into atomic tasks (see implementation.md Section 2)
3. **ALWAYS set dependencies using TaskUpdate** - Define blockedBy/blocks relationships (see implementation.md Section 2)
4. **ALWAYS use absolute paths** - When working in worktrees (see [worktrees.md](docs/claude/worktrees.md))
5. **ALWAYS follow the approved plan** - No scope creep
6. **ALWAYS mark tasks in_progress/completed** - Track progress with TaskUpdate
7. **NEVER commit without user verification** - User tests locally first

### Process Overview

**Complete workflow:** [Implementation Guide](docs/claude/implementation.md)

**Key phases:**

1. **Exit plan mode** → implementation.md Section 1 (final exit when user says "execute the plan")
2. **Define tasks with dependencies** → implementation.md Section 2 (use TaskCreate/TaskUpdate)
3. **Implement in execution waves** → implementation.md Sections 3-4 (parallel execution where possible)
4. **Create tests in parallel** → See [testing.md](docs/claude/testing.md) "Parallel Test Creation"
5. **Wait for user to test** → Do NOT commit until user verifies

**For task parallelization and subagent patterns:** See [subagent-workflows.md](docs/claude/subagent-workflows.md)

## Testing (Parallel test creation)

**Complete guide:** [Testing Guide](docs/claude/testing.md)

**Critical rules:**
1. **ALWAYS create tests** - Every story requires unit tests
2. **80% coverage on new code** - SonarCloud enforces this
3. **Parallelize test creation** - Use subagents for independent test files (see testing.md "Parallel Test Creation")
4. **Follow testing conventions** - See testing.md for patterns and best practices

**Parallel test creation example:**
Launch multiple subagents in parallel (single message, multiple Task calls) to create tests for independent features. See testing.md for detailed workflow.

## Validation & Quality Gates (MANDATORY before merge)

### Critical Rules
1. **ONLY validate when user says "code looks good" or "I'm satisfied"** - Not before
2. **0 new SonarCloud issues of ANY severity** - No excuses, fix ALL issues
3. **80% coverage on new code** - SonarCloud enforces this
4. **NEVER auto-fix issues** - Show user, ask permission to fix

### Process Overview

**Complete workflow:** [Validation Guide](docs/claude/validation.md)

**Key steps:**
1. **Verify user satisfaction** → See validation.md Section 1
2. **Run tests** → See validation.md Section 2: `npm run test`
3. **Run linter** → See validation.md Section 3: `npm run lint`
4. **Build project** → See validation.md Section 4: `npm run build`
5. **Commit and push** → See validation.md Section 5 (git operations)
6. **Wait for CI/CD** → See validation.md Section 6 (use `./scripts/github-projects-helper pr wait-checks`)
7. **Analyze SonarCloud** → See validation.md Section 7 (use `./scripts/github-projects-helper pr sonar-issues`)
8. **Fix issues if needed** → See validation.md Section 8 (show user, ask permission)

**For detailed SonarCloud analysis and issue resolution:** See validation.md complete workflow

## Quick Reference

### Essential Commands
```bash
# Development
npm run dev              # Start dev server (https://localhost:3000)
npm run build            # Production build
npm run test             # Run all tests (Vitest)
npm run lint             # Run ESLint

# Pre-Implementation Verification (MANDATORY before coding)
git worktree list        # Check existing worktrees
git branch --show-current # Verify current branch

# GitHub Projects Workflow (see docs/claude/github-projects-workflow.md)
./scripts/github-projects-helper projects stats 1          # View project status
./scripts/github-projects-helper stories suggest 1         # Get candidate stories
./scripts/github-projects-helper story start 42 --project 1   # Start story (creates worktree)
./scripts/github-projects-helper pr wait-checks 45         # Wait for CI/CD
./scripts/github-projects-helper pr sonar-issues 45        # Get SonarCloud issues
./scripts/github-projects-helper story complete 42 --project 1 # Merge & cleanup
```

### Quick Links

For detailed guidance, see:

- **[Planning Guide](docs/claude/planning.md)** - Plan creation, plan review subagent, PR workflow, iteration
- **[Implementation Guide](docs/claude/implementation.md)** - Task definition, dependencies, execution waves, coding practices
- **[Testing Guide](docs/claude/testing.md)** - Parallel test creation, testing conventions, requirements
- **[Validation Guide](docs/claude/validation.md)** - Quality gates, SonarCloud checks, pre-merge validation
- **[Permissions Guide](docs/claude/permissions.md)** - Configure Claude Code permissions for autonomous operation
- **[Subagent Workflows Guide](docs/claude/subagent-workflows.md)** - Quick reference for all subagent patterns
- **[Git Worktrees Guide](docs/claude/worktrees.md)** - Worktree setup, management, safety checks
- **[GitHub Projects Workflow](docs/claude/github-projects-workflow.md)** - Complete story workflow from start to completion
- **[Architecture Guide](docs/claude/architecture.md)** - Stack, patterns, server/client boundaries
- **[Helper Script Docs](scripts/README.md)** - Full documentation for `github-projects-helper`

## Project Context

- **Framework**: Next.js 15.3 with App Router
- **Database**: PostgreSQL with Kysely ORM
- **Auth**: NextAuth.js v5
- **UI**: Material-UI v7
- **Testing**: Vitest (80% coverage on new code)
- **Deployment**: Vercel (auto-deploy on push to main)

## Decision Tree: What Phase Am I In?

Use this to identify which phase you're in and which guide to follow:

```
User says "implement story #42"
    ↓
Check worktree status:
git worktree list && git branch --show-current
    ↓
┌─────────────────────────────────────┐
│ Story worktree exists?              │
│ (e.g., /qatar-prode-story-42)      │
└─────────────────────────────────────┘
    ↓                    ↓
   YES                  NO
    ↓                    ↓
Set WORKTREE_PATH    Create worktree:
                     ./scripts/github-projects-helper story start 42 --project 1
                     (See docs/claude/worktrees.md)
    ↓
    └────────────────────┘
             ↓
┌─────────────────────────────────────┐
│        PHASE 1: PLANNING            │
│  📖 READ planning.md COMPLETELY     │
└─────────────────────────────────────┘
    ↓
EnterPlanMode (planning.md Step 1)
    ↓
Research & Create Plan (planning.md Steps 2-3)
Include visual prototypes for UI (Step 3.1)
    ↓
Plan Review Loop (planning.md Step 5)
    ↓
Commit with Bash Subagent (planning.md Step 7)
    ↓
🛑 CRITICAL CHECKPOINT (planning.md Step 7)
STAY in plan mode, WAIT for user
    ↓
Iterate on feedback (planning.md Step 8)
Repeat until approved
    ↓
User says "execute the plan"
    ↓
Pre-execution checklist (planning.md Step 9)
    ↓
┌─────────────────────────────────────┐
│      PHASE 2: IMPLEMENTATION        │
│  📖 READ implementation.md FIRST    │
└─────────────────────────────────────┘
    ↓
ExitPlanMode (ONLY EXIT - planning.md Step 10)
    ↓
Define Tasks (implementation.md Section 2)
    ↓
Implement in waves (implementation.md Sections 3-4)
Use absolute paths (docs/claude/worktrees.md)
    ↓
Create tests in parallel (docs/claude/testing.md)
    ↓
If scope changes → Change Plan (planning.md)
    ↓
STOP - Wait for user to test
Only commit when user asks
    ↓
┌─────────────────────────────────────┐
│       PHASE 3: VALIDATION           │
│  📖 SEE validation.md WORKFLOW      │
└─────────────────────────────────────┘
    ↓
User: "Code looks good, I'm satisfied"
    ↓
Run: Tests → Lint → Build (validation.md Sections 2-4)
    ↓
Commit & Push (validation.md Section 5)
    ↓
Wait for CI/CD (validation.md Section 6)
    ↓
Analyze SonarCloud (validation.md Section 7)
    ↓
Fix issues if needed (validation.md Section 8)
    ↓
✅ Quality Gates Passed → Ready to merge
```

**Quick Phase Identification:**
- **Am I in plan mode?** → Follow planning.md, stay in plan mode until "execute the plan"
- **User said "execute the plan"?** → Read implementation.md, exit plan mode, start coding
- **User said "code looks good"?** → Follow validation.md workflow
- **Confused?** → Re-read the STOP section at top of this file

## Common Mistakes to Avoid

| Mistake | Why It's Wrong | Correct Approach | Reference |
|---------|---------------|------------------|-----------|
| Not reading planning.md first | Miss critical workflow and guardrails | ALWAYS read planning.md Step 0 before starting | planning.md Step 0 |
| Skipping planning phase | No alignment before coding | Always plan first, get approval | planning.md overview |
| No visual prototypes for UI changes | No design alignment, wasted implementation | Include prototypes in plan when UI changes | planning.md Step 3.1 |
| Only 1 plan review cycle | Misses issues that iterative review catches | Run 2-3 cycles until "no significant concerns" | planning.md Step 5 |
| Skipping pre-commit checklist | Rush ahead without verification | Complete checklist before committing plan | planning.md Step 6 |
| Exiting plan mode to commit | Confusion about when to start coding | Use Bash subagent to commit, stay in plan mode | planning.md Step 7 |
| Starting implementation after creating plan | User hasn't approved yet | Commit plan → PR → Complete checkpoint → WAIT | planning.md Step 7 "CRITICAL CHECKPOINT" |
| Not completing verification checkpoint | Jump to implementation prematurely | Complete all checklist items, verify state | planning.md Step 7 checklist |
| Exiting plan mode before "execute the plan" | User hasn't approved yet | NEVER exit until user says "execute the plan" | planning.md "CRITICAL: NEVER Exit" |
| Not reading implementation.md before coding | Miss task definition workflow | Read implementation.md after "execute the plan" | implementation.md "BEFORE STARTING" |
| Not using TaskCreate | No progress tracking, can't parallelize | Always define tasks with TaskCreate/TaskUpdate | implementation.md Section 2 |
| Making big changes without change plan | Scope creep, misalignment | Create change plan for significant feedback | planning.md (change plans) |
| Ignoring SonarCloud issues | Accumulates technical debt | Fix ALL new issues, no excuses | validation.md Section 7 |
| Auto-fixing quality issues | User loses control | Show issues, ask permission to fix | validation.md Section 8 |
| Validating too early | User hasn't tested yet | Wait for "code looks good" signal | validation.md "When to Run" |
| Implementing in `/qatar-prode` | Stories need isolated worktrees | Use `/qatar-prode-story-N` | worktrees.md "Why Worktrees" |
| Current branch is `main` | Risk of committing to main | Use feature branch `feature/story-N` | worktrees.md "Commit Safety" |
| Using relative paths | Bash tool doesn't persist `cd` | Use absolute paths: `/qatar-prode-story-N/file.ts` | worktrees.md "Working with Files" |
| Forgetting `.env.local` or `.claude/` | App fails with DB errors or permission prompts | Copy after worktree creation (automated by helper) | worktrees.md "Required Files" |
| Client imports repository | Causes build errors | Server Components import repos, Client Components get props | architecture.md |
| Auto-committing after changes | User can't verify locally | Only commit when user asks | implementation.md Rule 7 |

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- No unused imports (enforced by pre-commit hooks)

### Security
- Never commit `.env.local` or secrets
- Use Server Actions for all mutations
- Validate user input with Zod schemas
- Check authorization in Server Actions

### Performance
- Use Server Components by default
- Add `'use client'` only when needed (hooks, interactions, browser APIs)
- Optimize images with Next.js `<Image>` component

### Quality Gates (SonarCloud)
- Code coverage: ≥80% on new code
- 0 new issues of ANY severity (low, medium, high, critical)
- Security rating: A
- Maintainability: B or higher
- Duplicated code: <5%

## Environment Variables

Required for development (`.env.local`):

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/qatar_prode

# Auth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Email (Nodemailer)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=noreply@example.com

# AWS S3 (file uploads)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
AWS_BUCKET_NAME=your-bucket-name

# Web Push Notifications
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-email@example.com

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Qatar Prode
NEXT_PUBLIC_APP_DESCRIPTION=Sports Prediction Platform
```

## Additional Notes

- Experimental HTTPS in development for PWA testing
- Tournament data stored in `data/` as JSON files
- Database migrations in `migrations/` (manual execution)
- Git hooks via Husky (tests + linting on modified files)

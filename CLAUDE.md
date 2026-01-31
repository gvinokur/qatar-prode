# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# 🛑🛑🛑 STOP - READ THIS FIRST - STOP 🛑🛑🛑

## BEFORE YOU DO ANYTHING - READ THIS SECTION COMPLETELY

**If user says "implement story #42" or similar, you MUST follow this EXACT sequence:**

### THE ONLY VALID WORKFLOW:

```
1. READ docs/claude/planning.md COMPLETELY
   ↓
2. EnterPlanMode (NEVER exit until user says "execute the plan")
   ↓
3. Create plan + visual prototypes (if UI changes)
   ↓
4. Review plan with subagent (2-3 cycles)
   ↓
5. Use BASH SUBAGENT to commit plan and create PR
   ↓
6. STOP ⛔ STAY IN PLAN MODE ⛔ WAIT FOR USER
   ↓
7. User reviews, provides feedback, you iterate
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

1. **NEVER implement stories in main worktree** (`/qatar-prode`) - Always use story worktrees
2. **NEVER commit to `main` branch** unless user explicitly says "commit to main"
3. **ALWAYS use absolute paths** when working with worktree files (e.g., `/qatar-prode-story-42/app/file.ts`)
4. **ALWAYS copy `.env.local` and `.claude/`** to new worktrees (automated by helper script)
5. **NEVER commit without user verification** - User must test locally first
6. **NEVER ask "would you like to proceed?" after creating plan PR** - Just WAIT for user

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

### 🛑 BEFORE STARTING: Read the Planning Guide

**MANDATORY:** Before entering plan mode or creating any plan:
1. **Read docs/claude/planning.md COMPLETELY**
2. Understand all 10 steps of the planning workflow
3. Note all STOP checkpoints where you MUST wait
4. Understand you NEVER exit plan mode until "execute the plan"

**This is not optional. The planning guide has critical guardrails you MUST follow.**

### Critical Rules
1. **ALWAYS read planning.md first** - Before entering plan mode
2. **ALWAYS create plan** at `/plans/STORY-{N}-plan.md` before coding
3. **ALWAYS include visual prototypes** if there are UI changes
4. **ALWAYS run plan review subagent for 2-3 cycles** until "no significant concerns"
5. **ALWAYS commit plan using Bash subagent** - Stay in plan mode while subagent handles git
6. **NEVER EXIT PLAN MODE** until user says "execute the plan"
7. **USE SUBAGENTS FOR GIT OPERATIONS** - Launch Bash subagent for commits/pushes (you stay in plan mode)
8. **COMPLETE CHECKLISTS** at each checkpoint before proceeding
9. **EXIT PLAN MODE = START IMPLEMENTATION** - Simple, unambiguous rule

### ⚠️ The Only Exit Rule
- **STAY IN PLAN MODE** the entire planning phase (use subagents for git)
- **EXIT ONCE** when user says "execute the plan" = start implementation
- No temporary exits, no re-entry, no confusion

### Process
See **[Planning Guide](docs/claude/planning.md)** for complete workflow.

**Plan review with subagent (MANDATORY):**
- After creating initial plan, use Plan Reviewer subagent for 2-3 review cycles
- Loop until "no significant concerns" OR 3 cycles complete
- Catches issues early, improves quality before user review

**Commit plan with Bash subagent:**
- Fetch actual issue title: `gh issue view ${STORY_NUMBER} --json title --jq '.title'`
- Launch Bash subagent to: git add, commit, push, create PR
- PR title format: `"Plan: ${issueTitle} #${STORY_NUMBER}"` (links to issue)
- PR body must include: `Fixes #${STORY_NUMBER}` (auto-links and auto-closes issue)
- You stay in plan mode the entire time
- Subagent reports back PR number/URL

**After creating PR - 🛑 CRITICAL CHECKPOINT 🛑:**
- Complete the verification checklist in planning.md
- Confirm you are STILL in plan mode
- Confirm you have NOT exited plan mode
- Confirm user has NOT said "execute the plan"
- Do NOT exit plan mode
- Do NOT start implementation
- Do NOT use TaskCreate
- Do NOT read implementation.md yet
- WAIT for user to review plan or say "execute the plan"

**Iterate on feedback:**
- Update plan document
- Launch Bash subagent to commit changes
- Stay in plan mode
- Repeat until "execute the plan"

**When user says "execute the plan":**
- Complete pre-execution checklist in planning.md
- Read docs/claude/implementation.md COMPLETELY
- Exit plan mode (ONLY exit during entire planning phase)
- Follow implementation workflow

**Mid-implementation replanning:**
- If significant feedback requires approach changes, create a "change plan"
- Enter plan mode again, create `/plans/STORY-{N}-change-1.md`
- Use Bash subagent to commit to same PR
- Iterate, wait for "execute the change plan"

## Validation & Quality Gates (MANDATORY before merge)

### Critical Rules
1. **ONLY validate when user says "code looks good" or "I'm satisfied"** - Not before
2. **0 new SonarCloud issues of ANY severity** - No excuses, fix ALL issues
3. **80% coverage on new code** - SonarCloud enforces this
4. **NEVER auto-fix issues** - Show user, ask permission to fix

### Process
See **[Validation Guide](docs/claude/validation.md)** for complete workflow.

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

# GitHub Projects Workflow
./scripts/github-projects-helper projects stats 1          # View project status
./scripts/github-projects-helper stories suggest 1         # Get candidate stories
./scripts/github-projects-helper story start 42 --project 1   # Start story
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

## Decision Tree for Implementation

```
User says "implement story #42"
    ↓
Run: git worktree list && git branch --show-current
    ↓
┌─────────────────────────────────────┐
│ Story worktree exists?              │
│ (e.g., /qatar-prode-story-42)      │
└─────────────────────────────────────┘
    ↓                    ↓
   YES                  NO
    ↓                    ↓
Set WORKTREE_PATH    ASK USER:
    ↓               "Should I create
    ↓                story worktree?"
    ↓                    ↓
    ↓               Create with:
    ↓               ./scripts/github-projects-helper story start 42 --project 1
    ↓                    ↓
    └────────────────────┘
             ↓
    PLANNING PHASE (MANDATORY)
             ↓
    🛑 READ docs/claude/planning.md FIRST 🛑
             ↓
    EnterPlanMode → Research → Create Plan
    Include visual prototypes if UI changes
    (NEVER EXIT UNTIL "EXECUTE THE PLAN")
             ↓
    ┌──────────────────────────────────┐
    │ Plan Review Loop (2-3 cycles):   │
    │ 1. Launch reviewer subagent      │
    │ 2. Get feedback                  │
    │ 3. Update plan if needed         │
    │ 4. Repeat until "no concerns"    │
    │    OR 3 cycles complete          │
    └──────────────────────────────────┘
             ↓
    Complete pre-commit checklist
             ↓
    Launch Bash Subagent:
    Commit Plan & Create PR
    (You stay in plan mode)
             ↓
    🛑🛑🛑 CRITICAL CHECKPOINT 🛑🛑🛑
    Complete verification checklist
    Confirm STILL in plan mode
    Confirm NOT started implementing
    Do NOT exit plan mode
    Do NOT start implementation
    Do NOT use TaskCreate
    Do NOT read implementation.md
    WAIT for user approval
             ↓
    User provides feedback?
    Update plan
    Launch Bash Subagent to commit
    (Stay in plan mode)
    Repeat until approved
             ↓
    User says "execute the plan"
             ↓
    Complete pre-execution checklist
             ↓
    🛑 READ docs/claude/implementation.md FIRST 🛑
             ↓
    ExitPlanMode (ONLY EXIT)
             ↓
    IMPLEMENTATION PHASE
    (see docs/claude/implementation.md)
             ↓
    Define tasks with TaskCreate
    Set dependencies with TaskUpdate
    Implement in execution waves
    Use absolute paths
    Follow approved plan
             ↓
    ┌────────────────────────┐
    │ Significant feedback?  │
    │ Scope changes?         │
    └────────────────────────┘
         ↓              ↓
        NO             YES
         ↓              ↓
    Continue      CHANGE PLAN
    coding        EnterPlanMode
         ↓        Create change-N.md
         ↓        Commit to same PR
         ↓        Iterate on feedback
         ↓        "execute change plan"
         ↓        ExitPlanMode
         ↓              ↓
         └──────────────┘
                ↓
    Create tests in parallel with subagents
    (see docs/claude/testing.md)
                ↓
    STOP - Wait for user to test
    Only commit when user asks
                ↓
    User: "Code looks good, I'm satisfied"
                ↓
    VALIDATION PHASE (MANDATORY)
    (see docs/claude/validation.md)
                ↓
    Run tests → Lint → Build → Commit → Push
                ↓
    Wait for CI/CD checks
                ↓
    Analyze SonarCloud results
                ↓
    ┌─────────────────────┐
    │ New issues found?   │
    └─────────────────────┘
         ↓           ↓
        YES         NO
         ↓           ↓
    Show issues  ✅ Quality Gates Passed
    Ask permission   ↓
    Fix if approved  Ready to merge
         ↓           ↓
         └───────────┘
```

## Common Mistakes to Avoid

| Mistake | Why It's Wrong | Correct Approach |
|---------|---------------|------------------|
| Not reading planning.md first | Miss critical workflow and guardrails | ALWAYS read planning.md before starting |
| Skipping planning phase | No alignment before coding | Always plan first, get approval |
| No visual prototypes for UI changes | No design alignment, wasted implementation | Include prototypes in plan when UI changes |
| Only 1 plan review cycle | Misses issues that iterative review catches | Run 2-3 cycles until "no significant concerns" |
| Skipping pre-commit checklist | Rush ahead without verification | Complete checklist before committing plan |
| Exiting plan mode to commit | Confusion about when to start coding | Use Bash subagent to commit, stay in plan mode |
| Starting implementation after creating plan | User hasn't approved yet | Commit plan → PR → Complete checkpoint → WAIT |
| Not completing verification checkpoint | Jump to implementation prematurely | Complete all checklist items, verify state |
| Exiting plan mode before "execute the plan" | User hasn't approved yet | NEVER exit until user says "execute the plan" |
| Not reading implementation.md before coding | Miss task definition workflow | Read implementation.md after "execute the plan" |
| Not using TaskCreate | No progress tracking, can't parallelize | Always define tasks with TaskCreate/TaskUpdate |
| Making big changes without change plan | Scope creep, misalignment | Create change plan for significant feedback |
| Ignoring SonarCloud issues | Accumulates technical debt | Fix ALL new issues, no excuses |
| Auto-fixing quality issues | User loses control | Show issues, ask permission to fix |
| Validating too early | User hasn't tested yet | Wait for "code looks good" signal |
| Implementing in `/qatar-prode` | Stories need isolated worktrees | Use `/qatar-prode-story-N` |
| Current branch is `main` | Risk of committing to main | Use feature branch `feature/story-N` |
| Using relative paths | Bash tool doesn't persist `cd` | Use absolute paths: `/qatar-prode-story-N/file.ts` |
| Forgetting `.env.local` | App fails with DB errors | Copy after worktree creation |
| Client imports repository | Causes build errors | Server Components import repos, Client Components get props |
| Auto-committing after changes | User can't verify locally | Only commit when user asks |

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

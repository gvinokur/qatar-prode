# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# 🛑🛑🛑 STOP - READ THIS FIRST - STOP 🛑🛑🛑

## BEFORE YOU DO ANYTHING - READ THIS SECTION COMPLETELY

**If user says "implement story #42" or similar:**

### YOUR ONLY FIRST ACTION:

```typescript
Read({
  file_path: "/Users/gvinokur/Personal/qatar-prode/docs/claude/planning.md"
})
```

**That's it. Read the file. Don't do anything else yet.**

After reading planning.md completely, you'll know:
- ✅ Exactly which tools to use (Write, Task with specific subagent types)
- ✅ Exactly when to use them
- ✅ Exactly what NOT to do
- ✅ This project's custom planning workflow

**DO NOT:**
- ❌ Start planning before reading planning.md
- ❌ Think you understand the workflow from this file
- ❌ Use EnterPlanMode before reading planning.md
- ❌ Try to remember steps from this summary
- ❌ Follow "standard Claude planning" behavior

**The complete workflow is IN planning.md. Read it first. Nothing else.**

---

**Why you must read planning.md first:**

This project has a **custom planning workflow** that's different from standard Claude Code planning. You MUST use specific tools (Write, Task) at specific times.

**The workflow details are ONLY in planning.md, not here.**

If you start planning before reading planning.md, you WILL do it wrong.

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
5. **NEVER commit without running validation checks** - MUST run tests, lint, and build before ANY commit (see implementation.md Section 9)
6. **ALWAYS ask permission before running migrations** - NEVER run database migrations without explicit user approval (see implementation.md Section 9 Step 4)
7. **Default: Deploy to Vercel Preview for user testing** - User tests in Vercel Preview (NOT locally) unless they explicitly request local testing (see implementation.md Section 9)
8. **NEVER ask "would you like to proceed?" after creating plan PR** - Just WAIT for user (see planning.md Step 7 "CRITICAL CHECKPOINT")
9. **ALWAYS create PRs as DRAFT** - Only mark as ready for review when user explicitly requests it or asks to merge (see planning.md Step 7 and validation.md Section 10)

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

### 🛑 FIRST ACTION: Read Planning Guide

**YOUR FIRST ACTION when user says "implement story":**

```typescript
Read({
  file_path: "/Users/gvinokur/Personal/qatar-prode/docs/claude/planning.md"
})
```

**After reading planning.md, you'll know the complete workflow.**

**Do NOT try to learn the workflow from this file. It's ALL in planning.md.**

---

### Quick Reference (AFTER you've read planning.md)

This project requires using specific tools during planning:
- **Write tool** - Create plan file (planning.md Step 3)
- **Task tool (Plan Reviewer subagent)** - Review plan 2-3 cycles (planning.md Step 5)
- **Task tool (Bash subagent)** - Commit and create PR (planning.md Step 7)
- **Task tool (Bash subagent)** - Commit plan updates (planning.md Step 8)

**Never exit plan mode until user says "execute the plan"**

**See planning.md for complete workflow, exact tool calls, and all checkpoints.**
7. **MUST complete verification checklist after creating PR** - See planning.md Step 7 "CRITICAL CHECKPOINT" - STOP and WAIT
8. **MUST use Bash SUBAGENT for all plan iterations** - See planning.md Step 8 (stay in plan mode, subagent commits updates)
9. **COMPLETE ALL CHECKLISTS** at each checkpoint - See planning.md Steps 4, 6, 9 (Pre-Review, Pre-Commit, Pre-Execution)
10. **EXIT PLAN MODE = START IMPLEMENTATION** - Simple, unambiguous rule

**KEY POINT: Subagent usage is NOT optional - Steps 5, 7, and 8 REQUIRE Task tool with appropriate subagent_type.**

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

### Critical Rules - NON-NEGOTIABLE
1. **ALWAYS read implementation.md first** - Before starting to code
2. **ALWAYS define tasks using TaskCreate** - Break down plan into atomic tasks (see implementation.md Section 2)
3. **ALWAYS set dependencies using TaskUpdate** - Define blockedBy/blocks relationships (see implementation.md Section 2)
4. **ALWAYS use absolute paths** - When working in worktrees (see [worktrees.md](docs/claude/worktrees.md))
5. **ALWAYS follow the approved plan** - No scope creep
6. **ALWAYS mark tasks in_progress/completed** - Track progress with TaskUpdate
7. **ALWAYS document deviations from plan** - Add amendments when gaps/issues discovered during implementation (see implementation.md Section 8)
   - IF you discover edge case not in plan → Add amendment
   - IF you fix bug during implementation → Add amendment
   - IF you make technical adjustment → Add amendment (unless trivial)
8. **NEVER commit without validation checks** - MUST run tests, lint, AND build before ANY commit (see implementation.md Section 9)
   - IF you commit without running tests → You have violated the workflow
   - IF you commit without running lint → You have violated the workflow
   - IF you commit without running build → You have violated the workflow
9. **ALWAYS ask permission before running migrations** - NEVER run migrations without explicit user approval (see implementation.md Section 9 Step 4)
10. **Default workflow: Deploy to Vercel Preview for testing** - After commit/push, user tests in Vercel Preview (NOT locally) unless they explicitly request local testing (see implementation.md Section 9)
11. **ALWAYS define tasks before handling feedback** - For 2+ non-trivial changes, use TaskCreate/TaskUpdate BEFORE making code changes (see implementation.md Section 7)
   - IF you make sequential changes without tasks → You have violated the workflow
   - This applies to ALL feedback: during implementation AND after Vercel Preview testing
12. **ALWAYS reconcile plan before final validation** - Ensure plan matches implementation before merge (see validation.md Section 1)

### Process Overview

**Complete workflow:** [Implementation Guide](docs/claude/implementation.md)

**Key phases:**

1. **Exit plan mode** → implementation.md Section 1 (final exit when user says "execute the plan")
2. **Define tasks with dependencies** → implementation.md Section 2 (use TaskCreate/TaskUpdate)
3. **Implement in execution waves** → implementation.md Sections 3-4 (parallel execution where possible)
4. **Create tests in parallel** → See [testing.md](docs/claude/testing.md) "Parallel Test Creation"
5. **Document deviations with amendments** → implementation.md Section 8 (add amendments as gaps/bugs discovered)
6. **Run validation checks** → implementation.md Section 9 Step 3 (MANDATORY: tests, lint, build before commit)
7. **Check migrations and ask permission** → implementation.md Section 9 Step 4 (ALWAYS ask before running)
8. **Commit and push** → Triggers Vercel Preview deployment
9. **Inform user to test in Vercel Preview** → User tests in preview environment (default workflow)
10. **Wait for user feedback from Vercel Preview** → "code looks good" or provide feedback
   - If feedback: Define tasks FIRST (implementation.md Section 7), then fix, repeat steps 6-10
   - If approved: Proceed to final validation
11. **Reconcile plan with implementation** → validation.md Section 1 (ensure plan matches reality)
12. **Final SonarCloud validation** → validation.md Sections 3-8 (after reconciliation and user approval)

**For task parallelization and subagent patterns:** See [subagent-workflows.md](docs/claude/subagent-workflows.md)

## Testing (Parallel test creation)

**Complete guide:** [Testing Guide](docs/claude/testing.md)

**Critical rules:**
1. **ALWAYS create tests** - Every story requires unit tests
2. **80% coverage on new code** - SonarCloud enforces this
3. **ALWAYS use test utilities** - Don't duplicate setup code (MANDATORY)
4. **Parallelize test creation** - Use subagents for independent test files (see testing.md "Parallel Test Creation")
5. **Follow testing guidelines** - See testing.md for complete patterns

**Test utilities (MANDATORY):**
- **Theme/Context:** Use `renderWithTheme()` or `renderWithProviders()` from `@/__tests__/utils/test-utils`
- **Next.js mocks:** Use utilities from `@/__tests__/mocks/next-navigation.mocks` and `next-auth.mocks`
- **Database mocking:** ALWAYS use helpers from `@/__tests__/db/mock-helpers` (never build chains manually)
- **Mock data:** ALWAYS use factories from `@/__tests__/db/test-factories` (never create mock data manually)

**DO NOT:**
- ❌ Create local theme setup (use `renderWithTheme()`)
- ❌ Create local context wrappers (use `renderWithProviders()`)
- ❌ Mock Next.js inline with `as any` (use mock utilities)
- ❌ Build Kysely query chains manually (use `createMockSelectQuery()` etc.)
- ❌ Create mock data objects manually (use `testFactories.*`)

**Parallel test creation example:**
Launch multiple subagents in parallel (single message, multiple Task calls) to create tests for independent features. See testing.md for detailed workflow.

**See testing.md for complete guide with examples and all utilities.**

## Validation & Quality Gates (MANDATORY before merge)

### Critical Rules
1. **ONLY validate when user says "code looks good" or "I'm satisfied"** - Not before
2. **0 new SonarCloud issues of ANY severity** - No excuses, fix ALL issues
3. **80% coverage on new code** - SonarCloud enforces this
4. **NEVER auto-fix issues** - Show user, ask permission to fix

### Process Overview

**Complete workflow:** [Validation Guide](docs/claude/validation.md)

**Key steps:**
1. **Reconcile plan with implementation** → See validation.md Section 1 (ensure plan matches reality)
2. **Verify user satisfaction** → See validation.md Section 2
3. **Wait for CI/CD** → See validation.md Section 3 (use `./scripts/github-projects-helper pr wait-checks`)
4. **Analyze SonarCloud** → See validation.md Section 4 (use `./scripts/github-projects-helper pr sonar-issues`)
5. **Fix issues if needed** → See validation.md Section 5 (show user, ask permission)
6. **Validate Vercel deployment** → See validation.md Section 6
7. **Mark PR ready for review** → See validation.md Section 7 (only when user requests)
8. **Final confirmation** → See validation.md Section 8

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
Document deviations with plan amendments (implementation.md Section 8)
When gaps/bugs discovered → Add amendment to plan
Commit plan + code together
    ↓
🛑 MANDATORY VALIDATION CHECKS (implementation.md Section 9 Step 3)
Run: npm test → npm lint → npm build
ALL must pass before commit
    ↓
Check for migrations (implementation.md Section 9 Step 4)
If migrations exist → ASK USER PERMISSION (ALWAYS)
If granted → Run migrations
    ↓
Commit & Push (triggers Vercel Preview deployment)
    ↓
Inform user to test in Vercel Preview
(Default workflow - NOT local testing)
    ↓
STOP - Wait for user feedback from Vercel Preview
    ↓
User provides feedback?
    ↓       ↓
   YES     NO
    ↓       ↓
Define Tasks FIRST (implementation.md Section 7)
For 2+ changes: TaskCreate → TaskUpdate → Execute in waves
Add amendments for any deviations
Then fix issues
Go back to validation
    ↓
    ↓       "Code looks good"
    ↓           ↓
    ↓       ┌─────────────────────────────────────┐
            │  PHASE 3: FINAL VALIDATION          │
            │  📖 SEE validation.md WORKFLOW      │
            └─────────────────────────────────────┘
                ↓
            Reconcile Plan with Implementation (validation.md Section 1)
            Review plan vs. actual code
            Add missing amendments if needed
            Commit plan updates if changes made
                ↓
            Verify User Satisfaction (validation.md Section 2)
                ↓
            Wait for CI/CD checks (validation.md Section 3)
                ↓
            Analyze SonarCloud results (validation.md Section 4)
                ↓
            Fix issues if needed (validation.md Section 5)
            Ask permission first
                ↓
            Validate Vercel deployment (validation.md Section 6)
                ↓
            Mark PR ready for review (validation.md Section 7)
            ONLY when user explicitly requests
                ↓
            0 new issues + 80% coverage
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
| Committing without running validation checks | Broken code gets committed, CI/CD fails | MUST run tests, lint, AND build before ANY commit | implementation.md Section 9 Step 3 |
| Running migrations without permission | Database changes without user awareness/approval | ALWAYS ask user permission before running migrations | implementation.md Section 9 Step 4 |
| Asking user to test locally by default | Inefficient, Vercel Preview is default | User tests in Vercel Preview unless they request local testing | implementation.md Section 9 |
| Waiting for user approval before committing | Wrong workflow, commit first then user tests in preview | Run validation → Check migrations → Commit → User tests in Vercel Preview | implementation.md Section 9 |
| Making sequential code changes when handling feedback | Inefficient, no parallelization, no progress tracking | For 2+ changes: Define tasks with TaskCreate/TaskUpdate FIRST, then execute in waves | implementation.md Section 7 |
| Not documenting deviations from plan | Plan diverges from reality, future confusion | Add amendments when discovering gaps/bugs during implementation | implementation.md Section 8 |
| Skipping plan reconciliation before merge | Plan contradicts actual code, documentation debt | Review plan vs. implementation before final validation | validation.md Section 1 |

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

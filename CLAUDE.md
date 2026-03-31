# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# 🛑🛑🛑 STOP - READ THIS FIRST - STOP 🛑🛑🛑

## BEFORE YOU DO ANYTHING - READ THIS SECTION COMPLETELY

**If user says "implement story #42" or similar:**

### YOUR ONLY FIRST ACTION:

Invoke the `/architect` skill — it contains the complete planning workflow.

**That's it. Invoke the skill. Don't do anything else yet.**

## Skill Router

| Phase | Trigger | Invoke |
|-------|---------|--------|
| Ticket Creation | "let's create a ticket" / "new story idea" | `/ticket-creator` |
| UI/UX Design | "design this" / "create a mockup" | `/ui-ux-designer` |
| Planning | "implement story #N" | `/architect` |
| Plan Review | After creating plan document | `/plan-reviewer` |
| Implementation | "execute the plan" | `/implementer` |
| Testing | Creating tests | `/test-engineer` |
| Code Review | "code looks good" | `/code-reviewer` |
| Quality Analysis | "check quality gates" / "sonar results" | `/validator` |
| Git Operations | Committing plan / PR / story complete | `/git-ops` |
| Gemini Delegation | >30 files, non-code tasks, multimodal | `/gemini` |

**DO NOT:**
- ❌ Start planning before invoking `/architect`
- ❌ Think you understand the workflow from this file
- ❌ Use EnterPlanMode before invoking `/architect`
- ❌ Follow "standard Claude planning" behavior

**The complete workflow is IN `/architect`. Invoke it first. Nothing else.**

---

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
   - If YES → Invoke `/implementer`, then proceed

2. Have I created a PR with the plan?
   - If NO → Create it first (via `/git-ops` Section 1)
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
5. **NEVER commit without running validation checks** - MUST run tests, lint, and build before ANY commit (see `/implementer` Section 9)
6. **ALWAYS ask permission before running migrations** - NEVER run database migrations without explicit user approval (see `/implementer` Section 9 Step 4)
7. **Default: Deploy to Vercel Preview for user testing** - User tests in Vercel Preview (NOT locally) unless they explicitly request local testing (see `/implementer` Section 9)
8. **NEVER ask "would you like to proceed?" after creating plan PR** - Just WAIT for user (see `/architect` Step 7 "CRITICAL CHECKPOINT")
9. **ALWAYS create PRs as DRAFT** - Only mark as ready for review when user explicitly requests it or asks to merge (see `/architect` Step 7 and `/code-reviewer` Section 7)
10. **ALWAYS set Priority, Effort, and Category fields when creating stories** - Never use labels like `priority/high` instead of field values; create new categories if needed (see github-projects-workflow.md Section 2)
11. **ALWAYS read `CODE-STRUCTURE.md` before code changes** — It is the living map of the codebase. Read it at the start of research. Update it after every code change (see [code-structure.md](docs/claude/code-structure.md))
12. **ALWAYS update CODE-STRUCTURE layer files AND call graph in the SAME COMMIT as source changes** — NEVER defer to end of story. Every TaskCreate description MUST include a "CODE-STRUCTURE files to update" section listing the exact layer files (db.md / actions.md / utils.md / pages.md / components-[domain].md) and whether the call graph needs updating. (see `/implementer` Section 2 "CODE-STRUCTURE.md Update Rule")

## Permissions Configuration

**Location:** `.claude/settings.local.json` (already configured with project permissions)

**What's enabled:**
- File operations: Read, Write, Edit, Glob, Grep (all project files)
- Git commands: All git operations
- NPM commands: test, build, lint, scripts
- GitHub CLI: PR operations, issue management
- Project scripts: All scripts in ./scripts/
- Gemini CLI: `gemini *` commands (for Architect, Librarian, Explainer, Ticket Creator, UI/UX Designer agent delegation)

**See:** [Permissions Guide](docs/claude/permissions.md) for details on configuration

**This enables autonomous operation without repetitive permission prompts.**

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
cd /Users/gvinokur/Personal/qatar-prode && git pull origin main # Update main worktree (post-merge)
```

### Quick Links

For detailed guidance, see:

- **[Ticket Creator Skill](.claude/skills/ticket-creator/SKILL.md)** - Interactive brainstorm → GitHub issue creation; Gemini feasibility analysis (internal only); feature-level tickets
- **[UI/UX Designer Skill](.claude/skills/ui-ux-designer/SKILL.md)** - Playwright capture + Gemini multimodal analysis → standalone React + MUI v7 CDN mockup in `mockups/`
- **[Architect Skill](.claude/skills/architect/SKILL.md)** - Plan creation, Gemini Architect delegation (Step 2.5), plan review, PR workflow
- **[Plan Reviewer Skill](.claude/skills/plan-reviewer/SKILL.md)** - Dual-persona plan review loop
- **[Implementer Skill](.claude/skills/implementer/SKILL.md)** - Task definition, dependencies, execution waves, coding practices
- **[Test Engineer Skill](.claude/skills/test-engineer/SKILL.md)** - Parallel test creation, testing conventions, requirements
- **[Code Reviewer Skill](.claude/skills/code-reviewer/SKILL.md)** - Quality gates, SonarCloud checks, Section 7.5 pre-merge audit (delegates to Gemini Librarian)
- **[Validator Skill](.claude/skills/validator/SKILL.md)** - Gemini-powered SonarCloud explanation → `tmp/sonar-explanation.md`; awaits fix authorization
- **[Git Ops Skill](.claude/skills/git-ops/SKILL.md)** - Exact templates for plan commits, PR creation, story complete
- **[Gemini Skill](.claude/skills/gemini/SKILL.md)** - Delegation heuristics, PROJECT_ROOT pattern, five agent entry points
- **[Permissions Guide](docs/claude/permissions.md)** - Configure Claude Code permissions for autonomous operation
- **[Subagent Workflows Guide](docs/claude/subagent-workflows.md)** - Quick reference for all subagent patterns
- **[Git Worktrees Guide](docs/claude/worktrees.md)** - Worktree setup, management, safety checks
- **[GitHub Projects Workflow](docs/claude/github-projects-workflow.md)** - Complete story workflow from start to completion
- **[Architecture Guide](docs/claude/architecture.md)** - Stack, patterns, i18n infrastructure, context providers, authentication patterns, performance optimization, reusable UI components, server/client boundaries
- **[Patterns Quick Reference](docs/claude/patterns.md)** - 5 critical patterns with examples (NEW)
- **[Code Structure Guide](docs/claude/code-structure.md)** - Format and maintenance rules for CODE-STRUCTURE.md
- **[Helper Script Docs](scripts/README.md)** - Full documentation for `github-projects-helper`

## Project Context

- **Framework**: Next.js 15.3 with App Router
- **Database**: PostgreSQL with Kysely ORM
- **Auth**: NextAuth.js v5
- **UI**: Material-UI v7
- **i18n**: next-intl with locale routing (English, Spanish)
- **Testing**: Vitest (60% overall coverage, 80% on new code)
- **Deployment**: Vercel (auto-deploy on push to main)

## Common Mistakes to Avoid

| Mistake | Why It's Wrong | Correct Approach | Reference |
|---------|---------------|------------------|-----------|
| Not invoking /architect first | Miss critical workflow and guardrails | ALWAYS invoke /architect before starting | /architect Step 0 |
| Skipping planning phase | No alignment before coding | Always plan first, get approval | /architect overview |
| No visual prototypes for UI changes | No design alignment, wasted implementation | Include prototypes in plan when UI changes | /architect Step 3.1 |
| Only 1 plan review cycle | Misses issues that iterative review catches | Run 2-3 cycles until "no significant concerns" | /plan-reviewer |
| Skipping pre-commit checklist | Rush ahead without verification | Complete checklist before committing plan | /architect Step 6 |
| Exiting plan mode to commit | Confusion about when to start coding | Use Bash subagent via /git-ops Section 1 | /architect Step 7 |
| Starting implementation after creating plan | User hasn't approved yet | Commit plan → PR → Complete checkpoint → WAIT | /architect Step 7 "CRITICAL CHECKPOINT" |
| Not completing verification checkpoint | Jump to implementation prematurely | Complete all checklist items, verify state | /architect Step 7 checklist |
| Exiting plan mode before "execute the plan" | User hasn't approved yet | NEVER exit until user says "execute the plan" | /architect "CRITICAL: NEVER Exit" |
| Not reading /implementer before coding | Miss task definition workflow | Invoke /implementer after "execute the plan" | /implementer "BEFORE STARTING" |
| Not using TaskCreate | No progress tracking, can't parallelize | Always define tasks with TaskCreate/TaskUpdate | /implementer Section 2 |
| Making big changes without change plan | Scope creep, misalignment | Create change plan for significant feedback | /architect Appendix: Change Plans |
| Ignoring SonarCloud issues | Accumulates technical debt | Fix ALL new issues, no excuses | /code-reviewer Section 7 |
| Adding tests just to hit 80% coverage number | Produces meaningless tests with no signal value | Run coverage on changed files, read uncovered lines, identify the scenario each represents, write one test per scenario | /code-reviewer Section 5 |
| Auto-fixing quality issues | User loses control | Show issues, ask permission to fix | /code-reviewer Section 8 |
| Validating too early | User hasn't tested yet | Wait for "code looks good" signal | /code-reviewer "When to Run" |
| Implementing in `/qatar-prode` | Stories need isolated worktrees | Use `/qatar-prode-story-N` | worktrees.md "Why Worktrees" |
| Current branch is `main` | Risk of committing to main | Use feature branch `feature/story-N` | worktrees.md "Commit Safety" |
| Using relative paths | Bash tool doesn't persist `cd` | Use absolute paths: `/qatar-prode-story-N/file.ts` | worktrees.md "Working with Files" |
| Forgetting `.env.local` or `.claude/` | App fails with DB errors or permission prompts | Copy after worktree creation (automated by helper) | worktrees.md "Required Files" |
| Client imports repository | Causes build errors | Server Components import repos, Client Components get props | architecture.md |
| Committing without running validation checks | Broken code gets committed, CI/CD fails | MUST run tests, lint, AND build before ANY commit | /implementer Section 9 Step 3 |
| Running migrations without permission | Database changes without user awareness/approval | ALWAYS ask user permission before running migrations | /implementer Section 9 Step 4 |
| Asking user to test locally by default | Inefficient, Vercel Preview is default | User tests in Vercel Preview unless they request local testing | /implementer Section 9 |
| Waiting for user approval before committing | Wrong workflow, commit first then user tests in preview | Run validation → Check migrations → Commit → User tests in Vercel Preview | /implementer Section 9 |
| Making sequential code changes when handling feedback | Inefficient, no parallelization, no progress tracking | For 2+ changes: Define tasks with TaskCreate/TaskUpdate FIRST, then execute in waves | /implementer Section 7 |
| Not documenting deviations from plan | Plan diverges from reality, future confusion | Add amendments when discovering gaps/bugs during implementation | /implementer Section 8 |
| Skipping plan reconciliation before merge | Plan contradicts actual code, documentation debt | Review plan vs. implementation before final validation | /code-reviewer Section 1 |
| Skipping pre-merge documentation audit | CODE-STRUCTURE entries remain stale from initial implementation; next story plans from wrong signatures | Run Section 7.5 of /code-reviewer after Sonar passes — read source + layer file for every changed file, correct all inaccuracies before story complete | /code-reviewer Section 7.5 |
| Not updating main worktree after merge | Next story branches from old commit, causes conflicts | After story complete, go to main worktree and `git pull origin main` | github-projects-workflow.md Section 10 |
| Not registering new translation namespaces | Missing translations, runtime errors | Register in i18n.config.ts and create namespace files | architecture/i18n.md |
| Adding locale params to repositories | Violates separation of concerns | Use applyLocalization in Server Actions | patterns.md Pattern 1 |
| Not using test factories | Incomplete mock data, test failures | ALWAYS use testFactories.* | patterns.md Pattern 2 |
| Client Components fetching data | Slow, insecure, wrong pattern | Server Components fetch, pass as props | patterns.md Pattern 3 |
| Not updating CODE-STRUCTURE.md | File map drifts from reality, future planning uses stale info | Update CODE-STRUCTURE.md as part of every task commit | code-structure.md |
| Not including "CODE-STRUCTURE files to update" in TaskCreate | CODE-STRUCTURE update gets forgotten during implementation | Every TaskCreate description MUST have a "CODE-STRUCTURE files to update" section — name the exact layer files and state YES/NO for call graph | /implementer Section 2 |
| Updating CODE-STRUCTURE.md at end of story instead of per-task | Batch updates are incomplete; function signatures may have drifted from plan | Update the layer file and call graph in the SAME COMMIT as the source change, not after | /implementer Section 2 |
| Missing call graph update after adding a new action or cross-layer call | Call graph becomes stale and misleads future planning | Update `## Call Graph` in CODE-STRUCTURE.md whenever a new page→action→repo flow is added or an existing flow gains a new step | code-structure.md |

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
- Code coverage: ≥60% overall, ≥80% on new code
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
- Tournament seed data stored in `data/` directory, organized by tournament (copa-america, euro, fifa-2026)
- Database migrations in `migrations/` (manual execution)
- Middleware handles i18n routing, authentication, and legacy path redirects (e.g., /groups → /friend-groups)
- Git hooks via Husky (tests + linting on modified files)

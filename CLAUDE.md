# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # Start development server with experimental HTTPS (https://localhost:3000)
npm run build            # Production build
npm run start            # Start production server
```

### Testing
```bash
npm run test             # Run all tests (Vitest)
npm run test:watch       # Run tests in watch mode
npm run coverage         # Generate test coverage report

# Run a single test file
npx vitest run __tests__/path/to/test-file.test.ts

# Run tests matching a pattern
npx vitest run --reporter=verbose -t "test name pattern"
```

### Code Quality
```bash
npm run lint             # Run ESLint
npm run sonar            # Run SonarCloud analysis
npm run sonar:check      # Check SonarCloud quality gate status
```

### Git Hooks
Husky and lint-staged are configured to:
- Run tests for modified test files
- Run linting for modified app files

### Git Worktrees

Git worktrees allow working on multiple branches simultaneously in different directories. This is essential for parallelizing development tasks.

**Important Behavior with Claude Code:**
- The Bash tool maintains the original working directory as its default
- Commands do NOT persist directory changes between tool invocations
- **Always use absolute paths** when working with worktree files

**Creating a Worktree:**
```bash
# Create new worktree with a new branch
git worktree add -b feature/branch-name ../project-name-branch-name

# Create worktree from existing branch
git worktree add ../project-name-branch-name existing-branch-name

# IMPORTANT: Copy environment files to new worktree
cp .env.local ../project-name-branch-name/.env.local
```

**Environment Files:**
- Each worktree is a separate directory and needs its own `.env.local` file
- **ALWAYS copy `.env.local` after creating a new worktree**
- Without environment variables, the app will fail with `missing_connection_string` errors
- The `.env.local` file is gitignored, so it must be manually copied

**Managing Worktrees:**
```bash
# List all worktrees
git worktree list

# Remove a worktree (after deleting the directory)
git worktree remove ../project-name-branch-name

# Prune stale worktree administrative files
git worktree prune
```

**Working with Files in Worktrees:**
```bash
# ✅ CORRECT: Use absolute paths
npm test /Users/username/project-worktree/app/file.ts
git -C /Users/username/project-worktree status

# ❌ INCORRECT: Relying on cd between commands
cd /Users/username/project-worktree
npm test  # This runs in the original directory, not the worktree
```

**Use Cases:**
- Work on multiple features simultaneously without branch switching
- Run parallel test suites on different branches
- Compare implementations side-by-side
- Keep stable branch running while developing
- Review PRs without disrupting current work

### GitHub Projects Integration

This project uses GitHub Projects for project management, tracking epics, stories, and milestones. The workflow is streamlined using a Python helper script (`scripts/github-projects-helper`) that encapsulates complex GitHub CLI operations.

**Helper Script Benefits:**
- ✅ **Single commands** instead of 5-10 bash invocations
- ✅ **Reduced token usage** in Claude conversations
- ✅ **Automatic prioritization** of candidate stories
- ✅ **Built-in error handling** with clear, colored output
- ✅ **JSON output** for programmatic parsing
- ✅ **Comprehensive workflow** from story start to completion

**Prerequisites:**
- Python 3.7+ installed
- GitHub CLI (`gh`) must be installed and authenticated
- User must have write access to the repository and projects
- Repository must be linked to GitHub Projects

**Quick Reference:**
```bash
# See all available commands
./scripts/github-projects-helper --help

# Common workflow (include --project 1 for automatic status updates)
./scripts/github-projects-helper projects stats 1
./scripts/github-projects-helper stories suggest 1 --milestone "Sprint 1-2"
./scripts/github-projects-helper story start 12 --project 1      # Sets "In Progress"
./scripts/github-projects-helper pr wait-checks 45
./scripts/github-projects-helper story complete 12 --project 1   # Sets "Done"

# Manual status update (e.g., after creating PR)
./scripts/github-projects-helper status update 12 "Pending Review" --project 1
```

For complete documentation, see: `scripts/README.md`

**Terminology:**
- **Project**: A GitHub Project board (e.g., "Qatar Prode v2.0")
- **Epic**: Large work items (issues with label "epic")
- **Story**: Individual work items (issues with labels "story" or "user-story")
- **Milestone**: Grouping of related issues with a target date
- **Project Fields**: Custom fields on GitHub Projects (Status, Priority, Size, etc.)

#### Querying Project Status

**Getting Open Projects Overview:**
When the user asks "which projects do I have open" or "show me project status":

```bash
# List all open projects with item counts and details
./scripts/github-projects-helper projects list
```

Present a summary including:
- Project name and number
- Total issues/items
- Project description and URL

**Getting Detailed Project Information:**
When the user asks for details on a specific project:

```bash
# Get comprehensive project statistics
./scripts/github-projects-helper projects stats <PROJECT_NUMBER>
```

This single command provides:
- Total items count
- Breakdown by status (Todo, In Progress, Done)
- Breakdown by priority (Critical, High, Medium, Low) with emojis
- Breakdown by milestone with item counts
- Breakdown by effort estimation
- Breakdown by category

The script automatically aggregates and formats all statistics in a readable format.

#### Proposing Stories to Work On

When the user asks "what should I work on" or "propose candidate stories":

```bash
# Get top candidate stories (automatically prioritized)
./scripts/github-projects-helper stories suggest <PROJECT_NUMBER>

# Filter by milestone
./scripts/github-projects-helper stories suggest <PROJECT_NUMBER> --milestone "Sprint 1-2: Critical Fixes"

# Filter by priority
./scripts/github-projects-helper stories suggest <PROJECT_NUMBER> --priority Critical

# Customize number of suggestions
./scripts/github-projects-helper stories suggest <PROJECT_NUMBER> --limit 10
```

**Automatic Prioritization:**
The script uses a scoring algorithm that considers:
- **Priority weight**: Critical (10), High (7), Medium (5), Low (3)
- **Effort bonus**: Low effort (3), Medium (2), High (1)
- **Combined score**: Higher scores = better candidates (quick wins get highest scores)

**Output includes:**
- Story number and title
- Priority with emoji indicators
- Effort estimation
- Milestone association
- Calculated score

Only suggests stories with status "Todo" or "Ready" (filters out In Progress, Done, Blocked).

#### Starting Work on a Story

When the user selects a story to work on (e.g., "let's work on story #123"):

```bash
# Start work on a story (all-in-one command)
# IMPORTANT: Include --project flag to enable automatic status updates
./scripts/github-projects-helper story start <STORY_NUMBER> --project <PROJECT_NUMBER>
```

**What this single command does:**
1. Creates worktree at `../qatar-prode-story-<STORY_NUMBER>`
2. Creates feature branch `feature/story-<STORY_NUMBER>`
3. Copies `.env.local` to the new worktree (critical for database connection)
4. Assigns the issue to current user (`@me`)
5. **Updates project status to "In Progress"** (if --project provided)
6. Outputs JSON with worktree path, branch name, and issue details

**Status Update:**
The script uses semantic matching to find the appropriate status:
- Looks for status field in the project
- Matches "In Progress", "In Dev", "Working", "Started" (case-insensitive)
- Uses GraphQL to update the project item status
- Falls back gracefully with warning if status field not found

**Example output:**
```json
{
  "worktree_path": "/Users/username/qatar-prode-story-123",
  "branch_name": "feature/story-123",
  "issue_number": 123,
  "issue_title": "Progressive Onboarding Flow"
}
```

Present confirmation to user:
- Worktree location
- Branch name
- Issue title
- Next steps (plan the work)

**Note:** Project status update to "In Progress" is not yet implemented (requires GraphQL field IDs). Update manually in GitHub Projects UI if needed.

#### Planning Work for Current Story

When the user asks to "plan work for current story" or "create a plan":

1. **Trigger EnterPlanMode:**
```typescript
// Use EnterPlanMode tool to transition to plan mode
```

2. **Read story details:**
```bash
# Fetch full issue details including body, labels, milestone
gh issue view ${STORY_NUMBER} --json number,title,body,labels,milestone,projectItems

# If story references a milestone, fetch milestone description
gh api repos/<owner>/<repo>/milestones/<milestone_number> --jq '.description'

# If story is linked to an epic, fetch epic details
gh issue view <EPIC_NUMBER> --json body
```

3. **Research context:**
- Read referenced documentation in milestone/project docs
- Review acceptance criteria in story description
- Check related issues or dependencies
- Search codebase for relevant files

4. **Gather requirements (use AskUserQuestion):**
- Ask clarifying questions about ambiguous requirements
- Confirm technical approach preferences
- Validate assumptions about scope
- Get decisions on implementation choices

5. **Create plan document:**
```bash
# Create plans directory if it doesn't exist
mkdir -p plans

# Create plan file
PLAN_FILE="plans/STORY-${STORY_NUMBER}-plan.md"
```

Plan document structure:
```markdown
# Plan: [Story Title] (#STORY_NUMBER)

## Story Context
- **Epic**: [Link to epic if applicable]
- **Milestone**: [Milestone name and goals]
- **Priority**: [High/Medium/Low]
- **Size Estimate**: [S/M/L/XL]

## Objective
[Clear statement of what this story aims to accomplish]

## Acceptance Criteria
[List from story description]
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Approach

### Architecture Changes
[Describe any new patterns or structural changes]

### Files to Create
- `path/to/new-file.ts` - Purpose

### Files to Modify
- `path/to/existing-file.ts` - Changes needed

### Dependencies
- New packages to install (if any)
- Other stories that must be completed first

## Implementation Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]
...

## Testing Strategy
- Unit tests for [specific components/functions]
- Integration tests for [workflows]
- Manual testing steps

## Rollout Considerations
- Breaking changes (if any)
- Migration steps (if any)
- Feature flags (if needed)

## Open Questions
[Any remaining unknowns - use AskUserQuestion to resolve]
```

6. **Commit and create PR for plan:**
```bash
# In the worktree directory
git -C ${WORKTREE_PATH} add plans/STORY-${STORY_NUMBER}-plan.md
git -C ${WORKTREE_PATH} commit -m "docs: add implementation plan for story #${STORY_NUMBER}

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

git -C ${WORKTREE_PATH} push -u origin ${BRANCH_NAME}

# Create PR
gh pr create --base main --head ${BRANCH_NAME} \
  --title "Plan: [Story Title] (#${STORY_NUMBER})" \
  --body "Implementation plan for #${STORY_NUMBER}

## Summary
This PR contains the implementation plan for the story.

## Plan Document
See \`plans/STORY-${STORY_NUMBER}-plan.md\` for full details.

## Next Steps
- Review and approve plan
- Iterate on plan based on feedback
- Execute plan once approved

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

# OPTIONAL: Update status to "Pending Review" (if project uses this status)
./scripts/github-projects-helper status update ${STORY_NUMBER} "Pending Review" --project <PROJECT_NUMBER>
```

7. **STOP. DO NOT EXIT PLAN MODE. DO NOT START IMPLEMENTATION.**

Present to user:
- Plan created at: `plans/STORY-${STORY_NUMBER}-plan.md`
- PR opened: [PR URL]
- Waiting for review and approval

**CRITICAL**:
- **DO NOT call ExitPlanMode yet** - stay in plan mode for iterations
- **DO NOT start writing code** - wait for user to say "execute the plan"
- **DO NOT make any file changes** except to the plan document during review

**Plan Iteration Phase:**
User will review the plan and provide feedback. During this phase:
- **REMAIN in plan mode** (able to edit plan file)
- Make updates to `plans/STORY-${STORY_NUMBER}-plan.md` based on feedback
- Commit and push changes to the same PR
- This cycle continues until the user explicitly approves the plan

When user approves (says "execute the plan" or similar):
- **THEN call ExitPlanMode** to transition from planning to implementation
- Proceed to "Executing the Plan" section below

#### Executing the Plan

**ONLY start this section when the user explicitly says "execute the plan" or "start implementation".**

When the user says "execute the plan" or "start implementation":

1. **Exit plan mode and transition to implementation:**
```typescript
// Use ExitPlanMode tool to exit plan mode
```

2. **Read the approved plan:**
```bash
cat plans/STORY-${STORY_NUMBER}-plan.md
```

3. **Implement according to plan:**
- Follow implementation steps in order
- Create/modify files as specified
- Write tests as outlined in testing strategy
- Use TodoWrite tool to track progress through implementation steps

4. **IMPORTANT - Commit Policy During Execution:**
- ❌ **NEVER commit code without user verification**
- ❌ **NEVER commit automatically after each change**
- ✅ **Only commit when user explicitly asks to commit**
- ✅ **Only commit when user says they've verified locally**
- User needs opportunity to:
  - Run code locally
  - Test functionality
  - Review changes
  - Request modifications

5. **When user asks to commit:**
```bash
# In worktree directory
git -C ${WORKTREE_PATH} add .
git -C ${WORKTREE_PATH} commit -m "<descriptive message>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

6. **When pushing to GitHub (first push after implementation):**
```bash
# Push to remote
git -C ${WORKTREE_PATH} push

# Update story status to "Pending Review"
gh project item-edit --project-id <PROJECT_ID> --id ${PROJECT_ITEM_ID} --field-id <STATUS_FIELD_ID> --text "Pending Review"
```

7. **When pushing to existing PR:**

After push, **ALWAYS wait for deployment checks:**

```bash
# Wait for Vercel and SonarCloud checks (single command)
./scripts/github-projects-helper pr wait-checks <PR_NUMBER>

# Custom timeout (default: 1800 seconds / 30 minutes)
./scripts/github-projects-helper pr wait-checks <PR_NUMBER> --timeout 3600

# Custom poll interval (default: 30 seconds)
./scripts/github-projects-helper pr wait-checks <PR_NUMBER> --poll-interval 60
```

**What this command does:**
1. Polls PR checks every 30 seconds (configurable)
2. Monitors Vercel deployment status
3. Monitors SonarCloud analysis status
4. Displays live status updates: `[120s] Vercel: IN_PROGRESS SonarCloud: QUEUED`
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

8. **If checks fail:**

**Vercel deployment failure:**
```bash
# Get deployment logs
gh pr view ${PR_NUMBER} --json statusCheckRollup --jq '.statusCheckRollup[] | select(.name | contains("vercel"))'

# Common causes:
# - Build errors (TypeScript, linting)
# - Missing environment variables
# - Import/module resolution issues
```

Propose fixes:
- Review build logs for specific errors
- Check for TypeScript errors: `npm run build` in worktree
- Verify imports and dependencies
- Fix and commit changes, then wait for re-deployment

**SonarCloud failure:**
```bash
# Get SonarCloud report URL
gh pr view ${PR_NUMBER} --json statusCheckRollup --jq '.statusCheckRollup[] | select(.name | contains("SonarCloud")) | .targetUrl'

# Common issues:
# - Code coverage below 60%
# - Code smells or bugs detected
# - Security vulnerabilities
# - Duplicated code
```

Propose fixes:
- Add missing tests to improve coverage
- Refactor code to address code smells
- Fix security issues
- Reduce code duplication
- Fix and commit changes, then wait for re-analysis

9. **When checks pass:**
Present to user:
- ✓ Vercel deployment successful: [Preview URL]
- ✓ SonarCloud quality gate passed: [Report URL]
- Code is ready for final review
- User can verify functionality on preview deployment

#### Merging and Completing Story

When user says "merge the PR" or "close the story":

```bash
# Complete the story (all-in-one command)
# IMPORTANT: Include --project flag to enable automatic status updates
./scripts/github-projects-helper story complete <STORY_NUMBER> --project <PROJECT_NUMBER>

# Specify PR number explicitly (otherwise auto-detected)
./scripts/github-projects-helper story complete <STORY_NUMBER> --pr <PR_NUMBER> --project <PROJECT_NUMBER>

# Use regular merge instead of squash
./scripts/github-projects-helper story complete <STORY_NUMBER> --merge-method merge --project <PROJECT_NUMBER>
```

**What this single command does:**
1. Finds the PR for the story (if not specified)
2. Verifies PR is open and mergeable
3. Merges the PR with specified method (default: squash)
4. Deletes the feature branch automatically
5. Closes the issue with reason "completed"
6. **Updates project status to "Done"** (if --project provided)
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

**Error Handling:**
- If PR not found, exits with error message
- If PR is not mergeable (conflicts, failing checks), exits with clear error
- If worktree doesn't exist, skips cleanup gracefully
- If status update fails, shows warning but continues with other operations

**Note:** Status updates use semantic matching to find the appropriate status field. If your project uses different status names, the script will attempt partial matching. If automatic updates fail, you can manually update in GitHub Projects UI or use the `status update` command.

#### GitHub API Notes

**Finding Project and Field IDs:**
```bash
# List projects to get PROJECT_ID
gh api graphql -f query='
  query {
    user(login: "<username>") {
      projectsV2(first: 10) {
        nodes {
          id
          title
          number
        }
      }
    }
  }'

# Get field IDs for a project
gh api graphql -f query='
  query {
    node(id: "<PROJECT_ID>") {
      ... on ProjectV2 {
        fields(first: 20) {
          nodes {
            ... on ProjectV2Field {
              id
              name
            }
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
      }
    }
  }'
```

**Updating Project Fields:**
```bash
# Update single-select field (Status, Priority, etc.)
gh api graphql -f query='
  mutation {
    updateProjectV2ItemFieldValue(
      input: {
        projectId: "<PROJECT_ID>"
        itemId: "<ITEM_ID>"
        fieldId: "<FIELD_ID>"
        value: {
          singleSelectOptionId: "<OPTION_ID>"
        }
      }
    ) {
      projectV2Item {
        id
      }
    }
  }'
```

#### Common Patterns

**Current Story Context:**
Maintain context about the current story being worked on:
- Story number
- Worktree path
- Branch name
- PR number (once created)
- Project and field IDs

**Story Number Extraction:**
When user refers to "story #123" or "issue 123", extract the number and use it consistently throughout the workflow.

**Error Handling:**
- If `gh` commands fail, check authentication: `gh auth status`
- If project commands fail, verify project access and existence
- If worktree creation fails, check for existing worktree with same name
- If status updates fail, verify field IDs and option IDs are correct

**Best Practices:**
- Always confirm actions with user before executing destructive operations (merge, delete)
- Provide clear status updates at each step
- Include relevant links (PR, issue, deployment preview) in summaries
- Use TodoWrite to track multi-step workflows
- Keep user informed about wait times (deployment checks, CI runs)

## Architecture

### Stack Overview
- **Framework**: Next.js 15.3 with App Router (Server Components by default)
- **Database**: PostgreSQL with Kysely ORM (`@vercel/postgres-kysely`)
- **Authentication**: NextAuth.js v5 (beta) with Credentials provider
- **UI**: Material-UI v7 with Emotion styling
- **Testing**: Vitest 3.2 (primary), Jest 29.7 (legacy integration tests)
- **PWA**: Serwist for service workers and offline support

### Project Structure

```
app/
├── actions/          # Server Actions (business logic layer)
├── db/              # Database layer
│   ├── database.ts           # Kysely instance & schema
│   ├── tables-definition.ts  # Type-safe table schemas
│   └── *-repository.ts       # Repository pattern for data access
├── components/       # React components organized by feature
├── utils/           # Pure functions (calculators, formatters)
└── api/             # API routes (auth, uploads, webhooks)

__tests__/           # Test files mirroring app/ structure
migrations/          # PostgreSQL migration scripts
data/                # Tournament data files (JSON)
```

### Key Architectural Patterns

#### Server Actions Pattern
All business logic lives in `app/actions/*.ts` files marked with `'use server'`:
- `tournament-actions.ts` - Tournament data, groups, playoffs
- `prode-group-actions.ts` - Friend groups and participation
- `game-actions.ts` - Game operations and updates
- `guesses-actions.ts` - User predictions
- `user-actions.ts` - User profiles and auth

Server Actions are imported directly into Client Components for mutations.

#### Client/Server Component Boundaries (CRITICAL)

**The Golden Rule:** Server Components import repositories directly. Client Components receive data as props OR call Server Actions for mutations.

**CORRECT Pattern for Data Fetching:**

```typescript
// ✅ CORRECT: Server Component imports repository directly
// app/tournaments/[id]/page.tsx
'use server'

import { findTournamentById } from '../../db/tournament-repository'
import TournamentView from '../../components/tournament-view'

export default async function TournamentPage({ params }: Props) {
  // Server Component: Import and call repository directly
  const tournament = await findTournamentById(params.id)

  // Pass data as props to Client Component
  return <TournamentView tournament={tournament} />
}

// ✅ CORRECT: Client Component receives data as props
// app/components/tournament-view.tsx
'use client'

import { Tournament } from '../db/tables-definition'

export default function TournamentView({ tournament }: { tournament: Tournament }) {
  // Client Component: Receives data as props, never imports repositories
  return <div>{tournament.name}</div>
}
```

**INCORRECT Patterns (cause build errors):**

```typescript
// ❌ INCORRECT #1: Client Component imports repository
'use client'

import { findTournamentById } from '../db/tournament-repository'  // ERROR!

export default function TournamentView({ tournamentId }: Props) {
  // This will fail at build time
  const [tournament, setTournament] = useState(null)
  useEffect(() => {
    findTournamentById(tournamentId).then(setTournament)
  }, [tournamentId])
}

// ❌ INCORRECT #2: Server Component imports Server Action that has repository imports
'use server'

import { getTournamentData } from './actions/tournament-actions'  // ERROR!

// If tournament-actions.ts has "import { findTournamentById } from '../db/tournament-repository'"
// at the top level, this creates an import chain that pulls database.ts into the bundle

export default async function Page() {
  const data = await getTournamentData(id)  // Causes build error
  return <Component data={data} />
}
```

**Data Fetching Rules:**

1. **Server Components (pages, layouts, templates marked `'use server'`)**:
   - ✅ Import and call repositories DIRECTLY
   - ✅ Fetch all data needed by child components
   - ✅ Pass data down as props to Client Components
   - ❌ NEVER import Server Actions that have repository imports at module scope

2. **Client Components (marked `'use client'`)**:
   - ❌ NEVER import repositories or database functions
   - ✅ Receive data as props from parent Server Component
   - ✅ Call Server Actions for mutations (form submissions, button clicks)
   - ✅ Call Server Actions for dynamic data fetching (if needed)

3. **Server Actions (files marked `'use server'`)**:
   - ✅ Can import and call repositories
   - ✅ Used by Client Components for mutations and dynamic updates
   - ⚠️ WARNING: If a Server Component imports a Server Action file that has repository imports at the top level, it can cause build errors. Keep Server Actions for Client Component use only.

**Example: Proper Data Flow**

```typescript
// ✅ Server Component (page.tsx) - Imports repository directly
'use server'
import { findTournamentById } from '@/app/db/tournament-repository'

export default async function Page({ params }) {
  // Direct repository call in Server Component
  const tournament = await findTournamentById(params.id)

  return <ClientComponent tournament={tournament} />
}

// ✅ Client Component - Receives props and calls Server Actions for mutations
'use client'
import { updateTournamentAction } from '@/app/actions/tournament-actions'

export default function ClientComponent({ tournament }) {
  async function handleUpdate() {
    // Call Server Action for mutation
    await updateTournamentAction(tournament.id, newData)
  }

  return <button onClick={handleUpdate}>Update</button>
}

// ✅ Server Action - Used by Client Component for mutations
'use server'
import { updateTournament } from '../db/tournament-repository'

export async function updateTournamentAction(id: string, data: any) {
  return updateTournament(id, data)  // ✅ OK - Server Action wraps repository
}
```

**Why This Matters:**
- Repositories use `database.ts` which creates a Postgres connection at module load time
- If a Server Component imports a Server Action, and that Server Action imports a repository, the entire import chain (including database.ts) gets bundled
- This causes `database.ts` to execute during build, before DATABASE_URL is available
- Result: Build fails with "missing_connection_string" error
- Solution: Server Components call repositories directly, not through Server Actions

#### Repository Pattern
Database access is abstracted through repositories in `app/db/*-repository.ts`:
```typescript
// Example: users-repository.ts
export async function findUserByEmail(email: string) {
  return db.selectFrom('users')
    .where('email', '=', email)
    .selectAll()
    .executeTakeFirst();
}
```

Always use repositories for database access - never query `db` directly from actions or components.

#### Type-Safe Database Queries
The database schema is fully typed via Kysely:
```typescript
// app/db/database.ts
export interface Database {
  users: UserTable
  tournaments: TournamentTable
  games: GameTable
  // ... all tables
}

export const db = createKysely<Database>();
```

TypeScript will catch invalid column names, table names, and type mismatches.

### Component Organization

Components are organized by feature domain:
- `/auth` - Authentication (login, signup, password reset)
- `/tournament-page` - Tournament views and standings
- `/groups-page` - Friend group management
- `/playoffs`, `/playoffs-page` - Playoff brackets
- `/awards` - Award tracking components
- `/backoffice` - Admin interface
- `/common` - Reusable UI components

Use Server Components by default. Add `'use client'` only when needed for:
- User interactions (onClick, onChange)
- React hooks (useState, useEffect, useContext)
- Browser APIs

### Database Schema

18+ PostgreSQL tables organized by domain:

**Core entities**: `users`, `tournaments`, `teams`, `players`, `games`

**Tournament structure**:
- `tournament_groups` + `tournament_group_teams` + `tournament_group_games`
- `tournament_playoff_rounds` + `tournament_playoff_round_games`

**Predictions**:
- `game_guesses` (individual game predictions)
- `game_results` (actual outcomes)
- `tournament_guesses` (tournament-level predictions: awards, qualifiers)
- `tournament_group_team_stats_guess` (group position predictions)

**Social features**:
- `prode_groups` + `prode_group_participants`
- `prode_group_tournament_betting` + `prode_group_tournament_betting_payments`

### Authentication Flow

NextAuth.js v5 configured in `auth.ts`:
- Credentials provider with email/password
- Custom session extended with `nickname`, `isAdmin`, `emailVerified`
- Password hashing via `crypto-js` (see `users-repository.ts:getPasswordHash`)
- Sign-in redirect: `/?openSignin=true`

Access current user in Server Components:
```typescript
import { auth } from '@/auth';

const session = await auth();
const userId = session?.user?.id;
```

### Scoring System

Game prediction scoring logic in `app/utils/game-score-calculator.ts`:
- Exact score: Maximum points
- Correct winner + goal difference: Medium points
- Correct winner: Base points
- Penalties: Bonus points

Group standings calculated by `app/utils/group-position-calculator.ts`:
- Points, goal difference, goals scored, head-to-head

Award calculations in `app/utils/award-utils.ts`:
- Best player, top scorer, best goalkeeper, young player

### Testing Conventions

- **Test files**: `__tests__/` directory mirroring `app/` structure
- **Primary framework**: Vitest with `@testing-library/react`
- **Coverage target**: 60% minimum (enforced by SonarCloud)
- **Test types**:
  - Unit tests for utilities (calculators, formatters)
  - Component tests with `@testing-library/react`
  - Database integration tests (repositories)

Example test file structure:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('ComponentName', () => {
  it('should render correctly', () => {
    render(<ComponentName />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

Mock AWS S3 with `aws-sdk-client-mock` when testing file uploads.

### Environment Variables

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

### Progressive Web App

PWA configuration via Serwist (`@serwist/next`):
- Service worker in `app/service-worker.ts`
- Manifest in `app/manifest.json`
- Offline fallback page: `/offline`
- Push notifications using Web Push API

Install prompt component: `app/components/Install-pwa.tsx`

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier for formatting
- No unused imports (enforced by `eslint-plugin-unused-imports`)

### Security
- Never commit `.env.local` or secrets
- Use Server Actions for all mutations
- Validate user input with Zod schemas
- Check authorization in Server Actions (verify `session?.user?.id`)

### Performance
- Use Server Components by default (faster initial load)
- Implement virtualization for long lists (`react-window`)
- Optimize images with Next.js `<Image>` component

### Code Quality Gates (SonarCloud)
- Code coverage: ≥60%
- Security rating: A
- Maintainability: B or higher
- Duplicated code: <5%

Pull requests must pass quality gate before merging.

## Common Patterns

### Fetching Data in Server Components
```typescript
import { getTournaments } from '@/app/actions/tournament-actions';

export default async function Page() {
  const tournaments = await getTournaments();
  return <TournamentList tournaments={tournaments} />;
}
```

### Client Component with Server Action
```typescript
'use client';
import { submitGuess } from '@/app/actions/guesses-actions';

export function GuessForm({ gameId }: { gameId: string }) {
  async function handleSubmit(formData: FormData) {
    await submitGuess(gameId, formData);
  }

  return <form action={handleSubmit}>...</form>;
}
```

### Type-Safe Database Query
```typescript
import { db } from '@/app/db/database';

export async function getGamesByTournament(tournamentId: string) {
  return db.selectFrom('games')
    .where('tournament_id', '=', tournamentId)
    .orderBy('game_date', 'asc')
    .selectAll()
    .execute();
}
```

### Calculating Scores
```typescript
import { calculateGameScore } from '@/app/utils/game-score-calculator';

const score = calculateGameScore(
  { home: 2, away: 1 },  // guess
  { home: 2, away: 1 }   // actual
);
// Returns points based on accuracy
```

## Deployment

Configured for Vercel deployment:
- `vercel.json` present
- Environment variables set in Vercel dashboard
- Automatic deployments on push to `main`
- Preview deployments for pull requests

## Additional Notes

- The app uses experimental HTTPS in development (`npm run dev`) for testing PWA features
- Tournament data is stored in `data/` as JSON files for seeding
- Database migrations are in `migrations/` directory (manual execution required)
- SonarCloud integration runs automatically on push/PR via GitHub Actions

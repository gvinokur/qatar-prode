# Code Structure Guide

Format and maintenance rules for `CODE-STRUCTURE.md` — the living map of this codebase.

---

## Purpose

`CODE-STRUCTURE.md` (at the project root) documents every production file's exported functions and components: their TypeScript signatures, call relationships, and descriptions. It serves three roles:

1. **Fast-lookup reference** — understand what exists and how it connects without re-reading source files
2. **Mid-level design surface** — during planning, specify new functions before writing code
3. **TDD enabler** — test cases are defined at the signature level before implementation begins

---

## What to Document

**Include:**
- All production source files (`.ts`, `.tsx`) under `app/`, `lib/`, `components/`
- Every exported function, Server Action, React component, and custom hook

**Exclude:**
- Test files (`*.test.ts`, `*.test.tsx`, files under `__tests__/`)
- Config files (`next.config.ts`, `tailwind.config.ts`, etc.)
- Migration files
- Type-only files (files that only export `type` or `interface` declarations)

---

## File Format

The document has two top-level sections:

```
## Files
## Call Graph
```

### `## Files` Section

One `###` subsection per production file, using the relative path from project root as the heading.

```markdown
### app/db/tournament-repository.ts
```

After the heading: a 1–2 sentence description of the file's responsibility.

Then list all exported functions and components.

---

## Function Entry Format

For repositories, server actions, utilities, and hooks:

```markdown
- **functionName(param: Type, param2: Type)**: `ReturnType` — 1–2 sentence description.
  Calls: otherProjectFunction, anotherFunction
  Uses: useCustomHook
```

**Rules:**
- Bold name with full TypeScript signature (all params, return type)
- Em-dash (`—`) separating signature from description
- `Calls:` line lists **project functions only** — no npm packages, no Node stdlib, no Next.js/React internals. Omit line entirely if no project calls.
- `Uses:` line lists custom hooks consumed (not useState, useEffect). Omit line if none.
- Async functions: return type is `Promise<T>`, not just `T`

**Example:**
```markdown
- **findActiveTournaments()**: `Promise<Tournament[]>` — Returns all active tournaments ordered by start_date. Omits drafts and archived.

- **findTournamentById(id: number)**: `Promise<Tournament | undefined>` — Fetches a single tournament by primary key.

- **getActiveTournaments(locale: string)**: `Promise<LocalizedTournament[]>` — Server Action. Fetches, localizes, and returns active tournaments for the given locale.
  Calls: findActiveTournaments, applyLocalization
```

---

## React Component Entry Format

```markdown
- **ComponentName({ prop, prop2 }: PropsType)**: `JSX.Element` — [Tag] 1–2 sentence description.
  Calls: serverActionOrUtility
  Uses: useCustomHook
  Renders: ChildComponent, AnotherComponent
```

**Component type tags** (add to the beginning of description):
- `[Server]` — Next.js Server Component (no `'use client'`)
- `[Client]` — React Client Component (`'use client'` directive)
- `[Provider]` — Context Provider that wraps children

**Rules:**
- Props type written as inline object `{ prop: Type }` or named type `ComponentProps`
- `Calls:` lists project server actions or utilities invoked (not React hooks)
- `Uses:` lists custom hooks or contexts consumed
- `Renders:` lists non-trivial project components rendered as children. Omit for primitive/MUI-only renders or if the component list would be exhaustive.
- Omit any line (`Calls:`, `Uses:`, `Renders:`) if it would be empty

**Example:**
```markdown
- **TournamentsPage({ params }: { params: Promise<{ locale: string }> })**: `JSX.Element` — [Server] Fetches active tournaments and renders authenticated or public list view.
  Calls: getActiveTournaments, getLoggedInUser
  Renders: TournamentList, PublicTournamentList

- **TournamentList({ tournaments, onSelect }: TournamentListProps)**: `JSX.Element` — [Client] Scrollable list of tournaments with hover state and selection callback.
  Uses: useState
```

---

## `## Call Graph` Section

ASCII tree showing non-trivial call relationships between **project functions only**. Use this to visualize how pages connect to actions connect to repositories.

**Edge labels:**
- `[server action]` — Client Component calling a Server Action
- `[renders]` — Component rendering a child component

**Collapse repeated subtrees** with `[same as above]`.

**Example:**
```markdown
## Call Graph

TournamentsPage
  └── getActiveTournaments [server action]
        └── findActiveTournaments
        └── applyLocalization
  └── getLoggedInUser [server action]
  └── TournamentList [renders]
        └── (no project calls)
  └── PublicTournamentList [renders]
        └── (no project calls)
```

Only include the call graph for non-trivial relationships. If the codebase is large, focus on the most important flows (e.g., page → action → repository chains).

---

## Full Example

```markdown
## Files

### app/db/tournament-repository.ts
Encapsulates all Kysely queries for tournaments. No auth or localization logic.

- **findActiveTournaments()**: `Promise<Tournament[]>` — Returns all active tournaments ordered by start_date.

- **findTournamentById(id: number)**: `Promise<Tournament | undefined>` — Fetches single tournament by primary key.

- **createTournament(data: TournamentNew)**: `Promise<Tournament>` — Inserts and returns a new tournament record.

### app/actions/tournament-actions.ts
Server Actions orchestrating tournament data with auth and localization applied.

- **getActiveTournaments(locale: string)**: `Promise<LocalizedTournament[]>` — Server Action. Fetches, localizes, and returns active tournaments.
  Calls: findActiveTournaments, applyLocalization

- **createTournament(data: CreateTournamentInput, locale: string)**: `Promise<LocalizedTournament>` — Server Action. Validates input, inserts tournament, returns localized result.
  Calls: getLoggedInUser, createTournamentRecord, applyLocalization

### app/[locale]/tournaments/page.tsx
Server Component page for the tournaments list.

- **TournamentsPage({ params }: { params: Promise<{ locale: string }> })**: `JSX.Element` — [Server] Fetches tournaments and renders authenticated or public view.
  Calls: getActiveTournaments, getLoggedInUser
  Renders: TournamentList, PublicTournamentList

### app/components/tournament-list.tsx
Interactive list of tournaments with selection state.

- **TournamentList({ tournaments, onSelect }: TournamentListProps)**: `JSX.Element` — [Client] Renders scrollable list with hover state and selection callback.
  Uses: useState

## Call Graph

TournamentsPage
  └── getActiveTournaments [server action]
        └── findActiveTournaments
        └── applyLocalization
  └── TournamentList [renders]
  └── PublicTournamentList [renders]
```

---

## Maintenance Rules

### When to update CODE-STRUCTURE.md

Update it **as part of every task commit** — not at the end of a story, not in a separate PR. The entry for a file must reflect the current state of that file in the same commit.

### How to update

1. **New file created** → Add a new `### path/to/file.ts` section in the correct alphabetical position.
2. **Function added** → Add entry under the file's section.
3. **Function signature changed** → Update the entry to match the actual implementation.
4. **Function deleted** → Remove its entry.
5. **File deleted** → Remove the entire `###` section.
6. **Call relationships changed** → Update `Calls:` lines and the Call Graph.

### Quality checks before committing

- Every exported function/component in modified files has a matching entry
- Signatures in CODE-STRUCTURE.md exactly match the implemented signatures
- `Calls:` lines list only project functions (no npm packages, no stdlib)
- File description (1–2 sentences) accurately reflects current responsibility
- If the plan's Mid-Level Design specified a different signature that changed during implementation, CODE-STRUCTURE.md reflects the **actual** implementation

### What NOT to do

- ❌ Copy signatures from the plan without checking if they changed during implementation
- ❌ Defer CODE-STRUCTURE.md updates to a "cleanup" commit at story end
- ❌ Include npm package names in `Calls:` (e.g., don't list `kysely`, `next-auth`, `zod`)
- ❌ Document private/unexported helper functions
- ❌ Include test files or config files

---

## Mid-Level Design in Story Plans

During planning, the `## Mid-Level Design` section of a plan uses the same format as CODE-STRUCTURE.md entries, extended with test cases.

### Template

```markdown
## Mid-Level Design

### `app/db/group-repository.ts` *(modified)*

**New functions:**

- **findGroupsByUser(userId: string)**: `Promise<Group[]>`
  Returns all groups where the user is an active member, ordered by name.
  Calls: none
  Tests:
  - returns empty array when user has no groups
  - returns groups ordered by name ascending
  - excludes groups where user membership is inactive

**Changed functions:**

- **createGroup(data: GroupNew, locale: string)**: `Promise<LocalizedGroup>` *(was: no locale param)*
  Now returns localized data so callers get display-ready result.
  Calls: getLoggedInUser, insertGroup, applyLocalization
  Tests:
  - (existing tests unchanged)
  - new: returned group name matches the locale parameter

### `app/components/group-list.tsx` *(new file)*

- **GroupList({ groups }: GroupListProps)**: `JSX.Element`
  [Client] Renders scrollable list of groups with name, member count, and join button.
  Uses: useTranslations
  Tests:
  - renders each group name
  - shows member count per group
  - calls onJoin callback when join button clicked
  - renders empty state when groups array is empty
```

### Test case rules

- Minimum 3 test cases per new function
- At least one error/edge case per function (e.g., unauthorized, not found, empty input)
- Cases must be observable (testable via assertions), not implementation notes
- For changed functions: list changed behavior as "new:" and note "(existing tests unchanged)" for unchanged behavior

---

## Integration with Workflow

- **Planning (Step 2):** Read CODE-STRUCTURE.md before exploring individual files — understand existing signatures and call relationships first
- **Planning (Step 3):** Write `## Mid-Level Design` section in plan using this format
- **Implementation (Section 2.5):** Update CODE-STRUCTURE.md as part of each task's commit
- **Pre-commit checklist:** Verify CODE-STRUCTURE.md is updated before every commit

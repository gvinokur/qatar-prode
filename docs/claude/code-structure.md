# Code Structure Guide

Format and maintenance rules for the `CODE-STRUCTURE.md` system — the living map of this codebase.

---

## Overview

The codebase map is split across multiple files to stay within context limits. The entry point is always `CODE-STRUCTURE.md` at the project root.

```
CODE-STRUCTURE.md                          ← index + call graph (always read this first)
docs/code-structure/
  db.md                                    ← all repositories (app/db/)
  actions.md                               ← all server actions (app/actions/)
  utils.md                                 ← utilities (app/utils/)
  pages.md                                 ← page routes, layouts, API routes
  components/
    components-tournament-games.md         ← game cards, predictions, boosts, filters, score input
    components-tournament-page.md          ← tournament home, groups list, sidebar, standings
    components-friend-groups.md            ← groups management, join requests, discovery, sharing
    components-leaderboard-stats.md        ← leaderboard, head-to-head, stats cards
    components-qualified-teams.md          ← qualified teams prediction UI
    components-results-playoffs.md         ← results page, playoff bracket
    components-auth-onboarding.md          ← auth forms, onboarding steps, tooltips
    components-backoffice.md               ← admin UI components and awards
    components-shared-ui.md               ← header, skeletons, context providers, reusable primitives
```

### What to read during planning (Step 2)

Always read `CODE-STRUCTURE.md` first (index + call graph). Then read the layer files relevant to the story:

- Touching data access → `docs/code-structure/db.md`
- Touching business logic / Server Actions → `docs/code-structure/actions.md`
- Touching utilities → `docs/code-structure/utils.md`
- Touching pages / layouts → `docs/code-structure/pages.md`
- Touching UI → read whichever `docs/code-structure/components/components-[domain].md` files are relevant (may be more than one)

### What to update after each task

Update only the files that cover the code you changed. If you added a new server action, update `actions.md`. If you modified a component in the friend-groups domain, update `components-friend-groups.md`. Always stage the updated code-structure file in the same commit as the source change.

---

## File Format

Every layer file (db, actions, utils, pages, components-*) uses the same format.

### File header

Each layer file starts with:
```markdown
# [Layer Name]

Part of the CODE-STRUCTURE.md system. See `CODE-STRUCTURE.md` for the full index and call graph.

**Last updated:** YYYY-MM-DD
```

### `## Files` section

One `###` subsection per production file, using the relative path from project root as the heading. After the heading: a 1–2 sentence description of the file's responsibility.

```markdown
### app/db/tournament-repository.ts
Encapsulates all Kysely queries for tournaments. No auth or localization logic.
```

---

## Function Entry Format

For repositories, server actions, utilities:

```markdown
- **functionName(param: Type, param2: Type)**: `ReturnType` — 1–2 sentence description.
  Calls: otherProjectFunction, anotherFunction
  Uses: useCustomHook
```

**Rules:**
- Bold name with full TypeScript signature (all params with types, return type)
- Em-dash (`—`) separating signature from description
- `Calls:` lists **project functions only** — no npm packages, no Node stdlib, no Next.js/React internals. Omit line entirely if none.
- `Uses:` lists custom hooks consumed (not useState, useEffect). Omit if none.
- Async functions: return type is `Promise<T>`, not just `T`

---

## React Component Entry Format

```markdown
- **ComponentName({ prop, prop2 }: PropsType)**: `JSX.Element` — [Tag] description.
  Calls: serverActionOrUtility
  Uses: useCustomHook
  Renders: ChildComponent, AnotherComponent
```

**Component type tags** (add to the beginning of description):
- `[Server]` — Next.js Server Component (no `'use client'`)
- `[Client]` — React Client Component (`'use client'` directive)
- `[Provider]` — Context Provider wrapping children

**Rules:**
- `Calls:` lists project server actions or utilities invoked (not React hooks)
- `Uses:` lists custom hooks or contexts consumed
- `Renders:` lists non-trivial project components rendered. Omit for MUI-only renders or exhaustive lists.
- Omit any line (`Calls:`, `Uses:`, `Renders:`) if it would be empty

---

## `CODE-STRUCTURE.md` Format (the index file)

The root `CODE-STRUCTURE.md` contains two sections only — no function detail.

### `## File Index` section

Lists every layer file and component domain file with:
- Relative path as a link
- 2–4 sentence description covering what kinds of files it documents, which features it's relevant for, and what to look for there

Example:
```markdown
## File Index

### [docs/code-structure/db.md](docs/code-structure/db.md)
All Kysely repository functions for every database table. Read this when a story
touches data access — finding an existing query to reuse, adding a new query, or
understanding what columns are available. Each function lists its exact TypeScript
signature. No auth or localization logic lives here.

### [docs/code-structure/components/components-friend-groups.md](docs/code-structure/components/components-friend-groups.md)
All components for the friend groups feature: group management UI, join request
forms, public group discovery browser, admin panels, group sharing templates,
privacy settings, and betting configuration. Read this for any story touching
friend groups, invitations, or the groups leaderboard tab.
```

### `## Call Graph` section

ASCII tree for major call chains across layers (page → action → repository). Use `[server action]` and `[renders]` edge labels. This is the cross-layer view.

---

## Maintenance Rules

### When to update

Update the relevant layer file **as part of every task commit** — not at end of story.

| Change | Update |
|--------|--------|
| New/modified repository function | `docs/code-structure/db.md` |
| New/modified server action | `docs/code-structure/actions.md` |
| New/modified utility | `docs/code-structure/utils.md` |
| New/modified page or layout | `docs/code-structure/pages.md` |
| New/modified component | the matching `components/components-[domain].md` |
| New file in a new domain | create a new `components-[domain].md` and add to index in `CODE-STRUCTURE.md` |

### Quality checks before committing

- Every exported function/component in modified files has a matching entry
- Signatures exactly match the implemented signatures (not the plan's signatures if they changed)
- `Calls:` lists only project functions (no npm packages)
- `CODE-STRUCTURE.md` index is updated if a new layer file was added

---

## Mid-Level Design in Story Plans

During planning, the `## Mid-Level Design` section uses the same per-function format as the layer files, extended with test cases.

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

### `app/components/friend-groups/group-list.tsx` *(new file)*

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

- Minimum 3 test cases per new function/component
- At least one error/edge case (unauthorized, not found, empty input)
- Cases must be observable via assertions, not implementation notes
- For changed functions: note "(existing tests unchanged)" and list only new behavior

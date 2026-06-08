# Plan Template: STORY-N-plan.md

This is the complete template for creating a story plan document at `plans/STORY-${N}-plan.md`.

## Document Structure

```markdown
# Plan: [Story Title] #[N]

## Story Context

**Issue:** #[N] — [Story title]
**Epic:** [Epic title and link if applicable]
**Milestone:** [Milestone name if applicable]

## Objective

[1-3 sentences describing what this story accomplishes and why it matters]

## Acceptance Criteria

- [ ] [Criterion 1 — testable, user-observable]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

## Technical Approach

[2-5 paragraphs describing the implementation strategy. Include:]
- Which existing patterns this follows
- What new patterns it introduces (if any)
- Key technical decisions and their rationale
- Dependencies on other systems/services

## Visual Prototypes (if UI changes)

[ASCII diagrams and descriptions of UI components. See /architect Step 3.1 for format guide.]

### Component: [Name]

**Layout:**
[Description of layout]

**ASCII Diagram:**
```
┌─────────────────────────────────────┐
│         [Component Name]            │
├─────────────────────────────────────┤
│  [Field 1]: [____________]          │
│  [Field 2]: [____________]          │
│                                     │
│              [Cancel] [Save]        │
└─────────────────────────────────────┘
```

**States:**
- Loading: [description]
- Error: [description]
- Success: [description]

**Material-UI components:**
- [List MUI components used]

## Mid-Level Design

### Call Graph Changes

*(Required when the story adds/changes any cross-layer call relationship, new context provider,
or new end-to-end UI flow. Write "No call graph changes." if truly none.)*

**Modified flows:**
- **Flow N ([name])** — [describe the change: extend, add branch, etc.]

**New flows:**
- none

### `app/db/[file].ts` *(new|modified)*

**New functions:**

- **functionName(param: Type): ReturnType**
  [1-2 sentence description of what it does]
  Calls: [project functions only; omit npm/stdlib/framework]
  Tests:
  - [observable behavior — happy path]
  - [observable behavior — error/edge case]
  - [observable behavior — boundary condition]

### `app/actions/[file].ts` *(new|modified)*

[Same format as above]

### `app/components/[domain]/[file].tsx` *(new|modified)*

**New components:**

- **ComponentName({ prop1, prop2 }: Props): JSX.Element** [Client|Server]
  [Description]
  Renders: [child components]
  Tests:
  - [renders correctly with valid props]
  - [handles empty/null state]
  - [user interaction triggers expected callback]

## Files to Create/Modify

**Create:**
- `path/to/new-file.ts` — [purpose]

**Modify:**
- `path/to/existing-file.ts` — [what changes]

## Implementation Steps

1. **[Step name]** — [description]
   - Files: [list]
   - Dependencies: [none | Step N must complete first]

2. **[Step name]** — [description]
   ...

## Testing Strategy

**Unit tests:**
- [file or function] — [what to test]

**Component tests:**
- [component] — [scenarios]

**Integration tests (if applicable):**
- [scenario]

**Coverage target:** ≥80% on new code

## Validation Considerations

- SonarCloud: [anticipated issues and mitigations]
- Coverage: [strategy for achieving ≥80%]
- Security: [auth checks, input validation strategy]

## Open Questions

- [ ] [Question 1 — decision needed before/during implementation]
- [ ] [Question 2]

## Implementation Amendments

*(Added during implementation when deviations from plan are discovered)*

### Amendment 1: [Title]
**Date:** [YYYY-MM-DD]
**Reason:** [Why this was needed]
**Change:** [What was actually done differently]
```

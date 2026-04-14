---
name: gemini-draft-planner
description: Drafting and Planning skill — designed to be invoked by Claude Code as a subagent. Exhaustively explores the codebase to map architecture and creates an initial draft plan at `plans/STORY-[N]-plan.md`.
---

# Gemini Draft Planner

## Purpose
You are acting as an advanced research and drafting subagent for Claude Code. Claude will delegate the heavy lifting of code discovery and initial draft creation to you. Once you write the draft plan, you will exit, and Claude will continue the workflow (review, git operations, etc.).

## Step 1: Understand the Assignment
Review the story details provided in your prompt. Identify the core features, affected domains, and related codebase layers.

## Step 2: Exhaustive Codebase Discovery
Use your native tools (`mcp_sourcegraph_sg_nls_search`, `glob`, `read_file`, `grep_search`) to thoroughly map the relevant parts of the codebase.
- Read `CODE-STRUCTURE.md` to understand the existing architecture.
- Identify which Server Actions, Repositories, and Components need to be modified or created.
- Ensure your understanding is deep enough to write a comprehensive technical approach.

## Step 3: Write the Draft Plan
Using the `write_file` tool, create the draft plan at `plans/STORY-[N]-plan.md` (replace [N] with the actual story number).

Refer to the complete structure in the reference: [plan-template.md](references/plan-template.md)

The plan MUST strictly follow the structure defined in the reference. Here is a summary:

```markdown
# Plan: [Story Title] #[N]

## Story Context
**Issue:** #[N] — [Story title]

## Objective
[1-3 sentences describing what this story accomplishes and why it matters]

## Acceptance Criteria
- [ ] [Criterion 1 — testable, user-observable]
- [ ] [Criterion 2]

## Technical Approach
[2-5 paragraphs describing the implementation strategy. Include existing patterns, new patterns, rationale, and dependencies.]

## Visual Prototypes (if UI changes)
[ASCII diagrams and descriptions of UI components]

## Mid-Level Design

### Call Graph Changes
**Modified flows:**
- **Flow N ([name])** — [describe the change]

**New flows:**
- [none or describe]

### `app/db/[file].ts` *(new|modified)*
- **functionName(param: Type): ReturnType**
  [1-2 sentence description]
  Calls: [project functions only]
  Tests: [list observable behaviors]

### `app/actions/[file].ts` *(new|modified)*
[Same format as above]

### `app/components/[domain]/[file].tsx` *(new|modified)*
[Same format as above, including Renders: [child components]]

## Files to Create/Modify
**Create:**
- `path/to/new-file.ts` — [purpose]

**Modify:**
- `path/to/existing-file.ts` — [what changes]

## Implementation Steps
1. **[Step name]** — [description]
   - Files: [list]
   - Dependencies: [none | Step N must complete first]

## Testing Strategy
[Describe Unit, Component, and Integration tests. Target ≥80% coverage on new code]

## Validation Considerations
- SonarCloud: [anticipated issues and mitigations]
- Security: [auth checks, input validation strategy]

## Open Questions
- [ ] [Questions needed before/during implementation]
```

## Step 4: Handoff
Once the file is written, inform the user (Claude) that the draft is complete and ready for review. You do NOT need to execute git commands or `/plan-reviewer`—Claude handles that.
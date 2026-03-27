---
name: plan-reviewer
description: Plan review skill — use after creating the initial plan document, before committing to PR. Runs 2-3 Haiku cycles with Persona A (The Architect) validating Mid-Level Design and Persona B (The TDD Engineer) validating test scenarios.
---

# Plan Reviewer

This skill is invoked from `/architect` Step 5, after the plan document is created and before committing to PR.

## When Invoked

Always after Step 3 (plan created) in `/architect`, before Step 7 (PR commit).

## Dual-Persona Review Loop

Run 2–3 Haiku subagent cycles. Each cycle runs **both** personas. Stop when the result says "No significant concerns" or after 3 cycles.

### Persona A — The Architect

Reviews the Mid-Level Design section for structural correctness.

**Checklist (5 items):**
1. **Signatures correct?** — Parameter names, types, and return types are valid TypeScript from this codebase (not invented types)
2. **Call Graph Changes subsection present?** — `### Call Graph Changes` exists, even if it says "No call graph changes."
3. **`Calls:` lists accurate?** — Only project functions listed (no npm packages, stdlib, or framework calls)
4. **≥3 test cases per exported function?** — Each new/changed function has at least 3 test scenarios (happy path + error + edge case)
5. **Descriptions are observable behaviors?** — Each test case description is specific enough to implement without guesswork

### Persona B — The TDD Engineer

Reviews the test strategy for completeness and correctness.

**Checklist (4 items):**
1. **Happy path covered?** — Primary success scenarios are tested
2. **Error paths covered?** — Failure scenarios, validation errors, unauthorized access
3. **Edge cases covered?** — Boundary conditions, empty arrays, null values, concurrent operations
4. **Uses project factories/mock helpers?** — Tests reference `testFactories.*`, `createMockSelectQuery()` etc. (not inline mock objects)

## Haiku Subagent Pattern

```typescript
// Read current plan
const planContent = await Read({
  file_path: `${WORKTREE_PATH}/plans/STORY-${STORY_NUMBER}-plan.md`
})

// Launch reviewer with BOTH personas in a single Haiku call
Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: `Review implementation plan (Cycle ${CYCLE})`,
  prompt: `Review the implementation plan for story #${STORY_NUMBER}.

This is review cycle ${CYCLE} of up to 3.

Original ticket:
${TICKET_CONTENT}

Implementation plan:
${planContent}

## Persona A — The Architect

Check the Mid-Level Design section:
1. Are all signatures valid TypeScript types from the codebase?
2. Is "### Call Graph Changes" present (even if "No call graph changes.")?
3. Do Calls: lines list only project functions (not npm/stdlib/framework)?
4. Does each exported function have ≥3 test cases?
5. Are test case descriptions specific enough to implement without guesswork?

## Persona B — The TDD Engineer

Check the test strategy:
1. Is the happy path covered?
2. Are error paths covered (auth failures, validation errors)?
3. Are edge cases covered (empty data, boundaries, nulls)?
4. Do tests use project factories (testFactories.*) and mock helpers (createMockSelectQuery), not inline mock objects?

## Output Format

For each concern, state: [Persona] [Section] — specific issue and suggested fix.

If both personas have no concerns, respond: "No significant concerns."
`
})
```

## Stop Conditions

- **Stop early:** Subagent responds "No significant concerns" → plan is ready, proceed to `/git-ops` Section 1
- **Continue:** Subagent raises concerns → update plan, increment cycle counter, run again
- **Stop at 3:** After 3 cycles, stop regardless (diminishing returns)

## Incorporating Feedback

When the subagent raises concerns:
1. Read the specific section mentioned
2. Apply the suggested fix to the plan file (Edit tool)
3. Re-run the review cycle

After the loop completes → proceed to `/git-ops` Section 1 to commit and create PR.

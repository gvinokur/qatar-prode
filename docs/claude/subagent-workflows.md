# Subagent Workflows - Quick Reference

Overview and quick reference for using specialized subagents in your development workflow.

## What are Subagents?

Subagents are specialized AI agents that handle specific tasks with focused context, enabling:
- **Parallelization** - Multiple tasks run concurrently
- **Quality improvement** - Automated reviews catch issues early
- **Efficiency** - Focused context = faster, cheaper operations
- **Clear tracking** - Explicit task boundaries and progress

## Four High-Impact Subagent Patterns

We use four subagent patterns integrated into our workflow phases:

### 1. Plan Review Subagent (Planning Phase)

**Purpose:** Automatically review implementation plans before user review to catch issues early.

**When:** ALWAYS during planning phase, after creating initial plan and before PR.

**Impact:** Catches 2-3 issues per story before user review, reduces iteration cycles.

**Details:** See `/plan-reviewer` (full dual-persona loop) invoked from `/architect` Step 5.

---

### 2. Task Definition with Dependencies (Implementation Phase)

**Purpose:** Break approved plan into atomic tasks with explicit dependencies for parallelization and progress tracking.

**When:** IMMEDIATELY after exiting plan mode (user says "execute the plan").

**Impact:** Clear progress tracking, enables parallelization, easier resumption.

**Details:** See `/implementer` Section 2.

---

### 3. Parallel Test Creation (Testing Phase)

**Purpose:** Create tests for multiple files concurrently using focused subagents.

**When:** ALWAYS when implementing 2+ files that need tests.

**Impact:** 2-3x faster test creation, consistent quality.

**Details:** See `/test-engineer` Section 10 (now lives there).

---

### 4. Hybrid Execution Mode (Implementation Phase - Optional)

**Purpose:** Use Haiku subagents for simple tasks while main agent handles complex tasks for speed and cost optimization.

**When:** OPTIONAL - After defining tasks (Section 2.5), if story has 5+ tasks with 3+ being simple/isolated.

**Impact:** 20-40% faster, 30-50% cheaper (depends on simple vs complex task ratio), maintains quality.

**Details:** See `/implementer` Sections 2.5 and 3.5.

---

## When to Use Subagents

### Use Subagents When:
- **Planning review:** Always (2-3 cycles via `/plan-reviewer`)
- **Task definition:** Always for non-trivial stories (via `/implementer` Section 2)
- **Parallel testing:** Always when 2+ files need tests (via `/test-engineer` Section 10)
- **Hybrid execution:** Optional, when 5+ tasks with 3+ simple/isolated

### Don't Use Subagents When:
- **Single simple task:** Overhead not worth it
- **Deep exploration needed:** Use Explore agent instead
- **Architectural decisions:** Needs holistic view, main agent handles
- **Refactoring across files:** Coordination overhead too high
- **Unclear boundaries:** Will produce poor results

## Integration with Workflow Phases

```
┌─────────────────────────────────────┐
│ 1. PLANNING PHASE                   │
├─────────────────────────────────────┤
│ Main Agent:                         │
│   → Create initial plan             │
│                                     │
│ ✨ Plan Reviewer Subagent:          │
│   → /plan-reviewer (2-3 cycles)     │
│   → Main agent updates plan         │
│                                     │
│ Create PR via /git-ops Section 1    │
│ → User review                       │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. IMPLEMENTATION PHASE             │
├─────────────────────────────────────┤
│ Main Agent:                         │
│   → Exit plan mode                  │
│                                     │
│ ✨ Task Definition Pattern:         │
│   → /implementer Section 2         │
│   → TaskCreate for atomic units     │
│   → TaskUpdate for dependencies     │
│   → Identify parallel opportunities │
│                                     │
│ ✨ Execution Mode Choice (Optional):│
│   → Classify tasks (simple/complex) │
│   → Proceed immediately (no input)  │
│   → If hybrid: delegate simple tasks│
│                                     │
│ Main Agent (or Hybrid):             │
│   → Implement in waves              │
│   → Mark in_progress/completed      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. TESTING PHASE                    │
├─────────────────────────────────────┤
│ ✨ Parallel Test Creation:          │
│   → /test-engineer Section 10       │
│   → Launch test subagents (Haiku)   │
│   → Create tests concurrently       │
│                                     │
│ Main Agent:                         │
│   → Review test outputs             │
│   → Run all tests, check coverage   │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 4. VALIDATION PHASE                 │
├─────────────────────────────────────┤
│ Main Agent:                         │
│   → Wait for user: "code looks good"│
│   → Follow /code-reviewer workflow  │
│   → SonarCloud validation           │
└─────────────────────────────────────┘
```

## Best Practices

### Model Selection

- **Haiku:** Plan reviews, test creation, simple focused tasks (fast + cheap)
- **Sonnet:** Complex analysis, architectural decisions, coordinating work (capable + thorough)
- **Opus:** Reserved for most complex tasks (expensive, use sparingly)

### Context Management

**Include:**
- ✅ Directly relevant files only
- ✅ Key conventions/guidelines
- ✅ One example as reference (not 10)

**Exclude:**
- ❌ Entire codebase
- ❌ Unrelated files
- ❌ Multiple examples

### Parallelization

**To parallelize:**
- Use SINGLE message with multiple Task calls
- Example: 3 test subagents = 1 message with 3 Task tool uses

**Don't parallelize:**
- Dependent tasks (respect blockedBy relationships)
- Tasks that need coordination

### Review Outputs

**Always review subagent work:**
- Check quality before integrating
- Don't blindly accept suggestions
- Main agent makes final decisions

## Common Mistakes

| Mistake | Correct Approach |
|---------|------------------|
| Skipping plan review | Always use (2-3 cycles via `/plan-reviewer`) |
| No task definition | Always create tasks before coding |
| Sequential test creation | Parallelize when 2+ files (`/test-engineer` Section 10) |
| Too much context | Only include relevant files |
| Too little context | Include implementation + conventions + example |
| Not reviewing output | Always review before integrating |
| Wrong model | Haiku for simple, Sonnet for complex |
| Parallelizing dependent tasks | Respect dependencies |
| Over-iterating reviews | Stop after 2-3 cycles |

## Quick Workflow Reference

```
User: "Implement story #42"

1. Planning:
   ✓ EnterPlanMode, research, create plan (/architect)
   ✓ Launch Plan Reviewer via /plan-reviewer (2-3 cycles)
   ✓ Commit plan, create DRAFT PR via /git-ops Section 1
   ✓ Wait for user approval

2. User: "Execute the plan"
   ✓ Exit plan mode

3. Implementation:
   ✓ TaskCreate (break into atomic units) /implementer Section 2
   ✓ TaskUpdate (define dependencies)
   ✓ Implement in waves
   ✓ Mark tasks in_progress → completed

4. Testing:
   ✓ Launch test subagents in parallel via /test-engineer Section 10
   ✓ Review outputs
   ✓ Run tests, verify coverage

5. User: "Code looks good"
   ✓ /code-reviewer validation workflow
   ✓ SonarCloud analysis
   ✓ Section 7.5 Documentation Audit
   ✓ Ready to merge via /git-ops Section 4
```

## Detailed Documentation

For complete implementation details, see:

- **`/plan-reviewer`** — Plan review dual-persona loop
- **`/architect`** — Planning workflow (Steps 1-10)
- **`/implementer`** — Implementation workflow (Sections 1-9)
- **`/test-engineer`** — Testing guide with parallel creation (Section 10)
- **`/code-reviewer`** — Validation workflow (Sections 1-8)
- **`/git-ops`** — Git operation templates

For full investigation and future optimizations, see:
- **[Workflow Optimization Investigation](../workflow-optimization-investigation.md)**

---

**Remember:** Subagents are tools to improve efficiency and quality, but the main agent coordinates everything and makes final decisions. When in doubt, handle it yourself - only use subagents when the benefit is clear.

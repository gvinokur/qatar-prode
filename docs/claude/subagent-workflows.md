# Subagent Workflows - Quick Reference

Overview and quick reference for using specialized subagents in your development workflow.

## What are Subagents?

Subagents are specialized AI agents that handle specific tasks with focused context, enabling:
- **Parallelization** - Multiple tasks run concurrently
- **Quality improvement** - Automated reviews catch issues early
- **Efficiency** - Focused context = faster, cheaper operations
- **Clear tracking** - Explicit task boundaries and progress

## Three High-Impact Subagent Patterns

We use three subagent patterns integrated into our workflow phases:

### 1. Plan Review Subagent (Planning Phase)

**Purpose:** Automatically review implementation plans before user review to catch issues early.

**When:** ALWAYS during planning phase, after creating initial plan and before PR.

**Impact:** Catches 2-3 issues per story before user review, reduces iteration cycles.

**Details:** See **[Planning Guide - Section 4: Plan Review](planning.md#4-plan-review-with-subagent-mandatory)**

**Quick example:**
```typescript
// After creating plan, launch reviewer
Task({
  subagent_type: "general-purpose",
  model: "haiku",
  description: "Review implementation plan",
  prompt: `Review plan for feasibility, testability, risks...`
})

// Incorporate feedback, repeat 2-3 cycles
```

---

### 2. Task Definition with Dependencies (Implementation Phase)

**Purpose:** Break approved plan into atomic tasks with explicit dependencies for parallelization and progress tracking.

**When:** IMMEDIATELY after exiting plan mode (user says "execute the plan").

**Impact:** Clear progress tracking, enables parallelization, easier resumption.

**Details:** See **[Implementation Guide - Section 2: Task Definition](implementation.md#2-task-definition-phase-mandatory)**

**Quick example:**
```typescript
// After exiting plan mode
TaskCreate({
  subject: "Add database tables",
  description: "Files, dependencies, success criteria...",
  activeForm: "Adding database tables"
})

TaskUpdate({
  taskId: "2",
  addBlockedBy: ["1"] // Task 2 blocked by Task 1
})
```

---

### 3. Parallel Test Creation (Testing Phase)

**Purpose:** Create tests for multiple files concurrently using focused subagents.

**When:** ALWAYS when implementing 2+ files that need tests.

**Impact:** 2-3x faster test creation, consistent quality.

**Details:** See **[Testing Guide - Parallel Test Creation](testing.md#parallel-test-creation-recommended)**

**Quick example:**
```typescript
// After implementing files A, B, C
// Launch 3 subagents in parallel (single message, multiple Task calls)

Task({subagent_type: "general-purpose", model: "haiku", ...}) // Test A
Task({subagent_type: "general-purpose", model: "haiku", ...}) // Test B
Task({subagent_type: "general-purpose", model: "haiku", ...}) // Test C

// Review outputs, run tests
```

---

## When to Use Subagents

### ✅ Use Subagents When:
- **Planning review:** Always (2-3 cycles)
- **Task definition:** Always for non-trivial stories
- **Parallel testing:** Always when 2+ files need tests
- **Independent work:** Tasks with clear boundaries and no dependencies

### ❌ Don't Use Subagents When:
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
│   → Review 2-3 cycles               │
│   → Main agent updates plan         │
│                                     │
│ Create PR → User review             │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 2. IMPLEMENTATION PHASE             │
├─────────────────────────────────────┤
│ Main Agent:                         │
│   → Exit plan mode                  │
│                                     │
│ ✨ Task Definition Pattern:         │
│   → TaskCreate for atomic units     │
│   → TaskUpdate for dependencies     │
│   → Identify parallel opportunities │
│                                     │
│ Main Agent:                         │
│   → Implement in waves              │
│   → Mark in_progress/completed      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│ 3. TESTING PHASE                    │
├─────────────────────────────────────┤
│ ✨ Parallel Test Creation:          │
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
│   → Run validation pipeline         │
│   → Push and wait for CI/CD         │
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
| Skipping plan review | Always use (2-3 cycles) |
| No task definition | Always create tasks before coding |
| Sequential test creation | Parallelize when 2+ files |
| Too much context | Only include relevant files |
| Too little context | Include implementation + conventions + example |
| Not reviewing output | Always review before integrating |
| Wrong model | Haiku for simple, Sonnet for complex |
| Parallelizing dependent tasks | Respect dependencies |
| Over-iterating reviews | Stop after 2-3 cycles |

## Quick Workflow Reference

### Story Implementation with Subagents

```
User: "Implement story #42"

1. Planning:
   ✓ EnterPlanMode, research, create plan
   ✓ Launch Plan Reviewer (2-3 cycles)
   ✓ Commit reviewed plan, create PR
   ✓ Wait for user approval

2. User: "Execute the plan"
   ✓ Exit plan mode

3. Implementation:
   ✓ TaskCreate (break into atomic units)
   ✓ TaskUpdate (define dependencies)
   ✓ Implement in waves
   ✓ Mark tasks in_progress → completed

4. Testing:
   ✓ Launch test subagents in parallel (if 2+ files)
   ✓ Review outputs
   ✓ Run tests, verify coverage

5. User: "Code looks good"
   ✓ Validation phase
   ✓ Push, wait for CI/CD
   ✓ Ready to merge
```

## Expected Improvements

**Planning Quality:**
- Fewer user review cycles (1-2 vs 2-3)
- Issues caught before user sees them
- Better consideration of testability

**Development Speed:**
- 20-30% faster via parallelization
- 2-3x faster test creation
- Clear progress tracking

**Quality Maintained:**
- 0 new SonarCloud issues (maintained)
- >80% test coverage (maintained)
- All quality gates still enforced

## Detailed Documentation

For complete implementation details, see:

- **[Planning Guide](planning.md)** - Section 4: Plan Review with Subagent
- **[Implementation Guide](implementation.md)** - Section 2: Task Definition Phase
- **[Testing Guide](testing.md)** - Section: Parallel Test Creation

For full investigation and future optimizations, see:
- **[Workflow Optimization Investigation](../workflow-optimization-investigation.md)**

## Future Optimization Patterns

Additional patterns documented for future consideration:

**Medium Priority:**
- Progressive context loading (load files as needed)
- Validation pipeline automation (automate test/build cycles)
- Incremental development with checkpoints

**Low Priority:**
- Template-based code generation
- Smart commit bundling

See [Workflow Optimization Investigation](../workflow-optimization-investigation.md) for details.

---

**Remember:** Subagents are tools to improve efficiency and quality, but the main agent coordinates everything and makes final decisions. When in doubt, handle it yourself - only use subagents when the benefit is clear.

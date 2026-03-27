# SonarCloud Guide

Common SonarCloud issues, severity interpretation, and resolution patterns. Referenced from `/code-reviewer` SKILL.md.

## Severity Interpretation Table

| Severity | Emoji | Meaning | Action |
|----------|-------|---------|--------|
| BLOCKER | 🔴🔴🔴 | Critical issues that block release | Fix immediately, highest priority |
| CRITICAL | 🔴🔴 | Serious issues that must be fixed | Fix before merge |
| MAJOR | 🟡 | Important issues that should be fixed | Fix before merge |
| MINOR | 🟢 | Minor issues that should be addressed | Fix before merge |
| INFO | ℹ️ | Informational findings | Fix before merge |

**IMPORTANT:** ALL new issues must be fixed, regardless of severity. Even MINOR code smells and INFO findings must be resolved before merge. Zero tolerance.

## Quality Gate Criteria

- ✅ **0 new issues** of ANY severity (including MINOR and INFO)
- ✅ **80%+ coverage** on new code
- ✅ **Security rating: A**
- ✅ **Maintainability: B or higher**
- ✅ **< 5% duplicated code**

## Common SonarCloud Issues and Fixes

### Code Smells

| Issue | Rule | Fix |
|-------|------|-----|
| Function complexity too high | cognitive complexity | Refactor into smaller functions |
| Duplicate code blocks | typescript:S3626 | Extract to shared utility |
| Too many parameters | | Use options object |
| Component defined inside parent | typescript:S6478 | Move component definition outside parent, pass data as props |
| Nested ternary operation | typescript:S3358 | Extract into independent statement or conditional variable |
| Props not marked read-only | typescript:S6759 | Add `readonly` to interface/type props |
| Unused variable | | Remove or use it |

### Bugs

| Issue | Fix |
|-------|-----|
| Potential null pointer | Add null checks |
| Unused variable | Remove or use it |
| Type mismatch | Fix type annotations |
| Promise not awaited | Add await |

### Security

| Issue | Fix |
|-------|-----|
| Weak cryptography | Use secure alternatives |
| SQL injection risk | Use parameterized queries (Kysely does this automatically) |
| XSS vulnerability | Sanitize user input |
| Hardcoded credentials | Use environment variables |

### Coverage

| Issue | Fix |
|-------|-----|
| Low coverage on new code (< 80%) | Add unit tests |
| Uncovered branches | Add test cases for edge cases |
| Uncovered lines | Test error paths |
| Uncovered functions | Ensure each exported function has tests |

## Example SonarCloud Output

```
Coverage on new code: 97.83%

Found 5 New Issues

By Severity:
  🟡 MAJOR: 3
  🟢 MINOR: 2

By Type:
  👃 CODE_SMELL: 5

Detailed Issues:

1. [🟡 MAJOR] [👃 CODE_SMELL]
   Move this component definition out of the parent component and pass data as props.
   📁 app/components/compact-game-view-card.tsx:214
   📋 Rule: typescript:S6478

2. [🟡 MAJOR] [👃 CODE_SMELL]
   Extract this nested ternary operation into an independent statement.
   📁 app/components/game-countdown-display.tsx:52
   📋 Rule: typescript:S3358

3. [🟢 MINOR] [👃 CODE_SMELL]
   Mark the props of the component as read-only.
   📁 app/components/context-providers/countdown-context-provider.tsx:28
   📋 Rule: typescript:S6759

SonarCloud Report: https://sonarcloud.io/project/issues?pullRequest=61&id=gvinokur_qatar-prode&resolved=false

These issues must be resolved before merging.
Would you like me to fix these issues?
```

## Good Flow vs Bad Flow

### Good Flow

```
User: "Code works great, let's get this merged"
Claude: [Runs ./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}]
Claude: [Runs ./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}]
Claude: "SonarCloud found 3 MAJOR and 2 MINOR code smells:
        - Coverage on new code: 97.83%
        - Issues found in:
          * app/components/compact-game-view-card.tsx:214
          * app/components/game-countdown-display.tsx:52
          * app/components/context-providers/countdown-context-provider.tsx:28,41
          * app/components/game-countdown-display.tsx:27
        Would you like me to fix these issues?"
User: "Yes, fix them"
Claude: [Fixes issues, commits, pushes]
Claude: [Runs ./scripts/github-projects-helper pr wait-checks ${PR_NUMBER}]
Claude: [Runs ./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}]
Claude: "✅ All quality gates passed!
        - Coverage: 98.1%
        - 0 new issues
        Ready to merge."
```

### Bad Flow (DON'T DO THIS)

```
❌ Claude: [Checks GitHub status without using helper script]
❌ Claude: "SonarCloud check passed, ready to merge!"
[Doesn't fetch actual issues, misses 5 code smells]
```

```
❌ Claude: [Runs helper script, finds 2 MINOR code smells]
❌ Claude: "Found 2 MINOR code smells but they're minor, ready to merge!"
[Ignores quality gate — WRONG, all issues must be fixed]
```

## Best Practices

1. **Never skip validation** - Even if code "looks good"
2. **Use helper script for SonarCloud** - `./scripts/github-projects-helper pr sonar-issues ${PR_NUMBER}` provides accurate, detailed results
3. **Fix all issues before merge** - No technical debt, even for MINOR issues
4. **Ask permission to fix** - Don't surprise user with changes
5. **Run tests after fixes** - Ensure fixes don't break anything
6. **Re-validate after fixes** - Wait for SonarCloud re-analysis and run helper script again
7. **Check coverage on new code** - Must be ≥80%, the helper script shows this automatically

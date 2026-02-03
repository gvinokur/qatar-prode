# Implementation Plan: Story 3 - Document Database Testing Helpers

**Story:** #75 - Document Database Testing Helpers
**Epic:** #72 - Test Pattern Refactoring & Utility Standardization
**Priority:** P1 - HIGH
**Effort:** 2-3 hours

---

## Overview

This story documents existing database testing utilities (`mock-helpers.ts` and `test-factories.ts`) to increase adoption from 20-40% to 80%+. These utilities are excellent but underutilized due to lack of documentation and visibility.

### Current State
- Comprehensive testing utilities exist in `__tests__/db/`
- `mock-helpers.ts`: 9 query mocking utilities + assertion helpers
- `test-factories.ts`: 20+ type-safe entity factories
- `setup-helpers.ts`, `next-auth.mocks.ts`, `next-navigation.mocks.ts`: Integration test helpers
- Low adoption (20-40%) - many tests build mocks manually

### Goal State
- Comprehensive README with examples and before/after comparisons
- JSDoc on all helper functions with usage examples
- 80%+ adoption in future tests through better visibility

---

## Acceptance Criteria

### Documentation Created
- [ ] `__tests__/db/README.md` created with:
  - Overview section explaining utilities
  - Mock Helpers section documenting all 9 utilities
  - Test Factories section documenting 20+ factories
  - Setup Helpers section documenting integration test utilities
  - Before/after examples for common patterns
  - Quick reference cheat sheet
  - "When to use what" decision guide
  - Migration guide from manual to helpers

### JSDoc Added
- [ ] `__tests__/db/mock-helpers.ts` - JSDoc on all 9 exported functions
- [ ] `__tests__/db/test-factories.ts` - JSDoc on all factory functions
- [ ] `__tests__/mocks/setup-helpers.ts` - JSDoc on setup functions
- [ ] `__tests__/mocks/next-auth.mocks.ts` - JSDoc on auth mocks
- [ ] `__tests__/mocks/next-navigation.mocks.ts` - JSDoc on navigation mocks

### Quality Gates
- [ ] Documentation is clear and comprehensive
- [ ] Examples are copy-paste ready
- [ ] All utilities documented
- [ ] Before/after comparisons included
- [ ] TypeScript examples compile
- [ ] Links to utilities work correctly

---

## Technical Approach

### 1. Documentation Structure

Create `__tests__/db/README.md` with the following structure:

```markdown
# Database Testing Utilities

## Table of Contents
[Auto-generated TOC]

## Overview
- What utilities exist
- Why use them (consistency, less boilerplate, type safety)
- Architecture (database mocks, factories, integration helpers)

## Quick Reference
Cheat sheet table:
| Task | Helper | Example |
|------|--------|---------|
| Mock SELECT query | createMockSelectQuery | ... |
| Create test user | testFactories.user | ... |
| Setup component mocks | setupTestMocks | ... |

## Mock Helpers (mock-helpers.ts)

### Overview
Brief explanation of how helpers relate to each other (e.g., `createMockDatabase()` uses individual query mocks internally)

### SELECT Queries
- createMockSelectQuery<T>(result)
- createMockEmptyQuery()
- createMockNullQuery()
- createMockErrorQuery(error?)

### INSERT/UPDATE/DELETE Queries
- createMockInsertQuery<T>(result)
- createMockUpdateQuery<T>(result)
- createMockDeleteQuery<T>(result)

### Complete Mocks
- createMockDatabase()
- createMockBaseFunctions<T>()

### Assertions
- expectKyselyQuery()

## Test Factories (test-factories.ts)

### Available Factories (20+)
- Core: tournament, user, team, game, player
- Game system: gameGuess, gameResult
- Tournament structure: tournamentGroup, tournamentGroupTeam, etc.
- Guessing: tournamentGuess, prodeGroup
- Venues: tournamentVenue, tournamentThirdPlaceRules
- Betting: prodeGroupTournamentBetting, etc.

### Using Overrides
### Bulk Creation with createMany()

## Integration Test Helpers

### Setup Helpers (setup-helpers.ts)
- setupTestMocks() - orchestrates navigation, session, signIn mocks

### Auth Mocks (next-auth.mocks.ts)
- createMockSession()
- createAuthenticatedSessionValue()
- createUnauthenticatedSessionValue()
- createMockSignIn()

### Navigation Mocks (next-navigation.mocks.ts)
- createMockRouter()
- createMockSearchParams()

## Common Patterns

### Pattern 1: Testing Repository Methods
Complete example: arrange (mock + factory), act, assert

### Pattern 2: Testing Error Cases
Using createMockErrorQuery

### Pattern 3: Testing Empty Results
Using createMockEmptyQuery vs createMockNullQuery

### Pattern 4: Testing Component with Auth
Using setupTestMocks for integration tests

## Migration Guide

### From Manual Chains to Helpers
Before/after examples:
- SELECT query (8 lines → 2 lines)
- INSERT query
- Manual test data → factory with overrides

## When to Use What

### Decision Tree
- Testing repository? → Use mock-helpers + test-factories
- Testing component with auth? → Use setup-helpers
- Need custom test data? → Use factories with overrides
- Testing error case? → Use createMockErrorQuery

## Troubleshooting

### Common Issues
- "Type error with mock query" → Use proper generic type
- "Mock not being called" → Check hoisted mock setup
- "Factory missing property" → Use overrides parameter
```

### 2. JSDoc Standards

Each function should have:
- **Description**: What it does and when to use it
- **Type parameters**: Generic types explained
- **Parameters**: Each param with description
- **Returns**: Return type description
- **Examples**: 1-2 practical examples showing usage
- **See**: Cross-references to related helpers

Example format:
```typescript
/**
 * Creates a mock SELECT query chain that returns the provided result.
 *
 * Use this when testing repository methods that perform SELECT operations.
 * Automatically creates a complete Kysely query chain with all methods.
 *
 * @template T - The type of data being queried
 * @param result - The data to return (single record or array)
 * @returns A mock query object with chainable Kysely methods
 *
 * @example
 * ```typescript
 * // Single result
 * const mockTournament = testFactories.tournament({ id: '1' });
 * const mockQuery = createMockSelectQuery(mockTournament);
 * mockDb.selectFrom.mockReturnValue(mockQuery);
 * ```
 *
 * @example
 * ```typescript
 * // Multiple results
 * const tournaments = createMany(testFactories.tournament, 3);
 * const mockQuery = createMockSelectQuery(tournaments);
 * mockDb.selectFrom.mockReturnValue(mockQuery);
 * ```
 *
 * @see {@link createMockEmptyQuery} for queries returning empty arrays
 * @see {@link createMockNullQuery} for queries returning null
 */
export const createMockSelectQuery = <T>(result: T | T[]) => {
  // ... implementation
};
```

### 3. Real Examples from Codebase

Use actual patterns from existing test files as examples:
- `__tests__/db/tournaments.repository.test.ts` - Complex queries with joins
- `__tests__/db/users.repository.test.ts` - CRUD operations
- `__tests__/db/game-guesses.repository.test.ts` - Error handling
- Component tests - Integration test patterns

---

## Files to Create

### New Files
1. `__tests__/db/README.md` (≈800-1000 lines)
   - Comprehensive documentation with all sections
   - Copy-paste ready examples
   - Before/after comparisons
   - Quick reference tables

---

## Files to Modify

### Existing Files - Add JSDoc Only
1. `__tests__/db/mock-helpers.ts`
   - Add JSDoc to 9 exported functions
   - Include usage examples in JSDoc
   - Cross-reference related helpers

2. `__tests__/db/test-factories.ts`
   - Add JSDoc to all factory functions (20+)
   - Document available properties/overrides
   - Show override examples

3. `__tests__/mocks/setup-helpers.ts`
   - Add JSDoc to `setupTestMocks` function
   - Document options interface
   - Show configuration examples

4. `__tests__/mocks/next-auth.mocks.ts`
   - Add JSDoc to session factory functions
   - Document authenticated vs unauthenticated states
   - Show typical usage patterns

5. `__tests__/mocks/next-navigation.mocks.ts`
   - Add JSDoc to router and search param mocks
   - Document available methods
   - Show component testing examples

---

## Implementation Steps

### Phase 1: Research & Setup (20 min)
1. Read `mock-helpers.ts` completely - verify count and understand all utilities (expect ~10 functions)
2. Read `test-factories.ts` completely - verify count and catalog all factories (expect ~20 factories)
3. Read integration helper files - understand setup patterns
4. Review specific test files to understand usage patterns:
   - `__tests__/db/base-repository.test.ts` - Mock helper usage
   - `__tests__/db/tournaments.repository.test.ts` - Complex queries with joins
   - `__tests__/db/users.repository.test.ts` - CRUD operations
   - `__tests__/db/game-guesses.repository.test.ts` - Error handling patterns
   - Component tests using integration helpers
5. Identify best examples for before/after comparisons (from above files)

### Phase 2: Create README Structure (15 min)
6. Create `__tests__/db/README.md` with full section structure
7. Write overview explaining purpose and benefits
8. Add table of contents with anchor links

### Phase 3: Document Mock Helpers (45 min)
9. Document SELECT query helpers with examples
   - `createMockSelectQuery` (single & array results)
   - `createMockEmptyQuery`, `createMockNullQuery`
   - `createMockErrorQuery`
10. Document mutation helpers
   - `createMockInsertQuery`, `createMockUpdateQuery`, `createMockDeleteQuery`
11. Document complete mocks
   - `createMockDatabase`, `createMockBaseFunctions`
12. Document assertions
   - `expectKyselyQuery` fluent builder
13. Add before/after examples showing line reduction

### Phase 4: Document Test Factories (30 min)
14. List all 20+ available factories with descriptions
15. Show basic usage with default values
16. Show override patterns for customization
17. Document `createMany()` for bulk creation
18. Add before/after examples (manual object creation → factory)

### Phase 5: Document Integration Helpers (20 min)
19. Document `setupTestMocks` orchestration function
20. Document auth mocking utilities
21. Document navigation mocking utilities
22. Show complete component test example

### Phase 6: Add JSDoc to Helpers (45 min)
23. Add JSDoc to all functions in `mock-helpers.ts`
24. Add JSDoc to factories in `test-factories.ts`
25. Add JSDoc to setup helpers
26. Add JSDoc to auth and navigation mocks
27. Include parameter descriptions and return types
28. Add usage examples in each JSDoc block

### Phase 7: Guides & Reference (25 min)
29. Create quick reference cheat sheet table
30. Write "When to use what" decision guide
31. Create migration guide with 2-3 real before/after examples from codebase
32. Add common patterns section
33. Add troubleshooting section with specific scenarios:
   - How to mock errors in Kysely chains
   - When to use `createMockDatabase()` vs individual query mocks
   - Fixing "Type error with mock query"
   - Debugging "Mock not being called"
   - Handling missing factory properties with overrides
34. Add helper interdependencies diagram/section showing how helpers relate

### Phase 8: Review & Polish (20 min)
35. Review documentation for clarity and completeness
36. Test that all examples actually work (manual inspection for TypeScript validity)
37. Check for typos and formatting consistency
38. Ensure all internal links work
39. Verify TypeScript code blocks are syntactically valid (manual review)
40. Run markdown linter to catch formatting issues
41. Add final table of contents

**Total estimated time:** 3.5 hours (within 2-3 hour story estimate when focused)

---

## Testing Strategy

### Documentation Testing
- **Copy-paste validation**: Every code example should be copy-paste ready
- **TypeScript compilation**: All examples should be syntactically valid TypeScript (verified through manual inspection and ensuring code blocks follow project patterns)
- **Link validation**: All internal links should resolve correctly
- **Completeness check**: All utilities from source files are documented
- **Markdown linting**: Run `npm run lint` to catch markdown formatting issues

### Review Criteria
- [ ] Can a new developer understand what each helper does?
- [ ] Are examples realistic and practical?
- [ ] Do before/after comparisons clearly show benefits?
- [ ] Is the quick reference actually quick to scan?
- [ ] Does the decision guide help choose the right tool?

### No Unit Tests Required
This story is documentation-only. No code behavior changes mean no new unit tests needed.

---

## Validation Considerations

### Pre-Commit Validation
- **Build**: Run `npm run build` to ensure no TypeScript errors in JSDoc
- **Lint**: Run `npm run lint` to check markdown formatting and ensure JSDoc examples are syntactically valid
- **Manual review**: Read through README as if you're a new developer

### SonarCloud Requirements
- **Coverage**: N/A (this story creates no executable code; only documentation and JSDoc comments which are not counted toward coverage metrics)
- **Issues**: No code quality issues expected (documentation only)
- **Duplicates**: N/A (documentation is by nature explanatory)

---

## Dependencies & Blockers

### Dependencies
- None - This story has no dependencies and can start immediately

### Blockers
- None identified

### Related Work
- **Benefits all stories**: Better documentation helps all future test creation
- **Epic #72**: Part of test utility standardization effort

---

## Open Questions

None - Story is very well-defined with clear structure and examples provided.

---

## Success Metrics

### Quantitative
- **Helper adoption**: Target 80%+ in future tests (from 20-40%)
- **Documentation completeness**: 100% of utilities documented
- **JSDoc coverage**: 100% of exported functions

### Qualitative
- New developers can find the right helper quickly
- Examples are copy-paste ready
- Before/after comparisons clearly show value
- Reduced "how do I mock this?" questions

---

## Risk Assessment

### Low Risk
- Documentation-only changes (no behavior changes)
- No code modification (only JSDoc additions)
- No impact on existing tests
- Easy to review and iterate

### Mitigation
- Review examples for correctness
- Test that code examples compile
- Have another person review for clarity

---

## Notes

### Key Insights from Exploration
1. **Comprehensive utilities exist**: The testing infrastructure is already excellent
2. **Well-structured**: Clean separation of concerns (mocks, factories, integration)
3. **Type-safe**: All factories and mocks use proper TypeScript types
4. **Good patterns**: Existing test files show consistent patterns

### Focus Areas
1. **Visibility**: Make helpers discoverable through clear documentation
2. **Examples**: Show practical, real-world usage
3. **Benefits**: Demonstrate value through before/after comparisons
4. **Guidance**: Help developers choose the right tool for their task

### Documentation Philosophy
- **Practical over theoretical**: Focus on "how to use" not "how it works internally"
- **Examples first**: Show code before explaining
- **Progressive disclosure**: Quick reference first, details later
- **Copy-paste ready**: All examples should work without modification

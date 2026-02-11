# Implementation Plan: Remove deprecated pages and components after unified games page (#125)

## Story Context

**Issue:** #125
**Title:** Remove deprecated pages and components after unified games page
**Type:** Cleanup/Refactoring
**Epic:** UX Audit 2026

### Background
After merging Story #114 (Unified Games Page), most cleanup has been completed. This story addresses the remaining deprecated code:
- Group detail page that's now redundant (games available via unified page with filters)
- Fixtures component that's dead code with no active usage

## Objectives

1. Remove the group detail page (`/app/tournaments/[id]/groups/[group_id]/page.tsx`)
2. Remove the unused Fixtures component (`/app/components/tournament-page/fixtures.tsx`)
3. Verify no broken imports or references remain
4. Ensure all quality gates pass

## Acceptance Criteria

- [ ] Group detail page deleted
- [ ] Fixtures component deleted
- [ ] No broken imports or references
- [ ] All tests pass (`npm test`)
- [ ] Lint passes (`npm lint`)
- [ ] Build succeeds (`npm build`)
- [ ] 0 new SonarCloud issues

## Technical Approach

### Files to Delete

1. **Group Detail Page**
   - **Path:** `/app/tournaments/[id]/groups/[group_id]/page.tsx`
   - **Why:** Redundant after unified games page
     - Games now accessible via unified page with group filter
     - Standings visible in homepage sidebar
   - **Components used:** GroupTable, GamesGrid, PredictionDashboard (all used elsewhere, will remain)
   - **References found:** Only in fixtures.tsx (which is also being deleted)

2. **Fixtures Component**
   - **Path:** `/app/components/tournament-page/fixtures.tsx`
   - **Why:** Dead code with no active imports
   - **Contains:** Outdated navigation to deprecated group detail page (lines 46-48)
   - **References found:** None (confirmed via codebase search)

### Verification Strategy

**Pre-deletion checks:**
- ✅ Verified no active imports of fixtures.tsx
- ✅ Verified only reference to group detail page is in fixtures.tsx
- ✅ Confirmed tournament-bottom-nav.tsx only has a comment reference (line 29), no active links

**Post-deletion checks:**
- Run comprehensive test suite to catch any broken imports
- Run linter to verify code quality
- Run build to ensure no compilation errors
- Verify no new SonarCloud issues

### Risk Assessment

**Low risk cleanup:**
- Both files are isolated with no active usage
- No database schema changes
- No API changes
- No user-facing functionality changes (features already deprecated)
- Components used by these files (GroupTable, GamesGrid, etc.) remain in the codebase for other uses

## Implementation Steps

### Step 1: Delete files
1. Delete `/app/tournaments/[id]/groups/[group_id]/page.tsx`
2. Delete `/app/components/tournament-page/fixtures.tsx`

### Step 2: Validation (MANDATORY)
1. Run tests: `npm test`
   - Verify no broken imports
   - Verify all tests pass
2. Run linter: `npm lint`
   - Verify no linting issues
3. Run build: `npm run build`
   - Verify successful compilation
   - Verify no TypeScript errors

### Step 3: Commit and Deploy
1. Commit changes with validation passing
2. Push to trigger Vercel Preview deployment
3. User tests in Vercel Preview environment

### Step 4: Final SonarCloud Validation
1. Wait for CI/CD checks to complete
2. Analyze SonarCloud results
3. Verify 0 new issues

## Testing Strategy

### Unit Tests
- No new unit tests required (deletion only)
- Existing tests will verify no broken imports

### Build Verification
- TypeScript compilation will catch any missing imports
- Next.js build will verify routing integrity

### Manual Testing (in Vercel Preview)
- Verify app builds successfully
- Verify tournament pages load correctly
- Verify no console errors

## Files Modified

**Deletions:**
- `/app/tournaments/[id]/groups/[group_id]/page.tsx`
- `/app/components/tournament-page/fixtures.tsx`

**No files modified** - this is a pure deletion task

## Dependencies

None - this is an independent cleanup task

## Quality Gates

### SonarCloud Requirements
- **Coverage:** Not applicable (deletion only)
- **New Issues:** 0 (must be zero)
- **Security:** A rating
- **Maintainability:** B or higher

### Pre-Commit Checklist
- [ ] Tests pass
- [ ] Lint passes
- [ ] Build succeeds

### Pre-Merge Checklist
- [ ] User tested in Vercel Preview
- [ ] User feedback addressed
- [ ] SonarCloud shows 0 new issues
- [ ] CI/CD checks pass

## Open Questions

None - scope is clear and straightforward.

## Notes

- This is a low-risk cleanup task with no functional changes
- Both files are confirmed dead code with no active usage
- Validation suite will catch any unexpected issues
- Expected to be a quick, clean removal

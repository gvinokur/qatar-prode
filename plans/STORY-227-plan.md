# Implementation Plan: [Bug] Backoffice: Tournament theme color changes don't persist (#227)

## Context

When attempting to change tournament theme colors in the backoffice, the changes don't persist to the database. The UI allows color modifications, but they don't save. A comprehensive codebase investigation identified the root cause: the theme object is not JSON-stringified before being sent to the database, and the theme merge order overwrites UI changes with existing database values.

This bug affects tournament customization functionality in production and prevents administrators from updating tournament branding.

## Story Details

- **Issue**: #227
- **Type**: Bug fix
- **Environment**: Production
- **Impact**: Tournament theme color customization is broken
- **Severity**: High (affects core backoffice functionality)

## Acceptance Criteria

1. ✅ Tournament theme color changes persist to the database
2. ✅ Updated colors are visible after page refresh
3. ✅ Updated colors are reflected in the tournament UI
4. ✅ No console errors during theme updates
5. ✅ Consistent JSON handling pattern across all theme-related code
6. ✅ Unit tests verify theme persistence
7. ✅ Unit tests verify JSON serialization
8. ✅ 80% code coverage on new/modified code (SonarCloud requirement)

## Technical Investigation Summary

### Root Cause Analysis

**File**: `app/actions/tournament-actions.ts:295-311` (function `prepareTournamentData`)

**Issues identified:**

1. **CRITICAL - Missing JSON Serialization**: Theme object is returned as a plain JavaScript object instead of a JSON string
2. **HIGH - Incorrect Merge Order**: Existing database theme is spread after new UI data, overwriting color changes
3. **MEDIUM - No Validation**: Color values are not validated
4. **MEDIUM - Silent Failures**: No error handling for theme serialization

### Current (Broken) Code

```typescript
// tournament-actions.ts:301-310
function prepareTournamentData(
  tournamentData: any,
  existingTournament: Tournament | null,
  logoUrl: string | null,
  logoKey: string | null
): any {
  return {
    ...tournamentData,
    theme: {
      ...(tournamentData.theme),           // ❌ Plain object, UI changes first
      ...(existingTournament?.theme || {}), // ❌ DB theme overwrites UI changes
      logo: logoUrl || undefined,
      s3_logo_key: logoKey || undefined,
      is_s3_logo: true
    }
  };
}
```

### Working Pattern (Reference)

**File**: `app/actions/prode-group-actions.ts:158-167`

```typescript
// ✅ Correct pattern - theme IS stringified
return updateProdeGroup(groupId, {
  theme: JSON.stringify({
    primary_color: data.primary_color,
    secondary_color: data.secondary_color,
    logo: imageUrl,
    is_s3_logo: true,
    s3_logo_key: imageKey
  })
})
```

## Technical Approach

### 1. Fix JSON Serialization in `prepareTournamentData()`

**File**: `app/actions/tournament-actions.ts:295-311`

**Important Note**: `prepareTournamentData()` is a private function (not exported). Tests must verify the fix through `createOrUpdateTournament()` integration tests.

**Data Flow Context**:
- UI sends theme as object → FormData → `JSON.parse()` → `tournamentData.theme` is an **object**
- Database column type is `JSONColumnType<Theme>` → Kysely **automatically parses** JSON on read
- Therefore: We must **stringify** before save, but theme is **already parsed** when read from DB

**Change**:
```typescript
function prepareTournamentData(
  tournamentData: any,
  existingTournament: Tournament | null,
  logoUrl: string | null,
  logoKey: string | null
): any {
  // Build theme object with correct merge order
  // Note: existingTournament.theme is already parsed by Kysely (JSONColumnType)
  // Note: tournamentData.theme is already an object from JSON.parse(formData)
  const themeObject = {
    ...(existingTournament?.theme || {}), // ✅ DB theme first (base, already parsed)
    ...(tournamentData.theme),           // ✅ UI changes second (override, already an object)
    logo: logoUrl || undefined,
    s3_logo_key: logoKey || undefined,
    is_s3_logo: true
  };

  // Validate theme is JSON-serializable before saving
  try {
    JSON.stringify(themeObject);
  } catch (error) {
    console.error('Theme object is not JSON serializable:', error);
    throw new Error('Invalid theme data - cannot serialize');
  }

  return {
    ...tournamentData,
    theme: JSON.stringify(themeObject) // ✅ Stringify for DB storage (Kysely will auto-parse on read)
  };
}
```

### 2. Add Color Validation (Optional Enhancement)

**File**: `app/components/backoffice/tournament-main-data-tab.tsx`

**Current**: Color changes update local state with no validation

**Enhancement**: Add hex color validation in `handleColorChange()` function (lines 284-289)

```typescript
const handleColorChange = (field: 'primary_color' | 'secondary_color') => (value: string) => {
  // Validate hex color format
  const hexColorRegex = /^#([0-9A-F]{3}){1,2}$/i;
  if (!hexColorRegex.test(value)) {
    console.warn(`Invalid hex color: ${value}`);
    return; // Or show error to user
  }

  setTheme({ ...theme, [field]: value });
};
```

**Decision**: This is a defensive improvement but not critical for the bug fix. Will implement if time permits after core fix.

### 3. Error Handling for Theme Updates

**File**: `app/actions/tournament-actions.ts:295-311` (within `prepareTournamentData()`)

**Current**: No validation that theme object is JSON-serializable

**Enhancement**: Validate serialization before database save (already shown in Technical Approach #1)

```typescript
// Validate theme is JSON-serializable before saving
try {
  JSON.stringify(themeObject);
} catch (error) {
  console.error('Theme object is not JSON serializable:', error);
  throw new Error('Invalid theme data - cannot serialize');
}
```

**Decision**: This validation is now **required** (not optional) as it prevents silent failures and provides clear error messages if theme data is malformed.

## Files to Modify

### Primary Fix (Required)

1. **`app/actions/tournament-actions.ts`** (CRITICAL)
   - Fix `prepareTournamentData()` function (lines 295-311)
   - Add JSON.stringify() for theme object
   - Reverse merge order so UI changes take precedence
   - Add error handling around theme preparation

### Enhancements (Optional)

2. **`app/components/backoffice/tournament-main-data-tab.tsx`** (OPTIONAL)
   - Add hex color validation in `handleColorChange()` (lines 284-289)
   - Show user-friendly error for invalid colors

## Implementation Steps

### Phase 0: Prove the Bug (Test-Driven Approach)

**Goal**: Create a failing test that demonstrates both bugs (missing JSON.stringify and wrong merge order)

1. **Create test file**: `app/actions/__tests__/tournament-actions.test.ts`

2. **Write test that demonstrates current bugs**:
   ```typescript
   describe('createOrUpdateTournament - theme persistence bug', () => {
     it('CURRENTLY FAILS - should stringify theme and preserve merge order', async () => {
       // Setup: Existing tournament with theme
       vi.spyOn(tournamentRepository, 'findTournamentById').mockResolvedValue({
         id: 'existing-id',
         theme: { primary_color: '#000000', secondary_color: '#111111' }
       } as any);

       // Update only primary color
       const formData = new FormData();
       formData.append('tournament', JSON.stringify({
         id: 'existing-id',
         short_name: 'TEST',
         theme: { primary_color: '#FF0000' } // UI change
       }));

       const updateSpy = vi.spyOn(tournamentRepository, 'updateTournament')
         .mockResolvedValue({} as any);

       await createOrUpdateTournament(formData);

       const callArgs = updateSpy.mock.calls[0][1];

       // BUG #1: Theme should be stringified (currently it's an object)
       expect(typeof callArgs.theme).toBe('string'); // ❌ FAILS - currently object

       // BUG #2: UI changes should override DB values (currently reversed)
       const parsedTheme = typeof callArgs.theme === 'string'
         ? JSON.parse(callArgs.theme)
         : callArgs.theme;
       expect(parsedTheme.primary_color).toBe('#FF0000'); // ❌ FAILS - DB overwrites UI
       expect(parsedTheme.secondary_color).toBe('#111111'); // ✅ Should preserve DB value
     });
   });
   ```

3. **Run test to confirm it fails**:
   ```bash
   npm test -- tournament-actions.test.ts
   ```

4. **Expected failure output**:
   - Test fails on `typeof callArgs.theme` - it's an object, not a string
   - Test fails on merge order - primary_color is '#000000' (DB value), not '#FF0000' (UI change)

**This proves the bug exists before we fix it.**

---

### Phase 1: Core Bug Fix

1. **Update `prepareTournamentData()` function**
   - File: `app/actions/tournament-actions.ts:295-311`
   - Reverse theme merge order (DB first, UI second)
   - Add JSON.stringify() for theme object
   - Add error handling

2. **Re-run the test**:
   ```bash
   npm test -- tournament-actions.test.ts
   ```
   - **Expected**: Test now passes ✅
   - This confirms the fix works

3. **Verify fix with existing data**
   - Ensure existing tournaments still load correctly
   - Test that logo handling still works
   - Confirm no breaking changes to theme structure

### Phase 2: Testing

1. **Create unit tests for `prepareTournamentData()`**
   - File: `app/actions/__tests__/tournament-actions.test.ts` (new file)
   - Test theme JSON serialization
   - Test merge order (UI changes override DB values)
   - Test with missing theme data
   - Test with null/undefined values
   - Test logo URL and S3 key handling

2. **Integration test for theme persistence**
   - Test that color changes persist after update
   - Test that theme is correctly deserialized on read
   - Test backward compatibility with existing tournaments

### Phase 3: Validation

1. **Run test suite**
   - Execute `npm test`
   - Verify 80% coverage on modified code

2. **Run linting**
   - Execute `npm run lint`
   - Fix any linting issues

3. **Run build**
   - Execute `npm run build`
   - Ensure no TypeScript errors

4. **Manual testing in Vercel Preview**
   - Update tournament theme colors in backoffice
   - Save changes
   - Refresh page and verify colors persist
   - Check that tournament UI shows updated colors

## Testing Strategy

### Unit Tests

**File**: `app/actions/__tests__/tournament-actions.test.ts` (NEW)

**IMPORTANT**: Since `prepareTournamentData()` is a **private function** (not exported), tests must verify the fix through **integration tests** using `createOrUpdateTournament()`. We'll mock the repository layer to verify the theme is correctly stringified.

**Test cases:**

1. **Theme JSON Serialization** (Integration test through `createOrUpdateTournament`)
   ```typescript
   describe('createOrUpdateTournament - theme handling', () => {
     it('should stringify theme object for database storage', async () => {
       // Mock form data with theme object
       const formData = new FormData();
       formData.append('tournament', JSON.stringify({
         id: null,
         short_name: 'TEST',
         long_name: 'Test Tournament',
         theme: { primary_color: '#FF0000', secondary_color: '#00FF00' }
       }));

       // Mock createTournament to capture what's sent to DB
       const createTournamentSpy = vi.spyOn(tournamentRepository, 'createTournament')
         .mockResolvedValue({
           id: 'test-id',
           theme: JSON.stringify({ primary_color: '#FF0000', secondary_color: '#00FF00' })
         } as any);

       await createOrUpdateTournament(formData);

       // Verify theme was stringified
       expect(createTournamentSpy).toHaveBeenCalledWith(
         expect.objectContaining({
           theme: expect.any(String) // ✅ Must be string, not object
         })
       );

       const callArgs = createTournamentSpy.mock.calls[0][0];
       const parsedTheme = JSON.parse(callArgs.theme);
       expect(parsedTheme.primary_color).toBe('#FF0000');
     });
   });
   ```

2. **Theme Merge Order** (Integration test)
   ```typescript
   it('should override existing theme with new UI changes', async () => {
     // Mock existing tournament with theme
     vi.spyOn(tournamentRepository, 'findTournamentById').mockResolvedValue({
       id: 'existing-id',
       theme: { primary_color: '#000000', secondary_color: '#111111' }
     } as any);

     // Update only primary color via form data
     const formData = new FormData();
     formData.append('tournament', JSON.stringify({
       id: 'existing-id',
       short_name: 'TEST',
       long_name: 'Test Tournament',
       theme: { primary_color: '#FF0000' } // Only update primary
     }));

     const updateTournamentSpy = vi.spyOn(tournamentRepository, 'updateTournament')
       .mockResolvedValue({} as any);

     await createOrUpdateTournament(formData);

     // Verify merge order: DB theme first (base), UI changes second (override)
     const callArgs = updateTournamentSpy.mock.calls[0][1];
     const parsedTheme = JSON.parse(callArgs.theme);

     expect(parsedTheme.primary_color).toBe('#FF0000'); // ✅ UI change applied
     expect(parsedTheme.secondary_color).toBe('#111111'); // ✅ DB value preserved
   });
   ```

3. **Logo Handling** (Integration test)
   ```typescript
   it('should include logo URL and S3 key in theme', async () => {
     const formData = new FormData();
     formData.append('tournament', JSON.stringify({
       id: null,
       short_name: 'TEST',
       long_name: 'Test Tournament',
       theme: { primary_color: '#FF0000' }
     }));

     // Mock logo file upload
     const logoFile = new File(['logo'], 'logo.png', { type: 'image/png' });
     formData.append('logo', logoFile);

     // Mock S3 upload
     vi.spyOn(s3Module, 'uploadToS3').mockResolvedValue({
       url: 'https://example.com/logo.png',
       key: 's3-key-123'
     });

     const createTournamentSpy = vi.spyOn(tournamentRepository, 'createTournament')
       .mockResolvedValue({} as any);

     await createOrUpdateTournament(formData);

     const callArgs = createTournamentSpy.mock.calls[0][0];
     const parsedTheme = JSON.parse(callArgs.theme);

     expect(parsedTheme.logo).toBe('https://example.com/logo.png');
     expect(parsedTheme.s3_logo_key).toBe('s3-key-123');
     expect(parsedTheme.is_s3_logo).toBe(true);
   });
   ```

4. **Null/Undefined Handling** (Integration tests)
   ```typescript
   it('should handle null existingTournament (new tournament)', async () => {
     const formData = new FormData();
     formData.append('tournament', JSON.stringify({
       id: null, // ← New tournament
       short_name: 'TEST',
       long_name: 'Test Tournament',
       theme: { primary_color: '#FF0000' }
     }));

     const createTournamentSpy = vi.spyOn(tournamentRepository, 'createTournament')
       .mockResolvedValue({} as any);

     await createOrUpdateTournament(formData);

     // Should not throw, and theme should be stringified
     const callArgs = createTournamentSpy.mock.calls[0][0];
     expect(() => JSON.parse(callArgs.theme)).not.toThrow();
   });

   it('should handle undefined theme in existingTournament', async () => {
     // Mock existing tournament with no theme
     vi.spyOn(tournamentRepository, 'findTournamentById').mockResolvedValue({
       id: 'existing-id',
       theme: undefined
     } as any);

     const formData = new FormData();
     formData.append('tournament', JSON.stringify({
       id: 'existing-id',
       short_name: 'TEST',
       long_name: 'Test Tournament',
       theme: { primary_color: '#FF0000' }
     }));

     const updateTournamentSpy = vi.spyOn(tournamentRepository, 'updateTournament')
       .mockResolvedValue({} as any);

     await createOrUpdateTournament(formData);

     const callArgs = updateTournamentSpy.mock.calls[0][1];
     const parsedTheme = JSON.parse(callArgs.theme);
     expect(parsedTheme.primary_color).toBe('#FF0000');
   });
   ```

### Manual Testing Checklist

**Vercel Preview Testing** (after commit/push):

1. Navigate to backoffice → Tournaments
2. Select a tournament
3. Open theme settings
4. Change primary color from current value to a new hex color (e.g., #FF5733)
5. Change secondary color to a different hex color (e.g., #33FF57)
6. Save changes
7. Verify success message appears
8. Refresh the page
9. **Expected**: New colors are still displayed in the form
10. Navigate to the tournament page
11. **Expected**: New theme colors are visible in the tournament UI

**Edge cases:**

- Update only primary color (leave secondary unchanged)
- Update only secondary color (leave primary unchanged)
- Update both colors simultaneously
- Use uppercase vs lowercase hex codes
- Test with existing tournaments that have logos

### Coverage Requirements

- **Target**: 80% coverage on new code (SonarCloud requirement)
- **Focus**: `prepareTournamentData()` function (100% coverage goal)
- **Test utilities**: Use mock helpers from `@/__tests__/db/mock-helpers`

## Validation Considerations

### SonarCloud Requirements

1. **Code Coverage**: ≥80% on new/modified code
2. **New Issues**: 0 new issues of any severity
3. **Security Rating**: A (no security vulnerabilities)
4. **Maintainability**: B or higher

### Quality Gates

1. ✅ All tests pass (`npm test`)
2. ✅ Linting passes (`npm run lint`)
3. ✅ Build succeeds (`npm run build`)
4. ✅ SonarCloud analysis passes (0 new issues, 80% coverage)
5. ✅ Manual testing in Vercel Preview confirms fix

### Backward Compatibility

**Key Points:**
- ✅ Kysely's `JSONColumnType<Theme>` automatically parses JSON on read
- ✅ Existing tournaments with themes will load correctly (already stored as JSON strings in DB)
- ✅ Theme structure unchanged (primary_color, secondary_color, logo, s3_logo_key, is_s3_logo)
- ✅ No migration required (JSON stringification is transparent)

**Verification Steps** (during implementation):
1. Query production database for existing tournament themes
2. Verify all themes are already stored as valid JSON strings
3. Test reading existing tournament and re-saving (round-trip test)
4. Confirm no data loss or corruption

**Potential Edge Case**:
- If any tournament themes were saved as plain objects (due to the bug), they would fail to deserialize
- **Mitigation**: This is unlikely since Kysely enforces JSON column types and would have thrown errors on insert
- **Verification**: Check production DB for any malformed theme data before deployment

## Risk Assessment

### Low Risk

- **Change is isolated**: Only affects `prepareTournamentData()` function
- **Pattern is proven**: Same approach works in `prode-group-actions.ts`
- **Backward compatible**: Existing themes will deserialize correctly
- **Well-tested**: Comprehensive unit tests cover edge cases

### Potential Issues

1. **Existing tournaments with invalid theme data**: If any tournaments have malformed theme JSON, this could expose issues
   - **Mitigation**: Add error handling to catch and log serialization errors

2. **Theme deserialization in other parts of the codebase**: Ensure theme is correctly parsed when read from DB
   - **Mitigation**: Verify existing code already handles JSON parsing (Kysely likely handles this automatically)

## Dependencies

- No new dependencies required
- Uses existing patterns from the codebase

## Performance Considerations

- JSON.stringify() is a fast operation for small objects
- No noticeable performance impact
- Theme objects are small (typically 5-10 keys)

## Security Considerations

- No security vulnerabilities introduced
- Theme colors are validated on the client (hex format)
- No user-supplied executable code in theme data

## Rollback Plan

If the fix causes issues:

1. **Immediate**: Revert commit from PR
2. **Database**: No migration needed, so no DB rollback required
3. **Alternative**: Add feature flag to toggle new vs old behavior

## Open Questions

None - the fix is straightforward and well-understood.

## Implementation Timeline

**Estimated effort**: 2-3 hours

- Core fix: 30 minutes
- Unit tests: 1 hour
- Manual testing: 30 minutes
- Validation & SonarCloud: 30 minutes
- PR review iterations: 30 minutes

## Success Metrics

1. ✅ Tournament theme colors persist after save
2. ✅ Zero SonarCloud issues introduced
3. ✅ 80%+ code coverage on modified code
4. ✅ All quality gates pass
5. ✅ Manual testing confirms fix works in Vercel Preview

---

**Plan Status**: Ready for review
**Next Step**: Plan review with subagent (2-3 cycles)

# Implementation Plan: Add User Profile Edit Feature (#42)

**Story:** As a user, I want to edit my profile information so that I can keep my details up to date.

**Epic:** User Profile Management (#40)

**Milestone:** User Features - Phase 1

---

## Story Context

Users currently can view their profile but cannot edit it. This story adds profile editing functionality with validation and authorization.

## Acceptance Criteria

- [ ] User can navigate to profile edit page
- [ ] User can update name, bio, and location
- [ ] Email is displayed but read-only (cannot be changed)
- [ ] Form validates input before submission
- [ ] Only authenticated users can edit their own profile
- [ ] Success message shown after save
- [ ] Changes persist to database

## Technical Approach

### Architecture

- **Server Component:** Profile page fetches user data
- **Client Component:** Edit form handles user interactions
- **Server Action:** Validates and saves profile updates
- **Repository:** Database layer for profile operations

### Data Flow

```
User → Edit Form (Client) → Server Action → Repository → Database
                ↓                              ↓
           Validation                    Authorization
```

### Validation Rules

- Name: Required, 1-100 characters
- Bio: Optional, max 500 characters
- Location: Optional, max 100 characters
- Email: Read-only (not editable)

### Authorization

- User must be authenticated
- User can only edit their own profile
- Enforce in server action before database update

## Visual Prototypes

### Profile Edit Form

```
┌─────────────────────────────────────────┐
│         Edit Profile                    │
├─────────────────────────────────────────┤
│                                         │
│  Name: [_________________________]      │
│                                         │
│  Email: john@example.com (read-only)    │
│                                         │
│  Bio:                                   │
│  [________________________________]     │
│  [________________________________]     │
│  [________________________________]     │
│  0 / 500 characters                     │
│                                         │
│  Location: [_____________________]      │
│                                         │
│                                         │
│                [Cancel]  [Save Changes] │
└─────────────────────────────────────────┘
```

**States:**
- **Loading:** Show skeleton loaders
- **Editing:** All fields enabled except email
- **Saving:** Disable form, show spinner on Save button
- **Success:** Show success toast, navigate to profile view
- **Error:** Show error message banner above form

**Material-UI Components:**
- TextField for inputs
- Button for actions
- Alert for errors
- Snackbar for success message

## Files to Create/Modify

### Create

1. `app/profile/edit/page.tsx` - Profile edit page (Server Component)
2. `app/components/profile/ProfileEditForm.tsx` - Edit form (Client Component)
3. `app/actions/profile-actions.ts` - Server actions for profile updates
4. `app/db/profile-repository.ts` - Database operations
5. `__tests__/components/profile/ProfileEditForm.test.tsx` - Component tests
6. `__tests__/actions/profile-actions.test.ts` - Server action tests
7. `__tests__/db/profile-repository.test.ts` - Repository tests

### Modify

1. `app/profile/page.tsx` - Add "Edit Profile" button

## Implementation Steps

### Step 1: Database Layer
- Create profile repository
- Implement `updateUserProfile()` function
- Add proper TypeScript types

### Step 2: Server Action
- Create `updateProfile()` server action
- Implement Zod schema for validation
- Add authentication check
- Add authorization check (user can only edit own profile)
- Call repository function
- Handle errors gracefully

### Step 3: UI Components
- Create ProfileEditForm component
- Wire up form state management
- Implement client-side validation
- Handle form submission
- Show loading and error states

### Step 4: Integration
- Create edit page at `/profile/edit`
- Fetch current user data
- Pass to ProfileEditForm as props
- Add navigation link from profile view page

### Step 5: Testing
- Unit tests for repository
- Unit tests for server action
- Component tests for form
- Test validation rules
- Test authorization checks

## Testing Strategy

### Unit Tests

**Repository Tests (`profile-repository.test.ts`):**
- ✓ Successfully updates profile with valid data
- ✓ Returns updated profile data
- ✓ Handles database errors gracefully
- ✓ Updates only specified fields

**Server Action Tests (`profile-actions.test.ts`):**
- ✓ Validates input with Zod schema
- ✓ Rejects invalid name (empty, too long)
- ✓ Rejects bio over 500 characters
- ✓ Checks user authentication
- ✓ Checks user authorization (can't edit other user's profile)
- ✓ Calls repository with correct data
- ✓ Returns success response
- ✓ Returns error response on failure
- ✓ Revalidates profile path on success

**Component Tests (`ProfileEditForm.test.tsx`):**
- ✓ Renders with initial values
- ✓ Email field is read-only
- ✓ Displays character count for bio
- ✓ Shows validation errors
- ✓ Calls onSubmit with form data
- ✓ Disables form during submission
- ✓ Shows success message on save
- ✓ Shows error message on failure
- ✓ Cancel button navigates back

### Coverage Requirements

- Target: 80% coverage on new code (SonarCloud requirement)
- All edge cases covered
- All error paths tested

## Validation Considerations

### SonarCloud Quality Gates

- ✓ 0 new issues (any severity)
- ✓ ≥80% code coverage on new code
- ✓ Security rating: A
- ✓ Maintainability: B or higher
- ✓ No duplicated code blocks

### Security

- ✓ Input validation with Zod
- ✓ Authentication check in server action
- ✓ Authorization check (user can only edit own profile)
- ✓ No SQL injection (using Kysely parameterized queries)
- ✓ XSS prevention (React escapes by default)

### Performance

- ✓ Server Component for data fetching
- ✓ Client Component only for form interactions
- ✓ No unnecessary re-renders
- ✓ Optimistic UI updates (show success before navigation)

## Implementation Amendments

### Amendment 1: Handle Avatar Upload Edge Case
**Date:** 2026-02-13
**Reason:** During implementation, discovered that profile can have null avatar. Original plan assumed avatar always exists. User reported error when saving profile with no avatar.
**Change:** Added null check for avatar field in repository update query. Use `updateTable().set({ avatar: avatar ?? null })` to handle undefined avatar gracefully.

### Amendment 2: Add Character Counter for Bio Field
**Date:** 2026-02-13
**Reason:** User feedback from Vercel Preview indicated bio field needs character counter for better UX (similar to Twitter). Original plan didn't include this detail.
**Change:** Added live character counter below bio TextField showing "X / 500 characters". Turns red when approaching limit (>450 chars). Implemented using `onChange` handler that updates local state.

### Amendment 3: Fix Form Validation Timing
**Date:** 2026-02-14
**Reason:** Original implementation validated only on submit. This caused poor UX - user fills entire form, clicks save, then sees all errors at once. Better to show errors as user types.
**Change:** Switched from `onSubmit` validation to `onChange` validation using `react-hook-form` with Zod resolver. Errors now show immediately after user leaves field (onBlur), providing faster feedback.

### Amendment 4: Add Unsaved Changes Warning
**Date:** 2026-02-14
**Reason:** QA testing revealed users accidentally navigate away from form, losing changes. Not mentioned in original story but critical UX issue.
**Change:** Added `beforeunload` event listener that warns user if they try to leave page with unsaved changes. Also added confirmation dialog on Cancel button if form is dirty (has changes).

### Amendment 5: Optimize Database Query
**Date:** 2026-02-15
**Reason:** SonarCloud flagged N+1 query issue. Repository was fetching user, then updating, causing two DB round-trips. Performance impact visible in Vercel Preview (200ms → 50ms).
**Change:** Combined fetch and update into single `UPDATE ... RETURNING *` query using Kysely. Reduced database calls from 2 to 1, improving response time by 75%.

## Open Questions

- None remaining (all resolved during implementation)

## Dependencies

- None (self-contained feature)

## Risks

- None identified

---

**Plan Status:** Approved ✓
**Implementation Status:** Complete ✓
**Plan Last Updated:** 2026-02-15 (reconciled with implementation)

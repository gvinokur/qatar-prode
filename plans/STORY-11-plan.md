# Implementation Plan: Story #11 - Progressive Onboarding Flow

## Plan Review Process

**This plan will be reviewed via Pull Request before implementation begins.**

1. This plan file is located in the story worktree: `/Users/gvinokur/Personal/qatar-prode-story-11/plans/`
2. Create a PR with this plan file for review and feedback
3. After approval, implementation follows the phases outlined below
4. This ensures alignment before significant development work begins

---

## Overview
Implement a 5-step interactive onboarding flow to improve first prediction completion from 60% → 85% and reduce time to first prediction from 3min → 1min.

## Architecture Decision: Database Schema

**Approach**: Add onboarding columns to existing `users` table (not creating separate table)

**Rationale**:
- Follows existing pattern (see `notification_subscriptions` JSONB column in users table)
- Better performance (no JOINs needed for single-user queries)
- Simpler maintenance

**Schema Changes**:
```sql
ALTER TABLE users
  ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN onboarding_completed_at TIMESTAMP,
  ADD COLUMN onboarding_data JSONB;

CREATE INDEX idx_users_onboarding_completed ON users(onboarding_completed);
```

**TypeScript Types** (`app/db/tables-definition.ts`):
```typescript
interface OnboardingData {
  currentStep?: number
  skippedSteps?: number[]
  dismissedTooltips?: string[]
  checklist?: {
    items: Array<{id: string, label: string, completed: boolean, completedAt?: Date, order: number}>
  }
}
```

---

## Component Architecture

### New Files to Create

```
app/
├── components/onboarding/
│   ├── onboarding-dialog.tsx              # Main dialog (state machine pattern)
│   ├── onboarding-trigger.tsx             # Client wrapper to trigger dialog
│   ├── onboarding-progress.tsx            # Stepper component
│   ├── onboarding-tooltip.tsx             # Reusable tooltip with dismiss
│   ├── onboarding-checklist.tsx           # Standalone checklist component
│   └── onboarding-steps/
│       ├── welcome-step.tsx               # Step 1: Welcome
│       ├── sample-prediction-step.tsx     # Step 2: Interactive demo
│       ├── scoring-explanation-step.tsx   # Step 3: Points system
│       ├── boost-introduction-step.tsx    # Step 4: Boosts explained
│       ├── checklist-step.tsx             # Step 5: Getting started tasks
│       └── index.ts                       # Barrel exports
├── actions/
│   └── onboarding-actions.ts              # Server Actions
├── db/
│   └── onboarding-repository.ts           # Database operations
└── utils/
    └── onboarding-utils.ts                # Helper functions

migrations/
└── 20260128000000_add_onboarding_fields.sql
```

### Files to Modify

1. **`/Users/gvinokur/Personal/qatar-prode-story-11/app/page.tsx`**
   - Add onboarding status check
   - Conditionally render `<OnboardingTrigger />` for new users

2. **`/Users/gvinokur/Personal/qatar-prode-story-11/app/components/header/user-actions.tsx`**
   - Add "Ver Tutorial" menu item
   - Import and render `OnboardingDialog` with open/close state

3. **`/Users/gvinokur/Personal/qatar-prode-story-11/app/db/tables-definition.ts`**
   - Add onboarding fields to `UserTable` interface
   - Add `OnboardingData` type

---

## Implementation Pattern

**Based on existing codebase patterns:**

1. **Dialog State Machine** - Following `LoginOrSignupDialog` pattern:
   - State: `currentStep: 'welcome' | 'prediction' | 'scoring' | 'boost' | 'checklist'`
   - Navigation: `handleNext()`, `handleBack()`, `handleSkip()`
   - Render different step components based on state

2. **Material-UI Dialog Structure**:
   ```tsx
   <Dialog open={open} onClose={handleSkip} maxWidth="md" fullWidth>
     <LinearProgress variant="determinate" value={progress} />
     <DialogContent>
       <OnboardingProgress currentStep={currentStepIndex} totalSteps={5} />
       {renderStepContent()}
     </DialogContent>
     <DialogActions>
       <Button onClick={handleSkip}>Saltar Tutorial</Button>
       <Button onClick={handleBack}>Atrás</Button>
       <Button onClick={handleNext} variant="contained">Siguiente</Button>
     </DialogActions>
   </Dialog>
   ```

3. **Database Operations** - Following `users-repository.ts` pattern:
   - Create cached queries with `cache()` from 'react'
   - Use Kysely query builder
   - Return types match table definitions

4. **Server Actions** - Following `user-actions.ts` pattern:
   - `'use server'` directive
   - Get user via `getLoggedInUser()`
   - Call repository functions
   - Use `revalidatePath()` after mutations

---

## Implementation Sequence

### Phase 1: Database Layer (15 min)
1. Create migration file: `migrations/20260128000000_add_onboarding_fields.sql`
2. Update `app/db/tables-definition.ts` with new fields and types
3. Run migration locally: Manual execution in development

### Phase 2: Repository & Actions (50 min)
1. Create `app/db/onboarding-repository.ts`:
   - `getOnboardingStatus(userId)` - cached
   - `updateOnboardingData(userId, data)`
   - `completeOnboarding(userId)`
   - `skipOnboarding(userId)`
   - `dismissTooltip(userId, tooltipId)`
   - `updateChecklistItem(userId, itemId, completed)`

2. Create `app/actions/onboarding-actions.ts`:
   - `getOnboardingData()` - wrapper with auth
   - `saveOnboardingStep(step)`
   - `markOnboardingComplete()`
   - `skipOnboardingFlow()`
   - `dismissTooltip(tooltipId)`
   - `updateChecklistItem(itemId, completed)`

### Phase 3: Step Components (2 hours)
Create all step components in `app/components/onboarding/onboarding-steps/`:

1. **welcome-step.tsx**: Soccer icon, welcome message, duration estimate
2. **sample-prediction-step.tsx**: Mock game (Argentina vs Brasil) with score inputs
3. **scoring-explanation-step.tsx**: Points breakdown with icons (2pts exact, 1pt result)
4. **boost-introduction-step.tsx**: Silver (x1.5) and Golden (x2) boost cards
5. **checklist-step.tsx**: List of getting-started items with checkboxes

### Phase 4: Main Dialog (1 hour)
Create `app/components/onboarding/onboarding-dialog.tsx`:
- State machine with 5 steps
- Linear progress bar at top
- Stepper component showing step names
- Back/Next/Skip button logic
- Integration with server actions

### Phase 5: Supporting Components (1 hour)
1. **onboarding-progress.tsx**: Material-UI Stepper with step labels
2. **onboarding-trigger.tsx**: Client component that opens dialog with 500ms delay
3. **onboarding-tooltip.tsx**: Popover with dismiss button
4. **onboarding-checklist.tsx**: Standalone view for profile/settings

### Phase 6: Integration Points (45 min)
1. **Modify `app/page.tsx`**:
   ```typescript
   const user = await getLoggedInUser()
   const shouldShowOnboarding = user && !(await getOnboardingStatus(user.id))?.onboarding_completed

   return (
     <>
       {shouldShowOnboarding && <OnboardingTrigger />}
       <Home tournaments={tournaments} groups={prodeGroups} />
     </>
   )
   ```

2. **Modify `app/components/header/user-actions.tsx`**:
   - Add state: `const [openOnboardingDialog, setOpenOnboardingDialog] = useState(false)`
   - Add menu item: `<MenuItem onClick={handleOpenOnboarding}>Ver Tutorial</MenuItem>`
   - Add dialog: `<OnboardingDialog open={openOnboardingDialog} onClose={handleCloseOnboarding} />`

### Phase 7: Testing (1.5 hours)
1. Create `__tests__/db/onboarding-repository.test.ts` - Repository unit tests
2. Create `__tests__/components/onboarding/onboarding-dialog.test.tsx` - Component tests
3. Create `__tests__/integration/onboarding-flow.test.tsx` - Full flow test
4. Manual testing: New user signup → onboarding appears → complete steps → verify persistence

### Phase 8: Polish & Documentation (30 min)
1. Spanish language review (all text is in Spanish)
2. Mobile responsive check
3. Accessibility audit (keyboard nav, screen readers)
4. Add code comments for complex logic
5. Update README if needed

---

## Critical Files Reference

**Existing files to study/reference:**
- `/Users/gvinokur/Personal/qatar-prode/app/components/auth/login-or-signup-dialog.tsx` - Multi-step dialog pattern
- `/Users/gvinokur/Personal/qatar-prode/app/db/users-repository.ts` - Repository pattern
- `/Users/gvinokur/Personal/qatar-prode/app/actions/user-actions.ts` - Server Actions pattern
- `/Users/gvinokur/Personal/qatar-prode/app/components/header/user-actions.tsx` - User menu integration point

**Files to modify (in story-11 worktree):**
- `/Users/gvinokur/Personal/qatar-prode-story-11/app/page.tsx`
- `/Users/gvinokur/Personal/qatar-prode-story-11/app/components/header/user-actions.tsx`
- `/Users/gvinokur/Personal/qatar-prode-story-11/app/db/tables-definition.ts`

---

## Key Design Decisions

### 1. When to Show Onboarding
**Trigger**: On home page load (`app/page.tsx`) when user first logs in
**Check**: `onboarding_completed === false`
**Timing**: 500ms delay after page render (via `OnboardingTrigger` component)

### 2. Sample Prediction Step (Step 2)
**Approach**: Mock demo with Argentina vs Brasil
**Why**: Doesn't affect real predictions, no tournament dependency, clear demonstration
**Implementation**: Client-only state with TextField inputs, success message when both scores entered

### 3. Skip Functionality
**Behavior**: Marks onboarding as completed (same as finishing normally)
**Rationale**: Prevents annoying repeated prompts
**Access**: "Saltar Tutorial" button in DialogActions, always visible

### 4. Checklist Access
**Primary**: "Ver Tutorial" in user menu (top-right profile dropdown)
**Future**: Could add standalone checklist page at `/onboarding-checklist`
**Storage**: Checklist items stored in `onboarding_data.checklist.items[]`

### 5. Tooltip System
**Approach**: Reusable `OnboardingTooltip` component
**Persistence**: Stored in `onboarding_data.dismissedTooltips[]` array
**Trigger**: Check if tooltip ID is in dismissed list before rendering
**Out of Scope**: Initially implement infrastructure, add tooltips to UI elements in follow-up

---

## Edge Cases Handled

1. **Mid-flow browser close**: Current step saved to `onboarding_data.currentStep`, resume on next visit
2. **Skip then return**: "Ver Tutorial" menu item allows re-opening dialog
3. **Mobile responsiveness**: Dialog uses `fullWidth` and Material-UI breakpoints
4. **Session timeout**: Server Actions check `getLoggedInUser()`, handle gracefully
5. **Existing users**: Only trigger for users where `onboarding_completed === false` (new users)
6. **Network errors**: Try/catch in async handlers, show error alerts

---

## Testing Strategy

### Unit Tests (Vitest)
- `onboarding-repository.test.ts`: Test all database operations
- `onboarding-dialog.test.tsx`: Test step navigation, skip functionality
- Mock server actions with `vi.mock()`

### Integration Tests
- Full onboarding flow: Trigger → Navigate all steps → Complete → Verify persistence
- Skip flow: Trigger → Skip → Verify marked complete
- Menu re-open: Complete onboarding → Open from menu → Verify works

### Manual Testing Checklist
- [ ] New user sees onboarding automatically
- [ ] Can complete all 5 steps
- [ ] Can skip at any step
- [ ] Can go back to previous steps
- [ ] Progress bar updates correctly
- [ ] "Ver Tutorial" menu item opens dialog
- [ ] Onboarding doesn't show after completion
- [ ] Mobile layout works
- [ ] Keyboard navigation works
- [ ] Spanish text is correct

---

## Verification Steps (Post-Implementation)

1. **Database Verification**:
   ```sql
   SELECT onboarding_completed, onboarding_completed_at, onboarding_data
   FROM users
   WHERE email = 'test@example.com';
   ```

2. **Component Verification**:
   - Visit `/` as new user → Dialog appears
   - Complete all steps → Dialog closes
   - Reload page → Dialog doesn't appear
   - Click profile → "Ver Tutorial" → Dialog opens

3. **Test Coverage**:
   ```bash
   npm run test -- onboarding
   # Should be > 60% coverage
   ```

4. **Build Verification**:
   ```bash
   npm run build
   # Should succeed without errors
   ```

5. **Lint Check**:
   ```bash
   npm run lint
   # Should pass
   ```

---

## Success Metrics to Track

After deployment, monitor:
- **First prediction completion rate**: Target 60% → 85%
- **Time to first prediction**: Target 3min → 1min
- **Onboarding completion rate**: % who finish vs skip
- **Step dropout**: Which steps users skip most
- **Day 7 retention**: Target +20%

---

## Estimated Effort

- Database Layer: 15 min
- Repository & Actions: 50 min
- Step Components: 2 hours
- Main Dialog: 1 hour
- Supporting Components: 1 hour
- Integration: 45 min
- Testing: 1.5 hours
- Polish: 30 min

**Total: ~8 hours** (aligns with issue estimate: 3-5 days)

---

## Rollout Plan

1. **Development**: Test in story-11 worktree
2. **PR Review**: Include screenshots/video of onboarding flow
3. **Staging**: Test with real user signups
4. **Production**: Deploy with feature flag (optional)
5. **Monitor**: Track metrics for 1 week post-launch

---

## Out of Scope (Future Enhancements)

- Video walkthroughs in steps
- A/B testing different step orders
- English/Portuguese translations
- Interactive tutorial mode with real predictions
- Gamification badges
- Context-aware tooltips throughout app

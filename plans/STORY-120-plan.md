# Implementation Plan: Minor Visual Bugs - UI Improvements (#120)

## Story Context

**Issue:** #120 - Minor Visual Bugs - UI Improvements
**Type:** UI/UX Bug Fixes
**Priority:** Low
**Complexity:** Low to Medium

This story addresses 8 visual inconsistencies and UX improvements across the tournament page and friend groups functionality. These are minor polish items that improve consistency and user experience without affecting core functionality.

## Acceptance Criteria

1. ✅ User Stats card title uses regular case ("Tus Estadísticas") instead of all caps
2. ✅ User Stats card button text is concise ("Ver Detalle")
3. ✅ User Stats card is collapsible and starts collapsed
4. ✅ Grupos de Amigos card starts in collapsed state
5. ✅ Component action buttons use shorter, more concise text
6. ✅ Friend Groups page (`/tournament/[id]/friend-groups`) has all text in Latam Spanish
7. ✅ Friend Groups page card UI is consistent (no distracting border, compact layout)
8. ✅ Groups owned by user have share functionality

## Technical Approach

### Overview

This is a straightforward UI polish story involving 4 main files plus 1 new shared component:
- `app/components/tournament-page/expand-more.tsx` - NEW: Shared ExpandMore component
- `app/components/tournament-page/user-tournament-statistics.tsx` - Issues 1, 2, 3
- `app/components/tournament-page/friend-groups-list.tsx` - Issues 4, 5
- `app/components/tournament-page/rules.tsx` - Refactor to use shared ExpandMore
- `app/components/tournament-page/tournament-groups-list.tsx` - Issues 6
- `app/components/tournament-page/tournament-group-card.tsx` - Issues 7, 8

### Implementation Strategy

**Shared Component: ExpandMore**
- Extract the `ExpandMore` styled component to avoid duplication (DRY principle, SonarCloud requirement)
- Create `app/components/tournament-page/expand-more.tsx`:
  - Export `ExpandMore` styled IconButton with rotation animation
  - Export `ExpandMoreProps` interface
- Update `rules.tsx` to import from shared component
- This shared component will be used by: rules.tsx, user-tournament-statistics.tsx, friend-groups-list.tsx

**Issue 1-3: User Stats Card**
- Change title from "TUS ESTADÍSTICAS" to "Tus Estadísticas" (line 64)
- Change button text from "Ver Estadísticas Detalladas" to "Ver Detalle" (line 93)
- Add collapsible functionality:
  - Import `Collapse` from MUI
  - Import `ExpandMore` from shared component
  - Add `expanded` prop with default `false`
  - Add expand/collapse button to CardHeader action
  - Wrap CardContent in `Collapse` component with `unmountOnExit` prop
  - Add state management for expand/collapse

**Issue 4-5: Grupos de Amigos Card**
- Add collapsible functionality with default collapsed state:
  - Import `Collapse` from MUI
  - Import `ExpandMore` from shared component
  - Add `expanded` state (default: false)
  - Add expand/collapse button to CardHeader action
  - Wrap CardContent in `Collapse` with `unmountOnExit`
- Change button text:
  - "Crear Nuevo Grupo" → "Crear Grupo"
  - "Ver Todos los Grupos" → "Ver Grupos"

**Issue 6: Friend Groups Page - Spanish Translation**
Files to update: `tournament-groups-list.tsx`
- Line 138: "Tournament Groups" → "Grupos de Amigos"
- Line 147: "Create" → "Crear"
- Line 155: "Join" → "Unirse"
- Line 82 & 187: "Create Friend Group" → "Crear Grupo de Amigos"
- Line 85 & 189: Dialog description → Spanish translation
- Line 99 & 203: "Name" → "Nombre"
- Line 102 & 206: "Group name is required" → "El nombre del grupo es obligatorio"
- Line 110 & 215: "Cancel" → "Cancelar"
- Line 114 & 219: "Create" → "Crear"

**Issue 7: Friend Groups Page - Card UI Consistency**
Files to update: `tournament-group-card.tsx`
- **Border styling clarification**: Remove the base `border: 1, borderColor: 'divider'` but KEEP the special borders:
  - Keep leader border: `borderColor: 'primary.main', borderWidth: 2` (when isLeader)
  - Keep theme border: `borderLeft: '4px solid ${group.themeColor}'` (when !isLeader && has theme)
  - This maintains visual distinction while removing the distracting base border
- Compact layout: Combine position and points in same row (side by side instead of stacked)
- Update "View Details →" to "Ver Detalles"
- Update "Owner" badge to "Dueño"
- Update "Your Position" to "Tu Posición"
- Update "Your Points" to "Tus Puntos"
- Update "Leader" to "Líder"
- Redesign stats section for compactness

**Issue 8: Share Functionality for Owned Groups**
Files to update: `tournament-group-card.tsx`
- Add share button for owned groups
- Reuse existing `InviteFriendsDialog` component (already used in `friend-groups-list.tsx` lines 84-90)
- Import: `import InviteFriendsDialog from "../invite-friends-dialog"`
- Import: `import { ShareIcon } from "@mui/icons-material"`
- Layout in CardActions:
  - For owned groups: [Share button] [Ver Detalles button]
  - For non-owned groups: [Ver Detalles button] (right-aligned)
  - Share button: IconButton with ShareIcon, size="small", aria-label="Compartir grupo"
  - Share button wrapped in InviteFriendsDialog trigger prop
- Conditionally render share button in CardActions when `group.isOwner === true`

## Files to Create/Modify

### New Files

1. **`app/components/tournament-page/expand-more.tsx`**
   - Shared ExpandMore styled component
   - ~30 lines (new file)

### Modified Files

1. **`app/components/tournament-page/rules.tsx`**
   - Refactor to import ExpandMore from shared component
   - Remove local ExpandMore definition
   - ~10 lines modified

2. **`app/components/tournament-page/user-tournament-statistics.tsx`**
   - Add collapsible functionality (useState, Collapse, import ExpandMore)
   - Change title casing
   - Change button text
   - ~50 lines modified/added

3. **`app/components/tournament-page/friend-groups-list.tsx`**
   - Add collapsible functionality (import ExpandMore)
   - Update button text
   - ~40 lines modified/added

4. **`app/components/tournament-page/tournament-groups-list.tsx`**
   - Translate all English text to Spanish
   - ~20 lines modified

5. **`app/components/tournament-page/tournament-group-card.tsx`**
   - Simplify border styling (keep special borders)
   - Compact layout (position + points in same row)
   - Add share button for owned groups
   - Translate English text
   - ~60 lines modified

## Implementation Steps

### Phase 0: Shared Component Extraction (CRITICAL - Do First)
1. Create `app/components/tournament-page/expand-more.tsx`:
   - Extract ExpandMore styled component from rules.tsx
   - Export ExpandMoreProps interface
   - Export ExpandMore styled IconButton

2. Update `rules.tsx`:
   - Import ExpandMore from './expand-more'
   - Remove local ExpandMore definition
   - Verify component still works

### Phase 1: User Stats Card (Issues 1-3)
1. Update `user-tournament-statistics.tsx`:
   - Import Collapse, ExpandMore from shared component
   - Add useState for expanded state (default: false)
   - Update CardHeader title to "Tus Estadísticas"
   - Add ExpandMore button to CardHeader action prop
   - Wrap CardContent in Collapse component with unmountOnExit
   - Update button text to "Ver Detalle"

### Phase 2: Grupos de Amigos Card (Issues 4-5)
1. Update `friend-groups-list.tsx`:
   - Import Collapse, ExpandMore from shared component
   - Add useState for expanded state (default: false)
   - Add ExpandMore button to CardHeader action prop
   - Wrap CardContent in Collapse component with unmountOnExit
   - Update button text: "Crear Grupo", "Ver Grupos"

### Phase 3: Friend Groups Page Spanish Translation (Issue 6)
1. Update `tournament-groups-list.tsx`:
   - Replace all English strings with Spanish equivalents
   - Update header text
   - Update button labels
   - Update dialog content

### Phase 4: Friend Groups Card UI (Issues 7-8)
1. Update `tournament-group-card.tsx`:
   - Simplify border styling (remove base border, keep leader/theme borders)
   - Redesign stats layout (position + points in same row)
   - Translate English text to Spanish
   - Add share button for owned groups:
     - Import InviteFriendsDialog, ShareIcon
     - Add share IconButton wrapped in InviteFriendsDialog
     - Position share button before "Ver Detalles" button
     - Only show for owned groups (group.isOwner)

## Testing Strategy

### Unit Tests

**Test file locations** (follow existing project conventions):
- User stats tests: `app/__tests__/components/tournament-page/user-tournament-statistics.test.tsx` (already exists)
- Other component tests: `__tests__/components/tournament-page/` (root level)

Create/update test files for modified components:

0. **`app/components/tournament-page/__tests__/expand-more.test.tsx`** (NEW)
   - Test ExpandMore component renders
   - Test rotation animation on expand prop change
   - Test aria-expanded attribute
   - Test click handler propagation

1. **`app/__tests__/components/tournament-page/user-tournament-statistics.test.tsx`**
   - Test collapsible functionality (expand/collapse)
   - Test title displays "Tus Estadísticas"
   - Test button displays "Ver Detalle"
   - Test default collapsed state
   - Test content visibility based on expanded state
   - Test Collapse uses unmountOnExit (content not in DOM when collapsed)

2. **`__tests__/components/tournament-page/friend-groups-list.test.tsx`**
   - Test collapsible functionality
   - Test button text updates
   - Test default collapsed state
   - Test Collapse uses unmountOnExit
   - Verify existing tests still pass

3. **`__tests__/components/tournament-page/tournament-groups-list.test.tsx`** (if exists, or create)
   - Test Spanish translations render correctly
   - Test dialog content in Spanish
   - Verify button labels

4. **`__tests__/components/tournament-page/tournament-group-card.test.tsx`** (if exists, or create)
   - Test card renders without base border
   - Test leader border still renders (when isLeader)
   - Test theme border still renders (when has theme)
   - Test compact layout
   - Test share button appears for owned groups only
   - Test share button doesn't appear for non-owned groups
   - Test share button passes correct props to InviteFriendsDialog
   - Test Spanish text renders correctly

### Test Coverage Requirements
- Target: 80% coverage on modified code
- All new conditional logic (isOwner check, expand/collapse) must be tested
- All text changes must be verified in tests

### Manual Testing Checklist
- [ ] User Stats card starts collapsed on page load
- [ ] User Stats card expands/collapses on button click
- [ ] User Stats card shows correct title and button text
- [ ] Grupos de Amigos card starts collapsed
- [ ] Grupos de Amigos card expands/collapses correctly
- [ ] Friend groups page displays all Spanish text
- [ ] Friend group cards have no distracting border
- [ ] Friend group cards show compact layout
- [ ] Share button appears for owned groups
- [ ] Share dialog works correctly for owned groups
- [ ] All components maintain responsive design

## Validation Considerations

### SonarCloud Requirements
- **Coverage:** 80% on new/modified code
- **Issues:** 0 new issues of any severity
- **Code Smells:** Avoid duplication (DRY principle for ExpandMore component)

### Potential Issues to Watch
- **Component Reusability:** ExpandMore component extracted to shared location (addressed)
- **Prop Type Safety:** Ensure all new props have proper TypeScript types
- **Accessibility:** Ensure expand/collapse buttons have proper aria-labels and aria-expanded
- **Responsive Design:** Verify compact layout works on mobile devices
- **Translation Accuracy:** Spanish translations should maintain informal tone ("tu" vs "usted")
- **Existing Dialog Duplication:** tournament-groups-list.tsx has duplicated dialogs (lines 67-117 and 173-222). This is OUT OF SCOPE - only translate strings, don't refactor.

### Quality Checklist
- [ ] All TypeScript types are properly defined
- [ ] All interactive elements have aria-labels
- [ ] No console errors or warnings
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] All English text replaced with Spanish
- [ ] Share functionality works correctly
- [ ] Tests achieve 80% coverage

## Open Questions

None - requirements are clear and implementation is straightforward.

## Risk Assessment

**Low Risk** - These are UI-only changes that don't affect business logic or data.

**Potential Issues:**
- Existing tests may break due to text changes (easily fixable)
- Layout changes may affect responsive design (requires testing)
- Share button for owned groups requires testing the InviteFriendsDialog integration

**Mitigation:**
- Run full test suite after each phase
- Manual testing on different screen sizes
- Verify InviteFriendsDialog already handles the groupId/groupName props correctly

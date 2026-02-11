# Implementation Plan: Story #99 - Accessibility Improvements for Qualified Teams

## Story Context

**Issue:** #99 - [UX] Accessibility Improvements for Qualified Teams

**Problem:** The qualified teams prediction feature (Story #90) needs a comprehensive accessibility audit and improvements to ensure WCAG 2.1 AA compliance and excellent keyboard/screen reader support.

**Solution:** Conduct thorough accessibility audit, verify and enhance ARIA labels/roles for drag-and-drop interactions, improve keyboard navigation, test with screen readers (NVDA, JAWS, VoiceOver), verify color contrast ratios, document keyboard shortcuts, improve focus management, and ensure mobile screen reader support.

## Objectives

1. **Verify and enhance** ARIA labels and roles for drag-and-drop interactions
2. **Improve** keyboard navigation to be fully accessible without mouse
3. **Test** with multiple screen readers (NVDA, JAWS, VoiceOver)
4. **Verify** color contrast ratios meet WCAG AA standards (4.5:1 text, 3:1 UI)
5. **Document** keyboard shortcuts for users
6. **Improve** focus management during drag operations
7. **Verify** mobile screen reader support (iOS VoiceOver, Android TalkBack)
8. **Achieve** 80% test coverage on new accessibility features

## Current State Analysis

### Existing Implementation (from Story #90)

**Components:**
- `qualified-teams-client-page.tsx` - Main page with DndContext
- `draggable-team-card.tsx` - Individual draggable team cards
- `group-card.tsx` - Group container with sortable context
- `qualified-teams-context.tsx` - State management with auto-save

**Current Accessibility Features:**
- ✅ TouchSensor configured (mobile support)
- ✅ MouseSensor configured (desktop support)
- ✅ Material-UI components (baseline accessibility)
- ✅ Responsive design (mobile, tablet, desktop)

**Critical Gaps Identified:**
- ❌ No KeyboardSensor configured - keyboard users cannot drag/drop
- ❌ No ARIA labels on draggable elements
- ❌ No ARIA live regions for announcements
- ❌ No screen reader instructions
- ❌ Focus management not explicitly handled
- ❌ No keyboard shortcuts documented
- ❌ Color contrast not verified against WCAG AA
- ❌ No accessibility-specific tests

### Audit Findings from Research

**From UX Audit Report (docs/ux-audit-report.md):**
- Boost icons lack ARIA labels (Severity: 3)
- Game card status icons lack alt text (Severity: 3)
- Focus outline color low contrast in dark mode (Severity: 2)
- Focus not visible on game cards when tabbing (Severity: 2)
- No keyboard shortcuts for rapid entry (Severity: 2)

**Specific to Qualified Teams Feature:**
- Drag-and-drop uses @dnd-kit library (good foundation)
- MouseSensor and TouchSensor configured
- **KeyboardSensor NOT configured** - critical gap
- No ARIA labels found in component code
- No accessibility tests in test suites

## Acceptance Criteria

### AC1: Keyboard Navigation - Complete

- [ ] KeyboardSensor added to DndContext with proper configuration
- [ ] Tab order is logical: header → group 1 cards → group 2 cards → etc.
- [ ] Enter/Space activates drag mode on focused card
- [ ] Arrow Up/Down moves card position when in drag mode
- [ ] Escape cancels drag and returns to original position
- [ ] Focus indicators visible (3px blue outline, high contrast)
- [ ] All interactive elements keyboard accessible
- [ ] Keyboard navigation works in locked state (read-only)

### AC2: ARIA Labels and Roles - Comprehensive

- [ ] Team cards have descriptive aria-label with position, name, status
- [ ] Drag handles have aria-label explaining drag instructions
- [ ] ARIA live region (polite) announces position changes
- [ ] ARIA live region announces save status
- [ ] Group headers have proper heading roles (h2)
- [ ] Checkbox labels are clear and descriptive
- [ ] Third place summary has aria-live for count updates
- [ ] Instructions for screen readers (sr-only class)

### AC3: Screen Reader Testing - Multi-Platform

- [ ] VoiceOver (macOS): Full navigation tested, announces correctly (REQUIRED)
- [ ] NVDA (Windows, if available): Drag operations announced clearly
- [ ] JAWS (Windows, if available): Compatible with latest version
- [ ] Mobile VoiceOver (iOS): Touch gestures work correctly (REQUIRED)
- [ ] Mobile TalkBack (Android): Drag-and-drop accessible (REQUIRED)
- [ ] All state changes announced (drag start, drag end, save status)
- [ ] Error messages announced with assertive priority

### AC4: Color Contrast - WCAG AA Compliance

- [ ] Text on backgrounds: ≥4.5:1 ratio (normal text)
- [ ] Large text (18pt+): ≥3:1 ratio
- [ ] UI components: ≥3:1 ratio (borders, icons)
- [ ] Focus indicators: ≥3:1 contrast with background
- [ ] Dark mode colors verified separately
- [ ] Position badges readable
- [ ] Border colors (green/yellow/gray) have sufficient contrast
- [ ] Status chips (points awarded) meet contrast requirements

### AC5: Focus Management - Clear and Visible

- [ ] Focus outline visible on all interactive elements
- [ ] Focus outline width: 3px (increased from default 2px)
- [ ] Focus outline color: High contrast (blue in light mode, cyan in dark mode)
- [ ] Focus moves logically during drag operations
- [ ] Focus returns to dragged element after drop
- [ ] Focus visible in all states (normal, hover, active)
- [ ] Skip links for keyboard users (optional enhancement)

### AC6: Keyboard Shortcuts Documentation

- [ ] Create keyboard shortcuts guide in help documentation
- [ ] Add in-page help button/modal with shortcuts
- [ ] Document all keyboard interactions:
  - Tab/Shift+Tab navigation
  - Enter/Space to drag
  - Arrow keys to move
  - Escape to cancel
  - Checkbox space toggle
- [ ] Shortcuts displayed on first visit (optional tooltip)

### AC7: Testing and Quality

- [ ] 80% coverage on new accessibility helper functions
- [ ] Accessibility tests for keyboard navigation
- [ ] Accessibility tests for ARIA announcements
- [ ] Screen reader test checklist completed
- [ ] Color contrast verification documented
- [ ] Manual testing on real devices (mobile + desktop)
- [ ] 0 new SonarCloud issues

## Technical Approach

### 1. Add Keyboard Sensor (Priority: Critical)

**Location:** `app/components/qualified-teams/qualified-teams-client-page.tsx`

**Changes:**
```typescript
import {
  DndContext,
  DragEndEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor, // ADD THIS
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates, // ADD THIS
} from '@dnd-kit/sortable';

// In QualifiedTeamsUI component:
const sensors = useSensors(
  useSensor(MouseSensor, {
    activationConstraint: {
      distance: 8,
    },
  }),
  useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 8,
    },
  }),
  useSensor(KeyboardSensor, { // ADD THIS
    coordinateGetter: sortableKeyboardCoordinates,
  })
);
```

**Benefits:**
- Enables keyboard drag-and-drop with arrow keys
- Follows @dnd-kit best practices
- Provides native keyboard support

### 2. Add ARIA Live Regions (Priority: Critical)

**Location:** `app/components/qualified-teams/qualified-teams-client-page.tsx`

**Changes:**
```typescript
// Add state for screen reader announcements
const [announcement, setAnnouncement] = useState('');

// In handleDragEnd callback:
const handleDragEnd = useMemo(
  () => {
    return (event: DragEndEvent) => {
      // ... existing drag logic ...

      // After successful reorder, announce to screen readers
      const teamName = teams.find(t => t.id === activeTeamId)?.name;
      const groupName = group.name;
      setAnnouncement(
        `${teamName} moved to position ${newPosition} in ${groupName}`
      );

      // Clear announcement after 1 second
      setTimeout(() => setAnnouncement(''), 1000);
    };
  },
  [groups, predictions, updateGroupPositions]
);

// Add ARIA live region to JSX:
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {announcement}
</div>
```

**CSS for sr-only:**
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### 3. Add ARIA Labels to Draggable Cards (Priority: Critical)

**Location:** `app/components/qualified-teams/draggable-team-card.tsx`

**Changes:**
```typescript
// Add aria-label to card based on state
const getAriaLabel = () => {
  const positionText = `position ${position}`;
  const statusText =
    position <= 2 ? 'qualified' :
    position === 3 && predictedToQualify ? 'qualified as third place' :
    position === 3 && !predictedToQualify ? 'not qualified, use checkbox to select' :
    'not qualified';

  const dragInstructions = disabled
    ? ''
    : 'Press space to start dragging, arrow keys to move, escape to cancel';

  return `${team.name}, ${positionText}, ${statusText}. ${dragInstructions}`;
};

// Apply to card element:
<Card
  ref={setNodeRef}
  style={style}
  role="button"
  tabIndex={disabled ? -1 : 0}
  aria-label={getAriaLabel()}
  aria-describedby={`group-${group.id}-instructions`}
  sx={{ ... }}
>
```

**Add hidden instructions per group:**
```typescript
// In group-card.tsx:
<div id={`group-${group.id}-instructions`} className="sr-only">
  Use arrow keys to reorder teams within this group.
  Press escape to cancel dragging.
  Positions 1 and 2 automatically qualify.
  Use checkbox for position 3 to select third place qualifiers.
</div>
```

### 4. Improve Focus Indicators (Priority: High)

**Location:** `app/components/qualified-teams/draggable-team-card.tsx`

**Changes:**
```typescript
// Add focus styles to Card component:
sx={{
  mb: 1,
  touchAction: disabled ? 'auto' : 'none',
  backgroundColor,
  border: isDragging ? `2px dashed ${theme.palette.primary.main}` : '1px solid',
  borderColor: isDragging ? theme.palette.primary.main : theme.palette.divider,
  borderLeft: borderColor === 'transparent' ? undefined : `4px solid ${borderColor}`,

  // ADD FOCUS STYLES:
  '&:focus': {
    outline: `3px solid ${theme.palette.mode === 'dark' ? theme.palette.info.light : theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
  '&:focus:not(:focus-visible)': {
    outline: 'none', // Hide focus for mouse users
  },
  '&:focus-visible': {
    outline: `3px solid ${theme.palette.mode === 'dark' ? theme.palette.info.light : theme.palette.primary.main}`,
    outlineOffset: '2px',
  },
}}
```

### 5. Verify and Fix Color Contrast (Priority: High)

**Analysis Required:**

Test current colors with Chrome DevTools contrast checker:

1. **Position badges** (gray circle):
   - Light mode: Gray 300 background, Gray 800 text
   - Dark mode: Gray 800 background, Gray 100 text
   - Target: ≥4.5:1

2. **Border colors:**
   - Success green: `theme.palette.success.main`
   - Warning yellow: `theme.palette.warning.main`
   - Error red: `theme.palette.error.main`
   - Info blue: `theme.palette.info.main`
   - Target: ≥3:1 against background

3. **Checkbox labels:**
   - "Clasifica" text on light/dark background
   - Target: ≥4.5:1

4. **Results chips:**
   - "+1 pt", "+2 pts", "+0 pts"
   - Background: success.light, error.light
   - Text: white
   - Target: ≥4.5:1

**Action:** If any ratio < target, adjust colors in theme or component overrides.

### 6. Create Accessibility Helper Utilities (Priority: Medium)

**New File:** `app/utils/accessibility-helpers.ts`

```typescript
/**
 * Generate descriptive ARIA label for draggable team card
 */
export function getTeamCardAriaLabel(
  teamName: string,
  position: number,
  predictedToQualify: boolean,
  isLocked: boolean
): string {
  const positionText = `position ${position}`;
  const statusText = getQualificationStatusText(position, predictedToQualify);
  const instructions = isLocked ? '' : getDragInstructions();

  return `${teamName}, ${positionText}, ${statusText}. ${instructions}`.trim();
}

/**
 * Get qualification status text for screen readers
 */
export function getQualificationStatusText(
  position: number,
  predictedToQualify: boolean
): string {
  if (position <= 2) return 'qualified';
  if (position === 3 && predictedToQualify) return 'qualified as third place';
  if (position === 3 && !predictedToQualify) return 'not qualified, use checkbox to select';
  return 'not qualified';
}

/**
 * Get drag instructions for screen readers
 */
export function getDragInstructions(): string {
  return 'Press space to start dragging, arrow keys to move, escape to cancel';
}

/**
 * Generate announcement text for position changes
 */
export function getPositionChangeAnnouncement(
  teamName: string,
  newPosition: number,
  groupName: string
): string {
  return `${teamName} moved to position ${newPosition} in ${groupName}`;
}

/**
 * Generate announcement for third place toggle
 */
export function getThirdPlaceToggleAnnouncement(
  teamName: string,
  nowQualified: boolean
): string {
  return nowQualified
    ? `${teamName} selected as third place qualifier`
    : `${teamName} removed from third place qualifiers`;
}
```

### 7. Add Accessibility Tests (Priority: High)

**New File:** `__tests__/components/qualified-teams/draggable-team-card-accessibility.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import DraggableTeamCard from '../../../app/components/qualified-teams/draggable-team-card';
import { renderWithTheme } from '../../utils/test-utils';
import { testFactories } from '../../db/test-factories';

expect.extend(toHaveNoViolations);

describe('DraggableTeamCard - Accessibility', () => {
  const mockTeam = testFactories.team({ name: 'Argentina' });

  it('should have no accessibility violations', async () => {
    const { container } = renderWithTheme(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        disabled={false}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have descriptive aria-label', () => {
    renderWithTheme(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        disabled={false}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label');
    expect(card.getAttribute('aria-label')).toContain('Argentina');
    expect(card.getAttribute('aria-label')).toContain('position 1');
    expect(card.getAttribute('aria-label')).toContain('qualified');
  });

  it('should have aria-describedby pointing to group instructions', () => {
    const { container } = renderWithTheme(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        disabled={false}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    const card = screen.getByRole('button');
    const describedById = card.getAttribute('aria-describedby');
    expect(describedById).toBeTruthy();

    // Should reference instructions element
    const instructions = container.querySelector(`#${describedById}`);
    expect(instructions).toBeInTheDocument();
  });

  it('should be keyboard focusable when not disabled', () => {
    renderWithTheme(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        disabled={false}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('should not be keyboard focusable when disabled', () => {
    renderWithTheme(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        disabled={true}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '-1');
  });

  it('should have visible focus indicator', () => {
    const { container } = renderWithTheme(
      <DraggableTeamCard
        team={mockTeam}
        position={1}
        predictedToQualify={true}
        disabled={false}
        isGroupComplete={false}
        allGroupsComplete={false}
        isPending3rdPlace={false}
      />
    );

    const card = container.querySelector('[role="button"]') as HTMLElement;
    const styles = window.getComputedStyle(card, ':focus');

    // Should have outline styles defined
    expect(card).toHaveStyle({ outline: expect.any(String) });
  });
});
```

**New File:** `__tests__/utils/accessibility-helpers.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  getTeamCardAriaLabel,
  getQualificationStatusText,
  getDragInstructions,
  getPositionChangeAnnouncement,
  getThirdPlaceToggleAnnouncement,
} from '../../app/utils/accessibility-helpers';

describe('Accessibility Helpers', () => {
  describe('getTeamCardAriaLabel', () => {
    it('should generate label for position 1', () => {
      const label = getTeamCardAriaLabel('Argentina', 1, true, false);
      expect(label).toContain('Argentina');
      expect(label).toContain('position 1');
      expect(label).toContain('qualified');
      expect(label).toContain('Press space');
    });

    it('should generate label for position 3 with checkbox unchecked', () => {
      const label = getTeamCardAriaLabel('Colombia', 3, false, false);
      expect(label).toContain('Colombia');
      expect(label).toContain('position 3');
      expect(label).toContain('not qualified');
      expect(label).toContain('use checkbox');
    });

    it('should omit drag instructions when locked', () => {
      const label = getTeamCardAriaLabel('Argentina', 1, true, true);
      expect(label).not.toContain('Press space');
    });
  });

  describe('getPositionChangeAnnouncement', () => {
    it('should generate position change announcement', () => {
      const announcement = getPositionChangeAnnouncement('Argentina', 2, 'Group A');
      expect(announcement).toBe('Argentina moved to position 2 in Group A');
    });
  });

  describe('getThirdPlaceToggleAnnouncement', () => {
    it('should announce when third place selected', () => {
      const announcement = getThirdPlaceToggleAnnouncement('Colombia', true);
      expect(announcement).toBe('Colombia selected as third place qualifier');
    });

    it('should announce when third place deselected', () => {
      const announcement = getThirdPlaceToggleAnnouncement('Colombia', false);
      expect(announcement).toBe('Colombia removed from third place qualifiers');
    });
  });
});
```

### 8. Create Keyboard Shortcuts Documentation (Priority: Medium)

**New File:** `app/components/qualified-teams/keyboard-shortcuts-modal.tsx`

```typescript
'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';

interface KeyboardShortcutsModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

export default function KeyboardShortcutsModal({
  open,
  onClose,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Keyboard Shortcuts</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Use these keyboard shortcuts to navigate and make predictions efficiently:
        </Typography>

        <Table size="small">
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Tab / Shift+Tab</TableCell>
              <TableCell>Navigate between teams</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Space / Enter</TableCell>
              <TableCell>Activate drag mode for selected team</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Arrow Up</TableCell>
              <TableCell>Move team up one position</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Arrow Down</TableCell>
              <TableCell>Move team down one position</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Escape</TableCell>
              <TableCell>Cancel drag and return to original position</TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Space (on checkbox)</TableCell>
              <TableCell>Toggle third place qualification</TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Tip:</strong> Press ? to show/hide this help anytime.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
```

**Add to qualified-teams-client-page.tsx:**
```typescript
// Add keyboard shortcut listener
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      setShowShortcuts(true);
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

## Implementation Steps

### Phase 1: Critical Keyboard and ARIA Fixes (Day 1)

1. **Add KeyboardSensor to DndContext**
   - File: `qualified-teams-client-page.tsx`
   - Import KeyboardSensor and sortableKeyboardCoordinates
   - Add to useSensors array
   - Test keyboard drag with arrow keys

2. **Add ARIA live region for announcements**
   - File: `qualified-teams-client-page.tsx`
   - Add announcement state
   - Add live region div with sr-only class
   - Update handleDragEnd to set announcements
   - Add sr-only CSS class

3. **Create accessibility helper utilities**
   - File: `app/utils/accessibility-helpers.ts`
   - Implement getTeamCardAriaLabel
   - Implement announcement generators
   - Write unit tests (100% coverage target)

4. **Add ARIA labels to draggable cards**
   - File: `draggable-team-card.tsx`
   - Use helper to generate aria-label
   - Add role="button" and tabIndex
   - Add aria-describedby reference

5. **Add group instructions for screen readers**
   - File: `group-card.tsx`
   - Add hidden instructions div per group
   - Use sr-only class for screen reader only content

### Phase 2: Focus Management (Day 2)

1. **Improve focus indicators**
   - File: `draggable-team-card.tsx`
   - Add :focus, :focus-visible styles
   - Set outline width to 3px
   - Use high contrast colors (blue light mode, cyan dark mode)
   - Test in both light and dark mode

2. **Test focus behavior**
   - Manually test Tab navigation
   - Verify focus moves logically through groups
   - Verify focus returns to dragged element after drop
   - Verify focus visible in all states

### Phase 3: Color Contrast Verification (Day 2 afternoon)

1. **Audit all color combinations**
   - Use Chrome DevTools contrast checker
   - Test position badges (light and dark mode)
   - Test border colors against backgrounds
   - Test checkbox labels
   - Test results chips
   - Document all ratios

2. **Fix any contrast issues**
   - Adjust colors if ratio < 4.5:1 (text)
   - Adjust colors if ratio < 3:1 (UI components)
   - Re-test after changes
   - Document final color values

### Phase 4: Screen Reader Testing (Day 3)

1. **Test with VoiceOver (macOS)**
   - Navigate through all groups
   - Drag a team with keyboard
   - Verify position change announced
   - Toggle third place checkbox
   - Verify save status announced
   - Document findings

2. **Test with NVDA (Windows - if available)**
   - Navigate with Tab
   - Activate drag mode
   - Move team with arrows
   - Verify announcements
   - Document findings

3. **Test with JAWS (Windows - if available)**
   - Basic navigation test
   - Verify compatibility
   - Document findings

4. **Mobile screen reader testing**
   - iOS VoiceOver: Test swipe gestures
   - Android TalkBack: Test explore by touch
   - Verify drag-and-drop accessible on mobile
   - Document mobile-specific findings

### Phase 5: Keyboard Shortcuts Documentation (Day 3 afternoon)

1. **Create keyboard shortcuts modal**
   - File: `keyboard-shortcuts-modal.tsx`
   - Create modal component
   - Add shortcuts table
   - Style with Material-UI

2. **Add shortcut trigger**
   - File: `qualified-teams-client-page.tsx`
   - Add keyboard listener for '?'
   - Show/hide modal on press
   - Add help icon button to header

3. **Test modal**
   - Press ? to open
   - Verify all shortcuts documented
   - Verify modal accessible with keyboard
   - Test Escape to close

### Phase 6: Accessibility Testing (Day 4)

1. **Install jest-axe for automated testing**
   ```bash
   npm install --save-dev jest-axe
   ```

2. **Create accessibility test suite**
   - File: `draggable-team-card-accessibility.test.tsx`
   - Test for axe violations
   - Test aria-label presence and content
   - Test aria-describedby references
   - Test keyboard focusability
   - Test focus indicators

3. **Create helper utility tests**
   - File: `accessibility-helpers.test.ts`
   - Test all helper functions
   - Test edge cases
   - Achieve 100% coverage

4. **Run all tests**
   - `npm run test`
   - Verify all pass
   - Check coverage report

### Phase 7: Final Verification and Documentation (Day 5)

1. **Complete screen reader testing checklist**
   - VoiceOver: ✅ or ❌ with notes
   - NVDA: ✅ or ❌ with notes
   - JAWS: ✅ or ❌ with notes
   - Mobile VoiceOver: ✅ or ❌ with notes
   - Mobile TalkBack: ✅ or ❌ with notes

2. **Complete color contrast checklist**
   - Document all tested combinations
   - Confirm all meet WCAG AA
   - Note any exceptions with justification

3. **Create accessibility testing guide**
   - File: `docs/accessibility-testing-guide.md`
   - Document testing procedures
   - List keyboard shortcuts
   - Provide screen reader testing instructions
   - Include color contrast requirements

4. **Final manual testing**
   - Desktop keyboard navigation (full flow)
   - Mobile touch + screen reader
   - Dark mode verification
   - Test on real devices

### Phase 8: Quality Gates (Day 5 afternoon)

1. **Run validation checks** (MANDATORY before commit)
   - `npm run test` - All tests pass
   - `npm run lint` - No lint errors
   - `npm run build` - Build succeeds
   - Check coverage ≥80% on new code

2. **Accessibility verification**
   - Run axe DevTools on page
   - Verify 0 violations
   - Test keyboard navigation end-to-end
   - Test with real screen reader

3. **Commit and push**
   - Triggers Vercel Preview deployment
   - Wait for CI/CD checks

4. **User testing in Vercel Preview**
   - User tests accessibility improvements
   - User provides feedback or approves

5. **SonarCloud validation**
   - Wait for analysis
   - Fix any issues
   - Verify 0 new issues

## Files to Create

**New Files:**
1. `/app/utils/accessibility-helpers.ts` - Helper functions for ARIA labels and announcements
2. `/app/components/qualified-teams/keyboard-shortcuts-modal.tsx` - Modal documenting keyboard shortcuts
3. `/__tests__/utils/accessibility-helpers.test.ts` - Tests for helper functions
4. `/__tests__/components/qualified-teams/draggable-team-card-accessibility.test.tsx` - Accessibility tests
5. `/docs/accessibility-testing-guide.md` - Documentation for accessibility testing procedures

## Files to Modify

**Existing Files:**
1. `/app/components/qualified-teams/qualified-teams-client-page.tsx`
   - Add KeyboardSensor to DndContext
   - Add ARIA live region for announcements
   - Add announcement state and updates
   - Add keyboard shortcut listener for '?'
   - Import and use KeyboardShortcutsModal

2. `/app/components/qualified-teams/draggable-team-card.tsx`
   - Add role="button" and tabIndex
   - Add aria-label using helper
   - Add aria-describedby reference
   - Improve focus styles (3px outline, high contrast)
   - Add :focus-visible styles

3. `/app/components/qualified-teams/group-card.tsx`
   - Add hidden instructions div with sr-only class
   - Ensure proper heading roles (h2)

4. `/app/components/qualified-teams/third-place-summary.tsx`
   - Add aria-live="polite" to count display
   - Ensure count updates announced

5. `/app/globals.css` or theme file
   - Add .sr-only class for screen reader only content

6. `/package.json`
   - Add jest-axe dependency

## Testing Strategy

### Automated Tests

**Accessibility Tests** (jest-axe):
- Test for axe violations on all components
- Test ARIA label presence and content
- Test aria-describedby references
- Test keyboard focusability (tabIndex)
- Test focus indicator styles

**Unit Tests** (accessibility-helpers.ts):
- Test getTeamCardAriaLabel variations
- Test getQualificationStatusText logic
- Test announcement generators
- Test edge cases
- Target: 100% coverage

### Manual Tests

**Keyboard Navigation Checklist:**
- [ ] Tab navigates logically through all groups
- [ ] Shift+Tab moves backward correctly
- [ ] Enter/Space activates drag mode
- [ ] Arrow Up moves team up
- [ ] Arrow Down moves team down
- [ ] Escape cancels drag
- [ ] Focus indicators visible (3px, high contrast)
- [ ] Focus returns to dragged element after drop
- [ ] Checkbox toggles with Space

**Screen Reader Checklist:**

**VoiceOver (macOS):**
- [ ] Team names announced clearly
- [ ] Positions announced (1st, 2nd, 3rd, 4th)
- [ ] Qualification status announced
- [ ] Drag instructions read
- [ ] Position changes announced in live region
- [ ] Save status announced
- [ ] Group headers announced as headings
- [ ] Checkbox labels clear

**NVDA (Windows):**
- [ ] Navigate with Tab
- [ ] Activate drag with Enter/Space
- [ ] Move with Arrow keys
- [ ] Escape cancels
- [ ] Announcements heard clearly
- [ ] Checkbox state announced

**JAWS (Windows):**
- [ ] Basic navigation works
- [ ] Compatible with latest version

**Mobile VoiceOver (iOS):**
- [ ] Swipe gestures work
- [ ] Explore by touch works
- [ ] Drag-and-drop accessible
- [ ] Announcements clear

**Mobile TalkBack (Android):**
- [ ] Swipe navigation works
- [ ] Explore by touch works
- [ ] Drag accessible
- [ ] Announcements clear

**Color Contrast Checklist:**
- [ ] Position badges: ≥4.5:1 (light mode)
- [ ] Position badges: ≥4.5:1 (dark mode)
- [ ] Border green: ≥3:1 against background
- [ ] Border yellow: ≥3:1 against background
- [ ] Border gray: ≥3:1 against background
- [ ] Border blue (pending): ≥3:1 against background
- [ ] Checkbox label: ≥4.5:1
- [ ] Results chips: ≥4.5:1
- [ ] Focus outline: ≥3:1 (light mode)
- [ ] Focus outline: ≥3:1 (dark mode)

### Performance Tests

**Keyboard Performance:**
- [ ] Drag activation feels instant (<100ms)
- [ ] Arrow key movement smooth
- [ ] No lag during keyboard navigation

**Screen Reader Performance:**
- [ ] Announcements not overwhelming (debounced)
- [ ] Live region updates don't interrupt navigation

## Validation Considerations

### SonarCloud Requirements

**Coverage:**
- Target: ≥80% line coverage on new code
- Accessibility helpers: 100% coverage
- Accessibility tests: Focus on critical paths

**Code Quality:**
- 0 new bugs
- 0 new vulnerabilities
- 0 new code smells
- Maintainability rating: A
- Security rating: A

### WCAG 2.1 AA Compliance

**Level A (Must Pass):**
- Keyboard accessible
- Text alternatives for non-text content
- Color is not the only means of conveying information
- Visible focus indicator

**Level AA (Must Pass):**
- Color contrast ≥4.5:1 (normal text)
- Color contrast ≥3:1 (large text, UI components)
- Focus visible
- Label or instructions for user input
- Multiple ways to locate content

### Pre-Commit Checklist

- [ ] All unit tests pass
- [ ] All accessibility tests pass
- [ ] jest-axe reports 0 violations
- [ ] Keyboard navigation tested manually
- [ ] Screen reader tested (at least VoiceOver)
- [ ] Color contrast verified
- [ ] Focus indicators visible
- [ ] Lint passes
- [ ] Build succeeds
- [ ] No console errors

## Risk Assessment

**Medium Risk:**
1. **Screen reader compatibility variations**
   - Mitigation: Test with multiple screen readers (VoiceOver, NVDA, JAWS)
   - Fallback: Document known issues if unfixable

2. **Mobile screen reader testing complexity**
   - Mitigation: Test on real devices (iOS + Android)
   - Document mobile-specific findings

3. **Color contrast in dark mode**
   - Mitigation: Test both light and dark mode separately
   - Adjust colors if needed

**Low Risk:**
1. **KeyboardSensor integration** - Well-documented @dnd-kit feature
2. **ARIA label implementation** - Straightforward helper functions
3. **Focus styling** - Standard CSS approach
4. **Automated accessibility tests** - jest-axe is stable

## Success Criteria

**Functional:**
- ✅ Keyboard drag-and-drop works with arrow keys
- ✅ Screen readers announce position changes
- ✅ Focus indicators visible (3px, high contrast)
- ✅ All interactive elements keyboard accessible
- ✅ Color contrast meets WCAG AA (≥4.5:1 text, ≥3:1 UI)
- ✅ Keyboard shortcuts documented and accessible

**Quality:**
- ✅ 80% test coverage on new code
- ✅ 0 axe violations
- ✅ 0 new SonarCloud issues
- ✅ All lint checks pass
- ✅ Build succeeds

**Accessibility:**
- ✅ VoiceOver (macOS) tested and works
- ✅ NVDA tested (if available)
- ✅ Mobile screen readers tested
- ✅ Keyboard navigation complete
- ✅ WCAG 2.1 AA compliant

## Open Questions

1. **jest-axe installation:** Should we use jest-axe or another automated accessibility testing tool?
   - **Recommendation:** jest-axe - well-maintained, integrates with Vitest

2. **JAWS testing:** Do we have access to JAWS license for testing?
   - **Recommendation:** Test if available, otherwise document as limitation

3. **Mobile device testing:** Which mobile devices should we test on?
   - **Recommendation:** iOS (iPhone with VoiceOver) + Android (Pixel with TalkBack)

4. **Keyboard shortcuts modal:** Should it show on first visit or only on '?' press?
   - **Recommendation:** Only on '?' press + help icon button (less intrusive)

5. **Color adjustments:** If contrast ratios fail, which colors should we adjust?
   - **Recommendation:** Adjust Material-UI theme colors to maintain brand identity while meeting WCAG

## Dependencies

**New Dependencies:**
- `jest-axe` (devDependency) - Automated accessibility testing

**Existing Dependencies:**
- `@dnd-kit/core` - Already installed, KeyboardSensor available
- `@dnd-kit/sortable` - Already installed, sortableKeyboardCoordinates available
- `@mui/material` - Already installed, accessibility features available

## Next Steps After Plan Approval

1. User reviews plan in PR
2. User provides feedback or approves
3. User says "execute the plan"
4. Read `docs/claude/implementation.md` completely
5. Define tasks with TaskCreate
6. Set dependencies with TaskUpdate
7. Start implementation in execution waves
8. Test with real screen readers
9. Run validation checks before commit
10. Deploy to Vercel Preview for user testing

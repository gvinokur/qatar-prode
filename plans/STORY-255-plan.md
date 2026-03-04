# Story #255: [UX] Qualified Teams: Allow dragging from anywhere on team card

## Context

The qualified teams page uses a small `DragIndicatorIcon` as the **only** drag activation target. This is hard to discover, especially on first use. Users can't figure out they need to grab that specific small icon.

The fix: move `attributes`/`listeners` from `DragHandle` to the card container so the whole card body becomes draggable. The handle icon stays as a visual affordance (pointer-events: none). Cursor style updates (grab/grabbing) reinforce the new affordance. A small TouchSensor delay increase (200→250ms) ensures quick swipes on mobile still scroll naturally.

**Worktree:** `/Users/gvinokur/Personal/qatar-prode-story-255`
**Branch:** `feature/story-255`

---

## Acceptance Criteria (from issue)

- [ ] Users can drag from anywhere on the card body (desktop)
- [ ] Users can drag by pressing and holding anywhere on mobile
- [ ] Vertical page scroll on mobile still works (short swipes don't trigger drag)
- [ ] Drag handle icon remains visible as visual hint
- [ ] `cursor: grab` on hover; `cursor: grabbing` while dragging (desktop)
- [ ] ThirdPlaceCheckbox does NOT trigger drag
- [ ] Locked/saving state still prevents dragging
- [ ] DnD tests updated

---

## Technical Approach

### Current Architecture

```
Card (ref=setNodeRef, style=transform/transition)
  └─ CardContent
      ├─ DragHandle (has {...attributes} {...listeners})  ← drag target
      │    └─ DragIndicatorIcon
      ├─ PositionBadge
      ├─ TeamInfo
      ├─ ThirdPlaceCheckbox (position=3 only)
      └─ ResultsOverlay
```

### Target Architecture

```
Card (ref=setNodeRef, style=transform/transition, {...attributes} {...listeners})  ← drag target
  └─ CardContent
      ├─ DragHandle (visual only, pointer-events: none)
      │    └─ DragIndicatorIcon
      ├─ PositionBadge
      ├─ TeamInfo
      ├─ Box[onPointerDown stopPropagation]  ← prevent drag from checkbox
      │    └─ ThirdPlaceCheckbox (position=3 only)
      └─ ResultsOverlay
```

---

## Visual Prototype

### Unlocked card (whole card draggable)

```
┌──────────────────────────────────────────────────┐  ← cursor: grab
│ ⠿  [①]  Brazil                    [3rd ☐]       │
└──────────────────────────────────────────────────┘
  ↑ visual hint only (pointer-events:none)
  ↑ cursor:grab on ENTIRE card
```

### While dragging

```
┌──────────────────────────────────────────────────┐  ← cursor: grabbing
│ ⠿  [①]  Brazil                    [3rd ☐]       │  ← opacity: 0.5
└──────────────────────────────────────────────────┘  ← dashed primary border
```

### Locked/saving state (no drag)

```
┌──────────────────────────────────────────────────┐  ← cursor: default
│     [①]  Brazil                         +2pts   │  ← no handle icon
└──────────────────────────────────────────────────┘
```

### Mobile behavior

- Touch and **hold** (≥250ms) anywhere on card → activates drag
- Quick **swipe** (<250ms) on card → drag NOT activated (normal scroll)
- Checkbox area wrapped with `onPointerDown stopPropagation` → checkbox tap never triggers drag

---

## Interactive Elements Audit

| Element | Interactive? | Action needed |
|---------|-------------|---------------|
| `DragHandle` (DragIndicatorIcon) | No (visual only after change) | `pointerEvents: none` |
| `PositionBadge` | No (display only) | None |
| `TeamInfo` (Typography) | No (display only) | None |
| `ThirdPlaceCheckbox` (FormControlLabel + Checkbox) | **Yes** | `onPointerDown stopPropagation` wrapper |
| `ResultsOverlay` (Chip + Typography) | No (display only) | None |

Only the ThirdPlaceCheckbox requires a stopPropagation wrapper.

---

## Files to Modify

### 1. `app/components/qualified-teams/draggable-team-card.tsx`

**Changes:**

a) **`DragHandle` component**: Remove `attributes`/`listeners` props. Add `pointerEvents: 'none'` to Box. (Visibility already controlled by the `{!isLocked && ...}` conditional in the render.)

```tsx
// Before
function DragHandle({ disabled, attributes, listeners }: { readonly disabled: boolean; readonly attributes: any; readonly listeners: any }) {
  return (
    <Box {...attributes} {...listeners} sx={{ cursor: disabled ? 'not-allowed' : 'grab', ... }}>
      <DragIndicatorIcon />
    </Box>
  );
}

// After
function DragHandle({ disabled }: { readonly disabled: boolean }) {
  return (
    <Box sx={{ pointerEvents: 'none', display: 'flex', alignItems: 'center', opacity: disabled ? 0.38 : 0.54 }}>
      <DragIndicatorIcon />
    </Box>
  );
}
```

b) **`Card` component**: Add `{...attributes}` `{...listeners}` and `cursor` styling via MUI `sx` prop.

```tsx
// After
<Card
  ref={setNodeRef}
  style={style}
  {...attributes}
  {...listeners}
  sx={{
    mb: 1,
    touchAction: (isLocked || isSaving) ? 'auto' : 'none',
    cursor: (isLocked || isSaving) ? 'default' : isDragging ? 'grabbing' : 'grab',
    backgroundColor,
    border: isDragging ? `2px dashed ${theme.palette.primary.main}` : '1px solid',
    borderColor: isDragging ? theme.palette.primary.main : theme.palette.divider,
    borderLeft: borderColor === 'transparent' ? undefined : `4px solid ${borderColor}`,
  }}
>
```

c) **`DragHandle` usage in render**: Remove `attributes`/`listeners` props.

```tsx
// After
{!isLocked && <DragHandle disabled={isLocked || isSaving} />}
```

d) **Wrap `ThirdPlaceCheckbox`** to prevent drag initiation:

```tsx
// After
{position === 3 && !isLocked && (
  <Box component="span" onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}>
    <ThirdPlaceCheckbox ... />
  </Box>
)}
```

### 2. `app/components/qualified-teams/qualified-teams-client-page.tsx`

Increase `TouchSensor` delay from 200ms to 250ms.

### 3. `__tests__/components/qualified-teams/draggable-team-card.test.tsx`

**New tests:**
- Card has `cursor: grab` when not locked
- Card has `cursor: default` when locked
- ThirdPlaceCheckbox wrapper stops pointer event propagation

---

## Implementation Steps

1. Modify `DragHandle` component - remove attributes/listeners props, add `pointerEvents: none`
2. Spread `{...attributes}` and `{...listeners}` onto `Card` container
3. Add `cursor` property to `Card` sx (grab/grabbing/default)
4. Wrap `ThirdPlaceCheckbox` with propagation-stopping Box
5. Increase `TouchSensor` delay to 250ms in `qualified-teams-client-page.tsx`
6. Update/add tests in `draggable-team-card.test.tsx`

---

## Testing Strategy

### Unit Tests (`draggable-team-card.test.tsx`)

- Existing: DragIndicatorIcon rendered when not locked → still passes (icon stays visible)
- New: Card root element has `cursor: grab` when not locked and not saving
- New: Card root element has `cursor: default` when locked
- New: `onPointerDown` on ThirdPlaceCheckbox wrapper calls `stopPropagation`

### Manual Testing

- Desktop: Click anywhere on card body → drag activates
- Desktop: Click on checkbox (position 3 card) → does NOT activate drag, just checks/unchecks
- Desktop: Hover over card → cursor changes to grab; during drag → cursor is grabbing
- Mobile: Long-press (>250ms) anywhere on card → drag activates
- Mobile: Quick swipe → does NOT activate drag (page scrolls)
- Mobile: Quick touch-and-release without movement → no drag, clean cancellation
- Locked tournament: No cursor change, no drag from anywhere

---

## Validation Considerations

- **TypeScript:** `DragHandle` props change - remove `attributes`/`listeners` from the interface
- **Accessibility:** `attributes` (role, tabIndex, aria-*) move to Card container - makes the entire card keyboard-focusable for drag
- **SonarCloud:** No new issues expected
- **Coverage:** New cursor and propagation tests cover new behavior
- **Mobile scroll trade-off:** `touchAction: 'none'` on the Card already exists in the current implementation. The 250ms delay means quick swipes will not activate drag.

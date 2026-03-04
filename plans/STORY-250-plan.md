# Plan: [UX] Improve Friend Groups Card Actions: Move Create Button & Add Group Count Indicator (#250)

## Context

The Friend Groups card in the tournament sidebar currently shows two stacked buttons in `CardActions` (CREATE GROUP + VIEW/DISCOVER GROUPS), which clutters the card footer and violates the project's UI pattern of single actions in card footers. Additionally, the card starts collapsed, giving users no indication of how many groups they belong to without expanding.

This plan implements Option C from the story: a less prominent "+ Create group" button at the bottom of the list when groups exist, plus a prominent CTA in the empty state — while simplifying `CardActions` to a single button.

---

## Files to Modify

1. `app/components/tournament-page/friend-groups-list.tsx` — main component (primary changes)
2. `app/components/tournament-page/friend-groups-list.test.tsx` — update existing tests, add new ones
3. `locales/en/groups.json` — add `header.groupCount` key
4. `locales/es/groups.json` — add `header.groupCount` key

**No changes to:**
- `FriendGroupsSidebarEmptyState.tsx` — Create Group CTA will be added outside this component in `FriendGroupsList`

---

## Technical Approach

### 1. Group Count Indicator in CardHeader

Add a computed `groupCount = userGroups.length + participantGroups.length`.

Use the `subheader` slot of `CardHeader`, combining the count with the active indicator:

```tsx
const groupCount = userGroups.length + participantGroups.length

const groupCountLabel = groupCount > 0
  ? t('header.groupCount', { count: groupCount })
  : t('header.noGroups')

const subheaderParts = [
  isActive ? t('status.youAreHere') : null,
  groupCountLabel,
].filter(Boolean).join(' · ')
```

Resulting subheader values:
- Active + groups: `"You are here · 3 groups"`
- Active + no groups: `"You are here · No groups"`
- Not active + groups: `"3 groups"`
- Not active + no groups: `"No groups"`

This approach reuses the existing `subheader` slot without adding extra DOM elements, stays consistent with the `user-tournament-statistics.tsx` pattern.

### 2. Remove CREATE GROUP from CardActions

Remove the `CREATE GROUP` button from `CardActions`. After this, `CardActions` contains only one button at a time:
- `VIEW GROUPS` (when groups or pending requests exist)
- `DISCOVER GROUPS` (when no groups and no pending requests)

The `flexDirection: 'column'` and `gap: 1` styling can be simplified or kept as-is.

### 3. Add Create Group CTA Inside CardContent

**When empty state (`isEmpty === true`):**
After `<FriendGroupsSidebarEmptyState>`, add a prominent "Create Group" button:

```tsx
{isEmpty ? (
  <>
    <FriendGroupsSidebarEmptyState onLearnMore={...} />
    <Box sx={{ mt: 1 }}>
      <Button
        variant="outlined"
        color="primary"
        fullWidth
        size="small"
        startIcon={<AddIcon />}
        onClick={() => setOpenCreateDialog(true)}
      >
        {t('actions.create')}
      </Button>
    </Box>
  </>
) : (
  <List ...>
    {/* existing group list rendering */}

    {/* After all groups: small "+ Create group" button */}
    <ListItem disableGutters sx={{ justifyContent: 'center', pt: 1 }}>
      <Button
        size="small"
        color="secondary"
        onClick={() => setOpenCreateDialog(true)}
        startIcon={<AddIcon />}
      >
        {t('actions.create')}
      </Button>
    </ListItem>
  </List>
)}
```

Import `Add as AddIcon` from `@mui/icons-material`.
Import `Box` from MUI (already available via `@mui/material`).

### 4. i18n Keys to Add

**`locales/en/groups.json`** — add under `header` section:
```json
"header": {
  "groupCount": "{count, plural, =1 {1 group} other {# groups}}",
  "noGroups": "No groups"
}
```

**`locales/es/groups.json`**:
```json
"header": {
  "groupCount": "{count, plural, =1 {1 grupo} other {# grupos}}",
  "noGroups": "Sin grupos"
}
```

---

## Visual Prototype

### Collapsed State (with groups)
```
┌─────────────────────────────────────────────┐
│ Friend Groups              [▼]               │
│ 3 groups                                     │
├─────────────────────────────────────────────┤
│ [VIEW GROUPS ↗]                              │
└─────────────────────────────────────────────┘
```

### Collapsed State (active, with groups)
```
┌─────────────────────────────────────────────┐
│ Friend Groups              [▼]               │
│ You are here · 3 groups                      │
├─────────────────────────────────────────────┤
│ [VIEW GROUPS ↗]                              │
└─────────────────────────────────────────────┘
```

### Expanded State (with groups)
```
┌─────────────────────────────────────────────┐
│ Friend Groups              [▲]               │
│ 3 groups                                     │
│─────────────────────────────────────────────│
│  My First Group           [🗑] [✉]           │
│  My Second Group          [🗑] [✉]           │
│  ─────────────────────────────              │
│  Friend Group                               │
│  ─────────────────────────────              │
│  [+ Create group]                           │
├─────────────────────────────────────────────┤
│ [VIEW GROUPS ↗]                              │
└─────────────────────────────────────────────┘
```

### Empty State (no groups, expanded by default)
```
┌─────────────────────────────────────────────┐
│ Friend Groups              [▼]               │
│─────────────────────────────────────────────│
│        ¡Compite con Amigos!                 │
│    Crea grupos privados o únete...          │
│  ✓ Private leaderboards                     │
│  ✓ Bragging rights                          │
│  ✓ Track progress                           │
│       [Learn More →]                        │
│ [+ Create Group (outlined, full-width)]     │
├─────────────────────────────────────────────┤
│ [DISCOVER GROUPS 🔍]                         │
└─────────────────────────────────────────────┘
```

### Collapsed State (no groups)
```
┌─────────────────────────────────────────────┐
│ Friend Groups              [▼]               │
│ No groups                                    │
├─────────────────────────────────────────────┤
│ [DISCOVER GROUPS 🔍]                         │
└─────────────────────────────────────────────┘
```

---

## Implementation Steps

1. **Add `Box` to MUI imports** in `friend-groups-list.tsx` (Box is not currently imported)
2. **Add `Add as AddIcon`** to `@mui/icons-material` imports
3. **Compute `groupCount`** from `userGroups.length + participantGroups.length`
4. **Update `CardHeader` subheader** to combine active indicator + group count
5. **Remove CREATE GROUP button** from `CardActions`
6. **Restructure `CardContent`**: Add "Create Group" CTA button after the `FriendGroupsSidebarEmptyState` block, and at the bottom of the groups list
7. **Add i18n keys** to both `en/groups.json` and `es/groups.json`
8. **Update tests** (see testing strategy)

---

## Testing Strategy

### Tests to Update

1. **`'renders "Crear Grupo" button'`** — Card starts collapsed when groups exist (due to `unmountOnExit`), so expand first:
   ```tsx
   it('renders "Crear Grupo" button', async () => {
     renderWithTheme(<FriendGroupsList {...mockProps} />)
     const expandButton = screen.getByLabelText('mostrar más')
     fireEvent.click(expandButton)
     await waitFor(() => {
       expect(screen.getByRole('button', { name: /Crear Grupo/i })).toBeInTheDocument()
     })
   })
   ```

2. **`'renders regular buttons when there are groups'`** — Same: expand first to find "Crear Grupo"

3. **`'renders regular buttons when there are pending requests'`** — Same: expand first

### New Tests to Add

4. **Count indicator visible when groups exist:**
   ```tsx
   it('shows group count in subheader when groups exist', () => {
     renderWithTheme(<FriendGroupsList {...mockProps} />)
     // mockProps has 2 userGroups + 1 participantGroup = 3 total
     expect(screen.getByText('3 grupos')).toBeInTheDocument()
   })
   ```

5. **Count combined with "You are here" when active:**
   ```tsx
   it('shows combined subheader when isActive and groups exist', () => {
     renderWithTheme(<FriendGroupsList {...mockProps} isActive={true} />)
     expect(screen.getByText('Estás aquí · 3 grupos')).toBeInTheDocument()
   })
   ```

6. **Shows "No groups" in subheader when count is 0:**
   ```tsx
   it('shows "Sin grupos" in subheader when no groups', () => {
     renderWithTheme(<FriendGroupsList {...emptyProps} />)
     expect(screen.getByText('Sin grupos')).toBeInTheDocument()
   })
   ```

7. **CREATE GROUP not in CardActions:**
   ```tsx
   it('does not render "Crear Grupo" button in CardActions (collapsed)', () => {
     renderWithTheme(<FriendGroupsList {...mockProps} />)
     // When collapsed, create button is not in DOM (unmountOnExit)
     expect(screen.queryByRole('button', { name: /Crear Grupo/i })).not.toBeInTheDocument()
   })
   ```

8. **Create Group CTA visible in empty state:**
   ```tsx
   it('renders "Crear Grupo" CTA in empty state', () => {
     renderWithTheme(<FriendGroupsList {...emptyProps} />)
     // Empty state auto-expands, so create button is visible
     expect(screen.getByRole('button', { name: /Crear Grupo/i })).toBeInTheDocument()
   })
   ```

---

## Acceptance Criteria Mapping

| AC | Implementation |
|----|----------------|
| `CardActions` has only one button (VIEW/DISCOVER) | Remove CREATE GROUP from CardActions |
| CREATE GROUP accessible from within card | Bottom of list + empty state CTA |
| Group count indicator in collapsed header | `subheader` slot with count text |
| Count = `userGroups.length + participantGroups.length` | `groupCount` computation |
| Count hidden/shows "No groups" when 0 | Only render count in subheader when `groupCount > 0` |
| All existing tests pass + new tests | Update/add tests as described |
| i18n strings for new text | Add `header.groupCount` to en/es groups.json |

---

## Open Questions

None — approach is clear based on Option C from the issue.

---
_Plan reviewed by automated subagent — no significant concerns. Ready to implement._

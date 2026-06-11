# Story #471 Plan: Group Admins Can Remove Members from a Group

## Context

Group owners and admins currently have no way to remove a member who joined by mistake, is inactive, or should no longer be in the group. Members can only leave voluntarily. This story closes that gap by adding a "Remove Users" button inside the existing **Solicitudes (Requests)** admin tab, opening a multiselect dialog where the admin picks members to remove, then confirms.

## Acceptance Criteria (from issue)
- Group admins can remove regular members
- Group owner can remove regular members AND admins
- Owner themselves cannot be removed
- Admins cannot remove other admins (only owner can)
- Removed user immediately loses access
- Confirmation before removal
- Works in EN and ES

---

## Design Decision

**No new tab.** The remove functionality lives inside the existing "Solicitudes" tab (`JoinRequestManager`), below the join-request list. A single "Remove Members" button opens a dialog with checkboxes to select members, then a "Remove (N)" confirm button. This keeps the admin interface minimal.

---

## Visual Prototype

### Solicitudes Tab — with Remove Members button

```
┌────────────────────────────────────────┐
│  👤 Solicitudes de ingreso             │
│  [No pending requests]                 │
│                                        │
│  ──────────────────────────────────    │
│                                        │
│  [ Remove Members ]   ← new button     │
└────────────────────────────────────────┘
```

### Remove Members Dialog

```
┌────────────────────────────────────────┐
│  Remove Members                        │
│  ────────────────────────────────────  │
│  ☐  Bob        Admin  ← owner only     │
│  ☑  Carol      Member                  │
│  ☐  David      Member                  │
│  ☐  Eva        Member                  │
│  ────────────────────────────────────  │
│  1 member selected                     │
│                                        │
│               [Cancel]  [Remove (1)]   │
└────────────────────────────────────────┘
```

**Permission rules in dialog:**
- Viewer is **owner**: sees all members except themselves (admins + regular members)
- Viewer is **admin**: sees only regular members (not other admins, not owner)
- Owner row never appears in the list

**States:**
- No selection: "Remove" button disabled
- Removing: button shows loading spinner
- Success: dialog closes, JoinRequestManager shows success Alert
- Error: snackbar with error message, dialog stays open

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `app/actions/prode-group-actions.ts` | Add `removeGroupMembersAction` (batch removal) |
| `app/components/friend-groups/remove-members-dialog.tsx` | **New** — multiselect dialog component |
| `app/components/friend-groups/join-request-manager.tsx` | Add "Remove Members" button + wire dialog |
| `app/components/friend-groups/admin-section-tabs.tsx` | Pass `members` (with `is_admin`) + `ownerId` + `isOwner` to `JoinRequestManager` |
| `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` | Pass `ownerId` + `isOwner` to `AdminSectionTabs` |
| `locales/en/groups.json` | Add `joinRequests.removeMembers` keys |
| `locales/es/groups.json` | Same for Spanish |
| `docs/code-structure/actions.md` | Add `removeGroupMembersAction` entry |
| `docs/code-structure/components/components-friend-groups.md` | Add `RemoveMembersDialog`; update `JoinRequestManager` and `AdminSectionTabs` entries |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 13 (Friend group management)** — `JoinRequestManager` gains a "Remove Members" button that opens `RemoveMembersDialog`, which calls `removeGroupMembersAction` → `deleteParticipantFromGroup` (looped per member)

**New flows:**
- None (extends existing Flow 13)

---

### `app/actions/prode-group-actions.ts` *(modified)*

**New functions:**

- **`removeGroupMembersAction(groupId: string, memberIds: string[]): Promise<void>`**
  Server Action. Allows group owner or admin to remove one or more members from the group in a single call. Iterates over `memberIds` and calls `deleteParticipantFromGroup` for each valid target. Authorization rules:
  - Current user must be owner or admin (fetches participants to verify)
  - Skips (does not throw) if `memberId === ownerId` — owner is never removable
  - Admins cannot remove other admins — throws if any target is an admin and caller is not owner
  Calls: `getLoggedInUser`, `findProdeGroupById`, `findParticipantsInGroup`, `deleteParticipantFromGroup`
  Tests:
  - throws when caller is not authenticated
  - throws when group does not exist
  - throws when caller is neither owner nor admin of the group
  - throws when admin attempts to remove an admin (any target is admin and caller is not owner)
  - allows owner to remove a mix of admins and regular members
  - allows admin to remove regular members only
  - no-ops silently if memberIds is empty
  - calls deleteParticipantFromGroup once per valid memberId

---

### `app/components/friend-groups/remove-members-dialog.tsx` *(new)*

**New component:**

- **`RemoveMembersDialog`** (default export, Client Component)
  Props: `{ open: boolean; onClose: () => void; onSuccess: (removedIds: string[]) => void; groupId: string; members: { id: string; nombre: string; is_admin: boolean }[]; ownerId: string; isOwner: boolean }`
  Renders a MUI Dialog with a scrollable List of Checkbox items. Visible members: if `isOwner`, all except owner (`id !== ownerId`); otherwise only non-admins. Tracks a `Set<string>` of selected IDs. "Remove (N)" button calls `removeGroupMembersAction`, then calls `onSuccess(selectedIds)` on completion. Error shown as Alert inside the dialog.
  Calls: `removeGroupMembersAction`
  Tests:
  - renders only non-admin members when viewer is a non-owner admin
  - renders admin and regular members (excluding owner) when viewer is owner
  - "Remove" button is disabled when no member is selected
  - selecting a member enables the "Remove" button with count label
  - calls removeGroupMembersAction with correct groupId and selectedIds on confirm
  - calls onSuccess with removed IDs after successful removal
  - shows error Alert inside dialog when removeGroupMembersAction throws; dialog stays open
  - Cancel button calls onClose without removing anyone
  - (all tests use `testFactories.user()` and `testFactories.prodeGroup()` for test data)

---

### `app/components/friend-groups/join-request-manager.tsx` *(modified)*

**Changed types:**
- Add new optional props: `members?: { id: string; nombre: string; is_admin: boolean }[]`, `ownerId?: string`, `isOwner?: boolean`

**New UI:**
- Below the join-request list (always, not just when there are requests), render a "Remove Members" button if `members` prop is provided and has at least one removable member
- Button opens `RemoveMembersDialog`
- On `onSuccess`: remove the returned IDs from a local `removedIds` state (or show a success Alert); call `router.refresh()`

**Changed functions:**
- **`JoinRequestManager`**: same signature return type `JSX.Element`, but props extended with the three optional members fields above
  Tests (additions to existing suite):
  - does not render Remove Members button when members prop is absent
  - renders Remove Members button when members prop has removable members
  - opens RemoveMembersDialog on Remove Members click
  - shows success Alert after successful removal and refreshes

---

### `app/components/friend-groups/admin-section-tabs.tsx` *(modified)*

**Changed types:**
- `Props.members`: was `{ id: string; nombre: string }[]`, now `{ id: string; nombre: string; is_admin: boolean }[]`
- Add `Props.ownerId: string`
- Add `Props.isOwner: boolean`

**Changed calls:**
- Pass `members`, `ownerId`, `isOwner` through to `JoinRequestManager`

---

### `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` *(modified)*

**Changed calls:**
- Pass `ownerId={prodeGroup.owner_user_id}` and `isOwner={isOwner}` to `AdminSectionTabs`

---

## Translation Keys

### `locales/en/groups.json` — additions under `joinRequests`
```json
"joinRequests": {
  // ...existing keys...
  "removeMembersButton": "Remove Members",
  "removeMembersDialog": {
    "title": "Remove Members",
    "selectionCount": "{count} member(s) selected",
    "confirmButton": "Remove ({count})",
    "cancelButton": "Cancel",
    "roles": {
      "admin": "Admin",
      "member": "Member"
    },
    "success": "Members removed successfully",
    "error": "Failed to remove members"
  }
}
```

### `locales/es/groups.json` — additions under `joinRequests`
```json
"joinRequests": {
  // ...existing keys...
  "removeMembersButton": "Eliminar Miembros",
  "removeMembersDialog": {
    "title": "Eliminar Miembros",
    "selectionCount": "{count} miembro(s) seleccionado(s)",
    "confirmButton": "Eliminar ({count})",
    "cancelButton": "Cancelar",
    "roles": {
      "admin": "Admin",
      "member": "Miembro"
    },
    "success": "Miembros eliminados correctamente",
    "error": "Error al eliminar miembros"
  }
}
```

---

## Implementation Steps

1. **Server action** (`prode-group-actions.ts`): Add `removeGroupMembersAction` with auth/permission guards
2. **New dialog component** (`remove-members-dialog.tsx`): Checkbox multiselect + confirm, following `JoinRequestManager` patterns
3. **Update `JoinRequestManager`**: Add optional members props, "Remove Members" button, wire dialog and success handling
4. **Update `AdminSectionTabs`**: Add `ownerId` + `isOwner` props; pass members+ownerId+isOwner to JoinRequestManager
5. **Update page**: Pass `ownerId` and `isOwner` to AdminSectionTabs
6. **Translations**: Add keys to both locales
7. **CODE-STRUCTURE updates**: Update `actions.md` and `components-friend-groups.md`

---

## Testing Strategy

### Unit Tests — `__tests__/actions/prode-group-actions.remove-members.test.ts`
8 test cases for `removeGroupMembersAction` (listed in Mid-Level Design)

### Component Tests — `__tests__/components/friend-groups/remove-members-dialog.test.tsx`
9 test cases for `RemoveMembersDialog` (listed in Mid-Level Design)

### Component Tests — additions to existing `__tests__/components/friend-groups/join-request-manager.test.tsx`
4 additional test cases (listed in Mid-Level Design)

### Manual verification
1. Log in as group owner → Solicitudes tab → "Remove Members" button visible → dialog shows admins + members
2. Log in as group admin → same tab → dialog shows only regular members (no admins)
3. Select multiple, click Remove → confirmation fires, members gone, page refreshes
4. Verify removed user can no longer access the group
5. Test EN and ES locales

---

## Validation Considerations (SonarCloud)
- Auth + authz in Server Action before any mutation
- ≥80% coverage on new code via test cases above
- No `any` types
- No hardcoded colors — MUI theme tokens only

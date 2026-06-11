# Story #471 Plan: Group Admins Can Remove Members from a Group

## Context

Group owners and admins currently have no way to remove a member who joined by mistake, is inactive, or should no longer be in the group. Members can only leave voluntarily. This story closes that gap by adding a "Members" admin tab with per-member remove controls, respecting a two-tier permission model (owner can remove admins and members; admins can only remove regular members).

## Acceptance Criteria (from issue)
- Members tab in group admin area lists all current members with their role
- Admins see Remove button next to each regular member
- Owner sees Remove button next to regular members AND admins
- Confirmation dialog before removal
- Removed user immediately loses access
- Owner cannot be removed
- Admins cannot remove other admins (only owner can)
- Works in EN and ES

---

## Technical Approach

### Existing infrastructure to reuse
- **`deleteParticipantFromGroup(groupId, userId)`** in `app/db/prode-group-repository.ts` — already works, used by `leaveGroupAction`
- **`leaveGroupAction`** in `app/actions/prode-group-actions.ts` — exact auth/DB pattern to follow
- **`promoteParticipantToAdmin` / `demoteParticipantFromAdmin`** — authorization check pattern (owner-only)
- **`GroupTournamentBettingAdmin`** component (`app/components/friend-groups/group-tournament-betting-admin.tsx`) — exact table + button + snackbar pattern to follow
- **`AdminSectionTabs`** (`app/components/friend-groups/admin-section-tabs.tsx`) — add 5th tab here
- The page already builds `members` with `is_admin` field; the type just needs to be updated to expose it

---

## Visual Prototype

### Members Tab Layout

```
┌────────────────────────────────────────────┐
│  ● Requests  🔒 Privacy  ♟ Betting         │
│  🎨 Customize  👥 Members                  │
├────────────────────────────────────────────┤
│  Group Members                             │
│                                            │
│  ┌──────────────┬──────────┬───────────┐   │
│  │ Name         │ Role     │ Actions   │   │
│  ├──────────────┼──────────┼───────────┤   │
│  │ Alice        │ Owner    │           │   │
│  ├──────────────┼──────────┼───────────┤   │
│  │ Bob          │ Admin    │ [Remove]* │   │
│  ├──────────────┼──────────┼───────────┤   │
│  │ Carol        │ Member   │ [Remove]  │   │
│  ├──────────────┼──────────┼───────────┤   │
│  │ David        │ Member   │ [Remove]  │   │
│  └──────────────┴──────────┴───────────┘   │
│  * Remove button on admin rows only        │
│    visible to group owner                  │
└────────────────────────────────────────────┘
```

### Confirmation Dialog

```
┌──────────────────────────────────────────┐
│  Remove Member                           │
│                                          │
│  Are you sure you want to remove Carol   │
│  from the group? This cannot be undone.  │
│                                          │
│                    [Cancel]  [Remove]    │
└──────────────────────────────────────────┘
```

**States:**
- Removing: "Remove" button shows loading spinner, disabled
- Success: Snackbar "Carol has been removed" (1000ms)
- Error: Snackbar with error message (6000ms); row remains in list

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `app/actions/prode-group-actions.ts` | Add `removeGroupMemberAction` server action |
| `app/components/friend-groups/group-members-admin.tsx` | **New** — member table with remove button + confirm dialog |
| `app/components/friend-groups/admin-section-tabs.tsx` | Add 5th "Members" tab; update Props type |
| `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` | Pass `ownerId` prop to AdminSectionTabs |
| `locales/en/groups.json` | Add `adminSectionTabs.members` and `members` namespace |
| `locales/es/groups.json` | Same for Spanish |
| `docs/code-structure/actions.md` | Add `removeGroupMemberAction` entry |
| `docs/code-structure/components/components-friend-groups.md` | Add `GroupMembersAdmin` entry; update `AdminSectionTabs` entry |

---

## Mid-Level Design

### Call Graph Changes

**Modified flows:**
- **Flow 13 (Friend group management)** — `AdminSectionTabs` now renders `GroupMembersAdmin` (5th tab), which calls `removeGroupMemberAction` → `deleteParticipantFromGroup`

**New flows:**
- None (extends existing Flow 13)

---

### `app/actions/prode-group-actions.ts` *(modified)*

**New functions:**

- **`removeGroupMemberAction(groupId: string, memberId: string): Promise<void>`**
  Server Action. Allows group owner or admin to remove a member from the group.
  Authorization rules:
  - Current user must be owner or admin of the group
  - Cannot remove the group owner (throw)
  - Admins cannot remove other admins (only owner can)
  Calls: `getLoggedInUser`, `findProdeGroupById`, `findParticipantsInGroup`, `deleteParticipantFromGroup`
  Tests:
  - throws when caller is not authenticated
  - throws when group does not exist
  - throws when caller is not admin or owner
  - throws when attempting to remove the group owner
  - throws when admin attempts to remove another admin
  - allows owner to remove an admin
  - allows owner to remove a regular member
  - allows admin to remove a regular member
  - calls deleteParticipantFromGroup with correct groupId and memberId

---

### `app/components/friend-groups/group-members-admin.tsx` *(new)*

**New component:**

- **`GroupMembersAdmin`** (default export, Client Component)
  Props: `{ groupId: string; members: { id: string; nombre: string; is_admin: boolean }[]; ownerId: string; isOwner: boolean; locale: Locale }`
  Renders a MUI Table with one row per member. Owner row has no action; admin rows show Remove only if `isOwner`; member rows always show Remove. Clicking Remove opens a MUI Dialog for confirmation. On confirm, calls `removeGroupMemberAction` and on success removes the row from local state; on error shows snackbar.
  Calls: `removeGroupMemberAction`
  Tests:
  - renders all members in the table
  - does not show Remove button for the owner row
  - shows Remove button for admin rows only when viewer is owner
  - does not show Remove button for admin rows when viewer is non-owner admin
  - shows Remove button for regular member rows for both owner and admin viewers
  - opens confirmation dialog on Remove click
  - calls removeGroupMemberAction with correct args on dialog confirm
  - removes member row from list on successful removal
  - closes dialog without removing member when user clicks Cancel
  - renders no Remove buttons when viewer is a regular member (non-admin)
  - shows error snackbar when removeGroupMemberAction throws
  - (all tests use `testFactories.user()` and `testFactories.prodeGroup()` for test data)

---

### `app/components/friend-groups/admin-section-tabs.tsx` *(modified)*

**Changed types:**

- `Props.members`: was `{ id: string; nombre: string }[]`, now `{ id: string; nombre: string; is_admin: boolean }[]`
- Add `Props.ownerId: string`
- `AdminSectionTabValue`: add `'members'` to union type

**UI changes:**
- Import `GroupMembersAdmin` and `PeopleIcon` from `@mui/icons-material`
- Add 5th Tab with `PeopleIcon` and `t('members')` label
- Add 5th TabPanel rendering `<GroupMembersAdmin>`

---

### `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` *(modified)*

**Changed calls:**
- Pass `ownerId={prodeGroup.owner_user_id}` to `AdminSectionTabs`

---

## Translation Keys

### `locales/en/groups.json` additions

```json
"adminSectionTabs": {
  // existing keys...
  "members": "Members"
},
"members": {
  "title": "Group Members",
  "tableHeaders": {
    "name": "Name",
    "role": "Role",
    "actions": "Actions"
  },
  "roles": {
    "owner": "Owner",
    "admin": "Admin",
    "member": "Member"
  },
  "removeButton": "Remove",
  "confirmDialog": {
    "title": "Remove Member",
    "message": "Are you sure you want to remove {name} from the group? This cannot be undone.",
    "confirm": "Remove",
    "cancel": "Cancel"
  },
  "feedback": {
    "removedSuccess": "{name} has been removed from the group",
    "removeError": "Failed to remove member"
  }
}
```

### `locales/es/groups.json` additions (Spanish equivalents)
```json
"adminSectionTabs": {
  // existing keys...
  "members": "Miembros"
},
"members": {
  "title": "Miembros del Grupo",
  "tableHeaders": {
    "name": "Nombre",
    "role": "Rol",
    "actions": "Acciones"
  },
  "roles": {
    "owner": "Dueño",
    "admin": "Admin",
    "member": "Miembro"
  },
  "removeButton": "Eliminar",
  "confirmDialog": {
    "title": "Eliminar Miembro",
    "message": "¿Estás seguro de que quieres eliminar a {name} del grupo? Esta acción no se puede deshacer.",
    "confirm": "Eliminar",
    "cancel": "Cancelar"
  },
  "feedback": {
    "removedSuccess": "{name} ha sido eliminado del grupo",
    "removeError": "Error al eliminar miembro"
  }
}
```

---

## Implementation Steps

1. **Server action** (`prode-group-actions.ts`): Add `removeGroupMemberAction` with auth/permission guards, calling `deleteParticipantFromGroup`
2. **New component** (`group-members-admin.tsx`): Build `GroupMembersAdmin` with table, confirm dialog, snackbar — following the `GroupTournamentBettingAdmin` pattern
3. **Update AdminSectionTabs**: Add Props (`ownerId`, updated `members` type), add "Members" tab + panel
4. **Update page**: Pass `ownerId` prop
5. **Translations**: Add keys to both `locales/en/groups.json` and `locales/es/groups.json`
6. **CODE-STRUCTURE updates**: Update `actions.md` and `components-friend-groups.md`

---

## Testing Strategy

### Unit Tests (new file: `__tests__/actions/prode-group-actions.remove-member.test.ts`)
- 9 test cases covering all auth/permission branches of `removeGroupMemberAction` (listed in Mid-Level Design)

### Component Tests (new file: `__tests__/components/friend-groups/group-members-admin.test.tsx`)
- 9 test cases covering render, permission display, dialog flow, success/error states (listed in Mid-Level Design)

### Manual verification
1. Log in as group owner → Members tab appears → can remove regular members and admins
2. Log in as group admin → Members tab appears → Remove button only on regular members, not on admins
3. Log in as regular member → Admin tab is hidden entirely
4. Confirm removal dialog shows member's name
5. After removal, the removed user cannot access the group
6. Test in both EN and ES locales

---

## Validation Considerations (SonarCloud)
- No new security issues: Server Action validates authentication + authorization before mutation
- Coverage: ≥80% on new code — covered by the 9 unit tests per new function/component
- No `any` types — use proper TypeScript types throughout
- No hardcoded colors — use MUI theme tokens only

# Story #345 Plan: Allow Non-Admins to Share Group Invite Link

## Story Context

- **GitHub Issue:** #345
- **Title:** [Story] Allow non-admins to share group invite link
- **Project:** UX Audit 2026
- **Branch:** feature/story-345
- **Worktree:** /Users/gvinokur/Personal/qatar-prode-story-345

## Objective

Allow all group members (not just owners/admins) to share the group invite link. Non-admins can copy the link, share via WhatsApp, and share the flier. Email invitations remain admin-only.

## Problem / Background

Currently only group owners see the "Invite More" button. Regular members must ask an admin for the link to invite friends. Since all new members still require admin approval to join, sharing the invite link itself is safe to open up to everyone.

## Acceptance Criteria

- [x] Any group member can see and click the "Invite More" button
- [x] Non-admin members: dialog shows only **Link** and **Flier** tabs
- [x] Admin members (owner + promoted admins): all 3 tabs visible (Link, Email, Flier)
- [x] Email tab explicitly hidden for non-admins
- [x] Non-admins can: copy link, share via WhatsApp, customize/download/share flier
- [x] Server action for emails continues to block non-admins (already enforced)
- [x] i18n: works in English and Argentine Spanish (no new keys needed)

## Technical Approach

**Three-layer change with no new server actions, no migrations, no i18n changes:**

1. **Dialog layer** — `InviteFriendsDialog` receives new optional `hideEmailTab` boolean prop. When true, Email tab is omitted; Flier becomes tab index 1 instead of 2.

2. **Button wrapper layer** — `InviteFriendsDialogButton` passes `hideEmailTab` through.

3. **Page layer** — Both group page variants change visibility condition from `isOwner` to `isMember`, passing `hideEmailTab={!isAdmin}`.

## Files to Create / Modify

| File | Change |
|------|--------|
| `app/components/invite-friends-dialog.tsx` | Add `hideEmailTab?: boolean` prop; conditionally render Email tab; adjust Flier tab index |
| `app/components/friend-groups/invite-friends-dialog-button.tsx` | Add `hideEmailTab?: boolean` prop; pass through to `InviteFriendsDialog` |
| `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` | Change `{isOwner && ...}` → `{isMember && ... hideEmailTab={!isAdmin}}` |
| `app/[locale]/friend-groups/[id]/page.tsx` | Compute `isOwner`/`isAdmin`/`isMember`; show invite button for all members; add `LeaveGroupButton` for non-owners separately |
| `app/components/__tests__/invite-friends-dialog.test.tsx` | Add `hideEmailTab` behavior tests |
| `docs/code-structure/components/components-friend-groups.md` | Update invite-friends-dialog and invite-friends-dialog-button entries |

## Visual Prototype

No new UI components. The only visible change is tab count in the dialog:

**Non-admin member (2 tabs):**
```
┌─────────────┬────────────┐
│    Enlace   │   Folleto  │
└─────────────┴────────────┘
```

**Admin/owner (3 tabs — unchanged):**
```
┌──────────┬─────────┬──────────┐
│  Enlace  │  Email  │ Folleto  │
└──────────┴─────────┴──────────┘
```

The "Invite More" button now appears for all members (previously owner-only). Non-owners also retain access to `LeaveGroupButton` via a separate section.

## Mid-Level Design

### Call Graph Changes

No call graph changes. This story adds a prop to an existing component and adjusts conditional rendering in two pages. No new cross-layer flows are introduced.

---

### `app/components/invite-friends-dialog.tsx` *(modified)*

**Changed interface:**

- **InviteFriendsDialogProps** — adds `hideEmailTab?: boolean` field.
  When `true`: Email tab is not rendered; Flier becomes tab index 1.
  When `false` or undefined: all 3 tabs rendered as before.

Key rendering changes:
```tsx
// Tabs
<Tab label={t('tabs.link')} />
{!hideEmailTab && <Tab label={t('tabs.email')} />}
<Tab label={t('tabs.flier')} />

// Content
{activeTab === 0 && (/* Link — unchanged */)}
{!hideEmailTab && activeTab === 1 && (<EmailInvitationsTab .../>)}
{activeTab === (hideEmailTab ? 1 : 2) && (/* Flier — unchanged */)}
```

Tests:
- renders 3 tabs (Link, Email, Flier) when `hideEmailTab` is false (default — regression)
- renders only 2 tabs (Link, Flier) when `hideEmailTab` is true
- Flier content visible at tab index 1 when `hideEmailTab` is true
- Email content not rendered when `hideEmailTab` is true

---

### `app/components/friend-groups/invite-friends-dialog-button.tsx` *(modified)*

**Changed signature:** adds `hideEmailTab?: boolean` parameter; passes it through to `InviteFriendsDialog`.

Tests: covered by invite-friends-dialog tests; no isolated unit test needed for the passthrough.

---

### `app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx` *(modified)*

`isMember` and `isAdmin` are already computed (lines 88–91). Only the JSX changes:

**Before (line 266–274):**
```tsx
{isOwner && (
  <InviteFriendsDialogButton ... />
)}
```

**After:**
```tsx
{isMember && (
  <InviteFriendsDialogButton
    groupName={prodeGroup.name}
    groupId={prodeGroup.id}
    tournamentId={tournament.id}
    groupLogoUrl={logoUrl ?? undefined}
    themeColor={prodeGroup.theme?.primary_color ?? undefined}
    hideEmailTab={!isAdmin}
  />
)}
```

---

### `app/[locale]/friend-groups/[id]/page.tsx` *(modified)*

**New variables** (insert after `participants` fetch, before `allParticipants`):
```typescript
const isOwner = prodeGroup.owner_user_id === user.id;
const participantRecord = participants.find((p: any) => p.user_id === user.id);
const isMember = isOwner || !!participantRecord;
const isAdmin = isOwner || !!participantRecord?.is_admin;
```

**Changed `action` prop** (was owner-or-leave ternary):
```tsx
action={
  isMember ? (
    <InviteFriendsDialogButton
      groupName={prodeGroup.name}
      groupId={prodeGroup.id}
      groupLogoUrl={logoUrl ?? undefined}
      themeColor={prodeGroup.theme?.primary_color ?? undefined}
      hideEmailTab={!isAdmin}
    />
  ) : undefined
}
```

**Existing `isAdmin` inline expression** (line 219) replaced with the new variable.

**Add leave button** (after the Grid content block, following tournament page pattern):
```tsx
{!isOwner && (
  <Grid size={12} sx={{ display: 'flex', justifyContent: 'flex-end', px: 2 }}>
    <LeaveGroupButton groupId={prodeGroup.id} />
  </Grid>
)}
```

---

## Testing Strategy

**Update** `app/components/__tests__/invite-friends-dialog.test.tsx`:
- Add test group for `hideEmailTab` prop:
  - `hideEmailTab=true` → only 2 tab labels rendered
  - `hideEmailTab=true` → clicking tab index 1 shows flier content
  - `hideEmailTab=false` (or undefined) → 3 tab labels rendered (regression guard)
  - `hideEmailTab=true` → email content not mounted

**No page-level unit tests** — Server Components are not directly unit-testable; acceptance criteria validated in Vercel Preview.

**Coverage:** Run `npm run test -- --coverage` on changed component files; confirm ≥80% on new code paths.

## Security

`sendGroupEmailInvitations` server action already enforces `isAdmin` server-side and throws `Forbidden` for non-admins. The tab hiding is UX-only — the hard enforcement is already in place. No security regression possible from this change.

## Out of Scope

- Unique referral links per user
- Allowing non-admins to send email invitations
- Bypassing admin approval for join requests

## Open Questions

None — requirements are fully specified in the story acceptance criteria.

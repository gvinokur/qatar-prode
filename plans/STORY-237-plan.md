# Plan: Add Personal Message to Group Join Requests (#237)

## Context

When a user requests to join a friend group, the admin only sees the requester's nickname/email. If the group was shared via a link or discovery, the admin may not recognize the person and is left with no context when deciding to approve or reject. This story adds an optional free-text personal message field (max 300 chars) so requesters can introduce themselves (e.g., "Hey, I'm your buddy from the gym!"). This improves the admin review experience and increases the likelihood of legitimate requests being approved quickly.

## Acceptance Criteria

- [ ] Join request form includes an optional textarea (max 300 chars) with character counter
- [ ] Message stored as nullable `message TEXT NULL` column in `prode_group_join_requests`
- [ ] Admin join request manager displays message (if present) below requester's name/email
- [ ] Admin notification email includes message (if present)
- [ ] Message is fully optional — requests without a message work unchanged
- [ ] i18n strings added for EN and ES
- [ ] Both join routes work: tournament-scoped and global

## Technical Approach

### Database

New migration file: `migrations/20260302_add_message_to_join_requests.sql`

```sql
ALTER TABLE prode_group_join_requests
ADD COLUMN message TEXT NULL,
ADD CONSTRAINT message_length_check
  CHECK (message IS NULL OR char_length(message) <= 300);
```

The check constraint uses `char_length()` (Unicode-aware character count) to enforce the 300-character limit at the DB level as a safety net. The limit is 300 characters regardless of byte size (emoji count as 1 character).

### TypeScript Types (`app/db/tables-definition.ts`)

Add to `ProdeGroupJoinRequestTable`:
```typescript
message?: string | null;
```

### Repository (`app/db/prode-group-join-request-repository.ts`)

1. **`createJoinRequest`** — add optional `message?: string` parameter, include in insert values.
2. **`findJoinRequestsByGroup`** — uses explicit `.select([...])` array. Must add `'prode_group_join_requests.message'` to the select list so it is returned to the admin view.

### Server Action (`app/actions/prode-group-join-request-actions.ts`)

1. Update `requestToJoinGroup(groupId, source, locale, tournamentId?, message?)` to accept optional message.
2. Add Zod validation: `z.string().max(300).optional().nullable()` — sanitize and trim whitespace.
3. Pass message to `createJoinRequest`.

### User Form (`app/components/friend-groups/join-request-form.tsx`)

Add below the "approvalRequired" info text and above the submit button:
- MUI `TextField` (multiline, rows=3), labeled with i18n key
- `inputProps={{ maxLength: 300 }}`
- `helperText={\`${message.length}/300\`}` for character counter
- State: `const [message, setMessage] = useState('')`
- Empty string handling: `const messageToSend = message.trim() === '' ? undefined : message.trim()` — empty textarea → `undefined` (not empty string)
- Pass `messageToSend` to `requestToJoinGroup` in submit handler

### Admin View (`app/components/friend-groups/join-request-manager.tsx`)

1. Update `JoinRequest` interface: add `message?: string | null`.
2. In the request card, below the source/date line, add a conditional block:
   ```
   {request.message && (
     <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: 'text.secondary' }}>
       "{request.message}"
     </Typography>
   )}
   ```
3. **No truncation needed** — at 300 chars max the message fits comfortably inline without breaking the list layout. Full message displayed directly.

### Email Template (`app/utils/email-templates.ts`)

1. Update `generateJoinRequestNotificationEmail` signature to accept optional `message?: string`.
2. In the HTML body, add a conditional paragraph after the request info:
   ```html
   ${message ? `<p style="..."><em>"${message}"</em></p>` : ''}
   ```
3. Update all callers in `prode-group-join-request-actions.ts` to pass the message.

### i18n

**Namespace `groups.joinRequest`** (form) — add to `locales/en/groups.json` and `locales/es/groups.json`:

EN:
```json
"messageLabel": "Personal message (optional)",
"messagePlaceholder": "Tell the group admin a bit about yourself..."
```
ES:
```json
"messageLabel": "Mensaje personal (opcional)",
"messagePlaceholder": "Cuéntale un poco sobre ti al administrador del grupo..."
```

**Namespace `groups.joinRequests`** (manager) — no new keys needed; message displayed inline.

**Namespace `emails.joinRequest.adminNotification`** — add to `locales/en/emails.json` and `locales/es/emails.json`:

EN:
```json
"personalMessage": "Personal message from {userName}:"
```
ES:
```json
"personalMessage": "Mensaje personal de {userName}:"
```

## Visual Prototype

### Join Request Form (with message textarea)

```
┌─────────────────────────────────────────────────────────────┐
│  [← Back]          Group Preview                            │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  🏆 [Group Name]                                      │  │
│  │  👥 23 members                                        │  │
│  │                                                       │  │
│  │  ℹ️  Admin approval is required to join this group.   │  │
│  │      Your request will be reviewed by admins.        │  │
│  │                                                       │  │
│  │  Personal message (optional)                          │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ Introduce yourself to the group admin...        │  │  │
│  │  │                                                 │  │  │
│  │  │                                                 │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                              0/300    │  │
│  │                                                       │  │
│  │                    [Request to Join Group]            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Admin Join Request Manager (with message)

```
┌─────────────────────────────────────────────────────────────┐
│  Join Requests                                              │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [N]  Nicholas Gym                                          │
│       nicholas@example.com · 2 hours ago · via invite link  │
│       "Hey, I'm your buddy Nicholas from the gym            │
│        at 62nd St!"                                         │
│                              [Approve]  [Reject]            │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  [J]  Jane Doe                                              │
│       jane@example.com · 1 day ago · via discovery          │
│                              [Approve]  [Reject]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Files to Create/Modify

| File | Action | Notes |
|------|--------|-------|
| `migrations/20260302_add_message_to_join_requests.sql` | **CREATE** | New migration |
| `app/db/tables-definition.ts` | **MODIFY** | Add `message?: string \| null` |
| `app/db/prode-group-join-request-repository.ts` | **MODIFY** | `createJoinRequest` + select query |
| `app/actions/prode-group-join-request-actions.ts` | **MODIFY** | `requestToJoinGroup` + email call |
| `app/components/friend-groups/join-request-form.tsx` | **MODIFY** | Add textarea + state |
| `app/components/friend-groups/join-request-manager.tsx` | **MODIFY** | Show message in card |
| `app/utils/email-templates.ts` | **MODIFY** | Add message param + HTML |
| `locales/en/groups.json` | **MODIFY** | Add `messageLabel`, `messagePlaceholder` |
| `locales/es/groups.json` | **MODIFY** | Add ES translations |
| `locales/en/emails.json` | **MODIFY** | Add `personalMessage` key |
| `locales/es/emails.json` | **MODIFY** | Add ES email key |

## Implementation Steps

1. **Create DB migration** — new SQL file, ask user permission before running
2. **Update types** — `tables-definition.ts`
3. **Update repository** — `createJoinRequest` param + `findJoinRequestsByGroup` select
4. **Update server action** — accept + validate + pass message, update email call
5. **Update form UI** — textarea with counter, pass message to action
6. **Update admin view** — show message in request card
7. **Update email template** — conditional message block
8. **Add i18n translations** — all 4 locale files (en/es × groups/emails)
9. **Update tests** — existing tests for repo, action, form, manager, email template

## Testing Strategy

### Unit Tests

**Repository (`__tests__/db/prode-group-join-request-repository.test.ts`)**
- `createJoinRequest` with message — message stored in DB
- `createJoinRequest` without message — inserts with `undefined`/null
- `createJoinRequest` with message at exactly 300 chars (boundary test)
- `findJoinRequestsByGroup` returns `message` column for requests with message
- `findJoinRequestsByGroup` returns `null` for requests without message

**Server Action (`__tests__/actions/prode-group-join-request-actions.test.ts`)**
- `requestToJoinGroup` with valid message passes it to repository
- `requestToJoinGroup` without message works unchanged (undefined passed)
- `requestToJoinGroup` with empty string `""` passes `undefined` to repository
- Message exactly 300 chars passes Zod validation
- Message 301 chars returns validation error

**Form Component (`__tests__/components/friend-groups/join-request-form.test.tsx`)**
- Textarea renders with placeholder text
- Character counter shows `0/300` initially
- Counter updates correctly on typing
- Message passed to `requestToJoinGroup` on submit
- Empty textarea → `requestToJoinGroup` called without message (undefined)
- No message → still submits successfully without error

**Admin View Component (`__tests__/components/friend-groups/join-request-manager.test.tsx`)**
- Message displayed in italics when present
- No message element rendered when `message` is null/undefined

**Email Template (`__tests__/utils/email-templates.test.ts` or similar)**
- Notification email HTML contains message paragraph when message provided
- Notification email HTML omits message paragraph when message is undefined/null

### Quality Gates
- 80% coverage on new/modified code (SonarCloud enforced)
- 0 new issues of any severity
- All existing tests must continue to pass

## Implementation Amendments

### Amendment 1: Discovery Join Flow Also Required Message Dialog
**Date:** 2026-03-02
**Reason:** The plan covered the invite-link flow (`join-request-form.tsx`) but omitted the discovery flow (`public-groups-browser.tsx`), which had a direct "Request to Join" button that bypassed the message field entirely. Discovered during post-implementation review.
**Change:** Added a MUI Dialog to `public-groups-browser.tsx`. Clicking "Request to Join" on the discover page now opens the dialog with the optional message textarea (same 300-char counter), a Cancel button, and a Confirm button that calls `requestToJoinGroup` with the message. 7 new tests added to `__tests__/components/friend-groups/public-groups-browser.test.tsx`. No new i18n keys needed — reuses `groups.joinRequest.messageLabel`, `messagePlaceholder`, `requestButton`, and `groups.join.buttons.cancel`.

**Additional file modified:**
- `app/components/friend-groups/public-groups-browser.tsx` — **MODIFY** — Add join dialog with message textarea

## Open Questions

None — acceptance criteria and scope are clearly defined. Migration will require explicit user approval before running.

## Out of Scope

- Displaying message in approval/rejection emails to the requester
- Editing message after submission
- Message moderation/filtering

# Story 415 — Parallelize Sequential Database Calls

## Context

Several server actions perform multiple independent database lookups sequentially — each `await` waits for the previous to finish before starting the next, even though the results don't depend on each other. This causes unnecessary latency for users on slower connections or in larger groups. The fix is to replace sequential awaits with `Promise.all()` where the calls are truly independent.

Three action files are in scope:
1. `app/actions/prode-group-join-request-actions.ts` — group join flow
2. `app/actions/group-tournament-betting-actions.ts` — betting config (friend group betting details)
3. `app/actions/prode-group-actions.ts` — email invitation flow

The group standings/rankings code (`group-ranking-actions.ts`) is already well-optimized with `Promise.all` — no changes needed there.

---

## Acceptance Criteria (from issue)

- Submitting a join request for a public group succeeds and shows the correct pending state
- The group standings page displays correct standings data (regression check)
- Sending email invitations completes without errors and recipients receive the email
- The friend group page loads correctly with betting config visible
- All existing tests pass

---

## Technical Approach

### No visual changes — backend-only optimization

The parallelization is transparent to callers. No signatures change. No UI changes. Tests exercise behavior (not execution order), so the mock-based tests remain valid after the change.

**Pattern used throughout this codebase (from `prode-group-actions.ts:50`):**
```typescript
const [a, b, c] = await Promise.all([fetchA(), fetchB(), fetchC()]);
```

---

## Files to Modify

| File | Functions Changed |
|------|-------------------|
| `app/actions/prode-group-join-request-actions.ts` | `requestToJoinGroup`, `getGroupJoinRequests`, `approveJoinRequestAction`, `rejectJoinRequestAction`, `getPendingRequestCount` |
| `app/actions/group-tournament-betting-actions.ts` | `setGroupTournamentBettingConfigAction`, `setUserGroupTournamentBettingPaymentAction` |
| `app/actions/prode-group-actions.ts` | `sendGroupEmailInvitations` |
| `docs/code-structure/actions.md` | Update `Calls:` descriptions for all changed functions |

**Test files to update/create:**
- `__tests__/actions/prode-group-join-request-actions.test.ts` — verify existing tests still pass; no structural changes needed since mocks return resolved values regardless of order
- `__tests__/actions/group-tournament-betting-actions.test.ts` — **create new** (no existing test file)

---

## Detailed Changes

### 1. `prode-group-join-request-actions.ts`

**`requestToJoinGroup`** — parallelize the three checks that happen after the owner check:

```typescript
// BEFORE (lines 55, 62, 68 — 3 sequential round trips):
const participants = await findParticipantsInGroup(groupId);
...
const existingPendingRequest = await findPendingJoinRequest(groupId, user.id);
...
const recentRejection = await findRecentRejectedRequest(groupId, user.id);

// AFTER (1 round trip for all three):
const [participants, existingPendingRequest, recentRejection] = await Promise.all([
  findParticipantsInGroup(groupId),
  findPendingJoinRequest(groupId, user.id),
  findRecentRejectedRequest(groupId, user.id),
]);
```

Note: `findProdeGroupById` stays sequential first — it's needed to check the owner before fetching the rest.

**`getGroupJoinRequests`** — parallelize participants + both request lists after group fetch:

```typescript
// AFTER (1 round trip for all three):
const [groupParticipants, pendingRequests, rejectedRequests] = await Promise.all([
  findParticipantsInGroup(groupId),
  findJoinRequestsByGroup(groupId, 'pending'),
  findJoinRequestsByGroup(groupId, 'rejected'),
]);
```

Admin check happens after, using `groupParticipants` result.

**`approveJoinRequestAction`**, **`rejectJoinRequestAction`**, **`getPendingRequestCount`** — same two-call pattern:

```typescript
// AFTER:
const [group, groupParticipants] = await Promise.all([
  findProdeGroupById(groupId),
  findParticipantsInGroup(groupId),
]);
```

### 2. `group-tournament-betting-actions.ts`

**`setGroupTournamentBettingConfigAction`** — parallelize all 5 independent initial fetches:

```typescript
// BEFORE (5 sequential round trips):
const t = await getTranslations({ locale, namespace: 'groups' });
const tErrors = await getTranslations({ locale, namespace: 'errors' });
const user = await getLoggedInUser();
if (!user) throw new Error(tErrors('notAuthenticated'));
const group = await findProdeGroupById(groupId);
const groupParticipants = await findParticipantsInGroup(groupId);

// AFTER (1 round trip for all 5):
const [t, tErrors, user, group, groupParticipants] = await Promise.all([
  getTranslations({ locale, namespace: 'groups' }),
  getTranslations({ locale, namespace: 'errors' }),
  getLoggedInUser(),
  findProdeGroupById(groupId),
  findParticipantsInGroup(groupId),
]);
if (!user) throw new Error(tErrors('notAuthenticated'));
```

Note: Auth check happens after Promise.all resolves. DB calls start before auth is confirmed — this is acceptable because the action is invoked via server action (already requires network call) and the data is discarded if auth fails.

**`setUserGroupTournamentBettingPaymentAction`** — same 5-call pattern.

### 3. `prode-group-actions.ts`

**`sendGroupEmailInvitations`** — parallelize group + participants fetch:

```typescript
// BEFORE (2 sequential round trips):
const group = await findProdeGroupById(groupId);
if (!group) throw new Error('Group not found');
const participants = await findParticipantsInGroup(groupId);

// AFTER (1 round trip):
const [group, participants] = await Promise.all([
  findProdeGroupById(groupId),
  findParticipantsInGroup(groupId),
]);
if (!group) throw new Error('Group not found');
```

`generateShortUrlForGroup` + `buildShortUrl` remain sequential (line 388–389) because `buildShortUrl` depends on `shortUrlResult.code` from the first call.

---

## Mid-Level Design

### Call Graph Changes

No call graph changes. The same functions are called — only their execution order changes from sequential to parallel within each action.

### `app/actions/prode-group-join-request-actions.ts` *(modified)*

**Changed functions (internal parallelization only — signatures unchanged):**

- **requestToJoinGroup(groupId, source, locale, tournamentId?, message?)**: `Promise<{ success: true; message: string }>`
  Now resolves `findParticipantsInGroup`, `findPendingJoinRequest`, `findRecentRejectedRequest` in a single `Promise.all` after the owner check. All validation logic unchanged.
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, findPendingJoinRequest, findRecentRejectedRequest, createJoinRequest, findUsersByIds, generateJoinRequestNotificationEmail, sendEmail
  Tests:
  - throws if user is not logged in
  - throws if group is not found
  - throws if user is the group owner
  - throws if user is already a member (participants result includes user)
  - throws if user already has a pending request (pending request found)
  - throws with eligible date when rejection cooldown is active
  - does NOT throw when rejection cooldown has already expired
  - succeeds and creates the join request

- **getGroupJoinRequests(groupId)**: `Promise<JoinRequest[]>`
  Now resolves `findParticipantsInGroup`, `findJoinRequestsByGroup(pending)`, `findJoinRequestsByGroup(rejected)` in a single `Promise.all` after group fetch. Admin check uses the resolved participants.
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, findJoinRequestsByGroup
  Tests:
  - throws if user not logged in
  - throws if group not found
  - throws if user is not admin or owner
  - returns combined pending + recent rejected requests for admin

- **approveJoinRequestAction(requestId, groupId, tournamentId?)**: `Promise<{ success: boolean; message: string; analyticsEvent? }>`
  Now resolves `findProdeGroupById` and `findParticipantsInGroup` in a single `Promise.all`.
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, approveJoinRequestRepo, findUsersByIds, generateJoinRequestApprovedEmail, sendEmail, revalidatePath
  Tests:
  - throws if user not logged in
  - throws if group not found
  - throws if user is not admin or owner
  - returns success with analytics event payload

- **rejectJoinRequestAction(requestId, groupId)**: `Promise<{ success: true; message: string }>`
  Same parallel pattern as approve.
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, rejectJoinRequestRepo, findUsersByIds, generateJoinRequestRejectedEmail, sendEmail, revalidatePath
  Tests:
  - throws if user not logged in
  - throws if group not found
  - throws if user is not admin or owner
  - returns success and sends rejection email

- **getPendingRequestCount(groupId)**: `Promise<number>`
  Same parallel pattern as approve.
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, countPendingRequestsRepo
  Tests:
  - returns 0 if user not logged in
  - returns 0 if group not found
  - returns 0 if user is not admin or owner
  - returns pending count for admins

### `app/actions/group-tournament-betting-actions.ts` *(modified)*

**Changed functions:**

- **setGroupTournamentBettingConfigAction(groupId, tournamentId, config, locale)**: `Promise<ProdeGroupTournamentBetting>`
  All 5 initial fetches (`getTranslations` ×2, `getLoggedInUser`, `findProdeGroupById`, `findParticipantsInGroup`) now run in a single `Promise.all`. Auth check happens after Promise.all resolves.
  Calls: getTranslations, getLoggedInUser, findProdeGroupById, findParticipantsInGroup, getGroupTournamentBettingConfig, updateGroupTournamentBettingConfig, createGroupTournamentBettingConfig
  Tests:
  - throws if user not authenticated
  - throws if group not found or user is not owner/admin
  - creates new config when none exists
  - updates existing config when one exists

- **setUserGroupTournamentBettingPaymentAction(groupTournamentBettingId, userId, hasPaid, groupId, locale)**: `Promise<ProdeGroupTournamentBettingPayment>`
  Same parallel pattern.
  Calls: getTranslations, getLoggedInUser, findProdeGroupById, findParticipantsInGroup, setUserGroupTournamentBettingPayment
  Tests:
  - throws if user not authenticated
  - throws if group not found or user is not owner/admin
  - sets payment status for valid admin

### `app/actions/prode-group-actions.ts` *(modified)*

**Changed functions:**

- **sendGroupEmailInvitations(groupId, recipients, customMessage, locale, groupLogoUrl?, themeColor?)**: `Promise<{sent: number; failed: string[]}>`
  `findProdeGroupById` and `findParticipantsInGroup` now run in a single `Promise.all`. `generateShortUrlForGroup` + `buildShortUrl` remain sequential.
  Calls: getLoggedInUser, findProdeGroupById, findParticipantsInGroup, generateShortUrlForGroup, buildShortUrl, generateGroupInvitationEmail, sendEmail
  Tests:
  - throws if user not logged in
  - throws if group not found
  - throws if user is not admin or owner
  - returns { sent, failed } counts

---

## Testing Strategy

### Existing tests — no changes needed

`__tests__/actions/prode-group-join-request-actions.test.ts` uses `vi.mock` for all dependencies. Since mocks return resolved values synchronously (via `mockResolvedValue`), the parallelization change does not affect test outcomes. All existing tests should pass without modification.

### New test file for betting actions

Create `__tests__/actions/group-tournament-betting-actions.test.ts`, following the exact same mocking pattern as the existing `prode-group-join-request-actions.test.ts`:

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { testFactories } from '../db/test-factories'; // use testFactories for mock data

vi.mock('../../auth', () => ({ auth: vi.fn() }));
vi.mock('@/app/actions/user-actions', () => ({ getLoggedInUser: vi.fn() }));
vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn().mockResolvedValue((key: string) => key),
}));
vi.mock('@/app/db/prode-group-repository', () => ({
  findProdeGroupById: vi.fn(),
  findParticipantsInGroup: vi.fn(),
  getGroupTournamentBettingConfig: vi.fn(),
  createGroupTournamentBettingConfig: vi.fn(),
  updateGroupTournamentBettingConfig: vi.fn(),
  setUserGroupTournamentBettingPayment: vi.fn(),
}));
```

All mock data uses `testFactories.prodeGroup(...)`, `testFactories.user(...)` — consistent with project convention. Tests cover: auth check, owner/admin authorization, create-vs-update branching, payment status update.

---

## Verification

```bash
# 1. Run tests (must all pass)
npm run test

# 2. Run linter
npm run lint

# 3. Run build
npm run build

# 4. Manual smoke test on Vercel Preview:
#    - Join a public group → should succeed with pending state
#    - Open friend group page → betting config should appear
#    - Send email invitation from group admin → should succeed
#    - Open group leaderboard → standings should display correctly
```

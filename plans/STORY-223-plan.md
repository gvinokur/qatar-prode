# Implementation Plan: Story #223 - Unified Join Request System for All Groups

## Context

Currently, friend groups use an auto-join flow where anyone with an invite link can immediately join a group without approval. This creates several issues:
- No control over who joins groups
- No notification when someone joins
- Private groups aren't truly private
- Admins have no way to review or reject join requests

This story replaces the auto-join behavior with a request/approval workflow for ALL friend groups (both public and private). This is the foundation ticket for the friend groups discovery and invitation system.

**User Problem:** Group admins want control over who joins their groups and want to be notified when someone requests to join.

**Intended Outcome:**
- Users must request to join groups (no auto-join)
- Admins receive email notifications and can approve/reject requests
- Users can track their pending requests and receive email updates
- Admin interface is reorganized with dedicated "Admin" tab separate from competitive features

## Technical Approach

### 1. Database Layer

**New Table: `prode_group_join_requests`**

```sql
CREATE TABLE prode_group_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES prode_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  request_source VARCHAR(50) NOT NULL CHECK (request_source IN ('discovery', 'invite_link', 'email_invite')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_user_id UUID REFERENCES users(id),

  CONSTRAINT unique_pending_request UNIQUE (group_id, user_id)
    WHERE status = 'pending'
);

CREATE INDEX idx_join_requests_group_status ON prode_group_join_requests(group_id, status);
CREATE INDEX idx_join_requests_user_status ON prode_group_join_requests(user_id, status);
CREATE INDEX idx_join_requests_status_created ON prode_group_join_requests(status, requested_at DESC);
```

**Key Design Decisions:**
- **Partial unique constraint** prevents duplicate pending requests while allowing historical records (users can have multiple approved/rejected requests over time, but only ONE pending request at a time)
- **Cascade delete** ensures orphaned requests are cleaned up when groups or users are deleted (chosen for simplicity over soft deletes; audit trail preserved in approved/rejected records)
- `request_source` tracks how user found the group (for analytics and future discovery feature)
- `resolved_by_user_id` tracks which admin approved/rejected for audit trail
- **Important:** Application-level validation MUST check BOTH `findPendingJoinRequest()` AND verify user not already in `prode_group_participants` before allowing request creation

### 2. Repository Layer

**New File: `app/db/prode-group-join-request-repository.ts`**

Following existing repository patterns (see `prode-group-repository.ts`), create base CRUD functions using Kysely ORM:

```typescript
// Create request
createJoinRequest(groupId, userId, source)
  - Inserts pending request
  - Uses .returningAll().executeTakeFirstOrThrow()

// Find requests by group (for admins)
findJoinRequestsByGroup(groupId, status?)
  - LEFT JOIN with users table to get profile data (name, avatar)
  - Returns: request ID, user profile, requested_at, source, status
  - Orders by requested_at DESC

// Find requests by user (for user's pending requests sidebar)
findJoinRequestsByUser(userId, status?)
  - LEFT JOIN with prode_groups to get group basic info
  - Returns: request ID, group name/description, member count, requested_at, status
  - Orders by requested_at DESC

// Find specific request
findPendingJoinRequest(groupId, userId)
  - Returns single pending request or undefined
  - Used to check if request already exists

// Find recent rejected request (for cooldown check)
findRecentRejectedRequest(groupId, userId)
  - Returns rejected request within last 7 days or undefined
  - Query: WHERE status = 'rejected' AND resolved_at > NOW() - INTERVAL '7 days'
  - Used to enforce 7-day rejection cooldown

// Approve request (marks approved + adds to group)
approveJoinRequest(requestId, resolvedByUserId)
  - Uses Kysely transaction to ensure atomicity
  - Transaction structure:
    ```typescript
    return db.transaction(async (trx) => {
      // 1. Update request status
      const request = await trx
        .updateTable('prode_group_join_requests')
        .set({
          status: 'approved',
          resolved_at: new Date(),
          resolved_by_user_id: resolvedByUserId
        })
        .where('id', '=', requestId)
        .returningAll()
        .executeTakeFirstOrThrow()

      // 2. Add user to group (must use trx, not db)
      await trx.insertInto('prode_group_participants')
        .values({
          prode_group_id: request.group_id,
          participant_id: request.user_id,
          is_admin: false
        })
        .execute()

      return request
    })
    ```
  - If either step fails, entire transaction rolls back
  - Returns approved request object

// Reject request
rejectJoinRequest(requestId, resolvedByUserId)
  - Updates status to 'rejected', sets resolved_at and resolved_by_user_id

// Cancel request (user cancels own request)
cancelJoinRequest(requestId, userId)
  - Deletes request (soft delete alternative: update status to 'canceled')
  - Validates request belongs to user

// Count pending requests (for notification badge)
countPendingRequestsForGroup(groupId)
  - Returns number for badge display
```

### 3. Server Actions Layer

**New File: `app/actions/prode-group-join-request-actions.ts`**

Following existing patterns (see `prode-group-actions.ts`), create server actions with proper authorization:

```typescript
// 1. Request to join group
requestToJoinGroup(groupId, source = 'invite_link')
  - Auth: Requires authenticated user
  - Validation (in order):
    * Group exists
    * User is not the owner
    * User not already member (check prode_group_participants table)
    * No pending request exists (check findPendingJoinRequest)
    * No recent rejection with active cooldown (check findRecentRejectedRequest)
      - Calculate: nextEligibleDate = rejectedRequest.resolved_at + 7 days
      - If before nextEligibleDate, throw error: "You can request again on {nextEligibleDate}"
  - Create request with status 'pending'
  - Send email to all admins + owner (async, non-blocking, one email per admin)
  - Return success message

// 2. Get user's join requests (for sidebar)
getUserJoinRequests()
  - Auth: Requires authenticated user
  - Returns user's requests with group details
  - Include pending and recent resolved (last 30 days)

// 3. Get group's join requests (for admin)
getGroupJoinRequests(groupId)
  - Auth: Requires owner OR admin of group
  - Permission check: Same pattern as setGroupTournamentBettingConfigAction
  - Returns pending requests with user profiles

// 4. Approve join request
approveJoinRequest(requestId, groupId)
  - Auth: Requires owner OR admin of group
  - Call repository approveJoinRequest()
  - Send approval email to user (async)
  - Revalidate group page
  - Return success message

// 5. Reject join request
rejectJoinRequest(requestId, groupId)
  - Auth: Requires owner OR admin of group
  - Call repository rejectJoinRequest()
  - Send rejection email to user (async)
  - Revalidate group page
  - Return success message

// 6. Cancel join request
cancelJoinRequest(requestId)
  - Auth: Request must belong to current user
  - Delete request
  - Return success message

// 7. Get pending request count (for badge)
getPendingRequestCount(groupId)
  - Auth: Requires owner OR admin
  - Returns count for notification badge
```

**Update File: `app/actions/prode-group-actions.ts`**
- Remove or deprecate `joinGroup()` action (no longer used)
- All joining now goes through request flow

### 4. Email Templates Layer

**Update File: `app/utils/email-templates.ts`**

Add three new email generator functions following existing patterns:

```typescript
// 1. Admin notification when request created
generateJoinRequestNotificationEmail(
  adminEmail,        // Individual admin's email
  adminName,         // Individual admin's name from user profile
  requesterName,     // Requester's name from user profile
  groupName,         // Group name
  requestedDate,     // Formatted date: new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(requestedAt)
  groupUrl,          // Full URL with ?tab=admin
  locale
)
  - Subject: t('joinRequest.adminNotification.subject', { groupName })
  - Content: User info, formatted request date, link to admin panel
  - Link: ${NEXT_PUBLIC_APP_URL}/tournaments/${tournamentId}/friend-groups/${groupId}?tab=admin
  - Returns: { to, subject, html }

  - Implementation Note: Send INDIVIDUAL email to each admin/owner
    * Fetch all admins + owner from group
    * Loop through each admin
    * Send personalized email with their name
    * Non-blocking (fire and forget - don't await completion)

// 2. User notification when approved
generateJoinRequestApprovedEmail(
  userEmail, groupName, groupUrl, locale
)
  - Subject: "You've been accepted to [Group Name]!"
  - Content: Congrats message, link to group
  - Link: /tournaments/[id]/friend-groups/[group_id]
  - Returns: { to, subject, html }

// 3. User notification when rejected
generateJoinRequestRejectedEmail(
  userEmail, groupName, locale
)
  - Subject: "Your request to join [Group Name] was not approved"
  - Content: Polite rejection message, cooldown info (7 days)
  - No link needed
  - Returns: { to, subject, html }
```

**Add i18n Keys:**

**Files to update:**
- `locales/en/emails.json`
- `locales/es/emails.json`

```json
{
  "joinRequest": {
    "adminNotification": {
      "subject": "New join request for {groupName}",
      "title": "New Join Request",
      "greeting": "Hi {adminName},",
      "message": "{userName} has requested to join your friend group \"{groupName}\".",
      "requestedOn": "Requested on: {date}",
      "viewButton": "View Request",
      "signature": "Qatar Prode Team"
    },
    "userApproved": {
      "subject": "You've been accepted to {groupName}!",
      "title": "Request Approved",
      "greeting": "Great news, {userName}!",
      "message": "Your request to join \"{groupName}\" has been approved.",
      "viewButton": "View Group",
      "signature": "Qatar Prode Team"
    },
    "userRejected": {
      "subject": "Your request to join {groupName} was not approved",
      "title": "Request Not Approved",
      "greeting": "Hi {userName},",
      "message": "Unfortunately, your request to join \"{groupName}\" was not approved at this time.",
      "cooldown": "You can request to join again in 7 days if you'd like.",
      "signature": "Thanks for your interest!"
    }
  }
}
```

### 5. UI Components Layer

#### 5.1 New Components

**`app/components/friend-groups/join-request-manager.tsx`** (Client Component)

Admin view of pending requests in Admin tab.

```typescript
Props: {
  groupId: string
  initialRequests: JoinRequest[] // From server
}

Features:
- List of pending requests with user avatars, names, request date
- Approve/Reject buttons per request
- Loading states during actions
- Empty state: "No pending requests"
- Optimistic UI updates
- Snackbar feedback
```

**`app/components/friend-groups/pending-request-view.tsx`** (Client Component)

Read-only view for users with pending requests.

```typescript
Props: {
  group: ProdeGroup (basic info only)
  requestId: string
  requestedAt: Date
}

Features:
- "Request Pending" banner at top
- Group name, description, member count
- Cancel Request button
- No scores/leaderboard shown
- Uses existing Card/CardHeader components
```

**`app/components/friend-groups/pending-requests-card.tsx`** (Client Component)

Sidebar card showing user's pending requests.

```typescript
Props: {
  requests: UserJoinRequest[] // From getUserJoinRequests()
}

Features:
- Shows group name, request date, status badge
- Cancel button per request
- Empty state when no requests
- Material-UI Card with CardContent pattern
```

**`app/components/friend-groups/admin-tabs.tsx`** (Client Component)

Tab container with "Leaderboard" and "Admin" tabs.

```typescript
Props: {
  isAdmin: boolean
  leaderboardContent: React.ReactNode
  adminContent: React.ReactNode
  defaultTab?: 'leaderboard' | 'admin'  // Set by server based on URL query param
}

Features:
- Uses TabContext, TabList, TabPanel from @mui/lab (existing pattern)
- URL query param support: ?tab=admin
  * Read from useSearchParams() on mount
  * If ?tab=admin AND isAdmin=true → show Admin tab
  * If ?tab=admin AND isAdmin=false → ignore, show Leaderboard tab
  * Update URL when user switches tabs (useRouter.replace())
- Admin tab only visible when isAdmin=true
  * TabList shows both tabs if isAdmin=true
  * TabList shows only Leaderboard if isAdmin=false
- Tab state persists in URL (no localStorage needed)
```

#### 5.2 Updated Components

**Update: `app/[locale]/friend-groups/join/[id]/page.tsx`**

Replace auto-join with request flow (Server Component):

```typescript
Current flow:
  User visits → Check if member → Call joinGroup() → Redirect

New flow:
  User visits → Check if member (redirect if yes)
              → Check if pending request (show PendingRequestView)
              → Otherwise show preview + "Request to Join" button
              → Handle request submission
              → Show confirmation message
```

**Update: `app/[locale]/tournaments/[tournament_id]/friend-groups/[group_id]/page.tsx`**

Add admin tabs and request access check:

```typescript
Current structure:
  - Header
  - ProdeGroupTable (leaderboard)
  - ProdeGroupThemer (sidebar, admin only)

New structure:
  - Header
  - Check user access:
    * Pending request → PendingRequestView (limited)
    * Not member → Redirect to join page
    * Member → Show AdminTabs below

  - AdminTabs component:
    Tab 1: "Leaderboard" (all members)
      - Tournament tabs (existing)
      - ProdeGroupTable (existing)

    Tab 2: "Admin" (owner/admin only)
      - Section 1: Join Requests (JoinRequestManager)
      - Section 2: Group Settings
        * LeaveGroupButton
        * SendNotificationButton
      - Section 3: Betting (GroupTournamentBettingAdmin)
      - Section 4: Theme (ProdeGroupThemer)
```

**Update: `app/[locale]/tournaments/[tournament_id]/friend-groups/page.tsx`**

Add pending requests card to sidebar:

```typescript
Current sidebar:
  - Create Group card
  - List of user's groups

New sidebar:
  - Create Group card
  - Pending Requests card (new - PendingRequestsCard)
  - List of user's groups
```

**Update: `app/components/friend-groups/friends-group-table.tsx`**

Add notification badge for pending requests (if admin):

**NOTE:** `friends-group-table.tsx` is a Client Component, so it cannot call Server Actions directly in render.

**Implementation:**
- Parent Server Component fetches `pendingCount` using `getPendingRequestCount(groupId)`
- Passes `pendingCount` as prop to `ProdeGroupTable`
- Client Component renders badge if `isAdmin && pendingCount > 0`

```typescript
// New prop
Props: {
  // ... existing props
  pendingRequestCount?: number  // Optional, only provided if isAdmin
}

// In CardHeader
title: (
  <Box display="flex" alignItems="center">
    {t('title')}
    {isAdmin && pendingRequestCount > 0 && (
      <Chip label={pendingRequestCount} color="error" size="small" sx={{ ml: 1 }} />
    )}
  </Box>
)
```

### 6. Route Updates

**Tournament-scoped join page:** `/tournaments/[tournament_id]/friend-groups/join/[group_id]/page.tsx`

**Note:** The existing join page is NOT tournament-scoped. We need to:
1. Create tournament-scoped version (recommended for consistency)
2. Or update existing `/friend-groups/join/[id]/page.tsx` to work with tournament context

**Recommendation:** Create tournament-scoped route for consistency with rest of friend groups UI.

## Visual Prototypes

### 1. Join Request Page (User Perspective)

```
┌─────────────────────────────────────────────────┐
│  Qatar Prode > Tournaments > Friend Groups      │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  [Group Logo]  Group Name                  │ │
│  │                                             │ │
│  │  Description: This is a friend group for   │ │
│  │  tracking predictions in the tournament.   │ │
│  │                                             │ │
│  │  Members: 12                                │ │
│  │  Owner: John Doe                           │ │
│  │                                             │ │
│  │  ┌──────────────────────────────────────┐  │ │
│  │  │                                       │  │ │
│  │  │     [Request to Join Group]          │  │ │
│  │  │                                       │  │ │
│  │  └──────────────────────────────────────┘  │ │
│  │                                             │ │
│  │  ℹ️ Admin approval required                │ │
│  └────────────────────────────────────────────┘ │
│                                                  │
└─────────────────────────────────────────────────┘
```

**States:**
- **Not member, no request:** Shows preview + "Request to Join" button
- **Pending request:** Shows preview + "Request Pending" banner + "Cancel Request" button
- **Already member:** Redirect to group page

### 2. Pending Request View (User with Pending Request)

```
┌─────────────────────────────────────────────────┐
│  ⏳ Request Pending                              │
│  Your request to join this group is pending     │
│  admin approval.                                 │
├─────────────────────────────────────────────────┤
│                                                  │
│  Group Name: My Friend Group                    │
│  Members: 12                                     │
│  Owner: John Doe                                │
│                                                  │
│  Description: This is a friend group for        │
│  tracking predictions.                           │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │      [Cancel Request]                     │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ❌ Leaderboard, scores, and betting info       │
│     are hidden until request is approved         │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 3. Admin Tabs (Group Detail Page)

```
┌─────────────────────────────────────────────────┐
│  [Logo] My Friend Group                [Invite] │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────┬──────────────┐                │
│  │ Leaderboard  │    Admin     │                │
│  └──────────────┴──────────────┘                │
│  ┌─────────────────────────────────────────────┐│
│  │                                              ││
│  │  🏆 Tournament Tabs (Copa America, etc.)    ││
│  │                                              ││
│  │  ┌──────────────────────────────────────┐   ││
│  │  │  Pos  User         Points   Breakdown │   ││
│  │  ├──────────────────────────────────────┤   ││
│  │  │  1    Alice Smith   245     [+12]    │   ││
│  │  │  2    Bob Jones     198     [+8]     │   ││
│  │  │  3    You          185     [+15]    │   ││
│  │  └──────────────────────────────────────┘   ││
│  │                                              ││
│  └─────────────────────────────────────────────┘│
│                                                  │
└─────────────────────────────────────────────────┘
```

**Admin Tab Content:**

```
┌─────────────────────────────────────────────────┐
│  ┌──────────────┬──────────────┐                │
│  │ Leaderboard  │  ▶ Admin     │                │
│  └──────────────┴──────────────┘                │
│  ┌─────────────────────────────────────────────┐│
│  │  📋 Join Requests                            ││
│  │  ┌──────────────────────────────────────┐   ││
│  │  │  [👤] Jane Doe                        │   ││
│  │  │  Requested: 2 hours ago               │   ││
│  │  │  Source: via invite link              │   ││
│  │  │                                        │   ││
│  │  │  [Approve]  [Reject]                  │   ││
│  │  ├──────────────────────────────────────┤   ││
│  │  │  [👤] Mike Smith                      │   ││
│  │  │  Requested: 1 day ago                 │   ││
│  │  │  Source: via invite link              │   ││
│  │  │                                        │   ││
│  │  │  [Approve]  [Reject]                  │   ││
│  │  └──────────────────────────────────────┘   ││
│  │                                              ││
│  │  ⚙️ Group Settings                           ││
│  │  [Leave Group]  [Delete Group (Owner)]      ││
│  │  [Send Notification]                        ││
│  │                                              ││
│  │  💰 Betting Configuration                    ││
│  │  [Betting Admin Component]                  ││
│  │                                              ││
│  │  🎨 Theme Customization                      ││
│  │  [Theme Customizer Component]               ││
│  │                                              ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### 4. Pending Requests Sidebar Card

```
┌────────────────────────────────────┐
│  📨 My Pending Requests            │
├────────────────────────────────────┤
│                                     │
│  ┌──────────────────────────────┐  │
│  │  My Friend Group              │  │
│  │  Requested: 2 hours ago       │  │
│  │  Status: [🟡 Pending]         │  │
│  │  [Cancel Request]            │  │
│  └──────────────────────────────┘  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Another Group                │  │
│  │  Requested: Yesterday         │  │
│  │  Status: [🔴 Rejected]        │  │
│  │  Can request again: Jan 15    │  │
│  └──────────────────────────────┘  │
│                                     │
└────────────────────────────────────┘
```

**Empty State:**
```
┌────────────────────────────────────┐
│  📨 My Pending Requests            │
├────────────────────────────────────┤
│                                     │
│       No pending requests           │
│                                     │
└────────────────────────────────────┘
```

### 5. Admin Tab - Detailed Layout

**Desktop View (Full Layout):**

```
┌─────────────────────────────────────────────────┐
│  ┌──────────────┬──────────────┐                │
│  │ Leaderboard  │  ▶ Admin     │                │
│  └──────────────┴──────────────┘                │
│  ┌─────────────────────────────────────────────┐│
│  │                                              ││
│  │  📋 Join Requests                            ││
│  │  ┌──────────────────────────────────────┐   ││
│  │  │  ┌────┐                               │   ││
│  │  │  │ 👤 │ Jane Doe                      │   ││
│  │  │  └────┘ Requested: 2 hours ago        │   ││
│  │  │         Source: via invite link       │   ││
│  │  │                                        │   ││
│  │  │  [Approve]  [Reject]                  │   ││
│  │  ├──────────────────────────────────────┤   ││
│  │  │  ┌────┐                               │   ││
│  │  │  │ 👤 │ Mike Smith                    │   ││
│  │  │  └────┘ Requested: 1 day ago          │   ││
│  │  │         Source: via invite link       │   ││
│  │  │                                        │   ││
│  │  │  [Approve]  [Reject]                  │   ││
│  │  └──────────────────────────────────────┘   ││
│  │                                              ││
│  │  ⚙️ Group Settings                           ││
│  │  ┌──────────────────────────────────────┐   ││
│  │  │  [Leave Group]                        │   ││
│  │  │  [Delete Group] (Owner Only)          │   ││
│  │  │  [Send Notification]                  │   ││
│  │  └──────────────────────────────────────┘   ││
│  │                                              ││
│  │  💰 Betting Configuration                    ││
│  │  ┌──────────────────────────────────────┐   ││
│  │  │  [Existing GroupTournamentBetting     │   ││
│  │  │   Admin Component - unchanged]        │   ││
│  │  └──────────────────────────────────────┘   ││
│  │                                              ││
│  │  🎨 Theme Customization                      ││
│  │  ┌──────────────────────────────────────┐   ││
│  │  │  [Existing ProdeGroupThemer           │   ││
│  │  │   Component - unchanged]              │   ││
│  │  └──────────────────────────────────────┘   ││
│  │                                              ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

**Mobile View (Stacked Tabs):**

```
┌──────────────────────────────┐
│  Leaderboard  ▼  Admin       │  ← Tabs scroll horizontally
├──────────────────────────────┤
│                               │
│  📋 Join Requests             │
│  ┌─────────────────────────┐ │
│  │ 👤 Jane Doe             │ │
│  │ 2 hours ago             │ │
│  │ via invite link         │ │
│  │                         │ │
│  │ [Approve]  [Reject]     │ │
│  └─────────────────────────┘ │
│                               │
│  ⚙️ Group Settings            │
│  [Leave Group]               │
│  [Delete Group]              │
│  [Send Notification]         │
│                               │
│  💰 Betting (collapsed)       │
│  🎨 Theme (collapsed)         │
│                               │
└──────────────────────────────┘
```

### 6. Notification Badge (Group Card)

```
┌──────────────────────────────────┐
│  [Logo] My Friend Group    [2]   │  ← Badge shows pending count
│  12 members · Owner              │
│                                   │
│  [View Group]                    │
└──────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Database & Repository (Foundation)
1. Create migration file `migrations/YYYYMMDD_add_join_requests_table.sql`
2. Create `app/db/prode-group-join-request-repository.ts` with all CRUD functions
3. Update `app/db/tables-definition.ts` with new table types
4. Write unit tests for repository functions

### Phase 2: Server Actions (Business Logic)
5. Create `app/actions/prode-group-join-request-actions.ts` with all actions
6. Update `app/actions/prode-group-actions.ts` (remove/deprecate `joinGroup`)
7. Write unit tests for server actions (auth checks, validation)

### Phase 3: Email Infrastructure
8. Update `app/utils/email-templates.ts` with 3 new generators
9. Verify `emails` namespace exists in `i18n.config.ts` (or register if missing)
10. Add i18n keys to `locales/en/emails.json` and `locales/es/emails.json`
11. Write tests for email generation (mock sendEmail)

### Phase 4: UI Components (New)
12. Create `PendingRequestView` component
13. Create `JoinRequestManager` component
14. Create `PendingRequestsCard` component
15. Create `AdminTabs` component
16. Write component tests for all new components

### Phase 5: Route Updates (Integration)
17. Update `/friend-groups/join/[id]/page.tsx` with request flow
18. Update `/tournaments/[id]/friend-groups/[group_id]/page.tsx` with AdminTabs and pendingCount prop
19. Update `/tournaments/[id]/friend-groups/page.tsx` with PendingRequestsCard
20. Update `friends-group-table.tsx` with pendingRequestCount prop and badge
21. Write integration tests for routes

### Phase 6: Testing & Validation
22. Run all unit tests (repository, actions, components)
23. Test 7-day rejection cooldown (set resolved_at to past date, verify error)
24. Test transaction rollback (simulate addParticipantToGroup failure)
25. Run integration tests (full request flow)
26. Manual testing with real emails
27. Accessibility testing (keyboard navigation, screen readers)
28. Responsive testing (mobile, tablet, desktop)

### Phase 7: Migration & Deployment
29. Review migration script
30. Run migration in development
31. Seed test data (pending requests, rejected with cooldown)
32. Deploy to staging/preview
33. Final validation in preview environment

## Files to Create

**Database:**
- `migrations/YYYYMMDD_add_join_requests_table.sql`

**Repository:**
- `app/db/prode-group-join-request-repository.ts`

**Server Actions:**
- `app/actions/prode-group-join-request-actions.ts`

**Components:**
- `app/components/friend-groups/join-request-manager.tsx`
- `app/components/friend-groups/pending-request-view.tsx`
- `app/components/friend-groups/pending-requests-card.tsx`
- `app/components/friend-groups/admin-tabs.tsx`

**Tests:**
- `__tests__/db/prode-group-join-request-repository.test.ts`
- `__tests__/actions/prode-group-join-request-actions.test.ts`
- `__tests__/components/friend-groups/join-request-manager.test.tsx`
- `__tests__/components/friend-groups/pending-request-view.test.tsx`
- `__tests__/components/friend-groups/pending-requests-card.test.tsx`
- `__tests__/components/friend-groups/admin-tabs.test.tsx`
- `__tests__/integration/join-request-flow.test.ts`

## Files to Modify

**Repository:**
- `app/db/tables-definition.ts` - Add join request table types

**Server Actions:**
- `app/actions/prode-group-actions.ts` - Remove/deprecate `joinGroup()`

**Email:**
- `app/utils/email-templates.ts` - Add 3 new email generators
- `locales/en/emails.json` - Add join request translations
- `locales/es/emails.json` - Add join request translations

**Routes:**
- `app/[locale]/friend-groups/join/[id]/page.tsx` - Replace auto-join with request flow
- `app/[locale]/tournaments/[tournament_id]/friend-groups/[group_id]/page.tsx` - Add AdminTabs
- `app/[locale]/tournaments/[tournament_id]/friend-groups/page.tsx` - Add PendingRequestsCard

**Components:**
- `app/components/friend-groups/friends-group-table.tsx` - Add notification badge

## Testing Strategy

### Unit Tests (80% coverage required for new code)

**Repository Tests:**
- `createJoinRequest()` - Creates request with correct fields
- `findJoinRequestsByGroup()` - Returns requests with user data
- `findJoinRequestsByUser()` - Returns requests with group data
- `findPendingJoinRequest()` - Finds only pending requests
- `approveJoinRequest()` - Marks approved + adds user to group
- `rejectJoinRequest()` - Marks rejected with resolver ID
- `cancelJoinRequest()` - Deletes request
- `countPendingRequestsForGroup()` - Returns correct count

**Server Action Tests:**
- `requestToJoinGroup()` - Validates user not member, no pending request
- `requestToJoinGroup()` - Prevents duplicate pending requests
- `requestToJoinGroup()` - Prevents owner from requesting own group
- `approveJoinRequest()` - Requires admin/owner permission
- `rejectJoinRequest()` - Requires admin/owner permission
- `cancelJoinRequest()` - Requires request belongs to user
- Email sending - Mock `sendEmail()` and verify calls

**Component Tests:**
- `JoinRequestManager` - Renders pending requests correctly
- `JoinRequestManager` - Approve/Reject buttons work
- `JoinRequestManager` - Empty state renders
- `PendingRequestView` - Shows limited group info
- `PendingRequestView` - Cancel button works
- `PendingRequestsCard` - Renders user's requests
- `AdminTabs` - Shows/hides Admin tab based on permissions
- `AdminTabs` - URL query param support works

### Integration Tests

**Complete Flows:**
1. Request → Admin approves → User joins group
2. Request → Admin rejects → User sees rejection + cooldown
3. Request → User cancels → Request deleted
4. Duplicate request prevention
5. Permission checks (non-admin can't approve)

### E2E Tests (Manual)

**User Flows:**
1. User visits invite link → Sees preview → Clicks "Request to Join" → Sees confirmation
2. Admin opens group → Goes to Admin tab → Sees pending request → Approves → User added
3. User views pending requests in sidebar → Cancels request → Request removed
4. User with pending request views group → Sees limited info only (no scores)

**Email Flows:**
1. Send real email to admin when request made → Verify format and link
2. Send real email to user when approved → Verify format and link
3. Send real email to user when rejected → Verify cooldown message

**Responsive:**
1. Test all components on mobile (320px width)
2. Test admin tabs on tablet (768px width)
3. Test sidebar cards on desktop (1200px width)

### Accessibility

- Keyboard navigation for all interactive elements
- ARIA labels for screen readers
- Focus management in dialogs
- Color contrast ratio ≥4.5:1

## Validation Considerations

### Pre-Commit Validation
- All tests pass: `npm test`
- No lint errors: `npm run lint`
- Build succeeds: `npm run build`
- No TypeScript errors

### SonarCloud Quality Gates
- 0 new issues (any severity)
- 80% coverage on new code
- Security rating: A
- Maintainability: B or higher
- No code duplication

### Migration Safety
- Test migration on dev database first
- Verify indexes are created
- Check constraint violations don't affect existing data
- Confirm cascade deletes work correctly

### Email Testing
- Test with real SMTP credentials
- Verify both English and Spanish versions
- Check email formatting on mobile email clients
- Confirm links work correctly
- Test with special characters in names/group names

### Performance Considerations
- Database indexes for efficient queries (included in migration)
- Cache pending request counts (consider Redis or in-memory cache with 5 min TTL)
- **Rate limiting:** Simple query-based approach (no Redis needed for MVP)
  ```typescript
  // In requestToJoinGroup() server action:
  // Query recent requests: SELECT COUNT(*) WHERE user_id = ? AND requested_at > NOW() - INTERVAL '1 hour'
  // If count >= 10, throw error: "You can make at most 10 join requests per hour"
  ```
- Email sending is non-blocking (fire and forget - don't await completion)

### Security Checks
- Validate user is authenticated before creating request
- Verify admin/owner status before approve/reject actions
- Prevent request spam (unique constraint + rate limiting)
- Sanitize user input in email templates
- CSRF protection (Next.js Server Actions provide this)

## Edge Cases to Handle

1. **User already in group:** Redirect to group page (no request button)
2. **User tries to request own group:** Show error "You are the owner of this group"
3. **Private group (all groups for now):** Request flow works correctly
4. **User deleted:** All their pending requests deleted (cascade)
5. **Group deleted:** All pending requests deleted (cascade)
6. **Admin who approved request leaves group:** Resolver ID still recorded
7. **Request rate limiting:** Max 10 requests per hour per user
8. **7-Day rejection cooldown:**
   - Query: `SELECT * FROM prode_group_join_requests WHERE user_id = ? AND group_id = ? AND status = 'rejected' AND resolved_at > NOW() - INTERVAL '7 days'`
   - If found, calculate: `nextEligibleDate = resolved_at + INTERVAL '7 days'`
   - Show error: "You can request to join again on {formatted date}"
   - Sidebar shows: "Can request again: {formatted date}"
9. **Multiple admins:** Email sent to all admins + owner
10. **Tournament context:** All routes are tournament-scoped for consistency

## Rollout Strategy

### Breaking Change Notice
**This is a BREAKING CHANGE:** Auto-join is removed, now requires approval.

**User Communication:**
- Announce to users: "Friend group joining now requires admin approval"
- Send email to all group owners explaining new workflow
- Update help documentation with new join process

### Migration Approach
1. Add `prode_group_join_requests` table via migration
2. Existing groups continue to work (backward compatible)
3. No data migration needed (fresh start for requests)
4. Deploy during low-traffic period
5. Monitor error logs for issues

### Rollback Plan
If critical issues arise:
1. Revert application code to previous version
2. Keep database migration (doesn't break old code)
3. Investigate and fix issues
4. Re-deploy when ready

## Dependencies

**Depends on:**
- None (foundation ticket)

**Blocks:**
- Ticket 2: Public Groups with Discovery (requires join request system)
- Ticket 3: Email Invitations with Pre-Approval (extends join request system)

## Success Criteria

✅ All acceptance criteria from story description met
✅ All tests pass (unit, integration, E2E)
✅ 80% coverage on new code
✅ 0 new SonarCloud issues
✅ Email notifications work in both English and Spanish
✅ Admin tab refactor complete (all existing features moved)
✅ Responsive on mobile, tablet, desktop
✅ Accessibility: Keyboard navigation + screen reader support
✅ Migration runs successfully without errors
✅ Performance: Page load <2s, request approval <500ms

## Timeline Estimate

**Total Effort:** Large (5-7 days)

**Breakdown:**
- Phase 1 (Database & Repository): 0.5 days
- Phase 2 (Server Actions): 1 day
- Phase 3 (Email Infrastructure): 0.5 days
- Phase 4 (UI Components): 2 days
- Phase 5 (Route Updates): 1 day
- Phase 6 (Testing): 1 day
- Phase 7 (Migration & Deployment): 0.5 days
- Buffer for iterations: 0.5 days

**Note:** This is a large feature with significant UI refactoring (admin tabs) and foundational infrastructure (join requests system). The admin tabs refactor alone is substantial work as it involves reorganizing the entire group detail page.

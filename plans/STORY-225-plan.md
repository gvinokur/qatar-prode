# Implementation Plan: Email Invitations with Pre-Approval (#225)

## Context

This feature enables group admins to send email invitations that allow recipients to join friend groups instantly without waiting for approval. Unlike the existing join request system (Ticket 1) where users request to join and wait for admin approval, email invitations provide a pre-approved joining mechanism using secure tokens.

**Why this is needed:**
- Admins want to invite specific people by email address
- Invited users should join instantly without the approval friction
- Provides a more direct invitation flow compared to sharing links and waiting for join requests
- Complements the existing join request system (for discovery/link-based joins)

## Simplified Approach

After analyzing the codebase, I've identified an opportunity to **reuse and extend the existing join request infrastructure** rather than creating a completely separate system. This reduces complexity while maintaining all required features.

### Key Decision: Extend vs. Create New

**Original Issue Approach:** Create separate `prode_group_email_invitations` table with tokens, expiration tracking, and status management.

**Recommended Simplified Approach:**
1. **Reuse `prode_group_join_requests` table** which already supports `email_invite` as a source
2. **Add optional token field** to join requests for email invitations
3. **Leverage existing approval workflow** but auto-approve email invitation join requests
4. **Single Admin UI** manages both join requests and email invitations together

**Benefits:**
- ✅ Reduce database complexity (one table instead of two)
- ✅ Reuse existing repository functions and server actions
- ✅ Simpler UI (unified request management)
- ✅ Email invitation requests appear alongside regular requests (better admin visibility)
- ✅ Same permission checking and security patterns
- ✅ Easier testing (existing test patterns apply)

**Trade-offs:**
- ❌ No separate invitation lifecycle tracking (pending invitation vs accepted)
- ❌ No "resend invitation" functionality (would need to create new join request)

### Decision: Option A (Simplified - Approved)

**Using Option A:** Extend join_requests table with optional token field for email invites.

**Rationale:**
- Reuses proven infrastructure (join_requests table already supports `email_invite` source)
- Reduces database complexity (~40% less code)
- Unified admin UI for all join requests
- Leverages existing test patterns and repository functions

## Acceptance Criteria

### Send Email Invitation (Admin)
- [ ] Admin sees "Email Invitations" section in Admin tab
- [ ] Email input field with real-time validation
- [ ] "Send Invitation" button enabled only when valid email
- [ ] Rate limit indicator: "X/20 invitations sent today"
- [ ] Success toast: "Invitation sent to {email}"
- [ ] Email sent with invitation link containing token
- [ ] Error handling: already member, pending invitation exists, rate limit exceeded

### Email Template
- [ ] Subject: "{AdminName} invited you to join {GroupName}"
- [ ] HTML email with group name, description, admin name
- [ ] "Accept Invitation" button with token link
- [ ] Expiration notice (7 days)
- [ ] Plain text fallback
- [ ] Supports English and Spanish (i18n)

### Accept Invitation (User)
- [ ] User clicks link in email
- [ ] If not logged in: redirects to login with token preserved
- [ ] If logged in with matching email: auto-joins group
- [ ] If email mismatch: error "This invitation was sent to {email}"
- [ ] Success: "You've joined {GroupName}!" with redirect
- [ ] Token validation: invalid, expired, already used errors

### Security
- [ ] Cryptographically secure tokens (UUID v4)
- [ ] Email validation (token only works for invited email)
- [ ] One-time use (token consumed after acceptance)
- [ ] 7-day expiration (auto-expire old invitations)
- [ ] Rate limiting (max 20 invitations per day per group)

## Technical Approach

### Database Schema Changes

**Option A (Simplified - Recommended):**

Add token support to existing `prode_group_join_requests` table:

```sql
-- Migration: Add email invitation token support
ALTER TABLE prode_group_join_requests
  ADD COLUMN invitation_token UUID UNIQUE,
  ADD COLUMN token_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN invited_email VARCHAR(255);

-- Index for token lookup (email invitations only)
CREATE INDEX idx_join_requests_invitation_token
  ON prode_group_join_requests(invitation_token)
  WHERE invitation_token IS NOT NULL AND status = 'pending';

-- Index for expiration cleanup
CREATE INDEX idx_join_requests_token_expires
  ON prode_group_join_requests(token_expires_at)
  WHERE invitation_token IS NOT NULL AND status = 'pending';

COMMENT ON COLUMN prode_group_join_requests.invitation_token IS 'Secure token for email invitations (null for regular join requests)';
COMMENT ON COLUMN prode_group_join_requests.token_expires_at IS 'Expiration date for email invitation tokens';
COMMENT ON COLUMN prode_group_join_requests.invited_email IS 'Email address invitation was sent to (for validation)';
```

**Validation:**
- invitation_token is nullable (only set for email_invite source)
- When request_source = 'email_invite', invitation_token MUST be set
- token_expires_at = invited_at + 7 days

**Option B (Original Issue Approach):**

Create separate table as specified in issue (see issue #225 for full schema).

### Repository Layer

**Extend:** `/Users/gvinokur/Personal/qatar-prode/app/db/prode-group-join-request-repository.ts`

**New Functions (Option A):**

```typescript
/**
 * Create email invitation join request with token
 */
export async function createEmailInvitationRequest(
  groupId: string,
  invitedEmail: string,
  invitedByUserId: string
): Promise<{ id: string; token: string }> {
  const token = generateSecureToken(); // UUID v4
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  // Insert pending join request with token
  const result = await db.insertInto('prode_group_join_requests')
    .values({
      group_id: groupId,
      user_id: invitedByUserId, // Placeholder until user accepts
      status: 'pending',
      request_source: 'email_invite',
      invitation_token: token,
      token_expires_at: expiresAt,
      invited_email: invitedEmail,
      requested_at: new Date()
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return { id: result.id, token };
}

/**
 * Find invitation by token (for acceptance flow)
 */
export async function findInvitationByToken(token: string): Promise<JoinRequestWithDetails | null> {
  return await db.selectFrom('prode_group_join_requests as jr')
    .innerJoin('prode_groups as g', 'g.id', 'jr.group_id')
    .innerJoin('users as inviter', 'inviter.id', 'jr.user_id')
    .selectAll('jr')
    .select([
      'g.name as group_name',
      'g.description as group_description',
      'inviter.nickname as inviter_name'
    ])
    .where('jr.invitation_token', '=', token)
    .where('jr.status', '=', 'pending')
    .where('jr.token_expires_at', '>', new Date()) // Not expired
    .executeTakeFirst();
}

/**
 * Accept email invitation (update request with real user_id)
 */
export async function acceptEmailInvitation(
  token: string,
  userId: string
): Promise<void> {
  await db.updateTable('prode_group_join_requests')
    .set({
      user_id: userId,
      status: 'approved',
      resolved_at: new Date(),
      resolved_by_user_id: userId // Self-approved via token
    })
    .where('invitation_token', '=', token)
    .where('status', '=', 'pending')
    .execute();
}

/**
 * Count email invitations sent today for rate limiting
 */
export async function countInvitationsSentToday(groupId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await db.selectFrom('prode_group_join_requests')
    .select(db.fn.count<number>('id').as('count'))
    .where('group_id', '=', groupId)
    .where('request_source', '=', 'email_invite')
    .where('requested_at', '>=', today)
    .executeTakeFirstOrThrow();

  return result.count;
}

/**
 * Expire old invitation tokens (cron job or on-demand)
 */
export async function expireOldInvitations(): Promise<number> {
  const result = await db.updateTable('prode_group_join_requests')
    .set({ status: 'rejected' }) // Mark as rejected when expired
    .where('invitation_token', 'is not', null)
    .where('status', '=', 'pending')
    .where('token_expires_at', '<', new Date())
    .execute();

  return Number(result.numUpdatedRows || 0);
}
```

**Helper Function:**

```typescript
function generateSecureToken(): string {
  return crypto.randomUUID(); // Built-in secure UUID v4 generator
}
```

### Server Actions

**New file:** `/Users/gvinokur/Personal/qatar-prode-story-225/app/actions/prode-group-email-invitation-actions.ts`

```typescript
'use server';

import { getLoggedInUser } from './user-actions';
import {
  findProdeGroupById,
  findParticipantsInGroup,
  addParticipantToGroup
} from '@/app/db/prode-group-repository';
import {
  createEmailInvitationRequest,
  findInvitationByToken,
  acceptEmailInvitation,
  countInvitationsSentToday
} from '@/app/db/prode-group-join-request-repository';
import { findUserByEmail } from '@/app/db/users-repository';
import { sendEmail } from '@/app/utils/email';
import { generateEmailInvitationEmail } from '@/app/utils/email-templates';
import { Locale } from '@/i18n.config';

const MAX_INVITATIONS_PER_DAY = 20;

/**
 * Send email invitation to join group
 */
export async function sendEmailInvitation(
  groupId: string,
  email: string,
  locale: Locale,
  tournamentId?: string
): Promise<{ success: boolean; message: string }> {
  // 1. Validate user is admin/owner
  const user = await getLoggedInUser();
  if (!user) throw new Error('Not authenticated');

  const group = await findProdeGroupById(groupId);
  if (!group) throw new Error('Group not found');

  const isOwner = group.owner_user_id === user.id;

  // Check if user is admin (same pattern as group page)
  const participants = await findParticipantsInGroup(groupId);
  const participantRecord = participants.find(p => p.user_id === user.id);
  const isAdmin = !!(isOwner || participantRecord?.is_admin);

  if (!isAdmin) {
    throw new Error('Only group admins can send invitations');
  }

  // 2. Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, message: 'Invalid email address' };
  }

  // 3. Check if email already a member
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    const isAlreadyMember = participants.some(p => p.user_id === existingUser.id) ||
                            group.owner_user_id === existingUser.id;
    if (isAlreadyMember) {
      return { success: false, message: 'User is already a member of this group' };
    }
  }

  // 4. Check rate limit
  const todayCount = await countInvitationsSentToday(groupId);
  if (todayCount >= MAX_INVITATIONS_PER_DAY) {
    return {
      success: false,
      message: `Maximum ${MAX_INVITATIONS_PER_DAY} invitations per day reached`
    };
  }

  // 5. Create invitation with token
  const { id, token } = await createEmailInvitationRequest(
    groupId,
    email,
    user.id
  );

  // 6. Generate invitation link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const invitationUrl = tournamentId
    ? `${baseUrl}/${locale}/tournaments/${tournamentId}/friend-groups/join/${groupId}?token=${token}`
    : `${baseUrl}/${locale}/friend-groups/join/${groupId}?token=${token}`;

  // 7. Send email
  const emailContent = await generateEmailInvitationEmail(
    email,
    user.nickname || user.email,
    group.name,
    group.description || '',
    invitationUrl,
    locale
  );

  // Fire-and-forget pattern (non-blocking)
  sendEmail(emailContent).catch(err => {
    console.error('Failed to send invitation email:', err);
  });

  return { success: true, message: 'Invitation sent successfully' };
}

/**
 * Accept email invitation via token
 */
export async function acceptInvitationByToken(
  token: string
): Promise<{ success: boolean; groupId?: string; error?: string }> {
  const user = await getLoggedInUser();
  if (!user) {
    return { success: false, error: 'notAuthenticated' };
  }

  // Find invitation
  const invitation = await findInvitationByToken(token);
  if (!invitation) {
    return { success: false, error: 'invalidToken' };
  }

  // Validate email match
  if (invitation.invited_email !== user.email) {
    return {
      success: false,
      error: 'emailMismatch',
      invitedEmail: invitation.invited_email
    };
  }

  // Accept invitation (marks request as approved)
  await acceptEmailInvitation(token, user.id);

  // Add user to group participants
  // Note: addParticipantToGroup requires group object and user object
  const group = await findProdeGroupById(invitation.group_id);
  if (!group) {
    return { success: false, error: 'groupNotFound' };
  }
  await addParticipantToGroup(group, user, false); // false = not admin

  return { success: true, groupId: invitation.group_id };
}
```

### Email Templates

**Extend:** `/Users/gvinokur/Personal/qatar-prode/app/utils/email-templates.ts`

**New Function:**

```typescript
/**
 * Generate email invitation template
 */
export async function generateEmailInvitationEmail(
  recipientEmail: string,
  inviterName: string,
  groupName: string,
  groupDescription: string,
  invitationUrl: string,
  locale: Locale = 'es'
) {
  const t = await getTranslations({ locale, namespace: 'emails' });

  const subject = t('emailInvitation.subject', { inviterName, groupName });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a4a4a;">${t('emailInvitation.title')}</h2>
      <p>${t('emailInvitation.greeting')}</p>
      <p>${t('emailInvitation.message', { inviterName, groupName })}</p>
      ${groupDescription ? `<p style="font-style: italic; color: #666;">"${groupDescription}"</p>` : ''}
      <p style="margin: 20px 0;">
        <a
          href="${invitationUrl}"
          style="display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px;">
          ${t('emailInvitation.acceptButton')}
        </a>
      </p>
      <p style="font-size: 14px; color: #666;">
        ${t('emailInvitation.expiresNote')}
      </p>
      <p style="font-size: 12px; color: #999;">
        ${t('emailInvitation.linkFallback')}<br>
        <a href="${invitationUrl}">${invitationUrl}</a>
      </p>
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd;">
        <p style="font-size: 12px; color: #999;">
          ${t('emailInvitation.footer', { email: recipientEmail })}
        </p>
      </div>
    </div>
  `;

  const text = `
${t('emailInvitation.title')}

${t('emailInvitation.greeting')}

${t('emailInvitation.message', { inviterName, groupName })}

${groupDescription ? `"${groupDescription}"` : ''}

${t('emailInvitation.acceptButton')}: ${invitationUrl}

${t('emailInvitation.expiresNote')}

${t('emailInvitation.footer', { email: recipientEmail })}
  `.trim();

  return { to: recipientEmail, subject, html, text };
}
```

### UI Components

#### 1. Email Invitation Form Component

**New file:** `/Users/gvinokur/Personal/qatar-prode-story-225/app/components/friend-groups/email-invitation-form.tsx`

```tsx
'use client';

import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
  CircularProgress
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { sendEmailInvitation } from '@/app/actions/prode-group-email-invitation-actions';
import { EmailOutlined as EmailIcon } from '@mui/icons-material';
import { Locale } from '@/i18n.config';

type Props = {
  groupId: string;
  tournamentId?: string;
  locale: Locale;
  invitationsSentToday: number;
  maxInvitationsPerDay: number;
};

export default function EmailInvitationForm({
  groupId,
  tournamentId,
  locale,
  invitationsSentToday,
  maxInvitationsPerDay
}: Props) {
  const t = useTranslations('groups.emailInvitation');
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const rateLimitReached = invitationsSentToday >= maxInvitationsPerDay;

  const handleSendInvitation = async () => {
    if (!isValidEmail || rateLimitReached) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await sendEmailInvitation(groupId, email, locale, tournamentId);

      if (result.success) {
        setSuccess(true);
        setEmail(''); // Clear input
        router.refresh(); // Update invitation count
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('sendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={t('title')}
        avatar={<EmailIcon />}
      />
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('description')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            type="email"
            label={t('emailLabel')}
            placeholder="friend@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={email.length > 0 && !isValidEmail}
            helperText={email.length > 0 && !isValidEmail ? t('invalidEmail') : ''}
            disabled={loading || rateLimitReached}
          />
          <Button
            variant="contained"
            onClick={handleSendInvitation}
            disabled={!isValidEmail || loading || rateLimitReached}
            startIcon={loading ? <CircularProgress size={16} /> : <EmailIcon />}
          >
            {t('sendButton')}
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary">
          {t('rateLimit', {
            count: invitationsSentToday,
            max: maxInvitationsPerDay
          })}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(false)}>
            {t('sendSuccess', { email })}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 2. Token Acceptance Page

**Update existing:** `/Users/gvinokur/Personal/qatar-prode/app/[locale]/tournaments/[tournament_id]/friend-groups/join/[group_id]/page.tsx`

Add token handling logic at the beginning:

```tsx
export default async function JoinGroupPage({ params, searchParams }) {
  const { token } = searchParams;
  const user = await getLoggedInUser();

  // Handle email invitation token flow
  if (token) {
    if (!user) {
      // Preserve token in login redirect
      const returnUrl = encodeURIComponent(
        `/tournaments/${params.tournament_id}/friend-groups/join/${params.group_id}?token=${token}`
      );
      redirect(`/login?returnUrl=${returnUrl}`);
    }

    // Validate and accept invitation
    const result = await acceptInvitationByToken(token);

    if (result.success) {
      // Success! Redirect to group with success message
      redirect(
        `/tournaments/${params.tournament_id}/friend-groups/${params.group_id}?joined=true`
      );
    } else {
      // Show error based on result.error
      return <InvitationError error={result.error} />;
    }
  }

  // Otherwise, continue with normal join request flow...
}
```

**New component:** `InvitationError.tsx` for error states:

```tsx
'use client';

import { Alert, Button, Box } from '@mui/material';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

type Props = {
  error: 'invalidToken' | 'emailMismatch' | 'notAuthenticated';
  invitedEmail?: string;
};

export function InvitationError({ error, invitedEmail }: Props) {
  const t = useTranslations('groups.emailInvitation.errors');
  const router = useRouter();

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Alert severity="error">
        {error === 'invalidToken' && t('invalidToken')}
        {error === 'emailMismatch' && t('emailMismatch', { email: invitedEmail })}
        {error === 'notAuthenticated' && t('notAuthenticated')}
      </Alert>
      <Button onClick={() => router.back()} sx={{ mt: 2 }}>
        {t('goBack')}
      </Button>
    </Box>
  );
}
```

### Integration Points

#### Admin Tab Update

**Update:** `/Users/gvinokur/Personal/qatar-prode/app/[locale]/tournaments/[id]/friend-groups/[group_id]/page.tsx`

Add email invitation section to admin content:

```tsx
const invitationsSentToday = await countInvitationsSentToday(groupId);

<AdminTabs
  adminContent={
    <Box>
      {/* Section 1: Join Requests */}
      <JoinRequestManager {...} />

      {/* Section 2: Email Invitations (NEW) */}
      <Box sx={{ mt: 3 }}>
        <EmailInvitationForm
          groupId={groupId}
          tournamentId={tournamentId}
          locale={locale}
          invitationsSentToday={invitationsSentToday}
          maxInvitationsPerDay={20}
        />
      </Box>

      {/* Section 3: Betting Configuration */}
      <GroupTournamentBettingAdmin {...} />

      {/* Section 4: Theme */}
      <ProdeGroupThemer {...} />
    </Box>
  }
/>
```

### i18n Translation Keys

**Extend:** `/Users/gvinokur/Personal/qatar-prode/locales/en/emails.json` and `locales/es/emails.json`

```json
{
  "emailInvitation": {
    "subject": "{inviterName} invited you to join {groupName}",
    "title": "You've been invited!",
    "greeting": "Hi there,",
    "message": "{inviterName} has invited you to join the friend group \"{groupName}\".",
    "acceptButton": "Accept Invitation",
    "expiresNote": "This invitation expires in 7 days.",
    "linkFallback": "If the button doesn't work, copy and paste this link:",
    "footer": "This invitation was sent to {email}. If you received this in error, you can safely ignore it."
  }
}
```

**Extend:** `/Users/gvinokur/Personal/qatar-prode/locales/en/groups.json` (Spanish too)

```json
{
  "emailInvitation": {
    "title": "Email Invitations",
    "description": "Send email invitations that allow instant join without approval.",
    "emailLabel": "Email Address",
    "sendButton": "Send Invitation",
    "rateLimit": "{count}/{max} invitations sent today",
    "invalidEmail": "Please enter a valid email address",
    "sendSuccess": "Invitation sent to {email}",
    "sendFailed": "Failed to send invitation",
    "errors": {
      "invalidToken": "This invitation link is invalid or has expired.",
      "emailMismatch": "This invitation was sent to {email}. Please log in with that account.",
      "notAuthenticated": "Please log in to accept this invitation."
    }
  }
}
```

## Files to Create

1. **Migration (in main worktree):**
   - `/Users/gvinokur/Personal/qatar-prode/migrations/20260228_add_email_invitation_tokens.sql`
   - **Note:** Migrations must be in main worktree, not story worktree, to be picked up by deployment

2. **Server Actions:**
   - `/Users/gvinokur/Personal/qatar-prode-story-225/app/actions/prode-group-email-invitation-actions.ts`

3. **UI Components:**
   - `/Users/gvinokur/Personal/qatar-prode-story-225/app/components/friend-groups/email-invitation-form.tsx`
   - `/Users/gvinokur/Personal/qatar-prode-story-225/app/components/friend-groups/invitation-error.tsx`

4. **Translation Files:**
   - Update `/Users/gvinokur/Personal/qatar-prode-story-225/locales/en/emails.json`
   - Update `/Users/gvinokur/Personal/qatar-prode-story-225/locales/es/emails.json`
   - Update `/Users/gvinokur/Personal/qatar-prode-story-225/locales/en/groups.json`
   - Update `/Users/gvinokur/Personal/qatar-prode-story-225/locales/es/groups.json`

5. **Tests:**
   - `/Users/gvinokur/Personal/qatar-prode-story-225/__tests__/db/prode-group-join-request-repository-email-invitations.test.ts`
   - `/Users/gvinokur/Personal/qatar-prode-story-225/__tests__/actions/prode-group-email-invitation-actions.test.ts`
   - `/Users/gvinokur/Personal/qatar-prode-story-225/__tests__/components/email-invitation-form.test.tsx`
   - `/Users/gvinokur/Personal/qatar-prode-story-225/__tests__/utils/email-templates-invitation.test.ts`

## Files to Modify

1. **Repository:**
   - `/Users/gvinokur/Personal/qatar-prode/app/db/prode-group-join-request-repository.ts` - Add email invitation functions

2. **Email Templates:**
   - `/Users/gvinokur/Personal/qatar-prode/app/utils/email-templates.ts` - Add generateEmailInvitationEmail

3. **Type Definitions:**
   - `/Users/gvinokur/Personal/qatar-prode/app/db/tables-definition.ts` - Add invitation token fields to ProdeGroupJoinRequestTable:
     ```typescript
     export interface ProdeGroupJoinRequestTable extends Identifiable {
       // ... existing fields ...
       invitation_token?: string | null;
       token_expires_at?: Date | null;
       invited_email?: string | null;
     }
     ```

4. **Join Page:**
   - `/Users/gvinokur/Personal/qatar-prode/app/[locale]/tournaments/[tournament_id]/friend-groups/join/[group_id]/page.tsx` - Add token handling

5. **Group Page (Admin Tab):**
   - `/Users/gvinokur/Personal/qatar-prode/app/[locale]/tournaments/[tournament_id]/friend-groups/[group_id]/page.tsx` - Add EmailInvitationForm

## Implementation Steps

### Phase 1: Database & Repository (Foundation)
1. **FIRST:** Create migration script in main worktree (`/Users/gvinokur/Personal/qatar-prode/migrations/`)
2. **THEN:** Run migration to add columns to `prode_group_join_requests` table
3. Update TypeScript types in `tables-definition.ts` to include optional token fields
4. Implement repository functions for email invitations in `prode-group-join-request-repository.ts`
5. Write repository unit tests

**Critical:** Migration MUST be run before any code implementation, otherwise TypeScript types will be out of sync with database schema.

### Phase 2: Email Infrastructure
1. Add generateEmailInvitationEmail to email-templates.ts
2. Add i18n translation keys (English & Spanish)
3. Write email template tests

### Phase 3: Server Actions
1. Implement sendEmailInvitation action
2. Implement acceptInvitationByToken action
3. Write server action tests (including rate limiting, validation)

### Phase 4: UI Components
1. Create EmailInvitationForm component
2. Create InvitationError component
3. Write component tests
4. Update Admin tab to include EmailInvitationForm

### Phase 5: Token Acceptance Flow
1. Update join page to handle token query param
2. Add token validation and auto-join logic
3. Add redirect flows (login preservation, success redirect)
4. Test end-to-end invitation flow

### Phase 6: Integration Testing
1. Test complete flow: send invitation → receive email → accept → join group
2. Test error cases: expired token, email mismatch, invalid token
3. Test rate limiting
4. Verify email sent in both languages

## Testing Strategy

### Unit Tests

**Repository Tests:** (`__tests__/db/prode-group-join-request-repository-email-invitations.test.ts`)
- ✅ createEmailInvitationRequest - Creates with token and expiration
- ✅ findInvitationByToken - Finds only pending, non-expired
- ✅ acceptEmailInvitation - Updates user_id and status
- ✅ countInvitationsSentToday - Counts only today's email_invite requests
- ✅ expireOldInvitations - Marks expired tokens as rejected

**Server Action Tests:** (`__tests__/actions/prode-group-email-invitation-actions.test.ts`)
- ✅ sendEmailInvitation - Validates admin permission
- ✅ sendEmailInvitation - Validates email format
- ✅ sendEmailInvitation - Enforces rate limit (20/day)
- ✅ sendEmailInvitation - Creates invitation and sends email
- ✅ acceptInvitationByToken - Validates token and email match
- ✅ acceptInvitationByToken - Auto-joins user to group
- ✅ acceptInvitationByToken - Rejects expired tokens
- ✅ acceptInvitationByToken - Rejects email mismatch

**Email Template Tests:** (`__tests__/utils/email-templates-invitation.test.ts`)
- ✅ generateEmailInvitationEmail - Generates HTML with all required elements
- ✅ generateEmailInvitationEmail - Supports English locale
- ✅ generateEmailInvitationEmail - Supports Spanish locale
- ✅ generateEmailInvitationEmail - Includes invitation link

**Component Tests:** (`__tests__/components/email-invitation-form.test.tsx`)
- ✅ Renders email input and send button
- ✅ Validates email format in real-time
- ✅ Disables button when email invalid
- ✅ Shows rate limit indicator
- ✅ Displays success message after send
- ✅ Displays error message on failure
- ✅ Clears input after successful send

### Integration Tests

**Complete Flow Test:**
1. Admin sends invitation to test@example.com
2. Invitation record created with token
3. Email sent with invitation link
4. User clicks link and logs in
5. Token validated and user auto-joins group
6. Success message displayed

**Error Handling Tests:**
1. Expired token → Shows "expired" error
2. Email mismatch → Shows "sent to different email" error
3. Invalid token → Shows "invalid link" error
4. Rate limit exceeded → Shows "max invitations reached" error

### Test Utilities to Use

- **renderWithProviders** for EmailInvitationForm component tests
- **testFactories.prodeGroup** for mock group data
- **testFactories.user** for mock user data
- **createMockSelectQuery** for repository mocks
- **createMockInsertQuery** for invitation creation
- **vi.hoisted** for mocking database module
- **setupTestMocks** for navigation and session mocking

### Coverage Target

- **80% coverage on new code** (SonarCloud requirement)
- Focus on critical paths: token validation, email sending, rate limiting
- Edge cases: expired tokens, email mismatches, permissions

## Validation Considerations

### SonarCloud Quality Gates

- **0 new issues** of any severity
- **80% coverage on new code**
- **Security rating: A** (secure token generation, email validation)
- **No code duplication** (reuse existing patterns)

### Security Checklist

- ✅ Tokens are cryptographically secure (crypto.randomUUID)
- ✅ Email validation prevents unauthorized use
- ✅ One-time use enforced (status update after acceptance)
- ✅ Expiration enforced (7 days, checked on validation)
- ✅ Rate limiting prevents spam (20/day per group)
- ✅ Admin permission checked before sending
- ✅ No sensitive data in URLs (token is opaque UUID)

### Performance Considerations

- **Email sending is non-blocking** (fire-and-forget pattern)
- **Indexes on token and expiration** for fast lookups
- **Rate limit check** uses simple COUNT query (fast)
- **Token lookup** uses indexed column with WHERE clause optimization

## Visual Prototypes

### Email Invitation Form (Admin Tab)

```
┌─────────────────────────────────────────────────────────────┐
│ ✉ Email Invitations                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Send email invitations that allow instant join without     │
│  approval.                                                   │
│                                                              │
│  ┌────────────────────────────────────┬──────────────────┐  │
│  │ friend@example.com                 │ [📧 Send]        │  │
│  │ Email Address                      │                  │  │
│  └────────────────────────────────────┴──────────────────┘  │
│                                                              │
│  5/20 invitations sent today                                │
│                                                              │
│  [✓ Success: Invitation sent to friend@example.com]         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**States:**
- **Default:** Email input empty, button disabled
- **Typing:** Real-time validation, error if invalid format
- **Valid:** Button enabled when email format valid
- **Loading:** Button shows spinner while sending
- **Success:** Green success alert, input clears
- **Error:** Red error alert with message
- **Rate Limited:** Button disabled, warning "20/20 invitations sent today"

**Material-UI Components:**
- Card, CardHeader, CardContent
- TextField (type="email")
- Button (contained, with EmailIcon)
- Alert (success/error)
- Typography (for description and rate limit)

### Email Template (Inbox View)

```
┌─────────────────────────────────────────────────────────────┐
│ From: La Maquina Prode Mundial <noreply@example.com>       │
│ Subject: John Doe invited you to join "Friends League"     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   You've been invited!                                      │
│                                                              │
│   Hi there,                                                 │
│                                                              │
│   John Doe has invited you to join the friend group        │
│   "Friends League".                                         │
│                                                              │
│   "Our friendly prediction competition for the World Cup"  │
│                                                              │
│                                                              │
│   ┌────────────────────────────┐                            │
│   │  Accept Invitation         │  ← Blue button (#1976d2)  │
│   └────────────────────────────┘                            │
│                                                              │
│   This invitation expires in 7 days.                        │
│                                                              │
│   If the button doesn't work, copy and paste this link:    │
│   https://example.com/.../join/abc?token=...               │
│                                                              │
│   ────────────────────────────────────────                 │
│                                                              │
│   This invitation was sent to friend@example.com.          │
│   If you received this in error, you can safely ignore it. │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Responsive Design:**
- Max-width: 600px (standard email width)
- Inline CSS (email clients don't support external CSS)
- Plain text fallback for email clients without HTML support

### Token Acceptance Flow (User Journey)

**Scenario 1: Valid Token, Logged In, Email Match**

```
User clicks link → Token validation → Success!
                                    ↓
        Redirect to group page with "✓ You've joined Friends League!"
```

**Scenario 2: Valid Token, Not Logged In**

```
User clicks link → Not authenticated → Redirect to login
                                       ↓
                   Login with correct email → Accept invitation
                                              ↓
                              Redirect to group page (success)
```

**Scenario 3: Email Mismatch**

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ⚠ Invitation Error                                         │
│                                                              │
│  This invitation was sent to friend@example.com.            │
│  Please log in with that account.                           │
│                                                              │
│  [← Go Back]                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Scenario 4: Expired/Invalid Token**

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  ⚠ Invitation Error                                         │
│                                                              │
│  This invitation link is invalid or has expired.            │
│                                                              │
│  [← Go Back]                                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Decisions & Clarifications

### Email Sending Strategy: Fire-and-Forget (Non-Blocking)

**Decision:** Use fire-and-forget pattern for email sending (same as existing join request notifications).

**Rationale:**
- Matches existing pattern in `prode-group-join-request-actions.ts`
- User experience is not blocked by email delivery delays
- Invitation record is created successfully regardless of email delivery
- Email failures are logged but don't block the user action

**Trade-off:** If email fails, admin sees "success" but email wasn't sent.

**Mitigation:** Could add a future enhancement for "Resend Email" button in Admin UI.

### Race Condition: Token Acceptance

**Scenario:** Same token clicked by two users/browsers simultaneously.

**Current Mitigation:**
- `acceptEmailInvitation()` uses `WHERE status = 'pending'` in UPDATE query
- First acceptance updates status to 'approved', second fails silently
- `findInvitationByToken()` checks `status = 'pending'`, so second lookup returns null
- Email validation ensures only intended recipient can accept

**Risk Level:** Low (requires simultaneous clicks + email access + login with correct email)

**Additional Safety:** Will add integration test to verify second acceptance fails gracefully.

### Invitation Expiration: On-Demand Validation

**Decision:** Check expiration at query time (in `findInvitationByToken()`), no cron job needed.

**Rationale:**
- `findInvitationByToken()` includes `WHERE token_expires_at > NOW()` filter
- Expired tokens are never returned, so they can't be accepted
- `expireOldInvitations()` function provided for optional cleanup, but not required
- Leaving expired records in DB is harmless (they're never matched)

**Optional Enhancement:** Could add admin UI to manually trigger `expireOldInvitations()` for cleanup, or run as nightly cron job.

### Missing Imports in Server Actions

**Required imports for `sendEmailInvitation`:**
```typescript
import { findParticipantsInGroup } from '@/app/db/prode-group-repository';
import { findUserByEmail } from '@/app/db/users-repository';
```

**Required imports for `acceptInvitationByToken`:**
```typescript
import { addParticipantToGroup, findProdeGroupById } from '@/app/db/prode-group-repository';
```

## Remaining Open Questions

1. **Invitation Tracking in Admin UI:** Should email invitations appear in the JoinRequestManager (alongside regular join requests), or should we create a separate "Sent Invitations" section?
   - **Option 1:** Show all requests together (join requests + email invitations) - Simpler, unified view
   - **Option 2:** Separate sections for "Join Requests" and "Email Invitations" - Clearer separation, matches original issue
   - **Recommendation:** Start with Option 1 (unified view), can enhance later if needed

2. **Resend Functionality:** Original issue mentions "resend invitation" - should we implement this in MVP?
   - **Option 1:** Skip resend for MVP (can manually create new invitation if needed)
   - **Option 2:** Add "Resend" button that creates new join request with new token
   - **Recommendation:** Skip for MVP, add as enhancement later if requested

## Risk Assessment

### Low Risk
- ✅ Email infrastructure already proven and tested
- ✅ Join request patterns well-established
- ✅ Repository patterns consistent with existing code
- ✅ i18n infrastructure mature

### Medium Risk
- ⚠️ Token security - Using crypto.randomUUID() (Node.js built-in, should be secure)
- ⚠️ Email validation - Need to ensure invited email matches logged-in user email
- ⚠️ Race conditions - Multiple accepts of same token (mitigated by status check)

### Mitigation
- Comprehensive unit tests for token validation
- Integration tests for race conditions
- Security review of token generation pattern

## Dependencies

- ✅ **Ticket 1 (Unified Join Request System)** - COMPLETED (join_requests table exists)
- ❌ **Ticket 2 (Public Groups Discovery)** - Not needed for this feature
- ✅ **Email infrastructure** - Already implemented (Nodemailer, templates, i18n)
- ✅ **Admin UI patterns** - Already established from Ticket 1

## Success Metrics

- **Functionality:** Admins can send email invitations successfully
- **User Experience:** Recipients can accept invitations with 1-click
- **Security:** No token exploitation or unauthorized access
- **Performance:** Email sending doesn't block user actions
- **Quality:** 80%+ test coverage, 0 SonarCloud issues
- **i18n:** Works in both English and Spanish

---

**Next Steps After Approval:**
1. Get user decision on Option A vs Option B for database approach
2. Clarify open questions
3. Execute implementation in phases (database → email → actions → UI)
4. Run validation checks before merge

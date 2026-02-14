# Story 1: Google OAuth Integration - Planning Context

## Research & Discovery

### Current Authentication Setup Analysis

**Current NextAuth.js v5 Configuration:**
- Using Credentials provider with email/password
- Email verification flow with tokens (24-hour expiration)
- Password reset flow with tokens (1-hour expiration)
- AWS SES for email sending
- Users table structure:
  - `password_hash` (currently REQUIRED - needs to become nullable)
  - `email_verified` boolean
  - `verification_token` and `verification_token_expiration`
  - `reset_token` and `reset_token_expiration`
  - `nickname` (nullable)

### OAuth Provider Research (NextAuth.js v5)

**Sources:**
- [NextAuth.js v5 Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [Google OAuth Configuration](https://next-auth.js.org/providers/google)
- [NextAuth.js with Next.js 15 Setup](https://codevoweb.com/how-to-set-up-next-js-15-with-nextauth-v5/)
- [NextAuth.js Social Logins Guide](https://blog.greenroots.info/nextjs-and-next-auth-v5-guide-to-social-logins)

**Key Findings:**

1. **NextAuth.js v5 Changes:**
   - Built on @auth/core with stricter OAuth/OIDC spec-compliance
   - Supports Google provider out-of-the-box
   - No need for Auth0 or third-party OAuth services
   - Minimum Next.js version: 14.0 (we're on 15.3 ✓)

2. **Google Provider Setup:**
   ```typescript
   import GoogleProvider from "next-auth/providers/google"

   providers: [
     GoogleProvider({
       clientId: process.env.GOOGLE_CLIENT_ID!,
       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
       authorization: {
         params: {
           prompt: "consent",
           access_type: "offline",
           response_type: "code"
         }
       }
     })
   ]
   ```

3. **Google Cloud Console Requirements:**
   - Create OAuth 2.0 credentials
   - Enable Google+ API
   - Configure authorized redirect URIs:
     - Dev: `http://localhost:3000/api/auth/callback/google`
     - Prod: `https://your-domain.com/api/auth/callback/google`
   - Copy Client ID and Secret to environment variables

4. **Security Features (Built-in):**
   - PKCE flow (automatic)
   - OAuth tokens NOT stored in database (only provider user ID)
   - Email verification automatic for OAuth users
   - httpOnly and secure session cookies

### Account Merging Strategy

**Decision: Merge accounts when email matches**

**Scenarios:**

1. **User has password account → Signs in with Google:**
   - Link Google OAuth to existing account
   - Keep all existing data (guesses, groups, etc.)
   - Add "google" to `auth_providers` array
   - User can now sign in with either method

2. **User has Google account → Tries to create password:**
   - Allow password creation
   - Add "credentials" to `auth_providers`
   - Set `password_hash`
   - User can now use both methods

3. **New user signs up with Google:**
   - Create new account with OAuth details
   - `password_hash` = NULL
   - `auth_providers` = ["google"]
   - `email_verified` = TRUE (Google verifies)
   - Require nickname setup (default to Google name)

### Progressive Disclosure UX Research

**Industry Standard:** Email-first approach (Gmail, Slack, Notion, etc.)

**Flow:**
```
Step 1: Email Input
┌─────────────────────────┐
│   Welcome to Prode      │
│                         │
│ Email: _____________    │
│      [Continue]         │
│                         │
│  ──── or ────          │
│  [Continue with Google] │
└─────────────────────────┘

Step 2: Show Auth Options (based on email)
┌─────────────────────────┐
│  user@example.com  [←]  │
│                         │
│ Password: __________    │
│       [Sign in]         │
│  [Forgot password?]     │
│                         │
│  ──── or ────          │
│  [Continue with Google] │ ← Only if linked
└─────────────────────────┘
```

**Benefits:**
- Reduces cognitive load (one decision at a time)
- System can customize options based on user's history
- Prevents duplicate accounts (check email first)
- Modern, expected UX pattern

### Database Schema Design

**New fields for users table:**

```sql
-- OAuth provider tracking (supports multiple providers)
auth_providers JSONB DEFAULT '["credentials"]'::jsonb
-- Structure: ["credentials", "google", "apple"]

-- OAuth account mappings
oauth_accounts JSONB DEFAULT '[]'::jsonb
-- Structure: [
--   {
--     provider: "google",
--     provider_user_id: "123456789",
--     email: "user@gmail.com",
--     connected_at: "2026-02-14T..."
--   }
-- ]

-- Nickname setup tracking
nickname_setup_required BOOLEAN DEFAULT FALSE

-- Make password optional
password_hash VARCHAR(255) NULL -- Changed from NOT NULL
```

**Why JSONB arrays?**
- Flexible: Easy to add new providers (Apple, Microsoft, etc.)
- Queryable: Can use GIN index for fast lookups
- Atomic: One field update vs. multiple columns
- Future-proof: No schema changes for new providers

### Nickname Setup Flow

**Requirement:** First-time OAuth users must set a nickname

**Flow:**
1. User completes Google OAuth
2. System checks `nickname` field
3. If NULL or user doesn't have nickname yet:
   - Show nickname setup dialog (cannot be dismissed)
   - Pre-fill with Google display name
   - User can edit before saving
4. Set `nickname_setup_required = FALSE`
5. Update session with nickname
6. Allow user to continue

**Why required?**
- Consistent UX: All users have display names
- Group participation: Nickname shown in leaderboards
- Prevents generic "user@gmail.com" in UI

### Password Reset Flow Changes

**Problem:** Users with OAuth-only accounts don't have passwords

**Solution:**
```typescript
async function sendPasswordResetLink(email: string) {
  const user = await findUserByEmail(email);
  const authMethods = checkAuthMethods(user);

  if (!authMethods.includes('password')) {
    // OAuth-only user
    const providerName = authMethods.includes('google') ? 'Google' : 'tu cuenta';
    throw new Error(
      `Tu cuenta usa inicio de sesión con ${providerName}. ` +
      `Por favor, usa el botón "Continuar con Google" para iniciar sesión.`
    );
  }

  // Has password, send reset email normally
  await sendResetEmail(user);
}
```

### Technical Implementation Details

**Repository Functions (new):**

1. `findUserByOAuthAccount(provider, providerUserId)` - Find user by OAuth mapping
2. `linkOAuthAccount(userId, oauthAccount)` - Add OAuth account to existing user
3. `createOAuthUser(email, oauthAccount, nickname)` - Create new OAuth user
4. `userHasPasswordAuth(userId)` - Check if user has password

**Server Actions (new file: oauth-actions.ts):**

1. `handleGoogleOAuth()` - Main OAuth handler
   - Check if OAuth account exists (sign in)
   - Check if email exists (merge accounts)
   - Create new user if neither
   - Return action taken: 'signin', 'merged', or 'signup'

2. `checkAuthMethodsForEmail()` - Progressive disclosure helper
   - Return available auth methods for email
   - Used to customize login UI

3. `updateNicknameAfterOAuth()` - Complete OAuth signup
   - Update nickname after setup dialog
   - Clear `nickname_setup_required` flag

**UI Components (new/updated):**

1. **EmailInputForm.tsx** (NEW)
   - Initial email input with Google button
   - Calls `checkAuthMethodsForEmail()`
   - Triggers appropriate next step

2. **LoginForm.tsx** (UPDATED)
   - Receives email and available methods
   - Shows password field if user has password
   - Shows Google button if user has Google linked
   - Shows "Cambiar" link to go back

3. **NicknameSetupDialog.tsx** (NEW)
   - Modal dialog (cannot dismiss)
   - Pre-filled with Google display name
   - Validates nickname (2-50 chars)
   - Calls `updateNicknameAfterOAuth()`

4. **ForgotPasswordForm.tsx** (UPDATED)
   - Check auth methods before sending reset
   - Show error if OAuth-only account
   - Suggest using OAuth sign-in

### Environment Variables Required

```bash
# .env.local additions

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx

# Existing (already configured)
NEXTAUTH_SECRET=xxxxx
NEXTAUTH_URL=http://localhost:3000  # or production URL
DATABASE_URL=xxxxx
SMTP_* (AWS SES configured)
```

### Migration Strategy

**Step 1: Database Migration**
```sql
-- Make password_hash nullable
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add OAuth fields
ALTER TABLE users ADD COLUMN auth_providers JSONB DEFAULT '["credentials"]'::jsonb;
ALTER TABLE users ADD COLUMN oauth_accounts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE users ADD COLUMN nickname_setup_required BOOLEAN DEFAULT FALSE;

-- Create indexes
CREATE INDEX idx_users_oauth_accounts ON users USING GIN (oauth_accounts);

-- Update existing users
UPDATE users SET auth_providers = '["credentials"]'::jsonb WHERE auth_providers IS NULL;
```

**Step 2: Data Migration**
- All existing users automatically get `auth_providers: ["credentials"]`
- No data loss
- Existing passwords continue to work
- Existing users can link Google accounts later

**Step 3: Code Deployment**
- Deploy new auth.ts configuration
- Deploy new repository functions
- Deploy new server actions
- Deploy new/updated UI components

### Testing Strategy

**Unit Tests:**
- Repository functions (mock Kysely)
- OAuth handler logic (mock database)
- Auth method checking
- Nickname validation

**Integration Tests:**
- Google OAuth flow (mock Google API)
- Account merging scenarios
- Progressive disclosure logic
- Password reset with OAuth accounts

**Manual Testing Checklist:**
- [ ] New user Google sign-up
- [ ] Existing password user → Google merge
- [ ] Progressive disclosure shows correct options
- [ ] Nickname setup flow
- [ ] Password reset error for OAuth-only users
- [ ] Sign in with password after merge
- [ ] Sign in with Google after merge

### Security Considerations

1. **OAuth Token Storage:**
   - DO NOT store access tokens or refresh tokens
   - Only store provider user ID (enough for identity)
   - NextAuth handles OAuth flow securely

2. **Email Verification:**
   - OAuth users auto-verified (Google verifies)
   - Skip email verification for OAuth sign-ups
   - Set `email_verified = TRUE`

3. **Account Merging:**
   - Only merge if emails match exactly
   - Case-insensitive comparison (citext)
   - Audit log merge actions (optional)

4. **Rate Limiting:**
   - OAuth attempts rate-limited by NextAuth
   - Consider additional rate limiting on auth routes

### Performance Considerations

1. **Database Queries:**
   - GIN index on `oauth_accounts` for fast OAuth lookups
   - Index on `email` already exists (citext)
   - Account merge: 1 UPDATE query

2. **OAuth Flow:**
   - Google redirect adds ~500ms latency
   - Acceptable for auth flow
   - No impact on existing password auth

3. **Session Size:**
   - Add `nickname_setup_required` to JWT token
   - Minimal size increase (<50 bytes)

### Error Handling

**Possible Errors:**

1. **Google OAuth fails:**
   - Show user-friendly error
   - Log technical details server-side
   - Suggest trying again or using password

2. **Account merge fails:**
   - Rollback transaction
   - Show error message
   - Don't link OAuth account

3. **Nickname setup fails:**
   - Allow retry
   - Keep dialog open
   - Don't complete sign-in

4. **Email mismatch:**
   - Google email ≠ account email
   - Should not happen (email is primary key)
   - Log as warning, use Google email

### Rollback Plan

**If critical issues found:**

1. Disable Google provider in `auth.ts`
2. Existing users still work with passwords
3. No data corruption (password_hash nullable OK)
4. Can re-enable after fixes

### Future Enhancements (Out of Scope)

- Apple Sign-In (requires Apple Developer account)
- Microsoft OAuth
- Account unlinking (remove OAuth provider)
- Add password to OAuth-only account
- Social profile sync (avatar, etc.)
- Multiple emails per account

### Dependencies

**External:**
- Google Cloud Console OAuth credentials
- `@mui/icons-material` for Google icon

**Internal:**
- NextAuth.js v5 (already installed)
- AWS SES (already configured)
- Kysely ORM (already used)

### Implementation Checklist

**Phase 1: Backend**
- [ ] Create migration file
- [ ] Update TypeScript types
- [ ] Add repository functions with tests
- [ ] Create oauth-actions.ts with tests
- [ ] Update auth.ts configuration

**Phase 2: Frontend**
- [ ] Install @mui/icons-material
- [ ] Create EmailInputForm component
- [ ] Update LoginForm component
- [ ] Create NicknameSetupDialog component
- [ ] Update ForgotPasswordForm component
- [ ] Update LoginOrSignupDialog orchestration

**Phase 3: Testing**
- [ ] Write unit tests (80%+ coverage)
- [ ] Write integration tests
- [ ] Manual testing checklist
- [ ] Test in Vercel Preview

**Phase 4: Documentation**
- [ ] Update README with OAuth setup steps
- [ ] Document Google Cloud Console setup
- [ ] Add environment variable docs
- [ ] Update architecture docs

### Success Metrics

**Adoption:**
- % of sign-ups using Google OAuth
- % of existing users linking Google

**Performance:**
- Google OAuth sign-in time < 3 seconds
- Account merge time < 500ms
- No increase in failed sign-ins

**Quality:**
- 0 new SonarCloud issues
- 80%+ test coverage
- 0 critical bugs in first week

---

## Quick Reference

**Key Files to Create:**
- `migrations/20260214000000_add_oauth_support.sql`
- `app/actions/oauth-actions.ts`
- `app/components/auth/email-input-form.tsx`
- `app/components/auth/nickname-setup-dialog.tsx`

**Key Files to Update:**
- `auth.ts` - Add Google provider
- `app/db/tables-definition.ts` - Update UserTable interface
- `app/db/users-repository.ts` - Add OAuth functions
- `app/components/auth/login-form.tsx` - Progressive disclosure
- `app/components/auth/login-or-signup-dialog.tsx` - New states
- `app/components/auth/forgot-password-form.tsx` - OAuth check

**Environment Variables:**
```bash
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

**Testing Priority:**
1. New user Google sign-up → Nickname setup
2. Existing user Google merge → Both methods work
3. Progressive disclosure → Correct options shown
4. Password reset → Error for OAuth-only users

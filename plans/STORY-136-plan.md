# Implementation Plan: Google OAuth Integration with Account Merging and Progressive Disclosure

## Story Context

**Issue:** #136 - Google OAuth Integration with Account Merging and Progressive Disclosure
**Epic:** Enhanced Authentication Options

### Objectives

Implement Google OAuth authentication with:
- Progressive disclosure UX (email-first flow)
- Account merging for existing users
- Nickname setup for first-time OAuth users
- Updated password reset flow for OAuth-only accounts

### Business Value

- Reduces signup friction (users more likely to sign up with OAuth)
- Reduces password reset support requests
- Aligns with modern authentication standards
- Increases conversion rates

## Acceptance Criteria

✅ **Progressive Disclosure:**
- Login dialog shows only email input + "Continue with Google" button initially
- After email entered, system checks available auth methods and customizes options
- User can go back to change email

✅ **Google OAuth Sign-In:**
- Existing users sign in automatically after Google authorization
- Session includes all user data from database

✅ **Google OAuth Sign-Up (New Users):**
- Account created automatically with email verified
- Nickname setup dialog appears (cannot be dismissed)
- Google display name pre-filled as default
- User can edit nickname before saving

✅ **Account Merging:**
- Existing password user signs in with Google → Accounts merged
- User can now sign in with either method
- All existing data preserved
- Confirmation message shown

✅ **Password Reset Updates:**
- OAuth-only users cannot request password reset
- System shows error suggesting OAuth sign-in

✅ **Security & Data Integrity:**
- OAuth tokens NOT stored in database
- Email verification automatic for OAuth users
- No data loss during account merging

## Technical Approach

### Database Schema Changes

**Updated UserTable interface:**
```typescript
export interface UserTable extends Identifiable {
  email: string
  nickname: string | null
  password_hash: string | null  // Changed from NOT NULL
  is_admin?: boolean
  reset_token?: string | null
  reset_token_expiration?: Date | null
  email_verified?: boolean
  verification_token?: string | null
  verification_token_expiration?: Date | null
  notification_subscriptions?: JSONColumnType<PushSubscription[]> | null
  onboarding_completed?: boolean
  onboarding_completed_at?: Date | null
  onboarding_data?: JSONColumnType<OnboardingData> | null

  // NEW FIELDS
  auth_providers?: JSONColumnType<string[]> | null  // ["credentials", "google"]
  oauth_accounts?: JSONColumnType<OAuthAccount[]> | null
  nickname_setup_required?: boolean
}

export interface OAuthAccount {
  provider: string  // "google"
  provider_user_id: string  // Google user ID
  email: string  // Email from OAuth provider
  connected_at: string  // ISO date string
}
```

### TypeScript Session Type Extensions

**File:** `auth.ts` or new `types/next-auth.d.ts`

Extend NextAuth types to include custom fields:

```typescript
import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      nickname: string | null
      isAdmin: boolean
      emailVerified: boolean
      nicknameSetupRequired: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    nickname: string | null
    isAdmin: boolean
    emailVerified: boolean
    nicknameSetupRequired: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    nickname: string | null
    isAdmin: boolean
    emailVerified: boolean
    nicknameSetupRequired: boolean
  }
}
```

**Migration strategy:**
1. Make `password_hash` nullable (existing users keep passwords)
2. Add `auth_providers` with default `'["credentials"]'::jsonb`
3. Add `oauth_accounts` with default `'[]'::jsonb`
4. Add `nickname_setup_required` with default `FALSE`
5. Create GIN index on `oauth_accounts` for fast lookups
6. Backfill existing users: `UPDATE users SET auth_providers = '["credentials"]'::jsonb WHERE password_hash IS NOT NULL AND auth_providers IS NULL`

**Auth provider logic:**
- User has password auth IF: `password_hash IS NOT NULL` OR `"credentials" IN auth_providers`
- Prefer checking `password_hash IS NOT NULL` for simplicity (source of truth)
- `auth_providers` array is supplementary tracking for multi-provider scenarios

### Architecture: Server vs Client Components

**Server Components (auth.ts, repositories, actions):**
- NextAuth.js configuration with Google provider
- Database operations for OAuth account linking
- Auth method checking logic
- Nickname updates

**Client Components (UI):**
- EmailInputForm (new)
- LoginForm (updated for progressive disclosure)
- NicknameSetupDialog (new)
- LoginOrSignupDialog (orchestration updates)
- ForgotPasswordForm (OAuth check)

**Data flow:**
```
Client: EmailInputForm → Server Action: checkAuthMethodsForEmail()
Client: LoginForm (show password/Google based on response)
User clicks "Continue with Google" → NextAuth Google provider
Server: Google callback → Check OAuth account exists
  → If exists: Sign in
  → If email exists: Merge accounts
  → If new: Create user + require nickname setup
Client: NicknameSetupDialog (if nickname_setup_required)
Server Action: updateNicknameAfterOAuth() → Complete setup
```

### New Repository Functions

**File:** `app/db/users-repository.ts`

```typescript
// Find user by OAuth provider account
export async function findUserByOAuthAccount(
  provider: string,
  providerUserId: string
): Promise<User | undefined> {
  // Query oauth_accounts JSONB array for matching provider + provider_user_id
  // Use JSONB containment operator or jsonb_array_elements
}

// Link OAuth account to existing user (atomic update)
export async function linkOAuthAccount(
  userId: string,
  oauthAccount: OAuthAccount
): Promise<User> {
  // Use UPDATE with JSONB append operators
  // Add provider to auth_providers if not exists
  // Append oauthAccount to oauth_accounts array
  // Return updated user or throw on failure
}

// Create new OAuth user (atomic insert)
export async function createOAuthUser(
  email: string,
  oauthAccount: OAuthAccount,
  displayName: string | null
): Promise<User> {
  // INSERT new user with:
  //   - email_verified: true
  //   - password_hash: null
  //   - auth_providers: [oauthAccount.provider]
  //   - oauth_accounts: [oauthAccount]
  //   - nickname_setup_required: true if displayName is null/empty
  //   - nickname: displayName (or null if not provided)
  // Use RETURNING to get created user
}

// Check available auth methods for email (for progressive disclosure)
export async function getAuthMethodsForEmail(
  email: string
): Promise<{ hasPassword: boolean; hasGoogle: boolean; userExists: boolean }> {
  // Find user by email
  // Return: hasPassword (password_hash IS NOT NULL), hasGoogle (check oauth_accounts)
}

// Get auth providers array for user (utility)
export function getAuthProviders(user: User): string[] {
  return user.auth_providers || []
}

// Check if user has password auth (utility)
export function userHasPasswordAuth(user: User): boolean {
  return user.password_hash !== null && user.password_hash !== undefined
}
```

### New Server Actions

**File:** `app/actions/oauth-actions.ts`

```typescript
'use server'

import { auth } from '../../auth'
import { findUserByEmail, checkAuthMethods, updateUser } from '../db/users-repository'

// Progressive disclosure: Check what auth methods are available for email
export async function checkAuthMethodsForEmail(email: string): Promise<{
  email: string
  hasPassword: boolean
  hasGoogle: boolean
  userExists: boolean
}> {
  // Call getAuthMethodsForEmail() from repository
  // Return formatted response
}

// Update nickname after OAuth signup
export async function updateNicknameAfterOAuth(nickname: string): Promise<{
  success: boolean
  error?: string
}>

// Get current session info including nickname_setup_required flag
export async function getSessionInfo(): Promise<{
  user: SessionUser | null
  needsNicknameSetup: boolean
}>
```

### Updated Server Actions

**File:** `app/actions/user-actions.ts`

Update `sendPasswordResetLink()`:
```typescript
export async function sendPasswordResetLink(email: string) {
  const user = await findUserByEmail(email);

  if (!user) {
    return { success: false, error: 'No existe un usuario con ese e-mail' };
  }

  // NEW: Check if user has password auth
  const authMethods = checkAuthMethods(user);

  if (!authMethods.hasPassword) {
    // OAuth-only user
    const providerName = authMethods.hasGoogle ? 'Google' : 'tu proveedor OAuth';
    return {
      success: false,
      error: `Tu cuenta usa inicio de sesión con ${providerName}. Por favor, usa el botón "Continuar con Google" para iniciar sesión.`
    };
  }

  // Has password, proceed with reset flow...
  // (existing code)
}
```

### NextAuth.js Configuration

**File:** `auth.ts`

```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import {
  findUserByEmail,
  findUserByOAuthAccount,
  linkOAuthAccount,
  createOAuthUser,
  getPasswordHash,
  userHasPasswordAuth
} from "./app/db/users-repository"

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: '/?openSignin=true',
    signOut: '/'
  },
  providers: [
    CredentialsProvider({
      // ... existing credentials provider code
    }),

    // NEW: Google OAuth Provider
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
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        try {
          // Handle Google OAuth sign-in/sign-up/merge
          const oauthAccount: OAuthAccount = {
            provider: 'google',
            provider_user_id: account.providerAccountId,
            email: user.email!,
            connected_at: new Date().toISOString()
          }

          // Check if OAuth account already exists
          const existingOAuthUser = await findUserByOAuthAccount('google', account.providerAccountId)
          if (existingOAuthUser) {
            // User exists with this Google account - sign in
            return true
          }

          // Check if email exists (account merge scenario)
          const existingEmailUser = await findUserByEmail(user.email!)
          if (existingEmailUser) {
            // Merge: Link Google account to existing user
            // linkOAuthAccount is atomic (single UPDATE query)
            await linkOAuthAccount(existingEmailUser.id, oauthAccount)
            return true
          }

          // New user - create OAuth account
          // Fallback for missing Google display name
          const displayName = profile?.name || user.name || null
          // createOAuthUser is atomic (single INSERT query)
          await createOAuthUser(user.email!, oauthAccount, displayName)
          return true
        } catch (error) {
          console.error('OAuth sign-in error:', error)
          // Return false to show error page
          return false
        }
      }

      return true
    },

    session: ({ session, token }) => {
      // Populate session from JWT token
      session.user = {
        ...session.user,
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        nickname: token.nickname as string | null,
        isAdmin: token.isAdmin as boolean,
        emailVerified: token.emailVerified as boolean,
        nicknameSetupRequired: token.nicknameSetupRequired as boolean
      }
      return session
    },

    jwt: async ({ token, user, trigger, session }) => {
      // Initial sign-in or token refresh
      if (user) {
        // Load fresh user data from database
        const dbUser = await findUserByEmail(user.email!)
        if (dbUser) {
          // Explicitly set all required token fields
          token.id = dbUser.id
          token.email = dbUser.email
          token.name = dbUser.nickname || dbUser.email
          token.nickname = dbUser.nickname
          token.isAdmin = dbUser.is_admin || false
          token.emailVerified = dbUser.email_verified || false
          token.nicknameSetupRequired = dbUser.nickname_setup_required || false
        }
      }

      // Session update (e.g., after nickname setup)
      if (trigger === 'update' && session) {
        // Merge session updates into token
        token = {
          ...token,
          ...session,
          nicknameSetupRequired: session.nicknameSetupRequired ?? token.nicknameSetupRequired
        }
      }

      return token
    }
  }
})
```

### UI Components

#### 1. EmailInputForm (NEW)

**File:** `app/components/auth/email-input-form.tsx`

Progressive disclosure first step - email input with Google button.

**Component structure:**
```tsx
'use client'

export default function EmailInputForm({
  onEmailSubmit
}: {
  onEmailSubmit: (email: string, authMethods: AuthMethods) => void
}) {
  // Email input field
  // "Continuar" button → calls checkAuthMethodsForEmail()
  // Divider "o"
  // "Continuar con Google" button → NextAuth Google sign-in
}
```

**States:**
- Loading (checking email)
- Error (invalid email)
- Success (proceed to next step)

#### 2. LoginForm (UPDATED)

**File:** `app/components/auth/login-form.tsx`

Update to receive email and available auth methods from EmailInputForm.

**New props:**
```tsx
type LoginFormProps = {
  email: string  // Pre-filled from EmailInputForm
  authMethods: { hasPassword: boolean; hasGoogle: boolean }
  onSuccess: () => void
  onBack: () => void  // Go back to email input
}
```

**UI updates:**
- Show email with "Cambiar" link (calls onBack)
- Show password field if `authMethods.hasPassword`
- Show "Continuar con Google" if `authMethods.hasGoogle`
- Show "¿Olvidaste tu contraseña?" if has password

#### 3. NicknameSetupDialog (NEW)

**File:** `app/components/auth/nickname-setup-dialog.tsx`

Modal dialog for nickname setup after OAuth signup.

**Component structure:**
```tsx
'use client'

export default function NicknameSetupDialog({
  open,
  defaultNickname,
  onComplete
}: {
  open: boolean
  defaultNickname: string | null  // Can be null if Google doesn't provide name
  onComplete: () => void
}) {
  // Modal dialog (cannot dismiss - no onClose, no backdrop click)
  // Text: "Para completar tu registro, elige un apodo"
  // TextField with defaultNickname pre-filled (or empty if null)
  // Validation: 2-50 characters, required
  // "Guardar" button → calls updateNicknameAfterOAuth()
  // Updates session with new nickname (trigger: 'update')
  // Calls onComplete() on success
}
```

**Validation & Edge Cases:**
- Required (2-50 characters)
- Cannot be dismissed without saving
- If Google display name is null/empty → Show empty field with placeholder "Ingresa tu apodo"
- If defaultNickname provided → Pre-fill but allow editing
- Show helper text: "Este nombre se mostrará en grupos y tablas"

#### 4. LoginOrSignupDialog (UPDATED)

**File:** `app/components/auth/login-or-signup-dialog.tsx`

Update orchestration to support progressive disclosure and nickname setup.

**New dialog modes:**
```typescript
type DialogMode =
  | 'emailInput'  // NEW: Email-first step
  | 'login'  // Updated: Receives email + auth methods
  | 'signup'
  | 'forgotPassword'
  | 'resetSent'
  | 'verificationSent'
  | 'nicknameSetup'  // NEW: OAuth nickname setup
```

**State management:**
```typescript
const [dialogMode, setDialogMode] = useState<DialogMode>('emailInput')
const [email, setEmail] = useState<string>('')
const [authMethods, setAuthMethods] = useState<{
  hasPassword: boolean
  hasGoogle: boolean
} | null>(null)
```

**Flow:**
1. Start with `emailInput` mode
2. User enters email → Call `checkAuthMethodsForEmail()` → Store result in state
3. Switch to `login` mode, pass email + authMethods as props
4. User signs in with Google → NextAuth callback handles sign-in/sign-up/merge
5. After redirect back, check session for `nicknameSetupRequired`
6. If true → Show `nicknameSetup` mode
7. Complete nickname → Close dialog

**Checking for nickname setup requirement:**
```typescript
useEffect(() => {
  async function checkNicknameSetup() {
    const sessionInfo = await getSessionInfo()
    if (sessionInfo.needsNicknameSetup) {
      setDialogMode('nicknameSetup')
    }
  }
  checkNicknameSetup()
}, [])
```

#### 5. ForgotPasswordForm (UPDATED)

**File:** `app/components/auth/forgot-password-form.tsx`

Update to check for OAuth-only accounts before sending reset email.

**Changes:**
- Call updated `sendPasswordResetLink()` action
- Display OAuth-specific error message if returned
- Suggest using "Continuar con Google" button

### Visual Prototypes

#### Progressive Disclosure Flow

```
┌────────────────────────────────────┐
│         Bienvenido a Prode         │
├────────────────────────────────────┤
│                                    │
│  E-Mail: [____________________]    │
│                                    │
│          [Continuar]               │
│                                    │
│          ──── o ────               │
│                                    │
│    [🔵 Continuar con Google]      │
│                                    │
└────────────────────────────────────┘

↓ User enters email and clicks "Continuar"

┌────────────────────────────────────┐
│            Ingresar                │
├────────────────────────────────────┤
│                                    │
│  📧 user@example.com  [Cambiar]    │
│                                    │
│  Contraseña: [________________]    │
│                                    │
│          [Ingresar]                │
│                                    │
│      ¿Olvidaste tu contraseña?     │
│                                    │
│          ──── o ────               │
│                                    │
│    [🔵 Continuar con Google]      │
│                                    │
└────────────────────────────────────┘

↓ If no password auth, only Google shown

┌────────────────────────────────────┐
│            Ingresar                │
├────────────────────────────────────┤
│                                    │
│  📧 user@example.com  [Cambiar]    │
│                                    │
│    [🔵 Continuar con Google]      │
│                                    │
│  (Tu cuenta usa Google Sign-In)    │
│                                    │
└────────────────────────────────────┘
```

#### Nickname Setup Dialog

```
┌────────────────────────────────────┐
│  Completa tu Registro              │
├────────────────────────────────────┤
│                                    │
│  Para completar tu registro,       │
│  elige un apodo:                   │
│                                    │
│  Apodo: [John Doe_____________]    │
│         ^ Pre-filled from Google   │
│                                    │
│  (Este nombre se mostrará en los   │
│   grupos y tablas de posiciones)   │
│                                    │
│               [Guardar]            │
│                                    │
└────────────────────────────────────┘

Note: Dialog cannot be dismissed
```

#### Password Reset Error

```
┌────────────────────────────────────┐
│       Recuperar Contraseña         │
├────────────────────────────────────┤
│                                    │
│  ⚠️ Tu cuenta usa inicio de        │
│     sesión con Google.             │
│                                    │
│  Por favor, usa el botón           │
│  "Continuar con Google" para       │
│  iniciar sesión.                   │
│                                    │
│          [Volver]                  │
│                                    │
└────────────────────────────────────┘
```

## Implementation Steps

### Phase 1: Backend - Database & Repository

**Files to create:**
- `migrations/20260214000000_add_oauth_support.sql`
- `types/next-auth.d.ts` (TypeScript session extensions)

**Files to update:**
- `app/db/tables-definition.ts` (UserTable interface + OAuthAccount interface)
- `app/db/users-repository.ts` (new OAuth functions)

**Steps:**
1. Create migration file with schema changes (nullable password_hash, new JSONB fields, GIN index)
2. **🛑 CRITICAL: DO NOT RUN MIGRATION YET** - Wait for user permission (see Phase 1.5)
3. Update UserTable TypeScript interface with new nullable/optional fields
4. Add OAuthAccount interface to tables-definition.ts
5. Create NextAuth type extensions in types/next-auth.d.ts
6. Add `findUserByOAuthAccount()` function (query JSONB array)
7. Add `linkOAuthAccount()` function (atomic UPDATE with JSONB append)
8. Add `createOAuthUser()` function (atomic INSERT with RETURNING)
9. Add `getAuthMethodsForEmail()` function (for progressive disclosure)
10. Add `getAuthProviders()` helper
11. Add `userHasPasswordAuth()` helper

**Testing:**
- Unit tests for all new repository functions
- Mock Kysely queries with JSONB operations
- Test account merge scenarios (linkOAuthAccount atomicity)
- Test OAuth account lookup with various provider_user_id values
- Test getAuthMethodsForEmail with different user states

**Dependencies:** Phase 2 depends on Phase 1 completing (auth.ts needs repository functions)

### Phase 1.5: Database Migration Execution (MANDATORY GATE)

**🛑 CRITICAL: USER PERMISSION REQUIRED**

Before proceeding to Phase 2, **STOP and ask user for permission** to run the database migration.

**Steps:**
1. Show user the migration SQL file contents
2. Explain changes:
   - Makes password_hash nullable (backwards-compatible)
   - Adds auth_providers, oauth_accounts, nickname_setup_required fields
   - Backfills existing users with auth_providers = ["credentials"]
   - Creates GIN index for fast OAuth lookups
3. Ask: "May I run this migration on the database?"
4. If approved → Run migration: `psql $DATABASE_URL -f migrations/20260214000000_add_oauth_support.sql`
5. Verify migration success: `SELECT auth_providers, oauth_accounts FROM users LIMIT 1;`
6. If migration fails → STOP, rollback if needed, investigate error
7. Only proceed to Phase 2 after successful migration

**Why this gate is critical:**
- Database schema changes are irreversible without rollback
- User should be aware of structural changes
- Follows CLAUDE.md guideline: "ALWAYS ask permission before running migrations"

### Phase 2: Backend - Auth Configuration & Actions

**🛑 PREREQUISITE: Phase 1 + Phase 1.5 must be complete**

**Files to create:**
- `app/actions/oauth-actions.ts`

**Files to update:**
- `auth.ts` (add Google provider)
- `app/actions/user-actions.ts` (update `sendPasswordResetLink`)

**Steps:**
1. Install `@mui/icons-material` for Google icon
2. Add Google provider to auth.ts
3. Implement signIn callback for OAuth handling
4. Update JWT callback to include `nicknameSetupRequired`
5. Create `oauth-actions.ts` with:
   - `checkAuthMethodsForEmail()`
   - `updateNicknameAfterOAuth()`
   - `getSessionInfo()`
6. Update `sendPasswordResetLink()` with OAuth check

**Testing:**
- Unit tests for OAuth actions
- Mock NextAuth callbacks
- Test account merge logic
- Test nickname update flow

### Phase 3: Frontend - New Components

**Files to create:**
- `app/components/auth/email-input-form.tsx`
- `app/components/auth/nickname-setup-dialog.tsx`

**Steps:**
1. Create `EmailInputForm` component:
   - Email validation
   - Google sign-in button
   - Call `checkAuthMethodsForEmail()`
   - Material-UI styling
2. Create `NicknameSetupDialog` component:
   - Modal dialog (cannot dismiss)
   - Pre-filled nickname from Google
   - Validation (2-50 chars, required)
   - Call `updateNicknameAfterOAuth()`

**Testing:**
- Unit tests for both components
- Mock server actions
- Test form validation
- Test Google button click
- Test nickname submission

### Phase 4: Frontend - Update Existing Components

**Files to update:**
- `app/components/auth/login-or-signup-dialog.tsx`
- `app/components/auth/login-form.tsx`
- `app/components/auth/forgot-password-form.tsx`

**Steps:**
1. Update `LoginOrSignupDialog`:
   - Add `emailInput` mode
   - Add `nicknameSetup` mode
   - Update orchestration flow
   - Handle OAuth sign-in callback
2. Update `LoginForm`:
   - Accept email prop (pre-filled)
   - Accept authMethods prop
   - Conditionally show password/Google
   - Add "Cambiar" link to go back
3. Update `ForgotPasswordForm`:
   - Handle OAuth-only error
   - Display appropriate message
   - Suggest Google sign-in

**Testing:**
- Unit tests for updated components
- Test progressive disclosure flow
- Test mode transitions
- Test nickname setup integration
- Test password reset error handling

### Phase 5: Integration & End-to-End Testing

**Manual testing checklist:**
1. New user Google sign-up → Nickname setup → Sign-in
2. Existing password user → Google sign-in → Account merge → Both methods work
3. Progressive disclosure shows correct options for each user type
4. Password reset error for OAuth-only users
5. Sign out/sign in with different methods
6. Mobile responsive testing

**Integration tests:**
- Full OAuth flow (mock Google API)
- Account merging scenarios
- Progressive disclosure logic
- Password reset with OAuth accounts
- Session management

**Environment setup:**
1. Configure Google Cloud Console OAuth credentials
2. Add environment variables to `.env.local`:
   ```bash
   GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxx
   ```
3. Configure redirect URIs (dev + prod)

## Testing Strategy

### Unit Tests (80%+ coverage)

**Repository tests:**
- `findUserByOAuthAccount()` - Finds user by provider + provider_user_id
- `linkOAuthAccount()` - Adds OAuth account to existing user
- `createOAuthUser()` - Creates new user with OAuth details
- `checkAuthMethods()` - Returns correct auth methods
- `userHasPasswordAuth()` - Checks password_hash existence

**Action tests:**
- `checkAuthMethodsForEmail()` - Returns auth methods for email
- `updateNicknameAfterOAuth()` - Updates nickname and clears flag
- Updated `sendPasswordResetLink()` - Blocks OAuth-only users

**Component tests:**
- `EmailInputForm` - Email validation, Google button click
- `NicknameSetupDialog` - Form validation, submission
- `LoginForm` - Progressive disclosure rendering
- `LoginOrSignupDialog` - Mode transitions
- `ForgotPasswordForm` - OAuth error handling

### Integration Tests

**OAuth flow scenarios:**
1. New user Google sign-up → Account created with email verified
2. Existing password user Google sign-in → Accounts merged
3. Existing Google user sign-in → Direct sign-in
4. Progressive disclosure → Correct options shown

**Edge cases:**
- Google email doesn't match (shouldn't happen - email is key)
- Nickname update fails → Dialog stays open
- OAuth callback error → User-friendly message

### Manual Testing in Vercel Preview

After deployment to Vercel Preview:
1. Test Google OAuth consent screen
2. Verify redirect URIs work correctly
3. Test account merge with real Google account
4. Verify session persistence
5. Test on mobile devices (responsive)
6. Test browser back button behavior

## Files to Create

1. `migrations/20260214000000_add_oauth_support.sql` - Database schema changes
2. `app/actions/oauth-actions.ts` - OAuth-specific server actions
3. `app/components/auth/email-input-form.tsx` - Progressive disclosure first step
4. `app/components/auth/nickname-setup-dialog.tsx` - OAuth nickname setup

## Files to Modify

1. `app/db/tables-definition.ts` - Update UserTable interface with OAuth fields
2. `app/db/users-repository.ts` - Add OAuth repository functions
3. `auth.ts` - Add Google provider and callbacks
4. `app/actions/user-actions.ts` - Update password reset logic
5. `app/components/auth/login-or-signup-dialog.tsx` - Add progressive disclosure modes
6. `app/components/auth/login-form.tsx` - Support progressive disclosure props
7. `app/components/auth/forgot-password-form.tsx` - Handle OAuth-only users

## Dependencies

**NPM packages:**
```bash
npm install @mui/icons-material
```

**External setup:**
- Google Cloud Console OAuth 2.0 credentials
- Configure redirect URIs for dev + prod

**Environment variables:**
```bash
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
```

## Error Handling

### OAuth Flow Errors

**Google OAuth token exchange failure:**
```typescript
// In signIn callback - return false shows NextAuth error page
try {
  // ... OAuth logic
} catch (error) {
  console.error('OAuth sign-in error:', error)
  return false  // Shows /auth/error page
}
```

**Missing Google profile data:**
- If `profile.name` is undefined → `displayName = null`
- `createOAuthUser()` handles null displayName:
  - Sets `nickname_setup_required: true`
  - Sets `nickname: null`
  - Forces nickname dialog after sign-in

**Account merge failures:**
- `linkOAuthAccount()` throws if UPDATE fails
- Caught in signIn callback → return false
- User sees error page, can retry sign-in

**Nickname update failures:**
- `updateNicknameAfterOAuth()` returns `{ success: false, error: string }`
- Dialog shows error message
- Dialog remains open, user can retry

### Environment Variable Checks

**Missing OAuth credentials:**
```typescript
// In auth.ts
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  console.warn('Google OAuth credentials missing - OAuth sign-in disabled')
  // Don't add GoogleProvider if credentials missing
}
```

### Progressive Disclosure Errors

**Email check fails:**
- `checkAuthMethodsForEmail()` catches repository errors
- Returns default: `{ userExists: false, hasPassword: false, hasGoogle: false }`
- Allows user to proceed with signup flow

## Security Considerations

1. **OAuth Token Storage:** Only store provider user ID, not access/refresh tokens
2. **Email Verification:** OAuth users auto-verified (Google verifies)
3. **Account Merging:** Only merge if emails match exactly (case-insensitive with citext)
4. **Rate Limiting:** NextAuth handles OAuth rate limiting
5. **Session Security:** httpOnly and secure cookies (already configured)
6. **Atomic Database Operations:** linkOAuthAccount and createOAuthUser use single queries to prevent race conditions

## Rollback Plan

If critical issues found:
1. Disable Google provider in `auth.ts`
2. Existing users still work with passwords
3. No data corruption (password_hash nullable is backwards-compatible)
4. Can re-enable after fixes

## Quality Gates

- [ ] 0 new SonarCloud issues (any severity)
- [ ] 80%+ test coverage on new code
- [ ] All acceptance criteria met
- [ ] Manual testing checklist completed
- [ ] Tested in Vercel Preview
- [ ] User approved

## Success Metrics

**Post-launch monitoring:**
- % of sign-ups using Google OAuth
- % of existing users linking Google
- Google OAuth sign-in time < 3 seconds
- Account merge time < 500ms
- 0 critical bugs in first week

## Out of Scope

- Apple Sign-In (future story)
- Microsoft OAuth (future story)
- Account unlinking (remove OAuth provider)
- Add password to OAuth-only account
- Multiple emails per account

## Notes

- Follow NextAuth.js v5 conventions (already on correct version)
- Use existing Material-UI theme and patterns
- Maintain Spanish (es-AR) language for all UI text
- Test thoroughly on mobile (progressive disclosure must be responsive)
- Google Cloud Console setup required before testing OAuth flow

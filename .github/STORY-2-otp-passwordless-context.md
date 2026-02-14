# Story 2: Passwordless Email OTP Login - Planning Context

## Research & Discovery

### Passwordless Authentication Research

**Sources:**
- [NextAuth.js Email Provider](https://next-auth.js.org/providers/email)
- [OTP Implementation Tutorial](https://www.linkedin.com/pulse/ditching-magic-links-otp-tutorial-nextjs-nextauth-will-olson-smo3c)
- [Custom OTP with NextAuth Discussion](https://github.com/nextauthjs/next-auth/discussions/2812)
- [NextAuth OTP Demo Repository](https://github.com/frankolson/nextauth-otp-demo)
- [Next.js OTP Login Guide](https://www.corbado.com/blog/nextjs-otp-login)

**Key Findings:**

1. **Magic Links vs OTP:**
   - **Magic Links:** Click link in email → Signed in (NextAuth built-in)
   - **OTP:** Enter 6-digit code → Signed in (Custom implementation)

   **Decision: OTP for PWA/Chrome App**
   - Better for installed apps (no need to switch to browser)
   - Users stay in app context
   - Faster (type code vs open email app)
   - More intuitive for mobile-first users

2. **OTP Security Considerations:**

   **From research:**
   - 6-digit codes (100,000 - 999,999) = 1 million combinations
   - More vulnerable to brute force than 64-char tokens
   - **Mitigations required:**
     - Short expiration (3-5 minutes vs 24 hours for magic links)
     - Limited attempts (3 max vs unlimited)
     - Rate limiting (1 request per minute per email)
     - Account lockout after failed attempts

3. **NextAuth.js Email Provider:**
   - Built-in for magic links
   - Can be customized for OTP
   - Uses Verification Token pattern
   - We'll use Credentials provider instead for more control

### OTP Implementation Strategy

**Approach: Custom OTP with Credentials Provider**

**Why not use Email Provider:**
- Email provider designed for magic links (long tokens)
- Harder to customize for 6-digit codes
- Less control over expiration and attempts
- Credentials provider more flexible for OTP flow

**Our Implementation:**
```typescript
CredentialsProvider({
  id: 'otp',
  name: 'OTP',
  credentials: {
    email: { label: 'Email', type: 'text' },
    otp: { label: 'OTP', type: 'text' }
  },
  async authorize({ email, otp }) {
    const result = await verifyOTP(email, otp);
    return result.user || null;
  }
})
```

### Database Schema Design

**New fields for users table:**

```sql
-- OTP code (6 digits)
otp_code VARCHAR(6) NULL

-- OTP expiration (3 minutes from generation)
otp_expiration TIMESTAMP WITH TIME ZONE NULL

-- Failed verification attempts (max 3)
otp_attempts INTEGER DEFAULT 0

-- Last OTP request time (for rate limiting)
otp_last_request TIMESTAMP WITH TIME ZONE NULL
```

**Why separate from verification_token?**
- Different security requirements (short expiration)
- Different use case (login vs email verification)
- Cleaner separation of concerns
- Easier to maintain and audit

### OTP Generation Algorithm

**Requirements:**
- 6-digit numeric code
- Cryptographically random
- Uniform distribution (100,000 - 999,999)

**Implementation:**
```typescript
function generateOTP(): string {
  // Generate random number between 100000 and 999999
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}
```

**Why this approach:**
- Simple and effective
- No leading zeros (always 6 digits)
- JavaScript `Math.random()` sufficient for OTP (not cryptographic keys)
- Alternative: `crypto.randomInt(100000, 1000000)` for crypto-grade randomness

### Security Implementation

**1. Rate Limiting:**
```typescript
// Check last OTP request time
const timeSinceLastRequest = now - user.otp_last_request;
if (timeSinceLastRequest < 60000) { // 1 minute
  throw new Error('Por favor espera un minuto antes de solicitar otro código.');
}
```

**2. Expiration (3 minutes):**
```typescript
const expiration = new Date();
expiration.setMinutes(expiration.getMinutes() + 3);

await updateUser(userId, {
  otp_code: code,
  otp_expiration: expiration,
  otp_attempts: 0,
});
```

**Why 3 minutes:**
- Long enough to check email and type code
- Short enough to prevent brute force
- Industry standard (Slack, GitHub use 5-10 minutes)
- Our research recommends 3-5 minutes for OTP

**3. Limited Attempts:**
```typescript
if (user.otp_attempts >= 3) {
  // Clear OTP, force new request
  await clearOTP(userId);
  throw new Error('Demasiados intentos fallidos. Solicita un nuevo código.');
}

if (user.otp_code !== enteredCode) {
  await incrementAttempts(userId);
  throw new Error(`Código incorrecto. Te quedan ${2 - user.otp_attempts} intentos.`);
}
```

**Why 3 attempts:**
- Balance security vs UX
- 3 wrong guesses = 1/333,333 chance of random success
- Forces attacker to request new OTP (rate limited)

**4. Email Timing Attack Prevention:**
```typescript
// Always return success, even if email doesn't exist
// Don't reveal if email is registered
const user = await findUserByEmail(email);
if (!user) {
  return { success: true }; // Fake success
}
```

### Email Template Design

**OTP Email Requirements:**
- Large, clear OTP code (easy to read)
- Expiration time prominently displayed
- Security warnings (don't share code)
- Remaining attempts after failure
- Plain text version for email clients

**Template Structure:**
```html
Subject: Tu código de acceso - Qatar Prode

Body:
┌────────────────────────┐
│  Tu código de acceso   │
├────────────────────────┤
│                        │
│      1 2 3 4 5 6       │  ← Large, spaced digits
│                        │
├────────────────────────┤
│ Válido por 3 minutos   │
│ Tienes 3 intentos      │
└────────────────────────┘

⚠️ Seguridad:
• No compartas este código
• Qatar Prode nunca pedirá este código
• Si no solicitaste esto, ignora el email
```

**Accessibility:**
- High contrast (large maroon digits on light gray background)
- Clear font (monospace for digits)
- Alt text for email clients without CSS
- Plain text version identical information

### Progressive Disclosure Integration

**Adding OTP to existing flow:**

```
Step 1: Email Input
├─ Continue with email → Step 2
└─ Continue with Google → OAuth flow

Step 2: Auth Options (based on email)
├─ Password field (if user has password)
├─ Continue with Google (if linked)
└─ "Iniciar sesión con código por email" ← NEW

Step 3: OTP Request
├─ Confirm email
├─ "Enviar código" button
└─ Countdown before can resend

Step 4: OTP Verification
├─ 6 input boxes for digits
├─ Auto-submit when complete
├─ Countdown timer (3 minutes)
├─ "Reenviar" after 1 minute
└─ Error messages with attempts remaining
```

### UI/UX Design Decisions

**1. 6 Separate Input Boxes (vs Single Input)**

**Why separate boxes:**
- Visual clarity (each digit has space)
- Mobile-friendly (large touch targets)
- Industry standard (banking apps, 2FA)
- Better accessibility (screen readers announce each box)
- Prevents copy/paste errors (handles pasting automatically)

**Implementation:**
```tsx
{[0,1,2,3,4,5].map(index => (
  <TextField
    value={otp[index]}
    onChange={(e) => handleChange(index, e.target.value)}
    onKeyDown={(e) => handleKeyDown(index, e)}
    inputProps={{ maxLength: 1, style: { textAlign: 'center' } }}
  />
))}
```

**Features:**
- Auto-focus next box after digit
- Backspace focuses previous box
- Paste fills all boxes automatically
- Auto-submit when all 6 filled

**2. Countdown Timer**

**Why show countdown:**
- Users know how much time they have
- Creates urgency (psychological security)
- Clear expiration indication
- Shows when they can resend

**Display format:** `MM:SS` (e.g., "2:45")

**States:**
- Green: 2-3 minutes remaining
- Yellow: 1-2 minutes remaining
- Red: < 1 minute remaining
- Expired: Alert banner with "Solicita un nuevo código"

**3. Resend Logic**

**Rules:**
- Can resend after 1 minute (rate limiting)
- Each resend invalidates previous OTP
- Each resend resets 3-minute countdown
- Each resend resets 3-attempt limit

**UI:**
```
Initial: "¿No recibiste el código? Reenviar (disabled, 0:45 remaining)"
After 1 min: "¿No recibiste el código? Reenviar (enabled, clickable)"
After click: "Código reenviado ✓" (feedback), timer resets
```

### Account Creation with OTP

**Scenario: New user uses OTP to sign up**

**Flow:**
1. User enters email (doesn't exist yet)
2. User clicks "Iniciar sesión con código por email"
3. System generates OTP, sends email
4. User enters OTP correctly
5. **System creates new account:**
   - `email` = entered email
   - `email_verified` = TRUE (verified by OTP)
   - `password_hash` = NULL
   - `auth_providers` = ["otp"]
   - `nickname` = NULL
   - `nickname_setup_required` = TRUE
6. Show nickname setup dialog (same as Google OAuth)
7. User sets nickname
8. Sign in complete

**Why allow account creation:**
- Passwordless onboarding (no password to remember)
- Lower friction for new users
- Email verification built-in (OTP proves ownership)
- Consistent with OAuth flow

### Integration with Existing Auth Methods

**User can have multiple auth methods:**

| Scenario | password_hash | auth_providers | Behavior |
|----------|---------------|----------------|----------|
| Password only | ✓ | ["credentials"] | Can add OTP or OAuth later |
| Google only | NULL | ["google"] | Can add OTP or password later |
| OTP only | NULL | ["otp"] | Can add password or OAuth later |
| Password + Google | ✓ | ["credentials", "google"] | Can add OTP too |
| All three | ✓ | ["credentials", "google", "otp"] | Maximum flexibility |

**Progressive disclosure shows all available methods:**
```tsx
if (methods.includes('password')) {
  <PasswordInput />
}
if (methods.includes('google')) {
  <GoogleButton />
}
// Always show OTP option
<Link>Iniciar sesión con código por email</Link>
```

### Repository Functions (New)

**1. `generateOTP(email: string)`**
- Find user by email (or return fake success)
- Check rate limiting (1 per minute)
- Generate 6-digit OTP
- Set 3-minute expiration
- Reset attempts to 0
- Store in database
- Return success (don't reveal if email exists)

**2. `verifyOTP(email: string, code: string)`**
- Find user by email
- Check if OTP exists
- Check if expired (clear if expired)
- Check attempts < 3
- Verify code matches
- If wrong: increment attempts, return error with remaining
- If correct: clear OTP, mark email verified, update auth_providers
- Return user object for NextAuth

**3. `clearOTP(userId: string)`**
- Set `otp_code = NULL`
- Set `otp_expiration = NULL`
- Set `otp_attempts = 0`
- Called after successful verification or max attempts

### Server Actions (New File: otp-actions.ts)

**1. `sendOTPCode(email: string)`**
- Call `generateOTP(email)`
- If rate limited, return error
- Get OTP code from user record
- Generate email using template
- Send email via AWS SES
- Return success (even if email doesn't exist - security)

**2. `verifyOTPCode(email: string, code: string)`**
- Call `verifyOTP(email, code)`
- Return result (user object or error)
- Used by NextAuth Credentials provider

### Error Messages (Spanish)

| Error | User Message |
|-------|-------------|
| Rate limited | Por favor espera un minuto antes de solicitar otro código. |
| OTP expired | El código ha expirado. Por favor solicita uno nuevo. |
| Wrong code (1st) | Código incorrecto. Te quedan 2 intentos. |
| Wrong code (2nd) | Código incorrecto. Te queda 1 intento. |
| Wrong code (3rd) | Demasiados intentos fallidos. Por favor solicita un nuevo código. |
| Email send failed | Error al enviar el código. Por favor, inténtalo de nuevo. |
| Network error | Error de conexión. Por favor verifica tu internet. |

### Testing Strategy

**Unit Tests:**

1. **OTP Generation:**
   - Always generates 6 digits
   - No leading zeros
   - Uniform distribution
   - Sets correct expiration (3 minutes)

2. **OTP Verification:**
   - Correct code succeeds
   - Wrong code increments attempts
   - Expired code fails
   - Max attempts locks OTP
   - Email verified after success

3. **Rate Limiting:**
   - Blocks requests within 1 minute
   - Allows after 1 minute
   - Multiple requests tracked per user

**Integration Tests:**

1. **Happy Path:**
   - Request OTP → Receive email → Enter code → Signed in

2. **Expiration:**
   - Request OTP → Wait 3 minutes → Code expired → Request new → Works

3. **Failed Attempts:**
   - Request OTP → Wrong code (3x) → Locked → Request new → Works

4. **Rate Limiting:**
   - Request OTP → Immediate request → Blocked → Wait 1 min → Works

5. **Account Creation:**
   - New email → Request OTP → Verify → Account created → Nickname setup

**Manual Testing Checklist:**

- [ ] OTP email arrives within 30 seconds
- [ ] OTP code is readable and copyable
- [ ] 6 input boxes work correctly
- [ ] Auto-focus works (next/previous)
- [ ] Paste OTP fills all boxes
- [ ] Auto-submit after 6 digits
- [ ] Countdown timer accurate
- [ ] Expiration works correctly
- [ ] Failed attempts show remaining
- [ ] Max attempts locks OTP
- [ ] Resend button enables after 1 minute
- [ ] New OTP invalidates old one
- [ ] Sign-in successful after correct OTP
- [ ] New user account created
- [ ] Nickname setup shown for new users

### Performance Considerations

**1. OTP Generation:**
- In-memory operation: < 1ms
- Database update: ~10ms
- Email send (AWS SES): 100-500ms (async)
- **Total user-facing latency:** ~20ms (email sends in background)

**2. OTP Verification:**
- Database query: ~10ms
- String comparison: < 1ms
- Database update: ~10ms
- **Total latency:** ~30ms

**3. Email Delivery:**
- AWS SES: Typically 1-5 seconds
- User sees "Código enviado" immediately
- Email arrives while user is checking inbox

### Security Audit Checklist

- [ ] OTP codes not logged in server logs
- [ ] OTP codes not exposed in error messages
- [ ] Rate limiting prevents brute force
- [ ] Short expiration limits attack window
- [ ] Limited attempts prevent guessing
- [ ] Email timing attack prevented (don't reveal if email exists)
- [ ] HTTPS enforced (OTP in transit encrypted)
- [ ] Session cookies httpOnly and secure
- [ ] No OTP in URL parameters (POST only)
- [ ] Clear OTP after successful verification
- [ ] Clear OTP after max attempts
- [ ] Clear OTP after expiration

### Accessibility Considerations

**1. OTP Input Fields:**
- Proper labels for screen readers
- Each input announces as "Digit 1 of 6"
- Error messages announced
- Focus management for keyboard navigation

**2. Countdown Timer:**
- Aria-live region for updates
- Clear time remaining format
- Color not sole indicator (text too)

**3. Error Messages:**
- Announced by screen reader
- High contrast (red text on white)
- Icon + text (not icon alone)

### Migration Strategy

**Step 1: Database Migration**
```sql
ALTER TABLE users ADD COLUMN otp_code VARCHAR(6);
ALTER TABLE users ADD COLUMN otp_expiration TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN otp_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN otp_last_request TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_users_otp_code ON users (otp_code) WHERE otp_code IS NOT NULL;
```

**Step 2: Backfill**
- No backfill needed (all columns nullable/default)
- Existing users unaffected

**Step 3: Code Deployment**
- Deploy repository functions
- Deploy server actions
- Deploy email template
- Deploy NextAuth OTP provider
- Deploy UI components

### Rollback Plan

**If critical issues found:**

1. Remove OTP option from login UI
2. Existing OTP in database expires naturally (3 minutes)
3. Users can still use password/Google
4. No data corruption
5. Can re-enable after fixes

### Future Enhancements (Out of Scope)

- SMS OTP (requires Twilio/similar)
- Authenticator app OTP (TOTP)
- Hardware key support (WebAuthn)
- Remember device (skip OTP for 30 days)
- Custom OTP length (4 or 8 digits)

### Dependencies

**External:**
- AWS SES (already configured ✓)

**Internal:**
- NextAuth.js v5 (already installed ✓)
- Email template system (already exists ✓)
- Kysely ORM (already used ✓)

### Implementation Checklist

**Phase 1: Backend**
- [ ] Create migration file
- [ ] Update TypeScript types
- [ ] Add generateOTP() with tests
- [ ] Add verifyOTP() with tests
- [ ] Add clearOTP() with tests
- [ ] Create otp-actions.ts with tests
- [ ] Create OTP email template
- [ ] Add OTP provider to auth.ts

**Phase 2: Frontend**
- [ ] Create OTPRequestForm component
- [ ] Create OTPVerifyForm component
- [ ] Add OTP option to LoginForm
- [ ] Update LoginOrSignupDialog states
- [ ] Add countdown timer logic
- [ ] Add auto-focus/paste handling
- [ ] Style OTP input boxes

**Phase 3: Testing**
- [ ] Write unit tests (80%+ coverage)
- [ ] Write integration tests
- [ ] Manual testing checklist
- [ ] Test in Vercel Preview
- [ ] Security audit

**Phase 4: Documentation**
- [ ] Update README with OTP feature
- [ ] Document rate limiting
- [ ] Add security considerations
- [ ] Update architecture docs

### Success Metrics

**Adoption:**
- % of sign-ins using OTP
- % of new users choosing OTP
- OTP vs password distribution

**Performance:**
- OTP email delivery time (target: < 5 seconds)
- OTP verification time (target: < 100ms)
- Failed OTP attempts rate (target: < 5%)

**Security:**
- Brute force attempts detected (should be 0)
- Average OTP requests per user per day
- Rate limiting triggers per day

**Quality:**
- 0 new SonarCloud issues
- 80%+ test coverage
- 0 critical bugs in first week
- User satisfaction score

---

## Quick Reference

**Key Files to Create:**
- `migrations/20260215000000_add_otp_support.sql`
- `app/actions/otp-actions.ts`
- `app/components/auth/otp-request-form.tsx`
- `app/components/auth/otp-verify-form.tsx`
- `app/utils/email-templates.ts` (add generateOTPEmail)

**Key Files to Update:**
- `auth.ts` - Add OTP Credentials provider
- `app/db/tables-definition.ts` - Add OTP fields to UserTable
- `app/db/users-repository.ts` - Add OTP functions
- `app/components/auth/login-form.tsx` - Add OTP link
- `app/components/auth/login-or-signup-dialog.tsx` - Add OTP states

**No New Environment Variables Required** (uses existing AWS SES)

**Testing Priority:**
1. OTP generation → Email delivery → Verification
2. Expiration handling
3. Failed attempts handling
4. Rate limiting
5. New user account creation with OTP

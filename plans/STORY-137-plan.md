# Implementation Plan: Passwordless Email OTP Login (#137)

## Story Context

**Epic:** Enhanced Authentication Options
**Story:** #137 - Passwordless Email OTP Login
**Dependencies:** Story #136 (Google OAuth Integration) - COMPLETED ✓

## Objectives

Implement a passwordless authentication method using 6-digit OTP (One-Time Password) codes sent via email. This provides an alternative to password-based authentication that works seamlessly in PWA/Chrome app environments.

## Business Value

- **PWA/Chrome App Friendly**: No need to switch apps to access email links
- **Reduced Support Burden**: Fewer password-related support requests
- **Modern UX**: Industry-standard authentication method users expect
- **Lower Friction**: New users can sign up without creating passwords
- **Email Verification**: Built-in email verification through OTP validation

## Acceptance Criteria Summary

✅ User can request 6-digit OTP code via email
✅ OTP valid for 3 minutes with countdown timer
✅ Max 3 verification attempts per OTP
✅ Rate limiting: 1 OTP request per minute per email
✅ New users can create accounts via OTP
✅ Email contains clear OTP code with security warnings
✅ 6 separate input boxes with auto-focus/paste support
✅ Resend functionality after 1 minute
✅ All error messages in Spanish

## Technical Approach

### 1. Database Schema Changes

**New fields for `users` table:**

```sql
otp_code VARCHAR(6) NULL                    -- 6-digit code (100000-999999)
otp_expiration TIMESTAMP WITH TIME ZONE NULL -- 3-minute expiration
otp_attempts INTEGER DEFAULT 0              -- Track failed attempts (max 3)
otp_last_request TIMESTAMP WITH TIME ZONE NULL -- Rate limiting (1 per minute)
```

**Indexes:**
```sql
CREATE INDEX idx_users_otp_code ON users (otp_code) WHERE otp_code IS NOT NULL;
```

**Rationale:**
- Separate from `verification_token` (different use case and security requirements)
- `otp_code` as VARCHAR(6) for direct string comparison
- `otp_attempts` for brute-force protection
- `otp_last_request` for rate limiting

### 2. Security Implementation

**Rate Limiting (1 request per minute):**
```typescript
const timeSinceLastRequest = now - user.otp_last_request;
if (timeSinceLastRequest < 60000) {
  throw new Error('Por favor espera un minuto antes de solicitar otro código.');
}
```

**Expiration (3 minutes):**
```typescript
const expiration = new Date();
expiration.setMinutes(expiration.getMinutes() + 3);
```

**Limited Attempts (max 3):**
```typescript
if (user.otp_attempts >= 3) {
  await clearOTP(userId);
  throw new Error('Demasiados intentos fallidos. Solicita un nuevo código.');
}
```

**Timing Attack Prevention:**
```typescript
// Don't reveal if email exists
const user = await findUserByEmail(email);
if (!user) {
  return { success: true }; // Fake success
}
```

**Why These Values:**
- **3 minutes**: Long enough to check email, short enough to prevent brute force
- **3 attempts**: Balance between security and UX (1/333,333 chance of random success)
- **1 minute rate limit**: Prevents spam while allowing legitimate retries

### 3. OTP Generation Algorithm

**Implementation:**
```typescript
function generateOTP(): string {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}
```

**Properties:**
- Always 6 digits (no leading zeros)
- Range: 100,000 - 999,999
- 1 million possible combinations
- JavaScript `Math.random()` sufficient for OTP (not cryptographic keys)

**Alternative for higher security:**
```typescript
import crypto from 'crypto';
function generateOTP(): string {
  return crypto.randomInt(100000, 1000000).toString();
}
```

### 4. Progressive Disclosure Integration

**Updated flow:**

```
EmailInputForm
  ├─ Enter email
  └─ "Continuar" button
      ↓
Check auth methods (checkAuthMethods server action)
      ↓
┌─────────────────────────────────────────┐
│ Progressive Disclosure Decision Tree    │
├─────────────────────────────────────────┤
│ IF userExists = false:                  │
│   → Show SignupForm                     │
│                                         │
│ IF userExists = true:                   │
│   IF hasPassword = true:                │
│     → Show LoginForm with:              │
│       • Password field                  │
│       • "¿Olvidaste tu contraseña?"    │
│       • "Iniciar sesión con código"    │ ← NEW
│   IF hasGoogle = true:                  │
│     → EmailInputForm shows Google btn   │
│                                         │
│ ALWAYS available in LoginForm:          │
│   → "Iniciar sesión con código por email" │
└─────────────────────────────────────────┘
```

**OTP Flow:**

```
LoginForm
  ↓
Click "Iniciar sesión con código por email"
  ↓
OTPRequestForm
  • Display email (readonly)
  • "Enviar código" button
  • Loading state
  ↓
Server sends OTP via email
  ↓
OTPVerifyForm
  • 6 input boxes (auto-focus)
  • Countdown timer (3:00)
  • Auto-submit on 6 digits
  • Error messages (attempts remaining)
  • Resend link (enabled after 1 min)
  ↓
IF correct code:
  ├─ Existing user → Sign in
  └─ New user → Create account → Nickname setup → Sign in
IF wrong code:
  ├─ < 3 attempts → Show error with remaining
  └─ 3 attempts → Clear OTP, show "Solicita nuevo código"
IF expired:
  └─ Show "Código expirado. Solicita uno nuevo"
```

### 5. Account Creation via OTP

**Scenario:** New user (email doesn't exist)

**Flow:**
1. User enters non-existent email in EmailInputForm
2. Server doesn't reveal email doesn't exist (timing attack prevention)
3. User clicks "Iniciar sesión con código"
4. OTP sent to email
5. User verifies OTP correctly
6. **Server creates new account:**
   ```typescript
   {
     email: enteredEmail,
     nickname: null,
     password_hash: null,  // OTP-only user
     email_verified: true,  // Verified by OTP
     auth_providers: ["otp"],
     oauth_accounts: []
   }
   ```
7. Show nickname setup dialog (reuse from OAuth)
8. User sets nickname
9. Sign-in complete

**Rationale:**
- Email ownership proven by OTP verification
- Consistent with OAuth account creation flow
- No password needed (true passwordless)
- Can add password later if desired

### 6. Email Template Design

**Subject:** `Tu código de acceso - Qatar Prode`

**HTML Structure:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Tu código de acceso</h2>

  <!-- Large, centered OTP code -->
  <div style="
    font-size: 48px;
    font-family: monospace;
    letter-spacing: 8px;
    text-align: center;
    padding: 30px;
    background: #f5f5f5;
    border: 2px solid #8b0000;
    border-radius: 8px;
    margin: 20px 0;
    color: #8b0000;
  ">
    [OTP CODE]
  </div>

  <p><strong>Válido por 3 minutos</strong></p>
  <p>Tienes máximo 3 intentos para ingresar este código.</p>

  <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
    <strong>⚠️ Seguridad:</strong>
    <ul>
      <li>No compartas este código con nadie</li>
      <li>Qatar Prode nunca pedirá este código</li>
      <li>Si no solicitaste esto, ignora este email</li>
    </ul>
  </div>
</div>
```

**Plain text version:**
```
Tu código de acceso - Qatar Prode

Tu código: [OTP CODE]

Válido por 3 minutos
Tienes máximo 3 intentos

⚠️ SEGURIDAD:
• No compartas este código con nadie
• Qatar Prode nunca pedirá este código
• Si no solicitaste esto, ignora este email
```

**Accessibility:**
- High contrast (maroon on light gray)
- Large font size (48px)
- Monospace font for clear digit separation
- Letter-spacing for readability
- Both HTML and plain text versions

## Visual Prototypes

This story involves significant UI changes with two new components. Below are detailed visual prototypes for all UI elements.

### 1. OTPRequestForm Component

**Purpose:** Allow users to request an OTP code for email-based authentication

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Dialog: "Iniciar Sesión"                   │
├─────────────────────────────────────────────┤
│                                             │
│  Te enviaremos un código a tu email         │
│                                             │
│  Email: test@example.com (readonly, gray)   │
│                                             │
│  [  Enviar código  ] ← Primary button      │
│                                             │
│  [← Volver]  [Cancelar]                    │
│                                             │
└─────────────────────────────────────────────┘
```

**States:**

**Initial State:**
```
┌─────────────────────────────────────────────┐
│ Te enviaremos un código a tu email          │
│                                             │
│ Email: test@example.com                     │
│ ─────────────────────────────               │
│                                             │
│ [  Enviar código  ]                        │
└─────────────────────────────────────────────┘
```

**Loading State:**
```
┌─────────────────────────────────────────────┐
│ Te enviaremos un código a tu email          │
│                                             │
│ Email: test@example.com                     │
│ ─────────────────────────────               │
│                                             │
│ [  ⏳ Enviando...  ] ← Disabled            │
└─────────────────────────────────────────────┘
```

**Error State (Rate Limited):**
```
┌─────────────────────────────────────────────┐
│ ⚠️ Por favor espera un minuto antes de     │
│    solicitar otro código.                   │
├─────────────────────────────────────────────┤
│ Te enviaremos un código a tu email          │
│                                             │
│ Email: test@example.com                     │
│ ─────────────────────────────               │
│                                             │
│ [  Enviar código  ]                        │
└─────────────────────────────────────────────┘
```

**Success State:**
```
┌─────────────────────────────────────────────┐
│ ✓ Código enviado. Revisa tu email.         │
├─────────────────────────────────────────────┤
│ [Automatically switches to OTPVerifyForm]   │
└─────────────────────────────────────────────┘
```

**Material-UI Components:**
- `TextField` (variant="standard", disabled) for email display
- `Button` (variant="contained", fullWidth) for send button
- `Alert` (severity="error" or "success") for messages
- `CircularProgress` for loading spinner
- `Typography` (color="primary", clickable) for navigation links

**Responsive:**
- Mobile: Full width, stacked vertically
- Tablet: Same as mobile (dialog already constrained)
- Desktop: Dialog max-width 400px, centered

---

### 2. OTPVerifyForm Component

**Purpose:** Verify the 6-digit OTP code sent to user's email

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Dialog: "Verificar Código"                 │
├─────────────────────────────────────────────┤
│                                             │
│  Ingresa el código enviado a                │
│  test@example.com                           │
│                                             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐     │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │     │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘     │
│      ↑ Auto-focus, paste support           │
│                                             │
│  ⏱️ Expira en: 2:45  ← Green color        │
│                                             │
│  ¿No recibiste el código?                  │
│  Reenviar (disponible en 0:30)             │
│  ─────────                                  │
│                                             │
│  [← Volver]  [Cancelar]                   │
│                                             │
└─────────────────────────────────────────────┘
```

**State Variations:**

**Initial State (Just arrived):**
```
┌─────────────────────────────────────────────┐
│  Ingresa el código enviado a                │
│  test@example.com                           │
│                                             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐     │
│  │   │ │   │ │   │ │   │ │   │ │   │     │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘     │
│   ↑ Focus on first box                     │
│                                             │
│  ⏱️ Expira en: 3:00  ← Green (success)    │
│                                             │
│  ¿No recibiste el código?                  │
│  Reenviar (deshabilitado 0:58)             │
│            ←  Gray, disabled                │
└─────────────────────────────────────────────┘
```

**Entering Digits:**
```
┌─────────────────────────────────────────────┐
│  Ingresa el código enviado a                │
│  test@example.com                           │
│                                             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐     │
│  │ 1 │ │ 2 │ │ 3 │ │   │ │   │ │   │     │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘     │
│                       ↑ Auto-focus here     │
│                                             │
│  ⏱️ Expira en: 2:53  ← Still green        │
└─────────────────────────────────────────────┘
```

**Timer Warning (< 2 minutes):**
```
┌─────────────────────────────────────────────┐
│  ⏱️ Expira en: 1:45  ← Yellow (warning)   │
│                                             │
│  Reenviar (deshabilitado 0:15)             │
└─────────────────────────────────────────────┘
```

**Timer Critical (< 1 minute):**
```
┌─────────────────────────────────────────────┐
│  ⏱️ Expira en: 0:45  ← Red (error)        │
│                                             │
│  Reenviar (click para reenviar)            │
│  ─────────  ← Blue, enabled, underlined    │
└─────────────────────────────────────────────┘
```

**Wrong Code (1st attempt):**
```
┌─────────────────────────────────────────────┐
│  ⚠️ Código incorrecto. Te quedan 2        │
│     intentos.                               │
├─────────────────────────────────────────────┤
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐     │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │     │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘     │
│   ← Boxes cleared, focus on first           │
│                                             │
│  ⏱️ Expira en: 2:30                        │
└─────────────────────────────────────────────┘
```

**Wrong Code (3rd attempt, locked):**
```
┌─────────────────────────────────────────────┐
│  ⚠️ Demasiados intentos fallidos.          │
│     Por favor solicita un nuevo código.     │
├─────────────────────────────────────────────┤
│  [  Solicitar nuevo código  ]              │
│   ← Goes back to OTPRequestForm            │
└─────────────────────────────────────────────┘
```

**Expired:**
```
┌─────────────────────────────────────────────┐
│  ⚠️ El código ha expirado.                 │
│     Por favor solicita uno nuevo.           │
├─────────────────────────────────────────────┤
│  [  Solicitar nuevo código  ]              │
└─────────────────────────────────────────────┘
```

**Verifying (auto-submit):**
```
┌─────────────────────────────────────────────┐
│  Verificando código...                      │
│                                             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐     │
│  │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │     │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘     │
│   ← All boxes disabled                      │
│                                             │
│  ⏳ Verificando...                         │
└─────────────────────────────────────────────┘
```

**Material-UI Components:**
- `TextField` (variant="standard", inputProps={{ maxLength: 1 }}) for each OTP box
- Boxes styled with:
  - Width: 48px
  - Height: 56px
  - Font size: 24px
  - Text align: center
  - Border: 2px solid (primary color when focused)
  - Margin: 4px between boxes
- `Typography` (variant="body1") for email display
- `Typography` (variant="h6", color based on time) for countdown
- `Link` (component="button") for resend link
- `Alert` (severity="error") for error messages
- `Button` (variant="text") for navigation

**Responsive:**
- Mobile:
  - OTP boxes: 40px width, 48px height
  - Font size: 20px
  - Tighter spacing (2px between boxes)
  - Timer below boxes (centered)
- Tablet: Same as desktop
- Desktop: As shown in prototype

**Accessibility:**
- Each input has aria-label: "Dígito {1-6} de 6"
- Error messages announced via aria-live="assertive"
- Timer has aria-live="polite" (updates announced)
- Resend link has aria-disabled when not clickable
- Clear focus indicators (2px blue border)

**Paste Behavior:**
```
User pastes "123456"
     ↓
All 6 boxes fill instantly
     ↓
Focus moves to last box
     ↓
Auto-submit triggered
```

**Backspace Navigation:**
```
User in box 4, presses backspace
     ↓
If box 4 is empty → Focus moves to box 3
If box 4 has digit → Digit deleted, stays in box 4
```

---

### 3. Updated LoginForm Component

**Change:** Add OTP authentication link below password field

**Before:**
```
┌─────────────────────────────────────────────┐
│ Dialog: "Ingresar"                          │
├─────────────────────────────────────────────┤
│  Email: test@example.com (readonly)         │
│  ────────────────────────────               │
│                                             │
│  Contraseña: ********                       │
│  ────────────────────────────               │
│                                             │
│  [  Ingresar  ]                            │
│                                             │
│  [← Volver a email]                        │
│  [¿Olvidaste tu contraseña?]               │
└─────────────────────────────────────────────┘
```

**After:**
```
┌─────────────────────────────────────────────┐
│ Dialog: "Ingresar"                          │
├─────────────────────────────────────────────┤
│  Email: test@example.com (readonly)         │
│  ────────────────────────────────           │
│                                             │
│  Contraseña: ********                       │
│  ────────────────────────────────           │
│                                             │
│  Iniciar sesión con código por email       │
│  ────────────────────────────────────────  │
│  ↑ Blue, underlined, clickable link        │
│                                             │
│  [  Ingresar  ]                            │
│                                             │
│  [← Volver a email]                        │
│  [¿Olvidaste tu contraseña?]               │
└─────────────────────────────────────────────┘
```

**Position:** Between password field and "Ingresar" button
**Style:** Typography variant="body2", color="primary", underlined, centered
**Behavior:** Clicking switches to OTPRequestForm

---

### 4. Dialog Mode Flow

**Complete navigation flow:**

```
EmailInputForm
      ↓
   Enter email → Check auth methods
      ↓
┌─────┴──────┐
│            │
userExists?  │
│            │
NO          YES
│            │
SignupForm   hasPassword?
│            │
│         YES    NO
│          │     │
│      LoginForm │
│          │     │
│          ├─────┘
│          │
│     Click "Iniciar sesión
│          con código"
│          │
│          ↓
│     OTPRequestForm ← NEW
│          │
│     Click "Enviar código"
│          ↓
│     [Email sent]
│          ↓
│     OTPVerifyForm ← NEW
│          │
│     Enter 6 digits
│          ↓
│     ┌─────┴─────┐
│     │           │
│  Correct?     Wrong?
│     │           │
│    YES         NO
│     │           │
│ Sign in    Show error
│     │        + attempts
│     │           │
│     │      3rd attempt?
│     │           │
│     │          YES
│     │           │
│     │      Lock OTP
│     │       + show
│     │       "Solicitar
│     │        nuevo"
│     │           │
│     └───────────┘
│
└── If new user → Nickname setup → Sign in
```

**Dialog Titles by Mode:**
- emailInput: "Ingresar o Registrarse"
- login: "Ingresar"
- otpRequest: "Código de Acceso"  ← NEW
- otpVerify: "Verificar Código"   ← NEW
- signup: "Registrarse"
- forgotPassword: "Recuperar Contraseña"

---

### 5. Email Template Visual

**Subject:** Tu código de acceso - Qatar Prode

**Email Layout:**
```
┌──────────────────────────────────────────┐
│  QATAR PRODE                             │ ← Header
├──────────────────────────────────────────┤
│                                          │
│  Tu código de acceso                     │ ← Title (h2)
│                                          │
│  Has solicitado un código para iniciar   │
│  sesión en Qatar Prode.                  │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │                                    │ │
│  │          1  2  3  4  5  6          │ │ ← Large, centered
│  │                                    │ │    Maroon color
│  │                                    │ │    48px font
│  └────────────────────────────────────┘ │    Monospace
│   ↑ Light gray background, maroon border│
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ⏱️ Válido por 3 minutos            │ │ ← Info box
│  │ Tienes máximo 3 intentos            │ │   Blue background
│  └────────────────────────────────────┘ │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │ ⚠️ Seguridad:                       │ │ ← Warning box
│  │ • No compartas este código          │ │   Yellow background
│  │ • Qatar Prode nunca lo pedirá       │ │
│  │ • Si no lo solicitaste, ignóralo    │ │
│  └────────────────────────────────────┘ │
│                                          │
│  Este código fue solicitado para:       │
│  test@example.com                        │
│                                          │
├──────────────────────────────────────────┤
│  FOOTER                                  │
└──────────────────────────────────────────┘
```

**Colors:**
- OTP Code: #8b0000 (maroon) on #f5f5f5 (light gray)
- Info Box: #e8f4f8 (light blue) with #1976d2 (blue) border
- Warning Box: #fff3cd (light yellow) with #ffc107 (yellow) border
- Text: #4a4a4a (dark gray)

**Font:**
- OTP Code: 'Courier New', monospace, 48px, bold, letter-spacing: 8px
- Body: Arial, sans-serif, 14px
- Headings: Arial, sans-serif, 20px

---

## Summary of Visual Changes

**New Components:**
1. ✅ OTPRequestForm - Simple form with email display and send button
2. ✅ OTPVerifyForm - Complex form with 6 input boxes, timer, and resend logic

**Updated Components:**
1. ✅ LoginForm - Added "Iniciar sesión con código" link
2. ✅ LoginOrSignupDialog - Added two new modes ('otpRequest', 'otpVerify')

**New Email Template:**
1. ✅ OTP Email - Large centered code with security warnings

**Design Consistency:**
- All components use Material-UI v7 components
- Color scheme matches existing Qatar Prode theme
- Spanish language throughout
- Responsive design (mobile, tablet, desktop)
- High contrast for accessibility (WCAG AA)

---

### 7. UI Components

#### 7.1. OTPRequestForm Component

**Purpose:** Request OTP code for a given email

**Props:**
```typescript
type OTPRequestFormProps = {
  readonly email: string;
  readonly onOTPSent: () => void;
  readonly onCancel: () => void;
}
```

**Features:**
- Display email (readonly)
- "Enviar código" button
- Loading state during request
- Error handling (rate limited, network error)
- Success message: "Código enviado. Revisa tu email."

**Implementation:**
```typescript
const handleSendOTP = async () => {
  setLoading(true);
  setError('');

  const result = await sendOTPCode(email);

  if (!result.success) {
    setError(result.error || 'Error al enviar el código');
    setLoading(false);
    return;
  }

  onOTPSent();
};
```

#### 7.2. OTPVerifyForm Component

**Purpose:** Verify 6-digit OTP code

**Props:**
```typescript
type OTPVerifyFormProps = {
  readonly email: string;
  readonly onSuccess: () => void;
  readonly onCancel: () => void;
  readonly onResend: () => void;
}
```

**Features:**
- 6 separate input boxes (TextField components)
- Auto-focus to next box on digit entry
- Backspace moves to previous box
- Paste support (fills all 6 boxes)
- Auto-submit when all 6 digits entered
- Countdown timer (MM:SS format, color-coded)
- Resend link (disabled for 1 minute)
- Error messages with remaining attempts

**6-Box Input Implementation:**
```typescript
const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
const [isVerifying, setIsVerifying] = useState(false);
const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

const handleChange = (index: number, value: string) => {
  if (isVerifying) return; // Prevent input during verification

  // Only allow digits
  if (!/^\d*$/.test(value)) return;

  // Update OTP array
  const newOtp = [...otp];
  newOtp[index] = value.slice(-1); // Only last character
  setOtp(newOtp);

  // Auto-focus next box
  if (value && index < 5) {
    inputRefs.current[index + 1]?.focus();
  }

  // Auto-submit when complete
  if (index === 5 && value) {
    handleVerify(newOtp.join(''));
  }
};

const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
  if (isVerifying) return; // Prevent input during verification

  if (e.key === 'Backspace' && !otp[index] && index > 0) {
    inputRefs.current[index - 1]?.focus();
  }
};

const handlePaste = (e: React.ClipboardEvent) => {
  if (isVerifying) return; // Prevent paste during verification

  e.preventDefault();
  const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');

  if (pastedData.length === 6) {
    const newOtp = pastedData.split('');
    setOtp(newOtp);
    inputRefs.current[5]?.focus();
    handleVerify(pastedData);
  }
};

const handleVerify = async (code: string) => {
  if (isVerifying) return; // Prevent double submission

  setIsVerifying(true);
  setError('');

  try {
    const result = await signIn('otp', {
      email,
      otp: code,
      redirect: false
    });

    if (result?.ok) {
      onSuccess();
    } else {
      // Clear input on error
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
      setError('Código incorrecto');
    }
  } catch (err) {
    setError('Error al verificar código');
    // Clear input on error
    setOtp(Array(6).fill(''));
    inputRefs.current[0]?.focus();
  } finally {
    setIsVerifying(false);
  }
};
```

**Countdown Timer Implementation:**
```typescript
const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes in seconds

useEffect(() => {
  if (timeRemaining <= 0) return;

  const timer = setInterval(() => {
    setTimeRemaining(prev => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [timeRemaining]);

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const getTimerColor = (): string => {
  if (timeRemaining > 120) return 'success'; // Green (2-3 min)
  if (timeRemaining > 60) return 'warning';  // Yellow (1-2 min)
  return 'error';                            // Red (<1 min)
};
```

**Visual Layout:**
```
┌─────────────────────────────────────┐
│   Ingresa el código enviado a      │
│   test@example.com                  │
├─────────────────────────────────────┤
│                                     │
│   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ │
│   │ 1 │ │ 2 │ │ 3 │ │ 4 │ │ 5 │ │ 6 │ │
│   └───┘ └───┘ └───┘ └───┘ └───┘ └───┘ │
│                                     │
│   ⏱️ Expira en: 2:45               │
│                                     │
│   ¿No recibiste el código?          │
│   Reenviar (disponible en 0:30)    │
│                                     │
│   [← Volver] [Cancelar]            │
└─────────────────────────────────────┘
```

#### 7.3. Update LoginForm

**Changes:**
- Add link below password field: "Iniciar sesión con código por email"
- Link triggers mode switch in parent dialog

```typescript
<div style={{ marginTop: '10px', textAlign: 'center' }}>
  <Typography
    variant="body2"
    color="primary"
    onClick={onOTPLoginClick}
    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
  >
    Iniciar sesión con código por email
  </Typography>
</div>
```

#### 7.4. Update LoginOrSignupDialog

**Add new dialog modes:**
```typescript
type DialogMode =
  | 'emailInput'
  | 'login'
  | 'signup'
  | 'forgotPassword'
  | 'resetSent'
  | 'verificationSent'
  | 'otpRequest'   // NEW
  | 'otpVerify';   // NEW
```

**Handle OTP flow:**
```typescript
const handleOTPLoginClick = () => {
  switchMode('otpRequest');
};

const handleOTPSent = () => {
  switchMode('otpVerify');
};

const handleOTPVerifySuccess = async (email: string, code: string) => {
  // Sign in with OTP provider
  const result = await signIn('otp', {
    email,
    otp: code,
    redirect: false
  });

  if (result?.ok) {
    handleCloseLoginDialog(true);
  } else {
    // Error handled by OTPVerifyForm
  }
};

const handleOTPResend = () => {
  switchMode('otpRequest');
};
```

**Render OTP forms:**
```typescript
case 'otpRequest':
  return (
    <OTPRequestForm
      email={email}
      onOTPSent={handleOTPSent}
      onCancel={() => switchMode('login')}
    />
  );
case 'otpVerify':
  return (
    <OTPVerifyForm
      email={email}
      onSuccess={handleOTPVerifySuccess}
      onCancel={() => switchMode('login')}
      onResend={handleOTPResend}
    />
  );
```

### 8. Repository Functions

**File:** `app/db/users-repository.ts`

#### 8.1. generateOTP

```typescript
export async function generateOTP(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  let user = await findUserByEmail(email.toLowerCase());
  const now = new Date();

  // If user exists, check rate limiting BEFORE creating new OTP
  if (user && user.otp_last_request) {
    const timeSinceLastRequest = now.getTime() - new Date(user.otp_last_request).getTime();
    if (timeSinceLastRequest < 60000) {
      return {
        success: false,
        error: 'Por favor espera un minuto antes de solicitar otro código.'
      };
    }
  }

  // If user doesn't exist, create placeholder (for new user signup via OTP)
  if (!user) {
    user = await db.insertInto('users')
      .values({
        email: email.toLowerCase(),
        nickname: null,
        password_hash: null,
        email_verified: false,  // Will be set to true on OTP verification
        auth_providers: JSON.stringify(['otp']),
        oauth_accounts: JSON.stringify([])
      })
      .returningAll()
      .executeTakeFirst();

    if (!user) {
      return { success: false, error: 'Error al crear cuenta' };
    }
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Calculate expiration (3 minutes from now - explicit milliseconds)
  const expiration = new Date(Date.now() + 3 * 60 * 1000);

  // Update user with OTP
  await updateUser(user.id, {
    otp_code: otp,
    otp_expiration: expiration,
    otp_attempts: 0,
    otp_last_request: now
  });

  return { success: true };
}
```

#### 8.2. verifyOTP

```typescript
export async function verifyOTP(
  email: string,
  code: string
): Promise<{
  success: boolean;
  user?: User;
  error?: string;
  attemptsRemaining?: number;
}> {
  const user = await findUserByEmail(email.toLowerCase());
  const now = new Date();

  if (!user) {
    return { success: false, error: 'Usuario no encontrado' };
  }

  // Check if OTP exists
  if (!user.otp_code || !user.otp_expiration) {
    return { success: false, error: 'No hay código pendiente. Solicita uno nuevo.' };
  }

  // Check if expired
  if (now > new Date(user.otp_expiration)) {
    await clearOTP(user.id);
    return { success: false, error: 'El código ha expirado. Por favor solicita uno nuevo.' };
  }

  // Check attempts limit
  if (user.otp_attempts >= 3) {
    await clearOTP(user.id);
    return {
      success: false,
      error: 'Demasiados intentos fallidos. Por favor solicita un nuevo código.'
    };
  }

  // Verify code
  if (user.otp_code !== code) {
    const newAttempts = user.otp_attempts + 1;
    await updateUser(user.id, { otp_attempts: newAttempts });

    const remaining = 3 - newAttempts;
    return {
      success: false,
      error: `Código incorrecto. Te ${remaining === 1 ? 'queda' : 'quedan'} ${remaining} ${remaining === 1 ? 'intento' : 'intentos'}.`,
      attemptsRemaining: remaining
    };
  }

  // Success! Clear OTP and mark email verified
  await updateUser(user.id, {
    otp_code: null,
    otp_expiration: null,
    otp_attempts: 0,
    otp_last_request: null,
    email_verified: true
  });

  // Update auth_providers if not already included
  const authProviders = user.auth_providers || [];
  if (!authProviders.includes('otp')) {
    await updateUser(user.id, {
      auth_providers: JSON.stringify([...authProviders, 'otp'])
    });
  }

  return { success: true, user };
}
```

#### 8.3. clearOTP

```typescript
export async function clearOTP(userId: string): Promise<void> {
  await updateUser(userId, {
    otp_code: null,
    otp_expiration: null,
    otp_attempts: 0,
    otp_last_request: null
  });
}
```

#### 8.4. normalizeEmail (Utility)

```typescript
/**
 * Normalize email for consistent comparison
 * Lowercases and trims whitespace
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Validate email format
 */
export function isValidOTP(code: string): boolean {
  return /^\d{6}$/.test(code);
}
```

### 9. Server Actions

**File:** `app/actions/otp-actions.ts`

```typescript
'use server';

import { signIn } from '@/auth';
import {
  findUserByEmail,
  generateOTP,
  verifyOTP,
  createUserFromOTP
} from '../db/users-repository';
import { sendEmail } from '../utils/email';
import { generateOTPEmail } from '../utils/email-templates';

/**
 * Send OTP code to user's email
 */
export async function sendOTPCode(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!email?.trim()) {
      return { success: false, error: 'Email es requerido' };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Email inválido' };
    }

    const normalizedEmail = normalizeEmail(email);

    // Generate OTP (handles rate limiting and timing attack prevention)
    const result = await generateOTP(normalizedEmail);

    if (!result.success) {
      return result;
    }

    // Get user to retrieve OTP code
    const user = await findUserByEmail(normalizedEmail);

    // If user exists, send email
    if (user && user.otp_code) {
      const emailData = generateOTPEmail(normalizedEmail, user.otp_code);
      const emailResult = await sendEmail(emailData);

      if (!emailResult.success) {
        return {
          success: false,
          error: 'Error al enviar el código. Por favor, inténtalo de nuevo.'
        };
      }
    }

    // Always return success (timing attack prevention)
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP code:', error);
    return {
      success: false,
      error: 'Error al enviar el código. Por favor, inténtalo de nuevo.'
    };
  }
}

/**
 * Verify OTP code and return user object
 * Used internally by NextAuth OTP provider
 */
export async function verifyOTPCode(
  email: string,
  code: string
): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  attemptsRemaining?: number;
  isNewUser?: boolean;
}> {
  try {
    if (!email?.trim() || !code?.trim()) {
      return { success: false, error: 'Email y código son requeridos' };
    }

    // Validate OTP format (6 digits)
    if (!isValidOTP(code.trim())) {
      return { success: false, error: 'Código debe ser 6 dígitos' };
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedCode = code.trim();

    // Check if user exists (placeholder should exist from generateOTP)
    let user = await findUserByEmail(normalizedEmail);
    let isNewUser = false;

    if (!user) {
      return {
        success: false,
        error: 'Primero solicita un código.'
      };
    }

    // Check if this is a new user (placeholder created in generateOTP)
    isNewUser = !user.email_verified;

    // Verify OTP
    const verifyResult = await verifyOTP(normalizedEmail, normalizedCode);

    if (!verifyResult.success) {
      return verifyResult;
    }

    // Return user object for NextAuth
    return {
      success: true,
      user: {
        id: verifyResult.user!.id,
        email: verifyResult.user!.email,
        name: verifyResult.user!.nickname || verifyResult.user!.email,
        nickname: verifyResult.user!.nickname,
        isAdmin: verifyResult.user!.is_admin || false,
        emailVerified: true
      },
      isNewUser
    };
  } catch (error) {
    console.error('Error verifying OTP code:', error);
    return {
      success: false,
      error: 'Error al verificar el código. Por favor, inténtalo de nuevo.'
    };
  }
}
```

**Account Creation Flow Summary:**

The implementation uses **Option 1: Create placeholder user on OTP request**. This approach is:
- Simpler (no separate pending_otp table)
- Consistent with existing auth patterns
- Secure (email_verified=false until OTP verified)

**Complete flow for new users:**

1. **User enters email** (doesn't exist in system)
2. **User clicks "Iniciar sesión con código"**
3. **sendOTPCode called** → triggers generateOTP
4. **generateOTP checks**: User doesn't exist
5. **generateOTP creates placeholder user:**
   - email_verified = `false` (not verified yet)
   - password_hash = `null` (OTP-only user)
   - auth_providers = `["otp"]`
   - otp_code = generated 6-digit code
   - otp_expiration = 3 minutes from now
6. **Email sent** with OTP code
7. **User enters OTP** in verification form
8. **verifyOTPCode called** → triggers verifyOTP
9. **verifyOTP checks**: Code correct, not expired, attempts < 3
10. **verifyOTP updates user:**
    - email_verified = `true` (now verified)
    - otp_code = `null` (cleared)
    - Adds 'otp' to auth_providers if not present
11. **isNewUser flag set** (email_verified changed from false to true)
12. **UI shows nickname setup** (if isNewUser=true)
13. **User sets nickname** and signs in

**Key Security Points:**
- Placeholder users have email_verified=false (can't sign in without OTP)
- Rate limiting applies to placeholder users (prevents spam)
- OTP expires in 3 minutes (limited attack window)
- Max 3 verification attempts (prevents brute force)

### 10. NextAuth Integration

**File:** `auth.ts`

**Complete auth.ts structure showing OTP provider placement:**

```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import {
  findUserByEmail,
  getPasswordHash,
  findUserByOAuthAccount,
  linkOAuthAccount,
  createOAuthUser
} from "./app/db/users-repository";
import { verifyOTPCode } from "./app/actions/otp-actions"; // NEW

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: '/?openSignin=true',
    signOut: '/'
  },
  providers: [
    // EXISTING: Password Credentials Provider
    CredentialsProvider({
      id: 'credentials', // explicit ID
      credentials: {
        email: {label: 'Email', type: 'text'},
        password: {label: 'Password', type: 'password'}
      },
      async authorize({email, password}: any) {
        const user = await findUserByEmail(email)
        const passwordHash = getPasswordHash(password)

        if (user && passwordHash === user.password_hash) {
          return {
            id: user.id,
            email: user.email,
            name: user.nickname || user.email,
            nickname: user.nickname,
            isAdmin: user.is_admin || false,
            emailVerified: user.email_verified || false,
          }
        }

        return null
      }
    }),

    // NEW: OTP Credentials Provider
    CredentialsProvider({
      id: 'otp',
      name: 'OTP',
      credentials: {
        email: { label: 'Email', type: 'text' },
        otp: { label: 'OTP', type: 'text' }
      },
      async authorize({ email, otp }: any) {
        if (!email || !otp) {
          return null;
        }

        const result = await verifyOTPCode(email, otp);

        if (result.success && result.user) {
          return result.user;
        }

        return null;
      }
    }),

    // EXISTING: Google Provider
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
    signIn: async ({ user, account, profile }) => {
      // Handle credentials providers (both password and OTP)
      if (account?.provider === "credentials" || account?.provider === "otp") {
        return true;
      }

      // OAuth provider sign-in flow (existing logic)
      if (account?.provider === "google" && profile?.email) {
        // ... existing OAuth logic unchanged
        return true;
      }

      return true;
    },
    // ... rest of callbacks unchanged
  },
})
```

**How to call from UI component:**

```typescript
// In OTPVerifyForm component
const result = await signIn('otp', {
  email: email,
  otp: code,
  redirect: false
});

if (result?.ok) {
  // Success
  onSuccess();
} else {
  // Error
  setError('Código incorrecto');
}
```

### 11. Email Template

**File:** `app/utils/email-templates.ts`

**Add generateOTPEmail function:**

```typescript
export function generateOTPEmail(email: string, otpCode: string) {
  const subject = 'Tu código de acceso - Qatar Prode';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4a4a4a;">Tu código de acceso</h2>

      <p>Has solicitado un código para iniciar sesión en Qatar Prode.</p>

      <!-- OTP Code Display -->
      <div style="
        font-size: 48px;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        letter-spacing: 8px;
        text-align: center;
        padding: 30px 20px;
        background: #f5f5f5;
        border: 2px solid #8b0000;
        border-radius: 8px;
        margin: 30px 0;
        color: #8b0000;
      ">
        ${otpCode}
      </div>

      <div style="background: #e8f4f8; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>⏱️ Válido por 3 minutos</strong></p>
        <p style="margin: 5px 0;">Tienes máximo 3 intentos para ingresar este código.</p>
      </div>

      <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <p style="margin: 5px 0 10px 0;"><strong>⚠️ Seguridad:</strong></p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li>No compartas este código con nadie</li>
          <li>Qatar Prode nunca te pedirá este código por teléfono o email</li>
          <li>Si no solicitaste este código, puedes ignorar este mensaje</li>
        </ul>
      </div>

      <p style="color: #888; font-size: 12px; margin-top: 30px;">
        Este código fue solicitado para: ${email}<br>
        Si tienes problemas para iniciar sesión, contacta a soporte.
      </p>
    </div>
  `;

  const text = `
Tu código de acceso - Qatar Prode

Has solicitado un código para iniciar sesión en Qatar Prode.

Tu código: ${otpCode}

⏱️ Válido por 3 minutos
Tienes máximo 3 intentos para ingresar este código.

⚠️ SEGURIDAD:
• No compartas este código con nadie
• Qatar Prode nunca te pedirá este código por teléfono o email
• Si no solicitaste este código, puedes ignorar este mensaje

Este código fue solicitado para: ${email}
Si tienes problemas para iniciar sesión, contacta a soporte.
  `;

  return { to: email, subject, html, text };
}
```

## Files to Create

1. **Migration:**
   - `migrations/20260215000000_add_otp_support.sql`

2. **Components:**
   - `app/components/auth/otp-request-form.tsx`
   - `app/components/auth/otp-verify-form.tsx`

3. **Server Actions:**
   - `app/actions/otp-actions.ts`

4. **Tests:**
   - `__tests__/db/users-repository-otp.test.ts`
   - `__tests__/actions/otp-actions.test.ts`
   - `__tests__/components/auth/otp-request-form.test.tsx`
   - `__tests__/components/auth/otp-verify-form.test.tsx`

## Files to Modify

1. **Database:**
   - `app/db/tables-definition.ts` - Add OTP fields to UserTable interface
   - `app/db/users-repository.ts` - Add generateOTP, verifyOTP, clearOTP functions

2. **Auth:**
   - `auth.ts` - Add OTP Credentials provider

3. **Email:**
   - `app/utils/email-templates.ts` - Add generateOTPEmail function

4. **UI Components:**
   - `app/components/auth/login-form.tsx` - Add OTP link
   - `app/components/auth/login-or-signup-dialog.tsx` - Add OTP modes and handlers

## Testing Strategy

### Unit Tests (80%+ coverage)

**OTP Generation (`users-repository-otp.test.ts`):**
- ✅ Always generates 6 digits (no leading zeros)
- ✅ Range is 100,000 - 999,999
- ✅ Sets 3-minute expiration correctly
- ✅ Resets attempts to 0
- ✅ Updates otp_last_request
- ✅ Creates placeholder user if doesn't exist
- ✅ Rate limiting: blocks within 1 minute
- ✅ Rate limiting: allows after 1 minute

**OTP Verification (`users-repository-otp.test.ts`):**
- ✅ Correct code succeeds
- ✅ Wrong code increments attempts
- ✅ Wrong code shows remaining attempts (1st: "Te quedan 2 intentos")
- ✅ Wrong code shows remaining attempts (2nd: "Te queda 1 intento")
- ✅ 3rd wrong code locks OTP
- ✅ Expired code fails and clears OTP
- ✅ No OTP code fails
- ✅ Success sets email_verified to true
- ✅ Success adds 'otp' to auth_providers
- ✅ Success clears OTP fields

**Server Actions (`otp-actions.test.ts`):**
- ✅ sendOTPCode validates email format
- ✅ sendOTPCode rejects invalid email format
- ✅ sendOTPCode calls generateOTP
- ✅ sendOTPCode sends email via AWS SES (mocked)
- ✅ sendOTPCode handles email send failure
- ✅ verifyOTPCode validates inputs
- ✅ verifyOTPCode validates OTP format (6 digits only)
- ✅ verifyOTPCode rejects invalid OTP format (letters, wrong length)
- ✅ verifyOTPCode calls verifyOTP
- ✅ verifyOTPCode returns user object on success
- ✅ verifyOTPCode returns error on failure
- ✅ verifyOTPCode passes through attemptsRemaining
- ✅ verifyOTPCode identifies new user (isNewUser flag)

**Email Mocking Setup:**
```typescript
// __tests__/actions/otp-actions.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock email sending
vi.mock('@/app/utils/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true })
}));

// Import after mocking
import { sendEmail } from '@/app/utils/email';
import { sendOTPCode, verifyOTPCode } from '@/app/actions/otp-actions';

describe('OTP Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send email with correct parameters', async () => {
    await sendOTPCode('test@example.com');

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: expect.stringContaining('código de acceso'),
        html: expect.stringContaining('Tu código de acceso'),
        text: expect.any(String)
      })
    );
  });

  it('should handle email send failure', async () => {
    vi.mocked(sendEmail).mockResolvedValueOnce({ success: false });

    const result = await sendOTPCode('test@example.com');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Error al enviar');
  });
});
```

**UI Components:**
- ✅ OTPRequestForm renders email (readonly)
- ✅ OTPRequestForm sends OTP on button click
- ✅ OTPRequestForm shows loading state
- ✅ OTPRequestForm shows error messages
- ✅ OTPRequestForm calls onOTPSent on success
- ✅ OTPVerifyForm renders 6 input boxes
- ✅ OTPVerifyForm auto-focuses next box
- ✅ OTPVerifyForm backspace focuses previous
- ✅ OTPVerifyForm paste fills all boxes
- ✅ OTPVerifyForm auto-submits on 6 digits
- ✅ OTPVerifyForm shows countdown timer
- ✅ OTPVerifyForm shows error with attempts
- ✅ OTPVerifyForm resend enabled after 1 minute
- ✅ OTPVerifyForm calls onSuccess on correct code

### Integration Tests

**Happy Path:**
```typescript
it('should complete OTP flow: request → email → verify → sign-in', async () => {
  // 1. Request OTP
  const sendResult = await sendOTPCode('test@example.com');
  expect(sendResult.success).toBe(true);

  // 2. Verify email sent
  expect(mockSendEmail).toHaveBeenCalledWith(
    expect.objectContaining({
      to: 'test@example.com',
      subject: expect.stringContaining('código de acceso')
    })
  );

  // 3. Get OTP from mock
  const user = await findUserByEmail('test@example.com');
  const otpCode = user!.otp_code!;

  // 4. Verify OTP
  const verifyResult = await verifyOTPCode('test@example.com', otpCode);
  expect(verifyResult.success).toBe(true);
  expect(verifyResult.user).toBeDefined();

  // 5. Check email verified
  const updatedUser = await findUserByEmail('test@example.com');
  expect(updatedUser!.email_verified).toBe(true);
  expect(updatedUser!.otp_code).toBeNull();
});
```

**Expiration Flow:**
```typescript
it('should expire OTP after 3 minutes', async () => {
  // Request OTP
  await sendOTPCode('test@example.com');
  const user = await findUserByEmail('test@example.com');
  const otpCode = user!.otp_code!;

  // Mock time to 3 minutes + 1 second later
  vi.setSystemTime(new Date(Date.now() + 181000));

  // Try to verify
  const result = await verifyOTPCode('test@example.com', otpCode);
  expect(result.success).toBe(false);
  expect(result.error).toContain('expirado');

  // Check OTP cleared
  const updatedUser = await findUserByEmail('test@example.com');
  expect(updatedUser!.otp_code).toBeNull();
});
```

**Failed Attempts Flow:**
```typescript
it('should lock OTP after 3 failed attempts', async () => {
  await sendOTPCode('test@example.com');

  // Attempt 1 (wrong code)
  let result = await verifyOTPCode('test@example.com', '111111');
  expect(result.success).toBe(false);
  expect(result.attemptsRemaining).toBe(2);

  // Attempt 2 (wrong code)
  result = await verifyOTPCode('test@example.com', '222222');
  expect(result.success).toBe(false);
  expect(result.attemptsRemaining).toBe(1);

  // Attempt 3 (wrong code) - locks OTP
  result = await verifyOTPCode('test@example.com', '333333');
  expect(result.success).toBe(false);
  expect(result.error).toContain('Demasiados intentos');

  // Check OTP cleared
  const user = await findUserByEmail('test@example.com');
  expect(user!.otp_code).toBeNull();

  // Correct code should now fail (OTP cleared)
  const user2 = await findUserByEmail('test@example.com');
  result = await verifyOTPCode('test@example.com', user2!.otp_code!);
  expect(result.success).toBe(false);
});
```

**Rate Limiting Flow:**
```typescript
it('should block second OTP request within 1 minute', async () => {
  // First request
  const result1 = await sendOTPCode('test@example.com');
  expect(result1.success).toBe(true);

  // Immediate second request (should fail)
  const result2 = await sendOTPCode('test@example.com');
  expect(result2.success).toBe(false);
  expect(result2.error).toContain('espera un minuto');

  // Mock time to 1 minute + 1 second later
  vi.setSystemTime(new Date(Date.now() + 61000));

  // Third request (should succeed)
  const result3 = await sendOTPCode('test@example.com');
  expect(result3.success).toBe(true);
});
```

**New User Account Creation (Complete Flow):**
```typescript
it('should create and verify new user account in single OTP flow', async () => {
  const newEmail = 'newuser@example.com';

  // 1. Verify user doesn't exist
  let user = await findUserByEmail(newEmail);
  expect(user).toBeUndefined();

  // 2. Request OTP (generateOTP creates placeholder user)
  const sendResult = await sendOTPCode(newEmail);
  expect(sendResult.success).toBe(true);

  // 3. Verify placeholder created with correct initial state
  user = await findUserByEmail(newEmail);
  expect(user).toBeDefined();
  expect(user!.email_verified).toBe(false); // Not verified yet
  expect(user!.password_hash).toBeNull(); // OTP-only user
  expect(user!.auth_providers).toContain('otp');
  expect(user!.otp_code).toBeDefined(); // Has OTP code
  expect(user!.otp_expiration).toBeDefined(); // Has expiration

  // 4. Verify OTP (activates account)
  const otpCode = user!.otp_code!;
  const verifyResult = await verifyOTPCode(newEmail, otpCode);

  // 5. Verify account activated correctly
  expect(verifyResult.success).toBe(true);
  expect(verifyResult.isNewUser).toBe(true); // Flag set
  expect(verifyResult.user).toBeDefined();

  // 6. Verify final user state
  user = await findUserByEmail(newEmail);
  expect(user!.email_verified).toBe(true); // Now verified
  expect(user!.otp_code).toBeNull(); // OTP cleared
  expect(user!.otp_expiration).toBeNull(); // Expiration cleared
  expect(user!.otp_attempts).toBe(0); // Attempts reset
});

it('should handle concurrent OTP requests for new user', async () => {
  const newEmail = 'concurrent@example.com';

  // First request (creates placeholder)
  const result1 = await sendOTPCode(newEmail);
  expect(result1.success).toBe(true);

  // Immediate second request (should be rate limited)
  const result2 = await sendOTPCode(newEmail);
  expect(result2.success).toBe(false);
  expect(result2.error).toContain('espera un minuto');
});
```

### Manual Testing Checklist

**OTP Request:**
- [ ] Email input field pre-filled from previous step
- [ ] "Enviar código" button triggers request
- [ ] Loading spinner shows during request
- [ ] Success message: "Código enviado. Revisa tu email."
- [ ] Error message shown if rate limited
- [ ] Can cancel and return to login

**Email Delivery:**
- [ ] OTP email arrives within 30 seconds
- [ ] Subject line correct: "Tu código de acceso - Qatar Prode"
- [ ] OTP code large and clearly visible
- [ ] 6 digits, no spaces
- [ ] Expiration time mentioned (3 minutos)
- [ ] Security warnings present
- [ ] Plain text version includes OTP

**OTP Verification:**
- [ ] 6 input boxes render correctly
- [ ] Auto-focus to next box after digit
- [ ] Backspace focuses previous box
- [ ] Can paste 6-digit code (fills all boxes)
- [ ] Auto-submits after 6th digit
- [ ] Countdown timer shows 3:00 initially
- [ ] Timer counts down every second
- [ ] Timer color changes (green → yellow → red)
- [ ] Correct code signs user in
- [ ] Wrong code shows error with attempts remaining
- [ ] 3rd wrong code locks OTP
- [ ] Expired code shows expiration error
- [ ] Resend link disabled for first minute
- [ ] Resend link enabled after 1 minute
- [ ] Resend generates new OTP
- [ ] Old OTP invalidated after resend

**New User Flow:**
- [ ] Non-existent email can request OTP
- [ ] OTP verification creates account
- [ ] Email marked as verified
- [ ] Nickname setup dialog shown
- [ ] User can set nickname
- [ ] User signed in after nickname setup
- [ ] auth_providers includes "otp"

**Error Handling:**
- [ ] Network errors handled gracefully
- [ ] Email send failures shown to user
- [ ] Invalid OTP format rejected (non-digits)
- [ ] Empty OTP rejected
- [ ] OTP length validation (must be 6 digits)

**Accessibility:**
- [ ] Keyboard navigation works (tab between fields)
- [ ] Screen reader announces OTP input boxes
- [ ] Screen reader announces countdown timer
- [ ] Screen reader announces error messages
- [ ] High contrast colors (WCAG AA)
- [ ] Focus indicators visible

**Security Audit:**
- [ ] OTP codes not logged in server console
- [ ] OTP codes not in error messages
- [ ] Rate limiting prevents brute force
- [ ] 3-minute expiration enforced
- [ ] 3-attempt limit enforced
- [ ] Email timing attack prevented (doesn't reveal existence)
- [ ] OTP transmitted via HTTPS only
- [ ] OTP not in URL parameters
- [ ] OTP cleared after successful verification
- [ ] OTP cleared after max attempts
- [ ] OTP cleared after expiration

## Implementation Steps

### Phase 1: Backend Foundation (Days 1-2)

**Day 1 Morning: Database Migration**
1. Create migration file `20260215000000_add_otp_support.sql`
2. Add OTP fields to users table
3. Create index on otp_code
4. Test migration locally
5. Update TypeScript types in `tables-definition.ts`

**Day 1 Afternoon: Repository Functions**
1. Implement `generateOTP()` with tests
   - OTP generation algorithm
   - Rate limiting check
   - Expiration calculation
   - User creation for new emails
2. Implement `verifyOTP()` with tests
   - Code verification
   - Attempts tracking
   - Expiration check
   - Email verification update
3. Implement `clearOTP()` with tests
4. Run all repository tests → 80%+ coverage

**Day 2 Morning: Server Actions**
1. Create `app/actions/otp-actions.ts`
2. Implement `sendOTPCode()` with tests
   - Call generateOTP
   - Send email via AWS SES
   - Error handling
3. Implement `verifyOTPCode()` with tests
   - Call verifyOTP
   - Return user object
4. Run all action tests → 80%+ coverage

**Day 2 Afternoon: Email Template & Auth**
1. Add `generateOTPEmail()` to `email-templates.ts`
   - HTML version with styling
   - Plain text version
2. Update `auth.ts` - Add OTP provider
3. Test email template rendering
4. Test OTP auth provider

### Phase 2: Frontend Components (Days 2-3)

**Day 2 Evening: OTPRequestForm**
1. Create component with email display
2. Implement send button with loading state
3. Add error handling
4. Write component tests
5. Test manually

**Day 3 Morning: OTPVerifyForm (Part 1)**
1. Create 6 input boxes
2. Implement auto-focus logic
3. Implement backspace navigation
4. Implement paste handling
5. Write tests for input logic

**Day 3 Afternoon: OTPVerifyForm (Part 2)**
1. Implement countdown timer
2. Add timer color coding
3. Implement resend logic (1-minute delay)
4. Implement verification submission
5. Add error display with attempts
6. Write tests for timer and verification

### Phase 3: Integration & UI Updates (Day 3-4)

**Day 3 Evening: Update Existing Components**
1. Update `login-form.tsx`
   - Add "Iniciar sesión con código" link
   - Pass handler to parent
2. Update `login-or-signup-dialog.tsx`
   - Add 'otpRequest' and 'otpVerify' modes
   - Implement mode handlers
   - Render OTP forms
3. Test dialog flow

**Day 4 Morning: Integration Testing**
1. Write happy path integration test
2. Write expiration flow test
3. Write failed attempts test
4. Write rate limiting test
5. Write new user creation test
6. Run all integration tests

**Day 4 Afternoon: Manual Testing**
1. Complete manual testing checklist
2. Test in development environment
3. Test email delivery via AWS SES
4. Test all error scenarios
5. Test accessibility
6. Fix any issues found

### Phase 4: Quality Assurance (Day 4)

**Day 4 Evening: Final Validation**
1. Run full test suite → 80%+ coverage
2. Run lint → 0 errors
3. Run build → success
4. Check for any TypeScript errors
5. Security audit checklist

**Pre-commit checklist:**
- [ ] All tests passing (npm test)
- [ ] Lint passing (npm run lint)
- [ ] Build passing (npm run build)
- [ ] 80%+ test coverage on new code
- [ ] Manual testing completed
- [ ] Security audit completed
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] TypeScript strict mode passing

## Quality Gates (SonarCloud)

**Requirements:**
- Code coverage: ≥80% on new code
- 0 new issues (any severity: low, medium, high, critical)
- Security rating: A
- Maintainability: B or higher
- Duplicated code: <5%

**Critical paths requiring 100% coverage:**
- `generateOTP()` - Security-critical
- `verifyOTP()` - Security-critical
- Rate limiting logic
- Expiration checks
- Attempts tracking

## Rollback Plan

**If critical issues found in production:**

1. **Immediate action:** Remove OTP option from UI
   ```typescript
   // In login-form.tsx, comment out OTP link
   // {/* <Typography onClick={onOTPLoginClick}>
   //   Iniciar sesión con código por email
   // </Typography> */}
   ```

2. **Existing OTPs:** Will expire naturally within 3 minutes
3. **User impact:** Users can still use password/Google auth
4. **Data integrity:** No data corruption (all fields nullable)
5. **Re-enable:** After fixes deployed and validated

**Rollback command:**
```bash
# If database rollback needed
psql -d qatar_prode < migrations/rollback_20260215000000_add_otp_support.sql
```

**Rollback migration:**
```sql
-- Rollback: Remove OTP support
ALTER TABLE users DROP COLUMN otp_code;
ALTER TABLE users DROP COLUMN otp_expiration;
ALTER TABLE users DROP COLUMN otp_attempts;
ALTER TABLE users DROP COLUMN otp_last_request;
DROP INDEX IF EXISTS idx_users_otp_code;
```

## Open Questions

❓ **Q1:** Should we use `Math.random()` or `crypto.randomInt()` for OTP generation?
**Recommendation:** Start with `Math.random()` for simplicity. Sufficient for OTP (not cryptographic keys). Can upgrade to `crypto.randomInt()` if needed.

❓ **Q2:** Should we allow multiple active OTPs per user?
**Recommendation:** No. Each new OTP request invalidates the previous one. Simpler, more secure.

❓ **Q3:** Should OTP work for password resets too?
**Recommendation:** Out of scope for this story. Current password reset uses magic links. Can be a future enhancement.

❓ **Q4:** Should we log OTP requests for security auditing?
**Recommendation:** Yes, but don't log the OTP code itself. Log: email, timestamp, IP address, success/failure.

❓ **Q5:** Should we add CAPTCHA to prevent OTP spam?
**Recommendation:** Not initially. Rate limiting (1 per minute) should be sufficient. Monitor in production and add CAPTCHA if needed.

## Success Metrics

**Adoption:**
- % of sign-ins using OTP (target: 10-20% in first month)
- % of new users choosing OTP vs password
- OTP vs password distribution over time

**Performance:**
- OTP email delivery time (target: < 5 seconds, p95)
- OTP verification time (target: < 100ms, p95)
- Failed OTP attempts rate (target: < 5%)

**Security:**
- Brute force attempts detected (target: 0)
- Average OTP requests per user per day
- Rate limiting triggers per day

**Quality:**
- 0 new SonarCloud issues
- 80%+ test coverage on new code
- 0 critical bugs in first week post-launch
- User satisfaction (qualitative feedback)

## Dependencies

**External:**
- ✅ AWS SES configured (already done)
- ✅ Email sending infrastructure (already exists)

**Internal:**
- ✅ NextAuth.js v5 (already installed)
- ✅ Kysely ORM (already used)
- ✅ Progressive disclosure UX (#136 completed)

**Environment Variables:**
- No new variables needed (uses existing AWS SES config)

## Out of Scope (Future Enhancements)

- SMS OTP (requires Twilio integration)
- Authenticator app TOTP (requires QR code generation)
- Hardware key support (WebAuthn)
- "Remember device" feature (skip OTP for 30 days)
- Custom OTP length (4 or 8 digits)
- OTP for password reset (current flow uses magic links)

## Notes

- This story builds on #136 (Google OAuth) progressive disclosure UX
- OTP codes are stored directly on user records (not separate table)
- New users are created with placeholder records on OTP request
- Email verification is automatic through OTP verification
- All error messages in Spanish for consistency
- Material-UI v7 components used for consistency
- Testing follows project patterns (Vitest, mock helpers)

## Validation Considerations

**Pre-merge requirements:**
1. All acceptance criteria met ✓
2. 80%+ test coverage on new code ✓
3. 0 new SonarCloud issues (any severity) ✓
4. Manual testing checklist completed ✓
5. Security audit checklist completed ✓
6. Deployed to Vercel Preview and validated ✓
7. User testing and approval ✓

**SonarCloud focus areas:**
- Security hotspots in OTP generation/verification
- Code coverage on repository functions
- Code duplication in UI components
- Cognitive complexity in OTPVerifyForm
- Maintainability ratings

---

**Estimated Effort:** 3-4 days
**Priority:** High
**Complexity:** Medium (security critical, UX polish needed)
**Blocks:** None (can be done after #136)
**Risk Level:** Low (well-researched, comprehensive testing plan)

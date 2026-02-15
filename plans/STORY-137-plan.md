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
│   → Show SignupForm (traditional email+password signup)
│   → SignupForm includes "Registrarse con código" link
│                                         │
│ IF userExists = true:                   │
│   IF hasPassword = true:                │
│     → Show LoginForm with:              │
│       • Password field                  │
│       • "¿Olvidaste tu contraseña?"    │
│       • "Iniciar sesión con código"    │ ← NEW
│   IF hasPassword = false (OTP-only):    │ ← NEW
│     → Auto-send OTP, show OTPVerifyForm │
│       (Skip LoginForm entirely)         │
│   IF hasGoogle = true:                  │
│     → EmailInputForm shows Google btn   │
│                                         │
│ ALWAYS available in LoginForm:          │
│   → "Iniciar sesión con código por email" │
└─────────────────────────────────────────┘
```

**Key Changes:**
- **New users** still see SignupForm (can create password-based account)
- **OTP-only users** get OTP auto-sent (no LoginForm shown)
- **Password users** can choose password OR OTP login
- SignupForm includes OTP signup option

**OTP Flow (Existing User):**

```
LoginForm
  ↓
Click "Iniciar sesión con código por email"
  ↓
Server sends OTP immediately (no confirmation step)
  ↓
OTPVerifyForm
  • Display email (readonly)
  • 6 input boxes (auto-focus)
  • Countdown timer (3:00)
  • Auto-submit on 6 digits
  • Error messages (attempts remaining)
  • Resend link (enabled after 1 min)
  ↓
IF correct code:
  ├─ Existing user → Sign in directly
  └─ New user → Show setup form → Create account → Sign in
IF wrong code:
  ├─ < 3 attempts → Show error with remaining
  └─ 3 attempts → Clear OTP, show "Solicita nuevo código"
IF expired:
  └─ Show "Código expirado. Solicita uno nuevo"
```

**OTP Flow (OTP-Only User - Auto-send):**

```
EmailInputForm → "Continuar"
  ↓
Server detects: userExists=true, hasPassword=false
  ↓
Server auto-sends OTP (no user action needed)
  ↓
OTPVerifyForm (same as above)
```

**OTP Flow (New User Signup):**

```
SignupForm
  ↓
Click "Registrarse con código por email"
  ↓
Server sends OTP immediately
  ↓
OTPVerifyForm (verify email ownership)
  ↓
IF correct code:
  ↓
AccountSetupForm
  • Nickname field (required)
  • Password field (optional - "Opcional: Crear contraseña por si acaso")
  • Submit button
  ↓
Create user account with provided info
  ↓
Sign in → Redirect to home
```

### 5. Account Creation via OTP

**Scenario:** New user choosing OTP signup

**Flow:**
1. User enters email in EmailInputForm (doesn't exist in DB)
2. User shown SignupForm with two options:
   - Traditional: Email + Password + Nickname
   - OTP: "Registrarse con código por email" link
3. User clicks "Registrarse con código por email"
4. Server sends OTP immediately
5. User verifies OTP in OTPVerifyForm
6. **After successful verification, show AccountSetupForm:**
   ```typescript
   // AccountSetupForm fields:
   {
     nickname: string,        // Required
     password: string | null  // Optional - "Opcional: Crear contraseña por si acaso"
   }
   ```
7. User enters nickname (required) and optionally a password
8. User submits form
9. **Server creates account with all info:**
   ```typescript
   {
     email: enteredEmail,
     nickname: providedNickname,
     password_hash: providedPassword ? await hash(providedPassword) : null,
     email_verified: true,  // Verified by OTP
     auth_providers: providedPassword ? ["otp", "password"] : ["otp"],
     oauth_accounts: []
   }
   ```
10. Sign in user automatically
11. Redirect to home

**Rationale:**
- **Email verified first** via OTP (proves ownership)
- **Setup before account creation** (cleaner flow, no partial accounts)
- **Optional password** (user choice - convenience vs. backup)
- **Single transaction** (all user data collected before DB insert)
- **Consistent with OAuth** (but setup happens before creation, not after)

**Why Optional Password:**
- Many users prefer pure passwordless (one less thing to remember)
- Power users can set backup password "just in case"
- User can always add password later via account settings
- Reduces friction for casual users

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

### 1. OTPVerifyForm Component

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

### 2. AccountSetupForm Component

**Purpose:** Collect user information (nickname + optional password) after OTP verification for new accounts

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Dialog: "Completa tu perfil"              │
├─────────────────────────────────────────────┤
│                                             │
│  ¡Email verificado! Ahora completa tu       │
│  información para crear tu cuenta.          │
│                                             │
│  Nickname: _______________________          │
│             (Requerido)                     │
│                                             │
│  Contraseña (opcional):                     │
│  ___________________________________        │
│  Opcional: Crear contraseña por si acaso   │
│                                             │
│  [  Crear cuenta  ]                        │
│                                             │
└─────────────────────────────────────────────┘
```

**States:**

**Initial State:**
```
┌─────────────────────────────────────────────┐
│ Completa tu perfil                          │
│                                             │
│ Nickname: _______________________           │
│           Requerido                         │
│                                             │
│ Contraseña (opcional):                      │
│ ___________________________________         │
│ Opcional: Crear contraseña por si acaso    │
│                                             │
│ [  Crear cuenta  ] ← Disabled (no nickname) │
└─────────────────────────────────────────────┘
```

**Valid State:**
```
┌─────────────────────────────────────────────┐
│ Completa tu perfil                          │
│                                             │
│ Nickname: JuanCarlos_______________         │
│           ✓ Disponible                      │
│                                             │
│ Contraseña (opcional):                      │
│ ********_________________________           │
│ Opcional: Crear contraseña por si acaso    │
│                                             │
│ [  Crear cuenta  ] ← Enabled                │
└─────────────────────────────────────────────┘
```

**Error State (Nickname Taken):**
```
┌─────────────────────────────────────────────┐
│ ⚠️ Este nickname ya está en uso            │
├─────────────────────────────────────────────┤
│ Completa tu perfil                          │
│                                             │
│ Nickname: JuanCarlos_______________         │
│           ✗ No disponible (red)             │
│                                             │
│ Contraseña (opcional):                      │
│ ___________________________________         │
│ Opcional: Crear contraseña por si acaso    │
│                                             │
│ [  Crear cuenta  ]                         │
└─────────────────────────────────────────────┘
```

**Loading State:**
```
┌─────────────────────────────────────────────┐
│ Completa tu perfil                          │
│                                             │
│ Nickname: JuanCarlos_______________         │
│ Contraseña (opcional): ********             │
│                                             │
│ [  ⏳ Creando cuenta...  ] ← Disabled      │
└─────────────────────────────────────────────┘
```

**Material-UI Components:**
- `TextField` (variant="standard", required) for nickname
- `TextField` (variant="standard", type="password", optional) for password
- `Button` (variant="contained", fullWidth) for create account button
- `Alert` (severity="error") for error messages
- `Typography` (variant="body2", color="text.secondary") for help text
- `CircularProgress` for loading spinner

**Validation:**
- Nickname: 3-20 characters, alphanumeric + underscore
- Password (if provided): Min 8 characters
- Submit button disabled until nickname is valid

**Responsive:**
- Mobile: Full width, stacked vertically
- Tablet: Same as mobile (dialog already constrained)
- Desktop: Dialog max-width 400px, centered

---

### 3. Updated SignupForm Component

**Change:** Add OTP signup link alongside traditional signup

**After:**
```
┌─────────────────────────────────────────────┐
│ Dialog: "Crear Cuenta"                      │
├─────────────────────────────────────────────┤
│  Email: test@example.com (readonly)         │
│  ────────────────────────────────           │
│                                             │
│  Nickname: _______________________          │
│  ────────────────────────────────           │
│                                             │
│  Contraseña: ********                       │
│  ────────────────────────────────           │
│                                             │
│  [  Crear cuenta  ]                        │
│                                             │
│  Registrarse con código por email          │
│  ────────────────────────────────────────  │
│  ↑ Blue, underlined, clickable link        │
│                                             │
│  [← Volver a email]                        │
└─────────────────────────────────────────────┘
```

**Position:** Below "Crear cuenta" button
**Style:** Typography variant="body2", color="primary", underlined, centered
**Behavior:** Clicking sends OTP and switches to OTPVerifyForm

---

### 4. Updated LoginForm Component

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
**Behavior:** Clicking sends OTP immediately and switches to OTPVerifyForm

---

### 5. Dialog Mode Flow

**Complete navigation flow:**

```
EmailInputForm
      ↓
   Enter email → Check auth methods
      ↓
┌─────┴──────────────────┐
│                        │
userExists?              │
│                        │
NO                      YES
│                        │
SignupForm              hasPassword?
│                        │
├─ Traditional          YES    NO (OTP-only)
│  (password)            │          │
│                    LoginForm   Auto-send OTP
├─ Click "Registrarse           │
│  con código"             ├──────┴──────┐
│  ↓                       │             │
│  [OTP sent]         Click "Iniciar   [OTP sent]
│  │                  con código"       │
│  │                       │             │
└──┴───────────────────────┴─────────────┘
                  ↓
            OTPVerifyForm ← NEW
                  │
            Enter 6 digits
                  ↓
          ┌───────┴────────┐
          │                │
       Correct?          Wrong?
          │                │
         YES              NO
          │                │
     userExists?      Show error
          │             + attempts
      YES    NO             │
       │      │        3rd attempt?
   Sign in   │             │
             ↓            YES
    AccountSetupForm ← NEW │
       │                   │
    Enter nickname    Lock OTP
    + optional pwd    + show
       │              "Solicitar
    Create user        nuevo"
       │                   │
    Sign in                │
       │                   │
       └───────────────────┘
```

**Dialog Titles by Mode:**
- emailInput: "Ingresar o Registrarse"
- login: "Ingresar"
- otpVerify: "Verificar Código"   ← NEW
- accountSetup: "Completa tu perfil" ← NEW
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

#### 7.1. OTPVerifyForm Component

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

#### 7.2. AccountSetupForm Component

**Purpose:** Collect user information after OTP verification for new account creation

**Props:**
```typescript
type AccountSetupFormProps = {
  readonly email: string;
  readonly verifiedOTP: string; // Already verified OTP
  readonly onSuccess: () => void;
  readonly onCancel: () => void;
}
```

**Features:**
- Nickname input (required, 3-20 chars)
- Password input (optional, min 8 chars)
- Real-time nickname availability check
- Loading state during account creation
- Error handling (nickname taken, etc.)

**Implementation:**
```typescript
const [nickname, setNickname] = useState('');
const [password, setPassword] = useState('');
const [nicknameError, setNicknameError] = useState('');
const [loading, setLoading] = useState(false);

const handleCreateAccount = async () => {
  setLoading(true);
  setNicknameError('');

  // Create account with OTP verification proof
  const result = await createAccountViaOTP({
    email,
    nickname,
    password: password || null,
    verifiedOTP
  });

  if (!result.success) {
    setNicknameError(result.error || 'Error al crear la cuenta');
    setLoading(false);
    return;
  }

  // Sign in automatically
  await signIn('otp', {
    email,
    otp: verifiedOTP,
    redirect: false
  });

  onSuccess();
};

// Real-time nickname validation
useEffect(() => {
  if (nickname.length >= 3) {
    checkNicknameAvailability(nickname).then(available => {
      if (!available) {
        setNicknameError('Este nickname ya está en uso');
      }
    });
  }
}, [nickname]);
```

**Visual Layout:**
```
┌─────────────────────────────────────┐
│   ¡Email verificado!                │
│   Completa tu información           │
├─────────────────────────────────────┤
│                                     │
│   Nickname *                        │
│   ┌─────────────────────────┐      │
│   │ JuanCarlos______________│      │
│   └─────────────────────────┘      │
│   ✓ Disponible                      │
│                                     │
│   Contraseña (opcional)             │
│   ┌─────────────────────────┐      │
│   │ ********________________│      │
│   └─────────────────────────┘      │
│   Opcional: por si acaso            │
│                                     │
│   [  Crear cuenta  ]                │
│                                     │
└─────────────────────────────────────┘
```

#### 7.3. Update SignupForm

**Changes:**
- Add link below "Crear cuenta" button: "Registrarse con código por email"
- Link triggers OTP send and switches to OTPVerifyForm

```typescript
<div style={{ marginTop: '10px', textAlign: 'center' }}>
  <Typography
    variant="body2"
    color="primary"
    onClick={onOTPSignupClick}
    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
  >
    Registrarse con código por email
  </Typography>
</div>
```

#### 7.4. Update LoginForm

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

#### 7.5. Update LoginOrSignupDialog

**Add new dialog modes:**
```typescript
type DialogMode =
  | 'emailInput'
  | 'login'
  | 'signup'
  | 'forgotPassword'
  | 'resetSent'
  | 'verificationSent'
  | 'otpVerify'      // NEW
  | 'accountSetup';  // NEW
```

**Handle OTP flow:**
```typescript
const handleOTPLoginClick = async () => {
  // Send OTP immediately (no confirmation step)
  const result = await sendOTPCode(email);

  if (result.success) {
    switchMode('otpVerify');
  } else {
    setError(result.error || 'Error al enviar el código');
  }
};

const handleOTPSignupClick = async () => {
  // Send OTP immediately for new user signup
  const result = await sendOTPCode(email);

  if (result.success) {
    setIsNewUserSignup(true); // Flag for after verification
    switchMode('otpVerify');
  } else {
    setError(result.error || 'Error al enviar el código');
  }
};

const handleOTPVerifySuccess = async (email: string, code: string) => {
  // Check if this is a new user signup
  const user = await findUserByEmail(email);

  if (!user || isNewUserSignup) {
    // New user - show account setup
    setVerifiedOTP(code); // Store for account creation
    switchMode('accountSetup');
  } else {
    // Existing user - sign in directly
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

const handleAccountSetupSuccess = () => {
  handleCloseLoginDialog(true);
};
```

**Render OTP forms:**
```typescript
case 'accountSetup':
  return (
    <AccountSetupForm
      email={email}
      verifiedOTP={verifiedOTP}
      onSuccess={handleAccountSetupSuccess}
      onCancel={handleCloseLoginDialog}
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
   - `app/components/auth/account-setup-form.tsx`
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
- ✅ OTPVerifyForm renders 6 input boxes
- ✅ OTPVerifyForm auto-focuses next box
- ✅ OTPVerifyForm backspace focuses previous
- ✅ OTPVerifyForm paste fills all boxes
- ✅ OTPVerifyForm auto-submits on 6 digits
- ✅ OTPVerifyForm shows countdown timer
- ✅ OTPVerifyForm shows error with attempts
- ✅ OTPVerifyForm resend enabled after 1 minute
- ✅ OTPVerifyForm calls onSuccess on correct code
- ✅ AccountSetupForm renders nickname input (required)
- ✅ AccountSetupForm renders password input (optional)
- ✅ AccountSetupForm validates nickname availability
- ✅ AccountSetupForm shows loading state during creation
- ✅ AccountSetupForm creates account with provided info
- ✅ AccountSetupForm calls onSuccess after sign-in

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

**Day 2 Evening: OTPVerifyForm (Part 1)**
1. Create 6 input boxes
2. Implement auto-focus logic
3. Implement backspace navigation
4. Implement paste handling
5. Write tests for input logic

**Day 3 Morning: OTPVerifyForm (Part 2)**
1. Implement countdown timer
2. Add timer color coding
3. Implement resend logic (1-minute delay)
4. Implement verification submission
5. Add error display with attempts
6. Write tests for timer and verification

**Day 3 Afternoon: AccountSetupForm**
1. Create form with nickname + optional password
2. Implement nickname validation
3. Implement real-time availability check
4. Add loading state during account creation
5. Write component tests
6. Test manually

### Phase 3: Integration & UI Updates (Day 3-4)

**Day 3 Evening: Update Existing Components**
1. Update `login-form.tsx`
   - Add "Iniciar sesión con código" link
   - Send OTP immediately on click
2. Update `signup-form.tsx`
   - Add "Registrarse con código" link
   - Send OTP immediately on click
3. Update `login-or-signup-dialog.tsx`
   - Add 'otpVerify' and 'accountSetup' modes
   - Implement mode handlers
   - Render OTP and setup forms
   - Auto-send OTP for OTP-only users
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

## Plan Updates

### Update #1 (2026-02-15) - User Feedback on PR #146

**Feedback received via PR review comments. Key changes implemented:**

#### 1. Removed OTPRequestForm Component (Comment #1, line 157)
- **Issue:** Unnecessary intermediate step to confirm sending OTP
- **Change:** Send OTP immediately when user clicks "Iniciar sesión con código por email"
- **Impact:**
  - Removed `OTPRequestForm` component entirely
  - Updated dialog flow to skip confirmation step
  - Simplified UX (one less click)

#### 2. Clarified New User Signup Path (Comment #2, line 187)
- **Issue:** Concern that timing attack prevention blocks new users from creating password-based accounts
- **Change:** Kept `SignupForm` accessible for new users
- **Implementation:**
  - `SignupForm` still shows for new emails (userExists = false)
  - `SignupForm` includes both traditional (email+password) and OTP signup options
  - "Registrarse con código por email" link added to SignupForm

#### 3. Account Setup Before Creation (Comment #3, line 202)
- **Issue:** OAuth flow doesn't enforce nickname setup, users redirected without completing profile
- **Change:** Show `AccountSetupForm` AFTER OTP verification, BEFORE creating account
- **New Flow:**
  1. User enters email → OTP sent
  2. User verifies OTP → Email ownership proven
  3. Show `AccountSetupForm` (nickname + optional password)
  4. User submits → Account created with all info
  5. Auto sign-in → Redirect to home
- **Benefits:**
  - Complete profile before account creation
  - No partial accounts in DB
  - Single transaction for user creation

#### 4. Optional Password Field (Comments #4 & #5, line 209)
- **Issue:** Users may not remember they set a password during OTP signup
- **Change:** Password field made optional with clear labeling
- **Implementation:**
  - Label: "Contraseña (opcional)"
  - Help text: "Opcional: Crear contraseña por si acaso"
  - If provided: User has both OTP and password auth
  - If omitted: Pure OTP-only user
- **Alternative Approach:** Auto-send OTP for OTP-only users (see #5)

#### 5. Auto-Send OTP for OTP-Only Users (Comment #5, line 209)
- **Issue:** OTP-only users still see LoginForm (password field)
- **Change:** In progressive disclosure, detect OTP-only users and auto-send OTP
- **Implementation:**
  ```typescript
  IF userExists = true AND hasPassword = false:
    → Auto-send OTP immediately
    → Show OTPVerifyForm (skip LoginForm)
  ```
- **Benefits:**
  - Seamless experience for OTP-only users
  - No confusing password field they can't use
  - Consistent with "passwordless" goal

#### Files Updated:
- Visual prototypes: Removed `OTPRequestForm`, added `AccountSetupForm` and `SignupForm` update
- Progressive disclosure flow: Added auto-send for OTP-only users
- Dialog mode flow: Updated navigation to reflect new flow
- UI components: Removed section 7.1 (OTPRequestForm), added section 7.2 (AccountSetupForm)
- Testing checklist: Replaced OTPRequestForm tests with AccountSetupForm tests
- Implementation timeline: Reordered components, removed OTPRequestForm day

#### Summary:
These changes improve UX by:
1. ✅ Reducing friction (no OTPRequestForm confirmation)
2. ✅ Complete profile upfront (nickname + optional password before account creation)
3. ✅ Better progressive disclosure (auto-send for OTP-only users)
4. ✅ User choice (password optional, not forced)
5. ✅ Maintaining security (timing attack prevention, rate limiting unchanged)

---

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

---

## Implementation Amendments

*This section documents deviations, fixes, and adjustments discovered during implementation.*

### Amendment 1: OTP Double-Verification Issue (2026-02-15)

**Issue:** CredentialsSignin error when verifying OTP. Root cause: OTP was being verified and cleared in the component, then NextAuth's authorize function tried to verify again but OTP was already gone.

**Solution:**
- Modified `verifyOTP()` in `users-repository.ts` to NOT clear OTP after verification
- Added `clearOTP()` call in NextAuth's OTP authorize function after successful authentication
- This allows component to verify OTP before account setup while keeping it valid for final sign-in

**Files Changed:**
- `app/db/users-repository.ts`: Removed OTP clearing from `verifyOTP()`
- `auth.ts`: Added `clearOTP()` import and call in OTP authorize function

**Commit:** b9d2230

---

### Amendment 2: UI Refresh After OTP Login (2026-02-15)

**Issue:** After successful OTP login, dialog closed but UI didn't update with new session state, leaving users confused about whether they were logged in.

**Solution:**
- Imported `useRouter` from `next/navigation` in OTP components
- Called `router.refresh()` after successful `signIn()` to trigger session update
- Added router mock in tests to prevent "app router not mounted" error

**Files Changed:**
- `app/components/auth/login-or-signup-dialog.tsx`: Added useRouter, call refresh after OTP login
- `app/components/auth/account-setup-form.tsx`: Added useRouter, call refresh after account creation
- `__tests__/components/auth/login-or-signup-dialog.test.tsx`: Mocked useRouter with createMockRouter

**Commit:** 715b1c5

---

### Amendment 3: Prominent OTP Button Styling (2026-02-15)

**Issue:** User feedback indicated OTP links were not prominent enough - implemented as small underlined text, unlikely to be discovered or used.

**Solution:**
- Converted OTP text links to outlined Material-UI buttons with VpnKey icon (🔑)
- Positioned OTP buttons next to main action buttons (side-by-side layout)
- Used consistent "Código por Email" text with 12px gap spacing
- Disabled buttons during loading state

**Files Changed:**
- `app/components/auth/login-form.tsx`: OTP link → button with icon
- `app/components/auth/signup-form.tsx`: OTP link → button with icon

**UX Impact:** Makes passwordless OTP authentication more discoverable and encourages adoption.

**Commit:** 27501b4

---

### Amendment 4: Auto-Trigger Google Sign-In (2026-02-15)

**Issue:** When user entered email for Google-only account (userExists=true, hasPassword=false, hasGoogle=true), nothing happened - no error, no message, no action.

**Solution:**
- Added auto-trigger logic in `handleEmailSubmit` for Google-only users
- When detected, automatically calls `signIn('google', { callbackUrl: '/' })`
- Eliminates confusion and creates seamless flow for Google-only accounts

**Files Changed:**
- `app/components/auth/login-or-signup-dialog.tsx`: Added Google auto-trigger condition

**Flow:** User enters email → System detects Google-only → Google OAuth starts automatically

**Commit:** c5de795

---

### Testing Notes

All amendments were validated with:
- ✅ Full test suite: 3810 tests passed
- ✅ ESLint: Passed (warnings only, no errors)
- ✅ TypeScript build: Succeeded
- ✅ User acceptance testing in Vercel Preview
- ✅ Manual testing of all affected flows

### Security Considerations

- No security regressions introduced
- OTP clearing logic moved but security guarantees maintained
- All auth flows still properly validated
- Rate limiting and attempt tracking unchanged


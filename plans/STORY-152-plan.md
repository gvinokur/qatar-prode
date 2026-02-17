# Implementation Plan: [i18n] Translate Authentication Flow (#152)

## Context

Story #152 aims to internationalize the entire authentication flow, including all UI components and email templates. This is part of the larger i18n initiative (milestone: Internationalization Support) that began with stories #150 (translation key extraction) and #151 (translation helper utilities).

**Current state:**
- ✅ i18n framework (next-intl v4.8.3) fully configured and operational
- ✅ Email templates (`app/utils/email-templates.ts`) already internationalized
- ✅ Translation file structure exists with Spanish (complete) and English (EnOf() placeholders)
- ✅ Some auth translation keys already defined in `locales/{locale}/auth.json`
- ❌ **All 11 auth components have hardcoded Spanish strings**
- ❌ **Auth pages (reset-password, verify-email) have hardcoded strings**
- ❌ **Server actions return hardcoded error messages (mix of Spanish/English)**

**Why this matters:**
Authentication is the first user interaction with the app. Poor i18n here creates a bad first impression for English-speaking users. Currently, English users see Spanish error messages and form labels, which is confusing and unprofessional.

**User impact:**
- High priority - affects all new and returning users
- First impression of the application
- **Revised effort estimate: Large (12-16 hours)**
  - Original story estimate: 4-6 hours (based on 7 components)
  - Actual scope: 11 components + 2 pages + 3 server actions + comprehensive testing
  - Breakdown: 3h keys, 3h server actions, 4h components, 2h pages, 5-8h testing, 1h validation

**Scope clarification (7 vs 11 components):**
The original story lists "7 components" but this plan identifies 11 auth-related files. This is intentional scope expansion to ensure complete auth flow internationalization:

**Original 7 (explicitly mentioned):**
1. login-form.tsx
2. signup-form.tsx
3. forgot-password-form.tsx
4. nickname-setup-dialog.tsx
5. user-settings-dialog.tsx
6. verification-sent-view.tsx
7. reset-sent-view.tsx

**Additional 4 (necessary for complete auth flow):**
8. email-input-form.tsx - Entry point for progressive disclosure auth
9. otp-verify-form.tsx - OTP code verification (alternative to password)
10. account-setup-form.tsx - Post-OTP account creation
11. login-or-signup-dialog.tsx - Container orchestrating all auth flows

**Justification:** Without these 4 additional components, users would encounter mixed-language displays during OTP login flow and email input. The story's goal of "entire authentication flow" requires all 11 components.

---

## Objectives

### Primary Goals
1. Replace all hardcoded Spanish strings in auth components with i18n calls
2. Add missing translation keys to `auth.json` for both Spanish and English
3. Internationalize server actions to return localized error messages
4. Ensure consistent language experience throughout entire auth flow

### Success Criteria
- ✅ All 11 auth components use `useTranslations()` hook
- ✅ All 2 auth pages use `getTranslations()` function
- ✅ All server actions accept locale and return localized errors
- ✅ English translations complete (no EnOf() wrappers remaining)
- ✅ Users can complete full auth flow in either language without seeing mixed languages
- ✅ All existing functionality preserved (no regressions)
- ✅ 80%+ test coverage on modified code (SonarCloud requirement)

### Out of Scope
- Email template functions themselves (already internationalized in story #151)
- Navigation/header components (separate story)
- Non-auth UI components
- Logout/session management UI (not part of initial auth flow)

**⚠️ CRITICAL: Email Template Locale Bug (In Scope!)**

**Discovery:** Email templates in `app/utils/email-templates.ts` are fully internationalized and accept `locale` parameter (story #151 ✅), BUT the callers in `app/actions/user-actions.ts` are NOT passing the locale parameter:
- Line 131: `generatePasswordResetEmail(email, resetUrl)` - Missing locale! ❌
- Line 212: `generateVerificationEmail(user.email, verificationLink)` - Missing locale! ❌

**Impact:** Users receive emails in default Spanish even when using English UI.

**Fix Required:** Update both calls in user-actions.ts to pass locale parameter:
```typescript
// Before (story #151 incomplete):
const emailData = await generatePasswordResetEmail(email, resetUrl);

// After (this story fixes):
const emailData = await generatePasswordResetEmail(email, resetUrl, locale);
```

**Why This Is In Scope:** Story #152 requires "email verification (UI + emails)" and "password reset (UI + emails)" to work in both languages. This bug blocks that requirement.

**Note on EnOf() Wrappers:**
The EnOf() wrappers in `locales/en/emails.json` were already removed in #151 (email templates work). Only auth.json and validation.json still have EnOf() wrappers.

**Note on EnOf() Wrapper Removal:**
The English translation files currently contain `EnOf()` wrappers around Spanish strings (e.g., `"label": "EnOf(Contraseña)"`). This is a temporary marker indicating translation work is needed. During implementation:
1. Remove ALL EnOf() wrappers from `locales/en/auth.json`
2. Replace with proper English translations
3. Verify JSON structure remains identical to Spanish version
4. Test with English locale to ensure no EnOf() displays to users

---

## Technical Approach

### 1. Translation Key Organization

**Namespace strategy:**
- **`auth.json`** - All authentication-specific strings
  - Form labels, buttons, dialog titles
  - Instructions, help text, success messages
  - Auth-specific error messages
- **`validation.json`** - Form validation messages (reusable across features)
  - Required field messages
  - Format validation (email, password length)
  - Confirmation mismatches
- **`common.json`** - Generic UI elements (already exists)
  - Buttons: save, cancel, close, back
  - Loading states

**Key naming convention (following existing patterns):**
```
auth.{section}.{element}.{property}

Examples:
- auth.login.email.label
- auth.login.email.required
- auth.signup.password.minLength
- auth.otp.timer.label
- auth.accountSetup.instruction
```

**Sample Translation Keys (New Keys to Add):**

```json
// locales/es/auth.json (partial - showing new keys)
{
  "login": {
    "title": "Iniciar Sesión",  // existing
    "email": { /* existing */ },
    "password": {
      "label": "Contraseña",  // existing
      "placeholder": "Tu contraseña",  // existing
      "required": "Ingrese su contraseña",  // NEW
      "toggleVisibility": "Mostrar/ocultar contraseña"  // NEW
    },
    "buttons": {
      "submit": "Ingresar",  // NEW
      "otpEmail": "Código por Email"  // NEW
    }
  },
  "signup": {
    "title": "Registrarse",  // existing
    "email": {
      "label": "E-Mail",  // NEW
      "required": "Por favor ingrese su e-mail",  // NEW
      "invalid": "Direccion de E-Mail invalida"  // NEW
    },
    "confirmEmail": {
      "label": "Confirmacion de E-Mail",  // NEW
      "required": "Por favor confirme su e-mail",  // NEW
      "mismatch": "Confirme su e-mail correctamente"  // NEW
    },
    "nickname": {
      "label": "Apodo",  // NEW
      "required": "El apodo es requerido"  // NEW (different from validation.json)
    },
    "password": {
      "label": "Contraseña",  // NEW
      "required": "Cree su contraseña",  // NEW
      "confirmLabel": "Confirmacion de Contraseña",  // NEW
      "confirmRequired": "Por favor confirme su contraseña",  // NEW
      "confirmMismatch": "Confirme su contraseña correctamente"  // NEW
    },
    "buttons": {
      "submit": "Registrarse",  // NEW
      "otpEmail": "Código por Email"  // NEW
    },
    "errors": {
      "emailInUse": "Ya existe un usuario con ese e-mail"  // NEW (from server action)
    }
  },
  "emailInput": {
    "title": "Ingresar o Registrarse",  // NEW
    "email": {
      "label": "Email",  // NEW
      "error": "Error al verificar el email"  // NEW
    },
    "buttons": {
      "continue": "Continuar",  // NEW
      "google": "Continuar con Google"  // NEW
    },
    "divider": "o"  // NEW
  },
  "otp": {
    "title": "Verificar Código",  // NEW
    "instruction": "Ingresa el código enviado a",  // NEW
    "timer": {
      "expiresIn": "⏱️ Expira en: {time}",  // NEW (interpolation)
      "expired": "Código expirado. Solicita uno nuevo."  // NEW
    },
    "digit": {
      "ariaLabel": "Dígito {current} de {total}"  // NEW (accessibility)
    },
    "resend": {
      "prompt": "¿No recibiste el código?",  // NEW
      "action": "Reenviar",  // NEW
      "countdown": "Reenviar (en {seconds}s)"  // NEW (interpolation)
    },
    "buttons": {
      "back": "← Volver",  // NEW
      "verify": "Verificar",  // NEW
      "verifying": "Verificando..."  // NEW
    },
    "errors": {
      "required": "Por favor ingresa los 6 dígitos",  // NEW
      "incorrect": "Código incorrecto",  // NEW
      "verifyFailed": "Error al verificar el código. Intenta nuevamente."  // NEW
    }
  },
  "accountSetup": {
    "title": "Completa tu perfil",  // NEW
    "instruction": "¡Email verificado! Ahora completa tu información para crear tu cuenta.",  // NEW
    "nickname": {
      "label": "Nickname",  // NEW
      "required": "El nickname es requerido",  // NEW
      "minLength": "El nickname debe tener al menos {min} caracteres",  // NEW
      "maxLength": "El nickname debe tener máximo {max} caracteres",  // NEW
      "unavailable": "Este nickname no está disponible",  // NEW
      "available": "✓ Disponible",  // NEW
      "placeholder": "Requerido"  // NEW
    },
    "password": {
      "label": "Contraseña (opcional)",  // NEW
      "optional": "Opcional: Crear contraseña por si acaso",  // NEW
      "minLength": "La contraseña debe tener al menos {min} caracteres"  // NEW
    },
    "buttons": {
      "cancel": "Cancelar",  // NEW
      "submit": "Crear cuenta",  // NEW
      "submitting": "Creando cuenta..."  // NEW
    },
    "errors": {
      "createFailed": "Error al crear la cuenta",  // NEW
      "createAndLoginFailed": "Cuenta creada pero no se pudo iniciar sesión. Intenta iniciar sesión manualmente."  // NEW
    }
  },
  "nicknameSetup": {
    "title": "Configura tu nickname",  // NEW
    "instruction": "Para completar tu registro, por favor elige un nickname que será visible para otros usuarios.",  // NEW
    "nickname": {
      "label": "Nickname",  // NEW
      "helperText": "Mínimo 2 caracteres, máximo 50"  // NEW
    },
    "buttons": {
      "cancel": "Cancelar",  // NEW
      "save": "Guardar"  // NEW
    },
    "errors": {
      "saveFailed": "Error al guardar el nickname"  // NEW
    }
  },
  "userSettings": {
    "title": "Configuracion de Usuario",  // existing
    "nickname": {
      "label": "Apodo"  // existing
    },
    "notifications": {
      "label": "Recibir Notificaciones"  // NEW (fixed typo from "Notificationes")
    }
  },
  "dialog": {
    "titles": {
      "emailInput": "Ingresar o Registrarse",  // NEW (maps to DialogMode = 'emailInput')
      "login": "Ingresar",  // NEW (maps to DialogMode = 'login')
      "signup": "Registrarse",  // NEW (maps to DialogMode = 'signup')
      "forgotPassword": "Recuperar Contraseña",  // NEW (maps to DialogMode = 'forgotPassword')
      "resetSent": "Enlace Enviado",  // NEW (maps to DialogMode = 'resetSent')
      "verificationSent": "Verificación Enviada",  // NEW (maps to DialogMode = 'verificationSent')
      "otpVerify": "Verificar Código",  // NEW (maps to DialogMode = 'otpVerify')
      "accountSetup": "Completa tu perfil"  // NEW (maps to DialogMode = 'accountSetup')
    },
    "links": {
      "backToEmail": "← Volver a email"  // NEW
    }
  },
  "verificationSent": {
    "title": "¡Registro Exitoso de {nickname}!",  // existing (interpolation)
    "emailSentTo": "Se ha enviado un correo de verificación a:",  // NEW
    "instructions": "Por favor, revisa tu bandeja de entrada y haz clic en el enlace de verificación para activar tu cuenta.",  // NEW
    "checkSpam": "Si no encuentras el correo, revisa tu carpeta de spam o correo no deseado.",  // NEW
    "linkExpiration": "El enlace de verificación expirará en 24 horas."  // NEW
  },
  "resetSent": {
    "emailSentTo": "Se ha enviado un enlace de restablecimiento a:",  // NEW
    "instructions": "Por favor, revisa tu correo electrónico y sigue las instrucciones para restablecer tu contraseña."  // NEW (existing in different form)
  },
  "emailVerifier": {
    "title": "Email Verification Failed",  // NEW (currently English in code!)
    "errors": {
      "invalidLink": "The verification link is invalid or has expired.",  // NEW
      "unexpected": "An unexpected error occurred during verification."  // NEW
    },
    "instruction": "Please try to log in again or request a new verification email."  // NEW
  },
  "resetPassword": {
    "title": "Restablecer contraseña",  // existing
    "newPassword": { /* existing */ },
    "confirmPassword": { /* existing */ },
    "button": { /* existing */ },
    "errors": {
      "tokenNotProvided": "Token de restablecimiento no proporcionado.",  // NEW
      "tokenInvalid": "El enlace de restablecimiento no es válido o ha expirado. Por favor, solicita un nuevo enlace.",  // NEW
      "tokenVerifyFailed": "Error al verificar el token. Por favor, inténtalo de nuevo.",  // NEW
      "updateFailed": "Error al actualizar la contraseña. Por favor, inténtalo de nuevo."  // existing
    },
    "success": {
      "updated": "Contraseña actualizada exitosamente",  // NEW
      "backHome": "Volver al inicio"  // NEW
    }
  }
}
```

**Namespace Strategy Clarification:**
- **auth.json**: Auth-specific strings including some validation that's contextual (e.g., "Cree su contraseña" in signup context)
- **validation.json**: Generic, reusable validation (e.g., "El nickname debe tener al menos {min} caracteres")
- **Overlap is acceptable** when context matters (auth.signup.password.required vs validation.password.required can coexist)
- Priority: Check auth.json first, fallback to validation.json for generic messages

### 2. Component Internationalization Pattern

**Client Components** (all auth dialogs/forms):
```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function LoginForm() {
  const t = useTranslations('auth');
  const tValidation = useTranslations('validation');
  const tCommon = useTranslations('common');

  return (
    <TextField
      label={t('login.email.label')}
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
    />
  );
}
```

**React Hook Form validation integration:**
```typescript
<Controller
  control={control}
  name="email"
  rules={{
    required: tValidation('email.required'),
    validate: (value) => validator.isEmail(value) || tValidation('email.invalid')
  }}
  render={({field, fieldState}) => (
    <TextField {...field} label={t('login.email.label')} />
  )}
/>
```

### 3. Server Action Localization

**Current problem:** Server actions return hardcoded strings:
```typescript
// ❌ Current (bad)
return { success: false, error: 'Ya existe un usuario con ese e-mail' };
```

**Solution:** Accept locale parameter, use `getTranslations()`:
```typescript
// ✅ Proposed (good)
'use server';
import { getTranslations } from 'next-intl/server';

export async function signupUser(user: SignupInput, locale: Locale) {
  const t = await getTranslations({ locale, namespace: 'auth' });
  const tErrors = await getTranslations({ locale, namespace: 'errors' });

  if (existingUser) {
    return { success: false, error: t('signup.errors.emailInUse') };
  }

  // ... rest of logic
}
```

**Caller side (component):**
```typescript
const locale = useLocale();
const result = await signupUser(data, locale);
```

**Important: Locale Parameter Assumptions & Race Conditions**

**Potential Issue:** If user changes browser language mid-request, the locale parameter passed from client could be stale.

**Why This Is Acceptable:**
1. **Rare scenario:** User changing language during active form submission is uncommon
2. **Self-correcting:** Next interaction will use new locale
3. **No data corruption:** Only affects UI message language, not data integrity
4. **Consistent with request:** Error message matches the language of the form that was submitted

**Alternative Approach Considered (Rejected):**
- Read locale from headers/cookies in server action → Adds complexity, same edge case exists
- Store locale in session → Overkill for read-only preference
- Force page refresh on language change → Poor UX

**Mitigation:**
- Document this behavior in code comments
- Error messages will be in language of submitted form (expected behavior)
- Future enhancement: Add locale to session if this becomes a real issue

**Verification:** Test language switching during active auth flow to ensure graceful degradation.

### 4. Server Pages/Components

**Reset Password Page** (`app/[locale]/reset-password/page.tsx`):
```typescript
// Already has [locale] in route, can use getLocale()
import { getLocale, getTranslations } from 'next-intl/server';

export default async function ResetPasswordPage() {
  const locale = await getLocale();
  const t = await getTranslations('auth');

  return <h1>{t('resetPassword.title')}</h1>;
}
```

**Email Verifier Component** (`app/components/verification/email-verifier.tsx`):
- Currently uses English strings (inconsistent!)
- Convert to client component, use `useTranslations()`

### 5. Special Cases

#### A. OTP Timer Display
```typescript
// Current: '⏱️ Expira en: {formatTime(timeLeft)}'
// Solution: Use interpolation
const t = useTranslations('auth');
return <span>{t('otp.timer.expiresIn', { time: formatTime(timeLeft) })}</span>;

// Translation keys:
// es: "otp.timer.expiresIn": "⏱️ Expira en: {time}"
// en: "otp.timer.expiresIn": "⏱️ Expires in: {time}"
```

#### B. Dynamic Nickname in Success Message
```typescript
// Current: `¡Registro Exitoso de ${nickname}!`
// Solution: Already has pattern in auth.json
t('verificationSent.title', { nickname: user.nickname })

// Translation:
// es: "verificationSent.title": "¡Registro Exitoso de {nickname}!"
// en: "verificationSent.title": "Successfully Registered {nickname}!"
```

#### C. Password Visibility Toggle
```typescript
// Current: aria-label="toggle password visibility"
// Solution:
<IconButton aria-label={t('login.password.toggleVisibility')}>
```

#### D. OTP Digit Labels (Accessibility)
```typescript
// Current: aria-label={`Dígito ${index + 1} de 6`}
// Solution:
aria-label={t('otp.digit.ariaLabel', { current: index + 1, total: 6 })}

// Translation:
// es: "otp.digit.ariaLabel": "Dígito {current} de {total}"
// en: "otp.digit.ariaLabel": "Digit {current} of {total}"
```

### 6. Validation Message Strategy

**Option A: Keep in component with translation**
```typescript
rules={{
  required: tValidation('email.required'),
  minLength: {
    value: 8,
    message: tValidation('password.minLength', { min: 8 })
  }
}}
```

**Decision:** Use Option A for consistency with existing validation.json structure.

---

## Files to Modify

### Translation Files (Add missing keys)
1. **`/Users/gvinokur/Personal/qatar-prode-story-152/locales/es/auth.json`**
   - Add missing keys for OTP, email input, signup form, account setup, user settings, nickname dialog
   - Expand existing structures (login, resetPassword, etc.)
   - Estimated +80 new keys

2. **`/Users/gvinokur/Personal/qatar-prode-story-152/locales/en/auth.json`**
   - Complete English translations (remove EnOf() wrappers)
   - Add same missing keys as Spanish
   - All values must be proper English translations

3. **`/Users/gvinokur/Personal/qatar-prode-story-152/locales/es/validation.json`**
   - Add confirmEmail validation messages
   - Add OTP validation messages
   - Estimated +5 new keys

4. **`/Users/gvinokur/Personal/qatar-prode-story-152/locales/en/validation.json`**
   - Mirror Spanish additions with English translations

5. **`/Users/gvinokur/Personal/qatar-prode-story-152/locales/es/common.json`**
   - Add "sending", "resend", "continue" button states if missing
   - Estimated +3 keys

6. **`/Users/gvinokur/Personal/qatar-prode-story-152/locales/en/common.json`**
   - Mirror Spanish additions

### Auth Components (11 files - Replace hardcoded strings)
7. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/components/auth/login-form.tsx`**
   - Add `useTranslations('auth')` hook
   - Replace 9+ hardcoded strings
   - Update validation rules to use tValidation()
   - Pass locale to server actions

8. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/components/auth/signup-form.tsx`**
   - Add `useTranslations('auth')` and `useLocale()` hooks
   - Replace 13+ hardcoded strings
   - Update validation rules
   - Pass locale to signupUser action

9. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/components/auth/email-input-form.tsx`**
   - Add `useTranslations('auth')` hook
   - Replace label, error, button strings
   - Pass locale to checkAuthMethods action

10. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/components/auth/otp-verify-form.tsx`**
    - Add `useTranslations('auth')` hook
    - Replace 10+ strings including timer, resend, instructions
    - Handle interpolation for dynamic content
    - Pass locale to verifyOTPCode and sendOTPCode actions

11. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/components/auth/forgot-password-form.tsx`**
    - Add `useTranslations('auth')` hook
    - Replace 5+ hardcoded strings
    - Pass locale to sendPasswordResetLink action

12. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/components/auth/account-setup-form.tsx`**
    - Add `useTranslations('auth')` hook
    - Replace 13+ hardcoded strings
    - Update validation rules
    - Pass locale to createAccountViaOTP action

13. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/components/auth/login-or-signup-dialog.tsx`**
    - Add `useTranslations('auth')` hook
    - Replace dialog titles (8 variations)
    - Replace link text ("← Volver a email", "¿Olvidaste tu contraseña?")

14. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/components/auth/user-settings-dialog.tsx`**
    - Add `useTranslations('auth')` and `useTranslations('common')` hooks
    - Replace 5+ strings
    - Fix typo: "Recibir Notificationes" → proper translation key
    - Pass locale to updateNickname action

15. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/components/auth/nickname-setup-dialog.tsx`**
    - Add `useTranslations('auth')` hook
    - Replace 7+ hardcoded strings
    - Pass locale to setNickname action

16. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/components/auth/verification-sent-view.tsx`**
    - Add `useTranslations('auth')` hook
    - Replace 5+ strings with existing auth.json keys
    - Handle nickname interpolation

17. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/components/auth/reset-sent-view.tsx`**
    - Add `useTranslations('auth')` hook
    - Replace 2+ strings with existing auth.json keys

### Auth Pages (2 files)
18. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/[locale]/reset-password/page.tsx`**
    - Add `getTranslations()` from 'next-intl/server'
    - Replace 11+ hardcoded strings
    - Use locale from route params

19. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/components/verification/email-verifier.tsx`**
    - **Already a client component** (has 'use client' directive) ✅
    - **Already imports useLocale()** ✅
    - Add `useTranslations('auth')` hook
    - Replace 4+ English strings (fix language inconsistency)
    - Note: Uses useLocale() on line 17, locale is available

### Server Actions (3 files)
20. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/actions/user-actions.ts`**
    - Add locale parameter to: signupUser, sendPasswordResetLink, updateNickname
    - Import getTranslations from 'next-intl/server'
    - Replace 13+ hardcoded error messages with translations
    - Return localized success/error messages

21. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/actions/oauth-actions.ts`**
    - Add locale parameter to: setNickname, checkAuthMethods
    - Replace hardcoded error messages

22. **`/Users/gvinokur/Personal/qatar-prode-story-152/app/actions/otp-actions.ts`**
    - Add locale parameter to: sendOTPCode, verifyOTPCode, createAccountViaOTP
    - Replace hardcoded error messages

### Type Definitions (if needed)
23. **`/Users/gvinokur/Personal/qatar-prode-story-152/types/i18n.ts`** (check if updates needed)
    - Verify IntlMessages interface includes new auth keys
    - TypeScript will catch missing keys at build time

---

## Implementation Steps

### Phase 1: Translation Keys (Foundation)
**Goal:** Create complete translation dictionaries before touching code

1. **Audit existing keys** (30 min)
   - Read `locales/es/auth.json` completely
   - Identify which keys already exist
   - Map existing keys to usage in components
   - Identify gaps (missing keys)

2. **Design new key structure** (30 min)
   - Organize missing strings into hierarchical structure
   - Follow existing naming conventions
   - Plan interpolation keys (nickname, time, count)
   - Consider reusability across components

3. **Add Spanish keys** (1 hour)
   - Add ~80 new keys to `locales/es/auth.json`
   - Add ~5 new keys to `locales/es/validation.json`
   - Add ~3 new keys to `locales/es/common.json`
   - Verify JSON syntax
   - Test with JSON linter

4. **Add English translations** (1 hour)
   - Translate all new keys to English
   - Remove EnOf() wrappers from existing keys
   - Ensure natural English phrasing
   - Review for consistency

5. **Verify translation completeness** (15 min)
   - Compare es/auth.json and en/auth.json structures
   - Ensure identical keys in both files
   - Check interpolation placeholders match

### Phase 2: Server Actions (Bottom-up approach)
**Goal:** Localize backend first, then update frontend to pass locale

6. **Update user-actions.ts** (45 min)
   - Add `locale: Locale` parameter to each action signature
   - Import getTranslations from 'next-intl/server'
   - Replace error strings with `t('auth.signup.errors.emailInUse')` etc.
   - **CRITICAL FIX:** Update email template calls to pass locale:
     - Line 131: `generatePasswordResetEmail(email, resetUrl, locale)`
     - Line 212: `generateVerificationEmail(user.email, verificationLink, locale)`
     - Currently these DON'T pass locale (bug from story #151!)
   - Test with both locales manually

7. **Update oauth-actions.ts** (30 min)
   - Add locale parameter to setNickname, checkAuthMethods
   - Replace error strings with translations
   - Ensure OAuth flow preserves locale

8. **Update otp-actions.ts** (30 min)
   - Add locale parameter to OTP actions
   - Replace error strings with translations
   - **CRITICAL: Add locale parameter to email generation (if OTP sends emails)**
     - Check if sendOTPCode or other OTP actions call email template functions
     - If yes, add locale parameter to those calls
     - Note: user-actions.ts email calls are confirmed broken (missing locale), fix those first

### Phase 3: Auth Components (Client-side)
**Goal:** Replace all hardcoded strings with i18n calls

9. **LoginForm + SignupForm** (1 hour)
   - Import useTranslations, useLocale
   - Replace form labels with t() calls
   - Update validation rules to use tValidation()
   - Pass locale to signIn/signupUser actions
   - Test form submission in both languages

10. **EmailInputForm + OTPVerifyForm** (1 hour)
    - Replace all static strings
    - Handle OTP timer interpolation
    - Handle resend countdown
    - Pass locale to checkAuthMethods, verifyOTPCode, sendOTPCode

11. **ForgotPasswordForm + AccountSetupForm** (1 hour)
    - Replace strings and validation messages
    - Update nickname availability check
    - Pass locale to actions

12. **LoginOrSignupDialog** (30 min)
    - Replace dialog titles (8 variations mapping to DialogMode types)
      - 'emailInput' → t('dialog.titles.emailInput')
      - 'login' → t('dialog.titles.login')
      - 'signup' → t('dialog.titles.signup')
      - 'forgotPassword' → t('dialog.titles.forgotPassword')
      - 'resetSent' → t('dialog.titles.resetSent')
      - 'verificationSent' → t('dialog.titles.verificationSent')
      - 'otpVerify' → t('dialog.titles.otpVerify')
      - 'accountSetup' → t('dialog.titles.accountSetup')
    - Replace navigation links ("← Volver a email")
    - Ensure dialog title updates with view state changes

13. **UserSettingsDialog + NicknameSetupDialog** (30 min)
    - Replace form labels and buttons
    - Fix "Notificationes" typo with proper key
    - Pass locale to updateNickname, setNickname

14. **VerificationSentView + ResetSentView** (30 min)
    - Replace with existing auth.json keys
    - Handle nickname interpolation in verificationSent.title

### Phase 4: Auth Pages
**Goal:** Internationalize server-rendered auth pages

15. **ResetPasswordPage** (45 min)
    - Import getTranslations from 'next-intl/server'
    - Replace all hardcoded strings
    - Handle form validation messages
    - Test password reset flow in both languages

16. **EmailVerifier component** (30 min)
    - Convert to client component ('use client')
    - Replace English strings with translations
    - Fix language inconsistency issue

### Phase 5: Testing & Validation
**Goal:** Ensure quality and prevent regressions

17. **Create unit tests** (5-8 hours) **[REVISED ESTIMATE]**
    - Test components render with translations
    - Test validation messages display correctly
    - Test server actions return localized errors
    - Test interpolation (nickname, timers)
    - Mock next-intl hooks in tests
    - Achieve 80%+ coverage on modified code

18. **Manual testing checklist** (1 hour)
    - [ ] Complete login flow in English
    - [ ] Complete signup flow in English
    - [ ] Email verification in both languages
    - [ ] Password reset in both languages
    - [ ] OTP login flow in both languages
    - [ ] Account setup after OTP in both languages
    - [ ] Settings dialog in both languages
    - [ ] Error messages display in correct language
    - [ ] No mixed-language displays
    - [ ] Form validation works in both languages
    - [ ] **Accessibility review (NEW):**
      - [ ] Screen reader announces translated aria-labels
      - [ ] OTP digit fields have correct localized labels
      - [ ] Password visibility toggle has translated aria-label
      - [ ] Error announcements in correct language
      - [ ] Form field associations preserved

19. **Build verification** (15 min)
    - Run `npm run build` to verify TypeScript types
    - Verify no i18n key errors
    - Check bundle size impact (should be minimal)

---

## Testing Strategy

### Unit Tests (80% coverage target)

#### Component Tests
- **File:** `__tests__/components/auth/login-form.test.tsx`
  - Mock useTranslations to return test strings
  - Test form renders with translated labels
  - Test validation errors show translated messages
  - Test success message displays on email verification

- **File:** `__tests__/components/auth/otp-verify-form.test.tsx`
  - Test timer displays translated countdown
  - Test resend button shows translated states
  - Test instructions show translated text with email interpolation
  - Test digit labels have translated aria-labels

- **File:** `__tests__/components/auth/account-setup-form.test.tsx`
  - Test nickname validation shows translated errors
  - Test password optional label is translated
  - Test availability indicator is translated

- **Additional files:** Create tests for all 11 modified components

#### Server Action Tests
- **File:** `__tests__/actions/user-actions.test.ts`
  - Mock getTranslations to return test strings
  - Test signupUser returns localized error for duplicate email
  - Test sendPasswordResetLink returns localized error for OAuth account
  - Test both English and Spanish error messages

- **File:** `__tests__/actions/otp-actions.test.ts`
  - Test OTP actions return localized errors
  - Test with both 'en' and 'es' locale parameters

#### Page Tests
- **File:** `__tests__/app/reset-password/page.test.tsx`
  - Mock getTranslations for server component
  - Test page renders with translated title
  - Test form displays translated labels
  - Test error states show translated messages

### Integration Tests
- **Auth flow end-to-end:**
  - User switches language → sees updated auth UI
  - User signs up in English → receives English email, sees English confirmations
  - User resets password in Spanish → receives Spanish email, sees Spanish messages
  - Error messages display in current locale

### Test Utilities
```typescript
// Mock next-intl in tests
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}`,
}));

vi.mock('next-intl/server', () => ({
  getLocale: async () => 'en',
  getTranslations: async ({ locale, namespace }) =>
    (key: string) => `${locale}.${namespace}.${key}`,
}));
```

---

## Validation Considerations

### Pre-commit Validation
1. **Linting:** `npm run lint` - no new warnings
2. **Type checking:** `npm run build` - no TypeScript errors
3. **Tests:** `npm test` - all tests pass, 80%+ coverage
4. **Translation completeness:**
   - Spanish and English have identical key structures
   - No missing interpolation placeholders
   - No EnOf() wrappers remaining

### SonarCloud Quality Gates
- **Code Coverage:** ≥80% on new/modified code
- **New Issues:** 0 (any severity)
- **Security Rating:** A
- **Maintainability:** B or higher
- **Duplicated Code:** <5%

### Manual QA Checklist
- [ ] Auth flow works in both English and Spanish
- [ ] No mixed-language displays at any point
- [ ] Email templates display in correct language
- [ ] Error messages appear in correct language
- [ ] Form validation messages are translated
- [ ] Loading states are translated
- [ ] Accessibility labels (aria-labels) are translated
- [ ] Dynamic content (timers, interpolation) works correctly
- [ ] Browser language detection triggers correct locale

### Accessibility Validation
- [ ] All aria-labels are translated
- [ ] Screen reader announces translated content
- [ ] Error messages are announced in correct language
- [ ] Form field labels are properly associated

### Performance Considerations
- Translation files are loaded on-demand by next-intl
- No performance impact expected (all strings are already in memory)
- Bundle size increase: ~5KB (compressed) for additional translation keys

---

## Risks and Mitigations

### Risk 1: Missing Translation Keys
**Probability:** Medium
**Impact:** High (app crashes if key is missing)
**Mitigation:**
- TypeScript IntlMessages interface provides compile-time checking
- Add JSON schema validation in CI/CD
- Test with both locales before committing

### Risk 2: Breaking Existing Auth Flow
**Probability:** Low
**Impact:** Critical (users can't log in)
**Mitigation:**
- Comprehensive unit and integration tests
- Test each component individually before moving to next
- Manual QA of full auth flow before merge

### Risk 3: Inconsistent Server Action Signatures
**Probability:** Low
**Impact:** Medium (TypeScript will catch at build time)
**Mitigation:**
- Add locale parameter at end of signature (backward compatible if needed)
- Update all callers in same commit
- Run full build to verify

### Risk 4: Interpolation Errors
**Probability:** Medium
**Impact:** Medium (displays {nickname} instead of actual value)
**Mitigation:**
- Test all interpolated strings explicitly
- Add unit tests for dynamic content
- Manual verification of nickname, timer, email displays

### Risk 5: English Translation Quality
**Probability:** Low
**Impact:** Low (user can still use app, but poor UX)
**Mitigation:**
- Review English translations for natural phrasing
- User can provide feedback post-merge

---

## Dependencies and Blockers

### Dependencies
- ✅ Story #150: Translation key extraction (completed)
- ⚠️ Story #151: Translation helper utilities (completed, but with bug)
- ✅ next-intl v4.8.3 installed and configured
- ✅ Translation files structure exists

### Blockers
- None identified (bug discovered but fixable in this story)

### Assumptions & Verifications
- ✅ Email templates accept locale parameter (verified: email-templates.ts line 15, 40)
- ❌ **BUG FOUND:** Email template callers DON'T pass locale (user-actions.ts line 131, 212) - WILL FIX
- ✅ Date utilities handle locale parameter (verified in previous exploration)
- ✅ Middleware correctly detects and routes by locale (verified)
- ✅ Email verifier is already a client component (verified: line 1 has 'use client')
- ✅ LoginOrSignupDialog has 8 DialogMode types (verified: line 24 in component)

---

## Rollout Plan

### Phase 1: Merge to main (after PR approval)
- Feature flag: Not needed (i18n is opt-in via URL locale)
- English users immediately benefit
- Spanish users see no change (same strings, now via i18n)

### Phase 2: Monitor (first 48 hours)
- Watch for bug reports related to auth
- Monitor Sentry for i18n-related errors
- Check analytics for auth flow completion rates

### Phase 3: Feedback Collection
- Gather user feedback on English translation quality
- Iterate on translations if needed (separate PR)

---

## Success Metrics

### Quantitative
- ✅ 0 new SonarCloud issues
- ✅ ≥80% test coverage on modified code
- ✅ 0 TypeScript errors
- ✅ 100% translation key coverage (no EnOf() wrappers)
- ✅ All 11 components internationalized
- ✅ All 3 server action files updated

### Qualitative
- ✅ English users can complete full auth flow without seeing Spanish
- ✅ Error messages are clear and correctly translated
- ✅ No usability regressions reported
- ✅ Code is maintainable and follows project i18n patterns

---

## Follow-up Stories (Out of Scope)

- Story #153: Internationalize navigation/header components
- Story #154: Internationalize tournament pages
- Story #155: Internationalize group management pages
- Add Arabic/Portuguese support (future milestone)
- Add language switcher UI (if not already exists)

---

## Notes

- Email templates require NO changes (already internationalized in #151)
- Translation file structure is solid, no changes needed
- All patterns follow existing i18n-patterns.md conventions
- Backward compatible: Spanish users see no change
- Forward compatible: Easy to add more languages later

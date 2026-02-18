# Implementation Plan: [i18n] Error Messages & Validation Internationalization (#159)

## Context

The application has hardcoded error messages and validation text scattered across server actions, Zod schemas, error boundaries, and components. This prevents non-Spanish speakers from understanding errors and validation feedback, leading to poor UX. This story internationalizes all user-facing error and validation messages to support both English and Spanish.

## Story Overview

**Issue:** #159 - [i18n] Error Messages & Validation Internationalization
**Priority:** High - Critical for user experience
**Effort:** Medium (4-6 hours)
**Epic:** Internationalization (i18n) Support
**Dependencies:** Stories #149 (i18n setup), #150 (namespace design), #151 (helper utilities) - All completed

**Current Problems:**
- Server actions return hardcoded Spanish error messages (21 action files)
- Zod validation schemas have hardcoded English error messages
- Error boundary has hardcoded English text
- No consistent pattern for error message i18n in server actions
- Missing English translation keys for new error messages (need `EnOf()` placeholders)

**Scope:**
- Server action error messages in `app/actions/*.ts`
- Zod schema validation messages
- Error boundary messages (`app/[locale]/tournaments/[id]/error.tsx`)
- Add missing English translation keys in `EnOf()` format for `locales/en/errors.json` and `locales/en/validation.json`

**Note:** English translations use `EnOf(Spanish text)` format and Spanish translations use `EsOf(English text)` format by design. Actual translations will be done by a professional translator in a future story. This story focuses on i18n infrastructure and using translation keys throughout the codebase.

## Acceptance Criteria

- [ ] All server action error messages use `getTranslations('errors')` instead of hardcoded strings
- [ ] All Zod validation messages use `getTranslations('validation')` instead of hardcoded strings
- [ ] Error boundary uses `useTranslations('errors')` for all text
- [ ] Spanish translations added in `locales/es/errors.json` and `locales/es/validation.json` (using `EsOf()` format)
- [ ] English translations added in `locales/en/errors.json` and `locales/en/validation.json` (using `EnOf()` format)
- [ ] Create i18n utility helper for server actions: `getServerTranslations()` that automatically detects locale
- [ ] All 21 server action files audited and updated
- [ ] Consistent error response format: `{ success: false, error: string }` or `{ error: string }`
- [ ] Full application testable in both languages
- [ ] All existing tests updated with translation mocks
- [ ] 80% code coverage maintained on modified files
- [ ] 0 new SonarCloud issues

## Technical Approach

### 1. Add Missing Translation Keys (EnOf/EsOf Format)

**Important Translation Format Rules:**
- **English translations:** Use `EnOf(Spanish text)` format
- **Spanish translations:** Use `EsOf(English text)` format
- This is by design until a professional translator works on proper translations in a future story

**Files to update:**
- `locales/en/errors.json` - Add missing keys in `EnOf(Spanish)` format
- `locales/en/validation.json` - Add missing keys in `EnOf(Spanish)` format
- `locales/es/errors.json` - Add missing keys in `EsOf(English)` format
- `locales/es/validation.json` - Add missing keys in `EsOf(English)` format

**Current state (errors.json):**
```json
{
  "generic": "EnOf(Ocurrió un error inesperado. Por favor, inténtalo de nuevo.)",
  "auth": {
    "invalidCredentials": "EnOf(Email o Contraseña Invalida)",
    "googleAccount": "EnOf(Esta cuenta usa inicio de sesión con Google.)",
    ...
  }
}
```

**Target state (errors.json) - Keep EnOf() format:**
```json
{
  "generic": "EnOf(Ocurrió un error inesperado. Por favor, inténtalo de nuevo.)",
  "unauthorized": "EnOf(No autorizado)",
  "notFound": "EnOf(No encontrado)",
  "auth": {
    "invalidCredentials": "EnOf(Email o contraseña inválida)",
    "googleAccount": "EnOf(Esta cuenta usa inicio de sesión con Google.)",
    "emailSendFailed": "EnOf(Error al enviar el correo electrónico. Por favor, inténtalo de nuevo.)",
    "passwordUpdateFailed": "EnOf(Error al actualizar la contraseña. Por favor, inténtalo de nuevo.)",
    "noUser": "EnOf(No existe un usuario con ese e-mail)",
    "passwordRequired": "EnOf(La contraseña es requerida para registrarse)",
    "userExists": "EnOf(Ya existe un usuario con ese e-mail)",
    "invalidToken": "EnOf(Token inválido o expirado)",
    "tokenExpired": "EnOf(El token ha expirado)",
    "verificationFailed": "EnOf(Error al verificar el correo electrónico)"
  },
  "groups": {
    "copyFailed": "EnOf(Error al copiar: {error})",
    "notFound": "EnOf(El grupo no existe)",
    "unauthorized": "EnOf(Solo el dueño del grupo puede realizar esta acción)",
    "cannotLeave": "EnOf(El dueño del grupo no puede dejar el grupo)",
    "joinFailed": "EnOf(Error al unirse al grupo)",
    "uploadFailed": "EnOf(Error al subir la imagen. Por favor, inténtalo de nuevo con un archivo más pequeño.)",
    "fileTooLarge": "EnOf(El archivo es demasiado grande. El tamaño máximo es 5MB.)"
  },
  "account": {
    "deleteFailed": "EnOf(Error al eliminar la cuenta. Por favor, inténtalo de nuevo.)"
  },
  "validation": {
    "invalidImage": "EnOf(Archivo de imagen inválido)",
    "fileSizeExceeded": "EnOf(Tamaño de archivo excedido)",
    "bodyExceeded": "EnOf(El cuerpo de la solicitud es demasiado grande)"
  },
  "tournament": {
    "accessDenied": "EnOf(Acceso Denegado)",
    "noPermission": "EnOf(No tienes permiso para ver este torneo. Este es un torneo de desarrollo que requiere acceso especial.)",
    "contactAdmin": "EnOf(Si crees que deberías tener acceso, por favor contacta a un administrador.)",
    "returnHome": "EnOf(Volver al Inicio)"
  }
}
```

**Target state (validation.json) - Keep EnOf() format:**
```json
{
  "required": "EnOf(Requerido)",
  "optional": "EnOf(Opcional)",
  "email": {
    "invalid": "EnOf(Dirección de e-mail inválida)",
    "required": "EnOf(Por favor ingrese su e-mail)"
  },
  "password": {
    "required": "EnOf(La contraseña es requerida)",
    "minLength": "EnOf(La contraseña debe tener al menos {min} caracteres)"
  },
  "nickname": {
    "required": "EnOf(El nickname es requerido)",
    "minLength": "EnOf(El nickname debe tener al menos {min} caracteres)",
    "maxLength": "EnOf(El nickname debe tener máximo {max} caracteres)",
    "unavailable": "EnOf(Este nickname no está disponible)",
    "available": "EnOf(✓ Disponible)"
  },
  "groupName": {
    "required": "EnOf(El nombre del grupo es obligatorio)"
  },
  "confirmPassword": {
    "mismatch": "EnOf(Las contraseñas no coinciden)"
  },
  "image": {
    "required": "EnOf(Por favor seleccione una imagen)",
    "invalidType": "EnOf(Se aceptan archivos .jpg, .jpeg, .png y .webp)",
    "tooLarge": "EnOf(El tamaño máximo del archivo es 5MB)"
  }
}
```

**Spanish Translation Updates (`locales/es/errors.json`) - Use EsOf() format:**

Add these missing keys with EsOf(English) format to maintain parity:
```json
{
  "generic": "EsOf(An unexpected error occurred. Please try again.)",
  "unauthorized": "EsOf(Unauthorized)",
  "notFound": "EsOf(Not found)",
  "auth": {
    "invalidCredentials": "EsOf(Invalid email or password)",
    "googleAccount": "EsOf(This account uses Google sign-in.)",
    "emailSendFailed": "EsOf(Failed to send email. Please try again.)",
    "passwordUpdateFailed": "EsOf(Failed to update password. Please try again.)",
    "noUser": "EsOf(No user found with that email)",
    "passwordRequired": "EsOf(Password is required for signup)",
    "userExists": "EsOf(A user with that email already exists)",
    "invalidToken": "EsOf(Invalid or expired token)",
    "tokenExpired": "EsOf(Token has expired)",
    "verificationFailed": "EsOf(Failed to verify email)"
  },
  "groups": {
    "copyFailed": "EsOf(Failed to copy: {error})",
    "notFound": "EsOf(Group not found)",
    "unauthorized": "EsOf(Only the group owner can perform this action)",
    "cannotLeave": "EsOf(The group owner cannot leave the group)",
    "joinFailed": "EsOf(Failed to join group)",
    "uploadFailed": "EsOf(Image upload failed. Please try again with a smaller file.)",
    "fileTooLarge": "EsOf(File is too large. Maximum size is 5MB.)"
  },
  "account": {
    "deleteFailed": "EsOf(Failed to delete account. Please try again.)"
  },
  "validation": {
    "invalidImage": "EsOf(Invalid image file)",
    "fileSizeExceeded": "EsOf(File size exceeded)",
    "bodyExceeded": "EsOf(Request body is too large)"
  },
  "tournament": {
    "accessDenied": "EsOf(Access Denied)",
    "noPermission": "EsOf(You don't have permission to view this tournament. This is a development tournament that requires special access.)",
    "contactAdmin": "EsOf(If you believe you should have access, please contact an administrator.)",
    "returnHome": "EsOf(Return to Home)"
  }
}
```

**Spanish Translation Updates (`locales/es/validation.json`) - Use EsOf() format:**

Add these missing keys with EsOf(English) format:
```json
{
  "required": "EsOf(Required)",
  "optional": "EsOf(Optional)",
  "email": {
    "invalid": "EsOf(Invalid email address)",
    "required": "EsOf(Please enter your email)"
  },
  "password": {
    "required": "EsOf(Password is required)",
    "minLength": "EsOf(Password must be at least {min} characters)"
  },
  "nickname": {
    "required": "EsOf(Nickname is required)",
    "minLength": "EsOf(Nickname must be at least {min} characters)",
    "maxLength": "EsOf(Nickname must be at most {max} characters)",
    "unavailable": "EsOf(This nickname is not available)",
    "available": "EsOf(✓ Available)"
  },
  "groupName": {
    "required": "EsOf(Group name is required)"
  },
  "confirmPassword": {
    "mismatch": "EsOf(Passwords do not match)"
  },
  "image": {
    "required": "EsOf(Please select an image)",
    "invalidType": "EsOf(.jpg, .jpeg, .png and .webp files are accepted)",
    "tooLarge": "EsOf(Max file size is 5MB)"
  }
}
```

### 2. Create Server Action i18n Helper Utility

**Note:** Based on review of existing i18n stories, this utility does NOT yet exist. The `app/utils/i18n-patterns.md` documents patterns but no server-i18n helper has been created yet.

**Problem:** Server actions need locale context for translations.

**Solution:** Pass locale as parameter from client components (recommended approach for server actions).

**New file: `app/utils/server-i18n.ts`**
```typescript
import { getTranslations } from 'next-intl/server';
import { Locale } from '@/i18n.config';

/**
 * Get translations for a specific namespace in server actions
 * Requires locale to be passed from client component
 *
 * @param locale - User's current locale (pass from useLocale() in client)
 * @param namespace - Translation namespace (e.g., 'errors', 'validation')
 * @returns Translation function
 *
 * @example
 * ```typescript
 * // Client component
 * const locale = useLocale();
 * const result = await myAction(locale);
 *
 * // Server action
 * export async function myAction(locale: Locale) {
 *   const t = await getServerTranslations(locale, 'errors');
 *   return { error: t('auth.invalidCredentials') };
 * }
 * ```
 */
export async function getServerTranslations(locale: Locale, namespace: string) {
  return getTranslations({ locale, namespace });
}
```

**Usage pattern:**
```typescript
'use server'

import { getServerTranslations } from '@/app/utils/server-i18n';
import { Locale } from '@/i18n.config';

export async function myAction(locale: Locale) {
  const t = await getServerTranslations(locale, 'errors');

  // Use translations
  if (!user) {
    return { error: t('unauthorized') };
  }

  try {
    // ... action logic
  } catch (error) {
    return { error: t('generic') };
  }
}
```

**Client component update pattern:**
```typescript
'use client'

import { useLocale } from 'next-intl';
import { myAction } from '@/app/actions/my-actions';

function MyComponent() {
  const locale = useLocale();

  const handleAction = async () => {
    const result = await myAction(locale);
    // Handle result
  };

  return <Button onClick={handleAction}>Action</Button>;
}
```

**Note:** All server actions that return user-facing error messages will need to:
1. Add `locale: Locale` as first parameter
2. Update all call sites to pass `useLocale()` from client components

### 3. Update Server Actions (21 files)

**Standard Error Response Format:**
All server actions that can fail MUST return: `{ success: boolean, error?: string }` or just `{ error: string }` for errors.

**Pattern to follow:**

**Before:**
```typescript
export async function signupUser(user: UserNew) {
  if (!user.password_hash) {
    return 'Password is required for signup';  // ❌ Raw string
  }

  const existingUser = await findUserByEmail(user.email);
  if (existingUser) {
    return 'Ya existe un usuario con ese e-mail';  // ❌ Raw string
  }
  // ...
}
```

**After:**
```typescript
import { getServerTranslations } from '@/app/utils/server-i18n';
import { Locale } from '@/i18n.config';

export async function signupUser(user: UserNew, locale: Locale) {
  const t = await getServerTranslations(locale, 'errors');

  if (!user.password_hash) {
    return { error: t('auth.passwordRequired') };  // ✅ Object format
  }

  const existingUser = await findUserByEmail(user.email);
  if (existingUser) {
    return { error: t('auth.userExists') };  // ✅ Object format
  }
  // ...
  return newUser;  // Success returns data directly
}
```

**Client component update:**
```typescript
'use client'
import { useLocale } from 'next-intl';

function SignupForm() {
  const locale = useLocale();

  const handleSubmit = async (data) => {
    const result = await signupUser(data, locale);
    if ('error' in result) {
      setError(result.error);  // Already translated
    }
  };
}
```

**Files to update (21 total):**
1. `app/actions/user-actions.ts` - 10+ error messages
2. `app/actions/prode-group-actions.ts` - Zod validation + error messages
3. `app/actions/onboarding-actions.ts` - "Unauthorized" errors
4. `app/actions/oauth-actions.ts`
5. `app/actions/otp-actions.ts`
6. `app/actions/game-actions.ts`
7. `app/actions/game-boost-actions.ts`
8. `app/actions/game-notification-actions.ts`
9. `app/actions/game-score-generator-actions.ts`
10. `app/actions/guesses-actions.ts`
11. `app/actions/tournament-actions.ts`
12. `app/actions/tournament-scoring-actions.ts`
13. `app/actions/qualification-actions.ts`
14. `app/actions/qualified-teams-scoring-actions.ts`
15. `app/actions/team-actions.ts`
16. `app/actions/third-place-rules-actions.ts`
17. `app/actions/group-tournament-betting-actions.ts`
18. `app/actions/notification-actions.ts`
19. `app/actions/backoffice-actions.ts`

**Note:** After initial audit, 2 additional action files were found but determined to have no user-facing errors. Total count: 19 files with user-facing errors out of 21 action files.

**Strategy:**
- Audit each file for hardcoded error strings
- Replace with translation keys
- Add new translation keys to JSON files if needed
- Ensure consistent error response format
- Update ALL call sites to pass locale parameter

### 4. Update Zod Schema Validation Messages

**File: `app/actions/prode-group-actions.ts`**

**Strategy:** Keep Zod schemas synchronous with generic error codes, then translate error messages after validation fails.

**Before:**
```typescript
const imageSchema = z.object({
  image: z
    .any()
    .refine((file: File) => {
      if (file.size === 0 || file.name === undefined) return false;
      return true;
    }, "Please update or add new image.")
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      ".jpg, .jpeg, .png and .webp files are accepted."
    )
    .refine((file) => file.size <= MAX_FILE_SIZE, `Max file size is 5MB.`),
});
```

**After:**
```typescript
import { getServerTranslations } from '@/app/utils/server-i18n';
import { Locale } from '@/i18n.config';

// Keep schema synchronous with error codes
const imageSchema = z.object({
  image: z
    .any()
    .refine((file: File) => {
      if (file.size === 0 || file.name === undefined) return false;
      return true;
    }, 'IMAGE_REQUIRED')
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type),
      'IMAGE_INVALID_TYPE'
    )
    .refine((file) => file.size <= MAX_FILE_SIZE, 'IMAGE_TOO_LARGE'),
});

export async function updateTheme(groupId: string, formData: any, locale: Locale) {
  const tErrors = await getServerTranslations(locale, 'errors');
  const tValidation = await getServerTranslations(locale, 'validation');

  // ... existing code
  const validatedFields = imageSchema.safeParse({ image: data.logo });

  if (!validatedFields.success) {
    // Translate Zod error codes to user-facing messages
    const firstError = validatedFields.error.issues[0]?.message;
    let translatedMessage = tErrors('validation.invalidImage');

    if (firstError === 'IMAGE_REQUIRED') {
      translatedMessage = tValidation('image.required');
    } else if (firstError === 'IMAGE_INVALID_TYPE') {
      translatedMessage = tValidation('image.invalidType');
    } else if (firstError === 'IMAGE_TOO_LARGE') {
      translatedMessage = tValidation('image.tooLarge');
    }

    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: translatedMessage,
    };
  }
  // ...
}
```

**Benefits:**
- Schemas remain synchronous and can be defined at module level
- Type safety preserved
- Easy to test (mock translations separately)
- Clear separation between validation logic and presentation

### 5. Update Error Boundary

**File: `app/[locale]/tournaments/[id]/error.tsx`**

**Before:**
```typescript
export default function TournamentError() {
  return (
    <Typography variant="h4">Access Denied</Typography>
    <Typography>You don't have permission to view this tournament...</Typography>
    <Button>Return to Home</Button>
  );
}
```

**After:**
```typescript
'use client'

import { Box, Typography, Button, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import LockIcon from '@mui/icons-material/Lock';

export default function TournamentError({ _error, _reset }: ErrorProps) {
  const t = useTranslations('errors.tournament');
  const locale = useLocale();
  const router = useRouter();

  return (
    <Box>
      <Typography variant="h4">{t('accessDenied')}</Typography>
      <Typography>{t('noPermission')}</Typography>
      <Typography>{t('contactAdmin')}</Typography>
      <Button onClick={() => router.push(`/${locale}`)}>
        {t('returnHome')}
      </Button>
    </Box>
  );
}
```

**New translation keys in `errors.json`:**
```json
{
  "tournament": {
    "accessDenied": "Access Denied",
    "noPermission": "You don't have permission to view this tournament. This is a development tournament that requires special access.",
    "contactAdmin": "If you believe you should have access, please contact an administrator.",
    "returnHome": "Return to Home"
  }
}
```

### 6. Audit and Update Component Error Handling

**Search for components that display error messages:**
- Form validation error displays
- API error handling
- Toast/snackbar error messages

**Pattern:**
```typescript
// Client components
const t = useTranslations('errors');
setError(t('generic'));

// Server components
const t = await getTranslations({ locale, namespace: 'errors' });
```

## Files to Create/Modify

### New Files
1. `app/utils/server-i18n.ts` - Server action i18n helper utility

### Modified Files
1. `locales/en/errors.json` - Complete English translations
2. `locales/en/validation.json` - Complete English translations
3. `locales/es/errors.json` - Add missing keys for new errors (see "Spanish Translation Updates" section below)
4. `locales/es/validation.json` - Add missing keys (see "Spanish Translation Updates" section below)
5. `app/actions/user-actions.ts` - Update 10+ error messages
6. `app/actions/prode-group-actions.ts` - Update Zod validation + errors
7. `app/actions/onboarding-actions.ts` - Update "Unauthorized" errors
8. (18 more action files - audit and update as needed)
9. `app/[locale]/tournaments/[id]/error.tsx` - Update error boundary

## Implementation Steps

### Phase 1: Setup & Infrastructure
1. Create `app/utils/server-i18n.ts` with helper utilities
2. Add missing English translation keys in `locales/en/errors.json` (EnOf format)
3. Add missing English translation keys in `locales/en/validation.json` (EnOf format)
4. Add missing Spanish translation keys in `locales/es/errors.json` (EsOf format)
5. Add missing Spanish translation keys in `locales/es/validation.json` (EsOf format)

### Phase 2: Server Actions (High-Impact Files First)

**IMPORTANT:** For EACH updated action:
- Add `locale: Locale` as first parameter
- Update ALL call sites in client components to pass `useLocale()`
- Change error returns to object format: `{ error: t('key') }`
- Verify tests mock `getServerTranslations` correctly

1. Update `app/actions/user-actions.ts` (10+ messages)
2. Update `app/actions/prode-group-actions.ts` (Zod + errors)
3. Update `app/actions/onboarding-actions.ts`
4. Audit remaining 18 action files in batches:
   - Batch 1: auth-related (oauth, otp)
   - Batch 2: game-related (game-actions, guesses-actions)
   - Batch 3: tournament-related (tournament-actions, qualification-actions)
   - Batch 4: admin/backoffice (backoffice-actions)
   - Batch 5: remaining actions

### Phase 3: Client-Side Error Handling
1. Update error boundary (`app/[locale]/tournaments/[id]/error.tsx`)
2. Audit components that display errors (systematic search):
   - Search for `setError(` in components
   - Search for toast/snackbar error displays
   - Search for form error rendering
3. Update form validation error displays
4. Verify all components calling updated actions pass `locale` parameter

### Phase 4: Testing & Validation
1. Create unit tests for `server-i18n.ts` utility
2. Update existing tests with translation mocks
3. Test error scenarios in both English and Spanish
4. Verify all error messages display correctly

## Testing Strategy

### Unit Tests

**New test file: `__tests__/utils/server-i18n.test.ts`**
```typescript
import { describe, it, expect, vi } from 'vitest';
import { getServerTranslations } from '@/app/utils/server-i18n';

describe('server-i18n', () => {
  describe('getServerTranslations', () => {
    it('should return translation function for given namespace with locale', async () => {
      const t = await getServerTranslations('es', 'errors');
      const message = t('generic');
      expect(message).toBeDefined();
    });

    it('should work with English locale', async () => {
      const t = await getServerTranslations('en', 'errors');
      const message = t('generic');
      expect(message).toBeDefined();
    });

    it('should support different namespaces', async () => {
      const tErrors = await getServerTranslations('es', 'errors');
      const tValidation = await getServerTranslations('es', 'validation');
      expect(tErrors).toBeDefined();
      expect(tValidation).toBeDefined();
    });
  });
});
```

**Update existing action tests:**
- Mock `getServerTranslations` in action tests
- Verify error messages use translation keys
- Test both success and error scenarios

**Example test update:**
```typescript
// Before
expect(result).toBe('Ya existe un usuario con ese e-mail');

// After - Mock translation function
vi.mock('@/app/utils/server-i18n', () => ({
  getServerTranslations: vi.fn().mockResolvedValue((key: string) => key)
}));

// Test returns error object with translation key
expect(result).toEqual({ error: 'auth.userExists' });
```

**Test setup - Add to `vitest.setup.ts` (already exists in project root):**
```typescript
// Mock server-i18n utility for all tests
vi.mock('@/app/utils/server-i18n', () => ({
  getServerTranslations: vi.fn((locale: string, namespace: string) => {
    return Promise.resolve((key: string) => key); // Return translation key as-is
  })
}));
```

This ensures all tests that use server actions with translations will have the mock available.

### Integration Testing

1. **Language switching:**
   - Switch language to English
   - Trigger various error scenarios
   - Verify error messages display in English

2. **Error boundary:**
   - Navigate to dev-only tournament
   - Verify error message displays in current language

3. **Form validation:**
   - Submit forms with invalid data
   - Verify validation messages display in current language

### Manual Testing Checklist

- [ ] Login with invalid credentials → See error in current language
- [ ] Try to signup with existing email → See error in current language
- [ ] Upload oversized image to group theme → See validation error in current language
- [ ] Try to leave group as owner → See error in current language
- [ ] Access dev-only tournament → See error boundary in current language
- [ ] Delete account failure → See error in current language
- [ ] Switch language and repeat above scenarios

## Edge Cases & Considerations

1. **Locale detection in server actions:**
   - User hasn't set language preference → Default to 'es'
   - Cookie not found → Default to 'es'
   - Invalid locale value → Fallback to 'es'

2. **Backward compatibility during migration:**
   - **Phase 1 (This story):** Update high-impact action files (user-actions, prode-group-actions, onboarding-actions)
   - **Phase 2 (Future):** Gradually update remaining action files
   - **Client-side handling:** Components should check both formats temporarily:
     ```typescript
     const result = await myAction(locale);
     // Handle both old string format and new object format
     const errorMessage = typeof result === 'string' ? result : result?.error;
     if (errorMessage) {
       setError(errorMessage);
     }
     ```
   - **Complete migration in this story:** All 19 action files will be updated to new format (no temporary mixed state)

3. **Error interpolation:**
   - Some errors need dynamic values (e.g., `{error}`, `{min}`, `{max}`)
   - Use next-intl's interpolation: `t('key', { value: dynamicValue })`

4. **Zod validation messages:**
   - Zod schemas with i18n must be created in async functions
   - Cannot use at module level (need to await locale detection)
   - Create factory functions: `createImageSchema()`

5. **Error logging:**
   - Continue logging full error details to console
   - Only return user-friendly translated messages to client

## Validation Checklist (Pre-Merge)

- [ ] All hardcoded error strings replaced with translation keys
- [ ] English translation keys added (with `EnOf()` wrappers as per design)
- [ ] `getServerTranslations()` utility working correctly
- [ ] All 21 server action files audited
- [ ] Error boundary displays translated text
- [ ] Zod validation messages internationalized
- [ ] All tests passing (including new tests for utility)
- [ ] 80% code coverage on modified files
- [ ] Manual testing completed in both languages
- [ ] No console errors or warnings
- [ ] SonarCloud: 0 new issues
- [ ] Language switching works seamlessly for all errors

## Dependencies

**Required (already completed):**
- #149 - i18n Library Setup ✅
- #150 - Translation Key Extraction & Namespace Design ✅
- #151 - Translation Helper Utilities & Patterns ✅

**Blocks:**
- #161 - LLM-Assisted English Translation (can leverage completed translations)
- Future stories that add new error messages

## Success Metrics

- All user-facing error and validation messages support English and Spanish
- Consistent error handling pattern across all server actions
- Improved UX for English-speaking users
- Developer-friendly utility for adding i18n to new actions
- 0 hardcoded error strings in server actions
- Full test coverage for error scenarios in both languages

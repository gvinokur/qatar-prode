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
- English translation files use `EnOf()` placeholders instead of proper English text

**Scope:**
- Server action error messages in `app/actions/*.ts`
- Zod schema validation messages
- Error boundary messages (`app/[locale]/tournaments/[id]/error.tsx`)
- Complete English translations for `locales/en/errors.json` and `locales/en/validation.json`

## Acceptance Criteria

- [ ] All server action error messages use `getTranslations('errors')` instead of hardcoded strings
- [ ] All Zod validation messages use `getTranslations('validation')` instead of hardcoded strings
- [ ] Error boundary uses `useTranslations('errors')` for all text
- [ ] Spanish translations preserved in `locales/es/errors.json` and `locales/es/validation.json`
- [ ] English translations completed in `locales/en/errors.json` and `locales/en/validation.json` (remove `EnOf()` wrappers)
- [ ] Create i18n utility helper for server actions: `getServerTranslations()` that automatically detects locale
- [ ] All 21 server action files audited and updated
- [ ] Consistent error response format: `{ success: false, error: string }` or `{ error: string }`
- [ ] Full application testable in both languages
- [ ] All existing tests updated with translation mocks
- [ ] 80% code coverage maintained on modified files
- [ ] 0 new SonarCloud issues

## Technical Approach

### 1. Complete English Translation Files

**Files to update:**
- `locales/en/errors.json` - Replace `EnOf()` wrappers with proper English translations
- `locales/en/validation.json` - Replace `EnOf()` wrappers with proper English translations

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

**Target state (errors.json):**
```json
{
  "generic": "An unexpected error occurred. Please try again.",
  "unauthorized": "Unauthorized",
  "notFound": "Not found",
  "auth": {
    "invalidCredentials": "Invalid email or password",
    "googleAccount": "This account uses Google sign-in.",
    "emailSendFailed": "Failed to send email. Please try again.",
    "passwordUpdateFailed": "Failed to update password. Please try again.",
    "noUser": "No user found with that email",
    "passwordRequired": "Password is required for signup",
    "userExists": "A user with that email already exists",
    "invalidToken": "Invalid or expired token",
    "tokenExpired": "Token has expired",
    "verificationFailed": "Failed to verify email"
  },
  "groups": {
    "copyFailed": "Failed to copy: {error}",
    "notFound": "Group not found",
    "unauthorized": "Only the group owner can perform this action",
    "cannotLeave": "The group owner cannot leave the group",
    "joinFailed": "Failed to join group",
    "uploadFailed": "Image upload failed. Please try again with a smaller file.",
    "fileTooLarge": "File is too large. Maximum size is 5MB."
  },
  "account": {
    "deleteFailed": "Failed to delete account. Please try again."
  },
  "validation": {
    "invalidImage": "Invalid image file",
    "fileSizeExceeded": "File size exceeded",
    "bodyExceeded": "Request body is too large"
  }
}
```

**Target state (validation.json):**
```json
{
  "required": "Required",
  "optional": "Optional",
  "email": {
    "invalid": "Invalid email address",
    "required": "Please enter your email"
  },
  "password": {
    "required": "Password is required",
    "minLength": "Password must be at least {min} characters"
  },
  "nickname": {
    "required": "Nickname is required",
    "minLength": "Nickname must be at least {min} characters",
    "maxLength": "Nickname must be at most {max} characters",
    "unavailable": "This nickname is not available",
    "available": "✓ Available"
  },
  "groupName": {
    "required": "Group name is required"
  },
  "confirmPassword": {
    "mismatch": "Passwords do not match"
  },
  "image": {
    "required": "Please select an image",
    "invalidType": ".jpg, .jpeg, .png and .webp files are accepted",
    "tooLarge": "Max file size is 5MB"
  }
}
```

**Spanish Translation Updates (`locales/es/errors.json`):**

Add these missing keys to maintain parity with English:
```json
{
  "generic": "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
  "unauthorized": "No autorizado",
  "notFound": "No encontrado",
  "auth": {
    "invalidCredentials": "Email o contraseña inválida",
    "googleAccount": "Esta cuenta usa inicio de sesión con Google.",
    "emailSendFailed": "Error al enviar el correo electrónico. Por favor, inténtalo de nuevo.",
    "passwordUpdateFailed": "Error al actualizar la contraseña. Por favor, inténtalo de nuevo.",
    "noUser": "No existe un usuario con ese e-mail",
    "passwordRequired": "La contraseña es requerida para registrarse",
    "userExists": "Ya existe un usuario con ese e-mail",
    "invalidToken": "Token inválido o expirado",
    "tokenExpired": "El token ha expirado",
    "verificationFailed": "Error al verificar el correo electrónico"
  },
  "groups": {
    "copyFailed": "Error al copiar: {error}",
    "notFound": "El grupo no existe",
    "unauthorized": "Solo el dueño del grupo puede realizar esta acción",
    "cannotLeave": "El dueño del grupo no puede dejar el grupo",
    "joinFailed": "Error al unirse al grupo",
    "uploadFailed": "Error al subir la imagen. Por favor, inténtalo de nuevo con un archivo más pequeño.",
    "fileTooLarge": "El archivo es demasiado grande. El tamaño máximo es 5MB."
  },
  "account": {
    "deleteFailed": "Error al eliminar la cuenta. Por favor, inténtalo de nuevo."
  },
  "validation": {
    "invalidImage": "Archivo de imagen inválido",
    "fileSizeExceeded": "Tamaño de archivo excedido",
    "bodyExceeded": "El cuerpo de la solicitud es demasiado grande"
  },
  "tournament": {
    "accessDenied": "Acceso Denegado",
    "noPermission": "No tienes permiso para ver este torneo. Este es un torneo de desarrollo que requiere acceso especial.",
    "contactAdmin": "Si crees que deberías tener acceso, por favor contacta a un administrador.",
    "returnHome": "Volver al Inicio"
  }
}
```

**Spanish Translation Updates (`locales/es/validation.json`):**

Add these missing keys:
```json
{
  "required": "Requerido",
  "optional": "Opcional",
  "email": {
    "invalid": "Dirección de e-mail inválida",
    "required": "Por favor ingrese su e-mail"
  },
  "password": {
    "required": "La contraseña es requerida",
    "minLength": "La contraseña debe tener al menos {min} caracteres"
  },
  "nickname": {
    "required": "El nickname es requerido",
    "minLength": "El nickname debe tener al menos {min} caracteres",
    "maxLength": "El nickname debe tener máximo {max} caracteres",
    "unavailable": "Este nickname no está disponible",
    "available": "✓ Disponible"
  },
  "groupName": {
    "required": "El nombre del grupo es obligatorio"
  },
  "confirmPassword": {
    "mismatch": "Las contraseñas no coinciden"
  },
  "image": {
    "required": "Por favor seleccione una imagen",
    "invalidType": "Se aceptan archivos .jpg, .jpeg, .png y .webp",
    "tooLarge": "El tamaño máximo del archivo es 5MB"
  }
}
```

### 2. Create Server Action i18n Helper Utility

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
2. Complete English translations in `locales/en/errors.json`
3. Complete English translations in `locales/en/validation.json`
4. Add missing Spanish translation keys (maintain parity with English)

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
- [ ] English translation files completed (no `EnOf()` wrappers)
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

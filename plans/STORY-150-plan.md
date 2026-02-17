# Implementation Plan: Translation Key Extraction & Namespace Design

## Story Context

**Issue #150:** [i18n] Translation Key Extraction & Namespace Design

**Objective:** Design and implement a comprehensive translation namespace structure for the Qatar Prode application, extracting all hardcoded Spanish strings and organizing them into maintainable translation files.

**Why this is critical:** This story is the foundational blocker for all translation work. Story #149 established the i18n infrastructure (`next-intl`, routing, providers), but translation files are minimal (~10 entries). The codebase has **100+ hardcoded Spanish strings** scattered across components, email templates, and pages. This story creates the translation architecture and baseline content that enables all future translation stories.

## Acceptance Criteria

- [ ] Comprehensive namespace design documented
- [ ] All hardcoded Spanish strings extracted and organized
- [ ] Spanish translation files created with complete baseline
- [ ] English translation files created with placeholder structure
- [ ] Extraction script for identifying new hardcoded strings
- [ ] Developer guide for adding new translations
- [ ] Type definitions updated for new namespaces

## Current State Analysis

### Existing i18n Infrastructure (Story #149)

**Configuration:**
- `next-intl` library (^4.8.3) configured
- Locales: `['en', 'es']`, default: `'es'`
- Routing: Always prefix (`/en/`, `/es/`)
- Translation files: `locales/{locale}/{namespace}.json`

**Active Namespaces:**
- `common.json` - Basic app strings (~10 entries)
- `navigation.json` - Header/nav strings

**Translation Pattern:**
```typescript
'use client';
import { useTranslations } from 'next-intl';

const t = useTranslations('common');
return <Button>{t('app.save')}</Button>;
```

### Hardcoded Strings Inventory

**Email Templates** (`app/utils/email-templates.ts`): 8+ strings
- Subjects, body text, button labels, signatures

**Authentication Components**: 20+ strings
- `login-form.tsx`, `signup-form.tsx`, `forgot-password-form.tsx`
- `account-setup-form.tsx`, `reset-password/page.tsx`
- Validation messages, error messages, form labels

**Friend Groups Components**: 30+ strings
- `friend-groups-list.tsx`, `tournament-groups-list.tsx`
- `join-group-dialog.tsx`, `invite-friends-dialog.tsx`
- Dialog titles, descriptions, button labels

**Delete Account Flow** (`delete-account-button.tsx`): 10+ strings
- Confirmation dialog, warning messages, action labels

**Common Patterns:**
- Dialog titles: `'Crear...'`, `'Borrar...'`, `'Editar...'`
- Buttons: `'Cancelar'`, `'Guardar'`, `'Confirmar'`
- Validation: Error messages, field requirements
- Placeholders: Input hints

## Technical Approach

### 1. Namespace Architecture Design

**Proposed namespace structure:**

```
locales/{locale}/
├── common.json         # Buttons, labels, generic UI (EXPAND existing)
├── navigation.json     # Header, nav, footer (EXISTING)
├── auth.json           # Login, signup, verification, password reset
├── onboarding.json     # 7-step onboarding flow (future)
├── games.json          # Predictions, game cards, scoring (future)
├── tournaments.json    # Tournament-specific text (future)
├── groups.json         # Friend groups, invites
├── emails.json         # Email templates and subjects
├── errors.json         # Error messages
└── validation.json     # Form validation messages
```

**Priority for Story #150:**
- ✅ **Expand `common.json`** with universal UI strings
- ✅ **Create `auth.json`** - Authentication flow strings
- ✅ **Create `groups.json`** - Friend groups strings
- ✅ **Create `emails.json`** - Email template strings
- ✅ **Create `validation.json`** - Form validation strings
- ✅ **Create `errors.json`** - Error messages
- ⏸️ `onboarding.json` - Defer to Story #153
- ⏸️ `games.json` - Defer to Story #154
- ⏸️ `tournaments.json` - Defer to Story #157

### 2. Key Structure Design

**Naming Convention:**
```
{namespace}.{section}.{key}
{namespace}.{section}.{subsection}.{key}
```

**Examples:**
```typescript
// Common UI
t('common.buttons.save')          // "Guardar"
t('common.buttons.cancel')        // "Cancelar"
t('common.buttons.delete')        // "Eliminar"

// Authentication
t('auth.login.title')             // "Iniciar Sesión"
t('auth.login.email.label')       // "E-Mail"
t('auth.login.email.placeholder') // "tu@email.com"
t('auth.login.errors.invalid')    // "Email o Contraseña Invalida"

// Friend Groups
t('groups.create.title')          // "Crear Grupo de Amigos"
t('groups.create.description')    // "Un grupo de amigos te permite..."
t('groups.invite.title')          // "Invitar amigos a {groupName}"
t('groups.invite.message')        // "¡Hola! Te invito a..."

// Validation
t('validation.required')          // "Requerido"
t('validation.email.invalid')     // "Direccion de E-Mail invalida"
t('validation.password.minLength') // "La contraseña debe tener al menos 8 caracteres"

// Email Templates
t('emails.verification.subject')  // "Verificación de Cuenta - La Maquina Prode"
t('emails.verification.title')    // "Verifica tu dirección de correo electrónico"
t('emails.verification.button')   // "Verificar correo electrónico"
```

**Interpolation for Dynamic Content:**
```typescript
// Template with variables
t('groups.invite.title', { groupName: 'Mi Grupo' })
// Result: "Invitar amigos a Mi Grupo"

// Pluralization (when needed)
t('groups.members', { count: 5 })
// Could return: "5 miembros" or "1 miembro"
```

### 3. Translation File Implementation

**Step-by-step approach:**

**3.1. Create Spanish Baseline (Extract Hardcoded Strings)**

For each namespace, create structured JSON with extracted strings:

**`locales/es/common.json`** - EXPAND existing:
```json
{
  "app": {
    "name": "Prode Mundial",
    "description": "Plataforma de pronósticos deportivos",
    "loading": "Cargando...",
    "error": "Ocurrió un error"
  },
  "buttons": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "close": "Cerrar",
    "create": "Crear",
    "confirm": "Confirmar"
  },
  "actions": {
    "showMore": "mostrar más",
    "viewAll": "Ver todo",
    "back": "Volver"
  }
}
```

**`locales/es/auth.json`** - NEW:
```json
{
  "login": {
    "title": "Iniciar Sesión",
    "email": {
      "label": "E-Mail",
      "placeholder": "tu@email.com",
      "required": "Por favor ingrese su e-mail",
      "invalid": "Direccion de E-Mail invalida"
    },
    "password": {
      "label": "Contraseña",
      "placeholder": "Tu contraseña"
    },
    "errors": {
      "invalidCredentials": "Email o Contraseña Invalida"
    },
    "success": {
      "verified": "¡Tu correo electrónico ha sido verificado exitosamente! Ahora puedes iniciar sesión."
    },
    "forgotPassword": "¿Olvidaste tu contraseña?"
  },
  "signup": {
    "title": "Registrarse",
    // ... more keys
  },
  "forgotPassword": {
    "title": "Recuperar Contraseña",
    "description": "Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.",
    "errors": {
      "googleAccount": "Esta cuenta usa inicio de sesión con Google. No se puede restablecer la contraseña.",
      "sendFailed": "Error al enviar el correo electrónico. Por favor, inténtalo de nuevo."
    }
  },
  "resetPassword": {
    "title": "Restablecer contraseña",
    "newPassword": {
      "label": "Nueva contraseña",
      "required": "La contraseña es requerida",
      "minLength": "La contraseña debe tener al menos 8 caracteres"
    },
    "confirmPassword": {
      "label": "Confirmar contraseña",
      "placeholder": "Confirma tu contraseña",
      "mismatch": "Las contraseñas no coinciden"
    },
    "button": {
      "submit": "Actualizar contraseña",
      "submitting": "Actualizando..."
    },
    "errors": {
      "updateFailed": "Error al actualizar la contraseña. Por favor, inténtalo de nuevo."
    }
  },
  "accountSetup": {
    "nickname": {
      "label": "Apodo",
      "required": "El nickname es requerido",
      "minLength": "El nickname debe tener al menos 3 caracteres",
      "maxLength": "El nickname debe tener máximo 20 caracteres",
      "unavailable": "Este nickname no está disponible",
      "available": "✓ Disponible"
    },
    "password": {
      "label": "Contraseña",
      "optional": "Opcional: Crear contraseña por si acaso",
      "minLength": "La contraseña debe tener al menos 8 caracteres"
    }
  },
  "userSettings": {
    "title": "Configuracion de Usuario",
    "nickname": {
      "label": "Apodo"
    }
  },
  "deleteAccount": {
    "button": "Eliminar mi cuenta",
    "title": "¿Estás seguro de que quieres eliminar tu cuenta?",
    "warning": "Esta acción es irreversible. Se eliminarán todos tus datos, incluyendo:",
    "consequences": {
      "predictions": "Todos tus pronósticos de partidos y torneos",
      "groups": "Tu membresía en todos los grupos",
      "ownedGroups": "Los grupos que hayas creado",
      "personalInfo": "Toda tu información personal"
    },
    "confirmation": {
      "prompt": "Para confirmar, escribe ELIMINAR en el campo a continuación:",
      "required": "Por favor, escribe ELIMINAR para confirmar"
    },
    "button": {
      "cancel": "Cancelar",
      "delete": "Eliminar cuenta",
      "deleting": "Eliminando..."
    },
    "errors": {
      "unexpected": "Ocurrió un error inesperado. Por favor, inténtalo de nuevo."
    }
  },
  "verificationSent": {
    "title": "¡Registro Exitoso de {nickname}!",
    "message": "Por favor, revisa tu correo electrónico y sigue las instrucciones."
  }
}
```

**`locales/es/groups.json`** - NEW:
```json
{
  "title": "Grupos de Amigos",
  "status": {
    "youAreHere": "Estás aquí"
  },
  "actions": {
    "create": "Crear Grupo",
    "delete": "Borrar Grupo",
    "invite": "Invitar Amigos",
    "inviteMore": "Invitar mas amigos",
    "join": "Unirse al Grupo",
    "view": "Ver Grupos"
  },
  "create": {
    "title": "Crear Grupo de Amigos",
    "description": "Un grupo de amigos te permite tener un ranking privado. Crea tantos grupos como quieras para jugar con diferentes círculos de amigos.",
    "nameField": {
      "label": "Nombre",
      "required": "El nombre del grupo es obligatorio"
    },
    "buttons": {
      "cancel": "Cancelar",
      "create": "Crear"
    }
  },
  "delete": {
    "title": "Borrar Grupo",
    "confirmation": "¿Estás seguro de que quieres borrar este grupo?"
  },
  "invite": {
    "title": "Invitar amigos a {groupName}",
    "message": "¡Hola! Te invito a unirte a nuestro grupo \"{groupName}\" para jugar en al prode en los torneos actuales y futuros. Usa este enlace para unirte: {link}",
    "feedback": {
      "copied": "¡Enlace copiado al portapapeles!",
      "copyError": "Error al copiar el enlace"
    }
  },
  "join": {
    "title": "Unirse a un Grupo",
    "codeField": {
      "label": "Código de Grupo",
      "placeholder": "Ingresa el código del grupo",
      "required": "Por favor ingresa un código de grupo"
    },
    "buttons": {
      "cancel": "Cancelar",
      "join": "Unirse al Grupo"
    }
  }
}
```

**`locales/es/emails.json`** - NEW:
```json
{
  "verification": {
    "subject": "Verificación de Cuenta - La Maquina Prode",
    "title": "Verifica tu dirección de correo electrónico",
    "greeting": "¡Gracias por registrarte!",
    "button": "Verificar correo electrónico",
    "expiration": "Este enlace expirará en 24 horas.",
    "signature": "El equipo de La Maquina Prode"
  },
  "passwordReset": {
    "subject": "Recuperación de contraseña - La Maquina Prode",
    "title": "Restablecer contraseña",
    "button": "Restablecer contraseña",
    "expiration": "Este enlace expirará en 1 hora.",
    "signature": "El equipo de La Maquina Prode"
  }
}
```

**`locales/es/validation.json`** - NEW:
```json
{
  "required": "Requerido",
  "optional": "Opcional",
  "email": {
    "invalid": "Direccion de E-Mail invalida",
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
  }
}
```

**`locales/es/errors.json`** - NEW:
```json
{
  "generic": "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
  "auth": {
    "invalidCredentials": "Email o Contraseña Invalida",
    "googleAccount": "Esta cuenta usa inicio de sesión con Google.",
    "emailSendFailed": "Error al enviar el correo electrónico. Por favor, inténtalo de nuevo.",
    "passwordUpdateFailed": "Error al actualizar la contraseña. Por favor, inténtalo de nuevo."
  },
  "groups": {
    "copyFailed": "Error al copiar: {error}"
  }
}
```

**3.2. Create English Placeholder Files**

Mirror the structure with English translations:

**`locales/en/common.json`**, **`locales/en/auth.json`**, etc.

For now, these will have placeholder English text or empty strings to be filled by Story #161 (LLM-Assisted English Translation).

Example structure:
```json
{
  "login": {
    "title": "Log In",
    "email": {
      "label": "Email",
      "placeholder": "your@email.com"
      // ...
    }
  }
}
```

### 4. Type Definitions Update

**Update `types/i18n.ts`:**

```typescript
import type common from '@/locales/en/common.json';
import type navigation from '@/locales/en/navigation.json';
import type auth from '@/locales/en/auth.json';
import type groups from '@/locales/en/groups.json';
import type emails from '@/locales/en/emails.json';
import type validation from '@/locales/en/validation.json';
import type errors from '@/locales/en/errors.json';

type Messages = {
  common: typeof common;
  navigation: typeof navigation;
  auth: typeof auth;
  groups: typeof groups;
  emails: typeof emails;
  validation: typeof validation;
  errors: typeof errors;
};

declare global {
  interface IntlMessages extends Messages {}
}
```

**Update `i18n/request.ts`** to load new namespaces:

```typescript
export default getRequestConfig(async ({ locale }) => {
  return {
    messages: {
      ...(await import(`../locales/${locale}/common.json`)).default,
      ...(await import(`../locales/${locale}/navigation.json`)).default,
      ...(await import(`../locales/${locale}/auth.json`)).default,
      ...(await import(`../locales/${locale}/groups.json`)).default,
      ...(await import(`../locales/${locale}/emails.json`)).default,
      ...(await import(`../locales/${locale}/validation.json`)).default,
      ...(await import(`../locales/${locale}/errors.json`)).default,
    },
  };
});
```

### 5. Extraction Script

**Create `scripts/extract-hardcoded-strings.sh`:**

```bash
#!/bin/bash
# Finds hardcoded Spanish strings in component files

echo "Searching for hardcoded Spanish strings..."
echo ""

# Common Spanish words/patterns to search for
PATTERNS=(
  "Crear "
  "Guardar"
  "Cancelar"
  "Eliminar"
  "Confirmar"
  "Borrar"
  "nombre"
  "contraseña"
  "correo"
  "email"
  "E-Mail"
  "Por favor"
  "debe tener"
  "es requerido"
  "es obligatorio"
  "¿Estás seguro"
  "Este enlace"
  "Tu "
  "tu "
  "para "
)

for pattern in "${PATTERNS[@]}"; do
  echo "=== Searching for: '$pattern' ==="
  grep -r --include="*.tsx" --include="*.ts" -n "$pattern" app/ | head -20
  echo ""
done

echo "Search complete. Review results for hardcoded strings."
```

Make executable: `chmod +x scripts/extract-hardcoded-strings.sh`

**Usage:**
```bash
./scripts/extract-hardcoded-strings.sh
```

### 6. Developer Guide

**Create `docs/i18n-guide.md`:**

```markdown
# i18n Developer Guide

## Adding New Translations

### 1. Choose the Right Namespace

- `common.json` - Generic UI elements (buttons, actions, app-wide strings)
- `auth.json` - Authentication, login, signup, password flows
- `groups.json` - Friend groups, invites, group management
- `emails.json` - Email templates and subjects
- `validation.json` - Form validation messages
- `errors.json` - Error messages
- `onboarding.json` - Onboarding flow (future)
- `games.json` - Game predictions, cards (future)
- `tournaments.json` - Tournament-specific (future)

### 2. Add Translation Keys

**Step 1:** Add Spanish baseline to `locales/es/{namespace}.json`

```json
{
  "section": {
    "subsection": {
      "key": "Texto en español"
    }
  }
}
```

**Step 2:** Add English translation to `locales/en/{namespace}.json`

```json
{
  "section": {
    "subsection": {
      "key": "Text in English"
    }
  }
}
```

### 3. Use in Components

**Client Components:**

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('namespace');

  return (
    <div>
      <h1>{t('section.subsection.key')}</h1>
    </div>
  );
}
```

**With Interpolation:**

```typescript
const t = useTranslations('groups');

// Translation: "Invitar amigos a {groupName}"
return <h1>{t('invite.title', { groupName: 'Mi Grupo' })}</h1>;
// Result: "Invitar amigos a Mi Grupo"
```

**Server Components:**

```typescript
import { getTranslations } from 'next-intl/server';

export default async function MyServerComponent() {
  const t = await getTranslations('namespace');

  return <h1>{t('section.key')}</h1>;
}
```

### 4. Naming Conventions

- Use camelCase for keys: `emailLabel`, `passwordPlaceholder`
- Organize by hierarchy: `auth.login.email.label`
- Keep keys descriptive: `deleteAccount.confirmation.prompt`
- Group related keys: All email fields under `email.{}`

### 5. Check for Existing Keys

Before adding new keys, check if similar translations exist:

```bash
# Search across all namespace files
grep -r "Guardar" locales/es/
```

### 6. Testing Translations

**Switch language in dev:**
- Navigate to `/en/` or `/es/` routes
- Use language switcher in header

**Verify all locales:**
```bash
npm run build
```

TypeScript will catch missing translation keys.
```

## Files to Create/Modify

### Create New Files

1. **`locales/es/auth.json`** - Spanish authentication strings
2. **`locales/es/groups.json`** - Spanish friend groups strings
3. **`locales/es/emails.json`** - Spanish email template strings
4. **`locales/es/validation.json`** - Spanish validation messages
5. **`locales/es/errors.json`** - Spanish error messages
6. **`locales/en/auth.json`** - English authentication strings (placeholders)
7. **`locales/en/groups.json`** - English friend groups strings (placeholders)
8. **`locales/en/emails.json`** - English email template strings (placeholders)
9. **`locales/en/validation.json`** - English validation messages (placeholders)
10. **`locales/en/errors.json`** - English error messages (placeholders)
11. **`scripts/extract-hardcoded-strings.sh`** - String extraction script
12. **`docs/i18n-guide.md`** - Developer guide

### Modify Existing Files

1. **`locales/es/common.json`** - EXPAND with universal UI strings
2. **`locales/en/common.json`** - EXPAND with English universal UI strings
3. **`types/i18n.ts`** - Add new namespace type imports
4. **`i18n/request.ts`** - Load new namespaces

## Implementation Steps

### Phase 1: Namespace Design & Documentation
1. Create namespace design document (this plan)
2. Create developer guide (`docs/i18n-guide.md`)

### Phase 2: Spanish Baseline Creation
1. Expand `locales/es/common.json` with universal UI strings
2. Create `locales/es/auth.json` with authentication strings
3. Create `locales/es/groups.json` with friend groups strings
4. Create `locales/es/emails.json` with email template strings
5. Create `locales/es/validation.json` with validation messages
6. Create `locales/es/errors.json` with error messages

### Phase 3: English Placeholder Creation
1. Expand `locales/en/common.json` with placeholders
2. Create `locales/en/auth.json` with placeholders
3. Create `locales/en/groups.json` with placeholders
4. Create `locales/en/emails.json` with placeholders
5. Create `locales/en/validation.json` with placeholders
6. Create `locales/en/errors.json` with placeholders

### Phase 4: Type System Updates
1. Update `types/i18n.ts` with new namespace imports
2. Update `i18n/request.ts` to load new namespaces
3. Verify TypeScript compilation

### Phase 5: Extraction Script
1. Create `scripts/extract-hardcoded-strings.sh`
2. Make script executable
3. Test script execution
4. Document usage in developer guide

### Phase 6: Validation
1. Run `npm run build` to verify TypeScript types
2. Test script execution
3. Review completeness of extracted strings
4. Verify JSON structure and syntax

## Testing Strategy

### Unit Tests

**Test namespace loading:**
```typescript
// __tests__/i18n/namespaces.test.ts
import { describe, it, expect } from 'vitest';

describe('i18n Namespaces', () => {
  it('should load all Spanish namespaces', async () => {
    const common = await import('@/locales/es/common.json');
    const auth = await import('@/locales/es/auth.json');
    const groups = await import('@/locales/es/groups.json');

    expect(common.default).toBeDefined();
    expect(auth.default).toBeDefined();
    expect(groups.default).toBeDefined();
  });

  it('should have matching keys in English and Spanish', async () => {
    const esAuth = await import('@/locales/es/auth.json');
    const enAuth = await import('@/locales/en/auth.json');

    // Compare structure (keys exist in both)
    expect(Object.keys(esAuth.default)).toEqual(Object.keys(enAuth.default));
  });
});
```

**Test type definitions:**
```typescript
// __tests__/i18n/types.test.ts
import { describe, it, expect } from 'vitest';
import type { IntlMessages } from '@/types/i18n';

describe('i18n Types', () => {
  it('should have all namespace types defined', () => {
    type Namespaces = keyof IntlMessages;

    const namespaces: Namespaces[] = [
      'common',
      'navigation',
      'auth',
      'groups',
      'emails',
      'validation',
      'errors'
    ];

    expect(namespaces.length).toBeGreaterThan(0);
  });
});
```

### Manual Testing

1. **TypeScript Compilation:**
   ```bash
   npm run build
   ```
   Verify no type errors related to i18n

2. **Script Execution:**
   ```bash
   ./scripts/extract-hardcoded-strings.sh
   ```
   Verify script runs without errors

3. **JSON Validity:**
   ```bash
   # Validate JSON syntax
   for file in locales/**/*.json; do
     echo "Validating $file"
     jq empty "$file" || echo "Invalid JSON: $file"
   done
   ```

4. **Developer Guide:**
   - Read through `docs/i18n-guide.md`
   - Verify examples are clear and complete
   - Check that all namespaces are documented

### Coverage Requirements

- JSON files: Syntax validation
- Type definitions: Compilation without errors
- Extraction script: Successful execution
- Documentation: Comprehensive and accurate

No component changes in this story, so no UI tests needed. Translation usage in components will be covered in subsequent stories (#152, #153, etc.).

## Validation & Quality Gates

### Pre-Commit Checklist

- [ ] All Spanish translation files created
- [ ] All English placeholder files created
- [ ] Type definitions updated
- [ ] Extraction script created and executable
- [ ] Developer guide created
- [ ] All JSON files have valid syntax
- [ ] TypeScript compilation succeeds
- [ ] No linting errors

### SonarCloud Requirements

- **Coverage:** N/A (no executable code, only JSON and docs)
- **Code Smells:** N/A (no code changes)
- **Duplications:** Minimal (translation files by nature have similar structure)
- **Security:** No sensitive data in translation files

### Manual Validation

1. Review translation file completeness against hardcoded string inventory
2. Verify namespace structure aligns with proposed design
3. Check developer guide clarity and examples
4. Test extraction script execution

## Risk Mitigation

### Risk: Incomplete String Extraction

**Mitigation:**
- Use Explore agent findings as baseline
- Run extraction script to catch remaining strings
- Document extraction process for future updates

### Risk: Type Definition Errors

**Mitigation:**
- Update types incrementally
- Run `npm run build` after each namespace addition
- Use TypeScript strict mode to catch issues early

### Risk: JSON Syntax Errors

**Mitigation:**
- Use JSON validator during creation
- Run syntax check before commit
- Leverage editor JSON validation

### Risk: Namespace Structure Changes

**Mitigation:**
- Document rationale for structure in this plan
- Get user approval before implementation
- Create migration guide if structure needs to change

## Open Questions

None at this time. The infrastructure and patterns are well-established from Story #149.

## Dependencies

- **Depends on:** Story #149 (i18n Library Setup & Configuration) ✅ COMPLETE
- **Blocks:**
  - Story #151 (Translation Helper Utilities)
  - Story #152 (Translate Authentication Flow)
  - Story #153 (Translate Onboarding Flow)
  - Story #154 (Translate Game Prediction Components)
  - Story #155 (Translate Common UI Components)
  - Story #156 (Translate Friend Groups & Social Features)
  - Story #159 (Error Messages & Validation Internationalization)
  - Story #161 (LLM-Assisted English Translation)

## Next Steps After This Story

1. **Story #151** - Translation Helper Utilities (date/time formatting, pluralization)
2. **Story #161** - LLM-Assisted English Translation (use Claude/GPT-4 to translate baseline)
3. **Story #152-156** - Translate specific feature areas using the namespace structure

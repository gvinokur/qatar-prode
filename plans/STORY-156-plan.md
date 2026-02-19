# Implementation Plan: [i18n] Translate Friend Groups & Social Features (#156)

## Context

This story completes the internationalization of social features in the Qatar Prode application. Currently, all friend group components contain hardcoded Spanish strings, preventing English-speaking users from using these features. Story #150 established the i18n infrastructure and namespace design with `groups.json` allocated for friend groups translations. Stories #153 and #154 successfully internationalized the onboarding and game prediction flows, providing working patterns to follow.

This implementation will extract ~68 hardcoded Spanish strings from 9 components and integrate them with the existing next-intl translation system, enabling bilingual support for all social features.

## Objectives

1. **Extract hardcoded strings** from friend groups components into `locales/es/groups.json`
2. **Add English locale keys** to `locales/en/groups.json` using "EnOf(spanish text)" wrapper pattern (actual translations will be done in Story #161)
3. **Update components** to use `useTranslations()` hook from next-intl
4. **Handle dynamic content** with proper variable interpolation (groupName, links)
5. **Consolidate common strings** by using `common` namespace for shared buttons
6. **Maintain functionality** - no behavior changes, only text extraction

## Acceptance Criteria

- [ ] All 9 components use `useTranslations()` hook for text content
- [ ] All hardcoded Spanish strings extracted to `locales/es/groups.json`
- [ ] All English locale keys added to `locales/en/groups.json` using "EnOf(spanish text)" wrapper pattern
- [ ] Dynamic content (group names, links) uses proper variable interpolation
- [ ] Common strings (Cancel, Create, Close buttons) reference `common` namespace
- [ ] Language switcher changes friend groups text in real-time
- [ ] No hardcoded strings remain in any friend groups component
- [ ] All existing functionality works identically in both languages

## Technical Approach

### 1. Translation Files Structure

**IMPORTANT:** The existing `locales/es/groups.json` already has a structure from Story #150. We will **EXTEND** this structure, not replace it.

**Current structure (Story #150):**
```json
{
  "title": "Grupos de Amigos",
  "status": { "youAreHere": "Estás aquí" },
  "actions": { "create", "delete", "invite", "inviteMore", "join", "view" },
  "create": { "title", "description", "nameField", "buttons" },
  "delete": { "title", "confirmation" },
  "invite": { "title", "message", "feedback" },
  "join": { "title", "codeField", "buttons" }
}
```

**Update `locales/es/groups.json`:**
Add new sections to the EXISTING structure (keeping all Story #150 content):

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
    "description": "Comparte este enlace con tus amigos para que se unan al grupo.",
    "directShare": "O comparte directamente a través de:",
    "message": "¡Hola! Te invito a unirte a nuestro grupo \"{groupName}\" para jugar en al prode en los torneos actuales y futuros. Usa este enlace para unirte: {link}",
    "emailSubject": "Invitación al grupo \"{groupName}\" del Prode",
    "buttons": {
      "email": "Email",
      "whatsapp": "WhatsApp"
    },
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
  },
  "leave": {
    "button": "Dejar grupo",
    "confirmation": {
      "title": "¿Estás seguro?",
      "message": "¿Quieres dejar este grupo? Ya no podras competir con tus amigos."
    },
    "feedback": {
      "success": "Has dejado el grupo exitosamente.",
      "error": "Error al dejar el grupo."
    }
  },
  "notifications": {
    "sendButton": "Enviar Notificación",
    "dialog": {
      "title": "Enviar Notificación a Participantes",
      "targetLabel": "Destino",
      "targetOptions": {
        "tournament": "Página del torneo",
        "friendsGroup": "Página del grupo de amigos"
      },
      "titleLabel": "Título",
      "messageLabel": "Mensaje"
    },
    "feedback": {
      "success": "Notificación enviada",
      "error": "Error al enviar notificación"
    }
  },
  "standings": {
    "title": "Tabla de Posiciones",
    "empty": "No hay torneos activos disponibles en este momento."
  },
  "betting": {
    "statusEnabled": "Apuesta habilitada",
    "statusDisabled": "Apuesta deshabilitada",
    "toggleEnable": "Habilitar",
    "toggleDisable": "Deshabilitar",
    "amountLabel": "Monto de la apuesta",
    "descriptionLabel": "Descripción del pago",
    "paymentStatusLabel": "Estado de pago",
    "tableHeaders": {
      "name": "Nombre",
      "paid": "¿Pagó?",
      "actions": "Acciones"
    },
    "changeButton": "Cambiar",
    "summary": {
      "perPerson": "Monto por persona:",
      "total": "Monto acumulado:",
      "description": "Descripción:",
      "paidList": "Pagaron:"
    },
    "feedback": {
      "configSaved": "¡Configuración guardada!",
      "configError": "Error al guardar la configuración",
      "paymentUpdated": "¡Estado de pago actualizado!",
      "paymentError": "Error al actualizar el estado de pago"
    }
  },
  "joinMessage": {
    "title": "Bienvenido!!",
    "body": "Gracias por unirte a este grupo.\nAhora vas a poder competir contra un montón de amigos."
  },
  "create": {
    "button": "Crear Grupo de Amigos",
    "dialog": {
      "title": "Crear Grupo de Amigos",
      "description": "Un grupo de amigos te permite tener un ranking privado. Crea tantos grupos como quieras, tus mismos pronósticos serán usados para calcular tu posición en todos ellos.",
      "nameLabel": "Nombre",
      "validation": {
        "required": "El nombre del grupo es obligatorio"
      }
    }
  },
  "list": {
    "title": "Grupos de Amigos",
    "joinButton": "Unirse"
  }
}
```

**Update `locales/en/groups.json`:**
Add new translation keys using the **"EnOf(spanish text)" wrapper pattern**, maintaining the same structure as Spanish. This pattern will be replaced with actual English translations in Story #161 (LLM-Assisted English Translation):

```json
{
  "title": "EnOf(Grupos de Amigos)",
  "status": {
    "youAreHere": "EnOf(Estás aquí)"
  },
  "actions": {
    "create": "EnOf(Crear Grupo)",
    "delete": "EnOf(Borrar Grupo)",
    "invite": "EnOf(Invitar Amigos)",
    "inviteMore": "EnOf(Invitar mas amigos)",
    "join": "EnOf(Unirse al Grupo)",
    "view": "EnOf(Ver Grupos)"
  },
  "create": {
    "title": "EnOf(Crear Grupo de Amigos)",
    "description": "EnOf(Un grupo de amigos te permite tener un ranking privado. Crea tantos grupos como quieras para jugar con diferentes círculos de amigos.)",
    "nameField": {
      "label": "EnOf(Nombre)",
      "required": "EnOf(El nombre del grupo es obligatorio)"
    },
    "buttons": {
      "cancel": "EnOf(Cancelar)",
      "create": "EnOf(Crear)"
    }
  },
  "delete": {
    "title": "EnOf(Borrar Grupo)",
    "confirmation": "EnOf(¿Estás seguro de que quieres borrar este grupo?)"
  },
  "invite": {
    "title": "EnOf(Invitar amigos a {groupName})",
    "description": "EnOf(Comparte este enlace con tus amigos para que se unan al grupo.)",
    "directShare": "EnOf(O comparte directamente a través de:)",
    "message": "EnOf(¡Hola! Te invito a unirte a nuestro grupo \"{groupName}\" para jugar en al prode en los torneos actuales y futuros. Usa este enlace para unirte: {link})",
    "emailSubject": "EnOf(Invitación al grupo \"{groupName}\" del Prode)",
    "buttons": {
      "email": "EnOf(Email)",
      "whatsapp": "EnOf(WhatsApp)"
    },
    "feedback": {
      "copied": "EnOf(¡Enlace copiado al portapapeles!)",
      "copyError": "EnOf(Error al copiar el enlace)"
    }
  },
  "join": {
    "title": "EnOf(Unirse a un Grupo)",
    "codeField": {
      "label": "EnOf(Código de Grupo)",
      "placeholder": "EnOf(Ingresa el código del grupo)",
      "required": "EnOf(Por favor ingresa un código de grupo)"
    },
    "buttons": {
      "cancel": "EnOf(Cancelar)",
      "join": "EnOf(Unirse al Grupo)"
    }
  },
  "leave": {
    "button": "EnOf(Dejar grupo)",
    "confirmation": {
      "title": "EnOf(¿Estás seguro?)",
      "message": "EnOf(¿Quieres dejar este grupo? Ya no podras competir con tus amigos.)"
    },
    "feedback": {
      "success": "EnOf(Has dejado el grupo exitosamente.)",
      "error": "EnOf(Error al dejar el grupo.)"
    }
  },
  "notifications": {
    "sendButton": "EnOf(Enviar Notificación)",
    "dialog": {
      "title": "EnOf(Enviar Notificación a Participantes)",
      "targetLabel": "EnOf(Destino)",
      "targetOptions": {
        "tournament": "EnOf(Página del torneo)",
        "friendsGroup": "EnOf(Página del grupo de amigos)"
      },
      "titleLabel": "EnOf(Título)",
      "messageLabel": "EnOf(Mensaje)"
    },
    "feedback": {
      "success": "EnOf(Notificación enviada)",
      "error": "EnOf(Error al enviar notificación)"
    }
  },
  "standings": {
    "title": "EnOf(Tabla de Posiciones)",
    "empty": "EnOf(No hay torneos activos disponibles en este momento.)"
  },
  "betting": {
    "statusEnabled": "EnOf(Apuesta habilitada)",
    "statusDisabled": "EnOf(Apuesta deshabilitada)",
    "toggleEnable": "EnOf(Habilitar)",
    "toggleDisable": "EnOf(Deshabilitar)",
    "amountLabel": "EnOf(Monto de la apuesta)",
    "descriptionLabel": "EnOf(Descripción del pago)",
    "paymentStatusLabel": "EnOf(Estado de pago)",
    "tableHeaders": {
      "name": "EnOf(Nombre)",
      "paid": "EnOf(¿Pagó?)",
      "actions": "EnOf(Acciones)"
    },
    "changeButton": "EnOf(Cambiar)",
    "summary": {
      "perPerson": "EnOf(Monto por persona:)",
      "total": "EnOf(Monto acumulado:)",
      "description": "EnOf(Descripción:)",
      "paidList": "EnOf(Pagaron:)"
    },
    "feedback": {
      "configSaved": "EnOf(¡Configuración guardada!)",
      "configError": "EnOf(Error al guardar la configuración)",
      "paymentUpdated": "EnOf(¡Estado de pago actualizado!)",
      "paymentError": "EnOf(Error al actualizar el estado de pago)"
    }
  },
  "joinMessage": {
    "title": "EnOf(Bienvenido!!)",
    "body": "EnOf(Gracias por unirte a este grupo.\nAhora vas a poder competir contra un montón de amigos.)"
  },
  "create": {
    "button": "EnOf(Crear Grupo de Amigos)",
    "dialog": {
      "title": "EnOf(Crear Grupo de Amigos)",
      "description": "EnOf(Un grupo de amigos te permite tener un ranking privado. Crea tantos grupos como quieras, tus mismos pronósticos serán usados para calcular tu posición en todos ellos.)",
      "nameLabel": "EnOf(Nombre)",
      "validation": {
        "required": "EnOf(El nombre del grupo es obligatorio)"
      }
    }
  },
  "list": {
    "title": "EnOf(Grupos de Amigos)",
    "joinButton": "EnOf(Unirse)"
  }
}
```

### 2. Component Updates

Update all 9 components to use `useTranslations()` hook. Pattern to follow:

```typescript
'use client';
import { useTranslations } from 'next-intl';

export default function Component() {
  const t = useTranslations('groups.section');
  const tCommon = useTranslations('common');

  return (
    <>
      <Button>{t('buttonKey')}</Button>
      <Button>{tCommon('buttons.cancel')}</Button>
    </>
  );
}
```

### 3. Component-Specific Changes

#### **invite-friends-dialog.tsx**
- Add `const t = useTranslations('groups.invite')`
- Add `const tCommon = useTranslations('common.buttons')`
- Replace dialog title with `t('title', { groupName })`
- Replace description with `t('description')`
- Replace direct share text with `t('directShare')`
- Replace invitation message template with `t('message', { groupName, link })`
- Replace email subject with `t('emailSubject', { groupName })` (currently hardcoded: "Invitación al grupo...")
- Replace button labels:
  - Copy button: `tCommon('copy')`
  - Email button: `t('buttons.email')`
  - WhatsApp button: `t('buttons.whatsapp')`
  - Close button: `tCommon('close')`
- Replace toast messages:
  - Success: `t('feedback.copied')`
  - Error: `t('feedback.copyError')`

#### **join-group-dialog.tsx** (Already has `useLocale()` for routing)
- Add `const t = useTranslations('groups.join')`
- Add `const tCommon = useTranslations('common.buttons')`
- Keep existing `useLocale()` hook (used for navigation)
- Replace "Unirse a un Grupo" with `t('title')`
- Replace "Código de Grupo" label with `t('codeField.label')`
- Replace placeholder with `t('codeField.placeholder')`
- Replace validation message with `t('codeField.required')`
- Replace button labels:
  - Cancel button: `tCommon('cancel')` (OR use existing `t('buttons.cancel')`)
  - Join button: `t('buttons.join')` (OR use `t('actions.join')` from parent namespace)

#### **leave-group-button.tsx** (Already has `useLocale()`)
- Add `const t = useTranslations('groups.leave')`
- Add `const tCommon = useTranslations('common')`
- Replace button label with `t('button')`
- Replace confirmation dialog title with `t('confirmation.title')`
- Replace confirmation message with `t('confirmation.message')`
- Replace toast messages with `t('feedback.success')` and `t('feedback.error')`
- Replace button labels with `tCommon('buttons.cancel')`, confirm button text

#### **notification-dialog.tsx**
- Add `const t = useTranslations('groups.notifications.dialog')`
- Add `const tCommon = useTranslations('common')`
- Replace dialog title with `t('title')`
- Replace field labels with `t('targetLabel')`, `t('titleLabel')`, `t('messageLabel')`
- Replace dropdown options with `t('targetOptions.tournament')` and `t('targetOptions.friendsGroup')`
- Replace toast messages with `t('../feedback.success')` and `t('../feedback.error')`
- Replace button labels with `tCommon('buttons.cancel')`, `tCommon('buttons.send')`

#### **friends-group-table.tsx**
- Add `const t = useTranslations('groups.standings')`
- Add `const tNotifications = useTranslations('groups.notifications')`
- Replace "Tabla de Posiciones" with `t('title')`
- Replace empty state message with `t('empty')`
- Replace "Enviar Notificación" button with `tNotifications('sendButton')`

#### **group-tournament-betting-admin.tsx**
- Add `const t = useTranslations('groups.betting')`
- Add `const tCommon = useTranslations('common')`
- Replace all status labels, field labels, table headers, and buttons
- Replace toast messages with `t('feedback.*')` keys
- Update summary section to use `t('summary.*')` with proper variable interpolation

#### **friend-groups-join-message.tsx**
- Add `const t = useTranslations('groups.joinMessage')`
- Replace title with `t('title')`
- Replace body text with `t('body')`

#### **tournament-groups-list.tsx**
- Add `const t = useTranslations('groups.create.dialog')`
- Add `const tList = useTranslations('groups.list')`
- Add `const tCommon = useTranslations('common')`
- Replace dialog title with `t('title')`
- Replace description with `t('description')`
- Replace field label with `t('nameLabel')`
- Replace validation message with `t('validation.required')`
- Replace button labels with `tCommon('buttons.cancel')`, `tCommon('buttons.create')`
- Replace "Grupos de Amigos" with `tList('title')`
- Replace "Unirse" button with `tList('joinButton')`

#### **invite-friends-dialog-button.tsx**
- Add `const t = useTranslations('groups.invite')`
- Replace "Invitar mas amigos" with `t('buttonText')`

### 4. Common Namespace Consolidation

**IMPORTANT:** The existing `locales/*/common.json` already has most button labels. We only need to ADD the missing ones.

**Current common.json buttons (both ES and EN):**
- ✅ save, cancel, delete, edit, close, create, confirm (ALREADY EXIST)

**New buttons to ADD:**
- ➕ copy, send, change (NEED TO ADD)

**Update Spanish (`locales/es/common.json`):**
Add only new buttons to existing structure:
```json
{
  "app": { ... },
  "buttons": {
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "close": "Cerrar",
    "create": "Crear",
    "confirm": "Confirmar",
    "copy": "Copiar",        // ← ADD THIS
    "send": "Enviar",        // ← ADD THIS
    "change": "Cambiar"      // ← ADD THIS
  },
  "actions": { ... },
  "home": { ... }
}
```

**Update English (`locales/en/common.json`):**
Keep existing "EnOf(...)" wrappers + add new buttons using same pattern:
```json
{
  "app": {
    "name": "EnOf(Prode Mundial)",
    "description": "EnOf(Plataforma de pronósticos deportivos)",
    "loading": "EnOf(Cargando...)",
    "error": "EnOf(Ocurrió un error)"
  },
  "buttons": {
    "save": "EnOf(Guardar)",
    "cancel": "EnOf(Cancelar)",
    "delete": "EnOf(Eliminar)",
    "edit": "EnOf(Editar)",
    "close": "EnOf(Cerrar)",
    "create": "EnOf(Crear)",
    "confirm": "EnOf(Confirmar)",
    "copy": "EnOf(Copiar)",         // ← ADD THIS
    "send": "EnOf(Enviar)",         // ← ADD THIS
    "change": "EnOf(Cambiar)"       // ← ADD THIS
  },
  "actions": {
    "showMore": "EnOf(mostrar más)",
    "viewAll": "EnOf(Ver todo)",
    "back": "EnOf(Volver)"
  },
  "home": {
    "availableTournaments": "EnOf(Torneos Disponibles)"
  }
}
```

### 5. Variable Interpolation Pattern

For dynamic content, use next-intl's variable substitution:

**Translation file:**
```json
{
  "invite": {
    "dialog": {
      "title": "Invitar amigos a {groupName}"
    }
  }
}
```

**Component usage:**
```typescript
const t = useTranslations('groups.invite.dialog');
<DialogTitle>{t('title', { groupName: group.name })}</DialogTitle>
```

## Visual Changes

### Before (Hardcoded Spanish)
```
┌──────────────────────────────────────┐
│  Invitar amigos a Mi Grupo           │  ← Hardcoded
├──────────────────────────────────────┤
│  Comparte este enlace con tus        │  ← Hardcoded
│  amigos para que se unan al grupo.   │
│                                      │
│  [Copiar] [Email] [WhatsApp]         │  ← Hardcoded
└──────────────────────────────────────┘
```

### After (Bilingual Support)
**Spanish (es):**
```
┌──────────────────────────────────────┐
│  Invitar amigos a Mi Grupo           │  ← t('title', {groupName})
├──────────────────────────────────────┤
│  Comparte este enlace con tus        │  ← t('description')
│  amigos para que se unan al grupo.   │
│                                      │
│  [Copiar] [Email] [WhatsApp]         │  ← t('buttons.*')
└──────────────────────────────────────┘
```

**English (en):**
```
┌──────────────────────────────────────┐
│  Invite friends to My Group          │  ← t('title', {groupName})
├──────────────────────────────────────┤
│  Share this link with your friends   │  ← t('description')
│  to join the group.                  │
│                                      │
│  [Copy] [Email] [WhatsApp]           │  ← t('buttons.*')
└──────────────────────────────────────┘
```

**Key Visual Differences:**
- Layout and styling remain identical
- Only text content changes based on locale
- Icons, spacing, colors unchanged
- All Material-UI components function the same

### Language Switching Behavior
When user changes language via language switcher:
1. All friend groups components re-render with new locale
2. Text updates instantly (no page reload)
3. Dynamic content (group names, user names) stays the same
4. Toast/Snackbar messages appear in selected language

## Files to Create/Modify

### Translation Files (2 files)
- `locales/es/groups.json` - Add new sections (Update)
- `locales/en/groups.json` - Add complete English translations (Update)
- `locales/es/common.json` - Add common button labels (Update)
- `locales/en/common.json` - Add common button labels (Update)

### Components (9 files)
1. `app/components/invite-friends-dialog.tsx` (Update)
2. `app/components/tournament-page/join-group-dialog.tsx` (Update)
3. `app/components/friend-groups/invite-friends-dialog-button.tsx` (Update)
4. `app/components/friend-groups/leave-group-button.tsx` (Update)
5. `app/components/friend-groups/notification-dialog.tsx` (Update)
6. `app/components/friend-groups/friends-group-table.tsx` (Update)
7. `app/components/friend-groups/group-tournament-betting-admin.tsx` (Update)
8. `app/components/friend-groups/friend-groups-join-message.tsx` (Update)
9. `app/components/tournament-page/tournament-groups-list.tsx` (Update)

**Total: 13 files to modify**

## Implementation Steps

### Step 1: Update Translation Files
1. Update `locales/es/groups.json` with all new sections
2. Create complete `locales/en/groups.json` with English translations
3. Update `locales/es/common.json` with shared button labels
4. Update `locales/en/common.json` with shared button labels

### Step 2: Update Core Dialog Components
5. Update `invite-friends-dialog.tsx` - Add `useTranslations()`, replace all hardcoded strings
6. Update `join-group-dialog.tsx` - Add `useTranslations()`, replace all hardcoded strings
7. Update `leave-group-button.tsx` - Add `useTranslations()`, replace all hardcoded strings
8. Update `notification-dialog.tsx` - Add `useTranslations()`, replace all hardcoded strings

### Step 3: Update Supporting Components
9. Update `friends-group-table.tsx` - Add `useTranslations()`, replace all hardcoded strings
10. Update `group-tournament-betting-admin.tsx` - Add `useTranslations()`, replace all hardcoded strings
11. Update `friend-groups-join-message.tsx` - Add `useTranslations()`, replace all hardcoded strings
12. Update `tournament-groups-list.tsx` - Add `useTranslations()`, replace all hardcoded strings
13. Update `invite-friends-dialog-button.tsx` - Add `useTranslations()`, replace all hardcoded strings

## Testing Strategy

### Unit Tests
Create comprehensive unit tests for all 9 components:

**Test file naming:**
- `__tests__/components/invite-friends-dialog.test.tsx`
- `__tests__/components/friend-groups/leave-group-button.test.tsx`
- etc.

**Test coverage requirements:**
- Render with Spanish locale - verify Spanish text appears
- Render with English locale - verify English text appears
- Dynamic content (groupName, links) - verify variable interpolation
- Button clicks - verify functionality unchanged
- Toast messages - verify correct locale used
- Form validation - verify translated error messages

**Use existing test utilities:**
```typescript
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import { NextIntlClientProvider } from 'next-intl';

const messages = {
  groups: {
    invite: {
      buttonText: 'Invite more friends'
    }
  }
};

test('renders invite button in English', () => {
  const { getByText } = renderWithProviders(
    <NextIntlClientProvider locale="en" messages={messages}>
      <InviteFriendsDialogButton />
    </NextIntlClientProvider>
  );
  expect(getByText('Invite more friends')).toBeInTheDocument();
});
```

**Testing Server Actions:**
Components like `leave-group-button.tsx`, `notification-dialog.tsx`, and `group-tournament-betting-admin.tsx` call server actions. Mock them appropriately:

```typescript
import { leaveGroupAction } from '@/app/actions/friend-groups/leave-group-action';

// Mock server action
vi.mock('@/app/actions/friend-groups/leave-group-action', () => ({
  leaveGroupAction: vi.fn()
}));

test('leave group button shows success message in English', async () => {
  const mockLeaveGroup = vi.mocked(leaveGroupAction);
  mockLeaveGroup.mockResolvedValue({ success: true });

  const messages = {
    groups: {
      leave: {
        button: 'Leave group',
        feedback: {
          success: 'You have successfully left the group.'
        }
      }
    }
  };

  const { getByText, findByText } = renderWithProviders(
    <NextIntlClientProvider locale="en" messages={messages}>
      <LeaveGroupButton groupId="123" />
    </NextIntlClientProvider>
  );

  const button = getByText('Leave group');
  await userEvent.click(button);

  // Verify success message appears in English
  expect(await findByText('You have successfully left the group.')).toBeInTheDocument();
});
```

**Edge Cases to Test:**
- Long group names (>50 characters) - verify layout doesn't break
- Special characters in group names (quotes, emojis, accents)
- Dynamic content with variables (groupName, link interpolation)
- Toast messages appear in correct language
- Form validation messages in both locales

**Target coverage:** 80% on all modified components

### Manual Testing Checklist
1. **Language Switching:**
   - [ ] Switch language to English - all friend groups text updates
   - [ ] Switch back to Spanish - all text reverts
   - [ ] Open dialogs in both languages - correct translations appear

2. **Dynamic Content:**
   - [ ] Invite dialog shows correct group name in both languages
   - [ ] Invitation message template includes correct link
   - [ ] Leave confirmation shows correct group context

3. **Form Validation:**
   - [ ] Join group dialog validation messages in both languages
   - [ ] Create group dialog validation messages in both languages

4. **Toast Messages:**
   - [ ] Success messages appear in correct language
   - [ ] Error messages appear in correct language
   - [ ] Copy link feedback in both languages

5. **Common Buttons:**
   - [ ] Cancel, Close, Create, Copy buttons use common namespace
   - [ ] All buttons translate correctly

6. **Edge Cases:**
   - [ ] Long group names don't break layout
   - [ ] Special characters in group names display correctly
   - [ ] Empty states show correct translations

## Validation Considerations

### SonarCloud Requirements
- **Coverage:** 80% on all modified components (create comprehensive unit tests)
- **Duplicated code:** Extract common translation patterns to avoid duplication
- **Complexity:** Keep component logic simple - only text replacement
- **Security:** No XSS risks (next-intl handles escaping)

### Quality Gates
- All 9 components pass unit tests in both locales
- No hardcoded strings detected by grep search
- Build completes without TypeScript errors
- Lint passes with no new warnings
- Manual language switching works smoothly

## Open Questions

None - all concerns from plan review have been addressed:
- ✅ Aligned plan with existing `groups.json` structure (extending, not replacing)
- ✅ Maintaining "EnOf(...)" wrapper pattern for English locale keys (actual translations in Story #161)
- ✅ Clarified common namespace usage (only adding new buttons)
- ✅ Enhanced testing strategy with server action mocking examples
- ✅ Added email subject line translation (was hardcoded)
- ✅ Added edge case testing (long names, special characters)

## Dependencies

- ✅ Story #150 - Translation infrastructure and namespace design (COMPLETED)
- ✅ Story #153 - Onboarding flow i18n (COMPLETED - provides working pattern)
- ✅ Story #154 - Game predictions i18n (COMPLETED - provides working pattern)
- ✅ `next-intl` v4.8.3 - Already installed and configured

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Long translations break UI layout | Medium | Test with longest English translations, adjust spacing if needed |
| Dynamic content interpolation fails | High | Comprehensive unit tests for all variable substitutions |
| Common namespace conflicts | Low | Review existing common.json before adding new keys |
| Missing translation keys | Medium | TypeScript will catch missing keys at compile time |

## Success Metrics

- ✅ 0 hardcoded Spanish strings in friend groups components
- ✅ 68+ translation keys added across ES and EN locales
- ✅ 9 components fully internationalized
- ✅ 80%+ test coverage on modified files
- ✅ Language switcher works seamlessly for all social features
- ✅ 0 new SonarCloud issues

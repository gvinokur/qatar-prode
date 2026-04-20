# Story #347: Align Email Branding with Prode Mundial

## Story Context

**GitHub Issue:** #347  
**Title:** [Story] Align email branding with Prode Mundial  
**Project:** UX Audit 2026 (Status: Todo)

## Problem / Background

The app has been rebranded to "Prode Mundial", but automated emails (OTP, invitations, notifications, password reset) still reference the old names: "La Maquina Prode", "La Maquina Prode Mundial", and "La Maquina World Cup Predictions". Users may not recognize the sender, leading to confusion or emails being marked as spam.

## Objectives

- Replace all old brand names in email translation files (both EN and ES)
- Update the hardcoded fallback sender name in `app/utils/email.ts`
- Update test mocks and assertions to match new branding

## Acceptance Criteria

- [ ] `locales/en/emails.json`: `senderName` → `"Prode Mundial"`; all subject lines, signatures, body text updated
- [ ] `locales/es/emails.json`: `senderName` → `"Prode Mundial"`; all subject lines, signatures, body text updated
- [ ] `app/utils/email.ts`: hardcoded fallback → `"Prode Mundial"`
- [ ] `__tests__/utils/email.test.ts`: mock translations and expected `from` strings updated
- [ ] `__tests__/utils/email-templates.test.ts`: mock translation strings updated
- [ ] OTP email shows "Prode Mundial" as sender name and in body
- [ ] Group invitation email shows "Prode Mundial" in signature

## Out of Scope

- `public/privacy.html` (legal document, separate concern)
- `docs/translation-glossary.md` (documentation, separate concern)
- Email HTML/CSS layout redesign
- Changing `noreply@prodemundial.app` email address

## Technical Approach

Pure text replacement across 5 files. No new functions, no DB changes, no UI changes.

## Files to Modify

| File | What Changes |
|------|-------------|
| `locales/en/emails.json` | Replace "La Maquina Prode" / "La Maquina World Cup Predictions" with "Prode Mundial" / "Prode Mundial Team" |
| `locales/es/emails.json` | Replace "La Maquina Prode" / "La Maquina Prode Mundial" with "Prode Mundial" / "equipo de Prode Mundial" |
| `app/utils/email.ts` | Line 47: fallback `"La Maquina Prode Mundial"` → `"Prode Mundial"` |
| `__tests__/utils/email.test.ts` | Update mock `senderName` values and expected `from` strings |
| `__tests__/utils/email-templates.test.ts` | Update mock translation strings for subjects/signatures |

## Detailed Changes

### `locales/en/emails.json`

Current → New:
```
"senderName": "La Maquina World Cup Predictions"  →  "Prode Mundial"
"verification.subject": "Account Verification - La Maquina Prode"  →  "Account Verification - Prode Mundial"
"verification.signature": "The La Maquina Prode Team"  →  "The Prode Mundial Team"
"passwordReset.subject": "Password Recovery - La Maquina Prode"  →  "Password Recovery - Prode Mundial"
"passwordReset.signature": "The La Maquina Prode Team"  →  "The Prode Mundial Team"
"otp.subject": "Your Access Code - La Maquina Prode"  →  "Your Access Code - Prode Mundial"
"otp.greeting": "...sign in to La Maquina Prode."  →  "...sign in to Prode Mundial."
"otp.securityTips.tip2": "La Maquina Prode will never ask..."  →  "Prode Mundial will never ask..."
"groupInvitation.signature": "The La Maquina Prode Team"  →  "The Prode Mundial Team"
"joinRequest.adminNotification.signature": "The La Maquina Prode Team"  →  "The Prode Mundial Team"
"joinRequest.userApproved.signature": "The La Maquina Prode Team"  →  "The Prode Mundial Team"
```

### `locales/es/emails.json`

Current → New:
```
"senderName": "La Maquina Prode Mundial"  →  "Prode Mundial"
"verification.subject": "Verificación de Cuenta - La Maquina Prode"  →  "Verificación de Cuenta - Prode Mundial"
"verification.signature": "El equipo de La Maquina Prode"  →  "El equipo de Prode Mundial"
"passwordReset.subject": "Recuperación de contraseña - La Maquina Prode"  →  "Recuperación de contraseña - Prode Mundial"
"passwordReset.signature": "El equipo de La Maquina Prode"  →  "El equipo de Prode Mundial"
"otp.subject": "Tu código de acceso - La Maquina Prode"  →  "Tu código de acceso - Prode Mundial"
"otp.greeting": "...iniciar sesión en La Maquina Prode."  →  "...iniciar sesión en Prode Mundial."
"otp.securityTips.tip2": "La Maquina Prode nunca te pedirá..."  →  "Prode Mundial nunca te pedirá..."
"groupInvitation.signature": "El equipo de La Maquina Prode"  →  "El equipo de Prode Mundial"
"joinRequest.adminNotification.signature": "El equipo de La Maquina Prode"  →  "El equipo de Prode Mundial"
"joinRequest.userApproved.signature": "El equipo de La Maquina Prode"  →  "El equipo de Prode Mundial"
```

### `app/utils/email.ts` (line 47)

```ts
// Before:
from = `"La Maquina Prode Mundial" <${emailAddress}>`;
// After:
from = `"Prode Mundial" <${emailAddress}>`;
```

### `__tests__/utils/email.test.ts`

Mock translations block (lines 17–22):
```ts
// Before:
en: { senderName: 'La Maquina World Cup Predictions' },
es: { senderName: 'La Maquina Prode Mundial' },
// After:
en: { senderName: 'Prode Mundial' },
es: { senderName: 'Prode Mundial' },
```

`from` string assertions (5 occurrences):
- `'"La Maquina Prode Mundial" <noreply@example.com>'` → `'"Prode Mundial" <noreply@example.com>'`
- `'"La Maquina World Cup Predictions" <noreply@example.com>'` → `'"Prode Mundial" <noreply@example.com>'`

### `__tests__/utils/email-templates.test.ts`

In the `mockTranslations` object, update all occurrences of:
- `'La Maquina Prode'` → `'Prode Mundial'` (in subject lines and signatures)
- `'The La Maquina Prode team'` / `'The La Maquina Prode Team'` → `'The Prode Mundial Team'`
- `'El equipo de La Maquina Prode'` → `'El equipo de Prode Mundial'`

Affected keys: `verification.subject`, `verification.signature`, `passwordReset.subject`, `passwordReset.signature`, `groupInvitation.signature` (both EN and ES).

## Mid-Level Design

No new functions or changed signatures. Pure string replacement.

### Call Graph Changes

No call graph changes.

## Testing Strategy

- Run `npm test -- __tests__/utils/email.test.ts __tests__/utils/email-templates.test.ts` — all existing tests pass after updating mock strings
- Tests already comprehensively cover all email types; updating mock translations ensures they validate the new branding

## Validation Checklist

- [ ] `npm run test` passes (all tests, especially email tests)
- [ ] `npm run lint` passes  
- [ ] `npm run build` passes
- [ ] `grep -r "La Maquina" locales/en/emails.json locales/es/emails.json app/utils/email.ts` returns no results

# Story 459 Plan: Add copy-to-clipboard UX to OTP authentication email

## Context

The OTP email displays a 6-digit code that users must manually select and type into the verification
form. On mobile this is error-prone. This story adds two complementary UX improvements:

1. **"Copy code" link in the email** — opens a minimal page that auto-copies the code to clipboard
   and shows a confirmation. The user can then switch back to the app and paste.
2. **OTP-detection-friendly subject line** — prepending the code to the email subject triggers
   iOS Mail, Gmail (Android), and other clients to surface an "AutoFill" or "Copy code" suggestion.

Existing OTP verify form and flow are **unchanged**.

---

## Acceptance Criteria

- [ ] OTP email shows a "Copy code" button/link below the 6-digit code block
- [ ] Clicking it opens `/<locale>/otp-copy?code=XXXXXX` which auto-copies the code to clipboard
       and shows a brief success confirmation
- [ ] Email subject starts with the OTP code (e.g., `"123456 - Your Access Code - Prode Mundial"`)
       for iOS/Android/Gmail smart-autofill detection
- [ ] Plain-text fallback contains the copy-page URL and a prominently formatted code line
- [ ] The otp-copy page supports English and Spanish
- [ ] Existing OTP verify form and sign-in flow are unchanged

---

## Visual Prototypes

### Email: "Copy code" button (below the code block)

```
┌──────────────────────────────────────────────────────────────┐
│  Your Access Code                                            │
│                                                              │
│  You have requested a code to sign in to Prode Mundial.     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │                     1 2 3 4 5 6                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│              [ Copy code → ]        ← NEW LINK BUTTON        │
│                                                              │
│  ⏱️ Valid for 3 minutes                                      │
│  You have a maximum of 3 attempts to enter this code.        │
│  ...                                                         │
└──────────────────────────────────────────────────────────────┘
```

The "Copy code" is a plain `<a href>` styled as a button (works in all email clients without JS).

### `/<locale>/otp-copy` page — success state

```
┌─────────────────────────────────────┐
│                                     │
│           ✓                         │
│    (CheckCircle, color=success)      │
│                                     │
│  "Code copied to clipboard!"        │
│                                     │
│  ┌─────────────────────────────────┐│
│  │          1 2 3 4 5 6            ││  ← code displayed in case user wants
│  └─────────────────────────────────┘│     to type it manually
│                                     │
│      [ Go to sign in ]              │
│                                     │
└─────────────────────────────────────┘
```

### `/<locale>/otp-copy` page — clipboard blocked state (fallback)

```
┌─────────────────────────────────────┐
│                                     │
│  Your code:                         │
│                                     │
│  ┌─────────────────────────────────┐│
│  │          1 2 3 4 5 6            ││
│  └─────────────────────────────────┘│
│                                     │
│      [ Copy code ]  [ Sign in ]     │
│                                     │
└─────────────────────────────────────┘
```

---

## Technical Approach

### 1. New route: `app/[locale]/otp-copy/page.tsx`

Minimal Server Component. Reads `code` from `searchParams`. If absent, redirects to `/${locale}`.
Passes `code` and `locale` as props to `OtpCopyPage` (Client Component).

Security note: The code is already transmitted in the email body; including it in the URL does not
increase exposure. The 3-minute TTL limits the window of any misuse.

### 2. New client component: `app/components/auth/otp-copy-page.tsx`

Client Component. On mount (`useEffect`), calls `navigator.clipboard.writeText(code)`:
- **Success** → shows CheckCircle + "Copied!" message + code display + "Go to sign in" link
- **Failure** (clipboard blocked) → shows code display + manual "Copy" button + "Go to sign in"

Clipboard API requires a secure context (HTTPS); available in all production environments.

### 3. Modify `generateOTPEmailContent()` in `app/actions/otp-actions.ts`

- Add optional `copyUrl?: string` parameter.
- Subject: prepend the OTP code → `"${otpCode} - ${t('otp.subject')}"`.
  This is the standard pattern iOS Mail and Gmail use for AutoFill suggestion.
- HTML: add `<a href="${copyUrl}">` button below the code block when `copyUrl` is provided.
- Plain text: add the copy URL on its own line; format the code on a line of its own
  (`Your code: ${otpCode}`) for OS-level OTP detection heuristics.

### 4. Modify `sendOTPCode()` in `app/actions/otp-actions.ts`

Build `copyUrl` from `NEXT_PUBLIC_APP_URL` env var and pass to `generateOTPEmailContent()`.
`copyUrl` = `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/otp-copy?code=${otpCode}`

### 5. Translation keys

**`locales/en/emails.json`** (under `otp`):
- `copyCode`: `"Copy code"`

**`locales/es/emails.json`** (under `otp`):
- `copyCode`: `"Copiar código"`

**`locales/en/auth.json`** (new `otpCopy` section):
- `otpCopy.title`: `"Code copied to clipboard!"`
- `otpCopy.fallbackTitle`: `"Your sign-in code"`
- `otpCopy.copyButton`: `"Copy code"`
- `otpCopy.signIn`: `"Go to sign in"`
- `otpCopy.copied`: `"Copied!"`

**`locales/es/auth.json`** (new `otpCopy` section):
- `otpCopy.title`: `"¡Código copiado al portapapeles!"`
- `otpCopy.fallbackTitle`: `"Tu código de acceso"`
- `otpCopy.copyButton`: `"Copiar código"`
- `otpCopy.signIn`: `"Ir a iniciar sesión"`
- `otpCopy.copied`: `"¡Copiado!"`

No changes to `types/i18n.ts` — it uses `typeof` inference from the JSON files directly.

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/[locale]/otp-copy/page.tsx` | New Server Component route |
| `app/components/auth/otp-copy-page.tsx` | New Client Component (clipboard UX) |
| `app/components/auth/__tests__/otp-copy-page.test.tsx` | Unit tests |

## Files to Modify

| File | Change |
|------|--------|
| `app/actions/otp-actions.ts` | `generateOTPEmailContent()` + `sendOTPCode()` |
| `locales/en/emails.json` | Add `otp.copyCode` |
| `locales/es/emails.json` | Add `otp.copyCode` |
| `locales/en/auth.json` | Add `otpCopy.*` section |
| `locales/es/auth.json` | Add `otpCopy.*` section |

## CODE-STRUCTURE Files to Update

| File | What to update |
|------|---------------|
| `docs/code-structure/pages.md` | Add `app/[locale]/otp-copy/page.tsx` entry |
| `docs/code-structure/components/components-auth-onboarding.md` | Add `OtpCopyPage` entry |
| `docs/code-structure/actions.md` | Update `generateOTPEmailContent` signature (add `copyUrl?`) |

---

## Mid-Level Design

### Call Graph Changes

No new cross-layer call relationships. `sendOTPCode` already calls `generateOTPEmailContent`
and `sendEmail`. The new page/component flow is purely client-side (no new Server Actions).

**Modified flows:**
- **Flow: OTP email send** — `sendOTPCode` now builds `copyUrl` and passes it to
  `generateOTPEmailContent`, which embeds it in HTML/text output.

### `app/[locale]/otp-copy/page.tsx` *(new)*

**Default export: `OtpCopyRoute`**
- Props: `{ searchParams: Promise<{ code?: string }> }`
- Reads `code` from `searchParams`; if absent, `redirect('/${locale}')`
- Renders `<OtpCopyPage code={code} locale={locale} />`
- Tests:
  - redirects to home locale path when `code` searchParam is absent
  - redirects to home locale path when `code` is an empty string
  - renders OtpCopyPage with the code value passed from searchParams

### `app/components/auth/otp-copy-page.tsx` *(new)*

**`OtpCopyPage({ code, locale }: { code: string; locale: string })`**: `JSX.Element`
- `'use client'`
- State: `copied: boolean` (false), `error: boolean` (false)
- `useEffect` on mount: calls `navigator.clipboard.writeText(code)`, sets `copied=true` on
  success, `error=true` on failure
- Success render: CheckCircle icon + `t('otpCopy.title')` + code display + sign-in link
- Fallback render: code display + manual Copy button (re-attempts clipboard on click) + sign-in link
- Sign-in link: `/${locale}?openSignin=true`
- Mocking in tests: `navigator.clipboard.writeText` mocked via `Object.defineProperty` on
  `navigator` (standard jsdom pattern); `useTranslations` mocked to return an identity fn
- Tests:
  - renders success state (CheckCircle + title text) after clipboard.writeText resolves
  - renders fallback state (Copy button visible) when clipboard.writeText rejects
  - manual Copy button triggers another clipboard.writeText call and shows Copied label
  - sign-in link href is `/${locale}?openSignin=true` with the correct locale value

### `app/actions/otp-actions.ts` *(modified)*

**`generateOTPEmailContent(email, otpCode, locale, copyUrl?)`**:
`Promise<{ subject: string; html: string; text: string }>` *(was: no copyUrl param)*
- Subject becomes `"${otpCode} - ${t('otp.subject')}"` for OTP-detection heuristics
- HTML includes `<a href="${copyUrl}">` styled button after the code block, when `copyUrl` is defined
- Plain text includes `Your code: ${otpCode}` on own line at top; appends copy URL line when defined
- Calls: `getTranslations`
- Tests:
  - subject starts with the 6-digit OTP code (e.g., `"123456 - ..."`)
  - html contains an `<a href>` copy link when copyUrl is provided
  - html does not contain any copy-link anchor when copyUrl is undefined
  - plain text contains the code on its own line (`"Your code: 123456"`)
  - subject prefix works for Spanish locale (getTranslations with locale='es')

**`sendOTPCode(email, locale)`**: `Promise<{ success, error? }>` *(signature unchanged)*
- Now builds `copyUrl` from `NEXT_PUBLIC_APP_URL` before calling `generateOTPEmailContent`
- Falls back gracefully if `NEXT_PUBLIC_APP_URL` is undefined (passes `undefined` copyUrl → email sent without copy link)
- Tests:
  - sends email with copyUrl when `NEXT_PUBLIC_APP_URL` is defined (copyUrl contains locale and code)
  - sends email without copy link when `NEXT_PUBLIC_APP_URL` env var is undefined (copyUrl passed as `undefined`)
  - existing error handling (sendEmail failure, rate-limiting) is unchanged regardless of copyUrl presence

---

## Testing Strategy

### Unit tests (`otp-copy-page.test.tsx`)

- Mock `navigator.clipboard.writeText` (success and rejection cases)
- Mock `next-intl` `useTranslations`
- Test: success render (CheckCircle, title, code, sign-in link)
- Test: fallback render (code, Copy button, sign-in link)
- Test: Copy button triggers another clipboard.writeText call
- Test: sign-in link contains `openSignin=true` and locale

### Unit tests (`otp-actions.test.ts` — additions to existing test file if it exists)

- Test: `generateOTPEmailContent` subject starts with OTP code
- Test: HTML contains copy-link anchor when copyUrl provided
- Test: HTML omits copy-link anchor when copyUrl is absent
- Test: plain text has code on its own line

### Manual testing

1. Trigger OTP send (sign in with an email)
2. Inspect email: subject starts with the code, "Copy code" button visible
3. Click "Copy code" → browser opens `/en/otp-copy?code=XXXXXX`
4. Verify clipboard has the code (paste into text field)
5. Verify page shows success state / fallback state when clipboard is blocked (incognito or
   non-HTTPS preview URL) — manual Copy button must appear and work
6. Verify same flow in Spanish locale (`/es/otp-copy?code=...`)
7. Verify original OTP verify form still works unchanged
8. Verify email is still sent (with graceful no-copy-link fallback) when `NEXT_PUBLIC_APP_URL` is unset

---

## Open Questions

None — scope is well-defined by the AC.

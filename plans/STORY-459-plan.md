# Story 459 Plan: Add native OTP detection support to authentication email

## Context

The OTP email displays a 6-digit code that users must manually select and type. iOS Mail, Gmail
(Android), and other modern clients can surface an "AutoFill" or suggested-code banner when the
email is structured correctly — but the current template doesn't follow those conventions.

This story updates the OTP email subject and plain-text body to trigger native OS-level OTP
detection, reducing sign-in friction especially on mobile — with zero new pages or UI components.

**Descoped:** The "Copy code" link/page was removed in favour of relying on native platform
detection, which covers the same use case with less complexity.

---

## Acceptance Criteria

- [ ] OTP email subject starts with the 6-digit code (e.g., `"123456 - Your Access Code - Prode Mundial"`) — triggers iOS Mail and Gmail autofill suggestions
- [ ] Plain-text email body has the code on its own prominent line with OTP-detection keywords in proximity, matching the heuristics used by iOS, Android, and Gmail
- [ ] HTML email body is unchanged in appearance (no copy button)
- [ ] Both English and Spanish emails follow the updated format
- [ ] Existing OTP verify form and sign-in flow are unchanged

---

## Technical Approach

### Changes to `generateOTPEmailContent()` in `app/actions/otp-actions.ts`

**Subject line** — prepend the OTP code:
```
"${otpCode} - ${t('otp.subject')}"
```
Result: `"123456 - Your Access Code - Prode Mundial"` (EN) / `"123456 - Tu código de acceso - Prode Mundial"` (ES)

This is the standard pattern that triggers:
- **iOS Mail** AutoFill suggestion ("Use code 123456")
- **Gmail on Android** smart code detection
- **Samsung Mail** and other clients using similar heuristics

**Plain-text body** — add a prominent code line at the top of the text version:
```
Your code: ${otpCode}

${t('otp.greeting')}
...
```
iOS and Android scan plain-text for `code: XXXXXX` or `passcode: XXXXXX` patterns on their own
line. The existing HTML version already displays the code prominently; the plain-text version
currently buries it mid-sentence (`${t('otp.title')}: ${otpCode}`), which is less detectable.

**HTML body** — no visual changes. The code block already renders clearly; no new elements needed.

### Translation changes

**`locales/en/emails.json`** — no key changes; subject is assembled in code as `"${otpCode} - ${t('otp.subject')}"`.

**`locales/es/emails.json`** — same; no key changes needed.

The existing `otp.subject` values (`"Your Access Code - Prode Mundial"` / `"Tu código de acceso - Prode Mundial"`) remain as the suffix; the code is prepended dynamically in `generateOTPEmailContent()`.

---

## Files to Modify

| File | Change |
|------|--------|
| `app/actions/otp-actions.ts` | Update `generateOTPEmailContent()`: subject prefix + plain-text code line |

## Files to Create

None.

## CODE-STRUCTURE Files to Update

| File | What to update |
|------|---------------|
| `docs/code-structure/actions.md` | Update `generateOTPEmailContent` — note subject now prefixed with OTP code |

---

## Mid-Level Design

### Call Graph Changes

No call graph changes.

### `app/actions/otp-actions.ts` *(modified)*

**`generateOTPEmailContent(email, otpCode, locale)`**:
`Promise<{ subject: string; html: string; text: string }>` *(signature unchanged)*
- Subject becomes `"${otpCode} - ${t('otp.subject')}"` for native OTP-detection heuristics
- Plain text opens with `"Your code: ${otpCode}\n\n"` (or locale equivalent) before the greeting
- HTML is unchanged
- Calls: `getTranslations`
- Tests:
  - subject starts with the 6-digit OTP code followed by ` - `
  - subject ends with the existing translated suffix (EN and ES)
  - plain text contains `"Your code: ${otpCode}"` on its own line before the greeting
  - html output is unchanged (does not contain any new elements)

---

## Testing Strategy

### Unit tests (additions to existing `otp-actions` test file if it exists, or new file)

- `generateOTPEmailContent` subject starts with OTP code + separator
- `generateOTPEmailContent` subject suffix matches existing translation key value
- Plain-text body opens with `code: <otpCode>` line
- HTML body does not contain new markup

### Manual testing

1. Trigger OTP send (sign in with an email on a real device or email client)
2. iOS Mail: verify AutoFill banner / "Use Code" suggestion appears
3. Gmail (Android): verify code is surfaced as a suggestion
4. Verify subject shows `"123456 - Your Access Code - Prode Mundial"`
5. Verify email renders correctly (no visual regression) in both EN and ES
6. Verify existing OTP verify form still works unchanged

---

## Open Questions

None.

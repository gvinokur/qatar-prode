# Implementation Plan: Localized Email Sender Name (#229)

## Context

Currently, emails sent by the application appear in users' inboxes with "noreply@example.com" as the sender, showing just the email address without a friendly display name. This doesn't reflect the app's branding and creates a poor user experience.

This feature will add localized sender display names based on the user's locale:
- **Spanish (es)**: "La Maquina" Prode Mundial
- **English (en)**: "La Maquina" World Cup Predictions

The email address will remain the same (`process.env.EMAIL_FROM`), only the display name will change.

## Story Details

**Issue**: #229 - [Feature] Localized Email Sender Name
**Type**: Enhancement
**Worktree**: `/Users/gvinokur/Personal/qatar-prode-story-229`
**Branch**: `feature/story-229`

## Acceptance Criteria

- [ ] Email sender name displays correctly based on user locale
- [ ] Spanish users see: "La Maquina" Prode Mundial <email@example.com>
- [ ] English users see: "La Maquina" World Cup Predictions <email@example.com>
- [ ] Email address remains unchanged (from `process.env.EMAIL_FROM`)
- [ ] Works for all email types (verification, password reset, OTP)
- [ ] No breaking changes to existing email functionality
- [ ] All existing tests pass
- [ ] New tests added for localized sender names

## Current Implementation Analysis

### Email Sending Architecture

1. **Email utility** (`app/utils/email.ts`):
   - `sendEmail()` function uses Nodemailer
   - Currently sets `from: process.env.EMAIL_FROM` (plain email address)
   - No locale awareness

2. **Email templates** (`app/utils/email-templates.ts`):
   - `generateVerificationEmail()` - Account verification emails
   - `generatePasswordResetEmail()` - Password reset emails
   - Both accept `locale` parameter and use `next-intl` for content
   - Return `{to, subject, html}` object

3. **Server actions** (where emails are triggered):
   - `app/actions/user-actions.ts`: `signupUser()`, `resendVerificationEmail()`, `sendPasswordResetEmail()`
   - `app/actions/otp-actions.ts`: `sendOTPCode()`
   - All accept `locale` parameter (defaulting to 'es')
   - Call `sendEmail()` with email data

4. **Translation files**:
   - `locales/en/emails.json` - English email content
   - `locales/es/emails.json` - Spanish email content
   - Both have structured translations for email subjects, content, signatures

### Flow Diagram

```
Server Action (locale available)
    ↓
Email Template Generator (receives locale, generates content)
    ↓
sendEmail({to, subject, html}) ← NO LOCALE HERE
    ↓
Nodemailer (from: process.env.EMAIL_FROM) ← NEEDS LOCALE
```

## Technical Approach

### Solution Overview

Modify the email sending flow to include locale information and format the `from` field with a localized display name. The format will be: `"Display Name" <email@address.com>`.

### Implementation Steps

#### 1. Add Sender Name Translations

**File**: `locales/en/emails.json`

Add new top-level key:
```json
{
  "senderName": "\"La Maquina\" World Cup Predictions",
  "verification": { ... },
  "passwordReset": { ... },
  "otp": { ... }
}
```

**File**: `locales/es/emails.json`

Add new top-level key:
```json
{
  "senderName": "\"La Maquina\" Prode Mundial",
  "verification": { ... },
  "passwordReset": { ... },
  "otp": { ... }
}
```

**Note on escaping**: The double quotes around "La Maquina" are escaped in JSON (`\"`) but `next-intl`'s `getTranslations()` automatically unescapes them, returning the string with actual quotes. This is consistent with how other translations with special characters are handled in the existing `locales/*/emails.json` files (verified by examining existing patterns like escaped quotes in email subjects).

#### 2. Modify `sendEmail()` Function

**File**: `app/utils/email.ts`

**Changes**:
1. Import i18n utilities:
   ```typescript
   import { getTranslations } from 'next-intl/server';
   import type { Locale } from '@/i18n.config';
   ```

2. Update `EmailOptions` interface to include locale:
   ```typescript
   interface EmailOptions {
     to: string;
     subject: string;
     html: string;
     locale?: Locale; // Optional, defaults to 'es'
   }
   ```

3. Update `sendEmail()` function signature:
   ```typescript
   export async function sendEmail({
     to,
     subject,
     html,
     locale = 'es' as Locale
   }: EmailOptions)
   ```

4. Validate locale and generate localized sender name:
   ```typescript
   // Validate locale (fallback to 'es' if invalid)
   const validLocale: Locale = (locale === 'en' || locale === 'es') ? locale : 'es';

   // Get localized sender name with error handling
   try {
     const t = await getTranslations({ locale: validLocale, namespace: 'emails' });
     const senderName = t('senderName');
     const emailAddress = process.env.EMAIL_FROM;
     const from = `${senderName} <${emailAddress}>`;
   } catch (error) {
     // Fallback to hardcoded default if translations fail
     console.error('Failed to get email sender translation:', error);
     const from = `"La Maquina" Prode Mundial <${process.env.EMAIL_FROM}>`;
   }
   ```

5. Use the formatted `from` field in mailOptions:
   ```typescript
   const mailOptions = {
     from, // Now includes display name
     to,
     subject,
     html,
   };
   ```

**Complete modified function**:
```typescript
export async function sendEmail({
  to,
  subject,
  html,
  locale = 'es' as Locale
}: EmailOptions) {
  try {
    // Validate locale (fallback to 'es' if invalid)
    const validLocale: Locale = (locale === 'en' || locale === 'es') ? locale : 'es';

    // Get localized sender name with error handling
    let from: string;
    try {
      const t = await getTranslations({ locale: validLocale, namespace: 'emails' });
      const senderName = t('senderName');
      const emailAddress = process.env.EMAIL_FROM;
      from = `${senderName} <${emailAddress}>`;
    } catch (translationError) {
      // Fallback to hardcoded default if translations fail
      console.error('Failed to get email sender translation:', translationError);
      from = `"La Maquina" Prode Mundial <${process.env.EMAIL_FROM}>`;
    }

    const emailProvider = process.env.EMAIL_PROVIDER || 'gmail';

    if (emailProvider === 'gmail') {
      const transporter = createGmailClient();

      const mailOptions = {
        from,
        to,
        subject,
        html,
      };

      const info = await transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };
    } else {
      return { success: false, messageId: "Don't have any other provider configured" };
    }
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
}
```

#### 3. Update Email Template Functions

**File**: `app/utils/email-templates.ts`

Modify all template functions to return locale along with email data:

**`generateVerificationEmail()`**:
```typescript
export async function generateVerificationEmail(
  email: string,
  verificationLink: string,
  locale: Locale = 'es'
) {
  const t = await getTranslations({ locale, namespace: 'emails' });

  const subject = t('verification.subject');
  const html = `...`; // existing content

  return { to: email, subject, html, locale }; // Add locale
}
```

**`generatePasswordResetEmail()`**:
```typescript
export async function generatePasswordResetEmail(
  email: string,
  resetLink: string,
  locale: Locale = 'es'
) {
  const t = await getTranslations({ locale, namespace: 'emails' });

  const subject = t('passwordReset.subject');
  const html = `...`; // existing content

  return { to: email, subject, html, locale }; // Add locale
}
```

#### 4. Update OTP Email Generation

**File**: `app/actions/otp-actions.ts`

The `generateOTPEmailContent()` function is local to this file and returns `{subject, html, text}`. The `sendOTPCode()` function calls `sendEmail()` with constructed email data.

**Modify `sendOTPCode()` function** (around line 122):
```typescript
// Generate email content
const emailContent = await generateOTPEmailContent(trimmedEmail, otpCode, locale);

// Send email with locale
await sendEmail({
  to: trimmedEmail,
  subject: emailContent.subject,
  html: emailContent.html,
  locale, // Add locale parameter
});
```

#### 5. Update Caller Sites (if needed)

Check all places where `sendEmail()` is called:

**File**: `app/actions/user-actions.ts`

The `sendVerificationEmail()` helper (line 262) and `sendPasswordResetEmail()` already have `locale` available and pass email data from template functions. Since we're modifying template functions to return `locale`, these should work automatically:

```typescript
// sendVerificationEmail() - line 262
const emailData = await generateVerificationEmail(user.email, verificationLink, locale);
const result = await sendEmail(emailData); // emailData now includes locale

// sendPasswordResetEmail() - similar pattern
const emailData = await generatePasswordResetEmail(user.email, resetLink, locale);
const result = await sendEmail(emailData); // emailData now includes locale
```

No changes needed here since template functions now return locale.

## Testing Strategy

### Test Infrastructure Analysis

**Existing mock setup** (verified in `__tests__/utils/email.test.ts`):
- Nodemailer is mocked with `vi.mock('nodemailer')`
- `globalThis.mockSendMail` is available for verification
- Mock setup: `mockCreateTransport → { sendMail: mockSendMail }`
- Pattern to use: `expect(globalThis.mockSendMail).toHaveBeenCalledWith(...)`

**Existing action test patterns** (verified in `__tests__/actions/user-actions.test.ts`):
- `sendEmail` is mocked: `vi.mock('../../app/utils/email', () => ({ sendEmail: vi.fn() }))`
- Template functions are mocked: `vi.mock('../../app/utils/email-templates', ...)`
- Mocks return `{to, subject, html}` currently - **will need to add `locale`**

### Unit Tests

#### 1. Email Utility Tests (`__tests__/utils/email.test.ts`)

**New test cases**:
```typescript
describe('sendEmail with localized sender names', () => {
  it('should use Spanish sender name for Spanish locale', async () => {
    process.env.EMAIL_FROM = 'noreply@example.com';

    await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      locale: 'es'
    });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"La Maquina" Prode Mundial <noreply@example.com>'
      })
    );
  });

  it('should use English sender name for English locale', async () => {
    process.env.EMAIL_FROM = 'noreply@example.com';

    await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      locale: 'en'
    });

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"La Maquina" World Cup Predictions <noreply@example.com>'
      })
    );
  });

  it('should default to Spanish locale when locale not provided', async () => {
    process.env.EMAIL_FROM = 'noreply@example.com';

    await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>'
    });

    expect(globalThis.mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"La Maquina" Prode Mundial <noreply@example.com>'
      })
    );
  });

  it('should fallback to Spanish for invalid locale', async () => {
    process.env.EMAIL_FROM = 'noreply@example.com';

    await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      locale: 'fr' as any  // Invalid locale
    });

    expect(globalThis.mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"La Maquina" Prode Mundial <noreply@example.com>'
      })
    );
  });

  it('should use hardcoded fallback if translation fails', async () => {
    process.env.EMAIL_FROM = 'noreply@example.com';

    // Mock getTranslations to throw error
    vi.mock('next-intl/server', () => ({
      getTranslations: vi.fn().mockRejectedValue(new Error('Translation error'))
    }));

    await sendEmail({
      to: 'user@example.com',
      subject: 'Test',
      html: '<p>Test</p>',
      locale: 'en'
    });

    expect(globalThis.mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: '"La Maquina" Prode Mundial <noreply@example.com>'  // Hardcoded fallback
      })
    );
  });
});
```

**Note**: Using `globalThis.mockSendMail` as verified in existing test setup.

#### 2. Email Template Tests (`__tests__/utils/email-templates.test.ts`)

**Update existing tests** to verify locale is included in returned data:
```typescript
it('should include locale in verification email data', async () => {
  const result = await generateVerificationEmail(
    'test@example.com',
    'https://example.com/verify',
    'en'
  );

  expect(result).toHaveProperty('locale', 'en');
});

it('should include locale in password reset email data', async () => {
  const result = await generatePasswordResetEmail(
    'test@example.com',
    'https://example.com/reset',
    'es'
  );

  expect(result).toHaveProperty('locale', 'es');
});
```

#### 3. User Actions Tests (`__tests__/actions/user-actions.test.ts`)

**Current pattern** (verified):
```typescript
vi.mock('../../app/utils/email-templates', () => ({
  generateVerificationEmail: vi.fn(),
  generatePasswordResetEmail: vi.fn(),
}));

vi.mock('../../app/utils/email', () => ({
  sendEmail: vi.fn(),
}));
```

**Update mock return values** to include `locale`:
```typescript
vi.mocked(emailTemplates.generateVerificationEmail).mockResolvedValue({
  to: 'new@example.com',
  subject: 'Verificación de Cuenta',
  html: '<div>Verify email</div>',
  locale: 'es'  // ADD THIS
});
```

**Verify sendEmail receives locale**:
```typescript
expect(email.sendEmail).toHaveBeenCalledWith(
  expect.objectContaining({
    locale: 'es'
  })
);
```

#### 4. OTP Actions Tests (`__tests__/actions/otp-actions.test.ts`)

**Similar pattern** - update existing mocks:
- Add `locale` parameter to `sendEmail` call verification
- Test both English and Spanish locales
- Verify correct locale is passed based on function parameter

### Integration Testing

Manual testing checklist:
1. Sign up with Spanish locale → Verify email shows "La Maquina" Prode Mundial
2. Sign up with English locale → Verify email shows "La Maquina" World Cup Predictions
3. Request password reset (Spanish) → Verify sender name
4. Request password reset (English) → Verify sender name
5. Request OTP code (Spanish) → Verify sender name
6. Request OTP code (English) → Verify sender name
7. Resend verification email → Verify sender name matches user's locale

## Files to Create/Modify

### Files to Modify

1. **`app/utils/email.ts`** (8 lines modified, 3 lines added)
   - Import i18n utilities
   - Update `EmailOptions` interface
   - Update `sendEmail()` function signature
   - Generate localized sender name
   - Format `from` field

2. **`app/utils/email-templates.ts`** (2 lines modified)
   - Update `generateVerificationEmail()` return value
   - Update `generatePasswordResetEmail()` return value

3. **`app/actions/otp-actions.ts`** (1 line modified)
   - Add locale parameter to `sendEmail()` call in `sendOTPCode()`

4. **`locales/en/emails.json`** (1 line added)
   - Add `senderName` translation

5. **`locales/es/emails.json`** (1 line added)
   - Add `senderName` translation

6. **`__tests__/utils/email.test.ts`** (40-50 lines added)
   - Add new test suite for localized sender names
   - Test Spanish locale
   - Test English locale
   - Test default locale

7. **`__tests__/utils/email-templates.test.ts`** (10-15 lines added)
   - Update tests to verify locale in return values

8. **`__tests__/actions/user-actions.test.ts`** (20-30 lines modified)
   - Update mocks to expect locale parameter
   - Verify sender name format

9. **`__tests__/actions/otp-actions.test.ts`** (10-15 lines modified)
   - Update mocks to expect locale parameter

### No New Files

All changes are modifications to existing files.

## Validation & Quality Gates

### Pre-Commit Checks (MANDATORY)

1. **Run all tests**: `npm test`
   - All existing tests must pass
   - New tests for localized sender names must pass
   - Target: 80%+ coverage on new code

2. **Lint check**: `npm run lint`
   - No ESLint errors
   - No unused imports

3. **Build check**: `npm run build`
   - Production build must succeed
   - No TypeScript errors

### SonarCloud Requirements

- **Coverage**: ≥80% on new/modified code
- **Quality Gate**: 0 new issues (any severity)
- **Security**: No new security vulnerabilities
- **Code Smells**: Keep at minimum

### Manual Verification

Before marking PR as ready for review:
1. Test signup flow with both locales in Vercel Preview
2. Test password reset with both locales
3. Test OTP flow with both locales
4. Verify email headers in actual email client
5. Check spam folder behavior (display name shouldn't trigger spam)

## Risks & Considerations

### Technical Risks

1. **Email client compatibility**: Some email clients may handle display names differently
   - **Mitigation**: Use standard RFC 5322 format `"Display Name" <email@address.com>`

2. **Special characters in display name**: "La Maquina" contains quotes and non-ASCII characters
   - **Mitigation**: Properly escape quotes in translation strings

3. **Spam filter impact**: Changing sender display name might affect spam scores
   - **Mitigation**: Use consistent, professional display names; test with major providers

### Implementation Risks

1. **Breaking existing tests**: Many tests mock `sendEmail()`
   - **Mitigation**: Update tests incrementally, ensure backward compatibility with default locale
   - **Status**: Verified test patterns - mocks are simple to update

2. **Missing locale parameter**: If caller doesn't provide locale, default to Spanish
   - **Mitigation**: Make locale optional with 'es' default
   - **Additional safety**: Add runtime validation to ensure locale is 'en' or 'es', fallback to 'es' if invalid

3. **Translation retrieval failure**: If `getTranslations()` throws error
   - **Mitigation**: Wrap translation retrieval in try-catch, fallback to hardcoded Spanish sender name
   - **Ensures**: Emails still send even if i18n infrastructure has issues

## Open Questions

None. All requirements are clear from the issue description and codebase exploration.

## Dependencies

- No external dependencies needed
- Uses existing `next-intl` infrastructure
- Uses existing Nodemailer configuration

## Estimated Effort

**Small (S)** - 2-3 hours
- Simple, well-scoped change
- Minimal files affected
- Straightforward testing
- No new dependencies

## Implementation Order

1. Add translations (Spanish, English)
2. Modify `sendEmail()` function
3. Update email template functions
4. Update OTP action
5. Write/update unit tests
6. Run validation checks
7. Manual testing in Vercel Preview

## Success Metrics

- All existing tests pass
- New tests pass with 80%+ coverage
- No SonarCloud issues
- Manual verification in email clients shows correct display names for both locales
- No increase in spam rate or delivery failures

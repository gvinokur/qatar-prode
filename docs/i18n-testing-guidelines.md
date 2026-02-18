# i18n Testing Guidelines

## Overview

This document captures critical learnings from implementing i18n tests for authentication components (story #152). These patterns MUST be followed for all future i18n component tests.

## Critical Patterns

### 1. Mock Setup (MANDATORY)

**Every i18n test file must include this exact setup:**

```typescript
// 1. Import required utilities
import { createMockTranslations } from '../../utils/mock-translations';
import * as intl from 'next-intl';

// 2. Mock next-intl module  
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => 'es'),
}));

// 3. Setup mock in beforeEach
beforeEach(() => {
  vi.clearAllMocks();
  
  // Setup i18n mocks
  vi.mocked(intl.useTranslations).mockReturnValue(
    createMockTranslations('auth')  // Use appropriate namespace
  );
});
```

**❌ WRONG - Inline custom mocks:**
```typescript
// DO NOT DO THIS
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations = { 'login.email': 'Email' };
    return translations[key] || key;
  }
}));
```

### 2. Input Field Queries

**❌ WRONG:**
```typescript
screen.getByLabelText('[login.email.label]')  // Doesn't work!
screen.getByLabelText(/email/i)                // Doesn't work with mocks!
```

**✅ CORRECT:**
```typescript
screen.getByRole('textbox', { name: '[login.email.label]' })
```

**Why:** `getByLabelText` matches against accessible labels, but with our mock returning `[key]` format, `getByRole` with `name` option works correctly.

### 3. Button Queries  

**✅ CORRECT:**
```typescript
screen.getByRole('button', { name: '[login.buttons.submit]' })
```

**Works for:**
- Submit buttons
- Cancel buttons  
- Any clickable button with text

### 4. Text Content Queries

**✅ CORRECT:**
```typescript
screen.getByText('[login.success.verified]')
screen.queryByText('[login.errors.invalidCredentials]')
await screen.findByText('[emailInput.email.error]')
```

**For error messages, success messages, instructions, labels, etc.**

### 5. Server Action Expectations

**Components now pass `locale` as the last parameter to server actions.**

**❌ WRONG:**
```typescript
expect(signupUser).toHaveBeenCalledWith({
  email: 'test@example.com',
  password_hash: 'password123',
});
```

**✅ CORRECT:**
```typescript
expect(signupUser).toHaveBeenCalledWith({
  email: 'test@example.com',
  password_hash: 'password123',
}, 'es');  // Add locale parameter!
```

**This applies to ALL server actions:**
- `signupUser(data, locale)`
- `signIn(provider, data, locale)` 
- `sendOTPCode(email, locale)`
- `checkAuthMethods(email, locale)`
- etc.

### 6. Translation Key Format

**All translations render as `[namespace.key]` in tests:**

```typescript
// Component renders:
<label>[login.email.label]</label>
<button>[login.buttons.submit]</button>  
<div>{[login.errors.invalidCredentials]}</div>

// Tests look for:
screen.getByRole('textbox', { name: '[login.email.label]' })
screen.getByRole('button', { name: '[login.buttons.submit]' })
screen.getByText('[login.errors.invalidCredentials]')
```

### 7. Interpolated Values

**With interpolation, the mock returns:** `[key]{value1:...,value2:...}`

```typescript
// Component: t('otp.timer.expiresIn', { time: '03:45' })
// Renders as: [otp.timer.expiresIn]{time:03:45}

// Test:
expect(screen.getByText(/\[otp\.timer\.expiresIn\]/)).toBeInTheDocument();
// Or if you need to check the value:
expect(screen.getByText('[otp.timer.expiresIn]{time:03:45}')).toBeInTheDocument();
```

## Common Errors & Solutions

### Error 1: "vi.mocked(...).mockReturnValue is not a function"

**Cause:** Missing or incorrect next-intl mock setup

**Solution:**  
1. Check `vi.mock('next-intl')` uses `vi.fn()` not inline functions
2. Verify `import * as intl from 'next-intl'` exists
3. Confirm `vi.mocked(intl.useTranslations).mockReturnValue(...)` in beforeEach

### Error 2: Test timeout at ~1000ms

**Cause:** `waitFor()` waiting for something that never matches

**Common reasons:**
1. Missing locale parameter in server action expectation
2. Wrong translation key in assertion  
3. Using `getByLabelText` instead of `getByRole`

**Solution:**
```typescript
// Check all expect(...).toHaveBeenCalledWith(...)
// Make sure locale parameter is included!

// Before
await waitFor(() => {
  expect(signupUser).toHaveBeenCalledWith(data);  // ❌ Hangs!
});

// After  
await waitFor(() => {
  expect(signupUser).toHaveBeenCalledWith(data, 'es');  // ✅ Works!
});
```

### Error 3: "Unable to find element with text"

**Cause:** Test looking for Spanish text or wrong key format

**Solution:**
- Replace all Spanish text with `[key]` format
- Replace regex patterns `/spanish/i` with exact `[key]`
- Check component to verify correct key name

### Error 4: "Unable to find a label with text"

**Cause:** Using `getByLabelText('[key]')` which doesn't work

**Solution:** Use `getByRole('textbox', { name: '[key]' })` instead

## Checklist for Converting Tests

- [ ] Import `createMockTranslations` and `* as intl`
- [ ] Add `vi.mock('next-intl')` with `vi.fn()` pattern
- [ ] Add mock setup in `beforeEach`
- [ ] Replace all `getByLabelText` with `getByRole('textbox', { name: ... })`
- [ ] Replace all Spanish text with `[key]` format
- [ ] Replace all regex patterns with exact `[key]` strings
- [ ] Add locale parameter to ALL server action expectations
- [ ] Test for timeouts (indicates missing expectations)
- [ ] Verify all tests pass

## Examples

### Complete Test File Structure

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../utils/test-utils';
import { createMockTranslations } from '../../utils/mock-translations';
import * as intl from 'next-intl';
import Component from '../../../app/components/Component';
import { serverAction } from '../../../app/actions/actions';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => 'es'),
}));

// Mock server actions
vi.mock('../../../app/actions/actions', () => ({
  serverAction: vi.fn(),
}));

describe('Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('auth')
    );
    
    vi.mocked(serverAction).mockResolvedValue({ success: true });
  });

  it('renders and submits correctly', async () => {
    renderWithTheme(<Component />);
    
    // Find input
    const input = screen.getByRole('textbox', { name: '[component.field.label]' });
    fireEvent.change(input, { target: { value: 'test' } });
    
    // Find and click button
    const button = screen.getByRole('button', { name: '[component.buttons.submit]' });
    fireEvent.click(button);
    
    // Wait for action call with locale
    await waitFor(() => {
      expect(serverAction).toHaveBeenCalledWith({ value: 'test' }, 'es');
    });
    
    // Check success message
    expect(screen.getByText('[component.success.message]')).toBeInTheDocument();
  });
});
```

## Summary

**The 3 Most Important Rules:**

1. **Always use `createMockTranslations` pattern** - Never inline mocks
2. **Use `getByRole('textbox', { name: '[key]' })`** - Not `getByLabelText`
3. **Add locale to ALL server action expectations** - Timeouts mean missing locale

Following these patterns will save hours of debugging!

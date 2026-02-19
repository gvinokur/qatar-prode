import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import LoginForm from '../../../app/components/auth/login-form';
import { setupTestMocks } from '../../mocks/setup-helpers';
import { renderWithTheme } from '../../utils/test-utils';
import { createMockTranslations } from '../../utils/mock-translations';
import * as intl from 'next-intl';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => 'es'),
}));

// Mock validator
vi.mock('validator', () => ({
  default: {
    isEmail: vi.fn(),
  },
}));

describe('LoginForm', () => {
  const mockOnSuccess = vi.fn();
  const user = userEvent.setup();

  let mockRouter: ReturnType<typeof setupTestMocks>['router'];
  let mockSearchParams: ReturnType<typeof setupTestMocks>['searchParams'];
  let mockSignIn: ReturnType<typeof setupTestMocks>['signIn'];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup all required mocks with single helper
    const mocks = setupTestMocks({
      navigation: true,
      signIn: true,
      signInDefaults: { ok: true },
    });

    mockRouter = mocks.router!;
    mockSearchParams = mocks.searchParams!;
    mockSignIn = mocks.signIn!;

    // Setup i18n mocks
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('auth')
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders login form with all required fields', () => {
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      expect(screen.getByLabelText('[login.email.label]')).toBeInTheDocument();
      expect(screen.getByLabelText('[login.password.label]')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '[login.buttons.submit]' })).toBeInTheDocument();
    });

    it('renders verification success message when verified param is true', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'verified') return 'true';
        return null;
      });
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      expect(screen.getByText('[login.success.verified]')).toBeInTheDocument();
    });

    it('does not render verification message when verified param is false', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'verified') return 'false';
        return null;
      });
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      expect(screen.queryByText('[login.success.verified]')).not.toBeInTheDocument();
    });

    it('does not render verification message when verified param is not present', () => {
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      expect(screen.queryByText('[login.success.verified]')).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows error when email is empty', async () => {
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      await user.click(submitButton);
      
      expect(screen.getByText('[login.email.required]')).toBeInTheDocument();
    });

    it('shows error when password is empty', async () => {
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      await user.click(submitButton);
      
      expect(screen.getByText('[login.password.required]')).toBeInTheDocument();
    });

    it('shows error when email format is invalid', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default as { isEmail: ReturnType<typeof vi.fn> };
      validator.isEmail.mockReturnValue(false);
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      await user.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      await user.click(submitButton);
      
      expect(screen.getByText('[login.email.invalid]')).toBeInTheDocument();
    });

    it('validates email format correctly with valid email', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default as { isEmail: ReturnType<typeof vi.fn> };
      validator.isEmail.mockReturnValue(true);
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(signIn).toHaveBeenCalled();
      });
    });

    it('clears validation errors when input is corrected', async () => {
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      // First, trigger validation error
      await user.click(submitButton);
      expect(screen.getByText('[login.email.required]')).toBeInTheDocument();
      
      // Then, correct the input
      await user.type(emailInput, 'test@example.com');
      
      // Error should be cleared
      expect(screen.queryByText('[login.email.required]')).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('calls signIn with correct credentials on successful validation', async () => {
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email: 'test@example.com',
          password: 'password123',
          redirect: false,
        });
      });
    });

    it('calls onSuccess when login is successful', async () => {
      (signIn as any).mockResolvedValue({ ok: true });
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('refreshes router on successful login', async () => {
      (signIn as any).mockResolvedValue({ ok: true });
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('redirects to callback URL when present', async () => {
      (signIn as any).mockResolvedValue({ ok: true });
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'callbackUrl') return '/dashboard';
        return null;
      });
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('does not redirect when callback URL is not present', async () => {
      (signIn as any).mockResolvedValue({ ok: true });
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    });
  });

  describe('error handling', () => {
    it('shows error message when login fails', async () => {
      (signIn as any).mockResolvedValue({ ok: false });
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('[login.errors.invalidCredentials]')).toBeInTheDocument();
      });
    });

    it('shows server error message when signIn throws', async () => {
      const errorMessage = 'Network error';
      (signIn as any).mockRejectedValue(new Error(errorMessage));
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      });
    });

    it('does not call onSuccess when login fails', async () => {
      (signIn as any).mockResolvedValue({ ok: false });
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('[login.errors.invalidCredentials]')).toBeInTheDocument();
      });
      
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('clears error message when form is resubmitted', async () => {
      (signIn as any).mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('[login.errors.invalidCredentials]')).toBeInTheDocument();
      });
      
      // Clear password and try again
      await user.clear(passwordInput);
      await user.type(passwordInput, 'correctpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText('[login.errors.invalidCredentials]')).not.toBeInTheDocument();
      });
    });
  });

  describe('form interaction', () => {
    it('focuses email input on render', () => {
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      expect(emailInput).toHaveFocus();
    });

    it('submits form when Enter is pressed', async () => {
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(signIn).toHaveBeenCalled();
      });
    });

    it('handles tab navigation correctly', async () => {
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(passwordInput).toHaveFocus();
      
      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });

  describe('accessibility', () => {
    it('has proper form labels', () => {
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      expect(screen.getByLabelText('[login.email.label]')).toBeInTheDocument();
      expect(screen.getByLabelText('[login.password.label]')).toBeInTheDocument();
    });

    it('shows field errors with proper accessibility attributes', async () => {
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      await user.click(submitButton);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('[login.email.required]')).toBeInTheDocument();
    });

    it('has proper button type for form submission', () => {
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('edge cases', () => {
    it('handles null callback URL gracefully', async () => {
      (signIn as any).mockResolvedValue({ ok: true });
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'callbackUrl') return null;
        return null;
      });
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
      
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('handles empty callback URL gracefully', async () => {
      (signIn as any).mockResolvedValue({ ok: true });
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'callbackUrl') return '';
        return null;
      });
      
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
      
      // Empty string is falsy, so no redirect should happen
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('handles special characters in credentials', async () => {
      renderWithTheme(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('[login.email.label]');
      const passwordInput = screen.getByLabelText('[login.password.label]');
      const submitButton = screen.getByRole('button', { name: '[login.buttons.submit]' });
      
      await user.type(emailInput, 'test+special@example.com');
      await user.type(passwordInput, 'p@ssw0rd!@#$%');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email: 'test+special@example.com',
          password: 'p@ssw0rd!@#$%',
          redirect: false,
        });
      });
    });
  });
});

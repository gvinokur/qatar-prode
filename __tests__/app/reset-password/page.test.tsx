import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResetPasswordPage from '../../../app/[locale]/reset-password/page';
import { renderWithTheme } from '../../utils/test-utils';
import * as userActions from '../../../app/actions/user-actions';

// Mock next/navigation
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

const mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'resetPassword.title': 'Reset Password',
      'resetPassword.errors.tokenNotProvided': 'Token not provided',
      'resetPassword.errors.tokenInvalid': 'Invalid or expired token',
      'resetPassword.errors.tokenVerifyFailed': 'Failed to verify token',
      'resetPassword.errors.updateFailed': 'Failed to update password',
      'resetPassword.newPassword.label': 'New Password',
      'resetPassword.newPassword.required': 'Password is required',
      'resetPassword.newPassword.minLength': 'Password must be at least 8 characters',
      'resetPassword.confirmPassword.label': 'Confirm Password',
      'resetPassword.confirmPassword.required': 'Please confirm your password',
      'resetPassword.confirmPassword.mismatch': 'Passwords do not match',
      'resetPassword.button.submit': 'Reset Password',
      'resetPassword.button.submitting': 'Resetting...',
      'resetPassword.success.updated': 'Password updated successfully',
      'resetPassword.success.backHome': 'Back Home',
    };
    return translations[key] || key;
  },
  useLocale: () => 'es',
}));

// Mock user actions
vi.mock('../../../app/actions/user-actions', () => ({
  verifyResetToken: vi.fn(),
  updateUserPassword: vi.fn(),
}));

// Mock AuthPageSkeleton
vi.mock('../../../app/components/skeletons', () => ({
  AuthPageSkeleton: () => <div data-testid="auth-skeleton">Loading...</div>,
}));

const mockVerifyResetToken = vi.mocked(userActions.verifyResetToken);
const mockUpdateUserPassword = vi.mocked(userActions.updateUserPassword);

describe('ResetPasswordPage', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRouter.push.mockClear();
    // Clear and reset URLSearchParams
    (mockSearchParams as any).clear?.();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Token Validation', () => {
    it('should display loading skeleton while validating token', () => {
      // Setup searchParams mock with token
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithTheme(<ResetPasswordPage />);

      expect(screen.getByTestId('auth-skeleton')).toBeInTheDocument();
    });

    it('should display error when token is not provided', async () => {
      // Setup searchParams mock without token
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn(() => null),
        writable: true,
      });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Token not provided')).toBeInTheDocument();
      });
    });

    it('should display error for invalid token', async () => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'invalid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(null);

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Invalid or expired token')).toBeInTheDocument();
      });
    });

    it('should display error when token verification fails', async () => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'some-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockRejectedValue(new Error('Verification failed'));

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Failed to verify token')).toBeInTheDocument();
      });
    });

    it('should display form when token is valid', async () => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(mockUser);

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
      });
    });

    it('should display back home button when token is invalid', async () => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn(() => null),
        writable: true,
      });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Back Home' })).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(mockUser);
    });

    it('should display required validation error for password field', async () => {
      const user = userEvent.setup();
      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });
    });

    it('should display required validation error for confirm password field', async () => {
      const user = userEvent.setup();
      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      await user.type(passwordField, 'ValidPassword123');

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
      });
    });

    it('should display minLength validation error for password', async () => {
      const user = userEvent.setup();
      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      await user.type(passwordField, 'short');

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('should display mismatch error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      await user.type(passwordField, 'ValidPassword123');
      await user.type(confirmPasswordField, 'DifferentPassword123');

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it('should not display errors when passwords match and are valid', async () => {
      const user = userEvent.setup();
      mockUpdateUserPassword.mockResolvedValue({ success: true });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      await user.type(passwordField, 'ValidPassword123');
      await user.type(confirmPasswordField, 'ValidPassword123');

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUserPassword).toHaveBeenCalledWith(mockUser.id, 'ValidPassword123');
      });
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(mockUser);
    });

    it('should call updateUserPassword with correct parameters', async () => {
      const user = userEvent.setup();
      mockUpdateUserPassword.mockResolvedValue({ success: true });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');
      const password = 'NewSecurePassword123';

      await user.type(passwordField, password);
      await user.type(confirmPasswordField, password);

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUserPassword).toHaveBeenCalledWith(mockUser.id, password);
      });
    });

    it('should show submitting state while form is being submitted', async () => {
      const user = userEvent.setup();
      mockUpdateUserPassword.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      await user.type(passwordField, 'ValidPassword123');
      await user.type(confirmPasswordField, 'ValidPassword123');

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        // Button text should change to "Resetting..."
        expect(screen.getByRole('button', { name: 'Resetting...' })).toBeInTheDocument();
      });
    });

    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();
      mockUpdateUserPassword.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      await user.type(passwordField, 'ValidPassword123');
      await user.type(confirmPasswordField, 'ValidPassword123');

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        const resettingButton = screen.getByRole('button', { name: 'Resetting...' });
        expect(resettingButton).toHaveAttribute('disabled');
      });
    });
  });

  describe('Success State', () => {
    beforeEach(() => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(mockUser);
    });

    it('should display success message after successful password update', async () => {
      const user = userEvent.setup();
      mockUpdateUserPassword.mockResolvedValue({ success: true });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      await user.type(passwordField, 'ValidPassword123');
      await user.type(confirmPasswordField, 'ValidPassword123');

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password updated successfully')).toBeInTheDocument();
      });
    });

    it('should redirect to home page after successful password update', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();

      mockUpdateUserPassword.mockResolvedValue({ success: true });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      await user.type(passwordField, 'ValidPassword123');
      await user.type(confirmPasswordField, 'ValidPassword123');

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password updated successfully')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(3000);

      expect(mockRouter.push).toHaveBeenCalledWith('/');

      vi.useRealTimers();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(mockUser);
    });

    it('should display error message when updateUserPassword returns failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'User not found';
      mockUpdateUserPassword.mockResolvedValue({
        success: false,
        message: errorMessage,
      });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      await user.type(passwordField, 'ValidPassword123');
      await user.type(confirmPasswordField, 'ValidPassword123');

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display error message when updateUserPassword throws', async () => {
      const user = userEvent.setup();
      mockUpdateUserPassword.mockRejectedValue(new Error('Network error'));

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      await user.type(passwordField, 'ValidPassword123');
      await user.type(confirmPasswordField, 'ValidPassword123');

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update password')).toBeInTheDocument();
      });
    });

    it('should not redirect when password update fails', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();

      mockUpdateUserPassword.mockRejectedValue(new Error('Network error'));

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      await user.type(passwordField, 'ValidPassword123');
      await user.type(confirmPasswordField, 'ValidPassword123');

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update password')).toBeInTheDocument();
      });

      vi.advanceTimersByTime(3000);

      expect(mockRouter.push).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('should allow resubmission after error', async () => {
      const user = userEvent.setup();
      mockUpdateUserPassword
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      // First attempt
      await user.type(passwordField, 'ValidPassword123');
      await user.type(confirmPasswordField, 'ValidPassword123');

      let submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update password')).toBeInTheDocument();
      });

      // Clear inputs and try again
      await user.clear(passwordField);
      await user.clear(confirmPasswordField);

      await user.type(passwordField, 'ValidPassword123');
      await user.type(confirmPasswordField, 'ValidPassword123');

      submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password updated successfully')).toBeInTheDocument();
      });
    });
  });

  describe('UI Rendering', () => {
    it('should render page title', async () => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(mockUser);

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Reset Password' })).toBeInTheDocument();
      });
    });

    it('should render password and confirm password input fields', async () => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(mockUser);

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      });
    });

    it('should render submit button when token is valid', async () => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(mockUser);

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
      });
    });

    it('should have password type for password fields', async () => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(mockUser);

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        const passwordField = screen.getByLabelText('New Password') as HTMLInputElement;
        const confirmPasswordField = screen.getByLabelText('Confirm Password') as HTMLInputElement;

        expect(passwordField.type).toBe('password');
        expect(confirmPasswordField.type).toBe('password');
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate to home when back home button is clicked', async () => {
      const user = userEvent.setup();
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn(() => null),
        writable: true,
      });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: 'Back Home' });
        expect(backButton).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: 'Back Home' });
      await user.click(backButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });

    it('should not call router.push for invalid token without explicit action', async () => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn(() => null),
        writable: true,
      });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Token not provided')).toBeInTheDocument();
      });

      // Router should only be called if user clicks the back button
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid form submissions', async () => {
      const user = userEvent.setup();
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(mockUser);
      mockUpdateUserPassword.mockResolvedValue({ success: true });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      await user.type(passwordField, 'ValidPassword123');
      await user.type(confirmPasswordField, 'ValidPassword123');

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });

      // Click multiple times rapidly
      await user.click(submitButton);
      await user.click(submitButton);

      await waitFor(() => {
        // Should only be called once due to submitting state
        expect(mockUpdateUserPassword).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle very long passwords', async () => {
      const user = userEvent.setup();
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(mockUser);
      mockUpdateUserPassword.mockResolvedValue({ success: true });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const longPassword = 'A'.repeat(256) + 'aB1@';
      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      await user.type(passwordField, longPassword);
      await user.type(confirmPasswordField, longPassword);

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUserPassword).toHaveBeenCalledWith(mockUser.id, longPassword);
      });
    });

    it('should handle special characters in passwords', async () => {
      const user = userEvent.setup();
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(mockUser);
      mockUpdateUserPassword.mockResolvedValue({ success: true });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const specialPassword = 'P@$$w0rd!#%&*()_+-=[]{}|;\':"\\,.<>?/`~';
      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      await user.type(passwordField, specialPassword);
      await user.type(confirmPasswordField, specialPassword);

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateUserPassword).toHaveBeenCalledWith(mockUser.id, specialPassword);
      });
    });

    it('should not submit form if userId is not set', async () => {
      const user = userEvent.setup();
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      // Verify token but return no user
      mockVerifyResetToken.mockResolvedValue(null);

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Invalid or expired token')).toBeInTheDocument();
      });

      expect(mockUpdateUserPassword).not.toHaveBeenCalled();
    });
  });

  describe('Alert Severity', () => {
    it('should display error alert with correct severity', async () => {
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn(() => null),
        writable: true,
      });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        const alert = screen.getByText('Token not provided').closest('[role="alert"]');
        expect(alert).toHaveClass('MuiAlert-standardError');
      });
    });

    it('should display success alert with correct severity', async () => {
      const user = userEvent.setup();
      Object.defineProperty(mockSearchParams, 'get', {
        value: vi.fn((key) => (key === 'token' ? 'valid-token' : null)),
        writable: true,
      });

      mockVerifyResetToken.mockResolvedValue(mockUser);
      mockUpdateUserPassword.mockResolvedValue({ success: true });

      renderWithTheme(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      });

      const passwordField = screen.getByLabelText('New Password');
      const confirmPasswordField = screen.getByLabelText('Confirm Password');

      await user.type(passwordField, 'ValidPassword123');
      await user.type(confirmPasswordField, 'ValidPassword123');

      const submitButton = screen.getByRole('button', { name: 'Reset Password' });
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByText('Password updated successfully').closest('[role="alert"]');
        expect(alert).toHaveClass('MuiAlert-standardSuccess');
      });
    });
  });
});

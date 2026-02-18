import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailInputForm from '../../../app/components/auth/email-input-form';
import { renderWithTheme } from '../../utils/test-utils';
import { checkAuthMethods } from '../../../app/actions/oauth-actions';
import { signIn } from 'next-auth/react';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: Record<string, any>) => {
    const translations: Record<string, string> = {
      'emailInput.email.label': 'Correo Electrónico',
      'emailInput.email.error': 'Error al verificar el email',
      'emailInput.buttons.continue': 'Continuar',
      'emailInput.buttons.google': 'Continuar con Google',
      'emailInput.divider': 'o',
    };
    if (values) return `${translations[key] || key}:${JSON.stringify(values)}`;
    return translations[key] || key;
  },
  useLocale: () => 'es',
}));

// Mock dependencies
vi.mock('../../../app/actions/oauth-actions', () => ({
  checkAuthMethods: vi.fn()
}));
vi.mock('next-auth/react', () => ({
  signIn: vi.fn()
}));

describe('EmailInputForm', () => {
  const mockOnEmailSubmit = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders email input field', () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      expect(screen.getByLabelText(/correo/i)).toBeInTheDocument();
    });

    it('renders continue button', () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      expect(screen.getByRole('button', { name: /continuar$/i })).toBeInTheDocument();
    });

    it('renders Google sign-in button', () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      expect(screen.getByRole('button', { name: /continuar con google/i })).toBeInTheDocument();
    });

    it('renders divider with "o" text', () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      expect(screen.getByText('o')).toBeInTheDocument();
    });
  });

  describe('Email Input', () => {
    it('allows typing in email field', async () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('clears email input when user types', async () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      await user.type(emailInput, 'test');
      await user.clear(emailInput);
      await user.type(emailInput, 'new@example.com');

      expect(emailInput).toHaveValue('new@example.com');
    });

    it('accepts valid email formats with special characters', async () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i) as HTMLInputElement;
      await user.type(emailInput, 'user+tag@sub-domain.example.co.uk');

      expect(emailInput.value).toBe('user+tag@sub-domain.example.co.uk');
    });
  });

  describe('Form Submission', () => {
    it('calls checkAuthMethods when form is submitted', async () => {
      vi.mocked(checkAuthMethods).mockResolvedValue({
        hasPassword: true,
        hasGoogle: false,
        userExists: true,
        success: true
      });

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(checkAuthMethods).toHaveBeenCalledWith('test@example.com', 'es');
      });
    });

    it('calls onEmailSubmit with email and auth methods on success', async () => {
      vi.mocked(checkAuthMethods).mockResolvedValue({
        hasPassword: true,
        hasGoogle: false,
        userExists: true,
        success: true
      });

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnEmailSubmit).toHaveBeenCalledWith('test@example.com', {
          hasPassword: true,
          hasGoogle: false,
          userExists: true
        });
      });
    });

    it('shows loading indicator while checking auth methods', async () => {
      vi.mocked(checkAuthMethods).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          hasPassword: true,
          hasGoogle: false,
          userExists: true,
          success: true
        }), 100))
      );

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // Should show loading spinner
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockOnEmailSubmit).toHaveBeenCalled();
      });
    });

    it('disables inputs while loading', async () => {
      vi.mocked(checkAuthMethods).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({
          hasPassword: true,
          hasGoogle: false,
          userExists: true,
          success: true
        }), 100))
      );

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });
      const googleButton = screen.getByRole('button', { name: /continuar con google/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // All inputs should be disabled while loading
      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(googleButton).toBeDisabled();

      await waitFor(() => {
        expect(mockOnEmailSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows generic error when checkAuthMethods fails without error message', async () => {
      vi.mocked(checkAuthMethods).mockResolvedValue({
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: false
      });

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      const errorMessage = await screen.findByText('Error al verificar el email');
      expect(errorMessage).toBeInTheDocument();
    });

    it('shows error when checkAuthMethods throws exception', async () => {
      vi.mocked(checkAuthMethods).mockRejectedValue(
        new Error('Network error')
      );

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      const errorMessage = await screen.findByText('Error al verificar el email');
      expect(errorMessage).toBeInTheDocument();
      expect(mockOnEmailSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Google Sign-In', () => {
    it('calls signIn with google provider when button is clicked', async () => {
      vi.mocked(signIn).mockResolvedValue(undefined as any);

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const googleButton = screen.getByRole('button', { name: /continuar con google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/' });
      });
    });

    it('shows error when Google sign-in fails', async () => {
      vi.mocked(signIn).mockRejectedValue(new Error('Google OAuth error'));

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const googleButton = screen.getByRole('button', { name: /continuar con google/i });
      await user.click(googleButton);

      await waitFor(() => {
        expect(screen.getByText('Error al verificar el email')).toBeInTheDocument();
      });
    });

    it('disables buttons while Google sign-in is in progress', async () => {
      vi.mocked(signIn).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined as any), 100))
      );

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });
      const googleButton = screen.getByRole('button', { name: /continuar con google/i });

      await user.click(googleButton);

      // All inputs should be disabled while loading
      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(googleButton).toBeDisabled();

      await waitFor(() => {
        expect(signIn).toHaveBeenCalled();
      }, { timeout: 200 });
    });
  });

  describe('Accessibility', () => {
    it('requires email field', () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      expect(emailInput).toBeRequired();
    });

    it('has proper email input type', () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('has proper keyboard navigation', async () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const continueButton = screen.getByRole('button', { name: /continuar$/i });
      const googleButton = screen.getByRole('button', { name: /google/i });

      // Tab to email input
      await user.tab();
      expect(emailInput).toHaveFocus();

      // Tab to continue button
      await user.tab();
      expect(continueButton).toHaveFocus();

      // Tab to google button
      await user.tab();
      expect(googleButton).toHaveFocus();
    });

    it('submit button has correct type attribute', () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const submitButton = screen.getByRole('button', { name: /continuar$/i });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('Form state management', () => {
    it('disables all inputs during email verification', async () => {
      let resolveCheckAuthMethods: any;
      const checkAuthMethodsPromise = new Promise((resolve) => {
        resolveCheckAuthMethods = resolve;
      });
      vi.mocked(checkAuthMethods).mockReturnValue(checkAuthMethodsPromise as any);

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });
      const googleButton = screen.getByRole('button', { name: /google/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // All inputs should be disabled
      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(googleButton).toBeDisabled();

      // Resolve promise
      resolveCheckAuthMethods({
        success: true,
        hasPassword: true,
        hasGoogle: false,
        userExists: true,
      });

      await waitFor(() => {
        expect(emailInput).not.toBeDisabled();
      });
    });

    it('re-enables inputs after successful verification', async () => {
      vi.mocked(checkAuthMethods).mockResolvedValue({
        success: true,
        hasPassword: true,
        hasGoogle: false,
        userExists: true,
      });

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(emailInput).not.toBeDisabled();
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('clears error message on successful submit after error', async () => {
      vi.mocked(checkAuthMethods)
        .mockResolvedValueOnce({
          success: false,
          error: 'Error de verificación',
        })
        .mockResolvedValueOnce({
          success: true,
          hasPassword: true,
          hasGoogle: false,
          userExists: true,
        });

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      // First submission with error
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error de verificación')).toBeInTheDocument();
      });

      // Clear and retry
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Error de verificación')).not.toBeInTheDocument();
        expect(mockOnEmailSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Error message display', () => {
    it('displays error from checkAuthMethods response', async () => {
      const errorMessage = 'This email is already registered';
      vi.mocked(checkAuthMethods).mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'existing@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('displays error alert with role alert', async () => {
      vi.mocked(checkAuthMethods).mockResolvedValue({
        success: false,
        error: 'Verification error',
      });

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });
  });

  describe('Translation and localization', () => {
    it('calls checkAuthMethods with correct locale', async () => {
      vi.mocked(checkAuthMethods).mockResolvedValue({
        success: true,
        hasPassword: true,
        hasGoogle: false,
        userExists: true,
      });

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(checkAuthMethods).toHaveBeenCalledWith('test@example.com', 'es');
      });
    });
  });

  describe('Edge cases', () => {
    it('handles rapid form submissions gracefully', async () => {
      let callCount = 0;
      vi.mocked(checkAuthMethods).mockImplementation(async () => {
        callCount++;
        return {
          success: true,
          hasPassword: true,
          hasGoogle: false,
          userExists: true,
        };
      });

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'test@example.com');

      // Rapid clicks
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);

      await waitFor(() => {
        expect(callCount).toBeGreaterThan(0);
      });
    });

    it('handles empty string error from checkAuthMethods', async () => {
      vi.mocked(checkAuthMethods).mockResolvedValue({
        success: false,
        error: '',
      });

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/correo/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Error al verificar el email')).toBeInTheDocument();
      });
    });
  });
});

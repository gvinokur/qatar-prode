import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import SignupForm, { SignupFormData } from '../../../app/components/auth/signup-form';
import { signupUser } from '../../../app/actions/user-actions';
import { User } from '../../../app/db/tables-definition';
import { setupTestMocks } from '../../mocks/setup-helpers';
import { renderWithTheme } from '../../utils/test-utils';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

// Mock user actions
vi.mock('../../../app/actions/user-actions', () => ({
  signupUser: vi.fn(),
}));

// Mock validator
vi.mock('validator', () => ({
  default: {
    isEmail: vi.fn(),
  },
}));

// Import the mocked validator
import validator from 'validator';

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  nickname: 'testuser',
  password_hash: 'hashedpassword',
  is_admin: false,
  email_verified: false,
  verification_token: 'token123',
  verification_token_expiration: new Date(),
  reset_token: null,
  reset_token_expiration: null,
  notification_subscriptions: null,
  onboarding_completed: false,
  onboarding_completed_at: null,
  onboarding_data: null,
};

describe('SignupForm', () => {
  let mockOnSuccess: ReturnType<typeof vi.fn>;
  let mockRouter: ReturnType<typeof setupTestMocks>['router'];
  let mockSignIn: ReturnType<typeof setupTestMocks>['signIn'];

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSuccess = vi.fn();

    // Setup mocks with single helper
    const mocks = setupTestMocks({
      navigation: true,
      signIn: true,
      signInDefaults: { error: null },
    });

    mockRouter = mocks.router!;
    mockSignIn = mocks.signIn!;

    vi.mocked(signupUser).mockResolvedValue(mockUser);
    vi.mocked(validator.isEmail).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Form rendering', () => {
    it('renders all form fields correctly', () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText('E-Mail')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmacion de E-Mail')).toBeInTheDocument();
      expect(screen.getByLabelText('Apodo')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmacion de Contraseña')).toBeInTheDocument();
      expect(screen.getByText('Registrarse')).toBeInTheDocument();
    });

    it('renders form fields with correct types', () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText('E-Mail')).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Confirmacion de E-Mail')).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Apodo')).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Contraseña')).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText('Confirmacion de Contraseña')).toHaveAttribute('type', 'password');
    });

    it('has autofocus on email field', () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      // Check that email field has name attribute (autofocus is set by the TextField component)
      expect(screen.getByLabelText('E-Mail')).toHaveAttribute('name', 'email');
    });

    it('does not show error alert initially', () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('shows required error for empty email', async () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText('Por favor ingrese su e-mail')).toBeInTheDocument();
      });
    });

    it('shows invalid email error for malformed email', async () => {
      (validator.isEmail as any).mockReturnValue(false);

      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: 'invalid-email' },
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText('Direccion de E-Mail invalida')).toBeInTheDocument();
      });
    });

    it('shows required error for empty email confirmation', async () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText('Por favor confirme su e-mail')).toBeInTheDocument();
      });
    });

    it('shows mismatch error when email confirmation does not match', async () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de E-Mail'), {
        target: { value: 'different@example.com' },
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText('Confirme su e-mail correctamente')).toBeInTheDocument();
      });
    });

    it('shows required error for empty password', async () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText('Cree su contraseña')).toBeInTheDocument();
      });
    });

    it('shows required error for empty password confirmation', async () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText('Por favor confirme su contraseña')).toBeInTheDocument();
      });
    });

    it('shows mismatch error when password confirmation does not match', async () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de Contraseña'), {
        target: { value: 'differentpassword' },
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText('Confirme su contraseña correctamente')).toBeInTheDocument();
      });
    });

    it('allows nickname to be optional', async () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(signupUser).toHaveBeenCalledWith({
          email: 'test@example.com',
          password_hash: 'password123',
          nickname: '',
        });
      });
    });
  });

  describe('Form submission', () => {
    const validFormData: SignupFormData = {
      email: 'test@example.com',
      email_confirm: 'test@example.com',
      nickname: 'testuser',
      password: 'password123',
      password_confirm: 'password123',
    };

    const fillFormWithValidData = () => {
      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: validFormData.email },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de E-Mail'), {
        target: { value: validFormData.email_confirm },
      });

      fireEvent.change(screen.getByLabelText('Apodo'), {
        target: { value: validFormData.nickname },
      });

      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: validFormData.password },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de Contraseña'), {
        target: { value: validFormData.password_confirm },
      });
    };

    it('calls signupUser with correct data on successful form submission', async () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fillFormWithValidData();

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(signupUser).toHaveBeenCalledWith({
          email: validFormData.email,
          password_hash: validFormData.password,
          nickname: validFormData.nickname,
        });
      });
    });

    it('shows loading state during form submission', async () => {
      (signupUser as any).mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fillFormWithValidData();

      fireEvent.click(screen.getByText('Registrarse'));

      // Check if button shows loading state
      await waitFor(() => {
        expect(screen.getByText('Registrarse')).toBeInTheDocument();
      });
    });

    it('attempts automatic login after successful registration', async () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fillFormWithValidData();

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('credentials', {
          email: validFormData.email,
          password: validFormData.password,
          redirect: false,
        });
      });
    });

    it('calls onSuccess and refreshes router on successful registration and login', async () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fillFormWithValidData();

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(mockUser);
        expect(mockRouter.refresh).toHaveBeenCalled();
      });
    });

    it('shows error when signupUser returns an error string', async () => {
      const errorMessage = 'Ya existe un usuario con ese e-mail';
      (signupUser as any).mockResolvedValue(errorMessage);

      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fillFormWithValidData();

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('shows error when automatic login fails after registration', async () => {
      (signIn as any).mockResolvedValue({ error: 'Login failed' });

      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fillFormWithValidData();

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText('Registration successful but automatic login failed. Please try logging in manually.')).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('shows error when signupUser throws an exception', async () => {
      const errorMessage = 'Network error';
      (signupUser as any).mockRejectedValue(new Error(errorMessage));

      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fillFormWithValidData();

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('does not submit form if required fields are missing', async () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(signupUser).not.toHaveBeenCalled();
      });
    });
  });

  describe('Form field interactions', () => {
    it('updates email field value on input change', () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText('E-Mail');
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

      expect(emailInput).toHaveValue('new@example.com');
    });

    it('updates email confirmation field value on input change', () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      const emailConfirmInput = screen.getByLabelText('Confirmacion de E-Mail');
      fireEvent.change(emailConfirmInput, { target: { value: 'new@example.com' } });

      expect(emailConfirmInput).toHaveValue('new@example.com');
    });

    it('updates nickname field value on input change', () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      const nicknameInput = screen.getByLabelText('Apodo');
      fireEvent.change(nicknameInput, { target: { value: 'newnickname' } });

      expect(nicknameInput).toHaveValue('newnickname');
    });

    it('updates password field value on input change', () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      const passwordInput = screen.getByLabelText('Contraseña');
      fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

      expect(passwordInput).toHaveValue('newpassword');
    });

    it('updates password confirmation field value on input change', () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      const passwordConfirmInput = screen.getByLabelText('Confirmacion de Contraseña');
      fireEvent.change(passwordConfirmInput, { target: { value: 'newpassword' } });

      expect(passwordConfirmInput).toHaveValue('newpassword');
    });

    it('validation errors are shown only on form submission, not on blur', async () => {
      (validator.isEmail as any).mockReturnValue(false);

      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      const emailInput = screen.getByLabelText('E-Mail');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.blur(emailInput);

      // No validation error should be shown until form is submitted
      expect(screen.queryByText('Direccion de E-Mail invalida')).not.toBeInTheDocument();

      // But validation error should be shown on form submission
      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText('Direccion de E-Mail invalida')).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('clears previous errors when new form submission starts', async () => {
      const errorMessage = 'Ya existe un usuario con ese e-mail';
      (signupUser as any).mockResolvedValueOnce(errorMessage);

      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      // Fill form and submit to get error
      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Now mock successful response and submit again
      (signupUser as any).mockResolvedValueOnce(mockUser);

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      (signupUser as any).mockRejectedValue(new Error('Network error'));

      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText('Error: Network error')).toBeInTheDocument();
      });
    });

    it('handles signIn errors gracefully', async () => {
      (signIn as any).mockRejectedValue(new Error('SignIn error'));

      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText('Error: SignIn error')).toBeInTheDocument();
      });
    });
  });

  describe('Props integration', () => {
    it('calls onSuccess prop when registration and login are successful', async () => {
      const customOnSuccess = vi.fn();

      renderWithTheme(<SignupForm onSuccess={customOnSuccess} />);

      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(customOnSuccess).toHaveBeenCalledWith(mockUser);
      });
    });

    it('does not call onSuccess prop when registration fails', async () => {
      const customOnSuccess = vi.fn();
      (signupUser as any).mockResolvedValue('Error message');

      renderWithTheme(<SignupForm onSuccess={customOnSuccess} />);

      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });

      expect(customOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper form structure with labels', () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText('E-Mail')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmacion de E-Mail')).toBeInTheDocument();
      expect(screen.getByLabelText('Apodo')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirmacion de Contraseña')).toBeInTheDocument();
    });

    it('shows error messages in helper text', async () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        const emailField = screen.getByLabelText('E-Mail');
        const helperText = emailField.parentElement?.parentElement?.querySelector('.MuiFormHelperText-root');
        expect(helperText).toHaveTextContent('Por favor ingrese su e-mail');
      });
    });

    it('marks fields with errors as invalid', async () => {
      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        const emailField = screen.getByLabelText('E-Mail');
        expect(emailField).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('shows alert with proper severity for form errors', async () => {
      (signupUser as any).mockResolvedValue('Error message');

      renderWithTheme(<SignupForm onSuccess={mockOnSuccess} />);

      fireEvent.change(screen.getByLabelText('E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de E-Mail'), {
        target: { value: 'test@example.com' },
      });

      fireEvent.change(screen.getByLabelText('Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.change(screen.getByLabelText('Confirmacion de Contraseña'), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByText('Registrarse'));

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Error message');
      });
    });
  });
});

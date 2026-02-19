import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountSetupForm from '../../../app/components/auth/account-setup-form';
import { renderWithTheme } from '../../utils/test-utils';
import { createMockTranslations } from '../../utils/mock-translations';
import * as intl from 'next-intl';
import * as otpActions from '../../../app/actions/otp-actions';
import { signIn } from 'next-auth/react';

// Mock the OTP actions
vi.mock('../../../app/actions/otp-actions', () => ({
  createAccountViaOTP: vi.fn(),
  checkNicknameAvailability: vi.fn()
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn()
}));

// Mock next-intl with translation interpolation support
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => 'es'),
}));

describe('AccountSetupForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    email: 'test@example.com',
    verifiedOTP: '123456',
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup i18n mocks
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('auth')
    );

    // Setup default mock responses
    vi.mocked(otpActions.checkNicknameAvailability).mockResolvedValue({ available: true });
    vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: false });
    vi.mocked(signIn).mockResolvedValue({ ok: false });
  });

  it('should render the form with nickname field', () => {
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    expect(screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' })).toBeInTheDocument();
  });

  it('should render optional password field', () => {
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    expect(screen.getByLabelText('[accountSetup.password.label]')).toBeInTheDocument();
  });

  it('should allow typing in nickname field', async () => {
    const user = userEvent.setup();
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
    await user.type(nicknameInput, 'testuser');

    expect(nicknameInput).toHaveValue('testuser');
  });

  it('should allow typing in password field', async () => {
    const user = userEvent.setup();
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const passwordInput = screen.getByLabelText('[accountSetup.password.label]');
    await user.type(passwordInput, 'password123');

    expect(passwordInput).toHaveValue('password123');
  });

  it('should check nickname availability on blur', async () => {
    const user = userEvent.setup();
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
    await user.type(nicknameInput, 'testuser');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(otpActions.checkNicknameAvailability).toHaveBeenCalledWith('testuser', 'es');
    });
  });

  it('should show error if nickname is not available', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.checkNicknameAvailability).mockResolvedValue({
      available: false,
      error: 'Este nickname no está disponible.'
    });

    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
    await user.type(nicknameInput, 'taken');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/no está disponible/i)).toBeInTheDocument();
    });
  });

  it('should render cancel button', () => {
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: '[accountSetup.buttons.cancel]' })).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: '[accountSetup.buttons.cancel]' });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should submit form with valid nickname', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: true });

    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
    await user.type(nicknameInput, 'validuser');

    const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(otpActions.createAccountViaOTP).toHaveBeenCalledWith({
        email: 'test@example.com',
        nickname: 'validuser',
        password: null,
        verifiedOTP: '123456'
      }, 'es');
    });
  });

  it('should submit form with nickname and password', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: true });

    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
    await user.type(nicknameInput, 'validuser');

    const passwordInput = screen.getByLabelText('[accountSetup.password.label]');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(otpActions.createAccountViaOTP).toHaveBeenCalledWith({
        email: 'test@example.com',
        nickname: 'validuser',
        password: 'password123',
        verifiedOTP: '123456'
      }, 'es');
    });
  });

  it('should show error message on submission failure', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({
      success: false,
      error: 'Error al crear la cuenta'
    });

    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
    await user.type(nicknameInput, 'validuser');

    const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Error al crear la cuenta/i)).toBeInTheDocument();
    });
  });

  it('should render submit button', () => {
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: '[accountSetup.buttons.submit]' })).toBeInTheDocument();
  });

  it('should trim whitespace from nickname', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: true });

    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
    await user.type(nicknameInput, '  testuser  ');

    const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(otpActions.createAccountViaOTP).toHaveBeenCalledWith(
        expect.objectContaining({ nickname: 'testuser' }),
        'es'
      );
    });
  });

  describe('locale and form submission', () => {
    it('passes locale parameter to createAccountViaOTP', async () => {
      const user = userEvent.setup();
      vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: true });
      vi.mocked(signIn).mockResolvedValue({ ok: true });

      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      await user.type(nicknameInput, 'testuser');

      const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(otpActions.createAccountViaOTP).toHaveBeenCalledWith(
          expect.any(Object),
          'es'
        );
      });
    });

    it('signs in after successful account creation', async () => {
      const user = userEvent.setup();
      vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: true });
      vi.mocked(signIn).mockResolvedValue({ ok: true });

      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      await user.type(nicknameInput, 'testuser');

      const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(signIn).toHaveBeenCalledWith('otp', {
          email: 'test@example.com',
          otp: '123456',
          redirect: false
        });
      });
    });
  });

  describe('translation interpolation', () => {
    it('displays nickname minimum length error with interpolated value', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      await user.type(nicknameInput, 'ab');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/\[accountSetup\.nickname\.minLength\]/)).toBeInTheDocument();
      });
    });

    it('displays nickname maximum length error with interpolated value', async () => {
      const user = userEvent.setup();
      const { container } = renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' }) as HTMLInputElement;

      // Remove maxLength attribute to allow typing more than 20 chars
      nicknameInput.removeAttribute('maxlength');

      const longNickname = 'a'.repeat(21);
      await user.type(nicknameInput, longNickname);
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/\[accountSetup\.nickname\.maxLength\]/)).toBeInTheDocument();
      });
    });

    it('displays password minimum length error with interpolated value', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText('[accountSetup.password.label]');
      await user.type(passwordInput, 'short');

      await waitFor(() => {
        expect(screen.getByText(/\[accountSetup\.password\.minLength\]/)).toBeInTheDocument();
      });
    });

    it('updates error message when nickname length changes', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });

      // Type too short
      await user.type(nicknameInput, 'a');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/\[accountSetup\.nickname\.minLength\]/)).toBeInTheDocument();
      });

      // Add more characters
      await user.type(nicknameInput, 'bcde');

      await waitFor(() => {
        expect(screen.queryByText(/\[accountSetup\.nickname\.minLength\]/)).not.toBeInTheDocument();
      });
    });
  });

  describe('nickname availability checking', () => {
    it('checks nickname availability after user input', async () => {
      const user = userEvent.setup();
      vi.mocked(otpActions.checkNicknameAvailability).mockResolvedValue({
        available: true
      });

      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      await user.type(nicknameInput, 'testuser');
      await user.tab();

      await waitFor(() => {
        expect(otpActions.checkNicknameAvailability).toHaveBeenCalledWith('testuser', 'es');
      });
    });

    it('passes locale to checkNicknameAvailability', async () => {
      const user = userEvent.setup();
      vi.mocked(otpActions.checkNicknameAvailability).mockResolvedValue({
        available: true
      });

      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      await user.type(nicknameInput, 'testuser');
      await user.tab();

      await waitFor(() => {
        expect(otpActions.checkNicknameAvailability).toHaveBeenCalledWith('testuser', 'es');
      });
    });

    it('does not check availability for empty nickname', async () => {
      const user = userEvent.setup();
      vi.mocked(otpActions.checkNicknameAvailability).mockResolvedValue({
        available: true
      });

      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      await user.tab();

      await waitFor(() => {
        expect(otpActions.checkNicknameAvailability).not.toHaveBeenCalled();
      });
    });

    it('clears availability error when nickname is corrected', async () => {
      const user = userEvent.setup();
      // Mock returns error for "taken", then success for "available"
      // handleNicknameChange calls checkNicknameAvailability on every keystroke after 3+ chars
      // "taken" = 5 chars, so 3 calls (t-a-k, t-a-k-e, t-a-k-e-n)
      // "available" = 9 chars, so 7 calls
      vi.mocked(otpActions.checkNicknameAvailability)
        .mockResolvedValue({ available: false, error: 'Nickname taken' });

      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      await user.type(nicknameInput, 'taken');

      await waitFor(() => {
        expect(screen.getByText(/Nickname taken/i)).toBeInTheDocument();
      });

      // Correct the nickname - mock now returns available
      vi.mocked(otpActions.checkNicknameAvailability)
        .mockResolvedValue({ available: true });

      await user.clear(nicknameInput);
      await user.type(nicknameInput, 'available');

      await waitFor(() => {
        expect(screen.queryByText(/Nickname taken/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('password validation', () => {
    it('allows password with exactly 8 characters', async () => {
      const user = userEvent.setup();
      vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: true });
      vi.mocked(signIn).mockResolvedValue({ ok: true });

      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      const passwordInput = screen.getByLabelText('[accountSetup.password.label]');
      const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });

      await user.type(nicknameInput, 'validuser');
      await user.type(passwordInput, '12345678');

      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      await waitFor(() => {
        expect(otpActions.createAccountViaOTP).toHaveBeenCalledWith(
          expect.objectContaining({
            password: '12345678'
          }),
          'es'
        );
      });
    });

    it('allows empty password', async () => {
      const user = userEvent.setup();
      vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: true });
      vi.mocked(signIn).mockResolvedValue({ ok: true });

      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });

      await user.type(nicknameInput, 'validuser');

      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      await waitFor(() => {
        expect(otpActions.createAccountViaOTP).toHaveBeenCalledWith(
          expect.objectContaining({
            password: null
          }),
          'es'
        );
      });
    });

    it('disables password shorter than 8 characters during validation', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText('[accountSetup.password.label]');
      await user.type(passwordInput, 'short');

      await waitFor(() => {
        expect(screen.getByText(/\[accountSetup\.password\.minLength\]/)).toBeInTheDocument();
      });
    });

    it('shows password visibility toggle when password is entered', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText('[accountSetup.password.label]');
      expect(screen.queryByLabelText(/toggleVisibility/i)).not.toBeInTheDocument();

      await user.type(passwordInput, 'password123');

      const toggleButton = screen.getByLabelText(/toggleVisibility/i);
      expect(toggleButton).toBeInTheDocument();
    });

    it('toggles password visibility', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const passwordInput = screen.getByLabelText('[accountSetup.password.label]') as HTMLInputElement;
      await user.type(passwordInput, 'password123');

      expect(passwordInput.type).toBe('password');

      const toggleButton = screen.getByLabelText(/toggleVisibility/i);
      await user.click(toggleButton);

      expect(passwordInput.type).toBe('text');

      await user.click(toggleButton);

      expect(passwordInput.type).toBe('password');
    });
  });

  describe('form state and submission', () => {
    it('calls onSuccess callback after successful sign-in', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();
      vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: true });
      vi.mocked(signIn).mockResolvedValue({ ok: true });

      renderWithTheme(<AccountSetupForm {...defaultProps} onSuccess={mockOnSuccess} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });

      await user.type(nicknameInput, 'testuser');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows error message when sign-in fails', async () => {
      const user = userEvent.setup();
      vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: true });
      vi.mocked(signIn).mockResolvedValue({ ok: false });

      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });

      await user.type(nicknameInput, 'testuser');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/\[accountSetup\.errors\.createAndLoginFailed\]/)).toBeInTheDocument();
      });
    });

    it('shows loading state during account creation', async () => {
      const user = userEvent.setup();
      let resolveCreateAccount: any;
      vi.mocked(otpActions.createAccountViaOTP).mockImplementation(
        () => new Promise((resolve) => {
          resolveCreateAccount = resolve;
        })
      );

      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });

      await user.type(nicknameInput, 'testuser');
      await user.click(submitButton);

      // Button should show "Creando..." while loading
      expect(screen.getByRole('button', { name: /\[accountSetup\.buttons\.submitting\]/ })).toBeInTheDocument();

      resolveCreateAccount({ success: true });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: '[accountSetup.buttons.submit]' })).toBeInTheDocument();
      });
    });

    it('disables submit button when form is invalid', async () => {
      const user = userEvent.setup();
      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });
      expect(submitButton).toBeDisabled();

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      await user.type(nicknameInput, 'validuser');

      // Need to wait for nickname availability check
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('disables inputs while loading', async () => {
      const user = userEvent.setup();
      let resolveCreateAccount: any;
      vi.mocked(otpActions.createAccountViaOTP).mockImplementation(
        () => new Promise((resolve) => {
          resolveCreateAccount = resolve;
        })
      );

      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      const passwordInput = screen.getByLabelText('[accountSetup.password.label]');
      const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });
      const cancelButton = screen.getByRole('button', { name: '[accountSetup.buttons.cancel]' });

      await user.type(nicknameInput, 'testuser');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(nicknameInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(cancelButton).toBeDisabled();

      resolveCreateAccount({ success: true });

      await waitFor(() => {
        expect(nicknameInput).not.toBeDisabled();
        expect(passwordInput).not.toBeDisabled();
      });
    });
  });

  describe('error handling edge cases', () => {
    it('handles missing email gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: true });

      renderWithTheme(<AccountSetupForm email="" verifiedOTP="123456" onSuccess={vi.fn()} onCancel={vi.fn()} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });

      await user.type(nicknameInput, 'testuser');
      await user.click(submitButton);

      await waitFor(() => {
        expect(otpActions.createAccountViaOTP).toHaveBeenCalledWith(
          expect.objectContaining({
            email: ''
          }),
          'es'
        );
      });
    });

    it('shows server error message when createAccountViaOTP fails', async () => {
      const user = userEvent.setup();
      vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({
        success: false,
        error: 'Email already registered'
      });

      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });

      await user.type(nicknameInput, 'testuser');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Email already registered/i)).toBeInTheDocument();
      });
    });

    it('handles exception during account creation', async () => {
      const user = userEvent.setup();
      vi.mocked(otpActions.createAccountViaOTP).mockRejectedValue(
        new Error('Network error')
      );

      renderWithTheme(<AccountSetupForm {...defaultProps} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[accountSetup.nickname.label]' });
      const submitButton = screen.getByRole('button', { name: '[accountSetup.buttons.submit]' });

      await user.type(nicknameInput, 'testuser');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('[accountSetup.errors.createFailed]')).toBeInTheDocument();
      });
    });
  });
});

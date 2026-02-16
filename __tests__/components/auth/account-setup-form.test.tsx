import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountSetupForm from '../../../app/components/auth/account-setup-form';
import { renderWithTheme } from '../../utils/test-utils';
import * as otpActions from '../../../app/actions/otp-actions';

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
    vi.mocked(otpActions.checkNicknameAvailability).mockResolvedValue({
      available: true
    });
  });

  it('should render the form with nickname field', () => {
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    expect(screen.getByLabelText(/Nickname/i)).toBeInTheDocument();
  });

  it('should render optional password field', () => {
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    expect(screen.getByLabelText(/Contraseña \(opcional\)/i)).toBeInTheDocument();
  });

  it('should allow typing in nickname field', async () => {
    const user = userEvent.setup();
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByLabelText(/Nickname/i);
    await user.type(nicknameInput, 'testuser');

    expect(nicknameInput).toHaveValue('testuser');
  });

  it('should allow typing in password field', async () => {
    const user = userEvent.setup();
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const passwordInput = screen.getByLabelText(/Contraseña \(opcional\)/i);
    await user.type(passwordInput, 'password123');

    expect(passwordInput).toHaveValue('password123');
  });

  it('should check nickname availability on blur', async () => {
    const user = userEvent.setup();
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByLabelText(/Nickname/i);
    await user.type(nicknameInput, 'testuser');
    await user.tab(); // Trigger blur

    await waitFor(() => {
      expect(otpActions.checkNicknameAvailability).toHaveBeenCalledWith('testuser');
    });
  });

  it('should show error if nickname is not available', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.checkNicknameAvailability).mockResolvedValue({
      available: false,
      error: 'Este nickname no está disponible.'
    });

    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByLabelText(/Nickname/i);
    await user.type(nicknameInput, 'taken');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/no está disponible/i)).toBeInTheDocument();
    });
  });

  it('should render cancel button', () => {
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('should submit form with valid nickname', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: true });

    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByLabelText(/Nickname/i);
    await user.type(nicknameInput, 'validuser');

    const submitButton = screen.getByRole('button', { name: /Crear Cuenta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(otpActions.createAccountViaOTP).toHaveBeenCalledWith({
        email: 'test@example.com',
        nickname: 'validuser',
        password: null,
        verifiedOTP: '123456'
      });
    });
  });

  it('should submit form with nickname and password', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: true });

    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByLabelText(/Nickname/i);
    await user.type(nicknameInput, 'validuser');

    const passwordInput = screen.getByLabelText(/Contraseña \(opcional\)/i);
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /Crear Cuenta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(otpActions.createAccountViaOTP).toHaveBeenCalledWith({
        email: 'test@example.com',
        nickname: 'validuser',
        password: 'password123',
        verifiedOTP: '123456'
      });
    });
  });

  it('should show error message on submission failure', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({
      success: false,
      error: 'Error al crear la cuenta'
    });

    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByLabelText(/Nickname/i);
    await user.type(nicknameInput, 'validuser');

    const submitButton = screen.getByRole('button', { name: /Crear Cuenta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Error al crear la cuenta/i)).toBeInTheDocument();
    });
  });

  it('should render submit button', () => {
    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Crear Cuenta/i })).toBeInTheDocument();
  });

  it('should trim whitespace from nickname', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.createAccountViaOTP).mockResolvedValue({ success: true });

    renderWithTheme(<AccountSetupForm {...defaultProps} />);

    const nicknameInput = screen.getByLabelText(/Nickname/i);
    await user.type(nicknameInput, '  testuser  ');

    const submitButton = screen.getByRole('button', { name: /Crear Cuenta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(otpActions.createAccountViaOTP).toHaveBeenCalledWith(
        expect.objectContaining({ nickname: 'testuser' })
      );
    });
  });
});

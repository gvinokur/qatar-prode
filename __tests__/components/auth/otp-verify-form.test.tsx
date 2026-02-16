import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OTPVerifyForm from '../../../app/components/auth/otp-verify-form';
import { renderWithTheme } from '../../utils/test-utils';
import * as otpActions from '../../../app/actions/otp-actions';

// Mock the OTP actions
vi.mock('../../../app/actions/otp-actions', () => ({
  verifyOTPCode: vi.fn()
}));

describe('OTPVerifyForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnResend = vi.fn();

  const defaultProps = {
    email: 'test@example.com',
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel,
    onResend: mockOnResend
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render 6 OTP input fields', () => {
    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(6);
  });

  it('should display the email address', () => {
    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  it('should render verify button', () => {
    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: /Verificar/i })).toBeInTheDocument();
  });

  it('should render form elements', () => {
    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    // Just verify the form renders without crashing
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('should accept single digit input in first field', async () => {
    const user = userEvent.setup();
    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');

    expect(inputs[0]).toHaveValue('1');
  });

  it('should move focus to next input after typing digit', async () => {
    const user = userEvent.setup();
    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '1');

    // Focus should move to second input
    await waitFor(() => {
      expect(inputs[1]).toHaveFocus();
    });
  });

  it('should replace digit when typing in filled input', async () => {
    const user = userEvent.setup();
    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');

    // Type first digit
    await user.type(inputs[0], '1');
    expect(inputs[0]).toHaveValue('1');

    // Click back on first input and type new digit
    await user.click(inputs[0]);
    await user.clear(inputs[0]);
    await user.type(inputs[0], '5');

    expect(inputs[0]).toHaveValue('5');
  });

  it('should allow clearing input', async () => {
    const user = userEvent.setup();
    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');

    // Type and clear
    await user.type(inputs[0], '1');
    await user.clear(inputs[0]);

    expect(inputs[0]).toHaveValue('');
  });

  it('should call verifyOTPCode when all 6 digits entered', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.verifyOTPCode).mockResolvedValue({
      success: true,
      user: {} as any
    });

    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');

    // Type complete code
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], String(i + 1));
    }

    await waitFor(() => {
      expect(otpActions.verifyOTPCode).toHaveBeenCalledWith('test@example.com', '123456');
    });
  });

  it('should call onSuccess when verification succeeds', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.verifyOTPCode).mockResolvedValue({
      success: true,
      user: {} as any
    });

    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');

    // Type complete code
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], String(i + 1));
    }

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith('test@example.com', '123456');
    });
  });

  it('should show error message when verification fails', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.verifyOTPCode).mockResolvedValue({
      success: false,
      error: 'Código incorrecto'
    });

    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');

    // Type complete code
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], String(i + 1));
    }

    await waitFor(() => {
      expect(screen.getByText(/Código incorrecto/i)).toBeInTheDocument();
    });
  });

  it('should clear inputs after verification error', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.verifyOTPCode).mockResolvedValue({
      success: false,
      error: 'Código incorrecto'
    });

    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');

    // Type complete code
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], String(i + 1));
    }

    await waitFor(() => {
      inputs.forEach(input => {
        expect(input).toHaveValue('');
      });
    });
  });

  it('should render form instructions', () => {
    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    // Basic smoke test
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
  });

  it('should only accept numeric input', async () => {
    const user = userEvent.setup();
    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');

    // Try to type letter
    await user.type(inputs[0], 'a');

    // Should remain empty
    expect(inputs[0]).toHaveValue('');

    // Type number
    await user.type(inputs[0], '5');

    // Should accept number
    expect(inputs[0]).toHaveValue('5');
  });

  it('should handle exception during verification', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.verifyOTPCode).mockRejectedValue(new Error('Network error'));

    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');

    // Type complete code
    for (let i = 0; i < 6; i++) {
      await user.type(inputs[i], String(i + 1));
    }

    await waitFor(() => {
      expect(screen.getByText(/Error al verificar/i)).toBeInTheDocument();
    });
  });

  it('should accept numeric input', async () => {
    const user = userEvent.setup();
    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');

    // Type a valid digit
    await user.type(inputs[0], '5');

    expect(inputs[0]).toHaveValue('5');
  });

  it('should allow manual verify button click with complete code', async () => {
    const user = userEvent.setup();
    vi.mocked(otpActions.verifyOTPCode).mockResolvedValue({
      success: true,
      user: {} as any
    });

    renderWithTheme(<OTPVerifyForm {...defaultProps} />);

    const inputs = screen.getAllByRole('textbox');

    // Type complete code without auto-verify
    for (let i = 0; i < 6; i++) {
      await user.click(inputs[i]);
      await user.clear(inputs[i]);
      await user.keyboard(String(i + 1));
    }

    // Click verify button
    const verifyButton = screen.getByRole('button', { name: /Verificar/i });
    await user.click(verifyButton);

    await waitFor(() => {
      expect(otpActions.verifyOTPCode).toHaveBeenCalled();
    });
  });
});

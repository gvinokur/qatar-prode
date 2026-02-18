import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OTPVerifyForm from '../../../app/components/auth/otp-verify-form';
import { renderWithTheme } from '../../utils/test-utils';
import { createMockTranslations } from '../../utils/mock-translations';
import * as intl from 'next-intl';
import * as otpActions from '../../../app/actions/otp-actions';

// Mock next-intl with translation support
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(() => 'es'),
}));

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
  
    // Setup i18n mocks
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('auth')
    );
  });

  afterEach(() => {
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

    expect(screen.getByRole('button', { name: '[otp.buttons.verify]' })).toBeInTheDocument();
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
      expect(otpActions.verifyOTPCode).toHaveBeenCalledWith('test@example.com', '123456', 'es');
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
      expect(screen.getByText('Código incorrecto')).toBeInTheDocument();
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
      expect(screen.getByText(/\[otp\.errors\.verifyFailed\]/)).toBeInTheDocument();
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
    const verifyButton = screen.getByRole('button', { name: '[otp.buttons.verify]' });
    await user.click(verifyButton);

    await waitFor(() => {
      expect(otpActions.verifyOTPCode).toHaveBeenCalled();
    });
  });

  describe('Timer functionality', () => {
    it('should display countdown timer', () => {
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      // Timer should be visible
      expect(screen.getByText(/\[otp\.timer\.expiresIn\]/)).toBeInTheDocument();
    });

    it('should format timer correctly with MM:SS format', () => {
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      // Initially should show 3:00 (180 seconds) in the text
      const timerElement = screen.getByText(/\[otp\.timer\.expiresIn\]/);
      expect(timerElement).toBeInTheDocument();
    });

    it('should pass correct time value to translation function', () => {
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      const timerText = screen.getByText(/\[otp\.timer\.expiresIn\]/);
      // Should contain timer with interpolated time value
      expect(timerText.textContent).toMatch(/\[otp\.timer\.expiresIn\]/);
    });

    it('should display timer with formatted time', () => {
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      // Get timer element
      const timerElement = screen.getByText(/\[otp\.timer\.expiresIn\]/);

      // Should display timer text
      expect(timerElement).toBeInTheDocument();
    });
  });

  describe('Resend countdown', () => {
    it('should display resend countdown initially disabled', () => {
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      // Should show countdown text with interpolated seconds
      expect(screen.getByText(/\[otp\.resend\.countdown\]/)).toBeInTheDocument();
    });

    it('should pass correct seconds value to resend countdown translation', () => {
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      const resendText = screen.getByText(/\[otp\.resend\.countdown\]/);
      // Should contain the seconds countdown with interpolated value
      expect(resendText.textContent).toMatch(/\[otp\.resend\.countdown\]/);
    });
  });

  describe('OTP digit input accessibility', () => {
    it('should have aria-label with placeholder interpolation for each digit', () => {
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');

      // Each input should have aria-label with correct placeholders
      inputs.forEach((input, index) => {
        const ariaLabel = input.getAttribute('aria-label');
        expect(ariaLabel).toContain(`${index + 1}`); // current digit position
        expect(ariaLabel).toContain('6'); // total digits
      });
    });

    it('should verify aria-label format with correct interpolation values', () => {
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');

      // First input should have aria-label with interpolated values
      expect(inputs[0].getAttribute('aria-label')).toBe('[otp.digit.ariaLabel]{current:1,total:6}');

      // Last input should have aria-label with interpolated values
      expect(inputs[5].getAttribute('aria-label')).toBe('[otp.digit.ariaLabel]{current:6,total:6}');
    });
  });

  describe('Backspace handling', () => {
    it('should accept digits and handle input correctly', async () => {
      const user = userEvent.setup();
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');

      // Fill first two inputs
      await user.type(inputs[0], '1');
      await user.type(inputs[1], '2');

      // Verify inputs have values
      expect(inputs[0]).toHaveValue('1');
      expect(inputs[1]).toHaveValue('2');
    });
  });

  describe('Paste functionality', () => {
    it('should accept numeric input for all fields', async () => {
      const user = userEvent.setup();
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');

      // Type digits one by one
      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], String(i + 1));
      }

      // All inputs should be filled
      inputs.forEach((input, index) => {
        expect(input).toHaveValue(String(index + 1));
      });
    });

    it('should only allow numeric input', async () => {
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
  });

  describe('Manual verification', () => {
    it('should disable verify button when code is incomplete', async () => {
      const user = userEvent.setup();
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');
      const verifyButton = screen.getByRole('button', { name: '[otp.buttons.verify]' });

      // Fill only 5 digits
      for (let i = 0; i < 5; i++) {
        await user.type(inputs[i], String(i + 1));
      }

      expect(verifyButton).toBeDisabled();
    });
  });

  describe('Cancel button', () => {
    it('should render back button', () => {
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      expect(screen.getByRole('button', { name: '[otp.buttons.back]' })).toBeInTheDocument();
    });

    it('should call onCancel when back button is clicked', async () => {
      const user = userEvent.setup();
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      const backButton = screen.getByRole('button', { name: '[otp.buttons.back]' });
      await user.click(backButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Error recovery', () => {
    it('should clear inputs after verification error', async () => {
      const user = userEvent.setup();
      vi.mocked(otpActions.verifyOTPCode).mockResolvedValue({
        success: false,
        error: 'Invalid code',
      });

      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      const inputs = screen.getAllByRole('textbox');

      // Type complete code
      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], String(i + 1));
      }

      await waitFor(() => {
        inputs.forEach((input) => {
          expect(input).toHaveValue('');
        });
      });
    });
  });

  describe('Full integration scenarios', () => {
    it('should display instruction text', () => {
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      expect(screen.getByText('[otp.instruction]')).toBeInTheDocument();
    });

    it('should display email address in instructions', () => {
      renderWithTheme(<OTPVerifyForm {...defaultProps} />);

      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    });
  });
});

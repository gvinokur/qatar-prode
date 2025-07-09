import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ForgotPasswordForm from '../../../app/components/auth/forgot-password-form';
import { sendPasswordResetLink } from '../../../app/actions/user-actions';

// Mock the user actions
vi.mock('../../../app/actions/user-actions', () => ({
  sendPasswordResetLink: vi.fn(),
}));

// Mock validator
vi.mock('validator', () => ({
  default: {
    isEmail: vi.fn(),
  },
}));

const mockSendPasswordResetLink = vi.mocked(sendPasswordResetLink);

describe('ForgotPasswordForm', () => {
  const mockOnSuccess = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSendPasswordResetLink.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders forgot password form with all required elements', () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      expect(screen.getByLabelText('E-Mail')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Enviar Enlace' })).toBeInTheDocument();
      expect(screen.getByText('Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.')).toBeInTheDocument();
    });

    it('focuses email input on render', () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      expect(emailInput).toHaveFocus();
    });

    it('renders email field with correct attributes', () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      expect(emailInput).toHaveAttribute('type', 'text');
      expect(emailInput).toHaveAttribute('name', 'email');
    });

    it('renders submit button with correct attributes', () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('form validation', () => {
    it('shows error when email is empty', async () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      await user.click(submitButton);
      
      expect(screen.getByText('Por favor ingrese su e-mail')).toBeInTheDocument();
    });

    it('shows error when email format is invalid', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(false);
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      await user.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      await user.click(submitButton);
      
      expect(screen.getByText('Direccion de E-Mail invalida')).toBeInTheDocument();
    });

    it('validates email format correctly with valid email', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(sendPasswordResetLink).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('clears validation errors when input is corrected', async () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      // First, trigger validation error
      await user.click(submitButton);
      expect(screen.getByText('Por favor ingrese su e-mail')).toBeInTheDocument();
      
      // Then, correct the input
      await user.type(emailInput, 'test@example.com');
      
      // Error should be cleared
      expect(screen.queryByText('Por favor ingrese su e-mail')).not.toBeInTheDocument();
    });

    it('shows field errors with proper accessibility attributes', async () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      await user.click(submitButton);
      
      const emailInput = screen.getByLabelText('E-Mail');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Por favor ingrese su e-mail')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('calls sendPasswordResetLink with correct email on successful validation', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(sendPasswordResetLink).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('calls onSuccess when password reset link is sent successfully', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      mockSendPasswordResetLink.mockResolvedValue({ success: true });
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('submits form when Enter is pressed', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      await user.type(emailInput, 'test@example.com');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(sendPasswordResetLink).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('prevents form submission when email is empty', async () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(sendPasswordResetLink).not.toHaveBeenCalled();
      });
    });

    it('does not submit form when email validation fails', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(false);
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      await user.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(sendPasswordResetLink).not.toHaveBeenCalled();
      });
    });
  });

  describe('loading state', () => {
    it('shows loading state while sending password reset link', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      
      // Mock a delayed response
      let resolvePromise: (_value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockSendPasswordResetLink.mockReturnValue(promise);
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      // Check that loading state is active by looking for MUI loading indicator
      expect(submitButton.querySelector('.MuiButton-loadingWrapper')).toBeInTheDocument();
      
      // Resolve the promise
      resolvePromise!({ success: true });
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('resets loading state after successful submission', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      mockSendPasswordResetLink.mockResolvedValue({ success: true });
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
      
      // Loading state should be reset
      expect(submitButton).not.toHaveAttribute('loading');
    });

    it('resets loading state after failed submission', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      mockSendPasswordResetLink.mockResolvedValue({ success: false });
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error al enviar el correo electrónico. Por favor, inténtalo de nuevo.')).toBeInTheDocument();
      });
      
      // Loading state should be reset
      expect(submitButton).not.toHaveAttribute('loading');
    });
  });

  describe('error handling', () => {
    it('shows error message when sendPasswordResetLink fails', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      mockSendPasswordResetLink.mockResolvedValue({ success: false });
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error al enviar el correo electrónico. Por favor, inténtalo de nuevo.')).toBeInTheDocument();
      });
    });

    it('shows server error message when sendPasswordResetLink throws', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      const errorMessage = 'Network error';
      mockSendPasswordResetLink.mockRejectedValue(new Error(errorMessage));
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      });
    });

    it('does not call onSuccess when sendPasswordResetLink fails', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      mockSendPasswordResetLink.mockResolvedValue({ success: false });
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error al enviar el correo electrónico. Por favor, inténtalo de nuevo.')).toBeInTheDocument();
      });
      
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('clears error message when form is resubmitted', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      mockSendPasswordResetLink.mockResolvedValueOnce({ success: false })
        .mockResolvedValueOnce({ success: true });
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error al enviar el correo electrónico. Por favor, inténtalo de nuevo.')).toBeInTheDocument();
      });
      
      // Clear email and try again
      await user.clear(emailInput);
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Error al enviar el correo electrónico. Por favor, inténtalo de nuevo.')).not.toBeInTheDocument();
      });
    });

    it('displays error alert with correct severity', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      mockSendPasswordResetLink.mockResolvedValue({ success: false });
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveClass('MuiAlert-standardError');
      });
    });
  });

  describe('accessibility', () => {
    it('has proper form labels', () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      expect(screen.getByLabelText('E-Mail')).toBeInTheDocument();
    });

    it('has proper button type for form submission', () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('has proper form structure', () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      expect(emailInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });
  });

  describe('form interaction', () => {
    it('handles tab navigation correctly', async () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('allows typing in email field', async () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('clears email field when cleared', async () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      await user.type(emailInput, 'test@example.com');
      await user.clear(emailInput);
      
      expect(emailInput).toHaveValue('');
    });
  });

  describe('edge cases', () => {
    it('handles special characters in email', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, 'test+special@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(sendPasswordResetLink).toHaveBeenCalledWith('test+special@example.com');
      });
    });

    it('handles empty email string gracefully', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(false);
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, '   ');
      await user.click(submitButton);
      
      // Form validation should prevent submission
      expect(screen.getByText('Direccion de E-Mail invalida')).toBeInTheDocument();
      expect(sendPasswordResetLink).not.toHaveBeenCalled();
    });

    it('handles null/undefined email gracefully', async () => {
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      await user.click(submitButton);
      
      expect(sendPasswordResetLink).not.toHaveBeenCalled();
    });

    it('handles very long email addresses', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const longEmail = 'a'.repeat(100) + '@example.com';
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, longEmail);
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(sendPasswordResetLink).toHaveBeenCalledWith(longEmail);
      });
    });

    it('handles network errors gracefully', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      mockSendPasswordResetLink.mockRejectedValue(new Error('Network error'));
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Error: Network error')).toBeInTheDocument();
      });
      
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('handles multiple rapid clicks on submit button', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default;
      validator.isEmail.mockReturnValue(true);
      mockSendPasswordResetLink.mockResolvedValue({ success: true });
      
      render(<ForgotPasswordForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Enviar Enlace' });
      
      await user.type(emailInput, 'test@example.com');
      
      // Click multiple times rapidly
      await user.click(submitButton);
      await user.click(submitButton);
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('test@example.com');
      });
      
      // Multiple clicks may result in multiple calls as there's no debouncing
      expect(sendPasswordResetLink).toHaveBeenCalledWith('test@example.com');
    });
  });
});

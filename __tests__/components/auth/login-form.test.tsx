import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import LoginForm from '../../../app/components/auth/login-form';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

// Mock validator
vi.mock('validator', () => ({
  default: {
    isEmail: vi.fn(),
  },
}));

const mockRouter = {
  push: vi.fn(),
  refresh: vi.fn(),
};

const mockSearchParams = {
  get: vi.fn(),
};

describe('LoginForm', () => {
  const mockOnSuccess = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useRouter as any).mockReturnValue(mockRouter);
    (useSearchParams as any).mockReturnValue(mockSearchParams);
    (signIn as any).mockResolvedValue({ ok: true });
    
    // Reset search params mock
    mockSearchParams.get.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders login form with all required fields', () => {
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      expect(screen.getByLabelText('E-Mail')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
    });

    it('renders verification success message when verified param is true', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'verified') return 'true';
        return null;
      });
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      expect(screen.getByText('¡Tu correo electrónico ha sido verificado exitosamente! Ahora puedes iniciar sesión.')).toBeInTheDocument();
    });

    it('does not render verification message when verified param is false', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'verified') return 'false';
        return null;
      });
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      expect(screen.queryByText('¡Tu correo electrónico ha sido verificado exitosamente! Ahora puedes iniciar sesión.')).not.toBeInTheDocument();
    });

    it('does not render verification message when verified param is not present', () => {
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      expect(screen.queryByText('¡Tu correo electrónico ha sido verificado exitosamente! Ahora puedes iniciar sesión.')).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('shows error when email is empty', async () => {
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      await user.click(submitButton);
      
      expect(screen.getByText('Por favor ingrese su e-mail')).toBeInTheDocument();
    });

    it('shows error when password is empty', async () => {
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      await user.type(emailInput, 'test@example.com');
      
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      await user.click(submitButton);
      
      expect(screen.getByText('Ingrese su contraseña')).toBeInTheDocument();
    });

    it('shows error when email format is invalid', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default as { isEmail: ReturnType<typeof vi.fn> };
      validator.isEmail.mockReturnValue(false);
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      await user.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      await user.click(submitButton);
      
      expect(screen.getByText('Direccion de E-Mail invalida')).toBeInTheDocument();
    });

    it('validates email format correctly with valid email', async () => {
      const validator = vi.mocked(await vi.importMock('validator')).default as { isEmail: ReturnType<typeof vi.fn> };
      validator.isEmail.mockReturnValue(true);
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(signIn).toHaveBeenCalled();
      });
    });

    it('clears validation errors when input is corrected', async () => {
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
      // First, trigger validation error
      await user.click(submitButton);
      expect(screen.getByText('Por favor ingrese su e-mail')).toBeInTheDocument();
      
      // Then, correct the input
      await user.type(emailInput, 'test@example.com');
      
      // Error should be cleared
      expect(screen.queryByText('Por favor ingrese su e-mail')).not.toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('calls signIn with correct credentials on successful validation', async () => {
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
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
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('refreshes router on successful login', async () => {
      (signIn as any).mockResolvedValue({ ok: true });
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
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
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('does not redirect when callback URL is not present', async () => {
      (signIn as any).mockResolvedValue({ ok: true });
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
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
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email o Contraseña Invalida')).toBeInTheDocument();
      });
    });

    it('shows server error message when signIn throws', async () => {
      const errorMessage = 'Network error';
      (signIn as any).mockRejectedValue(new Error(errorMessage));
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      });
    });

    it('does not call onSuccess when login fails', async () => {
      (signIn as any).mockResolvedValue({ ok: false });
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email o Contraseña Invalida')).toBeInTheDocument();
      });
      
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('clears error message when form is resubmitted', async () => {
      (signIn as any).mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true });
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email o Contraseña Invalida')).toBeInTheDocument();
      });
      
      // Clear password and try again
      await user.clear(passwordInput);
      await user.type(passwordInput, 'correctpassword');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Email o Contraseña Invalida')).not.toBeInTheDocument();
      });
    });
  });

  describe('form interaction', () => {
    it('focuses email input on render', () => {
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      expect(emailInput).toHaveFocus();
    });

    it('submits form when Enter is pressed', async () => {
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(signIn).toHaveBeenCalled();
      });
    });

    it('handles tab navigation correctly', async () => {
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(passwordInput).toHaveFocus();
      
      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });

  describe('accessibility', () => {
    it('has proper form labels', () => {
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      expect(screen.getByLabelText('E-Mail')).toBeInTheDocument();
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    });

    it('shows field errors with proper accessibility attributes', async () => {
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      await user.click(submitButton);
      
      const emailInput = screen.getByLabelText('E-Mail');
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Por favor ingrese su e-mail')).toBeInTheDocument();
    });

    it('has proper button type for form submission', () => {
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
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
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
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
      
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
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
      render(<LoginForm onSuccess={mockOnSuccess} />);
      
      const emailInput = screen.getByLabelText('E-Mail');
      const passwordInput = screen.getByLabelText('Contraseña');
      const submitButton = screen.getByRole('button', { name: 'Ingresar' });
      
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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailInputForm from '../../../app/components/auth/email-input-form';
import { renderWithTheme } from '../../utils/test-utils';
import { checkAuthMethods } from '../../../app/actions/oauth-actions';
import { signIn } from 'next-auth/react';

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

  describe('Rendering', () => {
    it('renders email input field', () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
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

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('clears email input when user types', async () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test');
      await user.clear(emailInput);
      await user.type(emailInput, 'new@example.com');

      expect(emailInput).toHaveValue('new@example.com');
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

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(checkAuthMethods).toHaveBeenCalledWith('test@example.com');
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

      const emailInput = screen.getByLabelText(/email/i);
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

      const emailInput = screen.getByLabelText(/email/i);
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

      const emailInput = screen.getByLabelText(/email/i);
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
    it.skip('shows error message when checkAuthMethods fails', async () => {
      vi.mocked(checkAuthMethods).mockResolvedValue({
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: false,
        error: 'Email is required'
      });

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'invalid');
      await user.click(submitButton);

      // Wait for the action to be called
      await waitFor(() => {
        expect(checkAuthMethods).toHaveBeenCalled();
      });

      // Then check for the error message
      const errorMessage = await screen.findByText('Email is required', {}, { timeout: 3000 });
      expect(errorMessage).toBeInTheDocument();
      expect(mockOnEmailSubmit).not.toHaveBeenCalled();
    });

    it('shows generic error when checkAuthMethods fails without error message', async () => {
      vi.mocked(checkAuthMethods).mockResolvedValue({
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: false
      });

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
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

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      const errorMessage = await screen.findByText('Error al verificar el email');
      expect(errorMessage).toBeInTheDocument();
      expect(mockOnEmailSubmit).not.toHaveBeenCalled();
    });

    it.skip('clears previous error when form is resubmitted', async () => {
      // First mock the failure
      vi.mocked(checkAuthMethods).mockResolvedValue({
        hasPassword: false,
        hasGoogle: false,
        userExists: false,
        success: false,
        error: 'Email is required'
      });

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
      const submitButton = screen.getByRole('button', { name: /continuar$/i });

      // First submission - should fail
      await user.type(emailInput, 'invalid');
      await user.click(submitButton);

      const errorMessage = await screen.findByText('Email is required');
      expect(errorMessage).toBeInTheDocument();

      // Now mock the success for second submission
      vi.mocked(checkAuthMethods).mockResolvedValue({
        hasPassword: true,
        hasGoogle: false,
        userExists: true,
        success: true
      });

      // Second submission - should succeed and clear error
      await user.clear(emailInput);
      await user.type(emailInput, 'valid@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
      });
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
        expect(screen.getByText('Error al iniciar sesión con Google')).toBeInTheDocument();
      });
    });

    it('disables buttons while Google sign-in is in progress', async () => {
      vi.mocked(signIn).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(undefined as any), 100))
      );

      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
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

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeRequired();
    });

    it('has proper email input type', () => {
      renderWithTheme(<EmailInputForm onEmailSubmit={mockOnEmailSubmit} />);

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });
  });
});

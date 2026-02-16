import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginOrSignupDialog from '../../../app/components/auth/login-or-signup-dialog';
import { User } from '../../../app/db/tables-definition';
import { renderWithTheme } from '../../utils/test-utils';
import { createMockRouter } from '../../mocks/next-navigation.mocks';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Dialog: ({ children, open, onClose }: any) => (
      open ? (
        <div data-testid="dialog">
          <div data-testid="dialog-backdrop" onClick={onClose} />
          {children}
        </div>
      ) : null
    ),
    DialogTitle: ({ children }: any) => (
      <div data-testid="dialog-title">{children}</div>
    ),
    DialogContent: ({ children }: any) => (
      <div data-testid="dialog-content">{children}</div>
    ),
    DialogActions: ({ children }: any) => (
      <div data-testid="dialog-actions">{children}</div>
    ),
    Typography: ({ children, onClick }: any) => (
      <span onClick={onClick}>{children}</span>
    ),
    Button: ({ children, onClick }: any) => (
      <button onClick={onClick}>{children}</button>
    ),
  };
});

// Mock child form components
vi.mock('../../../app/components/auth/login-form', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="login-form">
      <button data-testid="login-submit" onClick={onSuccess}>
        Login
      </button>
    </div>
  ),
}));

vi.mock('../../../app/components/auth/signup-form', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: (_user: User) => void }) => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      nickname: 'testuser',
      password_hash: 'hash',
      is_admin: false,
      email_verified: false,
      verification_token: null,
      verification_token_expiration: null,
      reset_token: null,
      reset_token_expiration: null,
      notification_subscriptions: null,
      onboarding_completed: false,
      onboarding_completed_at: null,
      onboarding_data: null,
    };
    return (
      <div data-testid="signup-form">
        <button data-testid="signup-submit" onClick={() => onSuccess(mockUser)}>
          Signup
        </button>
      </div>
    );
  },
}));

vi.mock('../../../app/components/auth/forgot-password-form', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: (_email: string) => void }) => (
    <div data-testid="forgot-password-form">
      <button data-testid="forgot-password-submit" onClick={() => onSuccess('test@example.com')}>
        Send Reset
      </button>
    </div>
  ),
}));

vi.mock('../../../app/components/auth/reset-sent-view', () => ({
  __esModule: true,
  default: ({ email }: { email: string }) => (
    <div data-testid="reset-sent-view">Reset sent to {email}</div>
  ),
}));

vi.mock('../../../app/components/auth/verification-sent-view', () => ({
  __esModule: true,
  default: ({ user }: { user?: User }) => (
    <div data-testid="verification-sent-view">Verification sent to {user?.email}</div>
  ),
}));

// Mock EmailInputForm to allow controlled testing
let mockEmailSubmitFn: ((_email: string, _methods: any) => void) | null = null;
vi.mock('../../../app/components/auth/email-input-form', () => ({
  __esModule: true,
  default: ({ onEmailSubmit }: { onEmailSubmit: (_email: string, _methods: any) => void }) => {
    mockEmailSubmitFn = onEmailSubmit;
    return (
      <div data-testid="email-input-form">
        <button
          data-testid="submit-email-existing-user"
          onClick={() => onEmailSubmit('existing@example.com', { hasPassword: true, hasGoogle: false, userExists: true })}
        >
          Submit (Existing User)
        </button>
        <button
          data-testid="submit-email-new-user"
          onClick={() => onEmailSubmit('new@example.com', { hasPassword: false, hasGoogle: false, userExists: false })}
        >
          Submit (New User)
        </button>
      </div>
    );
  },
}));

const mockProps = {
  handleCloseLoginDialog: vi.fn(),
  openLoginDialog: true,
};

describe('LoginOrSignupDialog - Progressive Disclosure Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEmailSubmitFn = null;
    // Mock useRouter
    vi.mocked(useRouter).mockReturnValue(createMockRouter());
  });

  describe('Initial State', () => {
    it('shows email input form by default', () => {
      renderWithTheme(<LoginOrSignupDialog {...mockProps} />);

      expect(screen.getByTestId('email-input-form')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Ingresar o Registrarse');
    });

    it('does not render when closed', () => {
      renderWithTheme(<LoginOrSignupDialog {...mockProps} openLoginDialog={false} />);

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Progressive Disclosure - Existing User Flow', () => {
    it('shows login form after submitting email for existing user', async () => {
      renderWithTheme(<LoginOrSignupDialog {...mockProps} />);

      fireEvent.click(screen.getByTestId('submit-email-existing-user'));

      await waitFor(() => {
        expect(screen.getByTestId('login-form')).toBeInTheDocument();
      });
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Ingresar');
    });

    it('shows back to email link in login mode', async () => {
      renderWithTheme(<LoginOrSignupDialog {...mockProps} />);

      fireEvent.click(screen.getByTestId('submit-email-existing-user'));

      await waitFor(() => {
        expect(screen.getByText('← Volver a email')).toBeInTheDocument();
      });
    });

    it('can navigate back to email input from login', async () => {
      renderWithTheme(<LoginOrSignupDialog {...mockProps} />);

      fireEvent.click(screen.getByTestId('submit-email-existing-user'));
      await waitFor(() => expect(screen.getByTestId('login-form')).toBeInTheDocument());

      fireEvent.click(screen.getByText('← Volver a email'));

      await waitFor(() => {
        expect(screen.getByTestId('email-input-form')).toBeInTheDocument();
      });
    });
  });

  describe('Progressive Disclosure - New User Flow', () => {
    it('shows signup form after submitting email for new user', async () => {
      renderWithTheme(<LoginOrSignupDialog {...mockProps} />);

      fireEvent.click(screen.getByTestId('submit-email-new-user'));

      await waitFor(() => {
        expect(screen.getByTestId('signup-form')).toBeInTheDocument();
      });
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Registrarse');
    });

    it('can navigate back to email input from signup', async () => {
      renderWithTheme(<LoginOrSignupDialog {...mockProps} />);

      fireEvent.click(screen.getByTestId('submit-email-new-user'));
      await waitFor(() => expect(screen.getByTestId('signup-form')).toBeInTheDocument());

      fireEvent.click(screen.getByText('← Volver a email'));

      await waitFor(() => {
        expect(screen.getByTestId('email-input-form')).toBeInTheDocument();
      });
    });
  });

  describe('Forgot Password Flow', () => {
    it('can navigate to forgot password from login', async () => {
      renderWithTheme(<LoginOrSignupDialog {...mockProps} />);

      fireEvent.click(screen.getByTestId('submit-email-existing-user'));
      await waitFor(() => expect(screen.getByTestId('login-form')).toBeInTheDocument());

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));

      await waitFor(() => {
        expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
        expect(screen.getByTestId('dialog-title')).toHaveTextContent('Recuperar Contraseña');
      });
    });

    it('shows reset sent view after submitting forgot password', async () => {
      renderWithTheme(<LoginOrSignupDialog {...mockProps} />);

      fireEvent.click(screen.getByTestId('submit-email-existing-user'));
      await waitFor(() => expect(screen.getByTestId('login-form')).toBeInTheDocument());

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      await waitFor(() => expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument());

      fireEvent.click(screen.getByTestId('forgot-password-submit'));

      await waitFor(() => {
        expect(screen.getByTestId('reset-sent-view')).toBeInTheDocument();
        expect(screen.getByText('Reset sent to test@example.com')).toBeInTheDocument();
      });
    });
  });

  describe('Success Flows', () => {
    it('closes dialog after successful login', async () => {
      renderWithTheme(<LoginOrSignupDialog {...mockProps} />);

      fireEvent.click(screen.getByTestId('submit-email-existing-user'));
      await waitFor(() => expect(screen.getByTestId('login-form')).toBeInTheDocument());

      fireEvent.click(screen.getByTestId('login-submit'));

      expect(mockProps.handleCloseLoginDialog).toHaveBeenCalledWith(true);
    });

    it('shows verification sent view after signup', async () => {
      renderWithTheme(<LoginOrSignupDialog {...mockProps} />);

      fireEvent.click(screen.getByTestId('submit-email-new-user'));
      await waitFor(() => expect(screen.getByTestId('signup-form')).toBeInTheDocument());

      fireEvent.click(screen.getByTestId('signup-submit'));

      await waitFor(() => {
        expect(screen.getByTestId('verification-sent-view')).toBeInTheDocument();
        expect(screen.getByText('Verification sent to test@example.com')).toBeInTheDocument();
      });
    });

    it('closes dialog with user created flag after signup', async () => {
      renderWithTheme(<LoginOrSignupDialog {...mockProps} />);

      fireEvent.click(screen.getByTestId('submit-email-new-user'));
      await waitFor(() => expect(screen.getByTestId('signup-form')).toBeInTheDocument());

      fireEvent.click(screen.getByTestId('signup-submit'));
      await waitFor(() => expect(screen.getByTestId('verification-sent-view')).toBeInTheDocument());

      fireEvent.click(screen.getByTestId('dialog-backdrop'));

      expect(mockProps.handleCloseLoginDialog).toHaveBeenCalledWith(true);
    });
  });

  describe('Dialog Close Behavior', () => {
    it('closes without user created flag when closing from email input', () => {
      renderWithTheme(<LoginOrSignupDialog {...mockProps} />);

      fireEvent.click(screen.getByTestId('dialog-backdrop'));

      expect(mockProps.handleCloseLoginDialog).toHaveBeenCalledWith(false);
    });

    it('resets to email input when reopened', async () => {
      const { rerender } = renderWithTheme(<LoginOrSignupDialog {...mockProps} />);

      // Navigate to login
      fireEvent.click(screen.getByTestId('submit-email-existing-user'));
      await waitFor(() => expect(screen.getByTestId('login-form')).toBeInTheDocument());

      // Close dialog
      fireEvent.click(screen.getByTestId('dialog-backdrop'));

      // Reopen dialog
      rerender(<LoginOrSignupDialog {...mockProps} openLoginDialog={true} />);

      // Should be back to email input
      expect(screen.getByTestId('email-input-form')).toBeInTheDocument();
    });
  });
});

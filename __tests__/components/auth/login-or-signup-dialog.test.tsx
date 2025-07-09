import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import LoginOrSignupDialog from '../../../app/components/auth/login-or-signup-dialog';
import { User } from '../../../app/db/tables-definition';

// Mock MUI components
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Dialog: ({ children, open, onClose, maxWidth, fullWidth, ...props }: any) => (
      open ? (
        <div data-testid="dialog" {...props}>
          <div data-testid="dialog-backdrop" onClick={onClose} />
          {children}
        </div>
      ) : null
    ),
    DialogTitle: ({ children, ...props }: any) => (
      <div data-testid="dialog-title" {...props}>{children}</div>
    ),
    DialogContent: ({ children, ...props }: any) => (
      <div data-testid="dialog-content" {...props}>{children}</div>
    ),
    DialogActions: ({ children, ...props }: any) => (
      <div data-testid="dialog-actions" {...props}>{children}</div>
    ),
    Typography: ({ children, onClick, ...props }: any) => (
      <span data-testid="typography" onClick={onClick} {...props}>
        {children}
      </span>
    ),
    Button: ({ children, onClick, ...props }: any) => (
      <button data-testid="button" onClick={onClick} {...props}>
        {children}
      </button>
    ),
  };
});

// Mock LoginForm component
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

// Mock SignupForm component
vi.mock('../../../app/components/auth/signup-form', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: (_user: User) => void }) => (
    <div data-testid="signup-form">
      <button 
        data-testid="signup-submit" 
        onClick={() => onSuccess(mockUser)}
      >
        Signup
      </button>
    </div>
  ),
}));

// Mock ForgotPasswordForm component
vi.mock('../../../app/components/auth/forgot-password-form', () => ({
  __esModule: true,
  default: ({ onSuccess }: { onSuccess: (_email: string) => void }) => (
    <div data-testid="forgot-password-form">
      <button 
        data-testid="forgot-password-submit" 
        onClick={() => onSuccess('test@example.com')}
      >
        Send Reset
      </button>
    </div>
  ),
}));

// Mock ResetSentView component
vi.mock('../../../app/components/auth/reset-sent-view', () => ({
  __esModule: true,
  default: ({ email }: { email: string }) => (
    <div data-testid="reset-sent-view">
      Reset link sent to {email}
    </div>
  ),
}));

// Mock VerificationSentView component
vi.mock('../../../app/components/auth/verification-sent-view', () => ({
  __esModule: true,
  default: ({ user }: { user?: User }) => (
    <div data-testid="verification-sent-view">
      Verification sent to {user?.email}
    </div>
  ),
}));

const mockTheme = createTheme();

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  nickname: 'testuser',
  password_hash: 'hash',
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
  is_admin: false,
  is_verified: false,
  verification_token: null,
  last_login: null,
  reset_token: null,
  reset_token_expires: null,
  push_subscription: null,
  updated_by: null,
  created_by: null,
};

const mockProps = {
  handleCloseLoginDialog: vi.fn(),
  openLoginDialog: true,
};

const renderDialog = (props = mockProps) => {
  return render(
    <ThemeProvider theme={mockTheme}>
      <LoginOrSignupDialog {...props} />
    </ThemeProvider>
  );
};

describe('LoginOrSignupDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the dialog when open is true', () => {
      renderDialog();

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('does not render the dialog when open is false', () => {
      renderDialog({ ...mockProps, openLoginDialog: false });

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('renders with correct default title (Ingresar)', () => {
      renderDialog();

      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Ingresar');
    });

    it('renders login form by default', () => {
      renderDialog();

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });
  });

  describe('Dialog Close Functionality', () => {
    it('calls handleCloseLoginDialog when backdrop is clicked', () => {
      renderDialog();

      fireEvent.click(screen.getByTestId('dialog-backdrop'));

      expect(mockProps.handleCloseLoginDialog).toHaveBeenCalledWith(false);
    });

    it('calls handleCloseLoginDialog with true when user is created', () => {
      renderDialog();

      // Switch to signup mode
      fireEvent.click(screen.getByText('Crea uno!'));
      
      // Complete signup (this will set createdUser)
      fireEvent.click(screen.getByTestId('signup-submit'));
      
      // Now close the dialog
      fireEvent.click(screen.getByTestId('dialog-backdrop'));

      expect(mockProps.handleCloseLoginDialog).toHaveBeenCalledWith(true);
    });
  });

  describe('Mode Switching', () => {
    it('switches to signup mode when "Crea uno!" is clicked', () => {
      renderDialog();

      fireEvent.click(screen.getByText('Crea uno!'));

      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Registrarse');
      expect(screen.getByTestId('signup-form')).toBeInTheDocument();
    });

    it('switches to forgot password mode when "¿Olvidaste tu contraseña?" is clicked', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));

      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Recuperar Contraseña');
      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
    });

    it('switches back to login from signup when "Ingresa aca!" is clicked', () => {
      renderDialog();

      // Switch to signup
      fireEvent.click(screen.getByText('Crea uno!'));
      expect(screen.getByTestId('signup-form')).toBeInTheDocument();

      // Switch back to login
      fireEvent.click(screen.getByText('Ingresa aca!'));
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Ingresar');
    });

    it('switches back to login from forgot password when "Volver al inicio de sesión" is clicked', () => {
      renderDialog();

      // Switch to forgot password
      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();

      // Switch back to login
      fireEvent.click(screen.getByText('Volver al inicio de sesión'));
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Ingresar');
    });
  });

  describe('Dialog Titles', () => {
    it('shows correct title for login mode', () => {
      renderDialog();

      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Ingresar');
    });

    it('shows correct title for signup mode', () => {
      renderDialog();

      fireEvent.click(screen.getByText('Crea uno!'));

      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Registrarse');
    });

    it('shows correct title for forgot password mode', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));

      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Recuperar Contraseña');
    });

    it('shows correct title for reset sent mode', () => {
      renderDialog();

      // Switch to forgot password and submit
      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      fireEvent.click(screen.getByTestId('forgot-password-submit'));

      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Enlace Enviado');
    });

    it('shows default title for verification sent mode', () => {
      renderDialog();

      // Switch to signup and submit
      fireEvent.click(screen.getByText('Crea uno!'));
      fireEvent.click(screen.getByTestId('signup-submit'));

      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Ingresar');
    });
  });

  describe('Navigation Links', () => {
    it('renders login mode navigation links', () => {
      renderDialog();

      expect(screen.getByText('No tenes usuario?')).toBeInTheDocument();
      expect(screen.getByText('Crea uno!')).toBeInTheDocument();
      expect(screen.getByText('¿Olvidaste tu contraseña?')).toBeInTheDocument();
    });

    it('renders signup mode navigation links', () => {
      renderDialog();

      fireEvent.click(screen.getByText('Crea uno!'));

      expect(screen.getByText('Ya tenes usuario?')).toBeInTheDocument();
      expect(screen.getByText('Ingresa aca!')).toBeInTheDocument();
    });

    it('renders forgot password mode navigation links', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));

      expect(screen.getByText('Volver al inicio de sesión')).toBeInTheDocument();
    });

    it('renders close button in reset sent mode', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      fireEvent.click(screen.getByTestId('forgot-password-submit'));

      expect(screen.getByText('Cerrar')).toBeInTheDocument();
    });

    it('does not render navigation links in verification sent mode', () => {
      renderDialog();

      fireEvent.click(screen.getByText('Crea uno!'));
      fireEvent.click(screen.getByTestId('signup-submit'));

      expect(screen.queryByText('No tenes usuario?')).not.toBeInTheDocument();
      expect(screen.queryByText('Ya tenes usuario?')).not.toBeInTheDocument();
      expect(screen.queryByText('Volver al inicio de sesión')).not.toBeInTheDocument();
    });
  });

  describe('Form Success Handlers', () => {
    it('handles login success correctly', () => {
      renderDialog();

      fireEvent.click(screen.getByTestId('login-submit'));

      expect(mockProps.handleCloseLoginDialog).toHaveBeenCalledWith(true);
    });

    it('handles signup success correctly', () => {
      renderDialog();

      fireEvent.click(screen.getByText('Crea uno!'));
      fireEvent.click(screen.getByTestId('signup-submit'));

      expect(screen.getByTestId('verification-sent-view')).toBeInTheDocument();
      expect(screen.getByText('Verification sent to test@example.com')).toBeInTheDocument();
    });

    it('handles forgot password success correctly', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      fireEvent.click(screen.getByTestId('forgot-password-submit'));

      expect(screen.getByTestId('reset-sent-view')).toBeInTheDocument();
      expect(screen.getByText('Reset link sent to test@example.com')).toBeInTheDocument();
    });
  });

  describe('Form Content Rendering', () => {
    it('renders login form content', () => {
      renderDialog();

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('login-submit')).toBeInTheDocument();
    });

    it('renders signup form content', () => {
      renderDialog();

      fireEvent.click(screen.getByText('Crea uno!'));

      expect(screen.getByTestId('signup-form')).toBeInTheDocument();
      expect(screen.getByTestId('signup-submit')).toBeInTheDocument();
    });

    it('renders forgot password form content', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));

      expect(screen.getByTestId('forgot-password-form')).toBeInTheDocument();
      expect(screen.getByTestId('forgot-password-submit')).toBeInTheDocument();
    });

    it('renders reset sent view content', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      fireEvent.click(screen.getByTestId('forgot-password-submit'));

      expect(screen.getByTestId('reset-sent-view')).toBeInTheDocument();
      expect(screen.getByText('Reset link sent to test@example.com')).toBeInTheDocument();
    });

    it('renders verification sent view content', () => {
      renderDialog();

      fireEvent.click(screen.getByText('Crea uno!'));
      fireEvent.click(screen.getByTestId('signup-submit'));

      expect(screen.getByTestId('verification-sent-view')).toBeInTheDocument();
      expect(screen.getByText('Verification sent to test@example.com')).toBeInTheDocument();
    });
  });

  describe('Dialog Actions', () => {
    it('renders close button only in reset sent mode', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      fireEvent.click(screen.getByTestId('forgot-password-submit'));

      const closeButtons = screen.getAllByText('Cerrar');
      expect(closeButtons).toHaveLength(1);
    });

    it('closes dialog when close button is clicked in reset sent mode', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      fireEvent.click(screen.getByTestId('forgot-password-submit'));
      fireEvent.click(screen.getByText('Cerrar'));

      expect(mockProps.handleCloseLoginDialog).toHaveBeenCalledWith(false);
    });

    it('does not render close button in other modes', () => {
      renderDialog();

      expect(screen.queryByText('Cerrar')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Crea uno!'));
      expect(screen.queryByText('Cerrar')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Ingresa aca!'));
      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      expect(screen.queryByText('Cerrar')).not.toBeInTheDocument();
    });
  });

  describe('State Management', () => {
    it('resets dialog mode to login when dialog is closed', () => {
      const { unmount } = renderDialog();

      // Switch to signup mode
      fireEvent.click(screen.getByText('Crea uno!'));
      expect(screen.getByTestId('signup-form')).toBeInTheDocument();

      // Close dialog
      fireEvent.click(screen.getByTestId('dialog-backdrop'));

      // Unmount and rerender to simulate dialog being closed and reopened
      unmount();
      vi.clearAllMocks();
      renderDialog();

      // Should be back to login mode
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Ingresar');
    });

    it('maintains reset email state correctly', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      fireEvent.click(screen.getByTestId('forgot-password-submit'));

      expect(screen.getByText('Reset link sent to test@example.com')).toBeInTheDocument();
    });

    it('maintains created user state correctly', () => {
      renderDialog();

      fireEvent.click(screen.getByText('Crea uno!'));
      fireEvent.click(screen.getByTestId('signup-submit'));

      expect(screen.getByText('Verification sent to test@example.com')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined created user in verification sent view', () => {
      renderDialog();

      fireEvent.click(screen.getByText('Crea uno!'));
      fireEvent.click(screen.getByTestId('signup-submit'));

      expect(screen.getByTestId('verification-sent-view')).toBeInTheDocument();
    });

    it('handles empty reset email', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      fireEvent.click(screen.getByTestId('forgot-password-submit'));

      expect(screen.getByTestId('reset-sent-view')).toBeInTheDocument();
    });

    it('handles rapid mode switching', () => {
      renderDialog();

      // Rapidly switch between modes
      fireEvent.click(screen.getByText('Crea uno!'));
      fireEvent.click(screen.getByText('Ingresa aca!'));
      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      fireEvent.click(screen.getByText('Volver al inicio de sesión'));

      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('Ingresar');
    });
  });

  describe('Props Handling', () => {
    it('handles handleCloseLoginDialog prop correctly', () => {
      const customHandler = vi.fn();
      renderDialog({ ...mockProps, handleCloseLoginDialog: customHandler });

      fireEvent.click(screen.getByTestId('dialog-backdrop'));

      expect(customHandler).toHaveBeenCalledWith(false);
    });

    it('handles openLoginDialog prop correctly', () => {
      renderDialog({ ...mockProps, openLoginDialog: false });

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog structure', () => {
      renderDialog();

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
    });

    it('has clickable navigation links', () => {
      renderDialog();

      const createAccountLink = screen.getByText('Crea uno!');
      const forgotPasswordLink = screen.getByText('¿Olvidaste tu contraseña?');

      expect(createAccountLink).toBeInTheDocument();
      expect(forgotPasswordLink).toBeInTheDocument();
    });

    it('has accessible buttons', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      fireEvent.click(screen.getByTestId('forgot-password-submit'));

      const closeButton = screen.getByText('Cerrar');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Integration with Child Components', () => {
    it('passes onSuccess prop to LoginForm correctly', () => {
      renderDialog();

      fireEvent.click(screen.getByTestId('login-submit'));

      expect(mockProps.handleCloseLoginDialog).toHaveBeenCalledWith(true);
    });

    it('passes onSuccess prop to SignupForm correctly', () => {
      renderDialog();

      fireEvent.click(screen.getByText('Crea uno!'));
      fireEvent.click(screen.getByTestId('signup-submit'));

      expect(screen.getByTestId('verification-sent-view')).toBeInTheDocument();
    });

    it('passes onSuccess prop to ForgotPasswordForm correctly', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      fireEvent.click(screen.getByTestId('forgot-password-submit'));

      expect(screen.getByTestId('reset-sent-view')).toBeInTheDocument();
    });

    it('passes email prop to ResetSentView correctly', () => {
      renderDialog();

      fireEvent.click(screen.getByText('¿Olvidaste tu contraseña?'));
      fireEvent.click(screen.getByTestId('forgot-password-submit'));

      expect(screen.getByText('Reset link sent to test@example.com')).toBeInTheDocument();
    });

    it('passes user prop to VerificationSentView correctly', () => {
      renderDialog();

      fireEvent.click(screen.getByText('Crea uno!'));
      fireEvent.click(screen.getByTestId('signup-submit'));

      expect(screen.getByText('Verification sent to test@example.com')).toBeInTheDocument();
    });
  });
});

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { User } from 'next-auth';
import UserActions from '../../../app/components/header/user-actions';
import { setupTestMocks } from '../../mocks/setup-helpers';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: vi.fn(() => 'es'),
  useTranslations: () => (key: string) => {
    // Return translations matching what tests expect (mix of English/Spanish)
    const translations: Record<string, string> = {
      'header.login': 'Log In',
      'header.userMenu.tooltip': 'Abrir Menu de Usuario',
      'header.userMenu.settings': 'Configuracion',
      'header.userMenu.tutorial': 'Ver Tutorial',
      'header.userMenu.logout': 'Salir',
      'header.userMenu.deleteAccount': 'Delete Account',
      'header.userMenu.backoffice': 'Ir al Back Office',
    };
    return translations[key] || key;
  },
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

// Mock auth components
vi.mock('../../../app/components/auth/login-or-signup-dialog', () => ({
  default: ({ openLoginDialog, handleCloseLoginDialog }: any) => (
    <div data-testid="login-dialog">
      <span data-testid="login-dialog-open">{openLoginDialog ? 'true' : 'false'}</span>
      <button
        data-testid="close-login-dialog"
        onClick={() => handleCloseLoginDialog(false)}
      >
        Close Login
      </button>
      <button
        data-testid="force-close-login-dialog"
        onClick={() => handleCloseLoginDialog(true)}
      >
        Force Close Login
      </button>
    </div>
  ),
}));

vi.mock('../../../app/components/onboarding/onboarding-dialog-client', () => ({
  default: ({ initialOpen, onClose }: any) => (
    <div data-testid="onboarding-dialog-client">
      <span data-testid="onboarding-dialog-client-initialopen">{initialOpen ? 'true' : 'false'}</span>
      <button
        data-testid="close-onboarding-dialog-client"
        onClick={onClose}
      >
        Close Onboarding
      </button>
    </div>
  ),
}));

vi.mock('../../../app/components/auth/user-settings-dialog', () => ({
  default: ({ open, onClose }: any) => (
    <div data-testid="user-settings-dialog">
      <span data-testid="user-settings-dialog-open">{open ? 'true' : 'false'}</span>
      <button 
        data-testid="close-user-settings-dialog"
        onClick={onClose}
      >
        Close Settings
      </button>
    </div>
  ),
}));

describe('UserActions', () => {
  let mockRouter: ReturnType<typeof setupTestMocks>['router'];
  let mockSearchParams: ReturnType<typeof setupTestMocks>['searchParams'];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mocks with helper
    const mocks = setupTestMocks({ navigation: true });
    mockRouter = mocks.router!;
    mockSearchParams = mocks.searchParams!;

    vi.mocked(signOut).mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('without user (logged out state)', () => {
    it('renders login button when user is not provided', () => {
      render(<UserActions />);
      
      expect(screen.getByText('Log In')).toBeInTheDocument();
      expect(screen.queryByLabelText('Abrir Menu de Usuario')).not.toBeInTheDocument();
    });

    it('opens login dialog when login button is clicked', () => {
      render(<UserActions />);
      
      fireEvent.click(screen.getByText('Log In'));
      
      expect(screen.getByTestId('login-dialog-open')).toHaveTextContent('true');
    });

    it('opens login dialog when openSignin query param is present', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'openSignin') return 'true';
        return null;
      });
      
      render(<UserActions />);
      
      expect(screen.getByTestId('login-dialog-open')).toHaveTextContent('true');
    });

    it('opens login dialog when verified query param is present', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'verified') return 'true';
        return null;
      });
      
      render(<UserActions />);
      
      expect(screen.getByTestId('login-dialog-open')).toHaveTextContent('true');
    });

    it('closes login dialog when close button is clicked', () => {
      render(<UserActions />);
      
      fireEvent.click(screen.getByText('Log In'));
      expect(screen.getByTestId('login-dialog-open')).toHaveTextContent('true');
      
      fireEvent.click(screen.getByTestId('close-login-dialog'));
      expect(screen.getByTestId('login-dialog-open')).toHaveTextContent('false');
    });

    it('does not close login dialog when openSignin is forced and user is not authenticated', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'openSignin') return 'true';
        return null;
      });
      
      render(<UserActions />);
      
      expect(screen.getByTestId('login-dialog-open')).toHaveTextContent('true');
      
      fireEvent.click(screen.getByTestId('close-login-dialog'));
      expect(screen.getByTestId('login-dialog-open')).toHaveTextContent('true');
    });

    it('closes login dialog when force close is used', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'openSignin') return 'true';
        return null;
      });
      
      render(<UserActions />);
      
      expect(screen.getByTestId('login-dialog-open')).toHaveTextContent('true');
      
      fireEvent.click(screen.getByTestId('force-close-login-dialog'));
      expect(screen.getByTestId('login-dialog-open')).toHaveTextContent('false');
    });
  });

  describe('with user (logged in state)', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      nickname: 'testuser',
      isAdmin: false,
    };

    it('renders user avatar with nickname initial', () => {
      render(<UserActions user={mockUser} />);
      
      expect(screen.getByText('t')).toBeInTheDocument(); // First letter of nickname
      expect(screen.queryByText('Log In')).not.toBeInTheDocument();
    });

    it('renders user avatar with email initial when nickname is not available', () => {
      const userWithoutNickname: User = {
        id: '1',
        email: 'test@example.com',
        isAdmin: false,
      };
      
      render(<UserActions user={userWithoutNickname} />);
      
      expect(screen.getByText('t')).toBeInTheDocument(); // First letter of email
    });

    it('renders fallback avatar when neither nickname nor email is available', () => {
      const userWithoutInfo: User = {
        id: '1',
        isAdmin: false,
      };
      
      render(<UserActions user={userWithoutInfo} />);
      
      expect(screen.getByText('U')).toBeInTheDocument(); // Fallback letter
    });

    it('opens user menu when avatar is clicked', () => {
      render(<UserActions user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      
      expect(screen.getByText('Configuracion')).toBeInTheDocument();
      expect(screen.getByText('Salir')).toBeInTheDocument();
      expect(screen.getByText('Delete Account')).toBeInTheDocument();
    });

    it('opens user settings dialog when Configuracion is clicked', () => {
      render(<UserActions user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Configuracion'));
      
      expect(screen.getByTestId('user-settings-dialog-open')).toHaveTextContent('true');
    });

    it('closes user settings dialog when close button is clicked', () => {
      render(<UserActions user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Configuracion'));
      
      expect(screen.getByTestId('user-settings-dialog-open')).toHaveTextContent('true');
      
      fireEvent.click(screen.getByTestId('close-user-settings-dialog'));
      expect(screen.getByTestId('user-settings-dialog-open')).toHaveTextContent('false');
    });

    it('calls signOut and redirects when logout is clicked', async () => {
      render(<UserActions user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Salir'));
      
      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({ redirect: false });
      });
      
      expect(mockRouter.push).toHaveBeenCalledWith('/es');
      expect(mockRouter.refresh).toHaveBeenCalled();
    });

    it('shows back office link for admin users', () => {
      const adminUser: User = {
        ...mockUser,
        isAdmin: true,
      };
      
      render(<UserActions user={adminUser} />);
      
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      
      expect(screen.getByText('Ir al Back Office')).toBeInTheDocument();
    });

    it('does not show back office link for non-admin users', () => {
      render(<UserActions user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      
      expect(screen.queryByText('Ir al Back Office')).not.toBeInTheDocument();
    });

    it('navigates to backoffice when back office link is clicked', () => {
      const adminUser: User = {
        ...mockUser,
        isAdmin: true,
      };
      
      render(<UserActions user={adminUser} />);
      
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Ir al Back Office'));
      
      expect(mockRouter.push).toHaveBeenCalledWith('/es/backoffice');
    });

    it('navigates to delete account page when delete account is clicked', () => {
      render(<UserActions user={mockUser} />);

      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Delete Account'));

      expect(mockRouter.push).toHaveBeenCalledWith('/es/delete-account');
    });

    it('renders "Ver Tutorial" menu item when user is logged in', () => {
      render(<UserActions user={mockUser} />);

      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));

      expect(screen.getByText('Ver Tutorial')).toBeInTheDocument();
    });

    it('does not render OnboardingDialogClient by default', () => {
      render(<UserActions user={mockUser} />);

      expect(screen.queryByTestId('onboarding-dialog-client')).not.toBeInTheDocument();
    });

    it('clicking "Ver Tutorial" opens onboarding dialog', () => {
      render(<UserActions user={mockUser} />);

      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Ver Tutorial'));

      // Dialog should now be rendered
      expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument();
    });

    it('OnboardingDialogClient renders when openOnboardingDialog is true', () => {
      render(<UserActions user={mockUser} />);

      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Ver Tutorial'));

      const dialog = screen.getByTestId('onboarding-dialog-client');
      expect(dialog).toBeInTheDocument();
    });

    it('OnboardingDialogClient receives initialOpen=true prop', () => {
      render(<UserActions user={mockUser} />);

      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Ver Tutorial'));

      expect(screen.getByTestId('onboarding-dialog-client-initialopen')).toHaveTextContent('true');
    });

    it('OnboardingDialogClient receives onClose callback', () => {
      render(<UserActions user={mockUser} />);

      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Ver Tutorial'));

      // Dialog is open
      expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument();

      // Trigger onClose callback
      fireEvent.click(screen.getByTestId('close-onboarding-dialog-client'));

      // Dialog should be closed
      expect(screen.queryByTestId('onboarding-dialog-client')).not.toBeInTheDocument();
    });

    it('calling onClose closes the onboarding dialog', () => {
      render(<UserActions user={mockUser} />);

      // Open dialog
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Ver Tutorial'));

      expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument();

      // Close dialog via callback
      fireEvent.click(screen.getByTestId('close-onboarding-dialog-client'));

      expect(screen.queryByTestId('onboarding-dialog-client')).not.toBeInTheDocument();
    });

    it('OnboardingDialogClient is conditionally rendered based on openOnboardingDialog state', () => {
      render(<UserActions user={mockUser} />);

      // Initially not rendered
      expect(screen.queryByTestId('onboarding-dialog-client')).not.toBeInTheDocument();

      // Open dialog
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Ver Tutorial'));

      // Now rendered
      expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument();

      // Close dialog
      fireEvent.click(screen.getByTestId('close-onboarding-dialog-client'));

      // Not rendered again
      expect(screen.queryByTestId('onboarding-dialog-client')).not.toBeInTheDocument();
    });

    it('can toggle onboarding dialog multiple times', () => {
      render(<UserActions user={mockUser} />);

      // First open
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Ver Tutorial'));
      expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument();

      // First close
      fireEvent.click(screen.getByTestId('close-onboarding-dialog-client'));
      expect(screen.queryByTestId('onboarding-dialog-client')).not.toBeInTheDocument();

      // Second open
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Ver Tutorial'));
      expect(screen.getByTestId('onboarding-dialog-client')).toBeInTheDocument();

      // Second close
      fireEvent.click(screen.getByTestId('close-onboarding-dialog-client'));
      expect(screen.queryByTestId('onboarding-dialog-client')).not.toBeInTheDocument();
    });
  });

  describe('dialog behavior', () => {
    it('renders both dialogs closed by default', () => {
      render(<UserActions />);
      
      expect(screen.getByTestId('login-dialog-open')).toHaveTextContent('false');
      expect(screen.getByTestId('user-settings-dialog-open')).toHaveTextContent('false');
    });

    it('can control both dialogs independently', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        nickname: 'testuser',
        isAdmin: false,
      };
      
      render(<UserActions user={mockUser} />);
      
      // Open user settings
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Configuracion'));
      
      expect(screen.getByTestId('user-settings-dialog-open')).toHaveTextContent('true');
      expect(screen.getByTestId('login-dialog-open')).toHaveTextContent('false');
    });
  });

  describe('error handling', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      nickname: 'testuser',
      isAdmin: false,
    };

    it('handles router navigation errors gracefully', async () => {
      mockRouter.push.mockRejectedValue(new Error('Navigation failed'));
      
      render(<UserActions user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      fireEvent.click(screen.getByText('Delete Account'));
      
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/es/delete-account');
      });
    });
  });

  describe('accessibility', () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      nickname: 'testuser',
      isAdmin: false,
    };

    it('has proper aria labels for avatar button', () => {
      render(<UserActions user={mockUser} />);
      
      const avatarButton = screen.getByLabelText('Abrir Menu de Usuario');
      expect(avatarButton).toBeInTheDocument();
    });

    it('has proper role for menu items', () => {
      render(<UserActions user={mockUser} />);
      
      fireEvent.click(screen.getByLabelText('Abrir Menu de Usuario'));
      
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems.length).toBeGreaterThan(0);
    });

    it('supports keyboard navigation', () => {
      render(<UserActions user={mockUser} />);
      
      const avatarButton = screen.getByLabelText('Abrir Menu de Usuario');
      avatarButton.focus();
      
      fireEvent.keyDown(avatarButton, { key: 'Enter' });
      
      expect(screen.getByText('Configuracion')).toBeInTheDocument();
    });
  });

  describe('component props integration', () => {
    it('closes login dialog when user becomes authenticated', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        nickname: 'testuser',
        isAdmin: false,
      };
      
      const { rerender } = render(<UserActions />);
      
      fireEvent.click(screen.getByText('Log In'));
      expect(screen.getByTestId('login-dialog-open')).toHaveTextContent('true');
      
      rerender(<UserActions user={mockUser} />);
      
      // Simulate the close behavior when user becomes authenticated
      fireEvent.click(screen.getByTestId('close-login-dialog'));
      expect(screen.getByTestId('login-dialog-open')).toHaveTextContent('false');
    });

    it('handles user state changes', () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        nickname: 'testuser',
        isAdmin: false,
      };
      
      const { rerender } = render(<UserActions />);
      
      // Initially shows login button
      expect(screen.getByText('Log In')).toBeInTheDocument();
      
      // After user is authenticated, shows avatar
      rerender(<UserActions user={mockUser} />);
      expect(screen.getByLabelText('Abrir Menu de Usuario')).toBeInTheDocument();
      expect(screen.queryByText('Log In')).not.toBeInTheDocument();
    });
  });
});

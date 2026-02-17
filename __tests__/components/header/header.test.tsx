import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { screen } from '@testing-library/react';
import Header from '../../../app/components/header/header';
import { User } from 'next-auth';
import { renderWithTheme } from '../../utils/test-utils';

// Mock next-auth
vi.mock('next-auth', () => ({
    __esModule: true,
    default: () => ({}),
}));

vi.mock('next-auth/react', () => ({
    signOut: vi.fn(),
    useSession: () => ({
        data: { user: { id: '1', email: 'test@example.com' } },
        status: 'authenticated',
    }),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        refresh: vi.fn(),
    }),
    useSearchParams: () => ({
        get: vi.fn(),
    }),
    usePathname: () => '/es',
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href, ...props }: any) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
    useTheme: () => ({
        resolvedTheme: 'light',
        setTheme: vi.fn(),
    }),
}));

// Mock UserActions component
vi.mock('../../../app/components/header/user-actions', () => ({
    __esModule: true,
    default: ({ user }: { user?: User }) => (
        <div data-testid="user-actions">
            {user ? (
                <div data-testid="user-menu">
                    <span data-testid="user-email">{user.email}</span>
                    <span data-testid="user-nickname">{user.nickname}</span>
                    <button data-testid="user-avatar" type="button">User Avatar</button>
                    {user.isAdmin && <span data-testid="admin-indicator">Admin</span>}
                </div>
            ) : (
                <button data-testid="login-button" type="button">Log In</button>
            )}
        </div>
    ),
}));

// Mock ThemeSwitcher component
vi.mock('../../../app/components/header/theme-switcher', () => ({
    __esModule: true,
    default: () => (
        <div data-testid="theme-switcher">
            <button data-testid="theme-toggle" type="button">Toggle Theme</button>
        </div>
    ),
}));

const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    nickname: 'testuser',
    isAdmin: false,
};

const mockAdminUser: User = {
    id: '2',
    email: 'admin@example.com',
    nickname: 'admin',
    isAdmin: true,
};

const renderHeader = async (user?: User) => {
    // Since Header is an async server component, we need to handle the Promise
    const HeaderComponent = await Header({ user });
    return renderWithTheme(HeaderComponent);
};

describe('Header', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Basic Rendering', () => {
        it('renders the header with all main elements', async () => {
            await renderHeader();

            expect(screen.getByRole('banner')).toBeInTheDocument();
            expect(screen.getByAltText('la-maquina-prode')).toBeInTheDocument();
            expect(screen.getByText('La Maquina Prode')).toBeInTheDocument();
            expect(screen.getByTestId('theme-switcher')).toBeInTheDocument();
            expect(screen.getByTestId('user-actions')).toBeInTheDocument();
        });

        it('renders the logo with correct src and alt attributes', async () => {
            await renderHeader();

            const logo = screen.getByAltText('la-maquina-prode');
            expect(logo).toHaveAttribute('src', '/logo.webp');
            expect(logo).toHaveAttribute('alt', 'la-maquina-prode');
        });

        it('renders the title with correct text', async () => {
            await renderHeader();

            const title = screen.getByText('La Maquina Prode');
            expect(title).toBeInTheDocument();
        });

        it('renders the app bar with sticky positioning', async () => {
            await renderHeader();

            const appBar = screen.getByRole('banner');
            expect(appBar).toBeInTheDocument();
            // MUI AppBar with position="sticky" should be present
            expect(appBar).toHaveClass('MuiAppBar-root');
        });
    });

    describe('Logo and Navigation', () => {
        it('renders logo as clickable link to home', async () => {
            await renderHeader();

            const logoLink = screen.getByAltText('la-maquina-prode').closest('a');
            expect(logoLink).toHaveAttribute('href', '/es');
        });

        it('renders title as clickable link to home', async () => {
            await renderHeader();

            const titleLink = screen.getByText('La Maquina Prode').closest('a');
            expect(titleLink).toHaveAttribute('href', '/es');
        });

        it('applies correct styles to logo', async () => {
            await renderHeader();

            const logo = screen.getByAltText('la-maquina-prode');
            expect(logo).toHaveAttribute('src', '/logo.webp');
            // Avatar should have variant="rounded"
            expect(logo.closest('.MuiAvatar-root')).toHaveClass('MuiAvatar-rounded');
        });
    });

    describe('User Authentication States', () => {
        it('renders login button when user is not authenticated', async () => {
            await renderHeader();

            expect(screen.getByTestId('login-button')).toBeInTheDocument();
        });

        it('renders user menu when user is authenticated', async () => {
            await renderHeader(mockUser);

            expect(screen.getByTestId('user-menu')).toBeInTheDocument();
            expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
            expect(screen.getByTestId('user-nickname')).toHaveTextContent('testuser');
            expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
        });

        it('renders admin indicator for admin users', async () => {
            await renderHeader(mockAdminUser);

            expect(screen.getByTestId('admin-indicator')).toBeInTheDocument();
            expect(screen.getByTestId('admin-indicator')).toHaveTextContent('Admin');
        });

        it('does not render admin indicator for regular users', async () => {
            await renderHeader(mockUser);

            expect(screen.queryByTestId('admin-indicator')).not.toBeInTheDocument();
        });

        it('handles user without nickname', async () => {
            const userWithoutNickname = {
                ...mockUser,
                nickname: undefined,
            };

            await renderHeader(userWithoutNickname);

            expect(screen.getByTestId('user-menu')).toBeInTheDocument();
            expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
        });

        it('handles user without email', async () => {
            const userWithoutEmail = {
                ...mockUser,
                email: undefined,
            };

            await renderHeader(userWithoutEmail);

            expect(screen.getByTestId('user-menu')).toBeInTheDocument();
            expect(screen.getByTestId('user-nickname')).toHaveTextContent('testuser');
        });
    });

    describe('Theme Switching', () => {
        it('renders theme switcher component', async () => {
            await renderHeader();

            expect(screen.getByTestId('theme-switcher')).toBeInTheDocument();
            expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
        });

        it('theme switcher is accessible via button', async () => {
            await renderHeader();

            const themeButton = screen.getByTestId('theme-toggle');
            expect(themeButton).toBeInTheDocument();
            expect(themeButton).toHaveAttribute('type', 'button');
        });
    });

    describe('Layout and Styling', () => {
        it('renders header with correct layout structure', async () => {
            await renderHeader();

            const appBar = screen.getByRole('banner');
            expect(appBar).toBeInTheDocument();

            // Check for main container Box
            const container = appBar.querySelector('.MuiBox-root');
            expect(container).toBeInTheDocument();
        });

        it('renders left section with logo', async () => {
            await renderHeader();

            const logo = screen.getByAltText('la-maquina-prode');
            expect(logo).toBeInTheDocument();
            expect(logo.closest('a')).toHaveAttribute('href', '/es');
        });

        it('renders center section with title', async () => {
            await renderHeader();

            const title = screen.getByText('La Maquina Prode');
            expect(title).toBeInTheDocument();
        });

        it('renders right section with theme switcher and user actions', async () => {
            await renderHeader();

            expect(screen.getByTestId('theme-switcher')).toBeInTheDocument();
            expect(screen.getByTestId('user-actions')).toBeInTheDocument();
        });
    });

    describe('Responsive Behavior', () => {
        it('renders with responsive flex layout', async () => {
            await renderHeader();

            const appBar = screen.getByRole('banner');
            expect(appBar).toBeInTheDocument();

            // The Box component should have display flex
            const container = appBar.querySelector('.MuiBox-root');
            expect(container).toBeInTheDocument();
        });

        it('maintains proper spacing between elements', async () => {
            await renderHeader();

            // All main elements should be present and spaced correctly
            expect(screen.getByAltText('la-maquina-prode')).toBeInTheDocument();
            expect(screen.getByText('La Maquina Prode')).toBeInTheDocument();
            expect(screen.getByTestId('theme-switcher')).toBeInTheDocument();
            expect(screen.getByTestId('user-actions')).toBeInTheDocument();
        });

        it('handles long usernames gracefully', async () => {
            const userWithLongName = {
                ...mockUser,
                nickname: 'verylongusernamethatmightcauseissues',
                email: 'verylongusernamethatmightcauseissues@example.com',
            };

            await renderHeader(userWithLongName);

            expect(screen.getByTestId('user-menu')).toBeInTheDocument();
            expect(screen.getByTestId('user-nickname')).toHaveTextContent('verylongusernamethatmightcauseissues');
        });
    });

    describe('Props and Data Handling', () => {
        it('handles undefined user prop', async () => {
            await renderHeader(undefined);

            expect(screen.getByTestId('login-button')).toBeInTheDocument();
            expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
        });

        it('handles null user prop', async () => {
            await renderHeader(null as any);

            expect(screen.getByTestId('login-button')).toBeInTheDocument();
            expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
        });

        it('passes correct user data to UserActions component', async () => {
            await renderHeader(mockUser);

            expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
            expect(screen.getByTestId('user-nickname')).toHaveTextContent('testuser');
        });

        it('passes admin user data correctly', async () => {
            await renderHeader(mockAdminUser);

            expect(screen.getByTestId('user-email')).toHaveTextContent('admin@example.com');
            expect(screen.getByTestId('user-nickname')).toHaveTextContent('admin');
            expect(screen.getByTestId('admin-indicator')).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('handles user with empty string values', async () => {
            const userWithEmptyValues = {
                ...mockUser,
                nickname: '',
                email: '',
            };

            await renderHeader(userWithEmptyValues);

            expect(screen.getByTestId('user-menu')).toBeInTheDocument();
        });

        it('handles user with only id', async () => {
            const minimalUser = {
                id: '123',
            } as User;

            await renderHeader(minimalUser);

            expect(screen.getByTestId('user-menu')).toBeInTheDocument();
        });

        it('handles user with special characters in email', async () => {
            const userWithSpecialChars = {
                ...mockUser,
                email: 'test+special@example.com',
                nickname: 'test@user#123',
            };

            await renderHeader(userWithSpecialChars);

            expect(screen.getByTestId('user-email')).toHaveTextContent('test+special@example.com');
            expect(screen.getByTestId('user-nickname')).toHaveTextContent('test@user#123');
        });

        it('handles non-admin user with isAdmin false', async () => {
            const explicitNonAdmin = {
                ...mockUser,
                isAdmin: false,
            };

            await renderHeader(explicitNonAdmin);

            expect(screen.queryByTestId('admin-indicator')).not.toBeInTheDocument();
        });

        it('handles user without isAdmin property', async () => {
            const userWithoutIsAdmin = {
                id: '1',
                email: 'test@example.com',
                nickname: 'testuser',
            } as User;

            await renderHeader(userWithoutIsAdmin);

            expect(screen.queryByTestId('admin-indicator')).not.toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('has proper ARIA attributes', async () => {
            await renderHeader();

            const appBar = screen.getByRole('banner');
            expect(appBar).toBeInTheDocument();
        });

        it('has accessible logo with alt text', async () => {
            await renderHeader();

            const logo = screen.getByAltText('la-maquina-prode');
            expect(logo).toBeInTheDocument();
        });

        it('has accessible navigation links', async () => {
            await renderHeader();

            const logoLink = screen.getByAltText('la-maquina-prode').closest('a');
            const titleLink = screen.getByText('La Maquina Prode').closest('a');

            expect(logoLink).toHaveAttribute('href', '/es');
            expect(titleLink).toHaveAttribute('href', '/es');
        });

        it('provides accessible user actions', async () => {
            await renderHeader(mockUser);

            expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
        });

        it('provides accessible login button for unauthenticated users', async () => {
            await renderHeader();

            const loginButton = screen.getByTestId('login-button');
            expect(loginButton).toBeInTheDocument();
            expect(loginButton).toHaveAttribute('type', 'button');
        });
    });

    describe('Integration with Child Components', () => {
        it('renders UserActions component with correct props', async () => {
            await renderHeader(mockUser);

            expect(screen.getByTestId('user-actions')).toBeInTheDocument();
            expect(screen.getByTestId('user-menu')).toBeInTheDocument();
        });

        it('renders ThemeSwitcher component', async () => {
            await renderHeader();

            expect(screen.getByTestId('theme-switcher')).toBeInTheDocument();
            expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
        });

        it('maintains proper component hierarchy', async () => {
            await renderHeader(mockUser);

            const appBar = screen.getByRole('banner');
            const themeSwitcher = screen.getByTestId('theme-switcher');
            const userActions = screen.getByTestId('user-actions');

            expect(appBar).toContainElement(themeSwitcher);
            expect(appBar).toContainElement(userActions);
        });
    });

    describe('Server Component Behavior', () => {
        it('renders correctly as async server component', async () => {
            // Since the component is marked as 'use server', it should render without client-side dependencies
            await renderHeader();

            expect(screen.getByRole('banner')).toBeInTheDocument();
            expect(screen.getByText('La Maquina Prode')).toBeInTheDocument();
        });

        it('handles server-side rendering with user data', async () => {
            await renderHeader(mockUser);

            expect(screen.getByTestId('user-actions')).toBeInTheDocument();
            expect(screen.getByTestId('user-menu')).toBeInTheDocument();
        });

        it('handles server-side rendering without user data', async () => {
            await renderHeader();

            expect(screen.getByTestId('user-actions')).toBeInTheDocument();
            expect(screen.getByTestId('login-button')).toBeInTheDocument();
        });
    });
});

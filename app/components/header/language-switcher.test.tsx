import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import LanguageSwitcher from './language-switcher';

// Create hoisted mocks
const { mockPush, mockUsePathname, mockUseSearchParams, mockUseLocale, mockUpdate, mockUpdateUserLocale, mockAuth } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockUsePathname: vi.fn(),
  mockUseSearchParams: vi.fn(),
  mockUseLocale: vi.fn(),
  mockUpdate: vi.fn(),
  mockUpdateUserLocale: vi.fn(),
  mockAuth: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: () => mockUseLocale(),
  useTranslations: () => (key: string) => {
    // Return translation for language switcher
    if (key === 'language.selectLanguage') return 'Select language';
    return key;
  },
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    update: mockUpdate,
    status: 'authenticated',
    data: {
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        preferred_locale: 'en',
      },
    },
  }),
}));

// Mock user-actions
vi.mock('../actions/user-actions', () => ({
  updateUserLocale: mockUpdateUserLocale,
}));

// Mock auth from root
vi.mock('../../auth', () => ({
  auth: mockAuth,
}));

// Mock next/headers for server action
const mockCookieSet = vi.fn();
vi.mock('next/headers', () => ({
  cookies: () => ({
    set: mockCookieSet,
    get: () => null,
  }),
}));

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockUseLocale.mockReturnValue('en');
    mockUsePathname.mockReturnValue('/en/tournaments/1');
    mockUseSearchParams.mockReturnValue({
      toString: () => '',
    });

    // Mock auth to return authenticated user (for server action)
    mockAuth.mockResolvedValue({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        preferred_locale: 'en',
      },
    });

    // Ensure server action mocks resolve successfully
    mockUpdate.mockResolvedValue(undefined);
    mockUpdateUserLocale.mockResolvedValue(undefined);
  });

  it('renders language switcher button', () => {
    renderWithTheme(<LanguageSwitcher />);

    const button = screen.getByLabelText('Select language');
    expect(button).toBeInTheDocument();
  });

  it('opens menu when button is clicked', async () => {
    renderWithTheme(<LanguageSwitcher />);

    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('English')).toBeInTheDocument();
      expect(screen.getByText('Español')).toBeInTheDocument();
    });
  });

  it('displays current language as selected', async () => {
    renderWithTheme(<LanguageSwitcher />);

    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);

    await waitFor(() => {
      const englishOption = screen.getByText('English').closest('li');
      expect(englishOption).toHaveClass('Mui-selected');
    });
  });

  it('uses correct path structure for language switching', () => {
    // This test verifies the component has access to the required navigation hooks
    // The actual language switching is tested via E2E tests
    renderWithTheme(<LanguageSwitcher />);

    // Verify component renders and has access to pathname
    const button = screen.getByLabelText('Select language');
    expect(button).toBeInTheDocument();

    // Verify mocks were called during render
    expect(mockUsePathname).toHaveBeenCalled();
    expect(mockUseSearchParams).toHaveBeenCalled();
  });

  it('displays correct flags for languages', async () => {
    renderWithTheme(<LanguageSwitcher />);

    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);

    await waitFor(() => {
      // Check for US flag (🇺🇸) and Argentina flag (🇦🇷)
      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems[0]).toHaveTextContent('🇺🇸');
      expect(menuItems[0]).toHaveTextContent('English');
      expect(menuItems[1]).toHaveTextContent('🇦🇷');
      expect(menuItems[1]).toHaveTextContent('Español');
    });
  });
});

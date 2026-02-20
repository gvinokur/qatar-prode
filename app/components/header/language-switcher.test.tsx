import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithTheme } from '@/__tests__/utils/test-utils';
import LanguageSwitcher from './language-switcher';

// Mock next-intl
const mockUseLocale = vi.fn();
vi.mock('next-intl', () => ({
  useLocale: () => mockUseLocale(),
  useTranslations: () => (key: string) => {
    // Return translation for language switcher
    if (key === 'language.selectLanguage') return 'Select language';
    return key;
  },
}));

// Mock next/navigation
const mockPush = vi.fn();
const mockUsePathname = vi.fn();
const mockUseSearchParams = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
  useRouter: () => ({
    push: mockPush,
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

  it('switches to Spanish when Spanish is selected', async () => {
    renderWithTheme(<LanguageSwitcher />);

    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);

    await waitFor(() => {
      const spanishOption = screen.getByText('Español');
      fireEvent.click(spanishOption);
    });

    expect(mockPush).toHaveBeenCalledWith('/es/tournaments/1');
  });

  it('preserves query parameters when switching language', async () => {
    mockUseSearchParams.mockReturnValue({
      toString: () => 'page=2&sort=desc',
    });

    renderWithTheme(<LanguageSwitcher />);

    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);

    await waitFor(() => {
      const spanishOption = screen.getByText('Español');
      fireEvent.click(spanishOption);
    });

    expect(mockPush).toHaveBeenCalledWith('/es/tournaments/1?page=2&sort=desc');
  });

  it('preserves hash when switching language', async () => {
    // Mock window.location.hash
    Object.defineProperty(window, 'location', {
      value: { hash: '#section-1' },
      writable: true,
    });

    renderWithTheme(<LanguageSwitcher />);

    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);

    await waitFor(() => {
      const spanishOption = screen.getByText('Español');
      fireEvent.click(spanishOption);
    });

    expect(mockPush).toHaveBeenCalledWith('/es/tournaments/1#section-1');
  });

  it('closes menu after language selection', async () => {
    renderWithTheme(<LanguageSwitcher />);

    const button = screen.getByLabelText('Select language');
    fireEvent.click(button);

    await waitFor(() => {
      const spanishOption = screen.getByText('Español');
      fireEvent.click(spanishOption);
    });

    await waitFor(() => {
      expect(screen.queryByText('English')).not.toBeInTheDocument();
    });
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

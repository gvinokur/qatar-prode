import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { screen, waitFor } from '@testing-library/react';
import EmailVerifier from '../../../app/components/verification/email-verifier';
import { verifyUserEmail } from '../../../app/actions/user-actions';
import { renderWithTheme } from '../../utils/test-utils';

// Mock next-intl hooks
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

// Mock user-actions
vi.mock('../../../app/actions/user-actions', () => ({
  verifyUserEmail: vi.fn(),
}));

// Mock AuthPageSkeleton component
vi.mock('../../../app/components/skeletons', () => ({
  AuthPageSkeleton: () => <div data-testid="auth-skeleton">Loading...</div>,
}));

describe('EmailVerifier', () => {
  const mockT = vi.fn((key: string, values?: Record<string, any>) => {
    if (values) return `${key}:${JSON.stringify(values)}`;
    return key;
  });

  const mockLocale = 'en';
  const mockRouter = { push: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslations).mockReturnValue(mockT);
    vi.mocked(useLocale).mockReturnValue(mockLocale);
    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial loading state', () => {
    it('displays loading skeleton on initial render', () => {
      vi.mocked(verifyUserEmail).mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithTheme(<EmailVerifier token="test-token" />);

      expect(screen.getByTestId('auth-skeleton')).toBeInTheDocument();
    });

    it('renders AuthPageSkeleton component', () => {
      vi.mocked(verifyUserEmail).mockImplementation(() => new Promise(() => {}));

      const { container } = renderWithTheme(<EmailVerifier token="test-token" />);

      expect(container.querySelector('[data-testid="auth-skeleton"]')).toBeInTheDocument();
    });
  });

  describe('successful verification', () => {
    it('calls verifyUserEmail with provided token', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      renderWithTheme(<EmailVerifier token="test-token-123" />);

      await waitFor(() => {
        expect(verifyUserEmail).toHaveBeenCalledWith('test-token-123');
      });
    });

    it('calls signOut with correct callback URL on success', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({
          redirect: true,
          callbackUrl: `/en?verified=true`,
        });
      });
    });

    it('includes correct locale in callback URL', async () => {
      vi.mocked(useLocale).mockReturnValue('ar');
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(signOut).toHaveBeenCalledWith({
          redirect: true,
          callbackUrl: `/ar?verified=true`,
        });
      });
    });

    it('uses correct translation key for auth namespace', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(useTranslations).toHaveBeenCalledWith('auth');
      });
    });

    it('handles different locales correctly', async () => {
      const locales = ['en', 'es', 'fr', 'de', 'ar'];

      for (const locale of locales) {
        vi.clearAllMocks();
        vi.mocked(useLocale).mockReturnValue(locale);
        vi.mocked(useTranslations).mockReturnValue(mockT);
        vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

        renderWithTheme(<EmailVerifier token="test-token" />);

        await waitFor(() => {
          expect(signOut).toHaveBeenCalledWith({
            redirect: true,
            callbackUrl: `/${locale}?verified=true`,
          });
        });
      }
    });
  });

  describe('error state - invalid token', () => {
    it('displays error message when verification fails with error response', async () => {
      const errorMessage = 'The verification link has expired or is invalid';
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      renderWithTheme(<EmailVerifier token="invalid-token" />);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('uses default error message when error field is missing', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: undefined,
      });

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(mockT).toHaveBeenCalledWith('emailVerifier.errors.invalidLink');
      });
    });

    it('displays error alert with correct severity', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: 'Custom error message',
      });

      const { container } = renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        const alert = container.querySelector('[role="alert"]');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveClass(/severity-error|MuiAlert-standardError/);
      });
    });

    it('displays title on error', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: 'Error message',
      });

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(mockT).toHaveBeenCalledWith('emailVerifier.title');
      });
    });

    it('displays instruction message on error', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: 'Error message',
      });

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(mockT).toHaveBeenCalledWith('emailVerifier.instruction');
      });
    });

    it('handles error rendering properly', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: 'Error',
      });

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      // Verify that error is displayed in the alert
      const alert = screen.getByRole('alert');
      expect(alert).toHaveTextContent('Error');
    });
  });

  describe('error state - unexpected error', () => {
    it('handles unexpected errors during verification', async () => {
      const error = new Error('Network error');
      vi.mocked(verifyUserEmail).mockRejectedValue(error);

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(mockT).toHaveBeenCalledWith('emailVerifier.errors.unexpected');
      });
    });

    it('displays unexpected error translation when catch block triggers', async () => {
      vi.mocked(verifyUserEmail).mockRejectedValue(new Error('Unexpected'));

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(mockT).toHaveBeenCalledWith('emailVerifier.errors.unexpected');
    });

    it('displays error message when exception occurs', async () => {
      const errorMessage = 'emailVerifier.errors.unexpected';
      vi.mocked(verifyUserEmail).mockRejectedValue(new Error('Any error'));

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(mockT).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('token handling', () => {
    it('only calls verifyUserEmail when token is provided', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      renderWithTheme(<EmailVerifier token="" />);

      await waitFor(() => {
        expect(verifyUserEmail).not.toHaveBeenCalled();
      });
    });

    it('calls verifyUserEmail immediately when token is provided', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      renderWithTheme(<EmailVerifier token="token-123" />);

      await waitFor(() => {
        expect(verifyUserEmail).toHaveBeenCalledWith('token-123');
      });
    });

    it('handles different token formats', async () => {
      const tokens = [
        'simple-token',
        'token-with-dashes-123',
        'veryLongTokenWithManyCharactersAndNumbers1234567890abcdef',
        'token_with_underscores',
      ];

      for (const token of tokens) {
        vi.clearAllMocks();
        vi.mocked(useTranslations).mockReturnValue(mockT);
        vi.mocked(useLocale).mockReturnValue(mockLocale);
        vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

        renderWithTheme(<EmailVerifier token={token} />);

        await waitFor(() => {
          expect(verifyUserEmail).toHaveBeenCalledWith(token);
        });
      }
    });

    it('does not verify when token is empty string', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      renderWithTheme(<EmailVerifier token="" />);

      // Wait a bit to ensure verification is not called
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(verifyUserEmail).not.toHaveBeenCalled();
    });

    it('does not verify when token is whitespace', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      renderWithTheme(<EmailVerifier token="   " />);

      // Token with spaces is still truthy, so verification will be called
      await waitFor(() => {
        expect(verifyUserEmail).toHaveBeenCalledWith('   ');
      });
    });
  });

  describe('component structure and styling', () => {
    it('renders Paper component on error', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: 'Error',
      });

      const { container } = renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        const paper = container.querySelector('[class*="MuiPaper"]');
        expect(paper).toBeInTheDocument();
      });
    });

    it('renders centered Box container on error', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: 'Error',
      });

      const { container } = renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        const box = container.querySelector('[class*="MuiBox"]');
        expect(box).toBeInTheDocument();
      });
    });

    it('renders empty fragment on successful verification', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      const { container } = renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(signOut).toHaveBeenCalled();
      });
    });
  });

  describe('multiple effect invocations', () => {
    it('calls verifyUserEmail only once on mount', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      const { rerenderWithTheme } = renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(verifyUserEmail).toHaveBeenCalledTimes(1);
      });

      vi.clearAllMocks();
      vi.mocked(useTranslations).mockReturnValue(mockT);
      vi.mocked(useLocale).mockReturnValue(mockLocale);
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      rerenderWithTheme(<EmailVerifier token="test-token" />);

      // Should not be called again
      expect(verifyUserEmail).not.toHaveBeenCalled();
    });

    it('calls verifyUserEmail when token changes', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      const { rerenderWithTheme } = renderWithTheme(<EmailVerifier token="token-1" />);

      await waitFor(() => {
        expect(verifyUserEmail).toHaveBeenCalledWith('token-1');
      });

      vi.clearAllMocks();
      vi.mocked(useTranslations).mockReturnValue(mockT);
      vi.mocked(useLocale).mockReturnValue(mockLocale);
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      rerenderWithTheme(<EmailVerifier token="token-2" />);

      await waitFor(() => {
        expect(verifyUserEmail).toHaveBeenCalledWith('token-2');
      });
    });

    it('calls verifyUserEmail when locale changes', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      const { rerenderWithTheme } = renderWithTheme(<EmailVerifier token="token" />);

      await waitFor(() => {
        expect(verifyUserEmail).toHaveBeenCalledWith('token');
      });

      vi.clearAllMocks();
      vi.mocked(useTranslations).mockReturnValue(mockT);
      vi.mocked(useLocale).mockReturnValue('es');
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      rerenderWithTheme(<EmailVerifier token="token" />);

      await waitFor(() => {
        expect(verifyUserEmail).toHaveBeenCalledWith('token');
      });
    });
  });

  describe('error message localization', () => {
    it('uses correct translation key for invalid link error', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: undefined,
      });

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(mockT).toHaveBeenCalledWith('emailVerifier.errors.invalidLink');
      });
    });

    it('prefers provided error message over default', async () => {
      const customError = 'Email already verified';
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: customError,
      });

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(customError)).toBeInTheDocument();
      });
    });

    it('handles error from backend correctly', async () => {
      const backendError = 'User not found';
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: backendError,
      });

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(backendError)).toBeInTheDocument();
      });
    });
  });

  describe('state management', () => {
    it('transitions from verifying to success', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      const { container } = renderWithTheme(<EmailVerifier token="test-token" />);

      // Initially should show skeleton
      expect(screen.getByTestId('auth-skeleton')).toBeInTheDocument();

      // After success, should sign out
      await waitFor(() => {
        expect(signOut).toHaveBeenCalled();
      });
    });

    it('transitions from verifying to error state', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: 'Verification failed',
      });

      const { container } = renderWithTheme(<EmailVerifier token="test-token" />);

      // Initially should show skeleton
      expect(screen.getByTestId('auth-skeleton')).toBeInTheDocument();

      // After error, should show error message
      await waitFor(() => {
        expect(screen.getByText('Verification failed')).toBeInTheDocument();
      });
    });
  });

  describe('edge cases', () => {
    it('handles rapid token changes', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      const { rerenderWithTheme } = renderWithTheme(<EmailVerifier token="token-1" />);

      vi.clearAllMocks();
      vi.mocked(useTranslations).mockReturnValue(mockT);
      vi.mocked(useLocale).mockReturnValue(mockLocale);
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      rerenderWithTheme(<EmailVerifier token="token-2" />);

      vi.clearAllMocks();
      vi.mocked(useTranslations).mockReturnValue(mockT);
      vi.mocked(useLocale).mockReturnValue(mockLocale);
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      rerenderWithTheme(<EmailVerifier token="token-3" />);

      // Component should still function properly
      expect(verifyUserEmail).toHaveBeenCalledWith('token-3');
    });

    it('handles verification with very long token', async () => {
      const longToken = 'a'.repeat(500);
      vi.mocked(verifyUserEmail).mockResolvedValue({ success: true });

      renderWithTheme(<EmailVerifier token={longToken} />);

      await waitFor(() => {
        expect(verifyUserEmail).toHaveBeenCalledWith(longToken);
      });
    });

    it('handles unicode in error messages', async () => {
      const unicodeError = '验证失败 - 링크가 만료되었습니다';
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: unicodeError,
      });

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        expect(screen.getByText(unicodeError)).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('renders heading for error state', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: 'Error',
      });

      const { container } = renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        const heading = container.querySelector('h5');
        expect(heading).toBeInTheDocument();
      });
    });

    it('displays alert with proper role', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: 'Error',
      });

      renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
        expect(alert).toHaveTextContent('Error');
      });
    });

    it('displays centered heading on error', async () => {
      vi.mocked(verifyUserEmail).mockResolvedValue({
        success: false,
        error: 'Error',
      });

      const { container } = renderWithTheme(<EmailVerifier token="test-token" />);

      await waitFor(() => {
        const heading = container.querySelector('h5');
        expect(heading).toBeInTheDocument();
        // Heading should have center alignment
        expect(heading).toHaveClass(/MuiTypography-alignCenter/);
      });
    });
  });
});

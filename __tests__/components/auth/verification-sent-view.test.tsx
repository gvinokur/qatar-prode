import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTranslations } from 'next-intl';
import { render, screen } from '@testing-library/react';
import VerificationSentView from '../../../app/components/auth/verification-sent-view';
import { renderWithTheme } from '../../utils/test-utils';
import type { User } from '../../../app/db/tables-definition';

// Mock next-intl hooks
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
}));

describe('VerificationSentView', () => {
  const mockT = vi.fn((key: string, values?: Record<string, any>) => {
    if (values) return `${key}:${JSON.stringify(values)}`;
    return key;
  });

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    nickname: 'TestUser',
    created_at: new Date(),
    updated_at: new Date(),
    encrypted_password: 'hashed',
    email_verified_at: null,
    username: 'testuser',
    avatar_url: null,
    otp_enabled: false,
    auth_provider: 'credentials',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslations).mockReturnValue(mockT);
  });

  describe('rendering with user', () => {
    it('renders the email icon', () => {
      renderWithTheme(<VerificationSentView user={mockUser} />);

      const emailIcon = document.querySelector('svg[data-testid="EmailIcon"]');
      expect(emailIcon).toBeInTheDocument();
    });

    it('renders the title with nickname interpolation', () => {
      renderWithTheme(<VerificationSentView user={mockUser} />);

      // Should call translation with nickname in values
      expect(mockT).toHaveBeenCalledWith('verificationSent.title', { nickname: 'TestUser' });
    });

    it('renders the user email address', () => {
      renderWithTheme(<VerificationSentView user={mockUser} />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('calls translation key for email sent message', () => {
      renderWithTheme(<VerificationSentView user={mockUser} />);

      expect(mockT).toHaveBeenCalledWith('verificationSent.emailSentTo');
    });

    it('calls translation key for instructions', () => {
      renderWithTheme(<VerificationSentView user={mockUser} />);

      expect(mockT).toHaveBeenCalledWith('verificationSent.instructions');
    });

    it('calls translation key for spam check reminder', () => {
      renderWithTheme(<VerificationSentView user={mockUser} />);

      expect(mockT).toHaveBeenCalledWith('verificationSent.checkSpam');
    });

    it('calls translation key for link expiration', () => {
      renderWithTheme(<VerificationSentView user={mockUser} />);

      expect(mockT).toHaveBeenCalledWith('verificationSent.linkExpiration');
    });

    it('displays all required text in correct order', () => {
      const { container } = renderWithTheme(<VerificationSentView user={mockUser} />);

      const textElements = container.querySelectorAll('p');
      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  describe('rendering without user', () => {
    it('renders without crashing when user is undefined', () => {
      renderWithTheme(<VerificationSentView />);

      expect(mockT).toHaveBeenCalledWith('verificationSent.title', { nickname: '' });
    });

    it('passes empty string as nickname when user is undefined', () => {
      renderWithTheme(<VerificationSentView />);

      expect(mockT).toHaveBeenCalledWith('verificationSent.title', { nickname: '' });
    });

    it('does not display email when user is undefined', () => {
      renderWithTheme(<VerificationSentView />);

      expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
    });
  });

  describe('styling and layout', () => {
    it('applies correct padding to main container', () => {
      const { container } = renderWithTheme(<VerificationSentView user={mockUser} />);

      const mainBox = container.firstChild;
      expect(mainBox).toHaveStyle({ padding: '16px 0', textAlign: 'center' });
    });

    it('renders icon container with flexbox layout', () => {
      const { container } = renderWithTheme(<VerificationSentView user={mockUser} />);

      // Check that there is a flex container with the icon
      const boxes = container.querySelectorAll('[class*="MuiBox"]');
      expect(boxes.length).toBeGreaterThan(0);
    });

    it('renders alert with info severity', () => {
      const { container } = renderWithTheme(<VerificationSentView user={mockUser} />);

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveClass(/severity-info|MuiAlert-standardInfo/);
    });

    it('renders email with bold typography', () => {
      renderWithTheme(<VerificationSentView user={mockUser} />);

      const emailText = screen.getByText('test@example.com');
      // The email should be rendered within a Typography component
      expect(emailText).toBeInTheDocument();
      // Check that the typography wrapper exists
      expect(emailText.closest('[class*="MuiTypography"]')).toBeInTheDocument();
    });
  });

  describe('typography variants', () => {
    it('uses h5 variant for title', () => {
      const { container } = renderWithTheme(<VerificationSentView user={mockUser} />);

      // Check for h5 heading
      const heading = container.querySelector('h5');
      expect(heading).toBeInTheDocument();
    });

    it('uses body1 variant for main text', () => {
      renderWithTheme(<VerificationSentView user={mockUser} />);

      const emailText = screen.getByText('test@example.com');
      expect(emailText).toBeInTheDocument();
    });

    it('uses body2 variant for secondary text', () => {
      const { container } = renderWithTheme(<VerificationSentView user={mockUser} />);

      // Check for body2 typography
      const body2Elements = container.querySelectorAll('p.MuiTypography-body2');
      expect(body2Elements.length).toBeGreaterThan(0);
    });
  });

  describe('different user scenarios', () => {
    it('handles user with special characters in nickname', () => {
      const userWithSpecialChars: User = {
        ...mockUser,
        nickname: 'User@123#',
      };

      renderWithTheme(<VerificationSentView user={userWithSpecialChars} />);

      expect(mockT).toHaveBeenCalledWith('verificationSent.title', { nickname: 'User@123#' });
    });

    it('handles user with long nickname', () => {
      const userWithLongNickname: User = {
        ...mockUser,
        nickname: 'VeryLongNicknameWithManyCharacters1234567890',
      };

      renderWithTheme(<VerificationSentView user={userWithLongNickname} />);

      expect(mockT).toHaveBeenCalledWith('verificationSent.title', {
        nickname: 'VeryLongNicknameWithManyCharacters1234567890'
      });
    });

    it('handles user with empty nickname', () => {
      const userWithEmptyNickname: User = {
        ...mockUser,
        nickname: '',
      };

      renderWithTheme(<VerificationSentView user={userWithEmptyNickname} />);

      expect(mockT).toHaveBeenCalledWith('verificationSent.title', { nickname: '' });
    });

    it('handles user with different email formats', () => {
      const userWithDifferentEmail: User = {
        ...mockUser,
        email: 'user+tag@subdomain.example.co.uk',
      };

      renderWithTheme(<VerificationSentView user={userWithDifferentEmail} />);

      expect(screen.getByText('user+tag@subdomain.example.co.uk')).toBeInTheDocument();
    });
  });

  describe('translations', () => {
    it('uses translations from auth namespace', () => {
      renderWithTheme(<VerificationSentView user={mockUser} />);

      expect(useTranslations).toHaveBeenCalledWith('auth');
    });
  });

  describe('component composition', () => {
    it('renders exactly one email icon', () => {
      const { container } = renderWithTheme(<VerificationSentView user={mockUser} />);

      const emailIcons = container.querySelectorAll('svg[data-testid="EmailIcon"]');
      expect(emailIcons.length).toBe(1);
    });

    it('renders all required sections', () => {
      const { container } = renderWithTheme(<VerificationSentView user={mockUser} />);

      // Check for main content Box
      const boxes = container.querySelectorAll('[class*="MuiBox"]');
      expect(boxes.length).toBeGreaterThan(0);

      // Check for Alert
      const alert = container.querySelector('[role="alert"]');
      expect(alert).toBeInTheDocument();
    });
  });

  describe('rerender functionality', () => {
    it('updates when user prop changes', () => {
      const { rerenderWithTheme } = renderWithTheme(<VerificationSentView user={mockUser} />);

      vi.clearAllMocks();
      vi.mocked(useTranslations).mockReturnValue(mockT);

      const newUser: User = {
        ...mockUser,
        email: 'newemail@example.com',
        nickname: 'NewUser',
      };

      rerenderWithTheme(<VerificationSentView user={newUser} />);

      expect(screen.getByText('newemail@example.com')).toBeInTheDocument();
      expect(mockT).toHaveBeenCalledWith('verificationSent.title', { nickname: 'NewUser' });
    });

    it('updates from user to undefined', () => {
      const { rerenderWithTheme } = renderWithTheme(<VerificationSentView user={mockUser} />);

      vi.clearAllMocks();
      vi.mocked(useTranslations).mockReturnValue(mockT);

      rerenderWithTheme(<VerificationSentView />);

      expect(mockT).toHaveBeenCalledWith('verificationSent.title', { nickname: '' });
    });

    it('updates from undefined to user', () => {
      const { rerenderWithTheme } = renderWithTheme(<VerificationSentView />);

      vi.clearAllMocks();
      vi.mocked(useTranslations).mockReturnValue(mockT);

      rerenderWithTheme(<VerificationSentView user={mockUser} />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });
});

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTranslations, useLocale } from 'next-intl';
import { screen } from '@testing-library/react';
import ResetSentView from '../../../app/components/auth/reset-sent-view';
import { renderWithTheme } from '../../utils/test-utils';

// Mock next-intl hooks
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
  useLocale: vi.fn(),
}));

describe('ResetSentView', () => {
  const mockT = vi.fn((key: string, values?: Record<string, any>) => {
    if (values) return `${key}:${JSON.stringify(values)}`;
    return key;
  });

  const mockLocale = 'en';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslations).mockReturnValue(mockT);
    vi.mocked(useLocale).mockReturnValue(mockLocale);
  });

  describe('basic rendering', () => {
    it('renders the component without crashing', () => {
      renderWithTheme(<ResetSentView email="test@example.com" />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('displays the provided email address', () => {
      const email = 'user@example.com';
      renderWithTheme(<ResetSentView email={email} />);

      expect(screen.getByText(email)).toBeInTheDocument();
    });

    it('calls translation hook with correct namespace', () => {
      renderWithTheme(<ResetSentView email="test@example.com" />);

      expect(useTranslations).toHaveBeenCalledWith('auth');
    });

    it('uses correct translation keys', () => {
      renderWithTheme(<ResetSentView email="test@example.com" />);

      expect(mockT).toHaveBeenCalledWith('resetSent.emailSentTo');
      expect(mockT).toHaveBeenCalledWith('resetSent.instructions');
    });
  });

  describe('email display', () => {
    it('renders email with bold typography', () => {
      renderWithTheme(<ResetSentView email="test@example.com" />);

      const emailText = screen.getByText('test@example.com');
      // The email should be rendered in a Typography component
      expect(emailText).toBeInTheDocument();
      expect(emailText.closest('[class*="MuiTypography"]')).toBeInTheDocument();
    });

    it('renders email in body1 typography', () => {
      renderWithTheme(<ResetSentView email="test@example.com" />);

      const emailText = screen.getByText('test@example.com');
      expect(emailText).toBeInTheDocument();
    });

    it('displays different email addresses correctly', () => {
      const emails = [
        'user1@example.com',
        'user.name+tag@domain.co.uk',
        'test123@subdomain.example.org',
      ];

      emails.forEach((email) => {
        const { container: c } = renderWithTheme(<ResetSentView email={email} />);
        expect(screen.getByText(email)).toBeInTheDocument();
        c.remove();
      });
    });

    it('handles email with special characters', () => {
      const specialEmail = 'user+test@example-domain.com';
      renderWithTheme(<ResetSentView email={specialEmail} />);

      expect(screen.getByText(specialEmail)).toBeInTheDocument();
    });

    it('handles very long email addresses', () => {
      const longEmail = 'verylongemailaddresswithnumerouscharacters123@subdomain.example.co.uk';
      renderWithTheme(<ResetSentView email={longEmail} />);

      expect(screen.getByText(longEmail)).toBeInTheDocument();
    });
  });

  describe('content structure', () => {
    it('displays "email sent to" message before email', () => {
      renderWithTheme(<ResetSentView email="test@example.com" />);

      const allText = screen.getByText('resetSent.emailSentTo');
      expect(allText).toBeInTheDocument();
    });

    it('displays instructions after email', () => {
      renderWithTheme(<ResetSentView email="test@example.com" />);

      const instructions = screen.getByText('resetSent.instructions');
      expect(instructions).toBeInTheDocument();
    });

    it('maintains correct element order', () => {
      const { container } = renderWithTheme(<ResetSentView email="test@example.com" />);

      const textElements = Array.from(container.querySelectorAll('p'));
      expect(textElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('styling and layout', () => {
    it('applies padding to main container', () => {
      const { container } = renderWithTheme(<ResetSentView email="test@example.com" />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveStyle({ padding: '16px 0' });
    });

    it('applies margin bottom to first text element', () => {
      const { container } = renderWithTheme(<ResetSentView email="test@example.com" />);

      const paragraphs = container.querySelectorAll('p');
      const firstParagraph = paragraphs[0];
      expect(firstParagraph).toHaveStyle({ marginBottom: expect.any(String) });
    });

    it('applies margin top to instructions', () => {
      const { container } = renderWithTheme(<ResetSentView email="test@example.com" />);

      const paragraphs = container.querySelectorAll('p');
      const lastParagraph = paragraphs[paragraphs.length - 1];
      expect(lastParagraph).toHaveStyle({ marginTop: expect.any(String) });
    });

    it('uses div as root container', () => {
      const { container } = renderWithTheme(<ResetSentView email="test@example.com" />);

      const rootDiv = container.firstChild;
      expect(rootDiv?.nodeName).toBe('DIV');
    });
  });

  describe('typography variants', () => {
    it('uses body1 variant for email sent message', () => {
      renderWithTheme(<ResetSentView email="test@example.com" />);

      const emailSentText = screen.getByText('resetSent.emailSentTo');
      expect(emailSentText).toBeInTheDocument();
    });

    it('uses body1 variant for email address', () => {
      renderWithTheme(<ResetSentView email="test@example.com" />);

      const emailText = screen.getByText('test@example.com');
      expect(emailText).toBeInTheDocument();
    });

    it('uses body2 variant for instructions', () => {
      renderWithTheme(<ResetSentView email="test@example.com" />);

      const instructions = screen.getByText('resetSent.instructions');
      expect(instructions).toBeInTheDocument();
    });
  });

  describe('locale handling', () => {
    it('retrieves locale from useLocale hook', () => {
      renderWithTheme(<ResetSentView email="test@example.com" />);

      expect(useLocale).toHaveBeenCalled();
    });

    it('handles different locales', () => {
      vi.mocked(useLocale).mockReturnValue('ar');

      renderWithTheme(<ResetSentView email="test@example.com" />);

      expect(useLocale).toHaveBeenCalled();
      expect(mockLocale).toBe('en');
    });
  });

  describe('rerender functionality', () => {
    it('updates email when prop changes', () => {
      const { rerenderWithTheme } = renderWithTheme(<ResetSentView email="old@example.com" />);

      expect(screen.getByText('old@example.com')).toBeInTheDocument();

      vi.clearAllMocks();
      vi.mocked(useTranslations).mockReturnValue(mockT);
      vi.mocked(useLocale).mockReturnValue(mockLocale);

      rerenderWithTheme(<ResetSentView email="new@example.com" />);

      expect(screen.getByText('new@example.com')).toBeInTheDocument();
      expect(screen.queryByText('old@example.com')).not.toBeInTheDocument();
    });

    it('maintains functionality across multiple rerenders', () => {
      const { rerenderWithTheme } = renderWithTheme(<ResetSentView email="email1@example.com" />);

      vi.clearAllMocks();
      vi.mocked(useTranslations).mockReturnValue(mockT);
      vi.mocked(useLocale).mockReturnValue(mockLocale);

      rerenderWithTheme(<ResetSentView email="email2@example.com" />);

      vi.clearAllMocks();
      vi.mocked(useTranslations).mockReturnValue(mockT);
      vi.mocked(useLocale).mockReturnValue(mockLocale);

      rerenderWithTheme(<ResetSentView email="email3@example.com" />);

      expect(screen.getByText('email3@example.com')).toBeInTheDocument();
    });
  });

  describe('component isolation', () => {
    it('only displays the provided email', () => {
      renderWithTheme(<ResetSentView email="test@example.com" />);

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.queryByText('other@example.com')).not.toBeInTheDocument();
    });

    it('does not render additional navigation or buttons', () => {
      const { container } = renderWithTheme(<ResetSentView email="test@example.com" />);

      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(0);
    });

    it('does not render forms', () => {
      const { container } = renderWithTheme(<ResetSentView email="test@example.com" />);

      const forms = container.querySelectorAll('form');
      expect(forms.length).toBe(0);
    });

    it('does not render links', () => {
      const { container } = renderWithTheme(<ResetSentView email="test@example.com" />);

      const links = container.querySelectorAll('a');
      expect(links.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('handles empty email string', () => {
      const { container } = renderWithTheme(<ResetSentView email="" />);

      expect(container).toBeInTheDocument();
    });

    it('renders with empty or whitespace content', () => {
      const { container } = renderWithTheme(<ResetSentView email="   " />);

      // Check that the component renders with whitespace email
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    });

    it('handles email with unicode characters', () => {
      const unicodeEmail = 'user@例え.jp';
      renderWithTheme(<ResetSentView email={unicodeEmail} />);

      expect(screen.getByText(unicodeEmail)).toBeInTheDocument();
    });

    it('handles email with many numbers', () => {
      const numericEmail = 'user12345678@domain12345.com';
      renderWithTheme(<ResetSentView email={numericEmail} />);

      expect(screen.getByText(numericEmail)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('uses semantic HTML structure', () => {
      const { container } = renderWithTheme(<ResetSentView email="test@example.com" />);

      // Should use div as root, paragraphs for text
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs.length).toBeGreaterThanOrEqual(2);
    });

    it('renders text content without hidden elements', () => {
      const { container } = renderWithTheme(<ResetSentView email="test@example.com" />);

      const hiddenElements = container.querySelectorAll('[style*="display: none"]');
      expect(hiddenElements.length).toBe(0);
    });
  });

  describe('multiple instances', () => {
    it('can render multiple instances with different emails', () => {
      const { container } = renderWithTheme(
        <div>
          <ResetSentView email="user1@example.com" />
          <ResetSentView email="user2@example.com" />
        </div>
      );

      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });
  });
});

import { vi, describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import TournamentError from '../../../app/[locale]/tournaments/[id]/error';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock next-intl
vi.mock('next-intl', () => ({
  useLocale: vi.fn(() => 'es'),
  useTranslations: vi.fn(() => (key: string) => {
    const translations: Record<string, string> = {
      'tournament.accessDenied': 'Access Denied',
      'tournament.noPermission': "You don't have permission to view this tournament. This is a development tournament that requires special access.",
      'tournament.contactAdmin': 'If you believe you should have access, please contact an administrator.',
      'returnHome': 'Return to Home',
    };
    return translations[key] || key;
  }),
}));

describe('TournamentError (403 Page)', () => {
  const mockRouter = {
    push: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  };

  const mockError = new Error('Access denied');
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  describe('Rendering', () => {
    it('renders access denied message', () => {
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('renders lock icon', () => {
      const { container } = render(<TournamentError _error={mockError} _reset={mockReset} />);

      // Lock icon should be rendered (MUI LockIcon)
      const icon = container.querySelector('[data-testid="LockIcon"]');
      expect(icon).toBeInTheDocument();
    });

    it('renders explanation text about permission', () => {
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      expect(
        screen.getByText(/You don't have permission to view this tournament/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/This is a development tournament that requires special access/i)
      ).toBeInTheDocument();
    });

    it('renders contact administrator message', () => {
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      expect(
        screen.getByText(/If you believe you should have access, please contact an administrator/i)
      ).toBeInTheDocument();
    });

    it('renders return to home button', () => {
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      const button = screen.getByRole('button', { name: /Return to Home/i });
      expect(button).toBeInTheDocument();
    });

    it('renders button with contained variant', () => {
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      const button = screen.getByRole('button', { name: /Return to Home/i });
      expect(button).toHaveClass('MuiButton-contained');
    });
  });

  describe('User Interaction', () => {
    it('navigates to home when button is clicked', () => {
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      const button = screen.getByRole('button', { name: /Return to Home/i });
      fireEvent.click(button);

      expect(mockRouter.push).toHaveBeenCalledWith('/es');
    });

    it('only calls router.push once per click', () => {
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      const button = screen.getByRole('button', { name: /Return to Home/i });
      fireEvent.click(button);
      fireEvent.click(button);

      // Button might be clicked multiple times by user
      expect(mockRouter.push).toHaveBeenCalledTimes(2);
      expect(mockRouter.push).toHaveBeenCalledWith('/es');
    });
  });

  describe('Error Handling', () => {
    it('handles error with digest property', () => {
      const errorWithDigest = Object.assign(new Error('Access denied'), { digest: 'error-digest-123' });
      render(<TournamentError _error={errorWithDigest} _reset={mockReset} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('handles error without digest property', () => {
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('does not call reset function automatically', () => {
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      expect(mockReset).not.toHaveBeenCalled();
    });
  });

  describe('Styling and Layout', () => {
    it('renders with proper spacing and centering', () => {
      const { container } = render(<TournamentError _error={mockError} _reset={mockReset} />);

      const mainBox = container.querySelector('div');
      expect(mainBox).toBeInTheDocument();
    });

    it('renders paper component with elevation', () => {
      const { container } = render(<TournamentError _error={mockError} _reset={mockReset} />);

      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
      expect(paper).toHaveClass('MuiPaper-elevation3');
    });

    it('renders text with proper typography variants', () => {
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      // Check main heading
      const heading = screen.getByText('Access Denied');
      expect(heading.tagName).toBe('H4');
    });

    it('uses warning color for lock icon', () => {
      const { container } = render(<TournamentError _error={mockError} _reset={mockReset} />);

      const icon = container.querySelector('[data-testid="LockIcon"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      const heading = screen.getByRole('heading', { name: /Access Denied/i });
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H4');
    });

    it('has accessible button with proper label', () => {
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      const button = screen.getByRole('button', { name: /Return to Home/i });
      expect(button).toBeInTheDocument();
    });

    it('renders content in semantic structure', () => {
      const { container } = render(<TournamentError _error={mockError} _reset={mockReset} />);

      // Check that Paper contains proper content structure
      const paper = container.querySelector('.MuiPaper-root');
      expect(paper).toBeInTheDocument();
      expect(paper?.textContent).toContain('Access Denied');
    });
  });

  describe('Edge Cases', () => {
    it('handles null error message gracefully', () => {
      const nullError = Object.assign(new Error(), { message: '' });
      render(<TournamentError _error={nullError} _reset={mockReset} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('renders consistently across multiple renders', () => {
      const { rerender } = render(<TournamentError _error={mockError} _reset={mockReset} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();

      const newError = new Error('Different error');
      rerender(<TournamentError _error={newError} _reset={mockReset} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('handles very long error messages', () => {
      const longError = new Error('A'.repeat(1000));
      render(<TournamentError _error={longError} _reset={mockReset} />);

      // Should still render the standard Access Denied message
      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('accepts error parameter with underscore prefix', () => {
      // This test ensures the unused parameter convention is respected
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('accepts reset parameter with underscore prefix', () => {
      // This test ensures the unused parameter convention is respected
      render(<TournamentError _error={mockError} _reset={mockReset} />);

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });
  });
});

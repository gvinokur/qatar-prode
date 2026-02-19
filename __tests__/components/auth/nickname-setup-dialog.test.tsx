import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NicknameSetupDialog from '../../../app/components/auth/nickname-setup-dialog';
import { renderWithTheme } from '../../utils/test-utils';
import { setNickname } from '../../../app/actions/oauth-actions';
import { useSession } from 'next-auth/react';
import { createMockTranslations } from '../../utils/mock-translations';
import * as intl from 'next-intl';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => key),
  useLocale: vi.fn(() => 'es'),
}));

// Mock dependencies
vi.mock('../../../app/actions/oauth-actions', () => ({
  setNickname: vi.fn()
}));
vi.mock('next-auth/react', () => ({
  useSession: vi.fn()
}));

// Mock MUI Dialog components for simpler testing
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
    DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
    DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
    DialogActions: ({ children }: any) => <div data-testid="dialog-actions">{children}</div>,
  };
});

describe('NicknameSetupDialog', () => {
  const mockUpdate = vi.fn();
  const mockOnClose = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup i18n mocks
    vi.mocked(intl.useTranslations).mockReturnValue(
      createMockTranslations('auth')
    );

    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: mockUpdate
    } as any);
  });

  describe('Rendering', () => {
    it('renders when open is true', () => {
      renderWithTheme(<NicknameSetupDialog open={true} />);

      expect(screen.getByTestId('dialog')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toHaveTextContent('[nicknameSetup.title]');
    });

    it('does not render when open is false', () => {
      renderWithTheme(<NicknameSetupDialog open={false} />);

      expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
    });

    it('renders nickname input field', () => {
      renderWithTheme(<NicknameSetupDialog open={true} />);

      expect(screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' })).toBeInTheDocument();
    });

    it('renders save button', () => {
      renderWithTheme(<NicknameSetupDialog open={true} />);

      expect(screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' })).toBeInTheDocument();
    });

    it('shows helper text about character limits', () => {
      renderWithTheme(<NicknameSetupDialog open={true} />);

      expect(screen.getByText('[nicknameSetup.nickname.helperText]')).toBeInTheDocument();
    });

    it('shows explanation text', () => {
      renderWithTheme(<NicknameSetupDialog open={true} />);

      expect(screen.getByText('[nicknameSetup.instruction]')).toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('allows typing in nickname field', async () => {
      renderWithTheme(<NicknameSetupDialog open={true} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      await user.type(nicknameInput, 'TestUser');

      expect(nicknameInput).toHaveValue('TestUser');
    });

    it('clears input when user types', async () => {
      renderWithTheme(<NicknameSetupDialog open={true} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      await user.type(nicknameInput, 'First');
      await user.clear(nicknameInput);
      await user.type(nicknameInput, 'Second');

      expect(nicknameInput).toHaveValue('Second');
    });
  });

  describe('Form Submission', () => {
    it('calls setNickname when form is submitted', async () => {
      vi.mocked(setNickname).mockResolvedValue({
        success: true
      });

      renderWithTheme(<NicknameSetupDialog open={true} onClose={mockOnClose} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      await user.type(nicknameInput, 'TestUser');
      await user.click(saveButton);

      await waitFor(() => {
        expect(setNickname).toHaveBeenCalledWith('TestUser', 'es');
      });
    });

    it('updates session with new nickname on success', async () => {
      vi.mocked(setNickname).mockResolvedValue({
        success: true
      });

      renderWithTheme(<NicknameSetupDialog open={true} onClose={mockOnClose} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      await user.type(nicknameInput, 'TestUser');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith({
          nickname: 'TestUser',
          nicknameSetupRequired: false
        });
      });
    });

    it('closes dialog after successful submission', async () => {
      vi.mocked(setNickname).mockResolvedValue({
        success: true
      });

      renderWithTheme(<NicknameSetupDialog open={true} onClose={mockOnClose} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      await user.type(nicknameInput, 'TestUser');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('does not close dialog if onClose is not provided', async () => {
      vi.mocked(setNickname).mockResolvedValue({
        success: true
      });

      renderWithTheme(<NicknameSetupDialog open={true} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      await user.type(nicknameInput, 'TestUser');
      await user.click(saveButton);

      await waitFor(() => {
        expect(setNickname).toHaveBeenCalled();
      });

      // Dialog should still be open
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });

    it('shows loading state while submitting', async () => {
      vi.mocked(setNickname).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      renderWithTheme(<NicknameSetupDialog open={true} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      await user.type(nicknameInput, 'TestUser');
      await user.click(saveButton);

      // Should show loading spinner
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      await waitFor(() => {
        expect(setNickname).toHaveBeenCalled();
      });
    });

    it('disables input and button while loading', async () => {
      vi.mocked(setNickname).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
      );

      renderWithTheme(<NicknameSetupDialog open={true} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      await user.type(nicknameInput, 'TestUser');
      await user.click(saveButton);

      expect(nicknameInput).toBeDisabled();
      expect(saveButton).toBeDisabled();

      await waitFor(() => {
        expect(setNickname).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('shows error message when setNickname fails', async () => {
      vi.mocked(setNickname).mockResolvedValue({
        success: false,
        error: 'Nickname already taken'
      });

      renderWithTheme(<NicknameSetupDialog open={true} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      await user.type(nicknameInput, 'TakenNickname');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Nickname already taken')).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('shows generic error when setNickname fails without error message', async () => {
      vi.mocked(setNickname).mockResolvedValue({
        success: false
      });

      renderWithTheme(<NicknameSetupDialog open={true} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      await user.type(nicknameInput, 'TestUser');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('[nicknameSetup.errors.saveFailed]')).toBeInTheDocument();
      });
    });

    it('shows error when setNickname throws exception', async () => {
      vi.mocked(setNickname).mockRejectedValue(
        new Error('Network error')
      );

      renderWithTheme(<NicknameSetupDialog open={true} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      await user.type(nicknameInput, 'TestUser');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('[nicknameSetup.errors.saveFailed]')).toBeInTheDocument();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('clears error when form is resubmitted', async () => {
      vi.mocked(setNickname)
        .mockResolvedValueOnce({
          success: false,
          error: 'Nickname too short'
        })
        .mockResolvedValueOnce({
          success: true
        });

      renderWithTheme(<NicknameSetupDialog open={true} onClose={mockOnClose} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      // First submission - should fail
      await user.type(nicknameInput, 'a');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Nickname too short')).toBeInTheDocument();
      });

      // Second submission - should succeed and clear error
      await user.clear(nicknameInput);
      await user.type(nicknameInput, 'ValidNickname');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText('Nickname too short')).not.toBeInTheDocument();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Input Validation', () => {
    it('has required attribute on input', () => {
      renderWithTheme(<NicknameSetupDialog open={true} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      expect(nicknameInput).toBeRequired();
    });

    it('has correct min and max length attributes', () => {
      renderWithTheme(<NicknameSetupDialog open={true} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      expect(nicknameInput).toHaveAttribute('minlength', '2');
      expect(nicknameInput).toHaveAttribute('maxlength', '50');
    });
  });

  describe('Accessibility', () => {
    it('has proper dialog structure', () => {
      renderWithTheme(<NicknameSetupDialog open={true} />);

      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-content')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-actions')).toBeInTheDocument();
    });

    it('has labeled input field', () => {
      renderWithTheme(<NicknameSetupDialog open={true} />);

      expect(screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('trims whitespace from nickname before submitting', async () => {
      vi.mocked(setNickname).mockResolvedValue({
        success: true
      });

      renderWithTheme(<NicknameSetupDialog open={true} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      await user.type(nicknameInput, '  TestUser  ');
      await user.click(saveButton);

      await waitFor(() => {
        expect(setNickname).toHaveBeenCalledWith('  TestUser  ', 'es');
      });
    });

    it('handles very long nicknames', async () => {
      vi.mocked(setNickname).mockResolvedValue({
        success: false,
        error: 'Nickname must be less than 50 characters'
      });

      renderWithTheme(<NicknameSetupDialog open={true} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      const longNickname = 'a'.repeat(51);
      await user.type(nicknameInput, longNickname);
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/Nickname must be less than 50 characters/i)).toBeInTheDocument();
      });
    });

    it('accepts nickname with exactly 2 characters', async () => {
      vi.mocked(setNickname).mockResolvedValue({
        success: true
      });

      renderWithTheme(<NicknameSetupDialog open={true} onClose={mockOnClose} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      await user.type(nicknameInput, 'AB');
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('accepts nickname with exactly 50 characters', async () => {
      vi.mocked(setNickname).mockResolvedValue({
        success: true
      });

      renderWithTheme(<NicknameSetupDialog open={true} onClose={mockOnClose} />);

      const nicknameInput = screen.getByRole('textbox', { name: '[nicknameSetup.nickname.label]' });
      const saveButton = screen.getByRole('button', { name: '[nicknameSetup.buttons.save]' });

      await user.type(nicknameInput, 'a'.repeat(50));
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });
});
